// 查 Cursor 聊天里 markdown 列表（ul/ol/li）的样式
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `fs=${c.fontSize} lh=${c.lineHeight} color=${c.color} m=${c.margin} pad=${c.padding} listStyle=${c.listStyleType} markerColor=${c.color}`;
  };

  const scope = document.querySelector('.composer-bar') ?? document.body;
  const lists = Array.from(scope.querySelectorAll('ul, ol'));
  out.push(`composer-bar 内 ul/ol 数量: ${lists.length}`);

  for (const l of lists.slice(0, 4)) {
    out.push(`\n--- ${describe(l)} ---`);
    out.push(`  ${S(l)}`);
    out.push(`  display=${getComputedStyle(l).display} paddingInlineStart=${getComputedStyle(l).paddingInlineStart}`);
    const li = l.querySelector('li');
    if (li) {
      out.push(`  li: ${S(li)}`);
      const c = getComputedStyle(li);
      out.push(`    display=${c.display} paddingInlineStart=${c.paddingInlineStart} textIndent=${c.textIndent}`);
      // marker
      out.push(`    ::marker: content=${getComputedStyle(li, '::marker').content} color=${getComputedStyle(li, '::marker').color} fs=${getComputedStyle(li, '::marker').fontSize}`);
    }
  }

  // CSS 里的相关变量
  out.push('\n=== 相关 CSS 变量 ===');
  const wb = document.querySelector('.monaco-workbench');
  const cs = getComputedStyle(wb);
  for (const v of [
    '--conversation-list-before-gap',
    '--conversation-list-after-gap',
    '--conversation-list-item-gap',
    '--conversation-block-gap',
    '--conversation-text-inset',
  ]) {
    out.push(`  ${v} = ${cs.getPropertyValue(v) || '(空)'}`);
  }
  return out.join('\n');
})();
