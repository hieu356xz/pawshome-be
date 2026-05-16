import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  Like,
  ILike,
} from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Policy } from './entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { PolicyEffect } from './enums/policy-effect.enum';
import { PolicyOperator } from './enums/policy-operator.enum';
import type {
  PolicyConditions,
  PolicyRule,
  PolicyEvaluationContext,
} from './interfaces/policy-condition.interface';
import { PermissionKey } from '../permission/enums/permission-key.enum';
import { PolicyQueryDto } from './dto/policy-query.dto';
import type {
  PaginatedResponse,
  ResponseMeta,
} from '@/common/interfaces/response.interface';

const MAX_CONDITION_DEPTH = 3;

interface PolicyCheckResult {
  allowed: boolean;
  matchedPolicy?: Policy;
  reason?: string;
}

@Injectable()
export class PolicyService {
  private readonly CACHE_TTL = 600000;
  private readonly cacheKeyPrefix = 'policies:role:';

  constructor(
    @InjectRepository(Policy)
    private policyRepo: Repository<Policy>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getPoliciesForRoles(roleNames: string[]): Promise<Policy[]> {
    if (!roleNames || roleNames.length === 0) {
      return [];
    }

    const allPolicies: Policy[] = [];

    for (const roleName of roleNames) {
      const cacheKey = `${this.cacheKeyPrefix}${roleName}`;
      let policies = await this.cacheManager.get<Policy[]>(cacheKey);

      if (!policies) {
        policies = await this.policyRepo.find({
          where: { role: { name: roleName } },
          relations: ['permission'],
        });
        await this.cacheManager.set(cacheKey, policies, this.CACHE_TTL);
      }

      allPolicies.push(...policies);
    }

    return allPolicies;
  }

  async checkAccess(
    requiredPermissions: PermissionKey | PermissionKey[],
    context: PolicyEvaluationContext,
  ): Promise<PolicyCheckResult> {
    const roles = context.user.roles || [];
    const policies = await this.getPoliciesForRoles(roles);

    // console.log('Evaluating policies for user:', context.user.id);
    // console.log('User Roles:', roles);
    // console.log('Required Permissions:', requiredPermissions);
    // console.log('Loaded Policies:', JSON.stringify(policies, null, 2));

    // Normalize to array
    const permissionList = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    // Find all matching policies
    const matchingPolicies = policies.filter((policy) =>
      permissionList.some((perm) =>
        this.matchesPermissionKey(policy.permission.key, perm),
      ),
    );

    if (matchingPolicies.length === 0) {
      Logger.warn(
        `No policy found for roles: [${roles.join(', ')}] and permissions: [${permissionList.join(', ')}]`,
      );
      return { allowed: false, reason: 'NO_POLICY' };
    }

    // Policies with higher (larger) priority evaluate first
    matchingPolicies.sort((a, b) => b.priority - a.priority);

    for (const policy of matchingPolicies) {
      const matches = this.evaluatePolicy(policy, context);

      if (policy.effect === PolicyEffect.DENY && matches) {
        return { allowed: false, matchedPolicy: policy, reason: 'DENY' };
      }

      if (policy.effect === PolicyEffect.ALLOW && matches) {
        return { allowed: true, matchedPolicy: policy };
      }
    }

    return { allowed: false, reason: 'NO_MATCH' };
  }

  private matchesPermissionKey(
    policyKey: string,
    requiredKey: string,
  ): boolean {
    if (policyKey === requiredKey) {
      return true;
    }

    if (policyKey.endsWith(':*')) {
      const resource = policyKey.slice(0, -2);
      return requiredKey.startsWith(`${resource}:`);
    }

    if (policyKey === '*') {
      return true;
    }

    return false;
  }

  private evaluatePolicy(
    policy: Policy,
    context: PolicyEvaluationContext,
  ): boolean {
    if (!policy.conditions) {
      return true;
    }

    return this.evaluateConditions(policy.conditions, context, 0);
  }

  private evaluateConditions(
    conditions: PolicyConditions,
    context: PolicyEvaluationContext,
    depth: number,
  ): boolean {
    if (depth > MAX_CONDITION_DEPTH) {
      return false;
    }

    const results = conditions.rules.map((rule) =>
      'operator' in rule
        ? this.evaluateRule(rule, context)
        : this.evaluateConditions(rule, context, depth + 1),
    );

    if (conditions.operator === 'AND') {
      return results.every((r) => r);
    }

    return results.some((r) => r);
  }

  private evaluateRule(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const resolvedValue = this.resolveValue(rule.value, context);
    const fieldValue = this.resolveField(rule.field, context);

    switch (rule.operator) {
      case PolicyOperator.EQUALS:
        return fieldValue === resolvedValue;

      case PolicyOperator.NOT_EQUALS:
        return fieldValue !== resolvedValue;

      case PolicyOperator.IN:
        if (Array.isArray(resolvedValue)) {
          return resolvedValue.includes(fieldValue);
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(resolvedValue);
        }
        return false;

      case PolicyOperator.CONTAINS:
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(resolvedValue);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(resolvedValue as string);
        }
        return false;

      case PolicyOperator.GT:
        return Number(fieldValue) > Number(resolvedValue);

      case PolicyOperator.GTE:
        return Number(fieldValue) >= Number(resolvedValue);

      case PolicyOperator.LT:
        return Number(fieldValue) < Number(resolvedValue);

      case PolicyOperator.LTE:
        return Number(fieldValue) <= Number(resolvedValue);

      case PolicyOperator.EXISTS:
        return resolvedValue
          ? fieldValue !== undefined && fieldValue !== null
          : !fieldValue;

      default:
        return false;
    }
  }

  private resolveField(
    field: string,
    context: PolicyEvaluationContext,
  ): unknown {
    if (!field.startsWith('$')) {
      return undefined;
    }

    const [source, ...pathParts] = field.slice(1).split('.');
    const path = pathParts.join('.');

    switch (source) {
      case 'user':
        return this.getNestedValue(context.user, path);
      case 'env':
        return this.getNestedValue(context.env, path);
      case 'resources':
        return this.getNestedValue(context.resources, path);
      default:
        return undefined;
    }
  }

  private resolveValue(
    value: unknown,
    context: PolicyEvaluationContext,
  ): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    if (!value.startsWith('$')) {
      if (value.startsWith('$date.')) {
        return this.resolveDateFunction(value);
      }
      return value;
    }

    if (value.startsWith('$resources.')) {
      const path = value.slice('$resources.'.length);
      return this.getNestedValue(context.resources, path);
    }

    return this.resolveField(value, context);
  }

  private resolveDateFunction(value: string): Date | null {
    const match = value.match(/^\$date\.add\((-?\d+)d\)$/);
    if (match) {
      const days = parseInt(match[1], 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    }
    return null;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object' || !path) {
      return obj;
    }

    return path.split('.').reduce((current: unknown, key: string) => {
      if (current === undefined || current === null) {
        return undefined;
      }
      return (current as Record<string, unknown>)[key];
    }, obj);
  }

  async invalidateRolePolicies(roleName: string): Promise<void> {
    const cacheKey = `${this.cacheKeyPrefix}${roleName}`;
    await this.cacheManager.del(cacheKey);
  }

  async invalidateRolesPolicies(roleNames: string[]): Promise<void> {
    await Promise.all(
      roleNames.map((name) => this.invalidateRolePolicies(name)),
    );
  }

  async findAll(query: PolicyQueryDto): Promise<PaginatedResponse<Policy>> {
    const { page, limit, roleName, permissionKey, effect, sortBy, sortOrder } =
      query;

    const where: FindOptionsWhere<Policy> = {};

    if (effect) {
      where.effect = effect;
    }

    let roleCondition: FindOptionsWhere<Role> | undefined;
    if (roleName) {
      roleCondition = { name: Like(`%${roleName}%`) };
    }

    let permissionCondition: FindOptionsWhere<Permission> | undefined;
    if (permissionKey) {
      const keySearch: unknown = ILike(`%${permissionKey}%`);
      permissionCondition = { key: keySearch as PermissionKey };
    }

    if (roleCondition) {
      where.role = roleCondition;
    }
    if (permissionCondition) {
      where.permission = permissionCondition;
    }

    const order: FindOptionsOrder<Policy> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'ASC';
    }

    const [results, total] = await this.policyRepo.findAndCount({
      where,
      order,
      relations: ['role', 'permission'],
      take: limit,
      skip: (page - 1) * limit,
    });

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }

  async findOne(roleId: string, permissionId: string) {
    const policy = await this.policyRepo.findOne({
      where: { roleId, permissionId },
      relations: ['role', 'permission'],
    });
    if (!policy) {
      throw new NotFoundException(
        `Policy #${roleId}/#${permissionId} does not exist`,
      );
    }
    return policy;
  }

  async findByRoleAndPermission(roleId: string, permissionId: string) {
    return this.policyRepo.findOne({
      where: { roleId, permissionId },
      relations: ['role', 'permission'],
    });
  }

  async create(data: Partial<Policy>) {
    const policy = this.policyRepo.create(data);
    return this.policyRepo.save(policy);
  }

  async updatePolicy(
    roleId: string,
    permissionId: string,
    data: Partial<Policy>,
  ) {
    await this.policyRepo.update({ roleId, permissionId }, data);
    return this.findByRoleAndPermission(roleId, permissionId);
  }

  async deletePolicy(roleId: string, permissionId: string) {
    const result = await this.policyRepo.delete({ roleId, permissionId });
    return !!result.affected;
  }

  async assignPolicy(
    roleId: string,
    permissionId: string,
    data: Partial<Policy>,
  ) {
    const existing = await this.findByRoleAndPermission(roleId, permissionId);

    if (existing) {
      return this.updatePolicy(roleId, permissionId, data);
    }

    return this.create({ roleId, permissionId, ...data });
  }

  async extractResourceTypesFromConditions(
    requiredPermissions: PermissionKey | PermissionKey[],
    roles: string[],
  ): Promise<string[]> {
    const permissionList = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const allPolicies = await this.getPoliciesForRoles(roles);

    const matchingPolicies = allPolicies.filter((policy) =>
      permissionList.some((perm) =>
        this.matchesPermissionKey(policy.permission.key, perm),
      ),
    );

    const resourceTypes = new Set<string>();

    for (const policy of matchingPolicies) {
      if (policy.conditions) {
        this.extractFromConditions(policy.conditions, resourceTypes);
      }
    }

    return Array.from(resourceTypes);
  }

  private extractFromConditions(
    conditions: PolicyConditions,
    resourceTypes: Set<string>,
  ): void {
    for (const rule of conditions.rules) {
      if ('operator' in rule) {
        const field = rule.field;
        if (field.startsWith('$resources.')) {
          const match = field.match(/^\$resources\.(\w+)/);
          if (match) {
            resourceTypes.add(match[1]);
          } else {
            Logger.warn(`Cannot extract resource type from field: ${field}`);
          }
        }
      } else {
        this.extractFromConditions(rule, resourceTypes);
      }
    }
  }
}
