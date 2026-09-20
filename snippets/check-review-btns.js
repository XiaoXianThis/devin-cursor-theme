// 检查 accept/reject/quick review 按钮的标记情况
(() => {
  const out = [];
  out.push('=== 带 data-devin-review-btn 的元素 ===');
  const marked = Array.from(document.querySelectorAll('[data-devin-review-btn]'));
  out.push(`  数量: ${marked.length}`);
  for (const el of marked) {
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    out.push(`  - "${(el.textContent || '').trim().slice(0, 20)}" v=${el.getAttribute('data-devin-review-btn')} bg=${c.backgroundColor} radius=${c.borderRadius} [${Math.round(r.x)},${Math.round(r.y)}]`);
  }

  out.push('\n=== 面板内所有含 Accept/Reject/Review 的 button ===');
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  for (const b of panel.querySelectorAll('button')) {
    const t = (b.textContent || '').trim();
    if (!/accept|reject|review|undo/i.test(t)) continue;
    const r = b.getBoundingClientRect();
    const c = getComputedStyle(b);
    const inBand = !!b.closest('.group\\/beard-band');
    out.push(
      `  "${t.slice(0, 22)}" bg=${c.backgroundColor} r=${c.borderRadius} inBeardBand=${inBand} attrs=${b.getAttributeNames().filter((a) => a.startsWith('data-devin')).join(',') || '(无)'}`,
    );
    // 祖先链前 4 层
    let cur = b.parentElement;
    const chain = [];
    for (let i = 0; i < 4 && cur; i++) {
      chain.push(`${cur.tagName.toLowerCase()}.${(typeof cur.className === 'string' ? cur.className : '').split(/\s+/).slice(0, 2).join('.')}`);
      cur = cur.parentElement;
    }
    out.push(`      祖先: ${chain.join(' < ')}`);
  }
  return out.join('\n');
})();
