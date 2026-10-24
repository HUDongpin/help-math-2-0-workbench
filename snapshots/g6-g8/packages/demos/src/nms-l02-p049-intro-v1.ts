import {P049_INTRO_RANGES} from './generated/nms-l02-p049-intro-data-v1';
export interface P049IntroObject {
 readonly depth:number;readonly characterId:number;readonly matrix:readonly number[];
 readonly stageMatrix:readonly number[];readonly alpha:number;readonly text:string|null;
}
export interface P049IntroState {
 readonly objects:readonly P049IntroObject[];readonly redTenths:number|null;
 readonly countLabel:number|null;readonly digits:readonly (string|null)[];
}
/** Direct source intro state; nested button/audio behavior is handled separately. */
export function p049Intro(frame:number):P049IntroState {
 if(!Number.isInteger(frame)||frame<1||frame>326)throw Error('P049_INTRO_FRAME');
 const range=P049_INTRO_RANGES.find(r=>r.first<=frame&&frame<=r.last);
 if(!range)throw Error('P049_INTRO_GAP');
 return range.value;
}
