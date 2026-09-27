#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, rename, unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {brotliCompress, brotliDecompress, constants} from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACK = path.join(ROOT, 'deployment/current-js-controlled-preview-v2');
const PREVIOUS_PACK = path.join(ROOT, 'deployment/current-js-controlled-preview');
const MANIFEST = path.join(PACK, 'manifest.json');
const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const PROFILE = 'current-js-1751-controlled-preview-v1';

function assert(value, message) {
  if (!value) throw new Error(message);
}

function safePath(relative) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) &&
    relative.split('/').every((part) => /^[a-zA-Z0-9._-]+$/.test(part) && part !== '.' && part !== '..'),
  'Unsafe asset path');
  return path.join(ROOT, relative);
}

async function records() {
  const [production, candidate, supplement] = await Promise.all([
    readFile(path.join(ROOT, 'apps/web/config/current-js-production-assets.v1.json')).then(JSON.parse),
    readFile(path.join(ROOT, 'apps/web/config/current-js-candidate-assets.v1.json')).then(JSON.parse),
    readFile(path.join(ROOT, 'apps/web/config/current-js-controlled-preview-supplement.v1.json')).then(JSON.parse),
  ]);
  assert(production.entries.length === 1320 && candidate.entries.length === 1331, 'Asset profile count mismatch');
  assert(supplement.schemaVersion === 1 && supplement.profileId === PROFILE && Object.values(supplement.authority).every((value) => value === false), 'Supplement scope mismatch');
  const replacements = new Set(supplement.entries.map((entry) => entry.assetPath));
  assert(supplement.entries.length === replacements.size, 'Duplicate supplement path');
  return [
    ...production.entries.map((entry) => ({
      ...entry,
      source: `apps/web/${entry.storageRoot === 'public' ? 'public' : 'server-assets'}/flash-assets/${entry.assetPath}`,
      destination: `apps/web/${entry.storageRoot === 'public' ? 'public' : 'server-assets'}/flash-assets/${entry.assetPath}`,
    })),
    ...candidate.entries.filter((entry) => !replacements.has(entry.assetPath)).map((entry) => ({
      ...entry,
      source: `apps/web/candidate-assets/flash-assets/${candidate.version}/${entry.assetPath}`,
      destination: `apps/web/public/current-js-preview-assets/${entry.assetPath}`,
    })),
    ...supplement.entries,
  ];
}

async function pack() {
  const entries = await records();
  await mkdir(path.join(PACK, 'blobs'), {recursive: true});
  const byHash = new Map();
  let next = 0;
  await Promise.all(Array.from({length: 3}, async () => {
    while (next < entries.length) {
      const index = next++;
      const entry = entries[index];
      const bytes = await readFile(safePath(entry.source));
      assert(bytes.length === entry.bytes && digest(bytes) === entry.sha256, `Asset bytes changed: ${entry.assetPath}`);
      if (!byHash.has(entry.sha256)) {
        const work = (async () => {
          const cached = await readFile(path.join(PREVIOUS_PACK, 'blobs', `${entry.sha256}.br`)).catch((error) => {if (error.code !== 'ENOENT') throw error; return null;});
          const encoded = cached ?? await compress(bytes, {params: {[constants.BROTLI_PARAM_QUALITY]: 6}});
          assert(digest(await decompress(encoded)) === entry.sha256, `Compression roundtrip failed: ${entry.assetPath}`);
          await writeFile(path.join(PACK, 'blobs', `${entry.sha256}.br`), encoded, {flag: 'wx'});
          return {compressedBytes: encoded.length, compressedSha256: digest(encoded)};
        })();
        byHash.set(entry.sha256, work);
      }
      Object.assign(entry, await byHash.get(entry.sha256));
      if ((index + 1) % 250 === 0) process.stdout.write(`Packed ${index + 1}/${entries.length} assets\n`);
    }
  }));
  const unique = await Promise.all([...byHash.values()]);
  const manifest = {
    schemaVersion: 1, profileId: PROFILE, encoding: 'br',
    recordedAt: new Date().toISOString(),
    counts: {entries: entries.length, uniqueBlobs: unique.length,
      unpackedBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
      packedBytes: unique.reduce((sum, entry) => sum + entry.compressedBytes, 0)},
    entries,
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx'});
  process.stdout.write(`${JSON.stringify(manifest.counts)}\n`);
}

async function materialize(checkOnly) {
  const manifest = JSON.parse(await readFile(MANIFEST));
  const expected = await records();
  assert(manifest.schemaVersion === 1 && manifest.profileId === PROFILE && manifest.encoding === 'br', 'Wrong asset pack');
  assert(manifest.entries.length === expected.length, 'Asset pack membership mismatch');
  const fields = ['assetPath', 'bytes', 'sha256', 'storageRoot', 'releaseId', 'source', 'destination'];
  for (let index = 0; index < expected.length; index++) {
    const entry = manifest.entries[index];
    assert(fields.every((field) => entry[field] === expected[index][field]), `Asset pack entry mismatch at ${index}`);
    const encoded = await readFile(path.join(PACK, 'blobs', `${entry.sha256}.br`));
    assert(encoded.length === entry.compressedBytes && digest(encoded) === entry.compressedSha256, `Compressed asset changed: ${entry.assetPath}`);
    const bytes = await decompress(encoded);
    assert(bytes.length === entry.bytes && digest(bytes) === entry.sha256, `Decoded asset changed: ${entry.assetPath}`);
    if (!checkOnly) {
      const target = safePath(entry.destination);
      await mkdir(path.dirname(target), {recursive: true});
      const existing = await readFile(target).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
        return null;
      });
      if (existing && existing.length === entry.bytes && digest(existing) === entry.sha256) continue;
      const temporary = `${target}.materialize-${process.pid}`;
      try {
        await writeFile(temporary, bytes, {flag: 'wx'});
        await rename(temporary, target);
      } finally {
        await unlink(temporary).catch((error) => {if (error.code !== 'ENOENT') throw error;});
      }
    }
  }
  process.stdout.write(`${JSON.stringify({checked: expected.length, materialized: !checkOnly, profileId: PROFILE})}\n`);
}

const action = process.argv[2];
if (action === '--pack') await pack();
else if (action === '--materialize') await materialize(false);
else if (action === '--check') await materialize(true);
else throw new Error('Use --pack, --materialize, or --check');
