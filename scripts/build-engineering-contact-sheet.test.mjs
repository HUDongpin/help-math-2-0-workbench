import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";
import {
  buildEngineeringContactSheet,
  parseArguments,
} from "./build-engineering-contact-sheet.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function directoryDigest(frames) {
  return sha256(frames.map(({ frame, sha256: digest }) => `${frame}\0${digest}\n`).join(""));
}

async function writePng(destination, red) {
  const image = new PNG({ width: 2, height: 2 });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = 0;
    image.data[index + 2] = 0;
    image.data[index + 3] = 255;
  }
  const bytes = PNG.sync.write(image);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return sha256(bytes);
}

async function fixture(root) {
  const animationId = "keyterm-test";
  const baselineDirectory = path.join(root, "artifacts/full-frame/baseline");
  const implementationDirectory = path.join(root, "artifacts/full-frame/implementation");
  const diffDirectory = path.join(root, "artifacts/full-frame/diff");
  const baselineFrames = [];
  const implementationFrames = [];
  const diffFrames = [];
  const frames = [];
  const captured = [];
  for (let frame = 1; frame <= 3; frame += 1) {
    const baselineFile = path.join(baselineDirectory, `frame-${String(frame).padStart(4, "0")}.png`);
    const implementationFile = path.join(implementationDirectory, `frame-${String(frame).padStart(3, "0")}.png`);
    const diffFile = path.join(diffDirectory, `frame-${String(frame).padStart(4, "0")}.png`);
    const baselineSha256 = await writePng(baselineFile, 0);
    const implementationSha256 = await writePng(implementationFile, frame);
    const diffSha256 = await writePng(diffFile, frame);
    baselineFrames.push({ frame, sha256: baselineSha256 });
    implementationFrames.push({ frame, sha256: implementationSha256 });
    diffFrames.push({ frame, sha256: diffSha256 });
    const normalizedRmse = frame / 255;
    frames.push({
      frame,
      kind: "static",
      baselineFile: path.relative(root, baselineFile),
      baselineSha256,
      implementationFile: path.relative(root, implementationFile),
      implementationSha256,
      diffFile: path.relative(root, diffFile),
      diffSha256,
      width: 2,
      height: 2,
      normalizedRmse,
      mismatchedPixels: 4,
      mismatchedPixelRatio: 1,
      assignedThreshold: 0.05,
      result: "pass",
    });
    captured.push({
      frame,
      reportedFrame: frame,
      scenario: "standalone-default",
      language: "en",
      seed: "0",
      file: path.basename(implementationFile),
      sha256: implementationSha256,
      width: 2,
      height: 2,
    });
  }
  const comparison = {
    schemaVersion: 1,
    evidenceType: "full-frame-directory-comparison",
    animationId,
    scenario: "standalone-default",
    language: "en",
    seed: "0",
    contract: {
      expectedFrameCount: 3,
      stage: { width: 2, height: 2 },
      thresholds: { staticNormalizedRmse: 0.05, transitionNormalizedRmse: 0.08 },
    },
    inputs: {
      baseline: {
        directory: path.relative(root, baselineDirectory),
        directorySha256: directoryDigest(baselineFrames),
        frameCount: 3,
      },
      implementation: {
        directory: path.relative(root, implementationDirectory),
        directorySha256: directoryDigest(implementationFrames),
        frameCount: 3,
      },
    },
    diffArchive: {
      directory: path.relative(root, diffDirectory),
      directorySha256: directoryDigest(diffFrames),
      frameCount: 3,
    },
    summary: {
      frameCount: 3,
      normalizedRmse: {
        min: 1 / 255,
        max: 3 / 255,
        mean: 2 / 255,
        median: 2 / 255,
        p95: 3 / 255,
      },
      mismatchedPixelRatio: { min: 1, max: 1, mean: 1, median: 1, p95: 1 },
      atOrBelowStaticThreshold: { threshold: 0.05, count: 3, ratio: 1 },
      atOrBelowTransitionThreshold: { threshold: 0.08, count: 3, ratio: 1 },
      outliers: { aboveStaticThreshold: [], aboveTransitionThreshold: [], failingAssignedThreshold: [] },
      allAssignedThresholdsPass: true,
    },
    frames,
  };
  const baselineReport = {
    schemaVersion: 1,
    animationId,
    status: "authoritative-standalone-runtime-baseline",
    authority: { kind: "original-swf-adobe-flash-player-runtime" },
    runtime: {
      stage: { width: 2, height: 2 },
      frameCount: 3,
      scenario: "standalone-default",
      lang: "en",
    },
    capture: {
      archiveDirectory: path.relative(root, baselineDirectory),
      alphaComposite: { outputAlpha: 255 },
    },
    frames: frames.map((frame) => ({
      frame: frame.frame,
      file: path.basename(frame.baselineFile),
      sha256: frame.baselineSha256,
      width: 2,
      height: 2,
    })),
  };
  const captureManifest = {
    schemaVersion: 2,
    status: "complete",
    scenario: "standalone-default",
    language: "en",
    seed: "0",
    captured,
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    error: null,
  };
  const comparisonFile = path.join(root, "migrations/keyterm-test/evidence/comparison.json");
  const baselineReportFile = path.join(root, "migrations/keyterm-test/baseline/report.json");
  const captureManifestFile = path.join(implementationDirectory, "capture-manifest.json");
  await mkdir(path.dirname(comparisonFile), { recursive: true });
  await mkdir(path.dirname(baselineReportFile), { recursive: true });
  await writeFile(comparisonFile, `${JSON.stringify(comparison)}\n`);
  await writeFile(baselineReportFile, `${JSON.stringify(baselineReport)}\n`);
  await writeFile(captureManifestFile, `${JSON.stringify(captureManifest)}\n`);
  return { comparisonFile, baselineReportFile, captureManifestFile };
}

test("parses engineering contact-sheet arguments", () => {
  const options = parseArguments([
    "--comparison", "comparison.json",
    "--baseline-report", "baseline.json",
    "--capture-manifest", "capture.json",
    "--output", "manifest.json",
    "--frames-per-page", "6",
    "--page-columns", "1",
    "--scenario-equivalence", "standalone-default=default",
    "--language-equivalence", "en=es",
  ]);
  assert.equal(options.framesPerPage, 6);
  assert.equal(options.pageColumns, 1);
  assert.deepEqual(options.scenarioEquivalence, {baseline: "standalone-default", implementation: "default"});
  assert.deepEqual(options.languageEquivalence, {baseline: "en", implementation: "es"});
  assert.throws(() => parseArguments(["--scenario-equivalence", "bad"]), /must use/);
  assert.throws(() => parseArguments(["--language-equivalence", "bad"]), /must use/);
  assert.throws(() => parseArguments(["--comparison", "x"]), /--baseline-report is required/);
});

test("requires and records an exact scenario-equivalence mapping", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-scenario-"));
  try {
    const inputs = await fixture(root);
    const comparison = JSON.parse(await readFile(inputs.comparisonFile, "utf8"));
    comparison.scenario = "default";
    const capture = JSON.parse(await readFile(inputs.captureManifestFile, "utf8"));
    capture.scenario = "default";
    for (const row of capture.captured) row.scenario = "default";
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await writeFile(inputs.captureManifestFile, `${JSON.stringify(capture)}\n`);
    const outputFile = path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json");
    await assert.rejects(
      buildEngineeringContactSheet({...inputs, outputFile, projectRoot: root}),
      /without an exact --scenario-equivalence mapping/,
    );
    const manifest = await buildEngineeringContactSheet({
      ...inputs,
      outputFile,
      projectRoot: root,
      scenarioEquivalence: {baseline: "standalone-default", implementation: "default"},
      generatedAt: "2026-07-21T00:00:00.000Z",
    });
    assert.deepEqual(manifest.contract.scenarioEquivalence, {baseline: "standalone-default", implementation: "default"});
    assert.equal(manifest.contract.baselineScenario, "standalone-default");
    assert.equal(manifest.contract.comparisonScenario, "default");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts either comparison label only under the exact baseline-to-implementation scenario mapping", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-scenario-label-"));
  try {
    const inputs = await fixture(root);
    const capture = JSON.parse(await readFile(inputs.captureManifestFile, "utf8"));
    capture.scenario = "default";
    for (const row of capture.captured) row.scenario = "default";
    await writeFile(inputs.captureManifestFile, `${JSON.stringify(capture)}\n`);
    const outputFile = path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json");

    await assert.rejects(
      buildEngineeringContactSheet({...inputs, outputFile, projectRoot: root}),
      /without an exact --scenario-equivalence mapping/,
    );
    await assert.rejects(
      buildEngineeringContactSheet({
        ...inputs,
        outputFile,
        projectRoot: root,
        scenarioEquivalence: {baseline: "standalone-default", implementation: "other-default"},
      }),
      /does not exactly map the baseline scenario to the implementation scenario/,
    );
    await assert.rejects(
      buildEngineeringContactSheet({
        ...inputs,
        outputFile,
        projectRoot: root,
        scenarioEquivalence: {baseline: "standalone-default", implementation: "standalone-default"},
      }),
      /ambiguous because it maps a scenario label to itself/,
    );

    const manifest = await buildEngineeringContactSheet({
      ...inputs,
      outputFile,
      projectRoot: root,
      scenarioEquivalence: {baseline: "standalone-default", implementation: "default"},
      generatedAt: "2026-07-21T00:00:00.000Z",
    });
    assert.equal(manifest.contract.baselineScenario, "standalone-default");
    assert.equal(manifest.contract.comparisonScenario, "standalone-default");
    assert.equal(manifest.contract.implementationScenario, "default");

    const comparison = JSON.parse(await readFile(inputs.comparisonFile, "utf8"));
    comparison.scenario = "third-label";
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await assert.rejects(
      buildEngineeringContactSheet({
        ...inputs,
        outputFile,
        projectRoot: root,
        scenarioEquivalence: {baseline: "standalone-default", implementation: "default"},
      }),
      /matches neither side of the exact --scenario-equivalence mapping/,
    );

    comparison.scenario = "standalone-default";
    capture.scenario = "standalone-default";
    for (const row of capture.captured) row.scenario = "standalone-default";
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await writeFile(inputs.captureManifestFile, `${JSON.stringify(capture)}\n`);
    await assert.rejects(
      buildEngineeringContactSheet({
        ...inputs,
        outputFile,
        projectRoot: root,
        scenarioEquivalence: {baseline: "standalone-default", implementation: "default"},
      }),
      /ambiguous when baseline and implementation scenarios are already identical/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires and records an exact language-equivalence mapping", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-language-"));
  try {
    const inputs = await fixture(root);
    const comparison = JSON.parse(await readFile(inputs.comparisonFile, "utf8"));
    comparison.language = "es";
    const capture = JSON.parse(await readFile(inputs.captureManifestFile, "utf8"));
    capture.language = "es";
    for (const row of capture.captured) row.language = "es";
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await writeFile(inputs.captureManifestFile, `${JSON.stringify(capture)}\n`);
    const outputFile = path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json");
    await assert.rejects(
      buildEngineeringContactSheet({...inputs, outputFile, projectRoot: root}),
      /without an exact --language-equivalence mapping/,
    );
    const manifest = await buildEngineeringContactSheet({
      ...inputs,
      outputFile,
      projectRoot: root,
      languageEquivalence: {baseline: "en", implementation: "es"},
      generatedAt: "2026-07-21T00:00:00.000Z",
    });
    assert.deepEqual(manifest.contract.languageEquivalence, {baseline: "en", implementation: "es"});
    assert.equal(manifest.contract.baselineLanguage, "en");
    assert.equal(manifest.contract.language, "es");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("accepts the paired source-composited Spanish baseline authority without relabeling it as pure Adobe", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-source-composite-"));
  try {
    const inputs = await fixture(root);
    const baseline = JSON.parse(await readFile(inputs.baselineReportFile, "utf8"));
    baseline.status = "authoritative-source-composited-spanish-visual-baseline";
    baseline.authority.kind = "original-swf-adobe-runtime-plus-swf-structural-spanish-panel";
    baseline.runtime.scenario = "default";
    baseline.runtime.lang = "es";
    const comparison = JSON.parse(await readFile(inputs.comparisonFile, "utf8"));
    comparison.scenario = "default";
    comparison.language = "es";
    const capture = JSON.parse(await readFile(inputs.captureManifestFile, "utf8"));
    capture.scenario = "default";
    capture.language = "es";
    for (const row of capture.captured) {
      row.scenario = "default";
      row.language = "es";
    }
    await writeFile(inputs.baselineReportFile, `${JSON.stringify(baseline)}\n`);
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await writeFile(inputs.captureManifestFile, `${JSON.stringify(capture)}\n`);

    const outputFile = path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json");
    const manifest = await buildEngineeringContactSheet({
      ...inputs,
      outputFile,
      projectRoot: root,
      generatedAt: "2026-07-21T00:00:00.000Z",
    });
    assert.equal(
      manifest.contract.baselineAuthority,
      "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
    );
    assert.equal(manifest.contract.baselineLanguage, "es");
    assert.ok(manifest.sourceEvidence.baselineReport);
    assert.equal(manifest.sourceEvidence.adobeBaselineReport, undefined);

    baseline.authority.kind = "original-swf-adobe-flash-player-runtime";
    await writeFile(inputs.baselineReportFile, `${JSON.stringify(baseline)}\n`);
    await assert.rejects(
      buildEngineeringContactSheet({...inputs, outputFile, projectRoot: root}),
      /does not match status/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("cross-checks manifests and actual PNGs, then paginates every frame exactly once", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-"));
  try {
    const inputs = await fixture(root);
    const outputFile = path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json");
    const manifest = await buildEngineeringContactSheet({
      ...inputs,
      outputFile,
      projectRoot: root,
      framesPerPage: 2,
      pageColumns: 1,
      generatedAt: "2026-07-21T00:00:00.000Z",
    });
    assert.equal(manifest.contract.pageCount, 2);
    assert.match(manifest.generator.scriptSha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.contract.baselineScenario, "standalone-default");
    assert.equal(manifest.contract.implementationScenario, "standalone-default");
    assert.deepEqual(manifest.pages.map((page) => page.frames), [[1, 2], [3]]);
    assert.deepEqual(manifest.pages.flatMap((page) => page.frames), [1, 2, 3]);
    for (const page of manifest.pages) {
      const bytes = await readFile(path.join(root, page.file));
      assert.equal(sha256(bytes), page.sha256);
      assert.doesNotThrow(() => PNG.sync.read(bytes));
    }
    const recorded = JSON.parse(await readFile(outputFile, "utf8"));
    assert.equal(recorded.verification.implementationReportedFramesMatchRequests, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed when a comparison hash no longer matches the actual PNG", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "flash-engineering-contact-hash-"));
  try {
    const inputs = await fixture(root);
    const comparison = JSON.parse(await readFile(inputs.comparisonFile, "utf8"));
    comparison.frames[1].baselineSha256 = "0".repeat(64);
    await writeFile(inputs.comparisonFile, `${JSON.stringify(comparison)}\n`);
    await assert.rejects(
      buildEngineeringContactSheet({
        ...inputs,
        outputFile: path.join(root, "migrations/keyterm-test/evidence/contact/manifest.json"),
        projectRoot: root,
      }),
      /baseline report hash differs at frame 2/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
