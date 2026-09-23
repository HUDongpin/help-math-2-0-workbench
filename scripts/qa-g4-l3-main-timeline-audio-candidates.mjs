#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CANDIDATE_REPORT =
  "reports/g4-l3-current-js-main-timeline-audio-candidates.json";
const OUTPUT_JSON =
  "reports/g4-l3-current-js-main-timeline-audio-qa.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l3-current-js-main-timeline-audio-qa.md";

const BINDINGS = Object.freeze([
  CANDIDATE_REPORT,
  "packages/demos/src/g4-l3-main-timeline-audio.generated.ts",
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/modules/course-g04-l03-in-003.tsx",
  "packages/demos/src/modules/course-g04-l03-in-009.tsx",
  "packages/demos/src/modules/course-g04-l03-rw-002.tsx",
  "packages/demos/src/modules/course-g04-l03-rw-003.tsx",
  "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
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
    Object.defineProperty(window, "__helpMathMainTimelineAudioQa", {
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

async function installAutoplayBlocker(page) {
  await page.addInitScript(() => {
    let userAudioPermitted = false;
    document.addEventListener(
      "click",
      () => {
        userAudioPermitted = true;
      },
      {capture: true},
    );
    const priorPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function blockUngesturedAutoplay(...args) {
      if (!userAudioPermitted) {
        return Promise.reject(
          new DOMException("Autoplay requires a user gesture", "NotAllowedError"),
        );
      }
      return priorPlay.apply(this, args);
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

async function audioState(page) {
  return page.evaluate(() => {
    const probe = window.__helpMathMainTimelineAudioQa;
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

function sourceStatus(diagnostics, pathname) {
  return diagnostics.responses.find(
    (entry) => new URL(entry.url).pathname === pathname,
  )?.status ?? null;
}

export function summarizeEnglish({
  pathname,
  beforeRecordCount,
  state,
  replay,
  diagnostics,
}) {
  const records = state.records
    .slice(beforeRecordCount)
    .filter(({source}) => source === pathname);
  const elements = state.elements.filter(({source}) => source === pathname);
  const httpStatus = sourceStatus(diagnostics, pathname);
  const active = elements.some(
    ({paused, ended, readyState}) => !paused && !ended && readyState >= 2,
  );
  const playFulfilled = records.some(({status}) => status === "playing");
  return {
    pass:
      replay === "1" &&
      records.length > 0 &&
      playFulfilled &&
      active &&
      diagnostics.requests.some(
        (url) => new URL(url).pathname === pathname,
      ) &&
      httpStatus === 200 &&
      cleanDiagnostics(diagnostics),
    sourcePath: pathname,
    sourceHttpStatus: httpStatus,
    replayResetObserved: replay === "1",
    playCallAfterReplayObserved: records.length > 0,
    playPromiseFulfilled: playFulfilled,
    activeMediaElementObserved: active,
  };
}

export function summarizeSpanish({
  pathname,
  state,
  stopLabelVisible,
  diagnostics,
}) {
  const records = state.records.filter(({source}) => source === pathname);
  const elements = state.elements.filter(({source}) => source === pathname);
  const httpStatus = sourceStatus(diagnostics, pathname);
  const active = elements.some(
    ({paused, ended, readyState}) => !paused && !ended && readyState >= 2,
  );
  const playFulfilled = records.some(({status}) => status === "playing");
  return {
    pass:
      stopLabelVisible &&
      playFulfilled &&
      active &&
      diagnostics.requests.some(
        (url) => new URL(url).pathname === pathname,
      ) &&
      httpStatus === 200 &&
      cleanDiagnostics(diagnostics),
    sourcePath: pathname,
    sourceHttpStatus: httpStatus,
    userControlActivated: stopLabelVisible,
    playPromiseFulfilled: playFulfilled,
    activeMediaElementObserved: active,
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

async function runEnglish(browser, baseUrl, candidate) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/animations/${candidate.animationId}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  await page.locator(".runtime-shell").waitFor({
    state: "visible",
    timeout: 90_000,
  });
  invariant(
    Number.isFinite(candidate.fps) &&
      candidate.fps > 0 &&
      Number.isSafeInteger(candidate.embedded.firstBlockFrame) &&
      candidate.embedded.firstBlockFrame >= 1,
    `${candidate.animationId}: invalid source cue timing`,
  );
  const cueObservationWindowMs = Math.max(
    1_400,
    Math.ceil(
      ((candidate.embedded.firstBlockFrame + 3) * 1_000) / candidate.fps,
    ),
  );
  invariant(
    cueObservationWindowMs <= 15_000,
    `${candidate.animationId}: source cue exceeds the bounded QA window`,
  );
  await page.waitForTimeout(cueObservationWindowMs);
  const before = await audioState(page);
  await page.locator('button[data-replay-keyboard="enter-space"]').click();
  await page.waitForTimeout(cueObservationWindowMs);
  const state = await audioState(page);
  const replay = await page
    .locator(".runtime-shell")
    .getAttribute("data-runtime-replay");
  const result = {
    routeHttpStatus: response?.status() ?? null,
    ...summarizeEnglish({
      pathname: candidate.embedded.publicPath,
      beforeRecordCount: before.records.length,
      state,
      replay,
      diagnostics,
    }),
    diagnostics: compactDiagnostics(diagnostics),
  };
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
    `${baseUrl}/es/animations/${candidate.animationId}?auditContext=g4-l3-lesson`,
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
  const result = {
    routeHttpStatus: response?.status() ?? null,
    ...summarizeSpanish({
      pathname: candidate.spanish.publicPath,
      state,
      stopLabelVisible,
      diagnostics,
    }),
    diagnostics: compactDiagnostics(diagnostics),
  };
  await context.close();
  return result;
}

async function runAutoplayFallback(browser, baseUrl, candidate) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAutoplayBlocker(page);
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/animations/${candidate.animationId}?auditContext=g4-l3-lesson`,
    {waitUntil: "domcontentloaded"},
  );
  const button = page.locator(
    'button[data-audio-control-kind="autoplay-fallback"]',
  );
  await button.waitFor({state: "visible", timeout: 90_000});
  const labelBefore = await button.textContent();
  await button.click();
  await page.waitForTimeout(900);
  const state = await audioState(page);
  const labelAfter = await button.textContent();
  const relevantRecords = state.records.filter(
    ({source}) => source === candidate.embedded.publicPath,
  );
  const relevantElements = state.elements.filter(
    ({source}) => source === candidate.embedded.publicPath,
  );
  const statuses = diagnostics.responses
    .filter(
      ({url}) => new URL(url).pathname === candidate.embedded.publicPath,
    )
    .map(({status}) => status);
  const result = {
    representativeAnimationId: candidate.animationId,
    routeHttpStatus: response?.status() ?? null,
    sourcePath: candidate.embedded.publicPath,
    sourceHttpStatuses: [...new Set(statuses)].sort(),
    fallbackControlVisible: labelBefore === "Play English audio",
    userControlActivated: labelAfter === "Stop English audio",
    blockedAutoplayObserved: relevantRecords.some(
      ({status, error}) =>
        status === "rejected" && error === "NotAllowedError",
    ),
    userActivatedPlayObserved: relevantRecords.some(
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
    result.fallbackControlVisible &&
    result.userControlActivated &&
    result.blockedAutoplayObserved &&
    result.userActivatedPlayObserved &&
    result.activeMediaElementObserved &&
    cleanDiagnostics(diagnostics);
  await context.close();
  return result;
}

function renderMarkdown(report) {
  const rows = report.members
    .map(
      (entry) =>
        `| \`${entry.animationId}\` | ${entry.english.pass ? "PASS" : "FAIL"} | ${entry.spanish.pass ? "PASS" : "FAIL"} | ${entry.english.diagnostics.consoleErrorCount + entry.spanish.diagnostics.consoleErrorCount} | ${entry.english.diagnostics.unexpectedRequestCount + entry.spanish.diagnostics.unexpectedRequestCount} |`,
    )
    .join("\n");
  return `# G4 L3 current-JavaScript main-timeline audio QA\n\n` +
    `- Members tested: ${report.summary.memberCount}\n` +
    `- English source cue + Replay passed: ${report.summary.englishPassed}/${report.summary.memberCount}\n` +
    `- Spanish user control passed: ${report.summary.spanishPassed}/${report.summary.memberCount}\n` +
    `- Blocked-autoplay user fallback (RW002): ${report.summary.autoplayFallbackPassed ? "PASS" : "FAIL"}\n` +
    `- Overall engineering status: ${report.summary.pass ? "PASS" : "FAIL"}\n` +
    `- Strict completion effect: none\n\n` +
    `| Member | EN + Replay | ES control | Console errors | Unexpected requests |\n` +
    `|---|---:|---:|---:|---:|\n${rows}\n\n` +
    `This is current-JavaScript engineering QA only. Spoken language, authorized original-runtime reachability and synchronization, complete listening acceptance, Replay parity, visual parity, human review, owner acceptance, strict completion, and publication remain pending.\n`;
}

export function validateReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g4-l3-current-js-main-timeline-audio-browser-qa" &&
      report.summary?.memberCount === 34 &&
      report.summary.englishPassed === 34 &&
      report.summary.spanishPassed === 34 &&
      report.summary.autoplayFallbackPassed === true &&
      report.summary.pass === true,
    "G4 L3 main-timeline audio browser QA did not pass",
  );
  invariant(
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "G4 L3 main-timeline audio QA promoted acceptance",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "G4 L3 main-timeline audio QA fingerprint is stale",
  );
  return report;
}

export async function runG4L3MainTimelineAudioQa({
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
      "g4-l3-current-js-main-timeline-audio-candidates" &&
      candidateReport.summary.eligibleMemberCount === 34 &&
      candidateReport.strictAcceptanceEffect === "none",
    "G4 L3 main-timeline audio candidate report is invalid",
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const members = [];
  const fallbackCandidate = candidateReport.candidates.find(
    ({animationId}) => animationId === "course-g04-l03-rw-002",
  );
  invariant(fallbackCandidate, "RW002 autoplay-fallback candidate is missing");
  let autoplayFallback;
  try {
    for (const candidate of candidateReport.candidates) {
      const english = await runEnglish(
        browser,
        normalizedBaseUrl,
        candidate,
      );
      const spanish = await runSpanish(
        browser,
        normalizedBaseUrl,
        candidate,
      );
      members.push({
        animationId: candidate.animationId,
        frameDomain: candidate.frameDomain,
        structuralCueFrame: candidate.embedded.firstBlockFrame,
        english,
        spanish,
      });
      process.stdout.write(
        `audio ${String(members.length).padStart(2, "0")}/34 ${candidate.animationId}: EN ${english.pass ? "PASS" : "FAIL"}, ES ${spanish.pass ? "PASS" : "FAIL"}\n`,
      );
    }
    autoplayFallback = await runAutoplayFallback(
      browser,
      normalizedBaseUrl,
      fallbackCandidate,
    );
    process.stdout.write(
      `audio autoplay fallback ${fallbackCandidate.animationId}: ` +
        `${autoplayFallback.pass ? "PASS" : "FAIL"}\n`,
    );
  } finally {
    await browser.close();
  }
  const englishPassed = members.filter(({english}) => english.pass).length;
  const spanishPassed = members.filter(({spanish}) => spanish.pass).length;
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-current-js-main-timeline-audio-browser-qa",
    releaseId: candidateReport.releaseId,
    authority:
      "Current-JavaScript browser playback, Replay re-trigger, same-origin resource loading, and host-control activation only",
    authorityBoundary:
      "No spoken-language, authorized original-runtime reachability or synchronization, complete listening acceptance, Replay parity, visual parity, human review, owner acceptance, strict completion, or publication authority.",
    generator,
    bindings,
    candidateReport: {
      path: CANDIDATE_REPORT,
      bytes: Buffer.byteLength(candidateText),
      sha256: sha256(candidateText),
    },
    summary: {
      memberCount: members.length,
      englishPassed,
      spanishPassed,
      autoplayFallbackPassed: autoplayFallback.pass,
      pass:
        members.length === 34 &&
        englishPassed === 34 &&
        spanishPassed === 34 &&
        autoplayFallback.pass,
      strictCompleteCount: 0,
      published: false,
    },
    members,
    autoplayFallback,
    acceptance: {
      spokenLanguageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      completeListeningAccepted: false,
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
    members: members.length,
    englishPassed,
    spanishPassed,
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
  runG4L3MainTimelineAudioQa(parseArguments(process.argv.slice(2)))
    .then((result) =>
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    )
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
