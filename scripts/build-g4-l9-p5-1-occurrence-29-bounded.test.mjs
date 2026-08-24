import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
  ANIMATION_ID,
  buildGeneratedArtifacts,
  CALIBRATION_ID,
  EXPECTED_CORE_ACTION_MULTISET_SHA256,
  EXPECTED_DRAG_BINDINGS,
  EXPECTED_GLOSSARY_HANDLER_INTENTS,
  EXPECTED_HOST_SYMBOLS,
  EXPECTED_RANDOM_ACTION_SHA256,
  EXPECTED_SOURCE_CLOSURE_SHA256,
  EXPECTED_TERMINAL_ACTION_SHA256,
  FREEZE_PATH,
  SUCCESSOR_LEDGER_PATH,
} from './build-g4-l9-p5-1-occurrence-29-bounded.mjs';

const sourceRoot = process.env.HELP_MATH_P5_1_SOURCE_ROOT ??
  '/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES';

test('freezes exact occurrence 29, its five-file closure, and 42-action core', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  assert.equal(ANIMATION_ID, 'course-g04-l09-ti-004');
  assert.equal(CALIBRATION_ID, 'g4-l9-p5-1-occurrence-29-bounded-v1');
  assert.equal(built.artifacts.size, 14);
  assert.equal(built.audioCopy.bytes, 135744);
  assert.equal(built.analysis.closure.fileCount, 5);
  assert.equal(built.analysis.closure.totalBytes, 984291);
  assert.equal(built.analysis.closure.projection.bytes, 552);
  assert.equal(
    built.analysis.closure.projection.sha256,
    EXPECTED_SOURCE_CLOSURE_SHA256,
  );
  assert.equal(built.analysis.actions29.actionCount, 54);
  assert.equal(built.analysis.actions29.glossaryActionCount, 12);
  assert.equal(built.analysis.actions29.coreActionCount, 42);
  assert.equal(built.analysis.actions29.coreActionProjectionBytes, 2730);
  assert.equal(
    built.analysis.actions29.coreActionMultisetSha256,
    EXPECTED_CORE_ACTION_MULTISET_SHA256,
  );
});

test('keeps occurrence 29 behavior source-distinct from 20, 30, and 32', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  for (const comparison of Object.values(built.analysis.coreComparisons)) {
    assert.notEqual(
      built.analysis.actions29.coreActionMultisetSha256,
      comparison.sha256,
    );
  }
  assert.equal(built.analysis.randomActionSha256, EXPECTED_RANDOM_ACTION_SHA256);
  assert.equal(
    built.analysis.terminalActionSha256,
    EXPECTED_TERMINAL_ACTION_SHA256,
  );
  assert.deepEqual(built.config.randomCycle, {
    adapter: 'rndAudio-source-array-seeded-cycle-v1',
    sourceChoices: ['S1', 'S2', 'S3', 'S4'],
    actionSha256: EXPECTED_RANDOM_ACTION_SHA256,
    terminalActionSha256: EXPECTED_TERMINAL_ACTION_SHA256,
    terminalCorrectCount: 4,
  });
  assert.equal(built.config.randomQuestionAdapter, undefined);
});

test('freezes exact drag, glossary, host, and machine-audio identities', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  assert.deepEqual(
    built.config.dragBindings,
    EXPECTED_DRAG_BINDINGS,
  );
  assert.deepEqual(
    built.config.glossaryHandlers.map(({sourceIntent}) => sourceIntent),
    EXPECTED_GLOSSARY_HANDLER_INTENTS,
  );
  assert.equal(built.config.glossaryHandlers.length, 12);
  assert.equal(built.analysis.glossary.entries.length, 5);
  assert.deepEqual(
    built.config.glossaryHandlers.filter(
      ({resolution}) => resolution === 'explicit-source-bound-alias',
    ),
    [{
      handlerIndex: 2,
      sourceIntent: 'Mathematical aentence',
      resolvedKeyAttribute: 'Sentence',
      entryId: 'sentence',
      resolution: 'explicit-source-bound-alias',
    }],
  );
  assert.deepEqual(built.config.hostContractSymbols, EXPECTED_HOST_SYMBOLS);
  assert.equal(built.config.hostContractSymbols.length, 20);
  assert.equal(built.config.audio.durationMs, 9696);
  assert.equal(built.analysis.sourceAudio.fullDecode, 'pass');
  assert.equal(built.analysis.sourceAudio.listeningAcceptance, 'not-established');
});

test('corrects remaining lanes without rewriting P5 or widening authority', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  const freeze = JSON.parse(String(built.artifacts.get(FREEZE_PATH)));
  const successor = JSON.parse(String(built.artifacts.get(SUCCESSOR_LEDGER_PATH)));
  assert.deepEqual(freeze.productBoundary.formalCounts, {
    denominator: 1751,
    occurrences: 426,
    uniqueRenderers: 425,
    lessons: 8,
  });
  assert.deepEqual({
    registered: freeze.productBoundary.registeredCurrentJs,
    unavailable: freeze.productBoundary.unavailablePageCount,
    factoryAdmitted: freeze.productBoundary.factoryAdmitted,
    factoryRemaining: freeze.productBoundary.remainingFactory,
    advancedAdmitted: freeze.productBoundary.advancedManualAdmitted,
    advancedRemaining: freeze.productBoundary.remainingAdvancedManual,
  }, {
    registered: 16,
    unavailable: 27,
    factoryAdmitted: 5,
    factoryRemaining: 22,
    advancedAdmitted: 11,
    advancedRemaining: 5,
  });
  assert.equal(successor.correction.staleP5Value, 7);
  assert.equal(successor.correction.correctedAfterP5, 6);
  assert.equal(successor.rows.length, 43);
  assert.equal(successor.rows.filter(({admitted}) => admitted).length, 16);
  assert.equal(successor.scaleOut.nextP6Authorized, false);
  assert.equal(freeze.scaleOut.decision, 'NO_GO_F08_FAMILY_OR_43_PAGE_SCALE_OUT');
  assert.equal(freeze.acceptanceEffects.privateCurrentJsEngineering, true);
  for (const [gate, value] of Object.entries(freeze.acceptanceEffects)) {
    if (gate !== 'privateCurrentJsEngineering') assert.equal(value, false, gate);
  }
});
