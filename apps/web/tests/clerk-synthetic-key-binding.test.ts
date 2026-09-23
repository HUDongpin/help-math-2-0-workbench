import assert from 'node:assert/strict';
import test from 'node:test';

import {buildPublishableKey} from '@clerk/shared/keys';

import {
  canonicalClerkDevelopmentFrontendHost,
  proveClerkDevelopmentKeyBinding,
  type ClerkSyntheticDomainPage,
} from '../lib/clerk-synthetic-key-binding';
import {CLERK_SYNTHETIC_ORIGIN} from '../lib/clerk-synthetic-execution';

const frontendHost = 'willing-pig-5.clerk.accounts.dev';
const publishableKey = buildPublishableKey(frontendHost);
const environment = Object.freeze({
  CLERK_SECRET_KEY: 'sk_test_synthetic-secret-form',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
});

function domainPage(
  overrides: Partial<ClerkSyntheticDomainPage> = {},
): ClerkSyntheticDomainPage {
  return {
    data: [{
      developmentOrigin: '',
      frontendApiUrl: frontendHost,
      id: 'dmn_synthetic_primary',
      isSatellite: false,
    }],
    totalCount: 1,
    ...overrides,
  };
}

test('key binding accepts one complete primary Frontend API when Clerk returns an empty development origin', async () => {
  let calls = 0;
  const fingerprint = await proveClerkDevelopmentKeyBinding({
    environment,
    listDomains: async () => {
      calls += 1;
      return domainPage();
    },
  });

  assert.equal(calls, 1);
  assert.match(fingerprint, /^[a-f0-9]{64}$/u);
});

test('key binding fails closed for mismatches, satellites, duplicates, and partial pages', async () => {
  const cases: ClerkSyntheticDomainPage[] = [
    domainPage({
      data: [{
        developmentOrigin: CLERK_SYNTHETIC_ORIGIN,
        frontendApiUrl: 'different-bird-7.clerk.accounts.dev',
        id: 'dmn_mismatch',
        isSatellite: false,
      }],
    }),
    domainPage({
      data: [{
        developmentOrigin: CLERK_SYNTHETIC_ORIGIN,
        frontendApiUrl: frontendHost,
        id: 'dmn_satellite',
        isSatellite: true,
      }],
    }),
    domainPage({
      data: [
        {
          developmentOrigin: CLERK_SYNTHETIC_ORIGIN,
          frontendApiUrl: frontendHost,
          id: 'dmn_one',
          isSatellite: false,
        },
        {
          developmentOrigin: CLERK_SYNTHETIC_ORIGIN,
          frontendApiUrl: frontendHost,
          id: 'dmn_two',
          isSatellite: false,
        },
      ],
      totalCount: 2,
    }),
    domainPage({
      data: [{
        developmentOrigin: 'http://127.0.0.1:3212',
        frontendApiUrl: frontendHost,
        id: 'dmn-other-port',
        isSatellite: false,
      }],
    }),
    domainPage({
      data: [{
        developmentOrigin: 'http://localhost:3211',
        frontendApiUrl: frontendHost,
        id: 'dmn-localhost-alias',
        isSatellite: false,
      }],
    }),
    domainPage({totalCount: 2}),
    domainPage({data: [], totalCount: 0}),
  ];

  for (const page of cases) {
    await assert.rejects(
      proveClerkDevelopmentKeyBinding({
        environment,
        listDomains: async () => page,
      }),
      /failed closed; details redacted/u,
    );
  }
});

test('key binding performs no domain request for invalid key forms', async () => {
  let calls = 0;
  for (const invalidEnvironment of [
    {...environment, CLERK_SECRET_KEY: 'sk_live_not-authorized'},
    {
      ...environment,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        publishableKey.replace(/^pk_test_/u, 'pk_live_'),
    },
    {...environment, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_invalid'},
  ]) {
    await assert.rejects(
      proveClerkDevelopmentKeyBinding({
        environment: invalidEnvironment,
        listDomains: async () => {
          calls += 1;
          return domainPage();
        },
      }),
      /failed closed/u,
    );
  }
  assert.equal(calls, 0);
});

test('frontend host canonicalization rejects alternate origins and URL material', () => {
  assert.equal(
    canonicalClerkDevelopmentFrontendHost(frontendHost),
    frontendHost,
  );
  assert.equal(
    canonicalClerkDevelopmentFrontendHost(`https://${frontendHost}`),
    frontendHost,
  );

  for (const value of [
    `http://${frontendHost}`,
    `https://${frontendHost}:443`,
    `https://${frontendHost}/path`,
    `https://${frontendHost}?query=1`,
    `https://${frontendHost}#fragment`,
    `https://user:pass@${frontendHost}`,
    'not-clerk.example.com',
  ]) assert.throws(
    () => canonicalClerkDevelopmentFrontendHost(value),
    /failed closed/u,
    value,
  );
});
