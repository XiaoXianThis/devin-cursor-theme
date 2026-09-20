// 验证主题变量是否被注入的 CSS 覆盖，以及 Recent sessions 选择器是否唯一命中
(() => {
  const out = [];
  const wb = document.querySelector('.monaco-workbench');
  const cs = getComputedStyle(wb);
  out.push('=== 主题变量当前值 ===');
  for (const v of [
    '--vscode-focusBorder',
    '--vscode-list-focusOutline',
    '--vscode-panelTitle-activeBorder',
    '--vscode-tab-activeBorder',
    '--vscode-activityBar-activeBorder',
  ]) {
    out.push(`  ${v} = ${cs.getPropertyValue(v) || '(空)'}`);
  }
  out.push(`  (这些变量是否来自行内 style: ${wb.getAttribute('style')?.includes('--vscode-focusBorder') ? '是' : '否/未包含'})`);

  out.push('\n=== Recent sessions 选择器命中 ===');
  for (const sel of [
    '.windsurf-welcome-container div.absolute.left-0.top-full.flex.w-full.flex-col',
    '.windsurf-welcome-container .absolute.top-full',
  ]) {
    const hits = Array.from(document.querySelectorAll(sel));
    out.push(`  ${sel}\n    -> ${hits.length} 个: ${hits.map((e) => `"${(e.textContent || '').trim().slice(0, 40)}"`).join(' | ')}`);
  }
  return out.join('\n');
})();
