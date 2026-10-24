#!/usr/bin/env node
// Maintained finite composition of exactly IN023, G3 GS002 and G5 L1 GS002. No factory replay.
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, rename, unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliDecompressSync} from 'node:zlib';
import {createAggregateBindingOutputs as createTwoMemberBindingOutputs} from './build-in023-gs002-end-stage-bindings-v1.mjs';
import {digest, G5L1_GS002_BASE_SHA256, G5L1_GS002_BASE_BYTES} from './lib/g5l1-gs002-sprite457-end-stage-v1.mjs';
import {loadG5L1Gs002Overlay, g5l1Gs002SafePath, g5l1Gs002ReadReference, g5l1Gs002Keys} from './lib/g5l1-gs002-materialization-overlay-v1.mjs';
import {createThreeMemberComposedOutputs, validateBindingPlan, guardCurrentOutputStates,
  WRITER_PATH, BINDING_PLAN_PATH, CORE_PATH, G5_OVERLAY_PATH, RETAINED_METADATA,
  CURRENT_PREDECESSORS, G5_PREDECESSORS, OUTPUT_PATHS, PUBLIC_PATH, CANDIDATE_PATH, OLD_FREEZE_PATH} from './lib/in023-gs002-g5l1-gs002-composition-v1.mjs';

const ref = (relative, bytes) => ({path: relative, bytes: bytes.length, sha256: digest(bytes)});
const RUNTIME_OUTPUTS = new Set([PUBLIC_PATH, CANDIDATE_PATH,
  'apps/web/public/current-js-preview-assets/courses/course-g03-l04-in-023/canvas-renderer.js',
  'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l04-in-023/canvas-renderer.js',
  'apps/web/public/current-js-preview-assets/courses/course-g03-l01-gs-002/canvas-renderer.js',
  'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l01-gs-002/canvas-renderer.js']);

async function currentBytes(root, relative) {
  const target = await g5l1Gs002SafePath(root, relative, {allowMissing: true});
  try { return {target, bytes: await readFile(target)}; } catch (error) { if (error.code === 'ENOENT') return {target, bytes: null}; throw error; }
}

async function compose(root) {
  const planBytes = await readFile(await g5l1Gs002SafePath(root, BINDING_PLAN_PATH));
  const plan = JSON.parse(planBytes);
  const writerBytes = await readFile(await g5l1Gs002SafePath(root, WRITER_PATH));
  const overlay = await loadG5L1Gs002Overlay(root);
  validateBindingPlan(plan, overlay.manifest, writerBytes);
  // Every implementation, retained predecessor and completed proof reference is
  // read and hashed before any output guard or mutation. Historical provenance
  // paths inside proof contents are never followed by this ordinary build path.
  for (const reference of [plan.twoMemberProducer, ...plan.preservedDependencies, ...Object.values(plan.implementation), plan.v14Candidate, plan.expandedBefore.receipt, plan.transformation])
    await g5l1Gs002ReadReference(root, reference);
  assert.deepEqual(plan.transformation, ref('catalog/runtime-transforms/g5l1-gs002-sprite457-split-v1/manifest.json', overlay.manifestBytes));
  const retained = new Map();
  for (const record of RETAINED_METADATA) {
    const bytes = await g5l1Gs002ReadReference(root, {path: record.retainedPath, bytes: record.bytes, sha256: record.sha256});
    retained.set(record.inputPath, bytes);
  }
  const oldFreeze = await readFile(await g5l1Gs002SafePath(root, OLD_FREEZE_PATH));
  assert(oldFreeze.equals(retained.get(OLD_FREEZE_PATH)), 'Preserved G5L1 predecessor freeze changed');
  const base = brotliDecompressSync(overlay.retainedBase);
  assert.equal(base.length, G5L1_GS002_BASE_BYTES); assert.equal(digest(base), G5L1_GS002_BASE_SHA256);
  // Reuse the unchanged two-member pure producer (which preserves IN023 V1).
  // Strip all old state permissions and never invoke its old whole-file checker.
  const twoMemberOutputs = (await createTwoMemberBindingOutputs(root)).map(({path, bytes}) => ({path, bytes}));
  const g5Predecessors = G5_PREDECESSORS.map(([relative]) => ({path: relative,
    bytes: relative === PUBLIC_PATH || relative === CANDIDATE_PATH ? base : retained.get(relative)}));
  const result = createThreeMemberComposedOutputs({twoMemberOutputs, g5Predecessors, g5BaseBytes: base,
    g5Ir: overlay.ir, planBytes, transformManifestBytes: overlay.manifestBytes, writerBytes});
  const previous = new Map(CURRENT_PREDECESSORS.map(([relative, bytes, sha256]) => [relative, {bytes, sha256}]));
  const outputs = result.outputs.map(output => ({...output, ...(previous.has(output.path)
    ? {priorHash: previous.get(output.path).sha256, priorBytes: previous.get(output.path).bytes}
    : {allowAbsent: true})}));
  assert.deepEqual(outputs.map(o => o.path), OUTPUT_PATHS);
  return {outputs, review: result.review};
}

export async function createAggregateBindingOutputs(root) { return (await compose(root)).outputs; }

export async function verifyAggregateBindingMetadata(root) {
  const outputs = await createAggregateBindingOutputs(root);
  for (const output of outputs.filter(o => !RUNTIME_OUTPUTS.has(o.path))) {
    const bytes = await readFile(await g5l1Gs002SafePath(root, output.path));
    assert(bytes.equals(output.bytes), 'Active aggregate metadata missing or stale: ' + output.path);
  }
}

export async function processAggregateBindings(root, action) {
  assert(['--write', '--check', '--plan'].includes(action), 'Use --write, --check or --plan');
  const {outputs, review} = await compose(root), states = [], targets = new Map();
  // Inspect all output ancestors and all current states before the first write.
  for (const output of outputs) {
    const current = await currentBytes(root, output.path); states.push({path: output.path, bytes: current.bytes}); targets.set(output.path, current.target);
  }
  const guards = guardCurrentOutputStates(outputs, states);
  if (action === '--check') for (const [index, output] of outputs.entries()) assert(states[index].bytes?.equals(output.bytes), 'Effective output missing or stale: ' + output.path);
  if (action === '--write') {
    // Recompute the complete read graph and verify the originally planned buffers
    // again before mutation, then recheck every target in the same seventeen-file set.
    const repeated = await compose(root); assert.deepEqual(repeated.outputs.map(o => ref(o.path, o.bytes)), outputs.map(o => ref(o.path, o.bytes)));
    for (const [index, output] of outputs.entries()) {
      const now = await currentBytes(root, output.path); assert.deepEqual(now.bytes, states[index].bytes, 'Output changed after preflight');
    }
    for (const [index, output] of outputs.entries()) {
      if (states[index].bytes?.equals(output.bytes)) continue;
      const target = targets.get(output.path), temporary = target + '.in023-gs002-g5l1-' + process.pid;
      await mkdir(path.dirname(target), {recursive: true});
      try { await writeFile(temporary, output.bytes, {flag: 'wx'}); await rename(temporary, target); }
      finally { await unlink(temporary).catch(error => {if (error.code !== 'ENOENT') throw error;}); }
    }
    for (const output of outputs) assert((await readFile(await g5l1Gs002SafePath(root, output.path))).equals(output.bytes), 'Written output mismatch');
  }
  return {...review, state: action === '--check' ? 'verified-effective-bindings' : action === '--write' ? 'materialized-effective-bindings' : 'prepared-not-written',
    outputs: outputs.map(o => ref(o.path, o.bytes)), guards, registrationCountDelta: 0, acceptanceCountDelta: 0};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 3, 'Use --plan, --check or --write');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  process.stdout.write(JSON.stringify(await processAggregateBindings(root, process.argv[2]), null, 2) + '\n');
}
