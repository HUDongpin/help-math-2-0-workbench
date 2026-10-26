#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'apps/web/.next-alg-p003-production-scan-20260925');
const runsFile = path.join(root, 'packages/demos/src/alg-l06-p003-source-runs.generated.ts');
const expected = [
  {bytes: 190580, sha256: 'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70'},
  {bytes: 73060, sha256: '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db'},
];

function sourceRunMarkers() {
  const source = readFileSync(runsFile, 'utf8');
  const values = [...source.matchAll(/base64: "([A-Za-z0-9+/=]+)"/gu)].map(match => match[1]);
  assert.equal(values.length, expected.length, 'exactly two generated source runs required');
  return values.flatMap((value, index) => {
    const bytes = Buffer.from(value, 'base64');
    assert.equal(bytes.length, expected[index].bytes, `run ${index + 1} byte length`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected[index].sha256,
      `run ${index + 1} source hash`);
    return [value.slice(0, 128), value.slice(-128)];
  });
}

export function scanPublishedBuild(directory, markers) {
  assert.equal(statSync(path.join(directory, 'BUILD_ID')).isFile(), true, 'production BUILD_ID required');
  let files = 0;
  const hits = [];
  function visit(folder) {
    for (const entry of readdirSync(folder, {withFileTypes: true})) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) {
        files++;
        const bytes = readFileSync(file);
        if (markers.some(marker => bytes.includes(marker))) hits.push(path.relative(directory, file));
      }
    }
  }
  // Next's webpack cache is not a published asset. It may retain pre-fix modules,
  // so scan the actual client and server output, never the mutable build cache.
  visit(path.join(directory, 'static'));
  visit(path.join(directory, 'server'));
  return {files, hits};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = scanPublishedBuild(buildDir, sourceRunMarkers());
  assert.deepEqual(result.hits, [], 'P003 source-run bytes entered published build output');
  process.stdout.write(JSON.stringify({status: 'production-source-runs-absent',
    buildDir, filesScanned: result.files, sourceRuns: expected.length}) + '\n');
}
