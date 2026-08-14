import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_L3_SHOWCASE_RELEASE_ID,
  currentJsShowcasePublication,
} from '../lib/current-js-showcase-publication';

test('showcase publication fails closed without the exact opt-in', () => {
  assert.equal(currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {}).enabled, false);
  assert.equal(currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: '1',
  }).enabled, false);
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
  assert.equal(currentJsShowcasePublication('lesson-g05-l04', {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }).enabled, false);
});
