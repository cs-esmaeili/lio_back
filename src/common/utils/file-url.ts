const DEFAULT_URL_PREFIX = '/uploads/';

/**
 * Build a public URL for a stored file path.
 * Returns `null` when there is no file path (or the file reference is null).
 */
export function toFileUrl(filePath: string | null | undefined, urlPrefix: string = DEFAULT_URL_PREFIX): string | null {
  if (!filePath) {
    return null;
  }

  const prefix = urlPrefix.endsWith('/') ? urlPrefix : `${urlPrefix}/`;
  return `${prefix}${filePath.replace(/^\/+/, '')}`;
}
