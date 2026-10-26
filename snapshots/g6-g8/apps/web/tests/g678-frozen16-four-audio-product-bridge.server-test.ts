import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {G678_P044_GLOSSARY,G678_P044_PREDECESSOR} from '../lib/g678-nms-l01-p044-authority.server';
import {G678_P044_REPAIR_CANDIDATE,readG678P044RepairLineage} from '../lib/g678-nms-l01-p044-live-clock-authority.server';
import {G678_P042_PREDECESSOR,G678_P042_BASE,G678_P042_READABLE} from '../lib/g678-nms-l01-p042-companion-authority.server';
import {G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT,G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT} from '../lib/g678-instructional-behavior-delta-authority.server';
import {FROZEN_GLOSSARY_FREEZE,FROZEN_GLOSSARY_IDS,readFrozenGlossaryPackage} from '../lib/g678-frozen16-four-audio-authority.server';
process.env.HELP_MATH_G678_CALIBRATION_PHASE='frozen16-continuous-audio-provisional-browser-qa';
const bridge=await import('../lib/g678-calibration-product-bridge.server');
const root=realpathSync(new URL('../../../',import.meta.url));
const read=(p:string)=>{const b=readFileSync(path.join(root,p));return{path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),value:JSON.parse(b.toString())};};
function fixture(){
  const packet=readFrozenGlossaryPackage(root),freeze=read(FROZEN_GLOSSARY_FREEZE.path);
  const fragment=read(FROZEN_GLOSSARY_FREEZE.path.replace('.json','.fragment.json'));
  const entries=new Map<string,any>(fragment.value.calibration.entries.map((e:any)=>[e.key,e]));
  const registry={hasModule:(id:string)=>entries.has(id),registrationFor:(id:string)=>{const e=entries.get(id);if(!e)return undefined;const a=e.artifacts;
    return{scope:'private-engineering',maturity:'private-current-js',deploymentScope:'local-only',calibrationId:bridge.G678_CALIBRATION_ID,freezeManifestSha256:freeze.sha256,
      moduleSha256:a.module.sha256,timelineSha256:a.timeline.sha256,...(a.kind==='maintained-dom-module-v1'?{rendererBindingKind:a.kind,memberManifestSha256:a.memberManifest.sha256,sourceRunSha256:a.sourceRun.sha256}:{runtimeSha256:a.runtime.sha256})};}};
  return{freeze,registry,catalog:read(bridge.G678_SHARED_CATALOG_PATH),profile:read(bridge.G678_SHARED_PROFILE_PATH),
    frozenGlossaryPredecessor:packet.predecessor,frozenGlossaryCandidate:packet.candidate,
    selectionAuthorities:freeze.value.inputs.selectionAuthorities.map((p:any)=>read(p.path)),
    predecessorFileBinding:read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path),dualPredecessorFileBinding:read(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
    p042PredecessorFreezeFileBinding:read(G678_P042_PREDECESSOR.path),p042BaseCandidateFileBinding:read(G678_P042_BASE.path),p042ReadableCandidateFileBinding:read(G678_P042_READABLE.path),
    p044PredecessorFreezeFileBinding:read(G678_P044_PREDECESSOR.path),p044CandidateFileBinding:read(G678_P044_REPAIR_CANDIDATE.path),
    p044GlossaryFileBinding:read(G678_P044_GLOSSARY.path),p044RepairLineage:readG678P044RepairLineage(root)};
}
test('same 379 pages retain 44 lessons and give each frozen glossary page exact host definitions and companion',()=>{
  const f=fixture(),s=bridge.buildG678PartialCalibrationSnapshot(f as never);
  assert.equal(s.status,'ready');assert.equal(s.registeredPlacementCount,379);assert.equal(s.descriptors.length,44);
  assert.equal(s.descriptors.reduce((n,d)=>n+d.pages.length,0),2282);
  for(const id of FROZEN_GLOSSARY_IDS){
    const d=s.descriptors.find(d=>d.pages.some(p=>p.animationId===id))!,p=d.pages.find(p=>p.animationId===id)!;
    assert.equal(p.rendererAvailability.kind,'registered');assert.deepEqual(p.presentation,{pageInteractionCompanionTargetIdSuffix:'frozen16-glossary-controls'});
    assert(d.support.lessonHostCapabilities.includes('glossary'));
    const selected=f.freeze.value.selectedPages.find((p:any)=>p.animationId===id);
    for(const entry of selected.glossaryEntries){const found=d.glossary.find(e=>e.id===entry.id);assert(found);assert.deepEqual(found.labels,entry.labels);assert.deepEqual(found.definitions,entry.definitions);}
  }
  assert.equal(s.scaleOutAuthorized,false);
});
test('a stale module cannot borrow the new glossary freeze or canvas identity',()=>{
  const f=fixture(),previous=f.registry.registrationFor;
  f.registry.registrationFor=id=>{const r=previous(id);return r&&id===FROZEN_GLOSSARY_IDS[0]?{...r,moduleSha256:'0'.repeat(64)}:r;};
  assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot(f as never),/GLOSSARY_REGISTRY_ARTIFACT_MISMATCH/);
});
test('successor requires its exact old freeze and candidate, retaining the p044 lineage independently',()=>{
  for(const field of ['frozenGlossaryPredecessor','frozenGlossaryCandidate']){
    const f=fixture();assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot({...f,[field]:undefined} as never),/EXACT_SUCCESSOR_REQUIRED/);
  }
  const f=fixture();assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot({...f,p044RepairLineage:undefined} as never),/P044_REPAIR_EXACT_LINEAGE_REQUIRED/);
});

test('stale pure-linear module cannot borrow the continuous audio extension',()=>{
 const f=fixture(),prior=f.registry.registrationFor;f.registry.registrationFor=id=>{const value=prior(id);return value&&id==='shared-alg001-l06-p040'?{...value,moduleSha256:'0'.repeat(64)}:value;};
 assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot(f as never),/CONTINUOUS_AUDIO_REGISTRY_MISMATCH/);
});

test('all three intro audio successors reject stale registrations',()=>{
 for(const id of ['shared-alg001-l01-p001','shared-dat001-l01-p001','shared-nms002-l01-p001']){
  const f=fixture(),prior=f.registry.registrationFor;f.registry.registrationFor=key=>{const value=prior(key);return value&&key===id?{...value,moduleSha256:'0'.repeat(64)}:value;};
  assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot(f as never),/CONTINUOUS_AUDIO_REGISTRY_MISMATCH/);
 }
});
