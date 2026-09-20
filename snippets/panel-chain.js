// 从可见的 #chat 向上打印祖先链（完整 class，不截断），确认当前真实结构
(() => {
  const chats = Array.from(document.querySelectorAll('#chat'));
  const visible = chats.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (!visible) return '#chat 无可见实例；当前 #chat 数量=' + chats.length;

  const out = [];
  let cur = visible;
  while (cur && cur !== document.documentElement) {
    const r = cur.getBoundingClientRect();
    const cls = typeof cur.className === 'string' ? cur.className : '(non-string)';
    out.push(
      `${cur.tagName.toLowerCase()}${cur.id ? `#${cur.id}` : ''}  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
    );
    out.push(`    id="${cur.id}"`);
    out.push(`    class="${cls}"`);
    cur = cur.parentElement;
  }
  return out.join('\n');
})();
