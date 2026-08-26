#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildCourseScenarioInventories,
} from "./build-course-scenario-inventories.mjs";
import {
  materializeG5L5StaticFrameDomainDispositions,
} from "./materialize-g5-l5-static-frame-domain-dispositions.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const G5_L5_RELEASE_PATH = "catalog/lesson-releases.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

async function readContainedOrdinaryFile(root, relativePath, label) {
  const rootState = await lstat(root);
  invariant(
    rootState.isDirectory() && !rootState.isSymbolicLink(),
    `${label} root must be one ordinary directory`,
  );
  const rootReal = await realpath(root);
  let current = root;
  const segments = relativePath.split("/");
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    const state = await lstat(current);
    invariant(
      state.isDirectory() && !state.isSymbolicLink(),
      `${label} ancestor must be an ordinary directory: ${segment}`,
    );
    invariant(
      isWithin(rootReal, await realpath(current)),
      `${label} ancestor escapes the project root: ${segment}`,
    );
  }
  const file = path.join(current, segments.at(-1));
  const before = await lstat(file);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be one ordinary single-link file`,
  );
  invariant(
    isWithin(rootReal, await realpath(file)),
    `${label} escapes the project root`,
  );
  const bytes = await readFile(file);
  const after = await lstat(file);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size,
    `${label} changed while being read`,
  );
  return bytes;
}

function outputStatIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameOutputIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertManagedOutputParent(root, relativePath, label) {
  invariant(
    !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\") &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.startsWith("../"),
    `${label} path must be normalized and project-relative`,
  );
  const parts = relativePath.split("/");
  invariant(
    parts.length === 4 &&
      parts[0] === "migrations" &&
      /^[a-z0-9][a-z0-9-]*$/.test(parts[1]) &&
      parts[2] === "audit" &&
      new Set([
        "scenario-inventory.json",
        "frame-domain-disposition.json",
      ]).has(parts[3]),
    `${label} is outside the managed G5 L5 planning output allowlist`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(
    isWithin(root, absolutePath),
    `${label} escapes the project root`,
  );
  const rootState = await lstat(root, {bigint: true});
  invariant(
    rootState.isDirectory() && !rootState.isSymbolicLink(),
    `${label} root must be a real directory`,
  );
  const rootReal = await realpath(root);
  let current = root;
  for (const segment of parts.slice(0, -1)) {
    current = path.join(current, segment);
    const state = await lstat(current, {bigint: true});
    invariant(
      state.isDirectory() && !state.isSymbolicLink(),
      `${label} ancestor must be a real directory`,
    );
    invariant(
      isWithin(rootReal, await realpath(current)),
      `${label} ancestor escapes the project root`,
    );
  }
  return {
    absolutePath,
    parent: path.dirname(absolutePath),
    rootReal,
  };
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function captureManagedOutput(root, relativePath, label) {
  const managed = await assertManagedOutputParent(
    root,
    relativePath,
    label,
  );
  const before = await lstatOrNull(managed.absolutePath);
  if (!before) {
    return {
      ...managed,
      path: relativePath,
      exists: false,
      bytes: null,
      byteLength: 0,
      sha256: "",
      stat: null,
    };
  }
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1n,
    `${label} must be one ordinary single-link file`,
  );
  invariant(
    isWithin(managed.rootReal, await realpath(managed.absolutePath)),
    `${label} resolves outside the project root`,
  );
  const handle = await open(
    managed.absolutePath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameOutputIdentity(
          outputStatIdentity(before),
          outputStatIdentity(descriptorBefore),
        ),
      `${label} changed before stable read`,
    );
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameOutputIdentity(
        outputStatIdentity(descriptorBefore),
        outputStatIdentity(descriptorAfter),
      ),
      `${label} changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(managed.absolutePath, {bigint: true});
  invariant(
    sameOutputIdentity(
      outputStatIdentity(descriptorAfter),
      outputStatIdentity(after),
    ) &&
      bytes.length === Number(after.size),
    `${label} changed after stable read`,
  );
  return {
    ...managed,
    path: relativePath,
    exists: true,
    bytes,
    byteLength: bytes.length,
    sha256: sha256(bytes),
    stat: outputStatIdentity(after),
  };
}

function sameManagedOutput(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.byteLength === right.byteLength &&
        left.sha256 === right.sha256 &&
        sameOutputIdentity(left.stat, right.stat)));
}

function sameManagedPreimage(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.byteLength === right.byteLength &&
        left.sha256 === right.sha256 &&
        (Number.parseInt(left.stat.mode, 10) & 0o777) ===
          (Number.parseInt(right.stat.mode, 10) & 0o777)));
}

async function captureManagedOutputSet(root, relativePaths, label) {
  const snapshots = new Map();
  for (const relativePath of relativePaths) {
    snapshots.set(
      relativePath,
      await captureManagedOutput(
        root,
        relativePath,
        `${label}: ${relativePath}`,
      ),
    );
  }
  return snapshots;
}

async function assertManagedOutputSetMatches(
  root,
  expected,
  label,
) {
  for (const [relativePath, snapshot] of expected) {
    const current = await captureManagedOutput(
      root,
      relativePath,
      `${label}: ${relativePath}`,
    );
    invariant(
      sameManagedOutput(snapshot, current),
      `${label}: ${relativePath} changed outside the planning phase`,
    );
  }
}

async function assertManagedOutputSetRestored(
  root,
  expected,
  label,
) {
  for (const [relativePath, snapshot] of expected) {
    const current = await captureManagedOutput(
      root,
      relativePath,
      `${label}: ${relativePath}`,
    );
    invariant(
      sameManagedPreimage(snapshot, current),
      `${label}: ${relativePath} was not restored to its byte preimage`,
    );
  }
}

async function writeExclusive(candidate, bytes, mode) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function unlinkOwnedTemporary(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate} rollback temporary is not ordinary`,
  );
  const bytes = await readFile(candidate);
  invariant(
    sha256(bytes) === expectedSha256,
    `${candidate} rollback temporary changed`,
  );
  await unlink(candidate);
}

async function restoreManagedOutputSet(
  root,
  original,
  phaseState,
  label,
) {
  await assertManagedOutputSetMatches(root, phaseState, `${label} CAS`);
  const transactions = [];
  try {
    for (const [relativePath, originalSnapshot] of original) {
      const phaseSnapshot = phaseState.get(relativePath);
      invariant(phaseSnapshot, `${label}: missing phase snapshot`);
      const temporaryPath = originalSnapshot.exists
        ? path.join(
          originalSnapshot.parent,
          `.${path.basename(originalSnapshot.absolutePath)}.${randomUUID()}.rollback`,
        )
        : null;
      if (temporaryPath) {
        await writeExclusive(
          temporaryPath,
          originalSnapshot.bytes,
          Number.parseInt(originalSnapshot.stat.mode, 10) & 0o777,
        );
      }
      transactions.push({
        relativePath,
        original: originalSnapshot,
        phase: phaseSnapshot,
        temporaryPath,
        committed: false,
      });
    }

    for (const transaction of transactions) {
      const current = await captureManagedOutput(
        root,
        transaction.relativePath,
        `${label} pre-restore`,
      );
      invariant(
        sameManagedOutput(transaction.phase, current),
        `${label}: ${transaction.relativePath} changed before restore`,
      );
      if (transaction.original.exists) {
        await rename(
          transaction.temporaryPath,
          transaction.original.absolutePath,
        );
        transaction.temporaryPath = null;
      } else if (transaction.phase.exists) {
        await unlink(transaction.phase.absolutePath);
      }
      transaction.committed = true;
    }
    await assertManagedOutputSetRestored(
      root,
      original,
      `${label} restored`,
    );
  } catch (error) {
    const rollbackErrors = [];
    for (const transaction of [...transactions].reverse()) {
      try {
        if (transaction.committed) {
          const current = await captureManagedOutput(
            root,
            transaction.relativePath,
            `${label} rollback current`,
          );
          invariant(
            sameManagedPreimage(transaction.original, current),
            `${label}: restored output drifted before rollback`,
          );
          if (transaction.phase.exists) {
            const rollbackPath = path.join(
              transaction.phase.parent,
              `.${path.basename(transaction.phase.absolutePath)}.${randomUUID()}.phase`,
            );
            await writeExclusive(
              rollbackPath,
              transaction.phase.bytes,
              Number.parseInt(transaction.phase.stat.mode, 10) & 0o777,
            );
            await rename(rollbackPath, transaction.phase.absolutePath);
          } else if (current.exists) {
            await unlink(current.absolutePath);
          }
        }
        if (transaction.temporaryPath) {
          await unlinkOwnedTemporary(
            transaction.temporaryPath,
            transaction.original.sha256,
          );
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `${label} failed and rollback was incomplete`,
      );
    }
    throw error;
  }
}

export async function loadG5L5ReleaseIds({
  root = projectRoot,
  releasePath = G5_L5_RELEASE_PATH,
} = {}) {
  invariant(
    !path.isAbsolute(releasePath) &&
      !releasePath.includes("\\") &&
      path.posix.normalize(releasePath) === releasePath &&
      !releasePath.startsWith("../"),
    "lesson-release path must be project-relative and normalized",
  );
  const absolute = path.resolve(root, releasePath);
  invariant(
    path.relative(root, absolute) === releasePath,
    "lesson-release path escapes the project root",
  );
  const bytes = await readContainedOrdinaryFile(
    root,
    releasePath,
    "lesson-release catalog",
  );
  const document = JSON.parse(bytes.toString("utf8"));
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson-release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === G5_L5_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      release.expectedCounts.members === 57 &&
      Array.isArray(release.members) &&
      release.members.length === 57 &&
      release.members.every(
        (member, index) =>
          member.ordinal === index + 1 &&
          typeof member.animationId === "string" &&
          member.animationId.length > 0,
      ) &&
      new Set(release.members.map(({animationId}) => animationId)).size ===
        57 &&
      sha256(Buffer.from(stableJson(release))) ===
        G5_L5_RELEASE_FINGERPRINT_SHA256,
    "G5 L5 release scope or fingerprint drifted",
  );
  return release.members.map(({animationId}) => animationId);
}

export async function buildG5L5StaticPlanningAudits({
  root = projectRoot,
  check = false,
  scenarioBuilder = buildCourseScenarioInventories,
  frameDomainBuilder = materializeG5L5StaticFrameDomainDispositions,
  scenarioTransactionHooks = {},
  frameDomainTransactionHooks = {},
} = {}) {
  const releasePath = path.join(root, G5_L5_RELEASE_PATH);
  const migrationsRoot = path.join(root, "migrations");
  const ids = await loadG5L5ReleaseIds({root});
  const scenarioPaths = ids.map(
    (id) => `migrations/${id}/audit/scenario-inventory.json`,
  );
  const frameDomainPaths = ids.map(
    (id) =>
      `migrations/${id}/audit/frame-domain-disposition.json`,
  );
  const allPaths = [...scenarioPaths, ...frameDomainPaths];
  const runScenarioPhase = () =>
    scenarioBuilder({
      ids,
      releaseId: G5_L5_RELEASE_ID,
      lessonReleasesPath: releasePath,
      migrationsRoot,
      check,
      transactionHooks: scenarioTransactionHooks,
    });
  const runFrameDomainPhase = () =>
    frameDomainBuilder({
      projectRoot: root,
      ids,
      releaseId: G5_L5_RELEASE_ID,
      lessonReleasePath: releasePath,
      migrationsRoot,
      check,
      transactionHooks: frameDomainTransactionHooks,
    });

  let scenarioResults;
  let frameDomainResults;
  let frameDomainTotals;
  const normalizeFrameDomainPhase = (phase) => {
    if (!Array.isArray(phase)) {
      invariant(
        Array.isArray(phase?.results) && phase?.totals,
        "G5 L5 frame-domain phase returned a malformed result",
      );
      return phase;
    }
    const totals = phase.reduce((summary, {report}) => {
      if (!report) return summary;
      summary.declaredRoots +=
        report.summary.dispositionCounts["declared-frame-domain"];
      summary.composites +=
        report.summary.dispositionCounts["composite-child-with-parent"];
      summary.unresolved += report.summary.dispositionCounts.unresolved;
      summary.excludedNotProven +=
        report.summary.excludedNotProvenTimelineCount;
      return summary;
    }, {
      declaredRoots: 0,
      composites: 0,
      unresolved: 0,
      excludedNotProven: 0,
    });
    return {results: phase, totals};
  };
  if (check) {
    scenarioResults = await runScenarioPhase();
    const phase = normalizeFrameDomainPhase(
      await runFrameDomainPhase(),
    );
    frameDomainResults = phase.results;
    frameDomainTotals = phase.totals;
  } else {
    const original = await captureManagedOutputSet(
      root,
      allPaths,
      "G5 L5 planning preimage",
    );
    try {
      scenarioResults = await runScenarioPhase();
    } catch (error) {
      try {
        await assertManagedOutputSetRestored(
          root,
          original,
          "G5 L5 failed scenario phase",
        );
      } catch (guardError) {
        throw new AggregateError(
          [error, guardError],
          "G5 L5 scenario phase failed and did not restore all planning outputs",
        );
      }
      throw error;
    }
    invariant(
      scenarioResults.length === 57,
      "G5 L5 scenario phase did not return all 57 members",
    );
    const scenarioPost = await captureManagedOutputSet(
      root,
      scenarioPaths,
      "G5 L5 scenario postimage",
    );
    const frameOriginal = new Map(
      frameDomainPaths.map((relativePath) => [
        relativePath,
        original.get(relativePath),
      ]),
    );
    try {
      const phase = normalizeFrameDomainPhase(
        await runFrameDomainPhase(),
      );
      frameDomainResults = phase.results;
      frameDomainTotals = phase.totals;
      invariant(
        frameDomainResults.length === 57,
        "G5 L5 frame-domain phase did not return all 57 members",
      );
      const finalOutputs = await captureManagedOutputSet(
        root,
        allPaths,
        "G5 L5 planning postimage",
      );
      invariant(
        [...finalOutputs.values()].every(({exists}) => exists),
        "G5 L5 planning postimage is not the complete 114-output set",
      );
    } catch (error) {
      const rollbackErrors = [];
      try {
        await assertManagedOutputSetRestored(
          root,
          frameOriginal,
          "G5 L5 failed frame-domain phase",
        );
      } catch (frameRollbackError) {
        rollbackErrors.push(frameRollbackError);
      }
      const scenarioOriginal = new Map(
        scenarioPaths.map((relativePath) => [
          relativePath,
          original.get(relativePath),
        ]),
      );
      try {
        await restoreManagedOutputSet(
          root,
          scenarioOriginal,
          scenarioPost,
          "G5 L5 cross-phase scenario rollback",
        );
      } catch (scenarioRollbackError) {
        rollbackErrors.push(scenarioRollbackError);
      }
      try {
        await assertManagedOutputSetRestored(
          root,
          original,
          "G5 L5 cross-phase final rollback",
        );
      } catch (finalRollbackError) {
        rollbackErrors.push(finalRollbackError);
      }
      if (rollbackErrors.length) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          "G5 L5 frame-domain phase failed and cross-phase rollback was incomplete",
        );
      }
      throw error;
    }
  }
  invariant(
    scenarioResults.length === 57 &&
      frameDomainResults.length === 57 &&
      frameDomainTotals.declaredRoots === 57 &&
      frameDomainTotals.composites === 696 &&
      frameDomainTotals.unresolved === 351 &&
      frameDomainTotals.excludedNotProven === 185,
    "G5 L5 static planning output count or 57 / 696 / 351 / 185 disposition contract drifted",
  );
  return {
    mode: check ? "check" : "write",
    releaseId: G5_L5_RELEASE_ID,
    memberCount: ids.length,
    scenarioInventoryCount: scenarioResults.length,
    frameDomainDispositionCount: frameDomainResults.length,
    declaredRootFrameDomainCount: frameDomainTotals.declaredRoots,
    evidenceBoundCompositeFrameDomainCount: frameDomainTotals.composites,
    unresolvedFrameDomainCount: frameDomainTotals.unresolved,
    excludedNotProvenTimelineCount:
      frameDomainTotals.excludedNotProven,
  };
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-static-planning-audits.mjs
  node scripts/build-g5-l5-static-planning-audits.mjs --check

Builds or verifies exactly 57 source-derived scenario inventories followed by
57 proof-aware fail-closed frame-domain dispositions with the exact
57 roots / 696 evidence-bound composites / 351 unresolved /
185 excluded-not-proven contract. It launches no GUI or runtime and
changes no manifest, implementation, review, acceptance, strict, or release gate.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await buildG5L5StaticPlanningAudits(options);
  process.stdout.write(
    `${result.mode === "check" ? "PASS" : "WROTE"}: G5 L5 static planning ` +
      `${result.scenarioInventoryCount}/57 scenarios and ` +
      `${result.frameDomainDispositionCount}/57 frame-domain dispositions; ` +
      `${result.evidenceBoundCompositeFrameDomainCount}/696 proof-bound composites, ` +
      `${result.unresolvedFrameDomainCount}/351 unresolved; ` +
      "runtime/implementation/acceptance/publication unchanged\n",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === scriptPath
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
