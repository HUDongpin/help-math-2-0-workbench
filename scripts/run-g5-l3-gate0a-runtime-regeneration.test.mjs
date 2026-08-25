import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("./run-g5-l3-gate0a-runtime-regeneration.mjs", import.meta.url);

test("G5 L3 runtime wrapper preserves Gate 0A boundaries", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.doesNotMatch(source, /--apply/);
  assert.match(source, /HELP_MATH_GATE0A_RUNTIME_ONLY=1 is required/);
  assert.match(source, /regenerated runtime differs from v9 input/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /writeExclusive\(RECEIPT_PATH/);
});
