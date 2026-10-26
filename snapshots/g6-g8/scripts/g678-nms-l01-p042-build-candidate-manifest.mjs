#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {ROOT, ID, SOURCE, FALSE_GATES, file, desc, hash, json, RUN as EXTRACTION} from './g678-nms-l01-p042-extract-source.mjs';
import {build as verifyVisual, RUN as VISUAL} from './g678-nms-l01-p042-build-source-visual.mjs';
import {audit as verifyAudio, RUN as AUDIO} from './g678-nms-l01-p042-audit-audio.mjs';
export const OUT = 'catalog/g678-nms-l01-p042-candidate-v1.json';
const VALIDATION = 'work/g678-shared-page-factory/g678-nms-l01-p042-candidate-validation-v1';
const MODULE = 'packages/demos/src/g678-nms-l01-p042-candidate.tsx';
const EVIDENCE = {path: 'output/playwright/g678-nms-l01-p042-mounted-v2/evidence.json', bytes: 173309,
  sha256: '1dd5d600b0a86747993898d454b96b4adb45c4a23cd5f3ba1c8221f400bfc683'};
const REVIEW = {path: 'work/g678-shared-page-factory/g678-nms-l01-p042-independent-audit-AfZ16d/MODULE_REVIEW.md', bytes: 5345,
  sha256: 'b108a803581c8fbc01002fb0f2ed450eda4fed2ab725c3c0b675a28d5f6c7883'};
const TESTS = ['packages/demos/tests/g678-nms-l01-p042-candidate.test.tsx',
  'scripts/g678-nms-l01-p042-source-visual.test.mjs', 'scripts/g678-nms-l01-p042-audit-audio.test.mjs',
  'scripts/g678-nms-l01-p042-build-candidate-manifest.test.mjs', 'scripts/qa-g678-nms-l01-p042-mounted.test.mjs'];
export function validateMounted(evidence) {
  assert.equal(evidence.status, 'passed'); assert.equal(evidence.inputsUnchanged, true);
  assert.deepEqual(evidence.inputsAfter, evidence.inputs); assert.equal(evidence.registered, false); assert.equal(evidence.actualMyLesson, false);
  for (const key of ['productCalibrationPassed', 'sourceAudioIntegrated', 'audioAccepted', 'authoritativeOriginalRuntime',
    'visualFidelityAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'released', 'published']) assert.equal(evidence[key], false);
  assert.equal(evidence.pure.validFrameStates, 125); assert.equal(evidence.pure.distinctVisualStateHashes, 1);
  assert.equal(evidence.pure.invalidContextsBlocked, 14); assert.equal(evidence.records.length, 4);
  assert.deepEqual(evidence.records.map(record => [record.width, record.motion]),
    [[1440,'no-preference'],[1440,'reduce'],[390,'no-preference'],[390,'reduce']]);
  for (const record of evidence.records) {
    assert.equal(record.status, 'passed'); assert.deepEqual(record.errors, []); assert.deepEqual(record.requests, []);
    assert.equal(record.final.frame, 125); assert.equal(record.final.replay, 3); assert.equal(record.final.requests, 0);
    assert.equal(record.final.complete, 'true'); assert.equal(record.final.completions, record.motion === 'reduce' ? 4 : 2);
    assert.ok(record.geometry.length >= 6); assert.equal(record.screenshots.length, 3);
    for (const geometry of record.geometry) {
      assert.deepEqual(geometry.duplicateIds, []); assert.deepEqual(geometry.badReferences, []); assert.equal(geometry.mediaElements, 0);
      assert.ok(geometry.documentWidth <= geometry.viewport + 1); assert.equal(geometry.figures.length, 2);
      for (const figure of geometry.figures) {assert.equal(figure.lang, 'en'); assert.equal(figure.controls, 0); assert.deepEqual(figure.clips, []);}
    }
    if (record.motion === 'no-preference') {
      assert.equal(record.firstNaturalClock.expectedFirstToTerminalMs, 124 * 1000 / 12);
      assert.ok(record.firstNaturalClock.activeMs >= 10000 && record.firstNaturalClock.activeMs <= 12000);
      assert.ok(record.firstNaturalClock.actuallyObservedFrames.includes(1) && record.firstNaturalClock.actuallyObservedFrames.includes(125));
    }
  }
}
// Vendor dependency links may be part of the installed dependency graph. Bind
// their canonical targets explicitly; generated/source outputs never use this path.
async function dependency(pin) {
  const canonical = await realpath(path.resolve(ROOT, pin.path)); const observed = await file(canonical);
  assert.deepEqual({...desc(observed), path: pin.path}, pin);
  return {...pin, canonicalPath: canonical};
}
export async function build({check = false} = {}) {
  await verifyVisual({check: true}); await verifyAudio({check: true});
  const visualFile = await file(`${VISUAL}/run.json`), visual = JSON.parse(visualFile.buffer);
  const extractionFile = await file(`${EXTRACTION}/extraction.json`, visual.extraction), extraction = JSON.parse(extractionFile.buffer);
  // Stronger physical output check than the visual generator's byte regeneration check.
  const extractedFiles = await Promise.all(extraction.files.map(async item => desc(await file(`${EXTRACTION}/${item.path}`, {...item, path: `${EXTRACTION}/${item.path}`}))));
  const visualOutputs = await Promise.all(visual.outputs.map(async pin => desc(await file(pin.path, pin))));
  const toolchainFiles = [];
  for (const tool of [extraction.toolchain.ffdec.launcher, extraction.toolchain.ffdec.jar, extraction.toolchain.ffdec.java,
    ...extraction.toolchain.ffdec.jarManifest.classPath, extraction.toolchain.swfmill]) {
    toolchainFiles.push(desc(await file(tool.realPath, {path: tool.realPath, bytes: tool.bytes, sha256: tool.sha256})));
  }
  const evidenceFile = await file(EVIDENCE.path, EVIDENCE), evidence = JSON.parse(evidenceFile.buffer); validateMounted(evidence);
  const dependencies = await Promise.all(evidence.inputs.map(dependency));
  const screenshots = [];
  for (const record of evidence.records) for (const shot of record.screenshots) screenshots.push(desc(await file(shot.path, shot)));
  const fixture = await file(path.join(path.dirname(EVIDENCE.path), 'fixture-bundle.js'));
  assert.deepEqual({bytes: fixture.bytes, sha256: fixture.sha256}, evidence.fixture);
  await file(REVIEW.path, REVIEW);
  const ownPaths = [MODULE, ...TESTS, path.relative(ROOT, fileURLToPath(import.meta.url)),
    'scripts/g678-nms-l01-p042-audit-audio.mjs', ...visual.codeDependencyClosure.map(pin => pin.path)];
  const codeDependencyClosure = await Promise.all([...new Set(ownPaths)].sort().map(async p => desc(await file(p))));
  for (const pin of visual.codeDependencyClosure) await file(pin.path, pin);
  const dump = await promisify(execFile)(process.execPath, ['--import','tsx','--input-type=module','-e',
    `import {G678_NMS_L01_P042_CANDIDATE_MODULE as m,G678_NMS_L01_P042_CONFIG as config} from './${MODULE}'; const {Renderer,getFrameState,...metadata}=m; console.log(JSON.stringify({config,metadata}));`], {cwd: ROOT});
  assert.equal(dump.stderr, ''); const actualModule = JSON.parse(dump.stdout);
  assert.equal(actualModule.metadata.key, ID); assert.equal(actualModule.config.sourceSwfSha256, SOURCE.sha256);
  assert.deepEqual(actualModule.metadata.lessonHost.capabilities, []); assert.deepEqual(actualModule.metadata.audioTracks, []);
  if (!check) {
    await mkdir(path.join(ROOT, VALIDATION)); const results = [];
    for (const [label, args] of [['units',['--import','tsx','--test',...TESTS]],
      ['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']]]) {
      const result = await promisify(execFile)(process.execPath, args, {cwd: ROOT, encoding: 'buffer', maxBuffer: 8*1024*1024}).catch(async error => {
        for (const name of ['stdout','stderr']) await writeFile(path.join(ROOT, VALIDATION, `${label}.failed.${name}`), error[name] ?? '', {flag:'wx'}); throw error;
      });
      const output = {};
      for (const name of ['stdout','stderr']) {const p = `${VALIDATION}/${label}.${name}`; await writeFile(path.join(ROOT,p),result[name],{flag:'wx',mode:0o444}); output[name] = desc(await file(p));}
      assert.equal(result.stderr.length, 0); if (label === 'units') assert.match(result.stdout.toString(), /pass 16\b/);
      results.push({command:[process.execPath,...args], exitCode:0, ...output});
    }
    await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({codeDependencyClosure,dependencies,results}),{flag:'wx',mode:0o444});
  }
  const validationFile = await file(`${VALIDATION}/validation.json`), validation = JSON.parse(validationFile.buffer);
  assert.deepEqual(validation.codeDependencyClosure, codeDependencyClosure); assert.deepEqual(validation.dependencies, dependencies);
  for (const result of validation.results) {assert.equal(result.exitCode,0); for (const key of ['stdout','stderr']) await file(result[key].path,result[key]);}
  assert.deepEqual(await Promise.all(evidence.inputs.map(dependency)),dependencies);
  assert.deepEqual(await Promise.all(codeDependencyClosure.map(async pin => desc(await file(pin.path,pin)))),codeDependencyClosure);
  const manifest = {schemaVersion:1, artifactType:'g678-nms-l01-p042-source-static-unregistered-candidate', candidateId:'g678-nms-l01-p042-candidate-v1',
    animationId:ID, gradeScope:'G6-G8-shared', source:SOURCE, module:desc(await file(MODULE)), moduleExport:'G678_NMS_L01_P042_CANDIDATE_MODULE', actualModule,
    sourceExtraction:desc(extractionFile), sourceVisualRun:desc(visualFile), extractedFiles, visualOutputs, toolchainFiles, codeDependencyClosure,
    lane:visual.lane, generatedVisualIsNotRegistered:true, borrowedCalibrationAuthority:false,
    sourceBehavior:{rootFrames:10,entryRootFrame:6,mainDomain:'sprite-23',mainFrames:125,mainTerminalStop:125,fps:12,
      distinctMainVisualStates:1,titleSiblingCharacterId:3,sourceRootMainMatrix:visual.normalizer.sourceXmlMatrix,
      sourceActionsExecuted:false,entryAdapter:actualModule.config.entryAdapter,originalReplayParity:false},
    sourceAudio:{machineAudit:desc(await file(`${AUDIO}/audit.json`)),fullEofDecodePassed:true,delivered:false,accepted:false,
      disposition:'Exact118 source blocks, including sample counts/seek offsets/latency, retained; no audio route, URL, trim, or alternate audio substitution.'},
    validation:{receipt:desc(validationFile),unitTestsPassed:16,demosTypecheckPassed:true,mountedEvidence:desc(evidenceFile),mountedRecordsPassed:4,
      compiledFixture:desc(fixture),dependencies,screenshots,independentEngineeringReview:REVIEW,namedHumanReview:false,
      checkMode:'Physically rehashes source/extraction/outputs/tools and regenerates visual/module metadata in memory; does not repeat Java extraction, browser capture or audio decode.'},
    limitations:['Unregistered candidate; no My Lesson descriptor/registry/product-calibration change.',
      'No authoritative original-runtime preloader, sequence, Replay, visual or audio evidence.',
      'English authored vectors and accessible text retained. Native source text scales below20px on390px; mobile readability and Spanish alternatives remain uncalibrated.',
      'Source is static through125 main frames; these are not125 distinct visual drawings.',
      'Source audio requires exact runtime delivery, source seek/priming/pause/Replay lifecycle work and listening acceptance.',
      'No strict migration acceptance, human/Owner decisions, release membership or publication authority.'],gates:FALSE_GATES};
  const bytes = json(manifest);
  if (check) assert.equal((await file(OUT)).buffer.toString(),bytes);
  else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx',mode:0o444});
  return {check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),units:16,mountedRecords:4,gates:FALSE_GATES};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2); assert.ok(args.length<=1 && (!args.length||args[0]==='--check'));
  console.log(json(await build({check:args[0]==='--check'})));
}
