import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, realpath, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";
import {deflateSync} from "node:zlib";

import {
  buildLessonAnimateAuthoringAuditIndex,
  parseArguments,
} from "./build-lesson-animate-authoring-audit-index.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function put(root, relative, bytes, mode = null) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

function portable(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function reference(root, file, bytes) {
  return {file: portable(root, file), sha256: sha256(bytes), bytes: bytes.length};
}

function frozenReference(root, file, bytes, manifestPath) {
  return {...reference(root, file, bytes), sourceFreezeManifestPath: manifestPath, sourceFreezeBound: true};
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function png(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const scanlines = Buffer.alloc(height * (width + 1));
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function putContentAddressed(root, base, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const digest = sha256(bytes);
  const file = await put(root, `${base}/${digest}.json`, bytes, 0o444);
  return {file, bytes, binding: {...reference(root, file, bytes), mode: "0444"}};
}

async function fixture({narrowed = false, publicationMode = "atomic", shadowCanonicalPaths = false} = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "lesson-authoring-index-")));
  const generatorBytes = Buffer.from("fixture generator");
  const generatorFile = await put(root, "scripts/build-lesson-animate-authoring-audit-index.mjs", generatorBytes);
  const releaseId = "lesson-g04-l10-fixture";
  const entries = [];
  const animations = [];
  const sourceManifestEntries = [];
  for (let index = 0; index < 2; index += 1) {
    const number = index + 1;
    const animationId = `fixture-${number}`;
    const flaBytes = Buffer.from(`fla-${number}`);
    const swfBytes = Buffer.from(`swf-${number}`);
    const flaManifestPath = `fixture/F${number}.fla`;
    const swfManifestPath = `fixture/F${number}.swf`;
    const flaFile = await put(root, `${SOURCE_PREFIX}/${flaManifestPath}`, flaBytes, 0o444);
    const swfFile = await put(root, `${SOURCE_PREFIX}/${swfManifestPath}`, swfBytes, 0o444);
    const workingFile = await put(root,
      `work/animate/release-read-only-fla-copies/${releaseId}/all/files/${animationId}/F${number}.fla`,
      flaBytes, 0o444);
    const workspaceValue = {
      schemaVersion: 2,
      id: animationId,
      animationId,
      assetId: `swf-${sha256(swfBytes)}`,
      source: {
        placementPath: `${SOURCE_PREFIX}/${swfManifestPath}`,
        fla: `${SOURCE_PREFIX}/${flaManifestPath}`,
        swf: `${SOURCE_PREFIX}/${swfManifestPath}`,
        flaSha256: sha256(flaBytes),
        swfSha256: sha256(swfBytes),
        pairedFlaStatus: "present",
      },
    };
    const workspaceBytes = Buffer.from(stable(workspaceValue));
    const workspaceFile = await put(root, `migrations/${animationId}/migration.json`, workspaceBytes);
    const workspaceManifest = {...reference(root, workspaceFile, workspaceBytes), mode: "0644"};
    const sourceFla = frozenReference(root, flaFile, flaBytes, flaManifestPath);
    const sourceSwf = frozenReference(root, swfFile, swfBytes, swfManifestPath);
    sourceManifestEntries.push({path: flaManifestPath, bytes: flaBytes}, {path: swfManifestPath, bytes: swfBytes});
    animations.push({
      animationId,
      assetId: `swf-${sha256(swfBytes)}`,
      source: {path: swfManifestPath, sha256: sha256(swfBytes), bytes: swfBytes.length},
      pairedFla: {path: flaManifestPath, sha256: sha256(flaBytes), bytes: flaBytes.length},
      classification: {collection: "course", grade: 4, lesson: 10},
      flags: {shell: false},
    });
    entries.push({
      releaseOrdinal: number,
      animationId,
      assetId: `swf-${sha256(swfBytes)}`,
      releaseRole: "active-xml-referenced-page",
      shardId: "fixture-shard",
      sourceFla,
      sourceSwf,
      workspaceManifest,
      workingCopy: {
        ...reference(root, workingFile, flaBytes),
        mode: "0444",
        readOnly: true,
        byteIdenticalToSource: true,
        separateRegularFile: true,
      },
      animateAuthoringAudit: {
        status: "not-run",
        guiLaunchedByThisPreparation: false,
        dialogInteractionByThisPreparation: false,
        acceptanceEffect: false,
      },
    });
  }
  const swfOnlyBytes = Buffer.from("swf-only");
  const swfOnlyManifestPath = "fixture/Only.swf";
  const swfOnlyFile = await put(root, `${SOURCE_PREFIX}/${swfOnlyManifestPath}`, swfOnlyBytes, 0o444);
  sourceManifestEntries.push({path: swfOnlyManifestPath, bytes: swfOnlyBytes});
  const swfOnlyAnimationId = "fixture-swf-only";
  const swfOnlyWorkspaceValue = {
    schemaVersion: 2,
    id: swfOnlyAnimationId,
    animationId: swfOnlyAnimationId,
    assetId: `swf-${sha256(swfOnlyBytes)}`,
    source: {
      placementPath: `${SOURCE_PREFIX}/${swfOnlyManifestPath}`,
      fla: "",
      swf: `${SOURCE_PREFIX}/${swfOnlyManifestPath}`,
      flaSha256: "",
      swfSha256: sha256(swfOnlyBytes),
      pairedFlaStatus: "missing",
    },
  };
  const swfOnlyWorkspaceBytes = Buffer.from(stable(swfOnlyWorkspaceValue));
  const swfOnlyWorkspaceFile = await put(root,
    `migrations/${swfOnlyAnimationId}/migration.json`, swfOnlyWorkspaceBytes);
  const noFla = {
    releaseOrdinal: 3,
    animationId: swfOnlyAnimationId,
    assetId: `swf-${sha256(swfOnlyBytes)}`,
    releaseRole: "course-shell",
    shardId: "fixture-shard",
    sourceSwf: frozenReference(root, swfOnlyFile, swfOnlyBytes, swfOnlyManifestPath),
    workspaceManifest: {...reference(root, swfOnlyWorkspaceFile, swfOnlyWorkspaceBytes), mode: "0644"},
    disposition: "swf-only-no-fla-in-catalog-or-workspace",
    authoringAuditApplicability: "not-applicable-no-fla-source",
    inferredAuthoringStructureAllowed: false,
    strictAcceptanceEffect: false,
  };
  animations.push({
    animationId: swfOnlyAnimationId,
    assetId: noFla.assetId,
    source: {path: swfOnlyManifestPath, sha256: sha256(swfOnlyBytes), bytes: swfOnlyBytes.length},
    pairedFla: null,
    classification: {collection: "course", grade: 4, lesson: 10},
    flags: {shell: true},
  });

  const canonicalRelease = {
    releaseId,
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    grade: 4,
    lesson: 10,
    titleDisplay: "Fixture",
    expectedCounts: {activeXmlReferencedPages: 2, courseShells: 1, members: 3, shards: 1},
    shards: [{shardId: "fixture-shard", batchId: "fixture-shard", ordinal: 1, memberCount: 3}],
    members: [...entries, noFla].map((entry) => ({
      ordinal: entry.releaseOrdinal,
      animationId: entry.animationId,
      assetId: entry.assetId,
      releaseRole: entry.releaseRole,
      batchId: entry.shardId,
      shardId: entry.shardId,
      source: {
        path: entry.sourceSwf.file.replace(`${SOURCE_PREFIX}/`, ""),
        sha256: entry.sourceSwf.sha256,
      },
    })),
  };
  const lessonReleasesBytes = Buffer.from(stable({schemaVersion: 1, releases: [canonicalRelease]}));
  const lessonReleasesFile = await put(root, "catalog/lesson-releases.json", lessonReleasesBytes);
  const animationsBytes = Buffer.from(stable({schemaVersion: 1, animations}));
  const animationsFile = await put(root, "catalog/animations.json", animationsBytes);
  const sourceManifestBytes = Buffer.from(
    `${sourceManifestEntries.map(({path: sourcePath, bytes}) => `${sha256(bytes)}  ${sourcePath}`).join("\n")}\n`,
  );
  const sourceManifestFile = await put(root, "catalog/source-manifest.sha256", sourceManifestBytes);
  const boundLessonReleasesFile = shadowCanonicalPaths
    ? await put(root, "shadow-catalog/lesson-releases.json", lessonReleasesBytes)
    : lessonReleasesFile;
  const boundAnimationsFile = shadowCanonicalPaths
    ? await put(root, "shadow-catalog/animations.json", animationsBytes)
    : animationsFile;
  const boundSourceManifestFile = shadowCanonicalPaths
    ? await put(root, "shadow-catalog/source-manifest.sha256", sourceManifestBytes)
    : sourceManifestFile;
  const canonicalInputs = {
    lessonReleases: {...reference(root, boundLessonReleasesFile, lessonReleasesBytes), mode: "0644"},
    animations: {...reference(root, boundAnimationsFile, animationsBytes), mode: "0644"},
    sourceFreezeManifest: {...reference(root, boundSourceManifestFile, sourceManifestBytes), mode: "0644"},
    generator: {...reference(root, generatorFile, generatorBytes), mode: "0644"},
  };

  const selectedEntries = narrowed ? entries : entries;
  const selectedNoFla = narrowed ? [] : [noFla];
  const selectedMemberCount = selectedEntries.length + selectedNoFla.length;
  const release = {
    releaseId: "lesson-g04-l10-fixture",
    grade: 4,
    lesson: 10,
    titleDisplay: "Fixture",
    publicationMode,
    shardId: null,
    selectedMemberCount,
    fullReleaseMemberCount: 3,
  };
  const staging = {
    schemaVersion: 1,
    evidenceKind: "lesson-release-adobe-animate-prepare-only-fla-staging",
    release,
    inputs: canonicalInputs,
    summary: {
      selectedMembers: selectedMemberCount,
      flaBackedItems: selectedEntries.length,
      swfOnlyItems: selectedNoFla.length,
      copiesReady: selectedEntries.length,
      allCopiesReadOnly: true,
      allCopiesByteIdentical: true,
      allSourcesFreezeBound: true,
      allWorkspacesHashBound: true,
      animateGuiExecutions: 0,
      dialogInteractions: 0,
      authoringAuditsCompleted: 0,
      migrationOrAcceptanceWrites: 0,
      strictAcceptanceEffect: false,
    },
    entries: selectedEntries,
    noFlaDispositions: selectedNoFla,
  };
  const stagingResult = await putContentAddressed(root,
    `work/animate/release-read-only-fla-copies/${release.releaseId}/all/manifests/sha256`, staging);
  const queue = {
    schemaVersion: 1,
    evidenceKind: "lesson-release-adobe-animate-prepare-only-operator-queue",
    release,
    stagingManifest: {
      file: stagingResult.binding.file,
      sha256: stagingResult.binding.sha256,
      bytes: stagingResult.binding.bytes,
      address: `sha256:${stagingResult.binding.sha256}`,
    },
    authorityBoundary: {
      workingCopiesPrepared: true,
      animateAuthoringAudit: false,
      originalRuntimeEvidence: false,
      javascriptCandidate: false,
      humanOrOwnerReview: false,
      strictCompletion: false,
      publication: false,
    },
    safety: {
      executableCommands: [],
      animateGuiLaunches: 0,
      dialogInteractions: 0,
      operatorIdentityCollected: false,
      sourceOrWorkspaceWrites: 0,
    },
    summary: {
      preparedFlaItems: selectedEntries.length,
      noFlaDispositions: selectedNoFla.length,
      pendingAuthoringAudits: selectedEntries.length,
      authoringAuditsCompleted: 0,
      strictAcceptanceEffect: false,
    },
    queue: selectedEntries.map((entry, index) => ({
      queueOrdinal: index + 1,
      releaseOrdinal: entry.releaseOrdinal,
      animationId: entry.animationId,
      shardId: entry.shardId,
      sourceFla: entry.sourceFla,
      sourceSwf: entry.sourceSwf,
      workspaceManifest: entry.workspaceManifest,
      workingCopy: entry.workingCopy,
      status: "prepared-only-authoring-audit-not-run",
      actionAuthorizedByThisQueue: "hash-and-read-only-verification-only",
    })),
    noFlaDispositions: selectedNoFla,
  };
  const queueResult = await putContentAddressed(root,
    `work/animate/release-read-only-fla-copies/${release.releaseId}/all/operator-queues/sha256`, queue);
  const readiness = {
    schemaVersion: 2,
    reportType: "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness",
    release,
    authorityBoundary: {
      sourceAndReadOnlyPreparation: true,
      adobeAnimateAuthoringAudit: false,
      originalRuntimeBehavior: false,
      javascriptImplementationOrFidelity: false,
      rmse: false,
      audioListeningOrSynchronization: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
    },
    inputs: {
      releaseStagingManifest: stagingResult.binding,
      releasePrepareOnlyQueue: queueResult.binding,
      namedOperatorAssignmentReceipt: null,
      perRowSessionAuthorizationReceipts: [],
    },
    operatorAssignment: {assigneeFullName: null},
    resultIndexBoundary: {
      expectedIndependentResultIndex: "reports/g4-l10-animate-authoring-audit-index.json",
    },
    summary: {flaBackedItems: selectedEntries.length, swfOnlyItems: selectedNoFla.length},
  };
  const readinessFile = await put(root, "reports/g4-l10-animate-authoring-operator-readiness.json",
    Buffer.from(`${JSON.stringify(readiness, null, 2)}\n`));
  return {
    root,
    releaseId: release.releaseId,
    readinessFile,
    jsonReport: path.join(root, "reports/g4-l10-animate-authoring-audit-index.json"),
    markdownReport: path.join(root, "reports/g4-l10-animate-authoring-audit-index.md"),
    entries: selectedEntries,
    canonicalFiles: {
      lessonReleases: lessonReleasesFile,
      animations: animationsFile,
      sourceFreezeManifest: sourceManifestFile,
    },
  };
}

async function bindNamedOperator(context, operator) {
  const value = {
    schemaVersion: 1,
    releaseId: context.releaseId,
    assignment: {
      roleId: "authorized-original-runtime-operator",
      assigneeFullName: operator,
      explicit: true,
    },
    authorityBoundary: {
      animateGuiExecutionAuthorizedByThisReceiptAlone: false,
      originalRuntimeExecutionAuthorizedByThisReceiptAlone: false,
      humanReviewAccepted: false,
      ownerFidelityAcceptanceEstablished: false,
      publicationAuthorized: false,
    },
  };
  const assignment = await putContentAddressed(context.root,
    "work/animate/named-operator-assignments/sha256", value);
  const readiness = JSON.parse(await readFile(context.readinessFile, "utf8"));
  readiness.inputs.namedOperatorAssignmentReceipt = assignment.binding;
  readiness.operatorAssignment = {
    roleId: value.assignment.roleId,
    assigneeFullName: operator,
    receipt: assignment.binding,
  };
  await writeFile(context.readinessFile, stable(readiness));
  return assignment.binding;
}

async function bindOneRowAuthorization(context, entry, operator, {
  releaseId = context.releaseId,
  releaseOrdinal = entry.releaseOrdinal,
  queueOrdinal = context.entries.indexOf(entry) + 1,
  animationId = entry.animationId,
  runId = "run-pass",
} = {}) {
  const readiness = JSON.parse(await readFile(context.readinessFile, "utf8"));
  assert.ok(readiness.inputs.namedOperatorAssignmentReceipt,
    "the named assignment must be bound before a one-row authorization fixture is created");
  const value = {
    schemaVersion: 1,
    evidenceKind: "lesson-release-adobe-animate-one-row-session-authorization",
    identity: {releaseId, releaseOrdinal, queueOrdinal, animationId, runId},
    bindings: {
      releasePrepareOnlyQueue: readiness.inputs.releasePrepareOnlyQueue,
      releaseStagingManifest: readiness.inputs.releaseStagingManifest,
      namedOperatorAssignmentReceipt: readiness.inputs.namedOperatorAssignmentReceipt,
    },
    operator: {
      assigneeFullName: operator,
      consentToConfirmLegacyActionScriptConversionDialog: true,
      consentToCloseWithoutSaving: true,
    },
    authorization: {
      state: "authorized-one-row-one-run",
      oneTimeUseRequired: true,
      animateGuiExecutionAuthorized: true,
      saveAllowed: false,
      publishAllowed: false,
      authorizedAt: "2026-08-02T08:00:00.000Z",
      notAfter: "2026-08-02T09:00:00.000Z",
    },
    authorityBoundary: {
      originalRuntimeBehavior: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      publication: false,
    },
  };
  const authorization = await putContentAddressed(context.root,
    "work/animate/session-authorizations/sha256", value);
  readiness.inputs.perRowSessionAuthorizationReceipts.push(authorization.binding);
  readiness.operatorProtocol = {
    ...(readiness.operatorProtocol || {}),
    immutablePerRowSessionAuthorizationPresent: true,
    assignedOperatorBindingEnforcedByRunner: true,
  };
  await writeFile(context.readinessFile, stable(readiness));
  return authorization.binding;
}

async function createPassingAttempt(context, entry, operator = "Alex Rivera", {
  runId = "run-pass",
  sessionAuthorizationReceipt = null,
  pngBytes: suppliedPngBytes = null,
  mutateReport = null,
} = {}) {
  const {root} = context;
  const evidenceRoot = path.join(root, "work", "animate", "dependency-authoring-audits", entry.animationId);
  const runDir = path.join(evidenceRoot, "runs", runId);
  const flaBytes = await readFile(path.join(root, entry.sourceFla.file));
  const swfBytes = await readFile(path.join(root, entry.sourceSwf.file));
  const flaCopyFile = await put(root,
    portable(root, path.join(evidenceRoot, "working-copy", path.basename(entry.sourceFla.file))), flaBytes, 0o444);
  const swfCopyFile = await put(root,
    portable(root, path.join(evidenceRoot, "runtime-source", path.basename(entry.sourceSwf.file))), swfBytes, 0o444);
  const flaCopy = {...reference(root, flaCopyFile, flaBytes), mode: "0444", readOnly: true,
    byteIdenticalToSource: true, separateRegularFile: true};
  const swfCopy = {...reference(root, swfCopyFile, swfBytes), mode: "0444", readOnly: true,
    byteIdenticalToSource: true, separateRegularFile: true};
  const sourceFla = reference(root, path.join(root, entry.sourceFla.file), flaBytes);
  const sourceSwf = reference(root, path.join(root, entry.sourceSwf.file), swfBytes);
  const sourceBinding = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-read-only-paired-fla-swf-binding",
    evidenceId: entry.animationId,
    sourceKind: "paired-fla-swf",
    acceptanceEffect: "none; work-only authoring evidence preparation",
    source: sourceFla,
    workingCopy: flaCopy,
    shippedSwf: {source: sourceSwf, workingCopy: swfCopy},
    intendedAudit: {
      captureFrame: 1,
      recursiveRootAndLibraryTimelines: true,
      frameAndInstanceScriptInventory: true,
      nativeStagePng: true,
      saveOrPublishAllowed: false,
    },
    generatedBy: {file: "scripts/run-assisted-animate-authoring-audit.mjs", sha256: "c".repeat(64)},
  };
  const sourceBindingBytes = Buffer.from(`${JSON.stringify(sourceBinding, null, 2)}\n`);
  const sourceBindingFile = await put(root, portable(root, path.join(evidenceRoot, "source-binding.json")),
    sourceBindingBytes, 0o444);
  const sourceBindingRef = reference(root, sourceBindingFile, sourceBindingBytes);
  const auditTemplateBytes = Buffer.from("audit template");
  const auditTemplateFile = await put(root, "scripts/animate-audit-current-document.jsfl", auditTemplateBytes);
  const generatedBytes = Buffer.from("generated audit");
  const controllerBytes = Buffer.from("controller");
  const stdoutBytes = Buffer.alloc(0);
  const stderrBytes = Buffer.from("warning");
  const generatedFile = await put(root, portable(root, path.join(runDir, "generated.jsfl")), generatedBytes);
  const controllerFile = await put(root, portable(root, path.join(runDir, "controller.jsfl")), controllerBytes);
  const stdoutFile = await put(root, portable(root, path.join(runDir, "stdout.log")), stdoutBytes);
  const stderrFile = await put(root, portable(root, path.join(runDir, "stderr.log")), stderrBytes);
  const width = 800;
  const height = 600;
  const capturedAt = "2026-08-02T08:19:40.000Z";
  const report = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    recursiveLibraryTimelineAudit: true,
    animateVersion: "MAC 21,0,7,42652",
    capturedAt,
    document: {
      name: path.basename(flaCopyFile),
      pathURI: pathToFileURL(flaCopyFile).href,
      width,
      height,
      frameRate: 12,
      backgroundColor: "#FFFFFF",
      libraryItemCount: 0,
    },
    timeline: {
      frameCount: 1,
      layerCount: 1,
      currentFlashFrame: 1,
      layers: [{index: 0, frameCount: 1, keyframes: [{
        index: 0,
        startFrame: 0,
        flashFrame: 1,
        duration: 1,
        elementCount: 1,
        actionScript: "stop();",
        actionScriptLength: 7,
        elements: [{index: 0, attachedActionScript: null, attachedActionScriptLength: 0}],
      }]}],
    },
    library: [],
  };
  if (mutateReport) mutateReport(report);
  const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  const reportFile = await put(root, portable(root, path.join(runDir, "authoring-audit.json")), reportBytes);
  const pngBytes = suppliedPngBytes || png(width, height);
  const pngFile = await put(root, portable(root, path.join(runDir, "frame-1.png")), pngBytes);
  const marker = {
    status: "passed",
    animateVersion: report.animateVersion,
    documentName: path.basename(flaCopyFile),
    documentPathURI: pathToFileURL(flaCopyFile).href,
    captureFrame: 1,
  };
  const markerBytes = Buffer.from(`${JSON.stringify(marker, null, 2)}\n`);
  const markerFile = await put(root, portable(root, path.join(runDir, "controller-result.json")), markerBytes);
  const summary = {
    capturedAt,
    stage: {width, height},
    fps: 12,
    frameCount: report.timeline.frameCount,
    backgroundColor: "#FFFFFF",
    rootLayerCount: report.timeline.layerCount,
    libraryItemCount: report.document.libraryItemCount,
    frameScriptsPresent: 1,
    attachedScriptsPresent: 0,
    scriptBodiesRequired: true,
  };
  const scripts = {
    auditTemplate: reference(root, auditTemplateFile, auditTemplateBytes),
    generatedAudit: reference(root, generatedFile, generatedBytes),
    controller: reference(root, controllerFile, controllerBytes),
  };
  const artifacts = {
    marker: reference(root, markerFile, markerBytes),
    report: reference(root, reportFile, reportBytes),
    png: {...reference(root, pngFile, pngBytes), width, height},
    animateVersion: report.animateVersion,
    reportSummary: summary,
  };
  const workEvidence = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-paired-fla-swf-authoring-audit",
    status: "verified-work-only-authoring-audit",
    evidenceId: entry.animationId,
    sourceKind: "paired-fla-swf",
    acceptanceEffect: "none; not migration status, human review, owner acceptance, runtime behavior, audio, fidelity, or completion evidence",
    sourceBinding: {file: sourceBindingRef.file, sha256: sourceBindingRef.sha256,
      source: sourceFla, sourceUnchangedAfterAudit: true},
    workingCopy: {...flaCopy, readOnlyAfterAudit: true, byteIdenticalToSourceAfterAudit: true},
    shippedSwfBinding: {
      source: sourceSwf,
      stagedCopy: swfCopy,
      sourceUnchangedAfterAudit: true,
      stagedCopyReadOnlyAfterAudit: true,
      stagedCopyByteIdenticalAfterAudit: true,
      executedByThisAuthoringAudit: false,
    },
    humanDialogBoundary: {
      required: true,
      designatedOperator: operator,
      operatorNameIsNotReviewOrApproval: true,
      automatedDialogInteractionUsed: false,
    },
    ...(sessionAuthorizationReceipt ? {sessionAuthorizationReceipt} : {}),
    protocol: {
      oneFlaPerColdStartProcess: true,
      openedOnlyWorkingCopy: true,
      openedSourceDirectly: false,
      saveAllowed: false,
      publishAllowed: false,
      closeWithoutSaving: true,
      recursiveRootAndLibraryTimelines: true,
      nativeStagePng: true,
      shippedSwfExecuted: false,
    },
    scripts: {
      auditTemplate: {file: scripts.auditTemplate.file, sha256: scripts.auditTemplate.sha256},
      generatedDependencyAudit: {file: scripts.generatedAudit.file, sha256: scripts.generatedAudit.sha256},
      controller: {file: scripts.controller.file, sha256: scripts.controller.sha256},
    },
    nativeMovie: summary,
    capturedAuthoringFrame: {flashFrame: 1, file: artifacts.png.file, sha256: artifacts.png.sha256, width, height},
    rawAudit: {file: artifacts.report.file, sha256: artifacts.report.sha256},
    controllerMarker: {file: artifacts.marker.file, sha256: artifacts.marker.sha256},
    writeBoundary: {
      root: portable(root, evidenceRoot),
      workOnly: true,
      migrationFilesWritten: false,
      statusFilesWritten: false,
      approvalFilesWritten: false,
    },
  };
  const workEvidenceBytes = Buffer.from(`${JSON.stringify(workEvidence, null, 2)}\n`);
  const workEvidenceFile = await put(root, portable(root, path.join(runDir, "dependency-authoring-audit-evidence.json")),
    workEvidenceBytes);
  const executableBytes = Buffer.from("animate");
  const executable = await put(root, "Applications/Adobe Animate", executableBytes, 0o755);
  const receipt = {
    schemaVersion: 1,
    evidenceKind: "human-assisted-adobe-animate-dependency-authoring-audit-run",
    status: "passed",
    evidenceId: entry.animationId,
    acceptanceEffect: "none; work-only dependency/paired-source authoring audit",
    sourceKind: "paired-fla-swf",
    humanActionBoundary: {
      required: true,
      designatedOperator: operator,
      automatedDialogInteractionUsed: false,
      reviewOrOwnerDecisionRecorded: false,
    },
    ...(sessionAuthorizationReceipt ? {sessionAuthorizationReceipt} : {}),
    source: sourceFla,
    workingCopy: flaCopy,
    shippedSwf: {source: sourceSwf, workingCopy: swfCopy},
    sourceBinding: {file: sourceBindingRef.file, sha256: sourceBindingRef.sha256},
    captureFrame: 1,
    command: {
      executable,
      executableSha256: sha256(executableBytes),
      args: ["--run-jsfl", "-o", scripts.controller.file],
      spawnedAnimateProcessCount: 1,
      intentionallyOmitsQuitFlag: true,
    },
    scripts,
    process: {
      exitCode: 0,
      signal: null,
      timedOut: false,
      durationMs: 100,
      stdout: reference(root, stdoutFile, stdoutBytes),
      stderr: reference(root, stderrFile, stderrBytes),
    },
    artifacts,
    workEvidence: reference(root, workEvidenceFile, workEvidenceBytes),
    postRunVerification: {
      sourceSha256: sourceFla.sha256,
      workingCopySha256: sourceFla.sha256,
      workingCopyReadOnly: true,
      sourceSwfSha256: sourceSwf.sha256,
      stagedSwfSha256: sourceSwf.sha256,
      stagedSwfReadOnly: true,
    },
    migrationOrApprovalWrites: false,
    failure: null,
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  const receiptFile = await put(root, portable(root, path.join(runDir, "assisted-run-result.json")), receiptBytes);
  return {receiptFile, reportFile, workEvidenceFile, receipt};
}

async function createAuthorizedPassingAttempt(context, entry, operator = "Alex Rivera", options = {}) {
  await bindNamedOperator(context, operator);
  const runId = options.runId || "run-pass";
  const sessionAuthorizationReceipt = await bindOneRowAuthorization(context, entry, operator, {runId});
  return createPassingAttempt(context, entry, operator, {...options, runId, sessionAuthorizationReceipt});
}

async function createFailedAttemptWithoutAuthorization(context, entry, operator = "Alex Rivera") {
  const attempt = await createPassingAttempt(context, entry, operator, {runId: "run-failed"});
  const receipt = JSON.parse(await readFile(attempt.receiptFile, "utf8"));
  receipt.status = "failed";
  receipt.process.exitCode = 1;
  receipt.artifacts = null;
  receipt.workEvidence = null;
  receipt.failure = "fixture Animate process failed before an authoring audit was established";
  delete receipt.sessionAuthorizationReceipt;
  await writeFile(attempt.receiptFile, stable(receipt));
  return attempt;
}

test("builds and checks a zero-receipt full-release index without inventing coverage", async () => {
  const context = await fixture();
  const result = await buildLessonAnimateAuthoringAuditIndex(context);
  assert.equal(result.report.summary.selectedReleaseMembers, 3);
  assert.equal(result.report.summary.flaApplicableItems, 2);
  assert.equal(result.report.summary.swfOnlyNotApplicableItems, 1);
  assert.equal(result.report.summary.primaryRowsTouched, 0);
  assert.equal(result.report.summary.totalAttemptReceipts, 0);
  assert.equal(result.report.summary.verifiedWorkOnlyAuthoringAudits, 0);
  assert.equal(result.report.summary.pendingApplicableAuthoringAudits, 2);
  assert.equal(result.report.summary.flaApplicableAuthoringCoverageComplete, false);
  assert.equal(result.report.inputs.operatorReadinessLocator.hashBound, false);
  assert.equal(result.report.authorityBoundary.originalRuntimeBehavior, false);
  assert.equal(result.report.authorityBoundary.strictAcceptance, false);
  assert.deepEqual(result.report.items.map(({status}) => status),
    ["pending-no-run-receipt", "pending-no-run-receipt"]);
  await buildLessonAnimateAuthoringAuditIndex({...context, check: true});
});

test("fails closed when any canonical staging input drifts from its bound current bytes", async (t) => {
  for (const input of ["lessonReleases", "animations", "sourceFreezeManifest"]) {
    await t.test(input, async () => {
      const context = await fixture();
      const file = context.canonicalFiles[input];
      const current = await readFile(file);
      await writeFile(file, Buffer.concat([current, Buffer.from("canonical-drift\n")]));
      await assert.rejects(
        buildLessonAnimateAuthoringAuditIndex(context),
        /canonical|lesson release|animation catalog|source freeze|SHA-256.*stale|stale/iu,
      );
    });
  }
});

test("rejects self-consistent shadow catalogs in place of the exact current canonical paths", async () => {
  const context = await fixture({shadowCanonicalPaths: true});
  await assert.rejects(
    buildLessonAnimateAuthoringAuditIndex(context),
    /exact current canonical path|catalog\/lesson-releases\.json/iu,
  );
});

test("rejects a narrowed or non-atomic release even when queue, staging, and readiness agree", async (t) => {
  await t.test("selected release is narrower than the canonical full release", async () => {
    const context = await fixture({narrowed: true});
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /full release|selectedMemberCount|canonical.*(?:membership|full atomic release)|release membership|narrow/iu,
    );
  });

  await t.test("publication mode is not atomic", async () => {
    const context = await fixture({publicationMode: "rolling"});
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /publicationMode|publication mode|atomic/iu,
    );
  });
});

test("rejects colliding or arbitrary Markdown output paths before either report is written", async (t) => {
  await t.test("Markdown cannot overwrite the JSON commit artifact", async () => {
    const context = await fixture();
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex({...context, markdownReport: context.jsonReport}),
      /distinct|same path|must differ|Markdown.*JSON/iu,
    );
  });

  await t.test("Markdown must use the readiness-declared report pair", async () => {
    const context = await fixture();
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex({
        ...context,
        markdownReport: path.join(context.root, "reports", "unrelated-evidence.md"),
      }),
      /Markdown.*path|expected.*Markdown|report pair|canonical.*Markdown/iu,
    );
  });
});

test("passing receipts require a named assignment and an immutable exact one-row authorization", async (t) => {
  await t.test("no named assignment and no one-row authorization", async () => {
    const context = await fixture();
    await createPassingAttempt(context, context.entries[0], "Alex Rivera");
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /named operator assignment|assignment.*required|session authorization|one-row/iu,
    );
  });

  await t.test("named assignment without a one-row authorization", async () => {
    const context = await fixture();
    await bindNamedOperator(context, "Alex Rivera");
    await createPassingAttempt(context, context.entries[0], "Alex Rivera");
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /session authorization|one-row.*authorization|required.*authorization/iu,
    );
  });

  for (const [label, identityOverride] of [
    ["authorization selects a different animation", {animationId: "fixture-2"}],
    ["authorization selects a different run", {runId: "run-other"}],
  ]) {
    await t.test(label, async () => {
      const context = await fixture();
      const entry = context.entries[0];
      await bindNamedOperator(context, "Alex Rivera");
      const sessionAuthorizationReceipt = await bindOneRowAuthorization(
        context, entry, "Alex Rivera", identityOverride,
      );
      await createPassingAttempt(context, entry, "Alex Rivera", {
        runId: "run-pass",
        sessionAuthorizationReceipt,
      });
      await assert.rejects(
        buildLessonAnimateAuthoringAuditIndex(context),
        /session authorization|one-row.*authorization|authorization.*identity|runId|animationId/iu,
      );
    });
  }
});

test("zero and failed receipts remain legal without assignment or session authorization", async () => {
  const context = await fixture();
  await createFailedAttemptWithoutAuthorization(context, context.entries[0]);
  const result = await buildLessonAnimateAuthoringAuditIndex(context);
  assert.equal(result.report.summary.totalAttemptReceipts, 1);
  assert.equal(result.report.summary.failedAttemptReceipts, 1);
  assert.equal(result.report.summary.verifiedWorkOnlyAuthoringAudits, 0);
  assert.equal(result.report.summary.pendingApplicableAuthoringAudits, 2);
  assert.equal(result.report.summary.flaApplicableAuthoringCoverageComplete, false);
  assert.equal(result.report.items[0].status, "pending-after-failed-audit-attempts");
  assert.equal(result.report.items[0].selectedPassingAudit, null);
});

test("keeps passing-receipt admission closed until the reviewed runner/consumption successor exists", async () => {
  const context = await fixture();
  await createAuthorizedPassingAttempt(context, context.entries[0], "Alex Rivera");
  await assert.rejects(
    buildLessonAnimateAuthoringAuditIndex(context),
    /passing receipt admission remains closed|runner.*authorization.*consumption successor/iu,
  );
});

test("rejects truncated and CRC-invalid PNG artifacts even when every receipt hash is self-consistent", async (t) => {
  await t.test("truncated PNG", async () => {
    const context = await fixture();
    const bytes = png(800, 600).subarray(0, 24);
    await createAuthorizedPassingAttempt(context, context.entries[0], "Alex Rivera", {pngBytes: bytes});
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /PNG.*(?:truncated|decod|CRC)|invalid PNG|IHDR|IEND|corrupt/iu,
    );
  });

  await t.test("bad PNG CRC", async () => {
    const context = await fixture();
    const bytes = Buffer.from(png(800, 600));
    bytes[32] ^= 0x01;
    await createAuthorizedPassingAttempt(context, context.entries[0], "Alex Rivera", {pngBytes: bytes});
    await assert.rejects(
      buildLessonAnimateAuthoringAuditIndex(context),
      /PNG.*(?:CRC|decod)|invalid PNG|corrupt/iu,
    );
  });
});

test("rejects raw authoring-report cardinality mismatches", async (t) => {
  const cases = [
    ["root layerCount", (report) => { report.timeline.layerCount += 1; }],
    ["libraryItemCount", (report) => { report.document.libraryItemCount += 1; }],
    ["layer frameCount", (report) => { report.timeline.layers[0].frameCount += 1; }],
    ["keyframe elementCount", (report) => { report.timeline.layers[0].keyframes[0].elementCount += 1; }],
  ];
  for (const [label, mutateReport] of cases) {
    await t.test(label, async () => {
      const context = await fixture();
      await createAuthorizedPassingAttempt(context, context.entries[0], "Alex Rivera", {mutateReport});
      await assert.rejects(
        buildLessonAnimateAuthoringAuditIndex(context),
        /cardinality|layerCount|libraryItemCount|frameCount|elementCount|array length|does not match/iu,
      );
    });
  }
});

test("fails closed on raw-report tampering and dialog-operator mismatch", async () => {
  const tampered = await fixture();
  const attempt = await createAuthorizedPassingAttempt(tampered, tampered.entries[0], "Alex Rivera");
  await writeFile(attempt.reportFile, "tampered");
  await assert.rejects(buildLessonAnimateAuthoringAuditIndex(tampered), /raw authoring report SHA-256 is stale/u);

  const mismatched = await fixture();
  const mismatchAttempt = await createAuthorizedPassingAttempt(mismatched, mismatched.entries[0], "Alex Rivera");
  const receipt = JSON.parse(await readFile(mismatchAttempt.receiptFile, "utf8"));
  receipt.humanActionBoundary.designatedOperator = "Taylor Morgan";
  await writeFile(mismatchAttempt.receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
  await assert.rejects(
    buildLessonAnimateAuthoringAuditIndex(mismatched),
    /dialog-operator authority boundary differs|dialog operator differs from the bound assignment/u,
  );
});

test("rejects automation identities and run references that escape their receipt directory", async () => {
  const automated = await fixture();
  await createAuthorizedPassingAttempt(automated, automated.entries[0], "Codex");
  await assert.rejects(buildLessonAnimateAuthoringAuditIndex(automated), /named human, not Codex or automation/u);

  const escaped = await fixture();
  const attempt = await createAuthorizedPassingAttempt(escaped, escaped.entries[0], "Alex Rivera");
  const receipt = JSON.parse(await readFile(attempt.receiptFile, "utf8"));
  const outsideBytes = Buffer.from("outside controller");
  const outsideFile = await put(escaped.root, "scripts/outside-controller.jsfl", outsideBytes);
  receipt.scripts.controller = reference(escaped.root, outsideFile, outsideBytes);
  receipt.command.args[2] = receipt.scripts.controller.file;
  await writeFile(attempt.receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
  await assert.rejects(buildLessonAnimateAuthoringAuditIndex(escaped), /controller escapes its allowed root/u);
});

test("rejects operator strings that embed automation tokens instead of naming a human", async (t) => {
  for (const operator of ["Codex Agent", "Automation Team", "CI Bot", "OpenAI agent"]) {
    await t.test(operator, async () => {
      const context = await fixture();
      await createAuthorizedPassingAttempt(context, context.entries[0], operator);
      await assert.rejects(
        buildLessonAnimateAuthoringAuditIndex(context),
        /named human|Codex|automation|automated|bot|agent/iu,
      );
    });
  }
});

test("CLI is read-only in capability and rejects execution or approval controls", () => {
  const parsed = parseArguments(["--release-id", "lesson-g04-l10-fixture", "--check"]);
  assert.equal(parsed.releaseId, "lesson-g04-l10-fixture");
  assert.equal(parsed.check, true);
  for (const forbidden of ["--launch", "--click", "--save", "--publish", "--approve"]) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/u);
  }
});
