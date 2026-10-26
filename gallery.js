import PhotoSwipeLightbox from './vendor/photoswipe/photoswipe-lightbox.esm.min.js';

let lightbox;
let lastGalleryKey = '';
let lastGalleryElement;
const isChinese = () => document.documentElement.lang.startsWith('zh');
const text = (zh,en) => isChinese() ? zh : en;
// Chromium may swallow the first click after a slide swipe (PhotoSwipe #2145).
// Cancel only a completed control tap, then invoke its existing click handler.
// Native clicks from keyboard/mouse and horizontal thumbnail scrolling remain native.
function bindTouchControls(pswp) {
  const root = pswp.element;
  const control = target => target.closest?.('button.pswp__button,button.work-viewer-thumb');
  let tap;
  pswp.events.add(root,'touchstart',event=>{
    const button=control(event.target),point=event.touches[0];
    tap=button&&event.touches.length===1?{button,id:point.identifier,x:point.clientX,y:point.clientY}:null;
  });
  pswp.events.add(root,'touchmove',event=>{
    const point=[...event.touches].find(point=>point.identifier===tap?.id);
    if(!point||event.touches.length!==1||Math.hypot(point.clientX-tap.x,point.clientY-tap.y)>8)tap=null;
  });
  pswp.events.add(root,'touchcancel',()=>{tap=null;});
  pswp.events.add(root,'touchend',event=>{
    const current=tap;tap=null;
    const point=[...event.changedTouches].find(point=>point.identifier===current?.id);
    if(!current||!point||event.touches.length||!event.cancelable||current.button.disabled)return;
    if(Math.hypot(point.clientX-current.x,point.clientY-current.y)>8)return;
    const hit=document.elementFromPoint(point.clientX,point.clientY);
    if(hit&&current.button.contains(hit)){
      event.preventDefault();
      current.button.click();
    }
  });
}
function closeFromEscape(event) {
  if (event.key === 'Escape' && lightbox?.pswp?.isOpen) {
    event.preventDefault();
    lightbox.pswp.close();
  }
}
window.addEventListener('keydown', closeFromEscape);
document.addEventListener('keydown', closeFromEscape);

function mount() {
  const bookReader=document.querySelector('[data-work-reader]');
  const book=window.LAB_WORKS?.items.find(work=>work.id===bookReader?.dataset.workReader);
  const bookMode=!!book?.completeBoard?.images?.length;
  const interfaceFigure = document.querySelector('[data-project-interface]');
  const interfaceMode = !!interfaceFigure;
  const gallery = (bookMode&&bookReader) || interfaceFigure || document.querySelector('.work-gallery')?.closest('main') || document.querySelector('.work-hero');
  const key = gallery ? document.documentElement.lang+'|'+(bookMode?'book:'+book.id:[...gallery.querySelectorAll('a.gallery-image')].map(a => a.getAttribute('href')).join('|')) : '';
  if (!gallery) { lightbox?.destroy(); lightbox = null; window.__sbdLightbox = null; lastGalleryKey = ''; lastGalleryElement=null; return; }
  if (key === lastGalleryKey&&gallery===lastGalleryElement) return;
  lightbox?.destroy();
  lastGalleryKey = key;lastGalleryElement=gallery;
  const mountedLightbox = lightbox = new PhotoSwipeLightbox({
    ...(bookMode?{dataSource:book.completeBoard.images.map((page,index)=>({src:page.src,width:page.width,height:page.height,alt:text(book.title[0],book.title[1])+text(` — 第 ${index+1} 页`,` — Page ${index+1}`)})),appendToEl:bookReader,secondaryZoomLevel:1,pinchToClose:false,closeOnVerticalDrag:false,imageClickAction:'zoom'}:{gallery,children:'a.gallery-image'}),
    pswpModule: () => import('./vendor/photoswipe/photoswipe.esm.min.js'),
    bgOpacity: bookMode?1:.96,
    showHideAnimationType: 'none',
    escKey: true,
    trapFocus: true,
    returnFocus: true,
    counter: !interfaceMode,
    loop: !bookMode,
    closeTitle: bookMode?text('返回评图册','Back to review book'):text('关闭图像','Close image viewer'),
    zoomTitle: text('放大或缩小','Zoom in or out'),
    arrowPrevTitle: bookMode?text('上一页','Previous page'):text('上一张','Previous image'),
    arrowNextTitle: bookMode?text('下一页','Next page'):text('下一张','Next image'),
    errorMsg: text('图像暂时无法加载，请关闭后重试。','The image could not load. Close the viewer and try again.'),
    paddingFn: viewport => ({top:viewport.y<500?44:60,bottom:bookMode?60:interfaceMode?(viewport.y<500?70:100):(viewport.y<500?100:160),left:viewport.x<760?12:60,right:viewport.x<760?12:60}),
  });
  window.__sbdLightbox = lightbox;
  mountedLightbox.addFilter('preventPointerEvent',(prevent,event)=>event.target.closest?.('.pswp__work-thumbs')?false:prevent);
  mountedLightbox.on('beforeOpen', () => {
    if(bookMode)document.body.classList.add('book-detail-open');
    const zoomDuration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    Object.assign(mountedLightbox.pswp.options,{showAnimationDuration:0,hideAnimationDuration:0,zoomAnimationDuration:zoomDuration});
  });
  mountedLightbox.on('afterInit', () => {
    mountedLightbox.pswp.element.setAttribute('aria-label',bookMode?text('评图册细节','Review book details'):interfaceMode?text('项目图像预览','Project image preview'):text('作品图像','Project images'));
    mountedLightbox.pswp.element.classList.toggle('pswp--interface',interfaceMode);
    mountedLightbox.pswp.element.classList.toggle('pswp--book',bookMode);
    bindTouchControls(mountedLightbox.pswp);
    if(bookMode){
      bookReader.dataset.bookZoomOpen='true';
      mountedLightbox.pswp.updateSize(true);
      mountedLightbox.pswp.zoomTo(1,undefined,0);
    }
  });
  mountedLightbox.on('close',()=>{
    if(!bookMode)return;
    bookReader.dataset.bookZoomOpen='false';
    bookReader.dispatchEvent(new CustomEvent('sbd:book-page',{detail:{index:mountedLightbox.pswp.currIndex}}));
  });
  mountedLightbox.on('destroy',()=>{if(bookMode){bookReader.dataset.bookZoomOpen='false';document.body.classList.remove('book-detail-open');}});
  mountedLightbox.on('uiRegister', () => {
    const pswp=mountedLightbox.pswp;
    pswp.ui.registerElement({
      name: 'sbd-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el) => {
        el.setAttribute('aria-live','polite');
        el.setAttribute('aria-atomic','true');
        pswp.on('change', () => {
          const item = pswp.currSlide?.data?.element;
          const caption = bookMode?text(`第 ${pswp.currIndex+1} / ${book.completeBoard.images.length} 页 · 拖动查看细节`,`Page ${pswp.currIndex+1} / ${book.completeBoard.images.length} · Drag to inspect`):item?.closest('figure')?.querySelector('figcaption')?.textContent || item?.querySelector('img')?.alt || '';
          el.textContent = caption;
          el.hidden = !caption;
        });
      },
    });
    if(!interfaceMode&&!bookMode)pswp.ui.registerElement({
      name:'work-thumbs',order:10,isButton:false,appendTo:'root',
      onInit:(el) => {
        el.setAttribute('role','group');
        el.setAttribute('aria-label',text('选择作品图像','Select a project image'));
        const buttons=[];
        for(let i=0;i<pswp.getNumItems();i++){
          const item=pswp.getItemData(i),image=item.element?.querySelector('img');
          const button=document.createElement('button');
          button.type='button';button.className='work-viewer-thumb';button.dataset.imageIndex=String(i);
          button.setAttribute('aria-label',text(`查看第${i+1}张：`,`View image ${i+1}: `)+(image?.alt||''));
          button.title=button.getAttribute('aria-label');
          const preview=document.createElement('img');preview.src=image?.currentSrc||image?.src||item.src;preview.alt='';preview.decoding='async';
          const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
          button.append(preview,number);button.addEventListener('click',()=>pswp.goTo(i));
          el.append(button);buttons.push(button);
        }
        pswp.on('change',()=>{
          buttons.forEach((button,index)=>{if(index===pswp.currIndex)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
          const active=buttons[pswp.currIndex];
          if(active)el.scrollLeft=active.offsetLeft-(el.clientWidth-active.offsetWidth)/2;
        });
      },
    });
  });
  mountedLightbox.init();
}

new MutationObserver(mount).observe(document.getElementById('main'), {childList: true, subtree: true});
window.addEventListener('sbd:render', mount);
mount();

document.addEventListener('click',event=>{
  if(event.target.closest('[data-open-work-gallery]'))lightbox?.loadAndOpen(0);
  const zoom=event.target.closest('[data-book-zoom]');
  if(zoom)lightbox?.loadAndOpen(Number(zoom.closest('[data-work-reader]').dataset.bookPage)||0);
});
