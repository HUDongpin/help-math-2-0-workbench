#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const TEMPLATE_ANIMATION_ID = "course-g04-l10-vb-003";
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.md";

export const INPUTS = Object.freeze({
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    kind: "json",
    sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  },
  lessonReleaseLedger: {
    path: "catalog/lesson-release-ledger.json",
    kind: "json",
    sha256: "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
  },
  completionLedger: {
    path: "catalog/completion-ledger.json",
    kind: "json",
    sha256: "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
  },
  alignment: {
    path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
    kind: "json",
    sha256: "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
  },
  sourceSuccessor: {
    path: "catalog/source-promotions/g4-runtime-dependency-successor-v3-2026-08-04.json",
    kind: "json",
    sha256: "789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f",
  },
  continuation: {
    path: "reports/g04-l10-formal-migration-continuation-2026-08-02-v2.json",
    kind: "json",
    sha256: "69d41766d17acb0b728bbe24f09f6f1a3cee15119860e226185e140cbe0b8d85",
  },
  traceIndex: {
    path: "migrations/lesson-release-trace-spec-indexes/lesson-g04-l10-perimeter-area.json",
    kind: "json",
    sha256: "d2f846831fa9a5c7c3a7e9cb0276a8b3671fbf6c26d17067bf4610c132e8687f",
  },
  rootCaptureKits: {
    path: "reports/g4-l10-root-capture-kit-protocol-v3-successor.json",
    kind: "json",
    sha256: "9c403289c12be94150b4afa783711ff377a0ea3c1dc6831446e5448a234e8753",
  },
  authoringAudit: {
    path: "reports/g4-l10-animate-authoring-audit-index.json",
    kind: "json",
    sha256: "6ccd3d19d1acf1b8a44c22e8e9ce2dc369b038dd346a6a452d442db9f0802f44",
  },
  vb003Diagnostic: {
    path: "output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1/capture-manifest.json",
    kind: "json",
    sha256: "c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c",
  },
  fq002Diagnostic: {
    path: "output/playwright/g4-l10-fq002-current-js-engineering-diagnostic-v1/capture-manifest.json",
    kind: "json",
    sha256: "088e97a58c0f6991428d9f064b57f490dd66eb1f8578b74a48f1287cf7e68f09",
  },
  ruffleClosure: {
    path: "reports/g4-l10-ruffle-activated-evidence-closure-v3-successor.json",
    kind: "json",
    sha256: "bb77f565b68a5814aa210211da16f3c252b9f09603b02a19db04ce8f8f4a0f8f",
  },
  predecessorJson: {
    path: "reports/g4-l10-complete-migration-template-contract-2026-08-04.json",
    kind: "json",
    sha256: "2f51b65c82ad9b357e17a56ee1e8aefec694af5d8a5172f975a9f773922dded8",
  },
  predecessorMarkdown: {
    path: "reports/g4-l10-complete-migration-template-contract-2026-08-04.md",
    kind: "text",
    sha256: "cd408401ec2043fb8f8a5d05eaa324316bb299748c0483437991288fa9280201",
  },
  downstreamTransaction: {
    path: "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs",
    kind: "text",
    sha256: "0d2aeb203281fc350b5e440b9669ca995aa6be17ad8e28784b8956b53436754d",
  },
  downstreamTransactionTests: {
    path: "scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.test.mjs",
    kind: "text",
    sha256: "e68d8cf06a984371b17c41364fab54ab464b2a69aa570849915a93b3b96dd928",
  },
});

const GATE_IDS = Object.freeze([
  "source-custody",
  "audit",
  "original-runtime-baseline",
  "specification",
  "renderer",
  "behavior-tests",
  "visual-rmse",
  "audio-listening",
  "human-review",
  "engineering-review",
  "owner-review",
  "strict-completion",
  "atomic-lesson-release",
]);

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "authoritativeOriginalRuntimeEvidence",
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
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function fingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`), `Path escapes project root: ${relativePath}`);
  return absolute;
}

function identity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String)
    .join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(), `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(identity(after), identity(before), `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size, `${specification.path} size drifted while read`);
  const digest = sha256(bytes);
  assert.equal(digest, specification.sha256, `${specification.path} SHA-256 epoch drifted`);
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode: Number(before.mode & 0o777n).toString(8).padStart(4, "0"),
    statIdentity: identity(before),
  };
  if (specification.kind !== "binary") record.text = bytes.toString("utf8");
  if (specification.kind === "json") record.document = JSON.parse(record.text);
  return record;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const records = await Promise.all(
    Object.entries(INPUTS).map(([key, specification]) =>
      readStable(projectRoot, key, specification),
    ),
  );
  return {
    projectRoot: path.resolve(projectRoot),
    records: Object.fromEntries(records.map((record) => [record.key, record])),
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const [key, specification] of Object.entries(INPUTS)) {
    const record = await readStable(snapshot.projectRoot, key, specification);
    assert.equal(record.statIdentity, snapshot.records[key].statIdentity, `${specification.path} stat identity drifted`);
  }
}

function document(snapshot, key) {
  const result = snapshot.records[key]?.document;
  assert.ok(result, `Missing JSON document: ${key}`);
  return result;
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function acceptanceNeutral(documentValue, key) {
  assert.equal(documentValue[key], false, `${key} must remain false`);
}

function gate(id, kind, status, satisfied, current, required, blocker) {
  assert.ok(GATE_IDS.includes(id), `Unknown gate ${id}`);
  return { id, kind, status, satisfied, current, required, blocker, acceptanceEffect: "none" };
}

function countDiagnosticFrames(manifest) {
  if (Number.isInteger(manifest.summary?.captureCount)) return manifest.summary.captureCount;
  assert.ok(Array.isArray(manifest.captures), "Diagnostic manifest has no captures");
  return manifest.captures.length;
}

export function deriveContract(snapshot) {
  const releases = document(snapshot, "lessonReleases");
  const releaseLedger = document(snapshot, "lessonReleaseLedger");
  const completion = document(snapshot, "completionLedger");
  const alignment = document(snapshot, "alignment");
  const sourceSuccessor = document(snapshot, "sourceSuccessor");
  const continuation = document(snapshot, "continuation");
  const trace = document(snapshot, "traceIndex");
  const rootKits = document(snapshot, "rootCaptureKits");
  const authoring = document(snapshot, "authoringAudit");
  const vbDiagnostic = document(snapshot, "vb003Diagnostic");
  const fqDiagnostic = document(snapshot, "fq002Diagnostic");
  const ruffle = document(snapshot, "ruffleClosure");
  const predecessor = document(snapshot, "predecessorJson");

  const release = releases.releases.find((item) => item.releaseId === RELEASE_ID);
  const releaseState = releaseLedger.releases.find((item) => item.releaseId === RELEASE_ID);
  assert.ok(release && releaseState, `Missing ${RELEASE_ID}`);
  assert.equal(release.releaseType, "complete-lesson");
  assert.equal(release.publicationMode, "atomic");
  assert.equal(release.expectedCounts.members, 47);
  assert.equal(release.expectedCounts.activeXmlReferencedPages, 46);
  assert.equal(release.expectedCounts.courseShells, 1);
  assert.equal(release.members.length, 47);
  const templateMember = release.members.find((item) => item.animationId === TEMPLATE_ANIMATION_ID);
  assert.equal(templateMember?.ordinal, 7);

  assert.equal(trace.memberCount, 47);
  assert.equal(trace.requirementCount, 520);
  assert.equal(trace.frameAccurateRootReadyCount, 94);
  assert.equal(trace.unresolvedCount, 426);
  assert.equal(trace.naturalScheduleReadyCount, 0);
  assert.equal(trace.frameDomainDispositionUnresolvedCount, 74);

  const authoringSummary = authoring.summary;
  assert.equal(authoringSummary.selectedReleaseMembers, 47);
  assert.equal(authoringSummary.flaApplicableItems, 34);
  assert.equal(authoringSummary.swfOnlyNotApplicableItems, 13);
  assert.equal(authoringSummary.verifiedWorkOnlyAuthoringAudits, 0);
  assert.equal(authoringSummary.pendingApplicableAuthoringAudits, 34);

  const formal = continuation.formalGateInvariance;
  const formalGates = formal.gates;
  assert.deepEqual(formalGates.canonicalReleaseMembership, {
    present: 47,
    required: 47,
    status: "source-custody-complete",
    acceptanceEffect: "source-custody-only",
  });
  assert.equal(formalGates.authoritativeCapturedCoverageFrames.accepted, 0);
  assert.equal(formalGates.authoritativeCapturedCoverageFrames.required, 44488);
  assert.equal(formalGates.fullFrameRmseRequirements.accepted, 0);
  assert.equal(formalGates.fullFrameRmseRequirements.required, 520);
  assert.equal(formalGates.registeredFormalJavascriptRenderer.accepted, 0);
  assert.equal(formalGates.registeredFormalJavascriptRenderer.required, 47);
  assert.equal(formal.engineeringCandidates.count, 8);
  assert.equal(formal.engineeringCandidates.registeredCount, 0);

  const rootSummary = rootKits.v3ParallelRoot.summary;
  assert.equal(rootSummary.exactKits, 94);
  assert.equal(rootSummary.futureRootFrameCaptureObligations, 1020);
  assert.equal(rootSummary.capturePngs, 0);
  assert.equal(rootSummary.actualRuntimeSessions, 0);
  assert.equal(rootKits.protocol.operatorReadiness.operatorReady, false);
  const nestedFrameObligations =
    formalGates.authoritativeCapturedCoverageFrames.required -
    rootSummary.futureRootFrameCaptureObligations;
  assert.equal(nestedFrameObligations, 43468);

  for (const diagnostic of [vbDiagnostic, fqDiagnostic]) {
    assert.match(diagnostic.classification, /current-javascript-engineering-diagnostic-only/);
    assert.equal(diagnostic.acceptanceEffect, "none");
    assert.equal(diagnostic.candidate.registered, false);
    for (const key of [
      "authoritativeOriginalRuntime",
      "fullFrameOriginalRuntimeComparison",
      "rmseAcceptance",
      "humanVisualReview",
      "ownerAcceptance",
      "strictMigrationCompletion",
      "wholeLessonIntegration",
      "atomicLessonPublication",
    ]) acceptanceNeutral(diagnostic.authorityBoundary, key);
  }
  const diagnosticFrameCount = countDiagnosticFrames(vbDiagnostic) + countDiagnosticFrames(fqDiagnostic);
  assert.equal(diagnosticFrameCount, 210);

  assert.equal(ruffle.scope.runCount, 94);
  assert.equal(ruffle.scope.memberCount, 47);
  assert.equal(ruffle.authorityBoundary.ruffleForensicReferenceOnly, true);
  assert.equal(ruffle.authorityBoundary.originalRuntimeAuthority, false);
  assert.equal(ruffle.acceptanceEffects.rmseAcceptance, false);

  assert.equal(sourceSuccessor.decision.promotionRecordCount, 0);
  assert.equal(sourceSuccessor.decision.successorPlanMayBeApplied, false);
  assert.equal(sourceSuccessor.requiredUnresolvedSources.length, 16);
  assert.ok(sourceSuccessor.requiredUnresolvedSources.every((item) => item.expectedSha256 === null));
  const missingMp3ByLesson = Object.fromEntries(
    [2, 6, 8].map((lesson) => [
      String(lesson),
      sourceSuccessor.requiredUnresolvedSources.filter((item) =>
        item.canonicalPath.includes(`/L${lesson}/`),
      ).length,
    ]),
  );
  assert.deepEqual(missingMp3ByLesson, { "2": 14, "6": 1, "8": 1 });

  assert.equal(releaseState.expectedMemberCount, 47);
  assert.equal(releaseState.strictCompleteCount, 0);
  assert.equal(releaseState.missingCount, 47);
  assert.equal(releaseState.published, false);
  assert.equal(releaseState.gate.open, false);
  assert.equal(completion.entries.length, 0);
  assert.equal(completion.summary.strictComplete, 0);

  assert.equal(predecessor.releaseEvidenceAttribution.status, "unknown-unverified-writer-boundary");
  assert.equal(predecessor.scopeDistinction.completeLessonRelease.memberCount, 47);
  assert.equal(alignment.schemaVersion >= 1, true);

  const gates = [
    gate("source-custody", "machine", "PASS-SOURCE-CUSTODY-ONLY", true, 47, 47,
      "No acceptance effect; custody is not runtime, renderer, audio, fidelity, review, or release proof."),
    gate("audit", "mixed", "PARTIAL", false,
      { rootReadyRequirements: 94, unresolvedNestedRequirements: 426, pendingFlaAudits: 34 },
      { rootAndNaturalTraceRequirements: 520, flaApplicableAudits: 34 },
      "Static/root planning exists, but 426 nested requirements and 34 FLA authoring audits remain unresolved."),
    gate("original-runtime-baseline", "named-human", "BLOCKED", false,
      { acceptedMembers: 0, authoritativeFrames: 0, runtimeSessions: 0 },
      { members: 47, authoritativeFrames: 44488, bilingualSessions: 94 },
      "A named authorized operator and finalized pre-frame launch receipt are absent; unsigned kits and Ruffle are not original-runtime evidence."),
    gate("specification", "mixed", "BLOCKED", false,
      { rootReadyRequirements: 94, naturalScheduleReadyRequirements: 0 },
      { requirements: 520, unresolvedNestedRequirements: 0 },
      "Natural entry, schedule, entry-state identity, and bilingual/audio decisions remain unresolved for 426 nested requirements."),
    gate("renderer", "machine", "BLOCKED", false,
      { engineeringCandidates: 8, registeredFormalRenderers: 0, diagnosticFrames: diagnosticFrameCount },
      { registeredFormalRenderers: 47 },
      "Engineering candidates and diagnostic frames are unregistered and have zero formal effect."),
    gate("behavior-tests", "mixed", "BLOCKED", false, 0, 47,
      "There is no authoritative-baseline-bound formal renderer behavior acceptance."),
    gate("visual-rmse", "mixed", "BLOCKED", false, 0, 520,
      "There are no original-runtime-to-JavaScript RMSE results."),
    gate("audio-listening", "named-human", "BLOCKED", false,
      { acceptedMembers: 0, courseMissingMp3: 16 },
      { acceptedMembers: 47, courseMissingMp3: 0 },
      "Named listening/cue review is absent and the Grade 4 course closure still lacks 16 SHA-unresolved MP3s."),
    gate("human-review", "named-human", "PENDING", false, 0, 47,
      "No accepted human visual review records exist."),
    gate("engineering-review", "named-human", "PENDING", false, 0, 47,
      "No accepted engineering review records exist."),
    gate("owner-review", "owner", "PENDING", false, 0, 47,
      "No owner acceptance records exist."),
    gate("strict-completion", "mixed", "BLOCKED", false, 0, 47,
      "The completion ledger has zero entries and zero strict-complete migrations."),
    gate("atomic-lesson-release", "mixed", "BLOCKED", false,
      { strictComplete: 0, published: false },
      { strictComplete: 47, publishedAtomically: true },
      "The 47-member all-or-none lesson gate is closed; no partial publication is allowed."),
  ];

  const acceptanceEffects = Object.fromEntries(EFFECT_KEYS.map((key) => [key, false]));
  const inputBindings = Object.fromEntries(
    Object.keys(snapshot.records).sort().map((key) => [key, binding(snapshot.records[key])]),
  );

  const report = {
    schemaVersion: 2,
    reportType: "g4-l10-complete-migration-template-gate-contract",
    evidenceDate: "2026-08-04",
    status: "fail-closed-template-not-stable",
    templateStable: false,
    successorOf: binding(snapshot.records.predecessorJson),
    dispositionOfV1: {
      status: "preserved-superseded-by-attributed-whole-lesson-contract",
      reason: "v1 covered the four-requirement VB003 placement and retained a now-resolved unknown-writer boundary; v2 binds the stable 47-member lesson epoch without rewriting v1.",
    },
    authorityBoundary: {
      readOnlyRecomputation: true,
      createsRuntimeEvidence: false,
      createsRenderer: false,
      ruffleIsForensicReferenceOnly: true,
      currentJavascriptDiagnosticsAreEngineeringOnly: true,
      unsignedKitsAreRuntimeEvidence: false,
      mayLaunchOriginalRuntime: false,
      mayApplyDownstreamTransaction: false,
      mayRefreshOrAdoptEvidence: false,
      mayRegisterRenderer: false,
      mayMarkAcceptanceOrCompletion: false,
      mayIntegrateOrPublish: false,
    },
    evidenceEpochClosure: {
      writerAttribution: {
        status: "attributed-and-stopped",
        writerType: "sibling-codex-task-with-child-agents",
        affectedScope: "Grade 4 Lesson 10 evidence and downstream planning",
      },
      boundedQuiescenceObservation: {
        status: "two-identical-read-only-snapshots",
        observationTiming: "pre-v2-script-and-report-write",
        intervalSeconds: 129.751,
        descriptorCount: 2679,
        fileCount: 2159,
        directoryCount: 520,
        totalBytes: 100373529,
        setSha256: "88704c7bd5979ae78e341eb6783d48a702713ae3830daaca1fdc4de35f42c07b",
        driftCount: 0,
        openWriterCount: 0,
        transactionLockStageOrCustodyCount: 0,
        acceptanceEffect: "none",
      },
      rule: "This closes only the mixed-writer/currentness stop in v1; it does not close any migration or acceptance gate.",
    },
    scope: {
      grade: 4,
      lesson: 10,
      releaseId: RELEASE_ID,
      publicationMode: "atomic",
      memberCount: 47,
      activePageCount: 46,
      shellCount: 1,
      templatePlacement: {
        animationId: TEMPLATE_ANIMATION_ID,
        ordinal: 7,
        assetId: templateMember.assetId,
        role: templateMember.releaseRole,
      },
      rule: "VB003 is the process template placement, not a substitute for the 47-member whole-lesson denominator.",
    },
    sourceAndCurriculumBindings: {
      alignment: binding(snapshot.records.alignment),
      sourceSuccessorV3: binding(snapshot.records.sourceSuccessor),
      successorPromotionRecordCount: 0,
      missingCourseMp3Count: 16,
      missingCourseMp3ByLesson: missingMp3ByLesson,
      l10MissingCourseMp3Count: 0,
      allMissingMp3ExpectedSha256Known: false,
      rule: "The 16 MP3s remain explicit Grade 4 whole-course blockers; no filename, case, path, or placement inference may admit them.",
    },
    currentFormalState: {
      sourceCustody: { present: 47, required: 47, acceptanceEffect: "source-custody-only" },
      authoring: {
        flaApplicable: 34,
        swfOnlyNotApplicable: 13,
        verified: 0,
        pending: 34,
      },
      requirements: {
        total: 520,
        rootReady: 94,
        unresolvedNested: 426,
        naturalScheduleReady: 0,
        unresolvedFrameDomainDispositions: 74,
      },
      frameObligations: {
        total: 44488,
        root: 1020,
        nested: nestedFrameObligations,
        authoritativeCaptured: 0,
      },
      originalRuntime: {
        acceptedMembers: 0,
        exactUnsignedBilingualKits: 94,
        runtimeSessions: 0,
        capturePngs: 0,
        operatorReady: false,
      },
      javascript: {
        engineeringCandidateCount: 8,
        registeredCandidateCount: 0,
        localCandidateFrameCount: formal.engineeringCandidates.currentJavascriptLocalFrameCount,
        boundDiagnosticFrameCount: diagnosticFrameCount,
        registeredFormalRendererCount: 0,
        diagnosticFormalEffect: 0,
      },
      ruffle: {
        forensicObservationCount: 94,
        originalRuntimeAuthority: false,
        acceptanceEffect: "none",
      },
      reviewAndRelease: {
        rmseAcceptedRequirements: 0,
        rmseRequiredRequirements: 520,
        listeningAcceptedMembers: 0,
        humanAcceptedMembers: 0,
        engineeringAcceptedMembers: 0,
        ownerAcceptedMembers: 0,
        strictCompleteMembers: 0,
        completionLedgerEntries: 0,
        published: false,
      },
    },
    downstreamTransactionBoundary: {
      decision: "DO_NOT_APPLY",
      durableAppliedReceiptPresent: false,
      applyAuthorized: false,
      boundCandidate: binding(snapshot.records.downstreamTransaction),
      boundTests: binding(snapshot.records.downstreamTransactionTests),
      unresolvedReviewRequirements: [
        "descriptor-relative create and write for every managed output",
        "symlink and pathname race closure across install and rollback",
        "persistent no-delete custody for preimages and unexplained foreign state",
        "no recursive pathname cleanup authority",
        "independent security review of final exact bytes before any apply",
      ],
      independentlyReproducedP0Findings: [
        "custody leaf can be replaced after identity verification and before pathname unlinkat deletion",
        "formal, archive, lock, and stage writes are pathname-based rather than descriptor-relative from pinned parents",
        "temporary clone and native-build cleanup retain recursive pathname deletion authority before mode dispatch",
      ],
      p1TestCoverageGap:
        "Current tests do not exercise the intra-helper pre-unlink replacement window, ancestor-swap writes, or replaceable-root recursive cleanup race.",
      p2DocumentationGap:
        "The native-helper comment says no deletion although the helper accepts delete and calls unlinkat.",
      prohibitedModes: ["--apply", "--dry-run", "--check"],
      rule: "The candidate is hash-bound for audit only. This contract does not execute, approve, or attest its transaction design.",
    },
    gates,
    automationBoundary: {
      status: "HALT-BEFORE-ORIGINAL-RUNTIME-AND-TRANSACTION",
      templateBatchAdmissionAllowed: false,
      remainingGrade4LessonBatchStartAllowed: false,
      wholeCourseIntegrationAllowed: false,
      safeReadOnlyActions: [
        "re-run this contract with --check",
        "perform independent review of exact bound code and reports",
        "prepare an operator authorization and disposable-offline-environment preflight without launching",
      ],
      prohibitedActions: [
        "apply or test the downstream transaction against the live checkout",
        "launch Adobe Animate, Projector, or another original runtime without named authorization and preflight",
        "treat Ruffle or current-JavaScript diagnostics as original-runtime evidence",
        "refresh, adopt, register, complete, integrate, or publish any L10 member",
        "start Grade 4 batch production while templateStable is false",
      ],
    },
    nextNamedHumanAction: {
      role: "named authorized Adobe Animate/original-runtime operator",
      action: "Authorize one named operator and an approved disposable offline environment for the exact 94 hash-bound EN/ES root kits; the operator must finalize the hash-bound source-open/pre-frame launch receipt before the first capture.",
      reason: "Original-runtime baseline, bilingual/audio listening, visual review, renderer validation, RMSE, and all downstream acceptance gates cannot truthfully advance from machine-only evidence.",
      cannotBeAutomated: true,
    },
    acceptanceEffects,
    inputBindings,
  };
  report.reportFingerprintSha256 = fingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.templateStable, false);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.scope.templatePlacement.ordinal, 7);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.javascript.registeredFormalRendererCount, 0);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.nextNamedHumanAction.cannotBeAutomated, true);
  assert.deepEqual(report.gates.map((item) => item.id), GATE_IDS);
  assert.equal(report.gates.filter((item) => item.satisfied).length, 1);
  assert.equal(report.gates[0].status, "PASS-SOURCE-CUSTODY-ONLY");
  assert.ok(report.gates.every((item) => item.acceptanceEffect === "none"));
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.reportFingerprintSha256, fingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const rows = report.gates.map((item) =>
    `| ${item.id} | ${item.kind} | ${item.status} | ${item.satisfied ? "yes" : "no"} | ${item.blocker} |`,
  ).join("\n");
  const bindings = Object.values(report.inputBindings).map((item) =>
    `| \`${item.path}\` | ${item.bytes} | \`${item.sha256}\` | \`${item.mode}\` |`,
  ).join("\n");

  return `# Grade 4 Lesson 10 complete-migration template contract v2

Evidence date: **${report.evidenceDate}**  
Status: **${report.status}**  
Template stable: **${report.templateStable}**  
Fingerprint: \`${report.reportFingerprintSha256}\`

## Outcome

The L10 evidence scope is now attributed and quiescent, so v2 replaces the old unknown-writer stop without altering v1. It does **not** claim that the requested migration chain has passed. The exact whole-lesson denominator is **47 members** (46 active pages plus one shell); VB003 is only template placement **7/47**.

Current formal state is **0/44,488 authoritative original-runtime frames**, **0/520 RMSE results**, **0/47 registered formal renderers**, **0/47 named listening reviews**, **0/47 human reviews**, **0/47 owner reviews**, **0/47 strict-complete members**, and **unpublished**. Therefore L10 is not yet a stable template and no remaining-lesson batch is admitted.

## Stable evidence epoch

The previous writer was attributed to a sibling Codex task and its child agents, then stopped. Before the v2 script/report write, two read-only snapshots ${report.evidenceEpochClosure.boundedQuiescenceObservation.intervalSeconds} seconds apart agreed across ${report.evidenceEpochClosure.boundedQuiescenceObservation.descriptorCount} descriptors (${report.evidenceEpochClosure.boundedQuiescenceObservation.fileCount} files, ${report.evidenceEpochClosure.boundedQuiescenceObservation.directoryCount} directories, ${report.evidenceEpochClosure.boundedQuiescenceObservation.totalBytes} bytes), with set SHA-256 \`${report.evidenceEpochClosure.boundedQuiescenceObservation.setSha256}\`, zero drift, zero open writers, and zero transaction lock/stage/custody artifacts. Because v2 itself adds files to that scope, this digest is explicitly a **pre-write observation**, not the current post-write tree digest. It is an epoch/currentness result only; acceptance effect remains \`none\`.

## Audit and evidence totals

- Source custody: 47/47 release members; source-custody effect only.
- Authoring: 34 FLA-applicable, 13 SWF-only/not-applicable, 0 verified, 34 pending.
- Trace requirements: 520 total; 94 root-ready; 426 nested unresolved; 0 natural schedules ready; 74 unresolved frame-domain dispositions.
- Frame obligations: 44,488 total = 1,020 root + 43,468 nested; authoritative captures = 0.
- Root protocol: 94 exact unsigned EN/ES kits, 0 PNG captures, 0 runtime sessions, operator-ready = false.
- Current JavaScript: 8 engineering candidates, 0 registered; the two bound diagnostics contain 210 frames and have formal effect 0.
- Ruffle: 94 forensic observations; original-runtime authority = false; acceptance effect = none.
- Grade 4 audio closure: 16 unresolved MP3s (L2: 14, L6: 1, L8: 1), all with unknown expected SHA-256; no object can be admitted by filename, case, path, or placement.

## Gate matrix

| Gate | Kind | Status | Satisfied | Current blocker |
|---|---|---:|---:|---|
${rows}

The only satisfied row is source custody, and it expressly has no runtime, fidelity, audio, review, completion, release, or publication effect.

## Downstream transaction boundary

Decision: **${report.downstreamTransactionBoundary.decision}**. There is no applied receipt, apply authorization is false, and even dry-run/check execution against this live checkout is prohibited by this contract. Before any use, the exact bound candidate needs descriptor-relative create/write, pathname and symlink race closure, persistent no-delete custody, removal of recursive pathname cleanup authority, and an independent security review. No transaction mode was executed while generating v2.

## Named human gate

Role: **${report.nextNamedHumanAction.role}**

Action: ${report.nextNamedHumanAction.action}

Why: ${report.nextNamedHumanAction.reason}

Until that authorization/preflight and the downstream security review are complete, automation remains **${report.automationBoundary.status}**. Do not launch, apply, refresh, adopt, register, complete, integrate, publish, or start the Grade 4 production batches.

## Acceptance effects

Every acceptance/publication effect in the JSON artifact is \`false\`. This contract is a read-only decision artifact; it is not original-runtime evidence, a renderer, an RMSE result, an audio/human/owner decision, strict completion, lesson release, whole-course integration, or publication authority.

## SHA-256-bound inputs

| Path | Bytes | SHA-256 | Mode |
|---|---:|---|---:|
${bindings}
`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents, `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, { flag: "wx", mode: 0o644 });
  return "created";
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
    const jsonDisposition = await writeNoClobber(jsonPath, json);
    const markdownDisposition = await writeNoClobber(markdownPath, markdown);
    await assertSnapshotUnchanged(snapshot);
    return { mode, report, written: [REPORT_JSON, REPORT_MARKDOWN], dispositions: [jsonDisposition, markdownDisposition] };
  }

  assert.equal(await readFile(jsonPath, "utf8"), json, `${REPORT_JSON} is stale`);
  assert.equal(await readFile(markdownPath, "utf8"), markdown, `${REPORT_MARKDOWN} is stale`);
  await assertSnapshotUnchanged(snapshot);
  return { mode, report, checked: [REPORT_JSON, REPORT_MARKDOWN] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_JSON} and ${REPORT_MARKDOWN}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
