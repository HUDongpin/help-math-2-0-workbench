#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";
import {PNG} from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const READABLE_VIEW_ASSET_ID =
  "g4-l3-course-g04-l03-ts-008-frame-789-readable-view";
export const ANIMATION_ID = "course-g04-l03-ts-008";
export const SOURCE_SWF_SHA256 =
  "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885";
export const RENDERER_SHA256 =
  "30d1272b3ce20cbf8ecbe76219351b78336bf24a71e921ae63bf48174fb267e6";
export const FRAME_DOMAIN = "sprite-350";
export const SOURCE_FRAME = 789;
export const NATIVE_STAGE = Object.freeze({width: 800, height: 600});
export const NATIVE_PADDING = 4;
export const DESKTOP_SCALE = 2.5;

export const SOURCE_PATHS = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf",
  renderer:
    "public/flash-assets/courses/course-g04-l03-ts-008/canvas-renderer.js",
});

export const OUTPUT_DIRECTORY =
  "public/flash-assets/courses/course-g04-l03-ts-008/readable-view";

export const READABLE_VIEW_CROPS = Object.freeze([
  Object.freeze({
    id: "step-3",
    label: "Step 3",
    sourceRect: Object.freeze({x: 292, y: 147, width: 236, height: 149}),
    sourceCharacterIds: Object.freeze([99, 100, 101, 133]),
    sourceCharacterTypes: Object.freeze({
      99: "DefineText",
      100: "DefineText",
      101: "DefineText",
      133: "DefineText",
    }),
    transcript: [
      "Use strategy: Draw a picture. Make a number line.",
      "Place each person’s name on the number line based on the amount of money they have or owe:",
      "Toni has the most money with $7.",
      "The correct answer choice is D.",
    ].join("\n"),
    output: "frame-789-step-3.png",
  }),
  Object.freeze({
    id: "step-4",
    label: "Step 4",
    sourceRect: Object.freeze({x: 292, y: 296, width: 236, height: 191}),
    sourceCharacterIds: Object.freeze([144, 145, 146, 147, 148, 149, 150, 151, 152]),
    sourceCharacterTypes: Object.freeze({
      144: "DefineText",
      145: "DefineText",
      146: "DefineText",
      147: "DefineText",
      148: "DefineText",
      149: "DefineText",
      150: "DefineShape-minus-glyph",
      151: "DefineText",
      152: "DefineText",
    }),
    transcript: [
      "Use strategy: Use Logical Reasoning",
      "Having money means you have a positive amount.",
      "Owing money means you have a negative amount.",
      "Toni has $7 = + 7",
      "Elvin has $3 = + 3",
      "Susan owes $10 = −10",
      "Ricky owes $2 = −2",
      "Toni has the most money with $7.",
      "The correct answer choice is D.",
    ].join("\n"),
    output: "frame-789-step-4.png",
  }),
]);

const SOURCE_FRAME_OUTPUT = "frame-789-source.png";
const MANIFEST_OUTPUT = "readable-view-assets.json";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function parseArguments(argv) {
  if (argv.length !== 1 || !["--build", "--check"].includes(argv[0])) {
    throw new Error("Exactly one mode is required: --build or --check");
  }
  return argv[0].slice(2);
}

export function paddedCropRect(sourceRect, padding = NATIVE_PADDING) {
  const x = Math.max(0, sourceRect.x - padding);
  const y = Math.max(0, sourceRect.y - padding);
  const right = Math.min(NATIVE_STAGE.width, sourceRect.x + sourceRect.width + padding);
  const bottom = Math.min(NATIVE_STAGE.height, sourceRect.y + sourceRect.height + padding);
  return Object.freeze({
    x,
    y,
    width: right - x,
    height: bottom - y,
  });
}

export function cropPng(sourceBytes, rect) {
  const source = PNG.sync.read(sourceBytes);
  if (
    rect.x < 0 ||
    rect.y < 0 ||
    rect.width < 1 ||
    rect.height < 1 ||
    rect.x + rect.width > source.width ||
    rect.y + rect.height > source.height
  ) {
    throw new Error(`Crop is outside ${source.width}x${source.height}`);
  }
  const output = new PNG({width: rect.width, height: rect.height});
  for (let row = 0; row < rect.height; row += 1) {
    const sourceStart = ((rect.y + row) * source.width + rect.x) * 4;
    const targetStart = row * rect.width * 4;
    source.data.copy(
      output.data,
      targetStart,
      sourceStart,
      sourceStart + rect.width * 4,
    );
  }
  return PNG.sync.write(output, {
    colorType: 6,
    inputColorType: 6,
    bitDepth: 8,
  });
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1) {
    throw new Error(`${label} must be one ordinary, single-link file`);
  }
  return metadata;
}

async function readVerifiedSource(relativePath, expectedSha256, label) {
  const absolutePath = path.join(projectRoot, relativePath);
  await assertOrdinaryFile(absolutePath, label);
  const bytes = await readFile(absolutePath);
  const actual = sha256(bytes);
  if (actual !== expectedSha256) {
    throw new Error(
      `${label} SHA-256 drifted: expected ${expectedSha256}, received ${actual}`,
    );
  }
  return bytes;
}

async function captureSourceFrame() {
  await Promise.all([
    readVerifiedSource(SOURCE_PATHS.swf, SOURCE_SWF_SHA256, "source SWF"),
    readVerifiedSource(SOURCE_PATHS.renderer, RENDERER_SHA256, "current-JS renderer"),
  ]);

  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({
      viewport: NATIVE_STAGE,
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<canvas id="source-frame" width="${NATIVE_STAGE.width}" height="${NATIVE_STAGE.height}"></canvas>`,
    );
    await page.addScriptTag({path: path.join(projectRoot, SOURCE_PATHS.renderer)});
    const capture = await page.evaluate(
      async ({animationId, frame, frameDomain}) => {
        const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
        if (!asset) throw new Error(`Missing canvas asset ${animationId}`);
        await asset.ready();
        const canvas = document.querySelector("#source-frame");
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        if (state.frameDomain !== frameDomain || state.localFrame !== frame) {
          throw new Error(
            `Renderer returned ${state.frameDomain}/${state.localFrame}`,
          );
        }
        return {
          dataUrl: canvas.toDataURL("image/png"),
          metadata: asset.metadata,
          state,
        };
      },
      {animationId: ANIMATION_ID, frame: SOURCE_FRAME, frameDomain: FRAME_DOMAIN},
    );
    if (capture.metadata?.sourceSwfSha256 !== SOURCE_SWF_SHA256) {
      throw new Error("Renderer metadata source SWF identity drifted");
    }
    if (
      capture.metadata?.stage?.width !== NATIVE_STAGE.width ||
      capture.metadata?.stage?.height !== NATIVE_STAGE.height
    ) {
      throw new Error("Renderer metadata native stage drifted");
    }
    const prefix = "data:image/png;base64,";
    if (!capture.dataUrl.startsWith(prefix)) {
      throw new Error("Canvas did not produce a PNG data URL");
    }
    const sourceFrame = Buffer.from(capture.dataUrl.slice(prefix.length), "base64");
    const decoded = PNG.sync.read(sourceFrame);
    if (
      decoded.width !== NATIVE_STAGE.width ||
      decoded.height !== NATIVE_STAGE.height
    ) {
      throw new Error(
        `Captured source frame is ${decoded.width}x${decoded.height}`,
      );
    }
    return {sourceFrame, rendererMetadata: capture.metadata, state: capture.state};
  } finally {
    await browser.close();
  }
}

export function buildManifest({sourceFrame, crops, scriptBytes, rendererMetadata}) {
  const transcriptBinding = READABLE_VIEW_CROPS.map((crop) => ({
    id: crop.id,
    sourceCharacterIds: [...crop.sourceCharacterIds],
    sourceCharacterTypes: {...crop.sourceCharacterTypes},
    transcriptSha256: sha256(Buffer.from(crop.transcript, "utf8")),
  }));
  return {
    schemaVersion: 1,
    artifactId: READABLE_VIEW_ASSET_ID,
    classification:
      "source-bound-current-javascript-readable-view-assets-strict-acceptance-effect-none",
    source: {
      animationId: ANIMATION_ID,
      swf: {
        path: SOURCE_PATHS.swf,
        sha256: SOURCE_SWF_SHA256,
      },
      currentJavascriptRenderer: {
        path: SOURCE_PATHS.renderer,
        sha256: RENDERER_SHA256,
        metadataSourceSwfSha256: rendererMetadata.sourceSwfSha256,
      },
      frameDomain: FRAME_DOMAIN,
      frame: SOURCE_FRAME,
      stage: {...NATIVE_STAGE},
      scenario: "source-static-frame",
      language: "en",
      seed: 0,
    },
    presentation: {
      nativePaddingPixels: NATIVE_PADDING,
      desktopScale: DESKTOP_SCALE,
      originalStageRemainsVisible: true,
      defaultExpanded: true,
      liveFrameClaimed: false,
      originalRuntimeClaimed: false,
      flashFidelityEvidence: false,
      learnerProgressEffect: "none",
      strictAcceptanceEffect: "none",
    },
    files: {
      sourceFrame: {
        path: `${OUTPUT_DIRECTORY}/${SOURCE_FRAME_OUTPUT}`,
        width: NATIVE_STAGE.width,
        height: NATIVE_STAGE.height,
        bytes: sourceFrame.length,
        sha256: sha256(sourceFrame),
      },
      crops: READABLE_VIEW_CROPS.map((spec) => {
        const bytes = crops.get(spec.id);
        const rect = paddedCropRect(spec.sourceRect);
        return {
          id: spec.id,
          label: spec.label,
          path: `${OUTPUT_DIRECTORY}/${spec.output}`,
          sourceRect: {...spec.sourceRect},
          paddedCropRect: {...rect},
          width: rect.width,
          height: rect.height,
          bytes: bytes.length,
          sha256: sha256(bytes),
        };
      }),
    },
    transcriptBinding,
    generator: {
      path: "scripts/build-g4-l3-ts008-readable-view-assets.mjs",
      sha256: sha256(scriptBytes),
      deterministicSource: "current-JS canvas renderer at fixed frame 789",
      manualScreenshotUsed: false,
      secondLiveRuntimeUsed: false,
    },
  };
}

async function materialize() {
  const [{sourceFrame, rendererMetadata}, scriptBytes] = await Promise.all([
    captureSourceFrame(),
    readFile(scriptPath),
  ]);
  const crops = new Map(
    READABLE_VIEW_CROPS.map((spec) => [
      spec.id,
      cropPng(sourceFrame, paddedCropRect(spec.sourceRect)),
    ]),
  );
  const manifest = buildManifest({
    sourceFrame,
    crops,
    scriptBytes,
    rendererMetadata,
  });
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return {
    [SOURCE_FRAME_OUTPUT]: sourceFrame,
    ...Object.fromEntries(
      READABLE_VIEW_CROPS.map((spec) => [spec.output, crops.get(spec.id)]),
    ),
    [MANIFEST_OUTPUT]: manifestBytes,
  };
}

async function atomicWrite(target, bytes) {
  const temporary = `${target}.tmp-${process.pid}`;
  await rm(temporary, {force: true});
  await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
  try {
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, {force: true});
    throw error;
  }
}

async function build() {
  const outputRoot = path.join(projectRoot, OUTPUT_DIRECTORY);
  await mkdir(outputRoot, {recursive: true});
  const generated = await materialize();
  for (const [name, bytes] of Object.entries(generated)) {
    await atomicWrite(path.join(outputRoot, name), bytes);
  }
  return generated;
}

async function check() {
  const outputRoot = path.join(projectRoot, OUTPUT_DIRECTORY);
  const generated = await materialize();
  for (const [name, expected] of Object.entries(generated)) {
    const target = path.join(outputRoot, name);
    await assertOrdinaryFile(target, name);
    const actual = await readFile(target);
    if (!actual.equals(expected)) {
      throw new Error(`${path.relative(projectRoot, target)} is stale`);
    }
  }
  return generated;
}

async function main() {
  const mode = parseArguments(process.argv.slice(2));
  const generated = mode === "build" ? await build() : await check();
  const summary = Object.entries(generated).map(([name, bytes]) => ({
    path: `${OUTPUT_DIRECTORY}/${name}`,
    bytes: bytes.length,
    sha256: sha256(bytes),
  }));
  process.stdout.write(
    `${mode === "build" ? "Built" : "Verified"} ${READABLE_VIEW_ASSET_ID}\n${JSON.stringify(summary, null, 2)}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
