import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  deriveFixedK1LoadedHost,
  parseArguments,
} from "./run-g4-l3-gate0a-runtime-regeneration.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("G4 L3 Gate 0A CLI has only preflight, freeze, and receipt modes", () => {
  assert.deepEqual(parseArguments([]), {mode: "receipt"});
  assert.deepEqual(parseArguments(["--preflight"]), {mode: "preflight"});
  assert.deepEqual(parseArguments(["--freeze"]), {mode: "freeze"});
  assert.throws(() => parseArguments(["--apply"]), /usage/);
  assert.throws(() => parseArguments(["--freeze", "extra"]), /usage/);
});

test("IR001 fixed-k1 loaded-host derivation exactly reproduces the v9 host bytes", async () => {
  const [base, host] = await Promise.all([
    readFile(new URL("../apps/web/public/flash-assets/courses/course-g04-l03-ir-001-341242cc/canvas-renderer.js", import.meta.url)),
    readFile(new URL("../apps/web/public/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js", import.meta.url)),
  ]);
  const derived = deriveFixedK1LoadedHost(base);
  assert.equal(derived.length, 327_984);
  assert.equal(sha256(derived),
    "3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0");
  assert.deepEqual(derived, host);
});

test("G4 L3 Gate 0A wrapper is browser/apply/production-write inert", async () => {
  const source = await readFile(new URL("./run-g4-l3-gate0a-runtime-regeneration.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /playwright/);
  assert.doesNotMatch(source, /npx\s+vercel|vercel\s+promote/);
  assert.match(source, /open\(target, "wx", 0o444\)/);
  assert.match(source, /sourceFirstPassCount:\s*40/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /applyAuthorization:\s*false/);
});

