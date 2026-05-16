import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@/modules/policy/enums/policy-effect.enum';
import { Policy } from '@/modules/policy/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';
import { PolicyOperator } from '@/modules/policy/enums/policy-operator.enum';

export class RolePermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'role:read', description: 'Read roles' },
      { key: 'role:list', description: 'List roles' },
      { key: 'role:create', description: 'Create roles' },
      { key: 'role:update', description: 'Update roles' },
      { key: 'role:delete', description: 'Delete roles' },
      { key: 'role:assign', description: 'Assign roles to users' },
      { key: 'role:*', description: 'All role actions', assignable: false },
      { key: 'permission:read', description: 'Read permissions' },
      { key: 'permission:list', description: 'List permissions' },
      { key: 'permission:create', description: 'Create permissions' },
      { key: 'permission:update', description: 'Update permissions' },
      { key: 'permission:delete', description: 'Delete permissions' },
      { key: 'permission:assign', description: 'Assign permissions to roles' },
      {
        key: 'permission:*',
        description: 'All permission actions',
        assignable: false,
      },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        await permissionRepo.update({ key: perm.key }, perm);
        console.log(`[RolePermissionsSeed] Updated permission: ${perm.key}`);
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

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'role:read',
        'role:list',
        'role:create',
        'role:update',
        'role:delete',
        'role:assign',
        'permission:read',
        'permission:list',
        'permission:create',
        'permission:update',
        'permission:delete',
        'permission:assign',
      ],
      manager: [
        'role:read',
        'role:list',
        'role:assign',
        'permission:read',
        'permission:list',
      ],
      staff: [
        'role:read',
        'role:list',
        'role:assign',
        'permission:read',
        'permission:list',
      ],
      veterinarian: [],
      volunteer: [],
      member: [],
    };

    for (const [roleName, permKeys] of Object.entries(rolePermissionMap)) {
      if (permKeys.length === 0) continue;

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
          `[RolePermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[RolePermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
    }

    const staffAndMagagerCommonPermission: PermissionKey[] = [
      'role:read',
      'role:list',
      'permission:read',
      'permission:list',
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
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('role:assign')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
        conditions: {
          operator: 'AND',
          rules: [
            {
              field: '$resources.role.id',
              operator: PolicyOperator.IN,
              value: [
                roleMap.get('staff')!.id,
                roleMap.get('veterinarian')!.id,
                roleMap.get('volunteer')!.id,
                roleMap.get('member')!.id,
              ],
            },
          ],
        },
      },
      {
        roleId: roleMap.get('staff')!.id,
        permissionId: permMap.get('role:assign')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 50,
        conditions: {
          operator: 'OR',
          rules: [
            {
              field: '$resources.role.id',
              operator: PolicyOperator.IN,
              value: [
                roleMap.get('veterinarian')!.id,
                roleMap.get('volunteer')!.id,
                roleMap.get('member')!.id,
              ],
            },
          ],
        },
      },
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
          `[RolePermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
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
