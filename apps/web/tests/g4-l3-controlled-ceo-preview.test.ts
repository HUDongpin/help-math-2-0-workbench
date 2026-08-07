import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  EXECUTIVE_PREVIEW_COOKIE_NAME,
  createExecutivePreviewSession,
  getExecutivePreviewConfig,
} from '../lib/executive-preview-access';
import {
  G4_L3_CONTROLLED_CEO_PREVIEW_BOUNDARY,
  G4_L3_CONTROLLED_CEO_PREVIEW_COPY,
  isG4L3ControlledCeoPreviewEnabled,
  isG4L3ControlledCeoPreviewMember,
} from '../lib/g4-l3-controlled-ceo-preview';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';
import proxy from '../proxy';

const configuredEnvironment = {
  EXECUTIVE_PREVIEW_ENABLED: 'true',
  EXECUTIVE_PREVIEW_ACCESS_KEY: 'ExecutivePreviewAccessKey_2026_August_JohnRamo',
  EXECUTIVE_PREVIEW_SESSION_SECRET: 'ExecutivePreviewSessionSecret_2026_August_HELP',
  EXECUTIVE_PREVIEW_EXPIRES_AT: '2026-08-20T15:59:00.000Z',
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
} as const;

async function withEnvironment<T>(
  values: Record<string, string | undefined>,
  callback: () => Promise<T> | T,
) {
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

async function authorizedRequest(pathname: string) {
  const config = getExecutivePreviewConfig(configuredEnvironment, Date.parse('2026-08-07T00:00:00Z'));
  assert(config);
  const token = await createExecutivePreviewSession(config, Date.parse('2026-08-07T00:00:00Z'));
  return new NextRequest(`https://www.helpmath.ai${pathname}`, {
    headers: {cookie: `${EXECUTIVE_PREVIEW_COOKIE_NAME}=${token}`},
  });
}

test('G4 L3 preview opens only when the unified timed executive review is configured', async () => {
  await withEnvironment({
    ...configuredEnvironment,
    EXECUTIVE_PREVIEW_ENABLED: undefined,
  }, () => {
    assert.equal(isG4L3ControlledCeoPreviewEnabled(), false);
  });
  await withEnvironment(configuredEnvironment, () => {
    assert.equal(isG4L3ControlledCeoPreviewEnabled(), true);
  });
});

test('preview membership is exactly 39 active pages plus the course shell', () => {
  const members = [
    ...G4_L3_LESSON.pages.map((page) => page.animationId),
    G4_L3_LESSON.shellAnimationId,
  ];
  assert.equal(members.length, 40);
  assert.equal(new Set(members).size, 40);
  assert(members.every(isG4L3ControlledCeoPreviewMember));
  assert.equal(isG4L3ControlledCeoPreviewMember('course-g04-l03-historical-nonmember'), false);
  assert.equal(isG4L3ControlledCeoPreviewMember('course-g05-l04-rw-002'), false);
});

test('preview boundary copy and machine-readable authority state remain fail-closed', async () => {
  assert.match(G4_L3_CONTROLLED_CEO_PREVIEW_COPY, /current JavaScript candidate/u);
  assert.deepEqual(G4_L3_CONTROLLED_CEO_PREVIEW_BOUNDARY, {
    previewId: 'g4-l3',
    releaseId: 'lesson-g04-l03-negative-numbers',
    activePages: 39,
    courseShells: 1,
    releaseMembers: 40,
    strictCompleteMembers: 0,
    originalRuntimeFullFrameComparison: 'pending',
    humanAudioVisualReview: 'pending',
    ownerAcceptance: 'pending',
    strictCompletion: false,
    publicRelease: false,
  });
  const source = await readFile(
    new URL('../components/g4-l3-controlled-ceo-preview-boundary.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /data-strict-completion/u);
  assert.match(source, /data-public-release/u);
  assert.match(source, /current-JS candidate · not strict · unpublished/u);
});

test('proxy redirects an unauthenticated G4 lesson and admits a signed private session', async () => {
  await withEnvironment(configuredEnvironment, async () => {
    const blocked = await proxy(new NextRequest('https://www.helpmath.ai/courses/4/3'));
    assert.equal(blocked.status, 307);
    assert.equal(blocked.headers.get('location'), 'https://www.helpmath.ai/executive-preview');

    const admitted = await proxy(await authorizedRequest('/courses/4/3'));
    assert.equal(admitted.status, 200);
    assert.equal(admitted.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(
      admitted.headers.get('x-robots-tag'),
      'noindex, nofollow, noarchive, noimageindex',
    );
    assert.equal(
      admitted.headers.get('x-helpmath-controlled-preview'),
      'executive-preview',
    );
  });
});
