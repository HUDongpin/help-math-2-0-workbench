import {P048_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p048-audio-plan-v1';
import {P048_FRAME_DOMAINS,P048_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p048-frame-v1';
export const P048_RUNTIME_ID='shared-nms002-l02-p048';
export function isP048RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
  return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P048_RUNTIME_ID
    &&props.moduleKey===P048_RUNTIME_ID&&props.query.capture!=='1'&&props.query.frameDomain==='sprite-498'
    &&props.query.scenario==='source-inspection'&&props.query.lang==='en';
}
export function isP048RuntimeModule(value:unknown):boolean {
  try {
    const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP048DecimalInput?:{version:number;sourceSwfSha256:string;audio:unknown}};
    const a=m?.privateP048DecimalInput,d=m?.runtime?.frameDomains;
    return m?.key===P048_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
      &&m.runtime?.defaultFrameDomain==='sprite-498'&&m.runtime.frameCount===10&&m.runtime.fps===12
      &&Array.isArray(d)&&d.length===Object.keys(P048_FRAME_DOMAINS).length
      &&Object.entries(P048_FRAME_DOMAINS).every(([id,count])=>d.filter(x=>x.id===id&&x.frameCount===count&&(id==='root'||x.rootFrame===6)).length===1)
      &&a?.version===1&&a.sourceSwfSha256===P048_SOURCE_SHA256&&JSON.stringify(a.audio)===JSON.stringify(P048_AUDIO_PLANS);
  }catch{return false;}
}
