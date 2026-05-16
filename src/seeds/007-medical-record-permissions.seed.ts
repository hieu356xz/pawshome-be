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

export class MedicalRecordPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'medical-record:create', description: 'Create medical records' },
      { key: 'medical-record:read', description: 'Read medical records' },
      { key: 'medical-record:update', description: 'Update medical records' },
      { key: 'medical-record:delete', description: 'Delete medical records' },
      { key: 'medical-record:list', description: 'List medical records' },
      {
        key: 'medical-record:*',
        description: 'All medical-record actions',
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
          `[MedicalRecordPermissionsSeed] Updated permission: ${perm.key}`,
        );
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(
        `[MedicalRecordPermissionsSeed] Created permission: ${perm.key}`,
      );
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
        `[MedicalRecordPermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}. Some permissions won't be assigned.`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'medical-record:create',
        'medical-record:read',
        'medical-record:update',
        'medical-record:delete',
        'medical-record:list',
      ],
      manager: [
        'medical-record:create',
        'medical-record:read',
        'medical-record:update',
        'medical-record:delete',
        'medical-record:list',
      ],
      staff: [
        'medical-record:create',
        'medical-record:read',
        'medical-record:update',
        'medical-record:delete',
        'medical-record:list',
      ],
      veterinarian: [
        'medical-record:create',
        'medical-record:read',
        'medical-record:update',
        'medical-record:list',
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
          `[MedicalRecordPermissionsSeed] Assigned permissions to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      } else {
        console.log(
          `[MedicalRecordPermissionsSeed] ${roleName} already has all permissions, skipping`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all medical-record actions
      {
        roleId: roleMap.get('manager')!.id,
        permissionId: permMap.get('medical-record:*')!.id,
        effect: PolicyEffect.ALLOW,
        priority: 80,
      },
      // Staff - all medical-record actions
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
          `[MedicalRecordPermissionsSeed] Updated policy: ${policyData.roleId} -> ${policyData.permissionId}`,
        );
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(
        `[MedicalRecordPermissionsSeed] Created policy: ${policyData.roleId} -> ${policyData.permissionId}`,
      );
    }

    console.log('[MedicalRecordPermissionsSeed] Completed successfully!');
  }
}
