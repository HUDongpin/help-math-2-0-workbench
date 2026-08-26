import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G3_L2_SHOWCASE_RELEASE_ID,
  G4_L3_SHOWCASE_RELEASE_ID,
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

test('the G4 L3 opt-in is a non-production local-audit gate only', () => {
  const publication = currentJsShowcasePublication(G4_L3_SHOWCASE_RELEASE_ID, {
    NODE_ENV: 'test',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  });
  assert.deepEqual({...publication}, {
    enabled: true,
    profile: 'candidate',
    previewApproved: false,
    productionApproved: false,
    releaseId: G4_L3_SHOWCASE_RELEASE_ID,
    scope: 'current-javascript-showcase',
    strictReleaseExpanded: false,
  });
  assert.equal(currentJsShowcasePublication(G5_L4_SHOWCASE_RELEASE_ID, {
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  }).enabled, false);
});

test('G5 L4 uses its own exact non-production local-audit opt-in', () => {
  const publication = currentJsShowcasePublication(
    G5_L4_SHOWCASE_RELEASE_ID,
    {NODE_ENV: 'test', CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true'},
  );
  assert.deepEqual({...publication}, {
    enabled: true,
    profile: 'candidate',
    previewApproved: false,
    productionApproved: false,
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

test('candidate lesson flags cannot expand the production release manifest', () => {
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
      enabled: false,
      profile: 'unavailable',
      previewApproved: false,
      productionApproved: false,
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
    assert.equal(candidate.profile, 'candidate');
    assert.equal(candidate.productionApproved, false);
  }
});

test('legacy flags and asset-profile membership cannot open production', () => {
  const cases = [
    [G3_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED'],
    [G4_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED'],
    [G4_L5_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L5_ENABLED'],
    [G4_L10_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L10_ENABLED'],
    [G4_L11_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L11_ENABLED'],
    [G5_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED'],
    [G5_L4_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L4_ENABLED'],
    [G5_L5_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED'],
  ] as const;
  for (const [releaseId, environmentKey] of cases) {
    const publication = currentJsShowcasePublication(releaseId, {
      NODE_ENV: 'production',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      [environmentKey]: 'true',
    });
    assert.deepEqual({...publication}, {
      enabled: false,
      profile: 'unavailable',
      previewApproved: false,
      productionApproved: false,
      releaseId,
      scope: 'current-javascript-showcase',
      strictReleaseExpanded: false,
    });
  }
});

test('a Vercel Preview selects only manifest Preview authority', () => {
  const cases = [
    [G3_L2_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED'],
    [G4_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED'],
    [G4_L5_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L5_ENABLED'],
    [G4_L10_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L10_ENABLED'],
    [G4_L11_PAGE_ONLY_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G4_L11_ENABLED'],
    [G5_L3_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED'],
    [G5_L4_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L4_ENABLED'],
    [G5_L5_SHOWCASE_RELEASE_ID, 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED'],
  ] as const;
  for (const [releaseId, environmentKey] of cases) {
    const publication = currentJsShowcasePublication(releaseId, {
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      [environmentKey]: 'true',
    });
    assert.deepEqual({...publication}, {
      enabled: false,
      profile: 'unavailable',
      previewApproved: false,
      productionApproved: false,
      releaseId,
      scope: 'current-javascript-showcase',
      strictReleaseExpanded: false,
    });
  }
});
