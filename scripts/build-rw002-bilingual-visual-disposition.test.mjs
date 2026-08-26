import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  RW002_ANIMATION_ID,
  RW002_OUTPUT,
  RW002_SOURCE_SWF_SHA256,
  SOURCE_SHARED_VISUAL_LOCALIZATION,
  buildRw002BilingualVisualDisposition,
  extractRw002FfdecScriptBlocks,
  parseArguments,
  serializeRw002BilingualVisualDisposition
} from './build-rw002-bilingual-visual-disposition.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('extracts exact RW002 FFDec script blocks without inventing missing code', () => {
  const blocks = extractRw002FfdecScriptBlocks(
    '===== A.as =====\nstop();\n\n===== B.as =====\nplay();\n'
  );
  assert.deepEqual([...blocks], [
    ['A.as', 'stop();'],
    ['B.as', 'play();']
  ]);
  assert.throws(
    () =>
      extractRw002FfdecScriptBlocks(
        '===== A.as =====\nstop();\n\n===== A.as =====\nplay();\n'
      ),
    /repeats A\.as/
  );
});

test('builds a deterministic RW002 source-shared visual disposition with every acceptance claim false', async () => {
  const report = await buildRw002BilingualVisualDisposition();
  assert.equal(report.animationId, RW002_ANIMATION_ID);
  assert.equal(report.generatedFrom.sourceSwf.sha256, RW002_SOURCE_SWF_SHA256);
  assert.equal(report.status, 'verified-source-shared-untranslated-visual');
  assert.equal(report.sourceFindings.completeChildScriptCount, 6);
  assert.deepEqual(report.sourceFindings.languageSensitiveActionScriptMatches, []);
  assert.deepEqual(report.sourceFindings.mainTimeline, {
    timelineId: 'sprite-334',
    frameCount: 1873,
    stopFrames: [673, 1873]
  });
  assert.equal(
    report.implementationDisposition.visualClassification,
    'source-shared-untranslated-visual'
  );
  assert.equal(
    report.implementationDisposition.visualLocalization,
    SOURCE_SHARED_VISUAL_LOCALIZATION
  );
  assert.deepEqual(report.implementationDisposition.languages, ['en', 'es']);
  assert.equal(report.implementationDisposition.renderSameSourceVisualForBothLanguages, true);
  assert.equal(report.implementationDisposition.translatedSpanishVisual, false);
  assert.equal(report.implementationDisposition.audioRendered, false);
  assert.equal(
    report.sourceFindings.originalHostSpanishTrack.authoritativeListeningComplete,
    false
  );
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true
  );
});

test('checked-in RW002 bilingual visual disposition is byte-for-byte reproducible', async () => {
  const current = await readFile(path.join(projectRoot, RW002_OUTPUT), 'utf8');
  const rebuilt = serializeRw002BilingualVisualDisposition(
    await buildRw002BilingualVisualDisposition()
  );
  assert.equal(current, rebuilt);
});

test('CLI accepts only the non-mutating check flag', () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(['--check']), {check: true});
  assert.throws(() => parseArguments(['--write-anywhere']), /Unknown option/);
});
