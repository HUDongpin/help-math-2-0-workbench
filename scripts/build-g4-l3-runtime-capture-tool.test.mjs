import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import test from "node:test";

import {buildRuntimeCaptureTool} from "./build-g4-l3-runtime-capture-tool.mjs";

const execFileAsync = promisify(execFile);
const executable = "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture";

test("compiled ScreenCaptureKit tool is hash-bound and acceptance-neutral", async () => {
  const result = await buildRuntimeCaptureTool({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.report.capabilities.losslessPngPerCompleteFrame, true);
  assert.equal(result.report.capabilities.optimizedCheckedCompilation, true);
  assert.equal(result.report.capabilities.screenCaptureKitDisplayExactApplicationCapture, true);
  assert.equal(result.report.capabilities.waitForExactProcessFirstWindowFailClosed, true);
  assert.equal(result.report.capabilities.waitForExactProcessFirstWindowMinimumSizeFilter, true);
  assert.equal(result.report.capabilities.singleWindowShadowFramingExcluded, true);
  assert.equal(result.report.capabilities.stableNativeStageEdgeAlphaOccupancyMask, true);
  assert.equal(result.report.capabilities.nativeStageEdgeAlphaValueJitterTolerance, 2);
  assert.equal(result.report.capabilities.systemAudio.lossless, true);
  assert.equal(result.report.capabilities.systemAudio.sourceBufferPayloadDiagnostics, true);
  assert.equal(result.report.capabilities.appKitWindowServerInitialization, true);
  assert.equal(result.report.capabilities.stableMacosAppBundleIdentity, true);
  assert.equal(result.report.appBundle.bundleIdentifier, "ai.helpmath.g4l3.runtime-capture");
  assert.equal(result.report.execution.screenReadAttempted, false);
  assert.equal(result.report.execution.flashProjectorLaunched, false);
  assert.equal(result.report.acceptance.strictMigrationComplete, false);
});

test("capture tool help is non-executing and malformed capture fails closed", async () => {
  const help = await execFileAsync(executable, ["--help"], {encoding: "utf8"});
  assert.match(help.stdout, /never launches Flash/u);
  assert.match(help.stdout, /--display-id <id> --pid <process-id>/u);
  assert.match(help.stdout, /--wait-for-pid-seconds 120/u);
  assert.match(help.stdout, /--minimum-window-size 800x600/u);
  assert.match(help.stdout, /exact PID's first matching on-screen window at or above the required minimum size/u);
  assert.match(help.stdout, /never falls back/u);
  assert.match(help.stdout, /excludes window shadow framing/u);
  assert.match(help.stdout, /native stage-edge alpha mask/u);
  assert.match(help.stdout, /3px right\/bottom edges plus 19px bottom-corner bounds/u);
  assert.match(help.stdout, /alpha mask changes/u);
  await assert.rejects(() => execFileAsync(executable, ["--capture"], {encoding: "utf8"}), /requires exactly one of --window-id or --display-id/u);
  await assert.rejects(() => execFileAsync(executable, ["--capture", "--display-id", "1", "--output", "/tmp/nope", "--duration", "1"], {encoding: "utf8"}), /requires --pid/u);
  await assert.rejects(() => execFileAsync(executable, ["--capture", "--window-id", "1", "--pid", "1", "--output", "/tmp/nope", "--duration", "1", "--wait-for-pid-seconds", "1"], {encoding: "utf8"}), /requires display capture/u);
  await assert.rejects(() => execFileAsync(executable, ["--capture", "--display-id", "1", "--pid", "1", "--output", "/tmp/nope", "--duration", "1", "--minimum-window-size", "800x600"], {encoding: "utf8"}), /requires --wait-for-pid-seconds/u);
  await assert.rejects(() => execFileAsync(executable, ["--capture", "--display-id", "1", "--pid", "2147483647", "--output", "/tmp/nope", "--duration", "1", "--wait-for-pid-seconds", "0.1"], {encoding: "utf8"}), /did not expose a shareable window before the wait timeout/u);
});
