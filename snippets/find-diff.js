// 定位 Devin 的：① composer 文件变更条 + accept 栏 ② 消息里的 diff（文件写入）块
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 5).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const cs = (el) => {
    const c = getComputedStyle(el);
    return `r=${c.borderRadius} bd=${c.borderTopWidth}/${c.borderTopColor} bg=${c.backgroundColor} pad=${c.padding} fs=${c.fontSize} lh=${c.lineHeight}`;
  };
  const walk = (el, d, max = 3) => {
    if (d > max) return;
    out.push(`${'  '.repeat(d)}${describe(el)} ${rect(el)} ${cs(el)}`);
    for (const c of el.children) walk(c, d + 1, max);
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到聊天面板';

  // ① composer 上方的文件变更条
  out.push('=== ① composer 文件变更条 ===');
  const bar = panel.querySelector('[class*="bottom-full"]');
  if (bar) walk(bar, 0, 4);
  else out.push('  未找到');

  // ② 消息里的 diff 块：找带红/绿背景的元素
  out.push('\n=== ② diff 行（按背景色找）===');
  const parseRgb = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const seen = new Set();
  let n = 0;
  for (const el of panel.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!(r.width > 100 && r.height > 6)) continue;
    const c = getComputedStyle(el);
    const col = parseRgb(c.backgroundColor);
    if (!col || col.a < 0.02) continue;
    const greenish = col.g > col.r + 18 && col.g > col.b + 8;
    const reddish = col.r > col.g + 18;
    if (!greenish && !reddish) continue;
    const sig = `${greenish ? 'G' : 'R'}|${c.backgroundColor}|${c.borderRadius}|${(typeof el.className === 'string' ? el.className : '').slice(0, 30)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    n++;
    out.push(`  ${greenish ? '绿' : '红'} ${describe(el)} ${rect(el)}`);
    out.push(`      bg=${c.backgroundColor} radius=${c.borderRadius} fs=${c.fontSize} lh=${c.lineHeight} pad=${c.padding}`);
    if (n >= 10) break;
  }
  if (!n) out.push('  未找到红/绿背景元素');

  // ③ 文件写入卡片的头部
  out.push('\n=== ③ 含文件名 + 计数 的卡片头部 ===');
  const cards = Array.from(panel.querySelectorAll('.group\\/card'));
  out.push(`  .group/card 数量: ${cards.length}`);
  const diffCards = cards.filter((c) => /[+-]\d+/.test(c.textContent || ''));
  out.push(`  含 +/- 计数的: ${diffCards.length}`);
  if (diffCards.length) {
    const c = diffCards[diffCards.length - 1];
    out.push(`  样例卡片 ${rect(c)} ${cs(c)}`);
    walk(c, 0, 2);
  }
  return out.join('\n');
})();
