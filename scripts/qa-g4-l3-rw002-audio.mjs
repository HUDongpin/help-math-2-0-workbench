#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const OUTPUT_JSON =
  "migrations/course-g04-l03-rw-002/evidence/current-javascript-audio-product-qa.json";
const OUTPUT_MARKDOWN =
  "migrations/course-g04-l03-rw-002/evidence/current-javascript-audio-product-qa.md";
const EMBEDDED_PATH =
  "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3";
const SPANISH_PATH =
  "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3";

const BINDINGS = Object.freeze([
  "packages/demos/src/modules/course-g04-l03-rw-002.tsx",
  "packages/demos/src/timelines/course-g04-l03-rw-002.ts",
  "packages/demos/tests/course-g04-l03-rw-002.test.ts",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
  "apps/web/components/animation-runtime.tsx",
  "scripts/sync-g4-l3-rw002-audio-assets.mjs",
  "public/flash-assets/courses/course-g04-l03-rw-002/audio/manifest.json",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function projectPath(relative) {
  invariant(
    typeof relative === "string" &&
      relative.length > 0 &&
      !path.isAbsolute(relative),
    "project-relative path is required",
  );
  const absolute = path.resolve(ROOT, relative);
  const resolvedRelative = path.relative(ROOT, absolute);
  invariant(
    resolvedRelative &&
      !resolvedRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(resolvedRelative),
    `path escapes project root: ${relative}`,
  );
  return absolute;
}

async function binding(relative) {
  const bytes = await readFile(projectPath(relative));
  return {path: relative, bytes: bytes.length, sha256: sha256(bytes)};
}

function localBaseUrl(value) {
  const parsed = new URL(value);
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  invariant(
    ["http:", "https:"].includes(parsed.protocol) &&
      ["127.0.0.1", "localhost", "::1"].includes(host) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    "--base-url must be an uncredentialed localhost HTTP(S) URL",
  );
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.toString().replace(/\/$/, "");
}

function allowedRequest(requestUrl, baseUrl) {
  const requested = new URL(requestUrl);
  if (["data:", "blob:", "about:"].includes(requested.protocol)) return true;
  const base = new URL(baseUrl);
  return (
    ["http:", "https:", "ws:", "wss:"].includes(requested.protocol) &&
    requested.hostname === base.hostname &&
    (requested.port ||
      (["https:", "wss:"].includes(requested.protocol) ? "443" : "80")) ===
      (base.port || (base.protocol === "https:" ? "443" : "80"))
  );
}

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    const records = [];
    const elements = [];
    Object.defineProperty(window, "__helpMathRw002AudioQa", {
      configurable: false,
      enumerable: false,
      value: {records, elements},
      writable: false,
    });
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function patchedPlay(...args) {
      const record = {
        source: this.currentSrc || this.src || "",
        status: "requested",
      };
      records.push(record);
      elements.push(this);
      const result = originalPlay.apply(this, args);
      Promise.resolve(result).then(
        () => {
          record.status = "playing";
        },
        (error) => {
          record.status = "rejected";
          record.error = error?.name || "play-rejected";
        },
      );
      return result;
    };
  });
}

function createDiagnostics(page, baseUrl) {
  const requests = [];
  const responses = [];
  const unexpectedRequests = [];
  const failedRequests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", (request) => {
    requests.push(request.url());
    try {
      if (!allowedRequest(request.url(), baseUrl)) {
        unexpectedRequests.push(request.url());
      }
    } catch {
      unexpectedRequests.push(request.url());
    }
  });
  page.on("response", (response) => {
    responses.push({url: response.url(), status: response.status()});
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "request-failed",
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return {
    requests,
    responses,
    unexpectedRequests,
    failedRequests,
    consoleErrors,
    pageErrors,
  };
}

async function audioProbeState(page) {
  return page.evaluate(() => {
    const probe = window.__helpMathRw002AudioQa;
    return {
      records: (probe?.records ?? []).map((record) => ({
        source: new URL(record.source, location.href).pathname,
        status: record.status,
        error: record.error ?? null,
      })),
      elements: (probe?.elements ?? []).map((audio) => ({
        source: new URL(audio.currentSrc || audio.src, location.href).pathname,
        paused: audio.paused,
        ended: audio.ended,
        readyState: audio.readyState,
        currentTimeStarted: audio.currentTime > 0,
      })),
    };
  });
}

async function waitForCandidate(page) {
  await page
    .locator(
      '[data-candidate-status="source-static-engineering-not-strict"][data-canvas-status="ready"]',
    )
    .first()
    .waitFor({state: "visible", timeout: 90_000});
}

export function summarizeEnglishQa({
  before,
  after,
  replay,
  requests,
  responses,
  diagnostics,
}) {
  const postReplayRecords = after.records.slice(before.records.length);
  const matchingRecords = postReplayRecords.filter(
    (record) => record.source === EMBEDDED_PATH,
  );
  const matchingElements = after.elements.filter(
    (element) => element.source === EMBEDDED_PATH,
  );
  const response = responses.find(
    (entry) => new URL(entry.url).pathname === EMBEDDED_PATH,
  );
  const pass =
    replay === "1" &&
    matchingRecords.some((record) => record.status === "playing") &&
    matchingElements.some(
      (element) =>
        element.paused === false &&
        element.ended === false &&
        element.readyState >= 2,
    ) &&
    requests.some((url) => new URL(url).pathname === EMBEDDED_PATH) &&
    response?.status === 200 &&
    diagnostics.unexpectedRequests.length === 0 &&
    diagnostics.failedRequests.length === 0 &&
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.pageErrors.length === 0;
  return {
    pass,
    replayResetObserved: replay === "1",
    playCallAfterReplayObserved: matchingRecords.length > 0,
    playPromiseFulfilled: matchingRecords.some(
      (record) => record.status === "playing",
    ),
    activeMediaElementObserved: matchingElements.some(
      (element) => element.paused === false && element.ended === false,
    ),
    sourceRequested: requests.some(
      (url) => new URL(url).pathname === EMBEDDED_PATH,
    ),
    sourceHttpStatus: response?.status ?? null,
    sourcePath: EMBEDDED_PATH,
  };
}

export function summarizeSpanishQa({
  state,
  stopLabelVisible,
  requests,
  responses,
  diagnostics,
}) {
  const matchingRecords = state.records.filter(
    (record) => record.source === SPANISH_PATH,
  );
  const matchingElements = state.elements.filter(
    (element) => element.source === SPANISH_PATH,
  );
  const response = responses.find(
    (entry) => new URL(entry.url).pathname === SPANISH_PATH,
  );
  const pass =
    stopLabelVisible &&
    matchingRecords.some((record) => record.status === "playing") &&
    matchingElements.some(
      (element) =>
        element.paused === false &&
        element.ended === false &&
        element.readyState >= 2,
    ) &&
    requests.some((url) => new URL(url).pathname === SPANISH_PATH) &&
    response?.status === 200 &&
    diagnostics.unexpectedRequests.length === 0 &&
    diagnostics.failedRequests.length === 0 &&
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.pageErrors.length === 0;
  return {
    pass,
    userControlActivated: stopLabelVisible,
    playPromiseFulfilled: matchingRecords.some(
      (record) => record.status === "playing",
    ),
    activeMediaElementObserved: matchingElements.some(
      (element) => element.paused === false && element.ended === false,
    ),
    sourceRequested: requests.some(
      (url) => new URL(url).pathname === SPANISH_PATH,
    ),
    sourceHttpStatus: response?.status ?? null,
    sourcePath: SPANISH_PATH,
  };
}

async function runEnglishQa(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/animations/course-g04-l03-rw-002?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  await waitForCandidate(page);
  await page.waitForTimeout(500);
  const before = await audioProbeState(page);
  await page.getByRole("button", {name: "Replay", exact: true}).click();
  await page.waitForTimeout(900);
  const after = await audioProbeState(page);
  const replay = await page
    .locator(".runtime-shell")
    .getAttribute("data-runtime-replay");
  const summary = summarizeEnglishQa({
    before,
    after,
    replay,
    ...diagnostics,
    diagnostics,
  });
  const result = {
    routeHttpStatus: response?.status() ?? null,
    ...summary,
    diagnostics: {
      unexpectedRequestCount: diagnostics.unexpectedRequests.length,
      failedRequestCount: diagnostics.failedRequests.length,
      consoleErrorCount: diagnostics.consoleErrors.length,
      pageErrorCount: diagnostics.pageErrors.length,
    },
  };
  await context.close();
  return result;
}

async function runSpanishQa(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/es/animations/course-g04-l03-rw-002?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  const play = page.getByRole("button", {
    name: "Reproducir audio en español",
    exact: true,
  });
  await play.waitFor({state: "visible", timeout: 30_000});
  await play.click();
  await page.waitForTimeout(900);
  const state = await audioProbeState(page);
  const stopLabelVisible = await page
    .getByRole("button", {name: "Detener audio en español", exact: true})
    .isVisible();
  const summary = summarizeSpanishQa({
    state,
    stopLabelVisible,
    ...diagnostics,
    diagnostics,
  });
  const result = {
    routeHttpStatus: response?.status() ?? null,
    ...summary,
    diagnostics: {
      unexpectedRequestCount: diagnostics.unexpectedRequests.length,
      failedRequestCount: diagnostics.failedRequests.length,
      consoleErrorCount: diagnostics.consoleErrors.length,
      pageErrorCount: diagnostics.pageErrors.length,
    },
  };
  await context.close();
  return result;
}

function renderMarkdown(report) {
  return `# G4 L3 RW002 current-JavaScript audio QA\n\n` +
    `- English embedded stream + Replay: ${report.browserQa.english.pass ? "PASS" : "FAIL"}\n` +
    `- Spanish user-activated associated audio: ${report.browserQa.spanish.pass ? "PASS" : "FAIL"}\n` +
    `- Exact staged assets: ${report.assetIntegrity.exactSourceBytesPreserved ? "PASS" : "FAIL"}\n` +
    `- Audio listening/original-runtime synchronization acceptance: pending\n` +
    `- Strict completion effect: none\n\n` +
    `This is current-JavaScript engineering QA only. It does not establish spoken-language authority, original-runtime cue timing, audible-content acceptance, Replay parity, human review, owner acceptance, strict completion, or publication.\n`;
}

export function validateRw002AudioQaReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g4-l3-rw002-current-javascript-audio-qa" &&
      report.animationId === "course-g04-l03-rw-002",
    "RW002 audio QA identity is invalid",
  );
  invariant(
    report.browserQa?.english?.pass === true &&
      report.browserQa?.spanish?.pass === true &&
      report.assetIntegrity?.exactSourceBytesPreserved === true,
    "RW002 audio engineering QA did not pass",
  );
  invariant(
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "RW002 audio QA promoted an acceptance state",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "RW002 audio QA fingerprint is stale",
  );
  return report;
}

export async function runRw002AudioQa({
  baseUrl = "http://127.0.0.1:3214",
  check = false,
} = {}) {
  const normalizedBaseUrl = localBaseUrl(baseUrl);
  const [generator, bindings, assetManifest, embeddedSource, embeddedPublic,
    spanishSource, spanishPublic] = await Promise.all([
    binding(path.relative(ROOT, SCRIPT_PATH).split(path.sep).join("/")),
    Promise.all(BINDINGS.map(binding)),
    readFile(
      projectPath(
        "public/flash-assets/courses/course-g04-l03-rw-002/audio/manifest.json",
      ),
      "utf8",
    ),
    readFile(
      projectPath(
        "artifacts/g4-l3-embedded-audio/sha256/76/7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c.mp3",
      ),
    ),
    readFile(
      projectPath(
        "public/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
      ),
    ),
    readFile(
      projectPath(
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
      ),
    ),
    readFile(
      projectPath(
        "public/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
      ),
    ),
  ]);
  const parsedManifest = JSON.parse(assetManifest);
  invariant(
    parsedManifest.reportType ===
      "g4-l3-rw002-current-javascript-audio-assets" &&
      parsedManifest.strictAcceptanceEffect === "none",
    "RW002 public audio manifest is invalid",
  );
  const exactSourceBytesPreserved =
    embeddedSource.equals(embeddedPublic) &&
    spanishSource.equals(spanishPublic) &&
    sha256(embeddedPublic) ===
      "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c" &&
    sha256(spanishPublic) ===
      "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e";
  invariant(exactSourceBytesPreserved, "RW002 public audio bytes changed");
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  let english;
  let spanish;
  try {
    english = await runEnglishQa(browser, normalizedBaseUrl);
    spanish = await runSpanishQa(browser, normalizedBaseUrl);
  } finally {
    await browser.close();
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-rw002-current-javascript-audio-qa",
    animationId: "course-g04-l03-rw-002",
    authority:
      "Current-JavaScript browser playback and exact-byte asset integrity only",
    authorityBoundary:
      "No spoken-language, authorized original-runtime cue/synchronization, listening acceptance, visual parity, human review, owner acceptance, strict completion, or publication authority.",
    generator,
    bindings,
    assetIntegrity: {
      manifest: {
        path:
          "public/flash-assets/courses/course-g04-l03-rw-002/audio/manifest.json",
        bytes: Buffer.byteLength(assetManifest),
        sha256: sha256(assetManifest),
      },
      exactSourceBytesPreserved,
      transcoded: false,
    },
    browserQa: {english, spanish},
    acceptance: {
      spokenLanguageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      audioListeningAccepted: false,
      replayParityAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  report.reportFingerprintSha256 = sha256(stableJson(report));
  validateRw002AudioQaReport(report);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(
      (await readFile(projectPath(OUTPUT_JSON), "utf8")) === json,
      "RW002 audio QA JSON is stale",
    );
    invariant(
      (await readFile(projectPath(OUTPUT_MARKDOWN), "utf8")) === markdown,
      "RW002 audio QA Markdown is stale",
    );
  } else {
    await mkdir(path.dirname(projectPath(OUTPUT_JSON)), {recursive: true});
    await writeFile(projectPath(OUTPUT_JSON), json);
    await writeFile(projectPath(OUTPUT_MARKDOWN), markdown);
  }
  return {
    check,
    english: english.pass,
    spanish: spanish.pass,
    exactSourceBytesPreserved,
    output: OUTPUT_JSON,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  let baseUrl = "http://127.0.0.1:3214";
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") check = true;
    else if (value === "--base-url") {
      invariant(argv[index + 1], "--base-url requires a value");
      baseUrl = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return {baseUrl, check};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runRw002AudioQa(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
