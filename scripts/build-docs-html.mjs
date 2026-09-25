#!/usr/bin/env node
/**
 * Convert a Markdown document into a single, self-contained, RTL Persian HTML file.
 *
 * Uses `cmark-gfm` (GitHub Flavored Markdown) for the Markdown -> HTML body,
 * then wraps it in a styled RTL template with a generated table of contents.
 *
 * Usage:
 *   node scripts/build-docs-html.mjs <input.md> [output.html]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('usage: node scripts/build-docs-html.mjs <input.md> [output.html]');
  process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
if (!existsSync(inputPath)) {
  console.error(`input not found: ${inputPath}`);
  process.exit(1);
}

const outputPath = resolve(process.cwd(), outputArg ?? inputArg.replace(/\.md$/i, '.html'));

function runCmark() {
  const result = spawnSync(
    'cmark-gfm',
    ['-e', 'table', '-e', 'strikethrough', '-e', 'autolink', '-e', 'tasklist', '-e', 'footnotes', '--github-pre-lang', '-t', 'html', inputPath],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.error) {
    console.error(`failed to run cmark-gfm: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(result.stderr || `cmark-gfm exited with code ${result.status}`);
    process.exit(1);
  }
  return result.stdout;
}

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (value) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function buildTocAndAnchor(html) {
  const headings = [];
  let counter = 0;

  const withIds = html.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) => {
    counter += 1;
    const id = `h-${counter}`;
    headings.push({ id, level: Number(level), text: stripTags(inner) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  const items = headings.filter((h) => h.level > 1);
  const toc = items.length
    ? [
        '<nav class="toc" aria-label="فهرست مطالب">',
        '  <p class="toc-title">فهرست مطالب</p>',
        '  <ol>',
        ...items.map((h) => `    <li class="toc-level-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`),
        '  </ol>',
        '</nav>',
      ].join('\n')
    : '';

  return { html: withIds, toc };
}

function page({ title, toc, body }) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg: #f6f7f9; --surface: #ffffff; --text: #1f2933; --muted: #5b6672;
    --border: #e3e6ea; --accent: #2f6fed; --accent-soft: #eaf1fe;
    --code-bg: #f2f4f7; --code-border: #e0e4ea; --th-bg: #eef1f5; --stripe: #f9fafb; --radius: 10px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1217; --surface: #171b22; --text: #e6e9ee; --muted: #9aa4b2;
      --border: #262c36; --accent: #6ea1ff; --accent-soft: #1b2942;
      --code-bg: #11151c; --code-border: #242b36; --th-bg: #1c222c; --stripe: #141920;
    }
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font-family: 'Vazirmatn', 'Segoe UI', Tahoma, 'Noto Naskh Arabic', sans-serif;
    font-size: 16px; line-height: 1.95; -webkit-font-smoothing: antialiased; }
  .layout { max-width: 1180px; margin: 0 auto; padding: 28px 20px 80px;
    display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 28px; align-items: start; }
  @media (max-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr); } }
  .content { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 28px 32px 40px; min-width: 0; }
  @media (max-width: 600px) { .content { padding: 20px 16px 28px; } }
  .toc { position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow: auto; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; font-size: 14px; }
  @media (max-width: 960px) { .toc { position: static; max-height: none; } }
  .toc-title { margin: 0 0 10px; font-weight: 700; color: var(--muted); font-size: 13px; letter-spacing: .02em; }
  .toc ol { margin: 0; padding: 0; list-style: none; }
  .toc li { margin: 3px 0; }
  .toc a { color: var(--text); text-decoration: none; display: block; padding: 3px 6px; border-radius: 6px; }
  .toc a:hover { background: var(--accent-soft); color: var(--accent); }
  .toc-level-3 { padding-inline-start: 14px; font-size: 13px; opacity: .85; }
  h1, h2, h3, h4 { line-height: 1.6; font-weight: 700; }
  h1 { font-size: 28px; margin: 0 0 18px; padding-bottom: 12px; border-bottom: 2px solid var(--border); }
  h2 { font-size: 22px; margin: 40px 0 14px; padding-top: 6px; }
  h3 { font-size: 18px; margin: 26px 0 10px; }
  h4 { font-size: 16px; margin: 20px 0 8px; }
  h2::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: var(--accent); margin-inline-end: 10px; vertical-align: middle; }
  p { margin: 10px 0; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  hr { border: 0; border-top: 1px solid var(--border); margin: 34px 0; }
  ul, ol { padding-inline-start: 26px; }
  li { margin: 4px 0; }
  li > input[type=checkbox] { margin-inline-end: 6px; }
  blockquote { margin: 14px 0; padding: 10px 16px; background: var(--accent-soft);
    border-inline-start: 4px solid var(--accent); border-radius: 6px; }
  blockquote p { margin: 4px 0; }
  code { font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace; font-size: .88em;
    background: var(--code-bg); border: 1px solid var(--code-border); border-radius: 5px; padding: .12em .38em;
    direction: ltr; unicode-bidi: embed; white-space: pre-wrap; }
  pre { direction: ltr; text-align: left; background: var(--code-bg); border: 1px solid var(--code-border);
    border-radius: 8px; padding: 14px 16px; overflow: auto; line-height: 1.6; margin: 14px 0; }
  pre code { background: none; border: 0; padding: 0; white-space: pre; font-size: .86em; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14.5px; display: block; overflow-x: auto; }
  thead th { background: var(--th-bg); font-weight: 700; text-align: right; white-space: nowrap; }
  th, td { border: 1px solid var(--border); padding: 9px 12px; vertical-align: top; }
  tbody tr:nth-child(even) { background: var(--stripe); }
  td code { white-space: nowrap; }
  footer.doc-foot { grid-column: 1 / -1; text-align: center; color: var(--muted); font-size: 13px; margin-top: 8px; }
  @media print { body { background: #fff; } .toc { display: none; }
    .layout { display: block; max-width: none; padding: 0; } .content { border: 0; padding: 0; } a { color: inherit; } }
</style>
</head>
<body>
  <div class="layout">
${toc}
    <main class="content">
${body}
    </main>
    <footer class="doc-foot">ساخته‌شده از Markdown — Lio</footer>
  </div>
</body>
</html>
`;
}

const markdownHtml = runCmark();
const { html: body, toc } = buildTocAndAnchor(markdownHtml);
const firstHeading = markdownHtml.match(/<h1>([\s\S]*?)<\/h1>/);
const title = firstHeading ? stripTags(firstHeading[1]) : inputArg;

const output = page({ title, toc, body });

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output, 'utf8');
console.log(`wrote ${outputPath} (${(output.length / 1024).toFixed(1)} KiB)`);
