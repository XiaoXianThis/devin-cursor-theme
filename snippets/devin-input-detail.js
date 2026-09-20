// 量 Devin 输入框内部：padding / 文本字号 / 图标尺寸 / 间距
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const band = panel && panel.querySelector('.group\\/beard-band');
  if (!band) return '未找到 beard-band';
  const box = band.querySelector('div.cursor-text.border');
  if (!box) return '未找到输入框';

  const out = [];
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? ' .' + cls.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
  };
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  };
  const S = (el) => {
    const c = getComputedStyle(el);
    return `pad=${c.padding} gap=${c.gap} fs=${c.fontSize} lh=${c.lineHeight} color=${c.color} m=${c.margin}`;
  };

  out.push(`输入框 ${R(box)}  ${S(box)}`);
  out.push(`  子元素 ${box.children.length} 个:`);
  Array.from(box.children).forEach((c, i) => {
    out.push(`    [${i}] ${describe(c)} ${R(c)}  ${S(c)}`);
  });

  out.push('\n=== 文本区 ===');
  const ta = box.querySelector('.text-13, [class*="text-13"], [class*="text-14"]');
  if (ta) {
    out.push(`  ${describe(ta)} ${R(ta)}  ${S(ta)}`);
    const ph = ta.querySelector('[data-slate-placeholder]');
    if (ph) out.push(`  占位符 ${describe(ph)}  ${S(ph)}`);
    else out.push('  (无 data-slate-placeholder)');
  } else out.push('  未找到文本区');

  out.push('\n=== 控制行 ===');
  const row = box.querySelector('.flex.flex-wrap.items-center');
  if (row) {
    out.push(`  ${describe(row)} ${R(row)}  ${S(row)}`);
    const inner = row.firstElementChild;
    if (inner) out.push(`  内层 ${describe(inner)} ${R(inner)}  ${S(inner)}`);
  }

  out.push('\n=== 控制行按钮内 svg ===');
  const seen = new Set();
  for (const s of box.querySelectorAll('button svg')) {
    const r = s.getBoundingClientRect();
    if (r.width === 0) continue;
    const sig = `${Math.round(r.width)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(`  ${describe(s)} ${R(s)}`);
  }
  return out.join('\n');
})();
