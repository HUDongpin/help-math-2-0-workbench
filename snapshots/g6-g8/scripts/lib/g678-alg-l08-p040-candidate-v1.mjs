import{buildLastTwoCandidate}from'../../lib/alg-l08-last-two-admission-v1.mjs';
import{P040_CONTRACT,P040_CALIBRATION}from'../../lib/alg-l08-p040-admission-semantics-v1.mjs';
export const buildP040Candidate=(root,options)=>buildLastTwoCandidate(root,{calibration:P040_CALIBRATION,...options,contract:P040_CONTRACT});
