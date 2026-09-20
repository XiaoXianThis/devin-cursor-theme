// 给候选 UI 区域打编号描边，便于人工指认要隐藏的部分
// 注意：该应用大量使用带点的 id（如 "windsurf.cascadePanel"、"workbench.parts.editor"），
// 因此一律用 [id="..."] 属性选择器，避免 CSS 转义问题。
(() => {
  // 清理上一次的痕迹
  document.getElementById('__devin_probe_overlay__')?.remove();
  for (const el of document.querySelectorAll('[data-devin-probe]')) {
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.removeAttribute('data-devin-probe');
  }

  const regions = [
    ['P', '右侧聊天面板', '[id="windsurf.cascadePanel"]'],
    ['S', '消息滚动区', '.cascade-scrollbar'],
    ['C', 'composer 输入区', '[class*="beard-band"]'],
    ['H', 'Thoughts 事件头', '[class*="event-header"]'],
    ['M', '单条消息包裹', '[class*="message-wrapper"]'],
    ['W', '欢迎页整块', '.windsurf-welcome-container'],
    ['A', '活动栏', '.monaco-workbench .activitybar'],
    ['B', '侧边栏', '.monaco-workbench .part.sidebar'],
    ['T', '标题栏', '.monaco-workbench .titlebar'],
    ['U', '状态栏', '.monaco-workbench .statusbar'],
    ['E', '编辑器区', '[id="workbench.parts.editor"]'],
  ];

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const onScreen = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  const area = (r) => r.width * r.height;

  const root = document.createElement('div');
  root.id = '__devin_probe_overlay__';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  document.body.appendChild(root);

  const legend = [];
  for (const [label, name, sel] of regions) {
    const all = Array.from(document.querySelectorAll(sel));
    const shown = all.filter((el) => onScreen(el.getBoundingClientRect()));
    if (!shown.length) {
      legend.push(`${label}  ${name}  -> 屏幕内无实例 (共 ${all.length} 个)  ${sel}`);
      continue;
    }
    shown.sort((a, b) => area(b.getBoundingClientRect()) - area(a.getBoundingClientRect()));
    const el = shown[0];
    const r = el.getBoundingClientRect();

    el.setAttribute('data-devin-probe', label);
    el.style.outline = '2px solid #ff3b6b';
    el.style.outlineOffset = '-2px';

    const badge = document.createElement('div');
    badge.textContent = label;
    badge.style.cssText = `position:fixed;left:${Math.round(r.x)}px;top:${Math.round(r.y)}px;
      background:#ff3b6b;color:#fff;font:bold 12px/1.5 monospace;padding:1px 6px;
      border-radius:0 0 4px 0;pointer-events:none`;
    root.appendChild(badge);

    legend.push(
      `${label}  ${name}  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]  ${sel}  (共 ${all.length} 个)`,
    );
  }
  return legend.join('\n');
})();
