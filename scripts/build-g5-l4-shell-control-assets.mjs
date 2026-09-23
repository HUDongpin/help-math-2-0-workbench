#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "shell-course-g05-l04-index-local";
const SOURCE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index_local.swf";
const SOURCE_IDENTITY = Object.freeze({
  bytes: 658_851,
  sha256: "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
});
const OUTPUT_DIRECTORY =
  `public/flash-assets/courses/${ANIMATION_ID}/control-assets`;
const FFDEC_IDENTITY = Object.freeze({
  version: "JPEXS Free Flash Decompiler v.26.2.1",
  launcherSha256:
    "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  ffdecJarSha256:
    "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f",
});

const BUTTONS = Object.freeze([
  ["lesson-shell-spanish-page-audio-up.png", 221, [0, 0, 134, 22],
    "c09c0520145112fb3639b132aaed1d7c98bbf678d669cf283ee02cff7291734e",
    3_678, "166048633c189ba63c057aa00697f44216aab65d00a1f288af94f8b6a3dc58db", 49],
  ["lesson-shell-replay-up.png", 256, [0, 0, 42, 42],
    "9e801b95f6de8df9c56dcc65b514be2973383c32ee9ea14e85da9f9d3bc950ea",
    3_056, "7079f2329ddd27617534201b6c945d4a65266bdc0b61dec1b735992481f74b56", 49],
  ["lesson-shell-play-up.png", 260, [0, 0, 42, 42],
    "40b03dafd90516d40062fb271adb5346f8d2ca1d2b73c02a3ea7d38b478044a6",
    2_694, "358a2aaac6e7ba756c913de6b9e8e6468a9a6b9e0e0a290d896bced97e3e7063", 49],
  ["lesson-shell-pause-up.png", 264, [0, 0, 42, 42],
    "62abb92c2731a0951d3c20bb0df0df0ce47502ebf5685717c951f857a5cdcd81",
    2_396, "18c5e0e5da7e6c992a5c0bf0ae7dcd7f92d4dd47fb2b9769b0bf5f8d9217b2d5", 49],
  ["lesson-shell-volume-icon-up.png", 334, [0, 0, 42, 42],
    "d6f19099675d0c0496bd691fdf6ad11803f2ed1ef859079d343829447b2815d0",
    2_646, "3cb9da43b2d5b1948905f2b974cc74384ffb53ac714414924c443cc664037c83", 49],
  ["lesson-shell-volume-muted-icon-up.png", 337, [0, 0, 42, 42],
    "0f3e716afeb31aa20106d81a1b01cc9aa52b5a9dfbd376f9667d6cd0e87707d5",
    2_850, "742e70222227de4f64530337994f391a7884f5a6106b1a8ed9cff41a388164ee", 49],
  ["lesson-shell-next-neutral-up.png", 344, [0, 0, 55, 55],
    "91a535925f5d4d4f9bddc44b4cdd6990c431f0fa4a1a64dd03ac7f61dc4f336a",
    4_324, "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886", 49],
  ["lesson-shell-previous-neutral-up.png", 346, [0, 0, 55, 55],
    "91a535925f5d4d4f9bddc44b4cdd6990c431f0fa4a1a64dd03ac7f61dc4f336a",
    4_324, "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886", 49],
  ["lesson-shell-rewind-up.png", 595, [0, 0, 42, 42],
    "a3eab4d4f63a17ce33cebd4fed9b98c530963fe4793c979b11377ef0770dde20",
    2_900, "b8e515445e7f7f0216afa2726f96229e07a1338fdb3b8d754f1afc69987a5291", 50],
  ["lesson-shell-forward-up.png", 598, [0, 0, 42, 42],
    "d04367b742a29eebded21a450f4dadfe09f75bcb409121b961ae5ccd9d8548c4",
    2_892, "a485fe38c69c307ed1a2e4dc30964d248e3f3b7ddddc2f4828ed10144b6997df", 50],
  ["lesson-shell-key-terms-up.png", 1076, [226, 19, 136, 42],
    "a2e89240cd0bb6b4132e9ba5148fb6112b1596d2f884013b90596696e04ebc34",
    6_439, "547c8d71f43ca314f1ad497f75bb9fec1c873c53c4315bbf1dcb0861629f6270", 50],
  ["lesson-shell-map-up.png", 1084, [260, 18, 136, 42],
    "ec93ffac8223a4590bd485d1fe2bc9af928cd256f13aeef86fe317fad1cd0c7b",
    5_607, "4229e324f4e8538dccd285d8dcd6aed8645009897abc0332932cf38358f036e1", 50],
  ["lesson-shell-calculator-up.png", 1094, [586, 57, 135, 42],
    "48b7da92b4bfbd88f3f9594f0c2c8a8264f307d886b61464afbadd2128f70030",
    6_423, "890b013752a495d2561266a4a1b2ebd80de85bc0cb6412763e5ac926b87f8d94", 50],
].map(([file, sourceCharacterId, crop, rawSha256, bytes, sha256, rootFrame]) =>
  Object.freeze({
    file,
    sourceCharacterId,
    crop: Object.freeze({
      x: crop[0],
      y: crop[1],
      width: crop[2],
      height: crop[3],
    }),
    rawSha256,
    bytes,
    sha256,
    rootFrame,
  })));

const SLIDER = Object.freeze({
  file: "lesson-shell-volume-slider-source-static.png",
  sourceCharacterId: 189,
  crop: Object.freeze({x: 0, y: 0, width: 108, height: 17}),
  rawSha256:
    "81a7df7bce1d4d96e836ce8775f6d9c91ad3d77784213e8e7f9ff81bedd47df8",
  bytes: 190,
  sha256:
    "e098126899d81da32e8cae04e1d363d7722a29eee2fec9e3b25c39a60e605986",
  rootFrame: 49,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((entry) => path.join(entry, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {}
  }
  throw new Error(`FFDec executable not found: ${command}`);
}

async function inspectFfdec(command) {
  const resolvedLauncher = await resolveExecutable(command);
  const launcherBytes = await readFile(resolvedLauncher);
  const jarBytes = await readFile(
    path.join(path.dirname(resolvedLauncher), "ffdec.jar"),
  );
  invariant(
    sha256(launcherBytes) === FFDEC_IDENTITY.launcherSha256,
    "FFDec launcher identity changed",
  );
  invariant(
    sha256(jarBytes) === FFDEC_IDENTITY.ffdecJarSha256,
    "FFDec JAR identity changed",
  );
  return {
    path: command,
    resolvedLauncher,
    version: FFDEC_IDENTITY.version,
    launcherSha256: FFDEC_IDENTITY.launcherSha256,
    ffdecJarSha256: FFDEC_IDENTITY.ffdecJarSha256,
  };
}

async function runFfdec(ffdec, args) {
  const result = await execFile(ffdec, args, {
    cwd: ROOT,
    maxBuffer: 8 * 1024 * 1024,
    timeout: 60_000,
  });
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(FFDEC_IDENTITY.version),
    "FFDec version output changed",
  );
}

async function croppedAsset(sourcePath, expected, label) {
  const sourceBytes = await readFile(sourcePath);
  invariant(
    sha256(sourceBytes) === expected.rawSha256,
    `${label} raw FFDec export identity changed`,
  );
  const source = PNG.sync.read(sourceBytes);
  const {x, y, width, height} = expected.crop;
  invariant(
    x >= 0 &&
      y >= 0 &&
      x + width <= source.width &&
      y + height <= source.height,
    `${label} crop escapes its FFDec canvas`,
  );
  const cropped = new PNG({width, height});
  PNG.bitblt(source, cropped, x, y, width, height, 0, 0);
  const bytes = PNG.sync.write(cropped);
  invariant(
    bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
    `${label} cropped PNG identity changed`,
  );
  return bytes;
}

async function emit(relativePath, bytes, check) {
  const target = projectPath(relativePath);
  if (check) {
    invariant((await readFile(target)).equals(bytes), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes);
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "/opt/homebrew/bin/ffdec"};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--ffdec") {
      invariant(argv[index + 1], "--ffdec requires a value");
      options.ffdec = argv[index + 1];
      index += 1;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

export async function buildG5L4ShellControlAssets({
  check = false,
  ffdec = "/opt/homebrew/bin/ffdec",
} = {}) {
  const sourcePath = projectPath(SOURCE);
  const sourceBefore = await readFile(sourcePath);
  invariant(
    sourceBefore.length === SOURCE_IDENTITY.bytes &&
      sha256(sourceBefore) === SOURCE_IDENTITY.sha256,
    "G5 L4 shell source SWF identity changed",
  );
  const ffdecIdentity = await inspectFfdec(ffdec);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-shell-controls-"),
  );
  try {
    const buttonDirectory = path.join(temporaryRoot, "buttons");
    const sliderDirectory = path.join(temporaryRoot, "slider");
    await Promise.all([
      runFfdec(ffdec, [
        "-onerror", "abort",
        "-selectid", BUTTONS.map(({sourceCharacterId}) =>
          sourceCharacterId).join(","),
        "-format", "button:png",
        "-export", "button",
        buttonDirectory,
        sourcePath,
      ]),
      runFfdec(ffdec, [
        "-onerror", "abort",
        "-selectid", String(SLIDER.sourceCharacterId),
        "-format", "sprite:png",
        "-export", "sprite",
        sliderDirectory,
        sourcePath,
      ]),
    ]);
    invariant(
      (await readFile(sourcePath)).equals(sourceBefore),
      "G5 L4 shell source SWF changed during read-only export",
    );
    const assets = await Promise.all([
      ...BUTTONS.map(async (expected) => ({
        expected,
        sourceKind: "DefineButton2",
        sourceState: "up",
        bytes: await croppedAsset(
          path.join(
            buttonDirectory,
            `DefineButton2_${expected.sourceCharacterId}`,
            "1_up.png",
          ),
          expected,
          `button ${expected.sourceCharacterId}`,
        ),
      })),
      (async () => ({
        expected: SLIDER,
        sourceKind: "DefineSprite",
        sourceState: "frame-1",
        bytes: await croppedAsset(
          path.join(
            sliderDirectory,
            `DefineSprite_${SLIDER.sourceCharacterId}`,
            "1.png",
          ),
          SLIDER,
          `sprite ${SLIDER.sourceCharacterId}`,
        ),
      }))(),
    ]);
    const scriptBytes = await readFile(SCRIPT_PATH);
    const manifest = {
      schemaVersion: 1,
      evidenceType: "g5-l4-shell-ffdec-static-control-assets",
      animationId: ANIMATION_ID,
      status: "structural-only",
      classification:
        "engineering-structural-inspection-not-strict-acceptance",
      authority: {
        kind: "ffdec-static-control-definition-render",
        statement:
          "These PNGs are deterministic FFDec exports from the hash-bound G5 L4 lesson shell and are used as visual control candidates only.",
        authorityBoundary:
          "They do not prove ActionScript behavior, runtime reachability, interaction, audio, localization, Replay parity, original-runtime composition, RMSE, human review, owner acceptance, strict completion, or publication.",
        actionScriptExecuted: false,
        originalRuntimeBaseline: false,
        naturalPlaybackClaimed: false,
      },
      source: {path: SOURCE, ...SOURCE_IDENTITY},
      tool: ffdecIdentity,
      generator: {
        path: path.relative(ROOT, SCRIPT_PATH).split(path.sep).join("/"),
        bytes: scriptBytes.length,
        sha256: sha256(scriptBytes),
      },
      assets: assets.map(({expected, sourceKind, sourceState}) => ({
        file: expected.file,
        sourceKind,
        sourceCharacterId: expected.sourceCharacterId,
        sourceState,
        sourceRootFrame: expected.rootFrame,
        sourceCrop: expected.crop,
        bytes: expected.bytes,
        sha256: expected.sha256,
      })),
      crossLessonVisualComparison: {
        comparisonTarget:
          "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets",
        byteIdenticalOutputCount: assets.length,
        comparedOutputCount: assets.length,
        meaning:
          "Output byte identity supports shared visual lineage only; each course retains its own SWF-bound provenance.",
        strictAcceptanceEffect: "none",
      },
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    const expectedNames = new Set([
      "manifest.json",
      ...assets.map(({expected}) => expected.file),
    ]);
    const outputPath = projectPath(OUTPUT_DIRECTORY);
    if (!check) await mkdir(outputPath, {recursive: true});
    const existingNames = await readdir(outputPath).catch(() => []);
    const unexpected = existingNames.filter((name) => !expectedNames.has(name));
    invariant(
      unexpected.length === 0,
      `refusing unexpected output files: ${unexpected.join(", ")}`,
    );
    await Promise.all([
      ...assets.map(({expected, bytes}) =>
        emit(`${OUTPUT_DIRECTORY}/${expected.file}`, bytes, check)),
      emit(`${OUTPUT_DIRECTORY}/manifest.json`, manifestBytes, check),
    ]);
    return manifest;
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  buildG5L4ShellControlAssets(options)
    .then((manifest) => {
      console.log(JSON.stringify({
        animationId: manifest.animationId,
        assets: manifest.assets.length,
        status: manifest.status,
        strictAcceptanceEffect: manifest.strictAcceptanceEffect,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
