import {P046_INTRO_RANGES} from './generated/nms-l02-p046-intro-state-v1';
export function p046IntroFrame(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>653)throw Error('P046_INTRO_FRAME');
 const range=P046_INTRO_RANGES.find(r=>frame>=r.firstFrame&&frame<=r.lastFrame);
 if(!range)throw Error('P046_INTRO_RANGE');
 return Object.freeze({frame,...range.state});
}
