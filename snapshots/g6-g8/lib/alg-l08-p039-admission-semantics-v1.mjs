/** Exact reviewed P039 source/native semantics; admission remains separate. */
import {readNextFiveContract,validateNextFiveCandidate} from './alg-l08-next-five-admission-v1.mjs';
export const P039_ID='shared-alg001-l08-p039',P039_CALIBRATION='g678-alg-l08-p039-current-js-20261008-v1';
export const P039_CONTRACT=Object.freeze({"path":"output/g678-l08-last-two-five-contract-successor-20261010-0645-v1/contracts/p039-contract-v1.json","bytes":253490,"sha256":"0606ec0f4fe23b5a68bdb68ad15b938d96f7cf0507fbc5be92ae69b2db15f03d"});
export const validateP039SourceContracts=root=>readNextFiveContract(root,P039_CONTRACT);
export const validateP039Candidate=(root,packet,registration,calibration)=>validateNextFiveCandidate(root,P039_CONTRACT,packet,registration,calibration);
export const validateP039Admission=(root,packet,registration)=>validateP039Candidate(root,packet,registration,P039_CALIBRATION);
