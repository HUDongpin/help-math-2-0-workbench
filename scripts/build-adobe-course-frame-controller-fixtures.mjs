#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createServer} from "node:net";
import {fileURLToPath} from "node:url";

import {
  COURSE_CHILD_PILOT_IDS,
  probeFixtureToolchain,
  renderBaseSwfXml,
  renderSandboxProfile,
} from "./build-adobe-course-host-fixtures.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const supportScriptPath = path.join(projectRoot, "scripts", "build-adobe-course-host-fixtures.mjs");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultOutputRoot = path.join(projectRoot, "work", "adobe-course-host-fixtures-frame-controller-all");
const defaultReportsRoot = path.join(projectRoot, "reports");
const flashPlayerPath = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";

const SPEC_BASENAME = "adobe-course-frame-controller-spec.json";
const REPORT_BASENAME = "adobe-course-frame-controller-engineering-report.json";
const GLOBAL_INDEX_BASENAME = "adobe-course-frame-controller-fixtures.json";
const GLOBAL_REPORT_BASENAME = "adobe-course-frame-controller-fixtures.md";
const FIXTURE_KIND = "hash-pinned-adobe-avm1-course-local-frame-controller";
const LEGACY_TI_ID = "course-g03-l06-ti-001";
const BLOCKED_SOURCE_PRIMITIVES = /\b(?:ExternalInterface|LocalConnection|SharedObject|XMLSocket|fscommand|getURL|loadVariables(?:Num)?|navigateToURL|sendAndLoad)\b|javascript:|https?:\/\//i;
const REQUIRED_MARKERS = Object.freeze([
  "HELP_COURSE_FRAME_CONTROLLER",
  "__controllerTargetFrame",
  "__controllerActualFrameChecks",
  "__controllerFail",
  "__controllerTryPin",
  "actual-frame-check",
]);
const INTERACTION_COVERAGE_KEYS = Object.freeze([
  "buttonTargetObligations",
  "conditionalBranchObligations",
  "correctWrongObligations",
  "courseRouteObligations",
  "dragObligations",
  "glossaryAndHyperlinkObligations",
  "handlerBehaviorGroups",
  "inputObligations",
  "labeledStateObligations",
  "replayAndTerminalObligations",
  "sectionMenuObligations",
  "sideEffectObligations",
]);

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(value || "");
}

function assertRelative(candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label} must be non-empty`);
  invariant(!path.isAbsolute(candidate), `${label} must be relative`);
  const normalized = portable(path.normalize(candidate));
  invariant(normalized !== ".." && !normalized.startsWith("../"), `${label} escapes its root`);
  invariant(!/^[a-z]+:/i.test(normalized), `${label} cannot be a URL`);
  return normalized;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))].sort(compareText);
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

export function parseArguments(argumentsList) {
  const options = {
    migrationsRoot: defaultMigrationsRoot,
    outputRoot: defaultOutputRoot,
    reportsRoot: defaultReportsRoot,
    ids: [],
    frame: null,
    compile: true,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--no-compile") options.compile = false;
    else if (["--id", "--frame", "--migrations", "--output", "--reports", "--verify", "--verify-launch"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--frame") {
        invariant(/^\d+$/.test(next), "--frame must be a positive integer");
        options.frame = Number(next);
      } else if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--output") options.outputRoot = path.resolve(next);
      else if (value === "--reports") options.reportsRoot = path.resolve(next);
      else if (value === "--verify") options.verifyManifest = path.resolve(next);
      else options.verifyLaunch = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  const modeCount = [options.check, Boolean(options.verifyManifest), Boolean(options.verifyLaunch)].filter(Boolean).length;
  invariant(modeCount <= 1, "--check, --verify, and --verify-launch are mutually exclusive");
  if (options.frame !== null) invariant(options.ids.length === 1, "--frame requires exactly one --id");
  for (const id of options.ids) invariant(COURSE_CHILD_PILOT_IDS.includes(id), `unknown course child pilot: ${id}`);
  return options;
}

function lessonRelativePath(sourcePath) {
  const parts = portable(sourcePath).split("/");
  const lessonIndex = parts.findIndex((part) => /^L\d+$/.test(part));
  invariant(lessonIndex >= 0 && lessonIndex + 1 < parts.length, `could not derive lesson-relative path from ${sourcePath}`);
  return `lesson/${parts.slice(lessonIndex + 1).join("/")}`;
}

export function selectCanonicalProbeFrame(localTimeline) {
  invariant(Number.isSafeInteger(localTimeline?.frameCount) && localTimeline.frameCount >= 1, "local timeline frameCount is invalid");
  const labels = (localTimeline.frameLabels || [])
    .filter((item) => Number.isSafeInteger(item.frame) && item.frame > 1 && item.frame <= localTimeline.frameCount && typeof item.label === "string" && item.label.length > 0)
    .sort((left, right) => left.frame - right.frame || compareText(left.label, right.label));
  if (labels.length) {
    return {
      frame: labels[0].frame,
      strategy: "first-source-audited-local-frame-label-after-frame-1",
      structuralKey: true,
      visualNonEmptyClaimed: false,
      evidence: {kind: "frame-label", frame: labels[0].frame, label: labels[0].label},
    };
  }
  const controls = (localTimeline.controlStates || [])
    .filter((item) => Number.isSafeInteger(item.frame) && item.frame > 1 && item.frame <= localTimeline.frameCount)
    .sort((left, right) => left.frame - right.frame);
  const nonTerminalStop = controls.find((item) => item.reasons?.includes("script-stop-state") && !item.reasons.includes("terminal-structural-frame"));
  if (nonTerminalStop) {
    return {
      frame: nonTerminalStop.frame,
      strategy: "first-source-audited-nonterminal-script-stop-state",
      structuralKey: true,
      visualNonEmptyClaimed: false,
      evidence: {kind: "control-state", frame: nonTerminalStop.frame, reasons: nonTerminalStop.reasons},
    };
  }
  const nonTerminalAction = controls.find((item) => !item.reasons?.includes("terminal-structural-frame") && item.reasons?.some((reason) => reason === "exported-action-script" || reason.startsWith("structural-action:")));
  if (nonTerminalAction) {
    return {
      frame: nonTerminalAction.frame,
      strategy: "first-source-audited-nonterminal-action-state",
      structuralKey: true,
      visualNonEmptyClaimed: false,
      evidence: {kind: "control-state", frame: nonTerminalAction.frame, reasons: nonTerminalAction.reasons},
    };
  }
  const terminal = controls.find((item) => item.reasons?.includes("terminal-structural-frame"));
  if (terminal) {
    return {
      frame: terminal.frame,
      strategy: "source-audited-terminal-control-state-only-key-candidate",
      structuralKey: true,
      visualNonEmptyClaimed: false,
      evidence: {kind: "control-state", frame: terminal.frame, reasons: terminal.reasons},
    };
  }
  return {
    frame: 1,
    strategy: "initial-one-indexed-frame-no-later-audited-key-state",
    structuralKey: false,
    visualNonEmptyClaimed: false,
    evidence: {kind: "frame-domain", frame: 1},
  };
}

function summarizeInteractionObligations(coverage = {}) {
  return INTERACTION_COVERAGE_KEYS.map((key) => ({key, count: Array.isArray(coverage[key]) ? coverage[key].length : 0}))
    .filter((item) => item.count > 0);
}

function unresolvedBindings(inventory) {
  return uniqueSorted((inventory.dependencies?.bindings || [])
    .filter((binding) => binding.staticResolution?.status !== "resolved-by-hash-verified-static-source-evidence")
    .map((binding) => binding.binding));
}

function sideEffectApis(inventory) {
  return uniqueSorted((inventory.dependencies?.safeSideEffectPolicy || []).map((item) => item.api));
}

function legacyTiCompatibility(evidenceRecords) {
  const wanted = [
    "migrations/course-g03-l06-ti-001/audit/adobe-frame-controller-spec.json",
    "migrations/course-g03-l06-ti-001/audit/adobe-frame-controller-engineering-report.json",
  ];
  const records = wanted.map((candidate) => evidenceRecords.find((record) => record.path === candidate)).filter(Boolean);
  invariant(records.length === wanted.length, "TI legacy controller evidence must remain present and hashable");
  return {
    preservedUnmodifiedByThisFactory: true,
    separateOutputNamespace: "work/adobe-course-host-fixtures-frame-controller-all",
    files: records.map(({path: recordPath, sha256}) => ({path: recordPath, sha256})),
  };
}

export function deriveControllerSpecification({inventory, evidencePins, legacyEvidence = []}) {
  invariant(inventory?.schemaVersion === 1, `${inventory?.animationId || "inventory"}: unsupported scenario inventory schema`);
  invariant(COURSE_CHILD_PILOT_IDS.includes(inventory.animationId), `${inventory.animationId}: not a course-child pilot`);
  invariant(inventory.source?.actionScriptVersion === "AS1/2", `${inventory.animationId}: AVM1 source is required`);
  invariant(isSha256(inventory.source?.swfSha256), `${inventory.animationId}: source hash is invalid`);
  invariant(Number.isSafeInteger(inventory.source?.stage?.width) && inventory.source.stage.width > 0, `${inventory.animationId}: source stage width is invalid`);
  invariant(Number.isSafeInteger(inventory.source?.stage?.height) && inventory.source.stage.height > 0, `${inventory.animationId}: source stage height is invalid`);
  invariant(inventory.source?.fps === 12, `${inventory.animationId}: source FPS must remain 12`);
  const rootCandidates = (inventory.timelineInventory || []).filter((item) => item.timelineId === "root");
  invariant(rootCandidates.length === 1, `${inventory.animationId}: expected one root timeline`);
  const root = rootCandidates[0];
  invariant(root.frameCount === inventory.source.rootFrameCount, `${inventory.animationId}: root frame count conflicts with source metadata`);
  const placements = (root.namedPlacements || []).filter((item) => item.name === "animation");
  invariant(placements.length === 1, `${inventory.animationId}: expected exactly one root named placement 'animation', observed ${placements.length}`);
  const placement = placements[0];
  const placementFrame = Number(placement.frame);
  const placementObjectId = Number(placement.objectId);
  invariant(Number.isSafeInteger(placementFrame) && placementFrame >= 1 && placementFrame <= root.frameCount, `${inventory.animationId}: animation placement frame is invalid`);
  invariant(Number.isSafeInteger(placementObjectId) && placementObjectId > 0, `${inventory.animationId}: animation placement objectId is invalid`);
  const entryLabels = (root.frameLabels || []).filter((item) => item.frame === placementFrame);
  invariant(entryLabels.length === 1, `${inventory.animationId}: expected exactly one root label at animation placement frame ${placementFrame}`);
  invariant(String(entryLabels[0].label).toLowerCase() === "begin", `${inventory.animationId}: animation placement label must be begin/Begin`);
  const timelineId = `sprite-${placementObjectId}`;
  const localCandidates = (inventory.timelineInventory || []).filter((item) => item.timelineId === timelineId);
  invariant(localCandidates.length === 1, `${inventory.animationId}: expected one ${timelineId} timeline`);
  const local = localCandidates[0];
  invariant(local.objectId === placementObjectId || Number(local.objectId) === placementObjectId, `${inventory.animationId}: local timeline objectId mismatch`);
  invariant(Number.isSafeInteger(local.frameCount) && local.frameCount >= 1, `${inventory.animationId}: local frame count is invalid`);
  invariant(local.frameDomain?.indexing === "one-indexed" && local.frameDomain.start === 1 && local.frameDomain.endInclusive === local.frameCount, `${inventory.animationId}: local frame domain is not exact and one-indexed`);
  const canonicalFrame = selectCanonicalProbeFrame(local);
  const namedAudioClipNames = uniqueSorted((local.namedPlacements || [])
    .filter((item) => /sound|audio/i.test(item.name || ""))
    .map((item) => item.name));
  const bindingBlockers = unresolvedBindings(inventory);
  const interactionBlockers = summarizeInteractionObligations(inventory.coverage);
  const randomObligations = inventory.coverage?.randomObligations || [];
  const specification = {
    schemaVersion: 1,
    animationId: inventory.animationId,
    fixtureKind: FIXTURE_KIND,
    canonicalTargetFrame: canonicalFrame.frame,
    canonicalFrameSelection: canonicalFrame,
    source: {
      path: inventory.source.swf,
      fixturePath: lessonRelativePath(inventory.source.swf),
      sha256: inventory.source.swfSha256,
      stage: inventory.source.stage,
      fps: inventory.source.fps,
      rootFrameCount: inventory.source.rootFrameCount,
      actionScriptVersion: inventory.source.actionScriptVersion,
    },
    evidencePins,
    timelineContract: {
      root: {
        frameCount: root.frameCount,
        entryLabel: entryLabels[0].label,
        entryFrame: placementFrame,
        placementName: placement.name,
        placementObjectId,
        placementDepth: Number(placement.depth),
      },
      local: {
        timelineId,
        objectId: placementObjectId,
        frameCount: local.frameCount,
        indexing: "one-indexed",
        namedAudioClipNames,
      },
      consecutiveActualFrameChecksBeforeReveal: 3,
    },
    unresolvedObligations: {
      hostBindings: bindingBlockers,
      interactionCoverage: interactionBlockers,
      randomObligationCount: randomObligations.length,
      randomObligationIds: randomObligations.map((item) => item.obligationId).filter(Boolean),
      sideEffectApis: sideEffectApis(inventory),
      language: ["English/Spanish host flags and visual branches are not established by direct local-frame seek"],
      audio: ["all audio is intentionally muted and stopped; listening, identity, start cue, synchronization, and Replay remain outside this fixture"],
    },
    safetyPolicy: {
      lazyExplicitClick: true,
      fullStageOpaqueFailClosedCover: true,
      postPinFullStageInputShield: true,
      networkDeniedBySandbox: true,
      appleEventsDeniedBySandbox: true,
      launchServicesOpenAndDatabaseDeniedBySandbox: true,
      outsideWritesDeniedBySandbox: true,
      originalCourseShellExecuted: false,
      sourceChildModified: false,
      captureMode: "visual-only-audio-muted-and-stopped",
      unknownNetworkEndpointsExecuted: false,
      hostBindingsInjected: false,
    },
    authorityBoundary: {
      originalHostBehaviorClaimed: false,
      authoritativeNaturalPlaybackClaimed: false,
      authoritativeBranchTraversalClaimed: false,
      authoritativeLanguageClaimed: false,
      authoritativeAudioClaimed: false,
      strictBaselineClaimed: false,
      humanReviewClaimed: false,
      ownerAcceptanceClaimed: false,
      runtimeProofStatus: "pending-authorized-adobe-gui-probe",
      directSeekLimitation: "A parent gotoAndStop on the source-named local animation instance can establish only a source-addressed visual candidate after Adobe runtime verification. It does not prove natural traversal, nested timeline phase, host defaults, interaction branches, audio, language, Replay, scoring, or random outcomes.",
    },
    ...(inventory.animationId === LEGACY_TI_ID ? {legacyTiCompatibility: legacyTiCompatibility(legacyEvidence)} : {}),
    strictAcceptanceEffect: "none; this static factory and every unreviewed fixture output remain engineering candidates only",
  };
  return specification;
}

async function readEvidenceRecord(candidate, id) {
  const text = await readFile(candidate, "utf8");
  return {
    id,
    path: portable(path.relative(projectRoot, candidate)),
    sha256: sha256Text(text),
    text,
    value: JSON.parse(text),
  };
}

async function binaryEvidenceRecord(candidate, id) {
  return {id, path: portable(path.relative(projectRoot, candidate)), sha256: await sha256File(candidate)};
}

async function loadPilotEvidence(migrationsRoot, id) {
  invariant(COURSE_CHILD_PILOT_IDS.includes(id), `unknown course child pilot: ${id}`);
  const auditRoot = path.join(migrationsRoot, id, "audit");
  const [inventoryRecord, readinessRecord, audioRecord, ffdecRecord, swfmillRecord] = await Promise.all([
    readEvidenceRecord(path.join(auditRoot, "scenario-inventory.json"), "scenario-inventory"),
    readEvidenceRecord(path.join(auditRoot, "strict-readiness.json"), "strict-readiness"),
    readEvidenceRecord(path.join(auditRoot, "audio-runtime-evidence.json"), "audio-runtime-evidence"),
    binaryEvidenceRecord(path.join(auditRoot, "machine", "ffdec-scripts.txt.gz"), "ffdec-scripts"),
    binaryEvidenceRecord(path.join(auditRoot, "machine", "swfmill.xml.gz"), "swfmill-xml"),
  ]);
  invariant(inventoryRecord.value.animationId === id, `${id}: scenario inventory identity mismatch`);
  invariant(readinessRecord.value.animationId === id, `${id}: strict-readiness identity mismatch`);
  invariant(audioRecord.value.animationId === id, `${id}: audio evidence identity mismatch`);
  invariant(audioRecord.value.source?.expectedSha256 === inventoryRecord.value.source.swfSha256 && audioRecord.value.source.hashMatches === true, `${id}: audio evidence no longer pins the source hash`);
  const sourcePath = path.resolve(projectRoot, inventoryRecord.value.source.swf);
  const sourceSha256 = await sha256File(sourcePath);
  invariant(sourceSha256 === inventoryRecord.value.source.swfSha256, `${id}: source SWF hash mismatch`);
  const legacyEvidence = [];
  if (id === LEGACY_TI_ID) {
    for (const basename of ["adobe-frame-controller-spec.json", "adobe-frame-controller-engineering-report.json"]) {
      const candidate = path.join(auditRoot, basename);
      invariant(await exists(candidate), `${id}: legacy ${basename} is missing`);
      legacyEvidence.push(await binaryEvidenceRecord(candidate, `legacy-ti-${basename.replace(/\.json$/, "")}`));
    }
  }
  const evidencePins = [inventoryRecord, readinessRecord, audioRecord, ffdecRecord, swfmillRecord]
    .map(({id: pinId, path: pinPath, sha256}) => ({id: pinId, path: pinPath, sha256}));
  const specification = deriveControllerSpecification({
    inventory: inventoryRecord.value,
    evidencePins,
    legacyEvidence,
  });
  return {id, auditRoot, inventory: inventoryRecord.value, specification, legacyEvidence};
}

function validateSpecification(specification) {
  invariant(specification?.schemaVersion === 1, "controller spec: unsupported schemaVersion");
  invariant(COURSE_CHILD_PILOT_IDS.includes(specification.animationId), "controller spec: animationId mismatch");
  invariant(specification.fixtureKind === FIXTURE_KIND, "controller spec: fixtureKind mismatch");
  invariant(isSha256(specification.source?.sha256), "controller spec: invalid source hash");
  invariant(specification.source?.actionScriptVersion === "AS1/2", "controller spec: AVM1 source is required");
  invariant(specification.source?.fps === 12, "controller spec: source FPS changed");
  invariant(specification.timelineContract?.root?.placementName === "animation", "controller spec: root placement must remain animation");
  invariant(specification.timelineContract.local.timelineId === `sprite-${specification.timelineContract.root.placementObjectId}`, "controller spec: local timeline/objectId mismatch");
  invariant(specification.timelineContract.local.frameCount >= 1, "controller spec: local frame count is invalid");
  invariant(specification.timelineContract.consecutiveActualFrameChecksBeforeReveal === 3, "controller spec: exactly three actual-frame checks are required");
  invariant(specification.canonicalTargetFrame >= 1 && specification.canonicalTargetFrame <= specification.timelineContract.local.frameCount, "controller spec: canonical frame is outside local domain");
  invariant(specification.canonicalFrameSelection.visualNonEmptyClaimed === false, "controller spec: static derivation cannot claim visual non-emptiness");
  invariant(specification.safetyPolicy?.fullStageOpaqueFailClosedCover === true && specification.safetyPolicy?.postPinFullStageInputShield === true, "controller spec: shield policy changed");
  invariant(specification.safetyPolicy?.networkDeniedBySandbox === true && specification.safetyPolicy?.outsideWritesDeniedBySandbox === true, "controller spec: sandbox policy changed");
  invariant(specification.safetyPolicy?.sourceChildModified === false && specification.safetyPolicy?.hostBindingsInjected === false, "controller spec: source/binding policy changed");
  invariant(specification.authorityBoundary?.strictBaselineClaimed === false && specification.authorityBoundary?.humanReviewClaimed === false && specification.authorityBoundary?.ownerAcceptanceClaimed === false, "controller spec: authority escalation is forbidden");
  invariant(specification.strictAcceptanceEffect?.startsWith("none"), "controller spec: strictAcceptanceEffect must remain none");
  return specification;
}

async function loadTrackedSpecification(migrationsRoot, id) {
  const evidence = await loadPilotEvidence(migrationsRoot, id);
  const specPath = path.join(evidence.auditRoot, SPEC_BASENAME);
  const expectedText = stableJson(validateSpecification(evidence.specification));
  const actualText = await readFile(specPath, "utf8");
  invariant(actualText === expectedText, `${id}: tracked course frame-controller specification is stale`);
  return {...evidence, specPath, specText: actualText, specSha256: sha256Text(actualText)};
}

export function buildControllerInput({specification, specPath, specSha256, targetFrame, generatorSha256, supportSha256}) {
  validateSpecification(specification);
  invariant(Number.isSafeInteger(targetFrame) && targetFrame >= 1 && targetFrame <= specification.timelineContract.local.frameCount, `${specification.animationId}: target frame must be in 1..${specification.timelineContract.local.frameCount}`);
  invariant(isSha256(generatorSha256) && isSha256(supportSha256), "generator/support hashes are required");
  return {
    schemaVersion: 1,
    animationId: specification.animationId,
    fixtureKind: specification.fixtureKind,
    targetFrame,
    source: specification.source,
    timelineContract: specification.timelineContract,
    unresolvedObligations: specification.unresolvedObligations,
    safetyPolicy: specification.safetyPolicy,
    authorityBoundary: specification.authorityBoundary,
    specification: {path: portable(path.relative(projectRoot, specPath)), sha256: specSha256},
    evidencePins: specification.evidencePins,
    generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: generatorSha256},
    supportModule: {path: portable(path.relative(projectRoot, supportScriptPath)), sha256: supportSha256},
    strictAcceptanceEffect: specification.strictAcceptanceEffect,
  };
}

function asString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
}

export function renderControllerActionScript(input, fixtureDigest) {
  const root = input.timelineContract.root;
  const local = input.timelineContract.local;
  const namedAudioStops = local.namedAudioClipNames.map((name) => `   if(clip[${asString(name)}] != undefined)\n   {\n      clip[${asString(name)}].stop();\n   }`).join("\n");
  return `// HELP_COURSE_FRAME_CONTROLLER visual-engineering fixture. Not an original host or baseline.
Stage.scaleMode = "noScale";
Stage.align = "TL";
_global.__controllerId = ${asString(input.animationId)};
_global.__controllerDigest = ${asString(fixtureDigest)};
_global.__controllerChildPath = ${asString(input.source.fixturePath)};
_global.__controllerChildSha256 = ${asString(input.source.sha256)};
_global.__controllerEntryLabel = ${asString(root.entryLabel)};
_global.__controllerEntryFrame = ${root.entryFrame};
_global.__controllerPlacementName = ${asString(root.placementName)};
_global.__controllerPlacementObjectId = ${root.placementObjectId};
_global.__controllerTargetFrame = ${input.targetFrame};
_global.__controllerExpectedLocalFrames = ${local.frameCount};
_global.__controllerRequiredActualFrameChecks = ${input.timelineContract.consecutiveActualFrameChecksBeforeReveal};
_global.__controllerActualFrameChecks = 0;
_global.__controllerPinAttempts = 0;
_global.__controllerState = "preload";
_global.__controllerEvents = new Array();
_global.__controllerLoadStarted = false;

function __controllerRecord(kind, detail)
{
   var item = new Object();
   item.sequence = _global.__controllerEvents.length + 1;
   item.timerMs = getTimer();
   item.kind = kind;
   item.detail = detail;
   _global.__controllerEvents.push(item);
   trace("HELP_COURSE_FRAME_CONTROLLER|" + item.sequence + "|" + item.timerMs + "|" + kind + "|" + detail);
}

_root.createEmptyMovieClip("InternalPreloader",1);
_root.createEmptyMovieClip("animation_mc",10);
_root.createEmptyMovieClip("__controllerCover",100000);
_root.__controllerCover.beginFill(16777215,100);
_root.__controllerCover.moveTo(0,0);
_root.__controllerCover.lineTo(${input.source.stage.width},0);
_root.__controllerCover.lineTo(${input.source.stage.width},${input.source.stage.height});
_root.__controllerCover.lineTo(0,${input.source.stage.height});
_root.__controllerCover.lineTo(0,0);
_root.__controllerCover.endFill();
_root.createTextField("__controllerStatus",100001,20,20,${input.source.stage.width - 40},${input.source.stage.height - 40});
_root.__controllerStatus.selectable = false;
_root.__controllerStatus.multiline = true;
_root.__controllerStatus.wordWrap = true;
_root.__controllerStatus.text = "SAFE VISUAL FRAME CONTROLLER\\n" + _global.__controllerId + "\\ntarget local frame " + _global.__controllerTargetFrame + " of " + _global.__controllerExpectedLocalFrames + "\\nclick once to load the exact hash-pinned child";

function __controllerFail(code, detail)
{
   _global.__controllerState = "failed";
   _root.animation_mc._visible = false;
   _root.__controllerCover._visible = true;
   _root.__controllerStatus._visible = true;
   _root.__controllerStatus.text = "FRAME CONTROL FAILED CLOSED\\n" + code + "\\n" + detail + "\\nno baseline capture is eligible";
   delete _root.onMouseDown;
   __controllerRecord("failed",code + ":" + detail);
}

function __controllerMute(target, clip)
{
   _global.__controllerRootSound = new Sound(target);
   _global.__controllerRootSound.setVolume(0);
   _global.__controllerLocalSound = new Sound(clip);
   _global.__controllerLocalSound.setVolume(0);
${namedAudioStops || "   // No source-named local audio placement was present in the audited target timeline."}
   stopAllSounds();
}

function __controllerInstallInputShield()
{
   if(_root.__controllerInputShield != undefined)
   {
      return;
   }
   _root.createEmptyMovieClip("__controllerInputShield",99999);
   _root.__controllerInputShield.beginFill(16777215,0);
   _root.__controllerInputShield.moveTo(0,0);
   _root.__controllerInputShield.lineTo(${input.source.stage.width},0);
   _root.__controllerInputShield.lineTo(${input.source.stage.width},${input.source.stage.height});
   _root.__controllerInputShield.lineTo(0,${input.source.stage.height});
   _root.__controllerInputShield.lineTo(0,0);
   _root.__controllerInputShield.endFill();
   _root.__controllerInputShield.useHandCursor = false;
   _root.__controllerInputShield.onPress = function()
   {
      __controllerRecord("blocked-input","capture fixture is read-only after pinning");
   };
}

function __controllerTryPin(target)
{
   _global.__controllerPinAttempts++;
   target._visible = false;
   target.gotoAndStop(_global.__controllerEntryLabel);
   target.stop();
   if(target._currentframe != _global.__controllerEntryFrame)
   {
      __controllerFail("root-frame-mismatch","expected " + _global.__controllerEntryFrame + ", observed " + target._currentframe);
      return false;
   }
   var clip = target[_global.__controllerPlacementName];
   if(clip == undefined)
   {
      if(_global.__controllerPinAttempts >= 3)
      {
         __controllerFail("local-instance-missing",_global.__controllerPlacementName);
      }
      return false;
   }
   clip.gotoAndStop(1);
   clip.stop();
   if(clip._totalframes != _global.__controllerExpectedLocalFrames)
   {
      __controllerFail("local-frame-count-mismatch","expected " + _global.__controllerExpectedLocalFrames + ", observed " + clip._totalframes);
      return false;
   }
   if(clip._currentframe != 1)
   {
      __controllerFail("local-frame-one-unreachable","observed " + clip._currentframe);
      return false;
   }
   clip.gotoAndStop(_global.__controllerTargetFrame);
   clip.stop();
   __controllerMute(target,clip);
   if(clip._currentframe != _global.__controllerTargetFrame)
   {
      __controllerFail("target-frame-mismatch","expected " + _global.__controllerTargetFrame + ", observed " + clip._currentframe);
      return false;
   }
   _global.__controllerLoadedTarget = target;
   _global.__controllerTargetClip = clip;
   _global.__controllerState = "verifying";
   _global.__controllerActualFrameChecks = 0;
   __controllerRecord("target-pinned","root=" + target._currentframe + ",local=" + clip._currentframe);
   return true;
}

_root.__controllerStart = function()
{
   if(_global.__controllerLoadStarted)
   {
      return;
   }
   _global.__controllerLoadStarted = true;
   _global.__controllerState = "loading";
   _root.__controllerStatus.text = "LOADING HASH-PINNED CHILD\\n" + _global.__controllerChildSha256 + "\\ntarget local frame " + _global.__controllerTargetFrame;
   __controllerRecord("child-load-request",_global.__controllerChildPath);
   var listener = new Object();
   listener.onLoadError = function(target,errorCode,httpStatus)
   {
      __controllerFail("child-load-error",errorCode + ":" + httpStatus);
   };
   listener.onLoadInit = function(target)
   {
      _global.__controllerLoadedTarget = target;
      _global.__controllerState = "pinning";
      __controllerRecord("child-load-init",_global.__controllerChildPath);
      __controllerTryPin(target);
   };
   _global.__controllerLoader = new MovieClipLoader();
   _global.__controllerLoader.addListener(listener);
   _global.__controllerLoader.loadClip(_global.__controllerChildPath,_root.animation_mc);
};

_root.onMouseDown = function()
{
   _root.__controllerStart();
};

_root.onEnterFrame = function()
{
   if(_global.__controllerState == "pinning")
   {
      __controllerTryPin(_global.__controllerLoadedTarget);
      return;
   }
   if(_global.__controllerState != "verifying" && _global.__controllerState != "ready")
   {
      return;
   }
   var target = _global.__controllerLoadedTarget;
   var clip = _global.__controllerTargetClip;
   if(target == undefined || clip == undefined)
   {
      __controllerFail("monitor-target-missing","loaded target or local clip disappeared");
      return;
   }
   target.stop();
   clip.stop();
   __controllerMute(target,clip);
   if(target._currentframe != _global.__controllerEntryFrame)
   {
      __controllerFail("root-frame-drift","expected " + _global.__controllerEntryFrame + ", observed " + target._currentframe);
      return;
   }
   if(clip._totalframes != _global.__controllerExpectedLocalFrames)
   {
      __controllerFail("local-frame-count-drift","expected " + _global.__controllerExpectedLocalFrames + ", observed " + clip._totalframes);
      return;
   }
   if(clip._currentframe != _global.__controllerTargetFrame)
   {
      __controllerFail("local-frame-drift","expected " + _global.__controllerTargetFrame + ", observed " + clip._currentframe);
      return;
   }
   if(_global.__controllerState == "verifying")
   {
      _global.__controllerActualFrameChecks++;
      __controllerRecord("actual-frame-check","tick=" + _global.__controllerActualFrameChecks + ",root=" + target._currentframe + ",local=" + clip._currentframe);
      if(_global.__controllerActualFrameChecks >= _global.__controllerRequiredActualFrameChecks)
      {
         _global.__controllerState = "ready";
         __controllerInstallInputShield();
         target._visible = true;
         _root.__controllerCover._visible = false;
         _root.__controllerStatus._visible = false;
         delete _root.onMouseDown;
         __controllerRecord("capture-ready","root=" + target._currentframe + ",local=" + clip._currentframe + ",checks=" + _global.__controllerActualFrameChecks);
      }
   }
};

__controllerRecord("fixture-ready",_global.__controllerDigest + ":frame=" + _global.__controllerTargetFrame);
stop();
`;
}

function assertSafeControllerSource(source, label) {
  invariant(!BLOCKED_SOURCE_PRIMITIVES.test(source), `${label}: blocked legacy primitive found`);
  for (const marker of REQUIRED_MARKERS) invariant(source.includes(marker), `${label}: missing ${marker}`);
  invariant(source.includes("MovieClipLoader"), `${label}: exact local child loader is missing`);
  invariant(source.includes("gotoAndStop"), `${label}: local frame controller is missing`);
  invariant(source.includes("stopAllSounds"), `${label}: visual-only audio suppression is missing`);
  invariant(source.includes("FRAME CONTROL FAILED CLOSED"), `${label}: opaque fail-closed presentation is missing`);
}

async function compileHost({directory, hostSource, baseXml, toolchain}) {
  invariant(toolchain.canCompileFixture, "swfmill and FFDec importScript are required to compile the course controller fixture");
  assertSafeControllerSource(hostSource, "controller source");
  const baseXmlPath = path.join(directory, "host-base.xml");
  const baseSwfPath = path.join(directory, "host-base.swf");
  const scriptsRoot = path.join(directory, "as-import", "scripts");
  const actionPath = path.join(scriptsRoot, "frame_1", "DoAction.as");
  const firstPath = path.join(directory, "host-build-a.swf");
  const secondPath = path.join(directory, "host-build-b.swf");
  const finalPath = path.join(directory, "host.swf");
  const decompileRoot = path.join(directory, "compiled-host-export");
  const decompiledPath = path.join(directory, "compiled-host-decompiled.as");
  await mkdir(path.dirname(actionPath), {recursive: true});
  await Promise.all([writeFile(baseXmlPath, baseXml, "utf8"), writeFile(actionPath, hostSource, "utf8")]);
  await run(toolchain.swfmill.path, ["xml2swf", baseXmlPath, baseSwfPath]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, firstPath, scriptsRoot]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, secondPath, scriptsRoot]);
  const [firstHash, secondHash] = await Promise.all([sha256File(firstPath), sha256File(secondPath)]);
  invariant(firstHash === secondHash, `controller compilation is not deterministic: ${firstHash} != ${secondHash}`);
  await copyFile(firstPath, finalPath);
  const dump = await run(toolchain.ffdec.path, ["-dumpAS2", finalPath]);
  invariant(`${dump.stdout}\n${dump.stderr}`.includes("/frame 1 - DoAction"), "compiled controller is missing its frame-1 DoAction");
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-export", "script", decompileRoot, finalPath]);
  const exportedScriptPath = path.join(decompileRoot, "scripts", "frame_1", "DoAction.as");
  const decompiledText = await readFile(exportedScriptPath, "utf8");
  assertSafeControllerSource(decompiledText, "decompiled controller");
  await writeFile(decompiledPath, decompiledText, "utf8");
  return {
    hostPath: finalPath,
    hostSha256: firstHash,
    deterministicDoubleBuild: true,
    decompiledMarkersVerified: true,
    baseXmlPath,
    baseSwfPath,
    actionPath,
    firstPath,
    secondPath,
    decompiledPath,
    exportedScriptPath,
  };
}

async function copyVerified(source, destination, expectedSha256) {
  invariant(await sha256File(source) === expectedSha256, `${source}: source hash changed`);
  await mkdir(path.dirname(destination), {recursive: true});
  if (await exists(destination)) {
    invariant(await sha256File(destination) === expectedSha256, `${destination}: existing content-addressed dependency differs`);
    return destination;
  }
  await copyFile(source, destination);
  invariant(await sha256File(destination) === expectedSha256, `${destination}: copied hash mismatch`);
  return destination;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function probeSandboxProfile(profilePath, directory) {
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/true"]);
  const insidePath = path.join(directory, "sandbox-write-probe.txt");
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf controller-write-allowed > \"$1\"", "controller-probe", insidePath]);
  invariant(await readFile(insidePath, "utf8") === "controller-write-allowed", "sandbox did not permit its fixture-local write probe");
  const relativeToTemporaryRoot = path.relative(os.tmpdir(), directory);
  const fixtureIsInsideTemporaryRoot = relativeToTemporaryRoot === "" || (!relativeToTemporaryRoot.startsWith("..") && !path.isAbsolute(relativeToTemporaryRoot));
  const outsidePath = fixtureIsInsideTemporaryRoot
    ? path.join(projectRoot, "work", `course-controller-sandbox-outside-write-${sha256Text(directory).slice(0, 16)}-must-not-exist`)
    : `${directory}-sandbox-outside-write-must-not-exist`;
  invariant(!(await exists(outsidePath)), `sandbox outside-write probe path already exists: ${outsidePath}`);
  let outsideWriteDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf forbidden > \"$1\"", "controller-probe", outsidePath]);
  } catch {
    outsideWriteDenied = true;
  }
  invariant(outsideWriteDenied && !(await exists(outsidePath)), "sandbox allowed a write outside fixture/temp roots");
  let connected = false;
  const server = createServer((socket) => {
    connected = true;
    socket.end();
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  let localTcpDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/nc", "-w", "1", "127.0.0.1", String(server.address().port)], {timeoutMs: 5_000});
  } catch {
    localTcpDenied = true;
  } finally {
    await closeServer(server);
  }
  invariant(localTcpDenied && !connected, "sandbox allowed a local TCP connection");
  return {
    syntaxSmokeTest: "passed-with-/usr/bin/true",
    insideWriteAllowed: true,
    outsideWriteDenied: true,
    localTcpDenied: true,
    probeFilePath: insidePath,
  };
}

function renderLauncher(manifestPath, profilePath, hostPath, smokeOnly) {
  const verification = smokeOnly
    ? `echo "GUI sandbox smoke only: verify the pre-load controller screen and DO NOT CLICK the stage."\nnode ${JSON.stringify(scriptPath)} --verify ${JSON.stringify(manifestPath)}`
    : `node ${JSON.stringify(scriptPath)} --verify-launch ${JSON.stringify(manifestPath)}`;
  return `#!/bin/sh
set -eu
${verification}
exec /usr/bin/sandbox-exec -f ${JSON.stringify(profilePath)} ${JSON.stringify(flashPlayerPath)} ${JSON.stringify(hostPath)}
`;
}

function renderSmokeTemplate(input, fixtureDigest) {
  return stableJson({
    schemaVersion: 1,
    animationId: input.animationId,
    fixtureDigest,
    targetFrame: input.targetFrame,
    status: "replace-with-passed-after-observed-sandboxed-pre-load-smoke",
    reviewer: "",
    reviewedAt: "",
    evidenceFile: "capture/replace-with-app-window-smoke-evidence.png",
    evidenceMimeType: "image/png",
    evidenceSha256: "",
    observation: "Flash Player opened through smoke-sandboxed.sh and showed only the opaque pre-load controller screen. The stage was not clicked and the child was not loaded. This safety smoke is not a visual-fidelity baseline.",
  });
}

function renderReadme(input) {
  const root = input.timelineContract.root;
  const local = input.timelineContract.local;
  return `# ${input.animationId} Adobe local-frame controller candidate

This generated AVM1 host loads one exact, hash-pinned untouched child only after an explicit click. It holds the child root at label \`${root.entryLabel}\` (frame ${root.entryFrame}) and directly seeks the source-named \`${root.placementName}\` instance (\`${local.timelineId}\`) to one-indexed local frame ${input.targetFrame}.

The full-stage opaque cover disappears only after three consecutive monitor ticks report the actual root frame ${root.entryFrame}, local frame ${input.targetFrame}, and local frame count ${local.frameCount}. Any mismatch hides the child and shows \`FRAME CONTROL FAILED CLOSED\`. A transparent full-stage shield then blocks pointer interaction.

- Run \`smoke-sandboxed.sh\` first without clicking and record a separate safety approval. Normal launch remains blocked until that approval verifies.
- Run later probes only through \`launch-sandboxed.sh\`. Network, Apple Events, LaunchServices open/database operations, and writes outside fixture/temp roots are denied.
- Audio is forced to volume zero and repeatedly stopped. This fixture cannot prove audio identity, listening, cues, synchronization, or Replay.
- Direct \`gotoAndStop\` does not prove natural playback, nested timeline phase, host bindings/defaults, interactions, scoring, random outcomes, Replay, or English/Spanish behavior.
- The canonical frame is source-audited as a structural key candidate; static evidence does not claim it is visually non-empty. A lossless authorized Adobe capture and identity record are still required.
- No strict, human-review, owner-acceptance, migration status, or review field is changed by this fixture.
`;
}

async function hashGeneratedFiles(directory, files) {
  const records = [];
  for (const candidate of files) records.push({path: assertRelative(portable(path.relative(directory, candidate)), "generated file"), sha256: await sha256File(candidate)});
  records.sort((left, right) => compareText(left.path, right.path));
  invariant(new Set(records.map((item) => item.path)).size === records.length, "generated file list contains duplicates");
  return records;
}

function buildEngineeringReport({manifestPath, manifestSha256, manifest, specification, specPath, specSha256, generatorSha256, supportSha256}) {
  const local = specification.timelineContract.local;
  return {
    schemaVersion: 1,
    animationId: specification.animationId,
    reportKind: "adobe-avm1-course-local-frame-controller-engineering-candidate",
    decision: "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven",
    migrationStatusChanged: false,
    reviewFieldsChanged: false,
    authority: {
      sourceChildUntouched: true,
      originalCourseShellExecuted: false,
      originalHostBehaviorClaimed: false,
      naturalPlaybackClaimed: false,
      branchTraversalClaimed: false,
      languageClaimed: false,
      audioClaimed: false,
      authoritativeBaselineClaimed: false,
      humanReviewClaimed: false,
      ownerAcceptanceClaimed: false,
    },
    factory: {
      specification: {path: portable(path.relative(projectRoot, specPath)), sha256: specSha256},
      generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: generatorSha256},
      supportModule: {path: portable(path.relative(projectRoot, supportScriptPath)), sha256: supportSha256},
      canonicalFixture: {
        targetFrame: manifest.targetFrame,
        fixtureDigest: manifest.fixtureDigest,
        manifest: portable(path.relative(projectRoot, manifestPath)),
        manifestSha256,
        hostSha256: manifest.compilation.hostSha256,
        deterministicDoubleBuild: manifest.compilation.deterministicDoubleBuild,
        decompiledMarkersVerified: manifest.compilation.decompiledMarkersVerified,
      },
      verificationCommands: [
        `node scripts/build-adobe-course-frame-controller-fixtures.mjs --verify ${portable(path.relative(projectRoot, manifestPath))}`,
        "node scripts/build-adobe-course-frame-controller-fixtures.mjs --check",
        `node scripts/build-adobe-course-frame-controller-fixtures.mjs --id ${specification.animationId} --frame ${manifest.targetFrame}`,
      ],
    },
    controllerContract: {
      sourceStage: specification.source.stage,
      sourceFps: specification.source.fps,
      sourceRootFrame: specification.timelineContract.root.entryFrame,
      sourceRootLabel: specification.timelineContract.root.entryLabel,
      sourcePlacementName: specification.timelineContract.root.placementName,
      sourcePlacementObjectId: specification.timelineContract.root.placementObjectId,
      localTimeline: local.timelineId,
      localFrameDomain: {start: 1, endInclusive: local.frameCount, indexing: "one-indexed"},
      canonicalTargetFrame: manifest.targetFrame,
      canonicalSelection: specification.canonicalFrameSelection,
      actualFrameChecksBeforeReveal: specification.timelineContract.consecutiveActualFrameChecksBeforeReveal,
      successPresentation: "The untouched child is revealed with no controller pixels after three actual-frame checks pass.",
      failurePresentation: "The child remains hidden behind a full-stage opaque FRAME CONTROL FAILED CLOSED screen.",
      postPinInputPolicy: "A transparent full-stage top-depth shield blocks pointer input while root/local frame and audio checks continue.",
      audioPolicy: `The loaded root/local movie is held at volume zero, ${local.namedAudioClipNames.length} source-named local audio placements are explicitly stopped, and stopAllSounds is repeated.`,
    },
    staticallyProven: [
      "The root animation placement, its exact frame/label/objectId, the corresponding local sprite frameCount, source hash, native stage, and FPS are derived from the reviewed scenario inventory without basename or timeline guessing.",
      "Every source/evidence/spec/generator/support input is hash-pinned; the untouched child is copied byte-for-byte into a content-addressed fixture.",
      "The host is compiled twice from identical inputs to the same SWF hash, then decompiled and checked for fail-closed, target-frame, three-tick actual-frame, audio-suppression, and blocked-primitive markers.",
      "Sandbox syntax, fixture-local write, outside-write denial, and loopback-network denial probes pass before any GUI launch is eligible.",
      `The factory supports every one-indexed local frame 1..${local.frameCount}; the tracked canonical probe is frame ${manifest.targetFrame}.`,
    ],
    unresolvedObligations: specification.unresolvedObligations,
    runtimeProofStillRequired: [
      "Run the exact fixture through the sandbox in the authorized Adobe Flash Player only after a separate no-click GUI safety smoke is reviewed.",
      `Observe that the cover disappears only after one explicit load click and three actual-frame ticks report root ${specification.timelineContract.root.entryFrame}, local ${manifest.targetFrame}, and local frameCount ${local.frameCount}.`,
      `Record a lossless native ${specification.source.stage.width}x${specification.source.stage.height} stage capture plus a separate fixture digest, requested frame, and observed actual-frame trace record.`,
    ],
    limitations: [
      "Direct gotoAndStop is a visual engineering seek and does not reproduce elapsed-time traversal or nested timeline phase through preceding local frames.",
      "Unknown host bindings are deliberately not synthesized; frame scripts may therefore be incomplete even if a visual candidate appears.",
      "The fixture suppresses all audio and cannot support listening, identity, cue, synchronization, stop, or Replay acceptance.",
      "Interaction, branch, drag, scoring, random, Replay, language, original-shell, and external-dependency behavior remain separate blockers exactly as listed.",
      "A successful Adobe probe would establish only a controlled source-addressed visual candidate; RMSE comparison, product QA, human review, owner acceptance, and strict validation remain pending.",
    ],
    ...(specification.legacyTiCompatibility ? {legacyTiCompatibility: specification.legacyTiCompatibility} : {}),
    strictAcceptanceEffect: "none; retain every baseline, language, audio, behavior, product, human, owner, validator, regression, and build blocker",
  };
}

async function buildFixture({loaded, outputRoot, targetFrame, toolchain, compile, generatorSha256, supportSha256}) {
  const input = buildControllerInput({
    specification: loaded.specification,
    specPath: loaded.specPath,
    specSha256: loaded.specSha256,
    targetFrame,
    generatorSha256,
    supportSha256,
  });
  const fixtureDigest = sha256Text(stableJson(input));
  const directory = path.join(outputRoot, "generated", input.animationId, `frame-${String(targetFrame).padStart(4, "0")}`, fixtureDigest.slice(0, 24));
  await mkdir(directory, {recursive: true});
  const materializedSpecPath = path.join(directory, "fixture-spec.json");
  const hostSourcePath = path.join(directory, "host.as");
  const hostSource = renderControllerActionScript(input, fixtureDigest);
  assertSafeControllerSource(hostSource, "controller source");
  await Promise.all([
    writeFile(materializedSpecPath, stableJson({...input, fixtureDigest}), "utf8"),
    writeFile(hostSourcePath, hostSource, "utf8"),
  ]);
  const childPath = path.join(directory, assertRelative(input.source.fixturePath, "child fixture path"));
  await copyVerified(path.resolve(projectRoot, input.source.path), childPath, input.source.sha256);
  const compileResult = compile ? await compileHost({
    directory,
    hostSource,
    baseXml: renderBaseSwfXml(input.source.stage, input.source.fps),
    toolchain,
  }) : null;
  const fixtureRealRoot = await realpath(directory);
  const temporaryRealRoot = await realpath(os.tmpdir());
  const profilePath = path.join(directory, "sandbox.sb");
  await writeFile(profilePath, renderSandboxProfile({fixtureRoot: fixtureRealRoot, temporaryRoot: temporaryRealRoot}), "utf8");
  const sandboxProbe = await probeSandboxProfile(profilePath, directory);
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const hostPath = compileResult?.hostPath || path.join(directory, "host.swf");
  const launcherPath = path.join(directory, "launch-sandboxed.sh");
  const smokeLauncherPath = path.join(directory, "smoke-sandboxed.sh");
  const smokeTemplatePath = path.join(directory, "sandbox-gui-smoke-test.template.json");
  const readmePath = path.join(directory, "README.md");
  await Promise.all([
    writeFile(launcherPath, renderLauncher(manifestPath, profilePath, hostPath, false), "utf8"),
    writeFile(smokeLauncherPath, renderLauncher(manifestPath, profilePath, hostPath, true), "utf8"),
    writeFile(smokeTemplatePath, renderSmokeTemplate(input, fixtureDigest), "utf8"),
    writeFile(readmePath, renderReadme(input), "utf8"),
  ]);
  await Promise.all([chmod(launcherPath, 0o755), chmod(smokeLauncherPath, 0o755)]);
  const generatedFiles = [
    materializedSpecPath,
    hostSourcePath,
    childPath,
    profilePath,
    sandboxProbe.probeFilePath,
    launcherPath,
    smokeLauncherPath,
    smokeTemplatePath,
    readmePath,
  ];
  if (compileResult) generatedFiles.push(
    compileResult.hostPath,
    compileResult.baseXmlPath,
    compileResult.baseSwfPath,
    compileResult.actionPath,
    compileResult.firstPath,
    compileResult.secondPath,
    compileResult.decompiledPath,
    compileResult.exportedScriptPath,
  );
  const generatedFileHashes = await hashGeneratedFiles(directory, generatedFiles);
  const manifest = {
    schemaVersion: 1,
    animationId: input.animationId,
    fixtureKind: input.fixtureKind,
    fixtureDigest,
    targetFrame,
    directory: portable(path.relative(projectRoot, directory)),
    source: input.source,
    timelineContract: input.timelineContract,
    unresolvedObligations: input.unresolvedObligations,
    specification: input.specification,
    evidencePins: input.evidencePins,
    generator: input.generator,
    supportModule: input.supportModule,
    compilation: compileResult ? {
      status: "compiled-deterministic-double-build",
      hostSha256: compileResult.hostSha256,
      deterministicDoubleBuild: true,
      decompiledMarkersVerified: true,
      toolchain: {swfmill: toolchain.swfmill, ffdec: toolchain.ffdec},
    } : {
      status: "not-compiled",
      deterministicDoubleBuild: false,
      decompiledMarkersVerified: false,
    },
    sandbox: {
      ...sandboxProbe,
      probeFilePath: portable(path.relative(directory, sandboxProbe.probeFilePath)),
      networkDenied: true,
      appleEventsDenied: true,
      launchServicesOpenAndDatabaseDenied: true,
      writesRestricted: true,
    },
    runtimeVerification: {
      status: "pending-not-run-by-static-factory",
      requestedFrameRecorded: targetFrame,
      actualFrameThreeTickRuntimeProof: "pending",
      exactFrameClaimed: false,
      authoritativeBaselineClaimed: false,
      requiredObservation: `After one explicit click, the opaque cover disappears only after three actual-frame records report root ${input.timelineContract.root.entryFrame} and local ${targetFrame}; lossless capture and trace identity evidence remain separate.`,
    },
    guiSmokeAuthorization: {
      requiredApproval: "capture/sandbox-gui-smoke-test.json",
      template: "sandbox-gui-smoke-test.template.json",
      smokeLauncher: "smoke-sandboxed.sh",
      rule: "do not click the opaque pre-load screen during the safety smoke",
    },
    launchPolicy: compile ? "launch-only-through-launch-sandboxed.sh-after-hash-verified-gui-smoke" : "blocked-host-not-compiled",
    generatedFileHashes,
    strictAcceptanceEffect: input.strictAcceptanceEffect,
  };
  await writeFile(manifestPath, stableJson(manifest), "utf8");
  return {directory, manifestPath, manifest, manifestSha256: await sha256File(manifestPath)};
}

async function assertNoUnlistedFixtureFiles(directory, listedFiles) {
  const expected = new Set(listedFiles);
  const walk = async (root, prefix = "") => {
    for (const entry of await readdir(root, {withFileTypes: true})) {
      const relative = portable(path.join(prefix, entry.name));
      if (relative === "capture" || relative.startsWith("capture/")) continue;
      if (entry.isDirectory()) await walk(path.join(root, entry.name), relative);
      else {
        invariant(!entry.isSymbolicLink(), `${relative}: symbolic links are forbidden in fixtures`);
        if (relative !== "fixture-manifest.json") invariant(expected.has(relative), `${relative}: unlisted fixture file`);
      }
    }
  };
  await walk(directory);
}

export async function verifyFixtureManifest(manifestPath, {migrationsRoot = defaultMigrationsRoot} = {}) {
  const directory = path.dirname(manifestPath);
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  invariant(manifest.schemaVersion === 1 && COURSE_CHILD_PILOT_IDS.includes(manifest.animationId), "controller manifest identity mismatch");
  invariant(manifest.fixtureKind === FIXTURE_KIND, "controller manifest kind mismatch");
  invariant(Number.isSafeInteger(manifest.targetFrame), "controller manifest target frame is invalid");
  invariant(isSha256(manifest.fixtureDigest), "controller manifest digest is invalid");
  const [generatorSha256, supportSha256] = await Promise.all([sha256File(scriptPath), sha256File(supportScriptPath)]);
  invariant(manifest.generator?.sha256 === generatorSha256, "controller generator hash mismatch");
  invariant(manifest.supportModule?.sha256 === supportSha256, "controller support hash mismatch");
  const loaded = await loadTrackedSpecification(migrationsRoot, manifest.animationId);
  invariant(manifest.specification?.path === portable(path.relative(projectRoot, loaded.specPath)), "controller manifest specification path mismatch");
  invariant(manifest.specification.sha256 === loaded.specSha256, "controller manifest specification hash mismatch");
  const expectedInput = buildControllerInput({
    specification: loaded.specification,
    specPath: loaded.specPath,
    specSha256: loaded.specSha256,
    targetFrame: manifest.targetFrame,
    generatorSha256,
    supportSha256,
  });
  invariant(sha256Text(stableJson(expectedInput)) === manifest.fixtureDigest, "controller manifest digest no longer matches current pinned inputs");
  invariant(stableJson(manifest.evidencePins) === stableJson(expectedInput.evidencePins), "controller manifest evidence pins changed");
  invariant(manifest.source.sha256 === loaded.specification.source.sha256, "controller manifest source hash changed");
  invariant(manifest.sandbox?.networkDenied === true && manifest.sandbox?.outsideWriteDenied === true && manifest.sandbox?.localTcpDenied === true, "controller manifest sandbox proof is incomplete");
  invariant(manifest.runtimeVerification?.exactFrameClaimed === false && manifest.runtimeVerification?.authoritativeBaselineClaimed === false && manifest.runtimeVerification?.actualFrameThreeTickRuntimeProof === "pending", "static controller manifest cannot claim runtime/authoritative proof");
  invariant(manifest.strictAcceptanceEffect?.startsWith("none"), "controller manifest cannot affect strict acceptance");
  invariant(Array.isArray(manifest.generatedFileHashes) && manifest.generatedFileHashes.length > 0, "controller manifest generated files are missing");
  const seen = new Set();
  for (const item of manifest.generatedFileHashes) {
    const relative = assertRelative(item.path, "controller generated file");
    invariant(!seen.has(relative), `controller manifest has duplicate generated path ${relative}`);
    seen.add(relative);
    invariant(isSha256(item.sha256), `${relative}: invalid generated hash`);
    invariant(await sha256File(path.resolve(directory, relative)) === item.sha256, `${relative}: generated hash mismatch`);
  }
  await assertNoUnlistedFixtureFiles(directory, seen);
  const materialized = JSON.parse(await readFile(path.join(directory, "fixture-spec.json"), "utf8"));
  invariant(materialized.fixtureDigest === manifest.fixtureDigest && materialized.targetFrame === manifest.targetFrame, "materialized controller spec mismatch");
  const hostSource = await readFile(path.join(directory, "host.as"), "utf8");
  assertSafeControllerSource(hostSource, "controller source");
  invariant(hostSource.includes(`_global.__controllerTargetFrame = ${manifest.targetFrame};`), "controller source target frame mismatch");
  invariant(hostSource.includes("_global.__controllerRequiredActualFrameChecks = 3;"), "controller source actual-frame check count mismatch");
  if (manifest.compilation.status === "compiled-deterministic-double-build") {
    invariant(await sha256File(path.join(directory, "host.swf")) === manifest.compilation.hostSha256, "compiled controller host hash mismatch");
    invariant(await sha256File(path.join(directory, "host-build-a.swf")) === await sha256File(path.join(directory, "host-build-b.swf")), "compiled double-build hash mismatch");
    const decompiled = await readFile(path.join(directory, "compiled-host-decompiled.as"), "utf8");
    assertSafeControllerSource(decompiled, "decompiled controller");
    invariant(manifest.compilation.deterministicDoubleBuild === true && manifest.compilation.decompiledMarkersVerified === true, "controller compilation proof is incomplete");
  } else invariant(manifest.compilation.status === "not-compiled", "controller compilation status is invalid");
  return {manifest, manifestPath, manifestSha256: sha256Text(manifestText), loaded};
}

export async function verifyLaunchAuthorization(manifestPath, options = {}) {
  const verified = await verifyFixtureManifest(manifestPath, options);
  const directory = path.dirname(manifestPath);
  const approvalRelative = assertRelative(verified.manifest.guiSmokeAuthorization?.requiredApproval, "GUI smoke approval");
  const approvalPath = path.join(directory, approvalRelative);
  invariant(await exists(approvalPath), `GUI sandbox smoke evidence is pending: ${approvalRelative}`);
  const approval = JSON.parse(await readFile(approvalPath, "utf8"));
  invariant(approval.animationId === verified.manifest.animationId, "GUI smoke animationId mismatch");
  invariant(approval.fixtureDigest === verified.manifest.fixtureDigest, "GUI smoke fixture digest mismatch");
  invariant(approval.targetFrame === verified.manifest.targetFrame, "GUI smoke target frame mismatch");
  invariant(approval.status === "passed", "GUI sandbox smoke status is not passed");
  invariant(typeof approval.reviewer === "string" && approval.reviewer.trim().length > 0, "GUI smoke reviewer is missing");
  invariant(Number.isFinite(Date.parse(approval.reviewedAt)), "GUI smoke reviewedAt is invalid");
  invariant(["image/png", "image/jpeg"].includes(approval.evidenceMimeType), "GUI smoke evidence MIME type is invalid");
  invariant(isSha256(approval.evidenceSha256), "GUI smoke evidence hash is invalid");
  const evidencePath = path.join(directory, assertRelative(approval.evidenceFile, "GUI smoke evidence"));
  invariant(await sha256File(evidencePath) === approval.evidenceSha256, "GUI smoke evidence hash mismatch");
  invariant(/not clicked|not click|no child was loaded/i.test(approval.observation || ""), "GUI smoke observation must state that the stage was not clicked and no child loaded");
  return {...verified, approval};
}

function renderGlobalMarkdown(index) {
  const rows = index.fixtures.map((item) => `| ${item.animationId} | ${item.rootEntryLabel}@${item.rootEntryFrame} | ${item.localTimeline} | ${item.localFrameCount} | ${item.canonicalTargetFrame} | ${item.unresolvedHostBindingCount} | ${item.randomObligationCount} |`).join("\n");
  return `# Nine-course Adobe local-frame controller factory

This report covers the nine course-child pilots only; the course shell is excluded. Every specification is derived from the reviewed \`scenario-inventory.json\`: the unique root \`animation\` placement, its frame/label/objectId, corresponding local sprite frame count, source hash, native stage, and 12 FPS metadata.

| Animation | Root entry | Local timeline | Local frames | Canonical probe | Host-binding blockers | Random blockers |
|---|---:|---:|---:|---:|---:|---:|
${rows}

All ${index.fixtureCount} canonical fixtures were compiled twice to identical hashes, decompiled for controller/safety markers, and passed sandbox syntax, local-write, outside-write-denial, and loopback-network-denial probes. No Adobe GUI was launched.

The canonical selection is structural only. It prefers the first audited local frame label after frame 1, then a nonterminal stop/action state, then an audited terminal state. It does not claim the selected frame is visually non-empty. Runtime confirmation must separately prove requested/actual frame equality for three ticks and preserve a lossless native-stage capture.

These fixtures mute and stop all audio and do not synthesize unknown host bindings. They cannot prove natural playback, nested phase, interaction branches, random outcomes, scoring, Replay, English/Spanish behavior, audio, RMSE, product QA, human review, or owner acceptance. Strict acceptance effect: **none**.

The earlier TI-only specification/report and output directory remain byte-preserved and are referenced by hash from the new TI compatibility record; this factory uses separate filenames and a separate output namespace.
`;
}

function buildGlobalIndex({fixtures, generatorSha256, supportSha256}) {
  return {
    schemaVersion: 1,
    reportKind: "nine-course-adobe-local-frame-controller-factory-index",
    generatedBy: {path: portable(path.relative(projectRoot, scriptPath)), sha256: generatorSha256},
    supportModule: {path: portable(path.relative(projectRoot, supportScriptPath)), sha256: supportSha256},
    fixtureCount: fixtures.length,
    courseShellExcluded: true,
    fixtures: fixtures.map(({loaded, manifest, manifestPath, manifestSha256, reportPath, reportSha256}) => ({
      animationId: manifest.animationId,
      sourceSha256: manifest.source.sha256,
      stage: manifest.source.stage,
      fps: manifest.source.fps,
      rootEntryFrame: manifest.timelineContract.root.entryFrame,
      rootEntryLabel: manifest.timelineContract.root.entryLabel,
      rootPlacementObjectId: manifest.timelineContract.root.placementObjectId,
      localTimeline: manifest.timelineContract.local.timelineId,
      localFrameCount: manifest.timelineContract.local.frameCount,
      canonicalTargetFrame: manifest.targetFrame,
      canonicalSelectionStrategy: loaded.specification.canonicalFrameSelection.strategy,
      visualNonEmptyClaimed: false,
      unresolvedHostBindingCount: loaded.specification.unresolvedObligations.hostBindings.length,
      randomObligationCount: loaded.specification.unresolvedObligations.randomObligationCount,
      fixtureDigest: manifest.fixtureDigest,
      manifest: portable(path.relative(projectRoot, manifestPath)),
      manifestSha256,
      report: portable(path.relative(projectRoot, reportPath)),
      reportSha256,
      hostSha256: manifest.compilation.hostSha256,
      deterministicDoubleBuild: manifest.compilation.deterministicDoubleBuild,
      decompiledMarkersVerified: manifest.compilation.decompiledMarkersVerified,
      staticVerification: {
        sourceAndEvidenceHashesVerified: true,
        sandboxSyntaxSmokeTest: manifest.sandbox.syntaxSmokeTest,
        insideWriteAllowed: manifest.sandbox.insideWriteAllowed,
        outsideWriteDenied: manifest.sandbox.outsideWriteDenied,
        loopbackNetworkDenied: manifest.sandbox.localTcpDenied,
        networkDeniedByLaunchProfile: manifest.sandbox.networkDenied,
      },
      runtimeVerification: manifest.runtimeVerification.status,
      strictAcceptanceEffect: "none",
    })),
    authority: "static source-derived specification, deterministic compilation, decompiled marker verification, and sandbox probes only; no Adobe GUI action, runtime frame proof, baseline, status, review, or acceptance change",
    strictAcceptanceEffect: "none",
  };
}

async function writeOrCheck(candidate, expectedText, check, label) {
  if (check) invariant(await readFile(candidate, "utf8") === expectedText, `${label} is stale`);
  else {
    await mkdir(path.dirname(candidate), {recursive: true});
    await writeFile(candidate, expectedText, "utf8");
  }
}

async function prepareTrackedSpecification(migrationsRoot, id, check) {
  const evidence = await loadPilotEvidence(migrationsRoot, id);
  const specPath = path.join(evidence.auditRoot, SPEC_BASENAME);
  const specText = stableJson(validateSpecification(evidence.specification));
  await writeOrCheck(specPath, specText, check, `${id}: controller specification`);
  return {...evidence, specPath, specText, specSha256: sha256Text(specText)};
}

async function checkCanonicalFixture({loaded, migrationsRoot}) {
  const reportPath = path.join(loaded.auditRoot, REPORT_BASENAME);
  const reportText = await readFile(reportPath, "utf8");
  const report = JSON.parse(reportText);
  invariant(report.animationId === loaded.id, `${loaded.id}: controller report identity mismatch`);
  invariant(report.decision === "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven", `${loaded.id}: controller report decision changed`);
  const manifestPath = path.resolve(projectRoot, assertRelative(report.factory?.canonicalFixture?.manifest, `${loaded.id}: report manifest`));
  const verified = await verifyFixtureManifest(manifestPath, {migrationsRoot});
  invariant(verified.manifest.targetFrame === loaded.specification.canonicalTargetFrame, `${loaded.id}: report no longer points to canonical frame`);
  invariant(verified.manifestSha256 === report.factory.canonicalFixture.manifestSha256, `${loaded.id}: report manifest hash mismatch`);
  const [generatorSha256, supportSha256] = await Promise.all([sha256File(scriptPath), sha256File(supportScriptPath)]);
  const expectedReport = buildEngineeringReport({
    manifestPath,
    manifestSha256: verified.manifestSha256,
    manifest: verified.manifest,
    specification: loaded.specification,
    specPath: loaded.specPath,
    specSha256: loaded.specSha256,
    generatorSha256,
    supportSha256,
  });
  invariant(stableJson(expectedReport) === reportText, `${loaded.id}: controller engineering report is stale`);
  return {loaded, ...verified, reportPath, report, reportSha256: sha256Text(reportText)};
}

export async function buildAdobeCourseFrameControllerFixtures(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const outputRoot = path.resolve(options.outputRoot || defaultOutputRoot);
  const reportsRoot = path.resolve(options.reportsRoot || defaultReportsRoot);
  const ids = options.ids?.length ? options.ids : COURSE_CHILD_PILOT_IDS;
  const fullCanonicalSet = ids.length === COURSE_CHILD_PILOT_IDS.length
    && COURSE_CHILD_PILOT_IDS.every((id) => ids.includes(id))
    && options.frame == null;
  if (options.check) invariant(fullCanonicalSet, "--check requires the complete canonical nine-course set");
  const [generatorSha256, supportSha256] = await Promise.all([sha256File(scriptPath), sha256File(supportScriptPath)]);
  const loadedRecords = [];
  for (const id of ids) loadedRecords.push(await prepareTrackedSpecification(migrationsRoot, id, Boolean(options.check)));
  let fixtures;
  if (options.check) {
    fixtures = [];
    for (const loaded of loadedRecords) fixtures.push(await checkCanonicalFixture({loaded, migrationsRoot}));
  } else {
    const toolchain = await probeFixtureToolchain();
    if (options.compile !== false) invariant(toolchain.canCompileFixture, "FFDec and swfmill are required to compile the course controller fixtures");
    fixtures = [];
    for (const loaded of loadedRecords) {
      const targetFrame = options.frame ?? loaded.specification.canonicalTargetFrame;
      const built = await buildFixture({
        loaded,
        outputRoot,
        targetFrame,
        toolchain,
        compile: options.compile !== false,
        generatorSha256,
        supportSha256,
      });
      let reportPath = null;
      let report = null;
      let reportSha256 = null;
      if (options.compile !== false && targetFrame === loaded.specification.canonicalTargetFrame) {
        reportPath = path.join(loaded.auditRoot, REPORT_BASENAME);
        report = buildEngineeringReport({
          manifestPath: built.manifestPath,
          manifestSha256: built.manifestSha256,
          manifest: built.manifest,
          specification: loaded.specification,
          specPath: loaded.specPath,
          specSha256: loaded.specSha256,
          generatorSha256,
          supportSha256,
        });
        const reportText = stableJson(report);
        await writeFile(reportPath, reportText, "utf8");
        reportSha256 = sha256Text(reportText);
      }
      fixtures.push({loaded, ...built, reportPath, report, reportSha256});
    }
  }
  let indexPath = null;
  let markdownPath = null;
  let index = null;
  if (fullCanonicalSet && fixtures.every((item) => item.reportPath)) {
    index = buildGlobalIndex({fixtures, generatorSha256, supportSha256});
    const indexText = stableJson(index);
    const markdownText = renderGlobalMarkdown(index);
    indexPath = path.join(reportsRoot, GLOBAL_INDEX_BASENAME);
    markdownPath = path.join(reportsRoot, GLOBAL_REPORT_BASENAME);
    await Promise.all([
      writeOrCheck(indexPath, indexText, Boolean(options.check), "global course controller index"),
      writeOrCheck(markdownPath, markdownText, Boolean(options.check), "global course controller report"),
    ]);
    const outputIndexPath = path.join(outputRoot, "manifest.json");
    await writeOrCheck(outputIndexPath, indexText, Boolean(options.check), "ignored course controller fixture index");
  }
  return {fixtures, index, indexPath, markdownPath, fullCanonicalSet};
}

function helpText() {
  return `Usage:
  node scripts/build-adobe-course-frame-controller-fixtures.mjs
  node scripts/build-adobe-course-frame-controller-fixtures.mjs --id <course-pilot> [--frame <1..N>]
  node scripts/build-adobe-course-frame-controller-fixtures.mjs --check
  node scripts/build-adobe-course-frame-controller-fixtures.mjs --verify <fixture-manifest.json>
  node scripts/build-adobe-course-frame-controller-fixtures.mjs --verify-launch <fixture-manifest.json>

Options:
  --id <pilot>      Build one of the nine course-child pilots (repeatable without --frame)
  --frame <n>       Build one exact one-indexed local frame; requires exactly one --id
  --no-compile      Generate source/spec/sandbox only; launch and tracked canonical report remain unavailable
  --migrations      Override migrations root
  --output          Override ignored fixture root
  --reports         Override tracked aggregate report root
  --check           Verify all nine derived specs, canonical reports/manifests, hashes, compiled markers, sandbox evidence, and aggregate reports without writing
  --verify          Verify one generated fixture and every current input/generated hash
  --verify-launch   Verify a fixture plus its separate no-click GUI sandbox smoke approval

The original shell is excluded. This factory performs no GUI action and changes no migration status, review, strict-baseline, human-review, or owner-acceptance field.
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  if (options.verifyManifest) {
    const result = await verifyFixtureManifest(options.verifyManifest, {migrationsRoot: options.migrationsRoot});
    process.stdout.write(stableJson({status: "verified", animationId: result.manifest.animationId, targetFrame: result.manifest.targetFrame, manifest: portable(path.relative(projectRoot, result.manifestPath)), strictAcceptanceEffect: "none"}));
    return;
  }
  if (options.verifyLaunch) {
    const result = await verifyLaunchAuthorization(options.verifyLaunch, {migrationsRoot: options.migrationsRoot});
    process.stdout.write(stableJson({status: "launch-authorized-after-safety-smoke", animationId: result.manifest.animationId, targetFrame: result.manifest.targetFrame, reviewer: result.approval.reviewer, strictAcceptanceEffect: "none"}));
    return;
  }
  const result = await buildAdobeCourseFrameControllerFixtures(options);
  process.stdout.write(stableJson({
    status: options.check ? "canonical-nine-course-controller-factory-checked" : "course-controller-fixtures-built",
    fixtureCount: result.fixtures.length,
    fixtures: result.fixtures.map((item) => ({animationId: item.manifest.animationId, targetFrame: item.manifest.targetFrame, manifest: portable(path.relative(projectRoot, item.manifestPath)), compilation: item.manifest.compilation.status})),
    index: result.indexPath ? portable(path.relative(projectRoot, result.indexPath)) : null,
    report: result.markdownPath ? portable(path.relative(projectRoot, result.markdownPath)) : null,
    strictAcceptanceEffect: "none",
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
