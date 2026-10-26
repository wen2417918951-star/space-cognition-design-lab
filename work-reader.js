/* Source pages stay intact; StPageFlip supplies the paper fold and its shadows. */
(() => {
  'use strict';
  const positions = new Map();
  const text = language => pair => pair[language === 'en' ? 1 : 0] || pair[0];
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = path => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {prev:icon('M19 12H5m6-6-6 6 6 6'),next:icon('M5 12h14m-6-6 6 6-6 6'),zoom:icon('M21 21l-5-5M10 6v8M6 10h8M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'),expand:icon('M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5'),single:icon('M5 4h14v16H5Z'),spread:icon('M12 5v15M3 4h6l3 1 3-1h6v15h-6l-3 1-3-1H3Z')};
  const clamp = (index,count) => Math.max(0,Math.min(count-1,Number.isInteger(index)?index:0));
  function position(id,count) {
    let index=positions.get(id);
    if(index===undefined)try{index=Number(sessionStorage.getItem('sbd-book-'+id));}catch{}
    return clamp(index,count);
  }
  function render(work,language) {
    const pages=work.completeBoard?.images;if(!pages?.length)return '';
    const t=text(language),index=position(work.id,pages.length),page=pages[index];
    return `<section class="work-book" aria-labelledby="work-book-title">
      <div class="work-book-heading"><div><p class="eyebrow">PROJECT REVIEW</p><h2 id="work-book-title">${t(['完整评图册','Complete review book'])}</h2></div><p>${String(pages.length).padStart(2,'0')} ${t(['页 · 按原始顺序','PAGES · ORIGINAL ORDER'])}</p></div>
      <div class="book-reader" data-work-reader="${esc(work.id)}" role="region" aria-label="${t(['评图册阅读器','Review book reader'])}" tabindex="0">
        <div class="book-topbar"><span class="book-instruction">${t(['拖动纸角，或点击左右边缘翻页','Drag a corner or click the edges to turn'])}</span><div class="book-tools"><div class="book-modes" role="group" aria-label="${t(['阅读布局','Reading layout'])}"><button type="button" data-book-mode="single" aria-pressed="true" title="${t(['单页','Single page'])}" aria-label="${t(['单页','Single page'])}">${icons.single}</button><button type="button" data-book-mode="spread" aria-pressed="false" title="${t(['双页','Two pages'])}" aria-label="${t(['双页','Two pages'])}">${icons.spread}</button></div><button type="button" class="book-zoom" data-book-zoom aria-haspopup="dialog">${icons.zoom}<span>${t(['放大细看','Zoom in'])}</span></button><button type="button" class="book-expand" data-book-expand aria-expanded="false" aria-label="${t(['全屏阅读','Full screen'])}">${icons.expand}<span>${t(['全屏阅读','Full screen'])}</span></button></div></div>
        <div class="book-stage">
          <button type="button" class="book-arrow" data-book-step="-1" aria-label="${t(['上一页','Previous page'])}" ${index===0?'disabled':''}>${icons.prev}</button>
          <div class="book-viewport" style="--volume-ratio:${page.width/page.height}"><div class="book-sheet" data-book-host><img class="book-fallback" src="${esc(page.src)}" alt="${esc(t(work.title))}" width="${page.width}" height="${page.height}" draggable="false"></div></div>
          <button type="button" class="book-arrow" data-book-step="1" aria-label="${t(['下一页','Next page'])}" ${index===pages.length-1?'disabled':''}>${icons.next}</button>
        </div>
        <div class="book-controls"><span class="book-reading-hint">${t(['← → 翻页','← → TURN PAGES'])}</span><div class="book-pagination"><button type="button" class="book-mobile-arrow" data-book-step="-1" aria-label="${t(['上一页','Previous page'])}">${icons.prev}</button><label class="book-page-picker"><span class="book-sr-only">${t(['跳转到页','Go to page'])}</span><select data-book-page>${pages.map((_,i)=>`<option value="${i}" ${i===index?'selected':''}>${String(i+1).padStart(2,'0')}</option>`).join('')}</select></label><span class="book-page-total">/ ${String(pages.length).padStart(2,'0')}</span><span class="book-spread-range" data-book-range hidden></span><button type="button" class="book-mobile-arrow" data-book-step="1" aria-label="${t(['下一页','Next page'])}">${icons.next}</button></div><span class="book-source">${esc(t(work.completeBoard.source))}</span></div>
        <div class="book-progress" aria-hidden="true"><span data-book-progress></span></div>
        <span class="book-sr-only" data-book-announcement role="status" aria-live="polite"></span>
      </div>
    </section>`;
  }
  function mount(root,work,language) {
    const reader=root.querySelector('[data-work-reader]');if(!reader||!work?.completeBoard?.images?.length)return()=>{};
    const t=text(language),pages=work.completeBoard.images,ratio=pages[0].width/pages[0].height;
    const viewport=reader.querySelector('.book-viewport'),picker=reader.querySelector('[data-book-page]'),expand=reader.querySelector('[data-book-expand]');
    const announcement=reader.querySelector('[data-book-announcement]'),range=reader.querySelector('[data-book-range]');
    const controller=new AbortController(),listen=(node,type,callback,options={})=>node.addEventListener(type,callback,{signal:controller.signal,...options});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let index=position(work.id,pages.length),preferred='single',spread=false,expanded=false,disposed=false;
    let flip=null,host=reader.querySelector('[data-book-host]'),resizeFrame=0,previousSize='',savedFocus,intersecting=true;
    function save() {positions.set(work.id,index);try{sessionStorage.setItem('sbd-book-'+work.id,String(index));}catch{}}
    function sync() {
      if(disposed)return;
      const end=Math.min(pages.length-1,index+(spread?1:0));
      picker.value=String(index);save();
      for(const button of reader.querySelectorAll('[data-book-step]'))button.disabled=Number(button.dataset.bookStep)<0?index===0:end===pages.length-1;
      range.hidden=!spread;range.textContent=`${String(index+1).padStart(2,'0')}–${String(end+1).padStart(2,'0')}`;
      reader.querySelector('[data-book-progress]').style.width=((end+1)/pages.length*100)+'%';
      announcement.textContent=t([spread?`第 ${index+1} 至 ${end+1} 页，共 ${pages.length} 页`:`第 ${index+1} 页，共 ${pages.length} 页`,spread?`Pages ${index+1}–${end+1} of ${pages.length}`:`Page ${index+1} of ${pages.length}`]);
      reader.dataset.bookPage=String(index);reader.dataset.bookState=flip?.getState()||'read';
    }
    function destroyFlip() {
      if(!flip)return;
      const old=flip;flip=null;
      old.getRender().stop();old.destroy();
      if(window.__sbdPageFlip===old)window.__sbdPageFlip=null;
    }
    function leaf(page,i) {
      const element=document.createElement('div');element.className='review-leaf';element.dataset.reviewPage=String(i);element.dataset.density='soft';
      element.innerHTML=`<img src="${esc(page.src)}" alt="${esc(t(work.title))} — ${t([`第 ${i+1} 页`,`Page ${i+1}`])}" width="${page.width}" height="${page.height}" decoding="async" draggable="false"><div class="book-leaf-error" hidden><span>${t(['本页未能加载','This page could not load'])}</span><button type="button" data-book-retry="${i}">${t(['重新加载','Retry'])}</button></div>`;
      return element;
    }
    function layout(force=false) {
      if(disposed||!window.St?.PageFlip)return;
      const allowSpread=reader.clientWidth>=800;
      const newSpread=preferred==='spread'&&allowSpread;
      reader.querySelector('.book-instruction').textContent=reduced.matches?t(['使用两侧箭头或页码翻页','Use the arrows or page selector to turn']):t(['拖动纸角，或点击左右边缘翻页','Drag a corner or click the edges to turn']);
      reader.classList.toggle('is-spread',newSpread);
      reader.querySelector('[data-book-mode="spread"]').disabled=!allowSpread;
      viewport.style.setProperty('--volume-ratio',String(ratio*(newSpread?2:1)));
      const rect=viewport.getBoundingClientRect();
      const pageWidth=Math.floor(Math.min((rect.width-12)/(newSpread?2:1),(rect.height-12)*ratio));
      const pageHeight=pageWidth/ratio;
      if(pageWidth<30||pageHeight<20)return;
      const size=[pageWidth,newSpread,reduced.matches].join('|');
      if(!force&&size===previousSize){if(flip)flip.getRender().suspended=!intersecting;return;}
      previousSize=size;spread=newSpread;
      if(flip)index=clamp(flip.getCurrentPageIndex(),pages.length);
      destroyFlip();host.remove();
      host=document.createElement('div');host.className='book-sheet';host.dataset.bookHost='';
      host.style.width=(pageWidth*(spread?2:1))+'px';host.style.height=pageHeight+'px';
      const elements=pages.map(leaf);host.append(...elements);viewport.append(host);
      const instance=new St.PageFlip(host,{width:pageWidth,height:pageHeight,size:'fixed',autoSize:false,usePortrait:!spread,startPage:index,showCover:false,drawShadow:true,maxShadowOpacity:.32,flippingTime:720,swipeDistance:30,mobileScrollSupport:true,useMouseEvents:!reduced.matches,showPageCorners:!reduced.matches,disableFlipByClick:false,clickEventForward:true});
      flip=instance;window.__sbdPageFlip=instance;
      instance.on('flip',event=>{if(disposed||flip!==instance)return;index=clamp(event.data,pages.length);sync();});
      instance.on('changeState',event=>{if(flip===instance){reader.dataset.bookState=event.data;reader.classList.toggle('is-turning',event.data==='flipping'||event.data==='user_fold');}});
      instance.loadFromHTML(elements);
      instance.getRender().suspended=!intersecting;
      reader.dataset.bookEngine='stpageflip';
      reader.querySelectorAll('[data-book-mode]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.bookMode==='spread')===spread)));
      index=clamp(instance.getCurrentPageIndex(),pages.length);sync();
    }
    function requestLayout(force=false) {if(disposed)return;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>layout(force));}
    function go(target,animate=true) {
      if(!flip||disposed)return;
      target=clamp(target,pages.length);
      const render=flip.getRender();render.suspended=false;render.finishAnimation();
      const current=flip.getCurrentPageIndex();
      if(spread)target-=target%2;
      if(target===current)return;
      if(animate&&!reduced.matches&&Math.abs(target-current)===(spread?2:1))flip.flip(target,'bottom');
      else flip.turnToPage(target);
      sync();
    }
    reader.querySelectorAll('[data-book-step]').forEach(button=>listen(button,'click',()=>{
      const step=Number(button.dataset.bookStep);
      if(flip)flip.getRender().finishAnimation();
      go(index+step*(spread?2:1));
      if(button.disabled)reader.focus({preventScroll:true});
    }));
    listen(picker,'change',()=>go(Number(picker.value),false));
    listen(reader,'sbd:book-page',event=>go(Number(event.detail.index),false));
    reader.querySelectorAll('[data-book-mode]').forEach(button=>listen(button,'click',()=>{preferred=button.dataset.bookMode;requestLayout(true);}));
    listen(viewport,'error',event=>{
      const image=event.target;if(image.tagName!=='IMG')return;
      const error=image.closest('.review-leaf')?.querySelector('.book-leaf-error');if(error)error.hidden=false;
    },{capture:true});
    listen(viewport,'load',event=>{
      const image=event.target;if(image.tagName!=='IMG')return;
      const error=image.closest('.review-leaf')?.querySelector('.book-leaf-error');if(error)error.hidden=true;
    },{capture:true});
    for(const type of ['mousedown','touchstart'])listen(viewport,type,event=>{if(event.target.closest('[data-book-retry]'))event.stopPropagation();},{capture:true});
    listen(viewport,'click',event=>{
      const button=event.target.closest('[data-book-retry]');if(!button)return;
      event.stopPropagation();
      const i=Number(button.dataset.bookRetry);
      viewport.querySelectorAll(`[data-review-page="${i}"]`).forEach(element=>{element.querySelector('.book-leaf-error').hidden=true;element.querySelector('img').src=pages[i].src+'?retry='+Date.now();});
    });
    function collapse(restore=true) {
      if(!expanded)return;expanded=false;
      reader.classList.remove('is-expanded');document.body.classList.remove('work-reader-open');
      reader.setAttribute('role','region');reader.removeAttribute('aria-modal');expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-label',t(['全屏阅读','Full screen']));expand.querySelector('span').textContent=t(['全屏阅读','Full screen']);
      if(document.fullscreenElement===reader)document.exitFullscreen?.().catch(()=>{});
      requestLayout();if(restore&&savedFocus?.isConnected)savedFocus.focus({preventScroll:true});
    }
    listen(expand,'click',()=>{
      if(expanded){collapse();return;}
      savedFocus=document.activeElement;expanded=true;
      reader.classList.add('is-expanded');document.body.classList.add('work-reader-open');
      reader.setAttribute('role','dialog');reader.setAttribute('aria-modal','true');expand.setAttribute('aria-expanded','true');expand.setAttribute('aria-label',t(['退出全屏','Exit full screen']));expand.querySelector('span').textContent=t(['退出全屏','Exit full screen']);
      expand.focus({preventScroll:true});requestLayout();reader.requestFullscreen?.().catch(()=>{});
    });
    listen(document,'fullscreenchange',()=>{if(!document.fullscreenElement&&expanded)collapse();else requestLayout();});
    listen(document,'keydown',event=>{
      if(reader.dataset.bookZoomOpen==='true')return;
      if(event.key==='Escape'&&expanded){event.preventDefault();collapse();return;}
      if(event.key==='Tab'&&expanded){
        const focusable=[...reader.querySelectorAll('button:not(:disabled),select')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]'));
        const first=focusable[0],last=focusable.at(-1);
        if(event.shiftKey&&(document.activeElement===first||!reader.contains(document.activeElement))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable=true]'))return;
      const rect=reader.getBoundingClientRect();
      if(!expanded&&!reader.contains(document.activeElement)&&(rect.top<0||rect.bottom>innerHeight))return;
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();flip?.getRender().finishAnimation();
      go(event.key==='Home'?0:event.key==='End'?pages.length-1:index+(event.key==='ArrowLeft'?-1:1)*(spread?2:1),!['Home','End'].includes(event.key));
    });
    listen(reduced,'change',()=>requestLayout(true));
    const observer=new ResizeObserver(()=>requestLayout());observer.observe(viewport);
    const visibility=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;if(flip)flip.getRender().suspended=!intersecting;},{rootMargin:'160px'});visibility.observe(reader);
    const readButton=root.querySelector('[data-read-work-book]');if(readButton)listen(readButton,'click',()=>{reader.scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});reader.focus({preventScroll:true});});
    layout();
    return()=>{disposed=true;cancelAnimationFrame(resizeFrame);observer.disconnect();visibility.disconnect();collapse(false);controller.abort();destroyFlip();};
  }
  window.LAB_WORK_READER={render,mount};
})();
