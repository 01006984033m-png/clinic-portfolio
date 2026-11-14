/* LYMELVA V11: single-owner, deterministic, desktop-first motion. */
'use strict';
(()=>{
 const root=document.documentElement;
 const KEY='lymelva-motion-v11';
 let booted=false,template=null,active=null,sequence=0,animationList=[];
 let introClose=0,introFailsafe=0,detach=0,scrollObserver=null,mutationObserver=null,refreshPending=false,scrollReady=false;
 const one=id=>document.getElementById(id);
 const desktop=()=>matchMedia('(min-width:961px)').matches;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const saved=()=>{try{return localStorage.getItem(KEY)}catch{return null}};
 const enabled=()=>saved()==='on'||(saved()!=='off'&&(desktop()||!reduced()));
 const store=value=>{try{localStorage.setItem(KEY,value?'on':'off')}catch{}};
 const candidates='main .reveal,main .service-photo-card h3,main .service-photo-card p,main .service-photo-card .service-more,main .insight-card .insight-body,main .journey-step,main .education-promo-inner > *,main .guide-list a,main .faq-item,main .contact-form,main .contact-copy,main .edu-hero-grid > .edu-intro,main .edu-section-head,main .edu-card h3,main .edu-card p,main .edu-card .edu-card-top,main .edu-sources-grid > *,main .edu-safety,main .edu-notice';
 function sync(){
   root.dataset.motionActive=String(enabled());
   const button=one('motion-toggle');
   if(!button)return;
   const ar=root.lang==='ar',on=enabled();
   button.setAttribute('aria-pressed',String(on));
   button.setAttribute('aria-label',on?(ar?'إيقاف الأنيميشن':'Turn off motion'):(ar?'تشغيل الأنيميشن':'Turn on motion'));
   button.title=on?(ar?'إيقاف الحركة':'Motion on'):(ar?'تشغيل الحركة':'Motion off');
   const label=button.querySelector('.motion-toggle-label');
   if(label)label.textContent=on?(ar?'إيقاف الحركة':'Motion on'):(ar?'تشغيل الحركة':'Motion off');
 }
 function clearClocks(){clearTimeout(introClose);clearTimeout(introFailsafe);clearTimeout(detach)}
 function cancelAnimations(){animationList.forEach(x=>{try{x.cancel()}catch{}});animationList=[]}
 function finishIntro(node=active,token=sequence){
   if(!node||token!==sequence||node.dataset.done==='1')return;
   node.dataset.done='1';clearClocks();
   node.classList.add('done');
   document.body.classList.add('intro-finished');
   detach=setTimeout(()=>{
     if(token!==sequence)return;
     cancelAnimations();
     node.remove();active=null;
     document.body.classList.remove('intro-running');
     initScroll();
     // The cinematic intro is the only first-screen entrance. No second hero pass.
   },340);
 }
 function animatePart(node,selector,frames,duration,delay=0){
   const el=node.querySelector(selector);
   if(!el||!el.animate)return false;
   const a=el.animate(frames,{duration,delay,fill:'both',easing:'cubic-bezier(.2,.75,.22,1)'});
   animationList.push(a);return true;
 }
 function scene(node,token){
   if(token!==sequence||node.dataset.done==='1')return;
   node.classList.add('intro-waapi');
   const count=[
     animatePart(node,'.intro-bg-photo',[
       {transform:'translate3d(0,8px,0) scale(1.06)'},
       {transform:'translate3d(0,-8px,0) scale(1.06)'}
     ],3400),
     animatePart(node,'.intro-inner img',[
       {opacity:0,transform:'translate3d(0,55px,0) scale(.48) rotate(-11deg)'},
       {opacity:1,transform:'translate3d(0,0,0) scale(1) rotate(0deg)'}
     ],1100,130),
     animatePart(node,'.intro-kicker',[
       {opacity:0,transform:'translate3d(0,25px,0)'},
       {opacity:1,transform:'translate3d(0,0,0)'}
     ],800,460),
     animatePart(node,'.intro-word',[
       {opacity:0,transform:'translate3d(0,65px,0) scale(.83)'},
       {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
     ],1280,540),
     animatePart(node,'.intro-label',[
       {opacity:0,transform:'translate3d(0,27px,0)'},
       {opacity:1,transform:'translate3d(0,0,0)'}
     ],850,1130),
     animatePart(node,'.intro-progress span',[
       {transform:'scaleX(0)'},
       {transform:'scaleX(1)'}
     ],3330),
     animatePart(node,'.intro-light-streak',[
       {opacity:0,transform:'translate3d(-65vw,0,0) skewX(-24deg)'},
       {opacity:.4,transform:'translate3d(50vw,0,0) skewX(-24deg)'},
       {opacity:0,transform:'translate3d(160vw,0,0) skewX(-24deg)'}
     ],1850,700)
   ].filter(Boolean).length;
   if(count===0)node.classList.add('intro-css-fallback');
 }
 function startIntro(force=false){
   if(!template)return;
   sequence++;const token=sequence;clearClocks();cancelAnimations();
   if(active?.isConnected)active.remove();
   const original=one('intro');
   const node=(original&&original.dataset.done!=='1')?original:template.cloneNode(true);
   if(!node.isConnected)document.body.insertBefore(node,document.body.firstChild);
   node.id='intro';node.removeAttribute('data-done');
   node.classList.remove('done','intro-waapi','intro-css-fallback','intro-static','intro-soft-motion');
   active=node;
   document.body.classList.add('intro-running');
   document.body.classList.remove('intro-finished');
   const full=force||enabled();
   node.classList.add(full?'intro-sequence':'intro-soft-motion');
   const play=node.querySelector('#play-intro-motion');
   if(play)play.hidden=true;
   node.querySelector('#skip-intro')?.addEventListener('click',()=>finishIntro(node,token),{once:true});
   if(full)requestAnimationFrame(()=>scene(node,token));
   introClose=setTimeout(()=>finishIntro(node,token),full?3750:500);
   introFailsafe=setTimeout(()=>finishIntro(node,token),4400);
 }
 function show(el){
   if(scrollObserver)scrollObserver.unobserve(el);
   if(!el.isConnected||el.dataset.motionShown==='1')return;
   el.dataset.motionShown='1';
   el.classList.add('motion-entered');
   // WAAPI does not depend on CSS transitions, earlier .is-visible,
   // legacy reduced-motion resets, or separate animation stylesheets.
   if(!enabled()||!desktop()||!el.animate)return;
   // Never animate an image, or any wrapper containing one: even an
   // opacity-only WAAPI animation makes photographs flash when scrolling.
   // Text remains independently animated without changing image luminance.
   if(el.matches('img,picture,video,figure')||el.querySelector('img,picture,video'))return;
   const delay=Math.min(Number(el.dataset.motionDelay||0),180);
   // Transform-only entrance: never change opacity, brightness or filters.
   // One observer, one animation per text element, no replay on reverse scroll.
   const title=el.matches('h1,h2,h3,.section-heading-row,.edu-section-head,.reveal');
   const travel=title?42:28;
   // Translate-only is compositor-friendly; scaling text causes repeated glyph rasterization.
   el.animate([
     {transform:'translate3d(0,'+travel+'px,0)'},
     {transform:'translate3d(0,0,0)'}
   ],{duration:title?850:700,delay,fill:'none',easing:'cubic-bezier(.17,.85,.22,1)'});
 }
 function refresh(){
   if(!scrollReady)return;
   sync();
   const all=document.querySelectorAll(candidates);
   let n=0;
   all.forEach(el=>{
     if(el.dataset.motionTracked==='1')return;
     el.dataset.motionTracked='1';
     el.dataset.motionDelay=String((n++%3)*65);
     el.classList.add('motion-reveal');
     if(!enabled()||!desktop()||!scrollObserver){el.dataset.motionShown='1';return}
     if(el.getBoundingClientRect().bottom<=0){el.dataset.motionShown='1';return}
     scrollObserver.observe(el);
   });
 }
 function scheduleRefresh(){
   if(refreshPending)return;refreshPending=true;
   queueMicrotask(()=>{refreshPending=false;refresh()});
 }
 function initScroll(){
   if(scrollReady)return;scrollReady=true;
   if('IntersectionObserver' in window){
     scrollObserver=new IntersectionObserver(entries=>{
       entries.forEach(entry=>{if(entry.isIntersecting)show(entry.target)});
     },{threshold:.08,rootMargin:'0px 0px -6% 0px'});
   }
   refresh();
   if('MutationObserver' in window){
     mutationObserver=new MutationObserver(scheduleRefresh);
     for(const id of ['services-grid','insights-grid','cards','sources-grid','faq-items']){
       const el=one(id);
       if(el)mutationObserver.observe(el,{childList:true});
     }
   }
 }
 function toggle(){
   const on=!enabled();store(on);sync();
   if(on){startIntro(true);scheduleRefresh()}
   else{finishIntro();if(scrollObserver)scrollObserver.disconnect();
     document.querySelectorAll('[data-motion-tracked]').forEach(x=>x.dataset.motionShown='1')}
 }
 function boot(){
   if(booted)return;booted=true;
   template=one('intro')?.cloneNode(true)||null;
   document.body.classList.add('intro-js-ready');
   sync();
   one('motion-toggle')?.addEventListener('click',toggle);
   for(const id of ['replay-intro','header-replay-intro']){
     one(id)?.addEventListener('click',()=>{store(true);sync();startIntro(true)});
   }
   window.addEventListener('pagehide',()=>finishIntro());
   document.addEventListener('visibilitychange',()=>{if(document.hidden)finishIntro()});
   window.addEventListener('pageshow',e=>{if(e.persisted)finishIntro()});
   window.addEventListener('resize',scheduleRefresh,{passive:true});
   matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{sync();scheduleRefresh()});
   if(template)startIntro(false);else initScroll();
 }
 window.LYMELVA_MOTION_V11={boot,refresh:scheduleRefresh};
 if(!one('intro')){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
   else boot();
 }
})();
