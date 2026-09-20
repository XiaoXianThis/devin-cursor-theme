# DeepSeek Harness

本机 Devin Desktop 的 UI 改造工作区。目标是把界面改成更接近 Cursor 的样子：精简输入框、去掉多余区块、活动栏顶部横排、菜单居左、默认 editor 模式。

这不是独立应用。交付物是注入进 Devin workbench 的 CSS / JS，外加一套 CDP 调试工具。

## 环境

| 项 | 值 |
|---|---|
| 应用 | Devin 1.126.0 / Windsurf 3.10.31 |
| 注入扩展 | `subframe7536.custom-ui-style@0.7.1` |
| 交付物 | `devin-ui.js`（单文件：全部 CSS + 脚本，无机器相关路径，可直接分享） |
| CDP 端口 | `9222`（`~/.devin/argv.json`） |

## 用法

改完 CSS 后，在 Devin 里执行 `Custom UI Style: Reload`（改 `external.imports` 不会自动生效）。

调试界面：

```powershell
curl.exe -s http://127.0.0.1:9222/json/version
node tools/cdp.mjs shot workbench.html out.png
node tools/cdp.mjs evalfile workbench.html snippets/parts.js
```

## 目录

```
devin-ui.js         交付物：全部 CSS + 脚本（CSS 必须 !important）
AGENTS.md           环境事实、选择器坑、Cursor token 表、需求状态
tools/              CDP / 大文件搜索 / CSS 提取 / 读工作区存储
snippets/           一次性 DOM 探针与验证脚本
shots/              调试截图
```

## 移植到别的机器

`devin-ui.js` 不含任何机器相关路径。对方需要：

1. 装扩展 `subframe7536.custom-ui-style`
2. 把 `devin-ui.js` 放到 `~/.devin/`
3. `settings.json` 加两行：

```json
"workbench.activityBar.location": "top",
"custom-ui-style.external.imports": ["file://${userHome}/.devin/devin-ui.js"]
```

4. 命令面板执行 `Custom UI Style: Reload`

`${userHome}` 是扩展支持的变量，Windows / macOS / Linux 通用。

## 注意

- id 带点（如 `windsurf.cascadePanel`），选择器必须写成 `[id="..."]`
- 不要用 PowerShell 读 UTF-8 CSS，中文注释会乱码并吞掉 `*/`
- Tailwind 的 `group/beard-band` 在 CSS 里要写成 `.group\/beard-band`
- 调试结束后删掉 `argv.json` 里的 `remote-debugging-port`
