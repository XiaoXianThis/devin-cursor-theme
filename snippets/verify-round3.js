// 验证第 13 段
(() => {
  const out = [];
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到面板';

  out.push('=== 1) 思考区 ===');
  const rail = panel.querySelector('.group\\/collapse-bar');
  out.push(`  collapse-bar: ${rail ? 'display=' + getComputedStyle(rail).display : '不存在'}`);
  const hw = panel.querySelector('.highlight-wrapper');
  if (hw) {
    const c = getComputedStyle(hw);
    out.push(`  highlight-wrapper color=${c.color}`);
    const nested = hw.querySelector('[class*="chat-collapse-rail-width"]');
    if (nested) {
      const nc = getComputedStyle(nested);
      out.push(`  rail-width=${nc.getPropertyValue('--chat-collapse-rail-width')} content-gap=${nc.getPropertyValue('--chat-collapse-content-gap')}`);
      const inner = nested.querySelector('.flex.min-w-0.flex-col');
      if (inner) {
        const ir = inner.getBoundingClientRect();
        const hr = hw.getBoundingClientRect();
        out.push(`  正文左边距 = ${Math.round(ir.x - hr.x)}px (原 24px)`);
      }
    }
  }

  out.push('\n=== 2) 文件变更条 ===');
  const bars = Array.from(panel.querySelectorAll('div[class*="bottom-full"]')).filter((b) => b.getBoundingClientRect().height > 0);
  out.push(`  可见条: ${bars.length}`);
  if (bars.length) {
    const row = bars[0].querySelector('.flex.min-w-0.flex-col.gap-1');
    if (row) {
      const c = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      out.push(`  内容行: bg=${c.backgroundColor} radius=${c.borderRadius} margin=${c.margin} h=${Math.round(r.height)} w=${Math.round(r.width)}`);
    }
    const barR = bars[0].getBoundingClientRect();
    out.push(`  整条高度=${Math.round(barR.height)}px 宽=${Math.round(barR.width)}px`);
    const inputBox = panel.querySelector('div.cursor-text.border');
    if (inputBox) out.push(`  输入框宽=${Math.round(inputBox.getBoundingClientRect().width)}px`);
  }

  out.push('\n=== 3) 侧边栏图标行 ===');
  const container = document.querySelector('[id="workbench.parts.sidebar"] .composite-bar-container');
  if (container) {
    const c = getComputedStyle(container);
    const cr = container.getBoundingClientRect();
    const bar = container.querySelector('.composite-bar');
    const br = bar ? bar.getBoundingClientRect() : null;
    out.push(`  容器 justify=${c.justifyContent} 宽=${Math.round(cr.width)}`);
    if (br) out.push(`  图标行 x=${Math.round(br.x)} 宽=${Math.round(br.width)}  左侧余量=${Math.round(br.x - cr.x)} 右侧余量=${Math.round(cr.right - br.right)}`);
  }

  out.push('\n=== 4) 下拉箭头 ===');
  const chevrons = document.querySelectorAll('.devin-chevron');
  out.push(`  .devin-chevron 数量: ${chevrons.length}`);
  for (const ch of chevrons) {
    const host = ch.parentElement;
    const hr = host.getBoundingClientRect();
    const cr = ch.getBoundingClientRect();
    out.push(
      `  - 宿主 "${(host.textContent || '').trim().slice(0, 18)}" 宽=${Math.round(hr.width)} 箭头在宿主内 x偏移=${Math.round(cr.x - hr.x)}`,
    );
  }
  out.push(`  data-devin-perm: ${document.querySelectorAll('[data-devin-perm]').length}  data-devin-model: ${document.querySelectorAll('[data-devin-model]').length}`);
  return out.join('\n');
})();
