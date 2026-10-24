/** Maintained integration of exact browser PCM with the P035 page owner.
 * Source-frame/sample alignment and listening remain independent gates. */
import {DecodedSourceStreamTransport,
 type DecodedSourceStreamBinding,type DecodedStreamResult}
 from './decoded-source-stream-transport';
import {P035PageAudioOwnerV1,type P035Transport}
 from './alg-l06-p035-audio-owner-v1';
import type {P035Choice,P035FeedbackId,P035Glossary}
 from './alg-l06-p035-state-v1';
import {P035_MEASURED_BINDINGS,type P035MeasuredDomainId}
 from './alg-l06-p035-measured-bindings-v1';

const IDS=['main','sa',80,95,126,154,195,207] as const;
const no=(reason:string):DecodedStreamResult=>({accepted:false,reason});
const validId=(id:unknown):id is P035MeasuredDomainId=>
 IDS.some(value=>value===id);
const bindingFor=(id:P035MeasuredDomainId):DecodedSourceStreamBinding=>
 P035_MEASURED_BINDINGS[id];
type VolumeTransport=P035Transport & Pick<DecodedSourceStreamTransport,'setVolume'>;
const sourceHex=async(bytes:ArrayBuffer)=>
 [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');

export interface P035MeasuredAudioOptions{
 readonly nowSeconds:()=>number;
 readonly commitMain:(frame:number)=>boolean;
 readonly commitFeedback:(id:number,localFrame:number)=>boolean;
 /** Actual local asset endpoints. A source is accepted only by size and SHA. */
 readonly sourceUrls:Readonly<Record<P035MeasuredDomainId,string>>;
 readonly baseUrl:string;
 readonly fetchSource?:typeof fetch;
 readonly createContext?:(id:P035MeasuredDomainId,binding:DecodedSourceStreamBinding)=>AudioContext;
 /** Test seam; normal construction uses the maintained decoded transport. */
 readonly createTransport?:(id:P035MeasuredDomainId,binding:DecodedSourceStreamBinding)=>VolumeTransport;
}

function sourceUrl(base:URL,path:string):URL{
 if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//'))
  throw Error('P035_SOURCE_URL_NOT_ROOT_RELATIVE');
 const url=new URL(path,base);
 if(url.origin!==base.origin||url.username||url.password||url.hash||
    !['http:','https:'].includes(url.protocol))
  throw Error('P035_SOURCE_URL_OUT_OF_SCOPE');
 return url;
}

async function readSource(response:Response,url:URL,
 binding:DecodedSourceStreamBinding,mime:string):Promise<ArrayBuffer>{
 if(response.status!==200||response.redirected||response.url!==url.href)
  throw Error('P035_SOURCE_HTTP_BINDING');
 const length=Number(response.headers.get('content-length'));
 if(!Number.isSafeInteger(length)||length!==binding.sourceBytes||
    response.headers.get('content-encoding')!==null||
    !response.headers.get('content-type')?.toLowerCase().startsWith(mime))
  throw Error('P035_SOURCE_HTTP_ENVELOPE');
 if(!response.body)throw Error('P035_SOURCE_HTTP_BODY_MISSING');
 const bytes=new Uint8Array(binding.sourceBytes),reader=response.body.getReader();
 let offset=0,ended=false;
 try{
  for(;;){
   const part=await reader.read();
   if(part.done){ended=true;break;}
   if(!(part.value instanceof Uint8Array)||part.value.length===0||
      offset+part.value.length>bytes.length)
    throw Error('P035_SOURCE_HTTP_OVERLONG');
   bytes.set(part.value,offset);offset+=part.value.length;
  }
 }catch(error){await reader.cancel().catch(()=>{});throw error;}
 finally{reader.releaseLock();}
 if(!ended||offset!==bytes.length)throw Error('P035_SOURCE_HTTP_EARLY_EOF');
 if(await sourceHex(bytes.buffer)!==binding.sourceSha256)
  throw Error('P035_SOURCE_SHA256_MISMATCH');
 return bytes.buffer;
}

/** All audio domains have distinct lazy contexts; only the page owner can
 * start one domain at a time. No decoded cursor is translated into SWF frames. */
export class P035MeasuredAudioIntegrationV1{
 private readonly listeners=new Set<()=>void>();
 private readonly unsubscribers:(()=>void)[]=[];
 private readonly pending=new Map<P035MeasuredDomainId,AbortController>();
 private generation=0;
 private closed=false;
 private constructor(private readonly owner:P035PageAudioOwnerV1,
  private readonly transports:ReadonlyMap<P035MeasuredDomainId,VolumeTransport>,
  private readonly urls:ReadonlyMap<P035MeasuredDomainId,URL>,
  private readonly fetchSource:typeof fetch){
  for(const id of IDS){
   const transport=transports.get(id);
   if(!transport)throw Error('P035_MISSING_MEASURED_TRANSPORT');
   this.unsubscribers.push(transport.subscribe(()=>this.emit()));
  }
 }

 static async create(options:P035MeasuredAudioOptions):Promise<P035MeasuredAudioIntegrationV1>{
  const base=new URL(options.baseUrl);
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password||
     base.search||base.hash)throw Error('P035_BASE_URL_INVALID');
  const urls=new Map<P035MeasuredDomainId,URL>();
  for(const id of IDS)urls.set(id,sourceUrl(base,options.sourceUrls[id]));
  if(new Set([...urls.values()].map(value=>value.href)).size!==IDS.length)
   throw Error('P035_SOURCE_URL_COLLISION');
  const transports=new Map<P035MeasuredDomainId,VolumeTransport>();
  try{
   for(const id of IDS){
    const binding=bindingFor(id);
    const transport=options.createTransport?.(id,binding)??
     new DecodedSourceStreamTransport(binding,{createContext:()=>
      options.createContext?.(id,binding)??
      new AudioContext({sampleRate:binding.sampleRate,latencyHint:'interactive'})});
    if(!transport||typeof transport.close!=='function'||
       typeof transport.subscribe!=='function'||typeof transport.setVolume!=='function')
     throw Error('P035_INVALID_MEASURED_TRANSPORT');
    transports.set(id,transport);
   }
   const owner=new P035PageAudioOwnerV1({
    nowSeconds:options.nowSeconds,commitMain:options.commitMain,
    commitFeedback:options.commitFeedback,
    createTransport:id=>{
     const transport=transports.get(id);
     if(!transport)throw Error('P035_MISSING_MEASURED_TRANSPORT');
     return transport;
    }});
   return new P035MeasuredAudioIntegrationV1(owner,transports,urls,
    options.fetchSource??fetch);
  }catch(error){
   await Promise.allSettled([...transports.values()].map(transport=>transport.close()));
   throw error;
  }
 }

 private emit(){for(const fn of this.listeners)fn();}
 subscribe(listener:()=>void):()=>void{
  if(this.closed)throw Error('P035_MEASURED_OWNER_CLOSED');
  this.listeners.add(listener);return ()=>this.listeners.delete(listener);
 }
 snapshot(){return this.owner.snapshot();}
 /** Apply the My Lesson slider to all domains, including streams that will be
  * prepared later. Decoded transports retain this value across prepare/play. */
 setVolume(volume:number):DecodedStreamResult{
  if(this.closed||!Number.isFinite(volume)||volume<0||volume>1)
   return no('invalid-volume');
  for(const id of IDS){
   const result=this.transports.get(id)!.setVolume(volume);
   if(!result.accepted)return no(`volume-${String(id)}-${result.reason}`);
  }
  this.emit();return {accepted:true,reason:'volume-set'};
 }

 /** Fetches an exact same-origin source, reads complete EOF, then lets the
  * existing owner and browser-PCM transport perform their own checks. */
 async prepare(id:P035MeasuredDomainId):Promise<DecodedStreamResult>{
  if(this.closed||!validId(id)||this.pending.has(id))
   return no('measured-prepare-unavailable');
  const ticket=this.generation,abort=new AbortController();
  this.pending.set(id,abort);
  try{
   const url=this.urls.get(id)!,binding=bindingFor(id);
   const response=await this.fetchSource.call(globalThis,url.href,{method:'GET',
    redirect:'error',credentials:'same-origin',cache:'no-store',signal:abort.signal});
   const bytes=await readSource(response,url,binding,id===207?'audio/wav':'audio/mpeg');
   if(ticket!==this.generation||this.closed)return no('stale-source-load');
   return await this.owner.prepare(id,bytes);
  }catch(error){
   if(ticket!==this.generation||this.closed)return no('stale-source-load');
   return no(error instanceof Error?error.message:'measured-source-load-failed');
  }finally{if(this.pending.get(id)===abort)this.pending.delete(id);this.emit();}
 }

 private sync<T>(work:()=>T):T{try{return work();}finally{this.emit();}}
 private async asyncWork<T>(work:()=>Promise<T>):Promise<T>{
  try{return await work();}finally{this.emit();}
 }
 playMain(policy:{activation:'user'}){return this.asyncWork(()=>this.owner.playMain(policy));}
 pause(){return this.sync(()=>this.owner.pause());}
 resumeFeedback(policy:{activation:'user'}){
  return this.asyncWork(()=>this.owner.resumeFeedback(policy));
 }
 tick(){return this.asyncWork(()=>this.owner.tick());}
 choose(choice:P035Choice){return this.sync(()=>this.owner.choose(choice));}
 resolveFeedback(id:P035FeedbackId,policy:{activation:'user'|'automatic'}){
  return this.asyncWork(()=>this.owner.resolveFeedback(id,policy));
 }
 closeWrong(token:number){return this.asyncWork(()=>this.owner.closeWrong(token));}
 openGlossary(key:P035Glossary){return this.sync(()=>this.owner.openGlossary(key));}
 closeGlossary(){return this.sync(()=>this.owner.closeGlossary());}
 startSupplemental(policy:{activation:'user'}){
  return this.asyncWork(()=>this.owner.startSupplemental(policy));
 }
 pauseSupplemental(){return this.sync(()=>this.owner.pauseSupplemental());}
 resumeSupplemental(policy:{activation:'user'}){
  return this.asyncWork(()=>this.owner.resumeSupplemental(policy));
 }
 returnSupplemental(){return this.sync(()=>this.owner.returnSupplemental());}
 replay():DecodedStreamResult{
  if(this.closed)return no('measured-owner-closed');
  this.generation++;
  for(const abort of this.pending.values())abort.abort();
  this.pending.clear();
  return this.sync(()=>this.owner.replay());
 }
 async close():Promise<void>{
  if(this.closed)return;
  this.closed=true;this.generation++;
  for(const abort of this.pending.values())abort.abort();
  this.pending.clear();
  try{await this.owner.close();}
  finally{
   this.emit();
   for(const unsubscribe of this.unsubscribers)unsubscribe();
   this.listeners.clear();
  }
 }
}
