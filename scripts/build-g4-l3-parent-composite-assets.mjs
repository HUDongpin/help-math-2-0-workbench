#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rm, stat, writeFile} from "node:fs/promises";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const FFDEC_PATH = "/opt/homebrew/bin/ffdec";
const ROOT_ENTRY_AUDIT_PATH =
  "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const OBSERVABILITY_AUDIT_PATH =
  "reports/g4-l3-parent-composite-observability-audit.json";
const SAFE_BUILDER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const REPORT_PATH = "reports/g4-l3-parent-composite-assets.json";
const MARKDOWN_PATH = "reports/g4-l3-parent-composite-assets.md";
const CANDIDATE_CLASSIFICATION =
  "source-static-parent-composite-multiframe-candidate";

export const PARENT_COMPOSITE_ASSET_CONFIGS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    assetKey: "course-g04-l03-vb-007-parent-composite",
    mainFrameDomainId: "sprite-271",
    mainFrame: 31,
    mainFrameCount: 69,
    contractId: "g04-l03-vb-007-parent-composite-observability-v1",
    paths: Object.freeze([
      Object.freeze({targetTimelineId: "sprite-142", pathIndex: 2,
        targetFrameCount: 22, uniqueTargetVisualCount: 22,
        intermediateFrameOverrides: Object.freeze({sprite176: 11})}),
      Object.freeze({targetTimelineId: "sprite-166", pathIndex: 1,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite176: 5})}),
      Object.freeze({targetTimelineId: "sprite-166", pathIndex: 2,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite176: 8})}),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    assetKey: "course-g04-l03-in-012-parent-composite",
    mainFrameDomainId: "sprite-228",
    mainFrame: 174,
    mainFrameCount: 215,
    contractId: "g04-l03-in-012-parent-composite-observability-v1",
    paths: Object.freeze([
      Object.freeze({targetTimelineId: "sprite-74", pathIndex: 2,
        targetFrameCount: 22, uniqueTargetVisualCount: 22,
        intermediateFrameOverrides: Object.freeze({sprite108: 11})}),
      Object.freeze({targetTimelineId: "sprite-98", pathIndex: 1,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite108: 5})}),
      Object.freeze({targetTimelineId: "sprite-98", pathIndex: 2,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite108: 8})}),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-gs-002",
    assetKey: "course-g04-l03-gs-002-parent-composite",
    mainFrameDomainId: "sprite-321",
    mainFrame: 428,
    mainFrameCount: 428,
    contractId: "g04-l03-gs-002-parent-composite-observability-v1",
    paths: Object.freeze([
      Object.freeze({targetTimelineId: "sprite-319", pathIndex: 1,
        targetFrameCount: 186, uniqueTargetVisualCount: 103,
        intermediateFrameOverrides: Object.freeze({})}),
    ]),
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    assetKey: "course-g04-l03-ts-007-parent-composite",
    mainFrameDomainId: "sprite-441",
    mainFrame: 679,
    mainFrameCount: 696,
    contractId: "g04-l03-ts-007-parent-composite-observability-v1",
    paths: Object.freeze([
      Object.freeze({targetTimelineId: "sprite-290", pathIndex: 2,
        targetFrameCount: 22, uniqueTargetVisualCount: 21,
        intermediateFrameOverrides: Object.freeze({sprite324: 11})}),
      Object.freeze({targetTimelineId: "sprite-314", pathIndex: 1,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite324: 5})}),
      Object.freeze({targetTimelineId: "sprite-314", pathIndex: 2,
        targetFrameCount: 19, uniqueTargetVisualCount: 19,
        intermediateFrameOverrides: Object.freeze({sprite324: 8})}),
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
    typeof relativePath === "string"
      && relativePath.length > 0
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

function statePrefix(pathIndex) {
  return `p${String(pathIndex).padStart(2, "0")}`;
}

function targetStateId(pathConfig, suffix) {
  return `${functionName(pathConfig.targetTimelineId)}-${statePrefix(pathConfig.pathIndex)}-${suffix}`;
}

function functionFacts(framesHtml, name) {
  const expectedPlacementCount = [
    ...framesHtml.matchAll(new RegExp(`place\\(\"${name}\"`, "g")),
  ].length;
  const header = framesHtml.match(new RegExp(
    `function\\s+${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = (\\d+);`,
  ));
  invariant(
    expectedPlacementCount > 0 && header,
    `${name}: FFDec function evidence is incomplete`,
  );
  return {
    objectId: Number(name.replace("sprite", "")),
    frameCount: Number(header[1]),
    expectedPlacementCount,
  };
}

function behaviorState(config, pathConfig, {
  suffix,
  targetFrame = null,
  hidden = false,
  translated = false,
}) {
  const targetFunction = functionName(pathConfig.targetTimelineId);
  return {
    stateId: targetStateId(pathConfig, suffix),
    allowedLocalFrames: [config.mainFrame],
    hiddenFunctions: hidden ? [targetFunction] : [],
    forceOpaqueFunctions: [],
    frameOverrides: {
      ...pathConfig.intermediateFrameOverrides,
      ...(targetFrame === null ? {} : {[targetFunction]: targetFrame}),
    },
    translationOverrides: translated
      ? {[targetFunction]: {x: 200, y: 200}}
      : {},
    dynamicTextOverrides: {},
    rgbOverrides: {},
  };
}

export function buildParentCompositeContract(framesHtml, config) {
  const states = [];
  for (const pathConfig of config.paths) {
    for (let frame = 0; frame < pathConfig.targetFrameCount; frame += 1) {
      states.push(behaviorState(config, pathConfig, {
        suffix: `target-frame-${String(frame + 1).padStart(3, "0")}`,
        targetFrame: frame,
      }));
    }
    states.push(behaviorState(config, pathConfig, {
      suffix: "target-hidden",
      hidden: true,
    }));
    states.push(behaviorState(config, pathConfig, {
      suffix: "target-translated-probe",
      targetFrame: 0,
      translated: true,
    }));
  }
  const functionNames = new Set();
  for (const pathConfig of config.paths) {
    functionNames.add(functionName(pathConfig.targetTimelineId));
    for (const name of Object.keys(pathConfig.intermediateFrameOverrides)) {
      functionNames.add(name);
    }
  }
  const core = {
    contractId: config.contractId,
    requiredByCandidateSession: true,
    states,
    functionEvidence: Object.fromEntries(
      [...functionNames].sort().map((name) => [name, functionFacts(framesHtml, name)]),
    ),
    dynamicTextFields: {},
  };
  return {
    ...core,
    sourceContractFingerprintSha256: sha256(Buffer.from(canonicalJson(core))),
  };
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
  const targetLabels = config.paths.map(
    ({targetTimelineId, pathIndex}) => `${targetTimelineId}/path-${pathIndex}`,
  );
  return {
    schemaVersion: 1,
    animationId: config.assetKey,
    classification: "source-static-current-javascript-engineering-candidate-only",
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
      expectedPlacedFunctionsSha256: sourceSpec.ffdec.expectedPlacedFunctions.sha256,
      embeddedImageVariableCount: sourceSpec.ffdec.expectedEmbeddedImages.count,
      embeddedImageVariablesSha256: sourceSpec.ffdec.expectedEmbeddedImages.sha256,
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
      seedMapping: "no-randomness-injected-into-source-static-parent-composite",
      blockedLocalFrameRanges: [],
      unresolved: [
        `The renderer pins ${config.mainFrameDomainId} frame ${config.mainFrame} and applies only the exact ${targetLabels.join(", ")} frame overrides; it never executes AVM1 or proves natural runtime reachability.`,
        "Identical PNG hashes remain distinct source frame identities rather than inferred runtime equivalence.",
        "Spanish visual, audio, original-runtime fidelity, human review, Owner acceptance, strict completion, release, and publication remain closed.",
      ],
      prebindingTargetFrameDomainDisposition:
        "each candidate path requires an exact source behavior-composite state",
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

async function pngHash(page, config, stateId) {
  const dataUrl = await page.evaluate(async ({assetKey, contractId, frame, stateId}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[assetKey];
    if (!asset) throw new Error(`Missing composite asset ${assetKey}`);
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
      throw new Error(`Composite identity mismatch for ${stateId}`);
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

async function verifyBrowserRuntime(runtime, sourceSpec, config, expectedPaths) {
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
    const pathEvidence = [];
    for (const pathConfig of config.paths) {
      const expectedPath = expectedPaths.get(
        `${pathConfig.targetTimelineId}:${pathConfig.pathIndex}`,
      );
      invariant(expectedPath, `${config.animationId}: expected path disappeared`);
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
      const hiddenProbe = await pngHash(page, config, hiddenStateId);
      const translatedProbe = await pngHash(page, config, translatedStateId);
      invariant(
        pretty(frameRows.map(({frame, pngBytes, pngSha256}) => ({
          frame,
          pngBytes,
          pngSha256,
        }))) === pretty(expectedPath.frameRows.map(
          ({frame, pngBytes, pngSha256}) => ({frame, pngBytes, pngSha256}),
        )),
        `${config.animationId}/${pathConfig.targetTimelineId}/path-${pathConfig.pathIndex}: target-frame PNG hashes differ from the observability audit`,
      );
      invariant(
        hiddenProbe.pngBytes === expectedPath.hiddenProbe.pngBytes
          && hiddenProbe.pngSha256 === expectedPath.hiddenProbe.pngSha256
          && translatedProbe.pngBytes === expectedPath.translatedProbe.pngBytes
          && translatedProbe.pngSha256
            === expectedPath.translatedProbe.pngSha256,
        `${config.animationId}/${pathConfig.targetTimelineId}/path-${pathConfig.pathIndex}: negative-probe hashes differ from the observability audit`,
      );
      const uniqueTargetVisualCount = new Set(
        frameRows.map(({pngSha256}) => pngSha256),
      ).size;
      invariant(
        uniqueTargetVisualCount === pathConfig.uniqueTargetVisualCount,
        `${config.animationId}/${pathConfig.targetTimelineId}/path-${pathConfig.pathIndex}: unique visual count drifted`,
      );
      pathEvidence.push({
        targetTimelineId: pathConfig.targetTimelineId,
        pathIndex: pathConfig.pathIndex,
        targetFrameCount: pathConfig.targetFrameCount,
        uniqueTargetVisualCount,
        frameRows,
        hiddenProbe: {stateId: hiddenStateId, ...hiddenProbe},
        translatedProbe: {stateId: translatedStateId, ...translatedProbe},
      });
    }
    invariant(
      consoleErrors.length === 0 && unexpectedRequests.length === 0,
      `${config.animationId}: generated browser verification emitted errors or requests`,
    );
    return {paths: pathEvidence, consoleErrors, unexpectedRequests};
  } finally {
    await page.close();
    await browser.close();
  }
}

function expectedCandidatePaths(observability, config) {
  const item = observability.items.find(
    ({animationId}) => animationId === config.animationId,
  );
  invariant(item, `${config.animationId}: observability item is missing`);
  const candidates = [];
  for (const domain of item.domains) {
    for (const candidatePath of domain.paths) {
      if (candidatePath.classification === CANDIDATE_CLASSIFICATION) {
        candidates.push({
          targetTimelineId: domain.targetTimelineId,
          contractId: domain.contractId,
          ...candidatePath,
        });
      }
    }
  }
  invariant(
    candidates.length === config.paths.length,
    `${config.animationId}: observable candidate path count drifted`,
  );
  const result = new Map();
  for (const pathConfig of config.paths) {
    const candidatePath = candidates.find(
      (entry) => entry.targetTimelineId === pathConfig.targetTimelineId
        && entry.pathIndex === pathConfig.pathIndex,
    );
    invariant(candidatePath, `${config.animationId}: configured path is absent`);
    invariant(
      candidatePath.contractId === config.contractId
        && candidatePath.mainFrameDomainId === config.mainFrameDomainId
        && candidatePath.mainFrame === config.mainFrame
        && candidatePath.targetFrameCount === pathConfig.targetFrameCount
        && candidatePath.uniqueTargetVisualCount
          === pathConfig.uniqueTargetVisualCount
        && canonicalJson(candidatePath.intermediateFrameOverrides)
          === canonicalJson(pathConfig.intermediateFrameOverrides)
        && candidatePath.overrideMechanismObservable === true
        && candidatePath.sourcePositionObservable === true,
      `${config.animationId}/${pathConfig.targetTimelineId}/path-${pathConfig.pathIndex}: observability decision drifted`,
    );
    result.set(`${pathConfig.targetTimelineId}:${pathConfig.pathIndex}`, candidatePath);
  }
  return result;
}

function verifyRootPlacementPaths(rootAudit, config) {
  const item = rootAudit.items.find(
    ({animationId}) => animationId === config.animationId,
  );
  invariant(item, `${config.animationId}: root placement audit item is missing`);
  for (const pathConfig of config.paths) {
    const domain = item.domains.find(
      ({targetTimelineId}) => targetTimelineId === pathConfig.targetTimelineId,
    );
    const placementPath = domain?.placementPaths?.[pathConfig.pathIndex - 1];
    invariant(
      domain?.rootEntryFrame === 6
        && placementPath?.[0]?.parentTimelineId === "root"
        && placementPath?.[0]?.parentFrame === 6
        && placementPath?.[1]?.parentTimelineId === config.mainFrameDomainId
        && placementPath?.[1]?.parentFrame === config.mainFrame,
      `${config.animationId}/${pathConfig.targetTimelineId}/path-${pathConfig.pathIndex}: root placement path drifted`,
    );
  }
}

async function buildAsset({
  config,
  generatorRecord,
  safeBuilderRecord,
  rootAuditRecord,
  observabilityRecord,
  rootAudit,
  observability,
}) {
  const candidateSpecPath =
    `migrations/${config.animationId}/audit/source-static-current-js-candidate-spec.json`;
  const candidateSpecRecord = await record(candidateSpecPath);
  const sourceSpec = JSON.parse(candidateSpecRecord.bytesValue);
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
  verifyRootPlacementPaths(rootAudit, config);
  const expectedPaths = expectedCandidatePaths(observability, config);
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), `help-math-${config.assetKey}-`),
  );
  try {
    const fresh = await freshExport(sourceSpec, config, temporaryRoot);
    const contract = buildParentCompositeContract(fresh.framesHtml, config);
    invariant(
      contract.contractId === config.contractId,
      `${config.animationId}: behavior-composite contract ID drifted`,
    );
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
      expectedPaths,
    );
    const runtimeBytes = Buffer.from(built.runtime);
    const runtimeBinding = {
      path: outputs.runtime,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
    };
    const manifest = {
      schemaVersion: 1,
      artifactType: "g4-l3-source-parent-composite-candidate",
      animationId: config.animationId,
      assetKey: config.assetKey,
      sourceSwf: binding(sourceSwfRecord),
      generator: binding(generatorRecord),
      safeCanvasBuilder: binding(safeBuilderRecord),
      sourceStaticCandidateSpec: binding(candidateSpecRecord),
      sourceRootEntryPlacementAudit: binding(rootAuditRecord),
      sourceParentCompositeObservabilityAudit: binding(observabilityRecord),
      runtime: runtimeBinding,
      contract: {
        contractId: contract.contractId,
        sourceContractFingerprintSha256:
          contract.sourceContractFingerprintSha256,
        mainFrameDomainId: config.mainFrameDomainId,
        mainFrame: config.mainFrame,
        paths: config.paths.map((pathConfig) => ({
          targetTimelineId: pathConfig.targetTimelineId,
          pathIndex: pathConfig.pathIndex,
          intermediateFrameOverrides:
            pathConfig.intermediateFrameOverrides,
          targetFrameCount: pathConfig.targetFrameCount,
          targetStateIds: Array.from(
            {length: pathConfig.targetFrameCount},
            (_, frame) => targetStateId(
              pathConfig,
              `target-frame-${String(frame + 1).padStart(3, "0")}`,
            ),
          ),
        })),
      },
      browserEvidence,
      authority:
        "source-static parent-composite engineering candidate only; no AVM1, original runtime, fidelity, audio, human, or Owner acceptance",
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
        candidatePathCount: config.paths.length,
        targetFrameIdentityCount: config.paths.reduce(
          (sum, entry) => sum + entry.targetFrameCount,
          0,
        ),
        pathLocalUniqueVisualCount: config.paths.reduce(
          (sum, entry) => sum + entry.uniqueTargetVisualCount,
          0,
        ),
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
    `| \`${asset.animationId}\` | ${asset.candidatePathCount} | ${asset.targetFrameIdentityCount} | ${asset.pathLocalUniqueVisualCount} | \`${asset.runtime.sha256}\` |`,
  ).join("\n");
  return `# G4 L3 parent-composite generated assets\n\n`
    + `This bounded batch deterministically rebuilds **${report.summary.assetCount}** source-bound Canvas assets for **${report.summary.candidatePathCount}** observable placement paths, **${report.summary.targetFrameIdentityCount}** target-frame identities, and **${report.summary.pathLocalUniqueVisualCount}** path-local unique full-stage visuals.\n\n`
    + `| Animation | Paths | Frame identities | Path-local unique visuals | Runtime SHA-256 |\n`
    + `|---|---:|---:|---:|---|\n${rows}\n\n`
    + "These are Current-JS engineering assets only. Authoritative original-runtime evidence, fidelity comparison, audio listening, human review, Owner acceptance, strict completion, release, and publication remain closed.\n";
}

async function buildArtifacts() {
  const [generatorRecord, safeBuilderRecord, rootAuditRecord, observabilityRecord] =
    await Promise.all([
      record(path.relative(ROOT, SCRIPT_PATH)),
      record(SAFE_BUILDER_PATH),
      record(ROOT_ENTRY_AUDIT_PATH),
      record(OBSERVABILITY_AUDIT_PATH),
    ]);
  const rootAudit = JSON.parse(rootAuditRecord.bytesValue);
  const observability = JSON.parse(observabilityRecord.bytesValue);
  const assets = [];
  for (const config of PARENT_COMPOSITE_ASSET_CONFIGS) {
    assets.push(await buildAsset({
      config,
      generatorRecord,
      safeBuilderRecord,
      rootAuditRecord,
      observabilityRecord,
      rootAudit,
      observability,
    }));
  }
  const summary = {
    assetCount: assets.length,
    animationCount: new Set(assets.map(({config}) => config.animationId)).size,
    candidatePathCount: assets.reduce(
      (sum, asset) => sum + asset.summary.candidatePathCount,
      0,
    ),
    targetFrameIdentityCount: assets.reduce(
      (sum, asset) => sum + asset.summary.targetFrameIdentityCount,
      0,
    ),
    pathLocalUniqueVisualCount: assets.reduce(
      (sum, asset) => sum + asset.summary.pathLocalUniqueVisualCount,
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
    canonicalJson(summary) === canonicalJson({
      assetCount: 4,
      animationCount: 4,
      candidatePathCount: 10,
      targetFrameIdentityCount: 366,
      pathLocalUniqueVisualCount: 282,
      authoritativeRuntimeSessions: 0,
      fidelityAcceptances: 0,
      audioAcceptances: 0,
      humanDecisions: 0,
      ownerDecisions: 0,
      strictCompletions: 0,
    }),
    "parent-composite batch denominator drifted",
  );
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-parent-composite-generated-assets",
    generator: binding(generatorRecord),
    safeCanvasBuilder: binding(safeBuilderRecord),
    sourceRootEntryPlacementAudit: binding(rootAuditRecord),
    sourceParentCompositeObservabilityAudit: binding(observabilityRecord),
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

async function publishNoClobber(outputs) {
  const created = [];
  try {
    for (const {relativePath, bytes} of outputs) {
      const absolute = projectPath(relativePath);
      await mkdir(path.dirname(absolute), {recursive: true});
      try {
        await writeFile(absolute, bytes, {flag: "wx", mode: 0o644});
        created.push({relativePath, bytes});
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const existing = await record(relativePath);
        invariant(
          existing.bytesValue.equals(bytes),
          `${relativePath} already exists with different bytes`,
        );
      }
    }
  } catch (error) {
    for (const createdOutput of created.reverse()) {
      const current = await record(createdOutput.relativePath).catch(() => null);
      if (current?.bytesValue.equals(createdOutput.bytes)) {
        await rm(projectPath(createdOutput.relativePath));
      }
    }
    throw error;
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
  if (write) await publishNoClobber(outputs);
  else await checkOutputs(outputs);
  return artifacts.report;
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(
      `PASS: ${report.summary.assetCount} parent-composite assets / ${report.summary.candidatePathCount} paths / ${report.summary.targetFrameIdentityCount} frames; strict completion 0.\n`,
    );
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
