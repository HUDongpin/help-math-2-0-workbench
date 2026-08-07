import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildM2SourceAuditReadinessReport,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateM2SourceAuditReadinessReport,
  validateReleaseManifest,
  validateWorkspaceAuditBinding,
} from "./build-g4-l3-m2-source-audit-readiness.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const OWNED_SOURCE = "g4-l3-static-machine-source-audit";
const MACHINE_AUDIT_SET_SHA256 = "ef3e3f2d6757778662d280d10a4b04f46da84f0bd402c9d6c41017f58da69709";
let reportPromise;

function buildOnce() {
  reportPromise ||= buildM2SourceAuditReadinessReport({root: ROOT});
  return reportPromise;
}

function clone(value) {
  return structuredClone(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function refingerprintArtifact(artifact) {
  const projection = clone(artifact);
  delete projection.artifactFingerprintSha256;
  artifact.artifactFingerprintSha256 = sha256(`${JSON.stringify(projection, null, 2)}\n`);
  return artifact;
}

test("selects the exact G4 L3 release by releaseId and rejects zero or duplicate matches", async () => {
  const manifest = JSON.parse(await readFile(path.join(ROOT, "catalog/lesson-releases.json"), "utf8"));
  assert.equal(validateReleaseManifest(manifest).releaseId, RELEASE_ID);

  const missing = clone(manifest);
  missing.releases = missing.releases.filter(({releaseId}) => releaseId !== RELEASE_ID);
  assert.throws(() => validateReleaseManifest(missing), /Expected exactly one declared lesson-g04-l03-negative-numbers release/);

  const duplicate = clone(manifest);
  duplicate.releases.push(clone(duplicate.releases.find(({releaseId}) => releaseId === RELEASE_ID)));
  assert.throws(() => validateReleaseManifest(duplicate), /Expected exactly one declared lesson-g04-l03-negative-numbers release/);
});

test("validates the exact ordered 39-page plus shell M2 scope", async () => {
  const report = await buildOnce();
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.scope.canonicalMembers, 40);
  assert.equal(report.scope.activePages, 39);
  assert.equal(report.scope.courseShells, 1);
  assert.deepEqual(report.scope.batchSizes, [25, 15]);
  assert.equal(report.scope.flaBacked, 29);
  assert.equal(report.scope.swfOnly, 11);
  assert.equal(report.summary.orderedReleaseMembersValidated, 40);
  assert.equal(report.summary.upstreamEvidenceReportsValidated, 9);
  assert.equal(report.summary.machineAuditSetSha256, MACHINE_AUDIT_SET_SHA256);
  assert.equal(report.items.length, 40);
  assert.deepEqual(report.items.map(({ordinal}) => ordinal),
    Array.from({length: 40}, (_, index) => index + 1));
  assert.equal(report.items.at(-1).animationId, "shell-course-g04-l03-index-local");
  assert.equal(report.items.at(-1).releaseRole, "course-shell");
});

test("proves artifact-only source audits and v2 machine-only inventory outputs", async () => {
  const report = await buildOnce();
  assert.equal(report.summary.workspaceSourceAuditArtifactsValidated, 40);
  assert.equal(report.summary.migrationManifestsInspectedReadOnly, 40);
  assert.equal(report.summary.migrationSourceAuditBindingsExpected, 0);
  assert.equal(report.summary.migrationSourceAuditBindingsObserved, 0);
  assert.equal(report.summary.sourceAuditOwnedManifestEntriesObserved, 0);
  assert.equal(report.summary.workspaceInventoryReceiptsValidated, 40);
  assert.equal(report.summary.workspaceMachineInventoryOutputsValidated, 80);
  assert.equal(report.summary.workspaceCanonicalInventoryReadOnlyBindingsValidated, 80);
  assert.equal(report.summary.workspaceInventoryArtifactsValidated, 120);
  assert.equal(report.summary.workspaceMachineAssetDefinitionRows, 8068);
  assert.equal(report.summary.workspaceMachineEmbeddedAudioCandidateRows, 359);
  assert.equal(report.summary.workspaceMachineCatalogAudioCandidateRows, 359);
  assert.equal("migrationBindingsValidated" in report.summary, false);
  assert.equal("workspaceInventoryOutputsValidated" in report.summary, false);

  for (const item of report.items) {
    const workspace = `migrations/${item.animationId}`;
    assert.equal(item.migrationStatus, "preserved");
    assert.equal(item.migrationManifestBoundary.file, `${workspace}/migration.json`);
    assert.equal(item.migrationManifestBoundary.sourceAuditBindingExpected, false);
    assert.equal(item.migrationManifestBoundary.sourceAuditBindingObserved, false);
    assert.equal(item.migrationManifestBoundary.sourceAuditOwnedEvidenceEntries, 0);
    assert.equal(item.workspaceInventory.receipt.schemaVersion, 2);
    assert.equal(item.workspaceInventory.machineOutputs.assetDefinitions.file,
      `${workspace}/audit/machine/g4-l3-swf-definition-inventory.csv`);
    assert.equal(item.workspaceInventory.machineOutputs.audioSourceCandidates.file,
      `${workspace}/audit/machine/g4-l3-audio-source-candidates.csv`);
    assert.equal(item.workspaceInventory.canonicalReadOnlyBindings.assetInventory.file,
      `${workspace}/asset-inventory.csv`);
    assert.equal(item.workspaceInventory.canonicalReadOnlyBindings.audioInventory.file,
      `${workspace}/audio-inventory.csv`);
    assert.equal(item.workspaceInventory.canonicalReadOnlyBindings.assetInventory.changedByMaterializer, false);
    assert.equal(item.workspaceInventory.canonicalReadOnlyBindings.audioInventory.changedByMaterializer, false);
    const audio = item.workspaceInventory.machineOutputs.audioSourceCandidates;
    assert.equal(audio.rowCount, audio.embeddedAudioRows + audio.catalogAssociationRows);
  }
});

test("binds 29/29 work-only authoring audits without opening runtime or acceptance gates", async () => {
  const report = await buildOnce();
  assert.equal(report.readiness.machineAuditComplete, true);
  assert.equal(report.readiness.machineAuditMeaning, "static-artifact-completeness-only");
  assert.equal(report.summary.machineAuditCompleteMembers, 40);
  assert.ok(report.items.every((item) =>
    item.readiness.machineAuditMeaning === "static-artifact-completeness-only"));
  assert.equal(report.readiness.workOnlyAuthoringAuditCoverageComplete, true);
  assert.equal(report.readiness.authoringAccepted, false);
  assert.equal(report.summary.verifiedWorkOnlyAuthoringAudits, 29);
  assert.equal(report.summary.completedAuthoringAudits, 29);
  assert.equal(report.summary.pendingApplicableAuthoringAudits, 0);
  assert.equal(report.summary.authoringAuditNotApplicableMembers, 11);
  assert.equal(report.summary.authoringAuditDispositionCompleteMembers, 40);
  assert.equal(report.items.filter((item) => item.readiness.workOnlyAuthoringAuditEstablished).length, 29);
  assert.equal(report.items.filter((item) => item.workOnlyAuthoringEvidence.status === "not-applicable-swf-only").length, 11);
  for (const key of [
    "authoritativeRuntimeComplete",
    "finalSpecificationReady",
    "implementationAuthorized",
    "strictComplete",
  ]) {
    assert.equal(report.readiness[key], false, key);
    assert.ok(report.items.every((item) => item.readiness[key] === false), key);
  }
  assert.equal(report.summary.authoritativeRuntimeCompleteMembers, 0);
  assert.equal(report.summary.finalSpecificationReadyMembers, 0);
  assert.equal(report.summary.implementationAuthorizedMembers, 0);
  assert.equal(report.summary.strictCompleteMembers, 0);
  assert.equal(report.authorityBoundary.authoringAuthorityEstablished, false);
  assert.equal(report.authorityBoundary.workOnlyAuthoringEvidenceBound, true);
  assert.equal(report.authorityBoundary.authoringAuditIsOriginalRuntimeProof, false);
  assert.equal(report.authorityBoundary.authoritativeRuntimeEstablished, false);
  assert.equal(report.authorityBoundary.finalSpecificationAuthorityEstablished, false);
  assert.equal(report.authorityBoundary.implementationAuthorityEstablished, false);
  assert.equal(report.authorityBoundary.strictAcceptanceEffect, false);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("report validator fails closed on coverage, path, ownership, hash, or gate drift", async () => {
  const report = await buildOnce();

  const coverage = clone(report);
  coverage.summary.workspaceSourceAuditArtifactsValidated = 39;
  assert.throws(() => validateM2SourceAuditReadinessReport(coverage), /completeness summary drifted/);

  const promoted = clone(report);
  promoted.readiness.implementationAuthorized = true;
  assert.throws(() => validateM2SourceAuditReadinessReport(promoted), /unexpectedly opened/);

  const authoringPromotion = clone(report);
  authoringPromotion.items[0].workOnlyAuthoringEvidence.originalRuntimeEvidence = true;
  assert.throws(() => validateM2SourceAuditReadinessReport(authoringPromotion), /authoring disposition drifted/);

  const manifestBinding = clone(report);
  manifestBinding.items[0].migrationManifestBoundary.sourceAuditBindingObserved = true;
  assert.throws(() => validateM2SourceAuditReadinessReport(manifestBinding),
    /artifact-only migration-manifest boundary drifted/);

  const generatedCanonical = clone(report);
  generatedCanonical.items[0].workspaceInventory.canonicalReadOnlyBindings.assetInventory.changedByMaterializer = true;
  assert.throws(() => validateM2SourceAuditReadinessReport(generatedCanonical),
    /represented as a generated output/);

  const pathDrift = clone(report);
  pathDrift.items[0].workspaceInventory.machineOutputs.assetDefinitions.file =
    `migrations/${pathDrift.items[0].animationId}/asset-inventory.csv`;
  assert.throws(() => validateM2SourceAuditReadinessReport(pathDrift), /path architecture drifted/);

  const materializerDrift = clone(report);
  materializerDrift.items[0].workspaceArtifact.materializer.sha256 = "0".repeat(64);
  assert.throws(() => validateM2SourceAuditReadinessReport(materializerDrift),
    /source-audit artifact path or materializer drifted/);

  const hashDrift = clone(report);
  hashDrift.items[0].workspaceArtifact.sha256 = "0".repeat(64);
  assert.throws(() => validateM2SourceAuditReadinessReport(hashDrift), /evidence-set SHA-256 is missing or stale/);

  const policy = clone(report);
  policy.bindingPolicy.canonicalInventoryFilesAreReadOnlyBindings = false;
  assert.throws(() => validateM2SourceAuditReadinessReport(policy), /binding policy drifted/);
});

test("workspace validator rejects artifact drift and any source-audit-owned manifest evidence", async () => {
  const releases = JSON.parse(await readFile(path.join(ROOT, "catalog/lesson-releases.json"), "utf8"));
  const member = releases.releases.find(({releaseId}) => releaseId === RELEASE_ID).members[0];
  const machine = JSON.parse(await readFile(
    path.join(ROOT, "reports/g4-l3-machine-source-audits.json"), "utf8"));
  const machineItem = {
    ...machine.items[0],
    __auditSetSha256: machine.summary.auditSetSha256,
  };
  const workspace = path.join(ROOT, "migrations", member.animationId);
  const artifactBytes = await readFile(path.join(workspace, "audit/machine/g4-l3-source-audit.json"));
  const manifestBytes = await readFile(path.join(workspace, "migration.json"));
  const artifact = JSON.parse(artifactBytes);
  const manifest = JSON.parse(manifestBytes);
  const artifactPhysical = {
    file: `migrations/${member.animationId}/audit/machine/g4-l3-source-audit.json`,
    bytes: artifactBytes.length,
    sha256: sha256(artifactBytes),
  };
  const manifestPhysical = {
    file: `migrations/${member.animationId}/migration.json`,
    bytes: manifestBytes.length,
    sha256: sha256(manifestBytes),
  };
  const validate = (nextArtifact, nextManifest) => validateWorkspaceAuditBinding({
    member,
    machineItem,
    artifact: nextArtifact,
    artifactPhysical,
    manifest: nextManifest,
    manifestPhysical,
  });
  assert.doesNotThrow(() => validate(artifact, manifest));

  const artifactTamper = clone(artifact);
  artifactTamper.machineFindings.runtime.fps = 99;
  assert.throws(() => validate(artifactTamper, manifest), /artifact fingerprint drifted/);

  const promotedArtifact = refingerprintArtifact(clone(artifact));
  promotedArtifact.acceptance.migrationManifestBindings = 1;
  refingerprintArtifact(promotedArtifact);
  assert.throws(() => validate(promotedArtifact, manifest), /acceptance boundary was promoted/);

  const manifestBinding = clone(manifest);
  manifestBinding.audit.machineEvidence = {
    ...(manifestBinding.audit.machineEvidence || {}),
    g4L3SourceAudit: {artifactPath: "audit/machine/g4-l3-source-audit.json"},
  };
  assert.throws(() => validate(artifact, manifestBinding), /owned migration manifest binding/);

  const manifestEvidence = clone(manifest);
  manifestEvidence.runtime.scripts.push({source: OWNED_SOURCE});
  assert.throws(() => validate(artifact, manifestEvidence), /owned migration manifest evidence/);
});

test("checked-in JSON and Markdown are deterministic, current, and explicit about artifact ownership", async () => {
  const report = await buildOnce();
  const [json, markdown] = await Promise.all([
    readFile(path.join(ROOT, "reports/g4-l3-m2-source-audit-readiness.json"), "utf8"),
    readFile(path.join(ROOT, "reports/g4-l3-m2-source-audit-readiness.md"), "utf8"),
  ]);
  assert.equal(json, stableJson(report));
  assert.equal(markdown, renderMarkdown(report));
  assert.match(markdown, /Machine audit complete: \*\*40\/40 \(true, static artifact completeness only\)\*\*/);
  assert.match(markdown, /0 expected \/ 0 observed/);
  assert.match(markdown, /80\/80 machine CSV outputs/);
  assert.match(markdown, /80\/80 read-only bindings/);
  assert.match(markdown, /29\/29 applicable verified; 11 SWF-only n\/a; 0 pending/);
  assert.match(markdown, /Authoritative original runtime complete: \*\*0\/40 \(false\)\*\*/);
  assert.match(markdown, /Final specification ready: \*\*0\/40 \(false\)\*\*/);
  assert.match(markdown, /Implementation authorized: \*\*0\/40 \(false\)\*\*/);
  assert.match(markdown, /Strict complete: \*\*0\/40 \(false\)\*\*/);
  assert.doesNotMatch(markdown, /matching `migration\.json` binding/i);
  assert.doesNotMatch(markdown, /strict migration complete: true/i);
});

test("CLI exposes deterministic outputs and rejects authority-changing options", () => {
  const options = parseArguments([
    "--check",
    "--json-output", "reports/a.json",
    "--markdown-output", "reports/a.md",
  ]);
  assert.equal(options.check, true);
  assert.match(options.jsonOutput, /reports\/a\.json$/);
  assert.match(options.markdownOutput, /reports\/a\.md$/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(() => parseArguments(["--mark-complete"]), /Unknown option/);
});
