import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  collectCurrentPackageEvidence,
  sha256,
  validateFqSuccessorReceipt,
  validateFreshPackageSmoke,
  validateWholeLessonSuccessorReceipt,
} from "./lib/g5-l4-current-js-qa-successor.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const V2_SMOKE_PATH =
  "reports/g5-l4-whole-lesson-package-mvp-v2-smoke.json";

function acceptanceEffects() {
  return {
    productQaComplete: false,
    authoritativeOriginalRuntime: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    published: false,
  };
}

function common(kind) {
  return {
    schemaVersion: 2,
    receiptId: `g5-l4-current-js-${kind}-qa-successor-2026-08-01`,
    releaseId: "lesson-g05-l04-number-lines",
    evidenceAssembledOn: "2026-08-01",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    packageEvidence: {
      freshArchiveExtraction: true,
      strictAcceptanceEffect: "none",
    },
    predecessorEvidence: {
      currentAuthority: false,
      claimsCarriedForward: false,
    },
    sourceBindings: [],
    artifacts: [],
    acceptanceEffects: acceptanceEffects(),
  };
}

function fqFixture() {
  return {
    ...common("fq23-companion"),
    evidenceType:
      "g5-l4-current-js-fq23-companion-fresh-package-qa-successor-receipt",
    scope: {
      ...common("fq23-companion").scope,
      members: ["course-g05-l04-fq-002", "course-g05-l04-fq-003"],
    },
    freshBrowserObservations: {
      fqFlows: [
        {
          animationId: "course-g05-l04-fq-002",
          answerSelectionAndSubmit: true,
          replayResetToQuestionOne: true,
        },
        {
          animationId: "course-g05-l04-fq-003",
          answerSelectionAndSubmit: true,
          replayResetToQuestionOne: true,
        },
      ],
    },
    scopeResult: {
      currentJavascriptFq23FreshPackageQaPassed: true,
      fullScoreAndReviewFlowFreshlyReperformed: false,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
    },
    focusedTests: [
      {passed: 10, failed: 0},
      {passed: 2, failed: 0},
    ],
  };
}

function wholeFixture() {
  return {
    ...common("whole-lesson-product"),
    evidenceType:
      "g5-l4-current-js-whole-lesson-fresh-package-qa-successor-receipt",
    scope: {
      ...common("whole-lesson-product").scope,
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
    },
    freshBrowserObservations: {
      englishPagesReady: 54,
      spanishPagesReady: 54,
      glossaryCounts: {englishIndex: 761, spanishIndex: 753},
      spanishMobile: {horizontalOverflow: false},
    },
    scopeResult: {
      currentJavascriptFreshPackageWholeLessonQaPassed: true,
      exactReleaseOrderFreshlyEstablished: false,
      courseMapInteractionFreshlyReperformed: false,
      keyTermsEscapeFocusFreshlyReperformed: false,
      productQaComplete: false,
    },
    childReceipts: [{}],
  };
}

test("the dated v2 smoke remains valid only as bounded current-JS smoke evidence", async () => {
  const smoke = JSON.parse(
    await readFile(path.resolve(ROOT, V2_SMOKE_PATH), "utf8"),
  );
  assert.equal(validateFreshPackageSmoke(smoke), true);
  for (const mutate of [
    (candidate) => { candidate.authority.strictComplete = true; },
    (candidate) => { candidate.fqFlows[0].replayResetToQuestionOne = false; },
    (candidate) => { candidate.externalRequests.push("https://example.test"); },
    (candidate) => { candidate.status = "strict-complete"; },
  ]) {
    const forged = structuredClone(smoke);
    mutate(forged);
    assert.throws(() => validateFreshPackageSmoke(forged));
  }
});

test("the stale v2 package cannot be promoted into a current successor", async () => {
  await assert.rejects(
    collectCurrentPackageEvidence({root: ROOT, smokePath: V2_SMOKE_PATH}),
    /current builder|snapshot .* stale|manifest .* invalid/i,
  );
});

test("successor receipt validators reject predecessor carry-forward and gate promotion", () => {
  assert.equal(validateFqSuccessorReceipt(fqFixture()), true);
  assert.equal(validateWholeLessonSuccessorReceipt(wholeFixture()), true);
  for (const [fixture, validate] of [
    [fqFixture, validateFqSuccessorReceipt],
    [wholeFixture, validateWholeLessonSuccessorReceipt],
  ]) {
    for (const mutate of [
      (candidate) => { candidate.predecessorEvidence.claimsCarriedForward = true; },
      (candidate) => { candidate.predecessorEvidence.currentAuthority = true; },
      (candidate) => { candidate.acceptanceEffects.strictComplete = true; },
      (candidate) => { candidate.acceptanceEffects.ownerFidelityAccepted = true; },
      (candidate) => { candidate.acceptanceEffects.published = true; },
      (candidate) => { candidate.scope.externalDeploymentPerformed = true; },
    ]) {
      const forged = fixture();
      mutate(forged);
      assert.throws(() => validate(forged));
    }
  }
});

test("the 2026-07-30 predecessor receipt bytes remain immutable", async () => {
  const expected = new Map([
    [
      "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.json",
      "2ef9d73990b08be46317849f13ebe38aae0cac6540b938c11bd6e4a8d10a8d7c",
    ],
    [
      "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.md",
      "b499a6b3130211bea5a0be101d112480471bbb79bca5fe3b2053c4ed9453d02c",
    ],
    [
      "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.json",
      "c797014b57c6270d701272d79aacb9f754d158544f35fd0049c2ce2901941968",
    ],
    [
      "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.md",
      "30d67fddbe64bf7c59a621534da44637f4dccb4e9326e9a4ae31a3fdff5e3bec",
    ],
  ]);
  for (const [relativePath, expectedSha256] of expected) {
    assert.equal(
      sha256(await readFile(path.resolve(ROOT, relativePath))),
      expectedSha256,
      relativePath,
    );
  }
});
