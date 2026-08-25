import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalJson,
  freezeDocument,
  parseArguments,
} from './build-adaptive-canvas-real-browser-v10-freeze.mjs';

test('v10 freeze CLI is explicit and has no browser or apply mode', () => {
  assert.deepEqual(parseArguments(['--write']), {check: false});
  assert.deepEqual(parseArguments(['--check']), {check: true});
  for (const argv of [[], ['--apply'], ['--browser'], ['--write', '--check']]) {
    assert.throws(() => parseArguments(argv), /usage/u);
  }
});

test('v10 freeze document is deterministic and explicitly non-authorizing', () => {
  const payload = {
    status: 'frozen-before-real-browser-validation-v10',
    boundaries: {
      browserStartedByFreeze: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applyAuthorization: false,
      ownerAcceptanceChanged: false,
      releaseEligibilityChanged: false,
    },
  };
  const first = freezeDocument(payload);
  const second = freezeDocument(JSON.parse(JSON.stringify(payload)));
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(first.payload.boundaries.applyAuthorization, false);
  assert.match(first.contentSha256, /^[a-f0-9]{64}$/u);
});
