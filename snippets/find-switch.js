// 用坐标反查左上角 "Agent | Editor" 切换器究竟是哪个元素
(() => {
  const out = [];

  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''}${cls ? ` .${cls.trim().split(/\s+/).slice(0, 6).join('.')}` : ''}`;
  };

  for (const [x, y] of [
    [100, 22],
    [20, 22],
    [160, 22],
    [60, 22],
  ]) {
    out.push(`\n=== elementFromPoint(${x}, ${y}) ===`);
    const stack = document.elementsFromPoint(x, y);
    if (!stack.length) {
      out.push('  (空)');
      continue;
    }
    stack.slice(0, 8).forEach((el, i) => {
      const r = el.getBoundingClientRect();
      out.push(
        `  [${i}] ${describe(el)} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] text="${(el.textContent || '').trim().slice(0, 30)}"`,
      );
    });
  }

  // 找出所有 y<45 且可见、且文字含 Agent/Editor 的元素
  out.push('\n=== y<45 且文字含 Agent/Editor 的可见元素 ===');
  const hits = Array.from(document.querySelectorAll('*')).filter((el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && r.y < 45 && r.x < 400)) return false;
    const t = (el.textContent || '').trim();
    return t === 'Agent' || t === 'Editor' || t === 'AgentEditor';
  });
  hits.forEach((el) => {
    const r = el.getBoundingClientRect();
    out.push(`  ${describe(el)} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] "${(el.textContent || '').trim()}"`);
    let cur = el.parentElement;
    let d = 0;
    while (cur && d < 8) {
      out.push(`      ↑ ${describe(cur)}`);
      cur = cur.parentElement;
      d++;
    }
  });
  if (!hits.length) out.push('  (无)');

  return out.join('\n');
})();
