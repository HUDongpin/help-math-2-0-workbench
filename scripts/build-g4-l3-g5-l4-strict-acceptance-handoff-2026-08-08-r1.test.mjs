import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildStrictAcceptanceHandoffArtifactsR1,
  parseArguments,
} from './build-g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.mjs';

let cachedArtifacts;

async function currentArtifacts() {
  if (!cachedArtifacts) {
    cachedArtifacts = (async () => {
      const generated = await buildStrictAcceptanceHandoffArtifactsR1();
      try {
        const [json, markdown] = await Promise.all([
          readFile('reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.json'),
          readFile('reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.md'),
        ]);
        return {generated, json, markdown, report: JSON.parse(json.toString('utf8'))};
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
        return {generated, json: generated.json, markdown: generated.markdown, report: generated.report};
      }
    })();
  }
  return cachedArtifacts;
}

test('maps both atomic lessons without converting current-JS evidence into strict acceptance', async () => {
  const {report} = await currentArtifacts();
  assert.equal(report.currentJavascriptCapture.frameCount, 547);
  assert.equal(report.currentJavascriptCapture.currentJavascriptEvidenceOnly, true);
  assert.equal(report.lessons.g4Lesson3.release.expectedMembers, 40);
  assert.equal(report.lessons.g4Lesson3.release.strictCompleteMembers, 0);
  assert.equal(report.lessons.g5Lesson4.release.expectedMembers, 55);
  assert.equal(report.lessons.g5Lesson4.release.strictCompleteMembers, 0);
  assert.deepEqual(
    report.lessons.g5Lesson4.runtimeBoundary.missingDeclaredDependencies,
    ['L4KTE01.xml', 'L4KTS01.xml'],
  );
  assert.equal(report.strictLedgerCurrentness.verdict, 'UNEVALUATED_STALE_CHECKED_IN_LEDGER_DO_NOT_INFER_STRICT_ZERO');
  assert.equal(report.strictLedgerCurrentness.ledgerBytesCurrent, false);
});

test('makes the required authority sequence explicit while keeping every acceptance gate closed', async () => {
  const {report, generated, json, markdown} = await currentArtifacts();
  assert.equal(report.nextAuthorityRequired.exactOriginalRuntimeSessionAuthorization, true);
  assert.equal(report.nextAuthorityRequired.namedHumanOperator, true);
  assert.equal(report.nextAuthorityRequired.namedHumanVisualReview, true);
  assert.equal(report.nextAuthorityRequired.ownerOrAuthorizedRepresentativeDecision, true);
  assert.equal(report.nextAuthorityRequired.externalProductionTrustAdapterForPublication, true);
  assert.equal(report.acceptanceEffects.currentJavascriptEvidence, true);
  assert.equal(
    Object.entries(report.acceptanceEffects)
      .filter(([name]) => name !== 'currentJavascriptEvidence')
      .every(([, value]) => value === false),
    true,
  );
  assert.deepEqual(JSON.parse(json.toString('utf8')), generated.report);
  assert.equal(markdown.toString('utf8'), generated.markdown.toString('utf8'));
  assert.match(markdown.toString('utf8'), /do not infer a strict PASS/u);
  assert.match(markdown.toString('utf8'), /This handoff creates no authorization/u);
});

test('requires one explicit no-overwrite mode', () => {
  assert.deepEqual(parseArguments(['--write-no-clobber']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.deepEqual(parseArguments(['--json']), {mode: 'json'});
  assert.throws(() => parseArguments([]), /exactly one mode/u);
  assert.throws(() => parseArguments(['--write-no-clobber', '--check']), /exactly one mode/u);
  assert.throws(() => parseArguments(['--apply']), /unknown option/u);
});
