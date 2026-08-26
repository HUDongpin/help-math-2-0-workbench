import assert from "node:assert/strict";
import {lstat, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  materializeReadOnlyHostTree,
  parseArguments,
} from "./materialize-g4-l3-ts006-read-only-host-tree.mjs";

const root = "work/original-runtime-host-trees/course-g04-l03-ts-006/root";
const manifestPath = path.join(root, "staging-manifest.json");

test("current repository has the exact read-only TS006 host tree", async () => {
  const result = await materializeReadOnlyHostTree({check: true});
  assert.equal(result.files, 657);
  assert.equal(result.bytes, 35_469_789);
  assert.equal(result.changed, 0);
  assert.equal(result.runtimeSessionsExecuted, 0);
  assert.equal(result.acceptanceChanges, 0);
  assert.match(result.fileSetSha256, /^[a-f0-9]{64}$/);
});

test("manifest contains only SWF, MP3, and XML copies with no FLA or AS", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.deepEqual(manifest.summary.filesByExtension, {mp3: 146, swf: 508, xml: 3});
  assert.equal(manifest.summary.sourceFlasCopied, 0);
  assert.equal(manifest.summary.sourceActionScriptFilesCopied, 0);
  assert.equal(manifest.files.length, 657);
  assert.ok(manifest.files.every((file) => ["mp3", "swf", "xml"].includes(file.extension)));
  assert.ok(manifest.files.every((file) => file.stagedMode === "0444"));
  assert.ok(manifest.files.every((file) => !file.path.toLowerCase().endsWith(".fla")));
  assert.ok(manifest.files.every((file) => !file.path.toLowerCase().endsWith(".as")));
});

test("required lesson shell, selected page, Spanish audio, and keyterm XML are present", async () => {
  for (const relative of [
    "HELP_COURSES/ELMGR4/L3/index_local.swf",
    "HELP_COURSES/ELMGR4/L3/index.xml",
    "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
    "HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
  ]) {
    const metadata = await lstat(path.join(root, relative));
    assert.equal(metadata.isFile(), true);
    assert.equal(metadata.isSymbolicLink(), false);
    assert.equal(metadata.nlink, 1);
    assert.equal(metadata.mode & 0o777, 0o444);
  }
});

test("manifest remains acceptance-neutral and execution closed", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.ownership.sourceAssetsModified, false);
  assert.equal(manifest.ownership.sourceFilesHardLinked, false);
  assert.equal(manifest.ownership.runtimeExecuted, false);
  assert.equal(manifest.executionGate.cr02TechnicalArtifactPrepared, true);
  assert.equal(manifest.executionGate.cr02Approved, false);
  assert.equal(manifest.executionGate.originalRuntimeExecutionReady, false);
  assert.equal(manifest.executionGate.launchesRuntimeByThisMaterializer, false);
  assert.equal(manifest.acceptance.containmentApproved, false);
  assert.equal(manifest.acceptance.authoritativeOriginalRuntimeAccepted, false);
  assert.equal(manifest.acceptance.strictMigrationComplete, false);
});

test("CLI exposes only write/check/refresh and rejects runtime, approval, or source expansion", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--refresh"]).refresh, true);
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(() => parseArguments(["--include-fla"]), /Unknown option/);
});
