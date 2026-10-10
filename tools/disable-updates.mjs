// 关闭 Devin Desktop 的自动更新：往用户 settings.json 写入 "update.mode": "none"
//
// 背景：Devin Desktop 是 VS Code fork，更新器在启动时读 update.mode。
//       值为 "none" 时 getProductQuality() 返回 undefined，更新服务直接进入 Disabled 状态
//       （out/main.js 日志：update#ctor - updates are disabled by user preference）。
//       本项目依赖 custom-ui-style 扩展 patch 过的 workbench.desktop.main.css 与 product.json，
//       应用升级会覆盖这些文件导致主题失效，所以要关掉自动更新。
//
// 注意：update.mode 是 machine 作用域，只能写在用户 settings.json，
//       写进 .vscode/settings.json 之类的工作区设置会被忽略。
//
// 用法: node tools/disable-updates.mjs            # 禁用（写入 update.mode: none）
//       node tools/disable-updates.mjs --revert   # 还原（删除该键）
//       node tools/disable-updates.mjs --print    # 只看当前值和文件路径
//       node tools/disable-updates.mjs <settings.json 路径>   # 覆盖自动探测的路径
//
// 文本级编辑，保留原有注释与排版；改完需要重启 Devin Desktop 生效。

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const KEY = 'update.mode';
const VALUE = 'none';

function defaultSettingsPath() {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Devin', 'User', 'settings.json');
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'Devin', 'User', 'settings.json');
  }
  return join(homedir(), '.config', 'Devin', 'User', 'settings.json');
}

function readValue(text) {
  const m = new RegExp(`"${KEY}"\\s*:\\s*"([^"]*)"`).exec(text);
  return m ? m[1] : null;
}

// 已存在则改值，否则插到最外层 { 之后（新键放最前面，不和已有内容纠缠）
function setValue(text) {
  if (new RegExp(`"${KEY}"\\s*:\\s*"[^"]*"`).test(text)) {
    return text.replace(new RegExp(`("${KEY}"\\s*:\\s*)"[^"]*"`), `$1"${VALUE}"`);
  }
  const brace = text.indexOf('{');
  if (brace < 0) throw new Error('settings.json 里找不到最外层 {');
  const rest = text.slice(brace + 1);
  if (/^\s*\}/.test(rest)) {
    return text.slice(0, brace + 1) + `\n    "${KEY}": "${VALUE}"\n` + rest;
  }
  return text.slice(0, brace + 1) + `\n    "${KEY}": "${VALUE}",` + rest;
}

// 删键：整行一起删（含本行缩进和它前面的换行），逗号只删一个 ——
// 后面还有键就删本键后面的逗号，本键是最后一个才删前面的逗号，避免删出双逗号或残留逗号。
function removeValue(text) {
  const m = new RegExp(`"${KEY}"\\s*:\\s*"[^"]*"`).exec(text);
  if (!m) return text;
  let start = m.index;
  let end = m.index + m[0].length;

  let j = end;
  while (j < text.length && /[ \t]/.test(text[j])) j++;
  const hasTrailingComma = text[j] === ',';

  let i = start;
  while (i > 0 && /[ \t]/.test(text[i - 1])) i--;
  if (text[i - 1] === '\n') i--;

  if (hasTrailingComma) {
    end = j + 1;
  } else if (text[i - 1] === ',') {
    i--;
  }
  start = i;

  return text.slice(0, start) + text.slice(end);
}

const args = process.argv.slice(2);
const revert = args.includes('--revert');
const printOnly = args.includes('--print');
const pathArg = args.find((a) => !a.startsWith('--'));
const file = pathArg ?? defaultSettingsPath();

console.log(`设置文件: ${file}`);
if (!existsSync(file)) {
  console.error('文件不存在。先启动一次 Devin Desktop，或手动传入 settings.json 路径。');
  process.exit(1);
}

const original = readFileSync(file, 'utf8');
const before = readValue(original);
console.log(`当前 ${KEY} = ${before === null ? '(未设置，默认 "default" 即自动更新)' : `"${before}"`}`);

if (printOnly) process.exit(0);

const updated = revert ? removeValue(original) : setValue(original);

if (updated === original) {
  console.log(revert ? '未设置该键，无需还原' : `已是 "${VALUE}"，无需改动`);
  process.exit(0);
}

writeFileSync(file, updated, 'utf8');

const after = readValue(updated);
console.log(revert ? `已删除 ${KEY}` : `已写入 ${KEY} = "${after}"`);
console.log('重启 Devin Desktop 生效（更新服务在启动时读取该值）。');
