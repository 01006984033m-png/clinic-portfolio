import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(join(root,p),'utf8');
const home=read('index.html'),edu=read('education/index.html'),vercel=JSON.parse(read('vercel.json'));
const ctx={window:{}};vm.runInNewContext(read('education/content.js'),ctx);
const data=ctx.window.LYMELVA_EDUCATION;
assert.equal(data.articles.length,30,'article count');
assert.equal(Object.keys(data.sources).length,15,'reference count');
assert.equal(new Set(data.articles.map(a=>a.id)).size,30,'unique article ids');
for(const a of data.articles){
 for(const l of ['ar','en']){assert.ok(a[l].title.length>5,a.id+' title');assert.ok(a[l].points.length>=3,a.id+' points');}
 assert.ok(a.sources.length>=1,a.id+' citations');for(const s of a.sources)assert.ok(data.sources[s],a.id+' unknown source '+s);
}
for(const src of Object.values(data.sources))assert.match(src.url,/^https:\/\//);
for(const p of ['index.html','styles.css','cinematic-care.css','app.js','education/index.html','education/education.css','education/education.js','education/content.js','privacy.html','assets/brand-board.png','assets/hero-treatment.webp','assets/care-assessment.webp','assets/care-decongestive.webp','assets/care-manual.webp','assets/care-compression.webp','assets/care-movement.webp','assets/care-selfcare.webp','assets/care-room.webp','assets/lymelva-mark.svg','assets/lymelva-logo.svg','assets/lymelva-logo-white.svg','guides/lymphedema-basics.pdf','guides/visit-preparation.pdf','guides/self-care.pdf','guides/brand-guidelines.pdf','README.md','RELEASE_GATE.md'])assert.ok(existsSync(join(root,p)),'missing '+p);
for(const name of ['lymphedema-basics','visit-preparation','self-care'])assert.ok(home.includes('guides/'+name+'.pdf'));
assert.match(home,/https:\/\/wa\.me\/201027594048/,'approved business WhatsApp number');
assert.match(edu,/201027594048/,'education contact link');
assert.match(home,/hero-treatment\.webp/,'photographic hero');
assert.match(home,/cinematic-care\.css/,'cinematic styles');
assert.match(home,/editorial-refine\.css/,'editorial theme stylesheet');
assert.match(read('education/index.html'),/editorial-refine\.css/,'patient education style parity');
assert.match(read('privacy.html'),/editorial-refine\.css/,'privacy style parity');
assert.doesNotMatch(read('editorial-refine.css'),/fonts\.googleapis|@import\b/,'no external fonts or trackers');
assert.match(home,/intro-light-streak/,'cinematic intro element');
assert.match(read('app.js'),/CARE_PHOTOS/,'photographic services');
assert.match(home,/noindex/i);assert.match(edu,/noindex/i);assert.match(read('robots.txt'),/Disallow: \//);
assert.match(edu,/safety/i);assert.match(home,/education\//);assert.match(home,/privacy.html/);
assert.doesNotMatch(read('app.js'),/fetch\s*\(|XMLHttpRequest|sendBeacon/,'unexpected contact transmission');
assert.doesNotMatch(read('education/education.js'),/fetch\s*\(|XMLHttpRequest|sendBeacon/,'unexpected education data transmission');
const script=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(home);
assert.ok(script,'inline structured-data script');
const wanted="'sha256-"+createHash('sha256').update(script[1]).digest('base64')+"'";
assert.ok(JSON.stringify(vercel).includes(wanted),'CSP inline script hash mismatch');
for(const path of ['app.js','education/education.js','education/content.js']){
 const child=await import('node:child_process'); const r=child.spawnSync(process.execPath,['--check',join(root,path)],{encoding:'utf8'}); assert.equal(r.status,0,path+': '+r.stderr);
}
console.log('PASS 30 bilingual topics, 15 live reference URLs, 4 PDF guides, asset paths, local-only data, CSP, JS syntax and noindex');
