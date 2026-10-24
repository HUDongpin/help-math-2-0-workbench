import {P035_TEACHING_DATA as DATA} from './generated/nms-l02-p035-teaching-data-v1';
import type {P035TermId} from './nms-l02-p035-state-v1';
export interface P035Run {readonly sourceTextId:string;readonly text:string;readonly fractions:readonly number[];readonly termId:P035TermId|null;}
export interface P035Model {
 readonly modelAlpha:number;readonly divisionAlpha:number;
 readonly pattern:'left-half'|'top-left-quarter'|'top-half'|'three-quarters';
 readonly transitionProgress:number;
 readonly fraction:readonly number[];readonly fractionAlpha:number;
 readonly transition:{readonly fromFraction:readonly number[];readonly toFraction:readonly number[]}|null;
 readonly second:readonly number[];readonly secondAlpha:number;readonly secondEqualsAlpha:number;
 readonly decimal:string;readonly decimalAlpha:number;readonly decimalEqualsAlpha:number;
}
export interface P035Teaching {readonly runs:readonly P035Run[];readonly left:P035Model;readonly right:P035Model;}
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(DATA);
export function p035Teaching(frame:number):P035Teaching {
 if(!Number.isSafeInteger(frame)||frame<1||frame>1036)throw Error('P035_TEACHING_FRAME');
 return DATA.states[DATA.frames[frame-1]];
}
/** Added cells fade as whole cells. This value controls color, never cell area. */
export function p035CellShade(model:P035Model,index:number):number {
 if(!Number.isSafeInteger(index)||index<0||index>=100)throw Error('P035_CELL');
 const top=index<50,left=index%10<5;
 if(model.pattern==='left-half')return left?1:0;
 if(model.pattern==='top-left-quarter')return top?(left?1:model.transitionProgress):0;
 if(model.pattern==='top-half')return top?1:left?0:model.transitionProgress;
 return top||!left?1:0;
}
export function p035Readable(runs:readonly P035Run[]){let text='';for(const run of runs)for(let i=0;i<run.text.length;i++){if(run.fractions[i]!==1)return text;text+=run.text[i];}return text;}
export function p035Equation(model:P035Model){
 const fraction=(v:readonly number[])=>v[0]+'/'+v[1];
 if(model.fractionAlpha<=0)return '';
 let text=model.transition?fraction(model.transition.fromFraction)+' → '+fraction(model.transition.toFraction):fraction(model.fraction);
 if(model.secondAlpha>0&&model.secondEqualsAlpha>0)text+=' = '+fraction(model.second);
 if(model.decimalAlpha>0&&model.decimalEqualsAlpha>0)text+=' = '+model.decimal;
 return text;
}
