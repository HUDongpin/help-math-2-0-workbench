import {validateL8LoopCandidate} from '../scripts/lib/g678-alg-l08-rw-loop-candidate-v1.mjs';
export const P005_CALIBRATION='g678-alg-l08-p005-current-js-20261006-v1';
export const validateP005Admission=(root,packet,registration)=>validateL8LoopCandidate(root,packet,registration,P005_CALIBRATION,5);
