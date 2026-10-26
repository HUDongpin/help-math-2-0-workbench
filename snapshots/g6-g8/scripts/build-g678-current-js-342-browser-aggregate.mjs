#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT = 'output/playwright/g678-current-js-342-v1/evidence.json';
const PREDECESSOR = 'output/playwright/g678-current-js-339-v1/evidence.json';
const INCREMENTAL =
  'output/playwright/g678-alg-l09-game-assessment-342-v1/evidence.json';
const FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-registration-v1.json';
const FALSE_EFFECTS = Object.freeze({authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  released: false, published: false});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, json = false) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function expectedArtifact() {
  const [predecessor, incremental, freeze, builder] = await Promise.all([
    binding(PREDECESSOR, true), binding(INCREMENTAL, true),
    binding(FREEZE, true), binding(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  invariant(predecessor.value.artifactType ===
      'g678-current-js-339-browser-qa-v1' &&
    predecessor.value.registeredCurrentJsPages === 339 &&
    predecessor.value.samples.length === 89 &&
    predecessor.value.screenshots.length === 90 &&
    incremental.value.artifactType ===
      'g678-alg-l09-game-assessment-browser-qa-v1' &&
    incremental.value.registeredCurrentJsPages === 342 &&
    incremental.value.allLessons.registeredPageSum === 342 &&
    exact(incremental.value.allLessons.completeLessonKeys,
      ['shared-alg001-l09']) && incremental.value.screenshots.length === 6 &&
    incremental.value.controllerAndGame.levelHandoffInherited === true &&
    incremental.value.controllerAndGame.controllerReplayReset === true &&
    incremental.value.controllerAndGame.matchingReplayReset === true &&
    incremental.value.controllerAndGame.level1ScoringAndResetPassed === true &&
    incremental.value.controllerAndGame.level1VisibleCardLabels.length === 12 &&
    incremental.value.controllerAndGame.visibleCardLabels.length === 12 &&
    incremental.value.finalAssessment.sourceQuestionContentVisible === true &&
    incremental.value.finalAssessment.visibleQuestionContent.length === 10 &&
    incremental.value.finalAssessment.twoChoiceQuestionCount > 0 &&
    incremental.value.finalAssessment.correctResponseCount === 9 &&
    incremental.value.finalAssessment.wrongResponse !== null &&
    incremental.value.finalAssessment.fqReplayReset === true &&
    incremental.value.finalAssessment.allObservedRequestsLoopback === true &&
    incremental.value.finalAssessment.allObservedRequestsExplicitlyAllowed ===
      true &&
    incremental.value.finalAssessment.legacyNetworkOperationsObserved === 0 &&
    freeze.value.registrationCandidatePlacementCount === 342 &&
    freeze.value.selectedPages.length === 342,
  '342 aggregate browser inputs drifted');
  const newSamples = Object.freeze([
    Object.freeze({animationId: 'shared-alg001-l09-p030',
      kind: 'typed-cross-page-game-controller',
      selectedLevel: incremental.value.controllerAndGame.selectedLevel,
      levelHandoffInherited:
        incremental.value.controllerAndGame.levelHandoffInherited,
      replayReset: incremental.value.controllerAndGame.controllerReplayReset,
      navigationTarget: incremental.value.controllerAndGame.navigationTarget}),
    Object.freeze({animationId: 'shared-alg001-l09-p031',
      kind: 'two-level-matching-game',
      finalScore: incremental.value.controllerAndGame.finalScore,
      matchedPairCount: incremental.value.controllerAndGame.matchedPairCount,
      level1ScoringAndResetPassed:
        incremental.value.controllerAndGame.level1ScoringAndResetPassed,
      replayReset: incremental.value.controllerAndGame.matchingReplayReset,
      level1VisibleCardCount:
        incremental.value.controllerAndGame.level1VisibleCardLabels.length,
      visibleCardCount:
        incremental.value.controllerAndGame.visibleCardLabels.length}),
    Object.freeze({animationId: 'shared-alg001-l09-p041',
      kind: 'random-ten-final-assessment',
      questionPoolSize: incremental.value.finalAssessment.questionPoolSize,
      presentedQuestionCount:
        incremental.value.finalAssessment.presentedQuestionCount,
      uniqueQuestionCount: incremental.value.finalAssessment.uniqueQuestionCount,
      sourceQuestionContentVisible:
        incremental.value.finalAssessment.sourceQuestionContentVisible,
      correctResponseCount:
        incremental.value.finalAssessment.correctResponseCount,
      wrongResponse: incremental.value.finalAssessment.wrongResponse,
      replayReset: incremental.value.finalAssessment.fqReplayReset,
      allObservedRequestsLoopback:
        incremental.value.finalAssessment.allObservedRequestsLoopback,
      allObservedRequestsExplicitlyAllowed:
        incremental.value.finalAssessment
          .allObservedRequestsExplicitlyAllowed,
      twoChoiceQuestionCount:
        incremental.value.finalAssessment.twoChoiceQuestionCount,
      reviewCount: incremental.value.finalAssessment.reviewCount}),
  ]);
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-current-js-342-browser-qa-v1',
    generatedAt: new Date().toISOString(),
    baseUrl: 'http://127.0.0.1:3324',
    inputs: Object.freeze({predecessor: descriptor(predecessor),
      incremental: descriptor(incremental), freeze: descriptor(freeze),
      builder: descriptor(builder)}),
    registeredCurrentJsPages: 342,
    allLessons: incremental.value.allLessons,
    samples: Object.freeze([...predecessor.value.samples, ...newSamples]),
    screenshots: Object.freeze([...predecessor.value.screenshots,
      ...incremental.value.screenshots]),
    browserEvidenceComposition: Object.freeze({
      predecessorLiveSampleCount: 89,
      incrementalLiveSampleCount: 3,
      totalLiveSampleCount: 92,
      predecessorScreenshotCount: 90,
      incrementalScreenshotCount: 6,
      totalScreenshotCount: 96,
      noSyntheticBrowserExecutionClaim: true,
    }), acceptanceEffects: FALSE_EFFECTS});
}

const args = process.argv.slice(2);
invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
  'usage: build-g678-current-js-342-browser-aggregate.mjs [--check]');
const check = args[0] === '--check';
const artifact = await expectedArtifact();
const bytes = stableBytes(artifact);
let receipt = bytes;
if (check) {
  const current = await binding(OUTPUT, true);
  const expected = stableBytes({...artifact, generatedAt: current.value.generatedAt});
  invariant(current.buffer.equals(expected), '342 browser aggregate drifted');
  receipt = current.buffer;
} else {
  const directory = path.dirname(projectPath(OUTPUT));
  invariant(!await lstat(directory).then(() => true, () => false),
    `${directory} already exists`);
  const stage = `${directory}.staging-${process.pid}`;
  await mkdir(stage, {recursive: false});
  await writeFile(path.join(stage, 'evidence.json'), bytes, {flag: 'wx'});
  await rename(stage, directory);
}
process.stdout.write(`${JSON.stringify({check, output: OUTPUT,
  bytes: receipt.length, sha256: sha256(receipt),
  registeredCurrentJsPages: 342, sampledModules: 92,
  screenshotCount: 96, acceptanceEffects: FALSE_EFFECTS}, null, 2)}\n`);
