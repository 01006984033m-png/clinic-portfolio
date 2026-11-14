import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const dist=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=pathname.endsWith('/')?pathname+'index.html':pathname;
  const path=resolve(dist,'.'+relative);
  if(path!==dist&&!path.startsWith(dist+sep))throw Error('outside dist');
  if(!(await stat(path)).isFile())throw Error('not file');
  // Artificially slow scripts to test whether the landing page flashes before the intro.
  if(relative==='/app.js'||relative==='/motion-v11.js')await new Promise(resolve=>setTimeout(resolve,450));
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await page.addInitScript(() => {
   window.__lymelvaMotionCalls=[];
   const nativeAnimate=Element.prototype.animate;
   Element.prototype.animate=function(frames,options){
     const inIntro=!!this.closest('#intro');
     const inHero=!!this.closest('.hero-copy,.hero-visual-photo');
     const signature=this.className?.baseVal||this.className||this.tagName;
     window.__lymelvaMotionCalls.push({intro:inIntro,hero:inHero,signature:String(signature)});
     return nativeAnimate.call(this,frames,options);
   };
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'commit'});
 await page.waitForFunction(()=>document.querySelector('#intro')!==null,{timeout:3000});
 const initial=await page.evaluate(()=>{
  const n=document.querySelector('#intro'),s=getComputedStyle(n),b=n.getBoundingClientRect();
  return {visible:s.display==='flex'&&s.visibility==='visible'&&b.width>=1000,
    count:document.querySelectorAll('#intro').length,body:document.body.classList.contains('intro-running')};
 });
 assert.equal(initial.visible,true,'Landing page must not flash before the intro '+JSON.stringify(initial));
 assert.equal(initial.count,1,'one intro in first paint');
 await page.waitForFunction(()=>document.body.classList.contains('intro-js-ready'),{timeout:5000});
 assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true','desktop motion defaults on, even under OS reduced-motion');
 await page.waitForTimeout(500);
 const playing=await page.evaluate(()=>{
  const n=document.querySelector('#intro');
  return {waapi:n?.classList.contains('intro-waapi'),count:document.querySelectorAll('#intro').length,
   logo:n?.querySelector('.intro-inner img')?.getAnimations().length||0,
   title:n?.querySelector('.intro-word')?.getAnimations().length||0,
   time:n?.querySelector('.intro-word')?.getAnimations()[0]?.currentTime||0};
 });
 assert.equal(playing.waapi,true,'intro needs a real timeline '+JSON.stringify(playing));
 assert.equal(playing.count,1,'intro must not duplicate');
 const photoKeys=await page.locator('#intro .intro-bg-photo').evaluate(img=>{
   const a=img.getAnimations().find(x=>x.effect?.getKeyframes);
   return a?.effect?.getKeyframes().map(k=>k.transform)||[];
 });
 assert.deepEqual(photoKeys,[
   'translate3d(0px, 8px, 0px) scale(1.06)',
   'translate3d(0px, -8px, 0px) scale(1.06)'
 ],'intro image must pan without abrupt scale or image distortion');
 assert.ok(playing.logo>0&&playing.title>0&&playing.time>100,'logo and title must move '+JSON.stringify(playing));
 await page.waitForTimeout(3900);
 assert.equal(await page.locator('#intro').count(),0,'intro removed after full cinematic animation');
 const introCounts=await page.evaluate(()=>({
   intro:window.__lymelvaMotionCalls.filter(x=>x.intro).length,
   hero:window.__lymelvaMotionCalls.filter(x=>x.hero).length,
   heroCSS:Array.from(document.querySelectorAll('.hero-copy > *, .hero-visual-photo')).filter(el=>el.getAnimations().length>0).map(el=>el.className)
 }));
 assert.equal(introCounts.intro,7,'exactly one seven-part cinematic timeline on first load '+JSON.stringify(introCounts));
 assert.equal(introCounts.hero,0,'no second hero WAAPI entrance after intro '+JSON.stringify(introCounts));
 assert.deepEqual(introCounts.heroCSS,[],'no second hero CSS animation after intro');
 assert.equal(await page.locator('#services-grid .service-photo-card').count(),6,'services present');
 const firstCard=page.locator('#services-grid .service-photo-card').first();
 assert.notEqual(await firstCard.getAttribute('data-motion-shown'),'1','below-fold cards must wait until scroll');
 await page.evaluate(()=>document.querySelector('#services-grid').scrollIntoView({block:'center'}));
 await page.waitForTimeout(150);
 const active=await page.evaluate(()=>Array.from(document.querySelectorAll('#services-grid .service-photo-card h3')).filter(n=>n.getAnimations().length>0).length);
 assert.ok(active>0,'service text must move on scroll, without fading photographs');
 const textMotion=await page.evaluate(()=>{
   const el=Array.from(document.querySelectorAll('#services-grid .service-photo-card h3'))
     .find(node=>node.getAnimations().some(animation=>animation.effect?.getKeyframes));
   const frames=el?.getAnimations().filter(a=>a.effect?.getKeyframes).flatMap(a=>a.effect.getKeyframes())||[];
   return {frames:frames.map(f=>({transform:f.transform||null,opacity:f.opacity||null})),
     opacity:el?getComputedStyle(el).opacity:null};
 });
 assert.equal(textMotion.opacity,'1','animated headings must remain fully opaque');
 assert.ok(textMotion.frames.length>=2&&textMotion.frames.every(f=>f.transform&&f.opacity===null),
   'headings must move visibly without any opacity tween: '+JSON.stringify(textMotion));
 assert.ok(textMotion.frames.some(f=>/54px|36px/.test(f.transform)),
   'text entry should have a meaningful transform, not disappear');
 const photoStability=await page.evaluate(()=>{
   const frame=document.querySelector('#services-grid .service-photo-frame');
   const photo=frame?.querySelector('img');
   const card=frame?.closest('.service-photo-card');
   const scrollKeyframes=card?.getAnimations().filter(a=>a.effect?.getKeyframes).flatMap(a=>a.effect.getKeyframes())||[];
   const rect=photo?.getBoundingClientRect();
   return {imageTransform:photo?getComputedStyle(photo).transform:null,
     photoFilter:photo?getComputedStyle(photo).filter:null,
     objectFit:photo?getComputedStyle(photo).objectFit:null,
     naturalWidth:photo?.naturalWidth||0,
     rect:rect?{width:rect.width,height:rect.height}:null,
     scrollKeyframes:scrollKeyframes.map(f=>({opacity:f.opacity,transform:f.transform||null}))};
 });
 assert.equal(photoStability.imageTransform,'none','service images must not zoom or distort during card entry');
 assert.equal(photoStability.objectFit,'cover','photographs retain cover cropping');
 assert.ok(photoStability.naturalWidth>0,'photograph asset loaded');
 assert.equal(photoStability.scrollKeyframes.length,0,
   'photograph wrappers must never animate opacity (the source of flashing): '+JSON.stringify(photoStability));
 await page.locator('#services-grid .service-photo-card').first().hover();
 await page.waitForTimeout(180);
 assert.equal(await page.locator('#services-grid .service-photo-frame img').first().evaluate(el=>getComputedStyle(el).transform),
   'none','hover must not add a second image transform');
 const hoverFilter=await page.locator('#services-grid .service-photo-frame img').first().evaluate(el=>getComputedStyle(el).filter);
 assert.equal(hoverFilter,photoStability.photoFilter,'hover must not increase saturation or brightness');
 await page.waitForTimeout(1200);
 assert.ok((await page.locator('#services-grid .service-photo-card h3[data-motion-shown="1"]').count())>0,'service copy finishes reveal');
 // Down/up/down tests photograph exposure, opacity and live animations.
 // A changing filter or any wrapper opacity animation would recreate the
 // reported lights-on/lights-off flicker on desktop.
 const samples=[];
 const textSamples=[];
 for(let cycle=0;cycle<4;cycle++){
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(100);
   await page.evaluate(()=>document.querySelector('#services-grid').scrollIntoView({block:'center'}));
   await page.waitForTimeout(120);
   samples.push(await page.evaluate(()=>{
     const card=document.querySelector('#services-grid .service-photo-card');
     const img=card?.querySelector('.service-photo-frame img');
     return {
       photoOpacity:getComputedStyle(img).opacity,
       cardOpacity:getComputedStyle(card).opacity,
       photoFilter:getComputedStyle(img).filter,
       photoAnimations:img.getAnimations().length,
       cardAnimations:card.getAnimations().length
     };
   }));
   textSamples.push(await page.evaluate(()=>{
     const heading=document.querySelector('#services-grid .service-photo-card h3');
     const copy=document.querySelector('#services-grid .service-photo-card p');
     return {headingOpacity:getComputedStyle(heading).opacity,
       copyOpacity:getComputedStyle(copy).opacity,
       headingAnimations:heading.getAnimations().length};
   }));

 }
 assert.ok(samples.every(s=>s.photoOpacity==='1'&&s.cardOpacity==='1'&&s.photoAnimations===0&&s.cardAnimations===0),
   'photo must never darken or flash in either scroll direction '+JSON.stringify(samples));
 assert.equal(new Set(samples.map(s=>s.photoFilter)).size,1,'photo filter must be constant while scrolling '+JSON.stringify(samples));
 assert.ok(textSamples.length===4&&textSamples.every(s=>s.headingOpacity==='1'&&s.copyOpacity==='1'),
   'text must never blink during down/up/down scrolling '+JSON.stringify(textSamples));
 assert.ok(textSamples.every(s=>s.headingAnimations===0),
   'entrance must not retrigger on every scroll direction '+JSON.stringify(textSamples));

 await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('#header-replay-intro').click()});
 await page.waitForTimeout(480);
 assert.equal(await page.locator('#intro').count(),1,'replay is unique and active');
 const replayCounts=await page.evaluate(()=>({
  intro:window.__lymelvaMotionCalls.filter(x=>x.intro).length,
  hero:window.__lymelvaMotionCalls.filter(x=>x.hero).length
 }));
 assert.equal(replayCounts.intro,14,'one manual replay adds exactly one timeline');
 assert.equal(replayCounts.hero,0,'replay must not trigger duplicate hero animation');
 const replayState=await page.evaluate(()=>{
   const n=document.querySelector('#intro'),skip=document.querySelector('#skip-intro');
   const s=n?getComputedStyle(n):null, b=skip?getComputedStyle(skip):null;
   return {body:document.body.className,node:n?.className,visible:s?.visibility,opacity:s?.opacity,
     display:s?.display,buttonDisplay:b?.display,buttonVisibility:b?.visibility,
     buttonOpacity:b?.opacity,buttonRect:skip?.getBoundingClientRect().toJSON()};
 });
 console.log('REPLAY_VISIBILITY',JSON.stringify(replayState));
 await page.locator('#skip-intro').click({timeout:3000});
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#intro').count(),0,'skip closes intro');
 await page.locator('#motion-toggle').click();
 assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'false','desktop opt out works');
 await page.close();
 const edu=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 edu.on('pageerror',e=>errors.push(e.message));
 await edu.goto(base+'education/',{waitUntil:'domcontentloaded'});
 assert.equal(await edu.locator('#motion-toggle').getAttribute('aria-pressed'),'true','education motion also defaults on for desktop');
 assert.equal(await edu.locator('#cards .edu-card').count(),30,'all education articles present');
 await edu.evaluate(()=>document.querySelector('#cards .edu-card').scrollIntoView({block:'center'}));
 await edu.waitForTimeout(180);
 const count=await edu.evaluate(()=>Array.from(document.querySelectorAll('#cards .edu-card h3')).filter(n=>n.getAnimations().length>0).length);
 assert.ok(count>0,'education text moves on scroll without fading its images');
 await edu.close();
 assert.deepEqual(errors,[],'zero browser Javascript runtime errors');
 console.log('PASS CHROME 1440px: one cinematic timeline, no image distortion, fixed image/text opacity across 4 scroll cycles, transform-only text motion, replay and skip');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
