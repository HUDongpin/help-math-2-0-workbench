#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const ROOT_PLACEMENT_PARSER =
  "scripts/parse-swfmill-course-placement.py";

const dragReason = (firstFrame, lastFrame) =>
  `Frames ${firstFrame}..${lastFrame} begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.`;
const answerReason = (firstFrame, lastFrame) =>
  `Frames ${firstFrame}..${lastFrame} begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.`;

export const G5_L4_WAVE3_SOURCE_STATIC_PROFILES = Object.freeze([
  ["course-g05-l04-vb-003", 95, 175, 126, "drag"],
  ["course-g05-l04-vb-004", 71, 257, 209, "drag"],
  ["course-g05-l04-in-006", 103, 464, 414, "drag"],
  ["course-g05-l04-in-008", 123, 195, 122, "drag"],
  ["course-g05-l04-in-011", 231, 428, 342, "drag"],
  ["course-g05-l04-in-019", 265, 274, 221, "drag"],
  ["course-g05-l04-in-021", 97, 288, 287, "drag"],
  ["course-g05-l04-in-022", 355, 475, 412, "drag"],
  ["course-g05-l04-ti-002", 413, 275, 257, "drag"],
  ["course-g05-l04-ti-003", 270, 164, 163, "drag"],
  ["course-g05-l04-ti-004", 299, 472, 198, "answer-button"],
  ["course-g05-l04-ti-005", 272, 363, 138, "answer-button"],
  ["course-g05-l04-ti-006", 191, 237, 188, "answer-release"],
  ["course-g05-l04-ti-007", 177, 167, 112, "drag"],
  ["course-g05-l04-ti-008", 160, 146, 95, "drag"],
  ["course-g05-l04-ti-009", 171, 114, 97, "drag"],
  ["course-g05-l04-gs-002", 436, 460, 452, "random-game"],
].map(([animationId, objectId, frameCount, firstBlockedFrame,
  interactionKind]) => Object.freeze({
  animationId,
  objectId,
  frameCount,
  firstBlockedFrame,
  interactionKind,
  reason: interactionKind === "drag"
    ? dragReason(firstBlockedFrame, frameCount)
    : interactionKind === "random-game"
      ? "Frames 452..460 begin a stop- and release-handler-controlled randomized game; question selection, scoring/timer state, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state."
      : answerReason(firstBlockedFrame, frameCount),
})));

export const G5_L4_WAVE3_SOURCE_STATIC_IDS = Object.freeze(
  G5_L4_WAVE3_SOURCE_STATIC_PROFILES.map(({animationId}) => animationId),
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
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
  return {
    path: relativePath,
    bytes,
    byteLength: bytes.length,
    sha256: sha256(bytes),
    text: bytes.toString("utf8"),
  };
}

async function optionalArtifact(relativePath) {
  try {
    return await readArtifact(relativePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function parseJson(artifact, label = artifact.path) {
  try {
    return JSON.parse(artifact.text);
  } catch (error) {
    throw new Error(`${label}: invalid JSON`, {cause: error});
  }
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(
    EXPECTED_FFDEC_VERSION),
  `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`);
  return command;
}

async function rootPlacement(profile) {
  const swfmillPath =
    `migrations/${profile.animationId}/audit/machine/swfmill.xml.gz`;
  const result = await execFile("python3", [
    projectPath(ROOT_PLACEMENT_PARSER),
    "--swfmill", projectPath(swfmillPath),
    "--object-id", String(profile.objectId),
    "--placement-name", "animation",
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const parsed = JSON.parse(result.stdout);
  invariant(parsed.stage?.width === 800 && parsed.stage.height === 600 &&
    parsed.fps === 12 && parsed.rootFrameCount === 10 &&
    parsed.targetSprite?.objectId === profile.objectId &&
    parsed.targetSprite.frameCount === profile.frameCount &&
    parsed.rootPlacement?.name === "animation" &&
    parsed.rootPlacement.objectId === profile.objectId,
  `${profile.animationId}: swfmill root/local placement contract drifted`);
  return {parsed, swfmill: await readArtifact(swfmillPath)};
}

function parseFfdecExport(profile, helper, frames) {
  const source = frames.toString("utf8").replace(/\r\n?/g, "\n");
  const canvas = source.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/,
  );
  const target = `sprite${profile.objectId}`;
  const targetHeader = new RegExp(
    `function\\s+${target}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
    "ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1," +
    "([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*" +
    "var frame_cnt = (\\d+);",
  );
  const header = source.match(targetHeader);
  invariant(canvas && header,
    `${profile.animationId}: fresh FFDec export shape is unrecognized`);
  invariant(Number(header[3]) === profile.frameCount,
    `${profile.animationId}: fresh FFDec target frame count drifted`);
  const placed = [...new Set([...source.matchAll(
    /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g,
  )].map((match) => match[1]))].sort();
  const images = [...source.matchAll(
    /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/g,
  )].map((match) => match[1]);
  const fonts = [...source.matchAll(
    /function\s+(font\d+)\(ctx,ch,textColor\)\{/g,
  )].map((match) => match[1]);
  invariant(placed.length > 0 && fonts.length > 0,
    `${profile.animationId}: FFDec drawing inventory is unexpectedly empty`);
  return {
    tool: EXPECTED_FFDEC_VERSION,
    helperSha256: sha256(helper),
    helperBytes: helper.length,
    framesHtmlSha256: sha256(frames),
    framesHtmlBytes: frames.length,
    targetSpriteObjectId: profile.objectId,
    targetSpriteFunction: target,
    exportCanvas: {width: Number(canvas[1]), height: Number(canvas[2])},
    exportInternalTranslation: {
      x: Number(header[1]),
      y: Number(header[2]),
    },
    expectedPlacedFunctionCount: placed.length,
    expectedPlacedFunctionsSha256: sha256(JSON.stringify(placed)),
    embeddedImageVariableCount: images.length,
    embeddedImageVariablesSha256: sha256(JSON.stringify(images)),
    expectedFontFunctionCount: fonts.length,
    expectedFontFunctionsSha256: sha256(JSON.stringify(fonts)),
  };
}

async function freshFfdecExport(profile, ffdec, temporaryRoot, sourceSwf) {
  const output = path.join(temporaryRoot, profile.animationId);
  const result = await execFile(ffdec, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(profile.objectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    output,
    projectPath(sourceSwf),
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(
    EXPECTED_FFDEC_VERSION),
  `${profile.animationId}: FFDec export version changed`);
  const exportRoot = path.join(
    output,
    `DefineSprite_${profile.objectId}`,
  );
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportRoot, "canvas.js")),
    readFile(path.join(exportRoot, "frames.html")),
  ]);
  return parseFfdecExport(profile, helper, frames);
}

function validateBoundary(profile, scenario, disposition, scriptInventory) {
  invariant(scenario.animationId === profile.animationId &&
    disposition.animationId === profile.animationId &&
    scriptInventory.animationId === profile.animationId,
  `${profile.animationId}: static evidence identity drifted`);
  const timeline = scenario.timelineInventory?.find(
    ({timelineId}) => timelineId === `sprite-${profile.objectId}`,
  );
  invariant(timeline?.frameCount === profile.frameCount,
    `${profile.animationId}: scenario target timeline drifted`);
  const nonInitialStops = (timeline.controlStates ?? [])
    .filter(({frame, reasons}) => frame > 1 &&
      reasons.includes("script-stop-state"))
    .sort((left, right) => left.frame - right.frame);
  invariant(nonInitialStops[0]?.frame === profile.firstBlockedFrame,
    `${profile.animationId}: first non-initial stop no longer begins the blocked range`);
  invariant(nonInitialStops[0].reasons.includes("structural-action:DoAction"),
    `${profile.animationId}: blocked boundary lost its DoAction signal`);
  if (profile.interactionKind === "drag") {
    invariant(nonInitialStops[0].reasons.includes("event-handler:press") &&
      nonInitialStops[0].reasons.includes(
        "event-handler:releaseOutside+release"),
    `${profile.animationId}: drag boundary signals drifted`);
  } else if (["answer-release", "random-game"].includes(
    profile.interactionKind,
  )) {
    invariant(nonInitialStops[0].reasons.includes("event-handler:release"),
      `${profile.animationId}: release boundary signal drifted`);
  }
  const targetDisposition = disposition.timelines?.find(
    ({timelineId}) => timelineId === `sprite-${profile.objectId}`,
  );
  invariant(disposition.status ===
    "structurally-enumerated-dispositions-unresolved" &&
    targetDisposition?.frameCount === profile.frameCount &&
    targetDisposition.disposition === "unresolved",
  `${profile.animationId}: prebinding target disposition is not unresolved`);
  const scripts = scriptInventory.scripts ?? [];
  const boundaryAction =
    `DefineSprite_${profile.objectId}/frame_${profile.firstBlockedFrame}/DoAction.as`;
  invariant(scripts.some(({sourcePath}) => sourcePath === boundaryAction),
    `${profile.animationId}: boundary DoAction script is missing`);
  const interactiveScriptFound = profile.interactionKind === "answer-button"
    ? scripts.some(({sourcePath}) =>
      /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/.test(
        sourcePath,
      ))
    : scripts.some(({sourcePath}) =>
      sourcePath.startsWith(
        `DefineSprite_${profile.objectId}/frame_${profile.firstBlockedFrame}/`,
      ) && sourcePath.includes("CLIPACTIONRECORD"));
  invariant(interactiveScriptFound,
    `${profile.animationId}: static interactive script evidence is missing`);
  return {
    firstNonInitialStopFrame: nonInitialStops[0].frame,
    firstBlockedFrame: profile.firstBlockedFrame,
    lastSafeFrame: profile.firstBlockedFrame - 1,
    interactionKind: profile.interactionKind,
    requiredReasons: nonInitialStops[0].reasons,
    boundaryDoActionSourcePath: boundaryAction,
    sourceStaticInferenceOnly: true,
    authoritativeRuntimeReachabilityEstablished: false,
    behaviorReconstructed: false,
  };
}

async function evidenceArtifacts(animationId) {
  const immutableRoot =
    `migrations/${animationId}/evidence/source-static-prebinding-antecedents`;
  const immutableScenario = `${immutableRoot}/scenario-inventory.json`;
  const immutableDisposition = `${immutableRoot}/frame-domain-disposition.json`;
  const [scenarioAntecedent, dispositionAntecedent] = await Promise.all([
    optionalArtifact(immutableScenario),
    optionalArtifact(immutableDisposition),
  ]);
  invariant(Boolean(scenarioAntecedent) === Boolean(dispositionAntecedent),
    `${animationId}: partial immutable antecedent pair exists`);
  const scenarioPath = scenarioAntecedent
    ? immutableScenario
    : `migrations/${animationId}/audit/scenario-inventory.json`;
  const dispositionPath = dispositionAntecedent
    ? immutableDisposition
    : `migrations/${animationId}/audit/frame-domain-disposition.json`;
  const [scenario, disposition, audioAudit, scriptInventory] =
    await Promise.all([
      scenarioAntecedent ?? readArtifact(scenarioPath),
      dispositionAntecedent ?? readArtifact(dispositionPath),
      readArtifact(
        `migrations/${animationId}/audit/audio-runtime-evidence.json`,
      ),
      readArtifact(`migrations/${animationId}/audit/script-inventory.json`),
    ]);
  return {
    scenario,
    scenarioPath,
    disposition,
    dispositionPath,
    audioAudit,
    scriptInventory,
    immutable: Boolean(scenarioAntecedent),
  };
}

async function buildSpec(profile, ffdec, temporaryRoot) {
  const animationId = profile.animationId;
  const migrationArtifact = await readArtifact(
    `migrations/${animationId}/migration.json`,
  );
  const migration = parseJson(migrationArtifact);
  invariant(migration.animationId === animationId &&
    migration.status === "preserved",
  `${animationId}: migration manifest must remain preserved`);
  const sourceSwf = await readArtifact(migration.source.swf);
  invariant(sourceSwf.sha256 === migration.source.swfSha256,
    `${animationId}: source SWF hash differs from migration manifest`);
  const pairedFlaStatus = migration.source.pairedFlaStatus;
  invariant(["present", "missing"].includes(pairedFlaStatus),
    `${animationId}: paired FLA status is invalid`);
  const sourceFla = pairedFlaStatus === "present"
    ? await readArtifact(migration.source.fla)
    : null;
  if (sourceFla) {
    invariant(sourceFla.sha256 === migration.source.flaSha256,
      `${animationId}: source FLA hash differs from migration manifest`);
  } else {
    invariant(!migration.source.fla && !migration.source.flaSha256,
      `${animationId}: missing FLA evidence is inconsistent`);
  }
  const audioAssociations = migration.audio?.catalogExactAssociations ?? [];
  invariant(audioAssociations.length === 1,
    `${animationId}: exactly one associated audio file is required`);
  const [audioAssociation] = audioAssociations;
  const associatedAudio = await readArtifact(audioAssociation.sourceFile);
  invariant(associatedAudio.sha256 === audioAssociation.sha256 &&
    associatedAudio.byteLength === audioAssociation.bytes,
  `${animationId}: associated audio binding drifted`);
  const [placement, evidence, ffdecExport] = await Promise.all([
    rootPlacement(profile),
    evidenceArtifacts(animationId),
    freshFfdecExport(profile, ffdec, temporaryRoot, migration.source.swf),
  ]);
  const scenario = parseJson(evidence.scenario);
  const disposition = parseJson(evidence.disposition);
  const scriptInventory = parseJson(evidence.scriptInventory);
  invariant(scenario.source?.swfSha256 === sourceSwf.sha256 &&
    scenario.source?.pairedFlaStatus === pairedFlaStatus &&
    scenario.source?.flaSha256 === (sourceFla?.sha256 ?? null),
  `${animationId}: scenario source identity drifted`);
  const boundary = validateBoundary(
    profile,
    scenario,
    disposition,
    scriptInventory,
  );
  const root = placement.parsed.rootPlacement;
  const exportTranslation = ffdecExport.exportInternalTranslation;
  const evidenceBinding = evidence.immutable
    ? {
        prebindingScenarioInventory: evidence.scenarioPath,
        prebindingScenarioInventorySha256: evidence.scenario.sha256,
        prebindingFrameDomainDisposition: evidence.dispositionPath,
        prebindingFrameDomainDispositionSha256:
          evidence.disposition.sha256,
      }
    : {
        scenarioInventory: evidence.scenarioPath,
        scenarioInventorySha256: evidence.scenario.sha256,
        frameDomainDisposition: evidence.dispositionPath,
        frameDomainDispositionSha256: evidence.disposition.sha256,
      };
  return {
    schemaVersion: 1,
    animationId,
    classification:
      "source-static-current-javascript-engineering-candidate-only",
    title: migration.classification.titleDisplay,
    source: {
      swf: migration.source.swf,
      swfBytes: sourceSwf.byteLength,
      swfSha256: sourceSwf.sha256,
      pairedFlaStatus,
      fla: sourceFla?.path ?? null,
      flaBytes: sourceFla?.byteLength ?? null,
      flaSha256: sourceFla?.sha256 ?? null,
      associatedAudio: associatedAudio.path,
      associatedAudioBytes: associatedAudio.byteLength,
      associatedAudioSha256: associatedAudio.sha256,
    },
    evidence: {
      ...evidenceBinding,
      audioAudit: evidence.audioAudit.path,
      audioAuditSha256: evidence.audioAudit.sha256,
      boundaryScriptInventory: evidence.scriptInventory.path,
      boundaryScriptInventorySha256: evidence.scriptInventory.sha256,
      swfmillStructure:
        `migrations/${animationId}/audit/machine/swfmill.xml.gz`,
      swfmillStructureSha256: placement.swfmill.sha256,
    },
    ffdecExport,
    timeline: {
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "begin",
        placementName: root.name,
        placementTwips: {
          x: root.translationTwips.x,
          y: root.translationTwips.y,
        },
        placementPixels: {
          x: root.translationPixels.x,
          y: root.translationPixels.y,
        },
      },
      local: {
        timelineId: `sprite-${profile.objectId}`,
        frameCount: profile.frameCount,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {
        x: root.translationPixels.x - exportTranslation.x,
        y: root.translationPixels.y - exportTranslation.y,
      },
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      blockedLocalFrameRanges: [{
        firstFrame: profile.firstBlockedFrame,
        lastFrame: profile.frameCount,
        reason: profile.reason,
      }],
      safePrefixBoundary: boundary,
      unresolved: [
        "The 10-frame root and InternalPreloader host entry have no authoritative original-runtime baseline and are not rendered.",
        `Only sprite-${profile.objectId} frames 1..${profile.firstBlockedFrame - 1} are exposed. Frames ${profile.firstBlockedFrame}..${profile.frameCount} are rejected beginning at the first non-initial source stop state; no interactive continuation is inferred.`,
        "Source controls are inert. Hit targets, click/drag branches, attempt/scoring state, randomized selection where present, feedback, associated audio, Spanish visuals, natural runtime reachability, terminal and Replay parity, RMSE, human review, Owner acceptance, strict completion, and publication remain unresolved.",
      ],
      prebindingTargetFrameDomainDisposition: "unresolved",
      currentCanonicalFrameDomainDispositionAsserted: false,
    },
    output: {
      script:
        `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      manifest: `public/flash-assets/courses/${animationId}/manifest.json`,
      report:
        `migrations/${animationId}/evidence/source-static-current-js-candidate.json`,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    strictAcceptanceEffect: "none",
  };
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
    invariant(current.equals(bytes), `${relativePath}: generated spec is stale`);
    return;
  }
  await atomicWrite(relativePath, bytes);
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--id" || argument === "--ffdec") {
      const value = argv[++index];
      invariant(value && !value.startsWith("-"),
        `${argument} requires one value`);
      if (argument === "--id") options.ids.push(value);
      else options.ffdec = value;
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

export async function materializeWave3Specs({
  check = false,
  ffdec = "ffdec",
  ids = [...G5_L4_WAVE3_SOURCE_STATIC_IDS],
} = {}) {
  const command = await inspectFfdec(ffdec);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "help-math-g5-l4-wave3-specs-"),
  );
  const results = [];
  try {
    for (const animationId of ids) {
      const profile = G5_L4_WAVE3_SOURCE_STATIC_PROFILES.find(
        (candidate) => candidate.animationId === animationId,
      );
      invariant(profile, `unsupported animation ID: ${animationId}`);
      const spec = await buildSpec(profile, command, temporaryRoot);
      const output =
        `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`;
      const bytes = stableJson(spec);
      await emit(output, bytes, check);
      results.push({
        animationId,
        output,
        bytes: bytes.length,
        sha256: sha256(bytes),
        frameDomain: spec.timeline.local.timelineId,
        frameCount: spec.timeline.local.frameCount,
        renderableFrameCount: profile.firstBlockedFrame - 1,
        blockedFrameCount:
          profile.frameCount - profile.firstBlockedFrame + 1,
        immutablePrebindingEvidence:
          spec.evidence.prebindingScenarioInventory !== undefined,
        strictAcceptanceEffect: "none",
      });
    }
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
  return {
    schemaVersion: 1,
    operation: check ? "check" : "materialize",
    memberCount: results.length,
    renderedFrameCount: results.reduce(
      (sum, item) => sum + item.renderableFrameCount,
      0,
    ),
    blockedFrameCount: results.reduce(
      (sum, item) => sum + item.blockedFrameCount,
      0,
    ),
    results,
    strictAcceptanceEffect: "none",
  };
}

function help() {
  return [
    `Usage: node ${path.relative(ROOT, scriptPath)} [options]`,
    "",
    "Options:",
    "  --id <animation-id>  Materialize one bounded wave3 spec (repeatable)",
    "  --check              Rebuild and compare without writing",
    "  --ffdec <command>    FFDec launcher (default: ffdec)",
    "  -h, --help           Show this help",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${help()}\n`);
  else process.stdout.write(`${JSON.stringify(
    await materializeWave3Specs(options),
    null,
    2,
  )}\n`);
}
