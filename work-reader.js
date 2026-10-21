/* Original review pages, read in source order. No image lightbox is attached. */
(() => {
  'use strict';
  const positions = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = language => pair => pair[language === 'en' ? 1 : 0] || pair[0];
  const arrow = direction => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="${direction < 0 ? 'M20 12H4m6-6-6 6 6 6' : 'M4 12h16m-6-6 6 6-6 6'}"/></svg>`;
  const expandIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg>';
  function position(id, count) {
    let index = positions.get(id);
    if (index === undefined) {
      try { index = Number(sessionStorage.getItem('sbd-book-' + id)); } catch {}
    }
    return Math.max(0, Math.min(count - 1, Number.isInteger(index) ? index : 0));
  }
  function render(work, language) {
    const book = work.completeBoard, pages = book?.images;
    if (!pages?.length) return '';
    const t = copy(language), index = position(work.id, pages.length), page = pages[index];
    const prev = t(['上一页','Previous page']), next = t(['下一页','Next page']);
    return `<section class="work-book" aria-labelledby="work-book-title">
      <div class="work-book-heading"><div><p class="eyebrow">${t(['作品评图册','PROJECT REVIEW'])}</p><h2 id="work-book-title">${t(['完整评图册','Complete review book'])}</h2></div><p>${String(pages.length).padStart(2,'0')} ${t(['页 · 按原始顺序','PAGES · ORIGINAL ORDER'])}</p></div>
      <div class="book-reader" data-work-reader="${escape(work.id)}" role="region" aria-label="${t(['评图册阅读器','Review book reader'])}" tabindex="0">
        <div class="book-topbar"><span>${t(['左右翻阅，了解完整过程','Turn the pages to follow the project'])}</span><button type="button" class="book-expand" data-book-expand aria-expanded="false">${expandIcon}<span>${t(['全屏阅读','Full screen'])}</span></button></div>
        <div class="book-stage">
          <button type="button" class="book-arrow" data-book-step="-1" aria-label="${prev}" ${index===0?'disabled':''}>${arrow(-1)}</button>
          <figure class="book-sheet" style="--page-ratio:${page.width}/${page.height}">
            <img data-book-image src="${escape(page.src)}" width="${page.width}" height="${page.height}" alt="${escape(t(work.title))} — ${t([`第 ${index+1} 页`,`Page ${index+1}`])}" decoding="async" draggable="false">
            <div class="book-message" data-book-message hidden><span></span><button type="button" data-book-retry hidden>${t(['重新加载','Retry'])}</button></div>
          </figure>
          <button type="button" class="book-arrow" data-book-step="1" aria-label="${next}" ${index===pages.length-1?'disabled':''}>${arrow(1)}</button>
        </div>
        <div class="book-controls">
          <span class="book-instruction">${t(['← → 翻页','← → TURN PAGES'])}</span>
          <div class="book-pagination"><button type="button" class="book-mobile-arrow" data-book-step="-1" aria-label="${prev}" ${index===0?'disabled':''}>${arrow(-1)}</button><label class="book-page-picker"><span class="book-sr-only">${t(['跳转到页','Go to page'])}</span><select data-book-page>${pages.map((_,i)=>`<option value="${i}" ${i===index?'selected':''}>${String(i+1).padStart(2,'0')}</option>`).join('')}</select></label><span class="book-page-total">/ ${String(pages.length).padStart(2,'0')}</span><button type="button" class="book-mobile-arrow" data-book-step="1" aria-label="${next}" ${index===pages.length-1?'disabled':''}>${arrow(1)}</button></div>
          <span class="book-source">${escape(t(book.source))}</span>
        </div>
        <span class="book-sr-only" data-book-announcement role="status" aria-live="polite"></span>
      </div>
    </section>`;
  }
  function mount(root, work, language) {
    const reader = root.querySelector('[data-work-reader]');
    if (!reader || !work?.completeBoard?.images?.length) return () => {};
    const t = copy(language), pages = work.completeBoard.images;
    const controller = new AbortController(), options = {signal:controller.signal};
    const listen = (node, event, handler, extra={}) => node.addEventListener(event,handler,{...options,...extra});
    const image = reader.querySelector('[data-book-image]'), sheet = reader.querySelector('.book-sheet');
    const picker = reader.querySelector('[data-book-page]'), message = reader.querySelector('[data-book-message]');
    const retry = reader.querySelector('[data-book-retry]'), expand = reader.querySelector('[data-book-expand]');
    const announcement = reader.querySelector('[data-book-announcement]');
    let index = position(work.id,pages.length), expanded = false, generation = 0, pending;
    let touch, savedFocus, disposed = false;
    const status = (text, failed=false) => {
      message.hidden = !text;
      message.querySelector('span').textContent = text;
      retry.hidden = !failed;
      reader.classList.toggle('is-loading',!!text && !failed);
      reader.setAttribute('aria-busy',String(!!text && !failed));
    };
    const loaded = () => {status('');};
    const failed = () => {status(t(['本页未能加载，请重试。','This page could not load. Please retry.']),true);};
    listen(image,'load',loaded);
    listen(image,'error',failed);
    if (image.complete) { if (!image.naturalWidth) failed(); } else status(t(['正在加载本页…','Loading page…']));
    const preload = () => {
      for (const adjacent of [index-1,index+1]) {
        if (pages[adjacent]) {const next = new Image(); next.src = pages[adjacent].src;}
      }
    };
    function show(target, force=false) {
      const next = Math.max(0,Math.min(pages.length-1,target));
      if (!force && next===index) return;
      const direction = next>=index ? 1 : -1;
      index = next;
      positions.set(work.id,index);
      try {sessionStorage.setItem('sbd-book-'+work.id,String(index));} catch {}
      picker.value = String(index);
      for (const button of reader.querySelectorAll('[data-book-step]')) button.disabled = Number(button.dataset.bookStep)<0 ? index===0 : index===pages.length-1;
      const token = ++generation, page = pages[index];
      image.hidden = true;
      status(t(['正在加载本页…','Loading page…']));
      // Commit only the most recently requested page, including after rapid navigation.
      pending = new Image();
      pending.onload = () => {
        if (disposed || token!==generation) return;
        image.src = page.src; image.width = page.width; image.height = page.height;
        image.alt = t(work.title)+' — '+t([`第 ${index+1} 页`,`Page ${index+1}`]);
        image.hidden = false;
        sheet.style.setProperty('--page-ratio',page.width+'/'+page.height);
        status('');
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) image.animate([{opacity:.4,transform:`translateX(${direction*10}px)`},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'});
        announcement.textContent = t([`第 ${index+1} 页，共 ${pages.length} 页`,`Page ${index+1} of ${pages.length}`]);
        preload();
      };
      pending.onerror = () => {if (!disposed && token===generation) failed();};
      pending.src = page.src;
    }
    listen(retry,'click',()=>show(index,true));
    reader.querySelectorAll('[data-book-step]').forEach(button => listen(button,'click',()=>{
      const step = Number(button.dataset.bookStep);
      show(index+step);
      if (button.disabled) reader.querySelector(`[data-book-step="${-step}"]`)?.focus({preventScroll:true});
    }));
    listen(picker,'change',()=>show(Number(picker.value)));
    function collapse(restore=true) {
      if (!expanded) return;
      expanded = false;
      reader.classList.remove('is-expanded'); document.body.classList.remove('work-reader-open');
      reader.setAttribute('role','region'); reader.removeAttribute('aria-modal');
      expand.setAttribute('aria-expanded','false'); expand.querySelector('span').textContent = t(['全屏阅读','Full screen']);
      if (document.fullscreenElement===reader) document.exitFullscreen?.().catch(()=>{});
      if (restore && savedFocus?.isConnected) savedFocus.focus({preventScroll:true});
    }
    listen(expand,'click',()=>{
      if (expanded) {collapse(); return;}
      savedFocus = document.activeElement; expanded = true;
      reader.classList.add('is-expanded'); document.body.classList.add('work-reader-open');
      reader.setAttribute('role','dialog'); reader.setAttribute('aria-modal','true');
      expand.setAttribute('aria-expanded','true'); expand.querySelector('span').textContent = t(['退出全屏','Exit full screen']);
      expand.focus({preventScroll:true});
      // The CSS reader also works when a browser does not support element fullscreen.
      reader.requestFullscreen?.().catch(()=>{});
    });
    listen(document,'fullscreenchange',()=>{if (!document.fullscreenElement && expanded) collapse();});
    listen(document,'keydown',event=>{
      if (event.key==='Escape' && expanded) {event.preventDefault();collapse();return;}
      if (expanded && event.key==='Tab') {
        const focusable = [...reader.querySelectorAll('button:not(:disabled),select')].filter(el=>el.getClientRects().length && !el.hidden);
        const first=focusable[0],last=focusable.at(-1);
        if (event.shiftKey && (document.activeElement===first || !reader.contains(document.activeElement))) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
      }
      if (event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable=true]')) return;
      const rect = reader.getBoundingClientRect();
      if (!expanded && !reader.contains(document.activeElement) && (rect.top<0 || rect.bottom>innerHeight)) return;
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      show(event.key==='Home'?0:event.key==='End'?pages.length-1:index+(event.key==='ArrowLeft'?-1:1));
    });
    listen(sheet,'touchstart',event=>{
      const point=event.touches[0];touch=event.touches.length===1?{x:point.clientX,y:point.clientY}:null;
    },{passive:true});
    listen(sheet,'touchmove',event=>{if(event.touches.length!==1)touch=null;},{passive:true});
    listen(sheet,'touchcancel',()=>{touch=null;},{passive:true});
    listen(sheet,'touchend',event=>{
      const start=touch;touch=null;if(!start||event.touches.length)return;
      const point=event.changedTouches[0],dx=point.clientX-start.x,dy=point.clientY-start.y;
      if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.5) show(index+(dx<0?1:-1));
    },{passive:true});
    const readButton = root.querySelector('[data-read-work-book]');
    if (readButton) listen(readButton,'click',()=>{reader.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});reader.focus({preventScroll:true});});
    preload();
    return () => {disposed=true;++generation;collapse(false);controller.abort();if(pending){pending.onload=null;pending.onerror=null;}};
  }
  window.LAB_WORK_READER = {render,mount};
})();
