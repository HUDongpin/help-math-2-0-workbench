import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  classifyG4L3HostCompositeAsset,
  G4_L3_HOST_COMPOSITE_SHA256,
  hasExactG4L3HostCompositeDigest,
} from '../lib/g4-l3-host-composite-asset-policy';

const backgroundPath = [
  'courses',
  'shell-course-g04-l03-index-local',
  'host-composite-assets',
  'lesson-shell-mc-back-text.svg',
] as const;
const canvasPath = [
  'courses',
  'shell-course-g04-l03-index-local',
  'host-composite-assets',
  'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
] as const;

test('G4 L3 host composite policy controls exactly both generated assets', () => {
  const background = classifyG4L3HostCompositeAsset(backgroundPath);
  const canvas = classifyG4L3HostCompositeAsset(canvasPath);

  assert.deepEqual(background, {
    controlled: true,
    expectedSha256:
      '102f0ddeec5ede8843149c3c5621fb5a6632a5edc191b768823fbce691740355',
    relativePath: backgroundPath.join('/'),
  });
  assert.deepEqual(canvas, {
    controlled: true,
    expectedSha256:
      '3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0',
    relativePath: canvasPath.join('/'),
  });
  assert.equal(Object.keys(G4_L3_HOST_COMPOSITE_SHA256).length, 2);
  assert.equal(
    classifyG4L3HostCompositeAsset([
      ...backgroundPath.slice(0, -1),
      'manifest.json',
    ]).controlled,
    false,
  );
  assert.equal(
    classifyG4L3HostCompositeAsset([
      'courses',
      'course-g04-l03-ir-001-341242cc',
      'canvas-renderer.js',
    ]).controlled,
    false,
  );
});

test('G4 L3 host assets require one exact lowercase digest query', () => {
  const expected = G4_L3_HOST_COMPOSITE_SHA256[
    backgroundPath.join('/') as keyof typeof G4_L3_HOST_COMPOSITE_SHA256
  ];
  const makeUrl = (query: string) =>
    new URL(`http://127.0.0.1/flash-assets/${backgroundPath.join('/')}?${query}`);

  assert.equal(
    hasExactG4L3HostCompositeDigest(
      makeUrl(`sha256=${expected}`),
      expected,
    ),
    true,
  );
  assert.equal(
    hasExactG4L3HostCompositeDigest(makeUrl(''), expected),
    false,
  );
  assert.equal(
    hasExactG4L3HostCompositeDigest(
      makeUrl(`sha256=${expected}&sha256=${expected}`),
      expected,
    ),
    false,
  );
  assert.equal(
    hasExactG4L3HostCompositeDigest(
      makeUrl(`sha256=${expected.toUpperCase()}`),
      expected,
    ),
    false,
  );
  assert.equal(
    hasExactG4L3HostCompositeDigest(
      makeUrl(`sha256=${'0'.repeat(64)}`),
      expected,
    ),
    false,
  );
});

test('flash asset route verifies query and bytes for both host assets', async () => {
  const source = await readFile(
    new URL('../app/flash-assets/[...asset]/route.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /classifyG4L3HostCompositeAsset\(canonicalAsset\)/);
  assert.match(source, /hasExactG4L3HostCompositeDigest\(/);
  assert.match(
    source,
    /sha256\(bytes\) !== g4HostCompositePolicy\.expectedSha256/,
  );
  assert.match(
    source,
    /policy\.controlled\s*\|\|\s*g4HostCompositePolicy\.controlled/,
  );
});
