import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L5OriginalRuntimeContainmentReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L5OriginalRuntimeContainmentReadiness,
  writeOrCheck,
} from "./build-g5-l5-original-runtime-containment-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L5OriginalRuntimeContainmentReadiness();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-containment-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("binds the exact 56-page plus Shell release and only the three G5 L5 readiness reports", async () => {
  const report = validateG5L5OriginalRuntimeContainmentReadiness(
    await buildOnce(),
  );
  assert.equal(report.scope.releaseMemberCount, 57);
  assert.equal(report.scope.activeXmlReferencedPageCount, 56);
  assert.equal(report.scope.courseShellCount, 1);
  assert.equal(
    report.sourceBindings.releaseManifest.releaseJsonPointer,
    "/releases/2",
  );
  assert.equal(
    report.sourceBindings.sourceGapForensics.path,
    "reports/g5-l5-source-gap-forensics.json",
  );
  assert.equal(
    report.sourceBindings.runtimePlanningReadiness.path,
    "reports/g05-l05-add-subtract-negative-numbers-runtime-acquisition-planning-readiness.json",
  );
  assert.equal(
    report.sourceBindings.animateAuthoringOperatorReadiness.path,
    "reports/g5-l5-animate-authoring-operator-readiness.json",
  );
  assert.equal(report.sourceBindings.operatorAssignmentReceipt, null);
  assert.deepEqual(report.sourceBindings.workStudyScenarioInventories, []);
  assert.match(report.authority, /imports no G5 L4 operator receipt/);
});

test("specifies CR-01 through CR-08 with every mechanism null and every approval and verification false", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.containmentPlan.controls.map(({controlId}) => controlId),
    ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"],
  );
  assert.ok(
    report.containmentPlan.controls.every(
      (control) =>
        control.mechanism === null &&
        control.approved === false &&
        control.verified === false,
    ),
  );
  assert.equal(report.containmentPlan.mechanismsSelected, 0);
  assert.equal(report.containmentPlan.controlsApproved, 0);
  assert.equal(report.containmentPlan.controlsVerified, 0);
});

test("keeps the host tree incomplete because L5KTE01 and L5KTS01 are absent", async () => {
  const report = await buildOnce();
  assert.equal(report.hostTreeReadiness.complete, false);
  assert.equal(report.hostTreeReadiness.readOnlyHostTreeMaterialized, false);
  assert.equal(report.hostTreeReadiness.cr02TechnicalArtifactComplete, false);
  assert.deepEqual(
    report.hostTreeReadiness.missingDeclaredDependencies.map(
      ({path: dependencyPath, physicalPresence}) => ({
        path: dependencyPath,
        physicalPresence,
      }),
    ),
    [
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTE01.xml",
        physicalPresence: false,
      },
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTS01.xml",
        physicalPresence: false,
      },
    ],
  );
  assert.equal(
    report.hostTreeReadiness.inventedOrSubstitutedDependencyCount,
    0,
  );
});

test("records zero named operators and sessions, runnable false, strict 0/57, and unpublished", async () => {
  const report = await buildOnce();
  assert.equal(report.operatorBoundary.namedOperatorCount, 0);
  assert.equal(report.operatorBoundary.namedOperatorRoleAssignment, null);
  assert.equal(report.operatorBoundary.operatorAssignmentReceipt, null);
  assert.equal(report.executionGate.runtimeSessionCount, 0);
  assert.equal(report.executionGate.runnable, false);
  assert.deepEqual(report.strictCompletion, {
    completeMembers: 0,
    expectedMembers: 57,
    fraction: "0/57",
    complete: false,
  });
  assert.equal(report.publication.published, false);
  assert.equal(report.summary.originalRuntimeSessionsExecuted, 0);
  assert.equal(report.summary.strictCompletions, 0);
  assert.equal(report.summary.publications, 0);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});

test("validator rejects operator, mechanism, runtime, strict, and publication promotion", async () => {
  const report = await buildOnce();

  const operator = structuredClone(report);
  operator.operatorBoundary.namedOperatorCount = 1;
  assert.throws(
    () => validateG5L5OriginalRuntimeContainmentReadiness(operator),
    /operator identity or receipt was inherited/,
  );

  const mechanism = structuredClone(report);
  mechanism.containmentPlan.controls[0].mechanism = "invented-firewall";
  assert.throws(
    () => validateG5L5OriginalRuntimeContainmentReadiness(mechanism),
    /mechanism was selected/,
  );

  const runtime = structuredClone(report);
  runtime.executionGate.runtimeSessionCount = 1;
  assert.throws(
    () => validateG5L5OriginalRuntimeContainmentReadiness(runtime),
    /execution gate identity drifted/,
  );

  const strict = structuredClone(report);
  strict.strictCompletion.completeMembers = 1;
  assert.throws(
    () => validateG5L5OriginalRuntimeContainmentReadiness(strict),
    /strict-completion state was promoted/,
  );

  const published = structuredClone(report);
  published.publication.published = true;
  assert.throws(
    () => validateG5L5OriginalRuntimeContainmentReadiness(published),
    /publication state was promoted/,
  );
});

test("writer creates and then checks a deterministic JSON and Markdown pair", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/containment",
    };
    const written = await writeOrCheck(options);
    assert.equal(written.action, "written");
    assert.equal(
      await readFile(path.join(root, "reports", "containment.json"), "utf8"),
      stableJson(report),
    );
    assert.equal(
      await readFile(path.join(root, "reports", "containment.md"), "utf8"),
      renderMarkdown(report),
    );
    const checked = await writeOrCheck({...options, check: true});
    assert.equal(checked.action, "verified");
  });
});

test("CLI exposes deterministic output/check only and rejects execution or approval options", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    outputPrefix: "reports/g5-l5-original-runtime-containment-readiness",
  });
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--approve"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--output-prefix", "../outside"]),
    /below reports/,
  );
  assert.throws(
    () => parseArguments(["--output-prefix", "reports/a.json"]),
    /extensionless/,
  );
});
