import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAntecedentBoundSpec,
  G5_L4_SOURCE_STATIC_ANTECEDENT_IDS,
  parseArguments,
} from "./materialize-g5-l4-source-static-prebinding-antecedents.mjs";

test("antecedent CLI is bounded, read-only by default, and explicit to write", () => {
  assert.deepEqual(parseArguments([]), {
    mode: "dry-run",
    ids: [...G5_L4_SOURCE_STATIC_ANTECEDENT_IDS],
  });
  assert.deepEqual(parseArguments([
    "--apply",
    "--id", "course-g05-l04-vb-002",
  ]), {
    mode: "apply",
    ids: ["course-g05-l04-vb-002"],
  });
  assert.throws(
    () => parseArguments(["--id", "course-g05-l04-vb-999"]),
    /unsupported animation ID/,
  );
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /cannot be combined/,
  );
});

test("antecedent allowlist contains the exact fifty-one source-static candidates", () => {
  assert.deepEqual([...G5_L4_SOURCE_STATIC_ANTECEDENT_IDS], [
    "course-g05-l04-vb-002",
    "course-g05-l04-vb-005",
    "course-g05-l04-vb-006",
    "course-g05-l04-in-009",
    "course-g05-l04-in-015",
    "course-g05-l04-ts-006",
    "course-g05-l04-ts-002",
    "course-g05-l04-ts-005",
    "course-g05-l04-vb-008",
    "course-g05-l04-vb-009",
    "course-g05-l04-in-020",
    "course-g05-l04-in-012",
    "course-g05-l04-ts-003",
    "course-g05-l04-ts-004",
    "course-g05-l04-rw-003",
    "course-g05-l04-rw-004",
    "course-g05-l04-in-002",
    "course-g05-l04-in-007",
    "course-g05-l04-rw-002",
    "course-g05-l04-in-004",
    "course-g05-l04-in-018",
    "course-g05-l04-in-017",
    "course-g05-l04-in-016",
    "course-g05-l04-in-014",
    "course-g05-l04-in-013",
    "course-g05-l04-in-010",
    "course-g05-l04-in-005",
    "course-g05-l04-in-003",
    "course-g05-l04-vb-007",
    "course-g05-l04-vb-010",
    "course-g05-l04-vb-011",
    "course-g05-l04-ts-008",
    "course-g05-l04-ts-007",
    "course-g05-l04-vb-003",
    "course-g05-l04-vb-004",
    "course-g05-l04-in-006",
    "course-g05-l04-in-008",
    "course-g05-l04-in-011",
    "course-g05-l04-in-019",
    "course-g05-l04-in-021",
    "course-g05-l04-in-022",
    "course-g05-l04-ti-002",
    "course-g05-l04-ti-003",
    "course-g05-l04-ti-004",
    "course-g05-l04-ti-005",
    "course-g05-l04-ti-006",
    "course-g05-l04-ti-007",
    "course-g05-l04-ti-008",
    "course-g05-l04-ti-009",
    "course-g05-l04-gs-002",
    "course-g05-l04-ir-001-a662633d",
  ]);
});

test("antecedent binding removes live pins and records no canonical assertion", () => {
  const animationId = "course-g05-l04-vb-002";
  const original = {
    animationId,
    evidence: {
      scenarioInventory:
        `migrations/${animationId}/audit/scenario-inventory.json`,
      scenarioInventorySha256: "1".repeat(64),
      audioAudit: `migrations/${animationId}/audit/audio-runtime-evidence.json`,
      audioAuditSha256: "2".repeat(64),
      frameDomainDisposition:
        `migrations/${animationId}/audit/frame-domain-disposition.json`,
      frameDomainDispositionSha256: "3".repeat(64),
    },
    runtimeContract: {
      kind: "structural-local-frame",
    },
  };
  const updated = buildAntecedentBoundSpec(original, {
    scenarioPath:
      `migrations/${animationId}/evidence/source-static-prebinding-antecedents/scenario-inventory.json`,
    scenarioSha256: "4".repeat(64),
    dispositionPath:
      `migrations/${animationId}/evidence/source-static-prebinding-antecedents/frame-domain-disposition.json`,
    dispositionSha256: "5".repeat(64),
  });
  assert.equal(updated.evidence.scenarioInventory, undefined);
  assert.equal(updated.evidence.frameDomainDisposition, undefined);
  assert.equal(
    updated.evidence.prebindingScenarioInventorySha256,
    "4".repeat(64),
  );
  assert.equal(
    updated.evidence.prebindingFrameDomainDispositionSha256,
    "5".repeat(64),
  );
  assert.equal(
    updated.runtimeContract.prebindingTargetFrameDomainDisposition,
    "unresolved",
  );
  assert.equal(
    updated.runtimeContract.currentCanonicalFrameDomainDispositionAsserted,
    false,
  );
  assert.equal(updated.evidence.audioAuditSha256, "2".repeat(64));
});

test("antecedent binding preserves explicit SWF-only null FLA evidence", () => {
  const animationId = "course-g05-l04-rw-003";
  const original = {
    animationId,
    source: {
      swf: "source-assets/flash/L4RW03.swf",
      pairedFlaStatus: "missing",
      fla: null,
      flaBytes: null,
      flaSha256: null,
    },
    evidence: {},
    runtimeContract: {},
  };
  const updated = buildAntecedentBoundSpec(original, {
    scenarioPath:
      `migrations/${animationId}/evidence/source-static-prebinding-antecedents/scenario-inventory.json`,
    scenarioSha256: "4".repeat(64),
    dispositionPath:
      `migrations/${animationId}/evidence/source-static-prebinding-antecedents/frame-domain-disposition.json`,
    dispositionSha256: "5".repeat(64),
  });
  assert.deepEqual(updated.source, original.source);
});
