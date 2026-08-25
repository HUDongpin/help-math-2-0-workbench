import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  loadedSwfCanvasAssetStatusIdentity,
  resolveLoadedSwfCanvasStatusTransition,
  type LoadedSwfHostAsset,
} from '@/components/loaded-swf-host-canvas';

const componentUrl = new URL(
  '../components/loaded-swf-host-canvas.tsx',
  import.meta.url,
);

test('loaded-SWF host canvas stays local, hash-bound, and fail-closed', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /asset\.assetSource\.startsWith\('\/flash-assets\/'\)/);
  assert.match(source, /!\s*asset\.assetSource\.includes\('\.\.'\)/);
  assert.match(source, /\/\^\[a-f0-9\]\{64\}\$\/\.test\(asset\.assetSha256\)/);
  assert.match(source, /asset\.sourceProvenLanguage === 'en'/);
  assert.match(source, /asset\.sourceProvenLanguage === 'es'/);
  assert.match(source, /script\.integrity = integrity/);
  assert.match(source, /script\.crossOrigin = 'anonymous'/);
  assert.match(source, /script\.dataset\.helpMathLoadedSwfHost/);
  assert.match(source, /script\.dataset\.helpMathCanvasSha256/);
  assert.match(source, /script\.src = source/);
  assert.match(source, /document\.head\.appendChild\(script\)/);
  assert.ok(
    source.indexOf('script.integrity = integrity') <
      source.indexOf('document.head.appendChild(script)'),
    'SRI must be assigned before the local script is inserted',
  );
  assert.match(source, /loaded-SWF host asset returned a mismatched identity/);
  assert.match(source, /rendered\.audioRendered === false/);
  assert.match(source, /data-candidate-status="source-static-host-composite-not-strict"/);
  assert.match(source, /data-original-runtime-accepted="false"/);
  assert.match(source, /data-owner-accepted="false"/);
  assert.match(source, /data-strict-migration-complete="false"/);
  assert.match(source, /The local loaded-SWF host drawing failed safely\./);
  assert.match(
    source,
    /const transition = resolveLoadedSwfCanvasStatusTransition\(\s*assetStatusIdentityRef\.current,\s*asset,\s*\);/,
    'the component must apply the exact-asset status transition helper',
  );
  const frameRenderEffectStart = source.indexOf(
    "  useEffect(() => {\n    const canvas = canvasRef.current;",
  );
  const frameRenderEffectEnd = source.indexOf(
    '\n\n  return <section',
    frameRenderEffectStart,
  );
  assert.ok(frameRenderEffectStart >= 0 && frameRenderEffectEnd >= 0);
  assert.doesNotMatch(
    source.slice(frameRenderEffectStart, frameRenderEffectEnd),
    /setStatus\('loading'\)/,
    'the frame-dependent render effect must not schedule a loading reset',
  );
});

test('a canvas page is never stretched past the pixels behind it', async () => {
  const source = await readFile(
    new URL('../components/loaded-swf-host-canvas.tsx', import.meta.url),
    'utf8',
  );

  // The backing store follows the scale the adapter declares...
  assert.match(source, /canvas\.width !== width \* scale/);
  assert.match(source, /canvas\.height !== height \* scale/);
  assert.match(source, /width=\{width \* renderScale\}/);
  assert.match(source, /height=\{height \* renderScale\}/);

  // ...and the CSS box is capped to it, so widening the lesson plane can never
  // upscale a canvas page into softness.
  assert.match(source, /maxWidth: `\$\{width \* renderScale\}px`/);

  // An adapter that declares nothing renders at the authored stage.
  assert.match(source, /useState\(1\)/);
  assert.match(source, /Number\.isInteger\(declared\) && \(declared as number\) >= 1/);
});

test('canvas loading status resets only when the exact asset identity changes', () => {
  const asset: LoadedSwfHostAsset = {
    registryKey: 'course-g04-l03-host',
    assetSource: '/flash-assets/course-g04-l03-host.js',
    assetSha256: 'a'.repeat(64),
    sourceProvenLanguage: 'en',
    backgroundDisposition:
      'ignore-loaded-child-swf-standalone-stage-background',
  };
  let assetStatusIdentity = loadedSwfCanvasAssetStatusIdentity(asset);
  let loadingResetCount = 0;

  for (let redrawCount = 0; redrawCount < 60; redrawCount += 1) {
    const transition = resolveLoadedSwfCanvasStatusTransition(
      assetStatusIdentity,
      {...asset},
    );
    assetStatusIdentity = transition.assetStatusIdentity;
    if (transition.resetToLoading) loadingResetCount += 1;
  }
  assert.equal(
    loadingResetCount,
    0,
    '60 frame redraws of the same exact asset must schedule no loading reset',
  );

  const changedAsset = {...asset, assetSha256: 'b'.repeat(64)};
  const changed = resolveLoadedSwfCanvasStatusTransition(
    assetStatusIdentity,
    changedAsset,
  );
  assert.equal(changed.resetToLoading, true);
  loadingResetCount += Number(changed.resetToLoading);

  const repeated = resolveLoadedSwfCanvasStatusTransition(
    changed.assetStatusIdentity,
    {...changedAsset},
  );
  assert.equal(repeated.resetToLoading, false);
  assert.equal(loadingResetCount, 1, 'one exact asset change resets loading once');
});
