import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeG4L3ShellAdditionalFrameDomains,
  parseArguments,
} from "./materialize-g4-l3-shell-additional-frame-domains.mjs";

test("checked-in Shell additional-domain materialization is hash-bound and acceptance-neutral", async () => {
  const report = await materializeG4L3ShellAdditionalFrameDomains({check: true});
  assert.equal(report.summary.declaredFrameDomainsBefore, 6);
  assert.equal(report.summary.declaredFrameDomainsAfter, 20);
  assert.equal(report.summary.additionalFrameDomains, 14);
  assert.equal(report.summary.additionalLocalFrames, 142);
  assert.equal(report.summary.additionalPendingRequirements, 28);
  assert.equal(report.summary.runtimeSessionsExecuted, 0);
  assert.equal(report.summary.strictCompletions, 0);
  assert(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);
});

test("Shell additional-domain materializer accepts only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
