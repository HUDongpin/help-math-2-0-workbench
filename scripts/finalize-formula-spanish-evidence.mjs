#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const FORMULA_SPANISH_PILOTS = Object.freeze([
  Object.freeze({id: "formula-elementary-conversion-01-01", frameCount: 94,
    invalidatedComparison: "evidence/full-frame-comparison-default-es.invalidated-ffdec-whole-frame.json"}),
  Object.freeze({id: "formula-elementary-conversion-01-02", frameCount: 109}),
  Object.freeze({id: "formula-elementary-conversion-01-03", frameCount: 170}),
  Object.freeze({id: "formula-elementary-conversion-01-04", frameCount: 67,
    invalidatedCapture: "evidence/capture-default-es.invalidated-hmr-err-aborted-frame-7.json"}),
]);

function usage() {
  return `Usage:
  node scripts/finalize-formula-spanish-evidence.mjs [--check]

Validates the four canonical Spanish child-visual evidence chains, then updates
full-frame coverage and migration evidence hashes without changing migration
status or claiming original-host, audio, human-review, or owner acceptance.`;
}

function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function projectPath(candidate) {
  return portable(path.relative(projectRoot, candidate));
}

async function readJson(candidate) {
  const bytes = await readFile(candidate);
  return {bytes, sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8"))};
}

async function writeAtomically(destination, bytes) {
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

function sequentialFrames(records, frameCount, label, field = "frame") {
  assert(records?.length === frameCount, `${label}: expected ${frameCount} records, observed ${records?.length ?? 0}`);
  for (let index = 0; index < frameCount; index += 1) {
    assert(records[index]?.[field] === index + 1, `${label}: non-sequential frame at ${index + 1}`);
  }
}

function falseBoundary(value, keys, label) {
  for (const key of keys) assert(value?.[key] === false, `${label}: ${key} must remain false`);
}

export function buildSpanishCoverageCombination({pilot, capture, comparison, hashes}) {
  return {
    status: "complete",
    scenario: "default",
    baselineScenario: "default",
    language: "es",
    seed: "0",
    firstFrame: 1,
    lastFrame: pilot.frameCount,
    capturedFrameCount: pilot.frameCount,
    missingFrames: [],
    captureManifest: `../../output/playwright/formula-spanish-fidelity/${pilot.id}/default/es/capture-manifest.json`,
    captureManifestSha256: hashes.capture,
    metricsFile: "evidence/full-frame-comparison-default-es.json",
    metricsSha256: hashes.comparison,
    baselineReport: "baseline/source-composited-spanish-default.json",
    baselineReportSha256: hashes.baseline,
    contactSheetManifest: "evidence/contact-sheets/default-es/manifest.json",
    contactSheetManifestSha256: hashes.contact,
    baselineAuthority: "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
    normalizedRmse: comparison.summary.normalizedRmse,
    failingFrames: comparison.summary.outliers.failingAssignedThreshold,
    reviewScope: "engineering source-composited Spanish child-visual full-frame comparison and contact-sheet prereview; not original indexELM external-default parity, audio validation, human review, or owner acceptance",
  };
}

export function applySpanishManifestEvidence({manifest, pilot, comparison, paths, hashes}) {
  manifest.localization.authoritativeSpanishHostParity = false;
  manifest.localization.authoritativeSpanishChildVisualParity = true;
  manifest.localization.spanishChildVisualAuthority = {
    kind: "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
    scope: "child SWF visual branch only",
    originalIndexElmExternalDefaultRecovered: false,
  };
  manifest.fidelity.spanishChildVisual = {
    status: "pass",
    frameCount: pilot.frameCount,
    baselineAuthority: "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
    allAssignedThresholdsPass: true,
    normalizedRmse: comparison.summary.normalizedRmse,
    failingFrames: [],
  };
  manifest.fidelity.spanishHostVisual = {
    status: "blocked-unrecovered-original-host-external-default",
    reason: "The child SWF Spanish visual branch now has complete source-composited full-frame parity. This does not recover or prove the original 800x600 indexELM shell's external dtfSpanishFormulas default or host traversal.",
  };
  Object.assign(manifest.evidence, {
    spanishBaselineReport: "baseline/source-composited-spanish-default.json",
    spanishComparisonFile: "evidence/full-frame-comparison-default-es.json",
    spanishCaptureManifest: paths.captureProject,
    spanishContactSheetManifest: "evidence/contact-sheets/default-es/manifest.json",
    formulaEngineeringBehaviorQaFile: "evidence/formula-engineering-behavior-qa.json",
    formulaEngineeringProductQaFile: "evidence/formula-engineering-product-qa.json",
    spanishDifferenceDirectory: comparison.diffArchive.directory,
    spanishArchiveDirectory: comparison.inputs.baseline.directory,
    ...(pilot.invalidatedComparison ? {invalidatedSpanishFfdecWholeFrameComparison: pilot.invalidatedComparison} : {}),
    ...(pilot.invalidatedCapture ? {invalidatedSpanishHmrCapture: pilot.invalidatedCapture} : {}),
  });
  Object.assign(manifest.evidence.evidenceHashes, {
    spanishBaselineReport: hashes.baseline,
    spanishComparison: hashes.comparison,
    spanishCaptureManifest: hashes.capture,
    spanishContactSheetManifest: hashes.contact,
    formulaEngineeringBehaviorQa: hashes.detailedBehavior,
    formulaEngineeringProductQa: hashes.detailedProduct,
    behaviorQa: hashes.behavior,
    productQa: hashes.product,
    productAudioQa: hashes.audio,
    fullFrameCoverage: hashes.coverage,
    ...(hashes.invalidatedComparison ? {invalidatedSpanishFfdecWholeFrameComparison: hashes.invalidatedComparison} : {}),
    ...(hashes.invalidatedCapture ? {invalidatedSpanishHmrCapture: hashes.invalidatedCapture} : {}),
  });
  manifest.acceptance.engineeringReview = {
    decision: "accepted",
    reviewer: "Codex engineering review",
    reviewedAt: "2026-07-21T09:45:00.000Z",
    scope: pilot.id === "formula-elementary-conversion-01-01"
      ? "Accepted for the hash-bound English standalone Adobe full-frame comparison; the source-composited Spanish child-SWF visual branch (Adobe natural-playback dynamics plus the source-extracted persistent Mc_SD panel); the scope-limited controlled Adobe root-visibility cross-check; the clean modern default/es full-frame RMSE comparison; and deterministic behavior, responsive layout, accessibility, localization-state, console, and network QA. This does not accept the original indexELM external default or complete host traversal, authoritative audio listening/synchronization, human visual review, owner review, strict validation, or status promotion."
      : "Accepted for the hash-bound English standalone Adobe full-frame comparison; the source-composited Spanish child-SWF visual branch (Adobe natural-playback dynamics plus the source-extracted persistent Mc_SD panel); structural SWF/FLA persistence evidence corroborated by the scope-limited 01-01 controlled Adobe root-visibility cross-check; the clean modern default/es full-frame RMSE comparison; and deterministic behavior, responsive layout, accessibility, localization-state, console, and network QA. This does not claim a controlled Adobe parent run for this file and does not accept the original indexELM external default or complete host traversal, authoritative audio listening/synchronization, human visual review, owner review, strict validation, or status promotion.",
  };
  return manifest;
}

async function validatePilot(pilot) {
  const migrationRoot = path.join(projectRoot, "migrations", pilot.id);
  const paths = {
    migration: path.join(migrationRoot, "migration.json"),
    coverage: path.join(migrationRoot, "evidence", "full-frame-coverage.json"),
    baseline: path.join(migrationRoot, "baseline", "source-composited-spanish-default.json"),
    comparison: path.join(migrationRoot, "evidence", "full-frame-comparison-default-es.json"),
    capture: path.join(projectRoot, "output", "playwright", "formula-spanish-fidelity", pilot.id, "default", "es", "capture-manifest.json"),
    contact: path.join(migrationRoot, "evidence", "contact-sheets", "default-es", "manifest.json"),
    behavior: path.join(migrationRoot, "evidence", "behavior-qa.json"),
    product: path.join(migrationRoot, "evidence", "product-qa.json"),
    detailedBehavior: path.join(migrationRoot, "evidence", "formula-engineering-behavior-qa.json"),
    detailedProduct: path.join(migrationRoot, "evidence", "formula-engineering-product-qa.json"),
    audio: path.join(migrationRoot, "evidence", "product-audio-controls-qa.json"),
  };
  const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, file]) => [key, await readJson(file)])));
  const {baseline, comparison, capture, contact, behavior, product, detailedBehavior, detailedProduct} =
    Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, source.value]));

  assert(baseline.animationId === pilot.id
    && baseline.status === "authoritative-source-composited-spanish-visual-baseline"
    && baseline.authority?.kind === "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
  `${pilot.id}: Spanish baseline authority mismatch`);
  assert(baseline.runtime?.scenario === "default" && baseline.runtime?.lang === "es"
    && baseline.runtime?.frameCount === pilot.frameCount, `${pilot.id}: Spanish baseline runtime mismatch`);
  assert(baseline.authority.ffdecWholeFrameUsedAsRuntime === false
    && baseline.calibration?.allPass === true
    && baseline.composition?.outsideChangedPixelCountAcrossAllFrames === 0,
  `${pilot.id}: Spanish source-composition proof is incomplete`);
  sequentialFrames(baseline.frames, pilot.frameCount, `${pilot.id} baseline`);

  assert(capture.status === "complete" && capture.scenario === "default" && capture.language === "es"
    && String(capture.seed) === "0", `${pilot.id}: implementation capture is not clean/default/es/seed0`);
  for (const key of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    assert(Array.isArray(capture[key]) && capture[key].length === 0, `${pilot.id}: capture has ${key}`);
  }
  assert(capture.error === null, `${pilot.id}: capture contains an error`);
  sequentialFrames(capture.captured, pilot.frameCount, `${pilot.id} capture`);
  for (const record of capture.captured) assert(record.reportedFrame === record.frame,
    `${pilot.id}: data-flash-frame mismatch at ${record.frame}`);

  assert(comparison.animationId === pilot.id && comparison.scenario === "default"
    && comparison.language === "es" && String(comparison.seed) === "0",
  `${pilot.id}: comparison identity mismatch`);
  assert(comparison.contract?.expectedFrameCount === pilot.frameCount
    && comparison.summary?.frameCount === pilot.frameCount
    && comparison.summary?.allAssignedThresholdsPass === true
    && comparison.summary?.outliers?.failingAssignedThreshold?.length === 0,
  `${pilot.id}: comparison is incomplete or failed`);
  assert(comparison.inputs.baseline.directory === baseline.capture.archiveDirectory,
    `${pilot.id}: comparison does not use the source-composited baseline`);
  assert(comparison.inputs.implementation.directory === projectPath(path.dirname(paths.capture)),
    `${pilot.id}: comparison does not use the canonical localhost capture`);
  sequentialFrames(comparison.frames, pilot.frameCount, `${pilot.id} comparison`);
  for (let index = 0; index < pilot.frameCount; index += 1) {
    assert(comparison.frames[index].baselineSha256 === baseline.frames[index].sha256,
      `${pilot.id}: baseline hash mismatch at frame ${index + 1}`);
    assert(comparison.frames[index].implementationSha256 === capture.captured[index].sha256,
      `${pilot.id}: implementation hash mismatch at frame ${index + 1}`);
  }

  assert(contact.animationId === pilot.id && contact.contract?.frameCount === pilot.frameCount
    && contact.contract?.baselineAuthority === baseline.authority.kind,
  `${pilot.id}: contact-sheet contract mismatch`);
  assert(contact.sourceEvidence?.comparison?.sha256 === sources.comparison.sha256
    && contact.sourceEvidence?.baselineReport?.sha256 === sources.baseline.sha256
    && contact.sourceEvidence?.implementationCaptureManifest?.sha256 === sources.capture.sha256,
  `${pilot.id}: contact-sheet source hashes are stale`);
  const contactFrames = contact.pages?.flatMap(({frames}) => frames) ?? [];
  sequentialFrames(contactFrames.map((frame) => ({frame})), pilot.frameCount, `${pilot.id} contact sheets`);
  for (const page of contact.pages) {
    const bytes = await readFile(path.resolve(projectRoot, page.file));
    assert(sha256(bytes) === page.sha256, `${pilot.id}: contact-sheet page ${page.page} hash mismatch`);
  }
  assert(Object.values(contact.verification || {}).every((value) => value === true || value === 0),
    `${pilot.id}: contact-sheet verification contains a failure`);

  assert(behavior.status === "pass" && behavior.authorityBoundary?.sourceCompositedSpanishVisualParity === true,
    `${pilot.id}: canonical behavior QA did not pass Spanish child parity`);
  falseBoundary(behavior.authorityBoundary,
    ["originalHostSpanishTraversal", "authoritativeAudioListening", "audioSynchronization", "humanVisualReview", "ownerAcceptance", "strictMigrationCompletion"],
    `${pilot.id} behavior authority`);
  assert(product.status === "pass", `${pilot.id}: canonical product QA failed`);
  falseBoundary(product.authorityBoundary,
    ["originalHostSpanishTraversal", "authoritativeAudioListening", "audioSynchronization", "humanVisualReview", "ownerAcceptance", "strictMigrationCompletion"],
    `${pilot.id} product authority`);
  assert(detailedBehavior.engineeringBehaviorPassed === true
    && detailedBehavior.authorityBoundary?.sourceCompositedSpanishVisualParity === true,
  `${pilot.id}: detailed behavior QA failed`);
  falseBoundary(detailedBehavior.authorityBoundary,
    ["originalIndexElmExternalDefaultRecovered", "audioListeningOrSynchronization", "humanReview", "ownerAcceptance"],
    `${pilot.id} detailed behavior authority`);
  assert(detailedProduct.engineeringProductQaPassed === true, `${pilot.id}: detailed product QA failed`);
  falseBoundary(detailedProduct.authorityBoundary,
    ["originalHostSpanishTraversal", "authoritativeAudioListening", "audioSynchronization", "humanVisualReview", "ownerAcceptance", "strictMigrationCompletion"],
    `${pilot.id} detailed product authority`);

  const invalidatedSources = {};
  for (const [key, relative] of [["invalidatedComparison", pilot.invalidatedComparison], ["invalidatedCapture", pilot.invalidatedCapture]]) {
    if (!relative) continue;
    invalidatedSources[key] = await readJson(path.join(migrationRoot, relative));
  }
  return {pilot, paths, sources, invalidatedSources};
}

async function finalizePilot(validated, check) {
  const {pilot, paths, sources, invalidatedSources} = validated;
  const coverage = sources.coverage.value;
  assert(coverage.animationId === pilot.id && coverage.frameCount === pilot.frameCount,
    `${pilot.id}: coverage identity mismatch`);
  const spanishIndex = coverage.combinations.findIndex(({scenario, language, seed}) =>
    scenario === "default" && language === "es" && String(seed) === "0");
  assert(spanishIndex >= 0, `${pilot.id}: coverage has no default/es/seed0 combination`);
  const initialHashes = {
    baseline: sources.baseline.sha256,
    comparison: sources.comparison.sha256,
    capture: sources.capture.sha256,
    contact: sources.contact.sha256,
  };
  coverage.combinations[spanishIndex] = buildSpanishCoverageCombination({
    pilot,
    capture: sources.capture.value,
    comparison: sources.comparison.value,
    hashes: initialHashes,
  });
  coverage.visualLocalization.rationale = "The source child SWF conditionally shows Mc_SD. The default/es combination is independently covered by a source-composited child-visual baseline; the original indexELM external default remains unrecovered.";
  const coverageBytes = Buffer.from(`${JSON.stringify(coverage, null, 2)}\n`);

  const hashes = {
    ...initialHashes,
    coverage: sha256(coverageBytes),
    behavior: sources.behavior.sha256,
    product: sources.product.sha256,
    detailedBehavior: sources.detailedBehavior.sha256,
    detailedProduct: sources.detailedProduct.sha256,
    audio: sources.audio.sha256,
    invalidatedComparison: invalidatedSources.invalidatedComparison?.sha256,
    invalidatedCapture: invalidatedSources.invalidatedCapture?.sha256,
  };
  const manifest = applySpanishManifestEvidence({
    manifest: sources.migration.value,
    pilot,
    comparison: sources.comparison.value,
    paths: {captureProject: projectPath(paths.capture)},
    hashes,
  });
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);

  if (check) {
    assert(sources.coverage.bytes.equals(coverageBytes), `${pilot.id}: full-frame coverage is stale`);
    assert(sources.migration.bytes.equals(manifestBytes), `${pilot.id}: migration evidence hashes are stale`);
  } else {
    await writeAtomically(paths.coverage, coverageBytes);
    await writeAtomically(paths.migration, manifestBytes);
  }
  return {
    animationId: pilot.id,
    frameCount: pilot.frameCount,
    normalizedRmseMax: sources.comparison.value.summary.normalizedRmse.max,
    contactSheetPages: sources.contact.value.contract.pageCount,
    coverageSha256: hashes.coverage,
    comparisonSha256: hashes.comparison,
  };
}

export async function finalizeFormulaSpanishEvidence({check = false} = {}) {
  const results = [];
  for (const pilot of FORMULA_SPANISH_PILOTS) results.push(await finalizePilot(await validatePilot(pilot), check));
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const results = await finalizeFormulaSpanishEvidence(options);
  console.log(JSON.stringify({mode: options.check ? "check" : "write", results}, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
