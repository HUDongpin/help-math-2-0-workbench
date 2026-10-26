import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
export const P052_RUNTIME_ID='shared-nms002-l02-p052';
export function isP052RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
 const q=props.query,seed=q.seed??'0';
 return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P052_RUNTIME_ID
  &&props.moduleKey===P052_RUNTIME_ID&&(q.capture===undefined||q.capture==='0')&&q.frameDomain==='sprite-350'
  &&q.scenario==='intro'&&(q.lang==='en'||q.lang==='es')
  &&(q.frame===undefined||q.frame==='1')&&(q.rootFrame===undefined||q.rootFrame==='6')
  &&typeof seed==='string'&&/^(0|[1-9][0-9]*)$/.test(seed)&&Number.isSafeInteger(Number(seed))&&Number(seed)<=0xffffffff;
}
/** Called on a module returned by the real registry loader, not a caller-supplied
 * candidate. Shape validation alone is not registration evidence. */
export function isP052RuntimeModule(value:unknown){
 try{
  const m=value as {key?:string;maturity?:string;runtime?:{frameCount?:number;fps?:number;defaultFrameDomain?:string;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};
   textPresentation?:{Renderer?:unknown;binding?:{version?:string;sourceSwfSha256?:string}};
   privateP052PercentPractice?:{version?:number;sourceSwfSha256?:string;audio?:unknown}};
  const sha='5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638';
  return m?.key===P052_RUNTIME_ID&&m.maturity==='private-current-js'&&m.runtime?.frameCount===10&&m.runtime.fps===12
   &&m.runtime.defaultFrameDomain==='sprite-350'&&m.runtime.frameDomains?.length===1&&m.runtime.frameDomains.filter(d=>d.id==='sprite-350'&&d.frameCount===156&&d.rootFrame===6).length===1
   &&typeof m.textPresentation?.Renderer==='function'&&m.textPresentation.binding?.version==='p052-native-text-v1'
   &&m.textPresentation.binding.sourceSwfSha256===sha&&m.privateP052PercentPractice?.version===1
   &&m.privateP052PercentPractice.sourceSwfSha256===sha&&JSON.stringify(m.privateP052PercentPractice.audio)===JSON.stringify(P052_AUDIO_PLANS);
 }catch{return false;}
}
