import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { addresses, locations } from 'src/database/schema';

export type LocationRow = typeof locations.$inferSelect;

export interface LocationData {
  province: string;
  city: string;
}

@Injectable()
export class LocationRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  list(): Promise<LocationRow[]> {
    return this.db.query.locations.findMany({
      orderBy: [asc(locations.province), asc(locations.city), asc(locations.id)],
    });
  }

  findById(id: number): Promise<LocationRow | undefined> {
    return this.db.query.locations.findFirst({ where: eq(locations.id, id) });
  }

  async create(data: LocationData): Promise<LocationRow> {
    const [row] = await this.db.insert(locations).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<LocationData>): Promise<LocationRow | undefined> {
    const patch: Partial<LocationData> = {};
    if (data.province !== undefined) patch.province = data.province;
    if (data.city !== undefined) patch.city = data.city;

    const [row] = await this.db.update(locations).set(patch).where(eq(locations.id, id)).returning();
    return row;
  }

  async remove(id: number): Promise<number> {
    const rows = await this.db.delete(locations).where(eq(locations.id, id)).returning({ id: locations.id });
    return rows.length;
  }

  async countAddresses(locationId: number): Promise<number> {
    return this.db.$count(addresses, eq(addresses.locationId, locationId));
  }
}
