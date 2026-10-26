#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-pure-linear-family-calibration-v1.json';
const OUTPUT = 'catalog/g678-pure-linear-structural-inventory-v1.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function absolute(relativePath) {
  const result = path.resolve(ROOT, relativePath);
  invariant(result.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return result;
}

async function ordinary(relativePath, json = false) {
  const target = absolute(relativePath);
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be an ordinary single-link file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

async function sourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested);
  const resolved = await realpath(root);
  const metadata = await lstat(root, {bigint: true});
  invariant(root === resolved && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be a real read-only directory`);
  return Object.freeze({root, identity: Object.freeze({
    realPathSha256: sha256(resolved),
    device: String(metadata.dev),
    inode: String(metadata.ino),
    mode: Number(metadata.mode & 0o777n),
  })});
}

async function readSource(root, viewPath, expected) {
  invariant(/^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/[A-Z]+\/[^/]+\.swf$/u
    .test(viewPath), `noncanonical source view path: ${viewPath}`);
  const target = path.join(root, ...viewPath.split('/'));
  invariant(target.startsWith(`${root}${path.sep}`),
    `${viewPath} escapes source root`);
  const before = await lstat(target, {bigint: true});
  const resolved = await realpath(target);
  invariant(resolved === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (before.mode & 0o222n) === 0n,
  `${viewPath} must be an ordinary read-only source`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink &&
    bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
  `${viewPath} source identity or bytes drifted`);
  return bytes;
}

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)},
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index], index);
      }
    }));
  return results;
}

function classify(facts) {
  const root = facts.frameDomains.domains.find((domain) =>
    domain.domainId === 'root');
  const sprites = facts.frameDomains.domains.filter((domain) =>
    domain.kind === 'sprite');
  const reachableSprites = sprites.filter((domain) =>
    domain.staticallyRootReachable && domain.declaredFrameCount > 1)
    .sort((left, right) => right.declaredFrameCount - left.declaredFrameCount ||
      left.domainId.localeCompare(right.domainId));
  const main = reachableSprites[0] ?? null;
  const reasons = [];
  if (facts.header.stage.width !== 800 || facts.header.stage.height !== 600) {
    reasons.push('stage-not-800x600');
  }
  if (facts.header.fps !== 12) reasons.push('fps-not-12');
  if ((facts.tagCounts.DefineButton ?? 0) !== 0 ||
    (facts.tagCounts.DefineButton2 ?? 0) !== 0) reasons.push('buttons-present');
  if (facts.actionScript.tagCounts.DoAction !== 2 ||
    facts.actionScript.tagCounts.DoInitAction !== 0 ||
    facts.actionScript.tagCounts.DoABCDefine !== 0 ||
    facts.actionScript.tagCounts.DoABC !== 0) reasons.push('script-count-not-two-root-avm1');
  if (root?.scriptTagCount !== 2 ||
    sprites.some((domain) => domain.scriptTagCount !== 0)) {
    reasons.push('child-or-nonroot-script-present');
  }
  if (!main) reasons.push('no-multiframe-root-reachable-main-sprite');
  if (facts.linkageAndImports.importedAssets.length > 0) {
    reasons.push('import-assets-present');
  }
  return Object.freeze({
    structuralCandidate: reasons.length === 0,
    reasons: Object.freeze(reasons),
    mainFrameDomain: main?.domainId ?? null,
    mainFrameCount: main?.declaredFrameCount ?? null,
    rootFrameCount: facts.header.rootFrameCount,
    buttonCount: (facts.tagCounts.DefineButton ?? 0) +
      (facts.tagCounts.DefineButton2 ?? 0),
    rootScriptCount: root?.scriptTagCount ?? null,
    childScriptCount: sprites.reduce((sum, domain) =>
      sum + domain.scriptTagCount, 0),
    soundStreamHeadCount: facts.audio.tagCounts.SoundStreamHead +
      facts.audio.tagCounts.SoundStreamHead2,
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    structureFingerprintSha256: facts.structureFingerprintSha256,
  });
}

async function expectedInventory() {
  const [catalog, family, builder, source] = await Promise.all([
    ordinary(CATALOG, true), ordinary(FAMILY, true),
    ordinary(path.relative(ROOT, SCRIPT_PATH)), sourceRoot(),
  ]);
  invariant(catalog.value.activePagePlacementCount === 2282 &&
    catalog.value.uniqueActiveSwfSha256Count === 2240,
  'G678 catalog denominator drifted');
  invariant(family.value.adapterFamily === 'pure-linear-source-static' &&
    family.value.scaleOutAuthorization?.authorized === true &&
    family.value.scaleOutAuthorization?.scope ===
      'exact-structural-classifier-matches-only',
  'pure-linear family authorization is absent or broadened');
  const pages = catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => ({
      animationId: page.animationId,
      stableLessonKey: lesson.stableLessonKey,
      moduleCode: lesson.moduleCode,
      lessonNumber: lesson.lessonNumber,
      globalPageOrdinal: page.globalOrdinal,
      sourceBytes: page.sourceBytes,
      sourceSha256: page.sourceSha256,
      viewPath: page.viewPath,
    })));
  invariant(pages.length === 2282 &&
    new Set(pages.map((page) => page.animationId)).size === 2282,
  'G678 placement membership drifted');
  const groups = new Map();
  for (const page of pages) {
    const prior = groups.get(page.sourceSha256) ?? [];
    prior.push(page);
    groups.set(page.sourceSha256, prior);
  }
  invariant(groups.size === 2240, 'G678 unique SWF denominator drifted');
  const unique = [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right));
  const records = await mapConcurrent(unique, 4, async ([digest, placements]) => {
    const paths = [...new Set(placements.map((page) => page.viewPath))].sort();
    let representativeBytes = null;
    for (const viewPath of paths) {
      const expected = placements.find((page) => page.viewPath === viewPath);
      const bytes = await readSource(source.root, viewPath, {
        bytes: expected.sourceBytes,
        sha256: digest,
      });
      representativeBytes ??= bytes;
    }
    const facts = parseSwfSourceFacts(representativeBytes);
    const classification = classify(facts);
    return Object.freeze({
      sourceSha256: digest,
      sourceBytes: representativeBytes.length,
      sourcePaths: paths,
      placementIds: placements.map((page) => page.animationId).sort(),
      lessons: [...new Set(placements.map((page) => page.stableLessonKey))]
        .sort(),
      classification,
      scriptBodyReviewStatus: classification.structuralCandidate
        ? 'pending-exact-root-script-export-review'
        : 'not-applicable',
      generationAuthorized: false,
    });
  });
  const candidates = records.filter((record) =>
    record.classification.structuralCandidate);
  const candidatePlacements = candidates.reduce((sum, record) =>
    sum + record.placementIds.length, 0);
  const candidateLessons = new Set(candidates.flatMap((record) =>
    record.lessons));
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-pure-linear-structural-inventory-v1',
    inventoryId: 'g678-pure-linear-structural-inventory-v1',
    status: 'complete-structural-scan-exact-script-review-pending',
    scope: Object.freeze({
      activePagePlacements: 2282,
      uniqueActiveSwfSha256: 2240,
      courseShells: 0,
      legacyCourseShellExcluded: true,
    }),
    inputs: Object.freeze({catalog: descriptor(catalog),
      familyCalibration: descriptor(family), builder: descriptor(builder)}),
    sourceRoot: Object.freeze({environmentVariable: SOURCE_ENV,
      ...source.identity, requireReadOnlySources: true}),
    classifier: Object.freeze({
      stage: '800x600', fps: 12, buttonCount: 0,
      totalDoActionCount: 2, rootDoActionCount: 2,
      childScriptCount: 0, importedAssets: 0,
      mainSprite: 'longest-multiframe-statically-root-reachable-definition',
      caveat:
        'Structural candidate is not generation-authorized until both root ActionScript bodies match the calibrated hashes.',
    }),
    summary: Object.freeze({
      scannedUniqueSwfs: records.length,
      scannedPlacements: pages.length,
      structuralCandidateUniqueSwfs: candidates.length,
      structuralCandidatePlacements: candidatePlacements,
      structuralCandidateLessons: candidateLessons.size,
      exactScriptReviewedUniqueSwfs: 0,
      generationAuthorizedUniqueSwfs: 0,
    }),
    records,
    acceptanceEffects: Object.freeze({
      currentJavaScriptRegistered: false,
      behaviorAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  });
}

async function writeExclusive(bytes) {
  const target = absolute(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function auditPureLinearInventory({check = false} = {}) {
  const inventory = await expectedInventory();
  const bytes = stableBytes(inventory);
  if (check) {
    const current = await ordinary(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'pure-linear structural inventory drifted');
  } else {
    await writeExclusive(bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: inventory.status,
    summary: inventory.summary});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-pure-linear-family-inventory.mjs [--check]');
  auditPureLinearInventory({check: args[0] === '--check'})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`,
    )).catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
