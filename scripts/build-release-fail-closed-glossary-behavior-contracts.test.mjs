import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildReleaseHostGlossaryArtifacts,
  deriveReleaseHostGlossaryArtifacts,
  parseArguments,
} from "./build-release-fail-closed-glossary-behavior-contracts.mjs";
import {
  HOST_GLOSSARY_ACTION_TYPE,
  HOST_GLOSSARY_FAMILY_ID,
  buildHostGlossaryFixtures,
  classifyHostGlossaryHandler,
  createFailClosedHostGlossaryState,
  reduceFailClosedHostGlossaryAction,
  validateHostGlossaryReleaseContract,
} from "./lib/fail-closed-host-glossary-contract.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const CONTRACT_PATH =
  `reports/lesson-release-behavior-contracts/${RELEASE_ID}/` +
  "host-glossary-release-contracts.json";
const FIXTURE_PATH =
  `reports/lesson-release-behavior-contracts/${RELEASE_ID}/` +
  "host-glossary-release-fixtures.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("host glossary CLI binds one exact release and an optional exact subset", () => {
  assert.deepEqual(parseArguments([
    "--release-id", RELEASE_ID,
    "--id", "course-g04-l10-vb-003",
    "--check",
  ]), {
    check: true,
    ids: ["course-g04-l10-vb-003"],
    releaseId: RELEASE_ID,
  });
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(() => parseArguments([
    "--release-id", RELEASE_ID,
    "--release-id", RELEASE_ID,
  ]), /only once/);
  assert.throws(() => parseArguments([
    "--release-id", RELEASE_ID,
    "--id", "same",
    "--id", "same",
  ]), /duplicate --id/);
  assert.throws(() => parseArguments([
    "--release-id", RELEASE_ID,
    "--unknown",
  ]), /Unknown argument/);
});

test("L10 exact static handler family produces 245 fail-closed intents", async () => {
  const contract = await deriveReleaseHostGlossaryArtifacts({
    releaseId: RELEASE_ID,
  });
  assert.equal(validateHostGlossaryReleaseContract(contract), true);
  assert.equal(contract.familyId, HOST_GLOSSARY_FAMILY_ID);
  assert.equal(contract.status, "static-contract-runtime-unverified");
  assert.deepEqual(contract.summary, {
    releaseMemberCount: 47,
    selectedReleaseMemberCount: 47,
    scenarioInventoryCount: 47,
    totalHandlerCount: 828,
    glossaryCategoryHandlerCount: 262,
    eligibleIntentCount: 245,
    excludedGlossaryHandlerCount: 17,
    memberWithEligibleIntentCount: 38,
    memberWithoutEligibleIntentCount: 9,
    uniqueLiteralTermCount: 58,
    staticPlacementEvidenceCount: 533,
    staticHitShapeRecordCount: 245,
    authoritativeRuntimeEvidenceCount: 0,
    hostEffectsExecutedCount: 0,
    rendererRegistrationCount: 0,
  });
  assert.deepEqual(contract.membersWithoutEligibleIntents, [
    "course-g04-l10-ir-001",
    "course-g04-l10-rw-003",
    "course-g04-l10-in-014",
    "course-g04-l10-in-015",
    "course-g04-l10-ts-006",
    "course-g04-l10-fq-001",
    "course-g04-l10-fq-002",
    "course-g04-l10-fq-003",
    "shell-course-g04-l10-index-local",
  ]);
  assert.ok(contract.literalTerms.includes("Area"));
  assert.ok(contract.literalTerms.includes("area"));
  assert.ok(contract.literalTerms.includes("Strategy"));
  assert.ok(contract.literalTerms.includes("strategy"));
  const intents = contract.members.flatMap(({intents}) => intents);
  assert.equal(new Set(intents.map(({intentId}) => intentId)).size, 245);
  assert.equal(intents.reduce((sum, intent) =>
    sum + intent.sourceClickRecordAssignmentCount, 0), 175);
  assert.equal(intents.filter(({sourceClickRecordAssignmentCount}) =>
    sourceClickRecordAssignmentCount > 0).length, 160);
  assert.equal(Math.max(...intents.map(({sourceClickRecordAssignmentCount}) =>
    sourceClickRecordAssignmentCount)), 3);
  for (const intent of intents) {
    assert.equal(intent.event, "release");
    assert.equal(intent.executionStatus, "blocked-host-runtime-unverified");
    assert.equal(intent.hostEffectsExecutable, false);
    assert.equal(intent.staticButtonEvidence.runtimeReachabilityStatus,
      "unverified");
    assert.equal(intent.staticButtonEvidence.hitRecords.length > 0, true);
    assert.equal(intent.staticButtonEvidence.placements.length > 0, true);
    assert.equal(intent.legacyEffectDispositions.every(({executedByContract}) =>
      executedByContract === false), true);
  }
  assert.equal(Object.values(contract.acceptanceEffects)
    .every((value) => value === false), true);
  assert.equal(contract.rendererRegistryChanged, false);
  assert.equal(contract.migrationStatusChanged, false);
  assert.equal(contract.strictAcceptanceEffect, "none");
});

test("generic derivation supports an exact release member subset", async () => {
  const contract = await deriveReleaseHostGlossaryArtifacts({
    ids: ["course-g04-l10-vb-003"],
    releaseId: RELEASE_ID,
  });
  assert.equal(contract.summary.releaseMemberCount, 47);
  assert.equal(contract.summary.selectedReleaseMemberCount, 1);
  assert.equal(contract.summary.scenarioInventoryCount, 1);
  assert.equal(contract.summary.totalHandlerCount, 3);
  assert.equal(contract.summary.glossaryCategoryHandlerCount, 3);
  assert.equal(contract.summary.eligibleIntentCount, 3);
  assert.equal(contract.summary.excludedGlossaryHandlerCount, 0);
  assert.equal(contract.summary.uniqueLiteralTermCount, 3);
  assert.deepEqual(contract.literalTerms, [
    "Length",
    "Quantity",
    "Unit of measurement",
  ]);
  await assert.rejects(() => deriveReleaseHostGlossaryArtifacts({
    ids: ["not-a-release-member"],
    releaseId: RELEASE_ID,
  }), /not a member of exact release/);
});

test("handler classifier rejects every expansion beyond the exact static family", async () => {
  const inventory = JSON.parse(await readFile(
    "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json",
    "utf8",
  ));
  const source = inventory.interactions.handlers[0];
  assert.equal(classifyHostGlossaryHandler(source).eligible, true);

  const cases = [
    ["event", (handler) => { handler.event = ["rollOver"]; },
      "not-exact-release-event"],
    ["literal", (handler) => {
      handler.signals.assignments[0].expression = "runtimeTerm";
    }, "missing-single-literal-key-attribute-assignment"],
    ["conditional", (handler) => {
      handler.signals.conditionals.push({expression: "unknown"});
    }, "conditional-handler-out-of-scope"],
    ["random", (handler) => {
      handler.signals.randomCalls.push({target: "random"});
    }, "random-handler-out-of-scope"],
    ["side-effect", (handler) => {
      handler.signals.sideEffects.push({target: "getURL"});
    }, "external-side-effect-handler-out-of-scope"],
    ["call", (handler) => { handler.signals.calls.pop(); },
      "unexpected-call-sequence"],
    ["placement", (handler) => { handler.hitTarget.placements = []; },
      "missing-button-placement-evidence"],
  ];
  for (const [label, mutate, reason] of cases) {
    const candidate = structuredClone(source);
    mutate(candidate);
    const result = classifyHostGlossaryHandler(candidate);
    assert.equal(result.eligible, false, label);
    assert.ok(result.reasons.includes(reason), label);
  }
});

test("all valid and invalid fixture actions execute the pure fail-closed reducer", async () => {
  const contract = await deriveReleaseHostGlossaryArtifacts({
    releaseId: RELEASE_ID,
  });
  const fixtures = buildHostGlossaryFixtures(contract);
  const initial = createFailClosedHostGlossaryState();
  assert.equal(fixtures.validReleaseFixtures.length, 245);
  assert.equal(fixtures.invalidActionFixtures.length, 6);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.effectsExecuted), true);

  for (const fixture of fixtures.validReleaseFixtures) {
    const result = reduceFailClosedHostGlossaryAction(
      contract,
      initial,
      fixture.action,
    );
    assert.deepEqual(result, fixture.expectedState, fixture.fixtureId);
    assert.equal(result.status, "blocked-host-runtime-unverified");
    assert.equal(result.lastAttempt.type, HOST_GLOSSARY_ACTION_TYPE);
    assert.equal(result.sourceProjection.literalKeyAttribute.length > 0, true);
    assert.equal(Object.values(result.effectsExecuted)
      .every((count) => count === 0), true);
    assert.equal(result.runtimeVerified, false);
    assert.equal(result.behaviorAccepted, false);
    assert.equal(result.strictAcceptanceEffect, "none");
    assert.equal(Object.isFrozen(result), true);
  }
  for (const fixture of fixtures.invalidActionFixtures) {
    const result = reduceFailClosedHostGlossaryAction(
      contract,
      initial,
      fixture.action,
    );
    assert.deepEqual(result, fixture.expectedState, fixture.fixtureId);
    assert.equal(result.status, "blocked-invalid-action");
    assert.equal(result.sourceProjection, null);
    assert.ok(result.blockerCodes.includes("fail-closed-invalid-action"));
    assert.equal(Object.values(result.effectsExecuted)
      .every((count) => count === 0), true);
  }
});

test("executable contract stays out of renderer registries and exposes no effect primitive", async () => {
  const [moduleSource, ...protectedRegistries] = await Promise.all([
    readFile("scripts/lib/fail-closed-host-glossary-contract.mjs", "utf8"),
    ...[
      "packages/demos/prototype-registry.json",
      "packages/demos/src/registry.generated.ts",
      "packages/demos/src/prototype-manifest.ts",
      "apps/web/lib/whole-lesson-course-registry.ts",
    ].map((file) => readFile(file, "utf8")),
  ]);
  for (const pattern of [
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /localStorage/,
    /sessionStorage/,
    /document\./,
    /window\./,
  ]) assert.doesNotMatch(moduleSource, pattern);
  for (const registry of protectedRegistries) {
    assert.doesNotMatch(registry,
      /avm1-literal-host-glossary-release-v1/);
    assert.doesNotMatch(registry,
      /host-glossary-release-contracts\.json/);
  }
});

test("checked-in L10 contract and fixtures are current and acceptance-neutral", async () => {
  const result = await buildReleaseHostGlossaryArtifacts({
    check: true,
    releaseId: RELEASE_ID,
  });
  assert.equal(result.operation, "check");
  assert.equal(result.selectedMemberCount, 47);
  assert.equal(result.eligibleIntentCount, 245);
  assert.equal(result.excludedGlossaryHandlerCount, 17);
  assert.equal(result.memberWithEligibleIntentCount, 38);
  assert.equal(result.uniqueLiteralTermCount, 58);
  assert.equal(result.staticPlacementEvidenceCount, 533);
  assert.equal(result.rendererRegistryChanged, false);
  assert.equal(result.migrationStatusChanged, false);
  assert.equal(result.strictAcceptanceEffect, "none");

  const [contractBytes, fixtureBytes] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(FIXTURE_PATH),
  ]);
  const contract = JSON.parse(contractBytes);
  const fixtures = JSON.parse(fixtureBytes);
  assert.equal(validateHostGlossaryReleaseContract(contract), true);
  assert.deepEqual(fixtures.contract, {
    path: CONTRACT_PATH,
    bytes: contractBytes.length,
    sha256: sha256(contractBytes),
  });
  assert.equal(fixtures.summary.validReleaseFixtureCount, 245);
  assert.equal(fixtures.summary.invalidActionFixtureCount, 6);
  assert.equal(fixtures.summary.effectsExecutedCount, 0);
  assert.equal(fixtures.summary.runtimeVerifiedFixtureCount, 0);
  assert.equal(fixtures.rendererRegistryChanged, false);
  assert.equal(fixtures.migrationStatusChanged, false);
  assert.equal(fixtures.strictAcceptanceEffect, "none");
});
