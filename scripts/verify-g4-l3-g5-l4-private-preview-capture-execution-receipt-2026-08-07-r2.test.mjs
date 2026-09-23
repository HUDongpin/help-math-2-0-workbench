import assert from "node:assert/strict";
import {stat} from "node:fs/promises";
import test from "node:test";

import {verifyPrivatePreviewCaptureExecutionReceipt} from "./verify-g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-07-r2.mjs";

test("private-preview execution receipt remains fail-closed after successor drift", async () => {
  await assert.rejects(
    verifyPrivatePreviewCaptureExecutionReceipt(),
    /(?:G4 canonical inventory predecessor drifted|implementation closure is stale)/u,
  );
});

test("execution receipt is read-only", async () => {
  const metadata = await stat("reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-07-r2.json");
  assert.equal(metadata.mode & 0o222, 0);
});
