#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const SOURCE_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const MIGRATION_PATH = "migrations/course-g04-l03-ts-006/migration.json";
const COVERAGE_PATH = "migrations/course-g04-l03-ts-006/evidence/full-frame-coverage.json";
const COMPLETION_LEDGER_PATH = "catalog/completion-ledger.json";
const RELEASE_LEDGER_PATH = "catalog/lesson-release-ledger.json";
const DIAGNOSTIC_ASSET_MANIFEST_PATH = "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/manifest.json";
const DIAGNOSTIC_CAPTURE_MANIFEST_PATH = "output/playwright/g4-l3-ts006-diagnostic-composite-v5/en-natural-entry-diagnostic/capture-manifest.json";
const DIAGNOSTIC_COMPARISON_PATH = "reports/g4-l3-ts006-diagnostic-composite-comparison-v5.json";
const DIAGNOSTIC_SPANISH_AUDIO_PATH = "reports/g4-l3-ts006-spanish-audio-diagnostic.json";
const OUTPUT_JSON_PATH = "migrations/course-g04-l03-ts-006/evidence/manual-runtime-diagnostic-observation-adoption.json";
const OUTPUT_MD_PATH = "reports/g4-l3-ts006-manual-runtime-diagnostic-observation-adoption.md";
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readRegular(relativePath, label) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(filePath);
  return {relativePath, filePath, bytes, size: bytes.length, sha256: sha256(bytes)};
}

function binding(artifact) {
  return {file: artifact.relativePath, bytes: artifact.size, sha256: artifact.sha256};
}

export function validateAdoptionInputs({observations, migration, coverage, completionLedger, releaseLedger}) {
  invariant(observations.schemaVersion === 1
    && observations.evidenceType === "g4-l3-ts006-manual-runtime-diagnostic-observations"
    && observations.status === "verified-repeatable-observations-not-promotion-eligible"
    && observations.identity?.animationId === ANIMATION_ID
    && observations.identity?.language === "en"
    && observations.source?.sha256 === SOURCE_SHA256,
  "TS006 diagnostic observations identity or source drifted");
  invariant(observations.observedRuns?.length === 3
    && observations.repeatedSequenceFinding?.established === true
    && observations.navigation?.ts007Observed === false,
  "TS006 repeated sequence or navigation observations drifted");
  invariant(observations.currentJavascriptConflict?.established === true
    && observations.currentJavascriptConflict?.sourceStaticUniqueVisualCount === 1
    && observations.currentJavascriptConflict?.sourceStaticTextConflict === "4. Check your answer."
    && observations.currentJavascriptConflict?.hostObservedText === "4. Check your work."
    && observations.currentJavascriptConflict?.diagnosticFullStageRmse?.acceptanceMetric === false,
  "TS006 current-JavaScript diagnostic conflict drifted");
  invariant(observations.authority?.runtimeAuthorityClaimed === false
    && observations.authority?.promotionEligible === false
    && observations.authority?.strictAcceptanceEffect === "none",
  "TS006 diagnostic observation authority boundary was promoted");
  invariant(migration.animationId === ANIMATION_ID
    && migration.status === "preserved"
    && migration.source?.swfSha256 === "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"
    && migration.acceptance?.humanVisualReview?.decision === "pending"
    && migration.acceptance?.ownerReview?.decision === "pending",
  "TS006 migration acceptance state drifted");
  invariant(coverage.animationId === ANIMATION_ID
    && coverage.requirements?.length === 4
    && coverage.requirements.every(({status}) => status === "pending")
    && coverage.requirements.every(({baselineAuthority}) => baselineAuthority === "unresolved"),
  "TS006 strict coverage was promoted or changed unexpectedly");
  invariant(completionLedger.summary?.strictComplete === 0
    && completionLedger.summary?.declaredComplete === 0,
  "completion ledger is no longer the expected zero-complete baseline");
  const release = releaseLedger.releases?.find(({releaseId}) => releaseId === RELEASE_ID);
  const member = release?.members?.find(({animationId}) => animationId === ANIMATION_ID);
  invariant(release?.expectedMemberCount === 40
    && release.strictCompleteCount === 0
    && release.published === false
    && release.gate?.open === false
    && member?.strictComplete === false
    && member?.status === "missing",
  "G4 L3 atomic release boundary drifted");
  return {release, member};
}

export function validateDiagnosticCandidateInputs({assets, capture, comparison, spanishAudio}) {
  invariant(assets?.animationId === ANIMATION_ID
    && assets.classification === "ffdec-structural-assets-for-diagnostic-engineering-candidate"
    && assets.assets?.length === 8
    && assets.assets.some(({role}) => role === "embedded-bauhaus-font-subset")
    && assets.assets.filter(({role}) => role?.startsWith("lesson-shell-")).length === 5
    && assets.authority?.originalRuntimeBaseline === false
    && assets.authority?.sourceFrameMappingEstablished === false
    && assets.strictAcceptanceEffect === "none",
  "TS006 diagnostic-composite asset authority drifted");
  invariant(capture?.status === "complete"
    && capture.animationId === ANIMATION_ID
    && capture.frameDomainId === "sprite-23"
    && capture.scenario === "manual-runtime-diagnostic-observation"
    && capture.language === "en"
    && capture.captured?.length === 10
    && (capture.consoleErrors ?? []).length === 0
    && (capture.failedRequests ?? []).length === 0
    && (capture.httpErrors ?? []).length === 0
    && (capture.unexpectedRequests ?? []).length === 0,
  "TS006 diagnostic-composite implementation capture is incomplete or unclean");
  invariant(comparison?.animationId === ANIMATION_ID
    && comparison.classification === "diagnostic-engineering-comparison-not-strict-evidence"
    && comparison.authority?.runtimeAuthorityClaimed === false
    && comparison.authority?.visualParityClaimed === false
    && comparison.summary?.comparedFrames === 10
    && comparison.summary?.staticThresholdPasses === 0
    && comparison.summary?.transitionThresholdPasses === 0
    && comparison.strictAcceptanceEffect === "none",
  "TS006 diagnostic-composite comparison was promoted or drifted");
  invariant(spanishAudio?.animationId === ANIMATION_ID
    && spanishAudio.reportType === "g4-l3-ts006-spanish-audio-diagnostic"
    && spanishAudio.classification === "current-admin-account-runtime-audio-failure-diagnostic-not-strict-evidence"
    && spanishAudio.authority?.runtimeAuthorityClaimed === false
    && spanishAudio.authority?.audioParityClaimed === false
    && spanishAudio.runtimeControl?.advancedToPauseVisualState === true
    && spanishAudio.conclusion?.capturedAudioDigitalSilence === true
    && spanishAudio.conclusion?.sourceMp3NonSilent === true
    && spanishAudio.conclusion?.runtimeAudioEmissionEstablished === false
    && spanishAudio.conclusion?.audioAcceptance === false
    && spanishAudio.strictAcceptanceEffect === "none",
  "TS006 Spanish-audio failure diagnostic was promoted or drifted");
  return true;
}

function phaseSummary(run) {
  const phase = run.phases;
  return {
    runId: run.id,
    kind: run.kind,
    baseCaptureOrdinal: run.base.captureFrameOrdinal,
    checkYourWork: {
      firstVisible: phase.checkYourWork.firstVisible.captureFrameOrdinal,
      fullyVisible: phase.checkYourWork.fullyVisible.captureFrameOrdinal,
    },
    strategiesHeading: {
      firstVisible: phase.strategiesHeading.firstVisible.captureFrameOrdinal,
      fullyVisible: phase.strategiesHeading.fullyVisible.captureFrameOrdinal,
    },
    strategyList: {
      firstVisible: phase.strategyList.firstVisible.captureFrameOrdinal,
      fullyVisible: phase.strategyList.fullyVisible.captureFrameOrdinal,
    },
    showYourWorkPulse: {
      firstVisible: phase.showYourWorkPulse.firstVisible.captureFrameOrdinal,
      firstPulseVariantA: phase.showYourWorkPulse.firstPulseVariantA.captureFrameOrdinal,
      firstPulseVariantB: phase.showYourWorkPulse.firstPulseVariantB.captureFrameOrdinal,
    },
  };
}

function renderMarkdown(report) {
  return `# G4 L3 TS006 manual-runtime diagnostic observation adoption\n\n`
    + `Status: **engineering observations adopted; strict acceptance unchanged at 0/40**.\n\n`
    + `The verified manual diagnostic records three repeated English TS006 reveal runs: initial TS005→TS006 navigation, host Replay, and Previous-to-TS005/Next-to-TS006 re-entry. Replay visibly resets the page before the same ordered reveal resumes. No TS007 frame is present in this capture.\n\n`
    + `The frozen current-JavaScript candidate is materially inconsistent with the host runtime: it renders one identical visual across 128 frames, says \`4. Check your answer.\`, omits the staged instructional content, and omits the native Lesson Shell composition. It remains preserved as structural evidence, not accepted behavior.\n\n`
    + `A separate host-composited JavaScript engineering candidate now reproduces the observed English reveal phases and uses hash-bound FFDec title, table, embedded-font-subset, and Lesson Shell button assets. Its clean ten-keyframe diagnostic comparison improves mean normalized RMSE to ${report.engineeringFindings.diagnosticComposite.normalizedRmse.mean.toFixed(6)}, but 0/${report.engineeringFindings.diagnosticComposite.comparedFrames} informational thresholds pass. Remaining differences include unresolved runtime-only shell composition, Flash-versus-browser rasterization, and exact dynamic-text layout.\n\n`
    + `A 90-second lossless Spanish-audio diagnostic recorded 1,069 complete 800×600 frames. The legacy control reached its pause-icon state, but the ALAC session track remained digital silence while the bound L3TS06.mp3 source is non-silent. This is adopted as failure evidence only: runtime audio emission and audio acceptance remain false.\n\n`
    + `This adoption does not create an authoritative baseline or change coverage, completion, or publication. Exact SWF-frame mapping, a contained disposable-profile run, Spanish, audio cue attribution/listening review, frame-aligned RMSE, independent review, and Owner acceptance remain pending.\n\n`
    + `- Observation manifest SHA-256: \`${report.inputs.runtimeObservations.sha256}\`\n`
    + `- Diagnostic full-stage RMSE versus frozen candidate: base ${report.engineeringFindings.diagnosticRmse.base}; terminal ${report.engineeringFindings.diagnosticRmse.terminal} (identity-mismatch diagnostics only)\n`
    + `- Diagnostic-composite v5 RMSE: min ${report.engineeringFindings.diagnosticComposite.normalizedRmse.min.toFixed(6)}, mean ${report.engineeringFindings.diagnosticComposite.normalizedRmse.mean.toFixed(6)}, max ${report.engineeringFindings.diagnosticComposite.normalizedRmse.max.toFixed(6)} (not strict evidence)\n`
    + `- Spanish-audio diagnostic: control pause state observed; captured audio digital silence; source MP3 non-silent; acceptance false\n`
    + `- TS006 coverage: ${report.unchangedAcceptance.ts006PendingRequirements}/4 pending\n`
    + `- Lesson release: ${report.unchangedAcceptance.strictCompleteCount}/40 strict, unpublished\n`;
}

export async function adoptDiagnostic({observationsPath, write = true} = {}) {
  invariant(typeof observationsPath === "string" && observationsPath.startsWith("artifacts/full-frame/g4-l3/")
    && !observationsPath.includes(".."),
  "--observations must be a relative path below artifacts/full-frame/g4-l3");
  const [observationsArtifact, migrationArtifact, coverageArtifact, completionArtifact, releaseArtifact, assetArtifact, captureArtifact, comparisonArtifact, spanishAudioArtifact, generatorArtifact] = await Promise.all([
    readRegular(observationsPath, "TS006 runtime observations"),
    readRegular(MIGRATION_PATH, "TS006 migration manifest"),
    readRegular(COVERAGE_PATH, "TS006 coverage"),
    readRegular(COMPLETION_LEDGER_PATH, "completion ledger"),
    readRegular(RELEASE_LEDGER_PATH, "lesson release ledger"),
    readRegular(DIAGNOSTIC_ASSET_MANIFEST_PATH, "TS006 diagnostic-composite asset manifest"),
    readRegular(DIAGNOSTIC_CAPTURE_MANIFEST_PATH, "TS006 diagnostic-composite capture manifest"),
    readRegular(DIAGNOSTIC_COMPARISON_PATH, "TS006 diagnostic-composite comparison"),
    readRegular(DIAGNOSTIC_SPANISH_AUDIO_PATH, "TS006 Spanish-audio failure diagnostic"),
    readRegular(path.relative(PROJECT_ROOT, SCRIPT_PATH), "adoption generator"),
  ]);
  const observations = JSON.parse(observationsArtifact.bytes);
  const migration = JSON.parse(migrationArtifact.bytes);
  const coverage = JSON.parse(coverageArtifact.bytes);
  const completionLedger = JSON.parse(completionArtifact.bytes);
  const releaseLedger = JSON.parse(releaseArtifact.bytes);
  const assets = JSON.parse(assetArtifact.bytes);
  const capture = JSON.parse(captureArtifact.bytes);
  const comparison = JSON.parse(comparisonArtifact.bytes);
  const spanishAudio = JSON.parse(spanishAudioArtifact.bytes);
  const {release} = validateAdoptionInputs({observations, migration, coverage, completionLedger, releaseLedger});
  validateDiagnosticCandidateInputs({assets, capture, comparison, spanishAudio});
  const report = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-manual-runtime-diagnostic-observation-adoption",
    status: "engineering-observations-adopted-no-promotion",
    scope: {animationId: ANIMATION_ID, releaseId: RELEASE_ID, language: "en"},
    inputs: {
      runtimeObservations: binding(observationsArtifact),
      migration: binding(migrationArtifact),
      fullFrameCoverage: binding(coverageArtifact),
      completionLedger: binding(completionArtifact),
      lessonReleaseLedger: binding(releaseArtifact),
      diagnosticCompositeAssets: binding(assetArtifact),
      diagnosticCompositeCapture: binding(captureArtifact),
      diagnosticCompositeComparison: binding(comparisonArtifact),
      spanishAudioFailureDiagnostic: binding(spanishAudioArtifact),
      generator: binding(generatorArtifact),
    },
    adoptedEngineeringObservations: {
      sourceSha256: observations.source.sha256,
      runs: observations.observedRuns.map(phaseSummary),
      replayVisibleResetEstablishedInDiagnostic: true,
      previousToTs005EstablishedInDiagnostic: true,
      nextFromTs005ToTs006EstablishedInDiagnostic: true,
      ts007Observed: false,
      exactEnglishContent: observations.content,
    },
    engineeringFindings: {
      currentJavascriptConflictEstablished: true,
      currentJavascriptSourceStaticUniqueVisualCount: observations.currentJavascriptConflict.sourceStaticUniqueVisualCount,
      sourceStaticText: observations.currentJavascriptConflict.sourceStaticTextConflict,
      hostObservedText: observations.currentJavascriptConflict.hostObservedText,
      diagnosticRmse: {
        base: observations.currentJavascriptConflict.diagnosticFullStageRmse.base,
        terminal: observations.currentJavascriptConflict.diagnosticFullStageRmse.terminal,
        acceptanceMetric: false,
      },
      implementationDirection: observations.currentJavascriptConflict.disposition,
      diagnosticComposite: {
        status: "english-host-composited-engineering-candidate-not-strict",
        comparedFrames: comparison.summary.comparedFrames,
        browserCaptureClean: comparison.summary.browserCaptureClean,
        normalizedRmse: comparison.summary.normalizedRmse,
        staticThresholdPasses: comparison.summary.staticThresholdPasses,
        transitionThresholdPasses: comparison.summary.transitionThresholdPasses,
        sourceStaticAssetCount: assets.assets.length,
        originalRuntimeAuthorityClaimed: false,
        sourceFrameMappingEstablished: false,
        visualParityClaimed: false,
        strictAcceptanceEffect: "none",
      },
      spanishAudioDiagnostic: {
        status: "runtime-control-state-observed-audio-emission-not-established",
        frameCount: spanishAudio.capture.frameCount,
        capturedAudioDurationSeconds: spanishAudio.capture.audio.durationSeconds,
        controlAdvancedToPauseVisualState: spanishAudio.runtimeControl.advancedToPauseVisualState,
        capturedAudioDigitalSilence: spanishAudio.conclusion.capturedAudioDigitalSilence,
        sourceMp3NonSilent: spanishAudio.conclusion.sourceMp3NonSilent,
        runtimeAudioEmissionEstablished: spanishAudio.conclusion.runtimeAudioEmissionEstablished,
        audioAcceptance: spanishAudio.conclusion.audioAcceptance,
        pathWhitespaceSupportedAsCause: false,
        trustedLocalSandboxCauseEstablished: false,
        strictAcceptanceEffect: "none",
      },
    },
    unchangedAcceptance: {
      ts006PendingRequirements: coverage.requirements.filter(({status}) => status === "pending").length,
      authoritativeBaselineEstablished: false,
      exactSourceFrameMappingEstablished: false,
      audioAccepted: false,
      spanishAccepted: false,
      independentHumanReviewAccepted: false,
      ownerAccepted: false,
      strictCompleteCount: release.strictCompleteCount,
      expectedReleaseMemberCount: release.expectedMemberCount,
      published: release.published,
      strictAcceptanceEffect: "none",
      completionLedgerEffect: "none",
      lessonReleaseLedgerEffect: "none",
    },
    pending: [
      ...observations.pending.filter((item) => item !== "implementation capture and frame-aligned RMSE"),
      "identity-aligned authoritative full 128-frame implementation comparison",
      "Lesson Shell child-control composition and typography convergence",
    ],
  };
  const jsonPath = path.join(PROJECT_ROOT, OUTPUT_JSON_PATH);
  const markdownPath = path.join(PROJECT_ROOT, OUTPUT_MD_PATH);
  if (write) {
    await Promise.all([mkdir(path.dirname(jsonPath), {recursive: true}), mkdir(path.dirname(markdownPath), {recursive: true})]);
    for (const [destination, contents] of [[jsonPath, pretty(report)], [markdownPath, renderMarkdown(report)]]) {
      const temporary = `${destination}.tmp-${process.pid}`;
      await writeFile(temporary, contents, {flag: "wx"});
      await rename(temporary, destination);
    }
  }
  return {report, jsonPath, markdownPath};
}

export function parseArguments(argv) {
  let observationsPath = null;
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--observations") observationsPath = argv[++index] ?? "";
    else if (value === "--check") check = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(observationsPath, "--observations is required");
  return {observationsPath, check};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await adoptDiagnostic({observationsPath: options.observationsPath, write: !options.check});
  if (options.check) {
    const [jsonArtifact, markdownArtifact] = await Promise.all([
      readRegular(path.relative(PROJECT_ROOT, result.jsonPath), "diagnostic observation adoption JSON"),
      readRegular(path.relative(PROJECT_ROOT, result.markdownPath), "diagnostic observation adoption Markdown"),
    ]);
    invariant(jsonArtifact.bytes.equals(Buffer.from(pretty(result.report))), "diagnostic observation adoption JSON is stale");
    invariant(markdownArtifact.bytes.equals(Buffer.from(renderMarkdown(result.report))), "diagnostic observation adoption Markdown is stale");
  }
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${path.relative(PROJECT_ROOT, result.jsonPath)}\n`);
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${path.relative(PROJECT_ROOT, result.markdownPath)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
