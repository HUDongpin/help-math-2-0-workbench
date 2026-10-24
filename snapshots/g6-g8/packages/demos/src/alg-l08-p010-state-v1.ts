import{ALG_L08_P010_SOURCE as S}from'./alg-l08-p010-source-v1';
export{ALG_L08_P010_SOURCE}from'./alg-l08-p010-source-v1';
import type{P010Term,P010VisualState}from'./alg-l08-p010-source-v1';
export type{P010Term,P010VisualState}from'./alg-l08-p010-source-v1';
export interface P010State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;sliderX:number;attempts:number;quizSection:boolean;sliderEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P010Term|null;lessonCompleted:false;
}
export type P010Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag';x:number}|{type:'open-glossary';term:P010Term})&{epoch:number};
export function p010InitialState(epoch=0,replay=0):P010State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'2',sliderX:S.slider.placedX,attempts:0,quizSection:false,sliderEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export function p010Visual(frame:number):P010VisualState{if(!Number.isSafeInteger(frame)||frame<1||frame>611)throw Error('P010_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p010SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P010_SLIDER_POSITION');const bounded=Math.max(-150,Math.min(50,x));return String(Math.round((bounded/10+5)*10)/10);}
export function p010CanPlay(s:P010State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<15);}
// Draw65 has no BtnLine instance name. Preserve its placed release action;
// the unresolved source BtnLine.enabled writes are not treated as a real binding.
export function p010CanDraw(s:P010State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame>=212&&!s.glossary&&!s.popupVisible;}
export function p010CanDrag(s:P010State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame<216&&s.sliderEnabled&&!s.glossary&&!s.popupVisible;}
export function p010Reduce(s:P010State,e:P010Event):P010State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p010InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p010CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p010Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>612)return s;
  if(s.phase==='prequiz'&&e.frame>=212)return{...s,phase:'quiz-held',mainFrame:212,playing:false,slope:'2',sliderX:S.slider.placedX,attempts:0,quizSection:true,sliderEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===612)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,sliderEnabled:false,popupVisible:false};
  const replacement=s.mainFrame<216&&e.frame>=216;
  return{...s,mainFrame:e.frame,...(replacement?{slope:'0.2',sliderX:S.slider.replacementX,sliderEnabled:false}:{})};
 }
 if(e.type==='drag'){
  if(!p010CanDrag(s)||!Number.isFinite(e.x))return s;
  const sliderX=Math.max(-150,Math.min(50,e.x)),slope=s.mainFrame<216?p010SlopeAtX(sliderX):s.slope;
  return sliderX===s.sliderX&&slope===s.slope?s:{...s,sliderX,slope};
 }
 if(e.type==='submit'){
  if(!p010CanDraw(s))return s;
  const attempts=s.attempts+1,correct=s.slope==='0.2',wrongText=attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater;
  if(correct)return{...s,attempts,sliderEnabled:false,playing:true,phase:'postquiz',quizSection:false};
  // From213 the feedback instance is absent. At216 the replacement txtSlope80
  // is still named and receives0.2; a later Draw executes the correct branch.
  if(s.mainFrame>=213)return{...s,attempts,sliderEnabled:false,wrongText};
  return{...s,attempts,sliderEnabled:false,playing:true,phase:'feedback',popupVisible:true,popupFrame:2,popupSerial:s.popupSerial+1,wrongText};
 }
 if(e.type==='advance-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||!s.playing||!Number.isSafeInteger(e.frame)||e.frame<=s.popupFrame||e.frame>15)return s;
  return{...s,popupFrame:e.frame,playing:e.frame<15};
 }
 if(e.type==='close-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||s.popupFrame<2)return s;
  const proceed=s.attempts>=2;
  return{...s,phase:proceed?'postquiz':'quiz-held',popupVisible:false,popupFrame:2,playing:proceed,quizSection:proceed?false:s.quizSection,sliderEnabled:true};
 }
 return s;
}
