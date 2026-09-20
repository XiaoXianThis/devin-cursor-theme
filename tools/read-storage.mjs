// 读取 Devin 工作区存储里的键值（SQLite: state.vscdb）
// 用法: node tools/read-storage.mjs <state.vscdb 路径> [键名前缀过滤]

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

const [dbPath, filter] = process.argv.slice(2);
if (!dbPath) {
  console.error('usage: node tools/read-storage.mjs <state.vscdb> [keyFilter]');
  process.exit(1);
}
if (!existsSync(dbPath)) {
  console.error(`文件不存在: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`表: ${tables.map((t) => t.name).join(', ')}\n`);

  const rows = db.prepare('SELECT key, value FROM ItemTable').all();
  const re = filter ? new RegExp(filter, 'i') : null;
  let n = 0;
  for (const r of rows) {
    if (re && !re.test(r.key)) continue;
    n++;
    let v = r.value;
    if (v instanceof Uint8Array) {
      const s = Buffer.from(v).toString('utf8');
      v = s.replace(/[^\x20-\x7e\u4e00-\u9fff]/g, '.').slice(0, 200);
    }
    console.log(`${r.key} = ${v}`);
  }
  console.log(`\nItemTable 共 ${rows.length} 行，匹配 ${n} 行`);
} finally {
  db.close();
}
