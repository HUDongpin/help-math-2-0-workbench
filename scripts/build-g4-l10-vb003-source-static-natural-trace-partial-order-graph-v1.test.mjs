import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_RELATIVE,
  buildGraph,
  checkGraph,
  parseArguments,
  publishGraphNoClobber,
} from "./build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.mjs";

test("CLI is report-only and rejects trace, kit, runtime, helper, and mutation modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--launch", "--apply", "--recover", "--write",
    "--create-trace-specs", "--create-kits", "--formalize",
    "--adopt-baseline", "--adopt-specification", "--implement-renderer",
    "--implement-helper", "--test-helper", "--execute-helper", "--install",
    "--accept", "--promote", "--publish"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("graph freezes exact source-static and unresolved set identities", async () => {
  const {document} = await buildGraph(PROJECT_ROOT);
  assert.equal(document.status,
    "SOURCE_STATIC_PARTIAL_ORDER_ONLY_RUNTIME_CAUSALITY_AND_TRACE_SCHEDULE_UNRESOLVED");
  assert.equal(document.decision,
    "DO_NOT_CREATE_FORMAL_NATURAL_TRACE_OR_CAPTURE_KIT_DO_NOT_LAUNCH");
  assert.deepEqual(document.scope.verifiedStaticNodeSet, {
    count: 37,
    sha256: "986360d84d88982dc7e24abca6d770ec7bdc8c4fd7623b85bd3eded176d5bb66",
    encoding:
      "sorted-id-tab-nodeClass-tab-domain-tab-position-tab-sourceIdentity-newline-v1",
  });
  assert.deepEqual(document.scope.verifiedStaticEdgeSet, {
    count: 28,
    sha256: "a3d1115500501abfd387759f04239e8ebf72c897e0a0faf07312f2f90ede311f",
    encoding: "sorted-id-tab-from-tab-to-tab-relationClass-newline-v1",
  });
  assert.deepEqual(document.scope.unresolvedCausalityEdgeSet, {
    count: 17,
    sha256: "d6b938ce5cee972ab6a22d33257b54c44558709e9cd6f954b9e12ade27e05efc",
    encoding: "sorted-id-tab-from-tab-to-tab-relationClass-newline-v1",
  });
  assert.deepEqual(document.scope.unresolvedRuntimeClaimSet, {
    count: 10,
    sha256: "e1918d0c7950f5b49fc0cce356cfbb6ca77f3d744ee32fe73decef8af273eb5b",
    encoding:
      "sorted-id-tab-category-tab-languages-tab-requiredEvidence-newline-v1",
  });
  assert.deepEqual(document.scope.candidateBranchSurfaceSet, {
    count: 11,
    sha256: "fd01c88fa69e5457c48406785ebd0fbbc1097f1e4b56a52a2ca2826bf60ae609",
    encoding: "sorted-id-tab-language-tab-branchClass-newline-v1",
  });
});

test("source-static nodes and edges never become runtime-causality evidence", async () => {
  const {document} = await buildGraph(PROJECT_ROOT);
  assert.equal(document.nodes.length, 37);
  assert.ok(document.nodes.every(({sourceStaticEstablished, runtimeObserved}) =>
    sourceStaticEstablished === true && runtimeObserved === false));
  assert.equal(document.verifiedStaticEdges.length, 28);
  assert.ok(document.verifiedStaticEdges.every((edge) =>
    edge.sourceStaticEstablished === true
    && edge.runtimeCausalityEstablished === false));
  assert.equal(document.unresolvedRuntimeCausalityEdges.length, 17);
  assert.ok(document.unresolvedRuntimeCausalityEdges.every((edge) =>
    edge.candidateOnly === true
    && edge.sourceStaticEstablished === false
    && edge.runtimeCausalityEstablished === false
    && edge.formalTraceEdge === false));
  const nodeIds = new Set(document.nodes.map(({id}) => id));
  assert.ok(nodeIds.has("target:root6-place-sprite120"));
  assert.ok(nodeIds.has("sprite120:stream-head-frame1"));
  assert.ok(nodeIds.has("es:external-mp3-l10vb03"));
  assert.ok(nodeIds.has("unresolved:replay-target"));
});

test("ordering semantics explicitly reject wall-clock, callback, and reachability promotion", async () => {
  const {document} = await buildGraph(PROJECT_ROOT);
  assert.deepEqual(document.orderingSemantics, {
    sourceStaticEdgesEstablishRuntimeCausality: false,
    localFrameOrderEstablishesWallClockTime: false,
    sourceLexicalOrderEstablishesCallbackTime: false,
    staticLabelTargetEstablishesRuntimeReachability: false,
    structuralChildEntryEstablishesNaturalPlayback: false,
    pathBindingEstablishesAudibilityOrSpokenLanguage: false,
    handlerBodyEstablishesRuntimeInvocation: false,
    negativeReplayFindingEstablishesReplayAbsence: false,
  });
  assert.deepEqual(document.scope.sourceStaticObligationAtomSet, {
    count: 10,
    sha256: "19c1b88dc34b6623de13964d145a3238f5ad5ff0264bff1d8b730338812595b3",
    encoding:
      "sorted-id-tab-class-tab-language-tab-sourceIdentity-tab-controlIdentity-tab-evidenceMode-newline-v1",
  });
});

test("eleven branch surfaces remain unordered candidates rather than formal traces", async () => {
  const {document} = await buildGraph(PROJECT_ROOT);
  assert.deepEqual(document.candidateBranchSurfaces.map(({id}) => id), [
    "en-linear-embedded-playthrough",
    "en-interaction-unit",
    "en-interaction-quantity",
    "en-interaction-length",
    "en-replay-reset",
    "es-external-complete-resume",
    "es-external-manual-stop-resume",
    "es-interaction-unit",
    "es-interaction-quantity",
    "es-interaction-length",
    "es-replay-reset",
  ]);
  assert.ok(document.candidateBranchSurfaces.every((branch) =>
    branch.candidateOnly === true
    && branch.formalRequirementCreated === false
    && branch.orderedSteps.length === 0
    && branch.runtimeObserved === false
    && branch.accepted === false));
  assert.equal(document.unresolvedRuntimeClaims.length, 10);
});

test("formalization, security, runtime, listening, and authority remain closed", async () => {
  const {document} = await buildGraph(PROJECT_ROOT);
  assert.deepEqual(document.formalizationBoundary, {
    graphIsFormalTraceSpecification: false,
    candidateBranchesAreFormalRequirements: false,
    authorizedRuntimeEntryEstablished: false,
    exactOrderedNaturalActionsEstablished: false,
    branchSchedulingEstablished: false,
    replaySchedulingEstablished: false,
    interactionCloseOrResumeSchedulingEstablished: false,
    exactAdditionalKitCount: null,
    exactAdditionalSessionCount: null,
    coverageRequirementsCreated: 0,
    orderedNaturalTraceStepsCreated: 0,
    traceSpecsCreated: 0,
    captureKitsCreated: 0,
    migrationFilesModified: false,
    staticSpecificationApplied: false,
    reviewVerdictPresent: false,
  });
  assert.equal(document.currentGateBoundary.latestSecurityBatchHmg4rb4,
    "ab155b63e1ffd8bdf588b0e5b69072e42542dabe99c936adbc1ad8caff289e0a");
  assert.equal(document.currentGateBoundary.latestSecurityBatchStatus,
    "FAILED_ALL_THREE_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(document.currentGateBoundary.latestSecurityBatchReusable, false);
  assert.equal(document.currentGateBoundary.specReviewQualified, false);
  assert.equal(document.currentGateBoundary.launchAuthorizedNow, false);
  assert.equal(document.currentEvidenceState.authoritativeOriginalRuntimeSessions,
    0);
  assert.equal(document.currentEvidenceState.namedHumanListeningSessions, 0);
  assert.equal(document.currentEvidenceState.vb003BaselineComplete, false);
  assert.ok(Object.values(document.authorityEffects).every((value) =>
    value === false));
  assert.equal(document.implementationBoundary.reportPublicationOnly, true);
  for (const [key, value] of Object.entries(document.implementationBoundary)) {
    if (key !== "reportPublicationOnly") assert.equal(value, false, key);
  }
});

test("report publication is immutable no-clobber and check rejects tamper", async () => {
  const bundle = await buildGraph(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-partial-order-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  const result = await publishGraphNoClobber(bundle, {outputRoot: temporaryRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.verifiedStaticNodes, 37);
  assert.equal(result.verifiedStaticEdges, 28);
  assert.equal(result.unresolvedCausalityEdges, 17);
  assert.equal(result.unresolvedRuntimeClaims, 10);
  assert.equal(result.candidateBranchSurfaces, 11);
  assert.equal(result.formalNaturalTraceRequirements, 0);
  await assert.rejects(() => publishGraphNoClobber(bundle,
    {outputRoot: temporaryRoot}), /Target must be absent/u);
  const reportPath = path.join(temporaryRoot, REPORT_RELATIVE);
  await chmod(reportPath, 0o644);
  await writeFile(reportPath, "tampered\n", "utf8");
  await chmod(reportPath, 0o444);
  await assert.rejects(() => checkGraph(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("a pre-publication failure leaves no partial-order graph", async () => {
  const bundle = await buildGraph(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-partial-order-fail-")));
  await mkdir(path.join(temporaryRoot, "reports"), {recursive: true});
  await assert.rejects(() => publishGraphNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeWrite: async () => { throw new Error("simulated report stop"); },
  }), /simulated report stop/u);
  await assert.rejects(() => readFile(path.join(temporaryRoot, REPORT_RELATIVE)),
    /ENOENT/u);
});
