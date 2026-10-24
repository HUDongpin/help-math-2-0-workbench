import type {GameGraphV1,GameTableV1} from './alg-l07-game-math-v1';
export type P062MathPart = {readonly kind:'text';readonly text:string}|{readonly kind:'fraction';readonly numerator:string;readonly denominator:string}|{readonly kind:'power';readonly base:string;readonly exponent:string}|{readonly kind:'radical';readonly radicand:string};
export type P062Display = {readonly kind:'math';readonly parts:readonly P062MathPart[];readonly sourceTextIds:readonly string[]}|{readonly kind:'graph';readonly graph:GameGraphV1};
export interface P062Question {
 readonly id:number;readonly frame:number;readonly correct:1|2|3|4;
 readonly prompt:{readonly sourceTextId:string;readonly parts:readonly P062MathPart[]};
 readonly stimulus:null|{readonly kind:'graph';readonly graph:GameGraphV1}|({readonly kind:'table'}&GameTableV1);
 readonly options:readonly (P062Display&{readonly option:1|2|3|4;readonly instance:string;readonly characterId:number})[];
 readonly questionAudio:true;readonly answerAudio:boolean;
}

export type P062AudioTarget = {readonly language:'en'|'es';readonly questionId:number;readonly option:1|2|3|4|null};
