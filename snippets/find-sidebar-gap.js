// 排查侧边栏底部多出来的空间
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `y=${Math.round(r.y)}..${Math.round(r.y + r.height)}  h=${Math.round(r.height)}  x=${Math.round(r.x)} w=${Math.round(r.width)}`;
  };

  const sidebar = document.querySelector('[id="workbench.parts.sidebar"]');
  const statusbar = document.querySelector('.part.statusbar');
  out.push(`sidebar   ${R(sidebar)}`);
  out.push(`statusbar ${R(statusbar)}`);
  out.push(`两者之间空隙 = ${Math.round(statusbar.getBoundingClientRect().y - (sidebar.getBoundingClientRect().y + sidebar.getBoundingClientRect().height))}px`);

  out.push('\n=== sidebar 直接子元素 ===');
  Array.from(sidebar.children).forEach((c, i) => {
    const s = getComputedStyle(c);
    out.push(`  [${i}] ${describe(c)}  ${R(c)}  display=${s.display} flex=${s.flex} h=${s.height} minH=${s.minHeight}`);
  });

  out.push('\n=== sidebar 内 y > 900 的元素 ===');
  const seen = new Set();
  for (const el of sidebar.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.y < 900 || r.height === 0) continue;
    const sig = `${describe(el)}|${Math.round(r.y)}|${Math.round(r.height)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const s = getComputedStyle(el);
    out.push(`  ${describe(el)}  ${R(el)}  bg=${s.backgroundColor} flexGrow=${s.flexGrow} h=${s.height}`);
  }

  out.push('\n=== .content 内部结构 ===');
  const content = sidebar.querySelector(':scope > .content');
  if (content) {
    out.push(`  .content ${R(content)}  display=${getComputedStyle(content).display}`);
    Array.from(content.children).forEach((c, i) => {
      out.push(`    [${i}] ${describe(c)}  ${R(c)}`);
    });
    // 递归找最后一个可见子元素
    let deepest = content;
    for (let d = 0; d < 6; d++) {
      const kids = Array.from(deepest.children).filter((k) => k.getBoundingClientRect().height > 0);
      if (!kids.length) break;
      deepest = kids[kids.length - 1];
      out.push(`    ${'  '.repeat(d)}└ ${describe(deepest)}  ${R(deepest)}`);
    }
  }
  return out.join('\n');
})();
