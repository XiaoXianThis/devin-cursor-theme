// 查清除纹理外还有哪个元素被同一选择器命中
(() => {
  const panel = document.querySelector('[id="windsurf.cascadePanel"]');
  const hits = Array.from(panel.querySelectorAll('div[class*="pointer-events-none"][class*="left-1/2"]'));
  return hits
    .map((el, i) => {
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      const kids = Array.from(el.children).map(
        (k) => `${k.tagName.toLowerCase()}${k.getBoundingClientRect().width > 200 ? '(大)' : ''}`,
      );
      return [
        `[${i}] class="${(typeof el.className === 'string' ? el.className : '').slice(0, 110)}"`,
        `    display=${c.display} rect=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
        `    子元素: ${kids.join(', ') || '(无)'}`,
        `    文本: "${(el.textContent || '').trim().slice(0, 40)}"`,
      ].join('\n');
    })
    .join('\n---\n') || '(无命中)';
})();
