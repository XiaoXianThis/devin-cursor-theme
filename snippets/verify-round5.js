// 验证第 15 段
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';
  const S = (el) => {
    const c = getComputedStyle(el);
    return `r=${c.borderRadius} bg=${c.backgroundColor} bd=${c.borderTopWidth}/${c.borderTopColor} pad=${c.padding} fs=${c.fontSize} lh=${c.lineHeight} color=${c.color} opacity=${c.opacity}`;
  };
  const show = (label, el) => {
    if (!el) {
      out.push(`? ${label}: 未找到`);
      return;
    }
    out.push(`✓ ${label}: ${S(el)}`);
  };

  out.push('=== 1) 用户消息气泡 ===');
  show('  气泡', panel.querySelector('.group\\/message-wrapper.ml-auto > div > div:first-child'));

  out.push('\n=== 2) 思考区 ===');
  const hw = panel.querySelector('.highlight-wrapper');
  if (hw) {
    const body = hw.querySelector(':scope > div:not(.group\\/event-header)');
    show('  正文外层', body);
    show('  标题', hw.querySelector('.group\\/event-header'));
  } else out.push('  无 highlight-wrapper');

  out.push('\n=== 3) 行内代码 ===');
  show('  code', panel.querySelector('.prose-main.prose-ds :not(pre) > code'));

  out.push('\n=== 4) diff 行 ===');
  show('  增行', panel.querySelector('.diff-line-insert'));
  show('  删行', panel.querySelector('.diff-line-delete'));

  out.push('\n=== 5) 卡片 / 代码块 ===');
  show('  .group/card', panel.querySelector('.group\\/card'));
  show('  .group/codeblock', panel.querySelector('.group\\/codeblock'));

  out.push('\n=== 6) 终端输出 ===');
  show('  pre.terminal-text', panel.querySelector('pre.terminal-text'));
  show('  pre.ansi-text', panel.querySelector('pre.ansi-text'));

  out.push('\n=== 样式表 ===');
  const st = document.getElementById('devin-ui-style');
  out.push(`  规则数 ${st?.sheet?.cssRules.length}  长度 ${st?.textContent.length}`);
  return out.join('\n');
})();
