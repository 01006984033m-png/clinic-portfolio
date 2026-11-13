/* LYMELVA v10: lightweight, user-controlled desktop motion.
   No libraries, trackers, network requests or perpetual visual animation. */
'use strict';
(() => {
 const root=document.documentElement, key='lymelva-motion-opt-in';
 let started=false, template=null, current=null, introToken=0;
 let closeTimer=0, watchdog=0, detachTimer=0, rafId=0;
 let introAnimations=[], revealObserver=null, mutationObserver=null, refreshPending=false;
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const preference=()=>{try{return localStorage.getItem(key)}catch{return null}};
 const enabled=()=>preference()==='true'||(preference()!=='false'&&!reduced());
 const save=value=>{try{localStorage.setItem(key,value)}catch{}};
 const desktop=()=>window.innerWidth>=961;
 const one=id=>document.getElementById(id);
 const targets='main .reveal,main .service-photo-card,main .insight-card,main .journey-step,main .education-promo-inner > *,main .statement-art,main .guide-list a,main .faq-item,main .contact-form,main .contact-copy,main .hero-visual-photo,main .edu-hero-grid > *,main .edu-section-head,main .edu-card,main .edu-topic-card,main .edu-sources-grid > *,main .edu-safety,main .edu-notice';
 function syncUI(){
   const active=enabled();
   root.dataset.motionActive=String(active);
   root.dataset.motionOptIn=preference()==='true'?'true':'false';
   const btn=one('motion-toggle');
   if(btn){
     const ar=root.lang==='ar';
     btn.setAttribute('aria-pressed',String(active));
     btn.setAttribute('aria-label',active?(ar?'إيقاف الحركة':'Disable motion'):(ar?'تشغيل الحركة':'Enable motion'));
     btn.title=active?(ar?'إيقاف الأنيميشن':'Disable animations'):(ar?'تشغيل الأنيميشن':'Enable animations');
     const title=btn.querySelector('.motion-toggle-label');
     if(title)title.textContent=active?(ar?'الحركة مفعلة':'Motion on'):(ar?'تشغيل الحركة':'Motion off');
   }
 }
 function reveal(el){
   if(revealObserver)revealObserver.unobserve(el);
   if(!el.isConnected)return;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(!el.isConnected)return;
     el.classList.add('motion-entered');
     el.classList.remove('motion-pending');
   }));
 }
 function refresh(){
   if(!started)return;
   syncUI();
   const animate=enabled()&&desktop()&&!!revealObserver;
   let i=0;
   document.querySelectorAll(targets).forEach(el=>{
     if(el.dataset.motionTracked==='1')return;
     el.dataset.motionTracked='1';
     el.classList.add('motion-reveal');
     if(!animate){el.classList.add('motion-entered');return}
     const rect=el.getBoundingClientRect();
     if(rect.bottom<=0){el.classList.add('motion-entered');return}
     el.style.setProperty('--motion-delay',String((i++%3)*65)+'ms');
     el.classList.add('motion-pending');
     revealObserver.observe(el);
   });
 }
 function scheduleRefresh(){
   if(refreshPending)return;
   refreshPending=true;
   queueMicrotask(()=>{refreshPending=false;refresh()});
 }
 function revealAll(){
   document.querySelectorAll('.motion-reveal').forEach(el=>{
     if(revealObserver)revealObserver.unobserve(el);
     el.classList.remove('motion-pending');
     el.classList.add('motion-entered');
   });
 }
 function cancelIntroAnimations(){
   introAnimations.forEach(animation=>{try{animation.cancel()}catch{}});
   introAnimations=[];
   if(rafId)cancelAnimationFrame(rafId);
   rafId=0;
 }
 function clearIntroTimers(){
   clearTimeout(closeTimer);clearTimeout(watchdog);clearTimeout(detachTimer);
 }
 function finishIntro(node=current,token=introToken){
   if(!node||token!==introToken||node.dataset.done==='true')return;
   node.dataset.done='true';
   clearIntroTimers();
   node.classList.add('done');
   document.body.classList.add('intro-finished');
   detachTimer=setTimeout(()=>{
     if(token!==introToken)return;
     cancelIntroAnimations();
     if(node.isConnected)node.remove();
     document.body.classList.remove('intro-running');
   },330);
 }
 function motionPart(node,selector,frames,duration,delay=0){
   const part=node.querySelector(selector);
   if(!part||typeof part.animate!=='function')return;
   const animation=part.animate(frames,{duration,delay,fill:'both',easing:'cubic-bezier(.22,.75,.22,1)'});
   introAnimations.push(animation);
 }
 function playFrames(node,token){
   if(token!==introToken||node.dataset.done==='true')return;
   if(typeof node.animate!=='function'){node.classList.add('intro-active');return}
   node.classList.add('intro-waapi');
   motionPart(node,'.intro-bg-photo',[
     {transform:'translate3d(0,20px,0) scale(1.19)'},
     {transform:'translate3d(0,0,0) scale(1.025)'}
   ],3160);
   motionPart(node,'.intro-inner img',[
     {opacity:0,transform:'translate3d(0,55px,0) scale(.55) rotate(-12deg)'},
     {opacity:1,transform:'translate3d(0,0,0) scale(1) rotate(0deg)'}
   ],1100,140);
   motionPart(node,'.intro-kicker',[
     {opacity:0,transform:'translate3d(0,20px,0)'},
     {opacity:1,transform:'translate3d(0,0,0)'}
   ],700,510);
   motionPart(node,'.intro-word',[
     {opacity:0,transform:'translate3d(0,38px,0) scale(.9)'},
     {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
   ],1200,570);
   motionPart(node,'.intro-label',[
     {opacity:0,transform:'translate3d(0,18px,0)'},
     {opacity:1,transform:'translate3d(0,0,0)'}
   ],900,1080);
   motionPart(node,'.intro-progress span',[
     {transform:'scaleX(0)'},
     {transform:'scaleX(1)'}
   ],3150);
   motionPart(node,'.intro-light-streak',[
     {opacity:0,transform:'translate3d(-80vw,0,0) skewX(-23deg)'},
     {opacity:.34,transform:'translate3d(90vw,0,0) skewX(-23deg)'},
     {opacity:0,transform:'translate3d(120vw,0,0) skewX(-23deg)'}
   ],1550,880);
 }
 function startIntro(force=false){
   if(!template)return;
   introToken++;
   const token=introToken;
   clearIntroTimers();cancelIntroAnimations();
   if(current?.isConnected)current.remove();
   const node=template.cloneNode(true);
   node.id='intro';
   node.classList.remove('done','intro-static','intro-active','intro-soft-motion','intro-restart','intro-waapi');
   node.removeAttribute('data-done');
   document.body.insertBefore(node,document.body.firstChild);
   current=node;
   document.body.classList.add('intro-running');
   document.body.classList.remove('intro-finished');
   node.querySelector('#skip-intro')?.addEventListener('click',()=>finishIntro(node,token),{once:true});
   const full=force||enabled();
   const play=node.querySelector('#play-intro-motion');
   if(play)play.hidden=true;
   node.classList.add(full?'intro-active':'intro-soft-motion');
   if(full){
     rafId=requestAnimationFrame(()=>{
       rafId=requestAnimationFrame(()=>playFrames(node,token));
     });
   }
   // Independent timers guarantee that a slow asset cannot trap a visitor.
   closeTimer=setTimeout(()=>finishIntro(node,token),full?3500:450);
   watchdog=setTimeout(()=>finishIntro(node,token),4200);
 }
 function setMotion(value){
   save(value?'true':'false');syncUI();
   if(!value){revealAll();finishIntro()}
   else{scheduleRefresh();if(template)startIntro(true)}
 }
 function boot(){
   if(started)return;started=true;
   const initialIntro=one('intro');
   template=initialIntro?.cloneNode(true)||null;
   if(initialIntro)initialIntro.remove(); // Avoid duplicate intro IDs and a hidden leftover overlay.
   syncUI();
   const btn=one('motion-toggle');
   btn?.addEventListener('click',()=>setMotion(!enabled()));
   one('replay-intro')?.addEventListener('click',()=>{save('true');syncUI();startIntro(true)});
   one('header-replay-intro')?.addEventListener('click',()=>{save('true');syncUI();startIntro(true)});
   if('IntersectionObserver' in window){
     revealObserver=new IntersectionObserver(entries=>{
       entries.forEach(entry=>{if(entry.isIntersecting)reveal(entry.target)});
     },{threshold:.09,rootMargin:'0px 0px -6% 0px'});
   }
   refresh();
   if('MutationObserver' in window){
     mutationObserver=new MutationObserver(scheduleRefresh);
     ['services-grid','insights-grid','cards','sources-grid'].forEach(id=>{
       const el=one(id);
       if(el)mutationObserver.observe(el,{childList:true});
     });
   }
   window.addEventListener('pagehide',()=>finishIntro());
   document.addEventListener('visibilitychange',()=>{if(document.hidden)finishIntro()});
   window.addEventListener('pageshow',e=>{if(e.persisted)finishIntro()});
   window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{
     syncUI();if(!enabled())revealAll();else scheduleRefresh();
   });
   window.addEventListener('resize',scheduleRefresh,{passive:true});
   if(template)startIntro(false);
 }
 window.LYMELVA_MOTION_V10={boot,refresh:scheduleRefresh};
 // The patient education page has a separate script, but shares motion preferences.
 if(!one('intro')){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
   else boot();
 }
})();
