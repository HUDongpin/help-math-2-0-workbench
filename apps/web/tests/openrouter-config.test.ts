import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  DEFAULT_OPENROUTER_BASE_URL,
  OpenRouterConfigurationError,
  buildOpenRouterHeaders,
  readOpenRouterConfig,
} from '../lib/openrouter.server';

const testKey = 'sk-or-v1-test-only-key-1234567890';

describe('shared OpenRouter server configuration', () => {
  it('reads one server-only credential and optional non-personal app attribution', () => {
    const config = readOpenRouterConfig({
      OPENROUTER_API_KEY: testKey,
      OPENROUTER_BASE_URL: `${DEFAULT_OPENROUTER_BASE_URL}/`,
      OPENROUTER_HTTP_REFERER: 'https://www.helpmath.ai',
      OPENROUTER_APP_TITLE: 'HELP Math 2.0',
    });
    assert.deepEqual(config, {
      apiKey: testKey,
      appTitle: 'HELP Math 2.0',
      baseUrl: DEFAULT_OPENROUTER_BASE_URL,
      httpReferer: 'https://www.helpmath.ai',
    });
    assert.deepEqual(buildOpenRouterHeaders(config), {
      authorization: `Bearer ${testKey}`,
      accept: 'application/json',
      'content-type': 'application/json',
      'HTTP-Referer': 'https://www.helpmath.ai',
      'X-OpenRouter-Title': 'HELP Math 2.0',
    });
  });

  it('omits public app-attribution headers unless deliberately configured', () => {
    const config = readOpenRouterConfig({OPENROUTER_API_KEY: testKey});
    const headers = buildOpenRouterHeaders(config);
    assert.equal(config.baseUrl, DEFAULT_OPENROUTER_BASE_URL);
    assert.equal('HTTP-Referer' in headers, false);
    assert.equal('X-OpenRouter-Title' in headers, false);
  });

  it('accepts only the official US or enterprise EU gateway path', () => {
    assert.equal(readOpenRouterConfig({
      OPENROUTER_API_KEY: testKey,
      OPENROUTER_BASE_URL: 'https://eu.openrouter.ai/api/v1',
    }).baseUrl, 'https://eu.openrouter.ai/api/v1');

    for (const baseUrl of [
      'http://openrouter.ai/api/v1',
      'https://attacker.example/api/v1',
      'https://openrouter.ai:444/api/v1',
      'https://user:pass@openrouter.ai/api/v1',
      'https://openrouter.ai/api/v1/chat/completions',
      'https://openrouter.ai/api/v1?student=1',
      'https://openrouter.ai/api/v1#fragment',
    ]) {
      assert.throws(
        () => readOpenRouterConfig({
          OPENROUTER_API_KEY: testKey,
          OPENROUTER_BASE_URL: baseUrl,
        }),
        OpenRouterConfigurationError,
      );
    }
  });

  it('rejects missing, Qwen, placeholder, malformed, and oversized keys', () => {
    for (const apiKey of [
      undefined,
      '',
      'sk-qwen-key-12345678901234567890',
      'sk-or-v1-',
      'sk-or-v1-key with spaces 1234567890',
      `sk-or-v1-${'a'.repeat(400)}`,
    ]) {
      assert.throws(
        () => readOpenRouterConfig({OPENROUTER_API_KEY: apiKey}),
        (error: unknown) =>
          error instanceof OpenRouterConfigurationError &&
          (!apiKey || !error.message.includes(apiKey)),
      );
    }
  });

  it('keeps attribution origin-only and rejects identifiers in URL fields', () => {
    for (const httpReferer of [
      'http://www.helpmath.ai',
      'https://www.helpmath.ai/student/123',
      'https://www.helpmath.ai/?student=123',
      'https://student@www.helpmath.ai',
    ]) {
      assert.throws(
        () => readOpenRouterConfig({
          OPENROUTER_API_KEY: testKey,
          OPENROUTER_HTTP_REFERER: httpReferer,
        }),
        OpenRouterConfigurationError,
      );
    }
    assert.throws(
      () => readOpenRouterConfig({
        OPENROUTER_API_KEY: testKey,
        OPENROUTER_APP_TITLE: `HELP Math\nstudent-123`,
      }),
      OpenRouterConfigurationError,
    );
  });
});
