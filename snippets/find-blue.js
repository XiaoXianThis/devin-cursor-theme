// 找出蓝色描边来源：border / outline / box-shadow(ring) 全查；主题变量从 .monaco-workbench 读
(() => {
  const out = [];
  const parseRgb = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const isBluish = (c) => c && c.a > 0.05 && c.b > 90 && c.b > c.r + 40 && c.b > c.g + 25;

  const seen = new Set();
  let scanned = 0;
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!(r.width > 4 && r.height > 4)) continue;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue;
    scanned++;
    const cs = getComputedStyle(el);
    const hits = [];

    for (const [prop, color, width, style] of [
      ['borderTop', cs.borderTopColor, cs.borderTopWidth, cs.borderTopStyle],
      ['borderBottom', cs.borderBottomColor, cs.borderBottomWidth, cs.borderBottomStyle],
      ['borderLeft', cs.borderLeftColor, cs.borderLeftWidth, cs.borderLeftStyle],
      ['borderRight', cs.borderRightColor, cs.borderRightWidth, cs.borderRightStyle],
      ['outline', cs.outlineColor, cs.outlineWidth, cs.outlineStyle],
    ]) {
      if (style === 'none' || parseFloat(width) === 0) continue;
      if (isBluish(parseRgb(color))) hits.push(`${prop}=${width} ${color}`);
    }

    // box-shadow 里出现蓝色
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      for (const part of cs.boxShadow.split(/,(?![^(]*\))/)) {
        if (isBluish(parseRgb(part))) hits.push(`box-shadow=${part.trim()}`);
      }
    }

    if (!hits.length) continue;
    const key = hits.join('|') + '|' + (typeof el.className === 'string' ? el.className.slice(0, 40) : '');
    if (seen.has(key)) continue;
    seen.add(key);
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 5).join('.') : '';
    out.push(
      `\n${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${cls}  [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]  "${(el.textContent || '').trim().slice(0, 24)}"`,
    );
    for (const h of hits) out.push(`    ${h}`);
  }
  out.unshift(`扫描可见元素 ${scanned} 个，蓝色描边种类 ${seen.size} 种`);

  out.push('\n=== 主题变量 (从 .monaco-workbench 读) ===');
  const wb = document.querySelector('.monaco-workbench');
  const wbStyle = wb ? getComputedStyle(wb) : getComputedStyle(document.body);
  for (const v of [
    '--vscode-focusBorder',
    '--vscode-list-focusOutline',
    '--vscode-activityBar-activeBorder',
    '--vscode-activityBar-activeBackground',
    '--vscode-tab-activeBorderTop',
    '--vscode-tab-activeBorder',
    '--vscode-panelTitle-activeBorder',
    '--vscode-textLink-foreground',
    '--vscode-button-background',
    '--vscode-menu-selectionBorder',
    '--vscode-menu-border',
  ]) {
    out.push(`  ${v} = ${wbStyle.getPropertyValue(v) || '(空)'}`);
  }
  return out.join('\n');
})();
