import {mkdir, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  fileIdentity,
  inspectActionScript,
  inspectCanvasExport,
  invariant,
  inventoryDirectory,
  parseSwfmillXml,
  portable,
  publicMemberProjection,
  runCommand,
  stableJson,
  validateObservedStructure,
  writeExclusive,
} from "./core.mjs";

const FFDEC_FORMATS =
  "frame:canvas,sprite:canvas,shape:canvas,morphshape:canvas,button:svg_combined,script:as";
const FFDEC_ITEMS = "frame,sprite,shape,morphshape,button,script,image,sound";

function redactCommand(commandResult, projectRoot) {
  const prefix = `${projectRoot}${path.sep}`;
  return {
    ...commandResult,
    args: commandResult.args.map((value) => value.startsWith(prefix)
      ? portable(path.relative(projectRoot, value))
      : value),
  };
}

function expectedTimelinePaths(canvasInspection, member) {
  const expected = [{
    timelineId: "root",
    objectId: null,
    frameCount: member.expectedStructure.rootFrameCount,
    htmlPath: "frames/frames.html",
  }];
  for (const sprite of member.expectedStructure.nestedSprites) {
    const pattern = new RegExp(
      `^sprites/DefineSprite_${sprite.objectId}(?:_[^/]*)?/frames\\.html$`,
    );
    const matches = canvasInspection.canvasHtmlFiles.filter((filePath) => pattern.test(filePath));
    invariant(matches.length === 1,
      `${member.animationId}: expected one Canvas timeline for sprite ${sprite.objectId}, observed ${matches.length}`);
    expected.push({
      timelineId: `sprite-${sprite.objectId}`,
      objectId: sprite.objectId,
      frameCount: sprite.frameCount,
      htmlPath: matches[0],
    });
  }
  invariant(canvasInspection.canvasHtmlFiles.includes("frames/frames.html"),
    `${member.animationId}: root Canvas timeline missing`);
  return expected;
}

function captureFrameIndexes(frameCount) {
  return [...new Set([0, Math.floor((frameCount - 1) / 2), frameCount - 1])]
    .sort((left, right) => left - right);
}

async function captureCanvasTimelines({canvasRoot, capturesRoot, timelines}) {
  const {chromium} = await import("playwright");
  const browser = await chromium.launch({headless: true});
  const records = [];
  try {
    for (const timeline of timelines) {
      const pageErrors = [];
      const consoleErrors = [];
      const page = await browser.newPage({viewport: {width: 900, height: 700}});
      page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      await page.addInitScript(() => {
        Object.defineProperty(window, "setInterval", {
          value: () => 0,
          writable: false,
          configurable: false,
        });
      });
      const htmlFile = path.join(canvasRoot, timeline.htmlPath);
      await page.goto(pathToFileURL(htmlFile).href, {waitUntil: "load"});
      await page.waitForSelector("#myCanvas", {state: "attached"});
      const callable = await page.evaluate(() => ({
        drawFrame: typeof window.drawFrame === "function",
        frameGlobal: Object.prototype.hasOwnProperty.call(window, "frame"),
      }));
      invariant(callable.drawFrame && callable.frameGlobal,
        `${timeline.timelineId}: FFDec Canvas runtime is not callable`);
      for (const frameIndex of captureFrameIndexes(timeline.frameCount)) {
        const pixels = await page.evaluate((selectedFrame) => {
          window.frame = selectedFrame;
          window.time = 0;
          window.drawFrame();
          const canvas = document.getElementById("myCanvas");
          const context = canvas.getContext("2d");
          const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let nonTransparentPixels = 0;
          let pixelsDifferentFromFirst = 0;
          const first = `${data[0]},${data[1]},${data[2]},${data[3]}`;
          const colors = new Set();
          for (let offset = 0; offset < data.length; offset += 4) {
            if (data[offset + 3] !== 0) nonTransparentPixels += 1;
            const color = `${data[offset]},${data[offset + 1]},${data[offset + 2]},${data[offset + 3]}`;
            if (color !== first) pixelsDifferentFromFirst += 1;
            if (colors.size < 4096) colors.add(color);
          }
          return {
            width: canvas.width,
            height: canvas.height,
            nonTransparentPixels,
            pixelsDifferentFromFirst,
            distinctColorCountCappedAt4096: colors.size,
          };
        }, frameIndex);
        const outputName = `${timeline.timelineId}-frame-${String(frameIndex + 1).padStart(4, "0")}.png`;
        const screenshotPath = path.join(capturesRoot, outputName);
        await page.locator("#myCanvas").screenshot({path: screenshotPath});
        records.push({
          timelineId: timeline.timelineId,
          objectId: timeline.objectId,
          frameIndexZeroBased: frameIndex,
          frameNumberOneBased: frameIndex + 1,
          outputPath: portable(path.relative(path.dirname(capturesRoot), screenshotPath)),
          output: await fileIdentity(screenshotPath),
          pixels,
        });
      }
      await page.close();
      invariant(pageErrors.length === 0,
        `${timeline.timelineId}: browser page errors: ${pageErrors.join(" | ")}`);
      invariant(consoleErrors.length === 0,
        `${timeline.timelineId}: browser console errors: ${consoleErrors.join(" | ")}`);
    }
  } finally {
    await browser.close();
  }
  return records;
}

async function toolVersionFromLog(filePath, pattern, label) {
  const text = await readFile(filePath, "utf8");
  const match = text.match(pattern);
  invariant(match, `${label}: version string missing`);
  return match[0];
}

async function runFfdecMember({member, backendRoot, projectRoot, toolVersions}) {
  const memberRoot = path.join(backendRoot, member.animationId);
  const logsRoot = path.join(memberRoot, "logs");
  const swfmillRoot = path.join(memberRoot, "swfmill");
  const canvasRoot = path.join(memberRoot, "canvas");
  const pcodeRoot = path.join(memberRoot, "pcode");
  const capturesRoot = path.join(memberRoot, "captures");
  await Promise.all([
    mkdir(logsRoot, {recursive: true}),
    mkdir(swfmillRoot, {recursive: true}),
    mkdir(capturesRoot, {recursive: true}),
  ]);

  const sourceBefore = await fileIdentity(member.physical.swfPath);
  invariant(sourceBefore.sha256 === member.source.sha256,
    `${member.animationId}: source drifted before backend run`);

  const swfmillXmlPath = path.join(swfmillRoot, "source.xml");
  const swfmillCommand = await runCommand({
    command: "swfmill",
    args: ["-n", "swf2xml", member.physical.swfPath, swfmillXmlPath],
    cwd: projectRoot,
    stdoutPath: path.join(logsRoot, "swfmill.stdout.txt"),
    stderrPath: path.join(logsRoot, "swfmill.stderr.txt"),
    timeoutMs: 120_000,
  });
  invariant(swfmillCommand.success, `${member.animationId}: swfmill failed`);
  const observedStructure = validateObservedStructure(
    member,
    parseSwfmillXml(await readFile(swfmillXmlPath, "utf8")),
  );

  const canvasCommand = await runCommand({
    command: "ffdec",
    args: [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-timeout", "120",
      "-exportTimeout", "600",
      "-format", FFDEC_FORMATS,
      "-export", FFDEC_ITEMS,
      canvasRoot,
      member.physical.swfPath,
    ],
    cwd: projectRoot,
    stdoutPath: path.join(logsRoot, "ffdec-canvas.stdout.txt"),
    stderrPath: path.join(logsRoot, "ffdec-canvas.stderr.txt"),
    timeoutMs: 660_000,
  });
  invariant(canvasCommand.success, `${member.animationId}: FFDec Canvas export failed`);

  const pcodeCommand = await runCommand({
    command: "ffdec",
    args: [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-timeout", "120",
      "-exportTimeout", "600",
      "-format", "script:pcode",
      "-export", "script",
      pcodeRoot,
      member.physical.swfPath,
    ],
    cwd: projectRoot,
    stdoutPath: path.join(logsRoot, "ffdec-pcode.stdout.txt"),
    stderrPath: path.join(logsRoot, "ffdec-pcode.stderr.txt"),
    timeoutMs: 660_000,
  });
  invariant(pcodeCommand.success, `${member.animationId}: FFDec P-code export failed`);

  const canvas = await inspectCanvasExport(canvasRoot);
  const timelines = expectedTimelinePaths(canvas, member);
  const timelineHtmlCount = timelines.length;
  invariant(timelineHtmlCount === 1 + member.expectedStructure.nestedSprites.length,
    `${member.animationId}: incomplete Canvas frame-domain coverage`);
  const actionScript = await inspectActionScript(
    path.join(canvasRoot, "scripts"),
    path.join(pcodeRoot, "scripts"),
  );
  invariant(actionScript.sourceScriptFileCount === member.expectedStructure.scriptLocations,
    `${member.animationId}: FFDec source script count drifted`);
  invariant(actionScript.pcodeScriptFileCount === member.expectedStructure.scriptLocations,
    `${member.animationId}: FFDec P-code script count drifted`);
  invariant(actionScript.unclassifiedOrRejectedLocationCount === 0,
    `${member.animationId}: AVM1 location classifier found an unrecognized script`);
  const captures = await captureCanvasTimelines({
    canvasRoot,
    capturesRoot,
    timelines: [
      timelines[0],
      timelines.slice(1).sort((left, right) => right.frameCount - left.frameCount)[0],
    ].filter(Boolean),
  });
  const sourceAfter = await fileIdentity(member.physical.swfPath);
  invariant(sourceAfter.bytes === sourceBefore.bytes &&
    sourceAfter.sha256 === sourceBefore.sha256,
  `${member.animationId}: source SWF changed during backend run`);

  const unsupportedLedger = [
    {
      id: "avm1-not-executed",
      occurrences: member.expectedStructure.scriptLocations,
      disposition: "FFDec exports source/P-code for classification but Canvas output does not execute AVM1.",
    },
    {
      id: "embedded-stream-audio-not-integrated",
      occurrences: observedStructure.counts.embeddedSoundTags,
      disposition: "Audio bytes may be extracted, but Canvas playback and nested-frame synchronization are not generated.",
    },
    {
      id: "modern-host-contract-not-generated",
      occurrences: actionScript.features
        .filter((feature) => ["button-event-handler", "host-level-contract"].includes(feature.id))
        .reduce((sum, feature) => sum + feature.occurrences, 0),
      disposition: "Legacy _level0/_root/button calls require an allowlisted adapter to the modern My Lesson shell.",
    },
    ...actionScript.features
      .filter((feature) => feature.bucket === "manual-or-specialized-adapter")
      .map((feature) => ({
        id: `avm1-${feature.id}`,
        occurrences: feature.occurrences,
        disposition: "Static occurrence only; runtime reachability unresolved; specialized lowering required.",
      })),
  ];
  const loweringPlanPath = path.join(memberRoot, "avm1-lowering-plan.json");
  const loweringPlan = {
    schemaVersion: 1,
    animationId: member.animationId,
    sourceSha256: member.source.sha256,
    locationCount: actionScript.sourceScriptFileCount,
    locationClassificationCounts: actionScript.locationClassificationCounts,
    loweringCounts: actionScript.loweringCounts,
    pageSpecificDynamicLocationCount: actionScript.pageSpecificDynamicLocationCount,
    unclassifiedOrRejectedLocationCount: actionScript.unclassifiedOrRejectedLocationCount,
    locations: actionScript.sourceRecords.map((record) => ({
      path: record.path,
      sourceSha256: record.sha256,
      category: record.classification.category,
      lowering: record.classification.lowering,
      payload: record.classification.payload,
    })),
    policies: {
      legacyCourseShellRecreated: false,
      modernMyLessonHostRetained: true,
      arbitraryEvalEmitted: false,
      randomLowering: "injected-seeded-rng-only-for-the-exact-allowlisted-two-choice-pattern",
      unknownScriptDisposition: "fail-closed",
      runtimeReachabilityClaim: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  await writeExclusive(loweringPlanPath, stableJson(loweringPlan));
  const loweringPlanIdentity = await fileIdentity(loweringPlanPath);

  const manifestWithoutInventory = {
    schemaVersion: 1,
    backend: {
      id: "ffdec-canvas",
      family: "decompiler-and-static-canvas-exporter",
      repository: "https://github.com/jindrapetrik/jpexs-decompiler",
      license: "GPL-3.0",
      versions: toolVersions,
      visualRuntimeDependency: "generated-canvas-helper",
      retainsOriginalSwfAtRuntime: false,
    },
    status: "visual-export-success",
    member: publicMemberProjection(member, projectRoot),
    sourceCustody: {before: sourceBefore, after: sourceAfter, unchanged: true},
    commands: {
      swfmill: redactCommand(swfmillCommand, projectRoot),
      canvasExport: redactCommand(canvasCommand, projectRoot),
      pcodeExport: redactCommand(pcodeCommand, projectRoot),
    },
    observedStructure,
    generatedVisuals: {
      ...canvas,
      expectedTimelineHtmlCount: timelineHtmlCount,
      timelineCoverage: timelines,
      captureCount: captures.length,
      captures,
      headlessExecutionSucceeded: true,
    },
    actionScript,
    avm1LoweringPlan: {
      path: portable(path.relative(memberRoot, loweringPlanPath)),
      ...loweringPlanIdentity,
      generated: true,
      executableBehaviorGenerated: false,
    },
    compilerEffects: {
      visualDrawingCodeGenerated: true,
      allKnownFrameDomainsMaterialized: true,
      boundedAvm1LoweringPlanGenerated: true,
      avm1BehaviorCompiled: false,
      buttonBehaviorCompiled: false,
      streamAudioPlaybackCompiled: false,
      externalAudioBound: false,
      modernMyLessonHostAdapterGenerated: false,
      arbitraryEvalEmitted: false,
    },
    unsupportedLedger,
    evidenceBoundary: {
      machineStaticAndHeadlessCanvasEvidenceOnly: true,
      runtimeReachabilityClaim: false,
      visualFidelityClaim: false,
      audioSynchronizationClaim: false,
      currentJavaScriptImplementationClaim: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  const inventory = await inventoryDirectory(memberRoot, {exclude: ["manifest.json"]});
  const manifest = {...manifestWithoutInventory, outputInventory: inventory};
  await writeExclusive(path.join(memberRoot, "manifest.json"), stableJson(manifest));
  return manifest;
}

export async function buildFfdecBackend({
  corpusValidation,
  outputRoot,
  projectRoot = PROJECT_ROOT,
}) {
  const backendRoot = path.join(outputRoot, "ffdec");
  await mkdir(backendRoot, {recursive: false});
  const toolLogs = path.join(backendRoot, "tool-logs");
  await mkdir(toolLogs, {recursive: true});
  const ffdecHelp = await runCommand({
    command: "ffdec",
    args: ["-help", "export"],
    cwd: projectRoot,
    stdoutPath: path.join(toolLogs, "ffdec-help.stdout.txt"),
    stderrPath: path.join(toolLogs, "ffdec-help.stderr.txt"),
    timeoutMs: 60_000,
  });
  invariant(ffdecHelp.success, "FFDec help/version preflight failed");
  const swfmillVersion = await runCommand({
    command: "swfmill",
    args: ["--version"],
    cwd: projectRoot,
    stdoutPath: path.join(toolLogs, "swfmill-version.stdout.txt"),
    stderrPath: path.join(toolLogs, "swfmill-version.stderr.txt"),
    timeoutMs: 60_000,
  });
  invariant(swfmillVersion.success, "swfmill version preflight failed");
  const ffdecVersion = await toolVersionFromLog(
    path.join(toolLogs, "ffdec-help.stdout.txt"),
    /JPEXS Free Flash Decompiler v\.[^\r\n]+/,
    "FFDec",
  );
  const swfmillVersionText = await toolVersionFromLog(
    path.join(toolLogs, "swfmill-version.stderr.txt"),
    /swfmill\s+[^\r\n]+/,
    "swfmill",
  ).catch(async () => toolVersionFromLog(
    path.join(toolLogs, "swfmill-version.stdout.txt"),
    /swfmill\s+[^\r\n]+/,
    "swfmill",
  ));
  const toolVersions = {
    ffdec: ffdecVersion,
    swfmill: swfmillVersionText,
    node: process.version,
  };
  const manifests = [];
  for (const member of corpusValidation.members) {
    manifests.push(await runFfdecMember({member, backendRoot, projectRoot, toolVersions}));
  }
  const summary = {
    schemaVersion: 1,
    backendId: "ffdec-canvas",
    pilotId: corpusValidation.pilotId,
    memberCount: manifests.length,
    visualExportSuccessCount: manifests.filter((item) => item.status === "visual-export-success").length,
    visualDrawingCodeGeneratedCount: manifests.filter(
      (item) => item.compilerEffects.visualDrawingCodeGenerated,
    ).length,
    behaviorCompiledCount: manifests.filter(
      (item) => item.compilerEffects.avm1BehaviorCompiled,
    ).length,
    streamAudioPlaybackCompiledCount: manifests.filter(
      (item) => item.compilerEffects.streamAudioPlaybackCompiled,
    ).length,
    shellCount: 0,
    members: manifests.map((manifest) => ({
      animationId: manifest.member.animationId,
      status: manifest.status,
      generatedHtmlBytes: manifest.generatedVisuals.generatedHtmlBytes,
      timelineHtmlCount: manifest.generatedVisuals.expectedTimelineHtmlCount,
      headlessCaptureCount: manifest.generatedVisuals.captureCount,
      scriptLocations: manifest.actionScript.sourceScriptFileCount,
      opcodeOccurrences: manifest.actionScript.opcodeOccurrenceCount,
      manualFeatureOccurrences: manifest.actionScript.featureOccurrenceCountsByBucket[
        "manual-or-specialized-adapter"
      ] || 0,
      embeddedSoundTags: manifest.observedStructure.counts.embeddedSoundTags,
    })),
    outputInventory: await inventoryDirectory(backendRoot, {
      exclude: ["summary.json"],
    }),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  await writeExclusive(path.join(backendRoot, "summary.json"), stableJson(summary));
  return {backendRoot, manifests, summary};
}
