#!/usr/bin/env node

import {execFile} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {createHash} from "node:crypto";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "course-g04-l03-ir-001-341242cc";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/muted-random-visual-disposition.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/muted-random-visual-disposition.md`;

const EXPECTED_FFDEC = Object.freeze({
  invokedPath: "/opt/homebrew/bin/ffdec",
  versionArgs: Object.freeze(["-help"]),
  version: "JPEXS Free Flash Decompiler v.26.2.1",
  executableSha256:
    "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
});

const EXPECTED_SCRIPTS = Object.freeze({
  "DefineSprite_27/frame_1/DoAction.as":
    "tempNum = random(2);\n_global.tempRandomSoundMc = \"Mc_Sound_\" + tempNum;",
  "DefineSprite_27/frame_5/DoAction.as":
    "eval(_global.tempRandomSoundMc).gotoAndPlay(2);",
  "DefineSprite_27/frame_136/DoAction.as": "stop();",
  "DefineSprite_9/frame_1/DoAction.as": "stop();",
  "DefineSprite_9/frame_135/DoAction.as": "stop();",
  "DefineSprite_10/frame_1/DoAction.as": "stop();",
  "DefineSprite_10/frame_135/DoAction.as": "stop();",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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

function projectPath(relativePath, root = projectRoot) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the repository: ${relativePath}`);
  return resolved;
}

async function run(command, args, options = {}) {
  try {
    return await execFileAsync(command, args, {
      maxBuffer: 64 * 1024 * 1024,
      timeout: 180_000,
      ...options,
    });
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {
      cause: error,
    });
  }
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue until the exact executable is found.
    }
  }
  throw new Error(`executable not found: ${command}`);
}

async function inspectFfdec(command) {
  const invokedPath = await resolveExecutable(command);
  invariant(invokedPath === EXPECTED_FFDEC.invokedPath,
    `FFDec invoked path changed: ${invokedPath}`);
  const resolvedPath = await realpath(invokedPath);
  const [bytes, versionResult] = await Promise.all([
    readFile(resolvedPath),
    run(invokedPath, EXPECTED_FFDEC.versionArgs, {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    }),
  ]);
  const versionOutput = `${versionResult.stdout}\n${versionResult.stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "").trim();
  invariant(versionOutput.includes(EXPECTED_FFDEC.version),
    `FFDec version changed: ${versionOutput || "<empty>"}`);
  invariant(sha256(bytes) === EXPECTED_FFDEC.executableSha256,
    "FFDec executable SHA-256 changed");
  return {
    command,
    invokedPath,
    resolvedPath,
    executableBytes: bytes.length,
    executableSha256: sha256(bytes),
    version: EXPECTED_FFDEC.version,
  };
}

async function readBinding(relativePath, root = projectRoot) {
  const absolute = projectPath(relativePath, root);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const contents = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

async function readPinned(binding, label, root = projectRoot) {
  invariant(binding && typeof binding.path === "string" &&
    Number.isSafeInteger(binding.bytes) && /^[a-f0-9]{64}$/.test(binding.sha256 ?? ""),
  `${label} binding is invalid`);
  const observed = await readBinding(binding.path, root);
  invariant(observed.bytes === binding.bytes && observed.sha256 === binding.sha256,
    `${label} differs from its pinned identity`);
  return observed;
}

function withoutContents(binding) {
  const {contents, ...rest} = binding;
  return rest;
}

async function walkFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, child));
    else if (entry.isFile()) files.push(portable(child));
  }
  return files;
}

function normalizeScript(value) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

async function freshScripts(ffdec, sourcePath, temporaryRoot) {
  const exportRoot = path.join(temporaryRoot, "scripts");
  const result = await run(ffdec.invokedPath, [
    "-onerror", "abort",
    "-export", "script",
    exportRoot,
    sourcePath,
  ]);
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC.version),
    "fresh FFDec script export version changed");
  const files = await walkFiles(exportRoot);
  const scripts = new Map();
  for (const file of files) {
    if (!file.endsWith(".as")) continue;
    scripts.set(file.replace(/^scripts\//, ""),
      normalizeScript(await readFile(path.join(exportRoot, file), "utf8")));
  }
  return scripts;
}

function exactDomain(facts, domainId) {
  const domain = facts.frameDomains?.domains?.find((item) =>
    item.domainId === domainId);
  invariant(domain, `${domainId} is missing from the SWF structure`);
  return domain;
}

function projectDomain(domain) {
  return {
    domainId: domain.domainId,
    declaredFrameCount: domain.declaredFrameCount,
    observedShowFrameCount: domain.observedShowFrameCount,
    staticallyRootReachable: domain.staticallyRootReachable,
    parentDomainIds: domain.parentDomainIds,
    placementEdges: domain.placementEdges,
    tagCounts: domain.tagCounts,
    scriptTagCount: domain.scriptTagCount,
    audioTagCount: domain.audioTagCount,
    domainFingerprintSha256: domain.domainFingerprintSha256,
  };
}

function exactLibraryItem(authoringAudit, name) {
  const matches = (authoringAudit.library ?? []).filter((item) => item.name === name);
  invariant(matches.length === 1, `authoring library item ${name} must be unique`);
  invariant(matches[0].timeline, `authoring library item ${name} lacks a timeline`);
  return matches[0];
}

function exactLayer(timeline, name) {
  const matches = (timeline.layers ?? []).filter((layer) => layer.name === name);
  invariant(matches.length === 1, `${timeline.name} layer ${name} must be unique`);
  return matches[0];
}

function projectSoundClip(authoringAudit, name, expectedSound) {
  const item = exactLibraryItem(authoringAudit, name);
  invariant(item.timeline.frameCount === 135 && item.timeline.layerCount === 3,
    `${name} authoring timeline changed`);
  const actionLayer = exactLayer(item.timeline, "Layer 3");
  const soundLayer = exactLayer(item.timeline, "Layer 2");
  const shapeLayer = exactLayer(item.timeline, "Layer 1");
  invariant(JSON.stringify(actionLayer.keyframes.map((frame) => ({
    flashFrame: frame.flashFrame,
    duration: frame.duration,
    actionScript: normalizeScript(frame.actionScript),
    elementCount: frame.elementCount,
  }))) === JSON.stringify([
    {flashFrame: 1, duration: 134, actionScript: "stop();", elementCount: 0},
    {flashFrame: 135, duration: 1, actionScript: "stop();", elementCount: 0},
  ]), `${name} stop-frame contract changed`);
  invariant(soundLayer.keyframes.length === 1 &&
    soundLayer.keyframes[0].flashFrame === 1 &&
    soundLayer.keyframes[0].duration === 135 &&
    soundLayer.keyframes[0].soundName === expectedSound &&
    soundLayer.keyframes[0].soundSync === "stream" &&
    soundLayer.keyframes[0].elementCount === 0,
  `${name} stream-audio contract changed`);
  invariant(shapeLayer.keyframes.length === 1 &&
    shapeLayer.keyframes[0].flashFrame === 1 &&
    shapeLayer.keyframes[0].duration === 135 &&
    shapeLayer.keyframes[0].elementCount === 1,
  `${name} static visual marker duration changed`);
  const shape = shapeLayer.keyframes[0].elements[0];
  invariant(shape.elementType === "shape" && shape.width === 48 &&
    shape.height === 40.45 && shape.matrix?.tx === 512.4 &&
    shape.matrix.ty === 69.5,
  `${name} static visual marker changed`);
  return {
    libraryItemName: name,
    frameCount: item.timeline.frameCount,
    streamSoundName: expectedSound,
    streamSync: soundLayer.keyframes[0].soundSync,
    staticVisualMarker: {
      durationFrames: shapeLayer.keyframes[0].duration,
      width: shape.width,
      height: shape.height,
      matrix: {tx: shape.matrix.tx, ty: shape.matrix.ty},
    },
    stopFrames: actionLayer.keyframes.map((frame) => frame.flashFrame),
  };
}

export function validateIr001MutedRandomInputs({
  spec,
  sourceAudit,
  authoringAudit,
  sourceFacts,
  scripts,
}) {
  invariant(spec.animationId === ANIMATION_ID,
    "IR001 candidate spec animation identity changed");
  invariant(spec.timeline?.local?.frameDomain === "sprite-27" &&
    spec.timeline.local.frameCount === 136 &&
    spec.ffdec?.targetSpriteObjectId === 27,
  "IR001 candidate target timeline changed");
  invariant(sourceAudit.artifactType === "g4-l3-workspace-source-audit" &&
    sourceAudit.identity?.animationId === ANIMATION_ID &&
    sourceAudit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256,
  "IR001 source audit identity changed");
  invariant(sourceFacts.structureFingerprintSha256 ===
    sourceAudit.machineFindings?.runtime?.structureFingerprintSha256,
  "IR001 fresh SWF structure differs from the machine audit");
  for (const [script, expected] of Object.entries(EXPECTED_SCRIPTS)) {
    invariant(scripts.get(script) === expected,
      `${script} no longer matches the source-proven random/audio contract`);
  }

  const mainDomain = exactDomain(sourceFacts, "sprite-27");
  const soundDomains = ["sprite-9", "sprite-10"].map((domainId) =>
    exactDomain(sourceFacts, domainId));
  invariant(mainDomain.declaredFrameCount === 136 &&
    mainDomain.observedShowFrameCount === 136 &&
    mainDomain.parentDomainIds.length === 1 &&
    mainDomain.parentDomainIds[0] === "root" &&
    mainDomain.placedSpriteIds.join(",") === "9,10" &&
    mainDomain.scriptTagCount === 3 && mainDomain.audioTagCount === 0,
  "sprite-27 source structure changed");
  for (const domain of soundDomains) {
    invariant(domain.declaredFrameCount === 135 &&
      domain.observedShowFrameCount === 135 &&
      domain.parentDomainIds.length === 1 &&
      domain.parentDomainIds[0] === "sprite-27" &&
      domain.placementEdges.length === 1 &&
      domain.placementEdges[0].characterId === 8 &&
      domain.placementEdges[0].characterType === "DefineShape" &&
      domain.placementEdges[0].placementCount === 1 &&
      domain.placementEdges[0].firstFrame === 1 &&
      domain.placedSpriteIds.length === 0 &&
      domain.tagCounts.PlaceObject2 === 1 &&
      (domain.tagCounts.RemoveObject2 ?? 0) === 0 &&
      domain.tagCounts.SoundStreamHead === 1 &&
      domain.tagCounts.SoundStreamBlock === 135 &&
      domain.scriptTagCount === 2 && domain.audioTagCount === 136,
    `${domain.domainId} is no longer an audio stream with one invariant visual marker`);
  }

  invariant(authoringAudit.evidenceKind === "adobe-animate-authoring-audit" &&
    /without saving/.test(authoringAudit.authority ?? "") &&
    authoringAudit.document?.width === 800 &&
    authoringAudit.document.height === 600 &&
    authoringAudit.document.frameRate === 12,
  "IR001 authoring audit boundary changed");
  const mainItem = exactLibraryItem(authoringAudit, "Animation03");
  invariant(mainItem.timeline.frameCount === 136 &&
    mainItem.timeline.layerCount === 4,
  "Animation03 authoring timeline changed");
  const randomLayer = exactLayer(mainItem.timeline, "Rnd_Sound");
  invariant(randomLayer.keyframes.length === 1 &&
    randomLayer.keyframes[0].flashFrame === 1 &&
    randomLayer.keyframes[0].duration === 136,
  "Animation03 random-sound layer duration changed");
  const placements = randomLayer.keyframes[0].elements.map((element) => ({
    name: element.name,
    libraryItemName: element.libraryItemName,
    symbolType: element.symbolType,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    attachedActionScriptLength: element.attachedActionScriptLength,
  }));
  invariant(JSON.stringify(placements) === JSON.stringify([
    {name: "Mc_Sound_0", libraryItemName: "Mc_Sound_1",
      symbolType: "movie clip", x: -512.4, y: -69.5,
      width: 48, height: 40.45, attachedActionScriptLength: 0},
    {name: "Mc_Sound_1", libraryItemName: "Mc_Sound_1 copy",
      symbolType: "movie clip", x: -512.4, y: 10.5,
      width: 48, height: 40.45, attachedActionScriptLength: 0},
  ]), "Animation03 random-sound placements changed");

  return {
    mainDomain: projectDomain(mainDomain),
    soundDomains: soundDomains.map(projectDomain),
    soundPlacements: placements,
    soundClips: [
      projectSoundClip(authoringAudit, "Mc_Sound_1", "S0"),
      projectSoundClip(authoringAudit, "Mc_Sound_1 copy", "S1"),
    ],
    sourceScripts: Object.entries(EXPECTED_SCRIPTS).map(([file, body]) => ({
      file,
      bytes: Buffer.byteLength(body),
      sha256: sha256(body),
    })),
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 IR001 muted-random visual disposition

- Animation: \`${report.animationId}\`
- Status: \`${report.status}\`
- Source SWF: \`${report.source.swf.path}\` — \`${report.source.swf.sha256}\`
- Main visual domain: \`${report.visualDisposition.frameDomain}\`, frames ${report.visualDisposition.frames.first}–${report.visualDisposition.frames.lastInclusive}
- Random source call: \`random(2)\`; selected receiver: \`Mc_Sound_0|Mc_Sound_1\`
- Visual result: both selected MovieClips retain the same one-character display list for all 135 local frames; only their stream-audio bytes differ.

This source-only result permits the muted \`sprite-27\` drawing to be rendered for all 136 frames without inventing a random visual outcome. It does not execute or accept either audio branch, prove natural runtime reachability, establish bilingual behavior, compare an authoritative baseline, compute RMSE, or record human/owner acceptance.
`;
}

export async function buildIr001MutedRandomVisualDisposition({
  root = projectRoot,
  ffdec = "ffdec",
} = {}) {
  const [specBinding, generatorBinding] = await Promise.all([
    readBinding(SPEC_PATH, root),
    readBinding(portable(path.relative(root, scriptPath)), root),
  ]);
  const spec = JSON.parse(specBinding.contents);
  const [sourceSwf, sourceAudit, authoringAudit, toolchain] = await Promise.all([
    readPinned(spec.source.swf, "source SWF", root),
    readPinned(spec.evidence.sourceAudit, "source audit", root),
    readPinned(spec.evidence.authoringAudit, "authoring audit", root),
    inspectFfdec(ffdec),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-ir001-muted-random-"));
  try {
    const scripts = await freshScripts(toolchain, projectPath(spec.source.swf.path, root),
      temporaryRoot);
    const sourceAuditValue = JSON.parse(sourceAudit.contents);
    const authoringAuditValue = JSON.parse(authoringAudit.contents);
    const sourceFacts = parseSwfSourceFacts(sourceSwf.contents);
    const validated = validateIr001MutedRandomInputs({
      spec,
      sourceAudit: sourceAuditValue,
      authoringAudit: authoringAuditValue,
      sourceFacts,
      scripts,
    });
    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-ir001-muted-random-visual-disposition",
      animationId: ANIMATION_ID,
      status: "verified-random-audio-selection-does-not-change-source-visual",
      authorityStatement:
        "Fresh hash-bound SWF structure, exact exported AVM1, and the work-only FLA authoring structure prove that random(2) selects which persistent sound MovieClip begins stream playback. Both sound MovieClips contain the same single visual character for all 135 frames and no later display-list mutation. This establishes a muted visual disposition only, not runtime, audio, behavior, parity, or acceptance.",
      generator: withoutContents(generatorBinding),
      source: {
        swf: withoutContents(sourceSwf),
        sourceAudit: withoutContents(sourceAudit),
        authoringAudit: withoutContents(authoringAudit),
        structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
      },
      toolchain: {ffdec: toolchain},
      exactSourceScripts: validated.sourceScripts,
      staticSwfStructure: {
        parser: {
          path: "scripts/build-g4-l3-machine-source-audits.mjs",
          parserVersion: sourceFacts.parserVersion,
          structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
        },
        mainDomain: validated.mainDomain,
        randomAudioDomains: validated.soundDomains,
      },
      authoringStructure: {
        mainTimeline: {libraryItemName: "Animation03", frameCount: 136},
        randomAudioPlacements: validated.soundPlacements,
        randomAudioClips: validated.soundClips,
      },
      visualDisposition: {
        frameDomain: "sprite-27",
        frames: {first: 1, lastInclusive: 136},
        randomSelectionAffectsStreamAudio: true,
        randomSelectionChangesDisplayList: false,
        selectedMovieClipVisualChangesAcrossFrames: false,
        sourceStaticMutedDrawingRenderable: true,
        audioRenderedOrAccepted: false,
        naturalRandomOutcomeObserved: false,
        behavioralParityEstablished: false,
      },
      unresolved: [
        "Neither random outcome has been observed in an authorized original runtime.",
        "The S0 and S1 stream-audio branches remain muted and unaccepted.",
        "Root/host reachability, Spanish context, Replay, behavior, authoritative baseline, full-frame RMSE, product/accessibility review, human visual review, owner acceptance, and strict completion remain pending.",
      ],
      acceptance: {
        acceptanceNeutral: true,
        implementationAccepted: false,
        authoritativeOriginalRuntimeAccepted: false,
        audioAccepted: false,
        behaviorAccepted: false,
        bilingualVisualParityAccepted: false,
        rmseAccepted: false,
        humanVisualReviewAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
      },
      strictAcceptanceEffect: "none",
    };
    return {report, json: stableJson(report), markdown: renderMarkdown(report)};
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

async function emit(relativePath, contents, check, root = projectRoot) {
  const absolute = projectPath(relativePath, root);
  if (check) {
    const observed = await readFile(absolute, "utf8");
    invariant(observed === contents, `${relativePath} is stale`);
  } else {
    await writeFile(absolute, contents);
  }
}

function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec"};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--ffdec") options.ffdec = argv[++index];
    else if (argument === "-h" || argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  invariant(typeof options.ffdec === "string" && options.ffdec.length > 0,
    "--ffdec requires a command");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "node scripts/build-g4-l3-ir001-muted-random-visual-disposition.mjs [--check] [--ffdec <command>]\n",
    );
    return;
  }
  const built = await buildIr001MutedRandomVisualDisposition({ffdec: options.ffdec});
  await Promise.all([
    emit(OUTPUT_JSON, built.json, options.check),
    emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "136/136 muted visual frames source-disposed; runtime/audio/acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
