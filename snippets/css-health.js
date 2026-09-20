// 检查注入的样式表是否被正常解析（CSS 语法错误会导致规则被静默丢弃）
(() => {
  const el = document.getElementById('devin-ui-style');
  if (!el) return '未找到 #devin-ui-style';
  const sheet = el.sheet;
  if (!sheet) return '元素存在但 sheet 为空（解析失败？）';
  const n = sheet.cssRules.length;
  const out = [`注入样式表规则数: ${n}`, `文本长度: ${el.textContent.length} 字符`];
  // 抽查最后几条规则的 selectorText
  out.push('最后 8 条规则的选择器:');
  for (let i = Math.max(0, n - 8); i < n; i++) {
    const r = sheet.cssRules[i];
    out.push(`  [${i}] ${r.selectorText ?? r.cssText.slice(0, 80)}`);
  }
  return out.join('\n');
})();
