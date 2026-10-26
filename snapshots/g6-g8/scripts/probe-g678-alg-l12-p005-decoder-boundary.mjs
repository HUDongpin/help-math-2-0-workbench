#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {countMpeg1Layer3Frames} from './analyze-g678-alg-l12-p005-mp3-timing.mjs';

const base = new URL('../migrations/shared-alg001-l12-p005/audio-source-v1/', import.meta.url);
const expectedSha = '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function decodeP005Probe(bytes) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-v','error','-nostdin','-f','mp3','-i','pipe:0',
      '-map','0:a:0','-ac','1','-ar','44100','-f','f32le','pipe:1'], {stdio:['pipe','pipe','pipe']});
    const chunks = [], errors = []; let size = 0;
    child.on('error', reject);
    child.stdin.on('error', reject);
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > 16 * 1024 * 1024) {child.kill(); reject(Error('PCM bound exceeded'));}
      else chunks.push(chunk);
    });
    child.stderr.on('data', chunk => errors.push(chunk));
    child.on('close', code => code === 0
      ? resolve({pcm:Buffer.concat(chunks), decoderMessages:Buffer.concat(errors).toString().trim()})
      : reject(Error(`ffmpeg failed ${code}: ${Buffer.concat(errors)}`)));
    child.stdin.end(bytes);
  });
}

export function compareP005Pcm(reference, candidate) {
  assert.equal(candidate.length, reference.length, 'aligned PCM lengths differ');
  assert.equal(reference.length % 4, 0);
  let differingSamples = 0, firstDifferent = null, lastDifferent = null, squared = 0, max = 0;
  for (let offset = 0; offset < reference.length; offset += 4) {
    const a = reference.readFloatLE(offset), b = candidate.readFloatLE(offset);
    assert.ok(Number.isFinite(a) && Number.isFinite(b), 'nonfinite PCM');
    const delta = Math.abs(a-b);
    if (delta !== 0) {differingSamples++; firstDifferent ??= offset/4; lastDifferent = offset/4;}
    max = Math.max(max,delta); squared += delta*delta;
  }
  return {comparedSamples:reference.length/4, differingSamples, firstDifferent, lastDifferent,
    maxAbsoluteDifference:max, rootMeanSquareDifference:Math.sqrt(squared/(reference.length/4)),
    byteIdentical:reference.equals(candidate)};
}

export async function probeP005DecoderBoundary() {
  const file = fileURLToPath(new URL('sprite-391-source-stream.mp3', base));
  const stat = await lstat(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink());
  assert.equal(await realpath(file),file);
  const bytes = await readFile(file);
  assert.equal(sha(bytes),expectedSha);
  const frames = countMpeg1Layer3Frames(bytes);
  assert.equal(frames.frameCount,2873);
  assert.deepEqual(frames.frameLengthBytes,{'208':2873});
  const boundaryByte = 209248, boundaryMp3Frame = 1006, decodedBefore = boundaryMp3Frame*1152;
  assert.equal(boundaryByte,boundaryMp3Frame*208);
  const header = bytes.readUInt32BE(boundaryByte);
  const sideInfo = boundaryByte+4+(((header>>>16)&1) ? 0 : 2);
  const backPointer = (bytes[sideInfo]<<1)|(bytes[sideInfo+1]>>>7);
  assert.equal(backPointer,511);
  const reference = await decodeP005Probe(bytes);
  assert.equal(reference.pcm.length,3309696*4);
  const target = reference.pcm.subarray(decodedBefore*4);
  const comparisons = [];
  for (const precedingFrames of [0,3,10]) {
    const startByte = boundaryByte-precedingFrames*208;
    const decoded = await decodeP005Probe(bytes.subarray(startByte));
    const aligned = decoded.pcm.subarray(precedingFrames*1152*4);
    comparisons.push({precedingMp3Frames:precedingFrames,startByte,
      decodedSamples:decoded.pcm.length/4,discardedWarmupSamples:precedingFrames*1152,
      decoderMessages:decoded.decoderMessages,...compareP005Pcm(target,aligned)});
  }
  return {schemaVersion:1,animationId:'shared-alg001-l12-p005',
    status:'decoder-boundary-machine-experiment-not-audio-acceptance',sourceMp3Sha256:expectedSha,
    decoder:execFileSync('ffmpeg',['-version'],{encoding:'utf8'}).split('\n')[0],
    format:'mono float32le at 44100 Hz',sourceFrame:384,boundaryByte,boundaryMp3FrameZeroBased:boundaryMp3Frame,
    precedingDecodedSamples:decodedBefore,mainDataBeginBytes:backPointer,
    continuousDecodedSamples:reference.pcm.length/4,continuousDecoderMessages:reference.decoderMessages,
    comparisons,pcmPersisted:false,playbackEnabled:false,originalRuntimeObserved:false,
    synchronizationAccepted:false,listeningAccepted:false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write','--check'].includes(process.argv[2]),'Usage: --write|--check');
  const output = new URL('decoder-boundary-v1.json',base);
  probeP005DecoderBoundary().then(async result => {
    const bytes = Buffer.from(JSON.stringify(result,null,2)+'\n');
    if(process.argv[2] === '--write') await writeFile(output,bytes,{flag:'wx'});
    else assert.ok((await readFile(output)).equals(bytes),'decoder boundary result drift');
    console.log(JSON.stringify({sha256:sha(bytes),...result},null,2));
  }).catch(error=>{console.error(error.message);process.exitCode=1;});
}
