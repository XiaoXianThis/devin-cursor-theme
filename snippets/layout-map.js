// 布局地图：列出所有可见的布局区域及其位置/尺寸，用于和截图对照
(() => {
  const out = [];
  const walk = (el, d) => {
    if (d > 4) return;
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 60) return;
    const cls =
      typeof el.className === 'string'
        ? el.className.split(/\s+/).filter(Boolean).slice(0, 4).join('.')
        : '';
    const tag = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
    out.push(
      `${'  '.repeat(d)}${tag}  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
    );
    for (const c of el.children) walk(c, d + 1);
  };
  walk(document.body, 0);
  return out.join('\n');
})();
