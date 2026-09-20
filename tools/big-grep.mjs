// 大文件搜索（绕过常规 grep 的 4MB 限制），按 UTF-8 读取并输出匹配上下文
// 用法: node tools/big-grep.mjs <文件> <正则> [上下文前后字符数]

import { readFileSync } from 'node:fs';

const [file, pattern, ctxArg] = process.argv.slice(2);
if (!file || !pattern) {
  console.error('usage: node tools/big-grep.mjs <file> <regex> [contextChars]');
  process.exit(1);
}

const ctx = Number(ctxArg ?? 120);
const text = readFileSync(file, 'utf8');
const re = new RegExp(pattern, 'g');

let m;
let count = 0;
const seen = new Set();
while ((m = re.exec(text)) !== null) {
  count++;
  const start = Math.max(0, m.index - ctx);
  const end = Math.min(text.length, m.index + m[0].length + ctx);
  const key = `${start}-${end}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const snippet = text.slice(start, end).replace(/\s+/g, ' ');
  const line = text.slice(0, m.index).split('\n').length;
  console.log(`--- 命中 #${count} (行 ${line}, 偏移 ${m.index}) ---`);
  console.log(snippet);
  if (seen.size >= 30) {
    console.log('... 已输出 30 条，停止');
    break;
  }
  if (m[0].length === 0) re.lastIndex++;
}

console.log(`\n共 ${count} 处匹配（${file}, ${(text.length / 1024 / 1024).toFixed(1)} MB）`);
