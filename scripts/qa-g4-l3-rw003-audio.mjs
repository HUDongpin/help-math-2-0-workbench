#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-rw-003";
const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/evidence/current-javascript-audio-product-qa.json`;
const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/evidence/current-javascript-audio-product-qa.md`;
export const EMBEDDED_PATH =
  `/flash-assets/courses/${ANIMATION_ID}/audio/embedded-stream-0001.mp3`;
export const SPANISH_PATH =
  `/flash-assets/courses/${ANIMATION_ID}/audio/spanish-host-narration.mp3`;

const BINDINGS = Object.freeze([
  "packages/demos/src/modules/course-g04-l03-rw-003.tsx",
  "packages/demos/src/timelines/course-g04-l03-rw-003.ts",
  "packages/demos/tests/course-g04-l03-rw-003.test.ts",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
  "apps/web/components/animation-runtime.tsx",
  "scripts/sync-g4-l3-rw003-audio-assets.mjs",
  `public/flash-assets/courses/${ANIMATION_ID}/audio/manifest.json`,
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
  const relativeToRoot = path.relative(ROOT, absolute);
  invariant(
    relativeToRoot &&
      !path.isAbsolute(relativeToRoot) &&
      relativeToRoot !== ".." &&
      !relativeToRoot.startsWith(`..${path.sep}`),
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
  const hostname = parsed.hostname.replace(/^\[|\]$/gu, "");
  invariant(
    ["http:", "https:"].includes(parsed.protocol) &&
      ["127.0.0.1", "localhost", "::1"].includes(hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    "--base-url must be an uncredentialed localhost HTTP(S) URL",
  );
  parsed.pathname = parsed.pathname.replace(/\/+$/u, "");
  return parsed.toString().replace(/\/$/u, "");
}

function allowedRequest(requestUrl, baseUrl) {
  const requested = new URL(requestUrl);
  if (["data:", "blob:", "about:"].includes(requested.protocol)) return true;
  const base = new URL(baseUrl);
  const requestedPort =
    requested.port ||
    (["https:", "wss:"].includes(requested.protocol) ? "443" : "80");
  const basePort = base.port || (base.protocol === "https:" ? "443" : "80");
  return (
    ["http:", "https:", "ws:", "wss:"].includes(requested.protocol) &&
    requested.hostname === base.hostname &&
    requestedPort === basePort
  );
}

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    const records = [];
    const elements = [];
    Object.defineProperty(window, "__helpMathRw003AudioQa", {
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

async function probeState(page) {
  return page.evaluate(() => {
    const probe = window.__helpMathRw003AudioQa;
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

function cleanDiagnostics(diagnostics) {
  return (
    diagnostics.unexpectedRequests.length === 0 &&
    diagnostics.failedRequests.length === 0 &&
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.pageErrors.length === 0
  );
}

function responseStatus(responses, pathname) {
  return responses.find((entry) => new URL(entry.url).pathname === pathname)
    ?.status ?? null;
}

export function summarizeEnglishQa({
  before,
  after,
  replay,
  requests,
  responses,
  diagnostics,
}) {
  const records = after.records
    .slice(before.records.length)
    .filter(({source}) => source === EMBEDDED_PATH);
  const elements = after.elements.filter(({source}) => source === EMBEDDED_PATH);
  const status = responseStatus(responses, EMBEDDED_PATH);
  return {
    pass:
      replay === "1" &&
      records.some(({status: playStatus}) => playStatus === "playing") &&
      elements.some(
        ({paused, ended, readyState}) =>
          !paused && !ended && readyState >= 2,
      ) &&
      requests.some((url) => new URL(url).pathname === EMBEDDED_PATH) &&
      status === 200 &&
      cleanDiagnostics(diagnostics),
    replayResetObserved: replay === "1",
    playCallAfterReplayObserved: records.length > 0,
    playPromiseFulfilled: records.some(
      ({status: playStatus}) => playStatus === "playing",
    ),
    activeMediaElementObserved: elements.some(
      ({paused, ended}) => !paused && !ended,
    ),
    sourceRequested: requests.some(
      (url) => new URL(url).pathname === EMBEDDED_PATH,
    ),
    sourceHttpStatus: status,
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
  const records = state.records.filter(({source}) => source === SPANISH_PATH);
  const elements = state.elements.filter(({source}) => source === SPANISH_PATH);
  const status = responseStatus(responses, SPANISH_PATH);
  return {
    pass:
      stopLabelVisible &&
      records.some(({status: playStatus}) => playStatus === "playing") &&
      elements.some(
        ({paused, ended, readyState}) =>
          !paused && !ended && readyState >= 2,
      ) &&
      requests.some((url) => new URL(url).pathname === SPANISH_PATH) &&
      status === 200 &&
      cleanDiagnostics(diagnostics),
    userControlActivated: stopLabelVisible,
    playPromiseFulfilled: records.some(
      ({status: playStatus}) => playStatus === "playing",
    ),
    activeMediaElementObserved: elements.some(
      ({paused, ended}) => !paused && !ended,
    ),
    sourceRequested: requests.some(
      (url) => new URL(url).pathname === SPANISH_PATH,
    ),
    sourceHttpStatus: status,
    sourcePath: SPANISH_PATH,
  };
}

function compactDiagnostics(diagnostics) {
  return {
    unexpectedRequestCount: diagnostics.unexpectedRequests.length,
    failedRequestCount: diagnostics.failedRequests.length,
    consoleErrorCount: diagnostics.consoleErrors.length,
    pageErrorCount: diagnostics.pageErrors.length,
  };
}

async function waitForCandidate(page) {
  await page
    .locator(
      '[data-candidate-status="source-static-engineering-not-strict"][data-canvas-status="ready"]',
    )
    .first()
    .waitFor({state: "visible", timeout: 90_000});
}

async function runEnglishQa(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const routeResponse = await page.goto(
    `${baseUrl}/animations/${ANIMATION_ID}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  await waitForCandidate(page);
  await page.waitForTimeout(1_200);
  const before = await probeState(page);
  await page.getByRole("button", {name: "Replay", exact: true}).click();
  await page.waitForTimeout(1_200);
  const after = await probeState(page);
  const replay = await page
    .locator(".runtime-shell")
    .getAttribute("data-runtime-replay");
  const result = {
    routeHttpStatus: routeResponse?.status() ?? null,
    ...summarizeEnglishQa({
      before,
      after,
      replay,
      ...diagnostics,
      diagnostics,
    }),
    diagnostics: compactDiagnostics(diagnostics),
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
  const routeResponse = await page.goto(
    `${baseUrl}/es/animations/${ANIMATION_ID}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  const play = page.getByRole("button", {
    name: "Reproducir audio en español",
    exact: true,
  });
  await play.waitFor({state: "visible", timeout: 30_000});
  await play.click();
  await page.waitForTimeout(900);
  const state = await probeState(page);
  const stopLabelVisible = await page
    .getByRole("button", {name: "Detener audio en español", exact: true})
    .isVisible();
  const result = {
    routeHttpStatus: routeResponse?.status() ?? null,
    ...summarizeSpanishQa({
      state,
      stopLabelVisible,
      ...diagnostics,
      diagnostics,
    }),
    diagnostics: compactDiagnostics(diagnostics),
  };
  await context.close();
  return result;
}

function renderMarkdown(report) {
  return `# G4 L3 RW003 current-JavaScript audio QA\n\n` +
    `- English embedded stream at source frame 8 + Replay: ${report.browserQa.english.pass ? "PASS" : "FAIL"}\n` +
    `- Spanish user-activated associated audio: ${report.browserQa.spanish.pass ? "PASS" : "FAIL"}\n` +
    `- Exact staged assets: ${report.assetIntegrity.exactSourceBytesPreserved ? "PASS" : "FAIL"}\n` +
    `- Audio listening/original-runtime synchronization acceptance: pending\n` +
    `- Strict completion effect: none\n\n` +
    `This is current-JavaScript engineering QA only. It does not establish spoken-language authority, original-runtime cue timing, audible-content acceptance, Replay parity, human review, owner acceptance, strict completion, or publication.\n`;
}

export function validateRw003AudioQaReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g4-l3-rw003-current-javascript-audio-qa" &&
      report.animationId === ANIMATION_ID,
    "RW003 audio QA identity is invalid",
  );
  invariant(
    report.browserQa?.english?.pass === true &&
      report.browserQa?.spanish?.pass === true &&
      report.assetIntegrity?.exactSourceBytesPreserved === true,
    "RW003 audio engineering QA did not pass",
  );
  invariant(
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "RW003 audio QA promoted an acceptance state",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "RW003 audio QA fingerprint is stale",
  );
  return report;
}

export async function runRw003AudioQa({
  baseUrl = "http://127.0.0.1:3214",
  check = false,
} = {}) {
  const normalizedBaseUrl = localBaseUrl(baseUrl);
  const generatorPath = path
    .relative(ROOT, SCRIPT_PATH)
    .split(path.sep)
    .join("/");
  const [generator, bindings, manifestText, embeddedSource, embeddedPublic,
    spanishSource, spanishPublic] = await Promise.all([
    binding(generatorPath),
    Promise.all(BINDINGS.map(binding)),
    readFile(
      projectPath(`public/flash-assets/courses/${ANIMATION_ID}/audio/manifest.json`),
      "utf8",
    ),
    readFile(
      projectPath(
        "artifacts/g4-l3-embedded-audio/sha256/aa/aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2.mp3",
      ),
    ),
    readFile(projectPath(`public${EMBEDDED_PATH}`)),
    readFile(
      projectPath(
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW03.mp3",
      ),
    ),
    readFile(projectPath(`public${SPANISH_PATH}`)),
  ]);
  const manifest = JSON.parse(manifestText);
  invariant(
    manifest.reportType ===
      "g4-l3-rw003-current-javascript-audio-assets" &&
      manifest.strictAcceptanceEffect === "none",
    "RW003 public audio manifest is invalid",
  );
  const exactSourceBytesPreserved =
    embeddedSource.equals(embeddedPublic) &&
    spanishSource.equals(spanishPublic) &&
    sha256(embeddedPublic) ===
      "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2" &&
    sha256(spanishPublic) ===
      "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975";
  invariant(exactSourceBytesPreserved, "RW003 public audio bytes changed");
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
    reportType: "g4-l3-rw003-current-javascript-audio-qa",
    animationId: ANIMATION_ID,
    authority:
      "Current-JavaScript browser playback and exact-byte asset integrity only",
    authorityBoundary:
      "No spoken-language, authorized original-runtime cue/synchronization, listening acceptance, visual parity, human review, owner acceptance, strict completion, or publication authority.",
    generator,
    bindings,
    assetIntegrity: {
      manifest: {
        path: `public/flash-assets/courses/${ANIMATION_ID}/audio/manifest.json`,
        bytes: Buffer.byteLength(manifestText),
        sha256: sha256(manifestText),
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
  validateRw003AudioQaReport(report);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(
      (await readFile(projectPath(OUTPUT_JSON), "utf8")) === json,
      "RW003 audio QA JSON is stale",
    );
    invariant(
      (await readFile(projectPath(OUTPUT_MARKDOWN), "utf8")) === markdown,
      "RW003 audio QA Markdown is stale",
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
  runRw003AudioQa(parseArguments(process.argv.slice(2)))
    .then((result) =>
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    )
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
