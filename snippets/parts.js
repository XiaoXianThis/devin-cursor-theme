// 打印主要 part 的 class 与位置，用于判断 activityBar.location=top 是否生效
(() => {
  const names = ['activitybar', 'titlebar', 'leftheader', 'sidebar', 'statusbar', 'editor', 'auxiliarybar'];
  const out = [];
  for (const n of names) {
    const el = document.querySelector(`.part.${n}`);
    if (!el) {
      out.push(`${n}: NOT FOUND`);
      continue;
    }
    const r = el.getBoundingClientRect();
    out.push(
      `${n}: class="${el.className}"  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
    );
  }
  // 活动栏内部的 action bar 方向
  const ab = document.querySelector('.part.activitybar');
  if (ab) {
    const bar = ab.querySelector('.monaco-action-bar');
    out.push(`\nactivitybar .monaco-action-bar class="${bar?.className}"`);
    out.push(`computed flexDirection = ${bar ? getComputedStyle(bar).flexDirection : 'n/a'}`);
    const container = ab.querySelector('.actions-container');
    out.push(`actions-container flexDirection = ${container ? getComputedStyle(container).flexDirection : 'n/a'}`);
  }
  // 活动栏里是否出现溢出菜单按钮
  out.push(`\nactivitybar 内 .overflow 元素数: ${document.querySelectorAll('.activitybar .overflow, .activitybar .monaco-action-bar .overflow').length}`);
  return out.join('\n');
})();
