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
 assert.ok(playing.logo>0&&playing.title>0&&playing.time>100,'logo and title must move '+JSON.stringify(playing));
 await page.waitForTimeout(3900);
 assert.equal(await page.locator('#intro').count(),0,'intro removed after full cinematic animation');
 assert.equal(await page.locator('#services-grid .service-photo-card').count(),6,'services present');
 const firstCard=page.locator('#services-grid .service-photo-card').first();
 assert.notEqual(await firstCard.getAttribute('data-motion-shown'),'1','below-fold cards must wait until scroll');
 await page.evaluate(()=>document.querySelector('#services-grid').scrollIntoView({block:'center'}));
 await page.waitForTimeout(150);
 const active=await page.evaluate(()=>Array.from(document.querySelectorAll('#services-grid .service-photo-card')).filter(n=>n.getAnimations().length>0).length);
 assert.ok(active>0,'scroll must cause active browser animations, not just an is-visible class');
 await page.waitForTimeout(1200);
 assert.ok((await page.locator('#services-grid .service-photo-card[data-motion-shown="1"]').count())>0,'services finish reveal');
 await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('#header-replay-intro').click()});
 await page.waitForTimeout(480);
 assert.equal(await page.locator('#intro').count(),1,'replay is unique and active');
 await page.locator('#skip-intro').click();
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
 const count=await edu.evaluate(()=>Array.from(document.querySelectorAll('#cards .edu-card')).filter(n=>n.getAnimations().length>0).length);
 assert.ok(count>0,'education cards should animate on scroll, not only change class');
 await edu.close();
 assert.deepEqual(errors,[],'zero browser Javascript runtime errors');
 console.log('PASS CHROME 1440px: true first paint, full intro WAAPI, no duplicate, scroll animations, manual replay, skip, education, reduced-motion desktop default');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
