import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  G5_L4_RELEASE_ID,
  G5_L4_SOURCE_STATIC_SUCCESSOR_IDS,
  parseArguments,
  reconcileLessonM1StaticSpecification,
  validateG5L4M1StaticReconciliationReceipt,
} from "./reconcile-lesson-m1-static-specification.mjs";
import {
  OUTPUT_NAMES as CANDIDATE_OUTPUT_NAMES,
} from "./materialize-g5-l4-pre-runtime-specification-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const globalCopies = [
  "catalog/lesson-releases.json",
  "reports/g5-l4-source-scope-freeze.json",
  "catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json",
  "scripts/reconcile-lesson-m1-static-specification.mjs",
  "scripts/adopt-g5-l5-m1-static-specification.mjs",
  "scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs",
  "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json",
];

const memberCopies = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "asset-inventory.csv",
  "audio-inventory.csv",
  "keyframes.csv",
  "evidence/full-frame-coverage.json",
  "audit/machine/g5-l4-source-scope-binding.json",
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.receipt}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.manifestRuntimeFacts}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.assetDefinitionCensus}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.definitionInventory}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.scriptInventory}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.dependencyInventory}`,
  `audit/machine/${CANDIDATE_OUTPUT_NAMES.briefStaticPrefill}`,
  "audit/script-inventory.json",
  "audit/dependency-inventory.json",
  `audit/machine/${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`,
  "audit/machine/g5-l4-source-derived-asset-inventory-candidate-receipt.json",
  "audit/machine/report.json",
];

const protectedSuffixes = [
  "asset-inventory.csv",
  "audio-inventory.csv",
  "keyframes.csv",
  "evidence/full-frame-coverage.json",
];

const acceptanceEffects = {
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function copyRelative(root, relativePath) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), target);
}

async function readRelease(root = projectRoot) {
  const catalog = JSON.parse(
    await readFile(path.join(root, "catalog/lesson-releases.json"), "utf8"),
  );
  return catalog.releases.find(
    ({releaseId}) => releaseId === G5_L4_RELEASE_ID,
  );
}

async function makeFixture(t) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "lesson-m1-static-reconcile-"),
  );
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  await Promise.all(
    globalCopies.map((relativePath) => copyRelative(root, relativePath)),
  );
  const release = await readRelease(root);
  for (const member of release.members) {
    await Promise.all(
      memberCopies.map((suffix) =>
        copyRelative(
          root,
          `migrations/${member.animationId}/${suffix}`,
        ),
      ),
    );
  }
  return {root, release};
}

async function snapshot(root, paths) {
  return new Map(
    await Promise.all(
      paths.map(async (relativePath) => {
        const bytes = await readFile(path.join(root, relativePath));
        const info = await lstat(path.join(root, relativePath));
        return [
          relativePath,
          {
            bytes,
            sha256: sha256(bytes),
            mode: info.mode & 0o777,
          },
        ];
      }),
    ),
  );
}

function memberPath(member, suffix) {
  return `migrations/${member.animationId}/${suffix}`;
}

function outputPaths(release) {
  return release.members.flatMap((member) => [
    memberPath(member, "migration.json"),
    memberPath(member, "MIGRATION_BRIEF.md"),
    memberPath(member, "audit/script-inventory.json"),
    memberPath(member, "audit/dependency-inventory.json"),
    memberPath(
      member,
      `audit/machine/${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`,
    ),
  ]);
}

function protectedPaths(release) {
  return release.members.flatMap((member) =>
    protectedSuffixes.map((suffix) => memberPath(member, suffix)),
  );
}

async function assertAbsent(root, paths) {
  for (const relativePath of paths) {
    await assert.rejects(
      lstat(path.join(root, relativePath)),
      (error) => error?.code === "ENOENT",
    );
  }
}

test("CLI requires an exact supported release and one explicit mode", () => {
  assert.deepEqual(G5_L4_SOURCE_STATIC_SUCCESSOR_IDS, [
    "course-g05-l04-rw-002",
    "course-g05-l04-vb-002",
    "course-g05-l04-vb-005",
    "course-g05-l04-vb-006",
    "course-g05-l04-in-009",
    "course-g05-l04-in-015",
    "course-g05-l04-ts-006",
    "course-g05-l04-ts-003",
    "course-g05-l04-ts-002",
    "course-g05-l04-ts-005",
    "course-g05-l04-ts-004",
    "course-g05-l04-vb-008",
    "course-g05-l04-vb-009",
    "course-g05-l04-in-020",
    "course-g05-l04-in-012",
    "course-g05-l04-rw-003",
    "course-g05-l04-rw-004",
    "course-g05-l04-in-002",
    "course-g05-l04-in-007",
    "course-g05-l04-vb-007",
    "course-g05-l04-vb-010",
    "course-g05-l04-vb-011",
    "course-g05-l04-in-003",
    "course-g05-l04-in-004",
    "course-g05-l04-in-005",
    "course-g05-l04-in-010",
    "course-g05-l04-in-013",
    "course-g05-l04-in-014",
    "course-g05-l04-in-016",
    "course-g05-l04-in-017",
    "course-g05-l04-in-018",
    "course-g05-l04-ts-007",
    "course-g05-l04-ts-008",
    "course-g05-l04-vb-003",
    "course-g05-l04-vb-004",
    "course-g05-l04-in-006",
    "course-g05-l04-in-008",
    "course-g05-l04-in-011",
    "course-g05-l04-in-019",
    "course-g05-l04-in-021",
    "course-g05-l04-in-022",
    "course-g05-l04-ti-002",
    "course-g05-l04-ti-003",
    "course-g05-l04-ti-004",
    "course-g05-l04-ti-005",
    "course-g05-l04-ti-006",
    "course-g05-l04-ti-007",
    "course-g05-l04-ti-008",
    "course-g05-l04-ti-009",
    "course-g05-l04-gs-002",
    "course-g05-l04-ir-001-a662633d",
  ]);
  assert.deepEqual(
    parseArguments(["--release-id", G5_L4_RELEASE_ID]),
    {
      releaseId: G5_L4_RELEASE_ID,
      mode: "dry-run",
      help: false,
    },
  );
  assert.deepEqual(
    parseArguments([
      "--release-id",
      G5_L4_RELEASE_ID,
      "--check",
    ]),
    {
      releaseId: G5_L4_RELEASE_ID,
      mode: "check",
      help: false,
    },
  );
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () =>
      parseArguments([
        "--release-id",
        G5_L4_RELEASE_ID,
        "--apply",
        "--check",
      ]),
    /choose exactly one/,
  );
  assert.throws(
    () => parseArguments(["--release-id", "lesson-unknown"]),
    /unsupported/,
  );
});

test("real post-adoption G5 L4 dry-run verifies exactly 55 members without writing", async () => {
  const release = await readRelease();
  const paths = release.members.flatMap((member) => [
    memberPath(member, "migration.json"),
    memberPath(member, "MIGRATION_BRIEF.md"),
    ...protectedSuffixes.map((suffix) => memberPath(member, suffix)),
  ]);
  const before = await snapshot(projectRoot, paths);
  const result = await reconcileLessonM1StaticSpecification({
    root: projectRoot,
    releaseId: G5_L4_RELEASE_ID,
    mode: "dry-run",
  });
  const after = await snapshot(projectRoot, paths);
  assert.equal(result.memberCount, 55);
  assert.equal(result.outputCount, 275);
  assert.equal(result.changedOutputCount, 0);
  assert.equal(result.applied, false);
  assert.deepEqual(result.acceptanceEffects, acceptanceEffects);
  for (const relativePath of paths) {
    assert.equal(
      after.get(relativePath).sha256,
      before.get(relativePath).sha256,
      relativePath,
    );
  }
});

test("temporary-root post-adoption apply is an acceptance-neutral no-op and remains checkable", async (t) => {
  const {root, release} = await makeFixture(t);
  const observedPaths = [
    ...outputPaths(release),
    ...protectedPaths(release),
  ];
  const before = await snapshot(root, observedPaths);

  const applied = await reconcileLessonM1StaticSpecification({
    root,
    releaseId: G5_L4_RELEASE_ID,
    mode: "apply",
  });
  assert.equal(applied.memberCount, 55);
  assert.equal(applied.changedOutputCount, 0);
  assert.equal(applied.applied, false);
  assert.deepEqual(applied.acceptanceEffects, acceptanceEffects);

  const checked = await reconcileLessonM1StaticSpecification({
    root,
    releaseId: G5_L4_RELEASE_ID,
    mode: "check",
  });
  assert.equal(checked.changedOutputCount, 0);
  assert.equal(checked.applied, false);
  assert.deepEqual(checked.acceptanceEffects, acceptanceEffects);

  const after = await snapshot(root, observedPaths);
  for (const relativePath of observedPaths) {
    assert.equal(
      after.get(relativePath).sha256,
      before.get(relativePath).sha256,
      relativePath,
    );
  }
  for (const member of release.members) {
    const receipt = JSON.parse(
      await readFile(
        path.join(
          root,
          memberPath(
            member,
            `audit/machine/${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`,
          ),
        ),
        "utf8",
      ),
    );
    validateG5L4M1StaticReconciliationReceipt(receipt, member);
    assert.deepEqual(receipt.acceptanceEffects, acceptanceEffects);
    assert.equal(receipt.execution.runtimeSessionsExecuted, 0);
    assert.equal(receipt.execution.guiApplicationsLaunched, 0);
    assert.equal(receipt.execution.legacyEndpointsExecuted, 0);
    assert.equal(receipt.reconciliation.audioRequirementRaised, false);
    assert.deepEqual(Object.keys(receipt.outputs).sort(), [
      "dependencyInventory",
      "migrationBrief",
      "migrationManifest",
      "scriptInventory",
    ]);
  }
});

test("all members preflight before apply writes any output", async (t) => {
  const {root, release} = await makeFixture(t);
  const first = release.members[0];
  const last = release.members.at(-1);
  const firstManifestPath = memberPath(first, "migration.json");
  const before = await readFile(path.join(root, firstManifestPath));
  const receiptPaths = release.members.map((member) =>
    memberPath(
      member,
      `audit/machine/${G5_L4_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`,
    ));
  const receiptsBefore = await snapshot(root, receiptPaths);
  await writeFile(
    path.join(root, memberPath(last, "keyframes.csv")),
    "foreign-drift\n",
  );
  await assert.rejects(
    reconcileLessonM1StaticSpecification({
      root,
      releaseId: G5_L4_RELEASE_ID,
      mode: "apply",
    }),
    /source-derived keyframe successor boundary or binding drifted/,
  );
  assert.deepEqual(
    await readFile(path.join(root, firstManifestPath)),
    before,
  );
  const receiptsAfter = await snapshot(root, receiptPaths);
  for (const relativePath of receiptPaths) {
    assert.equal(
      receiptsAfter.get(relativePath).sha256,
      receiptsBefore.get(relativePath).sha256,
      relativePath,
    );
  }
});

test("symlink, hardlink, and symlink-ancestor inputs fail closed", async (t) => {
  for (const variant of ["symlink", "hardlink", "ancestor"]) {
    await t.test(variant, async (t) => {
      const {root, release} = await makeFixture(t);
      const member = release.members.at(-1);
      const relativePath = memberPath(member, "keyframes.csv");
      const absolutePath = path.join(root, relativePath);
      const foreign = path.join(root, `${variant}-foreign`);
      await writeFile(foreign, await readFile(absolutePath));
      if (variant === "ancestor") {
        const auditDirectory = path.join(
          root,
          `migrations/${member.animationId}/audit`,
        );
        const moved = `${auditDirectory}-ordinary`;
        await rm(moved, {recursive: true, force: true});
        await import("node:fs/promises").then(({rename}) =>
          rename(auditDirectory, moved),
        );
        await symlink(moved, auditDirectory);
      } else {
        await unlink(absolutePath);
        if (variant === "symlink") {
          await symlink(foreign, absolutePath);
        } else {
          await link(foreign, absolutePath);
        }
      }
      await assert.rejects(
        reconcileLessonM1StaticSpecification({
          root,
          releaseId: G5_L4_RELEASE_ID,
          mode: "apply",
        }),
        /ordinary|single-link/,
      );
    });
  }
});

test("historical-successor policy rejects candidate acceptance promotion and narrowed coverage", async (t) => {
  await t.test("manifest boundary", async (t) => {
    const {root} = await makeFixture(t);
    const id = "course-g05-l04-vb-002";
    const manifestPath = path.join(root, "migrations", id, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.implementation.candidateState.ownerReviewPerformed = true;
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await assert.rejects(
      reconcileLessonM1StaticSpecification({
        root,
        releaseId: G5_L4_RELEASE_ID,
        mode: "check",
      }),
      /bounded source-static successor/,
    );
  });

  await t.test("coverage boundary", async (t) => {
    const {root} = await makeFixture(t);
    const id = "course-g05-l04-vb-002";
    const coveragePath = path.join(
      root,
      "migrations",
      id,
      "evidence/full-frame-coverage.json",
    );
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    coverage.requirements[0].capturedFrameCount = 1;
    coverage.requirements[0].missingFrames.shift();
    await writeFile(
      coveragePath,
      `${JSON.stringify(coverage, null, 2)}\n`,
    );
    await assert.rejects(
      reconcileLessonM1StaticSpecification({
        root,
        releaseId: G5_L4_RELEASE_ID,
        mode: "check",
      }),
      /coverage was promoted or narrowed/,
    );
  });
});
