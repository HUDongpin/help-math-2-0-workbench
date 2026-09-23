import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  RECEIPT_PATH,
  ROOT,
  checkFq23CompanionQaReceipt,
} from "./check-g5-l4-current-js-fq23-companion-qa.mjs";

test("the dated FQ23 receipt remains acceptance-neutral but is superseded as current evidence", async () => {
  const receipt = JSON.parse(await readFile(`${ROOT}${RECEIPT_PATH}`, "utf8"));
  assert.equal(
    receipt.receiptId,
    "g5-l4-current-js-fq23-companion-qa-2026-07-30",
  );
  assert.ok(
    Object.values(receipt.acceptanceEffects).every((value) => value === false),
  );
  await assert.rejects(
    checkFq23CompanionQaReceipt(),
    /(?:byte|hash) drift/,
  );
});

test("the narrow browser pass does not promote strict or release gates", async () => {
  const receipt = JSON.parse(await readFile(`${ROOT}${RECEIPT_PATH}`, "utf8"));
  assert.equal(receipt.scopeResult.currentJavascriptFq23CompanionQaPassed, true);
  assert.ok(
    Object.values(receipt.acceptanceEffects).every((value) => value === false),
  );
  assert.equal(receipt.scope.g4L3Port3216Touched, false);
  assert.equal(receipt.scope.externalDeploymentPerformed, false);
});
