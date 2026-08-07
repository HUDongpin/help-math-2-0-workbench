import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  appendFile,
  chmod,
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
  G5_L5_POST_M1_RUNTIME_OUTPUT_NAME,
  G5_L5_POST_M1_RUNTIME_REPORT_PREFIX,
  materializeG5L5PostM1RuntimeAcquisitionSuccessors,
  parseArguments,
  stableJson,
} from "./materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const releaseId = "lesson-g05-l05-add-subtract-negative-numbers";
const generatorRelative =
  "scripts/materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs";
const memberInputSuffixes = [
  "migration.json",
  "MIGRATION_BRIEF.md",
  "audit/script-inventory.json",
  "audit/dependency-inventory.json",
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  "audit/scenario-inventory.json",
  "audit/frame-domain-disposition.json",
  "evidence/full-frame-coverage.json",
  "audit/strict-readiness.json",
  "audit/machine/release-runtime-acquisition-plan.json",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeRelative(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, value);
  return absolutePath;
}

async function copyRelative(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), absolutePath);
  return absolutePath;
}

async function makeFixture(t) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-runtime-successor-"),
  );
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });

  const sourceCatalog = JSON.parse(
    await readFile(
      path.join(projectRoot, "catalog/lesson-releases.json"),
      "utf8",
    ),
  );
  const sourceRelease = sourceCatalog.releases.find(
    ({releaseId: candidate}) => candidate === releaseId,
  );
  assert.ok(sourceRelease);
  const member = structuredClone(sourceRelease.members[0]);
  const release = {
    ...structuredClone(sourceRelease),
    expectedCounts: {
      ...structuredClone(sourceRelease.expectedCounts),
      activeXmlReferencedPages: 1,
      courseShells: 0,
      members: 1,
    },
    members: [member],
  };
  const releaseFingerprint = sha256(Buffer.from(stableJson(release)));

  // Deliberately non-canonical key order: inputs need valid JSON and physical
  // integrity, while only this generator's outputs are stable-key JSON.
  await writeRelative(
    root,
    "catalog/lesson-releases.json",
    `${JSON.stringify({releases: [release], schemaVersion: 1}, null, 2)}\n`,
  );
  await copyRelative(root, generatorRelative);
  await mkdir(path.join(root, "reports"), {recursive: true});
  for (const suffix of memberInputSuffixes) {
    await copyRelative(
      root,
      `migrations/${member.animationId}/${suffix}`,
    );
  }

  const memberOutput =
    `migrations/${member.animationId}/audit/machine/` +
    G5_L5_POST_M1_RUNTIME_OUTPUT_NAME;
  const reportJson = `${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.json`;
  const reportMarkdown = `${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.md`;
  const outputPaths = [memberOutput, reportJson, reportMarkdown];
  const historicalPlan =
    `migrations/${member.animationId}/audit/machine/` +
    "release-runtime-acquisition-plan.json";
  const historicalBytes = await readFile(path.join(root, historicalPlan));

  return {
    root,
    member,
    releaseFingerprint,
    outputPaths,
    memberOutput,
    reportJson,
    reportMarkdown,
    historicalPlan,
    historicalBytes,
  };
}

function runOptions(fixture, mode, transactionHooks = {}) {
  return {
    projectRoot: fixture.root,
    mode,
    expectedMemberCount: 1,
    expectedPageCount: 1,
    expectedShellCount: 0,
    expectedReleaseFingerprint: fixture.releaseFingerprint,
    transactionHooks,
  };
}

async function assertOutputsAbsent(fixture) {
  for (const relativePath of fixture.outputPaths) {
    await assert.rejects(
      readFile(path.join(fixture.root, relativePath)),
      {code: "ENOENT"},
    );
  }
}

test("argument parser is fail-closed", () => {
  assert.deepEqual(parseArguments([]), {mode: "dry-run", help: false});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply", help: false});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check", help: false});
  assert.deepEqual(parseArguments(["--help"]), {
    mode: "dry-run",
    help: true,
  });
  assert.throws(
    () => parseArguments(["--dry-run", "--apply"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArguments(["--unknown"]), /unknown option/);
});

test("dry-run, apply, and check create only canonical empty successors", async (t) => {
  const fixture = await makeFixture(t);
  const dryRun =
    await materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "dry-run"),
    );
  assert.equal(dryRun.action, "dry-run");
  assert.equal(dryRun.outputCount, 3);
  assert.equal(dryRun.staleOutputCount, 3);
  assert.equal(dryRun.historicalPlansModified, 0);
  assert.equal(dryRun.structurallyReachableChildTimelineCount, 3);
  assert.equal(dryRun.evidenceBoundCompositeChildDispositionCount, 0);
  assert.equal(dryRun.unresolvedChildDispositionCount, 3);
  assert.equal(dryRun.excludedNotProvenTimelineCount, 0);
  await assertOutputsAbsent(fixture);

  const applied =
    await materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "apply"),
    );
  assert.equal(applied.action, "applied");
  assert.equal(applied.emptyWorksheetCount, 1);
  assert.equal(applied.runnableCount, 0);
  assert.equal(applied.namedOperatorCount, 0);
  assert.equal(applied.runtimeSessionCount, 0);
  assert.equal(applied.guiExecutionCount, 0);

  const checked =
    await materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "check"),
    );
  assert.equal(checked.action, "verified");
  assert.equal(checked.staleOutputCount, 0);
  for (const relativePath of fixture.outputPaths) {
    const information = await lstat(path.join(fixture.root, relativePath), {
      bigint: true,
    });
    assert.equal(Number(information.mode & 0o777n), 0o644);
  }

  const memberText = await readFile(
    path.join(fixture.root, fixture.memberOutput),
    "utf8",
  );
  const memberDocument = JSON.parse(memberText);
  assert.equal(memberText, stableJson(memberDocument));
  assert.equal(
    memberDocument.lineage.historicalArtifactModified,
    false,
  );
  assert.equal(
    memberDocument.lineage.historicalPlan.path,
    fixture.historicalPlan,
  );
  assert.equal(memberDocument.namedOperatorRoleAssignment, null);
  assert.equal(memberDocument.executionGate.runnable, false);
  assert.equal(memberDocument.executionGate.launchesGui, false);
  assert.ok(
    Object.entries(memberDocument.emptyRuntimeAcquisitionWorksheet)
      .filter(([key]) => key !== "state")
      .every(([, value]) => Array.isArray(value) && value.length === 0),
  );
  assert.ok(
    Object.values(memberDocument.acceptanceEffects)
      .every((value) => value === false),
  );
  assert.equal(
    memberDocument.currentStaticPlanningFacts
      .structurallyReachableChildTimelineCount,
    3,
  );
  assert.equal(
    memberDocument.currentStaticPlanningFacts
      .evidenceBoundCompositeChildDispositionCount,
    0,
  );
  assert.equal(
    memberDocument.currentStaticPlanningFacts
      .unresolvedChildDispositionCount,
    3,
  );
  assert.equal(
    memberDocument.currentBindings.staticDispositionEvidence,
    null,
  );

  const reportText = await readFile(
    path.join(fixture.root, fixture.reportJson),
    "utf8",
  );
  const report = JSON.parse(reportText);
  assert.equal(reportText, stableJson(report));
  assert.equal(report.summary.releaseMemberCount, 1);
  assert.equal(report.summary.canonicalRootOnlyRequirementCount, 2);
  assert.equal(report.summary.structurallyReachableChildTimelineCount, 3);
  assert.equal(
    report.summary.evidenceBoundCompositeChildDispositionCount,
    0,
  );
  assert.equal(report.summary.unresolvedChildDispositionCount, 3);
  assert.equal(report.summary.excludedNotProvenTimelineCount, 0);
  assert.equal(report.summary.namedOperatorCount, 0);
  assert.equal(report.summary.runtimeSessionCount, 0);
  assert.equal(report.summary.guiExecutionCount, 0);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.publishedCount, 0);
  assert.deepEqual(
    await readFile(path.join(fixture.root, fixture.historicalPlan)),
    fixture.historicalBytes,
  );
});

test("full release dry-run enforces the exact proof-bound disposition split", async () => {
  const result =
    await materializeG5L5PostM1RuntimeAcquisitionSuccessors({
      projectRoot,
      mode: "dry-run",
    });
  assert.equal(result.memberCount, 57);
  assert.equal(result.structurallyReachableChildTimelineCount, 1047);
  assert.equal(result.evidenceBoundCompositeChildDispositionCount, 696);
  assert.equal(result.unresolvedChildDispositionCount, 351);
  assert.equal(result.excludedNotProvenTimelineCount, 185);
});

test("check rejects missing and stale managed outputs", async (t) => {
  const fixture = await makeFixture(t);
  await materializeG5L5PostM1RuntimeAcquisitionSuccessors(
    runOptions(fixture, "apply"),
  );
  await chmod(path.join(fixture.root, fixture.reportMarkdown), 0o600);
  await assert.rejects(
    materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "check"),
    ),
    /output must be one ordinary non-linked mode-0644 file/,
  );
  await chmod(path.join(fixture.root, fixture.reportMarkdown), 0o644);
  await appendFile(
    path.join(fixture.root, fixture.reportMarkdown),
    "\n",
  );
  await assert.rejects(
    materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "check"),
    ),
    /missing or stale \(1 file\(s\)\)/,
  );
  await unlink(path.join(fixture.root, fixture.reportMarkdown));
  await assert.rejects(
    materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "check"),
    ),
    /missing or stale \(1 file\(s\)\)/,
  );
});

test("input symlinks and hardlinks are rejected", async (t) => {
  await t.test("symlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const releasePath = path.join(
      fixture.root,
      "catalog/lesson-releases.json",
    );
    const peerPath = path.join(fixture.root, "catalog/release-peer.json");
    await writeFile(peerPath, await readFile(releasePath));
    await unlink(releasePath);
    await symlink("release-peer.json", releasePath);
    await assert.rejects(
      materializeG5L5PostM1RuntimeAcquisitionSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
  await t.test("hardlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const releasePath = path.join(
      fixture.root,
      "catalog/lesson-releases.json",
    );
    await link(
      releasePath,
      path.join(fixture.root, "catalog/release-hardlink.json"),
    );
    await assert.rejects(
      materializeG5L5PostM1RuntimeAcquisitionSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
});

test("output symlinks, hardlinks, and unmanaged files are rejected", async (t) => {
  await t.test("symlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const peer = await writeRelative(
      fixture.root,
      "reports/output-peer.json",
      "{}\n",
    );
    await symlink(
      path.basename(peer),
      path.join(fixture.root, fixture.reportJson),
    );
    await assert.rejects(
      materializeG5L5PostM1RuntimeAcquisitionSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /output must be one ordinary non-linked mode-0644 file/,
    );
  });
  await t.test("hardlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const peer = await writeRelative(
      fixture.root,
      "reports/output-peer.json",
      "{}\n",
    );
    await link(peer, path.join(fixture.root, fixture.reportJson));
    await assert.rejects(
      materializeG5L5PostM1RuntimeAcquisitionSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /output must be one ordinary non-linked mode-0644 file/,
    );
  });
  await t.test("unmanaged", async (subtest) => {
    const fixture = await makeFixture(subtest);
    await writeRelative(
      fixture.root,
      fixture.reportMarkdown,
      "# Unmanaged report\n",
    );
    await assert.rejects(
      materializeG5L5PostM1RuntimeAcquisitionSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /refusing to overwrite an unmanaged Markdown file/,
    );
  });
});

test("input CAS failure leaves the entire output set uncommitted", async (t) => {
  const fixture = await makeFixture(t);
  let mutated = false;
  await assert.rejects(
    materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "apply", {
        beforeCommit: async () => {
          if (mutated) return;
          mutated = true;
          await appendFile(
            path.join(fixture.root, "catalog/lesson-releases.json"),
            " ",
          );
        },
      }),
    ),
    /input changed after preflight/,
  );
  await assertOutputsAbsent(fixture);
  assert.deepEqual(
    await readFile(path.join(fixture.root, fixture.historicalPlan)),
    fixture.historicalBytes,
  );
});

test("transaction failure rolls back every committed or staged output", async (t) => {
  const fixture = await makeFixture(t);
  await assert.rejects(
    materializeG5L5PostM1RuntimeAcquisitionSuccessors(
      runOptions(fixture, "apply", {
        afterCommit: ({index}) => {
          if (index === 0) throw new Error("injected transaction failure");
        },
      }),
    ),
    /injected transaction failure/,
  );
  await assertOutputsAbsent(fixture);
  assert.deepEqual(
    await readFile(path.join(fixture.root, fixture.historicalPlan)),
    fixture.historicalBytes,
  );
});
