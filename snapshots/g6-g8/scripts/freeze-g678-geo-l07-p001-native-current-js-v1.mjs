#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const id = 'shared-geo001-l07-p001';
const calibrationId = 'g678-geo-l07-p001-native-current-js-v1';
const sourcePath = 'G6-G8-shared/GEO001/L7/IR/L7IR01.swf';
const sourceSha = '9aafb8a470b5e67f4254b671696940c6fd53be258f517dd6b97abfa511e76430';
const sourceXmlPath = 'G6-G8-shared/GEO001/L7/index.xml';
const sourceXmlSha = '09a64f93291f211b3f3641acf1b91e08bc77ed2e435636eaa5271e26f717fe9b';
const runPath = `work/g678-shared-page-factory/${calibrationId}/run-manifest.json`;
const memberPath = `work/g678-shared-page-factory/${calibrationId}/members/${id}/member-manifest.json`;
const packetPath = `catalog/product-bridge-calibrations/${calibrationId}.json`;
const implementation = [
  'packages/demos/src/modules/g678-geo-l07-native-introduction-p001.tsx',
  'packages/demos/src/timelines/g678-geo-l07-p001.ts',
  'packages/demos/src/geo-l07-p001-timeline-v1.ts',
  'packages/demos/src/geo-l07-p001-text-v1.ts',
  'packages/demos/src/geo-l07-p001-renderer-v1.tsx',
  'packages/demos/src/geo-l07-p001-v1.css',
  'packages/demos/src/generated/geo001-l07-p001-source-ir-v1.json',
];
const inputs = [
  'migrations/shared-geo001-l07-p001/audit/movie.xml',
  'migrations/shared-geo001-l07-p001/audit/ffdec-26.2.1/texts/140.txt',
  'migrations/shared-geo001-l07-p001/audit/ffdec-26.2.1/texts/141.txt',
  'scripts/build-g678-geo-l07-p001-ir.py',
];
const effects = Object.freeze({authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false, audioAccepted: false, humanVisualAccepted: false,
  ownerAccepted: false, strictComplete: false, released: false, published: false});
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function pinned(base, relative) {
  const file = path.join(base, relative);
  const stat = lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
    realpathSync(file) === file, `physical file: ${relative}`);
  const bytes = readFileSync(file);
  return {path: relative, bytes: bytes.length, sha256: sha(bytes)};
}

function build(checkedAt) {
  assert(realpathSync(sourceRoot) === sourceRoot && lstatSync(sourceRoot).isDirectory(),
    'real AWS source root');
  const source = pinned(sourceRoot, sourcePath);
  const sourceXml = pinned(sourceRoot, sourceXmlPath);
  assert(source.bytes === 18537 && source.sha256 === sourceSha &&
    sourceXml.sha256 === sourceXmlSha, 'exact lesson sources');
  const catalog = JSON.parse(readFileSync(path.join(root,
    'catalog/g678-page-only-release-manifest.v1.json')));
  const matches = catalog.releases.flatMap(release => release.members)
    .filter(member => member.animationId === id);
  assert(matches.length === 1 && matches[0].ordinal === 1 &&
    matches[0].sectionCode === 'IR' && matches[0].source.sha256 === sourceSha &&
    matches[0].source.path === 'HELP_COURSES/GEO001/L7/IR/L7IR01.swf',
  'unique source-ordered placement');
  execFileSync('python3', ['scripts/build-g678-geo-l07-p001-ir.py', '--check'],
    {cwd: root, stdio: 'pipe'});
  const inputPins = inputs.map(relative => pinned(root, relative));
  const implementationPins = implementation.map(relative => pinned(root, relative));
  const run = {
    schemaVersion: 1, kind: 'g678-bounded-source-ir-run-v1', runId: calibrationId,
    checkedAt, deploymentScope: 'local-only',
    source: {path: sourcePath, sha256: sourceSha, physicalRoot: sourceRoot},
    toolchain: {ffdec: '26.2.1', swfmill: '0.3.6', python: '3.14.7'},
    inputs: inputPins.map(({path, sha256}) => ({path, sha256})),
    output: {path: implementationPins[6].path, sha256: implementationPins[6].sha256},
    checks: {sourceIrRebuild: 'passed', exclusiveWriteRace: 'passed',
      pureFrameState: 'passed', scopedTypeScript: 'passed', modernHostBrowser: 'not-run',
      fullTypography: 'not-run', originalRuntime: 'not-run'},
    productCalibrationPassed: false, scaleOutAuthorized: false, acceptanceEffects: effects,
  };
  const runBytes = json(run);
  const member = {
    schemaVersion: 1, kind: 'g678-maintained-dom-member-v1', animationId: id,
    assetId: `swf-${sourceSha}`, complexityLane: 'behavior-heavy',
    laneReason: 'Root-visible title is simple, but original host preloader, catalog RandomAudio and unplaced legacy control reachability remain unresolved; bounded manual semantic presentation only.',
    sourceSwfSha256: sourceSha, rootFrameCount: 10,
    mainFrameDomain: 'sprite-142', mainFrameCount: 130,
    implementation: implementationPins, deploymentScope: 'local-only',
    productCalibrationPassed: false, originalRuntimeAccepted: false,
    audioAccepted: false, strictComplete: false, published: false,
  };
  const memberBytes = json(member);
  const artifacts = {kind: 'maintained-dom-module-v1',
    module: implementationPins[0], timeline: implementationPins[1],
    memberManifest: {path: memberPath, bytes: memberBytes.length, sha256: sha(memberBytes)},
    sourceRun: {path: runPath, bytes: runBytes.length, sha256: sha(runBytes)}};
  const selected = {animationId: id, placementId: id, globalPageOrdinal: 1,
    sectionCode: 'IR', sourceSha256: sourceSha, complexityLane: 'behavior-heavy',
    runtime: {rendererBinding: artifacts},
    runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics: 'renderer-restart-only-source-behavior-not-established',
      productVisualBehaviorComposite: 'not-established'}};
  const packet = {schemaVersion: 1, calibrationId, deploymentScope: 'local-only',
    sourceRoot, source, sourceXml: {path: sourceXml.path, sha256: sourceXml.sha256},
    selectedPages: [selected], entry: {key: id, artifacts},
    productCalibrationPassed: false, scaleOutAuthorized: false, acceptanceEffects: effects};
  return new Map([[runPath, runBytes], [memberPath, memberBytes], [packetPath, json(packet)]]);
}

const mode = process.argv[2];
assert(mode === '--write' || mode === '--check', 'use --write or --check');
const currentRun = mode === '--check' ? JSON.parse(readFileSync(path.join(root, runPath))) : null;
const checkedAt = currentRun?.checkedAt ?? new Date().toISOString();
const outputs = build(checkedAt);
for (const [relative, bytes] of outputs) {
  const file = path.join(root, relative);
  if (mode === '--write') assert(!existsSync(file), `no replace: ${relative}`);
  else assert(readFileSync(file).equals(bytes), `freeze drift: ${relative}`);
}
if (mode === '--write') for (const [relative, bytes] of outputs) {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), {recursive: true});
  writeFileSync(file, bytes, {flag: 'wx'});
}
console.log(`${mode === '--check' ? 'PASS' : 'CREATED'} ${calibrationId} (${outputs.size} pinned files)`);
