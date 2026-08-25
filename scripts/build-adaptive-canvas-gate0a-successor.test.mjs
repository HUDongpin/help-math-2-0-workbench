import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  parseArguments,
  runtimeSetIdentity,
} from "./build-adaptive-canvas-gate0a-successor.mjs";

test("Gate 0A successor CLI has only freeze, inventory, and check modes", () => {
  assert.deepEqual(parseArguments(["--freeze"]), {mode: "freeze"});
  assert.deepEqual(parseArguments(["--inventory"]), {mode: "inventory"});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check"});
  assert.throws(() => parseArguments([]), /usage/);
  assert.throws(() => parseArguments(["--apply"]), /usage/);
  assert.throws(() => parseArguments(["--inventory", "extra"]), /usage/);
});

test("runtime-set identity requires exactly 284 unique-order records", () => {
  const records = Array.from({length: 284}, (_, index) => ({
    animationId: `animation-${String(index).padStart(3, "0")}`,
    assetPath: `courses/animation-${String(index).padStart(3, "0")}/canvas-renderer.js`,
    pageRenderer: index !== 283,
    input: {bytes: index + 1, sha256: "a".repeat(64)},
    output: {bytes: index + 2, sha256: "b".repeat(64)},
  }));
  const identity = runtimeSetIdentity(records);
  assert.equal(identity.totalRuntimeCount, 284);
  assert.equal(identity.pageRendererCount, 283);
  assert.equal(identity.loadedHostCount, 1);
  assert.match(identity.inputChecksumSetSha256, /^[a-f0-9]{64}$/);
  assert.match(identity.outputChecksumSetSha256, /^[a-f0-9]{64}$/);
  assert.throws(() => runtimeSetIdentity(records.slice(1)), /284/);
});

test("Gate 0A successor is browser/apply/formal-receipt inert", async () => {
  const source = await readFile(
    new URL("./build-adaptive-canvas-gate0a-successor.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /playwright/);
  assert.doesNotMatch(source, /--apply/);
  assert.doesNotMatch(source, /APPROVED_REGENERATION_PROVENANCE_RECEIPT_SHA256\s*=/);
  assert.doesNotMatch(source,
    /writeExclusive\(\s*"work\/adaptive-canvas-production-five\.regeneration-provenance\.v1\.json"/);
  assert.match(source, /formalReceiptWrittenByProducer:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /open\(target, "wx", 0o444\)/);
  assert.match(source, /\^stale/);
});
