import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { users } from 'src/database/schema';

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
    const [user] = await this.db.insert(users).values({ username }).returning();
    return user;
  }

  async setPassword(userId: number, passwordHash: string) {
    const [user] = await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning();
    return user;
  }
}
