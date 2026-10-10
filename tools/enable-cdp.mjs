// 开启 Devin Desktop 的 CDP 调试端口：往 ~/.devin/argv.json 写入 "remote-debugging-port"
//
// 背景：Devin Desktop 是 VS Code fork，argv.json 只接受白名单内的参数。
//       Devin 的 out/main.js 里白名单为
//         ["disable-hardware-acceleration","force-color-profile","disable-lcd-text",
//          "proxy-bypass-list","remote-debugging-port"]
//       已经包含 remote-debugging-port，所以**不需要像 Cursor 那样打补丁**，直接写即可。
//       值为字符串时才走 commandLine.appendSwitch（源码里 typeof u=="string"）。
//
// 安全提示：该端口对本机所有进程开放，调试完请 --revert 关掉。
//
// 用法: node tools/enable-cdp.mjs              # 开启（默认 9222）
//       node tools/enable-cdp.mjs 9223         # 指定端口
//       node tools/enable-cdp.mjs --revert     # 还原（删除该键）
//       node tools/enable-cdp.mjs --print      # 只看当前值和文件路径
//
// 文本级编辑，保留原有注释与排版；改完需要重启 Devin Desktop 生效。

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const KEY = 'remote-debugging-port';

// 配置目录（dataFolderName = .devin）在三个平台都落在用户主目录下
function defaultArgvPath() {
  return join(homedir(), '.devin', 'argv.json');
}

function readValue(text) {
  const m = new RegExp(`"${KEY}"\\s*:\\s*"([^"]*)"`).exec(text);
  return m ? m[1] : null;
}

// 已存在则改值，否则插到最外层 { 之后（新键放最前面，不和已有内容纠缠）
function setValue(text, value) {
  if (new RegExp(`"${KEY}"\\s*:\\s*"[^"]*"`).test(text)) {
    return text.replace(new RegExp(`("${KEY}"\\s*:\\s*)"[^"]*"`), `$1"${value}"`);
  }
  const brace = text.indexOf('{');
  if (brace < 0) throw new Error('argv.json 里找不到最外层 {');
  const rest = text.slice(brace + 1);
  if (/^\s*\}/.test(rest)) {
    return text.slice(0, brace + 1) + `\n\t"${KEY}": "${value}"\n` + rest;
  }
  return text.slice(0, brace + 1) + `\n\t"${KEY}": "${value}",` + rest;
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
const positional = args.filter((a) => !a.startsWith('--'));
const port = positional[0] ?? '9222';
const file = process.env.ARGV_JSON ?? defaultArgvPath();

console.log(`argv.json: ${file}`);
if (!existsSync(file)) {
  console.error('文件不存在。先启动一次 Devin Desktop，或设 ARGV_JSON 环境变量指定路径。');
  process.exit(1);
}

const original = readFileSync(file, 'utf8');
const before = readValue(original);
console.log(`当前 ${KEY} = ${before === null ? '(未设置，CDP 端口关闭)' : `"${before}"`}`);

if (printOnly) process.exit(0);

const updated = revert ? removeValue(original) : setValue(original, port);

if (updated === original) {
  console.log(revert ? '未设置该键，无需还原' : `已是 "${port}"，无需改动`);
  process.exit(0);
}

// 首次改动前留一份备份（--revert 也用它还原不了注释以外的内容，纯粹保险）
const backup = `${file}.bak`;
if (!existsSync(backup)) {
  copyFileSync(file, backup);
  console.log(`已备份原文件 -> ${backup}`);
}

writeFileSync(file, updated, 'utf8');

const after = readValue(updated);
console.log(revert ? `已删除 ${KEY}` : `已写入 ${KEY} = "${after}"`);
console.log('重启 Devin Desktop 生效。连上后: node tools/cdp.mjs list');
