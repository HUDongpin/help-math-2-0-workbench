import assert from 'node:assert/strict';
import test from 'node:test';

import {
  G4_TARGET,
  G5_EXECUTIVE_ROUTE_CLOSURE_PATHS,
  G5_TARGET,
  g5CaptureSourceUrl,
  parseMode,
  privateSessionTransportDescriptor,
} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs';

test('r4 accepts only explicit execution mode and keeps its output roots new', () => {
  assert.equal(parseMode(['--run']), 'run');
  assert.equal(parseMode(['--help']), 'help');
  assert.throws(() => parseMode([]), /expected exactly/u);
  assert.throws(() => parseMode(['--run', '--again']), /expected exactly/u);
  assert.notEqual(G4_TARGET.outputRoot, G5_TARGET.outputRoot);
  assert.match(G4_TARGET.outputRoot, /-r8$/u);
  assert.match(G5_TARGET.outputRoot, /-r4$/u);
});

test('r4 targets the narrow session-protected G5 executive route without credentials in URLs', () => {
  const origin = 'http://127.0.0.1:43210';
  const route = new URL(g5CaptureSourceUrl(origin));
  assert.equal(route.origin, origin);
  assert.equal(route.pathname, '/executive-preview/g5-l4');
  assert.deepEqual([...route.searchParams.entries()], [['scene', 'course-g05-l04-rw-002']]);
  assert.equal(route.username, '');
  assert.equal(route.password, '');
  assert.throws(() => g5CaptureSourceUrl('https://127.0.0.1:43210'), /exact credential-free/u);
});

test('r4 route closure binds the G5 private page, whitelist resolver, style, runtime, and proxy', () => {
  for (const required of [
    'apps/web/app/[locale]/executive-preview/g5-l4/page.tsx',
    'apps/web/components/g5-l4-executive-preview.tsx',
    'apps/web/components/g5-l4-executive-preview.module.css',
    'apps/web/lib/g5-l4-executive-preview-capture.ts',
    'apps/web/components/animation-runtime.tsx',
    'apps/web/proxy.ts',
  ]) assert(G5_EXECUTIVE_ROUTE_CLOSURE_PATHS.includes(required), required);
  assert.deepEqual(privateSessionTransportDescriptor('http://127.0.0.1:43210'), {
    mode: 'existing-private-preview-session-cookie',
    exactOrigin: 'http://127.0.0.1:43210',
    cookieName: 'helpmath_executive_preview',
    credentialSource: 'ephemeral-in-process-login-response',
    credentialRecorded: false,
    cookieInstalledForExactOriginAndStrippedFromOtherOrigins: true,
    publicBypassCreated: false,
  });
});
