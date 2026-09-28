#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const OBSERVABILITY_PATH =
  "reports/g4-l3-parent-composite-observability-audit.json";
const ROOT_PATH_AUDIT =
  "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const PARENT_ASSET_REPORT = "reports/g4-l3-parent-composite-assets.json";
const OPERATION_INDEX = "reports/g4-l3-source-operation-index-v2.json";
const REPORT_PATH =
  "reports/g4-l3-parent-composite-residual-behavior-plan.json";
const MARKDOWN_PATH =
  "reports/g4-l3-parent-composite-residual-behavior-plan.md";

const CONFIGS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    targetTimelineId: "sprite-114",
    pathIndex: 1,
    expectedClassification:
      "source-position-not-observable-in-static-parent-composite",
    immediateParentTimelineId: "sprite-136",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-271:lesson-shell-natural-entry:en",
    disposition: "natural-parent-composite-next",
    nextAction:
      "Render and capture the complete sprite-136 parent domain at its exact sprite-271 placement; do not force sprite-114 through a fixed entry mask.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    targetTimelineId: "sprite-46",
    pathIndex: 1,
    expectedClassification:
      "source-position-not-observable-in-static-parent-composite",
    immediateParentTimelineId: "sprite-68",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-228:lesson-shell-natural-entry:en",
    disposition: "natural-parent-composite-next",
    nextAction:
      "Render and capture the complete sprite-68 parent domain at its exact sprite-228 placement; do not force sprite-46 through a fixed entry mask.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    targetTimelineId: "sprite-262",
    pathIndex: 1,
    expectedClassification:
      "source-position-not-observable-in-static-parent-composite",
    immediateParentTimelineId: "sprite-284",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-441:lesson-shell-natural-entry:en",
    disposition: "natural-parent-composite-next",
    nextAction:
      "Render and capture the complete sprite-284 parent domain at its exact sprite-441 placement; do not force sprite-262 through a fixed entry mask.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    targetTimelineId: "sprite-142",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-176",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-142:lesson-shell-natural-entry:en",
    disposition: "transparent-preroll-parent-composite-next",
    nextAction:
      "Preserve the alpha-zero pre-roll as part of the complete sprite-176 parent domain; the later visible sprite-142 placement is already captured separately.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    targetTimelineId: "sprite-74",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-108",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-74:lesson-shell-natural-entry:en",
    disposition: "transparent-preroll-parent-composite-next",
    nextAction:
      "Preserve the alpha-zero pre-roll as part of the complete sprite-108 parent domain; the later visible sprite-74 placement is already captured separately.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    targetTimelineId: "sprite-290",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-324",
    entryParentFrame: 2,
    coveringRequirementId:
      "req:sprite-290:lesson-shell-natural-entry:en",
    disposition: "transparent-preroll-parent-composite-next",
    nextAction:
      "Preserve the alpha-zero pre-roll as part of the complete sprite-324 parent domain; the later visible sprite-290 placement is already captured separately.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-004",
    targetTimelineId: "sprite-273",
    pathIndex: 1,
    expectedClassification:
      "source-position-not-observable-in-static-parent-composite",
    immediateParentTimelineId: "sprite-274",
    entryParentFrame: 124,
    coveringRequirementId:
      "req:sprite-274:lesson-shell-natural-entry:en",
    disposition: "main-domain-covered-nonobservable-diagnostic-only",
    nextAction:
      "Keep the sprite-274 main-domain capture as the Current-JS diagnostic; require an authoritative natural trace before treating sprite-273 as an independent visual domain.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-005",
    targetTimelineId: "sprite-179",
    pathIndex: 1,
    expectedClassification:
      "source-position-not-observable-in-static-parent-composite",
    immediateParentTimelineId: "sprite-208",
    entryParentFrame: 75,
    coveringRequirementId:
      "req:sprite-208:lesson-shell-natural-entry:en",
    disposition: "main-domain-covered-nonobservable-diagnostic-only",
    nextAction:
      "Keep the sprite-208 main-domain capture as the Current-JS diagnostic; require an authoritative natural trace before treating sprite-179 as an independent visual domain.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-gs-002",
    targetTimelineId: "sprite-147",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-321",
    entryParentFrame: 427,
    coveringRequirementId:
      "req:sprite-321:lesson-shell-natural-entry:en",
    disposition: "audio-only-empty-canvas-domain",
    nextAction:
      "Route sprite-147 to source-bound audio and named-human listening review; do not manufacture an independent visual renderer for its empty Canvas frames.",
  }),
  ...[1, 2, 3].map((pathIndex) => Object.freeze({
    animationId: "course-g04-l03-gs-002",
    targetTimelineId: "sprite-206",
    pathIndex,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-207",
    entryParentFrame: 1,
    coveringRequirementId:
      "req:sprite-319:lesson-shell-natural-entry:en",
    disposition: "generated-parent-domain-covers-source-position",
    nextAction:
      "Retain the adopted sprite-319 full-domain sequence as the Current-JS parent witness; require natural original-runtime target-control proof before independent sprite-206 fidelity.",
  })),
  Object.freeze({
    animationId: "course-g04-l03-gs-002",
    targetTimelineId: "sprite-306",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-319",
    entryParentFrame: 172,
    coveringRequirementId:
      "req:sprite-319:lesson-shell-natural-entry:en",
    disposition: "generated-parent-domain-covers-source-position",
    nextAction:
      "Retain the adopted sprite-319 full-domain sequence as the Current-JS parent witness; require natural original-runtime target-control proof before independent sprite-306 fidelity.",
  }),
  Object.freeze({
    animationId: "course-g04-l03-gs-002",
    targetTimelineId: "sprite-318",
    pathIndex: 1,
    expectedClassification: "inconclusive-target-dispatch-not-observable",
    immediateParentTimelineId: "sprite-319",
    entryParentFrame: 178,
    coveringRequirementId:
      "req:sprite-319:lesson-shell-natural-entry:en",
    disposition: "generated-parent-domain-covers-source-position",
    nextAction:
      "Retain the adopted sprite-319 full-domain sequence as the Current-JS parent witness; require natural original-runtime target-control proof before independent sprite-318 fidelity.",
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function pretty(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0
      && !path.isAbsolute(relativePath),
    "project-relative path is required",
  );
  const absolute = path.resolve(ROOT, relativePath);
  invariant(
    absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`,
  );
  return absolute;
}

async function record(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`,
  );
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytesValue = await readFile(absolute);
  return {
    path: relativePath,
    bytes: bytesValue.length,
    sha256: sha256(bytesValue),
    bytesValue,
  };
}

function binding(fileRecord) {
  return {
    path: fileRecord.path,
    bytes: fileRecord.bytes,
    sha256: fileRecord.sha256,
  };
}

export function extractFunctionDefinition(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  invariant(start >= 0, `${functionName}: function definition is missing`);
  const open = source.indexOf("{", start + marker.length);
  invariant(open >= 0, `${functionName}: function body is missing`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote !== null) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${functionName}: function body is unterminated`);
}

function caseBlock(functionSource, zeroIndexedFrame) {
  const marker = new RegExp(`\\n\\s*case ${zeroIndexedFrame}:`);
  const match = marker.exec(functionSource);
  invariant(match, `case ${zeroIndexedFrame} is missing`);
  const start = match.index + match[0].length;
  const remainder = functionSource.slice(start);
  const next = /\n\s*(?:case \d+:|default:|})/.exec(remainder);
  invariant(next, `case ${zeroIndexedFrame} is unterminated`);
  return remainder.slice(0, next.index);
}

function alphaMultiplier(placementExpression) {
  const match = placementExpression.match(
    /new cxform\([^)]*,\s*(-?\d+(?:\.\d+)?)\)\)/,
  );
  return match ? Number(match[1]) : 256;
}

function findObservabilityPath(observability, config) {
  const item = observability.items.find(
    ({animationId}) => animationId === config.animationId,
  );
  const domain = item?.domains?.find(
    ({targetTimelineId}) => targetTimelineId === config.targetTimelineId,
  );
  const pathRow = domain?.paths?.find(
    ({pathIndex}) => pathIndex === config.pathIndex,
  );
  invariant(pathRow, `${config.animationId}/${config.targetTimelineId}/path-${config.pathIndex}: observability path is missing`);
  invariant(
    pathRow.classification === config.expectedClassification,
    `${config.animationId}/${config.targetTimelineId}/path-${config.pathIndex}: observability classification drifted`,
  );
  return pathRow;
}

function findPlacementPath(rootAudit, config) {
  const item = rootAudit.items.find(
    ({animationId}) => animationId === config.animationId,
  );
  const domain = item?.domains?.find(
    ({targetTimelineId}) => targetTimelineId === config.targetTimelineId,
  );
  const placementPath = domain?.placementPaths?.[config.pathIndex - 1];
  const finalEdge = placementPath?.at(-1);
  invariant(
    finalEdge?.parentTimelineId === config.immediateParentTimelineId
      && finalEdge?.parentFrame === config.entryParentFrame
      && finalEdge?.childTimelineId === config.targetTimelineId,
    `${config.animationId}/${config.targetTimelineId}/path-${config.pathIndex}: placement path drifted`,
  );
  return placementPath;
}

async function buildItem(config, documents) {
  const specPath =
    `migrations/${config.animationId}/audit/source-static-current-js-candidate-spec.json`;
  const specRecord = await record(specPath);
  const spec = JSON.parse(specRecord.bytesValue);
  invariant(spec.animationId === config.animationId, `${config.animationId}: source-static spec drifted`);
  const runtimeRecord = await record(spec.outputs.canvasRuntime);
  const runtimeSource = runtimeRecord.bytesValue.toString("utf8");
  const targetFunctionName = config.targetTimelineId.replace("-", "");
  const parentFunctionName = config.immediateParentTimelineId.replace("-", "");
  const targetFunction = extractFunctionDefinition(runtimeSource, targetFunctionName);
  const parentFunction = extractFunctionDefinition(runtimeSource, parentFunctionName);
  const entryCase = caseBlock(parentFunction, config.entryParentFrame - 1);
  const placementLines = entryCase.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes(`place("${targetFunctionName}"`));
  invariant(
    placementLines.length === 1,
    `${config.animationId}/${config.targetTimelineId}: exact entry placement is ambiguous`,
  );
  const observabilityPath = findObservabilityPath(documents.observability, config);
  const placementPath = findPlacementPath(documents.rootAudit, config);
  const operationItem = documents.operationIndex.items.find(
    ({animationId}) => animationId === config.animationId,
  );
  invariant(operationItem, `${config.animationId}: source-operation item is absent`);
  const drawablePlacementCount = [...targetFunction.matchAll(/\bplace\("/g)].length;
  if (config.disposition === "audio-only-empty-canvas-domain") {
    invariant(drawablePlacementCount === 0, `${config.targetTimelineId}: expected an empty Canvas timeline`);
  } else {
    invariant(drawablePlacementCount > 0, `${config.targetTimelineId}: drawable source function disappeared`);
  }
  const entryAlphaMultiplier = alphaMultiplier(placementLines[0]);
  if (config.disposition === "transparent-preroll-parent-composite-next") {
    invariant(entryAlphaMultiplier === 0, `${config.targetTimelineId}: pre-roll entry is no longer alpha zero`);
  }
  return {
    animationId: config.animationId,
    targetTimelineId: config.targetTimelineId,
    pathIndex: config.pathIndex,
    sourcePlacementPath: placementPath,
    observedClassification: observabilityPath.classification,
    observability: {
      overrideMechanismObservable:
        observabilityPath.overrideMechanismObservable,
      sourcePositionObservable: observabilityPath.sourcePositionObservable,
      uniqueTargetVisualCount: observabilityPath.uniqueTargetVisualCount,
    },
    sourceCanvasFacts: {
      immediateParentTimelineId: config.immediateParentTimelineId,
      entryParentFrame: config.entryParentFrame,
      entryAlphaMultiplier,
      entryPlacementExpression: placementLines[0],
      entryPlacementExpressionSha256: sha256(Buffer.from(placementLines[0])),
      targetDrawablePlacementCount: drawablePlacementCount,
      targetFunctionSha256: sha256(Buffer.from(targetFunction)),
      immediateParentFunctionSha256: sha256(Buffer.from(parentFunction)),
    },
    sourceStaticCandidateSpec: binding(specRecord),
    generatedCanvasRuntime: binding(runtimeRecord),
    sourceOperationCounts: operationItem.counts,
    coveringEngineeringWitness: {
      requirementId: config.coveringRequirementId,
      frameDomainId: config.coveringRequirementId.split(":")[1],
      disposition:
        "Current-JS adoption is measured separately and cannot change this source-static routing plan",
    },
    disposition: config.disposition,
    nextAction: config.nextAction,
    authoritativeOriginalRuntimeEstablished: false,
    independentTargetFidelityAccepted: false,
    strictAcceptanceEffect: "none",
  };
}

function markdown(report) {
  const rows = report.items.map((item) =>
    `| \`${item.animationId}\` | \`${item.targetTimelineId}\` | ${item.pathIndex} | \`${item.disposition}\` | ${item.nextAction} |`,
  ).join("\n");
  return `# G4 L3 residual parent-composite behavior plan\n\n`
    + `This acceptance-neutral plan classifies the remaining **${report.summary.residualPlacementPaths}** parent-composite placement paths using exact source placement, generated Canvas function, generated parent-asset, and prior observability evidence. Current-JS adoption is measured separately.\n\n`
    + `| Animation | Target | Path | Disposition | Next action |\n`
    + `|---|---|---:|---|---|\n${rows}\n\n`
    + "No authoritative original runtime was executed. No visual fidelity, audio listening, human review, Owner acceptance, strict completion, release, or publication decision is created by this plan.\n";
}

async function buildArtifacts() {
  const [generatorRecord, observabilityRecord, rootAuditRecord,
    parentAssetRecord, operationIndexRecord] = await Promise.all([
    record(path.relative(ROOT, SCRIPT_PATH)),
    record(OBSERVABILITY_PATH),
    record(ROOT_PATH_AUDIT),
    record(PARENT_ASSET_REPORT),
    record(OPERATION_INDEX),
  ]);
  const documents = {
    observability: JSON.parse(observabilityRecord.bytesValue),
    rootAudit: JSON.parse(rootAuditRecord.bytesValue),
    operationIndex: JSON.parse(operationIndexRecord.bytesValue),
  };
  const items = [];
  for (const config of CONFIGS) items.push(await buildItem(config, documents));
  const dispositionCounts = Object.fromEntries(
    [...new Set(items.map(({disposition}) => disposition))].sort()
      .map((disposition) => [
        disposition,
        items.filter((item) => item.disposition === disposition).length,
      ]),
  );
  const summary = {
    residualPlacementPaths: items.length,
    workspaces: new Set(items.map(({animationId}) => animationId)).size,
    dispositionCounts,
    sourcePositionObservablePaths: items.filter(
      ({observability}) => observability.sourcePositionObservable,
    ).length,
    authoritativeRuntimeSessions: 0,
    fidelityAcceptances: 0,
    audioListeningAcceptances: 0,
    humanDecisions: 0,
    ownerDecisions: 0,
    strictCompletions: 0,
  };
  invariant(
    pretty(summary) === pretty({
      residualPlacementPaths: 14,
      workspaces: 6,
      dispositionCounts: {
        "generated-parent-domain-covers-source-position": 5,
        "audio-only-empty-canvas-domain": 1,
        "main-domain-covered-nonobservable-diagnostic-only": 2,
        "natural-parent-composite-next": 3,
        "transparent-preroll-parent-composite-next": 3,
      },
      sourcePositionObservablePaths: 0,
      authoritativeRuntimeSessions: 0,
      fidelityAcceptances: 0,
      audioListeningAcceptances: 0,
      humanDecisions: 0,
      ownerDecisions: 0,
      strictCompletions: 0,
    }),
    "residual behavior-plan denominator drifted",
  );
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-parent-composite-residual-behavior-plan",
    generator: binding(generatorRecord),
    sourceParentCompositeObservabilityAudit: binding(observabilityRecord),
    sourceRootEntryPlacementAudit: binding(rootAuditRecord),
    adoptedParentCompositeAssetReport: binding(parentAssetRecord),
    sourceOperationIndex: binding(operationIndexRecord),
    items,
    summary,
    acceptance: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; source-static behavior routing only",
  };
  return {
    report,
    reportBytes: Buffer.from(pretty(report)),
    markdownBytes: Buffer.from(markdown(report)),
  };
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
  await rename(temporary, target);
}

export async function run({write = false} = {}) {
  const artifacts = await buildArtifacts();
  if (write) {
    await atomicWrite(REPORT_PATH, artifacts.reportBytes);
    await atomicWrite(MARKDOWN_PATH, artifacts.markdownBytes);
  } else {
    const [reportRecord, markdownRecord] = await Promise.all([
      record(REPORT_PATH), record(MARKDOWN_PATH),
    ]);
    invariant(
      reportRecord.bytesValue.equals(artifacts.reportBytes),
      `${REPORT_PATH} is stale`,
    );
    invariant(
      markdownRecord.bytesValue.equals(artifacts.markdownBytes),
      `${MARKDOWN_PATH} is stale`,
    );
  }
  return artifacts.report;
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (argv.length === 0) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(
      `PASS: ${report.summary.residualPlacementPaths} residual paths classified; fidelity/audio/human/Owner/strict acceptance unchanged.\n`,
    );
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
