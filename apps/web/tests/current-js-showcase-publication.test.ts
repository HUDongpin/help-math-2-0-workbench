import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G3_L2_SHOWCASE_RELEASE_ID,
  G4_L3_SHOWCASE_RELEASE_ID,
  G5_L3_SHOWCASE_RELEASE_ID,
  G5_L4_SHOWCASE_RELEASE_ID,
  G5_L5_SHOWCASE_RELEASE_ID,
  currentJsShowcasePublication,
} from '../lib/current-js-showcase-publication';

test('showcase publication fails closed without the exact opt-in', () => {
  assert.equal(currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {}).enabled, false);
  assert.equal(currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: '1',
  }).enabled, false);
  assert.equal(currentJsShowcasePublication(G5_L4_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G5_L4_ENABLED: '1',
  }).enabled, false);
});

test('each additional page-complete lesson requires its own exact opt-in', () => {
  const cases = [
    [G3_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED'],
    [G5_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED'],
    [G5_L5_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED'],
  ] as const;

  for (const [releaseId, environmentKey] of cases) {
    assert.equal(currentJsShowcasePublication(releaseId, {}).enabled, false);
    assert.equal(currentJsShowcasePublication(releaseId, {
      [environmentKey]: '1',
    }).enabled, false);
    assert.equal(currentJsShowcasePublication(releaseId, {
      [environmentKey]: 'true',
    }).enabled, true);
  }
});

test('the opt-in is narrow to the G4 L3 release and never expands strict release', () => {
  const publication = currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  });
  assert.deepEqual({...publication}, {
    enabled: true,
    releaseId: G4_L3_SHOWCASE_RELEASE_ID,
    scope: 'current-javascript-showcase',
    strictReleaseExpanded: false,
  });
  assert.equal(currentJsShowcasePublication(G5_L4_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }).enabled, false);
});

test('G5 L4 uses its own exact opt-in and never expands strict release', () => {
  const publication = currentJsShowcasePublication(
    G5_L4_SHOWCASE_RELEASE_ID,
    {CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true'},
  );
  assert.deepEqual({...publication}, {
    enabled: true,
    releaseId: G5_L4_SHOWCASE_RELEASE_ID,
    scope: 'current-javascript-showcase',
    strictReleaseExpanded: false,
  });
  assert.equal(currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
  }).enabled, false);
  assert.equal(currentJsShowcasePublication('lesson-g05-l04', {
    CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
  }).enabled, false);
});
