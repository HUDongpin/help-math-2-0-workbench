#!/usr/bin/env node

import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const sourceReportRelative = `migrations/${animationId}/baseline/ffdec-root-frames.json`;
const outputDirectoryRelative = `public/flash-assets/courses/${animationId}/root-frames`;
const sourceReportPath = path.join(projectRoot, sourceReportRelative);
const outputDirectory = path.join(projectRoot, outputDirectoryRelative);
const sourceSwfRelative =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf";
const sourceSwfSha256 =
  "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const expectedFrameCount = 50;
const expectedStage = Object.freeze({width: 800, height: 600});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(
    bytes.length >= 24 && bytes.subarray(0, 8).equals(signature),
    `${label}: invalid PNG signature`,
  );
  assert(bytes.toString("ascii", 12, 16) === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function buildExpectedManifest() {
  const [sourceReportBytes, generatorBytes, sourceSwfBytes] = await Promise.all([
    readFile(sourceReportPath),
    readFile(scriptPath),
    readFile(path.join(projectRoot, sourceSwfRelative)),
  ]);
  const report = JSON.parse(sourceReportBytes.toString("utf8"));
  assert(report.schemaVersion === 1, "FFDec root report schemaVersion must be 1");
  assert(report.animationId === animationId, "FFDec root report animationId mismatch");
  assert(
    report.status === "structural-baseline-only",
    "FFDec root report must remain structural-only",
  );
  assert(
    report.authority?.kind === "swf-static-root-timeline-render",
    "FFDec root report authority kind mismatch",
  );
  assert(
    Array.isArray(report.authority?.limitations) &&
      report.authority.limitations.some((value) =>
        /cannot by itself satisfy strict baseline/i.test(value),
      ),
    "FFDec report must preserve its strict-baseline limitation",
  );
  assert(report.source?.swf === sourceSwfRelative, "FFDec root report source path mismatch");
  assert(
    report.source?.swfSha256 === sourceSwfSha256,
    "FFDec root report source hash mismatch",
  );
  assert(sha256(sourceSwfBytes) === sourceSwfSha256, "preserved shell SWF hash mismatch");
  assert(report.runtime?.stage?.width === expectedStage.width, "stage width mismatch");
  assert(report.runtime?.stage?.height === expectedStage.height, "stage height mismatch");
  assert(report.runtime?.fps === 12, "FPS mismatch");
  assert(report.runtime?.frameCount === expectedFrameCount, "root frame count mismatch");
  assert(
    Array.isArray(report.frames) && report.frames.length === expectedFrameCount,
    "FFDec root report must list 50 frames",
  );
  assert(typeof report.archive?.root === "string" && report.archive.root, "archive path missing");

  const archiveDirectory = path.resolve(projectRoot, report.archive.root);
  assert(
    portable(path.relative(projectRoot, archiveDirectory)) === report.archive.root,
    "archive path must be project-relative",
  );

  const frames = [];
  for (let index = 0; index < expectedFrameCount; index += 1) {
    const frame = index + 1;
    const record = report.frames[index];
    assert(record?.frame === frame, `frame ${frame} is out of order`);
    assert(record.file === `${frame}.png`, `frame ${frame} filename mismatch`);
    const sourcePath = path.join(archiveDirectory, record.file);
    const bytes = await readFile(sourcePath);
    const dimensions = pngDimensions(bytes, `FFDec root frame ${frame}`);
    assert(sha256(bytes) === record.sha256, `frame ${frame} hash mismatch`);
    assert(bytes.length === record.bytes, `frame ${frame} byte count mismatch`);
    assert(
      dimensions.width === expectedStage.width && dimensions.height === expectedStage.height,
      `frame ${frame} dimensions mismatch`,
    );
    frames.push({
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
          "These PNGs are byte-identical copies of the hash-bound FFDec static root-timeline export and permit deterministic structural inspection only.",
        authorityBoundary:
          "This is not an original-runtime baseline, natural playback, ActionScript behavior, interaction, audio, localization, Replay, RMSE parity, human review, owner acceptance, or strict completion.",
        actionScriptExecuted: false,
        originalRuntimeBaseline: false,
        naturalPlaybackClaimed: false,
      },
      generator: {
        path: portable(path.relative(projectRoot, scriptPath)),
        sha256: sha256(generatorBytes),
      },
      source: {swf: sourceSwfRelative, swfSha256: sourceSwfSha256},
      sourceReport: {
        path: sourceReportRelative,
        sha256: sha256(sourceReportBytes),
        status: report.status,
        archive: report.archive.root,
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
  assert(JSON.stringify(actualNames) === JSON.stringify(expectedNames), "output file set mismatch");
  const actualManifestBytes = await readFile(path.join(outputDirectory, "manifest.json"));
  assert(actualManifestBytes.equals(expectedManifestBytes), "root-frame manifest is stale");
  for (const {output} of expected.frames) {
    const bytes = await readFile(path.join(outputDirectory, output.file));
    assert(sha256(bytes) === output.sha256, `public frame ${output.frame} hash mismatch`);
    assert(bytes.length === output.bytes, `public frame ${output.frame} byte count mismatch`);
  }
}

async function writeOutput(expected) {
  await mkdir(outputDirectory, {recursive: true});
  const expectedNames = new Set(["manifest.json", ...expected.frames.map(({output}) => output.file)]);
  const unexpected = (await readdir(outputDirectory)).filter((name) => !expectedNames.has(name));
  assert(
    unexpected.length === 0,
    `refusing to overwrite directory with unexpected files: ${unexpected.join(", ")}`,
  );
  for (const {sourcePath, output} of expected.frames) {
    await copyFile(sourcePath, path.join(outputDirectory, output.file));
  }
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(expected.manifest, null, 2)}\n`,
    "utf8",
  );
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((value) => value !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellRootFrameAssets({check = false} = {}) {
  const expected = await buildExpectedManifest();
  if (check) await checkOutput(expected);
  else await writeOutput(expected);
  return expected.manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  const manifest = await buildG4L3ShellRootFrameAssets(options);
  console.log(
    `${options.check ? "Verified" : "Built"} ${manifest.frames.length} structural root-frame assets for ${animationId}.`,
  );
}
