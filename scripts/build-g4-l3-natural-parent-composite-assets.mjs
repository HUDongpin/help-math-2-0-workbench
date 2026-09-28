#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {buildParentCompositeContract} from "./build-g4-l3-parent-composite-assets.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const FFDEC_PATH = "/opt/homebrew/bin/ffdec";
const SAFE_BUILDER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const SHARED_CONTRACT_BUILDER_PATH =
  "scripts/build-g4-l3-parent-composite-assets.mjs";
const REPORT_PATH = "reports/g4-l3-natural-parent-composite-assets.json";
const MARKDOWN_PATH = "reports/g4-l3-natural-parent-composite-assets.md";

function directPath(targetTimelineId, targetFrameCount, requirementId, {
  intermediateFrameOverrides = {},
  expectedSourcePositionObservable = true,
} = {}) {
  return Object.freeze({
    targetTimelineId,
    pathIndex: 1,
    targetFrameCount,
    intermediateFrameOverrides: Object.freeze(intermediateFrameOverrides),
    expectedSourcePositionObservable,
    requirementId,
  });
}

export const NATURAL_PARENT_COMPOSITE_CONFIGS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    assetKey: "course-g04-l03-vb-007-natural-parent-composite",
    mainFrameDomainId: "sprite-271",
    mainFrame: 31,
    mainFrameCount: 69,
    contractId: "g04-l03-vb-007-natural-parent-composite-v1",
    paths: Object.freeze([
      Object.freeze({
        targetTimelineId: "sprite-136",
        pathIndex: 1,
        targetFrameCount: 26,
        anchorFrame: 6,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-136:lesson-shell-natural-entry:en",
      }),
      Object.freeze({
        targetTimelineId: "sprite-176",
        pathIndex: 1,
        targetFrameCount: 27,
        anchorFrame: 12,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-176:lesson-shell-natural-entry:en",
      }),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    assetKey: "course-g04-l03-in-012-natural-parent-composite",
    mainFrameDomainId: "sprite-228",
    mainFrame: 174,
    mainFrameCount: 215,
    contractId: "g04-l03-in-012-natural-parent-composite-v1",
    paths: Object.freeze([
      Object.freeze({
        targetTimelineId: "sprite-68",
        pathIndex: 1,
        targetFrameCount: 26,
        anchorFrame: 6,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-68:lesson-shell-natural-entry:en",
      }),
      Object.freeze({
        targetTimelineId: "sprite-108",
        pathIndex: 1,
        targetFrameCount: 27,
        anchorFrame: 12,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-108:lesson-shell-natural-entry:en",
      }),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-natural-parent-composite",
    mainFrameDomainId: "sprite-441",
    mainFrame: 679,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-natural-parent-composite-v1",
    paths: Object.freeze([
      Object.freeze({
        targetTimelineId: "sprite-284",
        pathIndex: 1,
        targetFrameCount: 26,
        anchorFrame: 6,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-284:lesson-shell-natural-entry:en",
      }),
      Object.freeze({
        targetTimelineId: "sprite-324",
        pathIndex: 1,
        targetFrameCount: 27,
        anchorFrame: 12,
        intermediateFrameOverrides: Object.freeze({}),
        requirementId: "req:sprite-324:lesson-shell-natural-entry:en",
      }),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    assetKey: "course-g04-l03-vb-007-direct-companion-composite",
    mainFrameDomainId: "sprite-271",
    mainFrame: 31,
    mainFrameCount: 69,
    contractId: "g04-l03-vb-007-direct-companion-composite-v1",
    paths: Object.freeze([
      directPath("sprite-42", 1,
        "req:sprite-42:lesson-shell-natural-entry:en", {
          intermediateFrameOverrides: {sprite45: 12},
          expectedSourcePositionObservable: false,
        }),
      directPath("sprite-45", 28,
        "req:sprite-45:lesson-shell-natural-entry:en"),
      directPath("sprite-63", 27,
        "req:sprite-63:lesson-shell-natural-entry:en"),
      directPath("sprite-77", 31,
        "req:sprite-77:lesson-shell-natural-entry:en"),
      directPath("sprite-105", 28,
        "req:sprite-105:lesson-shell-natural-entry:en"),
      directPath("sprite-202", 31,
        "req:sprite-202:lesson-shell-natural-entry:en"),
      directPath("sprite-234", 25,
        "req:sprite-234:lesson-shell-natural-entry:en"),
      directPath("sprite-267", 27,
        "req:sprite-267:lesson-shell-natural-entry:en"),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    assetKey: "course-g04-l03-in-012-direct-companion-composite",
    mainFrameDomainId: "sprite-228",
    mainFrame: 174,
    mainFrameCount: 215,
    contractId: "g04-l03-in-012-direct-companion-composite-v1",
    paths: Object.freeze([
      directPath("sprite-37", 20,
        "req:sprite-37:lesson-shell-natural-entry:en", {
          expectedSourcePositionObservable: false,
        }),
      directPath("sprite-134", 31,
        "req:sprite-134:lesson-shell-natural-entry:en"),
      directPath("sprite-166", 25,
        "req:sprite-166:lesson-shell-natural-entry:en"),
      directPath("sprite-199", 27,
        "req:sprite-199:lesson-shell-natural-entry:en"),
      directPath("sprite-223", 15,
        "req:sprite-223:lesson-shell-natural-entry:en"),
      directPath("sprite-227", 25,
        "req:sprite-227:lesson-shell-natural-entry:en"),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-direct-companion-composite-frame-374",
    mainFrameDomainId: "sprite-441",
    mainFrame: 374,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-direct-companion-composite-frame-374-v1",
    paths: Object.freeze([
      directPath("sprite-90", 70,
        "req:sprite-90:lesson-shell-natural-entry:en"),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-direct-companion-composite-frame-500",
    mainFrameDomainId: "sprite-441",
    mainFrame: 500,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-direct-companion-composite-frame-500-v1",
    paths: Object.freeze([
      directPath("sprite-114", 97,
        "req:sprite-114:lesson-shell-natural-entry:en"),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-direct-companion-composite-frame-617",
    mainFrameDomainId: "sprite-441",
    mainFrame: 617,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-direct-companion-composite-frame-617-v1",
    paths: Object.freeze([
      directPath("sprite-127", 20,
        "req:sprite-127:lesson-shell-natural-entry:en"),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-direct-companion-composite-frame-679",
    mainFrameDomainId: "sprite-441",
    mainFrame: 679,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-direct-companion-composite-frame-679-v1",
    paths: Object.freeze([
      directPath("sprite-183", 83,
        "req:sprite-183:lesson-shell-natural-entry:en"),
      directPath("sprite-193", 28,
        "req:sprite-193:lesson-shell-natural-entry:en"),
      directPath("sprite-211", 27,
        "req:sprite-211:lesson-shell-natural-entry:en"),
      directPath("sprite-225", 31,
        "req:sprite-225:lesson-shell-natural-entry:en"),
      directPath("sprite-253", 28,
        "req:sprite-253:lesson-shell-natural-entry:en"),
      directPath("sprite-350", 31,
        "req:sprite-350:lesson-shell-natural-entry:en"),
      directPath("sprite-382", 25,
        "req:sprite-382:lesson-shell-natural-entry:en"),
      directPath("sprite-415", 27,
        "req:sprite-415:lesson-shell-natural-entry:en"),
      directPath("sprite-439", 70,
        "req:sprite-439:lesson-shell-natural-entry:en"),
    ]),
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

function canonicalJson(value) {
  return JSON.stringify(stable(value));
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

function exactBinding(actual, expected, label) {
  invariant(
    actual.path === expected?.path
      && actual.bytes === expected?.bytes
      && actual.sha256 === expected?.sha256,
    `${label} binding drifted`,
  );
}

function functionName(timelineId) {
  invariant(/^sprite-\d+$/.test(timelineId), `${timelineId} is not a sprite ID`);
  return timelineId.replace("-", "");
}

function targetStateId(pathConfig, suffix) {
  return `${functionName(pathConfig.targetTimelineId)}-p${String(pathConfig.pathIndex).padStart(2, "0")}-${suffix}`;
}

function outputPaths(config) {
  const outputRoot = `public/flash-assets/courses/${config.assetKey}`;
  return {
    outputRoot,
    runtime: `${outputRoot}/canvas-renderer.js`,
    manifest: `${outputRoot}/manifest.json`,
  };
}

function adapterSpec(sourceSpec, config, contract, outputs) {
  return {
    schemaVersion: 1,
    animationId: config.assetKey,
    classification:
      "source-static-natural-parent-composite-engineering-candidate-only",
    source: {
      swf: sourceSpec.source.swf.path,
      swfSha256: sourceSpec.source.swf.sha256,
    },
    evidence: {
      scenarioInventorySha256: sourceSpec.evidence.sourceAudit.sha256,
      audioAuditSha256:
        (sourceSpec.evidence.authoringAudit ?? sourceSpec.evidence.sourceAudit).sha256,
    },
    ffdecExport: {
      tool: "JPEXS Free Flash Decompiler v.26.2.1",
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: sourceSpec.ffdec.helper.sha256,
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: sourceSpec.ffdec.framesHtml.sha256,
      targetSpriteObjectId: sourceSpec.ffdec.targetSpriteObjectId,
      targetSpriteFunction: sourceSpec.ffdec.targetSpriteFunction,
      exportCanvas: sourceSpec.ffdec.exportCanvas,
      exportInternalTranslation: sourceSpec.ffdec.exportInternalTranslation,
      expectedPlacedFunctionCount: sourceSpec.ffdec.expectedPlacedFunctions.count,
      expectedPlacedFunctionsSha256:
        sourceSpec.ffdec.expectedPlacedFunctions.sha256,
      embeddedImageVariableCount: sourceSpec.ffdec.expectedEmbeddedImages.count,
      embeddedImageVariablesSha256:
        sourceSpec.ffdec.expectedEmbeddedImages.sha256,
    },
    timeline: {
      fps: sourceSpec.timeline.fps,
      stage: sourceSpec.timeline.stage,
      root: sourceSpec.timeline.root,
      local: {
        timelineId: sourceSpec.timeline.local.frameDomain,
        frameCount: sourceSpec.timeline.local.frameCount,
        playbackMode: "state-explorer",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: sourceSpec.timeline.stageRenderOffset,
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping:
        "no-randomness-injected-into-source-static-natural-parent-composite",
      blockedLocalFrameRanges: [],
      unresolved: [
        `The renderer pins ${config.mainFrameDomainId} frame ${config.mainFrame} and advances only the exact source parent timelines ${config.paths.map(({targetTimelineId}) => targetTimelineId).join(", ")}; it never executes AVM1 or proves natural runtime reachability.`,
        "Child clocks follow the static FFDec frame expressions present in each selected parent frame; this is implementation evidence, not an authoritative runtime trace.",
        "Spanish visuals, audio, fidelity, human review, Owner acceptance, strict completion, release, and publication remain closed.",
      ],
      prebindingTargetFrameDomainDisposition:
        "exact source parent frame override at the source-proven main placement",
      currentCanonicalFrameDomainDispositionAsserted: false,
      sourceBehaviorComposite: contract,
    },
    output: {
      script: outputs.runtime,
      manifest: outputs.manifest,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

async function freshExport(sourceSpec, config, temporaryRoot) {
  const result = await execFileAsync(FFDEC_PATH, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(sourceSpec.ffdec.targetSpriteObjectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    temporaryRoot,
    projectPath(sourceSpec.source.swf.path),
  ], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(
      "JPEXS Free Flash Decompiler v.26.2.1",
    ),
    `${config.animationId}: FFDec version drifted`,
  );
  const exportRoot = path.join(
    temporaryRoot,
    `DefineSprite_${sourceSpec.ffdec.targetSpriteObjectId}`,
  );
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportRoot, "canvas.js")),
    readFile(path.join(exportRoot, "frames.html")),
  ]);
  invariant(
    helper.length === sourceSpec.ffdec.helper.bytes
      && sha256(helper) === sourceSpec.ffdec.helper.sha256,
    `${config.animationId}: fresh FFDec helper drifted`,
  );
  invariant(
    frames.length === sourceSpec.ffdec.framesHtml.bytes
      && sha256(frames) === sourceSpec.ffdec.framesHtml.sha256,
    `${config.animationId}: fresh FFDec frames export drifted`,
  );
  return {
    helper: helper.toString("utf8"),
    framesHtml: frames.toString("utf8"),
  };
}

function validateCoverageRequirement(
  coverage,
  config,
  pathConfig,
  sourcePlacementPath,
) {
  const requirement = coverage.requirements?.find(
    ({requirementId}) => requirementId === pathConfig.requirementId,
  );
  invariant(
    requirement?.frameDomainId === pathConfig.targetTimelineId
      && requirement?.scenario === "source-static-reachable-domain"
      && requirement?.language === "en"
      && requirement?.seed === "0"
      && requirement?.baselineAuthority === "unresolved"
      && requirement?.requiredRange?.firstFrame === 1
      && requirement?.requiredRange?.lastFrame
        === pathConfig.targetFrameCount
      && requirement?.entryState?.parentFrameDomainId
        === sourcePlacementPath.at(-1).parentTimelineId
      && requirement?.entryState?.runtimeReachabilityEstablished === false,
    `${config.animationId}/${pathConfig.requirementId}: coverage requirement drifted or was promoted`,
  );
  return {
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
    requiredRange: requirement.requiredRange,
  };
}

function validatePlacementPath(frameDisposition, config, pathConfig) {
  const timeline = frameDisposition.timelines?.find(
    ({timelineId}) => timelineId === pathConfig.targetTimelineId,
  );
  const placementPath = timeline?.rootPlacement?.namedPlacementPath;
  const finalEdge = placementPath?.at(-1);
  const expectedIntermediateOverrides = {};
  for (const edge of placementPath?.slice(2) ?? []) {
    expectedIntermediateOverrides[functionName(edge.parentTimelineId)] =
      edge.frame - 1;
  }
  invariant(
    frameDisposition.animationId === config.animationId
      && timeline?.frameCount === pathConfig.targetFrameCount
      && timeline?.rootPlacement?.status === "proven-named-placement-chain"
      && placementPath?.length >= 2
      && placementPath[0].parentTimelineId === "root"
      && placementPath[0].frame === 6
      && placementPath[0].childTimelineId === config.mainFrameDomainId
      && placementPath[1].parentTimelineId === config.mainFrameDomainId
      && placementPath[1].frame === config.mainFrame
      && finalEdge?.childTimelineId === pathConfig.targetTimelineId
      && canonicalJson(expectedIntermediateOverrides)
        === canonicalJson(pathConfig.intermediateFrameOverrides),
    `${config.animationId}/${pathConfig.targetTimelineId}: exact source placement path drifted`,
  );
  return placementPath;
}

async function pngHash(page, config, stateId) {
  const dataUrl = await page.evaluate(async ({assetKey, contractId, frame, stateId}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[assetKey];
    if (!asset) throw new Error(`Missing natural parent asset ${assetKey}`);
    const canvas = document.getElementById("stage");
    await asset.ready();
    const state = asset.renderComposite(canvas, {
      frame,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: contractId,
      behaviorCompositeState: stateId,
    });
    if (state.behaviorCompositeContractId !== contractId
      || state.behaviorCompositeState !== stateId
      || state.audioRendered !== false) {
      throw new Error(`Natural parent identity mismatch for ${stateId}`);
    }
    return canvas.toDataURL("image/png");
  }, {
    assetKey: config.assetKey,
    contractId: config.contractId,
    frame: config.mainFrame,
    stateId,
  });
  const bytes = Buffer.from(dataUrl.split(",", 2)[1], "base64");
  return {pngBytes: bytes.length, pngSha256: sha256(bytes)};
}

async function verifyBrowserRuntime(runtime, sourceSpec, config) {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({
    viewport: {
      width: sourceSpec.timeline.stage.width,
      height: sourceSpec.timeline.stage.height,
    },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  const unexpectedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("data:") && url !== "about:blank") {
      unexpectedRequests.push(url);
    }
  });
  try {
    await page.setContent(
      `<canvas id="stage" width="${sourceSpec.timeline.stage.width}" height="${sourceSpec.timeline.stage.height}"></canvas>`,
    );
    await page.addScriptTag({content: runtime});
    const domains = [];
    for (const pathConfig of config.paths) {
      const frameRows = [];
      for (let frame = 1; frame <= pathConfig.targetFrameCount; frame += 1) {
        const stateId = targetStateId(
          pathConfig,
          `target-frame-${String(frame).padStart(3, "0")}`,
        );
        frameRows.push({frame, stateId, ...await pngHash(page, config, stateId)});
      }
      const hiddenStateId = targetStateId(pathConfig, "target-hidden");
      const translatedStateId = targetStateId(
        pathConfig,
        "target-translated-probe",
      );
      const [hiddenProbe, translatedProbe] = await Promise.all([
        pngHash(page, config, hiddenStateId),
        pngHash(page, config, translatedStateId),
      ]);
      const visibleFrameRows = frameRows.filter(
        ({pngSha256}) => pngSha256 !== hiddenProbe.pngSha256,
      );
      const anchorFrame = pathConfig.anchorFrame ?? visibleFrameRows[0]?.frame;
      const anchorRow = frameRows[anchorFrame - 1];
      const expectedObservable =
        pathConfig.expectedSourcePositionObservable !== false;
      if (expectedObservable) {
        invariant(
          visibleFrameRows.length >= 1
            && anchorRow?.pngSha256 !== hiddenProbe.pngSha256,
          `${config.animationId}/${pathConfig.targetTimelineId}: no source-position-observable parent frame was found`,
        );
      } else {
        invariant(
          visibleFrameRows.length === 0 && anchorFrame === undefined,
          `${config.animationId}/${pathConfig.targetTimelineId}: nonvisual disposition became source-position observable`,
        );
      }
      domains.push({
        frameDomainId: pathConfig.targetTimelineId,
        frameCount: pathConfig.targetFrameCount,
        anchorFrame,
        sourcePositionObservableFrameCount: visibleFrameRows.length,
        disposition: expectedObservable
          ? "source-position-observable-current-js-candidate"
          : "no-source-position-observable-visual-frame",
        sourcePositionObservableAtAnchor: expectedObservable,
        uniqueFullStageVisualCount: new Set(
          frameRows.map(({pngSha256}) => pngSha256),
        ).size,
        frameRows,
        hiddenProbe: {stateId: hiddenStateId, ...hiddenProbe},
        translatedProbe: {stateId: translatedStateId, ...translatedProbe},
      });
    }
    invariant(
      consoleErrors.length === 0 && unexpectedRequests.length === 0,
      `${config.animationId}: browser verification emitted errors or requests`,
    );
    return {domains, consoleErrors, unexpectedRequests};
  } finally {
    await page.close();
    await browser.close();
  }
}

async function buildAsset({
  config,
  generatorRecord,
  safeBuilderRecord,
  sharedContractBuilderRecord,
}) {
  const candidateSpecPath =
    `migrations/${config.animationId}/audit/source-static-current-js-candidate-spec.json`;
  const coveragePath =
    `migrations/${config.animationId}/evidence/full-frame-coverage.json`;
  const frameDispositionPath =
    `migrations/${config.animationId}/audit/frame-domain-disposition.json`;
  const [candidateSpecRecord, coverageRecord, frameDispositionRecord] =
    await Promise.all([
      record(candidateSpecPath),
      record(coveragePath),
      record(frameDispositionPath),
  ]);
  const sourceSpec = JSON.parse(candidateSpecRecord.bytesValue);
  const coverage = JSON.parse(coverageRecord.bytesValue);
  const frameDisposition = JSON.parse(frameDispositionRecord.bytesValue);
  invariant(
    sourceSpec.animationId === config.animationId
      && sourceSpec.timeline?.local?.frameDomain === config.mainFrameDomainId
      && sourceSpec.timeline?.local?.frameCount === config.mainFrameCount
      && sourceSpec.ffdec?.targetSpriteObjectId
        === Number(config.mainFrameDomainId.replace("sprite-", "")),
    `${config.animationId}: source-static candidate spec drifted`,
  );
  const sourceSwfRecord = await record(sourceSpec.source.swf.path);
  exactBinding(
    binding(sourceSwfRecord),
    sourceSpec.source.swf,
    `${config.animationId} source SWF`,
  );
  const requirementBindings = config.paths.map((pathConfig) => {
    const sourcePlacementPath = validatePlacementPath(
      frameDisposition,
      config,
      pathConfig,
    );
    return {
      ...validateCoverageRequirement(
        coverage,
        config,
        pathConfig,
        sourcePlacementPath,
      ),
      sourcePlacementPath,
    };
  });
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), `help-math-${config.assetKey}-`),
  );
  try {
    const fresh = await freshExport(sourceSpec, config, temporaryRoot);
    const contract = buildParentCompositeContract(fresh.framesHtml, config);
    invariant(contract.contractId === config.contractId, `${config.animationId}: contract ID drifted`);
    const outputs = outputPaths(config);
    const spec = adapterSpec(sourceSpec, config, contract, outputs);
    const built = buildSafeRuntime({
      helperSource: fresh.helper,
      framesHtml: fresh.framesHtml,
      spec,
    });
    const browserEvidence = await verifyBrowserRuntime(
      built.runtime,
      sourceSpec,
      config,
    );
    const runtimeBytes = Buffer.from(built.runtime);
    const runtimeBinding = {
      path: outputs.runtime,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
    };
    const manifest = {
      schemaVersion: 1,
      artifactType: "g4-l3-source-natural-parent-composite-candidate",
      animationId: config.animationId,
      assetKey: config.assetKey,
      sourceSwf: binding(sourceSwfRecord),
      generator: binding(generatorRecord),
      safeCanvasBuilder: binding(safeBuilderRecord),
      sharedBehaviorContractBuilder: binding(sharedContractBuilderRecord),
      sourceStaticCandidateSpec: binding(candidateSpecRecord),
      sourceFrameDomainDisposition: binding(frameDispositionRecord),
      coverageRequirementIdentity: {
        projection: "natural-parent-composite-requirement-identities-v1",
        sha256: sha256(Buffer.from(canonicalJson(requirementBindings))),
      },
      runtime: runtimeBinding,
      contract: {
        contractId: contract.contractId,
        sourceContractFingerprintSha256:
          contract.sourceContractFingerprintSha256,
        mainFrameDomainId: config.mainFrameDomainId,
        mainFrame: config.mainFrame,
        requirements: requirementBindings,
        domains: config.paths.map((pathConfig) => ({
          frameDomainId: pathConfig.targetTimelineId,
          frameCount: pathConfig.targetFrameCount,
          stateIds: Array.from(
            {length: pathConfig.targetFrameCount},
            (_, index) => targetStateId(
              pathConfig,
              `target-frame-${String(index + 1).padStart(3, "0")}`,
            ),
          ),
        })),
      },
      browserEvidence,
      authority:
        "source-static natural parent-composite Current-JS engineering candidate only; no AVM1, original runtime, fidelity, audio, human, or Owner acceptance",
      acceptance: {
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      },
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(pretty(manifest));
    return {
      config,
      outputs,
      runtimeBytes,
      manifestBytes,
      summary: {
        animationId: config.animationId,
        assetKey: config.assetKey,
        sourceSwf: binding(sourceSwfRecord),
        runtime: runtimeBinding,
        manifest: {
          path: outputs.manifest,
          bytes: manifestBytes.length,
          sha256: sha256(manifestBytes),
        },
        domainCount: config.paths.length,
        sourceVisibleDomainCount: browserEvidence.domains.filter(
          ({sourcePositionObservableAtAnchor}) =>
            sourcePositionObservableAtAnchor,
        ).length,
        nonvisualDomainCount: browserEvidence.domains.filter(
          ({sourcePositionObservableAtAnchor}) =>
            !sourcePositionObservableAtAnchor,
        ).length,
        frameIdentityCount: config.paths.reduce(
          (sum, pathConfig) => sum + pathConfig.targetFrameCount,
          0,
        ),
        fullStageUniqueVisualCount: browserEvidence.domains.reduce(
          (sum, domain) => sum + domain.uniqueFullStageVisualCount,
          0,
        ),
        requirements: requirementBindings,
        browserConsoleErrors: browserEvidence.consoleErrors.length,
        unexpectedNetworkRequests: browserEvidence.unexpectedRequests.length,
        acceptance: manifest.acceptance,
        strictAcceptanceEffect: "none",
      },
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function markdown(report) {
  const rows = report.assets.map((asset) =>
    `| \`${asset.animationId}\` | ${asset.domainCount} | ${asset.frameIdentityCount} | ${asset.fullStageUniqueVisualCount} | \`${asset.runtime.sha256}\` |`,
  ).join("\n");
  return `# G4 L3 natural parent-composite generated assets\n\n`
    + `This bounded batch deterministically rebuilds **${report.summary.assetCount}** source-bound Canvas assets for **${report.summary.domainCount}** direct parent domains and **${report.summary.frameIdentityCount}** exact parent-frame identities.\n\n`
    + `| Animation | Parent domains | Frame identities | Path-local unique visuals | Runtime SHA-256 |\n`
    + `|---|---:|---:|---:|---|\n${rows}\n\n`
    + "These are Current-JS engineering assets only. The source parent frame is advanced in its exact main-domain placement, but no AVM1 or authoritative original runtime is executed. Fidelity, audio listening, human review, Owner acceptance, strict completion, release, and publication remain closed.\n";
}

async function buildArtifacts() {
  const [generatorRecord, safeBuilderRecord, sharedContractBuilderRecord] =
    await Promise.all([
    record(path.relative(ROOT, SCRIPT_PATH)),
    record(SAFE_BUILDER_PATH),
    record(SHARED_CONTRACT_BUILDER_PATH),
  ]);
  const assets = [];
  for (const config of NATURAL_PARENT_COMPOSITE_CONFIGS) {
    assets.push(await buildAsset({
      config,
      generatorRecord,
      safeBuilderRecord,
      sharedContractBuilderRecord,
    }));
  }
  const summary = {
    assetCount: assets.length,
    animationCount: new Set(assets.map(({config}) => config.animationId)).size,
    domainCount: assets.reduce(
      (sum, asset) => sum + asset.summary.domainCount,
      0,
    ),
    sourceVisibleDomainCount: assets.reduce(
      (sum, asset) => sum + asset.summary.sourceVisibleDomainCount,
      0,
    ),
    nonvisualDomainCount: assets.reduce(
      (sum, asset) => sum + asset.summary.nonvisualDomainCount,
      0,
    ),
    frameIdentityCount: assets.reduce(
      (sum, asset) => sum + asset.summary.frameIdentityCount,
      0,
    ),
    fullStageUniqueVisualCount: assets.reduce(
      (sum, asset) => sum + asset.summary.fullStageUniqueVisualCount,
      0,
    ),
    authoritativeRuntimeSessions: 0,
    fidelityAcceptances: 0,
    audioAcceptances: 0,
    humanDecisions: 0,
    ownerDecisions: 0,
    strictCompletions: 0,
  };
  invariant(
    summary.assetCount === 9
      && summary.animationCount === 3
      && summary.domainCount === 32
      && summary.sourceVisibleDomainCount === 30
      && summary.nonvisualDomainCount === 2
      && summary.frameIdentityCount === 1037,
    "Natural parent-composite batch denominator drifted",
  );
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-natural-parent-composite-generated-assets",
    generator: binding(generatorRecord),
    safeCanvasBuilder: binding(safeBuilderRecord),
    sharedBehaviorContractBuilder: binding(sharedContractBuilderRecord),
    assets: assets.map(({summary: assetSummary}) => assetSummary),
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
    strictAcceptanceEffect: "none",
  };
  return {
    assets,
    report,
    reportBytes: Buffer.from(pretty(report)),
    markdownBytes: Buffer.from(markdown(report)),
  };
}

async function publishGenerated(outputs) {
  for (const {relativePath, bytes} of outputs) {
    const absolute = projectPath(relativePath);
    await mkdir(path.dirname(absolute), {recursive: true});
    const existing = await record(relativePath).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (existing?.bytesValue.equals(bytes)) continue;
    const temporary = `${absolute}.pending-${process.pid}`;
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, absolute);
  }
}

async function checkOutputs(outputs) {
  for (const {relativePath, bytes} of outputs) {
    const existing = await record(relativePath);
    invariant(existing.bytesValue.equals(bytes), `${relativePath} is stale`);
  }
}

export async function run({write = false} = {}) {
  const artifacts = await buildArtifacts();
  const outputs = [
    ...artifacts.assets.flatMap((asset) => [
      {relativePath: asset.outputs.runtime, bytes: asset.runtimeBytes},
      {relativePath: asset.outputs.manifest, bytes: asset.manifestBytes},
    ]),
    {relativePath: REPORT_PATH, bytes: artifacts.reportBytes},
    {relativePath: MARKDOWN_PATH, bytes: artifacts.markdownBytes},
  ];
  if (write) await publishGenerated(outputs);
  else await checkOutputs(outputs);
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
      `PASS: ${report.summary.assetCount} natural parent-composite assets / ${report.summary.domainCount} domains / ${report.summary.frameIdentityCount} frames; strict completion 0.\n`,
    );
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
