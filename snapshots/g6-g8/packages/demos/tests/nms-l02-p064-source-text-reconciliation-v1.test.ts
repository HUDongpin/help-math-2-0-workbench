import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P064_PRESENTATION_DATA as presentation} from '../src/nms-l02-p064-presentation-data-v1';

const report = JSON.parse(readFileSync(new URL(
  '../../../migrations/shared-nms002-l02-p064/audit/source-text-reconciliation-v1.json',
  import.meta.url), 'utf8'));

test('P064 source text audit binds every rendered prompt and option without claiming acceptance', () => {
  assert.equal(report.kind, 'g678-p064-source-text-reconciliation-v1');
  assert.equal(report.sourceSwfSha256, presentation.sourceSwfSha256);
  assert.equal(report.sourceCatalogContentSha256,
    'd9d57bde0ffb65d6e1adbf40e8fdae7e0c2cd7f6460d718f4e35c7742fa052ea');
  assert.equal(report.prompts.length, 35);
  assert.equal(report.options.length, 140);
  assert.deepEqual(report.prompts.filter((row: {disposition: string}) => row.disposition !== 'exact')
    .map((row: {questionId: number}) => row.questionId), [7, 9, 20, 21, 26]);
  assert.deepEqual(report.prompts.filter((row: {separateFraction: unknown}) => row.separateFraction)
    .map((row: {questionId: number; separateFraction: {sourceTextId: string}}) =>
      [row.questionId, row.separateFraction.sourceTextId]),
  [[7, 'character-150'], [20, 'character-335'], [21, 'character-348']]);
  for (const prompt of report.prompts) {
    assert.equal(prompt.candidateText, presentation.questions[prompt.questionId - 1].prompt);
    assert.match(prompt.sourceTextId, /^character-\d+$/);
    assert.match(prompt.sourceTagSha256, /^[a-f0-9]{64}$/);
  }
  for (const option of report.options) {
    const candidate = presentation.questions[option.questionId - 1].options['ABCD'.indexOf(option.letter)];
    assert.ok(candidate);
    assert.equal(option.sourceOptionSpriteId, candidate.sourceSpriteId);
    assert.match(option.sourceLetterTagSha256, /^[a-f0-9]{64}$/);
    if (option.kind === 'source-text') assert.equal(option.candidateValue, candidate.value);
    else {
      assert.equal(option.kind, 'source-vector-candidate');
      assert.equal(option.altCandidate, candidate.pictureAlt);
      assert.equal(option.sourceGraphics.length, 2);
    }
  }
  assert.equal(report.options.filter((row: {kind: string}) => row.kind === 'source-text').length, 124);
  assert.equal(report.options.filter((row: {kind: string}) => row.kind === 'source-vector-candidate').length, 16);
  assert.equal(report.claims.runtimeVisibilityEstablished, false);
  assert.equal(report.claims.originalRuntimeObserved, false);
  assert.equal(report.claims.semanticAndBilingualAcceptance, false);
  assert.equal(report.claims.typographyHostIntegration, false);
  assert.equal(report.claims.audioAcceptance, false);
  assert.deepEqual(report.unresolvedSourceRiskKinds, [
    'actionscript-visibility-and-values-not-interpreted',
    'button-runtime-state-and-actions-not-interpreted',
    'dynamic-text-runtime-value-unresolved',
    'shape-text-unclassified',
  ]);
});
