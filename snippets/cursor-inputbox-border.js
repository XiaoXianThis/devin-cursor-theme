// 找 Cursor 输入框的描边究竟画在哪个元素上
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const cs = (el) => {
    const c = getComputedStyle(el);
    return `radius=${c.borderRadius} border=${c.borderTopWidth}/${c.borderRightWidth}/${c.borderBottomWidth}/${c.borderLeftWidth} ${c.borderTopColor} bg=${c.backgroundColor} pad=${c.padding} shadow=${c.boxShadow === 'none' ? '-' : c.boxShadow.slice(0, 40)}`;
  };

  const root = document.querySelector('.composer-input-blur-wrapper');
  if (!root) return '未找到 .composer-input-blur-wrapper';

  out.push('=== .composer-input-blur-wrapper 子树（只列有描边/圆角/背景的）===');
  const walk = (el, d) => {
    if (d > 4) return;
    const c = getComputedStyle(el);
    const hasBorder = parseFloat(c.borderTopWidth) > 0 || parseFloat(c.borderLeftWidth) > 0;
    const hasRadius = c.borderRadius !== '0px';
    const hasBg = c.backgroundColor !== 'rgba(0, 0, 0, 0)';
    if (hasBorder || hasRadius || hasBg || d === 0) {
      out.push(`${'  '.repeat(d)}${describe(el)} ${rect(el)}`);
      out.push(`${'  '.repeat(d)}    ${cs(el)}`);
    }
    for (const ch of el.children) walk(ch, d + 1);
  };
  walk(root, 0);

  out.push('\n=== 向上找带描边的祖先 ===');
  let cur = root.parentElement;
  for (let i = 0; i < 6 && cur; i++) {
    const c = getComputedStyle(cur);
    out.push(`↑${i + 1} ${describe(cur)} ${rect(cur)}`);
    out.push(`     ${cs(cur)}`);
    cur = cur.parentElement;
  }

  out.push('\n=== composer 区域内所有带描边的元素 ===');
  const composer = document.querySelector('.composer-bar');
  if (composer) {
    const seen = new Set();
    for (const el of composer.querySelectorAll('*')) {
      const c = getComputedStyle(el);
      const w = parseFloat(c.borderTopWidth);
      if (!(w > 0)) continue;
      const sig = `${w}|${c.borderTopColor}|${c.borderRadius}|${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(`  ${describe(el)} ${rect(el)}`);
      out.push(`      ${cs(el)}`);
      if (seen.size > 12) break;
    }
  }
  return out.join('\n');
})();
