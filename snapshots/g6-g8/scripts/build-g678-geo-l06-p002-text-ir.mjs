#!/usr/bin/env node
/** Exact, acceptance-neutral text records for GEO001 L6 page 2. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf';
const SOURCE_SHA = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44';
const OUTPUT = path.join(ROOT, 'packages/demos/src/generated/geo001-l06-p002-text-ir-v1.json');
const IDS = [8, 11, 24, 25, 28, 30, 33, 209, 215, 219, 221, 222, 226, 227, 228, 229];
const hash = value => createHash('sha256').update(value).digest('hex');

async function render() {
  assert((await lstat(SOURCE)).isFile() && (await realpath(SOURCE)) === SOURCE,
    'source must be a physical file');
  const raw = await readFile(SOURCE);
  assert.equal(hash(raw), SOURCE_SHA, 'source SWF hash drift');
  const catalog = collectSwfTextSourceCatalog(raw);
  assert.equal(catalog.summary.textDefinitions, 16);
  assert.equal(catalog.summary.unparsedTags, 0);
  assert.deepEqual(catalog.textDefinitions.map(item => item.characterId).sort((a, b) => a - b), IDS);
  const byId = new Map(catalog.textDefinitions.map(item => [item.characterId, item]));
  const fullText = id => byId.get(id).runs.map(run => run.text).join('');
  assert.equal(fullText(209), 'Area is the amount of surface in a two-dimensional figure.');
  for (const id of [215, 219, 221, 222]) assert.equal(fullText(id), fullText(209));
  assert.equal(fullText(226), 'radius  diameter');
  assert.equal(fullText(227), ',');
  for (const id of [228, 229]) assert.equal(fullText(id), fullText(226));
  const definitions = IDS.map(id => {
    const source = byId.get(id);
    return {characterId: id, boundsTwips: source.boundsTwips, matrix: source.matrix,
      runs: source.runs.map(run => ({text: run.text, colorRgba: run.colorRgba,
        fontId: run.fontId, fontHeightTwips: run.fontHeightTwips}))};
  });
  const output = {schemaVersion: 1, kind: 'g678-source-text-ir-v1',
    animationId: 'shared-geo001-l06-p002', sourceSwfSha256: SOURCE_SHA,
    sourceCatalogContentSha256: hash(JSON.stringify(catalog)), definitions,
    sourceRisks: catalog.risks.map(risk => risk.kind),
    claimBoundary: 'Source text records only; native rendering, role decisions, translation, host and fidelity remain unaccepted.'};
  return Buffer.from(`${JSON.stringify(output, null, 2)}\n`);
}

const args = process.argv.slice(2);
assert(args.length >= 1 && ['--write', '--check'].includes(args[0]) &&
  (args.length === 1 || (args.length === 3 && args[1] === '--output')),
  'Usage: node build-g678-geo-l06-p002-text-ir.mjs <--write|--check> [--output path]');
const output = args.length === 3 ? path.resolve(args[2]) : OUTPUT;
const data = await render();
if (args[0] === '--write') await writeFile(output, data, {flag: 'wx'});
else assert.deepEqual(await readFile(output), data, 'source text IR drift');
console.log(JSON.stringify({status: 'PASS', definitions: IDS.length, bytes: data.length, sha256: hash(data)}));
