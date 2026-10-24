import type {RuntimeContext} from './contract';
import {ALG_L08_P001_SOURCE} from './generated/alg-l08-p001-source-v1';
import {sourceTitleFrameV1,sourceTitleFrameAtMillisecondsV1} from './source-title-state-v1';
export {ALG_L08_P001_SOURCE};
export const algL08P001Frame=(frame:number,context:RuntimeContext)=>sourceTitleFrameV1(ALG_L08_P001_SOURCE,frame,context);
export const algL08P001FrameAtMilliseconds=(ms:number)=>sourceTitleFrameAtMillisecondsV1(ALG_L08_P001_SOURCE,ms);
