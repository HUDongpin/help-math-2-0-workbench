import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {parseArguments, syncMachineAudits} from "./sync-machine-audits.mjs";

async function createWorkspace(root, {id = "fixture", crossCheck = true, sourceHash = "a".repeat(64)} = {}) {
  const workspace = path.join(root, id);
  await mkdir(path.join(workspace, "audit", "machine"), {recursive: true});
  const manifest = {
    id,
    animationId: id,
    assetId: `swf-${sourceHash}`,
    status: "preserved",
    source: {swfSha256: sourceHash},
    runtime: {backgroundColor: "", actionScriptVersion: "unknown", scripts: []},
    toolVersions: {ffdec: "unavailable", swfmill: "unavailable"},
    audit: {morphs: [], filters: [], networkCalls: []},
  };
  const report = {
    animationId: id,
    auditStatus: "partial",
    migrationStatusUnchanged: true,
    source: {expectedSha256: sourceHash, hashMatches: true},
    authoringSource: {inspectionStatus: "missing-source"},
    tools: {ffdec: {version: "FFDec fixture"}, swfmill: {version: "swfmill fixture"}},
    findings: {
      backgroundColor: "#ffffff",
      actionScriptVersion: "AS1/2",
      exportedScriptFileCount: 3,
      runtimeCrossCheck: {allMatch: crossCheck},
      externalCallCandidates: [{api: "getURL", occurrences: 1}],
      swfmill: {categories: {scriptTags: {DoAction: 2}, morphDefinitions: {DefineMorphShape: 1}, filterTags: {}}},
    },
    limitations: ["fixture limitation"],
  };
  await writeFile(path.join(workspace, "migration.json"), JSON.stringify(manifest));
  await writeFile(path.join(workspace, "audit", "machine", "report.json"), JSON.stringify(report));
  return workspace;
}

async function createFixture({crossCheck = true} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-audit-sync-"));
  const workspace = await createWorkspace(root, {crossCheck});
  return {root, workspace};
}

async function writeReleaseCatalog(root, {releaseId = "lesson-fixture", memberIds = ["fixture"]} = {}) {
  const catalogPath = path.join(root, "lesson-releases.json");
  const members = memberIds.map((animationId, index) => {
    const sourceHash = String.fromCharCode(97 + index).repeat(64);
    return {
      ordinal: index + 1,
      animationId,
      assetId: `swf-${sourceHash}`,
      releaseRole: "active-xml-referenced-page",
      shardId: "fixture-shard",
      source: {path: `HELP_COURSES/FIXTURE/${animationId}.swf`, sha256: sourceHash},
    };
  });
  await writeFile(catalogPath, JSON.stringify({
    schemaVersion: 1,
    releases: [{
      releaseId,
      expectedCounts: {members: members.length, shards: 1},
      shards: [{shardId: "fixture-shard", memberCount: members.length}],
      members,
    }],
  }));
  return catalogPath;
}

test("imports trustworthy machine evidence without advancing status", async () => {
  const {root, workspace} = await createFixture();
  await syncMachineAudits({migrationsRoot: root});
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  assert.equal(manifest.status, "preserved");
  assert.equal(manifest.runtime.backgroundColor, "#ffffff");
  assert.equal(manifest.runtime.actionScriptVersion, "AS1/2");
  assert.equal(manifest.audit.morphs[0].count, 1);
  assert.equal(manifest.audit.networkCalls[0].status, "candidate-not-executed");
  assert.equal(manifest.audit.machineEvidence.status, "partial");
});

test("refuses a failed runtime cross-check", async () => {
  const {root} = await createFixture({crossCheck: false});
  await assert.rejects(syncMachineAudits({migrationsRoot: root}), /cross-check failed/);
});

test("parses exact release and repeated explicit-ID scopes fail closed", () => {
  assert.deepEqual(
    parseArguments(["--release-id", "lesson-fixture", "--lesson-releases", "catalog/fixture.json", "--dry-run"]),
    {
      ids: [],
      releaseId: "lesson-fixture",
      lessonReleasePath: path.resolve("catalog/fixture.json"),
      dryRun: true,
    },
  );
  assert.throws(() => parseArguments(["--release-id", "lesson-fixture", "--id", "fixture"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--lesson-releases", "fixture.json"]), /requires --release-id/);
  assert.throws(() => parseArguments(["--id", "fixture", "--id", "fixture"]), /must not be repeated/);
  assert.throws(() => parseArguments(["--id", "../fixture"]), /malformed/);
});

test("release scope syncs exact members without touching unrelated migrations", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-audit-sync-release-"));
  const target = await createWorkspace(root, {id: "fixture", sourceHash: "a".repeat(64)});
  const unrelated = await createWorkspace(root, {id: "unrelated", sourceHash: "b".repeat(64)});
  const catalogPath = await writeReleaseCatalog(root);
  const unrelatedManifestPath = path.join(unrelated, "migration.json");
  const unrelatedBefore = await readFile(unrelatedManifestPath, "utf8");

  const results = await syncMachineAudits({
    migrationsRoot: root,
    releaseId: "lesson-fixture",
    lessonReleasePath: catalogPath,
  });

  assert.deepEqual(results, [{id: "fixture", action: "synced"}]);
  const targetManifest = JSON.parse(await readFile(path.join(target, "migration.json"), "utf8"));
  assert.equal(targetManifest.audit.machineEvidence.status, "partial");
  assert.equal(await readFile(unrelatedManifestPath, "utf8"), unrelatedBefore);
});

test("release scope refuses workspace identity drift from the catalog", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-audit-sync-release-drift-"));
  await createWorkspace(root, {id: "fixture", sourceHash: "b".repeat(64)});
  const catalogPath = await writeReleaseCatalog(root);
  await assert.rejects(
    syncMachineAudits({migrationsRoot: root, releaseId: "lesson-fixture", lessonReleasePath: catalogPath}),
    /workspace identity conflicts with the lesson release|workspace SWF hash conflicts with the lesson release/,
  );
});
