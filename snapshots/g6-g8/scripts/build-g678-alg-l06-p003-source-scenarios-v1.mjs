#!/usr/bin/env node
/** Source-structural scenario map only; not the canonical runtime inventory. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L6/RW/L6RW03.swf`;
const AUDIT_ROOT = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const OUTPUT = path.join(ROOT, 'migrations/shared-alg001-l06-p003/audit/source-scenario-map-v1.json');
const PIN = Object.freeze({
  swf: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  audit: '26d5e3a113fd0268d678b8831b70deedfa913c84beb017f3c2e1b7f1a71ec35f',
  facts: '4be20ebbdfa9a84ffc5a9a66d492668479fecd0ad47758622c9f6a37b08c1746',
});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function readPinned(file, sha) {
  assert.equal(realpathSync(file), file, `physical file: ${file}`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `ordinary file: ${file}`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], `stable file: ${file}`);
  assert.equal(digest(bytes), sha, `SHA-256 drift: ${file}`);
  return bytes;
}

export function buildP003SourceScenarios(sourceRoot) {
  assert.equal(sourceRoot, SOURCE_ROOT, 'exact source root');
  assert.equal(realpathSync(sourceRoot), sourceRoot, 'physical source root');
  assert(lstatSync(sourceRoot).isDirectory() && !lstatSync(sourceRoot).isSymbolicLink(), 'real source root');
  readPinned(SOURCE, PIN.swf);
  const audit = JSON.parse(readPinned(`${AUDIT_ROOT}/source-audit.json`, PIN.audit));
  const facts = JSON.parse(readPinned(`${AUDIT_ROOT}/source-facts.json`, PIN.facts));
  assert.equal(audit.animationId, 'shared-alg001-l06-p003');
  assert.equal(audit.source.sha256, PIN.swf);
  assert.equal(facts.header.rootFrameCount, 10);
  assert.equal(facts.header.fps, 12);
  const domains = facts.frameDomains.domains;
  assert.deepEqual(domains.map(domain => [domain.domainId, domain.declaredFrameCount, domain.parentDomainIds]), [
    ['root', 10, []], ['sprite-154', 719, ['root']], ['sprite-158', 1, ['root']],
  ]);
  assert.deepEqual(audit.frameDomains.map(domain => [domain.id, domain.frames]),
    domains.map(domain => [domain.domainId, domain.declaredFrameCount]));
  const root = domains[0];
  for (const id of [154, 158]) {
    const edge = root.placementEdges.find(item => item.characterId === id);
    assert(edge && edge.characterType === 'DefineSprite');
    assert.deepEqual(edge.distinctFrames, [6], `root placement of sprite ${id}`);
  }
  const main = domains[1];
  const equation = audit.sourceText.definitions.filter(item => item.text === 'M = $0.50 ∙ C');
  assert.equal(equation.length, 1, 'one exact source equation');
  const equationEdge = main.placementEdges.find(item => item.characterId === equation[0].characterId);
  assert(equationEdge && equationEdge.characterType === 'DefineText');
  assert.deepEqual(equationEdge.distinctFrames, [531], 'equation source placement frame');
  const runOne = audit.embeddedStream.runs[0], runTwo = audit.embeddedStream.runs[1];
  assert.deepEqual([runOne.firstFrame, runOne.lastFrame, runOne.blockCount], [41, 501, 461]);
  assert.deepEqual([runTwo.firstFrame, runTwo.lastFrame, runTwo.blockCount], [544, 719, 176]);
  assert.deepEqual(audit.embeddedStream.gap, {firstFrame: 502, lastFrame: 543});
  assert.deepEqual(audit.embeddedStream.emptyBlocks.map(item => [item.frame, item.seek]), [[42, 0], [501, -2276]]);
  const placementFrames = [...new Set(main.placementEdges.flatMap(edge => edge.distinctFrames))].sort((a, b) => a - b);
  assert.equal(placementFrames.length, 259, 'main source placement-change frame count');
  assert(placementFrames.every(frame => Number.isInteger(frame) && frame >= 1 && frame <= 719));
  // Frame 544 starts an audio run but contains no placement event; keep the two event types separate.
  for (const frame of [1, 41, 520, 531, 719]) assert(placementFrames.includes(frame));
  const windows = [
    {id: 'before-embedded-run', firstFrame: 1, lastFrame: 40, embeddedAudio: 'none'},
    {id: 'embedded-run-01', firstFrame: 41, lastFrame: 501, embeddedAudio: 'run-01'},
    {id: 'source-no-block-gap-before-equation', firstFrame: 502, lastFrame: 519, embeddedAudio: 'none'},
    {id: 'source-no-block-gap-equation-build', firstFrame: 520, lastFrame: 530, embeddedAudio: 'none'},
    {id: 'source-no-block-gap-equation-complete', firstFrame: 531, lastFrame: 543, embeddedAudio: 'none'},
    {id: 'embedded-run-02-to-terminal-stop', firstFrame: 544, lastFrame: 719, embeddedAudio: 'run-02'},
  ];
  assert.equal(windows[0].firstFrame, 1);
  assert.equal(windows.at(-1).lastFrame, 719);
  for (let index = 1; index < windows.length; index++) assert.equal(windows[index].firstFrame, windows[index - 1].lastFrame + 1);
  assert.equal(windows.filter(window => window.embeddedAudio === 'none')
    .filter(window => window.firstFrame >= 502 && window.lastFrame <= 543)
    .reduce((sum, window) => sum + window.lastFrame - window.firstFrame + 1, 0), 42);
  const document = {
    schemaVersion: 1,
    kind: 'g678-p003-source-structural-scenario-map',
    animationId: audit.animationId,
    status: 'source-structural-only-not-canonical-scenario-inventory',
    source: {path: SOURCE, sha256: PIN.swf, auditPath: `${AUDIT_ROOT}/source-audit.json`,
      auditSha256: PIN.audit, factsPath: `${AUDIT_ROOT}/source-facts.json`, factsSha256: PIN.facts},
    authority: {staticReachabilityOnly: true, originalRuntimeTraceEstablished: false,
      originalRuntimeAudioSyncEstablished: false, currentJsAdmissionEffect: 'none', strictAcceptanceEffect: 'none'},
    frameDomains: domains.map(domain => ({id: domain.domainId, frameCount: domain.declaredFrameCount,
      parentIds: domain.parentDomainIds, staticallyRootReachable: domain.staticallyRootReachable,
      sourceFingerprintSha256: domain.domainFingerprintSha256,
      firstRootPlacementFrame: domain.domainId === 'root' ? null : 6,
      originalRuntimeEstablished: false})),
    scenarios: [
      {id: 'root-preloader-structural', domainId: 'root', firstFrame: 1, lastFrame: 10,
        sourceStopFrames: [1, 6], nestedPlacementFrame: 6,
        caveat: 'Root frame 1 calls an external legacy InternalPreloader; the natural entry transition to frame 6 is not established.'},
      {id: 'source-linear-main-structural', domainId: 'sprite-154', firstFrame: 1, lastFrame: 719,
        windows, sourcePlacementChangeFrames: placementFrames,
        equation: {text: equation[0].text, characterId: equation[0].characterId, placementFrame: 531},
        terminalStopFrame: 719,
        caveat: 'Source tag structure and local candidate, not an authoritative original-runtime natural trace or audio synchronization.'},
      {id: 'root-overlay-structural', domainId: 'sprite-158', firstFrame: 1, lastFrame: 1,
        nestedPlacementFrame: 6,
        caveat: 'Statically placed one-frame sprite; original-runtime compositing and visibility remain unaccepted.'},
    ],
    requiredOriginalRuntimeChecks: [
      'preloader-to-root-frame-6-entry', 'root-and-overlay-visual-compositing',
      'main-frame-1-to-719-natural-trace', 'embedded-run-01-sync',
      'frames-502-to-543-no-block-behavior', 'embedded-run-02-sync',
      'separate-SA-MP3-host-relationship',
    ],
  };
  return Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
}

function main() {
  assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'),
    'usage: build-g678-alg-l06-p003-source-scenarios-v1.mjs [--check]');
  const bytes = buildP003SourceScenarios(process.env.HELP_MATH_G678_SOURCE_ROOT);
  if (process.argv[2] === '--check') assert(readFileSync(OUTPUT).equals(bytes), 'source scenario map drift');
  else try {writeFileSync(OUTPUT, bytes, {flag: 'wx'});}
  catch (error) {if (error.code !== 'EEXIST') throw error; assert(readFileSync(OUTPUT).equals(bytes), 'source scenario map already exists with different bytes');}
  console.log(JSON.stringify({status: process.argv[2] === '--check' ? 'verified' : 'created',
    bytes: bytes.length, sha256: digest(bytes), output: OUTPUT}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
