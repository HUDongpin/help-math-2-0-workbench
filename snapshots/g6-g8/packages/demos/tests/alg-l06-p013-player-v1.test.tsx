import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P013PlayerV1, p013PaintVerifiedFrame, type P013CanvasAssetV1} from '../src/alg-l06-p013-player-v1';
import {P013_TIMELINE} from '../src/alg-l06-p013-timeline-v1';

function fixture() {
  const attrs = new Map<string, string>();
  const canvas = {
    width: 800, height: 600,
    getAttribute: (key: string) => attrs.get(key) ?? null,
    setAttribute: (key: string, value: string) => { attrs.set(key, value); },
  } as unknown as HTMLCanvasElement;
  const requests: number[] = [];
  const asset: P013CanvasAssetV1 = {
    metadata: {
      animationId: P013_TIMELINE.animationId,
      sourceSwfSha256: P013_TIMELINE.sourceSwfSha256,
      stage: P013_TIMELINE.stage,
      fps: P013_TIMELINE.fps,
      deterministicContentTimeline: {
        timelineId: P013_TIMELINE.frameDomain, frameCount: P013_TIMELINE.mainFrameCount,
      },
    },
    ready: async () => undefined,
    render: (target, request) => {
      assert.equal(target, canvas);
      assert.equal(request.scenario, 'source-static-frame');
      assert.equal(request.lang, 'en');
      assert.equal(request.seed, 0);
      requests.push(request.frame);
      target.setAttribute('data-flash-frame', String(request.frame));
      target.setAttribute('data-flash-frame-domain', P013_TIMELINE.frameDomain);
      return {localFrame: request.frame, frameDomain: P013_TIMELINE.frameDomain, rootFrame: 6};
    },
  };
  return {canvas, asset, requests};
}

test('only the exact source Canvas commits frames in sprite-140', () => {
  const {canvas, asset, requests} = fixture();
  p013PaintVerifiedFrame(asset, canvas, 1);
  p013PaintVerifiedFrame(asset, canvas, 258);
  p013PaintVerifiedFrame(asset, canvas, 297);
  p013PaintVerifiedFrame(asset, canvas, 372);
  assert.deepEqual(requests, [1, 258, 297, 372]);
  assert.equal(canvas.getAttribute('data-flash-frame-domain'), 'sprite-140');
  assert.throws(() => p013PaintVerifiedFrame(asset, canvas, 373), /P013_INVALID_MAIN_FRAME/);
});

test('wrong source identity or mismatched painted frame fails before audio can advance', () => {
  const {canvas, asset, requests} = fixture();
  const wrong = {...asset, metadata: {...asset.metadata, sourceSwfSha256: 'other'}};
  assert.throws(() => p013PaintVerifiedFrame(wrong, canvas, 258), /P013_CANVAS_ASSET_IDENTITY_MISMATCH/);
  assert.deepEqual(requests, []);
  const reported = {...asset, render: () => ({localFrame: 258, frameDomain: 'wrong-domain', rootFrame: 6})};
  assert.throws(() => p013PaintVerifiedFrame(reported, canvas, 258), /P013_CANVAS_FRAME_COMMIT_MISMATCH/);
});

test('es host markup retains an English source Canvas and explicit independent SA control', () => {
  const {asset} = fixture();
  let mainLoads = 0, spanishLoads = 0;
  const html = renderToStaticMarkup(<P013PlayerV1 asset={asset}
    loadAudio={async () => {mainLoads++; return new ArrayBuffer(0);}}
    loadSpanishAudio={async () => {spanishLoads++; return new ArrayBuffer(0);}}
    language="es" reducedMotion onOpenGlossary={() => {}} />);
  assert.equal(mainLoads, 0);
  assert.equal(spanishLoads, 0);
  assert.match(html, /data-p013-player-phase="loading"/);
  assert.match(html, /data-p013-player-frame="1"/);
  assert.match(html, /data-p013-audio-policy="explicit-separate-streams"/);
  assert.match(html, /data-p013-audio-owner="main"/);
  assert.match(html, /data-p013-sa-phase="idle"/);
  assert.match(html, /Audio en español/);
  assert.match(html, /data-p013-motion-policy="explicit-reduced"/);
  assert.match(html, /<canvas[^>]*width="800"[^>]*height="600"/);
  assert.match(html, /aria-label="Ilustración de la actividad de entrada y salida"/);
});
