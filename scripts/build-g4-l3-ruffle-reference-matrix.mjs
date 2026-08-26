#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const DEFAULT_JSON = path.join(projectRoot, "reports", "g4-l3-ruffle-reference-matrix.json");
const DEFAULT_MARKDOWN = path.join(projectRoot, "reports", "g4-l3-ruffle-reference-matrix.md");
const WORK_CARDS_PATH = path.join(projectRoot, "reports", "g4-l3-implementation-work-cards.json");
const MACHINE_AUDIT_PATH = path.join(projectRoot, "reports", "g4-l3-machine-source-audits.json");
const CAPACITY_PATH = path.join(projectRoot, "reports", "g4-l3-capture-capacity-readiness.json");
const CATALOG_PATH = path.join(projectRoot, "catalog", "animations.json");
const TOOLCHAIN_PATH = path.join(projectRoot, "catalog", "toolchain.json");
const REFERENCE_PAGE_PATH = path.join(projectRoot, "apps", "web", "app", "[locale]", "reference", "[animationId]", "page.tsx");
const REFERENCE_API_PATH = path.join(projectRoot, "apps", "web", "app", "api", "reference", "[animationId]", "route.ts");
const RUFFLE_API_PATH = path.join(projectRoot, "apps", "web", "app", "api", "ruffle", "[...asset]", "route.ts");
const REFERENCE_PLAYER_PATH = path.join(projectRoot, "apps", "web", "components", "reference-player.tsx");
const DIAGNOSTIC_PROBE_PATH = path.join(projectRoot, "scripts", "probe-g4-l3-ruffle-reference.mjs");
const RUFFLE_ROOT = path.join(projectRoot, "node_modules", "@ruffle-rs", "ruffle");
const DIAGNOSTIC_ROOT = path.join(projectRoot, "output", "playwright", "g4-l3-ruffle-reference-diagnostics");
const REPRESENTATIVE_IDS = Object.freeze([
  "course-g04-l03-ir-001-341242cc",
  "course-g04-l03-in-009",
  "course-g04-l03-gs-002",
  "shell-course-g04-l03-index-local",
]);
const HEX_64 = /^[a-f0-9]{64}$/;

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function resolveProjectFile(relativePath) {
  const absolute = path.resolve(projectRoot, relativePath);
  const back = path.relative(projectRoot, absolute);
  invariant(!back.startsWith("..") && !path.isAbsolute(back), `Path escapes project root: ${relativePath}`);
  return absolute;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function bindFile(filePath) {
  const [metadata, bytes] = await Promise.all([lstat(filePath), readFile(filePath)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${portable(filePath)} must be a regular non-symlink file`);
  return {path: portable(filePath), bytes: bytes.length, sha256: sha256(bytes)};
}

async function bindSource(source) {
  invariant(source?.path?.startsWith(SOURCE_PREFIX), `${source?.path}: source is outside the frozen archive`);
  invariant(Number.isInteger(source.bytes) && source.bytes > 0, `${source.path}: invalid source byte count`);
  invariant(HEX_64.test(source.sha256), `${source.path}: invalid source SHA-256`);
  const absolute = resolveProjectFile(source.path);
  const [metadata, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${source.path}: source must be a regular non-symlink file`);
  invariant(bytes.length === source.bytes, `${source.path}: source byte count drift`);
  invariant(sha256(bytes) === source.sha256, `${source.path}: source SHA-256 drift`);
  return {
    path: source.path,
    bytes: source.bytes,
    sha256: source.sha256,
    physicalHashVerifiedNow: true,
    regularNonSymlinkFile: true,
    servedOnDemandFromFrozenArchive: true,
    copiedIntoWebPublic: false,
  };
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function shellCommand(argv) {
  return argv.map(shellQuote).join(" ");
}

function diagnosticCommand(item, language) {
  const output = `output/playwright/g4-l3-ruffle-reference-diagnostics/${item.animationId}/${language}`;
  const argv = [
    "node",
    "scripts/probe-g4-l3-ruffle-reference.mjs",
    "--base-url",
    "http://127.0.0.1:3104",
    "--animation-id",
    item.animationId,
    "--expected-sha256",
    item.source.swf.sha256,
    "--expected-bytes",
    String(item.source.swf.bytes),
    "--expected-width",
    "800",
    "--expected-height",
    "600",
    "--lang",
    language,
    "--settle-ms",
    "5000",
    "--output",
    output,
  ];
  return {argv, shell: shellCommand(argv), output, executedByMatrixBuilder: false};
}

async function bindRepresentativeDiagnostics(queue) {
  const probe = await bindFile(DIAGNOSTIC_PROBE_PATH);
  const queueById = new Map(queue.map((item) => [item.animationId, item]));
  const records = [];
  for (const animationId of REPRESENTATIVE_IDS) {
    const queueItem = queueById.get(animationId);
    invariant(queueItem, `${animationId}: representative item missing from queue`);
    const directory = path.join(DIAGNOSTIC_ROOT, animationId, "en-5000ms");
    const jsonPath = path.join(directory, "diagnostic.json");
    const screenshotPath = path.join(directory, "diagnostic-stage.png");
    const [jsonBytes, screenshotBytes] = await Promise.all([readFile(jsonPath), readFile(screenshotPath)]);
    const diagnostic = JSON.parse(jsonBytes);
    const screenshot = PNG.sync.read(screenshotBytes);
    invariant(diagnostic.reportType === "g4-l3-ruffle-local-route-load-diagnostic", `${animationId}: unexpected diagnostic type`);
    invariant(diagnostic.animationId === animationId && diagnostic.language === "en", `${animationId}: diagnostic identity drift`);
    invariant(diagnostic.status === "passed-local-route-load-diagnostic", `${animationId}: route-load diagnostic did not pass`);
    invariant(diagnostic.probe?.sha256 === probe.sha256, `${animationId}: diagnostic probe binding is stale`);
    invariant(diagnostic.sourceDiagnostic?.sha256 === queueItem.source.swf.sha256, `${animationId}: diagnostic source hash drift`);
    invariant(diagnostic.sourceDiagnostic?.bytes === queueItem.source.swf.bytes, `${animationId}: diagnostic source bytes drift`);
    invariant(diagnostic.sourceDiagnostic?.exactSourceBytesVerified === true, `${animationId}: exact source response was not verified`);
    invariant(diagnostic.networkDiagnostic?.unexpectedExternalRequests?.length === 0, `${animationId}: external HTTP request escaped the probe`);
    invariant(diagnostic.networkDiagnostic?.allExecutedHttpRequestsExactLoopbackOrigin === true, `${animationId}: loopback network assertion missing`);
    invariant(diagnostic.networkDiagnostic?.blockedRequestsReachedServer === false, `${animationId}: blocked legacy/unallowlisted request reached the server`);
    invariant(diagnostic.pageDiagnostic?.fixedDelayAfterLoadMs === 5000, `${animationId}: representative delay drift`);
    invariant(diagnostic.pageDiagnostic?.exactSourceFrameObserved === null, `${animationId}: diagnostic must not claim a source frame`);
    invariant(diagnostic.screenshot?.sha256 === sha256(screenshotBytes), `${animationId}: screenshot hash drift`);
    invariant(screenshot.width === 800 && screenshot.height === 600, `${animationId}: representative screenshot is not 800x600`);
    invariant(diagnostic.acceptance?.acceptanceNeutral === true && diagnostic.acceptance.strictAcceptanceEffect === false, `${animationId}: diagnostic acceptance boundary drift`);
    const colors = new Set();
    for (let offset = 0; offset < screenshot.data.length; offset += 4) {
      colors.add(screenshot.data.subarray(offset, offset + 4).toString("hex"));
    }
    const failedLocalResponses = diagnostic.networkDiagnostic.responses.filter((response) => response.status >= 400);
    const blockedLocalRequests = diagnostic.networkDiagnostic.blockedLocalRequests;
    records.push({
      animationId,
      sourceSwfSha256: queueItem.source.swf.sha256,
      fixedDelayAfterLoadMs: 5000,
      result: diagnostic.status,
      exactSourceBytesVerified: true,
      ruffleLoadPromiseResolved: diagnostic.pageDiagnostic.ruffleLoadPromiseResolved,
      nativeCanvas: diagnostic.pageDiagnostic.playerState.canvases.some((canvas) => canvas.width === 800 && canvas.height === 600),
      allExecutedHttpRequestsExactLoopbackOrigin: true,
      unexpectedExternalHttpRequestCount: 0,
      blockedLocalRequests,
      blockedLocalRequestCount: blockedLocalRequests.length,
      blockedRequestsReachedServer: false,
      failedLocalResponses,
      consoleErrorCount: diagnostic.browserDiagnostic.consoleMessages.filter((message) => message.type === "error").length,
      pageErrorCount: diagnostic.browserDiagnostic.pageErrors.length,
      json: {path: portable(jsonPath), bytes: jsonBytes.length, sha256: sha256(jsonBytes)},
      screenshot: {
        path: portable(screenshotPath),
        bytes: screenshotBytes.length,
        sha256: sha256(screenshotBytes),
        width: screenshot.width,
        height: screenshot.height,
        uniqueRgbaColorCount: colors.size,
        observation: colors.size === 1
          ? "uniform-background-no-teaching-content-observed"
          : "nonuniform-reference-surface-observed",
        exactSourceFrameBinding: null,
      },
    });
  }
  const shell = records.find((record) => record.animationId === "shell-course-g04-l03-index-local");
  invariant(shell?.failedLocalResponses.length === 0, "Shell representative executed a failed local dependency request");
  invariant(shell?.blockedLocalRequests.length >= 2, "Shell representative did not retain its blocked dependency attempts");
  return {
    probe: {
      ...probe,
      loopbackOriginRequired: true,
      exactSwfResponseHashRequired: true,
      externalHttpAttemptsFailTheProbe: true,
      native800x600PngRequired: true,
      acceptanceNeutralOutputOnly: true,
    },
    selection: {
      animationIds: [...REPRESENTATIVE_IDS],
      language: "en",
      fixedDelayAfterRuffleLoadMs: 5000,
      selectedDiagnosticCount: records.length,
      selectedPngCount: records.length,
      selectedPngBytes: records.reduce((sum, record) => sum + record.screenshot.bytes, 0),
    },
    summary: {
      exactSourceDeliveryPassed: records.filter((record) => record.exactSourceBytesVerified).length,
      localRuffleLoadPassed: records.filter((record) => record.ruffleLoadPromiseResolved).length,
      native800x600CanvasObserved: records.filter((record) => record.nativeCanvas).length,
      exactLoopbackOnlyHttpPassed: records.filter((record) => record.allExecutedHttpRequestsExactLoopbackOrigin).length,
      unexpectedExternalHttpRequests: records.reduce((sum, record) => sum + record.unexpectedExternalHttpRequestCount, 0),
      blockedLocalLegacyOrUnallowlistedRequests: records.reduce((sum, record) => sum + record.blockedLocalRequestCount, 0),
      blockedRequestsReachedServer: records.filter((record) => record.blockedRequestsReachedServer).length,
      uniformBackgroundOnlyScreenshots: records.filter((record) => record.screenshot.uniqueRgbaColorCount === 1).length,
      nonuniformReferenceSurfaces: records.filter((record) => record.screenshot.uniqueRgbaColorCount > 1).length,
      failedLocalDependencyResponses: records.reduce((sum, record) => sum + record.failedLocalResponses.length, 0),
      deterministicSourceFrameBindings: 0,
      authoritativeBaselineEffects: 0,
      strictAcceptanceEffects: 0,
    },
    blockers: [
      {
        id: "standalone-page-host-entry-unresolved",
        affectedAnimationIds: records.filter((record) => record.screenshot.uniqueRgbaColorCount === 1).map((record) => record.animationId),
        observation: "After exact source delivery and five seconds after Ruffle load, each selected page SWF produced one uniform RGBA color and no teaching content.",
        inferenceBoundary: "This is consistent with missing original shell/global/language/entry state, but Ruffle output alone does not prove the cause or the required host contract.",
      },
      {
        id: "shell-relative-dependencies-not-served",
        affectedAnimationIds: ["shell-course-g04-l03-index-local"],
        observation: "The shell rendered a nonuniform course surface. The hardened browser probe intercepted all unallowlisted requests before network execution, including relative dependencies and a legacy telemetry-style POST.",
        blockedLocalRequests: shell.blockedLocalRequests,
        failedLocalResponses: shell.failedLocalResponses,
        safetyBoundary: "No external or unallowlisted legacy request reached the server in the retained run. Do not expose a broad legacy tree; any future local dependency sandbox must be explicit, hash-bound, development-only, and network-denied.",
      },
      {
        id: "no-deterministic-reference-capture-contract",
        affectedAnimationIds: [...REPRESENTATIVE_IDS],
        observation: "The route exposes no source frame, nested domain, host-entry state, language FlashVar, scenario schedule, seed, terminal state, or Replay selector.",
        strictEffect: false,
      },
    ],
    records,
    acceptance: {
      acceptanceNeutral: true,
      statement: "These retained observations prove only exact local source delivery, local Ruffle load, loopback network containment, and diagnostic PNG creation. Blank or visible Ruffle output is forensic compatibility information, not original-runtime behavior or fidelity evidence.",
    },
  };
}

async function ruffleDistributionBinding() {
  const packageJson = await readJson(path.join(RUFFLE_ROOT, "package.json"));
  invariant(packageJson.name === "@ruffle-rs/ruffle", "Unexpected local Ruffle package name");
  invariant(typeof packageJson.version === "string", "Local Ruffle version is missing");
  const names = (await readdir(RUFFLE_ROOT)).sort();
  const files = [];
  for (const name of names) {
    const target = path.join(RUFFLE_ROOT, name);
    const metadata = await lstat(target);
    if (!metadata.isFile() || metadata.isSymbolicLink()) continue;
    files.push(await bindFile(target));
  }
  invariant(files.some((file) => file.path.endsWith("/ruffle.js")), "Local Ruffle distribution has no ruffle.js");
  invariant(files.some((file) => file.path.endsWith(".wasm")), "Local Ruffle distribution has no WASM payload");
  return {
    package: "@ruffle-rs/ruffle",
    version: packageJson.version,
    role: "forensic-reference-only",
    servedOnlyThroughDevelopmentGuardedApi: true,
    files,
    distributionSha256: sha256(Buffer.from(JSON.stringify(files), "utf8")),
  };
}

async function referenceRouteBoundary() {
  const [pageBytes, referenceApiBytes, ruffleApiBytes, playerBytes] = await Promise.all([
    readFile(REFERENCE_PAGE_PATH),
    readFile(REFERENCE_API_PATH),
    readFile(RUFFLE_API_PATH),
    readFile(REFERENCE_PLAYER_PATH),
  ]);
  const page = pageBytes.toString("utf8");
  const referenceApi = referenceApiBytes.toString("utf8");
  const ruffleApi = ruffleApiBytes.toString("utf8");
  const player = playerBytes.toString("utf8");
  for (const [label, source] of [["reference page", page], ["reference SWF API", referenceApi], ["Ruffle asset API", ruffleApi]]) {
    invariant(source.includes("process.env.NODE_ENV === 'production'"), `${label} has no production guard`);
    invariant(source.includes("notFound()"), `${label} does not fail closed in production`);
  }
  invariant(referenceApi.includes("resolveCatalogSource"), "Reference API does not resolve the catalog-bound frozen source");
  invariant(referenceApi.includes("'Cache-Control': 'no-store'"), "Reference API must disable caching");
  invariant(referenceApi.includes("'Content-Type': 'application/x-shockwave-flash'"), "Reference API has no SWF content type");
  invariant(ruffleApi.includes("node_modules/@ruffle-rs/ruffle"), "Ruffle API is not bound to the local package");
  invariant(player.includes("allowNetworking: 'none'"), "Reference player does not disable Ruffle networking");
  invariant(player.includes("allowScriptAccess: false"), "Reference player does not disable script access");
  invariant(player.includes("openUrlMode: 'deny'"), "Reference player does not deny URL opens");
  invariant(!player.includes("frameDomain") && !player.includes("requirementId") && !player.includes("entryStateSha256"), "Reference player unexpectedly claims strict capture identity");

  const webPublicRoot = path.join(projectRoot, "apps", "web", "public");
  const publicEntries = await readdir(webPublicRoot, {recursive: true, withFileTypes: true});
  const publicSwfs = publicEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".swf"))
    .map((entry) => path.join(entry.parentPath, entry.name));
  invariant(publicSwfs.length === 0, "Product web public tree unexpectedly contains SWF files");

  return {
    implementationFiles: [
      {...(await bindFile(REFERENCE_PAGE_PATH)), role: "development-only-local-reference-page"},
      {...(await bindFile(REFERENCE_API_PATH)), role: "development-only-hash-verifiable-source-stream"},
      {...(await bindFile(RUFFLE_API_PATH)), role: "development-only-local-Ruffle-assets"},
      {...(await bindFile(REFERENCE_PLAYER_PATH)), role: "network-denied-forensic-player"},
    ],
    productionExposure: false,
    productionBehavior: "page, SWF API, and Ruffle asset API all fail closed with notFound()",
    sourceDelivery: "catalog-resolved frozen SWF bytes are streamed on demand; no G4 L3 SWF is copied into apps/web/public",
    productWebPublicSwfCount: 0,
    ruffleOptions: {allowNetworking: "none", allowScriptAccess: false, openUrlMode: "deny"},
    frameQueryContract: false,
    scenarioQueryContract: false,
    languageFlashVarContract: false,
    seedQueryContract: false,
    strictCaptureIdentityContract: false,
  };
}

function cardProjection(card) {
  return {
    interactionCandidate: card.signals.interaction.candidate,
    interactionOccurrences: card.signals.interaction.occurrenceCount,
    randomCandidate: card.signals.random.candidate,
    randomOccurrences: card.signals.random.occurrenceCount,
    externalDependencyCandidate: card.signals.external.candidate,
    externalDependencyOccurrences: card.signals.external.occurrenceCount,
    embeddedAudioTagCount: card.signals.embeddedAudio.tagCount,
    externalAudioAssociationCount: card.signals.externalAudioAssociationCount,
  };
}

async function buildQueueItem(card, machineItem, catalogItem) {
  invariant(machineItem?.animationId === card.animationId, `${card.animationId}: missing matching machine audit`);
  invariant(catalogItem?.animationId === card.animationId, `${card.animationId}: missing matching catalog placement`);
  invariant(card.assetId === `swf-${card.source.swf.sha256}`, `${card.animationId}: asset ID/source hash mismatch`);
  invariant(machineItem.assetId === card.assetId && catalogItem.assetId === card.assetId, `${card.animationId}: asset identity drift`);
  invariant(machineItem.source.swf.path === card.source.swf.path, `${card.animationId}: machine-audit source path drift`);
  invariant(machineItem.source.swf.sha256 === card.source.swf.sha256, `${card.animationId}: machine-audit source hash drift`);
  const archiveRelative = card.source.swf.path.slice(SOURCE_PREFIX.length);
  invariant(catalogItem.source.path === archiveRelative, `${card.animationId}: catalog source path drift`);
  invariant(catalogItem.source.sha256 === card.source.swf.sha256, `${card.animationId}: catalog source hash drift`);
  invariant(catalogItem.source.bytes === card.source.swf.bytes, `${card.animationId}: catalog source byte drift`);

  const runtime = card.runtime;
  const machineHeader = machineItem.swf.header;
  const catalogSwf = catalogItem.source.swf;
  invariant(runtime.stage.width === 800 && runtime.stage.height === 600, `${card.animationId}: non-native G4 L3 stage`);
  invariant(runtime.fps === 12, `${card.animationId}: non-12fps runtime`);
  invariant(machineHeader.stage.width === 800 && machineHeader.stage.height === 600, `${card.animationId}: machine stage drift`);
  invariant(machineHeader.fps === 12 && machineHeader.rootFrameCount === runtime.rootFrameCount, `${card.animationId}: machine root facts drift`);
  invariant(catalogSwf.stage.width === 800 && catalogSwf.stage.height === 600, `${card.animationId}: catalog stage drift`);
  invariant(catalogSwf.fps === 12 && catalogSwf.frameCount === runtime.rootFrameCount, `${card.animationId}: catalog root facts drift`);

  const item = {
    queueOrdinal: card.sequence,
    animationId: card.animationId,
    assetId: card.assetId,
    releaseRole: card.releaseRole,
    batch: card.batch,
    classification: card.classification,
    source: {swf: await bindSource(card.source.swf)},
    runtime: {
      stage: {width: 800, height: 600, deviceScaleFactor: 1},
      fps: 12,
      rootFrameCount: runtime.rootFrameCount,
      rootDurationMs: runtime.rootDurationMs,
      rootFramesAreOneIndexed: true,
      rootTimelineIsDistinctFromNestedMovieClips: true,
    },
    referenceRoutes: {
      englishPage: `/reference/${card.animationId}`,
      spanishPage: `/es/reference/${card.animationId}`,
      swfApi: `/api/reference/${card.animationId}`,
      localDevelopmentOnly: true,
      productionAvailable: false,
    },
    staticSourceSignals: cardProjection(card),
    languageBoundary: {
      pageLocales: ["en", "es"],
      pageLocaleChangesAuditUiOnly: true,
      sameSwfBytesForBothPageLocales: true,
      languageFlashVarsSuppliedByCurrentRoute: false,
      authoritativeEnglishPathResolved: false,
      authoritativeSpanishPathResolved: false,
      bilingualReferenceCaptureSupported: false,
      limitation: "The locale prefix changes the surrounding audit UI only. The current Ruffle route supplies no source-evidenced host globals, FlashVars, or language entry state to the SWF.",
    },
    scenarioBoundary: {
      sourceStatus: card.requiredWork.scenarios.status,
      requiredScenarioFamilies: card.requiredWork.scenarios.requiredScenarioFamilies,
      authoritativeScenarioIdsResolved: false,
      fullRuntimeReachabilityEstablished: false,
      frameSelectionSupported: false,
      nestedFrameDomainSelectionSupported: false,
      interactionScheduleSupported: false,
      scenarioSelectionSupported: false,
      deterministicSeedSupported: false,
      replayStateSelectionSupported: false,
      limitation: "Ruffle natural playback may reveal forensic clues, but this route cannot select or prove a root frame, nested domain, event schedule, branch, seed, terminal state, or Replay reset.",
    },
    expectedDiagnostic: {
      kind: "acceptance-neutral-local-route-load-diagnostic",
      sourceApiStatus: 200,
      sourceContentType: "application/x-shockwave-flash",
      sourceCacheControl: "no-store",
      sourceResponseSha256: card.source.swf.sha256,
      sourceResponseBytes: card.source.swf.bytes,
      pageShowsForensicOnlyBoundary: true,
      rufflePlayerLoadResolves: true,
      nativeStageScreenshotDimensions: {width: 800, height: 600},
      everyHttpRequestMustUseExactLoopbackOrigin: true,
      unexpectedExternalHttpRequestsAllowed: false,
      consoleAndRuffleMessagesRecordedNotSilentlyAccepted: true,
      screenshotTiming: "fixed delay after player load, not a source-frame selector",
      resultCannotBeUsedAs: [
        "authoritative-original-runtime-baseline",
        "strict-RMSE-baseline",
        "natural-trace-execution-proof",
        "language-or-scenario-proof",
        "audio-acceptance",
        "human-visual-review",
        "owner-acceptance",
        "production-implementation",
        "migration-completion",
      ],
    },
  };
  item.commands = {
    englishUiDiagnostic: diagnosticCommand(item, "en"),
    spanishUiDiagnostic: diagnosticCommand(item, "es"),
  };
  return item;
}

export async function buildReferenceMatrixReport() {
  const [workCardsBytes, machineBytes, capacityBytes, catalogBytes, toolchainBytes] = await Promise.all([
    readFile(WORK_CARDS_PATH),
    readFile(MACHINE_AUDIT_PATH),
    readFile(CAPACITY_PATH),
    readFile(CATALOG_PATH),
    readFile(TOOLCHAIN_PATH),
  ]);
  const workCards = JSON.parse(workCardsBytes);
  const machineAudit = JSON.parse(machineBytes);
  const capacity = JSON.parse(capacityBytes);
  const catalog = JSON.parse(catalogBytes);
  const toolchain = JSON.parse(toolchainBytes);
  invariant(workCards.reportType === "g4-l3-implementation-work-cards", "Unexpected G4 L3 work-card input");
  invariant(workCards.cards?.length === 40, "G4 L3 work-card input must contain exactly 40 items");
  invariant(machineAudit.items?.length === 40, "G4 L3 machine audit must contain exactly 40 items");
  invariant(capacity.lessonScope?.canonicalItems === 40, "G4 L3 capacity report scope drift");
  invariant(capacity.capacityModel?.admission === "admit-full-lesson-capture-capacity"
    && capacity.capacityModel?.headroomBytesAtMinimumSafeThreshold >= 0
    && capacity.capacityModel?.admissionIsFidelityEvidence === false,
  "Capacity report no longer admits the full-lesson archive with a non-fidelity boundary");
  invariant(toolchain.flashForensics?.ruffle?.role === "forensic-reference-only", "Toolchain Ruffle role drift");

  const machineById = new Map(machineAudit.items.map((item) => [item.animationId, item]));
  const catalogById = new Map(catalog.animations.map((item) => [item.animationId, item]));
  const queue = [];
  for (const card of workCards.cards) queue.push(await buildQueueItem(card, machineById.get(card.animationId), catalogById.get(card.animationId)));
  invariant(new Set(queue.map((item) => item.animationId)).size === 40, "G4 L3 queue contains duplicate animation IDs");
  invariant(queue.every((item, index) => item.queueOrdinal === index + 1), "G4 L3 queue order is not contiguous");
  invariant(REPRESENTATIVE_IDS.every((id) => queue.some((item) => item.animationId === id)), "Representative diagnostics are outside the G4 L3 queue");

  const routeBoundary = await referenceRouteBoundary();
  const ruffleDistribution = await ruffleDistributionBinding();
  invariant(ruffleDistribution.version === toolchain.flashForensics.ruffle.npmVersion, "Ruffle package/toolchain version drift");

  const signalCount = (key) => queue.filter((item) => item.staticSourceSignals[key]).length;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-ruffle-forensic-reference-matrix",
    generator: {path: portable(scriptPath), version: 1},
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetChanges: 0,
      sourceSwfCopiesCreated: 0,
      productionExposureChanges: 0,
      migrationWorkspaceChanges: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      approvalOrReviewChanges: 0,
      batchGateChanges: 0,
      strictAcceptanceEffect: false,
      statement: "This matrix prepares local Ruffle route-load diagnostics only. Ruffle is forensic-only and is never authoritative original-runtime evidence, a strict RMSE baseline, a production implementation, audio acceptance, human review, owner acceptance, fidelity proof, or migration completion.",
    },
    sourceBindings: {
      workCards: {path: portable(WORK_CARDS_PATH), bytes: workCardsBytes.length, sha256: sha256(workCardsBytes)},
      machineAudit: {path: portable(MACHINE_AUDIT_PATH), bytes: machineBytes.length, sha256: sha256(machineBytes), auditSetSha256: machineAudit.summary.auditSetSha256},
      capacityReadiness: {
        path: portable(CAPACITY_PATH),
        bytes: capacityBytes.length,
        sha256: sha256(capacityBytes),
        availableBytesAtBoundSnapshot: capacity.capacityModel.availableBytes,
        minimumSafeFreeBytesAtBoundSnapshot: capacity.capacityModel.minimumSafeFreeBytes,
        admission: capacity.capacityModel.admission,
        limitation: "The bound capacity report admits the estimated full-lesson archive at its dated snapshot. Admission is not fidelity evidence, does not replace the mandatory live preflight, and does not authorize Ruffle as an original-runtime baseline.",
      },
      catalog: {path: portable(CATALOG_PATH), bytes: catalogBytes.length, sha256: sha256(catalogBytes)},
      toolchain: {path: portable(TOOLCHAIN_PATH), bytes: toolchainBytes.length, sha256: sha256(toolchainBytes)},
    },
    localReferenceRuntime: {
      routeBoundary,
      ruffleDistribution,
      serverCommand: {
        argv: ["npm", "run", "dev", "--workspace", "@helpmath/web", "--", "--hostname", "127.0.0.1", "--port", "3104"],
        shell: "npm run dev --workspace @helpmath/web -- --hostname 127.0.0.1 --port 3104",
        requiredEnvironment: "development",
        loopbackOnly: true,
      },
    },
    representativeValidation: await bindRepresentativeDiagnostics(queue),
    lesson: {
      releaseId: workCards.lesson.releaseId,
      grade: 4,
      lesson: 3,
      titleDisplay: workCards.lesson.titleDisplay,
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
    },
    executionPolicy: {
      queueBuiltForAllCanonicalItems: true,
      executeFullQueueNow: false,
      reason: "Capacity admits the estimated full-lesson archive, but this forensic-only Ruffle route has no deterministic frame/domain/language/scenario contract and cannot produce authoritative original-runtime evidence.",
      representativeDiagnosticsOnly: true,
      maximumRepresentativeDiagnostics: REPRESENTATIVE_IDS.length,
      representativeAnimationIds: [...REPRESENTATIVE_IDS],
      rawFullFrameArchiveCreatedByBuilder: false,
      nextUse: "Run only selected route-load probes to identify Ruffle compatibility and blocked side effects; establish strict evidence later through authorized original runtime plus deterministic JavaScript implementation capture.",
    },
    summary: {
      queueItems: queue.length,
      physicallyVerifiedSourceSwfs: queue.filter((item) => item.source.swf.physicalHashVerifiedNow).length,
      native800x600Items: queue.filter((item) => item.runtime.stage.width === 800 && item.runtime.stage.height === 600).length,
      twelveFpsItems: queue.filter((item) => item.runtime.fps === 12).length,
      rootFrameCountSum: queue.reduce((sum, item) => sum + item.runtime.rootFrameCount, 0),
      staticInteractionCandidates: signalCount("interactionCandidate"),
      staticRandomCandidates: signalCount("randomCandidate"),
      staticExternalDependencyCandidates: signalCount("externalDependencyCandidate"),
      itemsWithEmbeddedAudioTags: queue.filter((item) => item.staticSourceSignals.embeddedAudioTagCount > 0).length,
      localRouteDiagnosticReady: queue.length,
      representativeRouteLoadDiagnosticsPassed: REPRESENTATIVE_IDS.length,
      deterministicRootFrameCaptureReady: 0,
      deterministicNestedDomainCaptureReady: 0,
      bilingualSwfEntryCaptureReady: 0,
      scenarioOrSeedCaptureReady: 0,
      authoritativeOriginalRuntimeBaselines: 0,
      strictRmseBaselines: 0,
      productionRuffleImplementations: 0,
      strictMigrationCompletions: 0,
    },
    queue,
  };
  return validateReferenceMatrixReport(report);
}

export function validateReferenceMatrixReport(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION, "Unexpected G4 L3 Ruffle matrix schema");
  invariant(report.reportType === "g4-l3-ruffle-forensic-reference-matrix", "Unexpected G4 L3 Ruffle matrix type");
  invariant(report.acceptance?.acceptanceNeutral === true && report.acceptance.strictAcceptanceEffect === false, "Matrix must remain acceptance-neutral");
  invariant(report.queue?.length === 40 && report.summary?.queueItems === 40, "Matrix must contain all 40 canonical lesson items");
  invariant(report.summary.physicallyVerifiedSourceSwfs === 40, "Every matrix source must be physically verified");
  invariant(report.summary.native800x600Items === 40 && report.summary.twelveFpsItems === 40, "Every matrix item must retain native 800x600 at 12fps");
  invariant(report.summary.rootFrameCountSum === 440, "G4 L3 root-frame sum drift");
  invariant(report.summary.staticInteractionCandidates === 38, "G4 L3 interaction candidate count drift");
  invariant(report.summary.staticRandomCandidates === 12, "G4 L3 random candidate count drift");
  invariant(report.summary.staticExternalDependencyCandidates === 3, "G4 L3 external candidate count drift");
  invariant(report.summary.itemsWithEmbeddedAudioTags === 37, "G4 L3 embedded-audio item count drift");
  invariant(report.summary.deterministicRootFrameCaptureReady === 0, "Ruffle route must not claim deterministic frame capture");
  invariant(report.summary.bilingualSwfEntryCaptureReady === 0, "Ruffle route must not claim bilingual entry control");
  invariant(report.summary.scenarioOrSeedCaptureReady === 0, "Ruffle route must not claim scenario/seed control");
  invariant(report.summary.authoritativeOriginalRuntimeBaselines === 0 && report.summary.strictRmseBaselines === 0, "Ruffle diagnostics must not be promoted to strict evidence");
  invariant(report.summary.productionRuffleImplementations === 0 && report.summary.strictMigrationCompletions === 0, "Ruffle diagnostics must not be promoted to production/completion");
  invariant(report.localReferenceRuntime.routeBoundary.productionExposure === false, "Reference route must remain disabled in production");
  invariant(report.localReferenceRuntime.routeBoundary.productWebPublicSwfCount === 0, "Product public tree must remain SWF-free");
  invariant(report.localReferenceRuntime.ruffleDistribution.role === "forensic-reference-only", "Ruffle role drift");
  invariant(report.representativeValidation.summary.exactSourceDeliveryPassed === 4, "Representative exact-source delivery drift");
  invariant(report.representativeValidation.summary.localRuffleLoadPassed === 4, "Representative Ruffle load drift");
  invariant(report.representativeValidation.summary.native800x600CanvasObserved === 4, "Representative native-canvas drift");
  invariant(report.representativeValidation.summary.unexpectedExternalHttpRequests === 0, "Representative external-network boundary drift");
  invariant(report.representativeValidation.summary.blockedLocalLegacyOrUnallowlistedRequests === 3, "Representative blocked-request count drift");
  invariant(report.representativeValidation.summary.blockedRequestsReachedServer === 0, "Representative blocked request reached server");
  invariant(report.representativeValidation.summary.uniformBackgroundOnlyScreenshots === 3, "Representative blank-page observation drift");
  invariant(report.representativeValidation.summary.nonuniformReferenceSurfaces === 1, "Representative shell-surface observation drift");
  invariant(report.representativeValidation.summary.failedLocalDependencyResponses === 0, "Representative retained runs must not execute failed legacy dependency requests");
  invariant(report.representativeValidation.summary.deterministicSourceFrameBindings === 0, "Representative diagnostics must not claim source-frame bindings");
  invariant(report.executionPolicy.executeFullQueueNow === false && report.executionPolicy.representativeDiagnosticsOnly === true, "Forensic-only representative execution policy drift");
  const ids = new Set();
  for (const [index, item] of report.queue.entries()) {
    invariant(item.queueOrdinal === index + 1, `${item.animationId}: queue ordinal drift`);
    invariant(!ids.has(item.animationId), `${item.animationId}: duplicate queue item`);
    ids.add(item.animationId);
    invariant(item.assetId === `swf-${item.source.swf.sha256}`, `${item.animationId}: asset/source identity drift`);
    invariant(item.source.swf.physicalHashVerifiedNow === true && item.source.swf.copiedIntoWebPublic === false, `${item.animationId}: unsafe source disposition`);
    invariant(item.runtime.stage.width === 800 && item.runtime.stage.height === 600 && item.runtime.stage.deviceScaleFactor === 1, `${item.animationId}: native-stage drift`);
    invariant(item.runtime.fps === 12 && Number.isInteger(item.runtime.rootFrameCount), `${item.animationId}: root timeline drift`);
    invariant(item.referenceRoutes.localDevelopmentOnly === true && item.referenceRoutes.productionAvailable === false, `${item.animationId}: production boundary drift`);
    invariant(item.languageBoundary.bilingualReferenceCaptureSupported === false, `${item.animationId}: unsupported bilingual claim`);
    invariant(item.scenarioBoundary.frameSelectionSupported === false && item.scenarioBoundary.scenarioSelectionSupported === false, `${item.animationId}: unsupported deterministic capture claim`);
    invariant(item.expectedDiagnostic.resultCannotBeUsedAs.includes("migration-completion"), `${item.animationId}: missing acceptance limitation`);
    for (const command of Object.values(item.commands)) {
      invariant(command.executedByMatrixBuilder === false, `${item.animationId}: builder must not execute capture commands`);
      invariant(command.shell.includes(item.source.swf.sha256), `${item.animationId}: diagnostic command is not hash-bound`);
      invariant(command.shell.includes("http://127.0.0.1:3104"), `${item.animationId}: diagnostic command is not loopback-bound`);
    }
  }
  return report;
}

export function renderReferenceMatrixMarkdown(report) {
  validateReferenceMatrixReport(report);
  const lines = [
    "# G4 L3 Ruffle Forensic Reference Matrix",
    "",
    "> Acceptance-neutral only. Ruffle is a local forensic reference. It is not an authoritative original runtime, strict RMSE baseline, production implementation, audio acceptance, human/owner review, fidelity proof, or migration completion.",
    "",
    "## Result",
    "",
    `- Queue: **${report.summary.queueItems}/40** canonical items, each physically re-hashed from the frozen archive.`,
    `- Native facts: **${report.summary.native800x600Items}/40** at 800×600, **${report.summary.twelveFpsItems}/40** at 12 FPS, **${report.summary.rootFrameCountSum}** root frames.`,
    `- Local route-load diagnostics ready: **${report.summary.localRouteDiagnosticReady}/40**.`,
    `- Retained representative diagnostics: **${report.representativeValidation.summary.localRuffleLoadPassed}/4** exact-source/local-Ruffle loads at 800×600, with **${report.representativeValidation.summary.unexpectedExternalHttpRequests}** external HTTP requests.`,
    "- Deterministic frame/domain/language/scenario/seed capture ready: **0**. The current Ruffle route plays naturally and exposes none of the strict capture identity contract.",
    "- Production exposure, authoritative baseline, strict RMSE baseline, and strict completion: **0**.",
    "",
    "## Local-only boundary",
    "",
    `- Ruffle: \`${report.localReferenceRuntime.ruffleDistribution.package}@${report.localReferenceRuntime.ruffleDistribution.version}\`, distribution SHA-256 \`${report.localReferenceRuntime.ruffleDistribution.distributionSha256}\`.`,
    "- The reference page, SWF API, and Ruffle asset API all return `notFound()` in production.",
    "- The SWF API streams the exact catalog-resolved frozen source bytes with `no-store`; no G4 L3 SWF is copied into the product public tree.",
    "- Ruffle runs with `allowNetworking: none`, `allowScriptAccess: false`, and `openUrlMode: deny`.",
    "- English and Spanish URL prefixes change only the surrounding audit UI. No language FlashVars or source-evidenced host entry state are supplied.",
    "",
    "## Forensic-only execution boundary",
    "",
    `Bound capacity report: \`${report.sourceBindings.capacityReadiness.path}\` (SHA-256 \`${report.sourceBindings.capacityReadiness.sha256}\`).`,
    "",
    `Full queue execution now: **${report.executionPolicy.executeFullQueueNow ? "yes" : "no"}**. Only these ${report.executionPolicy.maximumRepresentativeDiagnostics} representative route-load diagnostics are selected:`,
    "",
    ...report.executionPolicy.representativeAnimationIds.map((id) => `- \`${id}\``),
    "",
    "Start the local development server:",
    "",
    "```bash",
    report.localReferenceRuntime.serverCommand.shell,
    "```",
    "",
    "Then run an exact per-item command from the JSON matrix. Example:",
    "",
    "```bash",
    report.queue[0].commands.englishUiDiagnostic.shell,
    "```",
    "",
    "A passing probe means only: exact SWF bytes were served, the forensic-only page and Ruffle player loaded locally, no external HTTP request escaped, and an 800×600 diagnostic PNG was written after a fixed delay. The PNG is not tied to a source frame.",
    "",
    "## Representative observations",
    "",
    `- Three page SWFs produced uniform-background-only screenshots after ${report.representativeValidation.selection.fixedDelayAfterRuffleLoadMs} ms. This does not prove why; original shell/global/language entry state remains unresolved.`,
    `- The course shell produced a visible nonuniform surface. The probe blocked **${report.representativeValidation.summary.blockedLocalLegacyOrUnallowlistedRequests}** local legacy/unallowlisted requests before network execution:`,
    "",
    ...report.representativeValidation.blockers[1].blockedLocalRequests.map((request) => `  - \`${request.method}\` \`${request.url}\` (${request.disposition})`),
    "",
    "No external or legacy endpoint was contacted. A future dependency sandbox must remain explicit, hash-bound, development-only, and network-denied; this report does not create or authorize one.",
    "",
    "## Queue",
    "",
    "| # | Animation | Role | Section/page | Source SHA-256 | Root frames | Static risks |",
    "|---:|---|---|---|---|---:|---|",
  ];
  for (const item of report.queue) {
    const section = item.classification.section ?? "shell";
    const page = item.classification.page ?? "—";
    const signals = [
      item.staticSourceSignals.interactionCandidate ? "interaction" : null,
      item.staticSourceSignals.randomCandidate ? "random" : null,
      item.staticSourceSignals.externalDependencyCandidate ? "external" : null,
      item.staticSourceSignals.embeddedAudioTagCount > 0 ? "embedded-audio" : null,
    ].filter(Boolean).join(", ") || "none detected statically";
    lines.push(`| ${item.queueOrdinal} | \`${item.animationId}\` | ${item.releaseRole} | ${section}/${page} | \`${item.source.swf.sha256}\` | ${item.runtime.rootFrameCount} | ${signals} |`);
  }
  lines.push(
    "",
    "Static risk signals are candidates only; they do not establish runtime reachability or final scenario coverage.",
    "",
    "## Unresolved strict evidence",
    "",
    "Every item still needs source-evidenced frame-domain disposition, authoritative English/Spanish entry behavior, all reachable natural interaction traces, original-runtime baselines, deterministic JavaScript captures, full-frame RMSE/diffs, audio acceptance, product QA, human visual review, and owner acceptance.",
    "",
  );
  return lines.join("\n");
}

export function parseArguments(argv) {
  const options = {check: false, json: DEFAULT_JSON, markdown: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = path.resolve(argv[++index] ?? "");
    else if (value === "--markdown") options.markdown = path.resolve(argv[++index] ?? "");
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(options.json && options.markdown, "Output paths are required");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildReferenceMatrixReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = `${renderReferenceMatrixMarkdown(report)}\n`;
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([readFile(options.json, "utf8"), readFile(options.markdown, "utf8")]);
    invariant(currentJson === json, `${portable(options.json)} is stale`);
    invariant(currentMarkdown === markdown, `${portable(options.markdown)} is stale`);
    console.log(`PASS ${portable(options.json)} and ${portable(options.markdown)}`);
    return;
  }
  await Promise.all([writeFile(options.json, json), writeFile(options.markdown, markdown)]);
  console.log(`Wrote ${portable(options.json)}`);
  console.log(`Wrote ${portable(options.markdown)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
