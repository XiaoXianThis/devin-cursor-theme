// Zero-dependency Chrome DevTools Protocol client for Devin (Electron) UI debugging.
// Requires the app to be started with --remote-debugging-port=9222.
//
// Usage:
//   node tools/cdp.mjs list
//   node tools/cdp.mjs eval <targetPattern> "<js>"
//   node tools/cdp.mjs evalfile <targetPattern> <file.js>
//   node tools/cdp.mjs shot <targetPattern> <out.png>
//   node tools/cdp.mjs dom  <targetPattern> <selector> [depth]
//   node tools/cdp.mjs css  <targetPattern> <cssFile|inline css>

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const PORT = process.env.CDP_PORT ?? 9222;
const HOST = `http://127.0.0.1:${PORT}`;

async function fetchTargets() {
  const res = await fetch(`${HOST}/json/list`);
  if (!res.ok) throw new Error(`GET /json/list -> ${res.status}`);
  return res.json();
}

function pickTargets(targets, pattern) {
  if (!pattern) return targets.filter((t) => t.type === 'page');
  const p = pattern.toLowerCase();
  const hits = targets.filter(
    (t) => (t.url ?? '').toLowerCase().includes(p) || (t.title ?? '').toLowerCase().includes(p),
  );
  if (!hits.length) {
    throw new Error(
      `no target matched "${pattern}". Available:\n` +
        targets.map((t) => `  [${t.type}] ${t.title}\n      ${t.url}`).join('\n'),
    );
  }
  return hits;
}

class Cdp {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve(this);
      this.ws.onerror = (e) => reject(new Error(`ws error: ${e.message ?? e.type}`));
      this.ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id === undefined) return; // event, ignore
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
      };
      this.ws.onclose = () => {
        for (const p of this.pending.values()) p.reject(new Error('ws closed'));
        this.pending.clear();
      };
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    this.ws?.close();
  }
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (res.exceptionDetails) {
    throw new Error(`eval threw: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`);
  }
  return res.result?.value;
}

async function withTarget(pattern, fn) {
  const targets = await fetchTargets();
  const [target] = pickTargets(targets, pattern);
  if (!target?.webSocketDebuggerUrl) throw new Error(`target "${target?.title}" has no debugger url`);
  const cdp = await new Cdp(target.webSocketDebuggerUrl).connect();
  try {
    await cdp.send('Runtime.enable');
    return await fn(cdp, target);
  } finally {
    cdp.close();
  }
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'list': {
    const targets = await fetchTargets();
    for (const t of targets) {
      console.log(`[${t.type}] ${t.title}`);
      console.log(`    ${t.url}`);
      console.log(`    ws: ${t.webSocketDebuggerUrl ?? '(none)'}`);
    }
    break;
  }

  case 'eval':
  case 'evalfile': {
    const [pattern, exprOrFile] = args;
    if (!pattern || !exprOrFile) throw new Error(`usage: ${cmd} <targetPattern> <js|file.js>`);
    const expr = cmd === 'evalfile' ? readFileSync(exprOrFile, 'utf8') : exprOrFile;
    const out = await withTarget(pattern, (cdp) => evaluate(cdp, expr));
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    break;
  }

  case 'shot': {
    const [pattern, outFile] = args;
    if (!pattern || !outFile) throw new Error('usage: shot <targetPattern> <out.png>');
    const buf = await withTarget(pattern, async (cdp) => {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      return Buffer.from(data, 'base64');
    });
    writeFileSync(outFile, buf);
    console.log(`wrote ${outFile} (${buf.length} bytes)`);
    break;
  }

  case 'dom': {
    const [pattern, selector = 'body', depth = '4'] = args;
    if (!pattern) throw new Error('usage: dom <targetPattern> <selector> [depth]');
    const expr = `(() => {
      const root = document.querySelector(${JSON.stringify(selector)});
      if (!root) return 'selector not found: ' + ${JSON.stringify(selector)};
      const max = ${Number(depth)};
      const walk = (el, d, indent) => {
        if (d > max) return '';
        const id = el.id ? '#' + el.id : '';
        const cls = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\\s+/).join('.')
          : '';
        const own = Array.from(el.children).length;
        let line = indent + el.tagName.toLowerCase() + id + cls + (own ? '' : '  "' + (el.textContent ?? '').trim().slice(0, 60) + '"') + '\\n';
        for (const c of el.children) line += walk(c, d + 1, indent + '  ');
        return line;
      };
      return walk(root, 0, '');
    })()`;
    const out = await withTarget(pattern, (cdp) => evaluate(cdp, expr));
    console.log(out);
    break;
  }

  case 'css': {
    const [pattern, source] = args;
    if (!pattern || !source) throw new Error('usage: css <targetPattern> <cssFile|inline css>');
    const css = existsSync(source) ? readFileSync(source, 'utf8') : source;
    await withTarget(pattern, async (cdp) => {
      await evaluate(
        cdp,
        `(() => {
          const id = '__devin_debug_css__';
          let el = document.getElementById(id);
          if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
          el.textContent = ${JSON.stringify(css)};
          return 'injected ' + ${JSON.stringify(css)}.length + ' chars';
        })()`,
      );
    });
    console.log('css injected');
    break;
  }

  default:
    console.log(
      [
        'commands:',
        '  list',
        '  eval <targetPattern> "<js>"',
        '  evalfile <targetPattern> <file.js>',
        '  shot <targetPattern> <out.png>',
        '  dom  <targetPattern> <selector> [depth]',
        '  css  <targetPattern> <cssFile|inline css>',
      ].join('\n'),
    );
    process.exit(cmd ? 1 : 0);
}
