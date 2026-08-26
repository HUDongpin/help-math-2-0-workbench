import assert from "node:assert/strict";
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  materializeG4L3WorkspaceRuntimeAcquisition,
  parseArguments,
  WORKSPACE_ARTIFACT_RELATIVE,
} from "./materialize-g4-l3-workspace-runtime-acquisition.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function workspaceFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-runtime-acquisition-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const migrationsRoot = path.join(root, "migrations");
  await mkdir(migrationsRoot);
  const contract = JSON.parse(await readFile(path.join(
    projectRoot,
    "reports/g4-l3-authoritative-runtime-acquisition-contract.json",
  )));
  for (const item of contract.items) {
    const workspace = path.join(migrationsRoot, item.animationId);
    await mkdir(path.join(workspace, "audit", "machine"), {recursive: true});
    await copyFile(
      path.join(projectRoot, "migrations", item.animationId, "migration.json"),
      path.join(workspace, "migration.json"),
    );
  }
  return {migrationsRoot, contract};
}

test("dry-run prevalidates all 40 source-bound workspaces without writing", async (t) => {
  const {migrationsRoot, contract} = await workspaceFixture(t);
  const first = contract.items[0];
  const result = await materializeG4L3WorkspaceRuntimeAcquisition({
    root: projectRoot,
    migrationsRoot,
    dryRun: true,
  });
  assert.equal(result.mode, "dry-run");
  assert.equal(result.members, 40);
  assert.equal(result.changed, 40);
  assert.equal(result.manifestChanges, 0);
  assert.equal(result.runtimeSessionsExecuted, 0);
  assert.equal(result.acceptanceChanges, 0);
  await assert.rejects(
    readFile(path.join(migrationsRoot, first.animationId, WORKSPACE_ARTIFACT_RELATIVE)),
    {code: "ENOENT"},
  );
});

test("materializes deterministic empty, non-runnable planning artifacts and preserves manifests", async (t) => {
  const {migrationsRoot, contract} = await workspaceFixture(t);
  const manifestBytes = new Map();
  for (const item of contract.items) {
    manifestBytes.set(item.animationId, await readFile(path.join(migrationsRoot, item.animationId, "migration.json")));
  }
  const result = await materializeG4L3WorkspaceRuntimeAcquisition({root: projectRoot, migrationsRoot});
  assert.equal(result.members, 40);
  assert.equal(result.changed, 40);
  assert.match(result.artifactSetSha256, /^[a-f0-9]{64}$/);

  const paired = contract.items.find((item) => item.authoringGate.required);
  const artifactPath = path.join(migrationsRoot, paired.animationId, WORKSPACE_ARTIFACT_RELATIVE);
  const artifact = JSON.parse(await readFile(artifactPath));
  assert.equal(artifact.artifactType, "g4-l3-workspace-runtime-acquisition-plan");
  assert.equal(artifact.identity.animationId, paired.animationId);
  assert.equal(artifact.authoringGate.status, "verified-work-only-authoring-audit");
  assert.equal(artifact.authoringGate.authoringAuditEstablished, true);
  assert.equal(artifact.currentEvidenceState.workOnlyAuthoringAuditEstablished, true);
  assert.equal(artifact.runtimeEnvironmentPrerequisite.installedCandidateIdentified, true);
  assert.equal(artifact.runtimeEnvironmentPrerequisite.candidateExecutableTechnicallyBound, true);
  assert.equal(artifact.runtimeEnvironmentPrerequisite.runtimeVersion, "32.0.0.414");
  assert.equal(artifact.runtimeEnvironmentPrerequisite.runtimeApprovedByOwner, false);
  assert.equal(artifact.runtimeEnvironmentPrerequisite.originalRuntimeExecutionReady, false);
  assert.equal(artifact.runtimeContainmentPrerequisite.requiredForEveryRuntimeSession, true);
  assert.equal(artifact.runtimeContainmentPrerequisite.controlsSpecified, 8);
  assert.equal(artifact.runtimeContainmentPrerequisite.controlsApproved, 0);
  assert.equal(artifact.runtimeContainmentPrerequisite.sideEffectContainmentApproved, false);
  assert.equal(artifact.runtimeContainmentPrerequisite.safeToExecuteNow, false);
  assert.equal(artifact.operatorWorksheet.status, "empty-template-planning-only");
  assert.equal(artifact.operatorWorksheet.namedOriginalRuntimeOperator, null);
  assert.deepEqual(artifact.operatorWorksheet.captureSchedule, []);
  assert.deepEqual(artifact.operatorWorksheet.pngFiles, []);
  assert.equal(artifact.executionGate.runnable, false);
  assert.equal(artifact.executionGate.launchesAnimate, false);
  assert.equal(artifact.executionGate.launchesOriginalRuntime, false);
  assert.equal(artifact.acceptance.acceptanceNeutral, true);
  assert.equal(artifact.acceptance.strictComplete, false);
  assert.match(artifact.artifactFingerprintSha256, /^[a-f0-9]{64}$/);

  const ts006Artifact = JSON.parse(await readFile(path.join(
    migrationsRoot,
    "course-g04-l03-ts-006",
    WORKSPACE_ARTIFACT_RELATIVE,
  )));
  assert.deepEqual(ts006Artifact.executionGate.preparedContainmentControlIds, ["CR-02"]);
  assert.equal(ts006Artifact.preparedContainmentArtifacts.length, 1);
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].controlId, "CR-02");
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].summary.files, 657);
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].summary.bytes, 35_469_789);
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].stagedRoot.fileMode, "0444");
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].approved, false);
  assert.equal(ts006Artifact.preparedContainmentArtifacts[0].verifiedForExecution, false);
  assert.equal(ts006Artifact.executionGate.runnable, false);
  for (const item of contract.items.filter((candidate) => candidate.animationId !== "course-g04-l03-ts-006")) {
    const other = JSON.parse(await readFile(path.join(
      migrationsRoot,
      item.animationId,
      WORKSPACE_ARTIFACT_RELATIVE,
    )));
    assert.deepEqual(other.preparedContainmentArtifacts, []);
    assert.deepEqual(other.executionGate.preparedContainmentControlIds, []);
  }

  for (const item of contract.items) {
    assert.deepEqual(
      await readFile(path.join(migrationsRoot, item.animationId, "migration.json")),
      manifestBytes.get(item.animationId),
    );
  }
  const check = await materializeG4L3WorkspaceRuntimeAcquisition({root: projectRoot, migrationsRoot, check: true});
  assert.equal(check.changed, 0);
  assert.ok(check.results.every((entry) => entry.action === "up-to-date"));
});

test("check fails closed on artifact drift without touching any manifest", async (t) => {
  const {migrationsRoot, contract} = await workspaceFixture(t);
  await materializeG4L3WorkspaceRuntimeAcquisition({root: projectRoot, migrationsRoot});
  const target = contract.items[0];
  const artifactPath = path.join(migrationsRoot, target.animationId, WORKSPACE_ARTIFACT_RELATIVE);
  const manifestPath = path.join(migrationsRoot, target.animationId, "migration.json");
  const manifestBefore = await readFile(manifestPath);
  await writeFile(artifactPath, `${await readFile(artifactPath, "utf8")} `);
  await assert.rejects(
    materializeG4L3WorkspaceRuntimeAcquisition({root: projectRoot, migrationsRoot, check: true}),
    new RegExp(`stale or missing: ${target.animationId}`),
  );
  assert.deepEqual(await readFile(manifestPath), manifestBefore);
});

test("all-member prevalidation rejects migration identity drift before the first artifact write", async (t) => {
  const {migrationsRoot, contract} = await workspaceFixture(t);
  const last = contract.items.at(-1);
  const lastManifestPath = path.join(migrationsRoot, last.animationId, "migration.json");
  const lastManifest = JSON.parse(await readFile(lastManifestPath));
  lastManifest.assetId = `swf-${"0".repeat(64)}`;
  await writeFile(lastManifestPath, `${JSON.stringify(lastManifest, null, 2)}\n`);
  await assert.rejects(
    materializeG4L3WorkspaceRuntimeAcquisition({root: projectRoot, migrationsRoot}),
    /migration assetId mismatch/,
  );
  const first = contract.items[0];
  await assert.rejects(
    readFile(path.join(migrationsRoot, first.animationId, WORKSPACE_ARTIFACT_RELATIVE)),
    {code: "ENOENT"},
  );
});

test("current repository has 40 up-to-date workspace planning artifacts", async () => {
  const result = await materializeG4L3WorkspaceRuntimeAcquisition({check: true});
  assert.equal(result.members, 40);
  assert.equal(result.changed, 0);
  assert.equal(result.runtimeSessionsExecuted, 0);
  assert.equal(result.acceptanceChanges, 0);
});

test("CLI exposes only dry-run/check planning modes", () => {
  assert.equal(parseArguments(["--dry-run"]).dryRun, true);
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--dry-run", "--check"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--operator", "name"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
});
