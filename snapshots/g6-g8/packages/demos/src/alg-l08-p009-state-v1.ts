import{ALG_L08_P009_SOURCE as S}from'./alg-l08-p009-source-v1';
export{ALG_L08_P009_SOURCE}from'./alg-l08-p009-source-v1';
export type P009Term='Value'|'Integers'|'Slope';
export interface P009State{
 epoch:number;replay:number;cycle:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'left';playing:boolean;
 slope:string;sliderX:number;attempts:number;quizSection:boolean;sliderEnabled:boolean;
 popupVisible:boolean;popupFrame:number;popupSerial:number;wrongText:string|null;glossary:P009Term|null;lessonCompleted:false;
}
export type P009Event=({type:'play'|'pause'|'submit'|'close-feedback'|'close-glossary'|'replay'|'leave'}|{type:'advance-main'|'advance-feedback';frame:number}|{type:'drag';x:number}|{type:'open-glossary';term:P009Term})&{epoch:number};
export function p009InitialState(epoch=0,replay=0):P009State{return{epoch,replay,cycle:0,mainFrame:1,phase:'prequiz',playing:false,slope:'1',sliderX:S.slider.placedX,attempts:0,quizSection:false,sliderEnabled:false,popupVisible:false,popupFrame:1,popupSerial:0,wrongText:null,glossary:null,lessonCompleted:false};}
// Bound the product-facing type:94 literal visual spans remain source data,
// not a94-way union propagated through every React component in the host.
export interface P009VisualState{
 readonly paragraphs:readonly string[];readonly terms:readonly P009Term[];readonly graphAlpha:number;readonly equationSlope:string;readonly equationEmphasis:boolean;readonly demoKnobRatio:number;readonly sliderCue:boolean;readonly drawCue:boolean;readonly drawVisible:boolean;
 readonly annotations:readonly Readonly<{sourceTextId:string;sourceCharacterId:number;instanceId:string;text:string;x:number;y:number;alpha:number}>[];
 readonly nodes:readonly Readonly<{sourceShapeId:number;sourceCharacterId:number;instanceId:string;matrix:readonly number[];alpha:number;ratio:number|null}>[];
}
export function p009Visual(frame:number):P009VisualState{if(!Number.isSafeInteger(frame)||frame<1||frame>330)throw Error('P009_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p009SlopeAtX(x:number){if(!Number.isFinite(x))throw Error('P009_SLIDER_POSITION');const bounded=Math.max(-150,Math.min(50,x));return String(Math.round((bounded/10+5)*10)/10);}
export function p009CanPlay(s:P009State){return!s.glossary&&(s.phase==='prequiz'||s.phase==='postquiz'||s.phase==='feedback'&&s.popupFrame<15);}
// Draw61 has no BtnLine instance name. Preserve its placed release action;
// the unresolved source BtnLine.enabled writes are not treated as a real binding.
export function p009CanDraw(s:P009State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.mainFrame>=157&&!s.glossary&&!s.popupVisible;}
export function p009CanDrag(s:P009State){return(s.phase==='quiz-held'||s.phase==='postquiz')&&s.sliderEnabled&&!s.glossary&&!s.popupVisible;}
export function p009Reduce(s:P009State,e:P009Event):P009State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p009InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p009CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return!s.glossary&&p009Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>331)return s;
  if(s.phase==='prequiz'&&e.frame>=157)return{...s,phase:'quiz-held',mainFrame:157,playing:false,slope:'1',sliderX:S.slider.placedX,attempts:0,quizSection:true,sliderEnabled:true,popupVisible:false,popupFrame:1};
  if(e.frame===331)return{...s,phase:'prequiz',mainFrame:1,cycle:s.cycle+1,sliderEnabled:false,popupVisible:false};
  const replacement=s.mainFrame<160&&e.frame>=160;
  return{...s,mainFrame:e.frame,...(replacement?{slope:'2',sliderX:S.slider.replacementX,sliderEnabled:true}:{})};
 }
 if(e.type==='drag'){
  if(!p009CanDrag(s)||!Number.isFinite(e.x))return s;
  const sliderX=Math.max(-150,Math.min(50,e.x)),slope=s.mainFrame<160?p009SlopeAtX(sliderX):s.slope;
  return sliderX===s.sliderX&&slope===s.slope?s:{...s,sliderX,slope};
 }
 if(e.type==='submit'){
  if(!p009CanDraw(s))return s;
  const attempts=s.attempts+1,correct=s.mainFrame<160&&s.slope==='2',wrongText=attempts===1?S.behavior.wrongFirst:S.behavior.wrongLater;
  if(correct)return{...s,attempts,sliderEnabled:false,playing:true,phase:'postquiz',quizSection:false};
  // From158 the popup instance is absent. From160 txtSlope is also absent;
  // the unnamed fixed field75 and graph must not become another exercise.
  if(s.mainFrame>=158)return{...s,attempts,sliderEnabled:false,wrongText};
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
