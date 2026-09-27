import assert from 'node:assert/strict';
import {afterEach, describe, it} from 'node:test';
import {POST} from '../app/api/contact/route';
import {
  buildContactEmail,
  DEVELOPMENT_TURNSTILE_TOKEN,
} from '../lib/contact-route-support.server';
import {contactRequestSchema} from '../lib/contact-schema';

const envKeys = [
  'NODE_ENV',
  'CONTACT_FORM_ENABLED',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'RESEND_API_KEY',
  'SUPPORT_TO_EMAIL',
  'SUPPORT_FROM_EMAIL',
] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

function setEnv(key: (typeof envKeys)[number], value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

function enableContactForm() {
  setEnv('CONTACT_FORM_ENABLED', 'true');
  setEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key');
  setEnv('TURNSTILE_SECRET_KEY', 'test-turnstile-secret');
  setEnv('RESEND_API_KEY', 're_test_key');
  setEnv('SUPPORT_TO_EMAIL', 'team@example.org');
  setEnv('SUPPORT_FROM_EMAIL', 'HELP Math <support@example.org>');
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    locale: 'en',
    role: 'educator',
    name: 'Ada Lovelace',
    email: 'ada@example.org',
    organization: 'Example School',
    topic: 'support',
    message: 'I need help opening a public demonstration.',
    privacyConsent: true,
    turnstileToken: 'verified-token',
    website: '',
    ...overrides,
  };
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://www.helpmath.ai/api/contact', {
    method: 'POST',
    headers: {'content-type': 'application/json', ...headers},
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  for (const key of envKeys) {
    setEnv(key, originalEnv[key]);
  }
  globalThis.fetch = originalFetch;
});

describe('POST /api/contact', () => {
  it('addresses email to support and sets Reply-To to the validated sender', () => {
    const email = buildContactEmail(
      contactRequestSchema.parse(validRequest()),
      'HELP Math <support@helpmath.ai>',
      'team@helpmath.ai',
    );
    assert.deepEqual(email.to, ['team@helpmath.ai']);
    assert.equal(email.replyTo, 'ada@example.org');
    assert.doesNotMatch(email.text, /verified-token|turnstile/i);
  });

  it('returns the same structured error envelope for malformed JSON', async () => {
    enableContactForm();
    const response = await POST(request('{not json'));
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'BAD_REQUEST');
    assert.equal(typeof body.error.message, 'string');
  });

  it('returns field errors for invalid submissions', async () => {
    enableContactForm();
    const response = await POST(request(validRequest({email: 'not-an-email'})));
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.fieldErrors.email);
  });

  it('fails closed before body parsing or provider delivery unless the feature flag is exact true', async () => {
    enableContactForm();
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls += 1;
      throw new Error('provider must not be called');
    };

    for (const value of [undefined, 'false', 'TRUE', ' true ']) {
      setEnv('CONTACT_FORM_ENABLED', value);
      const response = await POST(request('{not json'));
      const body = await response.json();
      assert.equal(response.status, 503);
      assert.equal(body.ok, false);
      assert.equal(body.error.code, 'CONTACT_DISABLED');
      assert.equal(body.error.message, 'Contact submission is not available.');
    }
    assert.equal(providerCalls, 0);
  });

  it('fails closed before body parsing or provider delivery when any configuration is missing', async () => {
    const requiredConfiguration = [
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
      'RESEND_API_KEY',
      'SUPPORT_TO_EMAIL',
      'SUPPORT_FROM_EMAIL',
    ] as const;
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls += 1;
      throw new Error('provider must not be called');
    };

    for (const key of requiredConfiguration) {
      enableContactForm();
      setEnv(key, undefined);
      const response = await POST(request('{not json'));
      const body = await response.json();
      assert.equal(response.status, 503, key);
      assert.equal(body.error.code, 'CONTACT_DISABLED', key);
    }
    enableContactForm();
    setEnv('RESEND_API_KEY', '   ');
    const whitespaceResponse = await POST(request('{not json'));
    assert.equal(whitespaceResponse.status, 503);
    assert.equal((await whitespaceResponse.json()).error.code, 'CONTACT_DISABLED');
    assert.equal(providerCalls, 0);
  });

  it('quietly accepts and discards honeypot submissions without provider delivery when enabled', async () => {
    enableContactForm();
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls += 1;
      throw new Error('provider must not be called');
    };
    const response = await POST(request(validRequest({website: 'https://bot.example'})));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {ok: true});
    assert.equal(providerCalls, 0);
  });

  it('fails closed when the exact flag is true but Turnstile is not configured', async () => {
    enableContactForm();
    setEnv('TURNSTILE_SECRET_KEY', undefined);
    const response = await POST(request(validRequest()));
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, 'CONTACT_DISABLED');
  });

  it('does not let the local-development simulation bypass complete configuration', async () => {
    setEnv('NODE_ENV', 'development');
    enableContactForm();
    setEnv('TURNSTILE_SECRET_KEY', undefined);
    const response = await POST(
      request(validRequest({turnstileToken: DEVELOPMENT_TURNSTILE_TOKEN})),
    );
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, 'CONTACT_DISABLED');
  });

  it('rejects a failed Turnstile verification before email delivery', async () => {
    setEnv('NODE_ENV', 'production');
    enableContactForm();
    globalThis.fetch = async () => Response.json({success: false});

    const response = await POST(
      request(validRequest(), {'x-forwarded-for': '203.0.113.8, 10.0.0.1'}),
    );
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.error.code, 'TURNSTILE_FAILED');
  });

  it('rejects a successful token issued for a different Turnstile action', async () => {
    setEnv('NODE_ENV', 'production');
    enableContactForm();
    globalThis.fetch = async () => Response.json({success: true, action: 'login'});

    const response = await POST(request(validRequest()));
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.error.code, 'TURNSTILE_FAILED');
  });

  it('preserves the enabled Turnstile and Resend delivery flow only for exact true', async () => {
    setEnv('NODE_ENV', 'production');
    enableContactForm();
    let verificationBody = '';
    let deliveryBody = '';
    let providerCalls = 0;
    globalThis.fetch = async (input, init) => {
      providerCalls += 1;
      if (String(input) === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
        verificationBody = String(init?.body);
        return Response.json({success: true, action: 'contact'});
      }
      assert.equal(String(input), 'https://api.resend.com/emails');
      deliveryBody = String(init?.body);
      return Response.json({id: 'test-message-id'});
    };

    const response = await POST(
      request(validRequest(), {'x-forwarded-for': '203.0.113.8, 10.0.0.1'}),
    );
    const body = await response.json();
    assert.match(verificationBody, /remoteip=203\.0\.113\.8/);
    assert.match(verificationBody, /response=verified-token/);
    assert.equal(response.status, 200);
    assert.deepEqual(body, {ok: true});
    assert.equal(providerCalls, 2);
    assert.match(deliveryBody, /I need help opening a public demonstration\./);
    assert.doesNotMatch(deliveryBody, /verified-token|test-turnstile-secret/);
  });
});
