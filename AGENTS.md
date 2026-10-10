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

macOS 上（仓库已迁到 Mac，工具链同样可用）：

| 项 | 值 |
|---|---|
| Devin 应用 | `/Applications/Devin.app`，主进程 `Contents/MacOS/Devin` |
| Devin 用户数据 | `~/Library/Application Support/Devin`（settings.json 在 `User/` 下） |
| Devin 配置目录 | `~/.devin`（`argv.json`、`devin-ui.js`、`extensions/` 都在这） |
| Node | v24.21.0（nvm），原生 WebSocket / fetch 可用 |
| 实测结论 | 主题在 macOS 上完整生效：`<style id="devin-ui-style">` 23.5KB 注入、`--vscode-focusBorder` = transparent、activitybar 0×0、图标进侧边栏 header、折叠态 8 个图标只显示 4 个 |

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
15. **别用 `launchctl submit` 托管「重启 Devin」脚本**。launchctl 会在 job 退出后**自动重跑**它
    （受 10s respawn 节流），脚本耗时超过 10s 就变成死循环：实测一个 21s 的脚本被以
    「每 21 秒杀一次 Devin」的节奏跑了 20 多轮。验证：`launchctl submit -l x -- bash -c 'echo hi >> f'`
    在 26 秒内写了 3 行（间隔正好 10s）。
    **正确做法**：node `spawn(..., { detached: true })` + `unref()`，detached 在 POSIX 上就是
    `setsid()`，worker 自成会话与进程组。验证方式：`ps -o pid,ppid,pgid -p <worker>`
    应看到 `PPID=1`（被 launchd 收养）且 `PGID=PID`（自成进程组）。见 `tools/restart-devin.mjs`。
16. **agent 自己就跑在 Devin 里**，重启 Devin 会连带杀掉 agent 会话。所以「重启并等待端口」
    这类动作必须放进脱离进程树的 worker（同上），否则端口永远等不到。判断方法：
    `ps -o ppid= -p $$` 的父进程是 `Devin.app/.../devin acp`。
17. **Base UI 的下拉只 dispatch `click` 打不开**。它的 Popover 监听 `pointerdown`，
    只补一个 `click` 事件菜单不会出现。要按
    `pointerdown → mousedown → pointerup → mouseup → click` 完整序列派发，
    并带上 `pointerId` / `isPrimary` / `pointerType`（`PointerEvent` 构造参数）。
    见 `devin-ui.js` 里的 `realClick()`。
17. **`color-mix(..., transparent)` 出来的填充是半透明的，盖不住东西**。4% 填充的 alpha
    就是 0.04。贴在实心表面上的元素用它没问题，但**浮在消息列表上方的层（band 槽位里的
    条目）必须用不透明的底**，否则下面滚动的文字会原样透上来。做法：把 `transparent` 换成
    不透明的面板色（`--ds-surface-bg`）。详见「提问卡片」一节。
18. **验证方法本身也会骗人**。只读计算样式、或在"背后没内容"的状态下截图，都会得出
    "改好了"的错误结论。凡是"盖住/遮住"类的改动，必须在被遮对象**确实存在**的情况下验证
    （合成一段高饱和内容放在下层，再采样像素）。
19. **`.chat-client-root` 不止一个实例，别给它设底色**。页面里有一个 0×0 的、一个全窗口的，
    给它 `background-color` 会把整个窗口盖成一块色。聊天底色默认跟随主题，不要为了对齐 Cursor 去改。
20. **从 Devin 的 shell 里启动 Cursor 会立刻退出**。Devin 是 Electron 应用，子 shell 会继承
    `ELECTRON_RUN_AS_NODE=1` 等变量，Cursor 按 Node 模式跑完就退。启动时用干净环境：
    `env -i HOME="$HOME" USER="$USER" PATH=/usr/bin:/bin:/usr/sbin:/sbin open -a Cursor`。

## 界面架构（Devin）

- 聊天面板不是 webview，是编译进 workbench 的 `windsurf-chat-client`
  （`out/vs/workbench/windsurf-chat-client/index.js`，25MB webpack bundle）。
- 样式用 Tailwind，全部作用域挂在 `.chat-client-root` 下。
- 布局 2×2：左上 `[id="workbench.parts.leftheader"]`（342×40，放 agent/editor 切换器），
  右上 `[id="workbench.parts.titlebar"]`（放菜单栏）；左下 activitybar+sidebar，右下 editor。
- composer：`div.group\/beard-band` → `div.flex.w-full.flex-col.transition-none` →
  `1)` **band 槽位** `div.absolute.bottom-full`（absolute，浮在消息列表上方，见下）
  `2)` 输入框（`.cursor-text.border.rounded-xl`）
  `3)` 底部 "Local | 工作区" 条（`.overflow-x-clip`）。

**band 槽位**（第 14 段相关）：`div.absolute.bottom-full.left-0.right-0` 是 composer 上方
那个 absolute 槽位，里面按 `[data-band-item]` 放条目 —— 文件变更条和 ACP 提问卡片都在这。
关键：这个槽位在 `.group/beard-band` **外面**，而 composer 的毛玻璃底
（`div.pointer-events-none.absolute.inset-0.bg-bg-elevated-wax.backdrop-blur`，`rgba(37,37,38,.94)`）
只盖住 `.group/beard-band` 自己 —— 所以槽位里的条目**默认没有底**，是直接压在消息列表上的。
每个条目必须自带背景：变更条靠第 14 段的药丸底，提问卡片靠第 14 段末尾那条规则。

结构对照（两层都实测过）：

| 条目 | 结构 |
|---|---|
| 文件变更条 | `[data-band-item]` > `div.flex.min-w-0.flex-col` > `div.flex.min-w-0.flex-col.gap-1`（药丸，425×27） |
| 提问卡片 | `[data-band-item]` > `div`（无类名）> `div.flex.flex-col`（425×317）> 问题行 `div.flex.gap-2.pl-3.5.pr-1.items-start.min-h-8` |

两者的 `[data-band-item]` 类名**完全相同**（`flex min-w-0 flex-col py-1.5 empty:hidden
divide-y divide-border-secondary [&>*+*]:mt-[5px] [&>*+*]:pt-[5px]`），只能靠后代结构区分：
卡片的内容在 `div > div.flex.flex-col`（**没有** `min-w-0`），变更条的在
`div.flex.min-w-0.flex-col > .flex.min-w-0.flex-col.gap-1`（**有** `min-w-0`）。
所以用 `[data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0))`。
实测：页面上 10 个 `[data-band-item]` 只命中卡片那一个。
（别用 `div:not([class])` 判无类名 —— React 可能渲染出 `class=""`，属性存在但值为空。）

提问卡片几何：和输入框**同宽同 x、底面紧贴输入框顶**（都是 x 1419 w 490，分界 y 963），
所以给它和输入框一样的 `--ds-fill-faint` 填充就能拼成一整块不透明的面。

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
| 提问卡片（elicitation） | 同上的 band 槽位；`[data-band-item]` > `div` > `div.flex.flex-col`，问题行 `div.flex.gap-2.pl-3.5.pr-1.items-start.min-h-8`。ACP elicitation 请求挂起时才渲染，`composerPlaceholder` 变成 "Other answer"（复用 composer 输入框） |

composer 工具栏按钮（实测）：

| 识别方式 | 按钮 | 处理 |
|---|---|---|
| `title="Add context"` | `+` | 隐藏 |
| 文字以 `Bypass` 开头 | 权限按钮 | 文字改成 `Agent` + 灰色药丸底 |
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

占位符（hint）是 Slate 的 `span[data-slate-placeholder]`：行内样式 `position:absolute; width:100%`，
继承编辑器的 `white-space: pre-wrap`，窄面板下会折行，第二行被 `min-h-[2rem]` 滚动容器裁掉。
用 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` 压成单行。

模式按钮（`[data-devin-perm]`）：父级 `flex min-w-6` + span `min-w-0 truncate` 默认可收缩，窄面板下
"Bypass" 被挤成只剩图标。给父级 / 按钮 / span 设 `flex-shrink: 0`，让模型名去截断。
下拉箭头 `.devin-chevron`：按钮自带 `[&_svg]:!size-4`、`[&_svg:last-child:not(:first-child)]:ml-[2px]`，
要用 `button > svg.devin-chevron.devin-chevron` 才压得住；viewBox 裁成 `3 0 10 16` 去掉两侧留白。
模型名**不**在保护范围内：仍可收缩 + 省略号截断（控制行保持 `flex-wrap: nowrap`，不能换行）。

> **窄面板下 app 会整颗换按钮**：composer 容器宽 < ~370px 时，模式药丸从「图标+文字」变体
> 换成 `size-6` 的**只有图标**按钮（`[&_svg]:size-[16px]`，**文字根本不在 DOM 里**，
> React 条件渲染），CSS 救不回来。所以 `devin-ui.js` 自己把文字补回去：
> 用图标的 `path d` 当键记住「图标 → 模式名」（`localStorage['devin-ui.perm-labels']`），
> 缺文字时插一个自己的 `span[data-devin-label]`。模式名来源：① 药丸自己渲染文字时顺便记下；
> ② 模式菜单打开时（菜单项 = 图标 + `span.break-words` 标题 + 说明）整批记下。
> 代价：全新窗口 + 一直窄 + 从没开过模式菜单时，无字可显示（开一次菜单或放宽一次面板即永久记住）。
> 配套 CSS：`[data-devin-perm]:has(> [data-devin-label])` 还原 `width:auto` + 内边距 + gap，
> 并且 `button[class*="size-6"]` 那条图标尺寸规则要加 `:not([data-devin-perm])`，
> 否则药丸被钉死在 20px 宽、补回来的文字被裁掉（选择器权重不够压不过它）。
语音按钮用 `button[aria-label*="recording" i]` 隐藏。右侧图标统一 20px 方块 + 16px 图标：
agent 切换去掉内边距 / 外层 `min-w-6` / svg 的 `mr-px`，发送按钮去掉 `[&>svg]:[scale:0.9375]`，实测图标间距 8/8px。
**定时器每次注入都要重建**：只存 CSS 到共享状态不够，旧定时器闭包里的旧 `decorate()` 也会和新逻辑打架
（实测旧版 addChevron 把 viewBox 改回去）。
多窗口时 `cdp.mjs` 的 `workbench.html` 只命中第一个窗口，用窗口标题（如 `devin-cursor-theme`）选目标。

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

### Cursor 聊天实测（第 22 段，CDP 读计算样式，Cursor 3.18.9）

Cursor 的聊天在 `General chat` 面板里，和 Devin 同样是 `workbench.html` 的 DOM。

| 元素 | Cursor 实测值 | Devin 改前 | Devin 改后 |
|---|---|---|---|
| 正文 `.ui-markdown__paragraph` | 14px / 22px，字距 normal，`rgb(204,204,204)` | 段落被 dense 压到 13px/18px，字距 -0.08px | 14/22，normal |
| 段距 | 段后 16px；段落紧跟列表时 8px | 16px | 同左 |
| 标题 h2 | 18.452px / 26.2px，w590，段前 20.5px、段后 4px | 按 em 算 | 同 Cursor |
| 标题 h3 | 16.996px / 24.13px，w590，段前 20.5px、段后 4px | 按 em 算 | 同 Cursor |
| 有序列表 `ol` | `padding-left: 28px`，margin `8px 0 18px`，项间 8px | 1.4em | 28px |
| 行内代码 `code` | 0.9em（12.6px），`padding 1.5px 2px`，bg 8%，radius 5px | padding 3px | 1.5px 2px |
| 代码块 | 容器 `rgb(31,31,31)` + 1px 12% 描边 + 圆角 12px，margin `12px 0`；行 Menlo 12/18，左右内边距 10px | 圆角 8px，12px/16.5px | 圆角 12px、12/18 |
| 用户气泡 `.composer-human-message` | 实心 `rgb(46,46,46)`，1px `rgba(204,204,204,.12)`，圆角 12px，内边距 `8px 10px`，文字 14/22 | 内边距 `8px 14px` | 同 Cursor |
| 工具卡 `.ui-shell-tool-call` | 卡片底 = 面板底 `rgb(31,31,31)`，1px 12% 描边，圆角 12px；头部 39px（含分隔线），内边距 8px，间距 6px，14/22 | 头部 29px，内边距 4px 6px，卡片底 `rgb(25,26,27)` | 同 Cursor |
| 工具输出 | 13px / 18px，`rgba(204,204,204,.36)`，内边距 `0 10px 6px` | 12px/20px，内边距 `0 0 12px 20px` | 同 Cursor |
| 思考行 `Thought` | 14/22，`rgba(204,204,204,.6)` | 14/22，tertiary | 不变（已一致） |
| 聊天底色 | `rgb(31,31,31)` | 跟随主题 | 不改（用户要求） |

注意：`color-mix(... editor-foreground ...)` 会叠加前景色自身的 0.9 透明度，所以 Cursor 的
`rgba(204,204,204, x)` 这类颜色直接写 rgba，不要用 `--ds-*` 的 editor-foreground 版本去对齐。

Devin 段落的段距、标题样式未在真实消息里验证，是用临时 DOM（测完即删）测的。

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
| 禁用 Devin 自动更新 | 用户 settings.json 写 `"update.mode": "none"`；一键 `node tools/disable-updates.mjs`（`--revert` 还原） |

**注入 JS 无法改 VS Code 设置**：workbench 页面的 `window.vscode` 只是 Electron 的 preload 对象
（`ipcRenderer` / `process` / `context`），没有 `commands` / `configuration`。

### 禁用 Devin 自动更新（第 30 段）

主题依赖 `custom-ui-style` 扩展 patch 过的 `workbench.desktop.main.css` 与 `product.json`
（应用目录里能看到 `.custom-ui-style` 备份文件），**应用升级会覆盖这些文件导致主题失效**，
所以要关掉自动更新。

- 开关是 VS Code 标准的 `update.mode`（`none` / `manual` / `start` / `default`）。
- 值为 `none` 时 `getProductQuality()` 直接返回 `undefined`，更新服务在启动时进入 `Disabled`
  状态（`out/main.js` 日志：`update#ctor - updates are disabled by user preference`）。
- **machine 作用域**（schema `scope: 1`），只能写在用户 settings.json；
  写进工作区 `.vscode/settings.json` 会被忽略。
- 用户 settings.json 位置：macOS `~/Library/Application Support/Devin/User/settings.json`，
  Windows `%APPDATA%\Devin\User\settings.json`，Linux `~/.config/Devin/User/settings.json`。
- `tools/disable-updates.mjs` 做文本级编辑（保留注释与排版），改完**重启 Devin Desktop 生效**。

> 区分：Devin **CLI** 的自更新是另一套开关 —— `~/.config/devin/config.json` 里的
> `"auto_update": false`（仅 user 级；且只对自管理安装生效，随 Devin Desktop 打包的安装会被忽略）。

## 工具

| 工具 | 用途 |
|---|---|
| `tools/cdp.mjs` | 零依赖 CDP 客户端：`list` / `eval` / `evalfile` / `reload` / `dom` / `shot` / `css` |
| `tools/big-grep.mjs` | 大文件正则搜索（绕过 4MB 限制） |
| `tools/extract-css.mjs` | 从 CSS 提取类名 / 变量定义 / 规则块 |
| `tools/list-settings.mjs` | 列出扩展 package.json 的所有配置项 |
| `tools/read-storage.mjs` | 用 `node:sqlite` 读 state.vscdb |
| `tools/disable-updates.mjs` | 关闭 / 还原 Devin Desktop 自动更新（写 `"update.mode": "none"`） |
| `tools/enable-cdp.mjs` | 开启 / 关闭 CDP 调试端口（写 `~/.devin/argv.json` 的 `remote-debugging-port`） |
| `tools/restart-devin.mjs` | 重启 Devin 并等端口就绪（worker 用 `setsid` 脱离进程树，不会被自己重启掉） |
| `snippets/*.js` | 各类 DOM 探查与验证脚本，用 `evalfile` 执行 |

CDP 通道：`~/.devin/argv.json` 里的 `"remote-debugging-port": "9222"`
（**必须是字符串**，源码里 `typeof u=="string"` 才走 `appendSwitch`）。
用 `node tools/enable-cdp.mjs` 写入、`node tools/enable-cdp.mjs --revert` 关闭（调试完务必关掉，
端口对本机所有进程开放）。Devin 的 argv.json 白名单里**本来就有** `remote-debugging-port`
（`out/main.js` 的 `KK()` 里那 5 个），所以不像 Cursor 需要打补丁。

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
| 30 | 禁用 Devin 自动更新（防止升级覆盖被 patch 的 CSS） | ✅ |
| 31 | 提问卡片（elicitation）给**不透明**底 + 四角 12px 圆角 + 12% 描边，内部字号对齐 14px/22px（第 14.5 段） | ✅ |
| 32 | 空编辑器欢迎页显示「Recent projects」列表 + View all 搜索打开（第 5 段） | ✅ |
| 33 | 去掉「Your included … usage quota is exhausted.」用量耗尽红色横幅 | ✅ |
| 34 | 聊天区高保真对齐 Cursor：正文 14/22 字距 normal、标题、列表 28px、代码块、工具卡头 39px、用户气泡 `rgb(46,46,46)`、终端输出 13/18 @36%（第 22 段） | ✅ |
| 35 | 工具卡片对齐 Cursor：去掉 `border-beam` 光束装饰与 w-5 状态点、命令/输出 13/18 @36% 无语法色（第 23 段） | ✅ |
| 36 | 活动行（Thoughts / Read / Searched）对齐 Cursor：去掉左侧图标，展开按钮移到文字右侧，目标 `code` 去胶囊底（第 24 段） | ✅ |
| 37 | 命令输出折叠高度对齐 Cursor：Devin 64px + 35px 渐隐 → 96px 无渐隐（第 25 段，只匹配折叠态内联值） | ✅ |

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
正确做法：CSS 只负责样式，文字改写放在 `custom.js` 里，只对 `^Bypass\b` 生效。

模式名来自 nls（`out/nls.messages.js`）：`Bypass Permissions / Auto Mode / Ask Before Edits / Plan Mode / Edit Automatically`。
现在把 `Bypass Permissions` 显示成 **`Agent`**（对齐 Cursor 的 Agent 药丸），其余模式原样保留。
注意 `devin-ui.js` 的内容会被 `custom-ui-style` 打包进
`out/vs/code/electron-browser/workbench/external.module.js`（所以那个文件里也能 grep 到自己的源码）。

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

### 提问卡片（elicitation）的不透明底

现象：红框那块（问题 + A/B 选项）和消息列表同色，看不出边界，用户报"面板背景是透明的"。
**不是透出编辑器** —— 用像素采样确认过：框内和框上方都是 `rgb(25,26,26)`，完全同色，
框内也没有任何外来文字像素。真正的问题是**卡片自己没有面**（见上面的 band 槽位说明）。

规则（第 14.5 段）：

```css
/* 卡片本体：不透明面板底 + 12% 描边 + 12px 四角圆角 */
.chat-client-root div[class*="bottom-full"] [data-band-item]:has(> div > div.flex.flex-col:not(.min-w-0)) {
  background-color: var(--ds-surface-bg) !important;   /* 不透明：4% 填充 + 面板色 = rgb(32,33,34) */
  border: 1px solid var(--ds-stroke-2) !important;     /* 12% 描边（原来 8%，太淡） */
  border-bottom: 1px solid var(--ds-stroke-2) !important;
  border-radius: var(--ds-radius-xl) !important;       /* 四角 12px（原来只圆上角） */
  padding-block: 8px !important;                       /* 补回被 [class*="py-1.5"] 清零的内边距 */
}
```

同段还顺带把卡片内部对齐到主题的字号（App 默认比主题小一号）：

| 元素 | App 原值 | 改为 |
|---|---|---|
| 问题 / 选项 / "Something else" 输入框 | 13px / 16px | 14px / 22px（`--ds-text-size` / `--ds-line-height`） |
| 选项描述（第二行小字） | 13px / 16px | 13px / 18px（保留次级层级） |
| 选项行（`[role="button"]`） | `min-h-6` = 24px | 28px（正文行高 22px 后 24px 太挤） |
| Next / Submit 主按钮 | 蓝色实心 `rgb(41,122,160)` | 中性药丸 `--ds-pill-bg`（和 Accept all 一致） |

> 为什么改成四角圆角：卡片浮在变更条上方，而变更条左右各内缩 9px。
> 只圆上角时卡片下缘是「方角 + 没有下描边」，紧贴着一条更窄的圆角药丸 —— 看着像被切掉一半。
> 四角圆角 + 四周描边后，卡片是一块完整的独立面板，和工具卡片同一套语言。
> （这条是照用户选定的「不透明面板底」方案做的，不是照抄 App 默认。）

### ⚠️ 半透明 ≠ 不透明（第一版改错的地方）

第一版用了 `var(--ds-fill-faint)`（= `color-mix(前景色 4%, transparent)`），因为"要和输入框填充一致"。
**这是错的**：4% 填充的 alpha 就是 0.04，等于 96% 透明，只是把背后内容压暗一点点而已。
输入框在滚动区**外面**、背后没内容，所以半透明看着没问题；但卡片是 `absolute bottom-full`
**浮在消息列表上方**的，消息文字会原样从卡片下面透上来（用户截图："透明叠加了"）。

| token | 定义 | 结果 |
|---|---|---|
| `--ds-fill-faint` | `color-mix(前景色 4%, transparent)` | `rgba(...,0.04)` 半透明，会透 |
| `--ds-surface-bg` | `color-mix(前景色 4%, var(--vscode-sideBar-background))` | 不透明 `rgb(32,33,34)`，实测 alpha = 1 |

结论：**凡是要盖住内容的浮层，底色必须给不透明的底**（把 transparent 换成面板色）。
只有贴在实心表面上、不需要遮盖内容的元素才能用半透明填充。

> 描边可以照旧用 8% alpha 的 `--ds-stroke-3`：`background-clip` 默认是 `border-box`，
> 背景会铺到描边下面，所以描边叠的是元素自己的不透明底，不会透出背后内容。
> （一开始以为描边也会透，把描边改成不透明，实测证明是多余的，已还原。）

**怎么验证的**（卡片只在 elicitation 请求挂起时渲染，没法随时抓）：

1. 起一个后台轮询器，反复 `cdp.mjs evalfile` 找带唯一标记的文本；
2. 用 `ask_user_question` 复现卡片（同一个 ACP elicitation 组件），轮询器在卡片显示期间抓到
   完整祖先链 + 截图，写进 `/tmp/card-dump.json`；
3. 负向测试：现在只有变更条在场，任何候选选择器命中数必须为 0（避免误伤变更条）；
4. 正向测试：**按抓到的真实类名在真实槽位里合成一张卡片**，读计算样式 + 截图看观感；
5. 清理合成元素与临时 `<style>`，再写进交付文件。

> 踩坑 1：合成元素里 `el.className = ''` 不会写出 `class` 属性，所以 `div:not([class])` 能命中；
> 但 React 渲染的空类名可能写成 `class=""`（属性存在），选择器就失效了。
> 最终改成 `div:not(.min-w-0)` 这种不依赖属性存在性的判别式。
>
> 踩坑 2（更贵）：**合成测试当时"通过"了，但漏掉了真正的问题**。我只读了卡片的计算样式
> （看到有 `background-color` 就以为成了），没检查"背后有内容时会怎样"。合成卡片时消息列表
> 那段恰好是空的，于是透不透根本看不出来。正确的合成测试要**在卡片后面塞一段高饱和文字**
> （`position:absolute; inset:0`，DOM 顺序放在卡片之前 = 绘制在卡片之下），
> 然后采样卡片矩形内的像素：红字像素必须为 0（只允许圆角圆弧外侧的缺口）。
> 验证方法本身也会骗人 —— 结论要能回答"如果它坏了会怎样"，而不是"它看起来对"。

> 另外：卡片只在有 band item 时才渲染，槽位空着会 `[&:not(:has([data-band-item]>*))]:hidden`
> 变成 `display:none`，合成测试前要先 `slot.style.setProperty('display','flex','important')` 强制打开。

### 空编辑器欢迎页的「Recent projects」（第 5 段）

Devin 的空编辑器不是 VS Code 的 watermark，而是 windsurf-chat-client 里的 React 组件，
挂在 `.windsurf-welcome-container`（同时带 `chat-client-root` / `dark`）。结构：

```
.windsurf-welcome-container
  #chat  (700px 宽，整块垂直居中)
    div.relative.flex.h-full.w-full.flex-col
      div.relative.flex.w-full.flex-col.items-center.px-2      ← 居中列
        svg  (Devin logo 64x64，absolute bottom-full mb-6)
        div.flex.w-full.flex-col.gap-1 → .group/beard-band     ← composer（本主题隐藏）
      div.absolute.left-0.top-full.flex.w-full.flex-col.gap-6.px-2.pt-6   ← 本段主角
        div.flex.w-full.gap-2               → 三张卡片
        div.flex.w-full.flex-col.gap-1.5    → 标题行 + 列表
      div.absolute.inset-x-0.bottom-0       → "Pro • Settings"
```

**这个区块本来就自带「最近项目」UI**（bundle 里的 `i0F` 组件，
`out/vs/workbench/windsurf-chat-client/index.js`），不需要自己造：

| 元素 | 行为 |
|---|---|
| 标题行（下拉） | `Recent sessions` ⇄ `Recent projects`，切换写偏好 `windsurf.editorWelcome.recentView` |
| `View all` | `dispatch("openRecent")` → `workbench.action.openRecent`（可搜索的最近项目选择器） |
| 列表项 | `button[title=<绝对路径>]`，点击 → `openRecentProject(path)` 真正打开该文件夹 |
| 三张卡片 | `pickDirectory`（目录选择器，里面也带最近项目）/ `git.clone` / `openSSH` |

细节：

- 偏好存在**全局** storage（`User/globalStorage/state.vscdb` 的 ItemTable）。
  `getRecentView()` 只认 `"projects"`，其他值一律当 sessions，所以默认就是 sessions。
- 列表最多 5 条：bundle 里 `i0J=5` + `.slice(0,5)`，改不了。
- 数据来自 `workspacesService.getRecentlyOpened()`；为空时回退
  `IMPORT_VS_CODE_RECENT_WORKSPACES`（把 VS Code 的最近工作区导入过来）。
- 三张卡片和列表同属 `.absolute.top-full` 这个区块 —— 原来是整块 `display:none`，
  所以「去掉 Recent sessions」时把它们一起藏了。现在整块显示，只靠 JS 种默认视图。

**本主题的做法**：CSS 不再隐藏 `.absolute.top-full`；默认视图由 `seedRecentView()` 种成
projects —— 注入的 JS 拿不到 `storageService`（`window.vscode` 只有 preload 对象），
只能模拟一次下拉选择：用完整指针事件序列点开标题行（见「坑 17」），然后**每 50ms 轮询**
portal 里文字为 `Projects` 的叶子 span，一出现就点它的**父节点**（onClick 挂在那儿）。
用轮询而不是等固定时长，是为了让菜单露在外面的时间尽量短。

> 只种一次：成功后写 `localStorage['devin-ui.recent-view-seeded']`。
> 之后用户手动切回 Sessions 不会再被改回去（实测：切回 sessions → 硬重载 → 仍是 sessions）。
> 下拉没打开时最多重试 3 次，避免反复弹菜单。

验证：`node tools/cdp.mjs evalfile "Devin" snippets/verify-welcome.js`
（`"Devin"` = 无文件夹的窗口标题；多窗口时别用 `workbench.html`，只命中第一个）。

### custom-ui-style 的更新链路（实测 0.7.2 / macOS）

扩展**不是**实时读 `~/.devin/devin-ui.js`，而是把它**烘焙**进应用目录里的生成文件：

```
out/vs/code/electron-browser/workbench/
  workbench.html                 ← 被打上 <!-- External Style/Script --> 标记
  external.css                   ← imports 里 .css 的内容
  external.js                    ← .js 的内容
  external.module.js             ← 我们的 devin-ui.js 在这（被判定成 module）
  workbench.custom-ui-style.html ← 原始 html 备份
```

`workbench.html` 里的注入点：

```html
<link rel="stylesheet" href="./external.css"></link>
<script src="./external.js"></script>
<script src="./external.module.js" type="module"></script>
```

> **修正早前记录**：以前写过「改完 `devin-ui.js` 不用手动 Reload，样式会自己更新」——
> 那是错的（至少 0.7.2 / macOS 上不成立）。实测多次 `location.reload()` 之后
> `external.module.js` 的 mtime 仍是手工写入的时间，说明扩展只在**激活时**和
> `Custom UI Style: Reload` 命令里跑 `patch()`。

所以：

- 改完 `~/.devin/devin-ui.js` 必须执行一次 `Custom UI Style: Reload`（或重启 Devin）才生效。
- 调试时不想敲命令面板，用两步法（省一次重启）：
  ```bash
  # 1) 手动烘焙：模拟扩展的 patch（保留它写的 // <源文件路径> 头）
  { printf '// %s\n' "$HOME/.devin/devin-ui.js"; cat "$HOME/.devin/devin-ui.js"; } \
    > "/Applications/Devin.app/Contents/Resources/app/out/vs/code/electron-browser/workbench/external.module.js"
  # 2) 硬重载
  node tools/cdp.mjs reload "Devin"
  ```
- **`location.reload()` 不够**：渲染进程会缓存 `external.module.js`，新脚本读不到。
  必须 `Page.reload({ignoreCache:true})`，也就是 `tools/cdp.mjs reload <target>`。
- 交付给别人的路径不变，还是 `Custom UI Style: Reload`。

## 待办

- [ ] 用户执行 `Custom UI Style: Reload` 让 `external.imports` 生效（此后才持久化）
- [ ] 用户确认 Cursor 排版复刻效果，可能需要微调字号/字重
- [ ] 调试结束后删除 `argv.json` 里的 `remote-debugging-port`（端口对本机所有进程开放）
