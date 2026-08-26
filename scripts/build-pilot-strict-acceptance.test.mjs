import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

import {
  PILOT_GATE_DEFINITIONS,
  checkPilotStrictAcceptance,
  evaluatePilot,
  generatePilotStrictAcceptance,
  parseArguments,
  writePilotStrictAcceptance,
} from "./build-pilot-strict-acceptance.mjs";
import { buildDispositionReport } from "./build-frame-domain-dispositions.mjs";
import { buildProbeRequests, buildRendererSupportReport } from "./build-renderer-frame-domain-support.mjs";
import {
  AUDIO_HUMAN_ATTESTATION,
  AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH,
  AUDIO_LISTENING_REVIEW_SCOPE,
  audioSessionEventSha256,
  buildAudioListeningAcceptanceTemplate,
} from "./audio-listening-acceptance.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {
  buildHumanVisualReviewInput,
  buildHumanVisualReviewRecord,
  buildOwnerReviewRecord,
  deriveHumanReviewExpectations,
  deriveOwnerReviewEvidence,
  projectKnownExceptions,
  writeImmutableReviewArtifact,
} from "./human-owner-review-records.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const PILOTS = Object.freeze(Array.from({ length: 16 }, (_, index) => ({
  id: `pilot-${String(index + 1).padStart(2, "0")}`,
})));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function frameDirectoryDigest(frames) {
  return digest(frames.map(({frame, sha256}) => `${frame}\0${sha256}\n`).join(""));
}

function manifest(id, { acceptedReviews = false } = {}) {
  const review = acceptedReviews
    ? { decision: "accepted", reviewer: "fixture reviewer", reviewedAt: "2026-07-21" }
    : { decision: "pending", reviewer: "", reviewedAt: "" };
  return {
    schemaVersion: 2,
    id,
    animationId: id,
    assetId: `swf-${"a".repeat(64)}`,
    status: "preserved",
    source: {
      swf: `sources/${id}.swf`,
      swfSha256: "a".repeat(64),
    },
    runtime: {
      stage: { width: 2, height: 2 },
      fps: 12,
      frameCount: 1,
    },
    localization: {
      bilingualRequired: true,
      languages: ["en", "es"],
    },
    scenarios: [{ id: "default", kind: "linear", description: "Fixture scenario.", reachable: true }],
    audio: {
      required: false,
      inventoryFile: "audio-inventory.csv",
    },
    baseline: {
      authority: "undecided",
      route: "",
      routeFile: "",
    },
    implementation: {
      rendering: "undecided",
      route: "",
      routeFile: "",
      component: "",
      timelineModule: "",
      testFile: "",
      registryModule: "",
      captureContract: {
        frameParameter: "frame",
        scenarioParameter: "scenario",
        languageParameter: "lang",
        seedParameter: "seed",
        frameAttribute: "data-flash-frame",
      },
    },
    evidence: {
      audioInventory: "audio-inventory.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
    },
    fidelity: {
      staticFrameMaxNormalizedRmse: 0.05,
      transitionFrameMaxNormalizedRmse: 0.08,
    },
    accessibility: {
      keyboardReplay: false,
      reducedMotionReviewed: false,
      accessibleNameReviewed: false,
      responsiveOverflowReviewed: false,
      localizationReviewed: false,
    },
    acceptance: {
      engineeringReview: { ...review },
      humanVisualReview: {
        ...review,
        scope: "all-keyframe-and-full-frame-diffs",
      },
      ownerReview: { ...review },
      knownExceptions: [],
    },
  };
}

async function fixture({ acceptedReviews = false, prereview = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "pilot-strict-acceptance-"));
  const migrationsRoot = path.join(root, "migrations");
  const validatorPath = path.join(root, "validator.mjs");
  await writeFile(validatorPath, "export const fixture = true;\n");
  for (const { id } of PILOTS) {
    const workspace = path.join(migrationsRoot, id);
    await mkdir(path.join(workspace, "evidence"), { recursive: true });
    await mkdir(path.join(workspace, "audit"), { recursive: true });
    await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(manifest(id, { acceptedReviews }), null, 2)}\n`);
    await writeFile(path.join(workspace, "audio-inventory.csv"), "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms\n");
    if (prereview && id === PILOTS[0].id) {
      await writeFile(path.join(workspace, "evidence", "visual-engineering-prereview.json"), `${JSON.stringify({
        schemaVersion: 1,
        animationId: id,
        review: {
          humanVisualReview: true,
          ownerAcceptance: true,
        },
      }, null, 2)}\n`);
    }
  }
  return { root, migrationsRoot, validatorPath };
}

async function writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics, startFrame, startFrameDomainId = startSemantics === "timeline-frame" ? "root" : "" }) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  const sourceBytes = Buffer.from(`fixture source for ${id}\n`);
  const sourcePath = path.join(path.dirname(migrationsRoot), "sources", `${id}.swf`);
  await mkdir(path.dirname(sourcePath), {recursive: true});
  await writeFile(sourcePath, sourceBytes);
  value.source.swf = path.relative(path.dirname(migrationsRoot), sourcePath);
  value.source.swfSha256 = digest(sourceBytes);
  value.audio = {
    required: true,
    languages: ["en"],
    cues: [],
    inventoryFile: "audio-inventory.csv",
  };
  value.classification = {...value.classification, collection: "formula"};
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);

  const audioBytes = Buffer.from("fixture audio bytes\n");
  const audioSha256 = createHash("sha256").update(audioBytes).digest("hex");
  await mkdir(path.join(workspace, "formula", "EAD"), {recursive: true});
  await writeFile(path.join(workspace, "formula", "EAD", "audio.mp3"), audioBytes);
  value.audio.cues = [{
    id: "narration-en",
    language: "en",
    source: "formula/EAD/audio.mp3",
    sha256: audioSha256,
    durationMs: 1000,
    startFrame: startFrame === "" ? null : Number(startFrame),
    startFrameDomainId: startFrameDomainId || null,
    startSemantics,
  }];
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  await writeFile(
    path.join(workspace, "audio-inventory.csv"),
    [
      "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
      `narration-en,en,formula/EAD/audio.mp3,${audioSha256},${startFrame},${startFrameDomainId},${startSemantics},1000,mp3,1,44100,,fixture`,
      "",
    ].join("\n"),
  );
  await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify({
    schemaVersion: 2,
    animationId: id,
    source: {
      expectedSha256: value.source.swfSha256,
      observedSha256: value.source.swfSha256,
      hashMatches: true,
    },
    authority: {hostScript: {sourceFile: "evidence/original-host.swf", sha256: digest("original host fixture\n"), conventions: {formula: {verified: true}}}},
    externalAudio: {
      missingExpectedCount: 0,
      lessonGroupCandidates: [],
      expectedButMissing: [],
      exactAssociations: [{
        sourceFile: "formula/EAD/audio.mp3",
        catalogSha256: audioSha256,
        observedSha256: audioSha256,
        hashMatchesCatalog: true,
        languageAssessment: {language: "en", evidence: "fixture host"},
        probe: {codecName: "mp3", durationMs: 1000, probeSizeBytes: audioBytes.length, channels: 1, sampleRateHz: 44100, tool: "ffprobe fixture"},
      }],
    },
    embeddedAudio: {defineSounds: [], startSounds: [], soundStreams: []},
    actionScriptAudioOperations: [],
    acceptance: {
      structurallyAudited: true,
      strictAudioAcceptance: "pending",
      manifestFollowUp: [],
    },
  }, null, 2)}\n`);
  const host = "original host fixture\n";
  const artifact = "runtime capture fixture\n";
  const runtimeIdentity = "Adobe Flash Player Projector fixture-1 product version capture\n";
  await mkdir(path.join(workspace, "evidence", "audio-listening-sessions"), {recursive: true});
  await mkdir(path.join(workspace, "evidence", "audio-runtime-sessions"), {recursive: true});
  await writeFile(path.join(workspace, "evidence", "original-host.swf"), host);
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "capture.bin"), artifact);
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "runtime-product-version.txt"), runtimeIdentity);
  const toolchainReceipt = `${JSON.stringify({
    schemaVersion: 1,
    evidenceType: "authorized-original-runtime-toolchain-receipt",
    runtime: {runtimeId: "adobe-flash-player-projector", name: "Adobe Flash Player Projector", version: "fixture-1"},
    capturedAt: "2026-07-21T00:00:00.000Z",
    identityArtifacts: [{kind: "product-version-capture", file: "evidence/audio-runtime-sessions/runtime-product-version.txt", sha256: digest(runtimeIdentity)}],
  }, null, 2)}\n`;
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "runtime-toolchain-receipt.json"), toolchainReceipt);
  const acceptance = await buildAudioListeningAcceptanceTemplate({workspace});
  acceptance.status = "accepted";
  for (const cue of acceptance.cueReviews) {
    cue.results = {
      spokenContentAndLanguage: "pass",
      naturalHostTraversal: "pass",
      startStopAndSynchronization: "pass",
      replayReset: "pass",
    };
    const reviewer = {kind: "human", fullName: "Named Human Audio Reviewer", role: "Audio QA reviewer", organizationOrOwnerId: "HELP-Math-QA-01", contact: "reviewer@example.test"};
    let prior = null;
    const operationEvents = ["activate", "start", "complete", "replay", "start"].map((action, index) => {
      const event = {sequence: index + 1, action, observedAtMs: index * 1000, previousEventSha256: prior};
      event.eventSha256 = audioSessionEventSha256(event);
      prior = event.eventSha256;
      return event;
    });
    const session = {
      schemaVersion: 1,
      evidenceType: "original-runtime-audio-listening-session",
      animationId: id,
      cue: Object.fromEntries(["cueId", "language", "sourceFile", "sha256", "durationMs", "startFrame", "startFrameDomainId", "startSemantics"].map((key) => [key, cue[key]])),
      reviewer,
      observedAt: "2026-07-21T00:00:00.000Z",
      runtime: {
        runtimeId: "adobe-flash-player-projector",
        name: "Adobe Flash Player Projector",
        version: "fixture-1",
        hostFile: "evidence/original-host.swf",
        hostSha256: digest(host),
        toolchainReceipt: {file: "evidence/audio-runtime-sessions/runtime-toolchain-receipt.json", sha256: digest(toolchainReceipt)},
      },
      operationEvents,
      observations: {spokenContentAndLanguage: "pass", naturalHostTraversal: "pass", startStopAndSynchronization: "pass", replayReset: "pass"},
      artifacts: [{kind: "lossless-runtime-capture", file: "evidence/audio-runtime-sessions/capture.bin", sha256: digest(artifact)}],
    };
    const sessionText = `${JSON.stringify(session, null, 2)}\n`;
    const sessionRelative = `evidence/audio-listening-sessions/${cue.cueId}.json`;
    await writeFile(path.join(workspace, sessionRelative), sessionText);
    cue.evidence = [{kind: "original-runtime-audio-listening-session", file: sessionRelative, sha256: digest(sessionText)}];
  }
  acceptance.summary = {
    everyCueListened: true,
    everyReachableHostStateTraversed: true,
    synchronizationAccepted: true,
    replayAccepted: true,
  };
  acceptance.review = {
    decision: "accepted",
    reviewer: {kind: "human", fullName: "Named Human Audio Reviewer", role: "Audio QA reviewer", organizationOrOwnerId: "HELP-Math-QA-01", contact: "reviewer@example.test"},
    attestation: AUDIO_HUMAN_ATTESTATION,
    signedAt: "2026-07-21T00:00:00.000Z",
    scope: AUDIO_LISTENING_REVIEW_SCOPE,
    notes: "Fixture-only named review.",
  };
  await writeFile(path.join(workspace, AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH), `${JSON.stringify(acceptance, null, 2)}\n`);
}

async function audioGateFor({ root, migrationsRoot, validatorPath, id }) {
  const report = await generatePilotStrictAcceptance({
    projectRoot: root,
    migrationsRoot,
    pilots: PILOTS,
    validateMigrationFn: failedValidator,
    validatorVersion: "fixture",
    validatorAbsolutePath: validatorPath,
  });
  return report.pilots
    .find(({ animationId }) => animationId === id)
    .gates.find(({ id: gateId }) => gateId === "audio-hash-listening-sync");
}

async function writeJsonWithHash(filePath, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return digest(bytes);
}

async function declareFixtureFla({ root, migrationsRoot, id = PILOTS[0].id }) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  const flaPath = path.join(root, "sources", `${id}.fla`);
  const flaBytes = Buffer.from(`fixture FLA for ${id}\n`);
  await mkdir(path.dirname(flaPath), { recursive: true });
  await writeFile(flaPath, flaBytes);
  value.source.fla = path.relative(root, flaPath);
  value.source.flaSha256 = digest(flaBytes);
  value.source.pairedFlaStatus = "present";
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  return { workspace, flaPath, flaBytes, manifest: value };
}

async function writeLegacyFlaAuthoringAudit({ workspace, id = PILOTS[0].id }) {
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  const frame = new PNG({ width: value.runtime.stage.width, height: value.runtime.stage.height });
  frame.data.fill(255);
  const frameBytes = PNG.sync.write(frame);
  const frameRelative = `audit/adobe-animate-2021-authoring-frame-${String(value.runtime.frameCount).padStart(4, "0")}.png`;
  await writeFile(path.join(workspace, frameRelative), frameBytes);
  const embedded = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    document: {
      name: path.basename(value.source.fla),
      pathURI: `file:///tmp/${path.basename(value.source.fla)}`,
      width: value.runtime.stage.width,
      height: value.runtime.stage.height,
      frameRate: value.runtime.fps,
      libraryItemCount: 0,
    },
    timeline: {
      frameCount: value.runtime.frameCount,
      layerCount: 1,
      currentFlashFrame: value.runtime.frameCount,
      layers: [{ name: "root", keyframes: [{ flashFrame: 1 }] }],
    },
    library: [],
  };
  await writeJsonWithHash(path.join(workspace, "audit", "adobe-animate-2021-authoring-audit.json"), {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    animationId: id,
    animateVersion: "MAC 21,0,7,42652",
    capturedAt: "2026-07-22T00:00:00.000Z",
    protocol: {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
    },
    source: { fla: value.source.fla, flaSha256: value.source.flaSha256 },
    nativeMovie: {
      width: value.runtime.stage.width,
      height: value.runtime.stage.height,
      fps: value.runtime.fps,
      frameCount: value.runtime.frameCount,
      rootLayerCount: 1,
      libraryItemCount: 0,
    },
    capturedAuthoringFrame: {
      flashFrame: value.runtime.frameCount,
      file: frameRelative,
      sha256: digest(frameBytes),
    },
    rawAuditSha256: digest(JSON.stringify(embedded)),
    authoringAudit: embedded,
    limitations: ["legacy shallow fixture"],
  });
}

async function evaluateFixturePilot({ root, migrationsRoot, validatorPath, id = PILOTS[0].id }) {
  return evaluatePilot({
    projectRoot: root,
    migrationsRoot,
    pilotId: id,
    validateMigrationFn: failedValidator,
    inspectTraceEvidenceFn: async ({ animationId }) => {
      const coverage = JSON.parse(await readFile(path.join(migrationsRoot, animationId, "evidence", "full-frame-coverage.json"), "utf8"));
      return {
        applicable: true,
        index: "migrations/course-shell-pilot-trace-spec-index.json",
        readySpecCount: coverage.requirements.length,
        unresolvedSpecCount: 0,
        absentSpecCount: 0,
        failures: [],
        requirements: coverage.requirements.map((requirement) => ({
          requirementId: requirement.requirementId,
          coverageStatus: requirement.status,
          disposition: "complete-evidence-verified",
          traceSpecReadiness: "ready",
          specFile: `migrations/${animationId}/audit/trace-specs/${requirement.requirementId}.json`,
          executionReport: `migrations/${animationId}/baseline/trace-executions/${requirement.requirementId}.json`,
          executionReportSha256: "c".repeat(64),
          evidence: {
            originalRuntimeCaptureManifest: {
              file: requirement.baselineCaptureManifest,
              sha256: requirement.baselineCaptureManifestSha256,
            },
          },
        })),
      };
    },
    validator: { path: path.relative(root, validatorPath), version: "fixture", sha256: null },
  });
}

async function writeValidFrameDomainDisposition({ root, workspace, manifest: value }) {
  const manifestPath = path.join(workspace, "migration.json");
  const manifestSha256 = technicalManifestSha256(value);
  const swfmillBytes = Buffer.from(`swfmill structure for ${value.animationId}\n`);
  const swfmillPath = path.join(workspace, "audit", "machine", "swfmill.xml.gz");
  await mkdir(path.dirname(swfmillPath), { recursive: true });
  await writeFile(swfmillPath, swfmillBytes);
  const timelineInventory = value.implementation.frameDomains.map((domain) => ({
    timelineId: domain.sourceTimelineId,
    objectId: domain.sourceTimelineId === "root" ? null : domain.sourceTimelineId.replace(/^sprite-/, ""),
    frameCount: domain.frameCount,
    structuralReachability: domain.sourceTimelineId === "root" ? "root" : "reachable-from-root-placement-graph",
    controlStates: [{ frame: 1 }, { frame: domain.frameCount }],
    frameLabels: [],
    namedPlacements: domain.sourceTimelineId === "root"
      ? [{ objectId: "58", frame: 6, depth: "1", name: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false }]
      : [],
  }));
  const inventory = {
    schemaVersion: 1,
    animationId: value.animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    evidenceIndex: [
      { artifactId: "source-swf", path: value.source.swf, sha256: value.source.swfSha256 },
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        hashMode: "canonical-json-v1",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      { artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: digest(swfmillBytes) },
    ],
    timelineInventory,
  };
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const inventorySha256 = await writeJsonWithHash(inventoryPath, inventory);
  const report = buildDispositionReport({
    animationId: value.animationId,
    inventory,
    inventorySha256,
    manifest: value,
    manifestSha256,
  });
  const reportPath = path.join(workspace, "audit", "frame-domain-disposition.json");
  await writeJsonWithHash(reportPath, report);
  return { report, reportPath, inventoryPath };
}

async function writeValidRendererFrameDomainSupport({ root, workspace, manifest: value }) {
  const paths = {
    prototypeManifest: "packages/demos/src/prototype-manifest.ts",
    animationRegistry: "packages/demos/src/animation-registry.ts",
    contract: "packages/demos/src/contract.ts",
    builder: "scripts/build-renderer-frame-domain-support.mjs",
    auditContract: "scripts/evidence-projections.mjs",
    probe: "scripts/probe-renderer-frame-domain-support.ts",
    module: `packages/demos/src/modules/${value.animationId}.tsx`,
    timeline: value.implementation.timelineModule,
  };
  const hashes = {};
  for (const [id, relativePath] of Object.entries(paths)) {
    const filePath = path.join(root, relativePath);
    const bytes = id === "prototypeManifest"
      ? Buffer.from([
          "function runtimeMetadata(frameCount) { return Object.freeze({frameCount}); }",
          `export const prototypeManifest = Object.freeze([Object.freeze({key: '${value.animationId}', preferredAnimationId: '${value.animationId}', sourceBasenames: Object.freeze([]), runtime: runtimeMetadata(${value.runtime.frameCount})})]);`,
          "function basename(value) { return value.replaceAll('\\\\', '/').split('/').at(-1)?.toLowerCase() ?? ''; }",
          "export function matchPrototype(input) { const animationId = input.animationId?.toLowerCase(); const sourceBasename = basename(input.sourcePath ?? ''); return prototypeManifest.find((entry) => entry.preferredAnimationId === animationId || entry.key === animationId || entry.sourceBasenames.includes(sourceBasename)); }",
          "",
        ].join("\n"))
      : Buffer.from(`renderer audit fixture ${id} for ${value.animationId}\n`);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
    hashes[id] = digest(bytes);
  }
  const requests = buildProbeRequests(value, value.animationId);
  const probe = {
    animationId: value.animationId,
    prototypeKey: value.animationId,
    prototypeRuntime: {
      stage: value.runtime.stage,
      fps: value.runtime.fps,
      frameCount: value.runtime.frameCount,
      durationMs: value.runtime.frameCount * 1000 / value.runtime.fps,
      frameDomains: value.implementation.frameDomains
        .filter(({ id }) => id !== "root")
        .map(({ id, frameCount }) => ({ id, frameCount })),
      defaultFrameDomain: value.implementation.defaultFrameDomainId,
    },
    module: { key: value.animationId, maturity: "strict-complete", scenarios: ["default"] },
    results: requests.map((request) => ({
      requestId: request.requestId,
      moduleScenarioDeclared: true,
      actual: {
        frameDomain: request.frameDomain,
        frame: request.frame,
        scenario: request.scenario,
        language: request.language,
        status: "ready",
        blocker: null,
      },
      error: null,
    })),
  };
  const report = buildRendererSupportReport({
    animationId: value.animationId,
    manifest: value,
    technicalManifestSha256: technicalManifestSha256(value),
    probe,
    sourceHashes: {
      prototypeManifest: hashes.prototypeManifest,
      animationRegistry: hashes.animationRegistry,
      contract: hashes.contract,
      builder: hashes.builder,
      auditContract: hashes.auditContract,
      probe: hashes.probe,
      module: { path: paths.module, sha256: hashes.module },
      timeline: { path: paths.timeline, sha256: hashes.timeline },
    },
  });
  const reportPath = path.join(workspace, "audit", "renderer-frame-domain-support.json");
  await writeJsonWithHash(reportPath, report);
  return { report, reportPath };
}

async function writeCoverageV2Fixture({
  root,
  migrationsRoot,
  id = PILOTS[0].id,
  localAuthority = "original-runtime-natural-trace",
  rootAuthority = "original-runtime-natural-trace",
  scenarioKind = "linear",
}) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  value.runtime.frameCount = 10;
  value.runtime.fps = 12;
  value.scenarios[0].kind = scenarioKind;
  value.localization.languages = ["en", "es"];
  value.baseline = {
    authority: "original-runtime-natural-traces",
    route: `/reference/${id}`,
    routeFile: "reference-route.tsx",
  };
  value.implementation.defaultFrameDomainId = "sprite-58";
  value.implementation.registryModule = `./modules/${id}`;
  value.implementation.timelineModule = `packages/demos/src/timelines/${id}.ts`;
  value.implementation.frameDomains = [
    { id: "root", kind: "root", sourceTimelineId: "root", parentFrameDomainId: null, frameCount: 10, scenarioIds: ["default"] },
    { id: "sprite-58", kind: "nested", sourceTimelineId: "sprite-58", parentFrameDomainId: "root", frameCount: 142, scenarioIds: ["default"] },
  ];
  Object.assign(value.implementation.captureContract, {
    animationIdAttribute: "data-animation-id",
    frameDomainParameter: "frameDomain",
    requirementIdParameter: "requirementId",
    traceParameter: "trace",
    entryStateSha256Parameter: "entryStateSha256",
    frameDomainAttribute: "data-flash-frame-domain",
    requirementIdAttribute: "data-flash-requirement-id",
    traceAttribute: "data-flash-trace-id",
    entryStateSha256Attribute: "data-flash-entry-state-sha256",
  });
  await writeFile(path.join(workspace, "reference-route.tsx"), "export default true;\n");
  const sourcePath = path.join(root, "sources", `${id}.swf`);
  const sourceBytes = Buffer.from(`fixture source for ${id}\n`);
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, sourceBytes);
  value.source.swf = path.relative(root, sourcePath);
  value.source.swfSha256 = digest(sourceBytes);
  await writeValidRendererFrameDomainSupport({ root, workspace, manifest: value });
  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot: root,
    workspace,
    manifest: value,
  });

  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const pngPath = path.join(workspace, "evidence", "shared-frame.png");
  await writeFile(pngPath, pngBytes);
  const pngSha256 = digest(pngBytes);
  const requirements = [];
  for (const domain of value.implementation.frameDomains) for (const language of value.localization.languages) {
    const requirementId = `req-${domain.id}-${language}`;
    const traceId = `default-${domain.id}-${language}`;
    const entryState = domain.kind === "root"
      ? { kind: "initial-load" }
      : { kind: "natural-runtime-entry", parentFrame: 6, parentFrameDomainId: "root" };
    const entryStateSha256 = digest(canonicalJson(entryState));
    const authority = domain.kind === "nested" ? localAuthority : rootAuthority;
    const directory = path.join(workspace, "evidence", "v2", requirementId);
    const captured = [];
    const metricFrames = [];
    for (let frame = 1; frame <= domain.frameCount; frame += 1) {
      captured.push({
        animationId: id,
        requirementId,
        frame,
        reportedFrame: frame,
        frameDomainId: domain.id,
        reportedFrameDomainId: domain.id,
        traceId,
        entryStateSha256,
        scenario: "default",
        language,
        seed: "0",
        reportedRenderState: "ready",
        visualTarget: {
          tagName: "canvas",
          reportedRenderState: "ready",
          animationId: id,
          reportedFrame: frame,
          frameDomainId: domain.id,
          requirementId,
          traceId,
          entryStateSha256,
          scenario: "default",
          language,
          seed: "0",
        },
        file: pngPath,
        sha256: pngSha256,
      });
      metricFrames.push({
        requirementId,
        frame,
        frameDomainId: domain.id,
        traceId,
        entryStateSha256,
        kind: "static",
        baselineSha256: pngSha256,
        implementationSha256: pngSha256,
        normalizedRmse: 0,
        result: "pass",
      });
    }
    const capture = {
      schemaVersion: 4,
      status: "complete",
      sourceUrl: `http://127.0.0.1:3213/animations/${id}`,
      generatorProvenance: testCaptureGeneratorProvenance(),
      implementationArtifactClosure,
      animationId: id,
      requirementId,
      frameDomainId: domain.id,
      traceId,
      entryStateSha256,
      scenario: "default",
      language,
      seed: "0",
      reportedFrameAttribute: "data-flash-frame",
      reportedAnimationIdAttribute: "data-animation-id",
      reportedFrameDomainAttribute: "data-flash-frame-domain",
      reportedRequirementIdAttribute: "data-flash-requirement-id",
      reportedTraceAttribute: "data-flash-trace-id",
      reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
      captureStageAttribute: "data-capture-stage",
      reportedRenderStateAttribute: "data-render-state",
      reportedVisualTargetAttribute: "data-render-visual",
      requiredRenderState: "ready",
      viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
      captured,
      consoleErrors: [],
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: [],
    };
    const capturePath = path.join(directory, "capture-manifest.json");
    const captureManifestSha256 = await writeJsonWithHash(capturePath, capture);
    const baselinePath = path.join(directory, "baseline-capture-manifest.json");
    const baselineCaptureManifestSha256 = await writeJsonWithHash(baselinePath, {
      schemaVersion: 2,
      evidenceType: "original-runtime-frame-domain-baseline",
      status: "complete",
      animationId: id,
      requirementId,
      frameDomainId: domain.id,
      traceId,
      entryStateSha256,
      scenario: "default",
      language,
      seed: "0",
      baselineAuthority: authority,
      capturedAt: "2026-07-21T00:00:00.000Z",
      source: { swf: value.source.swf, swfSha256: value.source.swfSha256 },
      runtime: {
        stage: value.runtime.stage,
        fps: value.runtime.fps,
        frameCount: domain.frameCount,
        frameNumbering: "one-indexed",
      },
      capture: {
        operator: "strict-report-test-fixture",
        tool: "authorized-original-runtime",
        toolVersion: "fixture-1",
        traceEntryMode: authority === "original-runtime-direct-seek"
          ? "original-runtime-direct-seek"
          : authority === "original-runtime-frame-step"
            ? "original-runtime-root-entry"
            : "natural-runtime-navigation",
        frameCaptureMode: authority === "original-runtime-direct-seek"
          ? "deterministic-direct-seek"
          : "deterministic-sequential-step",
        entryProtocol: "Enter through the declared original-runtime path.",
        frameControlProtocol: "Capture frame 1, then step one source frame per image.",
        entryTrace: [{ order: 1, action: "enter declared trace", resultingFrameDomainId: domain.id }],
      },
      frames: captured.map(({ reportedFrame, reportedFrameDomainId, scenario: ignoredScenario, language: ignoredLanguage, seed: ignoredSeed, ...frame }) => frame),
    });
    const metrics = {
      schemaVersion: 2,
      status: "complete",
      animationId: id,
      requirementId,
      scenario: "default",
      language,
      seed: "0",
      frameDomainId: domain.id,
      traceId,
      entryStateSha256,
      baselineAuthority: authority,
      baselineFrameDomainId: domain.id,
      baselineTraceId: traceId,
      baselineEntryStateSha256: entryStateSha256,
      baselineCaptureManifestSha256,
      implementationCaptureManifestSha256: captureManifestSha256,
      frames: metricFrames,
    };
    const metricsPath = path.join(directory, "metrics.json");
    const metricsSha256 = await writeJsonWithHash(metricsPath, metrics);
    requirements.push({
      requirementId,
      status: "complete",
      scenario: "default",
      frameDomainId: domain.id,
      traceId,
      language,
      seed: "0",
      requiredRange: { firstFrame: 1, lastFrame: domain.frameCount },
      entryState,
      entryStateSha256,
      baselineAuthorityRequirement: domain.kind === "nested"
        ? "original-runtime-natural-trace"
        : "original-runtime-frame-accurate",
      baselineAuthority: authority,
      baselineCaptureManifest: path.relative(workspace, baselinePath),
      baselineCaptureManifestSha256,
      capturedFrameCount: domain.frameCount,
      missingFrames: [],
      captureManifest: path.relative(workspace, capturePath),
      captureManifestSha256,
      metricsFile: path.relative(workspace, metricsPath),
      metricsSha256,
    });
  }
  await writeJsonWithHash(path.join(workspace, "evidence", "full-frame-coverage.json"), {
    schemaVersion: 2,
    animationId: id,
    requirements,
  });

  const archiveDirectory = path.join(workspace, "baseline", "standalone-root-archive");
  await mkdir(archiveDirectory, { recursive: true });
  await writeFile(path.join(archiveDirectory, "frame.png"), pngBytes);
  await writeJsonWithHash(path.join(workspace, "baseline", "authoritative-standalone-root.json"), {
    schemaVersion: 1,
    animationId: id,
    status: "authoritative-complete",
    authority: { kind: "original-swf-adobe-flash-player-runtime" },
    source: { swfSha256: value.source.swfSha256 },
    runtime: { stage: value.runtime.stage, fps: value.runtime.fps, frameCount: 10 },
    capture: { archiveDirectory },
    frames: Array.from({ length: 10 }, (_, index) => ({ frame: index + 1, file: "frame.png", sha256: pngSha256 })),
  });
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  await writeValidFrameDomainDisposition({ root, workspace, manifest: value });
  return { workspace, requirements };
}

async function writeCoverageV1Fixture({ root, migrationsRoot, id = PILOTS[0].id }) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  value.implementation.component = `implementations/${id}.ts`;
  await mkdir(path.join(root, "implementations"), {recursive: true});
  await writeFile(path.join(root, value.implementation.component), `export const animationId = ${JSON.stringify(id)};\n`);
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot: root,
    workspace,
    manifest: value,
  });
  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const pngPath = path.join(workspace, "evidence", "legacy-frame.png");
  await writeFile(pngPath, pngBytes);
  const pngSha256 = digest(pngBytes);
  const combinations = [];
  for (const language of ["en", "es"]) {
    const directory = path.join(workspace, "evidence", "v1", language);
    const requirementId = `req-root-default-${language}`;
    const traceId = `default-root-${language}`;
    const entryStateSha256 = digest(canonicalJson({kind: "initial-load", language}));
    await mkdir(directory, {recursive: true});
    await writeFile(path.join(directory, "frame-0001.png"), pngBytes);
    const projectPngPath = "frame-0001.png";
    const capturePath = path.join(directory, "capture-manifest.json");
    const captureManifestSha256 = await writeJsonWithHash(capturePath, {
      schemaVersion: 4,
      status: "complete",
      sourceUrl: `http://127.0.0.1:3213/animations/${id}`,
      generatorProvenance: testCaptureGeneratorProvenance(),
      implementationArtifactClosure,
      animationId: id,
      requirementId,
      frameDomainId: "root",
      traceId,
      entryStateSha256,
      scenario: "default",
      language,
      seed: "0",
      reportedFrameAttribute: "data-flash-frame",
      viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
      captured: [{
        frame: 1,
        reportedFrame: 1,
        scenario: "default",
        language,
        seed: "0",
        file: projectPngPath,
        sha256: pngSha256,
        width: 2,
        height: 2,
      }],
      consoleErrors: [], failedRequests: [], httpErrors: [], unexpectedRequests: [],
    });
    const baselineManifestPath = path.join(directory, "baseline-capture-manifest.json");
    const baselineCaptureManifestSha256 = await writeJsonWithHash(baselineManifestPath, {
      schemaVersion: 1,
      evidenceType: "fixture-original-runtime-capture",
      animationId: id,
      requirementId,
    });
    const metricsPath = path.join(directory, "metrics.json");
    const metricsSha256 = await writeJsonWithHash(metricsPath, {
      schemaVersion: 2,
      status: "complete",
      evidenceType: "full-frame-directory-comparison",
      animationId: id,
      requirementId,
      frameDomainId: "root",
      traceId,
      entryStateSha256,
      scenario: "default",
      language,
      seed: "0",
      baselineCaptureManifest: path.relative(root, baselineManifestPath).split(path.sep).join("/"),
      baselineCaptureManifestSha256,
      implementationCaptureManifest: path.relative(root, capturePath).split(path.sep).join("/"),
      implementationCaptureManifestSha256: captureManifestSha256,
      contract: {requiredRange: {firstFrame: 1, lastFrame: 1}, stage: {width: 2, height: 2}},
      inputs: {
        baseline: {directorySha256: frameDirectoryDigest([{frame: 1, sha256: pngSha256}])},
        implementation: {directorySha256: frameDirectoryDigest([{frame: 1, sha256: pngSha256}])},
      },
      diffArchive: {directorySha256: frameDirectoryDigest([{frame: 1, sha256: pngSha256}])},
      summary: {frameCount: 1},
      frames: [{
        frame: 1,
        requirementId,
        frameDomainId: "root",
        traceId,
        entryStateSha256,
        baselineFile: projectPngPath,
        baselineSha256: pngSha256,
        implementationFile: projectPngPath,
        implementationSha256: pngSha256,
        diffFile: projectPngPath,
        diffSha256: pngSha256,
        width: 2,
        height: 2,
        kind: "static",
        normalizedRmse: 0,
        result: "pass",
      }],
    });
    const contactDirectory = path.join(workspace, "evidence", "contact-sheets", requirementId);
    const contactPagePath = path.join(contactDirectory, "page-01.png");
    await mkdir(contactDirectory, {recursive: true});
    await writeFile(contactPagePath, pngBytes);
    const contactManifestPath = path.join(contactDirectory, "manifest.json");
    await writeJsonWithHash(contactManifestPath, {
      schemaVersion: 1,
      evidenceType: "full-frame-contact-sheet",
      animationId: id,
      sourceEvidence: {
        comparison: {
          file: path.relative(root, metricsPath).split(path.sep).join("/"),
          sha256: metricsSha256,
        },
        implementationCaptureManifest: {
          file: path.relative(root, capturePath).split(path.sep).join("/"),
          sha256: captureManifestSha256,
        },
      },
      contract: {frameCount: 1, stage: {width: 2, height: 2}},
      pages: [{
        page: 1,
        file: path.relative(root, contactPagePath).split(path.sep).join("/"),
        sha256: pngSha256,
        width: 2,
        height: 2,
        frames: [1],
      }],
      verification: {
        comparisonSummaryRecomputed: true,
        completeSequentialFrameCoverage: true,
        everyFrameRepresentedExactlyOnce: true,
        implementationCaptureHashesMatchActualPngs: true,
        diffHashesMatchActualPngs: true,
        nativeStageDimensionsMatch: true,
        captureStatusComplete: true,
      },
    });
    combinations.push({
      status: "complete", scenario: "default", language, seed: "0", firstFrame: 1, lastFrame: 1,
      capturedFrameCount: 1, missingFrames: [], captureManifest: path.relative(workspace, capturePath), captureManifestSha256,
      metricsFile: path.relative(workspace, metricsPath), metricsSha256,
      contactSheetManifest: path.relative(workspace, contactManifestPath),
    });
  }
  await writeJsonWithHash(path.join(workspace, "evidence", "full-frame-coverage.json"), {
    schemaVersion: 1,
    animationId: id,
    frameCount: 1,
    scenarios: ["default"],
    languages: ["en", "es"],
    combinations,
  });
}

async function writeBoundAcceptedReviews({root, migrationsRoot, id = PILOTS[0].id}) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify({
    schemaVersion: 2,
    animationId: id,
    acceptance: {strictAudioAcceptance: "accepted-not-required"},
  }, null, 2)}\n`);
  await writeFile(path.join(workspace, "evidence", "behavior-qa.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    status: "pass",
  }, null, 2)}\n`);
  await writeFile(path.join(workspace, "evidence", "product-qa.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    status: "pass",
  }, null, 2)}\n`);

  const expectations = await deriveHumanReviewExpectations({projectRoot: root, workspace, manifest: value});
  const reviewInput = await buildHumanVisualReviewInput({
    projectRoot: root,
    workspace,
    manifest: value,
    requirements: expectations.expectedRequirements,
    expectedRequirementIds: expectations.expectedRequirementIds,
  });
  const inputDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "input",
    value: reviewInput,
  });
  const humanRecord = buildHumanVisualReviewRecord({
    animationId: id,
    decision: "accepted",
    reviewer: {
      kind: "human",
      fullName: "Dr. Fixture Human",
      role: "Visual evidence reviewer",
      organizationOrOwnerId: "fixture-human-01",
      contact: "human@example.test",
    },
    reviewedAt: "2026-07-22T09:00:00+08:00",
    reviewInput: inputDescriptor,
    requirementIds: expectations.expectedRequirementIds,
    notes: "Every bound frame diff and contact sheet was reviewed.",
  });
  const humanDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "human",
    value: humanRecord,
  });
  const ownerEvidence = await deriveOwnerReviewEvidence({projectRoot: root, workspace, manifest: value});
  const ownerRecord = buildOwnerReviewRecord({
    animationId: id,
    decision: "accepted",
    reviewer: {
      kind: "human",
      fullName: "Dr. Fixture Owner",
      role: "Owner evidence reviewer",
      organizationOrOwnerId: "fixture-owner-01",
      contact: "owner@example.test",
      authority: "owner",
    },
    reviewedAt: "2026-07-22T10:00:00+08:00",
    reason: "I accept the exact bound fixture evidence and exception scope.",
    humanVisualReview: humanDescriptor,
    ...ownerEvidence,
    knownExceptions: projectKnownExceptions(value),
    notes: "Owner fixture review completed against the immutable evidence envelope.",
  });
  const ownerDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "owner",
    value: ownerRecord,
  });
  value.acceptance.engineeringReview = {
    decision: "accepted",
    reviewer: "Fixture Engineer",
    reviewedAt: "2026-07-22T08:00:00+08:00",
  };
  value.acceptance.humanVisualReview = {
    decision: "accepted",
    reviewer: humanRecord.reviewer.fullName,
    reviewedAt: humanRecord.reviewedAt,
    scope: humanRecord.scope,
    record: humanDescriptor,
  };
  value.acceptance.ownerReview = {
    decision: "accepted",
    reviewer: ownerRecord.reviewer.fullName,
    reviewedAt: ownerRecord.reviewedAt,
    reason: ownerRecord.reason,
    record: ownerDescriptor,
  };
  await writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`);
  return {humanDescriptor, ownerDescriptor};
}

const failedValidator = async () => ({
  ok: false,
  mode: "strict",
  errors: ["fixture strict validator failure"],
  warnings: [],
});

function supplementalPartialRequirement(overrides = {}) {
  const selection = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "supplemental-sprite-58-en",
    requiredFrameSet: {frames: [1, 2]},
  };
  const entryState = {kind: "supplemental-path"};
  return {
    requirementId: "req-sprite-58-supplemental-en",
    status: "blocked",
    scenario: "default",
    frameDomainId: "sprite-58",
    traceId: "supplemental-sprite-58-en",
    language: "en",
    seed: "0",
    entryState,
    entryStateSha256: digest(canonicalJson(entryState)),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    capturedFrameCount: 0,
    missingFrames: [1, 2],
    strictAcceptanceEffect: "none",
    authority: {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
    },
    ...selection,
    selectionSha256: selectionSha256(selection, 142),
    ...overrides,
  };
}

test("defines every mandatory strict pilot gate exactly once", () => {
  assert.equal(PILOT_GATE_DEFINITIONS.length, 15);
  assert.equal(new Set(PILOT_GATE_DEFINITIONS.map(({ id }) => id)).size, 15);
  assert.deepEqual(PILOT_GATE_DEFINITIONS.map(({ id }) => id), [
    "authoritative-baseline",
    "implementation-route",
    "deterministic-frame-contract",
    "full-frame-scenario-coverage",
    "rmse-thresholds",
    "english-spanish-evidence",
    "audio-hash-listening-sync",
    "replay-interaction-random",
    "product-qa",
    "engineering-review",
    "human-review",
    "owner-acceptance",
    "strict-validator",
    "regression-tests",
    "production-build",
  ]);
});

test("uses explicit coverage-v2 requirements for root-10/local-142 traces and totals 304 bilingual frames", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await writeCoverageV2Fixture({ root, migrationsRoot });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    for (const gateId of ["authoritative-baseline", "deterministic-frame-contract", "full-frame-scenario-coverage", "rmse-thresholds", "english-spanish-evidence"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "pass", `${gateId}: ${gate.reasons.join("\n")}`);
    }
    const fullCoverage = pilot.gates.find(({ id }) => id === "full-frame-scenario-coverage");
    assert.ok(fullCoverage.observations.some((item) => item.includes("4 explicit trace requirement(s) totaling 304 required frame captures")));
    assert.ok(!fullCoverage.reasons.some((reason) => reason.includes("expected 10")), fullCoverage.reasons.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("supplemental partial paths do not increase the canonical strict denominator or satisfy a missing slot", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const {workspace} = await writeCoverageV2Fixture({root, migrationsRoot});
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    coverage.requirements.push(supplementalPartialRequirement());
    await writeJsonWithHash(coveragePath, coverage);

    const pilot = await evaluateFixturePilot({root, migrationsRoot, validatorPath});
    const fullCoverage = pilot.gates.find(({id}) => id === "full-frame-scenario-coverage");
    assert.equal(fullCoverage.status, "pass", fullCoverage.reasons.join("\n"));
    assert.ok(
      fullCoverage.observations.some((item) => item.includes("4 explicit trace requirement(s) totaling 304 required frame captures")),
      fullCoverage.observations.join("\n"),
    );
    assert.ok(!fullCoverage.observations.some((item) => item.includes("5 explicit trace requirement")));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("malformed supplemental partial rows fail before strict exclusion", async (t) => {
  const cases = [
    ["duplicate requirementId", (coverage) => ({
      requirementId: coverage.requirements[0].requirementId,
    }), /duplicate requirementId|requirementId .*duplicated/i],
    ["wrong scenario", () => ({scenario: "undeclared-scenario"}), /scenario .*not declared/i],
    ["wrong language", () => ({language: "fr"}), /undeclared language|language is not declared/i],
    ["wrong coverage group", () => ({coverageGroupId: ""}), /coverageGroupId.*(?:stable identifier|non-empty string)/i],
    ["strict acceptance effect", () => ({strictAcceptanceEffect: "promote"}), /strictAcceptanceEffect must be exactly none/i],
  ];
  for (const [name, mutate, expected] of cases) {
    await t.test(name, async () => {
      const {root, migrationsRoot, validatorPath} = await fixture();
      try {
        const {workspace} = await writeCoverageV2Fixture({root, migrationsRoot});
        const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
        const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
        coverage.requirements.push(supplementalPartialRequirement(mutate(coverage)));
        await writeJsonWithHash(coveragePath, coverage);
        const pilot = await evaluateFixturePilot({root, migrationsRoot, validatorPath});
        const fullCoverage = pilot.gates.find(({id}) => id === "full-frame-scenario-coverage");
        assert.equal(fullCoverage.status, "fail");
        assert.match(fullCoverage.reasons.join("\n"), expected);
        assert.ok(
          fullCoverage.observations.some((item) => item.includes("4 explicit trace requirement(s) totaling 304 required frame captures")),
          fullCoverage.observations.join("\n"),
        );
      } finally {
        await rm(root, {recursive: true, force: true});
      }
    });
  }
});

test("authoritative-baseline fails closed when a paired FLA has no per-file Animate authoring audit", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await declareFixtureFla({ root, migrationsRoot });
    await writeCoverageV2Fixture({ root, migrationsRoot });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "fail");
    assert.ok(gate.evidence.some((filePath) => filePath.endsWith("audit/adobe-animate-2021-authoring-audit.json")));
    assert.ok(gate.reasons.some((reason) => reason.includes("not current and comprehensive") && reason.includes("not-complete-legacy-conversion-dialog")), gate.reasons.join("\n"));
    assert.equal(pilot.gates.length, 15);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("authoritative-baseline rejects a hash-valid schema-v1 shallow Animate audit", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await declareFixtureFla({ root, migrationsRoot });
    await writeCoverageV2Fixture({ root, migrationsRoot });
    await writeLegacyFlaAuthoringAudit({ workspace });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("legacy-partial-authoring-audit-refresh-required")), gate.reasons.join("\n"));
    assert.ok(gate.observations.some((observation) => observation.includes("does not prove original-runtime behavior")));
    assert.equal(pilot.gates.length, 15);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("authoritative-baseline reports malformed paired-FLA authoring evidence instead of throwing", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await declareFixtureFla({ root, migrationsRoot });
    await writeCoverageV2Fixture({ root, migrationsRoot });
    await writeJsonWithHash(path.join(workspace, "audit", "adobe-animate-2021-authoring-audit.json"), {
      schemaVersion: 3,
      evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
      animationId: PILOTS[0].id,
    });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("FLA authoring audit failed closed") && reason.includes("unsupported Animate authoring audit schema")), gate.reasons.join("\n"));
    assert.equal(pilot.gates.length, 15);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("implementation, deterministic, and coverage gates fail closed on blocked or wrong-domain pure renderer state", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const auditPath = path.join(workspace, "audit", "renderer-frame-domain-support.json");
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    audit.probes[0].actual.frameDomain = "sprite-58";
    audit.probes[0].actual.status = "blocked";
    audit.probes[0].actual.blocker = "fixture-unresolved";
    await writeJsonWithHash(auditPath, audit);
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    for (const gateId of ["implementation-route", "deterministic-frame-contract", "full-frame-scenario-coverage"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail", `${gateId} must reject a blocked wrong-domain state`);
      assert.ok(gate.evidence.some((filePath) => filePath.endsWith("audit/renderer-frame-domain-support.json")));
      assert.ok(gate.reasons.some((reason) => reason.includes("Renderer frame-domain support")));
    }
    const rendererReasons = pilot.gates.find(({ id }) => id === "deterministic-frame-contract").reasons.join("\n");
    assert.match(rendererReasons, /does not prove exact state frameDomain\/frame\/scenario\/language identity/);
    assert.match(rendererReasons, /blocked and therefore not renderable/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("blocked source authority does not hide a complete deterministic implementation capture", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    for (const requirement of coverage.requirements) {
      requirement.status = "blocked";
      requirement.baselineAuthority = "unresolved";
      requirement.baselineCaptureManifest = "";
      requirement.baselineCaptureManifestSha256 = "";
      requirement.metricsFile = "";
      requirement.metricsSha256 = "";
    }
    await writeJsonWithHash(coveragePath, coverage);

    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const deterministic = pilot.gates.find(({ id }) => id === "deterministic-frame-contract");
    assert.equal(deterministic.status, "pass", deterministic.reasons.join("\n"));
    for (const gateId of ["authoritative-baseline", "full-frame-scenario-coverage", "rmse-thresholds"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail", `${gateId} must remain blocked without original-runtime baseline and metrics`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("blocked source authority never excuses a mismatched deterministic implementation capture hash", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    for (const requirement of coverage.requirements) {
      requirement.status = "blocked";
      requirement.baselineAuthority = "unresolved";
      requirement.baselineCaptureManifest = "";
      requirement.baselineCaptureManifestSha256 = "";
      requirement.metricsFile = "";
      requirement.metricsSha256 = "";
    }
    coverage.requirements[0].captureManifestSha256 = "0".repeat(64);
    await writeJsonWithHash(coveragePath, coverage);

    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const deterministic = pilot.gates.find(({ id }) => id === "deterministic-frame-contract");
    assert.equal(deterministic.status, "fail");
    assert.ok(
      deterministic.reasons.some((reason) => reason.includes("capture manifest SHA-256 differs from coverage v2")),
      deterministic.reasons.join("\n"),
    );
    for (const gateId of ["authoritative-baseline", "full-frame-scenario-coverage", "rmse-thresholds"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail", `${gateId} must remain blocked without original-runtime baseline and metrics`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("authoritative, deterministic, and full-frame gates fail closed on stale or incomplete frame-domain disposition", async (t) => {
  const cases = [
    {
      name: "stale inventory hash",
      mutate(report) { report.generatedFrom.scenarioInventory.sha256 = "0".repeat(64); },
      expected: "scenario inventory SHA-256 is stale",
    },
    {
      name: "unresolved timeline",
      mutate(report) {
        const timeline = report.timelines.find(({ timelineId }) => timelineId === "sprite-58");
        timeline.disposition = "unresolved";
        report.status = "structurally-enumerated-dispositions-unresolved";
        report.summary.dispositionCounts["declared-frame-domain"] -= 1;
        report.summary.dispositionCounts.unresolved += 1;
      },
      expected: "unresolved structurally reachable timeline",
    },
    {
      name: "missing reachable timeline",
      mutate(report) {
        report.timelines = report.timelines.filter(({ timelineId }) => timelineId !== "sprite-58");
        report.summary.enumeratedTimelineCount -= 1;
        report.summary.reachableChildTimelineCount -= 1;
        report.summary.dispositionCounts["declared-frame-domain"] -= 1;
      },
      expected: "omits 1 structurally root-reachable timeline",
    },
    {
      name: "fake declared domain",
      mutate(report) { report.timelines[0].declaredFrameDomains[0].frameDomainId = "fake-root"; },
      expected: "declaredFrameDomains do not exactly match migration.json",
    },
  ];
  for (const item of cases) await t.test(item.name, async () => {
    const { root, migrationsRoot, validatorPath } = await fixture();
    try {
      const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
      const dispositionPath = path.join(workspace, "audit", "frame-domain-disposition.json");
      const report = JSON.parse(await readFile(dispositionPath, "utf8"));
      item.mutate(report);
      await writeJsonWithHash(dispositionPath, report);
      const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
      for (const gateId of ["authoritative-baseline", "deterministic-frame-contract", "full-frame-scenario-coverage"]) {
        const gate = pilot.gates.find(({ id }) => id === gateId);
        assert.equal(gate.status, "fail", `${gateId} must fail on ${item.name}`);
        assert.ok(gate.reasons.some((reason) => reason.includes(item.expected)), gate.reasons.join("\n"));
        assert.ok(gate.evidence.some((filePath) => filePath.endsWith("audit/frame-domain-disposition.json")));
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

test("accepts frame-accurate direct-seek only for root requirements while nested traces remain natural", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await writeCoverageV2Fixture({
      root,
      migrationsRoot,
      rootAuthority: "original-runtime-direct-seek",
      localAuthority: "original-runtime-natural-trace",
    });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "pass", gate.reasons.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts root-entry sequential frame-step only for a non-interactive root requirement", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await writeCoverageV2Fixture({
      root,
      migrationsRoot,
      rootAuthority: "original-runtime-frame-step",
      localAuthority: "original-runtime-natural-trace",
    });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "pass", gate.reasons.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("all four trace-dependent gates fail closed when a complete requirement has no verified execution report", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { requirements } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const missing = requirements[0];
    const pilot = await evaluatePilot({
      projectRoot: root,
      migrationsRoot,
      pilotId: PILOTS[0].id,
      validateMigrationFn: failedValidator,
      inspectTraceEvidenceFn: async () => ({
        applicable: true,
        index: "migrations/course-shell-pilot-trace-spec-index.json",
        readySpecCount: requirements.length,
        unresolvedSpecCount: 0,
        absentSpecCount: 0,
        failures: [{
          animationId: PILOTS[0].id,
          requirementId: missing.requirementId,
          message: `${PILOTS[0].id}/${missing.requirementId}: complete coverage requirement is missing its execution report`,
        }],
        requirements: requirements.map((requirement) => requirement === missing ? {
          requirementId: requirement.requirementId,
          coverageStatus: "complete",
          disposition: "trace-evidence-failed",
          traceSpecReadiness: "ready",
          executionReportSha256: null,
          evidence: null,
        } : {
          requirementId: requirement.requirementId,
          coverageStatus: "complete",
          disposition: "complete-evidence-verified",
          traceSpecReadiness: "ready",
          executionReportSha256: "c".repeat(64),
          evidence: { originalRuntimeCaptureManifest: { file: requirement.baselineCaptureManifest, sha256: requirement.baselineCaptureManifestSha256 } },
        }),
      }),
      validator: { path: path.relative(root, validatorPath), version: "fixture", sha256: null },
    });
    for (const gateId of [
      "authoritative-baseline",
      "deterministic-frame-contract",
      "full-frame-scenario-coverage",
      "replay-interaction-random",
    ]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail", gateId);
      assert.ok(gate.reasons.some((reason) => reason.includes("missing its execution report")), `${gateId}: ${gate.reasons.join("\n")}`);
      assert.ok(gate.observations.some((observation) => observation.includes("never baseline authority by itself")));
    }
    assert.equal(pilot.gates.length, 15);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects direct-seek and frame-step authority for an interactive root scenario", async (t) => {
  for (const rootAuthority of ["original-runtime-direct-seek", "original-runtime-frame-step"]) await t.test(rootAuthority, async () => {
    const { root, migrationsRoot, validatorPath } = await fixture();
    try {
      await writeCoverageV2Fixture({
        root,
        migrationsRoot,
        rootAuthority,
        localAuthority: "original-runtime-natural-trace",
        scenarioKind: "interactive",
      });
      const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
      const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
      assert.equal(gate.status, "fail");
      assert.ok(gate.reasons.some((reason) => reason.includes("interactive scenario requires original-runtime-natural-trace authority")), gate.reasons.join("\n"));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

test("never lets a valid standalone root-10 baseline masquerade as the local-142 natural trace", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await writeCoverageV2Fixture({ root, migrationsRoot, localAuthority: "implementation-candidate" });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("req-sprite-58-en") && reason.includes("implementation-candidate")), gate.reasons.join("\n"));
    assert.ok(gate.observations.some((item) => item.includes("direct-seek and root-entry sequential frame-step are permitted only for a non-interactive root requirement")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects candidate, direct-seek, frame-step, and root-only authority for every nested coverage-v2 trace", async (t) => {
  for (const authority of ["implementation-candidate", "original-runtime-direct-seek", "original-runtime-frame-step", "original-runtime-root-only"]) {
    await t.test(authority, async () => {
      const { root, migrationsRoot, validatorPath } = await fixture();
      try {
        await writeCoverageV2Fixture({ root, migrationsRoot, localAuthority: authority });
        const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
        const gate = pilot.gates.find(({ id }) => id === "authoritative-baseline");
        assert.equal(gate.status, "fail");
        assert.ok(gate.reasons.some((reason) => reason.includes(authority)), gate.reasons.join("\n"));
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }
});

test("pairs every coverage-v2 gate by explicit requirement/language/domain/trace/state identity", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    delete coverage.requirements[2].requirementId;
    await writeJsonWithHash(coveragePath, coverage);
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    for (const gateId of [
      "authoritative-baseline",
      "deterministic-frame-contract",
      "full-frame-scenario-coverage",
      "rmse-thresholds",
      "english-spanish-evidence",
      "replay-interaction-random",
      "product-qa",
    ]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail", `${gateId} should fail closed on requirementId drift`);
    }
    assert.ok(pilot.gates.find(({ id }) => id === "full-frame-scenario-coverage").reasons.some((reason) => reason.includes("no explicit non-empty requirementId")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects a claimed v2 authority when its original-runtime baseline manifest is missing", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const { workspace } = await writeCoverageV2Fixture({ root, migrationsRoot });
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    coverage.requirements[0].baselineCaptureManifest = "";
    coverage.requirements[0].baselineCaptureManifestSha256 = "";
    await writeJsonWithHash(coveragePath, coverage);
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    const authority = pilot.gates.find(({ id }) => id === "authoritative-baseline");
    assert.equal(authority.status, "fail");
    assert.ok(authority.reasons.some((reason) => reason.includes("baseline capture manifest does not exist")), authority.reasons.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("keeps legacy root-only coverage-v1 migrations compatible", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    await writeCoverageV1Fixture({ root, migrationsRoot });
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath });
    for (const gateId of ["deterministic-frame-contract", "full-frame-scenario-coverage", "rmse-thresholds", "english-spanish-evidence"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "pass", `${gateId}: ${gate.reasons.join("\n")}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict deterministic gates reject schema-v4 generator provenance with a non-exact shape", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const id = PILOTS[0].id;
    await writeCoverageV1Fixture({ root, migrationsRoot, id });
    const workspace = path.join(migrationsRoot, id);
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    const capturePath = path.join(workspace, coverage.combinations[0].captureManifest);
    const capture = JSON.parse(await readFile(capturePath, "utf8"));
    delete capture.generatorProvenance.playwright.packageJsonSha256;
    capture.generatorProvenance.browser.executablePath = "/unbound/chromium";
    coverage.combinations[0].captureManifestSha256 = await writeJsonWithHash(capturePath, capture);
    await writeJsonWithHash(coveragePath, coverage);
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath, id });
    const deterministic = pilot.gates.find(({ id: gateId }) => gateId === "deterministic-frame-contract");
    assert.equal(deterministic.status, "fail");
    assert.ok(
      deterministic.reasons.some((reason) => reason.includes("generatorProvenance")),
      deterministic.reasons.join("\n"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("keeps pre-v4 legacy root-only implementation captures as prereview-only", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const id = PILOTS[0].id;
    await writeCoverageV1Fixture({ root, migrationsRoot, id });
    const workspace = path.join(migrationsRoot, id);
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    for (const combination of coverage.combinations) {
      const capturePath = path.join(workspace, combination.captureManifest);
      const capture = JSON.parse(await readFile(capturePath, "utf8"));
      capture.schemaVersion = 2;
      delete capture.implementationArtifactClosure;
      delete capture.sourceUrl;
      combination.captureManifestSha256 = await writeJsonWithHash(capturePath, capture);
    }
    await writeJsonWithHash(coveragePath, coverage);
    const pilot = await evaluateFixturePilot({ root, migrationsRoot, validatorPath, id });
    const deterministic = pilot.gates.find(({ id: gateId }) => gateId === "deterministic-frame-contract");
    assert.equal(deterministic.status, "fail");
    assert.ok(
      deterministic.reasons.some((reason) => reason.includes("prereview-only") && reason.includes("capture-time implementation artifact closure")),
      deterministic.reasons.join("\n"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed for all 16 pilots and reports explicit missing evidence paths", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const report = await generatePilotStrictAcceptance({
      projectRoot: root,
      migrationsRoot,
      pilots: PILOTS,
      validateMigrationFn: failedValidator,
      validatorVersion: "fixture",
      validatorAbsolutePath: validatorPath,
    });
    assert.equal(report.summary.pilots, 16);
    assert.equal(report.summary.strictAccepted, 0);
    assert.equal(report.policy.failClosed, true);
    assert.equal(report.policy.changesMigrationStatus, false);
    assert.equal(report.policy.infersHumanReview, false);
    assert.equal(report.policy.infersOwnerAcceptance, false);
    assert.match(report.generatedMarker, /^sha256:[a-f0-9]{64}$/);
    for (const pilot of report.pilots) {
      assert.equal(pilot.strictAccepted, false);
      assert.equal(pilot.gates.length, 15);
      const coverage = pilot.gates.find(({ id }) => id === "full-frame-scenario-coverage");
      assert.equal(coverage.status, "fail");
      assert.ok(coverage.evidence.some((filePath) => filePath.endsWith("evidence/full-frame-coverage.json")));
      assert.ok(coverage.reasons.some((reason) => reason.includes("Cannot read")));
      const behavior = pilot.gates.find(({ id }) => id === "replay-interaction-random");
      assert.ok(behavior.reasons.some((reason) => reason.includes("behavior-qa.json")));
      const product = pilot.gates.find(({ id }) => id === "product-qa");
      assert.ok(product.reasons.some((reason) => reason.includes("product-qa.json")));
      const verification = pilot.gates.find(({ id }) => id === "production-build");
      assert.ok(verification.reasons.some((reason) => reason.includes("verification.json")));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts a blank start_frame for host-user-activated audio", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const id = PILOTS[0].id;
  try {
    await writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics: "host-user-activated", startFrame: "" });
    const gate = await audioGateFor({ root, migrationsRoot, validatorPath, id });
    assert.equal(gate.status, "pass", gate.reasons.join("\n"));
    assert.deepEqual(gate.reasons, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires a one-indexed start_frame for timeline-frame audio", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const id = PILOTS[0].id;
  try {
    await writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics: "timeline-frame", startFrame: "" });
    const gate = await audioGateFor({ root, migrationsRoot, validatorPath, id });
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("one-indexed frame in its declared frame domain for timeline-frame audio")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires timeline-frame audio to name its exact declared frame domain", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const id = PILOTS[0].id;
  try {
    await writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics: "timeline-frame", startFrame: "1", startFrameDomainId: "missing-domain" });
    const gate = await audioGateFor({ root, migrationsRoot, validatorPath, id });
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("does not identify a declared frame domain")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects a timeline start_frame for host-user-activated audio", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const id = PILOTS[0].id;
  try {
    await writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics: "host-user-activated", startFrame: "1" });
    const gate = await audioGateFor({ root, migrationsRoot, validatorPath, id });
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("start_frame must be blank when start_semantics is host-user-activated")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects a frame-domain binding for interaction-state audio", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const id = PILOTS[0].id;
  try {
    await writeAcceptedRequiredAudio({ migrationsRoot, id, startSemantics: "interaction-state", startFrame: "", startFrameDomainId: "root" });
    const gate = await audioGateFor({ root, migrationsRoot, validatorPath, id });
    assert.equal(gate.status, "fail");
    assert.ok(gate.reasons.some((reason) => reason.includes("start_frame_domain_id must be blank when start_semantics is interaction-state")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("never treats an engineering prereview as human or owner acceptance", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture({ prereview: true });
  try {
    const report = await generatePilotStrictAcceptance({
      projectRoot: root,
      migrationsRoot,
      pilots: PILOTS,
      validateMigrationFn: failedValidator,
      validatorVersion: "fixture",
      validatorAbsolutePath: validatorPath,
    });
    const pilot = report.pilots.find(({ animationId }) => animationId === PILOTS[0].id);
    for (const gateId of ["engineering-review", "human-review", "owner-acceptance"]) {
      const gate = pilot.gates.find(({ id }) => id === gateId);
      assert.equal(gate.status, "fail");
      assert.ok(gate.evidence.some((filePath) => filePath.endsWith("visual-engineering-prereview.json")));
      assert.ok(gate.observations.some((item) => item.includes("excluded")));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects accepted inline-only reviews as legacy-unbound while preserving engineering review", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture({ acceptedReviews: true, prereview: true });
  try {
    const report = await generatePilotStrictAcceptance({
      projectRoot: root,
      migrationsRoot,
      pilots: PILOTS,
      validateMigrationFn: failedValidator,
      validatorVersion: "fixture",
      validatorAbsolutePath: validatorPath,
    });
    const pilot = report.pilots[0];
    assert.equal(pilot.gates.find(({ id }) => id === "engineering-review").status, "pass");
    const human = pilot.gates.find(({ id }) => id === "human-review");
    const owner = pilot.gates.find(({ id }) => id === "owner-acceptance");
    assert.equal(human.status, "fail");
    assert.equal(owner.status, "fail");
    assert.ok(human.reasons.some((reason) => reason.includes("legacy-unbound")));
    assert.ok(owner.reasons.some((reason) => reason.includes("legacy-unbound")));
    assert.equal(pilot.strictAccepted, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts immutable hash-bound human and owner records without promoting unrelated strict gates", async () => {
  const {root, migrationsRoot, validatorPath} = await fixture();
  try {
    await writeCoverageV1Fixture({root, migrationsRoot});
    const descriptors = await writeBoundAcceptedReviews({root, migrationsRoot});
    const report = await generatePilotStrictAcceptance({
      projectRoot: root,
      migrationsRoot,
      pilots: PILOTS,
      validateMigrationFn: failedValidator,
      validatorVersion: "fixture",
      validatorAbsolutePath: validatorPath,
    });
    const pilot = report.pilots[0];
    const human = pilot.gates.find(({id}) => id === "human-review");
    const owner = pilot.gates.find(({id}) => id === "owner-acceptance");
    assert.equal(human.status, "pass", human.reasons.join("\n"));
    assert.equal(owner.status, "pass", owner.reasons.join("\n"));
    assert.ok(human.evidence.includes(descriptors.humanDescriptor.path));
    assert.ok(owner.evidence.includes(descriptors.ownerDescriptor.path));
    assert.equal(pilot.strictAccepted, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("rejects passing behavior, product, test, and build labels when their evidence hashes are wrong", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  try {
    const id = PILOTS[0].id;
    const workspace = path.join(migrationsRoot, id);
    const proofPath = path.join(workspace, "evidence", "proof.txt");
    await writeFile(proofPath, "real proof bytes\n");
    const wrongEvidence = [{ path: "evidence/proof.txt", sha256: "0".repeat(64) }];
    const behaviorIds = [
      "replay-mouse",
      "replay-enter",
      "replay-space",
      "replay-reset-frame-state-audio",
      "all-reachable-branches",
      "interaction-input-scoring",
      "completion-terminal-state",
      "random-seeded-outcomes",
    ];
    const productIds = [
      "native-stage",
      "desktop",
      "tablet",
      "mobile",
      "keyboard-focus",
      "accessible-names",
      "reduced-motion",
      "text-overflow",
      "localization",
      "console-errors",
      "asset-loads",
      "unexpected-network",
    ];
    await writeFile(path.join(workspace, "evidence", "behavior-qa.json"), `${JSON.stringify({
      schemaVersion: 1,
      animationId: id,
      status: "pass",
      scenarios: ["default"],
      checks: behaviorIds.map((checkId) => ({ id: checkId, result: "pass", evidence: wrongEvidence })),
    }, null, 2)}\n`);
    await writeFile(path.join(workspace, "evidence", "product-qa.json"), `${JSON.stringify({
      schemaVersion: 1,
      animationId: id,
      status: "pass",
      checks: productIds.map((checkId) => ({ id: checkId, result: "pass", evidence: wrongEvidence })),
    }, null, 2)}\n`);
    const manifestBytes = await readFile(path.join(workspace, "migration.json"));
    await writeFile(path.join(workspace, "evidence", "verification.json"), `${JSON.stringify({
      schemaVersion: 1,
      manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
      commands: {
        test: { command: "npm test", status: "pass", exitCode: 0, outputFile: "evidence/proof.txt", outputSha256: "0".repeat(64) },
        build: { command: "npm run build", status: "pass", exitCode: 0, outputFile: "evidence/proof.txt", outputSha256: "0".repeat(64) },
      },
    }, null, 2)}\n`);

    const report = await generatePilotStrictAcceptance({
      projectRoot: root,
      migrationsRoot,
      pilots: PILOTS,
      validateMigrationFn: failedValidator,
      validatorVersion: "fixture",
      validatorAbsolutePath: validatorPath,
    });
    const pilot = report.pilots.find(({ animationId }) => animationId === id);
    for (const gateId of ["replay-interaction-random", "product-qa", "regression-tests", "production-build"]) {
      const gate = pilot.gates.find(({ id: candidate }) => candidate === gateId);
      assert.equal(gate.status, "fail");
      assert.ok(gate.reasons.some((reason) => reason.includes("SHA-256 differs")), `${gateId} should reject the wrong evidence hash`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("writes deterministic JSON and Markdown and detects stale reports without changing manifests", async () => {
  const { root, migrationsRoot, validatorPath } = await fixture();
  const jsonOutput = path.join(root, "reports", "pilot-strict-acceptance.json");
  const markdownOutput = path.join(root, "reports", "pilot-strict-acceptance.md");
  const options = {
    projectRoot: root,
    migrationsRoot,
    pilots: PILOTS,
    validateMigrationFn: failedValidator,
    validatorVersion: "fixture",
    validatorAbsolutePath: validatorPath,
    jsonOutput,
    markdownOutput,
  };
  try {
    const before = await readFile(path.join(migrationsRoot, PILOTS[0].id, "migration.json"), "utf8");
    const first = await writePilotStrictAcceptance(options);
    const second = await writePilotStrictAcceptance(options);
    assert.equal(first.json, second.json);
    assert.equal(first.markdown, second.markdown);
    assert.equal((await checkPilotStrictAcceptance(options)).ok, true);
    assert.equal(await readFile(path.join(migrationsRoot, PILOTS[0].id, "migration.json"), "utf8"), before);

    const changed = JSON.parse(before);
    changed.status = "audited";
    await writeFile(path.join(migrationsRoot, PILOTS[0].id, "migration.json"), `${JSON.stringify(changed, null, 2)}\n`);
    const stale = await checkPilotStrictAcceptance(options);
    assert.equal(stale.ok, false);
    assert.equal(stale.jsonCurrent, false);
    assert.equal(stale.markdownCurrent, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parses report output and check arguments", () => {
  const options = parseArguments([
    "--check",
    "--json",
    "--migrations", "custom-migrations",
    "--output-json", "custom.json",
    "--output-markdown", "custom.md",
  ]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.ok(options.migrationsRoot.endsWith("custom-migrations"));
  assert.ok(options.jsonOutput.endsWith("custom.json"));
  assert.ok(options.markdownOutput.endsWith("custom.md"));
  assert.throws(() => parseArguments(["--output-json"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
