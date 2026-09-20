// 在 Cursor 里全面抓聊天区样式：用户消息 / 思考区 / 正文 / 文件变更卡 / 行内代码
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `fs=${c.fontSize} lh=${c.lineHeight} fw=${c.fontWeight} color=${c.color} bg=${c.backgroundColor} r=${c.borderRadius} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} mar=${c.margin} ff=${c.fontFamily.split(',')[0]}`;
  };

  const dumpByText = (label, needle, maxUp) => {
    out.push(`\n########## ${label}  ("${needle}") ##########`);
    const leaves = Array.from(document.querySelectorAll('*')).filter(
      (el) => el.children.length === 0 && (el.textContent || '').includes(needle),
    );
    if (!leaves.length) {
      out.push('  未找到');
      return;
    }
    const leaf = leaves[0];
    out.push(`  叶子: ${describe(leaf)} ${rect(leaf)}`);
    out.push(`      ${S(leaf)}`);
    let cur = leaf;
    for (let i = 0; i < (maxUp ?? 6) && cur; i++) {
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}`);
      out.push(`      ${S(cur)}`);
      cur = cur.parentElement;
    }
  };

  // 聊天容器
  const composer = document.querySelector('.composer-bar');
  out.push(`composer-bar: ${composer ? rect(composer) : '未找到'}`);

  dumpByText('用户消息气泡', '写一个.md文件', 6);
  dumpByText('状态行 Worked for', 'Worked for', 4);
  dumpByText('思考标题 Thought', 'Thought 3s', 4);
  dumpByText('思考正文', '用户要求创建一个', 4);
  dumpByText('助手正文', '项目还没有 README', 5);
  dumpByText('文件变更卡文件名', 'README.md', 7);
  dumpByText('行内代码', 'README.md', 3);

  // diff 行
  out.push('\n########## diff 行 ##########');
  const diffSeen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const cls = typeof el.className === 'string' ? el.className : '';
    if (!/diff|line/i.test(cls)) continue;
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!(r.width > 50 && r.height > 5)) continue;
    const sig = `${cls.slice(0, 40)}|${c.backgroundColor}|${c.fontSize}`;
    if (diffSeen.has(sig)) continue;
    diffSeen.add(sig);
    out.push(`  ${describe(el)} ${rect(el)}`);
    out.push(`      ${S(el)}`);
    if (diffSeen.size > 10) break;
  }

  // 行内代码
  out.push('\n########## code / pre 元素 ##########');
  const codeSeen = new Set();
  for (const el of document.querySelectorAll('.composer-bar code, .composer-bar pre, .composer-bar [class*="code-block"]')) {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const sig = `${el.tagName}|${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}`;
    if (codeSeen.has(sig)) continue;
    codeSeen.add(sig);
    out.push(`  ${describe(el)} ${rect(el)}`);
    out.push(`      ${S(el)}`);
    if (codeSeen.size > 8) break;
  }
  return out.join('\n');
})();
