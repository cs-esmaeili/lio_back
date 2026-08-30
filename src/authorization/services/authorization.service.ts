import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissions(userId: number): Promise<Set<string>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    const names = user?.role?.permissions.map((link) => link.permission.name) ?? [];
    return new Set(names);
  }

  listRoles() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async getRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  createRole(input: { name: string; description?: string; permissionIds?: number[] }) {
    return this.prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        permissions: input.permissionIds?.length ? { create: input.permissionIds.map((permissionId) => ({ permissionId })) } : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async updateRole(id: number, input: { name?: string; description?: string; permissionIds?: number[] }) {
    await this.getRole(id);
    return this.prisma.role.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        permissions: input.permissionIds
          ? {
              deleteMany: {},
              create: input.permissionIds.map((permissionId) => ({ permissionId })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async deleteRole(id: number) {
    await this.getRole(id);
    await this.prisma.role.delete({ where: { id } });
    return { ok: true };
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { id: 'asc' } });
  }

  async getPermission(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  createPermission(input: { name: string; description?: string }) {
    return this.prisma.permission.create({
      data: { name: input.name, description: input.description },
    });
  }

  async updatePermission(id: number, input: { name?: string; description?: string }) {
    await this.getPermission(id);
    return this.prisma.permission.update({
      where: { id },
      data: { name: input.name, description: input.description },
    });
  }

  async deletePermission(id: number) {
    await this.getPermission(id);
    await this.prisma.permission.delete({ where: { id } });
    return { ok: true };
  }

  async assignRole(userId: number, roleId: number | null) {
    if (roleId !== null) {
      await this.getRole(roleId);
    }
    await this.prisma.user.update({ where: { id: userId }, data: { roleId } });
    return { ok: true };
  }
}
