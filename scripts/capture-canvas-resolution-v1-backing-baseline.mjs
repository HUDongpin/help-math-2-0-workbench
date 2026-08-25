#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  extractCanvasRuntimeMetadata,
  resolveProductionPlacements,
} from './run-canvas-resolution-capture-set.mjs';
import {
  collectChromiumToolchainIdentity,
  LOADED_HOST,
  planReceiptBytes,
} from './generate-adaptive-canvas-batch.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const PLAN_PATH =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/plan.v1.json';
export const AGGREGATE_PATH =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3/' +
  'v1-backing-baseline.v1.json';
export const OUTPUT_ROOT =
  'reports/canvas-resolution/baseline/v1-backing-compact-v3';

const V1_PROFILE_PATH = 'apps/web/config/current-js-production-assets.v1.json';
const V10_PLAN_PATH = 'work/adaptive-canvas-production-five.plan.v10.json';
const FREEZE_PATH =
  'work/adaptive-canvas-real-browser-validation-v10.freeze.v1.json';
const CAPTURE_TOOL_PATH =
  'scripts/capture-canvas-resolution-v1-backing-baseline.mjs';
const CAPTURE_TOOL_TEST_PATH =
  'scripts/capture-canvas-resolution-v1-backing-baseline.test.mjs';
const RELEASE_CATALOG_PATHS = Object.freeze([
  'catalog/lesson-releases.json',
  'catalog/page-only-current-js-product-releases.json',
]);
const APPROVED_RELEASE_IDS = Object.freeze([
  'lesson-g03-l02-addition-subtraction-page-only-current-js',
  'lesson-g04-l03-negative-numbers',
  'lesson-g05-l03-exponents-prime-factorizations-page-only',
  'lesson-g05-l04-number-lines',
  'lesson-g05-l05-add-subtract-negative-numbers',
]);
const LESSON_SHARDS = Object.freeze([
  Object.freeze({id: 'g03-l02', releaseId: APPROVED_RELEASE_IDS[0]}),
  Object.freeze({id: 'g04-l03', releaseId: APPROVED_RELEASE_IDS[1]}),
  Object.freeze({id: 'g05-l03', releaseId: APPROVED_RELEASE_IDS[2]}),
  Object.freeze({id: 'g05-l04', releaseId: APPROVED_RELEASE_IDS[3]}),
  Object.freeze({id: 'g05-l05', releaseId: APPROVED_RELEASE_IDS[4]}),
]);
const EXPECTED = Object.freeze({
  v1ProfileSha256:
    'ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca',
  v1ChecksumSetSha256:
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  v10PlanSha256:
    'db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983',
  freezeSha256:
    'ee63ac0eb41608ea4d0690a3576576ee9d25d4486771343c3947b820d48f3a53',
  pageRendererCount: 283,
  loadedHostCount: 1,
  runtimeCount: 284,
  placementCount: 284,
  declaredRequirementCount: 918,
  declaredPageStateCount: 125_783,
  declaredLoadedHostStateCount: 832,
  declaredStateCount: 126_615,
  directDeclaredRequirementCount: 228,
  directDeclaredStateCount: 80_521,
  nonCanvasDeclaredRequirementCount: 758,
  nonCanvasDeclaredStateCount: 46_094,
  captureRequirementCount: 287,
  capturePageStateCount: 102_264,
  captureLoadedHostStateCount: 136,
  captureStateCount: 102_400,
});
const PAGE_RENDERER =
  /^courses\/(course-g(?:03|04|05)-l\d{2}-[^/]+)\/canvas-renderer\.js$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const CHUNK_STATE_COUNT = 48;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashBoundDocument(artifactType, payload) {
  return {
    schemaVersion: 1,
    artifactType,
    contentSha256: sha256(Buffer.from(canonicalJson({
      schemaVersion: 1,
      artifactType,
      payload,
    }))),
    payload,
  };
}

function verifyHashBoundDocument(document, artifactType) {
  invariant(document?.schemaVersion === 1 &&
    document?.artifactType === artifactType &&
    SHA256.test(document?.contentSha256 || ''),
  `${artifactType} envelope is invalid`);
  invariant(document.contentSha256 === sha256(Buffer.from(canonicalJson({
    schemaVersion: document.schemaVersion,
    artifactType: document.artifactType,
    payload: document.payload,
  }))), `${artifactType} content hash is invalid`);
  return document;
}

function jsonBytes(document) {
  return Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
}

function absolute(relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(resolved.startsWith(`${projectRoot}${path.sep}`),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function stableFile(relativePath) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  const handle = await open(target, 'r');
  try {
    const first = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const second = await handle.stat({bigint: true});
    const after = await lstat(target);
    invariant(first.dev === second.dev && first.ino === second.ino &&
      first.size === second.size && first.mtimeNs === second.mtimeNs &&
      before.dev === after.dev && before.ino === after.ino &&
      BigInt(bytes.length) === second.size,
    `${relativePath} changed while it was read`);
    return {
      path: relativePath,
      bytes,
      descriptor: {
        path: relativePath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      },
    };
  } finally {
    await handle.close();
  }
}

async function readJsonBinding(relativePath, artifactType = null) {
  const binding = await stableFile(relativePath);
  let document;
  try {
    document = JSON.parse(binding.bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${relativePath} is invalid JSON: ${error.message}`);
  }
  if (artifactType !== null) verifyHashBoundDocument(document, artifactType);
  return {...binding, document};
}

async function writeExclusiveOrSame(relativePath, bytes, mode = 0o444) {
  const target = absolute(relativePath);
  const current = await readFile(target).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (current !== null) {
    invariant(current.equals(bytes), `${relativePath} already exists with drift`);
    return 'existing-identical';
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: 'wx', mode});
  return 'created';
}

function positiveInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value > 0,
    `${label} must be a positive safe integer`);
  return value;
}

function validateRequirement(requirement, label) {
  invariant(requirement && typeof requirement === 'object',
    `${label} must be an object`);
  for (const [key, value] of Object.entries({
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    scenario: requirement.scenario,
  })) {
    invariant(typeof value === 'string' && SAFE_ID.test(value),
      `${label}.${key} is invalid`);
  }
  invariant(requirement.language === 'en' || requirement.language === 'es',
    `${label}.language is invalid`);
  invariant(typeof requirement.seed === 'string' && /^\d+$/u.test(requirement.seed),
    `${label}.seed is invalid`);
  invariant(SHA256.test(requirement.entryStateSha256 || ''),
    `${label}.entryStateSha256 is invalid`);
  const firstFrame = positiveInteger(
    requirement.requiredRange?.firstFrame,
    `${label}.requiredRange.firstFrame`,
  );
  const lastFrame = positiveInteger(
    requirement.requiredRange?.lastFrame,
    `${label}.requiredRange.lastFrame`,
  );
  invariant(lastFrame >= firstFrame, `${label}.requiredRange is reversed`);
  const thresholdClass = requirement.resolutionThresholdClass ?? 'static';
  invariant(thresholdClass === 'static' || thresholdClass === 'transition',
    `${label}.resolutionThresholdClass is invalid`);
  return {
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
    firstFrame,
    lastFrame,
    thresholdClass,
  };
}

function runtimeLanguages(metadata, animationId) {
  const languages = metadata.supportedLanguages ??
    metadata.renderableRouteLanguages;
  invariant(Array.isArray(languages) && languages.length > 0 &&
    languages.every((language) => language === 'en' || language === 'es'),
  `${animationId} runtime languages are invalid`);
  return languages;
}

function allowedFrameRanges(timeline, animationId) {
  const blocked = timeline.blockedLocalFrameRanges ?? [];
  invariant(Array.isArray(blocked),
    `${animationId} blocked frame ranges are invalid`);
  const sorted = blocked.map((range, index) => {
    invariant(Number.isSafeInteger(range?.firstFrame) &&
      Number.isSafeInteger(range?.lastFrame) &&
      range.firstFrame >= 1 && range.lastFrame >= range.firstFrame &&
      range.lastFrame <= timeline.frameCount &&
      typeof range.reason === 'string' && range.reason.length > 0,
    `${animationId} blocked frame range ${index} is invalid`);
    return {...range};
  }).sort((left, right) => left.firstFrame - right.firstFrame);
  const ranges = [];
  let cursor = 1;
  for (const range of sorted) {
    invariant(range.firstFrame >= cursor,
      `${animationId} blocked frame ranges overlap`);
    if (range.firstFrame > cursor) {
      ranges.push({firstFrame: cursor, lastFrame: range.firstFrame - 1});
    }
    cursor = range.lastFrame + 1;
  }
  if (cursor <= timeline.frameCount) {
    ranges.push({firstFrame: cursor, lastFrame: timeline.frameCount});
  }
  invariant(ranges.length > 0,
    `${animationId} has no direct-renderable runtime frames`);
  return {ranges, blocked: sorted};
}

function runtimeSurfaceRequirements(metadata, animationId) {
  const timeline = metadata?.deterministicContentTimeline;
  invariant(timeline && typeof timeline.timelineId === 'string' &&
    SAFE_ID.test(timeline.timelineId),
  `${animationId} has no deterministic timeline`);
  const frameCount = positiveInteger(timeline.frameCount,
    `${animationId} frameCount`);
  invariant(Array.isArray(metadata.scenarios) && metadata.scenarios.length > 0 &&
    metadata.scenarios.every((scenario) =>
      typeof scenario === 'string' && SAFE_ID.test(scenario)),
    `${animationId} scenarios are missing`);
  const languages = runtimeLanguages(metadata, animationId);
  const rootScenario = metadata.rootTimeline?.scenario ?? null;
  const mainScenarios = metadata.defaultFrameDomain === timeline.timelineId &&
    metadata.scenarios.includes('default')
    ? ['default']
    : metadata.scenarios.filter((scenario) =>
      scenario !== rootScenario && !scenario.endsWith('-unavailable'));
  invariant(mainScenarios.length === 1,
    `${animationId} deterministic content scenario is ambiguous`);
  const mainRanges = allowedFrameRanges(timeline, animationId);
  const requirements = [];
  const declaredRequirements = [];
  const append = ({
    target,
    identityPrefix,
    frameDomainId,
    scenario,
    firstFrame,
    lastFrame,
  }) => {
    for (const language of languages) {
      const entryState = {
        kind: 'current-javascript-v1-backing-runtime-surface-entry',
        animationId,
        frameDomainId,
        scenario,
        language,
        seed: '0',
        requiredRange: {firstFrame, lastFrame},
      };
      target.push({
        requirementId:
          `${identityPrefix}-${frameDomainId}-${scenario}-${language}-` +
          `f${firstFrame}-f${lastFrame}`,
        frameDomainId,
        traceId:
          `${identityPrefix}-${frameDomainId}-${scenario}-${language}-seed-0-` +
          `f${firstFrame}-f${lastFrame}`,
        entryStateSha256: sha256(Buffer.from(canonicalJson(entryState))),
        scenario,
        language,
        seed: '0',
        firstFrame,
        lastFrame,
        thresholdClass: 'static',
      });
    }
  };
  append({
    target: declaredRequirements,
    identityPrefix: 'runtime-declared',
    frameDomainId: timeline.timelineId,
    scenario: mainScenarios[0],
    firstFrame: 1,
    lastFrame: frameCount,
  });
  for (const range of mainRanges.ranges) {
    append({
      target: requirements,
      identityPrefix: 'runtime-surface',
      frameDomainId: timeline.timelineId,
      scenario: mainScenarios[0],
      ...range,
    });
  }
  if (rootScenario !== null) {
    invariant(metadata.scenarios.includes(rootScenario) &&
      Number.isSafeInteger(metadata.rootTimeline.frameCount) &&
      metadata.rootTimeline.frameCount > 0,
    `${animationId} root runtime surface is invalid`);
    append({
      target: requirements,
      identityPrefix: 'runtime-surface',
      frameDomainId: metadata.rootTimeline.timelineId ?? 'root',
      scenario: rootScenario,
      firstFrame: 1,
      lastFrame: metadata.rootTimeline.frameCount,
    });
    append({
      target: declaredRequirements,
      identityPrefix: 'runtime-declared',
      frameDomainId: metadata.rootTimeline.timelineId ?? 'root',
      scenario: rootScenario,
      firstFrame: 1,
      lastFrame: metadata.rootTimeline.frameCount,
    });
  }
  return {
    requirements,
    declaredRequirements,
    exclusions: mainRanges.blocked.map((range) => ({
      frameDomainId: timeline.timelineId,
      scenario: mainScenarios[0],
      ...range,
      disposition: 'source-declared-behavior-dependent-non-canvas-range',
    })),
  };
}

function bindDeclaredDisposition(requirement, runtimeRequirements) {
  const directBackingStateCount = runtimeRequirements.reduce(
    (sum, runtimeRequirement) => {
      if (requirement.frameDomainId !== runtimeRequirement.frameDomainId ||
        requirement.scenario !== runtimeRequirement.scenario ||
        requirement.language !== runtimeRequirement.language ||
        requirement.seed !== runtimeRequirement.seed) return sum;
      const first = Math.max(requirement.firstFrame,
        runtimeRequirement.firstFrame);
      const last = Math.min(requirement.lastFrame,
        runtimeRequirement.lastFrame);
      return sum + Math.max(0, last - first + 1);
    },
  0);
  const stateCount = requirement.lastFrame - requirement.firstFrame + 1;
  invariant(directBackingStateCount <= stateCount,
    `${requirement.requirementId} direct state overlap is invalid`);
  const nonCanvasStateCount = stateCount - directBackingStateCount;
  const disposition = directBackingStateCount === stateCount
    ? 'direct-current-js-backing-overlap'
    : directBackingStateCount === 0
      ? 'product-non-canvas-or-unsupported-direct-runtime-state'
      : 'mixed-direct-backing-and-product-non-canvas-state';
  return {
    ...requirement,
    directBackingStateCount,
    nonCanvasStateCount,
    disposition,
  };
}

async function requirementsForRuntime({animationId, runtimeBytes, sourceId}) {
  const metadata = extractCanvasRuntimeMetadata(runtimeBytes, sourceId);
  invariant(Array.isArray(metadata.scenarios) && metadata.scenarios.length > 0 &&
    metadata.scenarios.every((scenario) =>
      typeof scenario === 'string' && SAFE_ID.test(scenario)),
  `${sourceId} runtime scenarios are invalid`);
  const runtimeSurface = runtimeSurfaceRequirements(metadata, sourceId);
  const runtimeRequirements = runtimeSurface.requirements;
  const coveragePath =
    `migrations/${sourceId}/evidence/full-frame-coverage.json`;
  const coverage = await readJsonBinding(coveragePath).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (coverage !== null) {
    invariant(coverage.document.schemaVersion === 2 &&
      coverage.document.animationId === sourceId &&
      Array.isArray(coverage.document.requirements) &&
      coverage.document.requirements.length > 0,
    `${sourceId} coverage-v2 is invalid`);
    const declaredRequirements = coverage.document.requirements.map(
      (requirement, index) => {
        const validated = validateRequirement(requirement,
          `${sourceId}.requirements[${index}]`);
        return bindDeclaredDisposition(validated, runtimeRequirements);
      });
    return {
      source: {
        kind: 'coverage-v2',
        ...coverage.descriptor,
        runtimeMetadataSha256: sha256(Buffer.from(canonicalJson(metadata))),
        runtimeSurfaceExclusions: runtimeSurface.exclusions,
      },
      requirements: runtimeRequirements,
      declaredRequirements,
    };
  }
  return {
    source: {
      kind: 'renderer-metadata-fallback',
      metadataSha256: sha256(Buffer.from(canonicalJson(metadata))),
      runtimeSurfaceExclusions: runtimeSurface.exclusions,
    },
    requirements: runtimeRequirements,
    declaredRequirements: runtimeSurface.declaredRequirements.map(
      (requirement) =>
        bindDeclaredDisposition(requirement, runtimeRequirements)),
  };
}

export function stateIdentity(animationId, requirement, frame) {
  return {
    animationId,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    frame,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
  };
}

export function stateId(identity) {
  return `state-${sha256(Buffer.from(canonicalJson(identity))).slice(0, 20)}` +
    `-f${String(identity.frame).padStart(6, '0')}`;
}

export function expandRuntimeStates(runtime) {
  const states = [];
  for (const requirement of runtime.requirements) {
    for (let frame = requirement.firstFrame;
      frame <= requirement.lastFrame; frame += 1) {
      const identity = stateIdentity(runtime.animationId, requirement, frame);
      states.push({
        stateId: stateId(identity),
        identity,
        thresholdClass: requirement.thresholdClass,
        request: {
          frame,
          frameDomain: requirement.frameDomainId,
          scenario: requirement.scenario,
          lang: requirement.language,
          seed: Number(requirement.seed),
        },
      });
    }
  }
  invariant(new Set(states.map(({stateId: id}) => id)).size === states.length,
    `${runtime.animationId} state IDs are duplicated`);
  return states;
}

function shardReceiptPath(lessonId) {
  return `${OUTPUT_ROOT}/shards/${lessonId}.v1.json`;
}

function representativePngPath(animationId) {
  return `${OUTPUT_ROOT}/representative/${animationId}.png`;
}

function runtimeReceiptPath(animationId) {
  return `${OUTPUT_ROOT}/runtime-receipts/${animationId}.v1.json`;
}

async function runtimeFile(entry) {
  return stableFile(`apps/web/public/flash-assets/courses/${entry.relativePath}`);
}

async function buildPlanPayload() {
  const [profile, v10, freeze, captureTool, captureToolTest, ...catalogs] =
    await Promise.all([
    readJsonBinding(V1_PROFILE_PATH),
    readJsonBinding(V10_PLAN_PATH),
    readJsonBinding(FREEZE_PATH,
      'adaptive-canvas-real-browser-validation-v10-freeze'),
    stableFile(CAPTURE_TOOL_PATH),
    stableFile(CAPTURE_TOOL_TEST_PATH),
    ...RELEASE_CATALOG_PATHS.map((candidate) => readJsonBinding(candidate)),
  ]);
  invariant(profile.descriptor.sha256 === EXPECTED.v1ProfileSha256 &&
    profile.document.profileId === 'current-js-production-assets-v1' &&
    profile.document.checksumSetSha256 === EXPECTED.v1ChecksumSetSha256,
  'v1 production profile identity changed');
  invariant(v10.descriptor.sha256 === EXPECTED.v10PlanSha256,
    'v10 plan identity changed');
  invariant(planReceiptBytes(v10.document).equals(v10.bytes),
    'v10 plan bytes are not canonical');
  invariant(freeze.descriptor.sha256 === EXPECTED.freezeSha256,
    'real-browser v10 freeze identity changed');
  const placements = resolveProductionPlacements({
    releaseCatalogDocuments: catalogs.map(({document}) => document),
    approvedReleaseIds: APPROVED_RELEASE_IDS,
  });
  invariant(placements.length === EXPECTED.placementCount,
    'production placement count changed');
  const v10ByAsset = new Map(v10.document.payload.runtimes.map((runtime) => [
    runtime.assetPath,
    runtime,
  ]));
  invariant(v10ByAsset.size === EXPECTED.runtimeCount,
    'v10 runtime count changed');
  const pageEntries = profile.document.entries
    .map((entry) => ({entry, match: PAGE_RENDERER.exec(entry.assetPath)}))
    .filter(({match}) => match !== null)
    .map(({entry, match}) => ({entry, animationId: match[1]}))
    .sort((left, right) => left.animationId.localeCompare(right.animationId, 'en'));
  invariant(pageEntries.length === EXPECTED.pageRendererCount,
    'v1 page-renderer count changed');
  const runtimes = [];
  for (const {entry, animationId} of pageEntries) {
    const file = await runtimeFile(entry);
    invariant(file.bytes.length === entry.bytes &&
      file.descriptor.sha256 === entry.sha256,
    `${animationId} differs from v1 profile`);
    const candidate = v10ByAsset.get(entry.assetPath);
    invariant(candidate?.pageRenderer === true &&
      candidate.animationId === animationId &&
      candidate.input.bytes === entry.bytes &&
      candidate.input.sha256 === entry.sha256,
    `${animationId} differs from v10 input`);
    const resolved = await requirementsForRuntime({
      animationId,
      runtimeBytes: file.bytes,
      sourceId: animationId,
    });
    const placement = placements.find((row) => row.animationId === animationId);
    invariant(placement, `${animationId} has no production placement`);
    runtimes.push({
      animationId,
      registryAnimationId: animationId,
      metadataAnimationId: animationId,
      pageRenderer: true,
      releaseId: entry.releaseId,
      lessonShard: LESSON_SHARDS.find(({releaseId}) =>
        releaseId === entry.releaseId)?.id,
      profileEntry: {...entry},
      runtimeFile: file.descriptor,
      requirementSource: resolved.source,
      requirements: resolved.requirements,
      declaredRequirements: resolved.declaredRequirements,
    });
  }
  const hostEntry = profile.document.entries.find(({assetPath}) =>
    assetPath === LOADED_HOST.assetPath);
  invariant(hostEntry, 'v1 loaded-host entry is missing');
  const hostFile = await runtimeFile(hostEntry);
  invariant(hostFile.bytes.length === hostEntry.bytes &&
    hostFile.descriptor.sha256 === hostEntry.sha256,
  'loaded-host differs from v1 profile');
  const hostCandidate = v10ByAsset.get(hostEntry.assetPath);
  invariant(hostCandidate?.pageRenderer === false &&
    hostCandidate.input.bytes === hostEntry.bytes &&
    hostCandidate.input.sha256 === hostEntry.sha256,
  'loaded-host differs from v10 input');
  const hostRequirements = await requirementsForRuntime({
    animationId: hostCandidate.animationId,
    runtimeBytes: hostFile.bytes,
    sourceId: LOADED_HOST.metadataAnimationId,
  });
  runtimes.push({
    animationId: hostCandidate.animationId,
    registryAnimationId: LOADED_HOST.registryAnimationId,
    metadataAnimationId: LOADED_HOST.metadataAnimationId,
    pageRenderer: false,
    releaseId: hostEntry.releaseId,
    lessonShard: 'g04-l03',
    profileEntry: {...hostEntry},
    runtimeFile: hostFile.descriptor,
    requirementSource: hostRequirements.source,
    requirements: hostRequirements.requirements,
    declaredRequirements: hostRequirements.declaredRequirements,
  });
  invariant(runtimes.length === EXPECTED.runtimeCount &&
    new Set(runtimes.map(({animationId}) => animationId)).size ===
      EXPECTED.runtimeCount,
  'baseline runtime identities changed');
  let stateCount = 0;
  const plannedRuntimes = runtimes.map((runtime) => {
    const count = runtime.requirements.reduce((sum, requirement) =>
      sum + requirement.lastFrame - requirement.firstFrame + 1, 0);
    const declaredStateCount = runtime.declaredRequirements.reduce(
      (sum, requirement) =>
        sum + requirement.lastFrame - requirement.firstFrame + 1, 0);
    stateCount += count;
    return {...runtime, stateCount: count, declaredStateCount};
  });
  const pageStateCount = plannedRuntimes.filter(({pageRenderer}) => pageRenderer)
    .reduce((sum, runtime) => sum + runtime.stateCount, 0);
  const loadedHostStateCount = stateCount - pageStateCount;
  invariant(pageStateCount === EXPECTED.capturePageStateCount &&
    loadedHostStateCount === EXPECTED.captureLoadedHostStateCount &&
    stateCount === EXPECTED.captureStateCount,
  `baseline state denominator changed: ${pageStateCount}/${loadedHostStateCount}/${stateCount}`);
  const declaredRequirements = plannedRuntimes.flatMap(
    ({declaredRequirements: requirements}) => requirements);
  const declaredStateCount = plannedRuntimes.reduce((sum, runtime) =>
    sum + runtime.declaredStateCount, 0);
  const declaredPageStateCount = plannedRuntimes
    .filter(({pageRenderer}) => pageRenderer)
    .reduce((sum, runtime) => sum + runtime.declaredStateCount, 0);
  const declaredLoadedHostStateCount = declaredStateCount -
    declaredPageStateCount;
  const captureRequirementCount = plannedRuntimes.reduce((sum, runtime) =>
    sum + runtime.requirements.length, 0);
  const directDeclaredRequirements = declaredRequirements.filter(
    ({directBackingStateCount}) => directBackingStateCount > 0);
  const directDeclaredStateCount = directDeclaredRequirements.reduce(
    (sum, requirement) => sum + requirement.directBackingStateCount, 0);
  const nonCanvasDeclaredRequirements = declaredRequirements.filter(
    ({nonCanvasStateCount}) => nonCanvasStateCount > 0);
  const nonCanvasDeclaredRequirementCount =
    nonCanvasDeclaredRequirements.length;
  const nonCanvasDeclaredStateCount = nonCanvasDeclaredRequirements.reduce(
    (sum, requirement) => sum + requirement.nonCanvasStateCount, 0);
  invariant(directDeclaredStateCount + nonCanvasDeclaredStateCount ===
    declaredStateCount,
  'declared direct/non-canvas states do not partition the denominator');
  invariant(declaredRequirements.length === EXPECTED.declaredRequirementCount &&
    declaredPageStateCount === EXPECTED.declaredPageStateCount &&
    declaredLoadedHostStateCount === EXPECTED.declaredLoadedHostStateCount &&
    declaredStateCount === EXPECTED.declaredStateCount &&
    directDeclaredRequirements.length ===
      EXPECTED.directDeclaredRequirementCount &&
    directDeclaredStateCount === EXPECTED.directDeclaredStateCount &&
    nonCanvasDeclaredRequirementCount ===
      EXPECTED.nonCanvasDeclaredRequirementCount &&
    nonCanvasDeclaredStateCount === EXPECTED.nonCanvasDeclaredStateCount,
  `declared requirement disposition denominator changed: ` +
    `${declaredRequirements.length}/${declaredPageStateCount}/` +
    `${declaredLoadedHostStateCount}/${declaredStateCount}/` +
    `${directDeclaredRequirements.length}/${directDeclaredStateCount}/` +
    `${nonCanvasDeclaredRequirementCount}/${nonCanvasDeclaredStateCount}`);
  invariant(captureRequirementCount === EXPECTED.captureRequirementCount,
    'capture requirement denominator changed');
  const shards = LESSON_SHARDS.map(({id, releaseId}) => {
    const members = plannedRuntimes.filter(({lessonShard}) => lessonShard === id);
    return {
      lessonId: id,
      releaseId,
      runtimeCount: members.length,
      pageRendererCount: members.filter(({pageRenderer}) => pageRenderer).length,
      loadedHostCount: members.filter(({pageRenderer}) => !pageRenderer).length,
      stateCount: members.reduce((sum, runtime) => sum + runtime.stateCount, 0),
      runtimeIds: members.map(({animationId}) => animationId),
      receiptPath: shardReceiptPath(id),
    };
  });
  return {
    status: 'planned-v1-direct-backing-hash-baseline',
    inputs: {
      v1Profile: profile.descriptor,
      v10Plan: v10.descriptor,
      realBrowserFreeze: freeze.descriptor,
      captureTool: captureTool.descriptor,
      captureToolTest: captureToolTest.descriptor,
      releaseCatalogs: catalogs.map(({descriptor}) => descriptor),
    },
    contract: {
      stage: {width: 800, height: 600},
      scale: 1,
      pixelFormat: 'rgba8-srgb-straight-alpha',
      pngEncoder: 'chromium-canvas-toBlob-image-png',
      stateHash: 'sha256-canonical-json',
      rendererRequestExtension:
        'source-bound-frameDomain-for-special-v1-runtime-ignored-by-generic-runtime',
      retention:
        'all-state-rgba-and-png-hashes-plus-one-lossless-png-per-runtime',
      browserPageReuse: 'one-runtime-per-page-fresh-canvas-per-state',
      browserBootstrap:
        'playwright-fulfilled-trustworthy-localhost-origin-before-signal-reset',
      networkRequestsAllowed: 0,
      rawRgbaFilesRetained: false,
      allStatePngFilesRetained: false,
      representativePngCount: EXPECTED.runtimeCount,
      browserChunkStateCount: CHUNK_STATE_COUNT,
    },
    summary: {
      runtimeCount: plannedRuntimes.length,
      pageRendererCount: EXPECTED.pageRendererCount,
      loadedHostCount: EXPECTED.loadedHostCount,
      placementCount: placements.length,
      captureRequirementCount,
      capturePageStateCount: pageStateCount,
      captureLoadedHostStateCount: loadedHostStateCount,
      captureStateCount: stateCount,
      declaredRequirementCount: declaredRequirements.length,
      declaredPageStateCount,
      declaredLoadedHostStateCount,
      declaredStateCount,
      directDeclaredRequirementCount: directDeclaredRequirements.length,
      directDeclaredStateCount,
      nonCanvasDeclaredRequirementCount,
      nonCanvasDeclaredStateCount,
      rawRgbaBytesAvoided: stateCount * 800 * 600 * 4,
    },
    shards,
    runtimes: plannedRuntimes,
    boundaries: {
      currentJavascriptOnly: true,
      originalFlashRuntimeAcceptance: false,
      adaptiveBatchApplyRun: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      ownerAccepted: false,
      releaseEligibilityChanged: false,
    },
  };
}

export async function buildPlan() {
  return hashBoundDocument(
    'canvas-resolution-v1-backing-compact-plan',
    await buildPlanPayload(),
  );
}

async function writeOrCheckPlan({check}) {
  const document = await buildPlan();
  const bytes = jsonBytes(document);
  if (check) {
    const current = await readFile(absolute(PLAN_PATH));
    invariant(current.equals(bytes), `${PLAN_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes};
  }
  const operation = await writeExclusiveOrSame(PLAN_PATH, bytes);
  return {operation, document, bytes};
}

async function loadExactPlan() {
  const binding = await readJsonBinding(
    PLAN_PATH,
    'canvas-resolution-v1-backing-compact-plan',
  );
  const recomputed = await buildPlan();
  invariant(binding.bytes.equals(jsonBytes(recomputed)),
    'v1 backing plan is stale for current frozen inputs');
  return {...binding, document: recomputed};
}

async function captureRuntimeInBrowser({browser, runtime, runtimeBytes}) {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 800, height: 600},
  });
  const page = await context.newPage();
  const signals = {consoleErrors: [], pageErrors: [], requests: []};
  page.on('console', (message) => {
    if (message.type() === 'error') signals.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => signals.pageErrors.push(error.message));
  page.on('request', (request) => signals.requests.push(request.url()));
  try {
    await page.route('http://canvas-baseline.localhost/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<canvas id="stage" width="800" height="600"></canvas>',
      }));
    await page.goto('http://canvas-baseline.localhost/');
    invariant(await page.evaluate(() => globalThis.isSecureContext === true &&
      typeof globalThis.crypto?.subtle?.digest === 'function'),
    `${runtime.animationId} capture origin lacks WebCrypto`);
    signals.requests.length = 0;
    await page.addScriptTag({content: runtimeBytes.toString('utf8')});
    const states = expandRuntimeStates(runtime);
    const rows = [];
    let representativePng = null;
    for (let offset = 0; offset < states.length; offset += CHUNK_STATE_COUNT) {
      const chunk = states.slice(offset, offset + CHUNK_STATE_COUNT);
      const result = await page.evaluate(async ({
        registryAnimationId,
        chunk: requests,
        retainRepresentative,
      }) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[registryAnimationId];
        if (!asset) throw new Error(`missing registry asset ${registryAnimationId}`);
        await asset.ready();
        const canvas = document.querySelector('#stage');
        const digest = async (bytes) => {
          const value = await crypto.subtle.digest('SHA-256', bytes);
          return [...new Uint8Array(value)].map((byte) =>
            byte.toString(16).padStart(2, '0')).join('');
        };
        const canonicalize = (value) => {
          if (Array.isArray(value)) return value.map(canonicalize);
          if (value && typeof value === 'object') {
            return Object.fromEntries(Object.keys(value).sort().map((key) => [
              key,
              canonicalize(value[key]),
            ]));
          }
          return value;
        };
        const output = [];
        let representative = null;
        for (let index = 0; index < requests.length; index += 1) {
          const request = requests[index];
          canvas.width = 800;
          canvas.height = 600;
          const state = asset.render(canvas, request.request);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('2D context allocation failed');
          const rgba = context.getImageData(0, 0, 800, 600).data;
          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((value) => value
              ? resolve(value)
              : reject(new Error('Canvas PNG encoding failed')), 'image/png');
          });
          const png = new Uint8Array(await blob.arrayBuffer());
          const stateJson = JSON.stringify(canonicalize(
            JSON.parse(JSON.stringify(state)),
          ));
          output.push({
            stateId: request.stateId,
            rgbaSha256: await digest(rgba),
            pngSha256: await digest(png),
            pngBytes: png.byteLength,
            renderStateSha256: await digest(new TextEncoder().encode(stateJson)),
          });
          if (retainRepresentative && index === 0) {
            representative = {
              stateId: request.stateId,
              dataUrl: canvas.toDataURL('image/png'),
            };
          }
        }
        return {rows: output, representative};
      }, {
        registryAnimationId: runtime.registryAnimationId,
        chunk,
        retainRepresentative: offset === 0,
      });
      rows.push(...result.rows);
      if (result.representative) representativePng = result.representative;
    }
    invariant(rows.length === states.length && representativePng,
      `${runtime.animationId} browser result is incomplete`);
    invariant(signals.consoleErrors.length === 0 &&
      signals.pageErrors.length === 0 && signals.requests.length === 0,
    `${runtime.animationId} browser signals are not clean: ${JSON.stringify(signals)}`);
    const boundRows = rows.map((row, index) => {
      invariant(row.stateId === states[index].stateId &&
        SHA256.test(row.rgbaSha256) && SHA256.test(row.pngSha256) &&
        SHA256.test(row.renderStateSha256) &&
        Number.isSafeInteger(row.pngBytes) && row.pngBytes > 0,
      `${runtime.animationId} browser row ${index} is invalid`);
      return {
        stateId: row.stateId,
        identity: states[index].identity,
        thresholdClass: states[index].thresholdClass,
        rgbaSha256: row.rgbaSha256,
        pngSha256: row.pngSha256,
        pngBytes: row.pngBytes,
        renderStateSha256: row.renderStateSha256,
      };
    });
    const pngBytes = Buffer.from(
      representativePng.dataUrl.slice('data:image/png;base64,'.length),
      'base64',
    );
    const representativeState = boundRows[0];
    invariant(representativePng.stateId === representativeState.stateId &&
      sha256(pngBytes) === representativeState.pngSha256,
    `${runtime.animationId} representative PNG mismatch`);
    return {
      rows: boundRows,
      representative: {
        path: representativePngPath(runtime.animationId),
        stateId: representativeState.stateId,
        identity: representativeState.identity,
        bytes: pngBytes.length,
        sha256: sha256(pngBytes),
        pngBytes,
      },
      signals,
    };
  } finally {
    await context.close();
  }
}

function checksumRows(rows) {
  return sha256(Buffer.from(rows.map((row) =>
    `${row.stateId} ${row.rgbaSha256} ${row.pngSha256} ` +
      `${row.renderStateSha256}`
  ).join('\n')));
}

function planReference(plan) {
  return {
    path: PLAN_PATH,
    bytes: plan.bytes.length,
    sha256: plan.descriptor.sha256,
    contentSha256: plan.document.contentSha256,
  };
}

function browserReference(toolchain) {
  return {
    name: 'chromium',
    version: toolchain.chromium.browserVersion,
    executable: toolchain.chromium.executable,
    runtimeBinary: toolchain.chromium.runtimeBinary,
  };
}

function runtimeRecord(runtime, capture) {
  return {
    animationId: runtime.animationId,
    registryAnimationId: runtime.registryAnimationId,
    metadataAnimationId: runtime.metadataAnimationId,
    pageRenderer: runtime.pageRenderer,
    runtimeFile: runtime.runtimeFile,
    requirementSource: runtime.requirementSource,
    requirementCount: runtime.requirements.length,
    stateCount: capture.rows.length,
    stateChecksumSetSha256: checksumRows(capture.rows),
    representative: {
      path: capture.representative.path,
      stateId: capture.representative.stateId,
      identity: capture.representative.identity,
      bytes: capture.representative.bytes,
      sha256: capture.representative.sha256,
    },
    states: capture.rows,
    runtimeSignals: capture.signals,
  };
}

async function verifyRuntimeCheckpoint({
  plan,
  runtime,
  toolchain,
  expectedDescriptor = null,
}) {
  const receipt = await readJsonBinding(
    runtimeReceiptPath(runtime.animationId),
    'canvas-resolution-v1-backing-compact-runtime',
  );
  if (expectedDescriptor !== null) {
    invariant(canonicalJson(receipt.descriptor) ===
      canonicalJson(expectedDescriptor),
    `${runtime.animationId} checkpoint descriptor changed`);
  }
  const payload = receipt.document.payload;
  invariant(payload.status === 'pass' &&
    payload.lessonId === runtime.lessonShard &&
    canonicalJson(payload.plan) === canonicalJson(planReference(plan)) &&
    canonicalJson(payload.browser) === canonicalJson(browserReference(toolchain)) &&
    canonicalJson(payload.boundaries) ===
      canonicalJson(plan.document.payload.boundaries),
  `${runtime.animationId} checkpoint binding changed`);
  verifyStateRows(runtime, payload.runtime);
  invariant(payload.runtime.runtimeSignals.consoleErrors.length === 0 &&
    payload.runtime.runtimeSignals.pageErrors.length === 0 &&
    payload.runtime.runtimeSignals.requests.length === 0,
  `${runtime.animationId} checkpoint browser signals changed`);
  const representative = await stableFile(payload.runtime.representative.path);
  invariant(representative.bytes.length ===
    payload.runtime.representative.bytes &&
    representative.descriptor.sha256 ===
      payload.runtime.representative.sha256 &&
    payload.runtime.representative.stateId ===
      payload.runtime.states[0].stateId &&
    canonicalJson(payload.runtime.representative.identity) ===
      canonicalJson(payload.runtime.states[0].identity),
  `${runtime.animationId} checkpoint representative PNG changed`);
  return receipt;
}

async function maybeRuntimeCheckpoint(options) {
  try {
    return await verifyRuntimeCheckpoint(options);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeRuntimeCheckpoint({plan, runtime, toolchain, capture}) {
  await writeExclusiveOrSame(
    capture.representative.path,
    capture.representative.pngBytes,
  );
  const document = hashBoundDocument(
    'canvas-resolution-v1-backing-compact-runtime',
    {
      status: 'pass',
      lessonId: runtime.lessonShard,
      plan: planReference(plan),
      browser: browserReference(toolchain),
      runtime: runtimeRecord(runtime, capture),
      boundaries: plan.document.payload.boundaries,
    },
  );
  const bytes = jsonBytes(document);
  await writeExclusiveOrSame(runtimeReceiptPath(runtime.animationId), bytes);
  return verifyRuntimeCheckpoint({plan, runtime, toolchain});
}

async function executeLesson(lessonId) {
  const plan = await loadExactPlan();
  const shard = plan.document.payload.shards.find(({lessonId: id}) =>
    id === lessonId);
  invariant(shard, `unknown lesson shard: ${lessonId}`);
  const runtimes = plan.document.payload.runtimes.filter(({lessonShard}) =>
    lessonShard === lessonId);
  invariant(runtimes.length === shard.runtimeCount,
    `${lessonId} runtime count changed`);
  const {chromium} = await import('playwright');
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  invariant(chromium.executablePath() === toolchain.chromium.executable.path,
    'Playwright Chromium executable differs from frozen toolchain');
  let browser = null;
  const runtimeResults = [];
  try {
    for (const runtime of runtimes) {
      const file = await stableFile(runtime.runtimeFile.path);
      invariant(file.bytes.length === runtime.runtimeFile.bytes &&
        file.descriptor.sha256 === runtime.runtimeFile.sha256,
      `${runtime.animationId} runtime changed before capture`);
      let receipt = await maybeRuntimeCheckpoint({
        plan,
        runtime,
        toolchain,
      });
      let source = 'checkpoint';
      if (receipt === null) {
        if (browser === null) {
          browser = await chromium.launch({
            headless: true,
            executablePath: toolchain.chromium.executable.path,
          });
          invariant(browser.version() === toolchain.chromium.browserVersion,
            'launched Chromium differs from frozen browser manifest');
        }
        const capture = await captureRuntimeInBrowser({
          browser,
          runtime,
          runtimeBytes: file.bytes,
        });
        receipt = await writeRuntimeCheckpoint({
          plan,
          runtime,
          toolchain,
          capture,
        });
        source = 'browser';
      }
      runtimeResults.push(receipt);
      process.stdout.write(`${JSON.stringify({
        lessonId,
        animationId: runtime.animationId,
        stateCount: receipt.document.payload.runtime.stateCount,
        evidenceSource: source,
        completedRuntimeCount: runtimeResults.length,
        totalRuntimeCount: runtimes.length,
      })}\n`);
    }
  } finally {
    if (browser !== null) await browser.close();
  }
  const runtimeRecords = runtimeResults.map((receipt) =>
    receipt.document.payload.runtime);
  const payload = {
    status: 'pass',
    lessonId,
    releaseId: shard.releaseId,
    plan: planReference(plan),
    browser: browserReference(toolchain),
    summary: {
      runtimeCount: runtimeRecords.length,
      pageRendererCount: runtimeRecords.filter(({pageRenderer}) => pageRenderer).length,
      loadedHostCount: runtimeRecords.filter(({pageRenderer}) => !pageRenderer).length,
      stateCount: runtimeRecords.reduce((sum, runtime) =>
        sum + runtime.stateCount, 0),
      representativePngCount: runtimeRecords.length,
    },
    runtimes: runtimeResults.map((receipt) => ({
      animationId: receipt.document.payload.runtime.animationId,
      checkpoint: {
        ...receipt.descriptor,
        contentSha256: receipt.document.contentSha256,
      },
    })),
    boundaries: plan.document.payload.boundaries,
  };
  invariant(payload.summary.stateCount === shard.stateCount,
    `${lessonId} state count changed during capture`);
  const document = hashBoundDocument(
    'canvas-resolution-v1-backing-compact-shard',
    payload,
  );
  const bytes = jsonBytes(document);
  const operation = await writeExclusiveOrSame(shard.receiptPath, bytes);
  return {operation, document, bytes, path: shard.receiptPath};
}

function verifyStateRows(runtime, recorded) {
  const states = expandRuntimeStates(runtime);
  invariant(recorded.animationId === runtime.animationId &&
    recorded.registryAnimationId === runtime.registryAnimationId &&
    recorded.metadataAnimationId === runtime.metadataAnimationId &&
    recorded.pageRenderer === runtime.pageRenderer &&
    canonicalJson(recorded.runtimeFile) === canonicalJson(runtime.runtimeFile) &&
    canonicalJson(recorded.requirementSource) ===
      canonicalJson(runtime.requirementSource) &&
    recorded.requirementCount === runtime.requirements.length &&
    recorded.stateCount === states.length &&
    recorded.states.length === states.length,
  `${runtime.animationId} shard runtime identity changed`);
  for (let index = 0; index < states.length; index += 1) {
    const expected = states[index];
    const row = recorded.states[index];
    invariant(row.stateId === expected.stateId &&
      canonicalJson(row.identity) === canonicalJson(expected.identity) &&
      row.thresholdClass === expected.thresholdClass &&
      SHA256.test(row.rgbaSha256 || '') && SHA256.test(row.pngSha256 || '') &&
      SHA256.test(row.renderStateSha256 || '') &&
      Number.isSafeInteger(row.pngBytes) && row.pngBytes > 0,
    `${runtime.animationId} state row ${index} changed`);
  }
  invariant(recorded.stateChecksumSetSha256 === checksumRows(recorded.states),
    `${runtime.animationId} state checksum set changed`);
  return states.length;
}

async function verifyLesson(plan, lessonId) {
  const shard = plan.document.payload.shards.find(({lessonId: id}) =>
    id === lessonId);
  invariant(shard, `unknown lesson shard: ${lessonId}`);
  const receipt = await readJsonBinding(
    shard.receiptPath,
    'canvas-resolution-v1-backing-compact-shard',
  );
  const payload = receipt.document.payload;
  invariant(payload.status === 'pass' && payload.lessonId === lessonId &&
    payload.releaseId === shard.releaseId &&
    payload.plan.path === PLAN_PATH &&
    payload.plan.sha256 === plan.descriptor.sha256 &&
    payload.plan.contentSha256 === plan.document.contentSha256,
  `${lessonId} shard binding changed`);
  const runtimes = plan.document.payload.runtimes.filter(({lessonShard}) =>
    lessonShard === lessonId);
  invariant(payload.runtimes.length === runtimes.length,
    `${lessonId} shard runtime count changed`);
  const toolchain = await collectChromiumToolchainIdentity({projectRoot});
  invariant(canonicalJson(payload.browser) ===
    canonicalJson(browserReference(toolchain)),
  `${lessonId} shard browser binding changed`);
  let stateCount = 0;
  for (let index = 0; index < runtimes.length; index += 1) {
    const runtime = runtimes[index];
    const member = payload.runtimes[index];
    invariant(member.animationId === runtime.animationId,
      `${lessonId} shard runtime order changed at ${index}`);
    const receipt = await verifyRuntimeCheckpoint({
      plan,
      runtime,
      toolchain,
      expectedDescriptor: {
        path: member.checkpoint.path,
        bytes: member.checkpoint.bytes,
        sha256: member.checkpoint.sha256,
      },
    });
    invariant(member.checkpoint.contentSha256 ===
      receipt.document.contentSha256,
    `${runtime.animationId} checkpoint content hash changed`);
    const recorded = receipt.document.payload.runtime;
    stateCount += verifyStateRows(runtime, recorded);
  }
  invariant(stateCount === shard.stateCount &&
    payload.summary.stateCount === shard.stateCount &&
    payload.summary.runtimeCount === shard.runtimeCount &&
    payload.summary.pageRendererCount === shard.pageRendererCount &&
    payload.summary.loadedHostCount === shard.loadedHostCount &&
    payload.summary.representativePngCount === shard.runtimeCount,
  `${lessonId} shard summary changed`);
  return receipt;
}

async function aggregateBaseline({check}) {
  const plan = await loadExactPlan();
  const receipts = [];
  for (const shard of plan.document.payload.shards) {
    receipts.push(await verifyLesson(plan, shard.lessonId));
  }
  const payload = {
    status: 'pass',
    evidenceClass: 'current-javascript-v1-direct-backing-hash-baseline',
    plan: {
      path: PLAN_PATH,
      bytes: plan.bytes.length,
      sha256: plan.descriptor.sha256,
      contentSha256: plan.document.contentSha256,
    },
    summary: {
      runtimeCount: receipts.reduce((sum, receipt) =>
        sum + receipt.document.payload.summary.runtimeCount, 0),
      pageRendererCount: receipts.reduce((sum, receipt) =>
        sum + receipt.document.payload.summary.pageRendererCount, 0),
      loadedHostCount: receipts.reduce((sum, receipt) =>
        sum + receipt.document.payload.summary.loadedHostCount, 0),
      stateCount: receipts.reduce((sum, receipt) =>
        sum + receipt.document.payload.summary.stateCount, 0),
      representativePngCount: receipts.reduce((sum, receipt) =>
        sum + receipt.document.payload.summary.representativePngCount, 0),
      rawRgbaBytesAvoided: plan.document.payload.summary.rawRgbaBytesAvoided,
    },
    shards: receipts.map((receipt) => ({
      path: receipt.descriptor.path,
      bytes: receipt.bytes.length,
      sha256: receipt.descriptor.sha256,
      contentSha256: receipt.document.contentSha256,
      lessonId: receipt.document.payload.lessonId,
    })),
    boundaries: plan.document.payload.boundaries,
  };
  invariant(payload.summary.runtimeCount === EXPECTED.runtimeCount &&
    payload.summary.pageRendererCount === EXPECTED.pageRendererCount &&
    payload.summary.loadedHostCount === EXPECTED.loadedHostCount &&
    payload.summary.stateCount === EXPECTED.captureStateCount &&
    payload.summary.representativePngCount === EXPECTED.runtimeCount,
  'aggregate v1 backing denominator changed');
  const document = hashBoundDocument(
    'canvas-resolution-v1-backing-compact-baseline',
    payload,
  );
  const bytes = jsonBytes(document);
  if (check) {
    const current = await readFile(absolute(AGGREGATE_PATH));
    invariant(current.equals(bytes), `${AGGREGATE_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes, path: AGGREGATE_PATH};
  }
  const operation = await writeExclusiveOrSame(AGGREGATE_PATH, bytes);
  return {operation, document, bytes, path: AGGREGATE_PATH};
}

export function parseArguments(argv) {
  let mode = null;
  let lessonId = null;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (['--plan', '--check-plan', '--execute', '--check', '--aggregate']
      .includes(option)) {
      invariant(mode === null, 'choose exactly one mode');
      mode = option.slice(2);
      continue;
    }
    if (option === '--lesson') {
      invariant(lessonId === null && argv[index + 1], '--lesson requires one value');
      lessonId = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${option}`);
  }
  invariant(mode !== null, 'one explicit mode is required');
  if (mode === 'execute' || (mode === 'check' && lessonId !== null)) {
    invariant(LESSON_SHARDS.some(({id}) => id === lessonId),
      '--execute and shard --check require one fixed --lesson');
  } else {
    invariant(lessonId === null, '--lesson is valid only for execute/shard check');
  }
  return {mode, lessonId};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  let result;
  if (options.mode === 'plan') {
    result = await writeOrCheckPlan({check: false});
  } else if (options.mode === 'check-plan') {
    result = await writeOrCheckPlan({check: true});
  } else if (options.mode === 'execute') {
    result = await executeLesson(options.lessonId);
  } else if (options.mode === 'aggregate') {
    result = await aggregateBaseline({check: false});
  } else if (options.lessonId !== null) {
    const plan = await loadExactPlan();
    result = await verifyLesson(plan, options.lessonId);
    result = {
      operation: 'checked',
      document: result.document,
      bytes: result.bytes,
      path: result.descriptor.path,
    };
  } else {
    await writeOrCheckPlan({check: true});
    result = await aggregateBaseline({check: true});
  }
  process.stdout.write(`${JSON.stringify({
    status: result.operation,
    path: result.path ?? PLAN_PATH,
    bytes: result.bytes.length,
    sha256: sha256(result.bytes),
    contentSha256: result.document.contentSha256,
  })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`v1-backing-baseline: ${error.message}\n`);
    process.exitCode = 1;
  });
}
