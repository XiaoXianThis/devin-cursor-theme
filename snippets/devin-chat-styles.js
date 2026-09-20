// 在 Devin 里找用户消息气泡 / 代码块 / diff gutter
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
    return `fs=${c.fontSize} lh=${c.lineHeight} color=${c.color} bg=${c.backgroundColor} r=${c.borderRadius} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} mar=${c.margin}`;
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';

  // 1) 用户消息：找带背景+圆角的、宽度接近满宽的块
  out.push('=== 1) 候选：用户消息气泡（有背景或圆角的消息块）===');
  const seen = new Set();
  for (const el of panel.querySelectorAll('.cascade-scrollbar *')) {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!(r.width > 300 && r.height > 18 && r.height < 200)) continue;
    const hasBg = c.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasRadius = c.borderRadius !== '0px';
    if (!hasBg && !hasRadius) continue;
    const sig = `${(typeof el.className === 'string' ? el.className : '').slice(0, 45)}|${c.backgroundColor}|${c.borderRadius}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(el)} ${rect(el)}`);
    out.push(`      ${S(el)}  "${(el.textContent || '').trim().slice(0, 30)}"`);
    if (seen.size > 14) break;
  }

  // 2) 用户消息按文字定位
  out.push('\n=== 2) 按用户消息文字定位 ===');
  for (const kw of ['再全面对齐一下聊天框', '输入框改成图中这样']) {
    const leaf = Array.from(panel.querySelectorAll('*')).find(
      (el) => el.children.length === 0 && (el.textContent || '').includes(kw),
    );
    out.push(`  "${kw}": ${leaf ? '找到' : '未找到'}`);
    if (!leaf) continue;
    let cur = leaf;
    for (let i = 0; i < 8 && cur; i++) {
      out.push(`  ↑${i} ${describe(cur)} ${rect(cur)}`);
      out.push(`      ${S(cur)}`);
      cur = cur.parentElement;
    }
  }

  // 3) 行内代码
  out.push('\n=== 3) 行内代码 ===');
  const code = panel.querySelector('.prose-main code');
  if (code) {
    out.push(`  ${describe(code)} ${rect(code)}`);
    out.push(`      ${S(code)}`);
  } else out.push('  未找到');

  // 4) diff 行 + gutter
  out.push('\n=== 4) diff 行 / gutter ===');
  for (const sel of ['.diff-line-insert', '.diff-line-delete', '[class*="gutter"]', '[class*="line-number"]']) {
    const hits = Array.from(panel.querySelectorAll(sel));
    out.push(`  ${sel} -> ${hits.length}`);
    if (hits.length) {
      out.push(`      ${describe(hits[0])} ${rect(hits[0])}`);
      out.push(`      ${S(hits[0])}`);
    }
  }

  // 5) 代码块 / 命令行块
  out.push('\n=== 5) 代码块 / 命令行 ===');
  const seen2 = new Set();
  for (const el of panel.querySelectorAll('.group\\/card, pre, [class*="code"]')) {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const sig = `${(typeof el.className === 'string' ? el.className : '').slice(0, 40)}|${c.backgroundColor}|${c.borderRadius}`;
    if (seen2.has(sig)) continue;
    seen2.add(sig);
    out.push(`  ${describe(el)} ${rect(el)}`);
    out.push(`      ${S(el)}`);
    if (seen2.size > 10) break;
  }
  return out.join('\n');
})();
