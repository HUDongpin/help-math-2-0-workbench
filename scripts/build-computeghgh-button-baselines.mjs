#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import sharp from "sharp";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const defaultProjectRoot = path.resolve(scriptDirectory, "..");

const DEFAULT_EXPECTED = Object.freeze({
  animationId: "keyterm-elementary-computeghgh",
  buttonId: 14,
  stage: Object.freeze({ width: 225, height: 225 }),
  frameRate: 12,
  frameCount: 35,
  inputs: Object.freeze({
    swf: Object.freeze({
      file: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf",
      sha256: "fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8",
    }),
    machineReport: Object.freeze({
      file: "migrations/keyterm-elementary-computeghgh/audit/machine/report.json",
      sha256: "8de16cf9f4e55ada403938284f3d7c465a646ee2297fb8b3599877b0b2be0739",
    }),
    swfmillXml: Object.freeze({
      file: "migrations/keyterm-elementary-computeghgh/audit/machine/swfmill.xml.gz",
      sha256: "701edb158e02d0584b6ccffbbe454096509248c8e07f6e1e7ce261a44a77bf9a",
      uncompressedSha256: "eb34f7b3dcdde2f1b9c49b466d3b65d58a6b4791d2149777ee210848e4db40b1",
    }),
    rootFrame: Object.freeze({
      file: "public/flash-assets/keyterms/computeghgh/frame.png",
      sha256: "9edf43347c50395dd9dbd8c44cd8e256d9830fe9b62c2a9287304b246e45b880",
    }),
    upSvg: Object.freeze({
      file: "public/flash-assets/keyterms/computeghgh/buttons/up.svg",
      sha256: "c4fda24b1b446d35c9a8f804325bdbf77974b206328d73ab5464a739c068b42c",
    }),
    overSvg: Object.freeze({
      file: "public/flash-assets/keyterms/computeghgh/buttons/over.svg",
      sha256: "8c0db63a72f22aa871ec18e893d82fad0e9f56cbfb8f9f5f7c72a41779479856",
    }),
    downSvg: Object.freeze({
      file: "public/flash-assets/keyterms/computeghgh/buttons/down.svg",
      sha256: "f75873aadab20f0b97c942e97536229ddc38b3bd46e5be9b5003885da3504feb",
    }),
    adobeUp: Object.freeze({
      file: "artifacts/full-frame/pilot-baselines/keyterm-elementary-computeghgh/adobe-flash-player-32-interactions-replay-up.png",
      sha256: "056133570fb8232d5a195c49b7d46a19bf89a8a111c62fb6e42678fc9378ce83",
    }),
    adobeOver: Object.freeze({
      file: "artifacts/full-frame/pilot-baselines/keyterm-elementary-computeghgh/adobe-flash-player-32-interactions-replay-over.png",
      sha256: "d88f12d0583a019e4b054f09416b5e93d46ec7a2e3d534d09208090c6c748532",
    }),
    adobeDownJpeg: Object.freeze({
      file: "migrations/keyterm-elementary-computeghgh/baseline/adobe-flash-player-32-replay-pressed-computer-use.jpeg",
      sha256: "d9f4ff90de057d40fc0e5b0e8bceedd46f5d541105dd51312f804ec3a4c1698e",
    }),
    implementationDown: Object.freeze({
      file: "artifacts/full-frame/pilot-implementations/keyterm-elementary-computeghgh/replay-pressed/en/frame-035.png",
      sha256: "b5b329c0fb4d463d522ae02c0196197460048655bffbf2103150a37f79b8cf31",
    }),
  }),
  outputDirectory: "artifacts/full-frame/pilot-baselines/keyterm-elementary-computeghgh/swf-structural-button-states",
  diffDirectory: "artifacts/full-frame/comparisons/keyterm-elementary-computeghgh/swf-structural-button-states",
  manifestFile: "migrations/keyterm-elementary-computeghgh/baseline/swf-structural-button-states.json",
});

function usage() {
  return `Usage:
  node scripts/build-computeghgh-button-baselines.mjs [options]

Options:
  --check                 Recompute all bytes and fail if archived evidence is stale
  --generated-at <ISO>    Override the manifest generation time
  --project-root <path>   Override the repository root (primarily for tests)
  --python <command>      Python command used for ElementTree XML parsing
  --help                  Show this help

The builder verifies every source hash, parses swfmill XML with Python
ElementTree, derives the button placement from twips plus the FFDec export
matrix, and uses sharp to render reproducible 225x225 structural state PNGs.
It does not perform or represent human or owner review.`;
}

export function parseArguments(argumentsList) {
  const options = { check: false, python: "python3" };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--generated-at", "--project-root", "--python"].includes(argument)) {
      const value = argumentsList[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      if (argument === "--generated-at") options.generatedAt = value;
      else if (argument === "--project-root") options.projectRoot = path.resolve(value);
      else options.python = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function resolveInput(projectRoot, entry) {
  return path.resolve(projectRoot, entry.file);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function near(actual, expected, label, epsilon = 1e-9) {
  assert(Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${label}: expected ${expected}, observed ${actual}`);
}

async function readVerified(projectRoot, label, entry) {
  const file = resolveInput(projectRoot, entry);
  const bytes = await readFile(file);
  const observed = sha256(bytes);
  assert(observed === entry.sha256,
    `${label} SHA-256 mismatch: expected ${entry.sha256}, observed ${observed}`);
  return { file, bytes, sha256: observed };
}

async function inspectPngBuffer(bytes, stage, label) {
  let image;
  try {
    image = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  assert(image.width === stage.width && image.height === stage.height,
    `${label} is ${image.width}x${image.height}; expected ${stage.width}x${stage.height}`);
  return image;
}

function outputPath(projectRoot, relative) {
  return path.resolve(projectRoot, relative);
}

async function writeAtomically(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

async function assertArchivedBytes(destination, expectedBytes, label) {
  const observed = await readFile(destination);
  assert(observed.equals(expectedBytes),
    `${label} is stale: expected SHA-256 ${sha256(expectedBytes)}, observed ${sha256(observed)}`);
}

export async function parseSourceStructure({
  swfmillFile,
  svgFiles,
  buttonId,
  python = "python3",
  helperFile = path.join(scriptDirectory, "parse-swfmill-button-evidence.py"),
}) {
  const argumentsList = [
    helperFile,
    "--swfmill", swfmillFile,
    "--button-id", String(buttonId),
    ...Object.entries(svgFiles).flatMap(([state, file]) => ["--svg", `${state}=${file}`]),
  ];
  const { stdout } = await execFile(python, argumentsList, { maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout);
}

function validateReport(report, expected, swfmillRawSha256) {
  assert(report.animationId === expected.animationId, "machine report animationId mismatch");
  assert(report.source?.expectedSha256 === expected.inputs.swf.sha256,
    "machine report source hash does not bind the expected SWF");
  assert(report.source?.hashMatches === true, "machine report did not verify the source SWF");
  const xmlOutput = report.outputs?.find(({ path: candidate }) => candidate === "audit/machine/swfmill.xml.gz");
  assert(xmlOutput?.sha256 === expected.inputs.swfmillXml.sha256,
    "machine report swfmill gzip hash mismatch");
  assert(xmlOutput?.uncompressedSha256 === swfmillRawSha256,
    "machine report swfmill uncompressed hash mismatch");
  assert(report.findings?.runtimeCrossCheck?.allMatch === true,
    "machine report runtime metadata cross-check did not pass");
}

function validateStructure(structure, expected) {
  near(structure.stage.width, expected.stage.width, "parsed stage width");
  near(structure.stage.height, expected.stage.height, "parsed stage height");
  near(structure.header.frameRate, expected.frameRate, "parsed frame rate");
  assert(structure.header.frameCount === expected.frameCount,
    `parsed frame count: expected ${expected.frameCount}, observed ${structure.header.frameCount}`);
  assert(structure.button.objectId === expected.buttonId, "parsed button object ID mismatch");

  const release = structure.button.conditions.find(
    ({ attributes }) => attributes.pointerReleaseInside === "1",
  );
  assert(release, "DefineButton2 is missing pointerReleaseInside condition");
  assert(release.actions.length >= 2
    && release.actions[0].name === "GotoFrame"
    && release.actions[0].attributes.frame === "0"
    && release.actions[1].name === "Play",
  "DefineButton2 release action is not GotoFrame(0) followed by Play");

  const translations = [];
  for (const state of ["up", "over", "down"]) {
    const svg = structure.svgStates[state];
    assert(svg, `missing parsed ${state} SVG`);
    const expectedCharacters = structure.button.states[state];
    assert(JSON.stringify(svg.characterIds) === JSON.stringify(expectedCharacters),
      `${state} SVG character IDs do not match DefineButton2 state membership: `
      + `${JSON.stringify(svg.characterIds)} versus ${JSON.stringify(expectedCharacters)}`);
    near(svg.groupMatrix[0], 1, `${state} SVG matrix scaleX`);
    near(svg.groupMatrix[1], 0, `${state} SVG matrix skewY`);
    near(svg.groupMatrix[2], 0, `${state} SVG matrix skewX`);
    near(svg.groupMatrix[3], 1, `${state} SVG matrix scaleY`);
    translations.push(svg.groupTranslation);
  }
  for (const translation of translations.slice(1)) {
    near(translation.x, translations[0].x, "SVG registration translation x");
    near(translation.y, translations[0].y, "SVG registration translation y");
  }
  return translations[0];
}

function deriveComposition(structure, registration) {
  const firstSvg = structure.svgStates.up;
  const topLeft = {
    x: structure.placement.pixels.x - registration.x,
    y: structure.placement.pixels.y - registration.y,
  };
  const stage = structure.stage;
  const eraseLeft = Math.max(0, Math.floor(topLeft.x - 1));
  const eraseTop = Math.max(0, Math.floor(topLeft.y - 1));
  const eraseRight = Math.min(stage.width, Math.ceil(topLeft.x + firstSvg.width + 1));
  const eraseBottom = Math.min(stage.height, Math.ceil(topLeft.y + firstSvg.height + 1));
  return {
    topLeft,
    width: firstSvg.width,
    height: firstSvg.height,
    erase: {
      x: eraseLeft,
      y: eraseTop,
      width: eraseRight - eraseLeft,
      height: eraseBottom - eraseTop,
    },
  };
}

function overlaySvg(stateSvg, stage, composition) {
  const embedded = stateSvg.toString("base64");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${stage.width}" height="${stage.height}" viewBox="0 0 ${stage.width} ${stage.height}">`
    + `<rect x="${composition.erase.x}" y="${composition.erase.y}" width="${composition.erase.width}" height="${composition.erase.height}" fill="#ffffff"/>`
    + `<image x="${composition.topLeft.x}" y="${composition.topLeft.y}" width="${composition.width}" height="${composition.height}" preserveAspectRatio="none" href="data:image/svg+xml;base64,${embedded}"/>`
    + "</svg>",
  );
}

export async function renderStructuralState({ rootFrame, stateSvg, stage, composition }) {
  const overlay = overlaySvg(stateSvg, stage, composition);
  return sharp(rootFrame, { limitInputPixels: false })
    .flatten({ background: "#ffffff" })
    .composite([{ input: overlay, left: 0, top: 0 }])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
}

export function comparePngBuffers(baselineBytes, implementationBytes, options = {}) {
  const baseline = PNG.sync.read(baselineBytes);
  const implementation = PNG.sync.read(implementationBytes);
  assert(baseline.width === implementation.width && baseline.height === implementation.height,
    `image dimensions differ: ${baseline.width}x${baseline.height} versus `
    + `${implementation.width}x${implementation.height}`);
  let squaredError = 0;
  for (let index = 0; index < baseline.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = baseline.data[index + channel] - implementation.data[index + channel];
      squaredError += delta * delta;
    }
  }
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const mismatchedPixels = pixelmatch(
    baseline.data,
    implementation.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: Number(options.pixelThreshold ?? 0.1), includeAA: true },
  );
  return {
    width: baseline.width,
    height: baseline.height,
    normalizedRmse: Math.sqrt(squaredError / (baseline.width * baseline.height * 3)) / 255,
    mismatchedPixels,
    mismatchedPixelRatio: mismatchedPixels / (baseline.width * baseline.height),
    diffBytes: PNG.sync.write(diff),
  };
}

function evidenceFile(projectRoot, absolute) {
  return portable(path.relative(projectRoot, absolute));
}

function comparisonRecord({
  projectRoot,
  id,
  role,
  baseline,
  baselineBytes,
  implementation,
  implementationBytes,
  diffFile,
  comparison,
  threshold,
}) {
  return {
    id,
    role,
    baselineFile: evidenceFile(projectRoot, baseline),
    baselineSha256: sha256(baselineBytes),
    implementationFile: evidenceFile(projectRoot, implementation),
    implementationSha256: sha256(implementationBytes),
    diffFile: evidenceFile(projectRoot, diffFile),
    diffSha256: sha256(comparison.diffBytes),
    width: comparison.width,
    height: comparison.height,
    normalizedRmse: comparison.normalizedRmse,
    mismatchedPixels: comparison.mismatchedPixels,
    mismatchedPixelRatio: comparison.mismatchedPixelRatio,
    assignedThreshold: threshold,
    metricResult: comparison.normalizedRmse <= threshold ? "pass" : "fail",
  };
}

function fileRecord(projectRoot, file, bytes, state, stage) {
  return {
    state,
    file: evidenceFile(projectRoot, file),
    sha256: sha256(bytes),
    bytes: bytes.length,
    width: stage.width,
    height: stage.height,
    encoding: "lossless-png",
  };
}

async function pythonVersion(python) {
  const result = await execFile(python, ["--version"]);
  return `${result.stdout}${result.stderr}`.trim();
}

export async function buildComputeghghButtonBaselines({
  projectRoot = defaultProjectRoot,
  check = false,
  generatedAt,
  python = "python3",
  expected = DEFAULT_EXPECTED,
  helperFile,
} = {}) {
  const inputEntries = Object.entries(expected.inputs);
  const inputs = Object.fromEntries(await Promise.all(inputEntries.map(async ([label, entry]) => [
    label,
    await readVerified(projectRoot, label, entry),
  ])));

  await inspectPngBuffer(inputs.rootFrame.bytes, expected.stage, "root frame");
  await inspectPngBuffer(inputs.adobeUp.bytes, expected.stage, "Adobe up baseline");
  await inspectPngBuffer(inputs.adobeOver.bytes, expected.stage, "Adobe over baseline");
  await inspectPngBuffer(inputs.implementationDown.bytes, expected.stage, "implementation down capture");

  const swfmillRaw = gunzipSync(inputs.swfmillXml.bytes);
  const swfmillRawSha256 = sha256(swfmillRaw);
  assert(swfmillRawSha256 === expected.inputs.swfmillXml.uncompressedSha256,
    `swfmill uncompressed SHA-256 mismatch: expected ${expected.inputs.swfmillXml.uncompressedSha256}, `
    + `observed ${swfmillRawSha256}`);
  const report = JSON.parse(inputs.machineReport.bytes.toString("utf8"));
  validateReport(report, expected, swfmillRawSha256);

  const svgFiles = {
    up: inputs.upSvg.file,
    over: inputs.overSvg.file,
    down: inputs.downSvg.file,
  };
  const structure = await parseSourceStructure({
    swfmillFile: inputs.swfmillXml.file,
    svgFiles,
    buttonId: expected.buttonId,
    python,
    helperFile,
  });
  const registration = validateStructure(structure, expected);
  const composition = deriveComposition(structure, registration);

  const outputDirectory = outputPath(projectRoot, expected.outputDirectory);
  const diffDirectory = outputPath(projectRoot, expected.diffDirectory);
  const manifestFile = outputPath(projectRoot, expected.manifestFile);
  const stateOutputs = {};
  for (const state of ["up", "over", "down"]) {
    const file = path.join(outputDirectory, `${state}.png`);
    const bytes = await renderStructuralState({
      rootFrame: inputs.rootFrame.bytes,
      stateSvg: inputs[`${state}Svg`].bytes,
      stage: expected.stage,
      composition,
    });
    await inspectPngBuffer(bytes, expected.stage, `generated ${state} structural baseline`);
    stateOutputs[state] = { file, bytes };
  }

  const threshold = 0.05;
  const comparisonSpecs = [
    {
      id: "adobe-up-v-source-structural-up",
      role: "calibration",
      baseline: inputs.adobeUp,
      implementation: stateOutputs.up,
    },
    {
      id: "adobe-over-v-source-structural-over",
      role: "calibration",
      baseline: inputs.adobeOver,
      implementation: stateOutputs.over,
    },
    {
      id: "source-structural-down-v-modern-pressed",
      role: "down-state-validation",
      baseline: stateOutputs.down,
      implementation: inputs.implementationDown,
    },
  ];
  const comparisons = [];
  const diffOutputs = [];
  for (const specification of comparisonSpecs) {
    const comparison = comparePngBuffers(
      specification.baseline.bytes,
      specification.implementation.bytes,
    );
    const diffFile = path.join(diffDirectory, `${specification.id}.png`);
    diffOutputs.push({ file: diffFile, bytes: comparison.diffBytes, id: specification.id });
    comparisons.push(comparisonRecord({
      projectRoot,
      id: specification.id,
      role: specification.role,
      baseline: specification.baseline.file,
      baselineBytes: specification.baseline.bytes,
      implementation: specification.implementation.file,
      implementationBytes: specification.implementation.bytes,
      diffFile,
      comparison,
      threshold,
    }));
  }
  const calibrationRows = comparisons.filter(({ role }) => role === "calibration");
  const calibrationPass = calibrationRows.length === 2
    && calibrationRows.every(({ metricResult }) => metricResult === "pass");
  const downRow = comparisons.find(({ role }) => role === "down-state-validation");
  const downMetricPass = downRow?.metricResult === "pass";

  let resolvedGeneratedAt = generatedAt;
  if (check && !resolvedGeneratedAt) {
    const priorManifest = JSON.parse(await readFile(manifestFile, "utf8"));
    resolvedGeneratedAt = priorManifest.generatedAt;
  }
  resolvedGeneratedAt ??= new Date().toISOString();
  assert(!Number.isNaN(Date.parse(resolvedGeneratedAt)), "generatedAt must be an ISO timestamp");

  const toolchain = {
    python: await pythonVersion(python),
    xmlParser: "Python standard library xml.etree.ElementTree",
    sharp: sharp.versions.sharp,
    libvips: sharp.versions.vips,
    librsvg: sharp.versions.rsvg,
    png: sharp.versions.png,
    pixelmatch: "7.2.0",
    pngjs: "7.0.0",
  };
  const stateFiles = ["up", "over", "down"].map((state) => fileRecord(
    projectRoot,
    stateOutputs[state].file,
    stateOutputs[state].bytes,
    state,
    expected.stage,
  ));
  const manifest = {
    schemaVersion: 1,
    evidenceType: "source-structural-definebutton2-state-baseline",
    animationId: expected.animationId,
    status: calibrationPass && downMetricPass
      ? "calibrated-source-structural-baseline"
      : "failed-calibration-or-down-metric",
    generatedAt: resolvedGeneratedAt,
    authority: {
      kind: "original-swf-structure-and-extracted-vector-assets",
      priority: "SWF tags/bytecode are source evidence; Adobe lossless up/over captures calibrate the structural compositor.",
      runtimeCaveat: "The down PNG is source-structural evidence, not a lossless Adobe runtime capture. The retained Adobe JPEG is behavioral/visual confirmation only and is excluded from RMSE.",
    },
    source: {
      swf: { file: expected.inputs.swf.file, sha256: inputs.swf.sha256 },
      machineReport: { file: expected.inputs.machineReport.file, sha256: inputs.machineReport.sha256 },
      swfmillXml: {
        file: expected.inputs.swfmillXml.file,
        sha256: inputs.swfmillXml.sha256,
        uncompressedSha256: swfmillRawSha256,
      },
      rootFrame: { file: expected.inputs.rootFrame.file, sha256: inputs.rootFrame.sha256 },
      stateSvgs: Object.fromEntries(["up", "over", "down"].map((state) => [state, {
        file: expected.inputs[`${state}Svg`].file,
        sha256: inputs[`${state}Svg`].sha256,
      }])),
      adobeRuntimeCalibration: {
        up: { file: expected.inputs.adobeUp.file, sha256: inputs.adobeUp.sha256, encoding: "lossless-png" },
        over: { file: expected.inputs.adobeOver.file, sha256: inputs.adobeOver.sha256, encoding: "lossless-png" },
        downConfirmation: {
          file: expected.inputs.adobeDownJpeg.file,
          sha256: inputs.adobeDownJpeg.sha256,
          encoding: "computer-use-jpeg",
          usableForRmse: false,
        },
      },
      implementationDown: {
        file: expected.inputs.implementationDown.file,
        sha256: inputs.implementationDown.sha256,
      },
    },
    toolchain,
    parsedStructure: {
      parser: "scripts/parse-swfmill-button-evidence.py",
      document: structure.document,
      stage: structure.stage,
      frameRate: structure.header.frameRate,
      frameCount: structure.header.frameCount,
      buttonId: structure.button.objectId,
      placementDepth: structure.placement.depth,
      placementTwips: structure.placement.twips,
      placementPixels: structure.placement.pixels,
      records: structure.button.records,
      stateCharacterIds: structure.button.states,
      releaseConditions: structure.button.conditions,
      svgStates: structure.svgStates,
    },
    composition: {
      derivation: "stage top-left = PlaceObject2 translation / 20 - FFDec SVG first-group translation",
      registrationTranslation: registration,
      stageTopLeft: composition.topLeft,
      stateDimensions: { width: composition.width, height: composition.height },
      eraseRectangle: composition.erase,
      background: "#ffffff",
      outputStage: expected.stage,
      renderer: "sharp/libvips/librsvg",
    },
    outputs: {
      archiveDirectory: expected.outputDirectory,
      states: stateFiles,
      archiveDigest: sha256(stateFiles.map(({ state, sha256: digest }) => `${state}\0${digest}\n`).join("")),
    },
    validation: {
      contract: {
        dimensions: expected.stage,
        normalizedRgbRmse: "sqrt(mean((baselineRGB-implementationRGB)^2))/255",
        staticThreshold: threshold,
        calibrationRequiredStates: ["up", "over"],
        downAcceptedOnlyWhenCalibrationPasses: true,
      },
      comparisons,
      calibrationPass,
      downMetricPass,
      sourceStructuralDownEligibleForEngineeringVisualReview: calibrationPass && downMetricPass,
      humanVisualReview: "pending",
      ownerReview: "pending",
    },
    integrity: {
      diffArchiveDirectory: expected.diffDirectory,
      diffArchiveDigest: sha256(diffOutputs.map(({ id, bytes }) => `${id}\0${sha256(bytes)}\n`).join("")),
      checkCommand: "node scripts/build-computeghgh-button-baselines.mjs --check",
    },
    limitations: [
      "This structural reconstruction is calibrated against lossless Adobe up and over states; it is not a lossless Adobe down-state runtime capture.",
      "The retained Adobe down-state JPEG includes player chrome, pointer pixels, and lossy compression, so no RMSE is computed from it.",
      "Numeric thresholds do not replace named human inspection of the generated down baseline, modern pressed capture, and diff.",
      "This evidence does not establish original-host localization, instructional identity, authoritative no-audio behavior, human acceptance, or owner acceptance.",
    ],
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);

  if (check) {
    for (const state of ["up", "over", "down"]) {
      await assertArchivedBytes(stateOutputs[state].file, stateOutputs[state].bytes, `${state} structural baseline`);
    }
    for (const diff of diffOutputs) {
      await assertArchivedBytes(diff.file, diff.bytes, `${diff.id} diff`);
    }
    await assertArchivedBytes(manifestFile, manifestBytes, "tracked structural-baseline manifest");
  } else {
    for (const state of ["up", "over", "down"]) {
      await writeAtomically(stateOutputs[state].file, stateOutputs[state].bytes);
    }
    for (const diff of diffOutputs) await writeAtomically(diff.file, diff.bytes);
    await writeAtomically(manifestFile, manifestBytes);
  }
  return manifest;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const manifest = await buildComputeghghButtonBaselines({
    ...options,
    projectRoot: options.projectRoot ?? defaultProjectRoot,
  });
  console.log(JSON.stringify({
    animationId: manifest.animationId,
    status: manifest.status,
    calibrationPass: manifest.validation.calibrationPass,
    downMetricPass: manifest.validation.downMetricPass,
    comparisons: manifest.validation.comparisons.map(({ id, normalizedRmse, metricResult }) => ({
      id,
      normalizedRmse,
      metricResult,
    })),
    manifest: DEFAULT_EXPECTED.manifestFile,
    mode: options.check ? "check" : "write",
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

export { DEFAULT_EXPECTED };
