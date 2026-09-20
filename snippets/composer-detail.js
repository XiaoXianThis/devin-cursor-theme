// 详查 composer：工具栏按钮（+/Bypass/模型/agent 切换）、附件区、思考区
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到聊天面板';

  // --- 1. composer 整棵树 ---
  out.push('=== composer 子树 (beard-band, 深度 5) ===');
  const band = panel.querySelector('.group\\/beard-band');
  if (band) {
    const walk = (el, d) => {
      if (d > 5) return;
      const own = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 40) : '';
      const icon = el.tagName.toLowerCase() === 'svg' ? ' <svg>' : '';
      out.push(
        `${'  '.repeat(d)}${describe(el)} ${rect(el)}${own ? `  "${own}"` : ''}${icon}`,
      );
      for (const c of el.children) walk(c, d + 1);
    };
    walk(band, 0);
  } else {
    out.push('  未找到 beard-band');
  }

  // --- 2. 工具栏里的按钮逐个列 ---
  out.push('\n=== composer 内所有 button ===');
  const btns = Array.from(panel.querySelectorAll('.group\\/beard-band button'));
  btns.forEach((b, i) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    out.push(
      `  [${i}] ${rect(b)} title="${b.getAttribute('aria-label') ?? b.title ?? ''}" text="${(b.textContent || '').trim().slice(0, 30)}" svg=${b.querySelectorAll('svg').length} cls="${(typeof b.className === 'string' ? b.className : '').slice(0, 60)}"`,
    );
  });

  // --- 3. 附件区 ---
  out.push('\n=== 附件区 ===');
  const atts = Array.from(panel.querySelectorAll('.group\\/attachment'));
  out.push(`  .group/attachment 数量: ${atts.length}`);
  atts.slice(0, 3).forEach((a, i) => {
    out.push(`  [${i}] ${rect(a)} outerHTML(300): ${a.outerHTML.slice(0, 300)}`);
  });
  const attRow = panel.querySelector('[class*="max-h-[150px]"]');
  if (attRow) out.push(`  附件行容器: ${describe(attRow)} ${rect(attRow)}`);

  // --- 4. 思考区（展开的 event 内容）---
  out.push('\n=== 事件头 / 思考内容 ===');
  const headers = Array.from(panel.querySelectorAll('.group\\/event-header'));
  out.push(`  event-header 数量: ${headers.length}`);
  headers.slice(0, 2).forEach((h, i) => {
    out.push(`  [${i}] ${rect(h)} text="${(h.textContent || '').trim().slice(0, 40)}"`);
  });
  const hw = panel.querySelector('.highlight-wrapper');
  if (hw) {
    out.push(`  .highlight-wrapper: ${describe(hw)} ${rect(hw)}`);
    out.push(`    子元素:`);
    Array.from(hw.children).forEach((c, i) => {
      out.push(`      [${i}] ${describe(c)} ${rect(c)} "${(c.textContent || '').trim().slice(0, 50)}"`);
    });
  }
  return out.join('\n');
})();
