/**
 * Server-rendered shell for the log viewer. Styles and the small dashboard
 * script are inlined so the page is a single guarded response with no build
 * step or external assets.
 */
export function renderLogViewerPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Log Viewer</title>
<style>
  :root {
    --bg: #0f1115;
    --panel: #171a21;
    --panel-2: #1e222b;
    --border: #2a303c;
    --text: #e6e9ef;
    --muted: #8b93a7;
    --accent: #4f8cff;
    --error: #ff5d5d;
    --warn: #ffb454;
    --info: #4fd1c5;
    --debug: #9aa4bf;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  }
  .wrap { max-width: 1200px; margin: 0 auto; padding: 24px 20px 48px; }
  h1 { font-size: 20px; margin: 0; }
  .muted { color: var(--muted); }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .top-actions { display: flex; align-items: center; gap: 12px; }
  .switch { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); cursor: pointer; user-select: none; }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    padding: 14px;
    margin-bottom: 14px;
  }
  .filters label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
  .filters .grow { flex: 1 1 220px; min-width: 180px; }
  select, input[type="search"] {
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    min-height: 36px;
  }
  input[type="search"] { width: 100%; }
  select:focus, input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  .btn {
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    font: inherit;
    cursor: pointer;
    min-height: 36px;
  }
  .btn:hover { border-color: #3a4252; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: #06101f; font-weight: 600; }
  .stats { display: flex; justify-content: space-between; gap: 12px; margin: 6px 2px; }
  .alert {
    background: rgba(255, 93, 93, 0.12);
    border: 1px solid rgba(255, 93, 93, 0.5);
    color: #ffb3b3;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
  }
  .table-card { overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--panel-2);
  }
  tbody td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tr.row:hover { background: rgba(255, 255, 255, 0.03); }
  .c-time { white-space: nowrap; color: var(--muted); width: 190px; }
  .c-level { width: 90px; }
  .c-channel { width: 110px; }
  .c-request { width: 100px; }
  .c-meta { width: 64px; text-align: right; }
  .message { word-break: break-word; cursor: pointer; }
  .badge {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
  }
  .badge.fatal { background: rgba(255, 93, 93, 0.9); color: #14060a; }
  .badge.error { background: rgba(255, 93, 93, 0.18); color: #ff8b8b; border-color: rgba(255, 93, 93, 0.5); }
  .badge.warn { background: rgba(255, 180, 84, 0.16); color: var(--warn); border-color: rgba(255, 180, 84, 0.45); }
  .badge.info { background: rgba(79, 209, 197, 0.14); color: var(--info); border-color: rgba(79, 209, 197, 0.4); }
  .badge.debug, .badge.trace { background: rgba(154, 164, 191, 0.14); color: var(--debug); border-color: rgba(154, 164, 191, 0.4); }
  .chip {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 6px;
    font-size: 12px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    color: var(--text);
  }
  .link {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font: inherit;
    padding: 0;
  }
  .detail td { background: #0c0e13; }
  .detail pre {
    margin: 0;
    padding: 10px 2px;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    color: #c7cede;
  }
  .empty { text-align: center; color: var(--muted); padding: 28px 12px; }
  .pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 16px; }
  @media (max-width: 720px) {
    .c-channel, .c-time { width: auto; }
    thead { display: none; }
    tbody td { display: block; width: 100%; }
  }
</style>
</head>
<body>
<main class="wrap">
  <header class="top">
    <div>
      <h1>Log Viewer</h1>
      <p class="muted" style="margin:4px 0 0">Application logs, one file per day.</p>
    </div>
    <div class="top-actions">
      <label class="switch"><input type="checkbox" id="auto" /> Auto refresh</label>
      <button class="btn" id="refresh" type="button">Refresh</button>
    </div>
  </header>

  <section class="filters card">
    <label>Date
      <select id="date"></select>
    </label>
    <label>Source
      <select id="source"></select>
    </label>
    <label>Level
      <select id="level">
        <option value="" selected>All levels</option>
        <option value="fatal">fatal</option>
        <option value="error">error</option>
        <option value="warn">warn</option>
        <option value="info">info</option>
        <option value="debug">debug</option>
      </select>
    </label>
    <label>Scope
      <select id="scope"></select>
    </label>
    <label class="grow">Search
      <input id="search" type="search" placeholder="text in message or fields" />
    </label>
    <label>Per page
      <select id="limit">
        <option value="25">25</option>
        <option value="50" selected>50</option>
        <option value="100">100</option>
      </select>
    </label>
    <button class="btn primary" id="apply" type="button">Apply</button>
  </section>

  <div id="error" class="alert" hidden></div>

  <div class="stats">
    <span id="summary" class="muted">Loading...</span>
  </div>

  <section class="card table-card">
    <table>
      <thead>
        <tr>
          <th class="c-time">Time</th>
          <th class="c-level">Level</th>
          <th class="c-channel">Scope</th>
          <th class="c-request">Request</th>
          <th>Message</th>
          <th class="c-meta"></th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </section>

  <div class="pager">
    <button class="btn" id="prev" type="button">Prev</button>
    <span id="pageinfo" class="muted"></span>
    <button class="btn" id="next" type="button">Next</button>
  </div>
</main>

<script>
(function () {
  'use strict';

  var state = { page: 1, totalPages: 0, autoTimer: null };
  var AUTO_MS = 5000;

  function el(id) { return document.getElementById(id); }

  function setError(message) {
    var box = el('error');
    if (!message) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.textContent = message;
  }

  function request(url) {
    return fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (body) {
        if (!res.ok) {
          var message = 'Request failed (' + res.status + ')';
          if (res.status === 401) message = 'You are not logged in. Log in first and reload this page.';
          if (res.status === 403) message = 'Your account is missing the log:read permission.';
          throw new Error(message);
        }
        return body && body.data !== undefined ? body.data : body;
      });
    });
  }

  function option(value, label) {
    var opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    return opt;
  }

  function fillDates(dates) {
    var select = el('date');
    select.innerHTML = '';
    if (!dates.length) {
      select.appendChild(option('', 'No logs'));
      return;
    }
    dates.forEach(function (date) { select.appendChild(option(date, date)); });
  }

  function fillSources(sources) {
    var select = el('source');
    select.innerHTML = '';
    var list = sources.length ? sources : ['combined'];
    list.forEach(function (source) { select.appendChild(option(source, source)); });
  }

  function fillScopes(scopes) {
    var select = el('scope');
    select.innerHTML = '';
    select.appendChild(option('', 'All scopes'));
    scopes
      .filter(function (scope) { return scope !== 'combined'; })
      .forEach(function (scope) { select.appendChild(option(scope, scope)); });
  }

  function formatTime(iso) {
    if (!iso) return '-';
    var date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleString();
  }

  function formatMessage(message) {
    if (message === null || message === undefined) return '';
    if (typeof message === 'string') return message;
    try { return JSON.stringify(message); } catch (err) { return String(message); }
  }

  function levelClass(name) {
    if (name === 'fatal') return 'fatal';
    if (name === 'error') return 'error';
    if (name === 'warn') return 'warn';
    if (name === 'info') return 'info';
    return 'debug';
  }

  function entryRows(entry) {
    var fragment = document.createDocumentFragment();

    var row = document.createElement('tr');
    row.className = 'row';

    var time = document.createElement('td');
    time.className = 'c-time mono';
    time.textContent = formatTime(entry.time);

    var level = document.createElement('td');
    level.className = 'c-level';
    var badge = document.createElement('span');
    badge.className = 'badge ' + levelClass(entry.levelName);
    badge.textContent = entry.levelName || '-';
    level.appendChild(badge);

    var scope = document.createElement('td');
    scope.className = 'c-channel';
    var chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = entry.scope || '-';
    scope.appendChild(chip);

    var request = document.createElement('td');
    request.className = 'c-request mono';
    request.textContent = entry.requestId ? entry.requestId.slice(0, 8) : '-';
    request.title = entry.requestId || '';

    var message = document.createElement('td');
    message.className = 'message';
    message.textContent = formatMessage(entry.message);

    var actions = document.createElement('td');
    actions.className = 'c-meta';
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'link';
    toggle.textContent = 'JSON';
    actions.appendChild(toggle);

    row.appendChild(time);
    row.appendChild(level);
    row.appendChild(scope);
    row.appendChild(request);
    row.appendChild(message);
    row.appendChild(actions);

    var detail = document.createElement('tr');
    detail.className = 'detail';
    detail.hidden = true;
    var detailCell = document.createElement('td');
    detailCell.colSpan = 6;
    var pre = document.createElement('pre');
    var full = { time: entry.time, level: entry.level, scope: entry.scope, requestId: entry.requestId, message: entry.message };
    Object.keys(entry.meta || {}).forEach(function (key) { full[key] = entry.meta[key]; });
    try { pre.textContent = JSON.stringify(full, null, 2); } catch (err) { pre.textContent = String(full); }
    detailCell.appendChild(pre);
    detail.appendChild(detailCell);

    function flip() { detail.hidden = !detail.hidden; }
    toggle.addEventListener('click', flip);
    message.addEventListener('click', flip);

    fragment.appendChild(row);
    fragment.appendChild(detail);
    return fragment;
  }

  function renderEntries(result) {
    var rows = el('rows');
    rows.innerHTML = '';

    if (!result.entries.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 6;
      emptyCell.className = 'empty';
      emptyCell.textContent = 'No entries match the current filters.';
      emptyRow.appendChild(emptyCell);
      rows.appendChild(emptyRow);
    } else {
      result.entries.forEach(function (entry) { rows.appendChild(entryRows(entry)); });
    }

    state.totalPages = result.totalPages;
    state.page = result.page;
    el('summary').textContent = result.total + ' entries in ' + result.source + ' on ' + result.date;
    el('pageinfo').textContent = 'Page ' + result.page + ' / ' + Math.max(result.totalPages, 1);
    el('prev').disabled = result.page <= 1;
    el('next').disabled = result.page >= result.totalPages;
  }

  function loadEntries() {
    var date = el('date').value;
    if (!date) {
      el('summary').textContent = 'No log files found.';
      el('rows').innerHTML = '';
      return;
    }

    setError('');
    var params = new URLSearchParams();
    params.set('date', date);
    params.set('source', el('source').value || 'combined');
    if (el('level').value) params.set('level', el('level').value);
    if (el('scope').value) params.set('scope', el('scope').value);
    if (el('search').value.trim()) params.set('search', el('search').value.trim());
    params.set('page', String(state.page));
    params.set('limit', el('limit').value);

    el('summary').textContent = 'Loading...';
    request('/admin/logs/entries?' + params.toString())
      .then(renderEntries)
      .catch(function (err) { setError(err.message); });
  }

  function applyFilters() {
    state.page = 1;
    loadEntries();
  }

  function loadMeta() {
    return request('/admin/logs/meta').then(function (meta) {
      fillDates(meta.dates || []);
      fillSources(meta.scopes || []);
      fillScopes(meta.scopes || []);
      if (!(meta.dates || []).length) setError('No log files found yet.');
    });
  }

  function setAutoRefresh(enabled) {
    if (state.autoTimer) {
      clearInterval(state.autoTimer);
      state.autoTimer = null;
    }
    if (enabled) {
      state.autoTimer = setInterval(loadEntries, AUTO_MS);
    }
  }

  el('apply').addEventListener('click', applyFilters);
  el('date').addEventListener('change', applyFilters);
  el('source').addEventListener('change', applyFilters);
  el('level').addEventListener('change', applyFilters);
  el('scope').addEventListener('change', applyFilters);
  el('limit').addEventListener('change', applyFilters);
  el('search').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') applyFilters();
  });
  el('prev').addEventListener('click', function () {
    if (state.page > 1) { state.page = state.page - 1; loadEntries(); }
  });
  el('next').addEventListener('click', function () {
    if (state.page < state.totalPages) { state.page = state.page + 1; loadEntries(); }
  });
  el('refresh').addEventListener('click', function () { loadMeta().then(loadEntries); });
  el('auto').addEventListener('change', function (event) { setAutoRefresh(event.target.checked); });

  loadMeta()
    .then(function () { if (el('date').value) loadEntries(); })
    .catch(function (err) { setError(err.message); });
})();
</script>
</body>
</html>`;
}
