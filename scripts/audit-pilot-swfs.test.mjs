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

import { auditMigration, parseArguments } from "./audit-pilot-swfs.mjs";

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
  fs.writeFileSync(output, '<?xml version="1.0"?><swf version="6" compressed="0"><Header framerate="12" frames="2"><size><Rectangle left="0" right="6400" top="0" bottom="4800"/></size><tags><SetBackgroundColor><color><Color red="255" green="255" blue="255"/></color></SetBackgroundColor><DefineFont2 objectID="1"/><DefineSound objectID="2"/><DoAction><actions><GetURL/></actions></DoAction><ShowFrame/></tags></Header></swf>');
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
    const options = { ffdec, swfmill, python: "python3", timeoutMs: 30_000, tools, adobeAnimateAvailable: false };

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
    assert.match(gunzipSync(await readFile(path.join(machine, "swfmill.xml.gz"))).toString(), /DefineSound/);
    assert.match(gunzipSync(await readFile(path.join(machine, "ffdec-scripts.txt.gz"))).toString(), /example\.invalid/);
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
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
