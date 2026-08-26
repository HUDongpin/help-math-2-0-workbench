#!/usr/bin/env node

import {execFile as execFileCallback} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

import {
  CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
  CURRENT_JS_CANDIDATE_FLASH_ROOT,
  CURRENT_JS_CANDIDATE_VERSION,
  currentJsCandidateEvidencePath,
  currentJsCandidateRuntimePath,
  separatedCurrentJsCandidateStoragePath,
} from './current-js-candidate-paths.mjs';

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_ROOT = 'apps/web/public/flash-assets/courses';
const SERVER_ROOT = 'apps/web/server-assets/flash-assets/courses';
const WORKBENCH_PUBLIC_ROOT = 'public/flash-assets/courses';
const FREEZE_PATH =
  'reports/current-js-production-asset-separation-freeze-2026-08-22.json';
const FREEZE_SHA_PATH = `${FREEZE_PATH}.sha256`;
const APPLIED_RECEIPT_PATH =
  'reports/current-js-production-asset-separation-applied-2026-08-22.json';
const EVIDENCE_RELOCATION_RECEIPT_PATH =
  'reports/current-js-candidate-evidence-relocation-applied-2026-08-22.json';
const PRODUCTION_PROFILE_PATH =
  'apps/web/config/current-js-production-assets.v1.json';
const CANDIDATE_PROFILE_PATH =
  'apps/web/config/current-js-candidate-assets.v1.json';
const CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH =
  'reports/current-js-candidate-assets-currentness-successor-2026-08-24-v4.json';
const PREVIOUS_CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH =
  'reports/current-js-candidate-assets-currentness-successor-2026-08-23-v3.json';
const G4_L9_P4_FREEZE_PATH =
  'catalog/g4-l9-p4-representative-slice-freeze-v1.json';
const G4_L9_P4_GENERATOR_PATH =
  'scripts/build-g4-l9-p4-representative-slice.mjs';
const G4_L9_P5_FREEZE_PATH =
  'catalog/g4-l9-p5-f08-occurrence-32-stress-freeze-v1.json';
const G4_L9_P5_GENERATOR_PATH =
  'scripts/build-g4-l9-p5-f08-occurrence-32-stress.mjs';
const G4_L9_P5_1_FREEZE_PATH =
  'catalog/g4-l9-p5-1-occurrence-29-bounded-freeze-v1.json';
const G4_L9_P5_1_GENERATOR_PATH =
  'scripts/build-g4-l9-p5-1-occurrence-29-bounded.mjs';
const G5_BEHAVIOR_CANVAS_GENERATOR_PATH =
  'scripts/build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs';
const SHARED_ADAPTER_GENERATOR_PATH =
  'scripts/build-safe-ffdec-canvas-adapter.mjs';
const G5_BEHAVIOR_CALIBRATION_PATH =
  'reports/g5-l5-vb012-ts007-behavior-composite-calibration-2026-08-22.md';

const EXPECTED = Object.freeze({
  publicBefore: 1339,
  publicExcess: 410,
  g4CandidateRuntime: 231,
  g4CandidateEvidence: 198,
  g5CandidateEvidence: 6,
  workbenchPublicMirrors: 259,
  productionPublic: 929,
  productionServer: 185,
  productionTotal: 1114,
  productionChecksumSetSha256:
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  candidateRuntimeTotal: 236,
  candidateEvidenceTotal: 204,
});

const G5_OVERWRITTEN_RENDERERS = Object.freeze({
  'course-g05-l05-fq-003': Object.freeze({
    candidateSha256:
      '78da700b7cbf20390cdb4b9b7e2aa36c300bb6a456c21c0909c271eefb0d33aa',
    stableSha256:
      'bd74dd381305a31c145b9adb2f16525af2652d5d8fef2c064cc8dbf17c1b4fc4',
  }),
  'course-g05-l05-ts-007': Object.freeze({
    candidateSha256:
      '6cd340026e8ab4641932a5fad24f8cfded6ecf7e541783e868504add816afc72',
    stableSha256:
      'f1ddbfd76ad9cd35d9114b13f6b6883a5c58c9311c35ed3c270ac666b032dcd5',
  }),
  'course-g05-l05-vb-012': Object.freeze({
    candidateSha256:
      '976d2fa7eedc03d0ef618342b20ef7872b522d2b0815e4824f83c8e94fb71e14',
    stableSha256:
      '783123d115c4eae1f27e6f398efbb6c6f431ef9c9090eb3d62017351f974e16d',
  }),
});

const G5_CURRENTNESS_SUCCESSORS = Object.freeze({
  'course-g05-l05-ts-007': Object.freeze({
    frozenManifestV1Sha256:
      '55d6a098ee6ab3b95c1604dc1cd90863bd85af8d30214ae739fd30893b829bbe',
    frozenManifestV2Sha256:
      '5baeb8e6d79f929c021b1a486891679279ba04332599feed96461581e0e9b7aa',
    currentManifestV3Sha256:
      '326a4f14626ab96938c41d5569077345377f6cef651e64db2473242f4417a973',
    currentRuntimeBytes: 8200675,
    currentRuntimeSha256:
      'de63b11806a7f4ab10a24991fb93c800cacb72c6408e877e059f4a42cbcace4a',
  }),
  'course-g05-l05-vb-012': Object.freeze({
    frozenManifestV1Sha256:
      '7930532d097a3d73c11c52b3df10a97a0073c405e0070330303e5202e1b2e477',
    frozenManifestV2Sha256:
      '728f53a5e5716700986b5cd468ae6792f689e5e9a527f7d8db5cf828135e6d7f',
    currentManifestV3Sha256:
      '659d1443205dc4e52bd10d7536009a6d2bd6e68ebc8bafd9afbc35d99624e7f7',
    currentRuntimeBytes: 3547444,
    currentRuntimeSha256:
      '2045483ae69e9c77d3a5514b8acbfcc76e463ce5660480b0b826f039ea7780d1',
  }),
});

const HISTORICAL_CURRENTNESS_BINDINGS = Object.freeze([
  Object.freeze({
    path: FREEZE_PATH,
    sha256: '4b037684c4a138cb7b980e945771ece8da9dd314728ecf3f19b8973b04e3a401',
  }),
  Object.freeze({
    path: FREEZE_SHA_PATH,
    sha256: '3b464b50c5c480a1799748655aee007da3e024b6718d3bb9b94d319901e1fc3d',
  }),
  Object.freeze({
    path: APPLIED_RECEIPT_PATH,
    sha256: 'aa7d7249d2ee98c277077c394caa8b2ceaa69b9c069de7506a7786d3b1b41ed2',
  }),
  Object.freeze({
    path: EVIDENCE_RELOCATION_RECEIPT_PATH,
    sha256: '562b91bee01f6f0ec04e86b8a83f9fe7e32fb84eeea1aefc38dc7076871161f9',
  }),
  Object.freeze({
    path: G5_BEHAVIOR_CALIBRATION_PATH,
    sha256: 'bedfc967098f394c3e0f2f870e1ebee61d4eb2c39cbeb74731ebff660b4236d2',
  }),
  Object.freeze({
    path: PREVIOUS_CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH,
    sha256: 'c27ca1461f631c5e3c032adaec9a95a5a2f32a50f61800a7a8e2c47b16aec229',
  }),
]);

const CURRENTNESS_GENERATOR_BINDINGS = Object.freeze([
  Object.freeze({
    path: G5_BEHAVIOR_CANVAS_GENERATOR_PATH,
    bytes: 20692,
    sha256: '2a94bf23830507112e166073544a92990c074ca28d9c9b7cc3f2d3075ccff86e',
  }),
  Object.freeze({
    path: SHARED_ADAPTER_GENERATOR_PATH,
    bytes: 115660,
    sha256: 'ed133630977deff8af962cf3fd17d030709b33f164fed62179ef8f8b347fe95e',
  }),
]);

const RELEASE_IDS = Object.freeze({
  g3l2: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
  g4l3: 'lesson-g04-l03-negative-numbers',
  g4l5: 'lesson-g04-l05-multiplication-page-only',
  g4l10: 'lesson-g04-l10-perimeter-area-page-only',
  g4l11: 'lesson-g04-l11-coordinate-grid-page-only',
  g4l9p4: 'private-g4-l9-p4-representative-slice-v1',
  g4l9p5: 'private-g4-l9-p5-f08-occurrence-32-stress-v1',
  g4l9p51: 'private-g4-l9-p5-1-occurrence-29-bounded-v1',
  g5l3: 'lesson-g05-l03-exponents-prime-factorizations-page-only',
  g5l4: 'lesson-g05-l04-number-lines',
  g5l5: 'lesson-g05-l05-add-subtract-negative-numbers',
});

const ALLOWED_RUNTIME_EXTENSIONS = new Set([
  '.js',
  '.mp3',
  '.png',
  '.svg',
  '.ttf',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath),
    `invalid project path: ${relativePath}`,
  );
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `path escapes project: ${relativePath}`,
  );
  return resolved;
}

async function ordinaryBinding(relativePath) {
  const target = absolute(relativePath);
  const metadata = await lstat(target);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`,
  );
  const bytes = await readFile(target);
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function walk(relativeRoot) {
  const result = [];
  async function visit(relativeDirectory) {
    const entries = await readdir(absolute(relativeDirectory), {
      withFileTypes: true,
    });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const child = `${relativeDirectory}/${entry.name}`;
      invariant(!entry.isSymbolicLink(), `${child}: symlinks are forbidden`);
      if (entry.isDirectory()) await visit(child);
      else {
        invariant(entry.isFile(), `${child}: special files are forbidden`);
        result.push(child);
      }
    }
  }
  await visit(relativeRoot);
  return result;
}

function relativeBelow(root, file) {
  const prefix = `${root}/`;
  invariant(file.startsWith(prefix), `${file}: outside ${root}`);
  return file.slice(prefix.length);
}

function isG4Candidate(relative) {
  return [
    'course-g04-l05-',
    'course-g04-l09-',
    'course-g04-l10-',
    'course-g04-l11-',
  ].some((prefix) => relative.startsWith(prefix));
}

function isG5CandidateEvidence(relative) {
  const [animationId, ...tail] = relative.split('/');
  return Object.hasOwn(G5_OVERWRITTEN_RENDERERS, animationId)
    && tail.join('/').endsWith('.json');
}

function releaseIdForRelative(relative, {candidate = false} = {}) {
  if (relative.startsWith('course-g03-l02-')) return RELEASE_IDS.g3l2;
  if (
    relative.startsWith('course-g04-l03-')
    || relative.startsWith('shell-course-g04-l03-')
  ) return RELEASE_IDS.g4l3;
  if (relative.startsWith('course-g04-l05-')) return RELEASE_IDS.g4l5;
  if (relative.startsWith('course-g04-l09-ti-004/')) return RELEASE_IDS.g4l9p51;
  if (relative.startsWith('course-g04-l09-ti-007/')) return RELEASE_IDS.g4l9p5;
  if (relative.startsWith('course-g04-l09-')) return RELEASE_IDS.g4l9p4;
  if (relative.startsWith('course-g04-l10-')) return RELEASE_IDS.g4l10;
  if (relative.startsWith('course-g04-l11-')) return RELEASE_IDS.g4l11;
  if (relative.startsWith('course-g05-l03-')) return RELEASE_IDS.g5l3;
  if (
    relative.startsWith('course-g05-l04-')
    || relative.startsWith('shell-course-g05-l04-')
  ) return RELEASE_IDS.g5l4;
  if (relative.startsWith('course-g05-l05-')) return RELEASE_IDS.g5l5;
  throw new Error(
    `${candidate ? 'candidate' : 'production'} asset has no release: ${relative}`,
  );
}

async function gitBytes(revision, relativePath) {
  const {stdout} = await execFile('git', ['show', `${revision}:${relativePath}`], {
    cwd: ROOT,
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  return Buffer.from(stdout);
}

async function gitText(...args) {
  const {stdout} = await execFile('git', args, {cwd: ROOT, encoding: 'utf8'});
  return stdout.trim();
}

function checksumSet(entries) {
  const rows = entries
    .map(({bytes, relative, sha256: digest}) =>
      `${digest} ${bytes} ${relative}`
    )
    .sort((left, right) => {
      const leftPath = left.slice(left.indexOf(' ', left.indexOf(' ') + 1) + 1);
      const rightPath = right.slice(right.indexOf(' ', right.indexOf(' ') + 1) + 1);
      return leftPath.localeCompare(rightPath);
    });
  return sha256(Buffer.from(rows.join('\n')));
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: 'wx'});
}

async function writeAtomic(relativePath, bytes) {
  const target = absolute(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  await rename(temporary, target);
}

async function verifyBinding(binding) {
  const observed = await ordinaryBinding(binding.path);
  invariant(
    observed.bytes === binding.bytes && observed.sha256 === binding.sha256,
    `${binding.path}: binding drifted`,
  );
}

async function expectedBinding(expected) {
  const observed = await ordinaryBinding(expected.path);
  invariant(
    observed.sha256 === expected.sha256
      && (expected.bytes === undefined || observed.bytes === expected.bytes),
    `${expected.path}: expected binding drifted`,
  );
  return observed;
}

function allAuthorityEffectsRemainClosed(value) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.values(value).length > 0
    && Object.values(value).every((effect) => effect === false);
}

async function currentnessSuccessorEntry(animationId, expected) {
  const frozenManifestV1Path = currentJsCandidateEvidencePath(
    animationId,
    'manifest.json',
    'v1',
  );
  const frozenManifestV2Path = currentJsCandidateEvidencePath(
    animationId,
    'manifest.json',
    'v2',
  );
  const currentManifestV3Path = currentJsCandidateEvidencePath(
    animationId,
    'manifest.json',
    'v3',
  );
  const currentRuntimePath = currentJsCandidateRuntimePath(
    animationId,
    'canvas-renderer.js',
  );
  const [
    frozenManifestV1,
    frozenManifestV2,
    currentManifestV3,
    currentRuntime,
    currentManifestBytes,
  ] = await Promise.all([
    ordinaryBinding(frozenManifestV1Path),
    ordinaryBinding(frozenManifestV2Path),
    ordinaryBinding(currentManifestV3Path),
    ordinaryBinding(currentRuntimePath),
    readFile(absolute(currentManifestV3Path)),
  ]);
  invariant(
    frozenManifestV1.sha256 === expected.frozenManifestV1Sha256,
    `${frozenManifestV1Path}: frozen v1 manifest drifted`,
  );
  invariant(
    frozenManifestV2.sha256 === expected.frozenManifestV2Sha256,
    `${frozenManifestV2Path}: frozen v2 manifest drifted`,
  );
  invariant(
    currentManifestV3.sha256 === expected.currentManifestV3Sha256,
    `${currentManifestV3Path}: current v3 manifest drifted`,
  );
  invariant(
    currentRuntime.bytes === expected.currentRuntimeBytes
      && currentRuntime.sha256 === expected.currentRuntimeSha256,
    `${currentRuntimePath}: current candidate runtime drifted`,
  );

  const manifest = JSON.parse(currentManifestBytes.toString('utf8'));
  invariant(
    manifest?.schemaVersion === 1
      && manifest.animationId === animationId
      && manifest.artifactType ===
        'g5-l5-representative-behavior-aware-canvas-candidate-v1',
    `${currentManifestV3Path}: invalid current manifest identity`,
  );
  invariant(
    manifest.runtime?.bytes === currentRuntime.bytes
      && manifest.runtime?.sha256 === currentRuntime.sha256,
    `${currentManifestV3Path}: runtime binding drifted`,
  );
  invariant(
    manifest.generator?.path === G5_BEHAVIOR_CANVAS_GENERATOR_PATH
      && manifest.generator?.bytes === CURRENTNESS_GENERATOR_BINDINGS[0].bytes
      && manifest.generator?.sha256 === CURRENTNESS_GENERATOR_BINDINGS[0].sha256,
    `${currentManifestV3Path}: behavior generator binding drifted`,
  );
  invariant(
    manifest.sharedAdapterGenerator?.path === SHARED_ADAPTER_GENERATOR_PATH
      && manifest.sharedAdapterGenerator?.bytes ===
        CURRENTNESS_GENERATOR_BINDINGS[1].bytes
      && manifest.sharedAdapterGenerator?.sha256 ===
        CURRENTNESS_GENERATOR_BINDINGS[1].sha256,
    `${currentManifestV3Path}: shared adapter generator binding drifted`,
  );
  invariant(
    manifest.candidateScope?.currentJavaScriptRegistered === true
      && manifest.candidateScope?.modernMyLessonIntegrated === true
      && manifest.candidateScope?.legacyCourseShellExcluded === true
      && manifest.candidateScope?.calibratedPageCount === 1
      && manifest.candidateScope?.otherG5L5PagesStartedByThisTransaction === 0,
    `${currentManifestV3Path}: candidate scope drifted`,
  );
  invariant(
    allAuthorityEffectsRemainClosed(manifest.acceptanceEffects),
    `${currentManifestV3Path}: downstream authority was advanced`,
  );

  return Object.freeze({
    animationId,
    frozenManifestV1,
    frozenManifestV2,
    currentManifestV3,
    currentRuntime,
  });
}

async function verifyGeneratedCurrentnessArtifacts() {
  const {
    PAGE_CONFIGS,
    buildPageArtifacts,
  } = await import('./build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs');
  for (const config of PAGE_CONFIGS) {
    invariant(
      Object.hasOwn(G5_CURRENTNESS_SUCCESSORS, config.animationId),
      `${config.animationId}: page is outside the authorized successor set`,
    );
    let built;
    try {
      built = await buildPageArtifacts(config);
    } catch (error) {
      const missingSourcePrefix = path.join(
        ROOT,
        'source-assets/flash/HELP MATH_ORIGINAL FILES/',
      );
      invariant(
        error?.code === 'ENOENT' &&
        typeof error?.path === 'string' &&
        error.path.startsWith(missingSourcePrefix),
        `${config.animationId}: generated currentness rebuild failed: ${error?.message ?? error}`,
      );
      // This detached worktree intentionally lacks the repo-local private
      // source link. Do not create one or relax any hash: the successor check
      // falls back only to the already frozen v1/v2/v3 manifest, runtime, and
      // generator bindings below. The separate source-bound generator remains
      // fail-closed and reports its inherited ENOENT independently.
      await currentnessSuccessorEntry(
        config.animationId,
        G5_CURRENTNESS_SUCCESSORS[config.animationId],
      );
      continue;
    }
    for (const artifact of built.artifacts) {
      const storagePath = artifact.path === built.paths.manifest
        ? currentJsCandidateEvidencePath(
            config.animationId,
            'manifest.json',
            'v3',
          )
        : artifact.path.startsWith('apps/web/public/flash-assets/courses/')
          ? separatedCurrentJsCandidateStoragePath(artifact.path)
          : artifact.path;
      const observed = await readFile(absolute(storagePath));
      invariant(
        observed.equals(artifact.bytes),
        `${storagePath}: generated successor artifact is stale`,
      );
    }
  }
}

async function buildCandidateCurrentnessSuccessorReceipt(candidateProfileBytes) {
  const [
    historicalArtifacts,
    maintainedGenerators,
    entries,
    p4Freeze,
    p4Generator,
    p5Freeze,
    p5Generator,
    p51Freeze,
    p51Generator,
  ] = await Promise.all([
    Promise.all(HISTORICAL_CURRENTNESS_BINDINGS.map(expectedBinding)),
    Promise.all(CURRENTNESS_GENERATOR_BINDINGS.map(expectedBinding)),
    Promise.all(Object.entries(G5_CURRENTNESS_SUCCESSORS)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([animationId, expected]) =>
        currentnessSuccessorEntry(animationId, expected)
      )),
    ordinaryBinding(G4_L9_P4_FREEZE_PATH),
    ordinaryBinding(G4_L9_P4_GENERATOR_PATH),
    ordinaryBinding(G4_L9_P5_FREEZE_PATH),
    ordinaryBinding(G4_L9_P5_GENERATOR_PATH),
    ordinaryBinding(G4_L9_P5_1_FREEZE_PATH),
    ordinaryBinding(G4_L9_P5_1_GENERATOR_PATH),
  ]);
  const candidateProfile = JSON.parse(candidateProfileBytes.toString('utf8'));
  const p4Entries = candidateProfile.entries.filter(
    (entry) => entry.releaseId === RELEASE_IDS.g4l9p4,
  );
  invariant(p4Entries.length === 23, 'G4 L9 P4 candidate asset closure must contain 23 files');
  const p5Entries = candidateProfile.entries.filter(
    (entry) => entry.releaseId === RELEASE_IDS.g4l9p5,
  );
  invariant(p5Entries.length === 2, 'G4 L9 P5 occurrence-32 candidate asset closure must contain 2 files');
  invariant(
    p5Entries.map(({relativePath}) => relativePath).join('\n') === [
      'course-g04-l09-ti-007/audio/source-narration-undetermined.mp3',
      'course-g04-l09-ti-007/canvas-renderer.js',
    ].join('\n'),
    'G4 L9 P5 occurrence-32 candidate asset paths drifted',
  );
  const p51Entries = candidateProfile.entries.filter(
    (entry) => entry.releaseId === RELEASE_IDS.g4l9p51,
  );
  invariant(p51Entries.length === 2,
    'G4 L9 P5.1 occurrence-29 candidate asset closure must contain 2 files');
  invariant(
    p51Entries.map(({relativePath}) => relativePath).join('\n') === [
      'course-g04-l09-ti-004/audio/source-narration-undetermined.mp3',
      'course-g04-l09-ti-004/canvas-renderer.js',
    ].join('\n'),
    'G4 L9 P5.1 occurrence-29 candidate asset paths drifted',
  );
  return Object.freeze({
    schemaVersion: 1,
    artifactType:
      'current-js-candidate-assets-currentness-successor-receipt-v4',
    appliedAt: '2026-08-24',
    reason:
      'Preserve the V3 currentness chain while binding only the exact G4 L9 P5.1 bounded occurrence-29 runtime assets; P4, P5 occurrence 32, and regenerated G5 L5 candidates remain frozen.',
    historicalArtifactsRemainFrozen: true,
    currentnessAuthority: Object.freeze({
      scope: 'candidate-runtime-and-generator-bindings-only',
      successorReceipt: CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH,
      legacyCourseShellsIncluded: false,
      newPageOccurrences: 1,
      privateSourceArchiveReadOrModified: false,
    }),
    historicalArtifacts,
    maintainedGenerators,
    p4RepresentativeSlice: Object.freeze({
      calibrationId: 'g4-l9-p4-representative-slice-14-v1',
      freeze: p4Freeze,
      generator: p4Generator,
      candidateRuntimeEntries: Object.freeze(p4Entries),
      candidateRuntimeFileCount: p4Entries.length,
      registeredPageCount: 14,
      descriptorPageCount: 43,
      unavailablePageCount: 29,
      courseShellCount: 0,
      legacyNetworkPolicy: 'deny-by-default',
      networkCalls: 0,
      wholeLessonScaleOut: false,
      familyF08ScaleOut: false,
    }),
    p5Occurrence32: Object.freeze({
      calibrationId: 'g4-l9-p5-f08-occurrence-32-stress-v1',
      releaseId: RELEASE_IDS.g4l9p5,
      placementId: 'g04-l09-placement-032',
      animationId: 'course-g04-l09-ti-007',
      sourceOccurrence: 32,
      freeze: p5Freeze,
      generator: p5Generator,
      candidateRuntimeEntries: Object.freeze(p5Entries),
      candidateRuntimeFileCount: p5Entries.length,
      sourceAudioDurationMs: 21648,
      registeredPageCountAfterP5: 15,
      descriptorPageCount: 43,
      unavailablePageCountAfterP5: 28,
      courseShellCount: 0,
      legacyNetworkPolicy: 'deny-by-default',
      networkCalls: 0,
      exactEquivalenceAdmission: false,
      wholeLessonScaleOut: false,
      familyF08ScaleOut: false,
    }),
    p51Occurrence29: Object.freeze({
      calibrationId: 'g4-l9-p5-1-occurrence-29-bounded-v1',
      releaseId: RELEASE_IDS.g4l9p51,
      placementId: 'g04-l09-placement-029',
      animationId: 'course-g04-l09-ti-004',
      sourceOccurrence: 29,
      freeze: p51Freeze,
      generator: p51Generator,
      candidateRuntimeEntries: Object.freeze(p51Entries),
      candidateRuntimeFileCount: p51Entries.length,
      sourceAudioDurationMs: 9696,
      registeredPageCountAfterP51: 16,
      descriptorPageCount: 43,
      unavailablePageCountAfterP51: 27,
      courseShellCount: 0,
      legacyNetworkPolicy: 'deny-by-default',
      networkCalls: 0,
      exactEquivalenceAdmission: false,
      wholeLessonScaleOut: false,
      familyF08ScaleOut: false,
    }),
    candidateProfile: Object.freeze({
      path: CANDIDATE_PROFILE_PATH,
      bytes: candidateProfileBytes.length,
      sha256: sha256(candidateProfileBytes),
    }),
    entries,
    authorityEffects: Object.freeze({
      originalRuntimeAccepted: false,
      technicalFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      productionVerified: false,
      published: false,
    }),
    result: Object.freeze({
      currentnessEntryCount: entries.length,
      currentManifestVersion: 'v3',
      frozenManifestVersions: Object.freeze(['v1', 'v2']),
      registeredCurrentJavaScriptChanged: true,
      productionReleaseExpanded: false,
      pagesAdded: 1,
    }),
  });
}

async function verifyCandidateCurrentnessSuccessorReceipt(
  receipt,
  candidateProfileBytes,
) {
  await verifyGeneratedCurrentnessArtifacts();
  const expected = await buildCandidateCurrentnessSuccessorReceipt(
    candidateProfileBytes,
  );
  invariant(
    jsonBytes(receipt).equals(jsonBytes(expected)),
    `${CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH}: receipt drifted`,
  );
  invariant(
    allAuthorityEffectsRemainClosed(receipt.authorityEffects),
    `${CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH}: authority advanced`,
  );
  await verifyBinding(receipt.candidateProfile);
  return receipt;
}

async function readVerifiedCandidateCurrentnessSuccessorReceipt(
  candidateProfileBytes,
) {
  const bytes = await readFile(
    absolute(CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH),
  );
  return verifyCandidateCurrentnessSuccessorReceipt(
    JSON.parse(bytes.toString('utf8')),
    candidateProfileBytes,
  );
}

async function buildSnapshot() {
  const [publicFiles, serverFiles, workbenchFiles, head] = await Promise.all([
    walk(PUBLIC_ROOT),
    walk(SERVER_ROOT),
    walk(WORKBENCH_PUBLIC_ROOT),
    gitText('rev-parse', 'HEAD'),
  ]);
  invariant(
    publicFiles.length === EXPECTED.publicBefore,
    `expected ${EXPECTED.publicBefore} public files, observed ${publicFiles.length}`,
  );
  invariant(
    serverFiles.length === EXPECTED.productionServer,
    `expected ${EXPECTED.productionServer} server files, observed ${serverFiles.length}`,
  );

  const excessPaths = publicFiles.filter((file) => {
    const relative = relativeBelow(PUBLIC_ROOT, file);
    return isG4Candidate(relative) || isG5CandidateEvidence(relative);
  });
  invariant(
    excessPaths.length === EXPECTED.publicExcess,
    `expected ${EXPECTED.publicExcess} excess files, observed ${excessPaths.length}`,
  );
  const publicExcess = [];
  for (const sourcePath of excessPaths) {
    const relative = relativeBelow(PUBLIC_ROOT, sourcePath);
    const source = await ordinaryBinding(sourcePath);
    const destination = separatedCurrentJsCandidateStoragePath(sourcePath);
    publicExcess.push(Object.freeze({
      classification: relative.endsWith('.json')
        ? 'candidate-evidence'
        : 'candidate-runtime',
      releaseId: releaseIdForRelative(relative, {candidate: true}),
      source,
      destination,
    }));
  }
  const g4RuntimeCount = publicExcess.filter(({classification, source}) =>
    classification === 'candidate-runtime'
      && isG4Candidate(relativeBelow(PUBLIC_ROOT, source.path))
  ).length;
  const g4EvidenceCount = publicExcess.filter(({classification, source}) =>
    classification === 'candidate-evidence'
      && isG4Candidate(relativeBelow(PUBLIC_ROOT, source.path))
  ).length;
  const g5EvidenceCount = publicExcess.filter(({source}) =>
    isG5CandidateEvidence(relativeBelow(PUBLIC_ROOT, source.path))
  ).length;
  invariant(g4RuntimeCount === EXPECTED.g4CandidateRuntime,
    `G4 runtime count is ${g4RuntimeCount}`);
  invariant(g4EvidenceCount === EXPECTED.g4CandidateEvidence,
    `G4 evidence count is ${g4EvidenceCount}`);
  invariant(g5EvidenceCount === EXPECTED.g5CandidateEvidence,
    `G5 evidence count is ${g5EvidenceCount}`);

  const overwrittenRenderers = [];
  for (const [animationId, expected] of Object.entries(
    G5_OVERWRITTEN_RENDERERS,
  )) {
    const sourcePath = `${PUBLIC_ROOT}/${animationId}/canvas-renderer.js`;
    const candidate = await ordinaryBinding(sourcePath);
    invariant(candidate.sha256 === expected.candidateSha256,
      `${animationId}: candidate renderer changed`);
    const stableBytes = await gitBytes('HEAD', sourcePath);
    const stableProduction = Object.freeze({
      gitRevision: head,
      path: sourcePath,
      bytes: stableBytes.length,
      sha256: sha256(stableBytes),
    });
    invariant(stableProduction.sha256 === expected.stableSha256,
      `${animationId}: HEAD renderer is not the approved production byte set`);
    overwrittenRenderers.push(Object.freeze({
      animationId,
      candidate,
      candidateDestination: currentJsCandidateRuntimePath(
        animationId,
        'canvas-renderer.js',
      ),
      stableProduction,
    }));
  }

  const mirrorPaths = workbenchFiles.filter((file) => {
    const relative = relativeBelow(WORKBENCH_PUBLIC_ROOT, file);
    return relative.startsWith('course-g04-l10-')
      || relative.startsWith('course-g04-l11-');
  });
  invariant(
    mirrorPaths.length === EXPECTED.workbenchPublicMirrors,
    `expected ${EXPECTED.workbenchPublicMirrors} workbench mirrors, observed ${mirrorPaths.length}`,
  );
  const publicExcessByRelative = new Map(publicExcess.map((row) => [
    relativeBelow(PUBLIC_ROOT, row.source.path),
    row,
  ]));
  const workbenchPublicMirrors = [];
  for (const mirrorPath of mirrorPaths) {
    const relative = relativeBelow(WORKBENCH_PUBLIC_ROOT, mirrorPath);
    const mirror = await ordinaryBinding(mirrorPath);
    const canonical = publicExcessByRelative.get(relative);
    invariant(canonical, `${relative}: mirror has no app-public counterpart`);
    invariant(
      mirror.bytes === canonical.source.bytes
        && mirror.sha256 === canonical.source.sha256,
      `${relative}: workbench mirror differs from app-public bytes`,
    );
    workbenchPublicMirrors.push(Object.freeze({
      source: mirror,
      identicalTo: canonical.source.path,
      destination: canonical.destination,
    }));
  }

  const excessSet = new Set(excessPaths);
  const stableByPath = new Map(overwrittenRenderers.map((row) => [
    row.stableProduction.path,
    row.stableProduction,
  ]));
  const productionEntries = [];
  for (const file of publicFiles) {
    if (excessSet.has(file)) continue;
    const relative = relativeBelow(PUBLIC_ROOT, file);
    const stable = stableByPath.get(file);
    productionEntries.push(stable
      ? {relative, bytes: stable.bytes, sha256: stable.sha256}
      : {...await ordinaryBinding(file), relative});
  }
  for (const file of serverFiles) {
    productionEntries.push({
      ...await ordinaryBinding(file),
      relative: relativeBelow(SERVER_ROOT, file),
    });
  }
  const simulatedPublicCount = publicFiles.length - excessPaths.length;
  const simulatedChecksum = checksumSet(productionEntries);
  invariant(simulatedPublicCount === EXPECTED.productionPublic,
    `simulated public count is ${simulatedPublicCount}`);
  invariant(productionEntries.length === EXPECTED.productionTotal,
    `simulated production total is ${productionEntries.length}`);
  invariant(simulatedChecksum === EXPECTED.productionChecksumSetSha256,
    `simulated production checksum is ${simulatedChecksum}`);

  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'current-js-production-asset-separation-freeze',
    frozenAt: '2026-08-22',
    gitHead: head,
    reason:
      'Separate unapproved page-only candidate runtime/evidence bytes from the exact five-lesson production deployment closure without losing candidate work.',
    authority: Object.freeze({
      productionReleaseExpanded: false,
      candidateRuntimeAccepted: false,
      candidateEvidenceAccepted: false,
      strictMigrationComplete: false,
      published: false,
    }),
    before: Object.freeze({
      publicFileCount: publicFiles.length,
      serverFileCount: serverFiles.length,
      publicExcessFileCount: publicExcess.length,
    }),
    publicExcess,
    overwrittenProductionRenderers: overwrittenRenderers,
    workbenchPublicMirrors,
    expectedAfter: Object.freeze({
      publicFileCount: EXPECTED.productionPublic,
      serverFileCount: EXPECTED.productionServer,
      deploymentFileCount: EXPECTED.productionTotal,
      deploymentChecksumSetSha256: EXPECTED.productionChecksumSetSha256,
      candidateRuntimeFileCount: EXPECTED.candidateRuntimeTotal,
      candidateEvidenceFileCount: EXPECTED.candidateEvidenceTotal,
      manifestOrSpecFilesInPublic: 0,
    }),
  });
}

async function snapshot() {
  const artifact = await buildSnapshot();
  const bytes = jsonBytes(artifact);
  await writeExclusive(FREEZE_PATH, bytes);
  await writeExclusive(
    FREEZE_SHA_PATH,
    Buffer.from(`${sha256(bytes)}  ${path.basename(FREEZE_PATH)}\n`),
  );
  return {
    operation: 'snapshot',
    path: FREEZE_PATH,
    bytes: bytes.length,
    sha256: sha256(bytes),
    publicExcess: artifact.publicExcess.length,
    overwrittenProductionRenderers:
      artifact.overwrittenProductionRenderers.length,
  };
}

async function readVerifiedFreeze() {
  const [bytes, sidecar] = await Promise.all([
    readFile(absolute(FREEZE_PATH)),
    readFile(absolute(FREEZE_SHA_PATH), 'utf8'),
  ]);
  const expected = sidecar.trim().split(/\s+/u)[0];
  invariant(sha256(bytes) === expected, `${FREEZE_PATH}: sidecar mismatch`);
  return JSON.parse(bytes.toString('utf8'));
}

function relocatedFrozenEvidencePath(row) {
  const relative = relativeBelow(PUBLIC_ROOT, row.source.path);
  const [animationId, ...suffix] = relative.split('/');
  invariant(suffix.length > 0, `${row.source.path}: missing evidence suffix`);
  return currentJsCandidateEvidencePath(animationId, suffix.join('/'));
}

async function verifyEvidenceRelocationReceipt(receipt) {
  invariant(
    receipt?.schemaVersion === 1
      && receipt.artifactType ===
        'current-js-candidate-evidence-relocation-applied-receipt',
    `${EVIDENCE_RELOCATION_RECEIPT_PATH}: invalid receipt`,
  );
  invariant(
    receipt.result?.relocatedFrozenEvidenceFiles ===
      EXPECTED.candidateEvidenceTotal
      && receipt.result?.relocatedRegeneratedEvidenceFiles === 3
      && receipt.entries?.length === EXPECTED.candidateEvidenceTotal + 3,
    `${EVIDENCE_RELOCATION_RECEIPT_PATH}: incomplete scope`,
  );
  for (const entry of receipt.entries) {
    const binding = await ordinaryBinding(entry.destination);
    invariant(
      binding.bytes === entry.bytes && binding.sha256 === entry.sha256,
      `${entry.destination}: relocated evidence drifted`,
    );
  }
  return receipt;
}

async function readVerifiedEvidenceRelocationReceipt() {
  const bytes = await readFile(absolute(EVIDENCE_RELOCATION_RECEIPT_PATH));
  return verifyEvidenceRelocationReceipt(JSON.parse(bytes.toString('utf8')));
}

async function moveBoundFile(source, destination) {
  const sourceExists = await lstat(absolute(source.path)).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  const destinationExists = await lstat(absolute(destination)).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (!sourceExists) {
    invariant(destinationExists, `${source.path}: source and destination absent`);
    const observed = await ordinaryBinding(destination);
    invariant(
      observed.bytes === source.bytes && observed.sha256 === source.sha256,
      `${destination}: resumed destination drifted`,
    );
    return 'already-moved';
  }
  invariant(!destinationExists, `${destination}: destination already exists`);
  await verifyBinding(source);
  await mkdir(path.dirname(absolute(destination)), {recursive: true});
  await rename(absolute(source.path), absolute(destination));
  const observed = await ordinaryBinding(destination);
  invariant(
    observed.bytes === source.bytes && observed.sha256 === source.sha256,
    `${destination}: moved bytes drifted`,
  );
  return 'moved';
}

async function pruneEmptyParents(relativeFile, stopDirectory) {
  let current = path.posix.dirname(relativeFile);
  while (current.startsWith(`${stopDirectory}/`)) {
    try {
      await rmdir(absolute(current));
    } catch (error) {
      if (['ENOTEMPTY', 'ENOENT'].includes(error?.code)) return;
      throw error;
    }
    current = path.posix.dirname(current);
  }
}

async function applySeparation() {
  const freeze = await readVerifiedFreeze();
  invariant(
    freeze.publicExcess?.length === EXPECTED.publicExcess
      && freeze.overwrittenProductionRenderers?.length === 3
      && freeze.workbenchPublicMirrors?.length ===
        EXPECTED.workbenchPublicMirrors,
    'freeze scope is incomplete',
  );

  const moved = {candidateRuntime: 0, candidateEvidence: 0};
  for (const row of freeze.publicExcess) {
    await moveBoundFile(row.source, row.destination);
    if (row.classification === 'candidate-runtime') moved.candidateRuntime += 1;
    else moved.candidateEvidence += 1;
    await pruneEmptyParents(row.source.path, PUBLIC_ROOT);
  }

  for (const row of freeze.overwrittenProductionRenderers) {
    const [currentPublic, currentCandidate] = await Promise.all([
      ordinaryBinding(row.stableProduction.path),
      ordinaryBinding(row.candidateDestination).catch((error) => {
        if (error?.code === 'ENOENT') return null;
        throw error;
      }),
    ]);
    if (currentCandidate) {
      invariant(
        currentCandidate.bytes === row.candidate.bytes
          && currentCandidate.sha256 === row.candidate.sha256,
        `${row.animationId}: resumed candidate renderer drifted`,
      );
      invariant(
        currentPublic.bytes === row.stableProduction.bytes
          && currentPublic.sha256 === row.stableProduction.sha256,
        `${row.animationId}: public renderer is neither the frozen candidate nor stable production`,
      );
      continue;
    }
    await moveBoundFile(row.candidate, row.candidateDestination);
    const stableBytes = await gitBytes(
      row.stableProduction.gitRevision,
      row.stableProduction.path,
    );
    invariant(
      stableBytes.length === row.stableProduction.bytes
        && sha256(stableBytes) === row.stableProduction.sha256,
      `${row.animationId}: frozen Git production bytes drifted`,
    );
    await writeAtomic(row.stableProduction.path, stableBytes);
    await verifyBinding(row.stableProduction);
  }

  let removedMirrors = 0;
  for (const row of freeze.workbenchPublicMirrors) {
    const sourceEntry = await lstat(absolute(row.source.path)).catch((error) => {
      if (error?.code === 'ENOENT') return null;
      throw error;
    });
    if (!sourceEntry) continue;
    await verifyBinding(row.source);
    const destination = await ordinaryBinding(row.destination);
    invariant(
      destination.bytes === row.source.bytes
        && destination.sha256 === row.source.sha256,
      `${row.source.path}: canonical candidate destination differs`,
    );
    await unlink(absolute(row.source.path));
    removedMirrors += 1;
    await pruneEmptyParents(row.source.path, WORKBENCH_PUBLIC_ROOT);
  }

  const receipt = Object.freeze({
    schemaVersion: 1,
    artifactType: 'current-js-production-asset-separation-applied-receipt',
    appliedAt: '2026-08-22',
    freeze: await ordinaryBinding(FREEZE_PATH),
    result: Object.freeze({
      movedCandidateRuntimeFiles: moved.candidateRuntime + 3,
      movedCandidateEvidenceFiles: moved.candidateEvidence,
      restoredStableProductionRenderers: 3,
      removedIdenticalWorkbenchPublicMirrors: removedMirrors,
      productionReleaseExpanded: false,
      deployed: false,
    }),
  });
  const receiptBytes = jsonBytes(receipt);
  const existing = await readFile(absolute(APPLIED_RECEIPT_PATH)).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (existing) invariant(existing.equals(receiptBytes),
    `${APPLIED_RECEIPT_PATH}: existing receipt differs`);
  else await writeExclusive(APPLIED_RECEIPT_PATH, receiptBytes);
  return receipt.result;
}

async function relocateEvidence() {
  const existing = await readFile(
    absolute(EVIDENCE_RELOCATION_RECEIPT_PATH),
  ).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (existing) {
    const receipt = await verifyEvidenceRelocationReceipt(
      JSON.parse(existing.toString('utf8')),
    );
    return receipt.result;
  }

  const freeze = await readVerifiedFreeze();
  const frozenRows = freeze.publicExcess.filter((row) =>
    row.classification === 'candidate-evidence'
  );
  invariant(
    frozenRows.length === EXPECTED.candidateEvidenceTotal,
    `candidate evidence count is ${frozenRows.length}`,
  );

  const entries = [];
  for (const row of frozenRows) {
    const destination = relocatedFrozenEvidencePath(row);
    const source = Object.freeze({
      path: row.destination,
      bytes: row.source.bytes,
      sha256: row.source.sha256,
    });
    await moveBoundFile(source, destination);
    await pruneEmptyParents(source.path, 'migrations');
    entries.push(Object.freeze({
      evidenceVersion: 'v1',
      originalFrozenDestination: source.path,
      destination,
      bytes: source.bytes,
      sha256: source.sha256,
    }));
  }

  for (const animationId of Object.keys(G5_OVERWRITTEN_RENDERERS).sort()) {
    const sourcePath = `migrations/${animationId}/audit/` +
      'product-candidate-assets-v2/manifest.json';
    const source = await ordinaryBinding(sourcePath);
    const destination = currentJsCandidateEvidencePath(
      animationId,
      'manifest.json',
      'v2',
    );
    await moveBoundFile(source, destination);
    await pruneEmptyParents(source.path, 'migrations');
    entries.push(Object.freeze({
      evidenceVersion: 'v2',
      originalFrozenDestination: source.path,
      destination,
      bytes: source.bytes,
      sha256: source.sha256,
    }));
  }

  entries.sort((left, right) => left.destination.localeCompare(right.destination));
  const receipt = Object.freeze({
    schemaVersion: 1,
    artifactType:
      'current-js-candidate-evidence-relocation-applied-receipt',
    appliedAt: '2026-08-22',
    reason:
      'Keep candidate manifests and specifications outside both deployable public assets and migration-directory completion accounting.',
    freeze: await ordinaryBinding(FREEZE_PATH),
    evidenceRoot: CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
    entries,
    result: Object.freeze({
      relocatedFrozenEvidenceFiles: frozenRows.length,
      relocatedRegeneratedEvidenceFiles: 3,
      productionReleaseExpanded: false,
      deployed: false,
    }),
  });
  await writeExclusive(EVIDENCE_RELOCATION_RECEIPT_PATH, jsonBytes(receipt));
  await verifyEvidenceRelocationReceipt(receipt);
  return receipt.result;
}

async function profileEntry(file, root, storageRoot) {
  const relative = relativeBelow(root, file);
  const binding = await ordinaryBinding(file);
  return Object.freeze({
    assetPath: `courses/${relative}`,
    relativePath: relative,
    storageRoot,
    releaseId: releaseIdForRelative(relative, {
      candidate: storageRoot === 'candidate',
    }),
    bytes: binding.bytes,
    sha256: binding.sha256,
  });
}

async function buildProductionProfile() {
  const [publicFiles, serverFiles] = await Promise.all([
    walk(PUBLIC_ROOT),
    walk(SERVER_ROOT),
  ]);
  invariant(publicFiles.length === EXPECTED.productionPublic,
    `production public count is ${publicFiles.length}`);
  invariant(serverFiles.length === EXPECTED.productionServer,
    `production server count is ${serverFiles.length}`);
  invariant(
    publicFiles.every((file) => ALLOWED_RUNTIME_EXTENSIONS.has(path.extname(file))),
    'production public contains a non-runtime extension',
  );

  const productionEntries = [
    ...await Promise.all(publicFiles.map((file) =>
      profileEntry(file, PUBLIC_ROOT, 'public')
    )),
    ...await Promise.all(serverFiles.map((file) =>
      profileEntry(file, SERVER_ROOT, 'server-audio')
    )),
  ].sort((left, right) => left.assetPath.localeCompare(right.assetPath));
  const productionChecksum = checksumSet(productionEntries.map((entry) => ({
    relative: entry.relativePath,
    bytes: entry.bytes,
    sha256: entry.sha256,
  })));
  invariant(productionEntries.length === EXPECTED.productionTotal,
    `production total is ${productionEntries.length}`);
  invariant(productionChecksum === EXPECTED.productionChecksumSetSha256,
    `production checksum is ${productionChecksum}`);

  return Object.freeze({
    schemaVersion: 1,
    profileId: 'current-js-production-assets-v1',
    generatedBy: 'scripts/manage-current-js-asset-profiles.mjs',
    approvalScope: 'five-lesson-current-js-production-closure',
    approvedReleaseIds: Object.freeze([
      RELEASE_IDS.g3l2,
      RELEASE_IDS.g4l3,
      RELEASE_IDS.g5l3,
      RELEASE_IDS.g5l4,
      RELEASE_IDS.g5l5,
    ]),
    counts: Object.freeze({
      public: publicFiles.length,
      serverAudio: serverFiles.length,
      total: productionEntries.length,
    }),
    checksumSetSha256: productionChecksum,
    entries: productionEntries,
  });
}

async function buildProfiles() {
  const [production, candidateFiles, freeze, evidenceRelocation] =
    await Promise.all([
      buildProductionProfile(),
      walk(`${CURRENT_JS_CANDIDATE_FLASH_ROOT}/courses`),
      readVerifiedFreeze(),
      readVerifiedEvidenceRelocationReceipt(),
    ]);
  invariant(candidateFiles.length === EXPECTED.candidateRuntimeTotal,
    `candidate runtime count is ${candidateFiles.length}`);
  invariant(
    candidateFiles.every((file) =>
      ALLOWED_RUNTIME_EXTENSIONS.has(path.extname(file))
    ),
    'candidate runtime root contains evidence or an unsupported extension',
  );

  const candidateEntries = (await Promise.all(candidateFiles.map((file) =>
    profileEntry(
      file,
      `${CURRENT_JS_CANDIDATE_FLASH_ROOT}/courses`,
      'candidate',
    )
  ))).sort((left, right) => left.assetPath.localeCompare(right.assetPath));
  const evidenceRows = freeze.publicExcess.filter((row) =>
    row.classification === 'candidate-evidence'
  );
  invariant(evidenceRows.length === EXPECTED.candidateEvidenceTotal,
    `candidate evidence count is ${evidenceRows.length}`);
  const relocatedByOriginal = new Map(evidenceRelocation.entries
    .filter(({evidenceVersion}) => evidenceVersion === 'v1')
    .map((entry) => [entry.originalFrozenDestination, entry]));
  for (const row of evidenceRows) {
    const relocated = relocatedByOriginal.get(row.destination);
    invariant(relocated, `${row.destination}: missing relocation receipt row`);
    invariant(
      relocated.destination === relocatedFrozenEvidencePath(row),
      `${row.destination}: relocation destination drifted`,
    );
    const binding = await ordinaryBinding(relocated.destination);
    invariant(
      binding.bytes === row.source.bytes && binding.sha256 === row.source.sha256,
      `${relocated.destination}: frozen evidence drifted`,
    );
  }

  const candidate = Object.freeze({
    schemaVersion: 1,
    profileId: 'current-js-candidate-assets-v1',
    version: CURRENT_JS_CANDIDATE_VERSION,
    generatedBy: 'scripts/manage-current-js-asset-profiles.mjs',
    authority: Object.freeze({
      productionApproved: false,
      releaseEligible: false,
      published: false,
    }),
    candidateReleaseIds: Object.freeze([
      RELEASE_IDS.g4l5,
      RELEASE_IDS.g4l9p4,
      RELEASE_IDS.g4l9p5,
      RELEASE_IDS.g4l9p51,
      RELEASE_IDS.g4l10,
      RELEASE_IDS.g4l11,
      RELEASE_IDS.g5l5,
    ]),
    counts: Object.freeze({
      runtime: candidateEntries.length,
      evidence: evidenceRows.length,
    }),
    entries: candidateEntries,
  });
  return {production, candidate};
}

async function checkProductionProfile() {
  const production = await buildProductionProfile();
  const current = await readFile(absolute(PRODUCTION_PROFILE_PATH));
  invariant(
    current.equals(jsonBytes(production)),
    `${PRODUCTION_PROFILE_PATH}: profile is stale`,
  );
  return Object.freeze({
    operation: 'check-production',
    production: production.counts,
    productionChecksumSetSha256: production.checksumSetSha256,
  });
}

async function writeOrCheckProfiles(check) {
  const profiles = await buildProfiles();
  const candidateProfileBytes = jsonBytes(profiles.candidate);
  for (const [relativePath, value] of [
    [PRODUCTION_PROFILE_PATH, profiles.production],
    [CANDIDATE_PROFILE_PATH, profiles.candidate],
  ]) {
    const expectedBytes = jsonBytes(value);
    if (check) {
      const current = await readFile(absolute(relativePath));
      invariant(current.equals(expectedBytes), `${relativePath}: profile is stale`);
    } else {
      await writeAtomic(relativePath, expectedBytes);
    }
  }
  if (check) {
    await readVerifiedCandidateCurrentnessSuccessorReceipt(
      candidateProfileBytes,
    );
  }
  return Object.freeze({
    operation: check ? 'check' : 'write-profiles',
    production: profiles.production.counts,
    productionChecksumSetSha256:
      profiles.production.checksumSetSha256,
    candidate: profiles.candidate.counts,
  });
}

async function applyCandidateCurrentnessSuccessor() {
  const existingReceipt = await lstat(
    absolute(CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH),
  ).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  invariant(
    existingReceipt === null,
    `${CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH}: create-exclusive collision`,
  );

  const profiles = await buildProfiles();
  const productionProfileBytes = jsonBytes(profiles.production);
  const currentProductionProfileBytes = await readFile(
    absolute(PRODUCTION_PROFILE_PATH),
  );
  invariant(
    currentProductionProfileBytes.equals(productionProfileBytes),
    `${PRODUCTION_PROFILE_PATH}: unrelated production profile is stale`,
  );

  const candidateProfileBytes = jsonBytes(profiles.candidate);
  const receipt = await buildCandidateCurrentnessSuccessorReceipt(
    candidateProfileBytes,
  );
  await writeAtomic(CANDIDATE_PROFILE_PATH, candidateProfileBytes);
  await writeExclusive(
    CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH,
    jsonBytes(receipt),
  );
  await verifyCandidateCurrentnessSuccessorReceipt(
    receipt,
    candidateProfileBytes,
  );
  return Object.freeze({
    operation: 'apply-currentness-successor',
    receipt: await ordinaryBinding(
      CANDIDATE_CURRENTNESS_SUCCESSOR_RECEIPT_PATH,
    ),
    candidateProfile: receipt.candidateProfile,
    currentnessEntries: receipt.result.currentnessEntryCount,
    pagesAdded: receipt.result.pagesAdded,
    productionReleaseExpanded: receipt.result.productionReleaseExpanded,
  });
}

function parseArguments(argv) {
  invariant(argv.length === 1, 'usage: manage-current-js-asset-profiles.mjs ' +
    '<--snapshot|--apply-separation|--relocate-evidence|' +
    '--apply-currentness-successor|--write-profiles|--check-production|' +
    '--check>');
  invariant([
    '--snapshot',
    '--apply-separation',
    '--relocate-evidence',
    '--apply-currentness-successor',
    '--write-profiles',
    '--check-production',
    '--check',
  ].includes(argv[0]), `unknown operation: ${argv[0]}`);
  return argv[0];
}

const operation = parseArguments(process.argv.slice(2));
const result = operation === '--snapshot'
  ? await snapshot()
  : operation === '--apply-separation'
    ? await applySeparation()
    : operation === '--relocate-evidence'
      ? await relocateEvidence()
      : operation === '--apply-currentness-successor'
        ? await applyCandidateCurrentnessSuccessor()
        : operation === '--check-production'
          ? await checkProductionProfile()
          : await writeOrCheckProfiles(operation === '--check');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
