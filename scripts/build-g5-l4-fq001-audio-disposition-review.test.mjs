import assert from "node:assert/strict";
import {access, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG5L4Fq001AudioDispositionReview,
  checkG5L4Fq001AudioDispositionReview,
  validateG5L4Fq001AudioDispositionReview,
} from "./build-g5-l4-fq001-audio-disposition-review.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPORT_PATH = path.join(
  PROJECT_ROOT,
  "reports/g5-l4-fq001-audio-disposition-review-v1.json",
);
const SOURCE_SWF = path.join(
  PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ01.swf",
);

test("checked-in FQ001 disposition binds machine-negative evidence without accepting it", async () => {
  const report = await checkG5L4Fq001AudioDispositionReview({
    projectRoot: PROJECT_ROOT,
  });
  assert.equal(report.pageOrdinal, 52);
  assert.equal(report.machineFindings.actionScriptCount, 24);
  assert.equal(report.machineFindings.lessonGroupCandidateCount, 83);
  assert.deepEqual(report.machineFindings.sourceControlOwnerAnimationIds, [
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
  ]);
  assert.equal(report.recommendation.decision, "accepted-not-required-candidate");
  assert.equal(report.recommendation.applied, false);
  assert.equal(report.privateSourceRecheck.availableAtGeneration, true);
  assert.equal(report.privateSourceRecheck.verifiedAtGeneration, true);
  assert.equal(report.productDisposition.audioAvailable, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("sourceful FQ001 rebuild rehashes private custody when mounted", async (t) => {
  try {
    await access(SOURCE_SWF);
  } catch {
    t.diagnostic("private FQ001 source custody is absent; tracked evidence remains checked");
    return;
  }
  const report = await buildG5L4Fq001AudioDispositionReview({
    projectRoot: PROJECT_ROOT,
  });
  assert.equal(report.privateSourceRecheck.availableAtGeneration, true);
  assert.equal(report.privateSourceRecheck.verifiedAtGeneration, true);
});

test("FQ001 disposition validator rejects fabricated authority and product audio", async () => {
  const report = JSON.parse(await readFile(REPORT_PATH, "utf8"));
  for (const mutate of [
    (candidate) => {
      candidate.acceptanceEffects.audioNotRequiredAccepted = true;
    },
    (candidate) => {
      candidate.unresolvedAuthority.ownerDecision = "accepted";
    },
    (candidate) => {
      candidate.productDisposition.audioAvailable = true;
    },
    (candidate) => {
      candidate.recommendation.applied = true;
    },
  ]) {
    const candidate = structuredClone(report);
    mutate(candidate);
    assert.throws(
      () => validateG5L4Fq001AudioDispositionReview(candidate),
      /authority|fabricated|enabled|acceptance gate/,
    );
  }
});
