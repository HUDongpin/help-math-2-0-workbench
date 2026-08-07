import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  validateReport,
} from "./qa-g4-l3-ir001-random-audio-candidate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("IR001 random-audio QA report is fingerprinted and acceptance-neutral", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        root,
        "reports/g4-l3-ir001-current-js-random-audio-qa.json",
      ),
      "utf8",
    ),
  );
  validateReport(report);
  assert.equal(report.branches.length, 2);
  assert.deepEqual(
    report.branches.map(
      ({outcome, wrongBranchPlayCount, pass}) => ({
        outcome,
        wrongBranchPlayCount,
        pass,
      }),
    ),
    [
      {outcome: 0, wrongBranchPlayCount: 0, pass: true},
      {outcome: 1, wrongBranchPlayCount: 0, pass: true},
    ],
  );
});
