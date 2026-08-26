import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  checkWholeLessonQaReceipt,
  MARKDOWN_PATH,
  RECEIPT_PATH,
  ROOT,
  validateWholeLessonQaReceipt,
} from "./check-g5-l4-current-js-whole-lesson-product-qa.mjs";

test("the dated whole-lesson QA receipt remains acceptance-neutral but is superseded as current evidence", async () => {
  const receipt = JSON.parse(
    await readFile(path.resolve(ROOT, RECEIPT_PATH), "utf8"),
  );
  validateWholeLessonQaReceipt(receipt);
  assert.ok(
    Object.values(receipt.acceptanceEffects).every((value) => value === false),
  );
  await assert.rejects(
    checkWholeLessonQaReceipt(),
    /(?:byte|hash) drift/,
  );
});

test("whole-lesson QA validator rejects cache, parity, strict, and publication promotion", async () => {
  const original = JSON.parse(
    await readFile(path.resolve(ROOT, RECEIPT_PATH), "utf8"),
  );
  for (const mutate of [
    (receipt) => {
      receipt.scopeResult.developmentCacheControlPrivateNoStorePassed = true;
    },
    (receipt) => {
      receipt.observations.spanishMobile.spanishSourceVisualParityEstablished =
        true;
    },
    (receipt) => {
      receipt.acceptanceEffects.strictComplete = true;
    },
    (receipt) => {
      receipt.acceptanceEffects.published = true;
    },
    (receipt) => {
      receipt.scope.externalDeploymentPerformed = true;
    },
  ]) {
    const forged = structuredClone(original);
    mutate(forged);
    assert.throws(() => validateWholeLessonQaReceipt(forged));
  }
});

test("human-readable QA receipt discloses fixed-English ES visuals and the dev cache caveat", async () => {
  const markdown = await readFile(path.resolve(ROOT, MARKDOWN_PATH), "utf8");
  assert.match(markdown, /All 54 Spanish-route renderers still show fixed English source visuals/);
  assert.match(markdown, /no-cache, must-revalidate/);
  assert.match(markdown, /does not establish Spanish page parity/);
  assert.doesNotMatch(markdown, /strict complete: true/i);
});
