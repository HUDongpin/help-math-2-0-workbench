import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG5L4ShellControlAssets,
  parseArguments,
} from "./build-g5-l4-shell-control-assets.mjs";

test("G5 L4 shell control arguments fail closed", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "/opt/homebrew/bin/ffdec",
  });
  assert.deepEqual(parseArguments(["--check", "--ffdec", "ffdec"]), {
    check: true,
    ffdec: "ffdec",
  });
  assert.throws(() => parseArguments(["--write"]), /unknown argument/);
});

test("G5 L4 controls re-extract from the G5 shell without acceptance promotion", async () => {
  const manifest = await buildG5L4ShellControlAssets({check: true});
  assert.equal(manifest.animationId, "shell-course-g05-l04-index-local");
  assert.equal(manifest.status, "structural-only");
  assert.equal(manifest.assets.length, 14);
  assert.deepEqual(
    manifest.assets.filter(({sourceRootFrame}) => sourceRootFrame === 50)
      .map(({sourceCharacterId}) => sourceCharacterId),
    [595, 598, 1076, 1084, 1094],
  );
  assert.equal(
    manifest.crossLessonVisualComparison.byteIdenticalOutputCount,
    14,
  );
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");
});
