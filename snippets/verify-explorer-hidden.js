// 验证 Explorer 标题栏是否已隐藏，以及侧边栏布局
(() => {
  const out = [];
  const sidebar = document.querySelector('[id="workbench.parts.sidebar"]');
  if (!sidebar) return '未找到 sidebar';
  const title = sidebar.querySelector(':scope > .composite.title');
  const content = sidebar.querySelector(':scope > .content');
  const bar = sidebar.querySelector(':scope > .composite.has-composite-bar');

  const R = (el) => {
    if (!el) return 'n/a';
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };

  out.push(`图标行 .composite.has-composite-bar : ${R(bar)}`);
  out.push(`标题栏 .composite.title            : ${R(title)}  display=${title ? getComputedStyle(title).display : 'n/a'}`);
  out.push(`内容区 .content                    : ${R(content)}`);

  const h2 = sidebar.querySelector('h2');
  out.push(`\n侧边栏里还有 h2("Explorer") 吗: ${h2 ? '有，可见=' + (h2.getBoundingClientRect().height > 0) : '没有'}`);

  const st = document.getElementById('devin-ui-style');
  out.push(`\n规则数 ${st?.sheet?.cssRules.length} 长度 ${st?.textContent.length}`);
  return out.join('\n');
})();
