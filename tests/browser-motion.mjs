import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {chromium} from 'playwright-core';

const dist=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=pathname.endsWith('/')?pathname+'index.html':pathname;
  const path=resolve(dist,'.'+relative);
  if(path!==dist&&!path.startsWith(dist+sep))throw new Error('outside dist');
  const info=await stat(path);
  if(!info.isFile())throw new Error('not file');
  const buf=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address();
const url='http://127.0.0.1:'+port+'/';
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']
});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.body.classList.contains('intro-running'),{timeout:2500});
 await page.waitForTimeout(450);
 const intro=await page.evaluate(()=>{
   const node=document.getElementById('intro');
   return {
     waapi:node?.classList.contains('intro-waapi'),
     running:document.body.classList.contains('intro-running'),
     logoAnimations:node?.querySelector('.intro-inner img')?.getAnimations().length||0,
     titleAnimations:node?.querySelector('.intro-word')?.getAnimations().length||0
   };
 });
 assert.equal(intro.waapi,true,'desktop intro must use real WAAPI sequence');
 assert.ok(intro.logoAnimations>=1&&intro.titleAnimations>=1,'intro logo and text must animate');
 await page.waitForTimeout(3800);
 assert.equal(await page.locator('#intro').count(),0,'intro must auto-close');
 await page.locator('#services').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1150);
 const visible=await page.locator('#services-grid .service-photo-card.motion-entered').count();
 assert.ok(visible>0,'service cards must visibly enter when scrolled into view');
 const css=await page.locator('#services-grid .service-photo-card.motion-entered').first().evaluate(el=>getComputedStyle(el).opacity);
 assert.ok(Number(css)>.9,'revealed card must be visible: '+css);
 assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true','desktop motion is on');
 await page.close();
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 reduced.on('pageerror',err=>errors.push(err.message));
 await reduced.goto(url,{waitUntil:'domcontentloaded'});
 await reduced.waitForTimeout(950);
 assert.equal(await reduced.locator('#intro').count(),0,'reduced-motion should never trap visitor');
 assert.equal(await reduced.locator('#motion-toggle').getAttribute('aria-pressed'),'false','OS reduced motion should be respected');
 await reduced.locator('#motion-toggle').click();
 await reduced.waitForTimeout(450);
 const chosen=await reduced.evaluate(()=>{
   const intro=document.querySelector('#intro');
   return {active:document.documentElement.dataset.motionActive,
     waapi:intro?.classList.contains('intro-waapi'),
     animations:intro?.querySelector('.intro-word')?.getAnimations().length||0};
 });
 assert.equal(chosen.active,'true','manual opt-in should enable motion');
 assert.equal(chosen.waapi,true,'manual replay must animate on reduced-motion desktop');
 assert.ok(chosen.animations>0,'manual opt-in title should actually animate');
 await reduced.locator('#skip-intro').click();
 await reduced.waitForTimeout(500);
 assert.equal(await reduced.locator('#intro').count(),0,'skip must dismiss intro');
 await reduced.close();
 assert.deepEqual(errors,[],'page Javascript must not throw runtime exceptions');
 console.log('PASS Chrome desktop: animated intro, auto close, scroll reveal, reduce-motion opt-in, skip and runtime errors');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
