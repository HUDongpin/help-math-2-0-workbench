import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import test from "node:test";

import {
  ALL_FALSE_ACCEPTANCE_EFFECTS,
  deriveLaneHint,
  parseArguments,
  parseFfdecDump,
  parseFfdecHeader,
  parseSwfmillStructure,
  runAudit,
  runCheck,
  sha256Bytes,
} from "./audit-shared-calibration-structure.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeExecutable(filePath, source) {
  await writeFile(filePath, `#!/usr/bin/env node\n${source}\n`, {mode: 0o755});
  await chmod(filePath, 0o755);
}

async function fixture({fail = false, delayMs = 0} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-g678-structure-audit-"));
  const canonical = path.join(root, "G6-G8-shared");
  const lessonRoot = path.join(canonical, "NMS002", "L1");
  const outputRoot = path.join(root, "work", "g678-shared-page-factory", "run-v1");
  await mkdir(path.join(lessonRoot, "IR"), {recursive: true});
  const first = Buffer.from("CWS fixture first");
  const second = Buffer.from("CWS fixture second");
  await writeFile(path.join(lessonRoot, "IR", "L1IR01.swf"), first, {mode: 0o444});
  await writeFile(path.join(lessonRoot, "IR", "L1IR02.swf"), second, {mode: 0o444});
  await chmod(path.join(lessonRoot, "IR", "L1IR01.swf"), 0o444);
  await chmod(path.join(lessonRoot, "IR", "L1IR02.swf"), 0o444);
  const profile = {
    schemaVersion: 1,
    artifactType: "fixture-profile",
    profileId: "fixture-profile",
    version: "v1",
    sourceView: {relativeRoot: "G6-G8-shared"},
    calibrationSet: [
      {moduleCode: "NMS002", lessonNumber: 1, ordinal: 1, selectionRole: "low-candidate"},
      {moduleCode: "NMS002", lessonNumber: 1, ordinal: 2, selectionRole: "interactive-candidate"},
    ],
  };
  const pages = [first, second].map((bytes, index) => ({
    placementId: `shared-nms002-l01-p00${index + 1}`,
    moduleCode: "NMS002",
    lessonNumber: 1,
    xmlOccurrence: index + 1,
    sourcePath: `HELP_COURSES/NMS002/L1/IR/L1IR0${index + 1}.swf`,
    sourceBytes: bytes.length,
    sourceSha256: digest(bytes),
    assetId: `swf-${digest(bytes)}`,
    sourceStatus: "resolved-canonical",
    sourceRootKind: "canonical",
    flags: {referenced: true, unreferenced: false, variant: false, shell: false},
  }));
  const catalog = {
    schemaVersion: 1,
    catalogKind: "help-math-g678-shared-source-catalog",
    profileId: profile.profileId,
    generatedFrom: {},
    lessons: [{moduleCode: "NMS002", lessonNumber: 1, pages}],
  };
  const profilePath = path.join(root, "profile.json");
  const catalogPath = path.join(root, "catalog.json");
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, {mode: 0o444});
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, {mode: 0o444});
  await chmod(profilePath, 0o444);
  await chmod(catalogPath, 0o444);
  const bin = path.join(root, "bin");
  await mkdir(bin, {recursive: true});
  const ffdecPath = path.join(bin, "ffdec-fixture");
  const swfmillPath = path.join(bin, "swfmill-fixture");
  await writeExecutable(ffdecPath, `
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const delay = ${Number(delayMs)};
const fail = ${Boolean(fail)};
if (delay) setTimeout(() => {}, delay);
if (fail && args[0] === "-dumpAS2") { console.error("fixture failure"); process.exit(9); }
if (args[0] === "-header") console.log("version=6\\nframeCount=4\\nframeRate=12\\nwidthPx=320\\nheightPx=240");
else if (args[0] === "-dumpSWF") console.log("tagId=9 SetBackgroundColor\\ntagId=12 DoAction\\ntagId=39 DefineSprite");
else if (args[0] === "-dumpAS2") console.log("/frame_1/DoAction");
else if (args[0] === "-dumpAS3") {}
else if (args[0] === "-export") {
  const out = args[2];
  fs.mkdirSync(path.join(out, "scripts", "frame_1"), {recursive: true});
  fs.writeFileSync(path.join(out, "scripts", "frame_1", "DoAction.as"), "stop();\\n");
}
`);
  await writeExecutable(swfmillPath, `
const fs = require("node:fs");
const args = process.argv.slice(2);
const output = args.at(-1);
fs.writeFileSync(output, '<?xml version="1.0"?><swf version="6"><Header framerate="12" frames="4"><size><Rectangle left="0" right="6400" top="0" bottom="4800"/></size><tags><DoAction/><DefineSprite objectID="7" frames="8"/><DefineButton2 objectID="9"/><SoundStreamHead/><SoundStreamBlock/><ShowFrame/></tags></Header></swf>');
`);
  // Source files are intentionally read-only, matching the production
  // external quarantine contract.  Keep parent directories writable in the
  // fixture so the test cleanup can remove the temporary tree.
  return {root, canonical, outputRoot, profilePath, catalogPath, ffdecPath, swfmillPath, first, second};
}

test("parsers expose structural facts without crossing the acceptance boundary", () => {
  const header = parseFfdecHeader("version=6\nframeCount=4\nframeRate=12\nwidthPx=320\nheightPx=240");
  assert.equal(header.frameCount, 4);
  assert.equal(header.frameRate, 12);
  const dump = parseFfdecDump("tagId=12 DoAction\ntagId=39 DefineSprite\ntagId=7 DefineButton2");
  assert.equal(dump.actionScriptTagCount, 1);
  assert.equal(dump.nestedSpriteCount, 1);
  const swfmill = parseSwfmillStructure('<?xml version="1.0"?><swf version="6"><Header framerate="12" frames="4"><size><Rectangle left="0" right="6400" top="0" bottom="4800"/></size><tags><DefineSprite objectID="7" frames="8"/></tags></Header></swf>');
  assert.deepEqual(swfmill.stage, {width: 320, height: 240, twipsPerPixel: 20});
  assert.deepEqual(swfmill.nestedSprites, [{objectId: 7, frameCount: 8}]);
  const hint = deriveLaneHint({header, dump, swfmill, exported: {scriptFileCount: 0, text: ""}});
  assert.equal(hint.lane, "interactive-understood");
  assert.equal(hint.generationEligible, false);
  assert.equal(hint.disposition, "preliminary-machine-hint-needs-review");
  assert.ok(Object.values(ALL_FALSE_ACCEPTANCE_EFFECTS).every((value) => value === false));
});

test("argument parser enforces bounded timeout and concurrency", () => {
  const parsed = parseArguments(["--profile", "p", "--catalog", "c", "--source-root", "s", "--output", "o", "--timeout-ms", "50", "--concurrency", "3"]);
  assert.equal(parsed.timeoutMs, 50);
  assert.equal(parsed.concurrency, 3);
  assert.throws(() => parseArguments(["--concurrency", "5"]), /between 1 and 4/);
  assert.throws(() => parseArguments(["--timeout-ms", "0"]), /between 1 and/);
});

test("runs every selected placement through six structural commands and writes report.json exclusively", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root, {recursive: true, force: true}));
  const result = await runAudit({
    projectRoot: value.root,
    profile: value.profilePath,
    catalog: value.catalogPath,
    sourceRoot: value.root,
    output: value.outputRoot,
    ffdec: value.ffdecPath,
    swfmill: value.swfmillPath,
    timeoutMs: 10_000,
    concurrency: 1,
  });
  assert.equal(result.status, "structural-audit-only");
  const reportPath = path.join(value.outputRoot, "report.json");
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  assert.equal(report.placements.length, 2);
  assert.equal(report.summary.toolCommandCount, 12);
  assert.equal(report.scope.legacyFlashCourseShellsIncluded, false);
  assert.equal(report.placements[0].commands.ffdecHeader.status, "succeeded");
  assert.equal(report.placements[0].commands.ffdecDumpSWF.status, "succeeded");
  assert.equal(report.placements[0].commands.ffdecDumpAS2.status, "succeeded");
  assert.equal(report.placements[0].commands.ffdecDumpAS3.status, "succeeded");
  assert.equal(report.placements[0].commands.ffdecExportScript.status, "succeeded");
  assert.equal(report.placements[0].commands.swfmillXml.status, "succeeded");
  assert.equal(report.placements[0].structural.actionScript.execution, "not-executed");
  assert.equal(report.placements[0].laneHint.generationEligible, false);
  assert.deepEqual(report.acceptanceEffects, ALL_FALSE_ACCEPTANCE_EFFECTS);
  assert.deepEqual(await readFile(path.join(value.canonical, "NMS002/L1/IR/L1IR01.swf")), value.first);
  assert.deepEqual(await readFile(path.join(value.canonical, "NMS002/L1/IR/L1IR02.swf")), value.second);
  await assert.rejects(() => runAudit({
    projectRoot: value.root,
    profile: value.profilePath,
    catalog: value.catalogPath,
    sourceRoot: value.root,
    output: value.outputRoot,
    ffdec: value.ffdecPath,
    swfmill: value.swfmillPath,
  }), (error) => error.code === "OUTPUT_EXISTS");
  const checked = await runCheck({
    projectRoot: value.root,
    profile: value.profilePath,
    catalog: value.catalogPath,
    sourceRoot: value.root,
    output: value.outputRoot,
  });
  assert.equal(checked.status, "PASS");
});

test("tool failure is fail-closed and does not publish a successful report", async (t) => {
  const value = await fixture({fail: true});
  t.after(() => rm(value.root, {recursive: true, force: true}));
  await assert.rejects(() => runAudit({
    projectRoot: value.root,
    profile: value.profilePath,
    catalog: value.catalogPath,
    sourceRoot: value.root,
    output: value.outputRoot,
    ffdec: value.ffdecPath,
    swfmill: value.swfmillPath,
    timeoutMs: 10_000,
    concurrency: 1,
  }), (error) => error.code === "TOOL_FAILED");
  await assert.rejects(() => stat(value.outputRoot), /ENOENT/);
});

test("catalog/source hash drift is rejected before tools run", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root, {recursive: true, force: true}));
  const driftPath = path.join(value.canonical, "NMS002/L1/IR/L1IR01.swf");
  await chmod(driftPath, 0o644);
  await writeFile(driftPath, Buffer.from("drift"));
  await chmod(driftPath, 0o444);
  await assert.rejects(() => runAudit({
    projectRoot: value.root,
    profile: value.profilePath,
    catalog: value.catalogPath,
    sourceRoot: value.root,
    output: value.outputRoot,
    ffdec: value.ffdecPath,
    swfmill: value.swfmillPath,
  }), (error) => error.code === "SOURCE_HASH_DRIFT");
  await assert.rejects(() => stat(value.outputRoot), /ENOENT/);
});

test("sha256 helper matches report input identity", () => {
  assert.equal(sha256Bytes(Buffer.from("fixture")), digest(Buffer.from("fixture")));
});
