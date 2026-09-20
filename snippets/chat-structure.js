// 普查 Devin 聊天区的组件结构：找出工具调用、思考区、代码块对应的类名
(() => {
  const out = [];
  const root = document.querySelector('.cascade-scrollbar');
  if (!root) return '未找到 .cascade-scrollbar';

  // 1) 类名签名普查
  const counts = new Map();
  for (const el of root.querySelectorAll('*')) {
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    if (!cls) continue;
    const sig = cls.split(/\s+/).slice(0, 3).join('.');
    counts.set(sig, (counts.get(sig) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  out.push('=== 类名签名 top 45 ===');
  for (const [s, n] of sorted.slice(0, 45)) out.push(`  ${String(n).padStart(4)}  ${s}`);

  // 2) 事件头（Thoughts / 工具调用标题）结构
  out.push('\n=== event-header 结构 ===');
  const headers = Array.from(root.querySelectorAll('[class*="event-header"]'));
  out.push(`共 ${headers.length} 个`);
  headers.slice(0, 3).forEach((h, i) => {
    out.push(`\n--- #${i} outerHTML (600 字符) ---`);
    out.push(h.outerHTML.slice(0, 600));
    const parent = h.parentElement;
    out.push(`\n    父: ${parent.tagName.toLowerCase()}.${(typeof parent.className === 'string' ? parent.className : '').slice(0, 120)}`);
    out.push(`    父的子元素 ${parent.children.length} 个:`);
    Array.from(parent.children).forEach((c, j) => {
      out.push(`      [${j}] ${c.tagName.toLowerCase()}.${(typeof c.className === 'string' ? c.className : '').slice(0, 90)}`);
    });
  });

  // 3) 代码块结构
  out.push('\n=== 消息里的 pre/code 结构 ===');
  const pres = Array.from(root.querySelectorAll('pre'));
  out.push(`pre 数量: ${pres.length}`);
  pres.slice(0, 2).forEach((p, i) => {
    out.push(`--- pre #${i} ---`);
    out.push(`  class="${typeof p.className === 'string' ? p.className : ''}"`);
    out.push(`  outerHTML(400): ${p.outerHTML.slice(0, 400)}`);
  });

  // 4) 折叠面板
  out.push('\n=== 折叠/工具相关类 ===');
  const cand = new Set();
  for (const el of root.querySelectorAll('[class]')) {
    const cls = typeof el.className === 'string' ? el.className : '';
    for (const m of cls.matchAll(/\b([\w-]*(?:tool|collaps|thinking|thought|event|step|action)[\w-]*)\b/gi)) {
      cand.add(m[1]);
    }
  }
  out.push([...cand].sort().join('\n  '));
  return out.join('\n');
})();
