import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PRIOR,AUTHORITY,BASE_AUTHORITY,CATALOG,PLANNER,composeP044Registration,binding,ID} from './plan-g678-nms-l01-p044-registration.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
const input={priorFreeze:await json(PRIOR.freeze.path),priorFragment:await json(PRIOR.fragment.path),priorRegistry:await json(PRIOR.registry.path),source:await json(AUTHORITY.path),sourceBase:await json(BASE_AUTHORITY.path),pagesCatalog:await json(CATALOG.path),
  plannerBinding:binding(PLANNER,await readFile(new URL('../'+PLANNER,import.meta.url)))};
test('exact379 projection preserves every predecessor object and source order',()=>{const result=composeP044Registration(input);assert.equal(result.freeze.selectedPages.length,379);
  assert.deepEqual(result.freeze.selectedPages.filter(p=>p.animationId!==ID),input.priorFreeze.selectedPages);assert.equal(result.freeze.selectedPages.filter(p=>p.stableLessonKey==='shared-nms002-l01').length,12);
  assert.equal(result.freeze.productCalibrationPassed,false);assert.equal(result.fragment.registryActivationRequired,true);
});
test('modified predecessor, source authority or catalog cannot enter the projection',()=>{for(const key of['priorFreeze','priorFragment','priorRegistry','source','sourceBase','pagesCatalog']){const copy=structuredClone(input);copy[key].injected=true;assert.throws(()=>composeP044Registration(copy));}});
test('plan retains source759 versus terminal756 and awaited resource boundary',()=>{const page=composeP044Registration(input).freeze.selectedPages.find(p=>p.animationId===ID);assert.equal(page.runtime.frameCount,759);assert.equal(page.runtime.livePlaybackEndFrame,756);assert.equal(page.p044PreparedSuccessor.sourceImagesDecodedBeforeAdmission,11);assert.equal(page.productCalibrationPassed,false);});
