// 从 CSS 文件里提取类名 / 自定义属性，按出现次数排序
// 用法:
//   node tools/extract-css.mjs <file.css> classes <正则>     # 提取匹配的类名
//   node tools/extract-css.mjs <file.css> vars  <正则>       # 提取 --xxx: value 定义
//   node tools/extract-css.mjs <file.css> rules <正则>       # 打印匹配的规则块

import { readFileSync } from 'node:fs';

const [file, mode, pattern] = process.argv.slice(2);
if (!file || !mode) {
  console.error('usage: node tools/extract-css.mjs <file.css> <classes|vars|rules> <regex>');
  process.exit(1);
}
const text = readFileSync(file, 'utf8');
const re = pattern ? new RegExp(pattern, 'gi') : null;

if (mode === 'classes') {
  const counts = new Map();
  for (const m of text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    const c = m[1];
    if (re && !new RegExp(pattern, 'i').test(c)) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`唯一类名 ${sorted.length} 个（按出现次数）:`);
  for (const [c, n] of sorted.slice(0, 200)) console.log(`  ${String(n).padStart(5)}  .${c}`);
} else if (mode === 'vars') {
  const counts = new Map();
  for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
    if (re && !new RegExp(pattern, 'i').test(m[1])) continue;
    const key = `${m[1]}: ${m[2].trim()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`唯一变量定义 ${sorted.length} 个:`);
  for (const [v, n] of sorted.slice(0, 150)) console.log(`  ${String(n).padStart(5)}  ${v}`);
} else if (mode === 'rules') {
  // 粗略按 } 切块，打印含匹配的块
  const blocks = text.split(/\}/);
  let n = 0;
  for (const b of blocks) {
    if (!re || !new RegExp(pattern, 'i').test(b)) continue;
    n++;
    console.log(`--- 规则 #${n} ---`);
    console.log(b.trim().slice(0, 800) + '}');
    if (n >= 40) {
      console.log('... 已输出 40 条');
      break;
    }
  }
  console.log(`\n共 ${n} 个匹配块`);
}
