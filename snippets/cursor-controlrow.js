// 量 Cursor 输入框底部控制行的高度：Agent 药丸 / 模型选择 / 发送按钮
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
    return `r=${c.borderRadius} bg=${c.backgroundColor} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} fs=${c.fontSize} h=${c.height} minH=${c.minHeight} gap=${c.gap}`;
  };

  // 输入框底部控制行
  const wrapper = document.querySelector('.composer-input-blur-wrapper');
  if (!wrapper) return '未找到 .composer-input-blur-wrapper';

  out.push('=== 控制行里所有 button / [role=button] ===');
  const btns = wrapper.querySelectorAll('button, [role="button"]');
  out.push(`共 ${btns.length} 个`);
  btns.forEach((b, i) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    out.push(`  [${i}] ${R(b)}  title="${b.getAttribute('aria-label') ?? b.title ?? ''}" text="${(b.textContent || '').trim().slice(0, 20)}"`);
    out.push(`      ${S(b)}`);
    out.push(`      ${describe(b)}`);
  });

  // 按文字找 Agent / High Fast
  out.push('\n=== 按文字找 ===');
  for (const kw of ['Agent', 'High Fast', 'Plan', 'Build']) {
    const leaf = Array.from(wrapper.querySelectorAll('*')).find(
      (el) => el.children.length === 0 && (el.textContent || '').trim() === kw,
    );
    if (!leaf) {
      out.push(`  "${kw}": 未找到`);
      continue;
    }
    out.push(`  "${kw}":`);
    let cur = leaf;
    for (let i = 0; i < 4 && cur; i++) {
      out.push(`    ↑${i} ${describe(cur)} ${R(cur)}  ${S(cur)}`);
      cur = cur.parentElement;
    }
  }

  // 最右侧的圆形按钮（发送）
  out.push('\n=== 控制行最右侧的元素 ===');
  const all = Array.from(wrapper.querySelectorAll('*')).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 12 && r.width < 60 && r.height > 12 && r.height < 60 && r.x > 1150;
  });
  const seen = new Set();
  for (const el of all) {
    const c = getComputedStyle(el);
    const sig = `${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}|${R(el)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(el)} ${R(el)}  ${S(el)}`);
    if (seen.size > 10) break;
  }
  return out.join('\n');
})();
