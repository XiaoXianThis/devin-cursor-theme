// 列出某个扩展 package.json 中所有配置项 key（用于找 agent/editor 模式开关）
// 用法: node tools/list-settings.mjs <package.json 路径> [关键字过滤]

import { readFileSync } from 'node:fs';

const [file, filter] = process.argv.slice(2);
if (!file) {
  console.error('usage: node tools/list-settings.mjs <package.json> [filter]');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(file, 'utf8'));
const conf = pkg.contributes?.configuration;
const blocks = Array.isArray(conf) ? conf : conf ? [conf] : [];

const rows = [];
for (const block of blocks) {
  for (const [key, schema] of Object.entries(block.properties ?? {})) {
    rows.push({ key, type: schema.type, def: JSON.stringify(schema.default), desc: schema.description });
  }
}

const re = filter ? new RegExp(filter, 'i') : null;
for (const r of rows.filter((r) => !re || re.test(r.key) || re.test(r.desc ?? ''))) {
  console.log(`${r.key}  (${r.type}${r.def !== undefined ? `, default=${r.def}` : ''})`);
  if (r.desc) console.log(`    ${r.desc.slice(0, 150)}`);
}
console.log(`\n共 ${rows.length} 个配置项，匹配 ${rows.filter((r) => !re || re.test(r.key) || re.test(r.desc ?? '')).length} 个`);
