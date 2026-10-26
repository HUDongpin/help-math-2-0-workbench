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
const PREFIX = 'g678-alg-l11-interactive10-tranche-c';
const RUN_ID = `${PREFIX}-current-js-v1`;
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const AUDIT = `catalog/${PREFIX}-audit-v1.json`;
const CORE = `packages/demos/src/${PREFIX}-core.ts`;
const STATE = `packages/demos/src/${PREFIX}-state.ts`;
const WRAPPERS = `packages/demos/src/${PREFIX}-wrappers.tsx`;
const CANDIDATES = `packages/demos/src/${PREFIX}-candidates.tsx`;
const EXPECTED_INPUT_HASHES = Object.freeze({
  audit:
    '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578',
  core:
    '92ab35656d3e295466c1641145cc9ec6496dbf98dc44cf72707f3553e9369284',
  state:
    '4c9542bd54f3ae5ee2a41a297107fb6a6e3ce597bda5c0b3cad2446502794554',
  wrappers:
    '662785ff4e16e15b4b6123a287b352c4899aa4a129e786f9aa3f3942106221d4',
  candidates:
    '492b8d9eb4ae44991411a4f7e29e69de522d1ffa3223eb8e04b233f191900c63',
});
const IDS = Object.freeze([
  'shared-alg001-l11-p006', 'shared-alg001-l11-p008',
  'shared-alg001-l11-p009', 'shared-alg001-l11-p010',
  'shared-alg001-l11-p011', 'shared-alg001-l11-p014',
  'shared-alg001-l11-p019', 'shared-alg001-l11-p020',
  'shared-alg001-l11-p021', 'shared-alg001-l11-p025',
]);
const EXPECTED_RUNTIME = Object.freeze({
  'shared-alg001-l11-p006': Object.freeze({objectId: 50,
    frameDomain: 'sprite-50', frameCount: 53}),
  'shared-alg001-l11-p008': Object.freeze({objectId: 176,
    frameDomain: 'sprite-176', frameCount: 178}),
  'shared-alg001-l11-p009': Object.freeze({objectId: 65,
    frameDomain: 'sprite-65', frameCount: 431}),
  'shared-alg001-l11-p010': Object.freeze({objectId: 75,
    frameDomain: 'sprite-75', frameCount: 394}),
  'shared-alg001-l11-p011': Object.freeze({objectId: 185,
    frameDomain: 'sprite-185', frameCount: 320}),
  'shared-alg001-l11-p014': Object.freeze({objectId: 177,
    frameDomain: 'sprite-177', frameCount: 220}),
  'shared-alg001-l11-p019': Object.freeze({objectId: 205,
    frameDomain: 'sprite-205', frameCount: 361}),
  'shared-alg001-l11-p020': Object.freeze({objectId: 197,
    frameDomain: 'sprite-197', frameCount: 225}),
  'shared-alg001-l11-p021': Object.freeze({objectId: 208,
    frameDomain: 'sprite-208', frameCount: 318}),
  'shared-alg001-l11-p025': Object.freeze({objectId: 204,
    frameDomain: 'sprite-204', frameCount: 177}),
});
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  registrationCandidate: false,
  productCalibrationPassed: false,
  browserCalibrationPassed: false,
  engineeringPreviewReady: false,
  behaviorAccepted: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join('/');
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
  `${target} must be one canonical ordinary${readOnly ? ' read-only' : ''} file`);
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

function exact(actual, expected, message) {
  invariant(JSON.stringify(actual) === JSON.stringify(expected), message);
}

function constantName(animationId) {
  return `${PREFIX}-${animationId.slice(-4)}`
    .replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
}

function outputPaths(animationId) {
  const suffix = animationId.slice(-4);
  return Object.freeze({
    timeline: `packages/demos/src/timelines/${PREFIX}-${suffix}.ts`,
    module: `packages/demos/src/modules/${PREFIX}-${suffix}.tsx`,
  });
}

export function validateInteractive10GeneratorInputs({audit, coreSource,
  stateSource, wrapperSource, candidateSource, hashes}) {
  invariant(audit?.artifactType ===
    'g678-alg-l11-interactive10-tranche-c-source-audit-v1' &&
    audit.auditId === `${PREFIX}-audit-v1` &&
    audit.stableLessonKey === 'shared-alg001-l11' &&
    audit.auditedPlacementCount === 10,
  'tranche-c audit identity drifted');
  exact(audit.exactPlacementIds, IDS,
    'tranche-c audit exact placement order drifted');
  invariant(audit.sourceAuditP0Count === 0 &&
    audit.sourceAuditP1Count === 0 && audit.sourceContractAuditPassed === true &&
    audit.independentReviewPassed === false &&
    audit.candidateImplementationAuthorized === false,
  'tranche-c audit/review boundary drifted');
  invariant(audit.registrationCandidatePlacementCount === 0 &&
    audit.currentJavaScriptRegisteredPlacementCount === 0 &&
    audit.productCalibrationPassed === false &&
    audit.browserCalibrationPassed === false &&
    audit.wholeLessonEngineeringPreviewReady === false &&
    Object.values(audit.acceptanceEffects).every((value) => value === false),
  'tranche-c audit downstream gate drifted');
  exact(hashes, EXPECTED_INPUT_HASHES,
    'tranche-c generator input hash binding drifted');
  invariant(typeof coreSource === 'string' &&
    coreSource.includes(`"${EXPECTED_INPUT_HASHES.audit}"`) &&
    coreSource.includes('currentJavaScriptImplementedPlacementCount: 10') &&
    coreSource.includes('candidateModuleMaturity: "private-current-js"') &&
    coreSource.includes('G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP') &&
    coreSource.includes('registrationCandidatePlacementCount: 0') &&
    coreSource.includes('currentJavaScriptRegisteredPlacementCount: 0') &&
    coreSource.includes('productCalibrationPassed: false') &&
    coreSource.includes('wholeLessonEngineeringPreviewReady: false'),
  'tranche-c maintained core boundary drifted');
  invariant(typeof stateSource === 'string' &&
    stateSource.includes('reduceAlgL11Interactive10Choice') &&
    stateSource.includes('reduceAlgL11Interactive10TwoTry') &&
    stateSource.includes('buildAlgL11Interactive10PracticeFeedbackResetRequest') &&
    stateSource.includes('practice-feedback-reset-blocked') &&
    stateSource.includes('audioPlayed: false') &&
    !/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|new Audio)/u
      .test(stateSource),
  'tranche-c maintained state boundary drifted');
  invariant(typeof wrapperSource === 'string' &&
    wrapperSource.includes('data-private-current-js="true"') &&
    wrapperSource.includes('data-current-javascript-registered="false"') &&
    wrapperSource.includes('data-source-audio-played="false"') &&
    wrapperSource.includes('data-source-need-more-help-open="true"') &&
    wrapperSource.includes(
      'buildAlgL11Interactive10PracticeFeedbackResetRequest') &&
    !/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|new Audio|Mc_PopUp)/u
      .test(wrapperSource),
  'tranche-c maintained wrapper boundary drifted');
  invariant(typeof candidateSource === 'string' &&
    candidateSource.includes('maturity: "private-current-js"') &&
    coreSource.includes('registrationCandidatePlacementCount: 0') &&
    !/(?:registry\.generated|local-only-animation-registry|fetch\s*\(|XMLHttpRequest)/u
      .test(candidateSource),
  'tranche-c candidate boundary drifted');

  exact(audit.members.map((page) => page.animationId), IDS,
    'tranche-c audit page order drifted');
  for (const page of audit.members) {
    const runtime = EXPECTED_RUNTIME[page.animationId];
    invariant(runtime && page.exactMainTimeline.objectId === runtime.objectId &&
      page.exactMainTimeline.frameCount === runtime.frameCount &&
      page.exactMainTimeline.rootFrameCount === 10 &&
      page.exactMainTimeline.fps === 12,
    `${page.animationId}: main timeline drifted`);
    invariant(page.registrationCandidate === false &&
      page.productCalibrationPassed === false &&
      page.browserCalibrationPassed === false &&
      page.physicalAudioCandidate.accepted === false &&
      Object.values(page.acceptanceEffects).every((value) => value === false),
    `${page.animationId}: page gate drifted`);
  }
  return true;
}

async function loadContext() {
  const [builder, audit, core, state, wrappers, candidates] = await Promise.all([
    stableFile(SCRIPT_PATH, {absolute: true}),
    stableFile(AUDIT, {json: true, readOnly: true}),
    stableFile(CORE),
    stableFile(STATE),
    stableFile(WRAPPERS),
    stableFile(CANDIDATES),
  ]);
  const hashes = Object.freeze({audit: audit.sha256, core: core.sha256,
    state: state.sha256, wrappers: wrappers.sha256,
    candidates: candidates.sha256});
  validateInteractive10GeneratorInputs({audit: audit.value,
    coreSource: core.buffer.toString('utf8'),
    stateSource: state.buffer.toString('utf8'),
    wrapperSource: wrappers.buffer.toString('utf8'),
    candidateSource: candidates.buffer.toString('utf8'), hashes});
  return Object.freeze({builder, audit, core, state, wrappers, candidates,
    inputs: Object.freeze({builder: descriptor(builder,
      `scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs`),
      audit: descriptor(audit), maintainedCore: descriptor(core),
      maintainedState: descriptor(state), maintainedWrappers: descriptor(wrappers),
      maintainedCandidates: descriptor(candidates)})});
}

export function buildInteractive10TimelineSource(page) {
  const name = constantName(page.animationId);
  const expectedRuntime = EXPECTED_RUNTIME[page.animationId];
  invariant(expectedRuntime, `${page.animationId}: unsupported timeline member`);
  const value = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-interactive10-tranche-c-unregistered-timeline-v1',
    runId: RUN_ID, animationId: page.animationId,
    deploymentScope: 'local-only', reviewedLane: 'interactive-understood',
    source: page.source, sourceRuntime: page.exactMainTimeline,
    mainTimeline: Object.freeze({frameDomain: expectedRuntime.frameDomain,
      objectId: expectedRuntime.objectId, frameCount: expectedRuntime.frameCount,
      rootBeginFrame: 6,
      publicFrameIndexing: 'one-indexed', playbackMode: 'once'}),
    exactScriptInventory: page.exactScriptInventory,
    exactTextInventory: page.exactTextInventory,
    hostCalls: page.hostCalls,
    sourceContract: page.sourceContract,
    physicalAudioCandidate: page.physicalAudioCandidate,
    productBlockers: page.productBlockers,
    sourceAuditP0Count: page.sourceAuditP0Count,
    sourceAuditP1Count: page.sourceAuditP1Count,
    candidateModuleMaturity: 'private-current-js',
    registrationCandidate: false, currentJavaScriptRegistered: false,
    productCalibrationPassed: false, browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false, acceptanceEffects: FALSE_EFFECTS,
  });
  return `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `\nexport const ${name}_TIMELINE = Object.freeze(${JSON.stringify(value, null, 2)} as const);\n`;
}

export function buildInteractive10ModuleSource(page) {
  const name = constantName(page.animationId);
  const suffix = page.animationId.slice(-4).toUpperCase();
  return `"use client";\n\n` +
    `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `import {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_${suffix}_CANDIDATE as CANDIDATE} from "../${PREFIX}-candidates";\n` +
    `import {${name}_TIMELINE} from "../timelines/${PREFIX}-${page.animationId.slice(-4)}";\n\n` +
    `const BASE_MODULE = CANDIDATE.module;\n\n` +
    `if (BASE_MODULE.key !== ${name}_TIMELINE.animationId || BASE_MODULE.maturity !== "private-current-js" || ${name}_TIMELINE.currentJavaScriptRegistered !== false) {\n` +
    `  throw new Error("${page.animationId}: generated unregistered candidate binding drifted");\n` +
    `}\n\n` +
    `export const ${name}_SOURCE_TIMELINE = ${name}_TIMELINE;\n` +
    `export const ${name}_REGISTRATION_CANDIDATE = false as const;\n` +
    `export const ${name}_CURRENT_JAVASCRIPT_REGISTERED = false as const;\n` +
    `export default BASE_MODULE;\n`;
}

async function directoryInventory(root) {
  const files = [];
  const directories = [];
  async function walk(current, prefix = '') {
    const entries = (await readdir(current, {withFileTypes: true}))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = portable(path.join(prefix, entry.name));
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
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
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
  const rootMetadata = await lstat(root, {bigint: true});
  invariant(rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink() &&
    Number(rootMetadata.mode & 0o777n) === 0o555,
  `${root} must be a frozen 0555 run root`);
  async function walk(current) {
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const target = path.join(current, entry.name);
      invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
      const metadata = await lstat(target, {bigint: true});
      if (entry.isDirectory()) {
        invariant(Number(metadata.mode & 0o777n) === 0o555,
          `${target} must be a frozen directory`);
        await walk(target);
      } else {
        invariant(entry.isFile() && metadata.nlink === 1n &&
          Number(metadata.mode & 0o777n) === 0o444,
        `${target} must be a frozen single-link file`);
      }
    }
  }
  await walk(root);
}

async function build(context, stageRoot) {
  const tracked = new Map();
  const generatedMembers = [];
  for (const page of context.audit.value.members) {
    const paths = outputPaths(page.animationId);
    const timelineBytes = Buffer.from(buildInteractive10TimelineSource(page));
    const moduleBytes = Buffer.from(buildInteractive10ModuleSource(page));
    tracked.set(paths.timeline, timelineBytes);
    tracked.set(paths.module, moduleBytes);
    const member = Object.freeze({animationId: page.animationId,
      source: page.source, sourceRuntime: page.exactMainTimeline,
      mainTimeline: EXPECTED_RUNTIME[page.animationId],
      exactScriptInventory: page.exactScriptInventory,
      exactTextInventory: page.exactTextInventory,
      hostCalls: page.hostCalls, sourceContract: page.sourceContract,
      physicalAudioCandidate: page.physicalAudioCandidate,
      productBlockers: page.productBlockers,
      timeline: Object.freeze({path: paths.timeline,
        bytes: timelineBytes.length, sha256: sha256(timelineBytes)}),
      moduleFile: Object.freeze({path: paths.module,
        bytes: moduleBytes.length, sha256: sha256(moduleBytes)}),
      moduleMaturity: 'private-current-js', registrationCandidate: false,
      currentJavaScriptRegistered: false, productCalibrationPassed: false,
      browserProductCalibrationPassed: false,
      wholeLessonEngineeringPreviewReady: false,
      acceptanceEffects: FALSE_EFFECTS});
    const memberRoot = path.join(stageRoot, 'members', page.animationId);
    await mkdir(memberRoot, {recursive: true});
    const memberBytes = stableBytes({schemaVersion: 1,
      artifactType: 'g678-alg-l11-interactive10-tranche-c-generated-member-v1',
      runId: RUN_ID, ...member});
    await writeFile(path.join(memberRoot, 'member-manifest.json'), memberBytes,
      {flag: 'wx'});
    generatedMembers.push(Object.freeze({...member,
      memberManifest: Object.freeze({path:
        `${OUTPUT_ROOT}/members/${page.animationId}/member-manifest.json`,
      bytes: memberBytes.length, sha256: sha256(memberBytes)})}));
  }
  invariant(generatedMembers.length === 10 && tracked.size === 20,
    'tranche-c exact generated member/output denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'), inventoryBytes,
    {flag: 'wx'});
  const run = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-interactive10-tranche-c-current-js-run-v1',
    runId: RUN_ID, status: 'generated-unregistered-candidate',
    deploymentScope: 'local-only', inputs: context.inputs,
    exactPlacementCount: 10, generatedTimelineCount: 10,
    generatedModuleCount: 10, registryEntriesWritten: 0,
    currentJavaScriptImplementedPlacementCount: 10,
    candidateModuleMaturity: 'private-current-js',
    sourceExtractionCommandsExecutedByThisGenerator: false,
    audioPlayedByThisGenerator: false,
    outputInventory: Object.freeze({path: `${OUTPUT_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)}),
    members: Object.freeze(generatedMembers),
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    acceptancePassed: false, releaseAuthorized: false, published: false,
    scaleOutAuthorized: false, acceptanceEffects: FALSE_EFFECTS});
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${OUTPUT_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const entries = generatedMembers.map((member) => Object.freeze({
    key: member.animationId,
    module: `./modules/${PREFIX}-${member.animationId.slice(-4)}`,
    maturity: 'private-current-js', complexityLane: 'interactive-understood',
    deploymentScope: 'local-only', registrationCandidate: false,
    currentJavaScriptRegistered: false,
    timeline: member.timeline, moduleFile: member.moduleFile,
    memberManifest: member.memberManifest,
    source: member.source, mainTimeline: member.mainTimeline,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    acceptanceEffects: FALSE_EFFECTS,
  }));
  const fragment = Object.freeze({schemaVersion: 1,
    artifactType:
      'g678-alg-l11-interactive10-tranche-c-unregistered-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding, deploymentScope: 'local-only',
    reviewedAudit: context.inputs.audit,
    maintainedCore: context.inputs.maintainedCore,
    maintainedState: context.inputs.maintainedState,
    maintainedWrappers: context.inputs.maintainedWrappers,
    maintainedCandidates: context.inputs.maintainedCandidates,
    exactPlacementCount: 10, generatedPlacementCount: 10,
    currentJavaScriptImplementedPlacementCount: 10,
    candidateModuleMaturity: 'private-current-js',
    entries: Object.freeze(entries), registryEntriesWritten: 0,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredCount: 0,
    productCalibrationPassed: false,
    browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewCount: 0,
    acceptancePassed: false, releaseAuthorized: false, published: false,
    scaleOutAuthorized: false, acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This fragment is an unregistered engineering candidate and is not a private animation registry input.',
      'No source extraction command or audio playback is executed by this projection-only generator; exact source and physical-audio identities remain audit evidence.',
      'The p006 adapter uses a deterministic silent S1-S4 sequence; random-label audio synchronization and listening acceptance remain unresolved.',
      'The p009 and p010 maintained local help transition does not establish the original runtime parent binding.',
      'Product calibration, browser preview, acceptance, release, and publication remain separate false gates.',
    ])});
  const fragmentBytes = stableBytes(fragment);
  tracked.set(FRAGMENT, fragmentBytes);
  return Object.freeze({run, runBytes, runBinding, fragment, fragmentBytes,
    tracked: Object.freeze(tracked)});
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
      created.push(Object.freeze({target, relative, bytes: current.bytes,
        sha256: current.sha256, identity: current.identity}));
    }
  } catch (error) {
    for (const item of created.reverse()) {
      const current = await stableFile(item.target, {absolute: true})
        .catch(() => null);
      if (current && current.bytes === item.bytes &&
        current.sha256 === item.sha256 &&
        JSON.stringify(current.identity) === JSON.stringify(item.identity)) {
        await unlink(item.target);
      }
    }
    throw error;
  }
}

async function compareTracked(tracked) {
  for (const [relative, expected] of tracked) {
    const current = await stableFile(relative,
      {readOnly: relative === FRAGMENT});
    invariant(current.buffer.equals(expected),
      `${relative} drifted from tranche-c generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  exact(current, expected, 'tranche-c frozen run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runInteractive10TrancheCCurrentJs({check = false} = {}) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = `${canonical}.${check ? 'check' : 'staging'}-${process.pid}`;
  invariant(!await exists(stage), 'tranche-c staging path already exists');
  if (!check) {
    invariant(!await exists(canonical), `${OUTPUT_ROOT} already exists`);
    for (const id of IDS) {
      const paths = outputPaths(id);
      invariant(!await exists(projectPath(paths.timeline)) &&
        !await exists(projectPath(paths.module)),
      `${id}: generated output already exists`);
    }
    invariant(!await exists(projectPath(FRAGMENT)), `${FRAGMENT} already exists`);
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
      currentJavaScriptRegisteredCount: 0,
      productCalibrationPassed: false,
      browserProductCalibrationPassed: false,
      wholeLessonEngineeringPreviewReady: false,
      acceptancePassed: false, releaseAuthorized: false, published: false,
      scaleOutAuthorized: false, acceptanceEffects: FALSE_EFFECTS});
  } catch (error) {
    if (await exists(stage)) {
      await rename(stage, `${stage}.failed-${Date.now()}`).catch(() => {});
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 &&
    (args.length === 0 || args[0] === '--check'),
  `usage: ${path.basename(SCRIPT_PATH)} [--check]`);
  runInteractive10TrancheCCurrentJs({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
