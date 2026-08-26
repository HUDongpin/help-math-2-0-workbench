import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildEpochClosureArtifacts,
  parseArguments,
} from './build-development-epoch-closure-2026-08-07-r1.mjs';

async function loadFrozenClosure() {
  try {
    const [json, markdown] = await Promise.all([
      readFile('reports/development-epoch-closure-2026-08-07-r1.json'),
      readFile('reports/development-epoch-closure-2026-08-07-r1.md'),
    ]);
    return {report: JSON.parse(json.toString('utf8')), json, markdown};
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return buildEpochClosureArtifacts();
  }
}

test('attributes the exact 71-entry intake once and retains every workstream', async () => {
  const {report} = await loadFrozenClosure();
  assert.equal(report.git.originalEntryCount, 71);
  assert.equal(report.git.originalTrackedModifiedCount, 15);
  assert.equal(report.git.originalUntrackedCount, 56);
  assert.equal(report.git.expectedPostPublicationEntryCount, 82);
  assert.equal(report.clusters.length, 8);
  assert.equal(
    report.clusters.reduce((total, cluster) => total + cluster.entryCount, 0),
    71,
  );
  assert.equal(new Set(report.originalBindings.map(({path}) => path)).size, 71);
  assert.equal(report.attributionMethod.humanAuthorIdentityEstablished, false);
  assert.equal(report.closureImplementation.filesDeleted, 0);
});

test('binds test remediation without promoting evidence or publication', async () => {
  const {report, json, markdown} = await loadFrozenClosure();
  assert.equal(report.closureImplementation.bindings.length, 9);
  assert.equal(report.closureImplementation.immutablePredecessorsRewritten, false);
  assert.equal(report.exhaustedSearchBoundary.repeatV7V8LedgerSearchAuthorized, false);
  assert.equal(report.exhaustedSearchBoundary.missingMp3Count, 16);
  assert.equal(report.exhaustedSearchBoundary.missingKeyTermRuntimePathCount, 317);
  assert.equal(report.previewAndPublicationBoundary.privatePreviewRetained, true);
  assert.equal(report.previewAndPublicationBoundary.strictCompleteMembers, 0);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.deepEqual(JSON.parse(json.toString('utf8')), report);
  assert.match(markdown.toString('utf8'), /original dirty-worktree intake is exactly 71/u);
  assert.match(markdown.toString('utf8'), /creates no original-runtime/u);
});

test('requires one explicit non-overwriting mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /Unknown option/u);
});
