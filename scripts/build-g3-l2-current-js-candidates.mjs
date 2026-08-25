#!/usr/bin/env node

/**
 * Materialize the page-only G3 L2 Current-JavaScript candidate layer from the
 * checked FFDec Canvas/P-code factory run. The compiler projection is kept
 * acceptance-neutral: it never executes AVM1, infers audio language, or opens
 * a release/strict-completion gate.
 */

import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FACTORY_ROOT =
  "work/g3-l2-ffdec-canvas-pcode-factory/full";
const AUDIT_PATH = "reports/g3-l2-cross-grade-factory-audit.json";
const CATALOG_PATH = "catalog/animations.json";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES";
const REGISTRY_PATH = "packages/demos/prototype-registry.json";
const RECEIPT_PATH = "reports/g3-l2-current-js-candidate-build.json";
const SHA256 = /^[a-f0-9]{64}$/;
const EXPECTED_COUNT = 70;
const EXPECTED_AUDIO_COUNT = 62;
const RW002 = "course-g03-l02-rw-002";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `project path must be relative: ${relativePath}`,
  );
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `project path escaped the worktree: ${relativePath}`,
  );
  return resolved;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function identity(relativePath) {
  const bytes = await readFile(absolute(relativePath));
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function identityAbsolute(filePath, logicalPath) {
  invariant(path.isAbsolute(filePath), `${logicalPath}: absolute path required`);
  const bytes = await readFile(filePath);
  return Object.freeze({
    path: logicalPath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(absolute(relativePath), "utf8"));
}

export function parseArguments(argv) {
  const options = {
    check: null,
    factoryRoot: FACTORY_ROOT,
    runtimeOnly: false,
    sourceRoot: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--write", "--check"].includes(argument)) {
      invariant(options.check === null,
        "exactly one of --write or --check is required");
      options.check = argument === "--check";
      continue;
    }
    if (argument === "--runtime-only") {
      options.runtimeOnly = true;
      continue;
    }
    if (["--factory-root", "--source-root"].includes(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      if (argument === "--factory-root") options.factoryRoot = value;
      else options.sourceRoot = value;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  invariant(options.check !== null,
    "exactly one of --write or --check is required");
  invariant(!options.runtimeOnly || options.check,
    "--runtime-only requires --check");
  invariant(!path.isAbsolute(options.factoryRoot) &&
    (options.factoryRoot === "work/g3-l2-ffdec-canvas-pcode-factory" ||
      options.factoryRoot.startsWith("work/g3-l2-ffdec-canvas-pcode-factory/")),
  "--factory-root must be inside work/g3-l2-ffdec-canvas-pcode-factory");
  if (options.sourceRoot !== null) {
    invariant(path.isAbsolute(options.sourceRoot),
      "--source-root must be absolute");
  }
  return Object.freeze(options);
}

function analyzeFramesHtml(framesHtml, objectId) {
  const normalized = framesHtml.replace(/\r\n?/g, "\n");
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/,
  );
  invariant(canvas, `sprite ${objectId}: FFDec Canvas size is missing`);
  const inlineStart = normalized.indexOf(
    '<script>var canvas=document.getElementById("myCanvas");',
  );
  const inlineEnd = normalized.indexOf("</script>", inlineStart);
  invariant(
    inlineStart >= 0 && inlineEnd > inlineStart,
    `sprite ${objectId}: FFDec inline script boundary is missing`,
  );
  const inline = normalized.slice(inlineStart, inlineEnd);
  const definitionsStart = inline.indexOf("var scalingGrids = {};");
  const viewerStart = inline.indexOf("\nvar frame = -1;");
  invariant(
    definitionsStart >= 0 && viewerStart > definitionsStart,
    `sprite ${objectId}: FFDec definition boundary is missing`,
  );
  const definitions = inline.slice(definitionsStart, viewerStart);
  const header = definitions.match(
    new RegExp(
      `function\\s+sprite${objectId}\\(ctx,ctrans,frame,ratio,time\\)\\{` +
        `\\s*ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1,` +
        `([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];` +
        `\\s*var frame_cnt = (\\d+);`,
    ),
  );
  invariant(header, `sprite ${objectId}: audited header changed`);
  const placedFunctions = [
    ...new Set(
      [...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g)]
        .map((match) => match[1]),
    ),
  ].sort();
  const imageVariables = [
    ...definitions.matchAll(
      /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\)/g,
    ),
  ].map((match) => match[1]);
  const fontFunctions = [
    ...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g),
  ].map((match) => match[1]);
  invariant(
    placedFunctions.length > 0,
    `sprite ${objectId}: drawing-function closure is empty`,
  );
  return Object.freeze({
    canvas: Object.freeze({width: Number(canvas[1]), height: Number(canvas[2])}),
    internalTranslation: Object.freeze({x: Number(header[1]), y: Number(header[2])}),
    frameCount: Number(header[3]),
    placedFunctions: Object.freeze({
      count: placedFunctions.length,
      sha256: sha256(JSON.stringify(placedFunctions)),
    }),
    imageVariables: Object.freeze({
      count: imageVariables.length,
      sha256: sha256(JSON.stringify(imageVariables)),
    }),
    fontFunctions: Object.freeze({
      count: fontFunctions.length,
      sha256: sha256(JSON.stringify(fontFunctions)),
    }),
  });
}

function sourcePath(relativeSourcePath) {
  return `${SOURCE_PREFIX}/${relativeSourcePath}`;
}

function physicalSourcePath(relativeSourcePath, sourceRoot = null) {
  if (sourceRoot === null) return absolute(sourcePath(relativeSourcePath));
  const resolvedRoot = path.resolve(sourceRoot);
  const resolved = path.resolve(resolvedRoot, relativeSourcePath);
  invariant(resolved.startsWith(`${resolvedRoot}${path.sep}`),
    `source path escapes explicit root: ${relativeSourcePath}`);
  return resolved;
}

function audioDurationMs(filePath) {
  const output = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1",
      filePath,
    ],
    {encoding: "utf8"},
  ).trim();
  const durationMs = Math.round(Number(output) * 1000);
  invariant(
    Number.isSafeInteger(durationMs) && durationMs > 0,
    `${filePath}: ffprobe returned an invalid duration`,
  );
  return durationMs;
}

function decodeAudioToEof(filePath) {
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", filePath, "-f", "null", "-"],
    {stdio: ["ignore", "ignore", "pipe"]},
  );
}

function adapterSpec(member, inputs, analysis) {
  const target = member.target;
  const behavior = member.behavior;
  const unresolved = [
    `The ${target.rootFrameCount}-frame root and its preloader transition have no authoritative original-runtime baseline; only sprite-${target.objectId} is projected.`,
    `sprite-${target.objectId} frames 1..${target.frameCount} are a deterministic FFDec source-static drawing projection; natural reachability, timing parity, masking parity, and full-frame visual parity remain unestablished.`,
    `${behavior.buttonActionCount} button action(s), ${behavior.clipActionCount} clip action(s), ${behavior.branchOpcodeCount} branch opcode(s), and all legacy host calls are inert; no AVM1 is executed.`,
    member.exactExternalAudio.length
      ? "The exact matching-basename external MP3 is staged only as a user-activated, language-undetermined host candidate; cue timing, synchronization, spoken language, and listening acceptance remain false."
      : "No matching-basename external MP3 is staged for this member; embedded stream structure is not rendered or accepted.",
    "No authoritative Adobe runtime capture, RMSE comparison, accessibility acceptance, human review, Owner acceptance, strict completion, release, or publication is represented by this candidate.",
  ];
  return Object.freeze({
    schemaVersion: 1,
    animationId: member.animationId,
    classification:
      "g3-l2-page-only-source-static-current-javascript-candidate",
    source: Object.freeze({
      swf: sourcePath(member.source.path),
      swfSha256: member.source.sha256,
    }),
    evidence: Object.freeze({
      scenarioInventory: AUDIT_PATH,
      scenarioInventorySha256: inputs.audit.sha256,
      audioAudit: member.evidence.memberManifest.path,
      audioAuditSha256: member.evidence.memberManifest.sha256,
    }),
    ffdecExport: Object.freeze({
      tool: "JPEXS Free Flash Decompiler 26.2.1",
      helper: inputs.helper.path,
      helperSha256: inputs.helper.sha256,
      framesHtml: inputs.frames.path,
      framesHtmlSha256: inputs.frames.sha256,
      targetSpriteObjectId: target.objectId,
      targetSpriteFunction: `sprite${target.objectId}`,
      exportCanvas: analysis.canvas,
      exportInternalTranslation: analysis.internalTranslation,
      expectedPlacedFunctionCount: analysis.placedFunctions.count,
      expectedPlacedFunctionsSha256: analysis.placedFunctions.sha256,
      embeddedImageVariableCount: analysis.imageVariables.count,
      embeddedImageVariablesSha256: analysis.imageVariables.sha256,
      expectedFontFunctionCount: analysis.fontFunctions.count,
      expectedFontFunctionsSha256: analysis.fontFunctions.sha256,
    }),
    timeline: Object.freeze({
      fps: 12,
      stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
      root: Object.freeze({
        frameCount: target.rootFrameCount,
        preloaderStopFrame: 1,
        beginFrame: target.frame,
        beginLabel: "begin",
        placementName: target.instanceName,
        placementTwips: target.placementTwips,
        placementPixels: target.placementPixels,
      }),
      local: Object.freeze({
        timelineId: `sprite-${target.objectId}`,
        frameCount: target.frameCount,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      }),
      stageRenderOffset: Object.freeze({
        x: target.placementPixels.x - analysis.internalTranslation.x,
        y: target.placementPixels.y - analysis.internalTranslation.y,
      }),
    }),
    runtimeContract: Object.freeze({
      kind: "structural-local-frame",
      scenarios: Object.freeze(["source-static-frame"]),
      defaultScenario: "source-static-frame",
      supportedLanguages: Object.freeze(["en"]),
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      blockedLocalFrameRanges: Object.freeze([]),
      unresolved: Object.freeze(unresolved),
    }),
    output: Object.freeze({
      script:
        `apps/web/public/flash-assets/courses/${member.animationId}/canvas-renderer.js`,
      manifest:
        `apps/web/public/flash-assets/courses/${member.animationId}/manifest.json`,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    }),
  });
}

function timelineSource(member, catalogEntry, memberManifest, audioCandidate) {
  const constant = member.animationId.toUpperCase().replaceAll("-", "_");
  const target = member.target;
  const companionDomains = memberManifest.timeline.nestedFrameDomains
    .filter((domain) => domain.objectId !== target.objectId)
    .map((domain) => Object.freeze({
      id: `sprite-${domain.objectId}`,
      frameCount: domain.frameCount,
      label: `Separate source sprite ${domain.objectId}`,
    }));
  const controlLabel =
    member.behavior.machineTriageLane === "linear-timeline-review"
      ? "Source timeline controls, embedded stream timing, and original host composition remain acceptance-unvalidated"
      : `${member.behavior.buttonActionCount} source button action(s), ${member.behavior.clipActionCount} clip action(s), and all legacy host calls remain inert`;
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
${member.animationId === RW002 ? 'import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";\n' : ""}
export const ${constant}_SOURCE = Object.freeze(${JSON.stringify({
    swf: sourcePath(member.source.path),
    swfSha256: member.source.sha256,
    fla: member.source.pairedFla ? sourcePath(member.source.pairedFla.path) : null,
    flaSha256: member.source.pairedFla?.sha256 ?? null,
    associatedAudio: audioCandidate?.sourcePath ?? null,
    associatedAudioSha256: audioCandidate?.sha256 ?? null,
    associatedAudioLanguage: audioCandidate ? "und" : null,
    spriteObjectId: target.objectId,
    rootBeginFrame: target.frame,
    rootPlacementTwips: target.placementTwips,
    rootPlacementPixels: target.placementPixels,
  }, null, 2)});

${member.animationId === RW002 ? `export const ${constant}_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "number",
    characterId: 235,
    keyAttribute: "Number",
    firstFrame: 732,
    lastFrame: 1056,
    depth: 97,
    sourceBounds: Object.freeze({left: 130.1, right: 194.15, top: 288.25, bottom: 309.743}),
    entryIds: Object.freeze({en: "en-0423-3bcf1a5c2467", es: "es-0453-4b5725cf77e3"}),
    labels: Object.freeze({en: "Number", es: "Número"}),
  }),
] as const);

export const ${constant}_GLOSSARY_CONFIG = Object.freeze({
  animationId: "${member.animationId}",
  frameDomain: "sprite-${target.objectId}",
  terms: ${constant}_GLOSSARY_HOTSPOTS,
  playbackDisposition: "source-stop-timeline-and-audio-until-explicit-resume",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);

` : ""}export const ${constant}_CONFIG = Object.freeze({
  animationId: "${member.animationId}",
  title: ${JSON.stringify(`${catalogEntry.classification.titleEnglish} — G3 L2 source-static Current-JavaScript candidate`)},
  sourceSwfSha256: ${constant}_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/${member.animationId}/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: ${target.rootFrameCount},
  rootBeginFrame: ${target.frame},
  mainFrameDomain: "sprite-${target.objectId}",
  mainFrameCount: ${target.frameCount},
  playbackMode: "once",
  strictCaptureIdentity: true,
  companionDomains: Object.freeze(${JSON.stringify(companionDomains, null, 2)}),
  visualMarkers: Object.freeze([
    Object.freeze({id: ${JSON.stringify(member.behavior.machineTriageLane)}, firstFrame: 1, lastFrame: ${target.frameCount}}),
  ]),
  sourceControlBehaviorLabel: ${JSON.stringify(controlLabel)},
} satisfies SourceStaticCanvasCandidateConfig);

export const ${constant}_AUTHORITY = Object.freeze({
  pageOnlyCurrentJavascriptCandidate: true,
  structuralDrawingProjection: true,
  legacyActionScriptExecuted: false,
  embeddedAudioRendered: false,
  associatedAudioUserCandidate: ${Boolean(audioCandidate)},
  associatedAudioLanguageEstablished: false,
  audioListeningAccepted: false,
  behaviorParityEstablished: false,
  originalRuntimeEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  released: false,
  published: false,
  strictAcceptanceEffect: "none",
});
`;
}

function moduleSource(member, audioCandidate) {
  const id = member.animationId;
  const constant = id.toUpperCase().replaceAll("-", "_");
  const functionStem = id
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  const audioTracks = audioCandidate
    ? `Object.freeze([Object.freeze({
      id: "${id}-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "${audioCandidate.publicPath}",
      durationMs: ${audioCandidate.durationMs},
      sha256: "${audioCandidate.sha256}",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-${member.target.objectId}"]),
      timelineBehavior: "none" as const,
    })])`
    : "Object.freeze([])";
  const specialImports = id === RW002
    ? `import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";\n`
    : "";
  const configImports = id === RW002
    ? `${constant}_CONFIG, ${constant}_GLOSSARY_CONFIG, ${constant}_GLOSSARY_HOTSPOTS, ${constant}_SOURCE`
    : `${constant}_CONFIG, ${constant}_SOURCE`;
  const candidateDeclaration = id === RW002
    ? `const sourceStaticCandidate = createSourceStaticCanvasCandidate(${constant}_CONFIG);
const candidate = createCourseG04L03SourceGlossaryCandidate(
  sourceStaticCandidate,
  ${constant}_GLOSSARY_CONFIG,
);`
    : `const sourceStaticCandidate = createSourceStaticCanvasCandidate(${constant}_CONFIG);
const candidate = sourceStaticCandidate;`;
  return `"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
${specialImports}import {
  ${configImports},
} from "../timelines/${id}";

${candidateDeclaration}

export {${constant}_SOURCE${id === RW002 ? `, ${constant}_GLOSSARY_HOTSPOTS` : ""}};
export const ${constant}_MOVIE = sourceStaticCandidate.movie;
export const ${constant}_RUNTIME = sourceStaticCandidate.runtime;
export const ${constant}_SOURCE_CONTRACT = candidate.sourceContract;
export const ${constant}_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalize${functionStem}Frame = sourceStaticCandidate.normalizeFrame;
export const get${functionStem}FrameState = sourceStaticCandidate.getFrameState;
export const build${functionStem}CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const ${functionStem}Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: ${audioTracks},
});
`;
}

function candidateManifest(member, spec, runtimeResult, inputs, audioCandidate) {
  return `${JSON.stringify({
    schemaVersion: 1,
    reportType: "g3-l2-current-javascript-candidate-manifest",
    animationId: member.animationId,
    classification: spec.classification,
    source: spec.source,
    compilerEvidence: {
      factoryAudit: inputs.audit,
      memberManifest: member.evidence.memberManifest,
      ffdecHelper: inputs.helper,
      ffdecFramesHtml: inputs.frames,
    },
    runtime: {
      script: spec.output.script,
      bytes: Buffer.byteLength(runtimeResult.runtime),
      sha256: sha256(runtimeResult.runtime),
      timeline: runtimeResult.metadata,
      drawingObjectCount: runtimeResult.placedFunctions.length,
      embeddedImageCount: runtimeResult.imageVariables.length,
      legacyActionScriptExecuted: false,
      sourceStaticProjectionOnly: true,
    },
    exactExternalAudio: audioCandidate
      ? {
          source: audioCandidate.sourcePath,
          publicPath: audioCandidate.publicPath,
          bytes: audioCandidate.bytes,
          sha256: audioCandidate.sha256,
          catalogLanguage: "und",
          spokenLanguage: "undetermined",
          durationMs: audioCandidate.durationMs,
          fullEofDecodePassed: true,
          playbackCompiled: true,
          runtimeSynchronizationEstablished: false,
          listeningAccepted: false,
        }
      : null,
    behavior: member.behavior,
    acceptanceEffects: {
      pageOnlyCurrentJavascriptCandidate: true,
      originalRuntime: false,
      visualFidelity: false,
      behaviorParity: false,
      audioAccepted: false,
      humanVisual: false,
      owner: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  }, null, 2)}\n`;
}

async function writeOrCheck(relativePath, expected, check) {
  const bytes = Buffer.isBuffer(expected) ? expected : Buffer.from(expected);
  if (check) {
    const actual = await readFile(absolute(relativePath));
    invariant(
      actual.equals(bytes),
      `${relativePath}: generated output is stale`,
    );
    return;
  }
  await mkdir(path.dirname(absolute(relativePath)), {recursive: true});
  await writeFile(absolute(relativePath), bytes);
}

async function buildAudioCandidate(member, check, sourceRoot) {
  const association = member.exactExternalAudio[0];
  if (!association) return null;
  invariant(
    member.exactExternalAudio.length === 1 &&
      association.language === "und" &&
      association.association === "matching-basename" &&
      SHA256.test(association.sha256),
    `${member.animationId}: external audio catalog binding changed`,
  );
  const source = sourcePath(association.path);
  const physicalSource = physicalSourcePath(association.path, sourceRoot);
  const sourceIdentity = await identityAbsolute(physicalSource, source);
  invariant(
    sourceIdentity.bytes === association.bytes &&
      sourceIdentity.sha256 === association.sha256,
    `${member.animationId}: external audio bytes changed`,
  );
  const publicPath =
    `/flash-assets/courses/${member.animationId}/audio/source-associated-undetermined.mp3`;
  const output = `apps/web/public${publicPath}`;
  if (check) {
    const outputIdentity = await identity(output);
    invariant(
      outputIdentity.bytes === association.bytes &&
        outputIdentity.sha256 === association.sha256,
      `${member.animationId}: staged audio changed`,
    );
  } else {
    await mkdir(path.dirname(absolute(output)), {recursive: true});
    const temporaryOutput = `${absolute(output)}.next`;
    await writeFile(temporaryOutput, await readFile(physicalSource), {
      mode: 0o644,
    });
    await rename(temporaryOutput, absolute(output));
    decodeAudioToEof(physicalSource);
  }
  return Object.freeze({
    sourcePath: source,
    publicPath,
    outputPath: output,
    bytes: association.bytes,
    sha256: association.sha256,
    durationMs: audioDurationMs(physicalSource),
  });
}

function registryText(registry, members) {
  const memberIds = new Set(members.map(({animationId}) => animationId));
  const retained = registry.entries.filter((entry) => !memberIds.has(entry.key));
  const added = members.map(({animationId}) => ({
    key: animationId,
    module: `./modules/${animationId}`,
    maturity: "legacy-prototype",
  }));
  return `${JSON.stringify({schemaVersion: 1, entries: [...retained, ...added]}, null, 2)}\n`;
}

export async function buildG3L2CurrentJsCandidates({
  check = false,
  factoryRoot = FACTORY_ROOT,
  runtimeOnly = false,
  sourceRoot = null,
} = {}) {
  invariant(!runtimeOnly || check, "runtimeOnly requires read-only check mode");
  const factoryRun = `${factoryRoot}/run-manifest.json`;
  const [run, audit, catalog, registry, auditIdentity] = await Promise.all([
    readJson(factoryRun),
    readJson(AUDIT_PATH),
    readJson(CATALOG_PATH),
    readJson(REGISTRY_PATH),
    identity(AUDIT_PATH),
  ]);
  invariant(run.schemaVersion === 1 && run.mode === "extend", "factory run is not the checked G3 L2 extension");
  invariant(audit.schemaVersion === 1 && audit.members.length === EXPECTED_COUNT, "G3 L2 audit membership changed");
  invariant(run.members.length === EXPECTED_COUNT, "G3 L2 factory membership changed");
  invariant(registry.schemaVersion === 1 && Array.isArray(registry.entries), "prototype registry changed");
  const catalogById = new Map(catalog.animations.map((entry) => [entry.animationId, entry]));
  const auditById = new Map(audit.members.map((member) => [member.animationId, member]));
  const outputs = [];

  for (const [index, runMember] of run.members.entries()) {
    const member = auditById.get(runMember.animationId);
    const catalogEntry = catalogById.get(runMember.animationId);
    invariant(member && catalogEntry, `${runMember.animationId}: catalog/audit member missing`);
    invariant(member.ordinal === index + 1 && runMember.ordinal === index + 1, `${runMember.animationId}: source order changed`);
    const freshMemberManifestPath = `${factoryRoot}/${runMember.manifestPath}`;
    const [memberManifest, freshMemberManifestIdentity] = await Promise.all([
      readJson(freshMemberManifestPath),
      identity(freshMemberManifestPath),
    ]);
    invariant(
      freshMemberManifestIdentity.bytes === runMember.manifest.bytes &&
        freshMemberManifestIdentity.sha256 === runMember.manifest.sha256 &&
        memberManifest.animationId === member.animationId &&
        memberManifest.source?.before?.sha256 === member.source.sha256,
      `${member.animationId}: fresh factory member manifest changed`,
    );
    const objectId = member.target.objectId;
    const base = `${factoryRoot}/members/${member.animationId}/canvas/sprites/DefineSprite_${objectId}`;
    const framesPath = `${base}/frames.html`;
    const helperPath = `${base}/canvas.js`;
    const [framesIdentity, helperIdentity, framesHtml] = await Promise.all([
      identity(framesPath),
      identity(helperPath),
      readFile(absolute(framesPath), "utf8"),
    ]);
    const analysis = analyzeFramesHtml(framesHtml, objectId);
    invariant(analysis.frameCount === member.target.frameCount, `${member.animationId}: target frame count changed`);
    const audioCandidate = runtimeOnly
      ? null
      : await buildAudioCandidate(member, check, sourceRoot);
    const inputs = Object.freeze({
      audit: auditIdentity,
      frames: framesIdentity,
      helper: helperIdentity,
    });
    const spec = adapterSpec(member, inputs, analysis);
    const runtimeResult = buildSafeRuntime({
      helperSource: await readFile(absolute(helperPath), "utf8"),
      framesHtml,
      spec,
    });
    const specPath =
      `migrations/${member.animationId}/audit/g3-l2-source-static-current-js-candidate-spec.json`;
    const timelinePath = `packages/demos/src/timelines/${member.animationId}.ts`;
    const modulePath = `packages/demos/src/modules/${member.animationId}.tsx`;
    const manifest = candidateManifest(member, spec, runtimeResult, inputs, audioCandidate);
    if (runtimeOnly) {
      await writeOrCheck(spec.output.script, runtimeResult.runtime, true);
    } else {
      await Promise.all([
        writeOrCheck(specPath, `${JSON.stringify(spec, null, 2)}\n`, check),
        writeOrCheck(spec.output.script, runtimeResult.runtime, check),
        writeOrCheck(spec.output.manifest, manifest, check),
        writeOrCheck(
          timelinePath,
          timelineSource(member, catalogEntry, memberManifest, audioCandidate),
          check,
        ),
        writeOrCheck(modulePath, moduleSource(member, audioCandidate), check),
      ]);
    }
    outputs.push(Object.freeze({
      animationId: member.animationId,
      ordinal: member.ordinal,
      lane: member.behavior.machineTriageLane,
      runtime: Object.freeze({
        path: spec.output.script,
        bytes: Buffer.byteLength(runtimeResult.runtime),
        sha256: sha256(runtimeResult.runtime),
      }),
      module: modulePath,
      timeline: timelinePath,
      audio: audioCandidate,
      acceptanceEffects: Object.freeze({strictComplete: false, released: false, published: false}),
    }));
  }

  if (!runtimeOnly) {
    invariant(
      outputs.filter(({audio}) => audio).length === EXPECTED_AUDIO_COUNT,
      "G3 L2 external-audio candidate count changed",
    );
    await writeOrCheck(REGISTRY_PATH, registryText(registry, audit.members), check);
  }
  const receipt = {
    schemaVersion: 1,
    reportType: "g3-l2-page-only-current-javascript-candidate-build",
    lesson: {grade: 3, lesson: 2, activePageCount: EXPECTED_COUNT},
    inputs: {
      factoryRun: await identity(factoryRun),
      crossGradeAudit: auditIdentity,
      catalog: await identity(CATALOG_PATH),
    },
    summary: {
      registeredCandidateCount: outputs.length,
      exactExternalAudioCandidateCount: outputs.filter(({audio}) => audio).length,
      exactExternalAudioFullEofDecodeCount: outputs.filter(({audio}) => audio).length,
      audioLanguageEstablishedCount: 0,
      audioListeningAcceptedCount: 0,
      strictCompleteCount: 0,
      releasedCount: 0,
      publishedCount: 0,
      runtimeBytes: outputs.reduce((sum, output) => sum + output.runtime.bytes, 0),
    },
    pageOnlyScope: {
      legacyCourseShellExcluded: true,
      modernMyLessonHostRequired: true,
      structuralFactoryOutputIsNotStrictCompletion: true,
    },
    outputs,
    acceptanceEffects: {
      currentJavascriptCandidates: true,
      originalRuntime: false,
      visualFidelity: false,
      behaviorParity: false,
      audioAccepted: false,
      humanVisual: false,
      owner: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  };
  if (!runtimeOnly) {
    await writeOrCheck(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, check);
  }
  const summary = {
    checked: check,
    candidateCount: outputs.length,
    audioCandidateCount: runtimeOnly
      ? EXPECTED_AUDIO_COUNT
      : outputs.filter(({audio}) => audio).length,
    runtimeBytes: receipt.summary.runtimeBytes,
    strictCompleteCount: 0,
  };
  if (runtimeOnly) {
    summary.runtimeOnly = true;
    summary.browserLaunched = false;
    summary.factoryRun = await identity(factoryRun);
    summary.runtimes = outputs.map(({animationId, ordinal, runtime}) => ({
      animationId,
      ordinal,
      ...runtime,
      matchesV1Materialization: true,
    }));
  }
  return Object.freeze(summary);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  console.log(JSON.stringify(await buildG3L2CurrentJsCandidates(args), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
