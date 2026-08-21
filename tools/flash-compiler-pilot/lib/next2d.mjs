import {mkdir, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  fileIdentity,
  invariant,
  inventoryDirectory,
  portable,
  publicMemberProjection,
  runCommand,
  sha256Bytes,
  stableJson,
  writeExclusive,
} from "./core.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const WRAPPER_PATH = path.resolve(
  MODULE_DIR,
  "../vendor/next2d/next2d-headless-extract.mjs",
);
const WRAPPER_SHA256 = "bb49570a3ecaa4c625aeb8d2e7d431b15ab59c87537264a6c7d5b700c95651c1";
const WORKER_COMMIT = "0a3520270bc937dd85f215d410b27daddde05f1d";
const WORKER_SHA256 = "fbce895536e946dda4b07fc38551edd651dbfa3f95c5e3aa0b9b6c128e98b913";
const WORKER_URL = `https://raw.githubusercontent.com/Next2D/tool.next2d.app/${WORKER_COMMIT}/src/javascript/worker/SwfParserWorker.js`;

async function acquireWorker(destination, suppliedPath) {
  let bytes;
  let acquisition;
  if (suppliedPath) {
    bytes = await readFile(suppliedPath);
    acquisition = {kind: "caller-supplied-local-file", suppliedPath};
  } else {
    const response = await fetch(WORKER_URL, {
      headers: {"User-Agent": "HELP-Math-flash-compiler-pilot/1"},
    });
    invariant(response.ok, `Next2D worker download failed: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    acquisition = {kind: "pinned-https-download", url: WORKER_URL};
  }
  invariant(sha256Bytes(bytes) === WORKER_SHA256,
    "Next2D worker SHA-256 does not match the pinned commit artifact");
  await writeExclusive(destination, bytes);
  return {...acquisition, bytes: bytes.length, sha256: WORKER_SHA256};
}

function publicCommand(command, projectRoot) {
  return {
    ...command,
    args: command.args.map((value) => value.startsWith(`${projectRoot}${path.sep}`)
      ? portable(path.relative(projectRoot, value))
      : value),
  };
}

async function runWorker({runRoot, workerPath, corpusValidation, projectRoot, label}) {
  const logRoot = path.join(runRoot, "..", "logs");
  const args = [
    WRAPPER_PATH,
    "--worker", workerPath,
    "--catalog", path.join(projectRoot, corpusValidation.catalogPath),
    "--out", runRoot,
  ];
  for (const member of corpusValidation.members) {
    args.push("--input", `${member.animationId}=${member.physical.swfPath}`);
  }
  return runCommand({
    command: process.execPath,
    args,
    cwd: projectRoot,
    stdoutPath: path.join(logRoot, `${label}.stdout.txt`),
    stderrPath: path.join(logRoot, `${label}.stderr.txt`),
    timeoutMs: 120_000,
  });
}

function expectedDomainMap(member) {
  return new Map([
    [0, member.expectedStructure.rootFrameCount],
    ...member.expectedStructure.nestedSprites.map((sprite) => [sprite.objectId, sprite.frameCount]),
  ]);
}

function validateSummary(member, summary) {
  invariant(summary.schemaVersion === 1, `${member.animationId}: Next2D summary schema drifted`);
  invariant(summary.source.id === member.animationId &&
    summary.source.sha256 === member.source.sha256 &&
    summary.source.bytes === member.source.bytes,
  `${member.animationId}: Next2D source identity drifted`);
  invariant(summary.source.catalog?.referencedActivePage === true &&
    summary.source.catalog?.shell === false &&
    summary.source.catalog?.unreferenced === false &&
    summary.source.catalog?.variant === false,
  `${member.animationId}: Next2D accepted a non-active or shell member`);
  invariant(summary.header.stage.width === member.expectedStructure.stageWidth &&
    summary.header.stage.height === member.expectedStructure.stageHeight &&
    summary.header.fps === member.expectedStructure.fps &&
    summary.header.declaredFrameCount === member.expectedStructure.rootFrameCount,
  `${member.animationId}: Next2D SWF header drifted`);
  const expectedDomains = expectedDomainMap(member);
  const observedDomains = summary.parse.frameDomains.domains;
  invariant(observedDomains.length === expectedDomains.size,
    `${member.animationId}: Next2D frame-domain count drifted`);
  for (const domain of observedDomains) {
    invariant(expectedDomains.get(domain.characterId) === domain.frames,
      `${member.animationId}: Next2D frame domain ${domain.characterId} drifted`);
  }
  invariant(summary.parse.root.frameCountMatches === true,
    `${member.animationId}: Next2D root frame mismatch`);
  invariant(summary.parse.logs.length === 0,
    `${member.animationId}: Next2D worker emitted parser/TODO logs`);
  invariant(summary.parse.output.eventBytes > 0 &&
    /^[a-f0-9]{64}$/.test(summary.parse.output.eventSha256),
  `${member.animationId}: Next2D event IR is missing`);
}

async function readRun(runRoot, corpusValidation) {
  const aggregate = JSON.parse(await readFile(path.join(runRoot, "aggregate.json"), "utf8"));
  invariant(aggregate.schemaVersion === 1 && aggregate.itemCount === 5,
    "Next2D aggregate member count drifted");
  invariant(aggregate.pageOnlyCorpus === true && aggregate.legacyCourseShellCount === 0,
    "Next2D aggregate is not zero-shell page-only");
  const summaries = [];
  for (const member of corpusValidation.members) {
    const summary = JSON.parse(await readFile(
      path.join(runRoot, member.animationId, "summary.json"),
      "utf8",
    ));
    validateSummary(member, summary);
    summaries.push(summary);
  }
  return {aggregate, summaries};
}

function eventHashes(aggregate) {
  return Object.fromEntries(aggregate.results.map((item) => [item.id, item.eventSha256]));
}

function sameObject(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function buildNext2dBackend({
  corpusValidation,
  outputRoot,
  projectRoot = PROJECT_ROOT,
  workerSourcePath = null,
}) {
  const backendRoot = path.join(outputRoot, "next2d");
  await mkdir(backendRoot, {recursive: false});
  const dependenciesRoot = path.join(backendRoot, "dependencies");
  await mkdir(dependenciesRoot, {recursive: true});
  invariant((await fileIdentity(WRAPPER_PATH)).sha256 === WRAPPER_SHA256,
    "Next2D wrapper changed without updating its frozen identity");
  const workerPath = path.join(dependenciesRoot, "SwfParserWorker.js");
  const acquisition = await acquireWorker(workerPath, workerSourcePath);

  const sourceBefore = new Map();
  for (const member of corpusValidation.members) {
    sourceBefore.set(member.animationId, await fileIdentity(member.physical.swfPath));
  }
  const runARoot = path.join(backendRoot, "run-a");
  const runBRoot = path.join(backendRoot, "run-b");
  const commandA = await runWorker({
    runRoot: runARoot,
    workerPath,
    corpusValidation,
    projectRoot,
    label: "next2d-run-a",
  });
  invariant(commandA.success, "Next2D worker run A failed");
  const commandB = await runWorker({
    runRoot: runBRoot,
    workerPath,
    corpusValidation,
    projectRoot,
    label: "next2d-run-b",
  });
  invariant(commandB.success, "Next2D worker run B failed");
  const runA = await readRun(runARoot, corpusValidation);
  const runB = await readRun(runBRoot, corpusValidation);
  const hashesA = eventHashes(runA.aggregate);
  const hashesB = eventHashes(runB.aggregate);
  invariant(sameObject(hashesA, hashesB),
    "Next2D worker event IR is nondeterministic across repeated runs");

  const manifestsRoot = path.join(backendRoot, "manifests");
  await mkdir(manifestsRoot, {recursive: true});
  const manifests = [];
  for (let index = 0; index < corpusValidation.members.length; index += 1) {
    const member = corpusValidation.members[index];
    const raw = runA.summaries[index];
    const after = await fileIdentity(member.physical.swfPath);
    const before = sourceBefore.get(member.animationId);
    invariant(after.bytes === before.bytes && after.sha256 === before.sha256,
      `${member.animationId}: source changed during Next2D run`);
    const typeCounts = raw.parse.typeCounts;
    const discarded = raw.parse.discardedActionPayloads;
    const nonEmitting = raw.parse.knownNonEmittingData;
    const unsupportedLedger = [
      {
        id: "avm1-timeline-scripts-discarded",
        occurrences: discarded.timelineScriptTagCount,
        bytes: discarded.timelineScriptPayloadBytes,
      },
      {
        id: "button-action-payloads-discarded",
        occurrences: discarded.buttonActionContainerCount,
        bytes: discarded.buttonActionPayloadBytes,
      },
      {
        id: "background-color-not-emitted",
        occurrences: nonEmitting.setBackgroundColorTags,
      },
      {
        id: "stream-audio-not-emitted",
        occurrences: nonEmitting.soundStreamHeadTags + nonEmitting.soundStreamBlockTags,
        bytes: nonEmitting.soundStreamBlockPayloadBytes,
      },
      {
        id: "static-text-needs-custom-consumer",
        occurrences: typeCounts.StaticText || 0,
      },
      {
        id: "simple-button-needs-custom-consumer",
        occurrences: typeCounts.SimpleButton || 0,
      },
      {
        id: "morph-shape-needs-custom-consumer",
        occurrences: typeCounts.MorphShape || 0,
      },
    ];
    const manifest = {
      schemaVersion: 1,
      backend: {
        id: "next2d-worker-ir",
        family: "instrumented-legacy-swf-parser",
        repository: "https://github.com/Next2D/tool.next2d.app",
        license: "MIT",
        commit: WORKER_COMMIT,
        workerSha256: WORKER_SHA256,
        wrapperSha256: WRAPPER_SHA256,
        latestTypeScriptBranchSwfImportStatus: "no-op-as-observed-at-7b8d68e6be96cba9ad4497fc3a838eb96959886a",
        visualRuntimeDependency: "custom-consumer-not-implemented",
        retainsOriginalSwfAtRuntime: false,
      },
      status: "structure-ir-success-no-renderer",
      member: publicMemberProjection(member, projectRoot),
      sourceCustody: {before, after, unchanged: true},
      observedStructure: {
        stage: raw.header.stage,
        fps: raw.header.fps,
        rootFrameCount: raw.header.declaredFrameCount,
        frameDomains: raw.parse.frameDomains,
        placementsAcrossAllDomains: raw.parse.placementsAcrossAllDomains,
        symbols: raw.parse.symbolCountExcludingRoot,
        typeCounts,
      },
      generatedIr: {
        eventBytes: raw.parse.output.eventBytes,
        eventSha256: raw.parse.output.eventSha256,
        repeatEventSha256: hashesB[member.animationId],
        deterministicAcrossTwoRuns: true,
      },
      compilerEffects: {
        structureIrGenerated: true,
        visualDrawingCodeGenerated: false,
        renderableVisualArtifactGenerated: false,
        avm1BehaviorRetained: false,
        buttonBehaviorRetained: false,
        backgroundColorRetained: false,
        streamAudioRetained: false,
        staticTextConsumerAvailable: false,
        simpleButtonConsumerAvailable: false,
        morphShapeConsumerAvailable: false,
        modernMyLessonHostAdapterGenerated: false,
      },
      unsupportedLedger,
      evidenceBoundary: {
        parserAndStructureIrEvidenceOnly: true,
        visualRendererClaim: false,
        runtimeReachabilityClaim: false,
        visualFidelityClaim: false,
        audioSynchronizationClaim: false,
        currentJavaScriptImplementationClaim: false,
      },
      rawSummaryPath: portable(path.relative(backendRoot,
        path.join(runARoot, member.animationId, "summary.json"))),
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    };
    await writeExclusive(
      path.join(manifestsRoot, `${member.animationId}.json`),
      stableJson(manifest),
    );
    manifests.push(manifest);
  }

  const summary = {
    schemaVersion: 1,
    backendId: "next2d-worker-ir",
    pilotId: corpusValidation.pilotId,
    memberCount: manifests.length,
    structureIrSuccessCount: manifests.filter((item) =>
      item.compilerEffects.structureIrGenerated).length,
    renderableVisualArtifactCount: manifests.filter((item) =>
      item.compilerEffects.renderableVisualArtifactGenerated).length,
    behaviorRetainedCount: manifests.filter((item) =>
      item.compilerEffects.avm1BehaviorRetained).length,
    streamAudioRetainedCount: manifests.filter((item) =>
      item.compilerEffects.streamAudioRetained).length,
    deterministicEventIrCount: manifests.filter((item) =>
      item.generatedIr.deterministicAcrossTwoRuns).length,
    shellCount: 0,
    acquisition,
    commands: {
      runA: publicCommand(commandA, projectRoot),
      runB: publicCommand(commandB, projectRoot),
    },
    totals: runA.aggregate.totals,
    outputInventory: await inventoryDirectory(backendRoot, {
      exclude: ["summary.json"],
    }),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  await writeExclusive(path.join(backendRoot, "summary.json"), stableJson(summary));
  return {backendRoot, manifests, summary};
}

