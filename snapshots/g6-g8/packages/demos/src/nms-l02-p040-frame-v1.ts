import type{RuntimeContext}from'./contract';
import{P040_SOURCE}from'./generated/nms-l02-p040-presentation-v1';
import{p040Initial,p040OpenTerm,type P040Term}from'./nms-l02-p040-state-v1';
export const P040_FRAME_DOMAINS=Object.freeze({root:10,'sprite-43':440});
export const P040_SCENARIOS=Object.freeze([{id:'source-explanation',label:'Source equivalent percent explanation'},...(['percent','equivalent','fraction','denominator']as const).map(id=>({id:id+'-glossary',label:'Source '+id+' glossary'}))].map(s=>Object.freeze(s)));
export function p040ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-43',rootFrame=frameDomain==='root'?frame:6;
 if(!Object.hasOwn(P040_FRAME_DOMAINS,frameDomain)||!Number.isSafeInteger(frame)||frame<1||frame>P040_FRAME_DOMAINS[frameDomain as keyof typeof P040_FRAME_DOMAINS]||c.frame!==frame||!['en','es'].includes(c.lang)||!P040_SCENARIOS.some(s=>s.id===c.scenario)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isSafeInteger(c.replay??0)||(c.replay??0)<0||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P040_QUERY_IDENTITY');
 const mainFrame=frameDomain==='root'?(frame<6?null:1):frame;
 let state=Object.freeze({...p040Initial(),frame:mainFrame??1,replay:c.replay??0});
 const requestedTerm=c.scenario==='source-explanation'?null:c.scenario.slice(0,-9)as P040Term;
 if(mainFrame!==null&&requestedTerm)state=p040OpenTerm(state,requestedTerm);
 return Object.freeze({animationId:'shared-nms002-l02-p040',sourceSha256:P040_SOURCE.sourceSha256,frame,frameDomain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,requestedTerm,termAvailable:state.term!==null,queryKind:'source-local-inspection' as const,state});
}
export type P040FrameState=ReturnType<typeof p040ModuleFrame>;
