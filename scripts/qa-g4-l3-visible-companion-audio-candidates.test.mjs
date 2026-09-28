import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {validateReport} from "./qa-g4-l3-visible-companion-audio-candidates.mjs";

test("visible companion audio browser QA remains acceptance-neutral", async () => {
  const report = JSON.parse(
    await readFile(
      "reports/g4-l3-visible-companion-audio-browser-qa.json",
      "utf8",
    ),
  );
  assert.equal(validateReport(report), report);
  assert.equal(report.summary.memberCount, 25);
  assert.equal(report.summary.passed, 25);
  assert.equal(report.strictAcceptanceEffect, "none");
});
