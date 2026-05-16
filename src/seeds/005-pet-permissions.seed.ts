import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@/modules/policy/enums/policy-effect.enum';
import { Policy } from '@/modules/policy/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';

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

export class PetPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'species:create', description: 'Create species' },
      { key: 'species:read', description: 'Read species' },
      { key: 'species:update', description: 'Update species' },
      { key: 'species:delete', description: 'Delete species' },
      { key: 'species:list', description: 'List species' },
      {
        key: 'species:*',
        description: 'All species actions',
        assignable: false,
      },
      { key: 'breed:create', description: 'Create breeds' },
      { key: 'breed:read', description: 'Read breeds' },
      { key: 'breed:update', description: 'Update breeds' },
      { key: 'breed:delete', description: 'Delete breeds' },
      { key: 'breed:list', description: 'List breeds' },
      { key: 'breed:*', description: 'All breed actions', assignable: false },
      { key: 'pet:create', description: 'Create pets' },
      { key: 'pet:read', description: 'Read pets' },
      { key: 'pet:update', description: 'Update pets' },
      { key: 'pet:delete', description: 'Delete pets' },
      { key: 'pet:list', description: 'List pets' },
      { key: 'pet:*', description: 'All pet actions', assignable: false },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        await permissionRepo.update({ key: perm.key }, perm);
        console.log(`[PetPermissionsSeed] Updated permission: ${perm.key}`);
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[PetPermissionsSeed] Created permission: ${perm.key}`);
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
        `[PetPermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}. Some permissions won't be assigned.`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'species:create',
        'species:read',
        'species:update',
        'species:delete',
        'species:list',
        'breed:create',
        'breed:read',
        'breed:update',
        'breed:delete',
        'breed:list',
        'pet:create',
        'pet:read',
        'pet:update',
        'pet:delete',
        'pet:list',
      ],
      manager: [
        'species:create',
        'species:read',
        'species:update',
        'species:delete',
        'species:list',
        'breed:create',
        'breed:read',
        'breed:update',
        'breed:delete',
        'breed:list',
        'pet:create',
        'pet:read',
        'pet:update',
        'pet:delete',
        'pet:list',
      ],
      staff: [
        'species:read',
        'species:list',
        'breed:read',
        'breed:list',
        'pet:create',
        'pet:read',
        'pet:update',
        'pet:list',
      ],
      veterinarian: [
        'species:read',
        'species:list',
        'breed:read',
        'breed:list',
        'pet:read',
        'pet:update',
        'pet:list',
      ],
      volunteer: [
        'species:read',
        'species:list',
        'breed:read',
        'breed:list',
        'pet:read',
        'pet:list',
      ],
      member: [
        'species:read',
        'species:list',
        'breed:read',
        'breed:list',
        'pet:read',
        'pet:list',
      ],
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
          `[PetPermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[PetPermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all species, breed, pet actions
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('species:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('breed:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('pet:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      // Staff - species/breed read+list, pet full
      ...rolePermissionMap['staff']!.map((perm) =>
        createAllowPolicy(roleMap.get('staff')!.id, permMap.get(perm)!.id, 50),
      ),
      // Veterinarian - species/breed read+list, pet read+update+list
      ...rolePermissionMap['veterinarian']!.map((perm) =>
        createAllowPolicy(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          40,
        ),
      ),
      // Volunteer - species/breed read+list, pet read+list
      ...rolePermissionMap['volunteer']!.map((perm) =>
        createAllowPolicy(
          roleMap.get('volunteer')!.id,
          permMap.get(perm)!.id,
          30,
        ),
      ),
      // Member - same as volunteer
      ...rolePermissionMap['member']!.map((perm) =>
        createAllowPolicy(roleMap.get('member')!.id, permMap.get(perm)!.id, 20),
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
          `[PetPermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[PetPermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }

    console.log('[PetPermissionsSeed] Completed successfully!');
  }
}
