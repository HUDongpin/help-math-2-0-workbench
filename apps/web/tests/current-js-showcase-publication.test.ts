import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G3_L1_SHOWCASE_RELEASE_ID,
  G3_L3_SHOWCASE_RELEASE_ID,
  G3_L4_SHOWCASE_RELEASE_ID,
  G3_L2_SHOWCASE_RELEASE_ID,
  G3_L5_SHOWCASE_RELEASE_ID,
  G3_L6_SHOWCASE_RELEASE_ID,
  G3_L8_SHOWCASE_RELEASE_ID,
  G3_L9_SHOWCASE_RELEASE_ID,
  G4_L3_SHOWCASE_RELEASE_ID,
  G4_L1_SHOWCASE_RELEASE_ID,
  G4_L2_SHOWCASE_RELEASE_ID,
  G4_L4_SHOWCASE_RELEASE_ID,
  G4_L6_SHOWCASE_RELEASE_ID,
  G4_L7_SHOWCASE_RELEASE_ID,
  G4_L8_SHOWCASE_RELEASE_ID,
  G4_L9_SHOWCASE_RELEASE_ID,
  G4_L12_SHOWCASE_RELEASE_ID,
  G5_L1_SHOWCASE_RELEASE_ID,
  G5_L2_SHOWCASE_RELEASE_ID,
  G5_L6_SHOWCASE_RELEASE_ID,
  G5_L7_SHOWCASE_RELEASE_ID,
  G5_L8_SHOWCASE_RELEASE_ID,
  G5_L13_SHOWCASE_RELEASE_ID,
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
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
    [G3_L1_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L1_ENABLED'],
    [G3_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L3_ENABLED'],
    [G3_L4_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L4_ENABLED'],
    [G3_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED'],
    [G3_L5_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L5_ENABLED'],
    [G3_L6_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L6_ENABLED'],
    [G3_L8_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L8_ENABLED'],
    [G3_L9_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L9_ENABLED'],
    [G5_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED'],
    [G5_L5_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED'],
    [G4_L1_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L1_ENABLED'],
    [G4_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L2_ENABLED'],
    [G4_L4_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L4_ENABLED'],
    [G4_L6_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L6_ENABLED'],
    [G4_L7_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L7_ENABLED'],
    [G4_L8_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L8_ENABLED'],
    [G4_L9_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L9_ENABLED'],
    [G4_L12_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L12_ENABLED'],
    [G5_L1_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L1_ENABLED'],
    [G5_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L2_ENABLED'],
    [G5_L6_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L6_ENABLED'],
    [G5_L7_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L7_ENABLED'],
    [G5_L8_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L8_ENABLED'],
    [G5_L13_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L13_ENABLED'],
  ] as const;

  for (const [releaseId, environmentKey] of cases) {
    assert.equal(currentJsShowcasePublication(releaseId, {}).enabled, false);
    assert.equal(currentJsShowcasePublication(releaseId, {
      [environmentKey]: '1',
    }).enabled, false);
    const enabledEnv = releaseId === G3_L1_SHOWCASE_RELEASE_ID
      || releaseId === G3_L3_SHOWCASE_RELEASE_ID
      || releaseId === G3_L4_SHOWCASE_RELEASE_ID
      || releaseId === G3_L5_SHOWCASE_RELEASE_ID
      || releaseId === G3_L6_SHOWCASE_RELEASE_ID
      || releaseId === G3_L8_SHOWCASE_RELEASE_ID
      || releaseId === G3_L9_SHOWCASE_RELEASE_ID
      || releaseId === G4_L1_SHOWCASE_RELEASE_ID
      || releaseId === G4_L2_SHOWCASE_RELEASE_ID
      || releaseId === G4_L4_SHOWCASE_RELEASE_ID
      || releaseId === G4_L6_SHOWCASE_RELEASE_ID
      || releaseId === G4_L7_SHOWCASE_RELEASE_ID
      || releaseId === G4_L8_SHOWCASE_RELEASE_ID
      || releaseId === G4_L9_SHOWCASE_RELEASE_ID
      || releaseId === G4_L12_SHOWCASE_RELEASE_ID
      || releaseId === G5_L1_SHOWCASE_RELEASE_ID
      || releaseId === G5_L2_SHOWCASE_RELEASE_ID
      || releaseId === G5_L6_SHOWCASE_RELEASE_ID
      || releaseId === G5_L7_SHOWCASE_RELEASE_ID
      || releaseId === G5_L8_SHOWCASE_RELEASE_ID
      || releaseId === G5_L13_SHOWCASE_RELEASE_ID
      ? {
          NODE_ENV: 'development',
          CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
          [environmentKey]: 'true',
        }
      : {[environmentKey]: 'true'};
    assert.equal(currentJsShowcasePublication(releaseId, enabledEnv).enabled, true);
  }
});

test('the opt-in is narrow to the G4 L3 release and never expands strict release', () => {
  const publication = currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  });
  assert.deepEqual({...publication}, {
    enabled: true,
    profile: 'production',
    productionApproved: true,
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
    profile: 'production',
    productionApproved: true,
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

test('the three completed G4 lessons use exact production opt-ins', () => {
  const cases = [
    [G4_L5_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L5_ENABLED'],
    [G4_L10_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L10_ENABLED'],
    [G4_L11_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L11_ENABLED'],
  ] as const;
  for (const [releaseId, environmentKey] of cases) {
    const production = currentJsShowcasePublication(releaseId, {
      NODE_ENV: 'production',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      [environmentKey]: 'true',
    });
    assert.deepEqual({...production}, {
      enabled: true,
      profile: 'production',
      productionApproved: true,
      releaseId,
      scope: 'current-javascript-showcase',
      strictReleaseExpanded: false,
    });
    const candidate = currentJsShowcasePublication(releaseId, {
      NODE_ENV: 'development',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      [environmentKey]: 'true',
    });
    assert.equal(candidate.enabled, true);
    assert.equal(candidate.profile, 'production');
    assert.equal(candidate.productionApproved, true);
  }
});
