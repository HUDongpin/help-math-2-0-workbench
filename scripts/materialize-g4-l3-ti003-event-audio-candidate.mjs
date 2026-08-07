#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseSwfmillAudio} from "./audit-pilot-audio.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ti-003";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const REPORT_JSON =
  "reports/g4-l3-ti003-current-js-event-audio-candidate.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ti003-current-js-event-audio-candidate.md";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;
const XML =
  "migrations/course-g04-l03-ti-003/audit/machine/swfmill.xml.gz";
const AUTHORING =
  "work/animate/dependency-authoring-audits/course-g04-l03-ti-003/" +
  "runs/run-ojgs8p/L3TI03.fla-authoring-audit.json";

const SOURCE_BINDINGS = Object.freeze([
  "catalog/lesson-release-ledger.json",
  "reports/g4-l3-embedded-audio-archive.json",
  "reports/g4-l3-audio-cas-media-probe.json",
  "reports/g4-l3-catalog-audio-media-probe.json",
  "migrations/course-g04-l03-ti-003/migration.json",
  XML,
  AUTHORING,
  "scripts/audit-pilot-audio.mjs",
  "packages/demos/src/modules/course-g04-l03-ti-003.tsx",
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.includes("\\") &&
      !relativePath.split("/").includes(".."),
    `${label} must be a normalized project-relative path`,
  );
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  invariant(
    relative &&
      !path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`),
    `${label} escapes the project root`,
  );
  return absolute;
}

async function readBinding(root, relativePath, expected = null) {
  const absolute = resolveInside(root, relativePath, relativePath);
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  let before;
  let contents;
  let after;
  try {
    before = await handle.stat();
    invariant(before.isFile(), `${relativePath} must be a regular file`);
    contents = await handle.readFile();
    after = await handle.stat();
  } finally {
    await handle.close();
  }
  const atPath = await lstat(absolute);
  invariant(
    atPath.isFile() &&
      !atPath.isSymbolicLink() &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.dev === atPath.dev &&
      before.ino === atPath.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
    `${relativePath} changed while reading`,
  );
  const result = {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
  if (expected) {
    invariant(
      result.bytes === expected.bytes && result.sha256 === expected.sha256,
      `${relativePath} differs from its exact-byte binding`,
    );
  }
  return result;
}

function findAuthoringCue(authoring) {
  const animation = authoring.library?.find(
    ({name, itemType}) => name === "Animation03" && itemType === "movie clip",
  );
  const audioLayer = animation?.timeline?.layers?.find(
    ({name}) => name === "Audio",
  );
  const cue = audioLayer?.keyframes?.find(
    ({flashFrame, soundName}) =>
      flashFrame === 1 && soundName === "G4L3_TryIt_Pg03",
  );
  const soundItem = authoring.library?.find(
    ({name, itemType}) =>
      name === "G4L3_TryIt_Pg03" && itemType === "sound",
  );
  invariant(
    authoring.document?.width === 800 &&
      authoring.document?.height === 600 &&
      authoring.document?.frameRate === 12 &&
      animation?.timeline?.frameCount === 140 &&
      cue?.soundSync === "event" &&
      cue?.soundLoop === 1 &&
      soundItem?.asset?.compressionType === "MP3",
    "TI003 Animate event-sound evidence changed",
  );
  return {
    libraryTimeline: animation.name,
    layer: audioLayer.name,
    frame: cue.flashFrame,
    soundName: cue.soundName,
    sync: cue.soundSync,
    loopCount: cue.soundLoop,
  };
}

function findCatalogProbe(catalogProbe) {
  const probe = catalogProbe.probes?.find(
    ({source}) =>
      source?.sha256 ===
      "063887f58c7ab3b45bd62320cbb4bd95a90db93214e987ffbc001e9c4cb80799",
  );
  invariant(
    probe?.source?.path ===
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/" +
        "ELMGR4/L3/SA/L3TI03.mp3" &&
      probe.source.bytes === 214_704 &&
      probe.source.normalizedLanguageCandidate === "es" &&
      probe.probe?.status ===
        "ffprobe-parsed-ffmpeg-decode-check-passed" &&
      probe.probe.ffmpegDecodeToNull?.decodeCheckPassed === true &&
      probe.probe.media?.timing?.durationSeconds === 15.336 &&
      probe.evidenceLimits?.spokenLanguageEstablished === false,
    "TI003 Spanish host-audio probe changed",
  );
  return probe;
}

async function deriveCandidate({
  root,
  releaseLedger,
  embeddedArchive,
  embeddedProbe,
  catalogProbe,
  migration,
  authoring,
}) {
  const release = releaseLedger.releases.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    release?.expectedMemberCount === 40 &&
      release.members.some(({animationId}) => animationId === ANIMATION_ID),
    "G4 L3 release membership changed",
  );
  invariant(
    migration.animationId === ANIMATION_ID &&
      migration.source?.swfSha256 ===
        "7abcc6151596b89d7b3142985bf8de2aae1d31ddb6eb47b14d2b9950c095a262" &&
      migration.implementation?.defaultFrameDomainId === "sprite-126",
    "TI003 migration binding changed",
  );
  const authoringCue = findAuthoringCue(authoring);
  const swfmill = await parseSwfmillAudio(resolveInside(root, XML, XML));
  const startSound = swfmill.startSounds.find(
    ({characterId, context, localFrame, syncMode, stop, loopCount}) =>
      characterId === 14 &&
      context?.kind === "sprite" &&
      context.characterId === 126 &&
      localFrame === 1 &&
      syncMode === "event" &&
      stop === false &&
      loopCount === 1,
  );
  const defineSound = swfmill.defineSounds.find(
    ({characterId}) => characterId === 14,
  );
  invariant(
    startSound &&
      defineSound?.format === "mp3" &&
      defineSound.sampleRateHz === 22_050 &&
      defineSound.channels === 1 &&
      defineSound.samples === 252_288,
    "TI003 SWF DefineSound/StartSound mapping changed",
  );
  const archiveItem = embeddedArchive.items.find(
    ({animationId}) => animationId === ANIMATION_ID,
  );
  const archived = archiveItem?.embeddedAudio?.defineSounds?.find(
    ({soundId}) => soundId === 14,
  );
  const probeItem = embeddedProbe.itemReferences.find(
    ({animationId}) => animationId === ANIMATION_ID,
  );
  const probe = probeItem?.units?.find(
    ({unitKind, soundId}) => unitKind === "DefineSound" && soundId === 14,
  );
  invariant(
    archived?.payload?.physicalHashVerified === true &&
      archived.payload.sha256 ===
        "b7912a56f852d5d8c61dfbaa3fb5e875d9495622c2388e07e5cb5e1d2de6573f" &&
      archived.payload.byteLength === 91_661 &&
      probe?.payload?.path === archived.payload.archivePath &&
      probe.payload.sha256 === archived.payload.sha256 &&
      probe.payload.byteLength === archived.payload.byteLength &&
      probe.technicalProbe?.probeStatus ===
        "ffprobe-parsed-ffmpeg-decode-check-passed" &&
      probe.technicalProbe.ffmpegDecodeCheckPassed === true &&
      probe.technicalProbe.decodedSampleCount === 252_288 &&
      probe.technicalProbe.durationSeconds === 11.457625,
    "TI003 embedded event MP3 evidence changed",
  );
  const spanishProbe = findCatalogProbe(catalogProbe);
  return {
    animationId: ANIMATION_ID,
    frameDomain: "sprite-126",
    sourcePlacement: {rootFrame: 6, localFrame: 1},
    authoringCue,
    swfEvent: {
      soundId: 14,
      frameDomain: "sprite-126",
      localFrame: 1,
      syncMode: "event",
      loopCount: 1,
    },
    english: {
      sourcePath: archived.payload.archivePath,
      outputPath:
        `public/flash-assets/courses/${ANIMATION_ID}/audio/` +
        "embedded-event-sound-0014.mp3",
      publicPath:
        `/flash-assets/courses/${ANIMATION_ID}/audio/` +
        "embedded-event-sound-0014.mp3",
      bytes: archived.payload.byteLength,
      sha256: archived.payload.sha256,
      durationMs: 11_458,
      structuralCueFrame: 1,
      language: "en",
      spokenLanguage: "undetermined",
    },
    spanish: {
      sourcePath: spanishProbe.source.path,
      outputPath:
        `public/flash-assets/courses/${ANIMATION_ID}/audio/` +
        "spanish-host-narration.mp3",
      publicPath:
        `/flash-assets/courses/${ANIMATION_ID}/audio/` +
        "spanish-host-narration.mp3",
      bytes: spanishProbe.source.bytes,
      sha256: spanishProbe.source.sha256,
      durationMs: 15_336,
      language: "es",
      spokenLanguage: "undetermined",
      activation: "user",
      timelineBehavior: "pause-while-playing",
    },
    excludedInteractionAudio: {
      state: "disabled-until-source-interaction-branches-are-implemented",
      reason:
        "Nested click and correct/incorrect feedback sounds are bound to " +
        "interactive states unavailable in the current source-static candidate.",
    },
  };
}

async function writeAssetNoReplace(root, asset, check) {
  const expected = {bytes: asset.bytes, sha256: asset.sha256};
  const source = await readBinding(root, asset.sourcePath, expected);
  const absolute = resolveInside(root, asset.outputPath, asset.outputPath);
  try {
    const existing = await readBinding(root, asset.outputPath, expected);
    const metadata = await stat(absolute);
    invariant(
      metadata.nlink === 1 && (metadata.mode & 0o777) === 0o444,
      `${asset.outputPath} immutable output metadata changed`,
    );
    return {...existing, result: "verified-existing"};
  } catch (error) {
    if (error.code !== "ENOENT" || check) throw error;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${asset.outputPath} output parent is not canonical`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(source.contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(absolute, 0o444);
  const written = await readBinding(root, asset.outputPath, expected);
  const metadata = await stat(absolute);
  invariant(
    metadata.nlink === 1 && (metadata.mode & 0o777) === 0o444,
    `${asset.outputPath} was not staged immutably`,
  );
  return {...written, result: "published-no-replace"};
}

function renderMarkdown(report) {
  const {candidate} = report;
  return `# G4 L3 TI003 current-JavaScript event-audio candidate\n\n` +
    `The current JavaScript candidate now stages the exact embedded ` +
    `\`DefineSound 14\` MP3 and starts it at \`${candidate.frameDomain}\` ` +
    `frame 1, matching the SWF \`StartSound\` tag and Animate's ` +
    `\`${candidate.authoringCue.soundName}\` event sound. The catalog-linked ` +
    `Spanish host MP3 remains user activated.\n\n` +
    `- English exact-byte SHA-256: \`${candidate.english.sha256}\`\n` +
    `- Spanish exact-byte SHA-256: \`${candidate.spanish.sha256}\`\n` +
    `- Interaction feedback audio: disabled until its source branches exist\n` +
    `- Strict completion effect: none\n\n` +
    `This does not establish spoken language, authoritative original-runtime ` +
    `synchronization, complete listening acceptance, interaction audio, human ` +
    `or Owner acceptance, strict completion, or publication.\n`;
}

async function emitDerived(root, relativePath, bytes, check) {
  const absolute = resolveInside(root, relativePath, relativePath);
  if (check) {
    invariant((await readFile(absolute)).equals(bytes), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
}

export async function materializeG4L3Ti003EventAudioCandidate({
  root = ROOT,
  check = false,
} = {}) {
  const canonicalRoot = await realpath(root);
  const generatorPath = portable(path.relative(canonicalRoot, SCRIPT_PATH));
  const [generator, ...bindings] = await Promise.all([
    readBinding(canonicalRoot, generatorPath),
    ...SOURCE_BINDINGS.map((item) => readBinding(canonicalRoot, item)),
  ]);
  const [
    releaseLedger,
    embeddedArchive,
    embeddedProbe,
    catalogProbe,
    migration,
  ] = bindings.slice(0, 5).map(({contents}) => JSON.parse(contents));
  const authoring = JSON.parse(bindings[6].contents);
  const candidate = await deriveCandidate({
    root: canonicalRoot,
    releaseLedger,
    embeddedArchive,
    embeddedProbe,
    catalogProbe,
    migration,
    authoring,
  });
  const assets = [];
  for (const asset of [candidate.english, candidate.spanish]) {
    assets.push(await writeAssetNoReplace(canonicalRoot, asset, check));
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ti003-current-js-event-audio-candidate",
    releaseId: RELEASE_ID,
    generator: {
      path: generator.path,
      bytes: generator.bytes,
      sha256: generator.sha256,
    },
    sourceBindings: bindings.map(
      ({path: bindingPath, bytes, sha256: bindingSha256}) => ({
        path: bindingPath,
        bytes,
        sha256: bindingSha256,
      }),
    ),
    authority:
      "Exact-byte source staging plus SWF/Animate structural event-cue mapping only",
    authorityBoundary:
      "No spoken-language, authoritative original-runtime synchronization, complete listening acceptance, interaction-audio parity, human review, owner acceptance, strict completion, or publication authority.",
    candidate,
    stagedAssets: assets.map(
      ({path: assetPath, bytes, sha256: assetSha256}) => ({
        path: assetPath,
        bytes,
        sha256: assetSha256,
        state: "present-exact-immutable",
      }),
    ),
    summary: {
      candidateMemberCount: 1,
      stagedAssetCount: assets.length,
      exactSourceBytesPreserved: true,
      transcoded: false,
      browserQaPassed: false,
      strictCompleteCount: 0,
      published: false,
    },
    acceptance: {
      spokenLanguageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      completeListeningAccepted: false,
      interactionAudioAccepted: false,
      replayParityAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  await emitDerived(
    canonicalRoot,
    REPORT_JSON,
    Buffer.from(stableJson(report)),
    check,
  );
  await emitDerived(
    canonicalRoot,
    REPORT_MARKDOWN,
    Buffer.from(renderMarkdown(report)),
    check,
  );
  return {
    action: check ? "verified" : "materialized",
    animationId: ANIMATION_ID,
    stagedAssetCount: assets.length,
    report: REPORT_JSON,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materializeG4L3Ti003EventAudioCandidate(
    parseArguments(process.argv.slice(2)),
  )
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
