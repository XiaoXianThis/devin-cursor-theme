// 探查嵌入的 app.devin.ai 页面结构（跨域 iframe 目标）
(() => {
  const info = {
    url: location.href,
    title: document.title,
    bodyClass: document.body.className,
    bodyChildren: Array.from(document.body.children).map((e) => {
      const r = e.getBoundingClientRect();
      const cls =
        typeof e.className === 'string'
          ? e.className.split(/\s+/).filter(Boolean).slice(0, 6).join('.')
          : '';
      return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${cls ? '.' + cls : ''} [${Math.round(r.width)}x${Math.round(r.height)}]`;
    }),
  };
  return JSON.stringify(info, null, 2);
})();
