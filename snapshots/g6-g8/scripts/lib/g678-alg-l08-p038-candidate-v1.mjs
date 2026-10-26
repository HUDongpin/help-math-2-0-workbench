/** Physically verified P038 producer; immutable member/run/freeze writes only. */
import {buildNextFiveCandidate} from '../../lib/alg-l08-next-five-admission-v1.mjs';
import {P038_CONTRACT,P038_CALIBRATION} from '../../lib/alg-l08-p038-admission-semantics-v1.mjs';
export const buildP038Candidate=(root,options)=>buildNextFiveCandidate(root,{calibration:P038_CALIBRATION,...options,contract:P038_CONTRACT});
