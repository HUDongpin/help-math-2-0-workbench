import assert from "node:assert/strict";
import test from "node:test";

import {materializeG4L3ShellSingleFrameDomains, parseArguments} from "./materialize-g4-l3-shell-single-frame-domains.mjs";

test("checked-in Shell one-frame materialization is source-bound and acceptance-neutral", async () => {
  const report = await materializeG4L3ShellSingleFrameDomains({check: true});
  assert.equal(report.summary.declaredFrameDomainsBefore, 20);
  assert.equal(report.summary.declaredFrameDomainsAfter, 34);
  assert.equal(report.summary.additionalFrameDomains, 14);
  assert.equal(report.summary.additionalLocalFrames, 14);
  assert.equal(report.summary.additionalPendingRequirements, 28);
  assert.equal(report.summary.unresolvedTimelineForecastAfterDispositionRefresh, 0);
  assert.equal(report.summary.runtimeSessionsExecuted, 0);
  assert.equal(report.summary.strictCompletions, 0);
  assert(Object.values(report.acceptance).every((value) => value === false));
});

test("Shell one-frame receipt refresh is explicit and mutually exclusive with check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false, refresh: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--complete"]), /Unknown option/);
});
