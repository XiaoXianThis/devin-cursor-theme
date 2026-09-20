# devin-cursor-theme

把 Devin Desktop 的界面改造成 Cursor 的样子。

![效果对比](docs/screenshot.png)

> 图左与图中是改造后的 Devin Desktop，图右是 Cursor 作对照。

这不是独立应用，交付物是注入进 Devin workbench 的 CSS / JS。
全部样式与行为集中在单文件 `devin-ui.js`，不含任何机器相关路径，可直接复制给别人用。

## 改了什么

**界面外壳**

- 菜单栏直接居左（原生布局里标题栏被挤在侧边栏右侧）
- 活动栏从左侧竖排移到顶部横排，默认只显示 4 个图标，其余点击箭头展开
- 去掉左上角的 agent/editor 切换区
- 去掉菜单、列表项、消息标签页上的蓝色描边
- 去掉空消息状态下的背景纹理
- 去掉侧边栏的 "Explorer" 标题栏

**聊天区**（数值全部取自 Cursor 的计算样式，不是目测）

- 输入框：圆角 12px、`padding 8px 10px 6px`、控制行按钮高 20px、按钮内图标 16px
- 变更条与输入框拼成一个描边盒子，变更条左右各内缩 9px、只圆上角
- 思考区用 `opacity: 0.5` 暗化（暗化来自 opacity，不是文字色）
- 用户气泡、工具卡片、diff 行、行内代码、列表、表格

## 环境

| 项 | 值 |
|---|---|
| 应用 | Devin 1.126.0 / Windsurf 3.10.31（Electron 42，Chrome 148） |
| 注入扩展 | `subframe7536.custom-ui-style` |
| 交付物 | `devin-ui.js` |

## 安装

1. 在 Devin Desktop 里安装扩展 `subframe7536.custom-ui-style`
2. 把 `devin-ui.js` 放到 `~/.devin/`
3. 用户 `settings.json` 加两行：

```json
"workbench.activityBar.location": "top",
"custom-ui-style.external.imports": ["file://${userHome}/.devin/devin-ui.js"]
```

4. 命令面板执行 `Custom UI Style: Reload`

`${userHome}` 是扩展支持的变量，Windows / macOS / Linux 通用。

> 注意：`custom-ui-style.watch` 的说明是 *"Automatically reload window on configuration
> changes (ignores imports)"* —— 改动 `external.imports` **不会**自动生效，必须手动 Reload。

## 目录

```
devin-ui.js         交付物：全部 CSS + 脚本
docs/               展示截图
AGENTS.md           开发笔记：环境事实、选择器坑、Cursor 实测值、需求状态
tools/              调试工具链
snippets/           一次性 DOM 探针与验证脚本
shots/              调试过程截图（未入库）
```

## 调试工具链

界面本身是 workbench 主文档，不是 webview，所以可以用 CDP 直接调试。
在 `~/.devin/argv.json` 里加 `"remote-debugging-port": "9222"`（**必须是字符串**）后重启：

```powershell
curl.exe -s http://127.0.0.1:9222/json/version
node tools/cdp.mjs list                                  # 列出 target
node tools/cdp.mjs evalfile workbench.html snippets/parts.js
node tools/cdp.mjs shot workbench.html out.png
```

| 工具 | 用途 |
|---|---|
| `tools/cdp.mjs` | 零依赖 CDP 客户端（基于 node 原生 WebSocket） |
| `tools/big-grep.mjs` | 大文件正则搜索（绕过常规 grep 的 4MB 限制） |
| `tools/extract-css.mjs` | 从 CSS 提取类名 / 变量定义 / 规则块 |
| `tools/list-settings.mjs` | 列出扩展 `package.json` 的所有配置项 |
| `tools/read-storage.mjs` | 用 `node:sqlite` 读 VS Code 的 `state.vscdb` |
| `tools/patch-cursor-main.mjs` | 给 Cursor 主进程打补丁以开启 CDP 端口（用于对照它的样式） |

## 几个容易踩的坑

- **id 里带点**。应用大量使用 `windsurf.cascadePanel`、`workbench.parts.titlebar` 这类
  **字面量 id**，所以 `#windsurf`、`.cascadePanel` 都选不中，必须写 `[id="..."]`。
- **CSS 必须 `!important`**。`external.css` 在 `workbench.desktop.main.css` **之前**加载。
- **Tailwind 的具名 group** 是 `group/beard-band`，CSS 里要转义成 `.group\/beard-band`。
- **CSP 禁 `innerHTML`**。workbench 的 CSP 含 `require-trusted-types-for 'script'`，
  注入的 JS 里给 `innerHTML` 赋值会抛 `TrustedHTML` 错误，必须用 `createElement` 构建 DOM。
- **VS Code 用 JS 写内联尺寸**。隐藏一个元素后，父容器的高度不会自动重算，
  要**逐层**把尺寸补回来（侧边栏 → `.content` → 面板，三层各有各的内联尺寸）。
- **调试结束后**删掉 `argv.json` 里的 `remote-debugging-port` —— 该端口对本机所有进程开放。

更多细节见 [AGENTS.md](AGENTS.md)。
