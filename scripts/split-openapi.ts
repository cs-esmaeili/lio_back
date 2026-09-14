import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

const INPUT_FILE = resolve(process.cwd(), 'openapi.json');
const OUTPUT_DIR = resolve(process.cwd(), 'api');

type Json = Record<string, any>;

interface OpenApiDocument {
  info?: Json;
  paths?: Record<string, Record<string, any>>;
  components?: { schemas?: Record<string, any> };
}

function resolveRef(document: OpenApiDocument, ref: string): any {
  const path = ref.replace(/^#\//, '').split('/');
  let current: any = document;
  for (const key of path) current = current?.[key];
  return current;
}

function createDereferencer(document: OpenApiDocument): (node: any, stack?: string[]) => any {
  const deref = (node: any, stack: string[] = []): any => {
    if (Array.isArray(node)) return node.map((item) => deref(item, stack));

    if (node && typeof node === 'object') {
      if (typeof node.$ref === 'string') {
        const ref = node.$ref;
        if (stack.includes(ref)) return { circular: ref };
        const target = resolveRef(document, ref);
        if (target === undefined) return { unresolved: ref };
        return deref(target, [...stack, ref]);
      }

      const result: Json = {};
      for (const [key, value] of Object.entries(node)) result[key] = deref(value, stack);
      return result;
    }

    return node;
  };

  return deref;
}

function toPathSegment(segment: string): string {
  const normalized = segment.startsWith(':') ? `{${segment.slice(1)}}` : segment;
  return normalized.replace(/[^A-Za-z0-9_{}.-]/g, '_');
}

function endpointDirectory(path: string): string {
  const segments = path.split('/').filter(Boolean).map(toPathSegment);
  return segments.length === 0 ? join(OUTPUT_DIR, 'root') : join(OUTPUT_DIR, ...segments);
}

function jsonBlock(value: unknown): string {
  if (value === undefined) return '_None_';
  return ['```json', JSON.stringify(value, null, 2), '```'].join('\n');
}

function renderParameters(parameters: Json[]): string {
  if (parameters.length === 0) return '_None_';

  const rows = parameters.map((parameter) => {
    const schema = parameter.schema ?? {};
    const type = schema.type ?? (schema.$ref ? 'object' : '');
    return `| ${parameter.in ?? ''} | ${parameter.name ?? ''} | ${parameter.required ? 'yes' : 'no'} | ${type} | ${parameter.description ?? ''} |`;
  });

  return [
    '| In | Name | Required | Type | Description |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function renderRequestBody(requestBody: Json | undefined): string {
  if (!requestBody) return '_None_';

  const content = requestBody.content ?? {};
  const contentType = 'application/json' in content ? 'application/json' : Object.keys(content)[0];
  if (!contentType) return '_None_';

  const schema = content[contentType]?.schema;
  return [`**Content-Type:** \`${contentType}\``, '', jsonBlock(schema)].join('\n');
}

function renderResponses(responses: Json): string {
  const sections: string[] = [];

  for (const [status, response] of Object.entries(responses)) {
    const content = (response as Json).content ?? {};
    const contentType = 'application/json' in content ? 'application/json' : Object.keys(content)[0];
    const schema = contentType ? content[contentType]?.schema : undefined;

    sections.push(`### ${status}`, '');
    sections.push(`**Description:** ${(response as Json).description ?? ''}`, '');
    if (contentType) sections.push(`**Content-Type:** \`${contentType}\``, '');
    sections.push(jsonBlock(schema), '');
  }

  return sections.join('\n').trimEnd();
}

function renderEndpoint(
  method: string,
  path: string,
  operation: Json,
  pathParameters: Json[],
  deref: (node: any) => any,
): string {
  const parameters = deref([...(pathParameters ?? []), ...(operation.parameters ?? [])]) as Json[];
  const security = operation.security ?? [];
  const securityText = security.length
    ? security.map((entry: Json) => Object.keys(entry).join(', ') || 'none').join('; ')
    : 'none';

  const lines: string[] = [
    `# ${method.toUpperCase()} ${path}`,
    '',
    `**Operation ID:** ${operation.operationId ?? '-'}`,
    `**Tags:** ${(operation.tags ?? []).join(', ') || '-'}`,
    `**Security:** ${securityText}`,
    '',
    operation.summary ? `> ${operation.summary}` : '',
    operation.description ?? '',
    '',
    '## Parameters',
    '',
    renderParameters(parameters),
    '',
    '## Request Body',
    '',
    renderRequestBody(deref(operation.requestBody)),
    '',
    '## Responses',
    '',
    renderResponses(deref(operation.responses ?? {})),
    '',
  ];

  return lines.join('\n');
}

function splitOpenApi(): void {
  const document: OpenApiDocument = JSON.parse(readFileSync(INPUT_FILE, 'utf8'));
  const deref = createDereferencer(document);

  rmSync(OUTPUT_DIR, { recursive: true, force: true });

  let count = 0;

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    const pathParameters = pathItem.parameters ?? [];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const filePath = join(endpointDirectory(path), `${method.toUpperCase()}.md`);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, renderEndpoint(method, path, operation, pathParameters, deref), 'utf8');
      count += 1;
    }
  }

  console.log(`${count} endpoint files written to ${OUTPUT_DIR}`);
}

splitOpenApi();
