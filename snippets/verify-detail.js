// 验证第 11 段（思考区 / 输入框 / 工具栏按钮）是否生效
(() => {
  const out = [];
  const q = (s, r = document) => r.querySelector(s);
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const line = (label, el, props) => {
    if (!el) {
      out.push(`? ${label}: 未找到`);
      return;
    }
    const c = cs(el);
    out.push(`${label}: ${props.map((p) => `${p}=${c[p]}`).join(' ')}`);
  };

  const panel = q('[id="windsurf.cascadePanel"]');
  const band = panel && q('.group\\/beard-band', panel);

  out.push('=== 思考区 ===');
  line('  event-header', panel && q('.group\\/event-header', panel), ['fontSize', 'lineHeight', 'color']);
  const hw = panel && q('.highlight-wrapper', panel);
  line('  highlight-wrapper', hw, ['color']);
  const body = hw && q('.flex.min-w-0.flex-col.text-12', hw);
  line('  思考正文', body, ['fontSize', 'lineHeight']);

  out.push('\n=== 工具栏标记 ===');
  for (const [attr, desc] of [
    ['data-devin-add-context', '“+” 按钮'],
    ['data-devin-perm', '权限按钮'],
    ['data-devin-agent-switch', 'agent 切换'],
  ]) {
    const el = document.querySelector(`[${attr}]`);
    if (!el) {
      out.push(`  ✗ ${desc} 未打标记 (${attr})`);
      continue;
    }
    const c = cs(el);
    const r = el.getBoundingClientRect();
    out.push(
      `  ✓ ${desc}: display=${c.display} bg=${c.backgroundColor} radius=${c.borderRadius} size=${Math.round(r.width)}x${Math.round(r.height)} text="${(el.textContent || '').trim().slice(0, 20)}"`,
    );
  }

  out.push('\n=== 附件行位置 ===');
  const inputBox = band && q('div.cursor-text.border', band);
  if (inputBox) {
    const kids = Array.from(inputBox.children);
    out.push(`  输入框子元素顺序:`);
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      const c = cs(k);
      out.push(
        `    ${k.tagName.toLowerCase()}.${(typeof k.className === 'string' ? k.className : '').slice(0, 40)} order=${c.order} y=${Math.round(r.y)}`,
      );
    }
  } else {
    out.push('  未找到输入框');
  }

  out.push('\n=== 样式表 ===');
  const st = document.getElementById('devin-ui-style');
  out.push(`  规则数: ${st?.sheet?.cssRules.length ?? 'n/a'}  长度: ${st?.textContent.length ?? 'n/a'}`);
  return out.join('\n');
})();
