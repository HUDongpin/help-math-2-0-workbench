import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  inventory,
  parseManifest,
  serializeManifest,
} from "./freeze-help-math-sources.mjs";

test("freezes a source tree with stable relative paths and hashes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-freeze-"));
  try {
    await mkdir(path.join(root, "nested"));
    await writeFile(path.join(root, "z.swf"), "flash-z");
    await writeFile(path.join(root, "nested", "a.fla"), "flash-a");

    const snapshot = await inventory(root);
    assert.equal(snapshot.records.length, 2);
    assert.equal(snapshot.bytes, 14);
    assert.deepEqual(
      snapshot.records.map((record) => record.path),
      ["nested/a.fla", "z.swf"],
    );
    assert.match(snapshot.records[0].sha256, /^[a-f0-9]{64}$/);

    const manifest = serializeManifest(snapshot.records);
    assert.deepEqual(parseManifest(manifest),
      snapshot.records.map(({ path: relativePath, sha256 }) => ({
        path: relativePath,
        sha256,
      })),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects malformed source manifest lines", () => {
  assert.throws(() => parseManifest("not-a-hash  source.swf\n"), /line 1/);
});
