#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {extractMp3SoundStreams} from './extract-ti-soundstreams.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..');
const ANIMATION_ID = 'course-g04-l10-ir-001';
const SOURCE_SWF =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf';
const SOURCE_SWF_SHA256 =
  '06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03';
const SWFMILL_XML =
  'migrations/course-g04-l10-ir-001/audit/machine/swfmill.xml.gz';
const SWFMILL_XML_SHA256 =
  '4576721429e92b4220835e901a157b998f01f2937d0500df406f222f9d737ff5';
const PUBLIC_DIRECTORY =
  'public/flash-assets/courses/course-g04-l10-ir-001/audio';
const PUBLIC_MANIFEST = `${PUBLIC_DIRECTORY}/manifest.json`;
const AUDIT_RECEIPT =
  'migrations/course-g04-l10-ir-001/audit/extracted-audio-assets.json';

export const EXPECTED_IR001_STREAMS = Object.freeze([
  Object.freeze({
    streamIndex: 1,
    cueId: 'random-sound-0',
    characterId: 5,
    sourceInstanceName: 'Mc_Sound_0',
    seedRemainder: 0,
    outputFile: 'embedded-stream-0001.mp3',
    blockCount: 135,
    totalDecodedSamples: 124992,
    sampleRateHz: 11025,
    channels: 1,
    byteLength: 22568,
    sha256:
      'b731347f2cd4ced88f5f86b21a1339a882821c42def7212b7b8aa15d72f31310',
  }),
  Object.freeze({
    streamIndex: 2,
    cueId: 'random-sound-1',
    characterId: 6,
    sourceInstanceName: 'Mc_Sound_1',
    seedRemainder: 1,
    outputFile: 'embedded-stream-0002.mp3',
    blockCount: 135,
    totalDecodedSamples: 124992,
    sampleRateHz: 11025,
    channels: 1,
    byteLength: 22568,
    sha256:
      '2112a8b5764792dd64ab2955e55e02b8850e2a677efd8f71e34f91fc608604ad',
  }),
]);

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join('/');
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function assertHash(candidate, expected, label) {
  const bytes = await readFile(candidate);
  const observed = digest(bytes);
  if (observed !== expected) {
    throw new Error(`${label} SHA-256 ${observed} differs from ${expected}`);
  }
}

function validateStream(stream, expected) {
  if (!stream?.head) {
    throw new Error(`sprite-${expected.characterId} has no SoundStreamHead`);
  }
  const head = stream.head;
  if (
    head.compression !== '2' ||
    head.soundRate !== '1' ||
    head.playbackRate !== '1' ||
    head.soundStereo !== '0' ||
    head.playbackStereo !== '0'
  ) {
    throw new Error(
      `sprite-${expected.characterId} is not the reviewed mono 11025 Hz MP3 stream`,
    );
  }
  if (
    stream.blocks.length !== expected.blockCount ||
    stream.totalDecodedSamples !== expected.totalDecodedSamples ||
    stream.mp3.length !== expected.byteLength ||
    digest(stream.mp3) !== expected.sha256
  ) {
    throw new Error(
      `sprite-${expected.characterId} extracted MP3 bytes differ from the frozen result`,
    );
  }
  if (!(stream.mp3[0] === 0xff && (stream.mp3[1] & 0xe0) === 0xe0)) {
    throw new Error(`sprite-${expected.characterId} has no MP3 sync word`);
  }
}

function records(scriptSha256, streams) {
  const assets = EXPECTED_IR001_STREAMS.map((expected) => {
    const stream = streams.get(expected.characterId);
    return {
      cueId: expected.cueId,
      streamIndex: expected.streamIndex,
      sourceTimelineId: `sprite-${expected.characterId}`,
      sourceCharacterId: expected.characterId,
      sourceInstanceName: expected.sourceInstanceName,
      sourceRandomExpression: 'random(2)',
      seedModulo: {divisor: 2, remainder: expected.seedRemainder},
      output: `${PUBLIC_DIRECTORY}/${expected.outputFile}`,
      sha256: expected.sha256,
      byteLength: expected.byteLength,
      blockCount: expected.blockCount,
      totalDecodedSamples: expected.totalDecodedSamples,
      decodedSampleDurationMs: Math.round(
        (expected.totalDecodedSamples / expected.sampleRateHz) * 1000,
      ),
      sampleRateHz: expected.sampleRateHz,
      channels: expected.channels,
      format: 'mp3',
      extraction:
        'concatenated original SoundStreamBlock payload bytes after each four-byte MP3 stream header',
      seekSamples: {
        minimum: Math.min(...stream.seekSamples),
        maximum: Math.max(...stream.seekSamples),
      },
      spokenLanguage: 'undetermined-pending-authorized-runtime-listening',
      strictAcceptanceEffect: 'none',
    };
  });
  const common = {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    calibrationId: 'g4-l10-candidate-to-product-v1',
    source: {swf: SOURCE_SWF, swfSha256: SOURCE_SWF_SHA256},
    structuralEvidence: {
      path: SWFMILL_XML,
      sha256: SWFMILL_XML_SHA256,
    },
    generatedBy: {
      script: 'scripts/extract-g4-l10-ir001-soundstreams.mjs',
      sha256: scriptSha256,
      sharedParser: 'scripts/extract-ti-soundstreams.mjs',
    },
    assets,
    authority:
      'Byte-exact product-bridge audio only. Spoken language/content, audible quality, original random choice, parent-child clock phase, runtime synchronization, listening acceptance, human review, and owner acceptance remain unresolved.',
    strictAcceptanceEffect: 'none',
  };
  const manifestText = jsonText({
    ...common,
    assetType: 'extracted-swf-mp3-soundstreams',
    status: 'byte-exact-private-current-js-audio-candidate',
  });
  const receiptText = jsonText({
    ...common,
    evidenceType: 'extracted-swf-audio-assets',
    status: 'byte-exact-extraction-complete-listening-pending',
    generatedAssetManifest: {
      path: PUBLIC_MANIFEST,
      sha256: digest(Buffer.from(manifestText)),
    },
    unresolved: [
      'Both streams require authorized original-runtime listening to classify spoken language and content.',
      'Natural random outcome observation and parent-child audio tick phase remain unverified.',
      'Frame-5 start, terminal stop/removal, completion, Replay, and language-host routing require authoritative runtime and human evidence.',
    ],
  });
  return {manifestText, receiptText};
}

export function parseArguments(values) {
  const options = {
    projectRoot: repositoryRoot,
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--check') options.check = true;
    else if (value === '--json') options.json = true;
    else if (value === '--help' || value === '-h') options.help = true;
    else if (value === '--project-root') {
      const next = values[index + 1];
      if (!next) throw new Error('--project-root requires a value');
      options.projectRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export async function extractG4L10Ir001SoundStreams(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? repositoryRoot);
  const sourcePath = path.join(projectRoot, SOURCE_SWF);
  const xmlPath = path.join(projectRoot, SWFMILL_XML);
  await Promise.all([
    assertHash(sourcePath, SOURCE_SWF_SHA256, 'source SWF'),
    assertHash(xmlPath, SWFMILL_XML_SHA256, 'swfmill XML evidence'),
  ]);
  const streams = await extractMp3SoundStreams(
    xmlPath,
    EXPECTED_IR001_STREAMS.map(({characterId}) => characterId),
  );
  for (const expected of EXPECTED_IR001_STREAMS) {
    validateStream(streams.get(expected.characterId), expected);
  }
  const scriptSha256 = digest(await readFile(scriptPath));
  const {manifestText, receiptText} = records(scriptSha256, streams);
  const files = [
    ...EXPECTED_IR001_STREAMS.map((expected) => ({
      path: path.join(projectRoot, PUBLIC_DIRECTORY, expected.outputFile),
      expected: streams.get(expected.characterId).mp3,
    })),
    {
      path: path.join(projectRoot, PUBLIC_MANIFEST),
      expected: Buffer.from(manifestText),
    },
    {
      path: path.join(projectRoot, AUDIT_RECEIPT),
      expected: Buffer.from(receiptText),
    },
  ];
  const stale = [];
  for (const file of files) {
    const observed = (await exists(file.path))
      ? await readFile(file.path)
      : null;
    if (!observed?.equals(file.expected)) {
      stale.push(portable(path.relative(projectRoot, file.path)));
    }
  }
  if (options.check && stale.length > 0) {
    throw new Error(`IR001 extracted audio assets are stale:\n${stale.join('\n')}`);
  }
  if (!options.check) {
    await mkdir(path.join(projectRoot, PUBLIC_DIRECTORY), {recursive: true});
    for (const file of files) await writeFile(file.path, file.expected);
  }
  return {
    animationId: ANIMATION_ID,
    mode: options.check ? 'check' : 'write',
    streamCount: EXPECTED_IR001_STREAMS.length,
    totalBytes: EXPECTED_IR001_STREAMS.reduce(
      (sum, item) => sum + item.byteLength,
      0,
    ),
    outputs: files.map((file) => portable(path.relative(projectRoot, file.path))),
    stale,
    spokenLanguage: 'undetermined-pending-authorized-runtime-listening',
    strictAcceptanceEffect: 'none',
  };
}

function usage() {
  return `Usage: node scripts/extract-g4-l10-ir001-soundstreams.mjs [--check] [--json] [--project-root <path>]\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(usage());
  else {
    extractG4L10Ir001SoundStreams(options)
      .then((result) => {
        process.stdout.write(
          options.json
            ? `${JSON.stringify(result, null, 2)}\n`
            : `IR001 audio ${result.mode}: ${result.streamCount} streams, ${result.totalBytes} bytes\n`,
        );
      })
      .catch((error) => {
        process.stderr.write(`${error.message}\n`);
        process.exitCode = 1;
      });
  }
}
