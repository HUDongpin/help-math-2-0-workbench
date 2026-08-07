import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPendingProjectorLaunchPlan,
  exactObservedWindow,
  parseArguments,
  validatePendingProjectorLaunchPlan,
} from "./launch-g4-l3-ts006-pending-projector.mjs";

test("pending Projector CLI requires explicit plan or launch and rejects SWF/open options", () => {
  assert.deepEqual(parseArguments(["--plan", "--language", "en"]), {mode: "plan", language: "en"});
  assert.deepEqual(parseArguments(["--launch", "--language", "es"]), {mode: "launch", language: "es"});
  for (const args of [
    ["--language", "en"],
    ["--launch", "--language", "fr"],
    ["--launch", "--language", "en", "--swf", "index_local.swf"],
    ["--launch", "--language", "en", "--open"],
  ]) assert.throws(() => parseArguments(args));
});

test("pending EN plan launches one empty exact Projector and cannot promote", async () => {
  const plan = validatePendingProjectorLaunchPlan(await buildPendingProjectorLaunchPlan({language: "en"}));
  assert.equal(plan.operator.displayName, "Dr. Peter Hu");
  assert.equal(plan.arguments.length, 3);
  assert.equal(plan.arguments.some((argument) => /\.swf$/iu.test(argument)), false);
  assert.equal(plan.launchContract.projectorStartsEmpty, true);
  assert.equal(plan.launchContract.shellOpenedByLauncher, false);
  assert.equal(plan.launchContract.namedHumanMustUseFileOpen, true);
  assert.match(plan.launchContract.selectedShell.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(plan.launchContract.promotionEligible, false);
  assert.match(plan.windowObservationContract.captureTool.sha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(plan.windowObservationContract.expectedWindow, {
    ownerName: "Flash Player",
    title: plan.launchContract.selectedShellPath,
    frameWidth: 800,
    frameHeight: 628,
    onScreen: true,
  });
  assert.equal(plan.windowObservationContract.machineObservationCannotAttestHumanFileOpen, true);
  assert.equal(plan.windowObservationContract.runtimeSessionExecutedByObservationAlone, false);
  assert.equal(plan.windowObservationContract.promotionEligible, false);
  assert.equal(plan.preflight.executionGate.pendingCandidateRuntimeLaunchReady, true);
  assert.equal(plan.preflight.executionGate.promotableRuntimeLaunchReady, false);
  assert.equal(plan.traceSpecificationBindings.requirements.length, 2);
  assert.deepEqual(plan.traceSpecificationBindings.requirements.map(({frameDomainId}) => frameDomainId).sort(), ["root", "sprite-23"]);
  assert.equal(plan.traceSpecificationBindings.requirements.every(({language}) => language === "en"), true);
  assert.equal(plan.traceSpecificationBindings.requirements.every(({traceSpecStatus}) => traceSpecStatus === "unresolved"), true);
  assert.equal(plan.traceSpecificationBindings.requirements.every(({orderedStepCount, executedStepCount}) => orderedStepCount === 9 && executedStepCount === 0), true);
  assert.equal(plan.traceSpecificationBindings.executionReportsPresent, false);
});

test("exact shell-window observation accepts only the hash-bound native window identity", async () => {
  const plan = validatePendingProjectorLaunchPlan(await buildPendingProjectorLaunchPlan({language: "en"}));
  const exact = {
    windowID: 7777,
    ownerName: "Flash Player",
    title: plan.launchContract.selectedShellPath,
    frameWidth: 800,
    frameHeight: 628,
    onScreen: true,
  };
  assert.equal(exactObservedWindow(plan, exact), true);
  for (const drift of [
    {...exact, title: ""},
    {...exact, frameWidth: 1920, frameHeight: 1080},
    {...exact, ownerName: "Finder"},
    {...exact, onScreen: false},
    {...exact, windowID: null},
  ]) assert.equal(exactObservedWindow(plan, drift), false);
});
