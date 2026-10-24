#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, rename, unlink, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {brotliCompress, brotliDecompress, constants} from 'node:zlib';
import {loadIn023Overlay, planIn023Materialization, prepareIn023MaterializedBytes, verifyIn023EffectiveOutputs} from './lib/in023-materialization-overlay-v1.mjs';
import {loadTs008PreservationOverlay, planTs008Preservation, prepareTs008PreservedBytes, verifyTs008PreservedOutputs} from './lib/ts008-preservation-overlay-v1.mjs';
import {createBindingOutputs} from './build-g3-l4-in023-end-stage-bindings-v1.mjs';
import {createAggregateBindingOutputs as createTwoMemberBindingOutputs} from './build-in023-gs002-end-stage-bindings-v1.mjs';
import {verifyAggregateBindingMetadata, processAggregateBindings} from './build-in023-gs002-g5l1-gs002-end-stage-bindings-v1.mjs';
import {loadG5L1Gs002Overlay, planG5L1Gs002AfterIn023Gs002, prepareG5L1Gs002MaterializedBytes, verifyG5L1Gs002EffectiveOutputs} from './lib/g5l1-gs002-materialization-overlay-v1.mjs';
import {loadGs002Overlay, planGs002AfterIn023, prepareGs002MaterializedBytes, verifyGs002EffectiveOutputs} from './lib/gs002-materialization-overlay-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACK = path.join(ROOT, 'deployment/current-js-controlled-preview-v2');
const PREVIOUS_PACK = path.join(ROOT, 'deployment/current-js-controlled-preview');
const MANIFEST = path.join(PACK, 'manifest.json');
const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const PROFILE = 'current-js-1751-controlled-preview-v1';

function assert(value, message) {
  if (!value) throw new Error(message);
}

function safePath(relative) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) &&
    relative.split('/').every((part) => /^[a-zA-Z0-9._-]+$/.test(part) && part !== '.' && part !== '..'),
  'Unsafe asset path');
  return path.join(ROOT, relative);
}

async function records(candidateProfile = null) {
  const [production, candidate, supplement] = await Promise.all([
    readFile(path.join(ROOT, 'apps/web/config/current-js-production-assets.v1.json')).then(JSON.parse),
    candidateProfile ?? readFile(path.join(ROOT, 'apps/web/config/current-js-candidate-assets.v1.json')).then(JSON.parse),
    readFile(path.join(ROOT, 'apps/web/config/current-js-controlled-preview-supplement.v1.json')).then(JSON.parse),
  ]);
  assert(production.entries.length === 1320 && candidate.entries.length === 1331, 'Asset profile count mismatch');
  assert(supplement.schemaVersion === 1 && supplement.profileId === PROFILE && Object.values(supplement.authority).every((value) => value === false), 'Supplement scope mismatch');
  const replacements = new Set(supplement.entries.map((entry) => entry.assetPath));
  assert(supplement.entries.length === replacements.size, 'Duplicate supplement path');
  return [
    ...production.entries.map((entry) => ({
      ...entry,
      source: `apps/web/${entry.storageRoot === 'public' ? 'public' : 'server-assets'}/flash-assets/${entry.assetPath}`,
      destination: `apps/web/${entry.storageRoot === 'public' ? 'public' : 'server-assets'}/flash-assets/${entry.assetPath}`,
    })),
    ...candidate.entries.filter((entry) => !replacements.has(entry.assetPath)).map((entry) => ({
      ...entry,
      source: `apps/web/candidate-assets/flash-assets/${candidate.version}/${entry.assetPath}`,
      destination: `apps/web/public/current-js-preview-assets/${entry.assetPath}`,
    })),
    ...supplement.entries,
  ];
}

async function pack() {
  const entries = await records();
  await mkdir(path.join(PACK, 'blobs'), {recursive: true});
  const byHash = new Map();
  let next = 0;
  await Promise.all(Array.from({length: 3}, async () => {
    while (next < entries.length) {
      const index = next++;
      const entry = entries[index];
      const bytes = await readFile(safePath(entry.source));
      assert(bytes.length === entry.bytes && digest(bytes) === entry.sha256, `Asset bytes changed: ${entry.assetPath}`);
      if (!byHash.has(entry.sha256)) {
        const work = (async () => {
          const cached = await readFile(path.join(PREVIOUS_PACK, 'blobs', `${entry.sha256}.br`)).catch((error) => {if (error.code !== 'ENOENT') throw error; return null;});
          const encoded = cached ?? await compress(bytes, {params: {[constants.BROTLI_PARAM_QUALITY]: 6}});
          assert(digest(await decompress(encoded)) === entry.sha256, `Compression roundtrip failed: ${entry.assetPath}`);
          await writeFile(path.join(PACK, 'blobs', `${entry.sha256}.br`), encoded, {flag: 'wx'});
          return {compressedBytes: encoded.length, compressedSha256: digest(encoded)};
        })();
        byHash.set(entry.sha256, work);
      }
      Object.assign(entry, await byHash.get(entry.sha256));
      if ((index + 1) % 250 === 0) process.stdout.write(`Packed ${index + 1}/${entries.length} assets\n`);
    }
  }));
  const unique = await Promise.all([...byHash.values()]);
  const manifest = {
    schemaVersion: 1, profileId: PROFILE, encoding: 'br',
    recordedAt: new Date().toISOString(),
    counts: {entries: entries.length, uniqueBlobs: unique.length,
      unpackedBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
      packedBytes: unique.reduce((sum, entry) => sum + entry.compressedBytes, 0)},
    entries,
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx'});
  process.stdout.write(`${JSON.stringify(manifest.counts)}\n`);
}

async function materialize(checkOnly) {
  const manifest = JSON.parse(await readFile(MANIFEST));
  const expected = await records();
  assert(manifest.schemaVersion === 1 && manifest.profileId === PROFILE && manifest.encoding === 'br', 'Wrong asset pack');
  assert(manifest.entries.length === expected.length, 'Asset pack membership mismatch');
  const overlay = await loadIn023Overlay(ROOT);
  // The unchanged V1 producer defines the exact IN023-only intermediate profile.
  // Final metadata is checked independently by the finite three-member writer.
  const in023Outputs = await createBindingOutputs(ROOT);
  const intermediateProfiles = in023Outputs.filter((output) => output.path === 'apps/web/config/current-js-candidate-assets.v1.json');
  assert(intermediateProfiles.length === 1, 'Exactly one IN023 intermediate profile required');
  const intermediateExpected = await records(JSON.parse(intermediateProfiles[0].bytes));
  const intermediatePlans = planIn023Materialization(manifest.entries, intermediateExpected, overlay.manifest);
  const gs002Overlay = await loadGs002Overlay(ROOT);
  const twoMemberOutputs = await createTwoMemberBindingOutputs(ROOT);
  const twoMemberProfiles = twoMemberOutputs.filter((output) => output.path === 'apps/web/config/current-js-candidate-assets.v1.json');
  assert(twoMemberProfiles.length === 1, 'Exactly one two-member intermediate profile required');
  const twoMemberExpected = await records(JSON.parse(twoMemberProfiles[0].bytes));
  const twoMemberPlans = planGs002AfterIn023(intermediatePlans, twoMemberExpected, gs002Overlay.manifest);
  const g5l1Gs002Overlay = await loadG5L1Gs002Overlay(ROOT);
  const plans = planG5L1Gs002AfterIn023Gs002(twoMemberPlans, expected, g5l1Gs002Overlay.manifest);
  const transformedPlans = plans.filter((plan) => plan.transformed);
  const gs002Plans = plans.filter((plan) => plan.gs002Transformed);
  const g5l1Gs002Plans = plans.filter((plan) => plan.g5l1Gs002Transformed);
  assert(transformedPlans.length === 1 && gs002Plans.length === 1 && g5l1Gs002Plans.length === 1, 'Exactly one IN023, one G3 GS002 and one G5 GS002 transform required');
  const transformed = transformedPlans[0], gs002 = gs002Plans[0], g5l1Gs002 = g5l1Gs002Plans[0];
  assert(new Set([transformed.base.assetPath, gs002.base.assetPath, g5l1Gs002.base.assetPath]).size === 3, 'Transform membership must be disjoint');
  const preservation = await loadTs008PreservationOverlay(ROOT);
  const preservedIndices = plans.flatMap((plan, index) => plan.base.assetPath === preservation.manifest.target.assetPath ? [index] : []);
  assert(preservedIndices.length === 1, 'Exactly one existing TS008 preservation entry required');
  const preservedIndex = preservedIndices[0];
  const preserved = planTs008Preservation(plans[preservedIndex].base, preservation.candidateEntry, preservation.manifest);
  plans[preservedIndex] = preserved;
  // Validate the separately bound base and effective runtime before any output write.
  const transformedBytes = await prepareIn023MaterializedBytes(ROOT, PACK, transformed, overlay);
  const preservedBytes = await prepareTs008PreservedBytes(PACK, preserved, preservation);
  const gs002Bytes = await prepareGs002MaterializedBytes(ROOT, PACK, gs002, gs002Overlay);
  const g5l1Gs002Bytes = await prepareG5L1Gs002MaterializedBytes(ROOT, PACK, g5l1Gs002, g5l1Gs002Overlay);
  await verifyAggregateBindingMetadata(ROOT);
  // TS008's already-existing candidate is a checked input, never an output here.
  const candidatePreserved = await readFile(safePath('apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/' + preserved.base.assetPath));
  assert(candidatePreserved.equals(preservedBytes), 'Existing TS008 candidate changed');
  // Preserve existing candidate output state. A historical pack must not roll back
  // an unrelated working file, even when its own old manifest is internally valid.
  const visitedAncestors = new Set();
  if (!checkOnly) for (const plan of plans) for (const relative of plan.targets) {
    // All output ancestors are checked once before any write; no symlink escapes.
    let current = path.parse(ROOT).root;
    for (const part of safePath(relative).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      if (visitedAncestors.has(current)) continue;
      const stat = await lstat(current).catch((error) => {if(error.code !== 'ENOENT') throw error; return null;});
      assert(!stat?.isSymbolicLink(), `Materializer output symlink: ${current}`);
      visitedAncestors.add(current);
    }
    const existing = await readFile(safePath(relative)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    assert(!existing || (existing.length === plan.effective.bytes && digest(existing) === plan.effective.sha256) ||
      ((plan.transformed || plan.gs002Transformed || plan.g5l1Gs002Transformed || plan.preservedExisting) && existing.length === plan.base.bytes && digest(existing) === plan.base.sha256),
    `Unreviewed materializer output drift: ${relative}`);
  }
  for (let index = 0; index < expected.length; index++) {
    const plan = plans[index];
    const entry = plan.base;
    const encoded = await readFile(path.join(PACK, 'blobs', `${entry.sha256}.br`));
    assert(encoded.length === entry.compressedBytes && digest(encoded) === entry.compressedSha256, `Compressed asset changed: ${entry.assetPath}`);
    const baseBytes = await decompress(encoded);
    assert(baseBytes.length === entry.bytes && digest(baseBytes) === entry.sha256, `Decoded asset changed: ${entry.assetPath}`);
    const bytes = plan.transformed ? transformedBytes : plan.gs002Transformed ? gs002Bytes : plan.g5l1Gs002Transformed ? g5l1Gs002Bytes : plan.preservedExisting ? preservedBytes : baseBytes;
    assert(bytes.length === plan.effective.bytes && digest(bytes) === plan.effective.sha256, `Effective asset changed: ${entry.assetPath}`);
    if (!checkOnly) {
      for (const relative of plan.targets) {
        const target = safePath(relative);
        await mkdir(path.dirname(target), {recursive: true});
        const existing = await readFile(target).catch((error) => {
          if (error.code !== 'ENOENT') throw error;
          return null;
        });
        if (existing && existing.length === plan.effective.bytes && digest(existing) === plan.effective.sha256) continue;
        const temporary = `${target}.materialize-${process.pid}`;
        try {
          await writeFile(temporary, bytes, {flag: 'wx'});
          await rename(temporary, target);
        } finally {
          await unlink(temporary).catch((error) => {if (error.code !== 'ENOENT') throw error;});
        }
      }
    }
  }
  if (!checkOnly) {
    await verifyIn023EffectiveOutputs(ROOT, transformed);
    await verifyTs008PreservedOutputs(ROOT, preserved);
    await verifyGs002EffectiveOutputs(ROOT, gs002);
    await verifyG5L1Gs002EffectiveOutputs(ROOT, g5l1Gs002);
    await processAggregateBindings(ROOT, '--check');
  }
  process.stdout.write(`${JSON.stringify({checked: expected.length, materialized: !checkOnly, profileId: PROFILE, endStageRuntimes: ['in023-sprite220-split-v1', 'gs002-sprite450-split-v1', 'g5l1-gs002-sprite457-split-v1'], existingRuntimePreservation: 'ts008-existing-candidate-v1', otherEntriesUnchanged: expected.length - 4})}\n`);
}

const action = process.argv[2];
if (action === '--pack') await pack();
else if (action === '--materialize') await materialize(false);
else if (action === '--check') await materialize(true);
else throw new Error('Use --pack, --materialize, or --check');
