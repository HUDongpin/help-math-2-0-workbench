#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const DEFAULT_JSON = path.join(
  projectRoot,
  "reports",
  "g5-l5-ruffle-reference-matrix.json",
);
const DEFAULT_MARKDOWN = path.join(
  projectRoot,
  "reports",
  "g5-l5-ruffle-reference-matrix.md",
);
const RELEASES_PATH = path.join(projectRoot, "catalog", "lesson-releases.json");
const RELEASE_LEDGER_PATH = path.join(
  projectRoot,
  "catalog",
  "lesson-release-ledger.json",
);
const CATALOG_PATH = path.join(projectRoot, "catalog", "animations.json");
const RISK_PATH = path.join(projectRoot, "reports", "g5-l5-risk-calibration.json");
const TOOLCHAIN_PATH = path.join(projectRoot, "catalog", "toolchain.json");
const REFERENCE_PAGE_PATH = path.join(
  projectRoot,
  "apps",
  "web",
  "app",
  "[locale]",
  "reference",
  "[animationId]",
  "page.tsx",
);
const REFERENCE_API_PATH = path.join(
  projectRoot,
  "apps",
  "web",
  "app",
  "api",
  "reference",
  "[animationId]",
  "route.ts",
);
const RUFFLE_API_PATH = path.join(
  projectRoot,
  "apps",
  "web",
  "app",
  "api",
  "ruffle",
  "[...asset]",
  "route.ts",
);
const REFERENCE_PLAYER_PATH = path.join(
  projectRoot,
  "apps",
  "web",
  "components",
  "reference-player.tsx",
);
const PROBE_PATH = path.join(
  projectRoot,
  "scripts",
  "probe-g5-l5-ruffle-reference.mjs",
);
const RUFFLE_ROOT = path.join(
  projectRoot,
  "node_modules",
  "@ruffle-rs",
  "ruffle",
);
const DIAGNOSTIC_ROOT = path.join(
  projectRoot,
  "output",
  "playwright",
  "g5-l5-ruffle-reference-diagnostics",
);
const RISK_IDS = Object.freeze([
  "shell-course-g05-l05-index-local",
  "course-g05-l05-rw-002",
  "course-g05-l05-in-016",
  "course-g05-l05-in-020",
  "course-g05-l05-ti-006",
  "course-g05-l05-gs-002",
  "course-g05-l05-ts-007",
  "course-g05-l05-fq-002",
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
  invariant(
    !back.startsWith("..") && !path.isAbsolute(back),
    `Path escapes project root: ${relativePath}`,
  );
  return absolute;
}

async function bindFile(filePath) {
  const [metadata, bytes] = await Promise.all([
    lstat(filePath),
    readFile(filePath),
  ]);
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${portable(filePath)} must be one regular non-symlink file`,
  );
  return {
    path: portable(filePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function bindSource(member, catalogItem) {
  invariant(
    catalogItem?.animationId === member.animationId &&
      catalogItem.assetId === member.assetId,
    `${member.animationId}: catalog identity drift`,
  );
  invariant(
    member.assetId === `swf-${member.source.sha256}` &&
      catalogItem.source?.path === member.source.path &&
      catalogItem.source.sha256 === member.source.sha256 &&
      Number.isInteger(catalogItem.source.bytes) &&
      catalogItem.source.bytes > 0,
    `${member.animationId}: source identity drift`,
  );
  const relativePath = `${SOURCE_PREFIX}${member.source.path}`;
  const absolutePath = resolveProjectFile(relativePath);
  const [metadata, bytes] = await Promise.all([
    lstat(absolutePath),
    readFile(absolutePath),
  ]);
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${member.animationId}: source must be one regular non-symlink file`,
  );
  invariant(
    bytes.length === catalogItem.source.bytes &&
      sha256(bytes) === member.source.sha256,
    `${member.animationId}: physical source byte/hash drift`,
  );
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: member.source.sha256,
    physicalBytesAndHashVerifiedNow: true,
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
  const output =
    `output/playwright/g5-l5-ruffle-reference-diagnostics/${item.animationId}/${language}-3500ms`;
  const argv = [
    "node",
    "scripts/probe-g5-l5-ruffle-reference.mjs",
    "--base-url",
    "http://127.0.0.1:3105",
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
    "3500",
    "--output",
    output,
  ];
  return {
    argv,
    shell: shellCommand(argv),
    output,
    executedByMatrixBuilder: false,
  };
}

function validateRelease(releases) {
  invariant(
    releases?.schemaVersion === 1 && Array.isArray(releases.releases),
    "lesson-release manifest is malformed",
  );
  const matches = releases.releases.filter(
    (release) => release.releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release is not unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.members === 57 &&
      release.expectedCounts.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      Array.isArray(release.members) &&
      release.members.length === 57,
    "G5 L5 release identity or scope drifted",
  );
  invariant(
    release.members.every(
      (member, index) => member.ordinal === index + 1,
    ) &&
      new Set(release.members.map(({animationId}) => animationId)).size === 57 &&
      new Set(release.members.map(({assetId}) => assetId)).size === 57,
    "G5 L5 release member order or identity drifted",
  );
  const shell = release.members[56];
  invariant(
    shell.animationId === "shell-course-g05-l05-index-local" &&
      shell.releaseRole === "course-shell",
    "G5 L5 terminal shell drifted",
  );
  return release;
}

function validateReleaseLedger(ledger) {
  const matches = ledger?.releases?.filter(
    (release) => release.releaseId === RELEASE_ID,
  );
  invariant(
    matches?.length === 1 &&
      matches[0].expectedMemberCount === 57 &&
      matches[0].strictCompleteCount === 0 &&
      matches[0].missingCount === 57 &&
      matches[0].published === false &&
      matches[0].status === "unpublished" &&
      matches[0].gate?.open === false,
    "G5 L5 release ledger was promoted or drifted",
  );
  return matches[0];
}

function validateRisk(risk, release) {
  invariant(
    risk?.schemaVersion === 1 &&
      risk.reportType === "lesson-release-static-risk-calibration" &&
      risk.releaseId === RELEASE_ID &&
      risk.summary?.calibrationMemberCount === 8 &&
      Array.isArray(risk.items) &&
      risk.items.length === 8 &&
      JSON.stringify(risk.items.map(({animationId}) => animationId)) ===
        JSON.stringify(RISK_IDS),
    "G5 L5 risk-calibration identity drifted",
  );
  const releaseById = new Map(
    release.members.map((member) => [member.animationId, member]),
  );
  for (const item of risk.items) {
    const member = releaseById.get(item.animationId);
    invariant(
      member?.ordinal === item.ordinal &&
        member.assetId === item.assetId &&
        item.staticFacts?.stage?.width === 800 &&
        item.staticFacts.stage.height === 600 &&
        item.staticFacts.stage.fps === 12 &&
        Number.isInteger(item.staticFacts.rootFrameCount) &&
        item.readiness?.strictAcceptanceEffect === false,
      `${item.animationId}: risk-calibration binding drifted`,
    );
  }
}

async function referenceRouteBoundary() {
  const [pageBytes, referenceApiBytes, ruffleApiBytes, playerBytes] =
    await Promise.all([
      readFile(REFERENCE_PAGE_PATH),
      readFile(REFERENCE_API_PATH),
      readFile(RUFFLE_API_PATH),
      readFile(REFERENCE_PLAYER_PATH),
    ]);
  const page = pageBytes.toString("utf8");
  const referenceApi = referenceApiBytes.toString("utf8");
  const ruffleApi = ruffleApiBytes.toString("utf8");
  const player = playerBytes.toString("utf8");
  for (const [label, source] of [
    ["reference page", page],
    ["reference SWF API", referenceApi],
    ["Ruffle asset API", ruffleApi],
  ]) {
    invariant(
      source.includes("process.env.NODE_ENV === 'production'") &&
        source.includes("notFound()"),
      `${label} does not fail closed in production`,
    );
  }
  invariant(
    referenceApi.includes("resolveCatalogSource") &&
      referenceApi.includes("'Cache-Control': 'no-store'") &&
      referenceApi.includes(
        "'Content-Type': 'application/x-shockwave-flash'",
      ),
    "reference SWF API source-delivery boundary drifted",
  );
  invariant(
    ruffleApi.includes("node_modules/@ruffle-rs/ruffle"),
    "Ruffle API is not bound to the local package",
  );
  invariant(
    player.includes("allowNetworking: 'none'") &&
      player.includes("allowScriptAccess: false") &&
      player.includes("openUrlMode: 'deny'"),
    "Ruffle player safety configuration drifted",
  );
  invariant(
    !player.includes("frameDomain") &&
      !player.includes("requirementId") &&
      !player.includes("entryStateSha256"),
    "reference player unexpectedly claims strict capture identity",
  );

  const publicRoot = path.join(projectRoot, "apps", "web", "public");
  const publicEntries = await readdir(publicRoot, {
    recursive: true,
    withFileTypes: true,
  });
  const publicSwfCount = publicEntries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".swf"),
  ).length;
  invariant(
    publicSwfCount === 0,
    "apps/web/public unexpectedly contains a SWF",
  );
  return {
    implementationFiles: await Promise.all([
      bindFile(REFERENCE_PAGE_PATH),
      bindFile(REFERENCE_API_PATH),
      bindFile(RUFFLE_API_PATH),
      bindFile(REFERENCE_PLAYER_PATH),
    ]),
    developmentApiOnly: true,
    productionExposure: false,
    productionGuardStaticVerification: true,
    productionGuardExpectedStatuses: {
      referencePage: 404,
      referenceSwfApi: 404,
      ruffleAssetApi: 404,
    },
    productionHttpObservation: null,
    productionStatusClaim:
      "fail-closed source guards verified; this matrix builder did not launch a production server or observe HTTP responses",
    sourceDelivery:
      "catalog-resolved frozen bytes streamed on demand with no-store",
    productWebPublicSwfCount: 0,
    sourceSwfCopiesCreated: 0,
    ruffleOptions: {
      allowNetworking: "none",
      allowScriptAccess: false,
      openUrlMode: "deny",
    },
    deterministicSourceFrameContract: false,
    scenarioContract: false,
    languageFlashVarContract: false,
    interactionCoverageContract: false,
    audioAcceptanceContract: false,
  };
}

async function ruffleDistributionBinding(toolchain) {
  const packageBytes = await readFile(path.join(RUFFLE_ROOT, "package.json"));
  const packageJson = JSON.parse(packageBytes);
  invariant(
    packageJson.name === "@ruffle-rs/ruffle" &&
      packageJson.version ===
        toolchain.flashForensics?.ruffle?.npmVersion &&
      toolchain.flashForensics.ruffle.role === "forensic-reference-only",
    "local Ruffle/toolchain binding drifted",
  );
  const names = (await readdir(RUFFLE_ROOT)).sort();
  const files = [];
  for (const name of names) {
    const target = path.join(RUFFLE_ROOT, name);
    const metadata = await lstat(target);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      metadata.nlink !== 1
    ) {
      continue;
    }
    files.push(await bindFile(target));
  }
  invariant(
    files.some((file) => file.path.endsWith("/ruffle.js")) &&
      files.some((file) => file.path.endsWith(".wasm")),
    "local Ruffle distribution is incomplete",
  );
  return {
    package: packageJson.name,
    version: packageJson.version,
    role: "forensic-reference-only",
    servedOnlyThroughDevelopmentGuardedApi: true,
    fileCount: files.length,
    distributionSha256: sha256(
      Buffer.from(JSON.stringify(files), "utf8"),
    ),
    files,
  };
}

async function buildQueueItem(member, catalogItem, riskById) {
  const source = await bindSource(member, catalogItem);
  const swf = catalogItem.source.swf;
  invariant(
    swf?.status === "parsed" &&
      swf.stage?.width === 800 &&
      swf.stage.height === 600 &&
      swf.fps === 12 &&
      Number.isInteger(swf.frameCount) &&
      swf.frameCount > 0,
    `${member.animationId}: native SWF facts drifted`,
  );
  const risk = riskById.get(member.animationId) ?? null;
  const item = {
    queueOrdinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    source: {swf: source},
    runtime: {
      stage: {width: 800, height: 600, deviceScaleFactor: 1},
      fps: 12,
      rootFrameCount: swf.frameCount,
      rootDurationMs: swf.durationMs,
      exactSourceFrameObservedByThisQueue: null,
    },
    riskCalibration: risk
      ? {
        selected: true,
        selectionOrdinal: RISK_IDS.indexOf(member.animationId) + 1,
        intendedCalibrationAxes: risk.intendedCalibrationAxes,
        sourceModel: risk.staticFacts.sourceModel,
      }
      : {
        selected: false,
        selectionOrdinal: null,
        intendedCalibrationAxes: [],
        sourceModel: null,
      },
    referenceRoutes: {
      englishPage: `/reference/${member.animationId}`,
      spanishPage: `/es/reference/${member.animationId}`,
      swfApi: `/api/reference/${member.animationId}`,
      localDevelopmentOnly: true,
      productionAvailable: false,
    },
    safety: {
      networking: "none",
      scriptAccess: false,
      openUrl: "deny",
      sourceCopiedToPublic: false,
    },
    evidenceBoundary: {
      exactSourceDeliveryDiagnosticSupported: true,
      localRuffleLoadDiagnosticSupported: true,
      loopbackNetworkContainmentDiagnosticSupported: true,
      nativePngDiagnosticSupported: true,
      sourceFrameEvidenceSupported: false,
      originalRuntimeBaselineSupported: false,
      audioAcceptanceSupported: false,
      interactionCoverageSupported: false,
      fidelityAcceptanceSupported: false,
      strictAcceptanceEffect: false,
    },
  };
  item.commands = {
    englishDiagnostic: diagnosticCommand(item, "en"),
    spanishDiagnostic: diagnosticCommand(item, "es"),
  };
  return item;
}

async function bindDiagnostics(queue, risk, {required}) {
  const probe = await bindFile(PROBE_PATH);
  const queueById = new Map(queue.map((item) => [item.animationId, item]));
  const riskById = new Map(
    risk.items.map((item) => [item.animationId, item]),
  );
  const records = [];
  const missing = [];
  for (const animationId of RISK_IDS) {
    const queueItem = queueById.get(animationId);
    const riskItem = riskById.get(animationId);
    invariant(
      queueItem && riskItem,
      `${animationId}: diagnostic selection is outside bound inputs`,
    );
    const directory = path.join(
      DIAGNOSTIC_ROOT,
      animationId,
      "en-3500ms",
    );
    const jsonPath = path.join(directory, "diagnostic.json");
    const screenshotPath = path.join(directory, "diagnostic-stage.png");
    let jsonBytes;
    let screenshotBytes;
    try {
      [jsonBytes, screenshotBytes] = await Promise.all([
        readFile(jsonPath),
        readFile(screenshotPath),
      ]);
    } catch (error) {
      if (error?.code === "ENOENT") {
        missing.push(animationId);
        continue;
      }
      throw error;
    }
    const diagnostic = JSON.parse(jsonBytes);
    const screenshot = PNG.sync.read(screenshotBytes);
    invariant(
      diagnostic.reportType ===
        "g5-l5-ruffle-local-route-load-diagnostic" &&
        diagnostic.animationId === animationId &&
        diagnostic.language === "en" &&
        diagnostic.status === "passed-local-route-load-diagnostic",
      `${animationId}: diagnostic identity or status drifted`,
    );
    invariant(
      diagnostic.probe?.sha256 === probe.sha256 &&
        diagnostic.sourceDiagnostic?.sha256 ===
          queueItem.source.swf.sha256 &&
        diagnostic.sourceDiagnostic.bytes === queueItem.source.swf.bytes &&
        diagnostic.sourceDiagnostic.exactSourceBytesVerified === true,
      `${animationId}: diagnostic source/probe binding drifted`,
    );
    invariant(
      diagnostic.pageDiagnostic?.ruffleLoadPromiseResolved === true &&
        diagnostic.pageDiagnostic.fixedDelayAfterLoadMs === 3500 &&
        diagnostic.pageDiagnostic.exactSourceFrameObserved === null &&
        diagnostic.pageDiagnostic.deterministicFrameSelectionSupported ===
          false &&
        diagnostic.pageDiagnostic.interactionCoverageEstablished === false &&
        diagnostic.pageDiagnostic.audioCoverageEstablished === false,
      `${animationId}: diagnostic page boundary drifted`,
    );
    invariant(
      diagnostic.networkDiagnostic?.allExecutedHttpRequestsExactLoopbackOrigin ===
        true &&
        diagnostic.networkDiagnostic.unexpectedExternalRequests?.length ===
          0 &&
        diagnostic.networkDiagnostic.blockedRequestsReachedServer === false &&
        diagnostic.networkDiagnostic.ruffleConfiguration?.allowNetworking ===
          "none" &&
        diagnostic.networkDiagnostic.ruffleConfiguration.allowScriptAccess ===
          false &&
        diagnostic.networkDiagnostic.ruffleConfiguration.openUrlMode ===
          "deny",
      `${animationId}: diagnostic network containment drifted`,
    );
    invariant(
      diagnostic.acceptance?.acceptanceNeutral === true &&
        diagnostic.acceptance.strictAcceptanceEffect === false &&
        diagnostic.screenshot?.sha256 === sha256(screenshotBytes) &&
        screenshot.width === 800 &&
        screenshot.height === 600,
      `${animationId}: diagnostic PNG or acceptance boundary drifted`,
    );
    const colors = new Set();
    for (let offset = 0; offset < screenshot.data.length; offset += 4) {
      colors.add(
        screenshot.data.subarray(offset, offset + 4).toString("hex"),
      );
    }
    records.push({
      animationId,
      releaseOrdinal: queueItem.queueOrdinal,
      riskSelectionOrdinal: RISK_IDS.indexOf(animationId) + 1,
      intendedCalibrationAxes: riskItem.intendedCalibrationAxes,
      sourceModel: riskItem.staticFacts.sourceModel,
      result: diagnostic.status,
      exactSourceBytesVerified: true,
      ruffleLoadPromiseResolved: true,
      native800x600PngCreated: true,
      allExecutedHttpRequestsExactLoopbackOrigin: true,
      unexpectedExternalRequestCount: 0,
      blockedLocalRequests:
        diagnostic.networkDiagnostic.blockedLocalRequests,
      blockedLocalRequestCount:
        diagnostic.networkDiagnostic.blockedLocalRequests.length,
      blockedRequestsReachedServer: false,
      consoleErrorCount:
        diagnostic.browserDiagnostic.consoleMessages.filter(
          (message) => message.type === "error",
        ).length,
      pageErrorCount: diagnostic.browserDiagnostic.pageErrors.length,
      diagnostic: {
        path: portable(jsonPath),
        bytes: jsonBytes.length,
        sha256: sha256(jsonBytes),
      },
      screenshot: {
        path: portable(screenshotPath),
        bytes: screenshotBytes.length,
        sha256: sha256(screenshotBytes),
        width: screenshot.width,
        height: screenshot.height,
        uniqueRgbaColorCount: colors.size,
        observation: colors.size === 1
          ? "uniform-reference-surface-observed"
          : "nonuniform-reference-surface-observed",
        sourceFrameBinding: null,
      },
      authority: {
        sourceFrame: false,
        originalRuntimeBaseline: false,
        audio: false,
        interaction: false,
        fidelity: false,
        humanReview: false,
        ownerAcceptance: false,
        strictCompletion: false,
        publication: false,
      },
    });
  }
  invariant(
    !required || missing.length === 0,
    `Required representative diagnostics are missing: ${missing.join(", ")}`,
  );
  const uniformRecords = records.filter(
    (record) => record.screenshot.uniqueRgbaColorCount === 1,
  );
  const nonuniformRecords = records.filter(
    (record) => record.screenshot.uniqueRgbaColorCount > 1,
  );
  const shellRecord = records.find(
    (record) =>
      record.animationId === "shell-course-g05-l05-index-local",
  );
  return {
    state: records.length === RISK_IDS.length
      ? "complete-eight-of-eight-risk-calibration-route-load-diagnostics"
      : "planned-awaiting-risk-calibration-route-load-diagnostics",
    requiredForCheckedInFinalReport: true,
    probe: {
      ...probe,
      loopbackOriginRequired: true,
      exactSourceResponseHashRequired: true,
      externalHttpAttemptsFailTheProbe: true,
      native800x600PngRequired: true,
      acceptanceNeutralOutputOnly: true,
    },
    selection: {
      source: "reports/g5-l5-risk-calibration.json",
      animationIds: [...RISK_IDS],
      selectedCount: 8,
      language: "en",
      fixedDelayAfterRuffleLoadMs: 3500,
      executedCount: records.length,
      missingAnimationIds: missing,
      allRiskCalibrationAxesCovered:
        records.length === RISK_IDS.length,
    },
    summary: {
      diagnosticsPassed: records.length,
      exactSourceDeliveryPassed: records.filter(
        (record) => record.exactSourceBytesVerified,
      ).length,
      localRuffleLoadPassed: records.filter(
        (record) => record.ruffleLoadPromiseResolved,
      ).length,
      native800x600PngCreated: records.filter(
        (record) => record.native800x600PngCreated,
      ).length,
      loopbackNetworkContainmentPassed: records.filter(
        (record) =>
          record.allExecutedHttpRequestsExactLoopbackOrigin &&
          !record.blockedRequestsReachedServer,
      ).length,
      unexpectedExternalRequests: records.reduce(
        (sum, record) => sum + record.unexpectedExternalRequestCount,
        0,
      ),
      blockedLocalRequests: records.reduce(
        (sum, record) => sum + record.blockedLocalRequestCount,
        0,
      ),
      blockedRequestsReachedServer: records.filter(
        (record) => record.blockedRequestsReachedServer,
      ).length,
      consoleErrors: records.reduce(
        (sum, record) => sum + record.consoleErrorCount,
        0,
      ),
      pageErrors: records.reduce(
        (sum, record) => sum + record.pageErrorCount,
        0,
      ),
      uniformReferenceSurfaces: uniformRecords.length,
      nonuniformReferenceSurfaces: nonuniformRecords.length,
      deterministicSourceFrameBindings: 0,
      authoritativeOriginalRuntimeBaselines: 0,
      audioAcceptances: 0,
      interactionAcceptances: 0,
      fidelityAcceptances: 0,
      strictAcceptanceEffects: 0,
    },
    blockers: records.length === 0
      ? []
      : [
        {
          blockerId: "standalone-page-host-entry-unresolved",
          affectedAnimationIds:
            uniformRecords.map(({animationId}) => animationId),
          observation:
            "Seven selected page SWFs produced the same uniform 800x600 surface after Ruffle load and the fixed delay.",
          inferenceBoundary:
            "This does not prove the cause. Original shell globals, language state, dependency loading, and natural entry behavior remain unresolved.",
          acceptanceEffect: false,
        },
        {
          blockerId: "shell-local-dependencies-denied-by-probe",
          affectedAnimationIds: shellRecord ? [shellRecord.animationId] : [],
          blockedLocalRequests:
            shellRecord?.blockedLocalRequests ?? [],
          consoleErrorCount: shellRecord?.consoleErrorCount ?? 0,
          pageErrorCount: shellRecord?.pageErrorCount ?? 0,
          observation:
            "The shell produced a nonuniform surface, while its two unallowlisted local dependency requests were aborted before reaching the server and surfaced as two ERR_BLOCKED_BY_CLIENT console errors.",
          safetyBoundary:
            "Do not expose a broad legacy tree. Any future dependency sandbox must be explicit, hash-bound, development-only, and network-denied.",
          acceptanceEffect: false,
        },
        {
          blockerId: "no-deterministic-frame-behavior-audio-contract",
          affectedAnimationIds: [...RISK_IDS],
          observation:
            "The route has no deterministic source-frame, host-entry, scenario, interaction, Replay, or audio-listening contract.",
          acceptanceEffect: false,
        },
      ],
    records,
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: false,
      statement:
        "Passing records prove only exact local source delivery, local Ruffle loading, loopback/network containment, and 800x600 PNG creation. They do not prove a source frame, original runtime, audio, interaction, fidelity, review, strict completion, or publication.",
    },
  };
}

export async function buildG5L5RuffleReferenceMatrix({
  requireDiagnostics = true,
} = {}) {
  const [
    releasesBytes,
    ledgerBytes,
    catalogBytes,
    riskBytes,
    toolchainBytes,
  ] = await Promise.all([
    readFile(RELEASES_PATH),
    readFile(RELEASE_LEDGER_PATH),
    readFile(CATALOG_PATH),
    readFile(RISK_PATH),
    readFile(TOOLCHAIN_PATH),
  ]);
  const releases = JSON.parse(releasesBytes);
  const releaseLedger = JSON.parse(ledgerBytes);
  const catalog = JSON.parse(catalogBytes);
  const risk = JSON.parse(riskBytes);
  const toolchain = JSON.parse(toolchainBytes);
  const release = validateRelease(releases);
  const ledgerRelease = validateReleaseLedger(releaseLedger);
  validateRisk(risk, release);
  invariant(
    Array.isArray(catalog.animations),
    "animation catalog is malformed",
  );
  const catalogById = new Map(
    catalog.animations.map((item) => [item.animationId, item]),
  );
  const riskById = new Map(
    risk.items.map((item) => [item.animationId, item]),
  );
  const queue = [];
  for (const member of release.members) {
    queue.push(
      await buildQueueItem(
        member,
        catalogById.get(member.animationId),
        riskById,
      ),
    );
  }
  invariant(
    queue.length === 57 &&
      queue.every((item, index) => item.queueOrdinal === index + 1) &&
      queue.filter((item) => item.riskCalibration.selected).length === 8,
    "G5 L5 Ruffle queue scope drifted",
  );

  const routeBoundary = await referenceRouteBoundary();
  const ruffleDistribution =
    await ruffleDistributionBinding(toolchain);
  const representativeDiagnostics = await bindDiagnostics(queue, risk, {
    required: requireDiagnostics,
  });
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-ruffle-forensic-reference-matrix",
    releaseId: RELEASE_ID,
    evidenceState: requireDiagnostics
      ? "eight-risk-calibration-local-route-load-diagnostics-bound"
      : "queue-and-commands-prepared-diagnostics-pending",
    generator: {
      ...(await bindFile(scriptPath)),
      version: 1,
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetChanges: 0,
      sourceSwfCopiesCreated: 0,
      productionExposureChanges: 0,
      migrationStatusChanges: 0,
      originalRuntimeAuthority: false,
      sourceFrameAuthority: false,
      audioAuthority: false,
      interactionAuthority: false,
      fidelityAuthority: false,
      humanReviewAuthority: false,
      ownerAcceptanceAuthority: false,
      strictAcceptanceEffect: false,
      publicationEffect: false,
      statement:
        "This matrix and its diagnostics are local forensic compatibility evidence only. They authorize no implementation and establish no source frame, original-runtime baseline, audio, interaction, fidelity, review, strict completion, or publication.",
    },
    sourceBindings: {
      releaseManifest: {
        path: portable(RELEASES_PATH),
        bytes: releasesBytes.length,
        sha256: sha256(releasesBytes),
      },
      releaseLedger: {
        path: portable(RELEASE_LEDGER_PATH),
        bytes: ledgerBytes.length,
        sha256: sha256(ledgerBytes),
        strictCompleteCount: ledgerRelease.strictCompleteCount,
        published: ledgerRelease.published,
      },
      animationCatalog: {
        path: portable(CATALOG_PATH),
        bytes: catalogBytes.length,
        sha256: sha256(catalogBytes),
      },
      riskCalibration: {
        path: portable(RISK_PATH),
        bytes: riskBytes.length,
        sha256: sha256(riskBytes),
        selectedMemberCount: risk.items.length,
      },
      toolchain: {
        path: portable(TOOLCHAIN_PATH),
        bytes: toolchainBytes.length,
        sha256: sha256(toolchainBytes),
      },
    },
    lesson: {
      releaseId: RELEASE_ID,
      grade: 5,
      lesson: 5,
      titleDisplay: "Add & Subtract Negative Numbers",
      releaseMembers: 57,
      activeXmlPages: 56,
      courseShells: 1,
      publicationMode: "atomic",
      strictCompletion: "0/57",
      published: false,
    },
    localReferenceRuntime: {
      routeBoundary,
      ruffleDistribution,
      serverCommand: {
        argv: [
          "npm",
          "run",
          "dev",
          "--workspace",
          "@helpmath/web",
          "--",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3105",
        ],
        shell:
          "npm run dev --workspace @helpmath/web -- --hostname 127.0.0.1 --port 3105",
        requiredEnvironment: "development",
        loopbackOnly: true,
      },
    },
    diagnosticExecutionPolicy: {
      queuePreparedForAllReleaseMembers: true,
      executeWholeReleaseNow: false,
      representativeSelectionSource:
        "existing exact eight-member G5 L5 risk-calibration set",
      representativeAnimationIds: [...RISK_IDS],
      representativeLanguage: "en",
      representativeCount: 8,
      reason:
        "The complete risk-calibration set is small enough for bounded route-load diagnostics and covers shell, SWF-only, paired-FLA, instruction, practice, game, test, quiz, branch, random, audio-tag, and legacy-side-effect risk signals. Execution remains nondeterministic and acceptance-neutral.",
      rawFullFrameArchiveCreated: false,
    },
    representativeDiagnostics,
    unresolvedEvidence: {
      deterministicSourceFrames: 0,
      authoritativeOriginalRuntimeBaselines: 0,
      acceptedAudioSessions: 0,
      interactionTracesAccepted: 0,
      rmseBaselines: 0,
      humanReviewsAccepted: 0,
      ownerAcceptances: 0,
      strictCompletions: 0,
      publications: 0,
    },
    summary: {
      queueItems: queue.length,
      physicallyVerifiedSourceSwfs: queue.filter(
        (item) => item.source.swf.physicalBytesAndHashVerifiedNow,
      ).length,
      sourceSwfsCopiedIntoPublic: queue.filter(
        (item) => item.source.swf.copiedIntoWebPublic,
      ).length,
      native800x600Items: queue.filter(
        (item) =>
          item.runtime.stage.width === 800 &&
          item.runtime.stage.height === 600,
      ).length,
      twelveFpsItems: queue.filter((item) => item.runtime.fps === 12).length,
      rootFrameCountSum: queue.reduce(
        (sum, item) => sum + item.runtime.rootFrameCount,
        0,
      ),
      riskCalibrationQueueItems: queue.filter(
        (item) => item.riskCalibration.selected,
      ).length,
      representativeDiagnosticsPassed:
        representativeDiagnostics.summary.diagnosticsPassed,
      exactSourceDeliveryDiagnosticsPassed:
        representativeDiagnostics.summary.exactSourceDeliveryPassed,
      localRuffleLoadDiagnosticsPassed:
        representativeDiagnostics.summary.localRuffleLoadPassed,
      loopbackNetworkContainmentDiagnosticsPassed:
        representativeDiagnostics.summary.loopbackNetworkContainmentPassed,
      native800x600PngDiagnosticsCreated:
        representativeDiagnostics.summary.native800x600PngCreated,
      deterministicSourceFrameEvidence: 0,
      authoritativeOriginalRuntimeEvidence: 0,
      audioAcceptanceEvidence: 0,
      interactionAcceptanceEvidence: 0,
      fidelityAcceptanceEvidence: 0,
      strictMigrationCompletions: 0,
      publications: 0,
    },
    queue,
    strictAcceptanceEffect:
      "none; local Ruffle delivery, load, containment, and PNG diagnostics are forensic compatibility observations only",
  };
  return validateG5L5RuffleReferenceMatrix(report, {
    diagnosticsRequired: requireDiagnostics,
  });
}

export function validateG5L5RuffleReferenceMatrix(
  report,
  {diagnosticsRequired = true} = {},
) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-ruffle-forensic-reference-matrix" &&
      report.releaseId === RELEASE_ID,
    "G5 L5 Ruffle matrix identity drifted",
  );
  invariant(
    report.lesson?.releaseMembers === 57 &&
      report.lesson.activeXmlPages === 56 &&
      report.lesson.courseShells === 1 &&
      report.lesson.strictCompletion === "0/57" &&
      report.lesson.published === false,
    "G5 L5 Ruffle matrix lesson boundary drifted",
  );
  invariant(
    report.localReferenceRuntime?.routeBoundary?.developmentApiOnly === true &&
      report.localReferenceRuntime.routeBoundary.productionExposure ===
        false &&
      report.localReferenceRuntime.routeBoundary.productWebPublicSwfCount ===
        0 &&
      report.localReferenceRuntime.routeBoundary.sourceSwfCopiesCreated ===
        0 &&
      JSON.stringify(
        report.localReferenceRuntime.routeBoundary
          .productionGuardExpectedStatuses,
      ) === JSON.stringify({
        referencePage: 404,
        referenceSwfApi: 404,
        ruffleAssetApi: 404,
      }) &&
      report.localReferenceRuntime.routeBoundary
        .productionGuardStaticVerification === true &&
      report.localReferenceRuntime.routeBoundary.productionHttpObservation ===
        null &&
      JSON.stringify(
        report.localReferenceRuntime.routeBoundary.ruffleOptions,
      ) === JSON.stringify({
        allowNetworking: "none",
        allowScriptAccess: false,
        openUrlMode: "deny",
      }),
    "local-only Ruffle route boundary drifted",
  );
  invariant(
    report.localReferenceRuntime.ruffleDistribution?.role ===
        "forensic-reference-only" &&
      report.localReferenceRuntime.ruffleDistribution.package ===
        "@ruffle-rs/ruffle" &&
      HEX_64.test(
        report.localReferenceRuntime.ruffleDistribution
          .distributionSha256 || "",
      ),
    "Ruffle distribution binding drifted",
  );
  invariant(
    report.acceptance?.acceptanceNeutral === true &&
      Object.entries(report.acceptance)
        .filter(([key]) =>
          key.endsWith("Authority") ||
          key === "strictAcceptanceEffect" ||
          key === "publicationEffect")
        .every(([, value]) => value === false),
    "Ruffle matrix claimed authority or acceptance",
  );
  invariant(
    Array.isArray(report.queue) &&
      report.queue.length === 57 &&
      report.queue.every((item, index) =>
        item.queueOrdinal === index + 1 &&
        item.assetId === `swf-${item.source.swf.sha256}` &&
        item.source.swf.physicalBytesAndHashVerifiedNow === true &&
        item.source.swf.regularNonSymlinkFile === true &&
        item.source.swf.copiedIntoWebPublic === false &&
        item.runtime.stage.width === 800 &&
        item.runtime.stage.height === 600 &&
        item.runtime.fps === 12 &&
        item.runtime.exactSourceFrameObservedByThisQueue === null &&
        item.safety.networking === "none" &&
        item.safety.scriptAccess === false &&
        item.safety.openUrl === "deny" &&
        item.evidenceBoundary.strictAcceptanceEffect === false),
    "Ruffle queue scope, source, runtime, or safety boundary drifted",
  );
  invariant(
    JSON.stringify(
      report.queue.filter(
        (item) => item.riskCalibration.selected,
      ).map((item) => item.animationId),
    ) === JSON.stringify(
      [...RISK_IDS].sort(
        (a, b) =>
          report.queue.find((item) => item.animationId === a).queueOrdinal -
          report.queue.find((item) => item.animationId === b).queueOrdinal,
      ),
    ),
    "risk-calibration queue membership drifted",
  );
  invariant(
    report.diagnosticExecutionPolicy?.representativeCount === 8 &&
      JSON.stringify(
        report.diagnosticExecutionPolicy.representativeAnimationIds,
      ) === JSON.stringify(RISK_IDS),
    "representative diagnostic selection drifted",
  );
  const diagnostics = report.representativeDiagnostics;
  invariant(
    diagnostics?.selection?.selectedCount === 8 &&
      JSON.stringify(diagnostics.selection.animationIds) ===
        JSON.stringify(RISK_IDS) &&
      diagnostics.selection.language === "en" &&
      diagnostics.selection.fixedDelayAfterRuffleLoadMs === 3500 &&
      diagnostics.acceptance?.acceptanceNeutral === true &&
      diagnostics.acceptance.strictAcceptanceEffect === false,
    "representative diagnostic scope drifted",
  );
  const expectedExecuted = diagnosticsRequired ? 8 : 0;
  invariant(
    diagnostics.selection.executedCount === expectedExecuted &&
      diagnostics.records.length === expectedExecuted &&
      diagnostics.summary.diagnosticsPassed === expectedExecuted &&
      diagnostics.summary.exactSourceDeliveryPassed === expectedExecuted &&
      diagnostics.summary.localRuffleLoadPassed === expectedExecuted &&
      diagnostics.summary.native800x600PngCreated === expectedExecuted &&
      diagnostics.summary.loopbackNetworkContainmentPassed ===
        expectedExecuted &&
      diagnostics.summary.unexpectedExternalRequests === 0 &&
      diagnostics.summary.blockedRequestsReachedServer === 0 &&
      diagnostics.summary.uniformReferenceSurfaces ===
        (diagnosticsRequired ? 7 : 0) &&
      diagnostics.summary.nonuniformReferenceSurfaces ===
        (diagnosticsRequired ? 1 : 0) &&
      diagnostics.summary.deterministicSourceFrameBindings === 0 &&
      diagnostics.summary.authoritativeOriginalRuntimeBaselines === 0 &&
      diagnostics.summary.audioAcceptances === 0 &&
      diagnostics.summary.interactionAcceptances === 0 &&
      diagnostics.summary.fidelityAcceptances === 0 &&
      diagnostics.summary.strictAcceptanceEffects === 0,
    "representative diagnostic results drifted or were promoted",
  );
  invariant(
    diagnostics.records.every(
      (record) =>
        record.exactSourceBytesVerified === true &&
        record.ruffleLoadPromiseResolved === true &&
        record.native800x600PngCreated === true &&
        record.allExecutedHttpRequestsExactLoopbackOrigin === true &&
        record.unexpectedExternalRequestCount === 0 &&
        record.blockedRequestsReachedServer === false &&
        record.screenshot.width === 800 &&
        record.screenshot.height === 600 &&
        record.screenshot.sourceFrameBinding === null &&
        Object.values(record.authority).every((value) => value === false),
    ),
    "a representative diagnostic claimed unsupported authority",
  );
  invariant(
    !diagnosticsRequired ||
      (
        Array.isArray(diagnostics.blockers) &&
        diagnostics.blockers.length === 3 &&
        diagnostics.blockers[0].blockerId ===
          "standalone-page-host-entry-unresolved" &&
        diagnostics.blockers[0].affectedAnimationIds.length === 7 &&
        diagnostics.blockers[1].blockerId ===
          "shell-local-dependencies-denied-by-probe" &&
        diagnostics.blockers[1].blockedLocalRequests.length === 2 &&
        diagnostics.blockers[1].consoleErrorCount === 2 &&
        diagnostics.blockers[1].pageErrorCount === 0 &&
        diagnostics.blockers[2].blockerId ===
          "no-deterministic-frame-behavior-audio-contract" &&
        diagnostics.blockers.every(
          (blocker) => blocker.acceptanceEffect === false,
        )
      ),
    "representative diagnostic blockers drifted or claimed acceptance",
  );
  invariant(
    report.sourceBindings?.releaseLedger?.strictCompleteCount === 0 &&
      report.sourceBindings.releaseLedger.published === false &&
      report.summary?.queueItems === 57 &&
      report.summary.physicallyVerifiedSourceSwfs === 57 &&
      report.summary.sourceSwfsCopiedIntoPublic === 0 &&
      report.summary.native800x600Items === 57 &&
      report.summary.twelveFpsItems === 57 &&
      report.summary.rootFrameCountSum === 610 &&
      report.summary.riskCalibrationQueueItems === 8 &&
      report.summary.deterministicSourceFrameEvidence === 0 &&
      report.summary.authoritativeOriginalRuntimeEvidence === 0 &&
      report.summary.audioAcceptanceEvidence === 0 &&
      report.summary.interactionAcceptanceEvidence === 0 &&
      report.summary.fidelityAcceptanceEvidence === 0 &&
      report.summary.strictMigrationCompletions === 0 &&
      report.summary.publications === 0,
    "Ruffle matrix summary or release boundary drifted",
  );
  invariant(
    Object.values(report.unresolvedEvidence || {}).every(
      (value) => value === 0,
    ) &&
      typeof report.strictAcceptanceEffect === "string" &&
      report.strictAcceptanceEffect.startsWith("none;"),
    "Ruffle matrix changed an evidence or acceptance gate",
  );
  return report;
}

export function renderG5L5RuffleReferenceMarkdown(report) {
  validateG5L5RuffleReferenceMatrix(report, {
    diagnosticsRequired:
      report.representativeDiagnostics.records.length === 8,
  });
  const diagnostics = report.representativeDiagnostics;
  const lines = [
    "# G5 L5 Ruffle Forensic Reference Matrix",
    "",
    `Release: \`${RELEASE_ID}\` — **Add & Subtract Negative Numbers**`,
    "",
    `Queue: **${report.summary.queueItems}/57** exact members; physically verified source SWFs: **${report.summary.physicallyVerifiedSourceSwfs}/57**.`,
    `Representative diagnostics: **${diagnostics.summary.diagnosticsPassed}/8** from the exact existing risk-calibration set.`,
    "",
    "## Local-only safety boundary",
    "",
    "- Development reference page/API only; source guards require 404 in production. This matrix did not launch a production server or claim an observed production HTTP status.",
    "- Frozen SWF bytes are streamed on demand with `no-store`; SWF copies in `apps/web/public`: **0**.",
    "- Ruffle configuration: `allowNetworking: none`, `allowScriptAccess: false`, `openUrlMode: deny`.",
    `- Ruffle: \`${report.localReferenceRuntime.ruffleDistribution.package}@${report.localReferenceRuntime.ruffleDistribution.version}\`.`,
    "",
    "## Representative English diagnostics",
    "",
    "| # | Animation | Release # | Exact source | Ruffle load | Loopback containment | PNG | Blocked local | Console/page errors |",
    "|---:|---|---:|---|---|---|---|---:|---:|",
  ];
  for (const record of diagnostics.records) {
    lines.push(
      `| ${record.riskSelectionOrdinal} | \`${record.animationId}\` | ${record.releaseOrdinal} | pass | pass | pass | 800×600 | ${record.blockedLocalRequestCount} | ${record.consoleErrorCount}/${record.pageErrorCount} |`,
    );
  }
  if (diagnostics.records.length === 0) {
    lines.push(
      "| — | Commands prepared; diagnostics pending | — | — | — | — | — | — | — |",
    );
  }
  lines.push(
    "",
    "The eight-member selection covers the bound shell, SWF-only and paired-FLA members, instructional and practice interaction risks, game/test/quiz state, branch/random risks, embedded audio tags, and legacy side-effect candidates. These are selection axes, not accepted coverage.",
    "",
    "Observed surfaces: **7 uniform page surfaces / 1 nonuniform shell surface**. The shell attempted **2** unallowlisted local dependency reads; both were blocked before server execution, producing **2** recorded browser console errors and **0** page errors. This is a dependency/host-entry diagnostic, not behavior acceptance.",
    "",
    "## Commands",
    "",
    "Start the loopback development server:",
    "",
    "```bash",
    report.localReferenceRuntime.serverCommand.shell,
    "```",
    "",
    "Each of the 57 queue records contains exact English and Spanish probe commands. Example:",
    "",
    "```bash",
    report.queue[0].commands.englishDiagnostic.shell,
    "```",
    "",
    "## Acceptance-neutral boundary",
    "",
    "- Exact source frame evidence: **0**",
    "- Authoritative original-runtime baselines: **0**",
    "- Audio and interaction acceptances: **0 / 0**",
    "- Fidelity/human/Owner acceptances: **0 / 0 / 0**",
    "- Strict completion / publication: **0/57 / false**",
    "",
    "A passing diagnostic proves only exact source delivery, local Ruffle loading, loopback/network containment, and an 800×600 PNG after a fixed delay. It does not prove source-frame identity, baseline behavior, audio, interaction, fidelity, or acceptance.",
    "",
    "## 57-member queue",
    "",
    "| # | Animation | Role | Source SHA-256 | Root frames | Risk calibration |",
    "|---:|---|---|---|---:|---|",
  );
  for (const item of report.queue) {
    lines.push(
      `| ${item.queueOrdinal} | \`${item.animationId}\` | ${item.releaseRole} | \`${item.source.swf.sha256}\` | ${item.runtime.rootFrameCount} | ${item.riskCalibration.selected ? `selected #${item.riskCalibration.selectionOrdinal}` : "no"} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    prepare: false,
    json: DEFAULT_JSON,
    markdown: DEFAULT_MARKDOWN,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--prepare") options.prepare = true;
    else if (value === "--json") {
      options.json = path.resolve(argv[++index] ?? "");
    } else if (value === "--markdown") {
      options.markdown = path.resolve(argv[++index] ?? "");
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  invariant(
    !(options.check && options.prepare),
    "--check requires completed diagnostics and cannot be combined with --prepare",
  );
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildG5L5RuffleReferenceMatrix({
    requireDiagnostics: !options.prepare,
  });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = `${renderG5L5RuffleReferenceMarkdown(report)}\n`;
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.json, "utf8"),
      readFile(options.markdown, "utf8"),
    ]);
    invariant(currentJson === json, `${portable(options.json)} is stale`);
    invariant(
      currentMarkdown === markdown,
      `${portable(options.markdown)} is stale`,
    );
    process.stdout.write(
      `PASS ${portable(options.json)} and ${portable(options.markdown)}\n`,
    );
    return;
  }
  await Promise.all([
    writeFile(options.json, json),
    writeFile(options.markdown, markdown),
  ]);
  process.stdout.write(`Wrote ${portable(options.json)}\n`);
  process.stdout.write(`Wrote ${portable(options.markdown)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
