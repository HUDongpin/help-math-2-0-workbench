import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  copyG4L10NestedParentDownstreamPredecessorFixture,
  materializeG4L10NestedParentDownstreamSuccessorV1,
  parseArguments,
} from "./materialize-g4-l10-nested-parent-downstream-successor-v1.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseIndexRelative =
  "migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json";
const reportJsonRelative =
  "reports/g4-l10-nested-parent-downstream-successor-v1.json";
const reportMarkdownRelative =
  "reports/g4-l10-nested-parent-downstream-successor-v1.md";
const lockRelative =
  ".g4-l10-nested-parent-downstream-successor-v1.lock";
const archiveManifestRelative =
  "work/g4-l10-nested-parent-downstream-preimages/0b31c8f8c9188bb9e2b35010389adf81214a0969a84e5cc969d6e3d09d659c01/manifest.json";
const archiveRootRelative = path.dirname(archiveManifestRelative);
const archiveParentRelative = path.dirname(archiveRootRelative);
const historicalSuiteRelative =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.preapply-tests.mjs";
const targets = [
  {
    animationId: "course-g04-l10-ts-007",
    predecessorRuntime:
      "migrations/course-g04-l10-ts-007/audit/machine/release-runtime-acquisition-plan.json",
    successorRuntime:
      "migrations/course-g04-l10-ts-007/audit/machine/release-runtime-acquisition-plan-nested-parent-successor-v1.json",
  },
  {
    animationId: "course-g04-l10-ts-008",
    predecessorRuntime:
      "migrations/course-g04-l10-ts-008/audit/machine/release-runtime-acquisition-plan.json",
    successorRuntime:
      "migrations/course-g04-l10-ts-008/audit/machine/release-runtime-acquisition-plan-nested-parent-successor-v1.json",
  },
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(document, field) {
  const projection = structuredClone(document);
  delete projection[field];
  return sha256(Buffer.from(canonicalJson(projection)));
}

function errorChainText(error) {
  const messages = [];
  const seen = new Set();
  function visit(value) {
    if (!value || seen.has(value)) return;
    seen.add(value);
    messages.push(String(value.message || value));
    if (Array.isArray(value.errors)) {
      for (const nested of value.errors) visit(nested);
    }
    visit(value.cause);
  }
  visit(error);
  return messages.join("\n");
}

async function exists(root, relativePath) {
  try {
    await lstat(path.join(root, relativePath));
    return true;
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error?.code)) return false;
    throw error;
  }
}

async function exact(root, relativePath) {
  const contents = await readFile(path.join(root, relativePath));
  return {path: relativePath, bytes: contents.length, sha256: sha256(contents)};
}

async function formalPaths(root) {
  const index = JSON.parse(await readFile(
    path.join(root, releaseIndexRelative),
    "utf8",
  ));
  const targetIds = new Set(targets.map(({animationId}) => animationId));
  const coverage = targets.map(({animationId}) =>
    `migrations/${animationId}/evidence/full-frame-coverage.json`);
  const trace = index.members
    .filter(({animationId}) => targetIds.has(animationId))
    .flatMap((member) => member.traceSpecs.map(({file}) => file));
  const keyframes = index.members.map(({animationId}) =>
    `migrations/${animationId}/keyframes.csv`);
  const result = [
    ...coverage,
    ...trace,
    releaseIndexRelative,
    ...keyframes,
    ...targets.map(({successorRuntime}) => successorRuntime),
    reportJsonRelative,
    reportMarkdownRelative,
  ];
  assert.equal(result.length, 114);
  assert.equal(new Set(result).size, 114);
  return result;
}

async function mutablePaths(root) {
  return (await formalPaths(root)).slice(0, 110);
}

async function snapshot(root, relativePaths) {
  const rows = [];
  for (const relativePath of relativePaths) {
    if (await exists(root, relativePath)) rows.push(await exact(root, relativePath));
    else rows.push({path: relativePath, exists: false});
  }
  return rows;
}

async function transactionArtifacts(root) {
  const matches = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (/\.(?:stage(?:\.rollback)?|backup|delete-custody)$/u.test(entry.name) ||
        entry.name === path.basename(lockRelative)) {
        matches.push(path.relative(root, absolute));
      }
      if (entry.isDirectory() && !entry.isSymbolicLink()) await walk(absolute);
    }
  }
  await walk(root);
  return matches.sort();
}

async function absoluteMetadata(absolutePath) {
  const info = await lstat(absolutePath, {bigint: true});
  return {
    dev: String(info.dev),
    ino: String(info.ino),
    mode: String(info.mode),
    nlink: String(info.nlink),
    size: String(info.size),
    mtimeNs: String(info.mtimeNs),
    ctimeNs: String(info.ctimeNs),
    kind: info.isSymbolicLink() ? "symlink" :
      info.isDirectory() ? "directory" : info.isFile() ? "file" : "other",
    ...(info.isFile() ? {sha256: sha256(await readFile(absolutePath))} : {}),
  };
}

async function protectedState(root) {
  const formal = await formalPaths(root);
  const rows = await snapshot(root, [...formal, lockRelative]);
  const archiveAbsolute = path.join(root, archiveRootRelative);
  async function walkArchive(absolute, relative) {
    const info = await lstat(absolute, {bigint: true});
    rows.push({
      path: relative,
      kind: info.isDirectory() ? "directory" : info.isFile() ? "file" : "other",
      dev: String(info.dev),
      ino: String(info.ino),
      mode: String(info.mode),
      size: String(info.size),
      mtimeNs: String(info.mtimeNs),
      ctimeNs: String(info.ctimeNs),
      ...(info.isFile() ? await exact(root, relative) : {}),
    });
    if (info.isDirectory()) {
      for (const entry of (await readdir(absolute, {withFileTypes: true}))
        .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
        await walkArchive(
          path.join(absolute, entry.name),
          `${relative}/${entry.name}`,
        );
      }
    }
  }
  if (await exists(root, archiveRootRelative)) {
    await walkArchive(archiveAbsolute, archiveRootRelative);
  } else rows.push({path: archiveRootRelative, exists: false});
  return rows;
}

async function ordinaryPaths(root) {
  const paths = [];
  async function walk(absolute, relative = "") {
    for (const entry of await readdir(absolute, {withFileTypes: true})) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const childAbsolute = path.join(absolute, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        await walk(childAbsolute, childRelative);
      } else if (entry.isFile()) paths.push(childRelative);
    }
  }
  await walk(root);
  return paths.sort();
}

async function makeFixture() {
  const temporary = await mkdtemp(path.join(
    path.dirname(projectRoot),
    ".g4-l10-downstream-successor-test-",
  ));
  const root = await realpath(temporary);
  await copyG4L10NestedParentDownstreamPredecessorFixture({
    sourceRoot: projectRoot,
    destinationRoot: root,
  });
  return root;
}

async function withFixture(operation) {
  const root = await makeFixture();
  try {
    return await operation(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

function assertAllAcceptanceFalse(document, label) {
  const entries = Object.entries(document.acceptanceEffects || {});
  assert.ok(entries.length >= 10, `${label}: acceptance boundary is incomplete`);
  for (const [key, value] of entries) {
    assert.equal(value, false, `${label}: acceptanceEffects.${key}`);
  }
  assert.match(document.strictAcceptanceEffect, /^none/u, label);
}

test("parses one explicit mode and rejects ambiguous or unknown commands", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {
    help: false,
    mode: "dry-run",
    json: false,
  });
  assert.deepEqual(parseArguments(["--apply", "--json"]), {
    help: false,
    mode: "apply",
    json: true,
  });
  assert.deepEqual(parseArguments(["--help"]), {
    help: true,
    mode: "",
    json: false,
  });
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--dry-run", "--check"]),
    /choose exactly one/u);
  assert.throws(() => parseArguments(["--dry-run", "--foreign"]),
    /unknown argument/u);
});

test("project writer has no pathname chmod/unlink fallback and binds native custody-delete", async () => {
  const source = await readFile(path.join(
    projectRoot,
    "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs",
  ), "utf8");
  assert.doesNotMatch(source, /\bawait\s+(?:chmod|unlink)\s*\(/u);
  assert.doesNotMatch(source, /\b(?:chmod|unlink),\s*\n/u);
  assert.match(source, /sourceHandle\.chmod\(0o400\)/u);
  assert.match(source, /handle\.chmod\(mode\)/u);
  assert.match(source, /renameatx_np\(parent_fd/u);
  assert.match(source, /unlinkat\(parent_fd, argv\[4\], 0\)/u);
  assert.match(source, /beforeNativeCleanup/u);
  assert.match(source, /source_nlink/u);
  assert.match(source, /source_mtime_ns/u);
  assert.match(source, /source_ctime_ns/u);
});

test("live dry-run is predecessor/successor repeatable and does not mutate all 114 outputs, archive custody, or lock", async () => {
  const before = await protectedState(projectRoot);
  const result = await materializeG4L10NestedParentDownstreamSuccessorV1({
    mode: "dry-run",
    projectRoot,
  });
  assert.equal(result.action, "planned");
  assert.ok(["predecessor", "successor"].includes(result.inputState));
  assert.equal(result.formallyManagedOutputCount, 114);
  assert.equal(result.mutableLiveSuccessorCount, 110);
  assert.equal(result.absentOnlyOutputCount, 4);
  assert.equal(result.cloneClosureFileCount, 1367);
  assert.equal(result.generatorResults.coverage.changedMemberCount,
    result.inputState === "predecessor" ? 2 : 0);
  assert.equal(result.generatorResults.trace.memberCount, 47);
  assert.equal(result.generatorResults.trace.requirementCount, 520);
  assert.equal(result.generatorResults.trace.nonTargetTraceSpecUnchangedCount, 460);
  assert.equal(result.generatorResults.trace.targetTraceSpecSuccessorCount, 60);
  assert.equal(result.generatorResults.keyframes.changedMemberCount,
    result.inputState === "predecessor" ? 47 : 0);
  assert.equal(result.generatorResults.keyframes.pristineGeneratedRefreshMemberCount, 47);
  assert.equal(result.generatorResults.keyframes.acceptanceBoundary.strictComplete, false);
  assert.match(result.predecessorMutableSet.setSha256, /^[a-f0-9]{64}$/u);
  assert.match(result.desiredMutableSet.setSha256, /^[a-f0-9]{64}$/u);
  assert.notEqual(result.predecessorMutableSet.setSha256,
    result.desiredMutableSet.setSha256);
  assertAllAcceptanceFalse(result, "dry-run result");
  assert.deepEqual(await protectedState(projectRoot), before);
});

test("rejects a temporary-clone parent inside the project root", async () => {
  await assert.rejects(
    materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "dry-run",
      projectRoot,
      tempParent: path.join(projectRoot, "work"),
    }),
    /temporary-clone parent must remain physically outside the project root/u,
  );
  assert.equal(await exists(projectRoot, lockRelative), false);
});

test("rejects a physically symlinked temporary-clone parent before mkdtemp", async () => {
  const physical = await mkdtemp(path.join(
    path.dirname(projectRoot),
    ".g4-l10-physical-temp-parent-",
  ));
  const alias = `${physical}-alias`;
  try {
    await symlink(physical, alias, "dir");
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot,
        tempParent: alias,
      }),
      /symbolic link|physical path contains an alias/u,
    );
  } finally {
    await rm(alias, {force: true});
    await rm(physical, {recursive: true, force: true});
  }
  assert.equal(await exists(projectRoot, lockRelative), false);
});

test("fixture apply installs 114 outputs, archives 110 preimages, and check is repeatable", async () => {
  await withFixture(async (root) => {
    const mutable = await mutablePaths(root);
    const predecessor = await snapshot(root, mutable);
    const mutableSet = new Set(mutable);
    const unchangedPaths = (await ordinaryPaths(root))
      .filter((relativePath) => !mutableSet.has(relativePath));
    const unchangedBefore = await snapshot(root, unchangedPaths);
    const oldRuntimeBefore = await Promise.all(
      targets.map(({predecessorRuntime}) => exact(root, predecessorRuntime)),
    );
    const applied = await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "apply",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    assert.equal(applied.action, "installed");
    assert.equal(applied.inputState, "predecessor");
    assert.equal(applied.formallyManagedOutputCount, 114);
    assert.equal((await formalPaths(root)).length, 114);
    for (const relativePath of await formalPaths(root)) {
      assert.equal(await exists(root, relativePath), true, relativePath);
    }
    assert.equal(await exists(root, archiveManifestRelative), true);
    const archive = JSON.parse(await readFile(
      path.join(root, archiveManifestRelative),
      "utf8",
    ));
    assert.equal(archive.mutablePreimageCount, 110);
    assert.equal(archive.files.length, 110);
    assert.equal(archive.storage.manifestModeOctal, "0444");
    assert.equal(archive.storage.archivedFileModeOctal, "0444");
    assert.equal(archive.storage.publicationParentModeOctal, "0700");
    assert.equal(archive.storage.persistsAcrossFormalRollback, true);
    assert.equal(archive.storage.removedByTransaction, false);
    assert.equal(Number((await lstat(
      path.join(root, archiveRootRelative),
    )).mode & 0o777), 0o700);
    assert.equal(Number((await lstat(path.join(
      root,
      path.dirname(archiveRootRelative),
    ))).mode & 0o777), 0o700);
    assert.equal(Number((await lstat(
      path.join(root, archiveManifestRelative),
    )).mode & 0o777), 0o444);
    assert.equal(archive.mutablePreimageSetSha256,
      applied.predecessorMutableSet.setSha256);
    for (const row of predecessor) {
      const archived = await exact(root,
        `${path.dirname(archiveManifestRelative)}/files/${row.path}`);
      assert.equal(archived.bytes, row.bytes, `${row.path}: archive bytes`);
      assert.equal(archived.sha256, row.sha256, `${row.path}: archive SHA-256`);
      assert.equal(Number((await lstat(path.join(
        root,
        `${path.dirname(archiveManifestRelative)}/files/${row.path}`,
      ))).mode & 0o777), 0o444, `${row.path}: archive mode`);
    }
    const report = JSON.parse(await readFile(
      path.join(root, reportJsonRelative),
      "utf8",
    ));
    assert.equal(report.summary.formallyManagedOutputCount, 114);
    assert.equal(report.summary.mutableLiveSuccessorCount, 110);
    assert.equal(report.summary.companionRuntimeSuccessorCount, 2);
    assert.equal(report.summary.appendOnlyReportCount, 2);
    assert.equal(report.mutationScope.formalOutputPathAllowlist.length, 114);
    assert.equal(new Set(report.mutationScope.formalOutputPathAllowlist).size, 114);
    assert.deepEqual(report.mutationScope.formalOutputPathAllowlist,
      await formalPaths(root));
    assert.equal(report.mutationScope.currentRuntimeResolution.memberCount, 47);
    assert.equal(report.mutationScope.currentRuntimeResolution.unchangedPredecessorCount,
      45);
    assert.equal(report.mutationScope.currentRuntimeResolution.nestedParentSuccessorCount,
      2);
    assert.equal(report.reportFingerprintSha256,
      fingerprint(report, "reportFingerprintSha256"));
    assert.equal(report.generatedFrom.historicalPreapplySuite.sha256,
      "be315ace74e62deafd4fce433ad1e95ef8ee08ff56cdb5ed86b6d5c4764a44c9");
    assert.equal(report.generatedFrom.nestedParentFiveFileSuccessor.sha256,
      "0b31c8f8c9188bb9e2b35010389adf81214a0969a84e5cc969d6e3d09d659c01");
    assert.equal(report.downstreamBoundary.oldRuntimePlansRemainHistoricalAndStale,
      true);
    assert.equal(report.preimageArchive.persistsAcrossFormalRollback, true);
    assert.equal(report.preimageArchive.removedByTransaction, false);
    assert.equal(report.preimageArchive.acceptanceNeutral, true);
    assert.equal(report.generatedFrom.nativeNoReplaceMover.primitive,
      "renameatx_np(RENAME_EXCL|RENAME_NOFOLLOW_ANY)");
    assert.match(report.generatedFrom.nativeNoReplaceMover.sha256,
      /^[a-f0-9]{64}$/u);
    assert.deepEqual(
      report.generatedFrom.nativeNoReplaceMover.container,
      report.generatedBy,
    );
    assertAllAcceptanceFalse(report, "aggregate report");
    for (const {successorRuntime} of targets) {
      const runtime = JSON.parse(await readFile(
        path.join(root, successorRuntime),
        "utf8",
      ));
      assert.equal(runtime.status,
        "current-static-planning-successor-empty-non-runnable");
      assert.equal(runtime.executionGate.runnable, false);
      assert.deepEqual(runtime.emptyRuntimeAcquisitionWorksheet.executionSessions, []);
      assert.equal(runtime.provenance.downstreamSuccessorGenerator.path,
        "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs");
      assert.equal(runtime.artifactFingerprintSha256,
        fingerprint(runtime, "artifactFingerprintSha256"));
      assertAllAcceptanceFalse(runtime, runtime.identity.animationId);
    }
    assert.deepEqual(
      await Promise.all(targets.map(({predecessorRuntime}) =>
        exact(root, predecessorRuntime))),
      oldRuntimeBefore,
    );
    assert.deepEqual(await snapshot(root, unchangedPaths), unchangedBefore,
      "all preexisting non-allowlisted historical runtime/v2/v3/source bytes must remain unchanged");
    const checked = await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "check",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    assert.equal(checked.action, "verified");
    assert.equal(checked.inputState, "successor");
    assert.equal(checked.generatorResults.coverage.changedMemberCount, 0);
    assert.equal(checked.generatorResults.keyframes.changedMemberCount, 0);
    assert.deepEqual(await transactionArtifacts(root), []);
  });
});

test("an injected Nth-install failure rolls back all 114 formal outputs while persistent archive custody survives and is reused on retry", async () => {
  await withFixture(async (root) => {
    const paths = await formalPaths(root);
    const before = await snapshot(root, paths);
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        testFailAfterInstall: 73,
      }),
      /Injected transaction failure after 73 install/u,
    );
    assert.deepEqual(await snapshot(root, paths), before);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    assert.deepEqual(await transactionArtifacts(root), []);
    const archiveBeforeRetry = await protectedState(root);
    const retry = await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "apply",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    assert.equal(retry.action, "installed");
    assert.equal(retry.inputState, "predecessor");
    const archiveRowsBefore = archiveBeforeRetry.filter(({path: relativePath}) =>
      relativePath.startsWith(`${archiveRootRelative}/`) ||
      relativePath === archiveRootRelative);
    const archiveRowsAfter = (await protectedState(root))
      .filter(({path: relativePath}) =>
        relativePath.startsWith(`${archiveRootRelative}/`) ||
        relativePath === archiveRootRelative);
    assert.deepEqual(archiveRowsAfter, archiveRowsBefore);
    const checked = await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "check",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    assert.equal(checked.action, "verified");
    assert.deepEqual(await transactionArtifacts(root), []);
  });
});

test("read-set CAS catches post-stage drift before the first install", async () => {
  await withFixture(async (root) => {
    const paths = await formalPaths(root);
    const before = await snapshot(root, paths);
    let hookCalled = false;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          afterStage: async () => {
            hookCalled = true;
            const candidate = path.join(root, historicalSuiteRelative);
            const original = await readFile(candidate);
            await writeFile(candidate, Buffer.concat([original, Buffer.from("\n")]));
          },
        },
      }),
      /file identity changed after preflight|file bytes changed after preflight/u,
    );
    assert.equal(hookCalled, true);
    assert.deepEqual(await snapshot(root, paths), before);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    assert.deepEqual(await transactionArtifacts(root), []);
  });
});

test("stage cleanup preserves a foreign inode that replaces the staged snapshot", async () => {
  await withFixture(async (root) => {
    const foreignBytes = Buffer.from("foreign-stage-replacement\n");
    let foreignStagePath = null;
    let foreignBefore = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          afterStage: async ({entries}) => {
            foreignStagePath = entries[0].stagePath;
            await rm(foreignStagePath, {force: true});
            await writeFile(foreignStagePath, foreignBytes, {flag: "wx"});
            foreignBefore = await absoluteMetadata(foreignStagePath);
            const candidate = path.join(root, historicalSuiteRelative);
            await writeFile(candidate, Buffer.concat([
              await readFile(candidate),
              Buffer.from("\n"),
            ]));
          },
        },
      }),
      /cleanup|foreign|unexplained/u,
    );
    assert.ok(foreignStagePath);
    assert.deepEqual(await absoluteMetadata(foreignStagePath), foreignBefore);
    assert.deepEqual(await readFile(foreignStagePath), foreignBytes);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    assert.ok((await transactionArtifacts(root)).includes(
      path.relative(root, foreignStagePath),
    ));
  });
});

test("cleanup snapshot-to-lstat races preserve a replacement foreign lock inode", async () => {
  await withFixture(async (root) => {
    const foreignBytes = Buffer.from("foreign-cleanup-snapshot-replacement\n");
    const protectedLockPath = path.join(root, lockRelative);
    let foreignBefore = null;
    let rejection = null;
    try {
      await materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          afterCleanupSnapshot: async ({sourcePath}) => {
            if (sourcePath !== protectedLockPath || foreignBefore) return;
            await rm(sourcePath, {force: true});
            await writeFile(sourcePath, foreignBytes, {flag: "wx", mode: 0o600});
            foreignBefore = await absoluteMetadata(sourcePath);
          },
        },
      });
    } catch (error) {
      rejection = error;
    }
    assert.ok(rejection, "the cleanup snapshot race must fail closed");
    assert.match(errorChainText(rejection),
      /cleanup source changed after its exact snapshot/u);
    assert.ok(foreignBefore);
    assert.deepEqual(await absoluteMetadata(protectedLockPath), foreignBefore);
    assert.deepEqual(await readFile(protectedLockPath), foreignBytes);
    assert.equal(await exists(root, reportJsonRelative), true,
      "formal successor committed before safe lock cleanup rejection");
    assert.deepEqual(await transactionArtifacts(root), [lockRelative]);
  });
});

test("native cleanup custody-target races preserve every foreign target and the exact staged source", async () => {
  await withFixture(async (root) => {
    const foreignBytes = Buffer.from("foreign-cleanup-custody-target\n");
    let protectedStagePath = null;
    const foreignCustodyPaths = [];
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          afterStage: async ({entries}) => {
            protectedStagePath = entries.at(-1).stagePath;
            throw new Error("trigger native cleanup target race");
          },
          beforeNativeCleanup: async ({sourcePath, custodyPath}) => {
            if (sourcePath !== protectedStagePath) return;
            await writeFile(custodyPath, foreignBytes, {flag: "wx"});
            foreignCustodyPaths.push(custodyPath);
          },
        },
      }),
      /cleanup|custody|rollback action/u,
    );
    assert.ok(protectedStagePath);
    assert.equal(await exists(root, path.relative(root, protectedStagePath)), true);
    assert.ok(foreignCustodyPaths.length >= 2,
      "catch and finally cleanup must each lose no-replace to a foreign custody target");
    for (const custodyPath of foreignCustodyPaths) {
      assert.deepEqual(await readFile(custodyPath), foreignBytes);
    }
    const debris = await transactionArtifacts(root);
    assert.ok(debris.includes(path.relative(root, protectedStagePath)));
    for (const custodyPath of foreignCustodyPaths) {
      assert.ok(debris.includes(path.relative(root, custodyPath)));
    }
    assert.equal(await exists(root, lockRelative), false);
  });
});

test("acquire-write failure cannot delete a replacement foreign lock inode", async () => {
  await withFixture(async (root) => {
    const foreignBytes = Buffer.from("foreign-acquire-failure-lock\n");
    let foreignBefore = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeLockWrite: async ({lockPath, handle}) => {
            await handle.close();
            await rm(lockPath, {force: true});
            await writeFile(lockPath, foreignBytes, {flag: "wx", mode: 0o600});
            foreignBefore = await absoluteMetadata(lockPath);
          },
        },
      }),
      /lock acquisition failed.*cleanup preserved|foreign or unexplained/u,
    );
    assert.deepEqual(await absoluteMetadata(path.join(root, lockRelative)),
      foreignBefore);
    assert.deepEqual(await readFile(path.join(root, lockRelative)), foreignBytes);
    assert.equal(await exists(root, archiveParentRelative), false);
  });
});

test("normal lock release cannot delete a replacement foreign lock inode", async () => {
  await withFixture(async (root) => {
    const foreignBytes = Buffer.from("foreign-normal-release-lock\n");
    let foreignBefore = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeLockRelease: async ({lockPath}) => {
            await rm(lockPath, {force: true});
            await writeFile(lockPath, foreignBytes, {flag: "wx", mode: 0o600});
            foreignBefore = await absoluteMetadata(lockPath);
          },
        },
      }),
      /cleanup left.*lock-release|foreign or unexplained/u,
    );
    assert.deepEqual(await absoluteMetadata(path.join(root, lockRelative)),
      foreignBefore);
    assert.deepEqual(await readFile(path.join(root, lockRelative)), foreignBytes);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, reportJsonRelative), true,
      "formal successor committed before safe lock-release rejection");
    assert.deepEqual(await transactionArtifacts(root), [lockRelative]);
  });
});

test("partial or foreign absent-only runtime/report state fails before generation", async () => {
  await withFixture(async (root) => {
    const foreign = targets[0].successorRuntime;
    await mkdir(path.dirname(path.join(root, foreign)), {recursive: true});
    await writeFile(path.join(root, foreign), "{\"foreign\":true}\n", "utf8");
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /absent-only runtime\/report successor set is partial/u,
    );
    assert.equal(await exists(root, reportJsonRelative), false);
    assert.equal(await exists(root, reportMarkdownRelative), false);
    assert.equal(await exists(root, archiveManifestRelative), false);
    assert.equal(await exists(root, lockRelative), false);
  });
});

test("preexisting stage debris fails closed before clone generation", async () => {
  await withFixture(async (root) => {
    const debris = path.join(
      root,
      "reports/.g4-l10-nested-parent-downstream-successor-v1.json.999-aaaaaaaaaaaaaaaaaaaaaaaa.stage",
    );
    await mkdir(path.dirname(debris), {recursive: true});
    await writeFile(debris, "owned-unknown-debris\n", "utf8");
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /preexisting downstream transaction debris/u,
    );
    assert.equal(await exists(root, lockRelative), false);
  });
});

test("a preexisting archive directory without its deterministic manifest fails closed", async () => {
  await withFixture(async (root) => {
    const archiveRoot = path.dirname(archiveManifestRelative);
    await mkdir(path.join(root, archiveRoot), {recursive: true});
    await writeFile(path.join(root, archiveRoot, "foreign.txt"), "foreign\n", "utf8");
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /predecessor-first archive publication parent must be absent/u,
    );
    assert.equal(await exists(root, lockRelative), false);
  });
});

test("archive-parent directory, file, and symlink EEXIST races are side-effect free and never chmod a foreign or external target", async () => {
  for (const kind of ["directory", "file", "symlink"]) {
    let outside = null;
    try {
      await withFixture(async (root) => {
        let foreignPath = null;
        let foreignBefore = null;
        let outsideBefore = null;
        if (kind === "symlink") {
          outside = await mkdtemp(path.join(
            path.dirname(projectRoot),
            ".g4-l10-archive-parent-external-",
          ));
          await chmod(outside, 0o751);
          await writeFile(path.join(outside, "sentinel.txt"), "external-sentinel\n");
          outsideBefore = await absoluteMetadata(outside);
        }
        await assert.rejects(
          materializeG4L10NestedParentDownstreamSuccessorV1({
            mode: "apply",
            projectRoot: root,
            tempParent: path.dirname(root),
            transactionHooks: {
              beforeArchiveDirectoryCreate: async ({
                directoryPath,
                isArchiveParent,
              }) => {
                if (!isArchiveParent || foreignPath) return;
                foreignPath = directoryPath;
                if (kind === "directory") {
                  await mkdir(directoryPath, {mode: 0o755});
                } else if (kind === "file") {
                  await writeFile(directoryPath, "foreign-archive-parent\n", {
                    flag: "wx",
                    mode: 0o640,
                  });
                } else {
                  await symlink(outside, directoryPath, "dir");
                }
                foreignBefore = await absoluteMetadata(directoryPath);
              },
            },
          }),
          /EEXIST race.*preserved without chmod/u,
          kind,
        );
        assert.ok(foreignPath, kind);
        assert.deepEqual(await absoluteMetadata(foreignPath), foreignBefore, kind);
        if (kind === "symlink") {
          assert.deepEqual(await absoluteMetadata(outside), outsideBefore);
          assert.equal(await readFile(path.join(outside, "sentinel.txt"), "utf8"),
            "external-sentinel\n");
        }
        assert.equal(await exists(root, archiveManifestRelative), false);
        assert.equal(await exists(root, lockRelative), false);
      });
    } finally {
      if (outside) await rm(outside, {recursive: true, force: true});
    }
  }
});

test("a foreign backup target racing native live-to-backup survives without moving or overwriting the live preimage", async () => {
  await withFixture(async (root) => {
    const paths = await formalPaths(root);
    const before = await snapshot(root, paths);
    const foreignBytes = Buffer.from("foreign-backup-target\n");
    let foreignBackupPath = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeNativeMove: async ({role, targetPath}) => {
            if (!foreignBackupPath && role === "live-to-backup") {
              foreignBackupPath = targetPath;
              await writeFile(targetPath, foreignBytes, {flag: "wx"});
            }
          },
        },
      }),
      /native no-replace move failed closed|target already exists/u,
    );
    assert.ok(foreignBackupPath);
    assert.deepEqual(await readFile(foreignBackupPath), foreignBytes);
    assert.deepEqual(await snapshot(root, paths), before);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    assert.deepEqual(await transactionArtifacts(root), [
      path.relative(root, foreignBackupPath),
    ]);
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /preexisting downstream transaction debris/u,
    );
    assert.deepEqual(await readFile(foreignBackupPath), foreignBytes);
  });
});

test("a foreign rollback target survives and prevents native installed-to-rollback overwrite", async () => {
  await withFixture(async (root) => {
    const firstPath = (await mutablePaths(root))[0];
    const firstBefore = await exact(root, firstPath);
    const foreignBytes = Buffer.from("foreign-rollback-target\n");
    let foreignRollbackPath = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        testFailAfterInstall: 1,
        transactionHooks: {
          beforeNativeMove: async ({role, targetPath}) => {
            if (!foreignRollbackPath && role === "installed-to-rollback") {
              foreignRollbackPath = targetPath;
              await writeFile(targetPath, foreignBytes, {flag: "wx"});
            }
          },
        },
      }),
      /rollback action|native no-replace move failed closed/u,
    );
    assert.ok(foreignRollbackPath);
    assert.deepEqual(await readFile(foreignRollbackPath), foreignBytes);
    assert.notDeepEqual(await exact(root, firstPath), firstBefore);
    const debris = await transactionArtifacts(root);
    assert.equal(debris.filter((value) => value.endsWith(".backup")).length, 1);
    assert.equal(debris.filter((value) => value.endsWith(".stage.rollback")).length, 1);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /preexisting downstream transaction debris/u,
    );
    assert.deepEqual(await readFile(foreignRollbackPath), foreignBytes);
  });
});

test("a foreign byte injected into archive stage survives publication failure in stage or final custody and blocks retry", async () => {
  await withFixture(async (root) => {
    const paths = await formalPaths(root);
    const before = await snapshot(root, paths);
    const foreignBytes = Buffer.from("foreign-archive-byte\n");
    let injected = false;
    let archiveStagePath = null;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeNativeMove: async ({role, sourcePath}) => {
            if (!injected && role === "archive-stage-to-final") {
              injected = true;
              archiveStagePath = sourcePath;
              await writeFile(path.join(sourcePath, "foreign.bin"), foreignBytes, {
                flag: "wx",
              });
            }
          },
        },
      }),
      /archive contains missing or extra|archive custody was preserved/u,
    );
    assert.equal(injected, true);
    assert.ok(archiveStagePath);
    const finalForeign = path.join(root, archiveRootRelative, "foreign.bin");
    const stageForeign = path.join(archiveStagePath, "foreign.bin");
    const preservedForeign = await exists(root, path.relative(root, finalForeign))
      ? finalForeign
      : stageForeign;
    assert.deepEqual(await readFile(preservedForeign), foreignBytes);
    assert.deepEqual(await snapshot(root, paths), before);
    assert.equal(await exists(root, lockRelative), false);
    assert.ok((await transactionArtifacts(root)).some((relativePath) =>
      relativePath === path.relative(root, archiveStagePath)));
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "dry-run",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /preexisting archive stage debris|predecessor-first archive publication parent must be absent/u,
    );
    assert.deepEqual(await readFile(preservedForeign), foreignBytes);
  });
});

test("a native target race on an absent-only output is never overwritten", async () => {
  await withFixture(async (root) => {
    const mutable = await mutablePaths(root);
    const beforeMutable = await snapshot(root, mutable);
    const foreignPath = targets[0].successorRuntime;
    const foreignBytes = Buffer.from("{\"foreignRace\":true}\n");
    let injected = false;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeNativeMove: async ({role, targetPath}) => {
            if (!injected && role === "stage-to-live" &&
              targetPath === path.join(root, foreignPath)) {
              injected = true;
              await writeFile(targetPath, foreignBytes, {flag: "wx"});
            }
          },
        },
      }),
      /no-replace move failed closed|target already exists/u,
    );
    assert.equal(injected, true);
    assert.deepEqual(await snapshot(root, mutable), beforeMutable);
    assert.deepEqual(await readFile(path.join(root, foreignPath)), foreignBytes);
    assert.equal(await exists(root, targets[1].successorRuntime), false);
    assert.equal(await exists(root, reportJsonRelative), false);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    assert.deepEqual(await transactionArtifacts(root), []);
  });
});

test("foreign replacement during rollback is restored while the unique preimage backup is preserved", async () => {
  await withFixture(async (root) => {
    const firstPath = (await mutablePaths(root))[0];
    const firstBefore = await exact(root, firstPath);
    const foreignBytes = Buffer.from("foreign-after-install\n");
    let injected = false;
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          afterInstall: async ({entry, index}) => {
            if (!injected && index === 0) {
              injected = true;
              await writeFile(entry.absolutePath, foreignBytes);
              throw new Error("Injected foreign replacement after install");
            }
          },
        },
      }),
      /rollback action|foreign bytes|foreign replacement/u,
    );
    assert.equal(injected, true);
    assert.deepEqual(await readFile(path.join(root, firstPath)), foreignBytes);
    const debris = await transactionArtifacts(root);
    const backups = debris.filter((value) => value.endsWith(".backup"));
    assert.equal(backups.length, 1);
    const preserved = await exact(root, backups[0]);
    assert.equal(preserved.bytes, firstBefore.bytes);
    assert.equal(preserved.sha256, firstBefore.sha256);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
  });
});

test("a post-commit backup-cleanup error never rolls back the installed successor", async () => {
  await withFixture(async (root) => {
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "apply",
        projectRoot: root,
        tempParent: path.dirname(root),
        transactionHooks: {
          beforeBackupCleanup: async () => {
            throw new Error("Injected backup cleanup failure");
          },
        },
      }),
      /transaction committed.*backup cleanup/u,
    );
    assert.deepEqual(await transactionArtifacts(root), []);
    assert.equal(await exists(root, archiveManifestRelative), true);
    assert.equal(await exists(root, lockRelative), false);
    const checked = await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "check",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    assert.equal(checked.action, "verified");
    const firstPath = (await mutablePaths(root))[0];
    const archive = JSON.parse(await readFile(
      path.join(root, archiveManifestRelative),
      "utf8",
    ));
    const archivedRow = archive.files.find(({path: value}) => value === firstPath);
    assert.ok(archivedRow);
    await chmod(path.join(root, firstPath), 0o644);
    await writeFile(
      path.join(root, firstPath),
      await readFile(path.join(root, archivedRow.archivePath)),
    );
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "check",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /neither the exact predecessor nor exact successor/u,
    );
  });
});

test("tampered immutable archive mode is rejected by successor check", async () => {
  await withFixture(async (root) => {
    await materializeG4L10NestedParentDownstreamSuccessorV1({
      mode: "apply",
      projectRoot: root,
      tempParent: path.dirname(root),
    });
    const archive = JSON.parse(await readFile(
      path.join(root, archiveManifestRelative),
      "utf8",
    ));
    const candidate = archive.files[0].archivePath;
    await chmod(path.join(root, candidate), 0o644);
    await assert.rejects(
      materializeG4L10NestedParentDownstreamSuccessorV1({
        mode: "check",
        projectRoot: root,
        tempParent: path.dirname(root),
      }),
      /archived mode contract drifted|existing preimage archive differs/u,
    );
    assert.equal(await exists(root, lockRelative), false);
  });
});
