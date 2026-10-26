import {P051_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p051-audio-plan-v1';
import {P051_FRAME_DOMAINS,P051_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p051-frame-v1';
export const P051_RUNTIME_ID='shared-nms002-l02-p051';
export function isP051RuntimeScope(props:{audioEnabled?:boolean;animationId:string;moduleKey?:string;query:Readonly<Record<string,unknown>>},env:Readonly<Record<string,string|undefined>>=process.env){
  return env.NODE_ENV!=='production'&&!env.VERCEL_ENV&&props.audioEnabled===true&&props.animationId===P051_RUNTIME_ID
    &&props.moduleKey===P051_RUNTIME_ID&&(props.query.capture===undefined||props.query.capture==='0')&&props.query.frameDomain==='sprite-257'
    &&props.query.scenario==='source-inspection'&&(props.query.lang==='en'||props.query.lang==='es');
}
export function isP051RuntimeModule(value:unknown):boolean {
  try {
    const m=value as {key?:string;maturity?:string;runtime?:{defaultFrameDomain?:string;frameCount?:number;fps?:number;frameDomains?:Array<{id:string;frameCount:number;rootFrame?:number}>};textPresentation?:{Renderer?:unknown};privateP051FractionMatch?:{version:number;sourceSwfSha256:string;audio:unknown}};
    const a=m?.privateP051FractionMatch,d=m?.runtime?.frameDomains;
    return m?.key===P051_RUNTIME_ID&&m.maturity==='private-current-js'&&typeof m.textPresentation?.Renderer==='function'
      &&m.runtime?.defaultFrameDomain==='sprite-257'&&m.runtime.frameCount===10&&m.runtime.fps===12
      &&Array.isArray(d)&&d.length===Object.keys(P051_FRAME_DOMAINS).length
      &&Object.entries(P051_FRAME_DOMAINS).every(([id,count])=>d.filter(x=>x.id===id&&x.frameCount===count&&(id==='root'||x.rootFrame===6)).length===1)
      &&a?.version===1&&a.sourceSwfSha256===P051_SOURCE_SHA256&&JSON.stringify(a.audio)===JSON.stringify(P051_AUDIO_PLANS);
  }catch{return false;}
}
