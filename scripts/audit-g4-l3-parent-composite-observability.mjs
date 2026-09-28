#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdtemp, readFile, rename, rm, stat, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_AUDIT_PATH = "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const SAFE_BUILDER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const REPORT_PATH = "reports/g4-l3-parent-composite-observability-audit.json";
const MARKDOWN_PATH = "reports/g4-l3-parent-composite-observability-audit.md";
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

function spriteFunction(timelineId) {
  invariant(/^sprite-\d+$/.test(timelineId), `${timelineId}: invalid sprite timeline ID`);
  return timelineId.replace("-", "");
}

export function buildPathProbePlan({placementPath, targetTimelineId, targetFrameCount, pathIndex}) {
  invariant(Array.isArray(placementPath) && placementPath.length >= 2,
    `${targetTimelineId}: placement path must contain root and nested edges`);
  invariant(placementPath[0].parentTimelineId === "root"
    && placementPath.at(-1).childTimelineId === targetTimelineId,
  `${targetTimelineId}: placement path endpoints drifted`);
  for (let index = 1; index < placementPath.length; index += 1) {
    invariant(placementPath[index - 1].childTimelineId === placementPath[index].parentTimelineId,
      `${targetTimelineId}: placement path is discontinuous`);
  }
  invariant(Number.isSafeInteger(targetFrameCount) && targetFrameCount >= 1,
    `${targetTimelineId}: target frame count is invalid`);
  const mainFrameDomainId = placementPath[0].childTimelineId;
  const mainFrame = placementPath[1].parentFrame;
  invariant(Number.isSafeInteger(mainFrame) && mainFrame >= 1,
    `${targetTimelineId}: main parent frame is invalid`);
  const intermediateFrameOverrides = {};
  for (const edge of placementPath.slice(2)) {
    invariant(Number.isSafeInteger(edge.parentFrame) && edge.parentFrame >= 1,
      `${targetTimelineId}: intermediate parent frame is invalid`);
    intermediateFrameOverrides[spriteFunction(edge.parentTimelineId)] = edge.parentFrame - 1;
  }
  const prefix = `p${String(pathIndex + 1).padStart(2, "0")}`;
  const targetFunction = spriteFunction(targetTimelineId);
  return {
    prefix,
    mainFrameDomainId,
    mainFrame,
    targetTimelineId,
    targetFunction,
    targetFrameCount,
    intermediateFrameOverrides: stable(intermediateFrameOverrides),
  };
}

export function classifyProbeHashes({frameHashes, hiddenHash, translatedHash}) {
  invariant(Array.isArray(frameHashes) && frameHashes.length >= 1
    && frameHashes.every((value) => /^[a-f0-9]{64}$/.test(value))
    && /^[a-f0-9]{64}$/.test(hiddenHash)
    && /^[a-f0-9]{64}$/.test(translatedHash),
  "Probe hashes are malformed");
  const visibleHash = frameHashes[0];
  const overrideMechanismObservable = translatedHash !== visibleHash;
  const sourcePositionObservable = hiddenHash !== visibleHash;
  const uniqueTargetVisualCount = new Set(frameHashes).size;
  const classification = !overrideMechanismObservable
    ? "inconclusive-target-dispatch-not-observable"
    : !sourcePositionObservable
      ? "source-position-not-observable-in-static-parent-composite"
      : uniqueTargetVisualCount > 1
        ? "source-static-parent-composite-multiframe-candidate"
        : "source-position-observable-target-frames-visually-identical";
  return {classification, overrideMechanismObservable, sourcePositionObservable, uniqueTargetVisualCount};
}

function functionFacts(framesHtml, functionName) {
  const placementPattern = new RegExp(`place\\(\"${functionName}\"`, "g");
  const expectedPlacementCount = [...framesHtml.matchAll(placementPattern)].length;
  const headerPattern = new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = (\\d+);`,
  );
  const header = framesHtml.match(headerPattern);
  invariant(expectedPlacementCount > 0 && header, `${functionName}: fresh FFDec function evidence is incomplete`);
  return {
    objectId: Number(functionName.replace("sprite", "")),
    frameCount: Number(header[1]),
    expectedPlacementCount,
  };
}

function behaviorState({stateId, mainFrame, frameOverrides, hiddenFunctions = [], translationOverrides = {}}) {
  return {
    stateId,
    allowedLocalFrames: [mainFrame],
    hiddenFunctions,
    forceOpaqueFunctions: [],
    frameOverrides: stable(frameOverrides),
    translationOverrides: stable(translationOverrides),
    dynamicTextOverrides: {},
    rgbOverrides: {},
  };
}

function behaviorContract({animationId, plans, framesHtml}) {
  const states = [];
  const referencedFunctions = new Set();
  for (const plan of plans) {
    Object.keys(plan.intermediateFrameOverrides).forEach((name) => referencedFunctions.add(name));
    referencedFunctions.add(plan.targetFunction);
    for (let frame = 0; frame < plan.targetFrameCount; frame += 1) {
      states.push(behaviorState({
        stateId: `${plan.prefix}-target-frame-${String(frame + 1).padStart(3, "0")}`,
        mainFrame: plan.mainFrame,
        frameOverrides: {...plan.intermediateFrameOverrides, [plan.targetFunction]: frame},
      }));
    }
    states.push(behaviorState({
      stateId: `${plan.prefix}-target-hidden`,
      mainFrame: plan.mainFrame,
      frameOverrides: plan.intermediateFrameOverrides,
      hiddenFunctions: [plan.targetFunction],
    }));
    states.push(behaviorState({
      stateId: `${plan.prefix}-target-translated-probe`,
      mainFrame: plan.mainFrame,
      frameOverrides: {...plan.intermediateFrameOverrides, [plan.targetFunction]: 0},
      translationOverrides: {[plan.targetFunction]: {x: 200, y: 200}},
    }));
  }
  const core = {
    contractId: `${animationId.replace("course-", "")}-parent-composite-observability-v1`,
    requiredByCandidateSession: true,
    states,
    functionEvidence: Object.fromEntries([...referencedFunctions].sort()
      .map((name) => [name, functionFacts(framesHtml, name)])),
    dynamicTextFields: {},
  };
  return {...core, sourceContractFingerprintSha256: sha256(Buffer.from(canonicalJson(core)))};
}

function adapterSpec({sourceSpec, domain, contract}) {
  const key = `${sourceSpec.animationId}-probe-${domain.targetTimelineId.replace("sprite-", "")}`;
  return {
    schemaVersion: 1,
    animationId: key,
    classification: "source-static-parent-composite-observability-probe-only",
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
      seedMapping: "no-randomness-injected-into-source-static-observability-probe",
      blockedLocalFrameRanges: [],
      unresolved: [
        "This probe applies explicit source-static frame overrides only; it never executes AVM1 or establishes natural runtime reachability.",
        "Audio, fidelity, human review, Owner acceptance, strict completion, release, and publication remain closed.",
      ],
      sourceBehaviorComposite: contract,
    },
    output: {
      script: `output/playwright/observability-probe/${key}/canvas-renderer.js`,
      manifest: `output/playwright/observability-probe/${key}/manifest.json`,
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
    `${sourceSpec.animationId}: FFDec version drifted`);
  const exportRoot = path.join(temporaryRoot, `DefineSprite_${sourceSpec.ffdec.targetSpriteObjectId}`);
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportRoot, "canvas.js")),
    readFile(path.join(exportRoot, "frames.html")),
  ]);
  invariant(helper.length === sourceSpec.ffdec.helper.bytes && sha256(helper) === sourceSpec.ffdec.helper.sha256,
    `${sourceSpec.animationId}: fresh FFDec helper drifted`);
  invariant(frames.length === sourceSpec.ffdec.framesHtml.bytes && sha256(frames) === sourceSpec.ffdec.framesHtml.sha256,
    `${sourceSpec.animationId}: fresh FFDec frames export drifted`);
  return {helper: helper.toString("utf8"), framesHtml: frames.toString("utf8")};
}

async function pngHash(page, assetKey, contractId, stateId, mainFrame) {
  const rendered = await page.evaluate(async ({assetKey, contractId, stateId, mainFrame}) => {
    const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[assetKey];
    if (!asset) throw new Error(`Missing observability probe asset: ${assetKey}`);
    const canvas = document.getElementById("stage");
    await asset.ready();
    const state = asset.renderComposite(canvas, {
      frame: mainFrame,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: contractId,
      behaviorCompositeState: stateId,
    });
    return {
      dataUrl: canvas.toDataURL("image/png"),
      behaviorCompositeContractId: state.behaviorCompositeContractId,
      behaviorCompositeState: state.behaviorCompositeState,
      audioRendered: state.audioRendered,
    };
  }, {assetKey, contractId, stateId, mainFrame});
  const bytes = Buffer.from(rendered.dataUrl.split(",", 2)[1], "base64");
  return {
    pngBytes: bytes.length,
    pngSha256: sha256(bytes),
    behaviorCompositeContractId: rendered.behaviorCompositeContractId,
    behaviorCompositeState: rendered.behaviorCompositeState,
    audioRendered: rendered.audioRendered,
  };
}

async function probeDomain(browser, {sourceSpec, domain, plans, helper, framesHtml}) {
  const contract = behaviorContract({animationId: sourceSpec.animationId, plans, framesHtml});
  const spec = adapterSpec({sourceSpec, domain, contract});
  const built = buildSafeRuntime({helperSource: helper, framesHtml, spec});
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
    await page.addScriptTag({content: built.runtime});
    const paths = [];
    for (const plan of plans) {
      const frameRows = [];
      for (let frame = 1; frame <= plan.targetFrameCount; frame += 1) {
        const stateId = `${plan.prefix}-target-frame-${String(frame).padStart(3, "0")}`;
        const hash = await pngHash(page, spec.animationId, contract.contractId, stateId, plan.mainFrame);
        invariant(hash.behaviorCompositeContractId === contract.contractId
          && hash.behaviorCompositeState === stateId && hash.audioRendered === false,
        `${sourceSpec.animationId}/${domain.targetTimelineId}/${stateId}: composite identity drifted`);
        frameRows.push({frame, stateId, pngBytes: hash.pngBytes, pngSha256: hash.pngSha256});
      }
      const hiddenStateId = `${plan.prefix}-target-hidden`;
      const translatedStateId = `${plan.prefix}-target-translated-probe`;
      const [hidden, translated] = await Promise.all([
        pngHash(page, spec.animationId, contract.contractId, hiddenStateId, plan.mainFrame),
        pngHash(page, spec.animationId, contract.contractId, translatedStateId, plan.mainFrame),
      ]);
      const classification = classifyProbeHashes({
        frameHashes: frameRows.map(({pngSha256}) => pngSha256),
        hiddenHash: hidden.pngSha256,
        translatedHash: translated.pngSha256,
      });
      paths.push({
        pathIndex: Number(plan.prefix.slice(1)),
        mainFrameDomainId: plan.mainFrameDomainId,
        mainFrame: plan.mainFrame,
        intermediateFrameOverrides: plan.intermediateFrameOverrides,
        targetFrameCount: plan.targetFrameCount,
        frameRows,
        hiddenProbe: {stateId: hiddenStateId, pngBytes: hidden.pngBytes, pngSha256: hidden.pngSha256},
        translatedProbe: {stateId: translatedStateId, pngBytes: translated.pngBytes, pngSha256: translated.pngSha256},
        ...classification,
      });
    }
    invariant(consoleErrors.length === 0 && unexpectedRequests.length === 0,
      `${sourceSpec.animationId}/${domain.targetTimelineId}: browser probe emitted errors or requests`);
    return {
      targetTimelineId: domain.targetTimelineId,
      targetFrameCount: plans[0].targetFrameCount,
      contractId: contract.contractId,
      contractFingerprintSha256: contract.sourceContractFingerprintSha256,
      runtimeSha256: sha256(Buffer.from(built.runtime)),
      runtimeBytes: Buffer.byteLength(built.runtime),
      pathCount: paths.length,
      paths,
      candidatePathCount: paths.filter(({classification}) =>
        classification === "source-static-parent-composite-multiframe-candidate").length,
      consoleErrors,
      unexpectedRequests,
    };
  } finally {
    await page.close();
  }
}

async function buildReport() {
  const [sourceAuditRecord, generatorRecord, safeBuilderRecord] = await Promise.all([
    record(SOURCE_AUDIT_PATH),
    record(path.relative(ROOT, SCRIPT_PATH)),
    record(SAFE_BUILDER_PATH),
  ]);
  const sourceAudit = JSON.parse(sourceAuditRecord.bytesValue);
  invariant(sourceAudit.schemaVersion === 1
    && sourceAudit.reportType === "g4-l3-unresolved-root-entry-placement-path-audit"
    && sourceAudit.summary?.workspaces === 7
    && sourceAudit.summary?.targetFrameDomains === 17
    && sourceAudit.summary?.simplePlacementPaths === 25
    && sourceAudit.summary?.strictCompletions === 0,
  "Root-entry placement-path audit drifted");

  const browser = await chromium.launch({headless: true});
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "help-math-g4-l3-observability-"));
  const items = [];
  try {
    for (const item of sourceAudit.items) {
      const specPath = `migrations/${item.animationId}/audit/source-static-current-js-candidate-spec.json`;
      const specRecord = await record(specPath);
      const sourceSpec = JSON.parse(specRecord.bytesValue);
      invariant(sourceSpec.animationId === item.animationId
        && sourceSpec.ffdec?.targetSpriteObjectId > 0
        && sourceSpec.timeline?.local?.frameDomain === `sprite-${sourceSpec.ffdec.targetSpriteObjectId}`,
      `${item.animationId}: source-static candidate spec drifted`);
      const sourceSwfRecord = await record(sourceSpec.source.swf.path);
      exactBinding(binding(sourceSwfRecord), sourceSpec.source.swf, `${item.animationId} source SWF`);
      const exportRoot = path.join(temporaryRoot, item.animationId);
      const fresh = await freshExport(sourceSpec, exportRoot);
      const frameCounts = new Map(sourceSpec.timeline.companionDomains.map(({id, frameCount}) => [id, frameCount]));
      const domains = [];
      for (const domain of item.domains) {
        const targetFrameCount = frameCounts.get(domain.targetTimelineId);
        invariant(Number.isSafeInteger(targetFrameCount) && targetFrameCount >= 1,
          `${item.animationId}/${domain.targetTimelineId}: companion frame count drifted`);
        const plans = domain.placementPaths.map((placementPath, pathIndex) => buildPathProbePlan({
          placementPath,
          targetTimelineId: domain.targetTimelineId,
          targetFrameCount,
          pathIndex,
        }));
        invariant(plans.every(({mainFrameDomainId}) => mainFrameDomainId === sourceSpec.timeline.local.frameDomain),
          `${item.animationId}/${domain.targetTimelineId}: source path main domain drifted`);
        domains.push(await probeDomain(browser, {sourceSpec, domain, plans, ...fresh}));
      }
      items.push({
        sequence: item.sequence,
        animationId: item.animationId,
        sourceStaticCandidateSpec: binding(specRecord),
        sourceSwf: binding(sourceSwfRecord),
        freshFfdecExport: {
          targetSpriteObjectId: sourceSpec.ffdec.targetSpriteObjectId,
          helperSha256: sourceSpec.ffdec.helper.sha256,
          framesHtmlSha256: sourceSpec.ffdec.framesHtml.sha256,
        },
        domains,
      });
    }
  } finally {
    await browser.close();
    await rm(temporaryRoot, {recursive: true, force: true});
  }

  const paths = items.flatMap(({domains}) => domains.flatMap(({paths}) => paths));
  const domains = items.flatMap(({domains}) => domains);
  const outcomeCounts = Object.fromEntries([...new Set(paths.map(({classification}) => classification))]
    .sort().map((classification) => [classification, paths.filter((pathRow) => pathRow.classification === classification).length]));
  invariant(items.length === 7 && domains.length === 17 && paths.length === 25,
    "Observability scope drifted");
  return {
    schemaVersion: 1,
    reportType: "g4-l3-parent-composite-observability-audit",
    generator: binding(generatorRecord),
    safeCanvasBuilder: binding(safeBuilderRecord),
    sourceRootEntryPlacementAudit: binding(sourceAuditRecord),
    method: {
      ffdec: "fresh JPEXS 26.2.1 target-sprite Canvas export per workspace",
      renderer: "existing buildSafeRuntime sourceBehaviorComposite frame override, in memory only",
      pixelDigest: "SHA-256 over deterministic 800x600 Canvas PNG bytes at deviceScaleFactor 1",
      probes: ["all target local frames", "target hidden", "target translated to x=200,y=200"],
      decisionRule: "translated must change pixels to prove dispatch; visible must differ from hidden to prove source-position observability; target frames must have more than one visual hash for a multiframe candidate",
      authority: "source-static implementation-planning only; no AVM1 or original runtime executed",
    },
    items,
    summary: {
      workspaces: items.length,
      targetFrameDomains: domains.length,
      placementPaths: paths.length,
      targetFrameProbeCount: paths.reduce((sum, {frameRows}) => sum + frameRows.length, 0),
      candidatePaths: paths.filter(({classification}) => classification === "source-static-parent-composite-multiframe-candidate").length,
      candidateDomains: domains.filter(({candidatePathCount}) => candidatePathCount > 0).length,
      outcomeCounts,
      authoritativeRuntimeSessions: 0,
      fidelityAcceptances: 0,
      audioAcceptances: 0,
      humanDecisions: 0,
      strictCompletions: 0,
    },
    acceptance: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; in-memory source-static observability triage only",
  };
}

function markdown(report) {
  const rows = report.items.flatMap((item) => item.domains.flatMap((domain) =>
    domain.paths.map((pathRow) =>
      `| \`${item.animationId}\` | \`${domain.targetTimelineId}\` | ${pathRow.pathIndex} | ${pathRow.mainFrame} | ${pathRow.targetFrameCount} | ${pathRow.uniqueTargetVisualCount} | \`${pathRow.classification}\` |`)));
  return `# G4 L3 parent-composite observability audit\n\n`
    + `This acceptance-neutral audit tested **${report.summary.targetFrameDomains}** target domains across **${report.summary.placementPaths}** source placement paths. It found **${report.summary.candidatePaths}** source-static multiframe candidate paths across **${report.summary.candidateDomains}** domains.\n\n`
    + `No AVM1 or authoritative original runtime was executed. Fidelity, audio, human, Owner, strict, and publication gates remain closed.\n\n`
    + `| Animation | Target | Path | Main frame | Target frames | Unique visuals | Outcome |\n|---|---:|---:|---:|---:|---:|---|\n`
    + `${rows.join("\n")}\n`;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

export async function run({write = false} = {}) {
  const report = await buildReport();
  const reportBytes = Buffer.from(pretty(report));
  const markdownBytes = Buffer.from(markdown(report));
  if (write) {
    await atomicWrite(REPORT_PATH, reportBytes);
    await atomicWrite(MARKDOWN_PATH, markdownBytes);
  } else {
    const [existingReport, existingMarkdown] = await Promise.all([record(REPORT_PATH), record(MARKDOWN_PATH)]);
    invariant(existingReport.bytesValue.equals(reportBytes), "Parent-composite observability report is stale");
    invariant(existingMarkdown.bytesValue.equals(markdownBytes), "Parent-composite observability Markdown is stale");
  }
  return report;
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.candidatePaths}/${report.summary.placementPaths} parent-composite paths are source-static multiframe candidates; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
