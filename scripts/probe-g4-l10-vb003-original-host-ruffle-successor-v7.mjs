#!/usr/bin/env node

import {createServer} from "node:http";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "@playwright/test";
import {PNG} from "pngjs";

import {
  buildAntecedentReport,
  sha256,
  stableJson,
} from "./build-g4-l10-vb003-host-entry-antecedent.mjs";
import {
  buildSuccessorTransitionPlan,
  classifyBrowserRequest,
  deliveryIsComplete,
} from "./probe-g4-l10-vb003-original-host-ruffle-successor-v2.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const STATIC_REPORT_RELATIVE =
  "reports/g4-l10-vb003-host-entry-antecedent.json";
const V2_RESULT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v2/diagnostic.json";
const V2_RESULT_SHA256 =
  "eb6cbb3b0a10818b793eeeb5da4a4aeea35765815f8d21fd35f3d0ee7e9b7a14";
const V3_RESULT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v3/diagnostic.json";
const V3_RESULT_SHA256 =
  "1932697190cba44e8feca8bd9232116f1290658d84d7e659ecef795015e8dd0c";
const V4_RESULT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v4/diagnostic.json";
const V4_RESULT_SHA256 =
  "25cea5217ae58894a1660f6434d35268c45f64161411f63385b06966a0928887";
const V5_RESULT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v5/diagnostic.json";
const V5_RESULT_SHA256 =
  "f9a00c29d7fc2bb7a752aa4882edf11c859981c42b466957f23e14d48d611d6e";
const V6_RESULT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v6/diagnostic.json";
const V6_RESULT_SHA256 =
  "60fe292caedb7b2e5347568c22edb8b423b4822966ce50d2af8fde32790be112";
const VB001_AUDIT_RELATIVE =
  "reports/g4-l10-vb001-host-chain-static-audit.json";
const VB001_AUDIT_SHA256 =
  "cad80412082823298acddd7fcc69b4fb9e43f23cf00f9f9deeb6fffdd4025e11";
export const SUCCESSOR_V7_OUTPUT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v7";
const RESULT_RELATIVE = `${SUCCESSOR_V7_OUTPUT_RELATIVE}/diagnostic.json`;
const RUFFLE_ROOT = path.join(PROJECT_ROOT, "public/ruffle");
const SOURCE_ARCHIVE = path.join(
  PROJECT_ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES",
);
export const KEYTERM_XML_REQUEST_PATH =
  "/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml";
const KEYTERM_XML_SOURCE_RELATIVE =
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml";
const KEYTERM_XML_EXPECTED = Object.freeze({
  bytes: 378783,
  sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
});
const TARGET_SHELL_PATH =
  "/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf";
const INITIAL_CHILD_PATH =
  "/runtime/HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf";
const DELIVERY_TIMEOUT_MS = 10_000;
const INITIAL_DELIVERY_TIMEOUT_MS = 30_000;
const EXPECTED_INITIAL_WAIT_MS = 12_334;
const EXPECTED_PRELOADER_WAIT_MS = 3_084;

export const SOURCE_DECLARED_TRANSITION_WINDOWS = Object.freeze([
  Object.freeze({
    step: 1,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
    animationId: "course-g04-l10-rw-002",
    timelineId: "sprite-356",
    frameCount: 1_132,
    dispositionPath:
      "migrations/course-g04-l10-rw-002/audit/frame-domain-disposition.json",
    dispositionSha256:
      "7b3b436f8e7690345487f598c1be22a0947da4b283ea97f51cd496706d51e621",
    entryStateEnSha256:
      "9834c71cb210d2bfd576a66053c9b0312dab77dce3d92353a5dda7a592a9ccc8",
    entryStateEsSha256:
      "89136193a43063e1a349e624fd1653b83998ad627909c255debc93c0d8642a94",
    plannedWaitMs: 98_418,
  }),
  Object.freeze({
    step: 2,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf",
    animationId: "course-g04-l10-rw-003",
    timelineId: "sprite-253",
    frameCount: 1_046,
    dispositionPath:
      "migrations/course-g04-l10-rw-003/audit/frame-domain-disposition.json",
    dispositionSha256:
      "6e1fc41198ad9fbec384ae43e81ee73a5509244344a06df74fcbe9ce4a64e54e",
    entryStateEnSha256:
      "165af1d876746169614f0bdd5f4ef53a4e70c19fda024aca9030d1422eca0d57",
    entryStateEsSha256:
      "0d7f8d1b28e7e678fb639bfd0280442da7b31bb78aa94569b5d2f6c00c0cd89b",
    plannedWaitMs: 91_251,
  }),
  Object.freeze({
    step: 3,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf",
    animationId: "course-g04-l10-rw-004",
    timelineId: "sprite-109",
    frameCount: 1_325,
    dispositionPath:
      "migrations/course-g04-l10-rw-004/audit/frame-domain-disposition.json",
    dispositionSha256:
      "c39d08f37c1828e2b229189a5bcea588b5b32462f84144524a43d39382d8ac88",
    entryStateEnSha256:
      "8a703ef251163708dfc7ec81be2225f06aa4a0870915e33aafc8df0750afcd6b",
    entryStateEsSha256:
      "b16623409c1171aaa1763fcba05bd6ded0af4c7ea832847383e763ea7a25eb63",
    plannedWaitMs: 114_501,
  }),
  Object.freeze({
    step: 4,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf",
    animationId: "course-g04-l10-rw-005",
    timelineId: "sprite-278",
    frameCount: 925,
    dispositionPath:
      "migrations/course-g04-l10-rw-005/audit/frame-domain-disposition.json",
    dispositionSha256:
      "e094ab7aeb96c518c835120ef0cea5266246d0333f4c990eadbf2dc5ea760312",
    entryStateEnSha256:
      "754008b7c7397cfa84bdea798225f2156049df366ce5dd772294a862a8dad131",
    entryStateEsSha256:
      "679d56da041d576a3764f127ce1e8de409b27180f44795fa57c8f7900dd4440c",
    plannedWaitMs: 81_168,
  }),
  Object.freeze({
    step: 5,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf",
    animationId: null,
    timelineId: "sprite-31",
    frameCount: 136,
    dispositionPath: VB001_AUDIT_RELATIVE,
    dispositionSha256: VB001_AUDIT_SHA256,
    entryStateEnSha256: null,
    entryStateEsSha256: null,
    plannedWaitMs: 15_418,
  }),
  Object.freeze({
    step: 6,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf",
    animationId: "course-g04-l10-vb-002",
    timelineId: "sprite-84",
    frameCount: 280,
    dispositionPath:
      "migrations/course-g04-l10-vb-002/audit/frame-domain-disposition.json",
    dispositionSha256:
      "d0803576e1d0045ff24f1f96320852d2007a20f86c277a689e69eb25005eb8f9",
    entryStateEnSha256:
      "32871afad2620f6f8ce6245283ffabb38259ed1190834c0fb83849c4c504b79c",
    entryStateEsSha256:
      "fe63331336ad477a98b018342bfb31ed8fd76f2c2e3c946ae603a3719c64a008",
    plannedWaitMs: 27_418,
  }),
  Object.freeze({
    step: 7,
    expectedPath: "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
    animationId: "course-g04-l10-vb-003",
    timelineId: "sprite-120",
    frameCount: 203,
    dispositionPath:
      "migrations/course-g04-l10-vb-003/audit/frame-domain-disposition.json",
    dispositionSha256:
      "d69f282c571ed3ec19228372db425f52ae0d099c6b47bf27de9d9b680f92df68",
    entryStateEnSha256:
      "a2ba7802bded99336ca0c6a8b3db9a8309c0fe8f5ef0dec213482387ed739cdf",
    entryStateEsSha256:
      "ffa33365361c0058ded8972ece63bc29a387a4fb5402615c5c01376ff131fe76",
    plannedWaitMs: 21_001,
  }),
]);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 VB003 Ruffle successor v7: ${message}`);
  }
}

function portable(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");
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

async function readBinding(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const before = await lstat(absolutePath);
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath} is not a regular file`);
  const contents = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs,
    `${relativePath} changed while it was read`,
  );
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: (after.mode & 0o777).toString(8).padStart(4, "0"),
    contents,
  };
}

function descriptor(binding) {
  const {contents, ...rest} = binding;
  return rest;
}

export function buildInputAttemptPlans() {
  return [
    {
      attempt: 1,
      id: "fresh-context-seven-source-window-staged-releases-v6-network-policy",
      transport: "page.mouse move/down/up",
      freshContext: true,
      keytermXmlPolicy: "blocked-before-network-as-in-v2",
      hoverSettleMs: 250,
      pointerDownHoldMs: 250,
      postReleaseSettleMs: 150,
      moveSteps: 12,
    },
  ];
}

export function analyzeDomInputEvents(events, cssHitBounds = null) {
  const preRuffleWindowCaptureEvents = events.filter((event) =>
    event.observerTarget === "pre-ruffle-window" &&
      event.listenerPhase === "capture" &&
      event.type.startsWith("pointer"));
  const windowCaptureEvents = events.filter((event) =>
    event.observerTarget === "window" &&
      event.listenerPhase === "capture" &&
      event.type.startsWith("pointer"));
  const controllingCaptureEvents = preRuffleWindowCaptureEvents.length > 0
    ? preRuffleWindowCaptureEvents
    : windowCaptureEvents;
  const pointerEvents = controllingCaptureEvents.length > 0
    ? controllingCaptureEvents
    : events.filter((event) =>
      event.listenerPhase === "capture" && event.type.startsWith("pointer"));
  const firstDown = pointerEvents.findIndex((event) => event.type === "pointerdown");
  const firstUp = pointerEvents.findIndex((event) => event.type === "pointerup");
  const firstCancel = pointerEvents.findIndex((event) => event.type === "pointercancel");
  const down = firstDown >= 0 ? pointerEvents[firstDown] : null;
  const up = firstUp >= 0 ? pointerEvents[firstUp] : null;
  const trusted = Boolean(down?.isTrusted && up?.isTrusted);
  const ordered = firstDown >= 0 && firstUp > firstDown;
  const samePointer = Boolean(
    down && up && down.pointerId != null && down.pointerId === up.pointerId,
  );
  const within = (event) => Boolean(
    event &&
      cssHitBounds &&
      event.clientX >= cssHitBounds.left &&
      event.clientX <= cssHitBounds.right &&
      event.clientY >= cssHitBounds.top &&
      event.clientY <= cssHitBounds.bottom,
  );
  const downInside = within(down);
  const upInside = within(up);
  const pathIncludes = (event, tagName) => Boolean(
    event?.composedPath?.includes(tagName),
  );
  const downPathIncludesCanvas = pathIncludes(down, "CANVAS");
  const upPathIncludesCanvas = pathIncludes(up, "CANVAS");
  const downPathIncludesPlayer = pathIncludes(down, "RUFFLE-PLAYER");
  const upPathIncludesPlayer = pathIncludes(up, "RUFFLE-PLAYER");
  const primaryButtonState = Boolean(
    down?.button === 0 && down?.buttons === 1 &&
      up?.button === 0 && up?.buttons === 0,
  );
  const cancelledBetween = firstCancel >= 0 &&
    firstDown >= 0 &&
    firstUp >= 0 &&
    firstCancel >= firstDown &&
    firstCancel <= firstUp;
  return {
    capturePointerEventCount: pointerEvents.length,
    observerTarget: preRuffleWindowCaptureEvents.length > 0
      ? "pre-ruffle-window"
      : windowCaptureEvents.length > 0
        ? "window"
        : "legacy-capture",
    trustedPointerDownObserved: Boolean(down?.isTrusted),
    trustedPointerUpObserved: Boolean(up?.isTrusted),
    orderedDownThenUp: ordered,
    samePointerId: samePointer,
    pointerId: samePointer ? down.pointerId : null,
    pointerDownInsideMappedHitBounds: downInside,
    pointerUpInsideMappedHitBounds: upInside,
    pointerDownPathIncludesCanvas: downPathIncludesCanvas,
    pointerUpPathIncludesCanvas: upPathIncludesCanvas,
    pointerDownPathIncludesPlayer: downPathIncludesPlayer,
    pointerUpPathIncludesPlayer: upPathIncludesPlayer,
    primaryButtonState,
    pointerCancelBetweenDownAndUp: cancelledBetween,
    completeTrustedReleaseSequence:
      trusted && ordered && samePointer && downInside && upInside &&
      downPathIncludesCanvas && upPathIncludesCanvas &&
      downPathIncludesPlayer && upPathIncludesPlayer &&
      primaryButtonState && !cancelledBetween,
  };
}

export function traceReferencesExpectedPath(traceEvents, expectedPath) {
  const sourceRelative = expectedPath.replace(/^\/runtime\//, "");
  return traceEvents.some((event) =>
    event.arguments.some((value) =>
      value.includes(expectedPath) || value.includes(sourceRelative),
    ),
  );
}

export function buildFailClosedAuthority() {
  return {
    ruffleForensicReferenceOnly: true,
    authoritativeOriginalRuntime: false,
    originalRuntimeNaturalTrace: false,
    originalRuntimeBaseline: false,
    fullFrameBaseline: false,
    targetBeginHandshakeProven: false,
    targetChildDomainEntryProven: false,
    keytermXmlRuntimeParseProven: false,
    audioListeningOrSynchronization: false,
    visualFidelity: false,
    humanReview: false,
    ownerReview: false,
    strictCompletion: false,
    wholeLessonIntegration: false,
    releaseOrPublication: false,
    strictAcceptanceEffect: "none",
  };
}

function mimeType(resourcePath) {
  if (resourcePath.endsWith(".html") || resourcePath === "/") {
    return "text/html; charset=utf-8";
  }
  if (resourcePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (resourcePath.endsWith(".wasm")) return "application/wasm";
  if (resourcePath.endsWith(".swf")) return "application/x-shockwave-flash";
  if (resourcePath.endsWith(".mp3")) return "audio/mpeg";
  if (resourcePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "application/octet-stream";
}

export function buildPreRuffleInputObserverSource() {
  return [
    "(() => {",
    "  if (window.__preRuffleInputObserverInstalled) return;",
    "  window.__preRuffleInputEvents = [];",
    "  const eventTypes = ['pointerover', 'pointerenter', 'pointermove', 'pointerdown', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture', 'mouseover', 'mousedown', 'mouseup', 'click'];",
    "  const record = (event) => {",
    "    const rawPath = event.composedPath();",
    "    const canvas = rawPath.find((node) => node && node.tagName === 'CANVAS');",
    "    const path = rawPath.map((node) => node && (node.tagName || node.nodeName || node.constructor && node.constructor.name) || 'unknown');",
    "    let hasPointerCapture = null;",
    "    if (canvas && typeof event.pointerId === 'number' && typeof canvas.hasPointerCapture === 'function') {",
    "      hasPointerCapture = canvas.hasPointerCapture(event.pointerId);",
    "    }",
    "    window.__preRuffleInputEvents.push({",
    "      atPerformanceMs: Math.round(performance.now()),",
    "      observerTarget: 'pre-ruffle-window',",
    "      listenerPhase: 'capture',",
    "      type: event.type,",
    "      eventPhase: event.eventPhase,",
    "      isTrusted: event.isTrusted,",
    "      clientX: event.clientX,",
    "      clientY: event.clientY,",
    "      offsetX: event.offsetX,",
    "      offsetY: event.offsetY,",
    "      button: event.button,",
    "      buttons: event.buttons,",
    "      pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,",
    "      pointerType: event.pointerType || null,",
    "      hasPointerCapture,",
    "      activeElement: document.activeElement && document.activeElement.tagName || null,",
    "      targetTag: event.target && (event.target.tagName || event.target.nodeName) || null,",
    "      pathIncludesCanvas: path.includes('CANVAS'),",
    "      pathIncludesPlayer: path.includes('RUFFLE-PLAYER'),",
    "      composedPath: path",
    "    });",
    "  };",
    "  for (const type of eventTypes) window.addEventListener(type, record, true);",
    "  window.__preRuffleInputObserverInstalled = true;",
    "})();",
    "",
  ].join("\n");
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
    "  window.__probe = {",
    "    created: false,",
    "    loadResolved: false,",
    "    loadRejected: null,",
    "    traceObserverInstalled: false,",
    "    traceEvents: [],",
    "    preRuffleInputObserverInstalledAtLaunch: window.__preRuffleInputObserverInstalled === true,",
    "    windowInputObserverInstalled: false,",
    "    domInputObserverInstalled: false,",
    "    domInputEvents: []",
    "  };",
    "  const observeTrace = (...args) => {",
    "    window.__probe.traceEvents.push({",
    "      atPerformanceMs: Math.round(performance.now()),",
    "      arguments: args.map((value) => String(value))",
    "    });",
    "  };",
    "  const installWindowInputObserver = () => {",
    "    const eventTypes = ['pointerover', 'pointerenter', 'pointermove', 'pointerdown', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture', 'mouseover', 'mousedown', 'mouseup', 'click'];",
    "    const record = (event) => {",
    "      const rawPath = event.composedPath();",
    "      const canvas = rawPath.find((node) => node && node.tagName === 'CANVAS');",
    "      if (!canvas) return;",
    "      const path = rawPath.map((node) => node && (node.tagName || node.nodeName || node.constructor && node.constructor.name) || 'unknown');",
    "      let hasPointerCapture = null;",
    "      if (typeof event.pointerId === 'number' && typeof canvas.hasPointerCapture === 'function') {",
    "        hasPointerCapture = canvas.hasPointerCapture(event.pointerId);",
    "      }",
    "      window.__probe.domInputEvents.push({",
    "        atPerformanceMs: Math.round(performance.now()),",
    "        observerTarget: 'window',",
    "        listenerPhase: 'capture',",
    "        type: event.type,",
    "        eventPhase: event.eventPhase,",
    "        isTrusted: event.isTrusted,",
    "        clientX: event.clientX,",
    "        clientY: event.clientY,",
    "        offsetX: event.offsetX,",
    "        offsetY: event.offsetY,",
    "        button: event.button,",
    "        buttons: event.buttons,",
    "        pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,",
    "        pointerType: event.pointerType || null,",
    "        hasPointerCapture,",
    "        activeElement: document.activeElement && document.activeElement.tagName || null,",
    "        composedPath: path",
    "      });",
    "    };",
    "    for (const type of eventTypes) window.addEventListener(type, record, true);",
    "    window.__probe.windowInputObserverInstalled = true;",
    "  };",
    "  const installDomInputObserver = (player) => {",
    "    const canvas = player.shadowRoot && player.shadowRoot.querySelector('canvas');",
    "    if (!canvas) throw new Error('Ruffle shadow canvas is missing after load');",
    "    const eventTypes = ['pointerover', 'pointerenter', 'pointermove', 'pointerdown', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture', 'mouseover', 'mousedown', 'mouseup', 'click'];",
    "    const record = (listenerPhase) => (event) => {",
    "      const path = event.composedPath().map((node) => node && (node.tagName || node.nodeName || node.constructor && node.constructor.name) || 'unknown');",
    "      let hasPointerCapture = null;",
    "      if (typeof event.pointerId === 'number' && typeof canvas.hasPointerCapture === 'function') {",
    "        hasPointerCapture = canvas.hasPointerCapture(event.pointerId);",
    "      }",
    "      window.__probe.domInputEvents.push({",
    "        atPerformanceMs: Math.round(performance.now()),",
    "        observerTarget: 'canvas',",
    "        listenerPhase,",
    "        type: event.type,",
    "        eventPhase: event.eventPhase,",
    "        isTrusted: event.isTrusted,",
    "        clientX: event.clientX,",
    "        clientY: event.clientY,",
    "        offsetX: event.offsetX,",
    "        offsetY: event.offsetY,",
    "        button: event.button,",
    "        buttons: event.buttons,",
    "        pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,",
    "        pointerType: event.pointerType || null,",
    "        hasPointerCapture,",
    "        activeElement: document.activeElement && document.activeElement.tagName || null,",
    "        composedPath: path",
    "      });",
    "    };",
    "    for (const type of eventTypes) {",
    "      canvas.addEventListener(type, record('capture'), true);",
    "      canvas.addEventListener(type, record('bubble'), false);",
    "    }",
    "    window.__probe.domInputObserverInstalled = true;",
    "  };",
    "  installWindowInputObserver();",
    "  try {",
    "    const player = window.RufflePlayer.newest().createPlayer();",
    '    player.id = "player";',
    '    player.setAttribute("aria-label", "L10 original-host Ruffle successor v7 forensic diagnostic");',
    '    player.style.width = "800px";',
    '    player.style.height = "600px";',
    '    player.style.display = "block";',
    '    document.getElementById("stage").replaceChildren(player);',
    "    window.__probe.created = true;",
    "    player.ruffle().traceObserver = observeTrace;",
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
    "    player.ruffle().traceObserver = observeTrace;",
    "    window.__probe.traceObserverInstalled = true;",
    "    installDomInputObserver(player);",
    "    window.__probe.loadResolved = true;",
    "  } catch (error) {",
    "    window.__probe.loadRejected = String(error && (error.stack || error.message) || error);",
    "  }",
    "})();",
    "",
  ].join("\n"));
  const html = Buffer.from([
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><title>L10 contained Ruffle successor v7</title>',
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

export function buildRuffleHardwareModalContract(ruffleJsBytes) {
  const source = Buffer.from(ruffleJsBytes).toString("utf8");
  const anchors = [
    'id:"hardware-acceleration-modal",class:"modal hidden"',
    'this.rendererDebugInfo.includes("Adapter Device Type: Cpu")&&this.container.addEventListener("mouseover",this.openHardwareAccelerationModal.bind(this),{once:!0})',
    'openHardwareAccelerationModal(){this.hardwareAccelerationModal.classList.remove("hidden")}',
    'addModalJavaScript(e){const n=e.querySelector("#video-holder"),a=()=>{e.classList.add("hidden")',
    'const r=e.querySelector(".close-modal");r&&r.addEventListener("click",a)',
  ];
  for (const anchor of anchors) {
    invariant(source.includes(anchor), `pinned Ruffle modal contract anchor drifted: ${anchor}`);
  }
  return {
    trigger:
      "pinned Ruffle opens the hardware-acceleration modal once on container mouseover when renderer debug info identifies a CPU adapter",
    modalSelector: "#hardware-acceleration-modal",
    closeSelector: "#hardware-acceleration-modal .close-modal",
    initialClasses: ["modal", "hidden"],
    openEffect: "remove hidden class",
    trustedCloseEffect: "close-modal click adds hidden class",
    anchorsSha256: sha256(Buffer.from(anchors.join("\n"))),
    anchorCount: anchors.length,
  };
}

async function bindInputs() {
  const expectedStaticReport = await buildAntecedentReport({check: true});
  const [
    staticReport,
    v2Result,
    v3Result,
    v4Result,
    v5Result,
    v6Result,
    vb001AuditResult,
  ] = await Promise.all([
    readBinding(STATIC_REPORT_RELATIVE),
    readBinding(V2_RESULT_RELATIVE),
    readBinding(V3_RESULT_RELATIVE),
    readBinding(V4_RESULT_RELATIVE),
    readBinding(V5_RESULT_RELATIVE),
    readBinding(V6_RESULT_RELATIVE),
    readBinding(VB001_AUDIT_RELATIVE),
  ]);
  invariant(
    staticReport.contents.toString("utf8") === stableJson(expectedStaticReport),
    "current static antecedent report is stale",
  );
  invariant(
    v2Result.sha256 === V2_RESULT_SHA256,
    "immutable v2 diagnostic identity drifted",
  );
  invariant(
    v3Result.sha256 === V3_RESULT_SHA256,
    "immutable v3 diagnostic identity drifted",
  );
  invariant(
    v4Result.sha256 === V4_RESULT_SHA256,
    "immutable v4 diagnostic identity drifted",
  );
  invariant(
    v5Result.sha256 === V5_RESULT_SHA256,
    "immutable v5 diagnostic identity drifted",
  );
  invariant(
    v6Result.sha256 === V6_RESULT_SHA256,
    "immutable successful v6 diagnostic identity drifted",
  );
  invariant(
    vb001AuditResult.sha256 === VB001_AUDIT_SHA256,
    "VB001 source-static host-chain audit identity drifted",
  );
  const v2 = JSON.parse(v2Result.contents.toString("utf8"));
  const v3 = JSON.parse(v3Result.contents.toString("utf8"));
  const v4 = JSON.parse(v4Result.contents.toString("utf8"));
  const v5 = JSON.parse(v5Result.contents.toString("utf8"));
  const v6 = JSON.parse(v6Result.contents.toString("utf8"));
  const vb001Audit = JSON.parse(vb001AuditResult.contents.toString("utf8"));
  invariant(
    v2.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v2-diagnostic" &&
      v2.authority?.strictAcceptanceEffect === "none" &&
      v2.authority?.authoritativeOriginalRuntime === false &&
      v2.containment?.containmentBreached === false &&
      v2.observation?.successfulExpectedChildTransitions === 0 &&
      v2.observation?.blocker?.expectedPath ===
        "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
    "v2 diagnostic is not the expected fail-closed predecessor",
  );
  invariant(
    v3.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v3-diagnostic" &&
      v3.authority?.strictAcceptanceEffect === "none" &&
      v3.authority?.authoritativeOriginalRuntime === false &&
      v3.containment?.containmentBreached === false &&
      v3.observation?.attempts?.length === 2 &&
      v3.observation.attempts.every((attempt) =>
        attempt.transitions?.length === 1 &&
        attempt.transitions[0].input?.domSequence
          ?.completeTrustedReleaseSequence === false &&
        attempt.transitions[0].delivery?.complete === false &&
        attempt.blocker?.kind ===
          "input-geometry-focus-or-pointer-phase-blocker"),
    "v3 diagnostic is not the expected immutable instrumentation-limited predecessor",
  );
  invariant(
    v4.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v4-diagnostic" &&
      v4.authority?.strictAcceptanceEffect === "none" &&
      v4.authority?.authoritativeOriginalRuntime === false &&
      v4.containment?.containmentBreached === false &&
      v4.status ===
        "window-capture-dom-release-not-observed-probe-remains-input-limited" &&
      v4.observation?.attempts?.length === 2 &&
      v4.observation.attempts.every((attempt) =>
        attempt.transitions?.length === 1 &&
        attempt.transitions[0].input?.domSequence
          ?.completeTrustedReleaseSequence === false &&
        attempt.transitions[0].delivery?.complete === false &&
        attempt.blocker?.kind ===
          "input-geometry-focus-or-pointer-phase-blocker"),
    "v4 diagnostic is not the expected immutable pre-Ruffle-ordering predecessor",
  );
  invariant(
    v5.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v5-diagnostic" &&
      v5.authority?.strictAcceptanceEffect === "none" &&
      v5.authority?.authoritativeOriginalRuntime === false &&
      v5.containment?.containmentBreached === false &&
      v5.status ===
        "pre-ruffle-window-capture-dom-release-not-observed-probe-remains-input-limited" &&
      v5.observation?.attempts?.length === 2 &&
      v5.observation.attempts.every((attempt) =>
        attempt.transitions?.length === 1 &&
        attempt.transitions[0].input?.domSequence
          ?.completeTrustedReleaseSequence === false &&
        attempt.transitions[0].delivery?.complete === false &&
        attempt.blocker?.kind ===
          "input-geometry-focus-or-pointer-phase-blocker"),
    "v5 diagnostic is not the expected immutable modal-intercepted predecessor",
  );
  invariant(
    v6.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v6-diagnostic" &&
      v6.status ===
        "rw002-http-delivery-observed-after-complete-dom-release-through-original-shell-in-ruffle-forensic-only" &&
      v6.authority?.strictAcceptanceEffect === "none" &&
      v6.authority?.authoritativeOriginalRuntime === false &&
      v6.containment?.containmentBreached === false &&
      v6.observation?.attemptCount === 1 &&
      v6.observation?.attempts?.[0]?.successfulExpectedChildTransitions === 1 &&
      v6.observation?.attempts?.[0]?.transitions?.[0]?.input?.domSequence
        ?.completeTrustedReleaseSequence === true &&
      v6.observation?.attempts?.[0]?.transitions?.[0]?.delivery?.complete === true,
    "v6 is not the expected immutable successful first-release predecessor",
  );
  invariant(
    vb001Audit.reportType === "g4-l10-vb001-host-chain-static-audit" &&
      vb001Audit.status === "source-static-host-chain-timing-candidate-only" &&
      vb001Audit.scope?.activeCourseXmlMember === false &&
      vb001Audit.scope?.formalReleaseMember === false &&
      vb001Audit.controlledNavigationTimingCandidate
        ?.conservativePostDeliveryWaitMs === 15_418 &&
      vb001Audit.controlledNavigationTimingCandidate
        ?.provesNaturalRuntimeEntry === false &&
      vb001Audit.controlledNavigationTimingCandidate
        ?.provesNaturalRuntimeTerminal === false &&
      vb001Audit.authority?.strictAcceptanceEffect === "none",
    "VB001 report is not the expected acceptance-neutral source-static audit",
  );
  invariant(
    v2.staticPlan?.waitPolicy?.initialChild?.plannedWaitMs ===
      EXPECTED_INITIAL_WAIT_MS &&
      v2.staticPlan?.waitPolicy?.hostPreloader?.plannedWaitMs ===
        EXPECTED_PRELOADER_WAIT_MS,
    "v2 source-derived wait policy drifted",
  );
  const priorXmlBlock = v2.containment.blockedRequests.filter((entry) =>
    entry.method === "GET" && entry.path === KEYTERM_XML_REQUEST_PATH,
  );
  invariant(
    priorXmlBlock.length === 1,
    "v2 did not contain exactly one blocked automatic ELKTEG4.xml request",
  );

  const xmlAbsolute = path.join(SOURCE_ARCHIVE, KEYTERM_XML_SOURCE_RELATIVE);
  const xmlBefore = await lstat(xmlAbsolute);
  invariant(
    xmlBefore.isFile() &&
      !xmlBefore.isSymbolicLink() &&
      (xmlBefore.mode & 0o222) === 0,
    "canonical ELKTEG4.xml is not a read-only regular file",
  );
  const xmlContents = await readFile(xmlAbsolute);
  const xmlAfter = await lstat(xmlAbsolute);
  invariant(
    xmlContents.length === KEYTERM_XML_EXPECTED.bytes &&
      sha256(xmlContents) === KEYTERM_XML_EXPECTED.sha256 &&
      xmlBefore.dev === xmlAfter.dev &&
      xmlBefore.ino === xmlAfter.ino &&
      xmlBefore.size === xmlAfter.size &&
      xmlBefore.mtimeMs === xmlAfter.mtimeMs,
    "canonical ELKTEG4.xml identity drifted while read",
  );
  const xml = {
    path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${KEYTERM_XML_SOURCE_RELATIVE}`,
    requestPath: KEYTERM_XML_REQUEST_PATH,
    role: "automatic-read-only-english-grade-4-keyterm-xml",
    bytes: xmlContents.length,
    sha256: sha256(xmlContents),
    sourceMode: (xmlAfter.mode & 0o777).toString(8).padStart(4, "0"),
    contents: xmlContents,
  };

  const ruffleAssets = [];
  for (const expected of v2.runtime.ruffle.assets) {
    const absolutePath = path.join(RUFFLE_ROOT, expected.name);
    const metadata = await lstat(absolutePath);
    invariant(
      metadata.isFile() && !metadata.isSymbolicLink(),
      `Ruffle asset ${expected.name} is not a regular file`,
    );
    const contents = await readFile(absolutePath);
    invariant(
      contents.length === expected.bytes && sha256(contents) === expected.sha256,
      `Ruffle asset ${expected.name} drifted from v2`,
    );
    ruffleAssets.push({...expected, contents});
  }
  const ruffleJs = ruffleAssets.find((asset) => asset.name === "ruffle.js");
  invariant(ruffleJs, "pinned Ruffle JavaScript binding is missing");
  const hardwareModalContract = {
    ...buildRuffleHardwareModalContract(ruffleJs.contents),
    ruffleJs: descriptor({
      path: "public/ruffle/ruffle.js",
      bytes: ruffleJs.contents.length,
      sha256: sha256(ruffleJs.contents),
      custody: "hash-bound local probe input; not modified by the probe",
      contents: ruffleJs.contents,
    }),
  };

  const transitionPlan = buildSuccessorTransitionPlan(expectedStaticReport);
  invariant(transitionPlan.length === 7, "static transition plan is not seven releases");
  const timingBindings = [];
  for (const timing of SOURCE_DECLARED_TRANSITION_WINDOWS) {
    const transition = transitionPlan[timing.step - 1];
    invariant(
      transition?.step === timing.step &&
        transition.expectedPath === timing.expectedPath,
      `transition ${timing.step} does not match its source-declared timing window`,
    );
    const binding = timing.step === 5
      ? vb001AuditResult
      : await readBinding(timing.dispositionPath);
    invariant(
      binding.sha256 === timing.dispositionSha256,
      `transition ${timing.step} timing evidence identity drifted`,
    );
    const evidence = JSON.parse(binding.contents.toString("utf8"));
    if (timing.step === 5) {
      const domain = evidence.frameDomains?.sourceStaticHostChainDomains
        ?.find((entry) => entry.timelineId === timing.timelineId);
      invariant(
        domain?.frameCount === timing.frameCount &&
          domain?.terminalActionFrame === timing.frameCount &&
          evidence.controlledNavigationTimingCandidate
            ?.conservativePostDeliveryWaitMs === timing.plannedWaitMs,
        "VB001 source-static principal-domain evidence drifted",
      );
    } else {
      const domain = evidence.timelines?.find((entry) =>
        entry.timelineId === timing.timelineId);
      invariant(
        evidence.animationId === timing.animationId &&
          domain?.frameCount === timing.frameCount &&
          domain?.disposition === "declared-frame-domain" &&
          domain?.declaredFrameDomains?.some((entry) =>
            entry.sourceTimelineId === timing.timelineId &&
              entry.frameCount === timing.frameCount &&
              entry.parentEntryFrame === null &&
              entry.localEntryFrame === null),
        `transition ${timing.step} frame-domain disposition drifted`,
      );
    }
    invariant(
      timing.plannedWaitMs ===
        EXPECTED_PRELOADER_WAIT_MS +
          Math.ceil(timing.frameCount / 12 * 1_000) + 1_000,
      `transition ${timing.step} conservative timing arithmetic drifted`,
    );
    timingBindings.push({
      ...timing,
      nominalDomainDurationMs: timing.frameCount / 12 * 1_000,
      hostPreloaderSettleMs: EXPECTED_PRELOADER_WAIT_MS,
      bufferMs: 1_000,
      evidence: descriptor(binding),
      entryState: {
        kind: "declared-domain-entry-unresolved",
        enSha256: timing.entryStateEnSha256,
        esSha256: timing.entryStateEsSha256,
        authoritativeRuntimeEntryEstablished: false,
      },
    });
  }
  return {
    expectedStaticReport,
    staticReport,
    v2,
    v2Result,
    v3,
    v3Result,
    v4,
    v4Result,
    v5,
    v5Result,
    v6,
    v6Result,
    vb001Audit,
    vb001AuditResult,
    xml,
    ruffleAssets,
    hardwareModalContract,
    transitionPlan,
    timingBindings,
    waitPolicy: v2.staticPlan.waitPolicy,
  };
}

async function createOutput(inputs) {
  const outputRoot = path.join(PROJECT_ROOT, SUCCESSOR_V7_OUTPUT_RELATIVE);
  invariant(
    !(await pathExists(outputRoot)),
    `${SUCCESSOR_V7_OUTPUT_RELATIVE} already exists; immutable output will not be overwritten`,
  );
  await mkdir(outputRoot, {recursive: false, mode: 0o755});
  const archives = [
    {
      name: `antecedent-${inputs.staticReport.sha256}.json`,
      binding: inputs.staticReport,
    },
    {
      name: `predecessor-v6-${inputs.v6Result.sha256}.json`,
      binding: inputs.v6Result,
    },
    {
      name: `vb001-host-chain-audit-${inputs.vb001AuditResult.sha256}.json`,
      binding: inputs.vb001AuditResult,
    },
    {
      name: `ELKTEG4-${inputs.xml.sha256}.xml`,
      binding: {
        path: inputs.xml.path,
        bytes: inputs.xml.bytes,
        sha256: inputs.xml.sha256,
        mode: inputs.xml.sourceMode,
        contents: inputs.xml.contents,
      },
    },
    ...inputs.timingBindings
      .filter((entry) => entry.step !== 5)
      .map((entry) => ({
        name:
          `step-${String(entry.step).padStart(2, "0")}-${entry.timelineId}-disposition-${entry.evidence.sha256}.json`,
        binding: {
          ...entry.evidence,
          contents: null,
        },
        sourceRelativePath: entry.evidence.path,
      })),
  ];
  for (const archive of archives) {
    if (archive.binding.contents === null) {
      archive.binding = await readBinding(archive.sourceRelativePath);
    }
  }
  const written = [];
  for (const archive of archives) {
    const absolutePath = path.join(outputRoot, archive.name);
    await writeFile(absolutePath, archive.binding.contents, {
      flag: "wx",
      mode: 0o444,
    });
    await chmod(absolutePath, 0o444);
    written.push({
      path: portable(absolutePath),
      role: archive.name.startsWith("antecedent-")
        ? "static-antecedent-copy"
        : archive.name.startsWith("predecessor-v6-")
          ? "immutable-successful-v6-first-release-predecessor-copy"
          : archive.name.startsWith("vb001-")
            ? "acceptance-neutral-vb001-host-chain-static-audit-copy"
            : archive.name.startsWith("step-")
              ? "source-declared-frame-domain-disposition-copy"
              : "read-only-keyterm-xml-copy",
      bytes: archive.binding.bytes,
      sha256: archive.binding.sha256,
      mode: "0444",
    });
  }
  return {outputRoot, archives: written};
}

async function createExactServer(inputs, elapsedMs) {
  const launch = launchSources();
  const resources = new Map([
    ["/", {bytes: launch.html, role: "diagnostic-html"}],
    ["/bootstrap.js", {bytes: launch.bootstrap, role: "diagnostic-bootstrap"}],
    ["/launch.js", {bytes: launch.launch, role: "diagnostic-launch"}],
  ]);
  for (const asset of inputs.ruffleAssets) {
    resources.set(`/ruffle/${asset.name}`, {
      bytes: asset.contents,
      role: "ruffle-runtime",
    });
  }
  const runtimeRoot = path.join(
    PROJECT_ROOT,
    inputs.expectedStaticReport.runtimeTree.path,
  );
  for (const file of inputs.expectedStaticReport.runtimeTree.files) {
    const absolutePath = path.join(runtimeRoot, file.path);
    const metadata = await lstat(absolutePath);
    invariant(
      metadata.isFile() &&
        !metadata.isSymbolicLink() &&
        (metadata.mode & 0o222) === 0,
      `${file.path} is not a read-only regular runtime-tree file`,
    );
    const bytes = await readFile(absolutePath);
    invariant(
      bytes.length === file.bytes && sha256(bytes) === file.sha256,
      `${file.path} runtime-tree identity drifted`,
    );
    resources.set(`/runtime/${file.path}`, {bytes, role: file.role});
  }
  resources.set(KEYTERM_XML_REQUEST_PATH, {
    bytes: inputs.xml.contents,
    role: inputs.xml.role,
  });

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
    "exact server did not bind IPv4 loopback",
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

function relativeEvent(requestUrl, method, resourceType, classification, origin, atMs) {
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

function countExact(values, predicate) {
  return values.reduce((count, value) => count + (predicate(value) ? 1 : 0), 0);
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

function deliverySnapshot(pathname, baseline, requests, responses, serverRequests) {
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

async function waitForDelivery({
  page,
  pathname,
  baseline,
  requests,
  responses,
  serverRequests,
  timeoutMs,
  elapsedMs,
}) {
  const waitStartedAtMs = elapsedMs();
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
    waitStartedAtMs,
    waitEndedAtMs: elapsedMs(),
    timeoutMs,
  };
}

async function recordWait(page, plannedWaitMs, kind, evidence, elapsedMs) {
  const startedAtMs = elapsedMs();
  await page.waitForTimeout(plannedWaitMs);
  const endedAtMs = elapsedMs();
  return {
    kind,
    plannedWaitMs,
    actualWaitMs: endedAtMs - startedAtMs,
    startedAtMs,
    endedAtMs,
    completed: endedAtMs - startedAtMs >= plannedWaitMs,
    evidence,
  };
}

async function capturePlayer(page, outputRoot, name, elapsedMs) {
  const absolutePath = path.join(outputRoot, name);
  const player = page.locator("ruffle-player");
  await player.waitFor({state: "visible", timeout: 15_000});
  await player.screenshot({
    path: absolutePath,
    animations: "disabled",
    caret: "hide",
  });
  const bytes = await readFile(absolutePath);
  const png = PNG.sync.read(bytes);
  invariant(
    png.width === 800 && png.height === 600,
    `${name} is ${png.width}x${png.height}, expected 800x600`,
  );
  await chmod(absolutePath, 0o444);
  return {
    atMs: elapsedMs(),
    path: portable(absolutePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    width: png.width,
    height: png.height,
    mode: "0444",
  };
}

async function readRuffleChromeState(page, targetViewportPoint) {
  const player = page.locator("ruffle-player");
  return player.evaluate((element, targetPoint) => {
    const shadow = element.shadowRoot;
    if (!shadow) return {error: "open-shadow-root-missing"};
    const isVisible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || 1) !== 0 &&
        rect.width > 0 && rect.height > 0;
    };
    const describe = (node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        tag: node.tagName,
        id: node.id || null,
        className: typeof node.className === "string" ? node.className : null,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        visible: isVisible(node),
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      };
    };
    const canvas = shadow.querySelector("canvas");
    const canvasRect = canvas?.getBoundingClientRect() || null;
    const target = shadow.elementFromPoint(targetPoint.x, targetPoint.y);
    const modalNodes = [...shadow.querySelectorAll(".modal")];
    const blockers = [
      "#message-overlay",
      "#panic",
      "#play-button",
      "#unmute-overlay",
      "#splash-screen",
      "#context-menu-overlay",
    ].map((selector) => ({
      selector,
      state: describe(shadow.querySelector(selector)),
    }));
    return {
      error: null,
      hardwareAccelerationModal:
        describe(shadow.querySelector("#hardware-acceleration-modal")),
      closeControl:
        describe(shadow.querySelector("#hardware-acceleration-modal .close-modal")),
      modals: modalNodes.map((node) => describe(node)),
      allModalsHidden: modalNodes.every((node) => !isVisible(node)),
      blockers,
      visibleBlockers: blockers.filter((entry) => entry.state?.visible)
        .map((entry) => entry.selector),
      canvas: canvas
        ? {
          connected: canvas.isConnected,
          backingWidth: canvas.width,
          backingHeight: canvas.height,
          pointerEvents: getComputedStyle(canvas).pointerEvents,
          rect: {
            x: canvasRect.x,
            y: canvasRect.y,
            width: canvasRect.width,
            height: canvasRect.height,
          },
        }
        : null,
      targetElement: target
        ? {
          tag: target.tagName,
          id: target.id || null,
          className: typeof target.className === "string"
            ? target.className
            : null,
          isCanvas: target === canvas,
        }
        : null,
    };
  }, targetViewportPoint);
}

async function prepareRuffleChromeForInput({
  page,
  targetViewportPoint,
  inertViewportPoint,
  capturePhase,
  elapsedMs,
}) {
  const setupEventStartIndex = await page.evaluate(() =>
    window.__preRuffleInputEvents.length);
  const commandReceipts = [];
  const dispatch = async (command, action) => {
    const startedAtMs = elapsedMs();
    await action();
    commandReceipts.push({
      command,
      transport: "trusted Playwright browser input",
      startedAtMs,
      completedAtMs: elapsedMs(),
      completedWithoutProtocolError: true,
      belongsToTargetReleaseEvidence: false,
    });
  };
  const initial = await readRuffleChromeState(page, targetViewportPoint);
  invariant(
    initial.error === null &&
      initial.hardwareAccelerationModal &&
      initial.hardwareAccelerationModal.visible === false,
    `Ruffle hardware modal did not start hidden: ${JSON.stringify(initial)}`,
  );
  await dispatch("warm-up-move-to-neutral-canvas-point", () =>
    page.mouse.move(inertViewportPoint.x, inertViewportPoint.y));
  await page.waitForTimeout(300);
  const afterWarmup = await readRuffleChromeState(page, targetViewportPoint);
  const screenshots = [];
  let modalObserved = afterWarmup.hardwareAccelerationModal?.visible === true;
  let trustedClosePerformed = false;
  if (modalObserved) {
    screenshots.push(await capturePhase("ruffle-hardware-warning-visible"));
    const closeControl = page.locator(
      "ruffle-player #hardware-acceleration-modal .close-modal",
    );
    invariant(
      await closeControl.count() === 1 && await closeControl.isVisible(),
      "Ruffle hardware modal close control is not uniquely visible",
    );
    await dispatch("trusted-click-hardware-warning-close-control", () =>
      closeControl.click({button: "left", timeout: 5_000}));
    trustedClosePerformed = true;
    await closeControl.waitFor({state: "hidden", timeout: 5_000});
  }
  await dispatch("post-dismissal-neutral-canvas-move", () =>
    page.mouse.move(inertViewportPoint.x, inertViewportPoint.y));
  await page.waitForTimeout(300);
  const final = await readRuffleChromeState(page, targetViewportPoint);
  screenshots.push(await capturePhase("ruffle-chrome-cleared"));
  const setupEvents = await page.evaluate((startIndex) =>
    window.__preRuffleInputEvents.slice(startIndex), setupEventStartIndex);
  const cleared = Boolean(
    final.error === null &&
      final.allModalsHidden === true &&
      final.hardwareAccelerationModal?.visible === false &&
      final.targetElement?.isCanvas === true &&
      final.canvas?.connected === true &&
      final.canvas?.backingWidth === 800 &&
      final.canvas?.backingHeight === 600 &&
      final.canvas?.rect.width === 800 &&
      final.canvas?.rect.height === 600 &&
      final.canvas?.pointerEvents === "auto" &&
      !final.visibleBlockers.includes("#message-overlay") &&
      !final.visibleBlockers.includes("#panic"),
  );
  return {
    contract:
      "consume the pinned Ruffle one-shot CPU-renderer warning, close it through its real UI control, then reset target evidence only after all modal chrome is clear",
    initial,
    afterWarmup,
    modalObserved,
    trustedClosePerformed,
    final,
    cleared,
    commandReceipts,
    setupEvents,
    screenshots,
    targetEvidenceStartsAfterSetup: true,
  };
}

async function performSourcePointRelease(
  page,
  plan,
  point,
  elapsedMs,
  capturePhase,
) {
  const player = page.locator("ruffle-player");
  const geometry = await player.evaluate((element, nativePoint) => {
    const playerRect = element.getBoundingClientRect();
    const canvas = element.shadowRoot?.querySelector("canvas");
    if (!canvas) return {error: "shadow-canvas-missing"};
    const canvasRect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const viewportPoint = {
      x: canvasRect.left + nativePoint.x / 800 * canvasRect.width,
      y: canvasRect.top + nativePoint.y / 600 * canvasRect.height,
    };
    const documentHit = document.elementFromPoint(
      viewportPoint.x,
      viewportPoint.y,
    );
    const shadowHit = typeof element.shadowRoot.elementFromPoint === "function"
      ? element.shadowRoot.elementFromPoint(viewportPoint.x, viewportPoint.y)
      : null;
    return {
      error: null,
      playerRect: {
        x: playerRect.x,
        y: playerRect.y,
        width: playerRect.width,
        height: playerRect.height,
      },
      canvasRect: {
        x: canvasRect.x,
        y: canvasRect.y,
        width: canvasRect.width,
        height: canvasRect.height,
      },
      canvasBacking: {width: canvas.width, height: canvas.height},
      devicePixelRatio: window.devicePixelRatio,
      canvasComputedStyle: {
        transform: style.transform,
        transformOrigin: style.transformOrigin,
        pointerEvents: style.pointerEvents,
        width: style.width,
        height: style.height,
      },
      viewportPoint,
      documentElementFromPoint: documentHit?.tagName || null,
      shadowElementFromPoint: shadowHit?.tagName || null,
      activeElementBeforeInput: document.activeElement?.tagName || null,
      shadowActiveElementBeforeInput:
        element.shadowRoot.activeElement?.tagName || null,
    };
  }, {x: point.nativeStageX, y: point.nativeStageY});
  invariant(
    geometry.error === null &&
      geometry.canvasBacking.width === 800 &&
      geometry.canvasBacking.height === 600 &&
      geometry.canvasRect.width > 0 &&
      geometry.canvasRect.height > 0 &&
      geometry.shadowElementFromPoint === "CANVAS",
    `Ruffle shadow-canvas geometry or hit test drifted: ${JSON.stringify(geometry)}`,
  );
  const nativeHitBounds = {
    left: (point.placementTwips.x +
      point.hitShapeBoundsTwips.left * point.nestedScale) / 20,
    right: (point.placementTwips.x +
      point.hitShapeBoundsTwips.right * point.nestedScale) / 20,
    top: (point.placementTwips.y +
      point.hitShapeBoundsTwips.top * point.nestedScale) / 20,
    bottom: (point.placementTwips.y +
      point.hitShapeBoundsTwips.bottom * point.nestedScale) / 20,
  };
  const cssHitBounds = {
    left: geometry.canvasRect.x +
      nativeHitBounds.left / 800 * geometry.canvasRect.width,
    right: geometry.canvasRect.x +
      nativeHitBounds.right / 800 * geometry.canvasRect.width,
    top: geometry.canvasRect.y +
      nativeHitBounds.top / 600 * geometry.canvasRect.height,
    bottom: geometry.canvasRect.y +
      nativeHitBounds.bottom / 600 * geometry.canvasRect.height,
  };
  geometry.nativeHitBounds = nativeHitBounds;
  geometry.cssHitBounds = cssHitBounds;
  const viewportPoint = geometry.viewportPoint;
  const inertViewportPoint = {
    x: geometry.canvasRect.x + geometry.canvasRect.width / 2,
    y: geometry.canvasRect.y + geometry.canvasRect.height / 2,
  };
  const ruffleChromeSetup = await prepareRuffleChromeForInput({
    page,
    targetViewportPoint: viewportPoint,
    inertViewportPoint,
    capturePhase,
    elapsedMs,
  });
  invariant(
    ruffleChromeSetup.cleared,
    `Ruffle chrome interposition was not cleared: ${JSON.stringify(ruffleChromeSetup.final)}`,
  );
  const eventStartIndex = await page.evaluate(() => ({
    preRuffle: window.__preRuffleInputEvents.length,
    postLoad: window.__probe.domInputEvents.length,
  }));
  const phases = [];
  const mark = (phase) => phases.push({phase, atMs: elapsedMs()});
  const browserInputCommandReceipts = [];
  const dispatch = async (command, action) => {
    const startedAtMs = elapsedMs();
    await action();
    browserInputCommandReceipts.push({
      command,
      transport: "Playwright page.mouse backed by Chromium protocol",
      startedAtMs,
      completedAtMs: elapsedMs(),
      completedWithoutProtocolError: true,
      provesTrustedDomDelivery: false,
    });
  };
  await dispatch("move-to-inert-stage-point", () =>
    page.mouse.move(inertViewportPoint.x, inertViewportPoint.y));
  mark("pointer-positioned-away-from-control");
  await dispatch("move-to-next-with-steps", () =>
    page.mouse.move(viewportPoint.x, viewportPoint.y, {
      steps: plan.moveSteps,
    }));
  mark("pointer-entered-exact-source-control-point");
  await page.waitForTimeout(plan.hoverSettleMs);
  mark("hover-settle-complete-after-at-least-two-source-frames");
  const hoverScreenshot = await capturePhase("hover");
  await dispatch("left-button-down", () =>
    page.mouse.down({button: "left"}));
  mark("trusted-left-pointer-down");
  await page.waitForTimeout(plan.pointerDownHoldMs);
  mark("pointer-down-hold-complete-after-at-least-two-source-frames");
  const downScreenshot = await capturePhase("down");
  const pointerUpDispatchStartedAtMs = elapsedMs();
  await dispatch("left-button-up", () =>
    page.mouse.up({button: "left"}));
  const pointerUpDispatchCompletedAtMs = elapsedMs();
  mark("trusted-left-pointer-release-inside");
  await page.waitForTimeout(plan.postReleaseSettleMs);
  const domEvents = await page.evaluate((startIndex) => [
    ...window.__preRuffleInputEvents.slice(startIndex.preRuffle),
    ...window.__probe.domInputEvents.slice(startIndex.postLoad),
  ].sort((left, right) => left.atPerformanceMs - right.atPerformanceMs),
  eventStartIndex);
  const domSequence = analyzeDomInputEvents(domEvents, cssHitBounds);
  return {
    action: "source-proven-DefineButton2_339-release-inside",
    plan,
    nativeStagePoint: {x: point.nativeStageX, y: point.nativeStageY},
    viewportPoint,
    pointerUpDispatchStartedAtMs,
    pointerUpDispatchCompletedAtMs,
    geometry,
    ruffleChromeSetup,
    phases,
    browserInputCommandReceipts,
    domEvents,
    domSequence,
    phaseScreenshots: [
      ...ruffleChromeSetup.screenshots,
      hoverScreenshot,
      downScreenshot,
    ],
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

async function runAttempt({
  browser,
  exactServer,
  inputs,
  outputRoot,
  plan,
  elapsedMs,
}) {
  const requests = [];
  const responses = [];
  const failedRequests = [];
  const websocketAttempts = [];
  const consoleMessages = [];
  const pageErrors = [];
  const dialogs = [];
  const popups = [];
  const downloads = [];
  const transitions = [];
  const screenshots = [];
  const waits = [];
  let navigationStatus = null;
  let launchState = null;
  let playerState = null;
  let initialDelivery = null;
  let initialCompletionWait = null;
  let keytermXmlDelivery = null;
  let traceEvents = [];
  let fatalError = null;
  let blocker = null;
  const allowedPaths = new Set(exactServer.resources.keys());
  if (plan.keytermXmlPolicy === "blocked-before-network-as-in-v2") {
    allowedPaths.delete(KEYTERM_XML_REQUEST_PATH);
  }
  const serverStartIndex = exactServer.serverRequests.length;
  const serverRequestsBeforeAttempt = exactServer.serverRequests.slice(
    0,
    serverStartIndex,
  );
  const context = await browser.newContext({
    viewport: {width: 800, height: 600},
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
  });
  try {
    await context.addInitScript({
      content: buildPreRuffleInputObserverSource(),
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
    invariant(navigationStatus === 200, `diagnostic page returned ${navigationStatus}`);
    await page.waitForFunction(
      () => window.__probe &&
        (window.__probe.loadResolved || window.__probe.loadRejected),
      null,
      {timeout: 30_000},
    );
    launchState = await page.evaluate(() => window.__probe);
    invariant(
      launchState.loadResolved === true &&
      launchState.loadRejected === null &&
        launchState.traceObserverInstalled === true &&
        launchState.preRuffleInputObserverInstalledAtLaunch === true &&
        launchState.windowInputObserverInstalled === true &&
        launchState.domInputObserverInstalled === true,
      "Ruffle load or diagnostic-observer installation failed",
    );
    const initialZero = {
      path: INITIAL_CHILD_PATH,
      allowedRequestCount: 0,
      http200ResponseCount: 0,
      serverServedCount: countExact(
        serverRequestsBeforeAttempt,
        (entry) => entry.path === INITIAL_CHILD_PATH && entry.served === true,
      ),
    };
    initialDelivery = await waitForDelivery({
      page,
      pathname: INITIAL_CHILD_PATH,
      baseline: initialZero,
      requests,
      responses,
      serverRequests: exactServer.serverRequests,
      timeoutMs: INITIAL_DELIVERY_TIMEOUT_MS,
      elapsedMs,
    });
    if (!initialDelivery.complete) {
      blocker = {
        kind: "initial-host-child-exact-delivery-not-observed",
        expectedPath: INITIAL_CHILD_PATH,
        observation: initialDelivery,
      };
    } else {
      screenshots.push(await capturePlayer(
        page,
        outputRoot,
        `${String(plan.attempt).padStart(2, "0")}-${plan.id}-initial-ir-delivered.png`,
        elapsedMs,
      ));
      initialCompletionWait = await recordWait(
        page,
        inputs.waitPolicy.initialChild.plannedWaitMs,
        "ir001-136-frame-child-completion-window",
        inputs.waitPolicy.initialChild,
        elapsedMs,
      );
      waits.push(initialCompletionWait);
      invariant(initialCompletionWait.completed, "IR001 completion wait ended early");
      keytermXmlDelivery = deliverySnapshot(
        KEYTERM_XML_REQUEST_PATH,
        {
          path: KEYTERM_XML_REQUEST_PATH,
          allowedRequestCount: 0,
          http200ResponseCount: 0,
          serverServedCount: countExact(
            serverRequestsBeforeAttempt,
            (entry) => entry.path === KEYTERM_XML_REQUEST_PATH &&
              entry.served === true,
          ),
        },
        requests,
        responses,
        exactServer.serverRequests,
      );
      screenshots.push(await capturePlayer(
        page,
        outputRoot,
        `${String(plan.attempt).padStart(2, "0")}-${plan.id}-before-first-release.png`,
        elapsedMs,
      ));

      const point = inputs.expectedStaticReport.exactHostContract
        .sourceProvenNextControlPoint;
      const expected = inputs.transitionPlan[0];
      invariant(
        expected.step === 1 &&
          expected.expectedPath ===
            "/runtime/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
        "first successor transition identity drifted",
      );
      const baseline = deliveryBaseline(
        expected.expectedPath,
        requests,
        responses,
        exactServer.serverRequests,
      );
      const traceBefore = await page.evaluate(() => window.__probe.traceEvents.length);
      const input = await performSourcePointRelease(
        page,
        plan,
        point,
        elapsedMs,
        async (phase) => {
          const screenshot = await capturePlayer(
            page,
            outputRoot,
            `${String(plan.attempt).padStart(2, "0")}-${plan.id}-${phase}.png`,
            elapsedMs,
          );
          screenshots.push(screenshot);
          return screenshot;
        },
      );
      const delivery = await waitForDelivery({
        page,
        pathname: expected.expectedPath,
        baseline,
        requests,
        responses,
        serverRequests: exactServer.serverRequests,
        timeoutMs: DELIVERY_TIMEOUT_MS,
        elapsedMs,
      });
      const deliveryNotBeforePointerUpDispatch = delivery.complete && [
        delivery.firstNewRequestAtMs,
        delivery.firstNewHttp200ResponseAtMs,
        delivery.firstNewServerServedAtMs,
      ].every((atMs) => Number.isFinite(atMs) &&
        atMs >= input.pointerUpDispatchStartedAtMs);
      traceEvents = await page.evaluate(() => window.__probe.traceEvents);
      const traceAfterRelease = traceEvents.slice(traceBefore);
      const transition = {
        ...expected,
        input,
        evidenceLayers: {
          domPointerSequenceComplete:
            input.domSequence.completeTrustedReleaseSequence,
          avm1ReleaseEffectObserved: delivery.newAllowedRequestCount > 0,
          httpDeliveryComplete: delivery.complete,
          deliveryNotBeforePointerUpDispatch:
            deliveryNotBeforePointerUpDispatch,
        },
        delivery,
        traceEventCountBeforeRelease: traceBefore,
        traceEventsAfterRelease: traceAfterRelease,
        traceReferencesExpectedPath:
          traceReferencesExpectedPath(traceAfterRelease, expected.expectedPath),
        preloaderSettle: null,
        screenshot: null,
      };
      transitions.push(transition);
      if (!delivery.complete) {
        blocker = {
          kind: input.domSequence.completeTrustedReleaseSequence
            ? "ruffle-avm1-release-or-handler-execution-not-observed"
            : "input-geometry-focus-or-pointer-phase-blocker",
          step: expected.step,
          expectedPath: expected.expectedPath,
          domSequence: input.domSequence,
          traceReferencesExpectedPath: transition.traceReferencesExpectedPath,
          observation: delivery,
        };
        await page.mouse.move(
          input.geometry.canvasRect.x + input.geometry.canvasRect.width / 2,
          input.geometry.canvasRect.y + input.geometry.canvasRect.height / 2,
          {steps: 6},
        );
        await page.waitForTimeout(200);
        transition.screenshot = await capturePlayer(
          page,
          outputRoot,
          `${String(plan.attempt).padStart(2, "0")}-${plan.id}-post-up-rollout-blocker.png`,
          elapsedMs,
        );
        screenshots.push(transition.screenshot);
      } else {
        invariant(
          deliveryNotBeforePointerUpDispatch,
          "RW002 delivery was not ordered after the observed pointer release",
        );
        transition.preloaderSettle = await recordWait(
          page,
          inputs.waitPolicy.hostPreloader.plannedWaitMs,
          "host-preloader-settle-after-rw002-exact-delivery",
          {
            expectedPath: expected.expectedPath,
            hostPreloader: inputs.waitPolicy.hostPreloader,
            boundary:
              "navigation diagnostic settle only; not the RW002 child-domain completion window",
          },
          elapsedMs,
        );
        waits.push(transition.preloaderSettle);
        invariant(transition.preloaderSettle.completed, "RW002 preloader settle ended early");
        transition.screenshot = await capturePlayer(
          page,
          outputRoot,
          `${String(plan.attempt).padStart(2, "0")}-${plan.id}-rw002-delivered-preloader-settled.png`,
          elapsedMs,
        );
        screenshots.push(transition.screenshot);
      }
    }
    traceEvents = await page.evaluate(() => window.__probe.traceEvents);
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
  } catch (error) {
    fatalError = error.stack || error.message;
  } finally {
    await context.close();
  }
  const serverRequests = exactServer.serverRequests.slice(serverStartIndex);
  const blockedRequests = requests.filter((entry) =>
    entry.disposition.startsWith("blocked-"));
  const servedUnknown = serverRequests.filter((entry) => !entry.served);
  const successfulTransitions = transitions.filter((entry) =>
    entry.delivery.complete);
  const firstSuccessorDeliveryObserved =
    transitions[0]?.delivery.complete === true;
  return {
    plan,
    freshContextClosed: true,
    fatalError,
    blocker,
    navigationStatus,
    launchState,
    playerState,
    initialDelivery,
    initialCompletionWait,
    keytermXmlDelivery,
    transitions,
    successfulExpectedChildTransitions: successfulTransitions.length,
    firstSuccessorDeliveryObserved,
    targetDeliveryObserved: false,
    traceEvents,
    waits,
    screenshots,
    containment: {
      browserRequestPolicy:
        "exact-origin exact-path GET allowlist; all other HTTP(S) aborted before network; all WebSockets closed",
      allowedPathCount: allowedPaths.size,
      browserRequestCount: requests.length,
      requestCountsByDisposition: countBy(requests, (entry) => entry.disposition),
      blockedRequestCount: blockedRequests.length,
      blockedRequests,
      websocketAttemptCount: websocketAttempts.length,
      websocketAttempts,
      serverRequestCount: serverRequests.length,
      serverRequests,
      serverUnknownRequestCount: servedUnknown.length,
      dialogs,
      popups,
      downloads,
      legacyEndpointExecutionObserved: false,
      containmentBreached: servedUnknown.length > 0,
    },
    diagnostics: {
      responseCount: responses.length,
      responses,
      failedRequestCount: failedRequests.length,
      failedRequests,
      console: summarizeConsole(consoleMessages),
      pageErrors,
    },
  };
}

async function runFullChainAttempt({
  browser,
  exactServer,
  inputs,
  outputRoot,
  plan,
  elapsedMs,
}) {
  const requests = [];
  const responses = [];
  const failedRequests = [];
  const websocketAttempts = [];
  const consoleMessages = [];
  const pageErrors = [];
  const dialogs = [];
  const popups = [];
  const downloads = [];
  const transitions = [];
  const screenshots = [];
  const waits = [];
  let navigationStatus = null;
  let launchState = null;
  let playerState = null;
  let initialDelivery = null;
  let initialCompletionWait = null;
  let keytermXmlDelivery = null;
  let traceEvents = [];
  let fatalError = null;
  let blocker = null;
  const allowedPaths = new Set(exactServer.resources.keys());
  allowedPaths.delete(KEYTERM_XML_REQUEST_PATH);
  const expectedChildPaths = new Set(
    inputs.transitionPlan.map((entry) => entry.expectedPath),
  );
  const stepByPath = new Map(
    inputs.transitionPlan.map((entry) => [entry.expectedPath, entry.step]),
  );
  const serverStartIndex = exactServer.serverRequests.length;
  const serverRequestsBeforeAttempt = exactServer.serverRequests.slice(
    0,
    serverStartIndex,
  );
  const context = await browser.newContext({
    viewport: {width: 800, height: 600},
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
  });
  try {
    await context.addInitScript({content: buildPreRuffleInputObserverSource()});
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
    invariant(navigationStatus === 200, `diagnostic page returned ${navigationStatus}`);
    await page.waitForFunction(
      () => window.__probe &&
        (window.__probe.loadResolved || window.__probe.loadRejected),
      null,
      {timeout: 30_000},
    );
    launchState = await page.evaluate(() => window.__probe);
    invariant(
      launchState.loadResolved === true &&
        launchState.loadRejected === null &&
        launchState.traceObserverInstalled === true &&
        launchState.preRuffleInputObserverInstalledAtLaunch === true &&
        launchState.windowInputObserverInstalled === true &&
        launchState.domInputObserverInstalled === true,
      "Ruffle load or diagnostic-observer installation failed",
    );
    const initialZero = {
      path: INITIAL_CHILD_PATH,
      allowedRequestCount: 0,
      http200ResponseCount: 0,
      serverServedCount: countExact(
        serverRequestsBeforeAttempt,
        (entry) => entry.path === INITIAL_CHILD_PATH && entry.served === true,
      ),
    };
    initialDelivery = await waitForDelivery({
      page,
      pathname: INITIAL_CHILD_PATH,
      baseline: initialZero,
      requests,
      responses,
      serverRequests: exactServer.serverRequests,
      timeoutMs: INITIAL_DELIVERY_TIMEOUT_MS,
      elapsedMs,
    });
    if (!initialDelivery.complete) {
      blocker = {
        kind: "initial-host-child-exact-delivery-not-observed",
        expectedPath: INITIAL_CHILD_PATH,
        observation: initialDelivery,
      };
    } else {
      screenshots.push(await capturePlayer(
        page,
        outputRoot,
        "01-initial-ir001-exact-delivery.png",
        elapsedMs,
      ));
      initialCompletionWait = await recordWait(
        page,
        inputs.waitPolicy.initialChild.plannedWaitMs,
        "ir001-source-declared-elapsed-window",
        {
          ...inputs.waitPolicy.initialChild,
          provesNaturalRuntimeEntry: false,
          provesNaturalRuntimeTerminal: false,
          provesAudioCompletionOrSynchronization: false,
        },
        elapsedMs,
      );
      waits.push(initialCompletionWait);
      invariant(initialCompletionWait.completed, "IR001 source window ended early");
      keytermXmlDelivery = deliverySnapshot(
        KEYTERM_XML_REQUEST_PATH,
        {
          path: KEYTERM_XML_REQUEST_PATH,
          allowedRequestCount: 0,
          http200ResponseCount: 0,
          serverServedCount: countExact(
            serverRequestsBeforeAttempt,
            (entry) => entry.path === KEYTERM_XML_REQUEST_PATH &&
              entry.served === true,
          ),
        },
        requests,
        responses,
        exactServer.serverRequests,
      );

      const point = inputs.expectedStaticReport.exactHostContract
        .sourceProvenNextControlPoint;
      for (const expected of inputs.transitionPlan) {
        const timing = inputs.timingBindings[expected.step - 1];
        invariant(
          timing.step === expected.step &&
            timing.expectedPath === expected.expectedPath,
          `step ${expected.step} timing binding drifted during execution`,
        );
        await page.bringToFront();
        const lifecycleBefore = await page.evaluate(() => ({
          visibilityState: document.visibilityState,
          hidden: document.hidden,
          hasFocus: document.hasFocus(),
        }));
        invariant(
          lifecycleBefore.visibilityState === "visible" &&
            lifecycleBefore.hidden === false,
          `page was not visible before step ${expected.step}`,
        );
        const slug = expected.sourcePath.replace(/\.swf$/i, "")
          .replaceAll("/", "-").toLowerCase();
        screenshots.push(await capturePlayer(
          page,
          outputRoot,
          `${String(expected.step).padStart(2, "0")}-${slug}-before-release.png`,
          elapsedMs,
        ));
        const baseline = deliveryBaseline(
          expected.expectedPath,
          requests,
          responses,
          exactServer.serverRequests,
        );
        const requestStartIndex = requests.length;
        const traceBefore = await page.evaluate(() =>
          window.__probe.traceEvents.length);
        const input = await performSourcePointRelease(
          page,
          plan,
          point,
          elapsedMs,
          async (phase) => {
            const screenshot = await capturePlayer(
              page,
              outputRoot,
              `${String(expected.step).padStart(2, "0")}-${slug}-${phase}.png`,
              elapsedMs,
            );
            screenshots.push(screenshot);
            return screenshot;
          },
        );
        const delivery = await waitForDelivery({
          page,
          pathname: expected.expectedPath,
          baseline,
          requests,
          responses,
          serverRequests: exactServer.serverRequests,
          timeoutMs: DELIVERY_TIMEOUT_MS,
          elapsedMs,
        });
        const deliveryNotBeforePointerUpDispatch = delivery.complete && [
          delivery.firstNewRequestAtMs,
          delivery.firstNewHttp200ResponseAtMs,
          delivery.firstNewServerServedAtMs,
        ].every((atMs) => Number.isFinite(atMs) &&
          atMs >= input.pointerUpDispatchStartedAtMs);
        traceEvents = await page.evaluate(() => window.__probe.traceEvents);
        const traceAfterRelease = traceEvents.slice(traceBefore);
        const newChildRequests = requests.slice(requestStartIndex).filter((entry) =>
          entry.disposition === "allowed-exact-loopback-get" &&
            expectedChildPaths.has(entry.path));
        const unexpectedChildRequests = newChildRequests.filter((entry) =>
          entry.path !== expected.expectedPath);
        const transition = {
          ...expected,
          timing,
          lifecycleBefore,
          input,
          evidenceLayers: {
            domPointerSequenceComplete:
              input.domSequence.completeTrustedReleaseSequence,
            avm1ReleaseEffectObserved: delivery.newAllowedRequestCount > 0,
            httpDeliveryComplete: delivery.complete,
            deliveryNotBeforePointerUpDispatch,
            noUnexpectedChildRequestDuringRelease:
              unexpectedChildRequests.length === 0,
          },
          delivery,
          newChildRequests,
          unexpectedChildRequests,
          traceEventCountBeforeRelease: traceBefore,
          traceEventsAfterRelease: traceAfterRelease,
          traceReferencesExpectedPath:
            traceReferencesExpectedPath(traceAfterRelease, expected.expectedPath),
          sourceDeclaredElapsedWindow: null,
          postDeliveryScreenshot: null,
          elapsedWindowScreenshot: null,
          targetTwoSecondStabilityCandidate: null,
        };
        transitions.push(transition);
        if (!input.domSequence.completeTrustedReleaseSequence) {
          blocker = {
            kind: "complete-trusted-canvas-release-not-observed",
            step: expected.step,
            expectedPath: expected.expectedPath,
            domSequence: input.domSequence,
          };
        } else if (!delivery.complete) {
          blocker = {
            kind: "ruffle-avm1-release-or-handler-execution-not-observed",
            step: expected.step,
            expectedPath: expected.expectedPath,
            observation: delivery,
          };
        } else if (!deliveryNotBeforePointerUpDispatch) {
          blocker = {
            kind: "child-delivery-not-ordered-after-pointerup",
            step: expected.step,
            expectedPath: expected.expectedPath,
            observation: delivery,
          };
        } else if (unexpectedChildRequests.length > 0) {
          blocker = {
            kind: "unexpected-child-request-during-release",
            step: expected.step,
            expectedPath: expected.expectedPath,
            unexpectedChildRequests,
          };
        }
        if (blocker) {
          transition.postDeliveryScreenshot = await capturePlayer(
            page,
            outputRoot,
            `${String(expected.step).padStart(2, "0")}-${slug}-blocker.png`,
            elapsedMs,
          );
          screenshots.push(transition.postDeliveryScreenshot);
          break;
        }
        transition.postDeliveryScreenshot = await capturePlayer(
          page,
          outputRoot,
          `${String(expected.step).padStart(2, "0")}-${slug}-exact-delivery.png`,
          elapsedMs,
        );
        screenshots.push(transition.postDeliveryScreenshot);
        const windowRequestStartIndex = requests.length;
        transition.sourceDeclaredElapsedWindow = await recordWait(
          page,
          timing.plannedWaitMs,
          `step-${expected.step}-source-declared-elapsed-window`,
          {
            expectedPath: expected.expectedPath,
            timing,
            boundary:
              "elapsed source-declared host-preloader-plus-child-domain window only; not a runtime playhead, natural terminal, or audio completion observation",
            provesNaturalRuntimeEntry: false,
            provesNaturalRuntimeTerminal: false,
            provesAudioCompletionOrSynchronization: false,
          },
          elapsedMs,
        );
        waits.push(transition.sourceDeclaredElapsedWindow);
        invariant(
          transition.sourceDeclaredElapsedWindow.completed,
          `step ${expected.step} source-declared elapsed window ended early`,
        );
        const futurePrefetches = requests.slice(windowRequestStartIndex)
          .filter((entry) =>
            entry.disposition === "allowed-exact-loopback-get" &&
              expectedChildPaths.has(entry.path) &&
              (stepByPath.get(entry.path) || 0) > expected.step);
        transition.futurePrefetchesDuringElapsedWindow = futurePrefetches;
        if (futurePrefetches.length > 0) {
          blocker = {
            kind: "unexpected-future-child-prefetch-during-elapsed-window",
            step: expected.step,
            futurePrefetches,
          };
          break;
        }
        const lifecycleAfter = await page.evaluate(() => ({
          visibilityState: document.visibilityState,
          hidden: document.hidden,
          hasFocus: document.hasFocus(),
        }));
        transition.lifecycleAfter = lifecycleAfter;
        invariant(
          lifecycleAfter.visibilityState === "visible" &&
            lifecycleAfter.hidden === false,
          `page was not visible after step ${expected.step} elapsed window`,
        );
        transition.elapsedWindowScreenshot = await capturePlayer(
          page,
          outputRoot,
          `${String(expected.step).padStart(2, "0")}-${slug}-source-window-elapsed.png`,
          elapsedMs,
        );
        screenshots.push(transition.elapsedWindowScreenshot);
        if (expected.target) {
          await page.waitForTimeout(2_000);
          const second = await capturePlayer(
            page,
            outputRoot,
            `${String(expected.step).padStart(2, "0")}-${slug}-two-seconds-later.png`,
            elapsedMs,
          );
          screenshots.push(second);
          transition.targetTwoSecondStabilityCandidate = {
            first: transition.elapsedWindowScreenshot,
            second,
            byteIdenticalPng:
              transition.elapsedWindowScreenshot.sha256 === second.sha256,
            provesRuntimeTerminal: false,
            provesVisualFidelity: false,
          };
        }
      }
    }
    traceEvents = await page.evaluate(() => window.__probe.traceEvents);
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
  } catch (error) {
    fatalError = error.stack || error.message;
  } finally {
    await context.close();
  }
  const serverRequests = exactServer.serverRequests.slice(serverStartIndex);
  const blockedRequests = requests.filter((entry) =>
    entry.disposition.startsWith("blocked-"));
  const servedUnknown = serverRequests.filter((entry) => !entry.served);
  const successfulTransitions = transitions.filter((entry) =>
    entry.delivery.complete &&
      entry.input.domSequence.completeTrustedReleaseSequence &&
      entry.evidenceLayers.deliveryNotBeforePointerUpDispatch &&
      entry.unexpectedChildRequests.length === 0);
  const targetDeliveryObserved = transitions.some((entry) =>
    entry.target === true && entry.delivery.complete === true);
  return {
    plan,
    freshContextClosed: true,
    fatalError,
    blocker,
    navigationStatus,
    launchState,
    playerState,
    initialDelivery,
    initialCompletionWait,
    keytermXmlDelivery,
    transitions,
    successfulExpectedChildTransitions: successfulTransitions.length,
    firstSuccessorDeliveryObserved:
      successfulTransitions.some((entry) => entry.step === 1),
    targetDeliveryObserved,
    allSevenExpectedChildTransitionsObserved:
      successfulTransitions.length === 7 && targetDeliveryObserved,
    traceEvents,
    waits,
    screenshots,
    containment: {
      browserRequestPolicy:
        "exact-origin exact-path GET allowlist; ELKTEG4.xml and all other HTTP(S) aborted before network; all WebSockets closed",
      allowedPathCount: allowedPaths.size,
      browserRequestCount: requests.length,
      requestCountsByDisposition: countBy(requests, (entry) => entry.disposition),
      blockedRequestCount: blockedRequests.length,
      blockedRequests,
      websocketAttemptCount: websocketAttempts.length,
      websocketAttempts,
      serverRequestCount: serverRequests.length,
      serverRequests,
      serverUnknownRequestCount: servedUnknown.length,
      dialogs,
      popups,
      downloads,
      legacyEndpointExecutionObserved: false,
      containmentBreached: servedUnknown.length > 0,
    },
    diagnostics: {
      responseCount: responses.length,
      responses,
      failedRequestCount: failedRequests.length,
      failedRequests,
      console: summarizeConsole(consoleMessages),
      pageErrors,
    },
  };
}

export async function preflightSuccessorV7() {
  const inputs = await bindInputs();
  return {
    staticAntecedent: descriptor(inputs.staticReport),
    predecessorV6: descriptor(inputs.v6Result),
    vb001HostChainAudit: descriptor(inputs.vb001AuditResult),
    transitionPlan: inputs.transitionPlan,
    timingBindings: inputs.timingBindings,
    authority: buildFailClosedAuthority(),
  };
}

export async function runSuccessorV7Probe() {
  const inputs = await bindInputs();
  const output = await createOutput(inputs);
  const probeStarted = Date.now();
  const elapsedMs = () => Date.now() - probeStarted;
  const exactServer = await createExactServer(inputs, elapsedMs);
  const attemptPlans = buildInputAttemptPlans();
  const attempts = [];
  let topLevelFatalError = null;
  const browser = await chromium.launch({headless: true});
  try {
    for (const plan of attemptPlans) {
      const attempt = await runFullChainAttempt({
        browser,
        exactServer,
        inputs,
        outputRoot: output.outputRoot,
        plan,
        elapsedMs,
      });
      attempts.push(attempt);
      if (attempt.allSevenExpectedChildTransitionsObserved || attempt.blocker) break;
    }
  } catch (error) {
    topLevelFatalError = error.stack || error.message;
  } finally {
    await browser.close();
    await closeServer(exactServer.server);
  }

  const [
    staticAfter,
    v2After,
    v3After,
    v4After,
    v5After,
    v6After,
    vb001AuditAfter,
  ] = await Promise.all([
    readBinding(STATIC_REPORT_RELATIVE),
    readBinding(V2_RESULT_RELATIVE),
    readBinding(V3_RESULT_RELATIVE),
    readBinding(V4_RESULT_RELATIVE),
    readBinding(V5_RESULT_RELATIVE),
    readBinding(V6_RESULT_RELATIVE),
    readBinding(VB001_AUDIT_RELATIVE),
  ]);
  const timingAfter = await Promise.all(
    inputs.timingBindings.map((entry) =>
      entry.step === 5 ? readBinding(VB001_AUDIT_RELATIVE) : readBinding(entry.evidence.path)),
  );
  const xmlAfterBytes = await readFile(path.join(SOURCE_ARCHIVE, KEYTERM_XML_SOURCE_RELATIVE));
  invariant(
    staticAfter.sha256 === inputs.staticReport.sha256 &&
      v2After.sha256 === inputs.v2Result.sha256 &&
      v3After.sha256 === inputs.v3Result.sha256 &&
      v4After.sha256 === inputs.v4Result.sha256 &&
      v5After.sha256 === inputs.v5Result.sha256 &&
      v6After.sha256 === inputs.v6Result.sha256 &&
      vb001AuditAfter.sha256 === inputs.vb001AuditResult.sha256 &&
      timingAfter.every((binding, index) =>
        binding.sha256 === inputs.timingBindings[index].evidence.sha256) &&
      xmlAfterBytes.length === inputs.xml.bytes &&
      sha256(xmlAfterBytes) === inputs.xml.sha256,
    "an immutable predecessor or canonical XML changed during v7",
  );
  const containmentBreached = attempts.some((attempt) =>
    attempt.containment.containmentBreached);
  const successfulChainAttempt = attempts.find((attempt) =>
    attempt.allSevenExpectedChildTransitionsObserved) || null;
  const furthestAttempt = [...attempts].sort((left, right) =>
    right.successfulExpectedChildTransitions -
      left.successfulExpectedChildTransitions)[0] || null;
  const keytermXmlDelivered = attempts.some((attempt) =>
    attempt.keytermXmlDelivery?.complete === true);
  const firstTransitions = attempts.flatMap((attempt) => attempt.transitions)
    .filter((transition) => transition.step === 1);
  const firstTransition = firstTransitions.find((transition) =>
    transition.delivery.complete) || firstTransitions.at(-1) || null;
  const completeDomReleaseObserved = firstTransitions.some((transition) =>
    transition.input.domSequence.completeTrustedReleaseSequence === true);
  const targetTransition = attempts.flatMap((attempt) => attempt.transitions)
    .find((transition) => transition.target === true) || null;
  const targetDeliveryObserved = targetTransition?.delivery?.complete === true;
  const scriptBytes = await readFile(SCRIPT_PATH);
  const result = {
    schemaVersion: 7,
    reportType:
      "g4-l10-vb003-contained-original-host-ruffle-successor-v7-diagnostic",
    generatedAt: new Date().toISOString(),
    status: topLevelFatalError || attempts.every((attempt) => attempt.fatalError)
      ? "probe-error-contained-no-authority"
      : successfulChainAttempt
        ? "vb003-http-delivery-observed-after-seven-complete-dom-releases-and-source-declared-elapsed-windows-in-ruffle-forensic-only"
        : targetDeliveryObserved
          ? "vb003-http-delivery-observed-but-seven-step-chain-incomplete-in-ruffle-forensic-only"
          : furthestAttempt?.successfulExpectedChildTransitions > 0
            ? "partial-source-window-chain-observed-before-fail-closed-stop-in-ruffle-forensic-only"
        : completeDomReleaseObserved
          ? "complete-trusted-canvas-release-observed-after-ruffle-chrome-clear-rw002-not-requested-in-forensic-only"
          : "trusted-canvas-release-not-observed-after-ruffle-chrome-clear-probe-remains-input-limited",
    probe: {
      path: portable(SCRIPT_PATH),
      bytes: scriptBytes.length,
      sha256: sha256(scriptBytes),
      outputPath: RESULT_RELATIVE,
      outputDirectoryModeAfterFinalize: "0555",
      overwritesV2Diagnostic: false,
      overwritesV3Diagnostic: false,
      overwritesV4Diagnostic: false,
      overwritesV5Diagnostic: false,
      overwritesV6Diagnostic: false,
      browserAutomation:
        "real Chromium via repository-pinned Playwright; one fresh context preserves v6's deny-by-default network policy, clears pinned Ruffle modal chrome through its real UI, performs at most seven staged trusted Next releases, and waits source-declared elapsed-time envelopes without treating them as runtime playhead evidence",
    },
    lineage: {
      staticAntecedent: {
        before: descriptor(inputs.staticReport),
        after: descriptor(staticAfter),
        archivedCopy: output.archives[0],
        unchanged: true,
        checkModePassedImmediatelyBeforeProbe: true,
      },
      predecessorV6: {
        before: descriptor(inputs.v6Result),
        after: descriptor(v6After),
        archivedCopy: output.archives.find((entry) =>
          entry.sha256 === inputs.v6Result.sha256),
        unchanged: true,
        recordedStatus: inputs.v6.status,
        successfulExpectedChildTransitions:
          inputs.v6.observation.attempts[0].successfulExpectedChildTransitions,
        completeTrustedFirstReleaseObserved: true,
        firstRw002HttpDeliveryObserved: true,
        authorityEffect: "none",
      },
      vb001HostChainStaticAudit: {
        before: descriptor(inputs.vb001AuditResult),
        after: descriptor(vb001AuditAfter),
        archivedCopy: output.archives.find((entry) =>
          entry.sha256 === inputs.vb001AuditResult.sha256),
        unchanged: true,
        activeCourseXmlMember: false,
        formalReleaseMember: false,
        principalTimelineId:
          inputs.vb001Audit.controlledNavigationTimingCandidate.principalTimelineId,
        principalFrameCount:
          inputs.vb001Audit.controlledNavigationTimingCandidate.principalFrameCount,
        controlledProbeWaitMs:
          inputs.vb001Audit.controlledNavigationTimingCandidate
            .conservativePostDeliveryWaitMs,
        provesNaturalRuntimeEntry: false,
        provesNaturalRuntimeTerminal: false,
        authorityEffect: "none",
      },
      frameDomainTimingEvidence: inputs.timingBindings.map((entry, index) => ({
        step: entry.step,
        expectedPath: entry.expectedPath,
        timelineId: entry.timelineId,
        frameCount: entry.frameCount,
        nominalDomainDurationMs: entry.nominalDomainDurationMs,
        plannedWaitMs: entry.plannedWaitMs,
        before: entry.evidence,
        after: descriptor(timingAfter[index]),
        archivedCopy: output.archives.find((artifact) =>
          artifact.sha256 === entry.evidence.sha256) ||
            (entry.step === 5
              ? output.archives.find((artifact) =>
                artifact.sha256 === inputs.vb001AuditResult.sha256)
              : null),
        unchanged: true,
        entryState: entry.entryState,
        provesNaturalRuntimeEntry: false,
        provesNaturalRuntimeTerminal: false,
      })),
      keytermXml: {
        source: {
          path: inputs.xml.path,
          bytes: inputs.xml.bytes,
          sha256: inputs.xml.sha256,
          mode: inputs.xml.sourceMode,
        },
        requestPath: inputs.xml.requestPath,
        archivedCopy: output.archives.find((entry) =>
          entry.sha256 === inputs.xml.sha256),
        sourceUnchangedAfterProbe: true,
      },
    },
    hypotheses: {
      causalContinuation:
        "v7 preserves the successful v6 input geometry, modal-clear procedure, trusted DOM observation, exact loopback delivery contract, and XML-blocked network policy; its only material extension is repeated source-window-gated Next releases in the same fresh context",
      domEventLayer:
        "each release requires a trusted ordered pointerdown/pointerup pair with one pointerId, both events inside the exact source-proven Next hit bounds, Canvas and Ruffle player in both composed paths, primary button state, and no intervening pointercancel",
      avm1EffectLayer:
        "each release effect requires a new exact expected-child browser request, loopback server service, and HTTP 200 ordered after pointerup; rollover and browser command receipts are insufficient",
      sourceDeclaredWaitLayer:
        "3,084 ms host-preloader settle plus ceil(frameCount/12fps) plus 1,000 ms buffer is a conservative elapsed-time envelope only",
      elapsedWindowProvesNaturalEntryOrTerminal: false,
      targetTwoSecondPixelStabilityProvesRuntimeTerminal: false,
      targetTwoSecondPixelStabilityProvesVisualFidelity: false,
      ruffleHardwareModalContract: inputs.hardwareModalContract,
      browserCommandReceiptsProveDomDelivery: false,
      telemetryPostPolicy:
        "legacy telemetry POST remains blocked before server execution; no local no-op endpoint is introduced",
      keytermXmlPolicy:
        "ELKTEG4.xml remains blocked exactly as in the successful v6 attempt; v6 established that first successor delivery did not require XML delivery",
      keytermXmlDeliveryProvesParsing: false,
      ruffleTraceProvesOriginalRuntimeCausality: false,
      ruffleForensicChainProvesAdobeOriginalRuntime: false,
    },
    staticPlan: {
      requiredNextReleaseCount: 7,
      transitions: inputs.transitionPlan,
      sourceProvenNextControlPoint:
        inputs.expectedStaticReport.exactHostContract.sourceProvenNextControlPoint,
      waitPolicy: inputs.waitPolicy,
      sourceDeclaredTransitionWindows: inputs.timingBindings,
      inputAttemptPlans: attemptPlans,
      runtimeProbeScope:
        "one fresh-context attempt, at most seven source-window-gated releases; stop immediately on the first incomplete trusted DOM release, wrong or unordered child delivery, future-child prefetch, hidden page, Ruffle or browser error, or containment anomaly",
    },
    runtime: {
      browser: "Chromium via @playwright/test 1.61.1",
      browserContexts: "one fresh ephemeral context at most; closed after the bounded chain attempt",
      serverOrigin: exactServer.origin,
      serverBind: "127.0.0.1-ephemeral-port",
      ruffle: inputs.v2.runtime.ruffle,
      launchArtifacts: exactServer.launchArtifacts,
    },
    containment: {
      allowedResourcePathCount: exactServer.resources.size,
      attemptCount: attempts.length,
      containmentBreached,
      serverUnknownRequestCount: attempts.reduce(
        (count, attempt) => count + attempt.containment.serverUnknownRequestCount,
        0,
      ),
      legacyEndpointExecutionObserved: false,
      allWebSocketsBlocked: attempts.every((attempt) =>
        attempt.containment.websocketAttempts.every((entry) =>
          entry.disposition === "blocked-all-websockets")),
    },
    observation: {
      attemptCount: attempts.length,
      attempts,
      ruffleChrome: {
        staticContract: inputs.hardwareModalContract,
        releaseSetups: attempts.flatMap((attempt) =>
          attempt.transitions.map((transition) => {
            const setup = transition.input?.ruffleChromeSetup;
            return {
            attempt: attempt.plan.attempt,
            step: transition.step,
            expectedPath: transition.expectedPath,
            modalObserved: setup?.modalObserved ?? null,
            trustedClosePerformed: setup?.trustedClosePerformed ?? null,
            clearedBeforeTargetEvidence: setup?.cleared ?? false,
            targetHitCanvasAfterClear:
              setup?.final?.targetElement?.isCanvas ?? false,
            allModalsHiddenAfterClear:
              setup?.final?.allModalsHidden ?? false,
            };
          })),
        closingModalProvesFlashBehavior: false,
      },
      keytermXml: {
        exactGetDeliveryObserved: keytermXmlDelivered,
        exactBytesServed: keytermXmlDelivered ? inputs.xml.bytes : 0,
        sourceSha256: inputs.xml.sha256,
        attemptPolicies: attempts.map((attempt) => ({
          attempt: attempt.plan.attempt,
          policy: attempt.plan.keytermXmlPolicy,
          exactGetDeliveryObserved:
            attempt.keytermXmlDelivery?.complete === true,
          blockedRequestObserved:
            attempt.containment.blockedRequests.some((entry) =>
              entry.path === KEYTERM_XML_REQUEST_PATH),
        })),
        runtimeParseOrUseObserved: false,
        reason:
          "HTTP request/response/service proves exact byte delivery only; Ruffle exposes no hash-bound XML parse/use state here.",
      },
      firstSuccessorTransition: firstTransition
        ? {
          expectedPath: firstTransition.expectedPath,
          inputPlanId: firstTransition.input.plan.id,
          keytermXmlPolicy: firstTransition.input.plan.keytermXmlPolicy,
          domSequence: firstTransition.input.domSequence,
          geometry: firstTransition.input.geometry,
          evidenceLayers: firstTransition.evidenceLayers,
          delivery: firstTransition.delivery,
          traceReferencesExpectedPath:
            firstTransition.traceReferencesExpectedPath,
        }
        : null,
      furthestReach: furthestAttempt
        ? {
          attempt: furthestAttempt.plan.attempt,
          inputPlanId: furthestAttempt.plan.id,
          successfulExpectedChildTransitions:
            furthestAttempt.successfulExpectedChildTransitions,
          transition: furthestAttempt.transitions
            .filter((entry) => entry.delivery.complete)
            .at(-1) || null,
        }
        : null,
      chain: {
        requiredReleaseCount: 7,
        successfulExpectedChildTransitions:
          furthestAttempt?.successfulExpectedChildTransitions || 0,
        allSevenExpectedChildTransitionsObserved:
          successfulChainAttempt !== null,
        orderedExpectedPaths:
          inputs.transitionPlan.map((entry) => entry.expectedPath),
        observedTransitions:
          furthestAttempt?.transitions.map((entry) => ({
            step: entry.step,
            expectedPath: entry.expectedPath,
            completeTrustedReleaseSequence:
              entry.input.domSequence.completeTrustedReleaseSequence,
            deliveryComplete: entry.delivery.complete,
            deliveryNotBeforePointerUpDispatch:
              entry.evidenceLayers.deliveryNotBeforePointerUpDispatch,
            sourceDeclaredElapsedWindowCompleted:
              entry.sourceDeclaredElapsedWindow?.completed === true,
            elapsedWindowProvesNaturalEntryOrTerminal: false,
          })) || [],
        blocker: furthestAttempt?.blocker || null,
      },
      target: {
        expectedSwfPath:
          inputs.expectedStaticReport.runtimeProbeContract.expectedTargetRequest,
        attempted: targetTransition !== null,
        swfHttpDeliveryObserved: targetDeliveryObserved,
        exactDeliveryOrderedAfterTrustedPointerRelease:
          targetTransition?.evidenceLayers
            ?.deliveryNotBeforePointerUpDispatch === true,
        sourceDeclaredElapsedWindowCompleted:
          targetTransition?.sourceDeclaredElapsedWindow?.completed === true,
        twoSecondPixelStabilityCandidate:
          targetTransition?.targetTwoSecondStabilityCandidate || null,
        beginHandshakeActuallyObserved: false,
        childFrameDomainActuallyObserved: false,
        naturalPlaybackProven: false,
      },
      audio: {
        namedHumanListeningOccurred: false,
        synchronizationObserved: false,
        acceptanceEffect: "none",
      },
    },
    diagnostics: {
      topLevelFatalError,
    },
    authority: buildFailClosedAuthority(),
  };
  const resultPath = path.join(PROJECT_ROOT, RESULT_RELATIVE);
  await writeFile(resultPath, stableJson(result), {
    flag: "wx",
    mode: 0o444,
  });
  await chmod(resultPath, 0o444);
  await chmod(output.outputRoot, 0o555);
  invariant(!containmentBreached, "containment breach recorded");
  process.stdout.write(
    `${RESULT_RELATIVE}: wrote ${Buffer.byteLength(stableJson(result))} bytes\n`,
  );
  process.stdout.write(
    `status=${result.status}; attempts=${attempts.length}; keytermXmlDelivered=${keytermXmlDelivered}; successfulTransitions=${furthestAttempt?.successfulExpectedChildTransitions || 0}; targetDelivery=${targetDeliveryObserved}\n`,
  );
  return result;
}

async function main() {
  invariant(process.argv.length === 2, "this successor probe accepts no arguments");
  await runSuccessorV7Probe();
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
