import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildDevelopmentEpochCurrentnessArtifactsR4,
  parseArguments,
} from './build-development-epoch-currentness-successor-2026-08-08-r4.mjs';

let cached;

async function currentArtifacts() {
  if (!cached) {
    cached = (async () => {
      const generated = await buildDevelopmentEpochCurrentnessArtifactsR4();
      try {
        const [json, markdown] = await Promise.all([
          readFile('reports/development-epoch-currentness-successor-2026-08-08-r4.json'),
          readFile('reports/development-epoch-currentness-successor-2026-08-08-r4.md'),
        ]);
        return {generated, json, markdown, report: JSON.parse(json.toString('utf8'))};
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
        return {generated, json: generated.json, markdown: generated.markdown, report: generated.report};
      }
    })();
  }
  return cached;
}

test('retains r1/r2 history while preserving r3 only as an output-absent attempt', async () => {
  const {report} = await currentArtifacts();
  assert.equal(report.revision, 'r4');
  assert.equal(report.r2Predecessor.retainedByteForByte, true);
  assert.equal(report.r2HistoricalSnapshot.originalIntakeEntryCount, 71);
  assert.equal(report.r2HistoricalSnapshot.originalIntakeByteIdenticalCount, 69);
  assert.equal(report.r2HistoricalSnapshot.remediationEntryCount, 9);
  assert.equal(report.r2HistoricalSnapshot.remediationByteIdenticalCount, 6);
  assert.equal(report.r2HistoricalSnapshot.postR1UnattributedEntryCount, 79);
  assert.equal(report.r3Attempt.sourceBindings.length, 2);
  assert.equal(report.r3Attempt.outputsAbsentAtR4Issuance, true);
  assert.equal(report.r3Attempt.usedAsPredecessor, false);
});

test('requires the exact current scope and separately hash-binds external workstreams', async () => {
  const {report} = await currentArtifacts();
  assert.equal(report.git.currentDirtyEntryCount, 186);
  assert.equal(report.git.trackedModified, 35);
  assert.equal(report.git.untracked, 151);
  assert.equal(report.git.stagedEntryCount, 0);
  assert.equal(report.quiescenceObservation.externalFileCount, 9);
  assert.equal(report.quiescenceObservation.externalFilesTouched, false);
  assert.deepEqual(
    report.continuationWorkstreams.map(({id, bindings}) => [id, bindings.length]),
    [
      ['g4-g5-private-preview-rendering-correction', 4],
      ['g4-g5-strict-acceptance-handoff', 4],
      ['r3-development-epoch-attempt-retained-without-output', 2],
      ['external-unattributed-darwin-atomic-directory-swap', 3],
      ['external-unattributed-fla-swf-counterpart-baseline', 4],
      ['external-unattributed-fidelity-governance-amendment', 2],
    ],
  );
  assert.equal(
    report.continuationWorkstreams
      .filter(({id}) => id.startsWith('external-unattributed-'))
      .every(({humanAuthorIdentityEstablished}) => humanAuthorIdentityEstablished === false),
    true,
  );
});

test('serializes cleanly and keeps every acceptance effect closed', async () => {
  const {report, generated, json, markdown} = await currentArtifacts();
  assert.deepEqual(JSON.parse(json.toString('utf8')), generated.report);
  assert.equal(markdown.toString('utf8'), generated.markdown.toString('utf8'));
  assert.match(markdown.toString('utf8'), /r3 is retained only as an output-absent attempt/u);
  assert.equal(Object.values(report.acceptanceEffects).every((value) => value === false), true);
});

test('requires one explicit no-overwrite mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /unknown option/u);
});
