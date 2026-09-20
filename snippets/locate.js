// 按文字定位元素：打印祖先链（完整 class）+ 自身 outerHTML + 父节点子元素概览
(() => {
  const texts = ['Local', 'Quick review', 'Bypass Per', 'New space', 'Go to sessions list'];

  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };

  const chain = (el) => {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      const cls = typeof cur.className === 'string' ? cur.className : '';
      parts.unshift(
        `${cur.tagName.toLowerCase()}${cur.id ? ` id="${cur.id}"` : ''}${cls ? ` class="${cls}"` : ''}  ${rect(cur)}`,
      );
      cur = cur.parentElement;
    }
    return parts;
  };

  const out = [];
  for (const t of texts) {
    const hits = Array.from(document.querySelectorAll('*')).filter(
      (el) => (el.textContent || '').trim().includes(t) && el.getBoundingClientRect().width > 0,
    );
    if (!hits.length) {
      out.push(`\n===== "${t}" -> 屏幕内无匹配 =====`);
      continue;
    }
    const deepest = hits[hits.length - 1];
    out.push(`\n===== "${t}" -> ${hits.length} 个可见匹配，最深者: =====`);
    out.push(chain(deepest).map((l) => '  ' + l).join('\n'));
    out.push(`  --- outerHTML: ${deepest.outerHTML.slice(0, 400)}`);
    const parent = deepest.parentElement;
    if (parent) {
      out.push(`  --- 父节点 ${parent.tagName.toLowerCase()} class="${parent.className}" 有 ${parent.children.length} 个子元素:`);
      Array.from(parent.children).forEach((c, i) => {
        const cls = typeof c.className === 'string' ? c.className.split(/\s+/).slice(0, 3).join(' ') : '';
        out.push(`      [${i}] ${c.tagName.toLowerCase()} "${(c.textContent || '').trim().slice(0, 40)}" ${cls}`);
      });
    }
  }
  return out.join('\n');
})();
