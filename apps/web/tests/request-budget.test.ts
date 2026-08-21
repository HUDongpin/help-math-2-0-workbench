import assert from 'node:assert/strict';
import test, {afterEach} from 'node:test';

import {
  DEFAULT_LRS_REQUESTS_PER_MINUTE,
  DEFAULT_NOVA_REQUESTS_PER_MINUTE,
  consumeRequestBudget,
  requestClientIp,
  resetRequestBudgetsForTests,
} from '../lib/request-budget.server';

afterEach(resetRequestBudgetsForTests);

function request(headers: Record<string, string> = {}) {
  return new Request('https://www.helpmath.ai/api/nova', {headers});
}

test('request budget extracts only the first Vercel or forwarded IP', () => {
  assert.equal(requestClientIp(request({
    'x-vercel-forwarded-for': '203.0.113.8, 198.51.100.9',
    'x-forwarded-for': '198.51.100.10',
  })), '203.0.113.8');
  assert.equal(requestClientIp(request({
    'x-forwarded-for': '2001:0db8:0:0:0:0:0:1, 198.51.100.10',
  })), '2001:db8::1');
  assert.equal(requestClientIp(request({
    'x-vercel-forwarded-for': 'not-an-ip, 203.0.113.8',
    'x-forwarded-for': '203.0.113.9',
  })), null);
  assert.equal(requestClientIp(request()), null);
});

test('request budgets use 12/minute for Nova and 120/minute for LRS by default', () => {
  assert.equal(DEFAULT_NOVA_REQUESTS_PER_MINUTE, 12);
  assert.equal(DEFAULT_LRS_REQUESTS_PER_MINUTE, 120);
  const client = request({'x-vercel-forwarded-for': '203.0.113.18'});
  for (let index = 0; index < DEFAULT_NOVA_REQUESTS_PER_MINUTE; index += 1) {
    assert.deepEqual(consumeRequestBudget({request: client, scope: 'nova', now: 1_000}), {
      allowed: true,
    });
  }
  assert.deepEqual(consumeRequestBudget({request: client, scope: 'nova', now: 1_000}), {
    allowed: false,
    retryAfterSeconds: 59,
  });

  for (let index = 0; index < DEFAULT_LRS_REQUESTS_PER_MINUTE; index += 1) {
    assert.equal(consumeRequestBudget({request: client, scope: 'lrs', now: 1_000}).allowed, true);
  }
  assert.equal(consumeRequestBudget({request: client, scope: 'lrs', now: 1_000}).allowed, false);
});

test('unknown clients share a limited bucket and invalid overrides fail to defaults', () => {
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    NOVA_TUTOR_RATE_LIMIT_PER_MINUTE: '1',
  };
  assert.deepEqual(consumeRequestBudget({
    request: request(),
    scope: 'nova',
    environment,
    now: 5_000,
  }), {allowed: true});
  assert.deepEqual(consumeRequestBudget({
    request: request({'x-vercel-forwarded-for': 'invalid'}),
    scope: 'nova',
    environment,
    now: 5_000,
  }), {allowed: false, retryAfterSeconds: 55});

  resetRequestBudgetsForTests();
  const invalidEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    NOVA_TUTOR_RATE_LIMIT_PER_MINUTE: '0',
  };
  for (let index = 0; index < DEFAULT_NOVA_REQUESTS_PER_MINUTE; index += 1) {
    assert.equal(consumeRequestBudget({
      request: request(),
      scope: 'nova',
      environment: invalidEnvironment,
      now: 5_000,
    }).allowed, true);
  }
  assert.equal(consumeRequestBudget({
    request: request(),
    scope: 'nova',
    environment: invalidEnvironment,
    now: 5_000,
  }).allowed, false);
});
