import {P045_INTRO_RANGES} from './generated/nms-l02-p045-intro-assets-v1';
/** Source-derived introductory inspection only; frame450 belongs to live practice. */
export function p045IntroFrame(frame:number){
  if(!Number.isSafeInteger(frame)||frame<1||frame>449)throw Error('P045_INTRO_FRAME');
  const row=P045_INTRO_RANGES.find(row=>frame>=row.firstFrame&&frame<=row.lastFrame);
  if(!row)throw Error('P045_INTRO_RANGE');
  return Object.freeze({frame,...row.state});
}
