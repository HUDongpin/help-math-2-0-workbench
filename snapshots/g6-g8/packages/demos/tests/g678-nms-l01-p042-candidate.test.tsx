import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {G678_NMS_L01_P042_CONFIG as CONFIG, G678_NMS_L01_P042_CANDIDATE_MODULE as MODULE,
  NmsL01P042SourceRenderer, resolveNmsL01P042Frame, namespaceNmsL01P042Svg} from '../src/g678-nms-l01-p042-candidate';
import {G678_NMS_L01_P042_SOURCE_VISUAL as SOURCE} from '../src/generated/g678-nms-l01-p042-source-visual-v1';
import {stateSupportsRuntimeContext} from '../src/runtime';
const context = (frame = 1, replay = 0) => ({frame, frameDomain: 'sprite-23', rootFrame: 6,
  scenario: CONFIG.scenario, lang: 'en' as const, seed: 0, replay});

test('p042 root10/entry6/main125 are distinct; one terminal125 clock, no fake transport/host/audio capabilities', () => {
  assert.equal(MODULE.movie.frameCount, 10); assert.equal(MODULE.runtime.frameCount, 10);
  assert.equal(MODULE.runtime.defaultFrameDomain, 'sprite-23');
  assert.deepEqual(MODULE.runtime.frameDomains[1], {id:'sprite-23',frameCount:125,fps:12,rootFrame:6});
  assert.equal(MODULE.playbackMode,'once'); assert.equal(MODULE.playbackEndFrame,125); assert.equal(MODULE.reducedMotionFrame,125);
  assert.deepEqual(MODULE.audioCues,[]); assert.deepEqual(MODULE.audioTracks,[]); assert.deepEqual(MODULE.interactiveAudioAssets,[]);
  assert.deepEqual(MODULE.lessonHost.capabilities,[]); assert.ok(!('transport' in MODULE)); assert.ok(!('interactiveStops' in MODULE));
});
test('all125 source frames have one actual visual; only125 reaches terminal and Replay restores frame1 deterministically', () => {
  const initial = resolveNmsL01P042Frame(1,context());
  for(let frame=1;frame<=125;frame++) {
    const state=resolveNmsL01P042Frame(frame,context(frame));
    assert.equal(state.status,'ready'); assert.equal(state.sourceDrawingSha256,SOURCE.svgSha256);
    assert.equal(state.visualStateId,'full-root-static-composition'); assert.equal(state.sourceTerminalStopReached,frame===125);
    assert.equal(stateSupportsRuntimeContext(state,context(frame),MODULE.runtime),true);
  }
  for(const replay of [1,2,9]) {
    const state=resolveNmsL01P042Frame(1,context(1,replay));
    assert.deepEqual({...state,replay:0},initial); assert.equal(state.sourceTerminalStopReached,false);
  }
});
test('invalid frame/domain/root/language/scenario/seed/replay are blocked, never silently relabeled as source evidence', () => {
  for(const [frame,override] of [[0,{}],[126,{}],[1.5,{}],[1,{frameDomain:'root'}],[1,{rootFrame:7}],
    [1,{scenario:'old-alg-l09-authority'}],[1,{lang:'es'}],[1,{seed:-1}],[1,{replay:-1}],[1,{frame:2}]] as const) {
    const state=resolveNmsL01P042Frame(frame,{...context(frame),...override}); assert.equal(state.status,'blocked');
  }
});
test('source title/four literals and original glyph vectors are rendered once; no in-page invented controls or duplicate SVG IDs', () => {
  const one=renderToStaticMarkup(<NmsL01P042SourceRenderer {...context()}/>);
  assert.match(one,/<figure lang="en" role="img" aria-label=/);
  const blocked=renderToStaticMarkup(<NmsL01P042SourceRenderer {...context()} lang="es"/>);
  assert.match(blocked,/<p lang="en" role="alert" data-p042-source-state="blocked">/);
  assert.match(one,/Positive &amp; Negative Numbers: Test Skills/);
  for(const literal of SOURCE.literalSteps) assert.ok(one.includes(literal));
  assert.doesNotMatch(one,/<button|<input|<audio|<canvas|<img|<script/);
  assert.match(one,/matrix\(1\.000045776367188, 0, 0, 1, 412\.05, 283\.4\)/);
  const two=renderToStaticMarkup(<><NmsL01P042SourceRenderer {...context()}/><NmsL01P042SourceRenderer {...context(125)}/></>);
  const ids=[...two.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]); assert.equal(new Set(ids).size,ids.length);
  const references=[...two.matchAll(/(?:xlink:href|href)="#([^"]+)"|url\(#([^)]*)\)/g)].map(m=>m[1]??m[2]);
  assert.ok(references.every(id=>ids.includes(id)));
  assert.throws(()=>namespaceNmsL01P042Svg('bad namespace'));
});
