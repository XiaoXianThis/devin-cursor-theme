// 打印可见 beard-band（composer）的完整子树，带索引路径，用于推导稳定选择器
(() => {
  const bands = Array.from(document.querySelectorAll('[class*="beard-band"]')).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (!bands.length) return '无可见 beard-band';

  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}${cls ? ` .${cls.trim().split(/\s+/).join('.')}` : ''}`;
  };

  const lines = [];
  const walk = (el, path, d) => {
    if (d > 4) return;
    const r = el.getBoundingClientRect();
    const own = (el.childNodes.length === 1 && el.firstChild?.nodeType === 3 ? el.textContent.trim() : '');
    lines.push(
      `${'  '.repeat(d)}${path}  ${describe(el)}  [${Math.round(r.y)}..${Math.round(r.y + r.height)} h=${Math.round(r.height)}]${own ? `  text="${own.slice(0, 40)}"` : ''}`,
    );
    Array.from(el.children).forEach((c, i) => walk(c, `${path}>${i + 1}`, d + 1));
  };

  lines.push(`=== 可见 beard-band 数量: ${bands.length} ===`);
  bands.forEach((b, i) => {
    const r = b.getBoundingClientRect();
    lines.push(`\n--- beard-band #${i} @[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] 在面板: ${b.closest('[id="windsurf.cascadePanel"]') ? '右侧聊天面板' : '编辑器区(欢迎页)'}`);
    walk(b, '1', 0);
  });
  return lines.join('\n');
})();
