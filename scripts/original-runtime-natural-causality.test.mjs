import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, copyFile, link, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {deflateSync} from "node:zlib";
import {PNG} from "pngjs";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
import {
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  NATURAL_TRACE_PROOF_MODE,
  naturalOperationEventSha256,
  naturalStateRecordSha256,
  naturalTargetResolutionSha256,
} from "./prepare-natural-trace-candidate.mjs";
import {
  NATURAL_EVIDENCE_MEDIA_TYPES,
  ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
  assertAcyclicNaturalEvidenceGraph,
  loadCurrentCanonicalNaturalRequirement,
  validateNaturalEvidenceDescriptor,
  verifyOriginalRuntimeNaturalCandidateDag,
  verifyOriginalRuntimeNaturalCausality,
  verifyOriginalRuntimeNaturalPromotionCandidate,
} from "./lib/original-runtime-natural-causality.mjs";

const execFile = promisify(execFileCallback);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function iso(milliseconds) {
  return new Date(Date.UTC(2026, 6, 23, 0, 0, 0, milliseconds)).toISOString();
}

function descriptor(descriptorType, baseRoot, relative, bytes, mediaType) {
  return {
    descriptorType,
    baseRoot,
    [descriptorType]: relative,
    sha256: digest(bytes),
    mediaType,
  };
}

async function writeBytes(root, relative, bytes) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes);
  return target;
}

async function createDagFixture() {
  const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-causality-dag-")));
  const seedRoot = path.join(temporary, "seed");
  const archiveRoot = path.join(temporary, "archive");
  await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
  const leafBytes = Buffer.from("immutable runtime identity\n");
  const leafDescriptor = descriptor("path", "archive", "identity/runtime.txt", leafBytes, NATURAL_EVIDENCE_MEDIA_TYPES.text);
  const jsonlBytes = Buffer.from(`${JSON.stringify({sequence: 1, runtimeIdentity: leafDescriptor})}\n`);
  const jsonlDescriptor = descriptor("file", "archive", "logs/records.jsonl", jsonlBytes, NATURAL_EVIDENCE_MEDIA_TYPES.jsonl);
  const reportBytes = Buffer.from(`${JSON.stringify({schemaVersion: 1, records: jsonlDescriptor}, null, 2)}\n`);
  const reportDescriptor = descriptor("file", "archive", "report.json", reportBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
  const seedBytes = Buffer.from(`${JSON.stringify({schemaVersion: 1, report: reportDescriptor}, null, 2)}\n`);
  const seedDescriptor = descriptor("file", "seed", "candidate.json", seedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
  await Promise.all([
    writeBytes(seedRoot, "candidate.json", seedBytes),
    writeBytes(archiveRoot, "report.json", reportBytes),
    writeBytes(archiveRoot, "logs/records.jsonl", jsonlBytes),
    writeBytes(archiveRoot, "identity/runtime.txt", leafBytes),
  ]);
  return {
    temporary,
    seedRoot,
    archiveRoot,
    baseRoots: {
      seed: {path: seedRoot, role: "seed"},
      archive: {path: archiveRoot, role: "archive"},
    },
    seedDescriptor,
    reportDescriptor,
    jsonlDescriptor,
    leafDescriptor,
  };
}

const identity = Object.freeze({
  animationId: "course-g05-l13-rw-002",
  requirementId: "req-sprite-334-default-en",
  proofMode: "natural-trace-ordered-events",
  sessionId: "session-natural-causality-1",
  traceSpecSha256: "1".repeat(64),
  sourceSwfSha256: "2".repeat(64),
});

function state(sequence, monotonicTimeMs, observedLocalFrame, observedState, previousRecordSha256, recordIdentity = identity, screenshot = null) {
  const boundObservedState = {language: "en", seed: "0", ...observedState};
  const record = {
    schemaVersion: 1,
    evidenceType: "attested-natural-trace-state-snapshot",
    ...recordIdentity,
    sequence,
    occurredAt: iso(monotonicTimeMs),
    monotonicTimeMs,
    frameDomainId: "sprite-334",
    observedRootFrame: 1,
    observedLocalFrame,
    observedState: boundObservedState,
    observedStateSha256: sha256Text(canonicalJson(boundObservedState)),
    screenshotFile: screenshot?.file ?? `frames/frame-${String(sequence).padStart(4, "0")}.png`,
    screenshotSha256: screenshot?.sha256 ?? String(sequence).repeat(64).slice(0, 64),
    previousRecordSha256,
    recordSha256: null,
  };
  record.recordSha256 = naturalStateRecordSha256(record);
  return record;
}

function target(sequence, monotonicTimeMs, step, previousRecordSha256, recordIdentity = identity) {
  const record = {
    schemaVersion: 1,
    evidenceType: "attested-natural-source-target-resolution",
    ...recordIdentity,
    sequence,
    occurredAt: iso(monotonicTimeMs),
    monotonicTimeMs,
    scheduleStepOrder: step.order,
    action: step.action,
    expectedSourceTarget: step.sourceTarget,
    resolvedSourceTarget: step.sourceTarget,
    resolution: "resolved-exactly-to-bound-source-target",
    previousRecordSha256,
    recordSha256: null,
  };
  record.recordSha256 = naturalTargetResolutionSha256(record);
  return record;
}

function operation(sequence, monotonicTimeMs, fields, previousEventSha256, recordIdentity = identity) {
  const record = {
    schemaVersion: 1,
    evidenceType: "attested-natural-trace-operation",
    ...recordIdentity,
    sequence,
    occurredAt: iso(monotonicTimeMs),
    monotonicTimeMs,
    previousEventSha256,
    ...fields,
    eventSha256: null,
  };
  record.eventSha256 = naturalOperationEventSha256(record);
  return record;
}

function rechainOperations(operations) {
  let previous = null;
  return operations.map((input, index) => {
    const event = structuredClone(input);
    event.sequence = index + 1;
    event.previousEventSha256 = previous;
    event.eventSha256 = naturalOperationEventSha256(event);
    previous = event.eventSha256;
    return event;
  });
}

function createCausalityFixture(recordIdentity = identity, screenshots = null) {
  const checkpoints = [
    {id: "before", expectedState: {localFrame: 2, replayEpoch: 1, phase: "ready"}},
    {id: "after", expectedState: {localFrame: 3, replayEpoch: 1, phase: "answered"}},
    {id: "terminal", expectedState: {localFrame: 4, replayEpoch: 1, phase: "complete"}},
  ];
  const step = {
    order: 1,
    action: {kind: "press", command: "gotoAndPlay"},
    sourceTarget: {symbolId: 334, buttonObjectId: 12},
    preStateCheckpoint: {checkpointId: "before", expectedState: checkpoints[0].expectedState},
    postStateCheckpoint: {checkpointId: "after", expectedState: checkpoints[1].expectedState},
  };
  const schedule = {
    status: "source-evidenced-executable",
    orderedSteps: [step],
    stateCheckpoints: checkpoints,
    terminalSemantics: {status: "source-evidenced", expectedState: checkpoints[2].expectedState},
  };
  const states = [];
  states.push(state(1, 11, 1, {localFrame: 1, replayEpoch: 1, phase: "entered"}, null, recordIdentity, screenshots?.[0]));
  states.push(state(2, 21, 2, checkpoints[0].expectedState, states[0].recordSha256, recordIdentity, screenshots?.[1]));
  states.push(state(3, 31, 3, checkpoints[1].expectedState, states[1].recordSha256, recordIdentity, screenshots?.[2]));
  states.push(state(4, 41, 4, checkpoints[2].expectedState, states[2].recordSha256, recordIdentity, screenshots?.[3]));
  const targets = [target(1, 22, step, null, recordIdentity)];
  const events = [];
  events.push(operation(1, 10, {
    eventKind: "frame-observation", frameDomainId: "sprite-334", observedRootFrame: 1, observedLocalFrame: 1,
    stateSnapshotRecordSha256: states[0].recordSha256, screenshotFile: states[0].screenshotFile, screenshotSha256: states[0].screenshotSha256,
  }, null, recordIdentity));
  events.push(operation(2, 20, {
    eventKind: "frame-observation", frameDomainId: "sprite-334", observedRootFrame: 1, observedLocalFrame: 2,
    stateSnapshotRecordSha256: states[1].recordSha256, screenshotFile: states[1].screenshotFile, screenshotSha256: states[1].screenshotSha256,
  }, events[0].eventSha256, recordIdentity));
  events.push(operation(3, 23, {
    eventKind: "source-action-dispatch", scheduleStepOrder: 1, action: step.action, sourceTarget: step.sourceTarget,
    preCheckpointId: "before", postCheckpointId: "after",
    preStateSnapshotRecordSha256: states[1].recordSha256,
    postStateSnapshotRecordSha256: states[2].recordSha256,
    sourceTargetResolutionRecordSha256: targets[0].recordSha256,
  }, events[1].eventSha256, recordIdentity));
  events.push(operation(4, 30, {
    eventKind: "frame-observation", frameDomainId: "sprite-334", observedRootFrame: 1, observedLocalFrame: 3,
    stateSnapshotRecordSha256: states[2].recordSha256, screenshotFile: states[2].screenshotFile, screenshotSha256: states[2].screenshotSha256,
  }, events[2].eventSha256, recordIdentity));
  events.push(operation(5, 40, {
    eventKind: "frame-observation", frameDomainId: "sprite-334", observedRootFrame: 1, observedLocalFrame: 4,
    stateSnapshotRecordSha256: states[3].recordSha256, screenshotFile: states[3].screenshotFile, screenshotSha256: states[3].screenshotSha256,
  }, events[3].eventSha256, recordIdentity));
  return {
    schedule,
    operations: events,
    states,
    targets,
    terminalResult: {
      stateSnapshotRecordSha256: states[3].recordSha256,
      observedState: states[3].observedState,
      observedStateSha256: states[3].observedStateSha256,
    },
  };
}

function causalityOptions(fixture) {
  return {
    schedule: fixture.schedule,
    operationRecords: fixture.operations,
    stateRecords: fixture.states,
    sourceTargetRecords: fixture.targets,
    terminalResult: fixture.terminalResult,
  };
}

function pngBytes(red) {
  const png = new PNG({width: 1, height: 1});
  png.data[0] = red;
  png.data[1] = 20;
  png.data[2] = 30;
  png.data[3] = 255;
  return PNG.sync.write(png);
}

function minimalFwsBytes() {
  const body = Buffer.from([0x08, 0x00, 0x00, 0x0c, 0x01, 0x00]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = 9;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

function minimalCwsBytes({trailing = Buffer.alloc(0)} = {}) {
  const fws = minimalFwsBytes();
  const header = Buffer.from(fws.subarray(0, 8));
  header.write("CWS", 0, "ascii");
  return Buffer.concat([header, deflateSync(fws.subarray(8)), trailing]);
}

function replaceExactlyOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  assert.notEqual(first, -1, `${label} instrumentation marker is missing`);
  assert.equal(source.indexOf(needle, first + needle.length), -1, `${label} instrumentation marker is ambiguous`);
  return source.replace(needle, replacement);
}

async function writeJsonFile(root, relative, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeBytes(root, relative, bytes);
  return bytes;
}

async function setTreeImmutable(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const candidate = path.join(root, entry.name);
    if (entry.isDirectory()) await setTreeImmutable(candidate);
    else await chmod(candidate, 0o444);
  }
  await chmod(root, 0o555);
}

async function setTreeWritable(root) {
  await chmod(root, 0o755).catch(() => {});
  const entries = await readdir(root, {withFileTypes: true}).catch(() => []);
  for (const entry of entries) {
    const candidate = path.join(root, entry.name);
    if (entry.isDirectory()) await setTreeWritable(candidate);
    else await chmod(candidate, 0o644).catch(() => {});
  }
}

async function createIsolatedPromotionRepository() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-promotion-isolated-")));
  const animationId = "course-g05-l13-rw-002";
  const requirementId = "req:sprite-334:default:en";
  const safeId = safeRequirementId(requirementId);
  const workspaceRelative = `migrations/${animationId}`;
  const traceSpecRelative = `${workspaceRelative}/audit/trace-specs/${safeId}.json`;
  const candidateBaseRelative = `${workspaceRelative}/evidence/pending-natural-trace-capture/${safeId}`;
  const candidateManifestRelative = `${candidateBaseRelative}/candidate-manifest.json`;
  const archiveBaseRelative = `artifacts/full-frame/pilot-baselines/${animationId}/${safeId}/pending-human-owner-natural-trace`;
  const sourceRelative = "HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf";
  const canonicalSourceRelative = `source-assets/flash/HELP MATH_ORIGINAL FILES/${sourceRelative}`;

  const copiedScripts = [
    "build-course-trace-specs.mjs",
    "evidence-projections.mjs",
    "lib/root-trace-spec-contract.mjs",
    "lib/strict-full-domain-requirement.mjs",
    "lib/trace-frame-selection.mjs",
    "prepare-natural-trace-candidate.mjs",
    "prepare-root-capture-candidate.mjs",
  ];
  await Promise.all([
    mkdir(path.join(root, "scripts/lib"), {recursive: true}),
    mkdir(path.join(root, "node_modules"), {recursive: true}),
  ]);
  await Promise.all(copiedScripts.map((basename) => copyFile(
    path.join(repositoryRoot, "scripts", basename),
    path.join(root, "scripts", basename),
  )));
  const pngjsTarget = await realpath(path.join(repositoryRoot, "node_modules/pngjs"));
  await symlink(pngjsTarget, path.join(root, "node_modules/pngjs"), "dir");

  let moduleSource = await readFile(path.join(repositoryRoot, "scripts/lib/original-runtime-natural-causality.mjs"), "utf8");
  moduleSource = replaceExactlyOnce(
    moduleSource,
    'import {PNG} from "pngjs";',
    'import {PNG} from "pngjs";\nimport {runIsolatedTestHook} from "../../isolated-test-hook.mjs";',
    "isolated hook import",
  );
  moduleSource = replaceExactlyOnce(
    moduleSource,
    '  assertSameCanonicalSnapshot(brandedCanonical, canonical, "before candidate verification");',
    '  assertSameCanonicalSnapshot(brandedCanonical, canonical, "before candidate verification");\n  await runIsolatedTestHook("after-before-snapshot");',
    "during-verification hook",
  );
  moduleSource = replaceExactlyOnce(
    moduleSource,
    "  const canonicalAfter = await loadCurrentCanonicalNaturalRequirementSnapshot({",
    '  await runIsolatedTestHook("before-final-reload");\n  const canonicalAfter = await loadCurrentCanonicalNaturalRequirementSnapshot({',
    "pre-final-reload hook",
  );
  moduleSource = replaceExactlyOnce(
    moduleSource,
    '  assertSameCanonicalSnapshot(canonical, canonicalAfter, "during candidate verification");',
    '  assertSameCanonicalSnapshot(canonical, canonicalAfter, "during candidate verification");\n  await runIsolatedTestHook("after-final-reload");',
    "post-final-reload hook",
  );
  await writeFile(path.join(root, "scripts/lib/original-runtime-natural-causality.mjs"), moduleSource);

  const sourceBytes = minimalFwsBytes();
  const sourceSwfSha256 = digest(sourceBytes);
  const schedule = createCausalityFixture().schedule;
  const traceSpec = {
    schemaVersion: 1,
    animationId,
    requirementId,
    identity: {
      frameDomainId: "sprite-334",
      traceId: "trace:sprite-334:default:en:seed-0",
      entryStateSha256: "3".repeat(64),
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 4},
      baselineAuthorityRequirement: "original-runtime-natural-trace",
    },
    traceModel: {kind: "stateful-natural-trace", domainScope: "nested", naturalPlaybackClaimed: true},
    frameDomain: {id: "sprite-334", kind: "nested", parentEntryFrame: 1, frameCount: 4, nativeStage: {width: 1, height: 1}},
    schedule,
  };
  const traceSpecBytes = Buffer.from(`${JSON.stringify(traceSpec, null, 2)}\n`);
  const traceSpecSha256 = digest(traceSpecBytes);
  const manifest = {
    schemaVersion: 1,
    id: animationId,
    animationId,
    source: {
      swf: canonicalSourceRelative,
      placementPath: canonicalSourceRelative,
      swfSha256: sourceSwfSha256,
    },
    catalogEvidence: {catalogSourcePath: sourceRelative},
  };
  const coverage = {schemaVersion: 2, animationId, requirements: [{requirementId}]};
  const scenario = {schemaVersion: 1, animationId, scenarios: []};
  const ledgerBytes = Buffer.from(`${sourceSwfSha256}  ${sourceRelative}\n`);
  const freeze = {
    schemaVersion: 1,
    canonicalRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    manifest: "catalog/source-manifest.sha256",
    manifestSha256: digest(ledgerBytes),
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  };
  const index = {
    schemaVersion: 1,
    pilots: [{
      animationId,
      sourceSwfSha256,
      technicalBindings: {
        manifest: {sha256: technicalManifestSha256(manifest)},
        coverage: {sha256: traceCoverageSha256(coverage)},
        scenarioInventory: {sha256: scenarioInventorySha256(scenario)},
      },
      traceSpecs: [{
        requirementId,
        file: traceSpecRelative,
        sha256: traceSpecSha256,
        traceModel: "stateful-natural-trace",
        status: "source-schedule-ready-for-authoritative-execution",
      }],
    }],
  };
  await Promise.all([
    writeJsonFile(root, "migrations/course-shell-pilot-trace-spec-index.json", index),
    writeJsonFile(root, "catalog/source-freeze.json", freeze),
    writeBytes(root, "catalog/source-manifest.sha256", ledgerBytes),
    writeJsonFile(root, `${workspaceRelative}/migration.json`, manifest),
    writeJsonFile(root, `${workspaceRelative}/evidence/full-frame-coverage.json`, coverage),
    writeJsonFile(root, `${workspaceRelative}/audit/scenario-inventory.json`, scenario),
    writeBytes(root, traceSpecRelative, traceSpecBytes),
    writeBytes(root, canonicalSourceRelative, sourceBytes),
  ]);

  const archiveRoot = path.join(root, archiveBaseRelative);
  const frameBytes = [pngBytes(10), pngBytes(40), pngBytes(70), pngBytes(100)];
  const frameDescriptors = frameBytes.map((bytes, indexValue) => descriptor(
    "file",
    "archive",
    `frames/frame-${String(indexValue + 1).padStart(4, "0")}.png`,
    bytes,
    NATURAL_EVIDENCE_MEDIA_TYPES.png,
  ));
  const recordIdentity = {
    animationId,
    requirementId,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    sessionId: "isolated-natural-session-1",
    traceSpecSha256,
    sourceSwfSha256,
  };
  const screenshots = frameDescriptors.map((item) => ({file: item.file, sha256: item.sha256}));
  const causality = createCausalityFixture(recordIdentity, screenshots);
  assert.equal(canonicalJson(causality.schedule), canonicalJson(schedule));
  const operationBytes = Buffer.from(`${causality.operations.map((record) => JSON.stringify(record)).join("\n")}\n`);
  const stateBytes = Buffer.from(`${causality.states.map((record) => JSON.stringify(record)).join("\n")}\n`);
  const targetBytes = Buffer.from(`${causality.targets.map((record) => JSON.stringify(record)).join("\n")}\n`);
  const archivedDescriptors = {
    traceSpec: descriptor("file", "archive", "trace-spec.json", traceSpecBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json),
    sourceSwf: descriptor("file", "archive", "source.swf", sourceBytes, NATURAL_EVIDENCE_MEDIA_TYPES.swf),
    operationLog: descriptor("file", "archive", "operations.jsonl", operationBytes, NATURAL_EVIDENCE_MEDIA_TYPES.jsonl),
    stateSnapshots: descriptor("file", "archive", "states.jsonl", stateBytes, NATURAL_EVIDENCE_MEDIA_TYPES.jsonl),
    sourceTargetResolutions: descriptor("file", "archive", "targets.jsonl", targetBytes, NATURAL_EVIDENCE_MEDIA_TYPES.jsonl),
  };
  const frameSet = {
    schemaVersion: 1,
    evidenceType: "attested-natural-trace-frame-set",
    ...recordIdentity,
    frameDomainId: traceSpec.identity.frameDomainId,
    traceId: traceSpec.identity.traceId,
    entryStateSha256: traceSpec.identity.entryStateSha256,
    language: traceSpec.identity.language,
    seed: traceSpec.identity.seed,
    frameCount: causality.states.length,
    frames: causality.states.map((stateRecord, indexValue) => ({
      frame: indexValue + 1,
      stateSnapshotRecordSha256: stateRecord.recordSha256,
      screenshot: frameDescriptors[indexValue],
    })),
  };
  const frameSetBytes = Buffer.from(`${JSON.stringify(frameSet, null, 2)}\n`);
  archivedDescriptors.frameSet = descriptor("file", "archive", "frame-set.json", frameSetBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
  const terminalEvidence = {
    schemaVersion: 1,
    evidenceType: "attested-natural-trace-terminal-result",
    ...recordIdentity,
    scheduleSha256: sha256Text(canonicalJson(schedule)),
    terminalSemanticsSha256: sha256Text(canonicalJson(schedule.terminalSemantics)),
    ...causality.terminalResult,
  };
  const terminalBytes = Buffer.from(`${JSON.stringify(terminalEvidence, null, 2)}\n`);
  archivedDescriptors.terminalEvidence = descriptor("file", "archive", "terminal-evidence.json", terminalBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
  const candidateRoot = {
    schemaVersion: 1,
    evidenceType: "typed-natural-promotion-candidate-root",
    animationId,
    requirementId,
    traceSpec: archivedDescriptors.traceSpec,
    sourceSwf: archivedDescriptors.sourceSwf,
    frameSet: archivedDescriptors.frameSet,
    operationLog: archivedDescriptors.operationLog,
    stateSnapshots: archivedDescriptors.stateSnapshots,
    sourceTargetResolutions: archivedDescriptors.sourceTargetResolutions,
    terminalEvidence: archivedDescriptors.terminalEvidence,
  };
  await Promise.all([
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.traceSpec.file}`, traceSpecBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.sourceSwf.file}`, sourceBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.frameSet.file}`, frameSetBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.operationLog.file}`, operationBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.stateSnapshots.file}`, stateBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.sourceTargetResolutions.file}`, targetBytes),
    writeBytes(root, `${archiveBaseRelative}/${archivedDescriptors.terminalEvidence.file}`, terminalBytes),
    ...frameDescriptors.map((item, indexValue) => writeBytes(root, `${archiveBaseRelative}/${item.file}`, frameBytes[indexValue])),
    writeJsonFile(root, candidateManifestRelative, candidateRoot),
  ]);

  const hookSource = `
import {readFile, realpath, rename, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let fired = false;
function inside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
}
export async function runIsolatedTestHook(phase) {
  if (fired || process.env.NATURAL_ISOLATED_HOOK_PHASE !== phase) return;
  fired = true;
  const root = await realpath(process.env.NATURAL_ISOLATED_REPOSITORY_ROOT || "");
  const temporaryRoot = await realpath(os.tmpdir());
  const realWorkspace = await realpath(process.env.NATURAL_REAL_WORKSPACE_ROOT || "");
  const externalWorkspaceTmp = path.join(realWorkspace, "work", "tmp");
  const isDedicatedExternalFixture = path.dirname(root) === externalWorkspaceTmp
    && path.basename(root).startsWith("natural-promotion-isolated-");
  const overlapsRealWorkspace = inside(root, realWorkspace) || inside(realWorkspace, root);
  if (!inside(root, temporaryRoot) || root === temporaryRoot || (overlapsRealWorkspace && !isDedicatedExternalFixture)) {
    throw new Error("isolated mutation hook refuses a non-temporary or workspace repository");
  }
  const target = path.join(root, ${JSON.stringify(traceSpecRelative)});
  const original = await readFile(target);
  if (process.env.NATURAL_ISOLATED_HOOK_MODE === "persistent") {
    await writeFile(target, Buffer.concat([original, Buffer.from(" \\n")]));
    return;
  }
  if (process.env.NATURAL_ISOLATED_HOOK_MODE === "replace-restore") {
    const holding = target + ".holding";
    await rename(target, holding);
    await writeFile(target, '{"tampered":true}\\n');
    await rm(target);
    await rename(holding, target);
    return;
  }
  throw new Error("isolated mutation hook mode is unsupported");
}
`;
  await writeFile(path.join(root, "isolated-test-hook.mjs"), hookSource);
  const runnerSource = `
import {
  loadCurrentCanonicalNaturalRequirement,
  verifyOriginalRuntimeNaturalPromotionCandidate,
} from "./scripts/lib/original-runtime-natural-causality.mjs";
import {runIsolatedTestHook} from "./isolated-test-hook.mjs";

const canonicalRequirement = await loadCurrentCanonicalNaturalRequirement({
  animationId: ${JSON.stringify(animationId)},
  requirementId: ${JSON.stringify(requirementId)},
});
await runIsolatedTestHook("after-context-minted");
let first;
try {
  const result = await verifyOriginalRuntimeNaturalPromotionCandidate({
    canonicalRequirement,
    candidateManifest: ${JSON.stringify(candidateManifestRelative)},
  });
  first = {ok: true, result};
} catch (error) {
  first = {ok: false, error: error.message};
}
let reuse;
try {
  await verifyOriginalRuntimeNaturalPromotionCandidate({
    canonicalRequirement,
    candidateManifest: ${JSON.stringify(candidateManifestRelative)},
  });
  reuse = {ok: true};
} catch (error) {
  reuse = {ok: false, error: error.message};
}
process.stdout.write(JSON.stringify({first, reuse}) + "\\n");
`;
  const runner = path.join(root, "run-isolated-promotion.mjs");
  await writeFile(runner, runnerSource);
  await Promise.all([
    setTreeImmutable(path.join(root, candidateBaseRelative)),
    setTreeImmutable(archiveRoot),
  ]);
  return {
    root,
    runner,
    animationId,
    requirementId,
    candidateBase: path.join(root, candidateBaseRelative),
    archiveRoot,
    async run({phase = "", mode = ""} = {}) {
      const {stdout} = await execFile(process.execPath, [runner], {
        cwd: root,
        env: {
          ...process.env,
          NATURAL_ISOLATED_REPOSITORY_ROOT: root,
          NATURAL_REAL_WORKSPACE_ROOT: repositoryRoot,
          NATURAL_ISOLATED_HOOK_PHASE: phase,
          NATURAL_ISOLATED_HOOK_MODE: mode,
        },
        maxBuffer: 10 * 1024 * 1024,
      });
      return JSON.parse(stdout.trim());
    },
    async cleanup() {
      await Promise.all([setTreeWritable(path.join(root, candidateBaseRelative)), setTreeWritable(archiveRoot)]);
      await rm(root, {recursive: true, force: true});
    },
  };
}

test("promotion remains disabled and typed descriptors reject ambiguous file/path/base contracts", () => {
  assert.equal(ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED, false);
  const valid = {
    descriptorType: "file", baseRoot: "archive", file: "logs/events.jsonl",
    sha256: "a".repeat(64), mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.jsonl,
  };
  assert.deepEqual(validateNaturalEvidenceDescriptor(valid), valid);
  assert.throws(
    () => validateNaturalEvidenceDescriptor({...valid, path: valid.file}),
    /fields must be exactly|cannot mix/,
  );
  assert.throws(
    () => validateNaturalEvidenceDescriptor({...valid, file: "../escape.jsonl"}),
    /cannot escape/,
  );
  assert.throws(
    () => validateNaturalEvidenceDescriptor({file: valid.file, sha256: valid.sha256}),
    /descriptorType must be file or path/,
  );
});

test("recursively rehashes the complete typed JSON/JSONL candidate DAG", async () => {
  const fixture = await createDagFixture();
  try {
    const result = await verifyOriginalRuntimeNaturalCandidateDag({
      baseRoots: fixture.baseRoots,
      seeds: [fixture.seedDescriptor],
    });
    assert.equal(result.promotionEnabled, false);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.inventory.length, 4);
    assert.equal(result.edgeInventory.length, 3);
    assert.match(result.dagSha256, /^[a-f0-9]{64}$/);
    assert.ok(result.inventory.some((item) => item.descriptorType === "path" && item.relativePath === "identity/runtime.txt"));
  } finally {
    await rm(fixture.temporary, {recursive: true, force: true});
  }
});

test("DAG verification fails closed on hashes, untyped JSONL dependencies, unarchived dependencies, and extra archive files", async (t) => {
  await t.test("hash mismatch", async () => {
    const fixture = await createDagFixture();
    try {
      await writeFile(path.join(fixture.archiveRoot, "identity/runtime.txt"), "changed\n");
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [fixture.seedDescriptor]}),
        /SHA-256 mismatch/,
      );
    } finally {
      await rm(fixture.temporary, {recursive: true, force: true});
    }
  });
  await t.test("untyped descriptor hidden in JSONL", async () => {
    const fixture = await createDagFixture();
    try {
      const untyped = Buffer.from(`${JSON.stringify({file: "identity/runtime.txt", sha256: fixture.leafDescriptor.sha256})}\n`);
      await writeFile(path.join(fixture.archiveRoot, "logs/records.jsonl"), untyped);
      const changedJsonl = {...fixture.jsonlDescriptor, sha256: digest(untyped)};
      const reportBytes = Buffer.from(`${JSON.stringify({schemaVersion: 1, records: changedJsonl}, null, 2)}\n`);
      await writeFile(path.join(fixture.archiveRoot, "report.json"), reportBytes);
      const report = {...fixture.reportDescriptor, sha256: digest(reportBytes)};
      const seedBytes = Buffer.from(`${JSON.stringify({schemaVersion: 1, report}, null, 2)}\n`);
      await writeFile(path.join(fixture.seedRoot, "candidate.json"), seedBytes);
      const seed = {...fixture.seedDescriptor, sha256: digest(seedBytes)};
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [seed]}),
        /untyped file\/path descriptor/,
      );
    } finally {
      await rm(fixture.temporary, {recursive: true, force: true});
    }
  });
  await t.test("unarchived recursive dependency", async () => {
    const fixture = await createDagFixture();
    try {
      const externalBytes = Buffer.from("seed dependency\n");
      await writeBytes(fixture.seedRoot, "external.txt", externalBytes);
      const external = descriptor("path", "seed", "external.txt", externalBytes, NATURAL_EVIDENCE_MEDIA_TYPES.text);
      const jsonlBytes = Buffer.from(`${JSON.stringify({sequence: 1, external})}\n`);
      await writeFile(path.join(fixture.archiveRoot, "logs/records.jsonl"), jsonlBytes);
      const log = {...fixture.jsonlDescriptor, sha256: digest(jsonlBytes)};
      const reportBytes = Buffer.from(`${JSON.stringify({records: log}, null, 2)}\n`);
      await writeFile(path.join(fixture.archiveRoot, "report.json"), reportBytes);
      const report = {...fixture.reportDescriptor, sha256: digest(reportBytes)};
      const seedBytes = Buffer.from(`${JSON.stringify({report}, null, 2)}\n`);
      await writeFile(path.join(fixture.seedRoot, "candidate.json"), seedBytes);
      const seed = {...fixture.seedDescriptor, sha256: digest(seedBytes)};
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [seed]}),
        /unarchived dependency/,
      );
    } finally {
      await rm(fixture.temporary, {recursive: true, force: true});
    }
  });
  await t.test("unreferenced archive file", async () => {
    const fixture = await createDagFixture();
    try {
      await writeBytes(fixture.archiveRoot, "unbound.bin", Buffer.from("not in graph"));
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [fixture.seedDescriptor]}),
        /unreferenced file/,
      );
    } finally {
      await rm(fixture.temporary, {recursive: true, force: true});
    }
  });
});

test("DAG verification rejects symlinks and the graph checker rejects cycles", async () => {
  const fixture = await createDagFixture();
  try {
    await rm(path.join(fixture.archiveRoot, "identity/runtime.txt"));
    await symlink(path.join(fixture.temporary, "outside.txt"), path.join(fixture.archiveRoot, "identity/runtime.txt"));
    await writeFile(path.join(fixture.temporary, "outside.txt"), "immutable runtime identity\n");
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [fixture.seedDescriptor]}),
      /symbolic link/,
    );
  } finally {
    await rm(fixture.temporary, {recursive: true, force: true});
  }
  const edges = new Map([
    ["a", new Set(["b"])],
    ["b", new Set(["c"])],
    ["c", new Set(["a"])],
  ]);
  assert.throws(() => assertAcyclicNaturalEvidenceGraph(edges), /contains a cycle: a -> b -> c -> a/);
});

test("DAG verification rejects external hardlinks and full-file disguised JSON media", async (t) => {
  await t.test("external hardlink", async () => {
    const fixture = await createDagFixture();
    try {
      const leaf = path.join(fixture.archiveRoot, "identity/runtime.txt");
      const outside = path.join(fixture.temporary, "outside-hardlink.txt");
      const bytes = await readFile(leaf);
      await rm(leaf);
      await writeFile(outside, bytes);
      await link(outside, leaf);
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({baseRoots: fixture.baseRoots, seeds: [fixture.seedDescriptor]}),
        /exactly one hard link/,
      );
    } finally {
      await rm(fixture.temporary, {recursive: true, force: true});
    }
  });
  await t.test("4096-space JSON media disguise", async () => {
    const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-media-disguise-")));
    const seedRoot = path.join(temporary, "seed");
    const archiveRoot = path.join(temporary, "archive");
    await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
    try {
      const disguisedBytes = Buffer.from(`${" ".repeat(4096)}${JSON.stringify({hidden: "descriptor-like structured evidence"})}`);
      const disguised = descriptor("file", "archive", "hidden.txt", disguisedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.text);
      const seedBytes = Buffer.from(`${JSON.stringify({disguised}, null, 2)}\n`);
      const seed = descriptor("file", "seed", "candidate.json", seedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
      await Promise.all([
        writeBytes(seedRoot, seed.file, seedBytes),
        writeBytes(archiveRoot, disguised.file, disguisedBytes),
      ]);
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({
          baseRoots: {seed: {path: seedRoot, role: "seed"}, archive: {path: archiveRoot, role: "archive"}},
          seeds: [seed],
        }),
        /contains JSON bytes but is declared as text\/plain/,
      );
    } finally {
      await rm(temporary, {recursive: true, force: true});
    }
  });
});

test("DAG verification rejects unterminated two-record JSONL and CWS trailing bytes", async (t) => {
  await t.test("two JSON lines without final newline", async () => {
    const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-jsonl-terminal-")));
    const seedRoot = path.join(temporary, "seed");
    const archiveRoot = path.join(temporary, "archive");
    await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
    try {
      const logBytes = Buffer.from(`${JSON.stringify({sequence: 1})}\n${JSON.stringify({sequence: 2})}`);
      const log = descriptor("file", "archive", "records.jsonl", logBytes, NATURAL_EVIDENCE_MEDIA_TYPES.jsonl);
      const seedBytes = Buffer.from(`${JSON.stringify({log}, null, 2)}\n`);
      const seed = descriptor("file", "seed", "candidate.json", seedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
      await Promise.all([writeBytes(seedRoot, seed.file, seedBytes), writeBytes(archiveRoot, log.file, logBytes)]);
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({
          baseRoots: {seed: {path: seedRoot, role: "seed"}, archive: {path: archiveRoot, role: "archive"}},
          seeds: [seed],
        }),
        /must end with a newline/,
      );
    } finally {
      await rm(temporary, {recursive: true, force: true});
    }
  });
  await t.test("valid CWS followed by JSON", async () => {
    const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-cws-trailing-")));
    const seedRoot = path.join(temporary, "seed");
    const archiveRoot = path.join(temporary, "archive");
    await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
    try {
      const swfBytes = minimalCwsBytes({trailing: Buffer.from('{"hidden":true}')});
      const swf = descriptor("file", "archive", "source.swf", swfBytes, NATURAL_EVIDENCE_MEDIA_TYPES.swf);
      const seedBytes = Buffer.from(`${JSON.stringify({swf}, null, 2)}\n`);
      const seed = descriptor("file", "seed", "candidate.json", seedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
      await Promise.all([writeBytes(seedRoot, seed.file, seedBytes), writeBytes(archiveRoot, swf.file, swfBytes)]);
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({
          baseRoots: {seed: {path: seedRoot, role: "seed"}, archive: {path: archiveRoot, role: "archive"}},
          seeds: [seed],
        }),
        /trailing or unconsumed bytes/,
      );
    } finally {
      await rm(temporary, {recursive: true, force: true});
    }
  });
});

test("low-level DAG closure rejects missing trace-spec, SWF, and PNG nodes", async (t) => {
  for (const [name, relative, bytes, mediaType] of [
    ["trace spec", "trace-spec.json", Buffer.from("{}\n"), NATURAL_EVIDENCE_MEDIA_TYPES.json],
    ["source SWF", "source.swf", minimalFwsBytes(), NATURAL_EVIDENCE_MEDIA_TYPES.swf],
    ["PNG frame", "frames/frame-0001.png", pngBytes(10), NATURAL_EVIDENCE_MEDIA_TYPES.png],
  ]) await t.test(name, async () => {
    const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "natural-missing-node-")));
    const seedRoot = path.join(temporary, "seed");
    const archiveRoot = path.join(temporary, "archive");
    await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
    try {
      const missing = descriptor("file", "archive", relative, bytes, mediaType);
      const seedBytes = Buffer.from(`${JSON.stringify({missing}, null, 2)}\n`);
      const seed = descriptor("file", "seed", "candidate.json", seedBytes, NATURAL_EVIDENCE_MEDIA_TYPES.json);
      await writeBytes(seedRoot, seed.file, seedBytes);
      await assert.rejects(
        () => verifyOriginalRuntimeNaturalCandidateDag({
          baseRoots: {seed: {path: seedRoot, role: "seed"}, archive: {path: archiveRoot, role: "archive"}},
          seeds: [seed],
        }),
        /unavailable/,
      );
    } finally {
      await rm(temporary, {recursive: true, force: true});
    }
  });
});

test("accepts exact hash/sequence/time-bound natural action occurrences and a later terminal", () => {
  const fixture = createCausalityFixture();
  const result = verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture));
  assert.equal(result.promotionEnabled, false);
  assert.equal(result.actionCount, 1);
  assert.equal(result.verifiedActions[0].preStateSequence, 2);
  assert.equal(result.verifiedActions[0].postStateSequence, 3);
  assert.equal(result.terminal.stateSequence, 4);
  assert.ok(result.terminal.monotonicTimeMs > fixture.operations[2].monotonicTimeMs);
});

test("rejects reuse of an older pre-Replay state even after internally consistent event rehashing", () => {
  const fixture = createCausalityFixture();
  // The stale occurrence deliberately has the same visible/checkpoint semantics;
  // only its record occurrence and position before the later Replay differ.
  const oldState = state(1, 11, 2, {localFrame: 2, replayEpoch: 1, phase: "ready"}, null);
  const currentState = state(2, 21, 2, {localFrame: 2, replayEpoch: 1, phase: "ready"}, oldState.recordSha256);
  const postState = state(3, 31, 3, {localFrame: 3, replayEpoch: 1, phase: "answered"}, currentState.recordSha256);
  const terminalState = state(4, 41, 4, {localFrame: 4, replayEpoch: 1, phase: "complete"}, postState.recordSha256);
  fixture.states = [oldState, currentState, postState, terminalState];
  fixture.operations[0].observedLocalFrame = 2;
  fixture.operations[0].stateSnapshotRecordSha256 = oldState.recordSha256;
  fixture.operations[0].screenshotSha256 = oldState.screenshotSha256;
  fixture.operations[1].observedLocalFrame = 2;
  fixture.operations[1].stateSnapshotRecordSha256 = currentState.recordSha256;
  fixture.operations[1].screenshotSha256 = currentState.screenshotSha256;
  fixture.operations[2].preStateSnapshotRecordSha256 = oldState.recordSha256;
  fixture.operations[2].postStateSnapshotRecordSha256 = postState.recordSha256;
  fixture.operations[3].stateSnapshotRecordSha256 = postState.recordSha256;
  fixture.operations[3].screenshotSha256 = postState.screenshotSha256;
  fixture.operations[4].stateSnapshotRecordSha256 = terminalState.recordSha256;
  fixture.operations[4].screenshotSha256 = terminalState.screenshotSha256;
  fixture.operations = rechainOperations(fixture.operations);
  fixture.terminalResult = {
    stateSnapshotRecordSha256: terminalState.recordSha256,
    observedState: terminalState.observedState,
    observedStateSha256: terminalState.observedStateSha256,
  };
  assert.throws(
    () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
    /unrelated or pre-Replay pre-state occurrence/,
  );
});

test("rejects unrelated post-state reuse and non-causal timestamps after complete rehashing", async (t) => {
  await t.test("unrelated post state", () => {
    const fixture = createCausalityFixture();
    fixture.operations[2].postStateSnapshotRecordSha256 = fixture.states[3].recordSha256;
    fixture.operations = rechainOperations(fixture.operations);
    assert.throws(
      () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
      /post-state occurrence does not satisfy|unrelated post-state occurrence/,
    );
  });
  await t.test("action timestamp outside exact bracket", () => {
    const fixture = createCausalityFixture();
    fixture.operations[2].monotonicTimeMs = 32;
    fixture.operations[2].occurredAt = iso(32);
    fixture.operations = rechainOperations(fixture.operations);
    assert.throws(
      () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
      /strictly monotonic|not strictly ordered/,
    );
  });
});

test("rejects two scheduled actions reusing one pre/post observation bracket", () => {
  const fixture = createCausalityFixture();
  const secondStep = {
    ...structuredClone(fixture.schedule.orderedSteps[0]),
    order: 2,
    action: {kind: "press", command: "gotoAndPlay-again"},
    sourceTarget: {symbolId: 334, buttonObjectId: 13},
  };
  fixture.schedule.orderedSteps.push(secondStep);
  const secondTarget = target(2, 24, secondStep, fixture.targets[0].recordSha256);
  fixture.targets.push(secondTarget);
  const secondAction = operation(4, 25, {
    eventKind: "source-action-dispatch",
    scheduleStepOrder: 2,
    action: secondStep.action,
    sourceTarget: secondStep.sourceTarget,
    preCheckpointId: "before",
    postCheckpointId: "after",
    preStateSnapshotRecordSha256: fixture.states[1].recordSha256,
    postStateSnapshotRecordSha256: fixture.states[2].recordSha256,
    sourceTargetResolutionRecordSha256: secondTarget.recordSha256,
  }, null);
  fixture.operations.splice(3, 0, secondAction);
  fixture.operations = rechainOperations(fixture.operations);
  assert.throws(
    () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
    /reuses a pre\/post occurrence|overlaps or fails strict occurrence progression/,
  );
});

test("rejects a terminal occurrence at/before the last action or an earlier terminal state", async (t) => {
  await t.test("earlier state", () => {
    const fixture = createCausalityFixture();
    fixture.terminalResult = {
      stateSnapshotRecordSha256: fixture.states[2].recordSha256,
      observedState: fixture.states[2].observedState,
      observedStateSha256: fixture.states[2].observedStateSha256,
    };
    assert.throws(
      () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
      /final state occurrence/,
    );
  });
  await t.test("terminal observation before action", () => {
    const fixture = createCausalityFixture();
    const terminalEvent = fixture.operations.pop();
    fixture.operations.splice(2, 0, terminalEvent);
    fixture.operations = rechainOperations(fixture.operations);
    assert.throws(
      () => verifyOriginalRuntimeNaturalCausality(causalityOptions(fixture)),
      /strictly monotonic|state occurrences and operation observations|terminal operation|strictly after/,
    );
  });
});

test("fixed current canonical loader returns a frozen opaque unforgeable context", async () => {
  const context = await loadCurrentCanonicalNaturalRequirement({
    animationId: "course-g05-l13-rw-002",
    requirementId: "req:sprite-334:default:en",
  });
  assert.equal(Object.isFrozen(context), true);
  assert.deepEqual(Object.keys(context), []);
  assert.equal(JSON.stringify(context), "{}");
  await assert.rejects(
    () => loadCurrentCanonicalNaturalRequirement({
      animationId: "course-g05-l13-rw-002",
      requirementId: "req:caller-substituted",
    }),
    /exactly one matching requirement/,
  );
});

test("combined verifier accepts only the private canonical brand and one fixed candidate root", async (t) => {
  const candidateManifest = "migrations/course-g05-l13-rw-002/evidence/pending-natural-trace-capture/req-sprite-334-default-en/candidate-manifest.json";
  const loadCanonicalRequirement = () => loadCurrentCanonicalNaturalRequirement({
    animationId: "course-g05-l13-rw-002",
    requirementId: "req:sprite-334:default:en",
  });
  const canonicalRequirement = await loadCanonicalRequirement();
  await t.test("forged brand", async () => {
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement: Object.freeze({}), candidateManifest}),
      /was not minted by the fixed current canonical loader/,
    );
  });
  await t.test("caller expected-binding substitution", async () => {
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement, candidateManifest, expectedBindings: {traceSpecSha256: "f".repeat(64)}}),
      /fields must be exactly/,
    );
  });
  await t.test("caller multi-seed substitution", async () => {
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement, candidateManifest, seeds: [{}, {}]}),
      /fields must be exactly/,
    );
  });
  await t.test("alternate candidate root", async () => {
    const current = await loadCanonicalRequirement();
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement: current, candidateManifest: [candidateManifest, candidateManifest]}),
      /not the unique fixed root/,
    );
  });
  await t.test("no current immutable candidate fails closed", async () => {
    const current = await loadCanonicalRequirement();
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement: current, candidateManifest}),
      /cannot be opened without following links|ENOENT/,
    );
    await assert.rejects(
      () => verifyOriginalRuntimeNaturalPromotionCandidate({canonicalRequirement: current, candidateManifest}),
      /already consumed/,
    );
  });
});

test("isolated fixed repository exercises the complete combined verification path and canonical TOCTOU guards", async (t) => {
  await t.test("minimal immutable candidate passes the formal public APIs and consumes its context", async () => {
    const fixture = await createIsolatedPromotionRepository();
    try {
      const outcome = await fixture.run();
      assert.equal(outcome.first.ok, true);
      assert.equal(outcome.first.result.status, "read-only-natural-promotion-verification-pass");
      assert.equal(outcome.first.result.authority, "diagnostic-only-not-writer-acceptable");
      assert.equal(outcome.first.result.promotionEnabled, false);
      assert.equal(outcome.first.result.promotionWritable, false);
      assert.equal(outcome.first.result.strictAcceptanceEffect, false);
      assert.equal(outcome.first.result.frameCount, 4);
      assert.equal(outcome.first.result.actionCount, 1);
      assert.match(outcome.first.result.verificationSha256, /^[a-f0-9]{64}$/);
      assert.equal(outcome.reuse.ok, false);
      assert.match(outcome.reuse.error, /already consumed/);
    } finally {
      await fixture.cleanup();
    }
  });

  for (const [name, phase, mode, expected] of [
    ["stale branded context rejects a persistent canonical update", "after-context-minted", "persistent", /inode\/metadata changed|bytes changed|stale or changed/],
    ["stale branded context rejects canonical replacement restored before combined verification", "after-context-minted", "replace-restore", /inode\/metadata changed|directory identity changed|stale or changed/],
    ["persistent canonical update during candidate verification", "after-before-snapshot", "persistent", /inode\/metadata changed|bytes changed|stale or changed/],
    ["temporary canonical replacement restored during candidate verification", "after-before-snapshot", "replace-restore", /inode\/metadata changed|directory identity changed|stale or changed/],
    ["canonical tamper immediately before the final reload", "before-final-reload", "persistent", /SHA-256 differs|inode\/metadata changed|bytes changed|stale or changed/],
    ["replace-and-restore tamper after the final reload", "after-final-reload", "replace-restore", /inode\/metadata changed|directory identity changed|stale or changed/],
  ]) await t.test(name, async () => {
    const fixture = await createIsolatedPromotionRepository();
    try {
      const outcome = await fixture.run({phase, mode});
      assert.equal(outcome.first.ok, false);
      assert.match(outcome.first.error, expected);
      assert.equal(outcome.reuse.ok, false);
      assert.match(outcome.reuse.error, /already consumed/);
    } finally {
      await fixture.cleanup();
    }
  });
});

test("incomplete low-level DAG verification is explicitly diagnostic-only", async () => {
  const fixture = await createDagFixture();
  try {
    const result = await verifyOriginalRuntimeNaturalCandidateDag({
      baseRoots: fixture.baseRoots,
      seeds: [fixture.seedDescriptor],
      requireCompleteArchives: false,
    });
    assert.equal(result.authority, "diagnostic-only-incomplete-archive");
    assert.equal(result.completeArchiveClosure, false);
    assert.equal(result.eligibleForCombinedPromotionVerification, false);
    assert.equal(result.promotionEnabled, false);
  } finally {
    await rm(fixture.temporary, {recursive: true, force: true});
  }
});
