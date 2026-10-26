import{buildLastTwoCandidate}from'../../lib/alg-l08-last-two-admission-v1.mjs';
import{P050_CONTRACT,P050_CALIBRATION}from'../../lib/alg-l08-p050-admission-semantics-v1.mjs';
export const buildP050Candidate=(root,options)=>buildLastTwoCandidate(root,{calibration:P050_CALIBRATION,...options,contract:P050_CONTRACT});
