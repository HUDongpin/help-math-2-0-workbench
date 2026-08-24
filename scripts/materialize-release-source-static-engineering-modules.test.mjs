import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  materializeReleaseSourceStaticEngineeringModules,
  parseArguments,
} from "./materialize-release-source-static-engineering-modules.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const FALLBACK_ID = "course-g04-l10-rw-002";
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
    allowAcceptanceNeutralLineageFallback: false,
    check: true,
    ids: [IDS[0]],
    releaseId: RELEASE_ID,
  });
  assert.equal(parseArguments([
    "--release-id", RELEASE_ID,
    "--id", FALLBACK_ID,
    "--allow-acceptance-neutral-lineage-fallback",
  ]).allowAcceptanceNeutralLineageFallback, true);
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id", RELEASE_ID]),
    /at least one exact --id is required/,
  );
});

test("eight source-static timelines remain acceptance-neutral beneath the private page-only successor", async () => {
  const privateRegistry = JSON.parse(await readFile(
    "packages/demos/private-current-js-registry.json",
    "utf8",
  ));
  assert.equal(privateRegistry.calibrationId,
    "g4-l10-page-only-current-js-46-v1");
  const privateKeys = new Set(privateRegistry.entries.map(({key}) => key));
  assert.equal(IDS.every((animationId) => privateKeys.has(animationId)), true);
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
    assert.doesNotMatch(module, /prototype-manifest|whole-lesson/i);
  }
});
