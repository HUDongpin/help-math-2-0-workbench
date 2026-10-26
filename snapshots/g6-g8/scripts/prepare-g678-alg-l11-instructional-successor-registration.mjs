#!/usr/bin/env node
// Prepare the exact replacement of 23 provisional modules. Activation is a
// separate transaction; this command never edits the live private registry.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generate, FRAGMENT as SOURCE_FRAGMENT, RUN_ROOT} from './build-g678-alg-l11-instructional-successor-current-js.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {buildSuccessorGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json';
export const OUTPUT_FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.fragment.json';
const OLD_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
const OLD_FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
export const PREDECESSOR_REGISTRY_WITNESS =
  'catalog/product-bridge-calibrations/g678-provisional377-private-current-js-registry-witness-v1.json';
const GLOSSARY = 'catalog/g678-alg-l11-instructional-successor-glossary-v1.json';
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PINS = {
  [OLD_FREEZE]: '16a8e04786520f62e1e5a833cb9b23aa0e9c25c5e2c1a610970c4774e1bae646',
  [OLD_FRAGMENT]: '9b0e4f2a84882ab499154d77fa2831581665487182adf256683d8de04ea3efa4',
  [REGISTRY]: 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212',
  [PREDECESSOR_REGISTRY_WITNESS]: 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212',
};
export const SUCCESSOR_IDS = Object.freeze([6,8,9,10,11,14,19,20,21,25,26,27,28,29,30,31,32,33,34,40,41,42,44]
  .map(n => `shared-alg001-l11-p${String(n).padStart(3, '0')}`));
const OLD_AUTHORITIES = ['interactive10-tranche-c', 'behavior10-tranche-b', 'advanced3-tranche-d']
  .map(name => `catalog/product-bridge-calibrations/g678-alg-l11-${name}-current-js-v1.fragment.json`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const descriptor = ({path, bytes, sha256}) => ({path, bytes, sha256});
async function readBound(file, expected) {
  const target = path.resolve(ROOT, file);
  assert.ok(target.startsWith(ROOT + path.sep), 'Binding escapes workspace');
  const [canonical, before] = await Promise.all([realpath(target), lstat(target, {bigint: true})]);
  assert.ok(canonical === target && before.isFile() && before.nlink === 1n && !before.isSymbolicLink(), `Not a canonical unique file: ${file}`);
  const buffer = await readFile(target), after = await lstat(target, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mtimeNs', 'mode', 'nlink']) assert.equal(before[key], after[key], `Read drift: ${file}`);
  const result = {path: file, bytes: buffer.length, sha256: sha(buffer), buffer, value: JSON.parse(buffer)};
  if (expected) assert.deepEqual(descriptor(result), expected);
  if (PINS[file]) assert.equal(result.sha256, PINS[file], `Preserved predecessor changed: ${file}`);
  return result;
}

export function composeInstructionalSuccessor({priorFreeze, priorFragment, priorRegistry, sourceFragment,
  glossaryByAnimationId, bindings}) {
  assert.equal(priorFreeze.calibrationId, CALIBRATION_ID);
  assert.equal(priorFreeze.registrationCandidatePlacementCount, 377);
  assert.equal(priorFreeze.selectedPages.length, 377);
  assert.equal(sourceFragment.artifactType, 'g678-alg-l11-instructional-successor-current-js-fragment-v1');
  assert.deepEqual(sourceFragment.entries.map(e => e.key), SUCCESSOR_IDS);
  assert.ok(Object.values(sourceFragment.acceptanceEffects).every(v => v === false));
  const current = priorRegistry.calibrations.find(c => c.calibrationId === CALIBRATION_ID);
  assert.ok(current && current.entries.length === 377 && current.freezeManifest === OLD_FREEZE);
  assert.deepEqual(current.entries.map(({artifacts, ...e}) => e),
    priorFragment.calibration.entries.map(({artifacts, ...e}) => e));
  const entriesById = new Map(sourceFragment.entries.map(e => [e.key, e]));
  const oldById = new Map(priorFreeze.selectedPages.map(p => [p.animationId, p]));
  const replacementArtifacts = new Map();
  const freeze = structuredClone(priorFreeze);
  freeze.selectedPages = priorFreeze.selectedPages.map(page => {
    const entry = entriesById.get(page.animationId);
    if (!entry) return structuredClone(page);
    assert.equal(entry.source.sha256, page.sourceSha256, `${entry.key}: source drift`);
    assert.equal(entry.adapterFamily, page.adapterFamily, `${entry.key}: lane/family drift`);
    assert.equal(entry.currentJavaScriptRegistered, false);
    assert.equal(entry.productCalibrationPassed, false);
    assert.ok(entry.runtimeContract, `${entry.key}: actual module runtime projection missing`);
    const runtime = entry.runtimeContract;
    assert.equal(runtime.frameDomain, page.runtime.frameDomain);
    assert.equal(runtime.frameCount, page.runtime.frameCount);
    assert.equal(runtime.rootFrameCount, page.runtime.rootFrameCount);
    assert.equal(runtime.language, 'fixed-en');
    assert.ok(typeof runtime.scenario === 'string' && runtime.scenario.length > 0);
    const artifacts = {kind: 'maintained-dom-module-v1', module: entry.moduleFile,
      timeline: entry.timeline, memberManifest: entry.memberManifest, sourceRun: sourceFragment.compilerRun};
    replacementArtifacts.set(entry.key, artifacts);
    return {...structuredClone(page), runtime: {...structuredClone(page.runtime), ...runtime, rendererBinding: artifacts},
      implementation: {...structuredClone(page.implementation), sourceBoundInstructionalVisualsImplemented: true,
        familyVisualPlaybackCalibrationPassed: false, productCalibrationPassed: false},
      instructionalSuccessor: {authority: bindings.sourceFragment, originalRegistryEntryReplacementPrepared: true,
        registryActivationRequired: true,
        mountedRuntimeEvidenceOnly: true, productRouteCalibrationPassed: false},
      ...(glossaryByAnimationId[entry.key] ? {glossaryEntries: glossaryByAnimationId[entry.key]} : {}),
      sourceCandidateBlockers: ['source-audio-lifecycle-and-listening-acceptance-pending',
        'authoritative-original-runtime-not-established', 'visual-fidelity-and-human-review-not-accepted'],
      productBlockers: ['alg-l11-instructional-successor-my-lesson-product-calibration-pending',
        ...(entry.key.endsWith('p044') ? ['typed-memory-host-fq-score-and-reset-not-implemented'] : []),
        'source-audio-lifecycle-and-listening-acceptance-pending', 'authoritative-original-runtime-not-established',
        'visual-fidelity-not-accepted'], productCalibrationPassed: false, engineeringPreviewReady: false};
  });
  assert.equal(replacementArtifacts.size, 23);
  const preserved = freeze.selectedPages.filter(p => !entriesById.has(p.animationId));
  assert.equal(preserved.length, 354);
  for (const page of preserved) assert.deepEqual(page, oldById.get(page.animationId), 'Predecessor page changed');
  const authorities = freeze.inputs.selectionAuthorities.filter(a => !OLD_AUTHORITIES.includes(a.path));
  assert.equal(freeze.inputs.selectionAuthorities.length - authorities.length, 3);
  freeze.inputs = {...freeze.inputs, selectionAuthorities: [...authorities, bindings.sourceFragment],
    instructionalSuccessorPredecessorFreeze: bindings.priorFreeze,
    instructionalSuccessorPredecessorFragment: bindings.priorFragment,
    instructionalSuccessorPredecessorRegistry: bindings.priorRegistry,
    instructionalSuccessorSource: bindings.sourceFragment, instructionalSuccessorGlossary: bindings.glossary,
    instructionalSuccessorPreparer: bindings.preparer};
  freeze.productHostCalibration = {...freeze.productHostCalibration, currentHostBrowserRevalidated: false,
    instructionalSuccessorMountedCandidateCount: 23, instructionalSuccessorProductRouteCalibratedCount: 0};
  freeze.limitations = [
    'The 23 ALG L11 source-visual successor modules replace provisional behavior candidates only after separate local registry activation; total registration remains 377, not 400.',
    '354 predecessor page records are preserved exactly. Historical product calibrations are not fresh verification of the changed shared host.',
    'Mounted successor runtime QA is not the complete registry, source-ordered descriptor and modern My Lesson product path; product calibration remains pending.',
    'Source audio lifecycle, original runtime, fidelity, human/Owner review, strict completion, release and publication remain independent and unaccepted.',
  ];
  assert.ok(Object.values(freeze.acceptanceEffects).every(v => v === false));
  const freezeBytes = encode(freeze), freezeBinding = {path: OUTPUT_FREEZE, bytes: freezeBytes.length, sha256: sha(freezeBytes)};
  const calibration = {...structuredClone(current), freezeManifest: OUTPUT_FREEZE,
    freezeManifestBytes: freezeBinding.bytes, freezeManifestSha256: freezeBinding.sha256,
    entries: current.entries.map(e => entriesById.has(e.key)
      ? {...structuredClone(e), module: entriesById.get(e.key).module, artifacts: replacementArtifacts.get(e.key)}
      : structuredClone(e))};
  const nextRegistry = upsertPrivateCurrentJsCalibration(priorRegistry, calibration);
  const fragment = {schemaVersion: 1, artifactType: 'private-current-js-calibration-fragment-v1', freeze: freezeBinding,
    calibration, registryActivationRequired: true, productCalibrationPassed: false,
    sourceSuccessorFragment: bindings.sourceFragment, predecessorRegistry: bindings.priorRegistry};
  return {freeze, freezeBytes, fragment, fragmentBytes: encode(fragment), nextRegistry,
    nextRegistryBytes: encode(nextRegistry), changedModuleCount: 23, preservedPageCount: 354};
}

export async function prepareInstructionalSuccessorRegistration({write = false, check = false} = {}) {
  const run = await readBound(`${RUN_ROOT}/run-manifest.json`);
  await generate({mode: 'check', mounted: run.value.mountedEvidence.map(b => b.path),
    receipts: run.value.sourceSuccessorReceipts.map(b => b.path)});
  await buildSuccessorGlossary({check: true});
  const liveRegistryBefore = await readFile(path.join(ROOT, REGISTRY));
  let priorRegistry;
  try { priorRegistry = await readBound(PREDECESSOR_REGISTRY_WITNESS); }
  catch (error) {
    if (error.code !== 'ENOENT' || check) throw error;
    const current = await readBound(REGISTRY);
    priorRegistry = {...current, path: PREDECESSOR_REGISTRY_WITNESS};
    if (write) await writeFile(path.join(ROOT, PREDECESSOR_REGISTRY_WITNESS), current.buffer, {flag: 'wx', mode: 0o444});
  }
  const [priorFreeze, priorFragment, sourceFragment, glossary] = await Promise.all([
    readBound(OLD_FREEZE), readBound(OLD_FRAGMENT), readBound(SOURCE_FRAGMENT), readBound(GLOSSARY)]);
  await readBound(sourceFragment.value.compilerRun.path, sourceFragment.value.compilerRun);
  const preparerBytes = await readFile(fileURLToPath(import.meta.url));
  const preparer = {path: path.relative(ROOT, fileURLToPath(import.meta.url)), bytes: preparerBytes.length, sha256: sha(preparerBytes)};
  assert.ok(Array.isArray(glossary.value.members) && glossary.value.members.length === 13,
    'Source-verified per-animation glossary projection missing');
  const glossaryByAnimationId = Object.fromEntries(glossary.value.members.map(member =>
    [member.animationId, member.glossaryEntries]));
  const result = composeInstructionalSuccessor({priorFreeze: priorFreeze.value, priorFragment: priorFragment.value,
    priorRegistry: priorRegistry.value, sourceFragment: sourceFragment.value,
    glossaryByAnimationId, bindings: {priorFreeze: descriptor(priorFreeze),
      priorFragment: descriptor(priorFragment), priorRegistry: descriptor(priorRegistry),
      sourceFragment: descriptor(sourceFragment), glossary: descriptor(glossary), preparer}});
  if (write) {
    for (const file of [OUTPUT_FREEZE, OUTPUT_FRAGMENT]) {
      await assert.rejects(lstat(path.join(ROOT, file)), {code: 'ENOENT'}, 'Successor output already exists');
    }
    await writeFile(path.join(ROOT, OUTPUT_FREEZE), result.freezeBytes, {flag: 'wx', mode: 0o444});
    await writeFile(path.join(ROOT, OUTPUT_FRAGMENT), result.fragmentBytes, {flag: 'wx', mode: 0o444});
  } else if (check) {
    assert.deepEqual(await readFile(path.join(ROOT, OUTPUT_FREEZE)), result.freezeBytes);
    assert.deepEqual(await readFile(path.join(ROOT, OUTPUT_FRAGMENT)), result.fragmentBytes);
  }
  assert.deepEqual(await readFile(path.join(ROOT, REGISTRY)), liveRegistryBefore,
    'Preparation must not mutate the live registry');
  return {prepared: true, write, check, changedModuleCount: 23, preservedPageCount: 354,
    registrationCountAfterActivation: 377, registryChanged: false, productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: result.freezeBytes.length, sha256: sha(result.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: result.fragmentBytes.length, sha256: sha(result.fragmentBytes)}};
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length <= 1 && (!args.length || ['--write', '--check'].includes(args[0])));
  prepareInstructionalSuccessorRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}
