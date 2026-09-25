import { Injectable, NotFoundException } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join } from 'node:path';
import { PaginationService } from 'src/common/services/pagination.service';
import { COMBINED_SCOPE, DEFAULT_LOG_DIR, SCOPE_RE } from 'src/logger/logger.constants';
import type { ListLogMetaResponseDto } from './dtos/listLogMeta/list-log-meta-response.dto';
import type { ReadLogEntriesRequestDto } from './dtos/readLogEntries/read-log-entries-request.dto';
import type { LogEntryDto, ReadLogEntriesResponseDto } from './dtos/readLogEntries/read-log-entries-response.dto';

const DATE_FILE_RE = /^(\d{4}-\d{2}-\d{2})\.log$/;

/**
 * Reads the JSON-line log files written by `AppLogger`.
 *
 * `logs/combined/<date>.log` holds every entry, while `logs/<scope>/<date>.log`
 * holds one service's entries. The viewer reads whichever the request selects
 * and filters by level/scope.
 */
@Injectable()
export class LogViewerService {
  constructor(private readonly pagination: PaginationService) {}

  /** Available dates (newest first) and the sources that can be opened. */
  async listMeta(): Promise<ListLogMetaResponseDto> {
    const entries = await readdir(DEFAULT_LOG_DIR, { withFileTypes: true }).catch((): Dirent[] => []);
    const scopes = entries
      .filter((entry) => entry.isDirectory() && SCOPE_RE.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => (a === COMBINED_SCOPE ? -1 : b === COMBINED_SCOPE ? 1 : a.localeCompare(b)));

    const files = await readdir(join(DEFAULT_LOG_DIR, COMBINED_SCOPE)).catch(() => [] as string[]);
    const dates = files
      .map((name) => DATE_FILE_RE.exec(name)?.[1])
      .filter((date): date is string => Boolean(date))
      .sort((a, b) => b.localeCompare(a));

    return { dates, scopes };
  }

  /** Read, filter and paginate one date of one source, newest first. */
  async readEntries(query: ReadLogEntriesRequestDto): Promise<ReadLogEntriesResponseDto> {
    const source = query.source && SCOPE_RE.test(query.source) ? query.source : COMBINED_SCOPE;
    const file = join(DEFAULT_LOG_DIR, source, `${query.date}.log`);
    const content = await readFile(file, 'utf8').catch(() => {
      throw new NotFoundException(`No logs found for ${query.date} in ${source}`);
    });

    const entries = content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => this.parseLine(line))
      .filter((entry): entry is LogEntryDto => entry !== null);

    const filtered = this.applyFilters(entries, query).reverse();
    const { page, limit, skip, take } = this.pagination.resolveOffset(query);

    return {
      date: query.date,
      source,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      entries: filtered.slice(skip, skip + take),
    };
  }

  private applyFilters(entries: LogEntryDto[], query: ReadLogEntriesRequestDto): LogEntryDto[] {
    let result = entries;
    if (query.scope) {
      result = result.filter((entry) => entry.scope === query.scope);
    }
    if (query.level) {
      result = result.filter((entry) => entry.levelName === query.level);
    }
    if (query.search) {
      const needle = query.search.toLowerCase();
      result = result.filter((entry) => JSON.stringify(entry).toLowerCase().includes(needle));
    }
    return result;
  }

  private parseLine(line: string): LogEntryDto | null {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }

    const { time, level, scope, message, ...meta } = raw;
    const hasLevel = typeof level === 'number' || typeof level === 'string';
    return {
      time: typeof time === 'string' ? time : null,
      level: hasLevel ? level : null,
      levelName: typeof level === 'string' ? level : null,
      scope: typeof scope === 'string' ? scope : null,
      message: message ?? null,
      meta,
    };
  }
}
