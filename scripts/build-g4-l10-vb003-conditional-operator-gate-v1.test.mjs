import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildReport,
  parseArguments,
  renderJson,
  validateReport,
  writeNoClobber,
} from "./build-g4-l10-vb003-conditional-operator-gate-v1.mjs";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));

test("binds the exact v2.14 contract and exact v3 protocol", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  assert.equal(
    report.sourceBindings.securityContractV214.sha256,
    "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
  );
  assert.equal(report.sourceBindings.securityContractV214.bytes, 50_310);
  assert.equal(report.sourceBindings.securityContractV214.mode, "0444");
  assert.equal(
    report.sourceBindings.rootCaptureProtocolV3.sha256,
    "9c403289c12be94150b4afa783711ff377a0ea3c1dc6831446e5448a234e8753",
  );
  assert.equal(report.sourceBindings.rootCaptureProtocolV3.bytes, 328_835);
});

test("records a conditional designation without activating Peter Hu", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  assert.equal(report.operator.name, "Peter Hu");
  assert.equal(report.operator.designationRecorded, true);
  assert.equal(report.operator.activated, false);
  assert.equal(report.operator.operatorReady, false);
  assert.equal(report.operator.localArtifactAuthenticationAuthority, false);
  assert.equal(report.decision, "DO_NOT_LAUNCH");
});

test("binds exactly the VB003 EN and ES root kits", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  assert.deepEqual(report.scope.languages, ["en", "es"]);
  assert.deepEqual(report.scope.requirementIds, ["req-default-root-en", "req-default-root-es"]);
  assert.equal(report.captureKits.length, 2);
  assert.deepEqual(report.captureKits.map(({language}) => language), ["en", "es"]);
  assert.deepEqual(
    report.captureKits.map(({captureKitManifestSha256}) => captureKitManifestSha256),
    [
      "c217a225043ab019b19b69f61eb626b32b9811f0dd78d1ddb5930b1d28997f9b",
      "1055a6f34269fcfaf7eb17391ed302d89cbddcca204f17755095a39ecc8a2bfc",
    ],
  );
  assert.ok(report.captureKits.every((kit) => kit.sourceSwfSha256 === report.scope.sourceSwfSha256));
  assert.ok(report.captureKits.every((kit) => kit.kitIsOriginalRuntimeEvidence === false));
  assert.ok(report.captureKits.every((kit) => kit.upstreamProjectionCurrentnessEstablished === false));
});

test("requires a fresh checked launch receipt for every start", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  assert.equal(report.launchReceipt.freshReceiptRequiredForEveryStart, true);
  assert.equal(report.launchReceipt.receiptCheckedBeforeLaunch, true);
  assert.equal(report.launchReceipt.finalizedBeforeFirstFrame, true);
  assert.equal(report.launchReceipt.postHocReceiptAllowed, false);
  assert.equal(report.launchReceipt.receiptReuseAllowed, false);
  assert.equal(report.launchReceipt.launchAuthorizedNow, false);
});

test("keeps every security gate and acceptance effect false", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  assert.ok(Object.values(report.gates.current).every((value) => value === false));
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.gates.allSatisfied, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.equal(report.controls.helperImplemented, false);
  assert.equal(report.controls.workspaceModified, false);
  assert.equal(report.controls.captureKitModified, false);
});

test("validator rejects activation, scope expansion, or acceptance mutation", async () => {
  const report = await buildReport({projectRoot: PROJECT_ROOT});
  for (const mutate of [
    (copy) => { copy.operator.activated = true; },
    (copy) => { copy.operator.authorizationScopeExpansion = true; },
    (copy) => { copy.launchReceipt.launchAuthorizedNow = true; },
    (copy) => { copy.gates.current.productionHelperIndependentReviewP0P1P2Zero = true; },
    (copy) => { copy.acceptanceEffects.originalRuntimeAuthority = true; },
    (copy) => { copy.scope.animationId = "course-g04-l10-ts-007"; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateReport(copy));
  }
});

test("rendering is deterministic and the fingerprint validates", async () => {
  const first = await buildReport({projectRoot: PROJECT_ROOT});
  const second = await buildReport({projectRoot: PROJECT_ROOT});
  assert.equal(renderJson(first), renderJson(second));
  assert.equal(validateReport(first), true);
});

test("no-clobber creates once, accepts exact bytes, and rejects foreign bytes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "g4-vb003-operator-gate-"));
  const target = path.join(directory, "gate.json");
  try {
    assert.equal(await writeNoClobber(target, Buffer.from("exact\n")), "created");
    assert.equal(await writeNoClobber(target, Buffer.from("exact\n")), "exact-existing");
    assert.equal(await readFile(target, "utf8"), "exact\n");
    await assert.rejects(
      writeNoClobber(target, Buffer.from("foreign\n")),
      /Refusing to overwrite/,
    );
    assert.equal(await readFile(target, "utf8"), "exact\n");
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test("no-clobber rejects an existing symlink", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "g4-vb003-operator-link-"));
  const target = path.join(directory, "target.json");
  const link = path.join(directory, "gate.json");
  try {
    await writeFile(target, "exact\n", "utf8");
    await import("node:fs/promises").then(({symlink}) => symlink(target, link));
    await assert.rejects(
      writeNoClobber(link, Buffer.from("exact\n")),
      /not an ordinary file/,
    );
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test("CLI accepts only explicit write-no-clobber or check modes", () => {
  assert.deepEqual(parseArguments(["--write-no-clobber"]), {help: false, mode: "write-no-clobber"});
  assert.deepEqual(parseArguments(["--check"]), {help: false, mode: "check"});
  assert.deepEqual(parseArguments(["--help"]), {help: true, mode: ""});
  assert.throws(() => parseArguments([]), /choose exactly one/);
  assert.throws(() => parseArguments(["--check", "--write-no-clobber"]), /choose exactly one/);
  assert.throws(() => parseArguments(["--apply"]), /Unknown option/);
});
