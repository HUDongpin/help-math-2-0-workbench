import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";

import {
  auditMigration,
  buildSwfFrameDomainCandidates,
  parseArguments,
  preflightReleaseAuditWorkspaces,
  selectLessonReleaseAuditMembers,
} from "./audit-pilot-swfs.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeExecutable(filePath, source) {
  await writeFile(filePath, `#!/usr/bin/env node\n${source}`);
  await chmod(filePath, 0o755);
}

async function walk(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walk(directory, next));
    else files.push(next.split(path.sep).join("/"));
  }
  return files;
}

async function treeHashes(directory) {
  const result = {};
  for (const relative of await walk(directory)) {
    result[relative] = digest(await readFile(path.join(directory, relative)));
  }
  return result;
}

function successfulFfdec() {
  return String.raw`
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
if (args[0] === "-help") {
  console.log("JPEXS Free Flash Decompiler v.26.2.1");
} else if (args[0] === "-header") {
  console.log("[header]\nfileSize=24\nversion=6\ncompression=NONE\nencrypted=false\ngfx=false\ndisplayRect=[0, 0, 6400, 4800]\nwidth=6400\nwidthPx=320\nheight=4800\nheightPx=240\nframeCount=2\nframeRate=12");
} else if (args[0] === "-dumpSWF") {
  console.log("00000008: 0. SetBackgroundColor tagId=9 len=3 ff ff ff\n0000000d: 1. DoAction tagId=12 len=4");
} else if (args[0] === "-dumpAS2") {
  console.log("/frame_1/DoAction");
} else if (args[0] === "-dumpAS3") {
  // A successful empty AS3 index is meaningful evidence.
} else {
  const exportIndex = args.indexOf("-export");
  if (exportIndex === -1 || args[exportIndex + 1] !== "script") process.exit(4);
  const output = args[exportIndex + 2];
  const script = path.join(output, "scripts", "frame_1", "DoAction.as");
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.writeFileSync(script, 'getURL("https://example.invalid/legacy");\nstop();\n');
}
`;
}

function successfulSwfmill() {
  return String.raw`
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "--version") {
  console.log("swfmill 0.3.6");
} else {
  const output = args.at(-1);
  fs.writeFileSync(output, '<?xml version="1.0"?><swf version="6" compressed="0"><Header framerate="12" frames="2"><size><Rectangle left="0" right="6400" top="0" bottom="4800"/></size><tags><SetBackgroundColor><color><Color red="255" green="255" blue="255"/></color></SetBackgroundColor><DefineFont2 objectID="1"/><DefineSound objectID="2"/><DefineSprite objectID="3" frames="7"><tags><ShowFrame/></tags></DefineSprite><DoAction><actions><GetURL/></actions></DoAction><ShowFrame/></tags></Header></swf>');
}
`;
}

function failedSwfmill() {
  return String.raw`
const args = process.argv.slice(2);
if (args[0] === "--version") {
  console.log("swfmill 0.3.6");
} else {
  console.error("fixture parser rejected malformed input");
  process.exit(7);
}
`;
}

test("machine-audits a preserved SWF deterministically without changing source or status", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-machine-audit-"));
  try {
    const sourceRoot = path.join(temporaryRoot, "source with spaces");
    const migration = path.join(temporaryRoot, "migrations", "pilot-fixture");
    const bin = path.join(temporaryRoot, "bin");
    await Promise.all([
      mkdir(sourceRoot, { recursive: true }),
      mkdir(path.join(migration, "audit"), { recursive: true }),
      mkdir(bin, { recursive: true }),
    ]);
    const swf = path.join(sourceRoot, "fixture.swf");
    const fla = path.join(sourceRoot, "fixture.fla");
    const swfBytes = Buffer.from("FWS fixture bytes that stay immutable");
    const flaBytes = Buffer.from("binary FLA fixture that stays immutable");
    await writeFile(swf, swfBytes);
    await writeFile(fla, flaBytes);
    await writeFile(path.join(migration, "migration.json"), `${JSON.stringify({
      schemaVersion: 2,
      animationId: "pilot-fixture",
      status: "preserved",
      source: {
        swf,
        swfSha256: digest(swfBytes),
        fla,
        flaSha256: digest(flaBytes),
        pairedFlaStatus: "present",
      },
      runtime: {
        swfVersion: 6,
        stage: { width: 320, height: 240 },
        fps: 12,
        frameCount: 2,
      },
    }, null, 2)}\n`);
    await mkdir(path.join(migration, "audit", "machine", "private-source-audit"), {recursive: true});
    await writeFile(
      path.join(migration, "audit", "machine", "g4-l3-source-audit.json"),
      '{"preserved":true}\n',
    );
    await writeFile(
      path.join(migration, "audit", "machine", "private-source-audit", "receipt.txt"),
      "preserve unrelated evidence\n",
    );

    const ffdec = path.join(bin, "ffdec-fixture");
    const swfmill = path.join(bin, "swfmill-fixture");
    await writeExecutable(ffdec, successfulFfdec());
    await writeExecutable(swfmill, successfulSwfmill());
    const tools = {
      ffdec: { command: ffdec, version: "JPEXS Free Flash Decompiler v.26.2.1", success: true, exitCode: 0, error: "" },
      swfmill: { command: swfmill, version: "swfmill 0.3.6", success: true, exitCode: 0, error: "" },
      java: { command: "java", version: "openjdk version 21", success: true, exitCode: 0, error: "" },
      xmlParser: { command: "python3", version: "Python fixture", success: true, exitCode: 0, error: "", library: "Python standard library xml.etree.ElementTree.iterparse" },
    };
    // The full repository suite runs many process-heavy evidence tests in parallel.
    // Keep the production auditor's timeout unchanged while allowing this synthetic
    // fixture enough scheduling headroom under that contention.
    const options = { ffdec, swfmill, python: "python3", timeoutMs: 120_000, tools, adobeAnimateAvailable: false };

    const first = await auditMigration(migration, options);
    const machine = path.join(migration, "audit", "machine");
    assert.equal(first.auditStatus, "partial");
    assert.equal(first.migrationStatus, "preserved");
    assert.equal(first.migrationStatusUnchanged, true);
    assert.equal(first.source.hashMatches, true);
    assert.equal(first.authoringSource.hashMatches, true);
    assert.equal(first.authoringSource.inspectionStatus, "blocked-tool-unavailable");
    assert.equal(first.findings.actionScriptVersion, "AS1/2");
    assert.equal(first.findings.backgroundColor, "#ffffff");
    assert.deepEqual(first.findings.externalCallCandidates, [{ api: "getURL", occurrences: 1 }]);
    assert.equal(first.findings.runtimeCrossCheck.allMatch, true, JSON.stringify(first.findings.runtimeCrossCheck));
    assert.equal(first.findings.exportedScriptFileCount, 1);
    assert.equal(first.findings.frameDomainCandidates.root.frameCount, 2);
    assert.deepEqual(first.findings.frameDomainCandidates.nestedDefinitions, [{
      timelineId: "sprite-3",
      sourceTimelineId: "sprite-3",
      sourceObjectId: 3,
      kind: "nested-definition-candidate",
      frameCount: 7,
      rootReachability: "unresolved",
      placementEntryState: "unresolved",
      acceptanceDisposition: "structural-candidate-only",
    }]);
    assert.equal(first.findings.frameDomainCandidates.summary.completeRootReachableDomainInventory, false);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(machine, "swf-frame-domain-candidates.json"), "utf8")),
      first.findings.frameDomainCandidates,
    );
    assert.match(gunzipSync(await readFile(path.join(machine, "swfmill.xml.gz"))).toString(), /DefineSound/);
    assert.match(gunzipSync(await readFile(path.join(machine, "ffdec-scripts.txt.gz"))).toString(), /example\.invalid/);
    assert.equal(await readFile(path.join(machine, "g4-l3-source-audit.json"), "utf8"), '{"preserved":true}\n');
    assert.equal(
      await readFile(path.join(machine, "private-source-audit", "receipt.txt"), "utf8"),
      "preserve unrelated evidence\n",
    );
    for (const output of first.outputs) {
      const absolute = path.join(migration, output.path);
      assert.equal((await stat(absolute)).size, output.bytes);
      assert.equal(digest(await readFile(absolute)), output.sha256);
    }

    const before = await treeHashes(machine);
    const second = await auditMigration(migration, options);
    assert.deepEqual(await treeHashes(machine), before);
    assert.deepEqual(second, first);
    assert.deepEqual(await readFile(swf), swfBytes);
    assert.deepEqual(await readFile(fla), flaBytes);
    assert.equal(JSON.parse(await readFile(path.join(migration, "migration.json"), "utf8")).status, "preserved");

    await writeExecutable(swfmill, failedSwfmill());
    const failed = await auditMigration(migration, options);
    assert.equal(failed.commands.swfmillXml.status, "failed");
    assert.ok(failed.limitations.some((reason) => reason.includes("swfmillXml")));
    await assert.rejects(stat(path.join(machine, "swfmill.xml.gz")), /ENOENT/);
    assert.match(await readFile(path.join(machine, "failures", "swfmill.txt"), "utf8"), /fixture parser rejected malformed input/);
    assert.equal(await readFile(path.join(machine, "g4-l3-source-audit.json"), "utf8"), '{"preserved":true}\n');
    assert.equal(
      await readFile(path.join(machine, "private-source-audit", "receipt.txt"), "utf8"),
      "preserve unrelated evidence\n",
    );
    assert.deepEqual(await readFile(swf), swfBytes);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("parses selection and timeout arguments strictly", () => {
  assert.deepEqual(
    parseArguments(["--id", "formula-elementary-conversion-01-01", "--id", "keyterm-elementary-acute-angle", "--timeout-ms", "10000"]).ids,
    ["formula-elementary-conversion-01-01", "keyterm-elementary-acute-angle"],
  );
  assert.throws(() => parseArguments(["--timeout-ms", "999"]), /at least 1000/);
  const releaseSelection = parseArguments(["--release-id", "lesson-fixture", "--shard-id", "shard-b"]);
  assert.equal(releaseSelection.releaseId, "lesson-fixture");
  assert.equal(releaseSelection.shardId, "shard-b");
  assert.deepEqual(releaseSelection.ids, []);
  assert.throws(() => parseArguments(["--release-id", "lesson-fixture", "--id", "pilot"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--shard-id", "shard-a"]), /requires --release-id/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

function releaseFixture() {
  const make = (ordinal, shardId) => {
    const sha256 = String(ordinal).repeat(64);
    return {
      ordinal,
      animationId: `fixture-${ordinal}`,
      assetId: `swf-${sha256}`,
      shardId,
      source: {path: `HELP_COURSES/FIXTURE/${ordinal}.swf`, sha256},
    };
  };
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-fixture",
      expectedCounts: {members: 3, shards: 2},
      shards: [
        {shardId: "shard-a", memberCount: 2},
        {shardId: "shard-b", memberCount: 1},
      ],
      members: [make(1, "shard-a"), make(2, "shard-a"), make(3, "shard-b")],
    }],
  };
}

test("selects exact release or shard membership and rejects catalog identity drift", () => {
  const document = releaseFixture();
  assert.deepEqual(
    selectLessonReleaseAuditMembers(document, {releaseId: "lesson-fixture"}).map(({animationId}) => animationId),
    ["fixture-1", "fixture-2", "fixture-3"],
  );
  assert.deepEqual(
    selectLessonReleaseAuditMembers(document, {releaseId: "lesson-fixture", shardId: "shard-b"}).map(({animationId}) => animationId),
    ["fixture-3"],
  );
  assert.throws(() => selectLessonReleaseAuditMembers(document, {releaseId: "missing"}), /Unknown lesson release/);
  assert.throws(() => selectLessonReleaseAuditMembers(document, {releaseId: "lesson-fixture", shardId: "missing"}), /unknown shard/);

  const drifted = structuredClone(document);
  drifted.releases[0].members[1].source.sha256 = "f".repeat(64);
  assert.throws(() => selectLessonReleaseAuditMembers(drifted, {releaseId: "lesson-fixture"}), /assetId does not match/);
  const wrongCount = structuredClone(document);
  wrongCount.releases[0].shards[0].memberCount = 1;
  assert.throws(() => selectLessonReleaseAuditMembers(wrongCount, {releaseId: "lesson-fixture"}), /declared memberCount/);
});

test("release workspace preflight validates every manifest and physical source before audit writes", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-release-audit-preflight-"));
  try {
    const document = releaseFixture();
    const member = selectLessonReleaseAuditMembers(document, {releaseId: "lesson-fixture", shardId: "shard-b"})[0];
    const migrationsRoot = path.join(temporaryRoot, "migrations");
    const workspace = path.join(migrationsRoot, member.animationId);
    const sourceRelative = `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`;
    const source = path.join(temporaryRoot, sourceRelative);
    await mkdir(path.dirname(source), {recursive: true});
    await mkdir(workspace, {recursive: true});
    const sourceBytes = Buffer.from("3".repeat(64));
    member.source.sha256 = digest(sourceBytes);
    member.assetId = `swf-${member.source.sha256}`;
    await writeFile(source, sourceBytes);
    await writeFile(path.join(workspace, "migration.json"), JSON.stringify({
      id: member.animationId,
      animationId: member.animationId,
      assetId: member.assetId,
      source: {
        placementPath: sourceRelative,
        swf: sourceRelative,
        swfSha256: member.source.sha256,
      },
    }));
    assert.equal((await preflightReleaseAuditWorkspaces(migrationsRoot, [member], {sourceRoot: temporaryRoot})).length, 1);
    const manifestPath = path.join(workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assetId = `swf-${"a".repeat(64)}`;
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(
      preflightReleaseAuditWorkspaces(migrationsRoot, [member], {sourceRoot: temporaryRoot}),
      /assetId does not match/,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("frame-domain candidates never promote structural sprites into reachable domains", () => {
  const manifest = {animationId: "fixture", source: {swf: "fixture.swf", swfSha256: "a".repeat(64)}, runtime: {frameCount: 10}};
  const inventory = buildSwfFrameDomainCandidates(manifest, {spriteDefinitions: [{objectID: 9, frames: 40}]});
  assert.equal(inventory.root.frameCount, 10);
  assert.equal(inventory.nestedDefinitions[0].rootReachability, "unresolved");
  assert.equal(inventory.summary.completeRootReachableDomainInventory, false);
  assert.equal(inventory.acceptanceEffects.strictComplete, false);
});
