import {P047_INTRO_RANGES} from './generated/nms-l02-p047-intro-state-v1';
/** Source-domain frames are integer and explicit; no nearest-frame fallback. */
export function p047IntroState(frame:number){
 if(!Number.isInteger(frame)||frame<1||frame>140)throw Error('P047_INTRO_FRAME');
 const range=P047_INTRO_RANGES.find(r=>r.firstFrame<=frame&&frame<=r.lastFrame);
 if(!range)throw Error('P047_INTRO_GAP');return range.state;
}
