import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {brotliDecompressSync} from 'node:zlib';
import {
  IN023_ASSET_PATH, IN023_BASE_BYTES, IN023_BASE_SHA256,
  IN023_EFFECTIVE_BYTES, IN023_EFFECTIVE_SHA256, IN023_SWF_SHA256,
  digest, generateIn023EndStage,
} from './in023-sprite220-end-stage-v1.mjs';

export const TRANSFORM_ROOT = 'catalog/runtime-transforms/in023-sprite220-split-v1';
export const MANIFEST_PATH = TRANSFORM_ROOT + '/manifest.json';
export const IR_PATH = TRANSFORM_ROOT + '/ir.json';
export const RETAINED_BASE_PATH = TRANSFORM_ROOT + '/base/canvas-renderer.js.br';
export const GENERATOR_PATH = 'scripts/lib/in023-sprite220-end-stage-v1.mjs';
export const CANDIDATE_PATH = 'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + IN023_ASSET_PATH;
export const PUBLIC_PATH = 'apps/web/public/current-js-preview-assets/' + IN023_ASSET_PATH;
const COMPRESSED_BYTES = 32509;
const COMPRESSED_SHA = '0eb436fc27e687227d502cfd53b6bf6a079c818f038221704af77a939dd7c8cc';
const ORIGINAL_FIELDS = ['assetPath', 'bytes', 'sha256', 'storageRoot', 'releaseId', 'source', 'destination'];
const COMMON = Object.freeze({assetPath: IN023_ASSET_PATH, relativePath: 'course-g03-l04-in-023/canvas-renderer.js', storageRoot: 'candidate', releaseId: 'lesson-g03-l04-division-page-only', source: CANDIDATE_PATH, destination: PUBLIC_PATH});
export const ACCEPTANCE_KEYS = Object.freeze(['authoritativeOriginalRuntime', 'behaviorParityAccepted', 'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'releaseEligible', 'published']);
export const PROOF_NAMES = Object.freeze(['source-manifest.json', 'static-verification.json', 'independent-source-review.json', 'independent-state-correction.json', 'parity-comparison.json', 'playback-comparison.json', 'heap-comparison.json', 'replay-pixels-run.json']);
function sameKeys(record, expected, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label);
  assert.deepEqual(Object.keys(record).sort(), [...expected].sort(), label + ' fields');
}
function hashReference(reference, expectedPath, label) {
  sameKeys(reference, ['path', 'sha256', 'bytes'], label);
  assert.equal(reference.path, expectedPath, label + ' path');
  assert(/^[a-f0-9]{64}$/.test(reference.sha256), label + ' SHA');
  assert(Number.isSafeInteger(reference.bytes) && reference.bytes > 0, label + ' bytes');
}
export function validateOverlayManifest(manifest) {
  sameKeys(manifest, ['schemaVersion', 'kind', 'transformId', 'generator', 'ir', 'retainedBase', 'targets', 'proofs', 'acceptanceEffects'], 'Overlay');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'single-current-js-runtime-end-stage-overlay');
  assert.equal(manifest.transformId, 'in023-sprite220-split-v1');
  hashReference(manifest.generator, GENERATOR_PATH, 'Generator');
  hashReference(manifest.ir, IR_PATH, 'IR');
  hashReference(manifest.retainedBase, RETAINED_BASE_PATH, 'Retained base');
  assert.equal(manifest.retainedBase.sha256, COMPRESSED_SHA);
  assert.equal(manifest.retainedBase.bytes, COMPRESSED_BYTES);
  assert(Array.isArray(manifest.targets) && manifest.targets.length === 1, 'Exactly one target is permitted');
  const target = manifest.targets[0];
  sameKeys(target, ['animationId', 'assetPath', 'sourceSwfSha256', 'base', 'effective', 'outputs'], 'Target');
  assert.equal(target.animationId, 'course-g03-l04-in-023');
  assert.equal(target.assetPath, IN023_ASSET_PATH);
  assert.equal(target.sourceSwfSha256, IN023_SWF_SHA256);
  assert.deepEqual(target.base, {sha256: IN023_BASE_SHA256, bytes: IN023_BASE_BYTES, compressedSha256: COMPRESSED_SHA, compressedBytes: COMPRESSED_BYTES});
  assert.deepEqual(target.effective, {sha256: IN023_EFFECTIVE_SHA256, bytes: IN023_EFFECTIVE_BYTES});
  assert.deepEqual(target.outputs, [PUBLIC_PATH, CANDIDATE_PATH]);
  sameKeys(manifest.acceptanceEffects, ACCEPTANCE_KEYS, 'Acceptance');
  assert(Object.values(manifest.acceptanceEffects).every((v) => v === false), 'Acceptance must remain false');
  assert(Array.isArray(manifest.proofs) && manifest.proofs.length === PROOF_NAMES.length, 'Explicit proof references required');
  manifest.proofs.forEach((proof, index) => hashReference(proof, TRANSFORM_ROOT + '/proofs/' + PROOF_NAMES[index], 'Proof ' + index));
  return target;
}
export async function loadIn023Overlay(root) {
  const manifest = JSON.parse(await readFile(path.join(root, MANIFEST_PATH)));
  validateOverlayManifest(manifest);
  const [generator, irBytes, retained] = await Promise.all([
    readFile(path.join(root, GENERATOR_PATH)), readFile(path.join(root, IR_PATH)), readFile(path.join(root, RETAINED_BASE_PATH)),
  ]);
  for (const [bytes, ref] of [[generator, manifest.generator], [irBytes, manifest.ir], [retained, manifest.retainedBase]]) {
    assert.equal(bytes.length, ref.bytes); assert.equal(digest(bytes), ref.sha256);
  }
  for (const ref of manifest.proofs) {
    const bytes = await readFile(path.join(root, ref.path));
    assert.equal(bytes.length, ref.bytes, 'Proof size mismatch: ' + ref.path);
    assert.equal(digest(bytes), ref.sha256, 'Proof hash mismatch: ' + ref.path);
  }
  return {manifest, ir: JSON.parse(irBytes), retainedBase: retained};
}

// All entry identity/profile checks run BEFORE the materializer can write.
// Non-target entries retain the original comparison fields without exceptions.
export function planIn023Materialization(baseEntries, effectiveEntries, manifest) {
  validateOverlayManifest(manifest);
  assert.equal(baseEntries.length, effectiveEntries.length, 'Pack membership mismatch');
  let matches = 0;
  const plans = baseEntries.map((base, index) => {
    const effective = effectiveEntries[index];
    const selected = base.assetPath === IN023_ASSET_PATH || effective.assetPath === IN023_ASSET_PATH;
    if (!selected) {
      assert(ORIGINAL_FIELDS.every((field) => base[field] === effective[field]), 'Non-target pack/profile mismatch at ' + index);
      return {base, effective: base, targets: [base.destination], transformed: false};
    }
    matches++;
    for (const [field, value] of Object.entries(COMMON)) {
      assert.equal(base[field], value, 'Base scope mismatch: ' + field);
      assert.equal(effective[field], value, 'Effective scope mismatch: ' + field);
    }
    assert.equal(base.bytes, IN023_BASE_BYTES); assert.equal(base.sha256, IN023_BASE_SHA256);
    assert.equal(base.compressedBytes, COMPRESSED_BYTES); assert.equal(base.compressedSha256, COMPRESSED_SHA);
    assert.equal(effective.bytes, IN023_EFFECTIVE_BYTES); assert.equal(effective.sha256, IN023_EFFECTIVE_SHA256);
    return {base, effective, targets: [PUBLIC_PATH, CANDIDATE_PATH], transformed: true};
  });
  assert.equal(matches, 1, 'Exactly one IN023 entry must be mapped');
  return plans;
}
export async function prepareIn023MaterializedBytes(root, pack, plan, overlay) {
  assert.equal(plan.transformed, true);
  const encoded = await readFile(path.join(pack, 'blobs', IN023_BASE_SHA256 + '.br'));
  assert.equal(encoded.length, COMPRESSED_BYTES); assert.equal(digest(encoded), COMPRESSED_SHA);
  assert(encoded.equals(overlay.retainedBase), 'Retained/base-pack bytes differ');
  const base = brotliDecompressSync(encoded);
  assert.equal(base.length, IN023_BASE_BYTES); assert.equal(digest(base), IN023_BASE_SHA256);
  const output = generateIn023EndStage(base, overlay.ir);
  assert.equal(output.length, plan.effective.bytes); assert.equal(digest(output), plan.effective.sha256);
  return output;
}
export async function verifyIn023EffectiveOutputs(root, plan) {
  assert.equal(plan.transformed, true);
  for (const target of plan.targets) {
    assert([PUBLIC_PATH, CANDIDATE_PATH].includes(target), 'Unexpected output path');
    const bytes = await readFile(path.join(root, target));
    assert.equal(bytes.length, IN023_EFFECTIVE_BYTES, 'Effective output size mismatch: ' + target);
    assert.equal(digest(bytes), IN023_EFFECTIVE_SHA256, 'Effective output hash mismatch: ' + target);
  }
}
