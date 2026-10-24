import type {RuntimeContext} from './contract';
import {P010_IR as IR} from './generated/nms-l02-p010-source-ir-v1';
import {P010_ID,P010_BRANCHES,p010Initial,p010SourceNodes,p010LocalPoses,type P010SessionState} from './nms-l02-p010-timeline-v1';
export const P010_SCENARIOS=Object.freeze([{id:'source-question',label:'Source decimal-point question'},{id:'wrong-written',label:'Source wrong answer: written between'},{id:'wrong-used',label:'Source wrong answer: used between'}]);
/** Exact local-domain inspection; this does not execute a natural trace. */
export function p010ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-176',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(!Object.hasOwn(IR.domains,domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P010_SCENARIOS.some(s=>s.id===c.scenario))throw Error('P010_FRAME_IDENTITY');
 const initial=p010Initial(c.seed,replay),poses=p010LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P010_ROOT_FRAME');
 const mainFrame=domain==='176'?frame:domain==='root'?(frame>=6?frame-5:null):31;
 let session:P010SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,phase:mainFrame===31?'question':mainFrame===67?'completed':(mainFrame??1)>31?'outro':'intro'};
 for(const outcome of ['wrong','right']as const){const index=P010_BRANCHES[outcome].findIndex(b=>b.domain===domain);if(index>=0){const b=P010_BRANCHES[outcome][index];session={...session,domain,mainFrame:31,localFrame:frame,outcome,branch:index+1,answer:outcome==='right'?5:c.scenario==='wrong-used'?3:0,attempts:1,phase:outcome==='right'?'right':'hold'in b?(frame<b.hold?'wrong-in':frame===b.hold?'wrong-wait':'wrong-out'):'right'};}}
 return Object.freeze({animationId:P010_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses:Object.freeze(poses),nodes:Object.freeze(p010SourceNodes(domain,frame)),session:Object.freeze(session),component:!['root','176',...P010_BRANCHES.wrong.map(b=>b.domain),...P010_BRANCHES.right.map(b=>b.domain)].includes(domain)});
}
export type P010FrameState=ReturnType<typeof p010ModuleFrame>;
