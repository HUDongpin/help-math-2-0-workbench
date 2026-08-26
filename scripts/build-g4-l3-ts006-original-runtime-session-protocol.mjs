#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-ts006-original-runtime-session-protocol-draft";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);
const ANIMATION_ID = "course-g04-l03-ts-006";
const SHA256 = /^[a-f0-9]{64}$/;
const SAME_LESSON_SHELL_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const SPANISH_NARRATION_MP3_SHA256 = "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688";
const SPANISH_NARRATION_CONTROL = Object.freeze({
  label: "En esta p\u00e1gina",
  timelineId: "root",
  frame: 49,
  instanceName: "SA",
  buttonObjectId: "217",
  hitShapeObjectId: "212",
  depth: "202",
  nativeStagePoint: Object.freeze({x: 699, y: 95}),
  nativeStageBounds: Object.freeze({left: 633.9, right: 762.65, top: 84.4, bottom: 106.4}),
  actionScript: "DefineButton2_217/BUTTONCONDACTION on(release).as",
  actionScriptBodySha256: "3a1f4f0b8803ee1c00cd733ff84fbb275949c35d2ab452f79511d06416113a29",
  callee: "_root.doPlaySpanishAudio",
});

const INPUTS = Object.freeze([
  ["runtimeAcquisitionContract", "reports/g4-l3-authoritative-runtime-acquisition-contract.json", "reportType", "g4-l3-authoritative-runtime-acquisition-contract"],
  ["workspaceSourceAudit", "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-source-audit.json", "artifactType", "g4-l3-workspace-source-audit"],
  ["animateAuthoringAudit", "work/animate/dependency-authoring-audits/course-g04-l03-ts-006/runs/run-tkpM0N/L3TS06.fla-authoring-audit.json", "evidenceKind", "adobe-animate-authoring-audit"],
  ["embeddedAudioArchive", "reports/g4-l3-embedded-audio-archive.json", "reportType", "g4-l3-embedded-audio-archive"],
  ["catalogAudioMediaProbe", "reports/g4-l3-catalog-audio-media-probe.json", "reportType", "g4-l3-catalog-audio-technical-media-probe"],
  ["sameLessonShellScenarioInventory", "migrations/shell-course-g04-l03-index-local/audit/scenario-inventory.json", "animationId", "shell-course-g04-l03-index-local"],
  ["readOnlyHostTree", "work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json", "reportType", "g4-l3-ts006-read-only-original-runtime-host-tree"],
  ["runtimeEnvironment", "reports/g4-l3-original-runtime-environment-readiness.json", "reportType", "g4-l3-original-runtime-environment-readiness"],
  ["runtimeContainment", "reports/g4-l3-original-runtime-containment-readiness.json", "reportType", "g4-l3-original-runtime-containment-readiness"],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exactlyOne(items, label) {
  invariant(Array.isArray(items) && items.length === 1, `${label}: expected exactly one item, observed ${Array.isArray(items) ? items.length : "non-array"}`);
  return items[0];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function identitySha256(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value))));
}

function relative(file) {
  const candidate = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

async function physicalBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), bytes: bytes.length, sha256: sha256(bytes)};
}

async function readInputs() {
  const reports = {};
  const bindings = {};
  for (const [key, file, identityKey, identityValue] of INPUTS) {
    const absolute = path.join(ROOT, ...file.split("/"));
    const bytes = await readFile(absolute);
    const report = JSON.parse(bytes);
    invariant(report.schemaVersion === 1 && report[identityKey] === identityValue,
      `${key}: input identity drifted`);
    reports[key] = report;
    bindings[key] = {
      file,
      bytes: bytes.length,
      sha256: sha256(bytes),
      schemaVersion: report.schemaVersion,
      [identityKey]: identityValue,
    };
  }
  return {reports, bindings};
}

function timelineKeyframe(timeline, layerName, flashFrame) {
  return timeline.layers.find((layer) => layer.name === layerName)?.keyframes
    .find((frame) => frame.flashFrame === flashFrame);
}

function libraryItem(authoring, name) {
  return authoring.library.find((item) => item.name === name);
}

function buildTraceCandidate({language, runtimeEnvironment, hostTree}) {
  const entryStateCandidate = {
    animationId: ANIMATION_ID,
    hostEntryCandidate: "HELP_COURSES/ELMGR4/L3/index_local.swf",
    hostTreeFileSetSha256: hostTree.fileSetSha256,
    language,
    originalRuntimeExecutableSha256: runtimeEnvironment.installedRuntimeCandidate.executable.sha256,
    profilePolicy: "fresh-disposable-profile-required-not-yet-bound",
    scenario: "natural-same-lesson-host-entry",
    seedPolicy: "no-static-random-call-candidate-natural-observation-still-required",
    sourceSwfSha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
  };
  return {
    protocolTraceCandidateId: `candidate:course-g04-l03-ts-006:natural-host-entry:${language}`,
    language,
    scenarioCandidate: "natural-same-lesson-host-entry",
    entryStateCandidate,
    entryStateCandidateSha256: identitySha256(entryStateCandidate),
    seedCandidate: null,
    authoritativeTraceId: null,
    authoritativeRequirementIds: [],
    eventScheduleAccepted: false,
    captureScheduleAccepted: false,
    naturalExecutionProved: false,
    status: "draft-candidate-not-authorized-not-executed",
  };
}

export async function buildTs006OriginalRuntimeSessionProtocol() {
  const {reports, bindings} = await readInputs();
  const contract = reports.runtimeAcquisitionContract;
  const sourceAudit = reports.workspaceSourceAudit;
  const authoring = reports.animateAuthoringAudit;
  const embeddedAudio = reports.embeddedAudioArchive;
  const catalogAudio = reports.catalogAudioMediaProbe;
  const sameLessonShellInventory = reports.sameLessonShellScenarioInventory;
  const hostTree = reports.readOnlyHostTree;
  const runtimeEnvironment = reports.runtimeEnvironment;
  const containment = reports.runtimeContainment;

  const item = contract.items.find((candidate) => candidate.animationId === ANIMATION_ID);
  invariant(item?.source.swf.sha256 === "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"
    && item.source.fla.sha256 === "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd"
    && item.authoringGate.authoringAuditEstablished === true
    && item.acquisitionRequirements.randomCandidate === false
    && item.runtimeContainmentPrerequisite.exactExternalOperationCount === 0,
  "TS006 contract identity or selection facts drifted");
  invariant(sourceAudit.identity.animationId === ANIMATION_ID
    && sourceAudit.machineFindings.runtime.rootFrameCount === 10
    && sourceAudit.machineFindings.runtime.fps === 12
    && sourceAudit.machineFindings.scripts.exportedScriptFileCount === 3
    && sourceAudit.machineFindings.scripts.signals[0].id === "timeline-navigation"
    && sourceAudit.machineFindings.scripts.signals[0].occurrences === 4
    && sourceAudit.machineFindings.scripts.random.occurrences === 0
    && sourceAudit.machineFindings.scripts.externalApiCandidates.length === 0,
  "TS006 static source audit drifted");
  invariant(authoring.document.name === "L3TS06.fla"
    && authoring.document.width === 800 && authoring.document.height === 600
    && authoring.document.frameRate === 12 && authoring.document.backgroundColor === "#B8D8F7"
    && authoring.timeline.frameCount === 10 && authoring.timeline.layerCount === 5
    && authoring.recursiveLibraryTimelineAudit === true,
  "TS006 work-only Animate audit drifted");

  const rootFrame1Action = timelineKeyframe(authoring.timeline, "action", 1);
  const rootFrame6Action = timelineKeyframe(authoring.timeline, "action", 6);
  const rootFrame6Label = timelineKeyframe(authoring.timeline, "label", 6);
  const rootFrame6Text = timelineKeyframe(authoring.timeline, "text", 6);
  const rootFrame6Heading = timelineKeyframe(authoring.timeline, "headings", 6);
  const animation03 = libraryItem(authoring, "Animation03");
  const pageTitle = libraryItem(authoring, "Mc_Page_Title");
  invariant(rootFrame1Action?.actionScript.replace(/\r/g, "")
      === `_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();\n`
    && rootFrame6Action?.actionScript.replace(/\r/g, "") === "stop();"
    && rootFrame6Label?.name === "begin"
    && rootFrame6Text?.elements[0]?.name === "animation"
    && rootFrame6Text.elements[0].libraryItemName === "Animation03"
    && rootFrame6Heading?.elements[0]?.name === "Mc_Page_Title"
    && animation03?.itemType === "movie clip" && animation03.timeline.frameCount === 128
    && pageTitle?.itemType === "movie clip" && pageTitle.timeline.frameCount === 1,
  "TS006 root-to-nested authoring placement facts drifted");
  const nestedFrame1Sound = animation03.timeline.layers.flatMap((layer) => layer.keyframes)
    .find((frame) => frame.flashFrame === 1 && frame.soundName === "LTS06");
  const nestedFrame128Stop = animation03.timeline.layers.flatMap((layer) => layer.keyframes)
    .find((frame) => frame.flashFrame === 128 && /stop\s*\(\s*\)/.test(frame.actionScript));
  const guideButtonLayers = animation03.timeline.layers.filter((layer) =>
    layer.layerType === "guide" && layer.keyframes.some((frame) => frame.elements.some((element) =>
      element.symbolType === "button")));
  invariant(nestedFrame1Sound?.soundSync === "stream" && nestedFrame1Sound.duration === 127
    && nestedFrame128Stop
    && guideButtonLayers.length === 1,
  "TS006 nested Animation03 authoring facts drifted");

  const embeddedItem = embeddedAudio.items.find((candidate) => candidate.animationId === ANIMATION_ID);
  const stream = embeddedItem?.embeddedAudio.soundStreams[0];
  invariant(embeddedItem?.embeddedAudio.tagCounts.SoundStreamHead === 1
    && embeddedItem.embeddedAudio.tagCounts.SoundStreamBlock === 128
    && stream?.ownerDomainId === "sprite-23" && stream.headLocalFrame === 1
    && stream.blockCount === 128 && stream.head.format === "mp3"
    && stream.head.sampleRateHz === 22050 && stream.head.channels === 1
    && stream.payload.sha256 === "4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122"
    && stream.payload.archiveWritten === true && stream.payload.physicalHashVerified === true
    && stream.cueMappingEstablished === false && stream.runtimeSynchronizationEstablished === false,
  "TS006 embedded stream audit drifted or was promoted");
  const spanishProbe = catalogAudio.probes.find((candidate) =>
    candidate.source?.sha256 === "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688");
  invariant(spanishProbe?.source.path.endsWith("/L3TS06.mp3")
    && spanishProbe.source.normalizedLanguageCandidate === "es"
    && spanishProbe.probe.status === "ffprobe-parsed-ffmpeg-decode-check-passed"
    && spanishProbe.probe.media.timing.durationSeconds === 7.632
    && spanishProbe.probe.media.audio.sampleRateHz === 48000
    && spanishProbe.probe.media.audio.channels === 1
    && spanishProbe.evidenceLimits.spokenLanguageEstablished === false
    && spanishProbe.evidenceLimits.runtimeSynchronizationEstablished === false,
  "TS006 catalog Spanish audio candidate drifted or was promoted");
  const spanishNarrationHandler = exactlyOne(
    (sameLessonShellInventory.interactions?.handlers || [])
      .filter((handler) => handler.script === SPANISH_NARRATION_CONTROL.actionScript),
    "same-lesson Shell Spanish narration handler",
  );
  const spanishNarrationPlacement = exactlyOne(
    (spanishNarrationHandler.hitTarget?.placements || []).filter((placement) => (
      placement.timelineId === SPANISH_NARRATION_CONTROL.timelineId
      && placement.frame === SPANISH_NARRATION_CONTROL.frame
      && placement.name === SPANISH_NARRATION_CONTROL.instanceName
      && placement.objectId === SPANISH_NARRATION_CONTROL.buttonObjectId
      && placement.depth === SPANISH_NARRATION_CONTROL.depth
    )),
    "same-lesson Shell Spanish narration placement",
  );
  const spanishNarrationHitRecord = exactlyOne(
    (spanishNarrationHandler.hitTarget?.hitRecords || [])
      .filter((record) => record.shapeObjectId === SPANISH_NARRATION_CONTROL.hitShapeObjectId),
    "same-lesson Shell Spanish narration hit record",
  );
  const shellFfdecBinding = exactlyOne(
    (sameLessonShellInventory.evidenceIndex || []).filter((item) => item.artifactId === "ffdec-scripts"),
    "same-lesson Shell FFDec binding",
  );
  const shellSwfmillBinding = exactlyOne(
    (sameLessonShellInventory.evidenceIndex || []).filter((item) => item.artifactId === "swfmill-xml"),
    "same-lesson Shell swfmill binding",
  );
  invariant(sameLessonShellInventory.source?.swfSha256 === SAME_LESSON_SHELL_SHA256
    && spanishNarrationHandler.bodySha256 === SPANISH_NARRATION_CONTROL.actionScriptBodySha256
    && spanishNarrationHandler.scope?.objectId === SPANISH_NARRATION_CONTROL.buttonObjectId
    && spanishNarrationHandler.event?.length === 1 && spanishNarrationHandler.event[0] === "release"
    && spanishNarrationHandler.signals?.calls?.length === 1
    && spanishNarrationHandler.signals.calls[0].target === SPANISH_NARRATION_CONTROL.callee
    && spanishNarrationPlacement.objectId === SPANISH_NARRATION_CONTROL.buttonObjectId
    && spanishNarrationHitRecord.shapeObjectId === SPANISH_NARRATION_CONTROL.hitShapeObjectId
    && shellFfdecBinding.sha256 === "c837d68c69d82cf025b9775a66f26ebb4f5a76dfb7e4d06eee43aaffce4d04f7"
    && shellSwfmillBinding.sha256 === "f16d30d4ba6f3ce7c8c6588c50f01534d60d3cb5847a7d55c7ebf5633a9c53de",
  "Same-lesson Shell Spanish narration source facts drifted");
  const requiredHostPaths = [
    "HELP_COURSES/ELMGR4/L3/index_local.swf",
    "HELP_COURSES/ELMGR4/L3/index.xml",
    "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf",
    "HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
  ];
  const stagedShell = hostTree.files.find((file) => file.path === requiredHostPaths[0]);
  const stagedSpanishNarration = hostTree.files.find((file) => file.path === requiredHostPaths[3]);
  invariant(hostTree.summary.files === 657 && hostTree.summary.bytes === 35_469_789
    && hostTree.executionGate.cr02TechnicalArtifactPrepared === true
    && hostTree.executionGate.cr02Approved === false
    && requiredHostPaths.every((required) => hostTree.files.some((file) => file.path === required))
    && stagedShell?.sha256 === SAME_LESSON_SHELL_SHA256
    && stagedShell.bytes === 657_421
    && stagedSpanishNarration?.sha256 === SPANISH_NARRATION_MP3_SHA256
    && stagedSpanishNarration.bytes === 106_848,
  "TS006 read-only host tree drifted or was promoted");
  invariant(runtimeEnvironment.summary.installedRuntimeCandidates === 1
    && runtimeEnvironment.executionGate.originalRuntimeExecutionReady === false
    && containment.summary.containmentControlsSpecified === 8
    && containment.summary.containmentControlsApproved === 0
    && containment.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime environment or containment gate was promoted");

  const traceCandidates = ["en", "es"].map((language) =>
    buildTraceCandidate({language, runtimeEnvironment, hostTree}));
  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator: await physicalBinding(GENERATOR_PATH),
    scope: {
      releaseId: contract.lesson.releaseId,
      animationId: ANIMATION_ID,
      purpose: "reviewable first-session protocol draft only",
      runtimeSessionsExecuted: 0,
      animateDocumentsOpened: 0,
    },
    sourceBindings: bindings,
    sourceFacts: {
      stage: {width: 800, height: 600, backgroundColor: "#B8D8F7"},
      fps: 12,
      rootTimeline: {
        frameCount: 10,
        frame1ActionScript: rootFrame1Action.actionScript.replace(/\r/g, ""),
        frame6Label: rootFrame6Label.name,
        frame6ActionScript: rootFrame6Action.actionScript.replace(/\r/g, ""),
        frame6Placements: [
          {instanceName: "animation", libraryItemName: "Animation03", frameCount: 128},
          {instanceName: "Mc_Page_Title", libraryItemName: "Mc_Page_Title", frameCount: 1},
        ],
        naturalReachabilityEstablished: false,
      },
      nestedTimelineCandidates: [
        {
          frameDomainCandidateId: "sprite-3",
          authoringLibraryItemName: "Mc_Page_Title",
          declaredFrameCount: 1,
          disposition: "static-root-placement-candidate-runtime-disposition-unresolved",
        },
        {
          frameDomainCandidateId: "sprite-23",
          authoringLibraryItemName: "Animation03",
          declaredFrameCount: 128,
          frame1SoundName: "LTS06",
          frame1SoundSync: "stream",
          terminalStopFrame: 128,
          guideOnlyButtonLayerCount: guideButtonLayers.length,
          guideButtonsAreRuntimeControlsEstablished: false,
          disposition: "static-root-placement-candidate-runtime-disposition-unresolved",
        },
      ],
      actionScriptSignals: {
        exportedScriptFiles: 3,
        timelineNavigationOperations: 4,
        randomCallCandidates: 0,
        exactExternalOperationCandidates: 0,
        runtimeReachabilityEstablished: false,
      },
      audioCandidates: {
        embedded: {
          ownerDomainCandidate: "sprite-23",
          streamHeadFrame: 1,
          streamBlocks: 128,
          codec: "mp3",
          sampleRateHz: 22050,
          channels: 1,
          payloadBytes: stream.payload.byteLength,
          payloadSha256: stream.payload.sha256,
          durationMsTechnicalProbe: 10_582,
          languageEstablished: false,
          cueAndSynchronizationEstablished: false,
        },
        catalogSpanishCandidate: {
          path: spanishProbe.source.path,
          bytes: spanishProbe.source.bytes,
          sha256: spanishProbe.source.sha256,
          durationMsTechnicalProbe: 7_632,
          sampleRateHz: 48_000,
          channels: 1,
          languageCandidate: "es",
          spokenLanguageEstablished: false,
          cueAndSynchronizationEstablished: false,
        },
      },
      pageSpanishNarrationControl: {
        label: SPANISH_NARRATION_CONTROL.label,
        timelineId: SPANISH_NARRATION_CONTROL.timelineId,
        frame: SPANISH_NARRATION_CONTROL.frame,
        instanceName: SPANISH_NARRATION_CONTROL.instanceName,
        buttonObjectId: SPANISH_NARRATION_CONTROL.buttonObjectId,
        hitShapeObjectId: SPANISH_NARRATION_CONTROL.hitShapeObjectId,
        depth: SPANISH_NARRATION_CONTROL.depth,
        nativeStagePoint: SPANISH_NARRATION_CONTROL.nativeStagePoint,
        nativeStageBounds: SPANISH_NARRATION_CONTROL.nativeStageBounds,
        releaseHandler: SPANISH_NARRATION_CONTROL.actionScript,
        releaseHandlerBodySha256: SPANISH_NARRATION_CONTROL.actionScriptBodySha256,
        callee: SPANISH_NARRATION_CONTROL.callee,
        expectedSourceStateTransition: {
          SAVisible: false,
          SA_PLAYVisible: false,
          SA_PAUSEVisible: true,
          spanSound: true,
          childTimeline: "stopped-until-source-onSoundComplete",
        },
        sameLessonShellSha256: SAME_LESSON_SHELL_SHA256,
        spanishNarrationAudioCandidateSha256: SPANISH_NARRATION_MP3_SHA256,
        staticSourceOnly: true,
        successfulLoadAudibilitySpokenLanguageSynchronizationEstablished: false,
      },
    },
    hostCandidate: {
      state: "read-only-tree-prepared-host-context-not-authorized",
      stagedRoot: hostTree.stagedRoot,
      fileSetSha256: hostTree.fileSetSha256,
      requiredPaths: requiredHostPaths.map((required) => {
        const file = hostTree.files.find((candidate) => candidate.path === required);
        return {path: required, bytes: file.bytes, sha256: file.sha256, mode: file.stagedMode};
      }),
      exactOwnPageExternalOperationCandidates: 0,
      lessonShellExternalOperationCandidates: 20,
      hostContextAuthorityEstablished: false,
    },
    traceCandidates,
    proposedProtocol: {
      state: "draft-not-scheduled-not-authorized",
      directSeekAllowed: false,
      freshRuntimeProcessPerLanguageRequired: true,
      sameLessonHostNaturalEntryRequired: true,
      frameDomainsToDispose: ["root", "sprite-3", "sprite-23"],
      declaredFrameCapacityEnvelope: {
        framesPerLanguage: 139,
        languages: 2,
        originalRuntimePngUpperBound: 278,
        futureThreeRolePngUpperBound: 834,
        naturalReachabilityMustBeObservedRatherThanAssumed: true,
      },
      steps: [
        {stepId: "P00", kind: "preflight", instruction: "Before any launch, recheck all bound hashes, live free space, approved no-egress control, approved read-only local dependency allowlist, fresh disposable profile, empty SharedObject store, authorized host context, owner decision, and named original-runtime operator; abort if any field is absent or differs."},
        {stepId: "P01", kind: "fresh-process", instruction: "In one fresh runtime process for the selected language, use only the authorized staged lesson-shell host entry; do not directly open L3TS06.swf and do not use direct seek."},
        {stepId: "P02", kind: "natural-page-entry", instruction: "Enter TS006 through the same-lesson host path before invoking any page-language audio control. Record root frame 1, the InternalPreloader jump_check request, the host response, and the natural transition or lack of transition to the frame-6 begin label; do not invent a pre-entry host-language selector."},
        {stepId: "P03", kind: "page-language-audio", instruction: "After natural TS006 entry, in the Spanish session release the orange En esta p\u00e1gina control at native-stage point (699,95), inside the source-derived bounds left 633.9/right 762.65/top 84.4/bottom 106.4. Resolve Shell root frame 49 instance SA, button object 217, hit shape 212, depth 202; record the source-expected SA_PLAY to SA_PAUSE transition and the actual load, audibility, spoken language, synchronization, onSoundComplete, and resume outcome. In the English session, record the naturally reached English/audio state without fabricating a pre-entry selector."},
        {stepId: "P04", kind: "frame-domain-disposition", instruction: "Record whether root-placed sprite-3/Mc_Page_Title and sprite-23/Animation03 are instantiated, their entry states, parent/root frame, and every naturally reached local frame without relabeling either nested timeline as the root timeline."},
        {stepId: "P05", kind: "natural-playback", instruction: "If sprite-23 is naturally reached, capture its ordered frame/state chain through declared frame 128 and the terminal stop. Record all observed root frames; leave unobserved declared root frames unresolved."},
        {stepId: "P06", kind: "audio", instruction: "Record the actual audio asset, start/stop time, owner frame domain, cue, synchronization, and language. Listen to the complete path; do not infer language or cue from filenames or technical probes."},
        {stepId: "P07", kind: "replay", instruction: "At the observed terminal state, invoke Replay only through the host-native control and record a complete reset of root, nested playheads, audio, language, and navigation state followed by a second natural terminal state."},
        {stepId: "P08", kind: "navigation", instruction: "Exercise Previous and Next only through the host-native controls, record destinations and state effects, return naturally to TS006, and verify a fresh entry state."},
        {stepId: "P09", kind: "close", instruction: "Close the runtime completely, record the process/session receipt and post-session no-egress/SharedObject checks, then repeat P00-P09 in a new process for the other language."},
      ],
      requiredOutputs: [
        "owner/runtime authorization record",
        "named operator and authorized-host attestation",
        "live capacity preflight",
        "runtime process and executable receipt",
        "ordered host event and state hash chain",
        "one-indexed root and nested frame ledger",
        "native 800x600 PNG manifest with per-file hashes",
        "English and Spanish audio cue/synchronization/listening records",
        "Replay and Previous/Next behavior record",
        "no-egress, disposable-profile, and empty-SharedObject verification",
        "complete-process-exit receipt",
      ],
      outputFilesCreated: 0,
      authoritativeScheduleEstablished: false,
    },
    controls: {
      requiredControlIds: containment.containmentPlan.controls.map((control) => control.controlId),
      technicallyPreparedControlIds: ["CR-02"],
      selectedMechanisms: [],
      approvedControlIds: [],
      verifiedControlIds: [],
      allowedOutboundDestinations: [],
      legacyEndpointAllowlist: [],
      abortConditions: [
        "unexpected dialog",
        "unallowlisted network or resource request",
        "browser/javascript navigation or host command",
        "hash, executable, host-tree, source, or capacity drift",
        "non-empty SharedObject store or reused runtime profile",
      ],
    },
    executionGate: {
      state: "closed-protocol-draft-prepared-not-authorized",
      sourceAndAuthoringFactsBound: true,
      twoLanguageTraceCandidatesPrepared: true,
      readOnlyCR02ArtifactBound: true,
      protocolDraftPrepared: true,
      ownerRuntimeApprovalBound: false,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedHostContextIdentified: false,
      containmentMechanismsSelected: false,
      containmentControlsApproved: false,
      traceScheduleAccepted: false,
      liveCapacityPreflightPassed: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisBuilder: false,
      launchesAnimateByThisBuilder: false,
    },
    summary: {
      traceCandidatesPrepared: traceCandidates.length,
      languages: 2,
      protocolSteps: 10,
      requiredOutputs: 11,
      frameDomainCandidates: 3,
      containmentControlsRequired: 8,
      containmentControlsTechnicallyPrepared: 1,
      containmentControlsApproved: 0,
      schedulesAccepted: 0,
      namedOperators: 0,
      authorizedHosts: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      strictCompletions: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      reviewableProtocolDraftPrepared: true,
      sourceAssetsModified: false,
      migrationManifestModified: false,
      runtimeApproved: false,
      containmentApproved: false,
      scheduleAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This artifact is a deterministic, reviewable operator-protocol draft derived from static source, work-only Animate authoring, audio-probe, installed-runtime, containment, and read-only host-tree evidence. It launches nothing and creates no operator identity, approval, accepted schedule, runtime observation, baseline, audio acceptance, fidelity, parity, or migration completion.",
    },
  };
  return validateTs006OriginalRuntimeSessionProtocol(report);
}

export function validateTs006OriginalRuntimeSessionProtocol(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME
    && report.scope.animationId === ANIMATION_ID
    && Object.keys(report.sourceBindings).length === INPUTS.length,
  "TS006 protocol identity, scope, or input count drifted");
  invariant(report.sourceFacts.stage.width === 800 && report.sourceFacts.stage.height === 600
    && report.sourceFacts.fps === 12 && report.sourceFacts.rootTimeline.frameCount === 10
    && report.sourceFacts.rootTimeline.frame6Label === "begin"
    && report.sourceFacts.rootTimeline.frame6Placements[0].frameCount === 128
    && report.sourceFacts.rootTimeline.frame6Placements[1].frameCount === 1
    && report.sourceFacts.rootTimeline.naturalReachabilityEstablished === false
    && report.sourceFacts.nestedTimelineCandidates.map((item) => item.declaredFrameCount).join("|") === "1|128"
    && report.sourceFacts.nestedTimelineCandidates.every((item) => item.disposition.endsWith("unresolved"))
    && report.sourceFacts.actionScriptSignals.randomCallCandidates === 0
    && report.sourceFacts.actionScriptSignals.exactExternalOperationCandidates === 0
    && report.sourceFacts.actionScriptSignals.runtimeReachabilityEstablished === false,
  "TS006 protocol source facts drifted or were promoted");
  invariant(report.sourceFacts.audioCandidates.embedded.streamBlocks === 128
    && report.sourceFacts.audioCandidates.embedded.payloadSha256
      === "4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122"
    && report.sourceFacts.audioCandidates.embedded.languageEstablished === false
    && report.sourceFacts.audioCandidates.embedded.cueAndSynchronizationEstablished === false
    && report.sourceFacts.audioCandidates.catalogSpanishCandidate.sha256
      === "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688"
    && report.sourceFacts.audioCandidates.catalogSpanishCandidate.durationMsTechnicalProbe === 7_632
    && report.sourceFacts.audioCandidates.catalogSpanishCandidate.spokenLanguageEstablished === false,
  "TS006 protocol audio candidates drifted or were promoted");
  const pageSpanishNarrationControl = report.sourceFacts.pageSpanishNarrationControl;
  invariant(pageSpanishNarrationControl.label === SPANISH_NARRATION_CONTROL.label
    && pageSpanishNarrationControl.timelineId === SPANISH_NARRATION_CONTROL.timelineId
    && pageSpanishNarrationControl.frame === SPANISH_NARRATION_CONTROL.frame
    && pageSpanishNarrationControl.instanceName === SPANISH_NARRATION_CONTROL.instanceName
    && pageSpanishNarrationControl.buttonObjectId === SPANISH_NARRATION_CONTROL.buttonObjectId
    && pageSpanishNarrationControl.hitShapeObjectId === SPANISH_NARRATION_CONTROL.hitShapeObjectId
    && pageSpanishNarrationControl.depth === SPANISH_NARRATION_CONTROL.depth
    && identitySha256(pageSpanishNarrationControl.nativeStagePoint) === identitySha256(SPANISH_NARRATION_CONTROL.nativeStagePoint)
    && identitySha256(pageSpanishNarrationControl.nativeStageBounds) === identitySha256(SPANISH_NARRATION_CONTROL.nativeStageBounds)
    && pageSpanishNarrationControl.releaseHandlerBodySha256 === SPANISH_NARRATION_CONTROL.actionScriptBodySha256
    && pageSpanishNarrationControl.callee === SPANISH_NARRATION_CONTROL.callee
    && pageSpanishNarrationControl.expectedSourceStateTransition.SA_PLAYVisible === false
    && pageSpanishNarrationControl.expectedSourceStateTransition.SA_PAUSEVisible === true
    && pageSpanishNarrationControl.sameLessonShellSha256 === SAME_LESSON_SHELL_SHA256
    && pageSpanishNarrationControl.spanishNarrationAudioCandidateSha256 === SPANISH_NARRATION_MP3_SHA256
    && pageSpanishNarrationControl.staticSourceOnly === true
    && pageSpanishNarrationControl.successfulLoadAudibilitySpokenLanguageSynchronizationEstablished === false,
  "TS006 page Spanish narration control drifted or was promoted");
  invariant(report.hostCandidate.state === "read-only-tree-prepared-host-context-not-authorized"
    && SHA256.test(report.hostCandidate.fileSetSha256)
    && report.hostCandidate.requiredPaths.length === 4
    && report.hostCandidate.requiredPaths.every((item) => SHA256.test(item.sha256) && item.mode === "0444")
    && report.hostCandidate.exactOwnPageExternalOperationCandidates === 0
    && report.hostCandidate.lessonShellExternalOperationCandidates === 20
    && report.hostCandidate.hostContextAuthorityEstablished === false,
  "TS006 protocol host candidate drifted or was promoted");
  invariant(report.traceCandidates.length === 2
    && report.traceCandidates.map((candidate) => candidate.language).join("|") === "en|es"
    && report.traceCandidates.every((candidate) => SHA256.test(candidate.entryStateCandidateSha256)
      && candidate.entryStateCandidateSha256 === identitySha256(candidate.entryStateCandidate)
      && candidate.authoritativeTraceId === null
      && candidate.authoritativeRequirementIds.length === 0
      && candidate.eventScheduleAccepted === false
      && candidate.captureScheduleAccepted === false
      && candidate.naturalExecutionProved === false
      && candidate.status === "draft-candidate-not-authorized-not-executed"),
  "TS006 protocol trace candidates drifted or were promoted");
  const protocolP02 = report.proposedProtocol.steps.find((step) => step.stepId === "P02");
  const protocolP03 = report.proposedProtocol.steps.find((step) => step.stepId === "P03");
  invariant(report.proposedProtocol.state === "draft-not-scheduled-not-authorized"
    && report.proposedProtocol.directSeekAllowed === false
    && report.proposedProtocol.freshRuntimeProcessPerLanguageRequired === true
    && report.proposedProtocol.sameLessonHostNaturalEntryRequired === true
    && report.proposedProtocol.frameDomainsToDispose.join("|") === "root|sprite-3|sprite-23"
    && report.proposedProtocol.declaredFrameCapacityEnvelope.framesPerLanguage === 139
    && report.proposedProtocol.declaredFrameCapacityEnvelope.originalRuntimePngUpperBound === 278
    && report.proposedProtocol.steps.length === 10
    && report.proposedProtocol.steps.map((step) => step.stepId).join("|")
      === "P00|P01|P02|P03|P04|P05|P06|P07|P08|P09"
    && protocolP02.kind === "natural-page-entry"
    && protocolP02.instruction.includes("before invoking any page-language audio control")
    && protocolP02.instruction.includes("do not invent a pre-entry host-language selector")
    && protocolP03.kind === "page-language-audio"
    && protocolP03.instruction.includes("After natural TS006 entry")
    && protocolP03.instruction.includes("(699,95)")
    && protocolP03.instruction.includes("button object 217, hit shape 212, depth 202")
    && !report.proposedProtocol.steps.some((step) => step.kind === "host-language")
    && report.proposedProtocol.requiredOutputs.length === 11
    && report.proposedProtocol.outputFilesCreated === 0
    && report.proposedProtocol.authoritativeScheduleEstablished === false,
  "TS006 proposed protocol drifted or was promoted");
  invariant(report.controls.requiredControlIds.join("|") === "CR-01|CR-02|CR-03|CR-04|CR-05|CR-06|CR-07|CR-08"
    && report.controls.technicallyPreparedControlIds.join("|") === "CR-02"
    && report.controls.selectedMechanisms.length === 0
    && report.controls.approvedControlIds.length === 0
    && report.controls.verifiedControlIds.length === 0
    && report.controls.allowedOutboundDestinations.length === 0,
  "TS006 protocol controls drifted or were approved");
  const allowedTrueGateKeys = new Set([
    "sourceAndAuthoringFactsBound",
    "twoLanguageTraceCandidatesPrepared",
    "readOnlyCR02ArtifactBound",
    "protocolDraftPrepared",
  ]);
  for (const [key, value] of Object.entries(report.executionGate)) {
    if (typeof value === "boolean") invariant(value === allowedTrueGateKeys.has(key),
      `TS006 protocol execution gate ${key} drifted`);
  }
  invariant(report.executionGate.state === "closed-protocol-draft-prepared-not-authorized"
    && report.executionGate.originalRuntimeExecutionReady === false
    && report.summary.traceCandidatesPrepared === 2
    && report.summary.protocolSteps === 10
    && report.summary.containmentControlsTechnicallyPrepared === 1
    && report.summary.containmentControlsApproved === 0
    && report.summary.schedulesAccepted === 0
    && report.summary.runtimeSessionsExecuted === 0
    && report.summary.strictCompletions === 0,
  "TS006 protocol summary or execution closure drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.reviewableProtocolDraftPrepared === true
    && Object.entries(report.acceptance)
      .filter(([key]) => !["acceptanceNeutral", "reviewableProtocolDraftPrepared", "statement"].includes(key))
      .every(([, value]) => value === false),
  "TS006 protocol acceptance was promoted");
  return report;
}

export function renderMarkdown(report) {
  validateTs006OriginalRuntimeSessionProtocol(report);
  const steps = report.proposedProtocol.steps
    .map((step) => `${Number(step.stepId.slice(1)) + 1}. **${step.stepId} — ${step.kind}:** ${step.instruction}`)
    .join("\n");
  const traceRows = report.traceCandidates.map((candidate) =>
    `| ${candidate.language} | \`${candidate.protocolTraceCandidateId}\` | \`${candidate.entryStateCandidateSha256}\` | draft / not accepted |`,
  ).join("\n");
  return `# G4 L3 TS006 Original-Runtime Session Protocol Draft\n\n`
    + `This is a reviewable, deterministic **draft**. It does not authorize or launch Adobe Flash Player or Animate.\n\n`
    + `## Bound source facts\n\n`
    + `- Source: \`${report.scope.animationId}\`, 800×600, 12 FPS, root 10 frames. Root frame 1 requests \`InternalPreloader.jump_check\` and stops; root frame 6 is labeled \`begin\`, places \`Animation03\`, and stops. Runtime reachability remains unresolved.\n`
    + `- Candidate nested domains: \`sprite-3\` / \`Mc_Page_Title\` = 1 declared frame; \`sprite-23\` / \`Animation03\` = 128 declared frames with stream sound \`LTS06\` and a frame-128 stop. Neither disposition is promoted from static placement to runtime fact.\n`
    + `- Audio: embedded MP3 stream candidate (128 blocks, 22.05 kHz mono) plus catalog Spanish MP3 candidate (7.632 s, 48 kHz mono). Language, cue, synchronization, and listening acceptance remain unresolved.\n`
    + `- Read-only host tree: 657 files / 35,469,789 bytes; CR-02 is technically prepared but not approved.\n\n`
    + `## Trace candidates\n\n| Language | Candidate ID | Entry-state candidate SHA-256 | Status |\n|---|---|---|---|\n${traceRows}\n\n`
    + `These candidate IDs and hashes are planning identities, not authoritative requirement IDs, trace IDs, or observations.\n\n`
    + `## Proposed operator protocol\n\n${steps}\n\n`
    + `Direct seek remains forbidden. Each language requires a fresh process, natural same-lesson host entry, an ordered event/state chain, full nested-domain disposition, audio listening/synchronization evidence, Replay, navigation, no-egress verification, and complete exit.\n\n`
    + `## Gate\n\n`
    + `Prepared: source/authoring bindings, EN/ES trace candidates, read-only CR-02 tree, and this draft. Missing: owner approval, named runtime operator, authorized host, approved containment mechanisms, accepted schedule, and live capacity preflight. Execution remains **closed**.\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(ROOT, argv[++index] || "");
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(ROOT, argv[++index] || "");
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildTs006OriginalRuntimeSessionProtocol();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === json, `${relative(options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdown, `${relative(options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([writeFile(options.jsonOutput, json), writeFile(options.markdownOutput, markdown)]);
  process.stdout.write(`Wrote ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
