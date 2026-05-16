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

export class BlogPermissionsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const policyRepo = dataSource.getRepository(Policy);

    const permissions: Partial<Permission>[] = [
      { key: 'blog:create', description: 'Create blog posts' },
      { key: 'blog:read', description: 'Read blog posts' },
      { key: 'blog:update', description: 'Update blog posts' },
      { key: 'blog:delete', description: 'Delete blog posts' },
      { key: 'blog:list', description: 'List blog posts' },
      { key: 'blog:*', description: 'All blog actions', assignable: false },
      { key: 'blog-comment:create', description: 'Create blog comments' },
      { key: 'blog-comment:read', description: 'Read blog comments' },
      { key: 'blog-comment:update', description: 'Update blog comments' },
      { key: 'blog-comment:delete', description: 'Delete blog comments' },
      { key: 'blog-comment:list', description: 'List blog comments' },
      {
        key: 'blog-comment:*',
        description: 'All blog comment actions',
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
        console.log(`[BlogPermissionsSeed] Updated permission: ${perm.key}`);
        savedPermissions.push(existing);
        continue;
      }
      const permission = permissionRepo.create(perm);
      const saved = await permissionRepo.save(permission);
      savedPermissions.push(saved);
      console.log(`[BlogPermissionsSeed] Created permission: ${perm.key}`);
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
        `[BlogPermissionsSeed] Warning: Missing roles: ${missingRoles.join(', ')}`,
      );
    }

    const rolePermissionMap: Record<string, PermissionKey[]> = {
      admin: [
        'blog:create',
        'blog:read',
        'blog:update',
        'blog:delete',
        'blog:list',
        'blog-comment:create',
        'blog-comment:read',
        'blog-comment:update',
        'blog-comment:delete',
        'blog-comment:list',
      ],
      manager: [
        'blog:create',
        'blog:read',
        'blog:update',
        'blog:delete',
        'blog:list',
        'blog-comment:create',
        'blog-comment:read',
        'blog-comment:update',
        'blog-comment:delete',
        'blog-comment:list',
      ],
      staff: [
        'blog:create',
        'blog:read',
        'blog:update',
        'blog:delete',
        'blog:list',
        'blog-comment:create',
        'blog-comment:read',
        'blog-comment:update',
        'blog-comment:delete',
        'blog-comment:list',
      ],
      veterinarian: [
        'blog:read',
        'blog:list',
        'blog-comment:read',
        'blog-comment:list',
        'blog-comment:create',
        'blog-comment:update',
        'blog-comment:delete',
      ],
      volunteer: [
        'blog:read',
        'blog:list',
        'blog-comment:read',
        'blog-comment:list',
        'blog-comment:create',
        'blog-comment:update',
        'blog-comment:delete',
      ],
      member: [
        'blog:read',
        'blog:list',
        'blog-comment:read',
        'blog-comment:list',
        'blog-comment:create',
        'blog-comment:update',
        'blog-comment:delete',
      ],
    };

    const permissionsWithAllowPolicy: PermissionKey[] = [
      'blog:read',
      'blog:list',
      'blog-comment:read',
      'blog-comment:create',
      'blog-comment:list',
    ];

    const permissionsWithOwnPolicy: PermissionKey[] = [
      'blog-comment:update',
      'blog-comment:delete',
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
          `[BlogPermissionsSeed] Assigned to ${roleName}: ${newPerms.map((p) => p.key).join(', ')}`,
        );
      }
    }

    const policies: Partial<Policy>[] = [
      // Manager - all blog actions
      createAllowPolicy(
        roleMap.get('manager')!.id,
        permMap.get('blog:*')!.id,
        80,
      ),
      createAllowPolicy(
        roleMap.get('manager')!.id,
        permMap.get('blog-comment:*')!.id,
        80,
      ),
      // Staff - all blog actions
      createAllowPolicy(
        roleMap.get('staff')!.id,
        permMap.get('blog:*')!.id,
        50,
      ),
      createAllowPolicy(
        roleMap.get('staff')!.id,
        permMap.get('blog-comment:*')!.id,
        50,
      ),
      // Veterinarian - can update/delete own comments, can create/read all
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
      // Volunteer - can update/delete own comments, can create/read all
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
      // Member - can update/delete own comments, can create/read all
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
        console.log(`[BlogPermissionsSeed] Updated policy`);
        continue;
      }

      const policy = policyRepo.create(policyData);
      await policyRepo.save(policy);
      console.log(`[BlogPermissionsSeed] Created policy`);
    }

    console.log('[BlogPermissionsSeed] Completed!');
  }
}
