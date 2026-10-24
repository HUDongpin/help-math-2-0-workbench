import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {brotliDecompressSync} from 'node:zlib';
import {
  TS008_ASSET_PATH, TS008_BASE_BYTES, TS008_BASE_SHA256,
  TS008_EFFECTIVE_BYTES, TS008_EFFECTIVE_SHA256, TS008_SWF_SHA256,
  digest, generateTs008PreservedRuntime,
} from './ts008-existing-candidate-preservation-v1.mjs';
export const TS008_PRESERVATION_ROOT = 'catalog/runtime-preservations/ts008-existing-candidate-v1';
export const TS008_MANIFEST_PATH = TS008_PRESERVATION_ROOT + '/manifest.json';
export const TS008_RETAINED_BASE_PATH = TS008_PRESERVATION_ROOT + '/base/canvas-renderer.js.br';
export const TS008_GENERATOR_PATH = 'scripts/lib/ts008-existing-candidate-preservation-v1.mjs';
export const TS008_OVERLAY_PATH = 'scripts/lib/ts008-preservation-overlay-v1.mjs';
export const TS008_PUBLIC_PATH = 'apps/web/public/current-js-preview-assets/' + TS008_ASSET_PATH;
export const TS008_CANDIDATE_PATH = 'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + TS008_ASSET_PATH;
export const TS008_CANDIDATE_PROFILE_PATH = 'apps/web/config/current-js-candidate-assets.v1.json';
const COMPRESSED_BYTES = 1806882;
const COMPRESSED_SHA = '8e407303124decb8676221a4f7c69a3cb3f3e290d3d63e6780edeedf0f0c9b24';
const PROOF_PATHS = [TS008_PRESERVATION_ROOT + '/proofs/ts008-collateral-preservation-audit.json', TS008_PRESERVATION_ROOT + '/proofs/old-pack-vs-v12.diff'];
const ACCEPTANCE_KEYS = ['authoritativeOriginalRuntime', 'behaviorParityAccepted', 'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'releaseEligible', 'published'];
const BASE_RECORD = Object.freeze({assetPath: TS008_ASSET_PATH, bytes: TS008_BASE_BYTES,
  sha256: TS008_BASE_SHA256, storageRoot: 'public', releaseId: 'lesson-g03-l01-place-value-page-only',
  source: 'public/flash-assets/' + TS008_ASSET_PATH, destination: TS008_PUBLIC_PATH,
  compressedBytes: COMPRESSED_BYTES, compressedSha256: COMPRESSED_SHA});
const CANDIDATE_RECORD = Object.freeze({assetPath: TS008_ASSET_PATH,
  relativePath: 'course-g03-l01-ts-008/canvas-renderer.js', storageRoot: 'candidate',
  releaseId: 'lesson-g03-l01-place-value-page-only', bytes: TS008_EFFECTIVE_BYTES, sha256: TS008_EFFECTIVE_SHA256});
const EFFECTIVE_RECORD = Object.freeze({...BASE_RECORD, bytes: TS008_EFFECTIVE_BYTES, sha256: TS008_EFFECTIVE_SHA256});
function ownKeys(record, expected, label) {
  assert(record && typeof record === 'object' && !Array.isArray(record), label);
  assert.deepEqual(Object.keys(record).sort(), [...expected].sort(), label + ' fields');
}
function reference(ref, expectedPath, label) {
  ownKeys(ref, ['path', 'bytes', 'sha256'], label);
  assert.equal(ref.path, expectedPath, label + ' path');
  assert(Number.isSafeInteger(ref.bytes) && ref.bytes > 0, label + ' size');
  assert(typeof ref.sha256 === 'string' && /^[a-f0-9]{64}$/.test(ref.sha256), label + ' hash');
}
export function validateTs008PreservationManifest(manifest) {
  ownKeys(manifest, ['schemaVersion', 'kind', 'preservationId', 'generator', 'overlay', 'retainedBase', 'target', 'proofs', 'acceptanceEffects'], 'TS008 preservation');
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.kind, 'exact-existing-candidate-envelope-preservation');
  assert.equal(manifest.preservationId, 'ts008-existing-candidate-v1');
  reference(manifest.generator, TS008_GENERATOR_PATH, 'Generator');
  reference(manifest.overlay, TS008_OVERLAY_PATH, 'Overlay helper');
  reference(manifest.retainedBase, TS008_RETAINED_BASE_PATH, 'Retained base');
  assert.equal(manifest.retainedBase.bytes, COMPRESSED_BYTES);
  assert.equal(manifest.retainedBase.sha256, COMPRESSED_SHA);
  assert.deepEqual(manifest.target, {animationId: 'course-g03-l01-ts-008',
    assetPath: TS008_ASSET_PATH, sourceSwfSha256: TS008_SWF_SHA256,
    base: BASE_RECORD, effectiveCandidate: CANDIDATE_RECORD, outputs: [TS008_PUBLIC_PATH]});
  ownKeys(manifest.acceptanceEffects, ACCEPTANCE_KEYS, 'Acceptance flags');
  assert(Object.values(manifest.acceptanceEffects).every((v) => v === false));
  assert(Array.isArray(manifest.proofs) && manifest.proofs.length === PROOF_PATHS.length);
  manifest.proofs.forEach((ref, i) => reference(ref, PROOF_PATHS[i], 'Proof ' + i));
  return manifest.target;
}
export function ts008CandidateProfileEntry(profile) {
  assert(profile && profile.schemaVersion === 1 &&
    profile.profileId === 'current-js-candidate-assets-v1' &&
    profile.version === '2026-08-22-page-only-candidates-v1' &&
    Array.isArray(profile.entries) && profile.entries.length === 1331,
  'Full existing candidate profile identity changed');
  const entries = profile.entries.filter((r) => r.assetPath === TS008_ASSET_PATH);
  assert.equal(entries.length, 1, 'Exactly one TS008 candidate profile record is required');
  assert.deepEqual(entries[0], CANDIDATE_RECORD, 'Existing TS008 candidate profile binding changed');
  return entries[0];
}
export async function loadTs008PreservationOverlay(root) {
  const manifest = JSON.parse(await readFile(path.join(root, TS008_MANIFEST_PATH)));
  validateTs008PreservationManifest(manifest);
  const refs = [manifest.generator, manifest.overlay, manifest.retainedBase, ...manifest.proofs];
  const contents = await Promise.all(refs.map(async (ref) => {
    const bytes = await readFile(path.join(root, ref.path));
    assert.equal(bytes.length, ref.bytes, ref.path + ' size changed');
    assert.equal(digest(bytes), ref.sha256, ref.path + ' hash changed');
    return bytes;
  }));
  const candidateEntry = ts008CandidateProfileEntry(JSON.parse(await readFile(path.join(root, TS008_CANDIDATE_PROFILE_PATH))));
  return {manifest, retainedBase: contents[2], candidateEntry};
}
export function planTs008Preservation(basePackRow, effectiveCandidateRow, manifest) {
  validateTs008PreservationManifest(manifest);
  assert.deepEqual(basePackRow, BASE_RECORD, 'TS008 frozen base record changed');
  assert.deepEqual(effectiveCandidateRow, CANDIDATE_RECORD, 'TS008 effective candidate record changed');
  return {base: basePackRow, effective: {...EFFECTIVE_RECORD},
    targets: [TS008_PUBLIC_PATH], preservedExisting: true, transformed: false};
}
function validatePlan(plan) {
  ownKeys(plan, ['base', 'effective', 'targets', 'preservedExisting', 'transformed'], 'TS008 plan');
  assert.deepEqual(plan.base, BASE_RECORD);
  assert.deepEqual(plan.effective, EFFECTIVE_RECORD);
  assert.deepEqual(plan.targets, [TS008_PUBLIC_PATH]);
  assert.equal(plan.preservedExisting, true); assert.equal(plan.transformed, false);
}
export async function prepareTs008PreservedBytes(packDirectory, plan, overlay) {
  validatePlan(plan); validateTs008PreservationManifest(overlay.manifest);
  assert.deepEqual(overlay.candidateEntry, CANDIDATE_RECORD);
  const encoded = await readFile(path.join(packDirectory, 'blobs', TS008_BASE_SHA256 + '.br'));
  assert.equal(encoded.length, COMPRESSED_BYTES); assert.equal(digest(encoded), COMPRESSED_SHA);
  assert(Buffer.isBuffer(overlay.retainedBase) && encoded.equals(overlay.retainedBase));
  const output = generateTs008PreservedRuntime(brotliDecompressSync(encoded));
  assert.equal(output.length, plan.effective.bytes); assert.equal(digest(output), plan.effective.sha256);
  return output;
}
export async function verifyTs008PreservedOutputs(root, plan) {
  validatePlan(plan);
  // The existing candidate file is checked but is never a write target here.
  for (const target of [TS008_PUBLIC_PATH, TS008_CANDIDATE_PATH]) {
    const bytes = await readFile(path.join(root, target));
    assert.equal(bytes.length, TS008_EFFECTIVE_BYTES, 'TS008 preserved output size changed');
    assert.equal(digest(bytes), TS008_EFFECTIVE_SHA256, 'TS008 preserved output hash changed');
  }
}
