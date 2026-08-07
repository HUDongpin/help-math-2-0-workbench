import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {
  buildLessonAudioOwnershipReadiness,
  parseLessonAudioOwnershipArguments,
  renderLessonAudioOwnershipReadinessMarkdown,
  validateLessonAudioOwnershipReadiness,
} from "./build-lesson-audio-ownership-readiness.mjs";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
const JSON_PATH = "reports/g5-l4-audio-ownership-readiness.json";
const MARKDOWN_PATH = "reports/g5-l4-audio-ownership-readiness.md";
const G5_L5_RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const G5_L5_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const G5_L5_JSON_PATH = "reports/g5-l5-audio-ownership-readiness.json";
const G5_L5_MARKDOWN_PATH = "reports/g5-l5-audio-ownership-readiness.md";

function clone(value) {
  return structuredClone(value);
}

test("checked-in G5 L4 audio ownership report is acceptance-neutral and complete", async () => {
  const report = validateLessonAudioOwnershipReadiness(JSON.parse(await readFile(path.join(ROOT, JSON_PATH), "utf8")));
  assert.deepEqual(report.summary, {
    memberCount: 55,
    exactPageCandidateMemberCount: 50,
    sharedFinalQuizGroupMemberCount: 3,
    noCatalogCandidateMemberCount: 2,
    candidateFileCount: 135,
    exactPageCandidateFileCount: 50,
    sharedFinalQuizGroupFileCount: 83,
    unmappedCandidateFileCount: 2,
    physicalHashVerifiedFileCount: 135,
    catalogLanguageCandidateCounts: {en: 41, es: 42, unresolved: 52},
    memberCandidateReferenceCount: 299,
    canonicalInventoryRowCount: 373,
    dedicatedMachineAudioAuditPresentCount: 55,
    machineCueMapCompleteCount: 0,
    spokenLanguageEstablishedFileCount: 0,
    authorizedOriginalRuntimeListeningSessionCount: 0,
    audioAcceptedFileCount: 0,
    audioAcceptedMemberCount: 0,
    strictCompleteMemberCount: 0,
    publishedMemberCount: 0,
    candidateSetSha256: "bab0994d66abff13d7a38d25e6cf779e07b9ac88d3e2132ebe50daff829cbbde",
    memberPlanSetSha256: "aaeabe09662f29c0487e579bdc50cb8291eb0dd10aee23d545e2af352fecf918",
  });
  assert.equal(report.unresolvedUnmappedCandidates.length, 2);
  assert.deepEqual(report.unresolvedUnmappedCandidates.map(({source}) => path.basename(source.path)), [
    "GR5_L4_TS_Q1_SpA.mp3",
    "GR5_L4_TS_Q1_SpC.mp3",
  ]);
  assert.equal(report.memberPlans.filter(({candidateOwnership}) => candidateOwnership.candidateCount === 83).length, 3);
  assert.equal(report.candidateFiles.every(({listening}) => listening.accepted === false), true);
});

test("release-driven builder reproduces the checked-in JSON and Markdown", async () => {
  const report = await buildLessonAudioOwnershipReadiness({root: ROOT, releaseId: RELEASE_ID, scopePath: SCOPE_PATH});
  assert.equal(`${JSON.stringify(report, null, 2)}\n`, await readFile(path.join(ROOT, JSON_PATH), "utf8"));
  assert.equal(`${renderLessonAudioOwnershipReadinessMarkdown(report)}\n`, await readFile(path.join(ROOT, MARKDOWN_PATH), "utf8"));
});

test("checked-in G5 L5 audio ownership report keeps all 57 members and 182 candidates fail-closed", async () => {
  const report = validateLessonAudioOwnershipReadiness(JSON.parse(await readFile(path.join(ROOT, G5_L5_JSON_PATH), "utf8")));
  assert.equal(report.summary.memberCount, 57);
  assert.equal(report.summary.exactPageCandidateMemberCount, 52);
  assert.equal(report.summary.sharedFinalQuizGroupMemberCount, 3);
  assert.equal(report.summary.noCatalogCandidateMemberCount, 2);
  assert.equal(report.summary.candidateFileCount, 182);
  assert.equal(report.summary.exactPageCandidateFileCount, 52);
  assert.equal(report.summary.sharedFinalQuizGroupFileCount, 128);
  assert.equal(report.summary.unmappedCandidateFileCount, 2);
  assert.equal(report.summary.physicalHashVerifiedFileCount, 182);
  assert.deepEqual(report.summary.catalogLanguageCandidateCounts, {en: 67, es: 61, unresolved: 54});
  assert.equal(report.summary.memberCandidateReferenceCount, 436);
  assert.equal(report.summary.canonicalInventoryRowCount, 285);
  assert.equal(report.summary.dedicatedMachineAudioAuditPresentCount, 57);
  assert.equal(report.summary.candidateSetSha256, "dea15c3727e55f3efb3dc8f1e19c305a1f429ff37c0db23a1a9e0fc042dcf559");
  assert.equal(report.summary.memberPlanSetSha256, "f6df2d2089927515317a77537d8778c1ce340c56ce7cb0d796276bbec1f1df39");
  assert.equal(report.summary.audioAcceptedFileCount, 0);
  assert.equal(report.summary.audioAcceptedMemberCount, 0);
  assert.equal(report.summary.strictCompleteMemberCount, 0);
  assert.equal(report.summary.publishedMemberCount, 0);
  assert.deepEqual(report.unresolvedUnmappedCandidates.map(({source}) => path.basename(source.path)), [
    "GR5_L5_TS_Q1_SpC.mp3",
    "L5TS09.mp3",
  ]);
  const activeIntroduction = report.memberPlans.find(({animationId}) => animationId === "course-g05-l05-ir-001-664ab764");
  assert.equal(activeIntroduction.candidateOwnership.classification, "no-catalog-candidate-negative-proof-pending");
  assert.equal(activeIntroduction.acceptance.audioAccepted, false);
  assert.equal(report.candidateFiles.every(({listening}) => listening.accepted === false), true);
  assert.equal(Object.values(report.authorityBoundary).some((value) => value === true), true);
  assert.equal(report.authorityBoundary.acceptanceNeutral, true);
  assert.equal(Object.entries(report.authorityBoundary)
    .filter(([key]) => key !== "acceptanceNeutral")
    .every(([, value]) => value === 0 || value === false), true);
});

test("G5 L5 release-driven builder reproduces checked-in JSON and Markdown", async () => {
  const report = await buildLessonAudioOwnershipReadiness({
    root: ROOT,
    releaseId: G5_L5_RELEASE_ID,
    scopePath: G5_L5_SCOPE_PATH,
  });
  assert.equal(`${JSON.stringify(report, null, 2)}\n`, await readFile(path.join(ROOT, G5_L5_JSON_PATH), "utf8"));
  assert.equal(`${renderLessonAudioOwnershipReadinessMarkdown(report)}\n`, await readFile(path.join(ROOT, G5_L5_MARKDOWN_PATH), "utf8"));
});

test("CLI --check rehashes all sources and current workspace inputs", async () => {
  const result = await execFileAsync(process.execPath, [
    path.join(ROOT, "scripts/build-lesson-audio-ownership-readiness.mjs"),
    "--release-id", RELEASE_ID,
    "--scope", SCOPE_PATH,
    "--json-output", JSON_PATH,
    "--markdown-output", MARKDOWN_PATH,
    "--check",
  ], {cwd: ROOT, encoding: "utf8", maxBuffer: 4 * 1024 * 1024});
  assert.match(result.stdout, /PASS: 135\/135 physical candidates hash-bound across 55 members; acceptance effect none/);
});

test("G5 L5 CLI --check rehashes 182 sources and all 57 current workspace inputs", async () => {
  const result = await execFileAsync(process.execPath, [
    path.join(ROOT, "scripts/build-lesson-audio-ownership-readiness.mjs"),
    "--release-id", G5_L5_RELEASE_ID,
    "--scope", G5_L5_SCOPE_PATH,
    "--json-output", G5_L5_JSON_PATH,
    "--markdown-output", G5_L5_MARKDOWN_PATH,
    "--check",
  ], {cwd: ROOT, encoding: "utf8", maxBuffer: 8 * 1024 * 1024});
  assert.match(result.stdout, /PASS: 182\/182 physical candidates hash-bound across 57 members; acceptance effect none/);
});

test("validator rejects machine claims that cross audio acceptance boundaries", async () => {
  const source = JSON.parse(await readFile(path.join(ROOT, JSON_PATH), "utf8"));
  const mutations = [
    [(report) => { report.authorityBoundary.audioPlayed = true; }, /authority boundary/],
    [(report) => { report.acceptance.listeningAccepted = true; }, /acceptance state/],
    [(report) => { report.summary.audioAcceptedMemberCount = 1; }, /must remain zero/],
    [(report) => { report.memberPlans[0].acceptance.strictComplete = true; }, /acceptance must remain false/],
    [(report) => { report.candidateFiles[0].languageEvidence.spokenLanguageEstablished = true; }, /language evidence/],
    [(report) => { report.candidateFiles.find(({classification}) => classification === "unmapped-candidate-pending-disposition").candidateGrouping.ownerAnimationIds = [report.memberPlans[0].animationId]; }, /unmapped candidate gained an unreviewed owner/],
  ];
  for (const [mutate, pattern] of mutations) {
    const report = clone(source);
    mutate(report);
    assert.throws(() => validateLessonAudioOwnershipReadiness(report), pattern);
  }
});

test("validator rejects missing files, unknown candidate references, and stale fingerprints", async () => {
  const source = JSON.parse(await readFile(path.join(ROOT, JSON_PATH), "utf8"));
  const missing = clone(source);
  missing.candidateFiles.pop();
  assert.throws(() => validateLessonAudioOwnershipReadiness(missing), /unknown candidate|Candidate summary is stale|Unmapped candidate dispositions/);

  const unknown = clone(source);
  unknown.memberPlans[0].candidateOwnership.candidateIds.push(`audio-${"0".repeat(64)}`);
  unknown.memberPlans[0].candidateOwnership.candidateCount += 1;
  assert.throws(() => validateLessonAudioOwnershipReadiness(unknown), /unknown candidate/);

  const stale = clone(source);
  stale.release.title = "Changed";
  assert.throws(() => validateLessonAudioOwnershipReadiness(stale), /report fingerprint is stale/);
});

test("argument parser requires explicit release and source-scope identity", () => {
  const options = parseLessonAudioOwnershipArguments([
    "--release-id", RELEASE_ID,
    "--scope", SCOPE_PATH,
    "--check",
  ]);
  assert.equal(options.releaseId, RELEASE_ID);
  assert.equal(options.scopePath, SCOPE_PATH);
  assert.equal(options.check, true);
  assert.equal(options.jsonOutput, `reports/${RELEASE_ID}-audio-ownership-readiness.json`);
  assert.equal(options.markdownOutput, `reports/${RELEASE_ID}-audio-ownership-readiness.md`);
  assert.throws(() => parseLessonAudioOwnershipArguments(["--unknown"]), /Unknown option/);
});
