import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import type {SourceStreamRunsClockPlan} from './source-stream-runs-clock-v1';
export type L8P039Branch={readonly spriteId:number;readonly kind:'right';readonly index:number;readonly terminal:number}|{readonly spriteId:number;readonly kind:'wrong';readonly index:number;readonly terminal:number;readonly hold:number;readonly closeFirst:number;readonly closeFirstVisible:number;readonly closeJump:number};
export interface L8P039SourceV1 {
 readonly animationId:string;readonly sourceSha256:string;readonly mainSpriteId:number;readonly mainFrameCount:number;readonly quizFrame:number;readonly correctAnswer:1|2|3|4;
 readonly sourceTermKeys:Readonly<Record<string,string>>;readonly coachTerms:readonly string[];
 readonly behavior:{readonly wrongFirst:string;readonly wrongLater:string};readonly branches:readonly L8P039Branch[];
 readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:{readonly terms:readonly string[]}}[];
 readonly clocks:readonly {readonly spriteId:number;readonly decoder:DecodedSourceStreamBinding|null;readonly segments:SourceStreamRunsClockPlan['segments'];readonly emptyNegativeBlocks:SourceStreamRunsClockPlan['emptyNegativeBlocks']}[];readonly sa:DecodedSourceStreamBinding|null;
}
export type L8P039Answer=1|2|3|4;
export type L8P039FeedbackId=number;
export type L8P039State={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'ended'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1;quizButtonsEnabled:boolean;selected:L8P039Answer|null;
 feedback:null|{spriteId:L8P039FeedbackId;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:string|null;coach:boolean;lessonCompleted:false};
export type L8P039Event={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary'|'open-coach'|'close-coach';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:L8P039Answer;seed:number}|
 {type:'open-glossary';epoch:number;term:string};
export function createL8P039QuizV1(SOURCE:L8P039SourceV1){
 if(SOURCE.mainSpriteId!==308||SOURCE.mainFrameCount!==790||SOURCE.quizFrame!==224||SOURCE.correctAnswer!==3||SOURCE.branches.length!==2||!SOURCE.branches.some(b=>b.kind==='right'&&b.spriteId===161&&b.index===4&&b.terminal===25)||!SOURCE.branches.some(b=>b.kind==='wrong'&&b.spriteId===269&&b.index===4&&b.terminal===28&&b.hold===20&&b.closeJump===21&&b.closeFirst===13&&b.closeFirstVisible===14))throw Error('unsupported-p039-source');
 for(const b of SOURCE.branches)if(b.terminal<3||!SOURCE.clocks.some(c=>c.spriteId===b.spriteId)||(b.kind==='wrong'&&!(b.closeFirst>=2&&b.closeFirst<b.hold&&b.closeJump>b.hold&&b.closeJump<b.terminal)))throw Error('invalid-looping-quiz-branch');
function initialState(epoch=0,replay=0):L8P039State{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,coach:false,lessonCompleted:false};}
const branch=(id:L8P039FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
function visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('L8P039_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
function canClose(s:L8P039State){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
function canPlay(s:L8P039State){if(s.coach||s.glossary||s.phase==='ended'||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** P039 source increments only at wrong feedback terminal28 after Close. */
function reduce(s:L8P039State,e:L8P039Event):L8P039State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...initialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return canPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-coach')return !s.coach&&!s.glossary&&s.phase==='quiz-held'&&s.quizButtonsEnabled?{...s,coach:true,playing:false,quizButtonsEnabled:false}:s;
 if(e.type==='close-coach')return s.coach&&!s.glossary?{...s,coach:false,playing:false,quizButtonsEnabled:s.phase==='quiz-held'}:s;
 if(e.type==='open-glossary')return !s.glossary&&(s.coach?SOURCE.coachTerms:visual(s.mainFrame).terms).some(term=>term===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary||s.coach)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>SOURCE.mainFrameCount)return s;
  if(s.phase==='prequiz'&&e.frame>=SOURCE.quizFrame)return{...s,mainFrame:SOURCE.quizFrame,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true,selected:null,wrongText:null};
  if(e.frame===SOURCE.mainFrameCount)return{...s,mainFrame:e.frame,phase:'ended',playing:false,quizSection:false,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===SOURCE.correctAnswer?'right':'wrong',b=SOURCE.branches.find(b=>b.kind===kind)!;
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
