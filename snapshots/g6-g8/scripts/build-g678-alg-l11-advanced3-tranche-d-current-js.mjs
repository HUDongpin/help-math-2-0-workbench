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
const PREFIX = 'g678-alg-l11-advanced3-tranche-d';
const RUN_ID = `${PREFIX}-current-js-v1`;
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const AUDIT = `catalog/${PREFIX}-audit-v1.json`;
const STATE = `packages/demos/src/${PREFIX}-state.ts`;
const CANDIDATES = `packages/demos/src/${PREFIX}-candidates.tsx`;
const EXPECTED_INPUT_HASHES = Object.freeze({
  audit:
    '03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42',
  state:
    '7c604771e89366c65b37be255880d95360ac8cc693eec80272eab14bc75d56b6',
  candidates:
    'bd602c53b7d3a730a6b6f8b825f1eb1fe3ddb927eaa9035c79e12853ff13bd70',
});
const IDS = Object.freeze([
  'shared-alg001-l11-p033',
  'shared-alg001-l11-p034',
  'shared-alg001-l11-p044',
]);
const EXPECTED_RUNTIME = Object.freeze({
  'shared-alg001-l11-p033': Object.freeze({objectId: 116,
    frameDomain: 'sprite-116', frameCount: 606, depth: 3}),
  'shared-alg001-l11-p034': Object.freeze({objectId: 225,
    frameDomain: 'sprite-225', frameCount: 5, depth: 3}),
  'shared-alg001-l11-p044': Object.freeze({objectId: 1083,
    frameDomain: 'sprite-1083', frameCount: 69, depth: 3}),
});
const EXPECTED_COMMANDS = Object.freeze({
  swfmill: Object.freeze([
    'swfmill', 'swf2xml', '<canonical-read-only-source>', 'source.xml',
  ]),
  ffdec: Object.freeze([
    'ffdec', '-onerror', 'abort', '-format', 'text:plain', '-export',
    'script,text', 'ffdec-export', '<canonical-read-only-source>',
  ]),
});
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

function behaviorFor(audit, animationId) {
  if (animationId === IDS[0]) {
    return audit.behaviorContracts.p033CrossPageController;
  }
  if (animationId === IDS[1]) {
    return audit.behaviorContracts.p034MatchingGame;
  }
  return audit.behaviorContracts.p044RandomFinalAssessment;
}

export function validateAdvanced3GeneratorInputs({audit, stateSource,
  candidateSource, hashes}) {
  invariant(audit?.artifactType ===
    'g678-alg-l11-advanced3-tranche-d-source-behavior-audit' &&
    audit.prefix === PREFIX && audit.exactPlacementCount === 3,
  'tranche-d audit identity drifted');
  exact(audit.exactPlacementIds, IDS,
    'tranche-d audit exact placement order drifted');
  invariant(audit.auditFindings?.p0Count === 0 &&
    audit.auditFindings?.p1Count === 0 &&
    audit.maintainedCandidateImplementationAuthorizedByThisAudit === true,
  'tranche-d audit does not authorize bounded candidate generation');
  invariant(audit.registrationCandidatePlacementCount === 0 &&
    audit.currentJavaScriptRegisteredPlacementCount === 0 &&
    audit.productCalibrationPassed === false &&
    audit.wholeLessonEngineeringPreviewReady === false &&
    audit.acceptancePassed === false && audit.releaseAuthorized === false &&
    audit.published === false && audit.scaleOutAuthorized === false &&
    Object.values(audit.acceptanceEffects).every((value) => value === false),
  'tranche-d audit downstream gate drifted');
  exact(hashes, EXPECTED_INPUT_HASHES,
    'tranche-d generator input hash binding drifted');
  invariant(typeof stateSource === 'string' &&
    stateSource.includes(`"${EXPECTED_INPUT_HASHES.audit}"`) &&
    stateSource.includes('currentJavaScriptImplementedPlacementCount: 3') &&
    stateSource.includes('candidateModuleMaturity: "private-current-js"') &&
    stateSource.includes('registrationCandidatePlacementCount: 0') &&
    stateSource.includes('currentJavaScriptRegisteredPlacementCount: 0') &&
    stateSource.includes('productCalibrationPassed: false') &&
    stateSource.includes('wholeLessonEngineeringPreviewReady: false'),
  'tranche-d maintained state boundary drifted');
  invariant(typeof candidateSource === 'string' &&
    candidateSource.includes('maturity: "private-current-js"') &&
    candidateSource.includes('data-private-current-js="true"') &&
    candidateSource.includes('data-current-javascript-registered="false"') &&
    candidateSource.includes('data-product-calibration-passed="false"') &&
    !/(?:registry\.generated|local-only-animation-registry|fetch\s*\(|XMLHttpRequest)/u
      .test(candidateSource),
  'tranche-d candidate boundary drifted');

  exact(audit.pages.map((page) => page.animationId), IDS,
    'tranche-d audit page order drifted');
  for (const page of audit.pages) {
    const runtime = EXPECTED_RUNTIME[page.animationId];
    invariant(runtime && page.runtime.stage.width === 800 &&
      page.runtime.stage.height === 600 && page.runtime.fps === 12 &&
      page.runtime.rootFrameCount === 10 &&
      page.runtime.actionScriptVersion === 'AS1/2',
    `${page.animationId}: source runtime header drifted`);
    exact(page.runtime.namedAnimationPlacements, [Object.freeze({
      objectId: runtime.objectId, frameCount: runtime.frameCount,
      depth: runtime.depth, directRootPlacement: true,
    })], `${page.animationId}: main timeline placement drifted`);
    const domain = page.runtime.rootReachableDomains.find((item) =>
      item.domainId === runtime.frameDomain);
    invariant(domain?.frameCount === runtime.frameCount,
      `${page.animationId}: main frame domain drifted`);
    invariant(page.registrationCandidate === false &&
      page.productCalibrationPassed === false &&
      page.wholeLessonEngineeringPreviewReady === false &&
      Object.values(page.acceptanceEffects).every((value) => value === false),
    `${page.animationId}: page gate drifted`);
  }
  return true;
}

async function loadContext() {
  const [builder, audit, state, candidates] = await Promise.all([
    stableFile(SCRIPT_PATH, {absolute: true}),
    stableFile(AUDIT, {json: true, readOnly: true}),
    stableFile(STATE),
    stableFile(CANDIDATES),
  ]);
  const hashes = Object.freeze({audit: audit.sha256, state: state.sha256,
    candidates: candidates.sha256});
  validateAdvanced3GeneratorInputs({audit: audit.value,
    stateSource: state.buffer.toString('utf8'),
    candidateSource: candidates.buffer.toString('utf8'), hashes});
  const commandReceipts = new Map();
  for (const page of audit.value.pages) {
    const receipt = await stableFile(page.ffdec.commandReceipt.path,
      {json: true, readOnly: true});
    invariant(receipt.bytes === page.ffdec.commandReceipt.bytes &&
      receipt.sha256 === page.ffdec.commandReceipt.sha256 &&
      receipt.value.animationId === page.animationId &&
      receipt.value.source.path === page.source.path &&
      receipt.value.source.bytes === page.source.bytes &&
      receipt.value.source.sha256 === page.source.sha256,
    `${page.animationId}: command receipt/source binding drifted`);
    exact(receipt.value.commands, EXPECTED_COMMANDS,
      `${page.animationId}: exact audit commands drifted`);
    invariant(receipt.value.toolchain.ffdec.version === '26.2.1' &&
      receipt.value.toolchain.swfmill.version === '0.3.6' &&
      Object.values(receipt.value.acceptanceEffects)
        .every((value) => value === false),
    `${page.animationId}: command receipt tool/gate drifted`);
    commandReceipts.set(page.animationId, receipt);
  }
  return Object.freeze({builder, audit, state, candidates,
    commandReceipts: Object.freeze(commandReceipts),
    inputs: Object.freeze({builder: descriptor(builder,
      `scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs`),
      audit: descriptor(audit), maintainedState: descriptor(state),
      maintainedCandidates: descriptor(candidates)})});
}

export function buildAdvanced3TimelineSource(page, behavior, receipt) {
  const name = constantName(page.animationId);
  const expectedRuntime = EXPECTED_RUNTIME[page.animationId];
  invariant(expectedRuntime, `${page.animationId}: unsupported timeline member`);
  const value = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-advanced3-tranche-d-unregistered-timeline-v1',
    runId: RUN_ID, animationId: page.animationId,
    deploymentScope: 'local-only', reviewedLane: 'behavior-heavy',
    source: page.source, sourceRuntime: page.runtime,
    mainTimeline: Object.freeze({frameDomain: expectedRuntime.frameDomain,
      objectId: expectedRuntime.objectId, frameCount: expectedRuntime.frameCount,
      placementDepth: expectedRuntime.depth, rootBeginFrame: 6,
      publicFrameIndexing: 'one-indexed', playbackMode: 'once'}),
    auditCommands: Object.freeze({receipt: page.ffdec.commandReceipt,
      commands: receipt.commands, toolchain: receipt.toolchain,
      commandsExecutedByThisGenerator: false}),
    sourceBehavior: behavior, candidateModuleMaturity: 'private-current-js',
    registrationCandidate: false, currentJavaScriptRegistered: false,
    productCalibrationPassed: false, browserProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false, acceptanceEffects: FALSE_EFFECTS,
  });
  return `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `\nexport const ${name}_TIMELINE = Object.freeze(${JSON.stringify(value, null, 2)} as const);\n`;
}

export function buildAdvanced3ModuleSource(page) {
  const name = constantName(page.animationId);
  const suffix = page.animationId.slice(-4).toUpperCase();
  return `"use client";\n\n` +
    `// Generated by scripts/build-${RUN_ID.replace(/-v1$/u, '')}.mjs; do not edit.\n` +
    `import {G678_ALG_L11_ADVANCED3_TRANCHE_D_${suffix}_CANDIDATE_MODULE as BASE_MODULE} from "../${PREFIX}-candidates";\n` +
    `import {${name}_TIMELINE} from "../timelines/${PREFIX}-${page.animationId.slice(-4)}";\n\n` +
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
  for (const page of context.audit.value.pages) {
    const paths = outputPaths(page.animationId);
    const behavior = behaviorFor(context.audit.value, page.animationId);
    const receipt = context.commandReceipts.get(page.animationId).value;
    const timelineBytes = Buffer.from(buildAdvanced3TimelineSource(page,
      behavior, receipt));
    const moduleBytes = Buffer.from(buildAdvanced3ModuleSource(page));
    tracked.set(paths.timeline, timelineBytes);
    tracked.set(paths.module, moduleBytes);
    const member = Object.freeze({animationId: page.animationId,
      source: page.source, runtime: page.runtime,
      mainTimeline: EXPECTED_RUNTIME[page.animationId],
      behaviorAuditProjection: behavior,
      commandReceipt: page.ffdec.commandReceipt,
      commands: receipt.commands,
      commandsExecutedByThisGenerator: false,
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
      artifactType: 'g678-alg-l11-advanced3-tranche-d-generated-member-v1',
      runId: RUN_ID, ...member});
    await writeFile(path.join(memberRoot, 'member-manifest.json'), memberBytes,
      {flag: 'wx'});
    generatedMembers.push(Object.freeze({...member,
      memberManifest: Object.freeze({path:
        `${OUTPUT_ROOT}/members/${page.animationId}/member-manifest.json`,
      bytes: memberBytes.length, sha256: sha256(memberBytes)})}));
  }
  invariant(generatedMembers.length === 3 && tracked.size === 6,
    'tranche-d exact generated member/output denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'), inventoryBytes,
    {flag: 'wx'});
  const run = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-advanced3-tranche-d-current-js-run-v1',
    runId: RUN_ID, status: 'generated-unregistered-candidate',
    deploymentScope: 'local-only', inputs: context.inputs,
    exactPlacementCount: 3, generatedTimelineCount: 3,
    generatedModuleCount: 3, registryEntriesWritten: 0,
    currentJavaScriptImplementedPlacementCount: 3,
    candidateModuleMaturity: 'private-current-js',
    commandsExecutedByThisGenerator: false,
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
    maturity: 'private-current-js', complexityLane: 'behavior-heavy',
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
      'g678-alg-l11-advanced3-tranche-d-unregistered-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding, deploymentScope: 'local-only',
    reviewedAudit: context.inputs.audit,
    maintainedState: context.inputs.maintainedState,
    maintainedCandidates: context.inputs.maintainedCandidates,
    exactPlacementCount: 3, generatedPlacementCount: 3,
    currentJavaScriptImplementedPlacementCount: 3,
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
      'No source extraction command is executed by this projection-only generator; exact commands remain audit evidence.',
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
      `${relative} drifted from tranche-d generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  exact(current, expected, 'tranche-d frozen run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runAdvanced3TrancheDCurrentJs({check = false} = {}) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = `${canonical}.${check ? 'check' : 'staging'}-${process.pid}`;
  invariant(!await exists(stage), 'tranche-d staging path already exists');
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
      generatedPlacementCount: 3, generatedTimelineCount: 3,
      generatedModuleCount: 3, registryEntriesWritten: 0,
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
  runAdvanced3TrancheDCurrentJs({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
