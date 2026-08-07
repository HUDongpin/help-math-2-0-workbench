import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildControllerInput,
  deriveControllerSpecification,
  parseArguments,
  renderControllerActionScript,
  selectCanonicalProbeFrame,
} from "./build-adobe-course-frame-controller-fixtures.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsRoot, "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const evidencePins = [
  "scenario-inventory",
  "strict-readiness",
  "audio-runtime-evidence",
  "ffdec-scripts",
  "swfmill-xml",
].map((id, index) => ({id, path: `evidence/${id}`, sha256: String(index + 1).repeat(64)}));

const expected = Object.freeze({
  "course-g03-l01-ts-008": {rootFrame: 6, rootLabel: "begin", objectId: 348, localFrames: 747, canonical: 295},
  "course-g03-l01-vb-004": {rootFrame: 6, rootLabel: "begin", objectId: 231, localFrames: 222, canonical: 56},
  "course-g03-l06-fq-002-review": {rootFrame: 6, rootLabel: "Begin", objectId: 1168, localFrames: 82, canonical: 2},
  "course-g03-l06-ti-001": {rootFrame: 6, rootLabel: "begin", objectId: 21, localFrames: 142, canonical: 5},
  "course-g03-l08-re-001": {rootFrame: 51, rootLabel: "Begin", objectId: 621, localFrames: 27, canonical: 2},
  "course-g04-l01-ir-001": {rootFrame: 6, rootLabel: "begin", objectId: 58, localFrames: 142, canonical: 5},
  "course-g04-l03-in-009": {rootFrame: 6, rootLabel: "begin", objectId: 200, localFrames: 637, canonical: 637},
  "course-g04-l09-gs-002": {rootFrame: 6, rootLabel: "begin", objectId: 787, localFrames: 653, canonical: 642},
  "course-g05-l13-rw-002": {rootFrame: 6, rootLabel: "begin", objectId: 334, localFrames: 1873, canonical: 673},
});

function legacyEvidence() {
  return [
    {path: "migrations/course-g03-l06-ti-001/audit/adobe-frame-controller-spec.json", sha256: "a".repeat(64)},
    {path: "migrations/course-g03-l06-ti-001/audit/adobe-frame-controller-engineering-report.json", sha256: "b".repeat(64)},
  ];
}

async function deriveActual(id) {
  const inventory = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "audit", "scenario-inventory.json"), "utf8"));
  return deriveControllerSpecification({
    inventory,
    evidencePins,
    legacyEvidence: id === "course-g03-l06-ti-001" ? legacyEvidence() : [],
  });
}

test("argument parser separates canonical builds, arbitrary frames, check, and verification", () => {
  const build = parseArguments(["--id", "course-g04-l03-in-009", "--frame", "637", "--no-compile"]);
  assert.deepEqual(build.ids, ["course-g04-l03-in-009"]);
  assert.equal(build.frame, 637);
  assert.equal(build.compile, false);
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--verify", "./fixture-manifest.json"]).verifyManifest, path.resolve("./fixture-manifest.json"));
  assert.equal(parseArguments(["--verify-launch", "./fixture-manifest.json"]).verifyLaunch, path.resolve("./fixture-manifest.json"));
  assert.throws(() => parseArguments(["--frame", "4"]), /exactly one --id/);
  assert.throws(() => parseArguments(["--id", "shell-course-g04-l01-index-local"]), /unknown course child pilot/);
  assert.throws(() => parseArguments(["--check", "--verify", "./fixture-manifest.json"]), /mutually exclusive/);
});

test("all nine specs derive exact root placement, label, objectId, local frameCount, stage, FPS, and canonical key candidate from audited inventories", async () => {
  for (const [id, contract] of Object.entries(expected)) {
    const specification = await deriveActual(id);
    assert.equal(specification.animationId, id);
    assert.equal(specification.source.fps, 12);
    assert.deepEqual(specification.source.stage, {width: 800, height: 600});
    assert.equal(specification.timelineContract.root.placementName, "animation");
    assert.equal(specification.timelineContract.root.entryFrame, contract.rootFrame);
    assert.equal(specification.timelineContract.root.entryLabel, contract.rootLabel);
    assert.equal(specification.timelineContract.root.placementObjectId, contract.objectId);
    assert.equal(specification.timelineContract.local.timelineId, `sprite-${contract.objectId}`);
    assert.equal(specification.timelineContract.local.frameCount, contract.localFrames);
    assert.equal(specification.canonicalTargetFrame, contract.canonical);
    assert.equal(specification.canonicalFrameSelection.visualNonEmptyClaimed, false);
    assert.equal(specification.timelineContract.consecutiveActualFrameChecksBeforeReveal, 3);
    assert.equal(specification.authorityBoundary.strictBaselineClaimed, false);
    assert.equal(specification.authorityBoundary.humanReviewClaimed, false);
    assert.equal(specification.authorityBoundary.ownerAcceptanceClaimed, false);
    assert.match(specification.strictAcceptanceEffect, /^none/);
  }
});

test("TI compatibility record preserves the prior controller spec/report under separate names and hashes", async () => {
  const specification = await deriveActual("course-g03-l06-ti-001");
  assert.equal(specification.legacyTiCompatibility.preservedUnmodifiedByThisFactory, true);
  assert.equal(specification.legacyTiCompatibility.files.length, 2);
  assert.ok(specification.legacyTiCompatibility.files.every((item) => item.path.includes("adobe-frame-controller-") && !item.path.includes("adobe-course-frame-controller-")));
});

test("canonical selector is fail-closed and prefers audited labels, then nonterminal stop/action, then terminal", () => {
  assert.deepEqual(selectCanonicalProbeFrame({
    frameCount: 20,
    frameLabels: [{frame: 8, label: "Q1"}],
    controlStates: [{frame: 4, reasons: ["script-stop-state"]}],
  }).frame, 8);
  assert.equal(selectCanonicalProbeFrame({
    frameCount: 20,
    frameLabels: [],
    controlStates: [{frame: 4, reasons: ["script-stop-state"]}, {frame: 20, reasons: ["terminal-structural-frame"]}],
  }).frame, 4);
  assert.equal(selectCanonicalProbeFrame({
    frameCount: 20,
    frameLabels: [],
    controlStates: [{frame: 7, reasons: ["exported-action-script"]}, {frame: 20, reasons: ["terminal-structural-frame"]}],
  }).frame, 7);
  assert.equal(selectCanonicalProbeFrame({
    frameCount: 20,
    frameLabels: [],
    controlStates: [{frame: 20, reasons: ["terminal-structural-frame"]}],
  }).frame, 20);
  assert.equal(selectCanonicalProbeFrame({frameCount: 20, frameLabels: [], controlStates: []}).frame, 1);
});

test("derivation rejects ambiguous/missing placement, label, and object timeline rather than guessing", async () => {
  const source = JSON.parse(await readFile(path.join(projectRoot, "migrations", "course-g03-l01-vb-004", "audit", "scenario-inventory.json"), "utf8"));
  const root = source.timelineInventory.find((item) => item.timelineId === "root");
  assert.throws(() => deriveControllerSpecification({
    inventory: {...source, timelineInventory: source.timelineInventory.map((item) => item.timelineId === "root" ? {...item, namedPlacements: root.namedPlacements.filter((placement) => placement.name !== "animation")} : item)},
    evidencePins,
  }), /exactly one root named placement/);
  assert.throws(() => deriveControllerSpecification({
    inventory: {...source, timelineInventory: source.timelineInventory.map((item) => item.timelineId === "root" ? {...item, frameLabels: []} : item)},
    evidencePins,
  }), /exactly one root label/);
  assert.throws(() => deriveControllerSpecification({
    inventory: {...source, timelineInventory: source.timelineInventory.filter((item) => item.timelineId !== "sprite-231")},
    evidencePins,
  }), /expected one sprite-231 timeline/);
});

test("rendered controller uses exact source path/entry/local domain, three actual-frame ticks, full shields, audio suppression, and no remote primitive", async () => {
  const specification = await deriveActual("course-g04-l09-gs-002");
  const input = buildControllerInput({
    specification,
    specPath: path.join(projectRoot, "migrations", specification.animationId, "audit", "adobe-course-frame-controller-spec.json"),
    specSha256: "c".repeat(64),
    targetFrame: 653,
    generatorSha256: "d".repeat(64),
    supportSha256: "e".repeat(64),
  });
  const source = renderControllerActionScript(input, sha("fixture"));
  assert.match(source, /HELP_COURSE_FRAME_CONTROLLER/);
  assert.match(source, /__controllerChildPath = "lesson\/GS\/L9GS02\.swf"/);
  assert.match(source, /__controllerEntryLabel = "begin"/);
  assert.match(source, /__controllerPlacementObjectId = 787/);
  assert.match(source, /__controllerExpectedLocalFrames = 653/);
  assert.match(source, /__controllerTargetFrame = 653/);
  assert.match(source, /__controllerRequiredActualFrameChecks = 3/);
  assert.match(source, /actual-frame-check/);
  assert.match(source, /FRAME CONTROL FAILED CLOSED/);
  assert.match(source, /__controllerInputShield/);
  assert.match(source, /new Sound\(target\)/);
  assert.match(source, /new Sound\(clip\)/);
  assert.match(source, /stopAllSounds\(\)/);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /\bgetURL\s*\(/);
  assert.doesNotMatch(source, /\bloadVariables(?:Num)?\s*\(/);
  assert.throws(() => buildControllerInput({...input, specification, specPath: path.join(projectRoot, "migrations", specification.animationId, "audit", "adobe-course-frame-controller-spec.json"), specSha256: "c".repeat(64), targetFrame: 654, generatorSha256: "d".repeat(64), supportSha256: "e".repeat(64)}), /must be in 1\.\.653/);
});

test("unknown host bindings and interaction/random/audio/language work remain explicit blockers", async () => {
  const fq = await deriveActual("course-g03-l06-fq-002-review");
  assert.ok(fq.unresolvedObligations.hostBindings.length > 50);
  assert.equal(fq.unresolvedObligations.randomObligationCount, 1);
  assert.ok(fq.unresolvedObligations.interactionCoverage.length > 0);
  assert.ok(fq.unresolvedObligations.language.length > 0);
  assert.ok(fq.unresolvedObligations.audio.length > 0);
  assert.equal(fq.safetyPolicy.hostBindingsInjected, false);
  assert.equal(fq.authorityBoundary.authoritativeBranchTraversalClaimed, false);
  assert.equal(fq.authorityBoundary.authoritativeLanguageClaimed, false);
  assert.equal(fq.authorityBoundary.authoritativeAudioClaimed, false);
});
