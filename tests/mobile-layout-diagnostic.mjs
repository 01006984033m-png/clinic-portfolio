import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const dist=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=pathname.endsWith('/')?pathname+'index.html':pathname;
  const path=resolve(dist,'.'+relative);
  if(!path.startsWith(dist+sep)||!(await stat(path)).isFile())throw Error('not file');
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const configs=[
 {name:'real-android-393',viewport:{width:393,height:820},screen:{width:393,height:820},deviceScaleFactor:2.8,isMobile:true,hasTouch:true},
 {name:'real-android-360',viewport:{width:360,height:780},screen:{width:360,height:780},deviceScaleFactor:3,isMobile:true,hasTouch:true},
 {name:'desktop-request-touch',viewport:{width:980,height:820},screen:{width:393,height:820},deviceScaleFactor:2.8,isMobile:true,hasTouch:true},
 {name:'original-test-390',viewport:{width:390,height:844},screen:{width:390,height:844},deviceScaleFactor:1,isMobile:false,hasTouch:false}
];
try{
 for(const config of configs){
  const context=await browser.newContext({...config,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(base).origin)badResponses.push({status:r.status(),url:r.url().replace(base,'/')})});
  try{
   const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(6000);
   await page.evaluate(()=>{window.scrollTo(0,0)});
   await page.waitForTimeout(350);
   const m=await page.evaluate(()=>{
    const pick=(selector)=>{
     const el=document.querySelector(selector);if(!el)return null;
     const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1),
      display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,transform:s.transform.slice(0,90),
      text:(el.textContent||'').trim().slice(0,52)};
    };
    const center=document.elementFromPoint(innerWidth*.5,innerHeight*.45);
    return {innerWidth,innerHeight,visualWidth:visualViewport?.width,outerWidth,screenWidth:screen.width,
     scrollX,scrollY,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
     mediaMobile:matchMedia('(max-width:960px)').matches,mediaCoarse:matchMedia('(pointer:coarse)').matches,
     bodyClass:document.body.className,documentReady:document.readyState,
     intro:pick('#intro'),header:pick('#site-header'),hero:pick('#top'),heroCopy:pick('.hero-copy'),
     heroTitle:pick('#hero-title'),heroImage:pick('.hero-photo'),bottom:pick('#mobile-bottom-nav'),
     contact:pick('#contact'),center: center?.tagName+'#'+(center?.id||'')+'.'+(center?.className||'').toString().slice(0,55),
     loadedImg:Array.from(document.images).filter(i=>i.complete&&i.naturalWidth>0).length,
     totalImgs:document.images.length};
   });
   console.log('MOBILE_LAYOUT_DIAGNOSTIC',config.name,JSON.stringify({http:response.status(),...m,errors,badResponses}));
   assert.equal(response.status(),200,'site must return 200');
   assert.deepEqual(errors,[],'no runtime errors');
   assert.ok(m.hero&&m.hero.width>250&&m.hero.height>400,'hero should render');
   assert.ok(m.scrollWidth<=m.innerWidth+8,
     'critical: no 10,000px RTL overflow; scrollWidth='+m.scrollWidth+' innerWidth='+m.innerWidth);
   assert.ok(m.hero.x < m.visualWidth && m.hero.x + m.hero.width > 0,
     'critical: hero must intersect actual phone viewport '+JSON.stringify(m.hero));
   if(config.name!=='desktop-request-touch'){
     assert.ok(m.bottom?.width >= m.visualWidth*.72 && m.bottom.x>=-6 && m.bottom.x+m.bottom.width<=m.visualWidth+6,
      'mobile navigation must be visible and correctly anchored '+JSON.stringify(m.bottom));
     assert.ok(m.innerWidth<=m.visualWidth+8,'layout viewport must not zoom out the entire site');
   }
   console.log('PASS ANDROID BRAVE MOBILE VIEWPORT',config.name);
  }catch(e){console.error('MOBILE_LAYOUT_DIAGNOSTIC_ERROR',config.name,String(e).slice(0,1800));throw e}
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
