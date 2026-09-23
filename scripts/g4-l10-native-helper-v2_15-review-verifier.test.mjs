import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERIFIER = path.join(ROOT, "scripts/g4-l10-native-helper-v2_15-review-verifier.mjs");
const TARGET = path.join(ROOT, "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md");

function invoke(args) {
  const result = spawnSync(process.execPath, [VERIFIER, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
  assert.equal(result.signal, null, `unexpected signal: ${result.signal}`);
  assert.equal(result.stderr, "", `unexpected stderr: ${result.stderr}`);
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(`stdout was not one JSON document: ${error.message}\n${result.stdout}`);
  }
  return { ...result, json };
}

async function tempDirectory() {
  return mkdtemp(path.join(os.tmpdir(), "g4-l10-v215-review-"));
}

async function createReadyPreflight(directory, name = "preflight.json") {
  const output = path.join(directory, name);
  const result = invoke(["preflight", "--output", output]);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.json.status, "READY_FOR_FORMAL_EVIDENCE");
  assert.equal(result.json.canonicalToolSet, true);
  assert.equal(result.json.authorityEffects.implementation, false);
  assert.equal(result.json.authorityEffects.runtimeLaunch, false);
  return { output, result };
}

test("preflight is deterministic, canonical, no-clobber, and outside formal evidence", async () => {
  const directory = await tempDirectory();
  try {
    const first = await createReadyPreflight(directory, "first.json");
    const second = await createReadyPreflight(directory, "second.json");
    assert.deepEqual(first.result.json, second.result.json);
    assert.deepEqual(await readFile(first.output), await readFile(second.output));
    assert.equal(first.result.json.command, "preflight");
    assert.equal(first.result.json.checks.every((entry) => entry.ok), true);
    assert.equal((await stat(first.output)).mode & 0o777, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("tool or syntax-class preflight failure is retryable and does not invalidate the task", async () => {
  const directory = await tempDirectory();
  try {
    const failedOutput = path.join(directory, "failed.json");
    const failed = invoke([
      "preflight",
      "--required-tool",
      path.join(directory, "missing-tool"),
      "--output",
      failedOutput,
    ]);
    assert.equal(failed.status, 2);
    assert.equal(failed.json.status, "PREFLIGHT_RETRYABLE_NOT_EVIDENCE");
    assert.equal(failed.json.command, "preflight");
    assert.equal(failed.json.canonicalToolSet, false);
    assert.equal(failed.json.authorityEffects.implementation, false);
    assert.deepEqual(failed.json, JSON.parse(await readFile(failedOutput, "utf8")));

    const recovered = await createReadyPreflight(directory, "recovered.json");
    assert.equal(recovered.result.json.status, "READY_FOR_FORMAL_EVIDENCE");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("one prevalidated verifier supports independent schema, adversarial, and whole evidence", async () => {
  const directory = await tempDirectory();
  try {
    const preflight = await createReadyPreflight(directory);
    const receipts = [];
    for (const scope of ["schema", "adversarial", "whole"]) {
      const output = path.join(directory, `${scope}.json`);
      const result = invoke([
        "evidence",
        "--scope",
        scope,
        "--preflight-receipt",
        preflight.output,
        "--output",
        output,
      ]);
      assert.equal(result.status, 0, result.stdout);
      assert.equal(result.json.status, "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW");
      assert.equal(result.json.scope, scope);
      assert.equal(result.json.conclusion, "NOT_A_HUMAN_REVIEW_CONCLUSION");
      assert.equal(result.json.qualifyingReviewPass, false);
      assert.equal(result.json.reviewerMustStillEvaluate, true);
      assert.equal(result.json.errors.length, 0);
      assert.equal(result.json.history.status, "STRICT_BUT_NONQUALIFYING_CLOSED");
      assert.equal(result.json.history.verifiedArtifactCount, 17);
      assert.equal(result.json.structures.hmg4al3.verified, true);
      assert.equal(result.json.structures.hmg4pe1.paragraphCount, 42);
      assert.equal(result.json.structures.hmg4pe1.verified, true);
      assert.deepEqual(result.json.targetBefore, result.json.targetAfter);
      assert.equal(Object.values(result.json.authorityEffects).every((value) => value === false), true);
      assert.deepEqual(result.json, JSON.parse(await readFile(output, "utf8")));
      receipts.push(result.json);
    }

    for (const receipt of receipts.slice(1)) {
      assert.deepEqual(receipt.anchors, receipts[0].anchors);
      assert.equal(receipt.targetBefore.sha256, receipts[0].targetBefore.sha256);
      assert.equal(receipt.supportingPreflight.receiptId, receipts[0].supportingPreflight.receiptId);
    }

    const repeated = invoke([
      "evidence",
      "--scope",
      "schema",
      "--preflight-receipt",
      preflight.output,
      "--output",
      path.join(directory, "schema-repeat.json"),
    ]);
    assert.equal(repeated.status, 0, repeated.stdout);
    assert.deepEqual(repeated.json, receipts[0]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a tampered target is evidence mismatch rather than a mechanical retry", async () => {
  const directory = await tempDirectory();
  try {
    const preflight = await createReadyPreflight(directory);
    const tampered = path.join(directory, "tampered-v2.14.md");
    const original = await readFile(TARGET);
    await writeFile(tampered, Buffer.concat([original, Buffer.from("tamper\n")]));
    await chmod(tampered, 0o444);
    const output = path.join(directory, "tampered-evidence.json");
    const result = invoke([
      "evidence",
      "--scope",
      "schema",
      "--target",
      tampered,
      "--preflight-receipt",
      preflight.output,
      "--output",
      output,
    ]);
    assert.equal(result.status, 3, result.stdout);
    assert.equal(result.json.status, "EVIDENCE_INPUT_MISMATCH");
    assert.notEqual(result.json.status, "MECHANICAL_ERROR_RETRYABLE_SAME_REVIEWER");
    assert.equal(result.json.errors.some((entry) => entry.id === "target-original-path"), true);
    assert.equal(result.json.errors.some((entry) => entry.id === "target-before-identity"), true);
    assert.equal(result.json.qualifyingReviewPass, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("invalid or missing preflight never becomes formal verified evidence", async () => {
  const directory = await tempDirectory();
  try {
    const invalid = path.join(directory, "invalid-preflight.json");
    await writeFile(invalid, "{}\n");
    const result = invoke([
      "evidence",
      "--scope",
      "whole",
      "--preflight-receipt",
      invalid,
      "--output",
      path.join(directory, "invalid-evidence.json"),
    ]);
    assert.equal(result.status, 3, result.stdout);
    assert.equal(result.json.status, "EVIDENCE_INPUT_MISMATCH");
    assert.equal(result.json.errors.some((entry) => entry.id === "preflight-receipt-id"), true);

    const usage = invoke([
      "evidence",
      "--scope",
      "whole",
      "--output",
      path.join(directory, "never-created.json"),
    ]);
    assert.equal(usage.status, 64);
    assert.equal(usage.json.status, "USAGE_ERROR");
    assert.equal(usage.json.evidenceConclusion, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an evidence output collision is a disclosed mechanical retry in the same reviewer", async () => {
  const directory = await tempDirectory();
  try {
    const preflight = await createReadyPreflight(directory);
    const collision = path.join(directory, "occupied.json");
    const foreign = Buffer.from("foreign occupant\n");
    await writeFile(collision, foreign);
    const result = invoke([
      "evidence",
      "--scope",
      "adversarial",
      "--preflight-receipt",
      preflight.output,
      "--output",
      collision,
    ]);
    assert.equal(result.status, 70, result.stdout);
    assert.equal(result.json.status, "MECHANICAL_ERROR_RETRYABLE_SAME_REVIEWER");
    assert.equal(result.json.command, "evidence");
    assert.equal(result.json.evidenceConclusion, false);
    assert.deepEqual(await readFile(collision), foreign);

    const retry = invoke([
      "evidence",
      "--scope",
      "adversarial",
      "--preflight-receipt",
      preflight.output,
      "--output",
      path.join(directory, "retry.json"),
    ]);
    assert.equal(retry.status, 0, retry.stdout);
    assert.equal(retry.json.status, "VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
