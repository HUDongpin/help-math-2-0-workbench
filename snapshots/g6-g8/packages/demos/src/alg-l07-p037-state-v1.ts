import {ALG_L07_P037_SOURCE as S,type P037SourceTerm} from './alg-l07-p037-source-v1';
export {ALG_L07_P037_SOURCE} from './alg-l07-p037-source-v1';
export type P037Term=P037SourceTerm;
export type P037Field=0|1|2|3;
export type P037State={epoch:number;replay:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'ended'|'left';playing:boolean;
 quizSection:boolean;quizTryCount:number;values:readonly string[];inputsEnabled:boolean;popup:null|'wrong'|'empty';message:string;
 submissionSerial:number;feedback:null|{spriteId:57;frame:number};glossary:P037Term|null;lessonCompleted:false};
export type P037Event={type:'play'|'pause'|'replay'|'leave'|'submit'|'close-popup'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|{type:'input';epoch:number;field:P037Field;value:string}|
 {type:'open-glossary';epoch:number;term:P037Term};
export function p037InitialState(epoch=0,replay=0):P037State{return{epoch,replay,mainFrame:1,phase:'prequiz',playing:false,quizSection:false,quizTryCount:0,values:['','','',''],inputsEnabled:false,popup:null,message:'',submissionSerial:0,feedback:null,glossary:null,lessonCompleted:false};}
export function p037Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>S.mainFrameCount)throw Error('P037_MAIN_FRAME');return S.visualStates.find(s=>s.first<=frame&&frame<=s.last)!.value;}
export function p037CanPlay(s:P037State){return !s.glossary&&['prequiz','feedback','postquiz'].includes(s.phase);}
export function p037CanInput(s:P037State){return s.phase==='quiz-held'&&s.inputsEnabled&&!s.glossary&&!s.popup;}
/** SWF6 Done39 compares two strings via EqualTyped; numeric coercion and trim
 * are not part of this predicate. Source empty status precedes wrong clearing. */
export function p037Reduce(s:P037State,e:P037Event):P037State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='leave'||e.type==='replay')return{...p037InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p037CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return !s.glossary&&p037Visual(s.mainFrame).terms.includes(e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>S.mainFrameCount)return s;
  if(s.phase==='prequiz'&&e.frame>=S.quizFrame)return{...s,mainFrame:S.quizFrame,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,values:['','','',''],inputsEnabled:true,popup:null,message:''};
  if(e.frame===S.mainFrameCount)return{...s,mainFrame:e.frame,phase:'ended',playing:false,inputsEnabled:false};
  return{...s,mainFrame:e.frame,inputsEnabled:false};
 }
 if(e.type==='input'){
  if(!p037CanInput(s)||!Number.isSafeInteger(e.field)||e.field<0||e.field>3||typeof e.value!=='string'||s.values[e.field]===e.value)return s;
  const values=[...s.values];values[e.field]=e.value;return{...s,values};
 }
 if(e.type==='submit'){
  if(!p037CanInput(s))return s;
  const empty=s.values.some(v=>v===''),wrong=s.values.some((v,i)=>v!==''&&v!==S.answers[i]);
  const values=s.values.map((v,i)=>v!==''&&v!==S.answers[i]?'':v),quizTryCount=s.quizTryCount+(wrong?1:0);
  const base={...s,epoch:s.epoch+1,inputsEnabled:false,values,quizTryCount,submissionSerial:s.submissionSerial+1};
  if(wrong||empty)return{...base,playing:false,popup:wrong?'wrong':'empty',message:wrong?S.wrongHint+(quizTryCount===1?' Try again.':''):S.emptyHint};
  return{...base,phase:'feedback',playing:true,feedback:{spriteId:57,frame:2},popup:null,message:''};
 }
 if(e.type==='close-popup'){
  if(!s.popup||s.phase!=='quiz-held')return s;
  const advance=s.quizTryCount>=2;
  // Close49 first restores the field/Done flags, then releases the parent.
  // New submissions are admitted only while the source quiz remains held.
  return{...s,epoch:s.epoch+1,popup:null,message:'',inputsEnabled:true,phase:advance?'postquiz':'quiz-held',playing:advance,quizSection:!advance};
 }
 if(e.type==='advance-feedback'){
  if(!s.playing||s.phase!=='feedback'||!s.feedback||!Number.isSafeInteger(e.frame)||e.frame<=s.feedback.frame||e.frame>20)return s;
  if(e.frame===20)return{...s,epoch:s.epoch+1,phase:'postquiz',playing:true,quizSection:false,feedback:null};
  return{...s,feedback:{spriteId:57,frame:e.frame}};
 }
 return s;
}
