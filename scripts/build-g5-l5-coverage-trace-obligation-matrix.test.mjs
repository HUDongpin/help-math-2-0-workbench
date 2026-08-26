import assert from "node:assert/strict";
import {
  chmod,
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
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
  MEMBER_OUTPUT_NAME,
  REPORT_JSON_PATH,
  REPORT_MARKDOWN_PATH,
  RELEASE_ID,
  buildG5L5CoverageTraceObligationMatrix,
  g5L5CoverageTraceObligationPlanPath,
  parseArguments,
  validateG5L5CoverageTraceObligationPlan,
  validateG5L5CoverageTraceObligationReport,
} from "./build-g5-l5-coverage-trace-obligation-matrix.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RELEASE_PATH = "catalog/lesson-releases.json";
const GENERATOR_PATH =
  "scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs";
const MEMBER_INPUTS = [
  "migration.json",
  "asset-inventory.csv",
  "keyframes.csv",
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  "audit/scenario-inventory.json",
  "audit/frame-domain-disposition.json",
  "evidence/full-frame-coverage.json",
  "audit/strict-readiness.json",
];

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function copyRelative(root, relativePath) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), destination);
}

async function createFixture() {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-coverage-trace-matrix-"),
  );
  const root = await realpath(temporary);
  await copyRelative(root, RELEASE_PATH);
  await copyRelative(root, GENERATOR_PATH);
  const catalog = JSON.parse(
    await readFile(path.join(root, RELEASE_PATH), "utf8"),
  );
  const release = catalog.releases.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  assert.equal(release.members.length, 57);
  for (const member of release.members) {
    for (const suffix of MEMBER_INPUTS) {
      await copyRelative(
        root,
        `migrations/${member.animationId}/${suffix}`,
      );
    }
    const disposition = JSON.parse(
      await readFile(
        path.join(
          root,
          `migrations/${member.animationId}/audit/frame-domain-disposition.json`,
        ),
        "utf8",
      ),
    );
    if (
      disposition.summary?.dispositionCounts
        ?.["composite-child-with-parent"] > 0
    ) {
      await copyRelative(
        root,
        `migrations/${member.animationId}/audit/static-frame-domain-disposition-evidence.json`,
      );
    }
  }
  await mkdir(path.join(root, "reports"), {recursive: true});
  return {root, release};
}

async function transactionResidue(root, release) {
  const parents = new Set(
    (await outputPaths(root, release)).map((candidate) =>
      path.dirname(candidate)),
  );
  const residue = [];
  for (const parent of parents) {
    for (const name of await readdir(parent)) {
      if (name.includes(".stage-") || name.includes(".backup-")) {
        residue.push(path.join(parent, name));
      }
    }
  }
  return residue.sort();
}

async function outputPaths(root, release) {
  return [
    ...release.members.map(({animationId}) =>
      path.join(
        root,
        g5L5CoverageTraceObligationPlanPath(animationId),
      )),
    path.join(root, REPORT_JSON_PATH),
    path.join(root, REPORT_MARKDOWN_PATH),
  ];
}

async function existingOutputCount(root, release) {
  let count = 0;
  for (const candidate of await outputPaths(root, release)) {
    if (await exists(candidate)) count += 1;
  }
  return count;
}

test("CLI requires one explicit mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {
    help: false,
    mode: "dry-run",
  });
  assert.deepEqual(parseArguments(["--apply"]), {
    help: false,
    mode: "apply",
  });
  assert.deepEqual(parseArguments(["--check"]), {
    help: false,
    mode: "check",
  });
  assert.deepEqual(parseArguments(["--help"]), {help: true});
  assert.throws(() => parseArguments([]), /explicitly choose one/);
  assert.throws(
    () => parseArguments(["--dry-run", "--apply"]),
    /choose exactly one/,
  );
  assert.throws(
    () => parseArguments(["--unknown"]),
    /Unknown option/,
  );
});

test(
  "current G5 L5 dry-run resolves the exact fail-closed totals",
  {timeout: 120_000},
  async () => {
    const result = await buildG5L5CoverageTraceObligationMatrix({
      projectRoot,
      mode: "dry-run",
    });
    assert.equal(result.action, "planned");
    assert.equal(result.memberCount, 57);
    assert.equal(result.outputCount, 59);
    assert.equal(result.rootOnlyRequirementCount, 114);
    assert.equal(result.pendingRequirementCount, 114);
    assert.equal(result.missingFrameCount, 1220);
    assert.equal(result.nestedDefinitionCount, 1232);
    assert.equal(result.unresolvedChildDomainCount, 351);
    assert.equal(result.evidenceBoundCompositeChildCount, 696);
    assert.equal(result.excludedNotProvenDefinitionCount, 185);
    assert.equal(result.longerThanRootDefinitionCount, 258);
    assert.equal(result.highRiskIndependentCandidateCount, 93);
    assert.equal(result.buttonObligationCount, 578);
    assert.equal(result.dragObligationCount, 231);
    assert.equal(result.branchObligationCount, 745);
    assert.equal(result.randomObligationCount, 28);
    assert.equal(result.canonicalCoverageWritten, false);
    assert.equal(result.canonicalKeyframesWritten, false);
    assert.equal(result.traceSpecsCreated, 0);
    assert.equal(result.rendererSelected, false);
    assert.equal(result.guiApplicationsLaunched, 0);
    assert.equal(result.originalRuntimeSessionsExecuted, 0);
    assert.equal(result.acceptanceAdvanced, false);
  },
);

test(
  "59-output transaction is link-safe, CAS-bound, and reversible",
  {timeout: 180_000},
  async (t) => {
    const fixture = await createFixture();
    const {root, release} = fixture;
    const [first, second] = release.members;
    const firstOutput = path.join(
      root,
      g5L5CoverageTraceObligationPlanPath(first.animationId),
    );
    const secondOutput = path.join(
      root,
      g5L5CoverageTraceObligationPlanPath(second.animationId),
    );
    try {
      await t.test("dry-run writes no managed output", async () => {
        const firstPlan = await buildG5L5CoverageTraceObligationMatrix({
          projectRoot: root,
          mode: "dry-run",
        });
        const secondPlan = await buildG5L5CoverageTraceObligationMatrix({
          projectRoot: root,
          mode: "dry-run",
        });
        assert.deepEqual(secondPlan, firstPlan);
        assert.equal(await existingOutputCount(root, release), 0);
      });

      await t.test("symlink and hard-linked outputs are refused", async () => {
        const foreign = path.join(path.dirname(firstOutput), "foreign.json");
        await writeFile(foreign, "{}\n");
        await symlink("foreign.json", firstOutput);
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "dry-run",
          }),
          /ordinary non-linked file/,
        );
        await unlink(firstOutput);
        await link(foreign, firstOutput);
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "dry-run",
          }),
          /ordinary non-linked file/,
        );
        await unlink(firstOutput);
        await unlink(foreign);
        assert.equal(await existingOutputCount(root, release), 0);
      });

      await t.test("input ancestor symlinks are refused", async () => {
        const workspace = path.join(
          root,
          "migrations",
          first.animationId,
        );
        const evidence = path.join(workspace, "evidence");
        const evidenceReal = path.join(workspace, "evidence-real");
        await rename(evidence, evidenceReal);
        await symlink("evidence-real", evidence);
        try {
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "dry-run",
            }),
            /ancestor must be a real directory/,
          );
          assert.equal(await existingOutputCount(root, release), 0);
        } finally {
          await unlink(evidence);
          await rename(evidenceReal, evidence);
        }
      });

      await t.test("symlink and hard-linked inputs are refused", async () => {
        const coverage = path.join(
          root,
          "migrations",
          first.animationId,
          "evidence",
          "full-frame-coverage.json",
        );
        const realCoverage = `${coverage}.real`;
        await rename(coverage, realCoverage);
        await symlink(path.basename(realCoverage), coverage);
        try {
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "dry-run",
            }),
            /ordinary non-linked file/,
          );
        } finally {
          await unlink(coverage);
          await rename(realCoverage, coverage);
        }
        const hardLink = `${coverage}.hard-link`;
        await link(coverage, hardLink);
        try {
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "dry-run",
            }),
            /ordinary non-linked file/,
          );
        } finally {
          await unlink(hardLink);
        }
      });

      await t.test("middle failure rolls back an empty target set", async () => {
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              afterCommit({index}) {
                if (index === 1) {
                  throw new Error("injected transaction failure");
                }
              },
            },
          }),
          /injected transaction failure/,
        );
        assert.equal(await existingOutputCount(root, release), 0);
      });

      await t.test("stage-N failure leaves no staged residue", async () => {
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              afterStage({index}) {
                if (index === 1) {
                  throw new Error("injected stage-N failure");
                }
              },
            },
          }),
          /injected stage-N failure/,
        );
        assert.equal(await existingOutputCount(root, release), 0);
        assert.deepEqual(await transactionResidue(root, release), []);
      });

      await t.test("apply writes 57 plans and two reports; check is exact", async () => {
        const protectedBefore = new Map();
        for (const member of release.members) {
          for (const suffix of [
            "migration.json",
            "asset-inventory.csv",
            "keyframes.csv",
            "evidence/full-frame-coverage.json",
          ]) {
            const protectedPath = path.join(
              root,
              "migrations",
              member.animationId,
              suffix,
            );
            protectedBefore.set(
              protectedPath,
              await readFile(protectedPath),
            );
          }
        }
        const applied = await buildG5L5CoverageTraceObligationMatrix({
          projectRoot: root,
          mode: "apply",
        });
        assert.equal(applied.action, "written");
        assert.equal(await existingOutputCount(root, release), 59);
        for (const candidate of await outputPaths(root, release)) {
          const information = await lstat(candidate, {bigint: true});
          assert.equal(Number(information.mode & 0o777n), 0o644);
          assert.equal(information.nlink, 1n);
          assert.equal(information.isSymbolicLink(), false);
        }
        const checked = await buildG5L5CoverageTraceObligationMatrix({
          projectRoot: root,
          mode: "check",
        });
        assert.equal(checked.action, "verified");
        assert.deepEqual(checked.outputs, applied.outputs);
        for (const [protectedPath, bytes] of protectedBefore) {
          assert.deepEqual(await readFile(protectedPath), bytes);
        }
        const report = JSON.parse(
          await readFile(path.join(root, REPORT_JSON_PATH), "utf8"),
        );
        assert.equal(validateG5L5CoverageTraceObligationReport(report), true);
        for (const member of release.members) {
          const document = JSON.parse(
            await readFile(
              path.join(
                root,
                g5L5CoverageTraceObligationPlanPath(member.animationId),
              ),
              "utf8",
            ),
          );
          assert.equal(
            validateG5L5CoverageTraceObligationPlan(document, member),
            true,
          );
          assert.equal(document.acceptanceEffects.strictComplete, false);
          assert.equal(document.protectedMutations.traceSpecCreated, false);
          assert.equal(document.protectedMutations.rendererSelected, false);
          assert.equal(
            document.structuralDefinitionInventory.nestedDefinitionCount,
            document.structuralDefinitionInventory
              .structurallyReachableUnresolvedChildCount +
              document.structuralDefinitionInventory
                .evidenceBoundCompositeChildCount +
              document.structuralDefinitionInventory
                .excludedNotProvenTimelineCount,
          );
          assert.equal(
            document.structuralDefinitionInventory.excludedNotProven
              .runnableRouteCreated,
            false,
          );
        }
      });

      await t.test("check rejects a non-0644 managed output", async () => {
        await chmod(firstOutput, 0o600);
        try {
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "check",
            }),
            /mode 0644/,
          );
        } finally {
          await chmod(firstOutput, 0o644);
        }
      });

      await t.test("target CAS failure restores an earlier output", async () => {
        const firstBefore = await readFile(firstOutput);
        const secondBefore = await readFile(secondOutput);
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index, outputPath}) {
                if (index === 1) {
                  assert.equal(outputPath, secondOutput);
                  await writeFile(secondOutput, "{\"foreign\":true}\n");
                }
              },
            },
          }),
          /changed during commit CAS/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        assert.equal(
          await readFile(secondOutput, "utf8"),
          "{\"foreign\":true}\n",
        );
        await writeFile(secondOutput, secondBefore);
      });

      await t.test("input CAS failure restores an earlier output", async () => {
        const firstBefore = await readFile(firstOutput);
        const coveragePath = path.join(
          root,
          "migrations",
          first.animationId,
          "evidence",
          "full-frame-coverage.json",
        );
        const coverageBefore = await readFile(coveragePath);
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index}) {
                if (index === 1) {
                  await writeFile(
                    coveragePath,
                    Buffer.concat([coverageBefore, Buffer.from("\n")]),
                  );
                }
              },
            },
          }),
          /input changed after preflight/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        await writeFile(coveragePath, coverageBefore);
      });

      await t.test("final input CAS rolls back all 59 outputs", async () => {
        const firstBefore = await readFile(firstOutput);
        const lastOutput = path.join(root, REPORT_MARKDOWN_PATH);
        const lastBefore = await readFile(lastOutput);
        const coveragePath = path.join(
          root,
          "migrations",
          first.animationId,
          "evidence",
          "full-frame-coverage.json",
        );
        const coverageBefore = await readFile(coveragePath);
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async afterCommit({index}) {
                if (index === 58) {
                  await writeFile(
                    coveragePath,
                    Buffer.concat([
                      coverageBefore,
                      Buffer.from("\n"),
                    ]),
                  );
                }
              },
            },
          }),
          /input changed after preflight/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        assert.deepEqual(await readFile(lastOutput), lastBefore);
        await writeFile(coveragePath, coverageBefore);
      });

      await t.test(
        "input-parent symlink swap fails the repeated ancestor CAS",
        async () => {
          const firstBefore = await readFile(firstOutput);
          const workspace = path.join(
            root,
            "migrations",
            first.animationId,
          );
          const evidence = path.join(workspace, "evidence");
          const evidenceReal = path.join(workspace, "evidence-real");
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "apply",
              transactionHooks: {
                async afterCommit({index}) {
                  if (index !== 0) return;
                  await rename(evidence, evidenceReal);
                  await symlink("evidence-real", evidence);
                },
              },
            }),
            /ancestor must be a real directory/,
          );
          assert.deepEqual(await readFile(firstOutput), firstBefore);
          await unlink(evidence);
          await rename(evidenceReal, evidence);
        },
      );

      await t.test("handoff never overwrites a foreign target occupant", async () => {
        const firstBefore = await readFile(firstOutput);
        const secondBefore = await readFile(secondOutput);
        const foreign = Buffer.from("{\"foreign\":true}\n");
        await assert.rejects(
          buildG5L5CoverageTraceObligationMatrix({
            projectRoot: root,
            mode: "apply",
            transactionHooks: {
              async beforeInstall({index, outputPath}) {
                if (index === 1) {
                  assert.equal(outputPath, secondOutput);
                  await writeFile(outputPath, foreign);
                }
              },
            },
          }),
          /EEXIST|rollback/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        assert.deepEqual(await readFile(secondOutput), foreign);
        await writeFile(secondOutput, secondBefore);
      });

      await t.test(
        "backup cleanup failure never rolls back committed outputs",
        async () => {
          const committed = new Map();
          let foreignBackupPath;
          let foreignBackupIdentity;
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "apply",
              transactionHooks: {
                async beforeCleanup({transactions}) {
                  for (const transaction of transactions) {
                    const outputPath =
                      transaction.snapshot.absolutePath;
                    const information = await lstat(
                      outputPath,
                      {bigint: true},
                    );
                    committed.set(outputPath, {
                      bytes: await readFile(outputPath),
                      dev: information.dev,
                      ino: information.ino,
                    });
                  }
                  const transaction = transactions[1];
                  const backupBytes = await readFile(
                    transaction.backupPath,
                  );
                  await unlink(transaction.backupPath);
                  await writeFile(
                    transaction.backupPath,
                    backupBytes,
                    {flag: "wx"},
                  );
                  foreignBackupPath = transaction.backupPath;
                  const foreign = await lstat(
                    foreignBackupPath,
                    {bigint: true},
                  );
                  foreignBackupIdentity = {
                    dev: foreign.dev,
                    ino: foreign.ino,
                  };
                },
              },
            }),
            /committed, but transaction cleanup was incomplete/,
          );
          for (const [outputPath, expected] of committed) {
            const current = await lstat(outputPath, {bigint: true});
            assert.deepEqual(
              {dev: current.dev, ino: current.ino},
              {dev: expected.dev, ino: expected.ino},
            );
            assert.deepEqual(await readFile(outputPath), expected.bytes);
          }
          const foreign = await lstat(
            foreignBackupPath,
            {bigint: true},
          );
          assert.deepEqual(
            {dev: foreign.dev, ino: foreign.ino},
            foreignBackupIdentity,
          );
          await unlink(foreignBackupPath);
        },
      );

      await t.test("promoted plan is rejected", async () => {
        const document = JSON.parse(
          await readFile(firstOutput, "utf8"),
        );
        document.acceptanceEffects.strictComplete = true;
        assert.throws(
          () => validateG5L5CoverageTraceObligationPlan(document, first),
          /strictComplete must be false/,
        );
      });

      await t.test(
        "rollback preserves a same-bytes foreign replacement inode",
        async () => {
          let foreignIdentity;
          await assert.rejects(
            buildG5L5CoverageTraceObligationMatrix({
              projectRoot: root,
              mode: "apply",
              transactionHooks: {
                async afterCommit({index, outputPath}) {
                  if (index !== 0) return;
                  const bytes = await readFile(outputPath);
                  await unlink(outputPath);
                  await writeFile(outputPath, bytes);
                  const information = await lstat(
                    outputPath,
                    {bigint: true},
                  );
                  foreignIdentity = {
                    dev: information.dev,
                    ino: information.ino,
                  };
                },
              },
            }),
            /rollback was incomplete/,
          );
          const current = await lstat(firstOutput, {bigint: true});
          assert.deepEqual(
            {dev: current.dev, ino: current.ino},
            foreignIdentity,
          );
        },
      );
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);

test("managed member output name is exact", () => {
  assert.equal(
    MEMBER_OUTPUT_NAME,
    "g5-l5-coverage-trace-obligation-plan.json",
  );
});
