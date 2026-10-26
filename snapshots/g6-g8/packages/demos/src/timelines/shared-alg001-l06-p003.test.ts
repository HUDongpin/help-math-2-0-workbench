import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import module from '../modules/g678-alg-l06-p003-source-candidate-v1';
import {ALG_L06_P003_SOURCE_AUDIO} from '../alg-l06-p003-source-audio-schedule-v1';
import {ALG_L06_P003_DRAWING} from './shared-alg001-l06-p003';

function state(frame: number, domain = 'sprite-154', scenario = 'source-static-frame', lang: 'en' | 'es' = 'en') {
  return module.getFrameState(frame, {frame, frameDomain: domain,
    rootFrame: domain === 'root' ? frame : 6, scenario, lang, seed: 0});
}

test('P003 module binds source, root and nested frame domains without claiming audio acceptance', () => {
  assert.equal(module.key, ALG_L06_P003_DRAWING.animationId);
  assert.equal(module.runtime?.frameCount, 10);
  assert.equal(module.runtime?.defaultFrameDomain, 'sprite-154');
  assert.deepEqual(module.runtime?.frameDomains?.map(domain => [domain.id, domain.frameCount, domain.rootFrame]),
    [['sprite-154', 719, 6], ['sprite-158', 1, 6]]);
  assert.equal(module.audioCues.length, 0);
  assert.equal(module.maturity, 'legacy-prototype');
  assert.equal(module.reducedMotionFrame, 531);
  assert.equal(ALG_L06_P003_DRAWING.assetSha256, '87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c');
});

test('P003 module carries both exact source runs for its private host clock', () => {
  const attachment = module.privateAlgL06P003;
  assert.equal(attachment.version, 1);
  assert.equal(attachment.sourceAudio, ALG_L06_P003_SOURCE_AUDIO);
  assert.equal(attachment.drawing, ALG_L06_P003_DRAWING);
  assert.equal(attachment.sourceRuns.length, 2);
  attachment.sourceRuns.forEach((run, index) => {
    const source = ALG_L06_P003_SOURCE_AUDIO.runs[index];
    const bytes = Buffer.from(run.base64, 'base64');
    assert.equal(run.id, source.id);
    assert.equal(run.bytes, source.sourceBytes);
    assert.equal(bytes.length, source.sourceBytes);
    assert.equal(run.sha256, source.sourceSha256);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sourceSha256);
  });
  assert.equal(module.audioCues.length, 0);
  assert.equal(module.maturity, 'legacy-prototype');
});

test('P003 pure frame states address audio-boundary frames and block unsupported domains', () => {
  for (const frame of [1, 41, 501, 502, 520, 531, 543, 544, 719]) {
    const snapshot = state(frame);
    assert.equal(snapshot.frame, frame);
    assert.equal(snapshot.frameDomain, 'sprite-154');
    assert.equal(snapshot.sourceSwfSha256, ALG_L06_P003_DRAWING.sourceSwfSha256);
    assert.equal(snapshot.naturalRuntimeEstablished, false);
    assert.equal(snapshot.audioRendered, false);
  }
  assert.equal(state(1, 'root', 'root-unavailable').status, 'blocked');
  assert.equal(state(1, 'sprite-158', 'sprite-158-unavailable').status, 'blocked');
  assert.equal(state(531, 'sprite-154', 'source-static-frame', 'es').status, 'blocked');
  assert.equal(state(531, 'sprite-154', 'source-static-frame', 'en').status, 'ready');
});
