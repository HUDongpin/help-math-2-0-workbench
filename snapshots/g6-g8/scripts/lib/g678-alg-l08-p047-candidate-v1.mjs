/** Physically verified P047 producer; immutable member/run/freeze writes only. */
import {buildNextFiveCandidate} from '../../lib/alg-l08-next-five-admission-v1.mjs';
import {P047_CONTRACT,P047_CALIBRATION} from '../../lib/alg-l08-p047-admission-semantics-v1.mjs';
export const buildP047Candidate=(root,options)=>buildNextFiveCandidate(root,{calibration:P047_CALIBRATION,...options,contract:P047_CONTRACT});
