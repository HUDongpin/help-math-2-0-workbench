#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultBaseUrl = "http://localhost:3213";
const sha256Pattern = /^[a-f0-9]{64}$/;
export const DEV_OVERLAY_CAPTURE_STYLE_ID = "help-math-qa-hide-next-dev-overlay";
export const DEV_OVERLAY_CAPTURE_CSS = [
  "script[data-nextjs-dev-overlay='true']",
  "nextjs-portal",
  "{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
].join("");

export const AUTHORITY_CLAIM_KEYS = Object.freeze([
  "authoritativeOriginalRuntimeBaseline",
  "naturalOriginalRuntimeTraversal",
  "interactionBranchParity",
  "scoringParity",
  "bilingualVisualParity",
  "audioParity",
  "fullFrameCoverage",
  "rmseAcceptance",
  "humanVisualReview",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictMigrationCompletion",
]);
const falseClaims = Object.freeze(Object.fromEntries(AUTHORITY_CLAIM_KEYS.map((key) => [key, false])));

/**
 * These are candidate-QA contracts, not fidelity specifications. Every ready
 * frame is a source-drawing inspection point and every blocked case is an
 * already-declared fail-closed renderer state. The factory never invents a
 * host scenario merely to make a browser assertion pass.
 */
export const COURSE_CANDIDATE_QA_CONFIGS = Object.freeze({
  "course-g03-l01-ts-008": Object.freeze({
    animationId: "course-g03-l01-ts-008",
    outputFile: "nextjs-native-candidate-qa.json",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf",
      sha256: "9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b",
    }),
    frameDomain: "sprite-348",
    rootFrame: 6,
    frameCount: 747,
    readyCases: Object.freeze([
      Object.freeze({frame: 1, scenario: "source-drawing-default", seed: 0}),
      Object.freeze({frame: 295, scenario: "source-drawing-default", seed: 0}),
      Object.freeze({frame: 747, scenario: "source-drawing-default", seed: 17}),
    ]),
    replay: Object.freeze({scenario: "source-drawing-default", seed: 0, canAdvance: true}),
    mobileFrame: 295,
    reducedMotionFrame: 295,
    spanishReadyCase: Object.freeze({
      frame: 295,
      scenario: "source-drawing-default",
      lang: "es",
      seed: 0,
      classification: "source-shared-untranslated-visual",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: false,
    }),
    hostBlockedCases: Object.freeze([
      Object.freeze({frame: 295, scenario: "answer-correct-unavailable", seed: 0, reason: "correct-answer-host-state-unresolved"}),
      Object.freeze({frame: 295, scenario: "answer-first-wrong-unavailable", seed: 0, reason: "first-wrong-answer-host-state-unresolved"}),
      Object.freeze({frame: 295, scenario: "answer-second-wrong-unavailable", seed: 0, reason: "second-wrong-answer-host-state-unresolved"}),
      Object.freeze({frame: 295, scenario: "glossary-popup-unavailable", seed: 0, reason: "glossary-popup-host-state-unresolved"}),
      Object.freeze({frame: 295, scenario: "completion-scoring-replay-unavailable", seed: 0, reason: "completion-scoring-replay-host-state-unresolved"}),
    ]),
    hostUnaddressableReason: null,
    limitations: Object.freeze([
      "Correct/wrong answer paths, retry count, forced continuation, scoring, glossary, completion, and source Replay remain unresolved.",
      "The es route preserves the same untranslated source drawing; no audio is rendered, and Spanish translation, authoritative frame comparison, and human/owner acceptance remain unresolved.",
    ]),
  }),
  "course-g03-l06-fq-002-review": Object.freeze({
    animationId: "course-g03-l06-fq-002-review",
    outputFile: "nextjs-structural-candidate-qa.json",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf",
      sha256: "fadffa9df169b4c3417066431f8bfbc16a923778ec17a213b21a7ba2d0a51563",
    }),
    frameDomain: "sprite-1168",
    rootFrame: 6,
    frameCount: 82,
    readyCases: Object.freeze([
      Object.freeze({frame: 1, scenario: "default", seed: 0}),
      Object.freeze({frame: 50, scenario: "default", seed: 0}),
      Object.freeze({frame: 82, scenario: "default", seed: 0}),
    ]),
    replay: Object.freeze({scenario: "default", seed: 0, canAdvance: false}),
    mobileFrame: 1,
    reducedMotionFrame: 1,
    spanishCase: Object.freeze({frame: 1, scenario: "default", seed: 0, reason: "spanish-visual-and-audio-not-source-proven"}),
    hostBlockedCases: Object.freeze([]),
    hostUnaddressableReason: "The candidate declares only a structural default scenario. Original answer, score, review-navigation, reporting, completion, and Replay states have no source-proven browser address and remain blocked outside this QA.",
    limitations: Object.freeze([
      "Static source drawings can contain mutually unreachable AVM1-controlled layers and are not reachable-state evidence.",
      "Original answer, score, review navigation, reporting, bilingual audio, completion, authoritative RMSE, and human/owner acceptance remain unresolved.",
    ]),
  }),
  "course-g03-l06-ti-001": Object.freeze({
    animationId: "course-g03-l06-ti-001",
    outputFile: "nextjs-native-candidate-qa.json",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf",
      sha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
    }),
    frameDomain: "sprite-21",
    rootFrame: 6,
    frameCount: 142,
    readyCases: Object.freeze([
      Object.freeze({frame: 1, scenario: "sound-from-seed", seed: 0}),
      Object.freeze({frame: 71, scenario: "sound-0", seed: 0}),
      Object.freeze({frame: 142, scenario: "sound-1", seed: 1}),
    ]),
    replay: Object.freeze({scenario: "sound-0", seed: 0, canAdvance: true}),
    mobileFrame: 142,
    reducedMotionFrame: 142,
    spanishReadyCase: Object.freeze({
      frame: 142,
      scenario: "sound-0",
      lang: "es",
      seed: 0,
      classification: "source-shared-untranslated-visual",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: true,
    }),
    audioAssets: Object.freeze([
      Object.freeze({
        cueId: "embedded-stream-0001",
        path: "/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0001.mp3",
        sha256: "9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff",
        bytes: 67080,
      }),
      Object.freeze({
        cueId: "embedded-stream-0002",
        path: "/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0002.mp3",
        sha256: "d90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420",
        bytes: 67080,
      }),
    ]),
    audioRuntime: Object.freeze({
      scenario: "sound-0",
      seed: 0,
      source: "/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0001.mp3",
      startFrame: 5,
      endFrame: 137,
    }),
    hostBlockedCases: Object.freeze([]),
    hostUnaddressableReason: "The modern runtime has deterministic sound-0/sound-1 projections, but no authoritative original-host traversal is source-proven or browser-addressable.",
    limitations: Object.freeze([
      "Both byte-exact extracted random audio streams are wired to modern branches. Browser QA covers asset integrity and the modern start/stop/Replay state machine only; authoritative listening, language, original-runtime synchronization, and parity remain unresolved.",
      "The es route preserves the sole source drawing timeline, including its embedded English title, because the SWF contains no visual language branch; this is not a Spanish translation.",
      "The visible Adobe engineering probe conflict, authoritative all-frame comparison, and human/owner acceptance remain unresolved.",
    ]),
  }),
  "course-g04-l09-gs-002": Object.freeze({
    animationId: "course-g04-l09-gs-002",
    outputFile: "nextjs-native-candidate-qa.json",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf",
      sha256: "41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15",
    }),
    frameDomain: "sprite-787",
    rootFrame: 6,
    frameCount: 653,
    readyCases: Object.freeze([
      Object.freeze({frame: 1, scenario: "source-drawing-lead-in", seed: 0}),
      Object.freeze({frame: 331, scenario: "source-drawing-lead-in", seed: 0}),
      Object.freeze({frame: 641, scenario: "source-drawing-lead-in", seed: 17}),
    ]),
    rootReadyCases: Object.freeze([
      Object.freeze({
        frame: 1,
        frameDomain: "root",
        rootFrame: 1,
        scenario: "root-standalone",
        lang: "en",
        seed: 0,
        assetPath: "/flash-assets/courses/course-g04-l09-gs-002/root-frames/frame-0001.png",
        assetSha256: "6113a8b3b9f6359c5efde8fb500df39483d489f0961dcb66ad2e6a35fe87c85c",
      }),
      Object.freeze({
        frame: 10,
        frameDomain: "root",
        rootFrame: 10,
        scenario: "root-standalone",
        lang: "en",
        seed: 0,
        assetPath: "/flash-assets/courses/course-g04-l09-gs-002/root-frames/frame-0010.png",
        assetSha256: "d196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a",
      }),
    ]),
    rootSpanishReadyCase: Object.freeze({
      frame: 10,
      frameDomain: "root",
      rootFrame: 10,
      scenario: "root-standalone",
      lang: "es",
      seed: 0,
      assetPath: "/flash-assets/courses/course-g04-l09-gs-002/root-frames/frame-0010.png",
      assetSha256: "d196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a",
      classification: "source-shared-untranslated-visual",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: false,
    }),
    replay: Object.freeze({scenario: "source-drawing-lead-in", seed: 0, canAdvance: true}),
    mobileFrame: 641,
    reducedMotionFrame: 641,
    spanishCase: Object.freeze({frame: 641, scenario: "source-drawing-lead-in", seed: 0, reason: "spanish-visual-and-audio-not-source-proven"}),
    hostBlockedCases: Object.freeze([
      Object.freeze({frame: 642, scenario: "source-drawing-lead-in", seed: 0, reason: "question-final-avm1-state-unresolved"}),
      Object.freeze({frame: 643, scenario: "source-drawing-lead-in", seed: 0, reason: "question-final-avm1-state-unresolved"}),
      Object.freeze({frame: 642, scenario: "questions-q1-q10-unavailable", seed: 0, reason: "questions-q1-q10-host-state-unresolved"}),
      Object.freeze({frame: 642, scenario: "answer-correct-unavailable", seed: 0, reason: "correct-answer-feedback-unresolved"}),
      Object.freeze({frame: 642, scenario: "answer-wrong-unavailable", seed: 0, reason: "wrong-answer-feedback-unresolved"}),
      Object.freeze({frame: 642, scenario: "random-scoring-unavailable", seed: 17, reason: "random-selection-and-scoring-unresolved"}),
      Object.freeze({frame: 642, scenario: "final-replay-glossary-routing-unavailable", seed: 0, reason: "final-replay-glossary-and-course-routing-unresolved"}),
    ]),
    hostUnaddressableReason: null,
    limitations: Object.freeze([
      "Q1-Q10, random selection, correct/wrong feedback, scoring, Final, original Replay, glossary, and course routing remain unresolved and fail closed.",
      "Embedded/external audio, Spanish behavior, authoritative all-frame RMSE, and human/owner acceptance remain unresolved.",
    ]),
  }),
  "course-g05-l13-rw-002": Object.freeze({
    animationId: "course-g05-l13-rw-002",
    outputFile: "nextjs-structural-candidate-qa.json",
    source: Object.freeze({
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
      sha256: "bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6",
    }),
    frameDomain: "sprite-334",
    rootFrame: 6,
    frameCount: 1873,
    readyCases: Object.freeze([
      Object.freeze({frame: 1, scenario: "default", seed: 0}),
      Object.freeze({frame: 673, scenario: "default", seed: 0}),
      Object.freeze({frame: 674, scenario: "default", seed: 0}),
      Object.freeze({frame: 1873, scenario: "default", seed: 0}),
    ]),
    replay: Object.freeze({scenario: "default", seed: 0, canAdvance: true}),
    mobileFrame: 673,
    reducedMotionFrame: 673,
    spanishReadyCase: Object.freeze({
      frame: 673,
      scenario: "default",
      lang: "es",
      seed: 0,
      classification: "source-shared-untranslated-visual",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: false,
    }),
    hostBlockedCases: Object.freeze([]),
    hostUnaddressableReason: "The source-scheduled untranslated drawings are directly addressable in en/es contexts, but authoritative original-runtime execution, source interaction, Replay, Spanish audio, and host behavior remain outside this candidate QA.",
    limitations: Object.freeze([
      "Direct inspection of frames 674-1873 does not prove the original click transition, natural child phase, terminal behavior, or complete Replay reset.",
      "The es route preserves the same untranslated source drawing; Spanish/external and embedded audio, authoritative all-frame RMSE, and human/owner acceptance remain unresolved.",
    ]),
  }),
});

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

export function validateLocalBaseUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("--base-url must use http or https");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error("--base-url must resolve to localhost, 127.0.0.1, or ::1");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("--base-url cannot include credentials, a query, or a fragment");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  return parsed.toString().replace(/\/$/, "");
}

export function parseArguments(argv) {
  const options = {baseUrl: defaultBaseUrl, ids: [], help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      if (!argv[index + 1]) throw new Error("--base-url requires a value");
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (value === "--id") {
      if (!argv[index + 1]) throw new Error("--id requires a value");
      options.ids.push(...argv[index + 1].split(",").filter(Boolean));
      index += 1;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  options.baseUrl = validateLocalBaseUrl(options.baseUrl);
  if (!options.ids.length) options.ids = Object.keys(COURSE_CANDIDATE_QA_CONFIGS);
  options.ids = [...new Set(options.ids)];
  for (const id of options.ids) {
    if (!COURSE_CANDIDATE_QA_CONFIGS[id]) throw new Error(`Unsupported candidate animation: ${id}`);
  }
  return options;
}

export function validateCandidateConfig(config) {
  const errors = [];
  if (!config || COURSE_CANDIDATE_QA_CONFIGS[config.animationId] !== config) errors.push("config is not registered");
  if (!sha256Pattern.test(config?.source?.sha256 || "")) errors.push("source SHA-256 is invalid");
  if (!config?.source?.path?.startsWith("source-assets/flash/HELP MATH_ORIGINAL FILES/")) errors.push("source path is outside the frozen archive");
  if (!config?.frameDomain || config.frameDomain === "root") errors.push("nested frameDomain is required");
  if (!Number.isInteger(config?.rootFrame) || config.rootFrame < 1) errors.push("rootFrame is invalid");
  if (!Number.isInteger(config?.frameCount) || config.frameCount < 1) errors.push("frameCount is invalid");
  if (!Array.isArray(config?.readyCases) || config.readyCases.length < 1) errors.push("readyCases are required");
  for (const item of config?.readyCases || []) {
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > config.frameCount) errors.push(`ready frame is invalid: ${item.frame}`);
    if (!item.scenario || !Number.isSafeInteger(item.seed)) errors.push("ready scenario/seed is invalid");
    if (item.lang !== undefined && !["en", "es"].includes(item.lang)) errors.push("ready language is invalid");
  }
  for (const item of config?.rootReadyCases || []) {
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > 10) errors.push(`root ready frame is invalid: ${item.frame}`);
    if (item.frameDomain !== "root" || item.rootFrame !== item.frame) errors.push("root ready domain/frame identity is invalid");
    if (item.scenario !== "root-standalone" || item.lang !== "en" || !Number.isSafeInteger(item.seed)) errors.push("root ready scenario/language/seed is invalid");
    if (!item.assetPath?.startsWith(`/flash-assets/courses/${config.animationId}/root-frames/`)) errors.push("root ready asset path is invalid");
    if (!sha256Pattern.test(item.assetSha256 || "")) errors.push("root ready asset hash is invalid");
  }
  if (config?.rootSpanishCase) {
    const item = config.rootSpanishCase;
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > 10) errors.push("root Spanish blocked frame is invalid");
    if (item.frameDomain !== "root" || item.rootFrame !== item.frame || item.scenario !== "root-standalone") errors.push("root Spanish blocked identity is invalid");
    if (!Number.isSafeInteger(item.seed) || !item.reason) errors.push("root Spanish fail-closed case is invalid");
  }
  if (config?.rootSpanishReadyCase) {
    const item = config.rootSpanishReadyCase;
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > 10) errors.push("root Spanish ready frame is invalid");
    if (
      item.frameDomain !== "root"
      || item.rootFrame !== item.frame
      || item.scenario !== "root-standalone"
      || item.lang !== "es"
      || !Number.isSafeInteger(item.seed)
    ) errors.push("root Spanish ready identity is invalid");
    if (!item.assetPath?.startsWith(`/flash-assets/courses/${config.animationId}/root-frames/`)) errors.push("root Spanish ready asset path is invalid");
    if (!sha256Pattern.test(item.assetSha256 || "")) errors.push("root Spanish ready asset hash is invalid");
    if (
      item.classification !== "source-shared-untranslated-visual"
      || item.visualLocalizationStatus !== "source-shared-untranslated-visual"
    ) errors.push("root Spanish ready classification must remain untranslated");
    if (item.audioLocalizationStatus !== "unresolved" || item.audioRendered !== false) {
      errors.push("root Spanish ready audio must remain unresolved and unrendered");
    }
  }
  const hasRootStructuralCases = Boolean(config?.rootReadyCases?.length);
  const hasRootSpanishBlockedCase = Boolean(config?.rootSpanishCase);
  const hasRootSpanishReadyCase = Boolean(config?.rootSpanishReadyCase);
  if (
    (hasRootStructuralCases && hasRootSpanishBlockedCase === hasRootSpanishReadyCase)
    || (!hasRootStructuralCases && (hasRootSpanishBlockedCase || hasRootSpanishReadyCase))
  ) {
    errors.push("root structural QA must pair English ready cases with exactly one Spanish blocked or source-shared ready case");
  }
  const hasSpanishBlockedCase = Boolean(config?.spanishCase);
  const hasSpanishReadyCase = Boolean(config?.spanishReadyCase);
  if (hasSpanishBlockedCase === hasSpanishReadyCase) errors.push("Spanish disposition must define exactly one blocked or ready case");
  if (hasSpanishBlockedCase) {
    const item = config.spanishCase;
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > config.frameCount) errors.push("Spanish blocked frame is invalid");
    if (!item.scenario || !Number.isSafeInteger(item.seed) || !item.reason) errors.push("Spanish fail-closed case is invalid");
  }
  if (hasSpanishReadyCase) {
    const item = config.spanishReadyCase;
    if (!Number.isInteger(item.frame) || item.frame < 1 || item.frame > config.frameCount) errors.push("Spanish ready frame is invalid");
    if (!item.scenario || !Number.isSafeInteger(item.seed) || item.lang !== "es") errors.push("Spanish ready scenario/language/seed is invalid");
    if (item.classification !== "source-shared-untranslated-visual") errors.push("Spanish ready classification must remain untranslated");
    if (item.visualLocalizationStatus !== "source-shared-untranslated-visual") errors.push("Spanish ready visual evidence boundary is invalid");
    if (item.audioLocalizationStatus !== "unresolved" || typeof item.audioRendered !== "boolean") errors.push("Spanish ready audio disposition is invalid");
  }
  const audioAssets = config?.audioAssets || [];
  if (!Array.isArray(audioAssets)) errors.push("audioAssets must be an array");
  for (const asset of audioAssets) {
    if (!asset?.cueId || !asset?.path?.startsWith(`/flash-assets/courses/${config.animationId}/audio/`)) errors.push("audio asset identity/path is invalid");
    if (!sha256Pattern.test(asset?.sha256 || "") || !Number.isSafeInteger(asset?.bytes) || asset.bytes < 1) errors.push("audio asset hash/bytes are invalid");
  }
  if (config?.audioRuntime) {
    const runtime = config.audioRuntime;
    if (!audioAssets.length || !audioAssets.some(({path: assetPath}) => assetPath === runtime.source)) errors.push("audio runtime source is not registered");
    if (!runtime.scenario || !Number.isSafeInteger(runtime.seed)) errors.push("audio runtime scenario/seed is invalid");
    if (!Number.isSafeInteger(runtime.startFrame) || !Number.isSafeInteger(runtime.endFrame) || runtime.startFrame < 1 || runtime.endFrame <= runtime.startFrame || runtime.endFrame > config.frameCount) errors.push("audio runtime frame boundary is invalid");
  } else if (audioAssets.length) {
    errors.push("audioRuntime is required when audio assets are registered");
  }
  if (hasSpanishReadyCase && config.spanishReadyCase.audioRendered && !audioAssets.length) errors.push("rendered Spanish audio must bind registered assets");
  if ((config?.hostBlockedCases?.length || 0) === 0 && !config?.hostUnaddressableReason) errors.push("host blocker must be tested or explicitly unaddressable");
  if ((config?.hostBlockedCases?.length || 0) > 0 && config?.hostUnaddressableReason) errors.push("host blocker cannot be both addressable and unaddressable");
  return errors;
}

function usage() {
  return [
    "Usage: node scripts/qa-course-candidates.mjs [--base-url http://localhost:3213] [--id <animation-id>[,<animation-id>...]]",
    "Without --id, all five configured course candidates are checked and their QA reports are regenerated.",
  ].join("\n");
}

function makeIdentity(config, {frame, frameDomain, rootFrame, scenario, lang, seed}, purpose) {
  const resolvedFrameDomain = frameDomain ?? config.frameDomain;
  const resolvedRootFrame = rootFrame ?? config.rootFrame;
  const traceId = `qa-${purpose}-${scenario}-${resolvedFrameDomain}-${lang}`;
  return {
    frame,
    frameDomain: resolvedFrameDomain,
    rootFrame: resolvedRootFrame,
    scenario,
    lang,
    seed,
    requirementId: `qa-${purpose}-${config.animationId}-${scenario}-${lang}`,
    traceId,
    entryStateSha256: sha256(JSON.stringify({animationId: config.animationId, purpose, frameDomain: resolvedFrameDomain, rootFrame: resolvedRootFrame, scenario, lang, seed})),
  };
}

export function buildCandidateUrl(baseUrl, config, request, {capture = false, purpose = "candidate"} = {}) {
  const identity = makeIdentity(config, request, purpose);
  const url = new URL(`/animations/${config.animationId}`, `${baseUrl}/`);
  url.searchParams.set("frameDomain", identity.frameDomain);
  if (identity.frame !== undefined && identity.frame !== null) url.searchParams.set("frame", String(identity.frame));
  url.searchParams.set("scenario", identity.scenario);
  url.searchParams.set("lang", identity.lang);
  url.searchParams.set("seed", String(identity.seed));
  url.searchParams.set("requirementId", identity.requirementId);
  url.searchParams.set("trace", identity.traceId);
  url.searchParams.set("entryStateSha256", identity.entryStateSha256);
  if (capture) url.searchParams.set("capture", "1");
  return {url: url.toString(), identity};
}

function createDiagnostics() {
  return {
    requestCount: 0,
    observedEndpoints: new Set(),
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
}

export function isAllowedLocalRequest(requestUrl, baseUrl) {
  const requested = new URL(requestUrl);
  if (["data:", "blob:", "about:"].includes(requested.protocol)) return true;
  if (!["http:", "https:", "ws:", "wss:"].includes(requested.protocol)) return false;
  const base = new URL(baseUrl);
  const requestedHost = requested.hostname.replace(/^\[|\]$/g, "");
  const baseHost = base.hostname.replace(/^\[|\]$/g, "");
  const requestedPort = requested.port || (["https:", "wss:"].includes(requested.protocol) ? "443" : "80");
  const basePort = base.port || (base.protocol === "https:" ? "443" : "80");
  return requestedHost === baseHost
    && requestedPort === basePort
    && ["localhost", "127.0.0.1", "::1"].includes(requestedHost);
}

function monitorPage(page, baseUrl, diagnostics) {
  page.on("console", (message) => {
    const record = {url: page.url(), text: message.text()};
    if (message.type() === "error") diagnostics.consoleErrors.push(record);
    if (message.type() === "warning") diagnostics.consoleWarnings.push(record);
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push({url: page.url(), text: error.message}));
  page.on("request", (request) => {
    diagnostics.requestCount += 1;
    const url = request.url();
    try {
      const parsed = new URL(url);
      if (["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)) diagnostics.observedEndpoints.add(parsed.host);
      if (!isAllowedLocalRequest(url, baseUrl)) diagnostics.unexpectedRequests.push(url);
    } catch {
      diagnostics.unexpectedRequests.push(url);
    }
  });
  page.on("requestfailed", (request) => diagnostics.failedRequests.push({url: request.url(), error: request.failure()?.errorText || "failed"}));
  page.on("response", (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push({url: response.url(), status: response.status()});
  });
}

function finishDiagnostics(diagnostics) {
  return {
    ...diagnostics,
    observedEndpoints: [...diagnostics.observedEndpoints].sort(),
  };
}

export function devOverlaySuppressionPass(record) {
  return record?.capturePageOnly === true
    && record?.styleInstalled === true
    && record?.after?.visibleControlCount === 0
    && (record?.after?.portalCount === 0 || record.after.hiddenPortalCount === record.after.portalCount);
}

async function inspectDevOverlay(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity || "1") !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const portals = [...document.querySelectorAll("nextjs-portal")];
    const controls = portals.flatMap((portal) => portal.shadowRoot
      ? [...portal.shadowRoot.querySelectorAll("[data-nextjs-dev-tools-button], #next-logo, [data-next-badge-root]")]
      : []);
    return {
      portalCount: portals.length,
      hiddenPortalCount: portals.filter((portal) => getComputedStyle(portal).display === "none").length,
      controlCount: controls.length,
      visibleControlCount: controls.filter(visible).length,
    };
  });
}

async function suppressDevOverlayForCapture(page) {
  const before = await inspectDevOverlay(page);
  const styleInstalled = await page.evaluate(({styleId, css}) => {
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.dataset.captureOnly = "true";
      document.head.appendChild(style);
    }
    style.textContent = css;
    for (const portal of document.querySelectorAll("nextjs-portal")) {
      portal.style.setProperty("display", "none", "important");
      portal.style.setProperty("visibility", "hidden", "important");
      portal.style.setProperty("opacity", "0", "important");
      portal.style.setProperty("pointer-events", "none", "important");
      portal.dataset.helpMathQaCaptureHidden = "true";
      const parentOverlay = portal.closest("script[data-nextjs-dev-overlay='true']");
      parentOverlay?.style.setProperty("display", "none", "important");
      for (const control of portal.shadowRoot?.querySelectorAll("[data-nextjs-dev-tools-button], #next-logo, [data-next-badge-root]") || []) {
        control.style.setProperty("display", "none", "important");
        control.setAttribute("aria-hidden", "true");
      }
    }
    return style.isConnected && style.dataset.captureOnly === "true" && style.textContent === css;
  }, {styleId: DEV_OVERLAY_CAPTURE_STYLE_ID, css: DEV_OVERLAY_CAPTURE_CSS});
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const after = await inspectDevOverlay(page);
  const result = {
    capturePageOnly: true,
    strategy: "capture-page-only CSS plus inline important styles hide the Next.js development overlay host and shadow controls before evidence capture",
    styleId: DEV_OVERLAY_CAPTURE_STYLE_ID,
    styleInstalled,
    before,
    after,
  };
  result.pass = devOverlaySuppressionPass(result);
  if (!result.pass) throw new Error(`Next.js development overlay remained visible before capture: ${JSON.stringify(result)}`);
  return result;
}

async function capturePng(page, locator, destination) {
  const devOverlaySuppression = await suppressDevOverlayForCapture(page);
  await mkdir(path.dirname(destination), {recursive: true});
  await locator.screenshot({path: destination, animations: "disabled"});
  const bytes = await readFile(destination);
  const png = PNG.sync.read(bytes);
  return {path: portable(destination), sha256: sha256(bytes), width: png.width, height: png.height, devOverlaySuppression};
}

async function fileRecord(relativePath) {
  const absolute = path.resolve(projectRoot, relativePath);
  const bytes = await readFile(absolute);
  return {path: relativePath, sha256: sha256(bytes), bytes: bytes.length, absolute, data: bytes};
}

async function readStageState(page) {
  return page.evaluate(() => {
    const runtime = document.querySelector(".runtime-stage");
    const candidate = document.querySelector("[data-candidate-status]");
    const wrap = document.querySelector(".faithful-stage-wrap");
    const canvas = wrap?.querySelector("canvas");
    const rootImage = wrap?.querySelector("img[data-root-visual-authority]");
    const rect = wrap?.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const rootImageRect = rootImage?.getBoundingClientRect();
    const replay = document.querySelector(".runtime-toolbar__actions [data-replay-keyboard]");
    return {
      runtime: {
        animationId: runtime?.getAttribute("data-animation-id") || null,
        frame: runtime?.getAttribute("data-flash-frame") || null,
        frameDomain: runtime?.getAttribute("data-flash-frame-domain") || null,
        rootFrame: runtime?.getAttribute("data-flash-root-frame") || null,
        requirementId: runtime?.getAttribute("data-flash-requirement-id") || null,
        traceId: runtime?.getAttribute("data-flash-trace-id") || null,
        entryStateSha256: runtime?.getAttribute("data-flash-entry-state-sha256") || null,
        scenario: runtime?.getAttribute("data-runtime-scenario") || null,
        language: runtime?.getAttribute("data-runtime-language") || null,
        seed: runtime?.getAttribute("data-runtime-seed") || null,
      },
      renderer: {
        frame: wrap?.getAttribute("data-flash-frame") || null,
        frameDomain: wrap?.getAttribute("data-flash-frame-domain") || null,
        rootFrame: wrap?.getAttribute("data-flash-root-frame") || null,
        scenario: wrap?.getAttribute("data-runtime-scenario") || null,
        language: wrap?.getAttribute("data-runtime-language") || null,
        seed: wrap?.getAttribute("data-runtime-seed") || null,
        canvasStatus: wrap?.getAttribute("data-canvas-status") || null,
      },
      candidate: {
        status: candidate?.getAttribute("data-candidate-status") || null,
        canvasStatus: candidate?.getAttribute("data-canvas-status") || null,
        visualLocalizationStatus: candidate?.getAttribute("data-visual-localization-status") || null,
        audioLocalizationStatus: candidate?.getAttribute("data-audio-localization-status") || null,
        audioRendered: candidate?.getAttribute("data-audio-rendered") || null,
      },
      canvas: canvas ? {
        frame: canvas.getAttribute("data-flash-frame"),
        frameDomain: canvas.getAttribute("data-flash-frame-domain"),
        rootFrame: canvas.getAttribute("data-flash-root-frame"),
        scenario: canvas.getAttribute("data-runtime-scenario"),
        seed: canvas.getAttribute("data-runtime-seed"),
        width: canvas.width,
        height: canvas.height,
        role: canvas.getAttribute("role"),
        accessibleName: canvas.getAttribute("aria-label"),
        css: canvasRect ? {x: canvasRect.x, right: canvasRect.right, width: canvasRect.width, height: canvasRect.height} : null,
      } : null,
      rootImage: rootImage ? {
        frame: rootImage.getAttribute("data-flash-frame"),
        frameDomain: rootImage.getAttribute("data-flash-frame-domain"),
        rootFrame: rootImage.getAttribute("data-flash-root-frame"),
        scenario: rootImage.getAttribute("data-runtime-scenario"),
        language: rootImage.getAttribute("data-runtime-language"),
        seed: rootImage.getAttribute("data-runtime-seed"),
        requirementId: rootImage.getAttribute("data-flash-requirement-id"),
        traceId: rootImage.getAttribute("data-flash-trace-id"),
        entryStateSha256: rootImage.getAttribute("data-flash-entry-state-sha256"),
        assetSha256: rootImage.getAttribute("data-root-frame-sha256"),
        visualAuthority: rootImage.getAttribute("data-root-visual-authority"),
        originalRuntimeBaselineComplete: rootImage.getAttribute("data-original-runtime-baseline-complete"),
        alt: rootImage.getAttribute("alt"),
        complete: rootImage.complete,
        naturalWidth: rootImage.naturalWidth,
        naturalHeight: rootImage.naturalHeight,
        css: rootImageRect ? {x: rootImageRect.x, right: rootImageRect.right, width: rootImageRect.width, height: rootImageRect.height} : null,
      } : null,
      layout: rect ? {x: rect.x, right: rect.right, width: rect.width, height: rect.height} : null,
      document: {clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth},
      candidateAccessibleName: candidate?.getAttribute("aria-label") || null,
      replay: replay ? {
        accessibleName: replay.getAttribute("aria-label") || replay.textContent?.trim() || null,
        keyboardContract: replay.getAttribute("data-replay-keyboard"),
      } : null,
    };
  });
}

function matchesIdentity(state, identity, config, {canvasRequired = true} = {}) {
  const expected = {
    frame: String(identity.frame),
    frameDomain: identity.frameDomain,
    rootFrame: String(identity.rootFrame),
    scenario: identity.scenario,
    language: identity.lang,
    seed: String(identity.seed >>> 0),
  };
  const runtimeMatches = state.runtime.animationId === config.animationId
    && state.runtime.frame === expected.frame
    && state.runtime.frameDomain === expected.frameDomain
    && state.runtime.rootFrame === expected.rootFrame
    && state.runtime.scenario === expected.scenario
    && state.runtime.language === expected.language
    && state.runtime.seed === expected.seed
    && state.runtime.requirementId === identity.requirementId
    && state.runtime.traceId === identity.traceId
    && state.runtime.entryStateSha256 === identity.entryStateSha256;
  const rendererMatches = state.renderer.frame === expected.frame
    && state.renderer.frameDomain === expected.frameDomain
    && state.renderer.rootFrame === expected.rootFrame
    && state.renderer.scenario === expected.scenario
    && state.renderer.language === expected.language
    && state.renderer.seed === expected.seed;
  const canvasMatches = !canvasRequired || Boolean(state.canvas
    && state.canvas.frame === expected.frame
    && state.canvas.frameDomain === expected.frameDomain
    && state.canvas.rootFrame === expected.rootFrame
    && state.canvas.scenario === expected.scenario
    && state.canvas.seed === expected.seed);
  return runtimeMatches && rendererMatches && canvasMatches;
}

async function waitForReadyStage(page, identity, config) {
  const stage = page.locator(".faithful-stage-wrap").first();
  await stage.waitFor({state: "visible", timeout: 45_000});
  await page.waitForFunction(
    ({animationId, frame, frameDomain, rootFrame, scenario, lang, seed, requirementId, traceId, entryStateSha256}) => {
      const runtime = document.querySelector(".runtime-stage");
      const wrap = document.querySelector(".faithful-stage-wrap");
      const canvas = wrap?.querySelector("canvas");
      return runtime?.getAttribute("data-animation-id") === animationId
        && runtime?.getAttribute("data-flash-frame") === String(frame)
        && runtime?.getAttribute("data-flash-frame-domain") === frameDomain
        && runtime?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && runtime?.getAttribute("data-flash-requirement-id") === requirementId
        && runtime?.getAttribute("data-flash-trace-id") === traceId
        && runtime?.getAttribute("data-flash-entry-state-sha256") === entryStateSha256
        && runtime?.getAttribute("data-runtime-scenario") === scenario
        && runtime?.getAttribute("data-runtime-language") === lang
        && runtime?.getAttribute("data-runtime-seed") === String(seed >>> 0)
        && wrap?.getAttribute("data-canvas-status") === "ready"
        && wrap?.getAttribute("data-flash-frame") === String(frame)
        && wrap?.getAttribute("data-flash-frame-domain") === frameDomain
        && wrap?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && wrap?.getAttribute("data-runtime-language") === lang
        && wrap?.getAttribute("data-runtime-scenario") === scenario
        && wrap?.getAttribute("data-runtime-seed") === String(seed >>> 0)
        && canvas?.getAttribute("data-flash-frame") === String(frame)
        && canvas?.getAttribute("data-flash-frame-domain") === frameDomain
        && canvas?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && canvas?.getAttribute("data-runtime-scenario") === scenario
        && canvas?.getAttribute("data-runtime-seed") === String(seed >>> 0);
    },
    {...identity, animationId: config.animationId, rootFrame: config.rootFrame},
    {timeout: 45_000},
  );
  return stage;
}

async function deterministicCase(page, baseUrl, config, testCase, screenshotRoot, index) {
  const request = {...testCase, lang: testCase.lang ?? "en"};
  const {url, identity} = buildCandidateUrl(baseUrl, config, request, {capture: true, purpose: `ready-${index + 1}`});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  const stage = await waitForReadyStage(page, identity, config);
  const before = await readStageState(page);
  await page.waitForTimeout(300);
  const after = await readStageState(page);
  const capture = await capturePng(page, stage, path.join(screenshotRoot, `native-${request.lang}-${testCase.scenario}-frame-${String(testCase.frame).padStart(4, "0")}.png`));
  return {
    requested: identity,
    before,
    after,
    frozen: matchesIdentity(before, identity, config) && matchesIdentity(after, identity, config),
    ready: before.renderer.canvasStatus === "ready"
      && before.candidate.canvasStatus === "ready"
      && after.renderer.canvasStatus === "ready"
      && after.candidate.canvasStatus === "ready",
    nativeStage: before.layout?.width === 800 && before.layout?.height === 600
      && before.canvas?.width === 800 && before.canvas?.height === 600,
    accessible: Boolean(before.candidateAccessibleName && before.canvas?.role === "img" && before.canvas?.accessibleName && before.replay?.accessibleName),
    capture,
  };
}

async function structuralRootCase(page, baseUrl, config, testCase, screenshotRoot, index) {
  const {url, identity} = buildCandidateUrl(baseUrl, config, testCase, {
    capture: true,
    purpose: `root-ready-${index + 1}`,
  });
  await page.goto(url, {waitUntil: "domcontentloaded"});
  const stage = page.locator(".faithful-stage-wrap").first();
  await stage.waitFor({state: "visible", timeout: 45_000});
  await page.waitForFunction(
    ({animationId, frame, frameDomain, rootFrame, scenario, lang, seed, requirementId, traceId, entryStateSha256, assetSha256}) => {
      const runtime = document.querySelector(".runtime-stage");
      const wrap = document.querySelector(".faithful-stage-wrap");
      const image = wrap?.querySelector("img[data-root-visual-authority]");
      return runtime?.getAttribute("data-animation-id") === animationId
        && runtime?.getAttribute("data-flash-frame") === String(frame)
        && runtime?.getAttribute("data-flash-frame-domain") === frameDomain
        && runtime?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && runtime?.getAttribute("data-flash-requirement-id") === requirementId
        && runtime?.getAttribute("data-flash-trace-id") === traceId
        && runtime?.getAttribute("data-flash-entry-state-sha256") === entryStateSha256
        && runtime?.getAttribute("data-runtime-scenario") === scenario
        && runtime?.getAttribute("data-runtime-language") === lang
        && runtime?.getAttribute("data-runtime-seed") === String(seed >>> 0)
        && wrap?.getAttribute("data-canvas-status") === "root-ffdec-structural-frame"
        && wrap?.getAttribute("data-flash-frame") === String(frame)
        && wrap?.getAttribute("data-flash-frame-domain") === frameDomain
        && wrap?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && image?.getAttribute("data-flash-frame") === String(frame)
        && image?.getAttribute("data-flash-frame-domain") === frameDomain
        && image?.getAttribute("data-flash-root-frame") === String(rootFrame)
        && image?.getAttribute("data-flash-requirement-id") === requirementId
        && image?.getAttribute("data-flash-trace-id") === traceId
        && image?.getAttribute("data-flash-entry-state-sha256") === entryStateSha256
        && image?.getAttribute("data-runtime-scenario") === scenario
        && image?.getAttribute("data-runtime-language") === lang
        && image?.getAttribute("data-runtime-seed") === String(seed >>> 0)
        && image?.getAttribute("data-root-frame-sha256") === assetSha256
        && image?.getAttribute("data-root-visual-authority") === "ffdec-static-root-timeline-structural-render-not-original-runtime"
        && image?.getAttribute("data-original-runtime-baseline-complete") === "false"
        && image.complete
        && image.naturalWidth === 800
        && image.naturalHeight === 600;
    },
    {...identity, animationId: config.animationId, assetSha256: testCase.assetSha256},
    {timeout: 45_000},
  );
  const before = await readStageState(page);
  await page.waitForTimeout(300);
  const after = await readStageState(page);
  const response = await page.context().request.get(`${baseUrl}${testCase.assetPath}`);
  const httpBytes = await response.body();
  const http = {
    status: response.status(),
    contentType: response.headers()["content-type"] || null,
    bytes: httpBytes.length,
    sha256: sha256(httpBytes),
  };
  const capture = await capturePng(
    page,
    stage,
    path.join(screenshotRoot, `root-native-${identity.lang}-frame-${String(testCase.frame).padStart(4, "0")}.png`),
  );
  const imageMatches = (value) => Boolean(value.rootImage
    && value.rootImage.frame === String(identity.frame)
    && value.rootImage.frameDomain === identity.frameDomain
    && value.rootImage.rootFrame === String(identity.rootFrame)
    && value.rootImage.scenario === identity.scenario
    && value.rootImage.language === identity.lang
    && value.rootImage.seed === String(identity.seed >>> 0)
    && value.rootImage.requirementId === identity.requirementId
    && value.rootImage.traceId === identity.traceId
    && value.rootImage.entryStateSha256 === identity.entryStateSha256
    && value.rootImage.assetSha256 === testCase.assetSha256
    && value.rootImage.visualAuthority === "ffdec-static-root-timeline-structural-render-not-original-runtime"
    && value.rootImage.originalRuntimeBaselineComplete === "false"
    && value.rootImage.complete === true
    && value.rootImage.naturalWidth === 800
    && value.rootImage.naturalHeight === 600
    && value.rootImage.alt);
  return {
    requested: identity,
    expectedAsset: {path: `public${testCase.assetPath}`, sha256: testCase.assetSha256},
    before,
    after,
    frozen: matchesIdentity(before, identity, config, {canvasRequired: false})
      && matchesIdentity(after, identity, config, {canvasRequired: false})
      && imageMatches(before)
      && imageMatches(after),
    ready: before.renderer.canvasStatus === "root-ffdec-structural-frame"
      && after.renderer.canvasStatus === "root-ffdec-structural-frame",
    nativeStage: before.layout?.width === 800 && before.layout?.height === 600
      && before.rootImage?.naturalWidth === 800 && before.rootImage?.naturalHeight === 600,
    accessible: Boolean(before.candidateAccessibleName && before.rootImage?.alt && before.replay?.accessibleName),
    assetHttp: http,
    assetHttpPass: http.status === 200
      && http.sha256 === testCase.assetSha256
      && /^image\/png(?:;|$)/i.test(http.contentType || ""),
    originalRuntimeBaselineClaimed: false,
    capture,
  };
}

async function blockedCase(browser, baseUrl, config, testCase, lang, screenshotRoot, purpose, takeScreenshot) {
  const diagnostics = createDiagnostics();
  const context = await browser.newContext({viewport: {width: 1200, height: 900}, deviceScaleFactor: 1, reducedMotion: "no-preference"});
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {...testCase, lang};
  const {url, identity} = buildCandidateUrl(baseUrl, config, request, {capture: true, purpose});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  const stage = page.locator(".faithful-stage-wrap").first();
  await stage.waitFor({state: "visible", timeout: 30_000});
  const status = page.locator(`[data-fail-closed-reason="${testCase.reason}"]`).first();
  await status.waitFor({state: "visible", timeout: 30_000});
  await page.waitForLoadState("networkidle");
  const state = await readStageState(page);
  const blocked = {
    requested: identity,
    reason: await status.getAttribute("data-fail-closed-reason"),
    role: await status.getAttribute("role"),
    ariaLive: await status.getAttribute("aria-live"),
    text: (await status.textContent())?.replace(/\s+/g, " ").trim() || "",
    state,
    canvasCount: await stage.locator("canvas").count(),
    assetScriptCount: await page.locator(`script[data-help-math-canvas-asset="${config.animationId}"]`).count(),
    assetNetworkRequestCount: diagnostics.requestCount === 0 ? 0 : [...diagnostics.observedEndpoints].length >= 0
      ? await page.evaluate((animationId) => performance.getEntriesByType("resource").filter((entry) => entry.name.includes(`/flash-assets/courses/${animationId}/`)).length, config.animationId)
      : null,
    capture: takeScreenshot ? await capturePng(page, stage, path.join(screenshotRoot, `${purpose}-${testCase.scenario}-${lang}.png`)) : null,
  };
  blocked.pass = matchesIdentity(state, identity, config, {canvasRequired: false})
    && state.renderer.canvasStatus === "blocked"
    && blocked.reason === testCase.reason
    && blocked.role === "status"
    && blocked.ariaLive === "polite"
    && blocked.text.length > 0
    && blocked.canvasCount === 0
    && blocked.assetScriptCount === 0
    && blocked.assetNetworkRequestCount === 0;
  const finished = finishDiagnostics(diagnostics);
  await context.close();
  return {blocked, diagnostics: finished};
}

async function activateReplay(browser, baseUrl, config, input) {
  const diagnostics = createDiagnostics();
  const context = await browser.newContext({viewport: {width: 1280, height: 1000}, deviceScaleFactor: 1, reducedMotion: "no-preference"});
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: null, scenario: config.replay.scenario, lang: "en", seed: config.replay.seed};
  const {url, identity} = buildCandidateUrl(baseUrl, config, request, {purpose: `replay-${input}`});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  await page.locator(".faithful-stage-wrap").waitFor({state: "visible", timeout: 30_000});
  await page.waitForFunction(
    ({canAdvance}) => {
      const wrap = document.querySelector(".faithful-stage-wrap");
      const frame = Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame"));
      return wrap?.getAttribute("data-canvas-status") === "ready" && (canAdvance ? frame >= 3 : frame === 1);
    },
    {canAdvance: config.replay.canAdvance},
    {timeout: 45_000},
  );
  const button = page.locator(".runtime-toolbar__actions [data-replay-keyboard='enter-space']").first();
  const before = await page.evaluate(() => {
    const stage = document.querySelector(".runtime-stage");
    return {
      replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
      frame: Number(stage?.getAttribute("data-flash-frame")),
      frameDomain: stage?.getAttribute("data-flash-frame-domain") || null,
      rootFrame: stage?.getAttribute("data-flash-root-frame") || null,
      requirementId: stage?.getAttribute("data-flash-requirement-id") || null,
      traceId: stage?.getAttribute("data-flash-trace-id") || null,
      entryStateSha256: stage?.getAttribute("data-flash-entry-state-sha256") || null,
      scenario: stage?.getAttribute("data-runtime-scenario") || null,
      language: stage?.getAttribute("data-runtime-language") || null,
      seed: stage?.getAttribute("data-runtime-seed") || null,
    };
  });
  await page.evaluate(() => {
    const shell = document.querySelector(".runtime-shell");
    const stage = document.querySelector(".runtime-stage");
    const events = [];
    const record = () => events.push({
      replay: Number(shell?.getAttribute("data-runtime-replay")),
      frame: Number(stage?.getAttribute("data-flash-frame")),
      frameDomain: stage?.getAttribute("data-flash-frame-domain") || null,
      rootFrame: stage?.getAttribute("data-flash-root-frame") || null,
      requirementId: stage?.getAttribute("data-flash-requirement-id") || null,
      traceId: stage?.getAttribute("data-flash-trace-id") || null,
      entryStateSha256: stage?.getAttribute("data-flash-entry-state-sha256") || null,
      scenario: stage?.getAttribute("data-runtime-scenario") || null,
      language: stage?.getAttribute("data-runtime-language") || null,
      seed: stage?.getAttribute("data-runtime-seed") || null,
      at: performance.now(),
    });
    record();
    const observer = new MutationObserver(record);
    if (shell) observer.observe(shell, {attributes: true, attributeFilter: ["data-runtime-replay"]});
    if (stage) observer.observe(stage, {attributes: true, attributeFilter: ["data-flash-frame"]});
    window.__HELP_MATH_CANDIDATE_QA_REPLAY__ = {events, observer};
  });
  await button.focus();
  if (input === "pointer") await button.click();
  else await page.keyboard.press(input === "enter" ? "Enter" : "Space");
  await page.waitForFunction(
    (expected) => Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")) === expected,
    before.replay + 1,
    {timeout: 10_000},
  );
  if (config.replay.canAdvance) {
    await page.waitForFunction(() => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= 2, undefined, {timeout: 10_000});
  } else {
    await page.waitForTimeout(250);
  }
  const after = await page.evaluate(() => {
    const recorder = window.__HELP_MATH_CANDIDATE_QA_REPLAY__;
    recorder?.observer?.disconnect();
    const stage = document.querySelector(".runtime-stage");
    return {
      replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
      frame: Number(stage?.getAttribute("data-flash-frame")),
      frameDomain: stage?.getAttribute("data-flash-frame-domain") || null,
      rootFrame: stage?.getAttribute("data-flash-root-frame") || null,
      requirementId: stage?.getAttribute("data-flash-requirement-id") || null,
      traceId: stage?.getAttribute("data-flash-trace-id") || null,
      entryStateSha256: stage?.getAttribute("data-flash-entry-state-sha256") || null,
      scenario: stage?.getAttribute("data-runtime-scenario") || null,
      language: stage?.getAttribute("data-runtime-language") || null,
      seed: stage?.getAttribute("data-runtime-seed") || null,
      events: recorder?.events || [],
    };
  });
  const accessibleName = (await button.getAttribute("aria-label")) || (await button.textContent())?.trim() || "";
  const keyboardContract = await button.getAttribute("data-replay-keyboard");
  const identityMatches = (value) => value.frameDomain === config.frameDomain
    && value.rootFrame === String(config.rootFrame)
    && value.requirementId === identity.requirementId
    && value.traceId === identity.traceId
    && value.entryStateSha256 === identity.entryStateSha256
    && value.scenario === identity.scenario
    && value.language === identity.lang
    && value.seed === String(identity.seed >>> 0);
  const resetObserved = after.events.some((event) => event.replay === before.replay + 1 && event.frame === 1 && identityMatches(event));
  const result = {
    input,
    requestedIdentity: identity,
    before,
    after,
    accessibleName,
    keyboardContract,
    pass: after.replay === before.replay + 1
      && resetObserved
      && identityMatches(before)
      && identityMatches(after)
      && accessibleName.length > 0
      && keyboardContract === "enter-space"
      && (config.replay.canAdvance ? after.frame >= 2 : after.frame === 1),
  };
  const finished = finishDiagnostics(diagnostics);
  await context.close();
  return {result, diagnostics: finished};
}

async function audioRuntimeCheck(browser, baseUrl, config) {
  if (!config.audioRuntime) return null;
  const diagnostics = createDiagnostics();
  const context = await browser.newContext({viewport: {width: 1280, height: 1000}, deviceScaleFactor: 1, reducedMotion: "no-preference"});
  await context.addInitScript(() => {
    const qa = {nextId: 1, events: []};
    const record = (type, instance, value = null) => qa.events.push({
      type,
      id: instance.id,
      source: instance.src,
      currentTime: instance._currentTime,
      value,
      at: performance.now(),
    });
    class HelpMathQaAudio {
      constructor(source) {
        this.id = qa.nextId++;
        this.src = String(source);
        this._currentTime = 0;
        record("create", this);
      }
      get currentTime() { return this._currentTime; }
      set currentTime(value) {
        this._currentTime = Number(value);
        record("currentTime", this, this._currentTime);
      }
      addEventListener(type) { record("listener", this, type); }
      pause() { record("pause", this); }
      play() {
        record("play", this);
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "__HELP_MATH_AUDIO_QA__", {value: qa, configurable: true});
    Object.defineProperty(window, "Audio", {value: HelpMathQaAudio, configurable: true, writable: true});
  });
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const runtime = config.audioRuntime;
  const request = {frame: null, scenario: runtime.scenario, lang: "en", seed: runtime.seed};
  const {url, identity} = buildCandidateUrl(baseUrl, config, request, {purpose: "audio-runtime"});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  await page.locator(".faithful-stage-wrap").waitFor({state: "visible", timeout: 30_000});
  await page.waitForFunction(
    ({startFrame, source}) => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= startFrame
      && window.__HELP_MATH_AUDIO_QA__?.events.some((event) => event.type === "play" && event.source.endsWith(source)),
    {startFrame: runtime.startFrame, source: runtime.source},
    {timeout: 30_000},
  );
  const beforeReplay = await page.evaluate(() => ({
    replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
    events: structuredClone(window.__HELP_MATH_AUDIO_QA__?.events || []),
  }));
  await page.locator(".runtime-toolbar__actions [data-replay-keyboard='enter-space']").first().click();
  await page.waitForFunction(
    ({startFrame, source}) => Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")) === 1
      && Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= startFrame
      && window.__HELP_MATH_AUDIO_QA__?.events.filter((event) => event.type === "play" && event.source.endsWith(source)).length >= 2,
    {startFrame: runtime.startFrame, source: runtime.source},
    {timeout: 30_000},
  );
  const afterReplayStart = await page.evaluate(() => ({
    replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
    events: structuredClone(window.__HELP_MATH_AUDIO_QA__?.events || []),
  }));
  await page.waitForFunction(
    ({endFrame, source}) => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= endFrame
      && (() => {
        const events = window.__HELP_MATH_AUDIO_QA__?.events || [];
        const matchingCreates = events.filter((event) => event.type === "create" && event.source.endsWith(source));
        const replayInstance = matchingCreates.at(-1)?.id;
        return replayInstance !== undefined
          && events.some((event) => event.type === "pause" && event.id === replayInstance)
          && events.some((event) => event.type === "currentTime" && event.id === replayInstance && event.value === 0);
      })(),
    {endFrame: runtime.endFrame, source: runtime.source},
    {timeout: 30_000},
  );
  const afterBoundary = await page.evaluate(() => ({
    replay: Number(document.querySelector(".runtime-shell")?.getAttribute("data-runtime-replay")),
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
    frameDomain: document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame-domain") || null,
    scenario: document.querySelector(".runtime-stage")?.getAttribute("data-runtime-scenario") || null,
    language: document.querySelector(".runtime-stage")?.getAttribute("data-runtime-language") || null,
    seed: document.querySelector(".runtime-stage")?.getAttribute("data-runtime-seed") || null,
    events: structuredClone(window.__HELP_MATH_AUDIO_QA__?.events || []),
  }));
  const creates = afterBoundary.events.filter((event) => event.type === "create" && event.source.endsWith(runtime.source));
  const firstId = creates[0]?.id;
  const replayId = creates[1]?.id;
  const wasReset = (id) => id !== undefined
    && afterBoundary.events.some((event) => event.type === "pause" && event.id === id)
    && afterBoundary.events.some((event) => event.type === "currentTime" && event.id === id && event.value === 0);
  const primaryPass = beforeReplay.replay === 0
    && beforeReplay.frame >= runtime.startFrame
    && afterReplayStart.replay === 1
    && afterReplayStart.frame >= runtime.startFrame
    && creates.length === 2
    && wasReset(firstId)
    && wasReset(replayId)
    && afterBoundary.frame >= runtime.endFrame
    && afterBoundary.frameDomain === config.frameDomain
    && afterBoundary.scenario === identity.scenario
    && afterBoundary.language === identity.lang
    && afterBoundary.seed === String(identity.seed >>> 0);

  const seedRequest = {frame: null, scenario: "sound-from-seed", lang: "en", seed: 1};
  const {url: seedUrl} = buildCandidateUrl(baseUrl, config, seedRequest, {purpose: "audio-seed-odd"});
  await page.goto(seedUrl, {waitUntil: "domcontentloaded"});
  await page.locator(".faithful-stage-wrap").waitFor({state: "visible", timeout: 30_000});
  const oddAsset = config.audioAssets[1];
  await page.waitForFunction(
    ({startFrame, source}) => Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")) >= startFrame
      && window.__HELP_MATH_AUDIO_QA__?.events.some((event) => event.type === "play" && event.source.endsWith(source)),
    {startFrame: runtime.startFrame, source: oddAsset.path},
    {timeout: 30_000},
  );
  const seedOdd = await page.evaluate(() => ({
    frame: Number(document.querySelector(".runtime-stage")?.getAttribute("data-flash-frame")),
    scenario: document.querySelector(".runtime-stage")?.getAttribute("data-runtime-scenario") || null,
    seed: document.querySelector(".runtime-stage")?.getAttribute("data-runtime-seed") || null,
    events: structuredClone(window.__HELP_MATH_AUDIO_QA__?.events || []),
  }));
  const seedOddPass = seedOdd.frame >= runtime.startFrame
    && seedOdd.scenario === "sound-from-seed"
    && seedOdd.seed === "1"
    && seedOdd.events.filter((event) => event.type === "create").length === 1
    && seedOdd.events.some((event) => event.type === "play" && event.source.endsWith(oddAsset.path));
  const finished = finishDiagnostics(diagnostics);
  await context.close();
  return {
    pass: primaryPass && seedOddPass && diagnosticPass(finished),
    classification: "mocked-html-audio-modern-runtime-state-machine-not-listening-evidence",
    sourceBranch: {beforeReplay, afterReplayStart, afterBoundary, pass: primaryPass},
    seedOddBranch: {...seedOdd, pass: seedOddPass},
    diagnostics: finished,
    strictAcceptanceEffect: false,
  };
}

async function mobileCheck(browser, baseUrl, config, screenshotRoot) {
  const diagnostics = createDiagnostics();
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1, reducedMotion: "no-preference"});
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: config.mobileFrame, scenario: config.readyCases[0].scenario, lang: "en", seed: config.readyCases[0].seed};
  const {url, identity} = buildCandidateUrl(baseUrl, config, request, {purpose: "mobile"});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  const stage = await waitForReadyStage(page, identity, config);
  const state = await readStageState(page);
  const capture = await capturePng(page, stage, path.join(screenshotRoot, `mobile-390x844-frame-${String(config.mobileFrame).padStart(4, "0")}.png`));
  const pass = matchesIdentity(state, identity, config)
    && state.document.scrollWidth <= state.document.clientWidth
    && state.document.clientWidth === 390
    && state.layout
    && state.layout.x >= -1
    && state.layout.right <= state.document.clientWidth + 1
    && Math.abs(state.layout.width / state.layout.height - 4 / 3) < 0.001
    && state.canvas?.width === 800
    && state.canvas?.height === 600;
  const finished = finishDiagnostics(diagnostics);
  await context.close();
  return {state, capture, pass, diagnostics: finished};
}

async function reducedMotionCheck(browser, baseUrl, config, screenshotRoot) {
  const diagnostics = createDiagnostics();
  const context = await browser.newContext({viewport: {width: 900, height: 760}, deviceScaleFactor: 1, reducedMotion: "reduce"});
  const page = await context.newPage();
  monitorPage(page, baseUrl, diagnostics);
  const request = {frame: null, scenario: config.readyCases[0].scenario, lang: "en", seed: config.readyCases[0].seed};
  const {url} = buildCandidateUrl(baseUrl, config, request, {purpose: "reduced-motion"});
  await page.goto(url, {waitUntil: "domcontentloaded"});
  await page.waitForFunction(
    ({frame, frameDomain}) => {
      const runtime = document.querySelector(".runtime-stage");
      const wrap = document.querySelector(".faithful-stage-wrap");
      return runtime?.getAttribute("data-flash-frame") === String(frame)
        && runtime?.getAttribute("data-flash-frame-domain") === frameDomain
        && wrap?.getAttribute("data-canvas-status") === "ready"
        && wrap?.getAttribute("data-flash-frame") === String(frame);
    },
    {frame: config.reducedMotionFrame, frameDomain: config.frameDomain},
    {timeout: 45_000},
  );
  const before = await readStageState(page);
  await page.waitForTimeout(600);
  const after = await readStageState(page);
  const note = page.locator(".reduced-motion-note[role='status']").first();
  const noteVisible = await note.isVisible();
  const noteText = (await note.textContent())?.trim() || "";
  const capture = await capturePng(page, page.locator(".faithful-stage-wrap").first(), path.join(screenshotRoot, `reduced-motion-frame-${String(config.reducedMotionFrame).padStart(4, "0")}.png`));
  const pass = before.runtime.frame === String(config.reducedMotionFrame)
    && before.renderer.frame === String(config.reducedMotionFrame)
    && after.runtime.frame === String(config.reducedMotionFrame)
    && after.renderer.frame === String(config.reducedMotionFrame)
    && before.runtime.frameDomain === config.frameDomain
    && noteVisible
    && noteText.length > 0;
  const finished = finishDiagnostics(diagnostics);
  await context.close();
  return {before, after, noteVisible, noteText, capture, pass, diagnostics: finished};
}

function diagnosticPass(diagnostics) {
  return diagnostics.consoleErrors.length === 0
    && diagnostics.consoleWarnings.length === 0
    && diagnostics.pageErrors.length === 0
    && diagnostics.failedRequests.length === 0
    && diagnostics.httpErrors.length === 0
    && diagnostics.unexpectedRequests.length === 0;
}

function combineDiagnostics(items) {
  const combined = createDiagnostics();
  for (const item of items) {
    combined.requestCount += item.requestCount || 0;
    for (const endpoint of item.observedEndpoints || []) combined.observedEndpoints.add(endpoint);
    for (const key of ["consoleErrors", "consoleWarnings", "pageErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
      combined[key].push(...(item[key] || []));
    }
  }
  return finishDiagnostics(combined);
}

export function reportHasFailClosedAuthority(report) {
  const claimKeys = Object.keys(report?.claims || {}).sort();
  return report?.strictAcceptanceEffect === false
    && report?.migrationStatusChanged === false
    && JSON.stringify(claimKeys) === JSON.stringify([...AUTHORITY_CLAIM_KEYS].sort())
    && claimKeys.every((key) => report.claims[key] === false)
    && report?.acceptanceEffect === "none";
}

export function sourceSharedSpanishVisualPass(result, config) {
  const contract = config?.spanishReadyCase;
  if (!result || !contract) return false;
  const stateMatchesBoundary = (state) => state?.candidate?.status === "engineering-not-strict"
    && state.candidate.canvasStatus === "ready"
    && state.candidate.visualLocalizationStatus === contract.visualLocalizationStatus
    && state.candidate.audioLocalizationStatus === contract.audioLocalizationStatus
    && state.candidate.audioRendered === String(contract.audioRendered)
    && state.renderer?.canvasStatus === "ready"
    && state.canvas?.frame === String(contract.frame)
    && state.canvas?.frameDomain === config.frameDomain
    && state.canvas?.rootFrame === String(config.rootFrame)
    && state.canvas?.scenario === contract.scenario
    && state.canvas?.seed === String(contract.seed >>> 0);
  return contract.lang === "es"
    && contract.classification === "source-shared-untranslated-visual"
    && result.requested?.lang === "es"
    && result.requested?.frame === contract.frame
    && result.requested?.frameDomain === config.frameDomain
    && result.requested?.scenario === contract.scenario
    && result.requested?.seed === contract.seed
    && result.frozen === true
    && result.ready === true
    && result.nativeStage === true
    && result.accessible === true
    && result.capture?.width === 800
    && result.capture?.height === 600
    && stateMatchesBoundary(result.before)
    && stateMatchesBoundary(result.after);
}

export function sourceSharedRootSpanishVisualPass(result, config) {
  const contract = config?.rootSpanishReadyCase;
  if (!result || !contract) return false;
  const stateMatchesBoundary = (state) => state?.candidate?.status === "engineering-structural-frame-only"
    && state.candidate.canvasStatus === "root-ffdec-structural-frame"
    && state.candidate.visualLocalizationStatus === contract.visualLocalizationStatus
    && state.candidate.audioLocalizationStatus === contract.audioLocalizationStatus
    && state.candidate.audioRendered === String(contract.audioRendered)
    && state.renderer?.canvasStatus === "root-ffdec-structural-frame"
    && state.rootImage?.frame === String(contract.frame)
    && state.rootImage?.frameDomain === contract.frameDomain
    && state.rootImage?.rootFrame === String(contract.rootFrame)
    && state.rootImage?.scenario === contract.scenario
    && state.rootImage?.language === contract.lang
    && state.rootImage?.seed === String(contract.seed >>> 0)
    && state.rootImage?.assetSha256 === contract.assetSha256
    && state.rootImage?.originalRuntimeBaselineComplete === "false";
  return contract.lang === "es"
    && contract.classification === "source-shared-untranslated-visual"
    && contract.audioRendered === false
    && result.requested?.lang === "es"
    && result.requested?.frame === contract.frame
    && result.requested?.frameDomain === contract.frameDomain
    && result.requested?.rootFrame === contract.rootFrame
    && result.requested?.scenario === contract.scenario
    && result.requested?.seed === contract.seed
    && result.expectedAsset?.sha256 === contract.assetSha256
    && result.frozen === true
    && result.ready === true
    && result.nativeStage === true
    && result.accessible === true
    && result.assetHttpPass === true
    && result.originalRuntimeBaselineClaimed === false
    && result.capture?.width === 800
    && result.capture?.height === 600
    && stateMatchesBoundary(result.before)
    && stateMatchesBoundary(result.after);
}

async function runCandidateQa(browser, browserVersion, baseUrl, config) {
  const configErrors = validateCandidateConfig(config);
  if (configErrors.length) throw new Error(`${config.animationId}: invalid QA config: ${configErrors.join("; ")}`);

  const workspace = path.join(projectRoot, "migrations", config.animationId);
  const evidenceRoot = path.join(workspace, "evidence");
  const screenshotRoot = path.join(projectRoot, "output", "playwright", `${config.animationId}-candidate-qa-factory`);
  const migrationBytes = await readFile(path.join(workspace, "migration.json"));
  const migration = JSON.parse(migrationBytes);
  const statusBefore = migration.status;
  const reviewsBeforeSha256 = sha256(JSON.stringify(migration.reviews ?? null));

  const source = await fileRecord(config.source.path);
  const generatedManifestPath = `public/flash-assets/courses/${config.animationId}/manifest.json`;
  const generatedManifestRecord = await fileRecord(generatedManifestPath);
  const generatedManifest = JSON.parse(generatedManifestRecord.data.toString("utf8"));
  const generatedAssetPath = `public/flash-assets/courses/${config.animationId}/canvas-renderer.js`;
  const generatedAssetRecord = await fileRecord(generatedAssetPath);
  const rootFrameManifestRecord = config.rootReadyCases?.length
    ? await fileRecord(`public/flash-assets/courses/${config.animationId}/root-frames/manifest.json`)
    : null;
  const rootFrameManifest = rootFrameManifestRecord
    ? JSON.parse(rootFrameManifestRecord.data.toString("utf8"))
    : null;
  const rendererModule = await fileRecord(`packages/demos/src/modules/${config.animationId}.tsx`);
  const timelineModule = await fileRecord(`packages/demos/src/timelines/${config.animationId}.ts`);
  const testModule = await fileRecord(`packages/demos/tests/${config.animationId}.test.ts`);
  const runtimeDependencies = await Promise.all([
    "packages/demos/src/contract.ts",
    "packages/demos/src/runtime.ts",
    "apps/web/components/animation-runtime.tsx",
  ].map((dependencyPath) => fileRecord(dependencyPath)));
  const generator = await fileRecord("scripts/qa-course-candidates.mjs");
  const generatorTest = await fileRecord("scripts/qa-course-candidates.test.mjs");

  const diagnostics = createDiagnostics();
  const desktopContext = await browser.newContext({viewport: {width: 1280, height: 1000}, deviceScaleFactor: 1, reducedMotion: "no-preference"});
  const desktopPage = await desktopContext.newPage();
  monitorPage(desktopPage, baseUrl, diagnostics);
  const deterministic = [];
  for (const [index, testCase] of config.readyCases.entries()) {
    deterministic.push(await deterministicCase(desktopPage, baseUrl, config, testCase, screenshotRoot, index));
  }
  const spanishReadyResult = config.spanishReadyCase
    ? await deterministicCase(desktopPage, baseUrl, config, config.spanishReadyCase, screenshotRoot, deterministic.length)
    : null;
  const deterministicRoot = [];
  for (const [index, testCase] of (config.rootReadyCases || []).entries()) {
    deterministicRoot.push(await structuralRootCase(desktopPage, baseUrl, config, testCase, screenshotRoot, index));
  }
  const rootSpanishReadyResult = config.rootSpanishReadyCase
    ? await structuralRootCase(
        desktopPage,
        baseUrl,
        config,
        config.rootSpanishReadyCase,
        screenshotRoot,
        deterministicRoot.length,
      )
    : null;
  const assetResponse = await desktopContext.request.get(`${baseUrl}/flash-assets/courses/${config.animationId}/canvas-renderer.js`);
  const assetHttpBytes = await assetResponse.body();
  const assetHttp = {
    status: assetResponse.status(),
    contentType: assetResponse.headers()["content-type"] || null,
    bytes: assetHttpBytes.length,
    sha256: sha256(assetHttpBytes),
  };
  const audioAssets = [];
  for (const expected of config.audioAssets || []) {
    const disk = await fileRecord(`public${expected.path}`);
    const response = await desktopContext.request.get(`${baseUrl}${expected.path}`);
    const httpBytes = await response.body();
    audioAssets.push({
      cueId: expected.cueId,
      publicUrl: expected.path,
      disk: {path: disk.path, sha256: disk.sha256, bytes: disk.bytes},
      expected: {sha256: expected.sha256, bytes: expected.bytes},
      http: {
        status: response.status(),
        contentType: response.headers()["content-type"] || null,
        bytes: httpBytes.length,
        sha256: sha256(httpBytes),
      },
      _diskRecord: disk,
    });
  }
  await desktopContext.close();

  const spanishBlockedResult = config.spanishCase
    ? await blockedCase(browser, baseUrl, config, config.spanishCase, "es", screenshotRoot, "blocked-spanish", true)
    : null;
  const rootSpanishBlockedResult = config.rootSpanishCase
    ? await blockedCase(browser, baseUrl, config, config.rootSpanishCase, "es", screenshotRoot, "blocked-root-spanish", true)
    : null;
  const hostBlocked = [];
  for (const [index, testCase] of config.hostBlockedCases.entries()) {
    hostBlocked.push(await blockedCase(browser, baseUrl, config, testCase, "en", screenshotRoot, `blocked-host-${index + 1}`, index === 0));
  }

  const replay = [];
  for (const input of ["pointer", "enter", "space"]) replay.push(await activateReplay(browser, baseUrl, config, input));
  const audioRuntime = await audioRuntimeCheck(browser, baseUrl, config);
  const mobile = await mobileCheck(browser, baseUrl, config, screenshotRoot);
  const reducedMotion = await reducedMotionCheck(browser, baseUrl, config, screenshotRoot);
  const allDiagnostics = combineDiagnostics([
    finishDiagnostics(diagnostics),
    ...(spanishBlockedResult ? [spanishBlockedResult.diagnostics] : []),
    ...(rootSpanishBlockedResult ? [rootSpanishBlockedResult.diagnostics] : []),
    ...hostBlocked.map(({diagnostics: value}) => value),
    ...replay.map(({diagnostics: value}) => value),
    ...(audioRuntime ? [audioRuntime.diagnostics] : []),
    mobile.diagnostics,
    reducedMotion.diagnostics,
  ]);

  const sourceHashPass = source.sha256 === config.source.sha256
    && generatedManifest.inputs?.sourceSwf?.path === config.source.path
    && generatedManifest.inputs?.sourceSwf?.sha256 === config.source.sha256;
  const generatedAssetPass = generatedManifest.output?.script === generatedAssetPath
    && generatedManifest.output?.sha256 === generatedAssetRecord.sha256
    && generatedManifest.output?.bytes === generatedAssetRecord.bytes
    && assetHttp.status === 200
    && assetHttp.sha256 === generatedAssetRecord.sha256
    && assetHttp.bytes === generatedAssetRecord.bytes
    && /(?:java|ecma)script/i.test(assetHttp.contentType || "");
  const rootStructuralPass = deterministicRoot.length === 0
    ? rootFrameManifest === null && rootFrameManifestRecord === null
    : rootFrameManifest?.classification === "engineering-structural-inspection-not-strict-acceptance"
      && rootFrameManifest?.source?.swfSha256 === config.source.sha256
      && rootFrameManifest?.authority?.originalRuntimeBaseline === false
      && rootFrameManifest?.authority?.naturalPlaybackClaimed === false
      && rootFrameManifest?.runtime?.frameDomain === "root"
      && JSON.stringify(rootFrameManifest?.runtime?.supportedLanguages) === JSON.stringify(["en", "es"])
      && rootFrameManifest?.runtime?.visualLocalizationStatus === "source-shared-untranslated-visual"
      && rootFrameManifest?.runtime?.spanishTranslationSupplied === false
      && rootFrameManifest?.strictAcceptanceEffect === "none"
      && deterministicRoot.every((result) => result.frozen
        && result.ready
        && result.nativeStage
        && result.accessible
        && result.assetHttpPass
        && result.originalRuntimeBaselineClaimed === false
        && result.capture.width === 800
        && result.capture.height === 600)
      && config.rootReadyCases.every((expected) => rootFrameManifest.frames?.some((frame) => frame.frame === expected.frame
        && `/flash-assets/courses/${config.animationId}/root-frames/${frame.file}` === expected.assetPath
        && frame.sha256 === expected.assetSha256));
  const audioAssetsPass = audioAssets.every(({disk, expected, http}) => disk.sha256 === expected.sha256
    && disk.bytes === expected.bytes
    && http.status === 200
    && http.sha256 === expected.sha256
    && http.bytes === expected.bytes
    && /^audio\/(?:mpeg|mp3)(?:;|$)/i.test(http.contentType || ""));
  const hostDispositionPass = hostBlocked.length
    ? hostBlocked.every(({blocked}) => blocked.pass)
    : Boolean(config.hostUnaddressableReason);
  const spanishReadyPass = sourceSharedSpanishVisualPass(spanishReadyResult, config);
  const spanishDispositionPass = spanishReadyResult
    ? spanishReadyPass
    : spanishBlockedResult?.blocked.pass === true;
  const rootSpanishReadyPass = sourceSharedRootSpanishVisualPass(rootSpanishReadyResult, config);
  const rootSpanishDispositionPass = rootSpanishReadyResult
    ? rootSpanishReadyPass
    : rootSpanishBlockedResult
      ? rootSpanishBlockedResult.blocked.pass === true
      : deterministicRoot.length === 0;
  const accessibilityPass = deterministic.every(({accessible}) => accessible)
    && deterministicRoot.every(({accessible}) => accessible)
    && (spanishReadyResult?.accessible === true
      || (spanishBlockedResult?.blocked.role === "status" && spanishBlockedResult.blocked.ariaLive === "polite"))
    && (!rootSpanishReadyResult || rootSpanishReadyResult.accessible === true)
    && (!rootSpanishBlockedResult
      || (rootSpanishBlockedResult.blocked.role === "status" && rootSpanishBlockedResult.blocked.ariaLive === "polite"))
    && replay.every(({result}) => result.accessibleName && result.keyboardContract === "enter-space")
    && reducedMotion.noteVisible
    && reducedMotion.noteText.length > 0;
  const screenshotCaptures = [
    ...deterministic.map(({capture}) => capture),
    ...deterministicRoot.map(({capture}) => capture),
    rootSpanishReadyResult?.capture,
    spanishReadyResult?.capture,
    spanishBlockedResult?.blocked.capture,
    rootSpanishBlockedResult?.blocked.capture,
    ...hostBlocked.map(({blocked}) => blocked.capture),
    mobile.capture,
    reducedMotion.capture,
  ].filter(Boolean);
  const devOverlaySuppressionPassed = screenshotCaptures.length > 0
    && screenshotCaptures.every(({devOverlaySuppression}) => devOverlaySuppressionPass(devOverlaySuppression));

  const assertions = [
    {id: "source-and-generated-manifest-hashes", pass: sourceHashPass},
    {id: "generated-asset-disk-http-hash", pass: generatedAssetPass, details: assetHttp},
    ...(deterministicRoot.length ? [{
      id: "deterministic-english-structural-root-native-stage",
      pass: rootStructuralPass && rootSpanishDispositionPass,
      details: {
        rootManifest: rootFrameManifestRecord
          ? {path: rootFrameManifestRecord.path, sha256: rootFrameManifestRecord.sha256}
          : null,
        readyCases: deterministicRoot.length,
        spanishDisposition: rootSpanishReadyResult
          ? "ready-source-shared-untranslated-visual"
          : "fail-closed",
        spanishDispositionPass: rootSpanishDispositionPass,
        originalRuntimeBaselineClaimed: false,
      },
    }] : []),
    ...(config.audioAssets ? [{id: "audio-assets-disk-http-hash", pass: audioAssetsPass, details: audioAssets.map(({_diskRecord: _record, ...asset}) => asset)}] : []),
    ...(config.audioRuntime ? [{id: "modern-audio-branch-start-stop-replay", pass: audioRuntime?.pass === true, details: audioRuntime}] : []),
    {id: "deterministic-frame-domain-native-stage", pass: deterministic.every(({frozen, ready, nativeStage, capture}) => frozen && ready && nativeStage && capture.width === 800 && capture.height === 600)},
    {id: "replay-pointer-enter-space", pass: replay.every(({result}) => result.pass)},
    config.spanishReadyCase
      ? {
          id: "spanish-source-shared-untranslated-visual-ready",
          pass: spanishDispositionPass,
          details: {
            routeLanguage: "es",
            sourceVisualLanguage: "en",
            embeddedEnglishTitle: true,
            translationStatus: "not-translated-source-has-no-visual-language-branch",
            audioStatus: config.spanishReadyCase.audioRendered
              ? "modern-runtime-wired-spoken-language-and-parity-unresolved"
              : "unresolved-and-unrendered",
          },
        }
      : {id: "spanish-fails-closed", pass: spanishDispositionPass},
    {id: "host-state-disposition", pass: hostDispositionPass, details: hostBlocked.length ? {tested: hostBlocked.length} : {blocked: true, reason: config.hostUnaddressableReason}},
    {id: "mobile-390x844-no-horizontal-overflow", pass: mobile.pass},
    {id: "reduced-motion-static-frame", pass: reducedMotion.pass},
    {id: "accessibility-basics", pass: accessibilityPass},
    {id: "next-dev-overlay-suppressed-before-every-screenshot", pass: devOverlaySuppressionPassed, details: {captureCount: screenshotCaptures.length}},
    {id: "console-and-localhost-only-network", pass: diagnosticPass(allDiagnostics), details: allDiagnostics},
  ];

  const migrationAfterBytes = await readFile(path.join(workspace, "migration.json"));
  const migrationAfter = JSON.parse(migrationAfterBytes);
  const sourceAfterBytes = await readFile(source.absolute);
  const generatedManifestAfterBytes = await readFile(generatedManifestRecord.absolute);
  const generatedAssetAfterBytes = await readFile(generatedAssetRecord.absolute);
  const rootFrameManifestUnchanged = rootFrameManifestRecord
    ? sha256(await readFile(rootFrameManifestRecord.absolute)) === rootFrameManifestRecord.sha256
    : true;
  const audioAssetsUnchanged = (await Promise.all(audioAssets.map(({_diskRecord}) => readFile(_diskRecord.absolute))))
    .every((bytes, index) => sha256(bytes) === audioAssets[index]._diskRecord.sha256);
  const runtimeDependenciesUnchanged = (await Promise.all(runtimeDependencies.map(({absolute}) => readFile(absolute))))
    .every((bytes, index) => sha256(bytes) === runtimeDependencies[index].sha256);
  const controlsUnchanged = migration.status === migrationAfter.status
    && statusBefore === migrationAfter.status
    && reviewsBeforeSha256 === sha256(JSON.stringify(migrationAfter.reviews ?? null))
    && sha256(migrationBytes) === sha256(migrationAfterBytes)
    && sha256(sourceAfterBytes) === source.sha256
    && sha256(generatedManifestAfterBytes) === generatedManifestRecord.sha256
    && sha256(generatedAssetAfterBytes) === generatedAssetRecord.sha256
    && rootFrameManifestUnchanged
    && audioAssetsUnchanged
    && runtimeDependenciesUnchanged;
  assertions.push({id: "source-generated-assets-migration-status-reviews-unchanged", pass: controlsUnchanged});

  const report = {
    schemaVersion: 3,
    animationId: config.animationId,
    generatedAt: new Date().toISOString(),
    generatedBy: {
      script: generator.path,
      scriptSha256: generator.sha256,
      deterministic: false,
      invocation: `node scripts/qa-course-candidates.mjs --base-url ${baseUrl} --id ${config.animationId}`,
    },
    status: assertions.every(({pass}) => pass) ? "pass" : "fail",
    classification: "hash-bound-browser-engineering-candidate-qa-not-fidelity-evidence",
    scope: "source/generated visual integrity, optional recovered-audio disk/HTTP integrity and modern state-machine wiring, deterministic browser product contracts, and explicit fail-closed or source-shared-untranslated localization disposition",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    route: `/animations/${config.animationId}`,
    environment: {
      baseUrl,
      browser: `Chromium ${browserVersion}`,
      playwright: "repository-pinned",
      serverMode: "development",
      deviceScaleFactor: 1,
      networkPolicy: "same localhost hostname and port only",
    },
    source: {swf: source.path, swfSha256: source.sha256, expectedSwfSha256: config.source.sha256},
    implementation: {
      frameDomain: config.frameDomain,
      rootFrame: config.rootFrame,
      frameCount: config.frameCount,
      rendererModule: {path: rendererModule.path, sha256: rendererModule.sha256},
      timelineModule: {path: timelineModule.path, sha256: timelineModule.sha256},
      testModule: {path: testModule.path, sha256: testModule.sha256},
      runtimeDependencies: runtimeDependencies.map(({path: dependencyPath, sha256: dependencySha256}) => ({path: dependencyPath, sha256: dependencySha256})),
      qaTestModule: {path: generatorTest.path, sha256: generatorTest.sha256},
    },
    generatedAsset: {
      path: generatedAssetRecord.path,
      sha256: generatedAssetRecord.sha256,
      bytes: generatedAssetRecord.bytes,
      manifestPath: generatedManifestRecord.path,
      manifestSha256: generatedManifestRecord.sha256,
      http: assetHttp,
    },
    rootStructuralAssets: rootFrameManifestRecord ? {
      manifestPath: rootFrameManifestRecord.path,
      manifestSha256: rootFrameManifestRecord.sha256,
      classification: rootFrameManifest.classification,
      authority: rootFrameManifest.authority,
      runtime: rootFrameManifest.runtime,
      strictAcceptanceEffect: rootFrameManifest.strictAcceptanceEffect,
    } : null,
    audioAssets: audioAssets.map(({_diskRecord: _record, ...asset}) => asset),
    audioRuntime,
    deterministic,
    deterministicRoot,
    deterministicRootSpanish: rootSpanishReadyResult,
    replay: replay.map(({result}) => result),
    localization: {
      rootSpanish: rootSpanishReadyResult
        ? {
            disposition: "root-structural-ready-source-shared-untranslated-visual",
            classification: config.rootSpanishReadyCase.classification,
            pass: rootSpanishReadyPass,
            routeLanguage: "es",
            sourceVisualLanguage: "en",
            translationSupplied: false,
            audio: {
              rendered: false,
              localizationStatus: "unresolved",
              parityClaimed: false,
            },
            originalRuntimeBaselineClaimed: false,
            rmseAcceptanceClaimed: false,
            humanVisualReviewClaimed: false,
            ownerAcceptanceClaimed: false,
            strictAcceptanceEffect: false,
            browser: rootSpanishReadyResult,
          }
        : {
            disposition: "browser-fail-closed-unproven-root-spanish-visual-and-audio",
            pass: rootSpanishBlockedResult?.blocked.pass ?? false,
            translationSupplied: false,
            audio: {rendered: false, localizationStatus: "unresolved", parityClaimed: false},
            originalRuntimeBaselineClaimed: false,
            rmseAcceptanceClaimed: false,
            humanVisualReviewClaimed: false,
            ownerAcceptanceClaimed: false,
            strictAcceptanceEffect: false,
            browser: rootSpanishBlockedResult?.blocked ?? null,
          },
      spanish: spanishReadyResult
        ? {
            disposition: "canvas-ready-source-shared-untranslated-visual",
            classification: config.spanishReadyCase.classification,
            pass: spanishReadyPass,
            routeLanguage: "es",
            sourceVisualLanguage: "en",
            embeddedEnglishTitle: true,
            sourceVisualBranch: "none",
            translationStatus: "not-translated-source-has-no-visual-language-branch",
            audio: {
              rendered: config.spanishReadyCase.audioRendered,
              localizationStatus: "unresolved",
              parityClaimed: false,
            },
            bilingualVisualParityClaimed: false,
            strictAcceptanceEffect: false,
            browser: spanishReadyResult,
          }
        : {
            disposition: "browser-fail-closed-unproven-spanish-visual-and-audio",
            pass: spanishBlockedResult.blocked.pass,
            translationStatus: "not-rendered",
            audio: {rendered: false, localizationStatus: "unresolved", parityClaimed: false},
            bilingualVisualParityClaimed: false,
            strictAcceptanceEffect: false,
            browser: spanishBlockedResult.blocked,
          },
    },
    blocked: {
      spanish: spanishBlockedResult?.blocked ?? null,
      rootSpanish: rootSpanishBlockedResult?.blocked ?? null,
      host: hostBlocked.map(({blocked}) => blocked),
      hostContract: hostBlocked.length
        ? {status: "browser-fail-closed-cases-verified", testedCases: hostBlocked.length}
        : {status: "blocked-no-source-proven-browser-address", reason: config.hostUnaddressableReason},
    },
    mobile: {state: mobile.state, capture: mobile.capture, pass: mobile.pass},
    reducedMotion: {
      before: reducedMotion.before,
      after: reducedMotion.after,
      noteVisible: reducedMotion.noteVisible,
      noteText: reducedMotion.noteText,
      capture: reducedMotion.capture,
      pass: reducedMotion.pass,
    },
    accessibility: {
      status: accessibilityPass ? "pass-basic-semantics-only" : "fail",
      checks: ["candidate region has an accessible name", "ready canvas is role img with an accessible name", "configured structural root image has alt text and native dimensions", "Replay has an accessible name and Enter/Space contract", "configured blocked states and reduced-motion notice use live status semantics"],
      fullManualAssistiveTechnologyReview: false,
    },
    diagnostics: allDiagnostics,
    assertions,
    limitations: [
      ...config.limitations,
      ...(deterministicRoot.length
        ? [rootSpanishReadyResult
          ? "The English and Spanish root captures validate only the modern route's hash-bound, source-shared untranslated FFDec structural inspection assets. They are not a Spanish translation, original-runtime frames, natural-playback evidence, AVM1 execution, RMSE evidence, audio acceptance, human/owner acceptance, or a fidelity claim."
          : "The English root captures validate only the modern route's hash-bound FFDec structural inspection assets. They are not original-runtime frames, natural-playback evidence, AVM1 execution, RMSE evidence, or a fidelity claim; root Spanish remains fail closed."]
        : []),
      ...(config.spanishReadyCase
        ? [config.spanishReadyCase.audioRendered
          ? "The es Canvas-ready result means only that the one source-shared visual timeline renders with its embedded English title. Extracted source-shared audio is wired, but its spoken language and historical host routing are unresolved; this is not evidence of a Spanish translation, bilingual parity, listening acceptance, synchronization parity, or audio parity."
          : "The es Canvas-ready result means only that the one source-shared visual timeline renders with its embedded English title. No audio is rendered; this is not evidence of a Spanish translation, bilingual parity, listening acceptance, synchronization parity, or audio parity."]
        : []),
      "This report validates only modern candidate integrity, deterministic identity, explicit fail-closed behavior, and basic product mechanics. It is not an original-runtime baseline or parity report.",
      "Replay checks prove the modern player reset counter/playhead contract only; source-authored interaction, score, random state, audio, and terminal reset remain unclaimed.",
      "No authoritative full-frame/scenario RMSE, human visual review, engineering acceptance, owner acceptance, or strict migration completion is claimed.",
    ],
    claims: {...falseClaims},
  };
  if (!reportHasFailClosedAuthority(report)) throw new Error(`${config.animationId}: report authority boundary is not fail closed`);

  await mkdir(evidenceRoot, {recursive: true});
  const outputPath = path.join(evidenceRoot, config.outputFile);
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  return {animationId: config.animationId, output: portable(outputPath), status: report.status, assertions};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  const results = [];
  try {
    for (const id of options.ids) {
      results.push(await runCandidateQa(browser, browserVersion, options.baseUrl, COURSE_CANDIDATE_QA_CONFIGS[id]));
    }
  } finally {
    await browser.close();
  }
  const status = results.every((result) => result.status === "pass") ? "pass" : "fail";
  process.stdout.write(`${JSON.stringify({status, strictAcceptanceEffect: false, results}, null, 2)}\n`);
  if (status !== "pass") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
