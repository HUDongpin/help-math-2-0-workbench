import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {COMPANION, PRIOR, PROPOSED_FREEZE, PROPOSED_FRAGMENT, composeMathCompanionRegistration}
  from './plan-g678-alg-l11-math-companion-registration.mjs';
import {binding} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {PAGES} from './build-g678-alg-l11-two-page-companion-successor.mjs';
const read = file => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const planner = 'scripts/plan-g678-alg-l11-math-companion-registration.mjs';
function fixture() {return {priorFreeze: read(PRIOR.freeze.path), priorFragment: read(PRIOR.fragment.path),
  priorRegistry: read(existsSync(new URL('../' + PRIOR.registry.path, import.meta.url))
    ? PRIOR.registry.path : 'packages/demos/private-current-js-registry.json'), companion: read(COMPANION.path),
  plannerBinding: binding(planner, readFileSync(new URL('../' + planner, import.meta.url)))};}
const ids = ['shared-alg001-l11-p034', 'shared-alg001-l11-p044'];

test('read-only v4 composition changes two exact modules and slots while preserving375 complete page objects', () => {
  const f = fixture(), before = JSON.stringify(f), result = composeMathCompanionRegistration(f);
  assert.equal(JSON.stringify(f), before);
  assert.equal(result.freeze.selectedPages.length, 377);
  const retained = pages => pages.filter(p => !ids.includes(p.animationId));
  assert.equal(retained(result.freeze.selectedPages).length, 375);
  assert.deepEqual(retained(result.freeze.selectedPages), retained(f.priorFreeze.selectedPages));
  const calibration = result.fragment.calibration;
  assert.equal(calibration.entries.length, 377); assert.equal(calibration.freezeManifest, PROPOSED_FREEZE);
  assert.deepEqual(result.nextRegistry.calibrations.filter(c => c.calibrationId !== calibration.calibrationId),
    f.priorRegistry.calibrations.filter(c => c.calibrationId !== calibration.calibrationId));
  for (const id of ids) {
    const p = result.freeze.selectedPages.find(p => p.animationId === id);
    const candidate = f.companion.entries.find(e => e.key === id);
    assert.equal(p.presentation.pageInteractionCompanionTargetIdSuffix, `alg-l11-${id.slice(-4)}-math-companion`);
    assert.equal(p.mathCompanionSuccessor.registryActivationRequired, true);
    assert.equal(p.mathCompanionSuccessor.registeredCompanionProductQaPassed, false);
    assert.deepEqual(p.runtime.rendererBinding.sourceRun, f.companion.companionCompilerRun);
    assert.deepEqual(p.runtime.rendererBinding.module, candidate.moduleFile);
    const {rendererBinding, ...runtime} = p.runtime;
    assert.deepEqual(runtime, candidate.runtimeContract);
  }
  assert.equal(PROPOSED_FRAGMENT, PROPOSED_FREEZE.replace('.json', '.fragment.json'));
});

test('only the exact reviewed source authority replaces dual99f and no product/acceptance gate is advanced', () => {
  const f = fixture(), r = composeMathCompanionRegistration(f);
  const old = f.priorFreeze.inputs.selectionAuthorities, next = r.freeze.inputs.selectionAuthorities;
  assert.equal(old.length, next.length);
  assert.equal(next.filter(a => a.path === COMPANION.path).length, 1);
  assert.equal(next.some(a => a.path === PRIOR.source.path), false);
  assert.deepEqual(next.filter(a => a.path !== COMPANION.path), old.filter(a => a.path !== PRIOR.source.path));
  for (const flag of ['productCalibrationPassed', 'engineeringPreviewReady', 'scaleOutAuthorized']) assert.equal(r.freeze[flag], false);
  assert.ok(Object.values(r.freeze.acceptanceEffects).every(v => v === false));
  assert.equal(r.freeze.productHostCalibration.productCalibratedWholeLessonEngineeringPreviewCount, 1);
  assert.equal(r.freeze.productHostCalibration.mathCompanionRegisteredProductQaCount, 0);
  assert.equal(r.fragment.registryActivationRequired, true);
});

test('source/witness/slot/runtime corruption is rejected before producing a proposed registration', () => {
  for (const mutate of [f => {f.priorRegistry.calibrations[0].calibrationId = 'other';},
    f => {f.priorFragment.calibration.entries.pop();},
    f => {f.priorFreeze.selectedPages[0].sourceSha256 = '0'.repeat(64);},
    f => {f.companion.entries.find(e => e.key === ids[0]).proposedPresentation.pageInteractionCompanionTargetIdSuffix = 'other-slot';},
    f => {f.companion.entries.find(e => e.key === ids[1]).runtimeContract.lessonHostCapabilities.push('audio');},
    f => {f.companion.entries.find(e => e.key === ids[0]).moduleFile = f.companion.entries[0].moduleFile;},
    f => {f.companion.productCalibrationPassed = true;}]) {
    const f = fixture(); mutate(f); assert.throws(() => composeMathCompanionRegistration(f), /Exact input drift/u);
  }
});

test('ambient mutable generator routing cannot forge a candidate manifest in the pure composition', () => {
  const saved = PAGES[0].manifest;
  try {
    PAGES[0].manifest = {...saved, sha256: '0'.repeat(64)};
    const f = fixture(), result = composeMathCompanionRegistration(f);
    const page = result.freeze.selectedPages.find(p => p.animationId === ids[0]);
    assert.deepEqual(page.mathCompanionSuccessor.sourceCandidateManifest, f.companion.sourceCompanionManifests[0]);
    assert.notEqual(page.mathCompanionSuccessor.sourceCandidateManifest.sha256, PAGES[0].manifest.sha256);
    f.companion.sourceCompanionManifests[0].sha256 = 'f'.repeat(64);
    assert.equal(page.mathCompanionSuccessor.sourceCandidateManifest.sha256, saved.sha256,
      'returned manifest must not alias mutable caller input');
  } finally {PAGES[0].manifest = saved;}
});
