#!/usr/bin/env node
/** Source-only P003 audit. It never edits the AWS archive or registers Current-JS. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {extractTerminalStream} from './prepare-g678-terminal-source-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l06-p003';
const SWF = 'G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const SA = 'G6-G8-shared/ALG001/L6/SA/L6RW03.mp3';
const SWF_SHA = 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766';
const SA_SHA = 'd280e8f5e653c165755baf2f8960cfd667f03205d2f9aaafe1820a15d327f89a';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');

function readPhysical(file) {
  assert.equal(realpathSync(file), file, 'physical source path');
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && (before.mode & 0o222n) === 0n, 'read-only ordinary source');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key]);
  return bytes;
}

export function buildP003Audit(sourceRoot) {
  assert(typeof sourceRoot === 'string' && path.isAbsolute(sourceRoot) && realpathSync(sourceRoot) === sourceRoot &&
    lstatSync(sourceRoot).isDirectory() && !lstatSync(sourceRoot).isSymbolicLink(), 'real source root');
  const catalogBytes = readFileSync(path.join(ROOT, 'catalog/g678-shared-catalog.v1.json'));
  const pages = JSON.parse(catalogBytes).lessons.flatMap(lesson => lesson.pages.filter(page => page.animationId === ID));
  assert.equal(pages.length, 1, 'one canonical placement');
  const page = pages[0];
  assert.equal(page.viewPath, SWF);
  assert.equal(page.sourceSha256, SWF_SHA);
  assert.equal(page.globalOrdinal, 3);
  assert.equal(page.sectionCode, 'RW');
  assert.equal(page.sectionPageOrdinal, 2);
  assert.equal(page.audioCueCandidates.length, 1);
  assert.equal(page.audioCueCandidates[0].viewPath, SA);
  assert.equal(page.audioCueCandidates[0].sha256, SA_SHA);
  const swf = readPhysical(path.join(sourceRoot, SWF));
  const sa = readPhysical(path.join(sourceRoot, SA));
  assert.equal(swf.length, 1220637);
  assert.equal(sha(swf), SWF_SHA);
  assert.equal(sa.length, 135408);
  assert.equal(sha(sa), SA_SHA);

  const facts = parseSwfSourceFacts(swf), text = collectSwfTextSourceCatalog(swf);
  const domains = facts.frameDomains.domains;
  assert.equal(facts.header.version, 6);
  assert.deepEqual(facts.header.stage, {xMinTwips: 0, xMaxTwips: 16000, yMinTwips: 0, yMaxTwips: 12000, width: 800, height: 600});
  assert.equal(facts.header.fps, 12);
  assert.equal(facts.header.rootFrameCount, 10);
  assert.deepEqual(domains.map(d => [d.domainId, d.declaredFrameCount]), [['root', 10], ['sprite-154', 719], ['sprite-158', 1]]);
  assert.equal(facts.tagCounts.DefineButton ?? 0, 0);
  assert.equal(facts.tagCounts.DefineButton2 ?? 0, 0);
  assert.equal(facts.tagCounts.SoundStreamBlock, 637);
  assert.equal(text.sourceSha256, SWF_SHA);
  const textDefinitions = text.textDefinitions.map(item => ({characterId: item.characterId,
    sourceTextId: item.sourceTextId, sourceTagSha256: item.sourceTagSha256,
    text: item.runs.map(run => run.text).join('')}));
  assert(textDefinitions.some(item => item.text === 'M = $0.50 ∙ C'), 'source equation');

  const stream = extractTerminalStream(swf, 'sprite-154');
  assert.deepEqual(stream.actions.filter(item => item.domain === 'sprite-154').map(item => [item.frame, item.hex]), [[719, '0700']]);
  assert.deepEqual(stream.actions.filter(item => item.domain === 'root').map(item => item.frame), [1, 6]);
  assert.deepEqual(stream.heads.map(item => [item.domain, item.frame, item.hex]), [['sprite-154', 1, '0a2a2d078906']]);
  const runs = [[41, 501], [544, 719]].map(([firstFrame, lastFrame]) => {
    const blocks = stream.blocks.filter(block => block.frame >= firstFrame && block.frame <= lastFrame);
    assert.deepEqual(blocks.map(block => block.frame), Array.from({length: lastFrame - firstFrame + 1}, (_, i) => firstFrame + i));
    return {firstFrame, lastFrame, blockCount: blocks.length, mp3Bytes: blocks.reduce((n, b) => n + b.mp3Bytes, 0),
      declaredSamples: blocks.reduce((n, b) => n + b.samples, 0)};
  });
  assert.equal(runs[0].mp3Bytes + runs[1].mp3Bytes, stream.mp3.length);
  assert.deepEqual(stream.blocks.filter(b => b.mp3Bytes === 0), [
    {frame: 42, samples: 0, seek: 0, mp3Bytes: 0},
    {frame: 501, samples: 0, seek: -2276, mp3Bytes: 0},
  ]);
  const runOne = stream.mp3.subarray(0, runs[0].mp3Bytes), runTwo = stream.mp3.subarray(runs[0].mp3Bytes);
  const audit = {
    schemaVersion: 1, kind: 'g678-alg-l06-p003-source-audit-v1', animationId: ID,
    source: {path: SWF, bytes: swf.length, sha256: SWF_SHA},
    catalog: {path: 'catalog/g678-shared-catalog.v1.json', sha256: sha(catalogBytes)},
    separateSaCandidate: {path: SA, bytes: sa.length, sha256: SA_SHA, disposition: 'relationship-to-embedded-stream-unresolved'},
    header: facts.header,
    frameDomains: domains.map(d => ({id: d.domainId, frames: d.declaredFrameCount,
      observedFrames: d.observedShowFrameCount, fingerprintSha256: d.domainFingerprintSha256,
      scriptTagCount: d.scriptTagCount, audioTagCount: d.audioTagCount})),
    sourceText: {catalogSha256: sha(json(text)), definitions: textDefinitions, risks: text.risks},
    embeddedStream: {domain: 'sprite-154', headHex: stream.heads[0].hex, firstFrame: 41,
      lastFrame: 719, blockCount: stream.blocks.length, gap: {firstFrame: 502, lastFrame: 543},
      emptyBlocks: stream.blocks.filter(b => b.mp3Bytes === 0),
      allMp3: {bytes: stream.mp3.length, sha256: sha(stream.mp3)},
      runs: [{...runs[0], sha256: sha(runOne)}, {...runs[1], sha256: sha(runTwo)}],
      blocks: stream.blocks},
    acceptance: {currentJsRegistered: false, originalRuntimeAccepted: false, fidelityAccepted: false,
      audioAccepted: false, humanAccepted: false, ownerAccepted: false, strictComplete: false, published: false},
  };
  return {audit: json(audit), facts: json(facts), text: json(text), mp3: stream.mp3, runOne, runTwo};
}

function main() {
  const check = process.argv.includes('--check');
  const args = process.argv.filter(arg => arg !== '--check');
  assert.equal(args.length, 4, 'usage: node script --output <existing-ordinary-directory> [--check]');
  assert.equal(args[2], '--output');
  const output = path.resolve(args[3]);
  assert.equal(realpathSync(output), output);
  assert(lstatSync(output).isDirectory() && output.startsWith('/Volumes/American Dream/hudongpin/'));
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  const result = buildP003Audit(sourceRoot);
  const files = [
    ['source-audit.json', result.audit], ['source-facts.json', result.facts],
    ['source-text-catalog.json', result.text],
    ['source-stream.mp3', result.mp3], ['source-run-01.mp3', result.runOne], ['source-run-02.mp3', result.runTwo],
  ];
  for (const [name, bytes] of files) {
    const file = path.join(output, name);
    if (check) assert(readFileSync(file).equals(bytes), `${name} drifted`);
    else {
      try {writeFileSync(file, bytes, {flag: 'wx'});}
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        assert(readFileSync(file).equals(bytes), `${name} already exists with different bytes`);
      }
    }
  }
  console.log(JSON.stringify({status: check ? 'verified' : 'created', output,
    files: files.map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha(bytes)}))}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
