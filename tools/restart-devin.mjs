// 重启 Devin Desktop，并等待 CDP 端口就绪。
//
// 为什么需要这个工具：调试时经常改完 ~/.devin/argv.json 或 settings.json 要重启 Devin，
// 而 agent 自己就跑在 Devin 里（shell 的父进程是 Devin 拉起的 `devin acp`），
// 直接 osascript quit 会把重启动作本身一起杀掉 —— 端口永远等不到。
//
// 所以重启逻辑跑在一个**脱离进程树**的 worker 里：
// spawn(node, [__filename, '--worker', ...], { detached: true }) + unref()，
// detached 在 POSIX 上等于 setsid()，worker 自成会话/进程组，不受父进程组的信号影响，
// 父进程退出后被 launchd/init 收养，照常把 Devin 拉回来。
//
// 坑：不要用 `launchctl submit` 做这件事。launchctl 会在 job 退出后自动重跑它
//     （受 10s respawn 节流限制），脚本耗时超过 10s 就会变成每 ~21s 杀一次 Devin 的死循环。
//     实测：`launchctl submit -l x -- bash -c 'echo hi >> f'` 26 秒内写了 3 行。
//
// 用法: node tools/restart-devin.mjs                # 5s 后重启，最多等 90s 端口就绪
//       node tools/restart-devin.mjs --delay 20     # 20s 后动手（留时间保存编辑器）
//       node tools/restart-devin.mjs --wait 0       # 不等端口，重启完就退出
//       node tools/restart-devin.mjs --dry-run      # 只打印将要执行的动作
//       node tools/restart-devin.mjs --log <file>   # 换日志文件（默认系统临时目录）

import { spawn, execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const DEFAULT_LOG = join(tmpdir(), 'devin-restart.log');

const MAC_APP = '/Applications/Devin.app';
const MAC_BIN = `${MAC_APP}/Contents/MacOS/Devin`;

function parseArgs(argv) {
  const get = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  return {
    worker: argv.includes('--worker'),
    dryRun: argv.includes('--dry-run'),
    delay: Number(get('--delay', 5)),
    wait: Number(get('--wait', 90)),
    port: get('--port', '9222'),
    log: get('--log', DEFAULT_LOG),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRunning() {
  try {
    if (process.platform === 'darwin') {
      execFileSync('pgrep', ['-f', MAC_BIN], { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      // tasklist 对不存在的进程也返回 0，得看输出里有没有 Devin.exe
      const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Devin.exe', '/NH'], { encoding: 'utf8' });
      if (!/Devin\.exe/i.test(out)) throw new Error('not running');
    } else {
      execFileSync('pgrep', ['-f', 'Devin'], { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

// 取正在运行的 Devin 可执行文件路径（Windows 上安装位置因人而异，从进程里问最稳）
function windowsExePath() {
  const out = execFileSync(
    'powershell',
    ['-NoProfile', '-Command', '(Get-Process Devin -ErrorAction SilentlyContinue | Select-Object -First 1).Path'],
    { encoding: 'utf8' },
  ).trim();
  return out || null;
}

async function runWorker({ delay, wait, port, log, dryRun }) {
  const say = (msg) => {
    appendFileSync(log, `${msg}\n`);
    if (dryRun) console.log(msg);
  };

  say(`=== restart ${new Date().toISOString()} ===`);
  say(`-> 等 ${delay}s 后动手（留时间保存编辑器）`);
  await sleep(delay * 1000);

  if (dryRun) {
    say(`-> [dry-run] 退出 Devin（${process.platform === 'darwin' ? 'osascript quit app "Devin"' : 'taskkill /IM Devin.exe'}）`);
    say('-> [dry-run] 重新启动');
    say('-> [dry-run] 等待端口就绪');
    say('=== dry-run done ===');
    return;
  }

  if (process.platform === 'darwin') {
    say('-> 请求优雅退出');
    try {
      execFileSync('osascript', ['-e', 'quit app "Devin"'], { stdio: 'ignore' });
    } catch {
      /* 已经在退出或没有 GUI 会话 */
    }
  } else if (process.platform === 'win32') {
    say('-> 请求优雅退出');
    try {
      execFileSync('taskkill', ['/IM', 'Devin.exe'], { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
  } else {
    say('! Linux 未实现自动重启，请手动重启后重新运行（只做等待）');
  }

  for (let i = 0; i < 45 && isRunning(); i++) await sleep(1000);

  if (isRunning()) {
    say('-> 优雅退出超时（可能有对话框拦着），强制结束');
    try {
      if (process.platform === 'darwin') execFileSync('pkill', ['-f', MAC_BIN], { stdio: 'ignore' });
      else if (process.platform === 'win32') execFileSync('taskkill', ['/F', '/IM', 'Devin.exe'], { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
    await sleep(5 * 1000);
  }
  say('-> 已退出');

  await sleep(2 * 1000);
  say('-> 重新启动');
  if (process.platform === 'darwin') {
    execFileSync('open', ['-a', 'Devin'], { stdio: 'ignore' });
  } else if (process.platform === 'win32') {
    const exe = windowsExePath();
    if (!exe) {
      say('! 找不到 Devin.exe 路径，请手动启动');
      return;
    }
    spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();
  }

  const url = `http://127.0.0.1:${port}/json/version`;
  for (let i = 1; i <= wait; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const v = await res.json();
        say(`-> CDP 就绪（${i}s）${v.Browser ?? ''}`);
        say('=== done ===');
        return;
      }
    } catch {
      /* 还没起来 */
    }
    await sleep(1000);
  }
  say(`-> ${wait}s 内 ${url} 未就绪（argv.json 里的 remote-debugging-port 还在吗？）`);
  say('=== failed ===');
}

const opts = parseArgs(process.argv.slice(2));

if (opts.worker) {
  await runWorker(opts);
} else {
  // 主进程只负责把 worker 扔出去，然后立刻返回
  const child = spawn(process.execPath, [SELF, '--worker', '--delay', String(opts.delay), '--wait', String(opts.wait), '--port', opts.port, '--log', opts.log, ...(opts.dryRun ? ['--dry-run'] : [])], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  console.log(`worker pid ${child.pid}（已脱离当前进程树，setsid）`);
  console.log(`日志: ${opts.log}`);
  console.log(`Devin 将在 ${opts.delay}s 后重启${opts.dryRun ? '（dry-run）' : ''}。本会话会被中断。`);
  if (existsSync(opts.log) && !opts.dryRun) console.log('（同一个日志文件会被追加，注意别混淆新旧记录）');
}
