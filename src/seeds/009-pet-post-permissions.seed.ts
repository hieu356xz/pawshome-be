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
  resource: string,
  priority: number,
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

export class PetPostPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'pet-post:create', description: 'Create pet posts' },
      { key: 'pet-post:read', description: 'Read pet posts' },
      { key: 'pet-post:update', description: 'Update pet posts' },
      { key: 'pet-post:delete', description: 'Delete pet posts' },
      { key: 'pet-post:list', description: 'List pet posts' },
      {
        key: 'pet-post:*',
        description: 'All pet-post actions',
        assignable: false,
      },
      {
        key: 'pet-post-comment:create',
        description: 'Create pet post comments',
      },
      { key: 'pet-post-comment:read', description: 'Read pet post comments' },
      {
        key: 'pet-post-comment:update',
        description: 'Update pet post comments',
      },
      {
        key: 'pet-post-comment:delete',
        description: 'Delete pet post comments',
      },
      { key: 'pet-post-comment:list', description: 'List pet post comments' },
      {
        key: 'pet-post-comment:*',
        description: 'All pet-post actions',
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
        console.log(`[PetPostPermissionsSeed] Updated permission: ${perm.key}`);
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[PetPostPermissionsSeed] Created permission: ${perm.key}`);
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
        `[PetPostPermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post:list',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
        'pet-post-comment:list',
      ],
      manager: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post:list',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
        'pet-post-comment:list',
      ],
      staff: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post:list',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
        'pet-post-comment:list',
      ],
      veterinarian: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
      ],
      volunteer: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
      ],
      member: [
        'pet-post:create',
        'pet-post:read',
        'pet-post:update',
        'pet-post:delete',
        'pet-post-comment:create',
        'pet-post-comment:read',
        'pet-post-comment:update',
        'pet-post-comment:delete',
      ],
    };

    const permissionsWithAllowPolicy: PermissionKey[] = [
      'pet-post:read',
      'pet-post:create',
      'pet-post-comment:read',
      'pet-post-comment:create',
    ];

    const permissionsWithOwnPolicy: PermissionKey[] = [
      'pet-post:update',
      'pet-post:delete',
      'pet-post-comment:update',
      'pet-post-comment:delete',
    ];

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
          `[PetPostPermissionsSeed] Assigned to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all pet-post actions
      createAllowPolicy(
        roleMap.get('manager')!.id,
        permMap.get('pet-post:*')!.id,
        80,
      ),
      // Staff - all pet-post actions (no conditions)
      createAllowPolicy(
        roleMap.get('staff')!.id,
        permMap.get('pet-post:*')!.id,
        50,
      ),
      // Veterinarian - can update/delete own posts and comments, can create/read all
      ...permissionsWithAllowPolicy.map((perm) =>
        createAllowPolicy(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          40,
        ),
      ),
      ...permissionsWithOwnPolicy.map((perm) =>
        createOwnPolicies(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          perm.split(':')[0],
          40,
        ),
      ),
      // Volunteer - can update/delete own posts and comments, can create/read all
      ...permissionsWithAllowPolicy.map((perm) =>
        createAllowPolicy(
          roleMap.get('volunteer')!.id,
          permMap.get(perm)!.id,
          30,
        ),
      ),
      ...permissionsWithOwnPolicy.map((perm) =>
        createOwnPolicies(
          roleMap.get('volunteer')!.id,
          permMap.get(perm)!.id,
          perm.split(':')[0],
          30,
        ),
      ),
      // Member - can update/delete own posts and comments, can create/read all
      ...permissionsWithAllowPolicy.map((perm) =>
        createAllowPolicy(roleMap.get('member')!.id, permMap.get(perm)!.id, 20),
      ),
      ...permissionsWithOwnPolicy.map((perm) =>
        createOwnPolicies(
          roleMap.get('member')!.id,
          permMap.get(perm)!.id,
          perm.split(':')[0],
          20,
        ),
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
        console.log(`[PetPostPermissionsSeed] Updated policy`);
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(`[PetPostPermissionsSeed] Created policy`);
    }

    console.log('[PetPostPermissionsSeed] Completed!');
  }
}
