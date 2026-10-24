import type {RuntimeContext} from './contract';
import {P034_FRAME_DATA as DATA} from './generated/nms-l02-p034-frame-data-v1';
import {P034_ID,p034Initial,p034Advance,p034Reset,p034OpenTerm,type P034SessionState} from './nms-l02-p034-state-v1';
export interface P034Pose {readonly depth:number;readonly characterId:number;readonly birthFrame:number;readonly generation:number;readonly matrix:readonly number[];readonly color:readonly number[];readonly ratio:number;readonly clipDepth:number;readonly name:string|null;}
interface P034FrameData {readonly poses:readonly P034Pose[];readonly domains:Readonly<Record<string,{readonly frameCount:number;readonly frames:readonly(readonly number[])[]}>>;}
const IR:P034FrameData=DATA;
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(DATA);
export const P034_SCENARIOS=Object.freeze([{id:'source-decimal-practice',label:'Source guided decimal model'},{id:'slider-explore',label:'Slider exploration entry'},{id:'reset',label:'Source reset release'},{id:'decimal-glossary',label:'Source Decimal glossary'}]);
export function p034LocalPoses(domain:string,frame:number){
 if(!Object.hasOwn(IR.domains,domain)||!Number.isSafeInteger(frame)||frame<1||frame>IR.domains[domain].frameCount)throw Error('P034_LOCAL_FRAME');
 return Object.freeze(IR.domains[domain].frames[frame-1].map(i=>IR.poses[i]));
}
/** Source-local inspection does not execute a natural trace or infer a slider value
 * from a random seed. Live state retains its actual interaction history. */
export function p034ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-172',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/u,''),rootFrame=domain==='root'?frame:6;
 if(frame!==c.frame||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P034_SCENARIOS.some(s=>s.id===c.scenario)||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P034_FRAME_IDENTITY');
 const poses=p034LocalPoses(domain,frame),initial=p034Initial(c.seed,c.replay??0),component=!['root','172'].includes(domain),mainFrame=domain==='root'?(frame>=6?1:null):domain==='172'?frame:395;
 let state=p034Advance(initial,(mainFrame??1)>=395?395:(mainFrame??1)-1);
 if(mainFrame===396)state=Object.freeze({...state,mainFrame:396});
 if(!component&&mainFrame!==null){if(c.scenario==='reset'&&mainFrame>=395)state=p034Reset(state);if(c.scenario==='decimal-glossary')state=p034OpenTerm(state);}
 return Object.freeze({animationId:P034_ID,sourceSha256:DATA.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses,component,state});
}
export type P034FrameState=ReturnType<typeof p034ModuleFrame>;
export function p034LiveFrame(state:P034SessionState,language:'en'|'es'):P034FrameState {
 if(!['en','es'].includes(language))throw Error('P034_LANGUAGE');
 return Object.freeze({animationId:P034_ID,sourceSha256:DATA.sourceSha256,frame:state.mainFrame,frameDomain:'sprite-172',domain:'172',rootFrame:6,mainFrame:state.mainFrame,language,seed:state.seed,replay:state.replay,scenario:'live-interaction',queryKind:'live-state',poses:p034LocalPoses('172',state.mainFrame),component:false,state});
}
