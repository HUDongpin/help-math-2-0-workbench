import{ALG_L07_P015_SOURCE as S}from'./alg-l07-p015-source-v1';
export{ALG_L07_P015_SOURCE}from'./alg-l07-p015-source-v1';
export type P015Term='Equation'|'Slope'|'Line';
export interface P015State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;attempts:number;quizSection:boolean;drawEnabled:boolean;sliderEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P015Term|null;lessonCompleted:false;
}
export type P015Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag';x:number}|{type:'open-glossary';term:P015Term})&{epoch:number};
export function p015InitialState(epoch=0,replay=0):P015State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'-1',attempts:0,quizSection:false,drawEnabled:false,sliderEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export function p015Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>337)throw Error('P015_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
/** The authored drag bounds apply before the enterFrame expression. */
export function p015SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P015_SLIDER_POSITION');const bounded=Math.max(-150,Math.min(50,x));return String(Math.round((bounded/10+5)*10)/10);}
export function p015CanPlay(s:P015State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<19);}
export function p015CanDraw(s:P015State){return (s.phase==='quiz-held'||s.phase==='postquiz'&&s.mainFrame>=111&&s.mainFrame<=112)&&s.drawEnabled&&!s.glossary&&!s.popupVisible;}
export function p015Reduce(s:P015State,e:P015Event):P015State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p015InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p015CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p015Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>338)return s;
  if(s.phase==='prequiz'&&e.frame>=110)return{...s,phase:'quiz-held',mainFrame:110,playing:false,slope:'-1',attempts:0,quizSection:true,drawEnabled:true,sliderEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===338)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,drawEnabled:false,sliderEnabled:false,popupVisible:false};
  return{...s,mainFrame:e.frame,slope:e.frame>=113?'0':s.slope,drawEnabled:s.phase==='postquiz'&&e.frame<=112&&s.drawEnabled,sliderEnabled:false};
 }
 if(e.type==='drag'){
  if(s.phase!=='quiz-held'||!s.sliderEnabled||s.popupVisible||!Number.isFinite(e.x))return s;
  const slope=p015SlopeAtX(e.x);return slope===s.slope?s:{...s,slope};
 }
 if(e.type==='submit'){
  if(!p015CanDraw(s))return s;
  // Source Draw51 remains only111..112 after popup removal. Extra release
  // increments/disables without creating feedback or restarting narration.
  if(s.phase==='postquiz')return{...s,attempts:s.attempts+1,drawEnabled:false,sliderEnabled:false,wrongText:S.behavior.wrongLater};
  const attempts=s.attempts+1,correct=s.slope==='0';
  return{...s,attempts,drawEnabled:false,sliderEnabled:false,playing:true,phase:correct?'postquiz':'feedback',quizSection:!correct,
   ...(correct?{}:{popupVisible:true,popupFrame:2,popupSerial:s.popupSerial+1,wrongText:attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater})};
 }
 if(e.type==='advance-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||!s.playing||!Number.isSafeInteger(e.frame)||e.frame<=s.popupFrame||e.frame>19)return s;
  return{...s,popupFrame:e.frame,playing:e.frame<19};
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
