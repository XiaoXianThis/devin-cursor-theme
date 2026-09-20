// 列出 Devin 输入框底部控制行所有按钮的完整类名与尺寸
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const band = panel && panel.querySelector('.group\\/beard-band');
  if (!band) return '未找到 beard-band';
  const row = band.querySelector('div.cursor-text.border .flex.flex-wrap.items-center');
  if (!row) return '未找到控制行';

  const out = [`控制行 ${Math.round(row.getBoundingClientRect().width)}x${Math.round(row.getBoundingClientRect().height)}`];
  Array.from(row.querySelectorAll('button')).forEach((b, i) => {
    const r = b.getBoundingClientRect();
    const c = getComputedStyle(b);
    out.push(`\n[${i}] ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)}  title="${b.getAttribute('aria-label') ?? b.title ?? ''}" text="${(b.textContent || '').trim().slice(0, 18)}"`);
    out.push(`    h=${c.height} w=${c.width} minH=${c.minHeight} r=${c.borderRadius} pad=${c.padding} fs=${c.fontSize} bg=${c.backgroundColor}`);
    out.push(`    class="${b.className}"`);
    out.push(`    子: ${Array.from(b.children).map((k) => k.tagName.toLowerCase()).join(', ')}`);
  });
  return out.join('\n');
})();
