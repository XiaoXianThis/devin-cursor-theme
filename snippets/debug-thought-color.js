// 调试：为什么 highlight-wrapper 的 color 规则没生效
(() => {
  const out = [];
  const st = document.getElementById('devin-ui-style');
  const sheet = st && st.sheet;

  out.push('=== 样式表里含 highlight-wrapper 的规则 ===');
  if (sheet) {
    for (let i = 0; i < sheet.cssRules.length; i++) {
      const r = sheet.cssRules[i];
      const sel = r.selectorText ?? '';
      if (sel.includes('highlight-wrapper')) out.push(`  [${i}] ${sel}  ->  ${r.style.cssText}`);
    }
  } else {
    out.push('  sheet 不可用');
  }

  out.push('\n=== highlight-wrapper 实例 ===');
  const hws = Array.from(document.querySelectorAll('.highlight-wrapper'));
  out.push(`  数量: ${hws.length}`);
  for (const el of hws.slice(0, 3)) {
    const c = getComputedStyle(el);
    out.push(`  - class="${el.className}"`);
    out.push(`    inline style="${el.getAttribute('style') ?? '(无)'}"`);
    out.push(`    color=${c.color}`);
    out.push(`    --ds-text-tertiary=${c.getPropertyValue('--ds-text-tertiary') || '(空)'}`);
    out.push(`    --vscode-editor-foreground=${c.getPropertyValue('--vscode-editor-foreground') || '(空)'}`);
    out.push(`    最近的 .chat-client-root 祖先: ${el.closest('.chat-client-root')?.id || el.closest('.chat-client-root')?.className || '(无)'}`);
  }

  out.push('\n=== 思考正文容器候选 ===');
  for (const sel of [
    '.highlight-wrapper .flex.min-w-0.flex-col.text-12',
    '.highlight-wrapper .text-12',
    '[class*="collapse-bar"]',
    '[id^="_r_"].flex',
  ]) {
    const hits = Array.from(document.querySelectorAll(sel));
    out.push(`  ${sel} -> ${hits.length} 个${hits[0] ? ` 首个 fs=${getComputedStyle(hits[0]).fontSize}` : ''}`);
  }
  return out.join('\n');
})();
