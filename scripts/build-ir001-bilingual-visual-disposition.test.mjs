import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  IR001_ANIMATION_ID,
  IR001_OUTPUT,
  IR001_SOURCE_SWF_SHA256,
  buildIr001BilingualVisualDisposition,
  extractFfdecScriptBlocks,
  parseArguments,
  serializeIr001BilingualVisualDisposition
} from './build-ir001-bilingual-visual-disposition.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('extracts exact FFDec script blocks without inventing missing code', () => {
  const blocks = extractFfdecScriptBlocks(
    '===== A.as =====\nstop();\n\n===== B.as =====\nplay();\n'
  );
  assert.deepEqual([...blocks], [
    ['A.as', 'stop();'],
    ['B.as', 'play();']
  ]);
});

test('builds a deterministic source-shared visual disposition with every strict claim false', async () => {
  const report = await buildIr001BilingualVisualDisposition();
  assert.equal(report.animationId, IR001_ANIMATION_ID);
  assert.equal(report.generatedFrom.sourceSwf.sha256, IR001_SOURCE_SWF_SHA256);
  assert.equal(report.status, 'verified-source-shared-untranslated-visual');
  assert.equal(
    report.implementationDisposition.visualClassification,
    'source-shared-untranslated-visual'
  );
  assert.equal(report.implementationDisposition.renderSameSourceVisualForBothLanguages, true);
  assert.equal(report.implementationDisposition.audioRendered, false);
  assert.deepEqual(report.sourceFindings.languageSensitiveActionScriptMatches, []);
  assert.deepEqual(
    report.sourceFindings.soundTimelineClaims.map(
      ({timelineId, nativeStageIntersection}) => ({timelineId, nativeStageIntersection})
    ),
    [
      {timelineId: 'sprite-7', nativeStageIntersection: false},
      {timelineId: 'sprite-8', nativeStageIntersection: false}
    ]
  );
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true
  );
});

test('checked-in IR001 bilingual visual disposition is byte-for-byte reproducible', async () => {
  const current = await readFile(path.join(projectRoot, IR001_OUTPUT), 'utf8');
  const rebuilt = serializeIr001BilingualVisualDisposition(
    await buildIr001BilingualVisualDisposition()
  );
  assert.equal(current, rebuilt);
});

test('CLI accepts only the non-mutating check flag', () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(['--check']), {check: true});
  assert.throws(() => parseArguments(['--write-anywhere']), /Unknown option/);
});
