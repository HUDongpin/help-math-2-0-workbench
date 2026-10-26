#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const PREFIX = 'g678-alg-l11-behavior10-tranche-b';
const RUN_ID = `${PREFIX}-current-js-v1`;
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const INPUT_PATHS = Object.freeze({
  audit: `catalog/${PREFIX}-audit-v1.json`,
  decision: `catalog/${PREFIX}-source-divergence-v1.json`,
  state: `packages/demos/src/${PREFIX}-state.ts`,
  core: `packages/demos/src/${PREFIX}-candidate-core.tsx`,
  tutorial: `packages/demos/src/${PREFIX}-tutorial-candidate.tsx`,
  guided: `packages/demos/src/${PREFIX}-guided-candidate.tsx`,
  candidates: `packages/demos/src/${PREFIX}-candidates.tsx`,
});
const EXPECTED_INPUT_HASHES = Object.freeze({
  audit:
    '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8',
  decision:
    'e4214120ddff6b052487dd339efb4421bdba88cd0532cf448c8200cf1969a89e',
  state:
    '664b790258ff06c6a18189acd3153954accfdd138135282a7557190654f3a492',
  core:
    '1e87c5320cde77bc06e81c7f28d9d3a58e6e58a425a5e346f43530141d75be57',
  tutorial:
    '0d980da48db1b2a3d82079d99bc67b2a33067e657b175b3a2d95b78a255c1d98',
  guided:
    '102a2969a749a36ed8784cf6c7d389c994427257e703a250372db2b0bb11be19',
  candidates:
    '165580c6eb79458ef5c9cdab20db64b859d3a97b882a821ba5fdd6d6bdb1f29c',
});
const IDS = Object.freeze([
  'shared-alg001-l11-p026', 'shared-alg001-l11-p027',
  'shared-alg001-l11-p028', 'shared-alg001-l11-p029',
  'shared-alg001-l11-p030', 'shared-alg001-l11-p031',
  'shared-alg001-l11-p032', 'shared-alg001-l11-p040',
  'shared-alg001-l11-p041', 'shared-alg001-l11-p042',
]);
const DIVERGENCE_IDS = Object.freeze(IDS.slice(7));
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  behaviorAccepted: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function projectPath(relative) {
  const target = path.resolve(ROOT, relative);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relative} escapes project root`);
  return target;
}

async function exists(target) {
  return stat(target).then(() => true, () => false);
}

async function stableFile(target, {absolute = false, json = false,
  readOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical${readOnly ? ' read-only' : ''} file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolved : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    identity: Object.freeze({device: String(after.dev), inode: String(after.ino),
      size: String(after.size), mtimeNs: String(after.mtimeNs),
      mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)}),
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(binding, displayPath = binding.path) {
  return Object.freeze({path: displayPath, bytes: binding.bytes,
    sha256: binding.sha256});
}

function outputPaths(animationId) {
  const suffix = animationId.slice(-4);
  return Object.freeze({
    timeline: `packages/demos/src/timelines/${PREFIX}-${suffix}.ts`,
    module: `packages/demos/src/modules/${PREFIX}-${suffix}.tsx`,
  });
}

function constantName(animationId) {
  return `${PREFIX}-${animationId.slice(-4)}`
    .replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
}

function candidateExport(animationId) {
  return `${PREFIX}-${animationId.slice(-4)}-candidate`
    .replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
}

function sourceProjection(member, divergence) {
  return Object.freeze({
    source: member.source,
    audioCandidate: member.audioCandidate,
    familyId: member.familyId,
    implementationLane: member.implementationLane,
    sourceStateMachine: member.sourceStateMachine,
    answerVisibleGeometryCrosswalk: member.answerVisibleGeometryCrosswalk,
    helpPopup: member.helpPopup,
    sourceAuditPassed: member.sourceAuditPassed,
    p1Blockers: member.p1Blockers,
    sourceDivergenceDecision: divergence,
  });
}

export function validateBehavior10GeneratorInputs({audit, decision,
  stateSource, coreSource, tutorialSource, guidedSource, candidatesSource,
  hashes}) {
  invariant(audit?.artifactType ===
    'g678-alg-l11-behavior10-tranche-b-audit-v1' &&
    audit.status ===
      'exact-10-source-binary-script-text-answer-geometry-audited-unregistered-original-runtime-blocked' &&
    exact(audit.selectedPlacementIds, IDS) &&
    audit.sourceAuditPassedPlacementCount === 10 &&
    audit.freshFfdecBinaryClosureCount === 10 &&
    audit.answerVisibleGeometryCrosswalkCount === 10 &&
    audit.tsAnsBtn1SemanticCResolvedCount === 3 &&
    audit.p028GraphGeometryBoundCount === 1 &&
    audit.p029FeedbackOrderingResolvedCount === 1 &&
    audit.p030AbsoluteValueGlyphBoundCount === 1 &&
    audit.registrationCandidatePlacementCount === 0 &&
    audit.currentJavaScriptRegisteredPlacementCount === 0 &&
    audit.productCalibrationPassed === false &&
    audit.wholeLessonEngineeringPreviewReady === false &&
    audit.scaleOutAuthorized === false &&
    Object.values(audit.acceptanceEffects).every((value) => value === false),
  'behavior10 source-audit boundary drifted');
  invariant(decision?.artifactType ===
    'g678-alg-l11-behavior10-tranche-b-source-divergence-v1' &&
    exact(decision.scope.exactDivergencePlacementIds, DIVERGENCE_IDS) &&
    decision.maintainedCandidateSuppressionAuthorizedPlacementCount === 3 &&
    decision.sourceDivergenceDecisionEstablishedCount === 3 &&
    decision.originalRuntimeDispositionEstablishedCount === 0 &&
    decision.independentReviewPassed === false &&
    decision.registrationCandidatePlacementCount === 0 &&
    decision.currentJavaScriptRegisteredPlacementCount === 0 &&
    decision.productCalibrationPassed === false &&
    decision.browserProductCalibrationPassed === false &&
    decision.scaleOutAuthorized === false &&
    Object.values(decision.acceptanceEffects)
      .every((value) => value === false),
  'behavior10 divergence-decision boundary drifted');
  invariant(exact(hashes, EXPECTED_INPUT_HASHES),
    'behavior10 generator input hash binding drifted');
  invariant(typeof stateSource === 'string' &&
    stateSource.includes(EXPECTED_INPUT_HASHES.audit) &&
    stateSource.includes(EXPECTED_INPUT_HASHES.decision) &&
    stateSource.includes('candidateModuleMaturity: "private-current-js"') &&
    stateSource.includes('domRendererImplemented: true') &&
    stateSource.includes('registrationCandidatePlacementCount: 0') &&
    stateSource.includes('currentJavaScriptRegisteredPlacementCount: 0') &&
    stateSource.includes('productCalibrationPassed: false') &&
    stateSource.includes('browserProductCalibrationPassed: false'),
  'behavior10 maintained state boundary drifted');
  invariant(typeof coreSource === 'string' &&
    coreSource.includes('data-current-javascript-implemented="true"') &&
    coreSource.includes('data-dom-renderer-implemented="true"') &&
    coreSource.includes('data-current-javascript-registered="false"') &&
    coreSource.includes('maturity: "private-current-js"') &&
    coreSource.includes('staleAngleOverlaySuppressed') &&
    typeof tutorialSource === 'string' &&
    tutorialSource.includes('l11-tutorial-multi-question-choice') &&
    typeof guidedSource === 'string' &&
    guidedSource.includes('l11-guided-tutorial-choice') &&
    guidedSource.includes('suppressedByMaintainedCandidate') &&
    typeof candidatesSource === 'string' &&
    IDS.every((id) => candidatesSource.includes(id)) &&
    ![stateSource, coreSource, tutorialSource, guidedSource, candidatesSource]
      .some((source) =>
        /(?:registry\.generated|local-only-animation-registry|private-current-js-registry|fetch\s*\(|XMLHttpRequest|\bgetURL\s*\(|\bfscommand\s*\(|_root\.|_global\.)/u
          .test(source)),
  'behavior10 maintained candidate boundary drifted');
  invariant(exact(audit.members.map((member) => member.animationId), IDS) &&
    decision.entries.length === 3 &&
    decision.entries.every((entry, index) =>
      entry.animationId === DIVERGENCE_IDS[index] &&
      entry.decision.maintainedCandidateMaySuppressStaleAngleOverlay === true &&
      entry.decision.originalRuntimeDispositionEstablished === false &&
      entry.sourceEvidence.correctHelp.instanceName === 'Mc_Popup' &&
      entry.sourceEvidence.staleAngleOverlay.instanceName === 'Mc_PopUp' &&
      entry.sourceEvidence.staleAngleOverlay
        .exactActionScriptReferenceCount === 0),
  'behavior10 exact member/divergence order drifted');
  for (const member of audit.members) {
    const divergence = decision.entries.find((entry) =>
      entry.animationId === member.animationId) ?? null;
    invariant(member.sourceAuditPassed === true &&
      member.registrationCandidate === false &&
      member.productCalibrationPassed === false &&
      member.wholeLessonEngineeringPreviewReady === false &&
      member.sourceStateMachine.frameCount ===
        member.sourceStateMachine.terminalFrame &&
      member.sourceStateMachine.resumeFrame ===
        member.sourceStateMachine.quizFrame + 1 &&
      member.answerVisibleGeometryCrosswalk.rows.length === 4 &&
      member.answerVisibleGeometryCrosswalk.rows.filter((row) =>
        row.correct).length === 1 &&
      Object.values(member.acceptanceEffects)
        .every((value) => value === false) &&
      (DIVERGENCE_IDS.includes(member.animationId)
        ? divergence !== null && member.helpPopup.staleAngleOverlay !== null
        : divergence === null && member.helpPopup.staleAngleOverlay === null),
    `${member.animationId}: generator member boundary drifted`);
  }
  return true;
}

async function loadContext() {
  const [builder, audit, decision, state, core, tutorial, guided, candidates] =
    await Promise.all([
      stableFile(SCRIPT_PATH, {absolute: true}),
      stableFile(INPUT_PATHS.audit, {json: true, readOnly: true}),
      stableFile(INPUT_PATHS.decision, {json: true, readOnly: true}),
      stableFile(INPUT_PATHS.state), stableFile(INPUT_PATHS.core),
      stableFile(INPUT_PATHS.tutorial), stableFile(INPUT_PATHS.guided),
      stableFile(INPUT_PATHS.candidates),
    ]);
  const hashes = Object.freeze({audit: audit.sha256,
    decision: decision.sha256, state: state.sha256, core: core.sha256,
    tutorial: tutorial.sha256, guided: guided.sha256,
    candidates: candidates.sha256});
  validateBehavior10GeneratorInputs({audit: audit.value,
    decision: decision.value, stateSource: state.buffer.toString('utf8'),
    coreSource: core.buffer.toString('utf8'),
    tutorialSource: tutorial.buffer.toString('utf8'),
    guidedSource: guided.buffer.toString('utf8'),
    candidatesSource: candidates.buffer.toString('utf8'), hashes});
  return Object.freeze({builder, audit, decision, state, core, tutorial,
    guided, candidates,
    inputs: Object.freeze({builder: descriptor(builder,
      `scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs`),
    reviewedAudit: descriptor(audit), sourceDivergenceDecision:
      descriptor(decision), maintainedState: descriptor(state),
    candidateCore: descriptor(core), tutorialWrapper: descriptor(tutorial),
    guidedWrapper: descriptor(guided), maintainedCandidates:
      descriptor(candidates)})});
}

export function buildBehavior10TimelineSource(member, divergence) {
  const name = constantName(member.animationId);
  const sourceEvidence = sourceProjection(member, divergence);
  const value = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-behavior10-tranche-b-unregistered-timeline-v1',
    runId: RUN_ID, animationId: member.animationId,
    deploymentScope: 'local-only', reviewedLane: member.implementationLane,
    sourceEvidence,
    sourceEvidenceSha256: sha256(stableBytes(sourceEvidence)),
    runtime: Object.freeze({rootFrameCount: 10, fps: 12,
      stage: Object.freeze({width: 800, height: 600}),
      mainTimeline: Object.freeze({objectId:
        member.sourceStateMachine.mainObjectId,
      frameDomain: `sprite-${member.sourceStateMachine.mainObjectId}`,
      frameCount: member.sourceStateMachine.frameCount,
      quizFrame: member.sourceStateMachine.quizFrame,
      resumeFrame: member.sourceStateMachine.resumeFrame,
      terminalFrame: member.sourceStateMachine.terminalFrame,
      placementDepth: 4, rootFrame: 6})}),
    candidateModuleMaturity: 'private-current-js',
    currentJavaScriptImplemented: true, domRendererImplemented: true,
    staleAngleOverlaySuppressedByDecision: divergence !== null,
    registrationCandidate: false, currentJavaScriptRegistered: false,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false, releaseAuthorized: false, published: false,
    acceptanceEffects: FALSE_EFFECTS,
  });
  return `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `\nexport const ${name}_TIMELINE = Object.freeze(${JSON.stringify(value, null, 2)} as const);\n`;
}

export function buildBehavior10ModuleSource(member) {
  const name = constantName(member.animationId);
  const candidate = candidateExport(member.animationId);
  const suffix = member.animationId.slice(-4);
  return `"use client";\n\n` +
    `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `import {${candidate} as CANDIDATE} from "../${PREFIX}-candidates";\n` +
    `import {${name}_TIMELINE} from "../timelines/${PREFIX}-${suffix}";\n\n` +
    `if (CANDIDATE.module.key !== ${name}_TIMELINE.animationId || CANDIDATE.module.maturity !== "private-current-js" || ${name}_TIMELINE.domRendererImplemented !== true || ${name}_TIMELINE.currentJavaScriptRegistered !== false) {\n` +
    `  throw new Error("${member.animationId}: generated unregistered DOM candidate binding drifted");\n` +
    `}\n\n` +
    `export const ${name}_SOURCE_TIMELINE = ${name}_TIMELINE;\n` +
    `export const ${name}_DOM_RENDERER_IMPLEMENTED = true as const;\n` +
    `export const ${name}_REGISTRATION_CANDIDATE = false as const;\n` +
    `export const ${name}_CURRENT_JAVASCRIPT_REGISTERED = false as const;\n` +
    `export default CANDIDATE.module;\n`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function directoryInventory(root) {
  const files = [];
  const directories = [];
  async function walk(current, prefix = '') {
    const entries = (await readdir(current, {withFileTypes: true}))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.join(prefix, entry.name).split(path.sep).join('/');
      invariant(!entry.isSymbolicLink(), `${absolute} may not be a symlink`);
      if (entry.isDirectory()) {
        directories.push(Object.freeze({path: relative}));
        await walk(absolute, relative);
      } else {
        invariant(entry.isFile(), `${absolute} must be an ordinary file`);
        const binding = await stableFile(absolute, {absolute: true});
        files.push(Object.freeze({path: relative, bytes: binding.bytes,
          sha256: binding.sha256}));
      }
    }
  }
  await walk(root);
  return Object.freeze({directories: Object.freeze(directories),
    files: Object.freeze(files), fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    checksumSetSha256: sha256(Buffer.from(files.map((file) =>
      `${file.sha256}  ${file.path}\n`).join('')))});
}

async function freezeTree(root) {
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await freezeTree(target);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      await chmod(target, 0o444);
    }
  }
  await chmod(root, 0o555);
}

async function thawAndRemove(root) {
  async function thaw(current) {
    await chmod(current, 0o755);
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await thaw(target);
      else if (entry.isFile()) await chmod(target, 0o644);
    }
  }
  await thaw(root);
  await rm(root, {recursive: true});
}

async function verifyFrozenTree(root) {
  const metadata = await lstat(root, {bigint: true});
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    Number(metadata.mode & 0o777n) === 0o555,
  `${root} must be a frozen 0555 run root`);
  async function walk(current) {
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const target = path.join(current, entry.name);
      const currentMetadata = await lstat(target, {bigint: true});
      invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
      if (entry.isDirectory()) {
        invariant(Number(currentMetadata.mode & 0o777n) === 0o555,
          `${target} must be a frozen directory`);
        await walk(target);
      } else {
        invariant(entry.isFile() && currentMetadata.nlink === 1n &&
          Number(currentMetadata.mode & 0o777n) === 0o444,
        `${target} must be a frozen single-link file`);
      }
    }
  }
  await walk(root);
}

async function build(context, stageRoot) {
  const tracked = new Map();
  const members = [];
  for (const auditMember of context.audit.value.members) {
    const divergence = context.decision.value.entries.find((entry) =>
      entry.animationId === auditMember.animationId) ?? null;
    const paths = outputPaths(auditMember.animationId);
    const timelineBytes = Buffer.from(buildBehavior10TimelineSource(
      auditMember, divergence));
    const moduleBytes = Buffer.from(buildBehavior10ModuleSource(auditMember));
    tracked.set(paths.timeline, timelineBytes);
    tracked.set(paths.module, moduleBytes);
    const sourceEvidence = sourceProjection(auditMember, divergence);
    const member = Object.freeze({animationId: auditMember.animationId,
      source: auditMember.source, familyId: auditMember.familyId,
      implementationLane: auditMember.implementationLane,
      sourceEvidenceSha256: sha256(stableBytes(sourceEvidence)),
      mainTimeline: Object.freeze({objectId:
        auditMember.sourceStateMachine.mainObjectId,
      frameDomain: `sprite-${auditMember.sourceStateMachine.mainObjectId}`,
      frameCount: auditMember.sourceStateMachine.frameCount,
      quizFrame: auditMember.sourceStateMachine.quizFrame,
      resumeFrame: auditMember.sourceStateMachine.resumeFrame,
      terminalFrame: auditMember.sourceStateMachine.terminalFrame,
      placementDepth: 4, rootFrame: 6}),
      timeline: Object.freeze({path: paths.timeline,
        bytes: timelineBytes.length, sha256: sha256(timelineBytes)}),
      moduleFile: Object.freeze({path: paths.module,
        bytes: moduleBytes.length, sha256: sha256(moduleBytes)}),
      candidateModuleMaturity: 'private-current-js',
      currentJavaScriptImplemented: true, domRendererImplemented: true,
      staleAngleOverlaySuppressedByDecision: divergence !== null,
      registrationCandidate: false, currentJavaScriptRegistered: false,
      productCalibrationPassed: false,
      browserProductCalibrationPassed: false,
      wholeLessonEngineeringPreviewReady: false,
      scaleOutAuthorized: false, releaseAuthorized: false, published: false,
      acceptanceEffects: FALSE_EFFECTS});
    const memberRoot = path.join(stageRoot, 'members',
      auditMember.animationId);
    await mkdir(memberRoot, {recursive: true});
    const memberBytes = stableBytes({schemaVersion: 1,
      artifactType:
        'g678-alg-l11-behavior10-tranche-b-generated-member-v1',
      runId: RUN_ID, ...member});
    await writeFile(path.join(memberRoot, 'member-manifest.json'), memberBytes,
      {flag: 'wx'});
    members.push(Object.freeze({...member,
      memberManifest: Object.freeze({path:
        `${OUTPUT_ROOT}/members/${auditMember.animationId}/member-manifest.json`,
      bytes: memberBytes.length, sha256: sha256(memberBytes)})}));
  }
  invariant(members.length === 10 && tracked.size === 20,
    'behavior10 exact generated member/output denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'), inventoryBytes,
    {flag: 'wx'});
  const run = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-behavior10-tranche-b-current-js-run-v1',
    runId: RUN_ID, status: 'generated-unregistered-dom-candidate',
    deploymentScope: 'local-only', inputs: context.inputs,
    exactPlacementCount: 10, generatedTimelineCount: 10,
    generatedModuleCount: 10, registryEntriesWritten: 0,
    candidateModuleMaturity: 'private-current-js',
    currentJavaScriptImplementedPlacementCount: 10,
    domRendererImplementedPlacementCount: 10,
    staleAngleOverlaySuppressedPlacementCount: 3,
    outputInventory: Object.freeze({path: `${OUTPUT_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)}),
    members: Object.freeze(members), registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false, acceptancePassed: false,
    releaseAuthorized: false, published: false,
    acceptanceEffects: FALSE_EFFECTS});
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${OUTPUT_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const entries = members.map((member) => Object.freeze({
    key: member.animationId,
    module: `./modules/${PREFIX}-${member.animationId.slice(-4)}`,
    maturity: 'private-current-js', deploymentScope: 'local-only',
    currentJavaScriptImplemented: true, domRendererImplemented: true,
    registrationCandidate: false, currentJavaScriptRegistered: false,
    source: member.source, familyId: member.familyId,
    mainTimeline: member.mainTimeline, timeline: member.timeline,
    moduleFile: member.moduleFile, memberManifest: member.memberManifest,
    staleAngleOverlaySuppressedByDecision:
      member.staleAngleOverlaySuppressedByDecision,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    acceptanceEffects: FALSE_EFFECTS,
  }));
  const fragment = Object.freeze({schemaVersion: 1,
    artifactType:
      'g678-alg-l11-behavior10-tranche-b-unregistered-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding, deploymentScope: 'local-only',
    reviewedAudit: context.inputs.reviewedAudit,
    sourceDivergenceDecision: context.inputs.sourceDivergenceDecision,
    maintainedState: context.inputs.maintainedState,
    candidateCore: context.inputs.candidateCore,
    tutorialWrapper: context.inputs.tutorialWrapper,
    guidedWrapper: context.inputs.guidedWrapper,
    maintainedCandidates: context.inputs.maintainedCandidates,
    exactPlacementCount: 10, generatedPlacementCount: 10,
    currentJavaScriptImplementedCount: 10,
    domRendererImplementedCount: 10,
    staleAngleOverlaySuppressedPlacementCount: 3,
    entries: Object.freeze(entries), registryEntriesWritten: 0,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredCount: 0,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewCount: 0,
    scaleOutAuthorized: false, acceptancePassed: false,
    releaseAuthorized: false, published: false,
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'These exact10 private-current-js DOM modules are unregistered maintained engineering candidates.',
      'Only p040-p042 suppress the separately audited stale Mc_PopUp overlay; correct Mc_Popup help remains required.',
      'No source audio is requested and no original-runtime, fidelity, human, Owner, product, release, or publication gate is closed.',
    ])});
  const fragmentBytes = stableBytes(fragment);
  tracked.set(FRAGMENT, fragmentBytes);
  return Object.freeze({run, runBytes,
    runBinding, fragment, fragmentBytes, tracked: Object.freeze(tracked)});
}

async function publishTracked(tracked) {
  const created = [];
  try {
    for (const [relative, bytes] of tracked) {
      const target = projectPath(relative);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, bytes, {flag: 'wx',
        mode: relative === FRAGMENT ? 0o444 : 0o644});
      if (relative === FRAGMENT) await chmod(target, 0o444);
      const current = await stableFile(target, {absolute: true,
        readOnly: relative === FRAGMENT});
      invariant(current.buffer.equals(bytes), `${relative} publication drifted`);
      created.push(Object.freeze({target, bytes: current.bytes,
        sha256: current.sha256, identity: current.identity}));
    }
  } catch (error) {
    for (const item of created.reverse()) {
      const current = await stableFile(item.target, {absolute: true})
        .catch(() => null);
      if (current && current.bytes === item.bytes &&
        current.sha256 === item.sha256 &&
        exact(current.identity, item.identity)) await unlink(item.target);
    }
    throw error;
  }
}

async function compareTracked(tracked) {
  for (const [relative, expected] of tracked) {
    const current = await stableFile(relative,
      {readOnly: relative === FRAGMENT});
    invariant(current.buffer.equals(expected),
      `${relative} drifted from behavior10 generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  invariant(exact(current, expected), 'behavior10 frozen run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runBehavior10TrancheBCurrentJs({check = false} = {}) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = `${canonical}.${check ? 'check' : 'staging'}-${process.pid}`;
  invariant(!await exists(stage), 'behavior10 staging path already exists');
  if (!check) {
    invariant(!await exists(canonical), `${OUTPUT_ROOT} already exists`);
    for (const id of IDS) {
      const paths = outputPaths(id);
      invariant(!await exists(projectPath(paths.timeline)) &&
        !await exists(projectPath(paths.module)),
      `${id}: generated output already exists`);
    }
    invariant(!await exists(projectPath(FRAGMENT)),
      `${FRAGMENT} already exists`);
  }
  await mkdir(stage, {recursive: false});
  try {
    const result = await build(context, stage);
    if (check) {
      await compareTracked(result.tracked);
      await compareRun(stage, canonical);
      await thawAndRemove(stage);
    } else {
      await freezeTree(stage);
      await rename(stage, canonical);
      try {
        await publishTracked(result.tracked);
      } catch (error) {
        await rename(canonical,
          `${canonical}.failed-tracked-publication-${Date.now()}`)
          .catch(() => {});
        throw error;
      }
    }
    return Object.freeze({check, runId: RUN_ID,
      compilerRun: result.runBinding,
      fragment: Object.freeze({path: FRAGMENT,
        bytes: result.fragmentBytes.length,
        sha256: sha256(result.fragmentBytes)}),
      generatedPlacementCount: 10, generatedTimelineCount: 10,
      generatedModuleCount: 10, registryEntriesWritten: 0,
      candidateModuleMaturity: 'private-current-js',
      currentJavaScriptImplementedCount: 10,
      domRendererImplementedCount: 10,
      staleAngleOverlaySuppressedPlacementCount: 3,
      registrationCandidatePlacementCount: 0,
      currentJavaScriptRegisteredCount: 0,
      productCalibrationPassed: false,
      browserProductCalibrationPassed: false,
      wholeLessonEngineeringPreviewReady: false,
      scaleOutAuthorized: false, acceptancePassed: false,
      releaseAuthorized: false, published: false,
      acceptanceEffects: FALSE_EFFECTS});
  } catch (error) {
    if (await exists(stage)) {
      await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    `usage: ${path.basename(SCRIPT_PATH)} [--check]`);
  runBehavior10TrancheBCurrentJs({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
