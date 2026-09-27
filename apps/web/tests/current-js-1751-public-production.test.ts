import assert from 'node:assert/strict';
import test from 'node:test';
import {CURRENT_JS_1751_PUBLIC_PRODUCTION as PROFILE, CURRENT_JS_1751_PUBLIC_PROJECT as PROJECT, public1751BuildRequested, public1751EnvironmentAllowed, isPublic1751Production, public1751RequestAllowed} from '../lib/current-js-1751-public-production';
import {CONTROLLED_CURRENT_JS_PREVIEW, controlledPreviewRequestAllowed, isControlledCurrentJsPreview} from '../lib/controlled-current-js-preview';
import program from '../config/current-js-controlled-preview.v1.json';
const staged = 'helpmath-stage-example.vercel.app';
const production = {NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_PROJECT_ID: PROJECT, VERCEL_URL: staged, HELP_MATH_1751_PUBLIC_PRODUCTION: PROFILE};
function withBuildFlags(fn: () => void) {
  const keys = ['HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD', 'HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD'] as const;
  const previous = keys.map((key) => process.env[key]);
  process.env[keys[0]] = PROFILE;
  process.env[keys[1]] = CONTROLLED_CURRENT_JS_PREVIEW;
  try { fn(); } finally { keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; }); }
}

test('public production requires its exact opt-in and project environment', () => {
  assert.equal(public1751BuildRequested(production), true);
  assert.equal(public1751BuildRequested({...production, HELP_MATH_1751_PUBLIC_PRODUCTION: 'true'}), false);
  assert.equal(public1751EnvironmentAllowed(production), true);
  for (const env of [{...production, NODE_ENV: 'development'}, {...production, VERCEL_ENV: 'preview'}, {...production, VERCEL_PROJECT_ID: 'different-project'}, {...production, VERCEL_ENV: undefined}]) assert.equal(public1751EnvironmentAllowed(env), false);
});

test('runtime admission requires the production build marker and runtime opt-in', () => withBuildFlags(() => {
  assert.equal(isPublic1751Production(production), true);
  assert.equal(isControlledCurrentJsPreview(production), true);
  assert.equal(isPublic1751Production({...production, HELP_MATH_1751_PUBLIC_PRODUCTION: undefined}), false);
  process.env.HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD = '';
  assert.equal(isPublic1751Production(production), false);
  assert.equal(isControlledCurrentJsPreview(production), false);
}));

test('public requests admit only HTTPS production domains or the bound staged deployment', () => withBuildFlags(() => {
  for (const host of ['helpmath.ai', 'www.helpmath.ai', staged]) {
    const url = new URL(`https://${host}/courses/4/11?mode=focus`);
    assert.equal(public1751RequestAllowed(url, host, production), true);
    assert.equal(controlledPreviewRequestAllowed(url, host, production), true);
  }
  for (const url of ['https://other.example/courses/4/11', 'https://helpmath.ai.evil.example/', 'https://other.vercel.app/', 'http://helpmath.ai/', 'https://helpmath.ai:444/', 'https://user:password@helpmath.ai/']) {
    const parsed = new URL(url); assert.equal(public1751RequestAllowed(parsed, parsed.host, production), false, url);
  }
  assert.equal(public1751RequestAllowed(new URL('https://helpmath.ai/'), 'www.helpmath.ai', production), false);
  assert.equal(public1751RequestAllowed(new URL('https://helpmath.ai/'), null, production), false);
}));

test('preview mode still rejects production aliases and production mode without the new opt-in', () => withBuildFlags(() => {
  const preview = {NODE_ENV: 'production', VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: PROJECT, VERCEL_URL: staged};
  assert.equal(controlledPreviewRequestAllowed(new URL(`https://${staged}/`), staged, preview), true);
  for (const host of ['helpmath.ai', 'www.helpmath.ai']) {
    assert.equal(controlledPreviewRequestAllowed(new URL(`https://${host}/`), host, preview), false);
    assert.equal(controlledPreviewRequestAllowed(new URL(`https://${host}/`), host, {...production, HELP_MATH_1751_PUBLIC_PRODUCTION: undefined}), false);
  }
}));

test('local production verification is loopback-only and cannot override provider project checks', () => withBuildFlags(() => {
  const local = {...production, VERCEL_ENV: undefined, VERCEL_PROJECT_ID: undefined, HELP_MATH_1751_PUBLIC_PRODUCTION_LOCAL: PROFILE};
  assert.equal(public1751EnvironmentAllowed(local), true);
  assert.equal(public1751RequestAllowed(new URL('http://localhost:3370/'), '127.0.0.1:3370', local), true);
  assert.equal(public1751RequestAllowed(new URL('http://localhost:3370/'), 'localhost:3371', local), false);
  assert.equal(public1751RequestAllowed(new URL('https://helpmath.ai/'), 'helpmath.ai', local), false);
  assert.equal(public1751EnvironmentAllowed({...local, VERCEL_ENV: 'production', VERCEL_PROJECT_ID: 'other'}), false);
}));

test('public serving keeps the exact course scope and does not manufacture acceptance', () => {
  assert.equal(program.courses.length, 29);
  assert.equal(program.courses.reduce((n, c) => n + c.pageCount, 0), 1751);
  assert.equal(Object.values(program.authority).some(Boolean), false);
});
