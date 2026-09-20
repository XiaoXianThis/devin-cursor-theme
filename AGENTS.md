# Devin Desktop UI 定制笔记

目标：把 Devin 界面改成 Cursor 那样简洁，并复刻 Cursor 的聊天排版。
成果是可分享的单文件 `devin-ui.js`。

## 环境事实

| 项 | 值 |
|---|---|
| Devin 根目录 | `E:\Software\Devin3` |
| Devin 主进程 | `E:\Software\Devin3\Devin.exe` |
| 版本 | Devin 1.126.0 / windsurf 3.10.31（Electron 42.2.0, Chrome 148） |
| Devin 用户数据 | `C:\Users\XiaoXian\AppData\Roaming\Devin` |
| Devin 配置目录 (`dataFolderName: .devin`) | `C:\Users\XiaoXian\.devin` |
| 用户设置 | `...\AppData\Roaming\Devin\User\settings.json` |
| 工作区存储 | `...\User\workspaceStorage\da16a34b163ce8120e6f2f3117eb37d1\state.vscdb` |
| Cursor 根目录 | `E:\Software\cursor`（exe 在根目录，注意曾出现 `_\` 临时目录 = 更新进行中） |
| Cursor 用户数据 | `C:\Users\XiaoXian\AppData\Roaming\Cursor` |
| Cursor 配置目录 | `C:\Users\XiaoXian\.cursor` |
| Node | `E:\Runtime\nodejs\node.exe` v22.17.0（原生 WebSocket / fetch / node:sqlite） |

## 关键坑（全部踩过）

1. **id 里带点**。`windsurf.cascadePanel`、`workbench.parts.titlebar` 是**完整的 id 字面量**，
   所以 `#windsurf`、`.cascadePanel` 都选不中，必须用 `[id="..."]`。
2. **PowerShell 按 ANSI(GBK) 解码 UTF-8 文件**。中文注释变乱码后字节错位会吞掉注释结尾的
   `*/`，导致整条 CSS 规则被当成注释。**一律让 Node 自己按 UTF-8 读文件**
   （`cdp.mjs css <target> <文件路径>`、`evalfile`），不要用 `Get-Content -Raw` 传内容。
3. **`[class*="beard-band"]` 会误匹配文件名**（有个文件就叫 `beard-band.js`）。
   用转义的 `.group\/beard-band`。
4. **grep 工具跳过 >4MB 文件**。25MB / 36MB 的 bundle 要用 `tools/big-grep.mjs`。
5. **CSS 里必须用 `!important`**。`external.css` 在 `workbench.desktop.main.css` **之前**加载。
6. **`activityBar.location="top"` 后活动栏 DOM 位置变了**：独立的活动栏 part 变成 0x0，
   图标被渲染进侧边栏 header 的 `.composite-bar .actions-container`（横排）。
7. **CSP 禁止 `innerHTML`**。workbench.html 的 CSP 含 `require-trusted-types-for 'script'`，
   注入 JS 里给 `innerHTML` 赋值会抛 TrustedHTML 错误，必须用 `createElement`/`appendChild`。
8. **注入的 JS 要包 IIFE**，否则重复注入时顶层 `const` 报 `Identifier already declared`。
9. **定时器闭包会覆盖新样式**。若脚本被重复注入，旧定时器仍用旧闭包里的 CSS 常量把
   `<style>` 内容写回去。所以 CSS 要存在共享状态（`window.__devinUi.css`），
   定时器每次读最新值。
10. **Cursor 的 CLI 拒绝 `--remote-debugging-port`**。它的 argv.json 白名单只有
    `disable-hardware-acceleration / force-color-profile / disable-lcd-text / proxy-bypass-list`，
    命令行又会被参数解析器判为 `bad option`。
    **解法**：`tools/patch-cursor-main.mjs` 把 `remote-debugging-port` 加进那个白名单数组，
    再往 `~/.cursor/argv.json` 写 `"remote-debugging-port": "9223"`，重启 Cursor 即可。
    安全前提：`out/main.js` **不在** `product.json` 的 `checksums` 列表里（已核实），
    改了不会触发完整性校验。还原：`node tools/patch-cursor-main.mjs --revert`。
    连上后：`$env:CDP_PORT=9223; node tools/cdp.mjs ...`

    > 踩坑：关闭 Cursor 会触发挂起的更新落地，`Cursor.exe` 会被临时移走，
    > 此时 `Start-Process` 报"系统找不到指定的文件"。等十几秒更新器会自己把 Cursor 拉起来，
    > 端口也能正常就绪。

### Cursor 输入框的实测值（CDP 读的计算样式，Cursor 3.20.21）

| 元素 | 值 |
|---|---|
| 输入框 `.ai-input-full-input-box` | `radius 12px`（四角）· `border 1px solid 前景色 20%` · `bg 前景色 3.5%` · `padding 8px 10px 6px` |
| 变更条 `#composer-toolbar-section` | `radius 8px 8px 0 0` · `border 1px solid 前景色 8%` · `border-bottom 0` · `bg rgb(24,24,24)` 不透明 · 左右各内缩 **9px** · 高 **27px** |

几何：变更条 `x=817 w=443`，输入框 `x=808 w=461` → 左右各缩 9px；条底与输入框顶**重叠 1px**。

其他：`--conversation-surface-border-radius` = `--cursor-radius-xl` = `12px`（卡片/代码块同用）；
`--card-border-radius` 同值；`.composer-human-message` 也是 12px + 12% 描边 + 13.5% 灰底。
11. **「按钮」不一定是 `<button>`**。`Accept all` / `Reject all` 是
    `span.cursor-pointer.select-none`，`Quick review` 是 `span.inline-flex`。
    只扫 `button` 会漏。稳妥做法：遍历叶子节点匹配文字，再
    `closest('button, [role="button"], span.inline-flex, .cursor-pointer')`。
12. **`closest()` 里别放 `[tabindex]`**。面板自身有 tabindex，会一路匹配上去，
    把标记打到整个面板上。
13. **`el.querySelectorAll()` 不包含元素自身**。清理标记时若用 `panel.querySelectorAll(...)`，
    打在面板元素本身的标记永远清不掉，要用 `document` 作用域。
14. **`[class*="..."]` 可能先匹配到 SVG**。SVG 元素的 `className` 是 `SVGAnimatedString` 不是字符串，
    用 `div[class*="..."]` 限定标签名。

## 界面架构（Devin）

- 聊天面板不是 webview，是编译进 workbench 的 `windsurf-chat-client`
  （`out/vs/workbench/windsurf-chat-client/index.js`，25MB webpack bundle）。
- 样式用 Tailwind，全部作用域挂在 `.chat-client-root` 下。
- 布局 2×2：左上 `[id="workbench.parts.leftheader"]`（342×40，放 agent/editor 切换器），
  右上 `[id="workbench.parts.titlebar"]`（放菜单栏）；左下 activitybar+sidebar，右下 editor。
- composer：`div.group\/beard-band` → `div.flex.w-full.flex-col.transition-none` →
  `1)` Quick review 条（absolute）`2)` 输入框（`.cursor-text.border.rounded-xl`）
  `3)` 底部 "Local | 工作区" 条（`.overflow-x-clip`）。

Devin 聊天区组件对应：

| 角色 | 类名 |
|---|---|
| Markdown 正文 | `.prose-main.prose-ds.prose-ds-dense-v3` |
| 工具调用卡片 | `.group/card` + `.group/header` + `.codeium-text-medium` |
| 思考区/事件头 | `.group/event-header`（`text-12`）+ `.highlight-wrapper.text-text-tertiary` |
| 事件组 | `.flex.flex-col.event-group` |
| 终端输出 | `pre.terminal-text` / `pre.ansi-text` |
| 行内代码 | `code.bg-tint-secondary` |
| 思考区左侧竖线 | `.group/collapse-bar` 内的 `div.w-px`（1px，`bg-border-secondary`）；外层还有 16px 导轨 + 8px 间距的缩进，由 `--chat-collapse-rail-width` / `--chat-collapse-content-gap` 控制 |
| 文件变更条 | `div.absolute.bottom-full` → 内容行 `div.flex.min-w-0.flex-col.gap-1`（外层 `py-1.5` 撑高度） |

composer 工具栏按钮（实测）：

| 识别方式 | 按钮 | 处理 |
|---|---|---|
| `title="Add context"` | `+` | 隐藏 |
| 文字以 `Bypass` 开头 | 权限按钮 | CSS `::after` 改成 `bypass` + 灰色药丸底 |
| 文字以 `DeepSeek` 开头 | 模型选择 | 不动 |
| `title="Context usage: N%"` | 上下文用量 | 不动 |
| 文字以 `Devin ` 开头 | agent 切换 | 只留图标（隐藏 span） |
| `title="Start recording..."` | 麦克风 | 不动 |
| `title="Cancel"` | 发送 | 不动 |

标记由 `custom.js` 的 `decorate()` 以 `data-devin-*` 属性打在按钮上，CSS 依据标记改造。
React 重渲染会丢标记，所以 `decorate()` 要放在定时器里反复执行。

思考区实测：

| 元素 | 原值 | 改为 |
|---|---|---|
| `.group/event-header`（标题） | 13px / lh 20px / 52% | 14px / lh 20px / 74% |
| `.highlight-wrapper .flex.min-w-0.flex-col.text-12`（正文） | **12px / lh 16px** | 14px / lh 22px |
| `.highlight-wrapper`（文字色） | 54% | tertiary（前景色 60%） |

> 坑：`color-mix(in srgb, var(--vscode-editor-foreground) 60%, transparent)` 的实际 alpha 是
> **0.6 × 前景色自身 alpha**。本主题前景色是 `rgba(255,255,255,0.9)`，所以结果 alpha = 0.54，
> 与 Devin 原值巧合相同 —— 一度误判为"规则没生效"。

附件位置：Cursor 的图片缩略图在**文字上方**，Devin 在下方。用
`div.cursor-text.border > div:has(> .group\/attachment) { order: -1 }` 调换。

## Cursor 排版复刻来源

从 `<Cursor>/resources/app/out/vs/workbench/workbench.desktop.main.css`（1.23MB）与
`workbench.desktop.main.js`（36MB）里提取，**数值均为实测，不是猜的**：

| Cursor token | 值 |
|---|---|
| `--cursor-font-size-lg / base / sm / xs` | `14px / 13px / 12px / 11px` |
| `--cursor-line-height-lg / base / sm / xs` | `22px / 18px / 16px / 14px` |
| `--cursor-letter-spacing-base` | `-0.08px` |
| `--cursor-height-base / lg / sm / xs` | `28px / 32px / 24px / 20px` |
| `--cursor-radius-sm / base / lg / xl` | `4px / 6px / 8px / 12px` |
| `--cursor-stroke-secondary / tertiary / quaternary` | 前景色 `12% / 8% / 4%` 透明 |
| `--cursor-text-secondary / tertiary / quaternary` | 前景色 `74% / 60% / 36%` 透明 |
| `--cursor-bg-primary / secondary / tertiary` | 前景色 `20% / 14% / 8%` 透明 |
| `--cursor-font-smoothing-webkit` | `subpixel-antialiased` |
| `--conversation-block-gap` | `16px` |
| `--conversation-list-before-gap / after-gap` | `8px / 18px` |
| `--conversation-list-item-gap` | `8px` |
| `--conversation-heading-after-gap` | `4px` |
| `--conversation-tool-card-padding-x / y` | `10px / 8px` |
| `--conversation-tool-card-gap` | `6px` |
| `--composer-max-width` | `840px` |
| `--rte-font-size-code / code-block` | `.9em` |
| `--rte-font-size-h1..h5` | `1.75 / 1.5 / 1.25 / 1.1 / 1em` |

Cursor 工具卡片原文：

```css
.composer-tool-call-block-card[data-chrome=card] { gap:6px; padding:8px 10px; }
.composer-tool-call-simple-layout-header {
  align-items:center; border-bottom:1px solid var(--card-border-color);
  display:flex; flex-shrink:0; gap:8px; height:28px;
  justify-content:space-between; padding:0 10px 0 6px;
}
```

## 交付物

| 文件 | 作用 |
|---|---|
| `devin-ui.js` | 单文件版：全部 CSS + 图标展开按钮。**这是要分享的东西** |
| `README.md` | 安装说明（给接收方看） |

已安装副本：`~/.devin/devin-ui.js`，通过设置挂接（用 `${userHome}` 变量，跨机器通用）：

```json
"workbench.activityBar.location": "top",
"custom-ui-style.external.imports": ["file://${userHome}/.devin/devin-ui.js"]
```

`${userHome}` 在 Windows 下也能用（WHATWG URL 解析器会把 `file:` 路径里的 `\` 当 `/`，已实测）。

## 已确认可用的开关

| 需求 | 手段 |
|---|---|
| 活动栏顶部横排 | `"workbench.activityBar.location": "top"`（枚举 default/top/bottom/hidden） |
| 去掉蓝色描边 | 注入 CSS 覆盖 `.monaco-workbench` 上的 `--vscode-focusBorder` 等变量（`!important` 才能压过行内变量） |
| 默认 editor 模式 | 工作区存储 `workbench.mode` 键（scope 1）。值为 `"editor"` 会被 `normalizeStoredMode` 归一成 undefined（= editor）；`"windsurf-agent-window"` 才是 agent。本工作区**无该键**，已是 editor |
| 切回 editor 的命令 | `workbench.action.toggleWindsurfAgentWindow` |
| 编辑模式判定 | `.titlebar-container` 带 `windsurf-agent-window-mode` 类 = agent 模式 |

**注入 JS 无法改 VS Code 设置**：workbench 页面的 `window.vscode` 只是 Electron 的 preload 对象
（`ipcRenderer` / `process` / `context`），没有 `commands` / `configuration`。

## 工具

| 工具 | 用途 |
|---|---|
| `tools/cdp.mjs` | 零依赖 CDP 客户端：`list` / `eval` / `evalfile` / `dom` / `shot` / `css` |
| `tools/big-grep.mjs` | 大文件正则搜索（绕过 4MB 限制） |
| `tools/extract-css.mjs` | 从 CSS 提取类名 / 变量定义 / 规则块 |
| `tools/list-settings.mjs` | 列出扩展 package.json 的所有配置项 |
| `tools/read-storage.mjs` | 用 `node:sqlite` 读 state.vscdb |
| `snippets/*.js` | 各类 DOM 探查与验证脚本，用 `evalfile` 执行 |

CDP 通道：`~/.devin/argv.json` 里的 `"remote-debugging-port": "9222"`
（**必须是字符串**，源码里 `typeof u=="string"` 才走 `appendSwitch`）。

```powershell
curl.exe -s http://127.0.0.1:9222/json/version
node tools/cdp.mjs evalfile workbench.html snippets/verify-all.js
```

## 需求清单与状态

| # | 需求 | 状态 |
|---|---|---|
| 1 | 输入框样式改成 Cursor 风格 | ✅ |
| 2 | 去掉底部 "Local" 那一条 | ✅ |
| 3 | 去掉中间区域的聊天框 | ✅ |
| 4 | 图标顶部横排，只显示 4 个 | ✅ |
| 5 | 其余图标「点击展开」 | ✅ |
| 6 | 禁用 agent 模式，默认 editor | ✅ |
| 7 | 去掉左上角 agent/editor 切换区 | ✅ |
| 8 | 菜单直接居左 | ✅ |
| 9 | 去掉蓝色描边/outline | ✅ |
| 10 | 去掉 Recent sessions | ✅ |
| 11 | 全部收进单个 JS，可跨机器复用 | ✅ |
| 12 | 复刻 Cursor 聊天排版（字体/工具调用/思考区） | ✅ |
| 13 | 思考区：正文 12px/16px → 14px/22px | ✅ |
| 14 | 输入框图片位置上移到文字上方 | ✅ |
| 15 | bypass 改名 + 灰底；隐藏 `+`；agent 切换去文字 | ✅ |
| 16 | 卡片/diff/文件变更条对齐 Cursor（圆角 8px、头部 4px 6px、diff 12px） | ✅ |
| 17 | Accept all 从蓝色实心改为灰色药丸 | ✅ |
| 18 | 思考区去掉左侧竖线 + 正文颜色加深（54%→74%） | ✅ |
| 19 | 侧边栏顶部图标行横向居中 | ✅ |
| 20 | 变更条做成独立小药丸（窄一圈、更矮，不包裹输入框） | ✅ |
| 21 | bypass / 模型切换右侧补下拉箭头 | ✅ |
| 22 | 去掉 composer 外层背景；变更条与输入框拼成一个描边盒子 | ✅ |
| 23 | 按 Cursor 实测值全面对齐聊天内容（第 15 段） | ✅ |
| 24 | 去掉空消息状态的背景纹理（第 16 段） | ✅ |
| 25 | 底部控制行高度压到 20px（第 17 段） | ✅ |
| 26 | 输入框 padding / 字体 / 控制行间距 / 列表（第 18 段） | ✅ |
| 27 | 修掉模式按钮文字被硬编码成 "bypass" 的 bug | ✅ |
| 28 | 表格样式对齐 Cursor（第 19 段） | ✅ |
| 29 | 去掉侧边栏 "Explorer" 标题栏（第 20 段） | ✅ |

侧边栏结构（`#workbench.parts.sidebar` 的三个直接子元素）：

```
[0] div.composite.has-composite-bar.header-or-footer   y=40  h=35   ← 顶部图标行
[1] div.composite.title.has-actions                    y=75  h=35   ← "Explorer" + ... 按钮
[2] div.content                                        y=110 h=852  ← 文件树
```

隐藏 `[1]` 后内容区自动从 y=110 上移到 y=75。

**但会多出 35px 空隙**（第 21 段）：VS Code 的布局是 JS 算好写内联样式的，
`.content` 上写着 `style="height: 852px"`（= 922 槽位 − 35 图标行 − 35 标题栏）。
把标题栏 `display:none` 后 JS 不会重算，侧边栏总高只剩 887，比槽位 922 矮一截。

解法（不依赖魔数）：

```css
[id="workbench.parts.sidebar"] {
  height: 100% !important;          /* 撑满槽位 */
  display: flex !important;
  flex-direction: column !important;
}
[id="workbench.parts.sidebar"] > .content {
  height: auto !important;          /* 顶掉 JS 写的固定高度 */
  flex: 1 1 auto !important;
  min-height: 0 !important;
}
```

实测：sidebar `40..962 h=922`，`.content` `75..962 h=887`，与状态栏空隙 **0px**。

**但还差一层**：面板高度同样是 JS 写死的内联样式（绝对定位 + `top`/`height`）：

```
.content   h=891
  树面板    y=75..887   h=812   inline "top: 0px; height: 812px;"
  Outline   y=887..909  h=22    inline "top: 812px; height: 22px;"
  Timeline  y=909..931  h=22    inline "top: 834px; height: 22px;"
→ 面板区下方仍空 35px
```

`.content` 撑高后面板不会重算，所以要显式让树面板吃掉剩余高度，并把下面两个
折叠面板的 `top` 一起下移：

```css
/* 树面板 = 总高 - 44px（Outline 22 + Timeline 22，均为折叠态） */
.split-view-container > .split-view-view:nth-child(1) { height: calc(100% - 44px) !important; }
.split-view-container > .split-view-view:nth-child(2) { top: calc(100% - 44px) !important; }
.split-view-container > .split-view-view:nth-child(3) { top: calc(100% - 22px) !important; }
```

实测：树面板 `h=847`，面板区下方空白 **0px**。

> 通用教训：**VS Code 里凡是 JS 写内联尺寸的容器，用 CSS 改其可见性后都要自己把尺寸补回来**，
> 而且要**逐层补** —— 侧边栏 → .content → 面板，三层各有各的内联尺寸。

### 表格（第 19 段）

**Devin 表格的灰色底不在表格上，而在它外层的容器**：

```
table                bg=transparent
  ↑2 div.bg-bg-elevated.border-border-secondary   bg=rgb(36,36,36)   ← 灰底在这
```

所以只改 `table`/`th`/`td` 的背景是没用的，必须同时清掉外层容器：

```css
.chat-client-root .prose-main.prose-ds div[class*="bg-bg-elevated"]:has(table) {
  background-color: transparent !important;
  border-color: transparent !important;
}
```

描边 + 圆角的实现（圆角是**关键约束**）：

> **`border-collapse: collapse` 下 `border-radius` 不生效**，必须用 `separate`。
> 所以外框 + 圆角画在 `table` 上，内部网格靠单元格的 `border-right` / `border-bottom`，
> 最后一行/列去掉内部线避免与外框叠成 2px。

```css
table {
  border: 1px solid var(--ds-stroke-2);  border-radius: 8px;
  border-collapse: separate;  border-spacing: 0;
}
th, td { border-right: 1px solid var(--ds-stroke-2); border-bottom: 1px solid var(--ds-stroke-2); }
tr > *:last-child { border-right: none; }          /* 最后一列 */
tbody > tr:last-child > * { border-bottom: none; } /* 最后一行 */
```

> 坑：最后一行**必须写成 `tbody > tr:last-child`**。裸写 `tr:last-child` 会同时命中
> `thead` 里那一行，把表头和数据之间的分隔线一起干掉。

> 注：Cursor 原版表格**只有竖线、没有横线也没有底色**（分隔线还是用 `background-image`
> 画的 1px 渐变）。这里按用户要求改成了全描边，不是照抄 Cursor。

Cursor 原版参考（`ycs.base` / `jul.root`，stylex 运行时规则）：

```css
padding: 6px 10px;  text-align: left;  vertical-align: top;
background-image: linear-gradient(var(--card-border-color, var(--cursor-stroke-secondary)),
                                 var(--card-border-color, var(--cursor-stroke-secondary)));
background-size: 1px 100%;  background-position: right top;
:last-child { background-image: none }
th { font-weight: 590; white-space: nowrap }
table { border-collapse: separate; border-spacing: 0; width: max-content; min-width: 100% }
```

> 说明：Cursor 的 stylex 类名是运行时注入的哈希（如 `ui-uve7l6`），**不在静态 CSS 文件里**。
> 要查这类规则，得遍历 `document.styleSheets` 的 `cssRules`，不能 grep 文件。

### 输入框内部规格（第 18 段，Cursor 实测）

| 项 | Cursor | Devin 原值 |
|---|---|---|
| 输入框 padding | `8px 10px 6px` | 均匀 `8px` |
| 输入框 gap | `6px` | — |
| 占位符 | `14px/22px` · 前景色 60% | 13px |
| 输入文字 | `14px/22px` · 前景色 100% | `13px/18px` |
| 控制行 | 高 28px · 按钮 20x20 · 图标 16px · **间距 4px** | 间距 8px |
| 列表 ul/ol | `margin 8px 0 18px` · `padding-inline-start 28px` · disc/decimal · `14px/22px` | `1.4em` · 13px |
| li | `margin 0`（项间距走容器 gap 8px） | `li+li` 8px |

### ⚠️ 模式按钮：不能用 CSS 硬编码文字

早期版本用 `[data-devin-perm]::after { content: "bypass" }` 缩写文字，结果**切到 ask / plan 模式也一直显示 bypass**。
正确做法：CSS 只负责样式，文字缩写放在 `custom.js` 里，只对 `^Bypass\s+Permissions$` 生效。

另外模式按钮的标记也改成**结构定位**（左侧工具栏里唯一被 `div` 包着的那颗），
不再按文字匹配 —— 否则换个模式名就标不上，药丸底色会消失。

> 坑：标记属性会残留。`decorate()` 每轮开头必须先清掉 `data-devin-perm` / `-model` /
> `-agent-switch` / `-add-context` 再重标，否则旧版本留下的错误标记会一直生效。

### 控制行高度（第 17 段，Cursor 实测）

| 元素 | Cursor | Devin 原值 |
|---|---|---|
| Agent 药丸 | `80x20` · radius full · `bg 前景色 14%` · `padding 2px 4px 2px 8px` · `fs 12px` | `95x24` · bg 12% |
| 模型选择 | `77x20` · radius 4px · `padding 0 4px` · `fs 13px` | `170x24` |
| 上下文用量 | `29x20` | `24x24` |
| 纸夹 / 麦克风 | `20x20` | `24x24` |
| 发送 | `24x20` | `24x24` |

Devin 侧选择器：文字类按钮带 `h-6`，图标类带 `size-6`，都在
`.group\/beard-band div.cursor-text.border .flex.flex-wrap.items-center` 内。

### 空状态背景纹理

空状态（"Describe your task to Devin"）背后那层波浪线：

```
svg  [1200x1530, opacity 0.5]
  └ parent: div.pointer-events-none.absolute.bottom-0.left-1/2.flex
```

选择器：`.chat-client-root div[class*="pointer-events-none"][class*="left-1/2"] { display: none }`。
验证方式：造一个同 class 的临时元素，确认它 computed `display` 变成 `none`（因为空状态不常驻，没法直接测）。

### 聊天内容对齐的实测值（第 15 段，CDP 读 Cursor 3.20.21）

| 元素 | Cursor 实测 | Devin 原值 |
|---|---|---|
| 用户消息气泡 `.composer-human-message` | `radius 12px` · `border 1px @12%` · `bg rgb(77,77,77) @13.5%` | `radius 16px 4px 16px 16px` · `bg 3%` |
| **思考区** `.ui-markdown` | **`opacity: 0.5`** ← 暗化来自 opacity 不是 color | 无 |
| 思考标题 `.ui-collapsible-action` | `14px / 22px` · `color 60%` | `14px / 20px` · `74%` |
| 正文段落 `.ui-markdown__paragraph` | `14px / 22px` · `margin-bottom 16px` | 同 |
| 行内代码 `.ui-markdown__inline-code` | `12.6px` · `bg 8%` · `radius 5px` · `padding 1.5px 2px` · Consolas | 透明 / 0 圆角 / 0 内边距 |
| diff 增行 | `rgba(63,162,102,0.2)` | `rgba(63,162,102,0.13)` |
| diff 删行 | `rgba(184,0,73,0.2)` | `rgba(184,0,73,0.13)` |
| 卡片/代码块 | `radius 12px` · `bg` 面板色 · `border 12%` | `radius 8px/10px` · `bg rgb(36,36,36)` |
| 终端输出 | `12px / 20px` | `11.7px` / `10.5px` |

**用户消息的识别**：包裹带 `.ml-auto`（助手消息是 `.group/acp-agent-message`）。

> 注意：用户已把 **Cursor Dark 主题**装进 Devin，所以 diff 的色相本来就一致，只差 alpha。

> 坑：思考区正文的 `opacity` 用 `> div:not(.group\/event-header)` 写**不生效**（选择器命中但计算值仍为 1），
> 换成 `> div:nth-child(2)` + `!important` 才行。折叠状态下只有 1 个子元素，规则自然不命中。

### composer 一体式描边盒子的对齐值（第 14 段）

变更条与输入框要严丝合缝，关键是两个数：

| 项 | 值 |
|---|---|
| 变更条 | `border: 1px solid`（上/左/右），`border-bottom: none`，`radius: 8px 8px 0 0`，`bg: transparent` |
| 输入框 | `border: 1px solid`（全边），`radius: 0 0 8px 8px` |
| 外层 `py-1.5` 包装 | `padding-block: 2px 0` ← **下内边距必须为 0**，否则条底与输入框顶差 2px 出现缝隙 |
| 外层背景层 | `.bg-bg-elevated-wax` 设 `display:none`，它原本用 `inset-0` 把变更条一起包住 |

实测对齐结果：条 `x=993 w=515`，输入框 `x=993 w=515`，条底 `816` = 输入框顶 `816`。

## 待办

- [ ] 用户执行 `Custom UI Style: Reload` 让 `external.imports` 生效（此后才持久化）
- [ ] 用户确认 Cursor 排版复刻效果，可能需要微调字号/字重
- [ ] 调试结束后删除 `argv.json` 里的 `remote-debugging-port`（端口对本机所有进程开放）
