import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';
let suffix=30;
const data={name:'Sample Visitor',phone:'01012345678',email:'',type:'initial',time:'morning',details:'Please call about an initial visit.',website:''};
function mock(overrides={}){
 let status=200,payload;
 const req={method:'POST',headers:{host:'clinic-portfolio-sigma.vercel.app',origin:'https://clinic-portfolio-sigma.vercel.app',
  'content-type':'application/json','x-forwarded-for':'198.51.100.'+(++suffix)},body:{...data}};
 Object.assign(req,overrides);
 const res={setHeader(){},status(s){status=s;return this},json(v){payload=v;return this}};
 return {req,res,read:()=>({status,payload})};
}
test('reject unsafe method, media type and cross-origin',async()=>{
 let x=mock({method:'GET'});await handler(x.req,x.res);assert.equal(x.read().status,405);
 x=mock({headers:{host:'clinic-portfolio-sigma.vercel.app','content-type':'text/plain'}});await handler(x.req,x.res);assert.equal(x.read().status,415);
 x=mock({headers:{host:'clinic-portfolio-sigma.vercel.app',origin:'https://other.example','content-type':'application/json'}});await handler(x.req,x.res);assert.equal(x.read().status,403);
});
test('reject invalid input and honeypot',async()=>{
 let x=mock({body:{...data,phone:'2'}});await handler(x.req,x.res);assert.equal(x.read().status,400);
 x=mock({body:{...data,website:'spam'}});await handler(x.req,x.res);assert.deepEqual(x.read().payload,{sent:false,code:'NOT_SENT'});
 x=mock({body:{...data,details:'x'.repeat(1200)}});await handler(x.req,x.res);assert.equal(x.read().status,400);
});
test('provider accepted: fixed owner email and sanitized message',async()=>{
 const f=globalThis.fetch,saveKey=process.env.RESEND_API_KEY,saveFrom=process.env.RESEND_FROM_EMAIL;
 delete process.env.RESEND_API_KEY;delete process.env.RESEND_FROM_EMAIL;
 let request;
 globalThis.fetch=async(url,options)=>{request={url,options};return {status:302,headers:{get:k=>k==='location'?'/thankyou.php':null}}};
 try{
  const x=mock();await handler(x.req,x.res);
  assert.deepEqual(x.read(),{status:200,payload:{sent:true,acceptance:'provider'}});
  assert.equal(request.url,'https://email.gosecureserver.in/api/send.php');
  const sent=JSON.parse(request.options.body);
  assert.equal(sent.to,'01006984033m@gmail.com');
  assert.equal(sent.email,'01006984033m@gmail.com');
  assert.ok(sent.message.includes(data.phone));
  assert.ok(sent.message.includes(data.name),'name delivered in email body');
  assert.ok(sent.message.includes('Initial assessment'),'request type delivered in email body');
  assert.ok(sent.message.includes('Morning'),'preferred time delivered in email body');
  assert.ok(sent.message.includes(data.details),'details delivered in email body');
  assert.ok(!sent.message.includes('undefined'));
 }finally{globalThis.fetch=f;if(saveKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=saveKey;if(saveFrom===undefined)delete process.env.RESEND_FROM_EMAIL;else process.env.RESEND_FROM_EMAIL=saveFrom}
});
test('provider must explicitly accept, never trust HTML 200',async()=>{
 const f=globalThis.fetch,save=process.env.RESEND_API_KEY;
 delete process.env.RESEND_API_KEY;
 globalThis.fetch=async()=>({status:200,headers:{get:()=>null}});
 try{const x=mock();await handler(x.req,x.res);assert.deepEqual(x.read(),{status:502,payload:{sent:false,code:'EMAIL_PROVIDER_REJECTED'}})}
 finally{globalThis.fetch=f;if(save===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=save}
});
test('email with invalid syntax is rejected and never reaches provider',async()=>{
 const x=mock({body:{...data,email:'invalid@'}});
 await handler(x.req,x.res);assert.equal(x.read().status,400);
});
