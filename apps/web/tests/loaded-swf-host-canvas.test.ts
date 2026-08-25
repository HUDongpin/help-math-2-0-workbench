import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  G4_L3_IR001_LOADED_SWF_HOST_LOGICAL_PATH,
  LoadedSwfCanvasAllocationError,
  loadedSwfCanvasMayFallbackToK1,
  loadedSwfHostScriptRequest,
  presentVerifiedLoadedSwfStagingCanvas,
  resolveLoadedSwfHostAsset,
  type LoadedSwfHostAsset,
} from '../components/loaded-swf-host-canvas';
import type {
  AdaptiveCanvasProductionBinding,
} from '../../../packages/demos/src/adaptive-canvas-production-bindings.generated';
import {selectAdaptiveCanvasResolution} from '../../../packages/demos/src/adaptive-canvas-resolution';

class FakeCanvas {
  width = 300;
  height = 150;
  readonly values = new Map<string, string>();
  readonly context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    setTransform: () => undefined,
    drawImage: () => undefined,
  };

  get attributes() {
    return [...this.values].map(([name, value]) => ({name, value}));
  }

  getAttribute(name: string) {
    return this.values.get(name) ?? null;
  }

  getContext(kind: string) {
    return kind === '2d' ? this.context : null;
  }

  removeAttribute(name: string) {
    this.values.delete(name);
  }

  setAttribute(name: string, value: string) {
    this.values.set(name, value);
  }
}

function asCanvas(canvas: FakeCanvas) {
  return canvas as unknown as HTMLCanvasElement;
}

const componentUrl = new URL(
  '../components/loaded-swf-host-canvas.tsx',
  import.meta.url,
);
const digest = '3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0';
const adaptiveDigest = 'a'.repeat(64);
const asset: LoadedSwfHostAsset = Object.freeze({
  registryKey: 'course-g04-l03-ir-001-341242cc-loaded-swf-host',
  assetSource: `/flash-assets/${G4_L3_IR001_LOADED_SWF_HOST_LOGICAL_PATH}`,
  assetSha256: digest,
  sourceProvenLanguage: 'en',
  backgroundDisposition:
    'ignore-loaded-child-swf-standalone-stage-background',
});
const adaptiveBinding: AdaptiveCanvasProductionBinding = Object.freeze({
  animationId: asset.registryKey,
  pageRenderer: false,
  assetPath: asset.assetSource as `/flash-assets/courses/${string}`,
  assetSha256: adaptiveDigest,
  resolution: Object.freeze({
    schemaVersion: 1,
    mode: 'adaptive-integer',
    nativeWidth: 800,
    nativeHeight: 600,
    supportedRenderScales: Object.freeze([1, 2] as const),
  }),
  sourceBitmapResolutionBound: false,
});

test('inactive generated binding preserves the exact legacy fixed-k1 URL', () => {
  const request = loadedSwfHostScriptRequest(asset, null);
  assert.deepEqual(request, {
    src: `${asset.assetSource}?sha256=${digest}`,
    integrity: `sha256-${Buffer.from(digest, 'hex').toString('base64')}`,
  });
  assert.deepEqual(
    loadedSwfHostScriptRequest(asset),
    request,
    'the checked-in inactive generated placeholder must resolve to legacy',
  );
  assert.deepEqual(resolveLoadedSwfHostAsset(asset, null), {
    ...asset,
    resolution: null,
    resolutionMode: 'legacy-fixed-k1',
    sourceBitmapResolutionBound: false,
  });
  assert.equal(request.src.includes('/by-sha256/'), false);

  assert.throws(
    () => loadedSwfHostScriptRequest({
      ...asset,
      assetSource:
        '/flash-assets/courses/shell-course-g04-l03-index-local/canvas-renderer.js',
    }, null),
    /not the exact IR001 host runtime/,
  );
  assert.throws(
    () => loadedSwfHostScriptRequest({
      ...asset,
      assetSha256: digest.toUpperCase(),
    }, null),
    /SHA-256 is invalid/,
  );
});

test('active generated binding exclusively supplies adaptive path, hash, resolution, and content URL', () => {
  const request = loadedSwfHostScriptRequest(asset, adaptiveBinding);
  assert.deepEqual(request, {
    src: `/flash-assets/by-sha256/${adaptiveDigest}/${G4_L3_IR001_LOADED_SWF_HOST_LOGICAL_PATH}`,
    integrity:
      `sha256-${Buffer.from(adaptiveDigest, 'hex').toString('base64')}`,
  });
  assert.equal(request.src.includes('?'), false);
  assert.deepEqual(resolveLoadedSwfHostAsset(asset, adaptiveBinding), {
    ...asset,
    assetSource: adaptiveBinding.assetPath,
    assetSha256: adaptiveDigest,
    resolution: adaptiveBinding.resolution,
    resolutionMode: 'adaptive-v1',
    sourceBitmapResolutionBound: false,
  });

  assert.throws(
    () => loadedSwfHostScriptRequest(asset, {
      ...adaptiveBinding,
      assetPath:
        '/flash-assets/courses/shell-course-g04-l03-index-local/canvas-renderer.js',
    }),
    /mismatched asset path/,
  );
  assert.throws(
    () => loadedSwfHostScriptRequest(asset, {
      ...adaptiveBinding,
      animationId: 'course-g04-l03-ir-001-wrong-host',
    }),
    /mismatched registry key/,
  );
  assert.throws(
    () => loadedSwfHostScriptRequest(asset, {
      ...adaptiveBinding,
      resolution: {...adaptiveBinding.resolution, nativeWidth: 801} as never,
    }),
    /lacks the exact adaptive-v1 resolution/,
  );
});

test('loaded-SWF host script loading remains exact, local, and fail-closed', async () => {
  const source = await readFile(componentUrl, 'utf8');
  const sharedPresenter = await readFile(
    new URL(
      '../../../packages/demos/src/adaptive-canvas-presenter.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(
    source,
    /asset\.assetSource === G4_L3_IR001_LOADED_SWF_HOST_ASSET_SOURCE/,
  );
  assert.match(source, /getAdaptiveLoadedSwfHostProductionBinding\(\)/);
  assert.match(source, /productionBinding === null/);
  assert.match(source, /resolutionMode: 'legacy-fixed-k1'/);
  assert.match(source, /`\$\{asset\.assetSource\}\?sha256=\$\{asset\.assetSha256\}`/);
  assert.match(source, /\/flash-assets\/by-sha256\/\$\{asset\.assetSha256\}/);
  assert.match(source, /loadExactCanvasRegistryScript<LoadedSwfCanvasAsset>/);
  assert.match(source, /markerAttribute: 'data-help-math-loaded-swf-host'/);
  assert.match(source, /markerDatasetKey: 'helpMathLoadedSwfHost'/);
  assert.match(source, /registeredAsset: \(\) => canvasAssetRegistry\(\)/);
  assert.match(source, /crossOrigin: 'anonymous'/);
  assert.doesNotMatch(source, /const registered = canvasAssetRegistry\(\)/);
  assert.match(sharedPresenter, /script\.integrity = request\.integrity/);
  assert.match(sharedPresenter, /script\.crossOrigin = request\.crossOrigin/);
  assert.match(sharedPresenter, /script\.dataset\[markerDatasetKey\]/);
  assert.match(sharedPresenter, /script\.dataset\.helpMathCanvasSha256/);
  assert.match(sharedPresenter, /script\.src = request\.src/);
  assert.match(sharedPresenter, /document\.head\.appendChild\(script\)/);
  assert.ok(
    sharedPresenter.indexOf('script.integrity = request.integrity') <
      sharedPresenter.indexOf('document.head.appendChild(script)'),
    'SRI must be assigned before the immutable script is inserted',
  );
  assert.match(sharedPresenter, /exactCanvasScriptBindings\.set\(script, \{asset, loaderKey\}\)/);
  assert.match(sharedPresenter, /asset === registeredBeforeLoad/);
  assert.doesNotMatch(source, /separator/);
});

test('only an active generated binding enables adaptive-v1 on the fixed 800x600 CSS stage', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /useAdaptiveCanvasResolution\(\{/);
  assert.match(source, /nativeWidth: LOADED_SWF_HOST_STAGE\.width/);
  assert.match(source, /nativeHeight: LOADED_SWF_HOST_STAGE\.height/);
  assert.match(
    source,
    /adaptiveEnabled: resolvedAsset\.resolutionMode === 'adaptive-v1'/,
  );
  assert.match(source, /verifyResolutionContract\(loadedAsset, resolvedAsset\.resolution\)/);
  assert.match(source, /if \(expected === null\) return/);
  assert.match(source, /resolvedAsset\.resolutionMode === 'adaptive-v1'[\s\S]*?renderScale: candidate\.resolution\.renderScale[\s\S]*?: legacyRenderRequest/);
  assert.match(source, /assertExactCanvasBackingDimensions\(resolution/);
  assert.match(source, /height=\{LOADED_SWF_HOST_STAGE\.height\}/);
  assert.match(source, /width=\{LOADED_SWF_HOST_STAGE\.width\}/);
  assert.match(source, /maxWidth: `\$\{LOADED_SWF_HOST_STAGE\.width\}px`/);
  assert.doesNotMatch(source, /width \* renderScale|height \* renderScale/);
});

test('staging is verified before the stable visible Canvas is synchronously presented', async () => {
  const source = await readFile(componentUrl, 'utf8');
  const prepare = source.indexOf(
    'const candidate = prepareLoadedSwfStagingCanvas(',
  );
  const render = source.indexOf('const rendered = loadedAsset.render(');
  const verify = source.indexOf('verifyRenderedIdentity(\n            candidate.canvas');
  const present = source.indexOf(
    'presentVerifiedLoadedSwfStagingCanvas(\n            visibleCanvas',
  );

  assert.ok(prepare >= 0 && prepare < render);
  assert.ok(render < verify);
  assert.ok(verify < present);
  assert.match(source, /context\.globalCompositeOperation = 'copy'/);
  assert.match(source, /context\.drawImage\(stagingCanvas, 0, 0\)/);
  assert.match(source, /presentedRequestKeyRef\.current = requestedKey/);
  assert.match(source, /data-render-visual/);
  assert.match(source, /data-capture-identity-status/);
  assert.match(source, /canvas\.removeAttribute\('data-capture-stage'\)/);
  assert.match(source, /visibleCanvas\.setAttribute\('data-capture-stage', 'true'\)/);
});

test('only allocation failure may explicitly fall back to k1', async () => {
  const source = await readFile(componentUrl, 'utf8');
  const retina = selectAdaptiveCanvasResolution({
    authoredStage: {width: 800, height: 600},
    cssStage: {width: 800, height: 600},
    devicePixelRatio: 2,
  });
  const k2Failure = new LoadedSwfCanvasAllocationError(
    'visible Canvas allocation failed at 2x',
    2,
  );

  assert.match(source, /class LoadedSwfCanvasAllocationError extends Error/);
  assert.equal(loadedSwfCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: k2Failure,
  }), true);
  assert.equal(loadedSwfCanvasMayFallbackToK1({
    adaptiveEnabled: false,
    error: k2Failure,
  }), false);
  assert.equal(loadedSwfCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: new LoadedSwfCanvasAllocationError('k1 failed', 1),
  }), false);
  assert.equal(loadedSwfCanvasMayFallbackToK1({
    adaptiveEnabled: true,
    error: new Error('renderer failed'),
  }), false);

  const staging = new FakeCanvas();
  staging.width = retina.backingStage.width;
  staging.height = retina.backingStage.height;
  staging.setAttribute('data-flash-frame', '9');
  const failingVisible = new FakeCanvas();
  failingVisible.context.drawImage = () => {
    throw new Error('GPU copy failed');
  };
  assert.throws(
    () => presentVerifiedLoadedSwfStagingCanvas(
      asCanvas(failingVisible),
      asCanvas(staging),
      retina,
      null,
    ),
    (error: unknown) =>
      error instanceof LoadedSwfCanvasAllocationError &&
      error.renderScale === 2,
  );
  assert.equal(failingVisible.getAttribute('data-capture-stage'), null);

  const visible = new FakeCanvas();
  presentVerifiedLoadedSwfStagingCanvas(
    asCanvas(visible),
    asCanvas(staging),
    retina,
    'visible Canvas allocation failed at 2x',
  );
  assert.equal(visible.getAttribute('data-flash-frame'), '9');
  assert.equal(visible.getAttribute('data-capture-stage'), 'true');
  assert.equal(
    visible.getAttribute('data-resolution-fallback-reason'),
    'visible Canvas allocation failed at 2x',
  );

  assert.match(source, /const fallback = fallbackK1Resolution\(resolution\)/);
  assert.match(source, /status: 'fallback-k1'/);
  assert.match(source, /loadedAsset\.render\(candidate\.canvas, renderRequest\)/);
  assert.match(source, /allocationError\.message/);
  assert.match(source, /\.catch\(\(\) => \{[\s\S]*?data-render-state', 'error'/);
});

test('all Flash and capture identity stays bound to the verified staging result', async () => {
  const source = await readFile(componentUrl, 'utf8');

  for (const attribute of [
    'data-flash-entry-state-sha256',
    'data-flash-frame',
    'data-flash-frame-domain',
    'data-flash-lang',
    'data-flash-requirement-id',
    'data-flash-root-frame',
    'data-flash-scenario',
    'data-flash-seed',
    'data-flash-trace-id',
    'data-runtime-language',
    'data-runtime-scenario',
    'data-runtime-seed',
  ]) {
    assert.match(source, new RegExp(attribute));
  }
  assert.match(source, /loaded-SWF host asset returned a mismatched identity/);
  assert.match(source, /rendered\.audioRendered === false/);
  assert.match(source, /data-candidate-status="source-static-host-composite-not-strict"/);
  assert.match(source, /data-original-runtime-accepted="false"/);
  assert.match(source, /data-owner-accepted="false"/);
  assert.match(source, /data-strict-migration-complete="false"/);
  assert.match(source, /The local loaded-SWF host drawing failed safely\./);
});
