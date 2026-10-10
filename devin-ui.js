// ============================================================================
// Devin Desktop UI 精简 —— 单文件版
// ----------------------------------------------------------------------------
// 把界面改成 Cursor 那样简洁。所有样式与行为都在这一个文件里，
// 不含任何机器相关路径，可直接复用/分享。
//
// 安装（详见同目录 README.md）：
//   1. 把本文件放到 ~/.devin/devin-ui.js
//   2. settings.json 里加：
//        "custom-ui-style.external.imports": ["file://${userHome}/.devin/devin-ui.js"]
//        "workbench.activityBar.location": "top"
//   3. Ctrl+Shift+P -> "Custom UI Style: Reload"
//
// 依赖扩展：subframe7536.custom-ui-style
//
// 已知限制：注入的 JS 运行在 workbench 渲染进程里，只能拿到 Electron 的
// preload 对象（ipcRenderer / process / context），**拿不到 VS Code 的
// commands / configuration 服务**，所以无法用 JS 去改设置。
// 因此 workbench.activityBar.location 只能靠上面的 settings.json 指定；
// 其余全部由本文件的 CSS 与 JS 完成。
// ============================================================================

(function () {
  'use strict';

  var STYLE_ID = 'devin-ui-style';
  var BTN_ID = 'devin-icon-expand';
  var CONTAINER_SEL = '[id="workbench.parts.sidebar"] .composite-bar .actions-container';

  // --------------------------------------------------------------------------
  // 样式
  // --------------------------------------------------------------------------
  var CSS = [
    '/* ===== 1. 去掉 composer 底部 "Local | <工作区> | +N" 那条 ===== */',
    '.chat-client-root .group\\/beard-band div.relative.flex.w-full.flex-col.overflow-x-clip {',
    '  display: none !important;',
    '}',

    '/* ===== 2. 去掉左上角 agent/editor 切换器 ===== */',
    '.agent-editor-switch {',
    '  display: none !important;',
    '}',

    '/* ===== 3. 标题栏铺满窗口，让菜单（File/Edit/...）直接居左 =====',
    '   titlebar 与 leftheader 分属不同 split-view，只能用 fixed 脱离流，',
    '   覆盖到 leftheader 那块空出来的区域上。 */',
    '[id="workbench.parts.titlebar"] {',
    '  position: fixed !important;',
    '  left: 0 !important;',
    '  top: 0 !important;',
    '  right: 0 !important;',
    '  width: auto !important;',
    '  z-index: 100 !important;',
    '}',

    '/* ===== 4. 去掉编辑器区（中间）欢迎页里的聊天输入框 ===== */',
    '.windsurf-welcome-container .group\\/beard-band {',
    '  display: none !important;',
    '}',

    '/* ===== 5. 欢迎页（空编辑器）的「Recent projects」区块：保持可见 =====',
    '   这里原本把整个区块 display:none（那时不想要 Recent sessions）。',
    '   区块内容是：三张卡片（Open project / Clone repository / Connect via SSH）',
    '   + 「Recent projects」列表 + 右侧 View all。',
    '   默认视图由本文件的 seedRecentView() 种成 projects，不需要 CSS 参与。 */',

    '/* ===== 6. 输入框内那层画描边的 svg =====',
    '   描边改由第 14 段的真实 border 负责，所以这里把这个 svg 隐藏掉。 */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border > svg {',
    '  display: none !important;',
    '}',

    '/* ===== 7. 顶部横排图标：收起时只显示 4 个 =====',
    '   保留 Explorer / Search / Source Control / Extensions，',
    '   隐藏 Devin 专有的 Codemaps、DeepWiki、Remote Explorer、Run and Debug。',
    '   展开状态由本文件在 .actions-container 上切换 .devin-icons-expanded。 */',
    '[id="workbench.parts.sidebar"] .composite-bar .actions-container:not(.devin-icons-expanded) > .action-item:has(> .action-label.codicon-map),',
    '[id="workbench.parts.sidebar"] .composite-bar .actions-container:not(.devin-icons-expanded) > .action-item:has(> .action-label.codicon-deepwiki-icon),',
    '[id="workbench.parts.sidebar"] .composite-bar .actions-container:not(.devin-icons-expanded) > .action-item:has(> .action-label.codicon-remote-explorer-view-icon),',
    '[id="workbench.parts.sidebar"] .composite-bar .actions-container:not(.devin-icons-expanded) > .action-item:has(> .action-label.codicon-run-view-icon) {',
    '  display: none !important;',
    '}',

    '/* ===== 8. 展开/收起按钮 ===== */',
    '#' + BTN_ID + ' {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  flex: 0 0 auto;',
    '  width: 26px;',
    '  height: 100%;',
    '  min-height: 26px;',
    '  padding: 0;',
    '  margin: 0;',
    '  background: transparent;',
    '  border: none;',
    '  outline: none;',
    '  color: inherit;',
    '  opacity: 0.55;',
    '  cursor: pointer;',
    '}',
    '#' + BTN_ID + ':hover {',
    '  opacity: 1;',
    '}',
    '#' + BTN_ID + ' .codicon {',
    '  font-size: 14px;',
    '  transition: transform 0.15s ease;',
    '}',
    '#' + BTN_ID + '.devin-expanded .codicon {',
    '  transform: rotate(180deg);',
    '}',

    '/* ===== 9. 主题变量覆盖：去掉各种蓝色描边/outline 强调 =====',
    '   直接在 CSS 里覆盖变量，等价于 workbench.colorCustomizations，',
    '   这样分享时对方不必改这一项设置。',
    '   注意：!important 才能压过 VS Code 写在元素上的行内变量。 */',
    '.monaco-workbench {',
    '  --vscode-focusBorder: transparent !important;',
    '  --vscode-list-focusOutline: transparent !important;',
    '  --vscode-panelTitle-activeBorder: transparent !important;',
    '  --vscode-activityBar-activeBorder: transparent !important;',
    '  --vscode-activityBar-activeBackground: transparent !important;',
    '  --vscode-tab-activeBorder: transparent !important;',
    '  --vscode-tab-activeBorderTop: transparent !important;',
    '  --vscode-tab-border: transparent !important;',
    '}',
    '/* ===== 10. 复刻 Cursor 的聊天排版 =====',
    '   token 全部取自 Cursor 的 workbench.desktop.main.css：',
    '     --cursor-font-size-lg:14px      --cursor-line-height-lg:22px',
    '     --cursor-font-size-base:13px    --cursor-letter-spacing-base:-0.08px',
    '     --cursor-stroke-secondary: color-mix(in srgb, base 12%, transparent)',
    '     --conversation-block-gap:16px   --conversation-list-item-gap:8px',
    '     --conversation-tool-card-padding-x/y: 10px / 8px, gap:6px',
    '     --rte-font-size-code:.9em       h1:1.75em h2:1.5em h3:1.25em h4:1.1em',
    '   Devin 侧对应元素：',
    '     正文   .prose-main.prose-ds      工具卡 .group/card > .group/header',
    '     思考区 .group/event-header        终端   pre.terminal-text / pre.ansi-text */',
    '.chat-client-root {',
    '  --ds-font-sans: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);',
    '  --ds-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;',
    '  --ds-text-size: 14px;',
    '  --ds-line-height: 22px;',
    '  --ds-tray-size: 13px;',
    '  --ds-tracking: -0.08px;',
    '  --ds-block-gap: 16px;',
    '  --ds-list-item-gap: 8px;',
    '  --ds-card-pad-x: 10px;',
    '  --ds-card-gap: 6px;',
    '  --ds-radius-lg: 8px;',
    '  --ds-radius-xl: 12px;',
    '  --ds-stroke-2: color-mix(in srgb, var(--vscode-editor-foreground) 12%, transparent);',
    '  --ds-stroke-3: color-mix(in srgb, var(--vscode-editor-foreground) 8%, transparent);',
    '  --ds-stroke-strong: color-mix(in srgb, var(--vscode-editor-foreground) 20%, transparent);',
    '  --ds-fill-faint: color-mix(in srgb, var(--vscode-editor-foreground) 4%, transparent);',
    '  /* 不透明版：同样的 4% 填充，但底换成不透明的面板色 —— 给浮在消息列表上方的层用。',
    '     半透明的 4% 等于 96% 透明，消息文字会从下面透上来。实测 = rgb(32,33,34) */',
    '  --ds-surface-bg: color-mix(in srgb, var(--vscode-editor-foreground) 4%, var(--vscode-sideBar-background));',
    '  --ds-bubble-bg: color-mix(in srgb, #808080 13.5%, transparent);',
    '  --ds-text-secondary: color-mix(in srgb, var(--vscode-editor-foreground) 74%, transparent);',
    '  --ds-text-tertiary: color-mix(in srgb, var(--vscode-editor-foreground) 60%, transparent);',
    '  --ds-pill-bg: color-mix(in srgb, var(--vscode-editor-foreground) 12%, transparent);',
    '}',

    '/* 正文：字体族 / 字号 / 行高 / 字距 */',
    '.chat-client-root .prose-main.prose-ds {',
    '  font-family: var(--ds-font-sans);',
    '  font-size: var(--ds-text-size);',
    '  line-height: var(--ds-line-height);',
    '  letter-spacing: var(--ds-tracking);',
    '  font-synthesis: none;',
    '  -webkit-font-smoothing: subpixel-antialiased;',
    '}',

    '/* 块间距：段落 / 列表 / 标题 */',
    '.chat-client-root .prose-main.prose-ds p {',
    '  margin-block: 0 var(--ds-block-gap);',
    '}',
    '.chat-client-root .prose-main.prose-ds > :last-child {',
    '  margin-block-end: 0;',
    '}',
    '.chat-client-root .prose-main.prose-ds ul,',
    '.chat-client-root .prose-main.prose-ds ol {',
    '  margin-block: 8px 18px;',
    '  padding-inline-start: 1.4em;',
    '}',
    '.chat-client-root .prose-main.prose-ds li + li {',
    '  margin-block-start: var(--ds-list-item-gap);',
    '}',
    '.chat-client-root .prose-main.prose-ds h1 { font-size: 1.75em; }',
    '.chat-client-root .prose-main.prose-ds h2 { font-size: 1.5em; }',
    '.chat-client-root .prose-main.prose-ds h3 { font-size: 1.25em; }',
    '.chat-client-root .prose-main.prose-ds h4 { font-size: 1.1em; }',
    '.chat-client-root .prose-main.prose-ds h5 { font-size: 1em; }',
    '.chat-client-root .prose-main.prose-ds h1,',
    '.chat-client-root .prose-main.prose-ds h2,',
    '.chat-client-root .prose-main.prose-ds h3,',
    '.chat-client-root .prose-main.prose-ds h4 {',
    '  margin-block-end: 4px;',
    '  font-weight: 590;',
    '  letter-spacing: var(--ds-tracking);',
    '}',

    '/* 行内代码：Cursor 用透明底、无内边距、无圆角 */',
    '.chat-client-root .prose-main.prose-ds :not(pre) > code {',
    '  font-family: var(--ds-font-mono);',
    '  font-size: .9em;',
    '  background: transparent !important;',
    '  padding: 0 !important;',
    '  border-radius: 0 !important;',
    '}',

    '/* 代码块 / 终端输出 */',
    '.chat-client-root .prose-main.prose-ds pre,',
    '.chat-client-root pre.terminal-text,',
    '.chat-client-root pre.ansi-text {',
    '  font-family: var(--ds-font-mono);',
    '  font-size: .9em;',
    '  line-height: 1.5;',
    '  letter-spacing: 0;',
    '  border-radius: var(--ds-radius-lg);',
    '}',

    '/* 工具调用卡片：Cursor 是 8px/10px 内边距、6px 间距、28px 高头部带 1px 分隔线 */',
    '.chat-client-root .group\\/card {',
    '  border-radius: var(--ds-radius-lg) !important;',
    '  border-color: var(--ds-stroke-2) !important;',
    '}',
    '.chat-client-root .group\\/card .group\\/header {',
    '  height: 28px !important;',
    '  gap: 8px !important;',
    '  padding: 0 var(--ds-card-pad-x) 0 calc(var(--ds-card-pad-x) - 2px) !important;',
    '  border-bottom: 1px solid var(--ds-stroke-2) !important;',
    '}',
    '.chat-client-root .group\\/card .codeium-text-medium {',
    '  font-size: var(--ds-text-size) !important;',
    '  letter-spacing: var(--ds-tracking);',
    '}',

    '/* 思考区 / 事件头：Cursor 用 tertiary 文字色，13px 托盘字号 */',
    '.chat-client-root .group\\/event-header {',
    '  font-size: var(--ds-tray-size) !important;',
    '  line-height: 20px !important;',
    '  letter-spacing: var(--ds-tracking);',
    '}',
    '.chat-client-root .highlight-wrapper.text-text-tertiary,',
    '.chat-client-root .flex.flex-col.event-group {',
    '  color: var(--ds-text-tertiary);',
    '}',

    '/* 消息整体字号统一到 14px（Devin 默认 13px） */',
    '.chat-client-root .group\\/message-wrapper,',
    '.chat-client-root .group\\/acp-agent-message {',
    '  font-size: var(--ds-text-size);',
    '  line-height: var(--ds-line-height);',
    '  letter-spacing: var(--ds-tracking);',
    '}',

    '/* ===== 11. 思考区 / 输入框细节对齐 Cursor =====',

    '   Devin 思考区实测：标题 13px/20px，正文 .text-12 只有 12px/16px。',
    '   Cursor 是标题 14px、正文 14px/22px，所以正文要放大。 */',
    '.chat-client-root .group\\/event-header {',
    '  font-size: var(--ds-text-size) !important;',
    '  line-height: 20px !important;',
    '  color: var(--ds-text-secondary) !important;',
    '}',
    '/* 思考正文容器（.text-12 在别处也用，这里限定在 highlight-wrapper 内） */',
    '.chat-client-root .highlight-wrapper .flex.min-w-0.flex-col.text-12 {',
    '  font-size: var(--ds-text-size) !important;',
    '  line-height: var(--ds-line-height) !important;',
    '}',
    '/* 思考正文用 tertiary 文字色（前景色 60%） */',
    '.chat-client-root .highlight-wrapper,',
    '.chat-client-root .flex.flex-col.event-group {',
    '  color: var(--ds-text-tertiary) !important;',
    '}',

    '/* 输入框：把附件行挪到文字上方（Cursor 的图片在左上角） */',
    '.chat-client-root div.cursor-text.border > div:has(> .group\\/attachment) {',
    '  order: -1 !important;',
    '  padding-block: 0 6px !important;',
    '}',
    '/* 附件缩略图略微收小 */',
    '.chat-client-root .group\\/attachment > div:first-child {',
    '  height: 28px !important;',
    '}',

    '/* --- 工具栏按钮改造（标记由 custom.js 的 decorate() 打上） --- */',

    '/* 1) 隐藏 "+"（Add context） */',
    '.chat-client-root [data-devin-add-context] {',
    '  display: none !important;',
    '}',

    '/* 2) 权限/模式按钮：加灰色药丸底。',
    '      文字缩写（"Bypass Permissions" -> "bypass"）由 custom.js 处理，',
    '      不能用 CSS ::after 硬编码 —— 那样切到 ask / plan 模式也会一直显示 bypass。 */',
    '.chat-client-root [data-devin-perm] {',
    '  background-color: var(--ds-pill-bg) !important;',
    '  border-radius: 9999px !important;',
    '  padding-inline: 8px !important;',
    '  color: var(--ds-text-secondary) !important;',
    '}',

    '/* 3) 右侧 agent 切换（Devin Local）：只留图标，去掉文字 */',
    '.chat-client-root [data-devin-agent-switch] > span {',
    '  display: none !important;',
    '}',
    '/* 收成和其他图标按钮一样的 20x20 方块，右侧图标间距才会相等',
    '   （原来左右 4px 内边距 + 外层 min-w-6，比别的按钮宽 7px） */',
    '.chat-client-root [data-devin-agent-switch] {',
    '  padding: 0 !important;',
    '  width: 20px !important;',
    '  min-width: 20px !important;',
    '  justify-content: center !important;',
    '}',
    '.chat-client-root div:has(> [data-devin-agent-switch]) {',
    '  min-width: 0 !important;',
    '}',
    '/* 右侧图标统一 16px 居中：agent 图标自带 mr-px（隐藏的 span 仍算兄弟），',
    '   发送图标被 [&>svg]:[scale:0.9375] 缩成 15px */',
    '.chat-client-root button[data-devin-agent-switch] > svg {',
    '  margin: 0 !important;',
    '}',
    '.chat-client-root .group\\/beard-band div.grid.flex-1 > button > svg {',
    '  scale: 1 !important;',
    '}',

    '/* 4) 去掉语音输入按钮（录音中 aria-label 会变成 Stop recording，一并匹配） */',
    '.chat-client-root .group\\/beard-band button[aria-label*="recording" i] {',
    '  display: none !important;',
    '}',

    '/* ===== 12. 卡片 / diff / 文件变更条对齐 Cursor =====',

    '   Cursor 的文件变更块（.app-layout-multi-diff-*）：',
    '     item           : border-radius:8px; margin:4px 4px 12px',
    '     header-content : border:1px solid var(--vscode-panel-border);',
    '                      border-radius:8px 8px 0 0; padding:4px 6px; gap:8px',
    '     filename       : font-size:12px; line-height:16px; color:tertiary',
    '     basename       : color:primary       counts: font-size:12px; gap:4px',
    '     collapsed      : border-radius:6px */',

    '/* 卡片本体：圆角 8px、1px 描边、外边距对齐 Cursor */',
    '.chat-client-root .group\\/card {',
    '  border: 1px solid var(--ds-stroke-2) !important;',
    '  border-radius: var(--ds-radius-lg) !important;',
    '  margin: 4px 4px 12px !important;',
    '}',
    '/* 内层不要再套更大的圆角（Devin 原为 9px / 10px） */',
    '.chat-client-root .group\\/card .rounded-\\[9px\\],',
    '.chat-client-root .group\\/card .rounded-\\[10px\\] {',
    '  border-radius: var(--ds-radius-lg) !important;',
    '}',
    '/* 头部：Cursor 的 padding 是 4px 6px，比 Devin 的 10px 12px 紧得多 */',
    '.chat-client-root .group\\/card .group\\/header {',
    '  padding: 4px 6px !important;',
    '  gap: 8px !important;',
    '  min-height: 28px !important;',
    '  height: auto !important;',
    '  box-sizing: border-box;',
    '}',

    '/* 文件变更卡片：文件名与计数对齐 Cursor 的 12px / 16px',
    '   用 :has() 限定在 diff 卡片上，避免把工具名也压小 */',
    '.chat-client-root .group\\/card:has(.diff-line-insert) .group\\/header .truncate,',
    '.chat-client-root .group\\/card:has(.diff-line-delete) .group\\/header .truncate {',
    '  font-size: 12px !important;',
    '  line-height: 16px !important;',
    '}',

    '/* diff 行：Devin 原本只有 11px */',
    '.chat-client-root .diff-line-insert,',
    '.chat-client-root .diff-line-delete {',
    '  font-size: 12px !important;',
    '  line-height: 20px !important;',
    '}',

    '/* composer 上方的文件变更条：字号对齐 Cursor 的 12px */',
    '.chat-client-root .group\\/beard-band [class*="bottom-full"] {',
    '  font-size: 12px !important;',
    '  line-height: 16px !important;',
    '}',

    '/* accept / reject / quick review：对齐 Cursor 的灰色药丸（Review 是浅灰底，不是蓝色实心） */',
    '.chat-client-root [data-devin-review-btn] {',
    '  background-color: transparent !important;',
    '  border-radius: 6px !important;',
    '  padding: 2px 8px !important;',
    '  font-size: 12px !important;',
    '  color: var(--ds-text-secondary) !important;',
    '}',
    '.chat-client-root [data-devin-review-btn="primary"] {',
    '  background-color: var(--ds-pill-bg) !important;',
    '  color: var(--vscode-editor-foreground) !important;',
    '}',

    '/* ===== 13. 思考区去竖线 / 变更条独立 / 图标居中 / 下拉箭头 =====',

    '/* 1) 去掉思考区左侧的竖线导轨（.group/collapse-bar 里那个 1px 的 div）',
    '      以及它带来的 16px 导轨 + 8px 间距缩进。 */',
    '.chat-client-root .group\\/collapse-bar {',
    '  display: none !important;',
    '}',
    '.chat-client-root .highlight-wrapper [class*="chat-collapse-rail-width"] {',
    '  --chat-collapse-rail-width: 0px !important;',
    '  --chat-collapse-content-gap: 0px !important;',
    '}',
    '/* 思考正文颜色加深：Devin 默认约 54% 不透明，Cursor 更实 */',
    '.chat-client-root .highlight-wrapper {',
    '  color: var(--ds-text-secondary) !important;',
    '}',

    '/* 2) 文件变更条：做成独立的小药丸，比输入框窄一圈、更矮，',
    '      而不是被 composer 的背景层一起包住。 */',
    '.chat-client-root div[class*="bottom-full"] [class*="py-1.5"] {',
    '  padding-block: 2px !important;',
    '}',
    '.chat-client-root div[class*="bottom-full"] .flex.min-w-0.flex-col.gap-1 {',
    '  background: var(--ds-pill-bg) !important;',
    '  border-radius: var(--ds-radius-lg) !important;',
    '  margin-inline: 6px !important;',
    '  padding: 0 8px !important;',
    '  min-height: 20px !important;',
    '}',

    '/* 3) 侧边栏顶部图标行横向居中 */',
    '[id="workbench.parts.sidebar"] .composite-bar-container {',
    '  justify-content: center !important;',
    '}',

    '/* 4) bypass / 模型切换右侧的下拉箭头（svg 由 custom.js 的 addChevron 插入）',
    '      order:99 让它排在 ::after 生成的 "bypass" 文字之后 */',
    '.chat-client-root .devin-chevron {',
    '  flex: 0 0 auto;',
    '  order: 99;',
    '  margin-left: 2px;',
    '  opacity: 0.55;',
    '  pointer-events: none;',
    '}',
    '/* viewBox 已横向裁到 10 宽，箭头两侧不再留 ~4px 空白。',
    '   按钮自带 [&_svg]:!size-4 和 [&_svg:last-child]:ml-[2px]，选择器要更具体才压得住 */',
    '.chat-client-root button > svg.devin-chevron.devin-chevron {',
    '  width: 10px !important;',
    '  height: 16px !important;',
    '  margin-left: 0 !important;',
    '}',

    '/* ===== 14. 变更条与输入框（对着 Cursor 的实测值抄）=====',
    '   通过 CDP 连 Cursor 3.20.21 读到的计算样式：',
    '     输入框 .ai-input-full-input-box :',
    '         radius 12px（四角）  border 1px solid 前景色 20%',
    '         background 前景色 3.5%   padding 8px 10px 6px',
    '     变更条 #composer-toolbar-section :',
    '         radius 8px 8px 0 0   border 1px solid 前景色 8%   border-bottom 0',
    '         background rgb(24,24,24)（不透明面板色）  左右各内缩 9px   高 27px',
    '   几何：变更条 x=817 w=443，输入框 x=808 w=461 → 左右各缩 9px；',
    '         条底与输入框顶重叠 1px，所以看起来是连着的。 */',

    '/* 去掉 composer 的外层背景层（.bg-bg-elevated-wax + backdrop-blur） */',
    '.chat-client-root .group\\/beard-band > [class*="bg-bg-elevated-wax"] {',
    '  display: none !important;',
    '}',

    '/* 输入框：四角全圆角 12px + 20% 描边 + 3.5% 填充 */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border {',
    '  border: 1px solid var(--ds-stroke-strong) !important;',
    '  border-radius: var(--ds-radius-xl) !important;',
    '  background-color: var(--ds-fill-faint) !important;',
    '}',

    '/* 变更条：左右内缩 9px、只圆上角 8px、8% 描边、不透明面板底',
    '   外层 py-1.5 的上下内边距要去掉，否则条底与输入框顶差出缝隙。 */',
    '.chat-client-root div[class*="bottom-full"] [class*="py-1.5"] {',
    '  padding-block: 0 !important;',
    '}',
    '.chat-client-root div[class*="bottom-full"] .flex.min-w-0.flex-col.gap-1 {',
    '  background-color: var(--vscode-sideBar-background) !important;',
    '  border: 1px solid var(--ds-stroke-3) !important;',
    '  border-bottom: none !important;',
    '  border-radius: var(--ds-radius-lg) var(--ds-radius-lg) 0 0 !important;',
    '  margin-inline: 9px !important;',
    '  padding: 0 8px !important;',
    '  min-height: 27px !important;',
    '}',

    '/* ===== 14.5 提问卡片（选项工具弹的那张，ACP elicitation）=====',
    '   它和文件变更条共用 composer 上方那个 absolute bottom-full 槽位',
    '   （app 里叫 eyebrow row：div[data-eyebrow-row] > div.px-1.5 > motion.div > [data-band-item]）。',
    '   槽位在 composer 的毛玻璃层之外，卡片默认只有 4% 填充 + 8% 描边，',
    '   压在消息列表上像一层发灰的虚影；而且只有上圆角，下缘是断的。',
    '   这里按工具卡片的规格重做：不透明面板底 + 12% 描边 + 12px 四角圆角。',
    '   底色必须是**不透明**的 --ds-surface-bg（4% 填充 + 面板色），',
    '   半透明的 --ds-fill-faint 等于 96% 透明，消息文字会从卡片下面透上来（踩过）。',
    '   结构（index.js 的 rP2 / rP3）：',
    '     [data-band-item] > div（rP3 的 onClick 包装，class 为空）> div.flex.flex-col（rP2 卡片根）',
    '   变更条则多一层带 min-w-0 的 flex-col + .gap-1，据此区分，实测只命中卡片。',
    '   注意别用 div:not([class]) 判空类名 —— React 可能渲染出 class=""。 */',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) {',
    '  background-color: var(--ds-surface-bg) !important;',
    '  border: 1px solid var(--ds-stroke-2) !important;',
    '  border-bottom: 1px solid var(--ds-stroke-2) !important;',
    '  border-radius: var(--ds-radius-xl) !important;',
    '  padding-block: 8px !important;',
    '}',
    '/* 卡片内文字统一到主题的 14px/22px（App 默认 13px/16px） */',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) .text-\\[13px\\] {',
    '  font-size: var(--ds-text-size) !important;',
    '  line-height: var(--ds-line-height) !important;',
    '}',
    '/* 选项描述（第二行小字）保留次级层级：13px/18px */',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) .text-xs {',
    '  font-size: 13px !important;',
    '  line-height: 18px !important;',
    '}',
    '/* 选项行：正文行高提到 22px 后 24px 太挤，放到 28px（对齐工具卡片头部高度） */',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) [role="button"] {',
    '  min-height: 28px !important;',
    '}',
    '/* 卡片里的主按钮（Next / Submit）不用蓝色实心，改成和 Accept all 一致的中性药丸 */',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) form button,',
    '.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) .mt-2.flex.items-center.justify-end > button {',
    '  background-color: var(--ds-pill-bg) !important;',
    '  color: var(--vscode-editor-foreground) !important;',
    '  border-radius: 6px !important;',
    '  padding: 2px 8px !important;',
    '  font-size: 12px !important;',
    '  line-height: 16px !important;',
    '}',
    '/* ===== 15. 聊天内容深度对齐 Cursor（CDP 实测值）=====',
    '   实测（Cursor 3.20.21）：',
    '     用户气泡 .composer-human-message  : radius 12px, border 1px @12%, bg rgb(77,77,77) @13.5%',
    '     思考区   .ui-markdown             : opacity 0.5  ← 暗化来自 opacity，不是 color',
    '     思考标题 .ui-collapsible-action   : 14px/22px, color 60%',
    '     正文段落 .ui-markdown__paragraph  : 14px/22px, margin-bottom 16px',
    '     行内代码 .ui-markdown__inline-code: 12.6px, bg 8%, radius 5px, padding 1.5px 2px',
    '     diff 行  : 删 rgba(184,0,73,.2) / 增 rgba(63,162,102,.2)',
    '     卡片/代码块 : radius 12px, bg 面板色, border 12% */',

    '/* 1) 用户消息气泡。Devin 原本是 16px 4px 16px 16px + 3% 底，',
    '      Cursor 是统一 12px 圆角 + 12% 描边 + 13.5% 中灰底。',
    '      用户消息的包裹带 .ml-auto，助手消息带 .group/acp-agent-message，据此区分。 */',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div > div:first-child {',
    '  border-radius: var(--ds-radius-xl) !important;',
    '  border: 1px solid var(--ds-stroke-2) !important;',
    '  background-color: var(--ds-bubble-bg) !important;',
    '}',

    '/* 1b) 用户气泡（普通 / QA / 其他）占满宽度、文字左对齐。',
    '      包裹带 .ml-auto，在 flex-col 里不会被拉伸，会收缩成内容宽度，所以显式设 100%。 */',
    '.chat-client-root .group\\/message-wrapper.ml-auto {',
    '  width: 100% !important;',
    '  margin-left: 0 !important;',
    '}',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div > div.w-fit,',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div.w-fit {',
    '  width: 100% !important;',
    '  text-align: left !important;',
    '}',
    '/* QA 双层气泡：外层（.w-fit 的那一层）用和普通气泡一样的 12px / 13.5% / 描边；',
    '      内层 div.flex.w-full.flex-col.gap-1 去掉底色、描边、圆角和填充。 */',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div:has(> div.flex.w-full.flex-col.gap-1) {',
    '  border-radius: var(--ds-radius-xl) !important;',
    '  border: 1px solid var(--ds-stroke-2) !important;',
    '  background-color: var(--ds-bubble-bg) !important;',
    '  padding: 8px 14px !important;',
    '}',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div > div.flex.w-full.flex-col.gap-1 {',
    '  background-color: transparent !important;',
    '  border: 0 !important;',
    '  border-radius: 0 !important;',
    '  padding: 0 !important;',
    '}',

    '/* 2) 思考区：正文用 opacity 0.5 暗化（Cursor 的做法），标题单独保持 60%。',
    '      正文是 .highlight-wrapper 的第 2 个子元素（第 1 个是标题）；',
    '      折叠状态下只有标题一个子元素，规则自然不命中。 */',
    '.chat-client-root .highlight-wrapper > div:nth-child(2) {',
    '  opacity: 0.5 !important;',
    '}',
    '.chat-client-root .group\\/event-header {',
    '  color: var(--ds-text-tertiary) !important;',
    '  line-height: 22px !important;',
    '}',

    '/* 3) 行内代码。之前按 --markdown-inline-code-bg:transparent 那个变体设成了透明，',
    '      但默认变体是 bg 8% + 5px 圆角 + 1.5px 2px 内边距。 */',
    '.chat-client-root .prose-main.prose-ds :not(pre) > code {',
    '  font-size: 0.9em !important;',
    '  background-color: var(--ds-stroke-3) !important;',
    '  border-radius: 5px !important;',
    '  padding: 1.5px 2px !important;',
    '}',

    '/* 4) diff 行：Devin 的色相已与 Cursor 一致，只把 alpha 从 0.13 提到 0.2 */',
    '.chat-client-root .diff-line-insert {',
    '  background-color: rgba(63, 162, 102, 0.2) !important;',
    '}',
    '.chat-client-root .diff-line-delete {',
    '  background-color: rgba(184, 0, 73, 0.2) !important;',
    '}',

    '/* 5) 卡片与代码块：圆角 12px（--card-border-radius）、底色改为面板色、描边 12% */',
    '.chat-client-root .group\\/card,',
    '.chat-client-root .group\\/codeblock {',
    '  border-radius: var(--ds-radius-xl) !important;',
    '  background-color: var(--vscode-sideBar-background) !important;',
    '  border-color: var(--ds-stroke-2) !important;',
    '}',
    '.chat-client-root .group\\/card .rounded-\\[9px\\],',
    '.chat-client-root .group\\/card .rounded-\\[10px\\],',
    '.chat-client-root .group\\/codeblock.rounded-\\[10px\\] {',
    '  border-radius: var(--ds-radius-xl) !important;',
    '}',

    '/* 6) 终端/命令输出：字号对齐 Cursor 的 12px/20px（Devin 原本 11.7px / 10.5px） */',
    '.chat-client-root pre.terminal-text,',
    '.chat-client-root pre.ansi-text {',
    '  font-size: 12px !important;',
    '  line-height: 20px !important;',
    '}',

    '/* ===== 16. 去掉空消息状态下的背景纹理 =====',
    '   空状态（"Describe your task to Devin"）背后那层波浪线，',
    '   是一个 1200x1530 的 svg，opacity 0.5，包在',
    '   div.pointer-events-none.absolute.bottom-0.left-1/2.flex 里。 */',
    '.chat-client-root div[class*="pointer-events-none"][class*="left-1/2"] {',
    '  display: none !important;',
    '}',

    '/* ===== 17. 输入框底部控制行高度对齐 Cursor =====',
    '   Cursor 实测：Agent 药丸 80x20（radius full, bg 前景色 14%, padding 2px 4px 2px 8px, fs 12px）',
    '                模型选择 77x20（radius 4px, padding 0 4px, fs 13px）',
    '                上下文用量 29x20 / 纸夹 20x20 / 麦克风 20x20 / 发送 24x20',
    '   Devin 这边全部是 24px（文字类用 h-6，图标类用 size-6），统一压到 20px。 */',

    '/* 文字类按钮（bypass / 模型 / agent 切换）：高度 20px */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border .flex.flex-wrap.items-center button[class*="h-6"] {',
    '  height: 20px !important;',
    '  min-height: 20px !important;',
    '}',

    '/* 图标类按钮（上下文用量 / 麦克风 / 发送）：宽高都收到 20px。',
    '   排除模式药丸 —— 窄面板下 app 把药丸换成同为 size-6 的「只有图标」按钮，',
    '   钉死 20px 会把补回来的文字裁掉（见下面 :has(> [data-devin-label]) 那条）。 */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border .flex.flex-wrap.items-center button[class*="size-6"]:not([data-devin-perm]) {',
    '  width: 20px !important;',
    '  height: 20px !important;',
    '}',

    '/* bypass 药丸：底色对齐 Cursor 的 14%，左右内边距对齐 8px */',
    '.chat-client-root [data-devin-perm] {',
    '  background-color: color-mix(in srgb, var(--vscode-editor-foreground) 14%, transparent) !important;',
    '  padding: 0 4px 0 8px !important;',
    '}',

    '/* 左侧药丸按钮（模式 / 强度）文字必须完整显示：不收缩、不截断、去掉 max-w 上限。',
    '   只作用于药丸，模型名照旧可截断；控制行不换行 */',
    '.chat-client-root div:has(> [data-devin-perm]),',
    '.chat-client-root [data-devin-perm] {',
    '  flex-shrink: 0 !important;',
    '  max-width: none !important;',
    '}',
    '.chat-client-root [data-devin-perm] > span {',
    '  flex-shrink: 0 !important;',
    '  overflow: visible !important;',
    '  text-overflow: clip !important;',
    '}',
    '/* 窄面板下 app 把药丸整个换成「只有图标」的 size-6 按钮（文字直接不在 DOM 里，',
    '   JS 会把文字补回来）。补回来之后要还原成药丸布局：width auto + 内边距 + gap，',
    '   否则被 size-6 那条规则钉死在 20px 宽，文字被裁掉。 */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border [data-devin-perm]:has(> [data-devin-label]) {',
    '  width: auto !important;',
    '  height: 20px !important;',
    '  min-height: 20px !important;',
    '  padding: 0 4px 0 8px !important;',
    '  gap: 3px !important;',
    '}',

    '/* 模型名恢复可收缩 + 省略号截断，控制行禁止换行 */',
    '.chat-client-root div.flex-1:has(> div > [data-devin-perm]) {',
    '  flex-wrap: nowrap !important;',
    '}',

    '/* ===== 18. 输入框内部规格 + 列表样式对齐 Cursor =====',
    '   Cursor 实测：',
    '     输入框 .ai-input-full-input-box   : padding 8px 10px 6px, gap 6px, radius 12px',
    '     占位符 .aislash-editor-placeholder: 14px/22px, color 前景色 60%',
    '     输入文本 .aislash-editor-input    : 14px/22px, color 前景色 100%',
    '     控制行 .composer-bar-input-buttons: 高 28px, 按钮 20x20, 按钮内图标 16px, 间距 4px',
    '     列表 ul/ol .ui-markdown__list     : margin 8px 0 18px, padding-inline-start 28px, disc/decimal',
    '     li                                : margin 0（项间距走容器 gap，等价于 Devin 的 li+li 8px） */',

    '/* 输入框内边距：Devin 是均匀 8px，Cursor 是 8px 10px 6px */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border {',
    '  padding: 8px 10px 6px !important;',
    '  /* 占位符颜色对齐 Cursor 的 前景色 60% */',
    '  --vscode-input-placeholderForeground: color-mix(in srgb, var(--vscode-editor-foreground) 60%, transparent);',
    '}',

    '/* 输入文本：13px/18px -> 14px/22px */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border > div.text-text-primary,',
    '.chat-client-root .group\\/beard-band div.cursor-text.border .text-13 {',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '}',

    '/* 占位符单行显示：Slate 给的是 pre-wrap + 绝对定位，窄面板下会折到第二行被裁掉 */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border [data-slate-placeholder] {',
    '  white-space: nowrap !important;',
    '  overflow: hidden !important;',
    '  text-overflow: ellipsis !important;',
    '}',

    '/* 控制行左右两组之间的间距：8px -> 4px */',
    '.chat-client-root .group\\/beard-band div.cursor-text.border .flex.flex-wrap.items-center > div {',
    '  gap: 4px !important;',
    '}',

    '/* 模式 / 模型 / agent 按钮的文字行高：对齐 Cursor 药丸的 16px 内容高。',
    '   按钮高 20px、行高 18.2px 时文字会显得偏上，压到 16px 才垂直居中。 */',
    '.chat-client-root [data-devin-perm],',
    '.chat-client-root [data-devin-model],',
    '.chat-client-root [data-devin-agent-switch] {',
    '  line-height: 16px !important;',
    '}',
    '.chat-client-root [data-devin-perm] > span,',
    '.chat-client-root [data-devin-model] > span,',
    '.chat-client-root [data-devin-agent-switch] > span {',
    '  line-height: 16px !important;',
    '}',

    '/* 列表缩进：Cursor 用固定 28px（Devin 是 1.4em）。',
    '   字号和 margin 也要一起顶掉，应用本身会把列表压到 13px/18px、margin-bottom 归零。 */',
    '.chat-client-root .prose-main.prose-ds ul,',
    '.chat-client-root .prose-main.prose-ds ol {',
    '  padding-inline-start: 28px !important;',
    '  margin-block: 8px 18px !important;',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '}',

    '/* ===== 19. 表格：去掉灰底 + 全描边 + 圆角 =====',
    '   灰色底的真正来源不是表格，而是它外层那个容器：',
    '     div.bg-bg-elevated.border-border-secondary  (bg = rgb(36,36,36))',
    '   圆角必须用 border-collapse: separate —— collapse 下 border-radius 不生效。',
    '   所以外框+圆角画在 table 上，内部网格靠单元格的右/下边框，',
    '   最后一行/列去掉内部线，避免与表格外框叠成 2px。 */',

    '/* 1) 去掉表格外层容器的灰底和自带描边 */',
    '.chat-client-root .prose-main.prose-ds div[class*="bg-bg-elevated"]:has(table) {',
    '  background-color: transparent !important;',
    '  border-color: transparent !important;',
    '}',

    '/* 2) 表格本体：外框 + 圆角 */',
    '.chat-client-root .prose-main.prose-ds table {',
    '  border: 1px solid var(--ds-stroke-2) !important;',
    '  border-radius: var(--ds-radius-lg) !important;',
    '  border-collapse: separate !important;',
    '  border-spacing: 0 !important;',
    '  width: max-content !important;',
    '  min-width: 100% !important;',
    '  background-color: transparent !important;',
    '}',

    '/* 3) 单元格：只画右边和下边，拼出内部网格 */',
    '.chat-client-root .prose-main.prose-ds th,',
    '.chat-client-root .prose-main.prose-ds td {',
    '  border: none !important;',
    '  border-right: 1px solid var(--ds-stroke-2) !important;',
    '  border-bottom: 1px solid var(--ds-stroke-2) !important;',
    '  padding: 6px 10px !important;',
    '  text-align: left !important;',
    '  vertical-align: top !important;',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '  background-color: transparent !important;',
    '}',
    '/* 最后一列去掉右边线，避免与外框重叠成 2px */',
    '.chat-client-root .prose-main.prose-ds tr > *:last-child {',
    '  border-right: none !important;',
    '}',
    '/* 最后一行去掉下边线。注意必须限定 tbody ——',
    '   裸写 tr:last-child 会同时命中 thead 里的那一行，把表头和数据之间的分隔线也干掉。 */',
    '.chat-client-root .prose-main.prose-ds tbody > tr:last-child > * {',
    '  border-bottom: none !important;',
    '}',

    '/* 4) 表头：Cursor 用 590 字重 */',
    '.chat-client-root .prose-main.prose-ds th {',
    '  font-weight: 590 !important;',
    '}',

    '/* ===== 20. 去掉侧边栏的 "Explorer" 标题栏 =====',
    '   结构： #workbench.parts.sidebar > div.composite.title.has-actions',
    '          ├─ div.title-label    "Explorer"',
    '          └─ div.title-actions  右侧的 ... 按钮',
    '   整行去掉后，下方的文件树会自动上移到图标行正下方。 */',
    '[id="workbench.parts.sidebar"] > .composite.title {',
    '  display: none !important;',
    '}',

    '/* ===== 21. 修掉隐藏标题栏后侧边栏底部空出的 35px =====',
    '   原因：VS Code 的布局是 JS 算好后写内联样式的 —— .content 上写着',
    '     style="width: 341px; height: 852px;"',
    '   852 = 922（槽位）− 35（图标行）− 35（标题栏）。',
    '   我把标题栏 display:none 之后 JS 不会重算，于是这 35px 空了出来：',
    '   侧边栏总高只有 887，比它的槽位 922 矮一截，底部就露出空隙。',
    '   解法：让 sidebar 撑满槽位，并改成 flex 列，让 .content 自动吃掉剩余高度',
    '   （比写死 calc(100% - 35px) 更稳，不依赖那个魔数）。 */',
    '[id="workbench.parts.sidebar"] {',
    '  height: 100% !important;',
    '  display: flex !important;',
    '  flex-direction: column !important;',
    '}',
    '[id="workbench.parts.sidebar"] > .content {',
    '  height: auto !important;',
    '  flex: 1 1 auto !important;',
    '  min-height: 0 !important;',
    '}',
    '/* 面板高度同样是 JS 写死的内联样式（绝对定位 + top/height），',
    '   .content 撑高后它们不会重算，35px 就空在面板区下方。',
    '   这里让树面板吃掉剩余高度，并把下面两个折叠面板的 top 一起下移。',
    '   侧边栏固定 3 个面板：树 + Outline(22) + Timeline(22)，后两个是折叠态。 */',
    '[id="workbench.parts.sidebar"] .monaco-pane-view .split-view-container > .split-view-view:nth-child(1) {',
    '  height: calc(100% - 44px) !important;',
    '}',
    '[id="workbench.parts.sidebar"] .monaco-pane-view .split-view-container > .split-view-view:nth-child(2) {',
    '  top: calc(100% - 44px) !important;',
    '}',
    '[id="workbench.parts.sidebar"] .monaco-pane-view .split-view-container > .split-view-view:nth-child(3) {',
    '  top: calc(100% - 22px) !important;',
    '}',
    '/* ===== 22. 聊天区高保真对齐 Cursor（实测计算样式）=====',
    '   Devin 的 .prose-ds-dense-v3 把段落压成 13px/18px、字距 -0.08px；工具卡头 29px、',
    '   用户气泡内边距 14px。Cursor 实测：正文 14/22 字距 normal、卡片与面板同色、气泡 rgb(46,46,46)。',
    '   这里全部顶掉。聊天底色不改，跟随主题。',
    '   颜色用 #ccc 的 alpha 版本，避免 editor-foreground 自带 0.9 透明度叠加。 */',
    '.chat-client-root {',
    '  --ds-c-stroke: rgba(204, 204, 204, 0.12);',
    '  --ds-c-tertiary: rgba(204, 204, 204, 0.6);',
    '  --ds-c-quaternary: rgba(204, 204, 204, 0.36);',
    '  --ds-c-bubble: rgb(46, 46, 46);',
    '}',

    '/* 正文：字体族、字距、段落字号行高（p 被 dense 变体压到 13px/18px） */',
    '.chat-client-root .prose-main.prose-ds {',
    '  font-family: -apple-system, "system-ui", "PingFang SC", "Hiragino Sans GB", sans-serif !important;',
    '  letter-spacing: normal !important;',
    '}',
    '.chat-client-root .prose-main.prose-ds p,',
    '.chat-client-root .prose-main.prose-ds li {',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '}',
    '/* 段落后紧跟列表：段距 8px（Cursor 实测 p.mb = 8px） */',
    '.chat-client-root .prose-main.prose-ds p:has(+ ol),',
    '.chat-client-root .prose-main.prose-ds p:has(+ ul) {',
    '  margin-bottom: 8px !important;',
    '}',

    '/* 标题：Cursor h2 = 18.45/26.2、h3 = 17/24.13，字重 590，段前 20.5px、段后 4px */',
    '.chat-client-root .prose-main.prose-ds > :first-child {',
    '  margin-top: 0 !important;',
    '}',
    '.chat-client-root .prose-main.prose-ds h2 {',
    '  font-size: 18.452px !important;',
    '  line-height: 26.2px !important;',
    '  font-weight: 590 !important;',
    '  margin: 20.5px 0 4px !important;',
    '  letter-spacing: normal !important;',
    '}',
    '.chat-client-root .prose-main.prose-ds h3 {',
    '  font-size: 17px !important;',
    '  line-height: 24.13px !important;',
    '  font-weight: 590 !important;',
    '  margin: 20.5px 0 4px !important;',
    '  letter-spacing: normal !important;',
    '}',
    '.chat-client-root .prose-main.prose-ds h4,',
    '.chat-client-root .prose-main.prose-ds h5 {',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '  font-weight: 590 !important;',
    '  margin: 20.5px 0 4px !important;',
    '  letter-spacing: normal !important;',
    '}',

    '/* 行内代码：Cursor 内边距 1.5px 2px，字号 .9em（随正文变为 12.6px） */',
    '.chat-client-root .prose-main.prose-ds :not(pre) > code {',
    '  padding: 1.5px 2px !important;',
    '}',
    '/* 代码块：Cursor 12/18 等宽，圆角 12px */',
    '.chat-client-root .prose-main.prose-ds pre {',
    '  font-size: 12px !important;',
    '  line-height: 18px !important;',
    '  border-radius: 12px !important;',
    '}',

    '/* 工具卡片：Cursor 卡片与面板同色、12px 圆角、头部 39px（含 1px 分隔线）、内边距 8px、间距 6px */',
    '.chat-client-root .group\\/card {',
    '  background-color: transparent !important;',
    '  border: 1px solid var(--ds-c-stroke) !important;',
    '  border-radius: 12px !important;',
    '}',
    '.chat-client-root .group\\/card .group\\/header {',
    '  height: 39px !important;',
    '  padding: 8px !important;',
    '  gap: 6px !important;',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '  border-bottom: 1px solid var(--ds-c-stroke) !important;',
    '}',
    '/* 工具输出：Cursor 13/18，36% 灰，内边距 0 10px 6px */',
    '.chat-client-root pre.terminal-text {',
    '  font-size: 13px !important;',
    '  line-height: 18px !important;',
    '  padding: 0 10px 6px !important;',
    '  color: var(--ds-c-quaternary) !important;',
    '}',

    '/* 用户气泡：Cursor 实心 rgb(46,46,46)、1px 12% 描边、12px 圆角、内边距 8px 10px */',
    '.chat-client-root .group\\/message-wrapper.ml-auto > div > div:first-child {',
    '  background-color: var(--ds-c-bubble) !important;',
    '  border-color: var(--ds-c-stroke) !important;',
    '  padding: 8px 10px !important;',
    '}',

    '/* ===== 23. 工具卡片对齐 Cursor（第 23 段）=====',
    '   Cursor 的 Shell 卡：头部 = 图标 36% + 描述 60% + 命令名 36%，正文直接是 13/18 的灰色输出，',
    '   没有光束边框、没有左侧状态点、没有语法高亮。',
    '   Devin 卡片多了 .border-beam 光束装饰（div[class*="-inset-px"]）、w-5 状态点列、',
    '   命令与输出同一块 12px/normal 的 terminal-text 带彩色。这里压平这些差异，命令文本本身保留。 */',
    '.chat-client-root .group\\/card > div[class*="-inset-px"] {',
    '  display: none !important;',
    '}',
    '.chat-client-root .group\\/card .group\\/header svg {',
    '  color: var(--ds-c-quaternary) !important;',
    '}',
    '.chat-client-root .group\\/card .group\\/header .codeium-text-medium {',
    '  color: var(--ds-c-tertiary) !important;',
    '}',
    '.chat-client-root .group\\/card .flex.mb-2\\.5.mt-3 {',
    '  margin: 0 !important;',
    '}',
    '.chat-client-root .group\\/card .flex.mb-2\\.5.mt-3 > .w-5 {',
    '  display: none !important;',
    '}',
    '.chat-client-root .group\\/card .terminal-text {',
    '  padding: 0 10px 6px !important;',
    '  font-size: 13px !important;',
    '  line-height: 18px !important;',
    '}',
    '.chat-client-root .group\\/card .terminal-text,',
    '.chat-client-root .group\\/card .terminal-text * {',
    '  color: var(--ds-c-quaternary) !important;',
    '}',

    '/* ===== 24. 活动行（Thoughts / Read / Searched 等）对齐 Cursor =====',
    '   Cursor：行内无图标；动作词 60%，目标 36%，无胶囊底、非等宽；展开箭头在文字右侧。',
    '   Devin：左侧 16px 图标按钮 + 目标是 code 胶囊（5% 底、13px 等宽）。',
    '   这里隐藏图标、把按钮挪到文字右侧、目标去胶囊。 */',
    '.chat-client-root .group\\/event-header > button > span[class*="group-hover/event-header:hidden"] {',
    '  display: none !important;',
    '}',
    '.chat-client-root .group\\/event-header {',
    '  gap: 4px !important;',
    '}',
    '.chat-client-root .group\\/event-header > button {',
    '  order: 2 !important;',
    '}',
    '.chat-client-root .group\\/event-header > div {',
    '  order: 1 !important;',
    '}',
    '.chat-client-root .group\\/event-header code,',
    '.chat-client-root .group\\/event-header code * {',
    '  background: transparent !important;',
    '  color: var(--ds-c-quaternary) !important;',
    '  font-family: -apple-system, "system-ui", "PingFang SC", "Hiragino Sans GB", sans-serif !important;',
    '  font-size: 14px !important;',
    '  line-height: 22px !important;',
    '  padding: 0 !important;',
    '  border-radius: 0 !important;',
    '}',

    '/* ===== 25. 命令输出的折叠高度对齐 Cursor =====',
    '   Cursor：输出预览按钮 max-height 96px、overflow hidden，无渐隐遮罩，点击展开。',
    '   Devin：内联 style="max-height: 64px; mask-image: 渐隐 35px"。',
    '   只匹配折叠态的内联值（64px），展开后 Devin 写的样式不会被这里覆盖。 */',
    '.chat-client-root .group\\/card div[style*="max-height: 64px"] {',
    '  max-height: 96px !important;',
    '  mask-image: none !important;',
    '  -webkit-mask-image: none !important;',
    '}',
  ].join('\n');

  // --------------------------------------------------------------------------
  // 注入样式
  // --------------------------------------------------------------------------
  function injectStyle(css) {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
  }

  // --------------------------------------------------------------------------
  // 顶部图标行的「点击展开」按钮
  // --------------------------------------------------------------------------
  function mountToggle() {
    var container = document.querySelector(CONTAINER_SEL);
    if (!container) return;

    var existing = container.querySelector('#' + BTN_ID);
    var itemCount = container.querySelectorAll(':scope > .action-item').length;

    if (itemCount < 5) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title = '展开其余图标';
    btn.setAttribute('aria-label', '展开其余图标');

    // 注意：workbench 的 CSP 含 require-trusted-types-for 'script'，
    // 给 innerHTML 赋值会抛 TrustedHTML 错误，必须用 DOM API 构建。
    var chevron = document.createElement('span');
    chevron.className = 'codicon codicon-chevron-down';
    btn.appendChild(chevron);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var expanded = container.classList.toggle('devin-icons-expanded');
      btn.classList.toggle('devin-expanded', expanded);
      btn.title = expanded ? '收起其余图标' : '展开其余图标';
      btn.setAttribute('aria-label', btn.title);
    });

    container.appendChild(btn);
  }

  // --------------------------------------------------------------------------
  // 给工具栏按钮打标记（CSS 依据标记做改造）
  // React 重渲染会丢掉标记，所以放在定时器里反复执行。
  // --------------------------------------------------------------------------
  // 按文字给「可点宿主」打标记：遍历叶子节点，命中文字后向上找最近的可点祖先。
  // 注意：这套 UI 里的「按钮」常常不是 <button>：
  //   - Accept all / Reject all 是 span.cursor-pointer.select-none
  //   - Quick review 是 span.inline-flex
  // 另外 closest 里不能带 [tabindex]，面板本身有 tabindex，会一路匹配上去造成误标。
  function mark(scope, re, attr, value) {
    var all = scope.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length) continue;
      if (!re.test((el.textContent || '').trim())) continue;
      var host = el.closest('button, [role="button"], span.inline-flex, .cursor-pointer') || el;
      host.setAttribute(attr, value === undefined ? '1' : value);
    }
  }

  // 给按钮右侧补一个下拉箭头（Cursor 的 Agent / 模型选择器右侧都有小 v）。
  // CSP 禁 innerHTML，必须用 createElementNS 构建 svg。
  function addChevron(host) {
    // 横向裁掉箭头两侧的留白（path 横跨 x=4.5~11.5）
    var VIEWBOX = '3 0 10 16';
    var old = host.querySelector('.devin-chevron');
    if (old) {
      if (old.getAttribute('viewBox') !== VIEWBOX) old.setAttribute('viewBox', VIEWBOX);
      return;
    }
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'devin-chevron');
    svg.setAttribute('viewBox', VIEWBOX);
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M4.5 6.5L8 10l3.5-3.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    host.appendChild(svg);
  }

  // 模式名的改写规则（"Bypass Permissions" -> "Agent"）
  function modeLabel(text) {
    return /^Bypass\b/i.test(text) ? 'Agent' : text;
  }

  // --------------------------------------------------------------------------
  // Bypass 模式的 infinity 图标
  // codicon 里没有 infinity，app 的模式图标也都是内联 svg（24 视窗、
  // fill=currentColor 的实心路径），没法直接换图标名 —— 只能自绘。
  // 用 lucide 的 infinity 路径（stroke 风格），描边 2 对齐 lucide 规格。
  // 换法：把原 svg 藏掉（display:none，节点保留，React 还能更新它），
  // 在它前面插一颗自己的 svg。图标键 INF_KEY 也登记进标签表，
  // 窄面板下 iconKey() 读到我们的 svg 也能还原出 "Agent"。
  // --------------------------------------------------------------------------
  var INF_D =
    'M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z';
  var INF_KEY = INF_D.slice(0, 80);
  var INF_CLS = 'devin-infinity-icon';
  var HIDDEN_ATTR = 'data-devin-icon-hidden';

  function makeInfinityIcon(ref) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    // 复制原图标的 class（size-4 shrink-0 等），让父级的 [&_svg] 规则照常生效
    svg.setAttribute('class', ((ref && ref.getAttribute('class')) || '') + ' ' + INF_CLS);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24px');
    svg.setAttribute('height', '24px');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', INF_D);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  // host 里「真正的模式图标」：第一颗不是我们插的、也不是下拉箭头的 svg。
  // 传 ref 时只取排在 ref 之前的（菜单项尾部还有一颗检查/选中图标要避开）。
  function modeIcon(host, ref) {
    var svgs = host.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var s = svgs[i];
      if (s.classList.contains('devin-chevron') || s.classList.contains(INF_CLS)) continue;
      if (ref && !(ref.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_PRECEDING)) continue;
      return s;
    }
    return null;
  }

  function swapToInfinityIcon(orig) {
    if (!orig) return;
    var prev = orig.previousElementSibling;
    if (!(prev && prev.classList && prev.classList.contains(INF_CLS))) {
      orig.parentNode.insertBefore(makeInfinityIcon(orig), orig);
    }
    orig.style.display = 'none';
    orig.setAttribute(HIDDEN_ATTR, '1');
  }

  function unswapIcon(host) {
    var inf = host.querySelector('svg.' + INF_CLS);
    if (inf) inf.remove();
    var hidden = host.querySelectorAll('svg[' + HIDDEN_ATTR + ']');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.display = '';
      hidden[i].removeAttribute(HIDDEN_ATTR);
    }
  }

  // 模式菜单（点药丸弹出的浮层）："Bypass Permissions" 项改名 "Agent" + 换图标。
  // 结构（实测）：div[role=menuitem] > svg 图标 + div.flex-col > div.flex >
  // span.break-words 标题 + span.text-xs 说明，尾部可能还有一颗选中标记 svg。
  // data-devin-bypass 标记用来在标题被改名/被 React 重渲染后仍能认出这一项。
  function restyleModeMenu(map) {
    var items = document.querySelectorAll('[role="menuitem"]');
    var changed = false;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var title = item.querySelector('span.break-words') || item.querySelector('span');
      if (!title) continue;
      var bypass =
        item.hasAttribute('data-devin-bypass') ||
        /^Bypass\b/i.test((title.textContent || '').trim());
      if (!bypass) continue;
      item.setAttribute('data-devin-bypass', '1');
      if ((title.textContent || '').trim() !== 'Agent') title.textContent = 'Agent';
      swapToInfinityIcon(modeIcon(item, title));
      if (map && map[INF_KEY] !== 'Agent') {
        map[INF_KEY] = 'Agent';
        changed = true;
      }
    }
    if (changed) savePermLabels(map);
  }

  // 点药丸后菜单是 portal 异步渲染的，等 800ms 轮询会看到一闪而过的
  // "Bypass Permissions"。点下去的瞬间排几个短延时，菜单一出现就改。
  function scheduleMenuRestyle() {
    var shared = (window.__devinUi = window.__devinUi || {});
    var map = shared.permLabels || (shared.permLabels = loadPermLabels());
    var delays = [30, 100, 250, 500];
    for (var i = 0; i < delays.length; i++) {
      setTimeout(function () {
        restyleModeMenu(map);
        learnFromMenu(map);
      }, delays[i]);
    }
  }

  // 窄窗口下 app 会把药丸文字整个从 DOM 里删掉（React 条件渲染，只留图标），
  // CSS 救不回来 —— 只能自己把文字补回去。模式名没法凭空得知，所以用
  // 图标的 path d 当键，记住「图标 -> 模式名」的映射（存 localStorage 跨重启）。
  var LABEL_STORE = 'devin-ui.perm-labels';

  function loadPermLabels() {
    try {
      return JSON.parse(localStorage.getItem(LABEL_STORE) || '{}');
    } catch (e) {
      return {};
    }
  }

  function savePermLabels(map) {
    try {
      localStorage.setItem(LABEL_STORE, JSON.stringify(map));
    } catch (e) {
      /* 隐私模式等场景下写不了，忽略 */
    }
  }

  function iconKey(el) {
    var svg = el.querySelector('svg:not(.devin-chevron)');
    var path = svg && svg.querySelector('path');
    var d = path && path.getAttribute('d');
    return d ? d.slice(0, 80) : '';
  }

  // 从打开的模式菜单里学「图标 -> 模式名」（菜单项结构：图标 + 标题 + 说明）
  function learnFromMenu(map) {
    var items = document.querySelectorAll('[role="menuitem"]');
    for (var i = 0; i < items.length; i++) {
      var title = items[i].querySelector('span.break-words') || items[i].querySelector('span');
      var key = iconKey(items[i]);
      var text = title ? (title.textContent || '').trim() : '';
      if (key && text) map[key] = modeLabel(text);
    }
  }

  // 把文字补回药丸（app 自己渲染了 span 时不动）。返回改名后的生效标签。
  function restorePermLabel(pill, map) {
    var own = pill.querySelector('[data-devin-label]');
    var span = pill.querySelector('span');
    if (span) {
      var text = modeLabel((span.textContent || '').trim());
      if (span.textContent !== text) span.textContent = text;
      var dirty = false;
      var seen = iconKey(pill);
      if (seen && map[seen] !== text) {
        map[seen] = text;
        dirty = true;
      }
      // iconKey() 读到的是我们换上去的 infinity svg 时，也要能还原出 "Agent"
      if (text === 'Agent' && map[INF_KEY] !== 'Agent') {
        map[INF_KEY] = 'Agent';
        dirty = true;
      }
      if (dirty) savePermLabels(map);
      return text;
    }
    var label = map[iconKey(pill)];
    if (!label) return '';
    if (!own) {
      own = document.createElement('span');
      own.setAttribute('data-devin-label', '1');
      own.className = 'min-w-0 truncate';
      own.textContent = label;
      var chevron = pill.querySelector('.devin-chevron');
      pill.insertBefore(own, chevron || null);
    } else if (own.textContent !== label) {
      own.textContent = label;
    }
    return label;
  }

  function decorate() {
    var panel = document.querySelector('[id="windsurf.cascadePanel"]');
    var band = panel && panel.querySelector('.group\\/beard-band');
    if (!band) return;

    // 先清掉上一轮的标记：早期版本用过「按文字匹配」，会把模式按钮也标成模型按钮，
    // 残留的属性能存活很久。同一 tick 内清掉再重标，不会闪。
    var staleAttrs = ['data-devin-perm', 'data-devin-model', 'data-devin-agent-switch', 'data-devin-add-context'];
    for (var s = 0; s < staleAttrs.length; s++) {
      var stale = band.querySelectorAll('[' + staleAttrs[s] + ']');
      for (var o = 0; o < stale.length; o++) stale[o].removeAttribute(staleAttrs[s]);
    }

    // 按 title/aria-label 找只有图标的按钮（“+” 没有文字）
    var btns = band.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var label = (btns[i].getAttribute('title') || btns[i].getAttribute('aria-label') || '').trim();
      if (label === 'Add context') btns[i].setAttribute('data-devin-add-context', '1');
    }

    // 其余按文字匹配：先找到叶子文字节点，再向上取最近的可点祖先。
    // 注意这套 UI 里有些「按钮」是 span.inline-flex（如 Accept all / Reject all），
    // 只扫 button 会漏掉。
    mark(band, /^Devin\s/i, 'data-devin-agent-switch');

    // 左侧工具栏（“+” / 模式 / 模型 都在这一组里）
    var leftGroup = band.querySelector('.text-text-secondary.flex.min-w-0.flex-1.items-center');
    if (leftGroup) {
      // 模式按钮：唯一被 div 包着的那颗（“+” 和模型选择都是裸 button）。
      // 用结构定位而不是文字匹配 —— 否则切到 ask / plan 模式就标不上了。
      var modeBtns = leftGroup.querySelectorAll(':scope > div > button');
      for (var m = 0; m < modeBtns.length; m++) modeBtns[m].setAttribute('data-devin-perm', '1');

      // 模型选择：裸 button 里除 “+” 之外唯一带文字的
      var flat = leftGroup.querySelectorAll(':scope > button');
      for (var f = 0; f < flat.length; f++) {
        if ((flat[f].textContent || '').trim()) flat[f].setAttribute('data-devin-model', '1');
      }
    }

    // 模式药丸：改名（"Bypass Permissions" -> "Agent"）+ 窄窗口下把被 app 删掉的文字补回来。
    // React 重渲染会把文字改回去 / 删掉，所以这里每次 tick 都检查一遍。
    var shared = (window.__devinUi = window.__devinUi || {});
    var permLabels = shared.permLabels || (shared.permLabels = loadPermLabels());
    restyleModeMenu(permLabels);
    learnFromMenu(permLabels);
    var permPills = band.querySelectorAll('[data-devin-perm]');
    for (var q = 0; q < permPills.length; q++) {
      var pill = permPills[q];
      var lbl = restorePermLabel(pill, permLabels);
      // bypass 模式换 infinity 图标；标签暂时认不出但图标已是我们的，保持现状
      if (lbl === 'Agent' || pill.querySelector('svg.' + INF_CLS)) {
        swapToInfinityIcon(modeIcon(pill));
      } else if (lbl) {
        unswapIcon(pill);
      }
      // 点开模式菜单时立刻重改，别等下一轮轮询（会看到 "Bypass Permissions" 闪一下）
      if (!pill.hasAttribute('data-devin-menu-watch')) {
        pill.setAttribute('data-devin-menu-watch', '1');
        pill.addEventListener('click', scheduleMenuRestyle);
      }
    }

    // 给 模式 / 模型 按钮补上右侧的下拉箭头
    var chevronHosts = band.querySelectorAll('[data-devin-perm], [data-devin-model]');
    for (var n = 0; n < chevronHosts.length; n++) addChevron(chevronHosts[n]);

    // 先清掉上一轮的 review 标记。必须用 document 作用域：
    // querySelectorAll 不包含元素自身，而早期版本曾把标记打到面板元素本身上。
    var stale = document.querySelectorAll('[data-devin-review-btn]');
    for (var k = 0; k < stale.length; k++) stale[k].removeAttribute('data-devin-review-btn');

    // 文件变更条上的按钮。条子有多个空槽位，全部扫一遍；
    // 限定在条内，避免误标到 tab 栏。
    var bars = band.querySelectorAll('div[class*="bottom-full"]');
    for (var j = 0; j < bars.length; j++) {
      mark(bars[j], /^Accept/i, 'data-devin-review-btn', 'primary');
      mark(bars[j], /^Reject/i, 'data-devin-review-btn', 'secondary');
      mark(bars[j], /^Quick review/i, 'data-devin-review-btn', 'secondary');
    }
  }

  // --------------------------------------------------------------------------
  // 去掉 "Your included ... usage quota is exhausted." 用量耗尽横幅
  //
  // 聊天客户端把这类提示渲染成 banner 组件：根节点下带一个
  // [data-slot="banner-icon"] 的图标槽。红色是 error 变体（额度彻底用尽），
  // 橙色是 warning 变体（正在用额外额度）。两者文案都含
  // "usage quota is exhausted."，这里一并隐藏。
  // 注意 CSP 禁 innerHTML，且这里是改现有节点，直接用 style 置灰即可。
  // --------------------------------------------------------------------------
  var QUOTA_BANNER_RE = /usage quota is exhausted/i;

  function hideQuotaBanner() {
    var icons = document.querySelectorAll('[data-slot="banner-icon"]');
    for (var i = 0; i < icons.length; i++) {
      var banner = icons[i].parentElement;
      if (!banner) continue;
      if (QUOTA_BANNER_RE.test(banner.textContent || '')) {
        banner.style.setProperty('display', 'none', 'important');
      }
    }
  }

  // --------------------------------------------------------------------------
  // 欢迎页（空编辑器）的 Recent projects 视图
  //
  // Devin 自带这个区块，标题行是个下拉：Sessions / Projects，默认停在 Sessions。
  // 偏好是全局持久化的（storageService 键 windsurf.editorWelcome.recentView，
  // 落在全局 state.vscdb 的 ItemTable 里），而注入的 JS 拿不到 storageService，
  // 所以只能模拟一次下拉选择把偏好种成 "projects"。
  //
  // 只种一次：成功后记进 localStorage，之后用户再切回 Sessions 也不会被改回去。
  // --------------------------------------------------------------------------
  var RECENT_VIEW_SEEDED = 'devin-ui.recent-view-seeded';

  // 用完整指针事件序列点一下。React 的 onClick 只监听 click，
  // 但 Base UI 的 Popover 靠 pointerdown 打开，只 dispatch click 打不开。
  function realClick(el) {
    var r = el.getBoundingClientRect();
    var types = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (var i = 0; i < types.length; i++) {
      var pointer = types[i].indexOf('pointer') === 0;
      var init = {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      };
      if (pointer) {
        init.pointerId = 1;
        init.isPrimary = true;
        init.pointerType = 'mouse';
      }
      el.dispatchEvent(new (pointer ? PointerEvent : MouseEvent)(types[i], init));
    }
  }

  function seedRecentView() {
    var shared = (window.__devinUi = window.__devinUi || {});
    if (shared.recentViewSeeded || shared.recentViewSeeding) return;

    var welcome = document.querySelector('.windsurf-welcome-container');
    if (!welcome) return;

    // 已经是 projects 视图 => 直接收工
    if (/Recent projects/.test(welcome.textContent || '')) {
      markRecentViewSeeded(shared);
      return;
    }

    var btns = welcome.querySelectorAll('button');
    var trigger = null;
    for (var i = 0; i < btns.length; i++) {
      if (/^Recent sessions$/.test((btns[i].textContent || '').trim())) {
        trigger = btns[i];
        break;
      }
    }
    if (!trigger) return;

    var seeded = false;
    try {
      seeded = localStorage.getItem(RECENT_VIEW_SEEDED) === '1';
    } catch (e) {
      /* 隐私模式等场景下读不了，忽略 */
    }
    if (seeded) {
      markRecentViewSeeded(shared);
      return;
    }

    shared.recentViewSeeding = true;
    shared.recentViewAttempts = (shared.recentViewAttempts || 0) + 1;
    realClick(trigger);

    // 菜单是 portal 渲染的，从整个 document 里找文字为 "Projects" 的叶子 span，
    // 点它的父节点（onClick 挂在那儿）。轮询而不是等固定时长 —— 菜单一出现就点，
    // 尽量缩短它露在外面的时间（种偏好只发生一次，但没必要让人看见菜单闪一下）。
    var waited = 0;
    var poll = setInterval(function () {
      waited += 50;
      var spans = document.querySelectorAll('span');
      for (var j = 0; j < spans.length; j++) {
        var el = spans[j];
        if (el.children.length || (el.textContent || '').trim() !== 'Projects') continue;
        clearInterval(poll);
        realClick(el.parentElement);
        markRecentViewSeeded(shared);
        return;
      }
      if (waited < 1000) return;
      // 下拉始终没打开：下个 tick 再试，但最多 3 次，免得反复弹菜单
      clearInterval(poll);
      shared.recentViewSeeding = false;
      if (shared.recentViewAttempts >= 3) markRecentViewSeeded(shared);
    }, 50);
  }

  function markRecentViewSeeded(shared) {
    shared.recentViewSeeded = true;
    shared.recentViewSeeding = false;
    try {
      localStorage.setItem(RECENT_VIEW_SEEDED, '1');
    } catch (e) {
      /* 忽略 */
    }
  }

  // --------------------------------------------------------------------------
  // 启动
  // --------------------------------------------------------------------------
  function checkActivityBarLocation() {
    // 图标出现在侧边栏 header 的 composite-bar 里 => 活动栏已是顶部模式
    var inSidebar = document.querySelector(CONTAINER_SEL);
    if (inSidebar) return;
    var standalone = document.querySelector('[id="workbench.parts.activitybar"]');
    if (standalone && standalone.getBoundingClientRect().width > 0) {
      console.warn(
        '[devin-ui] 检测到活动栏仍是左侧竖排。请在 settings.json 里设置\n' +
          '  "workbench.activityBar.location": "top"\n' +
          '然后重载窗口，图标才会变成顶部横排。',
      );
    }
  }

  function boot() {
    // 兼容早期版本：清掉旧定时器，避免旧闭包里的 CSS 把新内容覆盖回去
    if (window.__devinUiTimer) {
      clearInterval(window.__devinUiTimer);
      window.__devinUiTimer = null;
    }

    var state = (window.__devinUi = window.__devinUi || {});
    // CSS 存在共享状态里，定时器每次读最新值，重复注入时不会互相覆盖
    state.css = CSS;

    injectStyle(CSS);
    mountToggle();
    decorate();
    hideQuotaBanner();
    seedRecentView();
    checkActivityBarLocation();

    // workbench 会重建 DOM，用低频轮询兜底重新挂载（已挂载时是廉价空操作）
    // 每次注入都重建定时器：旧定时器闭包里是旧版 decorate()，留着会和新逻辑来回打架
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () {
      injectStyle(state.css);
      mountToggle();
      decorate();
      hideQuotaBanner();
      seedRecentView();
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
