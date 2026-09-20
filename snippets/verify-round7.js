// 检查表格单元格的四边描边与模式按钮文字
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const td = panel.querySelector('.prose-main td');
  const th = panel.querySelector('.prose-main th');
  const lastTd = panel.querySelector('.prose-main tr td:last-child');

  const B = (el, label) => {
    if (!el) {
      out.push(`  ${label}: 未找到`);
      return;
    }
    const c = getComputedStyle(el);
    out.push(
      `  ${label}: right=${c.borderRightWidth}/${c.borderRightStyle}/${c.borderRightColor} | top=${c.borderTopWidth} bottom=${c.borderBottomWidth} left=${c.borderLeftWidth} | pad=${c.padding} fs=${c.fontSize} bg=${c.backgroundColor}`,
    );
  };

  out.push('=== 表格单元格 ===');
  B(th, 'th');
  B(td, 'td');
  B(lastTd, 'td:last-child (应无右边框)');

  const table = panel.querySelector('.prose-main table');
  if (table) {
    const c = getComputedStyle(table);
    out.push(`  table: collapse=${c.borderCollapse} spacing=${c.borderSpacing} width=${c.width} minWidth=${c.minWidth} bg=${c.backgroundColor}`);
  }

  out.push('\n=== 模式按钮 ===');
  const perm = panel.querySelector('[data-devin-perm]');
  if (perm) out.push(`  文字 = "${(perm.textContent || '').trim()}"`);
  else out.push('  未标记');

  const st = document.getElementById('devin-ui-style');
  out.push(`\n规则数 ${st?.sheet?.cssRules.length} 长度 ${st?.textContent.length}`);
  return out.join('\n');
})();
