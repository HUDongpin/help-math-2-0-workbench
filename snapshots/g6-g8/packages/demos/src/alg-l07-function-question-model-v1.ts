import type {FunctionQuestionConfig} from './g678-advanced-manual/source-function-question-state-v1';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import type {GameGraphV1} from './alg-l07-game-math-v1';
export interface QuestionText {readonly characterId:number;readonly sourceTextId:string;readonly text:string;}
export type QuestionMath={readonly sourceIds:readonly number[]}&(
 {readonly kind:'plain';readonly text:string}|
 {readonly kind:'power';readonly base:string;readonly exponent:string}|
 {readonly kind:'root';readonly prefix:string;readonly radicand:string}|
 {readonly kind:'fractions';readonly prefix:string;readonly fractions:readonly {readonly numerator:string;readonly denominator:string}[]});
export interface QuestionGraphCard {readonly graph:string;readonly equation:QuestionMath;readonly caption:QuestionText;}
export interface QuestionStep {readonly number:number;readonly numberIds:readonly number[];readonly textIds:readonly number[];readonly helperId:number|null;readonly afterIds?:readonly number[];readonly equation?:QuestionMath;readonly graphs?:readonly QuestionGraphCard[];}
export interface QuestionVisual {readonly questionAlpha:number;readonly questionOffset:number;readonly textAlpha:Readonly<Record<string,number>>;readonly answerAlpha:Readonly<Record<string,number>>;readonly answerOffset:Readonly<Record<string,number>>;readonly graphAlpha:number;readonly graphOffset:number;}
export interface QuestionSpan<T>{readonly first:number;readonly last:number;readonly value:T;}
export interface FunctionQuestionModel{
 readonly page:59|60;readonly animationId:string;readonly sourceSha256:string;readonly mainSpriteId:number;readonly mainFrameCount:number;readonly quizFrame:number;
 readonly behavior:FunctionQuestionConfig;readonly texts:readonly QuestionText[];readonly question:QuestionText;
 readonly answers:readonly {readonly letter:'A'|'B'|'C'|'D';readonly instance:string;readonly characterId:number;readonly labelId:number;readonly valueId:number;readonly equation:QuestionMath}[];
 readonly steps:readonly QuestionStep[];
 readonly help:{readonly spriteId:number;readonly textIds:readonly number[];readonly afterIds?:readonly number[];readonly equation?:QuestionMath;readonly examples:readonly {readonly textIds:readonly number[];readonly graph:string}[];};
 readonly mainGraph:string|null;readonly graphs:readonly (GameGraphV1&{readonly key:string})[];
 readonly branches:readonly {readonly spriteId:number;readonly kind:'right'|'wrong';readonly index:number;readonly terminal:number;readonly title:string;readonly titleIds:readonly number[];readonly titleAlpha:readonly QuestionSpan<number>[]}[];
 readonly visualStates:readonly QuestionSpan<QuestionVisual>[];readonly helperStates:Readonly<Record<string,readonly QuestionSpan<Readonly<Record<string,number>>>[]>>;
 readonly clocks:readonly {readonly spriteId:number;readonly sourceFrameCount:number;readonly decoder:DecodedSourceStreamBinding;readonly segments:readonly {readonly firstFrame:number;readonly firstDecodedSample:number;readonly endDecodedSample:number}[];readonly emptyNegativeBlocks:readonly {readonly frame:number;readonly samples:0;readonly seek:number;readonly mp3Bytes:0}[];readonly extension:'mp3'|'wav'}[];
 readonly sa:DecodedSourceStreamBinding;
 readonly terms:readonly {readonly sourceKeyAttribute:string;readonly id:string;readonly labels:Readonly<Record<'en'|'es',string>>;readonly definitions:Readonly<Record<'en'|'es',string>>;readonly source:Readonly<Record<'en'|'es',{readonly assetId:string;readonly path:string;readonly sha256:string}>>;readonly sourceEntrySha256:Readonly<Record<'en'|'es',string>>;readonly extractionLfNormalizedEntrySha256:Readonly<Record<'en'|'es',string>>}[];
}
