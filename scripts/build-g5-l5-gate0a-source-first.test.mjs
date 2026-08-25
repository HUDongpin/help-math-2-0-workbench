import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath} from "node:url";

const scriptPath = new URL("./build-g5-l5-gate0a-source-first.mjs", import.meta.url);

test("G5 L5 Gate 0A source-first runner is browser-free and fail-closed", async () => {
  const source = await readFile(scriptPath, "utf8");
  assert.doesNotMatch(source, /from\s+["']playwright["']/);
  assert.doesNotMatch(source, /import\(["']playwright["']\)/);
  assert.doesNotMatch(source, /chromium\.launch\s*\(/);
  assert.match(source, /productionRendererWritten:\s*false/);
  assert.match(source, /applySentinelUpdated:\s*false/);
  assert.match(source, /--source-root must be an explicit absolute path/);

  const invalid = spawnSync(process.execPath, [fileURLToPath(scriptPath), "--source-root", "."], {
    encoding: "utf8",
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /--source-root must be an explicit absolute path/);
});
