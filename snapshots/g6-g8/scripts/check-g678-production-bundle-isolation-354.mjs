#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {lstat, open, readFile, readdir, realpath, unlink} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const REPORT_PATH =
  'reports/g678-current-js-calibration-funnel-354-post-family-20260905.json';
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';

const FINAL_INPUT_PATHS = Object.freeze({
  freeze:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json',
  fragment:
    'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
  privateRegistry: 'packages/demos/private-current-js-registry.json',
  family:
    'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json',
  focusedBrowser:
    'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json',
  aggregateBrowser: 'output/playwright/g678-current-js-354-v1/evidence.json',
  successorCompatibility:
    'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
});

const PRODUCTION_CLOSED_GUARD_PATHS = Object.freeze({
  registryStub: 'apps/web/lib/g678-local-only-registry.production-stub.ts',
  serverBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
  boundaryTest: 'apps/web/tests/g678-production-closed-boundary.test.ts',
  routeGuardTest: 'apps/web/tests/g678-preview-policy.test.ts',
});

export const PRODUCTION_CLOSED_GUARD_SHA256 = Object.freeze({
  registryStub:
    '90dc9c2b50790d2374cbe318bdab62196a0460cf4ce6f3fe96d6cfe206f98682',
  serverBridge:
    '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166',
  boundaryTest:
    '43d08be21cc280681b7b48504a351a4e5b30155e2dc4393bd46cf44c3a4396a8',
  routeGuardTest:
    'f67b13cbd5510259aaf87fcd1332c1537bd04612b5769c9650aa7ccb7648b445',
});

export const FINAL354_PRODUCTION_INPUT_SHA256 = Object.freeze({
  freeze: 'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850',
  fragment: 'b3d161b1f499b0cd13f34e50445dbb2d5e049b5b0a0a2020b0d4721f92701c7b',
  privateRegistry:
    '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239',
  family: 'dffc9d559c4b9ca4bf46d320d951f283a60f6a469985b063e12492801904d3a6',
  focusedBrowser:
    '9be0fc2b2e5ce9e03e1eeb6ede42b6a8f6cc42e22d35eb998dc095b63391d6ec',
  aggregateBrowser:
    '6e8a3beab7433a662d38b263e43749a1ee146a54558b47d698b742521cd7571e',
  successorCompatibility:
    'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8',
});

const FIXED_PATTERNS = Object.freeze([
  'registry.local-only.generated',
  'registry.local-only.metadata.generated',
  'private-current-js-registry.json',
  'g678-16-page-product-calibration-v1.fragment.json',
  'g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
  'g678-current-js-342-page-registration-v1.fragment.json',
  'g678-current-js-342-page-registration-v1.json',
  'g678-current-js-342-page-product-calibrated-registration-v1.fragment.json',
  'g678-current-js-342-page-product-calibrated-registration-v1.json',
  'g678-current-js-354-page-registration-v1.fragment.json',
  'g678-current-js-354-page-registration-v1.json',
  'g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
  'g678-current-js-354-page-product-calibrated-registration-v1.json',
  'g678-alg-l09-game-assessment-family-audit-v1.json',
  'g678-alg-l09-game-assessment-current-js-3-v1.fragment.json',
  'g678-alg-l09-game-assessment-family-calibration-v1.json',
  'g678-alg-l09-game-assessment-current-js-3-v1/members/',
  'g678-alg-l11-residual-routing-audit-v1.json',
  'g678-alg-l11-intro-terminal-tranche1-v1.json',
  'g678-alg-l11-simple-glossary-tranche1-audit-v1.json',
  'g678-alg-l11-intro-terminal-tranche1-current-js-4-v1.fragment.json',
  'g678-alg-l11-simple-glossary-tranche1-current-js-8-v1.fragment.json',
  'g678-alg-l11-tranche1-family-calibration-v1.json',
  'g678-final342-current-bridge-successor-compatibility-v1.json',
  'g678-alg-l11-tranche1-354-v1',
  'g678-current-js-354-v1',
  'private-source-static-glossary-candidate',
  'private-source-static-instruction-glossary-candidate',
  'private-source-static-repeated-vocabulary-glossary-candidate',
  'private-source-static-vocabulary-glossary-candidate',
  'private-source-static-alg-l09-simple-glossary-candidate',
  'private-source-static-alg-l09-terminal-stop-candidate',
  'private-source-static-alg-l09-vb06-drag-candidate',
  'private-source-static-alg-l09-vb02-glossary-candidate',
  'private-source-static-alg-l09-in04-numeric-candidate',
  'private-source-static-alg-l09-in06-choice-candidate',
  'private-source-static-alg-l09-in08-choice-candidate',
  'private-source-static-alg-l09-in10-choice-candidate',
  'private-source-static-alg-l09-ti-choice-candidate',
  'private-source-static-alg-l09-guided-tutorial-candidate',
  'private-source-static-alg-l09-game-assessment-candidate',
  'private-source-static-alg-l11-intro-terminal-candidate',
  'private-source-static-alg-l11-simple-glossary-candidate',
  'alg-l11-intro-terminal-tranche1-source-static',
  'alg-l11-simple-glossary-tranche1-source-static',
  'g678-alg-l09-game-assessment',
]);

// These values are frozen from the exact sorted projection produced below.
// The static test recomputes both from the final354 freeze.
export const FINAL354_FORBIDDEN_PATTERN_COUNT = 2152;
export const FINAL354_FORBIDDEN_PATTERN_SET_SHA256 =
  'bccc3ff3cf59f2ff5840fa88d250a366522f16a21309c4279499f64f0219a8b1';

export const EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS = Object.freeze([
  '/flash-assets/g678-local/',
  '/migration-status/g678-calibration/',
  'g678-16-page-product-calibration-v1',
]);

export const EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION = Object.freeze([
  Object.freeze({fileClass: 'migration-page-client-reference-manifest',
    pattern: '/migration-status/g678-calibration/', category: 'migration'}),
  Object.freeze({fileClass: 'migration-page-server-module',
    pattern: '/migration-status/g678-calibration/', category: 'migration'}),
  Object.freeze({fileClass: 'migration-app-paths-manifest',
    pattern: '/migration-status/g678-calibration/', category: 'migration'}),
  Object.freeze({fileClass: 'migration-server-reference-manifest-js',
    pattern: '/migration-status/g678-calibration/', category: 'migration'}),
  Object.freeze({fileClass: 'migration-server-reference-manifest-json',
    pattern: '/migration-status/g678-calibration/', category: 'migration'}),
  Object.freeze({fileClass: 'asset-route-client-reference-manifest',
    pattern: '/flash-assets/g678-local/', category: 'asset'}),
  Object.freeze({fileClass: 'asset-route-server-module',
    pattern: '/flash-assets/g678-local/', category: 'asset'}),
  Object.freeze({fileClass: 'asset-app-paths-manifest',
    pattern: '/flash-assets/g678-local/', category: 'asset'}),
  Object.freeze({fileClass: 'calibration-id-server-chunk',
    pattern: 'g678-16-page-product-calibration-v1',
    category: 'calibrationId'}),
]);
export const EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERN_SET_SHA256 =
  'b4816b8f0098a8500bb6ba3fe162afa0ed573a336b4c89bc7df2396650cd40e6';
export const EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION_SHA256 =
  '76ae7473e927d74bd510abd5bba61e38e9b176aa7d78674ab6bb15c9b10fd205';

const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const entries = Object.entries(value ?? {});
  return entries.length > 0 && entries.every(([, item]) => item === false);
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function projectPath(relativePath, label) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `${label} must be project-relative`);
  const absolute = path.resolve(PROJECT_ROOT, relativePath);
  invariant(absolute.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label} escapes the project root`);
  return absolute;
}

function sameOrDescendant(candidate, root) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function pathMetadata(absolute) {
  return lstat(absolute, {bigint: true}).then((metadata) => metadata,
    (error) => error?.code === 'ENOENT' ? null : Promise.reject(error));
}

function statIdentity(metadata) {
  return Object.freeze({dev: metadata.dev.toString(),
    ino: metadata.ino.toString(), mode: metadata.mode.toString(),
    nlink: metadata.nlink.toString(), size: metadata.size.toString(),
    mtimeNs: metadata.mtimeNs.toString()});
}

function directoryStatIdentity(metadata) {
  return Object.freeze({dev: metadata.dev.toString(),
    ino: metadata.ino.toString(), mode: metadata.mode.toString(),
    nlink: metadata.nlink.toString()});
}

async function canonicalDirectory(absolute, label) {
  const [canonical, metadata] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && metadata.isDirectory() &&
    !metadata.isSymbolicLink(), `${label} must be one canonical real directory`);
  return Object.freeze({realpath: canonical,
    ...directoryStatIdentity(metadata)});
}

export async function validateOutputCustody({projectRoot = PROJECT_ROOT,
  nextRoot, output, check}) {
  invariant(typeof projectRoot === 'string' && path.isAbsolute(projectRoot) &&
    typeof nextRoot === 'string' && nextRoot !== '' &&
    !path.isAbsolute(nextRoot) && typeof output === 'string' && output !== '' &&
    !path.isAbsolute(output) && typeof check === 'boolean',
  'production output custody inputs drifted');
  const projectIdentity = await canonicalDirectory(projectRoot,
    'project root');
  const lexicalNextRoot = path.resolve(projectRoot, nextRoot);
  const lexicalOutput = path.resolve(projectRoot, output);
  invariant(lexicalNextRoot.startsWith(`${projectRoot}${path.sep}`) &&
    lexicalOutput.startsWith(`${projectRoot}${path.sep}`),
  'production output custody path escapes project root');

  const nextIdentity = await canonicalDirectory(lexicalNextRoot,
    'Next build root');
  invariant(!sameOrDescendant(lexicalOutput, nextIdentity.realpath),
    'production receipt output must be outside the Next build root');

  const lexicalParent = path.dirname(lexicalOutput);
  const parentIdentity = await canonicalDirectory(lexicalParent,
    'production receipt parent');
  const canonicalPlannedOutput = path.join(parentIdentity.realpath,
    path.basename(lexicalOutput));
  invariant(canonicalPlannedOutput === lexicalOutput &&
    !sameOrDescendant(parentIdentity.realpath, nextIdentity.realpath) &&
    !sameOrDescendant(canonicalPlannedOutput, nextIdentity.realpath),
  'production receipt canonical output must be outside the Next build root');

  const outputMetadata = await pathMetadata(lexicalOutput);
  let targetIdentity = null;
  if (check) {
    invariant(outputMetadata?.isFile() &&
      !outputMetadata.isSymbolicLink() && outputMetadata.nlink === 1n,
    'production receipt check target must be one ordinary single-link file');
    const canonicalTarget = await realpath(lexicalOutput);
    invariant(canonicalTarget === lexicalOutput &&
      !sameOrDescendant(canonicalTarget, nextIdentity.realpath),
    'production receipt check target must be canonical and outside Next');
    targetIdentity = Object.freeze({realpath: canonicalTarget,
      ...statIdentity(outputMetadata)});
  } else {
    invariant(outputMetadata === null,
      'production receipt build target must be absent');
  }
  return Object.freeze({projectRoot: projectIdentity,
    nextRoot: nextIdentity, outputParent: parentIdentity,
    output: canonicalPlannedOutput, target: targetIdentity, check});
}

export function assertExactOutputCustody(initial, current) {
  invariant(exact(current, initial),
    'production receipt output custody identity changed');
  return true;
}

async function stableFile(absolute, label, relativeRoot = PROJECT_ROOT) {
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${label} must be one canonical ordinary single-link file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${label} changed during read`);
  return Object.freeze({bytes, mtimeNs: before.mtimeNs,
    identity: Object.freeze({realpath: canonical, ...statIdentity(before)}),
    binding: Object.freeze({
      path: portable(path.relative(relativeRoot, absolute)),
      bytes: bytes.length,
      sha256: sha256(bytes),
  })});
}

export function assertExactStableFile(initial, current, label) {
  invariant(initial.bytes.equals(current.bytes) &&
    exact(initial.identity, current.identity) &&
    exact(initial.binding, current.binding),
  `${label} identity or content changed during production scan`);
  return true;
}

async function walk(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `production bundle contains a symlink: ${absolute}`);
    if (metadata.isDirectory()) await walk(root, absolute, files);
    else if (metadata.isFile()) files.push(absolute);
  }
  return files;
}

export async function readStableBuildId(nextRoot,
  relativeRoot = PROJECT_ROOT) {
  const file = await stableFile(path.join(nextRoot, 'BUILD_ID'),
    'Next BUILD_ID', relativeRoot);
  const value = file.bytes.toString('utf8').trim();
  invariant(value.length > 0, 'Next production BUILD_ID is missing');
  return Object.freeze({file, value,
    receipt: Object.freeze({identity: file.identity,
      binding: file.binding, value})});
}

export function assertExactBuildId(initial, current) {
  invariant(exact(current.receipt, initial.receipt),
    'Next production BUILD_ID changed during bundle scan');
  return true;
}

export async function scanProductionBundle(nextRoot, patterns,
  {relativeRoot = PROJECT_ROOT, hooks = {}, infrastructurePatterns =
    EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS} = {}) {
  invariant(path.isAbsolute(nextRoot) && Array.isArray(patterns) &&
    patterns.length > 0 && Array.isArray(infrastructurePatterns) &&
    infrastructurePatterns.length === 3,
  'production bundle scan inputs drifted');
  const rootPaths = ['server', 'static'].map((name) =>
    path.join(nextRoot, name));
  const rootIdentities = await Promise.all(rootPaths.map((root, index) =>
    canonicalDirectory(root, `Next ${['server', 'static'][index]} root`)));
  await hooks.afterRootIdentity?.();
  const files = (await Promise.all(rootPaths.map((root) => walk(root)))).flat();
  const records = [];
  const matches = [];
  const infrastructureMatches = [];
  let totalBytes = 0;
  for (const file of files) {
    const current = await stableFile(file, `Next production file ${file}`,
      nextRoot);
    totalBytes += current.bytes.length;
    records.push(Object.freeze({path: current.binding.path,
      bytes: current.binding.bytes, sha256: current.binding.sha256,
      identity: current.identity}));
    for (const pattern of patterns) {
      if (current.bytes.includes(Buffer.from(pattern))) {
        matches.push(Object.freeze({file: current.binding.path, pattern}));
      }
    }
    for (const pattern of infrastructurePatterns) {
      if (current.bytes.includes(Buffer.from(pattern))) {
        infrastructureMatches.push(Object.freeze({
          file: current.binding.path, pattern}));
      }
    }
  }
  const endingRootIdentities = await Promise.all(rootPaths.map((root, index) =>
    canonicalDirectory(root, `Next ${['server', 'static'][index]} root`)));
  invariant(exact(endingRootIdentities, rootIdentities),
    'Next server/static root identity changed during bundle scan');
  const checksumRows = records.map((record) =>
    `${record.sha256}  ${record.path}\n`);
  return Object.freeze({rootIdentities: Object.freeze(rootIdentities),
    files: Object.freeze(records), fileCount: records.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(checksumRows.join(''))),
    matches: Object.freeze(matches), matchCount: matches.length,
    infrastructureMatches: Object.freeze(infrastructureMatches),
    infrastructureMatchCount: infrastructureMatches.length});
}

export function assertExactBundleScan(initial, current) {
  invariant(exact(current, initial),
    'Next production bundle identity or content changed between scans');
  return true;
}

function addPattern(patterns, value) {
  if (typeof value === 'string' && value.length > 0) patterns.add(value);
}

export function forbiddenPatterns(freeze) {
  invariant(freeze?.registrationCandidatePlacementCount === 354 &&
    freeze?.selectedPages?.length === 354 &&
    new Set(freeze.selectedPages.map((page) => page.animationId)).size === 354,
  'final354 forbidden-pattern source freeze drifted');
  const patterns = new Set([
    ...FIXED_PATTERNS, ...Object.values(FINAL354_PRODUCTION_INPUT_SHA256),
  ]);
  for (const page of freeze.selectedPages) {
    addPattern(patterns, page.animationId);
    addPattern(patterns, page.placementId);
    addPattern(patterns, page.assetId);
    addPattern(patterns, page.sourceSha256);
    addPattern(patterns, page.adapterFamily);
    addPattern(patterns, page.implementation?.componentExport);
    addPattern(patterns, page.runtime?.canvasRenderer?.path);
    addPattern(patterns, page.runtime?.canvasRenderer?.sha256);
    addPattern(patterns, page.runtime?.canvasRenderer?.url);
    const rendererPath = page.runtime?.canvasRenderer?.path;
    if (typeof rendererPath === 'string') {
      const membersAt = rendererPath.indexOf('/members/');
      if (membersAt >= 0) addPattern(patterns,
        rendererPath.slice(0, membersAt + '/members/'.length));
    }
  }
  return Object.freeze([...patterns].sort());
}

export function forbiddenPatternSetSha256(patterns) {
  invariant(Array.isArray(patterns) && patterns.length > 0 &&
    patterns.every((pattern) => typeof pattern === 'string' && pattern !== '') &&
    exact(patterns, [...new Set(patterns)].sort()),
  'forbidden pattern set must be exact sorted unique strings');
  return sha256(Buffer.from(patterns.map((pattern) => `${pattern}\n`).join('')));
}

function infrastructureFileClass(file, pattern) {
  const migration = '/migration-status/g678-calibration/';
  const asset = '/flash-assets/g678-local/';
  if (pattern === migration && file ===
      'server/app/[locale]/migration-status/g678-calibration/[placementId]/page_client-reference-manifest.js') {
    return 'migration-page-client-reference-manifest';
  }
  if (pattern === migration && file ===
      'server/app/[locale]/migration-status/g678-calibration/[placementId]/page.js') {
    return 'migration-page-server-module';
  }
  if (pattern === migration && file === 'server/app-paths-manifest.json') {
    return 'migration-app-paths-manifest';
  }
  if (pattern === migration && file ===
      'server/server-reference-manifest.js') {
    return 'migration-server-reference-manifest-js';
  }
  if (pattern === migration && file ===
      'server/server-reference-manifest.json') {
    return 'migration-server-reference-manifest-json';
  }
  if (pattern === asset && file ===
      'server/app/flash-assets/g678-local/[animationId]/canvas-renderer.js/route_client-reference-manifest.js') {
    return 'asset-route-client-reference-manifest';
  }
  if (pattern === asset && file ===
      'server/app/flash-assets/g678-local/[animationId]/canvas-renderer.js/route.js') {
    return 'asset-route-server-module';
  }
  if (pattern === asset && file === 'server/app-paths-manifest.json') {
    return 'asset-app-paths-manifest';
  }
  if (pattern === CALIBRATION_ID &&
      /^server\/chunks\/[^/]+\.js$/u.test(file)) {
    return 'calibration-id-server-chunk';
  }
  return null;
}

export function assertExpectedInfrastructureProjection(matches) {
  invariant(Array.isArray(matches),
    'fail-closed infrastructure matches must be an array');
  const order = new Map(EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION.map(
    (row, index) => [row.fileClass, index]));
  const projection = matches.map((match) => {
    invariant(match && typeof match.file === 'string' &&
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS.includes(match.pattern),
    'fail-closed infrastructure match fields drifted');
    const fileClass = infrastructureFileClass(match.file, match.pattern);
    invariant(fileClass && !match.file.startsWith('static/'),
      'fail-closed infrastructure appeared in an unexpected file or static');
    const expected = EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION[
      order.get(fileClass)];
    return Object.freeze({fileClass, pattern: match.pattern,
      category: expected?.category});
  }).sort((left, right) => order.get(left.fileClass) -
    order.get(right.fileClass));
  invariant(exact(projection,
    EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION),
  'fail-closed infrastructure projection missing extra or drifted');
  const distribution = Object.freeze({migration: projection.filter((row) =>
    row.category === 'migration').length,
  asset: projection.filter((row) => row.category === 'asset').length,
  calibrationId: projection.filter((row) =>
    row.category === 'calibrationId').length});
  invariant(exact(distribution,
    {migration: 5, asset: 3, calibrationId: 1}),
  'fail-closed infrastructure distribution drifted');
  return Object.freeze({projection: Object.freeze(projection), distribution,
    staticHitCount: 0});
}

export function assertProductionClosedGuardBindings(guards) {
  invariant(exact(Object.keys(guards),
    Object.keys(PRODUCTION_CLOSED_GUARD_PATHS)),
  'production-closed guard binding set drifted');
  for (const [key, expectedSha256] of Object.entries(
    PRODUCTION_CLOSED_GUARD_SHA256)) {
    invariant(guards[key]?.binding?.path ===
      PRODUCTION_CLOSED_GUARD_PATHS[key] &&
      guards[key]?.binding?.sha256 === expectedSha256,
    `production-closed ${key} binding drifted`);
  }
  const source = Object.fromEntries(Object.entries(guards).map(
    ([key, value]) => [key, value.bytes.toString('utf8')]));
  invariant(/registeredLocalOnlyAnimationKeys\s*=\s*Object\.freeze\(\[\]\)/u
    .test(source.registryStub) &&
    /return emptySnapshot\('production-closed', null\)/u
      .test(source.serverBridge) &&
    /registeredPlacementCount: 0/u.test(source.boundaryTest) &&
    /descriptors: Object\.freeze\(\[\]\)/u.test(source.boundaryTest) &&
    /runtimeAssets: Object\.freeze\(\[\]\)/u.test(source.boundaryTest) &&
    /'production-closed'/u.test(source.boundaryTest) &&
    /registeredLocalOnlyAnimationKeys, \[\]/u.test(source.boundaryTest) &&
    /NODE_ENV: 'production'/u.test(source.routeGuardTest) &&
    /status, 404/u.test(source.routeGuardTest),
  'production-closed registry route client or server projection drifted');
  return true;
}

export function assertFinal354ProductionInputBindings(inputs) {
  for (const [key, expectedSha256] of Object.entries(
    FINAL354_PRODUCTION_INPUT_SHA256)) {
    invariant(inputs[key]?.binding?.path === FINAL_INPUT_PATHS[key] &&
      inputs[key]?.binding?.sha256 === expectedSha256,
    `final354 production ${key} binding drifted`);
  }
  return true;
}

export function assertFreshBuildBoundary(boundInputs, buildIdFile) {
  invariant(Array.isArray(boundInputs) && boundInputs.length >= 9 &&
    boundInputs.every((item) => typeof item?.mtimeNs === 'bigint') &&
    typeof buildIdFile?.mtimeNs === 'bigint',
  'fresh production build boundary inputs drifted');
  const latestBoundInputMtimeNs = boundInputs.reduce((latest, item) =>
    item.mtimeNs > latest ? item.mtimeNs : latest, 0n);
  invariant(buildIdFile.mtimeNs > latestBoundInputMtimeNs,
    'Next production BUILD_ID is not fresh after all final354 inputs');
  return Object.freeze({latestBoundInputMtimeNs:
    latestBoundInputMtimeNs.toString(),
  buildIdMtimeNs: buildIdFile.mtimeNs.toString(),
  freshBuildAfterAllFinalInputs: true});
}

function sameInode(metadata, identity) {
  return metadata.dev.toString() === identity.dev &&
    metadata.ino.toString() === identity.ino;
}

function parentIdentityAfterOwnCreate(initial, current) {
  return current.realpath === initial.realpath &&
    current.dev === initial.dev && current.ino === initial.ino &&
    current.mode === initial.mode &&
    BigInt(current.nlink) === BigInt(initial.nlink) + 1n;
}

async function verifyOpenedReceiptTarget(handle, custody, expectedSize,
  expectedPublishedParent = null) {
  const [descriptorMetadata, targetMetadata, canonicalTarget,
    parentIdentity] = await Promise.all([
    handle.stat({bigint: true}), pathMetadata(custody.output),
    realpath(custody.output),
    canonicalDirectory(custody.outputParent.realpath,
      'production receipt parent'),
  ]);
  const checks = {
    targetFile: targetMetadata?.isFile() === true,
    targetNotSymlink: targetMetadata?.isSymbolicLink() === false,
    targetSingleLink: targetMetadata?.nlink === 1n,
    descriptorFile: descriptorMetadata.isFile(),
    descriptorSingleLink: descriptorMetadata.nlink === 1n,
    sameInode: targetMetadata ? sameInode(targetMetadata,
      statIdentity(descriptorMetadata)) : false,
    targetSize: targetMetadata?.size === BigInt(expectedSize),
    descriptorSize: descriptorMetadata.size === BigInt(expectedSize),
    canonicalTarget: canonicalTarget === custody.output,
    outsideNext: !sameOrDescendant(canonicalTarget,
      custody.nextRoot.realpath),
    parentIdentity: expectedPublishedParent
      ? exact(parentIdentity, expectedPublishedParent)
      : parentIdentityAfterOwnCreate(custody.outputParent, parentIdentity),
  };
  invariant(Object.values(checks).every(Boolean),
    `opened production receipt target custody drifted: ${
      JSON.stringify(checks)}`);
  return Object.freeze({target: Object.freeze({realpath: canonicalTarget,
    ...statIdentity(descriptorMetadata)}), parent: parentIdentity});
}

async function readHandleBytes(handle, size) {
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const result = await handle.read(bytes, offset, size - offset, offset);
    invariant(result.bytesRead > 0,
      'production receipt FileHandle ended before expected bytes');
    offset += result.bytesRead;
  }
  return bytes;
}

async function casCleanupCreatedReceipt(outputPath, createdIdentity,
  receiptBytes) {
  if (!createdIdentity) return false;
  const before = await pathMetadata(outputPath);
  if (!before?.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      !sameInode(before, createdIdentity) ||
      ![0n, BigInt(receiptBytes.length)].includes(before.size)) return false;
  if (before.size === BigInt(receiptBytes.length)) {
    const current = await readFile(outputPath);
    if (!current.equals(receiptBytes)) return false;
  }
  const after = await pathMetadata(outputPath);
  if (!after?.isFile() || after.isSymbolicLink() || after.nlink !== 1n ||
      !sameInode(after, createdIdentity) || after.size !== before.size ||
      after.mtimeNs !== before.mtimeNs) return false;
  await unlink(outputPath);
  return true;
}

export async function publishReceiptNoReplace({projectRoot = PROJECT_ROOT,
  nextRoot, output, receiptBytes, expectedCustody = null, hooks = {}}) {
  invariant(Buffer.isBuffer(receiptBytes) && receiptBytes.length > 0,
    'production receipt publication bytes are required');
  const custody = await validateOutputCustody({projectRoot, nextRoot, output,
    check: false});
  if (expectedCustody) assertExactOutputCustody(expectedCustody, custody);
  await hooks.afterFinalCustody?.(custody);
  const flags = fsConstants.O_CREAT | fsConstants.O_EXCL |
    fsConstants.O_RDWR | fsConstants.O_NOFOLLOW;
  const handle = await open(custody.output, flags, 0o444);
  let createdIdentity = null;
  let publishedParentIdentity = null;
  try {
    await handle.chmod(0o444);
    createdIdentity = Object.freeze({realpath: custody.output,
      ...statIdentity(await handle.stat({bigint: true}))});
    const opened = await verifyOpenedReceiptTarget(handle, custody, 0);
    createdIdentity = opened.target;
    publishedParentIdentity = opened.parent;
    await hooks.afterOpenValidation?.({custody, createdIdentity, handle});
    await verifyOpenedReceiptTarget(handle, custody, 0,
      publishedParentIdentity);
    await handle.writeFile(receiptBytes);
    await handle.sync();
    await hooks.afterWriteBeforeValidation?.({custody, createdIdentity,
      handle});
    const written = await verifyOpenedReceiptTarget(handle, custody,
      receiptBytes.length, publishedParentIdentity);
    invariant(written.target.dev === createdIdentity.dev &&
      written.target.ino === createdIdentity.ino &&
      (await readHandleBytes(handle, receiptBytes.length)).equals(receiptBytes),
    'production receipt FileHandle content or identity drifted');
    await handle.close();
    const current = await stableFile(custody.output, 'published receipt',
      projectRoot);
    invariant(current.bytes.equals(receiptBytes) &&
      current.identity.dev === createdIdentity.dev &&
      current.identity.ino === createdIdentity.ino,
    'published production receipt path drifted');
    const finalCustody = await validateOutputCustody({projectRoot, nextRoot,
      output, check: true});
    invariant(exact(finalCustody.projectRoot, custody.projectRoot) &&
      exact(finalCustody.nextRoot, custody.nextRoot) &&
      exact(finalCustody.outputParent, publishedParentIdentity) &&
      finalCustody.output === custody.output &&
      finalCustody.target?.dev === createdIdentity.dev &&
      finalCustody.target?.ino === createdIdentity.ino,
    'published production receipt final custody drifted');
    return current;
  } catch (error) {
    await handle.close().catch(() => {});
    await casCleanupCreatedReceipt(custody.output, createdIdentity,
      receiptBytes).catch(() => false);
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {nextRoot: 'apps/web/.next', output: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--check') {
      invariant(!options.check, '--check may appear only once');
      options.check = true;
      continue;
    }
    const key = {'--next-root': 'nextRoot', '--output': 'output'}[flag];
    invariant(key && index + 1 < argv.length,
      'usage: check-g678-production-bundle-isolation-354.mjs [--next-root <path>] --output <path> [--check]');
    options[key] = argv[++index];
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  invariant(options.output,
    'final354 production scan requires a no-replace --output receipt');
  const initialCustody = await validateOutputCustody({
    nextRoot: options.nextRoot, output: options.output, check: options.check,
  });

  const inputEntries = await Promise.all(Object.entries(FINAL_INPUT_PATHS).map(
    async ([key, relativePath]) => [key, await stableFile(
      projectPath(relativePath, key), `final354 ${key}`)]));
  const inputs = Object.fromEntries(inputEntries);
  assertFinal354ProductionInputBindings(inputs);
  const reportFile = await stableFile(projectPath(REPORT_PATH, 'report'),
    'final354 calibration report');
  const scanner = await stableFile(SCRIPT_PATH, 'production scanner');
  const guardEntries = await Promise.all(Object.entries(
    PRODUCTION_CLOSED_GUARD_PATHS).map(async ([key, relativePath]) =>
    [key, await stableFile(projectPath(relativePath, key),
      `production-closed ${key}`)]));
  const guards = Object.fromEntries(guardEntries);
  assertProductionClosedGuardBindings(guards);

  const freeze = JSON.parse(inputs.freeze.bytes.toString('utf8'));
  const fragment = JSON.parse(inputs.fragment.bytes.toString('utf8'));
  const registry = JSON.parse(inputs.privateRegistry.bytes.toString('utf8'));
  const family = JSON.parse(inputs.family.bytes.toString('utf8'));
  const focused = JSON.parse(inputs.focusedBrowser.bytes.toString('utf8'));
  const aggregate = JSON.parse(inputs.aggregateBrowser.bytes.toString('utf8'));
  const successor = JSON.parse(inputs.successorCompatibility.bytes.toString(
    'utf8'));
  const report = JSON.parse(reportFile.bytes.toString('utf8'));
  const descriptor = (item) => item.binding;
  const registryCalibration = registry.calibrations?.find((candidate) =>
    candidate.calibrationId === CALIBRATION_ID);
  const ids = freeze.selectedPages?.map((page) => page.animationId) ?? [];

  invariant(freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.frozenCalibrationPlacementCount === 2282 &&
    freeze.registrationCandidatePlacementCount === 354 &&
    ids.length === 354 && new Set(ids).size === 354 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 138 &&
    freeze.productHostCalibration?.familyCalibrationCount === 22 &&
    freeze.productHostCalibration?.wholeLessonEngineeringPreviewCount === 1 &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(freeze.acceptanceEffects),
  'G678 freeze must be the exact fail-closed final354 calibration');
  invariant(fragment.calibration?.entries?.length === 354 &&
    exact(fragment.freeze, descriptor(inputs.freeze)) &&
    fragment.descriptorProjection?.affectedLessonCount === 44 &&
    exact(fragment.descriptorProjection?.exactCompleteLessonKeys,
      ['shared-alg001-l09']) &&
    fragment.descriptorProjection?.algL11RegisteredPageCount === 21 &&
    fragment.registrationBoundary?.releaseOrPublicationAuthorized === false &&
    allFalse(fragment.acceptanceEffects),
  'final354 production fragment drifted');
  invariant(registryCalibration?.freezeManifest ===
      FINAL_INPUT_PATHS.freeze &&
    registryCalibration.freezeManifestSha256 ===
      FINAL354_PRODUCTION_INPUT_SHA256.freeze &&
    registryCalibration.entries?.length === 354 &&
    exact(registryCalibration.entries.map((entry) => entry.key).sort(),
      [...ids].sort()),
  'final354 production registry projection drifted');
  invariant(family.auditedPlacementCount === 12 &&
    family.productHostCalibration?.familyCurrentJsCalibrationPassed === true &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(family.acceptanceEffects) &&
    focused.registeredCurrentJsPages === 354 &&
    focused.allLessons?.linkedCardCount === 0 &&
    exact(focused.allLessons?.completeLessonKeys, ['shared-alg001-l09']) &&
    focused.allLessons?.algL11?.registeredPageCount === 21 &&
    allFalse(focused.acceptanceEffects) &&
    aggregate.registeredCurrentJsPages === 354 &&
    aggregate.samples?.length === 104 && aggregate.screenshots?.length === 111 &&
    aggregate.browserEvidenceComposition?.currentHostLiveRecordCount === 104 &&
    allFalse(aggregate.acceptanceEffects) &&
    successor.final342Compatibility?.descriptorInvariantCount === 342 &&
    successor.exactInverseTransformation?.exactMatch === true &&
    allFalse(successor.acceptanceEffects),
  'final354 browser/family/successor production inputs drifted');
  invariant(report.artifactType === 'help-math-g678-acceptance-matrix' &&
    report.calibration?.registeredCurrentJsPages === 354 &&
    report.calibration?.totalProductHostCalibratedPages === 138 &&
    report.funnel?.activePagePlacements === 2282 &&
    report.funnel?.registeredCurrentJsPages === 354 &&
    report.funnel?.engineeringPreviewLessons === 1 &&
    report.final354Truth?.familyCalibrationCount === 22 &&
    report.final354Truth?.partialLessonCount === 43 &&
    report.final354Truth?.linkedLessonCardCount === 0 &&
    exact(report.final354Truth?.completeLessonKeys,
      ['shared-alg001-l09']) &&
    report.final354Truth?.algL11?.registeredPageCount === 21 &&
    report.final354Truth?.algL11?.activePageCount === 44 &&
    report.final354Truth?.overallG678ProductCalibrationPassed === false &&
    exact(report.source?.final354Freeze, descriptor(inputs.freeze)) &&
    exact(report.source?.final354Fragment, descriptor(inputs.fragment)) &&
    exact(report.source?.privateRegistry,
      descriptor(inputs.privateRegistry)) &&
    exact(report.source?.algL11Tranche1FamilyCalibration,
      descriptor(inputs.family)) &&
    exact(report.source?.focusedBrowserEvidence,
      descriptor(inputs.focusedBrowser)) &&
    exact(report.source?.aggregateBrowserEvidence,
      descriptor(inputs.aggregateBrowser)) &&
    exact(report.source?.final342SuccessorCompatibility,
      descriptor(inputs.successorCompatibility)) &&
    allFalse(report.acceptanceEffects) &&
    allFalse(report.final354Truth?.acceptanceEffects),
  'final354 calibration report production binding drifted');

  const nextRoot = initialCustody.nextRoot.realpath;
  const buildIdInitial = await readStableBuildId(nextRoot);
  const freshness = assertFreshBuildBoundary([
    ...Object.values(inputs), reportFile, scanner, ...Object.values(guards),
  ], buildIdInitial.file);
  const patterns = forbiddenPatterns(freeze);
  const patternSetSha256 = forbiddenPatternSetSha256(patterns);
  invariant(patterns.length === FINAL354_FORBIDDEN_PATTERN_COUNT &&
    patternSetSha256 === FINAL354_FORBIDDEN_PATTERN_SET_SHA256,
  'final354 exact forbidden pattern set drifted');
  const initialScan = await scanProductionBundle(nextRoot, patterns);
  invariant(initialScan.matchCount === 0,
    `production bundle contains G678 local-only material: ${
      JSON.stringify(initialScan.matches)}`);
  const infrastructure = assertExpectedInfrastructureProjection(
    initialScan.infrastructureMatches);
  const infrastructurePatternSetSha256 = forbiddenPatternSetSha256(
    EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS);
  const infrastructureProjectionSha256 = sha256(Buffer.from(
    `${JSON.stringify(infrastructure.projection)}\n`));
  invariant(infrastructurePatternSetSha256 ===
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERN_SET_SHA256 &&
    infrastructureProjectionSha256 ===
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION_SHA256,
  'fail-closed infrastructure set or projection hash drifted');
  const finalScan = await scanProductionBundle(nextRoot, patterns);
  assertExactBundleScan(initialScan, finalScan);
  const buildIdFinal = await readStableBuildId(nextRoot);
  assertExactBuildId(buildIdInitial, buildIdFinal);
  const endingInputEntries = await Promise.all(
    Object.entries(FINAL_INPUT_PATHS).map(async ([key, relativePath]) =>
      [key, await stableFile(projectPath(relativePath, key),
        `ending final354 ${key}`)]));
  for (const [key, ending] of endingInputEntries) {
    assertExactStableFile(inputs[key], ending, `final354 ${key}`);
  }
  const [endingReport, endingScanner] = await Promise.all([
    stableFile(projectPath(REPORT_PATH, 'report'),
      'ending final354 calibration report'),
    stableFile(SCRIPT_PATH, 'ending production scanner'),
  ]);
  assertExactStableFile(reportFile, endingReport,
    'final354 calibration report');
  assertExactStableFile(scanner, endingScanner, 'production scanner');
  const endingGuardEntries = await Promise.all(Object.entries(
    PRODUCTION_CLOSED_GUARD_PATHS).map(async ([key, relativePath]) =>
    [key, await stableFile(projectPath(relativePath, key),
      `ending production-closed ${key}`)]));
  for (const [key, ending] of endingGuardEntries) {
    assertExactStableFile(guards[key], ending,
      `production-closed ${key}`);
  }

  const receipt = Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-final354-fresh-production-build-isolation-receipt-v1',
    generatedAt: new Date().toISOString(),
    scanner: scanner.binding,
    finalInputs: Object.freeze(Object.fromEntries(inputEntries.map(
      ([key, value]) => [key, value.binding]))),
    calibrationReport: reportFile.binding,
    productionClosedGuards: Object.freeze(Object.fromEntries(
      guardEntries.map(([key, value]) => [key, value.binding]))),
    productionClosedProjection: Object.freeze({
      registryKeyCount: 0,
      status: 'production-closed',
      descriptorCount: 0,
      runtimeAssetCount: 0,
      registeredPlacementCount: 0,
    }),
    freshBuild: Object.freeze({
      ...freshness,
      buildIdFile: buildIdInitial.file.binding,
      buildIdIdentity: buildIdInitial.file.identity,
      buildId: buildIdInitial.value,
      nextRoot: portable(path.relative(PROJECT_ROOT, nextRoot)),
      scannedRoots: Object.freeze(['server', 'static']),
      rootIdentities: initialScan.rootIdentities,
      fileCount: initialScan.fileCount,
      totalBytes: initialScan.totalBytes,
      checksumSetSha256: initialScan.checksumSetSha256,
    }),
    frozenCandidateCount: 354,
    productHostCalibratedPageCount: 138,
    familyCalibrationCount: 22,
    wholeLessonEngineeringPreviewCount: 1,
    completeLessonKeys: Object.freeze(['shared-alg001-l09']),
    partialLessonCount: 43,
    algL11RegisteredPageCount: 21,
    algL11ActivePageCount: 44,
    linkedLessonCardCount: 0,
    forbiddenPatternCount: patterns.length,
    forbiddenPatternSetSha256: patternSetSha256,
    matchCount: 0,
    localOnlyG678MaterialAbsent: true,
    expectedFailClosedInfrastructure: Object.freeze({
      patternCount: EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS.length,
      patternSetSha256: infrastructurePatternSetSha256,
      matchCount: initialScan.infrastructureMatchCount,
      projection: infrastructure.projection,
      projectionSha256: infrastructureProjectionSha256,
      distribution: infrastructure.distribution,
      staticHitCount: infrastructure.staticHitCount,
      exactExpectedInfrastructureOnly: true,
    }),
    overallG678ProductCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS,
  });

  const finalCustody = await validateOutputCustody({
    nextRoot: options.nextRoot, output: options.output, check: options.check,
  });
  assertExactOutputCustody(initialCustody, finalCustody);
  const outputPath = finalCustody.output;
  let resultReceipt = receipt;
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  if (options.check) {
    const current = await stableFile(outputPath, 'production receipt');
    const parsed = JSON.parse(current.bytes.toString('utf8'));
    const expected = {...receipt, generatedAt: parsed.generatedAt};
    invariant(exact(parsed, expected),
      'final354 production isolation receipt drifted');
    const endingReceipt = await stableFile(outputPath,
      'ending production receipt');
    assertExactStableFile(current, endingReceipt, 'production receipt');
    assertExactOutputCustody(finalCustody, await validateOutputCustody({
      nextRoot: options.nextRoot, output: options.output, check: true,
    }));
    resultReceipt = Object.freeze(expected);
  } else {
    await publishReceiptNoReplace({nextRoot: options.nextRoot,
      output: options.output, receiptBytes,
      expectedCustody: finalCustody});
  }
  process.stdout.write(Buffer.from(`${JSON.stringify({...resultReceipt,
    mode: options.check ? 'check' : 'build'}, null, 2)}\n`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
