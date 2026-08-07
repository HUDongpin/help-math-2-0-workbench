#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const INPUT_REPORT_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-successor-v7/diagnostic.json";
export const INPUT_REPORT_SHA256 =
  "eb2e458f3654a4420f35727bafd8c6eae314b619bdcb19737b1c8749b9145f06";
export const JSON_REPORT_RELATIVE =
  "reports/g4-l10-vb003-ruffle-v7-target-stability.json";
export const MARKDOWN_REPORT_RELATIVE =
  "reports/g4-l10-vb003-ruffle-v7-target-stability.md";

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 VB003 Ruffle v7 stability: ${message}`);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function stableBinding(relativePath, expectedSha256) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath} is not a regular file`);
  invariant((before.mode & 0o222n) === 0n, `${relativePath} is not read-only`);
  const contents = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeNs === after.mtimeNs,
    `${relativePath} changed while read`,
  );
  invariant(sha256(contents) === expectedSha256, `${relativePath} SHA-256 drifted`);
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    contents,
  };
}

function descriptor(binding) {
  const {contents, ...rest} = binding;
  return rest;
}

export function compareRegion(first, second, region) {
  invariant(first.width === second.width && first.height === second.height, "PNG dimensions differ");
  const {x, y, width, height} = region;
  invariant(
    x >= 0 && y >= 0 && width > 0 && height > 0 &&
      x + width <= first.width && y + height <= first.height,
    `invalid region ${JSON.stringify(region)}`,
  );
  let exactRgbaDifferentPixels = 0;
  let exactRgbDifferentPixels = 0;
  let squaredRgbError = 0;
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const offset = (row * first.width + column) * 4;
      let rgbaDifferent = false;
      let rgbDifferent = false;
      for (let channel = 0; channel < 4; channel += 1) {
        const delta = first.data[offset + channel] - second.data[offset + channel];
        if (delta !== 0) rgbaDifferent = true;
        if (channel < 3) {
          squaredRgbError += delta * delta;
          if (delta !== 0) rgbDifferent = true;
        }
      }
      if (rgbaDifferent) exactRgbaDifferentPixels += 1;
      if (rgbDifferent) exactRgbDifferentPixels += 1;
    }
  }
  const pixelCount = width * height;
  return {
    region,
    pixelCount,
    exactRgbaDifferentPixels,
    exactRgbDifferentPixels,
    exactRgbDifferentPixelRatio: exactRgbDifferentPixels / pixelCount,
    normalizedRgbRmse:
      Math.sqrt(squaredRgbError / (pixelCount * 3)) / 255,
    exactPixelStable: exactRgbaDifferentPixels === 0,
  };
}

export async function buildReport() {
  const diagnostic = await stableBinding(INPUT_REPORT_RELATIVE, INPUT_REPORT_SHA256);
  const input = JSON.parse(diagnostic.contents.toString("utf8"));
  invariant(
    input.reportType ===
      "g4-l10-vb003-contained-original-host-ruffle-successor-v7-diagnostic" &&
      input.observation?.chain?.allSevenExpectedChildTransitionsObserved === true &&
      input.observation?.target?.swfHttpDeliveryObserved === true &&
      input.observation?.target?.beginHandshakeActuallyObserved === false &&
      input.authority?.strictAcceptanceEffect === "none",
    "input diagnostic is not the expected fail-closed successful v7 chain",
  );
  const stability = input.observation.target.twoSecondPixelStabilityCandidate;
  invariant(
    stability?.byteIdenticalPng === false &&
      stability.provesRuntimeTerminal === false &&
      stability.provesVisualFidelity === false,
    "input stability candidate boundary drifted",
  );
  const [firstBinding, secondBinding] = await Promise.all([
    stableBinding(stability.first.path, stability.first.sha256),
    stableBinding(stability.second.path, stability.second.sha256),
  ]);
  const first = PNG.sync.read(firstBinding.contents);
  const second = PNG.sync.read(secondBinding.contents);
  invariant(first.width === 800 && first.height === 600, "first PNG is not 800x600");
  invariant(second.width === 800 && second.height === 600, "second PNG is not 800x600");
  const regions = {
    fullPlayer: compareRegion(first, second, {x: 0, y: 0, width: 800, height: 600}),
    targetContentAboveHostChrome: compareRegion(
      first,
      second,
      {x: 0, y: 0, width: 800, height: 500},
    ),
    targetLessonBody: compareRegion(
      first,
      second,
      {x: 0, y: 109, width: 800, height: 391},
    ),
    hostChrome: compareRegion(first, second, {x: 0, y: 500, width: 800, height: 100}),
  };
  invariant(
    regions.fullPlayer.exactRgbaDifferentPixels === 2_520 &&
      regions.targetContentAboveHostChrome.exactRgbaDifferentPixels === 0 &&
      regions.targetLessonBody.exactRgbaDifferentPixels === 0 &&
      regions.hostChrome.exactRgbaDifferentPixels === 2_520,
    `unexpected pixel partition: ${JSON.stringify(regions)}`,
  );
  return {
    schemaVersion: 1,
    reportType: "g4-l10-vb003-ruffle-v7-target-stability-analysis",
    evidenceAsOf: "2026-08-02",
    status:
      "target-content-exactly-stable-over-two-seconds-host-chrome-dynamic-ruffle-forensic-only",
    input: {
      diagnostic: descriptor(diagnostic),
      first: {...descriptor(firstBinding), atMs: stability.first.atMs},
      second: {...descriptor(secondBinding), atMs: stability.second.atMs},
      intervalMs: stability.second.atMs - stability.first.atMs,
      targetPath: input.observation.target.expectedSwfPath,
      sevenStepDeliveryObserved: true,
      sourceDeclaredElapsedWindowCompleted: true,
    },
    metricDefinition: {
      exactPixelDifference:
        "A pixel differs when any decoded RGBA byte differs. Counts use all pixels in the declared rectangle.",
      normalizedRgbRmse:
        "sqrt(mean squared RGB byte error across all pixels and three RGB channels)) / 255",
      segmentation:
        "The full 800x600 Ruffle player is partitioned at y=500: target content y=0..499 and host chrome y=500..599. The target lesson body is y=109..499.",
    },
    regions,
    interpretation: {
      fullPlayerByteOrPixelStable: false,
      targetContentExactPixelStable: true,
      targetLessonBodyExactPixelStable: true,
      allObservedPixelChangeConfinedToHostChrome: true,
      supportsTargetStaticStateCandidate: true,
      provesRuffleRuntimeTerminal: false,
      provesBeginHandshake: false,
      provesChildFrameDomainEntry: false,
      provesAdobeOriginalRuntime: false,
      comparesOriginalRuntimeToJavaScript: false,
      formalRmseAcceptanceEffect: "none",
      reason:
        "Two pixel-stable Ruffle target-content frames support only a static-state candidate. No playhead-bearing trace observes begin, child-domain entry, or terminal arrival, and no authoritative original-runtime or JavaScript counterpart is compared.",
    },
    authority: {
      ruffleForensicReferenceOnly: true,
      diagnosticSelfComparisonOnly: true,
      authoritativeOriginalRuntime: false,
      originalRuntimeNaturalTrace: false,
      originalRuntimeBaseline: false,
      fullFrameBaseline: false,
      formalRmseComparison: false,
      visualFidelity: false,
      audioListeningOrSynchronization: false,
      humanReview: false,
      ownerReview: false,
      strictCompletion: false,
      wholeLessonIntegration: false,
      releaseOrPublication: false,
      strictAcceptanceEffect: "none",
    },
  };
}

export function renderMarkdown(report) {
  const rows = Object.entries(report.regions).map(([name, value]) =>
    `| ${name} | ${value.region.x},${value.region.y},${value.region.width},${value.region.height} | ${value.exactRgbaDifferentPixels.toLocaleString("en-US")} | ${value.normalizedRgbRmse.toFixed(12)} | ${value.exactPixelStable} |`).join("\n");
  return `# G4 L10 VB003 Ruffle v7 target stability\n\n` +
    `> **Ruffle forensic diagnostic self-comparison only.** This is not an Adobe original-runtime baseline, an original-versus-JavaScript comparison, formal RMSE acceptance, human/owner review, strict completion, or release evidence.\n\n` +
    `## Result\n\n` +
    `After the seven controlled host releases and the source-declared VB003 elapsed window, two 800×600 Ruffle captures ${report.input.intervalMs.toLocaleString("en-US")} ms apart differ across the full player because the bottom host chrome remains dynamic. The target content region above y=500 and the lesson body from y=109 through y=499 are exactly pixel-stable.\n\n` +
    `| Region | x,y,w,h | Exact RGBA-different pixels | Normalized RGB RMSE | Exact stable |\n| --- | --- | ---: | ---: | --- |\n${rows}\n\n` +
    `All **${report.regions.fullPlayer.exactRgbaDifferentPixels.toLocaleString("en-US")}** changed pixels are confined to host chrome. The target content has **0** changed pixels and RMSE **0**. This supports a static target-state candidate only: \`begin\`, child-domain entry, terminal playhead arrival, audio synchronization, Adobe original runtime, and visual fidelity all remain unproved.\n\n` +
    `Input diagnostic SHA-256: \`${report.input.diagnostic.sha256}\`. Strict acceptance effect: \`none\`.\n`;
}

async function main() {
  const check = process.argv.includes("--check");
  invariant(process.argv.length === (check ? 3 : 2), "usage: node scripts/analyze-g4-l10-vb003-ruffle-v7-target-stability.mjs [--check]");
  const report = await buildReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  const jsonPath = path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE);
  const markdownPath = path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE);
  if (check) {
    invariant(await readFile(jsonPath, "utf8") === json, `${JSON_REPORT_RELATIVE} is stale`);
    invariant(await readFile(markdownPath, "utf8") === markdown, `${MARKDOWN_REPORT_RELATIVE} is stale`);
    process.stdout.write(`${JSON_REPORT_RELATIVE}: pass\n`);
    return;
  }
  await writeFile(jsonPath, json, {mode: 0o444});
  await writeFile(markdownPath, markdown, {mode: 0o444});
  await chmod(jsonPath, 0o444);
  await chmod(markdownPath, 0o444);
  process.stdout.write(`${JSON_REPORT_RELATIVE}: wrote ${Buffer.byteLength(json)} bytes\n`);
  process.stdout.write(`${MARKDOWN_REPORT_RELATIVE}: wrote ${Buffer.byteLength(markdown)} bytes\n`);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
