import {validateL8P027LoopCandidate} from '../scripts/lib/g678-alg-l08-p027-loop-candidate-v1.mjs';
export const P027_CALIBRATION='g678-alg-l08-p027-current-js-20261007-v1';
export const validateP027Admission=(root,packet,registration)=>validateL8P027LoopCandidate(root,packet,registration,P027_CALIBRATION,27);
