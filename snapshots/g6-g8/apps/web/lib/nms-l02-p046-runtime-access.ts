import {P046_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p046-audio-plan-v1';
import {P046_FRAME_DOMAINS,P046_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p046-frame-v1';
export const P046_RUNTIME_ID='shared-nms002-l02-p046';
export function isP046RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
  return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P046_RUNTIME_ID
    &&props.moduleKey===P046_RUNTIME_ID&&props.query.capture!=='1'&&props.query.frameDomain==='sprite-205'
    &&props.query.scenario==='source-inspection'&&props.query.lang==='en';
}
export function isP046RuntimeModule(value:unknown):boolean {
  try {
    const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP046FractionInput?:{version:number;sourceSwfSha256:string;audio:unknown}};
    const a=m?.privateP046FractionInput,d=m?.runtime?.frameDomains;
    return m?.key===P046_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
      &&m.runtime?.defaultFrameDomain==='sprite-205'&&m.runtime.frameCount===10&&m.runtime.fps===12
      &&Array.isArray(d)&&d.length===Object.keys(P046_FRAME_DOMAINS).length
      &&Object.entries(P046_FRAME_DOMAINS).every(([id,count])=>d.filter(x=>x.id===id&&x.frameCount===count&&(id==='root'||x.rootFrame===6)).length===1)
      &&a?.version===1&&a.sourceSwfSha256===P046_SOURCE_SHA256&&JSON.stringify(a.audio)===JSON.stringify(P046_AUDIO_PLANS);
  }catch{return false;}
}
