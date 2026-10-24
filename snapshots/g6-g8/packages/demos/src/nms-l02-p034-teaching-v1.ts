import {P034_TEACHING_DATA as DATA} from './generated/nms-l02-p034-teaching-data-v1';
import type {P034SessionState} from './nms-l02-p034-state-v1';
export interface P034Run {readonly sourceTextId:string;readonly text:string;readonly fractions:readonly number[];readonly termId:string|null;}
export interface P034Art {readonly characterId:number;readonly shape:number;readonly matrix:readonly number[];readonly alpha:number;}
export interface P034Teaching {readonly gridAlpha:number;readonly unitsAlpha:number;readonly digits:readonly {readonly id:number;readonly x:number;readonly text:string;readonly alpha:number}[];readonly runs:readonly P034Run[];readonly art:readonly P034Art[];}
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(DATA);
export function p034Teaching(s:Pick<P034SessionState,'mainFrame'>):P034Teaching {
 if(!Number.isSafeInteger(s.mainFrame)||s.mainFrame<1||s.mainFrame>396)throw Error('P034_TEACHING_FRAME');
 return DATA.states[DATA.frames[s.mainFrame-1]];
}
export const P034_GUIDANCE_SHAPES:readonly string[]=DATA.shapes;
export function p034Readable(runs:readonly P034Run[]) {let text='';for(const run of runs)for(let i=0;i<run.text.length;i++){if(run.fractions[i]!==1)return text;text+=run.text[i];}return text;}
export function p034Digits(s:P034SessionState):readonly(string|null)[]{
 if(s.mainFrame>=395)return [String(Math.floor(s.value/100)),String(Math.floor(s.value%100/10)),String(s.value%10)];
 const t=p034Teaching(s),digit=(low:number,high:number)=>t.digits.find(d=>d.x>=low&&d.x<high&&d.alpha>0)?.text??null;
 return [t.unitsAlpha>0?'0':null,digit(90,120),digit(140,180)];
}
