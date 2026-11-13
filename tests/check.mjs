import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
import assert from 'node:assert/strict';
const base=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const root=read('index.html'),edu=read('education/index.html'),data=read('education/content.js'),logo=read('assets/lymelva-mark.svg');
const context={window:{}};vm.runInNewContext(data,context,{timeout:1000});
const db=context.window.LYMELVA_LIBRARY;assert(db,'education data missing');
assert.equal(db.articles.length,30,'30 guides required');assert.equal(Object.keys(db.refs).length,15,'15 references required');
const ids=new Set;for(const a of db.articles){assert(!ids.has(a.id),'duplicate topic id');ids.add(a.id);
 assert(a.ar.title && a.en.title && a.ar.summary && a.en.summary,'missing bilingual article');
 assert(a.ar.points.length>=3 && a.en.points.length>=3,'missing takeaways');
 assert(a.sources.length>=1,'uncited article');
 for(const src of a.sources)assert(db.refs[src] && /^https:\/\//.test(db.refs[src][1]),'invalid source URL');
}
for(const [k,v] of Object.entries(db.refs))assert(/^https:\/\//.test(v[1]),'non-HTTPS ref '+k);
for(const [name,page] of [['index.html',root],['education/index.html',edu]]){assert(page.includes('name="robots" content="noindex,nofollow"'),name+' must be noindex');
 assert(page.includes('data-theme="light"') && page.includes('id="theme"'),name+' missing theme');
 assert(page.includes('id="lang"') || page.includes('id="language"'),name+' missing language control');
 assert(page.includes('viewport-fit=cover'),name+' missing mobile viewport');
 const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
 for(const js of scripts)new vm.Script(js,{filename:name});
}
assert(root.includes('href="education/"'),'education page not linked from clinic');
assert(edu.includes('src="content.js"'),'education source not loaded');
assert(logo.includes('<svg'),'logo missing');
assert(read('robots.txt').includes('Disallow: /'),'provisional pages should not be indexed');
console.log('PASS: 30 guides, 15 sources, source citations, responsive/theme/lang control presence and inline script syntax');
