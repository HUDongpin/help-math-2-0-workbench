import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

import {
  checkCompletionLedger,
  generateCompletionLedger,
  writeCompletionLedger,
} from "./build-completion-ledger.mjs";
import { scaffoldMigration } from "./create-flash-migration.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeHashed(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
  return digest(value);
}

async function createStrictFixture(root, id) {
  const sourcePath = path.join(root, "sources", `${id}.swf`);
  const sourceBytes = Buffer.from(`FWS strict fixture ${id}`);
  await writeHashed(sourcePath, sourceBytes);
  const workspace = await scaffoldMigration({ id, output: path.join(root, "migrations"), swf: sourcePath });
  const manifestPath = path.join(workspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  Object.assign(manifest, {
    status: "complete",
    confidence: "high",
    assetId: `swf-${digest(sourceBytes)}`,
  });
  Object.assign(manifest.classification, {
    collection: "formula",
    domain: "formula-reference",
    titleRaw: id,
    titleDisplay: id,
    status: "confirmed",
    evidence: ["strict ledger fixture"],
  });
  Object.assign(manifest.runtime, {
    swfSignature: "FWS",
    swfVersion: 10,
    stage: { width: 2, height: 2 },
    fps: 12,
    frameCount: 1,
    durationMs: 1000 / 12,
    backgroundColor: "#ffffff",
    actionScriptVersion: "AS2",
    complexity: "low",
  });
  Object.assign(manifest.localization, { bilingualRequired: false, languages: ["en"] });
  manifest.scenarios = [{ id: "default", kind: "linear", description: "One-frame strict fixture.", reachable: true }];
  manifest.audit.assetsRequired = false;
  manifest.audit.assetsNotRequiredReason = "No extracted assets in the one-frame fixture.";
  manifest.audio.required = false;
  manifest.audio.reasonNotRequired = "The fixture has no audio.";
  Object.assign(manifest.toolVersions, { ruffle: "test", browser: "Chromium test" });

  const code = {
    baseline: path.join(root, "code", id, "reference.jsx"),
    route: path.join(root, "code", id, "page.jsx"),
    component: path.join(root, "code", id, "component.jsx"),
    timeline: path.join(root, "code", id, "timeline.js"),
    test: path.join(root, "code", id, "timeline.test.mjs"),
  };
  for (const filePath of Object.values(code)) await writeHashed(filePath, "export default true;\n");
  Object.assign(manifest.baseline, {
    authority: "Ruffle",
    route: `/reference/${id}`,
    routeFile: code.baseline,
    viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
  });
  Object.assign(manifest.implementation, {
    rendering: "React + SVG",
    route: `/animations/${id}`,
    routeFile: code.route,
    component: code.component,
    registryModule: "./modules/conversion-1-2",
    timelineModule: code.timeline,
    testFile: code.test,
  });
  for (const key of Object.keys(manifest.accessibility)) manifest.accessibility[key] = true;
  manifest.acceptance.engineeringReview = { decision: "accepted", reviewer: "engineer", reviewedAt: "2026-07-21" };
  manifest.acceptance.humanVisualReview = {
    decision: "accepted",
    reviewer: "visual reviewer",
    reviewedAt: "2026-07-21",
    scope: "all-keyframe-and-full-frame-diffs",
  };
  manifest.acceptance.ownerReview = { decision: "accepted", reviewer: "owner", reviewedAt: "2026-07-21", reason: "Fixture acceptance." };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(workspace, "ACCEPTANCE_CHECKLIST.md"),
    (await readFile(path.join(workspace, "ACCEPTANCE_CHECKLIST.md"), "utf8")).replaceAll("- [ ]", "- [x]"),
  );

  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const evidence = {
    baseline: "baseline/keyframes/frame-001.png",
    implementation: "evidence/implementation/frame-001.png",
    diff: "evidence/diffs/frame-001.png",
  };
  const evidenceHashes = {};
  for (const [name, relative] of Object.entries(evidence)) evidenceHashes[name] = await writeHashed(path.join(workspace, relative), pngBytes);
  await writeFile(
    path.join(workspace, "keyframes.csv"),
    "frame,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes\n" +
    `1,0,default,en,static,fixture,load,${evidence.baseline},${evidenceHashes.baseline},${evidence.implementation},${evidenceHashes.implementation},${evidence.diff},${evidenceHashes.diff},0,pass,pass,SWF,visual reviewer,none\n`,
  );

  const captureDirectory = path.join(workspace, "evidence", "full-frame", "default", "en");
  const captureImageHash = await writeHashed(path.join(captureDirectory, "frame-001.png"), pngBytes);
  const capture = {
    schemaVersion: 2,
    status: "complete",
    scenario: "default",
    language: "en",
    seed: "0",
    selector: ".faithful-stage-wrap",
    reportedFrameAttribute: "data-flash-frame",
    viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
    captured: [{ frame: 1, reportedFrame: 1, scenario: "default", language: "en", seed: "0", file: "frame-001.png", sha256: captureImageHash, width: 2, height: 2 }],
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  const captureRelative = path.relative(workspace, path.join(captureDirectory, "capture-manifest.json"));
  const captureBytes = `${JSON.stringify(capture, null, 2)}\n`;
  const captureHash = await writeHashed(path.join(workspace, captureRelative), captureBytes);
  const metrics = { scenario: "default", language: "en", seed: "0", frames: [{ frame: 1, kind: "static", normalizedRmse: 0, result: "pass" }] };
  const metricsRelative = path.relative(workspace, path.join(captureDirectory, "metrics.json"));
  const metricsBytes = `${JSON.stringify(metrics, null, 2)}\n`;
  const metricsHash = await writeHashed(path.join(workspace, metricsRelative), metricsBytes);
  await writeFile(path.join(workspace, "evidence", "full-frame-coverage.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    frameCount: 1,
    languages: ["en"],
    scenarios: ["default"],
    combinations: [{
      scenario: "default",
      language: "en",
      seed: "0",
      firstFrame: 1,
      lastFrame: 1,
      capturedFrameCount: 1,
      missingFrames: [],
      captureManifest: captureRelative,
      captureManifestSha256: captureHash,
      metricsFile: metricsRelative,
      metricsSha256: metricsHash,
    }],
  }, null, 2)}\n`);
  return { workspace, manifestPath };
}

test("completion ledger admits only real strict passes in stable order without mutating manifests", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "completion-ledger-"));
  try {
    const zeta = await createStrictFixture(root, "zeta-complete");
    const alpha = await createStrictFixture(root, "alpha-complete");
    const draftSource = path.join(root, "sources", "draft.swf");
    await writeHashed(draftSource, "draft SWF");
    const draftWorkspace = await scaffoldMigration({ id: "draft-only", output: path.join(root, "migrations"), swf: draftSource });
    const falseCompleteManifestPath = path.join(draftWorkspace, "migration.json");
    const falseComplete = JSON.parse(await readFile(falseCompleteManifestPath, "utf8"));
    falseComplete.status = "complete";
    await writeFile(falseCompleteManifestPath, `${JSON.stringify(falseComplete, null, 2)}\n`);

    const before = new Map();
    for (const filePath of [zeta.manifestPath, alpha.manifestPath, falseCompleteManifestPath]) before.set(filePath, await readFile(filePath, "utf8"));
    const ledger = await generateCompletionLedger({ migrationsRoot: path.join(root, "migrations") });
    assert.deepEqual(ledger.entries.map(({ animationId }) => animationId), ["alpha-complete", "zeta-complete"]);
    assert.equal(ledger.summary.migrationDirectories, 3);
    assert.equal(ledger.summary.declaredComplete, 3);
    assert.equal(ledger.summary.strictComplete, 2);
    assert.equal(ledger.summary.strictFailed, 1);
    assert.match(ledger.generatedMarker, /^sha256:[a-f0-9]{64}$/);
    assert.match(ledger.validator.sha256, /^[a-f0-9]{64}$/);
    assert.equal(ledger.entries[0].validation.mode, "strict");
    assert.equal(ledger.entries[0].route, "/animations/alpha-complete");
    assert.equal(ledger.entries[0].acceptance.ownerReview.decision, "accepted");
    assert.equal(ledger.diagnostics[0].animationId, "draft-only");
    assert.ok(ledger.diagnostics[0].errorCount > 0);
    for (const [filePath, contents] of before) assert.equal(await readFile(filePath, "utf8"), contents);

    const output = path.join(root, "catalog", "completion-ledger.json");
    const firstWrite = await writeCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    const secondWrite = await writeCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    assert.equal(firstWrite.serialized, secondWrite.serialized);
    assert.equal((await checkCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output })).ok, true);
    assert.equal((await readdir(path.dirname(output))).some((name) => name.endsWith(".tmp")), false);

    const changed = JSON.parse(await readFile(falseCompleteManifestPath, "utf8"));
    changed.classification.titleRaw = "changed diagnostic input";
    await writeFile(falseCompleteManifestPath, `${JSON.stringify(changed, null, 2)}\n`);
    const stale = await checkCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    assert.equal(stale.ok, false);
    assert.equal(stale.reason, "stale");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("zero strict-complete migrations produce a valid checkable ledger", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "completion-ledger-empty-"));
  try {
    const migrationsRoot = path.join(root, "migrations");
    const output = path.join(root, "catalog", "completion-ledger.json");
    const { ledger } = await writeCompletionLedger({ migrationsRoot, output });
    assert.equal(ledger.summary.migrationDirectories, 0);
    assert.equal(ledger.summary.strictComplete, 0);
    assert.deepEqual(ledger.entries, []);
    assert.equal((await checkCompletionLedger({ migrationsRoot, output })).ok, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
