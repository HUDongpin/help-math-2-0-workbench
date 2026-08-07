#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
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
const STATIC_REPORT_RELATIVE =
  "reports/g4-l10-vb003-host-entry-antecedent.json";
const LEGACY_DIAGNOSTIC_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic/diagnostic.json";
export const SUCCESSOR_OUTPUT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v2";
const RESULT_RELATIVE = `${SUCCESSOR_OUTPUT_RELATIVE}/diagnostic.json`;
const IR_MIGRATION_RELATIVE =
  "migrations/course-g04-l10-ir-001/migration.json";
const IR_DISPOSITION_RELATIVE =
  "migrations/course-g04-l10-ir-001/audit/frame-domain-disposition.json";
const RUFFLE_ROOT = path.join(PROJECT_ROOT, "public/ruffle");
const TARGET_SHELL_PATH =
  "/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf";
const INITIAL_CHILD_TIMELINE_ID = "sprite-31";
const TARGET_CHILD_TIMELINE_ID = "sprite-120";
const DELIVERY_TIMEOUT_MS = 10_000;
const INITIAL_DELIVERY_TIMEOUT_MS = 30_000;
const INITIAL_COMPLETION_MINIMUM_MS = 12_000;
const INITIAL_COMPLETION_BUFFER_MS = 1_000;
const PRELOADER_SETTLE_BUFFER_MS = 750;
const PRELOADER_SETTLE_MINIMUM_MS = 3_000;
const EXPECTED_RUFFLE_PACKAGE = Object.freeze({
  version: "0.4.1",
  sha256: "097043e1bfb0a094c77411912690245eee966ae1cb672128307f299ad743d90d",
});
const EXPECTED_RUFFLE_ASSETS = Object.freeze({
  "1ef41ff58c9763bed027.wasm": {
    bytes: 14201591,
    sha256: "cd0a675924f4f40a8e1e7e16f8e7fe2105d13edfb2fd650dc42aaeac1e92143a",
  },
  "63468f5322aed2e768a8.wasm": {
    bytes: 14146177,
    sha256: "381c459563278d830db728beb8e8f1bdeedb390d50b3c6b16bd6e4af6c2ed016",
  },
  LICENSE_APACHE: {
    bytes: 9723,
    sha256: "62c7a1e35f56406896d7aa7ca52d0cc0d272ac022b5d2796e7d6905db8a3636a",
  },
  LICENSE_MIT: {
    bytes: 1097,
    sha256: "4de9338a7879c68e911742a7d691f0797ff1ef8d8a6fb978b0c711e258fe959c",
  },
  "core.ruffle.0875e44536e955474b0c.js": {
    bytes: 104433,
    sha256: "28fa24cd43c3d91899f92a5beedde63c58753b63850ed4b16484c14791625f7a",
  },
  "core.ruffle.831c4f4a93befb9e84af.js": {
    bytes: 110362,
    sha256: "16214a9d1cc55219ee196fcd2bab9d303a6985567cbfe8ffc891eebacfd4cd29",
  },
  "ruffle.js": {
    bytes: 461418,
    sha256: "8593f2d1f7cc39f2000c02813bed664bfb0594dee15c3e8e18ca9f0c201081f2",
  },
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 VB003 contained Ruffle successor v2: ${message}`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

async function readBinding(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be one ordinary file`,
  );
  const contents = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs,
    `${relativePath} changed while being read`,
  );
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

function withoutContents(binding) {
  const {contents, ...metadata} = binding;
  return metadata;
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function classifyBrowserRequest(
  requestUrl,
  method,
  expectedOrigin,
  allowedPaths,
) {
  const url = new URL(requestUrl);
  if (url.protocol === "blob:" || url.protocol === "data:") {
    return {allowed: true, disposition: "in-memory-non-network"};
  }
  if (url.protocol !== "http:" || url.origin !== expectedOrigin) {
    return {
      allowed: false,
      disposition: "blocked-non-loopback-or-external",
    };
  }
  if (method !== "GET") {
    return {allowed: false, disposition: "blocked-loopback-non-get"};
  }
  if (url.search || url.hash || !allowedPaths.has(url.pathname)) {
    return {
      allowed: false,
      disposition: "blocked-loopback-unallowlisted",
    };
  }
  return {allowed: true, disposition: "allowed-exact-loopback-get"};
}

export function deriveSuccessorWaitPolicy({
  initialChildFrameCount,
  initialChildFps,
  hostPreloaderFrameCount,
  shellFps,
}) {
  invariant(
    Number.isSafeInteger(initialChildFrameCount) &&
      initialChildFrameCount > 1 &&
      Number.isFinite(initialChildFps) &&
      initialChildFps > 0 &&
      Number.isSafeInteger(hostPreloaderFrameCount) &&
      hostPreloaderFrameCount > 1 &&
      Number.isFinite(shellFps) &&
      shellFps > 0,
    "wait-policy frame/FPS inputs are invalid",
  );
  const initialNominalDurationMs =
    initialChildFrameCount / initialChildFps * 1000;
  const initialCompletionWaitMs = Math.max(
    INITIAL_COMPLETION_MINIMUM_MS,
    Math.ceil(initialNominalDurationMs) + INITIAL_COMPLETION_BUFFER_MS,
  );
  const hostPreloaderNominalDurationMs =
    hostPreloaderFrameCount / shellFps * 1000;
  const hostPreloaderSettleMs = Math.max(
    PRELOADER_SETTLE_MINIMUM_MS,
    Math.ceil(hostPreloaderNominalDurationMs) + PRELOADER_SETTLE_BUFFER_MS,
  );
  return Object.freeze({
    initialChild: Object.freeze({
      timelineId: INITIAL_CHILD_TIMELINE_ID,
      frameCount: initialChildFrameCount,
      fps: initialChildFps,
      nominalDurationMs: initialNominalDurationMs,
      minimumWaitMs: INITIAL_COMPLETION_MINIMUM_MS,
      bufferMs: INITIAL_COMPLETION_BUFFER_MS,
      plannedWaitMs: initialCompletionWaitMs,
      purpose:
        "Allow the complete source-declared IR001 child window before the first exact Next release.",
    }),
    hostPreloader: Object.freeze({
      frameCount: hostPreloaderFrameCount,
      fps: shellFps,
      nominalDurationMs: hostPreloaderNominalDurationMs,
      minimumWaitMs: PRELOADER_SETTLE_MINIMUM_MS,
      bufferMs: PRELOADER_SETTLE_BUFFER_MS,
      plannedWaitMs: hostPreloaderSettleMs,
      purpose:
        "After exact request and HTTP/server delivery, allow the source-declared host preloader window to settle before another Next release.",
    }),
    deliveryTimeoutMs: DELIVERY_TIMEOUT_MS,
    initialDeliveryTimeoutMs: INITIAL_DELIVERY_TIMEOUT_MS,
  });
}

export function buildSuccessorTransitionPlan(staticReport) {
  const prefix = staticReport?.exactHostContract?.targetNaturalPrefix;
  invariant(
    Array.isArray(prefix) &&
      prefix.length === 8 &&
      prefix[0].nextPressCount === 0 &&
      prefix.at(-1).nextPressCount === 7 &&
      prefix.at(-1).target === true &&
      staticReport.exactHostContract.requiredNextReleaseCount === 7,
    "static seven-Next prefix drifted",
  );
  const plan = prefix.slice(1).map((entry, index) => ({
    step: index + 1,
    nextPressCount: entry.nextPressCount,
    order: entry.order,
    sourcePath: entry.sourcePath,
    expectedPath: `/runtime/HELP_COURSES/ELMGR4/L10/${entry.sourcePath}`,
    activeCourseXmlPage: entry.activeCourseXmlPage,
    target: entry.target,
  }));
  invariant(
    plan.every((entry, index) =>
      entry.step === index + 1 &&
      entry.nextPressCount === index + 1 &&
      entry.expectedPath.endsWith(entry.sourcePath)) &&
      new Set(plan.map(({expectedPath}) => expectedPath)).size === 7 &&
      plan.slice(0, -1).every(({target}) => target === false) &&
      plan.at(-1).target === true,
    "successor transition plan is not the exact seven-step chain",
  );
  return plan;
}

export function deliveryIsComplete(observation) {
  return Boolean(
    observation?.newAllowedRequestCount > 0 &&
      observation?.newHttp200ResponseCount > 0 &&
      observation?.newServerServedCount > 0,
  );
}

function mimeType(resourcePath) {
  if (resourcePath.endsWith(".html") || resourcePath === "/") {
    return "text/html; charset=utf-8";
  }
  if (resourcePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (resourcePath.endsWith(".wasm")) return "application/wasm";
  if (resourcePath.endsWith(".swf")) {
    return "application/x-shockwave-flash";
  }
  if (resourcePath.endsWith(".xml")) {
    return "application/xml; charset=utf-8";
  }
  if (resourcePath.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}

async function bindRuffleAssets() {
  const names = (await readdir(RUFFLE_ROOT)).sort();
  invariant(
    JSON.stringify(names) ===
      JSON.stringify(Object.keys(EXPECTED_RUFFLE_ASSETS).sort()),
    "local Ruffle asset set drifted",
  );
  const assets = [];
  for (const name of names) {
    const contents = await readFile(path.join(RUFFLE_ROOT, name));
    const expected = EXPECTED_RUFFLE_ASSETS[name];
    invariant(
      contents.length === expected.bytes &&
        sha256(contents) === expected.sha256,
      `${name} bytes/hash drifted`,
    );
    assets.push({
      name,
      bytes: contents.length,
      sha256: sha256(contents),
      contents,
    });
  }
  const packageBytes = await readFile(path.join(
    PROJECT_ROOT,
    "node_modules/@ruffle-rs/ruffle/package.json",
  ));
  const packageJson = JSON.parse(packageBytes);
  invariant(
    packageJson.version === EXPECTED_RUFFLE_PACKAGE.version &&
      sha256(packageBytes) === EXPECTED_RUFFLE_PACKAGE.sha256,
    "@ruffle-rs/ruffle package drifted",
  );
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
    '    player.setAttribute("aria-label", "L10 original-host Ruffle successor v2 forensic diagnostic");',
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
    '<html lang="en"><head><meta charset="utf-8"><title>L10 contained Ruffle successor v2</title>',
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

async function createExactServer(staticReport, ruffleAssets, elapsedMs) {
  const launch = launchSources();
  const resources = new Map([
    ["/", {bytes: launch.html, role: "diagnostic-html"}],
    ["/bootstrap.js", {
      bytes: launch.bootstrap,
      role: "diagnostic-bootstrap",
    }],
    ["/launch.js", {bytes: launch.launch, role: "diagnostic-launch"}],
  ]);
  for (const asset of ruffleAssets) {
    resources.set(`/ruffle/${asset.name}`, {
      bytes: asset.contents,
      role: "ruffle-runtime",
    });
  }
  const runtimeRoot = path.join(PROJECT_ROOT, staticReport.runtimeTree.path);
  for (const file of staticReport.runtimeTree.files) {
    const bytes = await readFile(path.join(runtimeRoot, file.path));
    invariant(
      bytes.length === file.bytes && sha256(bytes) === file.sha256,
      `${file.path} runtime tree drift before server start`,
    );
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
    const exact = request.method === "GET" &&
      !parsed.search &&
      !parsed.hash
      ? resources.get(parsed.pathname)
      : null;
    serverRequests.push({
      atMs: elapsedMs(),
      method: request.method || null,
      path: parsed.pathname,
      query: parsed.search,
      served: Boolean(exact),
      role: exact?.role || null,
    });
    if (!exact) {
      response.writeHead(404, {
        "cache-control": "no-store",
        "content-security-policy": "default-src 'none'",
      });
      response.end();
      return;
    }
    response.writeHead(200, {
      "content-type": mimeType(parsed.pathname),
      "content-length": exact.bytes.length,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'unsafe-inline'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'",
    });
    response.end(exact.bytes);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  invariant(
    address &&
      typeof address === "object" &&
      address.address === "127.0.0.1",
    "server did not bind exact IPv4 loopback",
  );
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    resources,
    serverRequests,
    launchArtifacts: Object.entries(launch).map(([name, bytes]) => ({
      name,
      bytes: bytes.length,
      sha256: sha256(bytes),
    })),
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function countExact(values, predicate) {
  return values.filter(predicate).length;
}

function deliveryBaseline(pathname, requests, responses, serverRequests) {
  return {
    path: pathname,
    allowedRequestCount: countExact(
      requests,
      (entry) => entry.path === pathname &&
        entry.disposition === "allowed-exact-loopback-get",
    ),
    http200ResponseCount: countExact(
      responses,
      (entry) => entry.path === pathname && entry.status === 200,
    ),
    serverServedCount: countExact(
      serverRequests,
      (entry) => entry.path === pathname && entry.served === true,
    ),
  };
}

function deliverySnapshot(
  pathname,
  baseline,
  requests,
  responses,
  serverRequests,
) {
  const requestEvents = requests.filter((entry) =>
    entry.path === pathname &&
    entry.disposition === "allowed-exact-loopback-get");
  const responseEvents = responses.filter((entry) =>
    entry.path === pathname && entry.status === 200);
  const serverEvents = serverRequests.filter((entry) =>
    entry.path === pathname && entry.served === true);
  const newRequests = requestEvents.slice(baseline.allowedRequestCount);
  const newResponses = responseEvents.slice(baseline.http200ResponseCount);
  const newServerEvents = serverEvents.slice(baseline.serverServedCount);
  const snapshot = {
    path: pathname,
    before: baseline,
    after: {
      allowedRequestCount: requestEvents.length,
      http200ResponseCount: responseEvents.length,
      serverServedCount: serverEvents.length,
    },
    newAllowedRequestCount: newRequests.length,
    newHttp200ResponseCount: newResponses.length,
    newServerServedCount: newServerEvents.length,
    firstNewRequestAtMs: newRequests[0]?.atMs ?? null,
    firstNewHttp200ResponseAtMs: newResponses[0]?.atMs ?? null,
    firstNewServerServedAtMs: newServerEvents[0]?.atMs ?? null,
  };
  return {...snapshot, complete: deliveryIsComplete(snapshot)};
}

async function waitForExpectedDelivery({
  page,
  pathname,
  baseline,
  requests,
  responses,
  serverRequests,
  timeoutMs,
  elapsedMs,
}) {
  const startedAtMs = elapsedMs();
  const deadline = Date.now() + timeoutMs;
  let observation = deliverySnapshot(
    pathname,
    baseline,
    requests,
    responses,
    serverRequests,
  );
  while (!observation.complete && Date.now() < deadline) {
    await page.waitForTimeout(100);
    observation = deliverySnapshot(
      pathname,
      baseline,
      requests,
      responses,
      serverRequests,
    );
  }
  return {
    ...observation,
    waitStartedAtMs: startedAtMs,
    waitEndedAtMs: elapsedMs(),
    timeoutMs,
  };
}

async function recordWait(page, waits, {
  kind,
  plannedWaitMs,
  evidence,
  elapsedMs,
}) {
  const startedAtMs = elapsedMs();
  await page.waitForTimeout(plannedWaitMs);
  const endedAtMs = elapsedMs();
  const record = {
    kind,
    plannedWaitMs,
    actualWaitMs: endedAtMs - startedAtMs,
    startedAtMs,
    endedAtMs,
    completed: endedAtMs - startedAtMs >= plannedWaitMs,
    evidence,
  };
  waits.push(record);
  return record;
}

async function capturePlayer(page, outputRoot, name, elapsedMs) {
  const target = path.join(outputRoot, name);
  const player = page.locator("ruffle-player");
  await player.waitFor({state: "visible", timeout: 15_000});
  await player.screenshot({
    path: target,
    animations: "disabled",
    caret: "hide",
  });
  const bytes = await readFile(target);
  const png = PNG.sync.read(bytes);
  invariant(
    png.width === 800 && png.height === 600,
    `${name} is ${png.width}x${png.height}, expected 800x600`,
  );
  return {
    atMs: elapsedMs(),
    path: portable(target),
    bytes: bytes.length,
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
  };
}

function relativeEvent(
  requestUrl,
  method,
  resourceType,
  classification,
  origin,
  atMs,
) {
  const parsed = new URL(requestUrl);
  return {
    atMs,
    url: parsed.origin === origin
      ? `${parsed.pathname}${parsed.search}`
      : requestUrl,
    path: parsed.origin === origin ? parsed.pathname : null,
    method,
    resourceType,
    disposition: classification.disposition,
  };
}

function countBy(values, selector) {
  const output = {};
  for (const value of values) {
    const key = selector(value);
    output[key] = (output[key] || 0) + 1;
  }
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

async function bindSuccessorInputs() {
  const expectedStaticReport = await buildAntecedentReport({check: true});
  const [
    staticAntecedent,
    legacyDiagnostic,
    irMigration,
    irDisposition,
  ] = await Promise.all([
    readBinding(STATIC_REPORT_RELATIVE),
    readBinding(LEGACY_DIAGNOSTIC_RELATIVE),
    readBinding(IR_MIGRATION_RELATIVE),
    readBinding(IR_DISPOSITION_RELATIVE),
  ]);
  invariant(
    staticAntecedent.contents.toString("utf8") ===
      stableJson(expectedStaticReport),
    "current successor antecedent report is stale",
  );
  invariant(
    expectedStaticReport.diagnosticContinuity?.diagnostic?.path ===
      LEGACY_DIAGNOSTIC_RELATIVE &&
      expectedStaticReport.diagnosticContinuity.diagnostic.bytes ===
        legacyDiagnostic.bytes &&
      expectedStaticReport.diagnosticContinuity.diagnostic.sha256 ===
        legacyDiagnostic.sha256,
    "legacy diagnostic continuity binding drifted",
  );
  const migration = JSON.parse(irMigration.contents.toString("utf8"));
  const disposition = JSON.parse(irDisposition.contents.toString("utf8"));
  invariant(
    migration.animationId === "course-g04-l10-ir-001" &&
      disposition.animationId === migration.animationId &&
      migration.source?.swfSha256 ===
        expectedStaticReport.canonicalBindings.sourceResources.find(
          ({role}) => role === "natural-entry-00-initial-ir",
        )?.sha256,
    "IR001 source identity drifted",
  );
  const manifestDomains = migration.implementation?.frameDomains?.filter(
    ({sourceTimelineId}) => sourceTimelineId === INITIAL_CHILD_TIMELINE_ID,
  );
  const dispositionDomains = disposition.timelines?.filter(
    ({timelineId}) => timelineId === INITIAL_CHILD_TIMELINE_ID,
  );
  invariant(
    manifestDomains?.length === 1 &&
      dispositionDomains?.length === 1 &&
      manifestDomains[0].id === INITIAL_CHILD_TIMELINE_ID &&
      manifestDomains[0].kind === "nested" &&
      manifestDomains[0].parentFrameDomainId === "root" &&
      manifestDomains[0].frameCount === 136 &&
      manifestDomains[0].sourceParentTimelineIds?.length === 1 &&
      manifestDomains[0].sourceParentTimelineIds[0] === "root" &&
      manifestDomains[0].sourceProof?.proofType ===
        "multi-frame-local-action-independent-domain" &&
      dispositionDomains[0].disposition === "declared-frame-domain" &&
      dispositionDomains[0].frameCount === manifestDomains[0].frameCount &&
      dispositionDomains[0].rootPlacement?.namedPlacementPath?.length === 1 &&
      dispositionDomains[0].rootPlacement.namedPlacementPath[0]
        .parentTimelineId === "root" &&
      dispositionDomains[0].rootPlacement.namedPlacementPath[0]
        .instanceName.toLowerCase() === "animation",
    "IR001 136-frame direct child declaration drifted",
  );
  const waitPolicy = deriveSuccessorWaitPolicy({
    initialChildFrameCount: manifestDomains[0].frameCount,
    initialChildFps: migration.runtime.fps,
    hostPreloaderFrameCount:
      expectedStaticReport.exactHostContract.hostPreloaderFrameDomain.frameCount,
    shellFps: expectedStaticReport.exactHostContract.shell.fps,
  });
  const transitionPlan = buildSuccessorTransitionPlan(expectedStaticReport);
  return {
    expectedStaticReport,
    staticAntecedent,
    legacyDiagnostic,
    irMigration,
    irDisposition,
    initialChildDomain: manifestDomains[0],
    transitionPlan,
    waitPolicy,
  };
}

async function createVersionedOutput(inputs) {
  const outputRoot = path.join(PROJECT_ROOT, SUCCESSOR_OUTPUT_RELATIVE);
  invariant(
    !(await pathExists(outputRoot)),
    `${SUCCESSOR_OUTPUT_RELATIVE} already exists; immutable successor output will not be overwritten`,
  );
  await mkdir(outputRoot, {recursive: false});
  const archives = [
    {
      name: `antecedent-${inputs.staticAntecedent.sha256}.json`,
      binding: inputs.staticAntecedent,
    },
    {
      name: `ir001-migration-${inputs.irMigration.sha256}.json`,
      binding: inputs.irMigration,
    },
    {
      name:
        `ir001-frame-domain-disposition-${inputs.irDisposition.sha256}.json`,
      binding: inputs.irDisposition,
    },
  ];
  const outputs = [];
  for (const archive of archives) {
    const absolutePath = path.join(outputRoot, archive.name);
    await writeFile(absolutePath, archive.binding.contents, {
      flag: "wx",
      mode: 0o444,
    });
    await chmod(absolutePath, 0o444);
    outputs.push({
      path: portable(absolutePath),
      bytes: archive.binding.bytes,
      sha256: archive.binding.sha256,
      mode: "0444",
    });
  }
  return {outputRoot, archives: outputs};
}

export async function runSuccessorProbe() {
  const inputs = await bindSuccessorInputs();
  const ruffleAssets = await bindRuffleAssets();
  const output = await createVersionedOutput(inputs);
  const probeStarted = Date.now();
  const elapsedMs = () => Date.now() - probeStarted;
  const exactServer = await createExactServer(
    inputs.expectedStaticReport,
    ruffleAssets,
    elapsedMs,
  );
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
  const waits = [];
  const transitions = [];
  let navigationStatus = null;
  let launchState = null;
  let playerState = null;
  let initialDelivery = null;
  let initialCompletionWait = null;
  let fatalError = null;
  let blocker = null;
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({
      viewport: {width: 800, height: 600},
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    await context.routeWebSocket("**/*", (socket) => {
      websocketAttempts.push({
        atMs: elapsedMs(),
        url: socket.url(),
        disposition: "blocked-all-websockets",
      });
      socket.close();
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const classification = classifyBrowserRequest(
        request.url(),
        request.method(),
        exactServer.origin,
        allowedPaths,
      );
      requests.push(relativeEvent(
        request.url(),
        request.method(),
        request.resourceType(),
        classification,
        exactServer.origin,
        elapsedMs(),
      ));
      if (classification.allowed) await route.continue();
      else await route.abort("blockedbyclient");
    });
    const page = await context.newPage();
    page.on("response", (response) => {
      const parsed = new URL(response.url());
      responses.push({
        atMs: elapsedMs(),
        url: parsed.origin === exactServer.origin
          ? `${parsed.pathname}${parsed.search}`
          : response.url(),
        path: parsed.origin === exactServer.origin ? parsed.pathname : null,
        status: response.status(),
      });
    });
    page.on("requestfailed", (request) => {
      failedRequests.push({
        atMs: elapsedMs(),
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
      });
    });
    page.on("console", (message) => {
      consoleMessages.push({
        atMs: elapsedMs(),
        type: message.type(),
        text: message.text(),
      });
    });
    page.on("pageerror", (error) => {
      pageErrors.push({atMs: elapsedMs(), message: error.message});
    });
    page.on("dialog", async (dialog) => {
      dialogs.push({
        atMs: elapsedMs(),
        type: dialog.type(),
        message: dialog.message(),
        disposition: "dismissed",
      });
      await dialog.dismiss();
    });
    page.on("popup", async (popup) => {
      popups.push({
        atMs: elapsedMs(),
        url: popup.url(),
        disposition: "closed",
      });
      await popup.close();
    });
    page.on("download", async (download) => {
      downloads.push({
        atMs: elapsedMs(),
        suggestedFilename: download.suggestedFilename(),
        disposition: "cancelled",
      });
      await download.cancel();
    });

    const navigation = await page.goto(`${exactServer.origin}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    navigationStatus = navigation?.status() || null;
    invariant(
      navigationStatus === 200,
      `diagnostic page returned HTTP ${navigationStatus}`,
    );
    await page.waitForFunction(
      () => window.__probe &&
        (window.__probe.loadResolved || window.__probe.loadRejected),
      null,
      {timeout: 30_000},
    );
    launchState = await page.evaluate(() => window.__probe);
    const initialPath =
      inputs.expectedStaticReport.runtimeProbeContract.expectedInitialRequest;
    const initialBaseline = deliveryBaseline(
      initialPath,
      requests,
      responses,
      exactServer.serverRequests,
    );
    initialBaseline.allowedRequestCount = 0;
    initialBaseline.http200ResponseCount = 0;
    initialBaseline.serverServedCount = 0;
    initialDelivery = await waitForExpectedDelivery({
      page,
      pathname: initialPath,
      baseline: initialBaseline,
      requests,
      responses,
      serverRequests: exactServer.serverRequests,
      timeoutMs: inputs.waitPolicy.initialDeliveryTimeoutMs,
      elapsedMs,
    });
    if (!initialDelivery.complete) {
      blocker = {
        kind: "initial-host-child-exact-delivery-not-observed",
        expectedPath: initialPath,
        observation: initialDelivery,
      };
    } else {
      screenshots.push(await capturePlayer(
        page,
        output.outputRoot,
        "00-initial-ir-delivered.png",
        elapsedMs,
      ));
      initialCompletionWait = await recordWait(page, waits, {
        kind: "ir001-136-frame-child-completion-window",
        plannedWaitMs: inputs.waitPolicy.initialChild.plannedWaitMs,
        evidence: {
          migration: withoutContents(inputs.irMigration),
          disposition: withoutContents(inputs.irDisposition),
          timelineId: INITIAL_CHILD_TIMELINE_ID,
          frameCount: inputs.initialChildDomain.frameCount,
          fps: inputs.waitPolicy.initialChild.fps,
          nominalDurationMs:
            inputs.waitPolicy.initialChild.nominalDurationMs,
          minimumWaitMs: inputs.waitPolicy.initialChild.minimumWaitMs,
          bufferMs: inputs.waitPolicy.initialChild.bufferMs,
        },
        elapsedMs,
      });
      invariant(
        initialCompletionWait.completed,
        "IR001 completion wait ended early",
      );
      screenshots.push(await capturePlayer(
        page,
        output.outputRoot,
        "00-initial-ir-after-136-frame-window.png",
        elapsedMs,
      ));
      const point =
        inputs.expectedStaticReport.exactHostContract
          .sourceProvenNextControlPoint;
      let previousDelivery = initialDelivery;
      let previousSettle = initialCompletionWait;
      for (const expected of inputs.transitionPlan) {
        invariant(
          previousDelivery.complete && previousSettle?.completed,
          `step ${expected.step} attempted without prior exact delivery and settle`,
        );
        const baseline = deliveryBaseline(
          expected.expectedPath,
          requests,
          responses,
          exactServer.serverRequests,
        );
        const box = await page.locator("ruffle-player").boundingBox();
        invariant(
          box &&
            Math.round(box.width) === 800 &&
            Math.round(box.height) === 600,
          "Ruffle player stage geometry drifted",
        );
        const click = {
          atMs: elapsedMs(),
          action:
            "single-source-proven-DefineButton2_339-release-point-click",
          nativeStagePoint: {x: point.nativeStageX, y: point.nativeStageY},
          viewportPoint: {
            x: box.x + point.nativeStageX,
            y: box.y + point.nativeStageY,
          },
          priorExpectedDeliveryComplete: previousDelivery.complete,
          priorSettleComplete: previousSettle.completed,
        };
        await page.mouse.click(click.viewportPoint.x, click.viewportPoint.y);
        const delivery = await waitForExpectedDelivery({
          page,
          pathname: expected.expectedPath,
          baseline,
          requests,
          responses,
          serverRequests: exactServer.serverRequests,
          timeoutMs: inputs.waitPolicy.deliveryTimeoutMs,
          elapsedMs,
        });
        const transition = {
          ...expected,
          click,
          delivery,
          preloaderSettle: null,
          screenshot: null,
        };
        transitions.push(transition);
        if (!delivery.complete) {
          blocker = {
            kind:
              "source-proven-next-release-produced-no-complete-exact-child-delivery",
            step: expected.step,
            nextPressCount: expected.nextPressCount,
            expectedPath: expected.expectedPath,
            observation: delivery,
          };
          transition.screenshot = await capturePlayer(
            page,
            output.outputRoot,
            `blocker-after-next-${String(expected.step).padStart(2, "0")}.png`,
            elapsedMs,
          );
          screenshots.push(transition.screenshot);
          break;
        }
        transition.preloaderSettle = await recordWait(page, waits, {
          kind: "host-preloader-settle-after-exact-child-delivery",
          plannedWaitMs:
            inputs.waitPolicy.hostPreloader.plannedWaitMs,
          evidence: {
            expectedPath: expected.expectedPath,
            delivery,
            hostPreloaderFrameDomain:
              inputs.expectedStaticReport.exactHostContract
                .hostPreloaderFrameDomain,
            shellFps: inputs.waitPolicy.hostPreloader.fps,
            nominalDurationMs:
              inputs.waitPolicy.hostPreloader.nominalDurationMs,
            minimumWaitMs:
              inputs.waitPolicy.hostPreloader.minimumWaitMs,
            bufferMs: inputs.waitPolicy.hostPreloader.bufferMs,
          },
          elapsedMs,
        });
        invariant(
          transition.preloaderSettle.completed,
          `step ${expected.step} preloader settle ended early`,
        );
        const stem = path.basename(expected.sourcePath, ".swf")
          .toLowerCase();
        transition.screenshot = await capturePlayer(
          page,
          output.outputRoot,
          `${String(expected.step).padStart(2, "0")}-${stem}-after-delivery-settle.png`,
          elapsedMs,
        );
        screenshots.push(transition.screenshot);
        previousDelivery = delivery;
        previousSettle = transition.preloaderSettle;
      }
    }
    playerState = await page.locator("ruffle-player").evaluate((player) => {
      const shadow = player.shadowRoot;
      return {
        tagName: player.tagName.toLowerCase(),
        ariaLabel: player.getAttribute("aria-label"),
        shadowRootVisibleToProbe: Boolean(shadow),
        canvases: shadow
          ? [...shadow.querySelectorAll("canvas")].map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
          }))
          : [],
      };
    });
    await context.close();
  } catch (error) {
    fatalError = error.stack || error.message;
  } finally {
    await browser.close();
    await closeServer(exactServer.server);
  }

  const legacyDiagnosticAfter = await readBinding(
    LEGACY_DIAGNOSTIC_RELATIVE,
  );
  invariant(
    legacyDiagnosticAfter.bytes === inputs.legacyDiagnostic.bytes &&
      legacyDiagnosticAfter.sha256 === inputs.legacyDiagnostic.sha256,
    "legacy diagnostic changed during successor probe",
  );
  const blockedRequests = requests.filter((entry) =>
    entry.disposition.startsWith("blocked-"));
  const servedUnknown = exactServer.serverRequests.filter((entry) =>
    !entry.served);
  const containmentBreached = servedUnknown.length > 0;
  const targetPath =
    inputs.expectedStaticReport.runtimeProbeContract.expectedTargetRequest;
  const targetTransition = transitions.find(({target}) => target === true);
  const targetDelivery = targetTransition?.delivery ?? null;
  const successfulTransitions = transitions.filter(({delivery}) =>
    delivery.complete);
  const furthestEntry = successfulTransitions.at(-1) ?? null;
  const audioRelative =
    inputs.expectedStaticReport.audioAntecedent.spanishHostUserTrack.path;
  const externalAudioPath = `/runtime/${audioRelative}`;
  const externalAudioRequestCount = countExact(
    requests,
    (entry) => entry.path === externalAudioPath &&
      entry.disposition === "allowed-exact-loopback-get",
  );
  const externalAudioResponse200Count = countExact(
    responses,
    (entry) => entry.path === externalAudioPath && entry.status === 200,
  );
  const scriptBytes = await readFile(SCRIPT_PATH);
  const result = {
    schemaVersion: 2,
    reportType:
      "g4-l10-vb003-contained-original-host-ruffle-successor-v2-diagnostic",
    generatedAt: new Date().toISOString(),
    status: fatalError
      ? "probe-error-contained-no-authority"
      : targetDelivery?.complete
        ? "target-swf-http-delivery-observed-through-original-shell-in-ruffle-forensic-only-internal-state-unobserved"
        : initialDelivery?.complete
          ? "initial-host-entry-observed-target-not-reached-in-ruffle-forensic-only"
          : "shell-loaded-initial-host-entry-not-observed-in-ruffle-forensic-only",
    probe: {
      path: portable(SCRIPT_PATH),
      bytes: scriptBytes.length,
      sha256: sha256(scriptBytes),
      outputPath: RESULT_RELATIVE,
      overwritesLegacyDiagnostic: false,
    },
    lineage: {
      staticAntecedent: {
        ...withoutContents(inputs.staticAntecedent),
        checkModePassedImmediatelyBeforeProbe: true,
        runtimeTreeId: inputs.expectedStaticReport.runtimeTree.treeId,
        archivedCopy: output.archives[0],
      },
      ir001CompletionWindowEvidence: {
        migration: withoutContents(inputs.irMigration),
        migrationArchivedCopy: output.archives[1],
        disposition: withoutContents(inputs.irDisposition),
        dispositionArchivedCopy: output.archives[2],
        timelineId: INITIAL_CHILD_TIMELINE_ID,
        frameCount: inputs.initialChildDomain.frameCount,
        fps: inputs.waitPolicy.initialChild.fps,
      },
      legacyDiagnosticPreserved: {
        before: withoutContents(inputs.legacyDiagnostic),
        after: withoutContents(legacyDiagnosticAfter),
        unchanged: true,
      },
    },
    staticPlan: {
      requiredNextReleaseCount: 7,
      transitions: inputs.transitionPlan,
      sourceProvenNextControlPoint:
        inputs.expectedStaticReport.exactHostContract
          .sourceProvenNextControlPoint,
      waitPolicy: inputs.waitPolicy,
    },
    runtime: {
      browser: "Chromium via @playwright/test 1.61.1",
      browserContext: "new-ephemeral-context-closed-after-probe",
      serverOrigin: exactServer.origin,
      serverBind: "127.0.0.1-ephemeral-port",
      navigationStatus,
      launchState,
      playerState,
      ruffle: {
        package: EXPECTED_RUFFLE_PACKAGE,
        assets: ruffleAssets.map(({contents, ...entry}) => entry),
        configuration:
          inputs.expectedStaticReport.runtimeProbeContract
            .ruffleConfiguration,
      },
      launchArtifacts: exactServer.launchArtifacts,
    },
    containment: {
      browserRequestPolicy:
        "exact-origin exact-path GET allowlist; all other HTTP(S) aborted before network; all WebSockets closed",
      allowedPathCount: allowedPaths.size,
      browserRequestCount: requests.length,
      requestCountsByDisposition: countBy(
        requests,
        (entry) => entry.disposition,
      ),
      blockedRequestCount: blockedRequests.length,
      blockedRequests,
      websocketAttemptCount: websocketAttempts.length,
      websocketAttempts,
      serverRequestCount: exactServer.serverRequests.length,
      serverRequests: exactServer.serverRequests,
      serverUnknownRequestCount: servedUnknown.length,
      dialogs,
      popups,
      downloads,
      legacyEndpointExecutionObserved: false,
      containmentBreached,
    },
    observation: {
      shellRequestObserved: requests.some((entry) =>
        entry.path === TARGET_SHELL_PATH &&
        entry.disposition === "allowed-exact-loopback-get"),
      initialChildDelivery: initialDelivery,
      initialCompletionWait,
      waits,
      sourceProvenNextReleaseAttempts: transitions.length,
      successfulExpectedChildTransitions: successfulTransitions.length,
      furthestReach: furthestEntry
        ? {
          step: furthestEntry.step,
          nextPressCount: furthestEntry.nextPressCount,
          sourcePath: furthestEntry.sourcePath,
          expectedPath: furthestEntry.expectedPath,
        }
        : initialDelivery?.complete
          ? {
            step: 0,
            nextPressCount: 0,
            sourcePath:
              inputs.expectedStaticReport.exactHostContract
                .targetNaturalPrefix[0].sourcePath,
            expectedPath:
              inputs.expectedStaticReport.runtimeProbeContract
                .expectedInitialRequest,
          }
          : null,
      blocker,
      transitions,
      screenshots,
      target: {
        expectedSwfPath: targetPath,
        swfRequestObserved: Boolean(
          targetDelivery?.newAllowedRequestCount > 0,
        ),
        swfHttp200ResponseObserved: Boolean(
          targetDelivery?.newHttp200ResponseCount > 0,
        ),
        swfServerDeliveryObserved: Boolean(
          targetDelivery?.newServerServedCount > 0,
        ),
        beginHandshake: {
          sourceStaticAntecedentPresent: true,
          actuallyObservedInRuffle: false,
          reason:
            "HTTP delivery and a screenshot do not expose the target ActionScript _level0.InternalPreloader/gotoAndPlay(begin) handshake.",
        },
        childFrameDomain: {
          timelineId: TARGET_CHILD_TIMELINE_ID,
          sourceDeclaredFrameCount:
            inputs.expectedStaticReport.exactHostContract.target
              .childAnimationFrameDomain.frameCount,
          actuallyObservedInRuffle: false,
          reason:
            "The contained Ruffle surface exposes no hash-bound internal display-list/playhead telemetry for sprite-120.",
        },
        naturalPlaybackProven: false,
      },
      audio: {
        externalSpanishPath: externalAudioPath,
        externalSpanishRequestCount: externalAudioRequestCount,
        externalSpanishHttp200ResponseCount:
          externalAudioResponse200Count,
        externalSpanishRequestObserved: externalAudioRequestCount > 0,
        externalSpanishDeliveryObserved:
          externalAudioResponse200Count > 0,
        embeddedStreamSourceAntecedentPresent: true,
        embeddedAudioPlaybackActuallyObserved: false,
        audibleListeningActuallyObserved: false,
        synchronizationActuallyObserved: false,
        reason:
          "No named-human listening or instrumented, hash-bound internal audio/playhead observation occurred in this headless Ruffle diagnostic.",
      },
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
      targetBeginHandshakeProven: false,
      targetChildDomainEntryProven: false,
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
  await writeFile(resultPath, stableJson(result), {
    flag: "wx",
    mode: 0o444,
  });
  await chmod(resultPath, 0o444);
  process.stdout.write(
    `${RESULT_RELATIVE}: wrote ${Buffer.byteLength(stableJson(result))} bytes\n`,
  );
  process.stdout.write(
    `status=${result.status}; successfulTransitions=${result.observation.successfulExpectedChildTransitions}; targetDelivery=${Boolean(targetDelivery?.complete)}; blockedRequests=${blockedRequests.length}\n`,
  );
  invariant(!containmentBreached, "containment breach recorded");
  return result;
}

async function main() {
  invariant(process.argv.length === 2, "this successor probe accepts no arguments");
  await runSuccessorProbe();
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
