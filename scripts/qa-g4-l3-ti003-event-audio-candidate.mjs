#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ti-003";
const CANDIDATE_REPORT =
  "reports/g4-l3-ti003-current-js-event-audio-candidate.json";
const OUTPUT_JSON =
  "reports/g4-l3-ti003-current-js-event-audio-qa.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l3-ti003-current-js-event-audio-qa.md";
const BINDINGS = Object.freeze([
  CANDIDATE_REPORT,
  "packages/demos/src/modules/course-g04-l03-ti-003.tsx",
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
  "apps/web/components/animation-runtime.tsx",
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
    Object.defineProperty(window, "__helpMathTi003AudioQa", {
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
  const state = {
    requests: [],
    responses: [],
    unexpectedRequests: [],
    failedRequests: [],
    consoleErrors: [],
    pageErrors: [],
  };
  page.on("request", (request) => {
    state.requests.push(request.url());
    try {
      if (!allowedRequest(request.url(), baseUrl)) {
        state.unexpectedRequests.push(request.url());
      }
    } catch {
      state.unexpectedRequests.push(request.url());
    }
  });
  page.on("response", (response) => {
    state.responses.push({url: response.url(), status: response.status()});
  });
  page.on("requestfailed", (request) => {
    state.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "request-failed",
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  return state;
}

async function audioState(page) {
  return page.evaluate(() => {
    const probe = window.__helpMathTi003AudioQa;
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

function cleanDiagnostics(state) {
  return (
    state.unexpectedRequests.length === 0 &&
    state.failedRequests.length === 0 &&
    state.consoleErrors.length === 0 &&
    state.pageErrors.length === 0
  );
}

function sourceStatuses(state, pathname) {
  return [
    ...new Set(
      state.responses
        .filter(({url}) => new URL(url).pathname === pathname)
        .map(({status}) => status),
    ),
  ].sort();
}

function compactDiagnostics(state) {
  return {
    unexpectedRequestCount: state.unexpectedRequests.length,
    failedRequestCount: state.failedRequests.length,
    consoleErrorCount: state.consoleErrors.length,
    pageErrorCount: state.pageErrors.length,
  };
}

async function runEnglish(browser, baseUrl, candidate) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/animations/${ANIMATION_ID}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  await page.locator(".runtime-shell").waitFor({
    state: "visible",
    timeout: 90_000,
  });
  await page.waitForTimeout(1_400);
  const beforeReplay = await audioState(page);
  await page.locator('button[data-replay-keyboard="enter-space"]').click();
  await page.waitForTimeout(1_400);
  const afterReplay = await audioState(page);
  const replay = await page
    .locator(".runtime-shell")
    .getAttribute("data-runtime-replay");
  const relevantRecords = afterReplay.records.filter(
    ({source}) => source === candidate.english.publicPath,
  );
  const relevantElements = afterReplay.elements.filter(
    ({source}) => source === candidate.english.publicPath,
  );
  const result = {
    routeHttpStatus: response?.status() ?? null,
    sourcePath: candidate.english.publicPath,
    sourceHttpStatuses: sourceStatuses(
      diagnostics,
      candidate.english.publicPath,
    ),
    initialPlayObserved: beforeReplay.records.some(
      ({source, status}) =>
        source === candidate.english.publicPath && status === "playing",
    ),
    replayResetObserved: replay === "1",
    replayPlayObserved: relevantRecords.length >= 2,
    playCount: relevantRecords.length,
    activeMediaElementObserved: relevantElements.some(
      ({paused, ended, readyState, currentTimeStarted}) =>
        !paused && !ended && readyState >= 2 && currentTimeStarted,
    ),
    diagnostics: compactDiagnostics(diagnostics),
  };
  result.pass =
    result.routeHttpStatus === 200 &&
    result.sourceHttpStatuses.some((status) => [200, 206].includes(status)) &&
    result.initialPlayObserved &&
    result.replayResetObserved &&
    result.replayPlayObserved &&
    result.activeMediaElementObserved &&
    cleanDiagnostics(diagnostics);
  await context.close();
  return result;
}

async function runSpanish(browser, baseUrl, candidate) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/es/animations/${ANIMATION_ID}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  const playButton = page.getByRole("button", {
    name: "Reproducir audio en español",
    exact: true,
  });
  await playButton.waitFor({state: "visible", timeout: 90_000});
  await playButton.click();
  await page.waitForTimeout(900);
  const state = await audioState(page);
  const stopLabelVisible = await page
    .getByRole("button", {
      name: "Detener audio en español",
      exact: true,
    })
    .isVisible();
  const relevantRecords = state.records.filter(
    ({source}) => source === candidate.spanish.publicPath,
  );
  const relevantElements = state.elements.filter(
    ({source}) => source === candidate.spanish.publicPath,
  );
  const result = {
    routeHttpStatus: response?.status() ?? null,
    sourcePath: candidate.spanish.publicPath,
    sourceHttpStatuses: sourceStatuses(
      diagnostics,
      candidate.spanish.publicPath,
    ),
    userControlActivated: stopLabelVisible,
    playPromiseFulfilled: relevantRecords.some(
      ({status}) => status === "playing",
    ),
    activeMediaElementObserved: relevantElements.some(
      ({paused, ended, readyState, currentTimeStarted}) =>
        !paused && !ended && readyState >= 2 && currentTimeStarted,
    ),
    diagnostics: compactDiagnostics(diagnostics),
  };
  result.pass =
    result.routeHttpStatus === 200 &&
    result.sourceHttpStatuses.some((status) => [200, 206].includes(status)) &&
    result.userControlActivated &&
    result.playPromiseFulfilled &&
    result.activeMediaElementObserved &&
    cleanDiagnostics(diagnostics);
  await context.close();
  return result;
}

function renderMarkdown(report) {
  return `# G4 L3 TI003 current-JavaScript event-audio QA\n\n` +
    `- English source event cue + Replay: ${report.english.pass ? "PASS" : "FAIL"}\n` +
    `- Spanish user control: ${report.spanish.pass ? "PASS" : "FAIL"}\n` +
    `- Console/page/request diagnostics: ${report.summary.cleanDiagnostics ? "PASS" : "FAIL"}\n` +
    `- Engineering status: ${report.summary.pass ? "PASS" : "FAIL"}\n` +
    `- Strict completion effect: none\n\n` +
    `This proves same-origin current-JavaScript playback and Replay re-trigger ` +
    `only. It does not prove original-runtime synchronization or human ` +
    `listening acceptance, and interaction feedback audio remains disabled.\n`;
}

export function validateReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g4-l3-ti003-current-js-event-audio-browser-qa" &&
      report.animationId === ANIMATION_ID &&
      report.english?.pass === true &&
      report.spanish?.pass === true &&
      report.summary?.pass === true,
    "TI003 event-audio browser QA did not pass",
  );
  invariant(
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "TI003 event-audio QA promoted acceptance",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "TI003 event-audio QA fingerprint is stale",
  );
  return report;
}

export async function runG4L3Ti003EventAudioQa({
  baseUrl = "http://127.0.0.1:3214",
  check = false,
} = {}) {
  const normalizedBaseUrl = localBaseUrl(baseUrl);
  const generatorPath = path
    .relative(ROOT, SCRIPT_PATH)
    .split(path.sep)
    .join("/");
  const [generator, bindings, candidateText] = await Promise.all([
    binding(generatorPath),
    Promise.all(BINDINGS.map(binding)),
    readFile(projectPath(CANDIDATE_REPORT), "utf8"),
  ]);
  const candidateReport = JSON.parse(candidateText);
  invariant(
    candidateReport.reportType ===
      "g4-l3-ti003-current-js-event-audio-candidate" &&
      candidateReport.candidate?.animationId === ANIMATION_ID &&
      candidateReport.candidate?.swfEvent?.soundId === 14 &&
      candidateReport.strictAcceptanceEffect === "none",
    "TI003 event-audio candidate report is invalid",
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  let english;
  let spanish;
  try {
    english = await runEnglish(
      browser,
      normalizedBaseUrl,
      candidateReport.candidate,
    );
    spanish = await runSpanish(
      browser,
      normalizedBaseUrl,
      candidateReport.candidate,
    );
  } finally {
    await browser.close();
  }
  const clean =
    Object.values(english.diagnostics).every((count) => count === 0) &&
    Object.values(spanish.diagnostics).every((count) => count === 0);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ti003-current-js-event-audio-browser-qa",
    releaseId: candidateReport.releaseId,
    animationId: ANIMATION_ID,
    authority:
      "Current-JavaScript source-event playback, Replay re-trigger, same-origin loading, and Spanish host-control activation only",
    authorityBoundary:
      "No spoken-language, authorized original-runtime synchronization, complete listening acceptance, interaction-audio parity, visual parity, human review, owner acceptance, strict completion, or publication authority.",
    generator,
    bindings,
    candidateReport: {
      path: CANDIDATE_REPORT,
      bytes: Buffer.byteLength(candidateText),
      sha256: sha256(candidateText),
    },
    summary: {
      englishPassed: english.pass,
      spanishPassed: spanish.pass,
      cleanDiagnostics: clean,
      pass: english.pass && spanish.pass && clean,
      strictCompleteCount: 0,
      published: false,
    },
    english,
    spanish,
    acceptance: {
      spokenLanguageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      completeListeningAccepted: false,
      interactionAudioAccepted: false,
      replayParityAccepted: false,
      visualParityAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  report.reportFingerprintSha256 = sha256(stableJson(report));
  validateReport(report);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(
      (await readFile(projectPath(OUTPUT_JSON), "utf8")) === json,
      `${OUTPUT_JSON} is stale`,
    );
    invariant(
      (await readFile(projectPath(OUTPUT_MARKDOWN), "utf8")) === markdown,
      `${OUTPUT_MARKDOWN} is stale`,
    );
  } else {
    await mkdir(path.dirname(projectPath(OUTPUT_JSON)), {recursive: true});
    await writeFile(projectPath(OUTPUT_JSON), json);
    await writeFile(projectPath(OUTPUT_MARKDOWN), markdown);
  }
  return {
    check,
    animationId: ANIMATION_ID,
    englishPassed: english.pass,
    spanishPassed: spanish.pass,
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
  runG4L3Ti003EventAudioQa(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
