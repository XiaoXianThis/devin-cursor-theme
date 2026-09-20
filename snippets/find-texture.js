// 找聊天面板里空状态下的背景纹理
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 5).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';

  // 1) 带 background-image 的元素
  out.push('=== 1) background-image 非 none ===');
  const seen = new Set();
  for (const el of panel.querySelectorAll('*')) {
    const c = getComputedStyle(el);
    if (!c.backgroundImage || c.backgroundImage === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) continue;
    const sig = c.backgroundImage.slice(0, 90);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(el)} ${rect(el)}`);
    out.push(`      bg-image=${c.backgroundImage.slice(0, 160)}`);
    out.push(`      bg-size=${c.backgroundSize} repeat=${c.backgroundRepeat} pos=${c.backgroundPosition}`);
  }
  if (!seen.size) out.push('  (无)');

  // 2) 大尺寸 svg / canvas / img
  out.push('\n=== 2) 大尺寸 svg / canvas / img ===');
  for (const sel of ['svg', 'canvas', 'img']) {
    for (const el of panel.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 200) continue;
      out.push(`  ${describe(el)} ${rect(el)}  opacity=${getComputedStyle(el).opacity}`);
      out.push(`      parent=${describe(el.parentElement)} ${rect(el.parentElement)}`);
    }
  }

  // 3) 空状态文案附近的元素
  out.push('\n=== 3) 空状态文案链 ===');
  const leaf = Array.from(panel.querySelectorAll('*')).find(
    (el) => el.children.length === 0 && (el.textContent || '').includes('Describe your task'),
  );
  if (leaf) {
    out.push(`  叶子: ${describe(leaf)} ${rect(leaf)}`);
    let cur = leaf;
    for (let i = 0; i < 10 && cur; i++) {
      const c = getComputedStyle(cur);
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}  bg=${c.backgroundColor} bgImg=${c.backgroundImage === 'none' ? '-' : 'YES'} opacity=${c.opacity}`);
      cur = cur.parentElement;
    }
  } else out.push('  未找到 "Describe your task"');

  // 4) 面板自身及直接子元素的背景
  out.push('\n=== 4) 面板直接子元素背景 ===');
  Array.from(panel.children).forEach((c, i) => {
    const s = getComputedStyle(c);
    out.push(`  [${i}] ${describe(c)} ${rect(c)}`);
    out.push(`      bg=${s.backgroundColor} bgImg=${s.backgroundImage === 'none' ? '-' : s.backgroundImage.slice(0, 80)}`);
  });
  return out.join('\n');
})();
