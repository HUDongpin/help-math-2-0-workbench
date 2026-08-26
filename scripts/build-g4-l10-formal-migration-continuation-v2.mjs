#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, open, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const REPORT_TYPE = "g04-l10-formal-migration-continuation-v2";
export const JSON_REPORT_RELATIVE =
  "reports/g04-l10-formal-migration-continuation-2026-08-02-v2.json";
export const MARKDOWN_REPORT_RELATIVE =
  "reports/g04-l10-formal-migration-continuation-2026-08-02-v2.md";

export const INPUTS = Object.freeze({
  continuationV1Json: Object.freeze({
    path: "reports/g04-l10-formal-migration-continuation-2026-08-02-v1.json",
    sha256: "6a8a4074fad0a34c1c315cce3d6cebc62074b93e434176fdf44b5fbbc942cf15",
    readOnly: true,
  }),
  continuationV1Markdown: Object.freeze({
    path: "reports/g04-l10-formal-migration-continuation-2026-08-02-v1.md",
    sha256: "22c6092003e004d9cf4ef0b61f701eac1901b2b6c535728ae590ce24ac896f5a",
    readOnly: true,
  }),
  vb003Diagnostic: Object.freeze({
    path: "output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1/capture-manifest.json",
    sha256: "c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c",
    readOnly: true,
  }),
  vb003Producer: Object.freeze({
    path: "scripts/capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.mjs",
    sha256: "ce2e3219dc8e94d99cbc75ef3643b1eb1c7b35eef1fbf35accefa93840c6b02d",
  }),
  vb003Tests: Object.freeze({
    path: "scripts/capture-g4-l10-vb003-current-js-engineering-diagnostic-v1.test.mjs",
    sha256: "45b5ec41368a51cc827b70a778b6ed2ff5357e4837bf21a684e2a661520fd09a",
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 continuation v2: ${message}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function descriptor(binding) {
  const {contents, document, ...rest} = binding;
  return rest;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function allFalse(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  for (const [key, item] of Object.entries(value)) {
    invariant(item === false, `${label}.${key} must remain false`);
  }
}

async function stableBinding(projectRoot, specification) {
  const absolutePath = path.join(projectRoot, specification.path);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be a regular non-symlink file`);
  if (specification.readOnly) {
    invariant((before.mode & 0o222n) === 0n,
      `${specification.path} must remain read-only`);
  }
  const contents = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs,
  `${specification.path} changed while being read`);
  const actualSha256 = sha256(contents);
  invariant(actualSha256 === specification.sha256,
    `${specification.path} SHA-256 drifted: ${actualSha256}`);
  return {
    path: specification.path,
    bytes: contents.length,
    sha256: actualSha256,
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    contents,
    document: specification.path.endsWith(".json") ?
      JSON.parse(contents.toString("utf8")) : null,
  };
}

function validateV1(jsonBinding, markdownBinding) {
  const v1 = jsonBinding.document;
  invariant(v1?.schemaVersion === 1 &&
    v1.reportType === "g04-l10-formal-migration-continuation-v1" &&
    v1.releaseId === RELEASE_ID &&
    v1.classification === "additive-machine-evidence-continuation-only" &&
    v1.decision?.formalMigrationComplete === false &&
    v1.decision.acceptanceEffect === "none",
  "v1 identity or decision boundary drifted");
  const gates = v1.formalGateInvariance?.gates;
  invariant(gates?.canonicalReleaseMembership?.present === 47 &&
    gates.canonicalReleaseMembership.required === 47 &&
    gates.authoritativeOriginalRuntimeBaseline.accepted === 0 &&
    gates.authoritativeOriginalRuntimeBaseline.required === 47 &&
    gates.authoritativeCapturedCoverageFrames.accepted === 0 &&
    gates.authoritativeCapturedCoverageFrames.required === 44_488 &&
    gates.fullFrameRmseRequirements.accepted === 0 &&
    gates.fullFrameRmseRequirements.required === 520 &&
    gates.registeredFormalJavascriptRenderer.accepted === 0 &&
    gates.strictCompletion.accepted === 0 &&
    gates.atomicWholeLessonPublication.published === false &&
    gates.atomicWholeLessonPublication.admitted === 0 &&
    gates.atomicWholeLessonPublication.required === 47,
  "v1 formal denominators drifted");
  allFalse(v1.formalGateInvariance.mutations, "v1 formal mutations");
  invariant(v1.authority?.authoritativeOriginalRuntime === false &&
    v1.authority.originalRuntimeBaseline === false &&
    v1.authority.fullFrameBaseline === false &&
    v1.authority.formalRmseAcceptance === false &&
    v1.authority.audioListeningOrSynchronization === false &&
    v1.authority.humanReview === false && v1.authority.engineeringReview === false &&
    v1.authority.ownerReview === false && v1.authority.registeredFormalRenderer === false &&
    v1.authority.strictCompletion === false &&
    v1.authority.wholeLessonIntegration === false &&
    v1.authority.releaseOrPublication === false &&
    v1.authority.strictAcceptanceEffect === "none",
  "v1 authority boundary drifted");
  const markdown = markdownBinding.contents.toString("utf8");
  for (const fragment of [
    "# Grade 4 Lesson 10 formal migration continuation v1",
    "0/44,488 frames",
    "0/520 requirements",
    "strict completion remains **0/47**",
  ]) invariant(markdown.includes(fragment), `v1 Markdown lost ${JSON.stringify(fragment)}`);
  return v1;
}

function validateVb003(vb003, bindings) {
  invariant(vb003?.schemaVersion === 1 &&
    vb003.artifactType === "g4-l10-vb003-current-js-engineering-diagnostic-v1" &&
    vb003.animationId === "course-g04-l10-vb-003" && vb003.status === "pass" &&
    vb003.classification === "source-static-current-javascript-engineering-diagnostic-only" &&
    vb003.acceptanceEffect === "none",
  "VB003 diagnostic identity drifted");
  invariant(vb003.bindings?.producer?.sha256 === bindings.vb003Producer.sha256 &&
    vb003.bindings.producerTests?.sha256 === bindings.vb003Tests.sha256,
  "VB003 producer/test binding drifted");
  invariant(vb003.capturePlan?.frameDomain === "sprite-120" &&
    vb003.capturePlan.frameDomainCount === 203 && vb003.capturePlan.frames?.length === 203 &&
    vb003.capturePlan.frames.every((frame, index) => frame === index + 1) &&
    vb003.captures?.length === 203 &&
    vb003.captures.every((item, index) => item.frame === index + 1 &&
      item.width === 800 && item.height === 600 && item.identityVerified === true &&
      item.authorityBoundaryVerified === true && item.stableBeforeAfter === true),
  "VB003 203-frame identity drifted");
  invariant(vb003.summary?.captureCount === 203 && vb003.summary.fileCount === 204 &&
    vb003.summary.totalPngBytes === 5_148_744,
  "VB003 artifact census drifted");
  invariant(vb003.currentJavascriptSequence?.frameCount === 203 &&
    vb003.currentJavascriptSequence.comparedConsecutivePairCount === 202 &&
    vb003.currentJavascriptSequence.changedFromPreviousFrameCount === 147 &&
    vb003.currentJavascriptSequence.byteIdenticalToPreviousFrameCount === 55 &&
    vb003.currentJavascriptSequence.uniqueRgbaRasterCount === 148,
  "VB003 current-JS sequence census drifted");
  invariant(vb003.formalCapturedFrameCountEffect === 0 &&
    vb003.coverageAdoptionAttempted === false && vb003.formalCoverageMutation === false &&
    vb003.formalState?.registryPresenceCount === 0 &&
    vb003.formalState.releaseStrictCompleteCount === 0 &&
    vb003.formalState.releaseMissingCount === 47 &&
    vb003.formalState.releasePublished === false && vb003.formalState.releaseGateOpen === false &&
    vb003.formalState.nestedRequirements?.length === 2 &&
    vb003.formalState.nestedRequirements.every((item) =>
      item.status === "blocked" && item.capturedFrameCount === 0 &&
      item.missingFrameCount === 203 && item.baselineAuthority === "unresolved"),
  "VB003 formal-effect boundary drifted");
  invariant(vb003.candidate?.registered === false &&
    vb003.candidate.actionScriptExecuted === false && vb003.candidate.controlsEnabled === false &&
    vb003.candidate.audioCues?.length === 0 &&
    vb003.candidate.SpanishVisualStatus === "unresolved-disabled" &&
    vb003.candidate.naturalRuntimeEstablished === false &&
    vb003.candidate.replayParityEstablished === false &&
    vb003.candidate.fullFrameFidelityEstablished === false &&
    vb003.candidate.strictAcceptanceEffect === "none",
  "VB003 candidate boundary drifted");
  const acceptanceKeys = Object.entries(vb003.authorityBoundary)
    .filter(([key]) => !["classification", "acceptanceEffect", "currentJavascriptCandidateOnly"].includes(key));
  invariant(vb003.authorityBoundary.currentJavascriptCandidateOnly === true &&
    acceptanceKeys.every(([, value]) => value === false),
  "VB003 acceptance authority drifted");
  for (const key of ["consoleErrors", "consoleWarnings", "pageErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    invariant(vb003.browserDiagnostics?.[key]?.length === 0, `VB003 ${key} must remain empty`);
  }
}

function acceptanceClaims() {
  return {
    authoritativeOriginalRuntime: false,
    originalRuntimeNaturalTrace: false,
    originalRuntimeBaseline: false,
    sourceHostEntryEstablished: false,
    actionScriptBehaviorParity: false,
    bilingualVisualParity: false,
    audioCueParity: false,
    audioListeningAcceptance: false,
    replayParity: false,
    fullFrameOriginalRuntimeComparison: false,
    formalRmseAcceptance: false,
    coverageRequirementSatisfied: false,
    coverageAdopted: false,
    humanVisualReview: false,
    engineeringReviewAccepted: false,
    ownerAcceptance: false,
    registeredFormalRenderer: false,
    strictMigrationCompletion: false,
    wholeLessonIntegration: false,
    atomicLessonPublication: false,
  };
}

export async function buildReport(projectRoot = PROJECT_ROOT) {
  const bindings = Object.fromEntries(await Promise.all(
    Object.entries(INPUTS).map(async ([key, specification]) =>
      [key, await stableBinding(projectRoot, specification)]),
  ));
  const v1 = validateV1(bindings.continuationV1Json, bindings.continuationV1Markdown);
  const vb003 = bindings.vb003Diagnostic.document;
  validateVb003(vb003, bindings);
  const report = {
    schemaVersion: 2,
    reportType: REPORT_TYPE,
    releaseId: RELEASE_ID,
    evidenceAsOf: "2026-08-02",
    status: "additive-vb003-current-js-full-domain-diagnostic-formal-gates-unchanged",
    classification: "additive-machine-evidence-continuation-only",
    decision: {
      machineEvidenceAdvanced: true,
      vb003FullDomainCurrentJavascriptDiagnosticAdded: true,
      formalMigrationComplete: false,
      acceptanceEffect: "none",
    },
    predecessor: {
      continuationV1Json: descriptor(bindings.continuationV1Json),
      continuationV1Markdown: descriptor(bindings.continuationV1Markdown),
    },
    evidenceBindings: {
      vb003CurrentJavascriptDiagnostic: descriptor(bindings.vb003Diagnostic),
      vb003Producer: descriptor(bindings.vb003Producer),
      vb003FocusedTests: descriptor(bindings.vb003Tests),
    },
    machineProgressDelta: {
      vb003CurrentJavascriptFullDomainDiagnostic: {
        animationId: vb003.animationId,
        frameDomain: vb003.capturePlan.frameDomain,
        language: vb003.captureIdentity.language,
        diagnosticFramesCaptured: 203,
        diagnosticFramesRequired: 203,
        artifactFileCount: 204,
        totalPngBytes: 5_148_744,
        comparedConsecutivePairCount: 202,
        changedConsecutivePairCount: 147,
        identicalConsecutivePairCount: 55,
        uniqueRgbaRasterCount: 148,
        registered: false,
        spanishVisualStatus: "unresolved-disabled",
        actionScriptExecuted: false,
        controlsEnabled: false,
        audioCueCount: 0,
        formalCapturedFrameCountEffect: 0,
        formalCoverageRequirementEffect: 0,
        formalRendererRegistrationEffect: 0,
        strictCompletionEffect: 0,
        releaseAdmittedMemberEffect: 0,
        coverageAdoptionAttempted: false,
        formalCoverageMutation: false,
        formalPublicationEffect: false,
      },
    },
    formalGateInvariance: clone(v1.formalGateInvariance),
    authority: {
      additiveMachineEvidenceOnly: true,
      currentJavascriptEngineeringDiagnosticOnly: true,
      acceptanceClaims: acceptanceClaims(),
      strictAcceptanceEffect: "none",
    },
    remainingGates: clone(v1.remainingGates),
  };
  validateReport(report);
  return report;
}

export function validateReport(report) {
  invariant(report?.schemaVersion === 2 && report.reportType === REPORT_TYPE &&
    report.releaseId === RELEASE_ID &&
    report.status === "additive-vb003-current-js-full-domain-diagnostic-formal-gates-unchanged" &&
    report.classification === "additive-machine-evidence-continuation-only" &&
    report.decision?.formalMigrationComplete === false &&
    report.decision.acceptanceEffect === "none",
  "generated report identity drifted");
  const delta = report.machineProgressDelta?.vb003CurrentJavascriptFullDomainDiagnostic;
  invariant(delta?.diagnosticFramesCaptured === 203 && delta.diagnosticFramesRequired === 203 &&
    delta.artifactFileCount === 204 && delta.totalPngBytes === 5_148_744 &&
    delta.changedConsecutivePairCount === 147 && delta.identicalConsecutivePairCount === 55 &&
    delta.uniqueRgbaRasterCount === 148 && delta.formalCapturedFrameCountEffect === 0 &&
    delta.formalCoverageRequirementEffect === 0 && delta.formalRendererRegistrationEffect === 0 &&
    delta.strictCompletionEffect === 0 && delta.releaseAdmittedMemberEffect === 0 &&
    delta.coverageAdoptionAttempted === false && delta.formalCoverageMutation === false &&
    delta.formalPublicationEffect === false,
  "generated VB003 delta drifted");
  const gates = report.formalGateInvariance?.gates;
  invariant(gates?.canonicalReleaseMembership?.required === 47 &&
    gates.authoritativeCapturedCoverageFrames?.required === 44_488 &&
    gates.fullFrameRmseRequirements?.required === 520 &&
    gates.authoritativeOriginalRuntimeBaseline?.accepted === 0 &&
    gates.registeredFormalJavascriptRenderer?.accepted === 0 &&
    gates.strictCompletion?.accepted === 0 &&
    gates.atomicWholeLessonPublication?.published === false,
  "generated formal denominators drifted");
  allFalse(report.formalGateInvariance.mutations, "formalGateInvariance.mutations");
  allFalse(report.authority.acceptanceClaims, "authority.acceptanceClaims");
  invariant(report.authority.strictAcceptanceEffect === "none",
    "strict acceptance effect must remain none");
  return true;
}

export function renderMarkdown(report) {
  validateReport(report);
  const delta = report.machineProgressDelta.vb003CurrentJavascriptFullDomainDiagnostic;
  const gates = report.formalGateInvariance.gates;
  return `# Grade 4 Lesson 10 formal migration continuation v2\n\n` +
    `> **Additive current-JavaScript engineering evidence only.** Acceptance effect: \`none\`.\n\n` +
    `## Outcome\n\n` +
    `VB003 now has an immutable English source-static current-JavaScript diagnostic for all **${delta.diagnosticFramesCaptured}/${delta.diagnosticFramesRequired}** frames of \`sprite-120\`. The package contains **${delta.artifactFileCount} files**, including ${delta.totalPngBytes.toLocaleString("en-US")} PNG bytes. Its ${delta.comparedConsecutivePairCount} consecutive pairs contain ${delta.changedConsecutivePairCount} changed and ${delta.identicalConsecutivePairCount} identical pairs, with ${delta.uniqueRgbaRasterCount} unique RGBA rasters.\n\n` +
    `This does not adopt a formal coverage frame: \`formalCapturedFrameCountEffect=0\`, \`formalCoverageRequirementEffect=0\`, renderer-registration effect 0, strict-completion effect 0, release-admission effect 0, and publication effect false. Spanish visuals, ActionScript controls, audio, natural runtime, Replay, original-runtime comparison, RMSE, and human/owner acceptance remain unresolved or false.\n\n` +
    `## Formal gate invariance\n\n` +
    `| Gate | Current state |\n| --- | ---: |\n` +
    `| Canonical release membership | ${gates.canonicalReleaseMembership.present}/${gates.canonicalReleaseMembership.required} source present |\n` +
    `| Authoritative original-runtime baseline | ${gates.authoritativeOriginalRuntimeBaseline.accepted}/${gates.authoritativeOriginalRuntimeBaseline.required} |\n` +
    `| Authoritative captured coverage | ${gates.authoritativeCapturedCoverageFrames.accepted}/${gates.authoritativeCapturedCoverageFrames.required.toLocaleString("en-US")} frames |\n` +
    `| Full-frame/RMSE requirements | ${gates.fullFrameRmseRequirements.accepted}/${gates.fullFrameRmseRequirements.required} |\n` +
    `| Registered formal JavaScript renderer | ${gates.registeredFormalJavascriptRenderer.accepted}/${gates.registeredFormalJavascriptRenderer.required} |\n` +
    `| Strict completion | ${gates.strictCompletion.accepted}/${gates.strictCompletion.required} |\n` +
    `| Atomic whole-lesson publication | false; ${gates.atomicWholeLessonPublication.admitted}/${gates.atomicWholeLessonPublication.required} admitted |\n\n` +
    `## Hash-bound lineage\n\n` +
    `- v1 JSON: \`${report.predecessor.continuationV1Json.sha256}\`\n` +
    `- v1 Markdown: \`${report.predecessor.continuationV1Markdown.sha256}\`\n` +
    `- VB003 diagnostic manifest: \`${report.evidenceBindings.vb003CurrentJavascriptDiagnostic.sha256}\`\n` +
    `- VB003 producer: \`${report.evidenceBindings.vb003Producer.sha256}\`\n` +
    `- VB003 focused test: \`${report.evidenceBindings.vb003FocusedTests.sha256}\`\n\n` +
    `All acceptance claims and registry, coverage, baseline, RMSE, audio, review, ledger, integration, and publication mutation fields remain false.\n`;
}

async function writeImmutable(relativePath, contents) {
  const handle = await open(path.join(PROJECT_ROOT, relativePath), "wx", 0o444);
  try {
    await handle.writeFile(contents);
  } finally {
    await handle.close();
  }
  await chmod(path.join(PROJECT_ROOT, relativePath), 0o444);
}

export function parseArguments(argv) {
  invariant(argv.length === 1 && ["--write", "--check"].includes(argv[0]),
    "usage: node scripts/build-g4-l10-formal-migration-continuation-v2.mjs (--write|--check)");
  return {write: argv[0] === "--write", check: argv[0] === "--check"};
}

export async function writeOrCheck(report, mode) {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  if (mode.check) {
    invariant(await readFile(path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE), "utf8") === json,
      `${JSON_REPORT_RELATIVE} is stale`);
    invariant(await readFile(path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE), "utf8") === markdown,
      `${MARKDOWN_REPORT_RELATIVE} is stale`);
    process.stdout.write(`${JSON_REPORT_RELATIVE}: pass\n${MARKDOWN_REPORT_RELATIVE}: pass\n`);
    return;
  }
  invariant(mode.write === true, "write mode was not explicit");
  await writeImmutable(JSON_REPORT_RELATIVE, json);
  await writeImmutable(MARKDOWN_REPORT_RELATIVE, markdown);
  process.stdout.write(`${JSON_REPORT_RELATIVE}: wrote ${Buffer.byteLength(json)} bytes\n`);
  process.stdout.write(`${MARKDOWN_REPORT_RELATIVE}: wrote ${Buffer.byteLength(markdown)} bytes\n`);
}

async function main() {
  const mode = parseArguments(process.argv.slice(2));
  await writeOrCheck(await buildReport(), mode);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
