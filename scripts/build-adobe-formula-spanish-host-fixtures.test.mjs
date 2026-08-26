import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  FORMULA_PILOTS,
  buildFixtureSpecification,
  parseArguments,
  renderBaseSwfXml,
  renderHostActionScript,
  renderSandboxProfile,
  validateEquivalentHostContracts,
  verifyFixtureManifest,
  verifyLaunchAuthorization,
} from "./build-adobe-formula-spanish-host-fixtures.mjs";

const sourceHash = "a".repeat(64);

function hostAudit(role, suffix = "") {
  return {
    role,
    source: `source-assets/flash/indexELM${suffix}.swf`,
    sourceSha256: createHash("sha256").update(role).digest("hex"),
    dynamicTextContract: {scriptAssignmentCount: 0},
    originalLoadContract: {functionSourceSha256: "b".repeat(64)},
    originalActivationContract: {capacityScriptSha256: "c".repeat(64)},
    languageUiContract: {scriptSha256: "d".repeat(64)},
  };
}

function specificationFixture(pilotInput = null) {
  const pilot = pilotInput || {
    ...FORMULA_PILOTS[0],
    source: "source-assets/flash/formula.swf",
    sourceSha256: sourceHash,
  };
  const hostAudits = [
    hostAudit("primary-shipped-host-evidence"),
    hostAudit("same-authority-april8-variant", "_April8"),
    hostAudit("same-authority-local-variant", "_Local"),
    hostAudit("same-authority-local-april8-variant", "_Local_April8"),
  ];
  const hostEquivalence = validateEquivalentHostContracts(hostAudits);
  const childAudit = {
    animationId: pilot.animationId,
    sourceSha256: pilot.sourceSha256,
    frameOneLanguageScript: {
      scriptSha256: "e".repeat(64),
      condition: '_root.dtfSpanishFormulas.text.toUpperCase() == "ON"',
    },
    rootReferenceDisposition: {
      "_root.dtfSpanishFormulas": "required controlled input",
      "_root.focusManager": "child self-bootstrap",
      "_root.createClassObject": "intrinsic",
    },
    blockedPrimitiveCount: 0,
  };
  return {
    pilot,
    specification: buildFixtureSpecification({pilot, childAudit, hostAudits, hostEquivalence}),
  };
}

test("formula Spanish fixture contracts agree only when every indexELM variant is equivalent", () => {
  const audits = [
    hostAudit("primary-shipped-host-evidence"),
    hostAudit("same-authority-april8-variant"),
    hostAudit("same-authority-local-variant"),
    hostAudit("same-authority-local-april8-variant"),
  ];
  assert.equal(validateEquivalentHostContracts(audits).equivalent, true);
  audits[3].languageUiContract.scriptSha256 = "f".repeat(64);
  assert.throws(() => validateEquivalentHostContracts(audits), /disagree on language panel/);
  audits[3].languageUiContract.scriptSha256 = "d".repeat(64);
  audits[2].dynamicTextContract.scriptAssignmentCount = 1;
  assert.throws(() => validateEquivalentHostContracts(audits), /controlled-input rationale must be re-audited/);
});

test("formula Spanish fixture is a lazy exact-child context, not an original-host or audio claim", () => {
  const {pilot, specification} = specificationFixture();
  assert.equal(specification.source.childSwfSha256, sourceHash);
  assert.equal(specification.source.stagedChildPath, `formula/${pilot.sourceBasename}`);
  assert.equal(specification.authority.originalShellExecuted, false);
  assert.equal(specification.authority.originalHostDefaultClaimed, false);
  assert.equal(specification.originalHostEvidence.dynamicText.scenarioValue, "ON");
  assert.equal(specification.originalHostEvidence.dynamicText.defaultValueStatus, "external-input-not-recovered-and-not-claimed");
  assert.equal(specification.visualLanguageContract.englishAliasForbidden, true);
  assert.equal(specification.visualLanguageContract.hostPanelAudioAndTitleControlsInScope, false);
  assert.equal(specification.deterministicFrameControl.status, "explicit-one-indexed-after-child-onLoadInit");
  assert.deepEqual(specification.deterministicFrameControl.validRange, {minimum: 1, maximum: pilot.frameCount});
  assert.equal(specification.deterministicFrameControl.initialFreezeFrame, 1);
  assert.equal(specification.deterministicFrameControl.autoplayAfterLoad, false);
  assert.equal(specification.deterministicFrameControl.input.visibleRequestedActualResultBeforeCapture, true);
  assert.equal(specification.deterministicFrameControl.input.captureOverlayHideKey, "Escape");
  assert.match(specification.deterministicFrameControl.auditEvents.result, /requested=.*actual=.*source=/);
  assert.equal(specification.sideEffectPolicy.networkDenied, true);
  assert.equal(specification.strictAcceptanceEffect.startsWith("none-"), true);
});

test("generated AVM1 host loads once only after a user click and has no remote or audio primitive", () => {
  const {specification} = specificationFixture();
  const source = renderHostActionScript(specification, "f".repeat(64));
  assert.match(source, /_root\.onMouseDown = function\(\)/);
  assert.match(source, /_root\.__fixtureStart\(\);/);
  assert.match(source, /if\(_global\.__fixtureLoadStarted\)/);
  assert.match(source, /_root\.SpanishFormulas = "ON"/);
  assert.match(source, /_root\.dtfSpanishFormulas\.text = "ON"/);
  assert.match(source, /language-context-ready/);
  assert.match(source, /MovieClipLoader/);
  assert.match(source, /formula\/Conversion_1_1\.swf/);
  assert.match(source, /_global\.__fixtureFrameCount = 94/);
  assert.match(source, /_root\.__fixtureInstallFrameController = function\(target\)/);
  assert.match(source, /_root\.__fixtureRequestFrame = function\(requested,requestSource\)/);
  assert.match(source, /_global\.__fixtureFrameTarget\.gotoAndStop\(frameNumber\)/);
  assert.match(source, /_global\.__fixtureFrameTarget\.stop\(\)/);
  assert.match(source, /Key\.addListener\(_global\.__fixtureFrameKeyListener\)/);
  assert.match(source, /keyCode == 13/);
  assert.match(source, /frame-controller-ready/);
  assert.match(source, /frame-control","requested=" \+ frameNumber \+ ";actual=" \+ actual/);
  assert.match(source, /READY requested=" \+ frameNumber \+ " actual=" \+ actual/);
  assert.match(source, /frame-overlay-hidden","actual="/);
  assert.match(source, /_root\.__fixtureRequestFrame\(1,"onLoadInit"\)/);
  assert.ok(source.indexOf("_root.__fixtureInstallFrameController(target);") > source.indexOf("listener.onLoadInit = function(target)"));
  assert.doesNotMatch(source, /onEnterFrame/);
  assert.doesNotMatch(source, /\.play\s*\(/);
  assert.doesNotMatch(source, /\bgetURL\s*\(/);
  assert.doesNotMatch(source, /\bfscommand\s*\(/);
  assert.doesNotMatch(source, /\bloadSound\s*\(/);
  assert.doesNotMatch(source, /\bnew Sound\s*\(/);
  assert.doesNotMatch(source, /https?:\/\//i);
});

test("each formula fixture compiles its own source frameCount into the fail-closed controller", () => {
  for (const pilot of FORMULA_PILOTS) {
    const {specification} = specificationFixture(pilot);
    const source = renderHostActionScript(specification, "f".repeat(64));
    assert.equal(specification.deterministicFrameControl.frameCount, pilot.frameCount);
    assert.equal(specification.deterministicFrameControl.validRange.maximum, pilot.frameCount);
    assert.match(source, new RegExp(`_global\\.__fixtureFrameCount = ${pilot.frameCount};`));
    assert.match(source, /frameNumber < 1 \|\| frameNumber > _global\.__fixtureFrameCount/);
  }
});

test("native host container and sandbox deny network, Apple Events, and out-of-bound writes", () => {
  const xml = renderBaseSwfXml();
  assert.match(xml, /right="15600"/);
  assert.match(xml, /bottom="7580"/);
  assert.match(xml, /framerate="12" frames="1"/);
  assert.match(xml, /red="228" green="228" blue="228"/);
  const profile = renderSandboxProfile({fixtureRoot: "/private/tmp/formula-fixture", temporaryRoot: "/private/tmp/runtime"});
  assert.match(profile, /\(deny network\*\)/);
  assert.match(profile, /deny appleevent-send/);
  assert.match(profile, /com\.apple\.lsd\.open/);
  assert.match(profile, /com\.apple\.lsd\.modifydb/);
  assert.match(profile, /deny file-write\*/);
  assert.match(profile, /\/private\/tmp\/formula-fixture/);
});

test("formula fixture CLI separates construction from hash and GUI-smoke authorization checks", () => {
  const parsed = parseArguments(["--id", FORMULA_PILOTS[0].animationId, "--output", "./work/formula-fixture-test", "--report", "./reports/formula-fixture-test.json", "--no-compile"]);
  assert.deepEqual(parsed.ids, [FORMULA_PILOTS[0].animationId]);
  assert.equal(parsed.outputRoot, path.resolve("./work/formula-fixture-test"));
  assert.equal(parsed.reportPath, path.resolve("./reports/formula-fixture-test.json"));
  assert.equal(parsed.compile, false);
  assert.equal(parseArguments(["--verify-fixture", "./manifest.json"]).verifyFixture, path.resolve("./manifest.json"));
  assert.equal(parseArguments(["--verify-launch", "./manifest.json"]).verifyLaunch, path.resolve("./manifest.json"));
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("formula fixture verifier rejects mutation and withholds launch until hashed GUI smoke evidence exists", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-formula-fixture-manifest-"));
  const payloadPath = path.join(directory, "payload.txt");
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const payload = "safe\n";
  const generatorSource = await readFile(new URL("./build-adobe-formula-spanish-host-fixtures.mjs", import.meta.url));
  await writeFile(payloadPath, payload, "utf8");
  await writeFile(manifestPath, JSON.stringify({
    animationId: "formula-fixture-test",
    fixtureDigest: "d".repeat(64),
    generatedBySha256: createHash("sha256").update(generatorSource).digest("hex"),
    guiSmokeAuthorization: {requiredApproval: "capture/sandbox-gui-smoke-test.json"},
    generatedFileHashes: [{path: "payload.txt", sha256: createHash("sha256").update(payload).digest("hex")}],
  }), "utf8");
  await verifyFixtureManifest(manifestPath);
  await assert.rejects(() => verifyLaunchAuthorization(manifestPath), /GUI sandbox smoke evidence is pending/);

  const captureDirectory = path.join(directory, "capture");
  const evidencePath = path.join(captureDirectory, "smoke.png");
  const evidence = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415408996360606060000000050001a5f645400000000049454e44ae426082", "hex");
  await mkdir(captureDirectory);
  await writeFile(evidencePath, evidence);
  await writeFile(path.join(captureDirectory, "sandbox-gui-smoke-test.json"), JSON.stringify({
    schemaVersion: 1,
    animationId: "formula-fixture-test",
    fixtureDigest: "d".repeat(64),
    status: "passed",
    reviewer: "engineering smoke observer",
    reviewedAt: "2026-07-21T12:00:00Z",
    evidenceFile: "capture/smoke.png",
    evidenceMimeType: "image/png",
    evidenceSha256: createHash("sha256").update(evidence).digest("hex"),
    observation: "The sandbox pre-load screen was shown and no child was loaded or clicked.",
  }), "utf8");
  const authorized = await verifyLaunchAuthorization(manifestPath);
  assert.equal(authorized.approval.reviewer, "engineering smoke observer");
  const approvalPath = path.join(captureDirectory, "sandbox-gui-smoke-test.json");
  const mismatchedMime = JSON.parse(await readFile(approvalPath, "utf8"));
  mismatchedMime.evidenceMimeType = "image/jpeg";
  await writeFile(approvalPath, JSON.stringify(mismatchedMime), "utf8");
  await assert.rejects(() => verifyLaunchAuthorization(manifestPath), /bytes do not match evidenceMimeType/);
  await writeFile(payloadPath, "mutated\n", "utf8");
  await assert.rejects(() => verifyFixtureManifest(manifestPath), /hash mismatch/);
});
