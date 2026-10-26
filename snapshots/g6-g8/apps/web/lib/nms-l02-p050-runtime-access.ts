import {P050_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p050-audio-plan-v1';
import {P050_FRAME_DOMAINS,P050_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p050-frame-v1';
export const P050_RUNTIME_ID='shared-nms002-l02-p050';
export function isP050RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
  return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P050_RUNTIME_ID
    &&props.moduleKey===P050_RUNTIME_ID&&props.query.capture!=='1'&&props.query.frameDomain==='sprite-94'
    &&props.query.scenario==='source-inspection'&&props.query.lang==='en';
}
export function isP050RuntimeModule(value:unknown):boolean {
  try {
    const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP050NumberLine?:{version:number;sourceSwfSha256:string;audio:unknown}};
    const a=m?.privateP050NumberLine,d=m?.runtime?.frameDomains;
    return m?.key===P050_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
      &&m.runtime?.defaultFrameDomain==='sprite-94'&&m.runtime.frameCount===10&&m.runtime.fps===12
      &&Array.isArray(d)&&d.length===Object.keys(P050_FRAME_DOMAINS).length
      &&Object.entries(P050_FRAME_DOMAINS).every(([id,count])=>d.filter(x=>x.id===id&&x.frameCount===count&&(id==='root'||x.rootFrame===6)).length===1)
      &&a?.version===1&&a.sourceSwfSha256===P050_SOURCE_SHA256&&JSON.stringify(a.audio)===JSON.stringify(P050_AUDIO_PLANS);
  }catch{return false;}
}
