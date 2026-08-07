import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  STRICT_GATE_IDS,
  buildPilotOwnerReviewPacket,
  generatePilotOwnerReviewPacket,
  parseArguments,
  renderPilotOwnerReviewMarkdown,
} from "./build-pilot-owner-review-packet.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fixtureProject({pilotCount = 16} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-owner-review-"));
  const reports = path.join(root, "reports");
  const docs = path.join(root, "docs");
  await Promise.all([mkdir(reports, {recursive: true}), mkdir(docs, {recursive: true})]);
  await writeFile(path.join(docs, "PILOT_ACCEPTANCE_RUNBOOK.md"), "# Human-owned acceptance runbook\n");
  const pilots = [];
  for (let index = 1; index <= pilotCount; index += 1) {
    const animationId = `pilot-${String(index).padStart(2, "0")}`;
    const workspace = `migrations/${animationId}`;
    const manifestPath = path.join(root, workspace, "migration.json");
    await mkdir(path.dirname(manifestPath), {recursive: true});
    const manifest = `${JSON.stringify({animationId, status: "preserved"}, null, 2)}\n`;
    await writeFile(manifestPath, manifest);
    pilots.push({
      animationId,
      workspace,
      migrationStatus: "preserved",
      manifestSha256: sha256(manifest),
      strictAccepted: false,
      passedGateCount: 0,
      failedGateCount: STRICT_GATE_IDS.length,
      gates: STRICT_GATE_IDS.map((id) => ({
        id,
        label: id.replaceAll("-", " "),
        status: "fail",
        evidence: [`${workspace}/migration.json`, `${workspace}/missing-evidence.json`],
        reasons: [`${id} remains unresolved`],
        observations: ["candidate evidence is not automatically authoritative"],
      })),
    });
  }
  const report = {
    schemaVersion: 1,
    generatedMarker: "sha256:strict-report-fixture",
    validator: {path: "validator.mjs", version: "test", sha256: "a".repeat(64)},
    source: {pilotCount},
    summary: {pilots: pilotCount, strictAccepted: 0, notStrictAccepted: pilotCount},
    pilots,
  };
  const input = path.join(reports, "pilot-strict-acceptance.json");
  await writeFile(input, `${JSON.stringify(report, null, 2)}\n`);
  return {
    root,
    input,
    jsonOutput: path.join(reports, "pilot-owner-review-packet.json"),
    markdownOutput: path.join(reports, "pilot-owner-review-packet.md"),
  };
}

test("argument parser exposes deterministic defaults and explicit check paths", () => {
  const projectRoot = "/tmp/help-math-review-parser";
  const defaults = parseArguments([], {projectRoot});
  assert.equal(defaults.input, path.join(projectRoot, "reports", "pilot-strict-acceptance.json"));
  assert.equal(defaults.check, false);
  const options = parseArguments([
    "--check",
    "--json",
    "--input", "strict.json",
    "--output-json", "packet.json",
    "--output-markdown", "packet.md",
  ], {projectRoot});
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.input, path.resolve("strict.json"));
  assert.throws(() => parseArguments(["--owner", "Codex"], {projectRoot}), /Unknown argument/);
});

test("packet binds all 16 pilots and 15 gates while leaving human and owner decisions blank", async (context) => {
  const fixture = await fixtureProject();
  context.after(() => rm(fixture.root, {recursive: true, force: true}));
  const packet = await buildPilotOwnerReviewPacket({
    projectRoot: fixture.root,
    input: fixture.input,
    markdownOutput: fixture.markdownOutput,
  });
  assert.equal(packet.schemaVersion, 2);
  assert.equal(packet.pilots.length, 16);
  assert.equal(packet.summary.manifestBindingsCurrent, 16);
  assert.equal(packet.summary.humanDecisionsRecordedByPacket, 0);
  assert.equal(packet.summary.ownerDecisionsRecordedByPacket, 0);
  assert.equal(packet.authorityBoundary.changesMigrationStatus, false);
  assert.equal(packet.authorityBoundary.signsHumanReview, false);
  assert.equal(packet.authorityBoundary.signsOwnerAcceptance, false);
  assert.equal(packet.reviewRunbook.kind, "file");
  assert.match(packet.reviewRunbook.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(packet.signingInstructions.ownerAcceptance.allowedDecisions, ["accepted", "rejected"]);
  assert.doesNotMatch(JSON.stringify(packet.signingInstructions), /not-required-with-explicit-reason/);
  for (const pilot of packet.pilots) {
    assert.equal(pilot.gates.length, 15);
    assert.equal(pilot.humanVisualReview.decision, null);
    assert.equal(pilot.humanVisualReview.reviewer, null);
    assert.equal(pilot.humanVisualReview.recordDescriptor, null);
    assert.equal(pilot.humanVisualReview.immutableRecordWritten, false);
    assert.equal(pilot.ownerAcceptance.decision, null);
    assert.equal(pilot.ownerAcceptance.reviewer, null);
    assert.equal(pilot.ownerAcceptance.recordDescriptor, null);
    assert.equal(pilot.ownerAcceptance.immutableRecordWritten, false);
    assert.deepEqual(pilot.reviewRecordContract.humanVisualReview.descriptorFields, ["path", "bytes", "sha256"]);
    assert.match(pilot.reviewRecordContract.humanVisualReview.immutableRecordRoot, /evidence\/reviews\/human$/);
    assert.match(pilot.reviewRecordContract.ownerAcceptance.immutableRecordRoot, /evidence\/reviews\/owner$/);
    assert.match(pilot.reviewRecordContract.appendOnlyRule, /Never overwrite/);
    assert.equal(pilot.authorityBoundary.candidateImplementationAccepted, false);
    const manifestEvidence = pilot.gates[0].evidence[0];
    assert.equal(manifestEvidence.kind, "file");
    assert.match(manifestEvidence.sha256, /^[a-f0-9]{64}$/);
    const missingEvidence = pilot.gates[0].evidence[1];
    assert.equal(missingEvidence.kind, "missing");
    assert.equal(missingEvidence.sha256, null);
    assert.match(missingEvidence.referenceSha256, /^[a-f0-9]{64}$/);
  }
  const markdown = renderPilotOwnerReviewMarkdown(packet);
  assert.match(markdown, /机器生成的审核工作表，不是签署记录/);
  assert.match(markdown, /Review runbook:/);
  assert.match(markdown, /PILOT_ACCEPTANCE_RUNBOOK\.md/);
  assert.match(markdown, /不得把生成器、Codex 或机器检查写成 human\/owner reviewer/);
  assert.match(markdown, /Do not record not-required for owner acceptance/);
  assert.match(markdown, /Required descriptor: `\{ path, bytes, sha256 \}`/);
  assert.match(markdown, /Immutable record root:/);
  assert.match(markdown, /migration\.json mirror:/);
  assert.match(markdown, /Gate-by-gate checklist/);
  assert.doesNotMatch(markdown, /☐ not-required/);
});

test("generation is repeatable, --check detects evidence drift, and migration files are never edited", async (context) => {
  const fixture = await fixtureProject();
  context.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.root, "migrations", "pilot-01", "migration.json");
  const before = await readFile(manifestPath, "utf8");
  const generated = await generatePilotOwnerReviewPacket({
    projectRoot: fixture.root,
    input: fixture.input,
    jsonOutput: fixture.jsonOutput,
    markdownOutput: fixture.markdownOutput,
  });
  assert.equal(generated.ok, true);
  const checked = await generatePilotOwnerReviewPacket({
    projectRoot: fixture.root,
    input: fixture.input,
    jsonOutput: fixture.jsonOutput,
    markdownOutput: fixture.markdownOutput,
    check: true,
  });
  assert.deepEqual({ok: checked.ok, json: checked.jsonCurrent, markdown: checked.markdownCurrent}, {ok: true, json: true, markdown: true});
  assert.equal(await readFile(manifestPath, "utf8"), before);

  await writeFile(manifestPath, `${JSON.stringify({animationId: "pilot-01", status: "validating"}, null, 2)}\n`);
  const stale = await generatePilotOwnerReviewPacket({
    projectRoot: fixture.root,
    input: fixture.input,
    jsonOutput: fixture.jsonOutput,
    markdownOutput: fixture.markdownOutput,
    check: true,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.jsonCurrent, false);
  assert.equal(stale.markdownCurrent, false);
  assert.equal(stale.packet.pilots[0].manifestBinding.current, false);
});

test("invalid pilot cardinality is rejected instead of producing an incomplete review packet", async (context) => {
  const fixture = await fixtureProject({pilotCount: 15});
  context.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(
    buildPilotOwnerReviewPacket({projectRoot: fixture.root, input: fixture.input, markdownOutput: fixture.markdownOutput}),
    /exactly 16 pilots/,
  );
});

test("missing review runbook fails closed instead of producing an unexecutable handoff", async (context) => {
  const fixture = await fixtureProject();
  context.after(() => rm(fixture.root, {recursive: true, force: true}));
  await rm(path.join(fixture.root, "docs", "PILOT_ACCEPTANCE_RUNBOOK.md"));
  await assert.rejects(
    buildPilotOwnerReviewPacket({projectRoot: fixture.root, input: fixture.input, markdownOutput: fixture.markdownOutput}),
    /review runbook must exist as a hashable file/,
  );
});
