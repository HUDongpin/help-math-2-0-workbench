import assert from 'node:assert/strict';
import {test} from 'node:test';
import IR from '../src/generated/geo001-l07-p001-source-ir-v1.json';
import {GEO_L07_P001_SOURCE, geoL07P001Frame, geoL07P001FrameAtMilliseconds} from '../src/geo-l07-p001-timeline-v1';
import {geoL07P001TextSnapshot} from '../src/geo-l07-p001-text-v1';

const context = {frame: 1, frameDomain: 'sprite-142', scenario: 'source-introduction',
  lang: 'en' as const, seed: 0, replay: 0};

test('all 130 exact L7 title frames drive the native semantic title', () => {
  assert.equal(IR.frames.length, 130);
  assert.equal(GEO_L07_P001_SOURCE.sourceSwfSha256, IR.sourceSwfSha256);
  for (const sourceFrame of IR.frames) {
    const state = geoL07P001Frame(sourceFrame.frame, {...context, frame: sourceFrame.frame});
    const source = sourceFrame.layers[1]!;
    assert.equal(state.mainFrame, sourceFrame.frame);
    assert.equal(state.rootFrame, 6);
    assert.equal(state.scale, source.scaleX);
    assert.equal(state.alpha, source.alpha256 / 256);
    const snapshot = geoL07P001TextSnapshot(state);
    assert.equal(snapshot.status, 'ready');
    assert.equal(snapshot.blocks[0]?.text, 'Volume and Surface Area: Introduction');
    assert.equal(snapshot.blocks[0]?.visible, source.alpha256 > 0);
    assert.equal(snapshot.blocks[0]?.language, 'en');
  }
  assert.equal(geoL07P001Frame(1, context).alpha, 0);
  assert.equal(geoL07P001Frame(129, context).alpha, 1);
  assert.equal(geoL07P001Frame(130, context).alpha, 1);
});

test('root entry, Spanish source fallback, Replay, and invalid identities stay distinct', () => {
  for (let frame = 1; frame <= 5; frame++) {
    const state = geoL07P001Frame(frame, {...context, frame, frameDomain: 'root'});
    assert.equal(state.mainFrame, null);
    assert.equal(state.alpha, 0);
    assert.equal(geoL07P001TextSnapshot(state).blocks[0]?.visible, false);
  }
  assert.equal(geoL07P001Frame(6, {...context, frame: 6, frameDomain: 'root'}).mainFrame, 1);
  assert.equal(geoL07P001FrameAtMilliseconds(0), 1);
  assert.equal(geoL07P001FrameAtMilliseconds(130 * 1000 / 12 + 1), 130);
  const en = geoL07P001Frame(129, {...context, frame: 129});
  const es = geoL07P001Frame(129, {...context, frame: 129, lang: 'es', replay: 2});
  assert.equal(es.title, en.title);
  assert.equal(es.alpha, en.alpha);
  assert.equal(es.replay, 2);
  assert.equal(geoL07P001Frame(1, {...context, replay: 3}).alpha, 0);
  for (const frame of [0, 131, 1.5, NaN]) {
    assert.throws(() => geoL07P001Frame(frame, {...context, frame}));
  }
  for (const time of [-1, Infinity, NaN]) assert.throws(() => geoL07P001FrameAtMilliseconds(time));
  assert.throws(() => geoL07P001Frame(1, {...context, frameDomain: 'sprite-11'}));
  assert.equal(GEO_L07_P001_SOURCE.randomAudio, 'catalog-yes-trigger-unresolved');
  assert.equal(GEO_L07_P001_SOURCE.strictAcceptanceEffect, 'none');
});
