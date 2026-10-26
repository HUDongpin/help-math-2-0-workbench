import {validateL8P001Candidate} from '../scripts/lib/g678-alg-l08-p001-candidate-v1.mjs';
export const P001_CALIBRATION='g678-alg-l08-p001-current-js-20261006-v1';
export const validateP001Admission=(root,packet,registration)=>validateL8P001Candidate(root,packet,registration,P001_CALIBRATION);
