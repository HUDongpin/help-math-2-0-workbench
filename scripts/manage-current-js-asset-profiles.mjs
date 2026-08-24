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
const G4_PAGE_ONLY_PROMOTION_RECEIPT_PATH =
  'reports/current-js-g4-page-only-production-promotion-2026-08-23.json';
const PRODUCTION_PROFILE_PATH =
  'apps/web/config/current-js-production-assets.v1.json';
const CANDIDATE_PROFILE_PATH =
  'apps/web/config/current-js-candidate-assets.v1.json';

const EXPECTED = Object.freeze({
  publicBefore: 1339,
  publicExcess: 410,
  g4CandidateRuntime: 206,
  g4CandidateEvidence: 198,
  g5CandidateEvidence: 6,
  workbenchPublicMirrors: 259,
  productionPublic: 929,
  productionServer: 185,
  productionTotal: 1114,
  productionChecksumSetSha256:
    '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25',
  candidateRuntimeTotal: 209,
  candidateEvidenceTotal: 204,
});

const CURRENT_PROFILE_EXPECTED = Object.freeze({
  productionPublic: 1135,
  productionServer: 185,
  productionTotal: 1320,
  productionChecksumSetSha256:
    '54e11e77a8d684fcf9542ba7458c12add3edb1a85c16ac99db756a34ed5c6ad4',
  candidateRuntimeTotal: 3,
  candidateEvidenceTotal: 204,
  promotedG4RuntimeTotal: 206,
  promotedG4RuntimeBytes: 483606214,
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

const RELEASE_IDS = Object.freeze({
  g3l2: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
  g4l3: 'lesson-g04-l03-negative-numbers',
  g4l5: 'lesson-g04-l05-multiplication-page-only',
  g4l10: 'lesson-g04-l10-perimeter-area-page-only',
  g4l11: 'lesson-g04-l11-coordinate-grid-page-only',
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

async function pathExists(relativePath) {
  try {
    await lstat(absolute(relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
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

async function promoteG4PageOnlyRuntime() {
  invariant(
    !await pathExists(G4_PAGE_ONLY_PROMOTION_RECEIPT_PATH),
    `${G4_PAGE_ONLY_PROMOTION_RECEIPT_PATH}: promotion already applied`,
  );
  const [productionBytesBefore, candidateBytesBefore, head] = await Promise.all([
    readFile(absolute(PRODUCTION_PROFILE_PATH)),
    readFile(absolute(CANDIDATE_PROFILE_PATH)),
    gitText('rev-parse', 'HEAD'),
  ]);
  const productionBefore = JSON.parse(productionBytesBefore.toString('utf8'));
  const candidateBefore = JSON.parse(candidateBytesBefore.toString('utf8'));
  invariant(
    productionBefore.counts?.public === EXPECTED.productionPublic
      && productionBefore.counts?.serverAudio === EXPECTED.productionServer
      && productionBefore.counts?.total === EXPECTED.productionTotal
      && productionBefore.checksumSetSha256 ===
        EXPECTED.productionChecksumSetSha256,
    'promotion requires the verified five-lesson production profile',
  );
  invariant(
    candidateBefore.counts?.runtime === EXPECTED.candidateRuntimeTotal
      && candidateBefore.counts?.evidence === EXPECTED.candidateEvidenceTotal
      && candidateBefore.entries?.length === EXPECTED.candidateRuntimeTotal,
    'promotion requires the verified separated candidate profile',
  );

  const promotedReleaseIds = new Set([
    RELEASE_IDS.g4l5,
    RELEASE_IDS.g4l10,
    RELEASE_IDS.g4l11,
  ]);
  const promotedEntries = candidateBefore.entries.filter(({releaseId}) =>
    promotedReleaseIds.has(releaseId)
  ).sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  invariant(
    promotedEntries.length === CURRENT_PROFILE_EXPECTED.promotedG4RuntimeTotal,
    `promoted G4 runtime count is ${promotedEntries.length}`,
  );
  invariant(
    promotedEntries.reduce((total, entry) => total + entry.bytes, 0) ===
      CURRENT_PROFILE_EXPECTED.promotedG4RuntimeBytes,
    'promoted G4 runtime byte count drifted',
  );
  invariant(
    new Set(promotedEntries.map(({relativePath}) => relativePath)).size ===
      promotedEntries.length,
    'promoted G4 runtime paths are not unique',
  );

  const plannedMoves = [];
  for (const entry of promotedEntries) {
    invariant(entry.storageRoot === 'candidate', `${entry.assetPath}: not candidate`);
    invariant(
      ALLOWED_RUNTIME_EXTENSIONS.has(path.extname(entry.relativePath)),
      `${entry.relativePath}: unsupported runtime extension`,
    );
    const sourcePath = `${CURRENT_JS_CANDIDATE_FLASH_ROOT}/${entry.assetPath}`;
    const destinationPath = `apps/web/public/flash-assets/${entry.assetPath}`;
    const source = await ordinaryBinding(sourcePath);
    invariant(
      source.bytes === entry.bytes && source.sha256 === entry.sha256,
      `${sourcePath}: candidate profile binding drifted`,
    );
    invariant(
      !await pathExists(destinationPath),
      `${destinationPath}: refusing to overwrite a production asset`,
    );
    plannedMoves.push(Object.freeze({
      assetPath: entry.assetPath,
      bytes: entry.bytes,
      destinationPath,
      releaseId: entry.releaseId,
      relativePath: entry.relativePath,
      sha256: entry.sha256,
      sourcePath,
    }));
  }

  const releasePages = new Map([
    [RELEASE_IDS.g4l5, 53],
    [RELEASE_IDS.g4l10, 46],
    [RELEASE_IDS.g4l11, 43],
  ]);
  const moved = [];
  let profilesWritten = false;
  try {
    for (const row of plannedMoves) {
      await mkdir(path.dirname(absolute(row.destinationPath)), {recursive: true});
      await rename(absolute(row.sourcePath), absolute(row.destinationPath));
      moved.push(row);
    }

    const candidateCoursesRoot =
      `${CURRENT_JS_CANDIDATE_FLASH_ROOT}/courses`;
    const emptyDirectoryCandidates = new Set();
    for (const row of moved) {
      let directory = path.posix.dirname(row.sourcePath);
      while (directory.startsWith(`${candidateCoursesRoot}/`)) {
        emptyDirectoryCandidates.add(directory);
        directory = path.posix.dirname(directory);
      }
    }
    for (const directory of [...emptyDirectoryCandidates].sort((left, right) =>
      right.split('/').length - left.split('/').length
      || right.localeCompare(left)
    )) {
      try {
        await rmdir(absolute(directory));
      } catch (error) {
        if (!['ENOENT', 'ENOTEMPTY'].includes(error?.code)) throw error;
      }
    }

    const profileResult = await writeOrCheckProfiles(false);
    profilesWritten = true;
    const [productionAfter, candidateAfter] = await Promise.all([
      ordinaryBinding(PRODUCTION_PROFILE_PATH),
      ordinaryBinding(CANDIDATE_PROFILE_PATH),
    ]);
    const releaseRows = [...releasePages].map(([releaseId, pageCount]) => {
      const rows = moved.filter((row) => row.releaseId === releaseId);
      return Object.freeze({
        releaseId,
        pageCount,
        runtimeFileCount: rows.length,
        runtimeBytes: rows.reduce((total, row) => total + row.bytes, 0),
      });
    });
    const promotionChecksumSetSha256 = checksumSet(moved.map((row) => ({
      bytes: row.bytes,
      relative: row.relativePath,
      sha256: row.sha256,
    })));
    const receipt = Object.freeze({
      schemaVersion: 1,
      artifactType: 'current-js-g4-page-only-production-promotion',
      appliedAt: '2026-08-23',
      baselineGitHead: head,
      implementationDirective:
        'Use the completed G4 L5, G4 L10, and G4 L11 page-only Current-JS lessons in the Nova Tutor remediation.',
      scope: Object.freeze({
        activeLessonPages: 142,
        legacyFlashCourseShells: 0,
        releases: Object.freeze(releaseRows),
      }),
      runtime: Object.freeze({
        movedFileCount: moved.length,
        movedBytes: moved.reduce((total, row) => total + row.bytes, 0),
        checksumSetSha256: promotionChecksumSetSha256,
        sourceProfile: CURRENT_JS_CANDIDATE_VERSION,
        destinationRoot: PUBLIC_ROOT,
      }),
      profiles: Object.freeze({
        before: Object.freeze({
          productionBytes: productionBytesBefore.length,
          productionSha256: sha256(productionBytesBefore),
          productionChecksumSetSha256:
            productionBefore.checksumSetSha256,
          candidateBytes: candidateBytesBefore.length,
          candidateSha256: sha256(candidateBytesBefore),
          candidateRuntimeFiles: candidateBefore.counts.runtime,
        }),
        after: Object.freeze({
          production: productionAfter,
          productionChecksumSetSha256:
            profileResult.productionChecksumSetSha256,
          candidate: candidateAfter,
          candidateRuntimeFiles: profileResult.candidate.runtime,
        }),
      }),
      preservedEvidence: Object.freeze({
        candidateEvidenceFiles: CURRENT_PROFILE_EXPECTED.candidateEvidenceTotal,
        separationFreeze: FREEZE_PATH,
        evidenceRelocationReceipt: EVIDENCE_RELOCATION_RECEIPT_PATH,
      }),
      acceptanceBoundary: Object.freeze({
        currentJsProductionProfileExpanded: true,
        strictFlashMigrationExpanded: false,
        humanVisualAcceptanceChanged: false,
        ownerAnimationAcceptanceChanged: false,
        audioAcceptanceChanged: false,
        novaMediaPrivacyLegalApproval: false,
        deployed: false,
      }),
    });
    const receiptBytes = jsonBytes(receipt);
    await writeExclusive(G4_PAGE_ONLY_PROMOTION_RECEIPT_PATH, receiptBytes);
    return Object.freeze({
      operation: 'promote-g4-page-only',
      receipt: G4_PAGE_ONLY_PROMOTION_RECEIPT_PATH,
      receiptSha256: sha256(receiptBytes),
      activeLessonPages: 142,
      movedRuntimeFiles: moved.length,
      production: profileResult.production,
      candidate: profileResult.candidate,
      productionChecksumSetSha256:
        profileResult.productionChecksumSetSha256,
    });
  } catch (error) {
    const rollbackErrors = [];
    if (profilesWritten) {
      try {
        await writeAtomic(PRODUCTION_PROFILE_PATH, productionBytesBefore);
        await writeAtomic(CANDIDATE_PROFILE_PATH, candidateBytesBefore);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const row of [...moved].reverse()) {
      try {
        await mkdir(path.dirname(absolute(row.sourcePath)), {recursive: true});
        await rename(absolute(row.destinationPath), absolute(row.sourcePath));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        'G4 page-only production promotion and rollback both failed',
      );
    }
    throw error;
  }
}

async function buildProductionProfile() {
  const [publicFiles, serverFiles] = await Promise.all([
    walk(PUBLIC_ROOT),
    walk(SERVER_ROOT),
  ]);
  invariant(publicFiles.length === CURRENT_PROFILE_EXPECTED.productionPublic,
    `production public count is ${publicFiles.length}`);
  invariant(serverFiles.length === CURRENT_PROFILE_EXPECTED.productionServer,
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
  invariant(productionEntries.length === CURRENT_PROFILE_EXPECTED.productionTotal,
    `production total is ${productionEntries.length}`);
  invariant(
    productionChecksum === CURRENT_PROFILE_EXPECTED.productionChecksumSetSha256,
    `production checksum is ${productionChecksum}`);

  return Object.freeze({
    schemaVersion: 1,
    profileId: 'current-js-production-assets-v1',
    generatedBy: 'scripts/manage-current-js-asset-profiles.mjs',
    approvalScope: 'eight-lesson-current-js-production-closure',
    approvedReleaseIds: Object.freeze([
      RELEASE_IDS.g3l2,
      RELEASE_IDS.g4l3,
      RELEASE_IDS.g4l5,
      RELEASE_IDS.g4l10,
      RELEASE_IDS.g4l11,
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
  invariant(candidateFiles.length === CURRENT_PROFILE_EXPECTED.candidateRuntimeTotal,
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
  invariant(
    evidenceRows.length === CURRENT_PROFILE_EXPECTED.candidateEvidenceTotal,
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
  return Object.freeze({
    operation: check ? 'check' : 'write-profiles',
    production: profiles.production.counts,
    productionChecksumSetSha256:
      profiles.production.checksumSetSha256,
    candidate: profiles.candidate.counts,
  });
}

function parseArguments(argv) {
  invariant(argv.length === 1, 'usage: manage-current-js-asset-profiles.mjs ' +
    '<--snapshot|--apply-separation|--relocate-evidence|' +
    '--promote-g4-page-only|--write-profiles|--check-production|--check>');
  invariant([
    '--snapshot',
    '--apply-separation',
    '--relocate-evidence',
    '--promote-g4-page-only',
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
      : operation === '--promote-g4-page-only'
        ? await promoteG4PageOnlyRuntime()
        : operation === '--check-production'
          ? await checkProductionProfile()
          : await writeOrCheckProfiles(operation === '--check');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
