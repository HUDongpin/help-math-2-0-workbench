import fs from 'node:fs';import {test} from 'node:test';import assert from 'node:assert/strict';
import {p052SupplementalCoverage} from './nms-l02-p052-coverage-v1.mjs';
import {normalizeRequirementSelection} from './trace-frame-selection.mjs';
import {assertStrictFullDomainRequirement,validateSupplementalPartialRequirementBoundary} from './strict-full-domain-requirement.mjs';
const plan=JSON.parse(fs.readFileSync(new URL('../../migrations/shared-nms002-l02-p052/audit/native-main-capture-plan-v1.json',import.meta.url)));
test('all160 main candidates remain pending supplemental coverage, never strict requirements',()=>{
 const rows=p052SupplementalCoverage(plan);assert.equal(rows.length,160);
 assert.equal(rows.reduce((n,r)=>n+r.missingFrames.length,0),1704);
 for(const row of rows){assert.equal(row.strictAcceptanceEffect,'none');assert.equal(row.capturedFrameCount,0);
  assert.throws(()=>assertStrictFullDomainRequirement(row,156),/partial-path/);}
});
test('input drift cannot silently relabel source, entry state or capture authority',()=>{
 for(const mutate of [p=>p.sourceSha256='0'.repeat(64),p=>p.mainFrameCount=10,
  p=>p.requirements[0].entryState.state.percent=99,p=>p.requirements[0].imageCaptureCount=1,
  p=>p.requirements[0].originalRuntimeAuthority='adopted',p=>p.requirements.pop()]){
  const changed=structuredClone(plan);mutate(changed);assert.throws(()=>p052SupplementalCoverage(changed));
 }
});
test('partial coverage cannot acquire baseline, fabricated capture count or strict effect',()=>{
 const original=p052SupplementalCoverage(plan)[0],selection=normalizeRequirementSelection(original,156);
 for(const changes of [{strictAcceptanceEffect:'complete'},{capturedFrameCount:1},{status:'complete'},
  {baselineCaptureManifest:'fake.json',baselineCaptureManifestSha256:'0'.repeat(64)},
  {authority:{ownerAcceptance:true}}])assert.throws(()=>validateSupplementalPartialRequirementBoundary({...original,...changes},selection));
});
