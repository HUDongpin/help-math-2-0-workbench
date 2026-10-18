#!/usr/bin/env node
// The proxy only needs to know whether an asset path is in the controlled
// preview supplement and which release it belongs to. Importing the full
// supplement (sizes, digests, source paths) put 9.4 MB of JSON into the proxy
// bundle, so the proxy reads this generated index instead.

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SUPPLEMENT_PATH = path.join(webRoot, 'config/current-js-controlled-preview-supplement.v1.json');
export const INDEX_PATH = path.join(webRoot, 'config/current-js-controlled-preview-supplement-index.v1.json');

export function buildSupplementIndex(sourceBytes) {
  const supplement = JSON.parse(sourceBytes);
  const releases = {};
  const seen = new Set();
  for (const {assetPath, releaseId} of supplement.entries) {
    if (seen.has(assetPath)) throw new Error(`Duplicate supplement asset: ${assetPath}`);
    seen.add(assetPath);
    const slash = assetPath.lastIndexOf('/');
    const directory = assetPath.slice(0, slash);
    const file = assetPath.slice(slash + 1);
    ((releases[releaseId] ??= {})[directory] ??= []).push(file);
  }
  return {
    schemaVersion: 1,
    source: 'current-js-controlled-preview-supplement.v1.json',
    sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
    entryCount: seen.size,
    releases,
  };
}

export function serializeSupplementIndex(index) {
  return `${JSON.stringify(index)}\n`;
}

async function main() {
  const expected = serializeSupplementIndex(buildSupplementIndex(await readFile(SUPPLEMENT_PATH)));
  if (process.argv.includes('--check')) {
    const actual = await readFile(INDEX_PATH, 'utf8').catch(() => '');
    if (actual !== expected) {
      console.error(`${path.relative(webRoot, INDEX_PATH)} is stale. Run: node scripts/controlled-preview-supplement-index.mjs`);
      process.exit(1);
    }
    return;
  }
  await writeFile(INDEX_PATH, expected);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
