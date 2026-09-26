import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { addresses, locations } from 'src/database/schema';

export type AddressRow = typeof addresses.$inferSelect;
export type AddressWithLocation = AddressRow & { location: { id: number; province: string; city: string } };

export interface AddressCreateData {
  title: string;
  postalCode: string;
  locationId: number;
  isMain: boolean;
}

export interface AddressUpdateData {
  title?: string;
  postalCode?: string;
  locationId?: number;
  isMain?: boolean;
}

@Injectable()
export class AddressRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  listByUser(userId: number): Promise<AddressWithLocation[]> {
    return this.db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
      with: { location: true },
      orderBy: [desc(addresses.isMain), asc(addresses.createdAt), asc(addresses.id)],
    });
  }

  findByIdForUser(id: number, userId: number): Promise<AddressWithLocation | undefined> {
    return this.db.query.addresses.findFirst({
      where: and(eq(addresses.id, id), eq(addresses.userId, userId)),
      with: { location: true },
    });
  }

  async locationExists(locationId: number): Promise<boolean> {
    const row = await this.db.query.locations.findFirst({ where: eq(locations.id, locationId), columns: { id: true } });
    return Boolean(row);
  }

  create(userId: number, data: AddressCreateData): Promise<AddressRow> {
    return this.db.transaction(async (tx) => {
      // A user may only ever have one default address: clear the flag first.
      if (data.isMain) {
        await tx.update(addresses).set({ isMain: false }).where(eq(addresses.userId, userId));
      }
      const [row] = await tx
        .insert(addresses)
        .values({ ...data, userId })
        .returning();
      return row;
    });
  }

  update(id: number, userId: number, data: AddressUpdateData): Promise<number> {
    return this.db.transaction(async (tx) => {
      if (data.isMain === true) {
        await tx.update(addresses).set({ isMain: false }).where(eq(addresses.userId, userId));
      }

      const patch: AddressUpdateData = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.postalCode !== undefined) patch.postalCode = data.postalCode;
      if (data.locationId !== undefined) patch.locationId = data.locationId;
      if (data.isMain !== undefined) patch.isMain = data.isMain;

      const rows = await tx
        .update(addresses)
        .set(patch)
        .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
        .returning({ id: addresses.id });
      return rows.length;
    });
  }

  async remove(id: number, userId: number): Promise<number> {
    const rows = await this.db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning({ id: addresses.id });
    return rows.length;
  }

  setMain(id: number, userId: number): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const target = await tx.query.addresses.findFirst({
        where: and(eq(addresses.id, id), eq(addresses.userId, userId)),
        columns: { id: true },
      });
      if (!target) return false;

      await tx.update(addresses).set({ isMain: false }).where(eq(addresses.userId, userId));
      await tx.update(addresses).set({ isMain: true }).where(eq(addresses.id, id));
      return true;
    });
  }
}
