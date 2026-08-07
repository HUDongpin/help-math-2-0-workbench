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
  G5_L5_POST_M1_RISK_MEMBER_IDS,
  G5_L5_POST_M1_RISK_STATE,
  buildG5L5PostM1RiskCalibrationSuccessor,
  g5L5PostM1RiskSuccessorPath,
  parseArguments,
  validateG5L5PostM1RiskReadinessReport,
  validateG5L5PostM1RiskSuccessor,
  withPostM1RiskArtifactFingerprint,
  withPostM1RiskReportFingerprint,
} from "./build-g5-l5-post-m1-risk-calibration-successor.mjs";
import {
  G5_L5_WORK_STUDY_MEMBER_IDS,
  g5L5WorkStudyPreparationPath,
  prepareG5L5WorkStudyPackage,
} from "./prepare-g5-l5-work-study-package.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RELEASE_PATH = "catalog/lesson-releases.json";
const HISTORICAL_RISK_JSON = "reports/g5-l5-risk-calibration.json";
const HISTORICAL_RISK_MARKDOWN = "reports/g5-l5-risk-calibration.md";
const GLOBAL_INPUTS = [
  "scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs",
  RELEASE_PATH,
  "catalog/lesson-release-calibration-sets.json",
  HISTORICAL_RISK_JSON,
  HISTORICAL_RISK_MARKDOWN,
  "scripts/prepare-g5-l5-work-study-package.mjs",
  "reports/g5-l5-m1-machine-foundation-readiness.json",
  "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json",
];
const MEMBER_INPUTS = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "audit/script-inventory.json",
  "audit/dependency-inventory.json",
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  "audit/scenario-inventory.json",
  "audit/frame-domain-disposition.json",
  "evidence/full-frame-coverage.json",
  "audit/strict-readiness.json",
];
const REPORT_OUTPUTS = [
  "reports/g5-l5-post-m1-risk-calibration-readiness.json",
  "reports/g5-l5-post-m1-risk-calibration-readiness.md",
];
const WORK_STUDY_MEMBER_INPUTS = [
  "audit/machine/pre-runtime-specification-candidate-receipt.json",
  "audit/machine/swf-asset-definition-census.json",
  "audit/machine/swf-definition-inventory.csv",
  "audit/machine/release-runtime-acquisition-plan.json",
];
const STATIC_EVIDENCE_SUFFIX =
  "audit/static-frame-domain-disposition-evidence.json";

async function copyRelative(root, relativePath) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), destination);
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

async function createFixture() {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-risk-"),
  );
  const root = await realpath(temporary);
  for (const relativePath of GLOBAL_INPUTS) {
    await copyRelative(root, relativePath);
  }
  const catalog = JSON.parse(
    await readFile(path.join(root, RELEASE_PATH), "utf8"),
  );
  const release = catalog.releases.find(
    ({releaseId}) =>
      releaseId === "lesson-g05-l05-add-subtract-negative-numbers",
  );
  const members = G5_L5_POST_M1_RISK_MEMBER_IDS.map((animationId) =>
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
    if (G5_L5_WORK_STUDY_MEMBER_IDS.includes(member.animationId)) {
      for (const suffix of WORK_STUDY_MEMBER_INPUTS) {
        await copyRelative(
          root,
          `migrations/${member.animationId}/${suffix}`,
        );
      }
    }
  }
  const staticCompositeProofResolver =
    fixtureStaticCompositeProofResolver(root);
  await prepareG5L5WorkStudyPackage({
    projectRoot: root,
    mode: "apply",
    staticCompositeProofResolver,
  });
  return {root, members, staticCompositeProofResolver};
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
    ...G5_L5_POST_M1_RISK_MEMBER_IDS.map(g5L5PostM1RiskSuccessorPath),
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

async function assertMode0644(root, relativePath) {
  const information = await lstat(path.join(root, relativePath));
  assert.equal(information.mode & 0o777, 0o644, relativePath);
}

async function stageResidue(root) {
  const directories = [
    path.join(root, "reports"),
    ...G5_L5_POST_M1_RISK_MEMBER_IDS.map((id) =>
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
    () => parseArguments(["--apply", "--check"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test(
  "eight-member post-M1 risk successor is immutable, fail-closed, and transactional",
  {timeout: 120_000},
  async (t) => {
    const {root, members, staticCompositeProofResolver} =
      await createFixture();
    const firstRelative =
      g5L5PostM1RiskSuccessorPath(members[0].animationId);
    const secondRelative =
      g5L5PostM1RiskSuccessorPath(members[1].animationId);
    const historicalJson = path.join(root, HISTORICAL_RISK_JSON);
    const historicalMarkdown = path.join(root, HISTORICAL_RISK_MARKDOWN);
    const historicalJsonOriginal = await readFile(historicalJson);
    const historicalMarkdownOriginal = await readFile(historicalMarkdown);
    try {
      await t.test("missing input and historical report promotion fail before writes", async () => {
        const scenario = path.join(
          root,
          `migrations/${members[0].animationId}/audit/scenario-inventory.json`,
        );
        const scenarioOriginal = await readFile(scenario);
        await unlink(scenario);
        try {
          await assert.rejects(
            buildG5L5PostM1RiskCalibrationSuccessor({
              projectRoot: root,
              staticCompositeProofResolver,
              mode: "dry-run",
            }),
            /required file is missing/,
          );
          assert.equal(await outputCount(root), 0);
        } finally {
          await writeFile(scenario, scenarioOriginal);
        }

        const historical = JSON.parse(
          historicalJsonOriginal.toString("utf8"),
        );
        historical.summary.rendererSelectedCount = 1;
        await writeFile(
          historicalJson,
          `${JSON.stringify(historical, null, 2)}\n`,
        );
        try {
          await assert.rejects(
            buildG5L5PostM1RiskCalibrationSuccessor({
              projectRoot: root,
              staticCompositeProofResolver,
              mode: "dry-run",
            }),
            /historical G5 L5 risk report bytes changed|historical G5 L5 risk report identity or fail-closed summary drifted/,
          );
          assert.equal(await outputCount(root), 0);
        } finally {
          await writeFile(historicalJson, historicalJsonOriginal);
        }
      });

      await t.test("symlinked ancestors and linked outputs are refused", async () => {
        const reports = path.join(root, "reports");
        const reportsReal = path.join(root, "reports-real");
        await rename(reports, reportsReal);
        await symlink("reports-real", reports);
        try {
          await assert.rejects(
            buildG5L5PostM1RiskCalibrationSuccessor({
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

        const output = path.join(root, firstRelative);
        const foreign = path.join(path.dirname(output), "foreign.json");
        await writeFile(foreign, "{}\n");
        await symlink("foreign.json", output);
        await assert.rejects(
          buildG5L5PostM1RiskCalibrationSuccessor({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "dry-run",
          }),
          /ordinary non-linked 0644 file/,
        );
        await unlink(output);
        await link(foreign, output);
        await assert.rejects(
          buildG5L5PostM1RiskCalibrationSuccessor({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "dry-run",
          }),
          /ordinary non-linked 0644 file/,
        );
        await unlink(output);
        await unlink(foreign);
        assert.equal(await outputCount(root), 0);
      });

      await t.test("dry-run is deterministic and non-mutating", async () => {
        const first = await buildG5L5PostM1RiskCalibrationSuccessor({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "dry-run",
        });
        const second = await buildG5L5PostM1RiskCalibrationSuccessor({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "dry-run",
        });
        assert.deepEqual(second, first);
        assert.equal(first.state, G5_L5_POST_M1_RISK_STATE);
        assert.equal(first.selectedMemberCount, 8);
        assert.equal(first.workStudyTargetCount, 4);
        assert.equal(first.outputCount, 10);
        assert.equal(first.runnable, false);
        assert.deepEqual(first.commands, []);
        assert.equal(first.completeMemberCount, 0);
        assert.equal(first.rendererSelectedCount, 0);
        assert.equal(first.runtimeCompleteCount, 0);
        assert.equal(first.implementationCompleteCount, 0);
        assert.equal(first.acceptanceCompleteCount, 0);
        assert.equal(first.strictCompleteCount, 0);
        assert.equal(first.publishedCount, 0);
        assert.equal(first.actualMinutesTotal, null);
        assert.equal(first.structurallyReachableChildTimelineCount, 449);
        assert.equal(first.evidenceBoundCompositeFrameDomainCount, 352);
        assert.equal(first.unresolvedFrameDomainCount, 97);
        assert.equal(first.excludedNotProvenTimelineCount, 113);
        assert.equal(await outputCount(root), 0);
      });

      await t.test("first-commit failure rolls back all ten new outputs", async () => {
        await assert.rejects(
          buildG5L5PostM1RiskCalibrationSuccessor({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "apply",
            transactionHooks: {
              afterCommit({index}) {
                if (index === 0) throw new Error("injected commit failure");
              },
            },
          }),
          /injected commit failure/,
        );
        assert.equal(await outputCount(root), 0);
        assert.deepEqual(await stageResidue(root), []);
      });

      await t.test("apply/check write ten exact 0644 outputs without touching history", async () => {
        const applied = await buildG5L5PostM1RiskCalibrationSuccessor({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "apply",
        });
        assert.equal(applied.action, "written");
        assert.equal(await outputCount(root), 10);
        const checked = await buildG5L5PostM1RiskCalibrationSuccessor({
          projectRoot: root,
          staticCompositeProofResolver,
          mode: "check",
        });
        assert.equal(checked.action, "verified");
        assert.deepEqual(checked.outputs, applied.outputs);
        for (let index = 0; index < members.length; index += 1) {
          const member = members[index];
          const relativePath =
            g5L5PostM1RiskSuccessorPath(member.animationId);
          const document = await readJson(root, relativePath);
          assert.equal(
            validateG5L5PostM1RiskSuccessor(document, member),
            true,
          );
          assert.equal(
            document.humanWorkStudy.selected,
            G5_L5_WORK_STUDY_MEMBER_IDS.includes(member.animationId),
          );
          await assertMode0644(root, relativePath);
        }
        const report = await readJson(root, REPORT_OUTPUTS[0]);
        assert.equal(validateG5L5PostM1RiskReadinessReport(report), true);
        assert.equal(
          report.summary.evidenceBoundCompositeFrameDomainCount,
          352,
        );
        for (const relativePath of REPORT_OUTPUTS) {
          await assertMode0644(root, relativePath);
        }
        assert.deepEqual(await readFile(historicalJson), historicalJsonOriginal);
        assert.deepEqual(
          await readFile(historicalMarkdown),
          historicalMarkdownOriginal,
        );
      });

      await t.test("refingerprinted promotions remain invalid", async () => {
        const original = await readJson(root, firstRelative);
        const mutations = [
          (document) => {
            document.executionGate.runnable = true;
            document.executionGate.commands = ["launch"];
          },
          (document) => {
            document.humanWorkStudy.assignedPerson = "named-person";
          },
          (document) => {
            document.humanWorkStudy.startedAt =
              "2026-07-29T00:00:00Z";
            document.humanWorkStudy.actualMinutes = 1;
          },
          (document) => {
            document.budgetAndProcurement.totalBudgetEnvelopeUsd = 1;
            document.budgetAndProcurement.budgetApproved = true;
          },
          (document) => {
            document.currentPostM1Snapshot.rendererSelected = true;
          },
          (document) => {
            document.implementationEffects.implementationStarted = true;
          },
          (document) => {
            document.acceptanceEffects.strictComplete = true;
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
          assert.throws(
            () =>
              validateG5L5PostM1RiskSuccessor(
                withPostM1RiskArtifactFingerprint(promoted),
                members[0],
              ),
            /must remain false|became runnable|contains a person|invented staffing|was promoted|publication effects|static proof binding/i,
          );
        }
        const report = await readJson(root, REPORT_OUTPUTS[0]);
        report.summary.completeMemberCount = 1;
        assert.throws(
          () =>
            validateG5L5PostM1RiskReadinessReport(
              withPostM1RiskReportFingerprint(report),
            ),
          /invented completion, execution, people, or time/,
        );
      });

      await t.test("output CAS failure restores earlier output", async () => {
        const firstOutput = path.join(root, firstRelative);
        const secondOutput = path.join(root, secondRelative);
        const firstBefore = await readFile(firstOutput);
        const secondBefore = await readFile(secondOutput);
        await assert.rejects(
          buildG5L5PostM1RiskCalibrationSuccessor({
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

      await t.test("input CAS failure restores earlier output", async () => {
        const firstOutput = path.join(root, firstRelative);
        const firstBefore = await readFile(firstOutput);
        await assert.rejects(
          buildG5L5PostM1RiskCalibrationSuccessor({
            projectRoot: root,
            staticCompositeProofResolver,
            mode: "apply",
            transactionHooks: {
              async beforeCommit({index}) {
                if (index === 1) {
                  await writeFile(
                    historicalMarkdown,
                    Buffer.concat([
                      historicalMarkdownOriginal,
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
        await writeFile(historicalMarkdown, historicalMarkdownOriginal);
        assert.deepEqual(await stageResidue(root), []);
      });
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  },
);
