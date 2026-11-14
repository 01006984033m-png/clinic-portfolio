/* LYMELVA contact delivery — based on ELHADY Works' server-only email flow.
 * Never expose the recipient as a client-supplied parameter.
 * A provider's HTTP acceptance is not proof of delivery to Gmail inbox.
 * No enquiry content is logged, persisted or stored by this function. */
import {createHash} from 'node:crypto';
const TO='01006984033m@gmail.com';
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMIT=new Map();
const positive=(res,status,payload)=>res.status(status).json(payload);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Allow','POST');
 if(req.method!=='POST')return positive(res,405,{sent:false,code:'METHOD_NOT_ALLOWED'});
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))
  return positive(res,415,{sent:false,code:'UNSUPPORTED_MEDIA'});
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(':')[0].toLowerCase();
 const origin=String(req.headers.origin||'');
 if(origin){
  try{
   const u=new URL(origin);
   if(u.hostname.toLowerCase()!==host||(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(host)))
    return positive(res,403,{sent:false,code:'ORIGIN_REJECTED'});
  }catch{return positive(res,403,{sent:false,code:'ORIGIN_REJECTED'})}
 }
 const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
 const name=String(body.name||'').trim().replace(/[\r\n]/g,' ');
 const phone=String(body.phone||'').trim().replace(/[\r\n]/g,' ');
 const email=String(body.email||'').trim();
 const type=String(body.type||'');
 const time=String(body.time||'');
 const details=String(body.details||'').trim();
 if(body.website)return positive(res,200,{sent:false,code:'NOT_SENT'});
 if(Buffer.byteLength(JSON.stringify(body))>4000)return positive(res,413,{sent:false,code:'PAYLOAD_TOO_LARGE'});
 if(name.length<2||name.length>80||phone.length>30||phone.replace(/\D/g,'').length<8||
   phone.replace(/\D/g,'').length>16||email.length>180||(email&&!EMAIL.test(email))||
   !['initial','followup','general'].includes(type)||
   !['any','morning','afternoon','evening'].includes(time)||details.length>1000)
  return positive(res,400,{sent:false,code:'INVALID_FIELDS'});
 const rawIP=String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim();
 const ip=createHash('sha256').update(rawIP).digest('hex').slice(0,20);
 const now=Date.now(),rate=LIMIT.get(ip);
 if(rate&&now-rate.start<15*60*1000){
  if(rate.count>=4)return positive(res,429,{sent:false,code:'RATE_LIMIT'});
  rate.count++;
 }else LIMIT.set(ip,{start:now,count:1});
 if(LIMIT.size>2000){for(const [key,v] of LIMIT)if(now-v.start>15*60*1000)LIMIT.delete(key)}
 const types={initial:'Initial assessment',followup:'Follow-up enquiry',general:'General question'};
 const times={any:'Any time',morning:'Morning',afternoon:'Afternoon',evening:'Evening'};
 const message=['New LYMELVA clinic enquiry','Name: '+name,'Phone: '+phone,
  'Email: '+(email||'Not provided'),'Request: '+types[type],
  'Preferred contact time: '+times[time],details?'Enquiry: '+details:'','',
  'This is a contact enquiry, not a confirmed appointment.'].filter(Boolean).join('\n');
 const sender=email||TO;
 if(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL){
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',
    headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[TO],
      reply_to:email||undefined,subject:'New LYMELVA clinic enquiry',text:message}),
    signal:AbortSignal.timeout(9000)});
   const value=await response.json().catch(()=>({}));
   if(response.ok&&value.id)return positive(res,200,{sent:true,acceptance:'provider'});
   return positive(res,502,{sent:false,code:'EMAIL_PROVIDER_REJECTED'});
  }catch{return positive(res,502,{sent:false,code:'EMAIL_PROVIDER_UNAVAILABLE'})}
 }
 // The same no-account fallback was independently verified on ELHADY Works.
 // Only a 302 to its documented thank-you path counts as acceptance.
 try{
  const response=await fetch('https://email.gosecureserver.in/api/send.php',{
   method:'POST',redirect:'manual',signal:AbortSignal.timeout(9000),
   headers:{'Content-Type':'application/json','Accept':'application/json',
     Origin:'https://clinic-portfolio-sigma.vercel.app'},
   body:JSON.stringify({to:TO,name,email:sender,reply_to:sender,
     subject:'New LYMELVA clinic enquiry',message,hp_email:''})
  });
  const location=response.headers?.get?.('location')||'';
  const accepted=response.status===302&&
   (location==='/thankyou.php'||location==='https://email.gosecureserver.in/thankyou.php');
  if(!accepted)return positive(res,502,{sent:false,code:'EMAIL_PROVIDER_REJECTED'});
  return positive(res,200,{sent:true,acceptance:'provider'});
 }catch{return positive(res,502,{sent:false,code:'EMAIL_PROVIDER_UNAVAILABLE'})}
}
