/** Physically verified P046 producer; immutable member/run/freeze writes only. */
import {buildNextFiveCandidate} from '../../lib/alg-l08-next-five-admission-v1.mjs';
import {P046_CONTRACT,P046_CALIBRATION} from '../../lib/alg-l08-p046-admission-semantics-v1.mjs';
export const buildP046Candidate=(root,options)=>buildNextFiveCandidate(root,{calibration:P046_CALIBRATION,...options,contract:P046_CONTRACT});
