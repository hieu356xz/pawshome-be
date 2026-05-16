import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import type { PermissionKey } from '@modules/permission/enums/permission-key.enum';

export class PolicyPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);

    const permissions: Partial<Permission>[] = [
      { key: 'policy:list', description: 'List policies' },
      { key: 'policy:read', description: 'Read policies' },
      { key: 'policy:create', description: 'Create policies' },
      { key: 'policy:update', description: 'Update policies' },
      { key: 'policy:delete', description: 'Delete policies' },
      { key: 'policy:*', description: 'All policy actions', assignable: false },
    ];

    const savedPermissions: Permission[] = [];

    for (const perm of permissions) {
      const existing = await permissionRepo.findOne({
        where: { key: perm.key },
      });
      if (existing) {
        await permissionRepo.update({ key: perm.key }, perm);
        console.log(`[PolicyPermissionsSeed] Updated permission: ${perm.key}`);
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[PolicyPermissionsSeed] Created permission: ${perm.key}`);
    }

    const permMap = new Map(savedPermissions.map((p) => [p.key, p]));

    const admin = await roleRepo.findOne({ where: { name: 'admin' } });
    if (!admin) {
      throw new Error(
        '[PolicyPermissionsSeed] Missing admin role. Please run 001-roles.seed.ts first.',
      );
    }

    const adminPermissions: PermissionKey[] = [
      'policy:list',
      'policy:read',
      'policy:create',
      'policy:update',
      'policy:delete',
    ];

    const existingRole = await roleRepo.findOne({
      where: { id: admin.id },
      relations: ['permissions'],
    });

    const existingKeys = new Set(
      existingRole?.permissions?.map((p) => p.key) ?? [],
    );

    const newPerms = adminPermissions
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
        `[PolicyPermissionsSeed] Assigned permissions to admin: ${newPerms.map((p) => p.key).join(', ')}`,
      );
    } else {
      console.log(
        '[PolicyPermissionsSeed] admin already has all permissions, skipping',
      );
    }
  }
}
