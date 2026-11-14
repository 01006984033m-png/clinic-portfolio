import {chromium} from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const base='https://clinic-portfolio-sigma.vercel.app/';
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
  }catch(e){console.log('MOBILE_LAYOUT_DIAGNOSTIC_ERROR',config.name,String(e).slice(0,1200))}
  await context.close();
 }
}finally{await browser.close()}
