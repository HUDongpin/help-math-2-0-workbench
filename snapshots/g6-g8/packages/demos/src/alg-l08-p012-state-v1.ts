import{ALG_L08_P012_SOURCE as S}from'./alg-l08-p012-source-v1';
export{ALG_L08_P012_SOURCE}from'./alg-l08-p012-source-v1';
import type{P012Term,P012VisualState}from'./alg-l08-p012-source-v1';
export type{P012Term,P012VisualState}from'./alg-l08-p012-source-v1';
export interface P012State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;sliderX:number;attempts:number;quizSection:boolean;sliderEnabled:boolean;drawEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P012Term|null;lessonCompleted:false;
}
export type P012Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag';x:number}|{type:'open-glossary';term:P012Term})&{epoch:number};
export function p012InitialState(epoch=0,replay=0):P012State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'0.2',sliderX:S.slider.placedX,attempts:0,quizSection:false,sliderEnabled:false,drawEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export function p012Visual(frame:number):P012VisualState{if(!Number.isSafeInteger(frame)||frame<1||frame>293)throw Error('P012_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p012SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P012_SLIDER_POSITION');const bounded=Math.max(-150,Math.min(50,x));return String(Math.round((bounded/10+5)*10)/10);}
export function p012CanPlay(s:P012State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<15);}
// Source57 is named BtnLine. Its enabled flag survives every later placement
// until the next cycle creates a fresh instance at132.
export function p012CanDraw(s:P012State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame>=132&&s.drawEnabled&&!s.glossary&&!s.popupVisible;}
export function p012CanDrag(s:P012State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame<136&&s.sliderEnabled&&!s.glossary&&!s.popupVisible;}
export function p012Reduce(s:P012State,e:P012Event):P012State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p012InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p012CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p012Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>294)return s;
  if(s.phase==='prequiz'&&e.frame>=132)return{...s,phase:'quiz-held',mainFrame:132,playing:false,slope:'0.2',sliderX:S.slider.placedX,attempts:0,quizSection:true,sliderEnabled:true,drawEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===294)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,sliderEnabled:false,drawEnabled:false,popupVisible:false};
  const replacement=s.mainFrame<136&&e.frame>=136,forced=s.mainFrame<137&&e.frame>=137;
  return{...s,mainFrame:e.frame,...(replacement?{slope:'',sliderX:S.slider.replacementX,sliderEnabled:false}:{}),...(forced?{slope:'-1'}:{})};
 }
 if(e.type==='drag'){
  if(!p012CanDrag(s)||!Number.isFinite(e.x))return s;
  const sliderX=Math.max(-150,Math.min(50,e.x)),slope=p012SlopeAtX(sliderX);
  return sliderX===s.sliderX&&slope===s.slope?s:{...s,sliderX,slope};
 }
 if(e.type==='submit'){
  if(!p012CanDraw(s))return s;
  const attempts=s.attempts+1,correct=s.slope==='-1',wrongText=attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater;
  if(correct)return{...s,attempts,sliderEnabled:false,drawEnabled:false,playing:true,phase:'postquiz',quizSection:false};
  // Popup70 is absent from133. A source release may disable the still-named
  // button, but must not create a new feedback instance after its removal.
  if(s.mainFrame>=133)return{...s,attempts,sliderEnabled:false,drawEnabled:false,wrongText};
  return{...s,attempts,sliderEnabled:false,drawEnabled:false,playing:true,phase:'feedback',popupVisible:true,popupFrame:2,popupSerial:s.popupSerial+1,wrongText};
 }
 if(e.type==='advance-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||!s.playing||!Number.isSafeInteger(e.frame)||e.frame<=s.popupFrame||e.frame>15)return s;
  return{...s,popupFrame:e.frame,playing:e.frame<15};
 }
 if(e.type==='close-feedback'){
  if(s.phase!=='feedback'||!s.popupVisible||s.popupFrame<2)return s;
  const proceed=s.attempts>=2;
  return{...s,phase:proceed?'postquiz':'quiz-held',popupVisible:false,popupFrame:2,playing:proceed,quizSection:proceed?false:s.quizSection,sliderEnabled:true,drawEnabled:true};
 }
 return s;
}
