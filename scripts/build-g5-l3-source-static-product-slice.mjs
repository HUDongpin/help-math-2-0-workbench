#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {chromium} from "playwright";

import {
  buildSafeRuntime,
  inspectFfdecCanvasExport,
} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE = "scripts/build-g5-l3-source-static-product-slice.mjs";
const SAFE_ADAPTER_RELATIVE = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const CORPUS_RELATIVE = "tools/g5-l3-migration/corpus.json";
const RELEASE_ID = "lesson-g05-l03-exponents-prime-factorizations-page-only";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const SHA256 = /^[a-f0-9]{64}$/;

export const PRODUCT_SLICE_IDS = Object.freeze([
  "course-g05-l03-rw-002",
  "course-g05-l03-in-020",
  "course-g05-l03-in-014",
]);

const PRODUCT_SLICE_PROFILES = Object.freeze({
  "course-g05-l03-rw-002": Object.freeze({
    lane: "swf-only-long-autoplay-with-exact-external-audio",
    blockedLocalFrameRanges: Object.freeze([]),
  }),
  "course-g05-l03-in-020": Object.freeze({
    lane: "paired-fla-scriptless-local-timeline",
    blockedLocalFrameRanges: Object.freeze([]),
  }),
  "course-g05-l03-in-014": Object.freeze({
    lane: "swf-only-drag-interaction-boundary",
    requiresBoundaryInteraction: true,
    blockedLocalFrameRanges: Object.freeze([
      Object.freeze({
        firstFrame: 381,
        lastFrame: 460,
        reason:
          "Frames 381..460 enter a stop-, drag-, answer-, and feedback-controlled state whose causal transitions require unresolved ActionScript and host behavior.",
      }),
    ]),
  }),
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  modernMyLessonIntegrated: false,
  legacyFlashCourseShellConverted: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  avm1BehaviorCompiled: false,
  nestedAudioPlaybackCompiled: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

const PROTECTED_PATHS = Object.freeze([
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "packages/demos/prototype-registry.json",
  "packages/demos/src/registry.generated.ts",
  "packages/demos/src/prototype-manifest.ts",
  "apps/web/lib/whole-lesson-course-registry.ts",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function candidateOutputPaths(animationId) {
  invariant(/^course-g05-l03-[a-z]{2}-\d{3}(?:-[a-f0-9]{8})?$/.test(animationId),
    `unsupported G5 L3 animation ID: ${animationId}`);
  return Object.freeze({
    script: `apps/web/public/flash-assets/courses/${animationId}/canvas-renderer.js`,
    manifest: `migrations/${animationId}/audit/source-static-current-js-candidate-manifest.json`,
    report: `migrations/${animationId}/evidence/source-static-current-js-candidate.json`,
  });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the project: ${relativePath}`);
  return resolved;
}

async function readBinding(relativePath, expected = {}) {
  const absolutePath = projectPath(relativePath);
  const [metadata, canonical] = await Promise.all([
    lstat(absolutePath),
    realpath(absolutePath),
  ]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`);
  invariant(canonical === absolutePath,
    `${relativePath}: path aliases are forbidden`);
  const bytes = await readFile(absolutePath);
  const binding = Object.freeze({
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  });
  if (expected.bytes !== undefined) {
    invariant(binding.bytes === expected.bytes,
      `${relativePath}: byte length drifted`);
  }
  if (expected.sha256 !== undefined) {
    invariant(binding.sha256 === expected.sha256,
      `${relativePath}: SHA-256 drifted`);
  }
  return binding;
}

function withoutContents(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function parseTagAttributes(text) {
  return Object.fromEntries(
    [...text.matchAll(/([A-Za-z][A-Za-z0-9]*)="([^"]*)"/g)]
      .map((match) => [match[1], match[2]]),
  );
}

function parseScriptBundle(text) {
  const sections = new Map();
  const marker = /^===== (.+) =====$/gm;
  const matches = [...text.matchAll(marker)];
  for (const [index, match] of matches.entries()) {
    const start = match.index + match[0].length + 1;
    const end = matches[index + 1]?.index ?? text.length;
    invariant(!sections.has(match[1]), `duplicate script bundle path: ${match[1]}`);
    sections.set(match[1], text.slice(start, end).trim());
  }
  return sections;
}

export function countRootFrameLabels(xml, label) {
  let spriteDepth = 0;
  let matches = 0;
  for (const rawLine of xml.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "</DefineSprite>") {
      spriteDepth -= 1;
      invariant(spriteDepth >= 0, "swfmill DefineSprite nesting is malformed");
      continue;
    }
    if (spriteDepth === 0 && line === `<FrameLabel label="${label}">`) {
      matches += 1;
    }
    if (line.startsWith("<DefineSprite ")) spriteDepth += 1;
  }
  invariant(spriteDepth === 0, "swfmill DefineSprite nesting is incomplete");
  return matches;
}

export function proveRootPreloaderContract(scripts, {animationId = "unknown"} = {}) {
  const navigationAction = '_level0.InternalPreloader.gotoAndPlay("jump_check");';
  const frame1 = scripts.get("frame_1/DoAction.as") ?? "";
  const frame6 = scripts.get("frame_6/DoAction.as") ?? "";
  const normalizedFrame1 = frame1
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  invariant(
    normalizedFrame1.length >= 1 &&
      normalizedFrame1.length <= 2 &&
      normalizedFrame1[0] === navigationAction &&
      (normalizedFrame1.length === 1 || normalizedFrame1[1] === "stop();"),
    `${animationId}: root frame 1 preloader contract is unproven`,
  );
  invariant(/\bstop\s*\(\s*\)\s*;/.test(frame6),
    `${animationId}: root begin frame stop is unproven`);
  return Object.freeze({
    navigationFrame: 1,
    navigationAction,
    stopFrame: normalizedFrame1.length === 2 ? 1 : null,
  });
}

export function deriveDirectAnimationPlacement(xml, {animationId = "unknown"} = {}) {
  const matches = [...xml.matchAll(
    /<PlaceObject2\b([^>]*)>\s*<transform>\s*<Transform\b([^>]*)\/>\s*<\/transform>\s*<\/PlaceObject2>/g,
  )].map((match) => ({
    placement: parseTagAttributes(match[1]),
    transform: parseTagAttributes(match[2]),
  })).filter(({placement}) =>
    typeof placement.name === "string" &&
      placement.name.toLowerCase() === "animation");
  invariant(matches.length === 1,
    `${animationId}: expected one exact animation placement, observed ${matches.length}`);
  const [{placement, transform}] = matches;
  const objectId = Number(placement.objectID);
  const depth = Number(placement.depth);
  const transX = Number(transform.transX);
  const transY = Number(transform.transY);
  invariant(Number.isSafeInteger(objectId) && objectId > 0 &&
    Number.isSafeInteger(depth) && depth > 0 &&
    Number.isSafeInteger(transX) && Number.isSafeInteger(transY) &&
    placement.replace === "0",
  `${animationId}: root animation placement is malformed`);
  const spriteTags = [...xml.matchAll(/<DefineSprite\b([^>]*)>/g)]
    .map((match) => parseTagAttributes(match[1]));
  const definitions = spriteTags.filter((attributes) =>
    Number(attributes.objectID) === objectId);
  invariant(definitions.length === 1,
    `${animationId}: expected one target sprite definition`);
  const frameCount = Number(definitions[0].frames);
  invariant(Number.isSafeInteger(frameCount) && frameCount > 0,
    `${animationId}: target sprite frame count is invalid`);
  return Object.freeze({
    objectId,
    frameCount,
    depth,
    instanceName: placement.name,
    placementTwips: Object.freeze({x: transX, y: transY}),
    placementPixels: Object.freeze({x: transX / 20, y: transY / 20}),
  });
}

function validateBehaviorBoundary(animationId, target, scripts, profile) {
  const targetPrefix = `DefineSprite_${target.objectId}/frame_`;
  const targetScripts = [...scripts.entries()]
    .filter(([sourcePath]) => sourcePath.startsWith(targetPrefix));
  if (profile.blockedLocalFrameRanges.length === 0) {
    const nonterminalStop = targetScripts.find(([sourcePath, source]) => {
      const frame = Number(sourcePath.match(/\/frame_(\d+)\//)?.[1]);
      return /\bstop\s*\(\s*\)\s*;/.test(source) &&
        frame > 1 && frame < target.frameCount;
    });
    invariant(!nonterminalStop,
      `${animationId}: unprofiled nonterminal stop requires a blocked range: ${nonterminalStop?.[0]}`);
    return;
  }
  for (const range of profile.blockedLocalFrameRanges) {
    invariant(range.firstFrame >= 1 && range.firstFrame <= range.lastFrame &&
      range.lastFrame <= target.frameCount,
    `${animationId}: blocked local frame range is invalid`);
    const framePrefix = `${targetPrefix}${range.firstFrame}/`;
    const boundaryScripts = targetScripts.filter(([sourcePath]) =>
      sourcePath.startsWith(framePrefix));
    invariant(boundaryScripts.some(([sourcePath, source]) =>
      sourcePath.endsWith("/DoAction.as") && /\bstop\s*\(\s*\)\s*;/.test(source)),
    `${animationId}: blocked boundary lacks a source stop action`);
    if (profile.requiresBoundaryInteraction === true) {
      invariant(boundaryScripts.some(([sourcePath]) =>
        sourcePath.includes("CLIPACTIONRECORD on(press)") ||
        sourcePath.includes("CLIPACTIONRECORD on(release")),
      `${animationId}: blocked boundary lacks a source interaction handler`);
    }
  }
}

export function deriveBehaviorProfile(animationId, target, scripts) {
  invariant(target && Number.isSafeInteger(target.objectId) &&
    Number.isSafeInteger(target.frameCount) && target.frameCount > 0,
  `${animationId}: target timeline is invalid`);
  invariant(scripts instanceof Map,
    `${animationId}: parsed script map is required`);
  const targetPrefix = `DefineSprite_${target.objectId}/frame_`;
  const nonterminalStops = [...scripts.entries()].flatMap(([sourcePath, source]) => {
    if (!sourcePath.startsWith(targetPrefix) ||
      !/\bstop\s*\(\s*\)\s*;/.test(source)) return [];
    const frame = Number(sourcePath.match(/\/frame_(\d+)\//)?.[1]);
    return Number.isSafeInteger(frame) && frame >= 1 && frame < target.frameCount
      ? [frame]
      : [];
  }).sort((left, right) => left - right);
  const firstBoundary = nonterminalStops[0];
  if (firstBoundary === undefined) {
    return Object.freeze({
      lane: "source-static-full-local-timeline-no-nonterminal-stop",
      blockedLocalFrameRanges: Object.freeze([]),
    });
  }
  return Object.freeze({
    lane: "source-static-safe-prefix-to-first-nonterminal-stop",
    blockedLocalFrameRanges: Object.freeze([
      Object.freeze({
        firstFrame: firstBoundary,
        lastFrame: target.frameCount,
        reason:
          `Frames ${firstBoundary}..${target.frameCount} begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal.`,
      }),
    ]),
  });
}

async function inspectMember(member, explicitProfile) {
  const workspace = `migrations/${member.animationId}`;
  const [machine, swfmillGzip, scriptsGzip, audioAudit, manifest] =
    await Promise.all([
      readBinding(`${workspace}/audit/machine/report.json`),
      readBinding(`${workspace}/audit/machine/swfmill.xml.gz`),
      readBinding(`${workspace}/audit/machine/ffdec-scripts.txt.gz`),
      readBinding(`${workspace}/audit/audio-runtime-evidence.json`),
      readBinding(`${workspace}/migration.json`),
    ]);
  const machineReport = JSON.parse(machine.contents.toString("utf8"));
  const migration = JSON.parse(manifest.contents.toString("utf8"));
  invariant(machineReport.animationId === member.animationId &&
    machineReport.auditStatus === "partial" &&
    machineReport.source?.hashMatches === true &&
    machineReport.source.expectedSha256 === member.source.sha256 &&
    machineReport.findings?.runtimeCrossCheck?.allMatch === true,
  `${member.animationId}: machine audit identity or structural cross-check failed`);
  invariant(Object.values(machineReport.commands ?? {}).every(({status}) =>
    status === "success"), `${member.animationId}: machine extraction is incomplete`);
  invariant(migration.animationId === member.animationId &&
    migration.source?.swfSha256 === member.source.sha256,
  `${member.animationId}: migration manifest identity drifted`);
  const xml = gunzipSync(swfmillGzip.contents).toString("utf8");
  const scriptsText = gunzipSync(scriptsGzip.contents).toString("utf8");
  const scripts = parseScriptBundle(scriptsText);
  const rootBeginLabelCount = countRootFrameLabels(xml, "begin");
  const rootPreloader = proveRootPreloaderContract(scripts, {
    animationId: member.animationId,
  });
  invariant(rootBeginLabelCount <= 1,
    `${member.animationId}: root begin label contract is unproven`);
  const target = deriveDirectAnimationPlacement(xml, {
    animationId: member.animationId,
  });
  const profile = explicitProfile ??
    deriveBehaviorProfile(member.animationId, target, scripts);
  validateBehaviorBoundary(member.animationId, target, scripts, profile);
  const header = machineReport.findings.ffdecHeader;
  invariant(header.widthPx === 800 && header.heightPx === 600 &&
    header.frameRate === 12 && [10, 11].includes(header.frameCount),
  `${member.animationId}: stage/root contract drifted`);
  return Object.freeze({
    machine,
    swfmillGzip,
    scriptsGzip,
    audioAudit,
    manifest,
    machineReport,
    target,
    rootFrameCount: header.frameCount,
    rootBeginLabel: rootBeginLabelCount === 1 ? "begin" : null,
    rootPreloader,
    fps: header.frameRate,
    backgroundColor: machineReport.findings.backgroundColor,
    exportedScriptFileCount: machineReport.findings.exportedScriptFileCount,
    profile,
  });
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`);
  return Object.freeze({command, version: EXPECTED_FFDEC_VERSION});
}

async function exportSprite(ffdec, member, target, temporaryRoot) {
  const output = path.join(temporaryRoot, member.animationId);
  const swf = projectPath(member.source.path);
  const result = await execFile(ffdec.command, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(target.objectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    output,
    swf,
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 660_000,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `${member.animationId}: FFDec export version drifted`);
  const directory = path.join(output, `DefineSprite_${target.objectId}`);
  const [helper, frames] = await Promise.all([
    readFile(path.join(directory, "canvas.js")),
    readFile(path.join(directory, "frames.html")),
  ]);
  return Object.freeze({helper, frames});
}

function associatedAudio(member) {
  invariant(member.exactExternalAudio.length <= 1,
    `${member.animationId}: product slice expects at most one exact external audio association`);
  if (member.exactExternalAudio.length === 1) {
    const audio = member.exactExternalAudio[0];
    return Object.freeze({
      kind: "external-file",
      path: `${SOURCE_PREFIX}/${audio.path}`,
      bytes: audio.bytes,
      sha256: audio.sha256,
      language: audio.language,
      rendered: false,
      listened: false,
    });
  }
  return Object.freeze({
    kind: "embedded-swf-stream-container",
    path: member.source.path,
    bytes: member.source.bytes,
    sha256: member.source.sha256,
    language: "und",
    rendered: false,
    listened: false,
  });
}

function renderableFrames(frameCount, blockedRanges) {
  return Array.from({length: frameCount}, (_, index) => index + 1)
    .filter((frame) => !blockedRanges.some(({firstFrame, lastFrame}) =>
      frame >= firstFrame && frame <= lastFrame));
}

export function browserSweepCapacity(frameCount) {
  invariant(Number.isSafeInteger(frameCount) && frameCount > 0,
    "browser sweep frame count must be a positive safe integer");
  // Keep the sweep single-worker: measured browser-process contention in the
  // constrained migration host made parallel workers slower without reducing
  // the number of rendered frames.
  const workerCount = 1;
  return Object.freeze({
    frameChunkSize: 32,
    pageFrameCapacity: 256,
    workerCount,
    timeoutMs: Math.max(
      180_000,
      Math.ceil(frameCount / workerCount) * 1_200,
    ),
  });
}

async function withinTimeout(promise, timeoutMs, label) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function sweepBrowserPartition({
  allowedFrames,
  blockedFrames,
  browser,
  frameChunkSize,
  runtime,
  sampledFrames,
  spec,
  workerIndex,
}) {
  const page = await browser.newPage({viewport: {width: 800, height: 600}});
  const pageErrors = [];
  const consoleErrors = [];
  const networkRequests = [];
  page.on("crash", () => pageErrors.push("page crashed"));
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => networkRequests.push(request.url()));
  try {
    const workerLabel = `${spec.animationId}: browser frame sweep worker ${workerIndex + 1}`;
    await withinTimeout(
      page.setContent('<canvas id="stage" width="800" height="600"></canvas>'),
      30_000,
      `${workerLabel} stage setup`,
    );
    await withinTimeout(
      page.addScriptTag({content: runtime}),
      60_000,
      `${workerLabel} runtime load`,
    );
    await withinTimeout(page.evaluate(async (animationId) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("safe runtime did not register");
      await asset.ready();
    }, spec.animationId), 60_000, `${workerLabel} runtime ready`);
    const sampled = new Set(sampledFrames);
    const samples = [];
    for (let index = 0; index < allowedFrames.length; index += frameChunkSize) {
      const frames = allowedFrames.slice(index, index + frameChunkSize);
      const chunkSamples = await withinTimeout(page.evaluate(({
        animationId,
        frameDomain,
        frames,
        sampledFrames: chunkSampledFrames,
      }) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
        if (!asset) throw new Error("safe runtime did not register");
      const canvas = document.getElementById("stage");
      const context = canvas.getContext("2d", {willReadFrequently: true});
        const chunkSampled = new Set(chunkSampledFrames);
        const result = [];
        for (const frame of frames) {
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        if (state.localFrame !== frame || state.frameDomain !== frameDomain ||
          state.rootFrame !== 6 || state.audioRendered !== false) {
          throw new Error(`frame identity mismatch at ${frame}`);
        }
          if (chunkSampled.has(frame)) {
          const pixels = context.getImageData(0, 0, 800, 600).data;
          let hash = 2166136261;
          let nonTransparentPixelCount = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            for (let channel = 0; channel < 4; channel += 1) {
              hash ^= pixels[index + channel];
              hash = Math.imul(hash, 16777619);
            }
            if (pixels[index + 3] !== 0) nonTransparentPixelCount += 1;
          }
            result.push({
            frame,
            fnv1a32Rgba: (hash >>> 0).toString(16).padStart(8, "0"),
            nonTransparentPixelCount,
          });
        }
        }
        return result;
      }, {
        animationId: spec.animationId,
        frameDomain: spec.timeline.local.timelineId,
        frames,
        sampledFrames: frames.filter((frame) => sampled.has(frame)),
      }), Math.max(60_000, frames.length * 1_200),
      `${workerLabel} frames ${frames[0]}..${frames.at(-1)}`);
      samples.push(...chunkSamples);
    }
    for (let index = 0; index < blockedFrames.length; index += frameChunkSize) {
      const frames = blockedFrames.slice(index, index + frameChunkSize);
      await withinTimeout(page.evaluate(({animationId, frames}) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
        if (!asset) throw new Error("safe runtime did not register");
        const canvas = document.getElementById("stage");
        for (const frame of frames) {
        for (const operation of ["resolve", "render"]) {
          let rejected = false;
          try {
            const request = {frame, scenario: "source-static-frame", lang: "en", seed: 0};
            if (operation === "resolve") asset.resolveFrameState(request);
            else asset.render(canvas, request);
          } catch (error) {
            rejected = error instanceof Error &&
              error.message.includes("source behavior-dependent frame blocked");
          }
          if (!rejected) throw new Error(`blocked frame ${frame} passed ${operation}`);
        }
      }
      }, {animationId: spec.animationId, frames}),
      Math.max(60_000, frames.length * 1_200),
      `${workerLabel} blocked frames ${frames[0]}..${frames.at(-1)}`);
    }
    invariant(pageErrors.length === 0 && consoleErrors.length === 0 &&
      networkRequests.length === 0,
    `${spec.animationId}: browser sweep worker ${workerIndex + 1} emitted errors or network requests`);
    return {
      renderedFrameCount: allowedFrames.length,
      blockedFrameCount: blockedFrames.length,
      blockedRequestRejectionCount: blockedFrames.length * 2,
      samples,
    };
  } finally {
    await withinTimeout(
      page.close({runBeforeUnload: false}),
      15_000,
      `${spec.animationId}: browser page ${workerIndex + 1} close`,
    );
  }
}

async function browserSweep(browser, runtime, spec) {
  const allowedFrames = renderableFrames(
    spec.timeline.local.frameCount,
    spec.runtimeContract.blockedLocalFrameRanges,
  );
  const blockedFrames = Array.from(
    {length: spec.timeline.local.frameCount},
    (_, index) => index + 1,
  ).filter((frame) => !allowedFrames.includes(frame));
  const sampledFrames = [
    allowedFrames[0],
    allowedFrames[Math.floor((allowedFrames.length - 1) / 2)],
    allowedFrames.at(-1),
  ].filter((frame) => Number.isInteger(frame));
  const {
    frameChunkSize,
    pageFrameCapacity,
    timeoutMs: workerTimeoutMs,
    workerCount,
  } = browserSweepCapacity(
    spec.timeline.local.frameCount,
  );
  const partitions = [];
  for (let firstFrame = 1; firstFrame <= spec.timeline.local.frameCount;
    firstFrame += pageFrameCapacity) {
    const lastFrame = Math.min(
      spec.timeline.local.frameCount,
      firstFrame + pageFrameCapacity - 1,
    );
    partitions.push({
      allowedFrames: allowedFrames.filter((frame) =>
        frame >= firstFrame && frame <= lastFrame),
      blockedFrames: blockedFrames.filter((frame) =>
        frame >= firstFrame && frame <= lastFrame),
      workerIndex: partitions.length,
    });
  }
  const results = await withinTimeout((async () => {
    const pageResults = [];
    for (const partition of partitions) {
      pageResults.push(await sweepBrowserPartition({
        ...partition,
        browser,
        frameChunkSize,
        runtime,
        sampledFrames,
        spec,
      }));
    }
    return pageResults;
  })(), workerTimeoutMs, `${spec.animationId}: complete browser frame sweep`);
  const samples = results.flatMap(({samples: workerSamples}) => workerSamples)
    .sort((left, right) => left.frame - right.frame);
  invariant(samples.length === new Set(sampledFrames).size &&
    samples.every(({nonTransparentPixelCount}) =>
      nonTransparentPixelCount === 800 * 600),
  `${spec.animationId}: representative frame did not paint the full stage`);
  return Object.freeze({
    renderedFrameCount: results.reduce(
      (total, result) => total + result.renderedFrameCount,
      0,
    ),
    blockedFrameCount: results.reduce(
      (total, result) => total + result.blockedFrameCount,
      0,
    ),
    blockedRequestRejectionCount: results.reduce(
      (total, result) => total + result.blockedRequestRejectionCount,
      0,
    ),
    samples,
    browserSweepChunkSize: frameChunkSize,
    browserSweepPageCount: partitions.length,
    browserSweepPageFrameCapacity: pageFrameCapacity,
    browserSweepWorkerCount: workerCount,
    consoleErrorCount: 0,
    pageErrorCount: 0,
    unexpectedNetworkRequestCount: 0,
    nativeStage: Object.freeze({width: 800, height: 600}),
  });
}

async function buildMember({
  browser,
  ffdec,
  generator,
  member,
  profile,
  safeAdapter,
  temporaryRoot,
}) {
  const evidence = await inspectMember(member, profile);
  const resolvedProfile = evidence.profile;
  const fresh = await exportSprite(ffdec, member, evidence.target, temporaryRoot);
  const inspected = inspectFfdecCanvasExport(fresh.frames.toString("utf8"), {
    targetSpriteFunction: `sprite${evidence.target.objectId}`,
  });
  invariant(inspected.frameCount === evidence.target.frameCount,
    `${member.animationId}: FFDec/local frame count mismatch`);
  const structure = {
    schemaVersion: 1,
    artifactType: "g5-l3-source-static-prebinding-structure",
    animationId: member.animationId,
    releaseId: RELEASE_ID,
    lane: resolvedProfile.lane,
    source: {
      path: member.source.path,
      bytes: member.source.bytes,
      sha256: member.source.sha256,
    },
    machineEvidence: {
      report: withoutContents(evidence.machine),
      swfmill: withoutContents(evidence.swfmillGzip),
      scripts: withoutContents(evidence.scriptsGzip),
      audioAudit: withoutContents(evidence.audioAudit),
    },
    root: {
      frameCount: evidence.rootFrameCount,
      preloaderStopFrame: evidence.rootPreloader.stopFrame,
      preloaderNavigationFrame: evidence.rootPreloader.navigationFrame,
      preloaderNavigationAction: evidence.rootPreloader.navigationAction,
      beginFrame: 6,
      beginLabel: evidence.rootBeginLabel,
      placement: evidence.target,
    },
    target: {
      timelineId: `sprite-${evidence.target.objectId}`,
      frameCount: evidence.target.frameCount,
      blockedLocalFrameRanges: resolvedProfile.blockedLocalFrameRanges,
    },
    structuralOnly: true,
    runtimeSessionsExecuted: 0,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    generatedBy: withoutContents(generator),
  };
  const structureBytes = Buffer.from(stableJson(structure));
  const structureBinding = {
    path: `migrations/${member.animationId}/audit/source-static-prebinding-structure.json`,
    bytes: structureBytes.length,
    sha256: sha256(structureBytes),
  };
  const audio = associatedAudio(member);
  const spec = {
    schemaVersion: 1,
    animationId: member.animationId,
    classification: "source-static-current-javascript-engineering-candidate-only",
    title: `${member.title} — G5 L3 source-static product slice`,
    source: {
      swf: member.source.path,
      swfBytes: member.source.bytes,
      swfSha256: member.source.sha256,
      pairedFlaStatus: member.pairedFla ? "present" : "missing",
      fla: member.pairedFla?.path ?? null,
      flaBytes: member.pairedFla?.bytes ?? null,
      flaSha256: member.pairedFla?.sha256 ?? null,
      associatedAudioKind: audio.kind,
      associatedAudio: audio.path,
      associatedAudioBytes: audio.bytes,
      associatedAudioSha256: audio.sha256,
    },
    evidence: {
      prebindingStructure: structureBinding.path,
      prebindingStructureSha256: structureBinding.sha256,
      scenarioInventorySha256: structureBinding.sha256,
      audioAudit: evidence.audioAudit.path,
      audioAuditSha256: evidence.audioAudit.sha256,
    },
    ffdecExport: {
      tool: ffdec.version,
      helperSha256: sha256(fresh.helper),
      helperBytes: fresh.helper.length,
      framesHtmlSha256: sha256(fresh.frames),
      framesHtmlBytes: fresh.frames.length,
      targetSpriteObjectId: evidence.target.objectId,
      targetSpriteFunction: `sprite${evidence.target.objectId}`,
      exportCanvas: inspected.exportCanvas,
      exportInternalTranslation: inspected.exportInternalTranslation,
      expectedPlacedFunctionCount: inspected.placedFunctions.length,
      expectedPlacedFunctionsSha256: inspected.placedFunctionsSha256,
      expectedFontFunctionCount: inspected.fontFunctions.length,
      expectedFontFunctionsSha256: inspected.fontFunctionsSha256,
      embeddedImageVariableCount: inspected.imageVariables.length,
      embeddedImageVariablesSha256: inspected.imageVariablesSha256,
    },
    timeline: {
      fps: evidence.fps,
      stage: {
        width: 800,
        height: 600,
        backgroundColor: evidence.backgroundColor,
      },
      root: {
        frameCount: evidence.rootFrameCount,
        preloaderStopFrame: evidence.rootPreloader.stopFrame,
        preloaderNavigationFrame: evidence.rootPreloader.navigationFrame,
        preloaderNavigationAction: evidence.rootPreloader.navigationAction,
        beginFrame: 6,
        beginLabel: evidence.rootBeginLabel,
        placementName: evidence.target.instanceName,
        placementTwips: evidence.target.placementTwips,
        placementPixels: evidence.target.placementPixels,
      },
      local: {
        timelineId: `sprite-${evidence.target.objectId}`,
        frameCount: evidence.target.frameCount,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {
        x: evidence.target.placementPixels.x - inspected.exportInternalTranslation.x,
        y: evidence.target.placementPixels.y - inspected.exportInternalTranslation.y,
      },
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      blockedLocalFrameRanges: resolvedProfile.blockedLocalFrameRanges,
      unresolved: [
        "The legacy root host and natural runtime traversal are not rendered.",
        "The target drawing timeline is exposed without executing ActionScript; behavior-dependent ranges fail closed.",
        "Audio playback, Spanish visual disposition, terminal and Replay parity, full-frame original-runtime comparison, human review, Owner acceptance, strict completion, release, and publication remain separate gates.",
      ],
    },
    output: {
      ...candidateOutputPaths(member.animationId),
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    strictAcceptanceEffect: "none",
  };
  const compatibilitySpec = {
    ...spec,
    evidence: {
      ...spec.evidence,
      scenarioInventorySha256: structureBinding.sha256,
    },
  };
  const built = buildSafeRuntime({
    helperSource: fresh.helper.toString("utf8"),
    framesHtml: fresh.frames.toString("utf8"),
    spec: compatibilitySpec,
  });
  const browserQa = await browserSweep(browser, built.runtime, compatibilitySpec);
  const runtimeBytes = Buffer.from(built.runtime);
  const specBytes = Buffer.from(stableJson(spec));
  const manifest = {
    schemaVersion: 1,
    animationId: member.animationId,
    classification: spec.classification,
    status: "unregistered-source-static-product-slice-candidate",
    releaseId: RELEASE_ID,
    lane: resolvedProfile.lane,
    inputs: {
      spec: {path: `migrations/${member.animationId}/audit/source-static-current-js-candidate-spec.json`, bytes: specBytes.length, sha256: sha256(specBytes)},
      prebindingStructure: structureBinding,
      generator: withoutContents(generator),
      safeAdapter: withoutContents(safeAdapter),
      audio,
    },
    output: {
      script: spec.output.script,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: spec.output.globalRegistry,
      registeredInProductRegistry: false,
    },
    runtimeBoundary: {
      maturity: "legacy-prototype",
      actionScriptExecuted: false,
      controlsEnabled: false,
      audioRendered: false,
      supportedLanguages: ["en"],
      blockedLocalFrameRanges: resolvedProfile.blockedLocalFrameRanges,
    },
    timeline: built.metadata,
    browserQa,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
    registryChanged: false,
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  const report = {
    schemaVersion: 1,
    artifactType: "g5-l3-source-static-current-javascript-product-slice-candidate",
    animationId: member.animationId,
    releaseId: RELEASE_ID,
    lane: resolvedProfile.lane,
    source: structure.source,
    renderer: {
      kind: "safe-hash-bound-ffdec-canvas-source-static",
      frameDomain: spec.timeline.local.timelineId,
      frameCount: spec.timeline.local.frameCount,
      renderedFrameCount: browserQa.renderedFrameCount,
      blockedFrameCount: browserQa.blockedFrameCount,
      actionScriptExecuted: false,
      audioEnabled: false,
      controlsEnabled: false,
    },
    outputs: {
      runtime: {path: spec.output.script, bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)},
      manifest: {path: spec.output.manifest, bytes: manifestBytes.length, sha256: sha256(manifestBytes)},
    },
    browserQa,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
  };
  return Object.freeze({
    animationId: member.animationId,
    outputs: Object.freeze([
      Object.freeze({path: structureBinding.path, bytes: structureBytes}),
      Object.freeze({path: `migrations/${member.animationId}/audit/source-static-current-js-candidate-spec.json`, bytes: specBytes}),
      Object.freeze({path: spec.output.script, bytes: runtimeBytes}),
      Object.freeze({path: spec.output.manifest, bytes: manifestBytes}),
      Object.freeze({path: spec.output.report, bytes: Buffer.from(stableJson(report))}),
    ]),
    browserQa,
    target: evidence.target,
    runtime: {bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)},
  });
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}-${sha256(bytes).slice(0, 12)}`;
  await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
  await rename(temporary, target);
}

async function emit(output, check) {
  if (check) {
    const current = await readFile(projectPath(output.path));
    invariant(current.equals(output.bytes), `${output.path}: generated output is stale`);
  } else {
    await atomicWrite(output.path, output.bytes);
  }
}

function parseArguments(argv) {
  const options = {all: false, check: false, ffdec: "ffdec", ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--all") options.all = true;
    else if (argument === "--id" || argument === "--ffdec") {
      const value = argv[++index];
      invariant(value && !value.startsWith("-"), `${argument} requires one value`);
      if (argument === "--id") options.ids.push(value);
      else options.ffdec = value;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  if (!options.help) {
    invariant(!(options.all && options.ids.length),
      "--all and explicit --id are mutually exclusive");
    if (!options.ids.length && !options.all) options.ids = [...PRODUCT_SLICE_IDS];
    invariant(new Set(options.ids).size === options.ids.length,
      "duplicate --id is forbidden");
    for (const id of options.ids) {
      invariant(/^course-g05-l03-[a-z]{2}-\d{3}(?:-[a-f0-9]{8})?$/.test(id),
        `unsupported G5 L3 animation ID: ${id}`);
    }
  }
  return options;
}

export async function buildG5L3ProductSlice({
  all = false,
  check = false,
  ffdec = "ffdec",
  ids = [...PRODUCT_SLICE_IDS],
} = {}) {
  const [corpusBinding, generator, safeAdapter, ...protectedBefore] =
    await Promise.all([
      readBinding(CORPUS_RELATIVE),
      readBinding(SCRIPT_RELATIVE),
      readBinding(SAFE_ADAPTER_RELATIVE),
      ...PROTECTED_PATHS.map((relativePath) => readBinding(relativePath)),
    ]);
  const corpus = JSON.parse(corpusBinding.contents.toString("utf8"));
  invariant(corpus.release?.id === RELEASE_ID &&
    corpus.release.activePagePlacements === 65 &&
    corpus.release.uniqueAnimationRenderers === 64 &&
    corpus.release.legacyFlashCourseShellExcluded === true &&
    corpus.release.modernMyLessonHostRetained === true,
  "G5 L3 page-only corpus boundary drifted");
  const memberById = new Map(corpus.members.map((member) => [member.animationId, member]));
  const selectedIds = all
    ? corpus.members.map(({animationId}) => animationId)
    : ids;
  const selected = selectedIds.map((id) => {
    const member = memberById.get(id);
    invariant(member, `${id}: missing from the G5 L3 corpus`);
    return {
      ...member,
      title: `${member.animationId} — ${corpus.release.title}`,
    };
  });
  const ffdecTool = await inspectFfdec(ffdec);
  const browser = await chromium.launch({headless: true});
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l3-source-static-slice-"));
  const built = [];
  try {
    for (const [index, member] of selected.entries()) {
      process.stderr.write(
        `[g5-l3-factory] building ${index + 1}/${selected.length} ${member.animationId}\n`,
      );
      built.push(await buildMember({
        browser,
        ffdec: ffdecTool,
        generator,
        member,
        profile: PRODUCT_SLICE_PROFILES[member.animationId],
        safeAdapter,
        temporaryRoot,
      }));
      process.stderr.write(
        `[g5-l3-factory] verified ${index + 1}/${selected.length} ${member.animationId}\n`,
      );
    }
  } finally {
    await withinTimeout(browser.close(), 20_000, "G5 L3 factory browser close");
    await rm(temporaryRoot, {recursive: true, force: true});
  }
  for (const member of built) {
    for (const output of member.outputs) await emit(output, check);
  }
  const protectedAfter = await Promise.all(
    PROTECTED_PATHS.map((relativePath) => readBinding(relativePath)),
  );
  for (const [index, before] of protectedBefore.entries()) {
    const after = protectedAfter[index];
    invariant(before.bytes === after.bytes && before.sha256 === after.sha256,
      `${PROTECTED_PATHS[index]} changed during product-slice generation`);
  }
  return Object.freeze({
    schemaVersion: 1,
    operation: check ? "check" : "build",
    releaseId: RELEASE_ID,
    pageOnly: true,
    legacyFlashCourseShellExcluded: true,
    memberCount: built.length,
    ffdec: ffdecTool.version,
    corpus: withoutContents(corpusBinding),
    members: built.map(({outputs: _outputs, ...member}) => member),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

function help() {
  return `Usage: node ${SCRIPT_RELATIVE} [options]\n\n` +
    "  --id <animation-id>  Build one exact product-slice member (repeatable)\n" +
    "  --all                Build all 64 unique G5 L3 page renderers\n" +
    "  --check              Rebuild and verify outputs\n" +
    "  --ffdec <command>    FFDec launcher (default: ffdec)\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(help());
  else process.stdout.write(stableJson(await buildG5L3ProductSlice(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

export {parseArguments};
