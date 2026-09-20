// 点击展开按钮并报告状态变化
(() => {
  const SEL = '[id="workbench.parts.sidebar"] .composite-bar .actions-container';
  const c = document.querySelector(SEL);
  const btn = document.getElementById('devin-icon-expand');
  if (!c || !btn) return '容器或按钮未找到';

  const snap = (tag) => {
    const items = Array.from(c.querySelectorAll(':scope > .action-item'));
    const vis = items.filter((e) => e.getBoundingClientRect().width > 0);
    return `${tag}: expanded=${c.classList.contains('devin-icons-expanded')} 可见=${vis.length} -> ${vis.map((e) => e.querySelector('.action-label')?.getAttribute('aria-label') || '?').join(', ')}`;
  };

  const before = snap('点击前');
  btn.click();
  const after = snap('点击后');
  btn.click();
  const back = snap('再点一次');

  return [before, after, back].join('\n');
})();
