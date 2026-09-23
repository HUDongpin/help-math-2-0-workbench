#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const SOURCE_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-en-native-replay-diagnostic-20260726T213100+0800";
const IMPLEMENTATION_DIRECTORY =
  "output/playwright/g4-l3-ts006-diagnostic-composite-v8/en-natural-entry-diagnostic";
const REPORT_JSON = "reports/g4-l3-ts006-replay-diagnostic-comparison-v9.json";
const REPORT_MARKDOWN = "reports/g4-l3-ts006-replay-diagnostic-comparison-v9.md";

export const REPLAY_DIAGNOSTIC_FRAME_PAIRS = Object.freeze([
  Object.freeze({sourceLocalFrame: 1, captureOrdinal: 163, kind: "static"}),
  Object.freeze({sourceLocalFrame: 8, captureOrdinal: 170, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 13, captureOrdinal: 175, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 55, captureOrdinal: 217, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 58, captureOrdinal: 220, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 74, captureOrdinal: 236, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 77, captureOrdinal: 239, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 125, captureOrdinal: 287, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 127, captureOrdinal: 289, kind: "transition"}),
  Object.freeze({sourceLocalFrame: 128, captureOrdinal: 290, kind: "static"}),
]);

export const REPLAY_DIAGNOSTIC_REGIONS = Object.freeze({
  fullFrame: Object.freeze({x: 0, y: 0, width: 800, height: 600}),
  header: Object.freeze({x: 0, y: 0, width: 800, height: 108}),
  bodyContent: Object.freeze({x: 0, y: 108, width: 800, height: 416}),
  footer: Object.freeze({x: 0, y: 524, width: 800, height: 76}),
});

export const NEXT_BUTTON_NEUTRAL_PROBE = Object.freeze({
  coordinateSpace: "native-stage",
  centerX: 769,
  centerY: 560,
  radius: 20,
  neutralOrangeRatioMinimum: 0.7,
  hoverBlueRatioMaximum: 0.05,
  minimumSampledPixels: 800,
  orangeRule: "red > 150; 55 < green < 220; blue < 120",
  hoverBlueRule: "blue > 110 and blue > red * 1.1",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function round(value) {
  return Number(value.toFixed(12));
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

async function readBoundPng(relativePath, expectedSha256) {
  const bytes = await readFile(projectPath(relativePath));
  invariant(sha256(bytes) === expectedSha256, `PNG hash drift: ${relativePath}`);
  const png = PNG.sync.read(bytes);
  invariant(png.width === 800 && png.height === 600, `PNG geometry drift: ${relativePath}`);
  return {bytes, png};
}

export function validateReplayDiagnosticInputs({source, implementation}) {
  invariant(
    source?.status === "raw-capture-not-yet-bound-to-runtime-trace"
      && source.runtimeAuthorityClaimed === false
      && source.acceptanceEffect === "none",
    "source capture must remain raw, non-authoritative, and acceptance-neutral",
  );
  invariant(
    source.evidenceType === "g4-l3-lossless-window-frame-and-system-audio-capture",
    "source capture evidence type drifted",
  );
  invariant(
    source.configuration?.cursor === "excluded"
      && source.configuration?.outputWidth === "800"
      && source.configuration?.outputHeight === "600"
      && source.configuration?.fps === "12",
    "source capture must be native 800x600 at 12 FPS with cursor excluded",
  );
  invariant(
    source.droppedOrIncompleteFrameCount === 0
      && Array.isArray(source.frames)
      && source.frames.length === 477,
    "source capture must contain all 477 complete frames",
  );
  invariant(
    source.frames.every(
      (frame, index) =>
        frame.ordinal === index + 1
        && frame.status === "complete"
        && frame.width === 800
        && frame.height === 600
        && /^[a-f0-9]{64}$/u.test(frame.sha256),
    ),
    "source capture frame inventory is incomplete or malformed",
  );

  invariant(
    implementation?.status === "complete"
      && implementation.animationId === ANIMATION_ID
      && implementation.frameDomainId === "sprite-23"
      && implementation.scenario === "manual-runtime-diagnostic-observation"
      && implementation.language === "en"
      && implementation.seed === "0",
    "v8 implementation capture identity drifted",
  );
  invariant(
    Array.isArray(implementation.captured)
      && implementation.captured.length === REPLAY_DIAGNOSTIC_FRAME_PAIRS.length,
    "v8 implementation capture must contain the ten diagnostic keyframes",
  );
  invariant(
    implementation.captured.every((frame, index) => {
      const expected = REPLAY_DIAGNOSTIC_FRAME_PAIRS[index].sourceLocalFrame;
      return frame.frame === expected
        && frame.reportedFrame === expected
        && frame.reportedAnimationId === ANIMATION_ID
        && frame.frameDomainId === "sprite-23"
        && frame.width === 800
        && frame.height === 600
        && /^[a-f0-9]{64}$/u.test(frame.sha256);
    }),
    "v8 implementation keyframes are incomplete or out of order",
  );
  invariant(
    (implementation.consoleErrors ?? []).length === 0
      && (implementation.failedRequests ?? []).length === 0
      && (implementation.httpErrors ?? []).length === 0
      && (implementation.unexpectedRequests ?? []).length === 0,
    "v8 implementation capture contains browser or network errors",
  );
  invariant(
    REPLAY_DIAGNOSTIC_FRAME_PAIRS.every(
      ({sourceLocalFrame, captureOrdinal}) => captureOrdinal === sourceLocalFrame + 162,
    ),
    "tentative Replay mapping no longer follows captureOrdinal = sourceLocalFrame + 162",
  );
  return true;
}

function isBlackPixel(data, index) {
  return data[index] <= 5 && data[index + 1] <= 5 && data[index + 2] <= 5;
}

export function detectLeftStageOffset(png) {
  for (let x = 0; x < png.width; x += 1) {
    let blackPixels = 0;
    for (let y = 0; y < png.height; y += 1) {
      if (isBlackPixel(png.data, (y * png.width + x) * 4)) blackPixels += 1;
    }
    if (blackPixels / png.height < 0.98) return x;
  }
  throw new Error("image has no detectable stage pixels");
}

export function compareRgbRegion(
  source,
  implementation,
  region,
  {sourceOffsetX = 0} = {},
) {
  const sourceX = region.x + sourceOffsetX;
  const implementationX = region.x;
  const width = Math.min(
    region.width,
    source.width - sourceX,
    implementation.width - implementationX,
  );
  const height = Math.min(
    region.height,
    source.height - region.y,
    implementation.height - region.y,
  );
  invariant(width > 0 && height > 0, "comparison region has no overlapping pixels");
  let squaredError = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = ((region.y + y) * source.width + sourceX + x) * 4;
      const implementationIndex =
        ((region.y + y) * implementation.width + implementationX + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = source.data[sourceIndex + channel]
          - implementation.data[implementationIndex + channel];
        squaredError += delta * delta;
      }
    }
  }
  return {
    normalizedRmse: round(Math.sqrt(squaredError / (width * height * 3)) / 255),
    comparedPixels: width * height,
    sourceRect: {x: sourceX, y: region.y, width, height},
    implementationRect: {x: implementationX, y: region.y, width, height},
  };
}

export function classifyNextButtonState(png, {stageOffsetX = 0} = {}) {
  const probe = NEXT_BUTTON_NEUTRAL_PROBE;
  const centerX = probe.centerX + stageOffsetX;
  let sampledPixels = 0;
  let orangePixels = 0;
  let hoverBluePixels = 0;
  for (let y = probe.centerY - probe.radius; y <= probe.centerY + probe.radius; y += 1) {
    if (y < 0 || y >= png.height) continue;
    for (let x = centerX - probe.radius; x <= centerX + probe.radius; x += 1) {
      if (x < 0 || x >= png.width) continue;
      if ((x - centerX) ** 2 + (y - probe.centerY) ** 2 > probe.radius ** 2) continue;
      const index = (y * png.width + x) * 4;
      const red = png.data[index];
      const green = png.data[index + 1];
      const blue = png.data[index + 2];
      sampledPixels += 1;
      if (red > 150 && green > 55 && green < 220 && blue < 120) orangePixels += 1;
      if (blue > 110 && blue > red * 1.1) hoverBluePixels += 1;
    }
  }
  const orangeRatio = orangePixels / sampledPixels;
  const hoverBlueRatio = hoverBluePixels / sampledPixels;
  const neutral =
    sampledPixels >= probe.minimumSampledPixels
    && orangeRatio >= probe.neutralOrangeRatioMinimum
    && hoverBlueRatio <= probe.hoverBlueRatioMaximum;
  return {
    state: neutral ? "neutral-orange" : "not-verified-neutral",
    sampledPixels,
    orangePixels,
    orangeRatio: round(orangeRatio),
    hoverBluePixels,
    hoverBlueRatio: round(hoverBlueRatio),
  };
}

function summarize(items, selector) {
  const values = items.map(selector);
  const max = Math.max(...values);
  const maxIndex = values.indexOf(max);
  return {
    min: round(Math.min(...values)),
    max: round(max),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    maxAtSourceLocalFrame: items[maxIndex].sourceLocalFrame,
    maxAtCaptureOrdinal: items[maxIndex].captureOrdinal,
  };
}

function summarizeRegions(comparisons, metricFamily) {
  return Object.fromEntries(
    Object.keys(REPLAY_DIAGNOSTIC_REGIONS).map((regionId) => [
      regionId,
      summarize(
        comparisons,
        (item) => item.rmse[metricFamily][regionId].normalizedRmse,
      ),
    ]),
  );
}

function recommendations(comparisons, registrationOffsets, regionSummary) {
  const worstBody = regionSummary.stageRegistered.bodyContent;
  const worstFooter = regionSummary.stageRegistered.footer;
  return [
    {
      priority: "P0",
      id: "adjudicate-whole-stage-registration-before-v9-tuning",
      action:
        `Re-run or adjudicate the Replay capture registration before changing candidate geometry: `
        + `the selected source frames contain left-stage offsets ${registrationOffsets.join(", ")} px. `
        + `Bind any replacement segment to a trace and require one stable native-stage origin.`,
      executableCheck:
        "Run this generator again and require summary.sourceStageRegistration.distinctLeftOffsetsPixels to equal [0] before treating raw RMSE as candidate error.",
      candidateFiles: [],
    },
    {
      priority: "P1",
      id: "retime-strategy-reveal-after-mapping-is-confirmed",
      action:
        `After the ordinal mapping is trace-confirmed, retune the sprite-23 reveal phases around `
        + `source frames 77 and 125-128; the worst stage-registered body/content RMSE is `
        + `${worstBody.max.toFixed(6)} at local frame ${worstBody.maxAtSourceLocalFrame}.`,
      executableCheck:
        "Update inferredSourcePhases/ramp anchors, recapture exactly the same ten local frames, and require the stage-registered body/content mean and max to decrease without changing neutral controls.",
      candidateFiles: [
        "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
      ],
    },
    {
      priority: "P2",
      id: "refine-shell-footer-assets-and-control-geometry",
      action:
        `Refine footer background/control geometry independently from lesson content; its `
        + `stage-registered RMSE mean is ${worstFooter.mean.toFixed(6)} and the Next control must `
        + `remain neutral-orange.`,
      executableCheck:
        "Adjust only diagnostic shell/footer assets and layout constants, then rerun this report and require a lower footer mean while summary.nextButtonNeutral.allSelectedFramesNeutral remains true.",
      candidateFiles: [
        "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
        "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets",
      ],
    },
    {
      priority: "P3",
      id: "preserve-cursor-free-neutral-capture",
      action:
        "Keep ScreenCaptureKit cursor exclusion enabled and park the pointer away from controls so an invisible pointer cannot leave a hover state in captured pixels.",
      executableCheck:
        "Require capture-manifest configuration.cursor = excluded and both source/implementation Next probes to classify neutral-orange for every selected frame.",
      candidateFiles: [],
    },
  ];
}

function markdown(report) {
  const rows = report.comparisons.map((item) => {
    const raw = item.rmse.rawFixedCoordinates;
    const adjusted = item.rmse.stageRegisteredDiagnostic;
    return `| ${item.sourceLocalFrame} | ${item.captureOrdinal} | ${item.sourceStageLeftOffsetPixels} | `
      + `${raw.fullFrame.normalizedRmse.toFixed(6)} | `
      + `${raw.bodyContent.normalizedRmse.toFixed(6)} | `
      + `${raw.header.normalizedRmse.toFixed(6)} | `
      + `${raw.footer.normalizedRmse.toFixed(6)} | `
      + `${adjusted.fullFrame.normalizedRmse.toFixed(6)} | `
      + `${adjusted.bodyContent.normalizedRmse.toFixed(6)} | `
      + `${adjusted.header.normalizedRmse.toFixed(6)} | `
      + `${adjusted.footer.normalizedRmse.toFixed(6)} |`;
  }).join("\n");
  const priorities = report.v9PrioritizedRecommendations.map(
    (item) => `${item.priority}. ${item.action}\n   Check: ${item.executableCheck}`,
  ).join("\n\n");
  return `# G4 L3 TS006 Replay diagnostic comparison v9\n\n`
    + `This is an acceptance-neutral engineering comparison between the proposed Replay segment in the new raw Flash capture and the existing JavaScript diagnostic compositor v8. It is not a baseline, promoted candidate, coverage result, ledger result, or strict evidence.\n\n`
    + `## Result\n\n`
    + `- Compared frames: ${report.summary.comparedFrames}\n`
    + `- Proposed mapping: capture ordinal = source local frame + 162 (tentative, not trace-bound)\n`
    + `- Source cursor setting: ${report.summary.cursorExclusion.captureConfiguration}; no pixel mask was applied\n`
    + `- Next button: ${report.summary.nextButtonNeutral.allSelectedFramesNeutral ? "neutral-orange in all selected source and implementation frames" : "not verified neutral"}\n`
    + `- Source left-stage offsets: ${report.summary.sourceStageRegistration.distinctLeftOffsetsPixels.join(", ")} px\n`
    + `- Strict acceptance effect: **none**\n\n`
    + `## Regional RMSE\n\n`
    + `Raw columns compare fixed 800x600 coordinates. Registered columns shift only the source's detected leading black inset and compare the common visible width; they are diagnostic and cannot be used as acceptance metrics.\n\n`
    + `| Local frame | Capture ordinal | Source left inset | Raw full | Raw body | Raw header | Raw footer | Registered full | Registered body | Registered header | Registered footer |\n`
    + `|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n`
    + `## v9 priorities\n\n${priorities}\n\n`
    + `## Boundary\n\n${report.unresolved.map((item) => `- ${item}`).join("\n")}\n`;
}

export async function buildG4L3Ts006ReplayDiagnosticComparisonV9() {
  const sourceManifestPath = `${SOURCE_DIRECTORY}/capture-manifest.json`;
  const implementationManifestPath = `${IMPLEMENTATION_DIRECTORY}/capture-manifest.json`;
  const [
    {bytes: sourceManifestBytes, value: source},
    {bytes: implementationManifestBytes, value: implementation},
  ] = await Promise.all([
    readJson(sourceManifestPath),
    readJson(implementationManifestPath),
  ]);
  validateReplayDiagnosticInputs({source, implementation});

  const comparisons = [];
  for (const pair of REPLAY_DIAGNOSTIC_FRAME_PAIRS) {
    const sourceFrame = source.frames[pair.captureOrdinal - 1];
    const implementationFrame = implementation.captured.find(
      (item) => item.frame === pair.sourceLocalFrame,
    );
    invariant(sourceFrame?.ordinal === pair.captureOrdinal, "source frame lookup drifted");
    invariant(implementationFrame, "implementation frame lookup drifted");
    const sourceFile = `${SOURCE_DIRECTORY}/${sourceFrame.file}`;
    const implementationFile = `${IMPLEMENTATION_DIRECTORY}/${implementationFrame.file}`;
    const [
      {png: sourcePng},
      {png: implementationPng},
    ] = await Promise.all([
      readBoundPng(sourceFile, sourceFrame.sha256),
      readBoundPng(implementationFile, implementationFrame.sha256),
    ]);
    const sourceStageLeftOffsetPixels = detectLeftStageOffset(sourcePng);
    const rawFixedCoordinates = {};
    const stageRegisteredDiagnostic = {};
    for (const [regionId, region] of Object.entries(REPLAY_DIAGNOSTIC_REGIONS)) {
      rawFixedCoordinates[regionId] =
        compareRgbRegion(sourcePng, implementationPng, region);
      stageRegisteredDiagnostic[regionId] = compareRgbRegion(
        sourcePng,
        implementationPng,
        region,
        {sourceOffsetX: sourceStageLeftOffsetPixels},
      );
    }
    comparisons.push({
      ...pair,
      mappingStatus: "operator-proposed-tentative-diagnostic-not-trace-bound",
      sourceFile,
      sourceSha256: sourceFrame.sha256,
      implementationFile,
      implementationSha256: implementationFrame.sha256,
      sourceStageLeftOffsetPixels,
      rmse: {rawFixedCoordinates, stageRegisteredDiagnostic},
      nextButton: {
        source: classifyNextButtonState(sourcePng, {
          stageOffsetX: sourceStageLeftOffsetPixels,
        }),
        implementation: classifyNextButtonState(implementationPng),
      },
    });
  }

  const registrationOffsets = [
    ...new Set(comparisons.map((item) => item.sourceStageLeftOffsetPixels)),
  ].sort((left, right) => left - right);
  const regionSummary = {
    rawFixedCoordinates: summarizeRegions(comparisons, "rawFixedCoordinates"),
    stageRegistered: summarizeRegions(comparisons, "stageRegisteredDiagnostic"),
  };
  const allSelectedFramesNeutral = comparisons.every(
    (item) =>
      item.nextButton.source.state === "neutral-orange"
      && item.nextButton.implementation.state === "neutral-orange",
  );
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-replay-diagnostic-comparison-v9",
    animationId: ANIMATION_ID,
    classification: "acceptance-neutral-deterministic-engineering-comparison",
    authority: {
      sourceCapture: "raw-unpromoted-runtime-diagnostic",
      sourceReplayMapping: "operator-proposed-tentative-not-trace-bound",
      implementation: "existing-javascript-diagnostic-compositor-v8",
      originalRuntimeBaselineClaimed: false,
      implementationCandidatePromoted: false,
      coverageChanged: false,
      ledgerChanged: false,
      visualParityClaimed: false,
      strictAcceptanceEffect: "none",
    },
    sourceReplaySegment: {
      firstCaptureOrdinal: 163,
      lastCaptureOrdinal: 290,
      proposedFirstSourceLocalFrame: 1,
      proposedLastSourceLocalFrame: 128,
      mappingFormula: "captureOrdinal = sourceLocalFrame + 162",
      mappingAuthorityClaimed: false,
      traceBound: false,
    },
    implementationIdentity: {
      iteration: "v8",
      frameDomain: implementation.frameDomainId,
      scenario: implementation.scenario,
      language: implementation.language,
      seed: implementation.seed,
      requirementId: implementation.requirementId,
      traceId: implementation.traceId,
      entryStateSha256: implementation.entryStateSha256,
    },
    regionContract: REPLAY_DIAGNOSTIC_REGIONS,
    bindings: {
      sourceCaptureManifest: {
        path: sourceManifestPath,
        bytes: sourceManifestBytes.length,
        sha256: sha256(sourceManifestBytes),
      },
      implementationCaptureManifest: {
        path: implementationManifestPath,
        bytes: implementationManifestBytes.length,
        sha256: sha256(implementationManifestBytes),
      },
      generator: {
        path: portable(path.relative(ROOT, SCRIPT_PATH)),
        sha256: sha256(await readFile(SCRIPT_PATH)),
      },
    },
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      regions: regionSummary,
      sourceStageRegistration: {
        detection:
          "count contiguous leading columns whose pixels are at least 98 percent RGB <= 5",
        distinctLeftOffsetsPixels: registrationOffsets,
        stableAcrossSelectedFrames: registrationOffsets.length === 1,
        acceptanceUse: "none-diagnostic-normalization-only",
      },
      cursorExclusion: {
        captureConfiguration: source.configuration.cursor,
        verifiedFromCaptureManifest: source.configuration.cursor === "excluded",
        cursorPixelMaskApplied: false,
        fullFramePixelsRetained: true,
        note:
          "The capture tool excluded the pointer before PNG creation; this report does not hide any image region.",
      },
      nextButtonNeutral: {
        probe: NEXT_BUTTON_NEUTRAL_PROBE,
        allSelectedFramesNeutral,
        sourceNeutralFrames: comparisons.filter(
          (item) => item.nextButton.source.state === "neutral-orange",
        ).length,
        implementationNeutralFrames: comparisons.filter(
          (item) => item.nextButton.implementation.state === "neutral-orange",
        ).length,
        selectedFrames: comparisons.length,
        acceptanceUse: "heuristic-diagnostic-only",
      },
      implementationBrowserCaptureClean: true,
      strictAcceptanceEffect: "none",
    },
    v9PrioritizedRecommendations: recommendations(
      comparisons,
      registrationOffsets,
      regionSummary,
    ),
    unresolved: [
      "The proposed capture-ordinal to source-local-frame mapping is not trace-bound and is not source-frame authority.",
      "The source's whole-stage left registration changes within the proposed segment; raw fixed-coordinate RMSE therefore combines capture/runtime registration with candidate differences.",
      "Stage-registered RMSE discards the clipped rightmost source width and is diagnostic only, never an acceptance metric.",
      "This ten-frame spot comparison does not establish full-frame coverage, authoritative baseline, audio timing/listening, Spanish behavior, independent human review, Owner acceptance, or strict completion.",
    ],
    strictAcceptanceEffect: "none",
  };
  return {report, markdown: markdown(report)};
}

export async function writeG4L3Ts006ReplayDiagnosticComparisonV9({check = false} = {}) {
  const {report, markdown: markdownBytes} =
    await buildG4L3Ts006ReplayDiagnosticComparisonV9();
  const jsonBytes = `${JSON.stringify(report, null, 2)}\n`;
  if (check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(projectPath(REPORT_JSON), "utf8"),
      readFile(projectPath(REPORT_MARKDOWN), "utf8"),
    ]);
    invariant(existingJson === jsonBytes, `${REPORT_JSON} is stale`);
    invariant(existingMarkdown === markdownBytes, `${REPORT_MARKDOWN} is stale`);
  } else {
    await Promise.all([
      writeFile(projectPath(REPORT_JSON), jsonBytes),
      writeFile(projectPath(REPORT_MARKDOWN), markdownBytes),
    ]);
  }
  return report;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  writeG4L3Ts006ReplayDiagnosticComparisonV9(parseArguments(process.argv.slice(2)))
    .then((report) => {
      console.log(JSON.stringify(report.summary, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
