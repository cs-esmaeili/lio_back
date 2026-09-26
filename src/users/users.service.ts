import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { roles, users } from 'src/database/schema';
import { DEFAULT_USER_ROLE_NAME } from 'src/authorization/authorization.constants';

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
    const [user] = await this.db.insert(users).values({ username, roleId: role?.id ?? null }).returning();
    return user;
  }

  async setPassword(userId: number, passwordHash: string) {
    const [user] = await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning();
    return user;
  }
}
