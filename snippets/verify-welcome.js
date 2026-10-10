// 验证欢迎页（空编辑器）的「Recent projects」区块
// 用法: node tools/cdp.mjs evalfile "Devin" snippets/verify-welcome.js
(() => {
  const out = [];
  const shared = window.__devinUi || {};
  out.push('__devinUi.recentViewSeeded = ' + shared.recentViewSeeded);
  try {
    out.push('localStorage flag = ' + JSON.stringify(localStorage.getItem('devin-ui.recent-view-seeded')));
  } catch (e) {
    out.push('localStorage error: ' + e.message);
  }

  const welcome = document.querySelector('.windsurf-welcome-container');
  if (!welcome) return out.join('\n') + '\n不在空编辑器欢迎页（.windsurf-welcome-container 不存在）';

  const block = welcome.querySelector('.absolute.top-full');
  out.push('区块 display = ' + (block ? getComputedStyle(block).display : 'MISSING'));

  const btns = Array.from(welcome.querySelectorAll('button'));
  const trigger = btns.find((b) => /^Recent (sessions|projects)$/.test((b.textContent || '').trim()));
  out.push('标题行 = ' + (trigger ? trigger.textContent.trim() : '(none)'));

  const cards = btns.filter((b) => /^(Open project|Clone repository|Connect via SSH)$/.test((b.textContent || '').trim()));
  out.push('三张卡片 = ' + cards.map((c) => c.textContent.trim()).join(' | '));

  const viewAll = btns.find((b) => (b.textContent || '').trim() === 'View all');
  out.push('View all = ' + (viewAll ? 'present' : 'MISSING'));

  const rows = block
    ? Array.from(block.querySelectorAll('button[title]')).filter((b) => b.getBoundingClientRect().height > 0)
    : [];
  out.push('列表行数 = ' + rows.length + '（应为 0 或最多 5）');
  for (const r of rows) out.push('  ' + r.getAttribute('title'));

  const sessions = rows.filter((r) => /(^|\s)(now|\d+[a-z]* ago)$/.test(r.textContent.trim()));
  out.push('看起来是 session 的行 = ' + sessions.length + '（projects 视图下应为 0）');
  return out.join('\n');
})()
