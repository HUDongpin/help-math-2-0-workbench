import{ALG_L07_P018_SOURCE as S}from'./alg-l07-p018-source-v1';
export{ALG_L07_P018_SOURCE}from'./alg-l07-p018-source-v1';
export type P018Term='Equation'|'Y-intercept';
export interface P018State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;attempts:number;quizSection:boolean;drawEnabled:boolean;sliderEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P018Term|null;lessonCompleted:false;
}
export type P018Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag';x:number}|{type:'open-glossary';term:P018Term})&{epoch:number};
export function p018InitialState(epoch=0,replay=0):P018State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'3',attempts:0,quizSection:false,drawEnabled:false,sliderEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export function p018Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>361)throw Error('P018_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
/** The authored drag bounds apply before the enterFrame expression. */
export function p018SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P018_SLIDER_POSITION');const bounded=Math.max(-70,Math.min(130,x));return String(Math.round(bounded/10-3));}
export function p018CanPlay(s:P018State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<15);}
export function p018CanDraw(s:P018State){return (s.phase==='quiz-held'||s.phase==='postquiz'&&s.mainFrame>=123&&s.mainFrame<=361)&&s.drawEnabled&&!s.glossary&&!s.popupVisible;}
export function p018Reduce(s:P018State,e:P018Event):P018State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p018InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p018CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p018Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>362)return s;
  if(s.phase==='prequiz'&&e.frame>=122)return{...s,phase:'quiz-held',mainFrame:122,playing:false,slope:'3',attempts:0,quizSection:true,drawEnabled:true,sliderEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===362)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,drawEnabled:false,sliderEnabled:false,popupVisible:false};
  return{...s,mainFrame:e.frame,slope:s.slope,drawEnabled:s.phase==='postquiz'&&e.frame<=361&&s.drawEnabled,sliderEnabled:false};
 }
 if(e.type==='drag'){
  if(s.phase!=='quiz-held'||!s.sliderEnabled||s.popupVisible||!Number.isFinite(e.x))return s;
  const slope=p018SlopeAtX(e.x);return slope===s.slope?s:{...s,slope};
 }
 if(e.type==='submit'){
  if(!p018CanDraw(s))return s;
  // Source Draw67 remains123..361 after popup66 removal; input53 ends124.
  if(s.phase==='postquiz')return{...s,attempts:s.attempts+1,drawEnabled:false,sliderEnabled:false,wrongText:S.behavior.wrongLater};
  const attempts=s.attempts+1,correct=s.slope==='-2';
  return{...s,attempts,drawEnabled:false,sliderEnabled:false,playing:true,phase:correct?'postquiz':'feedback',quizSection:!correct,
   ...(correct?{}:{popupVisible:true,popupFrame:2,popupSerial:s.popupSerial+1,wrongText:attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater})};
 }
 if(e.type==='advance-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||!s.playing||!Number.isSafeInteger(e.frame)||e.frame<=s.popupFrame||e.frame>15)return s;
  return{...s,popupFrame:e.frame,playing:e.frame<15};
 }
 if(e.type==='close-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||s.popupFrame<2)return s;
  const proceed=s.attempts>=2;
  // Source Close re-enables the flags before parent.play(). Native controls
  // accept exercise events only while quiz-held, before that continuation.
  return{...s,phase:proceed?'postquiz':'quiz-held',popupVisible:false,popupFrame:2,playing:proceed,quizSection:!proceed,drawEnabled:true,sliderEnabled:true};
 }
 return s;
}
