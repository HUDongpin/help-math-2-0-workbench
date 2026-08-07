#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l5-original-runtime-containment-readiness.mjs";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const TITLE = "Add & Subtract Negative Numbers";
const DEFAULT_OUTPUT_PREFIX =
  "reports/g5-l5-original-runtime-containment-readiness";
const SHA256 = /^[a-f0-9]{64}$/;

const INPUT_PATHS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  sourceGapForensics: "reports/g5-l5-source-gap-forensics.json",
  runtimePlanningReadiness:
    "reports/g05-l05-add-subtract-negative-numbers-runtime-acquisition-planning-readiness.json",
  animateAuthoringOperatorReadiness:
    "reports/g5-l5-animate-authoring-operator-readiness.json",
});

const MISSING_KEYTERM_DEPENDENCIES = Object.freeze([
  {
    language: "english",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTE01.xml",
  },
  {
    language: "spanish",
    path: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTS01.xml",
  },
]);

const CONTROL_REQUIREMENTS = Object.freeze([
  [
    "CR-01",
    "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
  ],
  [
    "CR-02",
    "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
  ],
  [
    "CR-03",
    "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
  ],
  [
    "CR-04",
    "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
  ],
  [
    "CR-05",
    "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
  ],
  [
    "CR-06",
    "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
  ],
  [
    "CR-07",
    "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
  ],
  [
    "CR-08",
    "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
  ],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
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

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is empty`,
  );
  invariant(
    !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath),
    `${label}: path escapes the project root`,
  );
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

export async function readFileRecord(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveProjectPath(resolvedRoot, relativePath, label);
  const metadataBefore = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(resolvedRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const metadataAfter = await assertOrdinaryFile(absolutePath, label);
  invariant(
    metadataBefore.dev === metadataAfter.dev &&
      metadataBefore.ino === metadataAfter.ino &&
      metadataBefore.mtimeMs === metadataAfter.mtimeMs &&
      metadataAfter.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

async function readJsonRecord(projectRoot, relativePath, label) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function descriptor(record, extra = {}) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extra,
  };
}

function assertDescriptor(actual, expected, label) {
  invariant(
    actual?.path === expected.path &&
      actual?.bytes === expected.bytes &&
      actual?.sha256 === expected.sha256,
    `${label}: descriptor drifted`,
  );
}

function assertAllFalse(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function validateReleaseManifest(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "release manifest is malformed",
  );
  const matches = document.releases
    .map((release, index) => ({release, index}))
    .filter(({release}) => release?.releaseId === RELEASE_ID);
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const {release, index} = matches[0];
  invariant(
    release.titleDisplay === TITLE &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.releaseOrder === 3,
    `${RELEASE_ID}: release identity drifted`,
  );
  invariant(
    release.sourceLesson?.path === "HELP_COURSES/ELMGR5/L5/index.xml" &&
      release.sourceLesson.bytes === 11084 &&
      release.sourceLesson.sha256 ===
        "b6aef32a4be5684cccc7a4f105fe5ca92129c2292f19a71cf975f24bb133fa9e",
    `${RELEASE_ID}: source-lesson identity drifted`,
  );
  invariant(
    release.expectedCounts?.members === 57 &&
      release.expectedCounts.activeXmlReferencedPages === 56 &&
      release.expectedCounts.courseShells === 1 &&
      release.expectedCounts.shards === 3 &&
      Array.isArray(release.members) &&
      release.members.length === 57,
    `${RELEASE_ID}: release scope drifted`,
  );
  invariant(
    release.members.every((member, memberIndex) =>
      member.ordinal === memberIndex + 1) &&
      new Set(release.members.map(({animationId}) => animationId)).size === 57 &&
      new Set(release.members.map(({assetId}) => assetId)).size === 57,
    `${RELEASE_ID}: ordered member identity drifted`,
  );
  invariant(
    release.members.filter(
      ({releaseRole}) => releaseRole === "active-xml-referenced-page",
    ).length === 56 &&
      release.members.filter(({releaseRole}) => releaseRole === "course-shell")
        .length === 1,
    `${RELEASE_ID}: role partition drifted`,
  );
  const shell = release.members[56];
  invariant(
    shell.ordinal === 57 &&
      shell.animationId === "shell-course-g05-l05-index-local" &&
      shell.assetId ===
        "swf-5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66" &&
      shell.releaseRole === "course-shell" &&
      shell.source?.path === "HELP_COURSES/ELMGR5/L5/index_local.swf" &&
      shell.source.sha256 ===
        "5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66",
    `${RELEASE_ID}: shell identity drifted`,
  );
  return {release, index};
}

function validateSourceGap(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType === "lesson-release-source-gap-forensics" &&
      document.releaseId === RELEASE_ID &&
      document.evidenceState ===
        "static-source-forensics-only-runtime-and-content-gaps-fail-closed",
    "source-gap report identity drifted",
  );
  const declarations = document.keytermGap?.declarations;
  invariant(
    document.keytermGap?.status ===
      "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      Array.isArray(declarations) &&
      declarations.length === 2,
    "G5 L5 keyterm gap state drifted",
  );
  for (const expected of MISSING_KEYTERM_DEPENDENCIES) {
    const matches = declarations.filter(
      (declaration) =>
        declaration.language === expected.language &&
        declaration.path === expected.path,
    );
    invariant(
      matches.length === 1 &&
        matches[0].physicalPresence === false &&
        Array.isArray(matches[0].exactCatalogMatches) &&
        matches[0].exactCatalogMatches.length === 0 &&
        Array.isArray(matches[0].basenameCatalogMatches) &&
        matches[0].basenameCatalogMatches.length === 0,
      `${expected.path}: missing-dependency evidence drifted`,
    );
  }
  assertAllFalse(
    document.acceptanceEffects,
    [
      "authoritativeOriginalRuntime",
      "implementationAuthorized",
      "published",
      "releaseScopeChanged",
      "sourceGapClosed",
      "strictComplete",
    ],
    "source-gap acceptance boundary",
  );
  return declarations;
}

function validateRuntimePlanning(document, records) {
  invariant(
    document?.schemaVersion === 2 &&
      document.reportType === "release-runtime-acquisition-planning-readiness" &&
      document.identity?.releaseId === RELEASE_ID &&
      document.identity.titleDisplay === TITLE &&
      document.identity.grade === 5 &&
      document.identity.lesson === 5 &&
      document.identity.releaseType === "complete-lesson" &&
      document.identity.publicationMode === "atomic" &&
      document.identity.shardId === null,
    "runtime-planning report identity drifted",
  );
  invariant(
    document.scope?.releaseMemberCount === 57 &&
      document.scope.selectedMemberCount === 57 &&
      document.scope.exactReleaseScopeValidated === true &&
      document.scope.exactPhysicalSourceIdentityValidated === true &&
      document.scope.exactWorkspaceIdentityValidated === true &&
      document.scope.canonicalFilesModified === false &&
      JSON.stringify(document.scope.selectedOrdinals) ===
        JSON.stringify(Array.from({length: 57}, (_, index) => index + 1)),
    "runtime-planning scope drifted",
  );
  invariant(
    document.summary?.selectedMemberCount === 57 &&
      document.summary.emptyWorksheetCount === 57 &&
      document.summary.namedOperatorRoleAssignmentReceiptCount === 0 &&
      document.summary.plansWithNamedOperatorRoleAssignmentCount === 0 &&
      document.summary.runnableArtifactCount === 0 &&
      document.summary.runtimeSessionCount === 0 &&
      document.summary.authoritativeBaselineCount === 0 &&
      document.summary.sessionOperatorAttestationCount === 0 &&
      document.summary.acceptanceChangeCount === 0,
    "runtime-planning report was promoted",
  );
  invariant(
    document.gates?.machinePlanningArtifactsMaterialized === true &&
      document.gates.namedOperatorRoleAssignmentBound === false &&
      document.namedOperatorRoleAssignment === null,
    "runtime-planning operator boundary drifted",
  );
  assertAllFalse(
    document.gates,
    [
      "audioRuntimeListeningComplete",
      "authoritativeBaselinesComplete",
      "authorizedOriginalRuntimeBound",
      "implementationAuthorized",
      "naturalTraceSchedulesComplete",
      "operatorWeeklyCapacityEstablished",
      "portableOperatorIdentityVerified",
      "publicationAffected",
      "rootReachableDomainsResolved",
      "runtimeOperatorBound",
      "runtimeOperatorSessionAttested",
      "strictCompletionAffected",
    ],
    "runtime-planning gates",
  );
  invariant(
    document.provenance?.namedOperatorAssignmentReceipt === null,
    "runtime-planning report inherited an operator receipt",
  );
  assertDescriptor(
    document.provenance?.lessonReleaseCatalog,
    descriptor(records.releaseManifest),
    "runtime-planning release-manifest binding",
  );
}

function validateAnimateReadiness(document) {
  invariant(
    document?.schemaVersion === 2 &&
      document.reportType ===
        "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness" &&
      document.release?.releaseId === RELEASE_ID &&
      document.release.titleDisplay === TITLE &&
      document.release.grade === 5 &&
      document.release.lesson === 5 &&
      document.release.publicationMode === "atomic" &&
      document.release.shardId === null &&
      document.release.selectedMemberCount === 57 &&
      document.release.fullReleaseMemberCount === 57,
    "Animate operator-readiness identity drifted",
  );
  invariant(
    document.summary?.selectedMembers === 57 &&
      document.summary.flaBackedItems === 49 &&
      document.summary.swfOnlyItems === 8 &&
      document.summary.namedPrimaryOperatorRoleAssignmentsRecorded === 0 &&
      document.summary.actualSessionOperatorAttestationsRecorded === 0 &&
      document.summary.animateGuiExecutionsByThisBuilder === 0 &&
      document.summary.authoringAuditsEstablished === 0 &&
      document.summary.originalRuntimeBaselinesEstablished === 0 &&
      document.summary.humanVisualReviewsEstablished === 0 &&
      document.summary.ownerAcceptancesEstablished === 0 &&
      document.summary.strictAcceptancesEstablished === 0 &&
      document.summary.strictAcceptanceEffect === false,
    "Animate operator-readiness report was promoted",
  );
  invariant(
    document.inputs?.namedOperatorAssignmentReceipt === null &&
      document.operatorAssignment?.status === "not-supplied" &&
      document.operatorAssignment.slot === null &&
      document.operatorAssignment.assigneeFullName === null &&
      document.operatorAssignment.receipt === null &&
      Array.isArray(document.operatorAssignment.duties) &&
      document.operatorAssignment.duties.length === 0,
    "Animate operator-readiness report inherited an operator assignment",
  );
  assertAllFalse(
    document.operatorAssignment,
    [
      "cryptographicallyVerified",
      "weeklyCapacityEstablished",
      "hostApproved",
      "containmentApproved",
      "immutableSessionAuthorizationEstablished",
      "animateGuiExecutionAuthorized",
      "originalRuntimeExecutionAuthorized",
      "actualSessionOperatorAttestationPresent",
    ],
    "Animate operator assignment boundary",
  );
  invariant(
    document.processGate?.humanAssistedRunAllowedNow === false &&
      document.processGate.animateRunning === false,
    "Animate process gate was opened",
  );
  assertAllFalse(
    document.authorityBoundary,
    [
      "adobeAnimateAuthoringAudit",
      "originalRuntimeBehavior",
      "javascriptImplementationOrFidelity",
      "rmse",
      "audioListeningOrSynchronization",
      "humanVisualReview",
      "ownerAcceptance",
      "strictAcceptance",
      "migrationCompletion",
      "publication",
    ],
    "Animate acceptance boundary",
  );
}

function containmentControls() {
  return CONTROL_REQUIREMENTS.map(([controlId, requirement]) => ({
    controlId,
    requirement,
    mechanism: null,
    approved: false,
    verified: false,
  }));
}

export async function buildG5L5OriginalRuntimeContainmentReadiness({
  projectRoot: projectRootOption = defaultProjectRoot,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const records = {
    generator: await readFileRecord(projectRoot, GENERATOR_PATH, "generator"),
    releaseManifest: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.releaseManifest,
      "release manifest",
    ),
    sourceGapForensics: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.sourceGapForensics,
      "source-gap forensics",
    ),
    runtimePlanningReadiness: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.runtimePlanningReadiness,
      "runtime-planning readiness",
    ),
    animateAuthoringOperatorReadiness: await readJsonRecord(
      projectRoot,
      INPUT_PATHS.animateAuthoringOperatorReadiness,
      "Animate authoring operator readiness",
    ),
  };

  const {release, index} = validateReleaseManifest(
    records.releaseManifest.document,
  );
  const declarations = validateSourceGap(records.sourceGapForensics.document);
  validateRuntimePlanning(records.runtimePlanningReadiness.document, records);
  validateAnimateReadiness(records.animateAuthoringOperatorReadiness.document);

  const controls = containmentControls();
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-original-runtime-containment-readiness",
    releaseId: RELEASE_ID,
    evidenceState:
      "machine-only-containment-requirements-specified-host-tree-incomplete-no-operator",
    authority:
      "This deterministic report binds the exact 57-member G5 L5 atomic release and three current machine-only readiness reports. It imports no G5 L4 operator receipt, work-study scenario, authorization, execution, or passing state. It selects, approves, and verifies no containment mechanism; launches no GUI or runtime; establishes no original-runtime evidence; and changes no review, strict-completion, or publication gate.",
    generator: descriptor(records.generator),
    identity: {
      releaseId: RELEASE_ID,
      titleDisplay: TITLE,
      grade: 5,
      lesson: 5,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
    },
    scope: {
      releaseMemberCount: 57,
      activeXmlReferencedPageCount: 56,
      courseShellCount: 1,
      exactReleaseScopeBound: true,
      canonicalFilesModified: false,
    },
    sourceBindings: {
      releaseManifest: descriptor(records.releaseManifest, {
        schemaVersion: records.releaseManifest.document.schemaVersion,
        releaseJsonPointer: `/releases/${index}`,
      }),
      sourceGapForensics: descriptor(records.sourceGapForensics, {
        schemaVersion: records.sourceGapForensics.document.schemaVersion,
        reportType: records.sourceGapForensics.document.reportType,
      }),
      runtimePlanningReadiness: descriptor(records.runtimePlanningReadiness, {
        schemaVersion: records.runtimePlanningReadiness.document.schemaVersion,
        reportType: records.runtimePlanningReadiness.document.reportType,
      }),
      animateAuthoringOperatorReadiness: descriptor(
        records.animateAuthoringOperatorReadiness,
        {
          schemaVersion:
            records.animateAuthoringOperatorReadiness.document.schemaVersion,
          reportType:
            records.animateAuthoringOperatorReadiness.document.reportType,
        },
      ),
      operatorAssignmentReceipt: null,
      workStudyScenarioInventories: [],
    },
    hostTreeReadiness: {
      state: "incomplete-missing-declared-keyterm-dependencies",
      complete: false,
      partialCandidateOnly: true,
      readOnlyHostTreeMaterialized: false,
      cr02TechnicalArtifactComplete: false,
      cr02Approved: false,
      missingDeclaredDependencies: declarations.map((declaration) => ({
        language: declaration.language,
        path: declaration.path,
        physicalPresence: false,
        exactCatalogMatchCount: 0,
        basenameCatalogMatchCount: 0,
      })),
      inventedOrSubstitutedDependencyCount: 0,
      requiredDisposition:
        records.sourceGapForensics.document.keytermGap.requiredDisposition,
    },
    operatorBoundary: {
      namedOperatorCount: 0,
      namedOperatorRoleAssignment: null,
      operatorAssignmentReceipt: null,
      sessionOperatorAttestationCount: 0,
      weeklyCapacityEstablished: false,
      runtimeHostApproved: false,
      containmentApproved: false,
      immutableSessionAuthorizationEstablished: false,
      animateGuiExecutionAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
    },
    containmentPlan: {
      state: "requirements-specified-controls-unselected-unapproved-unverified",
      controls,
      controlsSpecified: 8,
      mechanismsSelected: 0,
      controlsApproved: 0,
      controlsVerified: 0,
      allowedOutboundDestinations: [],
      legacyEndpointAllowlist: [],
      runtimeProfilePath: null,
      readOnlyLessonTreePath: null,
      launchPath: null,
      launchCommand: null,
      exactHostIdentifier: null,
      stopConditions: [],
      ownerExecutionAuthorization: null,
    },
    executionGate: {
      state:
        "closed-host-tree-incomplete-no-operator-no-containment-authorization",
      runnable: false,
      machineOnlyPreparation: true,
      exactReleaseScopeBound: true,
      sourceGapBound: true,
      runtimePlanningBound: true,
      animateOperatorReadinessBound: true,
      hostTreeComplete: false,
      containmentMechanismsSelected: false,
      containmentControlsApproved: false,
      containmentControlsVerified: false,
      namedOperatorBound: false,
      authorizedHostContextIdentified: false,
      immutableSessionAuthorizationBound: false,
      ownerRuntimeApprovalBound: false,
      launchesGuiByThisBuilder: false,
      launchesRuntimeByThisBuilder: false,
      executesLegacyEndpointsByThisBuilder: false,
      originalRuntimeExecutionReady: false,
      runtimeSessionCount: 0,
    },
    strictCompletion: {
      completeMembers: 0,
      expectedMembers: 57,
      fraction: "0/57",
      complete: false,
    },
    publication: {
      published: false,
      publicationCount: 0,
      atomicReleaseEligible: false,
    },
    summary: {
      releaseMemberCount: release.members.length,
      missingDeclaredDependencyCount: 2,
      completeReadOnlyHostTreeCount: 0,
      namedOperatorCount: 0,
      sessionOperatorAttestationCount: 0,
      containmentControlsSpecified: 8,
      containmentMechanismsSelected: 0,
      containmentControlsApproved: 0,
      containmentControlsVerified: 0,
      runnableArtifactCount: 0,
      guiSessionsExecuted: 0,
      animateGuiExecutions: 0,
      originalRuntimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      acceptedAudioListeningSessions: 0,
      humanReviewsAccepted: 0,
      ownerFidelityAcceptances: 0,
      strictCompletions: 0,
      strictExpectedMembers: 57,
      publications: 0,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      ownerFidelityAccepted: false,
      published: false,
      rendererSelected: false,
      rmseAccepted: false,
      strictComplete: false,
    },
    strictAcceptanceEffect:
      "none; G5 L5 remains 0/57 strict and unpublished because the host tree is incomplete, no named operator or session is bound, and all containment mechanisms remain unselected, unapproved, and unverified",
  };

  report.reportFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(report)),
  );
  validateG5L5OriginalRuntimeContainmentReadiness(report);
  return report;
}

export function validateG5L5OriginalRuntimeContainmentReadiness(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-original-runtime-containment-readiness" &&
      report.releaseId === RELEASE_ID &&
      report.evidenceState ===
        "machine-only-containment-requirements-specified-host-tree-incomplete-no-operator",
    "containment report identity drifted",
  );
  invariant(
    report.identity?.releaseId === RELEASE_ID &&
      report.identity.titleDisplay === TITLE &&
      report.identity.grade === 5 &&
      report.identity.lesson === 5 &&
      report.identity.releaseType === "complete-lesson" &&
      report.identity.publicationMode === "atomic",
    "containment release identity drifted",
  );
  invariant(
    report.scope?.releaseMemberCount === 57 &&
      report.scope.activeXmlReferencedPageCount === 56 &&
      report.scope.courseShellCount === 1 &&
      report.scope.exactReleaseScopeBound === true &&
      report.scope.canonicalFilesModified === false,
    "containment release scope drifted",
  );
  invariant(
    report.generator?.path === GENERATOR_PATH &&
      Number.isInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      SHA256.test(report.generator.sha256 || ""),
    "containment generator binding drifted",
  );
  const bindings = report.sourceBindings;
  invariant(
    bindings?.releaseManifest?.path === INPUT_PATHS.releaseManifest &&
      bindings.releaseManifest.releaseJsonPointer === "/releases/2" &&
      bindings.sourceGapForensics?.path === INPUT_PATHS.sourceGapForensics &&
      bindings.runtimePlanningReadiness?.path ===
        INPUT_PATHS.runtimePlanningReadiness &&
      bindings.animateAuthoringOperatorReadiness?.path ===
        INPUT_PATHS.animateAuthoringOperatorReadiness &&
      bindings.operatorAssignmentReceipt === null &&
      Array.isArray(bindings.workStudyScenarioInventories) &&
      bindings.workStudyScenarioInventories.length === 0 &&
      [
        bindings.releaseManifest,
        bindings.sourceGapForensics,
        bindings.runtimePlanningReadiness,
        bindings.animateAuthoringOperatorReadiness,
      ].every((binding) =>
        Number.isInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256.test(binding.sha256 || "")),
    "containment input bindings drifted",
  );
  const host = report.hostTreeReadiness;
  invariant(
    host?.state === "incomplete-missing-declared-keyterm-dependencies" &&
      host.complete === false &&
      host.partialCandidateOnly === true &&
      host.readOnlyHostTreeMaterialized === false &&
      host.cr02TechnicalArtifactComplete === false &&
      host.cr02Approved === false &&
      host.inventedOrSubstitutedDependencyCount === 0,
    "host tree was completed or promoted",
  );
  invariant(
    Array.isArray(host.missingDeclaredDependencies) &&
      host.missingDeclaredDependencies.length === 2 &&
      host.missingDeclaredDependencies.every((dependency, index) =>
        dependency.language ===
          MISSING_KEYTERM_DEPENDENCIES[index].language &&
        dependency.path === MISSING_KEYTERM_DEPENDENCIES[index].path &&
        dependency.physicalPresence === false &&
        dependency.exactCatalogMatchCount === 0 &&
        dependency.basenameCatalogMatchCount === 0),
    "L5KTE01.xml/L5KTS01.xml missing-dependency boundary drifted",
  );
  invariant(
    report.operatorBoundary?.namedOperatorCount === 0 &&
      report.operatorBoundary.namedOperatorRoleAssignment === null &&
      report.operatorBoundary.operatorAssignmentReceipt === null &&
      report.operatorBoundary.sessionOperatorAttestationCount === 0,
    "operator identity or receipt was inherited",
  );
  assertAllFalse(
    report.operatorBoundary,
    [
      "weeklyCapacityEstablished",
      "runtimeHostApproved",
      "containmentApproved",
      "immutableSessionAuthorizationEstablished",
      "animateGuiExecutionAuthorized",
      "originalRuntimeExecutionAuthorized",
    ],
    "operator execution boundary",
  );
  const controls = report.containmentPlan?.controls;
  invariant(
    report.containmentPlan?.state ===
        "requirements-specified-controls-unselected-unapproved-unverified" &&
      Array.isArray(controls) &&
      controls.length === 8 &&
      controls.every((control, index) =>
        control.controlId === `CR-${String(index + 1).padStart(2, "0")}` &&
        control.requirement === CONTROL_REQUIREMENTS[index][1] &&
        control.mechanism === null &&
        control.approved === false &&
        control.verified === false) &&
      report.containmentPlan.controlsSpecified === 8 &&
      report.containmentPlan.mechanismsSelected === 0 &&
      report.containmentPlan.controlsApproved === 0 &&
      report.containmentPlan.controlsVerified === 0 &&
      report.containmentPlan.allowedOutboundDestinations?.length === 0 &&
      report.containmentPlan.legacyEndpointAllowlist?.length === 0 &&
      report.containmentPlan.runtimeProfilePath === null &&
      report.containmentPlan.readOnlyLessonTreePath === null &&
      report.containmentPlan.launchPath === null &&
      report.containmentPlan.launchCommand === null &&
      report.containmentPlan.exactHostIdentifier === null &&
      report.containmentPlan.stopConditions?.length === 0 &&
      report.containmentPlan.ownerExecutionAuthorization === null,
    "containment mechanism was selected, approved, or verified",
  );
  const gate = report.executionGate;
  invariant(
    gate?.state ===
        "closed-host-tree-incomplete-no-operator-no-containment-authorization" &&
      gate.runnable === false &&
      gate.machineOnlyPreparation === true &&
      gate.exactReleaseScopeBound === true &&
      gate.sourceGapBound === true &&
      gate.runtimePlanningBound === true &&
      gate.animateOperatorReadinessBound === true &&
      gate.runtimeSessionCount === 0,
    "execution gate identity drifted",
  );
  assertAllFalse(
    gate,
    [
      "hostTreeComplete",
      "containmentMechanismsSelected",
      "containmentControlsApproved",
      "containmentControlsVerified",
      "namedOperatorBound",
      "authorizedHostContextIdentified",
      "immutableSessionAuthorizationBound",
      "ownerRuntimeApprovalBound",
      "launchesGuiByThisBuilder",
      "launchesRuntimeByThisBuilder",
      "executesLegacyEndpointsByThisBuilder",
      "originalRuntimeExecutionReady",
    ],
    "execution gate",
  );
  invariant(
    report.strictCompletion?.completeMembers === 0 &&
      report.strictCompletion.expectedMembers === 57 &&
      report.strictCompletion.fraction === "0/57" &&
      report.strictCompletion.complete === false,
    "strict-completion state was promoted",
  );
  invariant(
    report.publication?.published === false &&
      report.publication.publicationCount === 0 &&
      report.publication.atomicReleaseEligible === false,
    "publication state was promoted",
  );
  const zeroSummaryKeys = [
    "completeReadOnlyHostTreeCount",
    "namedOperatorCount",
    "sessionOperatorAttestationCount",
    "containmentMechanismsSelected",
    "containmentControlsApproved",
    "containmentControlsVerified",
    "runnableArtifactCount",
    "guiSessionsExecuted",
    "animateGuiExecutions",
    "originalRuntimeSessionsExecuted",
    "authoritativeBaselinePackagesEstablished",
    "acceptedAudioListeningSessions",
    "humanReviewsAccepted",
    "ownerFidelityAcceptances",
    "strictCompletions",
    "publications",
  ];
  invariant(
    report.summary?.releaseMemberCount === 57 &&
      report.summary.missingDeclaredDependencyCount === 2 &&
      report.summary.containmentControlsSpecified === 8 &&
      report.summary.strictExpectedMembers === 57 &&
      zeroSummaryKeys.every((key) => report.summary[key] === 0),
    "containment summary was promoted",
  );
  invariant(
    Object.values(report.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "containment report changed an acceptance gate",
  );
  invariant(
    typeof report.strictAcceptanceEffect === "string" &&
      report.strictAcceptanceEffect.startsWith("none;"),
    "containment report claims strict acceptance",
  );
  const fingerprint = report.reportFingerprintSha256;
  invariant(
    SHA256.test(fingerprint || ""),
    "containment report fingerprint is missing",
  );
  const copy = {...report};
  delete copy.reportFingerprintSha256;
  invariant(
    fingerprint === sha256Bytes(Buffer.from(stableJson(copy))),
    "containment report fingerprint drifted",
  );
  return report;
}

export function renderMarkdown(report) {
  validateG5L5OriginalRuntimeContainmentReadiness(report);
  const controls = report.containmentPlan.controls
    .map((control) =>
      `| ${control.controlId} | ${control.requirement} | not selected | no | no |`)
    .join("\n");
  return `# G5 L5 Original-Runtime Containment Readiness

Release: \`${report.releaseId}\` — **${TITLE}**  
State: **fail-closed; host tree incomplete; no named operator; not runnable**

This report binds the exact 56-page + Shell atomic release and the current G5 L5
source-gap, runtime-planning, and Animate operator-readiness reports. It imports
no G5 L4 operator receipt, work-study scenario, authorization, execution, or pass.

## Exact release and source boundary

- Members: **57** (56 active XML pages + 1 Shell)
- Missing: \`HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTE01.xml\`
- Missing: \`HELP_KEYTERMS/KT/ELEMENTARY/XML/L5KTS01.xml\`
- Host tree complete / materialized: **false / false**
- Invented or substituted dependencies: **0**

## Operator and runtime boundary

- Named operators: **0**
- Operator assignment receipt: **none**
- Session operator attestations: **0**
- Runtime sessions: **0**
- Runnable: **false**

## Containment requirements

| Control | Requirement | Mechanism | Approved | Verified |
| --- | --- | --- | --- | --- |
${controls}

Result: **8 specified / 0 selected / 0 approved / 0 verified**.

## Strict and publication boundary

- Strict completion: **0/57**
- Published: **false**
- Authoritative baselines / accepted audio sessions: **0 / 0**
- Human reviews / Owner fidelity acceptances: **0 / 0**

Strict acceptance effect: **none**. The incomplete host tree, absent named
operator/session authority, and unselected controls keep original-runtime
execution, strict completion, and atomic publication closed.
`;
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      outputPrefix !== "reports/" &&
      !outputPrefix.includes("\\") &&
      !path.posix.isAbsolute(outputPrefix) &&
      path.posix.normalize(outputPrefix) === outputPrefix &&
      path.posix.extname(outputPrefix) === "",
    "--output-prefix must be a normalized extensionless path below reports/",
  );
  return {
    json: resolveProjectPath(projectRoot, `${outputPrefix}.json`, "JSON output"),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function ensureSafeOutputDirectory(projectRoot, directory, create) {
  invariant(isWithin(projectRoot, directory), "output directory escapes project root");
  const relative = path.relative(projectRoot, directory);
  let cursor = projectRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    let metadata = await lstat(cursor).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata && create) {
      await mkdir(cursor);
      metadata = await lstat(cursor);
    }
    invariant(
      metadata?.isDirectory() && !metadata.isSymbolicLink(),
      `${portable(path.relative(projectRoot, cursor))}: output ancestor must be an ordinary directory`,
    );
  }
  const [realRoot, realDirectory] = await Promise.all([
    realpath(projectRoot),
    realpath(directory),
  ]);
  invariant(
    isWithin(realRoot, realDirectory),
    "output directory resolves outside project root",
  );
}

async function existingOutput(file, projectRoot) {
  const metadata = await lstat(file).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return null;
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${portable(path.relative(projectRoot, file))}: output target must be one ordinary non-linked file`,
  );
  const contents = await readFile(file);
  const after = await assertOrdinaryFile(
    file,
    `${portable(path.relative(projectRoot, file))} output target`,
  );
  invariant(
    metadata.dev === after.dev &&
      metadata.ino === after.ino &&
      metadata.mtimeMs === after.mtimeMs &&
      contents.length === after.size,
    `${portable(path.relative(projectRoot, file))}: output changed during read`,
  );
  return {
    dev: after.dev,
    ino: after.ino,
    mtimeMs: after.mtimeMs,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    contents,
  };
}

async function unlinkExpected(file, expectedSha256, projectRoot) {
  const state = await existingOutput(file, projectRoot);
  if (!state) return;
  invariant(
    state.sha256 === expectedSha256,
    `${portable(path.relative(projectRoot, file))}: refusing to remove an unowned file`,
  );
  await unlink(file);
}

export async function writeOrCheck({
  report,
  projectRoot: projectRootOption = defaultProjectRoot,
  outputPrefix = DEFAULT_OUTPUT_PREFIX,
  check = false,
  transactionHook = null,
} = {}) {
  validateG5L5OriginalRuntimeContainmentReadiness(report);
  const projectRoot = path.resolve(projectRootOption);
  const outputs = outputPaths(projectRoot, outputPrefix);
  await ensureSafeOutputDirectory(
    projectRoot,
    path.dirname(outputs.json),
    !check,
  );
  const expected = {
    json: stableJson(report),
    markdown: renderMarkdown(report),
  };
  if (check) {
    const [json, markdown] = await Promise.all([
      readFileRecord(
        projectRoot,
        portable(path.relative(projectRoot, outputs.json)),
        "containment JSON output",
      ),
      readFileRecord(
        projectRoot,
        portable(path.relative(projectRoot, outputs.markdown)),
        "containment Markdown output",
      ),
    ]);
    invariant(
      json.contents.toString("utf8") === expected.json,
      "containment JSON output is stale",
    );
    invariant(
      markdown.contents.toString("utf8") === expected.markdown,
      "containment Markdown output is stale",
    );
    return {
      action: "verified",
      outputs: [descriptor(json), descriptor(markdown)],
    };
  }

  const transactionId = randomUUID();
  const entries = [
    {file: outputs.json, contents: expected.json},
    {file: outputs.markdown, contents: expected.markdown},
  ].map((entry) => ({
    ...entry,
    temporary: `${entry.file}.tmp-${transactionId}`,
    backup: `${entry.file}.bak-${transactionId}`,
    expectedSha256: sha256Bytes(Buffer.from(entry.contents)),
  }));
  const prepared = [];
  let installed = 0;
  try {
    for (const entry of entries) {
      invariant(
        await existingOutput(entry.temporary, projectRoot) === null,
        "transaction temporary path already exists",
      );
      invariant(
        await existingOutput(entry.backup, projectRoot) === null,
        "transaction backup path already exists",
      );
      entry.prior = await existingOutput(entry.file, projectRoot);
      await writeFile(entry.temporary, entry.contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
      prepared.push(entry);
    }
    for (const entry of entries) {
      if (entry.prior) await rename(entry.file, entry.backup);
    }
    for (const [index, entry] of entries.entries()) {
      if (transactionHook) {
        await transactionHook({
          phase: "before-install",
          index,
          target: portable(path.relative(projectRoot, entry.file)),
        });
      }
      await rename(entry.temporary, entry.file);
      installed += 1;
    }
    for (const entry of entries) {
      const current = await existingOutput(entry.file, projectRoot);
      invariant(
        current?.sha256 === entry.expectedSha256,
        "post-write verification failed",
      );
    }
    for (const entry of entries) {
      if (entry.prior) {
        await unlinkExpected(entry.backup, entry.prior.sha256, projectRoot);
      }
    }
  } catch (error) {
    let rollbackError = null;
    try {
      for (let index = installed - 1; index >= 0; index -= 1) {
        const entry = entries[index];
        await unlinkExpected(entry.file, entry.expectedSha256, projectRoot);
      }
      for (const entry of [...entries].reverse()) {
        const backup = await existingOutput(entry.backup, projectRoot);
        if (backup) {
          invariant(
            entry.prior && backup.sha256 === entry.prior.sha256,
            "rollback backup drifted",
          );
          await rename(entry.backup, entry.file);
        }
      }
      for (const entry of prepared) {
        await unlinkExpected(entry.temporary, entry.expectedSha256, projectRoot);
      }
    } catch (caught) {
      rollbackError = caught;
    }
    if (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "containment report transaction failed and rollback did not complete",
      );
    }
    throw error;
  }

  const [json, markdown] = await Promise.all([
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.json)),
      "containment JSON output",
    ),
    readFileRecord(
      projectRoot,
      portable(path.relative(projectRoot, outputs.markdown)),
      "containment Markdown output",
    ),
  ]);
  return {
    action: "written",
    outputs: [descriptor(json), descriptor(markdown)],
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--output-prefix") {
      const value = argv[index + 1];
      invariant(
        value && !value.startsWith("--"),
        "--output-prefix requires a value",
      );
      options.outputPrefix = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l5-original-runtime-containment-readiness.mjs [options]

Options:
  --check                    Verify JSON and Markdown without writing
  --output-prefix <path>     Extensionless project-relative prefix below reports/
  --help                     Show this help

The command writes only a fail-closed G5 L5 containment-readiness pair. It
imports no G5 L4 operator or scenario evidence, launches no GUI/runtime, selects
or approves no mechanism, and changes no acceptance or publication gate.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const report = await buildG5L5OriginalRuntimeContainmentReadiness();
    const result = await writeOrCheck({report, ...options});
    process.stdout.write(`${JSON.stringify({
      action: result.action,
      releaseId: RELEASE_ID,
      releaseMembers: report.scope.releaseMemberCount,
      namedOperators: report.summary.namedOperatorCount,
      runtimeSessions: report.summary.originalRuntimeSessionsExecuted,
      runnable: report.executionGate.runnable,
      strictCompletion: report.strictCompletion.fraction,
      published: report.publication.published,
      controls: {
        specified: report.containmentPlan.controlsSpecified,
        selected: report.containmentPlan.mechanismsSelected,
        approved: report.containmentPlan.controlsApproved,
        verified: report.containmentPlan.controlsVerified,
      },
      outputs: result.outputs,
    }, null, 2)}\n`);
  }
}
