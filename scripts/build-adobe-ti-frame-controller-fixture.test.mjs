import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildControllerInput,
  buildEngineeringReport,
  loadControllerSpecification,
  parseArguments,
  renderControllerActionScript,
  validateControllerSpecification,
  verifyFixtureManifest,
  verifyLaunchAuthorization,
} from "./build-adobe-ti-frame-controller-fixture.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsRoot, "..");
const generatorPath = path.join(scriptsRoot, "build-adobe-ti-frame-controller-fixture.mjs");
const supportPath = path.join(scriptsRoot, "build-adobe-course-host-fixtures.mjs");

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("argument parser separates per-frame build, check, fixture verification, and launch authorization", () => {
  const build = parseArguments(["--frame", "142", "--no-compile", "--output", "./work/controller-test"]);
  assert.equal(build.frame, 142);
  assert.equal(build.compile, false);
  assert.equal(build.outputRoot, path.resolve("./work/controller-test"));
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--verify", "./manifest.json"]).verifyManifest, path.resolve("./manifest.json"));
  assert.equal(parseArguments(["--verify-launch", "./manifest.json"]).verifyLaunch, path.resolve("./manifest.json"));
  assert.throws(() => parseArguments(["--frame", "1.5"]), /positive integer/);
  assert.throws(() => parseArguments(["--check", "--verify", "./manifest.json"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("tracked controller specification is hash-pinned to the untouched TI source and exact nested timeline", async () => {
  const loaded = await loadControllerSpecification();
  assert.equal(loaded.specification.animationId, "course-g03-l06-ti-001");
  assert.equal(loaded.specification.source.sha256, "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739");
  assert.deepEqual(loaded.specification.source.stage, {width: 800, height: 600});
  assert.equal(loaded.specification.timelineContract.root.entryFrame, 6);
  assert.equal(loaded.specification.timelineContract.root.placementName, "animation");
  assert.equal(loaded.specification.timelineContract.root.placementObjectId, 21);
  assert.equal(loaded.specification.timelineContract.local.frameCount, 142);
  assert.deepEqual(loaded.specification.timelineContract.local.nestedAudioClipNames, ["Mc_Sound_0", "Mc_Sound_1"]);
  assert.equal(loaded.verifiedPins.length, 7);
});

test("spec validation rejects authority escalation and timeline drift", async () => {
  const loaded = await loadControllerSpecification();
  assert.throws(
    () => validateControllerSpecification({...loaded.specification, authorityBoundary: {...loaded.specification.authorityBoundary, strictBaselineClaimed: true}}),
    /cannot claim a strict baseline/,
  );
  assert.throws(
    () => validateControllerSpecification({...loaded.specification, timelineContract: {...loaded.specification.timelineContract, local: {...loaded.specification.timelineContract.local, frameCount: 141}}}),
    /local timeline contract changed/,
  );
});

test("rendered controller pins one indexed local frame, monitors drift, suppresses audio, and contains no remote primitive", async () => {
  const loaded = await loadControllerSpecification();
  const [generatorSource, supportSource] = await Promise.all([readFile(generatorPath), readFile(supportPath)]);
  const input = buildControllerInput({
    ...loaded,
    targetFrame: 142,
    generatorSha256: sha256(generatorSource),
    supportSha256: sha256(supportSource),
  });
  const source = renderControllerActionScript(input, "c".repeat(64));
  assert.match(source, /HELP_TI_FRAME_CONTROLLER/);
  assert.match(source, /__controllerTargetFrame = 142/);
  assert.match(source, /target\.gotoAndStop\(_global\.__controllerEntryLabel\)/);
  assert.match(source, /clip\.gotoAndStop\(_global\.__controllerTargetFrame\)/);
  assert.match(source, /clip\._totalframes != _global\.__controllerExpectedLocalFrames/);
  assert.match(source, /__controllerConsecutiveStableChecks = 3/);
  assert.match(source, /FRAME CONTROL FAILED CLOSED/);
  assert.match(source, /target\._visible = true/);
  assert.match(source, /stopAllSounds\(\)/);
  assert.match(source, /Mc_Sound_0\.stop\(\)/);
  assert.match(source, /Mc_Sound_1\.stop\(\)/);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /\bgetURL\s*\(/);
  assert.doesNotMatch(source, /\bloadVariables(?:Num)?\s*\(/);
  assert.doesNotMatch(source, /\bfscommand\s*\(/);
  assert.throws(() => buildControllerInput({...loaded, targetFrame: 0, generatorSha256: sha256(generatorSource), supportSha256: sha256(supportSource)}), /must be in 1\.\.142/);
  assert.throws(() => buildControllerInput({...loaded, targetFrame: 143, generatorSha256: sha256(generatorSource), supportSha256: sha256(supportSource)}), /must be in 1\.\.142/);
});

test("manifest verification binds current generator, evidence, frame, and every generated byte", async () => {
  const loaded = await loadControllerSpecification();
  const [generatorSource, supportSource] = await Promise.all([readFile(generatorPath), readFile(supportPath)]);
  const generatorSha256 = sha256(generatorSource);
  const supportSha256 = sha256(supportSource);
  const input = buildControllerInput({...loaded, targetFrame: 14, generatorSha256, supportSha256});
  const fixtureDigest = sha256(stableJson(input));
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-ti-frame-controller-manifest-"));
  const materializedPath = path.join(directory, "fixture-spec.json");
  const sourcePath = path.join(directory, "host.as");
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const hostSource = renderControllerActionScript(input, fixtureDigest);
  const materialized = stableJson({...input, fixtureDigest});
  await Promise.all([
    writeFile(materializedPath, materialized, "utf8"),
    writeFile(sourcePath, hostSource, "utf8"),
  ]);
  const manifest = {
    schemaVersion: 1,
    animationId: input.animationId,
    fixtureKind: input.fixtureKind,
    fixtureDigest,
    targetFrame: 14,
    source: input.source,
    timelineContract: input.timelineContract,
    specification: input.specification,
    evidencePins: input.evidencePins,
    generator: input.generator,
    supportModule: input.supportModule,
    compilation: {status: "not-compiled", deterministicDoubleBuild: false, decompiledMarkersVerified: false},
    sandbox: {networkDenied: true, outsideWriteDenied: true, localTcpDenied: true},
    runtimeVerification: {exactFrameClaimed: false, authoritativeBaselineClaimed: false},
    guiSmokeAuthorization: {requiredApproval: "capture/sandbox-gui-smoke-test.json"},
    generatedFileHashes: [
      {path: "fixture-spec.json", sha256: sha256(materialized)},
      {path: "host.as", sha256: sha256(hostSource)},
    ],
    strictAcceptanceEffect: "none; test fixture",
  };
  await writeFile(manifestPath, stableJson(manifest), "utf8");
  const verified = await verifyFixtureManifest(manifestPath);
  assert.equal(verified.manifest.targetFrame, 14);
  await assert.rejects(() => verifyLaunchAuthorization(manifestPath), /GUI sandbox smoke evidence is pending/);
  await writeFile(sourcePath, `${hostSource}\n// mutation\n`, "utf8");
  await assert.rejects(() => verifyFixtureManifest(manifestPath), /host\.as: expected .* observed/);
});

test("engineering report keeps runtime, audio, strict, human, and owner claims false", async () => {
  const manifest = {
    animationId: "course-g03-l06-ti-001",
    targetFrame: 14,
    fixtureDigest: "d".repeat(64),
    source: {stage: {width: 800, height: 600}, fps: 12},
    timelineContract: {
      root: {entryFrame: 6, entryLabel: "begin"},
      local: {timelineId: "sprite-21", frameCount: 142},
      consecutiveStableChecksBeforeReveal: 3,
    },
    compilation: {hostSha256: "e".repeat(64), deterministicDoubleBuild: true},
  };
  const report = buildEngineeringReport({
    manifestPath: path.join(projectRoot, "work", "fixture-manifest.json"),
    manifestSha256: "f".repeat(64),
    manifest,
    generatorSha256: "a".repeat(64),
    supportSha256: "b".repeat(64),
    specPath: path.join(projectRoot, "migrations", "course-g03-l06-ti-001", "audit", "adobe-frame-controller-spec.json"),
    specSha256: "c".repeat(64),
  });
  assert.equal(report.decision, "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven");
  assert.equal(report.authority.naturalPlaybackClaimed, false);
  assert.equal(report.authority.audioClaimed, false);
  assert.equal(report.authority.strictBaselineClaimed, false);
  assert.equal(report.authority.humanReviewClaimed, false);
  assert.equal(report.authority.ownerAcceptanceClaimed, false);
  assert.match(report.strictAcceptanceEffect, /^none/);
  assert.ok(report.runtimeProofStillRequired.length >= 3);
  assert.ok(report.limitations.some((item) => item.includes("random(2)")));
});
