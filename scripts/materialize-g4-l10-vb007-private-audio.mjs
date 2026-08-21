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
const ANIMATION_ID = 'course-g04-l10-vb-007';
const CALIBRATION_ID = 'g4-l10-candidate-to-product-v25';
const FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v25.json',
  bytes: 19897,
  sha256: '38edf57be2859a8d1255579730776eacb325aaee2e297f152f42cae305230b6e',
});
const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB07.swf';
const SOURCE_SWF_SHA256 =
  '8480ad793b8f1f02caea83bea16b9fb4f2e08f573df4f4d22d6362366fe657c1';
const SWFMILL_XML =
  'migrations/course-g04-l10-vb-007/audit/machine/swfmill.xml.gz';
const SWFMILL_XML_SHA256 =
  '9e1df4ed5db03692d3602fbc5ba88a4b70624b7d7909b3dc46da6a7a0e5b353d';
const AUDIO_RUNTIME_AUDIT =
  'migrations/course-g04-l10-vb-007/audit/audio-runtime-evidence.json';
const AUDIO_RUNTIME_AUDIT_SHA256 =
  '704c1058821823ee4cc5bdc10bb8265437e70ff65c087e8f8075dbf63b1a70ba';
const SPANISH_SOURCE =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10VB07.mp3';
const PUBLIC_DIRECTORY =
  'public/flash-assets/courses/course-g04-l10-vb-007/audio';
const PUBLIC_MANIFEST = `${PUBLIC_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT =
  'migrations/course-g04-l10-vb-007/audit/private-product-audio-assets.json';

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
    `/flash-assets/courses/course-g04-l10-vb-007/audio/${id}.mp3`,
});

const continuation = Object.freeze({
  id: 'main-continuation',
  role: 'correct-answer-main-timeline-continuation',
  sourceTimelineId: 'sprite-204',
  characterId: 204,
  sourceFirstFrame: 10,
  firstFrame: 62,
  lastFrame: 130,
  blockCount: 69,
  totalDecodedSamples: 126720,
  sampleRateHz: 22050,
  channels: 1,
  durationMs: 5747,
  bytes: 28600,
  sha256: '55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2',
  output: `${PUBLIC_DIRECTORY}/main-continuation.mp3`,
  publicPath:
    '/flash-assets/courses/course-g04-l10-vb-007/audio/main-continuation.mp3',
});

export const EXPECTED_VB007_AUDIO = Object.freeze({
  embedded: Object.freeze([
    embedded('feedback-close', 'wrong-feedback-close-button-down-state', 39, 1, 5, 5, 8640, 392, 1950, 'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38'),
    embedded('wrong-1', 'wrong-feedback-branch-1', 73, 2, 28, 27, 48960, 2220, 11050, 'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1'),
    embedded('wrong-2', 'wrong-feedback-branch-2', 84, 2, 28, 27, 48960, 2220, 11050, 'd7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0'),
    embedded('wrong-3', 'wrong-feedback-branch-3', 96, 2, 31, 30, 52992, 2403, 11960, 'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1'),
    embedded('right-1', 'right-feedback-branch-1', 172, 1, 28, 28, 51264, 2325, 11570, 'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8'),
    embedded('right-2', 'right-feedback-branch-2', 122, 2, 31, 30, 52992, 2403, 11960, '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b'),
    embedded('right-3', 'right-feedback-branch-3', 139, 2, 28, 27, 48960, 2220, 11050, '3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7'),
    embedded('right-4', 'right-feedback-branch-4', 160, 3, 33, 31, 56448, 2560, 12740, 'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e'),
    embedded('main-timeline', 'main-timeline-engineering-cue', 204, 10, 130, 121, 221760, 10057, 50050, '3ac4c7a2e3d153a3f39427b519de2bf3d87f5d4873fcd9d2c4a655ed6c7aabd6'),
  ]),
  continuation,
  spanish: Object.freeze({
    bytes: 159600,
    sha256:
      'af50406afceff38f9395907b0b059dbe980f60e5b14eead7d6e3832e51b10396',
    sampleRateHz: 48000,
    channels: 1,
    durationMs: 11400,
    output: `${PUBLIC_DIRECTORY}/spanish-host-narration.mp3`,
    publicPath:
      '/flash-assets/courses/course-g04-l10-vb-007/audio/spanish-host-narration.mp3',
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
    `${relativePath} SHA-256 differs from the V25 binding`,
  );
  if (expectedBytes !== undefined) {
    invariant(
      bytes.length === expectedBytes,
      `${relativePath} byte length differs from the V25 binding`,
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
    `${label} media shape differs from the V25 freeze`,
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
    `${expected.sourceTimelineId} extracted MP3 differs from V25`,
  );
  const structural = structuralStream(audioAudit, expected.characterId);
  invariant(
    structural?.headFrame === expected.headFrame &&
      structural.firstBlockFrame === expected.firstFrame &&
      structural.lastBlockFrame === expected.lastFrame &&
      structural.blockCount === expected.blockCount &&
      structural.totalDecodedSamples === expected.totalDecodedSamples,
    `${expected.sourceTimelineId} structural audio facts differ from V25`,
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
    'sprite-204 frame-62-through-130 continuation differs from V25',
  );
  invariant(
    bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0,
    'sprite-204 continuation has no MP3 sync word',
  );
  return bytes;
}

function outputRecords(scriptSha256, probes) {
  const allEmbedded = [
    ...EXPECTED_VB007_AUDIO.embedded,
    EXPECTED_VB007_AUDIO.continuation,
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
        ? {sourceBlockFrameRange: {first: 62, last: 130}}
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
      'Exact shipped SWF SoundStream and source-evidenced product-reachable VB007 route only; no listening acceptance.',
  }));
  const spanish = EXPECTED_VB007_AUDIO.spanish;
  assets.push({
    id: 'spanish-host-narration',
    role: 'spanish-user-activated-host-track',
    source: {path: SPANISH_SOURCE, sha256: spanish.sha256},
    output: spanish.output,
    publicPath: spanish.publicPath,
    bytes: spanish.bytes,
    sha256: spanish.sha256,
    media: {...probes.get('spanish-host-narration'), durationMs: spanish.durationMs},
    frameDomains: ['sprite-204'],
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
      path: 'scripts/materialize-g4-l10-vb007-private-audio.mjs',
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
        EXPECTED_VB007_AUDIO.embedded.map(({characterId}) => characterId),
      derivedReachableSegment: {
        characterId: 204,
        firstFrame: 62,
        lastFrame: 130,
        purpose: 'resume the parent main timeline after correct feedback',
      },
      excludedByShippedHostCardinality: [
        {characterId: 45, instanceName: 'Mc_Wrong_Feed4', hostRange: 'random(3)'},
        {characterId: 203, instanceName: 'Mc_Right_Feed5', hostRange: 'random(4)'},
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
    artifactType: 'g4-l10-vb007-private-product-audio-manifest',
    status: 'byte-exact-product-reachable-private-current-js-audio-candidate',
  });
  const receipt = jsonBytes({
    ...common,
    artifactType: 'g4-l10-vb007-private-product-audio-receipt',
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

export async function materializeG4L10Vb007PrivateAudio(options = {}) {
  const root = path.resolve(options.root ?? ROOT);
  const [, , , audioAuditBytes] = await Promise.all([
    readBound(root, FREEZE.path, FREEZE.sha256, FREEZE.bytes),
    readBound(root, SOURCE_SWF, SOURCE_SWF_SHA256, 219913),
    readBound(root, SWFMILL_XML, SWFMILL_XML_SHA256),
    readBound(root, AUDIO_RUNTIME_AUDIT, AUDIO_RUNTIME_AUDIT_SHA256),
  ]);
  const spanishBytes = await readBound(
    root,
    SPANISH_SOURCE,
    EXPECTED_VB007_AUDIO.spanish.sha256,
    EXPECTED_VB007_AUDIO.spanish.bytes,
  );
  const streams = await extractMp3SoundStreams(
    path.join(root, SWFMILL_XML),
    EXPECTED_VB007_AUDIO.embedded.map(({characterId}) => characterId),
  );
  const audioAudit = JSON.parse(audioAuditBytes);
  const probes = new Map();
  const embeddedOutputs = [];
  for (const expected of EXPECTED_VB007_AUDIO.embedded) {
    const stream = streams.get(expected.characterId);
    validateFullStream(stream, expected, audioAudit);
    probes.set(
      expected.id,
      probeMp3(stream.mp3, expected, `VB007 ${expected.sourceTimelineId}`),
    );
    embeddedOutputs.push({path: expected.output, bytes: stream.mp3});
  }
  const continuationBytes = buildContinuation(
    streams.get(EXPECTED_VB007_AUDIO.continuation.characterId),
    EXPECTED_VB007_AUDIO.continuation,
  );
  probes.set(
    EXPECTED_VB007_AUDIO.continuation.id,
    probeMp3(
      continuationBytes,
      EXPECTED_VB007_AUDIO.continuation,
      'VB007 sprite-204 frame-62-through-130 continuation',
    ),
  );
  probes.set(
    'spanish-host-narration',
    probeMp3(spanishBytes, EXPECTED_VB007_AUDIO.spanish, 'VB007 Spanish host track'),
  );
  const {manifest, receipt} = outputRecords(
    sha256(await readFile(SCRIPT_PATH)),
    probes,
  );
  const outputs = [
    ...embeddedOutputs,
    {path: EXPECTED_VB007_AUDIO.continuation.output, bytes: continuationBytes},
    {path: EXPECTED_VB007_AUDIO.spanish.output, bytes: spanishBytes},
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
      `VB007 private audio outputs are stale:\n${stale.join('\n')}`,
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
  const result = await materializeG4L10Vb007PrivateAudio(
    parseArguments(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
