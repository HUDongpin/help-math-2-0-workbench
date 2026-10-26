#!/usr/bin/env node
// Read-only composition. No --write mode, descriptor activation or registry writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, REGISTRY, CALIBRATION_ID, encode, binding, descriptor,
  prepareFeedbackHostScoreRegistration} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {generate} from './build-g678-alg-l11-two-page-companion-successor.mjs';

export const PREDECESSOR_REGISTRY_WITNESS = 'catalog/product-bridge-calibrations/g678-feedback-host-score-v3-private-current-js-registry-witness-v1.json';
export const LIVE_PREDECESSOR_REGISTRY = Object.freeze({path: REGISTRY, bytes: 431212,
  sha256: '16739e3db4ff80febb5fd69053892b8d8cb77a28047774cb7a19d7d3fafe5eb3'});
export const PRIOR = Object.freeze({
  freeze: {path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json', bytes: 2404366,
    sha256: 'c0e02b23fde786d5399ab6d49d203e7873345439fd05699ee788191c1d66fe93'},
  fragment: {path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.fragment.json', bytes: 384306,
    sha256: 'fb9e37cc96cc00cb99606c6c6ed38394cbf0118c54630241202c3feac469e9b7'},
  registry: {path: PREDECESSOR_REGISTRY_WITNESS, bytes: 431212, sha256: '16739e3db4ff80febb5fd69053892b8d8cb77a28047774cb7a19d7d3fafe5eb3'},
  source: {path: 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-feedback-host-score-successor-v1.fragment.json',
    bytes: 89320, sha256: '99fba166192b39cc423513b510c882737331717ed78dc53c26ae007d05770482'},
});
export const COMPANION = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l11-two-page-companion-successor-v1.fragment.json', bytes: 90872,
  sha256: '85bee4ae75e8e316d774e2c8097bf346633932be8916f28691c6bd011b66843a',
});
export const PROPOSED_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json';
export const PROPOSED_FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.fragment.json';
const IDs = ['shared-alg001-l11-p034', 'shared-alg001-l11-p044'];
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

export function composeMathCompanionRegistration({priorFreeze, priorFragment, priorRegistry, companion, plannerBinding}) {
  for (const [expected, value] of [[PRIOR.freeze, priorFreeze], [PRIOR.fragment, priorFragment],
    [PRIOR.registry, priorRegistry], [COMPANION, companion]])
    assert.deepEqual(binding(expected.path, encode(value)), expected, `Exact input drift: ${expected.path}`);
  assert.equal(companion.artifactType, 'g678-alg-l11-two-page-companion-successor-fragment-v1');
  assert.deepEqual(companion.dualPredecessorFragment, PRIOR.source);
  assert.deepEqual(companion.sourceCompanionManifests.map(manifest => manifest.path), [
    'catalog/g678-alg-l11-p034-companion-candidate-v1.json',
    'catalog/g678-alg-l11-p044-companion-candidate-v1.json',
  ]);
  const current = priorRegistry.calibrations.filter(c => c.calibrationId === CALIBRATION_ID);
  assert.equal(current.length, 1); assert.equal(current[0].entries.length, 377);
  assert.deepEqual(current[0], priorFragment.calibration);
  const freeze = structuredClone(priorFreeze), artifacts = new Map();
  const byId = new Map(companion.entries.map(entry => [entry.key, entry]));
  freeze.selectedPages = priorFreeze.selectedPages.map(page => {
    if (!IDs.includes(page.animationId)) return structuredClone(page);
    const entry = byId.get(page.animationId);
    const sourceManifest = companion.sourceCompanionManifests[IDs.indexOf(page.animationId)];
    const suffix = `alg-l11-${page.animationId.slice(-4)}-math-companion`;
    assert.equal(page.presentation, undefined, 'Predecessor must not already have a companion slot');
    assert.equal(entry.source.sha256, page.sourceSha256);
    assert.equal(entry.adapterFamily, page.adapterFamily);
    assert.deepEqual(entry.runtimeContract, without(page.runtime, ['rendererBinding']));
    assert.deepEqual(entry.proposedPresentation, {pageInteractionCompanionTargetIdSuffix: suffix, descriptorActivated: false});
    const rendererBinding = {kind: 'maintained-dom-module-v1', module: entry.moduleFile, timeline: entry.timeline,
      memberManifest: entry.memberManifest, sourceRun: companion.companionCompilerRun};
    artifacts.set(page.animationId, rendererBinding);
    return {...structuredClone(page), runtime: {...structuredClone(entry.runtimeContract), rendererBinding},
      presentation: {pageInteractionCompanionTargetIdSuffix: suffix},
      implementation: {...structuredClone(page.implementation), sourceLiteralMathCompanionImplemented: true,
        registeredCompanionProductQaPassed: false, productCalibrationPassed: false},
      mathCompanionSuccessor: {authority: COMPANION, sourceCandidateManifest: structuredClone(sourceManifest),
        descriptorReplacementPrepared: true, registryEntryReplacementPrepared: true, registryActivationRequired: true,
        candidateMountedEvidenceOnly: true, registeredCompanionProductQaPassed: false},
      productBlockers: [...new Set([...page.productBlockers,
        'math-companion-actual-my-lesson-slot-layout-handoff-overlay-and-replay-qa-pending',
        'named-human-screen-reader-and-spanish-spoken-alternatives-pending'])],
      productCalibrationPassed: false, engineeringPreviewReady: false};
  });
  assert.equal(artifacts.size, 2); assert.equal(freeze.selectedPages.length, 377);
  const preserved = values => values.filter(p => !IDs.includes(p.animationId));
  assert.equal(preserved(freeze.selectedPages).length, 375);
  assert.deepEqual(preserved(freeze.selectedPages), preserved(priorFreeze.selectedPages));
  let replacements = 0;
  freeze.inputs.selectionAuthorities = priorFreeze.inputs.selectionAuthorities.map(authority => {
    if (authority.path !== PRIOR.source.path) return structuredClone(authority);
    assert.deepEqual(authority, PRIOR.source); replacements++; return structuredClone(COMPANION);
  });
  assert.equal(replacements, 1);
  freeze.inputs = {...freeze.inputs, mathCompanionPredecessorFreeze: PRIOR.freeze,
    mathCompanionPredecessorFragment: PRIOR.fragment, mathCompanionPredecessorRegistry: PRIOR.registry,
    mathCompanionSource: COMPANION, mathCompanionPlanner: plannerBinding};
  freeze.productHostCalibration = {...freeze.productHostCalibration, currentHostBrowserRevalidated: false,
    mathCompanionMountedCandidateCount: 2, mathCompanionRegisteredProductQaCount: 0};
  freeze.limitations = [...freeze.limitations,
    'V4 is a proposed exact2/375 companion replacement only; its intended slot presentation is not active until a separately checked registry/bridge transaction.',
    'Sealed mounted candidates have readable source literal math; registered My Lesson slot/inert/focus/handoff/Replay checks remain pending. Audio and all acceptance gates remain independent.'];
  assert.equal(freeze.productCalibrationPassed, false); assert.equal(freeze.scaleOutAuthorized, false);
  assert.ok(Object.values(freeze.acceptanceEffects).every(value => value === false));
  const freezeBytes = encode(freeze), freezeBinding = binding(PROPOSED_FREEZE, freezeBytes);
  const calibration = {...structuredClone(current[0]), freezeManifest: PROPOSED_FREEZE,
    freezeManifestBytes: freezeBinding.bytes, freezeManifestSha256: freezeBinding.sha256,
    entries: current[0].entries.map(entry => IDs.includes(entry.key)
      ? {...structuredClone(entry), module: byId.get(entry.key).module, artifacts: artifacts.get(entry.key)} : structuredClone(entry))};
  assert.deepEqual(calibration.entries.filter(e => !IDs.includes(e.key)), current[0].entries.filter(e => !IDs.includes(e.key)));
  const nextRegistry = upsertPrivateCurrentJsCalibration(priorRegistry, calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID),
    priorRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID));
  const fragment = {schemaVersion: 1, artifactType: 'private-current-js-calibration-fragment-v1', freeze: freezeBinding,
    calibration, predecessorRegistry: PRIOR.registry, sourceSuccessorFragment: COMPANION,
    registryActivationRequired: true, productCalibrationPassed: false, changedModuleCount: 2, preservedPageCount: 375};
  return {freeze, freezeBytes, fragment, fragmentBytes: encode(fragment), nextRegistry, nextRegistryBytes: encode(nextRegistry)};
}

export async function readMathCompanionRegistration({requireWitness = false} = {}) {
  const before = await readBoundActivationFile(ROOT, REGISTRY);
  let witness, witnessExists = true;
  try {
    witness = await readBoundActivationFile(ROOT, PRIOR.registry.path, PRIOR.registry);
    assert.equal(witness.mode & 0o222, 0, 'V3 registry witness must be read-only');
  } catch (error) {
    if (error.code !== 'ENOENT' || requireWitness) throw error;
    assert.deepEqual(descriptor(before), LIVE_PREDECESSOR_REGISTRY, 'Missing witness requires exact live V3 registry');
    witness = {...before, path: PRIOR.registry.path}; witnessExists = false;
  }
  await prepareFeedbackHostScoreRegistration({check: true});
  await generate({mode: 'check'});
  const [freeze, fragment, companion, planner] = await Promise.all([
    readBoundActivationFile(ROOT, PRIOR.freeze.path, PRIOR.freeze), readBoundActivationFile(ROOT, PRIOR.fragment.path, PRIOR.fragment),
    readBoundActivationFile(ROOT, COMPANION.path, COMPANION), readBoundActivationFile(ROOT, path.relative(ROOT, fileURLToPath(import.meta.url))),
  ]);
  const result = composeMathCompanionRegistration({priorFreeze: JSON.parse(freeze.buffer), priorFragment: JSON.parse(fragment.buffer),
    priorRegistry: JSON.parse(witness.buffer), companion: JSON.parse(companion.buffer), plannerBinding: descriptor(planner)});
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(before.buffer), 'Concurrent registry drift');
  assert.ok(before.buffer.equals(witness.buffer) || before.buffer.equals(result.nextRegistryBytes),
    'Live registry must be exact predecessor or exact proposed V4');
  return {result, before, witness, witnessExists, inputs: [freeze, fragment, companion, planner]};
}

export async function planMathCompanionRegistration() {
  const {result} = await readMathCompanionRegistration();
  return {mode: 'plan', writes: 0, activationExecuted: false, proposedFreeze: binding(PROPOSED_FREEZE, result.freezeBytes),
    proposedFragment: binding(PROPOSED_FRAGMENT, result.fragmentBytes), proposedRegistry: binding(REGISTRY, result.nextRegistryBytes),
    changedModuleCount: 2, preservedPageCount: 375, registrationCount: 377,
    descriptorSlotActivationPending: true, productCalibrationPassed: false, sourceAudioIntegrated: false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--plan', 'Read-only --plan only');
  planMathCompanionRegistration().then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
