import assert from 'node:assert/strict';
import test from 'node:test';

import {hasAnimationModule, loadAnimationModule, registeredAnimationKeys} from '../src/animation-registry';

test('generated registry lazily resolves the legacy pilot modules', async () => {
  assert.deepEqual([...registeredAnimationKeys].sort(), [...registeredAnimationKeys]);
  for (const key of [
    'conversion-1-1',
    'conversion-1-2',
    'conversion-1-3',
    'conversion-1-4',
    'course-g03-l01-ts-008',
    'course-g03-l01-vb-004',
    'course-g03-l06-fq-002-review',
    'course-g03-l06-ti-001',
    'course-g03-l08-re-001',
    'course-g04-l01-ir-001',
    'course-g04-l03-in-009',
    'course-g04-l09-gs-002',
    'course-g05-l13-rw-002',
    'keyterm-elementary-acute-angle',
    'keyterm-elementary-computeghgh',
    'shell-course-g04-l01-index-local',
    'shell-course-g04-l03-index-local'
  ]) {
    assert.equal(hasAnimationModule(key), true, `${key} must be registered`);
  }
  assert.equal(hasAnimationModule('conversion-1-2'), true);
  assert.equal(hasAnimationModule('not-a-module'), false);
  const gallon = await loadAnimationModule('conversion-1-2');
  assert.equal(gallon?.key, 'conversion-1-2');
  assert.equal(gallon?.maturity, 'legacy-prototype');
  assert.equal(gallon?.audioTracks?.length, 2);
  assert.match(gallon?.audioTracks?.[0]?.source ?? '', /^\/flash-assets\/audio\/formulas\/conversion-1-2\/en\.mp3$/);

  const liter = await loadAnimationModule('conversion-1-4');
  assert.equal(liter?.audioTracks?.length, 2);
  assert.equal(liter?.audioTracks?.[1]?.language, 'es');

  const acuteAngle = await loadAnimationModule('keyterm-elementary-acute-angle');
  assert.equal(acuteAngle?.key, 'keyterm-elementary-acute-angle');
  assert.equal(acuteAngle?.maturity, 'legacy-prototype');
  assert.deepEqual(acuteAngle?.scenarios.map(({id}) => id), ['default']);

  const computeghgh = await loadAnimationModule('keyterm-elementary-computeghgh');
  assert.equal(computeghgh?.key, 'keyterm-elementary-computeghgh');
  assert.equal(computeghgh?.maturity, 'legacy-prototype');
  assert.deepEqual(computeghgh?.scenarios.map(({id}) => id), ['default']);

  const review = await loadAnimationModule('course-g03-l08-re-001');
  assert.equal(review?.key, 'course-g03-l08-re-001');
  assert.equal(review?.movie.frameCount, 55);
  assert.equal(review?.playbackEndFrame, 51);
  assert.equal(review?.maturity, 'legacy-prototype');

  const vocabulary = await loadAnimationModule('course-g03-l01-vb-004');
  assert.equal(vocabulary?.key, 'course-g03-l01-vb-004');
  assert.equal(vocabulary?.movie.frameCount, 222);
  assert.equal(vocabulary?.playbackEndFrame, 56);
  assert.equal(vocabulary?.maturity, 'legacy-prototype');

  const practiceTest = await loadAnimationModule('course-g03-l01-ts-008');
  assert.equal(practiceTest?.key, 'course-g03-l01-ts-008');
  assert.equal(practiceTest?.movie.frameCount, 747);
  assert.equal(practiceTest?.playbackEndFrame, 295);
  assert.equal(practiceTest?.maturity, 'legacy-prototype');

  const tryIt = await loadAnimationModule('course-g03-l06-ti-001');
  assert.equal(tryIt?.key, 'course-g03-l06-ti-001');
  assert.equal(tryIt?.movie.frameCount, 142);
  assert.deepEqual(tryIt?.scenarios.map(({id}) => id), [
    'sound-from-seed',
    'sound-0',
    'sound-1',
    'root-standalone'
  ]);
  assert.equal(tryIt?.maturity, 'legacy-prototype');

  const finalQuizReview = await loadAnimationModule('course-g03-l06-fq-002-review');
  assert.equal(finalQuizReview?.key, 'course-g03-l06-fq-002-review');
  assert.equal(finalQuizReview?.movie.frameCount, 82);
  assert.equal(finalQuizReview?.playbackEndFrame, 1);
  assert.equal(finalQuizReview?.maturity, 'legacy-prototype');

  const introduction = await loadAnimationModule('course-g04-l01-ir-001');
  assert.equal(introduction?.key, 'course-g04-l01-ir-001');
  assert.equal(introduction?.movie.frameCount, 142);
  assert.deepEqual(introduction?.scenarios.map(({id}) => id), [
    'sound-from-seed',
    'sound-0',
    'sound-1',
    'root-standalone'
  ]);
  assert.equal(introduction?.maturity, 'legacy-prototype');

  const geometryWorld = await loadAnimationModule('course-g05-l13-rw-002');
  assert.equal(geometryWorld?.key, 'course-g05-l13-rw-002');
  assert.equal(geometryWorld?.movie.frameCount, 1873);
  assert.equal(geometryWorld?.playbackEndFrame, 673);
  assert.equal(geometryWorld?.maturity, 'legacy-prototype');

  const equationGame = await loadAnimationModule('course-g04-l09-gs-002');
  assert.equal(equationGame?.key, 'course-g04-l09-gs-002');
  assert.equal(equationGame?.movie.frameCount, 653);
  assert.equal(equationGame?.playbackEndFrame, 641);
  assert.equal(equationGame?.maturity, 'legacy-prototype');
  assert.equal(await loadAnimationModule('not-a-module'), undefined);
});
