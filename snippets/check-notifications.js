// 检查工作台里的通知（扩展可能会弹「Reload Window」提示）
(() => {
  const out = [];
  const notifs = document.querySelectorAll('.notifications-toasts .notification-toast, .notifications-center .notification-list-item');
  out.push(`通知数量: ${notifs.length}`);
  for (const n of notifs) {
    out.push(`  "${(n.textContent || '').trim().slice(0, 160)}"`);
  }

  // 状态栏里的通知指示
  const badge = document.querySelector('.statusbar-item[id*="notifications"]');
  out.push(`\n状态栏通知项: ${badge ? (badge.textContent || '').trim() : '(无)'}`);

  // 是否已安装 custom-ui-style（通过命令面板无法查，改用 DOM 痕迹）
  out.push(`\nexternal.css link 是否存在: ${!!document.querySelector('link[href*="external.css"]')}`);
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.getAttribute('href'));
  out.push(`样式表: ${JSON.stringify(links)}`);
  const styles = Array.from(document.querySelectorAll('style')).map((s) => `id=${s.id} len=${s.textContent.length}`);
  out.push(`内联 style: ${JSON.stringify(styles)}`);
  return out.join('\n');
})();
