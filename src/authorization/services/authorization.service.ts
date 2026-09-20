import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { permissions, rolePermissions, roles, users } from 'src/database/schema';

@Injectable()
export class AuthorizationService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getUserPermissions(userId: number): Promise<Set<string>> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
      with: { role: { with: { permissions: { with: { permission: true } } } } },
    });
    const names = user?.role?.permissions.map((link) => link.permission.name) ?? [];
    return new Set(names);
  }

  listRoles() {
    return this.db.query.roles.findMany({
      with: { permissions: { with: { permission: true } } },
      orderBy: asc(roles.id),
    });
  }

  async getRole(id: number) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, id),
      with: { permissions: { with: { permission: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async createRole(input: { name: string; description?: string; permissionIds?: number[] }) {
    const roleId = await this.db.transaction(async (tx) => {
      const [role] = await tx
        .insert(roles)
        .values({ name: input.name, description: input.description ?? null })
        .returning({ id: roles.id });

      if (input.permissionIds?.length) {
        await tx.insert(rolePermissions).values(input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })));
      }

      return role.id;
    });

    return this.getRole(roleId);
  }

  async updateRole(id: number, input: { name?: string; description?: string; permissionIds?: number[] }) {
    await this.getRole(id);

    await this.db.transaction(async (tx) => {
      await tx.update(roles).set({ name: input.name, description: input.description }).where(eq(roles.id, id));

      if (input.permissionIds) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        if (input.permissionIds.length) {
          await tx.insert(rolePermissions).values(input.permissionIds.map((permissionId) => ({ roleId: id, permissionId })));
        }
      }
    });

    return this.getRole(id);
  }

  async deleteRole(id: number) {
    await this.getRole(id);
    await this.db.delete(roles).where(eq(roles.id, id));
    return { ok: true };
  }

  listPermissions() {
    return this.db.query.permissions.findMany({ orderBy: asc(permissions.id) });
  }

  async getPermission(id: number) {
    const permission = await this.db.query.permissions.findFirst({ where: eq(permissions.id, id) });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async createPermission(input: { name: string; description?: string }) {
    const [permission] = await this.db
      .insert(permissions)
      .values({ name: input.name, description: input.description ?? null })
      .returning();
    return permission;
  }

  async updatePermission(id: number, input: { name?: string; description?: string }) {
    await this.getPermission(id);
    const [permission] = await this.db.update(permissions).set({ name: input.name, description: input.description }).where(eq(permissions.id, id)).returning();
    return permission;
  }

  async deletePermission(id: number) {
    await this.getPermission(id);
    await this.db.delete(permissions).where(eq(permissions.id, id));
    return { ok: true };
  }

  async assignRole(userId: number, roleId: number | null) {
    if (roleId !== null) {
      await this.getRole(roleId);
    }
    const updated = await this.db.update(users).set({ roleId }).where(eq(users.id, userId)).returning({ id: users.id });
    if (updated.length === 0) {
      throw new Error('User not found');
    }
    return { ok: true };
  }
}
