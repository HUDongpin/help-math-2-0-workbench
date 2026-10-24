import type {RuntimeContext} from './contract';
import {P038_TEACHING_SOURCE as SOURCE} from './generated/nms-l02-p038-teaching-source-v1';
import {p038Initial,p038Advance,p038OpenTerm,type P038SessionState,type P038TermId} from './nms-l02-p038-state-v1';
export const P038_SCENARIOS=Object.freeze([
  {id:'source-explanation',label:'Source percent explanation'},
  ...(['percent','ratio','compare','quantity'] as const).map(id=>({id:id+'-glossary',label:'Source '+id+' glossary'})),
].map(s=>Object.freeze(s)));
export function p038ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-99',rootFrame=frameDomain==='root'?frame:6;
 if(!['root','sprite-99'].includes(frameDomain)||!Number.isSafeInteger(frame)||frame<1||frame>(frameDomain==='root'?10:467)
   ||c.frame!==frame||!['en','es'].includes(c.lang)||!P038_SCENARIOS.some(s=>s.id===c.scenario)
   ||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P038_QUERY_IDENTITY');
 const mainFrame=frameDomain==='root'?(frame<6?null:1):frame;
 let state=p038Advance(p038Initial(c.seed,c.replay??0),(mainFrame??1)-1);
 const requestedTerm=c.scenario==='source-explanation'?null:c.scenario.slice(0,-9)as P038TermId;
 if(mainFrame!==null&&requestedTerm)state=p038OpenTerm(state,requestedTerm);
 return Object.freeze({animationId:SOURCE.animationId,sourceSha256:SOURCE.sourceSha256,frame,frameDomain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,requestedTerm,termAvailable:state.term!==null,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',state});
}
export type P038FrameState=ReturnType<typeof p038ModuleFrame>;
export function p038LiveFrame(state:P038SessionState,language:'en'|'es'):P038FrameState{
 if(!['en','es'].includes(language))throw Error('P038_LANGUAGE');
 return Object.freeze({animationId:SOURCE.animationId,sourceSha256:SOURCE.sourceSha256,frame:state.mainFrame,frameDomain:'sprite-99',rootFrame:6,mainFrame:state.mainFrame,language,seed:state.seed,replay:state.replay,scenario:'live-interaction',requestedTerm:state.term,termAvailable:state.term!==null,queryKind:'live-state',state});
}
