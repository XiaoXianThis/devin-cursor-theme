// 造一个带同样类名的临时元素，验证选择器能否命中（验完即删）
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';

  const probe = document.createElement('div');
  probe.className = 'pointer-events-none absolute bottom-0 left-1/2 flex';
  panel.appendChild(probe);

  const matched = panel.querySelectorAll('div[class*="pointer-events-none"][class*="left-1/2"]');
  const display = getComputedStyle(probe).display;
  const viaSheet = Array.from(document.getElementById('devin-ui-style').sheet.cssRules).some(
    (r) => (r.selectorText ?? '').includes('left-1/2'),
  );

  probe.remove();

  return [
    `临时元素 display = ${display}   (期望 none)`,
    `选择器命中数 = ${matched.length}   (含临时元素)`,
    `样式表里有该规则 = ${viaSheet}`,
  ].join('\n');
})();
