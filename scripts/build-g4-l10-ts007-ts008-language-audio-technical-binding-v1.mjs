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

import {parseAudioInventory} from "./audio-listening-acceptance.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const ANIMATION_IDS = Object.freeze([
  "course-g04-l10-ts-007",
  "course-g04-l10-ts-008",
]);
export const GENERATOR_PATH =
  "scripts/build-g4-l10-ts007-ts008-language-audio-technical-binding-v1.mjs";
export const REPORT_JSON =
  "reports/g4-l10-ts007-ts008-language-audio-technical-binding-v1.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-ts007-ts008-language-audio-technical-binding-v1.md";

const STATUS =
  "SOURCE_STATIC_EN_ES_AUDIO_CANDIDATES_BOUND_MANIFEST_FOLLOWUP_UNAPPLIED_RUNTIME_LISTENING_PENDING";
const DECISION =
  "PRESERVE_EXACT_CANDIDATES_DO_NOT_PATCH_MANIFEST_DO_NOT_PLAY_DO_NOT_ACCEPT";

const MEMBER_INPUTS = Object.freeze({
  "course-g04-l10-ts-007": {
    ordinal: 42,
    title: "Question 1",
    sourceSwf: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
      bytes: 585839,
      sha256: "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff",
      mode: "0500",
    },
    spanishMp3: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10TS07.mp3",
      bytes: 128016,
      sha256: "3ea4640a0ef8a7b4fdb2bc80fa0afb929b82ded77ed780ca95eede8020568372",
      mode: "0500",
    },
    manifest: {
      path: "migrations/course-g04-l10-ts-007/migration.json",
      bytes: 28936,
      sha256: "62a981ef41d274f5ec9b3ad69852d3e7b860db4270cb895085387ca395cc8337",
      mode: "0644",
    },
    audioInventory: {
      path: "migrations/course-g04-l10-ts-007/audio-inventory.csv",
      bytes: 7292,
      sha256: "220de57bdf0836e2627796f85f9c6b731085c2467b4c1c55daec56315d4c98e2",
      mode: "0600",
    },
    audioRuntime: {
      path: "migrations/course-g04-l10-ts-007/audit/audio-runtime-evidence.json",
      bytes: 22627,
      sha256: "f14df917b35dc501432aaeb553a994831257408a104a1ae220eaf04c8ebd3546",
      mode: "0600",
    },
    externalDurationMs: 9144,
    embeddedDurationMs: 93998,
    embeddedCharacterIds: [121, 157, 221, 235, 246, 258, 292, 304, 317, 349, 388, 415],
  },
  "course-g04-l10-ts-008": {
    ordinal: 43,
    title: "Question 2",
    sourceSwf: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf",
      bytes: 556547,
      sha256: "59299d4acf780a24e5f221fb1f4fe5e9a8330303367b9632c7b1ff2d6bf7b3a5",
      mode: "0500",
    },
    spanishMp3: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10TS08.mp3",
      bytes: 217392,
      sha256: "be113dae1147cc56a0945c3f780f148e4beba56863b651aa8e6a98ac25884716",
      mode: "0500",
    },
    manifest: {
      path: "migrations/course-g04-l10-ts-008/migration.json",
      bytes: 28936,
      sha256: "d7630d31090e204f84d6e93f334d876caf5f7d32428014d7396bb1490afaab6d",
      mode: "0644",
    },
    audioInventory: {
      path: "migrations/course-g04-l10-ts-008/audio-inventory.csv",
      bytes: 7293,
      sha256: "4fc2bacd60223935438ee4efc7afdcbba6476ecaba626562aebecac336a3e876",
      mode: "0600",
    },
    audioRuntime: {
      path: "migrations/course-g04-l10-ts-008/audit/audio-runtime-evidence.json",
      bytes: 22630,
      sha256: "f8b684f2dfa072b3296613b3343240bf386983a8743cd08206c9a7328b365b88",
      mode: "0600",
    },
    externalDurationMs: 15528,
    embeddedDurationMs: 88486,
    embeddedCharacterIds: [110, 148, 220, 234, 245, 257, 291, 303, 316, 348, 387, 413],
  },
});

const SHARED_INPUTS = Object.freeze({
  languageAudioMatrix: {
    path: "reports/lesson-g04-l10-perimeter-area-language-audio-cue-obligation-matrix.json",
    bytes: 1247159,
    sha256: "d71e3f0bf05c6db20d02d8327d7ec53e99d9735d7045547af0a9231c69928e23",
    mode: "0644",
  },
  vb003TechnicalBinding: {
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    bytes: 17024,
    sha256: "ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e",
    mode: "0644",
  },
  templateContractV8: {
    path: "reports/g4-l10-complete-migration-template-contract-v8-2026-08-07.json",
    bytes: 251342,
    sha256: "c9066a90a7add7795a0e9702c94a7b1a060334e8962c65a180ae2cf4b23ed2f4",
    mode: "0444",
  },
  failedSecurityBatch: {
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json",
    bytes: 9999,
    sha256: "de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2",
    mode: "0444",
  },
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "workspaceModified",
  "manifestFollowUpAdopted",
  "audioPlayed",
  "originalRuntimeExecuted",
  "originalRuntimeBaselineEstablished",
  "runtimeReachabilityEstablished",
  "spokenLanguageEstablished",
  "synchronizationEstablished",
  "rendererImplemented",
  "behaviorAccepted",
  "rmseAccepted",
  "audioAccepted",
  "humanReviewAccepted",
  "ownerAcceptanceAccepted",
  "strictCompletionAccepted",
  "wholeCourseIntegrationAccepted",
  "promotionAccepted",
  "publicationAccepted",
]);

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

function sameCanonical(left, right) {
  return JSON.stringify(canonicalize(left)) ===
    JSON.stringify(canonicalize(right));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function reportFingerprint(report) {
  const {reportFingerprintSha256: ignored, ...payload} = report;
  return sha256(Buffer.from(JSON.stringify(canonicalize(payload)), "utf8"));
}

function modeString(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs,
    stat.mode, stat.nlink].map(String).join(":");
}

function resolveInside(root, relativePath) {
  assert.equal(typeof relativePath, "string");
  assert.ok(relativePath.length > 0 && !path.isAbsolute(relativePath));
  const resolved = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, resolved));
  assert.ok(relative && !relative.startsWith("../") &&
    !path.isAbsolute(relative), `${relativePath} escapes the project root`);
  return resolved;
}

async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

async function readStable(root, label, expected) {
  const absolute = resolveInside(root, expected.path);
  const rootReal = await canonicalRoot(root);
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

async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const records = [];
  const members = {};
  for (const animationId of ANIMATION_IDS) {
    members[animationId] = {};
    for (const [key, expected] of Object.entries(MEMBER_INPUTS[animationId])) {
      if (!["sourceSwf", "spanishMp3", "manifest", "audioInventory",
        "audioRuntime"].includes(key)) continue;
      const record = await readStable(root, `${animationId}.${key}`, expected);
      records.push(record);
      members[animationId][key] = record;
    }
  }
  const shared = {};
  for (const [key, expected] of Object.entries(SHARED_INPUTS)) {
    const record = await readStable(root, key, expected);
    records.push(record);
    shared[key] = record;
  }
  const generatorExpected = {
    path: GENERATOR_PATH,
    bytes: Number((await lstat(resolveInside(root, GENERATOR_PATH))).size),
    sha256: sha256(await readFile(resolveInside(root, GENERATOR_PATH))),
    mode: modeString(await lstat(resolveInside(root, GENERATOR_PATH),
      {bigint: true})),
  };
  const generator = await readStable(root, "generator", generatorExpected);
  records.push(generator);
  return {projectRoot: root, members, shared, generator, records};
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const current = await lstat(resolveInside(snapshot.projectRoot,
      record.descriptor.path), {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.descriptor.path} changed after the snapshot`);
  }
}

function deriveMember(snapshot, matrix, animationId) {
  const expected = MEMBER_INPUTS[animationId];
  const inputs = snapshot.members[animationId];
  const manifest = parseJson(inputs.manifest, `${animationId}.manifest`);
  const runtime = parseJson(inputs.audioRuntime, `${animationId}.audioRuntime`);
  const inventory = parseAudioInventory(inputs.audioInventory.bytes.toString("utf8"));
  const matrixMember = matrix.members.find((row) =>
    row.animationId === animationId);
  const obligations = matrix.obligationRows.filter((row) =>
    row.animationId === animationId);
  const external = matrix.externalPools.exactBasenameAssociations.filter((row) =>
    row.ownerAnimationIds?.includes(animationId));
  const embedded = matrix.embeddedStructuralCandidates.soundStreams.filter((row) =>
    row.animationId === animationId);
  const operations = matrix.actionScriptAudioOperations.filter((row) =>
    row.animationId === animationId);

  assert.equal(manifest.animationId, animationId);
  assert.deepEqual(manifest.localization?.languages, ["en", "es"]);
  assert.equal(manifest.localization?.bilingualRequired, true);
  assert.equal(manifest.audio?.required, true);
  assert.deepEqual(manifest.audio?.languages, ["und"]);
  assert.deepEqual(manifest.audio?.cues, []);
  assert.equal(manifest.audio?.catalogExactAssociations?.length, 1);
  const manifestAssociation = manifest.audio.catalogExactAssociations[0];
  assert.deepEqual(manifestAssociation, {
    sourceFile: expected.spanishMp3.path,
    sha256: expected.spanishMp3.sha256,
    language: "und",
    bytes: expected.spanishMp3.bytes,
    association: "matching-basename",
  });

  assert.equal(runtime.animationId, animationId);
  assert.equal(runtime.source?.observedSha256, expected.sourceSwf.sha256);
  assert.equal(runtime.acceptance?.structurallyAudited, true);
  assert.equal(runtime.acceptance?.authoritativeListeningComplete, false);
  assert.equal(runtime.acceptance?.hostStateTraversalComplete, false);
  assert.equal(runtime.acceptance?.synchronizationComplete, false);
  assert.equal(runtime.acceptance?.strictAudioAcceptance, "pending");
  assert.equal(runtime.externalAudio?.exactAssociations?.length, 1);
  assert.equal(runtime.embeddedAudio?.soundStreams?.length, 12);
  assert.equal(runtime.actionScriptAudioOperations?.length, 0);

  assert.equal(inventory.rows.length, 13);
  assert.deepEqual([...new Set(inventory.rows.map((row) => row.language))].sort(),
    ["es", "und"]);
  assert.equal(inventory.rows.filter((row) => row.language === "es").length, 1);
  assert.equal(inventory.rows.filter((row) => row.language === "und").length, 12);

  assert.equal(matrixMember.ordinal, expected.ordinal);
  assert.equal(matrixMember.xmlPage.randomAudio, "empty");
  assert.equal(matrixMember.canonicalInventory.rowCount, 13);
  assert.equal(matrixMember.canonicalInventory.exactMachineTriangulation, true);
  assert.equal(matrixMember.structuralCounts.actionScriptAudioOperations, 0);
  assert.equal(external.length, 1);
  assert.equal(embedded.length, 12);
  assert.equal(operations.length, 0);
  assert.equal(external[0].source.sha256, expected.spanishMp3.sha256);
  assert.equal(external[0].routingLanguageCandidate, "es");
  assert.equal(external[0].spokenLanguage, null);
  assert.equal(external[0].runtimeReachabilityEstablished, false);
  assert.equal(external[0].probe.durationMs, expected.externalDurationMs);
  assert.deepEqual(embedded.map((row) => row.context.characterId),
    expected.embeddedCharacterIds);
  assert.equal(embedded.reduce((total, row) => total + row.durationMs, 0),
    expected.embeddedDurationMs);
  assert.ok(embedded.every((row) => row.languageCandidate === "und" &&
    row.spokenLanguage === null && row.rootRuntimeCueTime === null));
  assert.equal(obligations.length, 2);
  const en = obligations.find((row) => row.language === "en");
  const es = obligations.find((row) => row.language === "es");
  assert.equal(en.exactBasenameAssociationIds.length, 0);
  assert.equal(en.embeddedUnknownLanguageCandidateIds.length, 12);
  assert.equal(es.exactBasenameAssociationIds.length, 1);
  assert.equal(es.embeddedUnknownLanguageCandidateIds.length, 12);
  assert.ok(obligations.every((row) => row.accepted === false &&
    row.status === "unresolved-listening-required"));

  return {
    animationId,
    ordinal: expected.ordinal,
    xmlPage: matrixMember.xmlPage,
    sourceBindings: Object.fromEntries(Object.entries(inputs).map(([key, value]) =>
      [key, value.descriptor])),
    currentManifestObservation: {
      localizationLanguages: manifest.localization.languages,
      audioRequired: manifest.audio.required,
      audioLanguages: manifest.audio.languages,
      audioCueCount: manifest.audio.cues.length,
      exactAssociation: manifestAssociation,
      discrepancy:
        "audio.languages and the exact association label omit the structurally classified es route while the canonical inventory preserves es plus und",
    },
    candidateCounts: {
      exactExternal: 1,
      embeddedUnknownLanguage: 12,
      total: 13,
      targetActionScriptAudioOperations: 0,
    },
    exactExternalCandidate: {
      candidateId: external[0].candidateId,
      source: external[0].source,
      routingLanguageCandidate: "es",
      routingEvidenceScope: "legacy-host-routing-only",
      spokenLanguage: null,
      spokenLanguageEstablished: false,
      probe: external[0].probe,
      startSemantics: "host-user-activated",
      rootRuntimeCueTime: null,
      runtimeReachabilityEstablished: false,
      listeningRequired: true,
    },
    embeddedCandidates: embedded.map((row) => ({
      candidateId: row.candidateId,
      context: row.context,
      contextDeclaredFrames: row.contextDeclaredFrames,
      headFrame: row.headFrame,
      firstBlockFrame: row.firstBlockFrame,
      lastBlockFrame: row.lastBlockFrame,
      blockCount: row.blockCount,
      durationMs: row.durationMs,
      format: row.format,
      channels: row.channels,
      sampleRateHz: row.sampleRateHz,
      languageCandidate: "und",
      spokenLanguage: null,
      rootRuntimeCueTime: null,
      runtimeReachabilityEstablished: false,
      listeningRequired: true,
    })),
    languageObligations: [en, es].map((row) => ({
      obligationId: row.obligationId,
      language: row.language,
      hostRouteCandidate: row.hostRouteCandidate,
      exactExternalCandidateIds: row.exactBasenameAssociationIds,
      embeddedUnknownLanguageCandidateIds:
        row.embeddedUnknownLanguageCandidateIds,
      actionScriptOperationIds: row.actionScriptOperationIds,
      unresolved: row.unresolved,
      authoritativeOriginalRuntimeTraversalComplete: false,
      namedHumanListeningComplete: false,
      accepted: false,
      status: row.status,
    })),
    manifestFollowUpProposal: {
      status: "EXACT_PATCH_CANDIDATE_ONLY_NOT_APPLIED_NOT_ADOPTED",
      operations: [
        {
          jsonPointer: "/audio/languages",
          exactPreimage: ["und"],
          proposedSuccessorValue: ["und", "es"],
          rationale:
            "Preserve und for the twelve embedded streams and add es for the exact external route candidate.",
        },
        {
          jsonPointer: "/audio/catalogExactAssociations/0/language",
          exactPreimage: "und",
          proposedSuccessorValue: "es",
          rationale:
            "Represent the verified SA/SP routing classification without claiming spoken-language content.",
        },
      ],
      rawManifestSha256RequiredAtApplyTime: expected.manifest.sha256,
      applyAuthorizedByThisArtifact: false,
      applied: false,
      adoptionReviewPresent: false,
      downstreamRegenerationPlanPresent: false,
      rule:
        "Do not patch the manifest until a separately reviewed successor transaction binds every raw-manifest-hash dependent audit and regenerates them no-clobber.",
    },
    authorityEffects: Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
      [key, false])),
  };
}

function deriveReport(snapshot) {
  const matrix = parseJson(snapshot.shared.languageAudioMatrix,
    "languageAudioMatrix");
  const vb003 = parseJson(snapshot.shared.vb003TechnicalBinding,
    "vb003TechnicalBinding");
  const template = parseJson(snapshot.shared.templateContractV8,
    "templateContractV8");
  const security = parseJson(snapshot.shared.failedSecurityBatch,
    "failedSecurityBatch");

  assert.equal(matrix.releaseId, RELEASE_ID);
  assert.equal(matrix.status,
    "machine-structural-obligations-current-listening-required");
  assert.equal(matrix.hostLanguageRouting.routeCandidates.es.hostLanguageCode,
    "SP");
  assert.equal(matrix.hostLanguageRouting.routeCandidates.es
    .ordinaryPageExternalDirectory, "SA");
  assert.equal(matrix.hostLanguageRouting.spokenLanguageEstablished, false);
  assert.equal(matrix.hostLanguageRouting.audibleContentEstablished, false);
  assert.equal(matrix.hostLanguageRouting.runtimeRouteTraversalEstablished,
    false);
  assert.equal(vb003.status,
    "source-static-candidate-and-obligation-binding-runtime-and-listening-unresolved");
  assert.equal(vb003.formalEvidence.authorizedOriginalRuntimeExecuted, false);
  assert.equal(vb003.summary.acceptedCueCount, 0);
  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.sourceAndCurriculumBindings.missingCourseMp3Count, 16);
  assert.deepEqual(template.sourceAndCurriculumBindings.missingCourseMp3ByLesson,
    {2: 14, 6: 1, 8: 1});
  assert.equal(template.sourceAndCurriculumBindings.l10MissingCourseMp3Count, 0);
  assert.equal(security.status,
    "FAILED_TWO_TASK_SYSTEM_INCOMPLETE_ONE_P1_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(security.batchResult.reusable, false);
  assert.equal(security.batchResult.productionHelperImplementationEligible,
    false);

  const members = ANIMATION_IDS.map((animationId) =>
    deriveMember(snapshot, matrix, animationId));
  const report = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-ts007-ts008-language-audio-technical-binding-successor",
    releaseId: RELEASE_ID,
    animationIds: ANIMATION_IDS,
    status: STATUS,
    decision: DECISION,
    scope:
      "exact-source-static-en-es-audio-candidate-obligation-and-unapplied-manifest-follow-up-binding-only",
    authorityStatement: [
      "This artifact binds source-static audio candidates and EN/ES obligations for TS007 and TS008; it does not classify audible content.",
      "SA/SP routing establishes a Spanish route candidate, not spoken language, voice identity, playback, timing, or acceptance.",
      "Embedded local SoundStream frames are not root/runtime cue times.",
      "No workspace or manifest was modified and no proposed patch is adopted by this artifact.",
    ],
    generator: snapshot.generator.descriptor,
    sharedSourceBindings: Object.fromEntries(Object.entries(snapshot.shared)
      .map(([key, value]) => [key, value.descriptor])),
    hostLanguageRouting: {
      authority: matrix.hostLanguageRouting.authority,
      routeCandidates: matrix.hostLanguageRouting.routeCandidates,
      spokenLanguageEstablished: false,
      audibleContentEstablished: false,
      runtimeRouteTraversalEstablished: false,
      boundary: matrix.hostLanguageRouting.boundary,
    },
    members,
    aggregate: {
      memberCount: 2,
      languageObligationCount: 4,
      exactExternalCandidateCount: 2,
      embeddedUnknownLanguageCandidateCount: 24,
      totalCandidateCount: 26,
      targetActionScriptAudioOperationCount: 0,
      externalDurationMsTotal: 24672,
      embeddedStructuralDurationMsTotal: 182484,
      adoptedCueCount: 0,
      runtimeReachabilityEstablishedCount: 0,
      spokenLanguageEstablishedCount: 0,
      acceptedCueCount: 0,
    },
    grade4Boundary: {
      l10MissingCourseMp3Count: 0,
      theseExactExternalMp3sAreAmongMissing16: false,
      wholeGrade4MissingCourseMp3Count: 16,
      missingCourseMp3ByLesson: {2: 14, 6: 1, 8: 1},
      wholeGrade4DependencyClosureEstablished: false,
      rule:
        "The two L10 files are present, but the sixteen Grade 4 MP3 blockers remain unresolved and may not be inferred by name, case, or placement.",
    },
    securityAndRuntimeBoundary: {
      latestReviewStatus: security.status,
      reviewBatchReusable: false,
      productionHelperImplementationEligible: false,
      originalRuntimeLaunchAuthorizedByThisArtifact: false,
      namedOriginalRuntimeOperatorConditionActivated: false,
      audioListeningPerformed: false,
    },
    review: {
      independentReviewTaskAuthorizedByThisArtifact: false,
      reviewTaskIds: [],
      reviewVerdictPresent: false,
      manifestSuccessorAdopted: false,
    },
    authorityEffects: Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
      [key, false])),
    nextPermittedAction:
      "Independently review this static binding and separately authorize any exact-preimage manifest successor transaction; original-runtime listening remains gated by a future qualifying security closure and per-launch receipt.",
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.status, STATUS);
  assert.equal(report.decision, DECISION);
  assert.deepEqual(report.animationIds, ANIMATION_IDS);
  assert.equal(report.members.length, 2);
  assert.deepEqual(report.aggregate, {
    memberCount: 2,
    languageObligationCount: 4,
    exactExternalCandidateCount: 2,
    embeddedUnknownLanguageCandidateCount: 24,
    totalCandidateCount: 26,
    targetActionScriptAudioOperationCount: 0,
    externalDurationMsTotal: 24672,
    embeddedStructuralDurationMsTotal: 182484,
    adoptedCueCount: 0,
    runtimeReachabilityEstablishedCount: 0,
    spokenLanguageEstablishedCount: 0,
    acceptedCueCount: 0,
  });
  for (const member of report.members) {
    assert.deepEqual(member.currentManifestObservation.audioLanguages, ["und"]);
    assert.equal(member.currentManifestObservation.exactAssociation.language,
      "und");
    assert.equal(member.candidateCounts.total, 13);
    assert.equal(member.exactExternalCandidate.routingLanguageCandidate, "es");
    assert.equal(member.exactExternalCandidate.spokenLanguage, null);
    assert.equal(member.embeddedCandidates.length, 12);
    assert.ok(member.embeddedCandidates.every((candidate) =>
      candidate.languageCandidate === "und" &&
      candidate.spokenLanguage === null &&
      candidate.rootRuntimeCueTime === null));
    assert.deepEqual(member.manifestFollowUpProposal.operations.map((row) =>
      row.proposedSuccessorValue), [["und", "es"], "es"]);
    assert.equal(member.manifestFollowUpProposal.applied, false);
    assert.equal(member.manifestFollowUpProposal.applyAuthorizedByThisArtifact,
      false);
    assert.ok(Object.values(member.authorityEffects).every((value) =>
      value === false));
  }
  assert.equal(report.grade4Boundary.l10MissingCourseMp3Count, 0);
  assert.equal(report.grade4Boundary.wholeGrade4MissingCourseMp3Count, 16);
  assert.equal(report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.securityAndRuntimeBoundary.audioListeningPerformed, false);
  assert.equal(report.review.reviewVerdictPresent, false);
  assert.ok(Object.values(report.authorityEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  return `# G4 L10 TS007/TS008 language and audio technical binding v1\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `This acceptance-neutral successor binds two exact external SA-route MP3 ` +
    `candidates and 24 embedded language-undetermined SoundStreams across ` +
    `TS007 and TS008. The external files are structural Spanish-route ` +
    `candidates only; no spoken language, playback, runtime reachability, ` +
    `synchronization, or acceptance is established.\n\n` +
    `## Exact findings\n\n` +
    `- TS007: 1 external plus 12 embedded candidates; Question 1; RandomAudio is empty.\n` +
    `- TS008: 1 external plus 12 embedded candidates; Question 2; RandomAudio is empty.\n` +
    `- Both manifests currently declare only \`und\`, while their canonical ` +
    `inventories contain \`es\` plus \`und\`.\n` +
    `- The exact future patch candidate is \`audio.languages: [\"und\",\"es\"]\` ` +
    `and exact-association \`language: \"es\"\`; it was not applied or adopted.\n` +
    `- These two L10 MP3s are present. The separate whole-Grade-4 blocker ` +
    `remains 16 MP3s: lesson 2 has 14, lesson 6 has 1, and lesson 8 has 1.\n\n` +
    `## Boundary\n\n` +
    `No workspace, manifest, source asset, helper, original runtime, renderer, ` +
    `test baseline, RMSE evidence, audio acceptance, human review, owner ` +
    `acceptance, promotion, release, or publication changed. The latest v2.14 ` +
    `security batch remains nonreusable and provides no production-helper or ` +
    `runtime-launch authority.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
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

export async function checkReport(bundle,
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
    candidateCount: 26,
    manifestFollowUpApplied: false,
    audioListeningPerformed: false,
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
  return checkReport(bundle, root, {skipInputCheck: true});
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
  if (mode === "--check") return checkReport(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    candidateCount: 26,
    manifestFollowUpApplied: false,
    audioListeningPerformed: false,
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
