#!/usr/bin/env node

import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "course-g04-l09-gs-002";
const sourceReportRelative = `migrations/${animationId}/baseline/ffdec-root-frames.json`;
const visualDispositionRelative =
  `migrations/${animationId}/audit/bilingual-visual-source-disposition.json`;
const outputDirectoryRelative = `public/flash-assets/courses/${animationId}/root-frames`;
const sourceReportPath = path.join(projectRoot, sourceReportRelative);
const outputDirectory = path.join(projectRoot, outputDirectoryRelative);
const sourceSwfRelative =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf";
const sourceSwfSha256 = "41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15";
const expectedFrameCount = 10;
const expectedStage = Object.freeze({width: 800, height: 600});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function sha256File(filePath) {
  return sha256(await readFile(filePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature), `${label}: invalid PNG signature`);
  assert(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function buildExpectedManifest() {
  const [
    sourceReportBytes,
    visualDispositionBytes,
    generatorBytes,
    sourceSwfBytes,
  ] = await Promise.all([
    readFile(sourceReportPath),
    readFile(path.join(projectRoot, visualDispositionRelative)),
    readFile(scriptPath),
    readFile(path.join(projectRoot, sourceSwfRelative)),
  ]);
  const report = JSON.parse(sourceReportBytes.toString("utf8"));
  const visualDisposition = JSON.parse(visualDispositionBytes.toString("utf8"));
  assert(report.schemaVersion === 1, "FFDec root report schemaVersion must be 1");
  assert(report.animationId === animationId, "FFDec root report animationId mismatch");
  assert(report.status === "structural-baseline-only", "FFDec root report must remain structural-only");
  assert(
    report.authority?.kind === "swf-static-root-timeline-render",
    "FFDec root report authority kind mismatch",
  );
  assert(
    Array.isArray(report.authority?.limitations) &&
      report.authority.limitations.some((value) => /cannot by itself satisfy strict baseline/i.test(value)),
    "FFDec root report must state that it cannot satisfy strict baseline evidence",
  );
  assert(report.source?.swf === sourceSwfRelative, "FFDec root report source path mismatch");
  assert(report.source?.swfSha256 === sourceSwfSha256, "FFDec root report source hash mismatch");
  assert(sha256(sourceSwfBytes) === sourceSwfSha256, "preserved GS002 SWF hash mismatch");
  assert(report.runtime?.stage?.width === expectedStage.width, "FFDec root report stage width mismatch");
  assert(report.runtime?.stage?.height === expectedStage.height, "FFDec root report stage height mismatch");
  assert(report.runtime?.fps === 12, "FFDec root report FPS mismatch");
  assert(report.runtime?.frameCount === expectedFrameCount, "FFDec root report frame count mismatch");
  assert(Array.isArray(report.frames) && report.frames.length === expectedFrameCount, "FFDec root report must list ten frames");
  assert(typeof report.archive?.root === "string" && report.archive.root, "FFDec root report archive path missing");
  assert(
    visualDisposition.schemaVersion === 1 &&
      visualDisposition.evidenceType === "source-shared-bilingual-visual-disposition" &&
      visualDisposition.animationId === animationId &&
      visualDisposition.status === "verified-root-source-shared-untranslated-visual",
    "GS002 root bilingual visual disposition identity or status changed",
  );
  assert(
    visualDisposition.generatedFrom?.sourceSwf?.path === sourceSwfRelative &&
      visualDisposition.generatedFrom?.sourceSwf?.sha256 === sourceSwfSha256,
    "GS002 root bilingual visual disposition source binding changed",
  );
  assert(
    JSON.stringify(
      visualDisposition.implementationDisposition?.rootFrameAdapter?.supportedLanguages,
    ) === JSON.stringify(["en", "es"]) &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.frameDomain === "root" &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.scenario === "root-standalone" &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.firstFrame === 1 &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.lastFrame === 10 &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.frameCount === 10 &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.status === "ready" &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.visualClassification ===
        "source-shared-untranslated-visual" &&
      visualDisposition.implementationDisposition?.rootFrameAdapter
        ?.renderSameSourcePixelsForBothLanguages === true &&
      visualDisposition.implementationDisposition?.rootFrameAdapter?.spanishTranslationSupplied ===
        false,
    "GS002 root bilingual visual disposition no longer permits exactly en/es root frames 1-10",
  );
  assert(
    JSON.stringify(
      visualDisposition.implementationDisposition?.sourceSharedRequirements,
    ) ===
      JSON.stringify([
        {
          requirementId: "req:root:root-standalone:es",
          frameDomainId: "root",
          scenario: "root-standalone",
          language: "es",
          firstFrame: 1,
          lastFrame: 10,
          frameCount: 10,
        },
      ]),
    "GS002 root bilingual visual disposition requirement scope changed",
  );
  assert(
    JSON.stringify(
      visualDisposition.implementationDisposition?.spriteCanvasAdapter?.supportedLanguages,
    ) === JSON.stringify(["en"]) &&
      visualDisposition.implementationDisposition?.spriteCanvasAdapter
        ?.spanishLeadInFrames1Through641Ready === false &&
      visualDisposition.implementationDisposition?.spriteCanvasAdapter?.frame642Ready === false &&
      visualDisposition.implementationDisposition?.spriteCanvasAdapter
        ?.frames643Through653Ready === false,
    "GS002 sprite-787 Spanish scope must remain blocked",
  );
  assert(
    Object.values(visualDisposition.acceptanceEffects || {}).length > 0 &&
      Object.values(visualDisposition.acceptanceEffects).every((value) => value === false) &&
      /^none;/.test(visualDisposition.strictAcceptanceEffect || ""),
    "GS002 root bilingual visual disposition must not satisfy acceptance",
  );

  const archiveDirectory = path.resolve(projectRoot, report.archive.root);
  assert(
    portable(path.relative(projectRoot, archiveDirectory)) === report.archive.root,
    "FFDec root report archive path must be project-relative",
  );
  const frames = [];
  for (let index = 0; index < expectedFrameCount; index += 1) {
    const frame = index + 1;
    const record = report.frames[index];
    assert(record?.frame === frame, `FFDec root report frame ${frame} is out of order`);
    assert(record.file === `${frame}.png`, `FFDec root report frame ${frame} filename mismatch`);
    const sourcePath = path.join(archiveDirectory, record.file);
    const bytes = await readFile(sourcePath);
    const dimensions = pngDimensions(bytes, `FFDec root frame ${frame}`);
    assert(sha256(bytes) === record.sha256, `FFDec root frame ${frame} hash mismatch`);
    assert(bytes.length === record.bytes, `FFDec root frame ${frame} byte count mismatch`);
    assert(dimensions.width === expectedStage.width, `FFDec root frame ${frame} width mismatch`);
    assert(dimensions.height === expectedStage.height, `FFDec root frame ${frame} height mismatch`);
    assert(record.width === dimensions.width, `FFDec root report frame ${frame} width mismatch`);
    assert(record.height === dimensions.height, `FFDec root report frame ${frame} height mismatch`);
    frames.push({
      frame,
      sourcePath,
      output: {
        frame,
        file: `frame-${String(frame).padStart(4, "0")}.png`,
        sha256: record.sha256,
        bytes: record.bytes,
        width: record.width,
        height: record.height,
      },
    });
  }

  return {
    frames,
    manifest: {
      schemaVersion: 1,
      evidenceType: "ffdec-structural-root-frame-implementation-assets",
      animationId,
      classification: "engineering-structural-inspection-not-strict-acceptance",
      authority: {
        kind: "ffdec-static-root-timeline-structural-render",
        tool: report.authority.tool,
        statement:
          "These PNGs are byte-identical copies of the hash-bound FFDec static root-timeline export and permit deterministic structural inspection in English and Spanish request contexts only.",
        authorityBoundary:
          "Root drawings 1-10 use the same untranslated source pixels for en/es. This is not Spanish translation, an original-runtime baseline, natural playback, AVM1 behavior, interaction, scoring, audio, Replay, RMSE parity, human review, owner acceptance, or strict completion.",
        actionScriptExecuted: false,
        originalRuntimeBaseline: false,
        naturalPlaybackClaimed: false,
      },
      generator: {
        path: portable(path.relative(projectRoot, scriptPath)),
        sha256: sha256(generatorBytes),
      },
      source: {
        swf: sourceSwfRelative,
        swfSha256: sourceSwfSha256,
      },
      sourceReport: {
        path: sourceReportRelative,
        sha256: sha256(sourceReportBytes),
        status: report.status,
        archive: report.archive.root,
      },
      visualDisposition: {
        path: visualDispositionRelative,
        sha256: sha256(visualDispositionBytes),
        status: visualDisposition.status,
        visualClassification: "source-shared-untranslated-visual",
        strictAcceptanceEffect: "none",
      },
      runtime: {
        stage: expectedStage,
        fps: 12,
        frameDomain: "root",
        frameCount: expectedFrameCount,
        frameNumbering: "one-indexed",
        supportedLanguages: ["en", "es"],
        visualLocalizationStatus: "source-shared-untranslated-visual",
        spanishTranslationSupplied: false,
        naturalPlaybackStopFrame: 1,
      },
      frames: frames.map(({output}) => output),
      strictAcceptanceEffect: "none",
    },
  };
}

async function checkOutput(expected) {
  const expectedManifestBytes = Buffer.from(`${JSON.stringify(expected.manifest, null, 2)}\n`);
  const actualNames = (await readdir(outputDirectory)).sort();
  const expectedNames = ["manifest.json", ...expected.frames.map(({output}) => output.file)].sort();
  assert(JSON.stringify(actualNames) === JSON.stringify(expectedNames), "root-frame output file set mismatch");
  const actualManifestBytes = await readFile(path.join(outputDirectory, "manifest.json"));
  assert(actualManifestBytes.equals(expectedManifestBytes), "root-frame manifest is stale");
  for (const {output} of expected.frames) {
    const outputBytes = await readFile(path.join(outputDirectory, output.file));
    assert(sha256(outputBytes) === output.sha256, `public root frame ${output.frame} hash mismatch`);
    assert(outputBytes.length === output.bytes, `public root frame ${output.frame} byte count mismatch`);
    const dimensions = pngDimensions(outputBytes, `public root frame ${output.frame}`);
    assert(
      dimensions.width === output.width && dimensions.height === output.height,
      `public root frame ${output.frame} dimensions mismatch`,
    );
  }
}

async function writeOutput(expected) {
  await mkdir(outputDirectory, {recursive: true});
  const expectedNames = new Set(["manifest.json", ...expected.frames.map(({output}) => output.file)]);
  const unexpected = (await readdir(outputDirectory)).filter((name) => !expectedNames.has(name));
  assert(unexpected.length === 0, `refusing to overwrite root-frame directory with unexpected files: ${unexpected.join(", ")}`);
  for (const {sourcePath, output} of expected.frames) {
    const target = path.join(outputDirectory, output.file);
    let currentHash = null;
    try {
      currentHash = await sha256File(target);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (currentHash !== output.sha256) await copyFile(sourcePath, target);
  }
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(expected.manifest, null, 2)}\n`,
    "utf8",
  );
  await checkOutput(expected);
}

function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const expected = await buildExpectedManifest();
  if (options.check) await checkOutput(expected);
  else await writeOutput(expected);
  process.stdout.write(
    `${JSON.stringify({animationId, action: options.check ? "verified" : "generated", frameCount: expected.frames.length, output: outputDirectoryRelative})}\n`,
  );
}

await main();
