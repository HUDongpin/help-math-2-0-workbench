import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

const scriptUrl = new URL("./build-g5-l3-gate0a-source-crosscheck.mjs", import.meta.url);

test("G5 L3 source crosscheck is browser-free and fail-closed", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.doesNotMatch(source, /from\s+["']playwright["']/);
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.match(source, /fresh swfmill XML differs from canonical IR/);
  assert.match(source, /fresh FFDec script bundle differs from canonical IR/);
  assert.match(source, /productionRendererWritten:\s*false/);
  const invalid = spawnSync(process.execPath,
    [fileURLToPath(scriptUrl), "--source-root", "."], {encoding: "utf8"});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /--source-root must be an explicit absolute path/);
});
