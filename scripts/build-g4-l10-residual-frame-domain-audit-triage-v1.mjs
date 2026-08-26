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

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-residual-frame-domain-audit-triage-v1.json";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const SUCCESSOR_REMAINING_SHA256 =
  "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852";

const FIXED_INPUTS = Object.freeze({
  releaseCatalog: Object.freeze({
    path: "catalog/lesson-releases.json",
    bytes: 115651,
    sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
    mode: "0644",
  }),
  wave3: Object.freeze({
    path: "reports/g4-l10-post-declaration-static-composites.json",
    bytes: 95598,
    sha256: "1b64902f3806f6939df82c8f62806c1e09101c5f019619e874921be1d7a23ca8",
    mode: "0644",
  }),
  nestedSuccessor: Object.freeze({
    path: "reports/g4-l10-nested-declared-parent-static-composites.json",
    bytes: 263901,
    sha256: "0b31c8f8c9188bb9e2b35010389adf81214a0969a84e5cc969d6e3d09d659c01",
    mode: "0644",
  }),
  ts007Readiness: Object.freeze({
    path: "reports/g4-l10-ts007-sprite64-interactive-disposition-readiness-v1.json",
    bytes: 29331,
    sha256: "4ea042c833cb50061a9dc9067938dc49b751e3103917fdf9cb1a878de4cb4207",
    mode: "0444",
  }),
  templateV6: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json",
    bytes: 237667,
    sha256: "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51",
    mode: "0644",
  }),
  animateControl: Object.freeze({
    path: "reports/g4-l10-animate-authoring-v2-control-readiness-successor.json",
    bytes: 11396,
    sha256: "b61e6b549675ad48ebc84ef16ef369b25c1bf24b53e0847cbe0c8c8c4d8b7175",
    mode: "0644",
  }),
  failedHelperReview: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-487d5f85-failed-v1.json",
    bytes: 8768,
    sha256: "7b07824a378d232e89f46eb744fd572042a455f3203c7e41c2b0b16fda477b1d",
    mode: "0444",
  }),
});

const EXPECTED_GROUPS = Object.freeze([
  Object.freeze({
    id: "scripted-one-frame",
    count: 41,
    flaBacked: 21,
    swfOnly: 20,
    frameCount: 41,
  }),
  Object.freeze({
    id: "dynamic-indirect-parent",
    count: 21,
    flaBacked: 18,
    swfOnly: 3,
    frameCount: 457,
  }),
  Object.freeze({
    id: "shell-complex-lifecycle",
    count: 1,
    flaBacked: 0,
    swfOnly: 1,
    frameCount: 100,
  }),
  Object.freeze({
    id: "direct-root-long-audio",
    count: 7,
    flaBacked: 3,
    swfOnly: 4,
    frameCount: 6509,
  }),
]);

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "traceRegeneration",
  "keyframeRegeneration",
  "runtimePlanRegeneration",
  "authoringAuditAcceptance",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "specificationAcceptance",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  const observed = {
    path: expected.path,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(before),
  };
  if (expected.bytes !== undefined) assert.equal(observed.byteCount, expected.bytes,
    `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(observed.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(observed.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return observed;
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function pairKey(pair) {
  return `${pair.animationId}\t${pair.timelineId}`;
}

function pairSet(pairs) {
  const keys = pairs.map(pairKey).sort(compareText);
  assert.equal(new Set(keys).size, keys.length, "Pair set contains duplicates");
  const encoded = keys.map((key) => `${key}\n`).join("");
  return {
    count: keys.length,
    sha256: sha256(Buffer.from(encoded, "utf8")),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.byteCount,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function inputSetSha256(records) {
  const encoded = [...records].sort((left, right) =>
    compareText(left.path, right.path)).map((record) =>
    `${record.path}\0${record.byteCount}\0${record.sha256}\0${record.mode}\n`).join("");
  return sha256(Buffer.from(encoded, "utf8"));
}

function categorySeedRows(wave3, selectedKeys) {
  const rows = [];
  for (const group of wave3.scriptedReasonGroups) {
    for (const pair of group.pairs) rows.push({
      ...pair,
      categoryId: "scripted-one-frame",
      predecessorReason: group.reason,
    });
  }
  for (const group of wave3.rejectedReasonGroups) {
    for (const pair of group.pairs) {
      if (selectedKeys.has(pairKey(pair))) continue;
      const categoryId = group.reason ===
        "dynamic-movieclip-addressing-present + declared-parent-does-not-have-one-direct-root-placement"
        ? "dynamic-indirect-parent"
        : "shell-complex-lifecycle";
      rows.push({...pair, categoryId, predecessorReason: group.reason});
    }
  }
  for (const blocker of wave3.directRootLongBlockers) rows.push({
    animationId: blocker.animationId,
    timelineId: blocker.timelineId,
    categoryId: "direct-root-long-audio",
    predecessorReason: blocker.disqualifiers.join(" + "),
    predecessorBlocker: blocker,
  });
  return rows;
}

function routeFor(categoryId, flaBacked) {
  const authoringPrefix = flaBacked
    ? "FLA-backed: a separately authorized, work-only authoring audit may add higher-priority structure evidence after the Animate control gate is qualified. "
    : "SWF-only: no FLA authoring route exists. ";
  const routes = {
    "scripted-one-frame":
      "The ActionScript-bearing one-frame child is not scriptless. Preserve unresolved until authoritative natural interaction evidence or higher-priority authoring evidence proves whether its state is exhaustively represented by a parent domain or independently required.",
    "dynamic-indirect-parent":
      "A targeted successor source audit may attempt exact target-control and parent-lifecycle proof. If that proof cannot close dynamic addressing and indirect parent entry, authoritative natural runtime evidence is required.",
    "shell-complex-lifecycle":
      "The shell child combines named incoming identity, dynamic addressing, later placement updates, and removal. It requires exact shell control/lifecycle proof and authoritative natural runtime observation.",
    "direct-root-long-audio":
      "The long named child carries streaming audio and outlives the stopped root window. It requires authoritative natural host continuation/control/audio evidence plus EN/ES listening and synchronization review.",
  };
  return `${authoringPrefix}${routes[categoryId]}`;
}

export async function buildTriage(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const releaseCatalog = parseJson(fixedRecords.releaseCatalog);
  const wave3 = parseJson(fixedRecords.wave3);
  const nestedSuccessor = parseJson(fixedRecords.nestedSuccessor);
  const ts007Readiness = parseJson(fixedRecords.ts007Readiness);
  const templateV6 = parseJson(fixedRecords.templateV6);
  const animateControl = parseJson(fixedRecords.animateControl);
  const failedHelperReview = parseJson(fixedRecords.failedHelperReview);

  const releases = releaseCatalog.releases.filter(({releaseId}) =>
    releaseId === RELEASE_ID);
  assert.equal(releases.length, 1, "Expected one exact L10 release");
  const [release] = releases;
  assert.equal(release.members.length, 47);
  assert.deepEqual(release.members.map(({ordinal}) => ordinal),
    Array.from({length: 47}, (_, index) => index + 1));
  assert.equal(wave3.reportType,
    "g4-l10-post-declaration-static-composite-wave3");
  assert.equal(nestedSuccessor.reportType,
    "g4-l10-nested-declared-parent-static-composite-successor");
  assert.equal(nestedSuccessor.summary.remainingUnresolved, 70);
  assert.deepEqual(nestedSuccessor.exactPairSets.successorRemaining, {
    count: 70,
    sha256: SUCCESSOR_REMAINING_SHA256,
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });

  const selectedPairs = nestedSuccessor.members.flatMap((member) =>
    member.newCompositeClaims.map(({timelineId}) => ({
      animationId: member.animationId,
      timelineId,
    })));
  const selectedSet = pairSet(selectedPairs);
  assert.deepEqual(selectedSet, nestedSuccessor.exactPairSets.selected);
  const selectedKeys = new Set(selectedPairs.map(pairKey));
  const seeds = categorySeedRows(wave3, selectedKeys);
  assert.deepEqual(pairSet(seeds), nestedSuccessor.exactPairSets.successorRemaining);

  const memberRecords = [];
  for (const member of release.members) {
    const base = `migrations/${member.animationId}`;
    const [manifestRecord, dispositionRecord] = await Promise.all([
      stableRead(root, {path: `${base}/migration.json`}),
      stableRead(root, {path: `${base}/audit/frame-domain-disposition.json`}),
    ]);
    const manifest = parseJson(manifestRecord);
    const disposition = parseJson(dispositionRecord);
    assert.equal(manifest.id, member.animationId);
    assert.equal(manifest.assetId, member.assetId);
    assert.equal(manifest.source.swfSha256, member.source.sha256);
    assert.equal(disposition.animationId, member.animationId);
    assert.equal(disposition.generatedFrom.lessonReleaseCatalog.member.ordinal,
      member.ordinal);
    assert.equal(disposition.generatedFrom.lessonReleaseCatalog.member.assetId,
      member.assetId);
    assert.equal(disposition.generatedFrom.lessonReleaseCatalog.member.sourceSha256,
      member.source.sha256);
    memberRecords.push({
      member,
      manifestRecord,
      dispositionRecord,
      manifest,
      disposition,
    });
  }

  const currentUnresolved = memberRecords.flatMap(({member, disposition}) =>
    disposition.timelines.filter(({disposition: value}) => value === "unresolved")
      .map((timeline) => ({
        animationId: member.animationId,
        timelineId: timeline.timelineId,
      })));
  assert.deepEqual(pairSet(currentUnresolved),
    nestedSuccessor.exactPairSets.successorRemaining);
  const currentUnresolvedKeys = new Set(currentUnresolved.map(pairKey));
  const recordsByAnimationId = new Map(memberRecords.map((record) =>
    [record.member.animationId, record]));

  const pairs = seeds.map((seed) => {
    assert.ok(currentUnresolvedKeys.has(pairKey(seed)),
      `${pairKey(seed)} is not currently unresolved`);
    const memberRecord = recordsByAnimationId.get(seed.animationId);
    assert.ok(memberRecord, `${seed.animationId}: release member is missing`);
    const rows = memberRecord.disposition.timelines.filter(({timelineId}) =>
      timelineId === seed.timelineId);
    assert.equal(rows.length, 1, `${pairKey(seed)} must have one disposition row`);
    const [timeline] = rows;
    assert.equal(timeline.disposition, "unresolved");
    const flaBacked = Boolean(memberRecord.manifest.source.flaSha256);
    return {
      animationId: seed.animationId,
      ordinal: memberRecord.member.ordinal,
      assetId: memberRecord.member.assetId,
      sourceSwfSha256: memberRecord.member.source.sha256,
      timelineId: seed.timelineId,
      frameCount: timeline.frameCount,
      currentDisposition: timeline.disposition,
      rootPlacementStatus: timeline.rootPlacement?.status ?? null,
      staticSignals: timeline.staticSignals ?? null,
      categoryId: seed.categoryId,
      predecessorReason: seed.predecessorReason,
      flaBacked,
      pairedFlaStatus: memberRecord.manifest.source.pairedFlaStatus,
      evidenceRoute: routeFor(seed.categoryId, flaBacked),
      canonicalDispositionChangedByThisReport: false,
    };
  }).sort((left, right) =>
    left.ordinal - right.ordinal || compareText(left.timelineId, right.timelineId));
  assert.deepEqual(pairSet(pairs), nestedSuccessor.exactPairSets.successorRemaining);

  const categorySummaries = EXPECTED_GROUPS.map((expected) => {
    const rows = pairs.filter(({categoryId}) => categoryId === expected.id);
    const summary = {
      id: expected.id,
      exactPairSet: pairSet(rows),
      affectedMembers: new Set(rows.map(({animationId}) => animationId)).size,
      count: rows.length,
      flaBacked: rows.filter(({flaBacked}) => flaBacked).length,
      swfOnly: rows.filter(({flaBacked}) => !flaBacked).length,
      frameCount: rows.reduce((total, {frameCount}) => total + frameCount, 0),
    };
    for (const key of ["count", "flaBacked", "swfOnly", "frameCount"]) {
      assert.equal(summary[key], expected[key], `${expected.id}: ${key} drifted`);
    }
    return summary;
  });
  assert.equal(pairs.length, 70);
  assert.equal(new Set(pairs.map(({animationId}) => animationId)).size, 27);
  assert.equal(pairs.filter(({flaBacked}) => flaBacked).length, 42);
  assert.equal(pairs.filter(({flaBacked}) => !flaBacked).length, 28);
  assert.equal(pairs.reduce((total, {frameCount}) => total + frameCount, 0), 7107);

  const dispositionTotals = memberRecords.reduce((totals, {disposition}) => {
    const counts = disposition.summary.dispositionCounts;
    totals.declared += counts["declared-frame-domain"];
    totals.composite += counts["composite-child-with-parent"];
    totals.independentRequired += counts["independent-required"];
    totals.unresolved += counts.unresolved;
    totals.nonvisual += counts.nonvisual;
    totals.excludedNotProven += disposition.summary.excludedNotProvenTimelineCount;
    return totals;
  }, {
    declared: 0,
    composite: 0,
    independentRequired: 0,
    unresolved: 0,
    nonvisual: 0,
    excludedNotProven: 0,
  });
  assert.deepEqual(dispositionTotals,
    nestedSuccessor.summary.afterDispositionTotals);

  assert.equal(ts007Readiness.decision,
    "KEEP_UNRESOLVED_DO_NOT_CLASSIFY_DO_NOT_APPLY");
  assert.equal(ts007Readiness.dispositionConclusion.currentDisposition,
    "unresolved");
  assert.ok(pairs.some(({animationId, timelineId}) =>
    animationId === "course-g04-l10-ts-007" && timelineId === "sprite-64"));
  assert.equal(templateV6.status, "fail-closed-template-not-stable");
  assert.deepEqual(templateV6.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(animateControl.admission.executionAuthorized, false);
  assert.equal(animateControl.blockerCounts.productionOrFormalOpen, 6);
  assert.equal(failedHelperReview.status,
    "FAILED_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.ok(Object.values(failedHelperReview.authorityEffects)
    .every((value) => value === false));

  const workspaceInputRecords = memberRecords.flatMap(({manifestRecord,
    dispositionRecord}) => [manifestRecord, dispositionRecord]);
  const workspaceBindings = memberRecords.map(({member, manifestRecord,
    dispositionRecord}) => ({
    animationId: member.animationId,
    ordinal: member.ordinal,
    manifest: binding(manifestRecord),
    frameDomainDisposition: binding(dispositionRecord),
  }));
  const authorityEffects = Object.fromEntries(
    AUTHORITY_EFFECT_KEYS.map((key) => [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType: "g4-l10-residual-frame-domain-audit-triage-v1",
    status: "residual-unresolved-exactly-enumerated-routed-no-disposition-change",
    decision: "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS",
    releaseId: RELEASE_ID,
    scope: {
      releaseMembers: 47,
      affectedMembers: 27,
      exactResidualPairs: 70,
      exactResidualLocalFrames: 7107,
      flaBackedPairs: 42,
      swfOnlyPairs: 28,
    },
    purpose: [
      "Reconcile the current 70 unresolved frame-domain pairs after the four-pair nested-parent successor.",
      "Route every residual pair to the narrow evidence class that can lawfully advance it without changing a canonical disposition or launching a runtime.",
    ],
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords)
      .map(([key, record]) => [key, binding(record)])),
    workspaceInputSet: {
      fileCount: workspaceInputRecords.length,
      memberCount: workspaceBindings.length,
      sha256: inputSetSha256(workspaceInputRecords),
      encoding: "path-null-bytes-null-sha256-null-mode-newline-v1",
      bindings: workspaceBindings,
    },
    reconciliation: {
      predecessorUnresolved: wave3.exactPairSets.remainingUnresolved,
      selectedToComposite: nestedSuccessor.exactPairSets.selected,
      currentResidual: pairSet(pairs),
      currentDispositionTotals: dispositionTotals,
      allCurrentResidualPairsFoundExactlyOnce: true,
      noExtraCurrentUnresolvedPairs: true,
      noMissingCurrentUnresolvedPairs: true,
    },
    categorySummaries,
    residualPairs: pairs,
    auditRoutingConclusion: {
      genericStaticCompositeAdmissionRemaining: 0,
      rule:
        "Zero means no residual pair is admitted by the exact generic and nested-parent proof contracts already executed; it is not a claim that future higher-priority authoring, targeted source-control, or authoritative-runtime evidence cannot change a disposition.",
      targetedSourceControlSuccessorCandidates:
        categorySummaries.find(({id}) => id === "dynamic-indirect-parent")
          .exactPairSet,
      sourceScriptedNaturalInteractionCandidates:
        categorySummaries.find(({id}) => id === "scripted-one-frame")
          .exactPairSet,
      shellLifecycleCandidates:
        categorySummaries.find(({id}) => id === "shell-complex-lifecycle")
          .exactPairSet,
      naturalHostAudioCandidates:
        categorySummaries.find(({id}) => id === "direct-root-long-audio")
          .exactPairSet,
    },
    detailedGapEvidence: {
      ts007Sprite64: {
        report: binding(fixedRecords.ts007Readiness),
        pair: {
          animationId: "course-g04-l10-ts-007",
          timelineId: "sprite-64",
        },
        disposition: "unresolved",
        reason:
          "direct DoAction and FFDec frame/placed-enterFrame scripts disqualify scriptless classification, while no current evidence proves composite, independent-required, or nonvisual",
      },
    },
    formalProjectionBoundary: {
      currentRawDispositionResidualCount: 70,
      currentFormalRequirementProjectionResidualCount: 74,
      difference: 4,
      reason:
        "The four exact nested-parent transitions are installed in raw disposition/static evidence, but their downstream coverage, trace, keyframe, and runtime-plan projections remain deliberately stale.",
      staleArtifactClasses:
        nestedSuccessor.downstreamBoundary.staleArtifacts,
      downstreamTransactionDecision:
        templateV6.downstreamTransactionBoundary.decision,
      prohibitedTransactionModes:
        templateV6.downstreamTransactionBoundary.prohibitedModes,
      downstreamWritesPerformedByThisReport: 0,
    },
    authoringAndRuntimeBoundary: {
      animateAuthoringControlStatus: animateControl.status,
      animateExecutionAuthorized: false,
      animateProductionOrFormalOpenBlockers:
        animateControl.blockerCounts.productionOrFormalOpen,
      helperReviewStatus: failedHelperReview.status,
      helperReviewReusable: false,
      productionHelperImplementationAuthorized: false,
      originalRuntimeLaunchAuthorized: false,
      authoritativeRuntimeSessions: 0,
      rule:
        "This triage may route a pair to a future authoring or runtime evidence class, but it does not authorize Animate, helper, original-runtime, or capture execution.",
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      canonicalWorkspaceWriteSupported: false,
      applySupported: false,
      recoverSupported: false,
      rollbackSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never write a migration workspace, downstream projection, or source asset`,
    authorityEffects,
    nextPermittedAction:
      "Select one repeated dynamic-indirect-parent pattern and freeze a targeted, hash-bound source-control proof candidate. Keep every affected disposition unresolved unless that successor proves its exact claim; do not launch Animate or original runtime.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const triageFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, triageFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildTriage(bundle.root);
  assert.equal(current.json, bundle.json,
    "G4 L10 residual frame-domain triage inputs changed after derivation");
}

export async function checkTriage(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {
    path: REPORT_RELATIVE,
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "G4 L10 residual frame-domain triage report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    triageFingerprintSha256: bundle.document.triageFingerprintSha256,
    residualPairs: bundle.document.scope.exactResidualPairs,
    affectedMembers: bundle.document.scope.affectedMembers,
    originalRuntimeLaunched: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishTriageNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkTriage(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(
  argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT,
) {
  const mode = parseArguments(argv);
  const bundle = await buildTriage(projectRoot);
  if (mode === "--write-no-clobber") return publishTriageNoClobber(bundle);
  if (mode === "--check") return checkTriage(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    triageFingerprintSha256: bundle.document.triageFingerprintSha256,
    residualPairs: bundle.document.scope.exactResidualPairs,
    affectedMembers: bundle.document.scope.affectedMembers,
    originalRuntimeLaunched: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
