// 1) 深挖 window.vscode 是否能触达 commands/configuration
// 2) 在欢迎页范围内重新定位 "Recent sessions"
(() => {
  const out = [];

  out.push('=== window.vscode 结构 ===');
  const v = window.vscode;
  out.push(`typeof = ${typeof v}`);
  if (v) {
    out.push(`自有键: ${JSON.stringify(Object.keys(v))}`);
    out.push(`原型键: ${JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(v) ?? {}))}`);
    for (const k of Object.keys(v)) {
      let t;
      try {
        t = typeof v[k];
      } catch (e) {
        t = 'ERR';
      }
      out.push(`    ${k}: ${t}`);
    }
    out.push(`commands 存在: ${typeof v.commands}`);
    out.push(`configuration 存在: ${typeof v.configuration}`);
    out.push(`env.appName: ${v.env?.appName}`);
    out.push(`version: ${v.version}`);
  }

  out.push('\n=== 欢迎页内的 "Recent sessions" ===');
  const welcome = document.querySelector('.windsurf-welcome-container');
  if (!welcome) {
    out.push('欢迎页容器不存在');
  } else {
    const hits = Array.from(welcome.querySelectorAll('*')).filter((el) =>
      (el.textContent || '').includes('Recent sessions'),
    );
    out.push(`容器内匹配: ${hits.length} 个`);
    if (hits.length) {
      const deepest = hits[hits.length - 1];
      out.push(`最深者: ${deepest.tagName.toLowerCase()}.${typeof deepest.className === 'string' ? deepest.className.split(/\s+/).slice(0, 6).join('.') : ''}`);
      out.push(`outerHTML: ${deepest.outerHTML.slice(0, 200)}`);
      let cur = deepest;
      for (let i = 0; i < 6 && cur?.parentElement; i++) {
        cur = cur.parentElement;
        const cls = typeof cur.className === 'string' ? cur.className : '';
        out.push(
          `\n[上溯 ${i + 1}] ${cur.tagName.toLowerCase()} .${cls.trim().split(/\s+/).slice(0, 6).join('.')}  子元素 ${cur.children.length} 个:`,
        );
        Array.from(cur.children).forEach((c, j) => {
          const ccls = typeof c.className === 'string' ? c.className.split(/\s+/).slice(0, 4).join('.') : '';
          out.push(`    [${j}] ${c.tagName.toLowerCase()} .${ccls}  "${(c.textContent || '').trim().slice(0, 60)}"`);
        });
      }
    }
  }
  return out.join('\n');
})();
