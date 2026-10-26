#!/usr/bin/env node
/** P009 structural/decode evidence only. No playback, language or runtime acceptance. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inflateSync} from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migration = 'migrations/shared-alg001-l12-p009';
const output = `${migration}/audio-analysis-v1`;
const sourcePath = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
const sourceSha256 = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const blockPath = `${migration}/audit/source-stream-blocks.json`;
const blockSha256 = 'cc20000fdef998ecd62aac8454f8f1edf0e9ad8c5595140e9899354256036c4a';
const streamPath = `${migration}/audit/source-stream.mp3`;
const streamSha256 = '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e';
const toolPaths = {ffmpeg: '/opt/homebrew/bin/ffmpeg', ffprobe: '/opt/homebrew/bin/ffprobe'};
const specification = {title: 'Adobe SWF File Format Specification v19',
  url: 'https://open-flash.github.io/mirrors/swf-spec-19.pdf',
  printedPages: [185, 186, 190, 191], accessedOn: '2026-09-27',
  boundary: 'Original Adobe document on a public mirror; format rules, not P009 runtime evidence'};

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const absolute = name => path.isAbsolute(name) ? name : path.join(root, name);
const relative = name => name.startsWith(`${root}/`) ? path.relative(root, name) : name;
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function stableRead(name, expected) {
  const filename = absolute(name);
  const before = fs.lstatSync(filename);
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, `not a regular single-link file: ${name}`);
  const bytes = fs.readFileSync(filename);
  const after = fs.lstatSync(filename);
  assert.deepEqual([after.ino, after.size, after.mtimeMs], [before.ino, before.size, before.mtimeMs], `changed while reading: ${name}`);
  const hash = sha256(bytes);
  if (expected) assert.equal(hash, expected, `hash mismatch: ${name}`);
  return {bytes, pin: {path: relative(filename), bytes: bytes.length, sha256: hash}};
}

/** Bounded source tag walk; offsets remain those of the reconstructed FWS view. */
export function readP009SwfStream(encoded) {
  assert.equal(encoded.subarray(0, 3).toString(), 'CWS');
  assert.equal(encoded[3], 6);
  const swf = Buffer.concat([encoded.subarray(0, 8), inflateSync(encoded.subarray(8))]);
  swf[0] = 0x46;
  assert.equal(swf.length, encoded.readUInt32LE(4));
  const rectBytes = Math.ceil((5 + 4 * (swf[8] >>> 3)) / 8);
  const headerEnd = 8 + rectBytes + 4;
  const fps = swf.readUInt16LE(8 + rectBytes) / 256;
  const rootFrameCount = swf.readUInt16LE(8 + rectBytes + 2);
  const timelines = [];
  function walk(start, end, timelineId, declaredFrames, nesting = 0) {
    assert(nesting <= 2, 'unexpected nested timeline');
    let cursor = start, frame = 1;
    const heads = [], blocks = [], actions = [];
    let ended = false;
    while (cursor < end) {
      assert(cursor + 2 <= end, 'truncated tag header');
      const sourceTagOffset = cursor;
      const tag = swf.readUInt16LE(cursor); cursor += 2;
      const type = tag >>> 6;
      let length = tag & 63;
      if (length === 63) {assert(cursor + 4 <= end); length = swf.readUInt32LE(cursor); cursor += 4;}
      const payloadOffset = cursor;
      assert(cursor + length <= end, 'tag extends beyond timeline');
      const payload = swf.subarray(cursor, cursor + length);
      if (type === 39) {
        assert(length >= 4);
        const id = payload.readUInt16LE(0);
        walk(cursor + 4, cursor + length, `sprite-${id}`, payload.readUInt16LE(2), nesting + 1);
      } else if (type === 18 || type === 45) {
        assert.equal(length, 6, 'P009 MP3 head must have latency');
        heads.push({timelineId, frame, type, sourceTagOffset, payloadOffset,
          rawHex: payload.toString('hex'), bytes: length, sha256: sha256(payload),
          compression: payload[1] >>> 4,
          playbackSampleRateHz: [5512.5, 11025, 22050, 44100][(payload[0] >>> 2) & 3],
          streamSampleRateHz: [5512.5, 11025, 22050, 44100][(payload[1] >>> 2) & 3],
          playbackChannels: (payload[0] & 1) + 1, streamChannels: (payload[1] & 1) + 1,
          playbackSampleSizeBits: payload[0] & 2 ? 16 : 8, streamSampleSizeBits: payload[1] & 2 ? 16 : 8,
          nominalSamplesPerFrame: payload.readUInt16LE(2), latencySeekSamples: payload.readInt16LE(4)});
      } else if (type === 19) {
        assert(length >= 4, 'truncated MP3 stream wrapper');
        blocks.push({ordinal: blocks.length + 1, timelineId, frame, sourceTagOffset, payloadOffset,
          payloadBytes: length, payloadSha256: sha256(payload), headerHex: payload.subarray(0, 4).toString('hex'),
          sampleCount: payload.readUInt16LE(0), seekSamples: payload.readInt16LE(2),
          mp3PayloadBytes: length - 4, mp3PayloadSha256: sha256(payload.subarray(4)), payload: payload.subarray(4)});
      } else if ([12, 59, 82].includes(type)) actions.push({frame, type, sourceTagOffset});
      cursor += length;
      if (type === 1) frame++;
      if (type === 0) {assert.equal(cursor, end, 'bytes after End tag'); ended = true; break;}
    }
    assert(ended, 'timeline has no End');
    assert.equal(frame - 1, declaredFrames, 'ShowFrame/declaration mismatch');
    timelines.push({timelineId, declaredFrames, heads, blocks, actions});
  }
  walk(headerEnd, swf.length, 'root', rootFrameCount);
  const main = timelines.find(item => item.timelineId === 'sprite-62');
  assert(main && timelines.length === 2, 'P009 root/main domain mismatch');
  assert.equal(fps, 12); assert.equal(rootFrameCount, 10); assert.equal(main.declaredFrames, 394);
  assert.equal(main.heads.length, 1); assert.equal(main.blocks.length, 393); assert.equal(main.actions.length, 0);
  return {fps, rootFrameCount, main, uncompressedFwsView: {bytes: swf.length, sha256: sha256(swf)}};
}

/** Whole Layer III frame parsing; no byte resynchronization or hidden tail discard. */
export function parseMp3Frames(bytes) {
  const frames = [];
  let cursor = 0, sampleStart = 0;
  while (cursor < bytes.length) {
    assert(cursor + 4 <= bytes.length, 'truncated MP3 header');
    const h = bytes.readUInt32BE(cursor);
    assert.equal(h >>> 21, 0x7ff, `MP3 sync at byte ${cursor}`);
    const versionCode = (h >>> 19) & 3, layer = (h >>> 17) & 3;
    assert.notEqual(versionCode, 1, 'reserved MPEG version'); assert.equal(layer, 1, 'not Layer III');
    const version = versionCode === 3 ? 1 : versionCode === 2 ? 2 : 2.5;
    const bitrateIndex = (h >>> 12) & 15, rateIndex = (h >>> 10) & 3;
    assert(bitrateIndex > 0 && bitrateIndex < 15 && rateIndex < 3, 'unsupported/free/reserved MP3 rate');
    const bitrateKbps = (version === 1 ? [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]
      : [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[bitrateIndex];
    const sampleRateHz = [44100,48000,32000][rateIndex] / (version === 1 ? 1 : version === 2 ? 2 : 4);
    const padding = (h >>> 9) & 1, channelMode = (h >>> 6) & 3;
    const channels = channelMode === 3 ? 1 : 2;
    const crcProtected = ((h >>> 16) & 1) === 0;
    const frameBytes = Math.floor((version === 1 ? 144 : 72) * bitrateKbps * 1000 / sampleRateHz) + padding;
    assert(cursor + frameBytes <= bytes.length, 'truncated MP3 frame');
    const sideOffset = cursor + 4 + (crcProtected ? 2 : 0);
    const sideBytes = version === 1 ? (channels === 1 ? 17 : 32) : (channels === 1 ? 9 : 17);
    assert(sideOffset + sideBytes <= cursor + frameBytes, 'truncated MP3 side information');
    const mainDataBeginBytes = version === 1 ? bytes[sideOffset] * 2 + (bytes[sideOffset + 1] >>> 7) : bytes[sideOffset];
    const samples = version === 1 ? 1152 : 576;
    frames.push({ordinal: frames.length + 1, byteOffset: cursor, headerHex: bytes.subarray(cursor, cursor + 4).toString('hex'),
      frameBytes, mpegVersion: version, layer: 'III', bitrateKbps, sampleRateHz, samples, channels,
      channelMode, padding, crcProtected, mainDataBeginBytes, sampleStart, sampleEnd: sampleStart + samples});
    cursor += frameBytes; sampleStart += samples;
  }
  assert(frames.length > 0, 'no MP3 frames');
  return frames;
}

export function analyzeBlockTiming(blocks, frames, head, fps, terminalFrame) {
  const first = blocks.find(block => block.mp3PayloadBytes > 0);
  assert(first); assert.equal(first.seekSamples, head.latencySeekSamples, 'first seek/head latency mismatch');
  const rate = head.streamSampleRateHz, exactSamplesPerFrame = rate / fps;
  let bytePrefix = 0, declaredPrefix = 0;
  const rows = blocks.map(block => {
    const packetFrames = frames.filter(frame => frame.byteOffset >= bytePrefix && frame.byteOffset < bytePrefix + block.mp3PayloadBytes);
    assert.equal(packetFrames.reduce((sum, frame) => sum + frame.frameBytes, 0), block.mp3PayloadBytes, 'block fragments an MP3 frame');
    assert.equal(packetFrames.reduce((sum, frame) => sum + frame.samples, 0), block.sampleCount, 'declared/MP3 frame samples differ');
    const rawPrefixPlusSeek = block.mp3PayloadBytes === 0 ? null : declaredPrefix + block.seekSamples;
    const continuousHypothesisSourceSample = head.latencySeekSamples + (block.frame - first.frame) * exactSamplesPerFrame;
    const row = {frame: block.frame, mp3PayloadBytes: block.mp3PayloadBytes, mp3Frames: packetFrames.length,
      declaredSamples: block.sampleCount, seekSamples: block.seekSamples, decodedPrefix: declaredPrefix,
      rawPrefixPlusSeek, emptyBlockCoordinateEstablished: block.mp3PayloadBytes !== 0,
      continuousHypothesisSourceSample,
      continuousMinusRaw: rawPrefixPlusSeek === null ? null : continuousHypothesisSourceSample - rawPrefixPlusSeek,
      rawPlusExtraHeadLatencyArithmetic: rawPrefixPlusSeek === null ? null
        : rawPrefixPlusSeek + (block.frame === first.frame ? 0 : head.latencySeekSamples)};
    bytePrefix += block.mp3PayloadBytes; declaredPrefix += block.sampleCount;
    return row;
  });
  assert.equal(bytePrefix, frames.reduce((sum, frame) => sum + frame.frameBytes, 0));
  const ordinary = rows.filter(row => row.frame >= 4 && row.rawPrefixPlusSeek !== null);
  const nonempty = rows.filter(row => row.rawPrefixPlusSeek !== null);
  const recurrence = ordinary.slice(1).map((row, index) => ({frame: row.frame,
    delta: row.rawPrefixPlusSeek - ordinary[index].rawPrefixPlusSeek,
    expected: head.nominalSamplesPerFrame * (row.frame - ordinary[index].frame)}));
  const decodedSamples = frames.at(-1).sampleEnd;
  const last = rows.at(-1);
  const startTimelineSample = (first.frame - 1) * exactSamplesPerFrame;
  const terminalStartSample = (terminalFrame - 1) * exactSamplesPerFrame;
  const audioEndSample = startTimelineSample + decodedSamples - head.latencySeekSamples;
  return {fps, sampleRateHz: rate, nominalSamplesPerFrame: head.nominalSamplesPerFrame, exactSamplesPerFrame,
    latencySeekSamples: head.latencySeekSamples, firstBlockFrame: first.frame, terminalFrame,
    emptyPayloadFrames: rows.filter(row => row.mp3PayloadBytes === 0).map(row => row.frame), declaredSampleCountSum: declaredPrefix,
    ordinarySeekRecurrence: {firstFrame: ordinary[0].frame, lastFrame: ordinary.at(-1).frame,
      incrementsChecked: recurrence.length, everyIncrementMatchesNominal: recurrence.every(x => x.delta === x.expected),
      mismatches: recurrence.filter(x => x.delta !== x.expected)},
    nonemptyBlockOrdinalEquation: {nonemptyBlocks: nonempty.length,
      equation: 'rawPrefixPlusSeek = latencySeekSamples + (nonemptyBlockOrdinal - 1) * nominalSamplesPerFrame',
      everyRowMatches: nonempty.every((row, index) => row.rawPrefixPlusSeek === head.latencySeekSamples + index * head.nominalSamplesPerFrame),
      boundary: 'Observed authored arithmetic over nonempty blocks; not a playback clock or a Flash seek algorithm.'},
    initialNonemptyDelta: {fromFrame: first.frame, toFrame: ordinary[0].frame,
      rawSamples: ordinary[0].rawPrefixPlusSeek - rows[0].rawPrefixPlusSeek,
      timelineSamples: (ordinary[0].frame - first.frame) * exactSamplesPerFrame},
    continuousHypothesis: {status: 'explicit-modern-candidate-arithmetic-only; no playback schedule admitted',
      firstFrame: first.frame, sourceStartSample: head.latencySeekSamples, sourceEndSample: decodedSamples,
      timelineStartSample: startTimelineSample, audioEndTimelineSample: audioEndSample,
      terminalStartTimelineSample: terminalStartSample,
      postrollSamplesIfTerminalHeldAtFrameStart: terminalStartSample - audioEndSample,
      postrollMillisecondsIfTerminalHeldAtFrameStart: (terminalStartSample - audioEndSample) / rate * 1000,
      terminalSourceSample: head.latencySeekSamples + terminalStartSample - startTimelineSample,
      noInsertedEmptyBlockGap: true, noNominalRateStretch: true,
      terminalHoldIsModernPolicy: true, sourceHasTerminalStopAction: false},
    terminalArithmetic: {rawPrefixPlusSeek: last.rawPrefixPlusSeek,
      decodedSamplesAfterRawCoordinate: decodedSamples - last.rawPrefixPlusSeek,
      rawPlusExtraHeadLatencyArithmetic: last.rawPlusExtraHeadLatencyArithmetic,
      decodedSamplesAfterExtraLatencyArithmetic: decodedSamples - last.rawPlusExtraHeadLatencyArithmetic,
      continuousMinusRaw: last.continuousMinusRaw,
      boundary: 'These are distinct arithmetic models. Neither raw nor extra-latency arithmetic is a validated full-buffer Flash seek algorithm.'},
    rows};
}

export function summarizePcm(bytes, first = 0, last = bytes.length / 4) {
  assert.equal(bytes.length % 4, 0, 'partial f32 sample');
  assert(Number.isSafeInteger(first) && Number.isSafeInteger(last) && first >= 0 && first <= last && last <= bytes.length / 4);
  let peak = 0, squared = 0, nonzero = 0, firstNonzero = null, lastNonzero = null;
  for (let i = first; i < last; i++) {
    const value = bytes.readFloatLE(i * 4); assert(Number.isFinite(value), 'nonfinite PCM sample');
    peak = Math.max(peak, Math.abs(value)); squared += value * value;
    if (value !== 0) {nonzero++; firstNonzero ??= i; lastNonzero = i;}
  }
  return {firstSampleInclusive: first, lastSampleExclusive: last, samples: last - first,
    peak, rms: last > first ? Math.sqrt(squared / (last - first)) : 0, nonzero, firstNonzero, lastNonzero};
}

function runTool(filename, args, input) {
  const result = spawnSync(filename, args, {cwd: root, input, maxBuffer: 32 * 1024 * 1024});
  assert(!result.error && result.status === 0, `${filename} failed: ${result.error?.message ?? result.stderr?.toString()}`);
  return {stdout: result.stdout, stderr: result.stderr};
}

export function runP009Analysis({check = false} = {}) {
  assert.equal(fs.realpathSync(sourcePath), sourcePath, 'source path traverses a symlink');
  const source = stableRead(sourcePath, sourceSha256), blockFile = stableRead(blockPath, blockSha256);
  const encoded = stableRead(streamPath, streamSha256), audit = JSON.parse(blockFile.bytes);
  assert.equal(source.bytes.length, 165405); assert.equal(encoded.bytes.length, 162890);
  assert.equal(audit.sourceSha256, sourceSha256);
  const swf = readP009SwfStream(source.bytes), head = swf.main.heads[0];
  assert.equal(head.rawHex, '0a2a2d078906'); assert.equal(head.compression, 2);
  for (const key of ['rawHex','bytes','sha256','compression','playbackSampleRateHz','streamSampleRateHz','playbackChannels','streamChannels',
    'playbackSampleSizeBits','streamSampleSizeBits','nominalSamplesPerFrame','latencySeekSamples']) assert.deepEqual(head[key], audit.streamHead[key]);
  assert.deepEqual(swf.main.blocks.map(block => block.frame), Array.from({length: 393}, (_, i) => i + 2));
  for (let i = 0; i < swf.main.blocks.length; i++) {
    const block = swf.main.blocks[i], recorded = audit.blocks[i];
    for (const key of ['ordinal','timelineId','frame','sourceTagOffset','payloadOffset','payloadBytes','payloadSha256','headerHex',
      'sampleCount','seekSamples','mp3PayloadBytes','mp3PayloadSha256']) assert.deepEqual(block[key], recorded[key], `source block ${i + 1}: ${key}`);
  }
  assert(Buffer.concat(swf.main.blocks.map(block => block.payload)).equals(encoded.bytes), 'reconstructed MP3 differs');
  const sidecar = stableRead(audit.sidecar.path, audit.sidecar.sha256);
  assert.equal(sidecar.bytes.length, audit.sidecar.bytes); assert.notEqual(sidecar.pin.sha256, encoded.pin.sha256);
  const mp3Frames = parseMp3Frames(encoded.bytes);
  assert(mp3Frames.every(frame => frame.mpegVersion === 2 && frame.samples === 576 && frame.sampleRateHz === 22050 && frame.channels === 1));
  const timing = analyzeBlockTiming(swf.main.blocks, mp3Frames, head, swf.fps, swf.main.declaredFrames);
  assert.equal(timing.declaredSampleCountSum, audit.stream.declaredSampleCountSum);
  const tools = {};
  for (const [name, entry] of Object.entries(toolPaths)) {
    const actual = fs.realpathSync(entry), binary = stableRead(actual);
    const version = runTool(actual, ['-version']).stdout.toString();
    const coreLibraries = ['avutil','avcodec','avformat','avdevice','avfilter','swscale','swresample'].map(library => {
      const folder = path.resolve(path.dirname(actual), '../lib');
      const filename = fs.readdirSync(folder).find(file => new RegExp(`^lib${library}\\.\\d+\\.dylib$`).test(file));
      assert(filename, `missing FFmpeg core library ${library}`);
      return stableRead(fs.realpathSync(path.join(folder, filename))).pin;
    });
    tools[name] = {...binary.pin, version, versionSha256: sha256(Buffer.from(version)), coreLibraries};
  }
  const probeArgs = ['-v','error','-f','mp3','-count_frames','-count_packets','-show_streams','-show_format','-of','json',streamPath];
  const packetArgs = ['-v','error','-f','mp3','-show_packets','-show_entries','packet=pts,pts_time,duration,duration_time,size,pos,flags:packet_side_data','-of','json',streamPath];
  const frameArgs = ['-v','error','-f','mp3','-show_frames','-show_entries','frame=nb_samples,sample_fmt,sample_rate,channels,channel_layout,pts_time,best_effort_timestamp_time:frame_side_data','-of','json',streamPath];
  const probeBytes = runTool(tools.ffprobe.path, probeArgs).stdout;
  const packetBytes = runTool(tools.ffprobe.path, packetArgs).stdout;
  const frameBytes = runTool(tools.ffprobe.path, frameArgs).stdout;
  const probe = JSON.parse(probeBytes), packets = JSON.parse(packetBytes).packets, decodedFrames = JSON.parse(frameBytes).frames;
  assert.equal(probe.streams.length, 1); assert.equal(probe.streams[0].sample_rate, '22050'); assert.equal(probe.streams[0].channels, 1);
  assert.equal(Number(probe.streams[0].nb_read_frames), mp3Frames.length); assert.equal(Number(probe.streams[0].nb_read_packets), mp3Frames.length);
  assert.equal(packets.length, mp3Frames.length); assert.equal(decodedFrames.length, mp3Frames.length);
  assert(packets.every((packet, index) => Number(packet.size) === mp3Frames[index].frameBytes && Number(packet.pos) === mp3Frames[index].byteOffset));
  assert(decodedFrames.every((frame, index) => frame.nb_samples === mp3Frames[index].samples && frame.channels === 1));
  const decodeArgs = ['-v','error','-nostdin','-xerror','-f','mp3','-i','pipe:0','-map','0:a:0','-c:a','pcm_f32le','-f','f32le','pipe:1'];
  const decoded = runTool(tools.ffmpeg.path, decodeArgs, encoded.bytes);
  const pcm = decoded.stdout;
  assert.equal(pcm.length / 4, timing.declaredSampleCountSum); assert.equal(decodedFrames.reduce((sum, frame) => sum + frame.nb_samples, 0), pcm.length / 4);
  stableRead(streamPath, streamSha256); stableRead(sourcePath, sourceSha256); stableRead(blockPath, blockSha256);
  const measurements = {format: 'untrimmed mono f32le at native 22050 Hz', bytes: pcm.length, sha256: sha256(pcm),
    sampleRateHz: 22050, channels: 1, samples: pcm.length / 4, seconds: pcm.length / 4 / 22050,
    full: summarizePcm(pcm), ranges: [
      {name: 'source-annotated-initial-latency', ...summarizePcm(pcm, 0, head.latencySeekSamples)},
      {name: 'first-MP3-stream-block', ...summarizePcm(pcm, 0, swf.main.blocks[0].sampleCount)},
      {name: 'candidate-empty-block-frame3-integer-sample-window',
        fractionalBoundaries: [timing.rows[1].continuousHypothesisSourceSample, timing.rows[2].continuousHypothesisSourceSample],
        ...summarizePcm(pcm, Math.ceil(timing.rows[1].continuousHypothesisSourceSample), Math.floor(timing.rows[2].continuousHypothesisSourceSample))},
      {name: 'last-MP3-stream-block', ...summarizePcm(pcm, timing.rows.at(-1).decodedPrefix)},
      {name: 'after-raw-terminal-arithmetic-coordinate', ...summarizePcm(pcm, timing.terminalArithmetic.rawPrefixPlusSeek)},
      {name: 'after-extra-latency-terminal-arithmetic-coordinate', ...summarizePcm(pcm, timing.terminalArithmetic.rawPlusExtraHeadLatencyArithmetic)}],
    boundary: 'Numerical energy and zero boundaries are not speech, language, encoder-delay measurement or listening acceptance.'};
  const outputs = new Map([
    ['probe-metadata.json', probeBytes], ['probe-packets.json', packetBytes], ['probe-frames.json', frameBytes],
    ['tool-versions.json', jsonBytes(tools)], ['mp3-frame-catalog.json', jsonBytes({schemaVersion: 1, sourceSha256: streamSha256, frames: mp3Frames})],
    ['block-timing-analysis.json', jsonBytes({schemaVersion: 1, ...timing})],
    ['pcm-analysis.json', jsonBytes({schemaVersion: 1, ...measurements})], ['sprite-62-untrimmed.f32le', pcm],
  ]);
  const ownScript = stableRead(fileURLToPath(import.meta.url));
  const otherInputs = [
    'migrations/shared-alg001-l12-p006/audio-source-v1/stream-source-receipt.json',
    'migrations/shared-alg001-l12-p006/audio-pcm-v1/receipt.json',
    'packages/demos/src/alg-l12-p006-audio-schedule.ts',
    'migrations/shared-alg001-l12-p006/evidence/AUDIO_CONTINUOUS_CORRECTION_2026-09-27.md',
  ].map(name => stableRead(name));
  const p006Source = JSON.parse(otherInputs[0].bytes), p006Pcm = JSON.parse(otherInputs[1].bytes);
  const analysis = {schemaVersion: 1, kind: 'p009-embedded-stream-technical-analysis-v1', animationId: 'shared-alg001-l12-p009',
    inputs: [source.pin, blockFile.pin, encoded.pin, sidecar.pin, ownScript.pin], specification,
    source: {sha256: sourceSha256, fps: swf.fps, rootFrameCount: swf.rootFrameCount, mainFrameCount: swf.main.declaredFrames,
      mainActionTags: swf.main.actions, streamHead: head, blockCount: swf.main.blocks.length, uncompressedFwsView: swf.uncompressedFwsView},
    encoded: {sha256: streamSha256, bytes: encoded.bytes.length, mp3Frames: mp3Frames.length,
      formats: [...new Set(mp3Frames.map(frame => `${frame.mpegVersion}/III/${frame.bitrateKbps}/${frame.sampleRateHz}/${frame.channels}/${frame.frameBytes}`))],
      mainDataBeginNonzeroFrames: mp3Frames.filter(frame => frame.mainDataBeginBytes > 0).length,
      mainDataBeginMaximum: Math.max(...mp3Frames.map(frame => frame.mainDataBeginBytes)),
      byteMarkerSearch: ['ID3','Xing','Info','LAME','VBRI'].map(marker => ({marker, byteOffset: encoded.bytes.indexOf(marker)})),
      markerBoundary: 'Byte search plus probe metadata, not a general proof that every possible encoder metadata scheme is absent.'},
    probe: {args: probeArgs, packetArgs, frameArgs, ffprobeReportedFormatDuration: Number(probe.format.duration),
      frameSamplesDuration: measurements.seconds, reportedDurationEqualsByteRateEstimate: Number(probe.format.duration) === encoded.bytes.length * 8 / Number(probe.streams[0].bit_rate),
      durationEstimateShorterThanDecodedMilliseconds: (measurements.seconds - Number(probe.format.duration)) * 1000,
      reportedInitialPadding: probe.streams[0].initial_padding,
      packetSideDataEntries: packets.filter(packet => packet.side_data_list?.length).length,
      frameSideDataEntries: decodedFrames.filter(frame => frame.side_data_list?.length).length},
    decode: {tool: tools.ffmpeg.path, args: decodeArgs, stderr: decoded.stderr.toString(),
      retainedAllSamples: true, trimmed: false, resampled: false, normalized: false, retimed: false, silenceInserted: false,
      pcm: {bytes: measurements.bytes, sha256: measurements.sha256, samples: measurements.samples, seconds: measurements.seconds}},
    timingSummary: {...timing, rows: undefined},
    sidecar: {...sidecar.pin, differentFromEmbedded: true, decoded: false, concatenated: false, language: 'undetermined',
      runtimeTriggerEstablishedByThisAnalysis: false},
    p006Comparison: {inputPins: otherInputs.map(input => input.pin),
      firstBlockFrame: p006Source.blocks[0].spriteFrame, mainFrameCount: 342, decodedSamples: p006Pcm.pcm.samples,
      ruleReused: 'Continuous natural-rate decode; empty source block alone is not a silence command.',
      sourceSpecificDifferences: 'P009 first block is frame2, empty frame3, 721728 decoded samples, main394 without terminal DoAction; no P006 schedule or stop handler copied.'},
    outputs: [...outputs].map(([filename, bytes]) => ({path: `${output}/${filename}`, bytes: bytes.length, sha256: sha256(bytes)})),
    unresolved: ['Natural root/host-to-main audio onset and latency implementation',
      'Original Flash seek decoder priming and per-block SeekSamples interpretation',
      'Main looping/host end policy; P009 has no main terminal action',
      'Actual browser decoder sample count/hash and complete transport lifecycle',
      'Audio language, semantic timing, original-runtime listening, human/Owner acceptance'],
    claimBoundary: {technicalDecodeOnly: true, productAudioEnabled: false, registered: false, originalRuntime: false,
      synchronizationAccepted: false, languageAccepted: false, listeningAccepted: false, humanReview: false,
      ownerAccepted: false, strictComplete: false, published: false, providerAccess: false}};
  outputs.set('analysis.json', jsonBytes(analysis));
  if (check) {
    for (const [filename, bytes] of outputs) assert(stableRead(`${output}/${filename}`).bytes.equals(bytes), `analysis drift: ${filename}`);
  } else {
    fs.mkdirSync(absolute(output), {recursive: true});
    for (const [filename, bytes] of outputs) fs.writeFileSync(absolute(`${output}/${filename}`), bytes);
  }
  return {check, outputs: outputs.size, analysis: {path: `${output}/analysis.json`, bytes: outputs.get('analysis.json').length,
    sha256: sha256(outputs.get('analysis.json'))}, pcmSamples: measurements.samples, pcmSeconds: measurements.seconds,
    mp3Frames: mp3Frames.length, emptyPayloadFrames: timing.emptyPayloadFrames, continuousHypothesis: timing.continuousHypothesis};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.slice(2).every(arg => arg === '--check'), 'only --check is supported');
  console.log(JSON.stringify(runP009Analysis({check: process.argv.includes('--check')})));
}
