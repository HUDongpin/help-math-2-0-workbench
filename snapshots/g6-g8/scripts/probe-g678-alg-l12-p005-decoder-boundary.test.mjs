import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {compareP005Pcm, decodeP005Probe, probeP005DecoderBoundary} from './probe-g678-alg-l12-p005-decoder-boundary.mjs';

test('P005 frame384 direct and warmed decoder outputs match continuous decoding on this pinned toolchain',async()=>{
  const result=await probeP005DecoderBoundary();
  const saved=JSON.parse(await readFile(new URL('../migrations/shared-alg001-l12-p005/audio-source-v1/decoder-boundary-v1.json',import.meta.url)));
  assert.deepEqual(result,saved);
  assert.equal(result.mainDataBeginBytes,511);
  assert.equal(result.comparisons.length,3);
  for(const row of result.comparisons){assert.equal(row.byteIdentical,true);assert.equal(row.comparedSamples,2150784);}
  assert.equal(result.playbackEnabled,false);
  assert.equal(result.originalRuntimeObserved,false);
});

test('comparison detects differences and the source tail is not entirely zero PCM',async()=>{
  const a=Buffer.alloc(12),b=Buffer.alloc(12);b.writeFloatLE(0.5,4);
  assert.equal(compareP005Pcm(a,b).differingSamples,1);
  assert.equal(compareP005Pcm(a,b).firstDifferent,1);
  assert.equal(compareP005Pcm(a,b).byteIdentical,false);
  assert.throws(()=>compareP005Pcm(a,b.subarray(4)),/lengths/);
  const source=await readFile(new URL('../migrations/shared-alg001-l12-p005/audio-source-v1/sprite-391-source-stream.mp3',import.meta.url));
  const {pcm}=await decodeP005Probe(source);
  let nonzero=0;
  for(let offset=1158912*4;offset<pcm.length;offset+=4)if(pcm.readFloatLE(offset)!==0)nonzero++;
  assert.ok(nonzero>44100,'comparison tail must contain substantial nonzero audio');
});
