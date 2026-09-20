// 看侧边栏内部各面板的高度是怎么分的
(() => {
  const out = [];
  const sidebar = document.querySelector('[id="workbench.parts.sidebar"]');
  if (!sidebar) return '未找到 sidebar';
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `y=${Math.round(r.y)}..${Math.round(r.y + r.height)} h=${Math.round(r.height)}`;
  };

  out.push('=== 从 .content 往下的高度链 ===');
  const content = sidebar.querySelector(':scope > .content');
  let cur = content;
  for (let i = 0; i < 6 && cur; i++) {
    const c = getComputedStyle(cur);
    out.push(`  ${'  '.repeat(i)}${describe(cur)}  ${R(cur)}  h=${c.height} pos=${c.position} inline="${(cur.getAttribute('style') ?? '').slice(0, 90)}"`);
    const kids = Array.from(cur.children).filter((k) => k.getBoundingClientRect().height > 0);
    if (!kids.length) break;
    cur = kids[0];
  }

  out.push('\n=== split-view-view 列表（面板分配）===');
  const views = Array.from(sidebar.querySelectorAll('.split-view-container > .split-view-view'));
  views.forEach((v, i) => {
    const c = getComputedStyle(v);
    out.push(`  [${i}] ${describe(v)}  ${R(v)}  pos=${c.position} flex=${c.flex}`);
    out.push(`       inline="${(v.getAttribute('style') ?? '').slice(0, 130)}"`);
  });

  const lastView = views[views.length - 1];
  if (lastView) {
    const lr = lastView.getBoundingClientRect();
    const cr = content.getBoundingClientRect();
    out.push(`\n.content 底部 = ${Math.round(cr.y + cr.height)}，最后一个面板底部 = ${Math.round(lr.y + lr.height)}`);
    out.push(`→ 面板区下方的空白 = ${Math.round(cr.y + cr.height - (lr.y + lr.height))}px`);
  }
  return out.join('\n');
})();
