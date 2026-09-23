import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildG5L5RuffleReferenceMatrix,
  parseArguments,
  renderG5L5RuffleReferenceMarkdown,
  validateG5L5RuffleReferenceMatrix,
} from "./build-g5-l5-ruffle-reference-matrix.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L5RuffleReferenceMatrix();
  return reportPromise;
}

test("builds the exact release-driven 57-member physically verified queue", async () => {
  const report = await buildOnce();
  assert.equal(report.queue.length, 57);
  assert.equal(report.summary.physicallyVerifiedSourceSwfs, 57);
  assert.equal(report.summary.native800x600Items, 57);
  assert.equal(report.summary.twelveFpsItems, 57);
  assert.equal(report.summary.rootFrameCountSum, 610);
  assert.equal(
    report.queue[0].animationId,
    "course-g05-l05-ir-001-664ab764",
  );
  assert.equal(
    report.queue.at(-1).animationId,
    "shell-course-g05-l05-index-local",
  );
  for (const item of report.queue) {
    assert.equal(item.assetId, `swf-${item.source.swf.sha256}`);
    assert.equal(item.source.swf.physicalBytesAndHashVerifiedNow, true);
    assert.equal(item.source.swf.regularNonSymlinkFile, true);
    assert.equal(item.source.swf.copiedIntoWebPublic, false);
    assert.deepEqual(item.runtime.stage, {
      width: 800,
      height: 600,
      deviceScaleFactor: 1,
    });
    assert.equal(item.runtime.fps, 12);
    assert.equal(item.runtime.exactSourceFrameObservedByThisQueue, null);
  }
});

test("binds the exact existing eight-member G5 L5 risk-calibration set", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.diagnosticExecutionPolicy.representativeAnimationIds,
    [
      "shell-course-g05-l05-index-local",
      "course-g05-l05-rw-002",
      "course-g05-l05-in-016",
      "course-g05-l05-in-020",
      "course-g05-l05-ti-006",
      "course-g05-l05-gs-002",
      "course-g05-l05-ts-007",
      "course-g05-l05-fq-002",
    ],
  );
  assert.equal(report.summary.riskCalibrationQueueItems, 8);
  assert.equal(
    report.representativeDiagnostics.selection.allRiskCalibrationAxesCovered,
    true,
  );
  assert.ok(
    report.representativeDiagnostics.records.every(
      (record) => record.intendedCalibrationAxes.length === 4,
    ),
  );
});

test("retains eight passing English delivery/load/containment/PNG diagnostics", async () => {
  const report = await buildOnce();
  const diagnostics = report.representativeDiagnostics;
  assert.equal(diagnostics.selection.language, "en");
  assert.equal(diagnostics.selection.executedCount, 8);
  assert.equal(diagnostics.summary.diagnosticsPassed, 8);
  assert.equal(diagnostics.summary.exactSourceDeliveryPassed, 8);
  assert.equal(diagnostics.summary.localRuffleLoadPassed, 8);
  assert.equal(diagnostics.summary.loopbackNetworkContainmentPassed, 8);
  assert.equal(diagnostics.summary.native800x600PngCreated, 8);
  assert.equal(diagnostics.summary.unexpectedExternalRequests, 0);
  assert.equal(diagnostics.summary.blockedRequestsReachedServer, 0);
  assert.equal(diagnostics.summary.pageErrors, 0);
  assert.equal(diagnostics.summary.uniformReferenceSurfaces, 7);
  assert.equal(diagnostics.summary.nonuniformReferenceSurfaces, 1);
  assert.equal(diagnostics.summary.blockedLocalRequests, 2);
  assert.equal(diagnostics.summary.consoleErrors, 2);
  for (const record of diagnostics.records) {
    assert.equal(record.result, "passed-local-route-load-diagnostic");
    assert.equal(record.exactSourceBytesVerified, true);
    assert.equal(record.ruffleLoadPromiseResolved, true);
    assert.equal(record.native800x600PngCreated, true);
    assert.equal(record.allExecutedHttpRequestsExactLoopbackOrigin, true);
    assert.equal(record.screenshot.width, 800);
    assert.equal(record.screenshot.height, 600);
    assert.equal(record.screenshot.sourceFrameBinding, null);
  }
  assert.equal(diagnostics.blockers.length, 3);
  assert.equal(
    diagnostics.blockers[1].blockerId,
    "shell-local-dependencies-denied-by-probe",
  );
  assert.equal(diagnostics.blockers[1].blockedLocalRequests.length, 2);
  assert.equal(diagnostics.blockers[1].consoleErrorCount, 2);
  assert.equal(diagnostics.blockers[1].pageErrorCount, 0);
});

test("keeps production routes closed, networking denied, and public free of SWFs", async () => {
  const boundary = (await buildOnce()).localReferenceRuntime.routeBoundary;
  assert.equal(boundary.developmentApiOnly, true);
  assert.equal(boundary.productionExposure, false);
  assert.equal(boundary.productionGuardStaticVerification, true);
  assert.deepEqual(boundary.productionGuardExpectedStatuses, {
    referencePage: 404,
    referenceSwfApi: 404,
    ruffleAssetApi: 404,
  });
  assert.equal(boundary.productionHttpObservation, null);
  assert.equal(boundary.productWebPublicSwfCount, 0);
  assert.equal(boundary.sourceSwfCopiesCreated, 0);
  assert.deepEqual(boundary.ruffleOptions, {
    allowNetworking: "none",
    allowScriptAccess: false,
    openUrlMode: "deny",
  });
});

test("keeps all authority, acceptance, strict completion, and publication flags false", async () => {
  const report = await buildOnce();
  assert.equal(report.lesson.strictCompletion, "0/57");
  assert.equal(report.lesson.published, false);
  assert.equal(report.sourceBindings.releaseLedger.strictCompleteCount, 0);
  assert.equal(report.sourceBindings.releaseLedger.published, false);
  assert.ok(
    Object.entries(report.acceptance)
      .filter(
        ([key]) =>
          key.endsWith("Authority") ||
          key === "strictAcceptanceEffect" ||
          key === "publicationEffect",
      )
      .every(([, value]) => value === false),
  );
  for (const record of report.representativeDiagnostics.records) {
    assert.ok(
      Object.values(record.authority).every((value) => value === false),
    );
  }
  assert.ok(
    Object.values(report.unresolvedEvidence).every((value) => value === 0),
  );
});

test("checked-in JSON and Markdown are deterministic and current", async () => {
  const checkedIn = validateG5L5RuffleReferenceMatrix(
    JSON.parse(
      await readFile(
        new URL(
          "../reports/g5-l5-ruffle-reference-matrix.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
  const markdown = await readFile(
    new URL(
      "../reports/g5-l5-ruffle-reference-matrix.md",
      import.meta.url,
    ),
    "utf8",
  );
  assert.equal(
    markdown,
    `${renderG5L5RuffleReferenceMarkdown(checkedIn)}\n`,
  );
  assert.match(markdown, /Representative diagnostics: \*\*8\/8\*\*/);
  assert.match(markdown, /Strict completion \/ publication: \*\*0\/57 \/ false\*\*/);
});

test("CLI separates prepare from final check and rejects unknown options", () => {
  assert.equal(parseArguments(["--prepare"]).prepare, true);
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(
    () => parseArguments(["--check", "--prepare"]),
    /cannot be combined/,
  );
  assert.throws(
    () => parseArguments(["--unknown"]),
    /Unknown option/,
  );
});
