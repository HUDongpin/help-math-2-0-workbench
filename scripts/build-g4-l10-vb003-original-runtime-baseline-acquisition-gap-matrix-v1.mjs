#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, lstat, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.json";
const GENERATOR_RELATIVE =
  "scripts/build-g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.mjs";

const ANIMATION_ID = "course-g04-l10-vb-003";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const SOURCE_SWF_SHA256 =
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d";

const FIXED_INPUTS = Object.freeze({
  prelaunchReadiness: Object.freeze({
    path: "reports/g4-l10-vb003-en-es-original-runtime-prelaunch-readiness-successor-v1.json",
    bytes: 21338,
    sha256: "fc5383a12fca2e39cee53ef789e2a81585119f1c4aaa83cd0dcb5af3cc608652",
    mode: "0444",
  }),
  languageAudioTechnicalBinding: Object.freeze({
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    bytes: 17024,
    sha256: "ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e",
    mode: "0644",
  }),
  rootKitEnManifest: Object.freeze({
    path: "work/root-capture-kits-v3/course-g04-l10-vb-003/req-default-root-en/kit-manifest.json",
    bytes: 6763,
    sha256: "c217a225043ab019b19b69f61eb626b32b9811f0dd78d1ddb5930b1d28997f9b",
    mode: "0444",
  }),
  rootKitEsManifest: Object.freeze({
    path: "work/root-capture-kits-v3/course-g04-l10-vb-003/req-default-root-es/kit-manifest.json",
    bytes: 6763,
    sha256: "1055a6f34269fcfaf7eb17391ed302d89cbddcca204f17755095a39ecc8a2bfc",
    mode: "0444",
  }),
  staticSpecificationReviewInput: Object.freeze({
    path: "reports/g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.json",
    bytes: 51883,
    sha256: "eeedc90efabd8a3e7bfc0910cf53e1c592c4122d35cfbaa33102a72a524329af",
    mode: "0444",
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "securityReviewAcceptance",
  "productionHelperImplementation",
  "productionHelperTesting",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "originalRuntimeEvidence",
  "baselineRequirementAdoption",
  "baselineAdoption",
  "specificationAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.mode, info.nlink, info.uid, info.gid,
    info.size, info.mtimeNs, info.ctimeNs].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  const record = {
    path: expected.path,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(before),
  };
  if (expected.bytes !== undefined) assert.equal(record.byteCount,
    expected.bytes, `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(record.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(record.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return record;
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function binding(record) {
  return {path: record.path, bytes: record.byteCount, sha256: record.sha256,
    mode: record.mode};
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function exactSet(rows) {
  const encodedRows = rows.map(({id, obligationClass, language,
    sourceIdentity, controlIdentity, evidenceMode}) => [id, obligationClass,
    language ?? "", sourceIdentity ?? "", controlIdentity ?? "", evidenceMode]
    .join("\t")).sort(compareText);
  assert.equal(new Set(encodedRows).size, encodedRows.length,
    "Baseline acquisition obligation rows are duplicated");
  return {
    count: encodedRows.length,
    sha256: sha256(Buffer.from(encodedRows.map((row) => `${row}\n`).join(""),
      "utf8")),
    encoding:
      "sorted-id-tab-class-tab-language-tab-sourceIdentity-tab-controlIdentity-tab-evidenceMode-newline-v1",
  };
}

function rootVisualKitSummary(manifest) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.artifactType,
    "root-frame-accurate-capture-operator-kit");
  assert.equal(manifest.status, "unsigned-template-only-not-evidence");
  assert.equal(manifest.notEvidence, true);
  assert.equal(manifest.animationId, ANIMATION_ID);
  assert.equal(manifest.frameDomain.id, "root");
  assert.equal(manifest.frameDomain.frameCount, 10);
  assert.deepEqual(manifest.frameDomain.nativeStage, {width: 800, height: 600});
  assert.equal(manifest.frameDomain.fps, 12);
  assert.deepEqual(manifest.acceptedProofModes,
    ["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"]);
  assert.deepEqual(manifest.expectedEvidenceCounts,
    {frames: 10, operationRecords: 10, displayListRecords: 10});
  assert.equal(manifest.stagedSource.staged.sha256, SOURCE_SWF_SHA256);
  assert.equal(manifest.evidenceProtocol.operatorReadiness.operatorReady, false);
  return {
    requirementId: manifest.requirementId,
    language: manifest.identity.language,
    frameDomainId: "root",
    traceId: manifest.identity.traceId,
    entryStateSha256: manifest.identity.entryStateSha256,
    frameRange: manifest.identity.requiredRange,
    frameCount: 10,
    nativeStage: {width: 800, height: 600},
    fps: 12,
    acceptedProofModes: manifest.acceptedProofModes,
    expectedEvidenceCounts: manifest.expectedEvidenceCounts,
    kitStatus: manifest.status,
    actualEvidenceCount: 0,
    authoritativeBaselineComplete: false,
    naturalTraceAudioOrInteractionCovered: false,
  };
}

export async function buildMatrix(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const generatorRecord = await stableRead(root, {path: GENERATOR_RELATIVE});
  const prelaunch = parseJson(fixedRecords.prelaunchReadiness);
  const audio = parseJson(fixedRecords.languageAudioTechnicalBinding);
  const enManifest = parseJson(fixedRecords.rootKitEnManifest);
  const esManifest = parseJson(fixedRecords.rootKitEsManifest);
  const specificationReviewInput = parseJson(
    fixedRecords.staticSpecificationReviewInput);

  assert.equal(prelaunch.status,
    "EXACT_EN_ES_V3_KITS_CURRENT_PRELAUNCH_CLOSED_LATEST_SECURITY_BATCH_INVALIDATED");
  assert.equal(prelaunch.scope.animationId, ANIMATION_ID);
  assert.equal(prelaunch.scope.exactCaptureKitCount, 2);
  assert.equal(prelaunch.readinessMatrix.originalRuntimeBaselineCount, 0);
  assert.equal(prelaunch.readinessMatrix.launchAuthorizedNow, false);
  assert.equal(prelaunch.latestSecurityReviewBoundary.reusable, false);
  assert.equal(audio.status,
    "source-static-candidate-and-obligation-binding-runtime-and-listening-unresolved");
  assert.equal(audio.animationId, ANIMATION_ID);
  assert.equal(audio.releaseId, RELEASE_ID);
  assert.equal(audio.summary.cueCandidateCount, 2);
  assert.equal(audio.summary.languageObligationCount, 2);
  assert.equal(audio.summary.hostAudioControlObligationCount, 2);
  assert.equal(audio.summary.interactionSynchronizationObligationCount, 3);
  assert.equal(audio.summary.adoptedCueCount, 0);
  assert.equal(audio.summary.spokenLanguageEstablishedCueCount, 0);
  assert.equal(audio.summary.runtimeReachabilityEstablishedCueCount, 0);
  assert.equal(audio.summary.acceptedCueCount, 0);
  assert.ok(Object.values(audio.formalEvidence).every((value) => value === false));
  assert.ok(Object.values(audio.acceptanceEffects).every((value) => value === false));
  assert.equal(specificationReviewInput.status,
    "review-input-frozen-no-task-authorization-no-review-verdict");

  const rootVisualKits = [enManifest, esManifest].map(rootVisualKitSummary);
  assert.deepEqual(rootVisualKits.map(({language}) => language), ["en", "es"]);

  const cueById = new Map(audio.cueCandidates.map((cue) =>
    [cue.cueCandidateId, cue]));
  const embeddedId = `${ANIMATION_ID}:embedded-stream-0001`;
  const externalId = `${ANIMATION_ID}:catalog-audio-01`;
  const embedded = cueById.get(embeddedId);
  const external = cueById.get(externalId);
  assert.equal(embedded.origin, "embedded-sound-stream");
  assert.equal(embedded.localFrameDomainId, "sprite-120");
  assert.equal(embedded.headFrame, 1);
  assert.equal(embedded.firstBlockFrame, 4);
  assert.equal(embedded.lastBlockFrame, 203);
  assert.equal(embedded.durationMs, 16640);
  assert.equal(embedded.spokenLanguage, null);
  assert.equal(embedded.runtimeCueTime, null);
  assert.equal(external.origin, "external-host-routed-mp3");
  assert.equal(external.routingLanguageCandidate, "es");
  assert.equal(external.durationMs, 15144);
  assert.equal(external.startSemantics, "host-user-activated");
  assert.equal(external.spokenLanguage, null);
  assert.equal(external.runtimeCueTime, null);

  const obligationAtoms = [];
  for (const languageRow of audio.languageObligations) {
    for (const cueCandidateId of languageRow.cueCandidateIds) {
      const cue = cueById.get(cueCandidateId);
      assert.ok(cue, `${languageRow.language}: cue candidate is absent`);
      obligationAtoms.push({
        id: `${languageRow.language}:cue:${cueCandidateId}`,
        obligationClass: "language-cue-natural-runtime-listening",
        language: languageRow.language,
        sourceIdentity: cue.source.sha256,
        controlIdentity: cue.localFrameDomainId
          ?? cue.hostDependency?.activationControlObjectId ?? null,
        evidenceMode: "authorized-original-runtime-natural-trace-plus-named-human-listening",
        cueCandidateId,
        spokenLanguageEstablished: false,
        runtimeReachabilityEstablished: false,
        synchronizationEstablished: false,
        accepted: false,
      });
    }
  }
  for (const control of audio.hostAudioControlObligations) {
    obligationAtoms.push({
      id: `es:host-control:${control.buttonObjectId}:${control.call}`,
      obligationClass: "host-audio-control-natural-trace",
      language: "es",
      sourceIdentity: control.bodySha256,
      controlIdentity: `${control.hostTimelineId}:${control.hostFrame}:${control.instanceName}:${control.buttonObjectId}`,
      evidenceMode: "authorized-original-runtime-natural-trace",
      event: control.event,
      call: control.call,
      completionResumeCondition: control.completionResumeCondition,
      runtimeInvocationEstablished: false,
      accepted: false,
    });
  }
  for (const control of audio.interactionSynchronizationObligations) {
    obligationAtoms.push({
      id: `both:interaction:${control.buttonObjectId}:${control.keyAttributeCandidate}`,
      obligationClass: "nested-interaction-stream-synchronization-natural-trace",
      language: "en+es",
      sourceIdentity: control.bodySha256,
      controlIdentity: `${control.frameDomainId}:${control.localFrame}:${control.buttonObjectId}`,
      evidenceMode: "authorized-original-runtime-natural-trace",
      event: control.event,
      keyAttributeCandidate: control.keyAttributeCandidate,
      streamSynchronizationEstablished: false,
      runtimeInvocationEstablished: false,
      accepted: false,
    });
  }
  for (const languageRow of audio.languageObligations) {
    assert.ok(languageRow.unresolved.includes("replay-reset-behavior"));
    obligationAtoms.push({
      id: `${languageRow.language}:replay-reset`,
      obligationClass: "language-replay-reset-natural-trace",
      language: languageRow.language,
      sourceIdentity: SOURCE_SWF_SHA256,
      controlIdentity: "replay-reset",
      evidenceMode: "authorized-original-runtime-natural-trace",
      completeStateVectorResetEstablished: false,
      audioResetEstablished: false,
      accepted: false,
    });
  }
  assert.equal(obligationAtoms.length, 10);
  assert.ok(obligationAtoms.every(({accepted}) => accepted === false));
  const exactObligationAtomSet = exactSet(obligationAtoms);

  const candidateNaturalTraceFamilies = [
    {
      id: "candidate-vb003-en-natural-trace-family",
      language: "en",
      candidateOnly: true,
      formalRequirementCreated: false,
      entryStateEstablishedByAuthorizedRuntime: false,
      orderedStepsEstablished: false,
      requiredObservationClasses: [
        "sprite-120-runtime-entry-and-203-local-frame-playback",
        "embedded-stream-runtime-reachability-spoken-content-and-synchronization",
        "three-glossary-or-hyperlink-stop-interactions",
        "replay-complete-state-and-audio-reset",
        "named-human-original-runtime-listening",
      ],
    },
    {
      id: "candidate-vb003-es-natural-trace-family",
      language: "es",
      candidateOnly: true,
      formalRequirementCreated: false,
      entryStateEstablishedByAuthorizedRuntime: false,
      orderedStepsEstablished: false,
      requiredObservationClasses: [
        "host-SA-release-loadSound-start-and-child-stop",
        "external-MP3-spoken-content-completion-and-conditional-child-resume",
        "host-EA-release-stop-and-conditional-child-resume",
        "embedded-stream-inclusion-or-exclusion-and-synchronization",
        "three-glossary-or-hyperlink-stop-interactions",
        "replay-complete-state-and-audio-reset",
        "named-human-original-runtime-listening",
      ],
    },
  ];

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1",
    status:
      "ROOT_VISUAL_KITS_CURRENT_NATURAL_TRACE_AUDIO_INTERACTION_ACQUISITIONS_ABSENT",
    decision:
      "DO_NOT_TREAT_TWO_ROOT_KITS_AS_COMPLETE_VB003_BASELINE_DO_NOT_LAUNCH",
    evidenceClass:
      "acceptance-neutral-source-static-baseline-acquisition-gap-analysis-not-runtime-evidence",
    purpose: [
      "Prove which exact VB003 baseline obligations are represented by the two current root-visual capture kits.",
      "Freeze the source-static audio, host-control, nested-interaction, and Replay acquisition gaps that require natural traces and named-human listening without inventing schedules or requirements.",
    ],
    scope: {
      releaseId: RELEASE_ID,
      animationId: ANIMATION_ID,
      sourceSwfSha256: SOURCE_SWF_SHA256,
      languages: ["en", "es"],
      currentRootVisualKitCount: rootVisualKits.length,
      currentNaturalTraceKitCount: 0,
      sourceStaticObligationAtomSet: exactObligationAtomSet,
      candidateNaturalTraceFamilyCount: candidateNaturalTraceFamilies.length,
      formalNaturalTraceRequirementCount: 0,
      authoritativeBaselineRequirementCount: 0,
    },
    generator: binding(generatorRecord),
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords).map(
      ([key, record]) => [key, binding(record)])),
    currentRootVisualKits: rootVisualKits,
    rootKitCoverageBoundary: {
      preparedRequirementIds: rootVisualKits.map(({requirementId}) =>
        requirementId),
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
    },
    sourceStaticObligationAtoms: obligationAtoms.sort((left, right) =>
      compareText(left.id, right.id)),
    candidateNaturalTraceFamilies,
    naturalTraceSpecificationBoundary: {
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
    },
    baselineCompleteness: {
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
    },
    currentGateBoundary: {
      latestSecurityBatchStatus:
        prelaunch.latestSecurityReviewBoundary.status,
      latestSecurityBatchReusable: false,
      peterHuOperatorActivated: false,
      launchAuthorizedNow: false,
      currentLaunchReceiptCount: 0,
      productionHelperImplemented: false,
      originalRuntimeLaunched: false,
      audioPlayedByThisReport: false,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      migrationWorkspaceWriteSupported: false,
      traceSpecificationWriteSupported: false,
      captureKitWriteSupported: false,
      helperImplementationSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
      baselineAdoptionSupported: false,
      specificationAdoptionSupported: false,
      rendererImplementationSupported: false,
      applySupported: false,
      recoverSupported: false,
      acceptanceSupported: false,
      releaseSupported: false,
      publicationSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never modify a capture kit, trace spec, migration workspace, source asset, helper, runtime, baseline, specification, renderer, acceptance, promotion, release, or publication artifact`,
    authorityEffects,
    nextPermittedAction:
      "Continue source-static derivation of VB003 natural-trace entry and ordered-action candidates without creating formal requirements or kits. Any formal acquisition, runtime launch, listening, baseline adoption, or specification adoption remains separately gated.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const matrixFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, matrixFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildMatrix(bundle.root);
  assert.equal(current.json, bundle.json,
    "VB003 baseline acquisition gap-matrix inputs changed after derivation");
}

export async function checkMatrix(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {
    path: REPORT_RELATIVE,
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "VB003 baseline acquisition gap-matrix report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    matrixFingerprintSha256: bundle.document.matrixFingerprintSha256,
    rootVisualKits: bundle.document.scope.currentRootVisualKitCount,
    obligationAtoms: bundle.document.scope.sourceStaticObligationAtomSet.count,
    candidateNaturalTraceFamilies:
      bundle.document.scope.candidateNaturalTraceFamilyCount,
    formalNaturalTraceRequirements:
      bundle.document.scope.formalNaturalTraceRequirementCount,
    authoritativeBaselineRequirements:
      bundle.document.scope.authoritativeBaselineRequirementCount,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    acceptanceEffect: false,
  };
}

export async function publishMatrixNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkMatrix(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildMatrix(projectRoot);
  if (mode === "--write-no-clobber") return publishMatrixNoClobber(bundle);
  if (mode === "--check") return checkMatrix(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    matrixFingerprintSha256: bundle.document.matrixFingerprintSha256,
    rootVisualKits: bundle.document.scope.currentRootVisualKitCount,
    obligationAtoms: bundle.document.scope.sourceStaticObligationAtomSet.count,
    candidateNaturalTraceFamilies:
      bundle.document.scope.candidateNaturalTraceFamilyCount,
    formalNaturalTraceRequirements:
      bundle.document.scope.formalNaturalTraceRequirementCount,
    authoritativeBaselineRequirements:
      bundle.document.scope.authoritativeBaselineRequirementCount,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
