import assert from "node:assert/strict";
import test from "node:test";

import {generateCheckpoint, parseArguments, summarizePorcelain} from "./build-g4-l3-v2-execution-checkpoint.mjs";

test("summarizes worktree state without retaining paths and excludes checkpoint outputs", () => {
  const raw = [
    " M package.json",
    "?? reports/g4-l3-v2-execution-checkpoint.json",
    "?? reports/g4-l3-v2-execution-checkpoint.md",
    "?? scripts/new-safe-script.mjs",
    "",
  ].join("\0");
  const summary = summarizePorcelain(raw);
  assert.equal(summary.recordCount, 2);
  assert.deepEqual(summary.statusCounts, {" M": 1, "??": 1});
  assert.match(summary.porcelainSha256, /^[a-f0-9]{64}$/);
  assert.equal(summary.pathsWithheld, true);
  assert.equal(JSON.stringify(summary).includes("package.json"), false);
});

test("parses only the fail-closed check option", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/);
});

test("current checkpoint binds the exact 40-member closed release", async () => {
  const report = await generateCheckpoint();
  assert.equal(report.summary.releaseMembers, 40);
  assert.equal(report.summary.sourceMembersVerified, 40);
  assert.equal(report.summary.workspacePairsBound, 40);
  assert.equal(report.summary.coverageRequirements, 542);
  assert.equal(report.summary.invalidCoverageRanges, 0);
  assert.equal(report.summary.currentJavascriptPages, 39);
  assert.equal(report.summary.strictCompleteMembers, 0);
  assert.equal(report.summary.publishedReleases, 0);
  assert.equal(report.summary.privateGitBoundariesPassed, 8);
  assert.equal(
    report.boundaries.git.checks.some(({path, ignored}) => path === "work/g4-l3-v2-ts006-static-disposition-preimages/.g4-l3-v2-checkpoint-probe" && ignored),
    true,
  );
  assert.equal(
    report.boundaries.git.checks.some(({path, ignored}) => path === "work/g4-l3-v2-ts006-current-js-binding-preimages/.g4-l3-v2-checkpoint-probe" && ignored),
    true,
  );
  assert.equal(
    report.boundaries.vercel.checks.some(({rule, present}) => rule === "artifacts/" && present),
    true,
  );
  assert.equal(report.acceptance.strictComplete, false);
  assert.equal(report.acceptance.publicRelease, false);
  assert.equal(report.boundaries.rawPrivateEvidenceCopiedIntoCheckpoint, false);
  assert.equal(report.boundaries.secretsCopiedIntoCheckpoint, false);
  assert.match(report.checkpointSha256, /^[a-f0-9]{64}$/);
});
