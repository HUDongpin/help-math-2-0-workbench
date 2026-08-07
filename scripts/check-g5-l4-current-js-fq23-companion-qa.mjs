import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const RECEIPT_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.json";

const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

async function verifyBinding(root, binding) {
  assert.equal(typeof binding.path, "string");
  assert.match(binding.sha256, /^[0-9a-f]{64}$/);
  assert.equal(Number.isSafeInteger(binding.bytes), true);
  const bytes = await readFile(resolve(root, binding.path));
  assert.equal(bytes.byteLength, binding.bytes, `${binding.path} byte drift`);
  assert.equal(sha256(bytes), binding.sha256, `${binding.path} hash drift`);
  if (binding.path.endsWith(".png")) {
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), binding.pixelWidth);
    assert.equal(bytes.readUInt32BE(20), binding.pixelHeight);
  }
  return bytes;
}

export async function checkFq23CompanionQaReceipt({root = ROOT} = {}) {
  const receipt = JSON.parse(
    await readFile(resolve(root, RECEIPT_PATH), "utf8"),
  );
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-fq23-companion-local-browser-qa-receipt",
  );
  assert.equal(receipt.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(receipt.scope.route, "http://127.0.0.1:3231/en/courses/5/4");
  assert.equal(receipt.scope.networkBoundary, "loopback-only-local-preview");
  assert.equal(receipt.scope.previewClass, "private-controlled-ceo-preview");
  assert.deepEqual(receipt.scope.members, [
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
  ]);
  assert.equal(receipt.scope.g4L3Port3216Touched, false);
  assert.equal(receipt.scope.externalDeploymentPerformed, false);

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
  assert.equal(authorization.authorization.originalRuntimeEvidenceEstablished, false);
  assert.equal(authorization.authorization.independentHumanReviewAccepted, false);
  assert.equal(authorization.authorization.ownerFidelityAcceptanceEstablished, false);
  assert.equal(authorization.authorization.strictCompletionEstablished, false);
  assert.equal(authorization.authorization.publicationAuthorized, false);
  assert.equal(receipt.authorizationBinding.strictAcceptanceEffect, "none");

  assert.equal(receipt.browserDriver.workflow, "playwright-cli-first");
  assert.equal(receipt.browserDriver.console.errors, 0);
  assert.equal(receipt.browserDriver.console.warnings, 0);
  assert.deepEqual(receipt.browserDriver.networkInventory, {
    recordedRequestCount: 75,
    http200Count: 75,
    failedRequestCount: 0,
    nonLoopbackRequestCount: 0,
  });
  assert.ok(
    Object.values(receipt.scopeResult).every((value) => value === true),
    "every narrowly scoped current-JS FQ23 QA result must pass",
  );

  const fq002 = receipt.observations["course-g05-l04-fq-002"];
  const fq003 = receipt.observations["course-g05-l04-fq-003"];
  assert.deepEqual(fq002.questionOrder, [5, 1, 6, 4, 11, 13, 14, 15, 9, 12]);
  assert.equal(new Set(fq002.questionOrder).size, 10);
  assert.equal(fq002.correctCount, 10);
  assert.equal(fq002.scoreText, "Score: 10 / 10");
  assert.equal(fq002.gradeText, "Source grade: Advanced");
  assert.equal(fq002.replaySelectedRadioCount, 0);
  assert.equal(fq002.replayFirstQuestion, 5);
  assert.equal(fq002.exactAvm1RandomOrderEstablished, false);
  assert.deepEqual(
    fq003.questionOrder,
    Array.from({length: 18}, (_, index) => index + 1),
  );
  assert.equal(new Set(fq003.questionOrder).size, 18);
  assert.equal(fq003.correctCount, 18);
  assert.equal(fq003.scoreText, "Score: 18 / 18");
  assert.equal(fq003.gradeText, "Source grade: Advanced");
  assert.equal(fq003.replaySelectedRadioCount, 0);
  assert.equal(fq003.replayFirstQuestion, 1);
  for (const observation of [fq002, fq003]) {
    assert.equal(observation.companionHostCount, 1);
    assert.equal(observation.companionVisible, true);
    assert.equal(observation.documentVerticallyScrollable, true);
    assert.equal(observation.reviewPreviousReturnedToFirst, true);
    assert.equal(observation.replayQuestionPosition, 1);
  }

  assert.deepEqual(
    receipt.focusedTests.map(({passed, failed}) => ({passed, failed})),
    [{passed: 10, failed: 0}, {passed: 2, failed: 0}],
  );
  const allBindings = [
    ...receipt.sourceBindings,
    ...receipt.artifacts,
  ];
  assert.equal(
    new Set(allBindings.map((binding) => binding.path)).size,
    allBindings.length,
    "receipt bindings must be unique",
  );
  const verifiedBytes = new Map();
  for (const binding of allBindings) {
    verifiedBytes.set(binding.path, await verifyBinding(root, binding));
  }

  const player = verifiedBytes.get(
    "apps/web/components/descriptor-driven-whole-lesson-player.tsx",
  ).toString("utf8");
  assert.match(player, /currentPage\.animationId === 'course-g05-l04-fq-002'/);
  assert.match(player, /currentPage\.animationId === 'course-g05-l04-fq-003'/);
  assert.equal(
    (player.match(
      /pageInteractionCompanionTargetId=\{pageInteractionCompanionTargetId\}/g,
    ) ?? []).length,
    2,
  );
  const shell = verifiedBytes.get(
    "apps/web/components/legacy-responsive-lesson-shell.tsx",
  ).toString("utf8");
  assert.match(shell, /data-page-interaction-companion-host="true"/);
  assert.match(shell, /id=\{pageInteractionCompanionTargetId\}/);
  const renderer = verifiedBytes.get(
    "packages/demos/src/g5-l4-fq23-question-atlas-candidate.tsx",
  ).toString("utf8");
  assert.match(renderer, /createPortal\(companion, companionTarget\)/);
  assert.match(renderer, /data-current-javascript-question-companion="true"/);
  const css = verifiedBytes.get("apps/web/app/globals.css").toString("utf8");
  assert.match(css, /\.g5-l4-fq23-question-companion\s*\{/);

  assert.ok(
    Object.values(receipt.acceptanceEffects).every((value) => value === false),
    "strict and release effects must remain false",
  );
  assert.equal(receipt.acceptanceEffects.productQaComplete, false);
  assert.equal(receipt.acceptanceEffects.originalRuntimeEvidenceEstablished, false);
  assert.equal(receipt.acceptanceEffects.independentHumanVisualReviewAccepted, false);
  assert.equal(receipt.acceptanceEffects.ownerFidelityAcceptanceEstablished, false);
  assert.equal(receipt.acceptanceEffects.strictMigrationComplete, false);
  assert.equal(receipt.acceptanceEffects.externalDeploymentAuthorized, false);
  assert.equal(receipt.acceptanceEffects.publicReleaseAuthorized, false);
  assert.equal(receipt.acceptanceEffects.published, false);

  const markdown = verifiedBytes.get(
    "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.md",
  ).toString("utf8");
  const normalizedMarkdown = markdown
    .replace(/^>\s?/gm, "")
    .replace(/\s+/g, " ");
  for (const boundary of [
    "not original runtime evidence",
    "independent human review",
    "Owner fidelity acceptance",
    "strict completion",
    "publication approval",
  ]) assert.ok(
    normalizedMarkdown.includes(boundary),
    `Markdown missing ${boundary}`,
  );
  for (const screenshot of receipt.artifacts.filter(({path}) =>
    path.endsWith(".png"))) {
    assert.ok(markdown.includes(screenshot.path));
    assert.ok(markdown.includes(screenshot.sha256));
  }

  return Object.freeze({
    receiptId: receipt.receiptId,
    sourceBindingCount: receipt.sourceBindings.length,
    artifactBindingCount: receipt.artifacts.length,
    browserMemberCount: Object.keys(receipt.observations).length,
    focusedTestPassCount: receipt.focusedTests.reduce(
      (total, result) => total + result.passed,
      0,
    ),
    strictAcceptanceEffect: "none",
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkFq23CompanionQaReceipt();
  process.stdout.write(
    `G5 L4 current-JS FQ23 companion QA receipt PASS: ${JSON.stringify(result)}\n`,
  );
}
