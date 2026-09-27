import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { siteSettings } from 'src/database/schema';

@Injectable()
export class SiteSettingService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listAll() {
    const settings = await this.db.query.siteSettings.findMany({ orderBy: asc(siteSettings.key) });
    return settings.map((setting) => ({ key: setting.key, data: setting.data, isPrivate: setting.isPrivate }));
  }

  async getByKey(key: string, authenticated: boolean) {
    const setting = await this.findByKey(key);
    if (!setting || (setting.isPrivate && !authenticated)) {
      // Private settings are hidden from anonymous callers; respond the same as a
      // missing key so their existence is not leaked.
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }

  /**
   * Read a setting by key, or `null` when it does not exist. Never throws, so
   * callers that have a safe default (e.g. checkout shipping) can fall back.
   */
  async findByKey(key: string): Promise<{ key: string; data: Record<string, unknown>; isPrivate: boolean } | null> {
    const setting = await this.db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
    return setting ? { key: setting.key, data: setting.data, isPrivate: setting.isPrivate } : null;
  }

  async deleteByKey(key: string) {
    const deleted = await this.db.delete(siteSettings).where(eq(siteSettings.key, key)).returning({ key: siteSettings.key });
    if (deleted.length === 0) {
      throw new NotFoundException('Setting not found');
    }
    return { ok: true };
  }

  async upsertByKey(key: string, data: Record<string, unknown>, isPrivate?: boolean) {
    const [setting] = await this.db
      .insert(siteSettings)
      .values({ key, data, isPrivate: isPrivate ?? false })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { data, ...(isPrivate === undefined ? {} : { isPrivate }) },
      })
      .returning();
    return { key: setting.key, data: setting.data, isPrivate: setting.isPrivate };
  }
}
