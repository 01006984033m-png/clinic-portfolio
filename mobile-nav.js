/* Shared site navigation and prepared WhatsApp messages. No network calls. */
'use strict';
(()=>{
 const NUMBER='201027594048',BASE='https://wa.me/'+NUMBER;
 const ar=()=>document.documentElement.lang!=='en';
 const generic=()=>ar()
  ?'مرحباً LYMELVA، أريد الاستفسار عن خدمات العلاج الطبيعي والوذمة اللمفية، وتفاصيل التقييم والمواعيد المتاحة.'
  :'Hello LYMELVA, I would like information about physical therapy and lymphedema care, initial assessment and available appointment times.';
 const linkFor=message=>BASE+'?text='+encodeURIComponent(String(message||generic()).slice(0,1600));
 function refresh(){
  const labels=ar()?{home:'الرئيسية',services:'الخدمات',education:'التوعية',contact:'تواصل معنا'}:{home:'Home',services:'Services',education:'Learn',contact:'Contact'};
  document.querySelectorAll('[data-mobile-label]').forEach(el=>{el.textContent=labels[el.dataset.mobileLabel]||''});
  document.querySelectorAll('a[href^="'+BASE+'"]').forEach(a=>{
   const text=a.id==='result-whatsapp'&&a.dataset.formMessage?a.dataset.formMessage:generic();
   a.href=linkFor(text);
  });
 }
 function active(id){
  const nav=document.getElementById('mobile-bottom-nav');if(!nav)return;
  for(const a of nav.querySelectorAll('.mobile-bottom-link')){
   const yes=a.dataset.bottomTarget===id;
   a.classList.toggle('is-current',yes);
   if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  }
 }
 function init(){
  refresh();
  const nav=document.getElementById('mobile-bottom-nav');if(!nav)return;
  if(location.pathname.includes('/education')){active('education');return}
  nav.querySelectorAll('a[data-bottom-target]').forEach(a=>a.addEventListener('click',()=>{
   if(a.dataset.bottomTarget!=='education')active(a.dataset.bottomTarget);
  }));
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
   if(visible.length)active(visible[0].target.id);
  },{threshold:[.1,.3,.5],rootMargin:'-10% 0px -45% 0px'});
  ['top','services','contact'].forEach(id=>{const section=document.getElementById(id);if(section)observer.observe(section)});
 }
 window.LYMELVA_WA={linkFor,refresh,generic};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
