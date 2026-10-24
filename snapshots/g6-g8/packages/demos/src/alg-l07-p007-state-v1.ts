import {ALG_L07_P007_SOURCE as SOURCE} from './alg-l07-p007-source-v1';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export {ALG_L07_P007_SOURCE} from './alg-l07-p007-source-v1';
export type P007Term='Linear function'|'Function'|'Graph'|'Line';
export type P007Answer=1|2|3|4;
export type P007FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P007State={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1;quizButtonsEnabled:boolean;selected:P007Answer|null;
 feedback:null|{spriteId:P007FeedbackId;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:P007Term|null;lessonCompleted:false};
export type P007Event={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:P007Answer;seed:number}|
 {type:'open-glossary';epoch:number;term:P007Term};
export function p007InitialState(epoch=0,replay=0):P007State{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export const p007Branch=(id:P007FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p007Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>173)throw Error('P007_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p007CanClose(s:P007State){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=p007Branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
export function p007CanPlay(s:P007State){if(s.glossary||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=p007Branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** P007 differs from P033/P041: wrong count is incremented at feedback exit,
 * and main173 wraps after a full last frame. The shared host selector is reused. */
export function p007Reduce(s:P007State,e:P007Event):P007State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p007InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p007CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-glossary')return !s.glossary&&p007Visual(s.mainFrame).terms.some(term=>term===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>174)return s;
  if(s.phase==='prequiz'&&e.frame>=109)return{...s,mainFrame:109,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true,selected:null,wrongText:null};
  // 174 is only the elapsed boundary after frame173, never an observable source frame.
  if(e.frame===174)return{...s,mainFrame:1,phase:'prequiz',cycle:s.cycle+1,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===2?'right':'wrong',pick=selectHostFeedback(kind,e.seed),b=SOURCE.branches.find(b=>b.kind===kind&&b.index===pick.branchIndex)!;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,
   wrongText:kind==='wrong'?(s.quizTryCount===1?SOURCE.behavior.wrongLater:SOURCE.behavior.wrongFirst):null,
   feedback:{spriteId:b.spriteId,kind,frame:2,closing:false,serial:s.selectionSerial+1}};
 }
 if(e.type==='close-feedback'){
  if(!p007CanClose(s))return s;const b=p007Branch(s.feedback!.spriteId);if(b.kind!=='wrong')return s;
  return{...s,epoch:s.epoch+1,playing:true,selected:null,feedback:{...s.feedback!,frame:b.closeJump,closing:true}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(s.phase!=='feedback'||!s.playing||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
  const b=p007Branch(f.spriteId),limit=b.kind==='wrong'&&!f.closing?b.hold:b.terminal;if(e.frame>limit)return s;
  if(b.kind==='wrong'&&!f.closing&&e.frame===b.hold)return{...s,playing:false,feedback:{...f,frame:e.frame}};
  if(e.frame===b.terminal){const wrong=b.kind==='wrong',second=wrong&&s.quizTryCount===1,proceed=!wrong||second;
   return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',playing:proceed,quizSection:!proceed,
    quizTryCount:wrong?(second?0:1):s.quizTryCount,quizButtonsEnabled:wrong,feedback:null,selected:null,wrongText:null};}
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}
