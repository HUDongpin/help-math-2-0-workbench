import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("./run-g3-l2-gate0a-runtime-regeneration.mjs", import.meta.url);

test("G3 L2 Gate 0A wrapper is create-exclusive and browser/apply inert", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /playwright/);
  assert.doesNotMatch(source, /--apply/);
  assert.match(source, /open\(target, "wx", 0o444\)/);
  assert.match(source, /runtime-only regeneration did not close 70\/70/);
  assert.match(source, /browserStarted:\s*false/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /applyAuthorization:\s*false/);
});

test("G3 L2 Gate 0A wrapper requires exact source-first and v9 bindings", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.match(source, /source-first-regeneration/);
  assert.match(source, /regenerated runtime differs from v9 input/);
  assert.match(source, /source custody drifted/);
  assert.match(source, /fresh member manifest/);
  assert.match(source, /G3 L2 provenance record denominator drifted/);
});
