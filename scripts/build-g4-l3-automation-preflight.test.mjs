import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeReportOutput,
  parseArguments,
  parseSwfTagSummary,
  renderG4L3PreflightMarkdown,
  summarizeActionScriptSources,
  validateG4L3PreflightReport,
  writeOrCheck,
} from "./build-g4-l3-automation-preflight.mjs";

function shortTag(code, body = Buffer.alloc(0)) {
  assert.ok(body.length < 0x3f);
  const header = Buffer.alloc(2);
  header.writeUInt16LE((code << 6) | body.length);
  return Buffer.concat([header, body]);
}

function fixtureSwf() {
  const fileAttributes = Buffer.alloc(4);
  const body = Buffer.concat([
    Buffer.from([0x08, 0x00]), // RECT with nbits=1 and zero bounds.
    Buffer.from([0x00, 0x0c]), // 12 fps, FIXED8 little-endian.
    Buffer.from([0x01, 0x00]), // One root frame.
    shortTag(69, fileAttributes),
    shortTag(12),
    shortTag(34),
    shortTag(0),
  ]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 6;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

test("SWF tag scan and ActionScript triage detect bounded preflight signals", () => {
  const tags = parseSwfTagSummary(fixtureSwf());
  assert.equal(tags.scriptTags.DoAction, 1);
  assert.equal(tags.buttonDefinitionCount, 1);
  assert.equal(tags.actionScript3Flag, false);

  const complexity = summarizeActionScriptSources([
    {
      path: "DefineButton2_1/BUTTONCONDACTION on(release).as",
      text: "on(release){ if (random(4) > 1) { getURL('local'); score++; } }",
    },
    {
      path: "frame_1/DoAction.as",
      text: "stop();",
    },
  ], tags, {rootFrameCount: 10});
  assert.equal(complexity.actionScript.version, "AS1/2");
  assert.equal(complexity.actionScript.exportedScriptFileCount, 2);
  assert.equal(complexity.interaction.detected, true);
  assert.equal(complexity.random.callCandidates, 1);
  assert.deepEqual(complexity.externalCalls.candidates, [{name: "getURL", occurrences: 1}]);
  assert.equal(complexity.level, "high");
});

test("checked-in G4 L3 preflight is deterministic, parallel-scaffold-ready, and acceptance-neutral", async () => {
  const [json, markdown] = await Promise.all([
    readFile(new URL("../reports/g4-l3-automation-preflight.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-automation-preflight.md", import.meta.url), "utf8"),
  ]);
  const report = validateG4L3PreflightReport(JSON.parse(json));
  assert.equal(report.items.length, 40);
  assert.equal(new Set(report.items.map((item) => item.animationId)).size, 40);
  assert.deepEqual(report.batches.map((batch) => batch.canonicalAssetCount), [25, 15]);
  assert.equal(report.summary.flaBacked, 29);
  assert.equal(report.summary.swfOnly, 11);
  assert.equal(report.audio.uniqueLessonFiles, 143);
  assert.deepEqual(report.audio.languages, {en: 60, es: 83, und: 0});
  assert.equal(report.summary.existingMigrationWorkspaces, 40);
  assert.equal(report.summary.existingDeclaredRenderers, 40);
  assert.equal(report.lesson.developmentMode, "parallel-shards");
  assert.equal(report.lesson.publicationMode, "atomic");
  assert.equal(report.summary.batchGatesOpen, 2);
  assert.ok(report.batches.every((batch) => batch.gate.open === true));
  assert.ok(report.batches.every((batch) => batch.gate.prerequisiteKind === "none"));
  assert.equal(report.acceptance.implementationAuthorized, false);
  assert.equal(report.acceptance.publicationAuthorized, false);
  assert.ok(report.items.every((item) => item.existing.workspaceExists));
  assert.ok(report.items.every((item) => item.existing.migrationStatus === "preserved"));
  assert.equal(report.items.find((item) => item.animationId === "course-g04-l03-in-009")?.existing.renderer.declared, true);
  assert.ok(report.items.every((item) => item.source.swf.physicalHashVerified));
  assert.ok(report.items.filter((item) => item.source.fla).every((item) => item.source.fla.physicalHashVerified));
  assert.ok(report.items.every((item) => item.blockerCodes.includes("visual-behavior-human-owner-gates-pending")));
  assert.equal(markdown, renderG4L3PreflightMarkdown(report));
});

test("preflight validator rejects a closed parallel-shard scaffold gate or reduced scope", async () => {
  const report = JSON.parse(await readFile(
    new URL("../reports/g4-l3-automation-preflight.json", import.meta.url),
    "utf8",
  ));
  report.batches[0].gate.open = false;
  assert.throws(() => validateG4L3PreflightReport(report), /parallel-shard scaffold gate/);
  report.batches[0].gate.open = true;
  report.items.pop();
  assert.throws(() => validateG4L3PreflightReport(report), /40 canonical items/);
});

test("preflight validator binds generator, tool, catalog inputs, and unique physical sources", async () => {
  const original = JSON.parse(await readFile(
    new URL("../reports/g4-l3-automation-preflight.json", import.meta.url),
    "utf8",
  ));
  const cases = [
    ["generator", (report) => { report.generator.version += 1; }, /generator binding/],
    ["tool", (report) => { report.sourceBindings.tools.ffdec = "unbound"; }, /FFDec tool binding/],
    ["catalog input", (report) => { report.sourceBindings.animations.sha256 = "0"; }, /source binding animations/],
    ["canonical ID", (report) => { report.items[1].animationId = report.items[0].animationId; }, /canonical IDs/],
    ["asset ID", (report) => { report.items[1].assetId = report.items[0].assetId; }, /asset IDs/],
    ["physical SWF", (report) => { report.items[0].source.swf.physicalHashVerified = false; }, /SWF source binding/],
  ];
  for (const [label, mutate, pattern] of cases) {
    const report = structuredClone(original);
    mutate(report);
    assert.throws(() => validateG4L3PreflightReport(report), pattern, label);
  }
});

test("CLI exposes a read-only check mode and bounded concurrency", () => {
  const options = parseArguments(["--check", "--concurrency", "8", "--ffdec", "/tool/ffdec"]);
  assert.equal(options.check, true);
  assert.equal(options.concurrency, 8);
  assert.equal(options.ffdec, "/tool/ffdec");
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--json-output", "source-assets/flash/preflight.json"]),
    /inside .*reports/,
  );
  assert.throws(
    () => parseArguments(["--markdown-output", "reports/preflight.json"]),
    /must end in \.md/,
  );
});

test("report output guard rejects source paths and symlink escapes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-preflight-output-"));
  try {
    const reports = path.join(root, "reports");
    const sources = path.join(root, "source-assets");
    await Promise.all([
      mkdir(reports, {recursive: true}),
      mkdir(sources, {recursive: true}),
    ]);
    const safe = path.join(reports, "preflight.json");
    assert.equal(await assertSafeReportOutput(safe, {root}), safe);
    await assert.rejects(
      assertSafeReportOutput(path.join(sources, "preflight.json"), {root}),
      /inside .*reports/,
    );
    await symlink(sources, path.join(reports, "source-escape"));
    await assert.rejects(
      assertSafeReportOutput(path.join(reports, "source-escape", "preflight.json"), {root}),
      /symbolic-link path component/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("report check mode is byte-for-byte read-only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-preflight-check-"));
  try {
    const output = path.join(root, "reports", "preflight.json");
    await mkdir(path.dirname(output), {recursive: true});
    await writeFile(output, "original\n");
    await writeOrCheck(output, "original\n", true, {root});
    assert.equal(await readFile(output, "utf8"), "original\n");
    await assert.rejects(writeOrCheck(output, "replacement\n", true, {root}), /missing or stale/);
    assert.equal(await readFile(output, "utf8"), "original\n");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
