import {validateL8P028LoopCandidate} from '../scripts/lib/g678-alg-l08-p028-loop-candidate-v1.mjs';
export const P028_CALIBRATION='g678-alg-l08-p028-current-js-20261007-v1';
export const validateP028Admission=(root,packet,registration)=>validateL8P028LoopCandidate(root,packet,registration,P028_CALIBRATION,28);
