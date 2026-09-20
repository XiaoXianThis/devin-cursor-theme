// 验证各条 CSS 规则是否命中目标元素
(() => {
  const out = [];
  const check = (label, sel, expect) => {
    let els = [];
    try {
      els = Array.from(document.querySelectorAll(sel));
    } catch (e) {
      out.push(`${label}\n    选择器报错: ${e.message}`);
      return;
    }
    if (!els.length) {
      out.push(`${label}\n    ✗ 无匹配 (期望 ${expect})  ${sel}`);
      return;
    }
    const info = els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `display=${getComputedStyle(el).display} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
      })
      .join(' | ');
    out.push(`${label}\n    ${els.length} 个匹配: ${info}`);
  };

  check('R2 composer 底部 Local 那条 (应为 none)', '.chat-client-root .group\\/beard-band div.relative.flex.w-full.flex-col.overflow-x-clip', 'none');
  check('R4 中间欢迎页聊天框 (应为 none)', '.windsurf-welcome-container .group\\/beard-band', 'none');
  check('R6 隐藏的 4 个图标 (应为 none)', '[id="workbench.parts.sidebar"] .composite-bar .actions-container > .action-item:has(> .action-label.codicon-map)', 'none');
  check('R7 agent/editor 切换器 (应为 none)', '.agent-editor-switch', 'none');

  const tb = document.querySelector('[id="workbench.parts.titlebar"]');
  out.push(
    `\nR8 标题栏 position=${tb ? getComputedStyle(tb).position : '?'} rect=${tb ? JSON.stringify(tb.getBoundingClientRect().toJSON()) : '?'}`,
  );

  // 当前保留的图标
  const items = Array.from(
    document.querySelectorAll('[id="workbench.parts.sidebar"] .composite-bar .actions-container > .action-item'),
  );
  out.push(`\n图标行共 ${items.length} 个，可见的:`);
  for (const it of items) {
    const r = it.getBoundingClientRect();
    const lbl = it.querySelector('.action-label');
    if (r.width > 0) {
      out.push(`    [${Math.round(r.x)},${Math.round(r.y)}] ${lbl?.getAttribute('aria-label') ?? lbl?.title ?? ''}`);
    }
  }
  return out.join('\n');
})();
