#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CANDIDATE_REPORT =
  "reports/g4-l3-visible-companion-audio-candidates.json";
const OUTPUT_JSON =
  "reports/g4-l3-visible-companion-audio-browser-qa.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l3-visible-companion-audio-browser-qa.md";
const PAGE_IDS = Object.freeze([
  "course-g04-l03-vb-007",
  "course-g04-l03-in-012",
  "course-g04-l03-ts-007",
]);
const BINDINGS = Object.freeze([
  CANDIDATE_REPORT,
  "packages/demos/src/g4-l3-visible-companion-audio.generated.ts",
  "packages/demos/src/modules/course-g04-l03-vb-007.tsx",
  "packages/demos/src/modules/course-g04-l03-in-012.tsx",
  "packages/demos/src/modules/course-g04-l03-ts-007.tsx",
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

function portable(value) {
  return value.split(path.sep).join("/");
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
  const requestedPort = requested.port ||
    (["https:", "wss:"].includes(requested.protocol) ? "443" : "80");
  const basePort = base.port || (base.protocol === "https:" ? "443" : "80");
  return (
    ["http:", "https:", "ws:", "wss:"].includes(requested.protocol) &&
    requested.hostname === base.hostname &&
    requestedPort === basePort
  );
}

function createDiagnostics(page, baseUrl) {
  const responses = [];
  const unexpectedRequests = [];
  const failedRequests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", (request) => {
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
    responses,
    unexpectedRequests,
    failedRequests,
    consoleErrors,
    pageErrors,
  };
}

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    const records = [];
    const elements = [];
    Object.defineProperty(window, "__helpMathVisibleCompanionAudioQa", {
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

async function probeState(page, sourcePath) {
  return page.evaluate((expectedPath) => {
    const probe = window.__helpMathVisibleCompanionAudioQa;
    const records = (probe?.records ?? [])
      .map((record) => ({
        source: new URL(record.source, location.href).pathname,
        status: record.status,
        error: record.error ?? null,
      }))
      .filter(({source}) => source === expectedPath);
    const elements = (probe?.elements ?? [])
      .map((audio) => ({
        source: new URL(audio.currentSrc || audio.src, location.href).pathname,
        paused: audio.paused,
        ended: audio.ended,
        readyState: audio.readyState,
      }))
      .filter(({source}) => source === expectedPath);
    return {records, elements};
  }, sourcePath);
}

function compactDiagnostics(diagnostics) {
  return {
    unexpectedRequestCount: diagnostics.unexpectedRequests.length,
    failedRequestCount: diagnostics.failedRequests.length,
    consoleErrorCount: diagnostics.consoleErrors.length,
    pageErrorCount: diagnostics.pageErrors.length,
  };
}

function cleanDiagnostics(diagnostics) {
  return Object.values(compactDiagnostics(diagnostics)).every(
    (count) => count === 0,
  );
}

function sourceStatus(diagnostics, pathname) {
  return diagnostics.responses.find(
    (entry) => new URL(entry.url).pathname === pathname,
  )?.status ?? null;
}

function requirementFor(coverage, frameDomain) {
  const matches = coverage.requirements.filter(
    (requirement) =>
      requirement.frameDomainId === frameDomain &&
      requirement.scenario === "source-static-reachable-domain" &&
      requirement.language === "en" &&
      requirement.coverageRole !== "placement-path",
  );
  invariant(matches.length === 1, `${coverage.animationId}/${frameDomain}: exact full-domain requirement is missing`);
  return matches[0];
}

function candidateUrl(baseUrl, candidate, requirement) {
  const url = new URL(`/en/animations/${candidate.animationId}`, baseUrl);
  url.searchParams.set("auditContext", "g4-l3-visible-companion-audio");
  url.searchParams.set("frameDomain", candidate.frameDomain);
  url.searchParams.set("scenario", "source-static-reachable-domain");
  url.searchParams.set("lang", "en");
  url.searchParams.set("seed", "0");
  url.searchParams.set("requirementId", requirement.requirementId);
  url.searchParams.set("trace", requirement.traceId);
  url.searchParams.set("entryStateSha256", requirement.entryStateSha256);
  return url.toString();
}

async function runCandidate(browser, baseUrl, candidate, requirement) {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 950},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await installAudioProbe(page);
  const diagnostics = createDiagnostics(page, baseUrl);
  try {
    const response = await page.goto(
      candidateUrl(baseUrl, candidate, requirement),
      {waitUntil: "domcontentloaded"},
    );
    const shell = page.locator(".runtime-shell");
    await shell.waitFor({state: "visible", timeout: 90_000});
    await page.locator(
      `[data-flash-frame-domain="${candidate.frameDomain}"]` +
      `[data-flash-requirement-id="${requirement.requirementId}"]`,
    ).first().waitFor({state: "attached", timeout: 90_000});
    await page.waitForFunction(
      (sourcePath) =>
        (window.__helpMathVisibleCompanionAudioQa?.records ?? []).some(
          (record) =>
            new URL(record.source, location.href).pathname === sourcePath &&
            record.status === "playing",
        ),
      candidate.publicPath,
      {timeout: 15_000},
    );
    const beforeReplay = await probeState(page, candidate.publicPath);
    const initialReplay = await shell.getAttribute("data-runtime-replay");
    await page.locator('button[data-replay-keyboard="enter-space"]').click();
    await page.waitForFunction(
      ({sourcePath, priorCount}) =>
        (window.__helpMathVisibleCompanionAudioQa?.records ?? [])
          .filter(
            (record) =>
              new URL(record.source, location.href).pathname === sourcePath &&
              record.status === "playing",
          ).length > priorCount,
      {
        sourcePath: candidate.publicPath,
        priorCount: beforeReplay.records.filter(
          ({status}) => status === "playing",
        ).length,
      },
      {timeout: 15_000},
    );
    const afterReplay = await probeState(page, candidate.publicPath);
    const replay = await shell.getAttribute("data-runtime-replay");
    const httpStatus = sourceStatus(diagnostics, candidate.publicPath);
    const result = {
      animationId: candidate.animationId,
      sourceCueId: candidate.sourceCueId,
      frameDomain: candidate.frameDomain,
      cueFrame: candidate.firstBlockFrame,
      sourcePath: candidate.publicPath,
      routeHttpStatus: response?.status() ?? null,
      sourceHttpStatus: httpStatus,
      initialPlayObserved: beforeReplay.records.some(
        ({status}) => status === "playing",
      ),
      replayRetriggerObserved:
        initialReplay === "0" &&
        replay === "1" &&
        afterReplay.records.filter(({status}) => status === "playing").length >
          beforeReplay.records.filter(({status}) => status === "playing").length,
      localDomainIdentityObserved: true,
      diagnostics: compactDiagnostics(diagnostics),
    };
    return {
      ...result,
      pass:
        result.routeHttpStatus === 200 &&
        [200, 206].includes(result.sourceHttpStatus) &&
        result.initialPlayObserved &&
        result.replayRetriggerObserved &&
        cleanDiagnostics(diagnostics),
    };
  } finally {
    await context.close();
  }
}

function renderMarkdown(report) {
  const rows = report.members.map((member) =>
    `| \`${member.animationId}\` | \`${member.sourceCueId}\` | \`${member.frameDomain}\` | ${member.cueFrame} | ${member.sourceHttpStatus} | ${member.initialPlayObserved ? "PASS" : "FAIL"} | ${member.replayRetriggerObserved ? "PASS" : "FAIL"} | ${member.pass ? "PASS" : "FAIL"} |`,
  ).join("\n");
  return `# G4 L3 visible companion audio browser QA\n\n` +
    `Result: **${report.summary.passed}/${report.summary.memberCount}** exact source-visible companion cue candidates passed Current-JS same-origin loading, play-promise, local-domain identity, and Replay re-trigger QA.\n\n` +
    `| Page | Source cue | Domain | Cue frame | HTTP | Initial play | Replay | Result |\n` +
    `|---|---|---|---:|---:|---|---|---|\n${rows}\n\n` +
    `This is engineering QA only. It does not establish spoken content/language, original-runtime reachability or synchronization, listening acceptance, Replay parity, visual fidelity, human review, Owner acceptance, strict completion, or publication.\n`;
}

export function validateReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g4-l3-visible-companion-audio-browser-qa" &&
      report.summary?.memberCount === 25 &&
      report.summary?.passed === 25 &&
      report.summary?.pass === true &&
      report.members?.length === 25 &&
      report.members.every((member) => member.pass === true) &&
      report.acceptance &&
      Object.values(report.acceptance).every((value) => value === false) &&
      report.strictAcceptanceEffect === "none",
    "Visible companion audio browser QA report is invalid or promoted acceptance",
  );
  const projected = {...report};
  delete projected.reportFingerprintSha256;
  invariant(
    report.reportFingerprintSha256 === sha256(stableJson(projected)),
    "Visible companion audio browser QA fingerprint is stale",
  );
  return report;
}

export async function runG4L3VisibleCompanionAudioQa({
  baseUrl = "http://127.0.0.1:3000",
  check = false,
} = {}) {
  const normalizedBaseUrl = localBaseUrl(baseUrl);
  const generatorPath = portable(path.relative(ROOT, SCRIPT_PATH));
  const [generator, bindings, candidateText, coverages] = await Promise.all([
    binding(generatorPath),
    Promise.all(BINDINGS.map(binding)),
    readFile(projectPath(CANDIDATE_REPORT), "utf8"),
    Promise.all(PAGE_IDS.map(async (animationId) => {
      const relative = `migrations/${animationId}/evidence/full-frame-coverage.json`;
      return {
        binding: await binding(relative),
        value: JSON.parse(await readFile(projectPath(relative), "utf8")),
      };
    })),
  ]);
  const candidateReport = JSON.parse(candidateText);
  invariant(
    candidateReport.reportType === "g4-l3-visible-companion-audio-candidates" &&
      candidateReport.summary?.visibleCompanionCueCount === 25 &&
      candidateReport.summary?.acceptedCueCount === 0 &&
      candidateReport.strictAcceptanceEffect === "none",
    "Visible companion audio candidate report is invalid",
  );
  const coverageById = new Map(
    coverages.map(({value}) => [value.animationId, value]),
  );
  const candidates = candidateReport.pages.flatMap(({candidates: pageCandidates}) =>
    pageCandidates,
  );
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const members = [];
  try {
    for (let index = 0; index < candidates.length; index += 3) {
      const batch = candidates.slice(index, index + 3);
      const results = await Promise.all(batch.map((candidate) => {
        const coverage = coverageById.get(candidate.animationId);
        invariant(coverage, `${candidate.animationId}: coverage is missing`);
        return runCandidate(
          browser,
          normalizedBaseUrl,
          candidate,
          requirementFor(coverage, candidate.frameDomain),
        );
      }));
      members.push(...results);
      process.stdout.write(
        `audio ${String(members.length).padStart(2, "0")}/25: ${results.map(({pass}) => pass ? "PASS" : "FAIL").join(",")}\n`,
      );
      for (const result of results.filter(({pass}) => !pass)) {
        process.stdout.write(`audio failure ${JSON.stringify(result)}\n`);
      }
    }
  } finally {
    await browser.close();
  }
  members.sort((left, right) =>
    left.animationId.localeCompare(right.animationId) ||
    left.sourceCueId.localeCompare(right.sourceCueId),
  );
  const passed = members.filter(({pass}) => pass).length;
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-visible-companion-audio-browser-qa",
    authority:
      "Current-JavaScript same-origin loading, local-domain cue activation, and Replay re-trigger engineering QA only",
    authorityBoundary:
      "No spoken content/language, original-runtime reachability or synchronization, listening acceptance, Replay parity, visual fidelity, human review, Owner acceptance, strict completion, or publication authority.",
    generator,
    bindings: [...bindings, ...coverages.map(({binding: item}) => item)],
    candidateReport: {
      path: CANDIDATE_REPORT,
      bytes: Buffer.byteLength(candidateText),
      sha256: sha256(candidateText),
    },
    summary: {
      memberCount: members.length,
      passed,
      pass: members.length === 25 && passed === 25,
      strictCompleteCount: 0,
      published: false,
    },
    members,
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
    passed,
    output: OUTPUT_JSON,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  let baseUrl = "http://127.0.0.1:3000";
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") check = true;
    else if (value === "--base-url") {
      invariant(argv[index + 1], "--base-url requires a value");
      baseUrl = argv[index + 1];
      index += 1;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return {baseUrl, check};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runG4L3VisibleCompanionAudioQa(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
