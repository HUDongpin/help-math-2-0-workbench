#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  deriveReleaseSourceStaticProfile,
} from "./build-release-source-static-engineering-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";
const PROTECTED_REGISTRY_PATHS = Object.freeze([
  "packages/demos/prototype-registry.json",
  "packages/demos/src/registry.generated.ts",
  "packages/demos/src/prototype-manifest.ts",
  "apps/web/lib/whole-lesson-course-registry.ts",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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
    !path.isAbsolute(relative), `project path escapes root: ${relativePath}`);
  return resolved;
}

async function readBinding(relativePath) {
  const absolutePath = projectPath(relativePath);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`);
  const bytes = await readFile(absolutePath);
  return {path: portable(relativePath), bytes, sha256: sha256(bytes)};
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

function timelineSource(profile, manifest, manifestSha256) {
  const {constant} = names(profile.animationId);
  const native = profile.stage.native;
  const backing = profile.stage.backing;
  const placement = profile.root.placement;
  const fla = profile.source.fla
    ? `  fla: ${typescriptString(profile.source.fla.path)},\n  flaSha256:\n    ${typescriptString(profile.source.fla.sha256)},`
    : "  fla: null,\n  flaSha256: null,";
  return `import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const ${constant}_SOURCE = Object.freeze({
  releaseId: ${typescriptString(profile.release.releaseId)},
  releaseOrdinal: ${profile.release.releaseOrdinal},
  swf: ${typescriptString(profile.source.swf.path)},
  swfSha256:
    ${typescriptString(profile.source.swf.sha256)},
  pairedFlaStatus: ${typescriptString(profile.source.pairedFlaStatus)},
${fla}
  sourceStaticFrameDomain: ${typescriptString(profile.target.timelineId)},
  sourceStaticFrameCount: ${profile.target.frameCount},
  rootBeginFrame: ${profile.root.beginFrame},
  rootPlacement: Object.freeze({
    instanceName: ${typescriptString(placement.instanceName)},
    depth: ${typescriptString(placement.depth)},
    placementTwips: Object.freeze({x: ${placement.placementTwips.x}, y: ${placement.placementTwips.y}}),
    placementPixels: Object.freeze({x: ${placement.placementPixels.x}, y: ${placement.placementPixels.y}}),
  }),
  candidateManifest: ${typescriptString(`public/flash-assets/courses/${profile.animationId}/manifest.json`)},
  candidateManifestSha256:
    ${typescriptString(manifestSha256)},
  actionScriptExecuted: false,
  audioCues: Object.freeze([]),
  controlsEnabled: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const ${constant}_CONFIG = Object.freeze({
  animationId: ${typescriptString(profile.animationId)},
  title:
    ${typescriptString(`${profile.title} — fixed-English source-static engineering candidate`)},
  sourceSwfSha256: ${constant}_SOURCE.swfSha256,
  assetSource:
    ${typescriptString(`/flash-assets/courses/${profile.animationId}/canvas-renderer.js`)},
  assetSha256:
    ${typescriptString(manifest.output.sha256)},
  stage: Object.freeze({
    width: ${native.width},
    height: ${native.height},
    backgroundColor: ${typescriptString(native.backgroundColor)},
  }),
  nativeStage: Object.freeze({
    width: ${native.width},
    height: ${native.height},
    backgroundColor: ${typescriptString(native.backgroundColor)},
  }),
  backingStage: Object.freeze({width: ${backing.width}, height: ${backing.height}}),
  fps: ${profile.fps},
  rootFrameCount: ${profile.root.frameCount},
  rootBeginFrame: ${profile.root.beginFrame},
  mainFrameDomain: ${typescriptString(profile.target.timelineId)},
  mainFrameCount: ${profile.target.frameCount},
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: ${typescriptString(`${profile.target.timelineId}-ffdec-source-static-drawing`)},
      firstFrame: 1,
      lastFrame: ${profile.target.frameCount},
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, controls, audio, Spanish visuals, natural runtime, terminal state, Replay, and fidelity are unresolved and disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const ${constant}_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
`;
}

function moduleSource(profile) {
  const {constant, pascal} = names(profile.animationId);
  return `"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  ${constant}_CONFIG,
  ${constant}_SOURCE,
} from "../timelines/${profile.animationId}";

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
  } else {
    await atomicWrite(relativePath, bytes);
  }
}

export function parseArguments(argv) {
  const options = {check: false, ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--release-id", "--id"].includes(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("-"), `${argument} requires one value`);
      if (argument === "--release-id") {
        invariant(!options.releaseId, "duplicate --release-id is forbidden");
        options.releaseId = value;
      } else options.ids.push(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.releaseId, "--release-id is required");
    invariant(options.ids.length > 0,
      "at least one exact --id is required; whole-release materialization is forbidden");
    invariant(new Set(options.ids).size === options.ids.length,
      "duplicate --id is forbidden");
  }
  return options;
}

export async function materializeReleaseSourceStaticEngineeringModules({
  check = false,
  ids,
  releaseId,
} = {}) {
  invariant(releaseId, "exact releaseId is required");
  invariant(Array.isArray(ids) && ids.length > 0,
    "exact non-empty candidate subset is required");
  const releaseBinding = await readBinding(RELEASE_CATALOG_PATH);
  const releaseCatalog = JSON.parse(releaseBinding.bytes.toString("utf8"));
  const release = releaseCatalog.releases?.find((candidate) =>
    candidate.releaseId === releaseId);
  invariant(release, `unknown release ID: ${releaseId}`);
  const protectedBefore = Object.fromEntries(await Promise.all(
    PROTECTED_REGISTRY_PATHS.map(async (relativePath) => [
      relativePath,
      (await readBinding(relativePath)).sha256,
    ]),
  ));
  const prepared = [];
  for (const animationId of ids) {
    const profile = await deriveReleaseSourceStaticProfile({
      animationId,
      release,
    });
    const runtimePath =
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`;
    const manifestPath =
      `public/flash-assets/courses/${animationId}/manifest.json`;
    const [runtimeBinding, manifestBinding] = await Promise.all([
      readBinding(runtimePath),
      readBinding(manifestPath),
    ]);
    const manifest = JSON.parse(manifestBinding.bytes.toString("utf8"));
    invariant(
      manifest.animationId === animationId &&
        manifest.classification ===
          "source-static-current-javascript-engineering-candidate-only" &&
        manifest.status === "unregistered-acceptance-neutral-engineering-artifact" &&
        manifest.output?.script === runtimePath &&
        manifest.output.sha256 === runtimeBinding.sha256 &&
        manifest.output.bytes === runtimeBinding.bytes.length &&
        manifest.output.registeredInProductRegistry === false &&
        manifest.runtimeBoundary?.maturity === "legacy-prototype" &&
        manifest.runtimeBoundary?.actionScriptExecuted === false &&
        manifest.runtimeBoundary?.controlsEnabled === false &&
        manifest.runtimeBoundary?.audioCues?.length === 0 &&
        manifest.strictAcceptanceEffect === "none" &&
        manifest.registryChanged === false,
      `${animationId}: candidate runtime lineage or acceptance boundary is invalid`,
    );
    invariant(
      manifest.timeline?.sourceStaticFrameDomain?.timelineId ===
        profile.target.timelineId &&
        manifest.timeline.sourceStaticFrameDomain.frameCount ===
          profile.target.frameCount &&
        JSON.stringify(manifest.timeline.nativeStage) ===
          JSON.stringify(profile.stage.native) &&
        JSON.stringify(manifest.timeline.backingStage) ===
          JSON.stringify(profile.stage.backing) &&
        JSON.stringify(manifest.exactDirectNamedChildPlacement) ===
          JSON.stringify(profile.root.placement),
      `${animationId}: candidate manifest differs from current hash-bound evidence`,
    );
    const timelinePath = `packages/demos/src/timelines/${animationId}.ts`;
    const modulePath = `packages/demos/src/modules/${animationId}.tsx`;
    const timelineBytes = Buffer.from(
      timelineSource(profile, manifest, manifestBinding.sha256),
    );
    const moduleBytes = Buffer.from(moduleSource(profile));
    prepared.push({
      animationId,
      profile,
      timeline: {path: timelinePath, bytes: timelineBytes},
      module: {path: modulePath, bytes: moduleBytes},
      assetSha256: runtimeBinding.sha256,
    });
  }
  for (const candidate of prepared) {
    await emit(candidate.timeline.path, candidate.timeline.bytes, check);
    await emit(candidate.module.path, candidate.module.bytes, check);
  }
  const protectedAfter = Object.fromEntries(await Promise.all(
    PROTECTED_REGISTRY_PATHS.map(async (relativePath) => [
      relativePath,
      (await readBinding(relativePath)).sha256,
    ]),
  ));
  invariant(JSON.stringify(protectedAfter) === JSON.stringify(protectedBefore),
    "protected product registry changed during unregistered module materialization");
  return {
    schemaVersion: 1,
    operation: check ? "check" : "materialize",
    releaseId,
    selectedMemberCount: prepared.length,
    results: prepared.map((candidate) => ({
      animationId: candidate.animationId,
      timeline: {
        path: candidate.timeline.path,
        sha256: sha256(candidate.timeline.bytes),
      },
      module: {
        path: candidate.module.path,
        sha256: sha256(candidate.module.bytes),
      },
      assetSha256: candidate.assetSha256,
      registered: false,
      strictAcceptanceEffect: "none",
    })),
    protectedRegistriesUnchanged: true,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
}

function help() {
  return [
    `Usage: node ${portable(path.relative(ROOT, scriptPath))} --release-id ID --id ANIMATION [--id ANIMATION ...] [options]`,
    "",
    "Options:",
    "  --release-id <id>  Exact atomic lesson release",
    "  --id <animation>    Exact generated candidate subset member (repeatable)",
    "  --check              Compare generated module pairs without writing",
    "  -h, --help           Show this help",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${help()}\n`);
    else process.stdout.write(`${JSON.stringify(
      await materializeReleaseSourceStaticEngineeringModules(options),
      null,
      2,
    )}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
