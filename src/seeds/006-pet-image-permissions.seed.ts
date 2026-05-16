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

export class PetImagePermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'pet-image:create', description: 'Create pet images' },
      { key: 'pet-image:read', description: 'Read pet images' },
      { key: 'pet-image:update', description: 'Update pet images' },
      { key: 'pet-image:delete', description: 'Delete pet images' },
      { key: 'pet-image:list', description: 'List pet images' },
      {
        key: 'pet-image:*',
        description: 'All pet-image actions',
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
          `[PetImagePermissionsSeed] Updated permission: ${perm.key}`,
        );
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[PetImagePermissionsSeed] Created permission: ${perm.key}`);
    }

    const permMap = new Map(savedPermissions.map((p) => [p.key, p]));

    const roleMap = new Map<string, Role>();
    const requiredRoles = ['admin', 'manager', 'staff', 'veterinarian'];

    for (const name of requiredRoles) {
      const role = await roleRepo.findOne({ where: { name } });
      if (role) roleMap.set(name, role);
    }

    const missingRoles = requiredRoles.filter((name) => !roleMap.has(name));

    if (missingRoles.length > 0) {
      console.log(
        `[PetImagePermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}. Some permissions won't be assigned.`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'pet-image:create',
        'pet-image:read',
        'pet-image:update',
        'pet-image:delete',
        'pet-image:list',
      ],
      manager: [
        'pet-image:create',
        'pet-image:read',
        'pet-image:update',
        'pet-image:delete',
        'pet-image:list',
      ],
      staff: [
        'pet-image:create',
        'pet-image:read',
        'pet-image:update',
        'pet-image:delete',
        'pet-image:list',
      ],
      veterinarian: [
        'pet-image:create',
        'pet-image:read',
        'pet-image:update',
        'pet-image:list',
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
          `[PetImagePermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[PetImagePermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all pet-image actions
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('pet-image:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      // Staff - all pet-image actions
      ...rolePermissionMap['staff'].map((perm) =>
        createAllowPolicy(roleMap.get('staff')!.id, permMap.get(perm)!.id, 50),
      ),
      // Veterinarian - create, read, update, list (no delete)
      ...rolePermissionMap['veterinarian'].map((perm) =>
        createAllowPolicy(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          40,
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
        console.log(
          `[PetImagePermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[PetImagePermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }

    console.log('[PetImagePermissionsSeed] Completed successfully!');
  }
}
