import assert from 'node:assert/strict';
import test from 'node:test';

import {matchPrototype} from '../src/prototype-manifest';
import {
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS
} from '../src/timelines/generated/shell-course-g04-l03-additional-domain-assets';
import {
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS
} from '../src/timelines/generated/shell-course-g04-l03-single-frame-domain-assets';

const nestedPilots = [
  ['course-g03-l01-ts-008', 'sprite-348', 747],
  ['course-g03-l01-vb-004', 'sprite-231', 222],
  ['course-g03-l06-fq-002-review', 'sprite-1168', 82],
  ['course-g03-l06-ti-001', 'sprite-21', 142],
  ['course-g04-l01-ir-001', 'sprite-58', 142],
  ['course-g04-l03-in-009', 'sprite-200', 637],
  ['course-g04-l09-gs-002', 'sprite-787', 653],
  ['course-g05-l13-rw-002', 'sprite-334', 1873]
] as const;

test('nested pilot runtimes preserve the ten-frame root and declare their local capture domain', () => {
  for (const [animationId, domainId, localFrameCount] of nestedPilots) {
    const entry = matchPrototype({animationId});
    assert.ok(entry, animationId);
    assert.equal(entry.runtime.frameCount, 10, `${animationId}: root frame count`);
    assert.equal(entry.runtime.defaultFrameDomain, domainId, `${animationId}: default domain`);
    assert.deepEqual(entry.runtime.frameDomains, [
      {id: domainId, frameCount: localFrameCount, rootFrame: 6}
    ]);
    assert.equal(
      entry.movie.frameCount,
      localFrameCount,
      `${animationId}: legacy renderer remains on its local timeline`
    );
  }
});

test('root-only pilots require no compatibility domain declaration', () => {
  for (const animationId of [
    'formula-elementary-conversion-01-02',
    'keyterm-elementary-acute-angle',
    'shell-course-g04-l01-index-local'
  ]) {
    const entry = matchPrototype({animationId});
    assert.ok(entry, animationId);
    assert.equal(entry.runtime.defaultFrameDomain, undefined);
    assert.equal(entry.runtime.frameDomains, undefined);
    assert.equal(entry.runtime.frameCount, entry.movie.frameCount);
  }
});

test('G4 L3 shell preserves its 50-frame root and declares all structural nested domains', () => {
  const entry = matchPrototype({animationId: 'shell-course-g04-l03-index-local'});
  assert.ok(entry);
  assert.equal(entry.runtime.frameCount, 50);
  assert.equal(entry.runtime.defaultFrameDomain, 'root');
  assert.deepEqual(entry.runtime.frameDomains, [
    {id: 'sprite-1011', frameCount: 48, rootFrame: 50},
    {id: 'sprite-132', frameCount: 100, rootFrame: 1},
    {id: 'sprite-302', frameCount: 149, rootFrame: 49},
    {id: 'sprite-327', frameCount: 132, rootFrame: 49},
    {id: 'sprite-528', frameCount: 871, rootFrame: 49},
    ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => ({
      id,
      frameCount: COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].frameCount,
      rootFrame: COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].rootFrame
    })),
    ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => ({
      id,
      frameCount: 1,
      rootFrame: COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id].rootFrame
    }))
  ]);
  assert.equal(entry.movie.frameCount, 50);
});

test('RE01 preserves its 55-frame root while declaring the assessment sprite at root frame 51', () => {
  const entry = matchPrototype({animationId: 'course-g03-l08-re-001'});
  assert.ok(entry);
  assert.equal(entry.runtime.frameCount, 55);
  assert.equal(entry.runtime.defaultFrameDomain, 'root');
  assert.deepEqual(entry.runtime.frameDomains, [
    {id: 'sprite-621', frameCount: 27, rootFrame: 51}
  ]);
  assert.equal(entry.movie.frameCount, 55);
});
