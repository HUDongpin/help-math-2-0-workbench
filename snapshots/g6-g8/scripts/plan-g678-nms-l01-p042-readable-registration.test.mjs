import assert from 'node:assert/strict';
import test from 'node:test';
import {PRIOR,SOURCE_AUTHORITY,PLANNER,ID,binding,composeP042ReadableRegistration} from './plan-g678-nms-l01-p042-readable-registration.mjs';
import {fixture,parse} from './g678-nms-l01-p042-readable-registration-test-fixtures.mjs';
function inputs(){const f=fixture();return{priorFreeze:parse(f.inputs.priorFreezeBytes),priorFragment:parse(f.inputs.priorFragmentBytes),
  priorRegistry:parse(f.inputs.witnessBytes),source:parse(f.inputs.sourceBytes),pagesCatalog:parse(f.inputs.catalogBytes),plannerBinding:binding(PLANNER,f.inputs.plannerBytes)};}
test('exact p042 addition preserves377 pages/entries/all old authorities and other calibrations,11/47 remains incomplete',()=>{
  const input=inputs(),r=composeP042ReadableRegistration(input),f=r.freeze;
  assert.equal(f.selectedPages.length,378);assert.equal(f.sharedAdapterPlacementCount,365);assert.equal(f.advancedManualPlacementCount,13);
  assert.deepEqual(f.selectedPages.filter(p=>p.animationId!==ID),input.priorFreeze.selectedPages);
  const current=input.priorRegistry.calibrations.find(c=>c.calibrationId===f.calibrationId);
  assert.deepEqual(r.fragment.calibration.entries.filter(e=>e.key!==ID),current.entries);
  assert.deepEqual(r.nextRegistry.calibrations.filter(c=>c.calibrationId!==f.calibrationId),input.priorRegistry.calibrations.filter(c=>c.calibrationId!==f.calibrationId));
  assert.deepEqual(f.inputs.selectionAuthorities,[...input.priorFreeze.inputs.selectionAuthorities,SOURCE_AUTHORITY]);
  assert.deepEqual(f.pendingAdvancedManualPlacements,[]);assert.equal(f.productHostCalibration.registeredCompleteLessonCount,2);
  assert.equal(f.selectedPages.filter(p=>p.stableLessonKey==='shared-nms002-l01').length,11);
  assert.ok(Object.values(f.acceptanceEffects).every(v=>v===false));assert.equal(f.productCalibrationPassed,false);
  const page=f.selectedPages.find(p=>p.animationId===ID);assert.equal(page.complexityLane,'behavior-heavy');
  assert.equal(page.globalPageOrdinal,42);assert.equal(page.sectionPageOrdinal,5);assert.ok(!('glossaryEntries' in page));
  assert.deepEqual(page.runtime.lessonHostCapabilities,[]);assert.equal(page.runtime.frameCount,125);assert.equal(page.runtime.rootBeginFrame,6);
  assert.deepEqual(f.inputs.p042PredecessorRegistry,PRIOR.registry);
});
test('forged source/catalog/predecessor/counter/acceptance metadata cannot compose378',()=>{
  for(const mutate of [i=>i.source.entries[0].runtimeContract.frameCount=126,i=>i.source.entries[0].source.sha256='0'.repeat(64),
    i=>i.source.acceptanceEffects.audioAccepted=true,i=>i.priorFreeze.registrationCandidatePlacementCount=378,
    i=>i.priorRegistry.calibrations[0].entries[0].module='./forged',i=>i.priorFragment.registryActivationRequired=false,
    i=>i.pagesCatalog.lessons.find(l=>l.stableLessonKey==='shared-nms002-l01').pages.find(p=>p.animationId===ID).globalOrdinal=43]){
    const i=inputs();mutate(i);assert.throws(()=>composeP042ReadableRegistration(i));}
});
test('composition owns its output; mutated caller objects cannot change frozen proposal and undeclared planner fields are rejected',()=>{
  const i=inputs(),r=composeP042ReadableRegistration(i),before=Buffer.from(r.freezeBytes);
  i.priorFreeze.selectedPages[0].animationId='forged';i.source.entries[0].runtimeContract.stage.width=7;
  assert.ok(r.freezeBytes.equals(before));assert.notEqual(r.freeze.selectedPages[0].animationId,'forged');
  const other=inputs();other.plannerBinding.extra='caller-authority';assert.throws(()=>composeP042ReadableRegistration(other));
});
