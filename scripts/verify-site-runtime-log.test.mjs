import assert from 'node:assert/strict';
import test from 'node:test';

import {inspectSiteRuntimeLog} from './verify-site-runtime-log.mjs';

test('site runtime log gate accepts a complete zero-warning log', () => {
  const result = inspectSiteRuntimeLog('54 passed (5.7m)\n', '/tmp/site.log');
  assert.equal(result.status, 'PASS');
  assert.equal(result.maximumUpdateDepthCount, 0);
  assert.deepEqual(result.maximumUpdateDepthLines, []);
  assert.match(result.sha256, /^[a-f0-9]{64}$/u);
});

test('site runtime log gate fails on one maximum-depth warning', () => {
  assert.throws(
    () => inspectSiteRuntimeLog(
      'start\nMaximum update depth exceeded. first\nend\n',
      '/tmp/site.log',
    ),
    /SITE_RUNTIME_LOG_GATE_FAIL.*"maximumUpdateDepthCount":1.*"maximumUpdateDepthLines":\[2\]/u,
  );
});

test('site runtime log gate reports every maximum-depth line', () => {
  assert.throws(
    () => inspectSiteRuntimeLog(
      'Maximum update depth exceeded. first\nok\nMaximum update depth exceeded. second\n',
      '/tmp/site.log',
    ),
    /"maximumUpdateDepthCount":2.*"maximumUpdateDepthLines":\[1,3\]/u,
  );
});

test('site runtime log gate rejects loopback proxy transport failures', () => {
  assert.throws(
    () => inspectSiteRuntimeLog(
      '[WebServer] Failed to proxy http://localhost:3211/en Error: socket hang up\n'
      + "[WebServer]   code: 'ECONNRESET'\n"
      + '70 passed\n',
      '/tmp/site.log',
    ),
    /SITE_RUNTIME_LOG_GATE_FAIL.*"transportFailureCount":3.*"transportFailureLines":\[\{"line":1,"signals":\["failed-proxy","socket-hang-up"\]\},\{"line":2,"signals":\["econnreset"\]\}\]/u,
  );
});

test('ordinary error words do not masquerade as a maximum-depth warning', () => {
  const result = inspectSiteRuntimeLog(
    'test title: handles an expected error response\n70 passed\n',
  );
  assert.equal(result.status, 'PASS');
});

test('an empty log fails closed', () => {
  assert.throws(() => inspectSiteRuntimeLog('', '/tmp/empty.log'), /runtime log is empty/u);
});
