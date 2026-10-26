import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P010PlayerV1, p010PaintVerifiedFrame, type P010CanvasAssetV1} from '../src/alg-l06-p010-player-v1';
import {P010_TIMELINE} from '../src/alg-l06-p010-timeline-v1';

function fixture() {
  const attrs = new Map<string, string>();
  const canvas = {
    width: 800, height: 600,
    getAttribute: (key: string) => attrs.get(key) ?? null,
    setAttribute: (key: string, value: string) => { attrs.set(key, value); },
  } as unknown as HTMLCanvasElement;
  const requests: number[] = [];
  const asset: P010CanvasAssetV1 = {
    metadata: {
      animationId: P010_TIMELINE.animationId,
      sourceSwfSha256: P010_TIMELINE.sourceSwfSha256,
      stage: P010_TIMELINE.stage,
      fps: P010_TIMELINE.fps,
      deterministicContentTimeline: {timelineId: 'sprite-52', frameCount: P010_TIMELINE.mainFrameCount},
    },
    ready: async () => undefined,
    render: (target, request) => {
      assert.equal(target, canvas);
      assert.equal(request.scenario, 'source-static-frame');
      assert.equal(request.lang, 'en');
      assert.equal(request.seed, 0);
      requests.push(request.frame);
      target.setAttribute('data-flash-frame', String(request.frame));
      target.setAttribute('data-flash-frame-domain', 'sprite-52');
      return {localFrame: request.frame, frameDomain: 'sprite-52', rootFrame: 6};
    },
  };
  return {canvas, asset, requests};
}

test('only exact P010 source drawing can commit a matching main frame', () => {
  const {canvas, asset, requests} = fixture();
  p010PaintVerifiedFrame(asset, canvas, 1);
  p010PaintVerifiedFrame(asset, canvas, 303);
  assert.deepEqual(requests, [1, 303]);
  assert.equal(canvas.getAttribute('data-flash-frame'), '303');
  assert.throws(() => p010PaintVerifiedFrame(asset, canvas, 304), /P010_INVALID_MAIN_FRAME/);
  assert.deepEqual(requests, [1, 303]);
});

test('wrong source identity is rejected before any drawing', () => {
  const {canvas, asset, requests} = fixture();
  const wrong = {...asset, metadata: {...asset.metadata, sourceSwfSha256: 'other'}};
  assert.throws(() => p010PaintVerifiedFrame(wrong, canvas, 19), /P010_CANVAS_ASSET_IDENTITY_MISMATCH/);
  assert.deepEqual(requests, []);
});

test('a renderer that reports or marks a different frame is rejected', () => {
  const {canvas, asset} = fixture();
  const reported = {...asset, render: () => ({localFrame: 20, frameDomain: 'sprite-52', rootFrame: 6})};
  assert.throws(() => p010PaintVerifiedFrame(reported, canvas, 19), /P010_CANVAS_FRAME_COMMIT_MISMATCH/);
  const marked = {...asset, render: () => {
    canvas.setAttribute('data-flash-frame', '18');
    canvas.setAttribute('data-flash-frame-domain', 'sprite-52');
    return {localFrame: 19, frameDomain: 'sprite-52', rootFrame: 6};
  }};
  assert.throws(() => p010PaintVerifiedFrame(marked, canvas, 19), /P010_CANVAS_FRAME_COMMIT_MISMATCH/);
});

test('initial player exposes explicit controls, source art, and no start side effect', () => {
  const {asset} = fixture();
  let loads = 0;
  const html = renderToStaticMarkup(<P010PlayerV1 asset={asset}
    loadAudio={async () => { loads++; return new ArrayBuffer(0); }} language="es" reducedMotion onOpenGlossary={() => {}} />);
  assert.equal(loads, 0);
  assert.match(html, /data-p010-player-phase="loading"/);
  assert.match(html, /data-p010-player-frame="1"/);
  assert.match(html, /data-p010-audio-policy="explicit-separate-streams"/);
  assert.match(html, /data-p010-audio-owner="main"/);
  assert.match(html, /data-p010-sa-phase="idle"/);
  assert.match(html, /Audio en español/);
  assert.match(html, /data-p010-motion-policy="explicit-reduced"/);
  assert.match(html, /<canvas[^>]*width="800"[^>]*height="600"/);
  assert.match(html, /data-p010-language-policy="source-en-fallback"/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Reproducir<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Pausar<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Repetir<\/button>/);
  assert.match(html, /aria-label="Ilustración de la actividad de funciones"/);
});
