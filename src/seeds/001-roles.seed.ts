import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '@modules/role/entities/role.entity';

export class RolesSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const roleRepo = dataSource.getRepository(Role);

    const roles = [
      {
        name: 'admin',
        description: 'Full system access',
      },
      {
        name: 'manager',
        description: 'Manage users and staff, full user permissions',
      },
      {
        name: 'staff',
        description: 'Support staff - view users, assign roles (vet→)',
      },
      {
        name: 'veterinarian',
        description: 'Veterinarian - medical records access',
      },
      {
        name: 'member',
        description: 'Regular member - manage own profile',
      },
      {
        name: 'volunteer',
        description: 'Volunteer - manage own profile',
      },
    ];

    for (const roleData of roles) {
      const existing = await roleRepo.findOne({
        where: { name: roleData.name },
      });

      if (existing) {
        await roleRepo.update({ name: roleData.name }, roleData);
        console.log(`[RolesSeed] Updated role: ${roleData.name}`);
        continue;
      }

      const role = roleRepo.create(roleData);
      await roleRepo.save(role);
      console.log(`[RolesSeed] Created role: ${role.name}`);
    }
  }
}
