import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  materializeG4L3MainTimelineAudioCandidates,
} from "./materialize-g4-l3-main-timeline-audio-candidates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("G4 L3 main-timeline audio materialization is reproducible", async () => {
  const result = await materializeG4L3MainTimelineAudioCandidates({
    root,
    check: true,
  });
  assert.equal(result.action, "verified");
  assert.equal(result.eligibleMemberCount, 34);
  assert.equal(result.generatedRuntimeCandidateCount, 32);
  assert.equal(result.stagedAssetCount, 68);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("G4 L3 main-timeline audio report excludes complex members fail-closed", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        root,
        "reports/g4-l3-current-js-main-timeline-audio-candidates.json",
      ),
      "utf8",
    ),
  );
  const excluded = new Map(
    report.exclusions.map((entry) => [entry.animationId, entry.reason]),
  );
  assert.equal(
    excluded.get("shell-course-g04-l03-index-local"),
    "lesson-shell-has-complex-multi-domain-audio",
  );
  assert.equal(excluded.get("course-g04-l03-fq-001"), "no-embedded-audio");
  assert.equal(
    excluded.get("course-g04-l03-ti-003"),
    "no-nonempty-default-domain-embedded-audio",
  );
  assert.equal(report.exclusions.length, 6);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
});
