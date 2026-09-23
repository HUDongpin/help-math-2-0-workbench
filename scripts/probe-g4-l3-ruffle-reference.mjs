#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {chromium} from "@playwright/test";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const OUTPUT_ROOT = path.join(projectRoot, "output", "playwright", "g4-l3-ruffle-reference-diagnostics");
const HEX_64 = /^[a-f0-9]{64}$/;
const ANIMATION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function parsePositiveInteger(value, label, {allowZero = false} = {}) {
  const parsed = Number.parseInt(value, 10);
  invariant(Number.isInteger(parsed) && (allowZero ? parsed >= 0 : parsed > 0), `${label} must be ${allowZero ? "a non-negative" : "a positive"} integer`);
  return parsed;
}

export function assertLoopbackBaseUrl(value) {
  const url = new URL(value);
  invariant(url.protocol === "http:", "Ruffle diagnostic base URL must use plain HTTP on loopback");
  invariant(LOOPBACK_HOSTS.has(url.hostname), "Ruffle diagnostic base URL must use an exact loopback host");
  invariant(!url.username && !url.password, "Ruffle diagnostic base URL must not contain credentials");
  invariant(url.pathname === "/" && !url.search && !url.hash, "Ruffle diagnostic base URL must contain only an origin");
  return url.origin;
}

function resolveOutput(value) {
  const absolute = path.resolve(projectRoot, value);
  const relative = path.relative(OUTPUT_ROOT, absolute);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "Diagnostic output must be a child of output/playwright/g4-l3-ruffle-reference-diagnostics");
  return absolute;
}

export function parseArguments(argv) {
  const options = {
    baseUrl: null,
    animationId: null,
    expectedSha256: null,
    expectedBytes: null,
    expectedWidth: 800,
    expectedHeight: 600,
    language: "en",
    settleMs: 750,
    output: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = () => argv[++index] ?? "";
    if (value === "--base-url") options.baseUrl = assertLoopbackBaseUrl(next());
    else if (value === "--animation-id") options.animationId = next();
    else if (value === "--expected-sha256") options.expectedSha256 = next();
    else if (value === "--expected-bytes") options.expectedBytes = parsePositiveInteger(next(), "--expected-bytes");
    else if (value === "--expected-width") options.expectedWidth = parsePositiveInteger(next(), "--expected-width");
    else if (value === "--expected-height") options.expectedHeight = parsePositiveInteger(next(), "--expected-height");
    else if (value === "--lang") options.language = next();
    else if (value === "--settle-ms") options.settleMs = parsePositiveInteger(next(), "--settle-ms", {allowZero: true});
    else if (value === "--output") options.output = resolveOutput(next());
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(options.baseUrl, "--base-url is required");
  invariant(ANIMATION_ID.test(options.animationId ?? ""), "--animation-id must be a lowercase hyphenated ID");
  invariant(HEX_64.test(options.expectedSha256 ?? ""), "--expected-sha256 must be a lowercase SHA-256");
  invariant(Number.isInteger(options.expectedBytes), "--expected-bytes is required");
  invariant(options.language === "en" || options.language === "es", "--lang must be en or es");
  invariant(options.output, "--output is required");
  return options;
}

export async function validateSourceResponse(response, {expectedSha256, expectedBytes}) {
  invariant(response.status === 200, `SWF API returned HTTP ${response.status}`);
  invariant(response.headers.get("content-type")?.split(";", 1)[0].trim() === "application/x-shockwave-flash", "SWF API content type drift");
  invariant(response.headers.get("cache-control") === "no-store", "SWF API cache-control drift");
  const bytes = Buffer.from(await response.arrayBuffer());
  invariant(bytes.length === expectedBytes, `SWF API byte count drift: expected ${expectedBytes}, observed ${bytes.length}`);
  const observedSha256 = sha256(bytes);
  invariant(observedSha256 === expectedSha256, `SWF API hash drift: expected ${expectedSha256}, observed ${observedSha256}`);
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    contentSecurityPolicy: response.headers.get("content-security-policy"),
    bytes: bytes.length,
    sha256: observedSha256,
    exactSourceBytesVerified: true,
  };
}

function pagePath(animationId, language) {
  return `${language === "es" ? "/es" : ""}/reference/${encodeURIComponent(animationId)}`;
}

function requestDisposition(requestUrl, method, {expectedOrigin, pageUrl, sourceUrl}) {
  const url = new URL(requestUrl);
  if (url.protocol === "blob:" || url.protocol === "data:") return {allowed: true, kind: "in-memory"};
  if (url.protocol !== "http:" || url.origin !== expectedOrigin) return {allowed: false, kind: "unexpected-external"};
  if (method !== "GET" && method !== "HEAD") return {allowed: false, kind: "blocked-local-non-read-request"};
  if (
    requestUrl === pageUrl ||
    requestUrl === sourceUrl ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/ruffle/")
  ) return {allowed: true, kind: "allowlisted-loopback-read"};
  return {allowed: false, kind: "blocked-local-unallowlisted-read"};
}

export async function runProbe(options) {
  const sourceUrl = `${options.baseUrl}/api/reference/${encodeURIComponent(options.animationId)}`;
  const pageUrl = `${options.baseUrl}${pagePath(options.animationId, options.language)}`;
  const sourceResponse = await fetch(sourceUrl, {redirect: "error", cache: "no-store"});
  const sourceDiagnostic = await validateSourceResponse(sourceResponse, options);

  await mkdir(options.output, {recursive: true});
  const screenshotPath = path.join(options.output, "diagnostic-stage.png");
  const resultPath = path.join(options.output, "diagnostic.json");
  const browser = await chromium.launch({headless: true});
  const requests = [];
  const responses = [];
  const consoleMessages = [];
  const pageErrors = [];
  const unexpectedExternalRequests = [];
  const blockedLocalRequests = [];
  let pageStatus = null;
  let playerState = null;
  try {
    const context = await browser.newContext({
      viewport: {width: 1280, height: 900},
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    const page = await context.newPage();
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const disposition = requestDisposition(url, method, {expectedOrigin: options.baseUrl, pageUrl, sourceUrl});
      requests.push({url, method, resourceType: route.request().resourceType(), disposition: disposition.kind});
      if (!disposition.allowed) {
        if (disposition.kind === "unexpected-external") unexpectedExternalRequests.push({url, method});
        else blockedLocalRequests.push({url, method, disposition: disposition.kind});
        await route.abort("blockedbyclient");
      } else {
        await route.continue();
      }
    });
    page.on("response", (response) => {
      const url = response.url();
      const disposition = requestDisposition(url, response.request().method(), {expectedOrigin: options.baseUrl, pageUrl, sourceUrl});
      responses.push({url, status: response.status(), disposition: disposition.kind});
    });
    page.on("console", (message) => consoleMessages.push({type: message.type(), text: message.text()}));
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const navigation = await page.goto(pageUrl, {waitUntil: "domcontentloaded", timeout: 45_000});
    pageStatus = navigation?.status() ?? null;
    invariant(pageStatus === 200, `Reference page returned HTTP ${pageStatus}`);
    const forensicText = options.language === "es"
      ? "Ruffle es una referencia forense"
      : "Ruffle is a forensic reference";
    await page.getByText(forensicText, {exact: false}).waitFor({state: "visible", timeout: 15_000});
    const stage = page.locator(".reference-stage");
    await stage.waitFor({state: "visible", timeout: 15_000});
    await page.locator("ruffle-player").waitFor({state: "attached", timeout: 30_000});
    await page.locator('.reference-stage[aria-busy="false"]').waitFor({state: "attached", timeout: 30_000});
    await stage.evaluate((element, dimensions) => {
      element.style.width = `${dimensions.width}px`;
      element.style.height = `${dimensions.height}px`;
      element.style.maxWidth = "none";
      element.style.aspectRatio = "auto";
      element.style.boxSizing = "content-box";
    }, {width: options.expectedWidth, height: options.expectedHeight});
    if (options.settleMs > 0) await page.waitForTimeout(options.settleMs);
    playerState = await page.locator("ruffle-player").evaluate((player) => {
      const shadow = player.shadowRoot;
      const canvases = shadow ? [...shadow.querySelectorAll("canvas")].map((canvas) => ({width: canvas.width, height: canvas.height})) : [];
      return {
        tagName: player.tagName.toLowerCase(),
        shadowRootVisibleToProbe: Boolean(shadow),
        canvasCount: canvases.length,
        canvases,
        ariaLabel: player.getAttribute("aria-label"),
      };
    });
    const host = page.locator(".reference-player-host");
    await host.scrollIntoViewIfNeeded();
    const box = await host.boundingBox();
    invariant(
      box && Math.round(box.width) === options.expectedWidth && Math.round(box.height) === options.expectedHeight,
      `Reference host is not ${options.expectedWidth}x${options.expectedHeight}; observed ${box ? `${box.width}x${box.height}` : "no bounding box"}`,
    );
    await page.screenshot({
      path: screenshotPath,
      animations: "disabled",
      caret: "hide",
      clip: {
        x: Math.floor(box.x),
        y: Math.floor(box.y),
        width: options.expectedWidth,
        height: options.expectedHeight,
      },
    });
    await context.close();
  } finally {
    await browser.close();
  }

  invariant(unexpectedExternalRequests.length === 0, `Unexpected external HTTP requests attempted: ${unexpectedExternalRequests.join(", ")}`);
  invariant(requests.some((request) => request.url === sourceUrl), "Ruffle player did not request the exact SWF API URL");
  invariant(requests.some((request) => request.url === `${options.baseUrl}/api/ruffle/ruffle.js`), "Reference page did not request the local Ruffle loader");
  const screenshotBytes = await readFile(screenshotPath);
  const png = PNG.sync.read(screenshotBytes);
  invariant(png.width === options.expectedWidth && png.height === options.expectedHeight, `Diagnostic PNG is ${png.width}x${png.height}, expected ${options.expectedWidth}x${options.expectedHeight}`);

  const result = {
    schemaVersion: 1,
    reportType: "g4-l3-ruffle-local-route-load-diagnostic",
    generatedAt: new Date().toISOString(),
    probe: {path: portable(scriptPath), sha256: sha256(await readFile(scriptPath))},
    animationId: options.animationId,
    language: options.language,
    baseUrl: options.baseUrl,
    pageUrl,
    sourceUrl,
    status: "passed-local-route-load-diagnostic",
    sourceDiagnostic,
    pageDiagnostic: {
      status: pageStatus,
      forensicOnlyBoundaryVisible: true,
      ruffleLoadPromiseResolved: true,
      playerState,
      fixedDelayAfterLoadMs: options.settleMs,
      exactSourceFrameObserved: null,
      deterministicFrameSelectionSupported: false,
      scenarioSelectionSupported: false,
      languageFlashVarSelectionSupported: false,
    },
    networkDiagnostic: {
      expectedOrigin: options.baseUrl,
      allExecutedHttpRequestsExactLoopbackOrigin: true,
      unexpectedExternalRequests,
      blockedLocalRequests,
      blockedRequestsReachedServer: false,
      allowlist: ["exact reference page GET", "exact hash-bound SWF API GET", "/_next/* GET", "/api/ruffle/* GET"],
      requests,
      responses,
    },
    browserDiagnostic: {
      product: "Playwright Chromium",
      version: browser.version(),
      viewport: {width: 1280, height: 900, deviceScaleFactor: 1},
      consoleMessages,
      pageErrors,
      messagesAreRecordedDiagnosticsNotAcceptance: true,
    },
    screenshot: {
      path: portable(screenshotPath),
      bytes: screenshotBytes.length,
      sha256: sha256(screenshotBytes),
      width: png.width,
      height: png.height,
      role: "nondeterministic-natural-playback-route-load-diagnostic-only",
      sourceFrameBinding: null,
      requirementTraceEntryStateBinding: null,
    },
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: false,
      statement: "This proves only exact local SWF delivery, development reference-page loading, Ruffle load completion, loopback-only HTTP behavior, and native-size diagnostic PNG creation after a fixed delay. It is not authoritative original-runtime evidence, a strict RMSE baseline, language/scenario/behavior/audio proof, human or owner review, production implementation, fidelity, or migration completion.",
    },
  };
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  return {result, resultPath};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const {result, resultPath} = await runProbe(options);
  console.log(`PASS ${result.animationId} ${result.language}: ${portable(resultPath)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
