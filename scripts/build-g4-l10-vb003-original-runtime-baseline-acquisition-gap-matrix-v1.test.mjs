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
  buildMatrix,
  checkMatrix,
  parseArguments,
  publishMatrixNoClobber,
} from "./build-g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.mjs";

test("CLI is gap-report-only and rejects launch, formalization, and mutation", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--launch", "--apply", "--recover", "--write",
    "--create-trace-specs", "--create-kits", "--adopt-baseline",
    "--implement-helper", "--execute-helper", "--install", "--promote"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("matrix proves two root kits are not a complete VB003 baseline", async () => {
  const {document} = await buildMatrix(PROJECT_ROOT);
  assert.equal(document.status,
    "ROOT_VISUAL_KITS_CURRENT_NATURAL_TRACE_AUDIO_INTERACTION_ACQUISITIONS_ABSENT");
  assert.equal(document.decision,
    "DO_NOT_TREAT_TWO_ROOT_KITS_AS_COMPLETE_VB003_BASELINE_DO_NOT_LAUNCH");
  assert.deepEqual(document.scope, {
    releaseId: "lesson-g04-l10-perimeter-area",
    animationId: "course-g04-l10-vb-003",
    sourceSwfSha256:
      "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
    languages: ["en", "es"],
    currentRootVisualKitCount: 2,
    currentNaturalTraceKitCount: 0,
    sourceStaticObligationAtomSet: {
      count: 10,
      sha256: "19c1b88dc34b6623de13964d145a3238f5ad5ff0264bff1d8b730338812595b3",
      encoding:
        "sorted-id-tab-class-tab-language-tab-sourceIdentity-tab-controlIdentity-tab-evidenceMode-newline-v1",
    },
    candidateNaturalTraceFamilyCount: 2,
    formalNaturalTraceRequirementCount: 0,
    authoritativeBaselineRequirementCount: 0,
  });
  assert.equal(document.rootKitCoverageBoundary.provesCompleteVb003Baseline,
    false);
});

test("root kits cover only exhaustive root visual positioning", async () => {
  const {document} = await buildMatrix(PROJECT_ROOT);
  assert.deepEqual(document.currentRootVisualKits.map((kit) => ({
    requirementId: kit.requirementId,
    language: kit.language,
    frameDomainId: kit.frameDomainId,
    frameCount: kit.frameCount,
    proofModes: kit.acceptedProofModes,
    actualEvidenceCount: kit.actualEvidenceCount,
    complete: kit.authoritativeBaselineComplete,
    natural: kit.naturalTraceAudioOrInteractionCovered,
  })), [
    {
      requirementId: "req-default-root-en",
      language: "en",
      frameDomainId: "root",
      frameCount: 10,
      proofModes: ["direct-seek-root-exhaustive",
        "sequential-step-root-exhaustive"],
      actualEvidenceCount: 0,
      complete: false,
      natural: false,
    },
    {
      requirementId: "req-default-root-es",
      language: "es",
      frameDomainId: "root",
      frameCount: 10,
      proofModes: ["direct-seek-root-exhaustive",
        "sequential-step-root-exhaustive"],
      actualEvidenceCount: 0,
      complete: false,
      natural: false,
    },
  ]);
  assert.deepEqual(document.rootKitCoverageBoundary, {
    preparedRequirementIds: ["req-default-root-en", "req-default-root-es"],
    preparedLanguages: ["en", "es"],
    proofModesLimitedToRootVisualFramePositioning: true,
    totalExpectedRootFramesPerCompleteRun: 20,
    actualCapturedRootFrames: 0,
    coversNestedSprite120NaturalPlayback: false,
    coversHostAudioControlCausality: false,
    coversSpokenLanguage: false,
    coversAudioSynchronization: false,
    coversThreeInteractionStops: false,
    coversReplayReset: false,
    coversNamedHumanListening: false,
    provesCompleteVb003Baseline: false,
  });
});

test("ten exact source-static obligation atoms retain natural-trace boundaries", async () => {
  const {document} = await buildMatrix(PROJECT_ROOT);
  assert.deepEqual(document.sourceStaticObligationAtoms.map(({id}) => id), [
    "both:interaction:10:Unit of measurement",
    "both:interaction:11:Quantity",
    "both:interaction:15:Length",
    "en:cue:course-g04-l10-vb-003:embedded-stream-0001",
    "en:replay-reset",
    "es:cue:course-g04-l10-vb-003:catalog-audio-01",
    "es:cue:course-g04-l10-vb-003:embedded-stream-0001",
    "es:host-control:219:_root.doStopSpanishAudio",
    "es:host-control:225:_root.doPlaySpanishAudio",
    "es:replay-reset",
  ]);
  const byClass = Object.fromEntries(Object.entries(
    document.sourceStaticObligationAtoms.reduce((counts, {obligationClass}) => {
      counts[obligationClass] = (counts[obligationClass] ?? 0) + 1;
      return counts;
    }, {})).sort());
  assert.deepEqual(byClass, {
    "host-audio-control-natural-trace": 2,
    "language-cue-natural-runtime-listening": 3,
    "language-replay-reset-natural-trace": 2,
    "nested-interaction-stream-synchronization-natural-trace": 3,
  });
  assert.ok(document.sourceStaticObligationAtoms.every(({accepted}) =>
    accepted === false));
});

test("two language trace families remain candidates, not formal requirements", async () => {
  const {document} = await buildMatrix(PROJECT_ROOT);
  assert.deepEqual(document.candidateNaturalTraceFamilies.map((family) => ({
    id: family.id,
    language: family.language,
    candidateOnly: family.candidateOnly,
    formalRequirementCreated: family.formalRequirementCreated,
    entryStateEstablished: family.entryStateEstablishedByAuthorizedRuntime,
    orderedStepsEstablished: family.orderedStepsEstablished,
    observationCount: family.requiredObservationClasses.length,
  })), [
    {
      id: "candidate-vb003-en-natural-trace-family",
      language: "en",
      candidateOnly: true,
      formalRequirementCreated: false,
      entryStateEstablished: false,
      orderedStepsEstablished: false,
      observationCount: 5,
    },
    {
      id: "candidate-vb003-es-natural-trace-family",
      language: "es",
      candidateOnly: true,
      formalRequirementCreated: false,
      entryStateEstablished: false,
      orderedStepsEstablished: false,
      observationCount: 7,
    },
  ]);
  assert.deepEqual(document.naturalTraceSpecificationBoundary, {
    candidateFamiliesAreNotFormalRequirements: true,
    exactAdditionalKitCount: null,
    exactAdditionalSessionCount: null,
    reasonCountsRemainUnknown:
      "Authorized runtime entry, exact ordered natural actions, branch/reset scheduling, and permissible session partitioning are not established.",
    nestedTraceScheduleStatus: "unresolved",
    orderedNaturalTraceStepsCreated: 0,
    coverageRequirementsCreated: 0,
    traceSpecsCreated: 0,
    captureKitsCreated: 0,
    migrationFilesModified: false,
    staticSpecificationApplied: false,
    reviewVerdictPresent: false,
  });
});

test("baseline, launch, listening, acceptance, and authority remain zero", async () => {
  const {document} = await buildMatrix(PROJECT_ROOT);
  assert.deepEqual(document.baselineCompleteness, {
    rootVisualRequirementsPrepared: 2,
    naturalTraceRequirementsPrepared: 0,
    authoritativeRequirementsComplete: 0,
    authoritativeFramesCaptured: 0,
    authorizedRuntimeSessions: 0,
    namedHumanListeningSessions: 0,
    spokenLanguageEstablishedCueCount: 0,
    runtimeReachabilityEstablishedCueCount: 0,
    synchronizedCueCount: 0,
    acceptedCueCount: 0,
    vb003BaselineComplete: false,
  });
  assert.deepEqual(document.currentGateBoundary, {
    latestSecurityBatchStatus:
      "FAILED_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY",
    latestSecurityBatchReusable: false,
    peterHuOperatorActivated: false,
    launchAuthorizedNow: false,
    currentLaunchReceiptCount: 0,
    productionHelperImplemented: false,
    originalRuntimeLaunched: false,
    audioPlayedByThisReport: false,
  });
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
  assert.equal(document.implementationBoundary.reportPublicationOnly, true);
  for (const [key, value] of Object.entries(document.implementationBoundary)) {
    if (key !== "reportPublicationOnly") assert.equal(value, false, key);
  }
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildMatrix(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-baseline-gap-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishMatrixNoClobber(bundle,
    {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.rootVisualKits, 2);
  assert.equal(result.obligationAtoms, 10);
  assert.equal(result.candidateNaturalTraceFamilies, 2);
  assert.equal(result.formalNaturalTraceRequirements, 0);
  assert.equal(result.authoritativeBaselineRequirements, 0);
  await assert.rejects(() => publishMatrixNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkMatrix(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no gap matrix", async () => {
  const bundle = await buildMatrix(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-baseline-gap-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishMatrixNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated report stop"); },
  }), /simulated report stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
