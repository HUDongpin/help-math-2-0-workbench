import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {G678_P044_AUTHORITY,G678_P044_CANDIDATE,G678_P044_FREEZE,G678_P044_GLOSSARY,G678_P044_PREDECESSOR,G678_P044_ID,G678_P044_SUFFIX} from '../lib/g678-nms-l01-p044-authority.server';
import {G678_P044_REPAIR_FREEZE,G678_P044_REPAIR_CANDIDATE,G678_P044_REPAIR_AUTHORITY,G678_P044_REPAIR_REGISTRY,readG678P044RepairLineage} from '../lib/g678-nms-l01-p044-live-clock-authority.server';
import {G678_P042_PREDECESSOR,G678_P042_BASE,G678_P042_READABLE} from '../lib/g678-nms-l01-p042-companion-authority.server';
import {G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT,G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT} from '../lib/g678-instructional-behavior-delta-authority.server';
process.env.HELP_MATH_G678_CALIBRATION_PHASE='nms-l01-p044-live-clock-provisional-browser-qa';
const bridge=await import('../lib/g678-calibration-product-bridge.server');
const root=realpathSync(new URL('../../../',import.meta.url));
const read=(p:string)=>{const b=readFileSync(path.join(root,p));return{path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),value:JSON.parse(b.toString())};};
function fixture(){
  const freeze=read(G678_P044_REPAIR_FREEZE.path),fragment=read('catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.fragment.json');
  const entries=new Map<string,any>(fragment.value.calibration.entries.map((e:any)=>[e.key,e]));
  const registry={hasModule:(id:string)=>entries.has(id),registrationFor:(id:string)=>{const e=entries.get(id);if(!e)return undefined;const a=e.artifacts;
    return{scope:'private-engineering',maturity:'private-current-js',deploymentScope:'local-only',calibrationId:bridge.G678_CALIBRATION_ID,freezeManifestSha256:freeze.sha256,
      moduleSha256:a.module.sha256,timelineSha256:a.timeline.sha256,...(a.kind==='maintained-dom-module-v1'?{rendererBindingKind:a.kind,memberManifestSha256:a.memberManifest.sha256,sourceRunSha256:a.sourceRun.sha256}:{runtimeSha256:a.runtime.sha256})};}};
  return{freeze,registry,catalog:read(bridge.G678_SHARED_CATALOG_PATH),profile:read(bridge.G678_SHARED_PROFILE_PATH),
    selectionAuthorities:freeze.value.inputs.selectionAuthorities.map((p:any)=>read(p.path)),predecessorFileBinding:read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path),dualPredecessorFileBinding:read(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
    p042PredecessorFreezeFileBinding:read(G678_P042_PREDECESSOR.path),p042BaseCandidateFileBinding:read(G678_P042_BASE.path),p042ReadableCandidateFileBinding:read(G678_P042_READABLE.path),
    p044PredecessorFreezeFileBinding:read(G678_P044_PREDECESSOR.path),p044CandidateFileBinding:read(G678_P044_REPAIR_CANDIDATE.path),p044GlossaryFileBinding:read(G678_P044_GLOSSARY.path),p044RepairLineage:readG678P044RepairLineage(root)};
}
test('projected379 v2 preserves44 lessons and2282 placements; p044 enters exact NMS L1 slot',()=>{
  const input=fixture(),before=JSON.stringify(input.freeze),result=bridge.buildG678PartialCalibrationSnapshot(input as never);
  assert.equal(JSON.stringify(input.freeze),before);assert.equal(result.status,'ready');assert.equal(result.registeredPlacementCount,379);assert.equal(result.runtimeAssets.length,354);assert.equal(result.maintainedDomRenderers.length,25);
  assert.equal(result.descriptors.length,44);assert.equal(result.descriptors.reduce((n,d)=>n+d.pages.length,0),2282);
  const lesson=result.descriptors.find(d=>d.pages.some(p=>p.animationId===G678_P044_ID))!;assert.equal(lesson.pages.length,47);assert.equal(lesson.productBridge.registeredAnimationCount,12);
  const page=lesson.pages.find(p=>p.animationId===G678_P044_ID)!;assert.equal(page.globalPageOrdinal,44);assert.equal(page.sectionPageOrdinal,7);assert.deepEqual(page.presentation,{pageInteractionCompanionTargetIdSuffix:G678_P044_SUFFIX});
  assert.equal(page.runtimeEvidenceBoundary?.naturalTraceValidation,'not-established');
  assert.equal(lesson.glossary.length,22);for(const id of['total','multiplication','solve'])assert.equal(lesson.glossary.filter(e=>e.id===id).length,1);
  assert.ok(lesson.support.lessonHostCapabilities.includes('practice-feedback'));assert.ok(lesson.support.lessonHostCapabilities.includes('glossary'));
  assert.ok(result.descriptors.every(d=>Object.values(d.productBridge.acceptanceEffects).every(v=>v===false)));assert.equal(result.scaleOutAuthorized,false);
});
test('379 requires separate p044 candidate/predecessor/glossary and the unchanged p042 lineage',()=>{
  for(const key of['p044PredecessorFreezeFileBinding','p044CandidateFileBinding','p044GlossaryFileBinding','p042PredecessorFreezeFileBinding','p042BaseCandidateFileBinding','p042ReadableCandidateFileBinding']){
    assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot({...fixture(),[key]:undefined} as never),/EXACT_AUTHORITY_REQUIRED/);
  }
  const input=fixture();input.selectionAuthorities=input.selectionAuthorities.filter((a:any)=>a.path!==G678_P044_REPAIR_AUTHORITY.path);
  assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot(input as never),/SELECTION_AUTHORITY_COUNT_INVALID/);
});
test('new freeze cannot mutate a prior page or borrow a foreign source renderer',()=>{
  for(const mutate of[(f:any)=>f.selectedPages[0].runtime.seed='25',(f:any)=>f.selectedPages.find((p:any)=>p.animationId===G678_P044_ID).runtime.frameCount=125]){
    const input=fixture();mutate(input.freeze.value);assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot(input as never),/P044_REPAIR_AUTHORITY_INVALID/);
  }
});
test('379 fingerprint includes exact candidates, historical witness and active registry',()=>{
  const paths=bridge.g678CalibrationFingerprintDependencies(fixture().freeze.value);
  for(const p of[G678_P044_REPAIR_FREEZE.path,G678_P044_REPAIR_CANDIDATE.path,G678_P044_REPAIR_AUTHORITY.path,G678_P044_FREEZE.path,G678_P044_PREDECESSOR.path,G678_P044_GLOSSARY.path,G678_P044_CANDIDATE.path,G678_P044_AUTHORITY.path,'packages/demos/private-current-js-registry.json'])assert.equal(paths.filter(x=>x===p).length,1);
});
test('production remains closed before loading any source packet or registry state',()=>{
  const prior=process.env.NODE_ENV;Reflect.set(process.env,'NODE_ENV','production');try{const result=bridge.g678PartialCalibrationSnapshot();assert.equal(result.status,'production-closed');assert.deepEqual(result.descriptors,[]);}finally{if(prior===undefined)Reflect.deleteProperty(process.env,'NODE_ENV');else Reflect.set(process.env,'NODE_ENV',prior);}
});

test('379 v2 refuses an absent repair base and actual filesystem admits only the exact activated successor',()=>{
  assert.throws(()=>bridge.buildG678PartialCalibrationSnapshot({...fixture(),p044RepairLineage:undefined} as never),/P044_REPAIR_EXACT_LINEAGE_REQUIRED/);
  const result=bridge.g678PartialCalibrationSnapshot(),active=read(G678_P044_REPAIR_REGISTRY.path);
  if(active.sha256===G678_P044_REPAIR_REGISTRY.sha256){assert.equal(result.status,'ready');assert.equal(result.registeredPlacementCount,379);assert.equal(result.descriptors.length,44);}
  else{assert.equal(result.status,'invalid');assert.equal(result.registeredPlacementCount,0);assert.deepEqual(result.descriptors,[]);}
});
