import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildDevelopmentEpochCurrentnessArtifactsR2,
  parseArguments,
} from './build-development-epoch-currentness-successor-2026-08-08-r2.mjs';

async function currentArtifacts() {
  const generated = await buildDevelopmentEpochCurrentnessArtifactsR2();
  try {
    const [json, markdown] = await Promise.all([
      readFile('reports/development-epoch-currentness-successor-2026-08-08-r2.json'),
      readFile('reports/development-epoch-currentness-successor-2026-08-08-r2.md'),
    ]);
    return {generated, json, markdown, report: JSON.parse(json.toString('utf8'))};
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return {
      generated,
      json: generated.json,
      markdown: generated.markdown,
      report: generated.report,
    };
  }
}

test('retains the r1 intake while recording exact currentness drift without a human attribution claim', async () => {
  const {report} = await currentArtifacts();
  assert.equal(report.artifactType, 'help-math-development-epoch-currentness-successor');
  assert.equal(report.immutablePredecessor.rewritten, false);
  assert.equal(report.immutablePredecessor.humanAuthorIdentityEstablished, false);
  assert.equal(report.r1OriginalIntake.entryCount, 71);
  assert.equal(report.r1OriginalIntake.currentness.retainedByteIdenticalCount, 69);
  assert.deepEqual(
    report.r1OriginalIntake.currentness.drifted.map(({path}) => path),
    ['apps/web/app/globals.css', 'apps/web/tests/g4-l3-whole-lesson.test.ts'],
  );
  assert.equal(report.r1Remediation.entryCount, 9);
  assert.equal(report.r1Remediation.currentness.retainedByteIdenticalCount, 6);
  assert.deepEqual(
    report.r1Remediation.currentness.drifted.map(({path}) => path),
    [
      'apps/web/proxy.ts',
      'apps/web/tests/g5-l4-executive-preview.test.ts',
      'scripts/build-development-epoch-closure-2026-08-07-r1.test.mjs',
    ],
  );
});

test('snapshots only the known post-r1 worktree while retaining every acceptance gate closed', async () => {
  const {report, generated, json, markdown} = await currentArtifacts();
  assert.equal(report.git.currentDirtyEntryCount, 163);
  assert.equal(report.git.trackedModified, 30);
  assert.equal(report.git.untracked, 133);
  assert.equal(report.postR1UnattributedWorktree.entryCount, 79);
  assert.equal(report.postR1UnattributedWorktree.humanAuthorIdentityEstablished, false);
  assert.equal(report.closedBoundaries.repeatV7V8LedgerSearchAuthorized, false);
  assert.equal(report.closedBoundaries.strictLedgerRewriteAuthorized, false);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.deepEqual(JSON.parse(json.toString('utf8')), generated.report);
  assert.equal(markdown.toString('utf8'), generated.markdown.toString('utf8'));
  assert.match(markdown.toString('utf8'), /69\/71 byte-identical/u);
  assert.match(markdown.toString('utf8'), /6\/9 byte-identical/u);
});

test('requires one explicit non-overwriting mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /unknown option/u);
});
