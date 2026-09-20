// 查 Cursor 聊天里 markdown 表格的样式
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `bg=${c.backgroundColor} border=${c.borderTopWidth}/${c.borderTopStyle}/${c.borderTopColor} r=${c.borderRadius} pad=${c.padding} fs=${c.fontSize} lh=${c.lineHeight} m=${c.margin}`;
  };

  const scope = document.querySelector('.composer-bar') ?? document.body;
  const tables = Array.from(scope.querySelectorAll('table'));
  out.push(`composer-bar 内 table 数量: ${tables.length}`);

  for (const t of tables.slice(0, 3)) {
    out.push(`\n--- table ${describe(t)} ---`);
    out.push(`  ${S(t)}`);
    out.push(`  borderCollapse=${getComputedStyle(t).borderCollapse} borderSpacing=${getComputedStyle(t).borderSpacing} tableLayout=${getComputedStyle(t).tableLayout} width=${getComputedStyle(t).width}`);
    let p = t.parentElement;
    for (let i = 0; i < 3 && p; i++) {
      out.push(`  ↑${i} ${describe(p)}  ${S(p)}`);
      p = p.parentElement;
    }
    const th = t.querySelector('th');
    const td = t.querySelector('td');
    if (th) out.push(`  th: ${S(th)}`);
    if (td) out.push(`  td: ${S(td)}`);
    if (th) out.push(`  th 各边 border: top=${getComputedStyle(th).borderTopWidth} right=${getComputedStyle(th).borderRightWidth} bottom=${getComputedStyle(th).borderBottomWidth} left=${getComputedStyle(th).borderLeftWidth}`);
    if (td) out.push(`  td 各边 border: top=${getComputedStyle(td).borderTopWidth} right=${getComputedStyle(td).borderRightWidth} bottom=${getComputedStyle(td).borderBottomWidth} left=${getComputedStyle(td).borderLeftWidth}`);
    const tr = t.querySelector('tr');
    if (tr) out.push(`  tr: ${S(tr)}`);
    const thead = t.querySelector('thead');
    if (thead) out.push(`  thead: ${S(thead)}`);
  }

  // CSS 里的表格变量
  out.push('\n=== 表格相关 CSS 变量 ===');
  const wb = document.querySelector('.monaco-workbench');
  const cs = getComputedStyle(wb);
  for (const v of [
    '--markdown-table-prose-cell-inline-size',
    '--markdown-table-border-color',
    '--markdown-table-background',
    '--conversation-surface-border-radius',
  ]) {
    out.push(`  ${v} = ${cs.getPropertyValue(v) || '(空)'}`);
  }
  return out.join('\n');
})();
