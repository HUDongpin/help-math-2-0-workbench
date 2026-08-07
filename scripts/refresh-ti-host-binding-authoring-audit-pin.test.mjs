import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseArguments,
  planTiHostBindingAuthoringAuditPin,
  refreshTiHostBindingAuthoringAuditPin,
} from "./refresh-ti-host-binding-authoring-audit-pin.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function writeProjectFile(root, relative, bytes) {
  const file = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  return file;
}

async function createFixture({auditMutation, resolutionMutation} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ti-host-binding-pin-"));
  const tiAnimationId = "ti-pilot";
  const irAnimationId = "ir-pilot";
  const tiSourceSwf = "source-assets/flash/ti.swf";
  const irSourceFla = "source-assets/flash/ir.fla";
  const tiBytes = Buffer.from("owner TI SWF bytes");
  const flaBytes = Buffer.from("owner IR FLA bytes");
  const tiSourceSwfSha256 = hash(tiBytes);
  const irSourceFlaSha256 = hash(flaBytes);
  await writeProjectFile(root, tiSourceSwf, tiBytes);
  await writeProjectFile(root, irSourceFla, flaBytes);

  const embedded = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    timeline: {frameCount: 2, layers: []},
    library: [],
  };
  const audit = {
    schemaVersion: 2,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
    animationId: irAnimationId,
    protocol: {
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
      recursiveLibraryTimelineAuditVerified: true,
    },
    source: {fla: irSourceFla, flaSha256: irSourceFlaSha256},
    nativeMovie: {width: 800, height: 600, fps: 12, frameCount: 2},
    rawAuditSha256: hash(Buffer.from(JSON.stringify(embedded))),
    authoringAudit: embedded,
  };
  if (auditMutation) auditMutation(audit);
  const dependencyPath = `migrations/${irAnimationId}/audit/adobe-animate-2021-authoring-audit.json`;
  const auditText = `${JSON.stringify(audit, null, 2)}\n`;
  const expectedCurrentDependencySha256 = hash(auditText);
  await writeProjectFile(root, dependencyPath, auditText);

  const irManifestPath = `migrations/${irAnimationId}/migration.json`;
  await writeProjectFile(root, irManifestPath, `${JSON.stringify({
    id: irAnimationId,
    animationId: irAnimationId,
    source: {fla: irSourceFla, flaSha256: irSourceFlaSha256},
    runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 2},
    audit: {machineEvidence: {authoringEvidence: {
      schemaVersion: 2,
      evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
      file: "audit/adobe-animate-2021-authoring-audit.json",
      sha256: expectedCurrentDependencySha256,
    }}},
  }, null, 2)}\n`);

  const expectedPriorDependencySha256 = "1".repeat(64);
  const dependencyArtifactId = "paired-common-authoring-audit";
  const resolution = {
    schemaVersion: 1,
    animationId: tiAnimationId,
    status: "binding-names-resolved-runtime-scenarios-pending",
    source: {swf: tiSourceSwf, swfSha256: tiSourceSwfSha256},
    authority: {claim: "unchanged authority claim", originalShellExecuted: false},
    entryHandoff: {status: "preserve"},
    commonComponentEvidence: {limitations: "preserve"},
    evidenceArtifacts: [
      {artifactId: "source-swf", path: tiSourceSwf, sha256: tiSourceSwfSha256},
      {artifactId: dependencyArtifactId, path: dependencyPath, sha256: expectedPriorDependencySha256},
    ],
    bindings: [{binding: "_global", disposition: "intrinsic-avm1-global-namespace"}],
    remainingAuthoritativeBlockers: ["runtime remains pending"],
    strictAcceptanceEffect: "none",
  };
  if (resolutionMutation) resolutionMutation(resolution);
  const resolutionPath = `migrations/${tiAnimationId}/audit/host-binding-resolution.json`;
  const resolutionText = `${JSON.stringify(resolution, null, 2)}\n`;
  const resolutionFile = await writeProjectFile(root, resolutionPath, resolutionText);
  const contract = {
    tiAnimationId,
    resolutionPath,
    tiSourceSwf,
    tiSourceSwfSha256,
    dependencyArtifactId,
    dependencyPath,
    expectedPriorDependencySha256,
    expectedCurrentDependencySha256,
    expectedPriorResolutionSha256: hash(resolutionText),
    irAnimationId,
    irManifestPath,
    irSourceFla,
    irSourceFlaSha256,
  };
  return {root, contract, resolutionFile, resolution};
}

test("CLI accepts only the targeted check mode", () => {
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--id", "anything"]), /Unknown option/);
});

test("refreshes only the exact dependency pin and records the machine amendment", async () => {
  const fixture = await createFixture();
  const beforeText = await readFile(fixture.resolutionFile, "utf8");
  const before = JSON.parse(beforeText);
  const result = await refreshTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract});
  assert.equal(result.action, "written");

  const after = JSON.parse(await readFile(fixture.resolutionFile, "utf8"));
  const target = after.evidenceArtifacts.find(({artifactId}) => artifactId === fixture.contract.dependencyArtifactId);
  assert.equal(target.sha256, fixture.contract.expectedCurrentDependencySha256);
  assert.equal(after.machineBindingAmendments.length, 1);
  assert.equal(after.machineBindingAmendments[0].dependency.priorSha256, fixture.contract.expectedPriorDependencySha256);
  assert.equal(after.machineBindingAmendments[0].dependency.currentSha256, fixture.contract.expectedCurrentDependencySha256);
  assert.match(after.machineBindingAmendments[0].reason, /only the exact raw-file SHA dependency pin/);

  const normalized = structuredClone(after);
  normalized.evidenceArtifacts.find(({artifactId}) => artifactId === fixture.contract.dependencyArtifactId).sha256 = fixture.contract.expectedPriorDependencySha256;
  delete normalized.machineBindingAmendments;
  assert.deepEqual(normalized, before);
  assert.deepEqual(after.authority, before.authority);
  assert.deepEqual(after.bindings, before.bindings);
  assert.equal(after.strictAcceptanceEffect, before.strictAcceptanceEffect);

  const checked = await refreshTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract, check: true});
  assert.equal(checked.action, "verified");
});

test("check mode reports stale and performs no write", async () => {
  const fixture = await createFixture();
  const before = await readFile(fixture.resolutionFile, "utf8");
  await assert.rejects(
    refreshTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract, check: true}),
    /dependency pin is stale/,
  );
  assert.equal(await readFile(fixture.resolutionFile, "utf8"), before);
});

test("fails closed on a changed dependency path, legacy audit schema, or mutated source", async (t) => {
  await t.test("dependency path", async () => {
    const fixture = await createFixture({resolutionMutation: (resolution) => {
      resolution.evidenceArtifacts[1].path = "migrations/ir-pilot/audit/other.json";
    }});
    await assert.rejects(planTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract}), /dependency path changed/);
  });

  await t.test("legacy authoring schema", async () => {
    const fixture = await createFixture({auditMutation: (audit) => { audit.schemaVersion = 1; }});
    await assert.rejects(planTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract}), /must be schema v2/);
  });

  await t.test("mutated owner source", async () => {
    const fixture = await createFixture();
    await writeFile(path.join(fixture.root, fixture.contract.irSourceFla), "mutated FLA bytes");
    await assert.rejects(planTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract}), /source bytes do not match/);
  });
});

test("rejects a current pin that has no exact amendment record", async () => {
  const fixture = await createFixture();
  const report = JSON.parse(await readFile(fixture.resolutionFile, "utf8"));
  report.evidenceArtifacts.find(({artifactId}) => artifactId === fixture.contract.dependencyArtifactId).sha256 = fixture.contract.expectedCurrentDependencySha256;
  await writeFile(fixture.resolutionFile, `${JSON.stringify(report, null, 2)}\n`);
  await assert.rejects(
    planTiHostBindingAuthoringAuditPin({root: fixture.root, contract: fixture.contract}),
    /lacks the exact machine amendment record/,
  );
});
