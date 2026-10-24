import assert from 'node:assert/strict';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {brotliDecompressSync} from 'node:zlib';
import {generateGs002EndStage, GS002_ASSET_PATH, GS002_BASE_BYTES, GS002_BASE_SHA256,
  GS002_EFFECTIVE_BYTES, GS002_EFFECTIVE_SHA256, GS002_SWF_SHA256, GS002_IR_SHA256, digest} from './gs002-sprite450-end-stage-v1.mjs';

export const GS002_TRANSFORM_ROOT = 'catalog/runtime-transforms/gs002-sprite450-split-v1';
export const GS002_MANIFEST_PATH = GS002_TRANSFORM_ROOT + '/manifest.json';
export const GS002_GENERATOR_PATH = 'scripts/lib/gs002-sprite450-end-stage-v1.mjs';
export const GS002_IR_PATH = GS002_TRANSFORM_ROOT + '/ir.json';
export const GS002_RETAINED_BASE_PATH = GS002_TRANSFORM_ROOT + '/base/canvas-renderer.js.br';
export const GS002_PUBLIC_PATH = 'apps/web/public/current-js-preview-assets/' + GS002_ASSET_PATH;
export const GS002_CANDIDATE_PATH = 'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + GS002_ASSET_PATH;
export const GS002_ACCEPTANCE_KEYS = Object.freeze(['authoritativeOriginalRuntime', 'behaviorParityAccepted', 'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'releaseEligible', 'published']);
const MODES = ['parity', 'replay-pixels', 'playback', 'heap'];
const REPORT_NAMES = ['run.json', 'comparison.json', 'original-report.json', 'variant-report.json'];
export const GS002_PROOF_NAMES = Object.freeze(['source-static-verification.json', 'prototype-source-manifest.json',
  'independent-output-review.json', 'portable-emitter-reproduction.json', 'browser-root-freeze.json',
  'browser/bundle-manifest.json', 'browser/closure.json', ...MODES.flatMap(mode => REPORT_NAMES.map(name => 'browser/' + mode + '/' + name))]);
const COMPRESSED_BYTES = 969928;
const COMPRESSED_SHA = '5cf2f4b1cf73985d05756558ad267cba879cbdad9003ec58a7693780d389ad59';
const COMMON = Object.freeze({assetPath: GS002_ASSET_PATH, relativePath: 'course-g03-l01-gs-002/canvas-renderer.js', storageRoot: 'candidate',
  releaseId: 'lesson-g03-l01-place-value-page-only', source: GS002_CANDIDATE_PATH, destination: GS002_PUBLIC_PATH});
const BASE = Object.freeze({...COMMON, bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256, compressedBytes: COMPRESSED_BYTES, compressedSha256: COMPRESSED_SHA});
const EFFECTIVE = Object.freeze({...COMMON, bytes: GS002_EFFECTIVE_BYTES, sha256: GS002_EFFECTIVE_SHA256});

export function gs002Keys(record, names, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label);
  assert.equal(Object.getPrototypeOf(record), Object.prototype, label + ' must be JSON');
  const actual = Reflect.ownKeys(record); assert(actual.every(key => typeof key === 'string'));
  assert.deepEqual(actual.sort(), [...names].sort(), label + ' has missing or unknown fields');
  assert(Object.values(Object.getOwnPropertyDescriptors(record)).every(d => Object.hasOwn(d, 'value')), label + ' accessor rejected');
}
export function gs002Reference(record, expectedPath, label) {
  gs002Keys(record, ['path', 'bytes', 'sha256'], label); assert.equal(record.path, expectedPath);
  assert(Number.isSafeInteger(record.bytes) && record.bytes > 0 && record.bytes < 32 * 1024 * 1024);
  assert(typeof record.sha256 === 'string' && /^[a-f0-9]{64}$/.test(record.sha256));
}
export async function gs002SafePath(root, relative, {allowMissing = false} = {}) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) && relative.split('/').every(part => /^[A-Za-z0-9._-]+$/.test(part) && part !== '.' && part !== '..'), 'Unsafe maintained path');
  const target = path.resolve(root, relative); let current = path.parse(target).root;
  for (const part of target.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let status; try { status = await lstat(current); } catch (error) { if (allowMissing && error.code === 'ENOENT') return target; throw error; }
    assert(!status.isSymbolicLink(), 'Maintained path has a symlink: ' + current);
    if (current !== target) assert(status.isDirectory(), 'Maintained ancestor is not a directory');
    else assert(status.isFile(), 'Maintained path must be a regular file');
  }
  return target;
}
export async function gs002ReadReference(root, reference) {
  const target = await gs002SafePath(root, reference.path), bytes = await readFile(target);
  assert.equal(bytes.length, reference.bytes, 'Referenced size mismatch: ' + reference.path);
  assert.equal(digest(bytes), reference.sha256, 'Referenced hash mismatch: ' + reference.path);
  return bytes;
}

export function validateGs002OverlayManifest(manifest) {
  gs002Keys(manifest, ['schemaVersion', 'kind', 'transformId', 'generator', 'ir', 'retainedBase', 'target', 'proofs', 'acceptanceEffects'], 'GS002 overlay');
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.kind, 'single-current-js-runtime-end-stage-overlay');
  assert.equal(manifest.transformId, 'gs002-sprite450-split-v1');
  gs002Reference(manifest.generator, GS002_GENERATOR_PATH, 'Generator');
  assert.equal(manifest.generator.bytes, 9508); assert.equal(manifest.generator.sha256, 'f643d46eac05d1b2a0dcdc8462a774ebf2a614e1469dfe11f089996b91ed1b34');
  gs002Reference(manifest.ir, GS002_IR_PATH, 'IR'); assert.equal(manifest.ir.bytes, 253009); assert.equal(manifest.ir.sha256, GS002_IR_SHA256);
  gs002Reference(manifest.retainedBase, GS002_RETAINED_BASE_PATH, 'Retained base');
  assert.equal(manifest.retainedBase.bytes, COMPRESSED_BYTES); assert.equal(manifest.retainedBase.sha256, COMPRESSED_SHA);
  gs002Keys(manifest.target, ['animationId', 'assetPath', 'sourceSwfSha256', 'base', 'effective', 'outputs'], 'Target');
  assert.equal(manifest.target.animationId, 'course-g03-l01-gs-002'); assert.equal(manifest.target.assetPath, GS002_ASSET_PATH); assert.equal(manifest.target.sourceSwfSha256, GS002_SWF_SHA256);
  assert.deepEqual(manifest.target.base, {bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256, compressedBytes: COMPRESSED_BYTES, compressedSha256: COMPRESSED_SHA});
  assert.deepEqual(manifest.target.effective, {bytes: GS002_EFFECTIVE_BYTES, sha256: GS002_EFFECTIVE_SHA256});
  assert.deepEqual(manifest.target.outputs, [GS002_PUBLIC_PATH, GS002_CANDIDATE_PATH]);
  gs002Keys(manifest.acceptanceEffects, GS002_ACCEPTANCE_KEYS, 'Acceptance'); assert(Object.values(manifest.acceptanceEffects).every(value => value === false));
  assert(Array.isArray(manifest.proofs) && manifest.proofs.length === GS002_PROOF_NAMES.length);
  manifest.proofs.forEach((proof, index) => gs002Reference(proof, GS002_TRANSFORM_ROOT + '/proofs/' + GS002_PROOF_NAMES[index], 'Proof ' + index));
  const proof = name => manifest.proofs[GS002_PROOF_NAMES.indexOf(name)];
  assert.equal(proof('source-static-verification.json').sha256, '3dbbde38949bae30abee6c21040a74296012387175fb3a3f2da2a5197c91d176');
  assert.equal(proof('prototype-source-manifest.json').sha256, '9831ddabdb7c49c4fecbf318e75db4b8f6d1bd3d8f52b7a165b496ee4e811f13');
  assert.equal(proof('independent-output-review.json').sha256, '66cd5b83c1ae050c4ddfc1ca41745bc4c454b87e7f6efc7b873a99b38f470b3e');
  assert.equal(proof('portable-emitter-reproduction.json').sha256, '55fd36ebfcadcc6249859eda96d21583ae5505bd24bf1958b04a9b6ee76fc249');
  assert.equal(proof('browser-root-freeze.json').sha256, '94334f3750bf3a2b8eb5355facd37eeeae8f32a911cc7e6ada9482592a7f1dbd');
  assert.equal(proof('browser/bundle-manifest.json').sha256, '5704b7cb61a47f6e7705898c089d3c3ecf1d2200eb388d8750e7b5c832e28d2e');
  assert.equal(proof('browser/closure.json').sha256, 'f2a41b5765c3e58b76e6aeccd7eeb54169a7f8cc7bcaa2a4bb17b454cbf389e6');
  return manifest.target;
}

function verifyProofContents(proofs) {
  const get = name => JSON.parse(proofs.get(name));
  const bundle = get('browser/bundle-manifest.json');
  gs002Keys(bundle, ['schemaVersion', 'kind', 'reportFileCount', 'closure', 'files', 'totalReportBytes', 'sourceSha256', 'variantSha256', 'externalPngBytesIncluded', 'sourceProofsIncluded'], 'Browser bundle');
  assert.equal(bundle.schemaVersion, 1); assert.equal(bundle.kind, 'gs002-isolated-browser-proof-bundle-manifest-v1');
  assert.equal(bundle.sourceSha256, GS002_BASE_SHA256); assert.equal(bundle.variantSha256, GS002_EFFECTIVE_SHA256); assert.equal(bundle.reportFileCount, 16);
  assert.equal(bundle.externalPngBytesIncluded, false); assert.equal(bundle.sourceProofsIncluded, false);
  assert.deepEqual(bundle.files.map(r => r.path), MODES.flatMap(mode => REPORT_NAMES.map(name => mode + '/' + name)));
  for (const reference of [...bundle.files, bundle.closure]) {
    gs002Reference(reference, reference.path, 'Bundle member'); const bytes = proofs.get('browser/' + reference.path);
    assert(bytes, 'Unlisted bundle member'); assert.equal(bytes.length, reference.bytes); assert.equal(digest(bytes), reference.sha256);
  }
  assert.equal(bundle.totalReportBytes, bundle.files.reduce((sum, r) => sum + r.bytes, 0));
  const closure = get('browser/closure.json'); assert.equal(closure.kind, 'gs002-isolated-browser-proof-closure-v1');
  assert.equal(closure.state, 'verified-report-closure-original-heap-failure-preserved');
  assert.deepEqual(closure.source.original, {bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256});
  assert.deepEqual(closure.source.variant, {bytes: GS002_EFFECTIVE_BYTES, sha256: GS002_EFFECTIVE_SHA256});
  assert.equal(closure.source.sourceSwfSha256, GS002_SWF_SHA256); assert.equal(closure.source.frames, 775);
  assert.equal(closure.claimBoundary.originalHeapFailureCleared, false); assert.equal(closure.claimBoundary.v13MyLessonCredit, false);
  assert.equal(closure.claimBoundary.variantIsolatedHeapPassed, true); assert.equal(closure.claimBoundary.originalIsolatedHeapPassed, false);
  const statuses = ['passed-current-js-pixel-and-state-equivalence', 'passed-current-js-replay-pixel-and-state-equivalence',
    'completed-whole-playback-and-replay-diagnostic', 'completed-isolated-diagnostic-comparison'];
  for (const [index, mode] of MODES.entries()) {
    const run = get('browser/' + mode + '/run.json'), comparisonBytes = proofs.get('browser/' + mode + '/comparison.json'), comparison = JSON.parse(comparisonBytes);
    assert.equal(run.kind, 'gs002-paired-browser-orchestration-v1'); assert.equal(run.state, 'completed'); assert.equal(run.mode, mode);
    assert.equal(run.closedInputsVerified, true); assert.deepEqual(run.notRunSides, []); assert.deepEqual(run.children.map(c => c.side), ['original', 'variant']);
    assert.equal(run.comparison.sha256, digest(comparisonBytes)); assert.equal(comparison.state, statuses[index]); assert.equal(comparison.mode, mode);
    assert.deepEqual(comparison.violations, []); assert(Object.values(comparison.boundaries).every(v => v === false));
    assert.equal(comparison.originalAsset.sha256, GS002_BASE_SHA256); assert.equal(comparison.variantAsset.sha256, GS002_EFFECTIVE_SHA256);
    for (const [sideIndex, side] of ['original', 'variant'].entries()) {
      const bytes = proofs.get('browser/' + mode + '/' + side + '-report.json'), worker = JSON.parse(bytes), child = run.children[sideIndex];
      assert.equal(comparison[side + 'Report'].sha256, digest(bytes)); assert.equal(child.workerPid, worker.workerPid);
      assert.equal(child.exitCode, 0); assert.equal(child.lifetime.observedClose, true); assert.equal(child.lifetime.timedOut, false);
      assert.equal(worker.mode, mode); assert.equal(worker.side, side); assert.equal(worker.state, 'completed');
      assert.equal(worker.manifestSha256, '9831ddabdb7c49c4fecbf318e75db4b8f6d1bd3d8f52b7a165b496ee4e811f13');
      assert.equal(worker.asset.sha256, side === 'original' ? GS002_BASE_SHA256 : GS002_EFFECTIVE_SHA256);
      for (const key of ['contextClosed', 'browserClosed', 'serverClosed', 'closedInputsVerified', 'measurementCompleted', 'imageReadinessObjectGroupReleased']) assert.equal(worker[key], true, mode + '/' + side + '/' + key);
      for (const key of ['pageErrors', 'consoleErrors', 'failedRequests', 'unexpectedRequests', 'serverErrors']) assert.deepEqual(worker[key], []);
      assert.equal(worker.imageReadiness.length, 5); assert(worker.imageReadiness.every(image => image.decodeAwaited && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0));
    }
    assert.notEqual(run.children[0].workerPid, run.children[1].workerPid);
  }
  const parity = get('browser/parity/comparison.json'); assert.equal(parity.comparedFramesPerTraversal, 775); assert.equal(parity.traversalCount, 2); assert.equal(parity.rgbaByteEquality, true);
  const heap = get('browser/heap/comparison.json'); assert.equal(heap.originalAssessment.status, 'failed'); assert.equal(heap.variantAssessment.status, 'passed');
  assert.equal(heap.isolatedOriginalBudgetPassed, false); assert.equal(heap.isolatedVariantBudgetPassed, true);
  const staticProof = get('source-static-verification.json'); assert.equal(staticProof.inputSha256, GS002_BASE_SHA256); assert.equal(staticProof.outputSha256, GS002_EFFECTIVE_SHA256);
  assert.equal(staticProof.caseCount, 775); assert.equal(staticProof.uniqueHelperCount, 182); assert.equal(staticProof.outsideOriginalRootBytesPreserved, 5935146);
  const independent = get('independent-output-review.json'); assert.equal(independent.kind, 'gs002-independent-transformed-output-static-review');
  assert.equal(independent.status, 'passed-static-output-contract');
  assert.equal(independent.references.original.sha256, GS002_BASE_SHA256); assert.equal(independent.references.original.bytes, GS002_BASE_BYTES);
  assert.equal(independent.references.variant.sha256, GS002_EFFECTIVE_SHA256); assert.equal(independent.references.variant.bytes, GS002_EFFECTIVE_BYTES);
  assert.equal(independent.references.ir.sha256, GS002_IR_SHA256);
  assert.equal(independent.facts.orderedCases, 775); assert.equal(independent.facts.exactOriginalConsequentBodies, 775);
  assert.equal(independent.facts.newHelpers, 182); assert.equal(independent.facts.exactUniqueLiftedBodies, 182);
  assert.equal(independent.facts.exteriorBytesUnchanged, 5935146); assert.equal(independent.facts.otherFunctionsUnchanged, 454);
  const portable = get('portable-emitter-reproduction.json'); assert.equal(portable.status, 'PASS_PORTABLE_BYTES_ONLY');
  assert.deepEqual(portable.base, {bytes: GS002_BASE_BYTES, sha256: GS002_BASE_SHA256});
  assert.equal(portable.ir.sha256, GS002_IR_SHA256); assert.equal(portable.output.sha256, GS002_EFFECTIVE_SHA256);
  assert.equal(portable.output.bytes, GS002_EFFECTIVE_BYTES); assert.equal(portable.exactReviewedPrototypeBytes, true);
}

export async function loadGs002Overlay(root) {
  const manifestBytes = await readFile(await gs002SafePath(root, GS002_MANIFEST_PATH)), manifest = JSON.parse(manifestBytes);
  validateGs002OverlayManifest(manifest);
  const generator = await gs002ReadReference(root, manifest.generator), irBytes = await gs002ReadReference(root, manifest.ir), retainedBase = await gs002ReadReference(root, manifest.retainedBase);
  const proofs = new Map();
  for (const [index, reference] of manifest.proofs.entries()) proofs.set(GS002_PROOF_NAMES[index], await gs002ReadReference(root, reference));
  verifyProofContents(proofs);
  return {manifest, manifestBytes, generator, ir: JSON.parse(irBytes), retainedBase};
}

export function planGs002AfterIn023(intermediatePlans, finalExpected, manifest) {
  validateGs002OverlayManifest(manifest); assert.equal(intermediatePlans.length, finalExpected.length); assert.equal(intermediatePlans.length, 2660);
  let matches = 0;
  const plans = intermediatePlans.map((plan, index) => {
    const final = finalExpected[index], selected = plan.base.assetPath === GS002_ASSET_PATH || final.assetPath === GS002_ASSET_PATH;
    if (!selected) {
      const {compressedBytes, compressedSha256, ...intermediate} = plan.effective;
      assert.deepEqual(final, intermediate, 'Non-GS002 intermediate/final field mismatch at ' + index);
      return plan;
    }
    matches++; assert.equal(plan.transformed, false); assert.deepEqual(plan.base, BASE); assert.deepEqual(plan.effective, BASE);
    assert.deepEqual(final, EFFECTIVE); assert.deepEqual(plan.targets, [GS002_PUBLIC_PATH]);
    return {base: plan.base, effective: final, targets: [GS002_PUBLIC_PATH, GS002_CANDIDATE_PATH], gs002Transformed: true, transformed: false};
  });
  assert.equal(matches, 1); assert.equal(plans.filter(plan => plan.transformed).length, 1); return plans;
}
function validatePlan(plan) {
  gs002Keys(plan, ['base', 'effective', 'targets', 'gs002Transformed', 'transformed'], 'GS002 plan');
  assert.deepEqual(plan.base, BASE); assert.deepEqual(plan.effective, EFFECTIVE); assert.deepEqual(plan.targets, [GS002_PUBLIC_PATH, GS002_CANDIDATE_PATH]);
  assert.equal(plan.gs002Transformed, true); assert.equal(plan.transformed, false);
}
export async function prepareGs002MaterializedBytes(root, pack, plan, overlay) {
  validatePlan(plan); validateGs002OverlayManifest(overlay.manifest);
  const encoded = await readFile(path.join(pack, 'blobs', GS002_BASE_SHA256 + '.br'));
  assert.equal(encoded.length, COMPRESSED_BYTES); assert.equal(digest(encoded), COMPRESSED_SHA); assert(encoded.equals(overlay.retainedBase));
  const output = generateGs002EndStage(brotliDecompressSync(encoded), overlay.ir);
  assert.equal(output.length, plan.effective.bytes); assert.equal(digest(output), plan.effective.sha256); return output;
}
export async function verifyGs002EffectiveOutputs(root, plan) {
  validatePlan(plan);
  for (const relative of plan.targets) {
    const bytes = await readFile(await gs002SafePath(root, relative)); assert.equal(bytes.length, GS002_EFFECTIVE_BYTES); assert.equal(digest(bytes), GS002_EFFECTIVE_SHA256);
  }
}
