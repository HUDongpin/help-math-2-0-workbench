#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ir-001-341242cc";
const CANDIDATE_REPORT =
  "reports/g4-l3-ir001-current-js-random-audio-candidate.json";
const OUTPUT_JSON =
  "reports/g4-l3-ir001-current-js-random-audio-qa.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l3-ir001-current-js-random-audio-qa.md";
const BINDINGS = Object.freeze([
  CANDIDATE_REPORT,
  "packages/demos/src/modules/course-g04-l03-ir-001-341242cc.tsx",
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
    Object.defineProperty(window, "__helpMathIr001AudioQa", {
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

function diagnostics(page, baseUrl) {
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
    const probe = window.__helpMathIr001AudioQa;
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

async function runBranch(browser, baseUrl, branch, allBranches) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const observed = diagnostics(page, baseUrl);
  const response = await page.goto(
    `${baseUrl}/animations/${ANIMATION_ID}` +
      `?auditContext=g4-l3-lesson&seed=${branch.outcome}`,
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
  const selectedRecords = afterReplay.records.filter(
    ({source}) => source === branch.publicPath,
  );
  const selectedElements = afterReplay.elements.filter(
    ({source}) => source === branch.publicPath,
  );
  const otherPaths = allBranches
    .filter(({outcome}) => outcome !== branch.outcome)
    .map(({publicPath}) => publicPath);
  const wrongBranchPlayCount = afterReplay.records.filter(({source}) =>
    otherPaths.includes(source),
  ).length;
  const sourceStatuses = observed.responses
    .filter(({url}) => new URL(url).pathname === branch.publicPath)
    .map(({status}) => status);
  const result = {
    outcome: branch.outcome,
    seed: branch.outcome,
    seedModulo: branch.deterministicEngineeringSeedBinding,
    sourcePath: branch.publicPath,
    routeHttpStatus: response?.status() ?? null,
    sourceHttpStatuses: [...new Set(sourceStatuses)].sort(),
    initialPlayObserved: beforeReplay.records.some(
      ({source, status}) =>
        source === branch.publicPath && status === "playing",
    ),
    replayResetObserved: replay === "1",
    replayPlayObserved: selectedRecords.length >= 2,
    selectedBranchPlayCount: selectedRecords.length,
    wrongBranchPlayCount,
    activeMediaElementObserved: selectedElements.some(
      ({paused, ended, readyState, currentTimeStarted}) =>
        !paused && !ended && readyState >= 2 && currentTimeStarted,
    ),
    diagnostics: {
      unexpectedRequestCount: observed.unexpectedRequests.length,
      failedRequestCount: observed.failedRequests.length,
      consoleErrorCount: observed.consoleErrors.length,
      pageErrorCount: observed.pageErrors.length,
    },
  };
  result.pass =
    result.routeHttpStatus === 200 &&
    result.sourceHttpStatuses.some((status) => [200, 206].includes(status)) &&
    result.initialPlayObserved &&
    result.replayResetObserved &&
    result.replayPlayObserved &&
    result.wrongBranchPlayCount === 0 &&
    result.activeMediaElementObserved &&
    cleanDiagnostics(observed);
  await context.close();
  return result;
}

function renderMarkdown(report) {
  const rows = report.branches
    .map(
      (branch) =>
        `| ${branch.outcome} | ${branch.seed} | ` +
        `${branch.initialPlayObserved ? "PASS" : "FAIL"} | ` +
        `${branch.replayPlayObserved ? "PASS" : "FAIL"} | ` +
        `${branch.wrongBranchPlayCount} | ${branch.pass ? "PASS" : "FAIL"} |`,
    )
    .join("\n");
  return `# G4 L3 IR001 current-JavaScript random-audio QA\n\n` +
    `- Deterministic branches passed: ${report.summary.passedBranchCount}/2\n` +
    `- Replay re-trigger passed: ${report.summary.replayPassedBranchCount}/2\n` +
    `- Unexpected branch plays: ${report.summary.wrongBranchPlayCount}\n` +
    `- Engineering status: ${report.summary.pass ? "PASS" : "FAIL"}\n` +
    `- Strict completion effect: none\n\n` +
    `| Outcome | Seed | Initial | Replay | Wrong branch | Result |\n` +
    `|---:|---:|---:|---:|---:|---:|\n${rows}\n\n` +
    `This browser check proves deterministic current-JavaScript selection, ` +
    `same-origin loading, playback, and Replay re-trigger only. It is not ` +
    `original-runtime synchronization or human listening acceptance.\n`;
}

export function validateReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g4-l3-ir001-current-js-random-audio-browser-qa" &&
      report.summary?.branchCount === 2 &&
      report.summary.passedBranchCount === 2 &&
      report.summary.replayPassedBranchCount === 2 &&
      report.summary.wrongBranchPlayCount === 0 &&
      report.summary.pass === true,
    "IR001 random-audio browser QA did not pass",
  );
  invariant(
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "IR001 random-audio QA promoted acceptance",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "IR001 random-audio QA fingerprint is stale",
  );
  return report;
}

export async function runG4L3Ir001RandomAudioQa({
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
      "g4-l3-ir001-current-js-random-audio-candidate" &&
      candidateReport.candidate?.animationId === ANIMATION_ID &&
      candidateReport.candidate.branches?.length === 2 &&
      candidateReport.strictAcceptanceEffect === "none",
    "IR001 random-audio candidate report is invalid",
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const branches = [];
  try {
    for (const branch of candidateReport.candidate.branches) {
      const result = await runBranch(
        browser,
        normalizedBaseUrl,
        branch,
        candidateReport.candidate.branches,
      );
      branches.push(result);
      process.stdout.write(
        `IR001 random audio outcome ${branch.outcome}: ` +
          `${result.pass ? "PASS" : "FAIL"}\n`,
      );
    }
  } finally {
    await browser.close();
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ir001-current-js-random-audio-browser-qa",
    releaseId: candidateReport.releaseId,
    animationId: ANIMATION_ID,
    authority:
      "Current-JavaScript deterministic branch selection, same-origin resource loading, playback, and Replay re-trigger only",
    authorityBoundary:
      "No spoken-language, natural random distribution, authorized original-runtime synchronization, complete listening acceptance, Replay parity, visual parity, human review, owner acceptance, strict completion, or publication authority.",
    generator,
    bindings,
    candidateReport: {
      path: CANDIDATE_REPORT,
      bytes: Buffer.byteLength(candidateText),
      sha256: sha256(candidateText),
    },
    summary: {
      branchCount: branches.length,
      passedBranchCount: branches.filter(({pass}) => pass).length,
      replayPassedBranchCount: branches.filter(
        ({replayPlayObserved}) => replayPlayObserved,
      ).length,
      wrongBranchPlayCount: branches.reduce(
        (total, branch) => total + branch.wrongBranchPlayCount,
        0,
      ),
      pass: branches.length === 2 && branches.every(({pass}) => pass),
      strictCompleteCount: 0,
      published: false,
    },
    branches,
    acceptance: {
      spokenLanguageEstablished: false,
      naturalRandomDistributionEstablished: false,
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
    animationId: ANIMATION_ID,
    branches: branches.length,
    passed: branches.filter(({pass}) => pass).length,
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
  runG4L3Ir001RandomAudioQa(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
