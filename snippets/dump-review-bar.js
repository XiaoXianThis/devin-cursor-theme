// dump composer 上方文件变更条里的所有可点元素
(() => {
  const out = [];
  const bar = document.querySelector('div[class*="bottom-full"]');
  if (!bar) return '未找到 bottom-full';
  out.push(`容器: ${typeof bar.className === 'string' ? bar.className.slice(0, 80) : '(非字符串)'}`);

  const walk = (el, d) => {
    if (d > 6) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && el.children.length === 0) return;
    const cls = typeof el.className === 'string' ? el.className : '';
    const own = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 30) : '';
    const clickable = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || /inline-flex/.test(cls);
    out.push(
      `${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} .${cls.trim().split(/\s+/).slice(0, 3).join('.')} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${clickable ? '  <可点>' : ''}${own ? `  "${own}"` : ''}`,
    );
    for (const c of el.children) walk(c, d + 1);
  };
  walk(bar, 0);
  return out.join('\n');
})();
