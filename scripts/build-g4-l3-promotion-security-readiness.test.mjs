import assert from "node:assert/strict";
import test from "node:test";

import {parseArguments, renderMarkdown} from "./build-g4-l3-promotion-security-readiness.mjs";

test("security readiness CLI cannot enable or promote", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--enable"]), /Unknown option/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});

test("security readiness prose distinguishes synthetic pass from production authority", () => {
  const markdown = renderMarkdown({
    testResult: {passed: 163, tests: 163},
    readiness: {
      state: "security-suite-passed-production-fail-closed",
      capturePromotionDisposition: "pending-candidate-only",
      signedLiveSessionConsumerReady: true,
      signedLiveSessionSuccessDisposition: "verified-live-session-pending-candidate",
      signedLiveSessionRequiredDistinctSubjectsAndKeys: 5,
      retroactiveLiveSessionClaimRejected: true,
    },
    productionFuses: {allClosed: true},
    remainingProductionGates: [
      {code: "external-trust-root-not-bound"},
      {code: "named-independent-review-role-not-bound"},
    ],
  });
  assert.match(markdown, /163\/163/);
  assert.match(markdown, /Production promotion remains intentionally disabled/);
  assert.match(markdown, /verified-live-session-pending-candidate/);
  assert.match(markdown, /5 distinct subjects and keys/);
  assert.match(markdown, /retroactive PID claims rejected: \*\*true\*\*/);
  assert.match(markdown, /does not authorize a runtime session/);
  assert.match(markdown, /external-trust-root-not-bound/);
  assert.match(markdown, /named-independent-review-role-not-bound/);
});
