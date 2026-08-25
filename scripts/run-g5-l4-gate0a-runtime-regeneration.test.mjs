import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {parseArguments} from
  "./run-g5-l4-gate0a-runtime-regeneration.mjs";

test("G5 L4 Gate 0A CLI has only preflight, freeze, and receipt modes", () => {
  assert.deepEqual(parseArguments([]), {mode: "receipt"});
  assert.deepEqual(parseArguments(["--preflight"]), {mode: "preflight"});
  assert.deepEqual(parseArguments(["--freeze"]), {mode: "freeze"});
  assert.throws(() => parseArguments(["--apply"]), /usage/);
  assert.throws(() => parseArguments(["--freeze", "extra"]), /usage/);
});

test("G5 L4 Gate 0A wrapper is browser/apply/production-write inert", async () => {
  const source = await readFile(
    new URL("./run-g5-l4-gate0a-runtime-regeneration.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /playwright/);
  assert.doesNotMatch(source, /npx\s+vercel|vercel\s+promote/);
  assert.match(source, /open\(target, "wx", 0o444\)/);
  assert.match(source, /sourceFirstPassCount:\s*54/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /applyAuthorization:\s*false/);
});

test("G5 L4 Gate 0A denominator is 51 shared plus three dedicated", async () => {
  const source = await readFile(
    new URL("./run-g5-l4-gate0a-runtime-regeneration.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /G5_L4_SOURCE_STATIC_IDS\.length === 51/);
  assert.match(source, /resultById\.size === 54/);
  assert.match(source, /records\.length === 54/);
  assert.match(source, /placementCount: 54/);
});
