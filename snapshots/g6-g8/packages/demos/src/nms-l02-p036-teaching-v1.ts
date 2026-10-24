import {P036_TEACHING_DATA as DATA} from './generated/nms-l02-p036-teaching-data-v1';
import type {P036TermId} from './nms-l02-p036-state-v1';
export interface P036Pose {readonly depth:number;readonly characterId:number;readonly birthFrame:number;readonly generation:number;readonly matrix:readonly number[];readonly color:readonly number[];readonly ratio:number;readonly clipDepth:number;readonly name:string|null;}
export interface P036Run {readonly sourceTextId:string;readonly text:string;readonly fractions:readonly number[];readonly termId:P036TermId|null;}
export interface P036Atom {readonly characterId:number;readonly value:string;readonly alpha:number;readonly matrix:readonly number[];readonly depth:number;}
export interface P036Card {readonly id:string;readonly fraction:readonly number[];readonly decimal:string;readonly panel:P036Pose|null;readonly atoms:Readonly<Partial<Record<'numerator'|'denominator'|'decimal',P036Atom>>>;}
export interface P036Teaching {readonly runs:readonly P036Run[];readonly introCards:readonly P036Card[];readonly introPoses:readonly P036Pose[];readonly calculatorPresent:boolean;readonly display:string;readonly numeratorEmphasis:boolean;readonly denominatorEmphasis:boolean;readonly resultEmphasis:boolean;readonly resultAlpha:number;readonly pointer:P036Pose|null;readonly divisionInstructionSymbol:{readonly bounds:readonly number[];readonly mask:readonly number[];readonly fullyContained:boolean;readonly boundsOverlap:boolean}|null;}
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(DATA);
export function p036Teaching(frame:number):P036Teaching {
 if(!Number.isSafeInteger(frame)||frame<1||frame>853)throw Error('P036_TEACHING_FRAME');
 return DATA.states[DATA.frames[frame-1]];
}
export const P036_STATIC_KEYS=DATA.keys;
export const P036_SOURCE_ART=DATA.sourceArt;
export const P036_SOURCE_IMAGES=DATA.images;
export const P036_TRAIN_TITLE_SOURCE=DATA.trainTitleSource;
export function p036Readable(runs:readonly P036Run[]){let text='';for(const run of runs)for(let i=0;i<run.text.length;i++){if(run.fractions[i]!==1)return text;text+=run.text[i];}return text;}
/** Reduced-motion presentation retains the source emphasis window without rapid
 * alternation. Normal motion retains each of the three source flashes. */
export function p036Emphasis(frame:number,reducedMotion=false){
 const t=p036Teaching(frame);return Object.freeze({numerator:reducedMotion?frame>=567&&frame<=571:t.numeratorEmphasis,denominator:reducedMotion?frame>=673&&frame<=677:t.denominatorEmphasis,result:t.resultEmphasis});
}
