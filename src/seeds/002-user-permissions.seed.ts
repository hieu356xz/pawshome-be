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

    const permissions: Partial<Permission>[] = [
      {
        key: '*',
        description: 'All permissions (wildcard)',
        assignable: false,
      },
      { key: 'user:create', description: 'Create users' },
      { key: 'user:read', description: 'Read users' },
      { key: 'user:update', description: 'Update users' },
      { key: 'user:delete', description: 'Delete users' },
      { key: 'user:list', description: 'List users' },
      { key: 'user:*', description: 'All user actions', assignable: false },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        await permissionRepo.update({ key: perm.key }, perm);
        console.log(`[UserPermissionsSeed] Updated permission: ${perm.key}`);
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

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'user:list',
      ],
      manager: [
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'user:list',
      ],
      staff: ['user:read', 'user:list'],
      veterinarian: ['user:read', 'user:update'],
      member: ['user:read', 'user:update'],
      volunteer: ['user:read', 'user:update'],
    };

    for (const [roleName, permKeys] of Object.entries(rolePermissionMap)) {
      const role = roleMap.get(roleName)!;
      const existingRole = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['permissions'],
      });

      const existingKeys = new Set(
        existingRole?.permissions?.map((p) => p.key) ?? [],
      );

      const newPerms = permKeys
        .filter((key) => !existingKeys.has(key))
        .map((key) => permMap.get(key)!)
        .filter(Boolean);

      if (newPerms.length > 0) {
        existingRole!.permissions = [
          ...(existingRole?.permissions ?? []),
          ...newPerms,
        ];
        await roleRepo.save(existingRole!);
        console.log(
          `[UserPermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[UserPermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
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
        await policyRepo.update(
          { roleId: policyData.roleId, permissionId: policyData.permissionId },
          policyData,
        );
        console.log(
          `[UserPermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
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
