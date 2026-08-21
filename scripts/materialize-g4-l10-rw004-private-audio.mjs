#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {access, mkdir, open, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {extractMp3SoundStreams} from './extract-ti-soundstreams.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ANIMATION_ID = 'course-g04-l10-rw-004';
const CALIBRATION_ID = 'g4-l10-candidate-to-product-v10';
const FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v10.json',
  sha256: 'e9b31177a73b98359e9ac686cb9ccfcc304ebff2220606ba0335ac1fde2563fd',
});
const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf';
const SOURCE_SWF_SHA256 =
  '8f0fe3a78ad9757b4388e0fd1f79e5e275914e5377d5e7be184ffa1779b63f95';
const SWFMILL_XML =
  'migrations/course-g04-l10-rw-004/audit/machine/swfmill.xml.gz';
const SWFMILL_XML_SHA256 =
  '4189c660d00305f704b699fcc60897624a8cd705a381845227e4642da39a112d';
const AUDIO_RUNTIME_AUDIT =
  'migrations/course-g04-l10-rw-004/audit/audio-runtime-evidence.json';
const AUDIO_RUNTIME_AUDIT_SHA256 =
  '81bcc55eb3de9c219e43a28b1293f9f27ce7441be73d84b6bdf17665c1dc2256';
const SPANISH_SOURCE =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10RW04.mp3';
const PUBLIC_DIRECTORY =
  'public/flash-assets/courses/course-g04-l10-rw-004/audio';
const EMBEDDED_OUTPUT = `${PUBLIC_DIRECTORY}/embedded-stream-0001.mp3`;
const SPANISH_OUTPUT = `${PUBLIC_DIRECTORY}/spanish-host-narration.mp3`;
const PUBLIC_MANIFEST = `${PUBLIC_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT =
  'migrations/course-g04-l10-rw-004/audit/private-product-audio-assets.json';

export const EXPECTED_RW004_AUDIO = Object.freeze({
  embedded: Object.freeze({
    sourceTimelineId: 'sprite-109',
    characterId: 109,
    headFrame: 1,
    firstFrame: 16,
    lastFrame: 1325,
    endFrame: 1326,
    blockCount: 1310,
    totalDecodedSamples: 2405952,
    sampleRateHz: 22050,
    channels: 1,
    durationMs: 109113,
    bytes: 543010,
    sha256:
      '92a83e94c3947bcaf30fcc1e1bc2c70625bed4eefd59d5757604073e3f9919d2',
  }),
  spanish: Object.freeze({
    bytes: 392784,
    sha256:
      '1b50f6e77e0db24fd34821b330b1838c0b91d392d6a0bbacd733a8494073f535',
    sampleRateHz: 48000,
    channels: 1,
    durationMs: 28056,
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function readBound(root, relativePath, expectedSha256, expectedBytes) {
  const bytes = await readFile(path.join(root, relativePath));
  invariant(
    sha256(bytes) === expectedSha256,
    `${relativePath} SHA-256 differs from the frozen binding`,
  );
  if (expectedBytes !== undefined) {
    invariant(
      bytes.length === expectedBytes,
      `${relativePath} byte length differs from the frozen binding`,
    );
  }
  return bytes;
}

function probeMp3(bytes, expected, label) {
  const probe = spawnSync(
    'ffprobe',
    [
      '-v', 'error', '-show_entries',
      'stream=codec_name,sample_rate,channels', '-of', 'json', 'pipe:0',
    ],
    {input: bytes, maxBuffer: 16 * 1024 * 1024},
  );
  invariant(
    probe.status === 0,
    `${label} ffprobe failed: ${probe.stderr?.toString().trim() ?? ''}`,
  );
  const stream = JSON.parse(probe.stdout.toString()).streams?.[0];
  invariant(
    stream?.codec_name === 'mp3' &&
      Number(stream.sample_rate) === expected.sampleRateHz &&
      Number(stream.channels) === expected.channels,
    `${label} media shape differs from the frozen disposition`,
  );
  const decode = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', 'pipe:0', '-map', '0:a:0', '-f', 'null', '-'],
    {input: bytes, maxBuffer: 16 * 1024 * 1024},
  );
  invariant(
    decode.status === 0,
    `${label} full EOF decode failed: ${decode.stderr?.toString().trim() ?? ''}`,
  );
  return Object.freeze({
    codecName: stream.codec_name,
    sampleRateHz: Number(stream.sample_rate),
    channels: Number(stream.channels),
    fullEofDecodePassed: true,
  });
}

function validateEmbedded(stream, audioAudit) {
  const expected = EXPECTED_RW004_AUDIO.embedded;
  invariant(stream?.head, 'sprite-109 has no SoundStreamHead');
  invariant(
    stream.head.compression === '2' &&
      stream.head.soundRate === '2' &&
      stream.head.soundStereo === '0',
    'sprite-109 is not the frozen mono 22050 Hz MP3 SoundStream',
  );
  invariant(
    stream.blocks.length === expected.blockCount &&
      stream.totalDecodedSamples === expected.totalDecodedSamples &&
      stream.mp3.length === expected.bytes &&
      sha256(stream.mp3) === expected.sha256,
    'sprite-109 extracted MP3 bytes differ from the V6 freeze',
  );
  const structuralStream = audioAudit?.embeddedAudio?.soundStreams?.find(
    (candidate) =>
      candidate.context?.kind === 'sprite' &&
      candidate.context.characterId === expected.characterId,
  );
  invariant(
    structuralStream?.headFrame === expected.headFrame &&
      structuralStream.firstBlockFrame === expected.firstFrame &&
      structuralStream.lastBlockFrame === expected.lastFrame &&
      structuralStream.blockCount === expected.blockCount &&
      structuralStream.totalDecodedSamples === expected.totalDecodedSamples,
    'audio-runtime evidence no longer binds sprite-109 frames 16..1325',
  );
  invariant(
    stream.mp3[0] === 0xff && (stream.mp3[1] & 0xe0) === 0xe0,
    'sprite-109 extracted bytes have no MP3 sync word',
  );
}

function outputRecords(scriptSha256, embeddedProbe, spanishProbe) {
  const embedded = EXPECTED_RW004_AUDIO.embedded;
  const spanish = EXPECTED_RW004_AUDIO.spanish;
  const assets = [
    {
      id: 'embedded-stream-0001',
      role: 'english-engineering-timeline-cue',
      source: {
        path: SOURCE_SWF,
        sha256: SOURCE_SWF_SHA256,
        sourceTimelineId: embedded.sourceTimelineId,
        sourceCharacterId: embedded.characterId,
      },
      output: EMBEDDED_OUTPUT,
      publicPath:
        '/flash-assets/courses/course-g04-l10-rw-004/audio/embedded-stream-0001.mp3',
      bytes: embedded.bytes,
      sha256: embedded.sha256,
      media: {...embeddedProbe, durationMs: embedded.durationMs},
      frameDomain: embedded.sourceTimelineId,
      frame: embedded.firstFrame,
      endFrame: embedded.endFrame,
      scenario: 'source-static-frame',
      routeLanguage: 'en',
      spokenLanguage: 'undetermined',
      routeAuthority:
        'Fixed-English candidate route plus embedded/default-page convention only; no listening acceptance.',
    },
    {
      id: 'spanish-host-narration',
      role: 'spanish-user-activated-host-track',
      source: {path: SPANISH_SOURCE, sha256: spanish.sha256},
      output: SPANISH_OUTPUT,
      publicPath:
        '/flash-assets/courses/course-g04-l10-rw-004/audio/spanish-host-narration.mp3',
      bytes: spanish.bytes,
      sha256: spanish.sha256,
      media: {...spanishProbe, durationMs: spanish.durationMs},
      frameDomains: [embedded.sourceTimelineId],
      activation: 'user',
      timelineBehavior: 'pause-while-playing',
      routeLanguage: 'es',
      spokenLanguage: 'not-established-by-listening',
      routeAuthority:
        'Exact legacy SA-directory association and Spanish host route only.',
    },
  ];
  const common = {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    calibrationId: CALIBRATION_ID,
    freeze: FREEZE,
    generatedBy: {
      path: 'scripts/materialize-g4-l10-rw004-private-audio.mjs',
      sha256: scriptSha256,
      sharedParser: 'scripts/extract-ti-soundstreams.mjs',
    },
    sourceBindings: [
      {path: SOURCE_SWF, sha256: SOURCE_SWF_SHA256},
      {path: SWFMILL_XML, sha256: SWFMILL_XML_SHA256},
      {path: AUDIO_RUNTIME_AUDIT, sha256: AUDIO_RUNTIME_AUDIT_SHA256},
      {path: SPANISH_SOURCE, sha256: spanish.sha256},
    ],
    assets,
    authority:
      'Byte-exact private Current-JS audio staging and engineering route mapping only.',
    authorityBoundary:
      'Spoken language/content, natural Adobe runtime reachability, start/stop/pause synchronization, audible quality, Replay parity, listening acceptance, human review, Owner acceptance, strict completion, release, and publication remain unresolved.',
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorParityAccepted: false,
      visualFidelityAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseEligible: false,
      published: false,
    },
    strictAcceptanceEffect: 'none',
  };
  const manifest = jsonBytes({
    ...common,
    artifactType: 'g4-l10-rw004-private-product-audio-manifest',
    status: 'byte-exact-private-current-js-audio-candidate',
  });
  const receipt = jsonBytes({
    ...common,
    artifactType: 'g4-l10-rw004-private-product-audio-receipt',
    status: 'materialized-and-full-eof-decoded-listening-pending',
    generatedManifest: {
      path: PUBLIC_MANIFEST,
      bytes: manifest.length,
      sha256: sha256(manifest),
    },
  });
  return {manifest, receipt};
}

async function publishMissingExact(root, relativePath, expected) {
  const absolute = path.join(root, relativePath);
  if (await exists(absolute)) {
    const observed = await readFile(absolute);
    invariant(
      observed.equals(expected),
      `${relativePath} exists with foreign or stale bytes; refusing overwrite`,
    );
    return 'verified-existing';
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL,
    0o644,
  );
  try {
    await handle.writeFile(expected);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return 'published-no-replace';
}

export async function materializeG4L10Rw004PrivateAudio(options = {}) {
  const root = path.resolve(options.root ?? ROOT);
  const [, , , audioAuditBytes] = await Promise.all([
    readBound(root, FREEZE.path, FREEZE.sha256),
    readBound(root, SOURCE_SWF, SOURCE_SWF_SHA256),
    readBound(root, SWFMILL_XML, SWFMILL_XML_SHA256),
    readBound(root, AUDIO_RUNTIME_AUDIT, AUDIO_RUNTIME_AUDIT_SHA256),
  ]);
  const spanishBytes = await readBound(
    root,
    SPANISH_SOURCE,
    EXPECTED_RW004_AUDIO.spanish.sha256,
    EXPECTED_RW004_AUDIO.spanish.bytes,
  );
  const streams = await extractMp3SoundStreams(
    path.join(root, SWFMILL_XML),
    [EXPECTED_RW004_AUDIO.embedded.characterId],
  );
  const stream = streams.get(EXPECTED_RW004_AUDIO.embedded.characterId);
  validateEmbedded(stream, JSON.parse(audioAuditBytes));
  const embeddedProbe = probeMp3(
    stream.mp3,
    EXPECTED_RW004_AUDIO.embedded,
    'RW004 embedded SoundStream',
  );
  const spanishProbe = probeMp3(
    spanishBytes,
    EXPECTED_RW004_AUDIO.spanish,
    'RW004 Spanish host track',
  );
  const scriptSha256 = sha256(await readFile(SCRIPT_PATH));
  const {manifest, receipt} = outputRecords(
    scriptSha256,
    embeddedProbe,
    spanishProbe,
  );
  const outputs = [
    {path: EMBEDDED_OUTPUT, bytes: stream.mp3},
    {path: SPANISH_OUTPUT, bytes: spanishBytes},
    {path: PUBLIC_MANIFEST, bytes: manifest},
    {path: AUDIT_RECEIPT, bytes: receipt},
  ];
  const stale = [];
  for (const output of outputs) {
    const absolute = path.join(root, output.path);
    if (!(await exists(absolute))) stale.push(output.path);
    else if (!(await readFile(absolute)).equals(output.bytes)) stale.push(output.path);
  }
  if (options.check) {
    invariant(
      stale.length === 0,
      `RW004 private audio outputs are stale:\n${stale.join('\n')}`,
    );
    return {status: 'current', outputs: outputs.map(({path: output}) => output)};
  }
  const published = [];
  for (const output of outputs) {
    published.push({
      path: output.path,
      result: await publishMissingExact(root, output.path, output.bytes),
    });
  }
  return {status: 'materialized', outputs: published};
}

export function parseArguments(argv) {
  const options = {root: ROOT, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') options.check = true;
    else if (argument === '--project-root') {
      invariant(argv[index + 1], '--project-root requires a value');
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await materializeG4L10Rw004PrivateAudio(
    parseArguments(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
