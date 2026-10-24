/** Exact reviewed P048 source/native semantics; admission remains separate. */
import {readNextFiveContract,validateNextFiveCandidate} from './alg-l08-next-five-admission-v1.mjs';
export const P048_ID='shared-alg001-l08-p048',P048_CALIBRATION='g678-alg-l08-p048-current-js-20261008-v1';
export const P048_CONTRACT=Object.freeze({"path":"output/g678-l08-last-two-five-contract-successor-20261010-0645-v1/contracts/p048-contract-v1.json","bytes":235389,"sha256":"a1f36c3fcf429b4ff6a9db8138fb51c0b7bddddd07085fa5b7bd301eb033b4c9"});
export const validateP048SourceContracts=root=>readNextFiveContract(root,P048_CONTRACT);
export const validateP048Candidate=(root,packet,registration,calibration)=>validateNextFiveCandidate(root,P048_CONTRACT,packet,registration,calibration);
export const validateP048Admission=(root,packet,registration)=>validateP048Candidate(root,packet,registration,P048_CALIBRATION);
