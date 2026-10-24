import type {RuntimeContext} from './contract';
import {P035_FRAME_DATA as DATA} from './generated/nms-l02-p035-frame-data-v1';
import {P035_ID,p035Initial,p035Advance,p035OpenTerm,type P035SessionState} from './nms-l02-p035-state-v1';
export interface P035Pose {readonly depth:number;readonly characterId:number;readonly birthFrame:number;readonly generation:number;readonly matrix:readonly number[];readonly color:readonly number[];readonly ratio:number;readonly clipDepth:number;readonly name:string|null;}
interface P035FrameData {readonly poses:readonly P035Pose[];readonly domains:Readonly<Record<string,{readonly frameCount:number;readonly frames:readonly(readonly number[])[]}>>;}
const IR:P035FrameData=DATA;
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(DATA);
export const P035_SCENARIOS=Object.freeze([{id:'source-explanation',label:'Source equivalent decimals explanation'},{id:'decimal-glossary',label:'Source Decimal glossary'},{id:'equivalent-decimal-glossary',label:'Source Equivalent decimal glossary'}]);
export function p035LocalPoses(domain:string,frame:number){
 if(!Object.hasOwn(IR.domains,domain)||!Number.isSafeInteger(frame)||frame<1||frame>IR.domains[domain].frameCount)throw Error('P035_LOCAL_FRAME');
 return Object.freeze(IR.domains[domain].frames[frame-1].map(i=>IR.poses[i]));
}
/** Source-local inspection is deterministic and does not execute an original trace. */
export function p035ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-46',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/u,''),rootFrame=domain==='root'?frame:6;
 if(frame!==c.frame||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P035_SCENARIOS.some(s=>s.id===c.scenario)||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P035_FRAME_IDENTITY');
 const poses=p035LocalPoses(domain,frame),mainFrame=domain==='root'?(frame>=6?1:null):frame;
 let state=p035Advance(p035Initial(c.seed,c.replay??0),(mainFrame??1)-1);
 if(mainFrame!==null){if(c.scenario==='decimal-glossary')state=p035OpenTerm(state,'decimal');if(c.scenario==='equivalent-decimal-glossary')state=p035OpenTerm(state,'equivalent-decimal');}
 return Object.freeze({animationId:P035_ID,sourceSha256:DATA.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses,state});
}
export type P035FrameState=ReturnType<typeof p035ModuleFrame>;
export function p035LiveFrame(state:P035SessionState,language:'en'|'es'):P035FrameState {
 if(!['en','es'].includes(language))throw Error('P035_LANGUAGE');
 return Object.freeze({animationId:P035_ID,sourceSha256:DATA.sourceSha256,frame:state.mainFrame,frameDomain:'sprite-46',domain:'46',rootFrame:6,mainFrame:state.mainFrame,language,seed:state.seed,replay:state.replay,scenario:'live-interaction',queryKind:'live-state',poses:p035LocalPoses('46',state.mainFrame),state});
}
