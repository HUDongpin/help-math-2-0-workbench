#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {validateContract as validateV8Contract} from
  "./build-g4-l10-complete-migration-template-contract-v8.mjs";
import {validateReport as validateLanguageAudioBinding} from
  "./build-g4-l10-ts007-ts008-language-audio-technical-binding-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v9-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v9-2026-08-07.md";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v9.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-complete-migration-template-contract-v9.test.mjs";

const EXPECTED_INPUTS = Object.freeze({
  v8Contract: {
    path: "reports/g4-l10-complete-migration-template-contract-v8-2026-08-07.json",
    bytes: 251342,
    sha256: "c9066a90a7add7795a0e9702c94a7b1a060334e8962c65a180ae2cf4b23ed2f4",
    mode: "0444",
  },
  v8Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v8.mjs",
    bytes: 22265,
    sha256: "7676f3094610fea04bb9c3924c9e1463dbf9bb9ca44c8c0eedfb6a520985342e",
    mode: "0644",
  },
  v8Test: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v8.test.mjs",
    bytes: 5430,
    sha256: "55eb795c8d209b7fb208fc4e9703fc8abe8be14af237050d2b7a5716497fe6a2",
    mode: "0644",
  },
  languageAudioJson: {
    path: "reports/g4-l10-ts007-ts008-language-audio-technical-binding-v1.json",
    bytes: 40916,
    sha256: "e2777a6652b8a2056b2253b9406f5daa769489aee647f0bcda1e5ed54b6e5782",
    mode: "0444",
  },
  languageAudioMarkdown: {
    path: "reports/g4-l10-ts007-ts008-language-audio-technical-binding-v1.md",
    bytes: 1571,
    sha256: "e1ce05cbe5c48e6fb8f9a4e5673d845dcccd90275ac727554a522213de568a67",
    mode: "0444",
  },
  languageAudioGenerator: {
    path: "scripts/build-g4-l10-ts007-ts008-language-audio-technical-binding-v1.mjs",
    bytes: 30931,
    sha256: "053711d1537ea11d441acc961fef55b0b0240586510cdd8a3881084cbb509567",
    mode: "0644",
  },
  languageAudioTest: {
    path: "scripts/build-g4-l10-ts007-ts008-language-audio-technical-binding-v1.test.mjs",
    bytes: 4706,
    sha256: "e9046842ab16c39f85f002673c4ee380513cb7eb2886c9d6957587ca1a0dc563",
    mode: "0644",
  },
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalize(value[key])]));
  }
  return value;
}

function reportFingerprint(report) {
  const {reportFingerprintSha256: ignored, ...payload} = report;
  return sha256(Buffer.from(JSON.stringify(canonicalize(payload)), "utf8"));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function modeString(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs,
    stat.mode, stat.nlink].map(String).join(":");
}

function resolveInside(root, relativePath) {
  assert.ok(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath));
  const absolute = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, absolute));
  assert.ok(relative && !relative.startsWith("../") &&
    !path.isAbsolute(relative), `${relativePath} escapes the project root`);
  return absolute;
}

async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

async function readStable(root, label, expected) {
  const rootReal = await canonicalRoot(root);
  const absolute = resolveInside(root, expected.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${label} is not an ordinary non-symlink file`);
  const resolved = await realpath(absolute);
  assert.ok(resolved.startsWith(`${rootReal}${path.sep}`),
    `${label} resolves outside the project root`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${label} changed during the snapshot`);
  const descriptor = {
    path: expected.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
  };
  assert.deepEqual(descriptor, expected, `${label} descriptor drifted`);
  return {descriptor, bytes, statIdentity: statIdentity(after)};
}

function parseJson(input, label) {
  try {
    return JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const inputs = {};
  const records = [];
  for (const [key, expected] of Object.entries(EXPECTED_INPUTS)) {
    const record = await readStable(root, key, expected);
    records.push(record);
    inputs[key] = record;
  }
  const identities = {};
  for (const [key, relativePath] of Object.entries({
    generator: GENERATOR_PATH,
    test: TEST_PATH,
  })) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute, {bigint: true});
    const expected = {
      path: relativePath,
      bytes: Number(stat.size),
      sha256: sha256(await readFile(absolute)),
      mode: modeString(stat),
    };
    const record = await readStable(root, key, expected);
    records.push(record);
    identities[key] = record;
  }
  return {projectRoot: root, inputs, identities, records};
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const current = await lstat(resolveInside(snapshot.projectRoot,
      record.descriptor.path), {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.descriptor.path} changed after the snapshot`);
  }
}

export function deriveContract(snapshot) {
  const v8 = parseJson(snapshot.inputs.v8Contract, "v8Contract");
  const audio = parseJson(snapshot.inputs.languageAudioJson,
    "languageAudioJson");
  validateV8Contract(v8);
  validateLanguageAudioBinding(audio);
  assert.equal(v8.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(audio.aggregate.totalCandidateCount, 26);
  assert.equal(audio.aggregate.acceptedCueCount, 0);
  assert.equal(audio.grade4Boundary.wholeGrade4MissingCourseMp3Count, 16);
  assert.equal(audio.members.every((member) =>
    member.manifestFollowUpProposal.applied === false), true);

  const inputBindings = Object.fromEntries(Object.entries(snapshot.inputs)
    .map(([key, value]) => [key, value.descriptor]));
  const report = {
    ...v8,
    schemaVersion: 9,
    reportType: "g4-l10-complete-migration-template-contract-v9",
    evidenceDate: "2026-08-07",
    status: "fail-closed-template-not-stable",
    templateStable: false,
    successorOf: snapshot.inputs.v8Contract.descriptor,
    authorityBoundary: {
      ...v8.authorityBoundary,
      readOnlyRecomputation: true,
      createsRuntimeEvidence: false,
      createsRenderer: false,
      mayLaunchOriginalRuntime: false,
      mayApplyDownstreamTransaction: false,
      mayRefreshOrAdoptEvidence: false,
      mayRegisterRenderer: false,
      mayMarkAcceptanceOrCompletion: false,
      mayIntegrateOrPublish: false,
    },
    latestAuditCurrentness: {
      ...v8.latestAuditCurrentness,
      ts007Ts008LanguageAudioBinding: {
        json: snapshot.inputs.languageAudioJson.descriptor,
        markdown: snapshot.inputs.languageAudioMarkdown.descriptor,
        status: audio.status,
        decision: audio.decision,
        reportFingerprintSha256: audio.reportFingerprintSha256,
        animationIds: audio.animationIds,
        memberCount: audio.aggregate.memberCount,
        exactExternalCandidateCount:
          audio.aggregate.exactExternalCandidateCount,
        embeddedUnknownLanguageCandidateCount:
          audio.aggregate.embeddedUnknownLanguageCandidateCount,
        totalCandidateCount: audio.aggregate.totalCandidateCount,
        languageObligationCount: audio.aggregate.languageObligationCount,
        targetActionScriptAudioOperationCount:
          audio.aggregate.targetActionScriptAudioOperationCount,
        currentManifestAudioLanguages:
          audio.members.map((member) => ({
            animationId: member.animationId,
            languages: member.currentManifestObservation.audioLanguages,
            exactAssociationLanguage:
              member.currentManifestObservation.exactAssociation.language,
          })),
        exactUnappliedFollowUp:
          audio.members.map((member) => ({
            animationId: member.animationId,
            rawManifestSha256RequiredAtApplyTime:
              member.manifestFollowUpProposal.rawManifestSha256RequiredAtApplyTime,
            operations: member.manifestFollowUpProposal.operations,
            applied: false,
            adopted: false,
          })),
        l10MissingCourseMp3Count:
          audio.grade4Boundary.l10MissingCourseMp3Count,
        wholeGrade4MissingCourseMp3Count:
          audio.grade4Boundary.wholeGrade4MissingCourseMp3Count,
        originalRuntimeExecuted: false,
        audioListeningPerformed: false,
        spokenLanguageEstablished: false,
        runtimeReachabilityEstablished: false,
        manifestFilesModified: false,
        formalStateChangeFromV8: false,
        templateStableEffect: false,
        acceptanceEffect: "none",
      },
      formalStateChangeFromV8: false,
      templateStableEffect: false,
      acceptanceEffect: "none",
    },
    inputBindings: {
      ...v8.inputBindings,
      v9SuccessorInputs: inputBindings,
    },
    builder: {
      generator: snapshot.identities.generator.descriptor,
      test: snapshot.identities.test.descriptor,
    },
  };
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 9);
  assert.equal(report.reportType,
    "g4-l10-complete-migration-template-contract-v9");
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.scope.activePageCount, 46);
  assert.equal(report.scope.shellCount, 1);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements
    .unresolvedFrameDomainDispositions, 74);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured,
    0);
  assert.equal(report.sourceAndCurriculumBindings.missingCourseMp3Count, 16);
  assert.equal(report.sourceAndCurriculumBindings.l10MissingCourseMp3Count, 0);
  const audio = report.latestAuditCurrentness.ts007Ts008LanguageAudioBinding;
  assert.equal(audio.memberCount, 2);
  assert.equal(audio.exactExternalCandidateCount, 2);
  assert.equal(audio.embeddedUnknownLanguageCandidateCount, 24);
  assert.equal(audio.totalCandidateCount, 26);
  assert.equal(audio.languageObligationCount, 4);
  assert.equal(audio.targetActionScriptAudioOperationCount, 0);
  assert.deepEqual(audio.currentManifestAudioLanguages, [
    {
      animationId: "course-g04-l10-ts-007",
      languages: ["und"],
      exactAssociationLanguage: "und",
    },
    {
      animationId: "course-g04-l10-ts-008",
      languages: ["und"],
      exactAssociationLanguage: "und",
    },
  ]);
  assert.ok(audio.exactUnappliedFollowUp.every((row) =>
    row.applied === false && row.adopted === false));
  assert.equal(audio.originalRuntimeExecuted, false);
  assert.equal(audio.audioListeningPerformed, false);
  assert.equal(audio.spokenLanguageEstablished, false);
  assert.equal(audio.runtimeReachabilityEstablished, false);
  assert.equal(audio.manifestFilesModified, false);
  assert.equal(audio.formalStateChangeFromV8, false);
  assert.equal(report.latestAuditCurrentness.formalStateChangeFromV8, false);
  assert.equal(report.latestAuditCurrentness.templateStableEffect, false);
  assert.equal(report.latestAuditCurrentness.acceptanceEffect, "none");
  assert.equal(report.latestSecurityReviewBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.deepEqual(report.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  const audio = report.latestAuditCurrentness.ts007Ts008LanguageAudioBinding;
  return `# Grade 4 Lesson 10 complete migration template contract v9\n\n` +
    `Status: **${report.status}**. Template stable: **${report.templateStable}**.\n\n` +
    `V9 preserves and validates the complete v8 contract, then binds the new ` +
    `TS007/TS008 language/audio technical successor.\n\n` +
    `## TS007/TS008 audio currentness\n\n` +
    `- Members: **${audio.memberCount}**; EN/ES obligations: **${audio.languageObligationCount}**.\n` +
    `- Exact external candidates: **${audio.exactExternalCandidateCount}**; embedded undetermined-language candidates: **${audio.embeddedUnknownLanguageCandidateCount}**.\n` +
    `- Child ActionScript audio operations: **${audio.targetActionScriptAudioOperationCount}**.\n` +
    `- Current manifest labels remain \`und\`; the exact \`[\"und\",\"es\"]\` / ` +
    `\`es\` successor proposal is recorded but not applied or adopted.\n` +
    `- L10 missing course MP3s: **${audio.l10MissingCourseMp3Count}**; ` +
    `whole Grade 4 missing course MP3s: **${audio.wholeGrade4MissingCourseMp3Count}**.\n\n` +
    `## Retained gate\n\n` +
    `The denominator remains 46 active pages plus one shell. Authoritative ` +
    `runtime frames remain 0/${report.currentFormalState.frameObligations.total}; ` +
    `the security batch remains failed and nonreusable. No manifest, helper, ` +
    `runtime, specification, renderer, behavior, RMSE, audio/human/owner ` +
    `acceptance, strict completion, integration, promotion, release, or ` +
    `publication authority is created.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function outputState(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function checkContract(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expectedContent] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.equal(modeString(stat), "0444", `${relativePath} mode changed`);
    const observed = await readFile(absolute);
    assert.equal(observed.length, Buffer.byteLength(expectedContent),
      `${relativePath} byte count changed`);
    assert.equal(sha256(observed), sha256(Buffer.from(expectedContent)),
      `${relativePath} SHA-256 changed`);
  }
  if (options.skipInputCheck !== true) await assertSnapshotUnchanged(bundle.snapshot);
  return {
    disposition: "checked",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    templateStable: false,
    candidateCount: 26,
    manifestFollowUpApplied: false,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const root = await canonicalRoot(options.outputRoot ??
    bundle.snapshot.projectRoot);
  const jsonState = await outputState(root, REPORT_JSON);
  const markdownState = await outputState(root, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkContract(bundle, root, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkContract(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    templateStable: false,
    candidateCount: 26,
    manifestFollowUpApplied: false,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
