'use client';

import {useEffect, useRef, useState} from 'react';

export interface LoadedSwfHostAsset {
  readonly registryKey: string;
  readonly assetSource: string;
  readonly assetSha256: string;
  readonly sourceProvenLanguage: 'en' | 'es';
  readonly backgroundDisposition:
    'ignore-loaded-child-swf-standalone-stage-background';
}

interface LoadedSwfCanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: Readonly<{
      frame: number;
      scenario: string;
      lang: 'en' | 'es';
      seed: number;
    }>,
  ) => unknown;
}

interface LoadedSwfRenderIdentity {
  readonly localFrame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
  readonly audioRendered: false;
}

interface LoadedSwfRegistryWindow {
  readonly HELP_MATH_CANVAS_ASSETS?: Record<string, LoadedSwfCanvasAsset>;
}

function canvasAssetRegistry() {
  return (window as unknown as LoadedSwfRegistryWindow)
    .HELP_MATH_CANVAS_ASSETS;
}

const assetPromises = new Map<string, Promise<LoadedSwfCanvasAsset>>();

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256HexToIntegrity(sha256Hex: string) {
  let binary = '';
  for (let index = 0; index < sha256Hex.length; index += 2) {
    binary += String.fromCharCode(
      Number.parseInt(sha256Hex.slice(index, index + 2), 16),
    );
  }
  return `sha256-${btoa(binary)}`;
}

function validateAsset(asset: LoadedSwfHostAsset) {
  invariant(
    /^course-[a-z0-9-]+$/.test(asset.registryKey),
    'loaded-SWF host registry key is invalid',
  );
  invariant(
    asset.assetSource.startsWith('/flash-assets/') &&
      !asset.assetSource.includes('..'),
    'loaded-SWF host asset path must be local',
  );
  invariant(
    /^[a-f0-9]{64}$/.test(asset.assetSha256),
    'loaded-SWF host asset SHA-256 is invalid',
  );
  invariant(
    asset.sourceProvenLanguage === 'en' ||
      asset.sourceProvenLanguage === 'es',
    'loaded-SWF host source-proven language is invalid',
  );
  invariant(
    asset.backgroundDisposition ===
      'ignore-loaded-child-swf-standalone-stage-background',
    'loaded-SWF host background disposition is invalid',
  );
  return asset;
}

function loadAsset(asset: LoadedSwfHostAsset) {
  const validated = validateAsset(asset);
  const integrity = sha256HexToIntegrity(validated.assetSha256);
  const separator = validated.assetSource.includes('?') ? '&' : '?';
  const source =
    `${validated.assetSource}${separator}sha256=${validated.assetSha256}`;
  const absoluteSource = new URL(source, document.baseURI).href;
  const selector =
    `script[data-help-math-loaded-swf-host="${validated.registryKey}"]` +
    `[data-help-math-canvas-sha256="${validated.assetSha256}"]`;
  const existing = document.querySelector<HTMLScriptElement>(selector);
  const exactExisting = existing
    ? existing.src === absoluteSource &&
      existing.integrity === integrity &&
      existing.crossOrigin === 'anonymous'
    : false;
  invariant(
    !existing || exactExisting,
    'existing loaded-SWF host asset has a mismatched integrity binding',
  );

  const registered = canvasAssetRegistry()?.[validated.registryKey];
  if (registered) {
    invariant(
      exactExisting,
      'loaded-SWF host registry entry lacks its exact script binding',
    );
    return Promise.resolve(registered);
  }

  const promiseKey =
    `${validated.registryKey}:${validated.assetSha256}:${validated.assetSource}`;
  const existingPromise = assetPromises.get(promiseKey);
  if (existingPromise) return existingPromise;
  const promise = new Promise<LoadedSwfCanvasAsset>((resolve, reject) => {
    const script = existing ?? document.createElement('script');
    const finish = () => {
      const next = canvasAssetRegistry()?.[validated.registryKey];
      if (next) resolve(next);
      else reject(new Error(
        'loaded-SWF host asset did not register its exact key',
      ));
    };
    script.onload = finish;
    script.onerror = () => reject(new Error(
      'local loaded-SWF host asset could not load',
    ));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathLoadedSwfHost = validated.registryKey;
      script.dataset.helpMathCanvasSha256 = validated.assetSha256;
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
      script.src = source;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    assetPromises.delete(promiseKey);
    throw error;
  });
  assetPromises.set(promiseKey, promise);
  return promise;
}

function isLoadedSwfRenderIdentity(
  value: unknown,
): value is LoadedSwfRenderIdentity {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'localFrame' in value &&
      'frameDomain' in value &&
      'rootFrame' in value &&
      'scenario' in value &&
      'lang' in value &&
      'seed' in value &&
      'audioRendered' in value,
  );
}

export function LoadedSwfHostCanvas({
  animationId,
  asset,
  entryStateSha256,
  frame,
  frameDomain,
  height,
  lang,
  requirementId,
  rootFrame,
  scenario,
  seed,
  traceId,
  width,
}: {
  animationId: string;
  asset: LoadedSwfHostAsset;
  entryStateSha256: string;
  frame: number;
  frameDomain: string;
  height: number;
  lang: 'en' | 'es';
  requirementId: string;
  rootFrame: number;
  scenario: string;
  seed: number;
  traceId: string;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] =
    useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    setStatus('loading');
    loadAsset(asset)
      .then(async (loadedAsset) => {
        await loadedAsset.ready();
        if (cancelled) return;
        const rendered = loadedAsset.render(canvas, {
          frame,
          scenario,
          lang,
          seed,
        });
        invariant(
          isLoadedSwfRenderIdentity(rendered) &&
            rendered.localFrame === frame &&
            rendered.frameDomain === frameDomain &&
            rendered.rootFrame === rootFrame &&
            rendered.scenario === scenario &&
            rendered.lang === lang &&
            rendered.seed === seed &&
            rendered.audioRendered === false,
          'loaded-SWF host asset returned a mismatched identity',
        );
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [
    asset,
    frame,
    frameDomain,
    lang,
    rootFrame,
    scenario,
    seed,
  ]);

  return <section
    aria-label={`Loaded child SWF drawing for ${animationId}`}
    className="faithful-conversion loaded-swf-host-canvas"
    data-animation-id={animationId}
    data-candidate-status="source-static-host-composite-not-strict"
    data-canvas-background-mode="transparent-over-shell-underlay"
    data-canvas-status={status}
    data-loaded-swf-background-disposition={asset.backgroundDisposition}
    data-original-runtime-accepted="false"
    data-owner-accepted="false"
    data-strict-migration-complete="false"
  >
    <canvas
      aria-label={`Source-static ${frameDomain} drawing, frame ${frame}`}
      className="faithful-stage-wrap"
      data-capture-identity-status="host-bound-current-js-candidate"
      data-flash-entry-state-sha256={entryStateSha256 || undefined}
      data-flash-frame={frame}
      data-flash-frame-domain={frameDomain}
      data-flash-lang={lang}
      data-flash-requirement-id={requirementId || undefined}
      data-flash-root-frame={rootFrame}
      data-flash-scenario={scenario}
      data-flash-seed={seed}
      data-flash-trace-id={traceId || undefined}
      data-render-state={status}
      data-render-visual={status === 'ready' ? 'true' : undefined}
      data-runtime-language={lang}
      data-runtime-scenario={scenario}
      data-runtime-seed={seed}
      height={height}
      ref={canvasRef}
      role="img"
      style={{
        aspectRatio: `${width} / ${height}`,
        display: status === 'error' ? 'none' : 'block',
        height: 'auto',
        pointerEvents: 'none',
        width: '100%',
      }}
      width={width}
    />
    {status === 'loading'
      ? <span aria-live="polite" className="sr-only" role="status">
          Loading source-bound host composite…
        </span>
      : null}
    {status === 'error'
      ? <p aria-live="assertive" role="alert">
          The local loaded-SWF host drawing failed safely.
        </p>
      : null}
  </section>;
}
