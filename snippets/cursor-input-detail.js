// 量 Cursor 输入框内部规格：padding / 字体 / 控制行间距与图标尺寸
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)} @[${Math.round(r.x)},${Math.round(r.y)}]`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `pad=${c.padding} gap=${c.gap} fs=${c.fontSize} lh=${c.lineHeight} ff=${c.fontFamily.split(',')[0]} color=${c.color} h=${c.height} m=${c.margin} bg=${c.backgroundColor} r=${c.borderRadius}`;
  };
  const dump = (label, sel, maxUp) => {
    const el = document.querySelector(sel);
    out.push(`\n=== ${label}  (${sel}) ===`);
    if (!el) {
      out.push('  未找到');
      return;
    }
    out.push(`  ${describe(el)} ${R(el)}`);
    out.push(`      ${S(el)}`);
    let cur = el;
    for (let i = 0; i < (maxUp ?? 0) && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      out.push(`  ↑${i + 1} ${describe(cur)} ${R(cur)}  ${S(cur)}`);
    }
  };

  dump('输入框本体', '.ai-input-full-input-box', 1);
  dump('占位符', '.aislash-editor-placeholder', 2);
  dump('编辑器输入', '.aislash-editor-input', 1);

  // 控制行
  out.push('\n=== 控制行容器 ===');
  const mic = document.querySelector('.codicon-mic');
  if (mic) {
    let cur = mic;
    for (let i = 0; i < 6 && cur; i++) {
      out.push(`  ↑${i} ${describe(cur)} ${R(cur)}  ${S(cur)}`);
      cur = cur.parentElement;
    }
  }

  // 控制行里所有图标
  out.push('\n=== 控制行里的图标 ===');
  const seen = new Set();
  for (const el of document.querySelectorAll('.codicon')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.x < 900) continue;
    const c = getComputedStyle(el);
    const sig = `${(typeof el.className === 'string' ? el.className : '').slice(0, 50)}|${Math.round(r.width)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(el)} ${R(el)}  fs=${c.fontSize} color=${c.color} m=${c.margin} pad=${c.padding}`);
  }

  // 底部控制行里各图标的横向位置，算间距
  out.push('\n=== 控制行图标横向分布 ===');
  const items = Array.from(document.querySelectorAll('.anysphere-icon-button, .send-with-mode, .composer-context-usage-indicator'))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && x.r.y > 850)
    .sort((a, b) => a.r.x - b.r.x);
  let prev = null;
  for (const { el, r } of items) {
    const gap = prev ? Math.round(r.x - prev.right) : '-';
    out.push(`  ${describe(el)} ${R(el)}  与前一个间距=${gap}`);
    prev = r;
  }
  return out.join('\n');
})();
