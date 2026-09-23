import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  MISSING_KEYTERM_DEPENDENCIES,
  RELEASE_ID,
  RW002_ANIMATION_ID,
  SHELL_ANIMATION_ID,
  SOURCE_PINS,
  buildRuntimePreparation,
  parseArguments,
  renderRuntimePreparationMarkdown,
  validateRuntimePreparationReport,
  writeRuntimePreparation,
} from "./build-g5-l4-shell-rw002-runtime-preparation.mjs";

let builtPromise;
function buildOnce() {
  builtPromise ||= buildRuntimePreparation();
  return builtPromise;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256")
    .update(`${JSON.stringify(stable(value), null, 2)}\n`)
    .digest("hex");
}

function resignCandidate(candidate) {
  const unsigned = structuredClone(candidate);
  delete unsigned.candidateFingerprintSha256;
  return {
    ...unsigned,
    candidateFingerprintSha256: fingerprint(unsigned),
  };
}

function resignReport(report) {
  const unsigned = structuredClone(report);
  delete unsigned.reportFingerprintSha256;
  return {
    ...unsigned,
    reportFingerprintSha256: fingerprint(unsigned),
  };
}

test("G5 L4 preparation fixes the full release, source hashes, and one bound Shell→RW02 path", async () => {
  const {report} = await buildOnce();
  assert.equal(report.scope.releaseId, RELEASE_ID);
  assert.equal(
    report.scope.releaseFingerprintSha256,
    "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc",
  );
  assert.equal(report.scope.releaseMemberCount, 55);
  assert.equal(report.scope.shellAnimationId, SHELL_ANIMATION_ID);
  assert.equal(report.scope.targetAnimationId, RW002_ANIMATION_ID);
  assert.equal(report.fixedSourceIdentity.shell.sha256, SOURCE_PINS.shellSwf.sha256);
  assert.equal(
    report.fixedSourceIdentity.activeIntroduction.sha256,
    SOURCE_PINS.introductionSwf.sha256,
  );
  assert.equal(
    report.fixedSourceIdentity.targetRw002.sha256,
    SOURCE_PINS.rw002Swf.sha256,
  );
  assert.deepEqual(report.naturalPathCandidate.path, [
    "HELP_COURSES/ELMGR5/L4/index_local.swf",
    "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
    "host-event:_root.next",
    "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
  ]);
  assert.equal(report.naturalPathCandidate.directChildSwfOpenPermitted, false);
  assert.equal(report.naturalPathCandidate.directSeekPermitted, false);
  assert.equal(report.naturalPathCandidate.runtimeReachabilityEstablished, false);
});

test("G5 L4 preparation separates EN/ES and does not overstate root or nested coverage", async () => {
  const {report} = await buildOnce();
  assert.deepEqual(
    report.traceCandidates.map(({language}) => language),
    ["en", "es"],
  );
  assert.equal(
    new Set(
      report.traceCandidates.map(
        ({sessionIsolation}) => sessionIsolation.sessionSlotId,
      ),
    ).size,
    2,
  );
  assert.equal(
    report.currentCoverageBoundary.shell.declaredFrameDomains[0].lastFrame,
    50,
  );
  assert.equal(
    report.currentCoverageBoundary.shell.unresolvedReachableChildTimelineCount,
    95,
  );
  assert.equal(
    report.currentCoverageBoundary.rw002.canonicalRequirementCount,
    4,
  );
  assert.deepEqual(
    report.currentCoverageBoundary.rw002.declaredFrameDomains,
    [
      {frameDomainId: "root", firstFrame: 1, lastFrame: 10},
      {
        frameDomainId: "sprite-341",
        firstFrame: 1,
        lastFrame: 419,
        disposition: "declared-frame-domain",
        role: "main-teaching-animation-source-static-candidate",
        rootPlacementFrame: 6,
        rootPlacementInstance: "Animation",
        authoritativeRuntimeReachabilityEstablished: false,
      },
    ],
  );
  assert.deepEqual(
    report.currentCoverageBoundary.rw002.unresolvedReachableTimelineCandidates.map(
      ({timelineId, lastFrame, disposition}) => [
        timelineId,
        lastFrame,
        disposition,
      ],
    ),
    [
      ["sprite-43", 22, "unresolved"],
      ["sprite-208", 40, "unresolved"],
    ],
  );
  assert.deepEqual(
    report.currentCoverageBoundary.rw002.sourceStaticEngineeringCandidate,
    {
      frameDomainId: "sprite-341",
      firstFrame: 1,
      lastFrame: 419,
      renderedFrameCount: 419,
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      sourceControlsEnabled: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictAcceptanceEffect: "none",
    },
  );
  assert.equal(
    report.currentCoverageBoundary.canonicalCoverageFilesModified,
    false,
  );
  assert.equal(
    report.currentCoverageBoundary.rootFramesTreatedAsTotalCoverage,
    false,
  );
  for (const candidate of report.traceCandidates) {
    assert.equal(candidate.status, "blocked-source-planning-only");
    assert.equal(candidate.entryContract.launchPath, null);
    assert.equal(candidate.entryContract.launchCommand, null);
    assert.equal(candidate.entryContract.pointerCoordinates, null);
    assert.equal(candidate.entryContract.timingDelaysMs, null);
    assert.ok(
      candidate.orderedSteps.every(
        ({executed, runtimeObserved}) =>
          executed === false && runtimeObserved === false,
      ),
    );
    assert.equal(candidate.coverageBoundary.rw002CompleteCoverageClaimed, false);
    assert.equal(
      candidate.coverageBoundary.conservativeNestedRequirementAlreadyPresent,
      true,
    );
    assert.equal(
      candidate.coverageBoundary.authoritativeNestedTimelineDispositionClaimed,
      false,
    );
    const playheads = candidate.orderedSteps.find(
      ({stepId}) => stepId === "P05",
    );
    assert.equal(
      playheads.declaredSourceStaticCandidateDomain.timelineId,
      "sprite-341",
    );
    assert.equal(
      playheads.declaredSourceStaticCandidateDomain
        .authoritativeRuntimeReachabilityEstablished,
      false,
    );
    assert.deepEqual(
      playheads.unresolvedNestedCandidates.map(({timelineId}) => timelineId),
      ["sprite-43", "sprite-208"],
    );
  }
});

test("missing English and Spanish keyterm XML remain explicit blockers without substitution", async () => {
  const {report} = await buildOnce();
  assert.deepEqual(
    MISSING_KEYTERM_DEPENDENCIES.map(({declaredPath}) => declaredPath),
    [
      "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
      "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
    ],
  );
  assert.deepEqual(
    report.missingDeclaredDependencies.map(
      ({path, physicalPresence, substitutionPermitted, blocker}) => ({
        path,
        physicalPresence,
        substitutionPermitted,
        blocker,
      }),
    ),
    [
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
        physicalPresence: false,
        substitutionPermitted: false,
        blocker: true,
      },
      {
        path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
        physicalPresence: false,
        substitutionPermitted: false,
        blocker: true,
      },
    ],
  );
  assert.match(renderRuntimePreparationMarkdown(report), /must not be invented/);
});

test("runtime-preparation validator rejects fabricated readiness, nested disposition, or acceptance", async () => {
  const {report} = await buildOnce();

  const runnable = structuredClone(report);
  runnable.executionGate.runnable = true;
  assert.throws(
    () => validateRuntimePreparationReport(runnable),
    /schema or fail-closed projection drifted/,
  );

  const nestedComplete = structuredClone(report);
  nestedComplete.currentCoverageBoundary.rw002.completeCoverageClaimed = true;
  assert.throws(
    () => validateRuntimePreparationReport(nestedComplete),
    /schema or fail-closed projection drifted/,
  );

  const accepted = structuredClone(report);
  accepted.acceptanceEffects.ownerAccepted = true;
  assert.throws(
    () => validateRuntimePreparationReport(accepted),
    /schema or fail-closed projection drifted/,
  );

  const inventedTechnicalApproval = structuredClone(report);
  inventedTechnicalApproval.containmentMechanismCandidates.controls[0]
    .ownerTechnicalApprovalEstablished = true;
  assert.throws(
    () => validateRuntimePreparationReport(
      resignReport(inventedTechnicalApproval),
    ),
    /containment candidate boundary drifted/,
  );
});

test("runtime-preparation validator rejects re-signed authority, schema, source, and Markdown injection", async () => {
  const {report} = await buildOnce();

  const injectedTopLevel = structuredClone(report);
  injectedTopLevel.runtimeAuthorized = true;
  assert.throws(
    () => validateRuntimePreparationReport(resignReport(injectedTopLevel)),
    /unexpected or missing field/,
  );

  const authority = structuredClone(report);
  authority.authority = "authorized";
  assert.throws(
    () => validateRuntimePreparationReport(resignReport(authority)),
    /identity or authority drifted/,
  );

  const emptyEffects = structuredClone(report);
  emptyEffects.acceptanceEffects = {};
  assert.throws(
    () => validateRuntimePreparationReport(resignReport(emptyEffects)),
    /schema or fail-closed projection drifted/,
  );

  const sourcePath = structuredClone(report);
  sourcePath.fixedSourceIdentity.shell.lessonPath =
    "/private/operator/path|<img src=x onerror=alert(1)>";
  assert.throws(
    () => renderRuntimePreparationMarkdown(resignReport(sourcePath)),
    /schema or fail-closed projection drifted/,
  );

  const blocker = structuredClone(report);
  blocker.blockers[0].statement =
    "<img src=x onerror=alert(1)>|private reviewer identity";
  assert.throws(
    () => renderRuntimePreparationMarkdown(resignReport(blocker)),
    /schema or fail-closed projection drifted/,
  );
});

test("runtime-preparation validator rejects re-signed candidate session, launch, and authority promotion", async () => {
  const {report} = await buildOnce();

  for (const mutate of [
    (candidate) => {
      candidate.sessionIsolation.sessionId = "fabricated-session";
    },
    (candidate) => {
      candidate.sessionIsolation.disposableProfileRoot = "/private/profile";
    },
    (candidate) => {
      candidate.entryContract.commandLineLaunchPermittedByThisArtifact = true;
    },
    (candidate) => {
      candidate.executionGate.hostTreeComplete = true;
    },
    (candidate) => {
      candidate.executionGate.immutableSessionAuthorizationBound = true;
    },
    (candidate) => {
      candidate.executionGate.namedLiveOperatorAttestationBound = true;
    },
  ]) {
    const mutated = structuredClone(report);
    mutate(mutated.traceCandidates[0]);
    mutated.traceCandidates[0] = resignCandidate(mutated.traceCandidates[0]);
    assert.throws(
      () => validateRuntimePreparationReport(resignReport(mutated)),
      /candidate trace schema, identity, or fail-closed boundary drifted/,
    );
  }

  const reportAuthorization = structuredClone(report);
  reportAuthorization.executionGate.immutableSessionAuthorizationBound = true;
  assert.throws(
    () => validateRuntimePreparationReport(resignReport(reportAuthorization)),
    /schema or fail-closed projection drifted/,
  );
});

test("runtime-preparation exposes policy-approved preparation without operational approval", async () => {
  const {report} = await buildOnce();
  assert.equal(report.executionGate.machineOnlyPreparation, true);
  assert.equal(report.executionGate.failClosedDefaultPolicyApproved, true);
  assert.equal(
    report.executionGate
      .unsignedPendingOwnerSignaturePackagePreparationAuthorized,
    true,
  );
  assert.equal(report.executionGate.containmentApproved, false);
  assert.equal(report.executionGate.runtimeExecutionAuthorized, false);
  assert.equal(report.executionGate.immutableSessionAuthorizationBound, false);
  assert.deepEqual(report.containmentMechanismCandidates.summary, {
    mechanismsSelected: 8,
    candidateImplementationsPresent: 8,
    offlineOrDiagnosticVerified: 8,
    ownerTechnicalApprovals: 0,
    liveSessionVerified: 0,
    runnableArtifacts: 0,
    originalRuntimeSessionsExecuted: 0,
  });
  assert.equal(report.executionGate.machineSelectedContainmentCandidateCount, 8);
  assert.equal(report.executionGate.containmentCandidateImplementationCount, 8);
  assert.equal(
    report.executionGate.containmentOfflineOrDiagnosticVerifiedCount,
    8,
  );
  assert.equal(report.executionGate.containmentOwnerTechnicalApprovalCount, 0);
  assert.equal(report.executionGate.containmentLiveSessionVerifiedCount, 0);
  for (const candidate of report.traceCandidates) {
    assert.equal(candidate.executionGate.containmentControlsApproved, 0);
    assert.equal(candidate.executionGate.containmentControlsVerified, 0);
    assert.equal(candidate.executionGate.originalRuntimeSessionExecuted, false);
  }
});

test("fixed runtime-preparation reports are deterministic and current", async () => {
  const result = await writeRuntimePreparation({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.changed, 0);
  assert.equal(result.report.status, "blocked-source-planning-only");
  assert.equal(result.report.executionGate.runtimeSessionsExecuted, 0);
});

test("runtime-preparation CLI exposes no launch, signature, approval, capture, or promotion capability", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  for (const argument of [
    "--launch",
    "--sign",
    "--approve",
    "--capture",
    "--promote",
    "--direct-seek",
    "--change-coverage",
  ]) {
    assert.throws(() => parseArguments([argument]), /Unknown option/);
  }
});
