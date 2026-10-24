import {ALG_L07_P021_SOURCE as SOURCE} from './alg-l07-p021-source-v1';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export {ALG_L07_P021_SOURCE} from './alg-l07-p021-source-v1';
export type P021Term='Linear function'|'Function'|'Graph'|'Line';
export type P021Answer=1|2|3|4;
export type P021FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P021State={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1;quizButtonsEnabled:boolean;selected:P021Answer|null;
 feedback:null|{spriteId:P021FeedbackId;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:P021Term|null;lessonCompleted:false};
export type P021Event={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:P021Answer;seed:number}|
 {type:'open-glossary';epoch:number;term:P021Term};
export function p021InitialState(epoch=0,replay=0):P021State{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export const p021Branch=(id:P021FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p021Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>154)throw Error('P021_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p021CanClose(s:P021State){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=p021Branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
export function p021CanPlay(s:P021State){if(s.glossary||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=p021Branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** Source quiz count increments at feedback exit,
 * and main154 wraps after a full last frame. The shared host selector is reused. */
export function p021Reduce(s:P021State,e:P021Event):P021State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p021InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p021CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-glossary')return !s.glossary&&p021Visual(s.mainFrame).terms.some(term=>term===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>155)return s;
  if(s.phase==='prequiz'&&e.frame>=97)return{...s,mainFrame:97,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true,selected:null,wrongText:null};
  // 155 is only the elapsed boundary after frame154, never an observable source frame.
  if(e.frame===155)return{...s,mainFrame:1,phase:'prequiz',cycle:s.cycle+1,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizSection:e.frame>=98?false:s.quizSection,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===1?'right':'wrong',pick=selectHostFeedback(kind,e.seed),b=SOURCE.branches.find(b=>b.kind===kind&&b.naturallySelected&&b.index===pick.branchIndex)!;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,
   wrongText:kind==='wrong'?(s.quizTryCount===1?SOURCE.answers.find(a=>a.answer===e.answer)!.wrongLater:SOURCE.answers.find(a=>a.answer===e.answer)!.wrongFirst):null,
   feedback:{spriteId:b.spriteId,kind,frame:2,closing:false,serial:s.selectionSerial+1}};
 }
 if(e.type==='close-feedback'){
  if(!p021CanClose(s))return s;const b=p021Branch(s.feedback!.spriteId);if(b.kind!=='wrong')return s;
  return{...s,epoch:s.epoch+1,playing:true,selected:null,feedback:{...s.feedback!,frame:b.closeJump,closing:true}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(s.phase!=='feedback'||!s.playing||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
  const b=p021Branch(f.spriteId),limit=b.kind==='wrong'&&!f.closing?b.hold:b.terminal;if(e.frame>limit)return s;
  if(b.kind==='wrong'&&!f.closing&&e.frame===b.hold)return{...s,playing:false,feedback:{...f,frame:e.frame}};
  if(e.frame===b.terminal){const wrong=b.kind==='wrong',second=wrong&&s.quizTryCount===1,proceed=!wrong||second;
   return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',playing:proceed,quizSection:!proceed,
    quizTryCount:wrong?(second?0:1):s.quizTryCount,quizButtonsEnabled:wrong,feedback:null,selected:null,wrongText:null};}
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}
