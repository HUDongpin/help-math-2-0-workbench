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
const ANIMATION_ID = "course-g04-l03-rw-003";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.swf";
const SOURCE_FLA =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/RW/L3RW03.fla";
const SOURCE_SPANISH_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW03.mp3";
const PLACEMENT_PARSER = "scripts/parse-swfmill-g4-l3-static-candidate.py";
const OUTPUT_SCRIPT =
  "public/flash-assets/courses/course-g04-l03-rw-003/canvas-renderer.js";
const OUTPUT_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-rw-003/manifest.json";
const OUTPUT_REPORT_JSON =
  "reports/g4-l3-rw003-current-javascript-candidate.json";
const OUTPUT_REPORT_MARKDOWN =
  "reports/g4-l3-rw003-current-javascript-candidate.md";
const AUDIO_ASSET_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-rw-003/audio/manifest.json";
const AUDIO_QA_REPORT =
  "migrations/course-g04-l03-rw-003/evidence/current-javascript-audio-product-qa.json";

const EXPECTED = Object.freeze({
  sourceSwfSha256:
    "783b74b036a7af4031f17ce9e1aab7536665c84a73400b3a980cfa3e89a9a335",
  sourceSwfBytes: 108_459,
  sourceFlaSha256:
    "16fb7b49f0d11ee93d58f46c97c80901d9356a76454daccd09c4401c59bfd5c5",
  sourceFlaBytes: 1_098_752,
  sourceSpanishAudioSha256:
    "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975",
  sourceSpanishAudioBytes: 251_328,
  ffdecTool: "JPEXS Free Flash Decompiler v.26.2.1",
  helperSha256:
    "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  helperBytes: 52_872,
  framesHtmlSha256:
    "6bff978ff87e81601eb36b3cad83c68068f6b336a1fcaa444aefadfa2f10e06d",
  framesHtmlBytes: 1_397_666,
  placedFunctionCount: 46,
  placedFunctionsSha256:
    "5af1e06e6173b3a18a2deb917864b4d5cf1e0601f4ddc78a0eec7a24d75ee446",
  embeddedImageVariableCount: 0,
  embeddedImageVariablesSha256:
    "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  embeddedStreamPayloadSha256:
    "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2",
});

const SCRIPT_EXPECTATIONS = Object.freeze([
  Object.freeze({
    path: "scripts/DefineButton2_33/BUTTONCONDACTION on(release).as",
    sha256: "f313600b1ef09c0aa4ee3b4e339baf034554a784223a9692d34a1d98856b05aa",
    exactSource:
      'on(release){\n   q;\n   _global.KeyAttribute = "Positive";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
  }),
  Object.freeze({
    path: "scripts/DefineButton2_46/BUTTONCONDACTION on(release).as",
    sha256: "aa8e289a30aaf4e7447d3493c4e79cad373872a583e9067f01131ebdaddfea3e",
    exactSource:
      'on(release){\n   q;\n   _global.KeyAttribute = "Negative";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n',
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

const UNRESOLVED = Object.freeze([
  "The 10-frame root timeline and natural InternalPreloader entry have no authoritative original-runtime baseline; root rendering is disabled in the prototype module.",
  "sprite-49 is exposed only as deterministic source-static drawing frames. Static placement does not prove natural runtime reachability, root compositing, or complete scenario coverage.",
  "The one-frame root companion sprite-53 and the other root-level page-title/background placements are inventoried but not rendered as a separate domain or composited into sprite-49.",
  "Button 33 writes Positive and button 46 writes Negative to _global.KeyAttribute, calls the unresolved host DoHyperLinks function, and stops a host animation path. The generated candidate executes none of these operations and exposes no interactive controls.",
  "The source-static drawing is enabled only for English. No Spanish visual-language parity or page-level translation is inferred.",
  "One embedded MP3 stream and one associated Spanish MP3 are inventoried but neither is rendered; language assignment, cue mapping, synchronization, listening, and audio acceptance remain unresolved.",
  "Replay/reset parity, full-frame RMSE, product QA, accessibility QA, human visual review, owner acceptance, and strict migration completion remain false.",
]);
const REPORT_UNRESOLVED = Object.freeze(
  UNRESOLVED.map((item) =>
    item.startsWith("One embedded MP3 stream")
      ? "The exact embedded MP3 stream is host-wired at source frame 8 and the exact associated Spanish MP3 is exposed through a user control as current-JavaScript engineering candidates. Spoken-language authority, original-runtime cue/synchronization parity, complete listening acceptance, and Spanish visual parity remain unresolved."
      : item
  ),
);

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
  const bytes = await readFile(absolutePath);
  invariant(
    bytes.length === expectedBytes,
    `${label}: expected ${expectedBytes} bytes, observed ${bytes.length}`,
  );
  invariant(
    sha256(bytes) === expectedHash,
    `${label}: SHA-256 does not match the pinned source identity`,
  );
  return bytes;
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
    return await execFile(command, args, {
      maxBuffer: 50_000_000,
      ...options,
    });
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
  const sprite49 = domains.find((entry) => entry.domainId === "sprite-49");
  const sprite53 = domains.find((entry) => entry.domainId === "sprite-53");
  invariant(
    root?.declaredFrameCount === 10 &&
      JSON.stringify(root.placedSpriteIds) === JSON.stringify([49, 53]),
    "SWF parser: root placement graph changed",
  );
  invariant(
    sprite49?.declaredFrameCount === 278 &&
      sprite53?.declaredFrameCount === 1,
    "SWF parser: nested timelines changed",
  );
  const positiveButton = sprite49.placementEdges.find(
    (entry) => entry.characterId === 33,
  );
  const negativeButton = sprite49.placementEdges.find(
    (entry) => entry.characterId === 46,
  );
  invariant(
    positiveButton?.characterType === "DefineButton2" &&
      positiveButton.firstFrame === 120 &&
      negativeButton?.characterType === "DefineButton2" &&
      negativeButton.firstFrame === 159,
    "SWF parser: source button visual boundaries changed",
  );
  return {root, sprite49, sprite53};
}

function validateAudioFacts(audio) {
  invariant(
    audio.tagCounts.DefineSound === 0 &&
      audio.tagCounts.SoundStreamHead === 1 &&
      audio.tagCounts.SoundStreamBlock === 271,
    "embedded-audio parser: tag inventory changed",
  );
  invariant(
    audio.defineSounds.length === 0 && audio.soundStreams.length === 1,
    "embedded-audio parser: stream count changed",
  );
  const stream = audio.soundStreams[0];
  invariant(
    stream.ownerDomainId === "sprite-49" &&
      stream.blockCount === 271 &&
      stream.blocks[0]?.localFrame === 8 &&
      stream.blocks.at(-1)?.localFrame === 278,
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
    placement.targetSprite.objectId === 49 &&
      placement.targetSprite.frameCount === 278,
    "swfmill placement parser: target sprite changed",
  );
  invariant(
    placement.rootPlacement.frame === 6 &&
      placement.rootPlacement.depth === 1 &&
      placement.rootPlacement.name === "Animation" &&
      placement.rootPlacement.translationTwips.x === 7_219 &&
      placement.rootPlacement.translationTwips.y === 5_460,
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
      targetSpriteObjectId: 49,
      targetSpriteFunction: "sprite49",
      exportCanvas: {width: 688, height: 410},
      exportInternalTranslation: {x: 296.95, y: 196},
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
        placementName: "Animation",
        placementTwips: {x: 7_219, y: 5_460},
        placementPixels: {x: 360.95, y: 273},
      },
      local: {
        timelineId: "sprite-49",
        frameCount: 278,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 64, y: 77},
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
  return `# G4 L3 RW003 current-JavaScript engineering candidate

This report records deterministic, source-static Canvas drawing frames for \`${ANIMATION_ID}\`. It is not a migration workspace, strict ledger admission, public-library admission, authoritative Flash baseline, interactive behavior implementation, bilingual/audio acceptance, human approval, owner approval, or migration completion.

## Source-bound result

- Source: \`${report.source.swf.path}\` (SHA-256 \`${report.source.swf.sha256}\`)
- Stage/root: ${report.timeline.stage.width}×${report.timeline.stage.height}, ${report.timeline.fps} FPS, ${report.timeline.root.frameCount} root frames
- Addressable drawing domain: \`${report.timeline.local.timelineId}\`, ${report.timeline.local.frameCount} one-indexed frames
- Non-rendered source companion: \`sprite-53\`, 1 frame
- Renderer: \`${report.outputs.canvasRuntime.path}\` (SHA-256 \`${report.outputs.canvasRuntime.sha256}\`)
- Language allowed by this candidate: English only; Spanish fails closed
- Audio: exact source bytes are host-wired as an unaccepted current-JavaScript candidate
- Buttons: source visuals only; pointer behavior and host \`DoHyperLinks()\` are disabled

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

export async function generateG4L3Rw003CurrentJsCandidate({
  check = false,
  ffdec = "ffdec",
  python = "python3",
  swfmill = "swfmill",
} = {}) {
  const [
    sourceSwf,
    sourceFla,
    spanishAudio,
    parserBytes,
    audioAssetManifestBytes,
    audioQaBytes,
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
      SOURCE_SPANISH_AUDIO,
      EXPECTED.sourceSpanishAudioSha256,
      EXPECTED.sourceSpanishAudioBytes,
      "associated Spanish audio",
    ),
    readFile(projectPath(PLACEMENT_PARSER)),
    readFile(projectPath(AUDIO_ASSET_MANIFEST)),
    readFile(projectPath(AUDIO_QA_REPORT)),
  ]);
  const audioAssetManifest = JSON.parse(audioAssetManifestBytes);
  const audioQa = JSON.parse(audioQaBytes);
  invariant(
    audioAssetManifest.reportType ===
      "g4-l3-rw003-current-javascript-audio-assets" &&
      audioAssetManifest.animationId === ANIMATION_ID &&
      audioAssetManifest.strictAcceptanceEffect === "none",
    "RW003 exact-byte audio manifest is invalid",
  );
  invariant(
    audioQa.reportType === "g4-l3-rw003-current-javascript-audio-qa" &&
      audioQa.animationId === ANIMATION_ID &&
      audioQa.browserQa?.english?.pass === true &&
      audioQa.browserQa?.spanish?.pass === true &&
      audioQa.assetIntegrity?.exactSourceBytesPreserved === true &&
      Object.values(audioQa.acceptance ?? {}).every((value) => value === false) &&
      audioQa.strictAcceptanceEffect === "none",
    "RW003 current-JavaScript audio QA is invalid or acceptance-promoting",
  );
  const staticFacts = parseSwfSourceFacts(sourceSwf);
  const domains = validateStaticSwfFacts(staticFacts);
  const audioFacts = parseEmbeddedAudioPayloads(sourceSwf);
  const embeddedStream = validateAudioFacts(audioFacts);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-rw003-"));
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
      "49",
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
      "49",
      "--placement-name",
      "Animation",
      "--begin-label",
      "begin",
    ]);
    const placement = validatePlacement(JSON.parse(placementResult.stdout));

    const [helper, framesHtml, swfmillXmlBytes, scriptRelativePaths, swfmillVersion] =
      await Promise.all([
        readFile(path.join(canvasDirectory, "DefineSprite_49", "canvas.js")),
        readFile(path.join(canvasDirectory, "DefineSprite_49", "frames.html")),
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
    const manifest = {
      schemaVersion: 1,
      animationId: ANIMATION_ID,
      status: "source-static-current-javascript-engineering-candidate-only",
      authority:
        "Hash-bound static SWF structure plus a fresh deterministic FFDec Canvas export; not authoritative runtime, root compositing, interaction, localization, audio, visual parity, human, owner, or strict acceptance.",
      generatedBy: [
        "scripts/build-g4-l3-rw003-current-js-candidate.mjs",
        "scripts/build-safe-ffdec-canvas-adapter.mjs",
      ],
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
        legacyActionScriptExecuted: false,
        buttonVisualsPresentInSourceStaticFrames: true,
        sourceButtons: [
          {characterId: 33, firstLocalFrame: 120, keyAttribute: "Positive"},
          {characterId: 46, firstLocalFrame: 159, keyAttribute: "Negative"},
        ],
        unresolvedHostCall: "_root.DoHyperLinks()",
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
      acceptance: acceptanceBoundary(),
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(stableJson(manifest));
    const report = {
      schemaVersion: 1,
      reportType: "current-javascript-engineering-candidate",
      animationId: ANIMATION_ID,
      batch: {lesson: "G4 L3", batchId: "batch-001", batchOrdinal: 3},
      classification: {
        section: "RW",
        page: 3,
        titleRaw: "Page 2",
        titleDisplay: "Page 2",
        domain: "negative-numbers-number-line",
      },
      disposition: {
        currentJavaScriptCandidate: true,
        prototypeRegistryOnly: true,
        migrationScaffoldCreated: false,
        strictLedgerChanged: false,
        publicLibraryAdmitted: false,
        productionAdmission: false,
      },
      source: manifest.source,
      evidence: {
        staticStructureFingerprintSha256: staticFacts.structureFingerprintSha256,
        rootDomainFingerprintSha256: domains.root.domainFingerprintSha256,
        sprite49DomainFingerprintSha256: domains.sprite49.domainFingerprintSha256,
        sprite53DomainFingerprintSha256: domains.sprite53.domainFingerprintSha256,
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
          hostPlaybackImplemented: true,
          publicPath:
            "/flash-assets/courses/course-g04-l03-rw-003/audio/embedded-stream-0001.mp3",
          candidateCueFrame: 8,
          candidateEndFrame: 279,
          browserQaPassed: true,
          originalRuntimeSynchronizationEstablished: false,
          listeningAccepted: false,
          rendered: false,
          accepted: false,
        },
        associatedSpanishAudio: {
          path: SOURCE_SPANISH_AUDIO,
          bytes: spanishAudio.length,
          sha256: sha256(spanishAudio),
          catalogLanguage: "und",
          normalizedAssociation: "es-candidate-only",
          publicPath:
            "/flash-assets/courses/course-g04-l03-rw-003/audio/spanish-host-narration.mp3",
          hostUserControlImplemented: true,
          browserQaPassed: true,
          cueMappingEstablished: false,
          synchronizationVerified: false,
          listeningAccepted: false,
          rendered: false,
        },
        currentJavascriptAudioCandidate: {
          assetManifest: {
            path: AUDIO_ASSET_MANIFEST,
            bytes: audioAssetManifestBytes.length,
            sha256: sha256(audioAssetManifestBytes),
          },
          browserQa: {
            path: AUDIO_QA_REPORT,
            bytes: audioQaBytes.length,
            sha256: sha256(audioQaBytes),
          },
          exactSourceBytesPreserved: true,
          transcoded: false,
          englishPlaybackPassed: true,
          spanishPlaybackPassed: true,
          strictAcceptanceEffect: "none",
        },
      },
      timeline: {
        stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
        fps: 12,
        root: {frameCount: 10, renderable: false, blocker: "root-baseline-unavailable"},
        local: {
          timelineId: "sprite-49",
          frameCount: 278,
          publicFrameIndexing: "one-indexed",
          language: "en",
          status: "source-static-drawing-only",
        },
        companion: {
          timelineId: "sprite-53",
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
        prototypeModule: "packages/demos/src/modules/course-g04-l03-rw-003.tsx",
        pureTimeline: "packages/demos/src/timelines/course-g04-l03-rw-003.ts",
        audioAssetManifest: AUDIO_ASSET_MANIFEST,
        audioQaReport: AUDIO_QA_REPORT,
      },
      unresolved: [...REPORT_UNRESOLVED],
      acceptance: acceptanceBoundary(),
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
  console.log(stableJson(await generateG4L3Rw003CurrentJsCandidate(args)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
