#!/usr/bin/env node
// Restore the exact asset profiles before tests. These outputs are test inputs,
// not additions to the frozen deployment upload inventory.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {brotliDecompressSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pack = await readJson('deployment/current-js-controlled-preview-v2/manifest.json');
const packed = new Map(pack.entries.map((entry) => [entry.sha256, entry]));
const legacyHash = '863191baf3afc666cdd0ad5db837fe79fdc8892e502137ed75bde9e95f15f090';
let count = 0;
for (const profile of ['production', 'candidate']) {
  const document = await readJson(`apps/web/config/current-js-${profile}-assets.v1.json`);
  for (const entry of document.entries) {
    assert.match(entry.assetPath, /^courses\/[a-zA-Z0-9_./-]+$/);
    assert(!entry.assetPath.split('/').includes('..'));
    let bytes;
    const record = packed.get(entry.sha256);
    if (record) {
      const encoded = await readFile(path.join(root, 'deployment/current-js-controlled-preview-v2/blobs', `${entry.sha256}.br`));
      assert.equal(encoded.length, record.compressedBytes);
      assert.equal(digest(encoded), record.compressedSha256);
      bytes = brotliDecompressSync(encoded);
    } else {
      assert.equal(entry.sha256, legacyHash, 'Unreviewed asset absent from deployment pack');
      bytes = brotliDecompressSync(await readFile(path.join(root, 'scripts/fixtures/site-ci-assets', `${legacyHash}.br`)));
    }
    assert.equal(bytes.length, entry.bytes, entry.assetPath);
    assert.equal(digest(bytes), entry.sha256, entry.assetPath);
    const storage = profile === 'candidate'
      ? `candidate-assets/flash-assets/${document.version}`
      : `${entry.storageRoot === 'public' ? 'public' : 'server-assets'}/flash-assets`;
    const target = path.join(root, 'apps/web', storage, entry.assetPath);
    await mkdir(path.dirname(target), {recursive: true});
    const existing = await readFile(target).catch((error) => {if (error.code !== 'ENOENT') throw error; return null;});
    if (existing) assert.equal(digest(existing), entry.sha256, `Refusing to replace ${entry.assetPath}`);
    else await writeFile(target, bytes, {flag: 'wx'});
    count += 1;
  }
}
console.log(JSON.stringify({verifiedProfileEntries: count, deploymentInputsModified: false}));
