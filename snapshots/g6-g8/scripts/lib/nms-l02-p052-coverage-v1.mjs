import assert from 'node:assert/strict';
import {projectionSha256} from '../evidence-projections.mjs';
import {selectionSha256,normalizeRequirementSelection,validateRequirementCoverageGroups} from './trace-frame-selection.mjs';
import {classifyStrictFullDomainRequirement,validateSupplementalPartialRequirementBoundary} from './strict-full-domain-requirement.mjs';

/** Admit only uncaptured native candidate plan rows as non-promoting supplemental coverage. */
export function p052SupplementalCoverage(plan){
 assert.equal(plan.animationId,'shared-nms002-l02-p052');assert.equal(plan.mainFrameCount,156);
 assert.equal(plan.sourceSha256,'5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638');
 assert.equal(plan.requirements.length,160);
 const rows=plan.requirements.map(candidate=>{
  assert.equal(candidate.frameDomainId,'sprite-350');assert.equal(candidate.imageCaptureCount,0);
  assert.equal(candidate.originalRuntimeAuthority,'unresolved');
  assert.equal(projectionSha256(candidate.entryState),candidate.entryStateSha256);
  const row={requirementId:`req-${candidate.id}`,requirementSchemaVersion:2,
   coverageRole:'partial-path',coverageGroupId:`group-${candidate.id}`,strictAcceptanceEffect:'none',
   scenario:candidate.scenario,frameDomainId:'sprite-350',traceId:candidate.id,
   language:candidate.language,seed:String(candidate.seed),
   requiredRange:{firstFrame:candidate.range.first,lastFrame:candidate.range.last},
   entryState:candidate.entryState,entryStateSha256:candidate.entryStateSha256,
   baselineAuthorityRequirement:'original-runtime-natural-trace',baselineAuthority:'unresolved',
   status:'pending',capturedFrameCount:0,
   missingFrames:Array.from({length:candidate.range.last-candidate.range.first+1},(_,i)=>candidate.range.first+i),
   baselineCaptureManifest:'',baselineCaptureManifestSha256:'',captureManifest:'',captureManifestSha256:'',
   metricsFile:'',metricsSha256:'',authority:{currentJavascriptImplementationCaptureOnly:true}};
  row.selectionSha256=selectionSha256(row,156);
  const selection=normalizeRequirementSelection(row,156);
  validateSupplementalPartialRequirementBoundary(row,selection);
  assert.equal(classifyStrictFullDomainRequirement(row,156).eligible,false);
  return row;
 });
 validateRequirementCoverageGroups(rows,{'sprite-350':156});return rows;
}
