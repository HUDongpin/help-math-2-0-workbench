import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P021OptionalSpanishAudio,P021_OPTIONAL_SPANISH_AUDIO_BINDING,
  P021_OPTIONAL_SPANISH_AUDIO_BROWSER_RECEIPT_SHA256,
  P021_OPTIONAL_SPANISH_AUDIO_URL}
  from '../src/alg-l06-p021-optional-spanish-audio-v1';

const root=new URL('../../../',import.meta.url);
const source=readFileSync(new URL(
  'output/alg-l06-p021-audio-v1/separate-sa-source-v1.mp3',root));
const receiptBytes=readFileSync(new URL(
  'output/alg-l06-p021-audio-v1/decode-receipt.json',root));
const receipt=JSON.parse(receiptBytes.toString('utf8'));
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function deferred<T>(){let resolve!:(value:T)=>void;
  const promise=new Promise<T>(accept=>{resolve=accept;});return {promise,resolve};}

test('independent P021 SA pins exact source bytes and Headless Chrome decoded PCM',()=>{
  const binding=P021_OPTIONAL_SPANISH_AUDIO_BINDING;
  const decoded=receipt.results.find((row:{role:string})=>row.role==='separate-sa');
  assert(decoded);assert.equal(hash(receiptBytes),P021_OPTIONAL_SPANISH_AUDIO_BROWSER_RECEIPT_SHA256);
  assert.equal(hash(source),binding.sourceSha256);
  assert.equal(source.byteLength,binding.sourceBytes);
  assert.equal(decoded.decodedSamples,binding.decodedSamples);
  assert.equal(decoded.pcmSha256,binding.pcmSha256);
  assert.equal(decoded.playbackStarted,false);
  assert.equal(receipt.listeningAccepted,false);
  assert.match(P021_OPTIONAL_SPANISH_AUDIO_URL,/shared-alg001-l06-p021\/optional-spanish-audio-v1/u);
});

test('locale and construction do not load SA; activation must be explicit',async()=>{
  let loads=0;
  const audio=new P021OptionalSpanishAudio({onChange:()=>{},onEnded:()=>{},
    load:async()=>{loads++;return new ArrayBuffer(0);}});
  assert.equal(audio.snapshot().phase,'idle');assert.equal(loads,0);
  const denied=await audio.start({activation:'automatic'} as unknown as {activation:'user'});
  assert.equal(denied.accepted,false);assert.equal(loads,0);
  await audio.close();
});

test('Stop and close invalidate pending optional SA load before decode or playback',async()=>{
  for(const action of ['stop','close'] as const){
    const load=deferred<ArrayBuffer>();let signal:AbortSignal|undefined;
    const audio=new P021OptionalSpanishAudio({onChange:()=>{},onEnded:()=>{
      assert.fail('stale SA onEnded');},load:s=>{signal=s;return load.promise;}});
    const pending=audio.start({activation:'user'});await Promise.resolve();
    assert.equal(audio.snapshot().phase,'loading');
    if(action==='stop')await audio.stopAndWait();else await audio.close();
    assert.equal(signal?.aborted,true);
    load.resolve(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength));
    assert.equal((await pending).accepted,false);
    assert.equal(audio.snapshot().phase,action==='stop'?'idle':'closed');
    await audio.close();
  }
});
