import type{RuntimeContext}from'./contract';
import{P036_FRAME_DATA as DATA}from'./generated/nms-l02-p036-frame-data-v1';
import{P036_ID,p036Initial,p036Advance,p036OpenTerm,type P036SessionState,type P036TermId}from'./nms-l02-p036-state-v1';
import type{P036Pose}from'./nms-l02-p036-teaching-v1';
interface FrameData{readonly poses:readonly P036Pose[];readonly domains:Readonly<Record<string,{readonly frameCount:number;readonly frames:readonly(readonly number[])[]}>>;}
const IR:FrameData=DATA;
function freeze<T>(x:T):T{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);for(const v of Object.values(x))freeze(v);}return x;}freeze(DATA);
export const P036_SCENARIOS=Object.freeze([{id:'source-explanation',label:'Source train and calculator explanation'},{id:'simple-simpler-simplest-glossary',label:'Source simplest glossary'},{id:'decimal-equivalent-glossary',label:'Source decimal equivalent glossary'},{id:'fraction-glossary',label:'Source fraction glossary'}]);
export function p036LocalPoses(domain:string,frame:number){if(!Object.hasOwn(IR.domains,domain)||!Number.isSafeInteger(frame)||frame<1||frame>IR.domains[domain].frameCount)throw Error('P036_LOCAL_FRAME');return Object.freeze(IR.domains[domain].frames[frame-1].map(i=>IR.poses[i]));}
export function p036ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-89',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/u,''),rootFrame=domain==='root'?frame:6;
 if(frame!==c.frame||!Number.isSafeInteger(c.seed)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P036_SCENARIOS.some(s=>s.id===c.scenario)||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P036_FRAME_IDENTITY');
 const poses=p036LocalPoses(domain,frame),mainFrame=domain==='root'?(frame>=6?1:null):frame;let state=p036Advance(p036Initial(c.seed,c.replay??0),(mainFrame??1)-1);
 if(mainFrame!==null&&c.scenario!=='source-explanation')state=p036OpenTerm(state,c.scenario.replace(/-glossary$/u,'')as P036TermId);
 return Object.freeze({animationId:P036_ID,sourceSha256:DATA.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses,state});
}
export type P036FrameState=ReturnType<typeof p036ModuleFrame>;
export function p036LiveFrame(state:P036SessionState,language:'en'|'es'):P036FrameState{if(!['en','es'].includes(language))throw Error('P036_LANGUAGE');return Object.freeze({animationId:P036_ID,sourceSha256:DATA.sourceSha256,frame:state.mainFrame,frameDomain:'sprite-89',domain:'89',rootFrame:6,mainFrame:state.mainFrame,language,seed:state.seed,replay:state.replay,scenario:'live-interaction',queryKind:'live-state',poses:p036LocalPoses('89',state.mainFrame),state});}
