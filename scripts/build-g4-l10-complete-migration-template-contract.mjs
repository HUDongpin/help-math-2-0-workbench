#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const TEMPLATE_ANIMATION_ID = "course-g04-l10-vb-003";
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-2026-08-04.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-2026-08-04.md";

const NESTED_TRACE_ROOT =
  "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area";
const SOURCE_ROOT =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10";

export const INPUTS = Object.freeze({
  lessonReleases: { path: "catalog/lesson-releases.json", kind: "json" },
  lessonReleaseLedger: {
    path: "catalog/lesson-release-ledger.json",
    kind: "json",
  },
  completionLedger: { path: "catalog/completion-ledger.json", kind: "json" },
  migration: {
    path: "migrations/course-g04-l10-vb-003/migration.json",
    kind: "json",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l10-vb-003/evidence/full-frame-coverage.json",
    kind: "json",
  },
  languageAudioBinding: {
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    kind: "json",
  },
  audioInventory: {
    path: "migrations/course-g04-l10-vb-003/audio-inventory.csv",
    kind: "text",
  },
  acceptanceChecklist: {
    path: "migrations/course-g04-l10-vb-003/ACCEPTANCE_CHECKLIST.md",
    kind: "text",
  },
  authoringAuditIndex: {
    path: "reports/g4-l10-animate-authoring-audit-index.json",
    kind: "json",
  },
  rootCaptureKits: {
    path: "reports/g4-l10-root-capture-kit-protocol-v3-successor.json",
    kind: "json",
  },
  currentJsDiagnostic: {
    path: "output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1/capture-manifest.json",
    kind: "json",
  },
  nestedTraceEn: {
    path: `${NESTED_TRACE_ROOT}/req-sprite-120-source-proven-independent-domain-entry-unresolved-en.json`,
    kind: "json",
  },
  nestedTraceEs: {
    path: `${NESTED_TRACE_ROOT}/req-sprite-120-source-proven-independent-domain-entry-unresolved-es.json`,
    kind: "json",
  },
  grade4SourcePromotion: {
    path: "catalog/source-promotions/g4-active-source-promotion-2026-08-02.json",
    kind: "json",
  },
  prototypeRegistry: {
    path: "packages/demos/prototype-registry.json",
    kind: "text",
  },
  generatedRegistry: {
    path: "packages/demos/src/registry.generated.ts",
    kind: "text",
  },
  wholeLessonRegistry: {
    path: "apps/web/lib/whole-lesson-course-registry.ts",
    kind: "text",
  },
  ts007Disposition: {
    path: "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
    kind: "json",
  },
  ts007Coverage: {
    path: "migrations/course-g04-l10-ts-007/evidence/full-frame-coverage.json",
    kind: "json",
  },
  ts008Disposition: {
    path: "migrations/course-g04-l10-ts-008/audit/frame-domain-disposition.json",
    kind: "json",
  },
  ts008Coverage: {
    path: "migrations/course-g04-l10-ts-008/evidence/full-frame-coverage.json",
    kind: "json",
  },
  sourceFla: { path: `${SOURCE_ROOT}/VB/L10VB03.fla`, kind: "binary" },
  sourceSwf: { path: `${SOURCE_ROOT}/VB/L10VB03.swf`, kind: "binary" },
  sourceSpanishMp3: {
    path: `${SOURCE_ROOT}/SA/L10VB03.mp3`,
    kind: "binary",
  },
});

const REQUIRED_GATE_IDS = Object.freeze([
  "intake",
  "audit",
  "authoring",
  "original-runtime-baseline",
  "specification",
  "renderer",
  "behavior-tests",
  "visual-rmse",
  "audio",
  "human-review",
  "owner-review",
  "strict-completion",
  "atomic-lesson-release",
]);

const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "originalRuntimeBaseline",
  "ruffleBaselineAuthority",
  "currentJavascriptBaselineAuthority",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "publicLibraryAdmission",
  "releaseReadiness",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function reportFingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return sha256(stableStringify(copy));
}

function statIdentity(stats) {
  return [stats.dev, stats.ino, stats.size, stats.mtimeNs]
    .map((value) => value.toString())
    .join(":");
}

function resolveInsideRoot(projectRoot, relativePath) {
  const root = path.resolve(projectRoot);
  const fullPath = path.resolve(root, relativePath);
  assert.ok(
    fullPath.startsWith(`${root}${path.sep}`),
    `Input escapes project root: ${relativePath}`,
  );
  return fullPath;
}

async function readStableInput(projectRoot, key, spec) {
  const fullPath = resolveInsideRoot(projectRoot, spec.path);
  const before = await lstat(fullPath, { bigint: true });
  assert.ok(before.isFile(), `${spec.path} must be a regular file`);
  assert.ok(!before.isSymbolicLink(), `${spec.path} must not be a symlink`);
  const raw = await readFile(fullPath);
  const after = await lstat(fullPath, { bigint: true });
  assert.equal(
    statIdentity(after),
    statIdentity(before),
    `Input changed while being read: ${spec.path}`,
  );
  assert.equal(
    BigInt(raw.byteLength),
    before.size,
    `Input size changed while being read: ${spec.path}`,
  );

  const record = {
    key,
    path: spec.path,
    kind: spec.kind,
    bytes: raw.byteLength,
    sha256: sha256(raw),
    statIdentity: statIdentity(before),
  };
  if (spec.kind !== "binary") record.text = raw.toString("utf8");
  if (spec.kind === "json") {
    try {
      record.document = JSON.parse(record.text);
    } catch (error) {
      throw new Error(`Invalid JSON input ${spec.path}: ${error.message}`);
    }
  }
  return record;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(([key, spec]) =>
      readStableInput(projectRoot, key, spec),
    ),
  );
  return {
    projectRoot: path.resolve(projectRoot),
    records: Object.fromEntries(entries.map((entry) => [entry.key, entry])),
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const record of Object.values(snapshot.records)) {
    const reread = await readStableInput(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
    });
    assert.equal(
      reread.statIdentity,
      record.statIdentity,
      `Input stat identity drifted: ${record.path}`,
    );
    assert.equal(
      reread.sha256,
      record.sha256,
      `Input SHA-256 drifted: ${record.path}`,
    );
  }
}

function document(snapshot, key) {
  const value = snapshot.records[key]?.document;
  assert.ok(value, `Missing parsed JSON input: ${key}`);
  return value;
}

function textInput(snapshot, key) {
  const value = snapshot.records[key]?.text;
  assert.equal(typeof value, "string", `Missing text input: ${key}`);
  return value;
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  assert.equal(quoted, false, "Unterminated quoted CSV field");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  assert.ok(rows.length >= 2, "Audio inventory must have a header and rows");
  const headers = rows.shift();
  assert.equal(new Set(headers).size, headers.length, "Duplicate CSV headers");
  return rows
    .filter((values) => values.some((value) => value !== ""))
    .map((values, rowIndex) => {
      assert.equal(
        values.length,
        headers.length,
        `CSV row ${rowIndex + 2} has the wrong column count`,
      );
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    });
}

function checklistCounts(markdown) {
  const matches = [...markdown.matchAll(/^\s*- \[([ xX])\]/gm)];
  return {
    total: matches.length,
    checked: matches.filter((match) => match[1].toLowerCase() === "x").length,
    unchecked: matches.filter((match) => match[1] === " ").length,
  };
}

function isOriginalRuntimeAuthority(authority) {
  return /(?:original-runtime|adobe-flash|adobe-animate-test-movie)/i.test(
    String(authority ?? ""),
  );
}

function assertNoSubstituteAuthority(coverage) {
  for (const requirement of coverage.requirements ?? []) {
    const authority = String(requirement.baselineAuthority ?? "");
    assert.ok(
      !/(?:ruffle|current[-_ ]?js|current[-_ ]?javascript|javascript[-_ ]?diagnostic)/i.test(
        authority,
      ),
      `${requirement.requirementId} impermissibly treats ${authority} as baseline authority`,
    );
    const planningAuthority = String(requirement.planningAuthority ?? "");
    if (/(?:ruffle|current[-_ ]?js|javascript[-_ ]?diagnostic)/i.test(planningAuthority)) {
      assert.equal(
        Number(requirement.capturedFrameCount ?? 0),
        0,
        `${requirement.requirementId} impermissibly adopts diagnostic frames`,
      );
      assert.equal(
        requirement.strictAcceptanceEffect,
        "none",
        `${requirement.requirementId} diagnostic planning authority changed acceptance`,
      );
    }
  }
}

function gate(id, kind, status, satisfied, evidence, blocker) {
  assert.ok(REQUIRED_GATE_IDS.includes(id), `Unknown gate id: ${id}`);
  return {
    id,
    kind,
    status,
    satisfied,
    evidence,
    blocker,
    acceptanceEffect: "none",
  };
}

function decisionAccepted(review) {
  return ["accepted", "approved", "pass"].includes(
    String(review?.decision ?? "").toLowerCase(),
  );
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cloneBinding(record) {
  return { path: record.path, bytes: record.bytes, sha256: record.sha256 };
}

export function deriveContract(snapshot) {
  const releases = document(snapshot, "lessonReleases");
  const releaseLedger = document(snapshot, "lessonReleaseLedger");
  const completionLedger = document(snapshot, "completionLedger");
  const migration = document(snapshot, "migration");
  const coverage = document(snapshot, "fullFrameCoverage");
  const languageAudio = document(snapshot, "languageAudioBinding");
  const authoring = document(snapshot, "authoringAuditIndex");
  const rootKits = document(snapshot, "rootCaptureKits");
  const diagnostic = document(snapshot, "currentJsDiagnostic");
  const nestedTraceEn = document(snapshot, "nestedTraceEn");
  const nestedTraceEs = document(snapshot, "nestedTraceEs");
  const sourcePromotion = document(snapshot, "grade4SourcePromotion");

  const release = (releases.releases ?? []).find(
    (candidate) => candidate.releaseId === RELEASE_ID,
  );
  const releaseState = (releaseLedger.releases ?? []).find(
    (candidate) => candidate.releaseId === RELEASE_ID,
  );
  assert.ok(release, `Missing release ${RELEASE_ID}`);
  assert.ok(releaseState, `Missing release ledger state ${RELEASE_ID}`);
  const member = (release.members ?? []).find(
    (candidate) => candidate.animationId === TEMPLATE_ANIMATION_ID,
  );
  assert.ok(member, `Missing ${TEMPLATE_ANIMATION_ID} release member`);
  assert.equal(migration.animationId, TEMPLATE_ANIMATION_ID);
  assert.equal(coverage.animationId, TEMPLATE_ANIMATION_ID);
  assert.equal(languageAudio.animationId, TEMPLATE_ANIMATION_ID);
  assert.equal(diagnostic.animationId, TEMPLATE_ANIMATION_ID);
  assert.equal(release.publicationMode, "atomic");
  assert.equal(release.releaseType, "complete-lesson");
  assert.equal(release.expectedCounts.members, release.members.length);
  assert.equal(member.assetId, migration.assetId);
  assert.equal(member.source.sha256, migration.source.swfSha256);

  const sourceFla = snapshot.records.sourceFla;
  const sourceSwf = snapshot.records.sourceSwf;
  const sourceSpanishMp3 = snapshot.records.sourceSpanishMp3;
  assert.equal(sourceFla.sha256, migration.source.flaSha256);
  assert.equal(sourceSwf.sha256, migration.source.swfSha256);
  assert.equal(sourceSwf.sha256, member.source.sha256);

  assertNoSubstituteAuthority(coverage);
  const requirements = coverage.requirements ?? [];
  assert.ok(requirements.length > 0, "Full-frame coverage has no requirements");
  const requiredFrameCount = requirements.reduce(
    (sum, requirement) =>
      sum +
      Number(requirement.requiredRange.lastFrame) -
      Number(requirement.requiredRange.firstFrame) +
      1,
    0,
  );
  const authoritativeCapturedFrameCount = requirements.reduce(
    (sum, requirement) =>
      sum +
      (isOriginalRuntimeAuthority(requirement.baselineAuthority)
        ? Number(requirement.capturedFrameCount ?? 0)
        : 0),
    0,
  );
  const rmseRequirementCount = requirements.filter(
    (requirement) =>
      isOriginalRuntimeAuthority(requirement.baselineAuthority) &&
      nonempty(requirement.metricsFile) &&
      nonempty(requirement.metricsSha256),
  ).length;
  const originalRuntimeComplete =
    authoritativeCapturedFrameCount === requiredFrameCount &&
    requirements.every(
      (requirement) =>
        isOriginalRuntimeAuthority(requirement.baselineAuthority) &&
        requirement.status === "complete",
    );
  const visualRmseComplete =
    originalRuntimeComplete && rmseRequirementCount === requirements.length;

  const traces = [nestedTraceEn, nestedTraceEs];
  const unresolvedNestedTraceCount = traces.filter(
    (trace) =>
      trace.traceSpecStatus !== "resolved" ||
      !Array.isArray(trace.schedule?.orderedSteps) ||
      trace.schedule.orderedSteps.length === 0,
  ).length;

  const checklist = checklistCounts(textInput(snapshot, "acceptanceChecklist"));
  assert.ok(checklist.total > 0, "Acceptance checklist has no checkboxes");

  const audioRows = parseCsv(textInput(snapshot, "audioInventory"));
  const externalSpanishAudio = audioRows.find(
    (row) => row.cue_id === "catalog-audio-01" && row.language === "es",
  );
  const embeddedAudio = audioRows.find(
    (row) => row.cue_id === "embedded-stream-0001",
  );
  assert.ok(externalSpanishAudio, "Missing VB003 external Spanish audio row");
  assert.ok(embeddedAudio, "Missing VB003 embedded stream row");
  assert.equal(externalSpanishAudio.sha256, sourceSpanishMp3.sha256);
  assert.equal(embeddedAudio.sha256, sourceSwf.sha256);

  const authoringSummary = authoring.summary ?? {};
  const rootSummary = rootKits.v3ParallelRoot?.summary ?? {};
  const rootIdentity = rootKits.v3ParallelRoot?.technicalIdentityContract ?? {};
  const rootKitsLocallyVerified =
    rootSummary.releaseMembers === release.expectedCounts.members &&
    rootSummary.englishKits === release.expectedCounts.members &&
    rootSummary.spanishKits === release.expectedCounts.members &&
    rootSummary.exactKits === release.expectedCounts.members * 2 &&
    rootSummary.capturePngs === 0 &&
    rootIdentity.immutableV2ManifestProjectionMatched === true &&
    rootIdentity.currentRawTraceSpecFileSha256Reverified === true &&
    rootIdentity.currentRawTraceSpecIndexSha256Reverified === true;
  const rootProjectionCurrent =
    rootIdentity.upstreamProjectionCurrentnessEstablished === true;

  const diagnosticBoundary = diagnostic.authorityBoundary ?? {};
  const forbiddenDiagnosticEffects = [
    "authoritativeOriginalRuntime",
    "fullFrameOriginalRuntimeComparison",
    "rmseAcceptance",
    "coverageRequirementSatisfied",
    "coverageAdopted",
    "humanVisualReview",
    "engineeringReviewAccepted",
    "ownerAcceptance",
    "strictMigrationCompletion",
    "wholeLessonIntegration",
    "atomicLessonPublication",
  ];
  assert.match(
    String(diagnostic.classification ?? ""),
    /current-javascript-engineering-diagnostic-only/,
  );
  assert.equal(diagnostic.acceptanceEffect, "none");
  assert.equal(diagnostic.formalCapturedFrameCountEffect, 0);
  assert.equal(diagnostic.formalCoverageMutation, false);
  for (const key of forbiddenDiagnosticEffects) {
    assert.equal(
      diagnosticBoundary[key],
      false,
      `Current-JS diagnostic impermissibly asserts ${key}`,
    );
  }

  const implementation = migration.implementation ?? {};
  const formalRendererFieldsPresent = [
    implementation.route,
    implementation.routeFile,
    implementation.component,
    implementation.registryModule,
    implementation.timelineModule,
    implementation.testFile,
  ].every(nonempty);
  const registryTexts = [
    textInput(snapshot, "prototypeRegistry"),
    textInput(snapshot, "generatedRegistry"),
    textInput(snapshot, "wholeLessonRegistry"),
  ];
  const registryReferenceCount = registryTexts.filter((text) =>
    text.includes(TEMPLATE_ANIMATION_ID),
  ).length;
  const formalRendererPresent =
    implementation.rendering !== "undecided" &&
    formalRendererFieldsPresent &&
    registryReferenceCount > 0;

  const humanAccepted = decisionAccepted(migration.acceptance?.humanVisualReview);
  const ownerAccepted = decisionAccepted(migration.acceptance?.ownerReview);
  const engineeringAccepted = decisionAccepted(
    migration.acceptance?.engineeringReview,
  );
  const audioComplete =
    languageAudio.formalEvidence?.authorizedOriginalRuntimeExecuted === true &&
    languageAudio.formalEvidence?.originalRuntimeNaturalTraceEstablished === true &&
    languageAudio.formalEvidence?.originalRuntimeBaselineEstablished === true &&
    languageAudio.formalEvidence?.formalCueAdoptionEstablished === true &&
    languageAudio.formalEvidence?.formalLanguageAcceptanceEstablished === true &&
    languageAudio.formalEvidence?.formalAudioAcceptanceEstablished === true &&
    Number(languageAudio.summary?.acceptedCueCount ?? 0) === audioRows.length;

  const completionEntry = (completionLedger.entries ?? []).find(
    (entry) => entry.animationId === TEMPLATE_ANIMATION_ID,
  );
  const completionDiagnostic = (completionLedger.diagnostics ?? []).find(
    (entry) => entry.animationId === TEMPLATE_ANIMATION_ID,
  );
  const strictComplete =
    migration.status === "complete" &&
    completionEntry?.status === "complete" &&
    checklist.checked === checklist.total;
  const atomicReleaseComplete =
    releaseState.gate?.open === true &&
    releaseState.published === true &&
    releaseState.strictCompleteCount === release.expectedCounts.members;

  const sourceMissingCount = Number(
    sourcePromotion.summary?.missingDependencies?.count ??
      sourcePromotion.missingDependencies?.length ??
      0,
  );
  const sourceMissingByKind =
    sourcePromotion.summary?.missingDependencies?.byAudioBindingKind ?? {};

  const acceptanceEffects = Object.fromEntries(
    ACCEPTANCE_EFFECT_KEYS.map((key) => [key, false]),
  );

  const intakeSatisfied =
    sourceFla.sha256 === migration.source.flaSha256 &&
    sourceSwf.sha256 === migration.source.swfSha256 &&
    sourceSpanishMp3.sha256 === externalSpanishAudio.sha256;
  const auditSatisfied =
    authoringSummary.pendingApplicableAuthoringAudits === 0 &&
    unresolvedNestedTraceCount === 0;
  const authoringSatisfied =
    authoringSummary.flaApplicableAuthoringCoverageComplete === true &&
    authoringSummary.verifiedWorkOnlyAuthoringAudits ===
      authoringSummary.flaApplicableItems;
  const specificationSatisfied =
    unresolvedNestedTraceCount === 0 &&
    implementation.rendering !== "undecided";
  const behaviorSatisfied =
    formalRendererPresent && originalRuntimeComplete && engineeringAccepted;

  const gates = [
    gate(
      "intake",
      "machine",
      intakeSatisfied ? "PASS" : "FAIL",
      intakeSatisfied,
      {
        sourceFlaSha256: sourceFla.sha256,
        sourceSwfSha256: sourceSwf.sha256,
        externalSpanishMp3Sha256: sourceSpanishMp3.sha256,
        releaseAssetId: member.assetId,
      },
      intakeSatisfied ? null : "Hash-bound source identity mismatch",
    ),
    gate(
      "audit",
      "mixed",
      auditSatisfied ? "PASS" : "PARTIAL",
      auditSatisfied,
      {
        staticRuntimeRecorded: Boolean(migration.runtime?.stage),
        pendingFlaAuthoringAudits:
          authoringSummary.pendingApplicableAuthoringAudits,
        unresolvedNestedTraceCount,
      },
      auditSatisfied
        ? null
        : "Static audit exists, but authoring and nested natural-entry evidence remain incomplete",
    ),
    gate(
      "authoring",
      "human",
      authoringSatisfied ? "PASS" : "BLOCKED",
      authoringSatisfied,
      {
        flaApplicableItems: authoringSummary.flaApplicableItems,
        verifiedWorkOnlyAuthoringAudits:
          authoringSummary.verifiedWorkOnlyAuthoringAudits,
        pendingApplicableAuthoringAudits:
          authoringSummary.pendingApplicableAuthoringAudits,
      },
      authoringSatisfied
        ? null
        : "Named Adobe Animate operator work and immutable receipts are absent",
    ),
    gate(
      "original-runtime-baseline",
      "human",
      originalRuntimeComplete ? "PASS" : "BLOCKED",
      originalRuntimeComplete,
      {
        requirementCount: requirements.length,
        authoritativeCapturedFrameCount,
        requiredFrameCount,
        rootKitsLocallyVerified,
        rootKitCount: rootSummary.exactKits,
        rootProjectionCurrent,
        runtimeSessions: rootSummary.actualRuntimeSessions,
      },
      originalRuntimeComplete
        ? null
        : "No adopted original-runtime frames; local unsigned kits are not runtime evidence and their upstream projection is not current",
    ),
    gate(
      "specification",
      "mixed",
      specificationSatisfied ? "PASS" : "BLOCKED",
      specificationSatisfied,
      {
        nestedTraceSpecifications: traces.length,
        unresolvedNestedTraceCount,
        renderingDecision: implementation.rendering,
      },
      specificationSatisfied
        ? null
        : "Nested schedule/entry state and implementation decision remain unresolved",
    ),
    gate(
      "renderer",
      "machine",
      formalRendererPresent ? "PASS" : "BLOCKED",
      formalRendererPresent,
      {
        formalRendererFieldsPresent,
        registryReferenceCount,
        diagnosticCandidatePresent: diagnostic.summary?.captureCount > 0,
        diagnosticCandidateAdmitted: false,
      },
      formalRendererPresent
        ? null
        : "Only an unregistered current-JavaScript engineering diagnostic exists",
    ),
    gate(
      "behavior-tests",
      "mixed",
      behaviorSatisfied ? "PASS" : "BLOCKED",
      behaviorSatisfied,
      {
        formalRendererPresent,
        originalRuntimeComplete,
        engineeringAccepted,
      },
      behaviorSatisfied
        ? null
        : "No authoritative baseline-bound formal renderer behavior acceptance",
    ),
    gate(
      "visual-rmse",
      "mixed",
      visualRmseComplete ? "PASS" : "BLOCKED",
      visualRmseComplete,
      {
        rmseRequirementCount,
        requirementCount: requirements.length,
        acceptedRmseResultCount: rmseRequirementCount,
      },
      visualRmseComplete
        ? null
        : "No original-runtime-to-implementation RMSE evidence",
    ),
    gate(
      "audio",
      "human",
      audioComplete ? "PASS" : "BLOCKED",
      audioComplete,
      {
        inventoryRows: audioRows.length,
        externalSpanishAudioExists: true,
        embeddedStreamLanguage: embeddedAudio.language,
        spokenLanguageEstablishedCueCount:
          languageAudio.summary?.spokenLanguageEstablishedCueCount,
        acceptedCueCount: languageAudio.summary?.acceptedCueCount,
        courseLevelMissingMp3Count: sourceMissingCount,
      },
      audioComplete
        ? null
        : "Runtime cue timing, embedded spoken language, listening, and course-level missing MP3 closure are unresolved",
    ),
    gate(
      "human-review",
      "human",
      humanAccepted ? "PASS" : "PENDING",
      humanAccepted,
      { decision: migration.acceptance?.humanVisualReview?.decision ?? "missing" },
      humanAccepted ? null : "Human visual review record is pending",
    ),
    gate(
      "owner-review",
      "human",
      ownerAccepted ? "PASS" : "PENDING",
      ownerAccepted,
      { decision: migration.acceptance?.ownerReview?.decision ?? "missing" },
      ownerAccepted ? null : "Owner review record is pending",
    ),
    gate(
      "strict-completion",
      "mixed",
      strictComplete ? "PASS" : "BLOCKED",
      strictComplete,
      {
        migrationStatus: migration.status,
        completionEntryStatus: completionEntry?.status ?? null,
        completionDiagnosticErrorCount:
          completionDiagnostic?.errorCount ?? null,
        checklistChecked: checklist.checked,
        checklistTotal: checklist.total,
      },
      strictComplete
        ? null
        : "Strict validator/ledger admission and all checklist attestations are absent",
    ),
    gate(
      "atomic-lesson-release",
      "mixed",
      atomicReleaseComplete ? "PASS" : "BLOCKED",
      atomicReleaseComplete,
      {
        expectedMembers: releaseState.expectedMemberCount,
        strictCompleteMembers: releaseState.strictCompleteCount,
        missingMembers: releaseState.missingCount,
        gateOpen: releaseState.gate?.open,
        published: releaseState.published,
      },
      atomicReleaseComplete
        ? null
        : "All 47 exact-asset members must be strict-complete before one atomic lesson release",
    ),
  ];

  const inputBindings = Object.fromEntries(
    Object.keys(snapshot.records)
      .sort()
      .map((key) => [key, cloneBinding(snapshot.records[key])]),
  );

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-complete-migration-template-gate-contract",
    evidenceDate: "2026-08-04",
    status: gates.every((item) => item.satisfied)
      ? "all-gates-satisfied"
      : "fail-closed-incomplete",
    authorityBoundary: {
      contractIsReadOnlyRecomputation: true,
      contractCreatesEvidence: false,
      ruffleMayBeAuthoritativeBaseline: false,
      currentJavascriptDiagnosticMayBeAuthoritativeBaseline: false,
      currentJavascriptDiagnosticMaySatisfyRmse: false,
      currentJavascriptDiagnosticMaySatisfyAcceptance: false,
      unsignedRootKitsAreRuntimeEvidence: false,
      filenameIdentityIsPromotionAuthority: false,
      sha256IdentityRequired: true,
    },
    scopeDistinction: {
      templatePlacement: {
        animationId: TEMPLATE_ANIMATION_ID,
        releaseId: RELEASE_ID,
        ordinal: member.ordinal,
        memberCount: 1,
        assetId: member.assetId,
        strictComplete: strictComplete,
      },
      completeLessonRelease: {
        releaseId: RELEASE_ID,
        releaseType: release.releaseType,
        publicationMode: release.publicationMode,
        memberCount: release.expectedCounts.members,
        activePageCount: release.expectedCounts.activeXmlReferencedPages,
        shellCount: release.expectedCounts.courseShells,
        strictCompleteCount: releaseState.strictCompleteCount,
        published: releaseState.published,
      },
      rule:
        "VB003 is one template placement at ordinal 7 of 47; it cannot be represented as the complete Lesson 10 release.",
    },
    currentState: {
      originalRuntime: {
        requirementCount: requirements.length,
        authoritativeCapturedFrameCount,
        requiredFrameCount,
      },
      visualRmse: {
        evidenceCount: rmseRequirementCount,
        requirementCount: requirements.length,
      },
      formalRenderer: {
        present: formalRendererPresent,
        manifestRendering: implementation.rendering,
        registryReferenceCount,
        currentJsDiagnosticCapturedFrames:
          Number(diagnostic.summary?.captureCount ?? 0),
        currentJsDiagnosticFormalEffect: 0,
      },
      reviews: {
        audio: audioComplete ? "accepted" : "pending",
        human: humanAccepted ? "accepted" : "pending",
        engineering: engineeringAccepted ? "accepted" : "pending",
        owner: ownerAccepted ? "accepted" : "pending",
      },
      checklist,
      atomicRelease: {
        strictCompleteCount: releaseState.strictCompleteCount,
        requiredCount: releaseState.expectedMemberCount,
        missingCount: releaseState.missingCount,
        status: releaseState.status,
        published: releaseState.published,
      },
    },
    obligations: {
      animateAuthoring: {
        releaseMembers: authoringSummary.selectedReleaseMembers,
        flaApplicableItems: authoringSummary.flaApplicableItems,
        swfOnlyNotApplicableItems: authoringSummary.swfOnlyNotApplicableItems,
        verifiedAudits: authoringSummary.verifiedWorkOnlyAuthoringAudits,
        pendingAudits: authoringSummary.pendingApplicableAuthoringAudits,
      },
      rootCaptureKits: {
        exactKitCount: rootSummary.exactKits,
        englishKitCount: rootSummary.englishKits,
        spanishKitCount: rootSummary.spanishKits,
        locallyByteVerified: rootKitsLocallyVerified,
        upstreamProjectionCurrentnessEstablished: rootProjectionCurrent,
        operatorReady: rootKits.protocol?.operatorReadiness?.operatorReady === true,
        capturePngCount: rootSummary.capturePngs,
        runtimeSessionCount: rootSummary.actualRuntimeSessions,
        evidenceEffect: "none",
      },
      nestedTrace: {
        frameDomainId: "sprite-120",
        languages: traces.map((trace) => trace.identity?.language ?? trace.entryState?.language),
        unresolvedTraceCount: unresolvedNestedTraceCount,
        requiredFramesPerLanguage: migration.implementation.frameDomains.find(
          (domain) => domain.id === "sprite-120",
        )?.frameCount,
      },
      audio: {
        vb003ExternalSpanishAudio: cloneBinding(sourceSpanishMp3),
        vb003ExternalSpanishAudioLanguageBasis:
          "legacy host SA-directory routing; spoken content still requires listening",
        vb003EmbeddedStream: {
          sourceSwfSha256: embeddedAudio.sha256,
          durationMs: Number(embeddedAudio.duration_ms),
          language: embeddedAudio.language,
          spokenLanguageKnown: embeddedAudio.language !== "und",
        },
        courseLevelExternalBlocker: {
          missingMp3Count: sourceMissingCount,
          byAudioBindingKind: sourceMissingByKind,
          dependencyClosureEstablished: sourceMissingCount === 0,
          scope:
            "Grade 4 active-source promotion dependency closure; separate from VB003's present external Spanish MP3",
        },
      },
    },
    releaseEvidenceAttribution: {
      status: "unknown-unverified-writer-boundary",
      writerIdentity: null,
      affectedMembers: ["course-g04-l10-ts-007", "course-g04-l10-ts-008"],
      hashBoundInputs: {
        ts007Disposition: cloneBinding(snapshot.records.ts007Disposition),
        ts007Coverage: cloneBinding(snapshot.records.ts007Coverage),
        ts008Disposition: cloneBinding(snapshot.records.ts008Disposition),
        ts008Coverage: cloneBinding(snapshot.records.ts008Coverage),
      },
      observedReadOnlyCheckFailures: [
        "source-proven frame-domain descriptor drift: TS007",
        "coverage-v2 currentness drift: TS007 and TS008",
        "trace-spec currentness drift: TS007",
        "structural keyframe binding drift: TS007",
        "runtime-acquisition wave partition drift: TS007",
      ],
      rule:
        "Do not refresh, adopt, mutate, register, complete, or publish while the writer and a stable upstream snapshot remain unattributed.",
    },
    gates,
    automationUntilHumanGate: {
      status: "HALT",
      canProceedWithoutHuman: false,
      blockingReasonIds: [
        "unknown-ts007-ts008-writer-boundary",
        "root-kit-upstream-projection-currentness-unestablished",
      ],
      safeReadOnlyActions: [
        "identify the active writer and compare exact SHA-256 bindings",
        "freeze an attributed release evidence snapshot",
        "rerun this contract with --check",
      ],
      prohibitedActions: [
        "refresh upstream L10 migration evidence",
        "execute unsigned root capture kits",
        "adopt Ruffle or current-JavaScript diagnostics as original-runtime evidence",
        "register VB003",
        "mark any acceptance, completion, integration, or publication gate",
      ],
      firstPlannedEvidenceHumanGateAfterRecovery:
        "A named, authorized Adobe Animate/original-runtime operator must open the exact hash-bound source in an approved disposable offline environment and finalize the pre-frame launch receipt before capture.",
    },
    nextNamedHumanAction: {
      role: "Lesson 10 release evidence custodian",
      action:
        "Identify and coordinate or stop the TS007/TS008 writer, then attest one frozen SHA-256-bound release snapshot before any automated refresh or migration work resumes.",
      reason:
        "Writer attribution is currently unknown and multiple release-wide projections are stale; proceeding would mix evidence epochs.",
      cannotBeAutomated: true,
    },
    acceptanceEffects,
    inputBindings,
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(
    report.scopeDistinction.templatePlacement.ordinal,
    7,
    "VB003 must remain ordinal 7",
  );
  assert.equal(report.scopeDistinction.templatePlacement.memberCount, 1);
  assert.equal(report.scopeDistinction.completeLessonRelease.memberCount, 47);
  assert.equal(report.scopeDistinction.completeLessonRelease.publicationMode, "atomic");
  assert.deepEqual(
    report.gates.map((item) => item.id),
    REQUIRED_GATE_IDS,
  );
  for (const item of report.gates) {
    assert.equal(item.acceptanceEffect, "none", `${item.id} changed acceptance`);
  }
  assert.deepEqual(
    Object.keys(report.acceptanceEffects),
    [...ACCEPTANCE_EFFECT_KEYS],
  );
  for (const [key, value] of Object.entries(report.acceptanceEffects)) {
    assert.equal(value, false, `Contract impermissibly creates ${key}`);
  }
  assert.equal(report.authorityBoundary.ruffleMayBeAuthoritativeBaseline, false);
  assert.equal(
    report.authorityBoundary.currentJavascriptDiagnosticMayBeAuthoritativeBaseline,
    false,
  );
  assert.equal(
    report.authorityBoundary.currentJavascriptDiagnosticMaySatisfyRmse,
    false,
  );
  assert.equal(
    report.authorityBoundary.currentJavascriptDiagnosticMaySatisfyAcceptance,
    false,
  );
  assert.equal(report.obligations.rootCaptureKits.evidenceEffect, "none");
  assert.equal(report.releaseEvidenceAttribution.writerIdentity, null);
  assert.equal(report.automationUntilHumanGate.status, "HALT");
  assert.equal(report.nextNamedHumanAction.cannotBeAutomated, true);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const gateRows = report.gates
    .map(
      (item) =>
        `| ${item.id} | ${item.kind} | ${item.status} | ${item.satisfied ? "yes" : "no"} | ${item.blocker ?? "none"} |`,
    )
    .join("\n");
  const inputRows = Object.values(report.inputBindings)
    .map(
      (binding) =>
        `| \`${binding.path}\` | ${binding.bytes} | \`${binding.sha256}\` |`,
    )
    .join("\n");
  const missingKinds = Object.entries(
    report.obligations.audio.courseLevelExternalBlocker.byAudioBindingKind,
  )
    .map(([kind, count]) => `${kind}: ${count}`)
    .join(", ");

  return `# Grade 4 Lesson 10 complete-migration template gate contract

Evidence date: **${report.evidenceDate}**  
Status: **${report.status}**  
Fingerprint: \`${report.reportFingerprintSha256}\`

## Outcome

This contract is a read-only, fail-closed recomputation. It creates no baseline, RMSE, review, completion, integration, publication, or release acceptance. VB003 is **one placement at ordinal ${report.scopeDistinction.templatePlacement.ordinal}/${report.scopeDistinction.completeLessonRelease.memberCount}**. The complete Lesson 10 release is the atomic ${report.scopeDistinction.completeLessonRelease.memberCount}-member release \`${report.scopeDistinction.completeLessonRelease.releaseId}\`; the two scopes are not interchangeable.

Current formal state is ${report.currentState.originalRuntime.authoritativeCapturedFrameCount}/${report.currentState.originalRuntime.requiredFrameCount} authoritative original-runtime frames, ${report.currentState.visualRmse.evidenceCount} RMSE requirement results, formal renderer present = ${report.currentState.formalRenderer.present}, checklist ${report.currentState.checklist.checked}/${report.currentState.checklist.total}, and atomic release ${report.currentState.atomicRelease.strictCompleteCount}/${report.currentState.atomicRelease.requiredCount}. Audio, human, engineering, and owner reviews remain ${report.currentState.reviews.audio}, ${report.currentState.reviews.human}, ${report.currentState.reviews.engineering}, and ${report.currentState.reviews.owner}.

## Gate contract

| Gate | Kind | Status | Satisfied | Current blocker |
|---|---|---:|---:|---|
${gateRows}

Every row has \`acceptanceEffect: none\`. A local PASS, such as SHA-256 source intake, does not advance a later gate.

## Required obligations and explicit boundaries

- Animate authoring: ${report.obligations.animateAuthoring.flaApplicableItems} FLA-applicable members, ${report.obligations.animateAuthoring.swfOnlyNotApplicableItems} SWF-only not-applicable members, ${report.obligations.animateAuthoring.verifiedAudits} verified audits, ${report.obligations.animateAuthoring.pendingAudits} pending.
- Root capture: ${report.obligations.rootCaptureKits.exactKitCount} local exact kits (${report.obligations.rootCaptureKits.englishKitCount} EN + ${report.obligations.rootCaptureKits.spanishKitCount} ES) are locally byte-consistent = ${report.obligations.rootCaptureKits.locallyByteVerified}; upstream projection currentness = ${report.obligations.rootCaptureKits.upstreamProjectionCurrentnessEstablished}; operator-ready = ${report.obligations.rootCaptureKits.operatorReady}; PNGs = ${report.obligations.rootCaptureKits.capturePngCount}; runtime sessions = ${report.obligations.rootCaptureKits.runtimeSessionCount}. They are unsigned protocol material, not original-runtime evidence.
- Nested trace: \`sprite-120\` remains unresolved in ${report.obligations.nestedTrace.unresolvedTraceCount} language traces; ${report.obligations.nestedTrace.requiredFramesPerLanguage} frames per language cannot be adopted until natural entry and schedule are established.
- Audio: VB003's external Spanish MP3 exists and is SHA-256 bound, but its Spanish classification comes from host routing and still needs listening. The embedded ${report.obligations.audio.vb003EmbeddedStream.durationMs} ms stream is language \`${report.obligations.audio.vb003EmbeddedStream.language}\`; spoken language is unknown. Separately, the Grade 4 source promotion still lacks ${report.obligations.audio.courseLevelExternalBlocker.missingMp3Count} MP3s (${missingKinds}).
- Current JavaScript: ${report.currentState.formalRenderer.currentJsDiagnosticCapturedFrames} source-static diagnostic frames exist, but their formal frame, RMSE, and acceptance effect is exactly ${report.currentState.formalRenderer.currentJsDiagnosticFormalEffect}. Ruffle and current-JavaScript diagnostics are forbidden as original-runtime authority.

## Writer/currentness stop boundary

Writer attribution for TS007/TS008 is **unknown and unverified**. Observed stale release-wide projections include source-proven frame domains, coverage-v2, trace specs, structural keyframes, and runtime-acquisition partitioning. The 94-kit report also explicitly says its upstream projection currentness is not established. Therefore automation is **${report.automationUntilHumanGate.status}**.

Next named human action (${report.nextNamedHumanAction.role}): ${report.nextNamedHumanAction.action}

After that attribution and a frozen recheck, the first planned evidence human gate is: ${report.automationUntilHumanGate.firstPlannedEvidenceHumanGateAfterRecovery}

## Acceptance and publication effects

All acceptance/publication effect flags in the JSON contract are \`false\`. This report must not be cited as renderer adoption, audio or visual acceptance, strict completion, whole-lesson integration, library admission, or publication authorization.

## SHA-256-bound inputs

| Path | Bytes | SHA-256 |
|---|---:|---|
${inputRows}
`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

async function writeAtomically(fullPath, contents) {
  const temporary = `${fullPath}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, contents, { flag: "wx", mode: 0o644 });
    await rename(temporary, fullPath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  await assertSnapshotUnchanged(snapshot);

  const jsonPath = resolveInsideRoot(projectRoot, REPORT_JSON);
  const markdownPath = resolveInsideRoot(projectRoot, REPORT_MARKDOWN);
  if (mode === "--write") {
    await writeAtomically(jsonPath, json);
    await writeAtomically(markdownPath, markdown);
    await assertSnapshotUnchanged(snapshot);
    return { mode, report, written: [REPORT_JSON, REPORT_MARKDOWN] };
  }

  const [actualJson, actualMarkdown] = await Promise.all([
    readFile(jsonPath, "utf8"),
    readFile(markdownPath, "utf8"),
  ]);
  assert.equal(actualJson, json, `${REPORT_JSON} is stale; rerun with --write`);
  assert.equal(
    actualMarkdown,
    markdown,
    `${REPORT_MARKDOWN} is stale; rerun with --write`,
  );
  await assertSnapshotUnchanged(snapshot);
  return { mode, report, checked: [REPORT_JSON, REPORT_MARKDOWN] };
}

const invokedAsMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH);
if (invokedAsMain) {
  runCli()
    .then((result) => {
      process.stdout.write(
        `${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_JSON} and ${REPORT_MARKDOWN}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
