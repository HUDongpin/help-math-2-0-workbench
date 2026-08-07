#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, open, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const REPORT_TYPE = "g04-l10-formal-migration-continuation-v1";
export const JSON_REPORT_RELATIVE =
  "reports/g04-l10-formal-migration-continuation-2026-08-02-v1.json";
export const MARKDOWN_REPORT_RELATIVE =
  "reports/g04-l10-formal-migration-continuation-2026-08-02-v1.md";

export const CANDIDATE_IDS = Object.freeze([
  "course-g04-l10-vb-003",
  "course-g04-l10-ti-003",
  "course-g04-l10-ts-006",
  "course-g04-l10-fq-002",
  "course-g04-l10-rw-004",
  "course-g04-l10-in-009",
  "course-g04-l10-vb-008",
  "course-g04-l10-ts-002",
]);

export const INPUTS = Object.freeze({
  predecessorCheckpoint: Object.freeze({
    path: "reports/g04-l10-formal-migration-checkpoint-2026-08-02.md",
    sha256: "8440e1c147bd7ec153a1b82978ae918451afaf3b3ed3788a2f1d086e529376c8",
  }),
  ruffleV6Diagnostic: Object.freeze({
    path: "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v6/diagnostic.json",
    sha256: "60fe292caedb7b2e5347568c22edb8b423b4822966ce50d2af8fde32790be112",
    readOnly: true,
  }),
  ruffleV7Diagnostic: Object.freeze({
    path: "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v7/diagnostic.json",
    sha256: "eb2e458f3654a4420f35727bafd8c6eae314b619bdcb19737b1c8749b9145f06",
    readOnly: true,
  }),
  vb001StaticAudit: Object.freeze({
    path: "reports/g4-l10-vb001-host-chain-static-audit.json",
    sha256: "cad80412082823298acddd7fcc69b4fb9e43f23cf00f9f9deeb6fffdd4025e11",
    readOnly: true,
  }),
  vb003TargetStability: Object.freeze({
    path: "reports/g4-l10-vb003-ruffle-v7-target-stability.json",
    sha256: "bdaeaab8592a5e53ae128f3d4acd02c8dd195b3132ef9371d077991c5fdce0bd",
    readOnly: true,
  }),
  fq002CurrentJsDiagnostic: Object.freeze({
    path: "output/playwright/g4-l10-fq002-current-js-engineering-diagnostic-v1/capture-manifest.json",
    sha256: "088e97a58c0f6991428d9f064b57f490dd66eb1f8578b74a48f1287cf7e68f09",
    readOnly: true,
  }),
  completionLedger: Object.freeze({
    path: "catalog/completion-ledger.json",
    sha256: "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
  }),
  lessonReleases: Object.freeze({
    path: "catalog/lesson-releases.json",
    sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  }),
  lessonReleaseLedger: Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    sha256: "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
  }),
  prototypeRegistry: Object.freeze({
    path: "packages/demos/prototype-registry.json",
    sha256: "8ab849e636f064501080238b50cbc69e2186025cda5715fe81bc3906a4148149",
  }),
  generatedRegistry: Object.freeze({
    path: "packages/demos/src/registry.generated.ts",
    sha256: "f703ab555cd02fe98879398c1011caccde7ed8c7cbdc178c373a0ae5bfb399ce",
  }),
  prototypeManifest: Object.freeze({
    path: "packages/demos/src/prototype-manifest.ts",
    sha256: "a56dda011879d1c72c9b111373862eb96f218519a6e8d137ec733695beee5e75",
  }),
  wholeLessonRegistry: Object.freeze({
    path: "apps/web/lib/whole-lesson-course-registry.ts",
    sha256: "c2b977939e358839ad6c04f8b48cad5a7e1c2968b8f6342753909661bb740d0e",
  }),
  ruffleV7Producer: Object.freeze({
    path: "scripts/probe-g4-l10-vb003-original-host-ruffle-successor-v7.mjs",
    sha256: "ace64f5c831da03c142aa2988e3224ca849eb7f6e0d0f5f0a74a8c96e4709011",
  }),
  ruffleV7Tests: Object.freeze({
    path: "scripts/probe-g4-l10-vb003-original-host-ruffle-successor-v7.test.mjs",
    sha256: "6d36aff09d061febd02a3e7c88e2aa49d7f3a1cae21a1c2dd53dc23df4eb6e8e",
  }),
  vb001Producer: Object.freeze({
    path: "scripts/build-g4-l10-vb001-host-chain-static-audit.mjs",
    sha256: "d14cf3c34f7e282f1a91879c0e274e07e33307cdc681e65031dd979b9a2d7a05",
  }),
  vb001Tests: Object.freeze({
    path: "scripts/build-g4-l10-vb001-host-chain-static-audit.test.mjs",
    sha256: "47bd9690dc9a1f6866db0059dff463346546b81a603d064ab49578ef7f716d37",
  }),
  targetStabilityProducer: Object.freeze({
    path: "scripts/analyze-g4-l10-vb003-ruffle-v7-target-stability.mjs",
    sha256: "599cd5124fa3167fd70e34725e758b3da9f618e43e12d6967374d43af4cb0876",
  }),
  targetStabilityTests: Object.freeze({
    path: "scripts/analyze-g4-l10-vb003-ruffle-v7-target-stability.test.mjs",
    sha256: "190d23609c3623ec395a6db06407d1bba1ea6631783e1c03c5f81ef5eb356b56",
  }),
  fq002Producer: Object.freeze({
    path: "scripts/capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.mjs",
    sha256: "4c5638079c1abd4892424a7f1780a669c980782565ae6a8406e278f2f6d121c1",
  }),
  fq002Tests: Object.freeze({
    path: "scripts/capture-g4-l10-fq002-current-js-engineering-diagnostic-v1.test.mjs",
    sha256: "b502fa1ab55c273cd0720ff166517fe4c7ecf041b2794836e272c69f15f5ed1f",
  }),
});

const EXPECTED_CHILD_PATHS = Object.freeze([
  "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf",
  "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
]);

const EXPECTED_PLANNED_WAITS = Object.freeze([
  98_418,
  91_251,
  114_501,
  81_168,
  15_418,
  27_418,
  21_001,
]);

const EXPECTED_ACTUAL_WAITS = Object.freeze([
  98_422,
  91_254,
  114_503,
  81_170,
  15_420,
  27_420,
  21_002,
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 continuation v1: ${message}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function descriptor(binding) {
  const {contents, document, ...rest} = binding;
  return rest;
}

function allFalse(value, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value) &&
      Object.keys(value).length > 0,
    `${label} must be a non-empty object`,
  );
  for (const [key, item] of Object.entries(value)) {
    invariant(item === false, `${label}.${key} must remain false`);
  }
}

async function stableBinding(projectRoot, specification) {
  const absolutePath = path.join(projectRoot, specification.path);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${specification.path} is not a regular non-symlink file`,
  );
  if (specification.readOnly) {
    invariant(
      (before.mode & 0o222n) === 0n,
      `${specification.path} must remain read-only`,
    );
  }
  const contents = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeNs === after.mtimeNs,
    `${specification.path} changed while being read`,
  );
  const actualSha256 = sha256(contents);
  invariant(
    actualSha256 === specification.sha256,
    `${specification.path} SHA-256 drifted: ${actualSha256}`,
  );
  let document = null;
  if (specification.path.endsWith(".json")) {
    try {
      document = JSON.parse(contents.toString("utf8"));
    } catch (error) {
      throw new Error(`G4 L10 continuation v1: ${specification.path} is invalid JSON: ${error.message}`);
    }
  }
  return {
    path: specification.path,
    bytes: contents.length,
    sha256: actualSha256,
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    contents,
    document,
  };
}

function validateCheckpoint(checkpoint) {
  const text = checkpoint.contents.toString("utf8");
  const requiredFragments = [
    "Release: `lesson-g04-l10-perimeter-area`",
    "| Canonical release membership | 47/47 present | Source custody only |",
    "| Authoritative original-runtime baseline | 0/47 | Gate closed |",
    "| Authoritative captured coverage frames | 0/44,488 | Gate closed |",
    "| Full-frame metrics / normalized RMSE | 0/520 requirements | Gate closed |",
    "| Named-human original-runtime listening | 0/47 | Gate closed |",
    "| Human visual review accepted | 0/47 | Gate closed |",
    "| Engineering review accepted | 0/47 | Gate closed |",
    "| Owner review accepted | 0/47 | Gate closed |",
    "| Registered formal JavaScript renderer | 0/47 | Product coverage unchanged |",
    "| Strict completion | 0/47 | Gate closed |",
    "| Atomic whole-lesson publication | false | 0 admitted / 47 required |",
    "Total current-JavaScript local frames: 3,928.",
  ];
  for (const fragment of requiredFragments) {
    invariant(text.includes(fragment), `predecessor checkpoint lost ${JSON.stringify(fragment)}`);
  }
  for (const candidateId of CANDIDATE_IDS) {
    invariant(text.includes(`\`${candidateId}\``), `checkpoint lost candidate ${candidateId}`);
  }
}

function validateRuffleV6(v6) {
  invariant(
    v6.schemaVersion === 6 &&
      v6.reportType === "g4-l10-vb003-contained-original-host-ruffle-successor-v6-diagnostic" &&
      v6.status === "rw002-http-delivery-observed-after-complete-dom-release-through-original-shell-in-ruffle-forensic-only",
    "Ruffle v6 predecessor identity drifted",
  );
  invariant(
    v6.observation?.attemptCount === 1 &&
      v6.observation.attempts?.[0]?.firstSuccessorDeliveryObserved === true &&
      v6.observation.attempts[0].successfulExpectedChildTransitions === 1 &&
      v6.observation.target?.attempted === false &&
      v6.observation.target.swfHttpDeliveryObserved === false,
    "Ruffle v6 no longer proves exactly the first successor without target attempt",
  );
  invariant(
    v6.authority?.ruffleForensicReferenceOnly === true &&
      v6.authority.authoritativeOriginalRuntime === false &&
      v6.authority.strictAcceptanceEffect === "none",
    "Ruffle v6 authority boundary drifted",
  );
}

function validateRuffleV7(v7, bindings) {
  invariant(
    v7.schemaVersion === 7 &&
      v7.reportType === "g4-l10-vb003-contained-original-host-ruffle-successor-v7-diagnostic" &&
      v7.status === "vb003-http-delivery-observed-after-seven-complete-dom-releases-and-source-declared-elapsed-windows-in-ruffle-forensic-only",
    "Ruffle v7 identity drifted",
  );
  invariant(
    v7.probe?.sha256 === bindings.ruffleV7Producer.sha256 &&
      v7.probe.outputDirectoryModeAfterFinalize === "0555" &&
      v7.runtime?.ruffle?.package?.version === "0.4.1" &&
      v7.runtime.ruffle.package.sha256 ===
        "097043e1bfb0a094c77411912690245eee966ae1cb672128307f299ad743d90d",
    "Ruffle v7 producer/runtime binding drifted",
  );
  invariant(
    v7.lineage?.predecessorV6?.after?.sha256 === bindings.ruffleV6Diagnostic.sha256 &&
      v7.lineage.predecessorV6.completeTrustedFirstReleaseObserved === true &&
      v7.lineage.vb001HostChainStaticAudit?.after?.sha256 ===
        bindings.vb001StaticAudit.sha256,
    "Ruffle v7 predecessor or VB001 lineage drifted",
  );
  const chain = v7.observation?.chain;
  invariant(
    chain?.allSevenExpectedChildTransitionsObserved === true &&
      chain.requiredReleaseCount === 7 &&
      chain.successfulExpectedChildTransitions === 7 &&
      JSON.stringify(chain.orderedExpectedPaths) === JSON.stringify(EXPECTED_CHILD_PATHS) &&
      chain.blocker === null,
    "Ruffle v7 seven-step chain summary drifted",
  );
  invariant(v7.observation.attemptCount === 1, "Ruffle v7 must contain exactly one attempt");
  const attempt = v7.observation.attempts?.[0];
  invariant(
    attempt?.allSevenExpectedChildTransitionsObserved === true &&
      attempt.successfulExpectedChildTransitions === 7 &&
      attempt.freshContextClosed === true &&
      attempt.blocker === null && attempt.fatalError === null,
    "Ruffle v7 attempt boundary drifted",
  );
  invariant(
    attempt.transitions?.length === 7 && attempt.waits?.length === 8,
    "Ruffle v7 transition or wait count drifted",
  );
  for (let index = 0; index < 7; index += 1) {
    const summary = chain.observedTransitions[index];
    const transition = attempt.transitions[index];
    const wait = attempt.waits[index + 1];
    invariant(
      summary.step === index + 1 && summary.expectedPath === EXPECTED_CHILD_PATHS[index] &&
        summary.completeTrustedReleaseSequence === true && summary.deliveryComplete === true &&
        summary.deliveryNotBeforePointerUpDispatch === true &&
        summary.sourceDeclaredElapsedWindowCompleted === true &&
        summary.elapsedWindowProvesNaturalEntryOrTerminal === false,
      `Ruffle v7 chain summary step ${index + 1} drifted`,
    );
    invariant(
      transition.step === index + 1 && transition.expectedPath === EXPECTED_CHILD_PATHS[index] &&
        transition.delivery?.complete === true &&
        transition.evidenceLayers?.domPointerSequenceComplete === true &&
        transition.evidenceLayers.httpDeliveryComplete === true &&
        transition.evidenceLayers.deliveryNotBeforePointerUpDispatch === true &&
        transition.evidenceLayers.noUnexpectedChildRequestDuringRelease === true &&
        transition.futurePrefetchesDuringElapsedWindow?.length === 0,
      `Ruffle v7 detailed transition ${index + 1} drifted`,
    );
    const dom = transition.input?.domSequence;
    invariant(
      dom?.capturePointerEventCount === 15 && dom.completeTrustedReleaseSequence === true &&
        dom.pointerId === 1 && dom.samePointerId === true &&
        dom.trustedPointerDownObserved === true && dom.trustedPointerUpObserved === true &&
        dom.orderedDownThenUp === true && dom.pointerCancelBetweenDownAndUp === false &&
        dom.pointerDownInsideMappedHitBounds === true &&
        dom.pointerUpInsideMappedHitBounds === true,
      `Ruffle v7 trusted DOM release ${index + 1} drifted`,
    );
    invariant(
      wait.completed === true && wait.plannedWaitMs === EXPECTED_PLANNED_WAITS[index] &&
        wait.actualWaitMs === EXPECTED_ACTUAL_WAITS[index] &&
        wait.evidence?.provesNaturalRuntimeEntry === false &&
        wait.evidence.provesNaturalRuntimeTerminal === false &&
        wait.evidence.provesAudioCompletionOrSynchronization === false,
      `Ruffle v7 elapsed-window receipt ${index + 1} drifted`,
    );
  }
  invariant(
    attempt.waits[0].plannedWaitMs === 12_334 &&
      attempt.waits[0].actualWaitMs === 12_336 && attempt.waits[0].completed === true,
    "Ruffle v7 initial IR001 wait drifted",
  );
  const target = v7.observation.target;
  invariant(
    target?.attempted === true && target.swfHttpDeliveryObserved === true &&
      target.exactDeliveryOrderedAfterTrustedPointerRelease === true &&
      target.sourceDeclaredElapsedWindowCompleted === true &&
      target.beginHandshakeActuallyObserved === false &&
      target.childFrameDomainActuallyObserved === false &&
      target.naturalPlaybackProven === false &&
      target.twoSecondPixelStabilityCandidate?.byteIdenticalPng === false &&
      target.twoSecondPixelStabilityCandidate.provesRuntimeTerminal === false &&
      target.twoSecondPixelStabilityCandidate.provesVisualFidelity === false,
    "Ruffle v7 target boundary drifted",
  );
  invariant(
    v7.containment?.attemptCount === 1 && v7.containment.containmentBreached === false &&
      v7.containment.allWebSocketsBlocked === true &&
      v7.containment.serverUnknownRequestCount === 0 &&
      v7.containment.legacyEndpointExecutionObserved === false &&
      attempt.containment.browserRequestCount === 26 &&
      attempt.containment.serverRequestCount === 17 &&
      attempt.containment.blockedRequestCount === 9 &&
      attempt.containment.serverUnknownRequestCount === 0 &&
      attempt.containment.websocketAttemptCount === 0 &&
      attempt.containment.dialogs.length === 0 &&
      attempt.containment.downloads.length === 0 &&
      attempt.containment.popups.length === 0 &&
      attempt.diagnostics.pageErrors.length === 0 &&
      attempt.diagnostics.failedRequests.length === 9 &&
      attempt.screenshots.length === 45 &&
      attempt.screenshots.every((item) => item.width === 800 && item.height === 600 && item.mode === "0444"),
    "Ruffle v7 containment or artifact census drifted",
  );
  invariant(
    v7.authority?.ruffleForensicReferenceOnly === true &&
      v7.authority.authoritativeOriginalRuntime === false &&
      v7.authority.originalRuntimeNaturalTrace === false &&
      v7.authority.originalRuntimeBaseline === false &&
      v7.authority.fullFrameBaseline === false &&
      v7.authority.audioListeningOrSynchronization === false &&
      v7.authority.humanReview === false && v7.authority.ownerReview === false &&
      v7.authority.strictCompletion === false &&
      v7.authority.wholeLessonIntegration === false &&
      v7.authority.releaseOrPublication === false &&
      v7.authority.strictAcceptanceEffect === "none",
    "Ruffle v7 authority boundary drifted",
  );
}

function validateVb001(audit) {
  invariant(
    audit.reportType === "g4-l10-vb001-host-chain-static-audit" &&
      audit.status === "source-static-host-chain-timing-candidate-only" &&
      audit.scope?.activeCourseXmlMember === false &&
      audit.scope.formalReleaseMember === false &&
      audit.scope.migrationWorkspaceExists === false,
    "VB001 static audit scope drifted",
  );
  invariant(
    audit.sources?.swf?.sha256 ===
      "3909cbf09c6bace7400687680e082007f8bc695bd16a279674a95bd266c109ec" &&
      audit.sources.fla?.sha256 ===
        "6c098c272e8608e401f3a51e7d065eb2a5bf076b23e1e8947a5041f5705d34ff" &&
      audit.swf?.header?.fps === 12 && audit.swf.header.frameCount === 10 &&
      audit.controlledNavigationTimingCandidate?.principalTimelineId === "sprite-31" &&
      audit.controlledNavigationTimingCandidate.principalFrameCount === 136 &&
      audit.controlledNavigationTimingCandidate.conservativePostDeliveryWaitMs === 15_418 &&
      audit.controlledNavigationTimingCandidate.provesNaturalRuntimeEntry === false &&
      audit.controlledNavigationTimingCandidate.provesNaturalRuntimeTerminal === false &&
      audit.controlledNavigationTimingCandidate.provesAudioCompletionOrSynchronization === false,
    "VB001 static timing/source binding drifted",
  );
  invariant(
    audit.authority?.sourceStaticHostChainTimingCandidateOnly === true &&
      audit.authority.authoritativeOriginalRuntime === false &&
      audit.authority.strictAcceptanceEffect === "none",
    "VB001 authority boundary drifted",
  );
}

function validateStability(stability, bindings) {
  invariant(
    stability.reportType === "g4-l10-vb003-ruffle-v7-target-stability-analysis" &&
      stability.status ===
        "target-content-exactly-stable-over-two-seconds-host-chrome-dynamic-ruffle-forensic-only" &&
      stability.input?.diagnostic?.sha256 === bindings.ruffleV7Diagnostic.sha256 &&
      stability.input.intervalMs === 2_082 &&
      stability.input.sevenStepDeliveryObserved === true,
    "VB003 target-stability identity/input drifted",
  );
  invariant(
    stability.regions?.fullPlayer?.exactRgbaDifferentPixels === 2_520 &&
      stability.regions.fullPlayer.normalizedRgbRmse === 0.006785937286054983 &&
      stability.regions.targetContentAboveHostChrome?.exactRgbaDifferentPixels === 0 &&
      stability.regions.targetContentAboveHostChrome.normalizedRgbRmse === 0 &&
      stability.regions.targetLessonBody?.exactRgbaDifferentPixels === 0 &&
      stability.regions.targetLessonBody.normalizedRgbRmse === 0 &&
      stability.regions.hostChrome?.exactRgbaDifferentPixels === 2_520 &&
      stability.interpretation?.supportsTargetStaticStateCandidate === true &&
      stability.interpretation.provesRuffleRuntimeTerminal === false &&
      stability.interpretation.provesBeginHandshake === false &&
      stability.interpretation.provesChildFrameDomainEntry === false &&
      stability.interpretation.provesAdobeOriginalRuntime === false &&
      stability.interpretation.comparesOriginalRuntimeToJavaScript === false &&
      stability.interpretation.formalRmseAcceptanceEffect === "none",
    "VB003 target-stability metric or interpretation drifted",
  );
}

function validateFq002(fq002, bindings) {
  invariant(
    fq002.schemaVersion === 1 &&
      fq002.artifactType === "g4-l10-fq002-current-js-engineering-diagnostic-v1" &&
      fq002.status === "pass" && fq002.animationId === "course-g04-l10-fq-002",
    "FQ002 diagnostic identity drifted",
  );
  invariant(
    fq002.bindings?.producer?.sha256 === bindings.fq002Producer.sha256 &&
      fq002.bindings.producerTests?.sha256 === bindings.fq002Tests.sha256 &&
      fq002.bindings.prototypeRegistry?.sha256 === bindings.prototypeRegistry.sha256 &&
      fq002.bindings.generatedRegistry?.sha256 === bindings.generatedRegistry.sha256 &&
      fq002.bindings.wholeLessonRegistry?.sha256 === bindings.wholeLessonRegistry.sha256,
    "FQ002 producer or registry binding drifted",
  );
  invariant(
    fq002.source?.swf?.sha256 ===
      "850ddbc1aeda20aa782d614a4ad44aae7e2ac8242b47fc27882860208c99d9ea" &&
      fq002.source.fla?.sha256 ===
        "c73eaa76438956aaac0aafd013e10ae7f3911b9a18b94047bf6b8bf4e27e229a" &&
      fq002.bindings.candidateManifest?.sha256 ===
        "ad7a83efa30ad3e8cfcb9d3688f4d9420f43e65cc28e9711e52d54cf98eedb7d" &&
      fq002.bindings.canvasAsset?.sha256 ===
        "1155bb2a8a59b83076e4265581631c11e22ccc5b3c697842ac363ac18920cd38",
    "FQ002 source/candidate asset binding drifted",
  );
  invariant(
    fq002.candidate?.registered === false &&
      fq002.candidate.actionScriptExecuted === false &&
      fq002.candidate.controlsEnabled === false &&
      Array.isArray(fq002.candidate.audioCues) && fq002.candidate.audioCues.length === 0 &&
      fq002.candidate.SpanishVisualStatus === "unresolved-disabled" &&
      fq002.candidate.naturalRuntimeEstablished === false &&
      fq002.candidate.replayParityEstablished === false &&
      fq002.candidate.fullFrameFidelityEstablished === false &&
      fq002.candidate.strictAcceptanceEffect === "none",
    "FQ002 candidate fail-closed boundary drifted",
  );
  invariant(
    JSON.stringify(fq002.capturePlan?.frames) === JSON.stringify([1, 2, 27, 28, 43, 44, 70]) &&
      fq002.capturePlan.nativeStage?.width === 800 &&
      fq002.capturePlan.nativeStage.height === 600 &&
      fq002.capturePlan.fps === 12 && fq002.capturePlan.rootFrameCount === 10 &&
      fq002.capturePlan.rootPlacementFrame === 6 &&
      fq002.capturePlan.frameDomain === "sprite-823" &&
      fq002.capturePlan.frameDomainCount === 70 &&
      fq002.captures?.length === 7 &&
      fq002.captures.every((item) =>
        item.width === 800 && item.height === 600 &&
        item.identityVerified === true && item.authorityBoundaryVerified === true),
    "FQ002 seven-frame capture identity drifted",
  );
  invariant(
    fq002.sourceCurrentJsSequenceBinding?.comparedConsecutivePairCount === 69 &&
      fq002.sourceCurrentJsSequenceBinding.byteIdenticalToPreviousFrameCount === 16 &&
      fq002.sourceCurrentJsSequenceBinding.changedFromPreviousFrameCount === 53 &&
      JSON.stringify(fq002.temporalBoundarySamples.map((item) => item.changedPixelCount)) ===
        JSON.stringify([24_476, 0, 0, 634, 65_183]),
    "FQ002 current-JS sequence relationship drifted",
  );
  for (const key of [
    "consoleErrors",
    "consoleWarnings",
    "pageErrors",
    "failedRequests",
    "httpErrors",
    "unexpectedRequests",
  ]) {
    invariant(fq002.browserDiagnostics?.[key]?.length === 0, `FQ002 ${key} is not empty`);
  }
  invariant(
    fq002.authorityBoundary?.currentJavascriptCandidateOnly === true &&
      fq002.authorityBoundary.authoritativeOriginalRuntime === false &&
      fq002.authorityBoundary.fullFrameOriginalRuntimeComparison === false &&
      fq002.authorityBoundary.rmseAcceptance === false &&
      fq002.authorityBoundary.humanVisualReview === false &&
      fq002.authorityBoundary.ownerAcceptance === false &&
      fq002.authorityBoundary.strictMigrationCompletion === false &&
      fq002.authorityBoundary.wholeLessonIntegration === false &&
      fq002.authorityBoundary.atomicLessonPublication === false &&
      fq002.acceptanceEffect === "none",
    "FQ002 authority boundary drifted",
  );
}

function validateFormalState(bindings) {
  const completion = bindings.completionLedger.document;
  invariant(
    completion.summary?.declaredComplete === 0 &&
      completion.summary.strictComplete === 0 &&
      Array.isArray(completion.entries) && completion.entries.length === 0,
    "completion ledger no longer has zero strict-complete entries",
  );
  const releaseDefinition = bindings.lessonReleases.document.releases?.find(
    (item) => item.releaseId === RELEASE_ID,
  );
  invariant(releaseDefinition, `release definition lacks ${RELEASE_ID}`);
  invariant(
    releaseDefinition.members?.length === 47 &&
      JSON.stringify(releaseDefinition.shards?.map((item) => item.memberCount)) ===
        JSON.stringify([16, 15, 16]) &&
      !releaseDefinition.members.some((member) =>
        member.animationId === "course-g04-l10-vb-001" ||
        member.sourcePath === "VB/L10VB01.swf"),
    "L10 exact release definition or VB001 exclusion drifted",
  );
  const release = bindings.lessonReleaseLedger.document.releases?.find(
    (item) => item.releaseId === RELEASE_ID,
  );
  invariant(release, `release ledger lacks ${RELEASE_ID}`);
  invariant(
    release.expectedMemberCount === 47 && release.members?.length === 47 &&
      release.strictCompleteCount === 0 && release.missingCount === 47 &&
      release.assetMismatchCount === 0 && release.published === false &&
      release.status === "unpublished" &&
      release.gate?.kind === "atomic-all-members-strict" &&
      release.gate.requiredCount === 47 && release.gate.admittedCount === 0 &&
      release.gate.open === false &&
      release.gate.reason === "47 of 47 release members are not exact-asset strict completion entries" &&
      release.members.every((member) =>
        member.strictComplete === false && member.status === "missing" &&
        member.ledgerAssetId === null && member.workspace === null &&
        member.manifestSha256 === null),
    "L10 release ledger formal gate drifted",
  );
  for (const key of [
    "prototypeRegistry",
    "generatedRegistry",
    "prototypeManifest",
    "wholeLessonRegistry",
  ]) {
    const text = bindings[key].contents.toString("utf8");
    for (const candidateId of CANDIDATE_IDS) {
      invariant(!text.includes(candidateId), `${candidateId} appeared in ${bindings[key].path}`);
    }
  }
  return release;
}

export function validateSourceBindings(bindings) {
  validateCheckpoint(bindings.predecessorCheckpoint);
  validateRuffleV6(bindings.ruffleV6Diagnostic.document);
  validateRuffleV7(bindings.ruffleV7Diagnostic.document, bindings);
  validateVb001(bindings.vb001StaticAudit.document);
  validateStability(bindings.vb003TargetStability.document, bindings);
  validateFq002(bindings.fq002CurrentJsDiagnostic.document, bindings);
  return validateFormalState(bindings);
}

function gateState() {
  return {
    canonicalReleaseMembership: {
      present: 47,
      required: 47,
      status: "source-custody-complete",
      acceptanceEffect: "source-custody-only",
    },
    authoritativeOriginalRuntimeBaseline: {accepted: 0, required: 47, gateOpen: false},
    authoritativeCapturedCoverageFrames: {accepted: 0, required: 44_488, gateOpen: false},
    fullFrameRmseRequirements: {accepted: 0, required: 520, gateOpen: false},
    namedHumanOriginalRuntimeListening: {accepted: 0, required: 47, gateOpen: false},
    humanVisualReview: {accepted: 0, required: 47, gateOpen: false},
    engineeringReview: {accepted: 0, required: 47, gateOpen: false},
    ownerReview: {accepted: 0, required: 47, gateOpen: false},
    registeredFormalJavascriptRenderer: {accepted: 0, required: 47, gateOpen: false},
    strictCompletion: {accepted: 0, required: 47, gateOpen: false},
    atomicWholeLessonPublication: {
      published: false,
      admitted: 0,
      required: 47,
      gateOpen: false,
    },
  };
}

function acceptanceEffects() {
  return {
    registryMutation: false,
    coverageAdoptionMutation: false,
    baselineAcceptanceMutation: false,
    metricsOrRmseAcceptanceMutation: false,
    audioListeningAcceptanceMutation: false,
    humanReviewMutation: false,
    engineeringReviewMutation: false,
    ownerReviewMutation: false,
    completionLedgerMutation: false,
    lessonReleaseLedgerMutation: false,
    wholeLessonIntegrationMutation: false,
    publicationMutation: false,
  };
}

export async function buildReport(projectRoot = PROJECT_ROOT) {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(async ([key, specification]) => [
      key,
      await stableBinding(projectRoot, specification),
    ]),
  );
  const bindings = Object.fromEntries(entries);
  const release = validateSourceBindings(bindings);
  const v7 = bindings.ruffleV7Diagnostic.document;
  const attempt = v7.observation.attempts[0];
  const stability = bindings.vb003TargetStability.document;
  const fq002 = bindings.fq002CurrentJsDiagnostic.document;

  const transitionReceipts = attempt.transitions.map((transition, index) => {
    const wait = attempt.waits[index + 1];
    return {
      step: index + 1,
      expectedPath: transition.expectedPath,
      activeCourseXmlPage: transition.activeCourseXmlPage,
      trustedDomPointerEvents: transition.input.domSequence.capturePointerEventCount,
      pointerId: transition.input.domSequence.pointerId,
      completeTrustedReleaseSequence: true,
      exactGetHttp200AndServerDelivery: true,
      newExactGetDeliveryMultiplicity: transition.delivery.newAllowedRequestCount,
      deliveryAfterPointerUp: true,
      futurePrefetchCount: 0,
      plannedElapsedWindowMs: wait.plannedWaitMs,
      actualElapsedWindowMs: wait.actualWaitMs,
      elapsedWindowProvesNaturalEntryOrTerminal: false,
    };
  });

  const report = {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    releaseId: RELEASE_ID,
    evidenceAsOf: "2026-08-02",
    status: "additive-machine-evidence-current-formal-gates-unchanged",
    classification: "additive-machine-evidence-continuation-only",
    decision: {
      machineEvidenceAdvanced: true,
      ruffleHostTraversalAdvancedFromV6OneOfSevenToV7SevenOfSeven: true,
      vb003ExactHttpDeliveryObservedInContainedRuffle: true,
      vb003StaticContentStateCandidateAdded: true,
      fq002SevenFrameCurrentJavascriptDiagnosticAdded: true,
      formalMigrationComplete: false,
      acceptanceEffect: "none",
      statement:
        "The contained Ruffle host chain and isolated current-JavaScript diagnostic advanced machine forensics only. No authoritative original-runtime, formal baseline, RMSE, audio listening, human/owner review, renderer registration, strict admission, whole-lesson integration, or publication gate changed.",
    },
    predecessor: descriptor(bindings.predecessorCheckpoint),
    evidenceBindings: {
      machineEvidence: {
        ruffleV6Diagnostic: descriptor(bindings.ruffleV6Diagnostic),
        ruffleV7Diagnostic: descriptor(bindings.ruffleV7Diagnostic),
        vb001StaticAudit: descriptor(bindings.vb001StaticAudit),
        vb003TargetStability: descriptor(bindings.vb003TargetStability),
        fq002CurrentJsDiagnostic: descriptor(bindings.fq002CurrentJsDiagnostic),
      },
      currentFormalState: {
        completionLedger: descriptor(bindings.completionLedger),
        lessonReleases: descriptor(bindings.lessonReleases),
        lessonReleaseLedger: descriptor(bindings.lessonReleaseLedger),
        prototypeRegistry: descriptor(bindings.prototypeRegistry),
        generatedRegistry: descriptor(bindings.generatedRegistry),
        prototypeManifest: descriptor(bindings.prototypeManifest),
        wholeLessonRegistry: descriptor(bindings.wholeLessonRegistry),
      },
      producersAndFocusedTests: {
        ruffleV7Producer: descriptor(bindings.ruffleV7Producer),
        ruffleV7Tests: descriptor(bindings.ruffleV7Tests),
        vb001Producer: descriptor(bindings.vb001Producer),
        vb001Tests: descriptor(bindings.vb001Tests),
        targetStabilityProducer: descriptor(bindings.targetStabilityProducer),
        targetStabilityTests: descriptor(bindings.targetStabilityTests),
        fq002Producer: descriptor(bindings.fq002Producer),
        fq002Tests: descriptor(bindings.fq002Tests),
      },
    },
    machineProgressDelta: {
      ruffleHostTraversal: {
        predecessorV6SuccessfulExpectedChildTransitions: 1,
        currentV7SuccessfulExpectedChildTransitions: 7,
        requiredExpectedChildTransitions: 7,
        initialIr001PlannedElapsedWindowMs: attempt.waits[0].plannedWaitMs,
        initialIr001ActualElapsedWindowMs: attempt.waits[0].actualWaitMs,
        transitionReceipts,
        target: {
          expectedPath: v7.observation.target.expectedSwfPath,
          exactDeliveryOrderedAfterTrustedPointerRelease: true,
          sourceDeclaredElapsedWindowCompleted: true,
          beginHandshakeActuallyObserved: false,
          childFrameDomainActuallyObserved: false,
          naturalPlaybackProven: false,
        },
        containment: {
          freshContextCount: 1,
          browserRequestCount: attempt.containment.browserRequestCount,
          allowedServerRequestCount: attempt.containment.serverRequestCount,
          expectedBlockedRequestCount: attempt.containment.blockedRequestCount,
          serverUnknownRequestCount: 0,
          websocketAttemptCount: 0,
          containmentBreached: false,
          legacyEndpointExecutionObserved: false,
          screenshotCount: attempt.screenshots.length,
          screenshotStage: {width: 800, height: 600},
        },
        authority: "Ruffle 0.4.1 forensic reference only",
      },
      vb001HostChainStaticAudit: {
        formalReleaseMember: false,
        activeCourseXmlMember: false,
        sourceSwfSha256: bindings.vb001StaticAudit.document.sources.swf.sha256,
        sourceFlaSha256: bindings.vb001StaticAudit.document.sources.fla.sha256,
        principalTimelineId: "sprite-31",
        principalFrameCount: 136,
        conservativePostDeliveryWaitMs: 15_418,
        closesControlledProbeTimingGapOnly: true,
        denominatorEffect: "none",
        provesNaturalRuntimeEntryOrTerminal: false,
        provesAudioSynchronization: false,
      },
      vb003TargetStability: {
        captureIntervalMs: stability.input.intervalMs,
        fullPlayer: {
          exactRgbaDifferentPixels: stability.regions.fullPlayer.exactRgbaDifferentPixels,
          normalizedRgbRmse: stability.regions.fullPlayer.normalizedRgbRmse,
        },
        targetContentAboveHostChrome: {
          exactRgbaDifferentPixels:
            stability.regions.targetContentAboveHostChrome.exactRgbaDifferentPixels,
          normalizedRgbRmse:
            stability.regions.targetContentAboveHostChrome.normalizedRgbRmse,
        },
        targetLessonBody: {
          exactRgbaDifferentPixels: stability.regions.targetLessonBody.exactRgbaDifferentPixels,
          normalizedRgbRmse: stability.regions.targetLessonBody.normalizedRgbRmse,
        },
        hostChrome: {
          exactRgbaDifferentPixels: stability.regions.hostChrome.exactRgbaDifferentPixels,
          normalizedRgbRmse: stability.regions.hostChrome.normalizedRgbRmse,
        },
        supportsStaticTargetStateCandidate: true,
        provesRuntimeTerminal: false,
        formalRmseAcceptanceEffect: "none",
      },
      fq002CurrentJavascriptDiagnostic: {
        animationId: fq002.animationId,
        registered: false,
        language: fq002.captureIdentity.language,
        spanishVisualStatus: fq002.candidate.SpanishVisualStatus,
        frameDomain: fq002.capturePlan.frameDomain,
        rootPlacementFrame: fq002.capturePlan.rootPlacementFrame,
        domainFrameCount: fq002.capturePlan.frameDomainCount,
        capturedFrames: fq002.capturePlan.frames,
        nativeStage: fq002.capturePlan.nativeStage,
        comparedConsecutivePairCount:
          fq002.sourceCurrentJsSequenceBinding.comparedConsecutivePairCount,
        identicalPairCount:
          fq002.sourceCurrentJsSequenceBinding.byteIdenticalToPreviousFrameCount,
        changedPairCount:
          fq002.sourceCurrentJsSequenceBinding.changedFromPreviousFrameCount,
        temporalChangedPixelCounts:
          fq002.temporalBoundarySamples.map((item) => item.changedPixelCount),
        browserErrorCounts: {
          consoleErrors: 0,
          consoleWarnings: 0,
          pageErrors: 0,
          failedRequests: 0,
          httpErrors: 0,
          unexpectedRequests: 0,
        },
        actionScriptExecuted: false,
        controlsEnabled: false,
        audioCueCount: 0,
        naturalRuntimeEstablished: false,
        replayParityEstablished: false,
        fullFrameFidelityEstablished: false,
        formalCoverageManifestEffect: "none",
      },
    },
    formalGateInvariance: {
      gates: gateState(),
      engineeringCandidates: {
        count: 8,
        registeredCount: 0,
        currentJavascriptLocalFrameCount: 3_928,
        ids: [...CANDIDATE_IDS],
      },
      releaseLedger: {
        expectedMemberCount: release.expectedMemberCount,
        strictCompleteCount: release.strictCompleteCount,
        missingCount: release.missingCount,
        assetMismatchCount: release.assetMismatchCount,
        published: release.published,
        status: release.status,
        gate: {...release.gate},
      },
      mutations: acceptanceEffects(),
    },
    remainingGates: [
      "Name and obtain consent from an Adobe Animate primary operator for the prepared paired-FLA protocol.",
      "Capture authoritative English and Spanish original-runtime entry, natural playback, controls, terminal/replay, and full-frame evidence.",
      "Perform named-human English/Spanish audio listening and cue/synchronization review.",
      "Bind matching formal JavaScript implementation captures and calculate requirement-complete full-frame diffs and normalized RMSE.",
      "Record independent human visual, engineering, and owner review receipts.",
      "Register and admit all 47 exact members in strict mode before atomic whole-lesson integration and publication.",
    ],
    authority: {
      additiveMachineEvidenceOnly: true,
      ruffleForensicReferenceOnly: true,
      currentJavascriptEngineeringDiagnosticOnly: true,
      authoritativeOriginalRuntime: false,
      originalRuntimeNaturalTrace: false,
      originalRuntimeBaseline: false,
      fullFrameBaseline: false,
      formalRmseAcceptance: false,
      audioListeningOrSynchronization: false,
      humanReview: false,
      engineeringReview: false,
      ownerReview: false,
      registeredFormalRenderer: false,
      strictCompletion: false,
      wholeLessonIntegration: false,
      releaseOrPublication: false,
      strictAcceptanceEffect: "none",
    },
  };
  validateReport(report);
  return report;
}

export function validateReport(report) {
  invariant(
    report?.schemaVersion === 1 && report.reportType === REPORT_TYPE &&
      report.releaseId === RELEASE_ID &&
      report.status === "additive-machine-evidence-current-formal-gates-unchanged" &&
      report.classification === "additive-machine-evidence-continuation-only",
    "generated report identity drifted",
  );
  invariant(
    report.decision?.machineEvidenceAdvanced === true &&
      report.decision.formalMigrationComplete === false &&
      report.decision.acceptanceEffect === "none",
    "generated decision boundary drifted",
  );
  const traversal = report.machineProgressDelta?.ruffleHostTraversal;
  invariant(
    traversal?.predecessorV6SuccessfulExpectedChildTransitions === 1 &&
      traversal.currentV7SuccessfulExpectedChildTransitions === 7 &&
      traversal.requiredExpectedChildTransitions === 7 &&
      traversal.transitionReceipts?.length === 7 &&
      traversal.target?.beginHandshakeActuallyObserved === false &&
      traversal.target.childFrameDomainActuallyObserved === false &&
      traversal.target.naturalPlaybackProven === false &&
      traversal.containment?.containmentBreached === false,
    "generated Ruffle progress boundary drifted",
  );
  invariant(
    report.machineProgressDelta.vb003TargetStability?.targetContentAboveHostChrome
        ?.exactRgbaDifferentPixels === 0 &&
      report.machineProgressDelta.vb003TargetStability.provesRuntimeTerminal === false &&
      report.machineProgressDelta.vb003TargetStability.formalRmseAcceptanceEffect === "none",
    "generated stability boundary drifted",
  );
  invariant(
    report.machineProgressDelta.fq002CurrentJavascriptDiagnostic?.registered === false &&
      report.machineProgressDelta.fq002CurrentJavascriptDiagnostic.capturedFrames.length === 7 &&
      report.machineProgressDelta.fq002CurrentJavascriptDiagnostic.spanishVisualStatus ===
        "unresolved-disabled" &&
      report.machineProgressDelta.fq002CurrentJavascriptDiagnostic.audioCueCount === 0 &&
      report.machineProgressDelta.fq002CurrentJavascriptDiagnostic.formalCoverageManifestEffect ===
        "none",
    "generated FQ002 boundary drifted",
  );
  const expectedGates = gateState();
  invariant(
    JSON.stringify(report.formalGateInvariance?.gates) === JSON.stringify(expectedGates),
    "generated formal gate state drifted",
  );
  invariant(
    report.formalGateInvariance.engineeringCandidates?.count === 8 &&
      report.formalGateInvariance.engineeringCandidates.registeredCount === 0 &&
      JSON.stringify(report.formalGateInvariance.engineeringCandidates.ids) ===
        JSON.stringify(CANDIDATE_IDS),
    "generated engineering candidate state drifted",
  );
  allFalse(report.formalGateInvariance.mutations, "formalGateInvariance.mutations");
  const ledger = report.formalGateInvariance.releaseLedger;
  invariant(
    ledger.expectedMemberCount === 47 && ledger.strictCompleteCount === 0 &&
      ledger.missingCount === 47 && ledger.assetMismatchCount === 0 &&
      ledger.published === false && ledger.status === "unpublished" &&
      ledger.gate.requiredCount === 47 && ledger.gate.admittedCount === 0 &&
      ledger.gate.open === false,
    "generated release ledger state drifted",
  );
  invariant(
    report.authority?.additiveMachineEvidenceOnly === true &&
      report.authority.ruffleForensicReferenceOnly === true &&
      report.authority.currentJavascriptEngineeringDiagnosticOnly === true &&
      report.authority.authoritativeOriginalRuntime === false &&
      report.authority.originalRuntimeNaturalTrace === false &&
      report.authority.originalRuntimeBaseline === false &&
      report.authority.fullFrameBaseline === false &&
      report.authority.formalRmseAcceptance === false &&
      report.authority.audioListeningOrSynchronization === false &&
      report.authority.humanReview === false && report.authority.engineeringReview === false &&
      report.authority.ownerReview === false &&
      report.authority.registeredFormalRenderer === false &&
      report.authority.strictCompletion === false &&
      report.authority.wholeLessonIntegration === false &&
      report.authority.releaseOrPublication === false &&
      report.authority.strictAcceptanceEffect === "none",
    "generated authority boundary drifted",
  );
  return true;
}

export function renderMarkdown(report) {
  validateReport(report);
  const transitionRows = report.machineProgressDelta.ruffleHostTraversal.transitionReceipts
    .map((item) =>
      `| ${item.step} | \`${item.expectedPath}\` | ${item.trustedDomPointerEvents} / ${item.pointerId} | ${item.newExactGetDeliveryMultiplicity} | ${item.plannedElapsedWindowMs.toLocaleString("en-US")} | ${item.actualElapsedWindowMs.toLocaleString("en-US")} |`)
    .join("\n");
  const gates = report.formalGateInvariance.gates;
  const evidenceRows = [
    ...Object.values(report.evidenceBindings.machineEvidence),
    ...Object.values(report.evidenceBindings.currentFormalState),
  ].map((item) => `| \`${item.path}\` | \`${item.sha256}\` | ${item.mode} | ${item.bytes.toLocaleString("en-US")} |`).join("\n");
  return `# Grade 4 Lesson 10 formal migration continuation v1\n\n` +
    `> **Additive machine evidence only.** This report does not create an Adobe original-runtime baseline, formal full-frame/RMSE acceptance, audio listening, human/engineering/owner approval, renderer registration, strict completion, whole-lesson integration, or publication authority.\n\n` +
    `## Outcome\n\n` +
    `The contained Ruffle host-chain diagnostic advanced from the v6 predecessor's **1/7** observed successor deliveries to **7/7**, including exact loopback GET, HTTP 200, and server delivery of \`VB/L10VB03.swf\` after the seventh complete trusted DOM release. A separate two-capture analysis found the VB003 target content above host chrome exactly stable for 2,082 ms, and FQ002 now has a seven-frame native current-JavaScript engineering diagnostic.\n\n` +
    `These are forensic and engineering deltas only. The authoritative original-runtime baseline remains **0/47**, formal captured coverage remains **0/44,488 frames**, formal full-frame/RMSE remains **0/520 requirements**, registered formal renderers remain **0/47**, strict completion remains **0/47**, and atomic publication remains closed at **0/47**.\n\n` +
    `## Ruffle v7 seven-step host traversal\n\n` +
    `The run used one fresh Chromium context, Ruffle 0.4.1, the source-proven shell Next control, a deny-by-default exact-path loopback policy, and seven independent trusted \`pointerdown -> pointerup\` sequences. Each source-declared elapsed window completed; elapsed time is not playhead-bearing proof of natural entry, terminal arrival, or audio completion.\n\n` +
    `| Step | Expected exact child | Trusted pointer events / pointer ID | Exact GET multiplicity | Planned window ms | Actual window ms |\n| ---: | --- | ---: | ---: | ---: | ---: |\n${transitionRows}\n\n` +
    `The initial IR001 window was 12,334 ms planned and 12,336 ms actual. The run preserved 45 immutable 800×600 screenshots. It observed 26 browser requests, 17 allowed server requests, nine intentionally blocked requests, zero unknown server requests, zero WebSocket attempts, and no dialogs, popups, downloads, legacy endpoint execution, or containment breach.\n\n` +
    `Target delivery is proven only at the browser/HTTP/server layer after trusted input. \`beginHandshakeActuallyObserved=false\`, \`childFrameDomainActuallyObserved=false\`, and \`naturalPlaybackProven=false\`.\n\n` +
    `## VB001 timing gap and VB003 stability\n\n` +
    `The VB001 source-static audit binds its exact SWF/FLA, AS1/2 scripts, 12 FPS root, \`sprite-31\` 136-frame principal domain, random embedded-audio branches, and a 15,418 ms conservative controlled-probe envelope. VB001 is neither an active course-XML member nor a formal 47-member release member; the audit changes no denominator and proves no runtime entry, terminal, listening, or synchronization.\n\n` +
    `For VB003, two Ruffle captures 2,082 ms apart had 2,520 exact RGBA-different pixels across the full 800×600 player, all confined to y=500..599 host chrome. The content region y=0..499 and lesson body y=109..499 each had **0 changed pixels and normalized RGB RMSE 0**. This supports a static-state candidate only; it is not a terminal trace or original-runtime-versus-JavaScript RMSE comparison.\n\n` +
    `## FQ002 current-JavaScript diagnostic\n\n` +
    `The isolated, unregistered English-only FQ002 candidate captured native 800×600 frames \`1, 2, 27, 28, 43, 44, 70\` in \`sprite-823\` at 12 FPS. Its 69 consecutive current-JS pairs contain 16 identical and 53 changed pairs; selected changed-pixel counts are \`24,476, 0, 0, 634, 65,183\`. Console errors, warnings, page errors, failed requests, HTTP errors, and unexpected requests were all zero.\n\n` +
    `ActionScript execution, controls, audio cues, Spanish visuals, natural runtime, Replay parity, and full-frame fidelity remain disabled or unresolved. The artifact is absent from the product and whole-lesson registries and has no coverage-v2, RMSE, strict, or release effect.\n\n` +
    `## Formal gate invariance\n\n` +
    `| Gate | Current state |\n| --- | ---: |\n` +
    `| Canonical release membership | ${gates.canonicalReleaseMembership.present}/${gates.canonicalReleaseMembership.required} source present |\n` +
    `| Authoritative original-runtime baseline | ${gates.authoritativeOriginalRuntimeBaseline.accepted}/${gates.authoritativeOriginalRuntimeBaseline.required} |\n` +
    `| Authoritative captured coverage | ${gates.authoritativeCapturedCoverageFrames.accepted}/${gates.authoritativeCapturedCoverageFrames.required.toLocaleString("en-US")} frames |\n` +
    `| Full-frame/RMSE requirements | ${gates.fullFrameRmseRequirements.accepted}/${gates.fullFrameRmseRequirements.required} |\n` +
    `| Named-human original-runtime listening | ${gates.namedHumanOriginalRuntimeListening.accepted}/${gates.namedHumanOriginalRuntimeListening.required} |\n` +
    `| Human / engineering / owner review | 0/47 / 0/47 / 0/47 |\n` +
    `| Registered formal JavaScript renderer | ${gates.registeredFormalJavascriptRenderer.accepted}/${gates.registeredFormalJavascriptRenderer.required} |\n` +
    `| Strict completion | ${gates.strictCompletion.accepted}/${gates.strictCompletion.required} |\n` +
    `| Atomic whole-lesson publication | false; ${gates.atomicWholeLessonPublication.admitted}/${gates.atomicWholeLessonPublication.required} admitted |\n\n` +
    `The current release ledger remains \`expected=47\`, \`strict=0\`, \`missing=47\`, \`assetMismatch=0\`, \`published=false\`; its atomic gate is closed. All registry, coverage adoption, baseline, RMSE, audio, review, ledger, integration, and publication mutation fields are false.\n\n` +
    `## Hash-bound evidence\n\n` +
    `| Artifact | SHA-256 | Mode | Bytes |\n| --- | --- | ---: | ---: |\n${evidenceRows}\n\n` +
    `Predecessor checkpoint SHA-256: \`${report.predecessor.sha256}\`. Acceptance effect: \`none\`.\n\n` +
    `## Remaining formal sequence\n\n` +
    report.remainingGates.map((item) => `- ${item}`).join("\n") + "\n";
}

async function writeImmutable(relativePath, contents) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const handle = await open(absolutePath, "wx", 0o444);
  try {
    await handle.writeFile(contents);
  } finally {
    await handle.close();
  }
  await chmod(absolutePath, 0o444);
}

export async function writeOrCheck(report, {check = false} = {}) {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(
      await readFile(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE), "utf8") === json,
      `${JSON_REPORT_RELATIVE} is stale`,
    );
    invariant(
      await readFile(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE), "utf8") === markdown,
      `${MARKDOWN_REPORT_RELATIVE} is stale`,
    );
    process.stdout.write(`${JSON_REPORT_RELATIVE}: pass\n`);
    process.stdout.write(`${MARKDOWN_REPORT_RELATIVE}: pass\n`);
    return;
  }
  await writeImmutable(JSON_REPORT_RELATIVE, json);
  await writeImmutable(MARKDOWN_REPORT_RELATIVE, markdown);
  process.stdout.write(`${JSON_REPORT_RELATIVE}: wrote ${Buffer.byteLength(json)} bytes\n`);
  process.stdout.write(`${MARKDOWN_REPORT_RELATIVE}: wrote ${Buffer.byteLength(markdown)} bytes\n`);
}

async function main() {
  const check = process.argv.includes("--check");
  invariant(
    process.argv.length === (check ? 3 : 2),
    "usage: node scripts/build-g4-l10-formal-migration-continuation-v1.mjs [--check]",
  );
  const report = await buildReport();
  await writeOrCheck(report, {check});
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
