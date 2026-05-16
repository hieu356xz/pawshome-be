import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { PolicyEffect } from '@/modules/policy/enums/policy-effect.enum';
import { Policy } from '@/modules/policy/entities/policy.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { PermissionKey } from '@/modules/permission/enums/permission-key.enum';

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

export class BlogTagPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'blog-tag:create', description: 'Create blog tags' },
      { key: 'blog-tag:read', description: 'Read blog tags' },
      { key: 'blog-tag:update', description: 'Update blog tags' },
      { key: 'blog-tag:delete', description: 'Delete blog tags' },
      { key: 'blog-tag:list', description: 'List blog tags' },
      {
        key: 'blog-tag:*',
        description: 'All blog tag actions',
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
        console.log(`[BlogTagPermissionsSeed] Updated permission: ${perm.key}`);
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[BlogTagPermissionsSeed] Created permission: ${perm.key}`);
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

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'blog-tag:create',
        'blog-tag:read',
        'blog-tag:update',
        'blog-tag:delete',
        'blog-tag:list',
      ],
      manager: [
        'blog-tag:create',
        'blog-tag:read',
        'blog-tag:update',
        'blog-tag:delete',
        'blog-tag:list',
      ],
      staff: [
        'blog-tag:create',
        'blog-tag:read',
        'blog-tag:update',
        'blog-tag:delete',
        'blog-tag:list',
      ],
      veterinarian: ['blog-tag:read', 'blog-tag:list'],
      volunteer: ['blog-tag:read', 'blog-tag:list'],
      member: ['blog-tag:read', 'blog-tag:list'],
    };

    const permissionsWithAllowPolicy: PermissionKey[] = [
      'blog-tag:read',
      'blog-tag:list',
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
          `[BlogTagPermissionsSeed] Assigned to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all blog-tag actions
      createAllowPolicy(
        roleMap.get('manager')!.id,
        permMap.get('blog-tag:*')!.id,
        80,
      ),
      // Staff - all blog-tag actions
      createAllowPolicy(
        roleMap.get('staff')!.id,
        permMap.get('blog-tag:*')!.id,
        50,
      ),
      // Veterinarian, Volunteer, Member - read/list only
      ...permissionsWithAllowPolicy.map((perm) =>
        createAllowPolicy(
          roleMap.get('veterinarian')!.id,
          permMap.get(perm)!.id,
          40,
        ),
      ),
      ...permissionsWithAllowPolicy.map((perm) =>
        createAllowPolicy(
          roleMap.get('volunteer')!.id,
          permMap.get(perm)!.id,
          30,
        ),
      ),
      ...permissionsWithAllowPolicy.map((perm) =>
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
        console.log(`[BlogTagPermissionsSeed] Updated policy`);
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(`[BlogTagPermissionsSeed] Created policy`);
    }

    console.log('[BlogTagPermissionsSeed] Completed!');
  }
}
