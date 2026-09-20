// 清理之前 CDP 临时注入的痕迹，便于干净地测试 devin-ui.js
(() => {
  const removed = [];
  const oldStyle = document.getElementById('__devin_debug_css__');
  if (oldStyle) {
    oldStyle.remove();
    removed.push('__devin_debug_css__');
  }
  if (window.__devinUiCustomTimer) {
    clearInterval(window.__devinUiCustomTimer);
    window.__devinUiCustomTimer = null;
    removed.push('__devinUiCustomTimer');
  }
  const btn = document.getElementById('devin-icon-expand');
  if (btn) {
    btn.remove();
    removed.push('devin-icon-expand');
  }
  for (const c of document.querySelectorAll('.devin-icons-expanded')) {
    c.classList.remove('devin-icons-expanded');
  }
  return '已清理: ' + (removed.join(', ') || '(无)');
})();
