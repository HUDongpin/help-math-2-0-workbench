import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {resolveG5L4LearningEntryAvailability} from '../lib/g5-l4-learning-entry';

test('G5 L4 learner entry follows exact local-audit and showcase gates', () => {
  assert.equal(resolveG5L4LearningEntryAvailability({
    descriptorBound: true,
    developmentAudit: true,
    showcaseEnabled: false,
  }), true);
  assert.equal(resolveG5L4LearningEntryAvailability({
    descriptorBound: false,
    developmentAudit: true,
    showcaseEnabled: true,
  }), false);
  assert.equal(resolveG5L4LearningEntryAvailability({
    descriptorBound: true,
    developmentAudit: false,
    showcaseEnabled: false,
  }), false);
  assert.equal(resolveG5L4LearningEntryAvailability({
    descriptorBound: true,
    developmentAudit: false,
    showcaseEnabled: true,
  }), true);
});

test('G5 L4 server entry binds availability to the exact release gate', async () => {
  const source = await readFile(
    new URL('../lib/g5-l4-learning-entry.server.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /G5_L4_SHOWCASE_RELEASE_ID/u);
  assert.match(
    source,
    /showcaseEnabled: currentJsShowcasePublication\([\s\S]*?G5_L4_SHOWCASE_RELEASE_ID,[\s\S]*?env,[\s\S]*?\)\.enabled/u,
  );
});
