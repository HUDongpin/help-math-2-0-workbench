import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('216 browser QA is an atomic, hash-bound, checkable receipt', async () => {
  const source = await readFile(new URL(
    './qa-g678-current-js-216-browser.mjs', import.meta.url), 'utf8');
  assert.match(source, /\.staging-\$\{process\.pid\}/u);
  assert.match(source, /await rename\(stage, outputAbsolute\)/u);
  assert.match(source, /chromiumExecutable/u);
  assert.match(source, /productionIsolation/u);
  assert.match(source, /exactLessonVector/u);
  assert.match(source, /registeredPageSum: 216/u);
  assert.match(source, /cacheControl === 'private, no-store, max-age=0'/u);
  assert.match(source, /assetResponses\[0\]\.url === expectedAssetUrl/u);
  assert.match(source, /screenshot\.sha256/u);
  assert.match(source, /args\[0\] === '--check'/u);
  assert.match(source, /G678 browser QA base must be one loopback HTTP origin/u);
  assert.match(source, /JSON\.stringify\(evidence\.allLessons\.exactLessonVector\)/u);
  assert.match(source, /response\.url === expectedAssetUrl/u);
  assert.match(source, /expectedScreenshotPaths/u);
});

