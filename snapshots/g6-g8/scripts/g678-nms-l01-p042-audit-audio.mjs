#!/usr/bin/env node
// Machine integrity of the exact embedded source stream; no delivery or listening claim.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, ID, SOURCE, FALSE_GATES, file, desc, json} from './g678-nms-l01-p042-extract-source.mjs';
export const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-audio-integrity-v1';
const VISUAL = 'work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1';
const INPUT = {path: `${VISUAL}/source-stream.mp3`, bytes: 48880,
  sha256: 'e6a32f6230b6195724ad2ce44cd49a560fb71a538bca407081bcce0d5f859bd1'};
const TOOLS = Object.freeze({
  ffmpeg: {path: '/opt/homebrew/Cellar/ffmpeg/8.1.2_1/bin/ffmpeg', bytes: 426224,
    sha256: 'dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c'},
  ffprobe: {path: '/opt/homebrew/Cellar/ffmpeg/8.1.2_1/bin/ffprobe', bytes: 236912,
    sha256: 'cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00'},
});
function command(executable, args, input = Buffer.alloc(0)) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000});
    const out = [], err = [];
    child.stdout.on('data', value => out.push(value)); child.stderr.on('data', value => err.push(value));
    child.on('error', reject); child.stdin.on('error', reject);
    child.on('close', (exitCode, signal) => resolve({executable, args, exitCode, signal,
      stdout: Buffer.concat(out).toString(), stderr: Buffer.concat(err).toString()}));
    child.stdin.end(input);
  });
}
export function validateProbe(probe) {
  assert.equal(probe.streams.length, 1);
  const stream = probe.streams[0];
  assert.equal(stream.codec_name, 'mp3'); assert.equal(stream.codec_type, 'audio');
  assert.ok(Number(stream.nb_read_frames) > 0 && Number(stream.sample_rate) > 0 && stream.channels > 0);
  return {codec: stream.codec_name, sampleRate: Number(stream.sample_rate), channels: stream.channels,
    decodedPacketFrameCount: Number(stream.nb_read_frames), durationReported: stream.duration ?? probe.format.duration ?? null};
}
export async function audit({check = false} = {}) {
  const payload = await file(INPUT.path, INPUT);
  const visual = await file(`${VISUAL}/run.json`, {path: `${VISUAL}/run.json`, bytes: 43458,
    sha256: 'b8fdba5084befb2ce65eba0e342a72f4be5747e0350d7a8d32e8f1e4aee2fd41'});
  const visualRecord = JSON.parse(visual.buffer);
  const projectionPin = visualRecord.outputs.find(item => item.path === `${VISUAL}/source-projection.json`);
  const projection = await file(projectionPin.path, projectionPin);
  const projected = JSON.parse(projection.buffer);
  assert.equal(projected.audio.payloadSha256, payload.sha256);
  assert.equal(projected.main.blocks.length, 118);
  assert.deepEqual(projected.main.blocks.map(block => block.frame), Array.from({length: 118}, (_, i) => i + 8));
  for (const pin of Object.values(TOOLS)) await file(pin.path, pin);
  const builder = desc(await file(path.relative(ROOT, fileURLToPath(import.meta.url))));
  const helper = desc(await file('scripts/g678-nms-l01-p042-extract-source.mjs'));
  if (check) {
    const receipt = JSON.parse((await file(`${RUN}/audit.json`)).buffer);
    assert.equal(receipt.machineIntegrityPassed, true); assert.deepEqual(receipt.gates, FALSE_GATES);
    assert.deepEqual(receipt.input, INPUT); assert.deepEqual(receipt.codeDependencyClosure, [builder, helper]);
    assert.deepEqual(receipt.toolchain, TOOLS); assert.deepEqual(receipt.visualRun, desc(visual));
    assert.deepEqual(receipt.projection, desc(projection));
    for (const output of receipt.outputs) await file(output.path, output);
    return {check: true, audit: `${RUN}/audit.json`, machineIntegrityPassed: true,
      scope: 'Physical rehash of completed decode evidence; not a second FFmpeg decode.', gates: FALSE_GATES};
  }
  const destination = path.join(ROOT, RUN); await mkdir(destination);
  const results = [await command(TOOLS.ffprobe.path, ['-version']), await command(TOOLS.ffmpeg.path, ['-version']),
    await command(TOOLS.ffprobe.path, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', '-i', 'pipe:0'], payload.buffer),
    await command(TOOLS.ffmpeg.path, ['-nostdin', '-v', 'error', '-xerror', '-i', 'pipe:0', '-map', '0:a:0', '-f', 'null', '-'], payload.buffer)];
  const outputs = [];
  for (let i = 0; i < results.length; i++) {
    const output = `${RUN}/command-${i + 1}.json`;
    await writeFile(path.join(ROOT, output), json(results[i]), {flag: 'wx', mode: 0o444}); outputs.push(desc(await file(output)));
  }
  const errors = results.filter(result => result.exitCode !== 0 || result.signal !== null || result.stderr !== '');
  let machineDetails = null;
  if (!errors.length) machineDetails = validateProbe(JSON.parse(results[2].stdout));
  const receipt = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-source-audio-machine-integrity-v1',
    animationId: ID, source: SOURCE, input: INPUT, visualRun: desc(visual), projection: desc(projection),
    codeDependencyClosure: [builder, helper], toolchain: TOOLS, outputs, machineDetails,
    machineIntegrityPassed: errors.length === 0, sourceTiming: {...projected.audio, blocks: projected.main.blocks},
    fullEofDecode: {commandIndex: 4, stdinBytes: payload.bytes, output: 'null muxer',
      primingRemoved: false, trimmingApplied: false, sourceBlockHeadersNotAudioBytes: true},
    limitations: ['No listening or speech-language determination.', 'No original runtime, cue alignment or priming calibration.',
      'No runtime audio route or URL was created; candidate remains silent.', 'Separate SA file is not a substitute for this embedded stream.'],
    gates: FALSE_GATES};
  await writeFile(path.join(destination, 'audit.json'), json(receipt), {flag: 'wx', mode: 0o444});
  assert.equal(errors.length, 0, 'Audio integrity failed; all command outputs and receipt retained.');
  return {check: false, audit: `${RUN}/audit.json`, machineIntegrityPassed: true, machineDetails, gates: FALSE_GATES};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || args[0] === '--check'));
  console.log(json(await audit({check: args[0] === '--check'})));
}
