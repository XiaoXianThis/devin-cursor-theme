// 定位欢迎页里的 "Recent sessions" 区块，并探查是否能在页面里触达 VS Code 服务
(() => {
  const out = [];

  // --- 1. 找 Recent sessions ---
  out.push('=== 查找 "Recent sessions" ===');
  const all = Array.from(document.querySelectorAll('*')).filter((el) =>
    (el.textContent || '').includes('Recent sessions'),
  );
  out.push(`包含该文字的元素: ${all.length} 个`);
  if (all.length) {
    // 取最深的一个
    const deepest = all[all.length - 1];
    let cur = deepest;
    const chain = [];
    let d = 0;
    while (cur && cur !== document.body && d < 14) {
      const cls = typeof cur.className === 'string' ? cur.className : '';
      chain.push(
        `${'  '.repeat(d)}${cur.tagName.toLowerCase()}${cur.id ? ` id="${cur.id}"` : ''}${cls ? ` .${cls.trim().split(/\s+/).join('.')}` : ''}`,
      );
      cur = cur.parentElement;
      d++;
    }
    out.push(chain.join('\n'));
    out.push(`\n自身 outerHTML: ${deepest.outerHTML.slice(0, 300)}`);

    // 往上找几层，打印每层的兄弟结构，便于判断该藏哪一层
    let node = deepest;
    for (let level = 0; level < 5 && node?.parentElement; level++) {
      node = node.parentElement;
      const cls = typeof node.className === 'string' ? node.className : '';
      out.push(
        `\n[上溯 ${level + 1}] ${node.tagName.toLowerCase()} .${cls.trim().split(/\s+/).slice(0, 6).join('.')} 子元素 ${node.children.length} 个:`,
      );
      Array.from(node.children).forEach((c, i) => {
        const ccls = typeof c.className === 'string' ? c.className.split(/\s+/).slice(0, 4).join('.') : '';
        out.push(`    [${i}] ${c.tagName.toLowerCase()} .${ccls}  "${(c.textContent || '').trim().slice(0, 50)}"`);
      });
    }
  }

  // --- 2. 探查可触达的 API ---
  out.push('\n\n=== 页面内可触达的全局 ===');
  out.push(`typeof window.monaco = ${typeof window.monaco}`);
  out.push(`typeof window.vscode = ${typeof window.vscode}`);
  out.push(`typeof window.acquireVsCodeApi = ${typeof window.acquireVsCodeApi}`);
  const suspicious = Object.keys(window).filter((k) =>
    /vscode|command|workbench|service|config|instantiation/i.test(k),
  );
  out.push(`可疑全局键: ${JSON.stringify(suspicious.slice(0, 30))}`);
  const wbKeys = Object.keys(document.querySelector('.monaco-workbench') ?? {});
  out.push(`.monaco-workbench 自有键: ${JSON.stringify(wbKeys.slice(0, 20))}`);
  return out.join('\n');
})();
