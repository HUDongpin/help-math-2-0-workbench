import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {ALG_L06_P003_SOURCE_AUDIO as plan} from '../packages/demos/src/alg-l06-p003-source-audio-schedule-v1.ts';

const bundled = await build({entryPoints: [fileURLToPath(new URL('../packages/demos/src/alg-l06-p003-source-clock-v1.ts', import.meta.url))],
  bundle: true, platform: 'node', format: 'esm', write: false});
const {AlgL06P003SourceClockV1} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);

test('P003 clock never creates an audio context for unverified source bytes', async () => {
  let created = 0;
  const clock = new AlgL06P003SourceClockV1({
    createContext: () => {created++; throw Error('unexpected-context');},
    commitHeldFrame: () => true,
  });
  const invalid = await clock.prepare([new ArrayBuffer(plan.runs[0].sourceBytes),
    new ArrayBuffer(plan.runs[1].sourceBytes)]);
  assert.deepEqual(invalid, {accepted: false, reason: 'source-byte-identity-mismatch'});
  assert.equal(created, 0);
  assert.equal(clock.snapshot().phase, 'failed');
  assert.equal(clock.snapshot().audioAccepted, false);
  assert.equal(clock.snapshot().originalRuntimeAccepted, false);
  assert.deepEqual(await clock.play({activation: 'user', reducedMotion: false}),
    {accepted: false, reason: 'not-ready'});
  await clock.close();
  assert.equal(clock.snapshot().phase, 'closed');
});

test('P003 clock has fail-closed idle controls and bounded volume', async () => {
  const clock = new AlgL06P003SourceClockV1({commitHeldFrame: () => true});
  assert.deepEqual(await clock.prepare([new ArrayBuffer(1)]),
    {accepted: false, reason: 'invalid-source-runs'});
  assert.equal(clock.snapshot().phase, 'idle');
  assert.equal(clock.pause().accepted, false);
  assert.equal(clock.replay().accepted, false);
  assert.equal(clock.seekCandidateFrame(502).accepted, false);
  assert.equal(clock.setVolume(-0.1).accepted, false);
  assert.equal(clock.setVolume(1.1).accepted, false);
  assert.equal(clock.setVolume(0.25).accepted, true);
  assert.equal(clock.snapshot().audio.volume, 0.25);
  assert.deepEqual(await clock.play({activation: 'automatic', reducedMotion: true}),
    {accepted: false, reason: 'reduced-motion-hold'});
  await clock.close();
  assert.equal(clock.setVolume(0.5).accepted, false);
});
