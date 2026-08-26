#!/usr/bin/env node

import {constants as fsConstants} from "node:fs";
import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildEngineeringContactSheet} from "./build-engineering-contact-sheet.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const EXECUTED_CONTACT_SHEET_GENERATOR = path.join(PROJECT_ROOT, "scripts", "build-engineering-contact-sheet.mjs");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const CONTACT_SHEET_PROVENANCE_TARGETS = Object.freeze([
  Object.freeze({
    animationId: "formula-elementary-conversion-01-01",
    frameCount: 94,
    manifest: "migrations/formula-elementary-conversion-01-01/evidence/contact-sheets/standalone-default-en/manifest.json",
    comparison: "migrations/formula-elementary-conversion-01-01/evidence/full-frame-comparison-standalone-default-en.json",
    baseline: "migrations/formula-elementary-conversion-01-01/baseline/adobe-flash-player-32-standalone-default.json",
    capture: "output/playwright/conversion-1-1-fidelity-pass/en-default/capture-manifest.json",
    scenarios: Object.freeze({baseline: "standalone-default", comparison: "standalone-default", implementation: "default"}),
    languages: Object.freeze({baseline: "en", comparison: "en", implementation: "en"}),
    migrationBinding: Object.freeze({pathKey: "contactSheetManifest", hashKey: "contactSheetManifest"}),
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-02",
    frameCount: 109,
    manifest: "migrations/formula-elementary-conversion-01-02/evidence/contact-sheets/standalone-default-en/manifest.json",
    comparison: "migrations/formula-elementary-conversion-01-02/evidence/full-frame-comparison-standalone-default-en.json",
    baseline: "migrations/formula-elementary-conversion-01-02/baseline/adobe-flash-player-32-standalone-default.json",
    capture: "output/playwright/conversion-1-2-fidelity-final-isolated/en-default/capture-manifest.json",
    scenarios: Object.freeze({baseline: "standalone-default", comparison: "standalone-default", implementation: "default"}),
    languages: Object.freeze({baseline: "en", comparison: "en", implementation: "en"}),
    migrationBinding: Object.freeze({pathKey: "contactSheetManifest", hashKey: "contactSheetManifest"}),
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-03",
    frameCount: 170,
    manifest: "migrations/formula-elementary-conversion-01-03/evidence/contact-sheets/standalone-default-en/manifest.json",
    comparison: "migrations/formula-elementary-conversion-01-03/evidence/full-frame-comparison-standalone-default-en.json",
    baseline: "migrations/formula-elementary-conversion-01-03/baseline/adobe-flash-player-32-standalone-default.json",
    capture: "output/playwright/conversion-1-3-fidelity-final-vector/en-default/capture-manifest.json",
    scenarios: Object.freeze({baseline: "standalone-default", comparison: "standalone-default", implementation: "default"}),
    languages: Object.freeze({baseline: "en", comparison: "en", implementation: "en"}),
    migrationBinding: Object.freeze({pathKey: "contactSheetManifest", hashKey: "contactSheetManifest"}),
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-04",
    frameCount: 67,
    manifest: "migrations/formula-elementary-conversion-01-04/evidence/contact-sheets/standalone-default-en/manifest.json",
    comparison: "migrations/formula-elementary-conversion-01-04/evidence/full-frame-comparison-standalone-default-en.json",
    baseline: "migrations/formula-elementary-conversion-01-04/baseline/adobe-flash-player-32-standalone-default.json",
    capture: "artifacts/full-frame/pilot-implementations/formula-elementary-conversion-01-04/default/en/capture-manifest.json",
    scenarios: Object.freeze({baseline: "standalone-default", comparison: "standalone-default", implementation: "default"}),
    languages: Object.freeze({baseline: "en", comparison: "en", implementation: "en"}),
    migrationBinding: Object.freeze({pathKey: "contactSheetManifest", hashKey: "contactSheetManifest"}),
  }),
  ...[
    ["formula-elementary-conversion-01-01", 94],
    ["formula-elementary-conversion-01-02", 109],
    ["formula-elementary-conversion-01-03", 170],
    ["formula-elementary-conversion-01-04", 67],
  ].map(([animationId, frameCount]) => Object.freeze({
    animationId,
    frameCount,
    manifest: `migrations/${animationId}/evidence/contact-sheets/default-es/manifest.json`,
    comparison: `migrations/${animationId}/evidence/full-frame-comparison-default-es.json`,
    baseline: `migrations/${animationId}/baseline/source-composited-spanish-default.json`,
    capture: `output/playwright/formula-spanish-fidelity/${animationId}/default/es/capture-manifest.json`,
    baselineSourceKey: "baselineReport",
    baselineAuthority: "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
    scenarios: Object.freeze({baseline: "default", comparison: "default", implementation: "default"}),
    languages: Object.freeze({baseline: "es", comparison: "es", implementation: "es"}),
    migrationBinding: Object.freeze({pathKey: "spanishContactSheetManifest", hashKey: "spanishContactSheetManifest"}),
    coverageBinding: Object.freeze({
      file: `migrations/${animationId}/evidence/full-frame-coverage.json`,
      scenario: "default",
      language: "es",
      seed: "0",
      pathKey: "fullFrameCoverageFile",
      hashKey: "fullFrameCoverage",
    }),
  })),
  ...[
    {
      animationId: "keyterm-elementary-acute-angle",
      frameCount: 60,
      baseline: "migrations/keyterm-elementary-acute-angle/baseline/adobe-flash-player-32-standalone-default.json",
      variants: [
        {
          name: "default-en",
          comparison: "migrations/keyterm-elementary-acute-angle/evidence/full-frame-comparison-default-en.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-acute-angle/canonical/default/en/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "default", implementation: "default"},
          languages: {baseline: "en", comparison: "en", implementation: "en"},
          migrationBinding: {pathKey: "englishContactSheetManifest", hashKey: "englishContactSheetManifest"},
        },
        {
          name: "default-es",
          comparison: "migrations/keyterm-elementary-acute-angle/evidence/full-frame-comparison-default-es.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-acute-angle/canonical/default/es/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "default", implementation: "default"},
          languages: {baseline: "en", comparison: "es", implementation: "es"},
          migrationBinding: {pathKey: "spanishContactSheetManifest", hashKey: "spanishContactSheetManifest"},
        },
        {
          name: "standalone-default-en",
          comparison: "migrations/keyterm-elementary-acute-angle/evidence/full-frame-comparison-standalone-default-en.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-acute-angle/default/en/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "standalone-default", implementation: "default"},
          languages: {baseline: "en", comparison: "en", implementation: "en"},
          migrationBinding: null,
        },
      ],
    },
    {
      animationId: "keyterm-elementary-computeghgh",
      frameCount: 35,
      baseline: "migrations/keyterm-elementary-computeghgh/baseline/adobe-flash-player-32-standalone-default.json",
      variants: [
        {
          name: "default-en",
          comparison: "migrations/keyterm-elementary-computeghgh/evidence/full-frame-comparison-default-en.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-computeghgh/canonical/default/en/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "default", implementation: "default"},
          languages: {baseline: "en", comparison: "en", implementation: "en"},
          migrationBinding: {pathKey: "englishContactSheetManifest", hashKey: "englishContactSheetManifest"},
        },
        {
          name: "default-es",
          comparison: "migrations/keyterm-elementary-computeghgh/evidence/full-frame-comparison-default-es.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-computeghgh/canonical/default/es/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "default", implementation: "default"},
          languages: {baseline: "en", comparison: "es", implementation: "es"},
          migrationBinding: {pathKey: "spanishContactSheetManifest", hashKey: "spanishContactSheetManifest"},
        },
        {
          name: "standalone-default-en",
          comparison: "migrations/keyterm-elementary-computeghgh/evidence/full-frame-comparison-standalone-default-en.json",
          capture: "artifacts/full-frame/pilot-implementations/keyterm-elementary-computeghgh/default/en/capture-manifest.json",
          scenarios: {baseline: "standalone-default", comparison: "standalone-default", implementation: "default"},
          languages: {baseline: "en", comparison: "en", implementation: "en"},
          migrationBinding: null,
        },
      ],
    },
  ].flatMap(({animationId, frameCount, baseline, variants}) => variants.map((variant) => Object.freeze({
    animationId,
    frameCount,
    manifest: `migrations/${animationId}/evidence/contact-sheets/${variant.name}/manifest.json`,
    comparison: variant.comparison,
    baseline,
    capture: variant.capture,
    scenarios: Object.freeze(variant.scenarios),
    languages: Object.freeze(variant.languages),
    migrationBinding: variant.migrationBinding ? Object.freeze(variant.migrationBinding) : null,
  }))),
]);

function usage() {
  return `Usage: node scripts/finalize-contact-sheet-provenance.mjs [--check]\n\n` +
    "Refreshes exactly the 14 approved non-course contact-sheet manifests. " +
    "All sheets are prebuilt and verified before a bounded transaction updates only those manifests " +
    "and their declared coverage/migration evidence hashes. Pages must remain byte-identical.";
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

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function nodeIdentity(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNode(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function validateRelative(candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label}: path is missing`);
  invariant(!path.isAbsolute(candidate) && !candidate.includes("\\") && !candidate.includes("\0"), `${label}: path must be portable and relative`);
  invariant(path.posix.normalize(candidate) === candidate && candidate !== ".." && !candidate.startsWith("../"), `${label}: path is not normalized or escapes its root`);
  return candidate;
}

function resolveProjectPath(root, relative, label) {
  validateRelative(relative, label);
  const candidate = path.resolve(root, ...relative.split("/"));
  const relation = path.relative(root, candidate);
  invariant(relation && relation !== ".." && !relation.startsWith(`..${path.sep}`) && !path.isAbsolute(relation), `${label}: path escapes project root`);
  return candidate;
}

async function assertNoSymlinkComponents(root, candidate, label) {
  const relation = path.relative(root, candidate);
  invariant(relation && relation !== ".." && !relation.startsWith(`..${path.sep}`) && !path.isAbsolute(relation), `${label}: path escapes project root`);
  let current = root;
  for (const part of relation.split(path.sep)) {
    current = path.join(current, part);
    const info = await lstat(current);
    invariant(!info.isSymbolicLink(), `${label}: symbolic-link component is forbidden (${current})`);
  }
  const [rootReal, candidateReal] = await Promise.all([realpath(root), realpath(candidate)]);
  const realRelation = path.relative(rootReal, candidateReal);
  invariant(realRelation && realRelation !== ".." && !realRelation.startsWith(`..${path.sep}`) && !path.isAbsolute(realRelation), `${label}: resolved path escapes project root`);
}

async function captureRegularFile(root, candidate, label, {expectedSha256, requireSingleLink = true} = {}) {
  await assertNoSymlinkComponents(root, candidate, label);
  const first = await lstat(candidate, {bigint: true});
  invariant(first.isFile() && !first.isSymbolicLink(), `${label}: must be a regular non-symbolic-link file`);
  if (requireSingleLink) invariant(first.nlink === 1n, `${label}: must not be hard-linked`);
  const bytes = await readFile(candidate);
  const digest = sha256(bytes);
  if (expectedSha256 !== undefined) invariant(digest === expectedSha256, `${label}: SHA-256 mismatch`);
  const second = await lstat(candidate, {bigint: true});
  invariant(
    second.isFile() && !second.isSymbolicLink() && sameNode(nodeIdentity(first), nodeIdentity(second)) &&
      first.size === second.size && first.mode === second.mode && first.nlink === second.nlink &&
      first.mtimeNs === second.mtimeNs && first.ctimeNs === second.ctimeNs,
    `${label}: file identity changed while inspected`,
  );
  return {
    file: candidate,
    bytes,
    sha256: digest,
    node: nodeIdentity(second),
    size: String(second.size),
    mode: Number(second.mode & 0o777n),
    nlink: String(second.nlink),
    mtimeNs: String(second.mtimeNs),
    ctimeNs: String(second.ctimeNs),
  };
}

async function assertSnapshotCurrent(root, snapshot, label, {allowBackupLink = false} = {}) {
  await assertNoSymlinkComponents(root, snapshot.file, label);
  const info = await lstat(snapshot.file, {bigint: true});
  invariant(info.isFile() && !info.isSymbolicLink(), `${label}: target is no longer a regular file`);
  invariant(sameNode(nodeIdentity(info), snapshot.node), `${label}: inode changed after preflight`);
  invariant(String(info.size) === snapshot.size && Number(info.mode & 0o777n) === snapshot.mode, `${label}: size or mode changed after preflight`);
  invariant(String(info.mtimeNs) === snapshot.mtimeNs, `${label}: modification time changed after preflight`);
  if (!allowBackupLink) invariant(String(info.ctimeNs) === snapshot.ctimeNs, `${label}: change time changed after preflight`);
  invariant(info.nlink === (allowBackupLink ? 2n : 1n), `${label}: hard-link count changed after preflight`);
  invariant(sha256(await readFile(snapshot.file)) === snapshot.sha256, `${label}: bytes changed after preflight`);
}

function exactMapping(source, implementation) {
  return source === implementation ? null : {baseline: source, implementation};
}

function sourceRecord(manifest, key, label) {
  const record = manifest.sourceEvidence?.[key];
  invariant(record && typeof record.file === "string" && SHA256_PATTERN.test(record.sha256 || ""), `${label}: sourceEvidence.${key} is invalid`);
  return record;
}

async function trackFile(root, relative, label, trackedInputs, expectedSha256) {
  const file = resolveProjectPath(root, relative, label);
  const snapshot = await captureRegularFile(root, file, label, {expectedSha256});
  const prior = trackedInputs.get(file);
  if (prior) invariant(prior.sha256 === snapshot.sha256 && sameNode(prior.node, snapshot.node), `${label}: duplicate path changed identity`);
  else trackedInputs.set(file, snapshot);
  return snapshot;
}

async function readJsonDocument(root, relative, label, trackedInputs, expectedSha256) {
  const snapshot = await trackFile(root, relative, label, trackedInputs, expectedSha256);
  return {...snapshot, value: JSON.parse(snapshot.bytes.toString("utf8"))};
}

function assertTargetRegistry(targets) {
  invariant(targets === CONTACT_SHEET_PROVENANCE_TARGETS, "Production finalizer target registry cannot be replaced");
  invariant(targets.length === 14, `Expected exactly 14 contact-sheet targets, received ${targets.length}`);
  invariant(new Set(targets.map(({manifest}) => manifest)).size === 14, "Contact-sheet target paths must be unique");
  invariant(new Set(targets.map(({animationId}) => animationId)).size === 6, "Expected exactly six affected migrations");
}

async function inspectAndPrebuildTarget({root, temporaryRoot, target, index, trackedInputs}) {
  const generatorFile = path.join(root, "scripts", "build-engineering-contact-sheet.mjs");
  const manifestFile = resolveProjectPath(root, target.manifest, `${target.animationId}: contact-sheet manifest`);
  const original = await captureRegularFile(root, manifestFile, `${target.animationId}: contact-sheet manifest`);
  const manifest = JSON.parse(original.bytes.toString("utf8"));
  invariant(manifest.schemaVersion === 1 && manifest.evidenceType === "full-frame-contact-sheet", `${target.manifest}: unsupported contact-sheet schema`);
  invariant(manifest.animationId === target.animationId, `${target.manifest}: animationId mismatch`);
  invariant(Number.isFinite(Date.parse(manifest.generatedAt || "")), `${target.manifest}: generatedAt must be preserved as a valid ISO timestamp`);
  invariant(manifest.generator?.name === "build-engineering-contact-sheet" && manifest.generator?.script === "scripts/build-engineering-contact-sheet.mjs", `${target.manifest}: generator identity mismatch`);
  invariant(SHA256_PATTERN.test(manifest.generator?.scriptSha256 || ""), `${target.manifest}: generator SHA-256 is invalid`);
  invariant(manifest.contract?.frameCount === target.frameCount && manifest.contract?.framesPerPage === 10 && manifest.contract?.pageColumns === 2, `${target.manifest}: pagination or frame contract mismatch`);
  const expectedBaselineAuthority = target.baselineAuthority ?? "original-swf-adobe-flash-player-runtime";
  invariant(manifest.contract?.baselineAuthority === expectedBaselineAuthority, `${target.manifest}: baseline authority differs from the approved registry`);

  const comparisonRecord = sourceRecord(manifest, "comparison", target.manifest);
  const baselineSourceKey = target.baselineSourceKey ?? "adobeBaselineReport";
  const recordedBaseline = sourceRecord(manifest, baselineSourceKey, target.manifest);
  if (baselineSourceKey === "adobeBaselineReport") {
    const baselineRecord = manifest.sourceEvidence?.baselineReport;
    if (baselineRecord !== undefined) {
      invariant(baselineRecord.file === recordedBaseline.file && baselineRecord.sha256 === recordedBaseline.sha256, `${target.manifest}: duplicate baseline source records disagree`);
    }
  } else {
    invariant(manifest.sourceEvidence?.adobeBaselineReport === undefined, `${target.manifest}: source-composited baseline must not be relabeled as a pure Adobe report`);
  }
  const captureRecord = sourceRecord(manifest, "implementationCaptureManifest", target.manifest);
  invariant(comparisonRecord.file === target.comparison, `${target.manifest}: comparison path differs from the approved registry`);
  invariant(recordedBaseline.file === target.baseline, `${target.manifest}: baseline path differs from the approved registry`);
  invariant(captureRecord.file === target.capture, `${target.manifest}: capture path differs from the approved registry`);

  const comparison = await readJsonDocument(root, target.comparison, `${target.manifest}: comparison`, trackedInputs, comparisonRecord.sha256);
  const baseline = await readJsonDocument(root, target.baseline, `${target.manifest}: baseline`, trackedInputs, recordedBaseline.sha256);
  const capture = await readJsonDocument(root, target.capture, `${target.manifest}: capture`, trackedInputs, captureRecord.sha256);
  invariant(comparison.value.animationId === target.animationId && baseline.value.animationId === target.animationId, `${target.manifest}: source animation identity mismatch`);
  invariant(comparison.value.scenario === target.scenarios.comparison && baseline.value.runtime?.scenario === target.scenarios.baseline && capture.value.scenario === target.scenarios.implementation, `${target.manifest}: source scenario identity differs from the approved registry`);
  invariant(comparison.value.language === target.languages.comparison && baseline.value.runtime?.lang === target.languages.baseline && capture.value.language === target.languages.implementation, `${target.manifest}: source language identity differs from the approved registry`);
  invariant(comparison.value.contract?.expectedFrameCount === target.frameCount && baseline.value.runtime?.frameCount === target.frameCount && capture.value.captured?.length === target.frameCount, `${target.manifest}: source frame counts differ from the approved registry`);

  for (const [frameIndex, frame] of comparison.value.frames.entries()) {
    invariant(frame.frame === frameIndex + 1, `${target.manifest}: comparison frames are not one-indexed and sequential`);
    for (const [kind, fileKey, hashKey] of [
      ["baseline", "baselineFile", "baselineSha256"],
      ["implementation", "implementationFile", "implementationSha256"],
      ["diff", "diffFile", "diffSha256"],
    ]) {
      const relative = validateRelative(frame[fileKey], `${target.manifest}: ${kind} frame ${frame.frame}`);
      invariant(SHA256_PATTERN.test(frame[hashKey] || ""), `${target.manifest}: ${kind} frame ${frame.frame} hash is invalid`);
      await trackFile(root, relative, `${target.manifest}: ${kind} frame ${frame.frame}`, trackedInputs, frame[hashKey]);
    }
  }

  const temporaryOutput = path.join(temporaryRoot, String(index).padStart(2, "0"), "manifest.json");
  const generated = await buildEngineeringContactSheet({
    comparisonFile: comparison.file,
    baselineReportFile: baseline.file,
    captureManifestFile: capture.file,
    outputFile: temporaryOutput,
    projectRoot: root,
    framesPerPage: manifest.contract.framesPerPage,
    pageColumns: manifest.contract.pageColumns,
    scenarioEquivalence: exactMapping(target.scenarios.baseline, target.scenarios.implementation),
    languageEquivalence: exactMapping(target.languages.baseline, target.languages.implementation),
    generatedAt: manifest.generatedAt,
    generatorScriptFile: generatorFile,
  });
  invariant(generated.generator.scriptSha256 === sha256(await readFile(generatorFile)), `${target.manifest}: generated producer hash is not current`);
  invariant(generated.pages.length === manifest.pages?.length, `${target.manifest}: generated page count changed`);
  for (let pageIndex = 0; pageIndex < generated.pages.length; pageIndex += 1) {
    const oldPage = manifest.pages[pageIndex];
    const newPage = generated.pages[pageIndex];
    const expectedPage = portable(path.posix.join(path.posix.dirname(target.manifest), `page-${String(pageIndex + 1).padStart(2, "0")}.png`));
    invariant(oldPage.page === pageIndex + 1 && oldPage.file === expectedPage, `${target.manifest}: existing page path is not canonical`);
    invariant(newPage.page === oldPage.page && newPage.sha256 === oldPage.sha256 && newPage.width === oldPage.width && newPage.height === oldPage.height && JSON.stringify(newPage.frames) === JSON.stringify(oldPage.frames), `${target.manifest}: regenerated page metadata changed`);
    const oldPageFile = resolveProjectPath(root, oldPage.file, `${target.manifest}: page ${oldPage.page}`);
    const oldPageSnapshot = await captureRegularFile(root, oldPageFile, `${target.manifest}: page ${oldPage.page}`, {expectedSha256: oldPage.sha256});
    const prior = trackedInputs.get(oldPageFile);
    if (prior) invariant(prior.sha256 === oldPageSnapshot.sha256 && sameNode(prior.node, oldPageSnapshot.node), `${target.manifest}: duplicate page identity changed`);
    else trackedInputs.set(oldPageFile, oldPageSnapshot);
    const temporaryPageFile = path.join(path.dirname(temporaryOutput), path.basename(newPage.file));
    invariant((await readFile(temporaryPageFile)).equals(oldPageSnapshot.bytes), `${target.manifest}: regenerated page bytes are not byte-identical`);
    newPage.file = oldPage.file;
  }

  invariant(generated.sourceEvidence.comparison.file === target.comparison && generated.sourceEvidence.comparison.sha256 === comparison.sha256, `${target.manifest}: regenerated comparison binding changed`);
  invariant(generated.sourceEvidence.baselineReport.file === target.baseline && generated.sourceEvidence.baselineReport.sha256 === baseline.sha256, `${target.manifest}: regenerated baseline binding changed`);
  if (baselineSourceKey === "adobeBaselineReport") {
    invariant(generated.sourceEvidence.adobeBaselineReport.file === target.baseline && generated.sourceEvidence.adobeBaselineReport.sha256 === baseline.sha256, `${target.manifest}: regenerated Adobe binding changed`);
  } else {
    invariant(generated.sourceEvidence.adobeBaselineReport === undefined, `${target.manifest}: regenerated source-composited baseline was relabeled as pure Adobe`);
  }
  invariant(generated.sourceEvidence.implementationCaptureManifest.file === target.capture && generated.sourceEvidence.implementationCaptureManifest.sha256 === capture.sha256, `${target.manifest}: regenerated capture binding changed`);
  const intended = Buffer.from(`${JSON.stringify(generated, null, 2)}\n`);
  return {
    target,
    filePath: manifestFile,
    expectedBefore: original.bytes,
    intended,
    beforeSha256: original.sha256,
    afterSha256: sha256(intended),
    pageCount: generated.pages.length,
    frameCount: generated.contract.frameCount,
  };
}

function withoutAllowedEvidenceHashes(manifest, allowed) {
  const clone = structuredClone(manifest);
  for (const key of allowed) clone.evidence.evidenceHashes[key] = "<allowed-contact-sheet-provenance-refresh>";
  return clone;
}

function coverageCombination(coverage, binding, animationId) {
  const matches = (coverage.combinations || []).filter(({scenario, language, seed}) =>
    scenario === binding.scenario && language === binding.language && String(seed) === binding.seed);
  invariant(matches.length === 1, `${animationId}: coverage must contain exactly one bounded ${binding.scenario}/${binding.language}/seed${binding.seed} combination`);
  return matches[0];
}

function withoutAllowedCoverageHash(coverage, binding, animationId) {
  const clone = structuredClone(coverage);
  coverageCombination(clone, binding, animationId).contactSheetManifestSha256 = "<allowed-contact-sheet-provenance-refresh>";
  return clone;
}

async function buildCoveragePlans(root, sheetPlans) {
  const boundSheets = sheetPlans.filter(({target}) => target.coverageBinding);
  invariant(boundSheets.length === 4, `Expected exactly four formula Spanish coverage bindings, received ${boundSheets.length}`);
  invariant(new Set(boundSheets.map(({target}) => target.coverageBinding.file)).size === 4, "Formula Spanish coverage paths must be unique");
  const plans = [];
  for (const sheet of boundSheets) {
    const {animationId, coverageBinding: binding} = sheet.target;
    const filePath = resolveProjectPath(root, binding.file, `${animationId}: full-frame coverage`);
    const original = await captureRegularFile(root, filePath, `${animationId}: full-frame coverage`);
    const before = JSON.parse(original.bytes.toString("utf8"));
    invariant(before.animationId === animationId, `${animationId}: full-frame coverage identity mismatch`);
    const beforeCombination = coverageCombination(before, binding, animationId);
    const expectedSheet = path.posix.relative(`migrations/${animationId}`, sheet.target.manifest);
    invariant(beforeCombination.contactSheetManifest === expectedSheet, `${animationId}: coverage does not point to the bounded Spanish contact sheet`);
    invariant(beforeCombination.contactSheetManifestSha256 === sheet.beforeSha256, `${animationId}: coverage Spanish contact-sheet hash is stale before refresh`);
    const after = structuredClone(before);
    coverageCombination(after, binding, animationId).contactSheetManifestSha256 = sheet.afterSha256;
    invariant(
      JSON.stringify(withoutAllowedCoverageHash(before, binding, animationId)) === JSON.stringify(withoutAllowedCoverageHash(after, binding, animationId)),
      `${animationId}: attempted to change full-frame coverage outside the approved Spanish contact-sheet hash`,
    );
    const intended = Buffer.from(`${JSON.stringify(after, null, 2)}\n`);
    plans.push({
      target: {animationId, manifest: binding.file},
      binding,
      filePath,
      expectedBefore: original.bytes,
      intended,
      beforeSha256: original.sha256,
      afterSha256: sha256(intended),
      contactSheetBeforeSha256: sheet.beforeSha256,
      contactSheetAfterSha256: sheet.afterSha256,
    });
  }
  return plans;
}

async function buildMigrationPlans(root, sheetPlans, coveragePlans) {
  const byAnimation = new Map();
  for (const plan of sheetPlans) {
    if (!plan.target.migrationBinding) continue;
    const values = byAnimation.get(plan.target.animationId) ?? {sheets: [], coverages: []};
    values.sheets.push(plan);
    byAnimation.set(plan.target.animationId, values);
  }
  for (const plan of coveragePlans) {
    const values = byAnimation.get(plan.target.animationId) ?? {sheets: [], coverages: []};
    values.coverages.push(plan);
    byAnimation.set(plan.target.animationId, values);
  }
  const plans = [];
  for (const [animationId, bindings] of byAnimation) {
    const relative = `migrations/${animationId}/migration.json`;
    const filePath = resolveProjectPath(root, relative, `${animationId}: migration manifest`);
    const original = await captureRegularFile(root, filePath, `${animationId}: migration manifest`);
    const before = JSON.parse(original.bytes.toString("utf8"));
    invariant(before.animationId === animationId && before.id === animationId, `${animationId}: migration identity mismatch`);
    const after = structuredClone(before);
    const allowed = new Set();
    for (const sheet of bindings.sheets) {
      const {pathKey, hashKey} = sheet.target.migrationBinding;
      const expectedRelative = path.posix.relative(`migrations/${animationId}`, sheet.target.manifest);
      invariant(before.evidence?.[pathKey] === expectedRelative, `${animationId}: evidence.${pathKey} does not point to the bounded contact sheet`);
      invariant(before.evidence?.evidenceHashes?.[hashKey] === sheet.beforeSha256, `${animationId}: evidence hash ${hashKey} is stale before refresh`);
      after.evidence.evidenceHashes[hashKey] = sheet.afterSha256;
      allowed.add(hashKey);
    }
    for (const coverage of bindings.coverages) {
      const expectedRelative = path.posix.relative(`migrations/${animationId}`, coverage.target.manifest);
      invariant(before.evidence?.[coverage.binding.pathKey] === expectedRelative, `${animationId}: evidence.${coverage.binding.pathKey} does not point to the bounded coverage file`);
      invariant(before.evidence?.evidenceHashes?.[coverage.binding.hashKey] === coverage.beforeSha256, `${animationId}: evidence hash ${coverage.binding.hashKey} is stale before refresh`);
      after.evidence.evidenceHashes[coverage.binding.hashKey] = coverage.afterSha256;
      allowed.add(coverage.binding.hashKey);
    }
    const allowedHashes = [...allowed];
    invariant(
      JSON.stringify(withoutAllowedEvidenceHashes(before, allowedHashes)) === JSON.stringify(withoutAllowedEvidenceHashes(after, allowedHashes)),
      `${animationId}: attempted to change a migration field outside the approved contact-sheet evidence hashes`,
    );
    const intended = Buffer.from(`${JSON.stringify(after, null, 2)}\n`);
    plans.push({
      target: {animationId, manifest: relative},
      filePath,
      expectedBefore: original.bytes,
      intended,
      beforeSha256: original.sha256,
      afterSha256: sha256(intended),
      allowedHashes,
    });
  }
  invariant(plans.length === 6, `Expected exactly six migration hash updates, received ${plans.length}`);
  return plans;
}

async function removeOwnedIfPresent(root, candidate, ownership, label) {
  try {
    const observed = await captureRegularFile(root, candidate, label, {expectedSha256: ownership.sha256, requireSingleLink: false});
    invariant(sameNode(observed.node, ownership.node), `${label}: inode is not transaction-owned`);
    await unlink(candidate);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function writeOwnedReplacementTransaction(root, entries, {
  beforeCommit,
  beforeCommitEntry,
  afterCommitEntry,
} = {}) {
  invariant(Array.isArray(entries) && entries.length > 0, "Contact-sheet transaction has no entries");
  invariant(new Set(entries.map(({filePath}) => filePath)).size === entries.length, "Contact-sheet transaction has duplicate targets");
  const transactionId = `${process.pid}-${randomUUID()}`;
  const prepared = [];
  try {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const original = await captureRegularFile(root, entry.filePath, `${entry.target.animationId}: transaction target`);
      invariant(original.bytes.equals(entry.expectedBefore), `${entry.target.animationId}: transaction target changed after preflight`);
      const temporary = `${entry.filePath}.contact-sheet-${transactionId}-${index}.tmp`;
      const backup = `${entry.filePath}.contact-sheet-${transactionId}-${index}.bak`;
      for (const [candidate, label] of [[temporary, "temporary"], [backup, "backup"]]) {
        try {
          await lstat(candidate);
          throw new Error(`${entry.target.animationId}: transaction ${label} path already exists`);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
      const handle = await open(temporary, flags, original.mode);
      let temporaryOwnership;
      try {
        await handle.writeFile(entry.intended);
        await handle.sync();
        const info = await handle.stat({bigint: true});
        temporaryOwnership = {node: nodeIdentity(info), sha256: sha256(entry.intended), mode: original.mode};
      } finally {
        await handle.close();
      }
      await chmod(temporary, original.mode);
      const temporarySnapshot = await captureRegularFile(root, temporary, `${entry.target.animationId}: transaction temporary`, {expectedSha256: temporaryOwnership.sha256});
      invariant(sameNode(temporarySnapshot.node, temporaryOwnership.node), `${entry.target.animationId}: transaction temporary inode changed`);
      prepared.push({...entry, original, temporary, backup, temporaryOwnership, backupLinked: false, committed: false, rollbackConflict: false});
    }

    if (beforeCommit) await beforeCommit();
    for (let index = 0; index < prepared.length; index += 1) {
      const entry = prepared[index];
      if (beforeCommitEntry) await beforeCommitEntry(entry, index);
      await assertSnapshotCurrent(root, entry.original, `${entry.target.animationId}: transaction target`);
      await link(entry.filePath, entry.backup);
      entry.backupLinked = true;
      const backupInfo = await lstat(entry.backup, {bigint: true});
      invariant(sameNode(nodeIdentity(backupInfo), entry.original.node) && backupInfo.nlink === 2n, `${entry.target.animationId}: transaction backup does not own the original inode`);
      await assertSnapshotCurrent(root, entry.original, `${entry.target.animationId}: transaction target`, {allowBackupLink: true});
      await rename(entry.temporary, entry.filePath);
      entry.committed = true;
      const committed = await captureRegularFile(root, entry.filePath, `${entry.target.animationId}: committed target`, {expectedSha256: entry.temporaryOwnership.sha256});
      invariant(sameNode(committed.node, entry.temporaryOwnership.node), `${entry.target.animationId}: committed target inode is not transaction-owned`);
      if (afterCommitEntry) await afterCommitEntry(entry, index);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of [...prepared].reverse()) {
      try {
        if (entry.committed) {
          let current;
          try {
            current = await captureRegularFile(root, entry.filePath, `${entry.target.animationId}: rollback target`, {requireSingleLink: true});
          } catch (readError) {
            if (readError.code !== "ENOENT") throw readError;
            current = null;
          }
          if (!current || current.sha256 !== entry.temporaryOwnership.sha256 || !sameNode(current.node, entry.temporaryOwnership.node)) {
            entry.rollbackConflict = true;
            rollbackErrors.push(`${entry.filePath}: concurrent target bytes preserved; original remains at ${entry.backup}`);
            continue;
          }
          const backup = await captureRegularFile(root, entry.backup, `${entry.target.animationId}: rollback backup`, {expectedSha256: entry.original.sha256, requireSingleLink: true});
          invariant(sameNode(backup.node, entry.original.node), `${entry.target.animationId}: rollback backup inode changed`);
          await rename(entry.backup, entry.filePath);
          entry.backupLinked = false;
          const restored = await captureRegularFile(root, entry.filePath, `${entry.target.animationId}: restored target`, {expectedSha256: entry.original.sha256});
          invariant(sameNode(restored.node, entry.original.node), `${entry.target.animationId}: restored target inode changed`);
        } else if (entry.backupLinked) {
          const targetInfo = await lstat(entry.filePath, {bigint: true});
          const backupInfo = await lstat(entry.backup, {bigint: true});
          if (!sameNode(nodeIdentity(targetInfo), entry.original.node) || !sameNode(nodeIdentity(backupInfo), entry.original.node)) {
            entry.rollbackConflict = true;
            rollbackErrors.push(`${entry.filePath}: concurrent pre-commit change preserved; original remains at ${entry.backup}`);
            continue;
          }
          await unlink(entry.backup);
          entry.backupLinked = false;
          const restored = await captureRegularFile(root, entry.filePath, `${entry.target.animationId}: uncommitted target`, {expectedSha256: entry.original.sha256});
          invariant(sameNode(restored.node, entry.original.node), `${entry.target.animationId}: uncommitted target inode changed`);
        }
      } catch (rollbackError) {
        entry.rollbackConflict = entry.backupLinked;
        rollbackErrors.push(`${entry.filePath}: ${rollbackError.message}`);
      }
    }
    for (const entry of prepared) {
      try {
        if (!entry.committed) await removeOwnedIfPresent(root, entry.temporary, entry.temporaryOwnership, `${entry.target.animationId}: transaction temporary`);
        if (entry.backupLinked && !entry.rollbackConflict) await removeOwnedIfPresent(root, entry.backup, entry.original, `${entry.target.animationId}: transaction backup`);
      } catch (cleanupError) {
        rollbackErrors.push(`${entry.filePath}: cleanup failed (${cleanupError.message})`);
      }
    }
    if (rollbackErrors.length) throw new Error(`${error.message}\nContact-sheet transaction rollback failed:\n${rollbackErrors.join("\n")}`);
    throw error;
  }

  for (const entry of prepared) {
    const backup = await captureRegularFile(root, entry.backup, `${entry.target.animationId}: committed backup`, {expectedSha256: entry.original.sha256, requireSingleLink: true});
    invariant(sameNode(backup.node, entry.original.node), `${entry.target.animationId}: committed backup inode changed before cleanup`);
    await unlink(entry.backup);
  }
}

async function assertTrackedInputsCurrent(root, trackedInputs) {
  for (const snapshot of trackedInputs.values()) {
    await assertSnapshotCurrent(root, snapshot, `Protected contact-sheet input ${snapshot.file}`);
  }
  const generatorFile = path.join(root, "scripts", "build-engineering-contact-sheet.mjs");
  const generator = await captureRegularFile(root, generatorFile, "Contact-sheet generator");
  invariant(generator.sha256 === sha256(await readFile(EXECUTED_CONTACT_SHEET_GENERATOR)), "Contact-sheet generator differs from the executing implementation");
}

async function safeRemoveTemporaryRoot(temporaryRoot) {
  if (!temporaryRoot) return;
  const actualParent = await realpath(path.dirname(temporaryRoot));
  invariant(actualParent === await realpath(os.tmpdir()), "Refusing to remove a non-system temporary directory");
  invariant(path.basename(temporaryRoot).startsWith("help-math-contact-provenance-"), "Refusing to remove an unexpected temporary directory");
  await rm(temporaryRoot, {recursive: true, force: true});
}

export async function finalizeContactSheetProvenance({
  root = PROJECT_ROOT,
  check = false,
  targets = CONTACT_SHEET_PROVENANCE_TARGETS,
  transactionHooks,
} = {}) {
  root = path.resolve(root);
  assertTargetRegistry(targets);
  invariant(await realpath(root) === root, "Project root must be a canonical real path");
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-contact-provenance-"));
  const trackedInputs = new Map();
  try {
    const generatorFile = path.join(root, "scripts", "build-engineering-contact-sheet.mjs");
    const generatorSnapshot = await captureRegularFile(root, generatorFile, "Contact-sheet generator");
    invariant(generatorSnapshot.sha256 === sha256(await readFile(EXECUTED_CONTACT_SHEET_GENERATOR)), "Contact-sheet generator differs from the executing implementation");
    trackedInputs.set(generatorFile, generatorSnapshot);
    const sheetPlans = [];
    for (let index = 0; index < targets.length; index += 1) {
      sheetPlans.push(await inspectAndPrebuildTarget({root, temporaryRoot, target: targets[index], index, trackedInputs}));
    }
    const coveragePlans = await buildCoveragePlans(root, sheetPlans);
    const migrationPlans = await buildMigrationPlans(root, sheetPlans, coveragePlans);
    const entries = [...sheetPlans, ...coveragePlans, ...migrationPlans];
    const changed = entries.filter(({expectedBefore, intended}) => !expectedBefore.equals(intended));
    if (check) {
      invariant(changed.length === 0, `${changed.length} contact-sheet provenance target(s) are stale`);
    } else if (changed.length) {
      await assertTrackedInputsCurrent(root, trackedInputs);
      await writeOwnedReplacementTransaction(root, changed, {
        ...transactionHooks,
        beforeCommit: async () => {
          await assertTrackedInputsCurrent(root, trackedInputs);
          if (transactionHooks?.beforeCommit) await transactionHooks.beforeCommit();
        },
      });
    }
    return {
      mode: check ? "check" : "write",
      targetCount: sheetPlans.length,
      coverageCount: coveragePlans.length,
      migrationCount: migrationPlans.length,
      changedCount: changed.length,
      generatorSha256: sha256(await readFile(generatorFile)),
      sheets: sheetPlans.map(({target, beforeSha256, afterSha256, pageCount, frameCount, expectedBefore, intended}) => ({
        animationId: target.animationId,
        manifest: target.manifest,
        frameCount,
        pageCount,
        beforeSha256,
        afterSha256,
        changed: !expectedBefore.equals(intended),
      })),
      coverage: coveragePlans.map(({target, beforeSha256, afterSha256, contactSheetBeforeSha256, contactSheetAfterSha256, expectedBefore, intended}) => ({
        animationId: target.animationId,
        manifest: target.manifest,
        contactSheetBeforeSha256,
        contactSheetAfterSha256,
        beforeSha256,
        afterSha256,
        changed: !expectedBefore.equals(intended),
      })),
      migrations: migrationPlans.map(({target, beforeSha256, afterSha256, allowedHashes, expectedBefore, intended}) => ({
        animationId: target.animationId,
        manifest: target.manifest,
        allowedHashes,
        beforeSha256,
        afterSha256,
        changed: !expectedBefore.equals(intended),
      })),
    };
  } finally {
    await safeRemoveTemporaryRoot(temporaryRoot);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  console.log(JSON.stringify(await finalizeContactSheetProvenance(options), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
