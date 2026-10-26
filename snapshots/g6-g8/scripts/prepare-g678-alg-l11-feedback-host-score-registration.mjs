#!/usr/bin/env node
// Prepare v3's exact p034/p044 replacement. Never updates the live registry.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareInstructionalSuccessorRegistration as checkV2Preparation}
  from './prepare-g678-alg-l11-instructional-successor-registration.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-instructional-successor-registration.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {generateFeedbackHostScoreSuccessor, SOURCE_P034_MANIFEST}
  from './build-g678-alg-l11-instructional-feedback-host-score-successor.mjs';
import {PREDECESSOR_FRAGMENT as OLD_SOURCE_FRAGMENT, SOURCE_P044_MANIFEST, PREDECESSOR_RUN}
  from './build-g678-alg-l11-instructional-host-score-successor.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REGISTRY = 'packages/demos/private-current-js-registry.json';
export const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
export const PREDECESSOR_REGISTRY_WITNESS = 'catalog/product-bridge-calibrations/g678-instructional377-v2-private-current-js-registry-witness-v1.json';
export const PREDECESSOR_REGISTRY = {path: PREDECESSOR_REGISTRY_WITNESS, bytes: 431142,
  sha256: 'cd2f223ba4b8c34f19f4b7054bacc687b7e36616b9bab760132d6944b5e7bf42'};
export const PREDECESSOR_FREEZE = {path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json',
  bytes: 2400329, sha256: '4b11e46779f6c042c4a36ebb5b6e5eece1af3dc5b1b88796865abf01cb36bef6'};
export const PREDECESSOR_FRAGMENT = {path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json',
  bytes: 384166, sha256: '45089cc9b93ffa4e612111be251bcabcbfe8919bc024faf8e41e3a954c9bb230'};
export const COMPOSITE = {path: 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-feedback-host-score-successor-v1.fragment.json',
  bytes: 89320, sha256: '99fba166192b39cc423513b510c882737331717ed78dc53c26ae007d05770482'};
export const OUTPUT_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.json';
export const OUTPUT_FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.fragment.json';
export const CHANGED_IDS = Object.freeze(['shared-alg001-l11-p034', 'shared-alg001-l11-p044']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
export const binding = (file, bytes) => ({path: file, bytes: bytes.length, sha256: sha(bytes)});
export const descriptor = ({path, bytes, sha256}) => ({path, bytes, sha256});
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

export function selectedRun(composite, id) {
  if (id === CHANGED_IDS[0]) return composite.p034CompilerRun;
  if (id === CHANGED_IDS[1]) return composite.p044CompilerRun;
  return composite.compilerRun;
}
export function composeFeedbackHostScoreRegistration({priorFreeze, priorFragment, priorRegistry, composite, preparerBinding}) {
  assert.deepEqual(binding(PREDECESSOR_FREEZE.path, encode(priorFreeze)), PREDECESSOR_FREEZE);
  assert.deepEqual(binding(PREDECESSOR_FRAGMENT.path, encode(priorFragment)), PREDECESSOR_FRAGMENT);
  assert.deepEqual(binding(PREDECESSOR_REGISTRY_WITNESS, encode(priorRegistry)), PREDECESSOR_REGISTRY);
  assert.deepEqual(binding(COMPOSITE.path, encode(composite)), COMPOSITE);
  assert.equal(composite.artifactType, 'g678-alg-l11-instructional-feedback-host-score-successor-fragment-v1');
  assert.deepEqual(composite.compilerRun, PREDECESSOR_RUN);
  assert.equal(priorFreeze.calibrationId, CALIBRATION_ID);
  assert.equal(priorFreeze.registrationCandidatePlacementCount, 377);
  assert.equal(priorFreeze.selectedPages.length, 377);
  const matches = priorRegistry.calibrations.filter(c => c.calibrationId === CALIBRATION_ID);
  assert.equal(matches.length, 1);
  const current = matches[0]; assert.equal(current.entries.length, 377);
  assert.equal(current.freezeManifest, PREDECESSOR_FREEZE.path);
  assert.deepEqual(current, priorFragment.calibration);
  const byId = new Map(composite.entries.map(entry => [entry.key, entry]));
  const artifacts = new Map();
  const freeze = structuredClone(priorFreeze);
  freeze.selectedPages = priorFreeze.selectedPages.map(page => {
    if (!CHANGED_IDS.includes(page.animationId)) return structuredClone(page);
    const entry = byId.get(page.animationId), p034 = page.animationId === CHANGED_IDS[0];
    assert.ok(entry);
    assert.equal(entry.source.sha256, page.sourceSha256);
    assert.equal(entry.adapterFamily, page.adapterFamily);
    assert.equal(entry.productCalibrationPassed, false); assert.equal(entry.currentJavaScriptRegistered, false);
    assert.ok(Object.values(entry.acceptanceEffects).every(v => v === false));
    assert.deepEqual(entry.runtimeContract, {...without(page.runtime, ['rendererBinding']),
      lessonHostCapabilities: [p034 ? 'practice-feedback' : 'fq-scoring']});
    const rendererBinding = {kind: 'maintained-dom-module-v1', module: entry.moduleFile, timeline: entry.timeline,
      memberManifest: entry.memberManifest, sourceRun: selectedRun(composite, page.animationId)};
    artifacts.set(page.animationId, rendererBinding);
    const newBlockers = p034 ? [
      'typed-practice-feedback-source-child-my-lesson-product-qa-pending',
      'source-feedback-stream-audio-delivery-pause-resume-and-listening-acceptance-pending',
      'mobile-mathematical-card-readability-and-text-alternatives-pending',
    ] : ['typed-memory-host-fq-score-reset-and-review-my-lesson-product-qa-pending'];
    return {...structuredClone(page), runtime: {...structuredClone(entry.runtimeContract), rendererBinding},
      implementation: {...structuredClone(page.implementation),
        ...(p034 ? {typedPracticeFeedbackHostImplemented: true, sourceFeedbackChildTimelinesImplemented: true}
          : {typedFinalQuizScoreHostImplemented: true, typedFinalQuizScoreResetImplemented: true}),
        productCalibrationPassed: false},
      instructionalHostSuccessor: {authority: COMPOSITE,
        sourceCandidateManifest: p034 ? SOURCE_P034_MANIFEST : SOURCE_P044_MANIFEST,
        registryEntryReplacementPrepared: true, registryActivationRequired: true,
        mountedRuntimeEvidenceOnly: true, productRouteCalibrationPassed: false},
      sourceCandidateBlockers: [...page.sourceCandidateBlockers,
        ...(p034 ? ['source-feedback-stream-audio-lifecycle-not-integrated', 'mobile-mathematical-card-accessibility-pending'] : [])],
      productBlockers: [...new Set([...page.productBlockers.filter(blocker =>
        blocker !== 'typed-memory-host-fq-score-and-reset-not-implemented'), ...newBlockers])],
      productCalibrationPassed: false, engineeringPreviewReady: false};
  });
  assert.equal(artifacts.size, 2);
  const preserved = freeze.selectedPages.filter(page => !CHANGED_IDS.includes(page.animationId));
  assert.equal(preserved.length, 375);
  assert.deepEqual(preserved, priorFreeze.selectedPages.filter(page => !CHANGED_IDS.includes(page.animationId)));
  let authorityReplacements = 0;
  freeze.inputs.selectionAuthorities = priorFreeze.inputs.selectionAuthorities.map(authority => {
    if (authority.path !== OLD_SOURCE_FRAGMENT.path) return structuredClone(authority);
    assert.deepEqual(authority, OLD_SOURCE_FRAGMENT); authorityReplacements++; return structuredClone(COMPOSITE);
  });
  assert.equal(authorityReplacements, 1);
  freeze.inputs = {...freeze.inputs, feedbackHostScorePredecessorFreeze: PREDECESSOR_FREEZE,
    feedbackHostScorePredecessorFragment: PREDECESSOR_FRAGMENT, feedbackHostScorePredecessorRegistry: PREDECESSOR_REGISTRY,
    feedbackHostScoreSource: COMPOSITE, feedbackHostScorePreparer: preparerBinding};
  freeze.productHostCalibration = {...freeze.productHostCalibration, currentHostBrowserRevalidated: false,
    feedbackHostScoreMountedCandidateCount: 2, feedbackHostScoreProductRouteCalibratedCount: 0};
  freeze.limitations = [...freeze.limitations,
    'This v3 preparation changes exactly p034 source feedback and p044 typed host score/reset;375 other page records remain byte-equivalent objects and total registration remains377.',
    'Typed-host implementations passed isolated mounted candidate QA; registered My Lesson QA remains pending for both changed pages. p034 source audio lifecycle and mobile mathematical accessibility remain unresolved.'];
  assert.equal(freeze.productCalibrationPassed, false);
  assert.ok(Object.values(freeze.acceptanceEffects).every(v => v === false));
  const freezeBytes = encode(freeze), freezeBinding = binding(OUTPUT_FREEZE, freezeBytes);
  const calibration = {...structuredClone(current), freezeManifest: OUTPUT_FREEZE,
    freezeManifestBytes: freezeBinding.bytes, freezeManifestSha256: freezeBinding.sha256,
    entries: current.entries.map(entry => CHANGED_IDS.includes(entry.key)
      ? {...structuredClone(entry), module: byId.get(entry.key).module, artifacts: artifacts.get(entry.key)} : structuredClone(entry))};
  assert.deepEqual(calibration.entries.filter(e => !CHANGED_IDS.includes(e.key)), current.entries.filter(e => !CHANGED_IDS.includes(e.key)));
  const nextRegistry = upsertPrivateCurrentJsCalibration(priorRegistry, calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID),
    priorRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID));
  const fragment = {schemaVersion: 1, artifactType: 'private-current-js-calibration-fragment-v1',
    freeze: freezeBinding, calibration, predecessorRegistry: PREDECESSOR_REGISTRY, sourceSuccessorFragment: COMPOSITE,
    registryActivationRequired: true, productCalibrationPassed: false, changedModuleCount: 2, preservedPageCount: 375};
  return {freeze, freezeBytes, fragment, fragmentBytes: encode(fragment), nextRegistry, nextRegistryBytes: encode(nextRegistry),
    changedModuleCount: 2, preservedPageCount: 375};
}

// Exported for isolated filesystem tests. All three preparation outputs are
// exclusive; no registry or generated-file mutation is part of this function.
export async function publishV3Preparation({root = ROOT, witnessBytes, result, check = false}) {
  const witnessPath = path.join(root, PREDECESSOR_REGISTRY_WITNESS);
  assert.deepEqual(binding(PREDECESSOR_REGISTRY_WITNESS, witnessBytes), PREDECESSOR_REGISTRY);
  if (check) {
    await readBoundActivationFile(root, PREDECESSOR_REGISTRY_WITNESS, PREDECESSOR_REGISTRY);
    for (const [file, bytes] of [[OUTPUT_FREEZE, result.freezeBytes], [OUTPUT_FRAGMENT, result.fragmentBytes]])
      assert.ok((await readBoundActivationFile(root, file)).buffer.equals(bytes), `Prepared v3 drift: ${file}`);
    return 0;
  }
  for (const file of [OUTPUT_FREEZE, OUTPUT_FRAGMENT])
    await assert.rejects(lstat(path.join(root, file)), {code: 'ENOENT'}, 'Exclusive v3 output exists');
  let witnessExists = false;
  try {await readBoundActivationFile(root, PREDECESSOR_REGISTRY_WITNESS, PREDECESSOR_REGISTRY); witnessExists = true;}
  catch (error) {if (error.code !== 'ENOENT') throw error;}
  // The parent is the already verified predecessor freeze directory.
  await readBoundActivationFile(root, PREDECESSOR_FREEZE.path, PREDECESSOR_FREEZE);
  if (!witnessExists) await writeFile(witnessPath, witnessBytes, {flag: 'wx', mode: 0o444});
  await writeFile(path.join(root, OUTPUT_FREEZE), result.freezeBytes, {flag: 'wx', mode: 0o444});
  await writeFile(path.join(root, OUTPUT_FRAGMENT), result.fragmentBytes, {flag: 'wx', mode: 0o444});
  return witnessExists ? 2 : 3;
}

export async function prepareFeedbackHostScoreRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  const liveBefore = await readBoundActivationFile(ROOT, REGISTRY);
  await checkV2Preparation({check: true});
  await generateFeedbackHostScoreSuccessor({mode: 'check'});
  let priorRegistry;
  try {priorRegistry = await readBoundActivationFile(ROOT, PREDECESSOR_REGISTRY_WITNESS, PREDECESSOR_REGISTRY);}
  catch (error) {
    if (error.code !== 'ENOENT' || check) throw error;
    assert.deepEqual(binding(PREDECESSOR_REGISTRY_WITNESS, liveBefore.buffer), PREDECESSOR_REGISTRY,
      'A missing v2 witness may only be created from the exact live v2 registry');
    priorRegistry = {...liveBefore, path: PREDECESSOR_REGISTRY_WITNESS};
  }
  const [priorFreeze, priorFragment, composite, preparer] = await Promise.all([
    readBoundActivationFile(ROOT, PREDECESSOR_FREEZE.path, PREDECESSOR_FREEZE),
    readBoundActivationFile(ROOT, PREDECESSOR_FRAGMENT.path, PREDECESSOR_FRAGMENT),
    readBoundActivationFile(ROOT, COMPOSITE.path, COMPOSITE),
    readBoundActivationFile(ROOT, path.relative(ROOT, fileURLToPath(import.meta.url))),
  ]);
  const result = composeFeedbackHostScoreRegistration({priorFreeze: JSON.parse(priorFreeze.buffer),
    priorFragment: JSON.parse(priorFragment.buffer), priorRegistry: JSON.parse(priorRegistry.buffer),
    composite: JSON.parse(composite.buffer), preparerBinding: descriptor(preparer)});
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(liveBefore.buffer), 'Concurrent registry drift during preparation');
  const preparationFilesWritten = write || check
    ? await publishV3Preparation({witnessBytes: priorRegistry.buffer, result, check}) : 0;
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(liveBefore.buffer), 'Preparation must not mutate registry');
  return {prepared: true, mode: write ? 'write' : check ? 'check' : 'plan', registryChanged: false,
    changedModuleCount: 2, preservedPageCount: 375, registrationCountAfterActivation: 377,
    productCalibrationPassed: false, sourceAudioIntegrated: false,
    freeze: binding(OUTPUT_FREEZE, result.freezeBytes), fragment: binding(OUTPUT_FRAGMENT, result.fragmentBytes),
    proposedRegistry: binding(REGISTRY, result.nextRegistryBytes), witness: PREDECESSOR_REGISTRY,
    preparationFilesWritten};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  prepareFeedbackHostScoreRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}
