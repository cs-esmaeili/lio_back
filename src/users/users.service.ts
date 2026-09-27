import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { roles, users, type UserStatus } from 'src/database/schema';
import { DEFAULT_USER_ROLE_NAME } from 'src/authorization/authorization.constants';
import type { ListUsersRequestDto } from './dtos/listUsers/list-users-request.dto';
import type { ListUsersResponseDto } from './dtos/listUsers/list-users-response.dto';
import type { GetUserResponseDto } from './dtos/getUser/get-user-response.dto';
import type { UpdateUserStatusResponseDto } from './dtos/updateUserStatus/update-user-status-response.dto';

/** Selected user columns projected into the admin user contract. */
const ADMIN_USER_COLUMNS = {
  id: true,
  username: true,
  name: true,
  lastName: true,
  nationalCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface AdminUserRow {
  id: number;
  username: string;
  name: string | null;
  lastName: string | null;
  nationalCode: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  role: { id: number; name: string; description: string | null } | null;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findByUsername(username: string) {
    return this.db.query.users.findFirst({ where: eq(users.username, username) });
  }

  findById(id: number) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async createByUsername(username: string) {
    const role = await this.db.query.roles.findFirst({ where: eq(roles.name, DEFAULT_USER_ROLE_NAME) });
    const [user] = await this.db
      .insert(users)
      .values({ username, roleId: role?.id ?? null })
      .returning();
    return user;
  }

  async setPassword(userId: number, passwordHash: string) {
    const [user] = await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning();
    return user;
  }

  /* ------------------------------------------------------------------------ */
  /*  Admin users                                                             */
  /* ------------------------------------------------------------------------ */

  async listUsers(query: ListUsersRequestDto): Promise<ListUsersResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      const search = or(ilike(users.username, term), ilike(users.name, term), ilike(users.lastName, term), ilike(users.nationalCode, term));
      if (search) filters.push(search);
    }
    if (query.status !== undefined) {
      filters.push(eq(users.status, query.status));
    }
    if (query.roleId !== undefined) {
      filters.push(eq(users.roleId, query.roleId));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [total, rows] = await Promise.all([
      this.db.$count(users, where),
      this.db.query.users.findMany({
        where,
        orderBy: [desc(users.id)],
        limit,
        offset,
        columns: ADMIN_USER_COLUMNS,
        with: { role: { columns: { id: true, name: true, description: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => this.toAdminUser(row)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getUser(id: number): Promise<GetUserResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      columns: ADMIN_USER_COLUMNS,
      with: { role: { columns: { id: true, name: true, description: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAdminUser(user);
  }

  async updateUserStatus(id: number, status: UserStatus): Promise<UpdateUserStatusResponseDto> {
    const updated = await this.db.update(users).set({ status }).where(eq(users.id, id)).returning({ id: users.id });
    if (updated.length === 0) {
      throw new NotFoundException('User not found');
    }
    return this.getUser(id);
  }

  private toAdminUser(user: AdminUserRow) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName,
      nationalCode: user.nationalCode,
      status: user.status,
      role: user.role ? { id: user.role.id, name: user.role.name, description: user.role.description } : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
