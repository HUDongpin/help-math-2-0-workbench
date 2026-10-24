import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export type SourceLoopingReleaseQuizStateV1<T extends string,I extends number>={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1|2;quizButtonsEnabled:boolean;selected:1|2|3|4|null;
 feedback:null|{spriteId:I;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:T|null;lessonCompleted:false};
export type SourceLoopingReleaseQuizEventV1<T extends string>={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:1|2|3|4;seed:number}|
 {type:'open-glossary';epoch:number;term:T};

export type SourceLoopingReleaseQuizBranchV1<I extends number>={readonly spriteId:I;readonly index:number;readonly naturallySelected:boolean;readonly terminal:number}&({readonly kind:'right'}|{readonly kind:'wrong';readonly closeFirst:number;readonly hold:number;readonly closeJump:number});
export interface SourceLoopingReleaseQuizSourceV1<T extends string,I extends number>{readonly mainFrameCount:number;readonly quizFrame:number;readonly postQuizFrame:number;readonly correctAnswer:1|2|3|4;readonly branches:readonly SourceLoopingReleaseQuizBranchV1<I>[];readonly answers:readonly {readonly answer:1|2|3|4;readonly wrongFirst:string|null;readonly wrongLater:string|null}[];readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:{readonly terms:readonly T[]}}[];}
/** Source family: branch selection on release, wrong count on authored answer release, two-attempt resume, ordinary loop. P023 is the frozen differential reference. */
export function createSourceLoopingReleaseQuizV1<T extends string,I extends number>(SOURCE:SourceLoopingReleaseQuizSourceV1<T,I>){
function initialState(epoch=0,replay=0):SourceLoopingReleaseQuizStateV1<T,I>{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
const branch=(id:I)=>SOURCE.branches.find(b=>b.spriteId===id)!;
function visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('SOURCE_LOOPING_QUIZ_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
function canClose(s:SourceLoopingReleaseQuizStateV1<T,I>){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
function canPlay(s:SourceLoopingReleaseQuizStateV1<T,I>){if(s.glossary||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** Source quiz count increments on wrong answer release,
 * and the source main timeline wraps after its full last frame. The host selector is reused. */
function reduce(s:SourceLoopingReleaseQuizStateV1<T,I>,e:SourceLoopingReleaseQuizEventV1<T>):SourceLoopingReleaseQuizStateV1<T,I>{
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
  // The extra boundary denotes full elapsed last frame; it is never a source frame.
  if(e.frame===SOURCE.mainFrameCount+1)return{...s,mainFrame:1,phase:'prequiz',cycle:s.cycle+1,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizSection:e.frame>=SOURCE.postQuizFrame?false:s.quizSection,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===SOURCE.correctAnswer?'right':'wrong',pick=selectHostFeedback(kind,e.seed),b=SOURCE.branches.find(b=>b.kind===kind&&b.naturallySelected&&b.index===pick.branchIndex)!;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,
   quizTryCount:kind==='wrong'?(s.quizTryCount===0?1:2):s.quizTryCount,
   wrongText:kind==='wrong'?(s.quizTryCount===1?SOURCE.answers.find(a=>a.answer===e.answer)!.wrongLater:SOURCE.answers.find(a=>a.answer===e.answer)!.wrongFirst):null,
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
  if(e.frame===b.terminal){const wrong=b.kind==='wrong',second=wrong&&s.quizTryCount===2,proceed=!wrong||second;
   return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',playing:proceed,quizSection:!proceed,
    quizTryCount:second?0:s.quizTryCount,quizButtonsEnabled:wrong,feedback:null,selected:null,wrongText:null};}
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}

return {initialState,reduce,canClose,canPlay};
}
