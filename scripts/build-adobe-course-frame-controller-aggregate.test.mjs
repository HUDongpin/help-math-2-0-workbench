import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdtemp,
  readFile,
  readdir,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {COURSE_CHILD_PILOT_IDS} from "./build-adobe-course-host-fixtures.mjs";
import {
  buildControllerAggregateOnly,
  parseArguments,
  validateEngineeringReportExact,
} from "./build-adobe-course-frame-controller-aggregate.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function perIdSnapshot() {
  const snapshot = {};
  for (const animationId of COURSE_CHILD_PILOT_IDS) {
    for (const basename of [
      "adobe-course-frame-controller-spec.json",
      "adobe-course-frame-controller-engineering-report.json",
    ]) {
      const relative = `migrations/${animationId}/audit/${basename}`;
      snapshot[relative] = digest(await readFile(path.join(projectRoot, relative)));
    }
  }
  return snapshot;
}

test("aggregate CLI accepts only aggregate roots and check mode", () => {
  const parsed = parseArguments([
    "--check",
    "--migrations",
    "./migrations",
    "--reports",
    "./reports",
    "--output",
    "./work/controller",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.migrationsRoot, path.resolve("./migrations"));
  assert.equal(parsed.reportsRoot, path.resolve("./reports"));
  assert.equal(parsed.outputRoot, path.resolve("./work/controller"));
  for (const forbidden of [
    ["--id", "course-g04-l09-gs-002"],
    ["--frame", "642"],
    ["--no-compile"],
    ["--verify", "fixture-manifest.json"],
  ]) {
    assert.throws(
      () => parseArguments(forbidden),
      /aggregate-only mode forbids/,
    );
  }
});

test("engineering-report validation rejects semantic or authority drift", async () => {
  const reportPath = path.join(
    projectRoot,
    "migrations/course-g04-l09-gs-002/audit/adobe-course-frame-controller-engineering-report.json",
  );
  const reportText = await readFile(reportPath, "utf8");
  const report = JSON.parse(reportText);
  validateEngineeringReportExact({
    report,
    reportText,
    expected: report,
    animationId: report.animationId,
  });

  const authorityDrift = structuredClone(report);
  authorityDrift.authority.ownerAcceptanceClaimed = true;
  assert.throws(
    () => validateEngineeringReportExact({
      report: authorityDrift,
      reportText: `${JSON.stringify(authorityDrift, null, 2)}\n`,
      expected: report,
      animationId: report.animationId,
    }),
    /authority\/status boundary changed/,
  );

  const semanticDrift = structuredClone(report);
  semanticDrift.controllerContract.canonicalTargetFrame += 1;
  assert.throws(
    () => validateEngineeringReportExact({
      report: semanticDrift,
      reportText: `${JSON.stringify(semanticDrift, null, 2)}\n`,
      expected: report,
      animationId: report.animationId,
    }),
    /stale or semantically changed/,
  );
});

test("aggregate-only write validates all nine and writes only three aggregate files", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "course-controller-aggregate-"));
  const reportsRoot = path.join(temporary, "reports");
  const outputRoot = path.join(temporary, "work");
  const before = await perIdSnapshot();
  const written = await buildControllerAggregateOnly({
    reportsRoot,
    outputRoot,
  });
  assert.equal(written.status, "canonical-nine-course-controller-aggregate-written");
  assert.equal(written.fixtureCount, 9);
  assert.equal(written.perIdArtifactsWritten, 0);
  assert.equal(written.strictAcceptanceEffect, "none");
  assert.deepEqual(await perIdSnapshot(), before);
  assert.deepEqual((await readdir(reportsRoot)).sort(), [
    "adobe-course-frame-controller-fixtures.json",
    "adobe-course-frame-controller-fixtures.md",
  ]);
  assert.deepEqual(await readdir(outputRoot), ["manifest.json"]);
  assert.equal(
    digest(await readFile(path.join(reportsRoot, "adobe-course-frame-controller-fixtures.json"))),
    written.index.sha256,
  );
  assert.equal(
    digest(await readFile(path.join(outputRoot, "manifest.json"))),
    written.index.sha256,
  );

  const checked = await buildControllerAggregateOnly({
    reportsRoot,
    outputRoot,
    check: true,
  });
  assert.equal(checked.status, "canonical-nine-course-controller-aggregate-checked");
  assert.deepEqual(await perIdSnapshot(), before);
});
