import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildReferenceMatrixReport,
  parseArguments,
  renderReferenceMatrixMarkdown,
  validateReferenceMatrixReport,
} from "./build-g4-l3-ruffle-reference-matrix.mjs";

test("builds a physically hash-bound forensic queue for all 40 canonical G4 L3 items", async () => {
  const report = await buildReferenceMatrixReport();
  assert.equal(report.queue.length, 40);
  assert.equal(report.summary.physicallyVerifiedSourceSwfs, 40);
  assert.equal(report.summary.native800x600Items, 40);
  assert.equal(report.summary.twelveFpsItems, 40);
  assert.equal(report.summary.rootFrameCountSum, 440);
  assert.equal(report.queue[0].animationId, "course-g04-l03-ir-001-341242cc");
  assert.equal(report.queue[0].source.swf.sha256, "2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4");
  assert.equal(report.queue.at(-1).animationId, "shell-course-g04-l03-index-local");
  assert.equal(report.queue.at(-1).runtime.rootFrameCount, 50);
  for (const item of report.queue) {
    assert.equal(item.assetId, `swf-${item.source.swf.sha256}`);
    assert.equal(item.source.swf.regularNonSymlinkFile, true);
    assert.equal(item.source.swf.copiedIntoWebPublic, false);
    assert.deepEqual(item.runtime.stage, {width: 800, height: 600, deviceScaleFactor: 1});
    assert.equal(item.runtime.fps, 12);
  }
});

test("binds the development-only network-denied route and exact local Ruffle distribution", async () => {
  const report = await buildReferenceMatrixReport();
  const boundary = report.localReferenceRuntime.routeBoundary;
  assert.equal(boundary.productionExposure, false);
  assert.equal(boundary.productWebPublicSwfCount, 0);
  assert.deepEqual(boundary.ruffleOptions, {allowNetworking: "none", allowScriptAccess: false, openUrlMode: "deny"});
  assert.equal(boundary.strictCaptureIdentityContract, false);
  assert.equal(boundary.implementationFiles.length, 4);
  for (const file of boundary.implementationFiles) assert.match(file.sha256, /^[a-f0-9]{64}$/);
  const ruffle = report.localReferenceRuntime.ruffleDistribution;
  assert.equal(ruffle.version, "0.4.1");
  assert.equal(ruffle.role, "forensic-reference-only");
  assert.match(ruffle.distributionSha256, /^[a-f0-9]{64}$/);
  assert.ok(ruffle.files.some((file) => file.path.endsWith("/ruffle.js")));
  assert.ok(ruffle.files.some((file) => file.path.endsWith(".wasm")));
});

test("fails closed on unsupported language, frame, domain, scenario, seed, and acceptance claims", async () => {
  const report = await buildReferenceMatrixReport();
  assert.equal(report.summary.staticInteractionCandidates, 38);
  assert.equal(report.summary.staticRandomCandidates, 12);
  assert.equal(report.summary.staticExternalDependencyCandidates, 3);
  assert.equal(report.summary.itemsWithEmbeddedAudioTags, 37);
  assert.equal(report.summary.deterministicRootFrameCaptureReady, 0);
  assert.equal(report.summary.deterministicNestedDomainCaptureReady, 0);
  assert.equal(report.summary.bilingualSwfEntryCaptureReady, 0);
  assert.equal(report.summary.scenarioOrSeedCaptureReady, 0);
  assert.equal(report.summary.authoritativeOriginalRuntimeBaselines, 0);
  assert.equal(report.summary.strictRmseBaselines, 0);
  assert.equal(report.summary.productionRuffleImplementations, 0);
  assert.equal(report.summary.strictMigrationCompletions, 0);
  for (const item of report.queue) {
    assert.equal(item.languageBoundary.pageLocaleChangesAuditUiOnly, true);
    assert.equal(item.languageBoundary.bilingualReferenceCaptureSupported, false);
    assert.equal(item.scenarioBoundary.frameSelectionSupported, false);
    assert.equal(item.scenarioBoundary.nestedFrameDomainSelectionSupported, false);
    assert.equal(item.scenarioBoundary.scenarioSelectionSupported, false);
    assert.equal(item.scenarioBoundary.deterministicSeedSupported, false);
    assert.ok(item.expectedDiagnostic.resultCannotBeUsedAs.includes("authoritative-original-runtime-baseline"));
    assert.ok(item.expectedDiagnostic.resultCannotBeUsedAs.includes("migration-completion"));
  }
});

test("binds the capacity report and emits exact unexecuted loopback diagnostic commands", async () => {
  const report = await buildReferenceMatrixReport();
  assert.match(report.sourceBindings.capacityReadiness.sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.sourceBindings.capacityReadiness.admission, "admit-full-lesson-capture-capacity");
  assert.equal(report.executionPolicy.executeFullQueueNow, false);
  assert.equal(report.executionPolicy.representativeDiagnosticsOnly, true);
  assert.deepEqual(report.executionPolicy.representativeAnimationIds, [
    "course-g04-l03-ir-001-341242cc",
    "course-g04-l03-in-009",
    "course-g04-l03-gs-002",
    "shell-course-g04-l03-index-local",
  ]);
  for (const item of report.queue) {
    for (const [language, command] of [["en", item.commands.englishUiDiagnostic], ["es", item.commands.spanishUiDiagnostic]]) {
      assert.equal(command.executedByMatrixBuilder, false);
      assert.match(command.shell, /http:\/\/127\.0\.0\.1:3104/);
      assert.ok(command.argv.includes(item.animationId));
      assert.ok(command.argv.includes(item.source.swf.sha256));
      assert.ok(command.argv.includes(language));
    }
  }
});

test("checked-in JSON and Markdown are current and preserve the forensic-only boundary", async () => {
  const report = validateReferenceMatrixReport(JSON.parse(await readFile(
    new URL("../reports/g4-l3-ruffle-reference-matrix.json", import.meta.url),
    "utf8",
  )));
  const markdown = await readFile(new URL("../reports/g4-l3-ruffle-reference-matrix.md", import.meta.url), "utf8");
  assert.equal(markdown, `${renderReferenceMatrixMarkdown(report)}\n`);
  assert.match(markdown, /Ruffle is a local forensic reference/);
  assert.match(markdown, /Deterministic frame\/domain\/language\/scenario\/seed capture ready: \*\*0\*\*/);
  assert.match(markdown, /The PNG is not tied to a source frame/);
});

test("CLI remains direct-node and rejects unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
