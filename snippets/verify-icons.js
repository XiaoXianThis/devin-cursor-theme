// 验证图标行的「点击展开」是否工作
(() => {
  const out = [];
  const SEL = '[id="workbench.parts.sidebar"] .composite-bar .actions-container';
  const c = document.querySelector(SEL);
  if (!c) return '容器未找到: ' + SEL;

  const btn = document.getElementById('devin-icon-expand');
  const items = Array.from(c.querySelectorAll(':scope > .action-item'));
  const visible = items.filter((e) => e.getBoundingClientRect().width > 0);

  out.push(`容器: ${c.className}`);
  out.push(`action-item 总数: ${items.length}，可见: ${visible.length}`);
  out.push(`展开按钮已挂载: ${!!btn}${btn ? `  title="${btn.title}"` : ''}`);
  out.push(`当前 expanded 类: ${c.classList.contains('devin-icons-expanded')}`);
  out.push('可见图标:');
  for (const it of visible) {
    const r = it.getBoundingClientRect();
    out.push(`    [${Math.round(r.x)},${Math.round(r.y)}] ${it.querySelector('.action-label')?.getAttribute('aria-label') ?? '?'}`);
  }
  return out.join('\n');
})();
