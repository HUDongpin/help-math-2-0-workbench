import {P039_AUDIO_SOURCE} from '../../../packages/demos/src/generated/nms-l02-p039-audio-source-v1';
import {P039_FRAME_DOMAINS} from '../../../packages/demos/src/nms-l02-p039-frame-v1';
export const P039_RUNTIME_ID='shared-nms002-l02-p039';
export function isP039RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
 return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P039_RUNTIME_ID&&props.moduleKey===P039_RUNTIME_ID
  &&props.query.capture!=='1'&&props.query.frameDomain==='sprite-237'&&props.query.scenario==='source-practice'&&props.query.lang==='en';
}
/** Extra metadata check after the registered module loader; never substitutes for its frozen binding. */
export function isP039RuntimeModule(value:unknown):boolean{
 try{
  const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP039PercentPractice?:{version:number;sourceSwfSha256:string;audio:unknown;offstageAudioDomain?:{id:string;frameCount:number};dormantDomain?:{id:string;frameCount:number}}};
  const a=m?.privateP039PercentPractice,domains=m?.runtime?.frameDomains;
  return m?.key===P039_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
   &&m.runtime?.defaultFrameDomain==='sprite-237'&&m.runtime.frameCount===10&&m.runtime.fps===12&&Array.isArray(domains)&&domains.length===6
   &&Object.entries(P039_FRAME_DOMAINS).every(([id,count])=>domains.filter(d=>d.id===id&&d.frameCount===count&&(id==='root'||d.rootFrame===6)).length===1)
   &&!!a&&a.version===1&&a.sourceSwfSha256==='cb087b675e4ada79fb53d4a7f7368f69ed96abf6a71ea4c6e56afdaa683bd649'
   &&JSON.stringify(a.audio)===JSON.stringify(P039_AUDIO_SOURCE)&&a.offstageAudioDomain?.id==='sprite-230'&&a.offstageAudioDomain.frameCount===55
   &&a.dormantDomain?.id==='sprite-236'&&a.dormantDomain.frameCount===20;
 }catch{return false;}
}
