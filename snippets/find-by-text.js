// 按可见文字反查元素，并打印其祖先链（tag/id/class + 位置尺寸），用于推导稳定选择器
(() => {
  const targets = [
    'New space',
    'Recent sessions',
    'Go to sessions list',
    'Bypass Permissions',
    'Thoughts',
    'View all',
    'Devin Local Session',
  ];

  const describe = (el) => {
    const cls =
      typeof el.className === 'string'
        ? el.className.split(/\s+/).filter(Boolean).join('.')
        : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };

  const chain = (el) => {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      const r = cur.getBoundingClientRect();
      parts.unshift(
        `${describe(cur)}  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`,
      );
      cur = cur.parentElement;
    }
    return parts;
  };

  const out = [];
  for (const t of targets) {
    // 找出所有"自身文字包含 t 且没有更深匹配"的元素
    const all = Array.from(document.querySelectorAll('*')).filter(
      (el) => el.textContent && el.textContent.includes(t),
    );
    if (!all.length) {
      out.push(`### "${t}" -> NOT FOUND`);
      continue;
    }
    const deepest = all[all.length - 1];
    out.push(`### "${t}" -> ${describe(deepest)}`);
    for (const line of chain(deepest)) out.push('    ' + line);
  }
  return out.join('\n');
})();
