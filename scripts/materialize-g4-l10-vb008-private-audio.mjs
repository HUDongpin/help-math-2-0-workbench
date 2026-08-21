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
const ANIMATION_ID = 'course-g04-l10-vb-008';
const CALIBRATION_ID = 'g4-l10-candidate-to-product-v20';
const FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v20.json',
  sha256: 'e69cd85d9b346eaf6345dad9470a07c2931f26b29ddfe6e190eaabbda72f41e0',
});
const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB08.swf';
const SOURCE_SWF_SHA256 =
  '6ff6b55a0f97bdc333caa1d813619cf10ba8d7f07f265e325ccd191f8e0c58d1';
const SWFMILL_XML =
  'migrations/course-g04-l10-vb-008/audit/machine/swfmill.xml.gz';
const SWFMILL_XML_SHA256 =
  'c84434fa8e67d799752dedd7dec6391cb780cedc1404c960263b9f9c589d8479';
const AUDIO_RUNTIME_AUDIT =
  'migrations/course-g04-l10-vb-008/audit/audio-runtime-evidence.json';
const AUDIO_RUNTIME_AUDIT_SHA256 =
  '62b3ba7d88a8a9885007ae1f7cc572f6783fbf80b719bfd504ce0d1e61822a85';
const SPANISH_SOURCE =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10VB08.mp3';
const PUBLIC_DIRECTORY =
  'public/flash-assets/courses/course-g04-l10-vb-008/audio';
const EMBEDDED_OUTPUT = `${PUBLIC_DIRECTORY}/embedded-stream-0001.mp3`;
const SPANISH_OUTPUT = `${PUBLIC_DIRECTORY}/spanish-host-narration.mp3`;
const PUBLIC_MANIFEST = `${PUBLIC_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT =
  'migrations/course-g04-l10-vb-008/audit/private-product-audio-assets.json';

export const EXPECTED_VB008_AUDIO = Object.freeze({
  embedded: Object.freeze({
    sourceTimelineId: 'sprite-62',
    characterId: 62,
    headFrame: 1,
    firstFrame: 5,
    lastFrame: 413,
    endFrame: 414,
    blockCount: 291,
    totalDecodedSamples: 530496,
    sampleRateHz: 22050,
    channels: 1,
    durationMs: 24059,
    bytes: 119730,
    sha256:
      '905f086003308e1769b8e4ab30a0fcaf9483fe73d56620c32f05dfc3ffcb6ab7',
  }),
  spanish: Object.freeze({
    bytes: 397152,
    sha256:
      '411a95e4132bda8195b03ef0617443895c14c279992c8421ea70e48f86048e4b',
    sampleRateHz: 48000,
    channels: 1,
    durationMs: 28368,
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
    `${label} media shape differs from the V20 freeze`,
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
  const expected = EXPECTED_VB008_AUDIO.embedded;
  invariant(stream?.head, 'sprite-62 has no SoundStreamHead');
  invariant(
    stream.head.compression === '2' &&
      stream.head.soundRate === '2' &&
      stream.head.soundStereo === '0',
    'sprite-62 is not the frozen mono 22050 Hz MP3 SoundStream',
  );
  invariant(
    stream.blocks.length === expected.blockCount &&
      stream.totalDecodedSamples === expected.totalDecodedSamples &&
      stream.mp3.length === expected.bytes &&
      sha256(stream.mp3) === expected.sha256,
    'sprite-62 extracted MP3 bytes differ from the V20 freeze',
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
    'audio-runtime evidence no longer binds sprite-62 frames 5..413',
  );
  invariant(
    stream.mp3[0] === 0xff && (stream.mp3[1] & 0xe0) === 0xe0,
    'sprite-62 extracted bytes have no MP3 sync word',
  );
}

function outputRecords(scriptSha256, embeddedProbe, spanishProbe) {
  const embedded = EXPECTED_VB008_AUDIO.embedded;
  const spanish = EXPECTED_VB008_AUDIO.spanish;
  const assets = [
    {
      id: 'embedded-stream-0001',
      role: 'fixed-english-route-engineering-timeline-cue',
      source: {
        path: SOURCE_SWF,
        sha256: SOURCE_SWF_SHA256,
        sourceTimelineId: embedded.sourceTimelineId,
        sourceCharacterId: embedded.characterId,
      },
      output: EMBEDDED_OUTPUT,
      publicPath:
        '/flash-assets/courses/course-g04-l10-vb-008/audio/embedded-stream-0001.mp3',
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
        '/flash-assets/courses/course-g04-l10-vb-008/audio/spanish-host-narration.mp3',
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
      path: 'scripts/materialize-g4-l10-vb008-private-audio.mjs',
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
    artifactType: 'g4-l10-vb008-private-product-audio-manifest',
    status: 'byte-exact-private-current-js-audio-candidate',
  });
  const receipt = jsonBytes({
    ...common,
    artifactType: 'g4-l10-vb008-private-product-audio-receipt',
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

export async function materializeG4L10Vb008PrivateAudio(options = {}) {
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
    EXPECTED_VB008_AUDIO.spanish.sha256,
    EXPECTED_VB008_AUDIO.spanish.bytes,
  );
  const streams = await extractMp3SoundStreams(
    path.join(root, SWFMILL_XML),
    [EXPECTED_VB008_AUDIO.embedded.characterId],
  );
  const stream = streams.get(EXPECTED_VB008_AUDIO.embedded.characterId);
  validateEmbedded(stream, JSON.parse(audioAuditBytes));
  const embeddedProbe = probeMp3(
    stream.mp3,
    EXPECTED_VB008_AUDIO.embedded,
    'VB008 embedded SoundStream',
  );
  const spanishProbe = probeMp3(
    spanishBytes,
    EXPECTED_VB008_AUDIO.spanish,
    'VB008 Spanish host track',
  );
  const {manifest, receipt} = outputRecords(
    sha256(await readFile(SCRIPT_PATH)),
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
      `VB008 private audio outputs are stale:\n${stale.join('\n')}`,
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
  const result = await materializeG4L10Vb008PrivateAudio(
    parseArguments(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
