import type {RuntimeContext} from './contract';
import type{P033FeedbackData}from'./nms-l02-p033-feedback-contract-v1';
import {P033_FEEDBACK_IR as RAW} from './generated/nms-l02-p033-feedback-ir-v1';
import {P033_ID,P033_BRANCHES,P033_DORMANT_WRONG,p033Initial,type P033SessionState} from './nms-l02-p033-state-v1';
import{p033SourceNodes}from'./nms-l02-p033-feedback-v1';
import{p033LocalPoses}from'./nms-l02-p033-source-query-v1';
const IR:P033FeedbackData=RAW;
export const P033_SCENARIOS=Object.freeze([
 {id:'source-hundredths-quiz',label:'Source twenty-five-hundredths question and explanation'},
 {id:'wrong-first',label:'First wrong answer and retry'},
 {id:'wrong-second',label:'Second wrong answer and assisted explanation'},
 {id:'source-help',label:'Source23-hundredths help example'},
]);
/** Query structural domains independently; it does not execute a natural trace. */
export function p033ModuleFrame(frame:number,c:RuntimeContext) {
 const frameDomain=c.frameDomain??'sprite-221',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(c.frame!==frame||!Object.hasOwn(IR.domains,domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P033_SCENARIOS.some(s=>s.id===c.scenario)) throw Error('P033_FRAME_IDENTITY');
 const initial=p033Initial(c.seed,replay),poses=p033LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame) throw Error('P033_ROOT_FRAME');
 const mainFrame=domain==='221'?frame:domain==='root'?(frame>=6?1:null):130;
 const assisted=c.scenario==='wrong-second'||c.scenario==='source-help';
 let session:P033SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,
  phase:mainFrame===130?'question':mainFrame===298?'completed':(mainFrame??1)>130?'outro':'intro',
  outcome:(mainFrame??1)>130?(assisted?'assisted':'correct'):'unanswered',
  help:c.scenario==='source-help'&&(mainFrame??1)>=130};
 for(const feedback of ['wrong','right'] as const) {
  const index=P033_BRANCHES[feedback].findIndex(b=>b.domain===domain);
  if(index>=0) {
   const b=P033_BRANCHES[feedback][index];
   session={...session,domain,mainFrame:130,localFrame:frame,feedback,branch:index+1,
    answer:feedback==='right'?2:0,attempts:c.scenario==='wrong-second'?2:1,
    quizTryCount:feedback==='wrong'?(c.scenario==='wrong-second'?2:1):0,
    outcome:feedback==='right'?'correct':'unanswered',help:false,
    phase:feedback==='right'?'right':'hold'in b?(frame<b.hold?'wrong-in':frame===b.hold?'wrong-wait':'wrong-out'):'right'};
  }
 }
 if(domain==='112') session={...session,domain,mainFrame:130,localFrame:frame,feedback:'wrong',branch:null,
  answer:1,attempts:1,quizTryCount:1,help:false,phase:frame<P033_DORMANT_WRONG.hold?'wrong-in':frame===P033_DORMANT_WRONG.hold?'wrong-wait':'wrong-out'};
 if(['55','70','93','108'].includes(domain))session={...session,attempts:c.scenario==='wrong-second'?2:1,quizTryCount:c.scenario==='wrong-second'?2:1,answer:1};
 return Object.freeze({animationId:P033_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,
  language:c.lang,seed:c.seed,replay,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',poses:Object.freeze(poses),nodes:Object.freeze(p033SourceNodes(domain,frame)),
  session:Object.freeze(session),component:!['root','221','112',...P033_BRANCHES.wrong.map(b=>b.domain),...P033_BRANCHES.right.map(b=>b.domain)].includes(domain)});
}
export type P033FrameState=ReturnType<typeof p033ModuleFrame>;

/** Live snapshots retain the actual event state; never reconstruct a first visit. */
export function p033LiveFrame(session:P033SessionState,language:'en'|'es'):P033FrameState {
 if(!['en','es'].includes(language))throw Error('P033_LIVE_LANGUAGE');
 return Object.freeze({animationId:P033_ID,sourceSha256:IR.sourceSha256,frame:session.localFrame,frameDomain:'sprite-'+session.domain,domain:session.domain,rootFrame:6,mainFrame:session.mainFrame,language,seed:session.seed,replay:session.replay,scenario:'live-interaction',queryKind:'live-state',poses:p033LocalPoses(session.domain,session.localFrame),nodes:Object.freeze([]),session,component:false});
}
