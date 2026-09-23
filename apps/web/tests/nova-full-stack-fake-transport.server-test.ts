// Kept outside the ordinary `*.test.ts` glob because it requires react-server.
import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';

import {
  NOVA_FULL_STACK_FAKE_TRANSPORT_AUTHORIZATION,
  NovaFakeTransportConfigurationError,
  resolveNovaFullStackFakeFetch,
} from '../lib/nova-full-stack-fake-transport.server';
import {NOVA_OPENROUTER_MODEL} from '../lib/nova-openrouter.server';

const localOrigin = 'http://127.0.0.1:3214';

function localRequest() {
  return new Request(`${localOrigin}/api/nova`, {
    method: 'POST',
    headers: {origin: localOrigin},
  });
}

function environment(receiptPath: string) {
  return {
    NODE_ENV: 'test',
    NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION:
      NOVA_FULL_STACK_FAKE_TRANSPORT_AUTHORIZATION,
    NOVA_TEST_FAKE_TRANSPORT_MODE: 'success',
    NOVA_TEST_FAKE_TRANSPORT_ORIGIN: localOrigin,
    NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH: receiptPath,
  } as const;
}

describe('Nova full-stack fake upstream transport', () => {
  it('stays absent unless an explicit test transport variable is present', () => {
    assert.equal(resolveNovaFullStackFakeFetch({
      environment: {NODE_ENV: 'test'},
      request: localRequest(),
      requestId: crypto.randomUUID(),
    }), undefined);
  });

  it('fails closed in production, on partial configuration, and off loopback', () => {
    const receiptPath = path.join(
      tmpdir(),
      'helpmath-nova-full-stack',
      `${crypto.randomUUID()}.ndjson`,
    );
    assert.throws(() => resolveNovaFullStackFakeFetch({
      environment: {...environment(receiptPath), NODE_ENV: 'production'},
      request: localRequest(),
      requestId: crypto.randomUUID(),
    }), NovaFakeTransportConfigurationError);
    assert.throws(() => resolveNovaFullStackFakeFetch({
      environment: {
        NODE_ENV: 'test',
        NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION:
          NOVA_FULL_STACK_FAKE_TRANSPORT_AUTHORIZATION,
      },
      request: localRequest(),
      requestId: crypto.randomUUID(),
    }), NovaFakeTransportConfigurationError);
    assert.throws(() => resolveNovaFullStackFakeFetch({
      environment: environment(receiptPath),
      request: new Request('https://www.helpmath.ai/api/nova', {
        headers: {origin: 'https://www.helpmath.ai'},
        method: 'POST',
      }),
      requestId: crypto.randomUUID(),
    }), NovaFakeTransportConfigurationError);
  });

  it('uses only the official endpoint and writes a content-free correlated receipt', async () => {
    const receiptDirectory = path.join(tmpdir(), 'helpmath-nova-full-stack');
    mkdirSync(receiptDirectory, {recursive: true, mode: 0o700});
    const receiptPath = path.join(
      receiptDirectory,
      `${crypto.randomUUID()}.ndjson`,
    );
    const requestId = crypto.randomUUID();
    // Next may expose an internal loopback hostname in Request.url while its
    // browser-facing Origin remains the configured 127.0.0.1 authority.
    const fetchImpl = resolveNovaFullStackFakeFetch({
      environment: environment(receiptPath),
      request: new Request('http://localhost:3214/api/nova', {
        headers: {origin: localOrigin},
        method: 'POST',
      }),
      requestId,
    });
    assert.ok(fetchImpl);

    await assert.rejects(
      fetchImpl('https://example.com/api/v1/chat/completions', {
        body: JSON.stringify({model: NOVA_OPENROUTER_MODEL, messages: []}),
        method: 'POST',
      }),
      NovaFakeTransportConfigurationError,
    );

    const response = await fetchImpl(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        body: JSON.stringify({
          model: NOVA_OPENROUTER_MODEL,
          messages: [{role: 'user', content: 'private test learner text'}],
        }),
        method: 'POST',
      },
    );
    assert.equal(response.status, 200);
    const responseBody = await response.json() as {model: string};
    assert.equal(responseBody.model, NOVA_OPENROUTER_MODEL);

    const serializedReceipt = readFileSync(receiptPath, 'utf8');
    const receipt = JSON.parse(serializedReceipt) as Record<string, unknown>;
    assert.deepEqual(Object.keys(receipt).sort(), [
      'attempt',
      'evidenceKind',
      'framePresent',
      'model',
      'receiptId',
      'requestBytes',
      'requestId',
      'schemaVersion',
      'status',
    ]);
    assert.equal(receipt.evidenceKind, 'FULL_STACK_FAKE_UPSTREAM');
    assert.equal(receipt.requestId, requestId);
    assert.equal(receipt.model, NOVA_OPENROUTER_MODEL);
    assert.equal(receipt.framePresent, false);
    assert.doesNotMatch(serializedReceipt, /private test learner text/u);
    unlinkSync(receiptPath);
  });

  it('can fail every provider attempt without leaking request content', async () => {
    const receiptDirectory = path.join(tmpdir(), 'helpmath-nova-full-stack');
    mkdirSync(receiptDirectory, {recursive: true, mode: 0o700});
    const receiptPath = path.join(
      receiptDirectory,
      `${crypto.randomUUID()}.ndjson`,
    );
    const requestId = crypto.randomUUID();
    const fetchImpl = resolveNovaFullStackFakeFetch({
      environment: {
        ...environment(receiptPath),
        NOVA_TEST_FAKE_TRANSPORT_MODE: 'provider-unavailable',
      },
      request: localRequest(),
      requestId,
    });
    assert.ok(fetchImpl);

    const response = await fetchImpl(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        body: JSON.stringify({
          model: NOVA_OPENROUTER_MODEL,
          messages: [{role: 'user', content: 'private synthetic failure text'}],
        }),
        method: 'POST',
      },
    );
    assert.equal(response.status, 503);

    const serializedReceipt = readFileSync(receiptPath, 'utf8');
    const receipt = JSON.parse(serializedReceipt) as Record<string, unknown>;
    assert.equal(receipt.requestId, requestId);
    assert.equal(receipt.status, 503);
    assert.equal(receipt.framePresent, false);
    assert.doesNotMatch(serializedReceipt, /private synthetic failure text/u);
    assert.doesNotMatch(serializedReceipt, /synthetic-provider-unavailable/u);
    unlinkSync(receiptPath);
  });
});
