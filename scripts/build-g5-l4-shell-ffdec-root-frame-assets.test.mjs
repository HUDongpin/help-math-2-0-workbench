import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG5L4ShellRootFrameAssets,
  inspectG5L4ShellRootFrameAssets,
  parseArguments,
} from "./build-g5-l4-shell-ffdec-root-frame-assets.mjs";

test("G5 L4 shell root-frame arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown argument/);
});

test("G5 L4 shell manifest remains deterministic structural-only evidence", async () => {
  const first = await inspectG5L4ShellRootFrameAssets();
  const second = await inspectG5L4ShellRootFrameAssets();

  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.animationId, "shell-course-g05-l04-index-local");
  assert.equal(first.status, "structural-only");
  assert.equal(
    first.classification,
    "engineering-structural-inspection-not-strict-acceptance",
  );
  assert.equal(first.authority.kind, "ffdec-static-root-timeline-structural-render");
  assert.equal(first.authority.actionScriptExecuted, false);
  assert.equal(first.authority.originalRuntimeBaseline, false);
  assert.equal(first.authority.naturalPlaybackClaimed, false);
  assert.match(first.authority.authorityBoundary, /not an original-runtime baseline/i);
  assert.equal(
    first.source.swf,
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index_local.swf",
  );
  assert.equal(
    first.source.swfSha256,
    "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
  );
  assert.equal(first.sourceReport.status, "structural-baseline-only");
  assert.deepEqual(first.runtime.stage, {width: 800, height: 600});
  assert.equal(first.runtime.fps, 12);
  assert.equal(first.runtime.frameDomain, "root");
  assert.equal(first.runtime.frameCount, 50);
  assert.equal(first.frames.length, 50);
  assert.deepEqual(
    first.frames.map(({frame}) => frame),
    Array.from({length: 50}, (_value, index) => index + 1),
  );
  assert.ok(first.frames.every(({width, height}) => width === 800 && height === 600));
  assert.equal(first.strictAcceptanceEffect, "none");
});

test("checked-in G5 L4 shell root-frame assets match their deterministic inputs", async () => {
  const manifest = await buildG5L4ShellRootFrameAssets({check: true});
  assert.equal(manifest.frames.length, 50);
  assert.equal(manifest.status, "structural-only");
  assert.equal(manifest.strictAcceptanceEffect, "none");
});
