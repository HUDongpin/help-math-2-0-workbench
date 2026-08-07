import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  materializeReleaseSourceStaticEngineeringModules,
  parseArguments,
} from "./materialize-release-source-static-engineering-modules.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const IDS = Object.freeze([
  "course-g04-l10-vb-003",
  "course-g04-l10-ti-003",
  "course-g04-l10-ts-006",
  "course-g04-l10-fq-002",
  "course-g04-l10-rw-004",
  "course-g04-l10-in-009",
  "course-g04-l10-vb-008",
  "course-g04-l10-ts-002",
]);

test("release module materializer requires an exact non-empty subset", () => {
  assert.deepEqual(parseArguments([
    "--release-id", RELEASE_ID,
    "--id", IDS[0],
    "--check",
  ]), {
    check: true,
    ids: [IDS[0]],
    releaseId: RELEASE_ID,
  });
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id", RELEASE_ID]),
    /at least one exact --id is required/,
  );
});

test("eight unregistered L10 module pairs are deterministic and do not enter registries", async () => {
  const result = await materializeReleaseSourceStaticEngineeringModules({
    check: true,
    ids: [...IDS],
    releaseId: RELEASE_ID,
  });
  assert.equal(result.selectedMemberCount, 8);
  assert.equal(result.protectedRegistriesUnchanged, true);
  assert.equal(result.results.every(({registered}) => registered === false), true);
  assert.equal(result.strictAcceptanceEffect, "none");
  for (const animationId of IDS) {
    const [timeline, module] = await Promise.all([
      readFile(`packages/demos/src/timelines/${animationId}.ts`, "utf8"),
      readFile(`packages/demos/src/modules/${animationId}.tsx`, "utf8"),
    ]);
    assert.match(timeline, /actionScriptExecuted: false/);
    assert.match(timeline, /audioCues: Object\.freeze\(\[\]\)/);
    assert.match(timeline, /controlsEnabled: false/);
    assert.match(timeline, /registered: false/);
    assert.match(timeline, /strictAcceptanceEffect: "none"/);
    assert.match(module, /createSourceStaticCanvasCandidate/);
    assert.doesNotMatch(module, /registry|prototype-manifest|whole-lesson/i);
  }
});
