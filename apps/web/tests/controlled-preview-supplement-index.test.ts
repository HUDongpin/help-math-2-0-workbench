import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import supplement from '../config/current-js-controlled-preview-supplement.v1.json';
import {controlledPreviewSupplementRecord} from '../lib/controlled-current-js-preview';
import {
  buildSupplementIndex,
  INDEX_PATH,
  serializeSupplementIndex,
  SUPPLEMENT_PATH,
} from '../scripts/controlled-preview-supplement-index.mjs';

function legacyRecord(segments: readonly string[]) {
  const assetPath = segments.join('/');
  return supplement.entries.find((record) => record.assetPath === assetPath);
}

function decision(record: {assetPath: string; releaseId: string} | undefined) {
  return record ? {assetPath: record.assetPath, releaseId: record.releaseId} : undefined;
}

test('the committed index is exactly what the generator produces from the supplement', async () => {
  const expected = serializeSupplementIndex(buildSupplementIndex(await readFile(SUPPLEMENT_PATH)));
  assert.equal(await readFile(INDEX_PATH, 'utf8'), expected, 'run node scripts/controlled-preview-supplement-index.mjs');
});

test('every supplement path gets the identical gating decision as the full-manifest lookup', () => {
  assert.equal(supplement.entries.length, 18987);
  for (const {assetPath} of supplement.entries) {
    const segments = assetPath.split('/');
    assert.deepEqual(decision(controlledPreviewSupplementRecord(segments)), decision(legacyRecord(segments)), assetPath);
  }
});

test('paths outside the supplement are rejected by both lookups', () => {
  const known = supplement.entries[0]!.assetPath;
  const directory = known.slice(0, known.lastIndexOf('/'));
  const negatives = [
    '',
    'courses',
    directory,
    `${directory}/`,
    `${directory}/missing.js`,
    `${known}/`,
    `${known}.map`,
    known.toUpperCase(),
    `/${known}`,
    known.replace('courses/', 'courses//'),
    `${directory}/../${known.slice(known.lastIndexOf('/') + 1)}`,
    'courses/course-g99-l99-vb-999/index.html',
    'constructor',
    '__proto__/x',
    'hasOwnProperty',
  ];
  for (const assetPath of negatives) {
    const segments = assetPath.split('/');
    assert.equal(legacyRecord(segments), undefined, `legacy ${assetPath}`);
    assert.equal(controlledPreviewSupplementRecord(segments), undefined, `index ${assetPath}`);
  }
});
