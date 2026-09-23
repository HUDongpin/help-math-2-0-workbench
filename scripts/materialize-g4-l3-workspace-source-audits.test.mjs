import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  extractStaticDisplayFacts,
  materializeG4L3WorkspaceSourceAudits,
  removeG4L3WorkspaceManifestBindings,
} from "./materialize-g4-l3-workspace-source-audits.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRelative = path.join("audit", "machine", "g4-l3-source-audit.json");
const ownedSource = "g4-l3-static-machine-source-audit";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function releaseMembers() {
  const catalog = JSON.parse(await readFile(path.join(projectRoot, "catalog", "lesson-releases.json")));
  return catalog.releases.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers").members;
}

function addLegacyOwnedManifestBindings(manifest) {
  const next = structuredClone(manifest);
  next.runtime.backgroundColor = next.runtime.backgroundColor || "#b8d8f7";
  next.runtime.actionScriptVersion = next.runtime.actionScriptVersion === "unknown"
    ? "AS1/2"
    : next.runtime.actionScriptVersion;
  next.toolVersions.ffdec = next.toolVersions.ffdec === "unavailable"
    ? "JPEXS Free Flash Decompiler v.26.2.1"
    : next.toolVersions.ffdec;
  next.runtime.scripts.push({source: ownedSource, evidence: artifactRelative, confidence: "machine-extracted-static"});
  for (const key of ["masks", "morphs", "filters", "networkCalls"]) {
    next.audit[key].push({source: ownedSource, kind: `${key}-fixture-candidate`, evidence: artifactRelative});
  }
  next.audit.machineEvidence = {
    ...(next.audit.machineEvidence || {}),
    g4L3SourceAudit: {
      schemaVersion: 1,
      status: "partial",
      artifactPath: artifactRelative,
      artifactSha256: "a".repeat(64),
      acceptanceEffect: "none",
    },
  };
  return next;
}

async function createWorkspaceFixture(t, {polluted = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-g4-l3-workspace-audits-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const migrationsRoot = path.join(root, "migrations");
  await mkdir(migrationsRoot, {recursive: true});
  const members = await releaseMembers();
  for (const member of members) {
    const workspace = path.join(migrationsRoot, member.animationId);
    await mkdir(path.join(workspace, "audit"), {recursive: true});
    const sourceManifestPath = path.join(projectRoot, "migrations", member.animationId, "migration.json");
    const fixtureManifestPath = path.join(workspace, "migration.json");
    await copyFile(sourceManifestPath, fixtureManifestPath);
    const sourceManifest = JSON.parse(await readFile(fixtureManifestPath));
    const cleanManifest = removeG4L3WorkspaceManifestBindings(sourceManifest);
    await writeFile(fixtureManifestPath, stableJson(polluted
      ? addLegacyOwnedManifestBindings(cleanManifest)
      : cleanManifest));
  }
  return {root, migrationsRoot, members};
}

function assertArtifactOnlyManifest(manifest) {
  assert.ok(!(manifest.runtime.scripts || []).some(({source}) => source === ownedSource));
  for (const key of ["masks", "morphs", "filters", "networkCalls"]) {
    assert.ok(!(manifest.audit[key] || []).some(({source}) => source === ownedSource), `${key} retained owned evidence`);
  }
  assert.equal(manifest.audit.machineEvidence?.g4L3SourceAudit, undefined);
}

test("extracts deterministic background and clip-depth candidates from a physical G4 L3 SWF", async () => {
  const report = JSON.parse(await readFile(path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json")));
  const target = report.items.find(({animationId}) => animationId === "course-g04-l03-in-009");
  const facts = extractStaticDisplayFacts(await readFile(path.join(projectRoot, target.source.swf.path)));
  assert.equal(facts.backgroundColor, "#b8d8f7");
  assert.equal(facts.observedTagCounts.SetBackgroundColor, target.swf.tagCounts.SetBackgroundColor);
  assert.equal(facts.observedTagCounts.PlaceObject2, target.swf.tagCounts.PlaceObject2);
  assert.equal(facts.observedTagCounts.PlaceObject3, 0);
  assert.ok(facts.masks.length > 0);
  assert.ok(facts.masks.every(({clipDepth, depth}) => Number.isInteger(clipDepth) && Number.isInteger(depth)));
  assert.deepEqual(facts.filters, []);
});

test("dry-run prevalidates all 40 members without writing artifacts or manifests", async (t) => {
  const {migrationsRoot, members} = await createWorkspaceFixture(t);
  const firstManifest = path.join(migrationsRoot, members[0].animationId, "migration.json");
  const before = await readFile(firstManifest);
  const result = await materializeG4L3WorkspaceSourceAudits({
    root: projectRoot,
    sourceRoot: projectRoot,
    migrationsRoot,
    dryRun: true,
  });
  assert.equal(result.mode, "dry-run");
  assert.equal(result.members, 40);
  assert.equal(result.artifactChanges, 40);
  assert.equal(result.manifestChanges, 0);
  assert.ok(result.results.every(({action}) => action === "would-write"));
  assert.deepEqual(await readFile(firstManifest), before);
  await assert.rejects(
    readFile(path.join(migrationsRoot, members[0].animationId, artifactRelative)),
    {code: "ENOENT"},
  );
});

test("artifact-only steady state preserves later authoring scalars and non-owned evidence", async () => {
  const manifest = JSON.parse(await readFile(
    path.join(projectRoot, "migrations", "course-g04-l03-rw-002", "migration.json"),
  ));
  manifest.runtime.backgroundColor = "#123456";
  manifest.runtime.actionScriptVersion = "AS3";
  manifest.toolVersions.ffdec = "future-reviewed-version";
  manifest.audit.machineEvidence = {futureAuthoringAudit: {status: "reviewed"}};
  const result = removeG4L3WorkspaceManifestBindings(manifest);
  assert.deepEqual(result, manifest);
});

test("artifact-only write is deterministic, hash-bound and leaves clean manifests byte-identical", async (t) => {
  const {migrationsRoot, members} = await createWorkspaceFixture(t);
  const advancedId = "course-g04-l03-in-009";
  const advancedManifestPath = path.join(migrationsRoot, advancedId, "migration.json");
  const beforeManifestBytes = await readFile(advancedManifestPath);

  const writeResult = await materializeG4L3WorkspaceSourceAudits({
    root: projectRoot,
    sourceRoot: projectRoot,
    migrationsRoot,
  });
  assert.equal(writeResult.members, 40);
  assert.equal(writeResult.changed, 40);
  assert.equal(writeResult.artifactChanges, 40);
  assert.equal(writeResult.manifestChanges, 0);

  const artifactPath = path.join(migrationsRoot, advancedId, artifactRelative);
  const artifactBytes = await readFile(artifactPath);
  const artifact = JSON.parse(artifactBytes);
  const fingerprintInput = structuredClone(artifact);
  delete fingerprintInput.artifactFingerprintSha256;
  assert.equal(artifact.schemaVersion, 1);
  assert.equal(artifact.artifactType, "g4-l3-workspace-source-audit");
  assert.equal(artifact.identity.animationId, advancedId);
  assert.equal(artifact.acceptance.acceptanceNeutral, true);
  assert.equal(artifact.acceptance.acceptanceEffect, "none");
  assert.equal(artifact.acceptance.migrationManifestBindings, 0);
  assert.equal(artifact.provenance.upstreamMachineAudit.itemJsonPointer, "/items/19");
  assert.equal(artifact.artifactFingerprintSha256, sha256(stableJson(fingerprintInput)));
  assert.ok(artifact.limitations.every((limitation) => typeof limitation === "string" && limitation.length > 20));

  const afterManifestBytes = await readFile(advancedManifestPath);
  assert.deepEqual(afterManifestBytes, beforeManifestBytes);
  const afterManifest = JSON.parse(afterManifestBytes);
  assertArtifactOnlyManifest(afterManifest);
  assert.equal(technicalManifestSha256(afterManifest), "cc2f892649a52ef43d1423842b040924fcea2c4dacb32eea099bdac1f8a612a3");

  const checkResult = await materializeG4L3WorkspaceSourceAudits({
    root: projectRoot,
    sourceRoot: projectRoot,
    migrationsRoot,
    check: true,
  });
  assert.equal(checkResult.changed, 0);
  assert.ok(checkResult.results.every(({action}) => action === "up-to-date"));

  await writeFile(artifactPath, `${artifactBytes.toString("utf8")} `);
  await assert.rejects(
    materializeG4L3WorkspaceSourceAudits({
      root: projectRoot,
      sourceRoot: projectRoot,
      migrationsRoot,
      check: true,
    }),
    /source audits are stale or missing: course-g04-l03-in-009\(artifact\)/,
  );
});

test("prevalidation is all-member and transactional cleanup restores exact artifact-only manifest state", async (t) => {
  const {migrationsRoot, members} = await createWorkspaceFixture(t, {polluted: true});
  const firstManifestPath = path.join(migrationsRoot, members[0].animationId, "migration.json");
  const firstBefore = await readFile(firstManifestPath);
  const expectedClean = new Map();
  for (const member of members) {
    const manifestPath = path.join(migrationsRoot, member.animationId, "migration.json");
    const polluted = JSON.parse(await readFile(manifestPath));
    expectedClean.set(member.animationId, stableJson(removeG4L3WorkspaceManifestBindings(polluted)));
  }
  const last = members.at(-1);
  const lastManifestPath = path.join(migrationsRoot, last.animationId, "migration.json");
  const lastManifest = JSON.parse(await readFile(lastManifestPath));
  lastManifest.assetId = `swf-${"0".repeat(64)}`;
  await writeFile(lastManifestPath, stableJson(lastManifest));

  await assert.rejects(
    materializeG4L3WorkspaceSourceAudits({
      root: projectRoot,
      sourceRoot: projectRoot,
      migrationsRoot,
    }),
    /shell-course-g04-l03-index-local: migration assetId mismatch/,
  );
  assert.deepEqual(await readFile(firstManifestPath), firstBefore);
  await assert.rejects(
    readFile(path.join(migrationsRoot, members[0].animationId, artifactRelative)),
    {code: "ENOENT"},
  );

  lastManifest.assetId = last.assetId;
  await writeFile(lastManifestPath, stableJson(lastManifest));
  const cleanup = await materializeG4L3WorkspaceSourceAudits({
    root: projectRoot,
    sourceRoot: projectRoot,
    migrationsRoot,
  });
  assert.equal(cleanup.artifactChanges, 40);
  assert.equal(cleanup.manifestChanges, 40);
  for (const member of members) {
    const manifestPath = path.join(migrationsRoot, member.animationId, "migration.json");
    const bytes = await readFile(manifestPath, "utf8");
    assert.equal(bytes, expectedClean.get(member.animationId));
    const manifest = JSON.parse(bytes);
    assertArtifactOnlyManifest(manifest);
    if (member.animationId === "course-g04-l03-in-009") {
      assert.equal(technicalManifestSha256(manifest), "cc2f892649a52ef43d1423842b040924fcea2c4dacb32eea099bdac1f8a612a3");
      assert.equal(manifest.runtime.backgroundColor, "#b8d8f7");
      assert.equal(manifest.runtime.actionScriptVersion, "AS1/2");
      assert.equal(manifest.toolVersions.ffdec, "JPEXS Free Flash Decompiler v.26.2.1");
    } else if (member.animationId === "shell-course-g04-l03-index-local") {
      assert.equal(manifest.runtime.backgroundColor, "#ffffff");
      assert.equal(manifest.runtime.actionScriptVersion, "AS1/2");
      assert.equal(manifest.toolVersions.ffdec, "JPEXS Free Flash Decompiler v.26.2.1");
    } else {
      const expected = JSON.parse(expectedClean.get(member.animationId));
      assert.equal(manifest.runtime.backgroundColor, expected.runtime.backgroundColor);
      assert.equal(manifest.runtime.actionScriptVersion, expected.runtime.actionScriptVersion);
      assert.equal(manifest.toolVersions.ffdec, expected.toolVersions.ffdec);
    }
  }
  const check = await materializeG4L3WorkspaceSourceAudits({
    root: projectRoot,
    sourceRoot: projectRoot,
    migrationsRoot,
    check: true,
  });
  assert.equal(check.changed, 0);
});

test("rejects promoted upstream machine evidence before workspace mutation", async (t) => {
  const {root, migrationsRoot, members} = await createWorkspaceFixture(t);
  const reportPath = path.join(root, "promoted-machine-report.json");
  const report = JSON.parse(await readFile(path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json")));
  report.acceptance.reviewOrApprovalChanges = 1;
  await writeFile(reportPath, stableJson(report));
  const firstManifestPath = path.join(migrationsRoot, members[0].animationId, "migration.json");
  const before = await readFile(firstManifestPath);
  await assert.rejects(
    materializeG4L3WorkspaceSourceAudits({
      root: projectRoot,
      sourceRoot: projectRoot,
      migrationsRoot,
      machineAuditPath: reportPath,
    }),
    /acceptance\.reviewOrApprovalChanges must remain zero/,
  );
  assert.deepEqual(await readFile(firstManifestPath), before);
});
