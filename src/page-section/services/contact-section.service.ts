import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { contactSections, siteSettings } from 'src/database/schema';
import type { ContactInputDto } from '../dtos/sectionData/section-data-request.dto';

const SUPPORT_PHONE_SETTING_KEY = 'supportPhone';
const SOCIALS_SETTING_KEY = 'socials';

export type ContactSocial = {
  key: string;
  title: string;
  image: string;
  fullUrl: string;
};

export type ContactSectionData = {
  address: string | null;
  email: string | null;
  supportHour: string | null;
  mapLat: number | null;
  mapLng: number | null;
  supportPhone: string | null;
  socials: ContactSocial[];
};

type ContactRow = typeof contactSections.$inferSelect;

@Injectable()
export class ContactSectionService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(sectionId: number): Promise<ContactSectionData> {
    const [row, settings] = await Promise.all([this.db.query.contactSections.findFirst({ where: eq(contactSections.sectionId, sectionId) }), this.loadSettings()]);

    return row ? this.toData(row, settings) : { address: null, email: null, supportHour: null, mapLat: null, mapLng: null, ...settings };
  }

  /** Create the contact record (upsert) for the given section. */
  create(sectionId: number, dto: ContactInputDto): Promise<ContactSectionData> {
    return this.update(sectionId, dto);
  }

  /** Delete the contact record of the given section. */
  async remove(sectionId: number): Promise<ContactSectionData> {
    const deleted = await this.db.delete(contactSections).where(eq(contactSections.sectionId, sectionId)).returning({ id: contactSections.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Contact not found');
    }

    return this.list(sectionId);
  }

  /** Create or replace the contact that belongs to the given section. */
  async update(sectionId: number, dto: ContactInputDto): Promise<ContactSectionData> {
    const values = {
      sectionId,
      address: dto.address ?? null,
      email: dto.email ?? null,
      supportHour: dto.supportHour ?? null,
      mapLat: dto.mapLat ?? null,
      mapLng: dto.mapLng ?? null,
    };

    await this.db
      .insert(contactSections)
      .values(values)
      .onConflictDoUpdate({
        target: contactSections.sectionId,
        set: {
          address: values.address,
          email: values.email,
          supportHour: values.supportHour,
          mapLat: values.mapLat,
          mapLng: values.mapLng,
        },
      });

    return this.list(sectionId);
  }

  private toData(row: ContactRow, settings: Pick<ContactSectionData, 'supportPhone' | 'socials'>): ContactSectionData {
    return {
      address: row.address,
      email: row.email,
      supportHour: row.supportHour,
      mapLat: row.mapLat,
      mapLng: row.mapLng,
      ...settings,
    };
  }

  /** Global contact values are stored as public site settings and surfaced with the section. */
  private async loadSettings(): Promise<Pick<ContactSectionData, 'supportPhone' | 'socials'>> {
    const settings = await this.db.query.siteSettings.findMany({
      where: and(inArray(siteSettings.key, [SUPPORT_PHONE_SETTING_KEY, SOCIALS_SETTING_KEY]), eq(siteSettings.isPrivate, false)),
      columns: { key: true, data: true },
    });

    const dataByKey = new Map(settings.map((setting) => [setting.key, setting.data]));

    return {
      supportPhone: this.readString(dataByKey.get(SUPPORT_PHONE_SETTING_KEY), 'value'),
      socials: this.readSocials(dataByKey.get(SOCIALS_SETTING_KEY)),
    };
  }

  private readSocials(data: unknown): ContactSocial[] {
    if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
      return [];
    }

    const items = (data as Record<string, unknown>).items;
    if (!Array.isArray(items)) {
      return [];
    }

    return items.flatMap((item) => {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        return [];
      }
      const record = item as Record<string, unknown>;
      const key = this.asString(record.key);
      const title = this.asString(record.title);
      const image = this.asString(record.image);
      const fullUrl = this.asString(record.fullUrl);

      if (!key || !fullUrl) {
        return [];
      }

      return [{ key, title: title || key, image: image || '', fullUrl }];
    });
  }

  private readString(data: unknown, field: string): string | null {
    if (data === undefined || data === null || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    return this.asString((data as Record<string, unknown>)[field]);
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}
