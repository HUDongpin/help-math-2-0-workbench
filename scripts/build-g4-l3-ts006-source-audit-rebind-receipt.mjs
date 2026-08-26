#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");

const ANIMATION_ID = "course-g04-l03-ts-006";
const SOURCE_AUDIT =
  "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-source-audit.json";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf";
const SOURCE_FLA =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS06.fla";
const CANDIDATE_REPORT =
  "reports/g4-l3-ts006-current-javascript-candidate.json";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const LESSON_RELEASE_LEDGER = "catalog/lesson-release-ledger.json";
const OUTPUT_JSON =
  "reports/g4-l3-ts006-source-audit-rebind-receipt.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l3-ts006-source-audit-rebind-receipt.md";

const OLD_SOURCE_AUDIT = Object.freeze({
  path: SOURCE_AUDIT,
  bytes: 8_195,
  sha256: "6b09c03c708f35fcd1fdb1cde365d41d21a1a8296d5f687c2f4ab6ef11c93fb1",
});

const CURRENT_SOURCE_AUDIT = Object.freeze({
  path: SOURCE_AUDIT,
  bytes: 8_195,
  sha256: "e27f043f7c2153896128cdd780a67b1d2c0e87557af9a622d42d4c0b76f41cfc",
});

const ARCHIVED_CANDIDATE_REPORT = Object.freeze({
  path: CANDIDATE_REPORT,
  bytes: 45_433,
  sha256: "8b19edfa872110e71c97dfcee8cbfe66a867e41587522f27774342952c4bad7a",
});

const ARCHIVED_CANDIDATE_GENERATOR = Object.freeze({
  path: "scripts/build-g4-l3-ts006-current-js-candidate.mjs",
  bytes: 53_296,
  sha256: "bf1e57be4c12e3e91e9ae3a0401c44e6b34fad35587a0ef61f09052ded0d0d73",
});

const SOURCE_IDENTITIES = Object.freeze({
  swf: Object.freeze({
    path: SOURCE_SWF,
    bytes: 55_154,
    sha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47",
  }),
  fla: Object.freeze({
    path: SOURCE_FLA,
    bytes: 3_950_592,
    sha256: "3f500c60b73b735eb001993b31ff101bf1615384c86b6a28987a84feef5b70dd",
  }),
});

const FALSE_ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorized",
  "authoritativeOriginalRuntimeComplete",
  "naturalRuntimeReachabilityComplete",
  "frameDomainDispositionComplete",
  "bilingualVisualParityComplete",
  "audioAccepted",
  "replayParityComplete",
  "fullFrameRmseComplete",
  "behaviorComplete",
  "productQaComplete",
  "accessibilityQaComplete",
  "humanVisualReviewAccepted",
  "ownerAccepted",
  "strictMigrationComplete",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the repository: ${relativePath}`);
  return resolved;
}

async function readBinding(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const contents = await readFile(absolute);
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

function withoutContents(binding) {
  const {contents, ...descriptor} = binding;
  return descriptor;
}

function assertPinned(binding, expected, label) {
  invariant(binding.path === expected.path &&
    binding.bytes === expected.bytes &&
    binding.sha256 === expected.sha256,
  `${label} differs from its pinned identity`);
  return binding;
}

function validateFingerprint(document, field, label) {
  const projected = structuredClone(document);
  delete projected[field];
  invariant(document[field] === fingerprint(projected),
    `${label} fingerprint is stale`);
}

function findGeneratorBinding(candidate) {
  const matches = candidate.integrationBindings?.filter(
    (binding) => binding.path === ARCHIVED_CANDIDATE_GENERATOR.path,
  ) ?? [];
  invariant(matches.length === 1,
    "archived TS006 candidate must bind exactly one candidate generator");
  const binding = matches[0];
  invariant(binding.bytes === ARCHIVED_CANDIDATE_GENERATOR.bytes &&
    binding.sha256 === ARCHIVED_CANDIDATE_GENERATOR.sha256,
  "archived TS006 candidate generator binding changed");
  return binding;
}

function extractValidatorBody(generatorText) {
  const start = generatorText.indexOf(
    "function validateStaticEvidence(sourceAudit, protocol, structuralBaseline) {",
  );
  const end = generatorText.indexOf(
    "\nasync function browserRenderability(",
    start,
  );
  invariant(start >= 0 && end > start,
    "archived candidate generator static-evidence validator is missing");
  const body = generatorText.slice(start, end);
  const requiredFragments = [
    "sourceAudit.identity?.animationId === ANIMATION_ID",
    "sourceAudit.machineFindings?.runtime?.stage?.width === 800",
    "sourceAudit.machineFindings.runtime.stage.height === 600",
    "sourceAudit.machineFindings.runtime.fps === 12",
    "sourceAudit.machineFindings.runtime.rootFrameCount === 10",
    "sourceAudit.machineFindings.runtime.backgroundColor === \"#b8d8f7\"",
    "sourceAudit.machineFindings?.scripts?.random?.occurrences === 0",
    "sourceAudit.machineFindings.scripts.externalApiCandidates.length === 0",
    "sourceAudit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched === false",
  ];
  for (const fragment of requiredFragments) {
    invariant(body.includes(fragment),
      `archived candidate generator validation contract is missing: ${fragment}`);
  }
  return {
    bytes: Buffer.byteLength(body),
    sha256: sha256(body),
    requiredConditionCount: requiredFragments.length,
  };
}

function archivedCandidateProjection(candidate) {
  invariant(candidate.schemaVersion === 2 &&
    candidate.reportType === "current-javascript-engineering-candidate" &&
    candidate.animationId === ANIMATION_ID,
  "archived TS006 candidate identity is invalid");
  validateFingerprint(candidate, "reportFingerprintSha256",
    "archived TS006 candidate");
  invariant(candidate.evidenceBindings?.sourceAudit?.path ===
    OLD_SOURCE_AUDIT.path &&
    candidate.evidenceBindings.sourceAudit.bytes === OLD_SOURCE_AUDIT.bytes &&
    candidate.evidenceBindings.sourceAudit.sha256 === OLD_SOURCE_AUDIT.sha256 &&
    candidate.evidenceBindings.sourceAudit.authority ===
      "static-machine-source-evidence-only",
  "archived TS006 candidate does not bind the expected old source audit");
  invariant(FALSE_ACCEPTANCE_KEYS.every(
    (key) => candidate.acceptance?.[key] === false,
  ) && candidate.strictAcceptanceEffect === "none",
  "archived TS006 candidate crossed its acceptance-neutral boundary");
  invariant(candidate.disposition?.currentJavaScriptCandidate === true &&
    candidate.disposition?.strictMigrationComplete === false &&
    candidate.disposition?.publicLibraryAdmitted === false &&
    candidate.disposition?.productionAdmission === false,
  "archived TS006 candidate disposition was promoted");
  return {
    animationId: candidate.animationId,
    sourceKind: "fla+swf",
    source: {
      swf: {
        path: candidate.source.swf.path,
        bytes: candidate.source.swf.bytes,
        sha256: candidate.source.swf.sha256,
      },
      fla: {
        path: candidate.source.fla.path,
        bytes: candidate.source.fla.bytes,
        sha256: candidate.source.fla.sha256,
        authoringAuditPerformed: candidate.source.fla
          .authoringAuditPerformedByGenerator,
      },
    },
    runtime: {
      stage: structuredClone(candidate.timeline.stage),
      fps: candidate.timeline.fps,
      rootFrameCount: candidate.timeline.root.frameCount,
    },
    scripts: {
      randomOccurrences: 0,
      externalApiCandidateCount: 0,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched: false,
    },
  };
}

export function currentAuditProjection(audit) {
  invariant(audit?.schemaVersion === 1 &&
    audit.artifactType === "g4-l3-workspace-source-audit" &&
    audit.identity?.animationId === ANIMATION_ID,
  "current TS006 source audit identity is invalid");
  return {
    animationId: audit.identity.animationId,
    sourceKind: audit.provenance.source.sourceKind,
    source: {
      swf: {
        path: audit.provenance.source.swf.path,
        bytes: audit.provenance.source.swf.bytes,
        sha256: audit.provenance.source.swf.sha256,
      },
      fla: {
        path: audit.provenance.source.fla.path,
        bytes: audit.provenance.source.fla.bytes,
        sha256: audit.provenance.source.fla.sha256,
        authoringAuditPerformed:
          audit.provenance.source.fla.authoringAuditPerformed,
      },
    },
    runtime: {
      stage: {
        width: audit.machineFindings.runtime.stage.width,
        height: audit.machineFindings.runtime.stage.height,
        backgroundColor: audit.machineFindings.runtime.backgroundColor,
      },
      fps: audit.machineFindings.runtime.fps,
      rootFrameCount: audit.machineFindings.runtime.rootFrameCount,
    },
    scripts: {
      randomOccurrences:
        audit.machineFindings.scripts.random.occurrences,
      externalApiCandidateCount:
        audit.machineFindings.scripts.externalApiCandidates.length,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched:
        audit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched,
    },
  };
}

function resolveJsonPointer(document, pointer, label) {
  invariant(typeof pointer === "string" && pointer.startsWith("/"),
    `${label} JSON pointer is invalid`);
  return pointer.slice(1).split("/").reduce((value, token) => {
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    invariant(value !== null && value !== undefined &&
      Object.hasOwn(value, key), `${label} JSON pointer does not resolve`);
    return value[key];
  }, document);
}

function validateCurrentAudit({
  audit,
  auditBinding,
  materializerBinding,
  upstreamBinding,
  releaseBinding,
  sourceSwf,
  sourceFla,
}) {
  assertPinned(auditBinding, CURRENT_SOURCE_AUDIT, "current TS006 source audit");
  validateFingerprint(audit, "artifactFingerprintSha256",
    "current TS006 source audit");
  invariant(audit.acceptance?.acceptanceNeutral === true &&
    audit.acceptance?.acceptanceEffect === "none" &&
    audit.acceptance?.migrationStatusChanges === 0 &&
    audit.acceptance?.reviewOrApprovalChanges === 0 &&
    audit.acceptance?.completionLedgerChanges === 0 &&
    audit.acceptance?.lessonPublicationChanges === 0 &&
    audit.acceptance?.originalRuntimeSessions === 0,
  "current TS006 source audit exceeded its acceptance-neutral boundary");
  invariant(Object.values(audit.machineFindings.evidenceLimits)
    .every((value) => value === false),
  "current TS006 source audit unexpectedly establishes an acceptance gate");

  const provenance = audit.provenance;
  invariant(provenance.materializer.path === materializerBinding.path &&
    provenance.materializer.sha256 === materializerBinding.sha256,
  "current TS006 source audit materializer binding is stale");
  invariant(provenance.upstreamMachineAudit.path === upstreamBinding.path &&
    provenance.upstreamMachineAudit.bytes === upstreamBinding.bytes &&
    provenance.upstreamMachineAudit.sha256 === upstreamBinding.sha256,
  "current TS006 source audit upstream report binding is stale");
  invariant(provenance.lessonReleaseManifest.path === releaseBinding.path &&
    provenance.lessonReleaseManifest.bytes === releaseBinding.bytes &&
    provenance.lessonReleaseManifest.sha256 === releaseBinding.sha256,
  "current TS006 source audit lesson-release binding is stale");

  const upstream = JSON.parse(upstreamBinding.contents.toString("utf8"));
  const upstreamItem = resolveJsonPointer(upstream,
    provenance.upstreamMachineAudit.itemJsonPointer,
    "current TS006 upstream item");
  invariant(upstreamItem.animationId === ANIMATION_ID &&
    upstreamItem.auditFingerprintSha256 ===
      provenance.upstreamMachineAudit.itemFingerprintSha256,
  "current TS006 upstream item fingerprint is stale");
  const releaseManifest = JSON.parse(releaseBinding.contents.toString("utf8"));
  const releaseMember = resolveJsonPointer(releaseManifest,
    provenance.lessonReleaseManifest.memberJsonPointer,
    "current TS006 release member");
  invariant(releaseMember.animationId === ANIMATION_ID &&
    releaseMember.assetId === audit.identity.assetId,
  "current TS006 release member identity is stale");

  assertPinned(sourceSwf, SOURCE_IDENTITIES.swf, "TS006 source SWF");
  assertPinned(sourceFla, SOURCE_IDENTITIES.fla, "TS006 source FLA");
  invariant(provenance.source.swf.physicalHashVerified === true &&
    provenance.source.fla.physicalHashVerified === true,
  "current TS006 source audit lacks physical source verification");
  const projection = currentAuditProjection(audit);
  invariant(fingerprint(projection.source.swf) ===
    fingerprint(SOURCE_IDENTITIES.swf) &&
    fingerprint({
      path: projection.source.fla.path,
      bytes: projection.source.fla.bytes,
      sha256: projection.source.fla.sha256,
    }) === fingerprint(SOURCE_IDENTITIES.fla),
  "current TS006 source audit source projection differs from physical sources");
  return projection;
}

function buildReceipt({
  archivedCandidate,
  archivedCandidateBinding,
  archivedGeneratorBinding,
  archivedValidatorBody,
  audit,
  auditBinding,
  currentProjection,
  materializerBinding,
  upstreamBinding,
  releaseBinding,
  sourceSwf,
  sourceFla,
  receiptGeneratorBinding,
}) {
  const historicalProjection = archivedCandidateProjection(archivedCandidate);
  invariant(fingerprint(historicalProjection) === fingerprint(currentProjection),
    "TS006 source-audit candidate-consumed semantic projection changed");
  const receipt = {
    schemaVersion: 1,
    receiptType: "g4-l3-ts006-source-audit-rebind-receipt",
    receiptId: "g4-l3-ts006-source-audit-rebind-2026-07-27",
    animationId: ANIMATION_ID,
    status:
      "verified-acceptance-neutral-source-audit-rebind-with-bounded-historical-delta",
    reason:
      "The artifact-only workspace source audit was rematerialized after its derived provenance chain changed. The physical FLA/SWF identities and the exact semantic projection consumed by the archived current-JavaScript candidate remain unchanged.",
    transition: {
      from: OLD_SOURCE_AUDIT,
      to: CURRENT_SOURCE_AUDIT,
      bytesUnchanged: OLD_SOURCE_AUDIT.bytes === CURRENT_SOURCE_AUDIT.bytes,
      sha256Changed: OLD_SOURCE_AUDIT.sha256 !== CURRENT_SOURCE_AUDIT.sha256,
    },
    historicalEvidence: {
      candidateReport: withoutContents(archivedCandidateBinding),
      candidateReportFingerprintSha256:
        archivedCandidate.reportFingerprintSha256,
      candidateGenerator: withoutContents(archivedGeneratorBinding),
      staticEvidenceValidatorBody: archivedValidatorBody,
      oldSourceAuditCompleteBytesAvailable: false,
      oldSourceAuditFullByteDiffPerformed: false,
      limitation:
        "The old 8,195-byte source-audit preimage is not retained. This receipt therefore proves the unchanged source identities and candidate-consumed semantic projection through the archived candidate report and its exact hash-bound generator validation contract; it does not claim a field-by-field diff of the unavailable old audit bytes.",
    },
    currentEvidence: {
      sourceAudit: withoutContents(auditBinding),
      sourceAuditArtifactFingerprintSha256:
        audit.artifactFingerprintSha256,
      physicalSources: {
        swf: withoutContents(sourceSwf),
        fla: withoutContents(sourceFla),
      },
      provenance: {
        materializer: withoutContents(materializerBinding),
        upstreamMachineAudit: {
          ...withoutContents(upstreamBinding),
          auditSetSha256:
            audit.provenance.upstreamMachineAudit.auditSetSha256,
          itemJsonPointer:
            audit.provenance.upstreamMachineAudit.itemJsonPointer,
          itemFingerprintSha256:
            audit.provenance.upstreamMachineAudit.itemFingerprintSha256,
        },
        lessonReleaseManifest: {
          ...withoutContents(releaseBinding),
          memberJsonPointer:
            audit.provenance.lessonReleaseManifest.memberJsonPointer,
        },
      },
    },
    semanticProjection: {
      encoding: "stable two-space-indented JSON plus LF",
      historical: historicalProjection,
      current: currentProjection,
      historicalSha256: fingerprint(historicalProjection),
      currentSha256: fingerprint(currentProjection),
      equal: true,
      scope:
        "TS006 identity, physical FLA/SWF bindings, native stage/background/FPS/root-frame metadata, random/external-API candidate counts, and authoritative-runtime-negative boundary consumed by the archived candidate generator.",
    },
    driftAssessment: {
      classification:
        "derived-provenance-refresh-with-no-source-or-candidate-consumed-semantic-projection-drift-observed",
      sourceIdentityUnchanged: true,
      candidateConsumedSemanticProjectionUnchanged: true,
      currentProvenanceChainVerified: true,
      oldAuditCompleteBytesAvailable: false,
      onlyDerivedProvenanceChangedProvenByFullByteDiff: false,
      conclusionStrength:
        "bounded-rebind-eligibility-not-a-full-old-vs-new-audit-byte-diff",
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      currentJavaScriptCandidateOnly: true,
      originalRuntimeAuthorityCreated: false,
      audioAcceptanceCreated: false,
      humanReviewCreated: false,
      ownerAcceptanceCreated: false,
      strictCompletionCreated: false,
      completionLedgerWriteAuthorized: false,
      lessonReleaseWriteAuthorized: false,
      publicReleaseAuthorized: false,
      sourceAssetWriteAuthorized: false,
      strictAcceptanceEffect: "none",
    },
    generatedBy: withoutContents(receiptGeneratorBinding),
  };
  receipt.receiptFingerprintSha256 = fingerprint(receipt);
  return receipt;
}

function renderMarkdown(receipt) {
  return `# G4 L3 TS006 source-audit rebind receipt\n\n` +
    `- Status: \`${receipt.status}\`\n` +
    `- Old audit: \`${receipt.transition.from.sha256}\` ` +
      `(${receipt.transition.from.bytes} bytes)\n` +
    `- Current audit: \`${receipt.transition.to.sha256}\` ` +
      `(${receipt.transition.to.bytes} bytes)\n` +
    `- Physical SWF: \`${receipt.currentEvidence.physicalSources.swf.sha256}\`\n` +
    `- Physical FLA: \`${receipt.currentEvidence.physicalSources.fla.sha256}\`\n` +
    `- Candidate-consumed semantic projection: ` +
      `\`${receipt.semanticProjection.currentSha256}\` (unchanged)\n` +
    `- Strict acceptance effect: **none**\n\n` +
    `## Evidence boundary\n\n` +
    `${receipt.historicalEvidence.limitation}\n\n` +
    `This receipt permits only the transparent rebind of the TS006 ` +
    `current-JavaScript candidate from the old artifact-only source-audit ` +
    `identity to the verified current identity. It creates no original-runtime, ` +
    `audio, human, Owner, strict-completion, ledger, publication, or release ` +
    `authority.\n`;
}

export function validateG4L3Ts006SourceAuditRebindReceipt(receipt, {
  currentAuditBinding,
  sourceSwfBinding,
  sourceFlaBinding,
} = {}) {
  invariant(receipt?.schemaVersion === 1 &&
    receipt.receiptType === "g4-l3-ts006-source-audit-rebind-receipt" &&
    receipt.animationId === ANIMATION_ID,
  "TS006 source-audit rebind receipt identity is invalid");
  validateFingerprint(receipt, "receiptFingerprintSha256",
    "TS006 source-audit rebind receipt");
  invariant(receipt.transition?.from?.sha256 === OLD_SOURCE_AUDIT.sha256 &&
    receipt.transition?.from?.bytes === OLD_SOURCE_AUDIT.bytes &&
    receipt.transition?.to?.sha256 === CURRENT_SOURCE_AUDIT.sha256 &&
    receipt.transition?.to?.bytes === CURRENT_SOURCE_AUDIT.bytes &&
    receipt.transition?.bytesUnchanged === true &&
    receipt.transition?.sha256Changed === true,
  "TS006 source-audit rebind transition is invalid");
  invariant(receipt.historicalEvidence?.candidateReport?.sha256 ===
    ARCHIVED_CANDIDATE_REPORT.sha256 &&
    receipt.historicalEvidence?.candidateGenerator?.sha256 ===
      ARCHIVED_CANDIDATE_GENERATOR.sha256 &&
    receipt.historicalEvidence?.oldSourceAuditCompleteBytesAvailable === false &&
    receipt.historicalEvidence?.oldSourceAuditFullByteDiffPerformed === false,
  "TS006 source-audit rebind historical boundary is invalid");
  invariant(receipt.semanticProjection?.equal === true &&
    receipt.semanticProjection.historicalSha256 ===
      receipt.semanticProjection.currentSha256 &&
    receipt.semanticProjection.currentSha256 ===
      fingerprint(receipt.semanticProjection.current) &&
    receipt.semanticProjection.historicalSha256 ===
      fingerprint(receipt.semanticProjection.historical),
  "TS006 source-audit rebind semantic projection is stale or unequal");
  invariant(receipt.driftAssessment?.sourceIdentityUnchanged === true &&
    receipt.driftAssessment?.candidateConsumedSemanticProjectionUnchanged ===
      true &&
    receipt.driftAssessment?.currentProvenanceChainVerified === true &&
    receipt.driftAssessment?.oldAuditCompleteBytesAvailable === false &&
    receipt.driftAssessment?.onlyDerivedProvenanceChangedProvenByFullByteDiff ===
      false,
  "TS006 source-audit rebind overstates its historical delta");
  invariant(Object.entries(receipt.authorityBoundary)
    .filter(([key]) => ![
      "acceptanceNeutral",
      "currentJavaScriptCandidateOnly",
      "strictAcceptanceEffect",
    ].includes(key))
    .every(([, value]) => value === false) &&
    receipt.authorityBoundary.acceptanceNeutral === true &&
    receipt.authorityBoundary.currentJavaScriptCandidateOnly === true &&
    receipt.authorityBoundary.strictAcceptanceEffect === "none",
  "TS006 source-audit rebind receipt crossed an authority boundary");

  if (currentAuditBinding) {
    invariant(currentAuditBinding.path === CURRENT_SOURCE_AUDIT.path &&
      currentAuditBinding.bytes === CURRENT_SOURCE_AUDIT.bytes &&
      currentAuditBinding.sha256 === CURRENT_SOURCE_AUDIT.sha256 &&
      receipt.currentEvidence.sourceAudit.path === currentAuditBinding.path &&
      receipt.currentEvidence.sourceAudit.bytes === currentAuditBinding.bytes &&
      receipt.currentEvidence.sourceAudit.sha256 === currentAuditBinding.sha256,
    "TS006 source-audit rebind does not bind the current audit");
  }
  if (sourceSwfBinding) {
    invariant(sourceSwfBinding.path === SOURCE_IDENTITIES.swf.path &&
      sourceSwfBinding.bytes === SOURCE_IDENTITIES.swf.bytes &&
      sourceSwfBinding.sha256 === SOURCE_IDENTITIES.swf.sha256 &&
      receipt.currentEvidence.physicalSources.swf.sha256 ===
        sourceSwfBinding.sha256,
    "TS006 source-audit rebind does not bind the current SWF");
  }
  if (sourceFlaBinding) {
    invariant(sourceFlaBinding.path === SOURCE_IDENTITIES.fla.path &&
      sourceFlaBinding.bytes === SOURCE_IDENTITIES.fla.bytes &&
      sourceFlaBinding.sha256 === SOURCE_IDENTITIES.fla.sha256 &&
      receipt.currentEvidence.physicalSources.fla.sha256 ===
        sourceFlaBinding.sha256,
    "TS006 source-audit rebind does not bind the current FLA");
  }
  return receipt;
}

async function assertSafeOutput(relativePath) {
  invariant([OUTPUT_JSON, OUTPUT_MARKDOWN].includes(relativePath),
    `undeclared receipt output: ${relativePath}`);
  const absolute = projectPath(relativePath);
  try {
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(),
      `${relativePath} must be a regular non-symlink output`);
    invariant((await stat(absolute)).nlink === 1,
      `${relativePath} must not have multiple hard links`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function emit(relativePath, bytes, check) {
  const absolute = projectPath(relativePath);
  if (check) {
    const current = await readFile(absolute);
    invariant(current.equals(bytes), `${relativePath} is stale`);
    return;
  }
  await assertSafeOutput(relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
}

async function validateCurrentReceipt({
  receiptBinding,
  auditBinding,
  sourceSwf,
  sourceFla,
}) {
  const receipt = JSON.parse(receiptBinding.contents.toString("utf8"));
  validateG4L3Ts006SourceAuditRebindReceipt(receipt, {
    currentAuditBinding: auditBinding,
    sourceSwfBinding: sourceSwf,
    sourceFlaBinding: sourceFla,
  });
  return receipt;
}

export async function buildG4L3Ts006SourceAuditRebindReceipt({
  check = false,
} = {}) {
  const [
    auditBinding,
    sourceSwf,
    sourceFla,
    candidateBinding,
    completionBefore,
    releaseLedgerBefore,
    receiptGeneratorBinding,
  ] = await Promise.all([
    readBinding(SOURCE_AUDIT),
    readBinding(SOURCE_SWF),
    readBinding(SOURCE_FLA),
    readBinding(CANDIDATE_REPORT),
    readBinding(COMPLETION_LEDGER),
    readBinding(LESSON_RELEASE_LEDGER),
    readBinding(path.relative(ROOT, scriptPath).split(path.sep).join("/")),
  ]);
  assertPinned(auditBinding, CURRENT_SOURCE_AUDIT,
    "current TS006 source audit");
  assertPinned(sourceSwf, SOURCE_IDENTITIES.swf, "TS006 source SWF");
  assertPinned(sourceFla, SOURCE_IDENTITIES.fla, "TS006 source FLA");
  const audit = JSON.parse(auditBinding.contents.toString("utf8"));
  const [materializerBinding, upstreamBinding, releaseBinding] =
    await Promise.all([
      readBinding(audit.provenance.materializer.path),
      readBinding(audit.provenance.upstreamMachineAudit.path),
      readBinding(audit.provenance.lessonReleaseManifest.path),
    ]);
  const currentProjection = validateCurrentAudit({
    audit,
    auditBinding,
    materializerBinding,
    upstreamBinding,
    releaseBinding,
    sourceSwf,
    sourceFla,
  });

  let receipt;
  if (candidateBinding.bytes === ARCHIVED_CANDIDATE_REPORT.bytes &&
    candidateBinding.sha256 === ARCHIVED_CANDIDATE_REPORT.sha256) {
    const archivedCandidate = JSON.parse(
      candidateBinding.contents.toString("utf8"),
    );
    const archivedGeneratorDescriptor = findGeneratorBinding(archivedCandidate);
    const archivedGeneratorBinding = await readBinding(
      archivedGeneratorDescriptor.path,
    );
    assertPinned(archivedGeneratorBinding, ARCHIVED_CANDIDATE_GENERATOR,
      "archived TS006 candidate generator");
    const archivedValidatorBody = extractValidatorBody(
      archivedGeneratorBinding.contents.toString("utf8"),
    );
    receipt = buildReceipt({
      archivedCandidate,
      archivedCandidateBinding: candidateBinding,
      archivedGeneratorBinding,
      archivedValidatorBody,
      audit,
      auditBinding,
      currentProjection,
      materializerBinding,
      upstreamBinding,
      releaseBinding,
      sourceSwf,
      sourceFla,
      receiptGeneratorBinding,
    });
  } else {
    const receiptBinding = await readBinding(OUTPUT_JSON);
    receipt = await validateCurrentReceipt({
      receiptBinding,
      auditBinding,
      sourceSwf,
      sourceFla,
    });
    const currentCandidate = JSON.parse(candidateBinding.contents.toString("utf8"));
    invariant(currentCandidate.animationId === ANIMATION_ID &&
      currentCandidate.evidenceBindings?.sourceAudit?.sha256 ===
        CURRENT_SOURCE_AUDIT.sha256 &&
      currentCandidate.evidenceBindings?.sourceAuditRebindReceipt?.sha256 ===
        receiptBinding.sha256,
    "current TS006 candidate does not bind the verified source-audit rebind receipt");
  }
  validateG4L3Ts006SourceAuditRebindReceipt(receipt, {
    currentAuditBinding: auditBinding,
    sourceSwfBinding: sourceSwf,
    sourceFlaBinding: sourceFla,
  });
  const jsonBytes = Buffer.from(stableJson(receipt));
  const markdownBytes = Buffer.from(renderMarkdown(receipt));
  await Promise.all([
    emit(OUTPUT_JSON, jsonBytes, check),
    emit(OUTPUT_MARKDOWN, markdownBytes, check),
  ]);

  const [completionAfter, releaseLedgerAfter, auditAfter, swfAfter, flaAfter] =
    await Promise.all([
      readBinding(COMPLETION_LEDGER),
      readBinding(LESSON_RELEASE_LEDGER),
      readBinding(SOURCE_AUDIT),
      readBinding(SOURCE_SWF),
      readBinding(SOURCE_FLA),
    ]);
  invariant(completionAfter.sha256 === completionBefore.sha256 &&
    releaseLedgerAfter.sha256 === releaseLedgerBefore.sha256,
  "TS006 source-audit rebind receipt changed a completion or release ledger");
  invariant(auditAfter.sha256 === auditBinding.sha256 &&
    swfAfter.sha256 === sourceSwf.sha256 &&
    flaAfter.sha256 === sourceFla.sha256,
  "TS006 source-audit rebind receipt changed source evidence");
  return {
    animationId: ANIMATION_ID,
    check,
    receipt: OUTPUT_JSON,
    oldSourceAuditSha256: OLD_SOURCE_AUDIT.sha256,
    currentSourceAuditSha256: CURRENT_SOURCE_AUDIT.sha256,
    semanticProjectionSha256: receipt.semanticProjection.currentSha256,
    fullHistoricalByteDiffPerformed: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

function help() {
  return "Usage: node scripts/build-g4-l3-ts006-source-audit-rebind-receipt.mjs [--check]\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await buildG4L3Ts006SourceAuditRebindReceipt(options),
  ));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
