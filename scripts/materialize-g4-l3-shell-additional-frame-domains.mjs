#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {ADDITIONAL_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-additional-domains.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const workspace = `migrations/${animationId}`;
const manifestRelative = `${workspace}/migration.json`;
const manifestPath = path.join(projectRoot, manifestRelative);
const reportRelative = "reports/g4-l3-shell-additional-frame-domain-materialization.json";
const reportPath = path.join(projectRoot, reportRelative);
const markdownRelative = "reports/g4-l3-shell-additional-frame-domain-materialization.md";
const markdownPath = path.join(projectRoot, markdownRelative);
const successorReportRelative = "reports/g4-l3-shell-single-frame-domain-materialization.json";
const initialDomainIds = Object.freeze([
  "root", "sprite-1011", "sprite-132", "sprite-302", "sprite-327", "sprite-528",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function record(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function readJson(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {
    bytes,
    document: JSON.parse(bytes.toString("utf8")),
    record: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

function acceptanceProjection(manifest) {
  return {
    status: manifest.status,
    confidence: manifest.confidence,
    classification: manifest.classification,
    baseline: manifest.baseline,
    evidence: manifest.evidence,
    fidelity: manifest.fidelity,
    accessibility: manifest.accessibility,
    acceptance: manifest.acceptance,
  };
}

function scenarioFor(config) {
  return {
    id: config.scenarioId,
    kind: "linear",
    description: `Hash-bound FFDec structural drawings and complete ${config.frameCount}-frame lookup for nested source timeline ${config.frameDomain} (${config.sourceInstanceId}); original-runtime natural entry, ActionScript, ${config.behaviorObligations.join(", ")}, interaction, audio, localization, Replay, full-stage parity, RMSE, human review, owner acceptance, and strict completion remain unresolved.`,
    reachable: true,
  };
}

function frameDomainFor(config) {
  return {
    id: config.frameDomain,
    kind: "nested",
    sourceTimelineId: config.frameDomain,
    parentFrameDomainId: "root",
    sourceInstanceId: config.sourceInstanceId,
    parentEntryFrame: config.rootFrame,
    localEntryFrame: 1,
    frameCount: config.frameCount,
    scenarioIds: [config.scenarioId],
    role: `source-native ${config.label} structural inspection; original-runtime natural entry, local playhead causality, ${config.behaviorObligations.join(", ")}, interaction, audio, localization, full-stage parity, and acceptance remain unresolved`,
  };
}

function inspectionFor(config, assetManifest) {
  return {
    sourceTimelineId: config.frameDomain,
    sourceCharacterId: config.sourceCharacterId,
    sourceInstanceId: config.sourceInstanceId,
    parentFrameDomainId: "root",
    parentEntryFrame: config.rootFrame,
    localEntryFrame: 1,
    frameCount: config.frameCount,
    uniqueVisualCount: assetManifest.document.deduplication.uniqueVisualCount,
    assetManifest: assetManifest.record.path,
    assetManifestSha256: assetManifest.record.sha256,
    authority: "ffdec-static-nested-timeline-render-not-original-runtime",
    exporterCanvas: config.exporterCanvas,
    exporterLocalOrigin: config.exporterLocalOrigin,
    rootPlacementChain: assetManifest.document.geometry.rootPlacementChain,
    rootCompositionMatrix: assetManifest.document.geometry.rootCompositionMatrix,
    behaviorObligations: config.behaviorObligations,
    languages: ["en", "es"],
    spanishTranslationSupplied: false,
    actionScriptExecuted: false,
    originalRuntimeBaselineComplete: false,
    naturalPlaybackClaimed: false,
    fullStageCompositionClaimed: false,
    strictAcceptanceEffect: "none",
  };
}

async function readAssetManifests() {
  const manifests = [];
  for (const config of ADDITIONAL_DOMAIN_CONFIGS) {
    const relativePath = `public/flash-assets/courses/${animationId}/${config.frameDomain}/manifest.json`;
    const assetManifest = await readJson(relativePath);
    const document = assetManifest.document;
    invariant(document.animationId === animationId, `${config.frameDomain}: asset manifest animation identity drifted`);
    invariant(document.runtime?.frameDomain === config.frameDomain, `${config.frameDomain}: asset manifest domain drifted`);
    invariant(document.runtime?.frameCount === config.frameCount, `${config.frameDomain}: asset manifest frame count drifted`);
    invariant(document.runtime?.rootFrame === config.rootFrame, `${config.frameDomain}: asset manifest root entry drifted`);
    invariant(document.runtime?.sourceInstanceId === config.sourceInstanceId, `${config.frameDomain}: asset manifest instance drifted`);
    invariant(document.frames?.length === config.frameCount && document.deduplication?.everyFrameMapped === true, `${config.frameDomain}: asset frame lookup is incomplete`);
    invariant(document.authority?.actionScriptExecuted === false && document.authority?.originalRuntimeBaseline === false && document.authority?.naturalPlaybackClaimed === false, `${config.frameDomain}: asset authority was promoted`);
    invariant(document.strictAcceptanceEffect === "none", `${config.frameDomain}: asset manifest cannot advance strict acceptance`);
    manifests.push({config, ...assetManifest});
  }
  return manifests;
}

function validateInitialManifest(manifest) {
  invariant(manifest.animationId === animationId && manifest.status === "preserved", "Shell manifest identity/status drifted");
  invariant(manifest.implementation?.frameDomains?.map(({id}) => id).join("|") === initialDomainIds.join("|"), "Shell initial frame-domain preimage drifted");
  const scenarioIds = new Set(manifest.scenarios?.map(({id}) => id));
  invariant(ADDITIONAL_DOMAIN_CONFIGS.every(({scenarioId}) => !scenarioIds.has(scenarioId)), "Shell initial manifest already contains an additional-domain scenario");
  invariant(!manifest.implementation.additionalFrameDomainStructuralInspections, "Shell initial manifest already contains additional-domain inspections");
}

function validateTargetManifest(manifest, assetManifests) {
  invariant(manifest.animationId === animationId && manifest.status === "preserved", "Shell target manifest identity/status drifted");
  const expectedDomainIds = [...initialDomainIds, ...ADDITIONAL_DOMAIN_CONFIGS.map(({frameDomain}) => frameDomain)];
  const actualDomainIds = manifest.implementation?.frameDomains?.map(({id}) => id) || [];
  invariant(actualDomainIds.slice(0, expectedDomainIds.length).join("|") === expectedDomainIds.join("|"), "Shell target frame-domain prefix/order drifted");
  const scenarioById = new Map(manifest.scenarios.map((scenario) => [scenario.id, scenario]));
  const domainById = new Map(manifest.implementation.frameDomains.map((domain) => [domain.id, domain]));
  for (const config of ADDITIONAL_DOMAIN_CONFIGS) {
    invariant(pretty(scenarioById.get(config.scenarioId)) === pretty(scenarioFor(config)), `${config.frameDomain}: target scenario drifted`);
    invariant(pretty(domainById.get(config.frameDomain)) === pretty(frameDomainFor(config)), `${config.frameDomain}: target frame domain drifted`);
  }
  const expectedInspections = assetManifests.map(({config, ...assetManifest}) => inspectionFor(config, assetManifest));
  invariant(pretty(manifest.implementation.additionalFrameDomainStructuralInspections) === pretty(expectedInspections), "Shell additional-domain structural-inspection bindings drifted");
  invariant(manifest.implementation.frameDomains.length >= 20, "Shell target must retain all 20 phase-one frame domains");
  invariant(manifest.implementation.additionalFrameDomainStructuralInspections.every((item) => item.strictAcceptanceEffect === "none" && item.originalRuntimeBaselineComplete === false), "Shell structural inspections cannot promote acceptance");
  return manifest;
}

function buildTargetManifest(manifest, assetManifests) {
  const target = structuredClone(manifest);
  target.scenarios.push(...ADDITIONAL_DOMAIN_CONFIGS.map(scenarioFor));
  target.implementation.rendering = "Hash-bound FFDec static root-frame plus 19 nested-domain structural inspections alongside a separately selected React semantic HTML/CSS 39-page audit projection; original-runtime behavior remains unresolved";
  target.implementation.frameDomains.push(...ADDITIONAL_DOMAIN_CONFIGS.map(frameDomainFor));
  target.implementation.additionalFrameDomainStructuralInspections = assetManifests.map(({config, ...assetManifest}) => inspectionFor(config, assetManifest));
  return target;
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

function markdown(report) {
  return `# G4 L3 Shell Additional Frame Domains\n\n`
    + `Fourteen source-bound, multi-frame Shell timelines are now explicit independent capture domains with deterministic FFDec structural renderers.\n\n`
    + `- Declared frame domains: **${report.summary.declaredFrameDomainsBefore} → ${report.summary.declaredFrameDomainsAfter}**.\n`
    + `- Newly enumerated local frames: **${report.summary.additionalLocalFrames}**.\n`
    + `- Newly enumerated pending EN/ES requirements: **${report.summary.additionalPendingRequirements}**.\n`
    + `- Remaining structurally reachable unresolved timelines after disposition refresh: **14 one-frame timelines**.\n`
    + `- Runtime sessions / strict completions: **0 / 0**.\n\n`
    + `This materialization is structural planning and current-JavaScript evidence only. Natural runtime, ActionScript behavior, audio, localization, full-stage parity, RMSE, independent human review, owner acceptance, and release remain pending.\n`;
}

async function expectedReport({before, after, assetManifests, generator}) {
  const assetBindings = assetManifests.map(({config, record: assetManifest}) => ({
    frameDomain: config.frameDomain,
    scenarioId: config.scenarioId,
    frameCount: config.frameCount,
    assetManifest,
  }));
  return {
    schemaVersion: 1,
    reportType: "g4-l3-shell-additional-frame-domain-materialization",
    generator,
    scope: {animationId, releaseId: "lesson-g04-l03-negative-numbers", memberKind: "lesson-shell"},
    before,
    after,
    assetBindings,
    summary: {
      declaredFrameDomainsBefore: 6,
      declaredFrameDomainsAfter: 20,
      additionalFrameDomains: 14,
      additionalLocalFrames: ADDITIONAL_DOMAIN_CONFIGS.reduce((sum, {frameCount}) => sum + frameCount, 0),
      additionalPendingRequirements: ADDITIONAL_DOMAIN_CONFIGS.length * 2,
      runtimeSessionsExecuted: 0,
      strictCompletions: 0,
    },
    acceptance: {
      authoritativeRuntimeAccepted: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    strictAcceptanceEffect: "none; FFDec structural assets make capture domains and current-JavaScript endpoints explicit but satisfy no original-runtime, fidelity, audio, human, owner, or release gate",
  };
}

async function verifyExisting() {
  const [manifest, assetManifests, report, generator] = await Promise.all([
    readJson(manifestRelative),
    readAssetManifests(),
    readJson(reportRelative),
    record(portable(path.relative(projectRoot, scriptPath))),
  ]);
  validateTargetManifest(manifest.document, assetManifests);
  invariant(report.document.reportType === "g4-l3-shell-additional-frame-domain-materialization", "Shell materialization report identity drifted");
  const hasSuccessor = pretty(report.document.after?.migrationJson) !== pretty(manifest.record);
  const successor = hasSuccessor
    ? await readJson(successorReportRelative).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error))
    : null;
  invariant(report.document.generator?.path === generator.path, "Shell materialization generator path drifted");
  invariant(successor || pretty(report.document.generator) === pretty(generator), "Shell materialization generator binding is stale");
  if (hasSuccessor) {
    invariant(successor, "Shell materialization report manifest binding is stale and no successor receipt exists");
    invariant(pretty(report.document.after?.migrationJson) === pretty(successor.document.before?.migrationJson), "Shell phase-one output is not the hash-bound preimage of the successor materialization");
    invariant(pretty(successor.document.after?.migrationJson) === pretty(manifest.record), "Shell successor materialization does not bind the current manifest");
  }
  invariant(report.document.summary?.declaredFrameDomainsAfter === 20 && report.document.summary?.additionalLocalFrames === 142 && report.document.summary?.additionalPendingRequirements === 28, "Shell materialization report summary drifted");
  invariant(Object.values(report.document.acceptance || {}).every((value) => value === false), "Shell materialization report contains an acceptance promotion");
  const expectedAssets = assetManifests.map(({config, record: assetManifest}) => ({frameDomain: config.frameDomain, scenarioId: config.scenarioId, frameCount: config.frameCount, assetManifest}));
  invariant(pretty(report.document.assetBindings) === pretty(expectedAssets), "Shell materialization asset bindings are stale");
  return report.document;
}

export async function materializeG4L3ShellAdditionalFrameDomains({check = false} = {}) {
  const reportExists = await stat(reportPath).then(() => true).catch((error) => error.code === "ENOENT" ? false : Promise.reject(error));
  if (reportExists) return verifyExisting();
  invariant(!check, "Shell additional-frame-domain materialization report is missing");

  const [manifest, assetManifests, generator] = await Promise.all([
    readJson(manifestRelative),
    readAssetManifests(),
    record(portable(path.relative(projectRoot, scriptPath))),
  ]);
  validateInitialManifest(manifest.document);
  const target = buildTargetManifest(manifest.document, assetManifests);
  validateTargetManifest(target, assetManifests);
  invariant(pretty(acceptanceProjection(target)) === pretty(acceptanceProjection(manifest.document)), "Shell materialization changed an acceptance-bearing field");

  const preimageSetSha256 = sha256(Buffer.from(pretty({migrationJson: manifest.record, assetManifests: assetManifests.map(({record: item}) => item)})));
  const backupRoot = `work/g4-l3-v2-shell-additional-frame-domain-preimages/${preimageSetSha256}`;
  await mkdir(path.join(projectRoot, backupRoot), {recursive: true});
  const backupPath = path.join(projectRoot, backupRoot, "migration.json");
  await copyFile(manifestPath, backupPath, fsConstants.COPYFILE_EXCL);
  await chmod(backupPath, 0o444);

  await atomicWrite(manifestPath, Buffer.from(pretty(target)));
  const after = await readJson(manifestRelative);
  validateTargetManifest(after.document, assetManifests);
  const report = await expectedReport({
    before: {migrationJson: manifest.record, backup: {path: portable(path.relative(projectRoot, backupPath)), preimageSetSha256, ignoredWorkArtifact: true}},
    after: {migrationJson: after.record},
    assetManifests,
    generator,
  });
  await mkdir(path.dirname(reportPath), {recursive: true});
  await atomicWrite(reportPath, Buffer.from(pretty(report)));
  await atomicWrite(markdownPath, Buffer.from(markdown(report)));
  return verifyExisting();
}

export function parseArguments(argv) {
  const unknown = argv.filter((argument) => argument !== "--check");
  if (unknown.length) throw new Error(`Unknown option: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const options = parseArguments(process.argv.slice(2));
  const report = await materializeG4L3ShellAdditionalFrameDomains(options);
  process.stdout.write(`${options.check ? "verified" : "materialized"} ${report.summary.additionalFrameDomains} additional G4 L3 shell frame domains\n`);
}
