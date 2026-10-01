import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { DATABASE, type Database } from 'src/database/database.constants';
import { contactForms } from 'src/database/schema';
import type { SaveContactFormRequestDto } from '../dtos/saveContactForm/save-contact-form-request.dto';
import type { SaveContactFormResponseDto } from '../dtos/saveContactForm/save-contact-form-response.dto';
import type { ListContactFormsResponseDto } from '../dtos/listContactForms/list-contact-forms-response.dto';

type ContactFormRow = typeof contactForms.$inferSelect;

@Injectable()
export class ContactFormService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async save(dto: SaveContactFormRequestDto): Promise<SaveContactFormResponseDto> {
    const [row] = await this.db.insert(contactForms).values({ name: dto.name, phone: dto.phone, message: dto.message }).returning();
    return this.toDto(row);
  }

  async list(): Promise<ListContactFormsResponseDto[]> {
    const rows = await this.db.query.contactForms.findMany({ orderBy: desc(contactForms.createdAt) });
    return rows.map((row) => this.toDto(row));
  }

  private toDto(row: ContactFormRow): SaveContactFormResponseDto {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
