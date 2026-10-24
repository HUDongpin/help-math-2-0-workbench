/** Exact reviewed P038 source/native semantics; admission remains separate. */
import {readNextFiveContract,validateNextFiveCandidate} from './alg-l08-next-five-admission-v1.mjs';
export const P038_ID='shared-alg001-l08-p038',P038_CALIBRATION='g678-alg-l08-p038-current-js-20261008-v1';
export const P038_CONTRACT=Object.freeze({"path":"output/g678-l08-last-two-five-contract-successor-20261010-0645-v1/contracts/p038-contract-v1.json","bytes":287579,"sha256":"9a8ab53405aa2674d61401098f1a148e4051c92f0f7356fb66eb840ccd1f27c3"});
export const validateP038SourceContracts=root=>readNextFiveContract(root,P038_CONTRACT);
export const validateP038Candidate=(root,packet,registration,calibration)=>validateNextFiveCandidate(root,P038_CONTRACT,packet,registration,calibration);
export const validateP038Admission=(root,packet,registration)=>validateP038Candidate(root,packet,registration,P038_CALIBRATION);
