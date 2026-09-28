import assert from "node:assert/strict";
import test from "node:test";

import {
  extractFunctionDefinition,
  parseArguments,
  run,
} from "./build-g4-l3-parent-composite-residual-behavior-plan.mjs";

test("function extraction ignores braces inside generated drawing strings", () => {
  const source = 'function sprite1(ctx){var pathData="M { 1 }";if(ctx){ctx.save();}}\nfunction sprite2(){}';
  assert.equal(
    extractFunctionDefinition(source, "sprite1"),
    'function sprite1(ctx){var pathData="M { 1 }";if(ctx){ctx.save();}}',
  );
});

test("residual behavior plan stays deterministic and acceptance-neutral", async () => {
  const report = await run();
  assert.equal(report.summary.residualPlacementPaths, 14);
  assert.equal(report.summary.sourcePositionObservablePaths, 0);
  assert.equal(
    report.summary.dispositionCounts["audio-only-empty-canvas-domain"],
    1,
  );
  assert.equal(report.acceptance.fidelityAccepted, false);
  assert.equal(report.acceptance.humanVisualAccepted, false);
  assert.equal(report.acceptance.ownerAccepted, false);
  assert.equal(report.acceptance.strictComplete, false);
});

test("residual behavior-plan CLI is fail closed", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--write", "extra"]), /zero arguments/);
});
