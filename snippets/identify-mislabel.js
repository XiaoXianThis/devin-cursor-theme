// 识别被误标 data-devin-review-btn 的元素
(() => {
  const els = Array.from(document.querySelectorAll('[data-devin-review-btn]'));
  return els
    .map((e) => {
      const r = e.getBoundingClientRect();
      return [
        `tag=${e.tagName} id="${e.id}"`,
        `  class="${(typeof e.className === 'string' ? e.className : '').slice(0, 130)}"`,
        `  inChatRoot=${!!e.closest('.chat-client-root')} inPanel=${!!e.closest('[id="windsurf.cascadePanel"]')} inBand=${!!e.closest('.group\\/beard-band')}`,
        `  rect=${[Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(',')} text="${(e.textContent || '').trim().slice(0, 30)}"`,
      ].join('\n');
    })
    .join('\n---\n');
})();
