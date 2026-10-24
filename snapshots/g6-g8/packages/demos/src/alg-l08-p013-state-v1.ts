import{ALG_L08_P013_SOURCE as S}from'./alg-l08-p013-source-v1';
export{ALG_L08_P013_SOURCE}from'./alg-l08-p013-source-v1';
import type{P013Term,P013VisualState}from'./alg-l08-p013-source-v1';
export type{P013Term,P013VisualState}from'./alg-l08-p013-source-v1';
export interface P013State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;intercept:string;sliderX:number;interceptX:number;attempts:number;quizSection:boolean;sliderEnabled:boolean;interceptEnabled:boolean;drawEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P013Term|null;lessonCompleted:false;
}
export type P013Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag'|'drag-intercept';x:number}|{type:'open-glossary';term:P013Term})&{epoch:number};
export function p013InitialState(epoch=0,replay=0):P013State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'-1',intercept:'0',sliderX:S.slider.placedX,interceptX:S.interceptSlider.placedX,attempts:0,quizSection:false,sliderEnabled:true,interceptEnabled:true,drawEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
export function p013Visual(frame:number):P013VisualState{if(!Number.isSafeInteger(frame)||frame<1||frame>320)throw Error('P013_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p013SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P013_SLIDER_POSITION');return String(Math.round(Math.max(-230,Math.min(-30,x))/10+13));}
export function p013InterceptAtX(x:number){if(!Number.isFinite(x))throw Error('P013_INTERCEPT_POSITION');return String(Math.round(Math.max(-10,Math.min(185,x))/10-9));}
export function p013CanPlay(s:P013State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<15);}
export function p013CanDraw(s:P013State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame>=90&&s.drawEnabled&&!s.glossary&&!s.popupVisible;}
export function p013CanDrag(s:P013State){return s.phase!=='left'&&s.sliderEnabled&&!s.glossary&&!s.popupVisible&&p013Visual(s.mainFrame).slopeSliderPresent;}
// Draw59 never disables Mc_Drag_1. It remains operable during feedback.
export function p013CanDragIntercept(s:P013State){return s.phase!=='left'&&s.interceptEnabled&&!s.glossary&&p013Visual(s.mainFrame).interceptSliderPresent;}
export function p013Reduce(s:P013State,e:P013Event):P013State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p013InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p013CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p013Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>321)return s;
  if(s.phase==='prequiz'&&e.frame>=90)return{...s,phase:'quiz-held',mainFrame:90,playing:false,slope:'-1',intercept:'0',sliderX:S.slider.placedX,interceptX:S.interceptSlider.placedX,attempts:0,quizSection:true,sliderEnabled:true,interceptEnabled:true,drawEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===321)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,slope:'-1',intercept:'0',sliderX:S.slider.placedX,interceptX:S.interceptSlider.placedX,sliderEnabled:true,interceptEnabled:true,drawEnabled:false,popupVisible:false};
  const preStatic=s.mainFrame<5&&e.frame>=5,replacement=s.mainFrame<94&&e.frame>=94;
  return{...s,mainFrame:e.frame,...(preStatic||replacement?{sliderX:S.slider.placedX,interceptX:S.interceptSlider.placedX,sliderEnabled:false,interceptEnabled:false}:{}),...(replacement?{slope:'0',intercept:'0'}:{})};
 }
 if(e.type==='drag'||e.type==='drag-intercept'){
  const intercept=e.type==='drag-intercept';if(!(intercept?p013CanDragIntercept(s):p013CanDrag(s))||!Number.isFinite(e.x))return s;
  const position=intercept?Math.max(-10,Math.min(185,e.x)):Math.max(-230,Math.min(-30,e.x));
  // Frames1..4 have executable sliders but no named dynamic fields.
  return intercept?{...s,interceptX:position,...(s.mainFrame>=90?{intercept:p013InterceptAtX(position)}:{})}:{...s,sliderX:position,...(s.mainFrame>=90?{slope:p013SlopeAtX(position)}:{})};
 }
 if(e.type==='submit'){
  if(!p013CanDraw(s))return s;
  const attempts=s.attempts+1,correct=s.mainFrame<94&&s.slope==='0'&&s.intercept==='0',wrongText=attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater;
  if(correct)return{...s,attempts,sliderEnabled:false,drawEnabled:false,playing:true,phase:'postquiz',quizSection:false};
  // After91 the popup no longer exists. After94 the named intercept is also
  // absent: visible static0 does not supply a value to that missing target.
  if(s.mainFrame>=91)return{...s,attempts,sliderEnabled:false,drawEnabled:false,wrongText};
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
