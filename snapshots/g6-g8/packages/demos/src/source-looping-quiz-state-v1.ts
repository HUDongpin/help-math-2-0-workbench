import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import type {SourceStreamRunsClockPlan} from './source-stream-runs-clock-v1';
export type SourceLoopingQuizBranch={readonly spriteId:number;readonly kind:'right';readonly index:number;readonly terminal:number}|{readonly spriteId:number;readonly kind:'wrong';readonly index:number;readonly terminal:number;readonly hold:number;readonly closeFirst:number;readonly closeJump:number};
export interface SourceLoopingQuizSourceV1 {
 readonly animationId:string;readonly sourceSha256:string;readonly mainSpriteId:number;readonly mainFrameCount:number;readonly quizFrame:number;readonly correctAnswer:1|2|3|4;
 readonly behavior:{readonly wrongFirst:string;readonly wrongLater:string};readonly branches:readonly SourceLoopingQuizBranch[];
 readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:{readonly terms:readonly string[]}}[];
 readonly clocks:readonly {readonly spriteId:number;readonly decoder:DecodedSourceStreamBinding;readonly segments:SourceStreamRunsClockPlan['segments']}[];readonly sa:DecodedSourceStreamBinding;
}
export type SourceLoopingQuizAnswer=1|2|3|4;
export type SourceLoopingQuizFeedbackId=number;
export type SourceLoopingQuizState={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1;quizButtonsEnabled:boolean;selected:SourceLoopingQuizAnswer|null;
 feedback:null|{spriteId:SourceLoopingQuizFeedbackId;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:string|null;lessonCompleted:false};
export type SourceLoopingQuizEvent={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:SourceLoopingQuizAnswer;seed:number}|
 {type:'open-glossary';epoch:number;term:string};
export function createSourceLoopingQuizV1(SOURCE:SourceLoopingQuizSourceV1){
 if(!Number.isSafeInteger(SOURCE.mainFrameCount)||SOURCE.quizFrame<2||SOURCE.quizFrame>=SOURCE.mainFrameCount||![1,2,3,4].includes(SOURCE.correctAnswer)||new Set(SOURCE.branches.map(b=>b.spriteId)).size!==7||SOURCE.branches.filter(b=>b.kind==='wrong').length!==3||SOURCE.branches.filter(b=>b.kind==='right').length!==4)throw Error('unsupported-looping-quiz-source');
 for(const b of SOURCE.branches)if(b.terminal<3||!SOURCE.clocks.some(c=>c.spriteId===b.spriteId)||(b.kind==='wrong'&&!(b.closeFirst>=2&&b.closeFirst<b.hold&&b.closeJump>b.hold&&b.closeJump<b.terminal)))throw Error('invalid-looping-quiz-branch');
function initialState(epoch=0,replay=0):SourceLoopingQuizState{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
const branch=(id:SourceLoopingQuizFeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
function visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('SourceLoopingQuiz_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
function canClose(s:SourceLoopingQuizState){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
function canPlay(s:SourceLoopingQuizState){if(s.glossary||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** Both audited L7/P007 and L8/P007 increment after the feedback exit. */
function reduce(s:SourceLoopingQuizState,e:SourceLoopingQuizEvent):SourceLoopingQuizState{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...initialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return canPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-glossary')return !s.glossary&&visual(s.mainFrame).terms.some(term=>term===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>SOURCE.mainFrameCount+1)return s;
  if(s.phase==='prequiz'&&e.frame>=SOURCE.quizFrame)return{...s,mainFrame:SOURCE.quizFrame,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true,selected:null,wrongText:null};
  // The extra boundary follows the complete final source frame; it is not drawn.
  if(e.frame===SOURCE.mainFrameCount+1)return{...s,mainFrame:1,phase:'prequiz',cycle:s.cycle+1,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===SOURCE.correctAnswer?'right':'wrong',pick=selectHostFeedback(kind,e.seed),b=SOURCE.branches.find(b=>b.kind===kind&&b.index===pick.branchIndex)!;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,
   wrongText:kind==='wrong'?(s.quizTryCount===1?SOURCE.behavior.wrongLater:SOURCE.behavior.wrongFirst):null,
   feedback:{spriteId:b.spriteId,kind,frame:2,closing:false,serial:s.selectionSerial+1}};
 }
 if(e.type==='close-feedback'){
  if(!canClose(s))return s;const b=branch(s.feedback!.spriteId);if(b.kind!=='wrong')return s;
  return{...s,epoch:s.epoch+1,playing:true,selected:null,feedback:{...s.feedback!,frame:b.closeJump,closing:true}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(s.phase!=='feedback'||!s.playing||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
  const b=branch(f.spriteId),limit=b.kind==='wrong'&&!f.closing?b.hold:b.terminal;if(e.frame>limit)return s;
  if(b.kind==='wrong'&&!f.closing&&e.frame===b.hold)return{...s,playing:false,feedback:{...f,frame:e.frame}};
  if(e.frame===b.terminal){const wrong=b.kind==='wrong',second=wrong&&s.quizTryCount===1,proceed=!wrong||second;
   return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',playing:proceed,quizSection:!proceed,
    quizTryCount:wrong?(second?0:1):s.quizTryCount,quizButtonsEnabled:wrong,feedback:null,selected:null,wrongText:null};}
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}

return {initialState,reduce,branch,visual,canClose,canPlay};
}
