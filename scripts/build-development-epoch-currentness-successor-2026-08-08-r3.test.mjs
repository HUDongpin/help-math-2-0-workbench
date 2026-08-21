import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildDevelopmentEpochCurrentnessArtifactsR3,
  parseArguments,
} from './build-development-epoch-currentness-successor-2026-08-08-r3.mjs';

let cached;

async function currentArtifacts() {
  if (!cached) {
    cached = (async () => {
      const generated = await buildDevelopmentEpochCurrentnessArtifactsR3();
      try {
        const [json, markdown] = await Promise.all([
          readFile('reports/development-epoch-currentness-successor-2026-08-08-r3.json'),
          readFile('reports/development-epoch-currentness-successor-2026-08-08-r3.md'),
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

test('retains r1/r2 historical receipt facts and bounds the exact post-r2 continuation', async () => {
  const {report} = await currentArtifacts();
  assert.equal(report.revision, 'r3');
  assert.equal(report.r2Predecessor.retainedByteForByte, true);
  assert.equal(report.r2HistoricalSnapshot.originalIntakeEntryCount, 71);
  assert.equal(report.r2HistoricalSnapshot.originalIntakeByteIdenticalCount, 69);
  assert.equal(report.r2HistoricalSnapshot.remediationEntryCount, 9);
  assert.equal(report.r2HistoricalSnapshot.remediationByteIdenticalCount, 6);
  assert.equal(report.r2HistoricalSnapshot.postR1UnattributedEntryCount, 79);
  assert.equal(report.continuationWorkstreams.length, 3);
  assert.deepEqual(
    report.continuationWorkstreams.map(({id, bindings}) => [id, bindings.length]),
    [
      ['g4-g5-private-preview-rendering-correction', 4],
      ['g4-g5-strict-acceptance-handoff', 4],
      ['external-unattributed-darwin-atomic-directory-swap', 3],
    ],
  );
});

test('requires exact status membership while keeping all acceptance effects closed', async () => {
  const {report, generated, json, markdown} = await currentArtifacts();
  assert.equal(report.git.currentDirtyEntryCount, 178);
  assert.equal(report.git.trackedModified, 33);
  assert.equal(report.git.untracked, 145);
  assert.equal(report.git.stagedEntryCount, 0);
  assert.equal(report.quiescenceObservation.externalFilesTouched, false);
  assert.equal(report.quiescenceObservation.externalFileCount, 3);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.deepEqual(JSON.parse(json.toString('utf8')), generated.report);
  assert.equal(markdown.toString('utf8'), generated.markdown.toString('utf8'));
  assert.match(markdown.toString('utf8'), /external-unattributed atomic-swap files/u);
});

test('requires one explicit no-overwrite mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /unknown option/u);
});
