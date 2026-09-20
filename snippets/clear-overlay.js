// 清除标注痕迹
(() => {
  document.getElementById('__devin_probe_overlay__')?.remove();
  let n = 0;
  for (const el of document.querySelectorAll('[data-devin-probe]')) {
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.removeAttribute('data-devin-probe');
    n++;
  }
  return `cleared ${n} outlines`;
})();
