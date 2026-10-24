import type {RuntimeContext} from './contract';
import {P027_SOURCE_IR as IR} from './generated/nms-l02-p027-source-ir-v1';
import {P027_ID,P027_BRANCHES,P027_DORMANT_WRONG,p027Initial,type P027SessionState} from './nms-l02-p027-state-v1';
import{p027SourceNodes}from'./nms-l02-p027-feedback-v1';
import{p027LocalPoses}from'./nms-l02-p027-source-query-v1';
export const P027_SCENARIOS=Object.freeze([
 {id:'source-equivalent-quiz',label:'Source equivalent-fraction question and explanation'},
 {id:'wrong-first',label:'First wrong answer and retry'},
 {id:'wrong-second',label:'Second wrong answer and assisted explanation'},
 {id:'source-help',label:'Source help example 1/2 = 2/4'},
]);
/** Query structural domains independently; it does not execute a natural trace. */
export function p027ModuleFrame(frame:number,c:RuntimeContext) {
 const frameDomain=c.frameDomain??'sprite-207',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(c.frame!==frame||!Object.hasOwn(IR.domains,domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P027_SCENARIOS.some(s=>s.id===c.scenario)) throw Error('P027_FRAME_IDENTITY');
 const initial=p027Initial(c.seed,replay),poses=p027LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame) throw Error('P027_ROOT_FRAME');
 const mainFrame=domain==='207'?frame:domain==='root'?(frame>=6?1:null):264;
 const assisted=c.scenario==='wrong-second'||c.scenario==='source-help';
 let session:P027SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,
  phase:mainFrame===264?'question':mainFrame===384?'completed':(mainFrame??1)>264?'outro':'intro',
  outcome:(mainFrame??1)>264?(assisted?'assisted':'correct'):'unanswered',
  help:c.scenario==='source-help'&&(mainFrame??1)>=264};
 for(const feedback of ['wrong','right'] as const) {
  const index=P027_BRANCHES[feedback].findIndex(b=>b.domain===domain);
  if(index>=0) {
   const b=P027_BRANCHES[feedback][index];
   session={...session,domain,mainFrame:264,localFrame:frame,feedback,branch:index+1,
    answer:feedback==='right'?0:1,attempts:c.scenario==='wrong-second'?2:1,
    quizTryCount:feedback==='wrong'?(c.scenario==='wrong-second'?2:1):0,
    outcome:feedback==='right'?'correct':'unanswered',help:false,
    phase:feedback==='right'?'right':'hold'in b?(frame<b.hold?'wrong-in':frame===b.hold?'wrong-wait':'wrong-out'):'right'};
  }
 }
 if(domain==='116') session={...session,domain,mainFrame:264,localFrame:frame,feedback:'wrong',branch:null,
  answer:1,attempts:1,quizTryCount:1,help:false,phase:frame<P027_DORMANT_WRONG.hold?'wrong-in':frame===P027_DORMANT_WRONG.hold?'wrong-wait':'wrong-out'};
 if(['59','74','97','112'].includes(domain))session={...session,attempts:c.scenario==='wrong-second'?2:1,quizTryCount:c.scenario==='wrong-second'?2:1,answer:1};
 return Object.freeze({animationId:P027_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,
  language:c.lang,seed:c.seed,replay,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses:Object.freeze(poses),nodes:Object.freeze(p027SourceNodes(domain,frame)),
  session:Object.freeze(session),component:!['root','207','116',...P027_BRANCHES.wrong.map(b=>b.domain),...P027_BRANCHES.right.map(b=>b.domain)].includes(domain)});
}
export type P027FrameState=ReturnType<typeof p027ModuleFrame>;

/** Live snapshots retain the actual event state; never reconstruct a first visit. */
export function p027LiveFrame(session:P027SessionState,language:'en'|'es'):P027FrameState {
 if(!['en','es'].includes(language))throw Error('P027_LIVE_LANGUAGE');
 return Object.freeze({animationId:P027_ID,sourceSha256:IR.sourceSha256,frame:session.localFrame,frameDomain:'sprite-'+session.domain,domain:session.domain,rootFrame:6,mainFrame:session.mainFrame,language,seed:session.seed,replay:session.replay,scenario:'live-interaction',queryKind:'live-state',poses:p027LocalPoses(session.domain,session.localFrame),nodes:Object.freeze([]),session,component:false});
}
