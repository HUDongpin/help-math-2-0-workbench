import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
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
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  G5_L5_WORK_STUDY_MEMBER_IDS,
  G5_L5_WORK_STUDY_STATE,
  g5L5WorkStudyPreparationPath,
  parseArguments,
  prepareG5L5WorkStudyPackage,
  validateG5L5WorkStudyPreparation,
  validateG5L5WorkStudyPreparationReport,
  withWorkStudyArtifactFingerprint,
  withWorkStudyReportFingerprint,
} from "./prepare-g5-l5-work-study-package.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RELEASE_PATH = "catalog/lesson-releases.json";
const GLOBAL_INPUTS = [
  "scripts/prepare-g5-l5-work-study-package.mjs",
  RELEASE_PATH,
  "catalog/lesson-release-calibration-sets.json",
  "reports/g5-l5-m1-machine-foundation-readiness.json",
  "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json",
];
const MEMBER_INPUTS = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "audit/script-inventory.json",
  "audit/dependency-inventory.json",
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  "audit/machine/pre-runtime-specification-candidate-receipt.json",
  "audit/machine/swf-asset-definition-census.json",
  "audit/machine/swf-definition-inventory.csv",
  "audit/scenario-inventory.json",
  "audit/frame-domain-disposition.json",
  "evidence/full-frame-coverage.json",
  "audit/strict-readiness.json",
  "audit/machine/release-runtime-acquisition-plan.json",
];
const REPORT_OUTPUTS = [
  "reports/g5-l5-work-study-preparation-readiness.json",
  "reports/g5-l5-work-study-preparation-readiness.md",
];
const STATIC_EVIDENCE_SUFFIX =
  "audit/static-frame-domain-disposition-evidence.json";

async function copyRelative(root, relativePath) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), destination);
}

async function createFixture() {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-work-study-"),
  );
  const root = await realpath(temporary);
  for (const relativePath of GLOBAL_INPUTS) {
    await copyRelative(root, relativePath);
  }
  const releaseCatalog = JSON.parse(
    await readFile(path.join(root, RELEASE_PATH), "utf8"),
  );
  const release = releaseCatalog.releases.find(
    ({releaseId}) =>
      releaseId === "lesson-g05-l05-add-subtract-negative-numbers",
  );
  const members = G5_L5_WORK_STUDY_MEMBER_IDS.map((animationId) =>
    release.members.find((member) => member.animationId === animationId));
  for (const member of members) {
    for (const suffix of MEMBER_INPUTS) {
      await copyRelative(
        root,
        `migrations/${member.animationId}/${suffix}`,
      );
    }
    try {
      await copyRelative(
        root,
        `migrations/${member.animationId}/${STATIC_EVIDENCE_SUFFIX}`,
      );
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return {root, members};
}

function fixtureStaticCompositeProofResolver(root) {
  return async (animationId) => {
    try {
      const rendered = await readFile(
        path.join(
          root,
          "migrations",
          animationId,
          STATIC_EVIDENCE_SUFFIX,
        ),
        "utf8",
      );
      return {
        animationId,
        document: JSON.parse(rendered),
        rendered,
        sha256: createHash("sha256").update(rendered).digest("hex"),
      };
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  };
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

function outputPaths() {
  return [
    ...G5_L5_WORK_STUDY_MEMBER_IDS.map(g5L5WorkStudyPreparationPath),
    ...REPORT_OUTPUTS,
  ];
}

async function outputCount(root) {
  let count = 0;
  for (const relativePath of outputPaths()) {
    if (await exists(path.join(root, relativePath))) count += 1;
  }
  return count;
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function stageResidue(root) {
  const directories = [
    path.join(root, "reports"),
    ...G5_L5_WORK_STUDY_MEMBER_IDS.map((id) =>
      path.join(root, "migrations", id, "audit", "machine")),
  ];
  const residue = [];
  for (const directory of directories) {
    for (const name of await readdir(directory)) {
      if (name.endsWith(".stage") || name.endsWith(".backup")) {
        residue.push(path.join(directory, name));
      }
    }
  }
  return residue;
}

test("CLI requires exactly one explicit mode", () => {
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
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test(
  "four-member work-study preparation is fail-closed, path-safe, and transactional",
  {timeout: 120_000},
  async (t) => {
    const fixture = await createFixture();
    const {root, members} = fixture;
    const staticCompositeProofResolver =
      fixtureStaticCompositeProofResolver(root);
    const firstOutputRelative =
      g5L5WorkStudyPreparationPath(members[0].animationId);
    const secondOutputRelative =
      g5L5WorkStudyPreparationPath(members[1].animationId);
    try {
      await t.test("missing required candidate input fails before writes", async () => {
        const relativePath =
          `migrations/${members[0].animationId}/audit/machine/` +
          "swf-asset-definition-census.json";
        const absolutePath = path.join(root, relativePath);
        const original = await readFile(absolutePath);
        await unlink(absolutePath);
        try {
          await assert.rejects(
            prepareG5L5WorkStudyPackage({
              projectRoot: root,
              staticCompositeProofResolver,
              mode: "dry-run",
            }),
            /required file is missing/,
          );
          assert.equal(await outputCount(root), 0);
        } finally {
          await writeFile(absolutePath, original);
        }
      });

      await t.test("symlinked ancestor and linked final targets are refused", async () => {
        const reports = path.join(root, "reports");
        const reportsReal = path.join(root, "reports-real");
        await rename(reports, reportsReal);
        await symlink("reports-real", reports);
        try {
          await assert.rejects(
            prepareG5L5WorkStudyPackage({
              projectRoot: root,
              staticCompositeProofResolver,
              mode: "dry-run",
            }),
            /ancestor must be a real directory/,
          );
        } finally {
          await unlink(reports);
          await rename(reportsReal, reports);
        }

        const output = path.join(root, firstOutputRelative);
        const foreign = path.join(path.dirname(output), "foreign.json");
        await writeFile(foreign, "{}\n");
        await symlink("foreign.json", output);
        await assert.rejects(
          prepareG5L5WorkStudyPackage({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "dry-run",
          }),
          /ordinary non-linked file/,
        );
        await unlink(output);
        await link(foreign, output);
        await assert.rejects(
          prepareG5L5WorkStudyPackage({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "dry-run",
          }),
          /ordinary non-linked file/,
        );
        await unlink(output);
        await unlink(foreign);
        assert.equal(await outputCount(root), 0);
      });

      await t.test("dry-run is deterministic and writes nothing", async () => {
        const first = await prepareG5L5WorkStudyPackage({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "dry-run",
        });
        const second = await prepareG5L5WorkStudyPackage({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "dry-run",
        });
        assert.deepEqual(second, first);
        assert.equal(first.state, G5_L5_WORK_STUDY_STATE);
        assert.equal(first.selectedMemberCount, 4);
        assert.equal(first.outputCount, 6);
        assert.equal(first.runnable, false);
        assert.deepEqual(first.commands, []);
        assert.equal(first.assignedPersonCount, 0);
        assert.equal(first.actualMinuteValueCount, 0);
        assert.equal(first.actualMinutesTotal, null);
        assert.equal(first.runtimeSessionCount, 0);
        assert.equal(first.structurallyReachableChildTimelineCount, 330);
        assert.equal(first.evidenceBoundCompositeFrameDomainCount, 283);
        assert.equal(first.unresolvedFrameDomainCount, 47);
        assert.equal(first.excludedNotProvenTimelineCount, 101);
        assert.equal(first.implementationAuthorized, false);
        assert.equal(first.evidencePromotionAuthorized, false);
        assert.equal(first.strictCompleteCount, 0);
        assert.equal(first.publishedCount, 0);
        assert.equal(await outputCount(root), 0);
      });

      await t.test("failure after first new commit rolls back all outputs", async () => {
        await assert.rejects(
          prepareG5L5WorkStudyPackage({
            projectRoot: root,
            staticCompositeProofResolver,
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
        assert.equal(await outputCount(root), 0);
        assert.deepEqual(await stageResidue(root), []);
      });

      await t.test("apply writes six outputs and check verifies exact bytes", async () => {
        const applied = await prepareG5L5WorkStudyPackage({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "apply",
        });
        assert.equal(applied.action, "written");
        assert.equal(await outputCount(root), 6);
        const checked = await prepareG5L5WorkStudyPackage({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "check",
        });
        assert.equal(checked.action, "verified");
        assert.deepEqual(checked.outputs, applied.outputs);
        const expectedFrameDomains = new Map([
          ["shell-course-g05-l05-index-local", [94, 60, 34, 98]],
          ["course-g05-l05-rw-002", [3, 0, 3, 0]],
          ["course-g05-l05-in-020", [20, 14, 6, 3]],
          ["course-g05-l05-fq-002", [213, 209, 4, 0]],
        ]);
        for (const member of members) {
          const document = await readJson(
            root,
            g5L5WorkStudyPreparationPath(member.animationId),
          );
          assert.equal(
            validateG5L5WorkStudyPreparation(document, member),
            true,
          );
          assert.equal(document.runtimeTracePreparation.runnable, false);
          assert.deepEqual(document.runtimeTracePreparation.commands, []);
          assert.equal(document.workStudy.actualTotalMinutes, null);
          assert.equal(document.staffing.primaryPerson, null);
          assert.equal(document.session.sessionId, null);
          assert.equal(document.acceptanceEffects.strictComplete, false);
          assert.equal(document.acceptanceEffects.published, false);
          assert.deepEqual(
            [
              document.readinessSnapshot
                .structurallyReachableChildTimelineCount,
              document.readinessSnapshot
                .evidenceBoundCompositeFrameDomainCount,
              document.readinessSnapshot.unresolvedFrameDomainCount,
              document.readinessSnapshot.excludedNotProvenTimelineCount,
            ],
            expectedFrameDomains.get(member.animationId),
          );
        }
        const report = await readJson(root, REPORT_OUTPUTS[0]);
        assert.equal(validateG5L5WorkStudyPreparationReport(report), true);
        assert.equal(
          report.summary.evidenceBoundCompositeFrameDomainCount,
          283,
        );
      });

      await t.test("refingerprinted boundary promotions remain invalid", async () => {
        const original = await readJson(root, firstOutputRelative);
        const mutations = [
          (document) => {
            document.runtimeTracePreparation.runnable = true;
            document.runtimeTracePreparation.commands = ["launch"];
          },
          (document) => {
            document.workStudy.phases[0].assignedPerson = "named-person";
          },
          (document) => {
            document.workStudy.phases[0].startedAt =
              "2026-07-29T00:00:00Z";
            document.workStudy.phases[0].actualMinutes = 1;
          },
          (document) => {
            document.budgetAndProcurement.totalBudgetEnvelopeUsd = 1;
            document.budgetAndProcurement.budgetApproved = true;
          },
          (document) => {
            document.implementationEffects.implementationStarted = true;
          },
          (document) => {
            document.evidenceEffects.runtimeEvidenceCreated = true;
          },
          (document) => {
            document.acceptanceEffects.ownerAccepted = true;
          },
          (document) => {
            document.publicationEffects.published = true;
          },
          (document) => {
            document.sourceBindings.staticDispositionEvidence = null;
          },
        ];
        for (const mutate of mutations) {
          const promoted = structuredClone(original);
          mutate(promoted);
          const refingerprinted =
            withWorkStudyArtifactFingerprint(promoted);
          assert.throws(
            () =>
              validateG5L5WorkStudyPreparation(
                refingerprinted,
                members[0],
              ),
            /must remain false|contains a person|became runnable|boundary drifted|publication effect|proof-bound frame-domain accounting/i,
          );
        }
        const report = await readJson(root, REPORT_OUTPUTS[0]);
        report.summary.actualMinutesTotal = 1;
        const refingerprintedReport =
          withWorkStudyReportFingerprint(report);
        assert.throws(
          () =>
            validateG5L5WorkStudyPreparationReport(
              refingerprintedReport,
            ),
          /invented people, time, execution, or completion/,
        );
      });

      await t.test("output CAS failure restores earlier committed output", async () => {
        const firstOutput = path.join(root, firstOutputRelative);
        const secondOutput = path.join(root, secondOutputRelative);
        const firstBefore = await readFile(firstOutput);
        const secondBefore = await readFile(secondOutput);
        await assert.rejects(
          prepareG5L5WorkStudyPackage({
            projectRoot: root,
            staticCompositeProofResolver,
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
          /output changed during commit CAS/,
        );
        assert.deepEqual(await readFile(firstOutput), firstBefore);
        assert.equal(
          await readFile(secondOutput, "utf8"),
          "{\"foreign\":true}\n",
        );
        await writeFile(secondOutput, secondBefore);
        assert.deepEqual(await stageResidue(root), []);
      });

      await t.test("input CAS failure restores earlier committed output", async () => {
        const firstOutput = path.join(root, firstOutputRelative);
        const input = path.join(
          root,
          `migrations/${members[0].animationId}/audit/machine/` +
            "pre-runtime-specification-candidate-receipt.json",
        );
        const outputBefore = await readFile(firstOutput);
        const inputBefore = await readFile(input);
        await assert.rejects(
          prepareG5L5WorkStudyPackage({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index}) {
                if (index === 1) {
                  await writeFile(
                    input,
                    Buffer.concat([inputBefore, Buffer.from("\n")]),
                  );
                }
              },
            },
          }),
          /input changed after preflight/,
        );
        assert.deepEqual(await readFile(firstOutput), outputBefore);
        await writeFile(input, inputBefore);
        assert.deepEqual(await stageResidue(root), []);
      });
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);
