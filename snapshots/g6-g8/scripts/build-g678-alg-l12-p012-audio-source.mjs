#!/usr/bin/env node
// P012 source audio extraction. This is raw structural evidence, not a playback plan.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateSync} from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_REL = 'G6-G8-shared/ALG001/L12/VB/L12VB07.swf';
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const TRIAGE_REL = 'output/p011-source-triage-20260927-v1/TRIAGE_INVENTORY.json';
const OUT_REL = 'migrations/shared-alg001-l12-p012/audio-source-v1';
const EVIDENCE_REL = 'migrations/shared-alg001-l12-p012/evidence/AUDIO_SOURCE_2026-09-27.md';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';

function readPhysicalFile(file) {
  const resolved = path.resolve(file);
  assert.equal(fs.realpathSync(resolved), resolved, `physical file required: ${resolved}`);
  const before = fs.lstatSync(resolved, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink(), `regular file required: ${resolved}`);
  const bytes = fs.readFileSync(resolved);
  const after = fs.lstatSync(resolved, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs'])
    assert.equal(before[key], after[key], `source changed while reading: ${resolved}`);
  return bytes;
}

export function rawSwfTags(source) {
  assert.equal(source.subarray(0, 3).toString('ascii'), 'CWS');
  const body = inflateSync(source.subarray(8));
  assert.equal(body.length + 8, source.readUInt32LE(4), 'decompressed SWF length');
  const rectBytes = Math.ceil((5 + 4 * (body[0] >> 3)) / 8);
  const start = rectBytes + 4;
  const fps = body.readUInt16LE(rectBytes) / 256;
  const rootFrames = body.readUInt16LE(rectBytes + 2);
  const tags = [];
  const sprites = new Map();
  function scan(begin, end, domain) {
    let p = begin, frame = 1, ended = false;
    while (p < end) {
      const offset = p + 8;
      assert(p + 2 <= end, `truncated tag header in ${domain}`);
      const packed = body.readUInt16LE(p); p += 2;
      const code = packed >> 6;
      let length = packed & 63;
      if (length === 63) {
        assert(p + 4 <= end, `truncated long tag header in ${domain}`);
        length = body.readUInt32LE(p); p += 4;
      }
      assert(p + length <= end, `tag exceeds ${domain}`);
      const payloadOffset = p + 8;
      const payload = body.subarray(p, p + length);
      tags.push({code, domain, frame, offset, payloadOffset, payload});
      if (code === 39) {
        assert(length >= 4, 'short DefineSprite');
        const spriteId = payload.readUInt16LE(0);
        assert(!sprites.has(spriteId), `duplicate sprite ${spriteId}`);
        sprites.set(spriteId, payload.readUInt16LE(2));
        scan(p + 4, p + length, `sprite-${spriteId}`);
      }
      p += length;
      if (code === 1) frame++;
      if (code === 0) {
        assert.equal(p, end, `trailing tags in ${domain}`);
        ended = true;
        break;
      }
    }
    assert(ended, `missing End tag in ${domain}`);
    const observedFrames = frame - 1;
    assert.equal(observedFrames, domain === 'root' ? rootFrames : sprites.get(Number(domain.slice(7))), `frame count ${domain}`);
  }
  scan(start, body.length, 'root');
  return {fps, rootFrames, sprites, tags};
}

// Returns one row for every frame, including frames with no block. Zero-byte
// SoundStreamBlock payloads remain present blocks; they are never silence cues.
export function indexStreamFrames({domain, frameCount, head, blocks, fps}) {
  const byFrame = new Map();
  for (const block of blocks) {
    assert(!byFrame.has(block.frame), `duplicate block ${domain} frame ${block.frame}`);
    assert(block.frame >= 1 && block.frame <= frameCount, `block outside ${domain}`);
    byFrame.set(block.frame, block);
  }
  const rows = [];
  let cumulativeDeclaredSamples = 0;
  let cumulativePayloadBytes = 0;
  for (let frame = 1; frame <= frameCount; frame++) {
    const block = byFrame.get(frame);
    if (!block) {
      rows.push({frame, blockPresent: false, declaredSamples: null, seekSamples: null,
        emptyPayload: null, mp3PayloadBytes: null, mp3PayloadSha256: null,
        cumulativeDeclaredSampleStart: cumulativeDeclaredSamples,
        cumulativeDeclaredSampleEnd: cumulativeDeclaredSamples,
        cumulativePayloadByteStart: cumulativePayloadBytes,
        cumulativePayloadByteEnd: cumulativePayloadBytes});
      continue;
    }
    const startSample = cumulativeDeclaredSamples;
    const startByte = cumulativePayloadBytes;
    cumulativeDeclaredSamples += block.samples;
    cumulativePayloadBytes += block.mp3.length;
    rows.push({frame, blockPresent: true, sourceTagOffset: block.offset,
      payloadOffset: block.payloadOffset, headerHex: block.header.toString('hex'),
      headerAndPayloadBytes: block.body.length, headerAndPayloadSha256: sha(block.body),
      declaredSamples: block.samples, seekSamples: block.seek,
      emptyPayload: block.mp3.length === 0, mp3PayloadBytes: block.mp3.length,
      mp3PayloadSha256: sha(block.mp3),
      cumulativeDeclaredSampleStart: startSample,
      cumulativeDeclaredSampleEnd: cumulativeDeclaredSamples,
      cumulativePayloadByteStart: startByte,
      cumulativePayloadByteEnd: cumulativePayloadBytes});
  }
  const gaps = [];
  for (let i = 0; i < rows.length;) {
    if (rows[i].blockPresent) { i++; continue; }
    const firstFrame = rows[i].frame;
    while (i < rows.length && !rows[i].blockPresent) i++;
    gaps.push({firstFrame, lastFrame: rows[i - 1].frame, frames: i - firstFrame + 1,
      nominalSeconds: (i - firstFrame + 1) / fps});
  }
  return {domain, frameCount, head, rows, gaps,
    totals: {blockCount: blocks.length, missingBlockFrames: frameCount - blocks.length,
      declaredSamples: cumulativeDeclaredSamples, mp3PayloadBytes: cumulativePayloadBytes,
      emptyPayloadFrames: rows.filter(r => r.emptyPayload === true).map(r => r.frame),
      nonzeroSeekFrames: rows.filter(r => r.blockPresent && r.seekSamples !== 0).map(r => r.frame),
      negativeSeekFrames: rows.filter(r => r.blockPresent && r.seekSamples < 0).map(r => r.frame)}};
}

export function coachBranchIndex(rows, labels, returnFrames) {
  assert.equal(labels.length, 4);
  assert.equal(returnFrames.length, 4);
  return labels.map(({label, firstFrame}, i) => {
    const returnFrame = returnFrames[i];
    assert(firstFrame <= returnFrame);
    const selected = rows.filter(r => r.frame >= firstFrame && r.frame <= returnFrame && r.blockPresent);
    return {label, firstFrame, returnFrame, rawInclusiveFrameBounds: [firstFrame, returnFrame],
      blockCount: selected.length,
      emptyPayloadFrames: selected.filter(r => r.emptyPayload).map(r => r.frame),
      declaredSamples: selected.reduce((sum, r) => sum + r.declaredSamples, 0),
      mp3PayloadByteStart: selected[0]?.cumulativePayloadByteStart ?? null,
      mp3PayloadByteEnd: selected.at(-1)?.cumulativePayloadByteEnd ?? null,
      firstSeekSamples: selected[0]?.seekSamples ?? null,
      lastSeekSamples: selected.at(-1)?.seekSamples ?? null};
  });
}

function tool(binary, args, input, maxBuffer = 8 * 1024 * 1024) {
  const result = spawnSync(binary, args, {input, encoding: null, maxBuffer,
    env: {...process.env, LC_ALL: 'C'}});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${binary} failed: ${String(result.stderr).slice(0, 600)}`);
  return result.stdout;
}

function decodeToEof(mp3, ffmpeg) {
  const pcm = tool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-xerror',
    '-f', 'mp3', '-i', 'pipe:0', '-map', '0:a:0', '-ac', '1', '-ar', '22050',
    '-c:a', 'pcm_s16le', '-f', 's16le', 'pipe:1'], mp3);
  assert.equal(pcm.length % 2, 0);
  assert(pcm.length > 0, 'empty decoded stream');
  return {decoder: 'ffmpeg', mode: 'full input to EOF, signed 16-bit mono PCM at 22050 Hz',
    exitCode: 0, decodedSamples: pcm.length / 2, decodedDurationSeconds: pcm.length / 2 / 22050,
    pcmBytes: pcm.length, pcmSha256: sha(pcm)};
}

function sourceStreams(source, triage) {
  const parsed = rawSwfTags(source);
  assert.equal(parsed.fps, 12);
  assert.equal(parsed.rootFrames, 10);
  const expectedDomains = ['sprite-76', 'sprite-86'];
  const headTags = parsed.tags.filter(t => t.code === 18 || t.code === 45);
  assert.deepEqual(headTags.map(t => t.domain).sort(), expectedDomains);
  assert.equal(parsed.tags.filter(t => t.code === 19).length, 143);
  const streams = new Map();
  for (const domain of expectedDomains) {
    const headTag = headTags.find(t => t.domain === domain);
    const bytes = headTag.payload;
    assert.equal(bytes.length, 6);
    assert.equal(bytes[1] >> 4, 2, 'MP3 source stream');
    assert.equal((bytes[1] >> 2) & 3, 2, '22,050 Hz');
    assert.equal((bytes[1] & 1) + 1, 1, 'mono');
    const head = {frame: headTag.frame, tagCode: headTag.code, sourceTagOffset: headTag.offset,
      rawHex: bytes.toString('hex'), codec: 'MP3', sampleRateHz: 22050, channels: 1,
      nominalSamplesPerFrame: bytes.readUInt16LE(2), latencySeekSamples: bytes.readInt16LE(4)};
    const blocks = parsed.tags.filter(t => t.code === 19 && t.domain === domain).map(t => {
      assert(t.payload.length >= 4, `short SoundStreamBlock ${domain} frame ${t.frame}`);
      return {frame: t.frame, offset: t.offset, payloadOffset: t.payloadOffset,
        body: t.payload, header: t.payload.subarray(0, 4), samples: t.payload.readUInt16LE(0),
        seek: t.payload.readInt16LE(2), mp3: t.payload.subarray(4)};
    });
    const frameCount = parsed.sprites.get(Number(domain.slice(7)));
    const index = indexStreamFrames({domain, frameCount, head, blocks, fps: parsed.fps});
    const payload = Buffer.concat(blocks.map(b => b.mp3));
    assert.equal(payload.length, index.totals.mp3PayloadBytes);
    const prior = triage.audio.streams.find(s => s.timelineId === domain);
    assert(prior, `missing frozen triage ${domain}`);
    assert.deepEqual(head.rawHex, prior.head.rawHex);
    assert.equal(index.totals.blockCount, prior.stream.blockCount);
    assert.equal(index.totals.declaredSamples, prior.stream.declaredSampleCountSum);
    assert.equal(sha(payload), prior.stream.mp3PayloadSha256);
    assert.deepEqual(index.totals.emptyPayloadFrames, prior.stream.emptyPayloadFrames);
    assert.deepEqual(index.rows.filter(r => r.blockPresent).map(r => ({frame: r.frame,
      sourceTagOffset: r.sourceTagOffset, payloadOffset: r.payloadOffset,
      headerHex: r.headerHex, sampleCount: r.declaredSamples, seekSamples: r.seekSamples,
      cumulativeDeclaredSampleStart: r.cumulativeDeclaredSampleStart,
      cumulativeDeclaredSampleEnd: r.cumulativeDeclaredSampleEnd,
      payloadBytes: r.headerAndPayloadBytes, payloadSha256: r.headerAndPayloadSha256,
      mp3PayloadBytes: r.mp3PayloadBytes, mp3PayloadSha256: r.mp3PayloadSha256,
      emptyPayload: r.emptyPayload})), prior.blocks, `${domain} block drift`);
    streams.set(domain, {index, payload});
  }
  return streams;
}

function renderEvidence(index) {
  const coach = index.streams.coach, main = index.streams.main;
  return `# P012 embedded audio source extraction — 2026-09-27\n\n` +
    `Source: \`${index.source.path}\`, ${index.source.bytes} bytes, SHA-256 \`${index.source.sha256}\`. ` +
    `This source is the real AWS file, not a compatibility symlink. Extraction was checked against the frozen P012 triage inventory.\n\n` +
    `| Independent stream | SWF domain | Blocks | Declared samples | Raw MP3 bytes | SHA-256 | Full-EOF ffmpeg decoded samples |\n` +
    `| --- | --- | ---: | ---: | ---: | --- | ---: |\n` +
    `| Coach | sprite-76 | ${coach.totals.blockCount} | ${coach.totals.declaredSamples} | ${coach.totals.mp3PayloadBytes} | \`${coach.mp3.sha256}\` | ${coach.decode.decodedSamples} |\n` +
    `| Main | sprite-86 | ${main.totals.blockCount} | ${main.totals.declaredSamples} | ${main.totals.mp3PayloadBytes} | \`${main.mp3.sha256}\` | ${main.decode.decodedSamples} |\n\n` +
    `Each raw MP3 is a byte concatenation of that domain's SoundStreamBlock MP3 payloads in source tag order. ` +
    `The index records every frame, including absent blocks; for each present block it records the signed seek, declared samples, source offsets, header and payload hashes, and byte/sample offsets in the extracted stream. ` +
    `Coach empty-payload frames: ${coach.totals.emptyPayloadFrames.join(', ')}. Main empty-payload frames: ${main.totals.emptyPayloadFrames.join(', ')}. ` +
    `The extracted streams contain no inserted silence or trimming.\n\n` +
    `Coach branch labels and return frames are source action/timeline bounds: ` +
    `${coach.branches.map(b => `${b.label} ${b.firstFrame}–${b.returnFrame}`).join('; ')}. ` +
    `These inclusive ranges are raw index ranges, not decoded, trimmed, or approved playback clips.\n\n` +
    `Unresolved: signed per-block seeks and the head latency marker have no selected Flash-to-Web synchronization rule; ` +
    `an empty MP3 block is not evidence of audible silence; absent block frames are timeline gaps, not proof of pause; ` +
    `source return-frame action ordering may change branch playback bounds. The independent SA sidecar was not spliced. ` +
    `Full-EOF decode proves local decoder readability only. No original-runtime listening, language verification, human audio acceptance, or product registration is claimed.\n\n` +
    `Reproduce with \`node scripts/build-g678-alg-l12-p012-audio-source.mjs --check\`.\n`;
}

function build() {
  assert.equal(fs.realpathSync(SOURCE_ROOT), SOURCE_ROOT, 'source root must be real');
  assert(fs.lstatSync(SOURCE_ROOT).isDirectory() && !fs.lstatSync(SOURCE_ROOT).isSymbolicLink());
  const source = readPhysicalFile(path.join(SOURCE_ROOT, SOURCE_REL));
  assert.equal(sha(source), SOURCE_SHA, 'source hash drift');
  const triageBytes = readPhysicalFile(path.join(ROOT, TRIAGE_REL));
  const triage = JSON.parse(triageBytes);
  assert.equal(triage.inputs.source.sha256, SOURCE_SHA);
  const streams = sourceStreams(source, triage);
  const ffmpeg = '/opt/homebrew/bin/ffmpeg';
  const ffmpegVersion = tool(ffmpeg, ['-version'], undefined).toString('utf8').split('\n')[0];
  const make = (domain, file) => {
    const {index, payload} = streams.get(domain);
    return {...index, mp3: {file, bytes: payload.length, sha256: sha(payload)},
      decode: decodeToEof(payload, ffmpeg)};
  };
  const coach = make('sprite-76', 'coach-sprite-76.mp3');
  const main = make('sprite-86', 'main-sprite-86.mp3');
  coach.branches = coachBranchIndex(coach.rows, triage.coach.labels, triage.coach.returnFrames);
  for (const branch of coach.branches) {
    const bytes = streams.get('sprite-76').payload.subarray(branch.mp3PayloadByteStart, branch.mp3PayloadByteEnd);
    branch.mp3PayloadBytes = bytes.length;
    branch.mp3PayloadSha256 = sha(bytes);
  }
  const index = {schemaVersion: 1, kind: 'p012-two-domain-raw-swf-audio-index-v1',
    claimBoundary: 'Raw embedded stream extraction and full-EOF local decoder measurement only; no playback synchronization, silence, language, listening or acceptance claim.',
    source: {path: path.join(SOURCE_ROOT, SOURCE_REL), bytes: source.length, sha256: SOURCE_SHA},
    frozenTriage: {path: TRIAGE_REL, bytes: triageBytes.length, sha256: sha(triageBytes)},
    decoder: {path: ffmpeg, version: ffmpegVersion, outputFormat: 's16le mono 22050 Hz'},
    fps: 12, streams: {coach, main},
    uncertainty: ['Head latency/seek and per-block signed seek fields are retained without applying a trim or timing rule.',
      'Empty MP3 payload blocks are present source tags; they are not inserted or interpreted as silence.',
      'Frames without a block are timeline gaps; they do not prove a pause or silence.',
      'Coach branch bounds are inclusive source frame/index ranges, not verified Flash playback bounds.',
      'No SA sidecar content is included in either extracted stream.']};
  return {index, files: new Map([
    [path.join(ROOT, OUT_REL, 'coach-sprite-76.mp3'), streams.get('sprite-76').payload],
    [path.join(ROOT, OUT_REL, 'main-sprite-86.mp3'), streams.get('sprite-86').payload],
    [path.join(ROOT, OUT_REL, 'raw-index.json'), Buffer.from(json(index))],
    [path.join(ROOT, EVIDENCE_REL), Buffer.from(renderEvidence(index))]])};
}

function main() {
  const mode = process.argv[2];
  assert(['--write', '--check'].includes(mode) && process.argv.length === 3,
    'usage: build-g678-alg-l12-p012-audio-source.mjs --write | --check');
  const {index, files} = build();
  if (mode === '--write') {
    for (const [file, bytes] of files) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, bytes, {flag: 'wx'});
    }
  } else {
    for (const [file, bytes] of files) assert.deepEqual(readPhysicalFile(file), bytes, `output drift: ${file}`);
  }
  console.log(JSON.stringify({mode, index: path.join(OUT_REL, 'raw-index.json'),
    streams: Object.fromEntries(Object.entries(index.streams).map(([name, stream]) => [name,
      {blocks: stream.totals.blockCount, bytes: stream.mp3.bytes,
        payloadSha256: stream.mp3.sha256, decodedSamples: stream.decode.decodedSamples}]))}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
