/** Successor for new page producers. The frozen v1 producer remains intact. */
import {prepareAdmissionCandidate as prepareV1} from './g678-admission-candidate.mjs';
import {preflightRegistration} from './g678-registration-preflight-v1.mjs';

export async function prepareAdmissionCandidate(options) {
 const registrationPreflight=await preflightRegistration({root:options.root,
  fragment:options.registration,transaction:options.transaction,exact:true});
 const result=prepareV1(options);
 return {...result,registrationPreflight};
}
