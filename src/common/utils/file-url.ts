/**
 * Build an absolute public URL for a stored file path.
 * The app origin is prepended to the uploads url prefix.
 * Returns `null` when there is no file path (or the file reference is null).
 */
export function toFileUrl(filePath: string | null | undefined, urlPrefix: string, origin: string): string | null {
  if (!filePath) {
    return null;
  }

  const prefix = urlPrefix.endsWith('/') ? urlPrefix : `${urlPrefix}/`;
  const relativeUrl = `${prefix}${filePath.replace(/^\/+/, '')}`;

  if (/^https?:\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }

  return `${origin.replace(/\/+$/, '')}${relativeUrl}`;
}
