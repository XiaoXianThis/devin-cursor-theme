// 验证第 18 段 + 模式按钮文字逻辑
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const band = panel && panel.querySelector('.group\\/beard-band');
  if (!band) return '未找到 beard-band';
  const box = band.querySelector('div.cursor-text.border');
  const S = (el, props) => {
    const c = getComputedStyle(el);
    return props.map((p) => `${p}=${c[p]}`).join(' ');
  };

  out.push('=== 输入框 ===');
  if (box) {
    out.push(`  ${S(box, ['padding', 'borderRadius', 'backgroundColor'])}`);
    out.push(`  占位符色变量 = ${getComputedStyle(box).getPropertyValue('--vscode-input-placeholderForeground') || '(空)'}`);
    const ta = box.querySelector('div.text-text-primary');
    if (ta) out.push(`  文本区 ${S(ta, ['fontSize', 'lineHeight'])}`);
    const row = box.querySelector('.flex.flex-wrap.items-center > div');
    if (row) out.push(`  控制行内层 ${S(row, ['gap'])}`);
  } else out.push('  未找到');

  out.push('\n=== 模式按钮 ===');
  const perm = band.querySelector('[data-devin-perm]');
  if (perm) {
    const span = perm.querySelector('span');
    out.push(`  文字 = "${(span?.textContent ?? perm.textContent ?? '').trim()}"`);
    out.push(`  ${S(perm, ['height', 'lineHeight', 'backgroundColor', 'padding'])}`);
    if (span) out.push(`  span line-height = ${getComputedStyle(span).lineHeight}`);
    out.push(`  下拉箭头 = ${!!perm.querySelector('.devin-chevron')}`);
  } else out.push('  未标记');

  out.push('\n=== 模型按钮 ===');
  const model = band.querySelector('[data-devin-model]');
  if (model) {
    out.push(`  文字 = "${(model.textContent || '').trim().slice(0, 24)}"`);
    out.push(`  ${S(model, ['height', 'lineHeight'])}  箭头=${!!model.querySelector('.devin-chevron')}`);
  } else out.push('  未标记');

  out.push('\n=== 列表 ===');
  const ul = panel.querySelector('.prose-main.prose-ds ul, .prose-main.prose-ds ol');
  if (ul) out.push(`  ${S(ul, ['margin', 'paddingInlineStart', 'listStyleType', 'fontSize', 'lineHeight'])}`);
  else out.push('  (当前消息里没有列表)');

  const st = document.getElementById('devin-ui-style');
  out.push(`\n样式表规则数 ${st?.sheet?.cssRules.length} 长度 ${st?.textContent.length}`);
  return out.join('\n');
})();
