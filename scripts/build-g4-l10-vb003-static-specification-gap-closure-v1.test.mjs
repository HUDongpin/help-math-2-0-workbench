import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_PATH,
  deriveReport,
  parseCliArgs,
  readSnapshot,
  resolveSafeOutputPath,
  validateReport,
  validateProbeObservation,
  validateWorkspaceTrackingOutput,
  writeNoClobber,
} from "./build-g4-l10-vb003-static-specification-gap-closure-v1.mjs";

let snapshot;
let report;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  report = deriveReport(snapshot);
});

test("derives an exact-preimage-bound acceptance-neutral report", () => {
  assert.equal(validateReport(report), true);
  assert.equal(report.workspaceModified, false);
  assert.equal(report.sourceModified, false);
  assert.equal(report.rendererAdopted, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("records the two exact audio identities without claiming listening", () => {
  const change = report.proposedChanges.find(({id}) =>
    id === "P1-A-audio-manifest-triangle");
  assert.deepEqual(change.proposed.jsonPointers["/audio/languages"], ["es", "und"]);
  assert.deepEqual(change.proposed.jsonPointers["/audio/cues"].map(({id}) => id),
    ["catalog-audio-01", "embedded-stream-0001"]);
  assert.ok(change.proposed.jsonPointers["/audio/cues"].every((cue) =>
    cue.listeningAccepted === false && cue.synchronizationVerified === false));
});

test("records 120 source definitions and refuses to materialize guessed rows", () => {
  const change = report.proposedChanges.find(({id}) =>
    id === "P1-B-source-definition-and-host-dependency-manifest");
  assert.equal(change.proposed.machineArtifactCandidate.rowCount, 120);
  assert.equal(change.proposed.machineArtifactCandidate.materializedByThisReport, false);
  assert.equal(change.proposed.jsonPointers["/audit/assetsRequired"], true);
});

test("keeps all twelve nested structural candidates evidence-empty", () => {
  const rows = report.proposedChanges.find(({id}) =>
    id === "P1-D-nested-structural-keyframe-candidates").proposed.rows;
  assert.deepEqual([...new Set(rows.map(({frame}) => frame))], [1, 3, 4, 51, 130, 203]);
  assert.deepEqual([...new Set(rows.map(({language}) => language))].sort(), ["en", "es"]);
  assert.ok(rows.every(({runtimeReachability}) => runtimeReachability === "unresolved"));
  assert.ok(rows.every(({normalizedRmse, reviewer}) =>
    normalizedRmse === null && reviewer === null));
});

test("captures the current TS007 and TS008 semantic projection drift", () => {
  assert.equal(report.wholeLessonFreshnessAdvisory.status,
    "fail-closed-stale-downstream-projections-detected");
  assert.deepEqual(report.wholeLessonFreshnessAdvisory.affectedMembers,
    ["course-g04-l10-ts-007", "course-g04-l10-ts-008"]);
  assert.ok(report.wholeLessonFreshnessAdvisory.probes.every(({exitCode}) =>
    exitCode !== 0));
});

test("freshness probes reject exit-zero and wrong-diagnostic observations", () => {
  const specification = {
    id: "fixture-probe",
    expected: ["known stale diagnostic"],
  };
  assert.equal(validateProbeObservation(specification, {
    exitCode: 1,
    combined: "known stale diagnostic",
  }), true);
  assert.throws(() => validateProbeObservation(specification, {
    exitCode: 0,
    combined: "known stale diagnostic",
  }), /unexpectedly became current/u);
  assert.throws(() => validateProbeObservation(specification, {
    exitCode: 1,
    combined: "different failure",
  }), /did not expose expected stale evidence/u);
});

test("workspace tracking validation fails closed after staging or other drift", () => {
  assert.equal(validateWorkspaceTrackingOutput(
    "?? migrations/course-g04-l10-vb-003/\n",
  ), "?? migrations/course-g04-l10-vb-003/");
  assert.throws(() => validateWorkspaceTrackingOutput(
    "A  migrations/course-g04-l10-vb-003/migration.json\n",
  ), /Git tracking state changed/u);
});

test("rejects every acceptance mutation", () => {
  const mutated = structuredClone(report);
  mutated.acceptanceEffects.ownerAcceptance = true;
  mutated.reportFingerprintSha256 = report.reportFingerprintSha256;
  assert.throws(() => validateReport(mutated));
});

test("CLI deliberately has no apply mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs(["--apply"]), /deliberately unsupported/u);
});

test("output handling rejects final-component and parent-directory symlinks", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(tmpdir(), "g4-l10-gap-symlink-"),
  ));
  try {
    const projectRoot = path.join(temporary, "project");
    const outside = path.join(temporary, "outside");
    await mkdir(projectRoot);
    await mkdir(outside);
    const target = path.join(outside, "target.json");
    await writeFile(target, "{}\n");
    const finalSymlink = path.join(projectRoot, "report.json");
    await symlink(target, finalSymlink);
    await assert.rejects(
      writeNoClobber(finalSymlink, "{}\n"),
      /ordinary non-symlink file|resolves through a symlink/u,
    );

    const parentSymlink = path.join(projectRoot, "reports");
    await symlink(outside, parentSymlink);
    await assert.rejects(
      resolveSafeOutputPath(projectRoot, "reports/new.json"),
      /Output parent resolves through a symlink/u,
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("no-clobber accepts exact bytes and rejects foreign ordinary-file bytes", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(tmpdir(), "g4-l10-gap-output-"),
  ));
  try {
    const output = path.join(temporary, "report.json");
    await writeFile(output, "exact\n");
    assert.equal(await writeNoClobber(output, "exact\n"), "already-current");
    await assert.rejects(
      writeNoClobber(output, "different\n"),
      /refusing overwrite/u,
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("checked-in report exactly matches the live derived bytes", async () => {
  const expected = `${JSON.stringify(report, null, 2)}\n`;
  const actual = await readFile(`${PROJECT_ROOT}/${REPORT_PATH}`, "utf8");
  assert.equal(actual, expected);
});
