import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  INPUTS,
  JSON_OUTPUT_RELATIVE,
  MARKDOWN_OUTPUT_RELATIVE,
  MAX_CHUNK_BYTES,
  PROJECT_ROOT,
  buildLineChunks,
  buildReviewInput,
  checkReviewInput,
  parseArguments,
  publishReviewInputNoClobber,
} from "./build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.mjs";

test("CLI exposes only dry-run, immutable write and check", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]),
    "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of [
    "--apply",
    "--recover",
    "--review",
    "--create-task",
    "--formalize",
    "--trace",
    "--create-kit",
    "--implement-helper",
    "--launch",
    "--write",
    "--force",
  ]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("line chunking is contiguous, bounded and reconstructable", () => {
  const bytes = Buffer.from([
    "alpha\n",
    "b".repeat(1000), "\n",
    "c".repeat(2200), "\n",
    "omega\n",
  ].join(""));
  const chunks = buildLineChunks(bytes, "fixture.txt", MAX_CHUNK_BYTES);
  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.bytes <= MAX_CHUNK_BYTES));
  assert.equal(chunks[0].startOffset, 0);
  assert.equal(chunks.at(-1).endOffsetExclusive, bytes.length);
  assert.deepEqual(Buffer.concat(chunks.map((chunk) =>
    bytes.subarray(chunk.startOffset, chunk.endOffsetExclusive))), bytes);
  for (let index = 1; index < chunks.length; index += 1) {
    assert.equal(chunks[index - 1].endOffsetExclusive,
      chunks[index].startOffset);
    assert.equal(chunks[index - 1].lastLine + 1,
      chunks[index].firstLine);
  }
});

test("line chunking rejects long, unterminated and CR-bearing input", () => {
  assert.throws(() => buildLineChunks(
    Buffer.from(`${"x".repeat(MAX_CHUNK_BYTES)}\n`), "long.txt"),
  /single line exceeds/u);
  assert.throws(() => buildLineChunks(Buffer.from("unterminated"),
    "unterminated.txt"), /must end in LF/u);
  assert.throws(() => buildLineChunks(Buffer.from("a\r\n"), "crlf.txt"),
    /CR bytes are forbidden/u);
});

test("real review input freezes the exact eight-file 322169-byte universe",
  async () => {
    const bundle = await buildReviewInput(PROJECT_ROOT);
    assert.equal(bundle.document.status,
      "REVIEW_INPUT_FROZEN_NO_REVIEW_TASK_NO_VERDICT_NO_RUNTIME_AUTHORITY");
    assert.equal(bundle.document.reviewUniverse.fileCount, 8);
    assert.equal(bundle.document.reviewUniverse.totalBytes, 322169);
    assert.deepEqual(bundle.document.reviewUniverse.inputs.map((input) =>
      input.path), INPUTS.map((input) => input.path));
    assert.ok(bundle.document.reviewUniverse.inputs.every((input) =>
      input.chunks.length > 0 && input.finalLf === 1));
    assert.ok(bundle.document.reviewUniverse.inputs.flatMap((input) =>
      input.chunks).every((chunk) => chunk.bytes <= MAX_CHUNK_BYTES));
    assert.ok(bundle.document.chunkTransport.maximumObservedChunkBytes <=
      MAX_CHUNK_BYTES);
    assert.equal(bundle.document.chunkTransport.freezeOccursBeforeAnyFutureTaskCreation,
      true);
    assert.match(bundle.document.reviewUniverse.setSha256,
      /^[a-f0-9]{64}$/u);
    assert.match(bundle.document.chunkTransport.chunkSetSha256,
      /^[a-f0-9]{64}$/u);
  });

test("graph and latest security failure remain exact and fail closed",
  async () => {
    const {document, markdown} = await buildReviewInput(PROJECT_ROOT);
    assert.deepEqual(Object.fromEntries(Object.entries(
      document.graphBinding.exactSets).map(([name, value]) =>
      [name, value.count])), {
      sourceStaticObligationAtomSet: 10,
      verifiedStaticNodeSet: 37,
      verifiedStaticEdgeSet: 28,
      unresolvedCausalityEdgeSet: 17,
      unresolvedRuntimeClaimSet: 10,
      candidateBranchSurfaceSet: 11,
    });
    assert.equal(document.graphBinding.orderingSemanticsAllFalse, true);
    assert.equal(
      document.graphBinding.sourceStaticEdgesEstablishRuntimeCausality,
      false);
    assert.equal(
      document.graphBinding.historicalSecurityBoundaryIsCurrentAuthority,
      false);
    assert.equal(document.graphBinding.latestSecurityFailure.status,
      "FAILED_TWO_TASK_SYSTEM_INCOMPLETE_ONE_P1_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
    assert.equal(
      document.graphBinding.latestSecurityFailure.specReviewQualified, false);
    assert.equal(
      document.graphBinding.latestSecurityFailure.productionHelperImplementationEligible,
      false);
    assert.equal(document.graphBinding.latestSecurityFailure.reusable, false);
    assert.deepEqual(document.graphBinding.latestSecurityFailure.wholeP0P1P2,
      [0, 1, 0]);
    assert.match(markdown, /failed, nonreusable/u);
  });

test("formalization, task, runtime and acceptance authority stay closed",
  async () => {
    const {document} = await buildReviewInput(PROJECT_ROOT);
    assert.deepEqual(document.reviewScopes.map((scope) => scope.scope), [
      "schema-lineage",
      "causality-adversarial",
      "whole",
    ]);
    assert.deepEqual(document.reviewTasks, {
      authorized: false,
      created: false,
      taskIds: [],
      batchId: null,
      verdictPresent: false,
      independentReviewRequiredBeforeAnyFormalization: true,
    });
    assert.equal(document.formalizationBoundary.coverageRequirementsCreated, 0);
    assert.equal(document.formalizationBoundary.orderedNaturalTraceStepsCreated,
      0);
    assert.equal(document.formalizationBoundary.traceSpecsCreated, 0);
    assert.equal(document.formalizationBoundary.captureKitsCreated, 0);
    assert.equal(document.formalizationBoundary.originalRuntimeSessionsCreated,
      0);
    assert.equal(document.formalizationBoundary.originalRuntimeFramesCreated, 0);
    assert.equal(document.runtimeEvidenceState.currentRootVisualKitCount, 2);
    assert.equal(document.runtimeEvidenceState.currentNaturalTraceKitCount, 0);
    assert.equal(document.runtimeEvidenceState.authoritativeOriginalRuntimeSessions,
      0);
    assert.equal(document.runtimeEvidenceState.authoritativeOriginalRuntimeFrames,
      0);
    assert.equal(document.runtimeEvidenceState.namedHumanListeningSessions, 0);
    assert.equal(document.runtimeEvidenceState.vb003BaselineComplete, false);
    assert.ok(Object.values(document.authorityEffects).every((value) =>
      value === false));
    assert.equal(document.decision,
      "DO_NOT_TREAT_GRAPH_AS_INDEPENDENTLY_REVIEWED_DO_NOT_FORMALIZE_DO_NOT_LAUNCH");
  });

test("every declared chunk reconstructs its bound input exactly", async () => {
  const {document} = await buildReviewInput(PROJECT_ROOT);
  for (const input of document.reviewUniverse.inputs) {
    const bytes = await readFile(path.join(PROJECT_ROOT, input.path));
    const reconstructed = Buffer.concat(input.chunks.map((chunk) =>
      bytes.subarray(chunk.startOffset, chunk.endOffsetExclusive)));
    assert.deepEqual(reconstructed, bytes);
    assert.equal(reconstructed.length, input.bytes);
  }
});

test("no-clobber publication checks exact bytes and rejects tamper", async () => {
  const bundle = await buildReviewInput(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-graph-review-input-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishReviewInputNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.reviewTaskAuthorized, false);
  assert.equal(result.originalRuntimeAuthority, false);
  assert.equal(result.productionHelperAuthority, false);
  await assert.rejects(() => publishReviewInputNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /already exists; refusing overwrite/u);
  const jsonPath = path.join(temporaryRoot, JSON_OUTPUT_RELATIVE);
  await chmod(jsonPath, 0o644);
  await writeFile(jsonPath, "foreign replacement\n", "utf8");
  await chmod(jsonPath, 0o444);
  await assert.rejects(() => checkReviewInput(bundle, temporaryRoot),
    /Input byte count drifted|Input SHA-256 drifted/u);
});

test("pre-Markdown failure preserves attributable partial custody", async () => {
  const bundle = await buildReviewInput(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-graph-review-input-partial-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  await assert.rejects(() => publishReviewInputNoClobber(bundle, {
    outputRoot: temporaryRoot,
    beforeMarkdown: async () => {
      throw new Error("simulated exact-input drift");
    },
  }), /simulated exact-input drift/u);
  assert.deepEqual(await readdir(path.join(temporaryRoot, "reports")), [
    path.basename(JSON_OUTPUT_RELATIVE),
  ]);
  assert.doesNotReject(async () => JSON.parse(await readFile(
    path.join(temporaryRoot, JSON_OUTPUT_RELATIVE), "utf8")));
  await assert.rejects(() => publishReviewInputNoClobber(bundle, {
    outputRoot: temporaryRoot,
  }), /already exists; refusing overwrite/u);
  await assert.rejects(() => readFile(
    path.join(temporaryRoot, MARKDOWN_OUTPUT_RELATIVE)), /ENOENT/u);
});
