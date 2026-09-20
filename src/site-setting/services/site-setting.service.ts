import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { siteSettings } from 'src/database/schema';

@Injectable()
export class SiteSettingService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getByKey(key: string, authenticated: boolean) {
    const setting = await this.db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
    if (!setting || (setting.isPrivate && !authenticated)) {
      // Private settings are hidden from anonymous callers; respond the same as a
      // missing key so their existence is not leaked.
      throw new NotFoundException('Setting not found');
    }
    return { key: setting.key, data: setting.data, isPrivate: setting.isPrivate };
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
