import {createHash} from "node:crypto";

export const HOST_GLOSSARY_FAMILY_ID =
  "avm1-literal-host-glossary-release-v1";
export const HOST_GLOSSARY_ACTION_TYPE =
  "request-legacy-host-glossary";

const EXPECTED_CALLS = Object.freeze([
  "_root.DoHyperLinks",
  "_root.animation_mc.animation.stop",
]);
const EXPECTED_TRANSITIONS = Object.freeze([
  "_root.animation_mc.animation.stop",
]);
const ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  behaviorComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function sameArray(left, right) {
  return Array.isArray(left) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseExactStringLiteral(expression) {
  if (typeof expression !== "string" ||
      !/^"(?:[^"\\]|\\.)*"$/.test(expression)) return null;
  try {
    const value = JSON.parse(expression);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"));
}

export function classifyHostGlossaryHandler(handler) {
  const reasons = [];
  const signals = handler?.signals ?? {};
  const assignments = Array.isArray(signals.assignments)
    ? signals.assignments
    : [];
  const keyAssignments = assignments.filter(({target}) =>
    target === "_global.KeyAttribute");
  const clickRecordAssignments = assignments.filter(({target}) =>
    target === "_root.boolSendPageHLAClickRecord");
  const calls = Array.isArray(signals.calls)
    ? signals.calls.map(({target}) => target)
    : [];
  const transitions = Array.isArray(signals.transitions)
    ? signals.transitions.map(({target}) => target)
    : [];
  const literalTerm = keyAssignments.length === 1 &&
      keyAssignments[0].operator === "="
    ? parseExactStringLiteral(keyAssignments[0].expression)
    : null;

  if (!handler?.categories?.includes("glossary-or-hyperlink")) {
    reasons.push("outside-glossary-handler-category");
  }
  if (!sameArray(handler?.event, ["release"])) {
    reasons.push("not-exact-release-event");
  }
  if (handler?.scope?.kind !== "button-definition" ||
      typeof handler.scope.objectId !== "string") {
    reasons.push("not-button-definition-scope");
  }
  if (literalTerm === null) {
    reasons.push("missing-single-literal-key-attribute-assignment");
  }
  if (assignments.length !==
      keyAssignments.length + clickRecordAssignments.length ||
      clickRecordAssignments.some(({operator, expression}) =>
        operator !== "=" || expression !== "true")) {
    reasons.push("unexpected-assignment-sequence");
  }
  if (!sameArray(calls, EXPECTED_CALLS)) {
    reasons.push("unexpected-call-sequence");
  }
  if (!sameArray(transitions, EXPECTED_TRANSITIONS)) {
    reasons.push("unexpected-transition-sequence");
  }
  if ((signals.conditionals?.length ?? 0) !== 0) {
    reasons.push("conditional-handler-out-of-scope");
  }
  if ((signals.randomCalls?.length ?? 0) !== 0) {
    reasons.push("random-handler-out-of-scope");
  }
  if ((signals.sideEffects?.length ?? 0) !== 0) {
    reasons.push("external-side-effect-handler-out-of-scope");
  }
  if (!handler?.hitTarget) {
    reasons.push("missing-button-hit-target-evidence");
  } else {
    if (handler.hitTarget.buttonObjectId !== handler?.scope?.objectId) {
      reasons.push("button-hit-target-identity-mismatch");
    }
    if (!Array.isArray(handler.hitTarget.hitRecords) ||
        handler.hitTarget.hitRecords.length === 0) {
      reasons.push("missing-button-hit-shape-record");
    }
    if (!Array.isArray(handler.hitTarget.placements) ||
        handler.hitTarget.placements.length === 0) {
      reasons.push("missing-button-placement-evidence");
    }
  }

  return deepFreeze({
    eligible: reasons.length === 0,
    reasons: sortedUnique(reasons),
    literalTerm,
    clickRecordAssignmentCount: clickRecordAssignments.length,
  });
}

function sourceOperationSequence(handler) {
  const assignments = (handler.signals?.assignments ?? []).map((item) => ({
    kind: "assignment",
    target: item.target,
    operator: item.operator,
    expression: item.expression,
    sourceLine: item.evidence?.line ?? null,
  }));
  const calls = (handler.signals?.calls ?? []).map((item) => ({
    kind: "call",
    target: item.target,
    arguments: item.arguments,
    sourceLine: item.evidence?.line ?? null,
  }));
  return [...assignments, ...calls].sort((left, right) =>
    (left.sourceLine ?? Number.MAX_SAFE_INTEGER) -
      (right.sourceLine ?? Number.MAX_SAFE_INTEGER));
}

function intentIdFor(animationId, handler) {
  return `host-glossary-${sha256([
    animationId,
    handler.id,
    handler.script,
    handler.bodySha256,
  ].join("\0")).slice(0, 24)}`;
}

export function deriveHostGlossaryMemberContract({
  member,
  scenarioInventory,
  scenarioInventoryBinding,
  sourceBinding,
} = {}) {
  invariant(member?.animationId, "exact release member is required");
  invariant(scenarioInventory?.animationId === member.animationId,
    `${member.animationId}: scenario inventory identity mismatch`);
  invariant(
    scenarioInventory.inventoryStatus ===
      "static-exhaustive-runtime-unverified" &&
      scenarioInventory.migrationStatusChanged === false,
    `${member.animationId}: scenario inventory authority drifted`,
  );
  invariant(
    scenarioInventory.source?.swfSha256 === member.source?.sha256 &&
      sourceBinding?.sha256 === member.source.sha256,
    `${member.animationId}: release, inventory, and source SHA-256 disagree`,
  );
  invariant(
    Array.isArray(scenarioInventory.authoritativeRuntimeEvidence) &&
      scenarioInventory.authoritativeRuntimeEvidence.length === 0,
    `${member.animationId}: this runtime-unverified contract cannot absorb runtime evidence`,
  );
  invariant(scenarioInventory.strictAcceptanceEffect === "none; this inventory is an audit/specification artifact and does not advance migration status or satisfy runtime, visual, audio, human, or owner gates",
    `${member.animationId}: scenario inventory strict-acceptance boundary drifted`);

  const handlers = scenarioInventory.interactions?.handlers ?? [];
  const glossaryHandlers = handlers.filter((handler) =>
    handler.categories?.includes("glossary-or-hyperlink"));
  const intents = [];
  const exclusions = [];

  for (const handler of glossaryHandlers) {
    const classification = classifyHostGlossaryHandler(handler);
    if (!classification.eligible) {
      exclusions.push({
        animationId: member.animationId,
        scriptId: handler.id,
        script: handler.script,
        bodySha256: handler.bodySha256,
        reasonCodes: classification.reasons,
      });
      continue;
    }
    const operationSequence = sourceOperationSequence(handler);
    const legacyEffectDispositions = operationSequence.map((operation) => ({
      ...operation,
      disposition: operation.target === "_global.KeyAttribute"
        ? "project-literal-term-only-do-not-write-legacy-global"
        : operation.target === "_root.boolSendPageHLAClickRecord"
          ? "record-source-intent-only-do-not-write-legacy-root"
          : operation.target === "_root.DoHyperLinks"
            ? "emit-blocked-intent-only-do-not-call-unbound-host"
            : "record-source-stop-only-do-not-control-unverified-timeline",
      executedByContract: false,
    }));
    intents.push({
      intentId: intentIdFor(member.animationId, handler),
      animationId: member.animationId,
      sourceSwfSha256: member.source.sha256,
      event: "release",
      literalKeyAttribute: classification.literalTerm,
      sourceHandler: {
        scriptId: handler.id,
        script: handler.script,
        bodySha256: handler.bodySha256,
        lineStart: handler.lineStart,
        lineEnd: handler.lineEnd,
        buttonObjectId: handler.scope.objectId,
      },
      staticButtonEvidence: {
        buttonObjectId: handler.hitTarget.buttonObjectId,
        hitRecords: handler.hitTarget.hitRecords,
        placements: handler.hitTarget.placements,
        exactStageBoundsStatus: handler.hitTarget.exactStageBoundsStatus,
        runtimeReachabilityStatus: "unverified",
      },
      observedOperationSequence: operationSequence,
      legacyEffectDispositions,
      sourceClickRecordAssignmentCount:
        classification.clickRecordAssignmentCount,
      executionStatus: "blocked-host-runtime-unverified",
      hostEffectsExecutable: false,
      strictAcceptanceEffect: "none",
    });
  }

  return deepFreeze({
    animationId: member.animationId,
    releaseOrdinal: member.ordinal,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    source: sourceBinding,
    scenarioInventory: scenarioInventoryBinding,
    inventoryStatus: scenarioInventory.inventoryStatus,
    totalHandlerCount: handlers.length,
    glossaryCategoryHandlerCount: glossaryHandlers.length,
    eligibleIntentCount: intents.length,
    excludedGlossaryHandlerCount: exclusions.length,
    terms: sortedUnique(intents.map(({literalKeyAttribute}) =>
      literalKeyAttribute)),
    intents,
    exclusions,
    authoritativeRuntimeEvidenceCount: 0,
    runtimeStatus: "unverified",
    strictAcceptanceEffect: "none",
  });
}

export function createFailClosedHostGlossaryState() {
  return deepFreeze({
    schemaVersion: 1,
    familyId: HOST_GLOSSARY_FAMILY_ID,
    status: "idle-runtime-unverified",
    attemptCount: 0,
    lastAttempt: null,
    sourceProjection: null,
    blockerCodes: [],
    effectsExecuted: {
      legacyGlobalWrites: 0,
      legacyRootWrites: 0,
      hostCallbacks: 0,
      timelineControls: 0,
      networkRequests: 0,
      audioOperations: 0,
    },
    runtimeVerified: false,
    behaviorAccepted: false,
    strictAcceptanceEffect: "none",
  });
}

function blockedState(state, {
  status,
  action,
  sourceProjection = null,
  blockerCodes,
}) {
  const attemptCount = Number.isSafeInteger(state?.attemptCount) &&
      state.attemptCount >= 0
    ? state.attemptCount + 1
    : 1;
  return deepFreeze({
    schemaVersion: 1,
    familyId: HOST_GLOSSARY_FAMILY_ID,
    status,
    attemptCount,
    lastAttempt: action ?? null,
    sourceProjection,
    blockerCodes: sortedUnique(blockerCodes),
    effectsExecuted: {
      legacyGlobalWrites: 0,
      legacyRootWrites: 0,
      hostCallbacks: 0,
      timelineControls: 0,
      networkRequests: 0,
      audioOperations: 0,
    },
    runtimeVerified: false,
    behaviorAccepted: false,
    strictAcceptanceEffect: "none",
  });
}

function allIntents(contract) {
  return (contract?.members ?? []).flatMap(({intents}) => intents ?? []);
}

export function reduceFailClosedHostGlossaryAction(
  contract,
  state,
  action,
) {
  validateHostGlossaryReleaseContract(contract);
  const exactAction = action && typeof action === "object" ? {
    type: action.type ?? null,
    releaseId: action.releaseId ?? null,
    animationId: action.animationId ?? null,
    intentId: action.intentId ?? null,
    sourceSwfSha256: action.sourceSwfSha256 ?? null,
    event: action.event ?? null,
  } : null;
  const intent = allIntents(contract).find(({intentId}) =>
    intentId === exactAction?.intentId);
  const invalidReasons = [];
  if (exactAction?.type !== HOST_GLOSSARY_ACTION_TYPE) {
    invalidReasons.push("invalid-action-type");
  }
  if (exactAction?.releaseId !== contract.releaseId) {
    invalidReasons.push("release-identity-mismatch");
  }
  if (!intent) {
    invalidReasons.push("unknown-intent-id");
  } else {
    if (exactAction.animationId !== intent.animationId) {
      invalidReasons.push("animation-identity-mismatch");
    }
    if (exactAction.sourceSwfSha256 !== intent.sourceSwfSha256) {
      invalidReasons.push("source-identity-mismatch");
    }
    if (exactAction.event !== intent.event) {
      invalidReasons.push("event-identity-mismatch");
    }
  }
  if (invalidReasons.length > 0) {
    return blockedState(state, {
      status: "blocked-invalid-action",
      action: exactAction,
      blockerCodes: ["fail-closed-invalid-action", ...invalidReasons],
    });
  }

  const hasClickRecordWrite = intent.legacyEffectDispositions.some(({target}) =>
    target === "_root.boolSendPageHLAClickRecord");
  return blockedState(state, {
    status: "blocked-host-runtime-unverified",
    action: exactAction,
    sourceProjection: {
      intentId: intent.intentId,
      animationId: intent.animationId,
      literalKeyAttribute: intent.literalKeyAttribute,
      sourceHandler: intent.sourceHandler,
      requestedLegacyOperations: intent.legacyEffectDispositions,
      runtimeReachabilityStatus:
        intent.staticButtonEvidence.runtimeReachabilityStatus,
    },
    blockerCodes: [
      "authoritative-original-runtime-not-observed",
      "legacy-global-key-attribute-write-disabled",
      "legacy-host-DoHyperLinks-callback-unbound",
      "legacy-animation-stop-disabled",
      ...(hasClickRecordWrite
        ? ["legacy-root-click-record-write-disabled"]
        : []),
    ],
  });
}

export function buildHostGlossaryFixtures(contract) {
  validateHostGlossaryReleaseContract(contract);
  const initialState = createFailClosedHostGlossaryState();
  const validReleaseFixtures = allIntents(contract).map((intent) => {
    const action = {
      type: HOST_GLOSSARY_ACTION_TYPE,
      releaseId: contract.releaseId,
      animationId: intent.animationId,
      intentId: intent.intentId,
      sourceSwfSha256: intent.sourceSwfSha256,
      event: intent.event,
    };
    return {
      fixtureId: `fixture-${intent.intentId}`,
      action,
      expectedState: reduceFailClosedHostGlossaryAction(
        contract,
        initialState,
        action,
      ),
    };
  });
  const first = validReleaseFixtures[0]?.action;
  invariant(first, "at least one eligible glossary intent is required");
  const invalidActions = [
    {...first, type: "execute-legacy-host-glossary"},
    {...first, releaseId: `${contract.releaseId}-mismatch`},
    {...first, animationId: `${first.animationId}-mismatch`},
    {...first, intentId: `${first.intentId}-unknown`},
    {...first, sourceSwfSha256: "0".repeat(64)},
    {...first, event: "rollOver"},
  ];
  const invalidActionFixtures = invalidActions.map((action, index) => ({
    fixtureId: `fixture-invalid-${String(index + 1).padStart(2, "0")}`,
    action,
    expectedState: reduceFailClosedHostGlossaryAction(
      contract,
      initialState,
      action,
    ),
  }));
  return deepFreeze({
    validReleaseFixtures,
    invalidActionFixtures,
  });
}

export function validateHostGlossaryReleaseContract(contract) {
  invariant(contract?.schemaVersion === 1,
    "host glossary contract schema version must be 1");
  invariant(contract.familyId === HOST_GLOSSARY_FAMILY_ID,
    "host glossary contract family changed");
  invariant(typeof contract.releaseId === "string" &&
    contract.releaseId.length > 0, "host glossary release ID is required");
  invariant(contract.status === "static-contract-runtime-unverified",
    "host glossary contract must stay runtime-unverified");
  invariant(Array.isArray(contract.members) && contract.members.length > 0,
    "host glossary contract members are required");
  const intents = allIntents(contract);
  invariant(intents.length === contract.summary?.eligibleIntentCount &&
    intents.length > 0, "host glossary intent count disagrees");
  invariant(new Set(intents.map(({intentId}) => intentId)).size === intents.length,
    "host glossary intent IDs must be unique");
  for (const intent of intents) {
    invariant(intent.executionStatus === "blocked-host-runtime-unverified" &&
      intent.hostEffectsExecutable === false &&
      intent.strictAcceptanceEffect === "none",
    `${intent.intentId}: execution boundary drifted`);
    invariant(intent.event === "release" &&
      typeof intent.literalKeyAttribute === "string" &&
      intent.literalKeyAttribute.length > 0 &&
      /^[a-f0-9]{64}$/.test(intent.sourceSwfSha256) &&
      intent.staticButtonEvidence?.runtimeReachabilityStatus === "unverified",
    `${intent.intentId}: source identity or runtime boundary drifted`);
    const operationTargets = intent.observedOperationSequence
      .map(({target}) => target);
    invariant(operationTargets[0] === "_global.KeyAttribute" &&
      operationTargets.includes("_root.DoHyperLinks") &&
      operationTargets.includes("_root.animation_mc.animation.stop") &&
      operationTargets.every((target) => [
        "_global.KeyAttribute",
        "_root.boolSendPageHLAClickRecord",
        "_root.DoHyperLinks",
        "_root.animation_mc.animation.stop",
      ].includes(target)),
    `${intent.intentId}: source operation family expanded`);
    invariant(intent.legacyEffectDispositions.every(({executedByContract}) =>
      executedByContract === false),
    `${intent.intentId}: contract must not execute legacy effects`);
  }
  invariant(JSON.stringify(contract.acceptanceEffects) ===
    JSON.stringify(ACCEPTANCE_EFFECTS),
  "host glossary contract acceptance matrix changed");
  invariant(contract.rendererRegistryChanged === false &&
    contract.migrationStatusChanged === false &&
    contract.summary?.authoritativeRuntimeEvidenceCount === 0 &&
    contract.summary?.hostEffectsExecutedCount === 0 &&
    contract.summary?.rendererRegistrationCount === 0 &&
    contract.strictAcceptanceEffect === "none",
    "host glossary contract changed strict acceptance");
  return true;
}

export function acceptanceNeutralHostGlossaryEffects() {
  return ACCEPTANCE_EFFECTS;
}
