// 看 Devin 聊天里表格的现状
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `bg=${c.backgroundColor} borderTop=${c.borderTopWidth}/${c.borderTopStyle}/${c.borderTopColor} borderLeft=${c.borderLeftWidth} r=${c.borderRadius} pad=${c.padding} fs=${c.fontSize} lh=${c.lineHeight} m=${c.margin} collapse=${c.borderCollapse}`;
  };

  const tables = Array.from(panel.querySelectorAll('.prose-main table'));
  out.push(`.prose-main 内 table 数量: ${tables.length}`);
  for (const t of tables.slice(0, 2)) {
    out.push(`\n--- ${describe(t)} ---`);
    out.push(`  ${S(t)}`);
    const th = t.querySelector('th');
    const td = t.querySelector('td');
    const tr = t.querySelector('tr');
    if (th) out.push(`  th: ${S(th)}`);
    if (td) out.push(`  td: ${S(td)}`);
    if (tr) out.push(`  tr: ${S(tr)}`);
    // 找带背景色的单元格/行
    const seen = new Set();
    for (const el of t.querySelectorAll('*')) {
      const c = getComputedStyle(el);
      if (c.backgroundColor === 'rgba(0, 0, 0, 0)') continue;
      const sig = `${el.tagName}|${c.backgroundColor}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(`  有背景: ${describe(el)} bg=${c.backgroundColor} pad=${c.padding} border=${c.borderTopWidth}/${c.borderTopColor}`);
    }
    if (!seen.size) out.push('  (表内无任何背景色)');
  }
  return out.join('\n');
})();
