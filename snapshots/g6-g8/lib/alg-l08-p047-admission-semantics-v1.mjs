/** Exact reviewed P047 source/native semantics; admission remains separate. */
import {readNextFiveContract,validateNextFiveCandidate} from './alg-l08-next-five-admission-v1.mjs';
export const P047_ID='shared-alg001-l08-p047',P047_CALIBRATION='g678-alg-l08-p047-current-js-20261008-v1';
export const P047_CONTRACT=Object.freeze({"path":"output/g678-l08-last-two-five-contract-successor-20261010-0645-v1/contracts/p047-contract-v1.json","bytes":245889,"sha256":"2dda537cd30b938db27b8b19203253612d9d56e5e063c33ae467f40cd48ec5be"});
export const validateP047SourceContracts=root=>readNextFiveContract(root,P047_CONTRACT);
export const validateP047Candidate=(root,packet,registration,calibration)=>validateNextFiveCandidate(root,P047_CONTRACT,packet,registration,calibration);
export const validateP047Admission=(root,packet,registration)=>validateP047Candidate(root,packet,registration,P047_CALIBRATION);
