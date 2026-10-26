import {validateL8LoopCandidate} from '../scripts/lib/g678-alg-l08-rw-loop-candidate-v1.mjs';
export const P006_CALIBRATION='g678-alg-l08-p006-current-js-20261006-v1';
export const validateP006Admission=(root,packet,registration)=>validateL8LoopCandidate(root,packet,registration,P006_CALIBRATION,6);
