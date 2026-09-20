// 验证第 14 段：外层背景去掉 / 变更条与输入框拼成一体 / 描边
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';
  const band = panel.querySelector('.group\\/beard-band');
  if (!band) return '未找到 beard-band';

  out.push('=== 外层背景层 ===');
  const wax = band.querySelector(':scope > [class*="bg-bg-elevated-wax"]');
  out.push(`  bg-bg-elevated-wax: ${wax ? 'display=' + getComputedStyle(wax).display : '不存在'}`);

  const inputBox = band.querySelector('div.cursor-text.border');
  out.push('\n=== 输入框 ===');
  if (inputBox) {
    const c = getComputedStyle(inputBox);
    const r = inputBox.getBoundingClientRect();
    out.push(`  rect=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
    out.push(`  border=${c.borderTopWidth} ${c.borderTopColor}`);
    out.push(`  radius=${c.borderRadius}`);
    out.push(`  bg=${c.backgroundColor}`);
  }

  out.push('\n=== 变更条 ===');
  const bars = Array.from(panel.querySelectorAll('div[class*="bottom-full"]')).filter((b) => b.getBoundingClientRect().height > 0);
  out.push(`  可见条: ${bars.length}`);
  if (bars.length) {
    const row = bars[0].querySelector('.flex.min-w-0.flex-col.gap-1');
    if (row) {
      const c = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      out.push(`  rect=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
      out.push(`  border=${c.borderTopWidth} ${c.borderTopColor} | bottom=${c.borderBottomWidth} | radius=${c.borderRadius}`);
      out.push(`  bg=${c.backgroundColor}`);
      if (inputBox) {
        const ir = inputBox.getBoundingClientRect();
        out.push(`\n  对齐检查: 条 x=${Math.round(r.x)} 宽=${Math.round(r.width)} | 输入框 x=${Math.round(ir.x)} 宽=${Math.round(ir.width)}`);
        out.push(`  条底=${Math.round(r.bottom)} 输入框顶=${Math.round(ir.top)}  （应相等 = 无缝拼接）`);
      }
    }
  }
  return out.join('\n');
})();
