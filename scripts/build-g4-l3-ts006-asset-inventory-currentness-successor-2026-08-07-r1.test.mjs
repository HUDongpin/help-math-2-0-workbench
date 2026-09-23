import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";

import {
  parseMode,
} from "./build-g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.mjs";

test("preserves the invalidated inventory-transition attempt without treating it as current", async () => {
  const bytes = await readFile("reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "4b49ef2bfc76a438db401eeaaefe6d97ff75a1f3db64320dfdd030a0a7271ef3");
  const report = JSON.parse(bytes);
  assert.equal(report.exactTransition.changedFieldCount, 1);
  assert.equal(report.exactTransition.otherInventoryBytesChanged, false);
  assert.equal(report.historicalEvidence.rewritten, false);
  assert.equal(report.historicalEvidence.currentnessInherited, false);
  assert.equal(report.nextMachineStep.currentJavascriptRecaptureAllowed, true);
  assert.equal(report.nextMachineStep.adoptionIntoHistoricalApprovalAuthorized, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  const currentInventory = await readFile("migrations/course-g04-l03-ts-006/asset-inventory.csv");
  assert.notEqual(
    createHash("sha256").update(currentInventory).digest("hex"),
    report.successorInventory.sha256,
  );
});

test("requires an explicit no-clobber mode", () => {
  assert.equal(parseMode(["--json"]), "json");
  assert.equal(parseMode(["--check"]), "check");
  assert.equal(parseMode(["--write-no-clobber"]), "write-no-clobber");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--write"]));
});

test("published successor outputs are read-only when present", async () => {
  for (const path of [
    "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json",
    "reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.md",
  ]) {
    try {
      const metadata = await stat(path);
      assert.equal(metadata.mode & 0o222, 0);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
});
