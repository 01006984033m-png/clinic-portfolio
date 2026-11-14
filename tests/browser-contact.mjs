import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const dist=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const f=resolve(dist,'.'+(p.endsWith('/')?p+'index.html':p));
  if(!f.startsWith(dist+sep))throw Error('out of root');
  if(!(await stat(f)).isFile())throw Error('missing');
  res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});
  res.end(await readFile(f));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.querySelector('#intro'),{timeout:9000});
 const nav=page.locator('#mobile-bottom-nav');
 assert.equal(await nav.isVisible(),true,'mobile bottom nav visible');
 assert.equal(await nav.locator('.mobile-bottom-link').count(),4,'four mobile destinations');
 assert.equal(await nav.locator('.mobile-bottom-whatsapp').count(),1,'WhatsApp raised action present');
 // User-visible regression: a raised WhatsApp bubble previously covered
 // neighboring controls and the hero photograph on real Android devices.
 async function assertNoWhatsAppOverlap(width){
   await page.setViewportSize({width,height:844});
   await page.waitForTimeout(100);
   const geometry=await page.locator('#mobile-bottom-nav').evaluate(n=>{
     const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
     const wa=n.querySelector('.mobile-bottom-whatsapp');
     return {bar:r(n),wa:r(wa),links:[...n.querySelectorAll('.mobile-bottom-link')].map(r),
       innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
       padded:parseFloat(getComputedStyle(document.body).paddingBottom)};
   });
   const {bar,wa,links,padded,scrollWidth,innerWidth}=geometry;
   assert.ok(wa.top>=bar.top-1&&wa.bottom<=bar.bottom+1,
     'WhatsApp bubble must stay inside bottom bar '+JSON.stringify(geometry));
   assert.ok(wa.left>=bar.left-1&&wa.right<=bar.right+1,
     'WhatsApp bubble cannot overhang bottom bar '+JSON.stringify(geometry));
   for(const link of links){
     const overlap=Math.max(0,Math.min(wa.right,link.right)-Math.max(wa.left,link.left))*
       Math.max(0,Math.min(wa.bottom,link.bottom)-Math.max(wa.top,link.top));
     assert.equal(overlap,0,'WhatsApp must not cover another nav destination '+JSON.stringify(geometry));
   }
   assert.ok(padded>=bar.height,'last page content needs free space below bottom bar');
   assert.ok(scrollWidth<=innerWidth+1,'bottom bar should not cause horizontal overflow');
 }
 for(const width of [320,360,390])await assertNoWhatsAppOverlap(width);
 await page.setViewportSize({width:390,height:844});

 const dests=await nav.locator('.mobile-bottom-link').evaluateAll(els=>els.map(x=>x.getAttribute('href')));
 assert.deepEqual(dests,['#top','#services','education/','#contact'],'mobile nav destinations');
 const genericWA=await nav.locator('.mobile-bottom-whatsapp').getAttribute('href');
 assert.ok(genericWA?.includes('?text='),'WhatsApp opens a prepared message');
 assert.ok(decodeURIComponent(new URL(genericWA).searchParams.get('text')||'').includes('LYMELVA'),'WhatsApp text mentions clinic');
 let requests=[];
 await page.route('**/api/contact',async route=>{
  const body=route.request().postDataJSON();
  requests.push(body);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sent:true,acceptance:'provider'})});
 });
 await page.locator('#form-name').fill('Browser Test');
 await page.locator('#form-phone').fill('01012345678');
 await page.locator('#form-email').fill('sample@example.com');
 await page.locator('#form-type').selectOption('initial');
 await page.locator('#form-time').selectOption('morning');
 await page.locator('#form-details').fill('Please share appointment options.');
 await page.locator('#contact-form button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('#form-status')?.textContent.includes('استلم'),{timeout:4000});
 assert.equal(requests.length,1,'one POST only on first submit');
 assert.equal(requests[0].name,'Browser Test');
 assert.equal(requests[0].phone,'01012345678');
 assert.equal(requests[0].details,'Please share appointment options.');
 assert.equal(requests[0].email,'sample@example.com');
 const result=await page.locator('#result-whatsapp').getAttribute('href');
 const draft=new URL(result).searchParams.get('text')||'';
 assert.ok(draft.includes('Browser Test')&&draft.includes('01012345678'),'WhatsApp prefill contains visitor form details');
 assert.equal(await page.locator('#manual-email-link').isVisible(),false,'no duplicate manual email after accepted submission');
 // Switch to failure response and change form: preserve a manual email fallback.
 await page.unroute('**/api/contact');
 await page.route('**/api/contact',route=>route.fulfill({status:502,contentType:'application/json',
  body:JSON.stringify({sent:false,code:'EMAIL_PROVIDER_REJECTED'})}));
 await page.locator('#form-details').fill('Second question — delivery failure');
 await page.locator('#contact-form button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('#manual-email-link')?.hidden===false,{timeout:4000});
 assert.equal(await page.locator('#manual-email-link').isVisible(),true,'failed request exposes manual email alternative');
 assert.ok((await page.locator('#manual-email-link').getAttribute('href')).startsWith('mailto:01006984033m@gmail.com?'),'manual mail targets approved address');
 await page.locator('#form-name').focus();
 assert.equal(await nav.isVisible(),false,'bottom dock must get out of the way while entering form details');
 await page.locator('#form-name').evaluate(el=>el.blur());
 await page.waitForTimeout(80);
 assert.equal(await nav.isVisible(),true,'bottom dock returns after form focus ends');
  assert.deepEqual(errors,[],'no browser runtime errors');
 await page.goto(url+'education/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#mobile-bottom-nav').isVisible(),true,'education has the same mobile bar');
 assert.equal(await page.locator('[data-bottom-target="education"]').getAttribute('aria-current'),'page','education is selected');
 console.log('PASS MOBILE 320/360/390px: WhatsApp never obscures other controls, form focus behavior, prefilled message, contact POST, education parity');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
