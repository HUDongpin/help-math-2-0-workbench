import {P051_INTRO_RANGES} from './generated/nms-l02-p051-intro-data-v1';
export function p051Intro(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>484)throw Error('P051_INTRO_FRAME');
 const range=P051_INTRO_RANGES.find(row=>row.first<=frame&&frame<=row.last);
 if(!range)throw Error('P051_INTRO_RANGE');return range.value;
}
