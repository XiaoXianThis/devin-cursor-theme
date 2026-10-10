// 给 Cursor 的 Electron 主进程打补丁：把 remote-debugging-port 加进 argv.json 白名单
// 背景：Cursor 的 CLI 参数解析器会拒绝 --remote-debugging-port（报 bad option），
//       而 argv.json 的白名单数组里又没有它，导致无法开启 CDP 端口。
// 安全前提：out/main.js 不在 product.json 的 checksums 列表里，改了不会触发完整性校验。
//
// 用法（macOS，main.js 属于 root，需要 sudo）:
//   sudo node tools/patch-cursor-main.mjs          # 打补丁
//   sudo node tools/patch-cursor-main.mjs --revert # 还原
// 可用 CURSOR_APP 指定其他 .app 路径，默认 /Applications/Cursor.app

import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const APP = process.env.CURSOR_APP ?? '/Applications/Cursor.app';
const FILE = join(APP, 'Contents/Resources/app/out/main.js');
const BACKUP = FILE + '.devin-backup';

const FROM =
  '["disable-hardware-acceleration","force-color-profile","disable-lcd-text","proxy-bypass-list"]';
const TO =
  '["disable-hardware-acceleration","force-color-profile","disable-lcd-text","proxy-bypass-list","remote-debugging-port"]';

if (process.argv.includes('--revert')) {
  if (!existsSync(BACKUP)) {
    console.log('没有备份文件，无需还原');
    process.exit(0);
  }
  copyFileSync(BACKUP, FILE);
  unlinkSync(BACKUP);
  console.log(`已从备份还原 ${FILE}`);
  process.exit(0);
}

const src = readFileSync(FILE, 'utf8');

if (src.includes(TO)) {
  console.log('已经是打过补丁的状态');
  process.exit(0);
}

const count = src.split(FROM).length - 1;
console.log(`白名单数组出现次数: ${count}`);
if (count !== 1) {
  console.error('出现次数不为 1，为安全起见中止');
  process.exit(1);
}

if (!existsSync(BACKUP)) {
  copyFileSync(FILE, BACKUP);
  console.log(`已备份 -> ${BACKUP}`);
}

writeFileSync(FILE, src.replace(FROM, TO), 'utf8');
console.log('补丁写入完成');
