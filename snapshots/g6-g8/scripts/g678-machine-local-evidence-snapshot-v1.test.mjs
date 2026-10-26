import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {after, test} from 'node:test';
import {G678_LIFE_EXECUTION_ROOT as ROOT, G678_LIFE_SOURCE_ROOT as SOURCE, G678_EVIDENCE_SNAPSHOT_ROOT,
  G678_SNAPSHOT_BOUND_ROOTS, isG678SnapshotBoundPath, resolveG678HistoricalEvidencePath,
  resolveG678PhysicalPath} from '../lib/g678-life-root-binding-v1.mjs';

// Read-only. The snapshot itself is made on the Codex Mac by snapshot-g678-machine-local-evidence.mjs.
const plan = JSON.parse(readFileSync(new URL('../catalog/g678-evidence-snapshots/machine-local-v1-plan.json', import.meta.url), 'utf8'));
const prior = process.env.HELP_MATH_G678_SOURCE_ROOT;
process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE;
after(() => { if (prior === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT; else process.env.HELP_MATH_G678_SOURCE_ROOT = prior; });
const within = (file, root) => file === root || file.startsWith(root + '/');

test('plan and binding agree on the snapshot root and the bound roots', () => {
  assert.equal(plan.kind, 'g678-machine-local-evidence-snapshot-plan-v1');
  assert.equal(plan.snapshotRoot, G678_EVIDENCE_SNAPSHOT_ROOT);
  assert.deepEqual(plan.boundRoots, [...G678_SNAPSHOT_BOUND_ROOTS]);
  assert.deepEqual(plan.conflicts, []);
});

test('every planned pin is exact, unique and under one bound root', () => {
  const seen = new Set();
  for (const entry of plan.entries) {
    assert(isG678SnapshotBoundPath(entry.recorded), entry.recorded);
    assert.equal(G678_SNAPSHOT_BOUND_ROOTS.filter(root => within(entry.recorded, root)).length, 1);
    assert(Number.isSafeInteger(entry.bytes) && /^[a-f0-9]{64}$/.test(entry.sha256));
    assert(!seen.has(entry.recorded)); seen.add(entry.recorded);
  }
});

test('historical reads of a bound root use the snapshot and never fall back to the machine path', () => {
  for (const entry of plan.entries) {
    const snapshot = G678_EVIDENCE_SNAPSHOT_ROOT + entry.recorded;
    if (existsSync(snapshot)) assert.equal(resolveG678HistoricalEvidencePath(entry.recorded, ROOT), snapshot);
    else assert.throws(() => resolveG678HistoricalEvidencePath(entry.recorded, ROOT), /ENOENT/, entry.recorded);
  }
});

test('fresh execution addresses and the existing Life bindings are unchanged', () => {
  for (const recorded of G678_SNAPSHOT_BOUND_ROOTS) {
    try { assert.equal(resolveG678PhysicalPath(recorded, ROOT), recorded); }
    catch (error) { assert.match(String(error), /ENOENT/); }
  }
  assert.equal(resolveG678HistoricalEvidencePath('/Volumes/WestWorld/HELP MATH 2.0-g678-implementation', ROOT), ROOT);
});
