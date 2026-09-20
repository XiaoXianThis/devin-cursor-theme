// 直接测量候选元素，排查 0x0 的成因
(() => {
  const sels = [
    '#windsurf',
    '#windsurf.cascadePanel',
    '.cascadePanel',
    '#chat',
    '.windsurf-welcome-container',
    '#workbench.parts.editor',
    '.cascade-scrollbar',
  ];
  const out = [];
  for (const s of sels) {
    const els = Array.from(document.querySelectorAll(s));
    if (!els.length) {
      out.push(`${s}  -> NOT FOUND`);
      continue;
    }
    out.push(`${s}  -> ${els.length} 个匹配`);
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push(
        `    [${i}] ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)}  display=${cs.display} visibility=${cs.visibility} contain=${cs.contain} contentVisibility=${cs.contentVisibility}`,
      );
    });
  }
  return out.join('\n');
})();
