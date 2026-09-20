// 排查注入的 CSS 是否生效、选择器是否命中
(() => {
  const out = [];
  const styleEl = document.getElementById('__devin_debug_css__');
  out.push(`注入的 style 元素存在: ${!!styleEl}`);
  if (styleEl) out.push(`内容: ${styleEl.textContent.trim().slice(0, 200)}`);

  const sel = '.chat-client-root .group\\/beard-band div.relative.flex.w-full.flex-col.overflow-x-clip';
  let hits = [];
  try {
    hits = Array.from(document.querySelectorAll(sel));
  } catch (e) {
    out.push(`选择器报错: ${e.message}`);
  }
  out.push(`\n选择器: ${sel}`);
  out.push(`命中: ${hits.length} 个`);
  hits.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push(`  [${i}] ${Math.round(r.y)}..${Math.round(r.y + r.height)}  display=${cs.display}  text="${(el.textContent || '').trim().slice(0, 40)}"`);
  });

  // 顺便确认 beard-band 的 class 字面量
  const bands = Array.from(document.querySelectorAll('[class*="beard-band"]')).filter((el) =>
    (typeof el.className === 'string' ? el.className : '').includes('group/'),
  );
  out.push(`\n带 group/ 前缀的 beard-band: ${bands.length} 个`);
  bands.slice(0, 3).forEach((b, i) => {
    out.push(`  [${i}] class="${b.className}"`);
    out.push(`      子元素 ${b.children.length} 个:`);
    Array.from(b.children).forEach((c, j) => {
      const r = c.getBoundingClientRect();
      out.push(`        ${j + 1}. ${Math.round(r.y)}..${Math.round(r.y + r.height)} h=${Math.round(r.height)} class="${(typeof c.className === 'string' ? c.className : '').slice(0, 90)}"`);
    });
  });
  return out.join('\n');
})();
