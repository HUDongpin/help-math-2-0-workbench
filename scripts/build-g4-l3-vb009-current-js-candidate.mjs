#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {parseEmbeddedAudioPayloads} from "./build-g4-l3-embedded-audio-archive.mjs";
import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";
import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANIMATION_ID = "course-g04-l03-vb-009";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB09.swf";
const SOURCE_FLA =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/VB/L3VB09.fla";
const SOURCE_ASSOCIATED_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3VB09.mp3";
const SOURCE_PREAUDIT = "reports/g4-l3-vb009-source-preaudit.json";
const GENERATOR = "scripts/build-g4-l3-vb009-current-js-candidate.mjs";
const ADAPTER_GENERATOR = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const PLACEMENT_PARSER = "scripts/parse-swfmill-g4-l3-static-candidate.py";
const PURE_TIMELINE =
  "packages/demos/src/timelines/course-g04-l03-vb-009.ts";
const PROTOTYPE_MODULE =
  "packages/demos/src/modules/course-g04-l03-vb-009.tsx";
const SHARED_CANDIDATE_RUNTIME =
  "packages/demos/src/source-static-canvas-candidate.tsx";
const OUTPUT_SCRIPT =
  "public/flash-assets/courses/course-g04-l03-vb-009/canvas-renderer.js";
const OUTPUT_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-vb-009/manifest.json";
const OUTPUT_REPORT_JSON =
  "reports/g4-l3-vb009-current-javascript-candidate.json";
const OUTPUT_REPORT_MARKDOWN =
  "reports/g4-l3-vb009-current-javascript-candidate.md";

const EXPECTED = Object.freeze({
  sourceSwfSha256:
    "5a6532c1635ecbf29cf1b4bda6727ce3bc858b1a5771223fd629ee3a65df96f8",
  sourceSwfBytes: 54_446,
  sourceFlaSha256:
    "fc6a5819a64d1051bf9d8c8f750bca45d237526a72ae3891eca21c77ba766c08",
  sourceFlaBytes: 278_528,
  sourceAssociatedAudioSha256:
    "e2896cb3b7b1816b1f48f5df451d3663736344b052ca8d096db96e2c692cb094",
  sourceAssociatedAudioBytes: 217_392,
  sourcePreauditSha256:
    "98956cd53be71861e920934bb83b804249e21da70f88c3b206c5569b15b23d34",
  sourcePreauditBytes: 99_878,
  ffdecTool: "JPEXS Free Flash Decompiler v.26.2.1",
  helperSha256:
    "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  helperBytes: 52_872,
  framesHtmlSha256:
    "757d2fbc652dadf900abbfc4021ec6ace6860065dcd6cd3015a76db8620ea01d",
  framesHtmlBytes: 629_134,
  placedFunctionCount: 15,
  placedFunctionsSha256:
    "08df7a91631efb81d26f8d2b4a1c21901d988a0ca5308aff6256fd8dd913725a",
  embeddedImageVariableCount: 0,
  embeddedImageVariablesSha256:
    "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  embeddedStreamPayloadSha256:
    "b78159a3003a0a2e4b56fa1298bebc08d1ebf7084d4c1c91b9ef622620ad389e",
});

const SCRIPT_EXPECTATIONS = Object.freeze([
  Object.freeze({
    path: "scripts/DefineButton2_11/BUTTONCONDACTION on(release).as",
    sha256: "8f6dfdeac2d6fc25cdc4658e641d72c70665db105aa33c8088cc37d8c43e398a",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Pattern";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_12/BUTTONCONDACTION on(release).as",
    sha256: "bfdbabe250a62aa3dd5b4982af3b1920e73e2aa4186fbec2dda22c86c805ee32",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Symbol";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_13/BUTTONCONDACTION on(release).as",
    sha256: "fab806a89eadfde2fe3f4629b6a706072ebb52a2c877dd933918c6cfa8fd4245",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Set";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_16/BUTTONCONDACTION on(release).as",
    sha256: "55149182b729f5b2a4ac685cd1829698c2eee7b7bfe64a751d82d8ea31745880",
    exactSource:
      'on(release){\n   _global.KeyAttribute = "Rule";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/frame_1/DoAction.as",
    sha256: "8edb4298364fccc1a492b99afd35910c38775e841df758cc2f8f09063e448862",
    exactSource:
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();\n',
  }),
  Object.freeze({
    path: "scripts/frame_6/DoAction.as",
    sha256: "c71f185593d153c467266a494ebee471c04c9b64044e6cf491e0d91d739e92fd",
    exactSource: "stop();\n",
  }),
]);

const SOURCE_BUTTONS = Object.freeze([
  Object.freeze({
    characterId: 11,
    visualId: "pattern",
    firstLocalFrame: 1,
    lastLocalFrame: 175,
    keyAttribute: "Pattern",
  }),
  Object.freeze({
    characterId: 12,
    visualId: "symbol",
    firstLocalFrame: 1,
    lastLocalFrame: 175,
    keyAttribute: "Symbol",
  }),
  Object.freeze({
    characterId: 13,
    visualId: "set",
    firstLocalFrame: 1,
    lastLocalFrame: 175,
    keyAttribute: "Set",
  }),
  Object.freeze({
    characterId: 16,
    visualId: "rule",
    firstLocalFrame: 73,
    lastLocalFrame: 175,
    keyAttribute: "Rule",
  }),
]);

const UNRESOLVED = Object.freeze([
  "The 10-frame root timeline, InternalPreloader entry, root composition, and natural runtime reachability lack an authoritative original-runtime baseline; root rendering is disabled.",
  "sprite-24 is exposed only as 175 deterministic English source-static drawing frames. This does not prove natural playback, looping, terminal behavior, root compositing, or reachable scenario coverage.",
  "The one-frame sprite-5 page-title companion and the other root placements are inventoried but are not rendered or composited into the source-static domain.",
  "Pattern, Symbol, Set, and Rule are source button pixels only. KeyAttribute writes, DoHyperLinks, host stop dispatch, pointer interaction, focus, and keyboard activation are disabled.",
  "The candidate is English-only. Spanish visual behavior and the Patrón anchor context are not inferred; lang=es fails closed.",
  "The embedded MP3 stream and associated catalog MP3 are hash-bound but disabled; spoken language, cue mapping, synchronization, replay reset, listening, and audio acceptance remain unresolved.",
  "Replay/behavior parity, full-frame RMSE, product QA, accessibility QA, human visual review, owner acceptance, strict ledger admission, and migration completion remain false.",
]);

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

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project path is required",
  );
  invariant(!path.isAbsolute(relativePath), "project path must be relative");
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `project path escapes the repository: ${relativePath}`,
  );
  return resolved;
}

async function readPinned(relativePath, expectedHash, expectedBytes, label) {
  const absolutePath = projectPath(relativePath);
  const [entry, bytes] = await Promise.all([lstat(absolutePath), readFile(absolutePath)]);
  invariant(entry.isFile() && !entry.isSymbolicLink(), `${label}: not a regular file`);
  const physical = await stat(absolutePath);
  invariant(physical.nlink === 1, `${label}: multiple hard links are not allowed`);
  invariant(
    bytes.length === expectedBytes,
    `${label}: expected ${expectedBytes} bytes, observed ${bytes.length}`,
  );
  invariant(
    sha256(bytes) === expectedHash,
    `${label}: SHA-256 does not match the pinned identity`,
  );
  return bytes;
}

async function fileBinding(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function walkFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(directory, next)));
    else if (entry.isFile()) files.push(next);
    else throw new Error(`FFDec export contains a non-file entry: ${next}`);
  }
  return files;
}

async function run(command, args, options = {}) {
  try {
    return await execFile(command, args, {maxBuffer: 50_000_000, ...options});
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {
      cause: error,
    });
  }
}

export function parseArguments(argv, {root = ROOT} = {}) {
  const result = {
    check: false,
    ffdec: "ffdec",
    python: "python3",
    swfmill: "swfmill",
    root,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") result.check = true;
    else if (["--ffdec", "--python", "--swfmill"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      result[argument.slice(2)] = value;
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

function validatePreaudit(preaudit) {
  invariant(
    preaudit?.identity?.animationId === ANIMATION_ID,
    "source preaudit: animation identity changed",
  );
  invariant(
    preaudit.currentJsEngineeringCandidate
      ?.sourceStaticCurrentJsEngineeringCandidateEligible === true &&
      preaudit.currentJsEngineeringCandidate
        ?.formalMigrationImplementationAuthorized === false &&
      preaudit.currentJsEngineeringCandidate?.interactiveRendererAuthorized ===
        false,
    "source preaudit: engineering-only authorization boundary changed",
  );
  invariant(
    Object.values(preaudit.acceptance ?? {}).every((value) => value === false),
    "source preaudit: an acceptance gate was promoted",
  );
  invariant(
    preaudit.authorityBoundary?.adobeAnimateLaunched === false &&
      preaudit.authorityBoundary?.originalRuntimeLaunched === false &&
      preaudit.authorityBoundary?.audioPlayedOrListenedTo === false,
    "source preaudit: authority boundary changed",
  );
  return preaudit;
}

function validateStaticSwfFacts(facts) {
  invariant(
    facts.header.stage.width === 800 && facts.header.stage.height === 600,
    "SWF parser: native stage changed",
  );
  invariant(
    facts.header.fps === 12 && facts.header.rootFrameCount === 10,
    "SWF parser: root timeline changed",
  );
  invariant(
    facts.actionScript.version === "AS1/2" &&
      facts.actionScript.tagCounts.DoAction === 2,
    "SWF parser: ActionScript boundary changed",
  );
  const domains = facts.frameDomains.domains;
  invariant(domains.length === 3, "SWF parser: frame-domain count changed");
  const root = domains.find((entry) => entry.domainId === "root");
  const sprite5 = domains.find((entry) => entry.domainId === "sprite-5");
  const sprite24 = domains.find((entry) => entry.domainId === "sprite-24");
  invariant(
    root?.declaredFrameCount === 10 &&
      JSON.stringify(root.placedSpriteIds) === JSON.stringify([5, 24]),
    "SWF parser: root placement graph changed",
  );
  invariant(
    sprite5?.declaredFrameCount === 1 && sprite24?.declaredFrameCount === 175,
    "SWF parser: nested timelines changed",
  );
  for (const button of SOURCE_BUTTONS) {
    const placement = sprite24.placementEdges.find(
      (entry) => entry.characterId === button.characterId,
    );
    invariant(
      placement?.characterType === "DefineButton2" &&
        placement.firstFrame === button.firstLocalFrame,
      `SWF parser: button ${button.characterId} visual boundary changed`,
    );
  }
  return {root, sprite5, sprite24};
}

function validateAudioFacts(audio) {
  invariant(
    audio.tagCounts.DefineSound === 0 &&
      audio.tagCounts.SoundStreamHead === 1 &&
      audio.tagCounts.SoundStreamBlock === 140,
    "embedded-audio parser: tag inventory changed",
  );
  invariant(
    audio.defineSounds.length === 0 && audio.soundStreams.length === 1,
    "embedded-audio parser: stream count changed",
  );
  const stream = audio.soundStreams[0];
  invariant(
    stream.ownerDomainId === "sprite-24" &&
      stream.blockCount === 140 &&
      stream.blocks[0]?.localFrame === 7 &&
      stream.blocks.at(-1)?.localFrame === 175,
    "embedded-audio parser: stream timeline changed",
  );
  invariant(
    stream.head.format === "mp3" &&
      stream.head.sampleRateHz === 22_050 &&
      stream.head.channels === 1,
    "embedded-audio parser: stream format changed",
  );
  invariant(
    stream.payload.sha256 === EXPECTED.embeddedStreamPayloadSha256,
    "embedded-audio parser: stream payload changed",
  );
  return stream;
}

function validatePlacement(placement) {
  invariant(
    placement.stage.width === 800 &&
      placement.stage.height === 600 &&
      placement.stage.backgroundHex === "#b8d8f7",
    "swfmill placement parser: stage changed",
  );
  invariant(
    placement.fps === 12 && placement.rootFrameCount === 10,
    "swfmill placement parser: root timeline changed",
  );
  invariant(
    placement.rootBeginLabel.label === "begin" &&
      placement.rootBeginLabel.frame === 6,
    "swfmill placement parser: begin label changed",
  );
  invariant(
    placement.targetSprite.objectId === 24 &&
      placement.targetSprite.frameCount === 175,
    "swfmill placement parser: target sprite changed",
  );
  invariant(
    placement.rootPlacement.frame === 6 &&
      placement.rootPlacement.depth === 4 &&
      placement.rootPlacement.name === "animation" &&
      placement.rootPlacement.translationTwips.x === 8_026 &&
      placement.rootPlacement.translationTwips.y === 4_885,
    "swfmill placement parser: root placement changed",
  );
  invariant(
    Object.values(placement.authorityBoundary).every(
      (value) => value === false || value === "none",
    ),
    "swfmill placement parser: authority boundary was promoted",
  );
  return placement;
}

function validateScripts(scriptFiles) {
  invariant(
    scriptFiles.length === SCRIPT_EXPECTATIONS.length,
    "FFDec script export: script count changed",
  );
  const normalized = scriptFiles
    .map((entry) => ({
      path: portable(entry.path),
      text: entry.text.replace(/\r\n?/g, "\n"),
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const expected = [...SCRIPT_EXPECTATIONS].sort((left, right) =>
    left.path.localeCompare(right.path, "en"),
  );
  invariant(
    JSON.stringify(normalized.map((entry) => entry.path)) ===
      JSON.stringify(expected.map((entry) => entry.path)),
    "FFDec script export: path inventory changed",
  );
  return normalized.map((entry, index) => {
    const contract = expected[index];
    invariant(
      entry.text === contract.exactSource &&
        sha256(entry.text) === contract.sha256,
      `FFDec script export changed: ${entry.path}`,
    );
    return {
      path: entry.path,
      bytes: Buffer.byteLength(entry.text),
      sha256: sha256(entry.text),
      exactSource: entry.text,
    };
  });
}

function buildAdapterSpec({helper, framesHtml}) {
  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "source-static-current-javascript-engineering-candidate-only",
    source: {swf: SOURCE_SWF, swfSha256: EXPECTED.sourceSwfSha256},
    evidence: {
      scenarioInventorySha256: "0".repeat(64),
      audioAuditSha256: "0".repeat(64),
    },
    ffdecExport: {
      tool: EXPECTED.ffdecTool,
      helper: "ephemeral-fresh-ffdec-export/canvas.js",
      helperSha256: sha256(helper),
      framesHtml: "ephemeral-fresh-ffdec-export/frames.html",
      framesHtmlSha256: sha256(framesHtml),
      targetSpriteObjectId: 24,
      targetSpriteFunction: "sprite24",
      exportCanvas: {width: 701, height: 382},
      exportInternalTranslation: {x: 341.3, y: 141.25},
      expectedPlacedFunctionCount: EXPECTED.placedFunctionCount,
      expectedPlacedFunctionsSha256: EXPECTED.placedFunctionsSha256,
      embeddedImageVariableCount: EXPECTED.embeddedImageVariableCount,
      embeddedImageVariablesSha256: EXPECTED.embeddedImageVariablesSha256,
    },
    timeline: {
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "begin",
        placementName: "animation",
        placementTwips: {x: 8_026, y: 4_885},
        placementPixels: {x: 401.3, y: 244.25},
      },
      local: {
        timelineId: "sprite-24",
        frameCount: 175,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 60, y: 103},
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-visual-state-independent",
      unresolved: [...UNRESOLVED],
    },
    output: {
      script: OUTPUT_SCRIPT,
      manifest: OUTPUT_MANIFEST,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

function acceptanceBoundary() {
  return {
    implementationComplete: false,
    authoritativeOriginalRuntimeComplete: false,
    naturalRuntimeReachabilityComplete: false,
    frameDomainDispositionComplete: false,
    bilingualVisualParityComplete: false,
    audioAccepted: false,
    replayParityComplete: false,
    fullFrameRmseComplete: false,
    behaviorComplete: false,
    productQaComplete: false,
    accessibilityQaComplete: false,
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
  };
}

function renderMarkdown(report) {
  const gates = Object.entries(report.acceptance)
    .map(([name, value]) => `| \`${name}\` | ${value} |`)
    .join("\n");
  return `# G4 L3 VB009 current-JavaScript engineering candidate

This report records deterministic English source-static Canvas frames for \`${ANIMATION_ID}\`. It is prototype-registry-only and does not create a migration workspace, strict ledger admission, public-library admission, authoritative Flash baseline, interaction/audio parity, human approval, owner approval, or migration completion.

## Source-bound result

- Source: \`${report.source.swf.path}\` (SHA-256 \`${report.source.swf.sha256}\`)
- Stage/root: ${report.timeline.stage.width}×${report.timeline.stage.height}, ${report.timeline.fps} FPS, ${report.timeline.root.frameCount} root frames
- Addressable drawing domain: \`${report.timeline.local.timelineId}\`, ${report.timeline.local.frameCount} one-indexed frames
- Disabled companion: \`${report.timeline.companion.timelineId}\`, ${report.timeline.companion.frameCount} frame
- Renderer: \`${report.outputs.canvasRuntime.path}\` (SHA-256 \`${report.outputs.canvasRuntime.sha256}\`)
- Language: English source pixels only; Spanish fails closed
- Buttons: Pattern, Symbol, Set, and Rule pixels only; pointer/focus/keyboard/legacy dispatch disabled
- Audio: embedded and associated MP3s inventoried but disabled

## Acceptance boundary

| Gate | Accepted |
|---|---:|
${gates}

## Unresolved obligations

${report.unresolved.map((item) => `- ${item}`).join("\n")}
`;
}

async function assertSafeOutputTarget(absolutePath) {
  invariant(
    !absolutePath.startsWith(`${projectPath("source-assets")}${path.sep}`),
    "generated output cannot be placed under source-assets",
  );
  try {
    const target = await lstat(absolutePath);
    invariant(
      target.isFile() && !target.isSymbolicLink(),
      `${absolutePath} is not a regular file`,
    );
    const physical = await stat(absolutePath);
    invariant(physical.nlink === 1, `${absolutePath} has multiple hard links`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function emit(relativePath, expected, check) {
  const absolutePath = projectPath(relativePath);
  if (check) {
    const actual = await readFile(absolutePath);
    invariant(actual.equals(expected), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await assertSafeOutputTarget(absolutePath);
  await writeFile(absolutePath, expected);
}

export async function generateG4L3Vb009CurrentJsCandidate({
  check = false,
  ffdec = "ffdec",
  python = "python3",
  swfmill = "swfmill",
} = {}) {
  const [
    sourceSwf,
    sourceFla,
    associatedAudio,
    sourcePreauditBytes,
    parserBytes,
    implementationClosure,
  ] = await Promise.all([
    readPinned(
      SOURCE_SWF,
      EXPECTED.sourceSwfSha256,
      EXPECTED.sourceSwfBytes,
      "source SWF",
    ),
    readPinned(
      SOURCE_FLA,
      EXPECTED.sourceFlaSha256,
      EXPECTED.sourceFlaBytes,
      "source FLA",
    ),
    readPinned(
      SOURCE_ASSOCIATED_AUDIO,
      EXPECTED.sourceAssociatedAudioSha256,
      EXPECTED.sourceAssociatedAudioBytes,
      "associated catalog audio",
    ),
    readPinned(
      SOURCE_PREAUDIT,
      EXPECTED.sourcePreauditSha256,
      EXPECTED.sourcePreauditBytes,
      "source preaudit",
    ),
    readFile(projectPath(PLACEMENT_PARSER)),
    Promise.all(
      [GENERATOR, ADAPTER_GENERATOR, PURE_TIMELINE, PROTOTYPE_MODULE, SHARED_CANDIDATE_RUNTIME].map(
        fileBinding,
      ),
    ),
  ]);
  const sourcePreaudit = validatePreaudit(
    JSON.parse(sourcePreauditBytes.toString("utf8")),
  );
  const staticFacts = parseSwfSourceFacts(sourceSwf);
  const domains = validateStaticSwfFacts(staticFacts);
  const audioFacts = parseEmbeddedAudioPayloads(sourceSwf);
  const embeddedStream = validateAudioFacts(audioFacts);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb009-"));
  try {
    const canvasDirectory = path.join(temporaryRoot, "canvas");
    const scriptsDirectory = path.join(temporaryRoot, "scripts");
    const swfmillXml = path.join(temporaryRoot, "source.xml");
    const sourcePath = projectPath(SOURCE_SWF);
    const canvasExport = await run(ffdec, [
      "-config",
      "packJavaScripts=false",
      "-onerror",
      "abort",
      "-selectid",
      "24",
      "-format",
      "sprite:canvas",
      "-export",
      "sprite",
      canvasDirectory,
      sourcePath,
    ]);
    invariant(
      `${canvasExport.stdout}\n${canvasExport.stderr}`.includes(EXPECTED.ffdecTool),
      "FFDec exporter version changed",
    );
    await run(ffdec, [
      "-config",
      "packJavaScripts=false",
      "-onerror",
      "abort",
      "-export",
      "script",
      scriptsDirectory,
      sourcePath,
    ]);
    await run(swfmill, ["swf2xml", sourcePath, swfmillXml]);
    const placementResult = await run(python, [
      projectPath(PLACEMENT_PARSER),
      "--swfmill",
      swfmillXml,
      "--object-id",
      "24",
      "--placement-name",
      "animation",
      "--begin-label",
      "begin",
    ]);
    const placement = validatePlacement(JSON.parse(placementResult.stdout));

    const [helper, framesHtml, swfmillXmlBytes, scriptRelativePaths, swfmillVersion] =
      await Promise.all([
        readFile(path.join(canvasDirectory, "DefineSprite_24", "canvas.js")),
        readFile(path.join(canvasDirectory, "DefineSprite_24", "frames.html")),
        readFile(swfmillXml),
        walkFiles(scriptsDirectory),
        run(swfmill, ["--version"]),
      ]);
    invariant(
      helper.length === EXPECTED.helperBytes &&
        sha256(helper) === EXPECTED.helperSha256,
      "fresh FFDec helper export changed",
    );
    invariant(
      framesHtml.length === EXPECTED.framesHtmlBytes &&
        sha256(framesHtml) === EXPECTED.framesHtmlSha256,
      "fresh FFDec frame export changed",
    );
    const scripts = validateScripts(
      await Promise.all(
        scriptRelativePaths.map(async (relativePath) => ({
          path: relativePath,
          text: await readFile(path.join(scriptsDirectory, relativePath), "utf8"),
        })),
      ),
    );
    const spec = buildAdapterSpec({helper, framesHtml});
    const built = buildSafeRuntime({
      helperSource: helper.toString("utf8"),
      framesHtml: framesHtml.toString("utf8"),
      spec,
    });
    invariant(
      built.placedFunctions.length === EXPECTED.placedFunctionCount &&
        sha256(JSON.stringify(built.placedFunctions)) ===
          EXPECTED.placedFunctionsSha256,
      "safe adapter: drawing allowlist changed",
    );
    invariant(
      built.imageVariables.length === EXPECTED.embeddedImageVariableCount &&
        sha256(JSON.stringify(built.imageVariables)) ===
          EXPECTED.embeddedImageVariablesSha256,
      "safe adapter: embedded-image allowlist changed",
    );

    const runtimeBytes = Buffer.from(built.runtime);
    const swfmillVersionText =
      `${swfmillVersion.stdout}\n${swfmillVersion.stderr}`.trim();
    invariant(
      swfmillVersionText === "swfmill 0.3.6",
      `swfmill version changed: ${swfmillVersionText || "<empty>"}`,
    );
    const acceptance = acceptanceBoundary();
    const manifest = {
      schemaVersion: 1,
      animationId: ANIMATION_ID,
      status: "source-static-current-javascript-engineering-candidate-only",
      authority:
        "Hash-bound static SWF structure plus a fresh deterministic FFDec Canvas export; not authoritative runtime, root composition, interaction, localization, audio, visual parity, human, owner, or strict acceptance.",
      generatedBy: implementationClosure,
      sourcePreaudit: {
        path: SOURCE_PREAUDIT,
        bytes: sourcePreauditBytes.length,
        sha256: sha256(sourcePreauditBytes),
        determination:
          sourcePreaudit.currentJsEngineeringCandidate.determination,
        formalMigrationAuthorized: false,
      },
      source: {
        swf: {path: SOURCE_SWF, bytes: sourceSwf.length, sha256: sha256(sourceSwf)},
        fla: {
          path: SOURCE_FLA,
          bytes: sourceFla.length,
          sha256: sha256(sourceFla),
          authoringAuditPerformed: false,
        },
      },
      extraction: {
        ffdec: EXPECTED.ffdecTool,
        helper: {bytes: helper.length, sha256: sha256(helper)},
        framesHtml: {bytes: framesHtml.length, sha256: sha256(framesHtml)},
        swfmill: swfmillVersionText,
        swfmillXmlSha256: sha256(swfmillXmlBytes),
        placementParser: {path: PLACEMENT_PARSER, sha256: sha256(parserBytes)},
        scripts,
        drawingObjectCount: built.placedFunctions.length,
        drawingObjectsSha256: sha256(JSON.stringify(built.placedFunctions)),
        embeddedImageCount: built.imageVariables.length,
      },
      timeline: built.metadata,
      interaction: {
        renderedAsControls: false,
        pointerEventsEnabled: false,
        focusOrKeyboardControlsEnabled: false,
        legacyActionScriptExecuted: false,
        sourceButtonPixelsIncluded: true,
        sourceButtons: SOURCE_BUTTONS,
        disabledLegacyOperations: [
          "_level0.InternalPreloader.gotoAndPlay",
          "_global.KeyAttribute writes",
          "_root.DoHyperLinks",
          "_root.animation_mc.animation.stop",
        ],
      },
      safety: {
        noLegacyActionScriptExecuted: true,
        noDynamicEvaluation: true,
        noNetworkPrimitives: true,
        noTimersOrAutoplay: true,
        noPersistentStorage: true,
        noAmbientDomListeners: true,
        interactiveControlsEnabled: false,
        audioRendered: false,
      },
      output: {
        script: OUTPUT_SCRIPT,
        bytes: runtimeBytes.length,
        sha256: sha256(runtimeBytes),
        globalRegistry: "HELP_MATH_CANVAS_ASSETS",
      },
      unresolved: [...UNRESOLVED],
      acceptance,
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(stableJson(manifest));
    const report = {
      schemaVersion: 1,
      reportType: "current-javascript-engineering-candidate",
      animationId: ANIMATION_ID,
      batch: {lesson: "G4 L3", batchId: "batch-001", batchOrdinal: 12},
      classification: {
        section: "VB",
        page: 9,
        titleRaw: "Pattern",
        titleDisplay: "Pattern",
        domain: "vocabulary",
      },
      disposition: {
        currentJavaScriptCandidate: true,
        prototypeRegistryOnly: true,
        localAuditPrototypeRouteOnly: true,
        migrationScaffoldCreated: false,
        strictLedgerChanged: false,
        publicLibraryAdmitted: false,
        productionAdmission: false,
      },
      sourcePreaudit: manifest.sourcePreaudit,
      source: manifest.source,
      implementationClosure,
      evidence: {
        staticStructureFingerprintSha256: staticFacts.structureFingerprintSha256,
        rootDomainFingerprintSha256: domains.root.domainFingerprintSha256,
        sprite5DomainFingerprintSha256: domains.sprite5.domainFingerprintSha256,
        sprite24DomainFingerprintSha256: domains.sprite24.domainFingerprintSha256,
        rootPlacement: placement.rootPlacement,
        rootBeginLabel: placement.rootBeginLabel,
        scripts,
        interaction: manifest.interaction,
        embeddedAudio: {
          format: embeddedStream.head.format,
          sampleRateHz: embeddedStream.head.sampleRateHz,
          channels: embeddedStream.head.channels,
          blockCount: embeddedStream.blockCount,
          firstBlockFrame: embeddedStream.blocks[0].localFrame,
          lastBlockFrame: embeddedStream.blocks.at(-1).localFrame,
          payloadSha256: embeddedStream.payload.sha256,
          rendered: false,
          accepted: false,
        },
        associatedCatalogAudio: {
          path: SOURCE_ASSOCIATED_AUDIO,
          bytes: associatedAudio.length,
          sha256: sha256(associatedAudio),
          catalogLanguage: "und",
          normalizedAssociation: "es-candidate-only",
          spokenLanguageEstablished: false,
          cueMappingEstablished: false,
          synchronizationVerified: false,
          listeningAccepted: false,
          rendered: false,
        },
      },
      timeline: {
        stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
        fps: 12,
        root: {
          frameCount: 10,
          renderable: false,
          blocker: "root-baseline-unavailable",
        },
        local: {
          timelineId: "sprite-24",
          frameCount: 175,
          publicFrameIndexing: "one-indexed",
          language: "en",
          status: "source-static-drawing-only",
        },
        companion: {
          timelineId: "sprite-5",
          frameCount: 1,
          renderable: false,
          blocker: "companion-domain-unrendered",
        },
      },
      outputs: {
        canvasRuntime: {
          path: OUTPUT_SCRIPT,
          bytes: runtimeBytes.length,
          sha256: sha256(runtimeBytes),
        },
        canvasManifest: {
          path: OUTPUT_MANIFEST,
          bytes: manifestBytes.length,
          sha256: sha256(manifestBytes),
        },
        prototypeModule: implementationClosure.find(
          (entry) => entry.path === PROTOTYPE_MODULE,
        ),
        pureTimeline: implementationClosure.find(
          (entry) => entry.path === PURE_TIMELINE,
        ),
        sharedCandidateRuntime: implementationClosure.find(
          (entry) => entry.path === SHARED_CANDIDATE_RUNTIME,
        ),
      },
      unresolved: [...UNRESOLVED],
      acceptance,
      strictAcceptanceEffect: "none",
    };
    const reportJsonBytes = Buffer.from(stableJson(report));
    const reportMarkdownBytes = Buffer.from(renderMarkdown(report));

    await Promise.all([
      emit(OUTPUT_SCRIPT, runtimeBytes, check),
      emit(OUTPUT_MANIFEST, manifestBytes, check),
      emit(OUTPUT_REPORT_JSON, reportJsonBytes, check),
      emit(OUTPUT_REPORT_MARKDOWN, reportMarkdownBytes, check),
    ]);
    return {
      animationId: ANIMATION_ID,
      check,
      status: report.disposition,
      outputScript: report.outputs.canvasRuntime,
      outputManifest: report.outputs.canvasManifest,
      report: OUTPUT_REPORT_JSON,
      frameDomain: report.timeline.local,
      acceptance: report.acceptance,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  console.log(stableJson(await generateG4L3Vb009CurrentJsCandidate(args)));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
