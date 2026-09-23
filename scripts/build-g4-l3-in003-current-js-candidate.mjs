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
const ANIMATION_ID = "course-g04-l03-in-003";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.swf";
const SOURCE_FLA =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.fla";
const SOURCE_SPANISH_AUDIO =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3IN03.mp3";
const PLACEMENT_PARSER = "scripts/parse-swfmill-g4-l3-static-candidate.py";
const OUTPUT_SCRIPT =
  "public/flash-assets/courses/course-g04-l03-in-003/canvas-renderer.js";
const OUTPUT_MANIFEST =
  "public/flash-assets/courses/course-g04-l03-in-003/manifest.json";
const OUTPUT_REPORT_JSON =
  "reports/g4-l3-in003-current-javascript-candidate.json";
const OUTPUT_REPORT_MARKDOWN =
  "reports/g4-l3-in003-current-javascript-candidate.md";

const EXPECTED = Object.freeze({
  sourceSwfSha256:
    "ae967172d85728e42e4338f5ed74710b9b10eeb447fa6c6d86668bd63cc0dc7f",
  sourceSwfBytes: 152_888,
  sourceFlaSha256:
    "c960c1bef6638b6fa71c9e8016c7cd7f9d99594d99aae1f4af0724c2eb0d63f0",
  sourceFlaBytes: 1_682_432,
  sourceSpanishAudioSha256:
    "7a3cd30827262d18506f31114127012bd0a5b68dc5c7e37fe28b60693c3cff57",
  sourceSpanishAudioBytes: 397_152,
  ffdecTool: "JPEXS Free Flash Decompiler v.26.2.1",
  helperSha256:
    "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  helperBytes: 52_872,
  framesHtmlSha256:
    "57bb68dfdb4df78310d8137dccb0b8a6493e7a6dc15c8c9c84924a05c8687a76",
  framesHtmlBytes: 2_252_839,
  placedFunctionCount: 77,
  placedFunctionsSha256:
    "005998f5494d2a297f32c41cb6f61528eae955ee6d4c48701a3c3e9e4f1a48c6",
  embeddedImageVariableCount: 0,
  embeddedImageVariablesSha256:
    "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  frame1ScriptSha256:
    "8edb4298364fccc1a492b99afd35910c38775e841df758cc2f8f09063e448862",
  frame6ScriptSha256:
    "c71f185593d153c467266a494ebee471c04c9b64044e6cf491e0d91d739e92fd",
  embeddedStreamPayloadSha256:
    "c8d354822d22b33c38559ab71c2d52276f18d16cd93f96de1239b3bb2f322795",
});

const UNRESOLVED = Object.freeze([
  "The 10-frame root timeline and natural InternalPreloader entry have no authoritative original-runtime baseline; root rendering is disabled in the prototype module.",
  "sprite-84 is exposed only as a deterministic source-static drawing domain. Static placement does not prove natural runtime reachability, compositing, or complete scenario coverage.",
  "The source-static drawing is enabled only for English. No Spanish visual-language parity or page-level translation is inferred.",
  "One embedded MP3 stream and one associated Spanish MP3 are inventoried but neither is rendered; language assignment, cue mapping, synchronization, listening, and audio acceptance remain unresolved.",
  "Replay/reset parity, full-frame RMSE, product QA, accessibility QA, human visual review, owner acceptance, and strict migration completion remain false.",
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
    throw new Error(
      `${command} failed${detail ? `:\n${detail}` : ""}`,
      {cause: error},
    );
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
  const sprite5 = domains.find((entry) => entry.domainId === "sprite-5");
  const sprite84 = domains.find((entry) => entry.domainId === "sprite-84");
  invariant(
    root?.declaredFrameCount === 10 &&
      JSON.stringify(root.placedSpriteIds) === JSON.stringify([5, 84]),
    "SWF parser: root placement graph changed",
  );
  invariant(
    sprite5?.declaredFrameCount === 1 && sprite84?.declaredFrameCount === 472,
    "SWF parser: nested timelines changed",
  );
  return {root, sprite5, sprite84};
}

function validateAudioFacts(audio) {
  invariant(
    audio.tagCounts.DefineSound === 0 &&
      audio.tagCounts.SoundStreamHead === 1 &&
      audio.tagCounts.SoundStreamBlock === 442,
    "embedded-audio parser: tag inventory changed",
  );
  invariant(
    audio.defineSounds.length === 0 && audio.soundStreams.length === 1,
    "embedded-audio parser: stream count changed",
  );
  const stream = audio.soundStreams[0];
  invariant(
    stream.ownerDomainId === "sprite-84" &&
      stream.blockCount === 442 &&
      stream.blocks[0]?.localFrame === 5 &&
      stream.blocks.at(-1)?.localFrame === 472,
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
    placement.targetSprite.objectId === 84 &&
      placement.targetSprite.frameCount === 472,
    "swfmill placement parser: target sprite changed",
  );
  invariant(
    placement.rootPlacement.frame === 6 &&
      placement.rootPlacement.depth === 4 &&
      placement.rootPlacement.name === "animation" &&
      placement.rootPlacement.translationTwips.x === 8_268 &&
      placement.rootPlacement.translationTwips.y === 5_666,
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
  invariant(scriptFiles.length === 2, "FFDec script export: expected two files");
  const normalized = scriptFiles.map((entry) => ({
    path: portable(entry.path),
    text: entry.text.replace(/\r\n?/g, "\n"),
  }));
  const frame1 = normalized.find((entry) => /frame_1\/DoAction\.as$/.test(entry.path));
  const frame6 = normalized.find((entry) => /frame_6\/DoAction\.as$/.test(entry.path));
  invariant(
    frame1?.text ===
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();\n' &&
      sha256(frame1.text) === EXPECTED.frame1ScriptSha256,
    "FFDec script export: frame 1 script changed",
  );
  invariant(
    frame6?.text === "stop();\n" &&
      sha256(frame6.text) === EXPECTED.frame6ScriptSha256,
    "FFDec script export: frame 6 script changed",
  );
  return normalized.map((entry) => ({
    path: entry.path,
    bytes: Buffer.byteLength(entry.text),
    sha256: sha256(entry.text),
    exactSource: entry.text,
  }));
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
      targetSpriteObjectId: 84,
      targetSpriteFunction: "sprite84",
      exportCanvas: {width: 692, height: 221},
      exportInternalTranslation: {x: 355.85, y: 142.8},
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
        placementTwips: {x: 8_268, y: 5_666},
        placementPixels: {x: 413.4, y: 283.3},
      },
      local: {
        timelineId: "sprite-84",
        frameCount: 472,
        playbackMode: "loop",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: 57.55, y: 140.5},
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
  return `# G4 L3 IN003 current-JavaScript engineering candidate

This report records a deterministic, source-static Canvas drawing candidate for \`${ANIMATION_ID}\`. It is not a migration workspace, strict ledger admission, public-library admission, authoritative Flash baseline, bilingual/audio acceptance, human approval, owner approval, or migration completion.

## Source-bound result

- Source: \`${report.source.swf.path}\` (SHA-256 \`${report.source.swf.sha256}\`)
- Stage/root: ${report.timeline.stage.width}×${report.timeline.stage.height}, ${report.timeline.fps} FPS, ${report.timeline.root.frameCount} root frames
- Addressable drawing domain: \`${report.timeline.local.timelineId}\`, ${report.timeline.local.frameCount} one-indexed frames
- Renderer: \`${report.outputs.canvasRuntime.path}\` (SHA-256 \`${report.outputs.canvasRuntime.sha256}\`)
- Language allowed by this candidate: English only; Spanish fails closed
- Audio: inventoried but disabled

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
    invariant(target.isFile() && !target.isSymbolicLink(), `${absolutePath} is not a regular file`);
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

export async function generateG4L3In003CurrentJsCandidate({
  check = false,
  ffdec = "ffdec",
  python = "python3",
  swfmill = "swfmill",
} = {}) {
  const [sourceSwf, sourceFla, spanishAudio, parserBytes] = await Promise.all([
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
  ]);
  const staticFacts = parseSwfSourceFacts(sourceSwf);
  const domains = validateStaticSwfFacts(staticFacts);
  const audioFacts = parseEmbeddedAudioPayloads(sourceSwf);
  const embeddedStream = validateAudioFacts(audioFacts);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-in003-"));
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
      "84",
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
      "84",
      "--placement-name",
      "animation",
      "--begin-label",
      "begin",
    ]);
    const placement = validatePlacement(JSON.parse(placementResult.stdout));

    const [helper, framesHtml, swfmillXmlBytes, scriptRelativePaths, swfmillVersion] =
      await Promise.all([
        readFile(path.join(canvasDirectory, "DefineSprite_84", "canvas.js")),
        readFile(path.join(canvasDirectory, "DefineSprite_84", "frames.html")),
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
      built.imageVariables.length === 0,
      "safe adapter: unexpected embedded image appeared",
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
        "Hash-bound static SWF structure plus a fresh deterministic FFDec Canvas export; not authoritative runtime, localization, audio, visual parity, human, owner, or strict acceptance.",
      generatedBy: [
        "scripts/build-g4-l3-in003-current-js-candidate.mjs",
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
      safety: {
        noLegacyActionScriptExecuted: true,
        noDynamicEvaluation: true,
        noNetworkPrimitives: true,
        noTimersOrAutoplay: true,
        noPersistentStorage: true,
        noAmbientDomListeners: true,
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
      batch: {lesson: "G4 L3", batchId: "batch-001", batchOrdinal: 14},
      classification: {
        section: "IN",
        page: 3,
        titleRaw: "Numbers on the Number Line",
        titleDisplay: "Numbers on the Number Line",
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
        sprite5DomainFingerprintSha256: domains.sprite5.domainFingerprintSha256,
        sprite84DomainFingerprintSha256: domains.sprite84.domainFingerprintSha256,
        rootPlacement: placement.rootPlacement,
        rootBeginLabel: placement.rootBeginLabel,
        scripts,
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
        associatedSpanishAudio: {
          path: SOURCE_SPANISH_AUDIO,
          bytes: spanishAudio.length,
          sha256: sha256(spanishAudio),
          catalogLanguage: "und",
          normalizedAssociation: "es-candidate-only",
          cueMappingEstablished: false,
          synchronizationVerified: false,
          listeningAccepted: false,
          rendered: false,
        },
      },
      timeline: {
        stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
        fps: 12,
        root: {frameCount: 10, renderable: false, blocker: "root-baseline-unavailable"},
        local: {
          timelineId: "sprite-84",
          frameCount: 472,
          publicFrameIndexing: "one-indexed",
          language: "en",
          status: "source-static-drawing-only",
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
        prototypeModule: "packages/demos/src/modules/course-g04-l03-in-003.tsx",
        pureTimeline: "packages/demos/src/timelines/course-g04-l03-in-003.ts",
      },
      unresolved: [...UNRESOLVED],
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
  console.log(stableJson(await generateG4L3In003CurrentJsCandidate(args)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
