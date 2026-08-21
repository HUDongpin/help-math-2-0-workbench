import {createHash} from "node:crypto";
import {createReadStream, createWriteStream} from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(LIB_DIR, "../../..");
export const DEFAULT_CORPUS_PATH = path.join(
  PROJECT_ROOT,
  "tools/flash-compiler-pilot/corpus.json",
);

export const ACCEPTANCE_EFFECTS_FALSE = Object.freeze({
  sourceCustodyChanged: false,
  modernCourseUiChanged: false,
  legacyCourseShellConverted: false,
  currentJavaScriptRegistered: false,
  originalRuntimeAccepted: false,
  visualFidelityAccepted: false,
  behaviorAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

const FEATURE_RULES = Object.freeze([
  Object.freeze({
    id: "timeline-stop-play",
    bucket: "bounded-lowering-candidate",
    pattern: /\b(?:stop|play)\s*\(|\b(?:Stop|Play)\b/g,
  }),
  Object.freeze({
    id: "timeline-goto",
    bucket: "bounded-lowering-candidate",
    pattern: /\b(?:gotoAndPlay|gotoAndStop|GotoFrame|GotoLabel)\b/g,
  }),
  Object.freeze({
    id: "basic-branch-and-arithmetic",
    bucket: "bounded-lowering-candidate",
    pattern: /\b(?:If|Jump|Equals2?|StrictEquals|Less2?|Greater|Add2?|Subtract|Multiply|Divide|Modulo|And|Or|Not)\b/g,
  }),
  Object.freeze({
    id: "variable-and-property-access",
    bucket: "bounded-lowering-candidate",
    pattern: /\b(?:GetVariable|SetVariable|GetMember|SetMember|GetProperty|SetProperty|StoreRegister)\b/g,
  }),
  Object.freeze({
    id: "function-and-method-call",
    bucket: "bounded-lowering-needs-call-contract",
    pattern: /\b(?:Call|CallFunction|CallMethod|DefineFunction2?|NewObject|NewMethod)\b/g,
  }),
  Object.freeze({
    id: "button-event-handler",
    bucket: "bounded-lowering-needs-event-contract",
    pattern: /\b(?:onRelease|onPress|onRollOver|onRollOut|onDragOver|onDragOut|onReleaseOutside|onClipEvent)\b/g,
  }),
  Object.freeze({
    id: "dynamic-eval",
    bucket: "manual-or-specialized-adapter",
    pattern: /\beval\s*\(|\bEval\b|["']eval["']/g,
  }),
  Object.freeze({
    id: "randomness",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:random|Random)\b/g,
  }),
  Object.freeze({
    id: "legacy-component-framework",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:FScrollBar|FUIComponent|UIObject|registerClass|TextField)\b/g,
  }),
  Object.freeze({
    id: "dynamic-movieclip-lifecycle",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:attachMovie|duplicateMovieClip|removeMovieClip|createEmptyMovieClip|startDrag|stopDrag)\b/g,
  }),
  Object.freeze({
    id: "timer-or-global-event-loop",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:setInterval|clearInterval|updateAfterEvent|onEnterFrame|onMouseMove)\b/g,
  }),
  Object.freeze({
    id: "host-level-contract",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b_level\d+\b|\b_root\b|\b_parent\b|\bInternalPreloader\b/g,
  }),
  Object.freeze({
    id: "external-navigation-or-loading",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:getURL|loadMovie|loadMovieNum|loadVariables|loadVariablesNum|FSCommand|fscommand|ExternalInterface)\b/g,
  }),
  Object.freeze({
    id: "network-or-persistence",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:XML|XMLSocket|LoadVars|NetConnection|SharedObject|LocalConnection)\b/g,
  }),
  Object.freeze({
    id: "sound-runtime-control",
    bucket: "manual-or-specialized-adapter",
    pattern: /\b(?:Sound|startSound|stopAllSounds|StartSound|StopSounds)\b/g,
  }),
]);

export function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function portable(value) {
  return value.split(path.sep).join("/");
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const input = createReadStream(filePath);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", resolve);
  });
  return hash.digest("hex");
}

export async function fileIdentity(filePath) {
  const info = await lstat(filePath);
  invariant(info.isFile(), `not a regular file: ${filePath}`);
  return {
    bytes: info.size,
    sha256: await sha256File(filePath),
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  };
}

export function resolveInside(root, relativePath, label = "path") {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label}: non-empty path required`);
  invariant(!path.isAbsolute(relativePath), `${label}: must be relative`);
  const normalized = path.normalize(relativePath);
  invariant(normalized !== ".." && !normalized.startsWith(`..${path.sep}`),
    `${label}: escapes root`);
  const resolved = path.resolve(root, normalized);
  invariant(resolved === root || resolved.startsWith(`${root}${path.sep}`),
    `${label}: escapes root`);
  return resolved;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function equalNestedSprites(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function exactCatalogProjection(entry) {
  return {
    animationId: entry.animationId,
    assetId: entry.assetId,
    source: {
      path: entry.source.path,
      bytes: entry.source.bytes,
      sha256: entry.source.sha256,
    },
    pairedFla: entry.pairedFla === null
      ? null
      : {
          path: entry.pairedFla.path,
          bytes: entry.pairedFla.bytes,
          sha256: entry.pairedFla.sha256,
        },
    referenced: entry.flags.referenced,
    unreferenced: entry.flags.unreferenced,
    variant: entry.flags.variant,
    shell: entry.flags.shell,
    courseXmlOccurrences: entry.references.courseXml.map((item) => item.occurrence),
  };
}

export function assertActiveLessonPageEligibility(member, catalogEntry) {
  invariant(catalogEntry, `${member.animationId}: missing catalog entry`);
  invariant(!/^index/i.test(path.basename(member.source.path)),
    `${member.animationId}: legacy shell-like basename rejected`);
  invariant(member.source.path.startsWith("HELP_COURSES/ELMGR"),
    `${member.animationId}: must be a course page path`);
  invariant(catalogEntry.flags?.referenced === true &&
    catalogEntry.flags?.unreferenced === false,
  `${member.animationId}: only active referenced pages are allowed`);
  invariant(catalogEntry.flags?.variant === false,
    `${member.animationId}: variants are not allowed in the formal pilot`);
  invariant(catalogEntry.flags?.shell === false,
    `${member.animationId}: legacy course shell rejected`);
  invariant(Array.isArray(catalogEntry.references?.courseXml) &&
    catalogEntry.references.courseXml.length > 0,
  `${member.animationId}: missing active lesson XML reference`);
  invariant(catalogEntry.classification?.collection === "course" &&
    Number.isSafeInteger(catalogEntry.classification?.page?.number),
  `${member.animationId}: catalog classification is not a lesson page`);
}

export async function validateCorpus({
  projectRoot = PROJECT_ROOT,
  corpusPath = DEFAULT_CORPUS_PATH,
} = {}) {
  const corpus = await readJson(corpusPath);
  invariant(corpus.schemaVersion === 1, "corpus schemaVersion must be 1");
  invariant(corpus.scope?.kind === "active-lesson-page-only",
    "corpus scope must be active-lesson-page-only");
  invariant(corpus.scope?.legacyCourseShellsExcluded === true,
    "corpus must exclude legacy course shells");
  invariant(corpus.scope?.modernCourseUiRetained === true,
    "corpus must retain the modern course UI");
  invariant(corpus.scope?.expectedMemberCount === 5,
    "pilot must contain exactly five members");
  invariant(Array.isArray(corpus.members) && corpus.members.length === 5,
    "pilot must contain exactly five members");

  const catalogPath = resolveInside(projectRoot, corpus.catalogPath, "catalogPath");
  const sourceRoot = resolveInside(projectRoot, corpus.sourceRoot, "sourceRoot");
  const [catalog, catalogIdentity, physicalSourceRoot] = await Promise.all([
    readJson(catalogPath),
    fileIdentity(catalogPath),
    realpath(sourceRoot),
  ]);
  invariant(catalog.summary?.references?.course?.occurrences ===
    corpus.scope.activeCoursePageOccurrenceDenominator,
  "active course-page occurrence denominator drifted");

  const catalogById = new Map(catalog.animations.map((entry) => [entry.animationId, entry]));
  const seenIds = new Set();
  const seenPaths = new Set();
  const members = [];
  let pairedFlaCount = 0;
  let swfOnlyCount = 0;

  for (const member of corpus.members) {
    invariant(/^course-g\d{2}-l\d{2}-[a-z]{2}-\d{3}(?:-[a-f0-9]{8})?$/.test(member.animationId),
      `invalid animationId: ${member.animationId}`);
    invariant(!seenIds.has(member.animationId), `duplicate animationId: ${member.animationId}`);
    seenIds.add(member.animationId);
    invariant(!seenPaths.has(member.source.path), `duplicate source path: ${member.source.path}`);
    seenPaths.add(member.source.path);
    invariant(member.assetId === `swf-${member.source.sha256}`,
      `${member.animationId}: assetId/SWF hash mismatch`);

    const catalogEntry = catalogById.get(member.animationId);
    assertActiveLessonPageEligibility(member, catalogEntry);
    const projection = exactCatalogProjection(catalogEntry);
    invariant(projection.assetId === member.assetId,
      `${member.animationId}: catalog assetId drifted`);
    invariant(JSON.stringify(projection.source) === JSON.stringify(member.source),
      `${member.animationId}: catalog SWF identity drifted`);
    invariant(JSON.stringify(projection.pairedFla) === JSON.stringify(member.pairedFla),
      `${member.animationId}: catalog FLA identity drifted`);
    invariant(projection.courseXmlOccurrences.includes(member.courseXmlOccurrence),
      `${member.animationId}: course XML occurrence drifted`);

    const swfPath = resolveInside(sourceRoot, member.source.path, `${member.animationId} SWF`);
    const physicalSwfPath = await realpath(swfPath);
    invariant(physicalSwfPath.startsWith(`${physicalSourceRoot}${path.sep}`),
      `${member.animationId}: physical SWF escapes source root`);
    const swfIdentity = await fileIdentity(swfPath);
    invariant(swfIdentity.bytes === member.source.bytes &&
      swfIdentity.sha256 === member.source.sha256,
    `${member.animationId}: source SWF bytes/hash drifted`);
    invariant(swfIdentity.writable === false,
      `${member.animationId}: source SWF must remain read-only`);

    let flaIdentity = null;
    if (member.pairedFla) {
      pairedFlaCount += 1;
      const flaPath = resolveInside(sourceRoot, member.pairedFla.path,
        `${member.animationId} FLA`);
      const physicalFlaPath = await realpath(flaPath);
      invariant(physicalFlaPath.startsWith(`${physicalSourceRoot}${path.sep}`),
        `${member.animationId}: physical FLA escapes source root`);
      flaIdentity = await fileIdentity(flaPath);
      invariant(flaIdentity.bytes === member.pairedFla.bytes &&
        flaIdentity.sha256 === member.pairedFla.sha256,
      `${member.animationId}: source FLA bytes/hash drifted`);
      invariant(flaIdentity.writable === false,
        `${member.animationId}: source FLA must remain read-only`);
    } else {
      swfOnlyCount += 1;
    }

    let externalAudioIdentity = null;
    if (member.externalAudio?.association === "exact") {
      const audioPath = resolveInside(sourceRoot, member.externalAudio.path,
        `${member.animationId} external audio`);
      externalAudioIdentity = await fileIdentity(audioPath);
      invariant(externalAudioIdentity.bytes === member.externalAudio.bytes &&
        externalAudioIdentity.sha256 === member.externalAudio.sha256,
      `${member.animationId}: external audio bytes/hash drifted`);
      invariant(externalAudioIdentity.writable === false,
        `${member.animationId}: external audio must remain read-only`);
    }

    members.push({
      ...member,
      catalog: projection,
      physical: {
        swfPath,
        swfIdentity,
        flaIdentity,
        externalAudioIdentity,
      },
    });
  }

  invariant(pairedFlaCount === 4 && swfOnlyCount === 1,
    "pilot must contain four paired-FLA pages and one SWF-only page");
  invariant(corpus.members[3].animationId === "course-g05-l04-ir-001-a662633d" &&
    corpus.members[3].source.path === "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
  "active G5 L4 IR placement must not be replaced by its unreferenced duplicate alias");

  return {
    schemaVersion: 1,
    pilotId: corpus.pilotId,
    corpusPath: portable(path.relative(projectRoot, corpusPath)),
    corpusIdentity: await fileIdentity(corpusPath),
    catalogPath: portable(path.relative(projectRoot, catalogPath)),
    catalogIdentity,
    sourceRoot: portable(path.relative(projectRoot, sourceRoot)),
    scope: corpus.scope,
    summary: {
      memberCount: members.length,
      activeReferencedPageCount: members.length,
      shellCount: 0,
      pairedFlaCount,
      swfOnlyCount,
    },
    members,
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

export function parseSwfmillXml(xml) {
  const swfMatch = xml.match(/<swf\s+version="(\d+)"[^>]*>/);
  const headerMatch = xml.match(/<Header\s+framerate="([0-9.]+)"\s+frames="(\d+)"/);
  const rectMatch = xml.match(/<Rectangle\s+left="(-?\d+)"\s+right="(-?\d+)"\s+top="(-?\d+)"\s+bottom="(-?\d+)"\s*\/>/);
  invariant(swfMatch && headerMatch && rectMatch, "swfmill XML header is incomplete");
  const nestedSprites = [...xml.matchAll(/<DefineSprite\s+objectID="(\d+)"\s+frames="(\d+)"/g)]
    .map((match) => ({objectId: Number(match[1]), frameCount: Number(match[2])}));
  return {
    swfVersion: Number(swfMatch[1]),
    fps: Number(headerMatch[1]),
    rootFrameCount: Number(headerMatch[2]),
    stage: {
      width: (Number(rectMatch[2]) - Number(rectMatch[1])) / 20,
      height: (Number(rectMatch[4]) - Number(rectMatch[3])) / 20,
      twipsPerPixel: 20,
    },
    nestedSprites,
    counts: {
      scriptLocations: countMatches(xml, /<actions>/g),
      doAction: countMatches(xml, /<DoAction(?:\s|>)/g),
      doInitAction: countMatches(xml, /<DoInitAction(?:\s|>)/g),
      buttons: countMatches(xml, /<DefineButton(?:2)?(?:\s|>)/g),
      shapes: countMatches(xml, /<DefineShape(?:2|3|4)?(?:\s|>)/g),
      morphShapes: countMatches(xml, /<DefineMorphShape(?:2)?(?:\s|>)/g),
      staticTexts: countMatches(xml, /<DefineText(?:2)?(?:\s|>)/g),
      editTexts: countMatches(xml, /<DefineEditText(?:\s|>)/g),
      fonts: countMatches(xml, /<DefineFont(?:2|3|4)?(?:\s|>)/g),
      images: countMatches(xml, /<DefineBits(?:JPEG2|JPEG3|JPEG4|Lossless|Lossless2)?(?:\s|>)/g),
      sprites: nestedSprites.length,
      placeObjects: countMatches(xml, /<PlaceObject(?:2|3|4)?(?:\s|>)/g),
      removeObjects: countMatches(xml, /<RemoveObject(?:2)?(?:\s|>)/g),
      frameLabels: countMatches(xml, /<FrameLabel(?:\s|>)/g),
      showFrames: countMatches(xml, /<ShowFrame\s*\/>/g),
      soundStreamBlocks: countMatches(xml, /<SoundStreamBlock(?:\s|>)/g),
      soundStreamHeads: countMatches(xml, /<SoundStreamHead(?:2)?(?:\s|>)/g),
      defineSounds: countMatches(xml, /<DefineSound(?:\s|>)/g),
      startSounds: countMatches(xml, /<StartSound(?:2)?(?:\s|>)/g),
    },
  };
}

export function validateObservedStructure(member, observed) {
  const expected = member.expectedStructure;
  invariant(observed.swfVersion === expected.swfVersion,
    `${member.animationId}: SWF version drifted`);
  invariant(observed.stage.width === expected.stageWidth &&
    observed.stage.height === expected.stageHeight,
  `${member.animationId}: stage dimensions drifted`);
  invariant(observed.fps === expected.fps, `${member.animationId}: FPS drifted`);
  invariant(observed.rootFrameCount === expected.rootFrameCount,
    `${member.animationId}: root frame count drifted`);
  invariant(equalNestedSprites(observed.nestedSprites, expected.nestedSprites),
    `${member.animationId}: nested sprite frame domains drifted`);
  invariant(observed.counts.scriptLocations === expected.scriptLocations,
    `${member.animationId}: script-location count drifted`);
  invariant(observed.counts.buttons === expected.buttons,
    `${member.animationId}: button count drifted`);
  const embeddedSoundTags = observed.counts.soundStreamBlocks +
    observed.counts.soundStreamHeads + observed.counts.defineSounds +
    observed.counts.startSounds;
  invariant(embeddedSoundTags === expected.embeddedSoundTags,
    `${member.animationId}: embedded sound-tag count drifted`);
  return {
    ...observed,
    counts: {...observed.counts, embeddedSoundTags},
    frameDomains: {
      root: {timelineId: "root", frameCount: observed.rootFrameCount},
      nested: observed.nestedSprites.map((item) => ({
        timelineId: `sprite-${item.objectId}`,
        objectId: item.objectId,
        frameCount: item.frameCount,
      })),
    },
  };
}

async function waitForWritableFinished(stream) {
  if (stream.closed) return;
  await new Promise((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
  });
}

export async function runCommand({
  command,
  args,
  cwd,
  stdoutPath,
  stderrPath,
  timeoutMs = 300_000,
  env = {},
}) {
  await mkdir(path.dirname(stdoutPath), {recursive: true});
  await mkdir(path.dirname(stderrPath), {recursive: true});
  const stdoutStream = createWriteStream(stdoutPath, {flags: "wx", mode: 0o444});
  const stderrStream = createWriteStream(stderrPath, {flags: "wx", mode: 0o444});
  const started = process.hrtime.bigint();
  let timedOut = false;
  let spawnError = null;
  let exitCode = null;
  let signal = null;

  await new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, {
        cwd,
        env: {...process.env, ...env, NO_COLOR: "1", FORCE_COLOR: "0"},
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      spawnError = error;
      resolve();
      return;
    }
    child.stdout.pipe(stdoutStream, {end: false});
    child.stderr.pipe(stderrStream, {end: false});
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.once("error", (error) => {
      spawnError = error;
    });
    child.once("close", (code, observedSignal) => {
      clearTimeout(timeout);
      exitCode = code;
      signal = observedSignal;
      resolve();
    });
  });
  stdoutStream.end();
  stderrStream.end();
  await Promise.all([
    waitForWritableFinished(stdoutStream),
    waitForWritableFinished(stderrStream),
  ]);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const [stdoutIdentity, stderrIdentity] = await Promise.all([
    fileIdentity(stdoutPath),
    fileIdentity(stderrPath),
  ]);
  return {
    command,
    args,
    exitCode,
    signal,
    timedOut,
    elapsedMs: Number(elapsedMs.toFixed(3)),
    spawnError: spawnError ? String(spawnError.message || spawnError) : null,
    stdout: stdoutIdentity,
    stderr: stderrIdentity,
    success: !spawnError && !timedOut && exitCode === 0,
  };
}

async function walkFiles(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const info = await lstat(absolute);
    invariant(!info.isSymbolicLink(), `output inventory rejects symlink: ${absolute}`);
    if (info.isDirectory()) {
      await walkFiles(root, absolute, files);
    } else {
      invariant(info.isFile(), `output inventory rejects special file: ${absolute}`);
      files.push(absolute);
    }
  }
  return files;
}

export async function inventoryDirectory(root, {exclude = []} = {}) {
  const excluded = new Set(exclude.map((value) => portable(value)));
  const absoluteFiles = await walkFiles(root);
  const files = [];
  let totalBytes = 0;
  for (const absolute of absoluteFiles) {
    const relativePath = portable(path.relative(root, absolute));
    if (excluded.has(relativePath)) continue;
    const identity = await fileIdentity(absolute);
    totalBytes += identity.bytes;
    files.push({path: relativePath, bytes: identity.bytes, sha256: identity.sha256});
  }
  const digestInput = files.map((item) => `${item.sha256}  ${item.path}\n`).join("");
  return {
    fileCount: files.length,
    totalBytes,
    checksumSetSha256: sha256Bytes(digestInput),
    files,
  };
}

export async function collectFilesByExtension(root, extension) {
  const files = await walkFiles(root);
  return files.filter((filePath) => path.extname(filePath).toLowerCase() === extension)
    .sort((left, right) => portable(left).localeCompare(portable(right)));
}

export async function inspectCanvasExport(exportRoot) {
  const htmlFiles = await collectFilesByExtension(exportRoot, ".html");
  const canvasHtmlFiles = [];
  const functions = {shape: 0, morphshape: 0, text: 0, font: 0, sprite: 0, button: 0};
  let generatedHtmlBytes = 0;
  for (const filePath of htmlFiles) {
    const source = await readFile(filePath, "utf8");
    if (!source.includes("<canvas") && !source.includes("getContext(\"2d\")")) continue;
    const info = await stat(filePath);
    generatedHtmlBytes += info.size;
    canvasHtmlFiles.push(portable(path.relative(exportRoot, filePath)));
    for (const key of Object.keys(functions)) {
      functions[key] += countMatches(source,
        new RegExp(`function\\s+${key}\\d+\\s*\\(`, "g"));
    }
  }
  const jsFiles = await collectFilesByExtension(exportRoot, ".js");
  let helperJsBytes = 0;
  for (const filePath of jsFiles) helperJsBytes += (await stat(filePath)).size;
  return {
    canvasHtmlFileCount: canvasHtmlFiles.length,
    canvasHtmlFiles,
    generatedHtmlBytes,
    helperJsFileCount: jsFiles.length,
    helperJsBytes,
    generatedDrawingFunctions: functions,
    rootTimelineGenerated: canvasHtmlFiles.includes("frames/frames.html"),
  };
}

function freshPattern(pattern) {
  return new RegExp(pattern.source, pattern.flags);
}

export function classifyAvm1Text(text) {
  const features = [];
  for (const rule of FEATURE_RULES) {
    const matches = [...text.matchAll(freshPattern(rule.pattern))];
    if (matches.length === 0) continue;
    features.push({id: rule.id, bucket: rule.bucket, occurrences: matches.length});
  }
  return features;
}

const SHARED_COMPONENT_HASHES = Object.freeze({
  "FScrollBarSymbol.as": "5ac9d9e477e7b50808c1805c33473f0e50b0121d0789cd7d208a085007047b8d",
  "FUIComponentSymbol.as": "326219b08e2695ccdd29734ea68a6277cda0549e1e98479be25597ffd9496972",
});

export function classifyAvm1Location(relativePath, bytes) {
  const sourceHash = sha256Bytes(bytes);
  const normalized = bytes.toString("utf8").replace(/\r\n/g, "\n").trim();
  if (normalized === "") {
    return {category: "empty", lowering: "mechanical", payload: null};
  }
  if (normalized === "stop();") {
    return {category: "pure-stop", lowering: "mechanical", payload: null};
  }
  if (normalized === '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();') {
    return {
      category: "legacy-preloader-boilerplate",
      lowering: "shared-policy",
      payload: {action: "enter-modern-page-content"},
    };
  }
  if (/^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/.test(relativePath)) {
    const compact = normalized.replace(/\s+/g, " ");
    const buttonMatch = compact.match(
      /^on\(release\)\{ _global\.KeyAttribute = "([^"]+)"; _root\.DoHyperLinks\(\); _root\.animation_mc\.animation\.stop\(\);(?: _root\.boolSendPageHLAClickRecord = true;)? \}$/,
    );
    if (buttonMatch) {
      return {
        category: "button-modern-host-binding",
        lowering: "shared-adapter-plus-data",
        payload: {keyAttribute: buttonMatch[1]},
      };
    }
    return {
      category: "unsupported-button-action",
      lowering: "manual-or-specialized-adapter",
      payload: null,
    };
  }
  const basename = path.basename(relativePath);
  if (Object.hasOwn(SHARED_COMPONENT_HASHES, basename)) {
    if (SHARED_COMPONENT_HASHES[basename] === sourceHash) {
      return {
        category: "shared-flash-v2-component",
        lowering: "shared-hash-bound-adapter",
        payload: {component: basename.replace(/\.as$/, ""), sourceSha256: sourceHash},
      };
    }
    return {
      category: "unknown-shared-component-revision",
      lowering: "manual-or-specialized-adapter",
      payload: {component: basename.replace(/\.as$/, ""), sourceSha256: sourceHash},
    };
  }
  if (normalized === 'tempNum = random(2);\n_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;') {
    return {
      category: "page-specific-dynamic-sound-selection",
      lowering: "page-specific-seeded-rng-and-explicit-clip-map",
      payload: {randomExclusiveUpperBound: 2, clipNames: ["Mc_Sound_0", "Mc_Sound_1"]},
    };
  }
  if (normalized === "eval(_global.tempRandomSoundMc).gotoAndPlay(2);") {
    return {
      category: "page-specific-dynamic-sound-selection",
      lowering: "page-specific-seeded-rng-and-explicit-clip-map",
      payload: {targetFrame: 2, arbitraryEvalPermitted: false},
    };
  }
  return {
    category: "unsupported-unclassified-script",
    lowering: "manual-or-specialized-adapter",
    payload: null,
  };
}

export async function inspectActionScript(sourceRoot, pcodeRoot) {
  const sourceFiles = await collectFilesByExtension(sourceRoot, ".as");
  const pcodeFiles = await collectFilesByExtension(pcodeRoot, ".pcode");
  const sourceRecords = [];
  let sourceBytes = 0;
  let combined = "";
  const uniqueSources = new Map();
  const classificationCounts = {};
  const loweringCounts = {};
  for (const filePath of sourceFiles) {
    const bytes = await readFile(filePath);
    const relativePath = portable(path.relative(sourceRoot, filePath));
    const sourceSha256 = sha256Bytes(bytes);
    const classification = classifyAvm1Location(relativePath, bytes);
    sourceBytes += bytes.length;
    combined += `\n${bytes.toString("utf8")}`;
    if (!uniqueSources.has(sourceSha256)) {
      uniqueSources.set(sourceSha256, {sha256: sourceSha256, bytes: bytes.length});
    }
    classificationCounts[classification.category] =
      (classificationCounts[classification.category] || 0) + 1;
    loweringCounts[classification.lowering] =
      (loweringCounts[classification.lowering] || 0) + 1;
    sourceRecords.push({
      path: relativePath,
      bytes: bytes.length,
      sha256: sourceSha256,
      classification,
    });
  }
  const opcodeCounts = {};
  const pcodeRecords = [];
  let pcodeBytes = 0;
  for (const filePath of pcodeFiles) {
    const bytes = await readFile(filePath);
    const text = bytes.toString("utf8");
    const localOpcodeCounts = {};
    pcodeBytes += bytes.length;
    combined += `\n${text}`;
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^(?:loc[0-9a-f]+:)?([A-Z][A-Za-z0-9]*)\b/);
      if (!match) continue;
      opcodeCounts[match[1]] = (opcodeCounts[match[1]] || 0) + 1;
      localOpcodeCounts[match[1]] = (localOpcodeCounts[match[1]] || 0) + 1;
    }
    const relativePath = portable(path.relative(pcodeRoot, filePath));
    const sourcePath = relativePath.replace(/\.pcode$/, ".as");
    const sourceRecord = sourceRecords.find((item) => item.path === sourcePath);
    invariant(sourceRecord, `P-code/source path mismatch: ${relativePath}`);
    pcodeRecords.push({
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256Bytes(bytes),
      opcodeOccurrenceCount: Object.values(localOpcodeCounts)
        .reduce((sum, count) => sum + count, 0),
      sourceClassificationCategory: sourceRecord.classification.category,
    });
  }
  const features = classifyAvm1Text(combined);
  const bucketCounts = {};
  for (const feature of features) {
    bucketCounts[feature.bucket] = (bucketCounts[feature.bucket] || 0) +
      feature.occurrences;
  }
  const specializedOpcodes = new Set([
    "CallMethod",
    "DefineFunction",
    "NewObject",
    "CallFunction",
    "Enumerate2",
    "Delete",
    "InitObject",
    "InstanceOf",
    "RandomNumber",
  ]);
  const specializedOpcodeOccurrenceCount = Object.entries(opcodeCounts)
    .filter(([opcode]) => specializedOpcodes.has(opcode))
    .reduce((sum, [, count]) => sum + count, 0);
  const opcodeOccurrenceCount = Object.values(opcodeCounts)
    .reduce((sum, count) => sum + count, 0);
  return {
    staticEvidenceOnly: true,
    runtimeReachabilityResolved: false,
    sourceScriptFileCount: sourceFiles.length,
    sourceBytes,
    sourceRecords,
    uniqueSourceContentCount: uniqueSources.size,
    uniqueSourceBytes: [...uniqueSources.values()]
      .reduce((sum, item) => sum + item.bytes, 0),
    duplicateSourceBytes: sourceBytes - [...uniqueSources.values()]
      .reduce((sum, item) => sum + item.bytes, 0),
    locationClassificationCounts: classificationCounts,
    loweringCounts,
    pageSpecificDynamicLocationCount:
      classificationCounts["page-specific-dynamic-sound-selection"] || 0,
    unclassifiedOrRejectedLocationCount: sourceRecords.filter((item) =>
      item.classification.category.startsWith("unsupported-") ||
      item.classification.category.startsWith("unknown-"),
    ).length,
    pcodeScriptFileCount: pcodeFiles.length,
    pcodeBytes,
    pcodeRecords,
    opcodeCounts: Object.fromEntries(Object.entries(opcodeCounts)
      .sort(([left], [right]) => left.localeCompare(right))),
    opcodeOccurrenceCount,
    boundedBasicOpcodeOccurrenceCount:
      opcodeOccurrenceCount - specializedOpcodeOccurrenceCount,
    specializedOpcodeOccurrenceCount,
    features,
    featureOccurrenceCountsByBucket: bucketCounts,
  };
}

export async function writeExclusive(filePath, contents, mode = 0o444) {
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, contents, {flag: "wx", mode});
}

export async function assertFileContents(filePath, expected) {
  const observed = await readFile(filePath);
  const expectedBytes = Buffer.isBuffer(expected) ? expected : Buffer.from(expected);
  invariant(observed.equals(expectedBytes), `stale generated file: ${filePath}`);
}

export function publicMemberProjection(member, projectRoot = PROJECT_ROOT) {
  return {
    role: member.role,
    animationId: member.animationId,
    assetId: member.assetId,
    courseXmlOccurrence: member.courseXmlOccurrence,
    source: member.source,
    pairedFla: member.pairedFla,
    expectedStructure: member.expectedStructure,
    externalAudio: member.externalAudio,
    sourceReadOnly: member.physical.swfIdentity.writable === false,
    sourceProjectPath: portable(path.relative(projectRoot, member.physical.swfPath)),
  };
}
