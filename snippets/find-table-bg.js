// 完整排查表格的灰色背景来自哪一层
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 5).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  };

  const tables = Array.from(panel.querySelectorAll('table'));
  out.push(`table 数量: ${tables.length}`);

  for (const t of tables.slice(0, 2)) {
    out.push(`\n========== ${describe(t)} ${R(t)} ==========`);
    const chain = [t, t.querySelector('thead'), t.querySelector('tbody'), t.querySelector('tr'), t.querySelector('th'), t.querySelector('td')];
    for (const el of chain) {
      if (!el) continue;
      const c = getComputedStyle(el);
      out.push(
        `  ${el.tagName.toLowerCase().padEnd(6)} bg=${c.backgroundColor} bgImg=${c.backgroundImage === 'none' ? '-' : 'YES'} r=${c.borderRadius} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} fs=${c.fontSize}`,
      );
    }
    out.push('  --- 向上找有背景的祖先 ---');
    let cur = t.parentElement;
    for (let i = 0; i < 8 && cur; i++) {
      const c = getComputedStyle(cur);
      const has = c.backgroundColor !== 'rgba(0, 0, 0, 0)';
      out.push(`  ↑${i} ${describe(cur)} ${R(cur)}  bg=${c.backgroundColor}${has ? '   <<< 有背景' : ''}`);
      cur = cur.parentElement;
    }
    out.push('  --- 表内所有有背景的元素 ---');
    const seen = new Set();
    for (const el of t.querySelectorAll('*')) {
      const c = getComputedStyle(el);
      if (c.backgroundColor === 'rgba(0, 0, 0, 0)') continue;
      const sig = `${el.tagName}|${c.backgroundColor}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(`    ${describe(el)} bg=${c.backgroundColor}`);
    }
  }
  return out.join('\n');
})();
