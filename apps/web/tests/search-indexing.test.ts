import assert from 'node:assert/strict';
import test from 'node:test';

import {CURRENT_JS_1751_PUBLIC_PRODUCTION as PROFILE, CURRENT_JS_1751_PUBLIC_PROJECT as PROJECT} from '../lib/current-js-1751-public-production';
import {
  INDEXABLE_PRODUCTION_HOST,
  NON_INDEXABLE_HOST_CONDITION,
  PRODUCTION_ROBOTS_DISALLOW,
  productionSearchIndexingEnabled,
  routeIndexable,
  searchIndexingAllowedForHost,
} from '../lib/search-indexing';

const production = {NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_PROJECT_ID: PROJECT, VERCEL_URL: 'helpmath-stage-example.vercel.app', HELP_MATH_1751_PUBLIC_PRODUCTION: PROFILE};

function withPublicBuildMarker(fn: () => void) {
  const key = 'HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD';
  const previous = process.env[key];
  process.env[key] = PROFILE;
  try { fn(); } finally { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; }
}

test('indexing opens only for the Vercel production deployment of the public build', () => withPublicBuildMarker(() => {
  assert.equal(productionSearchIndexingEnabled(production), true);
  for (const env of [
    {...production, VERCEL_ENV: 'preview'},
    {...production, VERCEL_ENV: 'development'},
    {...production, VERCEL_ENV: undefined, HELP_MATH_1751_PUBLIC_PRODUCTION_LOCAL: PROFILE},
    {...production, VERCEL_PROJECT_ID: 'other-project'},
    {...production, HELP_MATH_1751_PUBLIC_PRODUCTION: undefined},
    {...production, NODE_ENV: 'development'},
  ]) assert.equal(productionSearchIndexingEnabled(env), false, JSON.stringify(env));
}));

test('indexing stays closed without the public build marker', () => {
  const previous = process.env.HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD;
  delete process.env.HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD;
  try { assert.equal(productionSearchIndexingEnabled(production), false); }
  finally { if (previous !== undefined) process.env.HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD = previous; }
});

test('only www.helpmath.ai is indexable; preview, staged and apex hosts stay noindex', () => withPublicBuildMarker(() => {
  assert.equal(searchIndexingAllowedForHost(INDEXABLE_PRODUCTION_HOST, production), true);
  assert.equal(searchIndexingAllowedForHost('WWW.HELPMATH.AI', production), true);
  for (const host of ['helpmath.ai', 'helpmath-stage-example.vercel.app', 'evil.example', 'www.helpmath.ai.evil.example', '', null, undefined]) {
    assert.equal(searchIndexingAllowedForHost(host, production), false, String(host));
  }
  assert.equal(searchIndexingAllowedForHost(INDEXABLE_PRODUCTION_HOST, {...production, VERCEL_ENV: 'preview'}), false);
}));

test('the next.config host condition matches only the canonical host', () => {
  const pattern = new RegExp(NON_INDEXABLE_HOST_CONDITION[0]!.value);
  assert.equal(pattern.test('www.helpmath.ai'), true);
  for (const host of ['helpmath.ai', 'wwwxhelpmath.ai', 'x.vercel.app', 'www.helpmath.ai.evil.example']) assert.equal(pattern.test(host), false, host);
});

test('production robots keep private, auth, admin-like and API paths disallowed', () => {
  for (const path of ['/api/', '/account', '/es/account', '/sign-in', '/sign-up', '/flash-assets/', '/current-js-preview-assets/', '/reference/']) {
    assert.ok(PRODUCTION_ROBOTS_DISALLOW.includes(path), path);
  }
  assert.ok(!PRODUCTION_ROBOTS_DISALLOW.includes('/'));
});

test('draft legal pages stay out of the index until approved', () => {
  for (const route of ['/privacy', '/terms']) assert.equal(routeIndexable(route), false, route);
  for (const route of ['/', '/courses/4/3']) assert.equal(routeIndexable(route), true, route);
});
