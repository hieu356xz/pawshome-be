import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@/modules/policy/enums/policy-effect.enum';
import { PolicyOperator } from '@/modules/policy/enums/policy-operator.enum';
import { Policy } from '@/modules/policy/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';
import { PolicyConditions } from '@/modules/policy/interfaces/policy-condition.interface';

const createOwnCondition = (resource: string): PolicyConditions => ({
  operator: 'AND',
  rules: [
    {
      field: `$resources.${resource}.userId`,
      operator: PolicyOperator.EQUALS,
      value: '$user.id',
    },
  ],
});

const createOwnPolicies = (
  roleId: string,
  permissionId: string,
  priority: number,
  resource: string = 'adoption-request',
): Partial<Policy> => ({
  roleId,
  permissionId,
  effect: PolicyEffect.ALLOW,
  priority,
  conditions: createOwnCondition(resource),
});

const createAllowPolicy = (
  roleId: string,
  permissionId: string,
  priority: number,
): Partial<Policy> => ({
  roleId,
  permissionId,
  effect: PolicyEffect.ALLOW,
  priority,
});

export class AdoptionRequestPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      {
        key: 'adoption-request:create',
        description: 'Create adoption requests',
      },
      { key: 'adoption-request:read', description: 'Read adoption requests' },
      {
        key: 'adoption-request:update',
        description: 'Update/Review adoption requests',
      },
      {
        key: 'adoption-request:delete',
        description: 'Delete adoption requests',
      },
      { key: 'adoption-request:list', description: 'List adoption requests' },
      {
        key: 'adoption-request:*',
        description: 'All adoption-request actions',
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
        console.log(
          `[AdoptionRequestPermissionsSeed] Updated permission: ${perm.key}`,
        );
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(
        `[AdoptionRequestPermissionsSeed] Created permission: ${perm.key}`,
      );
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
      console.log(
        `[AdoptionRequestPermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}. Some permissions won't be assigned.`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'adoption-request:create',
        'adoption-request:read',
        'adoption-request:update',
        'adoption-request:delete',
        'adoption-request:list',
      ],
      manager: [
        'adoption-request:create',
        'adoption-request:read',
        'adoption-request:update',
        'adoption-request:delete',
        'adoption-request:list',
      ],
      staff: [
        'adoption-request:create',
        'adoption-request:read',
        'adoption-request:update',
        'adoption-request:delete',
        'adoption-request:list',
      ],
      veterinarian: ['adoption-request:read', 'adoption-request:list'],
      volunteer: ['adoption-request:read', 'adoption-request:list'],
      member: ['adoption-request:create', 'adoption-request:read'],
    };

    for (const [roleName, permKeys] of Object.entries(rolePermissionMap)) {
      const role = roleMap.get(roleName);
      if (!role) continue;

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
          `[AdoptionRequestPermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[AdoptionRequestPermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all adoption-request actions
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('adoption-request:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      // Staff - all adoption-request actions (no conditions)
      ...rolePermissionMap['staff'].map((perm) =>
        createAllowPolicy(roleMap.get('staff')!.id, permMap.get(perm)!.id, 50),
      ),
      // Veterinarian - read, list only (no conditions)
      ...rolePermissionMap['veterinarian'].map((perm) =>
        createAllowPolicy(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          40,
        ),
      ),
      // Volunteer - can only create and read their own requests
      createAllowPolicy(
        roleMap.get('volunteer')!.id,
        permMap.get('adoption-request:create')!.id,
        30,
      ),
      createOwnPolicies(
        roleMap.get('volunteer')!.id,
        permMap.get('adoption-request:read')!.id,
        30,
      ),
      // Member - can only create and read their own requests
      createAllowPolicy(
        roleMap.get('member')!.id,
        permMap.get('adoption-request:create')!.id,
        20,
      ),
      createOwnPolicies(
        roleMap.get('member')!.id,
        permMap.get('adoption-request:read')!.id,
        20,
      ),
    ];

    for (const policyData of policies) {
      if (!policyData.roleId || !policyData.permissionId) continue;

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
          `[AdoptionRequestPermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[AdoptionRequestPermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }

    console.log('[AdoptionRequestPermissionsSeed] Completed successfully!');
  }
}
