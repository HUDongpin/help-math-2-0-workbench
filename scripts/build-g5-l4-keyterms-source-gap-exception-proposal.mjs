#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE = "scripts/build-g5-l4-keyterms-source-gap-exception-proposal.mjs";
const INPUTS = Object.freeze({
  recovery: "reports/g5-l4-missing-keyterm-recovery-readiness.json",
  ownerWorkAuthorization:
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
});
const OUTPUT_PREFIX = "reports/g5-l4-keyterms-source-gap-exception-proposal";
const MISSING_PATHS = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
]);
const STAGED_MASTER_PATHS = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
]);
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 KeyTerms exception proposal: ${message}`);
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJsonRecord(projectRoot, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    descriptor: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    document: JSON.parse(bytes),
  };
}

function validateRecovery(document) {
  invariant(
    document?.releaseId === "lesson-g05-l04-number-lines" &&
      document.reportType === "g5-l4-missing-keyterm-recovery-readiness",
    "missing-KeyTerms recovery report identity drifted",
  );
  const staticFinding = document.declaredVsShippedShellStaticDependency;
  const routing = staticFinding?.shippedShellStaticRouting;
  invariant(
    staticFinding?.declaredSourceGapStillOpen === true &&
      staticFinding?.sourceGapClosed === false &&
      staticFinding?.substitutionAuthorized === false &&
      staticFinding?.shippedShellStaticDirectTargetDependencyPresent === false,
    "declared-versus-shipped source-gap boundary drifted",
  );
  invariant(
    JSON.stringify(
      staticFinding.courseXmlDeclarations.declarations.map(({declaredPath}) => declaredPath),
    ) === JSON.stringify(MISSING_PATHS) &&
      staticFinding.courseXmlDeclarations.declarations.every(
        ({declarationCount}) => declarationCount === 1,
      ) &&
      staticFinding.courseXmlDeclarations.bothDeclaredTargetsPhysicallyMissing === true,
    "course XML declaration evidence drifted",
  );
  invariant(
    routing?.missingLessonLocalTargetReferenceCounts?.["L4KTE01.xml"] === 0 &&
      routing?.missingLessonLocalTargetReferenceCounts?.["L4KTS01.xml"] === 0 &&
      routing?.masterGlossaryReferenceCounts?.["ELKTEG4.xml"] === 2 &&
      routing?.masterGlossaryReferenceCounts?.["ELKTSG4.xml"] === 1 &&
      routing?.staticGradeWideMasterGlossaryRoutingPresent === true &&
      routing?.runtimeReachabilityProven === false &&
      routing?.runtimeLoadSuccessProven === false &&
      routing?.originalRuntimeAuthority === false &&
      HASH.test(routing?.ffdecScriptsSha256 || "") &&
      HASH.test(routing?.shellSourceSha256 || ""),
    "shipped-shell static routing evidence drifted",
  );
  const reference = document.authorizedCombinedElementaryKeytermsReference;
  invariant(
    reference?.direction?.referenceUseAuthorized === true &&
      reference?.direction?.scope === "combined-elementary-keyterms-product-reference-only" &&
      reference?.disposition?.missingLessonSourcesRecovered === false &&
      reference?.disposition?.runtimeLoadSuccessProven === false &&
      reference?.disposition?.sourceGapClosed === false &&
      reference?.disposition?.substitutionAuthorized === false &&
      reference?.linkedG5L4TermCoverage?.allLinkedTermsResolveExactlyOnce === true,
    "combined-reference authorization boundary drifted",
  );
  invariant(
    document.recoveryGate?.exactTargetCandidates === 0 &&
      document.recoveryGate?.recoveredTargets === 0 &&
      document.recoveryGate?.reviewedExceptionEstablished === false &&
      document.recoveryGate?.sourceGapClosed === false &&
      Object.values(document.acceptanceEffects || {}).every((value) => value === false),
    "recovery report improperly claims recovery or acceptance",
  );
  return {staticFinding, routing, reference};
}

function validateOwnerWorkAuthorization(document) {
  invariant(
    document?.evidenceType ===
      "g5-l4-user-stated-owner-continuation-and-prospective-approval-intake" &&
      document.releaseId === "lesson-g05-l04-number-lines" &&
      document.authorization?.validatorSupportedSourceGapExceptionPreparationAuthorized === true &&
      document.authorization?.lessonSpecificSubstitution === false &&
      document.authorization?.runtimeHostApproved === false &&
      document.authorization?.immutableSessionAuthorizationEstablished === false &&
      document.authorization?.runtimeExecutionAuthorized === false &&
      document.authorization?.ownerFidelityAcceptanceEstablished === false &&
      document.authorization?.strictCompletionEstablished === false &&
      document.authorization?.published === false,
    "Owner work authorization does not preserve the proposal-only boundary",
  );
}

export function validateG5L4KeytermsSourceGapExceptionProposal(report) {
  assertExactKeys(report, [
    "schemaVersion", "reportType", "releaseId", "status", "authority", "sourceBindings",
    "proposal", "admissionPrerequisites", "unsignedOwnerDecision", "acceptanceEffects",
    "publicationEffect", "strictAcceptanceEffect", "reportFingerprintSha256",
  ], "proposal report");
  assertExactKeys(report.sourceBindings, [
    "generator", "missingKeytermRecoveryReadiness", "ownerWorkAuthorization", "shippedShellSwf",
    "shippedShellFfdecScripts", "courseXml",
  ], "proposal source bindings");
  assertExactKeys(report.proposal, [
    "exceptionId", "animationId", "exactMissingDeclaredPaths",
    "gradeWideMastersRetainedUnderOriginalNames", "machineEvidence", "proposedDisposition",
  ], "proposal body");
  assertExactKeys(report.proposal.machineEvidence, [
    "courseXmlDeclarationCounts", "shippedShellStaticLiteralCounts",
    "exactMissingTargetCandidateCount", "recoveredTargetCount", "linkedG5L4TermCount",
    "linkedTermsResolveExactlyOnceInAuthorizedCombinedReference", "evidenceClass",
    "runtimeReachabilityProven", "runtimeLoadSuccessProven", "authoritativeOriginalRuntime",
  ], "proposal machine evidence");
  assertExactKeys(report.proposal.proposedDisposition, [
    "scope", "useGradeWideMastersOnlyUnderTheirOriginalBasenames",
    "renameOrSubstituteMissingLessonXml", "abortIfMissingLessonXmlIsRequested",
    "sourceGapRemainsRecorded", "runtimeObservationRequired", "ownerDecisionRequired",
    "migrationManifestChangeByThisProposal",
  ], "proposal disposition");
  assertExactKeys(report.unsignedOwnerDecision, [
    "decision", "reviewerFullName", "reviewedAt", "exactEvidencePacketSha256", "reason",
    "signatureEnvelope", "automationMayFillOrSign",
  ], "unsigned Owner decision");
  assertExactKeys(report.acceptanceEffects, [
    "missingSourcesRecovered", "lessonSpecificSubstitutionAuthorized", "sourceGapClosed",
    "authoritativeOriginalRuntime", "audioAccepted", "humanReviewAccepted",
    "ownerFidelityAccepted", "strictComplete", "published",
  ], "acceptance effects");
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l4-keyterms-source-gap-exception-proposal" &&
      report.releaseId === "lesson-g05-l04-number-lines" &&
      report.status === "unsigned-proposal-runtime-observation-and-owner-review-required",
    "proposal identity drifted",
  );
  invariant(
    report.proposal?.exceptionId === "shell-keyterms-declared-vs-shipped-static-dependency" &&
      report.proposal?.animationId === "shell-course-g05-l04-index-local" &&
      JSON.stringify(report.proposal?.exactMissingDeclaredPaths) === JSON.stringify(MISSING_PATHS) &&
      JSON.stringify(report.proposal?.gradeWideMastersRetainedUnderOriginalNames) ===
        JSON.stringify(STAGED_MASTER_PATHS),
    "proposal scope drifted",
  );
  invariant(
    report.proposal?.proposedDisposition?.renameOrSubstituteMissingLessonXml === false &&
      report.proposal?.proposedDisposition?.abortIfMissingLessonXmlIsRequested === true &&
      report.proposal?.proposedDisposition?.sourceGapRemainsRecorded === true &&
      report.proposal?.proposedDisposition?.runtimeObservationRequired === true &&
      report.proposal?.proposedDisposition?.ownerDecisionRequired === true,
    "proposal disposition drifted",
  );
  invariant(
    Array.isArray(report.admissionPrerequisites) && report.admissionPrerequisites.length === 4 &&
      report.admissionPrerequisites.every((item) => {
        assertExactKeys(item, ["id", "requirement", "satisfied"], "admission prerequisite");
        return item.satisfied === false;
      }) &&
      report.unsignedOwnerDecision?.decision === "pending" &&
      report.unsignedOwnerDecision?.reviewerFullName === "" &&
      report.unsignedOwnerDecision?.reviewedAt === null &&
      report.unsignedOwnerDecision?.signatureEnvelope === null,
    "proposal improperly claims prerequisite or Owner decision completion",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every((value) => value === false) &&
      report.strictAcceptanceEffect.startsWith("none;") &&
      report.publicationEffect === "none",
    "proposal improperly claims acceptance or publication",
  );
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(
    HASH.test(reportFingerprintSha256 || "") &&
      reportFingerprintSha256 === sha256(Buffer.from(stableJson(withoutFingerprint))),
    "proposal fingerprint drifted",
  );
  return report;
}

export async function buildG5L4KeytermsSourceGapExceptionProposal({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const [generatorBytes, recovery, ownerWorkAuthorization] = await Promise.all([
    readFile(path.join(projectRoot, SCRIPT_RELATIVE)),
    readJsonRecord(projectRoot, INPUTS.recovery),
    readJsonRecord(projectRoot, INPUTS.ownerWorkAuthorization),
  ]);
  const {staticFinding, routing, reference} = validateRecovery(recovery.document);
  validateOwnerWorkAuthorization(ownerWorkAuthorization.document);

  const base = {
    schemaVersion: 1,
    reportType: "g5-l4-keyterms-source-gap-exception-proposal",
    releaseId: "lesson-g05-l04-number-lines",
    status: "unsigned-proposal-runtime-observation-and-owner-review-required",
    authority:
      "Machine-prepared proposal only. It does not recover either missing XML, authorize a renamed substitute, establish runtime behavior, record an Owner decision, or change any fidelity, strict-completion, or publication gate.",
    sourceBindings: {
      generator: {
        path: SCRIPT_RELATIVE,
        bytes: generatorBytes.length,
        sha256: sha256(generatorBytes),
      },
      missingKeytermRecoveryReadiness: recovery.descriptor,
      ownerWorkAuthorization: ownerWorkAuthorization.descriptor,
      shippedShellSwf: {
        path: routing.shellSourcePath,
        bytes: routing.shellSourceBytes,
        sha256: routing.shellSourceSha256,
      },
      shippedShellFfdecScripts: {
        path: routing.ffdecScriptsPath,
        bytes: routing.ffdecScriptsBytes,
        sha256: routing.ffdecScriptsSha256,
      },
      courseXml: {
        path: staticFinding.courseXmlDeclarations.sourcePath,
        bytes: staticFinding.courseXmlDeclarations.sourceBytes,
        sha256: staticFinding.courseXmlDeclarations.sourceSha256,
      },
    },
    proposal: {
      exceptionId: "shell-keyterms-declared-vs-shipped-static-dependency",
      animationId: "shell-course-g05-l04-index-local",
      exactMissingDeclaredPaths: [...MISSING_PATHS],
      gradeWideMastersRetainedUnderOriginalNames: [...STAGED_MASTER_PATHS],
      machineEvidence: {
        courseXmlDeclarationCounts: {
          "L4KTE01.xml": 1,
          "L4KTS01.xml": 1,
        },
        shippedShellStaticLiteralCounts: {
          "L4KTE01.xml": 0,
          "L4KTS01.xml": 0,
          "ELKTEG4.xml": 2,
          "ELKTSG4.xml": 1,
        },
        exactMissingTargetCandidateCount: 0,
        recoveredTargetCount: 0,
        linkedG5L4TermCount: reference.linkedG5L4TermCoverage.uniqueLinkedTermCount,
        linkedTermsResolveExactlyOnceInAuthorizedCombinedReference:
          reference.linkedG5L4TermCoverage.allLinkedTermsResolveExactlyOnce,
        evidenceClass:
          "preserved-course-declaration-plus-hash-bound-shipped-shell-static-code-only",
        runtimeReachabilityProven: false,
        runtimeLoadSuccessProven: false,
        authoritativeOriginalRuntime: false,
      },
      proposedDisposition: {
        scope: "trace-scoped-original-runtime-candidate-and-current-js-product-reference-only",
        useGradeWideMastersOnlyUnderTheirOriginalBasenames: true,
        renameOrSubstituteMissingLessonXml: false,
        abortIfMissingLessonXmlIsRequested: true,
        sourceGapRemainsRecorded: true,
        runtimeObservationRequired: true,
        ownerDecisionRequired: true,
        migrationManifestChangeByThisProposal: false,
      },
    },
    admissionPrerequisites: [
      {
        id: "authorized-original-runtime-request-audit",
        requirement:
          "A hash-bound authorized EN/ES original-runtime session must show which KeyTerms paths are actually requested and must show zero requests for either missing lesson-local XML.",
        satisfied: false,
      },
      {
        id: "grade-wide-runtime-load-success",
        requirement:
          "The same session must demonstrate successful loading and intended use of ELKTEG4.xml and ELKTSG4.xml without unallowlisted or legacy endpoint requests.",
        satisfied: false,
      },
      {
        id: "validator-supported-exception-shape",
        requirement:
          "The strict validator and evidence schema must explicitly admit the exact bounded exception without weakening missing-frame, natural-trace, audio, review, or release gates.",
        satisfied: false,
      },
      {
        id: "owner-reviewed-exception-record",
        requirement:
          "The Owner must review the exact evidence packet and create a separate immutable accepted or rejected exception record.",
        satisfied: false,
      },
    ],
    unsignedOwnerDecision: {
      decision: "pending",
      reviewerFullName: "",
      reviewedAt: null,
      exactEvidencePacketSha256: null,
      reason: "",
      signatureEnvelope: null,
      automationMayFillOrSign: false,
    },
    acceptanceEffects: {
      missingSourcesRecovered: false,
      lessonSpecificSubstitutionAuthorized: false,
      sourceGapClosed: false,
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      published: false,
    },
    publicationEffect: "none",
    strictAcceptanceEffect:
      "none; this is an unsigned proposal whose runtime, validator, and Owner prerequisites are all still unsatisfied",
  };
  const report = {
    ...base,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(base))),
  };
  validateG5L4KeytermsSourceGapExceptionProposal(report);
  return report;
}

export function renderMarkdown(report) {
  validateG5L4KeytermsSourceGapExceptionProposal(report);
  return `# G5 L4 KeyTerms source-gap exception proposal\n\n`
    + `> ${report.authority}\n\n`
    + `Status: **${report.status}**.\n\n`
    + `The preserved course XML declares \`L4KTE01.xml\` and \`L4KTS01.xml\`, and both remain missing. `
    + `Hash-bound shipped-shell static code contains zero literal references to those names and instead contains `
    + `two \`ELKTEG4.xml\` and one \`ELKTSG4.xml\` references. That is static evidence only.\n\n`
    + `The proposed bounded disposition keeps the grade-wide masters under their original basenames, never renames `
    + `them as the missing lesson files, and aborts if either missing lesson XML is requested.\n\n`
    + `## Admission prerequisites\n\n`
    + report.admissionPrerequisites.map(({id, requirement, satisfied}) =>
      `- **${id}** — ${satisfied ? "satisfied" : "pending"}: ${requirement}`,
    ).join("\n")
    + `\n\nOwner decision: **pending**. Strict acceptance effect: **none**. Publication effect: **none**.\n`;
}

export async function writeG5L4KeytermsSourceGapExceptionProposal({
  projectRoot = DEFAULT_PROJECT_ROOT,
  check = false,
} = {}) {
  const report = await buildG5L4KeytermsSourceGapExceptionProposal({projectRoot});
  const jsonPath = path.join(projectRoot, `${OUTPUT_PREFIX}.json`);
  const markdownPath = path.join(projectRoot, `${OUTPUT_PREFIX}.md`);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderMarkdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readFile(jsonPath, "utf8"),
      readFile(markdownPath, "utf8"),
    ]);
    invariant(actualJson === expectedJson, `${OUTPUT_PREFIX}.json is stale`);
    invariant(actualMarkdown === expectedMarkdown, `${OUTPUT_PREFIX}.md is stale`);
    return {status: "current", reportFingerprintSha256: report.reportFingerprintSha256};
  }
  await Promise.all([
    writeFile(jsonPath, expectedJson),
    writeFile(markdownPath, expectedMarkdown),
  ]);
  return {status: "written", reportFingerprintSha256: report.reportFingerprintSha256};
}

function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/build-g5-l4-keyterms-source-gap-exception-proposal.mjs [--check]\n",
    );
    return;
  }
  process.stdout.write(`${stableJson(await writeG5L4KeytermsSourceGapExceptionProposal(options))}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
