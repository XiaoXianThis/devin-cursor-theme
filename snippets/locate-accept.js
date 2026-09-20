// 精确定位 "Accept all" / "Reject all" 元素
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

  for (const needle of ['Accept all', 'Reject all']) {
    out.push(`\n########## "${needle}" ##########`);
    const leaves = Array.from(document.querySelectorAll('*')).filter(
      (el) => el.children.length === 0 && (el.textContent || '').trim() === needle,
    );
    out.push(`  精确匹配的叶子节点: ${leaves.length}`);
    for (const leaf of leaves.slice(0, 2)) {
      out.push(`  叶子: ${describe(leaf)} ${rect(leaf)}`);
      let cur = leaf;
      for (let i = 0; i < 6 && cur; i++) {
        const c = getComputedStyle(cur);
        out.push(
          `    ${'↑'.repeat(i + 1)} ${describe(cur)} ${rect(cur)}  bg=${c.backgroundColor} r=${c.borderRadius} display=${c.display} inline=${cur.getAttribute('style') ?? '(无)'}`,
        );
        cur = cur.parentElement;
      }
      // closest 会取到谁
      out.push(`    closest(button,[role=button],span.inline-flex,[tabindex]) = ${describe(leaf.closest('button, [role="button"], span.inline-flex, [tabindex]') || leaf)}`);
    }
  }
  return out.join('\n');
})();
