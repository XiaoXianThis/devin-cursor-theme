// 检查展开的思考块的 opacity
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const wrappers = Array.from(panel.querySelectorAll('.highlight-wrapper'));
  out.push(`.highlight-wrapper 共 ${wrappers.length} 个，子元素数: ${wrappers.map((w) => w.children.length).join(', ')}`);

  const expanded = wrappers.filter((w) => w.children.length > 1);
  out.push(`展开状态的: ${expanded.length}`);

  for (const w of expanded.slice(0, 2)) {
    out.push(`\n--- wrapper ---`);
    Array.from(w.children).forEach((c, i) => {
      const s = getComputedStyle(c);
      const cls = typeof c.className === 'string' ? c.className : '';
      out.push(`  [${i}] ${c.tagName.toLowerCase()}.${cls.trim().split(/\s+/).slice(0, 3).join('.')}  opacity=${s.opacity} fs=${s.fontSize} lh=${s.lineHeight} color=${s.color}`);
    });
    // 我的选择器命中情况
    const sel = ':scope > div:not(.group\\/event-header)';
    let hit = null;
    try {
      hit = w.querySelector(sel);
    } catch (e) {
      out.push(`  选择器报错: ${e.message}`);
    }
    out.push(`  选择器 "${sel}" 命中: ${hit ? '是, opacity=' + getComputedStyle(hit).opacity : '否'}`);
    // 正文里的文字实际 opacity
    const p = w.querySelector('p, .flex.min-w-0.flex-col.text-12');
    if (p) {
      let cur = p;
      const chain = [];
      for (let i = 0; i < 4 && cur; i++) {
        chain.push(`opacity=${getComputedStyle(cur).opacity}`);
        cur = cur.parentElement;
      }
      out.push(`  正文文字向上 4 层 opacity: ${chain.join(' -> ')}`);
    }
  }
  return out.join('\n');
})();
