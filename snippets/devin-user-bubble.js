// 找 Devin 用户消息气泡的稳定选择器
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 6).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `r=${c.borderRadius} bg=${c.backgroundColor} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} fs=${c.fontSize} lh=${c.lineHeight}`;
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';

  // 找那个圆角不对称的气泡
  const bubbles = [];
  for (const el of panel.querySelectorAll('.cascade-scrollbar div')) {
    const c = getComputedStyle(el);
    if (!/^16px 4px 16px 16px$/.test(c.borderRadius)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 100) continue;
    bubbles.push(el);
  }
  out.push(`=== 圆角为 16px 4px 16px 16px 的气泡: ${bubbles.length} 个 ===`);
  for (const b of bubbles.slice(0, 2)) {
    out.push(`  ${describe(b)} ${rect(b)}`);
    out.push(`      ${S(b)}`);
    out.push(`      文本: "${(b.textContent || '').trim().slice(0, 40)}"`);
    let cur = b;
    for (let i = 0; i < 8 && cur; i++) {
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}`);
      out.push(`      ${S(cur)}`);
      cur = cur.parentElement;
    }
  }

  // 对照：助手消息的包裹
  out.push('\n=== 助手消息包裹（对照）===');
  const agent = panel.querySelector('.group\\/acp-agent-message');
  if (agent) {
    out.push(`  ${describe(agent)} ${rect(agent)}`);
    out.push(`      ${S(agent)}`);
  }

  // 兄弟结构：气泡的父节点有哪些孩子
  if (bubbles.length) {
    let p = bubbles[0].parentElement;
    for (let i = 0; i < 4 && p; i++) {
      out.push(`\n[父 ${i}] ${describe(p)} 子元素 ${p.children.length}:`);
      Array.from(p.children).forEach((c, j) => {
        out.push(`    [${j}] ${describe(c)} ${S(c)} "${(c.textContent || '').trim().slice(0, 25)}"`);
      });
      p = p.parentElement;
    }
  }
  return out.join('\n');
})();
