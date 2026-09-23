#!/usr/bin/env node

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ROOT,
  buildDeepQaSuccessorReceipts,
} from "./build-g5-l4-current-js-deep-qa-successors.mjs";
import {
  PACKAGE_ID,
  verifyBinding,
  validateFqDeepQaSuccessor,
  validateWholeLessonDeepQaSuccessor,
} from "./lib/g5-l4-current-js-deep-qa-successor.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);

async function compareExpectedBytes(root, outputs) {
  for (const item of [outputs.fq, outputs.whole]) {
    for (const [relativePath, expected] of [
      [item.markdownPath, item.markdownBytes],
      [item.jsonPath, item.jsonBytes],
    ]) {
      const actual = await readFile(path.resolve(root, relativePath));
      assert.equal(actual.equals(expected), true, `${relativePath}: byte drift`);
    }
  }
}

async function verifyReceiptBindings(root, receipt) {
  await verifyBinding(root, receipt.authorizationBinding);
  await verifyBinding(root, receipt.predecessorEvidence.receipt);
  await verifyBinding(root, receipt.predecessorEvidence.markdown);
  for (const binding of Object.values(receipt.packageEvidence)) {
    if (binding?.path) await verifyBinding(root, binding);
  }
  for (const key of ["report", "markdown", "runner", "runnerTest"]) {
    await verifyBinding(root, receipt.rawDeepQaEvidence[key]);
  }
  for (const failed of receipt.rawDeepQaEvidence.failedAttempts) {
    await verifyBinding(root, failed.report);
    await verifyBinding(root, failed.markdown);
  }
  for (const binding of receipt.rawDeepQaEvidence.artifactBindings) {
    await verifyBinding(root, binding);
  }
  for (const binding of receipt.sourceBindings) {
    await verifyBinding(root, binding);
  }
  for (const binding of receipt.artifacts) {
    await verifyBinding(root, binding);
  }
}

export async function checkDeepQaSuccessors({root = ROOT} = {}) {
  const outputs = await buildDeepQaSuccessorReceipts({root});
  await compareExpectedBytes(root, outputs);
  const fq = JSON.parse(
    await readFile(path.resolve(root, outputs.fq.jsonPath), "utf8"),
  );
  const whole = JSON.parse(
    await readFile(path.resolve(root, outputs.whole.jsonPath), "utf8"),
  );
  validateFqDeepQaSuccessor(fq);
  validateWholeLessonDeepQaSuccessor(whole);
  await verifyReceiptBindings(root, fq);
  await verifyReceiptBindings(root, whole);
  await verifyBinding(root, whole.childReceipts[0]);

  const releaseLedger = JSON.parse(
    await readFile(
      path.resolve(root, "catalog/lesson-release-ledger.json"),
      "utf8",
    ),
  );
  const release = releaseLedger.releases.find((candidate) =>
    candidate.releaseId === "lesson-g05-l04-number-lines"
  );
  assert.equal(release.strictCompleteCount, 0);
  assert.equal(release.missingCount, 55);
  assert.equal(release.published, false);

  return Object.freeze({
    status: "current-and-byte-exact",
    packageId: PACKAGE_ID,
    fqReceipt: fq.receiptId,
    wholeLessonReceipt: whole.receiptId,
    sourceCurrentAtObservation: false,
    exactReleaseOrderFreshlyEstablished: true,
    layoutObservations: 648,
    reducedMotionRows: 108,
    reducedMotionSamples: 324,
    replayActivations: 324,
    mapSamePageReselectFocusPassed: false,
    currentJavascriptDeepProductQaMachineWorkExhausted: false,
    productQaComplete: false,
    migrationQaComplete: false,
    strictAcceptanceEffect: "none",
  });
}

function parseArguments(argv) {
  if (argv.length === 0) return;
  throw new Error("This checker takes no arguments and checks fixed r5 paths.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  parseArguments(process.argv.slice(2));
  const result = await checkDeepQaSuccessors({root: ROOT});
  process.stdout.write(
    `G5 L4 current-JS deep-QA r5 successors PASS: ${JSON.stringify(result)}\n`,
  );
}
