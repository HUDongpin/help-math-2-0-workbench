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
  EXPECTED_SOURCE_CLOSURE_SHA256,
  FREEZE_PATH,
} from './build-g4-l9-p5-f08-occurrence-32-stress.mjs';

const sourceRoot = process.env.HELP_MATH_P5_SOURCE_ROOT ??
  '/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES';

test('freezes exact occurrence 32 identity, five-file closure, and source action projection', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  assert.equal(ANIMATION_ID, 'course-g04-l09-ti-007');
  assert.equal(CALIBRATION_ID, 'g4-l9-p5-f08-occurrence-32-stress-v1');
  assert.equal(built.artifacts.size, 13);
  assert.equal(built.audioCopy.bytes, 303072);
  assert.equal(
    built.analysis.closure.projection.sha256,
    EXPECTED_SOURCE_CLOSURE_SHA256,
  );
  assert.deepEqual(
    [built.analysis.actions30.coreActionCount, built.analysis.actions32.coreActionCount],
    [44, 44],
  );
  assert.equal(
    built.analysis.actions30.coreActionMultisetSha256,
    EXPECTED_CORE_ACTION_MULTISET_SHA256,
  );
  assert.equal(
    built.analysis.actions32.coreActionMultisetSha256,
    EXPECTED_CORE_ACTION_MULTISET_SHA256,
  );
  assert.deepEqual(
    built.analysis.actions30.coreActionHashes,
    built.analysis.actions32.coreActionHashes,
  );
});

test('freezes the distinct TI007 drag, glossary, host, random, and exact-audio configuration', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  assert.deepEqual(
    built.config.dragBindings,
    EXPECTED_DRAG_BINDINGS,
  );
  assert.deepEqual(
    built.config.glossaryHandlers.map(({sourceIntent}) => sourceIntent),
    EXPECTED_GLOSSARY_HANDLER_INTENTS,
  );
  assert.equal(built.config.glossaryHandlers.length, 19);
  assert.equal(built.analysis.glossary.entries.length, 16);
  assert.deepEqual(built.config.hostContractSymbols, EXPECTED_HOST_SYMBOLS);
  assert.equal(
    built.config.randomQuestionAdapter,
    'doGetRndQuest-maintained-seeded-order-v1',
  );
  assert.equal(
    built.analysis.doGetRndQuestActionSha256,
    'db8a3a2aec5f0c23868957362286b415273eee106a344589aae10b567e8418dc',
  );
  assert.equal(built.config.audio.durationMs, 21648);
  assert.equal(built.analysis.sourceAudio.fullDecode, 'pass');
  assert.equal(built.analysis.sourceAudio.listeningAcceptance, 'not-established');
});

test('keeps exact-equivalence, scale-out, network, and all independent acceptance gates closed', async () => {
  const built = await buildGeneratedArtifacts({sourceRoot});
  const freeze = JSON.parse(String(built.artifacts.get(FREEZE_PATH)));
  assert.deepEqual(freeze.productBoundary.formalCounts, {
    denominator: 1751,
    occurrences: 426,
    uniqueRenderers: 425,
    lessons: 8,
  });
  assert.equal(freeze.productBoundary.registeredCurrentJs, 15);
  assert.equal(freeze.productBoundary.unavailablePageCount, 28);
  assert.equal(freeze.productBoundary.courseShellCount, 0);
  assert.deepEqual(freeze.scaleOut, {
    exactEquivalenceAdmission: false,
    wholeLesson43Pages: false,
    familyF08: false,
    remainingF08Occurrences: [20, 29],
    decision: 'NO_GO_F08_FAMILY_OR_43_PAGE_SCALE_OUT',
  });
  assert.equal(freeze.acceptanceEffects.privateCurrentJsEngineering, true);
  for (const [gate, value] of Object.entries(freeze.acceptanceEffects)) {
    if (gate !== 'privateCurrentJsEngineering') assert.equal(value, false, gate);
  }
  for (const [relative, content] of built.artifacts) {
    if (relative.endsWith('.json') || relative.endsWith('.js')) {
      assert.doesNotMatch(String(content), /fetch\s*\(|XMLHttpRequest|sendBeacon/u);
    }
  }
});
