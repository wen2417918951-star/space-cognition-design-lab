(() => {
  'use strict';
  const {themes, projects} = window.LAB_CONTENT;
  const {topics:paperTopics,items:papers} = window.LAB_PUBLICATIONS;
  const {categories:workCategories,items:works} = window.LAB_WORKS;
  const main = document.getElementById('main');
  let lang = 'zh';
  try {lang = localStorage.getItem('sbd-language') === 'en' ? 'en' : 'zh';} catch {}
  let lastArchive = '#/projects';
  let lastWorks = '#/works';
  let lastPublications = '#/publications';
  let toastTimer;
  let cleanupPointerMotion = () => {};
  let cleanupAtlasLayout = () => {};
  let cleanupHero = () => {};
  let cleanupWorkReader = () => {};
  // A history entry owns its viewport, including when filters replace its URL.
  const viewports = new Map();
  let entrySequence = 0;
  const newEntryKey = () => Date.now().toString(36)+'-'+(++entrySequence);
  let entryKey = history.state?.sbdEntry || newEntryKey();
  history.replaceState({...history.state,sbdEntry:entryKey},'');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function navigateHistory(){
    const active=document.activeElement;
    viewports.set(entryKey,{y:window.scrollY,href:main.contains(active)?active.closest('a')?.getAttribute('href'):null});
    const incoming=history.state?.sbdEntry;
    entryKey=incoming&&incoming!==entryKey?incoming:newEntryKey();
    history.replaceState({...history.state,sbdEntry:entryKey},'');
    const restored=viewports.get(entryKey);
    if(viewports.size>80)viewports.delete(viewports.keys().next().value);
    render(false,restored);
  }
  const t = pair => pair[lang === 'zh' ? 0 : 1] || pair[0] || '';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function directionIcon(direction='ne') {
    const paths={ne:'M6 18 18 6M6 6h12v12',right:'M4 12h16m-6-6 6 6-6 6',left:'M20 12H4m6-6-6 6 6 6',down:'M12 4v16m-6-6 6 6 6-6',up:'M12 20V4m-6 6 6-6 6 6',reset:'M4 10a8 8 0 1 1 1 9M4 4v6h6',play:'m8 5 11 7-11 7Z',pause:'M8 5v14M16 5v14'};
    return `<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[direction]||paths.ne}"/></svg>`;
  }
  const arrow = '<span class="arrow" aria-hidden="true">'+directionIcon('ne')+'</span>';
  const eye = (zh,en) => `<p class="eyebrow section-mark">${t([zh,en])}</p>`;
  const link = (url,zh,en) => `<a class="text-link" href="${url}">${t([zh,en])}${arrow}</a>`;
  const themeName = id => t(themes.find(x => x.id === id).short);
  const svg = (body,viewBox='0 0 800 500',cls='') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;

  function cityDrawing(variant='hero') {
    const p = (x,y,z=0) => [400+(x-y)*30,80+(x+y)*14-z];
    const points = coords => coords.map(c=>p(...c).join(',')).join(' ');
    const polygon = (coords,fill,stroke='#898989',width=.7) => `<polygon points="${points(coords)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
    const line = (a,b,color='#545454',width=.6,extra='') => `<line x1="${p(...a)[0]}" y1="${p(...a)[1]}" x2="${p(...b)[0]}" y2="${p(...b)[1]}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
    function box(x,y,w,d,h,accent=false){
      const a=accent?'#f2f2f2':'#c7c7c7',b=accent?'#727272':'#959595',c=accent?'#cacaca':'#6d6d6d';
      let out=polygon([[x,y+d],[x+w,y+d],[x+w,y+d,h],[x,y+d,h]],b)+polygon([[x+w,y],[x+w,y+d],[x+w,y+d,h],[x+w,y,h]],c)+`<g class="building-roof">${polygon([[x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h]],a)}</g>`;
      for(let z=12;z<h-10;z+=14)out+=line([x+.2,y+d,z],[x+w-.2,y+d,z],accent?'#cacaca':'#6b6b6b',.65)+line([x+w,y+.2,z],[x+w,y+d-.2,z],accent?'#6f6f6f':'#b1b1b1',.65);
      const [cx,cy]=p(x+w/2,y+d/2,h);
      return `<g class="city-building" data-roof-x="${cx}" data-roof-y="${cy}">${out}</g>`;
    }
    let out=`<defs><pattern id="dots-${variant}" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#7b7b7b" opacity=".55"/></pattern></defs><rect width="800" height="600" fill="#262626"/><rect width="800" height="600" fill="url(#dots-${variant})"/>`;
    out+=polygon([[0,0],[12,0],[12,12],[0,12]],'#383838','#7b7b7b',.8);
    for(let i=0;i<=12;i++){out+=line([i,0],[i,12])+line([0,i],[12,i]);}
    out+=polygon([[.4,7.4],[11.6,7.4],[11.6,8.5],[.4,8.5]],'#4d4d4d','none');
    out+=polygon([[4.3,.2],[5.3,.2],[5.3,11.8],[4.3,11.8]],'#4d4d4d','none');
    const buildings=[[.7,.7,1.7,1.6,65],[3,.7,1,1.7,100],[6,.8,1.2,2,74],[8,.7,2.5,1.5,116],[10.7,2.8,.7,2.1,56],[.7,3.2,2.2,1.1,46],[6,3.5,1.6,2.2,75],[8.5,3.5,1.5,2.2,48],[2,5.2,1.5,1.4,60],[.6,9.2,2.3,1.2,36],[3.2,9.3,1.1,1.6,82],[6.2,9.2,1.4,1.5,42],[8.4,9.1,2.4,1.9,59]];
    buildings.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
    buildings.forEach((b,i)=>out+=box(...b,i===5));
    for(const [x,y] of [[.7,6],[10.5,6.4],[7.3,6.5],[3.6,3.1],[6.1,8.9],[10.8,9.2],[2,8.9]]){
      const [cx,cy]=p(x,y);out+=`<ellipse cx="${cx}" cy="${cy+3}" rx="11" ry="5" fill="#929292" opacity=".45"/><path d="M${cx},${cy}v-18" stroke="#b1b1b1" stroke-width="1.5"/><circle cx="${cx}" cy="${cy-20}" r="11" fill="#aeaeae" stroke="#bdbdbd" stroke-width=".6"/>`;
    }
    const route=[[1,8],[4.8,8],[4.8,6.4],[8,6.4],[8,4.5]].map(c=>p(...c).join(',')).join(' ');
    out+=`<polyline points="${route}" fill="none" stroke="#f8f8f8" stroke-width="9"/><polyline class="route-path route-flow" points="${route}" fill="none" stroke="#f2f2f2" stroke-width="4"/>`;
    for(const [x,y,label] of [[1,8,'A'],[8,4.5,'B']]){const [cx,cy]=p(x,y);out+=`<circle cx="${cx}" cy="${cy}" r="8" fill="#f2f2f2" stroke="#fff" stroke-width="2"/><text x="${cx+15}" y="${cy+3}" font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#191919">${label}</text>`;}
    out+='<g class="cognition-layer">';
    for(const [x,y] of [[4.8,8],[4.8,6.4],[8,6.4]]){const [cx,cy]=p(x,y);out+=`<circle cx="${cx}" cy="${cy}" r="27" fill="#cbcbcb" fill-opacity=".12" stroke="#cbcbcb" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="6" fill="#cbcbcb"/>`;}
    out+='</g><g class="design-layer">'+polygon([[5.7,5.9],[8.4,5.9],[8.4,7],[5.7,7]],'#f2f2f233','#f2f2f2',1.4)+'</g>';
    out+=`<g class="scan-line" opacity=".3">${polygon([[.3,5.8],[11.7,5.8],[11.7,6],[.3,6]],'#f2f2f2','none')}</g>`;
    out+='<g font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="8" fill="#bdbdbd"><text x="53" y="373" transform="rotate(25 53 373)">SPATIAL FIELD / 01</text><text x="624" y="422" transform="rotate(-25 624 422)">EXPERIENCE / ACTION</text></g>';
    out+='<g class="city-probe" pointer-events="none"><path d="M-10 0H-4M4 0H10M0-10V-4M0 4V10" fill="none" stroke="#f2f2f2" stroke-width="1"/><circle r="2" fill="#f2f2f2"/></g>';
    return svg(out,'0 0 800 600','city-art');
  }

  function themeSymbol(id) {
    const s='currentColor';
    if(id==='space')return svg(`<g fill="none" stroke="${s}" stroke-width="1.4"><path d="M10 63 50 40 90 63 50 87Z M10 63V29L50 6 90 29V63 M50 6V40 M50 53V87 M10 29 50 53 90 29"/><path d="M30 41V75 M70 41V75 M30 18 70 41 M70 18 30 41"/></g>`,'0 0 100 100','theme-symbol');
    if(id==='cognition')return svg(`<g fill="none" stroke="${s}" stroke-width="1.4"><circle cx="50" cy="50" r="37"/><ellipse cx="50" cy="50" rx="18" ry="37" transform="rotate(38 50 50)"/><ellipse cx="50" cy="50" rx="18" ry="37" transform="rotate(-38 50 50)"/><path d="M13 50H87 M50 13V87"/><circle cx="50" cy="50" r="7" fill="${s}"/></g>`,'0 0 100 100','theme-symbol');
    return svg(`<g fill="none" stroke="${s}" stroke-width="1.4"><path d="M13 13H87V87H13Z M13 38H87 M38 13V87 M62 13V87 M13 62H87"/><circle cx="50" cy="50" r="25"/><path d="m38 62 24-24 M50 38H62V50" stroke-width="3"/></g>`,'0 0 100 100','theme-symbol');
  }

  function art(type) {
    if(type==='field')return svg(`<defs><pattern id="fieldDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#ffffff" opacity=".35"/></pattern></defs><rect width="800" height="500" fill="#3e3e3e"/><rect width="800" height="500" fill="url(#fieldDots)"/><g fill="none" stroke="#aeaeae" stroke-width="1.3"><path d="M80 310 410 110 720 295 390 486Z M80 310V235L410 35 720 220V295 M410 35V110 M80 235 390 411 720 220 M390 411V486"/><path d="M160 278V202L249 150V225 M315 187V112L410 56 M410 110 495 160V85 M495 160 570 205 655 155 M239 315 317 269V194L400 243 M400 243V318L486 368 M317 269 400 318 565 222 640 266 M160 355V278L240 325V400"/></g><path d="m123 308 106 63 95-55 76 45 124-72 71 41 82-48" fill="none" stroke="#f2f2f2" stroke-width="5"/><g fill="#f2f2f2"><circle cx="123" cy="308" r="8"/><circle cx="677" cy="282" r="8"/></g><g font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" fill="#d3d3d3" font-size="10"><text x="91" y="190">BASELINE</text><text x="604" y="375">CUE → ACTION</text></g>`);
    if(type==='garden'){
      let trees='';for(let i=0;i<34;i++){const x=100+(i*83%610),y=100+(i*61%300);trees+=`<circle cx="${x+5}" cy="${y+8}" r="${11+i%6}" fill="#a5a5a5" opacity=".45"/><circle cx="${x}" cy="${y}" r="${10+i%6}" fill="${i%3===0?'#b3b3b3':'#818181'}" stroke="#5b5b5b" stroke-width=".6"/>`;}
      return svg(`<rect width="800" height="500" fill="#e5e5e5"/><path d="M30 345 320 50 770 170 500 477Z" fill="#d3d3d3" stroke="#737373"/><g fill="#f4f4f4" stroke="#676767" stroke-width="1"><path d="m70 320 59-60 148 40-59 60Z M144 244l57-57 149 40-59 59Z M218 169l57-57 148 40-58 58Z M499 311l59-60 131 35-59 61Z M421 391l60-60 131 35-60 60Z"/><path d="m70 320v-23l59-60v23 M70 297l148 40 59-60v23 M218 337v23 M144 244v-23l57-57v23 M144 221l147 41 59-58v23 M291 262v24 M218 169v-23l57-57v23 M218 146l147 41 58-58v23 M365 187v23 M499 311v-23l59-60v23 M499 288l131 35 59-60v23 M630 323v24 M421 391v-23l60-60v23 M421 368l131 35 60-60v23 M552 403v23"/></g><path d="m109 401 204-208 251 68 89-90" fill="none" stroke="#f7f7f7" stroke-width="21"/><path d="m109 401 204-208 251 68 89-90" fill="none" stroke="#b2b2b2" stroke-width="1"/>${trees}<path d="m186 370 128-130 202 55" fill="none" stroke="#6f6f6f" stroke-width="3" stroke-dasharray="6 5"/><circle cx="186" cy="370" r="6" fill="#6f6f6f"/><g stroke="#808080" stroke-width=".7"><path d="M60 430H140 M60 424V436 M100 427V433 M140 424V436"/></g><text x="60" y="454" font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="9" fill="#696969">NEIGHBORHOOD / EVERYDAY LANDSCAPE</text>`);
    }
    if(type==='signal'){
      let rings='';for(let i=0;i<8;i++)rings+=`<circle cx="420" cy="250" r="${35+i*23}" fill="none" stroke="#a2a2a2" stroke-width=".8" opacity="${.8-i*.08}"/>`;
      return svg(`<rect width="800" height="500" fill="#313131"/>${rings}<path d="M65 250H244L272 209 304 298 340 167 375 333 405 219 431 250H735" fill="none" stroke="#c2c2c2" stroke-width="2"/><rect x="335" y="145" width="170" height="215" rx="34" fill="#f5f5f5" stroke="#a7a7a7" stroke-width="1.5"/><rect x="354" y="164" width="132" height="87" rx="4" fill="#d5d5d5" stroke="#a7a7a7"/><path d="m372 209 18-14 18 24 21-31 20 19h19" fill="none" stroke="#444444" stroke-width="2"/><circle cx="420" cy="300" r="22" fill="none" stroke="#a7a7a7" stroke-width="1.3"/><circle cx="420" cy="300" r="5" fill="#f2f2f2"/><g fill="#cecece" font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="10"><text x="91" y="385">PROMPT</text><text x="363" y="412">RESPONSE</text><text x="635" y="145">ACTION</text></g><path d="M133 365 315 311 M470 185 620 149" stroke="#a7a7a7" stroke-width=".8"/>`);
    }
    let contour='';for(let i=0;i<16;i++)contour+=`<ellipse cx="415" cy="320" rx="${90+i*17}" ry="${15+i*9}" fill="none" stroke="#676767" stroke-width=".7" opacity="${.7-i*.025}"/>`;
    return svg(`<rect width="800" height="500" fill="#b8b8b8"/>${contour}<path d="M262 365V111H537V365H508V142H291V365Z" fill="#a6a6a6" stroke="#535353" stroke-width="1"/><path d="M262 111 290 87H565V341L537 365V111Z" fill="#828282" stroke="#535353" stroke-width="1"/><path d="M291 142H508V365H291Z" fill="#e6e6e6"/><path d="M291 287 358 207 424 260 473 225 508 269V365H291Z" fill="#b0b0b0"/><path d="M291 320 388 263 463 313 508 281V365H291Z" fill="#848484"/><circle cx="458" cy="191" r="15" fill="#f2f2f2"/><path d="M304 350 422 306 492 331" fill="none" stroke="#e7e7e7" stroke-width="2"/><circle cx="399" cy="224" r="49" fill="#f7f7f7" stroke="#535353" stroke-width="1"/><circle cx="399" cy="224" r="39" fill="none" stroke="#c3c3c3" stroke-width="2"/><path d="M399 185a39 39 0 1 1-39 39" fill="none" stroke="#f2f2f2" stroke-width="3"/><path d="M399 205V226L412 233" fill="none" stroke="#191919" stroke-width="2"/><g fill="#3c3c3c" font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="10"><text x="74" y="150">FOCUS</text><text x="74" y="168">REST</text><text x="74" y="186">RETURN</text><text x="630" y="370">A SPACE</text><text x="630" y="388">TO BEGIN.</text></g>`);
  }

  function projectMedia(p){
    if(p.cover)return `<div class="project-art interface-media" data-art="${esc(p.art)}" data-project-cover="${esc(p.id)}"><img src="${esc(p.cover)}" alt="${esc(t(p.coverAlt||p.title))}" loading="lazy" width="${p.coverWidth||1440}" height="${p.coverHeight||960}"></div>`;
    if(p.art==='atlas')return `<div class="project-art tool-media" data-art="atlas"><div class="tool-media-heading"><span>RESEARCH FIGURE ATLAS</span><span>${t(['2,070 幅图像','2,070 FIGURES'])}</span></div><div class="atlas-contact-sheet">${[['M008','研究框架','Research frameworks'],['M006','界面与场景','Interfaces & scenes'],['M001','空间地图','Spatial maps']].map(([id,zh,en])=>`<figure><div><img src="assets/atlas-preview-${id}.webp" alt="${esc(t([zh,en]))}" loading="lazy" width="640" height="${id==='M008'?415:id==='M006'?408:248}"></div><figcaption><span>${id}</span>${t([zh,en])}</figcaption></figure>`).join('')}</div><div class="tool-media-foot"><span>${t(['658 篇来源论文 · 按研究用途检索','658 SOURCE PAPERS · SEARCH BY USE'])}</span>${arrow}</div></div>`;
    return `<div class="project-art" data-art="${p.art}">${art(p.art)}<span class="art-label">${esc(t(p.type)).toUpperCase()}</span><span class="art-id">SBD / ${p.n}</span><span class="art-button" aria-hidden="true">${directionIcon('ne')}</span></div>`;
  }

  function toolAction(p,cls='tool-launch'){
    if(!['figure-atlas','mindscape-lab','mindscape-studio','focus'].includes(p.id))return '';
    const atlas=p.id==='figure-atlas';
    if(!atlas&&!p.externalUrl)return p.publicPreviewOnly?`<span class="tool-destination">${t(['原型预览 · 暂未开放在线体验','Prototype preview · online access is not yet available'])}</span>`:'';
    const label=atlas?['浏览图集','Explore the atlas']:p.id==='mindscape-lab'?['访问 Lab','Visit Lab']:p.id==='focus'?['打开 Focus','Open Focus']:['打开 Studio','Open Studio'];
    return `<a class="${cls}" href="${esc(atlas?'#/research/figures':p.externalUrl)}"${atlas?'':' target="_blank" rel="noopener noreferrer"'}>${t(label)}${arrow}${atlas?'':`<span class="sr-only">${t(['（新窗口）',' (new window)'])}</span>`}</a>`;
  }

  function archiveSource(value,fallback='#/projects'){
    if(value==='#/'||value==='#/?focus=hero-title')return value;
    if(!/^#\/(?:projects|works)(?:\?[^#]*)?$/.test(value||''))return fallback;
    const [path,query='']=value.split('?');
    const source=new URLSearchParams(query),clean=new URLSearchParams();
    const keys=path==='#/projects'?['collection','theme','q']:['category','q'];
    keys.forEach(key=>{if(source.get(key))clean.set(key,source.get(key));});
    return path+(clean.size?'?'+clean:'');
  }
  const archiveItemHref=(type,id,from='')=>`#/${type}/${encodeURIComponent(id)}${from?'?from='+encodeURIComponent(archiveSource(from)):''}`;
  const archiveReturn=(params,fallback,id)=>{
    const from=archiveSource(params.get('from'),fallback);
    if(from==='#/?focus=hero-title')return from;
    return from+(from.includes('?')?'&':'?')+'focus='+encodeURIComponent(id);
  };

  function projectCard(p,from=''){
    const usable=['figure-atlas','mindscape-lab','mindscape-studio','focus'].includes(p.id);
    return `<article class="project-card" id="project-${esc(p.id)}" data-project="${p.id}"><a class="project-card-overview" href="${esc(archiveItemHref('projects',p.id,from))}" aria-label="${esc(t(p.title))} — ${esc(t(p.subtitle))}">${projectMedia(p)}<div class="project-meta"><span>${p.year} / ${esc(t(p.type))}</span><span>${esc(t(p.stage))}</span></div><h3>${esc(t(p.title))}</h3><p class="project-subtitle">${esc(t(p.subtitle))}</p><div class="project-tags">${p.themes.map(id=>`<span>${themeName(id)}</span>`).join('')}</div></a>${usable?`<div class="project-card-actions">${toolAction(p)}<a class="tool-overview" href="${esc(archiveItemHref('projects',p.id,from))}" aria-label="${esc(t(p.title))} · ${t(['项目介绍','Project overview'])}">${t(['项目介绍','Project overview'])}<span aria-hidden="true">${directionIcon('right')}</span></a></div>`:''}</article>`;
  }

  function labSlogan(){return `<section class="slogan-strip" aria-labelledby="lab-slogan"><div>${eye('实验室主张','LAB POSITION')}<p class="slogan-note">${t(['在人的经验与机器能力之间，建立可感知、可检验的联系。','Build perceptible, testable connections between human experience and machine capability.'])}</p></div><div><blockquote id="lab-slogan">${t(['让机器的能力进入人的生活与认知。<br>让人的经验融入机器的计算与理解。','Bring machine capabilities into human life and cognition.<br>Bring human experience into how machines compute and understand.'])}</blockquote></div></section>`;}

  function homeHeroWorks(){
    const labels={
      'polar-visual-perception':['极地拟态环境','Polar environments'],
      'exhibition-perception':['展陈空间感知','Exhibition perception'],
      'classroom-eeg':['教室空间体验','Classroom experience']
    };
    const selected=works.slice(0,3);
    return `<div class="hero-visual hero-carousel" role="region" aria-roledescription="${t(['轮播','carousel'])}" aria-label="${t(['学生作品精选','Selected student work'])}"><div class="hero-carousel-controls"><span class="hero-slide-count" aria-hidden="true">01 / ${String(selected.length).padStart(2,'0')}</span><button class="hero-carousel-button motion-toggle" id="motion" type="button" aria-label="${t(['暂停作品轮播','Pause slideshow'])}" aria-pressed="false">${directionIcon('pause')}</button><button class="hero-carousel-button" id="hero-prev" type="button" aria-label="${t(['上一件作品','Previous work'])}">${directionIcon('left')}</button><button class="hero-carousel-button" id="hero-next" type="button" aria-label="${t(['下一件作品','Next work'])}">${directionIcon('right')}</button></div><div class="hero-slides" aria-live="off">${selected.map((work,index)=>`<div class="hero-slide${index===0?' is-active':''}" data-work="${esc(work.id)}" role="group" aria-roledescription="${t(['幻灯片','slide'])}" aria-label="${index+1} / ${selected.length}" aria-hidden="${index!==0}"${index?' inert':''}><a class="hero-work-link" href="${esc(archiveItemHref('works',work.id,'#/?focus=hero-title'))}" aria-label="${esc(t(['查看作品：','View work: '])+t(work.title))}"><img src="assets/home-20261020/${esc(work.id)}.webp" alt="${esc(t(work.coverAlt))}" width="1200" height="750" fetchpriority="${index===0?'high':'low'}" decoding="async"><div class="hero-work-caption"><small>${t(['学生作品','STUDENT WORK'])} / ${esc(work.authors.join(' · '))}</small><span>${esc(t(labels[work.id]||work.title))}${arrow}</span></div></a></div>`).join('')}</div><p class="hero-carousel-status sr-only" role="status" aria-live="polite" aria-atomic="true"></p></div>`;
  }

  function home(){
    return `<section class="hero home-hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow hero-index"><span class="status-dot"></span>${t(['空间 · 脑认知 · 设计','SPACE, COGNITION & DESIGN'])}</p><h1 id="hero-title">${t(['<span class="hero-line">从<span class="accent">脑认知</span>出发，</span><span class="hero-line">理解与设计空间。</span>','<span class="hero-line">From <span class="accent">brain science</span></span><span class="hero-line">to spatial design.</span>'])}</h1><p class="hero-desc">${t(['连接空间研究、脑科学与设计实践，探索环境如何影响人的感知、认知与行为。','Connecting spatial research, brain science, and design to explore how environments shape perception, cognition, and behavior.'])}</p><div class="hero-actions">${link('#/research','走进研究','Explore research')}${link('#/projects?collection=works','学生作品','Student work')}</div></div>${homeHeroWorks()}</section>
    ${homeWorkGallery()}
    ${homeToolGallery()}
    ${homeSelection()}
    <section class="home-section home-about" aria-labelledby="home-about-title"><div><h2 id="home-about-title">${t(['关于实验室','About the Lab'])}</h2><p class="home-position">${t(['让机器的能力进入人的生活与认知。<br>让人的经验融入机器的计算与理解。','Bring machine capabilities into human life and cognition.<br>Bring human experience into how machines compute and understand.'])}</p></div><div><p class="home-about-copy">${t(['空间·脑·设计实验室关注建筑与城市环境中的感知、认知与行为，通过数字环境、研究工具与设计实验，探索人与空间之间的关系。','Space, Cognition & Design Lab investigates perception, cognition, and behavior in built environments through digital settings, research tools, and design experiments.'])}</p>${link('#/about','了解实验室','About the Lab')}</div></section>`;
  }

  function homeWorkGallery(){
    const selected=[
      {id:'exhibition-perception',image:'assets/works/exhibition-perception/route-guidance.webp',width:2400,height:1350,alt:['展墙与照明组织的虚拟展陈场景','Virtual exhibition with display walls and lighting'],title:['展陈空间中的感知与引导','Perception and guidance in exhibitions'],label:['空间体验 · 脑响应','Spatial experience · brain response']},
      {id:'polar-visual-perception',image:'assets/works/polar-visual-perception/immersive-session.webp',width:2048,height:1152,alt:['参与者在极地沉浸投影中体验场景并进行脑电记录','A participant in an immersive polar scene during EEG recording'],title:['在沉浸环境中研究视觉感知','Visual perception in immersive settings'],label:['虚拟现实 · 脑电','Virtual reality · EEG']},
      {id:'classroom-eeg',image:'assets/works/classroom-eeg/eeg-analysis.webp',width:2400,height:1695,alt:['王彦楷学生作品中的脑电地形图、信号与空间体验分析','EEG topographies, signals and spatial-experience analysis from Wang Yankai’s student work'],title:['从教室空间体验到脑电分析','From classroom experience to EEG analysis'],label:['建筑空间 · 脑电','Architecture · EEG'],contain:true}
    ];
    return `<section class="home-section home-work-gallery" aria-labelledby="home-work-title"><div class="home-section-heading"><h2 id="home-work-title">${t(['研究与作品','Research & student work'])}</h2>${link('#/projects?collection=works','全部作品','All student work')}</div><nav class="home-research-links" aria-label="${t(['研究方向','Research themes'])}">${themes.map(th=>`<a href="#/research/${th.id}">${esc(t(th.name))}${arrow}</a>`).join('')}</nav><div class="home-work-grid">${selected.map(item=>{const w=works.find(w=>w.id===item.id);return `<article class="home-image-card" id="work-${esc(w.id)}"><a class="home-card-link" href="${esc(archiveItemHref('works',w.id,'#/'))}" aria-label="${esc(t(w.title))}"><div class="home-card-media${item.contain?' home-media-contain':''}"><img src="${item.image}" alt="${esc(t(item.alt))}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async"></div><div class="home-card-caption"><p class="home-card-kicker">${esc(t(item.label))}</p><h3>${esc(t(item.title))}${arrow}</h3><p class="home-card-credit">${t(['学生作品','Student work'])} / ${esc(w.authors.join(' · '))}</p></div></a></article>`;}).join('')}</div></section>`;
  }

  function homeToolGallery(){
    const selected=['mindscape-i','focus','mindscape-lab','mindscape-studio'].map(id=>projects.find(p=>p.id===id));
    return `<section class="home-section home-tools" aria-labelledby="home-tools-title"><div class="home-section-heading"><h2 id="home-tools-title">${t(['工具与原型','Tools & prototypes'])}</h2>${link('#/projects','全部项目','All projects')}</div><div class="home-tool-grid">${selected.map(p=>`<article class="home-image-card home-product-card" id="project-${esc(p.id)}"><a class="home-card-link" href="${esc(archiveItemHref('projects',p.id,'#/'))}"><div class="home-card-media${p.id==='mindscape-i'?' home-device-media':' home-interface-media'}"><img src="${esc(p.cover)}" alt="${esc(t(p.coverAlt))}" width="${p.coverWidth||1440}" height="${p.coverHeight||960}" loading="lazy" decoding="async"></div><div class="home-card-caption"><p class="home-card-kicker">${esc(t(p.type))} · ${esc(t(p.stage))}</p><h3>${esc(t(p.title))}${arrow}</h3><p class="home-card-description">${esc(t(p.subtitle))}</p></div></a>${p.id==='mindscape-lab'?toolAction(p,'home-tool-launch'):''}</article>`).join('')}</div><a class="home-atlas-card" href="#/research/figures"><div class="home-atlas-images" aria-hidden="true">${['M006','M008','M001'].map(id=>`<img src="assets/atlas-preview-${id}.webp" alt="" width="640" height="${id==='M006'?408:id==='M008'?415:248}" loading="lazy" decoding="async">`).join('')}</div><div class="home-atlas-copy"><p class="home-card-kicker">${t(['研究资源 · 外部文献','Research resource · external literature'])}</p><h3>${t(['从图像进入研究。','A visual entry into research.'])}${arrow}</h3><p>${t(['文献图集 · 2,070幅图像，连接图注与原始论文。','Research Figure Atlas · 2,070 figures linked to captions and source papers.'])}</p></div></a></section>`;
  }

  function researchNavigation(active){
    const items=[
      ['themes','#/research',['研究方向','Themes'],themes.length],
      ['papers','#/publications',['团队论文','Publications'],papers.length],
      ['figures','#/research/figures',['文献图集','Figure atlas'],window.LAB_RESOURCES?.summary.figures||2070]
    ];
    return `<nav class="research-section-nav" aria-label="${t(['研究栏目导航','Research section navigation'])}"><ul>${items.map(([id,url,label,count])=>`<li><a href="${url}"${id===active?' aria-current="page"':''}>${esc(t(label))}<span>${count.toLocaleString('en-US')}</span></a></li>`).join('')}</ul></nav>`;
  }

  function researchToolLinks(theme){
    const entries=[
      ['mindscape-lab','Mindscape Lab',['场景任务、条件比较与研究记录','Scene tasks, condition comparisons, and study records']],
      ['mindscape-studio','Mindscape Studio',['从现场需求到空间方案与逐版修改','From site briefs to spatial designs and versioned refinement']],
      ['focus','Mindscape Focus',['专注、休息与返回任务的空间体验','Spatial experiences for focus, rest, and return']],
      ['mindscape-i','Mindscape I',['日常任务中的认知支持原型','A cognitive support prototype for everyday tasks']]
    ];
    const matching=entries.filter(([id])=>!theme||projects.find(p=>p.id===id)?.themes.includes(theme.id));
    return `<section class="research-tool-entries" aria-labelledby="research-tools-title"><div>${eye('研究工具与原型','RESEARCH TOOLS & PROTOTYPES')}<h2 id="research-tools-title">${t(['将研究问题带入情境。','Bring research questions into context.'])}</h2></div><div class="research-tool-links">${matching.map(([id,title,description])=>`<a href="#/projects/${id}"><span><strong>${title}</strong><span>${esc(t(description))}</span></span>${arrow}</a>`).join('')}</div></section>`;
  }

  function research(selected){
    const selectedTheme=themes.find(th=>th.id===selected);
    const shown=selectedTheme?[selectedTheme]:themes;
    const themeNavigation=selectedTheme?`<nav class="research-theme-nav" aria-label="${t(['切换研究方向','Research themes'])}"><a href="#/research">${t(['全部方向','All themes'])}</a>${themes.map(th=>`<a href="#/research/${th.id}"${th===selectedTheme?' aria-current="page"':''}>${esc(t(th.name))}</a>`).join('')}</nav>`:'';
    const introduction=selectedTheme?`<section class="research-theme-intro" aria-labelledby="research-question-title"><div><p class="eyebrow">${t(['研究问题','RESEARCH QUESTION'])}</p><div class="project-tags">${selectedTheme.tags.map(a=>`<span>${esc(a.split(' / ')[lang==='zh'?0:1])}</span>`).join('')}</div></div><div><h2 id="research-question-title">${esc(t(selectedTheme.question))}</h2><p>${esc(t(selectedTheme.approach))}</p>${link('#/projects?theme='+selectedTheme.id,'探索相关项目','Explore related projects')}</div></section>`:`<div class="research-list research-list-cards">${shown.map(th=>`<section class="research-row research-card"><span class="theme-n">${th.n}</span>${themeSymbol(th.id)}<div><h2><a href="#/research/${th.id}">${esc(t(th.name))}${arrow}</a></h2><p class="en-label">${esc(lang==='zh'?th.name[1]:th.name[0])}</p><div class="project-tags">${th.tags.map(a=>`<span>${esc(a.split(' / ')[lang==='zh'?0:1])}</span>`).join('')}</div></div><div><h3>${esc(t(th.question))}</h3><p>${esc(t(th.approach))}</p>${link('#/research/'+th.id,'探索研究方向','Explore this theme')}</div></section>`).join('')}</div>`;
    return `<section class="page-heading research-page-heading${selectedTheme?' research-theme-heading':''}">${eye(selectedTheme?'RESEARCH THEME / '+selectedTheme.n:'RESEARCH / 01',selectedTheme?'RESEARCH THEME / '+selectedTheme.n:'RESEARCH / 01')}<h1>${selectedTheme?esc(t(selectedTheme.name)):t(['研究方向','Research themes'])}<small>${selectedTheme?esc(lang==='zh'?selectedTheme.name[1]:selectedTheme.name[0]):'RESEARCH THEMES'}</small></h1><p>${selectedTheme?esc(t(selectedTheme.text)):t(['从空间问题出发，观察人的感知、行动与设计回应。三条路径各自聚焦，又在具体项目中相互连接。','Start with spatial questions, then follow perception, action, and design response. Three paths connect through concrete projects.'])}</p></section>${researchNavigation('themes')}${themeNavigation}${introduction}${researchPublications(selectedTheme)}<section class="method-strip">${eye('从问题到设计','FROM QUESTION TO DESIGN')}<div class="method-grid">${[
      [['01 / OBSERVE','01 / OBSERVE'],['观察','Observe'],['进入具体场景，理解环境、任务与体验。','Enter a real setting to understand environment, task, and experience.']],
      [['02 / QUESTION','02 / QUESTION'],['提出问题','Frame a question'],['把空间经验转化为可讨论的研究问题。','Turn spatial experience into an answerable research question.']],
      [['03 / PROTOTYPE','03 / PROTOTYPE'],['制作原型','Prototype'],['用数字空间、工具与交互表达研究判断。','Express research ideas through digital spaces, tools, and interactions.']],
      [['04 / REFLECT','04 / REFLECT'],['验证与修订','Test & reflect'],['结合记录和反馈，理解适用条件，再修订设计。','Use records and feedback to understand conditions and revise the design.']]
    ].map(x=>`<div class="method-step"><p class="eyebrow">${t(x[0])}</p><h3>${t(x[1])}</h3><p>${t(x[2])}</p></div>`).join('')}</div></section>${researchToolLinks(selectedTheme)}${researchAtlas()}`;
  }

  function researchAtlas(){
    const resource=window.LAB_RESOURCES || {summary:{figures:2070,articles:658,journals:135,recommended:373}};
    const previews=[
      ['M008','研究框架与理论关系','assets/atlas-preview-M008.webp'],
      ['M006','界面截图与实验场景','assets/atlas-preview-M006.webp'],
      ['M001','空间地图与区位分析','assets/atlas-preview-M001.webp']
    ];
    return `<section class="atlas-portal" aria-labelledby="atlas-portal-title"><div class="atlas-portal-copy"><div>${eye('研究资源 / 文献图集','RESEARCH RESOURCE / FIGURE ATLAS')}<h2 id="atlas-portal-title">${t(['从图像进入研究。','A visual entry into research.'])}</h2><p>${t(['以图像为线索，阅读空间、脑认知与设计研究。汇集研究框架、实验方法、空间分析与设计表达，连接图像、图注与原始文献。','Read research on space, cognition and design through its images. Explore conceptual frameworks, experimental methods, spatial analysis and design proposals, with captions and links to the original papers.'])}</p><div class="atlas-stats"><span><b>${resource.summary.figures}</b>${t(['幅图像','FIGURES'])}</span><span><b>${resource.summary.articles}</b>${t(['篇来源论文','PAPERS'])}</span><span><b>${resource.summary.recommended}</b>${t(['幅优先参考','PRIORITY'])}</span></div><a class="portal-link" href="#/research/figures">${t(['浏览图集','Explore the atlas'])}${arrow}</a></div></div><div class="atlas-portal-preview" aria-label="${t(['论文图像预览','Figure atlas preview'])}">${previews.map(([id,label,src])=>`<a href="#/research/figures?q=${id}" class="atlas-preview"><img src="${src}" alt="${esc(label)}"><span>${id} / ${esc(label)}</span></a>`).join('')}</div></section>`;
  }

  const matchesResearchTheme = (paper,theme) => !theme||(theme.paperTopics||[]).some(topic=>paper.topics.includes(topic));
  function researchPublications(theme){
    const matching=theme?papers.filter(p=>matchesResearchTheme(p,theme)):papers;
    const archive=theme?'#/publications?theme='+theme.id:'#/publications';
    return `<section class="merged-archive-section research-publications" id="research-publications" aria-labelledby="research-publications-title"><div class="section-header"><div>${eye(theme?'相关成果':'论文档案',theme?'RELATED PUBLICATIONS':'PUBLICATIONS')}<h2 id="research-publications-title">${t(['团队论文','Lab publications'])}<small>${theme?t([`${matching.length} 篇相关论文`,`${matching.length} RELATED PAPERS`]):'PUBLICATIONS'}</small></h2></div><div class="merged-links">${link(archive,theme?'查看本方向论文':'查看完整论文档案',theme?'View papers in this theme':'View full publication archive')}${link('#/research/figures','浏览图集','Explore the atlas')}</div></div><div class="research-paper-preview">${matching.slice(0,4).map(p=>`<a href="${esc(paperHref(p,archive))}"><span>${p.year} / ${esc(t([p.journal,p.journalEn]))}</span><h3>${esc(p.title)}</h3><p>${esc(p.authors.join(' · '))}</p>${arrow}</a>`).join('')}</div>${!matching.length?`<p class="research-empty">${t(['本方向的团队论文尚在整理，可先浏览完整论文档案。','Publications for this theme are being organized. Browse the full archive in the meantime.'])}</p>`:''}</section>`;
  }

  function figureAtlasPage(params){
    const resource=window.LAB_RESOURCES || {summary:{figures:2070,articles:658,journals:135,recommended:373},categories:[]};
    const categories=resource.categories || [];
    return `<section class="page-heading atlas-heading">${eye('RESEARCH / COLLECTION','RESEARCH / COLLECTION')}<h1>${t(['文献图集','Research Figure Atlas'])}<small>${t(['RESEARCH FIGURE ATLAS','SPACE, COGNITION & DESIGN'])}</small></h1><p>${t(['以图像为线索，阅读空间、脑认知与设计研究。汇集研究框架、实验方法、空间分析与设计表达，连接图像、图注与原始文献。','Read research on space, cognition and design through its images. Explore conceptual frameworks, experimental methods, spatial analysis and design proposals, with captions and links to the original papers.'])}</p><nav class="breadcrumbs atlas-breadcrumbs"><a href="#/research">${t(['研究','Research'])}</a><span>/</span><span>${t(['文献图集','Research Figure Atlas'])}</span></nav></section>${researchNavigation('figures')}<section class="atlas-workbench" id="atlas-workbench" aria-labelledby="atlas-workbench-title"><div class="atlas-workbench-head"><div><p class="eyebrow">${t(['图像与文献','FIGURES & PAPERS'])}</p><h2 id="atlas-workbench-title">${t(['从图像进入研究。','A visual entry into research.'])}</h2></div><div class="atlas-stats atlas-stats-dark"><span><b>${resource.summary.figures}</b>${t(['幅图像','FIGURES'])}</span><span><b>${resource.summary.articles}</b>${t(['篇来源论文','PAPERS'])}</span><span><b>${resource.summary.journals}</b>${t(['个出版来源','SOURCES'])}</span><span><b>${resource.summary.recommended}</b>${t(['幅优先参考','PRIORITY'])}</span></div></div><div class="atlas-provenance"><span>${t(['领域参考文献','FIELD LITERATURE'])}</span><p>${t(['本图集收录领域文献的研究图像。','Research images collected from the wider field.'])}<a href="#/publications">${t(['查看团队论文','View Lab publications'])} ${directionIcon('right')}</a></p></div><div class="atlas-controls"><label class="search-box"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 5 5"/></svg><input id="atlas-search" type="search" aria-label="${t(['搜索文献图像','Search figures'])}" placeholder="${t(['搜索题名、图注、期刊、DOI…','Search title, caption, journal, DOI…'])}" value="${esc(params.get('q')||'')}" autocomplete="off"></label><label class="archive-select"><span>${t(['用途','Use'])}</span><select id="atlas-category" aria-label="${t(['按研究用途筛选','Filter by research use'])}"><option value="">${t(['全部用途','All uses'])}</option>${categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><label class="atlas-check"><input id="atlas-recommended" type="checkbox" ${params.get('recommended')==='1'?'checked':''}>${t(['优先参考','Priority references'])}</label><button class="atlas-clear" id="atlas-clear" type="button" aria-label="${t(['清除全部筛选','Clear all filters'])}">${t(['清除全部','Clear all'])}<span aria-hidden="true">${directionIcon('reset')}</span></button></div><div class="atlas-active-filters" id="atlas-active-filters" aria-label="${t(['当前筛选','Active filters'])}" hidden></div><div class="atlas-status"><span id="atlas-result-count" role="status" aria-live="polite">${t(['正在载入图像…','Loading figures…'])}</span><span id="atlas-paper-count"></span></div><div class="atlas-error" id="atlas-error" hidden><p>${t(['图像资料暂时未连接。当前页面保留研究入口，稍后可重试。','The figure catalog is temporarily unavailable. The research entry remains available; try again later.'])}</p><button id="atlas-retry" type="button">${t(['重新载入','Retry'])}</button></div><p id="atlas-link-status" class="atlas-link-status" role="status" hidden></p><div class="atlas-grid" id="atlas-grid"></div><div class="atlas-more"><button class="solid-button" id="atlas-more" type="button" hidden>${t(['加载更多图像','Load more figures'])}${arrow}</button></div></section><section class="atlas-note"><p>${t(['图像版权归原作者及出版方；使用条件以各条许可记录为准。外部文献不等同于实验室发表成果。','Images remain subject to their authors and publishers. Check each license before reuse. External references are not Lab publications.'])}</p><a href="tools/figure-atlas/NOTICE.md" target="_blank" rel="noopener noreferrer">${(t(['来源与使用说明','Sources & use notes'])+directionIcon('ne'))}</a></section><dialog id="atlas-viewer" class="atlas-viewer" aria-labelledby="atlas-viewer-title"><div class="atlas-viewer-top"><span id="atlas-viewer-meta"></span><div class="atlas-viewer-actions"><button id="atlas-share" type="button">${t(['复制图像链接','Copy figure link'])}</button><button id="atlas-viewer-close" class="icon" type="button" aria-label="${t(['关闭图像','Close figure'])}">×</button></div></div><div class="atlas-viewer-body"><div class="atlas-image-column"><div class="atlas-viewer-image"><img id="atlas-viewer-image" alt=""><div id="atlas-image-error" class="atlas-image-error" hidden><p>${t(['预览暂时无法载入，仍可阅读图注或查看论文原文。','The preview could not load. You can still read the caption or open the paper.'])}</p><button id="atlas-image-retry" type="button">${t(['重新载入图像','Retry image'])}</button></div></div><div class="atlas-preview-label">${t(['图像预览 · 完整图像见来源原图','Collection preview · full image at source'])}</div><section class="atlas-paper-figures" aria-labelledby="atlas-paper-position"><div class="atlas-paper-heading"><h3 id="atlas-paper-position" aria-live="polite"></h3><div><button id="atlas-paper-prev" type="button" aria-label="${t(['同篇上一幅','Previous figure from this paper'])}">${directionIcon('left')}</button><button id="atlas-paper-next" type="button" aria-label="${t(['同篇下一幅','Next figure from this paper'])}">${directionIcon('right')}</button></div></div><div id="atlas-paper-thumbs" class="atlas-paper-thumbs"></div></section></div><div class="atlas-viewer-copy"><p class="eyebrow atlas-source-label">${t(['来源论文 / 领域文献','SOURCE PAPER / FIELD LITERATURE'])}</p><h2 id="atlas-viewer-title"></h2><p class="muted" id="atlas-viewer-journal"></p><p id="atlas-viewer-doi"></p><div class="atlas-viewer-links"><a id="atlas-viewer-article" target="_blank" rel="noopener noreferrer">${(t(['论文原文','Paper'])+directionIcon('ne'))}</a><a id="atlas-viewer-source" target="_blank" rel="noopener noreferrer">${(t(['来源原图','Source image'])+directionIcon('ne'))}</a></div><p id="atlas-share-status" class="atlas-share-status" role="status" aria-live="polite"></p><label id="atlas-share-fallback" class="atlas-share-fallback" hidden><span>${t(['图像链接','Figure link'])}</span><input id="atlas-share-url" type="text" readonly></label><h3>${t(['阅读提示','Reading notes'])}</h3><p id="atlas-viewer-note"></p><p class="eyebrow" id="atlas-viewer-category"></p><h3>${t(['原文图注','Original caption'])}</h3><p id="atlas-viewer-caption"></p><h3>${t(['出处与许可','Source & license'])}</h3><p id="atlas-viewer-license"></p></div></div></dialog>`;
  }

  function atlasAsset(value){
    return /^(images|thumbnails)\/[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|svg)$/i.test(value||'')?`tools/figure-atlas/${value}`:'';
  }

  function atlasCard(record){
    const title=record.shortTitle||record.title;
    return `<article class="atlas-card"><button class="atlas-card-image" type="button" data-atlas-id="${esc(record.id)}" aria-label="${esc(t(['查看 '+title,'View '+title]))}"><img src="${esc(atlasAsset(record.thumbnail))}" alt="${esc(title)}"${record.width>0&&record.height>0?` width="${Number(record.width)}" height="${Number(record.height)}"`:""} loading="lazy"></button><div class="atlas-card-copy"><h3 title="${esc(title)}">${esc(title)}</h3><p title="${esc(record.journal)}">${esc(record.journal)}</p></div></article>`;
  }

  function atlasMasonry(grid){
    let frame=0,disposed=false,width=0;
    const observed=new Set();
    const layout=()=>{
      frame=0;
      if(disposed||!grid.isConnected)return;
      const styles=getComputedStyle(grid);
      const columns=Math.max(1,parseInt(styles.getPropertyValue('--atlas-columns'),10)||2);
      const gap=parseFloat(styles.getPropertyValue('--atlas-gap'))||14;
      const cards=[...grid.querySelectorAll('.atlas-card')];
      grid.classList.toggle('is-masonry',cards.length>0);
      cards.forEach(card=>{card.style.gridColumn='auto';card.style.gridRow='auto';});
      const heights=cards.map(card=>card.getBoundingClientRect().height);
      const ends=Array(columns).fill(0);
      cards.forEach((card,i)=>{
        const column=ends.indexOf(Math.min(...ends));
        const start=ends[column],height=Math.ceil(heights[i]);
        card.style.gridColumn=String(column+1);
        card.style.gridRow=`${start+1} / span ${height}`;
        ends[column]=start+height+gap;
      });
    };
    const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(layout);};
    const observer=new ResizeObserver(entries=>{
      if(entries.some(entry=>entry.target!==grid))schedule();
      const current=grid.getBoundingClientRect().width;
      if(current!==width){width=current;schedule();}
    });
    observer.observe(grid);
    const refresh=()=>{
      for(const card of observed){if(!card.isConnected){observer.unobserve(card);observed.delete(card);}}
      grid.querySelectorAll('.atlas-card').forEach(card=>{if(!observed.has(card)){observed.add(card);observer.observe(card);}});
      // Apply before append focus so the new card already has its final position.
      if(frame)cancelAnimationFrame(frame);layout();
    };
    cleanupAtlasLayout=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();observed.clear();};
    document.fonts.ready.then(schedule);
    return refresh;
  }

  function bindFigureAtlas(params){
    const search=document.getElementById('atlas-search');
    if(!search)return;
    const category=document.getElementById('atlas-category');
    const recommended=document.getElementById('atlas-recommended');
    const grid=document.getElementById('atlas-grid');
    const layoutFigures=atlasMasonry(grid);
    const count=document.getElementById('atlas-result-count');
    const paperCount=document.getElementById('atlas-paper-count');
    const more=document.getElementById('atlas-more');
    const error=document.getElementById('atlas-error');
    const dialog=document.getElementById('atlas-viewer');
    const thumbs=document.getElementById('atlas-paper-thumbs');
    const image=document.getElementById('atlas-viewer-image');
    const retry=document.getElementById('atlas-retry');
    const linkStatus=document.getElementById('atlas-link-status');
    const activeFilters=document.getElementById('atlas-active-filters');
    const clearFilters=document.getElementById('atlas-clear');
    const baseTitle=document.title;
    const parsedLimit=/^\d+$/.test(params.get('shown')||'')?Number(params.get('shown')):24;
    let records=[],filtered=[],limit=Math.max(24,Math.min(2088,Math.ceil(parsedLimit/24)*24)),current=null;
    let loaded=false,returnTarget=null,siblings=[],siblingKey=null,requestedFigure=params.get('figure');
    const byId=new Map(),byPaper=new Map();
    const paperKey=r=>r.doi?'doi:'+r.doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').toLowerCase():r.sourceId?'source:'+r.sourceId:r.articleUrl?'url:'+r.articleUrl:'figure:'+r.id;
    const updateUrl=()=>{
      const query=new URLSearchParams();
      if(search.value.trim())query.set('q',search.value.trim());
      if(category.value)query.set('category',category.value);
      if(recommended.checked)query.set('recommended','1');
      if(limit>24)query.set('shown',String(limit));
      if(current)query.set('figure',current.id);
      history.replaceState(history.state,'',`#/research/figures${query.size?'?'+query:''}`);
    };
    const loadImage=()=>{
      document.getElementById('atlas-image-error').hidden=true;image.hidden=false;
      image.onload=()=>{image.hidden=false;document.getElementById('atlas-image-error').hidden=true;};
      image.onerror=()=>{image.hidden=true;document.getElementById('atlas-image-error').hidden=false;};
      image.src=atlasAsset(current.thumbnail);
    };
    const showFigure=(record,trigger)=>{
      if(!record||!search.isConnected)return;
      const opening=!dialog.open;
      if(opening)returnTarget=trigger||grid.querySelector(`[data-atlas-id="${record.id}"]`)||search;
      current=record;
      image.alt=record.caption||record.shortTitle||record.title;loadImage();
      document.getElementById('atlas-viewer-meta').textContent=`${record.id} · ${record.figureNumber||t(['文献图像','Figure'])}`;
      document.getElementById('atlas-viewer-category').textContent=(record.category||'').replace(/^\d+[_\s]+/,'');
      document.getElementById('atlas-viewer-title').textContent=record.title||record.shortTitle||'';
      document.getElementById('atlas-viewer-journal').textContent=[record.journal,record.year].filter(Boolean).join(' · ');
      document.getElementById('atlas-viewer-note').textContent=record.note||'';
      document.getElementById('atlas-viewer-caption').textContent=record.caption||'';
      document.getElementById('atlas-viewer-license').textContent=record.license||'';
      const doi=document.getElementById('atlas-viewer-doi');doi.hidden=!record.doi;doi.textContent=record.doi?'DOI '+record.doi:'';
      const article=document.getElementById('atlas-viewer-article');article.href=record.articleUrl||'#';article.hidden=!record.articleUrl;
      const source=document.getElementById('atlas-viewer-source');source.href=record.sourceImageUrl||'#';source.hidden=!record.sourceImageUrl;
      document.getElementById('atlas-share-status').textContent='';document.getElementById('atlas-share-fallback').hidden=true;
      const key=paperKey(record);
      if(key!==siblingKey){
        siblingKey=key;siblings=byPaper.get(key)||[record];
        thumbs.innerHTML=siblings.map(r=>`<button type="button" data-paper-figure="${esc(r.id)}" aria-label="${esc(r.id+' · '+r.figureNumber+' · '+(r.shortTitle||r.title))}"><img src="${esc(atlasAsset(r.thumbnail))}" alt="" loading="lazy"><span>${esc(r.figureNumber||r.id)}</span></button>`).join('');
        thumbs.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>showFigure(byId.get(btn.dataset.paperFigure))));
      }
      const index=siblings.findIndex(r=>r.id===record.id);
      document.getElementById('atlas-paper-position').textContent=t([`同篇收录 · ${index+1} / ${siblings.length}`,`From this paper · ${index+1} / ${siblings.length}`]);
      thumbs.hidden=siblings.length<2;
      document.getElementById('atlas-paper-prev').disabled=index<=0;
      document.getElementById('atlas-paper-next').disabled=index>=siblings.length-1;
      thumbs.querySelectorAll('button').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.paperFigure===record.id)));
      document.querySelector('.atlas-viewer-copy').scrollTop=0;
      updateUrl();document.title=`${record.id} · ${record.title} — ${t(['文献图集','Research Figure Atlas'])}`;
      if(opening){dialog.showModal();dialog.scrollTop=0;document.getElementById('atlas-viewer-close').focus({preventScroll:true});}
      requestAnimationFrame(()=>{if(dialog.open&&current===record)thumbs.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});
    };
    const searchTerms=()=>search.value.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matchesTerms=(record,terms)=>{
      const hay=[record.id,record.sourceId,record.title,record.shortTitle,record.caption,record.note,record.journal,record.doi,...(record.tags||[])].join(' ').normalize('NFKC').toLocaleLowerCase();
      return terms.every(term=>hay.includes(term));
    };
    const renderFilters=()=>{
      const items=[];
      if(search.value.trim())items.push(['q',t(['关键词','Query']),search.value.trim()]);
      if(category.value)items.push(['category',t(['用途','Use']),category.selectedOptions[0].textContent]);
      if(recommended.checked)items.push(['recommended',t(['筛选','Filter']),t(['优先参考','Priority references'])]);
      clearFilters.disabled=!items.length;
      activeFilters.hidden=!items.length;
      activeFilters.innerHTML=items.length?`<span>${t(['当前筛选','Active filters'])}</span><ul>${items.map(([key,label,value])=>`<li><button type="button" data-atlas-remove="${key}" aria-label="${esc(t([`移除${label}：${value}`,`Remove ${label}: ${value}`]))}"><span>${esc(label)}: ${esc(value)}</span><span aria-hidden="true">×</span></button></li>`).join('')}</ul>`:'';
    };
    const resetFilters=(keepQuery=false)=>{
      if(!keepQuery)search.value='';
      category.value='';recommended.checked=false;
      apply();search.focus({preventScroll:true});
    };
    const emptyFigures=()=>{
      const broadCount=search.value.trim()&&(category.value||recommended.checked)?records.filter(r=>matchesTerms(r,searchTerms())).length:0;
      return `<div class="atlas-empty"><p class="eyebrow">NO MATCHES</p><h3>${t(['没有匹配的图像','No matching figures'])}</h3><p>${t(['可以逐项移除上方条件，或重新开始检索。','Remove a filter above or start a new search.'])}</p><div class="atlas-empty-actions">${broadCount?`<button type="button" data-atlas-relax>${t([`保留关键词，查看 ${broadCount} 幅图像`,`Keep query · view ${broadCount} figures`])}<span aria-hidden="true">${directionIcon('right')}</span></button>`:''}<button type="button" data-atlas-reset>${t(['浏览全部图像','Browse all figures'])}<span aria-hidden="true">${directionIcon('right')}</span></button></div></div>`;
    };
    const bindCards=nodes=>nodes.forEach(btn=>btn.addEventListener('click',()=>showFigure(byId.get(btn.dataset.atlasId),btn)));
    const render=(append=false)=>{
      const shown=filtered.slice(0,limit),previous=append?grid.querySelectorAll('.atlas-card').length:0;
      if(append){
        grid.insertAdjacentHTML('beforeend',shown.slice(previous).map(atlasCard).join(''));
        bindCards([...grid.querySelectorAll('.atlas-card')].slice(previous).flatMap(card=>[...card.querySelectorAll('[data-atlas-id]')]));
      }else{
        grid.innerHTML=shown.length?shown.map(atlasCard).join(''):emptyFigures();
        bindCards([...grid.querySelectorAll('[data-atlas-id]')]);
      }
      count.textContent=t([`${filtered.length} 幅图像 · 已显示 ${shown.length} 条`,`${filtered.length} FIGURES · ${shown.length} SHOWN`]);
      paperCount.textContent=t([`${new Set(filtered.map(paperKey)).size} 篇来源论文`,`${new Set(filtered.map(paperKey)).size} SOURCE PAPERS`]);
      more.hidden=shown.length>=filtered.length;
      layoutFigures();
      bindPointerMotion();
      if(append)grid.querySelectorAll('.atlas-card')[previous]?.querySelector('button')?.focus({preventScroll:true});
    };
    const apply=(resetLimit=true)=>{
      if(resetLimit){limit=24;requestedFigure=null;}
      linkStatus.hidden=true;renderFilters();
      if(!loaded){updateUrl();return;}
      const terms=searchTerms();
      filtered=records.filter(record=>matchesTerms(record,terms)&&(!category.value||category.value===record.category)&&(!recommended.checked||record.recommended));
      updateUrl();render();
    };
    const load=async()=>{
      error.hidden=true;retry.disabled=true;count.textContent=t(['正在载入图像…','Loading figures…']);
      try{
        const response=await fetch('tools/figure-atlas/data/catalog.json',{cache:'no-store'});
        if(!response.ok)throw new Error('catalog unavailable');
        const catalog=await response.json();
        if(!search.isConnected)return;
        if(!Array.isArray(catalog.records))throw new Error('catalog invalid');
        records=catalog.records.slice().sort((a,b)=>Number(String(a.id).replace(/^M/,''))-Number(String(b.id).replace(/^M/,'')));
        byId.clear();byPaper.clear();
        records.forEach(r=>{byId.set(r.id,r);const key=paperKey(r);if(!byPaper.has(key))byPaper.set(key,[]);byPaper.get(key).push(r);});
        byPaper.forEach(items=>items.sort((a,b)=>(a.figureNumber||a.id).localeCompare(b.figureNumber||b.id,undefined,{numeric:true})));
        if(category.options.length<=1){
          const selected=category.value||params.get('category');
          category.replaceChildren(new Option(t(['全部用途','All uses']),''));
          [...new Set(records.map(r=>r.category))].sort().forEach(value=>category.append(new Option(value,value)));
          category.value=selected||'';
        }
        loaded=true;apply(false);
        const requested=requestedFigure;
        if(requested){
          if(byId.has(requested))showFigure(byId.get(requested));
          else{linkStatus.hidden=false;linkStatus.textContent=t(['这张图像未在图集中找到。可以继续检索其他图像。','This figure was not found in the atlas. You can continue searching below.']);}
        }
      }catch{
        if(!search.isConnected)return;
        loaded=false;records=[];filtered=[];error.hidden=false;grid.innerHTML='';more.hidden=true;count.textContent=t(['图像资料暂时未连接','Figure catalog unavailable']);paperCount.textContent='';
      }finally{if(search.isConnected)retry.disabled=false;}
    };
    category.value=params.get('category')||'';
    search.addEventListener('input',()=>apply());category.addEventListener('change',()=>apply());recommended.addEventListener('change',()=>apply());
    renderFilters();
    clearFilters.addEventListener('click',()=>resetFilters());
    activeFilters.addEventListener('click',event=>{
      const key=event.target.closest('[data-atlas-remove]')?.dataset.atlasRemove;
      if(!key)return;
      const control={q:search,category,recommended}[key];
      if(!control)return;
      if(key==='recommended')control.checked=false;else control.value='';
      apply();control.focus({preventScroll:true});
    });
    grid.addEventListener('click',event=>{
      if(event.target.closest('[data-atlas-relax]'))resetFilters(true);
      else if(event.target.closest('[data-atlas-reset]'))resetFilters();
    });
    more.addEventListener('click',()=>{limit+=24;updateUrl();render(true);});
    retry.addEventListener('click',load);
    document.getElementById('atlas-image-retry').addEventListener('click',loadImage);
    document.getElementById('atlas-viewer-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{
      if(!search.isConnected)return;
      current=null;updateUrl();document.title=baseTitle;
      const target=returnTarget?.isConnected?returnTarget:search;
      target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',behavior:'instant'});
    });
    document.getElementById('atlas-paper-prev').addEventListener('click',()=>{const i=siblings.findIndex(r=>r.id===current.id);if(i>0)showFigure(siblings[i-1]);});
    document.getElementById('atlas-paper-next').addEventListener('click',()=>{const i=siblings.findIndex(r=>r.id===current.id);if(i<siblings.length-1)showFigure(siblings[i+1]);});
    document.getElementById('atlas-share').addEventListener('click',async()=>{
      const record=current,url=location.href,status=document.getElementById('atlas-share-status');
      try{await navigator.clipboard.writeText(url);if(current===record&&dialog.open)status.textContent=t(['图像链接已复制','Figure link copied']);}
      catch{
        if(current!==record||!dialog.open)return;
        const fallback=document.getElementById('atlas-share-fallback'),input=document.getElementById('atlas-share-url');
        fallback.hidden=false;input.value=url;input.focus();input.select();status.textContent=t(['请选择并复制下方链接','Select and copy the link below']);
      }
    });
    load();
  }

  const isResearchTool = p => ['figure-atlas','mindscape-lab','mindscape-studio'].includes(p.id);
  function archiveToolShortcuts(){
    const studio=projects.find(p=>p.id==='mindscape-studio');
    return `<nav class="archive-tool-shortcuts" aria-label="${t(['研究工具直达','Research tool shortcuts'])}"><p class="eyebrow">${t(['研究工具','RESEARCH TOOLS'])}</p><a href="#/research/figures" aria-label="${t(['浏览文献图集','Browse the Research Figure Atlas'])}"><span><strong>${t(['文献图集','Research Figure Atlas'])}</strong><small>${t(['658 篇论文 · 2,070 幅图像','658 papers · 2,070 figures'])}</small></span><span aria-hidden="true">${directionIcon('right')}</span></a><a href="#/projects/mindscape-lab"><span><strong>Mindscape Lab</strong><small>${t(['场景任务 · 条件比较 · 研究记录','Scenes · conditions · study records'])}</small></span><span aria-hidden="true">${directionIcon('right')}</span></a><a href="${esc(studio.externalUrl||'#/projects/mindscape-studio')}"${studio.externalUrl?' target="_blank" rel="noopener noreferrer"':''} aria-label="${studio.externalUrl?t(['打开 Mindscape Studio（本机原型，新窗口）','Open Mindscape Studio (local prototype, new window)']):t(['查看 Mindscape Studio 项目介绍','View the Mindscape Studio project'])}"><span><strong>Mindscape Studio</strong><small>${studio.externalUrl?t(['空间设计工作台 · 本机原型','Spatial design · local prototype']):t(['空间设计工作台 · 原型预览','Spatial design · prototype preview'])}</small></span>${arrow}</a></nav>`;
  }
  const archiveCollections = [
    {id:'all',name:['全部内容','All'],count:()=>works.length+projects.length},
    {id:'works',name:['学生作品','Student work'],count:()=>works.length},
    {id:'tools',name:['研究工具','Research tools'],count:()=>projects.filter(isResearchTool).length},
    {id:'prototypes',name:['交互原型','Prototypes'],count:()=>projects.filter(p=>!isResearchTool(p)).length}
  ];

  function archive(params){
    const collection=archiveCollections.some(c=>c.id===params.get('collection'))?params.get('collection'):'all';
    const theme=themes.some(th=>th.id===params.get('theme'))?params.get('theme'):'all';
    return `<section class="page-heading projects-heading"><div><p class="eyebrow section-mark">PROJECT ARCHIVE / 02</p><h1>${t(['项目','Projects'])}<small>RESEARCH, TOOLS & WORKS</small></h1><p>${t(['通过学生作品、研究工具与交互原型，探索空间、脑认知与设计的连接。','Explore the connections between space, cognition, and design through student work, research tools, and prototypes.'])}</p></div>${archiveToolShortcuts()}</section><p class="eyebrow archive-filter-label">${t(['内容类型','CONTENT TYPE'])}</p><div class="archive-collections" role="group" aria-label="${t(['按内容类型筛选','Filter by content type'])}">${archiveCollections.map(c=>`<button type="button" data-collection="${c.id}" aria-pressed="${collection===c.id}">${esc(t(c.name))}<span>${String(c.count()).padStart(2,'0')}</span></button>`).join('')}</div><div class="archive-toolbar unified-toolbar"><label class="archive-select"><span>${t(['研究方向','Research theme'])}</span><select id="project-theme" aria-label="${t(['按研究方向筛选','Filter by research theme'])}"><option value="all">${t(['全部方向','All themes'])}</option>${themes.map(th=>`<option value="${th.id}" ${theme===th.id?'selected':''}>${esc(t(th.name))}</option>`).join('')}</select></label><label class="search-box"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 5 5"/></svg><input id="project-search" type="search" aria-label="${t(['搜索项目与作品','Search projects and work'])}" placeholder="${t(['搜索题名、作者、工具或关键词…','Search titles, authors, tools, or keywords…'])}" value="${esc(params.get('q')||'')}" autocomplete="off"></label></div><div class="project-filter-summary" id="project-active-filters" role="group" aria-label="${t(['当前筛选，可逐项移除','Active filters, remove individually'])}" hidden></div><p class="results-caption" id="result-count" role="status" aria-live="polite"></p><div id="archive-grid"></div>`;
  }

  function projectFigure(p){
    const image=projectMedia(p);
    const zoom=p.cover?`<a class="gallery-image interface-zoom-link" href="${esc(p.cover)}" data-pswp-width="${p.coverWidth||1440}" data-pswp-height="${p.coverHeight||960}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t(['查看大图：','View full image: '])+t(p.title))}">${image}<span>${(t(['查看大图','View full image'])+directionIcon('ne'))}</span></a>`:image;
    return `<figure class="detail-art"${p.cover?' data-project-interface="'+esc(p.id)+'"':''}>${zoom}<figcaption>${esc(t(p.caption))}${p.cover||p.art==='atlas'?'':` · ${t(['原创示意图','Original concept illustration'])}`}</figcaption></figure>`;
  }

  function detail(id,params){
    const p=projects.find(x=>x.id===id);
    if(!p)return missing();
    const back=archiveReturn(params,'#/projects','project-'+id);
    const fromHome=back.startsWith('#/?');
    const next=projects[(projects.indexOf(p)+1)%projects.length];
    const block=(zh,en,key)=>`<section class="detail-section"><h2>${t([zh,en])}<small>${lang==='zh'?en.toUpperCase():''}</small></h2><p>${esc(t(p[key]))}</p></section>`;
    const toolLink=p.id==='figure-atlas'?'#/research/figures':p.externalUrl;
    return `<nav class="breadcrumbs" aria-label="${t(['当前位置','Breadcrumb'])}">${!fromHome?`<a href="#/">${t(['探索','Explore'])}</a><span>/</span>`:''}<a href="${esc(back)}">${t(fromHome?['首页','Home']:['项目','Projects'])}</a><span>/</span><span>${esc(t(p.title))}</span></nav><section class="page-heading detail-heading">${eye(`${p.year} / ${t(p.type)}`,`${p.year} / ${t(p.type)}`)}<h1>${esc(t(p.title))}</h1><p>${esc(t(p.subtitle))}</p>${toolLink||p.publicPreviewOnly?`<div class="detail-tool-actions">${toolAction(p)}${['mindscape-studio','focus'].includes(p.id)&&!p.publicPreviewOnly?`<span class="tool-destination">${t(['本机原型 · 新窗口打开','Local prototype · opens in a new window'])}</span>`:p.id==='mindscape-lab'?`<span class="tool-destination">${t(['研究平台原型 · 登录使用 · 首次访问可能需要等待服务唤醒','Research prototype · sign-in required · the service may need time to wake'])}</span>`:''}</div>`:''}</section>${projectFigure(p)}<div class="detail-layout"><aside class="detail-sidebar"><dl><div><dt>${t(['年份','Year'])}</dt><dd>${p.year}</dd></div><div><dt>${t(['类型','Type'])}</dt><dd>${esc(t(p.type))}</dd></div><div><dt>${t(['当前阶段','Stage'])}</dt><dd>${esc(t(p.stage))}</dd></div></dl><div class="project-tags">${p.methods.map(m=>`<span>${esc(m.split(' / ')[lang==='zh'?0:1])}</span>`).join('')}</div>${link('mailto:wh-sa@mail.tsinghua.edu.cn', '项目事务联络','Project coordination')}</aside><div>${block('研究问题','Question','question')}${block('怎样展开','Approach','process')}${block('当前进展','Current stage','status')}${block('继续探索','Next questions','next')}</div></div><nav class="detail-next" aria-label="${t(['项目导航','Project navigation'])}"><a href="${esc(back)}"><span aria-hidden="true">${directionIcon('left')}</span>${t(fromHome?['返回首页','Back to home']:['返回项目','Back to projects'])}</a><div><p class="eyebrow">${t(['下一个项目','NEXT PROJECT'])}</p><a href="${esc(archiveItemHref('projects',next.id,archiveSource(params.get('from'))))}">${esc(t(next.title))}${arrow}</a></div></nav>`;
  }

  function about(){
    const practice=[
      ['mindscape-lab','Mindscape Lab',['场景任务、条件比较与研究记录','Scene tasks, condition comparisons, and study records']],
      ['mindscape-studio','Mindscape Studio',['从现场与需求出发，比较并迭代空间方案','Compare and refine spatial designs from sites and briefs']],
      ['focus','Mindscape Focus',['专注与休息的空间体验原型','Prototyping spatial experiences for concentration and rest']],
      ['mindscape-i','Mindscape I',['日常任务中的认知支持原型','Prototyping cognitive support for everyday tasks']]
    ];
    return `<section class="page-heading about-heading">${eye('ABOUT THE LAB / 03','ABOUT THE LAB / 03')}<h1>${t(['关于','About'])}<small>MINDSCAPE · RESEARCH & SCHOLARSHIP</small></h1><p>${t(['研究空间如何被感知、理解与使用，以及设计如何回应人的体验与行动。','Investigating how space is perceived, understood, and used—and how design responds to experience and action.'])}</p><nav class="about-index" aria-label="${t(['关于页目录','On this page'])}"><a class="about-jump" href="#/about?section=team">${t(['研究团队','Research team'])}<span aria-hidden="true">${directionIcon('down')}</span></a><a class="about-jump" href="#/about?section=practice">${t(['研究实践','Research practice'])}<span aria-hidden="true">${directionIcon('down')}</span></a><a class="about-jump" href="#/about?contact=1">${t(['联系交流','Get in touch'])}<span aria-hidden="true">${directionIcon('down')}</span></a></nav></section>
    <section class="about-intro"><div class="about-copy"><p class="about-affiliation"><a href="https://www.arch.tsinghua.edu.cn/" target="_blank" rel="noopener noreferrer">${t(['清华大学建筑学院','School of Architecture · Tsinghua University'])}${arrow}</a></p><h2>${t(['空间·脑·设计实验室','Space, Cognition & Design Lab'])}</h2><p>${t(['我们以建筑与城市空间为出发点，连接脑认知研究与设计实践。从日常环境中的空间线索，到数字情境中的行为任务，关注人在空间中的感知、注意、记忆与行动。','We connect research in cognition with design practice, starting from architectural and urban space. From environmental cues in everyday settings to behavioral tasks in digital environments, we study perception, attention, memory, and action in space.'])}</p><p>${t(['空间·脑·设计实验室是 Mindscape 的科研与学术交流平台，围绕具体的空间问题展开研究，以观察、实验和原型探索新的设计方法。','Space, Cognition & Design Lab is Mindscape’s platform for research and academic exchange. We investigate concrete spatial questions through observation, experiments, and prototypes to explore new approaches to design.'])}</p>${link('#/research','了解研究方向','Explore research themes')}</div><div class="about-graphic">${svg('<g fill="none" stroke="#191919" stroke-width="1"><rect x="115" y="100" width="315" height="315"/><circle cx="403" cy="256" r="165"/><path d="m280 90 200 330H80Z"/><path d="M80 420H590 M115 100 565 100" stroke-dasharray="4 5"/></g><circle cx="310" cy="263" r="11" fill="#f2f2f2"/><g font-family="Instrument Sans, Helvetica Neue, Arial, sans-serif" font-size="11" fill="#191919"><text x="118" y="80">SPACE</text><text x="500" y="80">COGNITION</text><text x="460" y="449">DESIGN</text></g>','0 0 650 500')}<p class="eyebrow">THINK ACROSS. MAKE CONNECTIONS.</p></div></section>
    <section class="about-facts lab-team" id="team" tabindex="-1" aria-labelledby="about-team-title"><h2 id="about-team-title">${t(['研究团队','Research team'])}</h2><div><div class="team-person"><h3>${t(['王辉','Hui Wang'])}</h3><p class="team-role">${t(['教授 · 清华大学建筑学院','Professor · School of Architecture, Tsinghua University'])}</p></div><p>${t(['实验室由王辉老师发起，关注空间研究、脑认知与设计的交叉。王辉老师的学术方向包括中国建筑与城市美学、城市更新设计、空间脑科学与设计交互。','The Lab was initiated by Professor Hui Wang to explore the intersection of spatial research, cognition, and design. His academic interests include Chinese architectural and urban aesthetics, urban regeneration design, and spatial neuroscience and design interaction.'])}</p><div class="about-team-links"><a class="text-link" href="https://www.arch.tsinghua.edu.cn/info/rw_jzx/1389" target="_blank" rel="noopener noreferrer">${t(['个人学术主页','Academic profile'])}${arrow}</a>${link('#/publications','团队论文','Team publications')}<a class="team-email" href="mailto:wh-sa@mail.tsinghua.edu.cn">wh-sa@mail.tsinghua.edu.cn ${directionIcon('ne')}</a></div></div></section>
    ${labSlogan()}
    <section class="about-facts about-practice" id="practice" tabindex="-1" aria-labelledby="about-practice-title"><h2 id="about-practice-title">${t(['研究实践','Research practice'])}</h2><div><p>${t(['从研究问题出发，将空间观察、行为任务与设计探索转化为可以使用和讨论的工具与原型。','Starting with research questions, we develop tools and prototypes for spatial observation, behavioral tasks, and design exploration.'])}</p><div class="about-practice-links">${practice.map(([id,title,description])=>`<a href="#/projects/${id}"><span class="about-practice-name">${title}${arrow}</span><span class="about-practice-description">${t(description)}</span></a>`).join('')}</div>${link('#/projects','浏览全部项目','Browse all projects')}</div></section>
    <section class="contact-block" id="contact" tabindex="-1" aria-labelledby="about-contact-title"><div>${eye('GET IN TOUCH','GET IN TOUCH')}<h2 id="about-contact-title">${t(['学术交流与合作','Academic exchange'])}</h2></div><div><p>${t(['欢迎围绕空间研究、脑认知、研究工具与设计实践展开交流。','We welcome conversations on spatial research, cognition, research tools, and design practice.'])}</p><a class="contact-email" href="mailto:wh-sa@mail.tsinghua.edu.cn">wh-sa@mail.tsinghua.edu.cn ${arrow}</a><div class="contact-actions"><button type="button" class="copy-button" id="copy-email">${t(['复制邮箱','Copy email'])}</button><span>${t(['研究合作联系','Research enquiries'])}</span></div><div class="contact-copy-fallback" id="contact-copy-fallback" hidden><label for="contact-copy-text">${t(['邮箱地址','Email address'])}</label><input id="contact-copy-text" type="text" readonly value="wh-sa@mail.tsinghua.edu.cn" aria-describedby="contact-copy-note"><p id="contact-copy-note">${t(['自动复制不可用，请复制上方已选中的邮箱地址。','Automatic copying is unavailable. Copy the selected email address above.'])}</p></div></div></section>`;
  }

  const paperTopicName = id => t(paperTopics.find(x=>x.id===id)?.name || [id,id]);
  const workCategoryName = id => t(workCategories.find(x=>x.id===id)?.name || [id,id]);
  const paperEdition = p => `${p.volume?','+p.volume:''}${p.issue?'('+p.issue+')':''}`;
  const paperImprint = p => p.publicationStatus==='online-first'?`${p.year} · ${t(['网络首发','Online first'])} · ${p.publishedDate}`:`${p.year}${paperEdition(p)}${p.pages?' · '+p.pages:''}`;
  const paperPdfLabel = p => p.pdfAccess==='provided'?t(['阅读全文 PDF','Read full text PDF']):t(['阅读开放全文 PDF','Read open full text PDF']);
  const citation = p => p.publicationStatus==='online-first'?`${p.authors.join(',')}.${p.title}[J/OL].${p.journal},${p.year}.网络首发：${p.publishedDate}.DOI:${p.doi}.`:`${p.authors.join(',')}.${p.title}[J].${p.journal},${p.year}${paperEdition(p)}${p.pages?':'+p.pages:''}.DOI:${p.doi}.`;
  const risRecord = p => {
    const pagination=String(p.pages).match(/^(\d+)(?:[-–](\d+))?/);
    return ['TY  - JOUR',...p.authors.map(a=>'AU  - '+a),'TI  - '+p.title,'JO  - '+p.journal,'PY  - '+p.year,
      ...(p.volume?['VL  - '+p.volume]:[]),...(p.issue?['IS  - '+p.issue]:[]),
      ...(pagination?['SP  - '+pagination[1],...(pagination[2]?['EP  - '+pagination[2]]:[])]:[]),
      ...(!pagination&&p.pages?['SP  - '+p.pages]:[]),
      ...(String(p.pages).includes('+')?['N1  - Pages: '+p.pages]:[]),
      ...(p.publicationStatus==='online-first'?['DA  - '+p.publishedDate.replace(/-/g,'/'),'N1  - Online first']:[]),'DO  - '+p.doi,'UR  - '+p.sourceUrl,'LA  - '+(p.language==='en'?'English':'Chinese'),'ER  - ',''].join('\r\n');
  };

  const paperHref = (p,from='#/publications') => `#/publications/${encodeURIComponent(p.id)}${from!=='#/publications'?'?from='+encodeURIComponent(from):''}`;
  const paperReturn = params => params.get('from')==='#/'?'#/':/^#\/publications(?:\?[^#]*)?$/.test(params.get('from')||'')?params.get('from'):'#/publications';
  function downloadCitations(items){
    if(!items.length)return;
    const content=items.map(risRecord).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'application/x-research-info-systems;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=items.length===1?`SBD-Lab-${items[0].id}.ris`:'SBD-Lab-publications.ris';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast(t([`已导出 ${items.length} 篇题录`,`Exported ${items.length} citation${items.length===1?'':'s'}`]));
  }
  async function copyPaperCitation(p,field){
    try{await navigator.clipboard.writeText(citation(p));showToast(t(['引用已复制','Citation copied']));}
    catch{
      if(!field){
        const dialog=document.getElementById('citation-dialog');
        document.getElementById('citation-dialog-title').textContent=t(['引用信息','Citation']);
        document.getElementById('citation-dialog-note').textContent=t(['请选中下方引用文字复制，或导出题录。','Select the citation below to copy it, or export its RIS record.']);
        document.getElementById('citation-dialog-close').setAttribute('aria-label',t(['关闭引用','Close citation']));
        document.getElementById('citation-dialog-select').textContent=t(['选中引用','Select citation']);
        document.getElementById('citation-dialog-export').textContent=t(['导出 .RIS','Export .RIS']);
        field=document.getElementById('citation-dialog-text');field.value=citation(p);
        document.getElementById('citation-dialog-export').onclick=()=>downloadCitations([p]);
        document.getElementById('citation-dialog-select').onclick=()=>{field.focus();field.select();};
        dialog.showModal();
      }else showToast(t(['引用已选中，请手动复制','Citation selected; copy the text manually.']));
      field.focus();field.select();
    }
  }

  function homeSelection(){
    const ordered=[...papers].sort((a,b)=>b.year-a.year).slice(0,3);
    return `<section class="home-section home-results" aria-labelledby="home-results-title"><div class="home-section-heading"><h2 id="home-results-title">${t(['团队论文','Publications'])}</h2>${link('#/publications','全部论文','All publications')}</div><div class="home-paper-grid">${ordered.map(p=>`<a class="home-result-row" id="home-paper-${esc(p.id)}" href="${esc(paperHref(p,'#/'))}"><div><p class="home-result-meta">${p.year} · ${esc(t([p.journal,p.journalEn]))}</p><h3>${esc(p.title)}</h3><p class="home-result-author">${esc(p.authors.join(' · '))}</p></div>${arrow}</a>`).join('')}</div></section>`;
  }

  function references(){
    const resource=window.LAB_RESOURCES || {summary:{figures:2070,articles:658,journals:135,recommended:373},categories:[]};
    return `<section class="page-heading">${eye('PUBLICATIONS / REFERENCE ATLAS','PUBLICATIONS / REFERENCE ATLAS')}<h1>${t(['文献图集','Research Figure Atlas'])}<small>OUTSIDE SOURCES / RESEARCH TOOL</small></h1><p>${t(['这是面向研究过程的外部文献与图像资料库。每幅图像都保留原论文、图号、图注、图像来源与许可记录，不代表实验室发表成果。','An external literature and figure library for the research process. Each record keeps its source paper, figure number, caption, image source, and license; it does not represent Lab publications.'])}</p></section><section class="reference-intro"><div><p class="eyebrow">${t(['文献图集','RESEARCH FIGURE ATLAS'])}</p><h2>${t(['从图像进入研究。','A visual entry into research.'])}</h2><p>${t([`当前快照：${resource.summary.figures} 幅图像 · ${resource.summary.articles} 篇来源论文 · ${resource.summary.journals} 个出版来源。`,`Snapshot: ${resource.summary.figures} figures · ${resource.summary.articles} source papers · ${resource.summary.journals} publication sources.`])}</p>${link('#/projects/figure-atlas','了解研究工具','About the research tool')}</div><a class="reference-launch" href="#/research/figures"><span>${t(['浏览图集','Explore the atlas'])}</span><strong>${directionIcon('ne')}</strong></a></section><section class="reference-categories"><div class="section-header"><div>${eye('按研究用途','BY RESEARCH USE')}<h2>${t(['九类图像，服务不同阶段。','Nine figure families for different stages.'])}</h2></div></div><div class="reference-category-grid">${resource.categories.map(c=>`<div><span>${esc(c.id)}</span><h3>${esc(c.name)}</h3><b>${c.count}</b></div>`).join('')}</div></section><nav class="collection-switch"><a href="#/publications">${t(['团队论文','Lab publications'])}</a><a class="active" href="#/publications?collection=references">${t(['文献图集','Research Figure Atlas'])}</a></nav>`;
  }

  function publications(params){
    if(params.get('collection')==='references') return references();
    const topic=paperTopics.some(x=>x.id===params.get('topic'))?params.get('topic'):'all';
    const years=[...new Set(papers.map(p=>p.year))].sort((a,b)=>b-a);
    const authors=[...new Set(papers.flatMap(p=>p.authors))];
    return `<section class="page-heading">${eye('PUBLICATIONS / 04','PUBLICATIONS / 04')}<h1>${t(['论文','Publications'])}<small>RESEARCH & WRITING</small></h1><p>${t(['围绕建筑与城市、空间体验及设计方法，汇集学术论文与研究文章。','Research papers and academic writing on architecture, cities, spatial experience, and design methods.'])}</p></section>${researchNavigation('papers')}<section class="publications-archive" aria-label="${t(['论文档案','Publication archive'])}"><div class="publication-controls"><a id="paper-theme-back" class="paper-theme-back" hidden></a><div class="publication-topline"><div class="filters" role="group" aria-label="${t(['按论文主题筛选','Filter publications by topic'])}"><button class="filter" data-paper-topic="all" aria-pressed="${topic==='all'}">${t(['全部','All'])}</button>${paperTopics.map(x=>`<button class="filter" data-paper-topic="${x.id}" aria-pressed="${topic===x.id}">${esc(t(x.name))}</button>`).join('')}</div><button class="export-button" id="export-papers">${t(['导出题录 .RIS','Export citations .RIS'])}<span aria-hidden="true">${directionIcon('down')}</span></button></div><div class="publication-fields"><label class="search-box"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 5 5"/></svg><input id="paper-search" type="search" aria-label="${t(['搜索论文','Search publications'])}" placeholder="${t(['题名、作者、年份或 DOI，可组合搜索…','Combine title, author, year, or DOI…'])}" value="${esc(params.get('q')||'')}" autocomplete="off"></label><label class="archive-select"><span>${t(['年份','Year'])}</span><select id="paper-year" aria-label="${t(['论文年份','Publication year'])}"><option value="all">${t(['全部年份','All years'])}</option>${years.map(y=>`<option value="${y}" ${params.get('year')===String(y)?'selected':''}>${y}</option>`).join('')}</select></label><label class="archive-select"><span>${t(['作者','Author'])}</span><select id="paper-author" aria-label="${t(['论文作者','Publication author'])}"><option value="all">${t(['全部作者','All authors'])}</option>${authors.map(a=>`<option value="${esc(a)}" ${params.get('author')===a?'selected':''}>${esc(a)}</option>`).join('')}</select></label></div><div class="paper-filter-summary" id="paper-active-filters" aria-label="${t(['当前筛选','Active filters'])}" hidden></div></div><div class="archive-results-head"><p id="paper-count" role="status" aria-live="polite"></p><span>${t([`团队成果选录 · ${Math.min(...papers.map(p=>p.year))}—${Math.max(...papers.map(p=>p.year))}`,`SELECTED PUBLICATIONS · ${Math.min(...papers.map(p=>p.year))}–${Math.max(...papers.map(p=>p.year))}`])}</span></div><div id="paper-results"></div></section>`;
  }

  function publicationRow(p){
    return `<article class="publication-row" id="${esc(p.id)}"><div class="publication-journal"><span>${esc(t([p.journal,p.journalEn]))}</span><span>${esc(paperImprint(p))}</span>${p.pdfUrl?`<span class="paper-open-access">${p.pdfAccess==='provided'?t(['全文 PDF','Full text PDF']):t(['开放全文','Open full text'])}</span>`:''}</div><h3><a href="${esc(paperHref(p,lastPublications))}" class="paper-title-link">${esc(p.title)}<span class="paper-read-arrow" aria-hidden="true">${directionIcon('right')}</span></a></h3><p class="publication-authors">${esc(p.authors.join(' · '))}</p><div class="publication-actions"><a class="paper-read-link" href="${esc(paperHref(p,lastPublications))}">${t(['查看详情','Read more'])} ${directionIcon('right')}</a><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${t(['来源页面','Article source'])} ${directionIcon('ne')}</a>${p.pdfUrl?`<a href="${esc(p.pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF ${directionIcon('ne')}</a>`:''}<a class="doi-link" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">DOI ${directionIcon('ne')}</a><button data-copy-citation="${esc(p.id)}">${t(['复制引用','Copy citation'])}</button><div class="paper-topic-tags">${p.topics.map(id=>`<span>${esc(paperTopicName(id))}</span>`).join('')}</div></div>${p.abstract?`<details class="paper-abstract"><summary>${t([p.language==='en'?'摘要（英文）':'摘要',p.language==='en'?'Abstract':'Abstract · Chinese'])}</summary><p>${esc(p.abstract)}</p></details>`:''}</article>`;
  }

  function publicationDetail(id,params){
    const p=papers.find(x=>x.id===id);
    if(!p)return `<section class="not-found">${eye('PUBLICATION / NOT FOUND','PUBLICATION / NOT FOUND')}<h1>${t(['未找到这篇论文。','Publication not found.'])}</h1><p>${t(['可以返回论文列表，继续按题名、作者或年份查找。','Return to the archive to search by title, author, or year.'])}</p>${link('#/publications','返回论文列表','Back to publications')}</section>`;
    const from=paperReturn(params);
    const fromHome=from==='#/';
    const back=from+(from.includes('?')?'&':'?')+'focus='+encodeURIComponent((fromHome?'home-paper-':'')+p.id);
    const originTheme=themes.find(th=>th.id===new URLSearchParams(from.split('?')[1]||'').get('theme'));
    const related=papers.filter(x=>x.id!==id&&matchesResearchTheme(x,originTheme)&&x.topics.some(topic=>p.topics.includes(topic))).slice(0,3);
    return `<nav class="breadcrumbs" aria-label="${t(['当前位置','Breadcrumb'])}">${!fromHome?`<a href="#/research">${t(['研究','Research'])}</a><span>/</span>`:''}<a href="${esc(back)}">${t(fromHome?['首页','Home']:['团队论文','Lab publications'])}</a><span>/</span><span>${p.year}</span></nav>
      <section class="page-heading paper-detail-heading"><p class="eyebrow section-mark">PUBLICATION / ${p.year}</p><h1>${esc(p.title)}</h1><p class="paper-detail-authors">${esc(p.authors.join(' · '))}</p><div class="paper-detail-journal"><span>${esc(t([p.journal,p.journalEn]))}</span><span>${esc(paperImprint(p))}</span></div><div class="paper-detail-actions"><a class="tool-launch" href="${esc(p.pdfUrl||p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${p.pdfUrl?paperPdfLabel(p):t(['前往来源页面','Open article source'])}${arrow}</a><a class="text-link" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">DOI ${arrow}</a></div></section>
      <div class="paper-detail-grid"><aside class="paper-detail-meta"><p class="eyebrow">${t(['论文信息','PUBLICATION DETAILS'])}</p><dl><dt>${t(['年份','Year'])}</dt><dd>${p.year}</dd><dt>${t(['期刊','Journal'])}</dt><dd>${esc(t([p.journal,p.journalEn]))}</dd><dt>${p.publicationStatus==='online-first'?t(['出版状态','Publication status']):t(['卷期与页码','Volume, issue & pages'])}</dt><dd>${p.publicationStatus==='online-first'?`${t(['网络首发','Online first'])} · ${esc(p.publishedDate)}`:`${p.volume?esc(p.volume):''}${p.issue?'('+esc(p.issue)+')':''}${p.volume||p.issue?' · ':''}${esc(p.pages)}`}</dd><dt>DOI</dt><dd><a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">${esc(p.doi)}</a></dd></dl><div class="paper-detail-topics">${p.topics.map(topic=>`<a href="#/publications?topic=${esc(topic)}">${esc(paperTopicName(topic))} ${directionIcon('right')}</a>`).join('')}</div><a class="paper-return" href="${esc(back)}">${directionIcon('left')} ${t(fromHome?['返回首页','Back to home']:['返回论文列表','Back to publications'])}</a></aside>
      <div class="paper-reading"><section class="paper-detail-abstract"><h2>${t([p.language==='en'?'摘要（英文）':'摘要',p.language==='en'?'Abstract':'Abstract · Chinese'])}</h2>${p.abstract?`<p lang="${p.language==='en'?'en':'zh-CN'}">${esc(p.abstract)}</p>`:`<p>${t(['请通过来源页面阅读摘要与全文。','Visit the source page for the abstract and full text.'])}</p>`}</section>
      <section class="paper-citation-block" aria-labelledby="paper-citation-heading"><div><h2 id="paper-citation-heading">${t(['引用这篇论文','Cite this paper'])}</h2><button class="copy-button" id="paper-copy-citation">${t(['复制引用','Copy citation'])}</button></div><textarea id="paper-citation-text" readonly rows="5" aria-label="${t(['论文引用文字','Citation text'])}">${esc(citation(p))}</textarea><div class="paper-citation-actions"><button class="copy-button" id="paper-export-citation">${t(['导出题录 .RIS','Export citation .RIS'])} ${directionIcon('down')}</button><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${t(['来源页面','Article source'])} ${directionIcon('ne')}</a></div></section>
      ${related.length?`<section class="paper-related"><p class="eyebrow section-mark">${t(['继续阅读','CONTINUE READING'])}</p><h2>${t(['相关论文','Related publications'])}</h2>${related.map(x=>`<a href="${esc(paperHref(x,from))}"><span>${x.year} / ${esc(t([x.journal,x.journalEn]))}</span><h3>${esc(x.title)} <span aria-hidden="true">${directionIcon('right')}</span></h3></a>`).join('')}</section>`:''}</div></div>
      <nav class="paper-detail-bottom"><a href="${esc(back)}">${directionIcon('left')} ${t(fromHome?['返回首页','Back to home']:['返回论文列表','Back to publications'])}</a><a href="#/research/figures">${t(['探索文献图集','Explore the figure atlas'])} ${directionIcon('right')}</a></nav>`;
  }

  function bindPublicationDetail(id){
    const p=papers.find(x=>x.id===id);if(!p)return;
    document.getElementById('paper-copy-citation').addEventListener('click',()=>copyPaperCitation(p,document.getElementById('paper-citation-text')));
    document.getElementById('paper-export-citation').addEventListener('click',()=>downloadCitations([p]));
  }

  function bindPublications(params){
    let direction=themes.find(th=>th.id===params.get('theme'))||null;
    let topic=paperTopics.some(x=>x.id===params.get('topic'))?params.get('topic'):'all';
    let matching=[];
    const search=document.getElementById('paper-search'),year=document.getElementById('paper-year'),author=document.getElementById('paper-author');
    const exportButton=document.getElementById('export-papers');
    const update=()=>{
      const terms=search.value.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
      matching=papers.filter(p=>{
        const text=[p.title,p.year,...p.authors,...(p.authorAliases||[]),p.journal,p.journalEn,p.doi,'https://doi.org/'+p.doi,p.abstract,...p.topics.map(paperTopicName)].join(' ').normalize('NFKC').toLocaleLowerCase();
        return matchesResearchTheme(p,direction)&&(topic==='all'||p.topics.includes(topic))&&(year.value==='all'||String(p.year)===year.value)&&(author.value==='all'||p.authors.includes(author.value)||(p.authorAliases||[]).includes(author.value))&&terms.every(term=>text.includes(term));
      });
      const query=new URLSearchParams();if(direction)query.set('theme',direction.id);if(topic!=='all')query.set('topic',topic);if(search.value.trim())query.set('q',search.value.trim());if(year.value!=='all')query.set('year',year.value);if(author.value!=='all')query.set('author',author.value);
      lastPublications=`#/publications${query.size?'?'+query:''}`;
      history.replaceState(history.state,'',lastPublications);
      document.querySelectorAll('[data-paper-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paperTopic===topic)));
      document.getElementById('paper-count').textContent=t([`${matching.length} 篇论文`,`${matching.length} PUBLICATION${matching.length===1?'':'S'}`]);
      const themeBack=document.getElementById('paper-theme-back');themeBack.hidden=!direction;
      if(direction){themeBack.href='#/research/'+direction.id;themeBack.innerHTML=directionIcon('left')+' '+esc(t(['返回'+t(direction.name)+'方向','Back to '+t(direction.name)]));}
      const active=[];
      if(direction)active.push(['theme',t(['研究方向：','Theme: '])+t(direction.name)]);
      if(topic!=='all')active.push(['topic',paperTopicName(topic)]);
      if(search.value.trim())active.push(['q',search.value.trim()]);
      if(year.value!=='all')active.push(['year',year.value]);
      if(author.value!=='all')active.push(['author',author.value]);
      const summary=document.getElementById('paper-active-filters');summary.hidden=!active.length;
      summary.innerHTML=active.map(([key,value])=>`<button type="button" data-remove-paper-filter="${key}" aria-label="${esc(t(['移除筛选：','Remove filter: '])+value)}">${esc(value)} <span aria-hidden="true">×</span></button>`).join('')+`<button type="button" id="clear-paper-filters">${t(['清除全部','Clear all'])}</button>`;
      summary.querySelectorAll('[data-remove-paper-filter]').forEach(button=>button.addEventListener('click',()=>{
        const key=button.dataset.removePaperFilter;
        if(key==='theme')direction=null;else if(key==='topic')topic='all';else if(key==='q')search.value='';else if(key==='year')year.value='all';else if(key==='author')author.value='all';
        update();search.focus();
      }));
      document.getElementById('clear-paper-filters').addEventListener('click',()=>{direction=null;topic='all';year.value=author.value='all';search.value='';update();search.focus();});
      exportButton.disabled=!matching.length;
      const years=[...new Set(matching.map(p=>p.year))].sort((a,b)=>b-a);
      document.getElementById('paper-results').innerHTML=matching.length?years.map(y=>`<section class="publication-year"><h2>${y}</h2><div>${matching.filter(p=>p.year===y).map(publicationRow).join('')}</div></section>`).join(''):`<div class="empty-state"><p class="eyebrow">NO MATCHES</p><h2>${t(['没有匹配的论文','No matching publications'])}</h2><p>${t(['试试其他关键词，或清除筛选。','Try another keyword or clear the filters.'])}</p><button class="solid-button" id="reset-papers">${t(['查看全部论文','View all publications'])}${arrow}</button></div>`;
      document.getElementById('reset-papers')?.addEventListener('click',()=>{direction=null;topic='all';year.value=author.value='all';search.value='';update();search.focus();});
      document.querySelectorAll('[data-copy-citation]').forEach(b=>b.addEventListener('click',()=>{
        const p=papers.find(p=>p.id===b.dataset.copyCitation);
        copyPaperCitation(p);
      }));
    };
    document.querySelectorAll('[data-paper-topic]').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.paperTopic;update();}));
    search.addEventListener('input',update);year.addEventListener('change',update);author.addEventListener('change',update);
    exportButton.addEventListener('click',()=>downloadCitations(matching));
    update();
  }

  function designWorks(params){
    return `<section class="page-heading">${eye('DESIGN ARCHIVE / 03','DESIGN ARCHIVE / 03')}<h1>${t(['设计作品','Design work'])}<small>STUDIO / EXPLORATIONS</small></h1><p>${t(['从研究、教学到空间实践，记录设计问题如何转化为可体验的空间。','From research and teaching to spatial practice: exploring how design questions become spaces to experience.'])}</p></section>${works.length?`<div class="archive-toolbar work-toolbar"><div class="filters" role="group" aria-label="${t(['按作品类型筛选','Filter design work'])}"><button class="filter" data-work-category="all">${t(['全部','All'])}</button>${workCategories.map(c=>`<button class="filter" data-work-category="${c.id}">${esc(t(c.name))}</button>`).join('')}</div><label class="search-box"><input id="work-search" type="search" aria-label="${t(['搜索设计作品','Search design work'])}" placeholder="${t(['搜索作品、作者或课程…','Search work, authors, or courses…'])}" value="${esc(params.get('q')||'')}"></label></div><p class="results-caption" id="work-count" role="status" aria-live="polite"></p><div class="work-grid" id="work-results"></div>`:`<section class="works-coming"><div class="works-coming-art">${themeSymbol('space')}${themeSymbol('design')}<span>SPACE / PROCESS / PRACTICE</span></div><div class="works-coming-copy">${eye('STUDIO ARCHIVE','STUDIO ARCHIVE')}<h2>${t(['设计，是另一种提问。','Design is another<br>way of asking.'])}</h2><p>${t(['作品正在整理。这里将呈现教学与研究中的设计探索，以及作品背后的问题、过程与空间表达。','The archive is being prepared. It will bring together design explorations from teaching and research, with the questions, processes, and spatial ideas behind each work.'])}</p><div class="work-category-labels">${workCategories.map(c=>`<span>${esc(t(c.name))}</span>`).join('')}</div>${link('#/research','从研究方向开始探索','Explore our research themes')}</div></section>`}`;
  }

  function workCard(w,level=2,from=''){
    return `<article class="work-card" id="work-${esc(w.id)}" data-work="${esc(w.id)}"><a href="${esc(archiveItemHref('works',w.id,from))}"><div class="work-cover">${w.cover?`<img src="${esc(w.coverThumb||w.cover)}" alt="${esc(t(w.coverAlt||w.title))}" loading="lazy" width="${w.coverWidth||1600}" height="${w.coverHeight||1000}">`:themeSymbol('space')}${arrow}</div><p class="project-meta">${w.year?esc(w.year)+' / ':''}${esc(workCategoryName(w.category))}</p><h${level}>${esc(t(w.title))}</h${level}><p>${esc(w.authors.join(' · '))}</p></a></article>`;
  }

  function bindWorks(params){
    if(!works.length)return;
    let category=workCategories.some(c=>c.id===params.get('category'))?params.get('category'):'all';
    const search=document.getElementById('work-search');
    const update=()=>{
      const q=search.value.trim().normalize('NFKC').toLocaleLowerCase();
      const matching=works.filter(w=>(category==='all'||w.category===category)&&(!q||[...w.title,...w.authors,...w.advisors,...(w.course||[]),...(w.summary||[])].join(' ').normalize('NFKC').toLocaleLowerCase().includes(q)));
      document.querySelectorAll('[data-work-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workCategory===category)));
      document.getElementById('work-count').textContent=t([`${matching.length} 件作品`,`${matching.length} DESIGN WORK${matching.length===1?'':'S'}`]);
      const query=new URLSearchParams();if(category!=='all')query.set('category',category);if(search.value.trim())query.set('q',search.value.trim());lastWorks=`#/works${query.size?'?'+query:''}`;history.replaceState(history.state,'',lastWorks);
      document.getElementById('work-results').innerHTML=matching.length?matching.map(w=>workCard(w,2,lastWorks)).join(''):`<div class="empty-state"><h2>${t(['没有匹配的作品','No matching work'])}</h2><button class="solid-button" id="reset-works">${t(['查看全部作品','View all design work'])}${arrow}</button></div>`;
      document.getElementById('reset-works')?.addEventListener('click',()=>{category='all';search.value='';update();search.focus();});
    };
    document.querySelectorAll('[data-work-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.workCategory;update();}));search.addEventListener('input',update);update();
  }

  function workDetail(id,params){
    const w=works.find(w=>w.id===id);if(!w)return missing();
    const back=archiveReturn(params,'#/projects?collection=works','work-'+id);
    const fromProjects=back.startsWith('#/projects');
    const fromHome=back.startsWith('#/?');
    const relatedFrom=archiveSource(params.get('from'),'#/projects?collection=works');
    const facts=[['作者','Designers',w.authors.join(' · ')],['指导教师','Advisors',w.advisors.join(' · ')],...(w.year?[['年份','Year',w.year]]:[]),...(w.status?[['作品性质','Work type',t(w.status)]]:[]),['类型','Type',workCategoryName(w.category)],...(w.course?.some(Boolean)?[['课程／项目','Course / project',t(w.course)]]:[]),...(w.location?.some(Boolean)?[['地点','Location',t(w.location)]]:[])];
    const complete=w.completeBoard;
    return `<nav class="breadcrumbs" aria-label="${t(['当前位置','Breadcrumb'])}"><a href="${esc(back)}">${t(fromHome?['首页','Home']:fromProjects?['项目','Projects']:['设计作品','Design work'])}</a><span>/</span><span>${esc(t(w.title))}</span></nav><section class="page-heading detail-heading work-detail-heading">${eye(w.year?'STUDENT WORK / '+w.year:'STUDENT WORK',w.year?'STUDENT WORK / '+w.year:'STUDENT WORK')}<h1>${esc(t(w.title))}</h1><p>${esc(t(w.summary||['','']))}</p><div class="work-heading-bottom"><dl class="work-byline"><div><dt>${t(['作者','Designers'])}</dt><dd>${esc(w.authors.join(' · '))}</dd></div>${w.advisors.length?`<div><dt>${t(['指导教师','Advisors'])}</dt><dd>${esc(w.advisors.join(' · '))}</dd></div>`:''}</dl><button class="work-open-images" data-read-work-book type="button">${t(['阅读评图册','Read review book'])}<span>${String(complete?.images?.length||0).padStart(2,'0')}</span>${arrow}</button></div></section>${window.LAB_WORK_READER.render(w,lang)}<div class="detail-layout"><aside class="detail-sidebar"><dl>${facts.map(f=>`<div><dt>${t(f.slice(0,2))}</dt><dd>${esc(f[2])}</dd></div>`).join('')}</dl></aside><div>${(w.sections||[]).map(s=>`<section class="detail-section"><h2>${esc(t(s.heading))}</h2><p>${esc(t(s.text))}</p></section>`).join('')}</div></div><nav class="detail-next"><a href="${esc(back)}">${directionIcon('left')} ${t(fromHome?['返回首页','Back to home']:fromProjects?['返回项目档案','Back to projects']:['返回作品档案','Back to design work'])}</a></nav><section class="work-related" aria-labelledby="work-related-title"><div class="archive-group-heading"><h2 id="work-related-title">${t(['继续探索','More student work'])}</h2><span>STUDENT WORK / ${String(works.length-1).padStart(2,'0')}</span></div><div class="work-grid">${works.filter(item=>item.id!==id).map(item=>workCard(item,3,relatedFrom)).join('')}</div></section>`;
  }

  function missing(){return `<section class="not-found">${eye('404 / NOT FOUND','404 / NOT FOUND')}<h1>${t(['这条路径还未被探索。','An unexplored path.'])}</h1><p>${t(['没有找到这个页面。你可以返回项目，继续探索。','This page could not be found. Return to the project archive to continue exploring.'])}</p>${link('#/projects','返回项目','Back to projects')}</section>`;}

  function routeInfo(){const raw=location.hash.startsWith('#/')?location.hash.slice(2):'';const [path,query='']=raw.split('?');return {parts:path.split('/').filter(Boolean),params:new URLSearchParams(query)};}
  function translateShell(){
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(el=>el.textContent=el.dataset[lang]);
    const toggle=document.getElementById('language');
    toggle.innerHTML=`${lang==='zh'?'EN':'中'} ${arrow}`;
    toggle.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换为中文');
    document.querySelector('.main-nav').setAttribute('aria-label',t(['主导航','Main navigation']));
    document.querySelector('.brand').setAttribute('aria-label',t(['空间·脑·设计实验室 首页','Space, Cognition & Design Lab home']));
    document.querySelector('.brand-lockup').setAttribute('alt',t(['空间·脑·设计实验室','Space, Cognition & Design Lab']));
    document.getElementById('menu').setAttribute('aria-label',t(['打开导航','Open navigation']));
  }
  function render(keepScroll=false,restoredView){
    cleanupAtlasLayout();
    cleanupHero();
    cleanupWorkReader();
    clearTimeout(toastTimer);document.getElementById('toast').classList.remove('visible');
    document.getElementById('citation-dialog').close();
    const {parts,params}=routeInfo();const page=parts[0]||'home';
    const y=window.scrollY;
    const isAtlas=(page==='research'&&parts[1]==='figures')||(page==='publications'&&!parts[1]&&params.get('collection')==='references');
    if(page==='home')main.innerHTML=home();
    else if(isAtlas)main.innerHTML=figureAtlasPage(params);
    else if(page==='research')main.innerHTML=research(parts[1]);
    else if(page==='projects'&&!parts[1]){lastArchive=location.hash||'#/projects';main.innerHTML=archive(params);}
    else if(page==='projects')main.innerHTML=detail(parts[1],params);
    else if(page==='works'&&!parts[1]){lastWorks=location.hash||'#/works';main.innerHTML=designWorks(params);}
    else if(page==='works')main.innerHTML=workDetail(parts[1],params);
    else if(page==='publications')main.innerHTML=parts[1]?publicationDetail(parts[1],params):publications(params);
    else if(page==='about')main.innerHTML=about();
    else main.innerHTML=missing();
    const navPage=page==='works'?'projects':page==='publications'?'research':page;
    document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===navPage)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    translateShell();
    closeMenu();
    const titles={home:t(['探索','Explore']),research:isAtlas?t(['文献图集','Research Figure Atlas']):t(themes.find(th=>th.id===parts[1])?.name||['研究','Research']),projects:parts[1]?t(projects.find(p=>p.id===parts[1])?.title||['项目','Project']):t(['项目','Projects']),works:parts[1]?t(works.find(w=>w.id===parts[1])?.title||['设计作品','Design work']):t(['设计作品','Design work']),publications:parts[1]?(papers.find(p=>p.id===parts[1])?.title||t(['论文','Publication'])):params.get('collection')==='references'?t(['文献图集','Research Figure Atlas']):t(['论文','Publications']),about:t(['关于','About'])};
    document.title=`${titles[page]||'404'} — ${t(['空间·脑·设计实验室','Space, Cognition & Design Lab'])}`;
    if(page==='projects'&&!parts[1])bindArchive(params);
    if(page==='works'&&!parts[1])bindWorks(params);
    if(page==='publications'&&params.get('collection')!=='references'){
      if(parts[1])bindPublicationDetail(parts[1]);else bindPublications(params);
    }
    if(isAtlas)bindFigureAtlas(params);
    if(page==='home')bindHero();
    if(page==='works'&&parts[1])cleanupWorkReader=window.LAB_WORK_READER.mount(main,works.find(w=>w.id===parts[1]),lang);
    if(page==='about')document.getElementById('copy-email').addEventListener('click',copyEmail);
    bindPointerMotion();
    if(keepScroll)window.scrollTo({top:y,behavior:'instant'});
    else if(restoredView){
      window.scrollTo({top:restoredView.y,behavior:'instant'});
      const previous=[...main.querySelectorAll('a')].find(a=>a.getAttribute('href')===restoredView.href);
      (previous||main).focus({preventScroll:true});
    }
    else {window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
    if(page==='home'&&params.get('focus')&&!restoredView){
      const selected=document.getElementById(params.get('focus'));
      if(selected?.matches('.home-image-card,.home-result-row,#hero-title')){
        selected.classList.add('home-returned');
        selected.scrollIntoView({block:selected.id==='hero-title'?'start':'center',behavior:'instant'});
        const focus=selected.querySelector('a')||selected;
        if(!focus.matches('a,button'))focus.setAttribute('tabindex','-1');
        focus.focus({preventScroll:true});
      }
    }
    if(page==='publications'&&!parts[1]&&params.get('focus')&&!restoredView){
      const selected=document.getElementById(params.get('focus'));
      if(selected?.classList.contains('publication-row')){
        selected.classList.add('paper-returned');selected.scrollIntoView({block:'center',behavior:'instant'});
        selected.querySelector('.paper-title-link')?.focus({preventScroll:true});
      }
    }
    if(['projects','works'].includes(page)&&!parts[1]&&params.get('focus')&&!restoredView){
      const selected=document.getElementById(params.get('focus'));
      if(selected?.matches('.project-card,.work-card')){
        selected.classList.add('archive-returned');
        selected.scrollIntoView({block:'center',behavior:'instant'});
        selected.querySelector('a')?.focus({preventScroll:true});
      }
    }
    window.dispatchEvent(new Event('sbd:render'));
    if(page==='about')jumpToAboutSection(params);
  }
  function bindArchive(params){
    let collection=archiveCollections.some(c=>c.id===params.get('collection'))?params.get('collection'):'all';
    const input=document.getElementById('project-search');
    const theme=document.getElementById('project-theme');
    const summary=document.getElementById('project-active-filters');
    const resetFilters=()=>{
      collection='all';theme.value='all';input.value='';update();
      document.querySelector('[data-collection="all"]').focus({preventScroll:true});
    };
    const update=()=>{
      const terms=input.value.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const matches=values=>{const text=values.join(' ').normalize('NFKC').toLocaleLowerCase();return terms.every(term=>text.includes(term));};
      const inTheme=item=>theme.value==='all'||(item.themes||[]).includes(theme.value);
      const matchingProjects=projects.filter(p=>(collection==='all'||(collection==='tools'&&isResearchTool(p))||(collection==='prototypes'&&!isResearchTool(p)))&&inTheme(p)&&matches([...p.title,...(p.searchAliases||[]),...p.subtitle,...p.summary,...p.methods,...p.themes.flatMap(id=>themes.find(th=>th.id===id).name)]));
      const matchingWorks=works.filter(w=>(collection==='all'||collection==='works')&&inTheme(w)&&matches([...w.title,...w.authors,...w.advisors,...(w.course||[]),...(w.summary||[]),...(w.sections||[]).flatMap(section=>[...section.heading,...section.text]),...(w.themes||[]).flatMap(id=>themes.find(th=>th.id===id)?.name||[])]));
      document.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.collection===collection)));
      const query=new URLSearchParams();if(collection!=='all')query.set('collection',collection);if(theme.value!=='all')query.set('theme',theme.value);if(input.value.trim())query.set('q',input.value.trim());
      lastArchive=`#/projects${query.size?'?'+query:''}`;lastWorks=lastArchive;
      history.replaceState(history.state,'',lastArchive);
      const active=[];
      if(collection!=='all')active.push(['collection',t(['类型','Type']),t(archiveCollections.find(c=>c.id===collection).name)]);
      if(theme.value!=='all')active.push(['theme',t(['方向','Theme']),t(themes.find(th=>th.id===theme.value).name)]);
      if(input.value.trim())active.push(['q',t(['关键词','Keyword']),input.value.trim()]);
      summary.hidden=!active.length;
      summary.innerHTML=active.length?active.map(([key,label,value])=>`<button class="project-remove-filter" type="button" data-remove-project-filter="${key}" aria-label="${esc(t([`移除${label}筛选：${value}`,`Remove ${label.toLowerCase()} filter: ${value}`]))}"><span><span class="project-filter-kind">${esc(label)}${lang==='zh'?'：':': '}</span>${esc(value)}</span><span aria-hidden="true">×</span></button>`).join('')+`<button class="project-clear-filters" type="button" id="clear-project-filters">${t(['清除全部','Clear all'])}</button>`:'';
      const matchingTools=matchingProjects.filter(isResearchTool),matchingPrototypes=matchingProjects.filter(p=>!isResearchTool(p));
      document.getElementById('result-count').textContent=t([`${matchingWorks.length+matchingProjects.length} 项内容 · ${matchingWorks.length} 件学生作品 · ${matchingTools.length} 项研究工具 · ${matchingPrototypes.length} 个交互原型`,`${matchingWorks.length+matchingProjects.length} RESULTS · ${matchingWorks.length} STUDENT WORKS · ${matchingTools.length} RESEARCH TOOLS · ${matchingPrototypes.length} PROTOTYPES`]);
      const group=(id,name,caption,items,grid,cards)=>items.length?`<section class="archive-result-group" aria-labelledby="archive-${id}-title"><div class="archive-group-heading"><h2 id="archive-${id}-title">${t(name)}</h2><span>${String(items.length).padStart(2,'0')} / ${caption}</span></div><div class="${grid}">${items.map(cards).join('')}</div></section>`:'';
      document.getElementById('archive-grid').innerHTML=
        group('work',['学生作品','Student work'],'DESIGN & RESEARCH',matchingWorks,'work-grid unified-work-grid',w=>workCard(w,3,lastArchive))+
        group('tools',['研究工具','Research tools'],'TOOLS & RESOURCES',matchingTools,'project-grid',p=>projectCard(p,lastArchive))+
        group('prototypes',['交互原型','Prototypes'],'EXPERIMENTS & PROTOTYPES',matchingPrototypes,'project-grid',p=>projectCard(p,lastArchive))||`<div class="empty-state unified-empty"><p class="eyebrow">NO MATCHES</p><h2>${t(['没有匹配的项目或作品','No matching projects or work'])}</h2><p>${t(['试试题名、作者或其他关键词，也可以清除类型与方向筛选。','Try a title, author, or another keyword, or clear the type and theme filters.'])}</p><button class="solid-button" id="reset-search">${t(['清除全部筛选','Clear all filters'])}${arrow}</button></div>`;
      document.getElementById('reset-search')?.addEventListener('click',resetFilters);
      bindPointerMotion();
    };
    summary.addEventListener('click',event=>{
      if(event.target.closest('#clear-project-filters')){resetFilters();return;}
      const button=event.target.closest('[data-remove-project-filter]');
      if(!button)return;
      const index=[...summary.querySelectorAll('[data-remove-project-filter]')].indexOf(button);
      const key=button.dataset.removeProjectFilter;
      if(key==='collection')collection='all';else if(key==='theme')theme.value='all';else input.value='';
      update();
      const remaining=summary.querySelectorAll('[data-remove-project-filter]');
      const fallback=key==='collection'?document.querySelector('[data-collection="all"]'):key==='theme'?theme:input;
      (remaining[Math.min(index,remaining.length-1)]||fallback).focus({preventScroll:true});
    });
    document.querySelectorAll('[data-collection]').forEach(button=>button.addEventListener('click',()=>{collection=button.dataset.collection;update();}));
    theme.addEventListener('change',update);input.addEventListener('input',update);update();
  }
  function bindPointerMotion(){
    cleanupPointerMotion();
    const media=window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const controller=new AbortController();
    const options={signal:controller.signal,passive:true};
    const resets=[];
    // One scheduled update per frame; every exit also cancels its pending update.
    function track(surface,update,clear,enabled=()=>true){
      let frame=0;
      let last=null;
      const reset=()=>{cancelAnimationFrame(frame);frame=0;last=null;clear();};
      const move=event=>{
        if(!media.matches||event.pointerType==='touch'||event.buttons||!enabled()){reset();return;}
        last={clientX:event.clientX,clientY:event.clientY,target:event.target};
        if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(last&&surface.isConnected)update(last);});
      };
      surface.addEventListener('pointerenter',move,options);
      surface.addEventListener('pointermove',move,options);
      for(const event of ['pointerleave','pointercancel','pointerdown'])surface.addEventListener(event,reset,options);
      resets.push(reset);
      return reset;
    }
    const hero=document.querySelector('.hero-visual');
    if(hero && hero.querySelector('.city-art')){
      const drawing=hero.querySelector('.city-art');
      const probe=hero.querySelector('.city-probe');
      const buildings=[...hero.querySelectorAll('.city-building')];
      let active=null;
      const clear=()=>{active?.classList.remove('is-observed');active=null;hero.classList.remove('is-exploring');};
      const reset=track(hero,event=>{
        if(event.target.closest('button,a')){clear();return;}
        const matrix=drawing.getScreenCTM();
        if(!matrix){clear();return;}
        const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
        let nearest=null,distance=80;
        for(const building of buildings){
          const d=Math.hypot(point.x-Number(building.dataset.roofX),point.y-Number(building.dataset.roofY));
          if(d<distance){distance=d;nearest=building;}
        }
        if(nearest!==active){active?.classList.remove('is-observed');active=nearest;active?.classList.add('is-observed');}
        hero.classList.toggle('is-exploring',!!active);
        if(active)probe.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
      },clear,()=>!hero.classList.contains('paused'));
      hero.querySelector('#motion')?.addEventListener('click',reset,options);
    }
    document.querySelectorAll('.work-cover,.project-card .project-art,.atlas-card-image').forEach(cover=>{
      let cue=cover.querySelector('.cover-preview-cue');
      if(!cue){cue=document.createElement('span');cue.className='cover-preview-cue';cue.setAttribute('aria-hidden','true');cover.append(cue);}
      cue.innerHTML=cover.matches('.work-cover')?(t(['查看作品','View work'])+directionIcon('ne')):cover.matches('.atlas-card-image')?(t(['查看图像','View figure'])+directionIcon('ne')):(t(['了解项目','View project'])+directionIcon('ne'));
      track(cover,event=>{
        const rect=cover.getBoundingClientRect();
        const width=cue.offsetWidth,height=cue.offsetHeight;
        let x=event.clientX-rect.left+18,y=event.clientY-rect.top+18;
        if(x+width>rect.width-12)x=event.clientX-rect.left-width-18;
        if(y+height>rect.height-12)y=event.clientY-rect.top-height-18;
        cover.style.setProperty('--preview-x',`${Math.max(12,Math.min(rect.width-width-12,x)).toFixed(1)}px`);
        cover.style.setProperty('--preview-y',`${Math.max(12,Math.min(rect.height-height-12,y)).toFixed(1)}px`);
        cover.classList.add('is-previewing');
      },()=>cover.classList.remove('is-previewing'));
    });
    const resetAll=()=>resets.forEach(reset=>reset());
    media.addEventListener('change',resetAll,{signal:controller.signal});
    window.addEventListener('blur',resetAll,{signal:controller.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAll();},{signal:controller.signal});
    cleanupPointerMotion=()=>{controller.abort();resetAll();};
  }
  function bindHero(){
    const visual=document.querySelector('.hero-carousel');
    if(!visual)return;
    const slides=[...visual.querySelectorAll('.hero-slide')];
    const toggle=visual.querySelector('#motion');
    const counter=visual.querySelector('.hero-slide-count');
    const live=visual.querySelector('.hero-carousel-status');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller=new AbortController();
    const options={signal:controller.signal};
    let index=0,timer,userPaused=reduced.matches,hovered=false,inView=true,pointerPause=null;
    const schedule=()=>{
      clearTimeout(timer);
      const rotating=!userPaused&&!hovered&&inView&&!document.hidden;
      visual.dataset.rotating=String(rotating);
      if(rotating&&slides.length>1)timer=setTimeout(()=>{show(index+1);schedule();},6000);
    };
    const update=()=>{
      toggle.innerHTML=directionIcon(userPaused?'play':'pause');
      toggle.setAttribute('aria-pressed',String(userPaused));
      toggle.setAttribute('aria-label',userPaused?t(['播放作品轮播','Play slideshow']):t(['暂停作品轮播','Pause slideshow']));
      schedule();
    };
    const show=(next,announce=false)=>{
      index=(next+slides.length)%slides.length;
      slides.forEach((slide,i)=>{
        const active=i===index;
        slide.classList.toggle('is-active',active);
        slide.setAttribute('aria-hidden',String(!active));
        slide.inert=!active;
      });
      counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
      if(announce)live.textContent=t(['作品 ','Work '])+(index+1)+' / '+slides.length+' · '+slides[index].querySelector('.hero-work-caption>span').textContent;
    };
    toggle.addEventListener('pointerdown',()=>{pointerPause=!userPaused;},options);
    toggle.addEventListener('pointercancel',()=>{pointerPause=null;},options);
    toggle.addEventListener('click',()=>{userPaused=pointerPause??!userPaused;pointerPause=null;update();},options);
    visual.querySelector('#hero-prev').addEventListener('click',()=>{userPaused=true;show(index-1,true);update();},options);
    visual.querySelector('#hero-next').addEventListener('click',()=>{userPaused=true;show(index+1,true);update();},options);
    visual.addEventListener('mouseenter',()=>{hovered=true;schedule();},options);
    visual.addEventListener('mouseleave',()=>{hovered=false;schedule();},options);
    visual.addEventListener('focusin',()=>{userPaused=true;update();},options);
    document.addEventListener('visibilitychange',schedule,options);
    reduced.addEventListener('change',event=>{if(event.matches){userPaused=true;update();}},options);
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{threshold:.05});
    observer.observe(visual);
    update();
    cleanupHero=()=>{clearTimeout(timer);observer.disconnect();controller.abort();};
  }
  function closeMenu(){document.getElementById('navigation').classList.remove('open');document.getElementById('menu').setAttribute('aria-expanded','false');document.getElementById('menu').setAttribute('aria-label',t(['打开导航','Open navigation']));}
  function jumpToAboutSection(params){
    const section=params.has('contact')?'contact':params.get('section');
    if(!['team','practice','contact'].includes(section))return;
    const target=document.getElementById(section);
    if(!target)return;
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:'instant'});
  }
  async function copyEmail(event){
    const button=event.currentTarget;
    try {
      await navigator.clipboard.writeText('wh-sa@mail.tsinghua.edu.cn');
      if(!button.isConnected)return;
      document.getElementById('contact-copy-fallback').hidden=true;
      showToast(t(['邮箱已复制','Email copied']));
    } catch {
      if(!button.isConnected)return;
      document.getElementById('contact-copy-fallback').hidden=false;
      const field=document.getElementById('contact-copy-text');
      field.focus({preventScroll:true});field.select();
      field.scrollIntoView({block:'nearest',behavior:'instant'});
      showToast(t(['请手动复制已选中的邮箱地址','Copy the selected email address manually.']));
    }
  }
  function showToast(message){const toast=document.getElementById('toast');clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),2600);}
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a.about-jump,a[href="#/about?contact=1"]');
    if(!anchor||anchor.hash!==location.hash||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();jumpToAboutSection(routeInfo().params);
  });
  document.querySelector('.brand').addEventListener('click',closeMenu);
  document.getElementById('language').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem('sbd-language',lang);}catch{}render(true);});
  document.getElementById('menu').addEventListener('click',()=>{const menu=document.getElementById('menu');const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.getElementById('navigation').classList.toggle('open',open);menu.setAttribute('aria-label',open?t(['关闭导航','Close navigation']):t(['打开导航','Open navigation']));});
  document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>{closeMenu();if(a.hash===location.hash)main.focus({preventScroll:true});}));
  document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();main.focus({preventScroll:true});main.scrollIntoView();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.getElementById('citation-dialog-close').addEventListener('click',()=>document.getElementById('citation-dialog').close());
  window.addEventListener('hashchange',navigateHistory);
  render();
})();








