import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {SHARED_ALG001_L12_P006_SOURCE} from
  '../../../packages/demos/src/timelines/shared-alg001-l12-p006';
import {algL12P006HostProbeDescriptor} from '../lib/g678-alg-l12-p006-host-probe.server';
import {isG678LocalPreviewRequestHeaders} from '../lib/g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const testEnv: Record<string, string | undefined> = process.env;

function withLocalEnv(run: () => void) {
  const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
    'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    testEnv.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    run();
  } finally {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else testEnv[key] = value;
    }
  }
}

test('retired P006 unregistered probe refuses the current registered implementation', () => {
  withLocalEnv(() => {
    assert.equal(SHARED_ALG001_L12_P006_SOURCE.currentJavaScriptRegistered, true);
    assert.equal(SHARED_ALG001_L12_P006_SOURCE.productCalibrationPassed, false);
    assert.throws(() => algL12P006HostProbeDescriptor(),
      /source candidate must remain unregistered and unaccepted/u);
  });
});

test('P006 probe closes without opt-in, on provider, and in production', () => {
  withLocalEnv(() => {
    delete process.env.HELP_MATH_G678_LOCAL_PREVIEW;
    assert.throws(() => algL12P006HostProbeDescriptor(), /local loopback opt-in required/u);
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.VERCEL_ENV = 'preview';
    assert.throws(() => algL12P006HostProbeDescriptor(), /local loopback opt-in required/u);
    delete process.env.VERCEL_ENV;
    testEnv.NODE_ENV = 'production';
    assert.throws(() => algL12P006HostProbeDescriptor(), /local loopback opt-in required/u);
  });
});

test('P006 formal page remains private and cannot fall back to the retired simulation', () => {
  withLocalEnv(() => {
    assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host: '127.0.0.1:3134'})), true);
    assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host: 'helpmath.ai'})), false);
    const page = readFileSync(new URL(
      '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p006/page.tsx',
      import.meta.url), 'utf8');
    assert.match(page, /process\.env\.NODE_ENV === 'production'/u);
    assert.match(page, /isG678LocalPreviewRequestHeaders\(await headers\(\)\)/u);
    assert.match(page, /catch \{notFound\(\);\}/u);
    assert.match(page, /robots: \{index: false, follow: false, noarchive: true\}/u);
    assert.match(page, /data-p006-current-js="registered"/u);
    assert.match(page, /algL12P006CurrentJsDescriptor\(\)/u);
    assert.doesNotMatch(page, /HostProbeDescriptor|host-probe\.server/u);
    assert.match(page, /G678AlgL12P006HostLesson/u);
    assert.match(page, /audioEnabled=\{false\}/u);
    assert.match(page, /releasePublished=\{false\} strictCompleteMemberCount=\{0\}/u);
    assert.match(page, /remains unpublished/u);
  });
});
