import assert from 'node:assert/strict';
import test from 'node:test';

import {loadLrsConfig} from '../lib/lrs-config.server';

function enabledEnvironment(
  overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    LRS_ENABLED: 'true',
    LRS_ENDPOINT: 'https://lrs.example.test/xapi',
    LRS_USERNAME: 'test-user',
    LRS_PASSWORD: 'test-password',
    LRS_ACTOR_HMAC_SECRET: 'test-only-hmac-secret-that-is-at-least-32-bytes',
    ...overrides,
  };
}

test('LRS config uses the exact explicit variable names and normalizes the endpoint', () => {
  const result = loadLrsConfig(enabledEnvironment());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.config.endpoint, 'https://lrs.example.test/xapi/');
  assert.equal(result.config.xapiVersion, '1.0.3');
  assert.equal(result.config.requestTimeoutMs, 8_000);
});

test('LRS config rejects aliases, insecure URLs, URL credentials, and unsupported versions', () => {
  assert.deepEqual(loadLrsConfig({
    NODE_ENV: 'test',
    LRS_ENABLED: 'true',
    LRS_ENDPOINT: 'https://lrs.example.test/xapi/',
    LRS_KEY: 'not-an-accepted-alias',
    LRS_SECRET: 'not-an-accepted-alias',
    LRS_ACTOR_HMAC_SECRET: 'test-only-hmac-secret-that-is-at-least-32-bytes',
  }), {ok: false, reason: 'missing-credentials'});
  assert.deepEqual(loadLrsConfig(enabledEnvironment({
    LRS_ENDPOINT: 'http://lrs.example.test/xapi/',
  })), {ok: false, reason: 'invalid-endpoint'});
  assert.deepEqual(loadLrsConfig(enabledEnvironment({
    LRS_ENDPOINT: 'https://user:password@lrs.example.test/xapi/',
  })), {ok: false, reason: 'invalid-endpoint'});
  assert.deepEqual(loadLrsConfig(enabledEnvironment({
    LRS_XAPI_VERSION: '2.0.0',
  })), {ok: false, reason: 'invalid-version'});
});
