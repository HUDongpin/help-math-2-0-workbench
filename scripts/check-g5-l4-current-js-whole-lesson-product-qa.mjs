#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {checkFq23CompanionQaReceipt} from
  "./check-g5-l4-current-js-fq23-companion-qa.mjs";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const RECEIPT_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.json";
export const MARKDOWN_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.md";

const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

function within(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function verifyBinding(root, binding) {
  assert.equal(typeof binding?.path, "string");
  assert.equal(path.isAbsolute(binding.path), false);
  assert.equal(binding.path.includes("\\"), false);
  assert.match(binding.sha256, /^[0-9a-f]{64}$/);
  assert.equal(Number.isSafeInteger(binding.bytes), true);
  assert.equal(binding.bytes > 0, true);
  const absolutePath = path.resolve(root, binding.path);
  assert.equal(within(root, absolutePath), true);
  const [metadata, canonicalRoot, canonicalPath] = await Promise.all([
    lstat(absolutePath),
    realpath(root),
    realpath(absolutePath),
  ]);
  assert.equal(metadata.isFile(), true);
  assert.equal(metadata.isSymbolicLink(), false);
  assert.equal(within(canonicalRoot, canonicalPath), true);
  const bytes = await readFile(absolutePath);
  assert.equal(bytes.byteLength, binding.bytes, `${binding.path}: byte drift`);
  assert.equal(sha256(bytes), binding.sha256, `${binding.path}: hash drift`);
  if (binding.path.endsWith(".png")) {
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), binding.pixelWidth);
    assert.equal(bytes.readUInt32BE(20), binding.pixelHeight);
  }
  return bytes;
}

export function validateWholeLessonQaReceipt(receipt) {
  assert.equal(receipt?.schemaVersion, 1);
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-whole-lesson-local-browser-qa-receipt",
  );
  assert.equal(
    receipt.receiptId,
    "g5-l4-current-js-whole-lesson-product-qa-2026-07-30",
  );
  assert.equal(receipt.releaseId, "lesson-g05-l04-number-lines");
  assert.deepEqual(
    {
      releaseMembers: receipt.scope.releaseMembers,
      activePages: receipt.scope.activePages,
      courseShells: receipt.scope.courseShells,
      networkBoundary: receipt.scope.networkBoundary,
      previewClass: receipt.scope.previewClass,
      g4L3Port3216Touched: receipt.scope.g4L3Port3216Touched,
      externalDeploymentPerformed: receipt.scope.externalDeploymentPerformed,
    },
    {
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
  );
  assert.equal(
    receipt.authorizationBinding.path,
    "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json",
  );
  assert.equal(receipt.authorizationBinding.strictAcceptanceEffect, "none");

  const result = receipt.scopeResult;
  for (const key of [
    "currentJavascriptWholeLessonProductQaPassed",
    "exactEnglishReleaseTraversalPassed",
    "exactSpanishReleaseTraversalPassed",
    "nativeStageAndCanvasIdentityPassed",
    "responsiveNoHorizontalOverflowPassed",
    "reducedMotionTraversalPassed",
    "courseMapInteractionPassed",
    "keyTermsInteractionPassed",
    "consolePageAndNetworkFailureBoundaryPassed",
    "controlledPreviewNoindexHeadersPassed",
  ]) {
    assert.equal(result[key], true, `${key} must pass`);
  }
  assert.equal(result.developmentCacheControlPrivateNoStorePassed, false);
  assert.equal(result.productQaComplete, false);

  assert.deepEqual(
    [
      receipt.observations.englishDesktop.readyPages,
      receipt.observations.englishDesktop.uniquePages,
      receipt.observations.spanishMobile.readyPages,
      receipt.observations.spanishMobile.uniquePages,
      receipt.observations.reducedMotion.readyPages,
    ],
    [54, 54, 54, 54, 54],
  );
  assert.equal(receipt.observations.englishDesktop.nativeStageWidth, 800);
  assert.equal(receipt.observations.englishDesktop.nativeStageHeight, 600);
  assert.equal(receipt.observations.spanishMobile.horizontalOverflow, false);
  assert.equal(
    receipt.observations.spanishMobile.fixedEnglishSourceVisualMembers,
    54,
  );
  assert.equal(
    receipt.observations.spanishMobile.spanishSourceVisualParityEstablished,
    false,
  );
  assert.equal(receipt.observations.courseMap.pageEntries, 54);
  assert.equal(receipt.observations.courseMap.sectionEntries, 8);
  assert.equal(receipt.observations.keyTerms.englishReadyEntries, 761);
  assert.equal(receipt.observations.keyTerms.spanishReadyEntries, 753);
  assert.equal(receipt.observations.keyTerms.missingLessonXmlRecovered, false);
  assert.equal(receipt.observations.headers.status, 200);
  assert.equal(
    receipt.observations.headers.xHelpmathControlledPreview,
    "g5-l4-ceo-preview",
  );
  assert.equal(
    receipt.observations.headers.cacheControlObserved,
    "no-cache, must-revalidate",
  );

  assert.deepEqual(
    {
      consoleErrors: receipt.browserDriver.console.errors,
      pageErrors: receipt.browserDriver.pageErrorCount,
      failedRequests:
        receipt.browserDriver.networkInventory.failedRequestCount,
      badHttpResponses:
        receipt.browserDriver.networkInventory.badHttpResponseCount,
      nonLoopbackRequests:
        receipt.browserDriver.networkInventory.nonLoopbackRequestCount,
    },
    {
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      badHttpResponses: 0,
      nonLoopbackRequests: 0,
    },
  );
  assert.equal(receipt.browserDriver.observedTraversalSweeps, 3);
  assert.equal(receipt.browserDriver.minimumPageStateVisits, 162);
  assert.equal(receipt.childReceipts.length, 1);
  assert.equal(receipt.sourceBindings.length, 14);
  assert.equal(receipt.artifacts.length, 2);
  assert.equal(
    Object.values(receipt.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.equal(receipt.acceptanceEffects.productQaComplete, false);
  assert.equal(receipt.acceptanceEffects.strictComplete, false);
  assert.equal(receipt.acceptanceEffects.published, false);
  return true;
}

export async function checkWholeLessonQaReceipt({root = ROOT} = {}) {
  const receiptBytes = await readFile(path.resolve(root, RECEIPT_PATH));
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  validateWholeLessonQaReceipt(receipt);

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
  assert.equal(authorization.authorization.externalDeploymentAuthorized, false);
  assert.equal(authorization.authorization.publicReleaseAuthorized, false);
  assert.equal(authorization.authorization.strictCompletionEstablished, false);
  assert.equal(authorization.authorization.publicationAuthorized, false);

  await Promise.all([
    ...receipt.childReceipts.map((binding) => verifyBinding(root, binding)),
    ...receipt.sourceBindings.map((binding) => verifyBinding(root, binding)),
    ...receipt.artifacts.map((binding) => verifyBinding(root, binding)),
  ]);
  await checkFq23CompanionQaReceipt({root});

  const [englishGlossary, spanishGlossary, releaseLedger, markdown] =
    await Promise.all([
      readFile(path.resolve(
        root,
        "apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json",
      ), "utf8"),
      readFile(path.resolve(
        root,
        "apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json",
      ), "utf8"),
      readFile(path.resolve(root, "catalog/lesson-release-ledger.json"), "utf8"),
      readFile(path.resolve(root, MARKDOWN_PATH), "utf8"),
    ]);
  assert.equal(JSON.parse(englishGlossary).terms.length, 761);
  assert.equal(JSON.parse(spanishGlossary).terms.length, 753);
  const release = JSON.parse(releaseLedger).releases.find(
    (candidate) => candidate.releaseId === "lesson-g05-l04-number-lines",
  );
  assert.equal(release.strictCompleteCount, 0);
  assert.equal(release.published, false);
  assert.match(markdown, /EN desktop: \*\*54\/54\*\*/);
  assert.match(markdown, /ES mobile at \*\*390×844\*\*: \*\*54\/54\*\*/);
  assert.match(markdown, /G5 L4 remains strict \*\*0\/55\*\* and unpublished/);
  return {
    receiptId: receipt.receiptId,
    sourceBindingCount: receipt.sourceBindings.length,
    artifactBindingCount: receipt.artifacts.length,
    pageStateVisitFloor: receipt.browserDriver.minimumPageStateVisits,
    strictAcceptanceEffect: "none",
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await checkWholeLessonQaReceipt();
  console.log(
    `G5 L4 current-JS whole-lesson product QA receipt PASS: ${JSON.stringify(result)}`,
  );
}
