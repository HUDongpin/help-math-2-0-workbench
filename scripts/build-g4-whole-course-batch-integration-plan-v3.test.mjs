import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {checkLessonReleaseLedger} from "./build-lesson-release-ledger.mjs";

import {
  OUTPUT_PATH,
  PROJECT_ROOT,
  derivePlan,
  parseCliArgs,
  readCurrentSnapshot,
  runCli,
  validateEpochTransition,
  validatePlan,
  writeOrCheckPlan,
} from "./build-g4-whole-course-batch-integration-plan-v3.mjs";

const V2 = Object.freeze({
  generator: Object.freeze({
    bytes: 15_485,
    sha256:
      "4d3e691612b51d4c0d663702170740a86fe8708ac7366c0a5b2c3d6f41e9532f",
  }),
  tests: Object.freeze({
    bytes: 5_693,
    sha256:
      "769f7df9c9761e466b2eba2c3906da0daff62ae2c2019c8e9b61a193c232632b",
  }),
  json: Object.freeze({
    bytes: 32_127,
    sha256:
      "b96f8b3d872d91f77432ecb23954c5e36afbdef41241ba203c3be6937cd31f7c",
    fingerprint:
      "b9f47bf97d78181de917cb81f7b9cd18775e4efdb929d663a1b089dca4853617",
  }),
});

const CURRENT_LEDGER_SHA256 = Object.freeze({
  completionLedger:
    "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db",
  releaseLedger:
    "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc",
});

const L10_V5_SHA256 = Object.freeze({
  generator:
    "a983c289bc54aeedc2c1604bc5f72cb243406dc35e5be2177c6224de5e0bcc61",
  tests:
    "b0cdb2831ed8cbe2386e87d5ca3e7f1a5554743f55ae53601afa18110464b92a",
  json:
    "b4777628d6433241c247c1e3c4236becadd3b4b66e03585f51a81babd5fbeef9",
  markdown:
    "4acf3e17800365cbae4dbc2aca69f24a0baeb28fdb3fb9ffa552b8a6e51bf142",
});

const MP3_V1_SHA256 = Object.freeze({
  generator:
    "d66f099bbcccf7e939914f184532eff9f4023880b20e7e20dacf7456fc96c8e8",
  tests:
    "9245b4bde23a8af5e9a81c5419b696ce431b9a474c02dfd4a4435ef327b29778",
  json:
    "1ae71b2ef098dde37885c89f351e55d29e2ee6d80140b2c6335c99e238b649fd",
  markdown:
    "e3e5eb78fa96ceb2230afc2f1d13aabfeff16dc61ac2120eeff47159b36655a7",
});

const RECOVERY_STATES = Object.freeze([
  "blocked-expected-identity-unknown",
  "blocked-exact-bytes-not-found-in-checked-scopes",
  "candidate-only-pending-provenance-review",
  "eligible-for-new-successor-plan",
]);

const snapshotPromise = readCurrentSnapshot();
const planPromise = snapshotPromise.then(derivePlan);

function semanticBindings(snapshot, plan) {
  return Object.fromEntries(Object.keys(snapshot.v2Document.inputBindings)
    .map((key) => [key, structuredClone(plan.inputBindings[key])]));
}

test("uses exact v2 artifacts as data and never imports a v1/v2 generator", async () => {
  const source = await readFile(new URL(
    "./build-g4-whole-course-batch-integration-plan-v3.mjs",
    import.meta.url,
  ), "utf8");
  const localImports = [...source.matchAll(/from\s+["']([^"']+)["']/gu)]
    .map(([, specifier]) => specifier)
    .filter((specifier) => specifier.startsWith("."));
  assert.deepEqual(localImports, [
    "./build-completion-ledger.mjs",
    "./build-lesson-release-ledger.mjs",
  ]);
  assert.doesNotMatch(source, /\breadSnapshot\s*\(/u);
  assert.doesNotMatch(source, /runCli\s*\(\s*\[\s*["']--check["']/u);

  const plan = await planPromise;
  const artifacts = plan.predecessorDisposition.v2.artifacts;
  assert.deepEqual({bytes: artifacts.generator.bytes, sha256: artifacts.generator.sha256},
    V2.generator);
  assert.deepEqual({bytes: artifacts.tests.bytes, sha256: artifacts.tests.sha256},
    V2.tests);
  assert.deepEqual({bytes: artifacts.json.bytes, sha256: artifacts.json.sha256},
    {bytes: V2.json.bytes, sha256: V2.json.sha256});
  assert.equal(plan.v2SemanticHydration.inheritedPlanFingerprintSha256,
    V2.json.fingerprint);
  assert.equal(plan.predecessorDisposition.v2.oldGeneratorOrCheckInvoked, false);
});

test("rehydrates exactly 17 v2 semantic bindings and replaces only two ledgers", async () => {
  const snapshot = await snapshotPromise;
  const plan = await planPromise;
  const transition = validateEpochTransition(
    snapshot.v2Document.inputBindings,
    semanticBindings(snapshot, plan),
  );
  assert.deepEqual(transition.replacedKeys,
    ["completionLedger", "releaseLedger"]);
  assert.equal(transition.oldBindingCount, 17);
  assert.equal(transition.currentBindingCount, 17);
  assert.equal(transition.nonLedgerBindingsExact, true);
  assert.equal(transition.legacyV1V2ReaderOrCheckInvoked, false);
  assert.equal(plan.inputBindings.completionLedger.sha256,
    CURRENT_LEDGER_SHA256.completionLedger);
  assert.equal(plan.inputBindings.releaseLedger.sha256,
    CURRENT_LEDGER_SHA256.releaseLedger);
});

test("rejects the old fixed epoch and every third semantic drift", async () => {
  const snapshot = await snapshotPromise;
  const plan = await planPromise;
  const old = snapshot.v2Document.inputBindings;
  assert.throws(() => validateEpochTransition(old, structuredClone(old)),
    /permits exactly the two lawful ledger replacements/);

  const thirdDrift = semanticBindings(snapshot, plan);
  thirdDrift.lessonReleases.sha256 = "0".repeat(64);
  assert.throws(() => validateEpochTransition(old, thirdDrift),
    /permits exactly the two lawful ledger replacements/);
});

test("proves both current ledgers through authoritative direct entry points", async () => {
  const proof = (await planPromise).currentLedgerFreshness;
  assert.equal(proof.status, "current-authoritative-generator-proven");
  assert.equal(proof.authoritativeFunctions.completion.export,
    "checkCompletionLedger");
  assert.equal(proof.authoritativeFunctions.lessonRelease.export,
    "checkLessonReleaseLedger");
  assert.equal(proof.proof.codeBindingBoundary.liveAuthoritativeFunctionsExecuted,
    true);
  assert.equal(proof.proof.codeBindingBoundary.recursiveLocalDependenciesHashBound,
    false);
  assert.equal(proof.proof.codeBindingBoundary.packageRuntimeProvenanceBound,
    false);
  assert.equal(proof.proof.completion.actualEqualsExpected, true);
  assert.equal(proof.proof.completion.strictComplete, 0);
  assert.equal(proof.proof.completion.grade4StrictComplete, 0);
  assert.equal(proof.proof.release.actualEqualsExpected, true);
  assert.equal(proof.proof.release.publishedReleaseCount, 0);
  assert.equal(proof.proof.release.grade4PublishedReleaseCount, 0);
  assert.deepEqual(proof.proof.release.l10, {
    releaseId: "lesson-g04-l10-perimeter-area",
    expectedMemberCount: 47,
    strictCompleteCount: 0,
    missingCount: 47,
    assetMismatchCount: 0,
    published: false,
    status: "unpublished",
  });
});

test("fails closed when an authoritative checker says a ledger is stale", async () => {
  await assert.rejects(() => readCurrentSnapshot(PROJECT_ROOT, {
    completionChecker: async () => ({
      ok: false,
      reason: "stale",
      actual: "old",
      expected: "new",
    }),
    releaseChecker: async () => ({
      ok: false,
      reason: "stale",
      actual: "old",
      expected: "new",
    }),
  }), /completion ledger authoritative check failed/);
});

test("fails closed when authoritative expected and actual bytes differ", async () => {
  await assert.rejects(() => readCurrentSnapshot(PROJECT_ROOT, {
    completionChecker: async () => ({
      ok: true,
      reason: "current",
      actual: "different-actual",
      expected: "different-expected",
      ledger: {},
    }),
    releaseChecker: async () => ({
      ok: true,
      reason: "current",
      actual: "different-actual",
      expected: "different-expected",
      ledger: {},
    }),
  }), /expected\/actual bytes differ/);
});

test("reruns authoritative checks and rejects staleness after the snapshot", async () => {
  let completionResult;
  let releaseResult;
  let completionCalls = 0;
  let releaseCalls = 0;
  const completionChecker = async (options) => {
    completionCalls += 1;
    completionResult ??= await checkCompletionLedger(options);
    if (completionCalls === 2) {
      return {...completionResult, ok: false, reason: "stale"};
    }
    return completionResult;
  };
  const releaseChecker = async (options) => {
    releaseCalls += 1;
    releaseResult ??= await checkLessonReleaseLedger(options);
    return releaseResult;
  };
  await assert.rejects(() => runCli(["--check"], PROJECT_ROOT, {
    completionChecker,
    releaseChecker,
  }), /completion ledger authoritative check failed/);
  assert.equal(completionCalls, 2);
  assert.equal(releaseCalls, 2);
});

test("binds exact L10 v5 while retaining every closed gate", async () => {
  const template = (await planPromise).template;
  assert.equal(template.contractVersion, 5);
  assert.deepEqual({
    generator: template.artifacts.generator.sha256,
    tests: template.artifacts.tests.sha256,
    json: template.artifacts.json.sha256,
    markdown: template.artifacts.markdown.sha256,
  }, L10_V5_SHA256);
  assert.equal(template.templateStable, false);
  assert.equal(template.strictCompleteMembers, 0);
  assert.equal(template.requiredMembers, 47);
  assert.equal(template.published, false);
  assert.equal(template.batchAdmissionAllowed, false);
  assert.equal(template.downstreamTransactionDecision, "DO_NOT_APPLY");
});

test("binds exact missing-MP3 v1 without selecting or promoting any bytes", async () => {
  const resolution = (await planPromise).blockers.audio.resolutionPlan;
  assert.deepEqual({
    generator: resolution.artifacts.generator.sha256,
    tests: resolution.artifacts.tests.sha256,
    json: resolution.artifacts.json.sha256,
    markdown: resolution.artifacts.markdown.sha256,
  }, MP3_V1_SHA256);
  assert.equal(resolution.obligationCount, 16);
  assert.equal(resolution.expectedSha256KnownCount, 0);
  assert.equal(resolution.expectedSha256UnknownCount, 16);
  assert.equal(resolution.basenameObservedCount, 14);
  assert.equal(resolution.basenameNotObservedCount, 2);
  assert.equal(resolution.selectedCandidateCount, 0);
  assert.equal(resolution.promotionRecordCount, 0);
  assert.equal(resolution.executorPresent, false);
  assert.equal(resolution.sourceDependencyClosure, false);
  assert.deepEqual(resolution.recoveryStates, RECOVERY_STATES);
});

test("preserves the 11-lesson 610-member four-wave zero-admission plan", async () => {
  const plan = await planPromise;
  assert.equal(plan.waveMembership.uniqueLessonCount, 11);
  assert.equal(plan.waveMembership.subtotal.members, 610);
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.ok(plan.waves.every((wave) =>
    wave.admittedLessonCount === 0 &&
    wave.executable === false &&
    wave.executorPresent === false &&
    wave.acceptanceEffect === "none"));
  assert.ok(Object.values(plan.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(validatePlan(plan), true);
});

test("keeps 0-or-12 publisher risk open and helper design unbound", async () => {
  const plan = await planPromise;
  assert.equal(plan.atomicWholeCourseIntegration
    .currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk
    .currentLeakObserved, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk
    .futureRiskClosed, false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.optionalEvolvingHelperDesign.exactContractBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.designApproved, false);
  assert.equal(plan.optionalEvolvingHelperDesign.implementationSourceBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.helperBinaryBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.executionAuthority, false);
  assert.equal("optionalEvolvingHelperDesign" in plan.inputBindings, false);
  assert.equal(Object.values(plan.inputBindings).some(({path: inputPath}) =>
    inputPath === plan.optionalEvolvingHelperDesign.candidatePath), false);
});

test("accepts only explicit --write or --check and rejects --apply", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]), /Usage/);
  assert.throws(() => parseCliArgs(["--apply"]), /Expected --write or --check/);
  assert.throws(() => parseCliArgs(["--write", "--check"]), /Usage/);
});

test("write mode is strict no-clobber and check mode detects stale bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-batch-v3-test-"));
  const outputPath = "catalog/batches/plan-v3.json";
  const absolute = path.join(root, outputPath);
  try {
    await mkdir(path.dirname(absolute), {recursive: true});
    const plan = await planPromise;
    const created = await writeOrCheckPlan({
      plan,
      projectRoot: root,
      mode: "--write",
      outputPath,
    });
    assert.equal(created.disposition, "created");
    await assert.rejects(() => writeOrCheckPlan({
      plan,
      projectRoot: root,
      mode: "--write",
      outputPath,
    }), /write-no-clobber refuses every overwrite/);
    assert.equal((await writeOrCheckPlan({
      plan,
      projectRoot: root,
      mode: "--check",
      outputPath,
    })).disposition, "current");
    await writeFile(absolute, "foreign-or-stale\n", "utf8");
    await assert.rejects(() => writeOrCheckPlan({
      plan,
      projectRoot: root,
      mode: "--check",
      outputPath,
    }), /is stale/);
    assert.equal(await readFile(absolute, "utf8"), "foreign-or-stale\n");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("checked-in v3 JSON exactly matches authoritative recomputation", async () => {
  const result = await runCli(["--check"]);
  assert.equal(result.checked, OUTPUT_PATH);
  assert.equal(result.disposition, "current");
});
