#!/usr/bin/env node

import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

import {parseEmbeddedAudioPayloads} from './build-g4-l3-embedded-audio-archive.mjs';

const run = promisify(execFile);
const projectRootDefault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRootDefault = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sourceRelative = 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const saRelative = 'G6-G8-shared/ALG001/L12/SA/L12RW05.mp3';
const outputRelative = 'migrations/shared-alg001-l12-p005/audio-source-v1';
const sourceSha256 = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const saSha256 = '1cff13a53e883054dd8c319528cc17e6a6ca1589e776cfc427ba60e71f4f5ea1';
const payloadSha256 = '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af';
const maxOutputBytes = 20 * 1024 * 1024;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

async function physicalFile(filePath, expectedBytes, expectedHash, label) {
  const before = await lstat(filePath, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(), `${label} must be a physical file`);
  assert.equal(await realpath(filePath), filePath, `${label} path must not traverse a symlink`);
  const bytes = await readFile(filePath);
  const after = await lstat(filePath, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'mode']) {
    assert.equal(after[key], before[key], `${label} changed during read: ${key}`);
  }
  if (expectedBytes !== null) assert.equal(bytes.length, expectedBytes, `${label} byte length drift`);
  assert.equal(sha256(bytes), expectedHash, `${label} SHA-256 drift`);
  return bytes;
}

async function probe(filePath) {
  const {stdout} = await run('ffprobe', [
    '-v', 'error', '-show_entries',
    'stream=codec_name,sample_rate,channels,duration:format=duration,size',
    '-of', 'json', filePath,
  ], {maxBuffer: 1024 * 1024});
  const result = JSON.parse(stdout);
  assert.equal(result.streams?.length, 1, 'ffprobe must find one audio stream');
  const stream = result.streams[0];
  assert.equal(stream.codec_name, 'mp3');
  return {
    codec: stream.codec_name,
    sampleRateHz: Number(stream.sample_rate),
    channels: stream.channels,
    durationSeconds: Number(result.format.duration),
    bytes: Number(result.format.size),
  };
}

function blockGroups(blocks) {
  const groups = [];
  for (const block of blocks) {
    const previous = groups.at(-1);
    if (previous && block.localFrame === previous.lastFrame + 1) {
      previous.lastFrame = block.localFrame;
      previous.blockCount += 1;
    } else {
      groups.push({firstFrame: block.localFrame, lastFrame: block.localFrame, blockCount: 1});
    }
  }
  return groups;
}

function buildTiming(stream, parsed, saProbe, mp3Probe) {
  const blocks = stream.blocks.map((block) => ({
    blockIndex: block.blockIndex,
    localFrame: block.localFrame,
    frameStartNumerator: block.localFrame - 1,
    tagOrdinalInDomain: block.tagOrdinalInDomain,
    tagBodyBytes: block.tagBodyBytes,
    tagBodySha256: block.tagBodySha256,
    rawMp3BlockHeaderHex: block.codecWrapperHeader.hex,
    sampleCount: block.codecWrapperHeader.explicitSampleCount,
    signedSeekSamples: block.codecWrapperHeader.mp3SeekSamples,
    payloadOffset: block.payload.byteOffsetInStreamArchive,
    payloadBytes: block.payload.byteLength,
    payloadSha256: block.payload.sha256,
  }));
  const groups = blockGroups(blocks);
  const missingBlockIntervals = groups.slice(1).map((group, index) => ({
    firstFrame: groups[index].lastFrame + 1,
    lastFrame: group.firstFrame - 1,
    frameCount: group.firstFrame - groups[index].lastFrame - 1,
    audibleMeaning: 'undetermined; absent stream blocks do not establish silence',
  }));
  return {
    schemaVersion: 1,
    animationId: 'shared-alg001-l12-p005',
    status: 'source-bound-machine-timing-only',
    source: {path: path.join(sourceRootDefault, sourceRelative), bytes: parsed.source.compressedBytes,
      sha256: sourceSha256, signature: parsed.source.signature,
      uncompressedBytes: parsed.source.declaredUncompressedBytes,
      uncompressedSha256: parsed.source.uncompressedSha256},
    extraction: {parser: 'scripts/build-g4-l3-embedded-audio-archive.mjs#parseEmbeddedAudioPayloads',
      method: 'concatenate source-order MP3 payload bytes after each four-byte SWF SoundStreamBlock header',
      output: `${outputRelative}/sprite-391-source-stream.mp3`,
      bytes: stream.payload.byteLength, sha256: stream.payload.sha256},
    domain: {id: 'sprite-391', declaredFrames: 968, fpsNumerator: 12, fpsDenominator: 1,
      frameTimeRule: 'frameStartNumerator / 12 seconds; parent entry and runtime clock unverified'},
    streamHead: stream.head,
    tagCounts: parsed.tagCounts,
    blockCount: stream.blockCount,
    totalBlockHeaderSampleCount: stream.totalBlockHeaderSampleCount,
    sampleCountDurationSeconds: stream.totalBlockHeaderSampleCount / stream.head.sampleRateHz,
    blockGroups: groups,
    missingBlockIntervals,
    blocks,
    ffprobe: {extractedMp3: mp3Probe, separateLessonSaCandidate: {
      path: path.join(sourceRootDefault, saRelative), sha256: saSha256, ...saProbe,
      association: 'catalog candidate only; trigger, language, and stream relationship unverified',
    }},
    limits: {noPcmDump: true, playbackEnabled: false, listeningAccepted: false,
      languageAccepted: false, synchronizationAccepted: false,
      note: 'ffprobe duration and source block sample counts are machine observations, not original-host timing or audible-content evidence'},
  };
}

export async function extractG678AlgL12P005Stream({
  sourceRoot = sourceRootDefault,
  projectRoot = projectRootDefault,
  check = false,
} = {}) {
  const root = path.resolve(sourceRoot);
  const rootStat = await lstat(root);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink(), 'source root must be a real directory');
  assert.equal(await realpath(root), root, 'source root must not traverse a symlink');
  assert.equal(root, sourceRootDefault, 'P005 requires the reviewed physical AWS source root');
  const requestedDestination = path.resolve(projectRoot);
  const destinationStat = await lstat(requestedDestination);
  assert.ok(destinationStat.isDirectory() && !destinationStat.isSymbolicLink(),
    'project root must be a real directory');
  const destination = await realpath(requestedDestination);
  const sourceBytes = await physicalFile(path.join(root, sourceRelative), 1950595, sourceSha256, 'P005 SWF');
  await physicalFile(path.join(root, saRelative), 101472, saSha256, 'P005 lesson-SA candidate');
  const parsed = parseEmbeddedAudioPayloads(sourceBytes);
  assert.deepEqual(parsed.tagCounts, {DefineSound: 0, SoundStreamHead: 1, SoundStreamHead2: 0, SoundStreamBlock: 902});
  assert.equal(parsed.soundStreams.length, 1);
  const stream = parsed.soundStreams[0];
  assert.equal(stream.ownerDomainId, 'sprite-391');
  assert.equal(stream.headLocalFrame, 1);
  assert.equal(stream.head.formatCode, 2);
  assert.equal(stream.head.sampleRateHz, 44100);
  assert.equal(stream.head.channels, 1);
  assert.equal(stream.head.nominalSamplesPerBlock, 3675);
  assert.equal(stream.head.mp3LatencySeek, 1695);
  assert.equal(stream.blockCount, 902);
  assert.equal(stream.blocks[0].localFrame, 23);
  assert.equal(stream.blocks[316].localFrame, 339);
  assert.equal(stream.blocks[317].localFrame, 384);
  assert.equal(stream.blocks.at(-1).localFrame, 968);
  assert.equal(stream.totalBlockHeaderSampleCount, 3309696);
  assert.equal(stream.payload.byteLength, 597584);
  assert.equal(stream.payload.sha256, payloadSha256);
  assert.equal(sha256(stream._payloadBytes), payloadSha256);
  const temporary = await mkdtemp(path.join(tmpdir(), 'g678-alg-l12-p005-audio-'));
  try {
    const temporaryMp3 = path.join(temporary, 'source-stream.mp3');
    await writeFile(temporaryMp3, stream._payloadBytes, {flag: 'wx'});
    const [mp3Probe, saProbe] = await Promise.all([
      probe(temporaryMp3), probe(path.join(root, saRelative)),
    ]);
    assert.equal(mp3Probe.sampleRateHz, 44100);
    assert.equal(mp3Probe.channels, 1);
    assert.equal(mp3Probe.bytes, stream.payload.byteLength);
    assert.equal(saProbe.sampleRateHz, 48000);
    assert.equal(saProbe.channels, 1);
    assert.equal(saProbe.bytes, 101472);
    assert.equal(saProbe.durationSeconds, 7.248);
    const receipt = jsonBytes(buildTiming(stream, parsed, saProbe, mp3Probe));
    const outputs = [
      {path: path.join(destination, outputRelative, 'sprite-391-source-stream.mp3'), bytes: stream._payloadBytes},
      {path: path.join(destination, outputRelative, 'machine-timing-receipt.json'), bytes: receipt},
    ];
    assert.ok(outputs.reduce((sum, output) => sum + output.bytes.length, 0) < maxOutputBytes,
      'bounded output exceeds 20 MiB');
    if (check) {
      assert.equal(await realpath(path.join(destination, outputRelative)),
        path.join(destination, outputRelative), 'output directory must not traverse a symlink');
      for (const output of outputs) {
        const entry = await lstat(output.path);
        assert.ok(entry.isFile() && !entry.isSymbolicLink(), `output must be a real file: ${output.path}`);
        assert.ok((await readFile(output.path)).equals(output.bytes), `output differs: ${output.path}`);
      }
    } else {
      await mkdir(path.join(destination, outputRelative), {recursive: true});
      assert.equal(await realpath(path.join(destination, outputRelative)),
        path.join(destination, outputRelative), 'output directory must not traverse a symlink');
      // Preflight both targets so an existing receipt never causes a partial new write.
      for (const output of outputs) {
        const exists = await lstat(output.path).then(() => true, (error) => {
          if (error.code === 'ENOENT') return false;
          throw error;
        });
        if (exists) throw new Error(`output already exists: ${output.path}`);
      }
      for (const output of outputs) await writeFile(output.path, output.bytes, {flag: 'wx'});
    }
    return {mode: check ? 'check' : 'write', sourceSha256, payloadSha256,
      blockCount: stream.blockCount, sampleCount: stream.totalBlockHeaderSampleCount,
      extractedProbeSeconds: mp3Probe.durationSeconds, lessonSaProbeSeconds: saProbe.durationSeconds,
      outputs: outputs.map((output) => ({path: path.relative(destination, output.path),
        bytes: output.bytes.length, sha256: sha256(output.bytes)})),
      acceptance: 'machine-evidence-only'};
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node scripts/extract-g678-alg-l12-p005-stream.mjs --write|--check');
    process.exitCode = 2;
  } else {
    extractG678AlgL12P005Stream({check: mode === '--check'})
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => { console.error(error.message); process.exitCode = 1; });
  }
}
