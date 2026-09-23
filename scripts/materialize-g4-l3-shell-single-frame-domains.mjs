#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {ADDITIONAL_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-additional-domains.mjs";
import {SINGLE_FRAME_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-single-frame-domains.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const manifestRelative = `migrations/${animationId}/migration.json`;
const manifestPath = path.join(projectRoot, manifestRelative);
const reportRelative = "reports/g4-l3-shell-single-frame-domain-materialization.json";
const reportPath = path.join(projectRoot, reportRelative);
const markdownRelative = "reports/g4-l3-shell-single-frame-domain-materialization.md";
const markdownPath = path.join(projectRoot, markdownRelative);
const baseDomainIds = Object.freeze([
  "root", "sprite-1011", "sprite-132", "sprite-302", "sprite-327", "sprite-528",
  ...ADDITIONAL_DOMAIN_CONFIGS.map(({frameDomain}) => frameDomain),
]);

function invariant(condition, message) { if (!condition) throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function pretty(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function portable(value) { return value.split(path.sep).join("/"); }

async function record(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function readJson(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {bytes, document: JSON.parse(bytes), record: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}};
}

function acceptanceProjection(manifest) {
  return {status: manifest.status, confidence: manifest.confidence, classification: manifest.classification, baseline: manifest.baseline, evidence: manifest.evidence, fidelity: manifest.fidelity, accessibility: manifest.accessibility, acceptance: manifest.acceptance};
}

function scenarioFor(config) {
  return {id: config.scenarioId, kind: "linear", description: `Hash-bound one-frame FFDec structural drawing for source timeline ${config.frameDomain} (${config.sourceInstanceId}); original-runtime natural entry, ActionScript, ${config.behaviorObligations.join(", ")}, interaction, audio, localization, Replay, full-stage parity, RMSE, human review, owner acceptance, and strict completion remain unresolved.`, reachable: true};
}

function frameDomainFor(config) {
  return {id: config.frameDomain, kind: "nested", sourceTimelineId: config.frameDomain, parentFrameDomainId: "root", sourceInstanceId: config.sourceInstanceId, parentEntryFrame: config.rootFrame, localEntryFrame: 1, frameCount: 1, scenarioIds: [config.scenarioId], role: `source-native ${config.label} independent structural inspection through its exact placement chain; original-runtime event causality, ${config.behaviorObligations.join(", ")}, interaction, audio, localization, full-stage parity, and acceptance remain unresolved`};
}

function inspectionFor(config, assetManifest) {
  return {sourceTimelineId: config.frameDomain, sourceCharacterId: config.sourceCharacterId, sourceInstanceId: config.sourceInstanceId, parentFrameDomainId: "root", parentEntryFrame: config.rootFrame, localEntryFrame: 1, frameCount: 1, uniqueVisualCount: 1, assetManifest: assetManifest.record.path, assetManifestSha256: assetManifest.record.sha256, authority: "ffdec-static-nested-timeline-render-not-original-runtime", exporterCanvas: config.exporterCanvas, exporterLocalOrigin: config.exporterLocalOrigin, rootPlacementChain: assetManifest.document.geometry.rootPlacementChain, rootCompositionMatrix: assetManifest.document.geometry.rootCompositionMatrix, behaviorObligations: config.behaviorObligations, languages: ["en", "es"], spanishTranslationSupplied: false, actionScriptExecuted: false, originalRuntimeBaselineComplete: false, naturalPlaybackClaimed: false, fullStageCompositionClaimed: false, strictAcceptanceEffect: "none"};
}

async function readAssetManifests() {
  const results = [];
  for (const config of SINGLE_FRAME_DOMAIN_CONFIGS) {
    const relativePath = `public/flash-assets/courses/${animationId}/${config.frameDomain}/manifest.json`;
    const item = await readJson(relativePath);
    const document = item.document;
    invariant(document.animationId === animationId && document.runtime?.frameDomain === config.frameDomain && document.runtime?.frameCount === 1 && document.frames?.length === 1 && document.assets?.length === 1, `${config.frameDomain}: one-frame asset identity drifted`);
    invariant(document.authority?.actionScriptExecuted === false && document.authority?.originalRuntimeBaseline === false && document.authority?.naturalPlaybackClaimed === false && document.strictAcceptanceEffect === "none", `${config.frameDomain}: one-frame asset authority was promoted`);
    results.push({config, ...item});
  }
  return results;
}

function validatePreimage(manifest) {
  invariant(manifest.animationId === animationId && manifest.status === "preserved", "Shell phase-two manifest identity/status drifted");
  invariant(manifest.implementation?.frameDomains?.map(({id}) => id).join("|") === baseDomainIds.join("|"), "Shell phase-two frame-domain preimage drifted");
  invariant(manifest.implementation?.additionalFrameDomainStructuralInspections?.length === 14, "Shell multi-frame materialization prerequisite is absent");
  invariant(!manifest.implementation.singleFrameDomainStructuralInspections, "Shell phase-two preimage already contains one-frame inspections");
  const scenarioIds = new Set(manifest.scenarios.map(({id}) => id));
  invariant(SINGLE_FRAME_DOMAIN_CONFIGS.every(({scenarioId}) => !scenarioIds.has(scenarioId)), "Shell phase-two preimage already contains a one-frame scenario");
}

function validateTarget(manifest, assets) {
  const expectedIds = [...baseDomainIds, ...SINGLE_FRAME_DOMAIN_CONFIGS.map(({frameDomain}) => frameDomain)];
  invariant(manifest.animationId === animationId && manifest.status === "preserved", "Shell one-frame target identity/status drifted");
  invariant(manifest.implementation?.frameDomains?.map(({id}) => id).join("|") === expectedIds.join("|"), "Shell one-frame target domain set/order drifted");
  invariant(manifest.implementation.frameDomains.length === 34, "Shell target must declare exactly 34 domains");
  const scenarios = new Map(manifest.scenarios.map((item) => [item.id, item]));
  const domains = new Map(manifest.implementation.frameDomains.map((item) => [item.id, item]));
  for (const config of SINGLE_FRAME_DOMAIN_CONFIGS) {
    invariant(pretty(scenarios.get(config.scenarioId)) === pretty(scenarioFor(config)), `${config.frameDomain}: one-frame scenario drifted`);
    invariant(pretty(domains.get(config.frameDomain)) === pretty(frameDomainFor(config)), `${config.frameDomain}: one-frame domain drifted`);
  }
  const expectedInspections = assets.map(({config, ...asset}) => inspectionFor(config, asset));
  invariant(pretty(manifest.implementation.singleFrameDomainStructuralInspections) === pretty(expectedInspections), "Shell one-frame inspection bindings drifted");
  invariant(expectedInspections.every(({strictAcceptanceEffect, originalRuntimeBaselineComplete}) => strictAcceptanceEffect === "none" && originalRuntimeBaselineComplete === false), "Shell one-frame inspections cannot promote acceptance");
}

function buildTarget(manifest, assets) {
  const target = structuredClone(manifest);
  target.scenarios.push(...SINGLE_FRAME_DOMAIN_CONFIGS.map(scenarioFor));
  target.implementation.rendering = "Hash-bound FFDec static root-frame plus 33 nested-domain structural inspections alongside a separately selected React semantic HTML/CSS 39-page audit projection; original-runtime behavior remains unresolved";
  target.implementation.frameDomains.push(...SINGLE_FRAME_DOMAIN_CONFIGS.map(frameDomainFor));
  target.implementation.singleFrameDomainStructuralInspections = assets.map(({config, ...asset}) => inspectionFor(config, asset));
  return target;
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

function markdown(report) {
  return `# G4 L3 Shell One-Frame Domains\n\nFourteen scripted or interactive one-frame Shell timelines are now explicit source-bound capture domains.\n\n- Declared frame domains: **20 → 34**.\n- Newly enumerated structural frames: **14**.\n- Newly forecast pending EN/ES requirements: **28**.\n- Structurally reachable unresolved timelines after disposition refresh: **0**.\n- Runtime sessions / strict completions: **0 / 0**.\n\nThis closes structural domain enumeration only. Every runtime, behavior, interaction, audio, localization, RMSE, human-review, owner-acceptance, and release gate remains pending.\n`;
}

async function verifyExisting() {
  const [manifest, assets, report, generator] = await Promise.all([readJson(manifestRelative), readAssetManifests(), readJson(reportRelative), record(portable(path.relative(projectRoot, scriptPath)))]);
  validateTarget(manifest.document, assets);
  invariant(report.document.reportType === "g4-l3-shell-single-frame-domain-materialization", "Shell one-frame report identity drifted");
  invariant(pretty(report.document.generator) === pretty(generator), "Shell one-frame report generator binding is stale");
  invariant(pretty(report.document.after?.migrationJson) === pretty(manifest.record), "Shell one-frame report manifest binding is stale");
  invariant(report.document.summary?.declaredFrameDomainsAfter === 34 && report.document.summary?.additionalPendingRequirements === 28 && report.document.summary?.strictCompletions === 0, "Shell one-frame report summary drifted");
  invariant(Object.values(report.document.acceptance || {}).every((value) => value === false), "Shell one-frame report contains acceptance promotion");
  const expectedBindings = assets.map(({config, record: assetManifest}) => ({frameDomain: config.frameDomain, scenarioId: config.scenarioId, frameCount: 1, assetManifest}));
  invariant(pretty(report.document.assetBindings) === pretty(expectedBindings), "Shell one-frame report asset bindings are stale");
  return report.document;
}

async function refreshExistingReceipt() {
  const [manifest, assets, report, generator] = await Promise.all([
    readJson(manifestRelative),
    readAssetManifests(),
    readJson(reportRelative),
    record(portable(path.relative(projectRoot, scriptPath))),
  ]);
  validateTarget(manifest.document, assets);
  invariant(report.document.reportType === "g4-l3-shell-single-frame-domain-materialization", "Shell one-frame report identity drifted");
  invariant(report.document.summary?.declaredFrameDomainsAfter === 34 && report.document.summary?.additionalPendingRequirements === 28 && report.document.summary?.strictCompletions === 0, "Shell one-frame report summary drifted");
  invariant(Object.values(report.document.acceptance || {}).every((value) => value === false), "Shell one-frame report contains an acceptance promotion");
  const expectedBindings = assets.map(({config, record: assetManifest}) => ({frameDomain: config.frameDomain, scenarioId: config.scenarioId, frameCount: 1, assetManifest}));
  invariant(pretty(report.document.assetBindings) === pretty(expectedBindings), "Shell one-frame report asset bindings are stale");

  const generatorCurrent = pretty(report.document.generator) === pretty(generator);
  const manifestCurrent = pretty(report.document.after?.migrationJson) === pretty(manifest.record);
  if (generatorCurrent && manifestCurrent) return verifyExisting();

  const priorReportSha256 = report.record.sha256;
  const backupRoot = `work/g4-l3-v2-shell-single-frame-domain-receipt-preimages/${priorReportSha256}`;
  await mkdir(path.join(projectRoot, backupRoot), {recursive: true});
  const backupPath = path.join(projectRoot, backupRoot, path.basename(reportRelative));
  try {
    await copyFile(reportPath, backupPath, fsConstants.COPYFILE_EXCL);
    await chmod(backupPath, 0o444);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    invariant(sha256(await readFile(backupPath)) === priorReportSha256, "Shell one-frame receipt preimage backup drifted");
  }

  const refreshed = structuredClone(report.document);
  refreshed.generator = generator;
  refreshed.after.migrationJson = manifest.record;
  refreshed.receiptRefresh = {
    reason: "acceptance-neutral upstream manifest fields changed after the original domain materialization",
    priorReport: {
      path: reportRelative,
      sha256: priorReportSha256,
      backup: portable(path.relative(projectRoot, backupPath)),
      ignoredWorkArtifact: true,
    },
    currentManifest: manifest.record,
    domainSemanticsChanged: false,
    acceptanceEffect: "none",
  };
  await atomicWrite(reportPath, Buffer.from(pretty(refreshed)));
  return verifyExisting();
}

export async function materializeG4L3ShellSingleFrameDomains({check = false, refresh = false} = {}) {
  const reportExists = await stat(reportPath).then(() => true).catch((error) => error.code === "ENOENT" ? false : Promise.reject(error));
  if (reportExists) return refresh ? refreshExistingReceipt() : verifyExisting();
  invariant(!check, "Shell one-frame materialization report is missing");
  invariant(!refresh, "Shell one-frame receipt refresh requires an existing report");
  const [manifest, assets, generator] = await Promise.all([readJson(manifestRelative), readAssetManifests(), record(portable(path.relative(projectRoot, scriptPath)))]);
  validatePreimage(manifest.document);
  const target = buildTarget(manifest.document, assets);
  validateTarget(target, assets);
  invariant(pretty(acceptanceProjection(target)) === pretty(acceptanceProjection(manifest.document)), "Shell one-frame materialization changed an acceptance-bearing field");
  const preimageSetSha256 = sha256(Buffer.from(pretty({migrationJson: manifest.record, assets: assets.map(({record: item}) => item)})));
  const backupRoot = `work/g4-l3-v2-shell-single-frame-domain-preimages/${preimageSetSha256}`;
  await mkdir(path.join(projectRoot, backupRoot), {recursive: true});
  const backupPath = path.join(projectRoot, backupRoot, "migration.json");
  await copyFile(manifestPath, backupPath, fsConstants.COPYFILE_EXCL);
  await chmod(backupPath, 0o444);
  await atomicWrite(manifestPath, Buffer.from(pretty(target)));
  const after = await readJson(manifestRelative);
  validateTarget(after.document, assets);
  const report = {schemaVersion: 1, reportType: "g4-l3-shell-single-frame-domain-materialization", generator, scope: {animationId, releaseId: "lesson-g04-l03-negative-numbers", memberKind: "lesson-shell"}, before: {migrationJson: manifest.record, backup: {path: portable(path.relative(projectRoot, backupPath)), preimageSetSha256, ignoredWorkArtifact: true}}, after: {migrationJson: after.record}, assetBindings: assets.map(({config, record: assetManifest}) => ({frameDomain: config.frameDomain, scenarioId: config.scenarioId, frameCount: 1, assetManifest})), summary: {declaredFrameDomainsBefore: 20, declaredFrameDomainsAfter: 34, additionalFrameDomains: 14, additionalLocalFrames: 14, additionalPendingRequirements: 28, unresolvedTimelineForecastAfterDispositionRefresh: 0, runtimeSessionsExecuted: 0, strictCompletions: 0}, acceptance: {authoritativeRuntimeAccepted: false, baselineAccepted: false, audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false, strictMigrationComplete: false}, strictAcceptanceEffect: "none; explicit one-frame structural domains close only static enumeration and satisfy no original-runtime, behavior, fidelity, audio, human, owner, or release gate"};
  await atomicWrite(reportPath, Buffer.from(pretty(report)));
  await atomicWrite(markdownPath, Buffer.from(markdown(report)));
  return verifyExisting();
}

export function parseArguments(argv) {
  const unknown = argv.filter((argument) => !["--check", "--refresh"].includes(argument));
  if (unknown.length) throw new Error(`Unknown option: ${unknown[0]}`);
  const options = {check: argv.includes("--check"), refresh: argv.includes("--refresh")};
  invariant(!(options.check && options.refresh), "--check and --refresh are mutually exclusive");
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const options = parseArguments(process.argv.slice(2));
  const report = await materializeG4L3ShellSingleFrameDomains(options);
  process.stdout.write(`${options.check ? "verified" : options.refresh ? "refreshed receipt for" : "materialized"} ${report.summary.additionalFrameDomains} one-frame G4 L3 shell domains\n`);
}
