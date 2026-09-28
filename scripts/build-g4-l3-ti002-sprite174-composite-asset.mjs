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

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ti-002";
const ASSET_KEY = "course-g04-l03-ti-002-sprite-174-composite";
const TARGET_TIMELINE_ID = "sprite-174";
const CONTRACT_ID = "g04-l03-ti-002-parent-composite-observability-v1";
const MAIN_FRAME = 238;
const TARGET_FRAME_COUNT = 10;
const CANDIDATE_SPEC_PATH = `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
const ROOT_ENTRY_AUDIT_PATH = "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const OBSERVABILITY_AUDIT_PATH = "reports/g4-l3-parent-composite-observability-audit.json";
const SAFE_BUILDER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const OUTPUT_ROOT = `public/flash-assets/courses/${ASSET_KEY}`;
const RUNTIME_PATH = `${OUTPUT_ROOT}/canvas-renderer.js`;
const MANIFEST_PATH = `${OUTPUT_ROOT}/manifest.json`;
const REPORT_PATH = "reports/g4-l3-ti002-sprite174-composite-asset.json";
const MARKDOWN_PATH = "reports/g4-l3-ti002-sprite174-composite-asset.md";
const FFDEC_PATH = "/opt/homebrew/bin/ffdec";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function pretty(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    "project-relative path is required");
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`), `${relativePath} escapes the project root`);
  return absolute;
}

async function record(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytesValue = await readFile(absolute);
  return {path: relativePath, bytes: bytesValue.length, sha256: sha256(bytesValue), bytesValue};
}

function binding(fileRecord) {
  return {path: fileRecord.path, bytes: fileRecord.bytes, sha256: fileRecord.sha256};
}

function exactBinding(actual, expected, label) {
  invariant(actual.path === expected?.path && actual.bytes === expected?.bytes && actual.sha256 === expected?.sha256,
    `${label} binding drifted`);
}

function functionFacts(framesHtml, functionName) {
  const expectedPlacementCount = [...framesHtml.matchAll(new RegExp(`place\\(\"${functionName}\"`, "g"))].length;
  const header = framesHtml.match(new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = (\\d+);`,
  ));
  invariant(expectedPlacementCount > 0 && header, `${functionName}: FFDec function evidence is incomplete`);
  return {
    objectId: Number(functionName.replace("sprite", "")),
    frameCount: Number(header[1]),
    expectedPlacementCount,
  };
}

function behaviorState({stateId, targetFrame = null, hidden = false, translated = false}) {
  return {
    stateId,
    allowedLocalFrames: [MAIN_FRAME],
    hiddenFunctions: hidden ? ["sprite174"] : [],
    forceOpaqueFunctions: [],
    frameOverrides: {
      sprite175: 1,
      ...(targetFrame === null ? {} : {sprite174: targetFrame}),
    },
    translationOverrides: translated ? {sprite174: {x: 200, y: 200}} : {},
    dynamicTextOverrides: {},
    rgbOverrides: {},
  };
}

export function buildTi002CompositeContract(framesHtml) {
  const states = Array.from({length: TARGET_FRAME_COUNT}, (_, frame) => behaviorState({
    stateId: `p01-target-frame-${String(frame + 1).padStart(3, "0")}`,
    targetFrame: frame,
  }));
  states.push(behaviorState({stateId: "p01-target-hidden", hidden: true}));
  states.push(behaviorState({
    stateId: "p01-target-translated-probe",
    targetFrame: 0,
    translated: true,
  }));
  const core = {
    contractId: CONTRACT_ID,
    requiredByCandidateSession: true,
    states,
    functionEvidence: {
      sprite174: functionFacts(framesHtml, "sprite174"),
      sprite175: functionFacts(framesHtml, "sprite175"),
    },
    dynamicTextFields: {},
  };
  return {...core, sourceContractFingerprintSha256: sha256(Buffer.from(canonicalJson(core)))};
}

function adapterSpec(sourceSpec, contract) {
  return {
    schemaVersion: 1,
    animationId: ASSET_KEY,
    classification: "source-static-current-javascript-engineering-candidate-only",
    source: {swf: sourceSpec.source.swf.path, swfSha256: sourceSpec.source.swf.sha256},
    evidence: {
      scenarioInventorySha256: sourceSpec.evidence.sourceAudit.sha256,
      audioAuditSha256: (sourceSpec.evidence.authoringAudit ?? sourceSpec.evidence.sourceAudit).sha256,
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
      seedMapping: "no-randomness-injected-into-source-static-sprite174-composite",
      blockedLocalFrameRanges: [],
      unresolved: [
        "This renderer pins the source parent to sprite-272 frame 238 and sprite-175 frame 2, then applies one explicit sprite-174 frame override; it never executes AVM1 or proves natural runtime reachability.",
        "The source-static audit observes four unique full-stage visuals across ten target frames; identical hashes remain distinct source frame identities rather than inferred runtime equivalence.",
        "Spanish visual, audio, original-runtime fidelity, human review, Owner acceptance, strict completion, release, and publication remain closed.",
      ],
      prebindingTargetFrameDomainDisposition:
        "sprite-174 requires an exact source behavior-composite state",
      currentCanonicalFrameDomainDispositionAsserted: false,
      sourceBehaviorComposite: contract,
    },
    output: {
      script: RUNTIME_PATH,
      manifest: MANIFEST_PATH,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

async function freshExport(sourceSpec, temporaryRoot) {
  const result = await execFileAsync(FFDEC_PATH, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(sourceSpec.ffdec.targetSpriteObjectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    temporaryRoot,
    projectPath(sourceSpec.source.swf.path),
  ], {cwd: ROOT, encoding: "utf8", timeout: 180_000, maxBuffer: 64 * 1024 * 1024});
  invariant(`${result.stdout}\n${result.stderr}`.includes("JPEXS Free Flash Decompiler v.26.2.1"),
    "FFDec version drifted");
  const exportRoot = path.join(temporaryRoot, `DefineSprite_${sourceSpec.ffdec.targetSpriteObjectId}`);
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportRoot, "canvas.js")),
    readFile(path.join(exportRoot, "frames.html")),
  ]);
  invariant(helper.length === sourceSpec.ffdec.helper.bytes && sha256(helper) === sourceSpec.ffdec.helper.sha256,
    "Fresh FFDec helper drifted");
  invariant(frames.length === sourceSpec.ffdec.framesHtml.bytes && sha256(frames) === sourceSpec.ffdec.framesHtml.sha256,
    "Fresh FFDec frames export drifted");
  return {helper: helper.toString("utf8"), framesHtml: frames.toString("utf8")};
}

async function pngHash(page, stateId) {
  const dataUrl = await page.evaluate(async ({assetKey, contractId, stateId}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[assetKey];
    if (!asset) throw new Error(`Missing composite asset ${assetKey}`);
    const canvas = document.getElementById("stage");
    await asset.ready();
    const state = asset.renderComposite(canvas, {
      frame: 238,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: contractId,
      behaviorCompositeState: stateId,
    });
    if (state.behaviorCompositeContractId !== contractId
      || state.behaviorCompositeState !== stateId || state.audioRendered !== false) {
      throw new Error(`Composite identity mismatch for ${stateId}`);
    }
    return canvas.toDataURL("image/png");
  }, {assetKey: ASSET_KEY, contractId: CONTRACT_ID, stateId});
  const bytes = Buffer.from(dataUrl.split(",", 2)[1], "base64");
  return {pngBytes: bytes.length, pngSha256: sha256(bytes)};
}

async function verifyBrowserRuntime(runtime, expectedPath) {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});
  const consoleErrors = [];
  const unexpectedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("data:") && url !== "about:blank") unexpectedRequests.push(url);
  });
  try {
    await page.setContent('<canvas id="stage" width="800" height="600"></canvas>');
    await page.addScriptTag({content: runtime});
    const frameRows = [];
    for (let frame = 1; frame <= TARGET_FRAME_COUNT; frame += 1) {
      const stateId = `p01-target-frame-${String(frame).padStart(3, "0")}`;
      frameRows.push({frame, stateId, ...await pngHash(page, stateId)});
    }
    const [hiddenProbe, translatedProbe] = await Promise.all([
      pngHash(page, "p01-target-hidden"),
      pngHash(page, "p01-target-translated-probe"),
    ]);
    invariant(pretty(frameRows.map(({frame, pngBytes, pngSha256}) => ({frame, pngBytes, pngSha256})))
      === pretty(expectedPath.frameRows.map(({frame, pngBytes, pngSha256}) => ({frame, pngBytes, pngSha256}))),
    "Generated target-frame PNG hashes differ from the observability audit");
    invariant(hiddenProbe.pngBytes === expectedPath.hiddenProbe.pngBytes
      && hiddenProbe.pngSha256 === expectedPath.hiddenProbe.pngSha256
      && translatedProbe.pngBytes === expectedPath.translatedProbe.pngBytes
      && translatedProbe.pngSha256 === expectedPath.translatedProbe.pngSha256,
    "Generated negative-probe hashes differ from the observability audit");
    invariant(consoleErrors.length === 0 && unexpectedRequests.length === 0,
      "Generated composite browser verification emitted errors or requests");
    return {
      frameRows,
      hiddenProbe: {stateId: "p01-target-hidden", ...hiddenProbe},
      translatedProbe: {stateId: "p01-target-translated-probe", ...translatedProbe},
      uniqueTargetVisualCount: new Set(frameRows.map(({pngSha256}) => pngSha256)).size,
      consoleErrors,
      unexpectedRequests,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

async function buildArtifacts() {
  const [candidateSpecRecord, rootAuditRecord, observabilityRecord, generatorRecord, safeBuilderRecord] = await Promise.all([
    record(CANDIDATE_SPEC_PATH),
    record(ROOT_ENTRY_AUDIT_PATH),
    record(OBSERVABILITY_AUDIT_PATH),
    record(path.relative(ROOT, SCRIPT_PATH)),
    record(SAFE_BUILDER_PATH),
  ]);
  const sourceSpec = JSON.parse(candidateSpecRecord.bytesValue);
  invariant(sourceSpec.animationId === ANIMATION_ID
    && sourceSpec.ffdec?.targetSpriteObjectId === 272
    && sourceSpec.timeline?.local?.frameDomain === "sprite-272"
    && sourceSpec.timeline.local.frameCount === 254,
  "TI002 source-static candidate spec drifted");
  const sourceSwfRecord = await record(sourceSpec.source.swf.path);
  exactBinding(binding(sourceSwfRecord), sourceSpec.source.swf, "TI002 source SWF");
  const rootAudit = JSON.parse(rootAuditRecord.bytesValue);
  const rootDomain = rootAudit.items.find(({animationId}) => animationId === ANIMATION_ID)
    ?.domains.find(({targetTimelineId}) => targetTimelineId === TARGET_TIMELINE_ID);
  invariant(rootDomain?.pathCount === 1
    && rootDomain.rootEntryFrame === 6
    && rootDomain.placementPaths[0][1].parentFrame === MAIN_FRAME
    && rootDomain.placementPaths[0][2].parentTimelineId === "sprite-175"
    && rootDomain.placementPaths[0][2].parentFrame === 2,
  "TI002 sprite-174 source placement path drifted");
  const observability = JSON.parse(observabilityRecord.bytesValue);
  const expectedPath = observability.items.find(({animationId}) => animationId === ANIMATION_ID)
    ?.domains.find(({targetTimelineId}) => targetTimelineId === TARGET_TIMELINE_ID)
    ?.paths.find(({pathIndex}) => pathIndex === 1);
  invariant(expectedPath?.classification === "source-static-parent-composite-multiframe-candidate"
    && expectedPath.mainFrame === MAIN_FRAME
    && expectedPath.targetFrameCount === TARGET_FRAME_COUNT
    && expectedPath.uniqueTargetVisualCount === 4
    && expectedPath.overrideMechanismObservable === true
    && expectedPath.sourcePositionObservable === true,
  "TI002 sprite-174 observability decision drifted");

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "help-math-ti002-sprite174-composite-"));
  try {
    const fresh = await freshExport(sourceSpec, temporaryRoot);
    const contract = buildTi002CompositeContract(fresh.framesHtml);
    invariant(contract.contractId === CONTRACT_ID,
      "TI002 behavior-composite contract ID drifted");
    const spec = adapterSpec(sourceSpec, contract);
    const built = buildSafeRuntime({helperSource: fresh.helper, framesHtml: fresh.framesHtml, spec});
    const browserEvidence = await verifyBrowserRuntime(built.runtime, expectedPath);
    invariant(browserEvidence.uniqueTargetVisualCount === 4, "TI002 composite unique visual count drifted");
    const runtimeBytes = Buffer.from(built.runtime);
    const runtimeBinding = {path: RUNTIME_PATH, bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)};
    const manifest = {
      schemaVersion: 1,
      artifactType: "g4-l3-ti002-sprite174-source-behavior-composite-candidate",
      animationId: ANIMATION_ID,
      assetKey: ASSET_KEY,
      targetTimelineId: TARGET_TIMELINE_ID,
      sourceSwf: binding(sourceSwfRecord),
      generator: binding(generatorRecord),
      safeCanvasBuilder: binding(safeBuilderRecord),
      sourceStaticCandidateSpec: binding(candidateSpecRecord),
      sourceRootEntryPlacementAudit: binding(rootAuditRecord),
      sourceParentCompositeObservabilityAudit: binding(observabilityRecord),
      runtime: runtimeBinding,
      contract: {
        contractId: contract.contractId,
        sourceContractFingerprintSha256: contract.sourceContractFingerprintSha256,
        mainFrameDomainId: "sprite-272",
        mainFrame: MAIN_FRAME,
        intermediateFrameOverrides: {sprite175: 1},
        targetFrameCount: TARGET_FRAME_COUNT,
        targetStateIds: contract.states.slice(0, TARGET_FRAME_COUNT).map(({stateId}) => stateId),
      },
      browserEvidence,
      authority: "source-static parent-composite engineering candidate only; no AVM1, original runtime, fidelity, audio, human, or Owner acceptance",
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
    const report = {
      schemaVersion: 1,
      reportType: "g4-l3-ti002-sprite174-composite-asset",
      generator: binding(generatorRecord),
      safeCanvasBuilder: binding(safeBuilderRecord),
      sourceStaticCandidateSpec: binding(candidateSpecRecord),
      sourceRootEntryPlacementAudit: binding(rootAuditRecord),
      sourceParentCompositeObservabilityAudit: binding(observabilityRecord),
      outputs: {
        runtime: runtimeBinding,
        manifest: {path: MANIFEST_PATH, bytes: manifestBytes.length, sha256: sha256(manifestBytes)},
      },
      summary: {
        targetFrameCount: TARGET_FRAME_COUNT,
        uniqueTargetVisualCount: browserEvidence.uniqueTargetVisualCount,
        browserConsoleErrors: 0,
        unexpectedNetworkRequests: 0,
        authoritativeRuntimeSessions: 0,
        fidelityAcceptances: 0,
        audioAcceptances: 0,
        humanDecisions: 0,
        strictCompletions: 0,
      },
      acceptance: manifest.acceptance,
      strictAcceptanceEffect: "none; generated source-static engineering asset only",
    };
    return {
      runtimeBytes,
      manifestBytes,
      report,
      reportBytes: Buffer.from(pretty(report)),
      markdownBytes: Buffer.from(markdown(report)),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function markdown(report) {
  return `# G4 L3 TI002 sprite-174 behavior-composite asset\n\n`
    + `The generated secondary Canvas asset exposes **${report.summary.targetFrameCount}** exact sprite-174 frame identities inside source parent frame 238 and sprite-175 frame 2. The source-static browser probe observes **${report.summary.uniqueTargetVisualCount}** unique full-stage PNGs.\n\n`
    + `This is a Current-JS engineering asset only. Authoritative runtime, fidelity, audio, human, Owner, strict, and publication acceptance remain closed.\n`;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

export async function run({write = false} = {}) {
  const artifacts = await buildArtifacts();
  if (write) {
    await mkdir(projectPath(OUTPUT_ROOT), {recursive: true});
    await atomicWrite(RUNTIME_PATH, artifacts.runtimeBytes);
    await atomicWrite(MANIFEST_PATH, artifacts.manifestBytes);
    await atomicWrite(REPORT_PATH, artifacts.reportBytes);
    await atomicWrite(MARKDOWN_PATH, artifacts.markdownBytes);
  } else {
    const [runtime, manifest, report, markdownFile] = await Promise.all([
      record(RUNTIME_PATH), record(MANIFEST_PATH), record(REPORT_PATH), record(MARKDOWN_PATH),
    ]);
    invariant(runtime.bytesValue.equals(artifacts.runtimeBytes), "TI002 sprite-174 runtime is stale");
    invariant(manifest.bytesValue.equals(artifacts.manifestBytes), "TI002 sprite-174 manifest is stale");
    invariant(report.bytesValue.equals(artifacts.reportBytes), "TI002 sprite-174 report is stale");
    invariant(markdownFile.bytesValue.equals(artifacts.markdownBytes), "TI002 sprite-174 Markdown is stale");
  }
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
    process.stdout.write(`PASS: TI002 sprite-174 ${report.summary.targetFrameCount} frames / ${report.summary.uniqueTargetVisualCount} unique source-static visuals; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
