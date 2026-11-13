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

// Brand restore release-specific invariants; preserve previous verified features.
assert.match(home,/brand-restore\.css/,'brand palette stylesheet loaded');
assert.match(edu,/brand-restore-education\.css/,'education dark/light parity');
assert.match(read('privacy.html'),/brand-restore\.css/,'privacy dark/light parity');
const educationPos=home.indexOf('education-promo-featured');
const servicePos=home.indexOf('<section id="services"');
const aboutPos=home.indexOf('<section id="about"');
assert.ok(educationPos>0&&educationPos<servicePos&&servicePos<aboutPos,'education is first, then services, then about');
assert.equal((home.match(/education-promo-featured/g)||[]).length,1,'one education panel; no duplicates');
assert.match(home,/hero-education-cta[^>]*href="education\/"|href="education\/"[^>]*hero-education-cta/,'hero education CTA navigates to library');
const brandCSS=read('brand-restore.css');
for (const hex of ['#0B4550','#218F91','#B7DCD2','#F7F4ED']) assert.ok(brandCSS.includes(hex),'missing original brand token '+hex);
assert.match(brandCSS,/html\[data-theme="dark"\][\s\S]*?#06171c/,'deep dark theme');
assert.match(brandCSS,/prefers-reduced-motion/,'motion accessibility');
assert.match(read('scripts/build.mjs'),/brand-restore\.css/,'production output includes brand overrides');

console.log('PASS 30 bilingual topics, 15 live reference URLs, 4 PDF guides, asset paths, local-only data, CSP, JS syntax and noindex');

// Light Comfort: protect the approved layout while making bright theme softer.
for(const page of ['index.html','education/index.html','privacy.html']){
  assert.match(read(page),/light-comfort\.css/,'light-comfort stylesheet on '+page);
}
const comfort=read('light-comfort.css');
for (const hex of ['#0B4550','#218F91','#B7DCD2','#F7F4ED']) assert.ok(comfort.includes(hex),'original brand token '+hex);
assert.match(comfort,/html\[data-theme="light"\]/,'light mode only override');
assert.doesNotMatch(comfort,/html\[data-theme="dark"\]/,'dark mode must be preserved');
assert.match(read('scripts/build.mjs'),/light-comfort\.css/,'light CSS included in output');

// Education photography, cinematic replay and author credit regressions.
assert.match(home,/Created by Mohammed Elhady/,'footer author credit');
assert.match(home,/id="replay-intro"/,'intro replay control');
assert.match(home,/desktop-motion\.css/,'desktop motion override linked');
assert.match(read('app.js'),/function activateIntro\(\)/,'intro replay logic retained');
assert.match(read('motion-v11.js'),/function animateLanding\(/,'desktop hero entrance motion');
assert.match(edu,/clinical-gallery\.css/,'education gallery stylesheet linked');
assert.match(edu,/edu-hero-photo/,'clinical hero photograph');
assert.match(edu,/id="article-image"/,'article imagery');
assert.match(read('education/education.js'),/function articlePhoto\(article\)/,'topic-to-image mapping');
assert.match(read('education/education.js'),/b\.append\(photo,top,title,summary,bottom\)/,'card photograph rendering');
assert.match(read('scripts/build.mjs'),/clinical-gallery\.css/,'education photo styles in dist');
assert.match(read('scripts/build.mjs'),/desktop-motion\.css/,'desktop motion styles in dist');
for(const name of ['assessment','compression','decongestive','manual','movement','selfcare','room'])assert.ok(existsSync(join(root,'assets/care-'+name+'.webp')),'education photo asset '+name);

// v7: independent visual per educational topic (never class-level reused images).
const educationJS=read('education/education.js');
assert.match(educationJS,/TOPIC_VISUAL_IDS/,'topic visual inventory');
assert.doesNotMatch(educationJS,/CLINICAL_PHOTOS/,'old repetitive category images removed');
for(const a of data.articles){
 const path='assets/education/'+a.id+'.webp';
 assert.ok(existsSync(join(root,path)),'missing subject-specific image: '+path);
 const {size}=await import('node:fs/promises').then(m=>m.stat(join(root,path)));
 assert.ok(size>3500&&size<300000,'image size and integrity '+path);
}
assert.match(home,/id="header-replay-intro"/,'visible desktop replay entrypoint');
assert.match(read('motion-v11.js'),/header-replay-intro/,'desktop replay event in the motion runtime');
assert.match(read('motion-v11.js'),/lymelva-motion-v11/,'desktop motion preference persisted');
assert.match(read('scripts/build.mjs'),/requiredTopicIds/,'all image assets included in production');


// V11: no first-paint flash, one timeline owner, and real scroll entry.
const motionJS=read('motion-v11.js'), motionCSS=read('motion-v11.css');
assert.match(home,/<body class="intro-running">/,'intro overlay visible at first browser paint');
assert.match(home,/id="motion-toggle"/,'visible desktop motion switch');
assert.match(edu,/id="motion-toggle"/,'patient library shares motion switch');
assert.match(home,/motion-v11\.js/,'new motion runtime linked');
assert.match(home,/motion-v11\.css/,'new motion stylesheet linked');
assert.match(edu,/\.\.\/motion-v11\.js/,'education shares motion runtime');
assert.match(read('app.js'),/LYMELVA_MOTION_V11\?\.boot/,'single animation boot owner');
assert.doesNotMatch(read('desktop-motion.css'),/V9: short automatic/,'legacy V9 animation override removed');
assert.doesNotMatch(read('desktop-motion.css'),/intro-manual-motion/,'legacy conflict removed');
assert.match(motionJS,/function scene\(/,'intro WAAPI motion timeline');
assert.match(motionJS,/\.animate\(/,'actual browser animation');
assert.match(motionJS,/function finishIntro\(/,'safe automatic intro close');
assert.match(motionJS,/full\?3750:500/,'full default desktop sequence');
assert.match(motionJS,/function animateLanding\(/,'hero entrance animation');
assert.match(motionJS,/function show\(/,'scroll animations have independent trigger');
assert.match(motionJS,/IntersectionObserver/,'viewport driven scroll reveal');
assert.match(motionJS,/MutationObserver/,'dynamic card observation');
assert.match(motionJS,/lymelva-motion-v11/,'isolated, persistent motion setting');
assert.match(motionJS,/desktop\(\)\|\|!reduced\(\)/,'desktop animation defaults on regardless OS');
assert.match(motionCSS,/lymelvaV11Failsafe/,'CSS fallback when JS never starts');
assert.match(read('scripts/build.mjs'),/motion-v11\.js/,'motion runtime included in dist');
assert.match(read('scripts/build.mjs'),/motion-v11\.css/,'motion CSS included in dist');
for(const p of ['motion-v11.js','motion-v11.css'])assert.ok(existsSync(join(root,p)),'missing '+p);
{
 const child=await import('node:child_process');
 const syntax=child.spawnSync(process.execPath,['--check',join(root,'motion-v11.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,'motion JS syntax: '+syntax.stderr);
}
console.log('PASS V11 first paint, desktop opt-in/out, intro timeline, scroll WAAPI and conflict removal');
