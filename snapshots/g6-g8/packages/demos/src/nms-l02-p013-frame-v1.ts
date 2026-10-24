import type {RuntimeContext} from './contract';
import {P013_IR as IR} from './generated/nms-l02-p013-source-ir-v1';
import {P013_ID,P013_WRONG,p013Initial,p013SourceNodes,p013LocalPoses,type P013State} from './nms-l02-p013-timeline-v1';
export const P013_SCENARIOS=Object.freeze([{id:'source-sixths',label:'Authored demonstration and sixths exercise'},{id:'after-one',label:'One source sector placed'},{id:'after-two',label:'Two source sectors placed'},{id:'after-three',label:'Three source sectors placed'},{id:'wrong-outside',label:'Source outside-target feedback'}]);
/** Explicit source local-domain queries. Interactive event traces use the player state. */
export function p013ModuleFrame(frame:number,c:RuntimeContext) {
 const frameDomain=c.frameDomain??'sprite-123',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(!Object.hasOwn(IR.domains,domain)||domain==='18'||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P013_SCENARIOS.some(s=>s.id===c.scenario))throw Error('P013_FRAME_IDENTITY');
 const initial=p013Initial(c.seed,replay),poses=p013LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P013_ROOT_FRAME');
 const mainFrame=domain==='123'?frame:domain==='root'?(frame>=6?frame-5:null):153;
 const count=domain==='58'?frame-1:(mainFrame??0)>153?3:c.scenario==='after-one'?1:c.scenario==='after-two'?2:c.scenario==='after-three'?3:0;
 let session:P013State={...initial,mainFrame:mainFrame??1,used:[1,2,3].slice(0,count),phase:mainFrame===243?'completed':(mainFrame??0)>153?'outro':mainFrame===153?'exercise':'intro'};
 if(count===3&&mainFrame===153)session={...session,phase:'correct',correctFrame:2};
 if(c.scenario==='wrong-outside'&&mainFrame===153)session={...session,wrongOpen:true};
 if(domain==='103')session={...session,wrongOpen:true};
 if(domain==='107'){const branch=P013_WRONG.findIndex(b=>frame>=b.start&&frame<b.end);session={...session,wrongOpen:true,wrongFrame:branch<0?null:frame,wrongBranch:branch<0?null:branch};}
 if(domain==='111')session={...session,phase:frame>=2&&frame<25?'correct':'exercise',correctFrame:frame>=2&&frame<25?frame:null,used:frame>=2&&frame<25?[1,2,3]:[]};
 if(domain==='99')session={...session,wrongOpen:true,closeHeld:true,closeFrame:frame};
 return Object.freeze({animationId:P013_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses:Object.freeze(poses),nodes:Object.freeze(p013SourceNodes(domain,frame,session)),session:Object.freeze(session),component:!['root','123'].includes(domain)});
}
export type P013FrameState=ReturnType<typeof p013ModuleFrame>;
