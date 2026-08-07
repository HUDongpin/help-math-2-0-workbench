#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {technicalManifestSha256} from "./evidence-projections.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256 = /^[a-f0-9]{64}$/;
const TARGET_FIELDS = Object.freeze([
  "assetManifestSha256",
  "bilingualVisualDispositionSha256",
]);
const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "authoritativeOriginalRuntimeBaseline",
  "bilingualVisualParity",
  "spanishTranslationAccepted",
  "audioAcceptance",
  "naturalOriginalRuntimeTraversal",
  "interactionBehaviorParity",
  "scoringParity",
  "replayParity",
  "fullFrameCoverage",
  "rmseAcceptance",
  "humanVisualReview",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictMigrationCompletion",
]);

export const GS002_ROOT_STRUCTURAL_PIN_CONTRACT = Object.freeze({
  animationId: "course-g04-l09-gs-002",
  migrationPath: "migrations/course-g04-l09-gs-002/migration.json",
  assetManifestPath:
    "public/flash-assets/courses/course-g04-l09-gs-002/root-frames/manifest.json",
  migrationDispositionPath: "audit/bilingual-visual-source-disposition.json",
  dispositionPath:
    "migrations/course-g04-l09-gs-002/audit/bilingual-visual-source-disposition.json",
  sourceSwf:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf",
  sourceSwfSha256:
    "41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15",
  expectedPriorAssetManifestSha256:
    "28a52abe6ab6edb06391dddde1353db2643cf5b806452da1ea1008f44da253e7",
  expectedCurrentAssetManifestSha256:
    "c4f35d29dd457a07710de52af06372090ae247c4e2f8adad9a0daa50386d3f18",
  expectedPriorDispositionSha256:
    "f9d371213af384eadfcfc4d68c516d9a1aeeec9b98904bb94ae411b1934c43e5",
  expectedCurrentDispositionSha256:
    "e70cf40b8389cffb6ab2e7ebd25bb2256e97d767d12e76d07854cd1185d1af81",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function validatePortablePath(relative, label) {
  invariant(
    typeof relative === "string" && relative.length > 0,
    `${label}: path is missing`,
  );
  invariant(
    !path.isAbsolute(relative)
      && !relative.includes("\\")
      && !relative.includes("\0"),
    `${label}: path must be portable and relative`,
  );
  invariant(
    path.posix.normalize(relative) === relative
      && relative !== ".."
      && !relative.startsWith("../"),
    `${label}: path is not normalized or escapes the project root`,
  );
}

async function resolveRegularFile(root, relative, label) {
  validatePortablePath(relative, label);
  const rootReal = await realpath(root);
  const file = path.join(rootReal, ...relative.split("/"));
  const relativeToRoot = path.relative(rootReal, file);
  invariant(
    relativeToRoot !== ".."
      && !relativeToRoot.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relativeToRoot),
    `${label}: path escapes the project root`,
  );
  const [linkInfo, fileInfo, actual] = await Promise.all([
    lstat(file),
    stat(file),
    realpath(file),
  ]);
  invariant(!linkInfo.isSymbolicLink(), `${label}: symbolic links are forbidden`);
  invariant(fileInfo.isFile(), `${label}: expected a regular file`);
  invariant(
    actual === file,
    `${label}: intermediate symbolic links or path drift are forbidden`,
  );
  return {file, mode: fileInfo.mode & 0o777};
}

async function readJsonRecord(root, relative, label) {
  const resolved = await resolveRegularFile(root, relative, label);
  const bytes = await readFile(resolved.file);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected one JSON object`,
  );
  return {
    ...resolved,
    bytes,
    text: bytes.toString("utf8"),
    value,
    sha256: sha256(bytes),
  };
}

async function validateContract(root, contract) {
  for (const field of [
    "migrationPath",
    "assetManifestPath",
    "migrationDispositionPath",
    "dispositionPath",
    "sourceSwf",
  ]) {
    validatePortablePath(contract[field], field);
  }
  for (const field of [
    "sourceSwfSha256",
    "expectedPriorAssetManifestSha256",
    "expectedCurrentAssetManifestSha256",
    "expectedPriorDispositionSha256",
    "expectedCurrentDispositionSha256",
  ]) {
    invariant(SHA256.test(contract[field] || ""), `${field}: invalid SHA-256`);
  }
  invariant(
    contract.expectedPriorAssetManifestSha256
      !== contract.expectedCurrentAssetManifestSha256,
    "asset-manifest prior/current SHA-256 values must differ",
  );
  invariant(
    contract.expectedPriorDispositionSha256
      !== contract.expectedCurrentDispositionSha256,
    "disposition prior/current SHA-256 values must differ",
  );
  invariant(
    path.posix.join(
      path.posix.dirname(contract.migrationPath),
      contract.migrationDispositionPath,
    ) === contract.dispositionPath,
    "GS002 disposition project and migration-relative paths disagree",
  );

  if (await realpath(root) === await realpath(PROJECT_ROOT)) {
    invariant(
      canonicalJson(contract) === canonicalJson(GS002_ROOT_STRUCTURAL_PIN_CONTRACT),
      "production GS002 root-structural pin contract changed",
    );
  }
}

function validateRootAssetManifest(record, dispositionRecord, contract) {
  const manifest = record.value;
  invariant(
    record.sha256 === contract.expectedCurrentAssetManifestSha256,
    `GS002 root asset manifest SHA changed: expected ${contract.expectedCurrentAssetManifestSha256}, observed ${record.sha256}`,
  );
  invariant(
    manifest.schemaVersion === 1
      && manifest.evidenceType
        === "ffdec-structural-root-frame-implementation-assets"
      && manifest.animationId === contract.animationId,
    "GS002 root asset manifest identity changed",
  );
  invariant(
    manifest.classification
      === "engineering-structural-inspection-not-strict-acceptance",
    "GS002 root asset manifest classification changed",
  );
  invariant(
    manifest.source?.swf === contract.sourceSwf
      && manifest.source?.swfSha256 === contract.sourceSwfSha256,
    "GS002 root asset manifest source identity changed",
  );
  invariant(
    manifest.generator?.path === "scripts/build-gs002-ffdec-root-frame-assets.mjs"
      && SHA256.test(manifest.generator?.sha256 || ""),
    "GS002 root asset manifest generator identity changed",
  );
  invariant(
    manifest.visualDisposition?.path === contract.dispositionPath
      && manifest.visualDisposition?.sha256 === dispositionRecord.sha256
      && manifest.visualDisposition?.status
        === "verified-root-source-shared-untranslated-visual"
      && manifest.visualDisposition?.visualClassification
        === "source-shared-untranslated-visual"
      && manifest.visualDisposition?.strictAcceptanceEffect === "none",
    "GS002 root asset manifest disposition binding changed",
  );
  invariant(
    manifest.authority?.kind === "ffdec-static-root-timeline-structural-render"
      && manifest.authority?.actionScriptExecuted === false
      && manifest.authority?.originalRuntimeBaseline === false
      && manifest.authority?.naturalPlaybackClaimed === false,
    "GS002 root asset manifest original-runtime authority must remain false",
  );
  invariant(
    manifest.runtime?.stage?.width === 800
      && manifest.runtime?.stage?.height === 600
      && manifest.runtime?.fps === 12
      && manifest.runtime?.frameDomain === "root"
      && manifest.runtime?.frameCount === 10
      && manifest.runtime?.frameNumbering === "one-indexed"
      && canonicalJson(manifest.runtime?.supportedLanguages) === canonicalJson(["en", "es"])
      && manifest.runtime?.visualLocalizationStatus
        === "source-shared-untranslated-visual"
      && manifest.runtime?.spanishTranslationSupplied === false
      && manifest.runtime?.naturalPlaybackStopFrame === 1,
    "GS002 root asset manifest runtime boundary changed",
  );
  invariant(
    Array.isArray(manifest.frames)
      && manifest.frames.length === 10
      && manifest.frames.every(
        (frame, index) =>
          frame.frame === index + 1
          && SHA256.test(frame.sha256 || "")
          && frame.width === 800
          && frame.height === 600,
      ),
    "GS002 root asset manifest frame identity changed",
  );
  invariant(
    manifest.strictAcceptanceEffect === "none",
    "GS002 root asset manifest strict acceptance effect changed",
  );
}

function validateDisposition(record, contract) {
  const disposition = record.value;
  invariant(
    record.sha256 === contract.expectedCurrentDispositionSha256,
    `GS002 bilingual disposition SHA changed: expected ${contract.expectedCurrentDispositionSha256}, observed ${record.sha256}`,
  );
  invariant(
    disposition.schemaVersion === 1
      && disposition.evidenceType === "source-shared-bilingual-visual-disposition"
      && disposition.animationId === contract.animationId
      && disposition.status === "verified-root-source-shared-untranslated-visual"
      && disposition.migrationStatusChanged === false,
    "GS002 bilingual disposition identity changed",
  );
  invariant(
    disposition.generatedFrom?.generator?.path
      === "scripts/build-gs002-root-bilingual-visual-disposition.mjs"
      && SHA256.test(disposition.generatedFrom?.generator?.sha256 || ""),
    "GS002 bilingual disposition generator identity changed",
  );
  invariant(
    disposition.generatedFrom?.sourceSwf?.path === contract.sourceSwf
      && disposition.generatedFrom?.sourceSwf?.sha256
        === contract.sourceSwfSha256,
    "GS002 bilingual disposition source identity changed",
  );
  invariant(
    disposition.generatedFrom?.sameLessonHost?.executionClaimed === false,
    "GS002 bilingual disposition original-host execution authority must remain false",
  );
  invariant(
    disposition.generatedFrom?.spanishAudio?.rendered === false
      && disposition.generatedFrom?.spanishAudio?.accepted === false,
    "GS002 bilingual disposition audio acceptance must remain false",
  );
  invariant(
    disposition.generatedFrom?.rootStructuralReport?.authority
      === "swf-static-root-timeline-render"
      && disposition.generatedFrom?.rootStructuralReport?.status
        === "structural-baseline-only",
    "GS002 bilingual disposition root report authority changed",
  );
  invariant(
    disposition.generatedFrom?.spriteCanvasAdapterSpec
      ?.spanishScopeRemainsBlocked === true,
    "GS002 bilingual disposition Spanish sprite scope must remain blocked",
  );
  invariant(
    disposition.implementationDisposition?.rootFrameAdapter
      ?.spanishTranslationSupplied === false
      && disposition.implementationDisposition?.audioRendered === false
      && disposition.implementationDisposition?.hostIntegrationStatus
        === "blocked-not-authoritatively-executed",
    "GS002 bilingual disposition implementation authority changed",
  );
  const effects = disposition.acceptanceEffects;
  invariant(
    effects && typeof effects === "object" && !Array.isArray(effects),
    "GS002 bilingual disposition acceptanceEffects is missing",
  );
  invariant(
    canonicalJson(Object.keys(effects).sort())
      === canonicalJson([...ACCEPTANCE_EFFECT_KEYS].sort()),
    "GS002 bilingual disposition acceptance effect set changed",
  );
  for (const key of ACCEPTANCE_EFFECT_KEYS) {
    invariant(
      effects[key] === false,
      `GS002 bilingual disposition ${key} must remain false`,
    );
  }
  invariant(
    typeof disposition.strictAcceptanceEffect === "string"
      && disposition.strictAcceptanceEffect.startsWith("none;"),
    "GS002 bilingual disposition strict acceptance effect changed",
  );
}

function validateMigration(record, contract) {
  const migration = record.value;
  invariant(
    migration.schemaVersion === 2
      && migration.id === contract.animationId
      && migration.animationId === contract.animationId,
    "GS002 migration identity changed",
  );
  const inspection = migration.implementation?.rootStructuralInspection;
  invariant(
    inspection && typeof inspection === "object" && !Array.isArray(inspection),
    "GS002 rootStructuralInspection is missing",
  );
  invariant(
    inspection.assetManifest === contract.assetManifestPath
      && inspection.bilingualVisualDisposition
        === contract.migrationDispositionPath,
    "GS002 rootStructuralInspection paths changed",
  );
  invariant(
    inspection.authority
      === "ffdec-static-root-timeline-structural-render-not-original-runtime"
      && inspection.originalRuntimeBaselineComplete === false
      && inspection.strictAcceptanceEffect === "none",
    "GS002 rootStructuralInspection original-runtime/acceptance authority changed",
  );
  invariant(
    inspection.frameCount === 10
      && canonicalJson(inspection.languages) === canonicalJson(["en", "es"])
      && inspection.normalPlaybackStopFrame === 1
      && inspection.spanishStatus === "source-shared-untranslated-visual"
      && inspection.spanishTranslationSupplied === false
      && inspection.spriteSpanishStatus === "blocked",
    "GS002 rootStructuralInspection scope changed",
  );
  const prior = (
    inspection.assetManifestSha256
      === contract.expectedPriorAssetManifestSha256
    && inspection.bilingualVisualDispositionSha256
      === contract.expectedPriorDispositionSha256
  );
  const current = (
    inspection.assetManifestSha256
      === contract.expectedCurrentAssetManifestSha256
    && inspection.bilingualVisualDispositionSha256
      === contract.expectedCurrentDispositionSha256
  );
  invariant(
    prior || current,
    "GS002 rootStructuralInspection pins are neither the authorized prior pair nor the current pair",
  );
  return {inspection, prior, current};
}

function replaceUniqueShaField(text, field, expected, replacement) {
  const expression = new RegExp(
    `("${field}"\\s*:\\s*")([a-f0-9]{64})(")`,
    "g",
  );
  const matches = [...text.matchAll(expression)];
  invariant(matches.length === 1, `${field}: expected exactly one SHA-256 field`);
  invariant(matches[0][2] === expected, `${field}: text/value mismatch`);
  const start = matches[0].index + matches[0][1].length;
  return `${text.slice(0, start)}${replacement}${text.slice(start + 64)}`;
}

export function redactGs002RootStructuralPins(text) {
  let redacted = text;
  for (const field of TARGET_FIELDS) {
    const expression = new RegExp(
      `("${field}"\\s*:\\s*")([a-f0-9]{64})(")`,
      "g",
    );
    const matches = [...redacted.matchAll(expression)];
    invariant(matches.length === 1, `${field}: expected exactly one SHA-256 field`);
    redacted = redacted.replace(expression, `$1<GS002:${field}>$3`);
  }
  return redacted;
}

export async function planGs002RootStructuralPinRefresh({
  root = PROJECT_ROOT,
  contract = GS002_ROOT_STRUCTURAL_PIN_CONTRACT,
} = {}) {
  await validateContract(root, contract);
  const [migrationRecord, dispositionRecord, assetRecord] = await Promise.all([
    readJsonRecord(root, contract.migrationPath, "GS002 migration manifest"),
    readJsonRecord(root, contract.dispositionPath, "GS002 bilingual disposition"),
    readJsonRecord(root, contract.assetManifestPath, "GS002 root asset manifest"),
  ]);
  validateDisposition(dispositionRecord, contract);
  validateRootAssetManifest(assetRecord, dispositionRecord, contract);
  const migrationState = validateMigration(migrationRecord, contract);
  const projectionBefore = technicalManifestSha256(migrationRecord.value);

  let updatedText = migrationRecord.text;
  if (migrationState.prior) {
    updatedText = replaceUniqueShaField(
      updatedText,
      "assetManifestSha256",
      contract.expectedPriorAssetManifestSha256,
      assetRecord.sha256,
    );
    updatedText = replaceUniqueShaField(
      updatedText,
      "bilingualVisualDispositionSha256",
      contract.expectedPriorDispositionSha256,
      dispositionRecord.sha256,
    );
  }
  const updated = JSON.parse(updatedText);
  const expected = structuredClone(migrationRecord.value);
  expected.implementation.rootStructuralInspection.assetManifestSha256
    = contract.expectedCurrentAssetManifestSha256;
  expected.implementation.rootStructuralInspection
    .bilingualVisualDispositionSha256
    = contract.expectedCurrentDispositionSha256;
  invariant(
    canonicalJson(updated) === canonicalJson(expected),
    "GS002 refresh attempted to change a non-target manifest field",
  );
  invariant(
    redactGs002RootStructuralPins(updatedText)
      === redactGs002RootStructuralPins(migrationRecord.text),
    "GS002 refresh attempted to change non-target manifest bytes",
  );
  const projectionAfter = technicalManifestSha256(updated);
  invariant(
    projectionAfter === projectionBefore,
    "GS002 rootStructuralInspection refresh changed the technical manifest projection",
  );

  return {
    migrationFile: migrationRecord.file,
    migrationMode: migrationRecord.mode,
    beforeBytes: migrationRecord.bytes,
    updatedText,
    assetFile: assetRecord.file,
    assetBytes: assetRecord.bytes,
    dispositionFile: dispositionRecord.file,
    dispositionBytes: dispositionRecord.bytes,
    changed: migrationState.prior,
    changedFields: migrationState.prior ? [...TARGET_FIELDS] : [],
    assetManifestSha256: assetRecord.sha256,
    dispositionSha256: dispositionRecord.sha256,
    migrationSha256: sha256(Buffer.from(updatedText)),
    technicalManifestSha256: projectionAfter,
  };
}

export async function atomicCasWriteGs002RootStructuralPlan(plan) {
  const [migrationNow, assetNow, dispositionNow] = await Promise.all([
    readFile(plan.migrationFile),
    readFile(plan.assetFile),
    readFile(plan.dispositionFile),
  ]);
  invariant(
    migrationNow.equals(plan.beforeBytes),
    "GS002 migration changed after preflight; no write performed",
  );
  invariant(
    assetNow.equals(plan.assetBytes),
    "GS002 root asset manifest changed after preflight; no write performed",
  );
  invariant(
    dispositionNow.equals(plan.dispositionBytes),
    "GS002 bilingual disposition changed after preflight; no write performed",
  );

  const temporary = `${plan.migrationFile}.gs002-root-pins-${process.pid}-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, plan.updatedText, {encoding: "utf8", flag: "wx"});
    await chmod(temporary, plan.migrationMode);
    await rename(temporary, plan.migrationFile);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  invariant(
    sha256(await readFile(plan.migrationFile)) === plan.migrationSha256,
    "GS002 migration post-write SHA-256 mismatch",
  );
}

export async function refreshGs002RootStructuralPins({
  root = PROJECT_ROOT,
  contract = GS002_ROOT_STRUCTURAL_PIN_CONTRACT,
  check = false,
} = {}) {
  const plan = await planGs002RootStructuralPinRefresh({root, contract});
  if (check) {
    invariant(
      !plan.changed,
      "GS002 rootStructuralInspection pins are stale; run refresh-gs002-root-structural-inspection-pins.mjs",
    );
    return {...plan, action: "verified"};
  }
  if (plan.changed) await atomicCasWriteGs002RootStructuralPlan(plan);
  return {...plan, action: plan.changed ? "written" : "unchanged"};
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/refresh-gs002-root-structural-inspection-pins.mjs [--check]

Validates the exact current GS002 structural root manifest and bilingual
disposition, including their all-false original-runtime and strict-acceptance
authority boundaries, then refreshes only the two rootStructuralInspection SHA
fields in migration.json. The stable technical manifest projection must remain
byte-identical. Existing evidence generators, approvals, coverage, source
assets, VB pins, and capture outputs are never written.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) return console.log(usage());
    const result = await refreshGs002RootStructuralPins(options);
    console.log(
      `${result.action}: ${GS002_ROOT_STRUCTURAL_PIN_CONTRACT.migrationPath}`
      + ` migrationSha256=${result.migrationSha256}`
      + ` technicalManifestSha256=${result.technicalManifestSha256}`,
    );
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
