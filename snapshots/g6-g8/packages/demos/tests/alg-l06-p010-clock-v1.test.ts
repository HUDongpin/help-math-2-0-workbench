import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {AlgL06P010ClockV1,P010_BROWSER_DECODER,P010_CONTINUOUS_SOURCE_URL}
  from '../src/alg-l06-p010-clock-v1';
import {P010_TIMELINE,p010FrameState} from '../src/alg-l06-p010-timeline-v1';
import {P010_CONTINUOUS_AUDIO} from '../src/alg-l06-p010-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const file=(path:string)=>readFileSync(fileURLToPath(new URL(path,root)));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

test('embedded main MP3 and Chrome decode binding are exact, with no accepted listening claim',()=>{
  const source=file('migrations/shared-alg001-l06-p010/audit/audio-v1/continuous-source-v1.mp3');
  const receipt=file('output/playwright/alg-l06-p010-browser-audio-v1/decode-receipt.json');
  const decoded=JSON.parse(receipt.toString()).results.find((entry:{file:string})=>
    entry.file==='continuous-source-v1.mp3');
  assert.ok(decoded);
  assert.equal(source.byteLength,P010_BROWSER_DECODER.sourceBytes);
  assert.equal(sha(source),P010_BROWSER_DECODER.sourceSha256);
  assert.equal(sha(receipt),P010_BROWSER_DECODER.receiptSha256);
  assert.equal(decoded.pcmSha256,P010_BROWSER_DECODER.pcmSha256);
  assert.equal(decoded.decodedSamples,P010_BROWSER_DECODER.decodedSamples);
  assert.equal(decoded.sampleRate,P010_BROWSER_DECODER.sampleRate);
  assert.equal(decoded.channels,P010_BROWSER_DECODER.channels);
  assert.equal(P010_BROWSER_DECODER.audioAccepted,false);
  assert.equal(P010_BROWSER_DECODER.originalRuntimeAccepted,false);
  assert.match(P010_CONTINUOUS_SOURCE_URL,new RegExp(P010_BROWSER_DECODER.sourceSha256));
});

test('main clock binds the source first-audio frame and conditional host hold',()=>{
  const clock=new AlgL06P010ClockV1({commitHeldFrame:()=>true});
  assert.equal(clock.plan.sourceSwfSha256,P010_TIMELINE.sourceSwfSha256);
  assert.equal(clock.plan.frameDomain,'sprite-52');
  assert.equal(clock.plan.lastFrame,303);
  assert.equal(clock.plan.audioFirstFrame,4);
  assert.equal(clock.plan.latencySamples,1673);
  assert.equal(clock.plan.decoder.pcmSha256,P010_BROWSER_DECODER.pcmSha256);
  assert.equal(P010_CONTINUOUS_AUDIO.sourceStopActionPresent,false);
  assert.equal(P010_TIMELINE.terminalPolicy,'conditional-indexMI-host-hold');
  assert.equal(p010FrameState(267).glossaryAvailable,false);
  assert.equal(p010FrameState(268).glossaryAvailable,true);
  assert.equal(p010FrameState(296).questionFullyRevealed,false);
  assert.equal(p010FrameState(297).questionFullyRevealed,true);
  assert.equal(p010FrameState(303).hostHeldTerminal,true);
  assert.throws(()=>p010FrameState(304),/P010_INVALID_MAIN_FRAME/);
});
