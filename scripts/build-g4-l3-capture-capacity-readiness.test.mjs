import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildCapacityModel,
  collectSwfTimelineFacts,
  parseArguments,
  quantile,
  renderCapacityMarkdown,
  validateCapacityReport,
} from "./build-g4-l3-capture-capacity-readiness.mjs";

function shortTag(code, body = Buffer.alloc(0)) {
  assert.ok(body.length < 0x3f);
  const header = Buffer.alloc(2);
  header.writeUInt16LE((code << 6) | body.length);
  return Buffer.concat([header, body]);
}

function spriteTag(id, frameCount, childTags = []) {
  const header = Buffer.alloc(4);
  header.writeUInt16LE(id, 0);
  header.writeUInt16LE(frameCount, 2);
  return shortTag(39, Buffer.concat([header, ...childTags, shortTag(0)]));
}

function fixtureSwf() {
  const body = Buffer.concat([
    Buffer.from([0x08, 0x00]), // zero RECT
    Buffer.from([0x00, 0x0c]), // 12 FPS
    Buffer.from([0x0a, 0x00]), // ten root frames
    spriteTag(1, 5, [spriteTag(2, 3)]),
    shortTag(0),
  ]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 6;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

test("SWF timeline parser retains root and recursive DefineSprite frame facts", () => {
  const facts = collectSwfTimelineFacts(fixtureSwf());
  assert.equal(facts.rootFrameCount, 10);
  assert.equal(facts.nestedDefinitionCount, 2);
  assert.equal(facts.nestedDeclaredFrameCountSum, 8);
  assert.equal(facts.nestedDeclaredFrameCountMax, 5);
  assert.deepEqual(facts.sprites, [
    {spriteId: 1, frameCount: 5, definitionDepth: 1},
    {spriteId: 2, frameCount: 3, definitionDepth: 2},
  ]);
});

test("quantiles interpolate without hiding fractional throughput", () => {
  assert.ok(Math.abs(quantile([0.7, 0.8, 0.9, 1.0], 0.5) - 0.85) < Number.EPSILON);
  assert.equal(quantile([1, 2, 3], 0), 1);
  assert.equal(quantile([1, 2, 3], 1), 3);
});

test("capacity model reserves baseline, implementation, diff, and operational headroom", () => {
  const itemFacts = [{
    rootFrameCount: 10,
    nestedDeclaredFrameCountMax: 90,
    nestedDeclaredFrameCountSum: 100,
    behaviorSensitive: true,
    shell: false,
  }];
  const captureSample = {
    actualPngBytes: {p50: 100, p75: 200, p95: 300},
    inferredCaptureSecondsPerFrame: {p50: 0.7, p75: 0.8, p90: 0.9},
  };
  const model = buildCapacityModel({itemFacts, captureSample, availableBytes: 10 ** 15});
  assert.equal(model.scenarios.low.logicalEvidenceFrames, 200);
  assert.equal(model.scenarios.low.pngObjectCount, 600);
  assert.deepEqual(model.scenarios.low.pngCopyRoles, [
    "original-runtime-baseline",
    "javascript-implementation",
    "difference-image",
  ]);
  assert.equal(model.scenarios.expected.logicalEvidenceFrames, 400);
  assert.equal(model.scenarios.high.logicalEvidenceFrames, 660);
  assert.equal(
    model.minimumSafeFreeBytes,
    Math.ceil(model.scenarios.high.incrementalBytes * 1.20) + model.operationalReserveBytes,
  );
  assert.equal(model.remainingEvidenceSafetyMultiplier, 1.20);
  assert.equal(model.operationalReserveBytes, 100 * 1024 ** 3);
  assert.equal(model.admissionIsFidelityEvidence, false);
});

test("checked-in report preserves source scope and acceptance boundary", async () => {
  const report = validateCapacityReport(JSON.parse(await readFile(
    new URL("../reports/g4-l3-capture-capacity-readiness.json", import.meta.url),
    "utf8",
  )));
  assert.equal(report.lessonScope.canonicalItems, 40);
  assert.equal(report.sourceTimelineFacts.summary.rootFrameCountSum, 440);
  assert.equal(report.sourceTimelineFacts.items.length, 40);
  assert.equal(report.capacityModel.admissionIsFidelityEvidence, false);
  const markdown = renderCapacityMarkdown(report);
  assert.match(markdown, /Dynamic workstation snapshot/);
  assert.match(markdown, /Capacity does not prove/);
  assert.match(markdown, /named human must still personally operate\/sign/);
});

test("CLI remains direct-node and rejects unknown arguments", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
