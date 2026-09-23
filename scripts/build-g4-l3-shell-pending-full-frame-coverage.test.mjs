import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildPendingShellCoverage,
  parseArguments,
  validatePendingShellCoverage,
} from "./build-g4-l3-shell-pending-full-frame-coverage.mjs";
import {ADDITIONAL_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-additional-domains.mjs";
import {SINGLE_FRAME_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-single-frame-domains.mjs";

const manifestPath = new URL("../migrations/shell-course-g04-l03-index-local/migration.json", import.meta.url);
const coveragePath = new URL("../migrations/shell-course-g04-l03-index-local/evidence/full-frame-coverage.json", import.meta.url);

test("enumerates every G4 L3 shell domain/scenario/language while preserving acceptance-neutral implementation captures", async () => {
  const [built, checkedIn, manifest] = await Promise.all([
    buildPendingShellCoverage(),
    readFile(coveragePath, "utf8").then(JSON.parse),
    readFile(manifestPath, "utf8").then(JSON.parse),
  ]);
  validatePendingShellCoverage(checkedIn, manifest);
  assert.deepEqual(checkedIn, built);
  assert.equal(checkedIn.requirements.length, 88);
  assert.equal(checkedIn.requirements[0].requirementId, "req:root:source-root-structural:en");
  assert.equal(checkedIn.requirements[21].requirementId, "req:root:quit-confirmation:es");
  assert.equal(checkedIn.requirements.at(-1).requirementId, "req:sprite-774:calculator-panel-structural:es");
  assert(checkedIn.requirements.slice(0, 22).every(({status, capturedFrameCount, missingFrames, baselineAuthority}) =>
    status === "pending" && baselineAuthority === "unresolved" && capturedFrameCount === 50 && missingFrames.length === 0));
  assert.deepEqual(
    checkedIn.requirements.slice(22).map(({frameDomainId, capturedFrameCount}) => [frameDomainId, capturedFrameCount]),
    [
      ["sprite-1011", 48], ["sprite-1011", 48],
      ["sprite-132", 100], ["sprite-132", 100],
      ["sprite-302", 149], ["sprite-302", 149],
      ["sprite-327", 132], ["sprite-327", 132],
      ["sprite-528", 871], ["sprite-528", 871],
      ...ADDITIONAL_DOMAIN_CONFIGS.flatMap(({frameDomain, frameCount}) => [
        [frameDomain, frameCount],
        [frameDomain, frameCount],
      ]),
      ...SINGLE_FRAME_DOMAIN_CONFIGS.flatMap(({frameDomain}) => [
        [frameDomain, 1],
        [frameDomain, 1],
      ]),
    ],
  );
  assert(checkedIn.requirements.slice(22).every(({status, capturedFrameCount, missingFrames, frameDomainId}) => {
    const frameCount = manifest.implementation.frameDomains.find(({id}) => id === frameDomainId).frameCount;
    return status === "pending" && capturedFrameCount === frameCount && missingFrames.length === 0;
  }));
  assert.equal(checkedIn.requirements.reduce((sum, {capturedFrameCount}) => sum + capturedFrameCount, 0), 4012);
  assert(checkedIn.requirements.every(({baselineCaptureManifest, metricsFile}) => baselineCaptureManifest === "" && metricsFile === ""));
  assert.equal(checkedIn.requirements.slice(32, 60).length, 28);
  assert.equal(checkedIn.requirements.slice(60).length, 28);
});

test("rejects any pending coverage promotion", async () => {
  const manifest = await readFile(manifestPath, "utf8").then(JSON.parse);
  const promoted = await buildPendingShellCoverage();
  promoted.requirements[0].status = "complete";
  assert.throws(() => validatePendingShellCoverage(promoted, manifest), /strict-authority claim/);
});

test("coverage CLI accepts only check mode", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--wat"]), /Unknown option/);
});
