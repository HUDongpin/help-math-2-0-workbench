import {ALG_L07_P023_SOURCE as SOURCE} from './alg-l07-p023-source-v1';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export {ALG_L07_P023_SOURCE} from './alg-l07-p023-source-v1';
export type P023Term='Linear function'|'Term'|'Constant'|'Equation';
export type P023Answer=1|2|3|4;
export type P023FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P023State={epoch:number;cycle:number;replay:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';
 mainFrame:number;playing:boolean;quizSection:boolean;quizTryCount:0|1|2;quizButtonsEnabled:boolean;selected:P023Answer|null;
 feedback:null|{spriteId:P023FeedbackId;kind:'wrong'|'right';frame:number;closing:boolean;serial:number};
 selectionSerial:number;wrongText:string|null;glossary:P023Term|null;lessonCompleted:false};
export type P023Event={type:'play'|'pause'|'replay'|'leave'|'close-feedback'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|
 {type:'choose';epoch:number;answer:P023Answer;seed:number}|
 {type:'open-glossary';epoch:number;term:P023Term};
export function p023InitialState(epoch=0,replay=0):P023State{return{epoch,cycle:0,replay,phase:'prequiz',mainFrame:1,playing:false,
 quizSection:false,quizTryCount:0,quizButtonsEnabled:false,selected:null,feedback:null,selectionSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export const p023Branch=(id:P023FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p023Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>302)throw Error('P023_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p023CanClose(s:P023State){if(!s.feedback||s.feedback.kind!=='wrong'||s.feedback.closing||s.glossary)return false;const b=p023Branch(s.feedback.spriteId);return'closeFirst'in b&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
export function p023CanPlay(s:P023State){if(s.glossary||s.phase==='left'||s.phase==='quiz-held')return false;if(s.feedback){const b=p023Branch(s.feedback.spriteId);if(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame===b.hold)return false;}return true;}
/** Source quiz count increments on wrong button release,
 * and main302 wraps after a full last frame. The shared host selector is reused. */
export function p023Reduce(s:P023State,e:P023Event):P023State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p023InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p023CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-glossary')return !s.glossary&&p023Visual(s.mainFrame).terms.some(term=>term===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>303)return s;
  if(s.phase==='prequiz'&&e.frame>=144)return{...s,mainFrame:144,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,quizButtonsEnabled:true,selected:null,wrongText:null};
  // 303 is only the elapsed boundary after frame302, never an observable source frame.
  if(e.frame===303)return{...s,mainFrame:1,phase:'prequiz',cycle:s.cycle+1,quizButtonsEnabled:false,selected:null,wrongText:null};
  return{...s,mainFrame:e.frame,quizSection:e.frame>=145?false:s.quizSection,quizButtonsEnabled:s.phase==='postquiz'?false:s.quizButtonsEnabled};
 }
 if(e.type==='choose'){
  if(s.phase!=='quiz-held'||!s.quizButtonsEnabled||s.feedback||![1,2,3,4].includes(e.answer))return s;
  const kind=e.answer===4?'right':'wrong',pick=selectHostFeedback(kind,e.seed),b=SOURCE.branches.find(b=>b.kind===kind&&b.naturallySelected&&b.index===pick.branchIndex)!;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,quizButtonsEnabled:false,selected:e.answer,selectionSerial:s.selectionSerial+1,
   quizTryCount:kind==='wrong'?(s.quizTryCount===0?1:2):s.quizTryCount,
   wrongText:kind==='wrong'?(s.quizTryCount===1?SOURCE.answers.find(a=>a.answer===e.answer)!.wrongLater:SOURCE.answers.find(a=>a.answer===e.answer)!.wrongFirst):null,
   feedback:{spriteId:b.spriteId,kind,frame:2,closing:false,serial:s.selectionSerial+1}};
 }
 if(e.type==='close-feedback'){
  if(!p023CanClose(s))return s;const b=p023Branch(s.feedback!.spriteId);if(b.kind!=='wrong')return s;
  return{...s,epoch:s.epoch+1,playing:true,selected:null,feedback:{...s.feedback!,frame:b.closeJump,closing:true}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(s.phase!=='feedback'||!s.playing||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
  const b=p023Branch(f.spriteId),limit=b.kind==='wrong'&&!f.closing?b.hold:b.terminal;if(e.frame>limit)return s;
  if(b.kind==='wrong'&&!f.closing&&e.frame===b.hold)return{...s,playing:false,feedback:{...f,frame:e.frame}};
  if(e.frame===b.terminal){const wrong=b.kind==='wrong',second=wrong&&s.quizTryCount===2,proceed=!wrong||second;
   return{...s,epoch:s.epoch+1,phase:proceed?'postquiz':'quiz-held',playing:proceed,quizSection:!proceed,
    quizTryCount:second?0:s.quizTryCount,quizButtonsEnabled:wrong,feedback:null,selected:null,wrongText:null};}
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}
