import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';
import {algL12P003Descriptor} from '../lib/g678-alg-l12-p003.server';
import {ALG_L12_P005_ID, algL12P005HostProbeDescriptor} from
  '../lib/g678-alg-l12-p005-host-probe.server';
import {isG678LocalPreviewRequestHeaders} from '../lib/g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA256 = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
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

test('P005 probe preserves 52 source pages and changes only the simulated fifth placement', () => {
  withLocalEnv(() => {
    const official = algL12P003Descriptor();
    const probe = algL12P005HostProbeDescriptor();
    assert.equal(hasLocalOnlyAnimationModule(ALG_L12_P005_ID), false);
    assert.equal(official.pages.length, 52);
    assert.equal(probe.pages.length, 52);
    assert.equal(official.productBridge.registeredAnimationCount, 19);
    assert.equal(probe.productBridge.registeredAnimationCount, 20);
    assert.equal(official.pages[4]?.rendererAvailability.kind, 'unavailable');
    assert.equal(probe.pages[4]?.rendererAvailability.kind, 'registered');
    assert.equal(probe.pages[4]?.globalPageOrdinal, 5);
    assert.equal(probe.pages[4]?.sectionPageOrdinal, 4);
    assert.equal(probe.pages[4]?.source.assetId, `swf-${SOURCE_SHA256}`);
    assert.equal(probe.pages[4]?.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
    assert.deepEqual(probe.pages.map(page => page.placementId),
      official.pages.map(page => page.placementId));
    assert.deepEqual(probe.pages.filter((_, index) => index !== 4),
      official.pages.filter((_, index) => index !== 4));
    assert.deepEqual(probe.productBridge.selectedAnimationIds.filter(id => id !== ALG_L12_P005_ID),
      official.productBridge.selectedAnimationIds);
    assert.deepEqual(probe.productBridge.acceptanceEffects,
      official.productBridge.acceptanceEffects);
    assert.notEqual(probe.persistence.storageKey, official.persistence.storageKey);
    assert.match(probe.descriptorId, /unregistered-host-probe/u);
    const swf = readFileSync(`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/RW/L12RW05.swf`);
    assert.equal(createHash('sha256').update(swf).digest('hex'), SOURCE_SHA256);
  });
});

test('P005 probe closes without opt-in, on provider, and in production', () => {
  withLocalEnv(() => {
    delete process.env.HELP_MATH_G678_LOCAL_PREVIEW;
    assert.throws(() => algL12P005HostProbeDescriptor(), /local loopback opt-in required/u);
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.VERCEL_ENV = 'preview';
    assert.throws(() => algL12P005HostProbeDescriptor(), /local loopback opt-in required/u);
    delete process.env.VERCEL_ENV;
    testEnv.NODE_ENV = 'production';
    assert.throws(() => algL12P005HostProbeDescriptor(), /local loopback opt-in required/u);
  });
});

test('P005 page restricts the host to local requests and discloses simulation', () => {
  withLocalEnv(() => {
    assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host: '127.0.0.1:3134'})), true);
    assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host: 'helpmath.ai'})), false);
    const page = readFileSync(new URL(
      '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p005/page.tsx',
      import.meta.url), 'utf8');
    assert.match(page, /process\.env\.NODE_ENV === 'production'/u);
    assert.match(page, /isG678LocalPreviewRequestHeaders\(await headers\(\)\)/u);
    assert.match(page, /catch \{notFound\(\);\}/u);
    assert.match(page, /robots: \{index: false, follow: false, noarchive: true\}/u);
    assert.match(page, /data-p005-host-probe="unregistered"/u);
    assert.match(page, /G678AlgL12P005HostLesson/u);
    assert.match(page, /audioEnabled=\{false\}/u);
    assert.match(page, /releasePublished=\{false\} strictCompleteMemberCount=\{0\}/u);
    assert.match(page, /colors are candidates/u);
  });
});
