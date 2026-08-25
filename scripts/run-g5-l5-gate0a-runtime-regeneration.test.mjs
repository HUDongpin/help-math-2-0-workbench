import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("./run-g5-l5-gate0a-runtime-regeneration.mjs", import.meta.url);

test("G5 L5 runtime wrapper remains a no-browser, no-production-write contract", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /--apply/);
  assert.match(source, /runtime-only generator check did not close 56\/56/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /writeExclusive\(RECEIPT_PATH/);
});
