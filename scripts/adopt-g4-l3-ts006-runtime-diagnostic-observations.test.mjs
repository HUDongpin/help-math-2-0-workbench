import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArguments,
  validateAdoptionInputs,
  validateDiagnosticCandidateInputs,
} from "./adopt-g4-l3-ts006-runtime-diagnostic-observations.mjs";

function inputs() {
  return {
    observations: {
      schemaVersion: 1,
      evidenceType: "g4-l3-ts006-manual-runtime-diagnostic-observations",
      status: "verified-repeatable-observations-not-promotion-eligible",
      identity: {animationId: "course-g04-l03-ts-006", language: "en"},
      source: {sha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e"},
      observedRuns: [{}, {}, {}],
      repeatedSequenceFinding: {established: true},
      navigation: {ts007Observed: false},
      currentJavascriptConflict: {
        established: true,
        sourceStaticUniqueVisualCount: 1,
        sourceStaticTextConflict: "4. Check your answer.",
        hostObservedText: "4. Check your work.",
        diagnosticFullStageRmse: {acceptanceMetric: false},
      },
      authority: {runtimeAuthorityClaimed: false, promotionEligible: false, strictAcceptanceEffect: "none"},
    },
    migration: {
      animationId: "course-g04-l03-ts-006",
      status: "preserved",
      source: {swfSha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"},
      acceptance: {humanVisualReview: {decision: "pending"}, ownerReview: {decision: "pending"}},
    },
    coverage: {
      animationId: "course-g04-l03-ts-006",
      requirements: Array.from({length: 4}, () => ({status: "pending", baselineAuthority: "unresolved"})),
    },
    completionLedger: {summary: {strictComplete: 0, declaredComplete: 0}},
    releaseLedger: {
      releases: [{
        releaseId: "lesson-g04-l03-negative-numbers",
        expectedMemberCount: 40,
        strictCompleteCount: 0,
        published: false,
        gate: {open: false},
        members: [{animationId: "course-g04-l03-ts-006", strictComplete: false, status: "missing"}],
      }],
    },
  };
}

test("TS006 diagnostic adoption parser requires an observations path", () => {
  assert.deepEqual(parseArguments(["--observations", "artifacts/full-frame/g4-l3/session/observations.json", "--check"]), {
    observationsPath: "artifacts/full-frame/g4-l3/session/observations.json",
    check: true,
  });
  assert.throws(() => parseArguments([]), /observations is required/u);
  assert.throws(() => parseArguments(["--observations", "x", "--promote"]), /Unknown option/u);
});

test("TS006 diagnostic adoption preserves all acceptance and release gates", () => {
  const validated = validateAdoptionInputs(inputs());
  assert.equal(validated.release.published, false);
  assert.equal(validated.member.status, "missing");
});

test("TS006 diagnostic adoption rejects authority or ledger promotion", () => {
  const promotedObservation = inputs();
  promotedObservation.observations.authority.promotionEligible = true;
  assert.throws(() => validateAdoptionInputs(promotedObservation), /authority boundary was promoted/u);
  const publishedRelease = inputs();
  publishedRelease.releaseLedger.releases[0].published = true;
  assert.throws(() => validateAdoptionInputs(publishedRelease), /atomic release boundary drifted/u);
});

test("TS006 diagnostic candidate adoption remains acceptance-neutral", () => {
  const candidate = {
    assets: {
      animationId: "course-g04-l03-ts-006",
      classification: "ffdec-structural-assets-for-diagnostic-engineering-candidate",
      assets: [
        {role: "embedded-bauhaus-font-subset"},
        {role: "page-title-companion"},
        {role: "source-static-four-step-plan-table"},
        {role: "lesson-shell-rewind-up"},
        {role: "lesson-shell-forward-up"},
        {role: "lesson-shell-key-terms-up"},
        {role: "lesson-shell-map-up"},
        {role: "lesson-shell-calculator-up"},
      ],
      authority: {originalRuntimeBaseline: false, sourceFrameMappingEstablished: false},
      strictAcceptanceEffect: "none",
    },
    capture: {
      status: "complete",
      animationId: "course-g04-l03-ts-006",
      frameDomainId: "sprite-23",
      scenario: "manual-runtime-diagnostic-observation",
      language: "en",
      captured: Array.from({length: 10}, () => ({})),
      consoleErrors: [],
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: [],
    },
    comparison: {
      animationId: "course-g04-l03-ts-006",
      classification: "diagnostic-engineering-comparison-not-strict-evidence",
      authority: {runtimeAuthorityClaimed: false, visualParityClaimed: false},
      summary: {comparedFrames: 10, staticThresholdPasses: 0, transitionThresholdPasses: 0},
      strictAcceptanceEffect: "none",
    },
    spanishAudio: {
      animationId: "course-g04-l03-ts-006",
      reportType: "g4-l3-ts006-spanish-audio-diagnostic",
      classification: "current-admin-account-runtime-audio-failure-diagnostic-not-strict-evidence",
      authority: {runtimeAuthorityClaimed: false, audioParityClaimed: false},
      runtimeControl: {advancedToPauseVisualState: true},
      conclusion: {
        capturedAudioDigitalSilence: true,
        sourceMp3NonSilent: true,
        runtimeAudioEmissionEstablished: false,
        audioAcceptance: false,
      },
      strictAcceptanceEffect: "none",
    },
  };
  assert.equal(validateDiagnosticCandidateInputs(candidate), true);
  candidate.comparison.authority.visualParityClaimed = true;
  assert.throws(() => validateDiagnosticCandidateInputs(candidate),
    /comparison was promoted or drifted/u);
  candidate.comparison.authority.visualParityClaimed = false;
  candidate.spanishAudio.conclusion.audioAcceptance = true;
  assert.throws(() => validateDiagnosticCandidateInputs(candidate),
    /Spanish-audio failure diagnostic was promoted or drifted/u);
});
