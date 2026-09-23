import assert from 'node:assert/strict';
import test from 'node:test';

import {isAuthEnabled, isProductionSsoAuthEnabled} from '../lib/local-auth-access';

const productionKeys = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'true',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_synthetic',
  CLERK_SECRET_KEY: 'sk_live_synthetic',
};

test('production SSO stays closed without every exact opt-in and key form', () => {
  for (const environment of [
    productionKeys,
    {...productionKeys, CLERK_PRODUCTION_SSO_ENABLED: 'TRUE'},
    {...productionKeys, CLERK_PRODUCTION_SSO_ENABLED: 'true', CLERK_SECRET_KEY: 'sk_test_synthetic'},
    {...productionKeys, CLERK_PRODUCTION_SSO_ENABLED: 'true', NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: 'false'},
    {...productionKeys, CLERK_PRODUCTION_SSO_ENABLED: 'true', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_synthetic'},
  ]) {
    assert.equal(isProductionSsoAuthEnabled(environment), false);
    assert.equal(isAuthEnabled(environment), false);
  }
  assert.equal(isProductionSsoAuthEnabled({
    ...productionKeys,
    CLERK_PRODUCTION_SSO_ENABLED: 'true',
  }), true);
});
