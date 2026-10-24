/** Exact reviewed P046 source/native semantics; admission remains separate. */
import {readNextFiveContract,validateNextFiveCandidate} from './alg-l08-next-five-admission-v1.mjs';
export const P046_ID='shared-alg001-l08-p046',P046_CALIBRATION='g678-alg-l08-p046-current-js-20261008-v1';
export const P046_CONTRACT=Object.freeze({"path":"output/g678-l08-last-two-five-contract-successor-20261010-0645-v1/contracts/p046-contract-v1.json","bytes":162018,"sha256":"78629bb72d26490d8615da03fd1c04a59b34a690eddc3498e6d09eabf84d2147"});
export const validateP046SourceContracts=root=>readNextFiveContract(root,P046_CONTRACT);
export const validateP046Candidate=(root,packet,registration,calibration)=>validateNextFiveCandidate(root,P046_CONTRACT,packet,registration,calibration);
export const validateP046Admission=(root,packet,registration)=>validateP046Candidate(root,packet,registration,P046_CALIBRATION);
