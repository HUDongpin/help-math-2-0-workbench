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
  JSON_OUTPUT_RELATIVE,
  MARKDOWN_OUTPUT_RELATIVE,
  MAX_CHUNK_BYTES,
  PROJECT_ROOT,
  buildLineChunks,
  buildReviewInput,
  checkReviewInput,
  parseArguments,
  publishReviewInputNoClobber,
} from "./build-g4-l10-vb003-static-specification-adopter-readiness-v2-review-input.mjs";

test("CLI freezes review evidence only and rejects task, apply and launch modes", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of [
    "--create-tasks",
    "--apply",
    "--recover",
    "--rollback",
    "--write",
    "--force",
    "--launch",
  ]) assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
});

test("line chunks are contiguous, bounded and exactly reconstructable", () => {
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

test("line chunks reject CR, unterminated input and oversized single lines", () => {
  assert.throws(() => buildLineChunks(Buffer.from("a\r\n"), "crlf.txt"),
    /CR bytes are forbidden/u);
  assert.throws(() => buildLineChunks(Buffer.from("unterminated"),
    "unterminated.txt"), /must end in LF/u);
  assert.throws(() => buildLineChunks(
    Buffer.from(`${"x".repeat(MAX_CHUNK_BYTES)}\n`), "long.txt"),
  /single line exceeds/u);
});

test("real successor freezes thirteen inputs with no task or verdict authority", async () => {
  const bundle = await buildReviewInput(PROJECT_ROOT);
  assert.equal(bundle.document.status,
    "review-input-frozen-no-task-authorization-no-review-verdict");
  assert.equal(bundle.document.reviewUniverse.fileCount, 13);
  assert.equal(bundle.document.reviewUniverse.inputs.length, 13);
  assert.ok(bundle.document.reviewUniverse.inputs.every((input) =>
    input.finalLf === 1 && input.chunks.length > 0));
  assert.ok(bundle.document.reviewUniverse.inputs.flatMap((input) => input.chunks)
    .every((chunk) => chunk.bytes <= MAX_CHUNK_BYTES));
  assert.equal(bundle.document.predecessor.verdictPresent, false);
  assert.equal(bundle.document.adopterReadiness.artifactIsAdopter, false);
  assert.equal(bundle.document.adopterReadiness.applySupported, false);
  assert.equal(bundle.document.reviewTasks.authorized, false);
  assert.equal(bundle.document.reviewTasks.created, false);
  assert.equal(bundle.document.reviewTasks.verdictPresent, false);
  assert.deepEqual(bundle.document.reviewTasks.taskIds, []);
  assert.equal(bundle.document.identitySnapshot.pythonOsListxattrForbidden, true);
  assert.equal(bundle.document.chunkTransport.maximumChunkBytes, 3072);
  assert.ok(Object.values(bundle.document.authorityEffects)
    .every((value) => value === false));
  assert.match(bundle.markdown, /No reviewer task is authorized/u);
});

test("no-clobber publication checks exact bytes and rejects tamper", async () => {
  const bundle = await buildReviewInput(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-readiness-review-v2-"),
  ));
  await mkdir(path.join(temporaryRoot, "reports"),
    {recursive: true, mode: 0o755});
  const result = await publishReviewInputNoClobber(bundle, {
    outputRoot: temporaryRoot,
  });
  assert.equal(result.disposition, "checked");
  assert.equal(result.reviewUniverseFiles, 13);
  assert.equal(result.reviewTaskAuthorized, false);
  assert.equal(result.applySupported, false);
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

test("failure before Markdown preserves partial custody and performs no cleanup", async () => {
  const bundle = await buildReviewInput(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-readiness-review-v2-partial-"),
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
  await assert.rejects(() => readFile(path.join(
    temporaryRoot,
    MARKDOWN_OUTPUT_RELATIVE,
  )), /ENOENT/u);
});
