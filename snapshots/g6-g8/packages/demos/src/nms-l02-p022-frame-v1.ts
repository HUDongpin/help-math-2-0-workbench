import type {RuntimeContext} from './contract';
import {P022_IR as IR} from './generated/nms-l02-p022-source-ir-v1';
import {P022_ID,P022_BRANCHES,P022_DORMANT_WRONG,p022Initial,p022SourceNodes,p022LocalPoses,type P022SessionState} from './nms-l02-p022-timeline-v1';
export const P022_SCENARIOS=Object.freeze([
 {id:'source-fraction-quiz',label:'Source fraction question and correct explanation'},
 {id:'wrong-first',label:'First wrong answer and retry'},
 {id:'wrong-second',label:'Second wrong answer and assisted explanation'},
 {id:'source-help',label:'Source help example 4/6'},
]);
/** Query structural domains independently; it does not execute a natural trace. */
export function p022ModuleFrame(frame:number,c:RuntimeContext) {
 const frameDomain=c.frameDomain??'sprite-206',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(!Object.hasOwn(IR.domains,domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P022_SCENARIOS.some(s=>s.id===c.scenario)) throw Error('P022_FRAME_IDENTITY');
 const initial=p022Initial(c.seed,replay),poses=p022LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame) throw Error('P022_ROOT_FRAME');
 const mainFrame=domain==='206'?frame:domain==='root'?(frame>=6?frame-5:null):223;
 const assisted=c.scenario==='wrong-second'||c.scenario==='source-help';
 let session:P022SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,
  phase:mainFrame===223?'question':mainFrame===501?'completed':(mainFrame??1)>223?'outro':'intro',
  outcome:(mainFrame??1)>223?(assisted?'assisted':'correct'):'unanswered',
  help:c.scenario==='source-help'&&(mainFrame??1)>=223};
 for(const feedback of ['wrong','right'] as const) {
  const index=P022_BRANCHES[feedback].findIndex(b=>b.domain===domain);
  if(index>=0) {
   const b=P022_BRANCHES[feedback][index];
   session={...session,domain,mainFrame:223,localFrame:frame,feedback,branch:index+1,
    answer:feedback==='right'?2:0,attempts:c.scenario==='wrong-second'?2:1,
    quizTryCount:feedback==='wrong'?(c.scenario==='wrong-second'?2:1):0,
    outcome:feedback==='right'?'correct':'unanswered',help:false,
    phase:feedback==='right'?'right':'hold'in b?(frame<b.hold?'wrong-in':frame===b.hold?'wrong-wait':'wrong-out'):'right'};
  }
 }
 if(domain==='116') session={...session,domain,mainFrame:223,localFrame:frame,feedback:'wrong',branch:null,
  answer:0,attempts:1,quizTryCount:1,help:false,phase:frame<P022_DORMANT_WRONG.hold?'wrong-in':frame===P022_DORMANT_WRONG.hold?'wrong-wait':'wrong-out'};
 return Object.freeze({animationId:P022_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,
  language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses:Object.freeze(poses),nodes:Object.freeze(p022SourceNodes(domain,frame)),
  session:Object.freeze(session),component:!['root','206','116',...P022_BRANCHES.wrong.map(b=>b.domain),...P022_BRANCHES.right.map(b=>b.domain)].includes(domain)});
}
export type P022FrameState=ReturnType<typeof p022ModuleFrame>;
