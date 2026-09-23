#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, realpath, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultReleaseManifest = "catalog/lesson-releases.json";
const defaultCalibrationSets = "catalog/lesson-release-calibration-sets.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function lessonEvidencePrefix(release) {
  invariant(Number.isSafeInteger(release?.grade) && release.grade > 0, `${release?.releaseId ?? "release"}: grade is invalid`);
  invariant(Number.isSafeInteger(release?.lesson) && release.lesson > 0, `${release?.releaseId ?? "release"}: lesson is invalid`);
  return `g${release.grade}-l${release.lesson}`;
}

function defaultReleaseEvidencePaths(release) {
  const prefix = lessonEvidencePrefix(release);
  return {
    sourceScopePath: `reports/${prefix}-source-scope-freeze.json`,
    workspaceReadinessPath: `reports/${prefix}-workspace-readiness.json`,
    scopeBindingBasename: `${prefix}-source-scope-binding.json`,
  };
}

function resolveProjectPath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = portable(path.relative(projectRoot, resolved));
  invariant(relative && !relative.startsWith("../") && relative !== "..", `${label} escapes the project root`);
  invariant(relative === relativePath, `${label} must be normalized as ${relative}`);
  return resolved;
}

async function assertOrdinaryFile(absolutePath, label, {allowCompatibilitySymlink = false} = {}) {
  const metadata = await lstat(absolutePath);
  if (!allowCompatibilitySymlink) {
    invariant(!metadata.isSymbolicLink(), `${label} must not be a symbolic link`);
    invariant(metadata.isFile(), `${label} must be an ordinary file`);
    invariant(metadata.nlink === 1, `${label} must not be hard-linked`);
  } else {
    const resolved = await realpath(absolutePath);
    const resolvedMetadata = await lstat(resolved);
    invariant(resolvedMetadata.isFile(), `${label} must resolve to an ordinary file`);
  }
}

async function fileBinding(relativePath, label = "binding") {
  const absolutePath = resolveProjectPath(relativePath, label);
  await assertOrdinaryFile(absolutePath, label);
  const bytes = await readFile(absolutePath);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function jsonBinding(relativePath, label = "JSON binding") {
  const binding = await fileBinding(relativePath, label);
  return {...binding, value: JSON.parse(await readFile(resolveProjectPath(relativePath, label), "utf8"))};
}

async function sourceBinding(relativePath, expectedSha256) {
  const absolutePath = resolveProjectPath(relativePath, "source SWF");
  await assertOrdinaryFile(absolutePath, "source SWF", {allowCompatibilitySymlink: true});
  const bytes = await readFile(absolutePath);
  const observedSha256 = sha256(bytes);
  invariant(observedSha256 === expectedSha256, `${relativePath}: source SWF SHA-256 drifted`);
  return {path: relativePath, bytes: bytes.length, sha256: observedSha256};
}

export function selectRelease(manifest, releaseId) {
  invariant(isObject(manifest) && manifest.schemaVersion === 1 && Array.isArray(manifest.releases), "Lesson release manifest is malformed");
  const matches = manifest.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, `Expected exactly one release ${releaseId}, found ${matches.length}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: publicationMode must be atomic`);
  invariant(Number.isSafeInteger(release.expectedCounts?.members) && release.expectedCounts.members > 0, `${releaseId}: invalid expected member count`);
  invariant(Array.isArray(release.members) && release.members.length === release.expectedCounts.members, `${releaseId}: release membership is incomplete`);
  invariant(release.members.every((member, index) => member.ordinal === index + 1), `${releaseId}: member ordinals are not contiguous`);
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === release.members.length, `${releaseId}: duplicate animationId`);
  return release;
}

export function selectCalibrationSet(config, release) {
  invariant(isObject(config) && config.schemaVersion === 1 && Array.isArray(config.calibrationSets), "Calibration-set catalog is malformed");
  const matches = config.calibrationSets.filter((entry) => entry?.releaseId === release.releaseId);
  invariant(matches.length === 1, `Expected exactly one calibration set for ${release.releaseId}, found ${matches.length}`);
  const selected = matches[0];
  invariant(Array.isArray(selected.members) && selected.members.length > 0, `${release.releaseId}: calibration members are empty`);
  const memberIds = selected.members.map(({animationId}) => animationId);
  invariant(memberIds.every((id) => typeof id === "string" && id.length > 0), `${release.releaseId}: invalid calibration animationId`);
  invariant(new Set(memberIds).size === memberIds.length, `${release.releaseId}: duplicate calibration animationId`);
  const releaseIds = new Set(release.members.map(({animationId}) => animationId));
  invariant(memberIds.every((id) => releaseIds.has(id)), `${release.releaseId}: calibration set contains a nonmember`);
  for (const member of selected.members) {
    invariant(Array.isArray(member.intendedAxes) && member.intendedAxes.length > 0, `${member.animationId}: intended axes are missing`);
    invariant(new Set(member.intendedAxes).size === member.intendedAxes.length, `${member.animationId}: duplicate intended axis`);
  }
  const workStudyIds = selected.humanWorkStudy?.memberAnimationIds;
  invariant(Array.isArray(workStudyIds) && workStudyIds.length > 0, `${release.releaseId}: human work-study set is missing`);
  invariant(new Set(workStudyIds).size === workStudyIds.length, `${release.releaseId}: duplicate work-study member`);
  invariant(workStudyIds.every((id) => memberIds.includes(id)), `${release.releaseId}: work-study member is outside the calibration set`);
  invariant(Array.isArray(selected.humanWorkStudy.requiredPhases) && selected.humanWorkStudy.requiredPhases.length > 0, `${release.releaseId}: work-study phases are missing`);
  invariant(typeof selected.humanWorkStudy.measurementRule === "string" && selected.humanWorkStudy.measurementRule.length > 0, `${release.releaseId}: work-study rule is missing`);
  return selected;
}

function countMapValues(value) {
  if (!isObject(value)) return 0;
  return Object.values(value).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);
}

function tagCount(tags, ...names) {
  return names.reduce((sum, name) => sum + (Number.isFinite(tags?.[name]) ? tags[name] : 0), 0);
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function validateMachineEvidenceIdentity({member, machineReport, frameDomains}) {
  invariant(machineReport.animationId === member.animationId, `${member.animationId}: machine report identity drifted`);
  invariant(frameDomains.animationId === member.animationId, `${member.animationId}: frame-domain identity drifted`);
  invariant(machineReport.source?.expectedSha256 === member.source.sha256, `${member.animationId}: machine report source hash drifted`);
  invariant(frameDomains.source?.sha256 === member.source.sha256, `${member.animationId}: frame-domain source hash drifted`);
  invariant(machineReport.source?.hashMatches === true, `${member.animationId}: source machine rehash did not pass`);
  invariant(machineReport.migrationStatusUnchanged === true, `${member.animationId}: machine audit changed migration status`);
  invariant(frameDomains.root?.timelineId === "root" && Number.isSafeInteger(frameDomains.root.frameCount), `${member.animationId}: root frame domain is invalid`);
  invariant(Array.isArray(frameDomains.nestedDefinitions), `${member.animationId}: nested definitions are missing`);
  invariant(frameDomains.summary?.completeRootReachableDomainInventory === false, `${member.animationId}: static candidates unexpectedly claim complete runtime reachability`);
  invariant(frameDomains.acceptanceEffects?.strictComplete === false && frameDomains.acceptanceEffects?.published === false, `${member.animationId}: machine frame-domain artifact promotes acceptance`);
}

export function validateReleaseEvidenceDocuments({release, sourceScope, workspaceReadiness}) {
  const defaults = defaultReleaseEvidencePaths(release);
  invariant(sourceScope?.schemaVersion === 1, `${release.releaseId}: source-scope schema drifted`);
  invariant(sourceScope.releaseId === release.releaseId, `${release.releaseId}: source scope belongs to another release`);
  invariant(sourceScope.summary?.memberCount === release.expectedCounts.members, `${release.releaseId}: source-scope member count drifted`);
  invariant(sourceScope.summary?.strictCompleteCount === 0 && sourceScope.summary?.publishedCount === 0, `${release.releaseId}: source scope cannot promote acceptance`);
  invariant(Array.isArray(sourceScope.members) && sourceScope.members.length === release.expectedCounts.members, `${release.releaseId}: source-scope members are incomplete`);
  invariant(workspaceReadiness?.schemaVersion === 1, `${release.releaseId}: workspace-readiness schema drifted`);
  invariant(workspaceReadiness.releaseId === release.releaseId, `${release.releaseId}: workspace readiness belongs to another release`);
  invariant(workspaceReadiness.summary?.expectedWorkspaceCount === release.expectedCounts.members, `${release.releaseId}: expected workspace count drifted`);
  invariant(workspaceReadiness.summary?.presentWorkspaceCount === release.expectedCounts.members, `${release.releaseId}: all release workspaces are not present`);
  invariant(workspaceReadiness.summary?.draftValidationPassCount === release.expectedCounts.members, `${release.releaseId}: all release workspaces must pass draft validation`);
  invariant(workspaceReadiness.summary?.strictCompleteCount === 0 && workspaceReadiness.summary?.publishedCount === 0, `${release.releaseId}: calibration generator cannot operate as a promotion step`);
  invariant(Array.isArray(workspaceReadiness.workspaces) && workspaceReadiness.workspaces.length === release.expectedCounts.members, `${release.releaseId}: workspace-readiness members are incomplete`);
  let sourceStaticEngineeringCandidateCount = 0;
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const scoped = sourceScope.members[index];
    const ready = workspaceReadiness.workspaces[index];
    invariant(
      scoped?.ordinal === member.ordinal &&
      scoped?.animationId === member.animationId &&
      scoped?.assetId === member.assetId &&
      scoped?.shardId === member.shardId &&
      scoped?.source?.swf?.path === member.source.path &&
      scoped?.source?.swf?.sha256 === member.source.sha256 &&
      scoped?.strictComplete === false,
      `${member.animationId}: source-scope membership drifted`,
    );
    const implementationStatus = ready?.implementationStatus;
    invariant(
      implementationStatus === "not-started" ||
      implementationStatus === "source-static-engineering-candidate" ||
      implementationStatus ===
        "dual-sprite-composite-engineering-candidate",
      `${member.animationId}: workspace-readiness implementation status drifted`,
    );
    if (implementationStatus !== "not-started") {
      sourceStaticEngineeringCandidateCount += 1;
    }
    invariant(
      ready?.ordinal === member.ordinal &&
      ready?.animationId === member.animationId &&
      ready?.assetId === member.assetId &&
      ready?.shardId === member.shardId &&
      ready?.workspacePath === `migrations/${member.animationId}` &&
      ready?.draftValidation?.passed === true &&
      ready?.strictComplete === false,
      `${member.animationId}: workspace-readiness membership drifted`,
    );
  }
  invariant(
    (workspaceReadiness.summary?.implementationStartedCount ?? 0) === sourceStaticEngineeringCandidateCount,
    `${release.releaseId}: workspace-readiness implementation count drifted`,
  );
  return defaults;
}

export function deriveStaticFacts({member, calibrationMember, machineReport, frameDomains}) {
  validateMachineEvidenceIdentity({member, machineReport, frameDomains});

  const tags = machineReport.findings?.swfmill?.tagCounts ?? {};
  const categories = machineReport.findings?.swfmill?.categories ?? {};
  const nestedFrames = frameDomains.nestedDefinitions.map(({frameCount}) => frameCount);
  const externalCalls = Array.isArray(machineReport.findings?.externalCallCandidates)
    ? machineReport.findings.externalCallCandidates.map(({api, occurrences}) => ({api, occurrences}))
    : [];
  const pairedFla = machineReport.authoringSource?.pairedFlaStatus === "present";
  const staticFacts = {
    sourceModel: pairedFla ? "paired-fla-swf" : "swf-only",
    authoringAuditStatus: pairedFla ? machineReport.authoringSource.inspectionStatus : "not-available-swf-only",
    stage: {
      width: machineReport.findings.ffdecHeader.widthPx,
      height: machineReport.findings.ffdecHeader.heightPx,
      fps: machineReport.findings.ffdecHeader.frameRate,
    },
    rootFrameCount: frameDomains.root.frameCount,
    nestedDefinitionCount: frameDomains.nestedDefinitions.length,
    nestedLongerThanRootCount: nestedFrames.filter((count) => count > frameDomains.root.frameCount).length,
    maxNestedFrameCount: nestedFrames.length ? Math.max(...nestedFrames) : 0,
    totalNestedDefinitionFrames: nestedFrames.reduce((sum, count) => sum + count, 0),
    unresolvedReachabilityCount: frameDomains.summary.unresolvedReachabilityCount,
    exportedScriptFileCount: machineReport.findings.exportedScriptFileCount,
    scriptTagCount: countMapValues(categories.scriptTags),
    branchOpcodeCount: tagCount(tags, "BranchAlways", "BranchIfTrue"),
    randomOpcodeCount: tagCount(tags, "Random"),
    buttonDefinitionCount: tagCount(tags, "DefineButton", "DefineButton2"),
    displayListOperationCount: tagCount(tags, "PlaceObject", "PlaceObject2", "PlaceObject3", "RemoveObject", "RemoveObject2"),
    morphDefinitionCount: countMapValues(categories.morphDefinitions),
    filterTagCount: countMapValues(categories.filterTags),
    fontDefinitionCount: countMapValues(categories.fontDefinitions),
    defineSoundCount: tagCount(tags, "DefineSound"),
    soundStreamBlockCount: tagCount(tags, "SoundStreamBlock"),
    soundControlOperationCount: tagCount(tags, "StartSound", "StartSound2", "StopSound"),
    externalCalls,
  };
  const workStudySelected = calibrationMember.workStudySelected === true;
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    shardId: member.shardId,
    releaseRole: member.releaseRole,
    intendedCalibrationAxes: calibrationMember.intendedAxes,
    staticFacts,
    staticRiskSignals: {
      swfOnlyAuthoringGap: !pairedFla,
      unresolvedNestedReachability: staticFacts.unresolvedReachabilityCount > 0,
      nestedTimelineLongerThanRoot: staticFacts.nestedLongerThanRootCount > 0,
      branchOpcodesPresent: staticFacts.branchOpcodeCount > 0,
      randomOpcodePresent: staticFacts.randomOpcodeCount > 0,
      buttonDefinitionsPresent: staticFacts.buttonDefinitionCount > 0,
      audioTagsPresent: staticFacts.defineSoundCount > 0 || staticFacts.soundStreamBlockCount > 0 || staticFacts.soundControlOperationCount > 0,
      legacyExternalCallCandidatesPresent: externalCalls.length > 0,
      authoringAuditPending: pairedFla,
    },
    workStudy: workStudySelected ? {
      status: "candidate-pending-separate-authorization-and-human-timed-study",
      actualTotalMinutes: null,
      measuredBy: null,
      phases: calibrationMember.requiredPhases.map((phaseId) => ({
        phaseId,
        actualMinutes: null,
        measuredBy: null,
        startedAt: null,
        finishedAt: null,
      })),
    } : null,
    readiness: {
      staticMachineFactsRecorded: true,
      completeAuthoringAudit: false,
      rootReachabilityResolved: false,
      authoritativeRuntimeCaptured: false,
      rendererSelected: false,
      implementationAuthorizedByThisReport: false,
      strictAcceptanceEffect: false,
    },
  };
}

function summarize(items, workStudyTargetCount) {
  const sum = (selector) => items.reduce((total, item) => total + selector(item), 0);
  const count = (selector) => items.filter(selector).length;
  return {
    calibrationMemberCount: items.length,
    pairedFlaSwfCount: count((item) => item.staticFacts.sourceModel === "paired-fla-swf"),
    swfOnlyCount: count((item) => item.staticFacts.sourceModel === "swf-only"),
    rootFrameCount: sum((item) => item.staticFacts.rootFrameCount),
    nestedDefinitionCount: sum((item) => item.staticFacts.nestedDefinitionCount),
    nestedLongerThanRootCount: sum((item) => item.staticFacts.nestedLongerThanRootCount),
    unresolvedReachabilityCount: sum((item) => item.staticFacts.unresolvedReachabilityCount),
    exportedScriptFileCount: sum((item) => item.staticFacts.exportedScriptFileCount),
    branchOpcodeCount: sum((item) => item.staticFacts.branchOpcodeCount),
    randomOpcodeCount: sum((item) => item.staticFacts.randomOpcodeCount),
    externalCallCandidateCount: sum((item) => item.staticFacts.externalCalls.reduce((subtotal, call) => subtotal + call.occurrences, 0)),
    audioTagMemberCount: count((item) => item.staticRiskSignals.audioTagsPresent),
    workStudyTargetCount,
    workStudyCompletedCount: count((item) => item.workStudy?.status === "completed-human-timed-study"),
    completeAuthoringAuditCount: 0,
    rootReachabilityResolvedCount: 0,
    rendererSelectedCount: 0,
    implementationAuthorizedCount: 0,
    strictCompleteCount: 0,
  };
}

export async function buildReport({
  releaseId,
  releaseManifestPath = defaultReleaseManifest,
  calibrationSetsPath = defaultCalibrationSets,
  sourceScopePath = null,
  workspaceReadinessPath = null,
} = {}) {
  invariant(/^[a-z0-9][a-z0-9-]{2,127}$/.test(releaseId || ""), "--release-id must be a lowercase portable identifier");
  const [releaseManifest, calibrationCatalog, generator] = await Promise.all([
    jsonBinding(releaseManifestPath, "release manifest"),
    jsonBinding(calibrationSetsPath, "calibration-set catalog"),
    fileBinding(portable(path.relative(projectRoot, scriptPath)), "generator"),
  ]);
  const release = selectRelease(releaseManifest.value, releaseId);
  const calibration = selectCalibrationSet(calibrationCatalog.value, release);
  const evidenceDefaults = defaultReleaseEvidencePaths(release);
  const [sourceScope, workspaceReadiness] = await Promise.all([
    jsonBinding(sourceScopePath ?? evidenceDefaults.sourceScopePath, "source-scope freeze"),
    jsonBinding(workspaceReadinessPath ?? evidenceDefaults.workspaceReadinessPath, "workspace readiness"),
  ]);
  validateReleaseEvidenceDocuments({
    release,
    sourceScope: sourceScope.value,
    workspaceReadiness: workspaceReadiness.value,
  });
  invariant(
    sameBinding(workspaceReadiness.value.scope, {
      path: sourceScope.path,
      bytes: sourceScope.bytes,
      sha256: sourceScope.sha256,
    }),
    `${releaseId}: workspace readiness is not bound to the selected source scope`,
  );

  const byId = new Map(release.members.map((member) => [member.animationId, member]));
  const workStudyIds = new Set(calibration.humanWorkStudy.memberAnimationIds);
  const allMemberEvidence = await Promise.all(release.members.map(async (member, index) => {
    const workspaceRoot = `migrations/${member.animationId}`;
    const reportPath = `${workspaceRoot}/audit/machine/report.json`;
    const frameDomainsPath = `${workspaceRoot}/audit/machine/swf-frame-domain-candidates.json`;
    const scopeBindingPath = `${workspaceRoot}/audit/machine/${evidenceDefaults.scopeBindingBasename}`;
    const manifestPath = `${workspaceRoot}/migration.json`;
    const [machineReport, frameDomains, scopeBinding, manifest] = await Promise.all([
      jsonBinding(reportPath, `${member.animationId} machine report`),
      jsonBinding(frameDomainsPath, `${member.animationId} frame domains`),
      jsonBinding(scopeBindingPath, `${member.animationId} scope binding`),
      jsonBinding(manifestPath, `${member.animationId} migration manifest`),
    ]);
    invariant(manifest.value?.animationId === member.animationId, `${member.animationId}: migration manifest identity drifted`);
    invariant(manifest.value?.assetId === member.assetId, `${member.animationId}: migration asset identity drifted`);
    const ready = workspaceReadiness.value.workspaces[index];
    invariant(
      sameBinding(ready.manifest, {path: manifest.path, bytes: manifest.bytes, sha256: manifest.sha256}),
      `${member.animationId}: readiness manifest binding drifted`,
    );
    invariant(
      sameBinding(ready.sourceScopeBinding, {
        path: scopeBinding.path,
        bytes: scopeBinding.bytes,
        sha256: scopeBinding.sha256,
      }),
      `${member.animationId}: readiness scope binding drifted`,
    );
    invariant(
      scopeBinding.value?.releaseId === releaseId &&
      scopeBinding.value?.member?.animationId === member.animationId &&
      scopeBinding.value?.member?.assetId === member.assetId &&
      scopeBinding.value?.member?.source?.swf?.path === member.source.path &&
      scopeBinding.value?.member?.source?.swf?.sha256 === member.source.sha256,
      `${member.animationId}: scope binding identity drifted`,
    );
    invariant(
      sameBinding(scopeBinding.value.scope, {
        path: sourceScope.path,
        bytes: sourceScope.bytes,
        sha256: sourceScope.sha256,
      }),
      `${member.animationId}: member scope binding does not bind the selected source scope`,
    );
    const expectedSourcePath = `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`;
    invariant(machineReport.value.source?.path === expectedSourcePath, `${member.animationId}: source path drifted`);
    validateMachineEvidenceIdentity({
      member,
      machineReport: machineReport.value,
      frameDomains: frameDomains.value,
    });
    return {
      member,
      values: {
        machineReport: machineReport.value,
        frameDomains: frameDomains.value,
      },
      bindings: {
        migrationManifest: {path: manifest.path, bytes: manifest.bytes, sha256: manifest.sha256},
        scopeBinding: {path: scopeBinding.path, bytes: scopeBinding.bytes, sha256: scopeBinding.sha256},
        machineReport: {path: machineReport.path, bytes: machineReport.bytes, sha256: machineReport.sha256},
        frameDomains: {path: frameDomains.path, bytes: frameDomains.bytes, sha256: frameDomains.sha256},
      },
    };
  }));
  const evidenceById = new Map(allMemberEvidence.map((entry) => [entry.member.animationId, entry]));
  const itemInputs = await Promise.all(calibration.members.map(async (selection) => {
    const member = byId.get(selection.animationId);
    const evidence = evidenceById.get(member.animationId);
    const expectedSourcePath = `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`;
    const source = await sourceBinding(expectedSourcePath, member.source.sha256);
    const facts = deriveStaticFacts({
      member,
      calibrationMember: {
        ...selection,
        workStudySelected: workStudyIds.has(member.animationId),
        requiredPhases: calibration.humanWorkStudy.requiredPhases,
      },
      machineReport: evidence.values.machineReport,
      frameDomains: evidence.values.frameDomains,
    });
    return {
      facts,
      bindings: {
        source,
        ...evidence.bindings,
      },
    };
  }));
  const items = itemInputs.map(({facts}) => facts);
  const machineAuditInventory = allMemberEvidence.map(({member, bindings}) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    ...bindings,
  }));
  return {
    schemaVersion: 1,
    reportType: "lesson-release-static-risk-calibration",
    releaseId,
    generatedBy: generator,
    authority: "Acceptance-neutral release-local static planning report. It records machine-derived risk signals and candidate human work-study templates only; it inherits no authorization, hours, receipt, or acceptance from another lesson.",
    release: {
      expectedMemberCount: release.expectedCounts.members,
      machineAuditMemberCount: machineAuditInventory.length,
      calibrationMemberCount: calibration.members.length,
      workStudyTargetCount: calibration.humanWorkStudy.memberAnimationIds.length,
      publicationMode: release.publicationMode,
      strictCompleteCount: 0,
      published: false,
    },
    method: {
      evidencePriority: "Preserved SWF plus current machine audit; paired FLA availability is recorded but no Animate authoring result is inferred.",
      staticCountsAreNotEffortEstimates: true,
      staticCountsAreNotRuntimeReachability: true,
      noRendererSelection: true,
      noHumanIdentityOrTimestampGenerated: true,
      noAcceptanceEffect: true,
      releaseLocalEvidenceOnly: true,
      noPriorLessonAuthorizationHoursReceiptOrAcceptanceInheritance: true,
    },
    humanWorkStudyProtocol: {
      status: "candidate-template-only-separate-authorization-required",
      requiredPhases: calibration.humanWorkStudy.requiredPhases,
      measurementRule: calibration.humanWorkStudy.measurementRule,
      automationMayFillActuals: false,
      authorizationInheritedFromAnotherLesson: false,
      hoursInheritedFromAnotherLesson: false,
      receiptInheritedFromAnotherLesson: false,
      acceptanceInheritedFromAnotherLesson: false,
    },
    summary: summarize(items, calibration.humanWorkStudy.memberAnimationIds.length),
    items,
    sourceBindings: {
      releaseManifest: {path: releaseManifest.path, bytes: releaseManifest.bytes, sha256: releaseManifest.sha256},
      calibrationSets: {path: calibrationCatalog.path, bytes: calibrationCatalog.bytes, sha256: calibrationCatalog.sha256},
      sourceScope: {path: sourceScope.path, bytes: sourceScope.bytes, sha256: sourceScope.sha256},
      workspaceReadiness: {path: workspaceReadiness.path, bytes: workspaceReadiness.bytes, sha256: workspaceReadiness.sha256},
      machineAuditCoverage: {
        expectedMemberCount: release.expectedCounts.members,
        verifiedMemberCount: machineAuditInventory.length,
        inventorySha256: sha256(stableJson(machineAuditInventory)),
        members: machineAuditInventory,
      },
      members: itemInputs.map(({facts, bindings}) => ({animationId: facts.animationId, ...bindings})),
    },
    blockers: [
      `The ${calibration.humanWorkStudy.memberAnimationIds.length} release-local work-study candidates require separate authorization and actual named-human timed sessions; no authorization or hours are inferred or inherited here.`,
      "Paired FLA members require current read-only Animate authoring audits; SWF-only members retain an explicit authoring-source gap.",
      "Every nested definition remains structurally discovered but runtime reachability and entry state are unresolved.",
      "Natural EN/ES interaction, random, scoring, audio, Replay, terminal, and host-navigation traces remain uncaptured and unaccepted.",
      "Renderer choice and implementation remain downstream of completed audit and specification evidence.",
    ],
    acceptanceEffects: {
      implementationAuthorized: false,
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

export function renderMarkdown(report) {
  const rows = report.items.map((item) => {
    const facts = item.staticFacts;
    const external = facts.externalCalls.length
      ? facts.externalCalls.map(({api, occurrences}) => `${api}:${occurrences}`).join(", ")
      : "none";
    return `| ${item.ordinal} | \`${item.animationId}\` | ${facts.sourceModel} | ${facts.rootFrameCount} | ${facts.nestedDefinitionCount} | ${facts.nestedLongerThanRootCount} | ${facts.maxNestedFrameCount} | ${facts.exportedScriptFileCount} | ${facts.branchOpcodeCount} | ${facts.randomOpcodeCount} | ${external} | ${item.workStudy ? "candidate; separate authorization required" : "not selected"} |`;
  }).join("\n");
  return `# ${report.releaseId} static risk calibration\n\n` +
    `> ${report.authority}\n\n` +
    `## Scope\n\n` +
    `- Machine-audit bindings verified: **${report.release.machineAuditMemberCount}/${report.release.expectedMemberCount}**.\n` +
    `- Calibration members: **${report.summary.calibrationMemberCount}** of ${report.release.expectedMemberCount}.\n` +
    `- Source models: **${report.summary.pairedFlaSwfCount} paired FLA+SWF**, **${report.summary.swfOnlyCount} SWF-only**.\n` +
    `- Human work-study candidates: **${report.summary.workStudyTargetCount}**, completed: **${report.summary.workStudyCompletedCount}**.\n` +
    `- Static root frames: **${report.summary.rootFrameCount}**; nested definitions: **${report.summary.nestedDefinitionCount}**; nested-longer-than-root: **${report.summary.nestedLongerThanRootCount}**.\n` +
    `- Runtime reachability resolved: **0/${report.summary.calibrationMemberCount}**; renderer selected: **0/${report.summary.calibrationMemberCount}**; strict: **0/${report.release.expectedMemberCount}**.\n\n` +
    `Static counts are neither effort estimates nor runtime reachability. No renderer is selected by this report.\n\n` +
    `## Members\n\n` +
    `| Ordinal | Animation | Source | Root | Nested | Nested > root | Max nested | Script files | Branch ops | Random ops | External candidates | Work study |\n` +
    `|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|\n${rows}\n\n` +
    `## Human work-study protocol\n\n` +
    `${report.humanWorkStudyProtocol.measurementRule}\n\n` +
    report.humanWorkStudyProtocol.requiredPhases.map((phase) => `- \`${phase}\``).join("\n") +
    `\n\nAutomation must not fill names, times, actual minutes, authorization, review, or acceptance. No authorization, hours, receipt, or acceptance is inherited from another lesson.\n\n` +
    `## Remaining blockers\n\n` + report.blockers.map((blocker) => `- ${blocker}`).join("\n") +
    `\n\nThis report grants no implementation, original-runtime, audio, human, Owner, strict-completion, or publication authority.\n`;
}

function outputPaths(outputPrefix) {
  invariant(typeof outputPrefix === "string" && outputPrefix.startsWith("reports/"), "--output-prefix must stay below reports/");
  invariant(!outputPrefix.endsWith(".json") && !outputPrefix.endsWith(".md"), "--output-prefix must omit an extension");
  const absolutePrefix = resolveProjectPath(outputPrefix, "output prefix");
  return {
    json: `${absolutePrefix}.json`,
    markdown: `${absolutePrefix}.md`,
  };
}

async function assertSafeExistingOutput(file) {
  try {
    const metadata = await lstat(file);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${portable(path.relative(projectRoot, file))}: generated output must be an ordinary file`);
    invariant(metadata.nlink === 1, `${portable(path.relative(projectRoot, file))}: generated output must not be hard-linked`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function atomicWrite(file, bytes) {
  await assertSafeExistingOutput(file);
  await mkdir(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function writeOrCheck({report, outputPrefix, check}) {
  const outputs = outputPaths(outputPrefix);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderMarkdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readFile(outputs.json, "utf8"),
      readFile(outputs.markdown, "utf8"),
    ]);
    invariant(actualJson === expectedJson, `${portable(path.relative(projectRoot, outputs.json))} is stale`);
    invariant(actualMarkdown === expectedMarkdown, `${portable(path.relative(projectRoot, outputs.markdown))} is stale`);
    return {status: "checked", outputs};
  }
  await Promise.all([
    atomicWrite(outputs.json, expectedJson),
    atomicWrite(outputs.markdown, expectedMarkdown),
  ]);
  return {status: "written", outputs};
}

export function parseArguments(argv) {
  const options = {
    releaseId: null,
    releaseManifestPath: defaultReleaseManifest,
    calibrationSetsPath: defaultCalibrationSets,
    sourceScopePath: null,
    workspaceReadinessPath: null,
    outputPrefix: null,
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const next = argv[index + 1];
    invariant(next && !next.startsWith("--"), `${argument} requires a value`);
    if (argument === "--release-id") options.releaseId = next;
    else if (argument === "--releases") options.releaseManifestPath = next;
    else if (argument === "--calibration-sets") options.calibrationSetsPath = next;
    else if (argument === "--source-scope") options.sourceScopePath = next;
    else if (argument === "--workspace-readiness") options.workspaceReadinessPath = next;
    else if (argument === "--output-prefix") options.outputPrefix = next;
    else throw new Error(`Unknown option: ${argument}`);
    index += 1;
  }
  if (options.help) return options;
  invariant(options.releaseId, "--release-id is required");
  invariant(options.outputPrefix, "--output-prefix is required");
  for (const [label, value] of [
    ["--releases", options.releaseManifestPath],
    ["--calibration-sets", options.calibrationSetsPath],
    ["--source-scope", options.sourceScopePath],
    ["--workspace-readiness", options.workspaceReadinessPath],
  ]) {
    if (value !== null) resolveProjectPath(value, label);
  }
  outputPaths(options.outputPrefix);
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-lesson-risk-calibration.mjs --release-id <id> --output-prefix <reports/prefix> [--releases <file>] [--calibration-sets <file>] [--source-scope <file>] [--workspace-readiness <file>] [--check]\n");
    return;
  }
  const report = await buildReport(options);
  const result = await writeOrCheck({report, outputPrefix: options.outputPrefix, check: options.check});
  process.stdout.write(`${result.status === "checked" ? "PASS" : "WROTE"}: ${report.summary.calibrationMemberCount} calibration members; 0 implementation authority; 0 strict completion\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
