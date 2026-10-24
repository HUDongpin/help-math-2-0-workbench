import type {RuntimeContext} from './contract';
import type{P031FeedbackData}from'./nms-l02-p031-feedback-contract-v1';
import {P031_FEEDBACK_IR as RAW} from './generated/nms-l02-p031-feedback-ir-v1';
import {P031_ID,P031_BRANCHES,P031_DORMANT_WRONG,P031_DORMANT_RIGHT,p031Initial,type P031SessionState} from './nms-l02-p031-state-v1';
import{p031SourceNodes}from'./nms-l02-p031-feedback-v1';
import{p031LocalPoses}from'./nms-l02-p031-source-query-v1';
const IR:P031FeedbackData=RAW;
export const P031_SCENARIOS=Object.freeze([
 {id:'source-tenths-quiz',label:'Source seven-tenths question and explanation'},
 {id:'wrong-first',label:'First wrong answer and retry'},
 {id:'wrong-second',label:'Second wrong answer and assisted explanation'},
 {id:'source-help',label:'Source help example with qualified0.23table correction'},
]);
/** Query structural domains independently; it does not execute a natural trace. */
export function p031ModuleFrame(frame:number,c:RuntimeContext) {
 const frameDomain=c.frameDomain??'sprite-242',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(c.frame!==frame||!Object.hasOwn(IR.domains,domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P031_SCENARIOS.some(s=>s.id===c.scenario)) throw Error('P031_FRAME_IDENTITY');
 const initial=p031Initial(c.seed,replay),poses=p031LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame) throw Error('P031_ROOT_FRAME');
 const mainFrame=domain==='242'?frame:domain==='root'?(frame>=6?1:null):147;
 const assisted=c.scenario==='wrong-second'||c.scenario==='source-help';
 let session:P031SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,
  phase:mainFrame===147?'question':mainFrame===339?'completed':(mainFrame??1)>147?'outro':'intro',
  outcome:(mainFrame??1)>147?(assisted?'assisted':'correct'):'unanswered',
  help:c.scenario==='source-help'&&(mainFrame??1)>=147};
 for(const feedback of ['wrong','right'] as const) {
  const index=P031_BRANCHES[feedback].findIndex(b=>b.domain===domain);
  if(index>=0) {
   const b=P031_BRANCHES[feedback][index];
   session={...session,domain,mainFrame:147,localFrame:frame,feedback,branch:index+1,
    answer:feedback==='right'?2:0,attempts:c.scenario==='wrong-second'?2:1,
    quizTryCount:feedback==='wrong'?(c.scenario==='wrong-second'?2:1):0,
    outcome:feedback==='right'?'correct':'unanswered',help:false,
    phase:feedback==='right'?'right':'hold'in b?(frame<b.hold?'wrong-in':frame===b.hold?'wrong-wait':'wrong-out'):'right'};
  }
 }
 if(domain==='202') session={...session,domain,mainFrame:147,localFrame:frame,feedback:'wrong',branch:null,
  answer:1,attempts:1,quizTryCount:1,help:false,phase:frame<P031_DORMANT_WRONG.hold?'wrong-in':frame===P031_DORMANT_WRONG.hold?'wrong-wait':'wrong-out'};
 if(domain==='120')session={...session,domain,mainFrame:147,localFrame:frame,feedback:'right',branch:null,answer:2,attempts:1,quizTryCount:0,help:false,phase:'right',outcome:'correct'};
 if(['154','172','184','199'].includes(domain))session={...session,attempts:c.scenario==='wrong-second'?2:1,quizTryCount:c.scenario==='wrong-second'?2:1,answer:1};
 return Object.freeze({animationId:P031_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,
  language:c.lang,seed:c.seed,replay,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses:Object.freeze(poses),nodes:Object.freeze(p031SourceNodes(domain,frame)),
  session:Object.freeze(session),component:!['root','242','202','120',...P031_BRANCHES.wrong.map(b=>b.domain),...P031_BRANCHES.right.map(b=>b.domain)].includes(domain)});
}
export type P031FrameState=ReturnType<typeof p031ModuleFrame>;

/** Live snapshots retain the actual event state; never reconstruct a first visit. */
export function p031LiveFrame(session:P031SessionState,language:'en'|'es'):P031FrameState {
 if(!['en','es'].includes(language))throw Error('P031_LIVE_LANGUAGE');
 return Object.freeze({animationId:P031_ID,sourceSha256:IR.sourceSha256,frame:session.localFrame,frameDomain:'sprite-'+session.domain,domain:session.domain,rootFrame:6,mainFrame:session.mainFrame,language,seed:session.seed,replay:session.replay,scenario:'live-interaction',queryKind:'live-state',poses:p031LocalPoses(session.domain,session.localFrame),nodes:Object.freeze([]),session,component:false});
}
