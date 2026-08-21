#!/usr/bin/env node

/**
 * Build source-static visual compiler evidence for G3 L2.  This script is
 * intentionally outside the product registry: FFDec Canvas/P-code output is
 * compiler input and audit evidence, not a claim that AVM1, audio, fidelity,
 * or a complete lesson has been implemented.
 */

import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {pathToFileURL} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const FACTORY_ROOT = "tools/g3-l2-ffdec-canvas-pcode-factory";
export const CORPUS_PATH = `${FACTORY_ROOT}/corpus.json`;
export const OUTPUT_ROOT = "work/g3-l2-ffdec-canvas-pcode-factory";

// G3 RW002 proved that the G5 all-export assumption (including one standalone
// HTML document for every shape, morph, and button) can be terminated by the
// host before FFDec returns. Frame and sprite Canvas documents already embed
// their transitive drawing functions, so the cross-grade factory exports the
// product-relevant timeline closure without redundant standalone viewers.
const CANVAS_FORMATS = "frame:canvas,sprite:canvas,script:as";
const CANVAS_ITEMS = "frame,sprite,script,image,sound";
const SHA256 = /^[a-f0-9]{64}$/;

export const ALL_FALSE_ACCEPTANCE_EFFECTS = Object.freeze({
  legacyFlashCourseShellConverted: false,
  modernMyLessonHostChanged: false,
  currentJavaScriptRegistered: false,
  avm1BehaviorCompiled: false,
  nestedAudioPlaybackCompiled: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

const AVM1_RULES = Object.freeze([
  ["timeline-control", /\b(?:Stop|Play|GotoFrame|GotoLabel|gotoAnd(?:Play|Stop)|stop|play)\b/g],
  ["branch-and-arithmetic", /\b(?:If|Jump|Equals2?|StrictEquals|Less2?|Greater|Add2?|Subtract|Multiply|Divide|Modulo|And|Or|Not)\b/g],
  ["variable-and-property", /\b(?:GetVariable|SetVariable|GetMember|SetMember|GetProperty|SetProperty|StoreRegister)\b/g],
  ["function-or-method", /\b(?:Call|CallFunction|CallMethod|DefineFunction2?|NewObject|NewMethod)\b/g],
  ["button-handler", /\b(?:onRelease|onPress|onRollOver|onRollOut|onClipEvent)\b/g],
  ["random", /\b(?:random|Random)\b/g],
  ["dynamic-eval", /\b(?:eval\s*\(|Eval\b)\b/g],
  ["legacy-host", /\b(?:_level\d+|_root|_parent|InternalPreloader)\b/g],
  ["external-or-network", /\b(?:getURL|loadMovie|FSCommand|fscommand|XMLSocket|LoadVars|NetConnection|SharedObject)\b/g],
  ["sound-control", /\b(?:Sound|startSound|stopAllSounds|StartSound|StopSounds)\b/g],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function relativeProject(value) {
  return portable(path.relative(PROJECT_ROOT, value));
}

function resolveProject(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label}: non-empty project-relative path required`);
  invariant(!path.isAbsolute(relativePath), `${label}: absolute path forbidden`);
  const normalized = path.normalize(relativePath);
  invariant(normalized !== ".." && !normalized.startsWith(`..${path.sep}`),
    `${label}: path escapes the project`);
  const resolved = path.resolve(PROJECT_ROOT, normalized);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${label}: path escapes the project`);
  return resolved;
}

async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256File(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function fileIdentity(filePath, {followSymbolicLink = false} = {}) {
  const info = followSymbolicLink ? await stat(filePath) : await lstat(filePath);
  invariant(info.isFile(), `expected a regular file: ${relativeProject(filePath)}`);
  return Object.freeze({
    bytes: info.size,
    sha256: await sha256File(filePath),
    mode: `0${(info.mode & 0o777).toString(8)}`,
    writable: (info.mode & 0o222) !== 0,
  });
}

async function directoryIdentity(directory) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) files.push(target);
      else throw new Error(`unsupported compiler output entry: ${relativeProject(target)}`);
    }
  }
  await walk(directory);
  const records = [];
  for (const filePath of files) {
    records.push(Object.freeze({path: portable(path.relative(directory, filePath)), ...(await fileIdentity(filePath))}));
  }
  const checksumSetSha256 = createHash("sha256")
    .update(records.map((record) => `${record.sha256}  ${record.path}\n`).join(""))
    .digest("hex");
  return Object.freeze({fileCount: records.length, checksumSetSha256, records});
}

async function readJson(relativePath, label) {
  const absolute = resolveProject(relativePath, label);
  const info = await lstat(absolute);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label}: must be an ordinary file`);
  return Object.freeze({value: JSON.parse(await readFile(absolute, "utf8")), path: absolute, identity: await fileIdentity(absolute)});
}

function parseArguments(argv) {
  const options = {mode: null, output: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--mode") {
      invariant(!options.mode, "--mode may be supplied only once");
      options.mode = argv[++index];
      continue;
    }
    if (argument === "--output") {
      invariant(!options.output, "--output may be supplied only once");
      options.output = argv[++index];
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  invariant(["calibrate", "extend", "check"].includes(options.mode),
    "--mode must be calibrate, extend, or check");
  invariant(typeof options.output === "string" && options.output.length > 0,
    "--output is required");
  invariant(options.output === OUTPUT_ROOT || options.output.startsWith(`${OUTPUT_ROOT}/`),
    `--output must be ${OUTPUT_ROOT} or a child path`);
  return Object.freeze(options);
}

function releasePageCandidates(catalog, release) {
  invariant(Array.isArray(catalog.animations), "catalog: animations array missing");
  const expectedXmlPath = release.courseXmlPath;
  const candidates = catalog.animations
    .map((entry) => {
      const references = Array.isArray(entry.references?.courseXml) ? entry.references.courseXml : [];
      const matching = references.filter((reference) => reference?.sourceXmlPath === expectedXmlPath);
      if (matching.length === 0) return null;
      invariant(matching.length === 1, `${entry.animationId}: duplicate G3 L2 XML occurrence`);
      const reference = matching[0];
      invariant(entry.flags?.referenced === true && entry.flags?.unreferenced === false,
        `${entry.animationId}: inactive course page rejected`);
      invariant(entry.flags?.variant === false, `${entry.animationId}: variant rejected`);
      invariant(entry.flags?.shell === false, `${entry.animationId}: legacy course shell rejected`);
      invariant(entry.classification?.collection === "course", `${entry.animationId}: non-course asset rejected`);
      invariant(entry.source?.path === reference.expectedPath, `${entry.animationId}: XML/source path mismatch`);
      invariant(!/^index/i.test(path.basename(entry.source.path)), `${entry.animationId}: shell-like source rejected`);
      invariant(entry.assetId === `swf-${entry.source?.sha256}`, `${entry.animationId}: SWF asset identity drifted`);
      invariant(SHA256.test(entry.source?.sha256 ?? ""), `${entry.animationId}: invalid source hash`);
      invariant(Number.isSafeInteger(reference.occurrence) && reference.occurrence > 0,
        `${entry.animationId}: invalid XML occurrence`);
      return Object.freeze({entry, ordinal: reference.occurrence});
    })
    .filter(Boolean)
    .sort((left, right) => left.ordinal - right.ordinal);
  invariant(candidates.length === release.expectedActivePageCount,
    `G3 L2 expected ${release.expectedActivePageCount} active pages, found ${candidates.length}`);
  candidates.forEach((candidate, index) => invariant(candidate.ordinal === index + 1,
    `G3 L2 XML source order is incomplete at ordinal ${index + 1}`));
  const externalAudioPages = candidates.filter(({entry}) =>
    Array.isArray(entry.audio?.exact) && entry.audio.exact.length > 0);
  invariant(
    externalAudioPages.length === release.expectedExactExternalAudioPageCount,
    `G3 L2 expected ${release.expectedExactExternalAudioPageCount} exact external-audio pages, found ${externalAudioPages.length}`,
  );
  for (const {entry} of candidates) {
    invariant(
      Array.isArray(entry.audio?.exact) && entry.audio.exact.length <= 1,
      `${entry.animationId}: expected at most one exact external-audio association`,
    );
    for (const association of entry.audio.exact) {
      invariant(association.association === "matching-basename",
        `${entry.animationId}: external-audio association must remain matching-basename`);
      invariant(association.language === "und",
        `${entry.animationId}: catalog does not establish a language for the exact external audio`);
      invariant(SHA256.test(association.sha256 ?? ""),
        `${entry.animationId}: invalid external-audio SHA-256`);
    }
  }
  return Object.freeze(candidates);
}

export function selectFactoryMembers(catalog, corpus, mode) {
  invariant(corpus?.schemaVersion === 1, "corpus schemaVersion must be 1");
  invariant(corpus.release?.legacyFlashCourseShellExcluded === true,
    "corpus must explicitly exclude the legacy course shell");
  invariant(corpus.release?.modernMyLessonHostRetained === true,
    "corpus must retain the modern My Lesson host");
  const candidates = releasePageCandidates(catalog, corpus.release);
  if (mode === "extend") return candidates;
  const calibration = corpus.calibrationSet;
  invariant(Array.isArray(calibration) && calibration.length === 6,
    "calibration set must contain exactly six page occurrences");
  const byId = new Map(candidates.map((candidate) => [candidate.entry.animationId, candidate]));
  const seen = new Set();
  const selected = calibration.map((selection) => {
    invariant(!seen.has(selection.animationId), `duplicate calibration member: ${selection.animationId}`);
    seen.add(selection.animationId);
    const candidate = byId.get(selection.animationId);
    invariant(candidate, `calibration member is not an active G3 L2 page: ${selection.animationId}`);
    invariant(candidate.ordinal === selection.ordinal,
      `${selection.animationId}: calibration ordinal drifted`);
    return Object.freeze({...candidate, calibrationAxes: Object.freeze([...selection.axes])});
  });
  return Object.freeze(selected);
}

function classifyPcode(text) {
  const categories = Object.fromEntries(AVM1_RULES.map(([id]) => [id, 0]));
  for (const [id, expression] of AVM1_RULES) categories[id] = [...text.matchAll(expression)].length;
  const observed = Object.values(categories).reduce((total, count) => total + count, 0);
  return Object.freeze({
    pcodeBytes: Buffer.byteLength(text),
    classifiedOpcodeOccurrences: observed,
    categoryOccurrences: Object.freeze(categories),
    execution: "not-executed",
    loweringPolicy: "allowlisted-static-plan-only; unknown-runtime-semantics-fail-closed",
  });
}

async function recursiveText(directory) {
  const pieces = [];
  async function walk(current) {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) pieces.push(await readFile(target, "utf8"));
      else throw new Error(`unsupported FFDec script output: ${relativeProject(target)}`);
    }
  }
  await walk(directory);
  return pieces.join("\n");
}

function structuralAudio(xml) {
  const count = (expression) => [...xml.matchAll(expression)].length;
  return Object.freeze({
    defineSound: count(/<DefineSound\b/g),
    startSound: count(/<StartSound\b/g),
    soundStreamHead: count(/<SoundStreamHead\b/g),
    soundStreamBlock: count(/<SoundStreamBlock\b/g),
    accepted: false,
    playbackCompiled: false,
    disposition: "source-structural-only; nested timing and audible correctness remain pending",
  });
}

function structuralTimeline(xml) {
  const sprites = [...xml.matchAll(/<DefineSprite\b[^>]*\bobjectID=\"(\d+)\"[^>]*\bframes=\"(\d+)\"/g)]
    .map((match) => Object.freeze({objectId: Number(match[1]), frameCount: Number(match[2])}));
  return Object.freeze({
    nestedSpriteCount: sprites.length,
    maxNestedFrameCount: sprites.reduce((maximum, sprite) => Math.max(maximum, sprite.frameCount), 0),
    rootReachabilityEstablished: false,
    nestedFrameDomains: sprites,
  });
}

async function runCommand({command, args, cwd, stdoutPath, stderrPath, timeoutMs}) {
  await mkdir(path.dirname(stdoutPath), {recursive: true});
  const startedAt = new Date().toISOString();
  const result = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, stdio: ["ignore", "pipe", "pipe"], env: {...process.env, NO_COLOR: "1", FORCE_COLOR: "0"}});
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({code, signal, timedOut, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)});
    });
  });
  await writeFile(stdoutPath, result.stdout, {flag: "wx", mode: 0o644});
  await writeFile(stderrPath, result.stderr, {flag: "wx", mode: 0o644});
  invariant(result.code === 0 && !result.timedOut,
    `${command} failed (${result.timedOut ? "timeout" : `exit ${result.code}; signal ${result.signal ?? "none"}`}); see ${relativeProject(stderrPath)}`);
  return Object.freeze({
    command,
    args: Object.freeze(args.map((argument) => argument.startsWith(`${PROJECT_ROOT}${path.sep}`) ? relativeProject(argument) : argument)),
    startedAt,
    exitCode: result.code,
    signal: result.signal,
    timedOut: result.timedOut,
    stdout: await fileIdentity(stdoutPath),
    stderr: await fileIdentity(stderrPath),
  });
}

function sampleFrames(frameCount) {
  invariant(Number.isSafeInteger(frameCount) && frameCount > 0,
    "Canvas smoke test requires a positive root frame count");
  return [...new Set([1, Math.ceil(frameCount / 2), frameCount])];
}

async function captureCanvasRoot({canvasHtml, capturesRoot, rootFrameCount}) {
  const {chromium} = await import("playwright");
  await mkdir(capturesRoot, {recursive: true});
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport: {width: 900, height: 700}, deviceScaleFactor: 1});
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  try {
    await page.addInitScript(() => {
      Object.defineProperty(window, "setInterval", {
        value: () => 0,
        writable: false,
        configurable: false,
      });
    });
    await page.goto(pathToFileURL(canvasHtml).href, {waitUntil: "load"});
    await page.waitForSelector("#myCanvas", {state: "attached"});
    const callable = await page.evaluate(() => ({
      drawFrame: typeof window.drawFrame === "function",
      frame: Object.prototype.hasOwnProperty.call(window, "frame"),
    }));
    invariant(callable.drawFrame && callable.frame,
      "FFDec Canvas output does not expose a callable drawFrame()/frame contract");
    const captures = [];
    for (const frameNumber of sampleFrames(rootFrameCount)) {
      const pixels = await page.evaluate((oneIndexedFrame) => {
        window.frame = oneIndexedFrame - 1;
        window.time = 0;
        window.drawFrame();
        const canvas = document.getElementById("myCanvas");
        const context = canvas.getContext("2d");
        const image = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let nonTransparentPixels = 0;
        for (let offset = 3; offset < image.length; offset += 4) {
          if (image[offset] !== 0) nonTransparentPixels += 1;
        }
        return {width: canvas.width, height: canvas.height, nonTransparentPixels};
      }, frameNumber);
      const fileName = `root-frame-${String(frameNumber).padStart(4, "0")}.png`;
      const screenshot = path.join(capturesRoot, fileName);
      await page.locator("#myCanvas").screenshot({path: screenshot});
      captures.push(Object.freeze({frameNumber, pixels, path: fileName, output: await fileIdentity(screenshot)}));
    }
    invariant(pageErrors.length === 0, `FFDec Canvas page errors: ${pageErrors.join(" | ")}`);
    invariant(consoleErrors.length === 0, `FFDec Canvas console errors: ${consoleErrors.join(" | ")}`);
    return Object.freeze({
      headlessCallable: true,
      captureScope: "root-first-middle-last-static-canvas-smoke",
      runtimeClaim: false,
      captures,
    });
  } finally {
    await page.close();
    await browser.close();
  }
}

async function validateMemberSource(candidate, sourceRootReal) {
  const {entry, ordinal} = candidate;
  const sourcePath = resolveProject(path.posix.join("source-assets/flash/HELP MATH_ORIGINAL FILES", entry.source.path),
    `${entry.animationId} source`);
  const sourceReal = await realpath(sourcePath);
  invariant(sourceReal.startsWith(`${sourceRootReal}${path.sep}`), `${entry.animationId}: source resolves outside frozen root`);
  const sourceIdentity = await fileIdentity(sourcePath, {followSymbolicLink: true});
  invariant(sourceIdentity.sha256 === entry.source.sha256 && sourceIdentity.bytes === entry.source.bytes,
    `${entry.animationId}: source bytes/hash drifted`);
  invariant(sourceIdentity.writable === false, `${entry.animationId}: source must be read-only`);
  let pairedFla = null;
  if (entry.pairedFla) {
    const flaPath = resolveProject(path.posix.join("source-assets/flash/HELP MATH_ORIGINAL FILES", entry.pairedFla.path),
      `${entry.animationId} FLA`);
    const flaReal = await realpath(flaPath);
    invariant(flaReal.startsWith(`${sourceRootReal}${path.sep}`), `${entry.animationId}: FLA resolves outside frozen root`);
    const identity = await fileIdentity(flaPath, {followSymbolicLink: true});
    invariant(identity.sha256 === entry.pairedFla.sha256 && identity.bytes === entry.pairedFla.bytes,
      `${entry.animationId}: paired FLA bytes/hash drifted`);
    invariant(identity.writable === false, `${entry.animationId}: paired FLA must be read-only`);
    pairedFla = Object.freeze({path: entry.pairedFla.path, ...identity});
  }
  const exactExternalAudio = [];
  for (const association of entry.audio.exact) {
    const audioPath = resolveProject(
      path.posix.join("source-assets/flash/HELP MATH_ORIGINAL FILES", association.path),
      `${entry.animationId} external audio`,
    );
    const audioReal = await realpath(audioPath);
    invariant(audioReal.startsWith(`${sourceRootReal}${path.sep}`),
      `${entry.animationId}: external audio resolves outside frozen root`);
    const identity = await fileIdentity(audioPath, {followSymbolicLink: true});
    invariant(identity.sha256 === association.sha256 && identity.bytes === association.bytes,
      `${entry.animationId}: external-audio bytes/hash drifted`);
    invariant(identity.writable === false,
      `${entry.animationId}: external audio must be read-only`);
    exactExternalAudio.push(Object.freeze({
      path: association.path,
      language: association.language,
      association: association.association,
      ...identity,
      playbackCompiled: false,
      listeningAccepted: false,
    }));
  }
  return Object.freeze({
    animationId: entry.animationId,
    ordinal,
    assetId: entry.assetId,
    source: Object.freeze({path: entry.source.path, ...sourceIdentity}),
    pairedFla,
    exactExternalAudio: Object.freeze(exactExternalAudio),
    rootFrameCount: entry.source.swf.frameCount,
    stage: Object.freeze({
      width: entry.source.swf.stage.width,
      height: entry.source.swf.stage.height,
      fps: entry.source.swf.fps,
    }),
    sourcePath,
  });
}

async function buildMember(member, stageRoot) {
  const memberRoot = path.join(stageRoot, "members", member.animationId);
  const logs = path.join(memberRoot, "logs");
  const swfmillRoot = path.join(memberRoot, "swfmill");
  const canvasRoot = path.join(memberRoot, "canvas");
  const pcodeRoot = path.join(memberRoot, "pcode");
  await Promise.all([mkdir(logs, {recursive: true}), mkdir(swfmillRoot, {recursive: true})]);
  const swfmillXml = path.join(swfmillRoot, "source.xml");
  const sourceBefore = await fileIdentity(member.sourcePath, {followSymbolicLink: true});
  const swfmill = await runCommand({
    command: "swfmill",
    args: ["-n", "swf2xml", member.sourcePath, swfmillXml],
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logs, "swfmill.stdout.txt"),
    stderrPath: path.join(logs, "swfmill.stderr.txt"),
    timeoutMs: 120_000,
  });
  const canvas = await runCommand({
    command: "ffdec",
    args: ["-config", "packJavaScripts=false", "-onerror", "abort", "-timeout", "120", "-exportTimeout", "600", "-format", CANVAS_FORMATS, "-export", CANVAS_ITEMS, canvasRoot, member.sourcePath],
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logs, "ffdec-canvas.stdout.txt"),
    stderrPath: path.join(logs, "ffdec-canvas.stderr.txt"),
    timeoutMs: 660_000,
  });
  const pcode = await runCommand({
    command: "ffdec",
    args: ["-config", "packJavaScripts=false", "-onerror", "abort", "-timeout", "120", "-exportTimeout", "600", "-format", "script:pcode", "-export", "script", pcodeRoot, member.sourcePath],
    cwd: PROJECT_ROOT,
    stdoutPath: path.join(logs, "ffdec-pcode.stdout.txt"),
    stderrPath: path.join(logs, "ffdec-pcode.stderr.txt"),
    timeoutMs: 660_000,
  });
  const [sourceAfter, xml] = await Promise.all([
    fileIdentity(member.sourcePath, {followSymbolicLink: true}),
    readFile(swfmillXml, "utf8"),
  ]);
  invariant(sourceAfter.sha256 === sourceBefore.sha256 && sourceAfter.bytes === sourceBefore.bytes,
    `${member.animationId}: source changed while compiling`);
  const rootCanvas = path.join(canvasRoot, "frames", "frames.html");
  const rootCanvasInfo = await lstat(rootCanvas).catch(() => null);
  invariant(rootCanvasInfo?.isFile(), `${member.animationId}: FFDec root Canvas timeline is missing`);
  const pcodeScripts = path.join(pcodeRoot, "scripts");
  const pcodeScriptsInfo = await lstat(pcodeScripts).catch(() => null);
  invariant(pcodeScriptsInfo?.isDirectory(), `${member.animationId}: FFDec P-code scripts are missing`);
  const pcodeText = await recursiveText(pcodeScripts);
  const canvasSmoke = await captureCanvasRoot({
    canvasHtml: rootCanvas,
    capturesRoot: path.join(memberRoot, "canvas-smoke"),
    rootFrameCount: member.rootFrameCount,
  });
  const manifest = Object.freeze({
    schemaVersion: 1,
    animationId: member.animationId,
    ordinal: member.ordinal,
    assetId: member.assetId,
    source: Object.freeze({path: member.source.path, before: sourceBefore, after: sourceAfter, unchanged: true}),
    pairedFla: member.pairedFla,
    exactExternalAudio: member.exactExternalAudio,
    stage: member.stage,
    compiler: Object.freeze({
      primaryVisualBackend: "ffdec-canvas-plus-pcode",
      exportProfile: "g3-resource-bounded-frame-sprite-script-image-sound",
      ffdecCanvasGenerated: true,
      pcodeGenerated: true,
      rootCanvasPath: "canvas/frames/frames.html",
      commands: Object.freeze({swfmill, canvas, pcode}),
      outputInventory: Object.freeze({
        canvas: await directoryIdentity(canvasRoot),
        pcode: await directoryIdentity(pcodeRoot),
      }),
      canvasSmoke,
    }),
    timeline: structuralTimeline(xml),
    avm1: classifyPcode(pcodeText),
    audio: structuralAudio(xml),
    explicitPendingTracks: Object.freeze({
      avm1: "P-code is classified only; no AVM1 executes in generated Canvas output.",
      nestedAudio: "Audio tags are structural evidence only; no nested stream clock or audible playback is compiled.",
      exactExternalAudio: "Exact matching-basename MP3 custody is verified, but language, cue timing, playback integration, and listening acceptance remain unresolved.",
      fidelity: "No authoritative original-runtime baseline, full-frame comparison, or fidelity decision exists.",
      humanOwner: "No named human visual review or Owner acceptance has been created.",
    }),
    acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
  });
  const manifestPath = path.join(memberRoot, "manifest.json");
  await writeFile(manifestPath, stableJson(manifest), {flag: "wx", mode: 0o644});
  return Object.freeze({
    animationId: member.animationId,
    ordinal: member.ordinal,
    manifestPath: portable(path.relative(stageRoot, manifestPath)),
    manifest: await fileIdentity(manifestPath),
  });
}

async function collectFactoryContext(mode) {
  const corpus = await readJson(CORPUS_PATH, "factory corpus");
  const catalog = await readJson(corpus.value.inputs.catalogPath, "catalog");
  const sourceRoot = resolveProject(corpus.value.inputs.sourceRoot, "source root");
  const sourceRootReal = await realpath(sourceRoot);
  const sourceRootInfo = await stat(sourceRoot);
  invariant(sourceRootInfo.isDirectory() && (sourceRootInfo.mode & 0o222) === 0,
    "frozen source root must resolve to a read-only directory");
  const selected = selectFactoryMembers(catalog.value, corpus.value, mode);
  const members = [];
  for (const candidate of selected) members.push(await validateMemberSource(candidate, sourceRootReal));
  return Object.freeze({
    corpus,
    catalog,
    sourceRoot,
    sourceRootReal,
    members,
    factoryScript: await fileIdentity(SCRIPT_PATH),
  });
}

async function build(options) {
  const output = resolveProject(options.output, "output");
  invariant(!(await exists(output)), `output already exists: ${options.output}`);
  const context = await collectFactoryContext(options.mode);
  await mkdir(path.dirname(output), {recursive: true});
  const stage = `${output}.staging-${process.pid}`;
  invariant(!(await exists(stage)), `staging path already exists: ${relativeProject(stage)}`);
  await mkdir(stage, {recursive: false});
  try {
    const results = [];
    for (const member of context.members) results.push(await buildMember(member, stage));
    const runManifest = Object.freeze({
      schemaVersion: 1,
      factoryId: context.corpus.value.factoryId,
      mode: options.mode,
      release: context.corpus.value.release,
      inputLock: Object.freeze({
        corpus: Object.freeze({path: relativeProject(context.corpus.path), ...context.corpus.identity}),
        catalog: Object.freeze({path: relativeProject(context.catalog.path), ...context.catalog.identity}),
        sourceRoot: relativeProject(context.sourceRoot),
        factoryScript: Object.freeze({path: relativeProject(SCRIPT_PATH), ...context.factoryScript}),
      }),
      compiler: Object.freeze({
        primaryVisualBackend: "ffdec-canvas-plus-pcode",
        exportProfile: "g3-resource-bounded-frame-sprite-script-image-sound",
        legacyFlashCourseShellConverted: false,
        modernMyLessonHostChanged: false,
      }),
      exactExternalAudioPressure: Object.freeze({
        pageCount: context.members.filter(({exactExternalAudio}) => exactExternalAudio.length > 0).length,
        associationCount: context.members.reduce(
          (total, {exactExternalAudio}) => total + exactExternalAudio.length,
          0,
        ),
        playbackCompiled: false,
        listeningAccepted: false,
      }),
      members: results,
      acceptanceEffects: {...ALL_FALSE_ACCEPTANCE_EFFECTS},
    });
    await writeFile(path.join(stage, "run-manifest.json"), stableJson(runManifest), {flag: "wx", mode: 0o644});
    await rename(stage, output);
    return runManifest;
  } catch (error) {
    // The stage is intentionally retained as diagnostic evidence.
    throw new Error(`G3 L2 FFDec factory failed; retained staging diagnostics at ${relativeProject(stage)}: ${error.message}`);
  }
}

async function check(options) {
  const output = resolveProject(options.output, "output");
  const manifestPath = path.join(output, "run-manifest.json");
  const info = await lstat(manifestPath).catch(() => null);
  invariant(info?.isFile() && !info.isSymbolicLink(), `run manifest is missing: ${options.output}/run-manifest.json`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  invariant(manifest.schemaVersion === 1 && (manifest.mode === "calibrate" || manifest.mode === "extend"),
    "run manifest mode is invalid");
  const context = await collectFactoryContext(manifest.mode);
  invariant(manifest.factoryId === context.corpus.value.factoryId, "factory id drifted");
  invariant(manifest.inputLock?.corpus?.sha256 === context.corpus.identity.sha256, "corpus input lock drifted");
  invariant(manifest.inputLock?.catalog?.sha256 === context.catalog.identity.sha256, "catalog input lock drifted");
  invariant(manifest.inputLock?.factoryScript?.sha256 === context.factoryScript.sha256,
    "factory script input lock drifted");
  invariant(JSON.stringify(manifest.acceptanceEffects) === JSON.stringify(ALL_FALSE_ACCEPTANCE_EFFECTS),
    "acceptance effects must remain all false");
  invariant(Array.isArray(manifest.members) && manifest.members.length === context.members.length,
    "member count drifted");
  for (const [index, expected] of context.members.entries()) {
    const observed = manifest.members[index];
    invariant(observed?.animationId === expected.animationId && observed?.ordinal === expected.ordinal,
      `member ordering drifted at ${index + 1}`);
    const memberManifest = path.join(output, observed.manifestPath);
    const memberInfo = await lstat(memberManifest).catch(() => null);
    invariant(memberInfo?.isFile() && !memberInfo.isSymbolicLink(), `${expected.animationId}: member manifest missing`);
    const actual = await fileIdentity(memberManifest);
    invariant(actual.sha256 === observed.manifest.sha256 && actual.bytes === observed.manifest.bytes,
      `${expected.animationId}: member manifest identity drifted`);
    const detail = JSON.parse(await readFile(memberManifest, "utf8"));
    invariant(detail.source?.before?.sha256 === expected.source.sha256 && detail.source?.unchanged === true,
      `${expected.animationId}: source custody binding drifted`);
    invariant(JSON.stringify(detail.acceptanceEffects) === JSON.stringify(ALL_FALSE_ACCEPTANCE_EFFECTS),
      `${expected.animationId}: acceptance effects must remain all false`);
    invariant(detail.compiler?.canvasSmoke?.headlessCallable === true &&
      detail.compiler.canvasSmoke.captures?.length >= 1,
    `${expected.animationId}: missing FFDec Canvas smoke evidence`);
    const memberRoot = path.dirname(memberManifest);
    const [canvasInventory, pcodeInventory] = await Promise.all([
      directoryIdentity(path.join(memberRoot, "canvas")),
      directoryIdentity(path.join(memberRoot, "pcode")),
    ]);
    invariant(canvasInventory.checksumSetSha256 === detail.compiler.outputInventory?.canvas?.checksumSetSha256 &&
      canvasInventory.fileCount === detail.compiler.outputInventory?.canvas?.fileCount,
    `${expected.animationId}: Canvas output inventory drifted`);
    invariant(pcodeInventory.checksumSetSha256 === detail.compiler.outputInventory?.pcode?.checksumSetSha256 &&
      pcodeInventory.fileCount === detail.compiler.outputInventory?.pcode?.fileCount,
    `${expected.animationId}: P-code output inventory drifted`);
    for (const capture of detail.compiler.canvasSmoke.captures) {
      const capturePath = path.join(memberRoot, "canvas-smoke", capture.path);
      const captureIdentity = await fileIdentity(capturePath);
      invariant(captureIdentity.sha256 === capture.output?.sha256 &&
        captureIdentity.bytes === capture.output?.bytes,
      `${expected.animationId}: Canvas smoke capture drifted: ${capture.path}`);
    }
  }
  return Object.freeze({checked: true, mode: manifest.mode, memberCount: manifest.members.length});
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const result = options.mode === "check" ? await check(options) : await build(options);
  process.stdout.write(`${stableJson(result)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
