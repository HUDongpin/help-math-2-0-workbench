import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
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
  G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  g5L5M1StaticReconciliationReceiptPath,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
  G5_L5_STATIC_STRICT_READINESS_STATE,
  buildG5L5StaticStrictReadiness,
  g5L5StaticStrictReadinessPath,
  parseArguments,
  stableJson,
  validateG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RELEASE_PATH = "catalog/lesson-releases.json";
const SOURCE_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const AUDIO_OWNERSHIP_PATH =
  "reports/g5-l5-audio-ownership-readiness.json";
const GENERATOR_PATH =
  "scripts/build-g5-l5-static-strict-readiness.mjs";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const MEMBER_INPUTS = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "audit/machine/report.json",
  "audit/machine/g5-l5-source-scope-binding.json",
  "audit/audio-runtime-evidence.json",
  "evidence/full-frame-coverage.json",
];
const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeRelative(root, relativePath, contents) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await writeFile(destination, contents);
  return destination;
}

async function copyRelative(root, relativePath) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), destination);
  return destination;
}

async function readJson(root, relativePath) {
  return JSON.parse(
    await readFile(path.join(root, relativePath), "utf8"),
  );
}

async function writeJson(root, relativePath, document) {
  await writeRelative(root, relativePath, stableJson(document));
}

function descriptor(relativePath, bytes) {
  return {
    path: relativePath,
    exists: true,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function fingerprintReceipt(receipt) {
  const projected = structuredClone(receipt);
  delete projected.receiptFingerprintSha256;
  return {
    ...projected,
    receiptFingerprintSha256: sha256(stableJson(projected)),
  };
}

async function buildM1Receipt(root, member, ownerDirective) {
  const workspace = `migrations/${member.animationId}`;
  const scriptPath = `${workspace}/audit/script-inventory.json`;
  const dependencyPath =
    `${workspace}/audit/dependency-inventory.json`;
  await writeJson(root, scriptPath, {
    schemaVersion: 1,
    artifactType: "g5-l5-canonical-static-script-inventory",
    releaseId: G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
    animationId: member.animationId,
    scripts: [],
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
  await writeJson(root, dependencyPath, {
    schemaVersion: 1,
    artifactType: "g5-l5-canonical-static-dependency-inventory",
    releaseId: G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
    animationId: member.animationId,
    candidates: [],
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });

  const outputPaths = {
    migrationManifest: `${workspace}/migration.json`,
    migrationBrief: `${workspace}/MIGRATION_BRIEF.md`,
    scriptInventory: scriptPath,
    dependencyInventory: dependencyPath,
  };
  const outputs = {};
  for (const [name, relativePath] of Object.entries(outputPaths)) {
    const bytes = await readFile(path.join(root, relativePath));
    const current = descriptor(relativePath, bytes);
    outputs[name] = {
      before: current,
      after: current,
    };
  }
  const base = {
    schemaVersion: 1,
    artifactType: "g5-l5-m1-static-reconciliation-receipt",
    releaseId: G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    reconciliation: {
      applied: true,
      machineOnlyStatic: true,
      canonicalOutputCount: 4,
      audioRequirementRaised: false,
    },
    summary: {
      scriptCount: 0,
      dependencyApiCandidateCount: 0,
      dependencyOccurrenceCount: 0,
      manifestStaticFactsReconciled: true,
      migrationBriefStaticReconciled: true,
      complexityResolved: false,
      rendererSelected: false,
      runtimeReachabilityResolved: false,
    },
    ownerDirective: {
      path: G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
      bytes: ownerDirective.bytes,
      sha256: ownerDirective.sha256,
      receiptFingerprintSha256:
        ownerDirective.document.receiptFingerprintSha256,
      m1MachineOnlyEffective: true,
    },
    inputBindingSemantics: {
      candidateArtifacts:
        "historical-at-adoption-do-not-require-current-path-byte-identity",
      protectedCanonicalPreimages:
        "current-through-adoption-recorded-as-output-before-or-immutable-input",
    },
    inputs: {},
    outputs,
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
    },
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  await writeJson(
    root,
    g5L5M1StaticReconciliationReceiptPath(member.animationId),
    fingerprintReceipt(base),
  );
}

async function createFixture() {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-readiness-"),
  );
  const root = await realpath(temporaryRoot);
  for (const relativePath of [
    GENERATOR_PATH,
    RELEASE_PATH,
    SOURCE_SCOPE_PATH,
    AUDIO_OWNERSHIP_PATH,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  ]) {
    await copyRelative(root, relativePath);
  }
  const catalog = await readJson(root, RELEASE_PATH);
  const release = catalog.releases.find(
    ({releaseId}) =>
      releaseId === G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
  );
  assert.equal(release.members.length, 57);
  const ownerBytes = await readFile(
    path.join(root, G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH),
  );
  const ownerDirective = {
    document: JSON.parse(ownerBytes.toString("utf8")),
    bytes: ownerBytes.length,
    sha256: sha256(ownerBytes),
  };
  for (const member of release.members) {
    for (const suffix of MEMBER_INPUTS) {
      await copyRelative(
        root,
        `migrations/${member.animationId}/${suffix}`,
      );
    }
    await copyRelative(root, `${SOURCE_PREFIX}${member.source.path}`);
    await buildM1Receipt(root, member, ownerDirective);
  }
  return {root, release};
}

async function outputCount(root, release) {
  let count = 0;
  for (const member of release.members) {
    if (
      await exists(
        path.join(
          root,
          g5L5StaticStrictReadinessPath(member.animationId),
        ),
      )
    ) {
      count += 1;
    }
  }
  return count;
}

async function mutateReceipt(root, member, mutate) {
  const relativePath =
    g5L5M1StaticReconciliationReceiptPath(member.animationId);
  const original = await readFile(path.join(root, relativePath));
  const receipt = JSON.parse(original.toString("utf8"));
  mutate(receipt);
  await writeJson(root, relativePath, fingerprintReceipt(receipt));
  return async () => writeRelative(root, relativePath, original);
}

test("CLI requires one explicit non-mutating or mutating mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {
    help: false,
    mode: "dry-run",
  });
  assert.deepEqual(parseArguments(["--check"]), {
    help: false,
    mode: "check",
  });
  assert.deepEqual(parseArguments(["--apply"]), {
    help: false,
    mode: "apply",
  });
  assert.deepEqual(parseArguments(["--help"]), {help: true});
  assert.throws(
    () => parseArguments([]),
    /explicitly choose one/,
  );
  assert.throws(
    () => parseArguments(["--check", "--apply"]),
    /choose exactly one/,
  );
  assert.throws(
    () => parseArguments(["--unknown"]),
    /Unknown option/,
  );
});

test(
  "57-member M1 readiness stays fail-closed and transactional",
  {timeout: 120_000},
  async (t) => {
    const fixture = await createFixture();
    const {root, release} = fixture;
    const first = release.members[0];
    const second = release.members[1];
    try {
      await t.test("missing M1 receipt aborts before every output", async () => {
        const receiptPath = path.join(
          root,
          g5L5M1StaticReconciliationReceiptPath(first.animationId),
        );
        const original = await readFile(receiptPath);
        await unlink(receiptPath);
        try {
          await assert.rejects(
            buildG5L5StaticStrictReadiness({
              projectRoot: root,
              mode: "dry-run",
            }),
            new RegExp(
              `${first.animationId}.*required M1 static reconciliation receipt`,
            ),
          );
          assert.equal(await outputCount(root, release), 0);
        } finally {
          await writeRelative(
            root,
            g5L5M1StaticReconciliationReceiptPath(first.animationId),
            original,
          );
        }
      });

      await t.test("promotion in an M1 receipt is rejected", async () => {
        const restore = await mutateReceipt(root, first, (receipt) => {
          receipt.acceptanceEffects.strictComplete = true;
        });
        try {
          await assert.rejects(
            buildG5L5StaticStrictReadiness({
              projectRoot: root,
              mode: "dry-run",
            }),
            /acceptanceEffects|must be false|acceptance effect|acceptance boundary.*all false/i,
          );
          assert.equal(await outputCount(root, release), 0);
        } finally {
          await restore();
        }
      });

      await t.test("wrong member and wrong output hash are rejected", async () => {
        let restore = await mutateReceipt(root, first, (receipt) => {
          receipt.animationId = "course-g05-l05-wrong-member";
        });
        try {
          await assert.rejects(
            buildG5L5StaticStrictReadiness({
              projectRoot: root,
              mode: "dry-run",
            }),
            /receipt identity drifted/,
          );
        } finally {
          await restore();
        }
        restore = await mutateReceipt(root, first, (receipt) => {
          receipt.outputs.scriptInventory.after.sha256 = "0".repeat(64);
        });
        try {
          await assert.rejects(
            buildG5L5StaticStrictReadiness({
              projectRoot: root,
              mode: "dry-run",
            }),
            /bytes changed after receipt|no longer matches the receipt postimage/,
          );
          assert.equal(await outputCount(root, release), 0);
        } finally {
          await restore();
        }
      });

      await t.test("symlink and hard-link outputs are refused", async () => {
        const relativeOutput =
          g5L5StaticStrictReadinessPath(first.animationId);
        const outputPath = path.join(root, relativeOutput);
        const foreignPath = path.join(
          path.dirname(outputPath),
          "foreign-readiness.json",
        );
        await writeFile(foreignPath, "{}\n");
        await symlink("foreign-readiness.json", outputPath);
        await assert.rejects(
          buildG5L5StaticStrictReadiness({
            projectRoot: root,
            mode: "dry-run",
          }),
          /one ordinary non-linked file/,
        );
        await unlink(outputPath);
        await link(foreignPath, outputPath);
        await assert.rejects(
          buildG5L5StaticStrictReadiness({
            projectRoot: root,
            mode: "dry-run",
          }),
          /one ordinary non-linked file/,
        );
        await unlink(outputPath);
        await unlink(foreignPath);
        assert.equal(await outputCount(root, release), 0);
      });

      await t.test("project-contained input ancestor symlinks are refused", async () => {
        const workspace = path.join(
          root,
          "migrations",
          first.animationId,
        );
        const machine = path.join(workspace, "audit", "machine");
        const machineReal = path.join(
          workspace,
          "audit",
          "machine-real",
        );
        await rename(machine, machineReal);
        await symlink("machine-real", machine);
        try {
          await assert.rejects(
            buildG5L5StaticStrictReadiness({
              projectRoot: root,
              mode: "dry-run",
            }),
            /ancestor must be a real directory/,
          );
          assert.equal(await outputCount(root, release), 0);
        } finally {
          await unlink(machine);
          await rename(machineReal, machine);
        }
      });

      await t.test("dry-run is deterministic and writes nothing", async () => {
        const firstPlan = await buildG5L5StaticStrictReadiness({
          projectRoot: root,
          mode: "dry-run",
        });
        const secondPlan = await buildG5L5StaticStrictReadiness({
          projectRoot: root,
          mode: "dry-run",
        });
        assert.deepEqual(secondPlan, firstPlan);
        assert.equal(firstPlan.memberCount, 57);
        assert.equal(
          firstPlan.state,
          G5_L5_STATIC_STRICT_READINESS_STATE,
        );
        assert.equal(firstPlan.implementationAuthorized, false);
        assert.equal(firstPlan.originalRuntimeLaunched, false);
        assert.equal(firstPlan.audioAccepted, false);
        assert.equal(firstPlan.strictCompleteCount, 0);
        assert.equal(firstPlan.publishedCount, 0);
        assert.equal(await outputCount(root, release), 0);
      });

      await t.test("failed first commit rolls back an empty target set", async () => {
        await assert.rejects(
          buildG5L5StaticStrictReadiness({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              afterCommit({index}) {
                if (index === 0) {
                  throw new Error("injected after-commit failure");
                }
              },
            },
          }),
          /injected after-commit failure/,
        );
        assert.equal(await outputCount(root, release), 0);
      });

      await t.test("apply writes all 57 and check validates exact bytes", async () => {
        const applied = await buildG5L5StaticStrictReadiness({
          projectRoot: root,
          mode: "apply",
        });
        assert.equal(applied.action, "written");
        assert.equal(await outputCount(root, release), 57);
        const checked = await buildG5L5StaticStrictReadiness({
          projectRoot: root,
          mode: "check",
        });
        assert.equal(checked.action, "verified");
        assert.deepEqual(checked.outputs, applied.outputs);
        for (const member of release.members) {
          const document = await readJson(
            root,
            g5L5StaticStrictReadinessPath(member.animationId),
          );
          assert.equal(
            validateG5L5StaticStrictReadiness(document, member),
            true,
          );
          assert.equal(document.state, G5_L5_STATIC_STRICT_READINESS_STATE);
          assert.equal(document.acceptance.strictMigrationComplete, false);
          assert.equal(document.acceptance.audioAccepted, false);
          assert.equal(document.acceptance.humanVisualAccepted, false);
          assert.equal(document.acceptance.ownerAccepted, false);
          assert.equal(document.acceptance.published, false);
          assert.equal(
            document.implementationReadiness.implementationAuthorized,
            false,
          );
        }
      });

      await t.test("promoted strict-readiness document fails validation", async () => {
        const document = await readJson(
          root,
          g5L5StaticStrictReadinessPath(first.animationId),
        );
        document.acceptance.strictMigrationComplete = true;
        assert.throws(
          () => validateG5L5StaticStrictReadiness(document, first),
          /strictMigrationComplete must remain false/,
        );
      });

      await t.test("target CAS failure restores earlier committed output", async () => {
        const firstOutput = path.join(
          root,
          g5L5StaticStrictReadinessPath(first.animationId),
        );
        const secondOutput = path.join(
          root,
          g5L5StaticStrictReadinessPath(second.animationId),
        );
        const firstBefore = await readFile(firstOutput);
        const secondBefore = await readFile(secondOutput);
        await assert.rejects(
          buildG5L5StaticStrictReadiness({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index, outputPath}) {
                if (index === 1) {
                  assert.equal(outputPath, secondOutput);
                  await writeFile(outputPath, "{\"foreign\":true}\n");
                }
              },
            },
          }),
          /changed during commit CAS/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        assert.equal(
          (await readFile(secondOutput, "utf8")),
          "{\"foreign\":true}\n",
        );
        await writeFile(secondOutput, secondBefore);
      });

      await t.test("input CAS failure restores earlier committed output", async () => {
        const firstOutput = path.join(
          root,
          g5L5StaticStrictReadinessPath(first.animationId),
        );
        const receiptPath = path.join(
          root,
          g5L5M1StaticReconciliationReceiptPath(first.animationId),
        );
        const outputBefore = await readFile(firstOutput);
        const receiptBefore = await readFile(receiptPath);
        await assert.rejects(
          buildG5L5StaticStrictReadiness({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index}) {
                if (index === 1) {
                  await writeFile(
                    receiptPath,
                    Buffer.concat([receiptBefore, Buffer.from("\n")]),
                  );
                }
              },
            },
          }),
          /input changed after preflight/,
        );
        assert.deepEqual(await readFile(firstOutput), outputBefore);
        await writeFile(receiptPath, receiptBefore);
      });
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);
