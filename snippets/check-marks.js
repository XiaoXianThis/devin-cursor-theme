// 检查 data-devin-* 标记落在哪些元素上
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const band = panel && panel.querySelector('.group\\/beard-band');
  if (!band) return '未找到 beard-band';
  const out = [];

  for (const attr of ['data-devin-perm', 'data-devin-model', 'data-devin-agent-switch', 'data-devin-add-context']) {
    const els = Array.from(band.querySelectorAll(`[${attr}]`));
    out.push(`\n${attr}: ${els.length} 个`);
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      out.push(`  [${i}] ${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)} text="${(el.textContent || '').trim().slice(0, 22)}"`);
      out.push(`       class="${(typeof el.className === 'string' ? el.className : '').slice(0, 70)}"`);
      const p = el.parentElement;
      out.push(`       父: ${p.tagName.toLowerCase()}.${(typeof p.className === 'string' ? p.className : '').slice(0, 60)}`);
    });
  }

  // 左组结构
  const left = band.querySelector('.text-text-secondary.flex.min-w-0.flex-1.items-center');
  out.push(`\n左组: ${left ? '找到' : '未找到'}`);
  if (left) {
    out.push(`  :scope > button -> ${left.querySelectorAll(':scope > button').length}`);
    out.push(`  :scope > div > button -> ${left.querySelectorAll(':scope > div > button').length}`);
    Array.from(left.children).forEach((c, i) => {
      out.push(`  [${i}] ${c.tagName.toLowerCase()}.${(typeof c.className === 'string' ? c.className : '').slice(0, 55)}  "${(c.textContent || '').trim().slice(0, 18)}"`);
    });
  }
  return out.join('\n');
})();
