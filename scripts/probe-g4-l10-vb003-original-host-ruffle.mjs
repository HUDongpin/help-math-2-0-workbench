#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {readFile, readdir, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "@playwright/test";
import {PNG} from "pngjs";

import {
  buildAntecedentReport,
  stableJson,
} from "./build-g4-l10-vb003-host-entry-antecedent.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const STATIC_REPORT_RELATIVE = "reports/g4-l10-vb003-host-entry-antecedent.json";
const OUTPUT_RELATIVE = "output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic";
const RESULT_RELATIVE = `${OUTPUT_RELATIVE}/diagnostic.json`;
const RUFFLE_ROOT = path.join(PROJECT_ROOT, "public/ruffle");
const TARGET_SHELL_PATH = "/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf";
const EXPECTED_RUFFLE_PACKAGE = Object.freeze({version: "0.4.1", sha256: "097043e1bfb0a094c77411912690245eee966ae1cb672128307f299ad743d90d"});
const EXPECTED_RUFFLE_ASSETS = Object.freeze({
  "1ef41ff58c9763bed027.wasm": {bytes: 14201591, sha256: "cd0a675924f4f40a8e1e7e16f8e7fe2105d13edfb2fd650dc42aaeac1e92143a"},
  "63468f5322aed2e768a8.wasm": {bytes: 14146177, sha256: "381c459563278d830db728beb8e8f1bdeedb390d50b3c6b16bd6e4af6c2ed016"},
  LICENSE_APACHE: {bytes: 9723, sha256: "62c7a1e35f56406896d7aa7ca52d0cc0d272ac022b5d2796e7d6905db8a3636a"},
  LICENSE_MIT: {bytes: 1097, sha256: "4de9338a7879c68e911742a7d691f0797ff1ef8d8a6fb978b0c711e258fe959c"},
  "core.ruffle.0875e44536e955474b0c.js": {bytes: 104433, sha256: "28fa24cd43c3d91899f92a5beedde63c58753b63850ed4b16484c14791625f7a"},
  "core.ruffle.831c4f4a93befb9e84af.js": {bytes: 110362, sha256: "16214a9d1cc55219ee196fcd2bab9d303a6985567cbfe8ffc891eebacfd4cd29"},
  "ruffle.js": {bytes: 461418, sha256: "8593f2d1f7cc39f2000c02813bed664bfb0594dee15c3e8e18ca9f0c201081f2"},
});

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 VB003 contained Ruffle probe: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

export function classifyBrowserRequest(requestUrl, method, expectedOrigin, allowedPaths) {
  const url = new URL(requestUrl);
  if (url.protocol === "blob:" || url.protocol === "data:") return {allowed: true, disposition: "in-memory-non-network"};
  if (url.protocol !== "http:" || url.origin !== expectedOrigin) return {allowed: false, disposition: "blocked-non-loopback-or-external"};
  if (method !== "GET") return {allowed: false, disposition: "blocked-loopback-non-get"};
  if (url.search || url.hash || !allowedPaths.has(url.pathname)) return {allowed: false, disposition: "blocked-loopback-unallowlisted"};
  return {allowed: true, disposition: "allowed-exact-loopback-get"};
}

function mimeType(resourcePath) {
  if (resourcePath.endsWith(".html") || resourcePath === "/") return "text/html; charset=utf-8";
  if (resourcePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (resourcePath.endsWith(".wasm")) return "application/wasm";
  if (resourcePath.endsWith(".swf")) return "application/x-shockwave-flash";
  if (resourcePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (resourcePath.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}

async function bindRuffleAssets() {
  const names = (await readdir(RUFFLE_ROOT)).sort();
  invariant(JSON.stringify(names) === JSON.stringify(Object.keys(EXPECTED_RUFFLE_ASSETS).sort()), "local Ruffle asset set drift");
  const assets = [];
  for (const name of names) {
    const bytes = await readFile(path.join(RUFFLE_ROOT, name));
    const expected = EXPECTED_RUFFLE_ASSETS[name];
    invariant(bytes.length === expected.bytes && sha256(bytes) === expected.sha256, `${name} bytes/hash drift`);
    assets.push({name, bytes: bytes.length, sha256: sha256(bytes), contents: bytes});
  }
  const packageBytes = await readFile(path.join(PROJECT_ROOT, "node_modules/@ruffle-rs/ruffle/package.json"));
  const packageJson = JSON.parse(packageBytes);
  invariant(packageJson.version === EXPECTED_RUFFLE_PACKAGE.version && sha256(packageBytes) === EXPECTED_RUFFLE_PACKAGE.sha256, "@ruffle-rs/ruffle package drift");
  return assets;
}

function launchSources() {
  const bootstrap = Buffer.from([
    "window.RufflePlayer = window.RufflePlayer || {};",
    "window.RufflePlayer.config = {",
    '  allowNetworking: "internal",',
    "  allowScriptAccess: false,",
    '  openUrlMode: "deny",',
    '  autoplay: "on",',
    '  unmuteOverlay: "hidden",',
    '  contextMenu: "off",',
    "  allowFullscreen: false,",
    '  logLevel: "warn"',
    "};",
    "",
  ].join("\n"));
  const launch = Buffer.from([
    "(async () => {",
    "  window.__probe = {created: false, loadResolved: false, loadRejected: null};",
    "  try {",
    "    const player = window.RufflePlayer.newest().createPlayer();",
    '    player.id = "player";',
    '    player.setAttribute("aria-label", "L10 original shell Ruffle diagnostic");',
    '    player.style.width = "800px";',
    '    player.style.height = "600px";',
    '    player.style.display = "block";',
    '    document.getElementById("stage").replaceChildren(player);',
    "    window.__probe.created = true;",
    "    await player.ruffle().load({",
    `      url: "${TARGET_SHELL_PATH}",`,
    '      allowNetworking: "internal",',
    "      allowScriptAccess: false,",
    '      openUrlMode: "deny",',
    '      autoplay: "on",',
    '      unmuteOverlay: "hidden",',
    '      contextMenu: "off",',
    "      allowFullscreen: false,",
    '      logLevel: "warn"',
    "    });",
    "    window.__probe.loadResolved = true;",
    "  } catch (error) {",
    "    window.__probe.loadRejected = String(error && (error.stack || error.message) || error);",
    "  }",
    "})();",
    "",
  ].join("\n"));
  const html = Buffer.from([
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><title>L10 contained Ruffle diagnostic</title>',
    "<style>html,body{margin:0;padding:0;background:#fff;width:800px;height:600px;overflow:hidden}#stage{width:800px;height:600px}</style>",
    '</head><body><main id="stage"></main>',
    '<script src="/bootstrap.js"></script>',
    '<script src="/ruffle/ruffle.js"></script>',
    '<script src="/launch.js"></script>',
    "</body></html>",
    "",
  ].join("\n"));
  return {bootstrap, launch, html};
}

async function createExactServer(staticReport, ruffleAssets) {
  const launch = launchSources();
  const resources = new Map([
    ["/", {bytes: launch.html, role: "diagnostic-html"}],
    ["/bootstrap.js", {bytes: launch.bootstrap, role: "diagnostic-bootstrap"}],
    ["/launch.js", {bytes: launch.launch, role: "diagnostic-launch"}],
  ]);
  for (const asset of ruffleAssets) resources.set(`/ruffle/${asset.name}`, {bytes: asset.contents, role: "ruffle-runtime"});
  const runtimeRoot = path.join(PROJECT_ROOT, staticReport.runtimeTree.path);
  for (const file of staticReport.runtimeTree.files) {
    const bytes = await readFile(path.join(runtimeRoot, file.path));
    invariant(bytes.length === file.bytes && sha256(bytes) === file.sha256, `${file.path} runtime tree drift before server start`);
    resources.set(`/runtime/${file.path}`, {bytes, role: file.role});
  }
  const serverRequests = [];
  const server = createServer((request, response) => {
    let parsed;
    try {
      parsed = new URL(request.url || "", "http://127.0.0.1");
    } catch {
      response.writeHead(400, {"cache-control": "no-store"});
      response.end();
      return;
    }
    const exact = request.method === "GET" && !parsed.search && !parsed.hash ? resources.get(parsed.pathname) : null;
    serverRequests.push({method: request.method || null, path: parsed.pathname, query: parsed.search, served: Boolean(exact), role: exact?.role || null});
    if (!exact) {
      response.writeHead(404, {"cache-control": "no-store", "content-security-policy": "default-src 'none'"});
      response.end();
      return;
    }
    response.writeHead(200, {
      "content-type": mimeType(parsed.pathname),
      "content-length": exact.bytes.length,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'unsafe-inline'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'",
    });
    response.end(exact.bytes);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  invariant(address && typeof address === "object" && address.address === "127.0.0.1", "server did not bind exact IPv4 loopback");
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    resources,
    serverRequests,
    launchArtifacts: Object.entries(launch).map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha256(bytes)})),
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function waitForNewRequest(requests, expectedPath, previousCount, page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const count = requests.filter((entry) => entry.path === expectedPath && entry.disposition === "allowed-exact-loopback-get").length;
    if (count > previousCount) return {observed: true, count};
    await page.waitForTimeout(100);
  }
  const count = requests.filter((entry) => entry.path === expectedPath && entry.disposition === "allowed-exact-loopback-get").length;
  return {observed: false, count};
}

async function capturePlayer(page, outputRoot, name) {
  const target = path.join(outputRoot, name);
  const player = page.locator("ruffle-player");
  await player.waitFor({state: "visible", timeout: 15_000});
  await player.screenshot({path: target, animations: "disabled", caret: "hide"});
  const bytes = await readFile(target);
  const png = PNG.sync.read(bytes);
  invariant(png.width === 800 && png.height === 600, `${name} is ${png.width}x${png.height}, expected 800x600`);
  return {path: portable(target), bytes: bytes.length, sha256: sha256(bytes), width: png.width, height: png.height};
}

function relativeEvent(requestUrl, method, resourceType, classification, origin) {
  const parsed = new URL(requestUrl);
  return {
    url: parsed.origin === origin ? `${parsed.pathname}${parsed.search}` : requestUrl,
    path: parsed.origin === origin ? parsed.pathname : null,
    method,
    resourceType,
    disposition: classification.disposition,
  };
}

function countBy(values, selector) {
  const output = {};
  for (const value of values) output[selector(value)] = (output[selector(value)] || 0) + 1;
  return output;
}

function summarizeConsole(messages) {
  const map = new Map();
  for (const entry of messages) {
    const key = `${entry.type}\u0000${entry.text}`;
    const current = map.get(key) || {...entry, count: 0};
    current.count += 1;
    map.set(key, current);
  }
  return [...map.values()];
}

export async function runProbe() {
  const expectedStaticReport = await buildAntecedentReport({check: true});
  const staticReportPath = path.join(PROJECT_ROOT, STATIC_REPORT_RELATIVE);
  const staticReportBytes = await readFile(staticReportPath);
  invariant(staticReportBytes.toString("utf8") === stableJson(expectedStaticReport), "static antecedent report is stale");
  const ruffleAssets = await bindRuffleAssets();
  const outputRoot = path.join(PROJECT_ROOT, OUTPUT_RELATIVE);
  await mkdir(outputRoot, {recursive: true});
  const exactServer = await createExactServer(expectedStaticReport, ruffleAssets);
  const allowedPaths = new Set(exactServer.resources.keys());
  const requests = [];
  const responses = [];
  const failedRequests = [];
  const websocketAttempts = [];
  const consoleMessages = [];
  const pageErrors = [];
  const dialogs = [];
  const popups = [];
  const downloads = [];
  const screenshots = [];
  const transitions = [];
  let navigationStatus = null;
  let launchState = null;
  let playerState = null;
  let fatalError = null;
  let blocker = null;
  let initialRequestObserved = false;
  let targetRequestObserved = false;
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({
      viewport: {width: 800, height: 600},
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    await context.routeWebSocket("**/*", (socket) => {
      websocketAttempts.push({url: socket.url(), disposition: "blocked-all-websockets"});
      socket.close();
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const classification = classifyBrowserRequest(request.url(), request.method(), exactServer.origin, allowedPaths);
      requests.push(relativeEvent(request.url(), request.method(), request.resourceType(), classification, exactServer.origin));
      if (classification.allowed) await route.continue();
      else await route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    page.on("response", (response) => {
      const parsed = new URL(response.url());
      responses.push({url: parsed.origin === exactServer.origin ? `${parsed.pathname}${parsed.search}` : response.url(), status: response.status()});
    });
    page.on("requestfailed", (request) => failedRequests.push({url: request.url(), method: request.method(), failure: request.failure()}));
    page.on("console", (message) => consoleMessages.push({type: message.type(), text: message.text()}));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("dialog", async (dialog) => {
      dialogs.push({type: dialog.type(), message: dialog.message(), disposition: "dismissed"});
      await dialog.dismiss();
    });
    page.on("popup", async (popup) => {
      popups.push({url: popup.url(), disposition: "closed"});
      await popup.close();
    });
    page.on("download", async (download) => {
      downloads.push({suggestedFilename: download.suggestedFilename(), disposition: "cancelled"});
      await download.cancel();
    });

    const navigation = await page.goto(`${exactServer.origin}/`, {waitUntil: "domcontentloaded", timeout: 30_000});
    navigationStatus = navigation?.status() || null;
    invariant(navigationStatus === 200, `diagnostic page returned HTTP ${navigationStatus}`);
    await page.waitForFunction(() => window.__probe && (window.__probe.loadResolved || window.__probe.loadRejected), null, {timeout: 30_000});
    launchState = await page.evaluate(() => window.__probe);
    const initialPath = expectedStaticReport.runtimeProbeContract.expectedInitialRequest;
    const initialResult = await waitForNewRequest(requests, initialPath, 0, page, 20_000);
    initialRequestObserved = initialResult.observed;
    if (!initialRequestObserved) {
      blocker = {kind: "initial-host-child-request-not-observed", expectedPath: initialPath, afterAction: "shell-load", waitMs: 20000};
    } else {
      await page.waitForTimeout(1500);
      screenshots.push(await capturePlayer(page, outputRoot, "00-initial-ir.png"));
      process.stdout.write(`observed initial host child ${initialPath}\n`);
      const point = expectedStaticReport.exactHostContract.sourceProvenNextControlPoint;
      const expectedTransitions = expectedStaticReport.exactHostContract.targetNaturalPrefix.slice(1);
      for (const expected of expectedTransitions) {
        const expectedPath = `/runtime/HELP_COURSES/ELMGR4/L10/${expected.sourcePath}`;
        const beforeCount = requests.filter((entry) => entry.path === expectedPath && entry.disposition === "allowed-exact-loopback-get").length;
        const box = await page.locator("ruffle-player").boundingBox();
        invariant(box && Math.round(box.width) === 800 && Math.round(box.height) === 600, "Ruffle player stage geometry drift");
        await page.mouse.click(box.x + point.nativeStageX, box.y + point.nativeStageY);
        const observed = await waitForNewRequest(requests, expectedPath, beforeCount, page, 8000);
        const transition = {
          nextPressCount: expected.nextPressCount,
          action: "single-source-proven-DefineButton2_339-release-point-click",
          nativeStagePoint: {x: point.nativeStageX, y: point.nativeStageY},
          expectedPath,
          requestObserved: observed.observed,
          requestCountBefore: beforeCount,
          requestCountAfter: observed.count,
          waitMs: 8000,
        };
        transitions.push(transition);
        if (!observed.observed) {
          blocker = {kind: "source-proven-next-release-produced-no-expected-child-request", expectedPath, nextPressCount: expected.nextPressCount, waitMs: 8000};
          screenshots.push(await capturePlayer(page, outputRoot, `blocker-after-next-${String(expected.nextPressCount).padStart(2, "0")}.png`));
          process.stdout.write(`blocked before ${expectedPath}: no request after source-proven Next release\n`);
          break;
        }
        await page.waitForTimeout(900);
        const screenshotName = `${String(expected.nextPressCount).padStart(2, "0")}-${path.basename(expected.sourcePath, ".swf").toLowerCase()}.png`;
        screenshots.push(await capturePlayer(page, outputRoot, screenshotName));
        process.stdout.write(`observed transition ${expected.nextPressCount}: ${expectedPath}\n`);
      }
    }
    targetRequestObserved = requests.some((entry) => entry.path === expectedStaticReport.runtimeProbeContract.expectedTargetRequest && entry.disposition === "allowed-exact-loopback-get");
    playerState = await page.locator("ruffle-player").evaluate((player) => {
      const shadow = player.shadowRoot;
      return {
        tagName: player.tagName.toLowerCase(),
        ariaLabel: player.getAttribute("aria-label"),
        shadowRootVisibleToProbe: Boolean(shadow),
        canvases: shadow ? [...shadow.querySelectorAll("canvas")].map((canvas) => ({width: canvas.width, height: canvas.height})) : [],
      };
    });
    await context.close();
  } catch (error) {
    fatalError = error.stack || error.message;
  } finally {
    await browser.close();
    await closeServer(exactServer.server);
  }

  const blockedRequests = requests.filter((entry) => entry.disposition.startsWith("blocked-"));
  const servedUnknown = exactServer.serverRequests.filter((entry) => !entry.served);
  const externalReachedServer = exactServer.serverRequests.filter((entry) => !entry.path.startsWith("/"));
  const containmentBreached = servedUnknown.length > 0 || externalReachedServer.length > 0;
  const scriptBytes = await readFile(SCRIPT_PATH);
  const result = {
    schemaVersion: 1,
    reportType: "g4-l10-vb003-contained-original-host-ruffle-diagnostic",
    generatedAt: new Date().toISOString(),
    startedAt,
    status: fatalError
      ? "probe-error-contained-no-authority"
      : targetRequestObserved
        ? "target-request-observed-through-original-shell-in-ruffle-forensic-only"
        : initialRequestObserved
          ? "initial-host-entry-observed-target-not-reached-in-ruffle-forensic-only"
          : "shell-loaded-initial-host-entry-not-observed-in-ruffle-forensic-only",
    probe: {path: portable(SCRIPT_PATH), sha256: sha256(scriptBytes)},
    staticAntecedent: {path: STATIC_REPORT_RELATIVE, bytes: staticReportBytes.length, sha256: sha256(staticReportBytes), checkModePassedImmediatelyBeforeProbe: true, runtimeTreeId: expectedStaticReport.runtimeTree.treeId},
    runtime: {
      browser: "Chromium via @playwright/test 1.61.1",
      browserContext: "new-ephemeral-context-closed-after-probe",
      serverOrigin: exactServer.origin,
      serverBind: "127.0.0.1-ephemeral-port",
      navigationStatus,
      launchState,
      playerState,
      ruffle: {package: EXPECTED_RUFFLE_PACKAGE, assets: ruffleAssets.map(({contents, ...entry}) => entry), configuration: expectedStaticReport.runtimeProbeContract.ruffleConfiguration},
      launchArtifacts: exactServer.launchArtifacts,
    },
    containment: {
      browserRequestPolicy: "exact-origin exact-path GET allowlist; all other HTTP(S) aborted before network; all WebSockets closed",
      allowedPathCount: allowedPaths.size,
      browserRequestCount: requests.length,
      requestCountsByDisposition: countBy(requests, (entry) => entry.disposition),
      blockedRequestCount: blockedRequests.length,
      blockedRequests,
      websocketAttemptCount: websocketAttempts.length,
      websocketAttempts,
      serverRequestCount: exactServer.serverRequests.length,
      serverRequests: exactServer.serverRequests,
      serverUnknownRequestCount: servedUnknown.length,
      externalRequestReachedServerCount: externalReachedServer.length,
      dialogs,
      popups,
      downloads,
      staticSideEffectInventoryCount: expectedStaticReport.sideEffectContainment.inventoryCount,
      legacyEndpointExecutionObserved: false,
      containmentBreached,
    },
    observation: {
      shellRequestObserved: requests.some((entry) => entry.path === TARGET_SHELL_PATH && entry.disposition === "allowed-exact-loopback-get"),
      initialHostChildRequestObserved: initialRequestObserved,
      sourceProvenNextReleaseAttempts: transitions.length,
      successfulExpectedChildTransitions: transitions.filter((entry) => entry.requestObserved).length,
      targetSwfRequestObserved: targetRequestObserved,
      targetBeginHandshakeProven: false,
      targetNaturalPlaybackProven: false,
      blocker,
      transitions,
      screenshots,
    },
    diagnostics: {
      responseCount: responses.length,
      responses,
      failedRequestCount: failedRequests.length,
      failedRequests,
      console: summarizeConsole(consoleMessages),
      pageErrors,
      fatalError,
    },
    authority: {
      ruffleForensicReferenceOnly: true,
      authoritativeOriginalRuntime: false,
      originalRuntimeNaturalTrace: false,
      originalRuntimeBaseline: false,
      audioListeningOrSynchronization: false,
      visualFidelity: false,
      humanReview: false,
      ownerReview: false,
      strictCompletion: false,
      releaseOrPublication: false,
      strictAcceptanceEffect: "none",
    },
  };
  const resultPath = path.join(PROJECT_ROOT, RESULT_RELATIVE);
  await writeFile(resultPath, stableJson(result), {mode: 0o644});
  process.stdout.write(`${RESULT_RELATIVE}: wrote ${Buffer.byteLength(stableJson(result))} bytes\n`);
  process.stdout.write(`status=${result.status}; blockedRequests=${blockedRequests.length}; successfulTransitions=${result.observation.successfulExpectedChildTransitions}; targetRequestObserved=${targetRequestObserved}\n`);
  invariant(!containmentBreached, "containment breach recorded");
  return result;
}

async function main() {
  invariant(process.argv.length === 2, "this probe accepts no arguments");
  await runProbe();
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

