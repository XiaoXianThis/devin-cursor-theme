// 全量验证 devin-ui.js 的每条规则
(() => {
  const out = [];
  const WELCOME = '.windsurf-welcome-container';

  const check = (label, sel) => {
    let els = [];
    try {
      els = Array.from(document.querySelectorAll(sel));
    } catch (e) {
      out.push(`✗ ${label}\n    选择器报错: ${e.message}`);
      return;
    }
    if (!els.length) {
      out.push(`? ${label}\n    无匹配  ${sel}`);
      return;
    }
    const info = els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `display=${getComputedStyle(el).display}[${Math.round(r.width)}x${Math.round(r.height)}]`;
      })
      .join(' ');
    const allHidden = els.every((el) => getComputedStyle(el).display === 'none');
    out.push(`${allHidden ? '✓' : '✗'} ${label}\n    ${els.length} 个: ${info}`);
  };

  out.push('=== 样式规则 ===');
  check('1 底部 Local 那条', '.chat-client-root .group\\/beard-band div.relative.flex.w-full.flex-col.overflow-x-clip');
  check('2 agent/editor 切换器', '.agent-editor-switch');
  check('4 欢迎页聊天输入框', WELCOME + ' .group\\/beard-band');
  check('5 欢迎页 Recent sessions', WELCOME + ' .absolute.top-full');
  check('7 隐藏的 4 个图标', '[id="workbench.parts.sidebar"] .composite-bar .actions-container:not(.devin-icons-expanded) > .action-item:has(> .action-label.codicon-map)');

  const tb = document.querySelector('[id="workbench.parts.titlebar"]');
  out.push(`\n=== 3 标题栏 ===\n    position=${tb ? getComputedStyle(tb).position : '?'} rect=${tb ? JSON.stringify(tb.getBoundingClientRect().toJSON()) : '?'}`);

  out.push('\n=== 9 主题变量 ===');
  const wb = document.querySelector('.monaco-workbench');
  const cs = getComputedStyle(wb);
  for (const v of ['--vscode-focusBorder', '--vscode-list-focusOutline', '--vscode-tab-activeBorderTop']) {
    out.push(`    ${v} = ${cs.getPropertyValue(v) || '(空)'}`);
  }

  out.push('\n=== 8 展开按钮 ===');
  const btn = document.getElementById('devin-icon-expand');
  out.push(`    已挂载: ${!!btn}  title="${btn ? btn.title : ''}"`);
  const container = document.querySelector('[id="workbench.parts.sidebar"] .composite-bar .actions-container');
  if (container) {
    const items = Array.from(container.querySelectorAll(':scope > .action-item'));
    const vis = items.filter((e) => e.getBoundingClientRect().width > 0);
    out.push(`    图标: 共 ${items.length} 可见 ${vis.length} -> ${vis.map((e) => e.querySelector('.action-label')?.getAttribute('aria-label') || '?').join(', ')}`);
  }
  out.push(`    样式表已注入: ${!!document.getElementById('devin-ui-style')}`);
  return out.join('\n');
})();
