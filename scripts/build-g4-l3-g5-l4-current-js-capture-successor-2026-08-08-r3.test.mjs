import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildCurrentJsCaptureArtifactsR3,
  parseArguments,
} from './build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.mjs';

async function currentArtifacts() {
  const generated = await buildCurrentJsCaptureArtifactsR3();
  try {
    const [json, markdown] = await Promise.all([
      readFile('reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.json'),
      readFile('reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.md'),
    ]);
    return {generated, json, markdown, report: JSON.parse(json.toString('utf8'))};
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return {generated, json: generated.json, markdown: generated.markdown, report: generated.report};
  }
}

test('preserves r2 while correcting only its rendered r6 frame-count field', async () => {
  const {report, markdown} = await currentArtifacts();
  assert.equal(report.revision, 'r3');
  assert.equal(report.correction.predecessorRenderedValue, 'undefined');
  assert.equal(report.correction.correctedRenderedValue, 547);
  assert.equal(report.correction.structuredR2EvidenceChanged, false);
  assert.equal(report.correction.r2PredecessorsRewritten, false);
  assert.equal(report.r2Predecessor.retainedByteForByte, true);
  assert.equal(report.r6CurrentVerification.verdict, 'PASS');
  assert.equal(report.r6CurrentVerification.frameCount, 547);
  assert.equal(report.r6CurrentVerification.strictComplete, false);
  assert.equal(report.r6CurrentVerification.published, false);
  assert.match(markdown.toString('utf8'), /Correct rendered count: \*\*547\*\*/u);
  assert.doesNotMatch(markdown.toString('utf8'), /undefined native/u);
});

test('retains every acceptance dimension closed and renders byte-stable output', async () => {
  const {report, generated, json, markdown} = await currentArtifacts();
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.deepEqual(JSON.parse(json.toString('utf8')), generated.report);
  assert.equal(markdown.toString('utf8'), generated.markdown.toString('utf8'));
  assert.match(markdown.toString('utf8'), /does not recalculate, refresh, or rewrite either ledger/u);
});

test('requires one explicit non-overwriting mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /unknown option/u);
});
