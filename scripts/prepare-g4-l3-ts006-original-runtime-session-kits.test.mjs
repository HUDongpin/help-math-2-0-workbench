import assert from "node:assert/strict";
import {lstat, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildTs006SessionKitPlan,
  parseArguments,
  prepareTs006SessionKits,
  renderMarkdown,
  validateTs006SessionKitManifest,
  validateTs006SessionKitReadiness,
} from "./prepare-g4-l3-ts006-original-runtime-session-kits.mjs";

const outputRoot = "work/g4-l3-ts006-original-runtime-session-kits";

let planPromise;
function buildOnce() {
  planPromise ||= buildTs006SessionKitPlan();
  return planPromise;
}

test("TS006 session-kit plan partitions four natural-trace requirements across EN and ES", async () => {
  const plan = await buildOnce();
  assert.deepEqual(plan.kits.map(({language}) => language), ["en", "es"]);
  assert.deepEqual(plan.kits.map(({manifest}) => manifest.sessionIdentity.coverageRequirements.length), [2, 2]);
  assert.equal(new Set(plan.kits.flatMap(({manifest}) =>
    manifest.sessionIdentity.coverageRequirements.map(({requirementId}) => requirementId))).size, 4);
  assert.ok(plan.kits.every(({manifest}) => manifest.containmentMechanismCandidates.length === 8));
  assert.ok(plan.kits.every(({manifest}) => manifest.accountIsolationCandidate.mode
    === "same-account-separate-disposable-process-profiles"));
  assert.ok(plan.kits.every(({manifest}) => manifest.accountIsolationCandidate.additionalMacosAccountsRequired === false));
  assert.ok(plan.kits.every(({manifest}) => manifest.humanRoleDesignationCandidate.displayName === "Dr. Peter Hu"));
  assert.ok(plan.kits.every(({manifest}) => manifest.humanRoleDesignationCandidate.distinctNamedHumans === 1));
  assert.ok(plan.kits.every(({manifest}) => manifest.humanRoleDesignationCandidate.independentVisualReviewSatisfied === false));
  assert.ok(plan.kits.every(({manifest}) => manifest.humanRoleDesignationCandidate.productionTrustRootEligible === false));
  assert.ok(plan.kits.every(({manifest}) => manifest.runtimeHost.shell.sha256
    === "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e"));
});

test("TS006 session kits record authorization intent without inventing identities, signatures, accounts, launches, or acceptance", async () => {
  const plan = await buildOnce();
  for (const kit of plan.kits) {
    const manifest = validateTs006SessionKitManifest(kit.manifest);
    assert.equal(manifest.executionGate.userAuthorizationIntentRecorded, true);
    assert.equal(manifest.executionGate.currentAdminAccountExceptionIntentRecorded, true);
    assert.equal(manifest.executionGate.ownerSignatureBound, false);
    assert.equal(manifest.executionGate.namedOperatorBound, false);
    assert.equal(manifest.executionGate.freshMacosAccountBound, false);
    assert.equal(manifest.executionGate.disposableProcessProfileBound, false);
    assert.equal(manifest.executionGate.launchCommandPresent, false);
    assert.equal(manifest.executionGate.runtimeSessionExecuted, false);
    assert.equal(manifest.executionGate.originalRuntimeExecutionReady, false);
    assert.equal(manifest.acceptance.strictMigrationComplete, false);

    const authorization = JSON.parse(kit.files["AUTHORIZATION.template.json"]);
    assert.equal(authorization.owner.fullName, null);
    assert.equal(authorization.operator.fullName, null);
    assert.equal(authorization.independentVisualReviewer.fullName, null);
    assert.equal(authorization.externalTrustRoot.path, null);
    assert.equal(authorization.launchCommand, null);
    assert.equal(authorization.runtimeExecutionAuthorized, false);
    assert.equal(authorization.accountIsolationDecision.additionalMacosAccountsRequired, false);
    assert.equal(authorization.accountIsolationDecision.disposableProfileRoot, null);
    assert.equal(authorization.accountIsolationDecision.exceptionSignatureEnvelope, null);

    const observation = JSON.parse(kit.files["RUNTIME_OBSERVATION.template.json"]);
    assert.equal(observation.runtimeSessionExecuted, false);
    assert.deepEqual(observation.pngFrames, []);
    assert.deepEqual(observation.orderedStateHashChain, []);
  }
});

test("TS006 session-kit validators reject fabricated execution or acceptance", async () => {
  const plan = await buildOnce();
  const executed = structuredClone(plan.kits[0].manifest);
  executed.executionGate.runtimeSessionExecuted = true;
  assert.throws(() => validateTs006SessionKitManifest(executed), /execution gate was promoted/);

  const accepted = structuredClone(plan.kits[0].manifest);
  accepted.acceptance.ownerAccepted = true;
  assert.throws(() => validateTs006SessionKitManifest(accepted), /acceptance was promoted/);
});

test("current TS006 EN/ES session kits and readiness report are deterministic and immutable", async () => {
  const result = await prepareTs006SessionKits({check: true});
  const report = validateTs006SessionKitReadiness(result.report);
  assert.equal(result.action, "verified");
  assert.equal(result.changed, 0);
  assert.equal(report.readiness.immutableEmptySessionKitsPrepared, true);
  assert.equal(report.readiness.namedOperatorsBound, 0);
  assert.equal(report.readiness.currentAdminAccountExceptionIntentRecorded, true);
  assert.equal(report.readiness.userStatedOwnerNameRecorded, true);
  assert.equal(report.readiness.userStatedOperatorNameRecorded, true);
  assert.equal(report.readiness.distinctNamedHumansRecorded, 1);
  assert.equal(report.readiness.independentRoleSeparationSatisfied, false);
  assert.equal(report.readiness.additionalMacosAccountsRequired, 0);
  assert.equal(report.readiness.disposableProcessProfilesBound, 0);
  assert.equal(report.readiness.runtimeSessionsExecuted, 0);
  assert.equal(report.readiness.originalRuntimeExecutionReady, false);
  assert.match(renderMarkdown(report), /No new macOS account is required or created/);

  for (const language of ["en", "es"]) {
    const directory = await lstat(path.join(outputRoot, language));
    assert.equal(directory.mode & 0o777, 0o555);
    for (const name of [
      "kit-manifest.json",
      "AUTHORIZATION.template.json",
      "PREFLIGHT.template.json",
      "LAUNCH_RECEIPT.template.json",
      "RUNTIME_OBSERVATION.template.json",
      "SESSION_ATTESTATION.template.json",
      "OPERATOR_CARD.md",
    ]) {
      const file = await lstat(path.join(outputRoot, language, name));
      assert.equal(file.isFile(), true);
      assert.equal(file.isSymbolicLink(), false);
      assert.equal(file.nlink, 1);
      assert.equal(file.mode & 0o777, 0o444);
    }
  }
});

test("TS006 session-kit CLI cannot create accounts, launch, sign, approve, capture, or promote", async () => {
  assert.deepEqual(parseArguments([]), {check: false, refreshEmptyTemplates: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, refreshEmptyTemplates: false});
  assert.deepEqual(parseArguments(["--refresh-empty-templates"]), {check: false, refreshEmptyTemplates: true});
  assert.throws(() => parseArguments(["--check", "--refresh-empty-templates"]), /mutually exclusive/);
  for (const argument of ["--create-account", "--launch", "--sign", "--approve", "--capture", "--promote"]) {
    assert.throws(() => parseArguments([argument]), /Unknown option/);
  }
  const gitignore = await readFile(".gitignore", "utf8");
  assert.match(gitignore, /^work\/g4-l3-ts006-original-runtime-session-kits\/$/mu);
  assert.match(gitignore, /^work\/g4-l3-ts006-original-runtime-authorization-intake\/$/mu);
});
