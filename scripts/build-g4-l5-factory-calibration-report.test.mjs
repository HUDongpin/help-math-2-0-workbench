import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReport,
  renderMarkdown,
} from "./build-g4-l5-factory-calibration-report.mjs";

test("G4 L5 report preserves the compiler GO and product NO-GO boundary", async () => {
  const report = await buildReport();
  assert.equal(report.scope.activePageCount, 53);
  assert.equal(report.scope.currentJsPageCount, 0);
  assert.equal(report.scope.legacyFlashCourseShellExcluded, true);
  assert.equal(report.calibration.memberCount, 6);
  assert.equal(report.calibration.compiler.version, "26.2.1");
  assert.equal(report.decision.frontEndCompiler, "GO");
  assert.equal(
    report.decision.productQualification,
    "NO-GO-PENDING-PRODUCT-VERTICAL-SLICE",
  );
  assert.equal(report.decision.fullLessonScaleOut, "NO-GO");
  assert.equal(report.productQualification.completedCalibrationMembers, 0);
  assert.equal(report.productQualification.scaleOutAuthorized, false);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
});

test("G4 L5 calibration spans low through behavior-heavy structural risk", async () => {
  const report = await buildReport();
  assert.deepEqual(
    report.calibration.members.map(({animationId}) => animationId),
    [
      "course-g04-l05-rw-002",
      "course-g04-l05-vb-008",
      "course-g04-l05-in-013",
      "course-g04-l05-ti-002",
      "course-g04-l05-gs-003",
      "course-g04-l05-fq-002",
    ],
  );
  assert.equal(report.calibration.riskCounts["low-script"], 1);
  assert.equal(report.calibration.riskCounts.moderate, 2);
  assert.equal(report.calibration.riskCounts.interactive, 1);
  assert.equal(report.calibration.riskCounts["behavior-heavy"], 2);
  assert.match(renderMarkdown(report), /Current-JS remains \*\*0\/53\*\*/);
  assert.match(renderMarkdown(report), /Full 53-page scale-out: \*\*NO-GO\*\*/);
});
