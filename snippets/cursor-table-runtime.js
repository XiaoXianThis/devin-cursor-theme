// 在 Cursor 的运行时样式表里找表格单元格的规则
(() => {
  const targets = ['ui-uve7l6', 'ui-16b7oty', 'ui-1rgtt3y', 'ui-o7x2bt', 'ui-dpxx8g', 'ui-16dsc37', 'ui-uxw1ft', 'ui-13ebx5f'];
  const out = [];
  let sheetCount = 0;
  let ruleCount = 0;
  const found = new Map();

  for (const sheet of Array.from(document.styleSheets)) {
    sheetCount++;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      continue;
    }
    for (const r of Array.from(rules)) {
      ruleCount++;
      const sel = r.selectorText ?? '';
      for (const t of targets) {
        if (sel.includes(t)) {
          if (!found.has(t)) found.set(t, []);
          found.get(t).push(sel + '  { ' + r.style.cssText + ' }');
        }
      }
    }
  }

  out.push(`样式表 ${sheetCount} 个，规则 ${ruleCount} 条`);
  for (const t of targets) {
    out.push(`\n--- .${t} ---`);
    const hits = found.get(t);
    if (!hits) {
      out.push('  (未找到)');
      continue;
    }
    hits.slice(0, 6).forEach((h) => out.push('  ' + h));
  }

  // 兜底：直接看当前聊天里 td/th 的实际值（如果有表格）
  out.push('\n=== 当前 td/th 计算值 ===');
  const td = document.querySelector('.composer-bar td, .composer-bar th');
  if (td) {
    const c = getComputedStyle(td);
    out.push(`  ${td.tagName}: border=${c.borderTopWidth}/${c.borderTopStyle}/${c.borderTopColor} pad=${c.padding} bg=${c.backgroundColor} fs=${c.fontSize} lh=${c.lineHeight}`);
  } else out.push('  (聊天里没有表格)');
  return out.join('\n');
})();
