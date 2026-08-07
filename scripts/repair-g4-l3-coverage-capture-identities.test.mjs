import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  buildExpectedPendingCoverageDocuments,
  buildPendingNestedRequirement,
  buildPendingRootRequirement,
  canonicalJson,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";
import {
  parseArguments,
  repairedCoverageDocument,
} from "./repair-g4-l3-coverage-capture-identities.mjs";

function legacy(requirement) {
  const output = structuredClone(requirement);
  delete output.entryState.rootEntryFrame;
  delete output.entryState.scenario;
  delete output.entryState.seed;
  if (output.frameDomainId === "root") delete output.entryState.frameDomainId;
  output.entryStateSha256 = createHash("sha256").update(Buffer.from(canonicalJson(output.entryState))).digest("hex");
  return output;
}

test("repairs only the canonical entry-state capture identity fields", async () => {
  const item = {animationId: "course-g04-l03-ts-006", sequence: 34, nativeRuntimeFacts: {rootFrameCount: 10}};
  const manifest = buildExpectedPendingCoverageDocuments({item, manifest: {
    animationId: item.animationId,
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default"}],
    implementation: {
      frameDomains: [{id: "root", frameCount: 10, scenarioIds: ["default"]}],
    },
  }}).manifest;
  const root = buildPendingRootRequirement({item, language: "en", scenario: "root-unavailable"});
  const nested = buildPendingNestedRequirement({item, language: "en"});
  const coverage = {
    schemaVersion: 2,
    animationId: item.animationId,
    planningState: "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime",
    requirements: [legacy(root), legacy(buildPendingRootRequirement({item, language: "es", scenario: "root-unavailable"})), legacy(nested), legacy(buildPendingNestedRequirement({item, language: "es"}))],
    limitations: [
      "These two requirements replace invalid 1..0 placeholders with the source-bound root 1..frameCount range.",
      "They are pending natural-trace requirements, not proof that the trace, scenario inventory, nested-domain disposition, baseline, audio, review, or acceptance exists.",
      "The sprite-23 EN/ES requirements conservatively preserve the 128-frame main-teaching timeline obligation identified by hash-bound static SWF and work-only authoring evidence; runtime reachability and entry state remain unresolved until an authorized natural trace executes.",
      "The one-frame, scriptless sprite-3 page-title companion is source-proven as composite-child-with-parent for independent-playhead disposition only; its visual, behavior, interaction, full-frame, audio, human, and owner obligations remain pending.",
      "The root-unavailable and source-static-frame scenario IDs bind the current JavaScript diagnostic interface only. They do not establish original-runtime scenario names or reachability and must be superseded if authoritative execution proves a different scenario contract.",
      "No requirement in this planning document is original-runtime evidence or changes strict acceptance.",
    ],
  };
  const repaired = repairedCoverageDocument({item, manifest, coverage});
  assert.equal(repaired.requirements.length, 4);
  assert.equal(repaired.requirements[0].entryState.scenario, "root-unavailable");
  assert.equal(repaired.requirements[0].entryState.rootEntryFrame, 1);
  assert.equal(repaired.requirements[2].entryState.scenario, "source-static-frame");
  assert.equal(repaired.requirements[2].entryState.rootEntryFrame, 6);
  assert.equal(repaired.requirements.every(({status}) => status === "pending"), true);
});

test("refuses drift outside the legacy entry-state gap", () => {
  const item = {animationId: "course-g04-l03-fixture", sequence: 1, nativeRuntimeFacts: {rootFrameCount: 10}};
  const manifest = buildExpectedPendingCoverageDocuments({item, manifest: {
    animationId: item.animationId,
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default"}],
    implementation: {frameDomains: [{id: "root", frameCount: 10, scenarioIds: ["default"]}]},
  }}).manifest;
  const requirements = ["en", "es"].map((language) => legacy(buildPendingRootRequirement({item, language})));
  requirements[0].status = "complete";
  assert.throws(() => repairedCoverageDocument({item, manifest, coverage: {
    schemaVersion: 2,
    animationId: item.animationId,
    planningState: "valid-root-requirements-pending-authoritative-runtime",
    requirements,
    limitations: [
      "These two requirements replace invalid 1..0 placeholders with the source-bound root 1..frameCount range.",
      "They are pending natural-trace requirements, not proof that the trace, scenario inventory, nested-domain disposition, baseline, audio, review, or acceptance exists.",
      "Additional scenario and nested-domain requirements must be added only from authorized original-runtime evidence; strict promotion remains closed.",
    ],
  }}), /fields outside entryState drifted/);
});

test("CLI is check-only or write and rejects promotion flags", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
