import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PRIOR,SOURCE,CANDIDATE,SELF,ID,composeRepairRegistration,binding,prepareRepairRegistration} from './prepare-g678-nms-l01-p044-live-clock-registration.mjs';
const read=async p=>readFile(new URL('../'+p,import.meta.url)),json=async p=>JSON.parse(await read(p.path));
async function fixture(){return{priorFreeze:await json(PRIOR.freeze),priorFragment:await json(PRIOR.fragment),priorRegistry:await json(PRIOR.registry),source:await json(SOURCE),priorSource:await json(PRIOR.source),candidate:await json(CANDIDATE),plannerBinding:binding(SELF,await read(SELF))};}
test('379 v2 replaces one exact renderer and preserves378 other pages, source order, counts and gates',async()=>{
  const i=await fixture(),r=composeRepairRegistration(i);assert.equal(r.freeze.selectedPages.length,379);assert.equal(r.fragment.registrationCount,379);assert.equal(r.fragment.changedModuleCount,1);
  assert.deepEqual(r.freeze.selectedPages.filter(p=>p.animationId!==ID),i.priorFreeze.selectedPages.filter(p=>p.animationId!==ID));
  assert.deepEqual(r.fragment.calibration.entries.filter(p=>p.key!==ID),i.priorFragment.calibration.entries.filter(p=>p.key!==ID));
  assert.equal(r.freeze.selectedPages.find(p=>p.animationId===ID).runtime.rendererBinding.sourceRun.path,i.source.compilerRun.path);
  assert.ok(Object.values(r.freeze.acceptanceEffects).every(v=>v===false));assert.equal(r.freeze.productCalibrationPassed,false);assert.equal(r.freeze.scaleOutAuthorized,false);
});
test('any modified canonical predecessor/source/candidate input fails before registration projection',async()=>{for(const key of['priorFreeze','priorFragment','priorRegistry','source','priorSource','candidate']){const i=await fixture();i[key].injected=true;assert.throws(()=>composeRepairRegistration(i));}});
test('ambiguous preparation write/check mode is rejected before filesystem reads',async()=>{await assert.rejects(prepareRepairRegistration({write:true,check:true}));});
