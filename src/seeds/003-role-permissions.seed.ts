import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@modules/permission/enums/policy-effect.enum';
import { Policy } from '@modules/permission/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';
import { PolicyOperator } from '@/modules/permission/enums/policy-operator.enum';
import { PolicyRule } from '@/modules/permission/interfaces/policy-condition.interface';

export class RolePermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Array<{ key: PermissionKey; description: string }> = [
      { key: 'role:read', description: 'Read roles' },
      { key: 'role:list', description: 'List roles' },
      { key: 'role:create', description: 'Create roles' },
      { key: 'role:update', description: 'Update roles' },
      { key: 'role:delete', description: 'Delete roles' },
      { key: 'role:assign', description: 'Assign roles to users' },
      { key: 'role:*', description: 'All role actions' },
      { key: 'permission:read', description: 'Read permissions' },
      { key: 'permission:list', description: 'List permissions' },
      { key: 'permission:create', description: 'Create permissions' },
      { key: 'permission:update', description: 'Update permissions' },
      { key: 'permission:delete', description: 'Delete permissions' },
      { key: 'permission:assign', description: 'Assign permissions to roles' },
      { key: 'permission:*', description: 'All permission actions' },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        console.log(
          `[RolePermissionsSeed] Permission "${perm.key}" already exists, skipping`,
        );
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[RolePermissionsSeed] Created permission: ${perm.key}`);
    }

    const permMap = new Map(savedPermissions.map((p) => [p.key, p]));

    const roleMap = new Map<string, Role>();
    const requiredRoles = [
      'admin',
      'manager',
      'staff',
      'veterinarian',
      'volunteer',
      'member',
    ];

    for (const name of requiredRoles) {
      const role = await roleRepo.findOne({ where: { name } });
      if (role) roleMap.set(name, role);
    }

    const missingRoles = requiredRoles.filter((name) => !roleMap.has(name));

    if (missingRoles.length > 0) {
      throw new Error(
        `[UserPermissionsSeed] Missing required roles: ${missingRoles.join(', ')}. Please run 001-roles.seed.ts first.`,
      );
    }

    const staffAndMagagerCommonPermission: PermissionKey[] = [
      'role:read',
      'role:list',
      'permission:read',
      'permission:list',
    ];

    const roleAssignPolicyConditions: PolicyRule[] = [
      {
        field: '$resources.role.id',
        operator: PolicyOperator.EQUALS,
        value: roleMap.get('veterinarian')!.id,
      },
      {
        field: '$resources.role.id',
        operator: PolicyOperator.EQUALS,
        value: roleMap.get('volunteer')!.id,
      },
      {
        field: '$resources.role.id',
        operator: PolicyOperator.EQUALS,
        value: roleMap.get('member')!.id,
      },
    ];

    const staffPolicies: Partial<Policy>[] = [
      {
        roleId: roleMap.get('staff')!.id,
        permissionId: permMap.get('role:assign')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 50,
        conditions: {
          operator: 'OR',
          rules: roleAssignPolicyConditions,
        },
      },
    ];

    const managerPolicies: Partial<Policy>[] = [
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('role:assign')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
        conditions: {
          operator: 'OR',
          rules: [
            {
              field: '$resources.role.id',
              operator: PolicyOperator.EQUALS,
              value: roleMap.get('staff')!.id,
            },
            ...roleAssignPolicyConditions,
          ],
        },
      },
    ];

    const policies: Partial<Policy>[] = [
      ...staffAndMagagerCommonPermission.map((perm) => ({
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get(perm)!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      })),
      ...staffAndMagagerCommonPermission.map((perm) => ({
        roleId: roleMap.get('staff')!.id,
        permissionId: permMap.get(perm)!.id,
        effect: PolicyEffect.ALLOW,
        priority: 50,
      })),
      ...managerPolicies,
      ...staffPolicies,
    ];

    for (const policyData of policies) {
      const existing = await policyRepo.findOne({
        where: {
          roleId: policyData.roleId,
          permissionId: policyData.permissionId,
        },
      });

      if (existing) {
        console.log(`[RolePermissionsSeed] Policy already exists, skipping`);
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[RolePermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }
  }
}
