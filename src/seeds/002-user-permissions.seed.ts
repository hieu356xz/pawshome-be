import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@modules/permission/enums/policy-effect.enum';
import { PolicyOperator } from '@modules/permission/enums/policy-operator.enum';
import { Policy } from '@modules/permission/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';
import { PolicyConditions } from '@/modules/permission/interfaces/policy-condition.interface';

const createOwnCondition = (resource: string): PolicyConditions => ({
  operator: 'AND',
  rules: [
    {
      field: `$resources.${resource}.id`,
      operator: PolicyOperator.EQUALS,
      value: '$user.id',
    },
  ],
});

const createOwnPolicies = (
  roleId: string,
  permissionId: string,
  priority: number,
): Partial<Policy>[] => [
  {
    roleId,
    permissionId,
    effect: PolicyEffect.ALLOW,
    priority,
    conditions: createOwnCondition('user'),
  },
];

export class UserPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Array<{ key: PermissionKey; description: string }> = [
      { key: '*', description: 'All permissions (wildcard)' },
      { key: 'user:create', description: 'Create users' },
      { key: 'user:read', description: 'Read users' },
      { key: 'user:update', description: 'Update users' },
      { key: 'user:delete', description: 'Soft delete users' },
      { key: 'user:list', description: 'List users' },
      { key: 'user:*', description: 'All user actions' },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        console.log(
          `[UserPermissionsSeed] Permission "${perm.key}" already exists, skipping`,
        );
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[UserPermissionsSeed] Created permission: ${perm.key}`);
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

    const policies: Partial<Policy>[] = [
      {
        roleId: roleMap.get('admin')!.id,
        permissionId: permMap.get('*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 200,
      },
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('user:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      {
        roleId: roleMap.get('staff')!.id,
        permissionId: permMap.get('user:read')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 50,
      },
      {
        roleId: roleMap.get('staff')!.id,
        permissionId: permMap.get('user:list')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 50,
      },
      ...createOwnPolicies(
        roleMap.get('veterinarian')!.id,
        permMap.get('user:*')!.id,
        20,
      ),
      ...createOwnPolicies(
        roleMap.get('member')!.id,
        permMap.get('user:*')!.id,
        20,
      ),
      ...createOwnPolicies(
        roleMap.get('volunteer')!.id,
        permMap.get('user:*')!.id,
        20,
      ),
    ];

    for (const policyData of policies) {
      const existing = await policyRepo.findOne({
        where: {
          roleId: policyData.roleId,
          permissionId: policyData.permissionId,
        },
      });

      if (existing) {
        console.log(`[UserPermissionsSeed] Policy already exists, skipping`);
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[UserPermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }
  }
}
