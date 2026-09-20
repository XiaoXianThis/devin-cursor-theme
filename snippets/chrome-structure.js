// 打印标题栏与活动栏的结构，用于处理「去掉 agent/editor 切换」「菜单居左」「活动栏移到顶部」
(() => {
  const out = [];
  const dump = (label, root, maxDepth) => {
    out.push(`\n=== ${label} ===`);
    if (!root) {
      out.push('  NOT FOUND');
      return;
    }
    const walk = (el, d) => {
      if (d > maxDepth) return;
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === 'string' ? el.className : '';
      const own = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 30) : '';
      out.push(
        `${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''} .${cls.trim().split(/\s+/).slice(0, 6).join('.')} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${own ? ` "${own}"` : ''}`,
      );
      for (const c of el.children) walk(c, d + 1);
    };
    walk(root, 0);
  };
  dump('titlebar', document.querySelector('.monaco-workbench .titlebar'), 4);
  dump('activitybar', document.querySelector('.monaco-workbench .activitybar'), 3);
  return out.join('\n');
})();
