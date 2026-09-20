// 看 sidebar / 它的父容器 / .content 的高度是怎么设的
(() => {
  const out = [];
  const sidebar = document.querySelector('[id="workbench.parts.sidebar"]');
  const chain = [];
  let cur = sidebar;
  for (let i = 0; i < 4 && cur; i++) {
    chain.push(cur);
    cur = cur.parentElement;
  }
  for (const el of chain) {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.push(`${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 55)}`);
    out.push(`    rect y=${Math.round(r.y)} h=${Math.round(r.height)}`);
    out.push(`    height=${c.height} minH=${c.minHeight} maxH=${c.maxHeight} flex=${c.flex} display=${c.display} position=${c.position}`);
    out.push(`    inline style="${el.getAttribute('style') ?? '(无)'}"`);
  }

  const content = sidebar.querySelector(':scope > .content');
  if (content) {
    const c = getComputedStyle(content);
    out.push(`\n.content  height=${c.height} flex=${c.flex} display=${c.display}`);
    out.push(`    inline style="${content.getAttribute('style') ?? '(无)'}"`);
  }

  const title = sidebar.querySelector(':scope > .composite.title');
  out.push(`\n.composite.title display=${title ? getComputedStyle(title).display : 'n/a'} h=${title ? getComputedStyle(title).height : 'n/a'}`);
  return out.join('\n');
})();
