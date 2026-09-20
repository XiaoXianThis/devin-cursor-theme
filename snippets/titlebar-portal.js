// 打印 titlebar portal overlay（agent/editor 切换器所在）与活动栏条目
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
        `${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''} .${cls.trim().split(/\s+/).slice(0, 5).join('.')} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${own ? ` "${own}"` : ''}`,
      );
      for (const c of el.children) walk(c, d + 1);
    };
    walk(root, 0);
  };

  dump(
    'titlebar portal overlay',
    document.querySelector('[class*="windsurf-titlebar-portal-overlay"]'),
    5,
  );
  dump('activitybar composite-bar', document.querySelector('.activitybar .composite-bar'), 4);
  dump('activitybar 所有条目', document.querySelector('.activitybar .monaco-action-bar'), 4);

  // 顺便列出活动栏里所有可点击条目的 title
  const items = Array.from(document.querySelectorAll('.activitybar .monaco-action-bar .action-item'));
  out.push(`\n=== 活动栏条目清单 (${items.length}) ===`);
  items.forEach((it, i) => {
    const r = it.getBoundingClientRect();
    const label = it.querySelector('.action-label');
    out.push(
      `  [${i}] [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] title="${label?.getAttribute('aria-label') ?? label?.title ?? ''}" cls="${(typeof it.className === 'string' ? it.className : '').slice(0, 60)}"`,
    );
  });
  return out.join('\n');
})();
