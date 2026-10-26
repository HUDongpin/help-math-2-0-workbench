/** Exact y-intercept successor uses the existing split-proof packet builder. */
import assert from'node:assert/strict';
import{buildFixedExitSlopeCandidate}from'./g678-fixed-exit-candidate-v1.mjs';
export function buildFixedExitYInterceptCandidate(root,options){
 assert([44,45].includes(options.page),'only audited P044/P045');
 const result=buildFixedExitSlopeCandidate(root,{...options,additionalFiles:[...(options.additionalFiles??[]),'scripts/lib/g678-fixed-exit-candidate-v2.mjs','scripts/lib/g678-fixed-exit-provenance-v2.mjs']});
 result.packet.laneSelectionReason='Source-audited fixed feedback4 with terminal28 counting, static help and native y-intercept math; existing shared state/session plus native presentation reused by two exact source consumers.';
 return result;
}
