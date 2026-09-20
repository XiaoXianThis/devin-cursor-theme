// 第三轮集中探查：思考区竖线 / 文件变更条结构 / 侧边栏图标行对齐
(() => {
  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 4).join('.') : ''}`;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
  };
  const cs = (el) => {
    const c = getComputedStyle(el);
    return `bg=${c.backgroundColor} bd=${c.borderLeftWidth}/${c.borderLeftColor} w=${c.width} fs=${c.fontSize} color=${c.color}`;
  };

  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  if (!panel) return '未找到聊天面板';

  // ---------- A. 思考区 ----------
  out.push('=== A. 思考区 ===');
  let expanded = Array.from(panel.querySelectorAll('.group\\/event-header')).filter((h) =>
    h.querySelector('button[aria-expanded="true"]'),
  );
  if (!expanded.length) {
    const headers = Array.from(panel.querySelectorAll('.group\\/event-header'));
    const near = headers.filter((h) => {
      const y = h.getBoundingClientRect().y;
      return y > -400 && y < 900;
    });
    const t = near[near.length - 1] ?? headers[headers.length - 1];
    if (t) (t.querySelector('button') ?? t).click();
    out.push('  (已点击展开，请重跑本脚本)');
  } else {
    const wrapper = expanded[expanded.length - 1].closest('.highlight-wrapper');
    const body = wrapper.children[1];
    out.push(`  wrapper: ${describe(wrapper)} ${rect(wrapper)}`);
    out.push(`  正文外层: ${describe(body)} ${rect(body)}`);
    // collapse-bar
    const rail = wrapper.querySelector('[class*="collapse-bar"]');
    if (rail) {
      out.push(`  collapse-bar: ${describe(rail)} ${rect(rail)}`);
      out.push(`    样式: ${cs(rail)}`);
      // 里面有什么（可能是竖线）
      Array.from(rail.children).forEach((c, i) => {
        out.push(`      子[${i}] ${describe(c)} ${rect(c)} ${cs(c)}`);
      });
      // 伪元素
      for (const pe of ['::before', '::after']) {
        const p = getComputedStyle(rail, pe);
        out.push(`      ${pe}: content="${p.content}" bg=${p.backgroundColor} w=${p.width} h=${p.height} bd=${p.borderLeftWidth}/${p.borderLeftColor}`);
      }
    } else {
      out.push('  未找到 collapse-bar');
    }
    // 缩进变量
    const nested = wrapper.querySelector('[class*="chat-child-nested-offset"]');
    if (nested) {
      const c = getComputedStyle(nested);
      out.push(`  nested 容器: ${describe(nested)} ${rect(nested)}`);
      out.push(`    --chat-collapse-rail-width = ${c.getPropertyValue('--chat-collapse-rail-width') || '(空)'}`);
      out.push(`    --chat-collapse-content-gap = ${c.getPropertyValue('--chat-collapse-content-gap') || '(空)'}`);
      out.push(`    --chat-nested-offset = ${c.getPropertyValue('--chat-nested-offset') || '(空)'}`);
      out.push(`    padding-left = ${c.paddingLeft}  margin-left = ${c.marginLeft}`);
    }
  }

  // ---------- B. 文件变更条 ----------
  out.push('\n=== B. 文件变更条 ===');
  const bars = Array.from(panel.querySelectorAll('div[class*="bottom-full"]')).filter((b) => {
    const r = b.getBoundingClientRect();
    return r.height > 0;
  });
  out.push(`  可见的条: ${bars.length}`);
  if (bars.length) {
    const walk = (el, d) => {
      if (d > 5) return;
      const r = el.getBoundingClientRect();
      out.push(`${'  '.repeat(d + 1)}${describe(el)} ${rect(el)} ${cs(el)}`);
      for (const c of el.children) walk(c, d + 1);
    };
    walk(bars[0], 0);
  }

  // ---------- C. 侧边栏图标行 ----------
  out.push('\n=== C. 侧边栏图标行 ===');
  const container = document.querySelector('[id="workbench.parts.sidebar"] .composite-bar .actions-container');
  if (container) {
    const c = getComputedStyle(container);
    out.push(`  ${describe(container)} ${rect(container)}`);
    out.push(`    display=${c.display} justify=${c.justifyContent} align=${c.alignItems} padding=${c.padding} gap=${c.gap}`);
    const bar = container.closest('.composite-bar');
    const bc = getComputedStyle(bar);
    out.push(`  父 .composite-bar ${rect(bar)}: display=${bc.display} justify=${bc.justifyContent} padding=${bc.padding} width=${bc.width}`);
    const holder = bar.parentElement;
    out.push(`  爷 ${describe(holder)} ${rect(holder)}: display=${getComputedStyle(holder).display} justify=${getComputedStyle(holder).justifyContent} padding=${getComputedStyle(holder).padding}`);
  } else {
    out.push('  未找到');
  }
  return out.join('\n');
})();
