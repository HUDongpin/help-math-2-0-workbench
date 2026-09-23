#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {access, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf";
const SHELL_SOURCE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf";
const OUTPUT_DIRECTORY =
  "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets";
const FFDEC_IDENTITY = Object.freeze({
  version: "JPEXS Free Flash Decompiler v.26.2.1",
  launcherSha256: "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  ffdecJarSha256: "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f",
});
const OUTPUTS = Object.freeze({
  font: Object.freeze({
    file: "bauhaus-md-bt-source-subset.ttf",
    sourceCharacterId: 5,
    exportedFile: "5_Bauhaus Md BT.ttf",
    bytes: 8_512,
    sha256: "7ff1652d468918619599e09c46a5f27050d5f1c9ff9d19cda12b609fafa464d2",
    family: "Bauhaus Md BT",
    format: "truetype",
  }),
  title: Object.freeze({
    file: "page-title.png",
    spriteId: 3,
    exportedFrames: 1,
    bytes: 4_766,
    sha256: "7e3fc30e2bfa1801611c50829fc92f2b2025c65777c3b94551093ac214be95f5",
    width: 381,
    height: 24,
  }),
  table: Object.freeze({
    file: "four-step-plan-table-source-static.png",
    spriteId: 23,
    exportedFrames: 128,
    bytes: 12_680,
    sha256: "054f5689149fc8fd931c416bf95a763e41f80f11c6dd07c21db322df04526ecb",
    width: 478,
    height: 175,
  }),
});
const SHELL_BUTTON_OUTPUTS = Object.freeze([
  Object.freeze({
    role: "lesson-shell-rewind-up",
    file: "lesson-shell-rewind-up.png",
    buttonId: 591,
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    bytes: 2_900,
    sha256: "b8e515445e7f7f0216afa2726f96229e07a1338fdb3b8d754f1afc69987a5291",
  }),
  Object.freeze({
    role: "lesson-shell-forward-up",
    file: "lesson-shell-forward-up.png",
    buttonId: 594,
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    bytes: 2_892,
    sha256: "a485fe38c69c307ed1a2e4dc30964d248e3f3b7ddddc2f4828ed10144b6997df",
  }),
  Object.freeze({
    role: "lesson-shell-key-terms-up",
    file: "lesson-shell-key-terms-up.png",
    buttonId: 1037,
    crop: Object.freeze({x: 226, y: 19, width: 136, height: 42}),
    bytes: 6_439,
    sha256: "547c8d71f43ca314f1ad497f75bb9fec1c873c53c4315bbf1dcb0861629f6270",
  }),
  Object.freeze({
    role: "lesson-shell-map-up",
    file: "lesson-shell-map-up.png",
    buttonId: 1046,
    crop: Object.freeze({x: 260, y: 18, width: 136, height: 42}),
    bytes: 5_607,
    sha256: "4229e324f4e8538dccd285d8dcd6aed8645009897abc0332932cf38358f036e1",
  }),
  Object.freeze({
    role: "lesson-shell-calculator-up",
    file: "lesson-shell-calculator-up.png",
    buttonId: 1057,
    crop: Object.freeze({x: 586, y: 57, width: 135, height: 42}),
    bytes: 6_423,
    sha256: "890b013752a495d2561266a4a1b2ebd80de85bc0cb6412763e5ac926b87f8d94",
  }),
  Object.freeze({
    role: "lesson-shell-spanish-page-audio-up",
    file: "lesson-shell-spanish-page-audio-up.png",
    buttonId: 217,
    sourceCanvas: Object.freeze({width: 134, height: 22}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 4_328,
      sha256: "c09c0520145112fb3639b132aaed1d7c98bbf678d669cf283ee02cff7291734e",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 134, height: 22}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 217,
          instanceName: "SA",
          depth: 202,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 12_715, y: 1_730}),
            translatePixels: Object.freeze({x: 635.75, y: 86.5}),
          }),
          initialColorAlphaFactor: 0,
        }),
      ]),
      sourceAction: "_root.doPlaySpanishAudio()",
    }),
    bytes: 3_678,
    sha256: "166048633c189ba63c057aa00697f44216aab65d00a1f288af94f8b6a3dc58db",
  }),
  Object.freeze({
    role: "lesson-shell-replay-up",
    file: "lesson-shell-replay-up.png",
    buttonId: 252,
    sourceCanvas: Object.freeze({width: 42, height: 42}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 2_872,
      sha256: "9e801b95f6de8df9c56dcc65b514be2973383c32ee9ea14e85da9f9d3bc950ea",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 253,
          instanceName: "replay_mc",
          depth: 231,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1.000076293945312,
            scaleY: 1.000244140625,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 14_776, y: 12_002}),
            translatePixels: Object.freeze({x: 738.8, y: 600.1}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-253",
          sourceCharacterId: 252,
          instanceName: "Replay",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: 0.6479949951171875,
            scaleY: 0.6479949951171875,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: -3_228, y: -576}),
            translatePixels: Object.freeze({x: -161.4, y: -28.8}),
          }),
        }),
      ]),
    }),
    bytes: 3_056,
    sha256: "7079f2329ddd27617534201b6c945d4a65266bdc0b61dec1b735992481f74b56",
  }),
  Object.freeze({
    role: "lesson-shell-play-up",
    file: "lesson-shell-play-up.png",
    buttonId: 256,
    sourceCanvas: Object.freeze({width: 42, height: 42}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 2_596,
      sha256: "40b03dafd90516d40062fb271adb5346f8d2ca1d2b73c02a3ea7d38b478044a6",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 257,
          instanceName: "play_mc",
          depth: 233,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 0.99932861328125,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 13_710, y: 10_880}),
            translatePixels: Object.freeze({x: 685.5, y: 544}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-257",
          sourceCharacterId: 256,
          instanceName: "play_btn",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: 0.6479949951171875,
            scaleY: 0.6479949951171875,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 888, y: 557}),
            translatePixels: Object.freeze({x: 44.4, y: 27.85}),
          }),
        }),
      ]),
    }),
    bytes: 2_694,
    sha256: "358a2aaac6e7ba756c913de6b9e8e6468a9a6b9e0e0a290d896bced97e3e7063",
  }),
  Object.freeze({
    role: "lesson-shell-pause-up",
    file: "lesson-shell-pause-up.png",
    buttonId: 260,
    sourceCanvas: Object.freeze({width: 42, height: 42}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 2_529,
      sha256: "62abb92c2731a0951d3c20bb0df0df0ce47502ebf5685717c951f857a5cdcd81",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 261,
          instanceName: "pause_mc",
          depth: 235,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 13_721, y: 10_880}),
            translatePixels: Object.freeze({x: 686.05, y: 544}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-261",
          sourceCharacterId: 260,
          instanceName: "pause_btn",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: 0.6479949951171875,
            scaleY: 0.6479949951171875,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 875, y: 562}),
            translatePixels: Object.freeze({x: 43.75, y: 28.1}),
          }),
        }),
      ]),
    }),
    bytes: 2_396,
    sha256: "18c5e0e5da7e6c992a5c0bf0ae7dcd7f92d4dd47fb2b9769b0bf5f8d9217b2d5",
  }),
  Object.freeze({
    role: "lesson-shell-volume-icon-up",
    file: "lesson-shell-volume-icon-up.png",
    buttonId: 330,
    sourceCanvas: Object.freeze({width: 42, height: 42}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 2_570,
      sha256: "d6f19099675d0c0496bd691fdf6ad11803f2ed1ef859079d343829447b2815d0",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 335,
          instanceName: "audiomain",
          depth: 247,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 9_230, y: 11_897}),
            translatePixels: Object.freeze({x: 461.5, y: 594.85}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-335",
          sourceCharacterId: 330,
          instanceName: "Mute",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: 0.5,
            scaleY: 0.5,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 3_004, y: -449}),
            translatePixels: Object.freeze({x: 150.2, y: -22.45}),
          }),
        }),
      ]),
    }),
    bytes: 2_646,
    sha256: "3cb9da43b2d5b1948905f2b974cc74384ffb53ac714414924c443cc664037c83",
  }),
  Object.freeze({
    role: "lesson-shell-volume-muted-icon-up",
    file: "lesson-shell-volume-muted-icon-up.png",
    buttonId: 333,
    sourceCanvas: Object.freeze({width: 42, height: 42}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 2_844,
      sha256: "0f3e716afeb31aa20106d81a1b01cc9aa52b5a9dfbd376f9667d6cd0e87707d5",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 42, height: 42}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 335,
          instanceName: "audiomain",
          depth: 247,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 9_230, y: 11_897}),
            translatePixels: Object.freeze({x: 461.5, y: 594.85}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-335",
          sourceCharacterId: 333,
          instanceName: "Resume",
          depth: 1,
          timelineFrame: 2,
          transform: Object.freeze({
            scaleX: 0.6484832763671875,
            scaleY: 0.6056976318359375,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 3_004, y: -449}),
            translatePixels: Object.freeze({x: 150.2, y: -22.45}),
          }),
        }),
      ]),
    }),
    bytes: 2_850,
    sha256: "742e70222227de4f64530337994f391a7884f5a6106b1a8ed9cff41a388164ee",
  }),
  Object.freeze({
    role: "lesson-shell-next-neutral-up",
    file: "lesson-shell-next-neutral-up.png",
    buttonId: 340,
    sourceCanvas: Object.freeze({width: 55, height: 55}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 3_543,
      sha256: "91a535925f5d4d4f9bddc44b4cdd6990c431f0fa4a1a64dd03ac7f61dc4f336a",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 55, height: 55}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 341,
          instanceName: "next_mc",
          depth: 259,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 15_361, y: 11_160}),
            translatePixels: Object.freeze({x: 768.05, y: 558}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-341",
          sourceCharacterId: 340,
          instanceName: "Next",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: 0.79998779296875,
            scaleY: 0.79998779296875,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 0, y: 0}),
            translatePixels: Object.freeze({x: 0, y: 0}),
          }),
        }),
      ]),
    }),
    bytes: 4_324,
    sha256: "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886",
  }),
  Object.freeze({
    role: "lesson-shell-previous-neutral-up",
    file: "lesson-shell-previous-neutral-up.png",
    buttonId: 342,
    sourceCanvas: Object.freeze({width: 55, height: 55}),
    sourceExport: Object.freeze({
      file: "1_up.png",
      bytes: 3_543,
      sha256: "91a535925f5d4d4f9bddc44b4cdd6990c431f0fa4a1a64dd03ac7f61dc4f336a",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 55, height: 55}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 343,
          instanceName: "back_mc1",
          depth: 261,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 10_459, y: 11_160}),
            translatePixels: Object.freeze({x: 522.95, y: 558}),
          }),
        }),
        Object.freeze({
          parentTimelineId: "sprite-343",
          sourceCharacterId: 342,
          instanceName: "Previous",
          depth: 1,
          timelineFrame: 1,
          transform: Object.freeze({
            scaleX: -0.79998779296875,
            scaleY: 0.79998779296875,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 0, y: 0}),
            translatePixels: Object.freeze({x: 0, y: 0}),
          }),
        }),
      ]),
    }),
    bytes: 4_324,
    sha256: "bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886",
  }),
]);
const SHELL_SPRITE_OUTPUTS = Object.freeze({
  volumeSlider: Object.freeze({
    role: "lesson-shell-volume-slider-source-static",
    file: "lesson-shell-volume-slider-source-static.png",
    spriteId: 185,
    exportedFrames: 1,
    sourceCanvas: Object.freeze({width: 108, height: 17}),
    sourceExport: Object.freeze({
      file: "1.png",
      bytes: 196,
      sha256: "81a7df7bce1d4d96e836ce8775f6d9c91ad3d77784213e8e7f9ff81bedd47df8",
    }),
    crop: Object.freeze({x: 0, y: 0, width: 108, height: 17}),
    sourcePlacement: Object.freeze({
      rootFrame: 49,
      path: Object.freeze([
        Object.freeze({
          parentTimelineId: "root",
          sourceCharacterId: 185,
          instanceName: "mySlider",
          depth: 18,
          timelineFrame: 49,
          transform: Object.freeze({
            scaleX: 0.776702880859375,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 12_412, y: 11_440}),
            translatePixels: Object.freeze({x: 620.6, y: 572}),
          }),
        }),
      ]),
      compositionFrame: 1,
      children: Object.freeze([
        Object.freeze({
          sourceCharacterId: 180,
          instanceName: "Btn_Click",
          depth: 1,
          transform: Object.freeze({
            scaleX: 0.7925872802734375,
            scaleY: 1.166671752929688,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: -75, y: -86}),
            translatePixels: Object.freeze({x: -3.75, y: -4.3}),
          }),
        }),
        Object.freeze({
          sourceCharacterId: 182,
          instanceName: "line",
          depth: 3,
          transform: Object.freeze({
            scaleX: 0.6666717529296875,
            scaleY: 5,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 0, y: 0}),
            translatePixels: Object.freeze({x: 0, y: 0}),
          }),
        }),
        Object.freeze({
          sourceCharacterId: 182,
          instanceName: "volumebar1",
          depth: 5,
          transform: Object.freeze({
            scaleX: 0.0066680908203125,
            scaleY: 5,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: 0, y: 0}),
            translatePixels: Object.freeze({x: 0, y: 0}),
          }),
        }),
        Object.freeze({
          sourceCharacterId: 184,
          instanceName: "dragger",
          depth: 7,
          transform: Object.freeze({
            scaleX: 1.199996948242188,
            scaleY: 0.9444580078125,
            skewX: 0,
            skewY: 0,
            translateTwips: Object.freeze({x: -4, y: 10}),
            translatePixels: Object.freeze({x: -0.2, y: 0.5}),
          }),
        }),
      ]),
    }),
    bytes: 190,
    sha256: "e098126899d81da32e8cae04e1d363d7722a29eee2fec9e3b25c39a60e605986",
  }),
});
const SOURCE_IDENTITY = Object.freeze({
  bytes: 55_154,
  sha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
});
const SHELL_SOURCE_IDENTITY = Object.freeze({
  bytes: 657_421,
  sha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
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
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
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
  const jarPath = path.join(path.dirname(resolvedLauncher), "ffdec.jar");
  const jarBytes = await readFile(jarPath);
  invariant(sha256(launcherBytes) === FFDEC_IDENTITY.launcherSha256,
    "FFDec launcher identity changed");
  invariant(sha256(jarBytes) === FFDEC_IDENTITY.ffdecJarSha256,
    "FFDec JAR identity changed");
  return {
    path: command,
    resolvedLauncher,
    version: FFDEC_IDENTITY.version,
    launcherSha256: FFDEC_IDENTITY.launcherSha256,
    ffdecJarSha256: FFDEC_IDENTITY.ffdecJarSha256,
  };
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

async function exportSprite({ffdec, temporaryRoot, spriteId, source = SOURCE}) {
  const destination = path.join(temporaryRoot, `sprite-${spriteId}`);
  const result = await execFile(ffdec, [
    "-onerror", "abort",
    "-selectid", String(spriteId),
    "-format", "sprite:png",
    "-export", "sprite",
    destination,
    projectPath(source),
  ], {maxBuffer: 8 * 1024 * 1024, timeout: 60_000});
  const output = `${result.stdout}\n${result.stderr}`;
  invariant(output.includes(FFDEC_IDENTITY.version),
    "FFDec version output changed");
  const directory = path.join(destination, `DefineSprite_${spriteId}`);
  const files = (await readdir(directory)).filter((file) => /^\d+\.png$/.test(file))
    .sort((left, right) => Number.parseInt(left) - Number.parseInt(right));
  return {directory, files};
}

async function exportFonts({ffdec, temporaryRoot}) {
  const destination = path.join(temporaryRoot, "fonts");
  const result = await execFile(ffdec, [
    "-onerror", "abort",
    "-export", "font",
    destination,
    projectPath(SOURCE),
  ], {maxBuffer: 8 * 1024 * 1024, timeout: 60_000});
  const output = `${result.stdout}\n${result.stderr}`;
  invariant(output.includes(FFDEC_IDENTITY.version),
    "FFDec version output changed");
  const files = (await readdir(destination)).filter((file) => file.endsWith(".ttf")).sort();
  invariant(files.length === 3, "TS006 embedded font export count changed");
  invariant(files.includes(OUTPUTS.font.exportedFile),
    "TS006 Bauhaus Md BT embedded font export is missing");
  return {directory: destination, files};
}

async function exportShellButtons({ffdec, temporaryRoot}) {
  const destination = path.join(temporaryRoot, "shell-buttons");
  const selectedIds = SHELL_BUTTON_OUTPUTS.map(({buttonId}) => buttonId).join(",");
  const result = await execFile(ffdec, [
    "-onerror", "abort",
    "-selectid", selectedIds,
    "-format", "button:png",
    "-export", "button",
    destination,
    projectPath(SHELL_SOURCE),
  ], {maxBuffer: 8 * 1024 * 1024, timeout: 60_000});
  const output = `${result.stdout}\n${result.stderr}`;
  invariant(output.includes(FFDEC_IDENTITY.version),
    "FFDec version output changed");
  return destination;
}

async function buildCroppedPngAsset(sourcePath, expected, label) {
  const sourceBytes = await readFile(sourcePath);
  if (expected.sourceExport) {
    invariant(sourceBytes.length === expected.sourceExport.bytes
      && sha256(sourceBytes) === expected.sourceExport.sha256,
    `${label} FFDec source export identity changed`);
  }
  const source = PNG.sync.read(sourceBytes);
  if (expected.sourceCanvas) {
    invariant(source.width === expected.sourceCanvas.width
      && source.height === expected.sourceCanvas.height,
    `${label} FFDec source canvas changed`);
  }
  const {x, y, width, height} = expected.crop;
  invariant(x >= 0 && y >= 0 && x + width <= source.width && y + height <= source.height,
    `${label} crop escapes its FFDec canvas`);
  const cropped = new PNG({width, height});
  PNG.bitblt(source, cropped, x, y, width, height, 0, 0);
  const bytes = PNG.sync.write(cropped);
  invariant(bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
    `${label} cropped PNG identity changed`);
  return {expected, bytes};
}

async function buildCroppedButtonAssets(directory) {
  return Promise.all(SHELL_BUTTON_OUTPUTS.map((expected) =>
    buildCroppedPngAsset(path.join(
      directory,
      `DefineButton2_${expected.buttonId}`,
      "1_up.png",
    ), expected, `button ${expected.buttonId}`)));
}

async function inspect(bytes, expected, label) {
  invariant(bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
    `${label} PNG identity changed`);
  const image = PNG.sync.read(bytes);
  invariant(image.width === expected.width && image.height === expected.height,
    `${label} PNG dimensions changed`);
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

export async function buildG4L3Ts006DiagnosticCompositeAssets({
  check = false,
  ffdec = "/opt/homebrew/bin/ffdec",
} = {}) {
  const sourceBytes = await readFile(projectPath(SOURCE));
  invariant(sourceBytes.length === SOURCE_IDENTITY.bytes &&
    sha256(sourceBytes) === SOURCE_IDENTITY.sha256,
  "TS006 source SWF identity changed");
  const shellSourceBytes = await readFile(projectPath(SHELL_SOURCE));
  invariant(shellSourceBytes.length === SHELL_SOURCE_IDENTITY.bytes
    && sha256(shellSourceBytes) === SHELL_SOURCE_IDENTITY.sha256,
  "G4 L3 Lesson Shell source SWF identity changed");
  const ffdecIdentity = await inspectFfdec(ffdec);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "ts006-diagnostic-assets-"));
  try {
    const [fontExport, shellButtonExport, shellVolumeSliderExport, titleExport, tableExport] = await Promise.all([
      exportFonts({ffdec, temporaryRoot}),
      exportShellButtons({ffdec, temporaryRoot}),
      exportSprite({
        ffdec,
        temporaryRoot,
        spriteId: SHELL_SPRITE_OUTPUTS.volumeSlider.spriteId,
        source: SHELL_SOURCE,
      }),
      exportSprite({ffdec, temporaryRoot, spriteId: OUTPUTS.title.spriteId}),
      exportSprite({ffdec, temporaryRoot, spriteId: OUTPUTS.table.spriteId}),
    ]);
    invariant(
      shellVolumeSliderExport.files.length === SHELL_SPRITE_OUTPUTS.volumeSlider.exportedFrames,
      "shell sprite-185 exported frame count changed",
    );
    invariant(titleExport.files.length === OUTPUTS.title.exportedFrames,
      "sprite-3 exported frame count changed");
    invariant(tableExport.files.length === OUTPUTS.table.exportedFrames,
      "sprite-23 exported frame count changed");
    const [fontBytes, titleBytes, tableBytes, ...otherTableFrames] = await Promise.all([
      readFile(path.join(fontExport.directory, OUTPUTS.font.exportedFile)),
      readFile(path.join(titleExport.directory, "1.png")),
      readFile(path.join(tableExport.directory, "1.png")),
      ...tableExport.files.slice(1).map((file) => readFile(path.join(tableExport.directory, file))),
    ]);
    await inspect(titleBytes, OUTPUTS.title, "sprite-3 title");
    await inspect(tableBytes, OUTPUTS.table, "sprite-23 table");
    invariant(fontBytes.length === OUTPUTS.font.bytes
      && sha256(fontBytes) === OUTPUTS.font.sha256,
    "TS006 Bauhaus Md BT embedded font subset identity changed");
    invariant(otherTableFrames.every((bytes) => bytes.equals(tableBytes)),
      "sprite-23 static PNG export is no longer visually byte-identical across 128 frames");
    const shellButtonAssets = await buildCroppedButtonAssets(shellButtonExport);
    const shellVolumeSliderAsset = await buildCroppedPngAsset(
      path.join(shellVolumeSliderExport.directory, "1.png"),
      SHELL_SPRITE_OUTPUTS.volumeSlider,
      "shell sprite-185 volume slider",
    );
    const scriptBytes = await readFile(SCRIPT_PATH);
    const manifest = {
      schemaVersion: 1,
      evidenceType: "ts006-diagnostic-composite-source-static-assets",
      animationId: "course-g04-l03-ts-006",
      classification: "ffdec-structural-assets-for-diagnostic-engineering-candidate",
      authority: {
        originalRuntimeBaseline: false,
        sourceFrameMappingEstablished: false,
        structuralPlacementMetadataIncluded: true,
        audioRendered: false,
        strictAcceptanceEffect: "none",
      },
      source: {path: SOURCE, ...SOURCE_IDENTITY},
      lessonShellSource: {path: SHELL_SOURCE, ...SHELL_SOURCE_IDENTITY},
      tool: ffdecIdentity,
      generator: {
        path: path.relative(ROOT, SCRIPT_PATH).split(path.sep).join("/"),
        bytes: scriptBytes.length,
        sha256: sha256(scriptBytes),
      },
      assets: [
        {
          role: "embedded-bauhaus-font-subset",
          sourceCharacterId: OUTPUTS.font.sourceCharacterId,
          file: OUTPUTS.font.file,
          bytes: OUTPUTS.font.bytes,
          sha256: OUTPUTS.font.sha256,
          family: OUTPUTS.font.family,
          format: OUTPUTS.font.format,
        },
        {role: "page-title-companion", frameDomain: "sprite-3", ...OUTPUTS.title},
        {role: "source-static-four-step-plan-table", frameDomain: "sprite-23", ...OUTPUTS.table},
        ...SHELL_BUTTON_OUTPUTS.map(({crop, ...asset}) => ({
          ...asset,
          sourceKind: "DefineButton2",
          sourceCharacterId: asset.buttonId,
          sourceState: "up",
          dimensions: `${crop.width}x${crop.height}`,
          sourceCrop: crop,
        })),
        (({crop, ...asset}) => ({
          ...asset,
          sourceKind: "DefineSprite",
          sourceCharacterId: asset.spriteId,
          sourceState: "frame-1",
          frameDomain: `sprite-${asset.spriteId}`,
          dimensions: `${crop.width}x${crop.height}`,
          sourceCrop: crop,
        }))(SHELL_SPRITE_OUTPUTS.volumeSlider),
      ].map(({file, ...asset}) => ({...asset, file})),
      unresolved: [
        "The exported TrueType file is the glyph subset embedded in the source SWF; it is not a complete retail Bauhaus font distribution.",
        "The sprite-23 export contains the source-static wording 'Check your answer.'; the observed host runtime changes this to 'Check your work.' through unresolved composition or dynamic text behavior.",
        "The Spanish page-audio artwork and its source action are structural extraction only; runtime visibility, interaction causality, audio loading, audible Spanish/content, timing, and synchronization remain unproved.",
        "Replay, Play, Pause, Previous, Next, volume-state transitions, and volume-slider behavior remain source-structural mappings; these assets do not establish original-runtime reachability, behavior, visual parity, human review, Owner acceptance, or strict completion.",
      ],
      strictAcceptanceEffect: "none",
    };
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    await Promise.all([
      emit(`${OUTPUT_DIRECTORY}/${OUTPUTS.font.file}`, fontBytes, check),
      emit(`${OUTPUT_DIRECTORY}/${OUTPUTS.title.file}`, titleBytes, check),
      emit(`${OUTPUT_DIRECTORY}/${OUTPUTS.table.file}`, tableBytes, check),
      ...shellButtonAssets.map(({expected, bytes}) =>
        emit(`${OUTPUT_DIRECTORY}/${expected.file}`, bytes, check)),
      emit(
        `${OUTPUT_DIRECTORY}/${shellVolumeSliderAsset.expected.file}`,
        shellVolumeSliderAsset.bytes,
        check,
      ),
      emit(`${OUTPUT_DIRECTORY}/manifest.json`, manifestBytes, check),
    ]);
    return manifest;
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  buildG4L3Ts006DiagnosticCompositeAssets(options).then((manifest) => {
    console.log(`Verified ${manifest.assets.length} TS006 diagnostic-composite source assets.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
