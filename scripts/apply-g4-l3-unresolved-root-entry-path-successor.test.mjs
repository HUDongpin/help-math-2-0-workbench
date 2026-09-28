import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  applyRootEntryRepairs,
  parseArguments,
} from "./apply-g4-l3-unresolved-root-entry-path-successor.mjs";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function fixture() {
  const animationId = "course-g04-l03-fixture";
  const requirement = (language) => {
    const entryState = {
      authoritativeTraceExecuted: false,
      frameDomainId: "sprite-20",
      kind: "lesson-shell-natural-entry-to-source-static-reachable-domain",
      language,
    };
    return {
      requirementId: `req:sprite-20:lesson-shell-natural-entry:${language}`,
      frameDomainId: "sprite-20",
      entryState,
      entryStateSha256: hash(entryState),
      status: "pending",
      baselineAuthority: "unresolved",
      capturedFrameCount: 0,
      captureManifest: "",
      baselineCaptureManifest: "",
      metricsFile: "",
    };
  };
  return {
    animationId,
    coverage: {schemaVersion: 2, animationId, requirements: [requirement("en"), requirement("es")]},
    domains: [{
      targetTimelineId: "sprite-20",
      requirements: [
        "req:sprite-20:lesson-shell-natural-entry:en",
        "req:sprite-20:lesson-shell-natural-entry:es",
      ],
      rootEntryFrame: 6,
      rootInstanceName: "animation",
      pathCount: 2,
    }],
  };
}

test("repairs only the two source-audited pending entry states", () => {
  const input = fixture();
  const result = applyRootEntryRepairs(input);
  assert.equal(result.repairs.length, 2);
  assert.equal(result.coverage.requirements.every(({entryState}) => entryState.rootEntryFrame === 6), true);
  assert.equal(result.coverage.requirements.every(({entryState, entryStateSha256}) => hash(entryState) === entryStateSha256), true);
  assert.equal(result.coverage.requirements.every(({status}) => status === "pending"), true);
  const checked = applyRootEntryRepairs({...input, coverage: result.coverage, allowRepaired: true});
  assert.deepEqual(checked.coverage, result.coverage);
});

test("fails closed on a conflicting value or a requirement that is no longer pending", () => {
  const conflict = fixture();
  conflict.coverage.requirements[0].entryState.rootEntryFrame = 8;
  conflict.coverage.requirements[0].entryStateSha256 = hash(conflict.coverage.requirements[0].entryState);
  assert.throws(() => applyRootEntryRepairs({...conflict, allowRepaired: true}), /conflicts/);
  const complete = fixture();
  complete.coverage.requirements[0].status = "complete";
  assert.throws(() => applyRootEntryRepairs(complete), /no longer the pending repair preimage/);
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
