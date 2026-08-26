import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {cp, mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  normalizeAuthorizedTiHostBindingPin,
  parseArguments,
  redactedSemanticSha256,
  refreshCourseCandidateSpecBindings,
  SPEC_ALLOWLIST,
} from "./refresh-course-candidate-spec-bindings.mjs";
import {PRODUCTION_CONTRACT as TI_HOST_BINDING_CONTRACT} from "./refresh-ti-host-binding-authoring-audit-pin.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = "course-g03-l01-ts-008";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "candidate-spec-bindings-"));
  const workspace = path.join(root, "migrations", id);
  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf";
  const copies = [
    [`migrations/${id}/audit/canvas-adapter-spec.json`, `migrations/${id}/audit/canvas-adapter-spec.json`],
    [`migrations/${id}/audit/scenario-inventory.json`, `migrations/${id}/audit/scenario-inventory.json`],
    [`migrations/${id}/audit/strict-readiness.json`, `migrations/${id}/audit/strict-readiness.json`],
    [`migrations/${id}/audit/audio-runtime-evidence.json`, `migrations/${id}/audit/audio-runtime-evidence.json`],
    [`migrations/${id}/migration.json`, `migrations/${id}/migration.json`],
    [sourceRelative, sourceRelative],
    ["scripts/build-safe-ffdec-canvas-adapter.mjs", "scripts/build-safe-ffdec-canvas-adapter.mjs"],
  ];
  for (const [source, destination] of copies) {
    const target = path.join(root, destination);
    await mkdir(path.dirname(target), {recursive: true});
    await cp(path.join(projectRoot, source), target);
  }
  const specPath = path.join(workspace, "audit", "canvas-adapter-spec.json");
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const readinessPath = path.join(workspace, "audit", "strict-readiness.json");
  const readiness = JSON.parse(await readFile(readinessPath, "utf8"));
  const audioText = await readFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), "utf8");
  readiness.audioAudit.report.sha256 = createHash("sha256").update(audioText).digest("hex");
  const readinessText = `${JSON.stringify(readiness, null, 2)}\n`;
  await writeFile(readinessPath, readinessText);
  const manifestPin = inventory.evidenceIndex.find(({artifactId}) => artifactId === "migration-technical-contract");
  manifestPin.sha256 = technicalManifestSha256(manifest);
  const readinessPin = inventory.evidenceIndex.find(({artifactId}) => artifactId === "strict-readiness");
  readinessPin.sha256 = createHash("sha256").update(readinessText).digest("hex");
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  spec.evidence.scenarioInventorySha256 = "a".repeat(64);
  spec.evidence.audioAuditSha256 = "b".repeat(64);
  await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`);
  return {root, workspace, specPath};
}

test("refreshes only the allowlisted scenario-inventory and structural-audio bindings", async () => {
  const current = await fixture();
  const before = JSON.parse(await readFile(current.specPath, "utf8"));
  const report = await refreshCourseCandidateSpecBindings({root: current.root, ids: [id]});
  assert.equal(report.status, "pass");
  assert.equal(report.results[0].status, "updated");
  const after = JSON.parse(await readFile(current.specPath, "utf8"));
  const expected = structuredClone(before);
  expected.evidence.scenarioInventory = after.evidence.scenarioInventory;
  expected.evidence.scenarioInventorySha256 = after.evidence.scenarioInventorySha256;
  expected.evidence.audioAudit = after.evidence.audioAudit;
  expected.evidence.audioAuditSha256 = after.evidence.audioAuditSha256;
  assert.deepEqual(after, expected);
  assert.notEqual(after.evidence.scenarioInventorySha256, before.evidence.scenarioInventorySha256);
  assert.notEqual(after.evidence.audioAuditSha256, before.evidence.audioAuditSha256);
  const check = await refreshCourseCandidateSpecBindings({root: current.root, ids: [id], check: true});
  assert.equal(check.status, "pass");
  assert.equal(check.results[0].status, "current");
});

test("blocks rather than refreshing changed runtime semantics", async () => {
  const current = await fixture();
  const spec = JSON.parse(await readFile(current.specPath, "utf8"));
  spec.timeline.local.frameCount += 1;
  await writeFile(current.specPath, `${JSON.stringify(spec, null, 2)}\n`);
  const report = await refreshCourseCandidateSpecBindings({root: current.root, ids: [id]});
  assert.equal(report.status, "blocked");
  assert.match(report.results[0].reason, /non-binding spec semantics changed/);
  assert.deepEqual(JSON.parse(await readFile(current.specPath, "utf8")), spec);
});

test("GS002 preserves only the exact acceptance-neutral scenario-inventory revalidation receipt", async () => {
  const animationId = "course-g04-l09-gs-002";
  const item = SPEC_ALLOWLIST.find((candidate) => candidate.animationId === animationId);
  assert(item, `${animationId}: allowlist entry missing`);
  const spec = JSON.parse(
    await readFile(path.join(projectRoot, "migrations", animationId, item.artifact), "utf8"),
  );
  const before = structuredClone(spec);
  assert.equal(redactedSemanticSha256(spec, item.kind), item.semanticSha256);
  assert.deepEqual(spec, before, "semantic projection must not edit the live receipt");

  const driftCases = [
    ["missing receipt", (candidate) => {
      delete candidate.evidence.scenarioInventoryRevalidation;
    }],
    ["changed status", (candidate) => {
      candidate.evidence.scenarioInventoryRevalidation.status = "accepted";
    }],
    ["changed checked fact", (candidate) => {
      candidate.evidence.scenarioInventoryRevalidation.checkedFacts[0] = "changed";
    }],
    ["extra authority", (candidate) => {
      candidate.evidence.scenarioInventoryRevalidation.ownerAcceptance = true;
    }],
    ["strict effect drift", (candidate) => {
      candidate.evidence.scenarioInventoryRevalidation.strictAcceptanceEffect = "complete";
    }],
  ];
  for (const [label, mutate] of driftCases) {
    const candidate = structuredClone(spec);
    mutate(candidate);
    assert.throws(
      () => redactedSemanticSha256(candidate, item.kind),
      /exact acceptance-neutral allowlist/,
      label,
    );
  }
});

test("pins the reviewed semantics of the generated VB004 and IN009 candidate specs", async () => {
  for (const animationId of ["course-g03-l01-vb-004", "course-g04-l03-in-009"]) {
    const item = SPEC_ALLOWLIST.find((candidate) => candidate.animationId === animationId);
    assert(item, `${animationId}: allowlist entry missing`);
    const spec = JSON.parse(await readFile(path.join(projectRoot, "migrations", animationId, item.artifact), "utf8"));
    assert.equal(redactedSemanticSha256(spec, item.kind), item.semanticSha256, `${animationId}: reviewed semantic pin`);
  }
});

test("rejects IDs outside the explicit allowlist", async () => {
  await assert.rejects(() => refreshCourseCandidateSpecBindings({ids: ["course-not-allowlisted"], check: true}), /Unknown or non-allowlisted/);
});

test("normalizes only the exact authorized TI host-binding prior/current pair", () => {
  const currentResolutionSha256 = "c".repeat(64);
  const specimen = {
    evidencePins: [{
      id: "host-binding-resolution",
      path: TI_HOST_BINDING_CONTRACT.resolutionPath,
      sha256: currentResolutionSha256,
    }],
  };
  const normalized = normalizeAuthorizedTiHostBindingPin(specimen, {
    currentResolutionSha256,
  });
  assert.equal(
    normalized.evidencePins[0].sha256,
    TI_HOST_BINDING_CONTRACT.expectedPriorResolutionSha256,
  );
  assert.equal(specimen.evidencePins[0].sha256, currentResolutionSha256);
  assert.throws(
    () => normalizeAuthorizedTiHostBindingPin({
      evidencePins: [{...specimen.evidencePins[0], sha256: "d".repeat(64)}],
    }, {currentResolutionSha256}),
    /neither the authorized prior nor current/,
  );
  assert.throws(
    () => normalizeAuthorizedTiHostBindingPin({
      evidencePins: [{...specimen.evidencePins[0], path: "migrations/other.json"}],
    }, {currentResolutionSha256}),
    /path changed/,
  );
});

test("checks the exact machine-amended TI host-binding cascade without rewriting it", async () => {
  const report = await refreshCourseCandidateSpecBindings({
    root: projectRoot,
    ids: ["course-g03-l06-ti-001"],
    check: true,
  });
  assert.equal(report.status, "pass");
  const controller = report.results.find(({artifact}) =>
    artifact === "audit/adobe-frame-controller-spec.json");
  assert(controller);
  assert.equal(controller.status, "current");
  assert.match(controller.currentHostBindingSha256, /^[a-f0-9]{64}$/);
  assert.equal(controller.previousHostBindingPin, controller.currentHostBindingSha256);
});

test("refreshes only the TI invalidation sidecar when explicitly isolated", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "candidate-spec-invalidation-only-"));
  const animationId = "course-g03-l06-ti-001";
  const audit = path.join(root, "migrations", animationId, "audit");
  await mkdir(audit, {recursive: true});
  const inventoryPath = path.join(audit, "scenario-inventory.json");
  const prereviewPath = path.join(audit, "canvas-adapter-engineering-prereview.json");
  const sidecarPath = path.join(audit, "canvas-adapter-engineering-prereview.invalidated-stale-scenario-inventory.json");
  const inventoryText = `${JSON.stringify({animationId, current: true}, null, 2)}\n`;
  const prereviewText = `${JSON.stringify({
    animationId,
    sourceEvidence: {
      scenarioInventory: {
        path: `migrations/${animationId}/audit/scenario-inventory.json`,
        sha256: "a".repeat(64),
      },
    },
    reviewedConclusion: "preserve this exact prereview byte-for-byte",
  }, null, 2)}\n`;
  await writeFile(inventoryPath, inventoryText);
  await writeFile(prereviewPath, prereviewText);

  const report = await refreshCourseCandidateSpecBindings({root, ids: [animationId], invalidationOnly: true});
  assert.equal(report.status, "pass");
  assert.equal(report.invalidationOnly, true);
  assert.deepEqual(report.results, []);
  assert.equal(report.invalidation.status, "written");
  assert.equal(await readFile(prereviewPath, "utf8"), prereviewText);
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  assert.equal(sidecar.invalidates.sha256, createHash("sha256").update(prereviewText).digest("hex"));
  assert.equal(sidecar.trigger.dependency.sha256, createHash("sha256").update(inventoryText).digest("hex"));
  assert.equal(sidecar.acceptanceChanged, false);

  const checked = await refreshCourseCandidateSpecBindings({root, ids: [animationId], invalidationOnly: true, check: true});
  assert.equal(checked.status, "pass");
  assert.equal(checked.invalidation.status, "current");
  await assert.rejects(
    () => refreshCourseCandidateSpecBindings({root, ids: [id], invalidationOnly: true}),
    /--invalidation-only is restricted/,
  );
});

test("parses repeatable IDs and check mode", () => {
  assert.deepEqual(parseArguments(["--id", "a", "--id", "b", "--check", "--json", "--invalidation-only"]), {check: true, ids: ["a", "b"], json: true, invalidationOnly: true});
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
});
