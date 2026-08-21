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
const ANIMATION_ID = 'course-g04-l10-vb-006';
const CALIBRATION_ID = 'g4-l10-candidate-to-product-v27';
const FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v27.json',
  bytes: 22281,
  sha256: '2659f2fe21b71a4db917002bc552374412f0fed12d9263f0a058b57c4ba259e0',
});
const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB06.swf';
const SOURCE_SWF_SHA256 =
  'cb9881b4c6b790e4c1b13fa99ee3457b2d5438c261811d22d431b1fc0cefdaa4';
const SWFMILL_XML =
  'migrations/course-g04-l10-vb-006/audit/machine/swfmill.xml.gz';
const SWFMILL_XML_SHA256 =
  'f7565ed7b50ad3249f1fd439f071f060df9eca9067804eed51bb7690e7c946b5';
const AUDIO_RUNTIME_AUDIT =
  'migrations/course-g04-l10-vb-006/audit/audio-runtime-evidence.json';
const AUDIO_RUNTIME_AUDIT_SHA256 =
  'fa143ae0287758d88a694acf90dcf557437b11f49e3b3ab137eb4c8ef8a56f8a';
const SPANISH_SOURCE =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10VB06.mp3';
const PUBLIC_DIRECTORY =
  'public/flash-assets/courses/course-g04-l10-vb-006/audio';
const PUBLIC_MANIFEST = `${PUBLIC_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT =
  'migrations/course-g04-l10-vb-006/audit/private-product-audio-assets.json';

const embedded = (
  id,
  role,
  characterId,
  firstFrame,
  lastFrame,
  blockCount,
  totalDecodedSamples,
  durationMs,
  bytes,
  sha256,
) => Object.freeze({
  id,
  role,
  sourceTimelineId: `sprite-${characterId}`,
  characterId,
  headFrame: 1,
  firstFrame,
  lastFrame,
  blockCount,
  totalDecodedSamples,
  sampleRateHz: 22050,
  channels: 1,
  durationMs,
  bytes,
  sha256,
  output: `${PUBLIC_DIRECTORY}/${id}.mp3`,
  publicPath:
    `/flash-assets/courses/course-g04-l10-vb-006/audio/${id}.mp3`,
});

const continuation = Object.freeze({
  id: 'main-continuation',
  role: 'correct-answer-main-timeline-continuation',
  sourceTimelineId: 'sprite-213',
  characterId: 213,
  sourceFirstFrame: 9,
  firstFrame: 63,
  lastFrame: 104,
  blockCount: 42,
  totalDecodedSamples: 77184,
  sampleRateHz: 22050,
  channels: 1,
  durationMs: 3500,
  bytes: 17420,
  sha256: 'e643ab8bab5713139c7ffaf39afcfc6f8242b3a9772c5e6f8bfbc0bed1d7258f',
  output: `${PUBLIC_DIRECTORY}/main-continuation.mp3`,
  publicPath:
    '/flash-assets/courses/course-g04-l10-vb-006/audio/main-continuation.mp3',
});

export const EXPECTED_VB006_AUDIO = Object.freeze({
  embedded: Object.freeze([
    embedded('feedback-close', 'wrong-feedback-close-button-down-state', 36, 1, 5, 5, 8640, 392, 1950, 'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38'),
    embedded('wrong-1', 'wrong-feedback-branch-1', 85, 2, 29, 28, 51264, 2325, 11570, '187a32ba065a2534843eaef91e70bd2491595f9f00b9598ea15be9a843a24d3d'),
    embedded('wrong-2', 'wrong-feedback-branch-2', 41, 2, 27, 26, 45504, 2064, 10270, '1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e'),
    embedded('wrong-3', 'wrong-feedback-branch-3', 59, 2, 27, 26, 47232, 2142, 10660, 'f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b'),
    embedded('right-1', 'right-feedback-branch-1', 119, 1, 27, 27, 48960, 2220, 11050, 'b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19'),
    embedded('right-2', 'right-feedback-branch-2', 173, 3, 32, 30, 54720, 2482, 12350, '7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11'),
    embedded('right-3', 'right-feedback-branch-3', 159, 2, 28, 27, 48960, 2220, 11050, '529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085'),
    embedded('right-4', 'right-feedback-branch-4', 131, 2, 27, 26, 47232, 2142, 10660, '18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec'),
    embedded('main-timeline', 'main-timeline-engineering-cue', 213, 9, 104, 96, 175680, 7967, 39650, '1bb3a635e39ff8c858f8f3ba9cc8b174bbd2fb6dbc612504140acbb72553b384'),
  ]),
  continuation,
  spanish: Object.freeze({
    bytes: 154224,
    sha256:
      '55b13dade3eae456179c0fefb1d6ca8cc10dd1be583a445e2ba51fdbb9efd2de',
    sampleRateHz: 48000,
    channels: 1,
    durationMs: 11016,
    output: `${PUBLIC_DIRECTORY}/spanish-host-narration.mp3`,
    publicPath:
      '/flash-assets/courses/course-g04-l10-vb-006/audio/spanish-host-narration.mp3',
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
    `${relativePath} SHA-256 differs from the V27 binding`,
  );
  if (expectedBytes !== undefined) {
    invariant(
      bytes.length === expectedBytes,
      `${relativePath} byte length differs from the V27 binding`,
    );
  }
  return bytes;
}

function probeMp3(bytes, expected, label) {
  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels', '-of', 'json', 'pipe:0'],
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
    `${label} media shape differs from the V27 freeze`,
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

function structuralStream(audioAudit, characterId) {
  return audioAudit?.embeddedAudio?.soundStreams?.find(
    (candidate) =>
      candidate.context?.kind === 'sprite' &&
      candidate.context.characterId === characterId,
  );
}

function validateFullStream(stream, expected, audioAudit) {
  invariant(stream?.head, `${expected.sourceTimelineId} has no SoundStreamHead`);
  invariant(
    stream.head.compression === '2' &&
      stream.head.soundRate === '2' &&
      stream.head.soundStereo === '0',
    `${expected.sourceTimelineId} is not the frozen mono 22050 Hz MP3 stream`,
  );
  invariant(
    stream.blocks.length === expected.blockCount &&
      stream.totalDecodedSamples === expected.totalDecodedSamples &&
      stream.mp3.length === expected.bytes &&
      sha256(stream.mp3) === expected.sha256,
    `${expected.sourceTimelineId} extracted MP3 differs from V27`,
  );
  const structural = structuralStream(audioAudit, expected.characterId);
  invariant(
    structural?.headFrame === expected.headFrame &&
      structural.firstBlockFrame === expected.firstFrame &&
      structural.lastBlockFrame === expected.lastFrame &&
      structural.blockCount === expected.blockCount &&
      structural.totalDecodedSamples === expected.totalDecodedSamples,
    `${expected.sourceTimelineId} structural audio facts differ from V27`,
  );
  invariant(
    stream.mp3[0] === 0xff && (stream.mp3[1] & 0xe0) === 0xe0,
    `${expected.sourceTimelineId} has no MP3 sync word`,
  );
}

function buildContinuation(stream, expected) {
  const firstBlockIndex = expected.firstFrame - expected.sourceFirstFrame;
  const endBlockIndex = expected.lastFrame - expected.sourceFirstFrame + 1;
  const blocks = stream.blocks.slice(firstBlockIndex, endBlockIndex);
  const bytes = Buffer.concat(blocks.map((block) => block.subarray(4)));
  const totalDecodedSamples = blocks.reduce(
    (total, block) => total + block.readUInt16LE(0),
    0,
  );
  invariant(
    blocks.length === expected.blockCount &&
      totalDecodedSamples === expected.totalDecodedSamples &&
      bytes.length === expected.bytes &&
      sha256(bytes) === expected.sha256,
    'sprite-213 frame-63-through-104 continuation differs from V27',
  );
  invariant(
    bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0,
    'sprite-213 continuation has no MP3 sync word',
  );
  return bytes;
}

function outputRecords(scriptSha256, probes) {
  const allEmbedded = [
    ...EXPECTED_VB006_AUDIO.embedded,
    EXPECTED_VB006_AUDIO.continuation,
  ];
  const assets = allEmbedded.map((expected) => ({
    id: expected.id,
    role: expected.role,
    source: {
      path: SOURCE_SWF,
      sha256: SOURCE_SWF_SHA256,
      sourceTimelineId: expected.sourceTimelineId,
      sourceCharacterId: expected.characterId,
      ...(expected.id === 'main-continuation'
        ? {sourceBlockFrameRange: {first: 63, last: 104}}
        : {}),
    },
    output: expected.output,
    publicPath: expected.publicPath,
    bytes: expected.bytes,
    sha256: expected.sha256,
    media: {...probes.get(expected.id), durationMs: expected.durationMs},
    frameDomain: expected.sourceTimelineId,
    firstFrame: expected.firstFrame,
    lastFrame: expected.lastFrame,
    routeLanguage: 'en',
    spokenLanguage: 'undetermined',
    routeAuthority:
      'Exact shipped SWF SoundStream and source-evidenced product-reachable VB006 route only; no listening acceptance.',
  }));
  const spanish = EXPECTED_VB006_AUDIO.spanish;
  assets.push({
    id: 'spanish-host-narration',
    role: 'spanish-user-activated-host-track',
    source: {path: SPANISH_SOURCE, sha256: spanish.sha256},
    output: spanish.output,
    publicPath: spanish.publicPath,
    bytes: spanish.bytes,
    sha256: spanish.sha256,
    media: {...probes.get('spanish-host-narration'), durationMs: spanish.durationMs},
    frameDomains: ['sprite-213'],
    activation: 'user',
    timelineBehavior: 'pause-while-playing',
    routeLanguage: 'es',
    spokenLanguage: 'not-established-by-listening',
    routeAuthority:
      'Exact legacy SA-directory association and Spanish host route only.',
  });
  const common = {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    calibrationId: CALIBRATION_ID,
    freeze: FREEZE,
    generatedBy: {
      path: 'scripts/materialize-g4-l10-vb006-private-audio.mjs',
      sha256: scriptSha256,
      sharedParser: 'scripts/extract-ti-soundstreams.mjs',
    },
    sourceBindings: [
      {path: SOURCE_SWF, sha256: SOURCE_SWF_SHA256},
      {path: SWFMILL_XML, sha256: SWFMILL_XML_SHA256},
      {path: AUDIO_RUNTIME_AUDIT, sha256: AUDIO_RUNTIME_AUDIT_SHA256},
      {path: SPANISH_SOURCE, sha256: spanish.sha256},
    ],
    productReachability: {
      includedEmbeddedCharacterIds:
        EXPECTED_VB006_AUDIO.embedded.map(({characterId}) => characterId),
      derivedReachableSegment: {
        characterId: 213,
        firstFrame: 63,
        lastFrame: 104,
        purpose: 'resume the parent main timeline after correct feedback',
      },
      excludedByShippedHostCardinality: [
        {characterId: 73, instanceName: 'Mc_Wrong_Feed4', hostRange: 'random(3)'},
        {characterId: 212, instanceName: 'Mc_Right_Feed5', hostRange: 'random(4)'},
      ],
    },
    assets,
    authority:
      'Byte-exact private Current-JS audio staging and product engineering route mapping only.',
    authorityBoundary:
      'Spoken content, natural Adobe runtime reachability, audible quality, visual synchronization fidelity, listening acceptance, human review, Owner acceptance, strict completion, release, and publication remain unresolved.',
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
    artifactType: 'g4-l10-vb006-private-product-audio-manifest',
    status: 'byte-exact-product-reachable-private-current-js-audio-candidate',
  });
  const receipt = jsonBytes({
    ...common,
    artifactType: 'g4-l10-vb006-private-product-audio-receipt',
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

export async function materializeG4L10Vb006PrivateAudio(options = {}) {
  const root = path.resolve(options.root ?? ROOT);
  const [, , , audioAuditBytes] = await Promise.all([
    readBound(root, FREEZE.path, FREEZE.sha256, FREEZE.bytes),
    readBound(root, SOURCE_SWF, SOURCE_SWF_SHA256, 806886),
    readBound(root, SWFMILL_XML, SWFMILL_XML_SHA256),
    readBound(root, AUDIO_RUNTIME_AUDIT, AUDIO_RUNTIME_AUDIT_SHA256),
  ]);
  const spanishBytes = await readBound(
    root,
    SPANISH_SOURCE,
    EXPECTED_VB006_AUDIO.spanish.sha256,
    EXPECTED_VB006_AUDIO.spanish.bytes,
  );
  const streams = await extractMp3SoundStreams(
    path.join(root, SWFMILL_XML),
    EXPECTED_VB006_AUDIO.embedded.map(({characterId}) => characterId),
  );
  const audioAudit = JSON.parse(audioAuditBytes);
  const probes = new Map();
  const embeddedOutputs = [];
  for (const expected of EXPECTED_VB006_AUDIO.embedded) {
    const stream = streams.get(expected.characterId);
    validateFullStream(stream, expected, audioAudit);
    probes.set(
      expected.id,
      probeMp3(stream.mp3, expected, `VB006 ${expected.sourceTimelineId}`),
    );
    embeddedOutputs.push({path: expected.output, bytes: stream.mp3});
  }
  const continuationBytes = buildContinuation(
    streams.get(EXPECTED_VB006_AUDIO.continuation.characterId),
    EXPECTED_VB006_AUDIO.continuation,
  );
  probes.set(
    'main-continuation',
    probeMp3(
      continuationBytes,
      EXPECTED_VB006_AUDIO.continuation,
      'VB006 main continuation',
    ),
  );
  probes.set(
    'spanish-host-narration',
    probeMp3(spanishBytes, EXPECTED_VB006_AUDIO.spanish, 'VB006 Spanish host track'),
  );
  const scriptSha256 = sha256(await readFile(path.join(root, 'scripts/materialize-g4-l10-vb006-private-audio.mjs')));
  const records = outputRecords(scriptSha256, probes);
  const outputs = [
    ...embeddedOutputs,
    {path: EXPECTED_VB006_AUDIO.continuation.output, bytes: continuationBytes},
    {path: EXPECTED_VB006_AUDIO.spanish.output, bytes: spanishBytes},
    {path: PUBLIC_MANIFEST, bytes: records.manifest},
    {path: AUDIT_RECEIPT, bytes: records.receipt},
  ];
  const statuses = [];
  for (const output of outputs) {
    if (options.check) {
      const observed = await readFile(path.join(root, output.path));
      invariant(observed.equals(output.bytes), `${output.path} is stale`);
      statuses.push({path: output.path, status: 'current'});
    } else {
      statuses.push({
        path: output.path,
        status: await publishMissingExact(root, output.path, output.bytes),
      });
    }
  }
  return Object.freeze({
    animationId: ANIMATION_ID,
    status: options.check ? 'current' : 'materialized',
    outputs: Object.freeze(statuses),
  });
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main() {
  const result = await materializeG4L10Vb006PrivateAudio(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
