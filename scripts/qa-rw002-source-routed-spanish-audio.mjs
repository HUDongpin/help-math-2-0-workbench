#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {
  RW002_TRACE_REBIND_RECEIPT,
  buildRw002TraceGeneratorProvenanceRebindReceipt,
  validateRw002TraceGeneratorProvenanceRebindReceipt,
} from "./build-rw002-trace-generator-provenance-rebind-receipt.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "course-g05-l13-rw-002";
const publicMp3Path = "/flash-assets/audio/courses/course-g05-l13-rw-002/es.mp3";
const sourceMp3Path =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3";
const expectedMp3Sha256 = "2e809c69df60cec11427a71d38b37b830a0a9ec805e3c8ff4f68734cb53bfcd2";
const outputPath = path.join(
  projectRoot,
  "migrations/course-g05-l13-rw-002/evidence/source-routed-spanish-audio-product-qa.json",
);

const bindingPaths = Object.freeze({
  module: "packages/demos/src/modules/course-g05-l13-rw-002.tsx",
  timeline: "packages/demos/src/timelines/course-g05-l13-rw-002.ts",
  englishSourceSchedule:
    "migrations/course-g05-l13-rw-002/audit/trace-specs/req-sprite-334-default-en.json",
  spanishSourceSchedule:
    "migrations/course-g05-l13-rw-002/audit/trace-specs/req-sprite-334-default-es.json",
  traceGeneratorProvenanceRebindReceipt: RW002_TRACE_REBIND_RECEIPT,
  productRuntime: "apps/web/components/animation-runtime.tsx",
  runtimeContract: "packages/demos/src/contract.ts",
  runtimeHelpers: "packages/demos/src/runtime.ts",
  sourceMp3: sourceMp3Path,
  publicMp3: `public${publicMp3Path}`,
  publicAudioManifest: "public/flash-assets/audio/courses/manifest.json",
  machineAudioAudit:
    "migrations/course-g05-l13-rw-002/audit/audio-runtime-evidence.json",
  assetInventory: "migrations/course-g05-l13-rw-002/asset-inventory.csv",
  productQaGenerator: "scripts/qa-rw002-source-routed-spanish-audio.mjs",
  productQaContractTest: "packages/demos/tests/course-g05-l13-rw-002.test.ts",
});

const falseClaims = Object.freeze({
  authoritativeOriginalRuntimeBaseline: false,
  naturalOriginalRuntimeTraversal: false,
  interactionBranchParity: false,
  bilingualVisualParity: false,
  audioParity: false,
  audioListeningAcceptance: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  engineeringAcceptance: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function validateLocalBaseUrl(value) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("--base-url must use http or https");
  }
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error("--base-url must resolve to localhost, 127.0.0.1, or ::1");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("--base-url cannot include credentials, a query, or a fragment");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  return parsed.toString().replace(/\/$/, "");
}

function parseArguments(argv) {
  let baseUrl = "http://127.0.0.1:3000";
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--help" || value === "-h") {
      return {help: true, baseUrl: validateLocalBaseUrl(baseUrl)};
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return {help: false, baseUrl: validateLocalBaseUrl(baseUrl)};
}

function isAllowedLocalRequest(requestUrl, baseUrl) {
  const requested = new URL(requestUrl);
  if (["data:", "blob:", "about:"].includes(requested.protocol)) return true;
  if (!["http:", "https:", "ws:", "wss:"].includes(requested.protocol)) return false;
  const base = new URL(baseUrl);
  const requestedHost = requested.hostname.replace(/^\[|\]$/g, "");
  const baseHost = base.hostname.replace(/^\[|\]$/g, "");
  const requestedPort =
    requested.port || (["https:", "wss:"].includes(requested.protocol) ? "443" : "80");
  const basePort = base.port || (base.protocol === "https:" ? "443" : "80");
  return (
    requestedHost === baseHost &&
    requestedPort === basePort &&
    ["localhost", "127.0.0.1", "::1"].includes(requestedHost)
  );
}

async function fileBinding(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {file: relativePath, sha256: sha256(bytes)};
}

async function observeSourceSharedSilentPage(browser, baseUrl, relativeUrl, expectedIdentity = {}) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 1000},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const requests = [];
  const unexpectedRequests = [];
  const failedRequests = [];
  const httpErrors = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];

  page.on("request", (request) => {
    const url = request.url();
    requests.push(url);
    try {
      if (!isAllowedLocalRequest(url, baseUrl)) unexpectedRequests.push(url);
    } catch {
      unexpectedRequests.push(url);
    }
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({url: request.url(), error: request.failure()?.errorText || "failed"});
  });
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push({url: response.url(), status: response.status()});
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const target = new URL(relativeUrl, `${baseUrl}/`).toString();
  const response = await page.goto(target, {waitUntil: "domcontentloaded"});
  const readyCandidate = page
    .locator(
      '[data-candidate-status="engineering-not-strict"][data-canvas-status="ready"]',
    )
    .first();
  await readyCandidate.waitFor({state: "visible", timeout: 30_000});
  await page.waitForLoadState("networkidle");

  const state = await page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    const candidate = document.querySelector("[data-candidate-status]");
    const blocker = document.querySelector("[data-fail-closed-reason]");
    return {
      resolvedFrameDomain: runtime?.getAttribute("data-flash-frame-domain") || null,
      resolvedFrame: runtime?.getAttribute("data-flash-frame") || null,
      resolvedRootFrame: runtime?.getAttribute("data-flash-root-frame") || null,
      resolvedRequirementId: runtime?.getAttribute("data-flash-requirement-id") || null,
      resolvedTraceId: runtime?.getAttribute("data-flash-trace-id") || null,
      resolvedEntryStateSha256:
        runtime?.getAttribute("data-flash-entry-state-sha256") || null,
      resolvedScenario: runtime?.getAttribute("data-runtime-scenario") || null,
      resolvedLanguage: runtime?.getAttribute("data-runtime-language") || null,
      resolvedSeed: runtime?.getAttribute("data-runtime-seed") || null,
      candidateStatus: candidate?.getAttribute("data-candidate-status") || null,
      candidateCanvasStatus: candidate?.getAttribute("data-canvas-status") || null,
      visualLocalizationStatus:
        candidate?.getAttribute("data-visual-localization-status") || null,
      audioLocalizationStatus:
        candidate?.getAttribute("data-audio-localization-status") || null,
      candidateAudioRendered: candidate?.getAttribute("data-audio-rendered") || null,
      audioControlRendered: document.querySelectorAll(".runtime-audio-controls").length > 0,
      failClosedReason: blocker?.getAttribute("data-fail-closed-reason") || null,
    };
  });

  const requestedMp3 = requests.filter((requestUrl) => {
    try {
      return new URL(requestUrl).pathname === publicMp3Path;
    } catch {
      return false;
    }
  });
  const allMp3Requests = requests.filter((requestUrl) => {
    try {
      return /\.mp3$/i.test(new URL(requestUrl).pathname);
    } catch {
      return false;
    }
  });
  const uniqueUnexpectedRequests = [...new Set(unexpectedRequests)].sort();
  const observations = {
    ...state,
    publicMp3Requested: requestedMp3.length > 0,
    publicMp3RequestCount: requestedMp3.length,
    anyMp3Requested: allMp3Requests.length > 0,
    allMp3RequestCount: allMp3Requests.length,
    externalRequestCount: uniqueUnexpectedRequests.length,
    consoleErrorCount: consoleErrors.length,
    consoleWarningCount: consoleWarnings.length,
    pageErrorCount: pageErrors.length,
    failedRequestCount: failedRequests.length,
    httpErrorCount: httpErrors.length,
  };
  const identityMatches = Object.entries(expectedIdentity).every(
    ([field, expected]) => state[field] === String(expected),
  );
  const pass =
    response?.status() === 200 &&
    state.resolvedFrameDomain === "sprite-334" &&
    state.resolvedScenario === "default" &&
    state.resolvedLanguage === "es" &&
    state.candidateStatus === "engineering-not-strict" &&
    state.candidateCanvasStatus === "ready" &&
    state.visualLocalizationStatus === "source-shared-untranslated-visual" &&
    state.audioLocalizationStatus === "unresolved" &&
    state.audioControlRendered === false &&
    state.candidateAudioRendered === "false" &&
    state.failClosedReason === null &&
    requestedMp3.length === 0 &&
    allMp3Requests.length === 0 &&
    identityMatches &&
    uniqueUnexpectedRequests.length === 0 &&
    consoleErrors.length === 0 &&
    consoleWarnings.length === 0 &&
    pageErrors.length === 0 &&
    failedRequests.length === 0 &&
    httpErrors.length === 0;

  const result = {
    url: target,
    httpStatus: response?.status() ?? null,
    observations,
    diagnostics: {
      expectedIdentity,
      identityMatches,
      unexpectedRequests: uniqueUnexpectedRequests,
      failedRequests,
      httpErrors,
      consoleErrors,
      consoleWarnings,
      pageErrors,
    },
    pass,
  };
  await context.close();
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/qa-rw002-source-routed-spanish-audio.mjs [--base-url http://127.0.0.1:3000]\n",
    );
    return;
  }

  const traceRebindCheck =
    await buildRw002TraceGeneratorProvenanceRebindReceipt({check: true});
  const traceRebindReceipt = validateRw002TraceGeneratorProvenanceRebindReceipt(
    JSON.parse(
      await readFile(path.join(projectRoot, RW002_TRACE_REBIND_RECEIPT), "utf8"),
    ),
  );
  const migrationPath = path.join(projectRoot, "migrations/course-g05-l13-rw-002/migration.json");
  const migrationBefore = await readFile(migrationPath);
  const sourcePath = path.join(
    projectRoot,
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
  );
  const sourceBefore = await readFile(sourcePath);
  const bindingsBefore = Object.fromEntries(
    await Promise.all(
      Object.entries(bindingPaths).map(async ([name, relativePath]) => [
        name,
        await fileBinding(relativePath),
      ]),
    ),
  );
  const [sourceMp3Before, publicMp3Before, publicAudioManifestBefore] = await Promise.all([
    readFile(path.join(projectRoot, sourceMp3Path)),
    readFile(path.join(projectRoot, `public${publicMp3Path}`)),
    readFile(path.join(projectRoot, "public/flash-assets/audio/courses/manifest.json"), "utf8"),
  ]);
  const publicAudioManifest = JSON.parse(publicAudioManifestBefore);
  const publicAudioEntry = publicAudioManifest.entries?.find(
    (entry) => entry.animationId === animationId,
  );
  const exactBytesStagedAndHashVerified =
    sha256(sourceMp3Before) === expectedMp3Sha256 &&
    sha256(publicMp3Before) === expectedMp3Sha256 &&
    sourceMp3Before.equals(publicMp3Before) &&
    publicAudioEntry?.sourceEvidence === sourceMp3Path &&
    publicAudioEntry?.sourceSha256 === expectedMp3Sha256 &&
    publicAudioEntry?.output === `public${publicMp3Path}` &&
    publicAudioEntry?.publicUrl === publicMp3Path &&
    publicAudioEntry?.authoritativeListeningComplete === false &&
    publicAudioEntry?.synchronizationComplete === false;
  const playwrightPackage = JSON.parse(
    await readFile(path.join(projectRoot, "node_modules/playwright/package.json"), "utf8"),
  );

  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  let normalPlaybackPage;
  let deterministicCapturePage;
  try {
    normalPlaybackPage = await observeSourceSharedSilentPage(
      browser,
      options.baseUrl,
      `/es/animations/${animationId}?frameDomain=sprite-334&scenario=default&lang=es&seed=0`,
    );
    deterministicCapturePage = await observeSourceSharedSilentPage(
      browser,
      options.baseUrl,
      `/es/animations/${animationId}?frame=673&frameDomain=sprite-334&requirementId=req%3Asprite-334%3Adefault%3Aes&trace=trace%3Asprite-334%3Adefault%3Aes%3Aseed-0&entryStateSha256=0bda9c80f421867fd61887683bd1fd697a17b4da274317bdd7ae31d65d2a81fc&scenario=default&lang=es&seed=0&capture=1`,
      {
        resolvedFrameDomain: "sprite-334",
        resolvedFrame: "673",
        resolvedRootFrame: "6",
        resolvedRequirementId: "req:sprite-334:default:es",
        resolvedTraceId: "trace:sprite-334:default:es:seed-0",
        resolvedEntryStateSha256:
          "0bda9c80f421867fd61887683bd1fd697a17b4da274317bdd7ae31d65d2a81fc",
        resolvedScenario: "default",
        resolvedLanguage: "es",
        resolvedSeed: "0",
      },
    );
  } finally {
    await browser.close();
  }

  const migrationAfter = await readFile(migrationPath);
  const sourceAfter = await readFile(sourcePath);
  const bindingsAfter = Object.fromEntries(
    await Promise.all(
      Object.entries(bindingPaths).map(async ([name, relativePath]) => [
        name,
        await fileBinding(relativePath),
      ]),
    ),
  );
  const bindingsUnchangedDuringObservation =
    JSON.stringify(bindingsBefore) === JSON.stringify(bindingsAfter);
  const sourceAndControlsUnchanged =
    sha256(migrationBefore) === sha256(migrationAfter) &&
    sha256(sourceBefore) === sha256(sourceAfter);
  const bindings = bindingsBefore;
  const pass =
    normalPlaybackPage.pass &&
    deterministicCapturePage.pass &&
    sourceAndControlsUnchanged &&
    bindingsUnchangedDuringObservation &&
    exactBytesStagedAndHashVerified &&
    traceRebindCheck.traceCount === 2 &&
    traceRebindCheck.currentIndexVerified === true &&
    traceRebindCheck.strictAcceptanceEffect === "none" &&
    traceRebindReceipt.status ===
      "verified-acceptance-neutral-generator-provenance-only-rebind";
  const report = {
    schemaVersion: 2,
    artifactType:
      "source-routed-host-audio-withheld-source-shared-visual-machine-product-qa",
    animationId,
    recordedAt: new Date().toISOString(),
    generatedBy: {
      script: portable(scriptPath),
      scriptSha256: bindings.productQaGenerator.sha256,
      invocation: `node scripts/qa-rw002-source-routed-spanish-audio.mjs --base-url ${options.baseUrl}`,
      deterministic: false,
    },
    status: pass
      ? "machine-product-source-shared-visual-ready-with-strict-audio-gate-still-pending"
      : "machine-product-source-shared-visual-or-audio-withholding-check-failed",
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    authority:
      "Playwright browser observation of the current local JavaScript candidate rendering the same untranslated source visual in the es context while withholding audio control and retaining the exact staged MP3 bytes",
    authorityBoundary:
      "This receipt proves only that the current es route renders the source-shared untranslated JavaScript visual while the incomplete audio control is absent and no MP3 or external request occurs. It does not prove Spanish translation, bilingual visual parity, spoken language or content, human listening, original-host conditional resume and feedback-reset behavior, SoundStream synchronization, terminal behavior, Replay behavior, original-runtime parity, visual fidelity, human review, owner acceptance, or strict completion.",
    toolchain: {
      playwright: playwrightPackage.version,
      browser: `Chromium ${browserVersion}`,
      server: `Next.js development server at ${options.baseUrl}`,
    },
    bindings,
    traceGeneratorProvenanceRebind: {
      status: traceRebindReceipt.status,
      receipt: bindings.traceGeneratorProvenanceRebindReceipt,
      englishNestedTrace: bindings.englishSourceSchedule,
      spanishNestedTrace: bindings.spanishSourceSchedule,
      exactChangedJsonPointerCountPerTrace:
        traceRebindCheck.exactChangedJsonPointerCountPerTrace,
      everyHistoricalTraceHashReconstructed:
        traceRebindCheck.everyHistoricalTraceHashReconstructed,
      sourceInputsUnchanged: traceRebindCheck.sourceInputsUnchanged,
      currentIndexVerified: traceRebindCheck.currentIndexVerified,
      strictAcceptanceEffect: "none",
    },
    normalPlaybackPage,
    deterministicCapturePage,
    controls: {
      sourceAndMigrationBytesUnchanged: sourceAndControlsUnchanged,
      bindingsUnchangedDuringObservation,
      sourceSwfSha256: sha256(sourceAfter),
      migrationSha256: sha256(migrationAfter),
    },
    audioAcceptance: {
      exactBytesStagedAndHashVerified,
      expectedMp3Sha256,
      userActivationProductPathPresent: false,
      controlWithheldReason:
        "The source host conditionally resumes only an eligible nonterminal child and resets feedback clips; the generic pause-while-playing control is not source-equivalent.",
      authoritativeListeningComplete: false,
      spokenLanguageAndContentAccepted: false,
      originalHostStateTraversalComplete: false,
      pauseResumeSynchronizationComplete: false,
      embeddedSoundStreamSynchronizationComplete: false,
      replayAudioResetAccepted: false,
      strictAudioAcceptance: "pending",
    },
    claims: {...falseClaims},
  };

  await mkdir(path.dirname(outputPath), {recursive: true});
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({status: pass ? "pass" : "fail", output: portable(outputPath), strictAcceptanceEffect: false}, null, 2)}\n`,
  );
  if (!pass) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
