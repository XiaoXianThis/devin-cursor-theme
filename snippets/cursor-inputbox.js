// 在 Cursor 里抓输入框 / 文件变更条的真实计算样式
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
  const cs = (el) => {
    const c = getComputedStyle(el);
    return `radius=${c.borderRadius} border=${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor} bg=${c.backgroundColor} pad=${c.padding}`;
  };
  const chain = (el, n = 8) => {
    const rows = [];
    let cur = el;
    for (let i = 0; i < n && cur; i++) {
      rows.push(`  ${'↑'.repeat(i)} ${describe(cur)} ${rect(cur)}`);
      rows.push(`      ${cs(cur)}`);
      cur = cur.parentElement;
    }
    return rows.join('\n');
  };

  // 1) 找 composer 容器
  out.push('=== 1) composer / prompt-input 相关元素 ===');
  const cands = new Set();
  for (const sel of ['[class*="prompt-input"]', '.composer-bar', '.composer-messages-container', '[class*="composer-input"]']) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 50 && r.height > 20) cands.add(el);
    }
  }
  out.push(`  命中 ${cands.size} 个`);
  const list = [...cands].slice(0, 8);
  for (const el of list) {
    out.push(`  - ${describe(el)} ${rect(el)}`);
    out.push(`      ${cs(el)}`);
  }

  // 2) 按占位符文字定位输入区
  out.push('\n=== 2) 按占位符定位 ===');
  const ph = Array.from(document.querySelectorAll('*')).find(
    (el) => el.children.length === 0 && /for skills/i.test(el.textContent || ''),
  );
  if (ph) {
    out.push(`  占位符节点: ${describe(ph)} ${rect(ph)} "${(ph.textContent || '').trim().slice(0, 40)}"`);
    out.push(chain(ph, 9));
  } else {
    out.push('  未找到占位符');
  }

  // 3) 文件变更条（1 File / Undo / Review）
  out.push('\n=== 3) 文件变更条 ===');
  const undo = Array.from(document.querySelectorAll('*')).find(
    (el) => el.children.length === 0 && (el.textContent || '').trim() === 'Undo',
  );
  if (undo) {
    out.push(`  "Undo" 节点: ${describe(undo)} ${rect(undo)}`);
    out.push(chain(undo, 7));
  } else {
    out.push('  未找到 "Undo"');
  }
  return out.join('\n');
})();
