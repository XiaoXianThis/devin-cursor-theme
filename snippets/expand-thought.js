// 展开一个靠近视口的思考块，dump 展开后的结构（用于复刻 Cursor 的思考区样式）
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

  const headers = Array.from(document.querySelectorAll('.group\\/event-header'));
  out.push(`event-header 总数: ${headers.length}`);

  // 找最后一个 y 在 -600..900 之间的（离视口最近）
  const near = headers.filter((h) => {
    const y = h.getBoundingClientRect().y;
    return y > -600 && y < 900;
  });
  out.push(`视口附近的: ${near.length}`);
  if (!near.length) return out.join('\n');

  const target = near[near.length - 1];
  out.push(`展开目标: ${describe(target)} ${rect(target)} "${(target.textContent || '').trim().slice(0, 30)}"`);

  const btn = target.querySelector('button');
  out.push(`  按钮 aria-expanded(前) = ${btn ? btn.getAttribute('aria-expanded') : 'n/a'}`);
  (btn ?? target).click();

  // 等 React 渲染
  const wrapper = target.closest('.highlight-wrapper') ?? target.parentElement;
  out.push(`\n展开后 ${describe(wrapper)} ${rect(wrapper)} 子元素 ${wrapper.children.length} 个:`);
  for (const c of wrapper.children) {
    out.push(`  - ${describe(c)} ${rect(c)}`);
    for (const g of c.children) {
      out.push(`      - ${describe(g)} ${rect(g)} "${(g.textContent || '').trim().slice(0, 60)}"`);
    }
  }

  // 整个 event-group
  const group = wrapper.closest('.event-group') ?? wrapper.parentElement;
  if (group) {
    out.push(`\n.event-group ${rect(group)} 子元素 ${group.children.length} 个:`);
    for (const c of group.children) {
      out.push(`  - ${describe(c)} ${rect(c)}`);
      for (const g of c.children) {
        out.push(`      - ${describe(g)} ${rect(g)} "${(g.textContent || '').trim().slice(0, 60)}"`);
      }
    }
  }
  return out.join('\n');
})();
