#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L4_WAVE3_SOURCE_STATIC_IDS,
  G5_L4_WAVE3_SOURCE_STATIC_PROFILES,
} from "./materialize-g5-l4-wave3-source-static-specs.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes project root: ${relativePath}`);
  return resolved;
}

async function readArtifact(relativePath) {
  const absolutePath = projectPath(relativePath);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`);
  const bytes = await readFile(absolutePath);
  return {path: relativePath, bytes, sha256: sha256(bytes)};
}

function names(animationId) {
  const parts = animationId.split("-");
  const constant = parts.map((part) => part.toUpperCase()).join("_");
  const pascal = parts.map((part) =>
    /^\d+$/.test(part)
      ? part.padStart(3, "0")
      : `${part[0].toUpperCase()}${part.slice(1)}`,
  ).join("");
  return {constant, pascal};
}

function typescriptString(value) {
  return JSON.stringify(value);
}

function timelineSource(spec, assetSha256) {
  const {constant} = names(spec.animationId);
  const boundary = spec.runtimeContract.safePrefixBoundary;
  const [blocked] = spec.runtimeContract.blockedLocalFrameRanges;
  const source = spec.source;
  const root = spec.timeline.root;
  const flaFields = source.pairedFlaStatus === "present"
    ? `  fla: ${typescriptString(source.fla)},\n  flaSha256:\n    ${typescriptString(source.flaSha256)},`
    : "  fla: null,\n  flaSha256: null,";
  return `import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  ${typescriptString(blocked.reason)};

export const ${constant}_SOURCE = Object.freeze({
  swf: ${typescriptString(source.swf)},
  swfSha256:
    ${typescriptString(source.swfSha256)},
  pairedFlaStatus: ${typescriptString(source.pairedFlaStatus)},
${flaFields}
  associatedAudio:
    ${typescriptString(source.associatedAudio)},
  associatedAudioSha256:
    ${typescriptString(source.associatedAudioSha256)},
  spriteObjectId: ${spec.ffdecExport.targetSpriteObjectId},
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: ${typescriptString(root.placementName)},
  rootPlacementTwips: Object.freeze({x: ${root.placementTwips.x.toLocaleString("en-US").replaceAll(",", "_")}, y: ${root.placementTwips.y.toLocaleString("en-US").replaceAll(",", "_")}}),
  rootPlacementPixels: Object.freeze({x: ${root.placementPixels.x}, y: ${root.placementPixels.y}}),
  sourceStaticBoundary: Object.freeze({
    firstBlockedFrame: ${boundary.firstBlockedFrame},
    lastSafeFrame: ${boundary.lastSafeFrame},
    interactionKind: ${typescriptString(boundary.interactionKind)},
    behaviorReconstructed: false,
  }),
});

export const ${constant}_CONFIG = Object.freeze({
  animationId: ${typescriptString(spec.animationId)},
  title:
    ${typescriptString(`${spec.title} — English source-static safe-prefix engineering candidate`)},
  sourceSwfSha256: ${constant}_SOURCE.swfSha256,
  assetSource:
    ${typescriptString(`/flash-assets/courses/${spec.animationId}/canvas-renderer.js`)},
  assetSha256:
    ${typescriptString(assetSha256)},
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: ${typescriptString(spec.timeline.local.timelineId)},
  mainFrameCount: ${spec.timeline.local.frameCount},
  livePlaybackEndFrame: ${boundary.lastSafeFrame},
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: ${blocked.firstFrame},
      lastFrame: ${blocked.lastFrame},
      reason: BLOCKED_REASON,
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: ${typescriptString(`${spec.animationId.slice("course-g05-l04-".length)}-source-drawing-safe-prefix`)},
      firstFrame: 1,
      lastFrame: ${boundary.lastSafeFrame},
    }),
  ]),
  sourceControlBehaviorLabel:
    ${typescriptString(`Frames ${boundary.firstBlockedFrame}..${spec.timeline.local.frameCount}, source controls, ActionScript branches, associated audio, Spanish visuals, terminal state, and Replay are disabled`)},
} satisfies SourceStaticCanvasCandidateConfig);

export const ${constant}_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
`;
}

function moduleSource(spec) {
  const {constant, pascal} = names(spec.animationId);
  return `"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  ${constant}_CONFIG,
  ${constant}_SOURCE,
} from "../timelines/${spec.animationId}";

const candidate = createSourceStaticCanvasCandidate(
  ${constant}_CONFIG,
);

export {${constant}_SOURCE};
export const ${constant}_MOVIE = candidate.movie;
export const ${constant}_RUNTIME = candidate.runtime;
export const ${constant}_SOURCE_CONTRACT = candidate.sourceContract;
export const ${constant}_SCENARIOS = candidate.scenarios;
export const normalize${pascal}Frame = candidate.normalizeFrame;
export const get${pascal}FrameState = candidate.getFrameState;
export const build${pascal}CaptureAttributes =
  candidate.buildCaptureAttributes;
export const ${pascal}Renderer = candidate.Renderer;

export default candidate.module;
`;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function emit(relativePath, bytes, check) {
  if (check) {
    const current = await readFile(projectPath(relativePath));
    invariant(current.equals(bytes), `${relativePath}: generated module is stale`);
    return;
  }
  await atomicWrite(relativePath, bytes);
}

export function parseArguments(argv) {
  const options = {check: false, ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--id") {
      const value = argv[++index];
      invariant(value && !value.startsWith("-"), "--id requires one value");
      options.ids.push(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    if (options.ids.length === 0) {
      options.ids = [...G5_L4_WAVE3_SOURCE_STATIC_IDS];
    }
    invariant(new Set(options.ids).size === options.ids.length,
      "duplicate --id is forbidden");
    for (const animationId of options.ids) {
      invariant(G5_L4_WAVE3_SOURCE_STATIC_IDS.includes(animationId),
        `unsupported animation ID: ${animationId}`);
    }
  }
  return options;
}

export async function materializeWave3Modules({
  check = false,
  ids = [...G5_L4_WAVE3_SOURCE_STATIC_IDS],
} = {}) {
  const results = [];
  for (const animationId of ids) {
    const profile = G5_L4_WAVE3_SOURCE_STATIC_PROFILES.find(
      (candidate) => candidate.animationId === animationId,
    );
    invariant(profile, `unsupported animation ID: ${animationId}`);
    const [specArtifact, manifestArtifact, runtimeArtifact] =
      await Promise.all([
        readArtifact(
          `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`,
        ),
        readArtifact(
          `public/flash-assets/courses/${animationId}/manifest.json`,
        ),
        readArtifact(
          `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
        ),
      ]);
    const spec = JSON.parse(specArtifact.bytes.toString("utf8"));
    const manifest = JSON.parse(manifestArtifact.bytes.toString("utf8"));
    invariant(spec.animationId === animationId &&
      manifest.animationId === animationId &&
      manifest.output?.sha256 === runtimeArtifact.sha256 &&
      manifest.output.bytes === runtimeArtifact.bytes.length,
    `${animationId}: generated runtime lineage is incomplete`);
    invariant(
      spec.runtimeContract.safePrefixBoundary?.lastSafeFrame ===
        profile.firstBlockedFrame - 1,
      `${animationId}: safe-prefix boundary drifted`,
    );
    const timeline =
      `packages/demos/src/timelines/${animationId}.ts`;
    const module = `packages/demos/src/modules/${animationId}.tsx`;
    const timelineBytes = Buffer.from(
      timelineSource(spec, runtimeArtifact.sha256),
    );
    const moduleBytes = Buffer.from(moduleSource(spec));
    await Promise.all([
      emit(timeline, timelineBytes, check),
      emit(module, moduleBytes, check),
    ]);
    results.push({
      animationId,
      timeline: {path: timeline, sha256: sha256(timelineBytes)},
      module: {path: module, sha256: sha256(moduleBytes)},
      assetSha256: runtimeArtifact.sha256,
      strictAcceptanceEffect: "none",
    });
  }
  return {
    schemaVersion: 1,
    operation: check ? "check" : "materialize",
    memberCount: results.length,
    results,
    registryChanged: false,
    strictAcceptanceEffect: "none",
  };
}

function help() {
  return [
    `Usage: node ${path.relative(ROOT, scriptPath)} [options]`,
    "",
    "Options:",
    "  --id <animation-id>  Materialize one bounded module pair (repeatable)",
    "  --check              Rebuild and compare without writing",
    "  -h, --help           Show this help",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${help()}\n`);
  else process.stdout.write(`${JSON.stringify(
    await materializeWave3Modules(options),
    null,
    2,
  )}\n`);
}
