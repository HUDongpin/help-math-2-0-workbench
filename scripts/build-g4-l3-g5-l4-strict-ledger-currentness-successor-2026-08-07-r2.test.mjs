import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {
  parseMode,
} from "./build-g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.mjs";

test("preserves the superseded ledger-transition attempt while canonical ledgers retain predecessor bytes", async () => {
  const bytes = await readFile("reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.json");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "9f908c030b36baf5f0709ecc313bb71af1fed0b7a1e81af66e29d9aaf75c2552");
  const report = JSON.parse(bytes);
  assert.equal(report.exactTransition.completionLedger.predecessor, 47);
  assert.equal(report.exactTransition.completionLedger.successor, 45);
  assert.equal(report.exactTransition.completionLedger.strictEntryAdded, false);
  assert.equal(report.exactTransition.completionLedger.strictEntryRemoved, false);
  assert.equal(report.currentLedgers.completion.strictComplete, 0);
  assert.equal(report.currentLedgers.completion.strictFailed, 215);
  assert.equal(report.currentLedgers.lessonRelease.publishedLessonReleaseCount, 0);
  assert.equal(report.predecessorSuccessors.rewritten, false);
  assert.equal(report.authority.currentLedgerEvidence, true);
  assert.equal(report.authority.currentJavascriptCaptureEvidence, true);
  for (const [key, value] of Object.entries(report.authority)) {
    if (!["currentLedgerEvidence", "currentJavascriptCaptureEvidence"].includes(key)) {
      assert.equal(value, false, key);
    }
  }
  const currentCompletionLedger = await readFile("catalog/completion-ledger.json");
  assert.equal(
    createHash("sha256").update(currentCompletionLedger).digest("hex"),
    report.predecessorLedgers.completion.sha256,
  );
  assert.notEqual(
    createHash("sha256").update(currentCompletionLedger).digest("hex"),
    report.currentLedgers.completion.sha256,
  );
});

test("requires an explicit no-clobber mode", () => {
  assert.equal(parseMode(["--json"]), "json");
  assert.equal(parseMode(["--check"]), "check");
  assert.equal(parseMode(["--write-no-clobber"]), "write-no-clobber");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--write"]));
});

test("published r2 outputs are read-only when present", async () => {
  for (const path of [
    "reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.json",
    "reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.md",
  ]) {
    try {
      const metadata = await stat(path);
      assert.equal(metadata.mode & 0o222, 0);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
});
