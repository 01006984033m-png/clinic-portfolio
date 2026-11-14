import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const dist=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8',
 '.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  const relative=pathname.endsWith('/')?pathname+'index.html':pathname;
  const path=resolve(dist,'.'+relative);
  if(!path.startsWith(dist+sep)||!(await stat(path)).isFile())throw Error('not found');
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>!document.querySelector('#intro'),{timeout:10000});
 await page.evaluate(async()=>{
  await document.fonts.ready;
  window.__scrollPerf={longTasks:[],layoutShifts:[],frames:[],animations:[]};
  if('PerformanceObserver' in window){
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries())window.__scrollPerf.longTasks.push({duration:e.duration,start:e.startTime});
   }).observe({type:'longtask',buffered:false})}catch{}
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries())if(!e.hadRecentInput)window.__scrollPerf.layoutShifts.push(e.value);
   }).observe({type:'layout-shift',buffered:false})}catch{}
  }
 });
 const report=await page.evaluate(async()=>{
  const target=Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const duration=7000;
  const beginning=performance.now();
  const samples=[];
  let prev=beginning, count=0;
  await new Promise(resolve=>{
   function tick(t){
    if(t-prev>0&&t-prev<2500)samples.push(t-prev);
    prev=t;
    const elapsed=t-beginning;
    const progress=Math.min(1,elapsed/duration);
    const normalized=progress<=.5?progress*2:(1-progress)*2;
    const easing=normalized*normalized*(3-2*normalized);
    window.scrollTo(0,target*easing);
    if(progress<1)requestAnimationFrame(tick);
    else resolve();
   }
   requestAnimationFrame(tick);
  });
  await new Promise(r=>setTimeout(r,200));
  const sorted=samples.slice().sort((a,b)=>a-b),percentile=p=>sorted[Math.floor((sorted.length-1)*p)]||0;
  const blockers=window.__scrollPerf.longTasks.filter(x=>x.start>=beginning);
  const layout=window.__scrollPerf.layoutShifts.reduce((a,b)=>a+b,0);
  const result={samples:samples.length,frameMsP50:+percentile(.5).toFixed(1),
   frameMsP90:+percentile(.9).toFixed(1),frameMsP95:+percentile(.95).toFixed(1),
   frameMsMax:+(sorted.at(-1)||0).toFixed(1),
   framesOver50:samples.filter(x=>x>50).length,framesOver100:samples.filter(x=>x>100).length,
   longTaskCount:blockers.length,longTaskMs:+blockers.reduce((a,b)=>a+b.duration,0).toFixed(0),
   layoutShift:+layout.toFixed(3),scrollWidth:document.documentElement.scrollWidth,
   viewportWidth:innerWidth,heroVisible:!!document.querySelector('#hero-title'),
   animationCount:document.getAnimations().length};
  return result;
 });
 console.log('DESKTOP_SCROLL_PERF',JSON.stringify(report));
 assert.deepEqual(errors,[],'no JS errors during desktop scroll');
 assert.ok(report.samples>=100,'rAF should continue during scroll (not main thread frozen)');
 assert.ok(report.scrollWidth<=report.viewportWidth+12,'no desktop horizontal overflow');
 assert.ok(report.framesOver100<=8,'excessive main-thread freezes while scrolling: '+JSON.stringify(report));
 assert.ok(report.longTaskMs<=1200,'scroll spends too long blocked by JS: '+JSON.stringify(report));
 assert.ok(report.layoutShift<.15,'scroll triggered unexpected layout shifts: '+JSON.stringify(report));
 console.log('PASS DESKTOP SCROLL: rAF responsive, no high long-task budget, no overflow or layout shifts');
}finally{await browser.close();await new Promise(r=>server.close(r))}
