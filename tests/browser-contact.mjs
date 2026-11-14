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
 assert.deepEqual(errors,[],'no browser runtime errors');
 await page.goto(url+'education/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#mobile-bottom-nav').isVisible(),true,'education has the same mobile bar');
 assert.equal(await page.locator('[data-bottom-target="education"]').getAttribute('aria-current'),'page','education is selected');
 console.log('PASS MOBILE 390px: fixed 4-link bar, prefilled WhatsApp, form POST accepted/failure, manual Gmail fallback, education parity');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
