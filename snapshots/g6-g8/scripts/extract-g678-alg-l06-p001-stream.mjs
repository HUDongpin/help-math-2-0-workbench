#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

import {extractMp3SoundStreams} from './extract-ti-soundstreams.mjs';

const run = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRelativePath = 'G6-G8-shared/ALG001/L6/IR/L6IR01.swf';
const sourceSha256 = '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35';
const xmlSha256 = '52eb09f452be9f0c8f16578754dc15b78903270b5725daeed04f0199e43f7e0a';
const mp3Sha256 = 'b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a';
const outputBase = 'migrations/shared-alg001-l06-p001';
const xmlOutput = `${outputBase}/audit/machine/swfmill.xml.gz`;
const mp3Output = `${outputBase}/assets/source-stream-142.mp3`;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function assertRealFile(filePath, label) {
  const entry = await lstat(filePath);
  if (!entry.isFile() || entry.isSymbolicLink()) {
    throw new Error(`${label} must be a real file, not a symlink`);
  }
}

async function sourcePathFor(sourceRoot) {
  const root = path.resolve(sourceRoot);
  const entry = await lstat(root);
  if (!entry.isDirectory() || entry.isSymbolicLink() || await realpath(root) !== root) {
    throw new Error('Source root must be a real directory, not a symlink');
  }
  const sourcePath = path.join(root, sourceRelativePath);
  await assertRealFile(sourcePath, 'Source SWF');
  if (await realpath(sourcePath) !== sourcePath) {
    throw new Error('Source SWF must not be reached through a symlink');
  }
  if (sha256(await readFile(sourcePath)) !== sourceSha256) {
    throw new Error('Source SWF SHA-256 differs from the reviewed P001 source');
  }
  return sourcePath;
}

async function assertOutputMatches(filePath, expected, label) {
  await assertRealFile(filePath, label);
  if (!(await readFile(filePath)).equals(expected)) {
    throw new Error(`${label} differs from the source-derived output`);
  }
}

export async function extractG678AlgL06P001Stream({
  sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT,
  projectRoot = repositoryRoot,
  check = false,
} = {}) {
  if (!sourceRoot) throw new Error('HELP_MATH_G678_SOURCE_ROOT is required');
  const sourcePath = await sourcePathFor(sourceRoot);
  const temporary = await mkdtemp(path.join(tmpdir(), 'g678-alg-l06-p001-'));
  try {
    const xmlPath = path.join(temporary, 'movie.xml');
    const gzipPath = path.join(temporary, 'movie.xml.gz');
    await run('swfmill', ['swf2xml', sourcePath, xmlPath], {maxBuffer: 1024 * 1024});
    const xml = await readFile(xmlPath);
    if (sha256(xml) !== xmlSha256) {
      throw new Error(`swfmill XML SHA-256 ${sha256(xml)} differs from the reviewed P001 audit ${xmlSha256}`);
    }
    const compressedXml = gzipSync(xml, {level: 9});
    await writeFile(gzipPath, compressedXml);
    const stream = (await extractMp3SoundStreams(gzipPath, [142])).get(142);
    if (
      !stream?.head || stream.head.compression !== '2' ||
      stream.head.soundRate !== '2' || stream.head.playbackRate !== '2' ||
      stream.head.soundStereo !== '0' || stream.head.playbackStereo !== '0' ||
      stream.blocks.length !== 134 || stream.totalDecodedSamples !== 245952 ||
      stream.mp3.length !== 55510 || sha256(stream.mp3) !== mp3Sha256
    ) throw new Error('sprite-142 MP3 stream differs from the reviewed source result');
    const outputs = [
      {path: path.join(projectRoot, xmlOutput), bytes: compressedXml, label: 'SWF XML evidence'},
      {path: path.join(projectRoot, mp3Output), bytes: stream.mp3, label: 'embedded MP3'},
    ];
    if (check) {
      for (const output of outputs) await assertOutputMatches(output.path, output.bytes, output.label);
    } else {
      for (const output of outputs) {
        await mkdir(path.dirname(output.path), {recursive: true});
        await writeFile(output.path, output.bytes, {flag: 'wx'});
      }
    }
    return {
      animationId: 'shared-alg001-l06-p001',
      mode: check ? 'check' : 'write',
      sourceSha256,
      xmlSha256,
      mp3Sha256,
      blockCount: stream.blocks.length,
      sampleCount: stream.totalDecodedSamples,
      outputs: [xmlOutput, mp3Output],
      acceptance: 'structural-extraction-only',
    };
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node scripts/extract-g678-alg-l06-p001-stream.mjs --write|--check');
    process.exitCode = 2;
  } else {
    extractG678AlgL06P001Stream({check: mode === '--check'})
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
