import assert from 'node:assert/strict';
import test from 'node:test';

import {summarizeG5FailureDiagnostic} from './build-g4-l3-g5-l4-private-preview-capture-r5-abort-record-2026-08-08.mjs';

test('r5 abort diagnostic retains paths and reasons but not loopback ports or RSC tokens', () => {
  const summary = summarizeG5FailureDiagnostic({
    consoleErrors: ['Failed to load resource: the server responded with a status of 500'],
    failedRequests: [
      'http://127.0.0.1:39123/contact?_rsc=opaque-token: net::ERR_ABORTED',
      'http://127.0.0.1:39123/contact?_rsc=other-token: net::ERR_ABORTED',
    ],
    httpErrors: ['500 http://127.0.0.1:39123/research?_rsc=opaque-token'],
  });
  assert.deepEqual(summary.failedRequestPaths, [{count: 2, value: '/contact'}]);
  assert.deepEqual(summary.failedRequestReasons, [{count: 2, value: 'net::ERR_ABORTED'}]);
  assert.deepEqual(summary.httpErrors, [{count: 1, value: '500 /research rsc=true'}]);
  assert.equal(JSON.stringify(summary).includes('39123'), false);
  assert.equal(JSON.stringify(summary).includes('opaque-token'), false);
});
