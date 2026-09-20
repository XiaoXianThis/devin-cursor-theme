// 补查：思考区的 opacity 链 / 思考标题 / 用户气泡 / 卡片容器 / 代码块
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
    return `fs=${c.fontSize} lh=${c.lineHeight} fw=${c.fontWeight} color=${c.color} opacity=${c.opacity} bg=${c.backgroundColor} r=${c.borderRadius} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding}`;
  };

  // 1) 思考区的 opacity 链
  out.push('=== 1) 思考区的 opacity 链 ===');
  const thinkP = Array.from(document.querySelectorAll('*')).find(
    (el) => el.children.length === 0 && (el.textContent || '').includes('用户要求创建一个'),
  );
  if (thinkP) {
    let cur = thinkP;
    for (let i = 0; i < 9 && cur; i++) {
      const c = getComputedStyle(cur);
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}`);
      out.push(`      color=${c.color} opacity=${c.opacity} filter=${c.filter} mix=${c.mixBlendMode}`);
      cur = cur.parentElement;
    }
  }

  // 2) 助手正文的 opacity 链（对照）
  out.push('\n=== 2) 助手正文 opacity 链（对照）===');
  const asstP = Array.from(document.querySelectorAll('*')).find(
    (el) => el.children.length === 0 && (el.textContent || '').includes('项目还没有 README'),
  );
  if (asstP) {
    let cur = asstP;
    for (let i = 0; i < 9 && cur; i++) {
      const c = getComputedStyle(cur);
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}  color=${c.color} opacity=${c.opacity}`);
      cur = cur.parentElement;
    }
  }

  // 3) 思考标题 / 状态行（模糊找）
  out.push('\n=== 3) 思考标题 / 状态行 ===');
  for (const kw of ['Thought', 'Worked for', 'Working for']) {
    const hits = Array.from(document.querySelectorAll('*')).filter(
      (el) => el.children.length === 0 && (el.textContent || '').includes(kw),
    );
    out.push(`  "${kw}" 叶子命中 ${hits.length}`);
    for (const h of hits.slice(0, 2)) {
      out.push(`    ${describe(h)} ${rect(h)}`);
      out.push(`        ${S(h)}`);
      let cur = h.parentElement;
      for (let i = 0; i < 3 && cur; i++) {
        out.push(`        ↑${i} ${describe(cur)} ${rect(cur)} ${S(cur)}`);
        cur = cur.parentElement;
      }
    }
  }

  // 4) 用户消息气泡容器
  out.push('\n=== 4) 用户消息气泡容器 ===');
  for (const sel of ['.composer-human-message', '[class*="human-message"]']) {
    const hits = Array.from(document.querySelectorAll(sel));
    out.push(`  ${sel} -> ${hits.length}`);
    for (const h of hits.slice(0, 3)) {
      out.push(`    ${describe(h)} ${rect(h)}`);
      out.push(`        ${S(h)}`);
    }
  }

  // 5) 折叠卡片容器
  out.push('\n=== 5) 折叠卡片 / 代码块容器 ===');
  const seen = new Set();
  for (const sel of ['[class*="ui-collapsible"]', '.ui-code-block', '.ui-markdown pre', '[class*="code-block"]']) {
    for (const el of document.querySelectorAll(sel)) {
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const sig = `${sel}|${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(`  ${describe(el)} ${rect(el)}`);
      out.push(`      ${S(el)}`);
      if (seen.size > 12) break;
    }
  }
  return out.join('\n');
})();
