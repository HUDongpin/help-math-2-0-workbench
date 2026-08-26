import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildAdopterReadiness,
  buildCanonicalKeyframesPostimage,
  checkAdopterReadiness,
  parseArguments,
  publishReadinessNoClobber,
} from "./build-g4-l10-vb003-static-specification-adopter-readiness-v1.mjs";

test("CLI publishes evidence only and rejects canonical mutation modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of [
    "--apply",
    "--recover",
    "--rollback",
    "--write",
    "--force",
    "--launch",
  ]) assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("real readiness projection freezes four postimages without authority", async () => {
  const bundle = await buildAdopterReadiness(PROJECT_ROOT);
  assert.equal(bundle.document.status,
    "frozen-postimage-projection-no-review-verdict-do-not-apply");
  assert.equal(bundle.document.decision, "DO_NOT_APPLY");
  assert.equal(bundle.document.futureCanonicalTargets.length, 4);
  assert.deepEqual(bundle.document.futureCanonicalTargets.map((target) =>
    target.operation), [
    "replace-exact-preimage",
    "replace-exact-preimage",
    "replace-exact-preimage-with-schema-preserving-append",
    "create-only-if-absent",
  ]);
  assert.equal(bundle.document.canonicalKeyframeProjection.schemaColumns, 23);
  assert.equal(bundle.document.canonicalKeyframeProjection.preservedRootRows, 8);
  assert.equal(bundle.document.canonicalKeyframeProjection.projectedNestedRows, 12);
  assert.equal(bundle.document.canonicalKeyframeProjection.projectedTotalRows, 20);
  assert.equal(bundle.document.independentReviewGate.reviewerTasksAuthorized, false);
  assert.equal(bundle.document.independentReviewGate.verdictPresent, false);
  assert.equal(bundle.document.implementationBoundary.artifactIsAdopter, false);
  assert.equal(bundle.document.implementationBoundary.actualCanonicalWriteSupported,
    false);
  assert.equal(bundle.document.implementationBoundary.applySupported, false);
  assert.ok(Object.values(bundle.document.authorityEffects)
    .every((value) => value === false));
  assert.match(bundle.document.readinessFingerprintSha256, /^[a-f0-9]{64}$/u);
});

test("keyframe projection preserves exact root bytes and maps twelve rows to canonical schema", async () => {
  const bundle = await buildAdopterReadiness(PROJECT_ROOT);
  const current = await readFile(path.join(
    PROJECT_ROOT,
    "migrations/course-g04-l10-vb-003/keyframes.csv",
  ));
  assert.deepEqual(bundle.keyframeProjection.postimage.subarray(0, current.length),
    current);
  const lines = bundle.keyframeProjection.postimage.toString("utf8")
    .trimEnd().split("\n");
  assert.equal(lines.length - 1, 20);
  assert.equal(lines[0].split(",").length, 23);
  assert.equal(bundle.keyframeProjection.rows.length, 12);
  assert.ok(bundle.keyframeProjection.rows.every((row) =>
    row.frame_domain_id === "sprite-120" &&
    row.trigger.includes("runtime causality unproven") &&
    row.baseline_file === "" &&
    row.implementation_file === "" &&
    row.diff_file === "" &&
    row.reviewer === ""));
  assert.throws(() => buildCanonicalKeyframesPostimage(
    Buffer.from("wrong\n", "utf8"), []), /schema drifted|eight root rows/u);
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildAdopterReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-adopter-readiness-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.futureCanonicalTargets, 4);
  assert.equal(result.applySupported, false);
  await assert.rejects(() => publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "foreign replacement\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkAdopterReadiness(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no report", async () => {
  const bundle = await buildAdopterReadiness(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-adopter-readiness-fail-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  await assert.rejects(() => publishReadinessNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => {
      throw new Error("simulated input drift before evidence publication");
    },
  }), /simulated input drift/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
