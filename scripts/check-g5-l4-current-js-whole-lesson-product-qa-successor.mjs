#!/usr/bin/env node

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {checkFq23QaSuccessor} from
  "./check-g5-l4-current-js-fq23-companion-qa-successor.mjs";
import {
  collectCurrentPackageEvidence,
  validateWholeLessonSuccessorReceipt,
  verifyBinding,
} from "./lib/g5-l4-current-js-qa-successor.mjs";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const DEFAULT_RECEIPT_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4.json";

export async function checkWholeLessonQaSuccessor({
  root = ROOT,
  receiptPath = DEFAULT_RECEIPT_PATH,
} = {}) {
  const receipt = JSON.parse(
    await readFile(path.resolve(root, receiptPath), "utf8"),
  );
  validateWholeLessonSuccessorReceipt(receipt);

  const collected = await collectCurrentPackageEvidence({
    root,
    smokePath: receipt.packageEvidence.smokeReport.path,
  });
  assert.deepEqual(receipt.packageEvidence, collected.evidence);

  const authorizationBytes = await verifyBinding(
    root,
    receipt.authorizationBinding,
  );
  const authorization = JSON.parse(authorizationBytes.toString("utf8"));
  assert.equal(authorization.authorization.currentJsProductQaAuthorized, true);
  assert.equal(
    authorization.authorization.privateControlledCeoPreviewPreparationAuthorized,
    true,
  );
  for (const key of [
    "externalDeploymentAuthorized",
    "publicReleaseAuthorized",
    "originalRuntimeEvidenceEstablished",
    "independentHumanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) assert.equal(authorization.authorization[key], false);
  assert.equal(receipt.authorizationBinding.strictAcceptanceEffect, "none");

  assert.equal(
    receipt.predecessorEvidence.receipt.path,
    "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.json",
  );
  assert.equal(
    receipt.predecessorEvidence.markdown.path,
    "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.md",
  );
  const predecessorBytes = await verifyBinding(
    root,
    receipt.predecessorEvidence.receipt,
  );
  const predecessor = JSON.parse(predecessorBytes.toString("utf8"));
  assert.equal(
    predecessor.receiptId,
    "g5-l4-current-js-whole-lesson-product-qa-2026-07-30",
  );
  assert.equal(
    Object.values(predecessor.acceptanceEffects).every((value) => value === false),
    true,
  );
  await verifyBinding(root, receipt.predecessorEvidence.markdown);

  const child = receipt.childReceipts[0];
  await verifyBinding(root, child);
  const fqResult = await checkFq23QaSuccessor({
    root,
    receiptPath: child.path,
  });
  assert.equal(fqResult.packageId, receipt.packageEvidence.packageId);
  assert.equal(fqResult.predecessorClaimsCarriedForward, false);
  assert.equal(fqResult.strictAcceptanceEffect, "none");

  for (const binding of receipt.sourceBindings) {
    await verifyBinding(root, binding);
  }
  const artifactBytes = new Map();
  for (const binding of receipt.artifacts) {
    artifactBytes.set(binding.path, await verifyBinding(root, binding));
  }
  const markdownPath = receipt.artifacts.find((binding) =>
    binding.role === "human-readable-successor-boundary"
  )?.path;
  assert.equal(typeof markdownPath, "string");
  const markdown = artifactBytes.get(markdownPath).toString("utf8");
  for (const boundary of [
    "not carried forward",
    "acceptance-neutral current-JavaScript private-preview evidence",
    "original-runtime behavior",
    "Owner fidelity acceptance",
    "strict completion",
    "strict **0/55** and unpublished",
  ]) assert.ok(markdown.includes(boundary), `Markdown missing ${boundary}`);

  assert.deepEqual(
    receipt.artifacts
      .filter((binding) => binding.path.endsWith(".png"))
      .map(({path: screenshotPath, bytes, sha256, pixelWidth, pixelHeight}) => ({
        path: screenshotPath,
        bytes,
        sha256,
        pixelWidth,
        pixelHeight,
      })),
    collected.screenshots,
  );

  const releaseLedger = JSON.parse(
    await readFile(path.resolve(root, "catalog/lesson-release-ledger.json"),
      "utf8"),
  );
  const release = releaseLedger.releases.find((candidate) =>
    candidate.releaseId === "lesson-g05-l04-number-lines"
  );
  assert.equal(release.strictCompleteCount, 0);
  assert.equal(release.missingCount, 55);
  assert.equal(release.published, false);

  return Object.freeze({
    receiptId: receipt.receiptId,
    packageId: receipt.packageEvidence.packageId,
    sourceBindingCount: receipt.sourceBindings.length,
    artifactBindingCount: receipt.artifacts.length,
    englishPagesReady: receipt.freshBrowserObservations.englishPagesReady,
    spanishPagesReady: receipt.freshBrowserObservations.spanishPagesReady,
    predecessorClaimsCarriedForward: false,
    strictAcceptanceEffect: "none",
  });
}

function parseReceiptPath(argv) {
  if (argv.length === 0) return DEFAULT_RECEIPT_PATH;
  if (argv.length === 2 && argv[0] === "--receipt") return argv[1];
  throw new Error("Use [--receipt reports/<successor>.json].");
}

if (process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkWholeLessonQaSuccessor({
    receiptPath: parseReceiptPath(process.argv.slice(2)),
  });
  process.stdout.write(
    `G5 L4 current-JS whole-lesson QA successor PASS: ${JSON.stringify(result)}\n`,
  );
}
