import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  animationModuleRegistration,
  loadAnimationModule,
} from "../src/animation-registry";

test("G4 L10 loads all 46 private Current-JS page modules in frozen source order", async () => {
  const registry = JSON.parse(await readFile(
    new URL("../private-current-js-registry.json", import.meta.url),
    "utf8",
  )) as {
    schemaVersion: 2;
    calibrations: Array<{
      calibrationId: string;
      entries: Array<{key: string}>;
      freezeManifest: string;
    }>;
  };
  assert.equal(registry.schemaVersion, 2);
  const calibration = registry.calibrations.find(
    ({calibrationId}) => calibrationId === "g4-l10-page-only-current-js-46-v1",
  );
  assert.ok(calibration);
  assert.equal(calibration.entries.length, 46);
  assert.equal(new Set(calibration.entries.map(({key}) => key)).size, 46);

  for (const {key} of calibration.entries) {
    const module = await loadAnimationModule(key);
    assert.ok(module, `${key}: module did not load`);
    assert.equal(module.key, key);
    assert.equal(module.maturity, "private-current-js");
    assert.deepEqual(animationModuleRegistration(key), {
      maturity: "private-current-js",
      scope: "private-engineering",
      calibrationId: calibration.calibrationId,
    });
  }
});
