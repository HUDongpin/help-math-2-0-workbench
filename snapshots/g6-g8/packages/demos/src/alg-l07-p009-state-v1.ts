import {ALG_L07_P009_SOURCE as S} from './alg-l07-p009-source-v1';
export {ALG_L07_P009_SOURCE} from './alg-l07-p009-source-v1';
export type P009Term='Input'|'Output'|'Slope'|'Y-intercept'|'Value';
export type P009Input='x'|'slope'|'intercept';
export interface P009State{epoch:number;replay:number;mainFrame:number;phase:'demo'|'form'|'left';playing:boolean;inputs:Record<P009Input,string>;output:string;enterEnabled:boolean;newEnabled:boolean;hint:boolean;submission:number;glossary:P009Term|null;lessonCompleted:false;}
export type P009Event={type:'play'|'pause'|'submit'|'reset'|'close-hint'|'close-glossary'|'replay'|'leave';epoch:number}|{type:'advance-main';epoch:number;frame:number}|{type:'edit';epoch:number;input:P009Input;value:string}|{type:'open-glossary';epoch:number;term:P009Term};
export function p009InitialState(epoch=0,replay=0):P009State{return{epoch,replay,mainFrame:1,phase:'demo',playing:false,inputs:{x:'',slope:'',intercept:''},output:'',enterEnabled:false,newEnabled:false,hint:false,submission:0,glossary:null,lessonCompleted:false};}
export function p009Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>604)throw Error('P009_MAIN_FRAME');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function p009Restrict(value:string){return value.replace(/[^0-9 /.\-]/g,'');}
/** Source uses the first two slash parts with parseFloat. Its literal == NaN
 * comparison is always false, so the resulting NaN is assigned to OP_txt. */
export function p009Number(value:string){if(!value.includes('/'))return Number(value);const parts=value.split('/');return Number.parseFloat(parts[0])/Number.parseFloat(parts[1]);}
export function p009Calculate(inputs:Readonly<Record<P009Input,string>>){return String(p009Number(inputs.slope)*p009Number(inputs.x)+p009Number(inputs.intercept));}
export function p009CanPlay(s:P009State){return s.phase==='demo'&&!s.glossary;}
export function p009Reduce(s:P009State,e:P009Event):P009State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='replay'||e.type==='leave')return{...p009InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'demo'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p009CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(e.type==='open-glossary')return !s.glossary&&p009Visual(s.mainFrame).terms.some(t=>t===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='advance-main'){
  if(s.phase!=='demo'||!s.playing||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>604)return s;
  if(e.frame>=600)return{...s,mainFrame:600,phase:'form',playing:false,inputs:{x:'',slope:'',intercept:''},output:'',enterEnabled:true,newEnabled:true,hint:false};
  return{...s,mainFrame:e.frame};
 }
 if(s.phase!=='form')return s;
 if(e.type==='edit'){if(!['x','slope','intercept'].includes(e.input))return s;const value=p009Restrict(e.value);return value===s.inputs[e.input]?s:{...s,inputs:{...s.inputs,[e.input]:value}};}
 if(e.type==='close-hint')return s.hint?{...s,hint:false,enterEnabled:true,newEnabled:true}:s;
 if(e.type==='reset')return s.newEnabled?{...s,inputs:{x:'',slope:'',intercept:''},output:'',enterEnabled:true,newEnabled:false}:s;
 if(e.type==='submit'){
  if(!s.enterEnabled)return s;
  if(Object.values(s.inputs).some(v=>v===''))return{...s,output:'',hint:true,enterEnabled:false,submission:s.submission+1};
  return{...s,output:p009Calculate(s.inputs),enterEnabled:false,newEnabled:true,submission:s.submission+1};
 }
 return s;
}
