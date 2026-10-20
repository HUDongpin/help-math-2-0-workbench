import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest, type NextFetchEvent} from 'next/server';

import {createProxy} from '../proxy';

const localAuthEnvironment = {
  CLERK_LOCAL_AUTH_ENABLED: 'true',
  CLERK_LOCAL_AUTH_ORIGIN: 'http://127.0.0.1:3000/',
  CLERK_SECRET_KEY: 'sk_test_synthetic',
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('synthetic.clerk.accounts.dev$').toString('base64')}`,
};

function withEnvironment(values: Record<string, string>, run: () => Promise<void>) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  return run().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const event = {waitUntil() {}} as unknown as NextFetchEvent;
const failingLoader = async () => {
  throw new Error('clerk unavailable');
};

for (const path of ['/', '/sign-in', '/api/auth/session']) {
  test(`Clerk path ${path} is denied when the Clerk proxy fails to load`, async () => {
    await withEnvironment(localAuthEnvironment, async () => {
      const response = await createProxy(failingLoader)(
        new NextRequest(`http://127.0.0.1:3000${path}`),
        event,
      );
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('x-middleware-next'), null);
      assert.equal(response.headers.get('x-middleware-rewrite'), null);
    });
  });
}

test('non-Clerk requests never load the Clerk proxy', async () => {
  const response = await createProxy(failingLoader)(new NextRequest('http://127.0.0.1:3000/privacy'), event);
  assert.notEqual(response.status, 404);
});
