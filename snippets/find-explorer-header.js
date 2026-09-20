// 定位侧边栏里的 "Explorer" 标题栏
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 5).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `display=${c.display} h=${c.height} pad=${c.padding} m=${c.margin} bg=${c.backgroundColor} fs=${c.fontSize} fw=${c.fontWeight} tt=${c.textTransform}`;
  };

  const sidebar = document.querySelector('[id="workbench.parts.sidebar"]');
  if (!sidebar) return '未找到 sidebar';

  out.push('=== sidebar 直接子元素 ===');
  Array.from(sidebar.children).forEach((c, i) => {
    out.push(`  [${i}] ${describe(c)} ${R(c)}`);
    out.push(`      ${S(c)}`);
  });

  out.push('\n=== 含 "Explorer" 文字的叶子节点 ===');
  const leaves = Array.from(sidebar.querySelectorAll('*')).filter(
    (el) => el.children.length === 0 && (el.textContent || '').trim() === 'Explorer',
  );
  out.push(`  命中 ${leaves.length} 个`);
  for (const leaf of leaves.slice(0, 3)) {
    out.push(`  叶子: ${describe(leaf)} ${R(leaf)}  ${S(leaf)}`);
    let cur = leaf;
    for (let i = 0; i < 7 && cur; i++) {
      out.push(`    ↑${i} ${describe(cur)} ${R(cur)}`);
      out.push(`        ${S(cur)}`);
      cur = cur.parentElement;
    }
  }

  out.push('\n=== 结构里带 pane-header / composite 的元素 ===');
  const seen = new Set();
  for (const el of sidebar.querySelectorAll('[class*="pane-header"], [class*="composite"], [class*="title"]')) {
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.width === 0) continue;
    const sig = `${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(el)} ${R(el)}  ${S(el)}  "${(el.textContent || '').trim().slice(0, 25)}"`);
  }
  return out.join('\n');
})();
