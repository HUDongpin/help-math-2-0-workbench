import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateReport} from "./qa-g4-l3-ti003-event-audio-candidate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("checked-in TI003 browser QA is passing and acceptance-neutral", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        root,
        "reports/g4-l3-ti003-current-js-event-audio-qa.json",
      ),
      "utf8",
    ),
  );
  validateReport(report);
  assert.equal(report.english.replayPlayObserved, true);
  assert.equal(report.spanish.userControlActivated, true);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
});
