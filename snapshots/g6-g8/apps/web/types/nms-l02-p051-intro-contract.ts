import type {P051_INTRO_RANGES} from '../../../packages/demos/src/generated/nms-l02-p051-intro-data-v1';
/** Compile-only structural boundary for the frozen source data. Every literal
 * remains checked below; the renderer needs geometry, not a union of all frames. */
interface IntroObject {
 readonly depth:number; readonly characterId:number;
 readonly matrix:readonly number[]; readonly stageMatrix:readonly number[];
 readonly alpha:number; readonly text:string|null; readonly ratio:number;
 readonly colorTransform:{readonly multiply:readonly number[];readonly add:readonly number[];readonly divisor:number}|null;
}
interface IntroFrame {readonly objects:readonly IntroObject[];}
type RequireTrue<T extends true> = T;
export type P051IntroSourceConforms = RequireTrue<(typeof P051_INTRO_RANGES)[number]['value'] extends IntroFrame ? true : false>;
declare module '../../../packages/demos/src/nms-l02-p051-intro-v1' {
 export function p051Intro(frame:number):IntroFrame;
}
