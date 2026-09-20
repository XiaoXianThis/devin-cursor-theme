// 枚举所有 .part 元素与所有含 activitybar 的元素，排查是否出现重复/幽灵元素
(() => {
  const out = [];

  out.push('=== 所有 .part 元素 ===');
  for (const el of document.querySelectorAll('.part')) {
    const r = el.getBoundingClientRect();
    out.push(
      `  id="${el.id}" class="${el.className}"  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
    );
  }

  out.push('\n=== 所有 class 含 activitybar 的元素 ===');
  for (const el of document.querySelectorAll('[class*="activitybar"]')) {
    const r = el.getBoundingClientRect();
    out.push(
      `  ${el.tagName.toLowerCase()} id="${el.id}" class="${el.className}"  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] 子元素=${el.children.length}`,
    );
  }

  out.push('\n=== 可见的活动栏图标所在元素 ===');
  const labels = document.querySelectorAll('.action-label[class*="codicon-explorer-view-icon"]');
  for (const el of labels) {
    const r = el.getBoundingClientRect();
    let cur = el;
    const chain = [];
    let d = 0;
    while (cur && d < 8) {
      const cr = cur.getBoundingClientRect();
      chain.push(`${cur.tagName.toLowerCase()}${cur.id ? '#' + cur.id : ''}.${(typeof cur.className === 'string' ? cur.className : '').split(/\s+/).slice(0, 3).join('.')}[${Math.round(cr.width)}x${Math.round(cr.height)}]`);
      cur = cur.parentElement;
      d++;
    }
    out.push(`  [${Math.round(r.x)},${Math.round(r.y)}] ${chain.join(' < ')}`);
  }

  return out.join('\n');
})();
