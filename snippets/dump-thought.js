// 若没有已展开的思考块就点开一个；若已有则 dump 其结构
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
  const style = (el) => {
    const cs = getComputedStyle(el);
    return `fs=${cs.fontSize} lh=${cs.lineHeight} color=${cs.color} ls=${cs.letterSpacing}`;
  };

  const headers = Array.from(document.querySelectorAll('.group\\/event-header'));
  const expanded = headers.filter((h) => h.querySelector('button[aria-expanded="true"]'));
  out.push(`event-header 总数 ${headers.length}，已展开 ${expanded.length}`);

  if (!expanded.length) {
    const near = headers.filter((h) => {
      const y = h.getBoundingClientRect().y;
      return y > -600 && y < 900;
    });
    const t = near[near.length - 1] ?? headers[headers.length - 1];
    if (!t) return '没有可点的 event-header';
    (t.querySelector('button') ?? t).click();
    return '已点击，请再次运行本脚本';
  }

  const wrapper = expanded[expanded.length - 1].closest('.highlight-wrapper');
  out.push(`\n=== .highlight-wrapper ${rect(wrapper)} ===`);
  out.push(`  wrapper 样式: ${style(wrapper)}`);
  out.push(`  子元素 ${wrapper.children.length} 个:`);
  const walk = (el, d) => {
    if (d > 3) return;
    out.push(
      `${'  '.repeat(d + 1)}${describe(el)} ${rect(el)}  ${style(el)}  "${(el.children.length === 0 ? (el.textContent || '').trim() : '').slice(0, 70)}"`,
    );
    for (const c of el.children) walk(c, d + 1);
  };
  for (const c of wrapper.children) walk(c, 1);

  const group = wrapper.closest('.event-group');
  if (group) {
    out.push(`\n=== .event-group ${rect(group)} 子元素 ${group.children.length} ===`);
    for (const c of group.children) {
      out.push(`  - ${describe(c)} ${rect(c)} ${style(c)}`);
      for (const g of c.children) {
        out.push(`      - ${describe(g)} ${rect(g)} ${style(g)}`);
      }
    }
  }
  return out.join('\n');
})();
