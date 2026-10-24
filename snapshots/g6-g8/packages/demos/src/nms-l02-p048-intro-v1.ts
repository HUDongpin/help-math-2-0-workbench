import {P048_INTRO_RANGES} from './generated/nms-l02-p048-intro-data-v1';
/** Partial source-derived intro presentation model. Every authored motion frame
 * remains queryable; reduced motion changes only the decorative pointer display.
 */
export function p048Intro(frame:number,reducedMotion=false){
 if(!Number.isSafeInteger(frame)||frame<1||frame>329)throw Error('P048_INTRO_FRAME');
 const range=P048_INTRO_RANGES.find(r=>r.first<=frame&&frame<=r.last);
 if(!range)throw Error('P048_INTRO_RANGE');
 const objects=range.value.objects.map(o=>({...o,displayAlpha:reducedMotion&&o.characterId===180?0:o.alpha}));
 return {frame,hundredths:range.value.hundredths,sourceHundredths:range.value.sourceHundredths,objects};
}
