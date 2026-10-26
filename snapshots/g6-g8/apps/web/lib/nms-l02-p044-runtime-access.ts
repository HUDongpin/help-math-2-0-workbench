import {P044_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p044-audio-plan-v1';
import {P044_FRAME_DOMAINS,P044_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p044-frame-v1';
export const P044_RUNTIME_ID='shared-nms002-l02-p044';
export function isP044RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
  return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P044_RUNTIME_ID
    &&props.moduleKey===P044_RUNTIME_ID&&props.query.capture!=='1'&&props.query.frameDomain==='sprite-243'
    &&props.query.scenario==='source-inspection'&&props.query.lang==='en';
}
export function isP044RuntimeModule(value:unknown):boolean {
  try {
    const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP044PartitionPractice?:{version:number;sourceSwfSha256:string;audio:unknown}};
    const a=m?.privateP044PartitionPractice,d=m?.runtime?.frameDomains;
    return m?.key===P044_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
      &&m.runtime?.defaultFrameDomain==='sprite-243'&&m.runtime.frameCount===10&&m.runtime.fps===12
      &&Array.isArray(d)&&d.length===Object.keys(P044_FRAME_DOMAINS).length
      &&Object.entries(P044_FRAME_DOMAINS).every(([id,count])=>d.filter(x=>x.id===id&&x.frameCount===count&&(id==='root'||x.rootFrame===6)).length===1)
      &&a?.version===1&&a.sourceSwfSha256===P044_SOURCE_SHA256&&JSON.stringify(a.audio)===JSON.stringify(P044_AUDIO_PLANS);
  }catch{return false;}
}
