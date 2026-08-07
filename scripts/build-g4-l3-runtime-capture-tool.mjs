#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, readFile, rename, rmdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE = path.join(ROOT, "tools/g4-l3-runtime-capture/CaptureMain.swift");
const TOOL_ROOT = path.join(ROOT, "work/g4-l3-runtime-capture-tool");
const APP_NAME = "HELP Math Runtime Capture.app";
const APP = path.join(TOOL_ROOT, APP_NAME);
const OUTPUT = path.join(APP, "Contents/MacOS/g4-l3-runtime-capture");
const INFO_PLIST = path.join(APP, "Contents/Info.plist");
const BUNDLE_IDENTIFIER = "ai.helpmath.g4l3.runtime-capture";
const REPORT_JSON = path.join(ROOT, "reports/g4-l3-runtime-capture-tool-readiness.json");
const REPORT_MD = path.join(ROOT, "reports/g4-l3-runtime-capture-tool-readiness.md");

function invariant(condition, message) { if (!condition) throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function pretty(value) { return `${JSON.stringify(value, null, 2)}\n`; }

async function bind(file) {
  const metadata = await lstat(file);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${file} must be a regular file`);
  const bytes = await readFile(file);
  return {path: path.relative(ROOT, file), bytes: bytes.length, sha256: sha256(bytes)};
}

async function atomicWrite(target, contents) {
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, contents, {flag: "wx"});
  await rename(temporary, target);
}

function infoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key><string>HELP Math Runtime Capture</string>
  <key>CFBundleExecutable</key><string>g4-l3-runtime-capture</string>
  <key>CFBundleIdentifier</key><string>${BUNDLE_IDENTIFIER}</string>
  <key>CFBundleName</key><string>HELP Math Runtime Capture</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSUIElement</key><true/>
  <key>NSScreenCaptureUsageDescription</key><string>Capture authorized HELP Math Flash runtime frames for source-faithful migration validation.</string>
  <key>NSAudioCaptureUsageDescription</key><string>Capture authorized HELP Math Flash runtime system audio for source-faithful migration validation.</string>
</dict>
</plist>
`;
}

export async function buildRuntimeCaptureTool({check = false} = {}) {
  await mkdir(TOOL_ROOT, {recursive: true});
  let executablePath = OUTPUT;
  if (!check) {
    const buildRoot = path.join(TOOL_ROOT, `.app-build-${process.pid}`);
    const temporaryApp = path.join(buildRoot, APP_NAME);
    const temporary = path.join(temporaryApp, "Contents/MacOS/g4-l3-runtime-capture");
    await mkdir(path.dirname(temporary), {recursive: true});
    await writeFile(path.join(temporaryApp, "Contents/Info.plist"), infoPlist(), {flag: "wx"});
    const argumentsList = [
      "-O",
      "-parse-as-library", SOURCE, "-o", temporary,
      "-framework", "AppKit",
      "-framework", "ScreenCaptureKit",
      "-framework", "AVFoundation",
      "-framework", "CoreImage",
      "-framework", "CoreMedia",
      "-framework", "CryptoKit",
      "-framework", "ImageIO",
      "-framework", "UniformTypeIdentifiers",
    ];
    await execFileAsync("/usr/bin/swiftc", argumentsList, {cwd: ROOT, encoding: "utf8", timeout: 120_000});
    await chmod(temporary, 0o500);
    await execFileAsync("/usr/bin/codesign", ["--force", "--sign", "-", "--identifier", BUNDLE_IDENTIFIER, temporaryApp], {cwd: ROOT, encoding: "utf8", timeout: 30_000});
    const existing = await lstat(APP).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (existing) {
      invariant(existing.isDirectory() && !existing.isSymbolicLink(), "existing capture app must be a real directory");
      const oldExecutable = await bind(OUTPUT);
      const supersededRoot = path.join(TOOL_ROOT, "superseded");
      await mkdir(supersededRoot, {recursive: true});
      await rename(APP, path.join(supersededRoot, `${oldExecutable.sha256}--${APP_NAME}`));
    }
    await rename(temporaryApp, APP);
    await rmdir(buildRoot);
    executablePath = OUTPUT;
  }
  const help = await execFileAsync(executablePath, ["--help"], {encoding: "utf8", timeout: 10_000});
  invariant(/lossless PNG frames/u.test(help.stdout) && /never launches Flash/u.test(help.stdout), "capture tool help boundary drifted");
  const source = await bind(SOURCE);
  const generator = await bind(SCRIPT_PATH);
  const executable = await bind(executablePath);
  const appInfo = await bind(INFO_PLIST);
  invariant(await readFile(INFO_PLIST, "utf8") === infoPlist(), "capture app Info.plist drifted");
  const signature = await execFileAsync("/usr/bin/codesign", ["--display", "--verbose=4", APP], {encoding: "utf8", timeout: 10_000});
  const compiler = await execFileAsync("/usr/bin/swiftc", ["--version"], {encoding: "utf8", timeout: 10_000});
  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-screen-capture-kit-tool-readiness",
    generator,
    source,
    compiler: {path: "/usr/bin/swiftc", version: compiler.stdout.trim()},
    appBundle: {
      path: path.relative(ROOT, APP),
      bundleIdentifier: BUNDLE_IDENTIFIER,
      infoPlist: {...appInfo, path: path.relative(ROOT, INFO_PLIST)},
      signature: "ad-hoc-local-identity-only-not-evidence-trust",
      codesignInspection: signature.stderr.trim(),
    },
    executable: {...executable, path: path.relative(ROOT, OUTPUT), mode: "0500"},
    capabilities: {
      screenCaptureKitWindowCapture: true,
      screenCaptureKitDisplayExactApplicationCapture: true,
      waitForExactProcessFirstWindowFailClosed: true,
      waitForExactProcessFirstWindowMinimumSizeFilter: true,
      losslessPngPerCompleteFrame: true,
      framePtsAndSha256Manifest: true,
      optimizedCheckedCompilation: true,
      singleWindowShadowFramingExcluded: true,
      stableNativeStageEdgeAlphaOccupancyMask: true,
      nativeStageEdgeAlphaValueJitterTolerance: 2,
      nativeOutputSize: {width: 800, height: 600},
      configuredFps: 12,
      systemAudio: {
        codec: "ALAC",
        sampleRate: 48000,
        channels: 2,
        lossless: true,
        sourceBufferPayloadDiagnostics: true,
      },
      noReplaceOutput: true,
      appKitWindowServerInitialization: true,
      stableMacosAppBundleIdentity: true,
    },
    execution: {
      helpOnlyExecuted: true,
      screenReadAttempted: false,
      flashProjectorLaunched: false,
      swfOpened: false,
      inputInjected: false,
      runtimeSessionExecuted: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  const report = {...reportWithoutFingerprint, reportFingerprintSha256: sha256(Buffer.from(stable(reportWithoutFingerprint)))};
  const markdown = `# G4 L3 Runtime Capture Tool Readiness\n\nA local ScreenCaptureKit tool compiles and its help-only boundary passes. It is designed to wait fail-closed for the exact Projector PID's first shareable window at or above an explicit minimum size, capture that exact application through the selected display while binding the matched window, exclude window shadow framing, and reject any frame whose opaque/non-opaque occupancy mask changes or contains transparency outside the native stage-edge mask. The mask is limited to the three-pixel right and bottom window edges plus the 19-pixel bottom-corner transition retained by the y=28 native-stage crop; every other output pixel must remain fully opaque. Native-edge alpha values may differ from the first frame by at most two 8-bit levels, and the maximum observed delta is recorded. It then writes one lossless PNG per complete 800×600 frame at 12 FPS, frame PTS/SHA-256 metadata, and 48 kHz stereo Apple Lossless system audio. Before encoding, it records the total ScreenCaptureKit audio payload bytes and the exact count of non-zero payload bytes so a silent source buffer can be distinguished from a later writer or container defect. It never falls back to an unfiltered display.\n\nNo screen content was read, Flash was not launched, no SWF was opened, and no runtime or acceptance evidence is established.\n`;
  if (check) {
    invariant(await readFile(REPORT_JSON, "utf8") === pretty(report), "capture tool JSON report is stale");
    invariant(await readFile(REPORT_MD, "utf8") === markdown, "capture tool Markdown report is stale");
    return {action: "verified", report};
  }
  await atomicWrite(REPORT_JSON, pretty(report));
  await atomicWrite(REPORT_MD, markdown);
  return {action: "written", report};
}

async function main() {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === "--check"), "Usage: build-g4-l3-runtime-capture-tool.mjs [--check]");
  const result = await buildRuntimeCaptureTool({check: args[0] === "--check"});
  process.stdout.write(`${result.action}: lossless 800x600@12fps PNG + ALAC capture tool; help only; 0 Flash launches.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
