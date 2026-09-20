// 测试 custom-ui-style 的 ${userHome} 变量在 Windows 下能否被 fileURLToPath 正确解析
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const home = os.homedir();
console.log('homedir =', JSON.stringify(home));
console.log('');

// 模拟扩展的 Ar(): 把 ${userHome} 替换成 os.homedir()
const Ar = (s) => s.replace(/\$\{([^{}]+)\}/g, (m, k) => (k === 'userHome' ? home : m));

const raw = [
  'file://${userHome}/.devin/devin-ui.js',
  'file:///${userHome}/.devin/devin-ui.js',
  'file:///${env:USERPROFILE}/.devin/devin-ui.js',
];

for (const r of raw) {
  const expanded = Ar(r);
  let result;
  try {
    result = fileURLToPath(expanded);
  } catch (e) {
    result = 'FAIL: ' + e.message;
  }
  console.log(`模板    : ${r}`);
  console.log(`展开后  : ${JSON.stringify(expanded)}`);
  console.log(`解析结果: ${result}`);
  console.log('');
}
