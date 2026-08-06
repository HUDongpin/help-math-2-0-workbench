import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {syncMachineAudits} from "./sync-machine-audits.mjs";

async function createFixture({crossCheck = true} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-audit-sync-"));
  const workspace = path.join(root, "fixture");
  await mkdir(path.join(workspace, "audit", "machine"), {recursive: true});
  const sourceHash = "a".repeat(64);
  const manifest = {
    animationId: "fixture",
    status: "preserved",
    source: {swfSha256: sourceHash},
    runtime: {backgroundColor: "", actionScriptVersion: "unknown", scripts: []},
    toolVersions: {ffdec: "unavailable", swfmill: "unavailable"},
    audit: {morphs: [], filters: [], networkCalls: []},
  };
  const report = {
    animationId: "fixture",
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
  return {root, workspace};
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
