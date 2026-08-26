import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeReportOutput,
  parseArguments,
  parseSwfSourceFacts,
  renderG4L3MachineSourceAuditsMarkdown,
  summarizeScriptSources,
  validateG4L3MachineSourceAudits,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

function shortTag(code, body = Buffer.alloc(0)) {
  assert.ok(body.length < 0x3f);
  const header = Buffer.alloc(2);
  header.writeUInt16LE((code << 6) | body.length);
  return Buffer.concat([header, body]);
}

function placeObject2(characterId) {
  const body = Buffer.alloc(5);
  body[0] = 0x02;
  body.writeUInt16LE(1, 1);
  body.writeUInt16LE(characterId, 3);
  return shortTag(26, body);
}

function spriteTag(id, frameCount, children) {
  const prefix = Buffer.alloc(4);
  prefix.writeUInt16LE(id, 0);
  prefix.writeUInt16LE(frameCount, 2);
  return shortTag(39, Buffer.concat([prefix, ...children, shortTag(0)]));
}

function defineSoundTag(id) {
  const body = Buffer.alloc(7);
  body.writeUInt16LE(id, 0);
  body[2] = 0x2f; // MP3, 44.1 kHz, 16-bit stereo.
  body.writeUInt32LE(1234, 3);
  return shortTag(14, body);
}

function importAssets2Tag(url) {
  const urlBytes = Buffer.from(`${url}\0`);
  const tail = Buffer.alloc(6);
  tail[0] = 1;
  tail[1] = 0;
  tail.writeUInt16LE(1, 2);
  tail.writeUInt16LE(9, 4);
  return shortTag(71, Buffer.concat([urlBytes, tail, Buffer.from("RemoteSymbol\0")]));
}

function fixtureSwf() {
  const fileAttributes = Buffer.alloc(4);
  const rootTags = [
    shortTag(69, fileAttributes),
    spriteTag(1, 2, [placeObject2(2), shortTag(1), shortTag(1)]),
    spriteTag(2, 3, [shortTag(1), shortTag(1), shortTag(1)]),
    spriteTag(3, 4, [shortTag(1), shortTag(1), shortTag(1), shortTag(1)]),
    defineSoundTag(8),
    importAssets2Tag("lesson-assets.swf"),
    shortTag(12),
    placeObject2(1),
    shortTag(1),
    shortTag(0),
  ];
  const body = Buffer.concat([
    Buffer.from([0x08, 0x00]),
    Buffer.from([0x00, 0x0c]),
    Buffer.from([0x01, 0x00]),
    ...rootTags,
  ]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 6;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

test("SWF parser retains static frame-domain graph without promoting it to runtime reachability", () => {
  const facts = parseSwfSourceFacts(fixtureSwf());
  assert.equal(facts.header.fps, 12);
  assert.equal(facts.header.rootFrameCount, 1);
  assert.equal(facts.actionScript.version, "AS1/2");
  assert.equal(facts.frameDomains.definitionCount, 3);
  assert.equal(facts.frameDomains.staticallyRootReachableDefinitionCount, 2);
  assert.equal(facts.frameDomains.staticallyUnreachableDefinitionCount, 1);
  assert.equal(facts.frameDomains.allDeclaredFrameCountSum, 10);
  assert.equal(facts.frameDomains.staticallyRootReachableDeclaredFrameCountSum, 6);
  assert.match(facts.frameDomains.caveat, /not runtime reachability/);

  const root = facts.frameDomains.domains.find((domain) => domain.domainId === "root");
  const first = facts.frameDomains.domains.find((domain) => domain.domainId === "sprite-1");
  const second = facts.frameDomains.domains.find((domain) => domain.domainId === "sprite-2");
  const third = facts.frameDomains.domains.find((domain) => domain.domainId === "sprite-3");
  assert.deepEqual(root.placedSpriteIds, [1]);
  assert.deepEqual(first.placedSpriteIds, [2]);
  assert.deepEqual(second.parentDomainIds, ["sprite-1"]);
  assert.equal(third.staticallyRootReachable, false);
  assert.ok(facts.frameDomains.domains.every((domain) => /^[a-f0-9]{64}$/.test(domain.domainFingerprintSha256)));
});

test("SWF parser records embedded sound and import candidates without invoking them", () => {
  const facts = parseSwfSourceFacts(fixtureSwf());
  assert.deepEqual(facts.audio.defineSounds, [{
    soundId: 8,
    ownerDomainId: "root",
    formatCode: 2,
    format: "mp3",
    rateHz: 44100,
    sampleSizeBits: 16,
    channels: 2,
    sampleCount: 1234,
  }]);
  assert.equal(facts.audio.tagCounts.DefineSound, 1);
  assert.equal(facts.linkageAndImports.importedAssets[0].url, "lesson-assets.swf");
  assert.deepEqual(facts.linkageAndImports.importedAssets[0].assets, [{characterId: 9, name: "RemoteSymbol"}]);
});

test("FFDec script summary is order/newline stable and binds signal evidence to file hashes", () => {
  const left = summarizeScriptSources([
    {path: "b.as", text: "on(release){ if(random(2)){ getURL('local'); score++; } }\r\n"},
    {path: "frame_1/a.as", text: "stop();\r\n"},
  ], {version: "AS1/2"});
  const right = summarizeScriptSources([
    {path: "frame_1/a.as", text: "stop();\n"},
    {path: "b.as", text: "on(release){ if(random(2)){ getURL('local'); score++; } }\n"},
  ], {version: "AS1/2"});
  assert.equal(left.normalizedBundleSha256, right.normalizedBundleSha256);
  assert.equal(left.contentManifestSha256, right.contentManifestSha256);
  assert.equal(left.random.occurrences, 1);
  assert.equal(left.externalApiCandidates.find((entry) => entry.id === "getURL")?.occurrences, 1);
  assert.equal(left.signals.find((entry) => entry.id === "mouse-events")?.occurrences, 1);
  assert.equal(left.externalCallsExecutedDuringAudit, false);
  assert.ok(left.externalApiCandidates.every((entry) => entry.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256))));
});

test("checked-in G4 L3 audit is complete, deterministic, and acceptance-neutral", async () => {
  const [json, markdown] = await Promise.all([
    readFile(new URL("../reports/g4-l3-machine-source-audits.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-machine-source-audits.md", import.meta.url), "utf8"),
  ]);
  const report = validateG4L3MachineSourceAudits(JSON.parse(json));
  assert.equal(report.items.length, 40);
  assert.deepEqual(report.lesson.batches.map((batch) => batch.canonicalAssetCount), [25, 15]);
  assert.equal(report.summary.rootFrameCountSum, 440);
  assert.equal(report.summary.spriteDefinitionCount, 1205);
  assert.equal(report.summary.staticallyRootReachableSpriteDefinitionCount, 859);
  assert.equal(report.summary.allDeclaredTimelineFrameCountSum, 20203);
  assert.equal(report.audioInventory.uniqueFileCount, 143);
  assert.equal(report.acceptance.strictGateChanges, 0);
  assert.ok(report.items.every((item) => item.evidenceLimits.runtimeReachabilityEstablished === false));
  assert.ok(report.items.every((item) => item.evidenceLimits.humanOrOwnerAcceptanceEstablished === false));
  assert.equal(markdown, renderG4L3MachineSourceAuditsMarkdown(report));
});

test("validator fails closed on promoted reachability, acceptance, or stale item fingerprints", async () => {
  const original = JSON.parse(await readFile(
    new URL("../reports/g4-l3-machine-source-audits.json", import.meta.url),
    "utf8",
  ));
  const cases = [
    [(report) => { report.acceptance.strictGateChanges = 1; }, /strictGateChanges/],
    [(report) => { report.items[0].evidenceLimits.runtimeReachabilityEstablished = true; }, /evidence boundary/],
    [(report) => { report.items[0].swf.header.rootFrameCount += 1; }, /stale audit fingerprint/],
    [(report) => { report.audioInventory.files[0].physicalHashVerified = false; }, /audio inventory/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(original);
    mutate(report);
    assert.throws(() => validateG4L3MachineSourceAudits(report), pattern);
  }
});

test("CLI and output guards expose bounded, byte-for-byte check mode", async () => {
  const parsed = parseArguments(["--check", "--concurrency", "8", "--ffdec", "/tool/ffdec"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.concurrency, 8);
  assert.equal(parsed.ffdec, "/tool/ffdec");
  assert.throws(() => parseArguments(["--concurrency", "9"]), /1 through 8/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);

  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-source-audit-output-"));
  try {
    await mkdir(path.join(root, "reports"), {recursive: true});
    const output = path.join(root, "reports", "audit.json");
    await writeFile(output, "original\n");
    await writeOrCheckReport(output, "original\n", {root, extension: ".json", check: true});
    await assert.rejects(
      writeOrCheckReport(output, "replacement\n", {root, extension: ".json", check: true}),
      /missing or stale/,
    );
    assert.equal(await readFile(output, "utf8"), "original\n");
    await assert.rejects(
      assertSafeReportOutput(path.join(root, "source-assets", "audit.json"), {root, extension: ".json"}),
      /inside/,
    );
    await mkdir(path.join(root, "outside"));
    await symlink(path.join(root, "outside"), path.join(root, "reports", "escape"));
    await assert.rejects(
      assertSafeReportOutput(path.join(root, "reports", "escape", "audit.json"), {root, extension: ".json"}),
      /symbolic-link/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
