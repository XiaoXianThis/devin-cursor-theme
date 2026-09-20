// 验证背景纹理是否已隐藏
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';
  const hits = Array.from(panel.querySelectorAll('div[class*="pointer-events-none"][class*="left-1/2"]'));
  const bigSvgs = Array.from(panel.querySelectorAll('svg')).filter((s) => s.getBoundingClientRect().width > 200);
  const st = document.getElementById('devin-ui-style');
  return [
    `匹配 div[pointer-events-none][left-1/2]: ${hits.length} 个`,
    ...hits.map((h) => {
      const r = h.getBoundingClientRect();
      return `  display=${getComputedStyle(h).display} rect=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] class="${(typeof h.className === 'string' ? h.className : '').slice(0, 80)}"`;
    }),
    `面板内 >200px 的 svg 剩余: ${bigSvgs.length}`,
    ...bigSvgs.map((s) => {
      const r = s.getBoundingClientRect();
      return `  svg [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
    }),
    `样式表规则数 ${st?.sheet?.cssRules.length} 长度 ${st?.textContent.length}`,
  ].join('\n');
})();
