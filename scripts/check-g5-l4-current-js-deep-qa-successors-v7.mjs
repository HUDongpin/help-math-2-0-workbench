#!/usr/bin/env node

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ROOT,
  buildDeepQaSuccessorReceiptsV7,
} from "./build-g5-l4-current-js-deep-qa-successors-v7.mjs";
import {
  PACKAGE_ID,
  RAW_REPORT_PATH,
  verifyBinding,
  validateFqDeepQaSuccessorV7,
  validateWholeLessonDeepQaSuccessorV7,
} from "./lib/g5-l4-current-js-deep-qa-successor-v7.mjs";

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
  for (const key of [
    "smokeReport",
    "archive",
    "archiveSha256",
    "packageManifest",
  ]) await verifyBinding(root, receipt.packageEvidence[key]);
  for (const key of ["report", "markdown", "runner", "runnerTest"]) {
    await verifyBinding(root, receipt.rawDeepQaEvidence[key]);
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

export async function checkDeepQaSuccessorsV7({root = ROOT} = {}) {
  const outputs = await buildDeepQaSuccessorReceiptsV7({root});
  await compareExpectedBytes(root, outputs);
  const fq = JSON.parse(
    await readFile(path.resolve(root, outputs.fq.jsonPath), "utf8"),
  );
  const whole = JSON.parse(
    await readFile(path.resolve(root, outputs.whole.jsonPath), "utf8"),
  );
  validateFqDeepQaSuccessorV7(fq);
  validateWholeLessonDeepQaSuccessorV7(whole);
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
    rawInput: RAW_REPORT_PATH,
    fqReceipt: fq.receiptId,
    wholeLessonReceipt: whole.receiptId,
    sourceCurrentAtObservation: true,
    sourceCurrentAtSuccessorAssembly: true,
    exactReleaseOrderFreshlyEstablished: true,
    layoutObservations: 648,
    reducedMotionRows: 108,
    reducedMotionSamples: 324,
    replayActivations: 324,
    allFourPredecessorFindingsFreshV7Resolved: true,
    mapSamePageReselectFocusPassed: true,
    currentJavascriptDeepProductQaMachineWorkExhausted: true,
    productQaComplete: false,
    migrationQaComplete: false,
    strictAcceptanceEffect: "none",
  });
}

export function parseArguments(argv) {
  if (argv.length === 0) return "check";
  throw new Error("This checker takes no arguments and checks fixed r6 paths.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  parseArguments(process.argv.slice(2));
  const result = await checkDeepQaSuccessorsV7({root: ROOT});
  process.stdout.write(
    `G5 L4 current-JS deep-QA r6 successors PASS: ${JSON.stringify(result)}\n`,
  );
}
