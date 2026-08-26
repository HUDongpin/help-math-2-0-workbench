import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  VB004_SEMANTIC_REVIEW_CONTRACT,
  buildVb004SemanticReviewPacket,
  generateVb004SemanticReviewPacket,
  parseArguments,
  renderVb004SemanticReviewMarkdown,
} from "./build-vb004-semantic-review-packet.mjs";
import {redactedSemanticSha256} from "./refresh-course-candidate-spec-bindings.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(projectRoot, "scripts", "build-vb004-semantic-review-packet.mjs");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function cloneContract() {
  return structuredClone(VB004_SEMANTIC_REVIEW_CONTRACT);
}

async function sha256File(filePath) {
  return sha256(await readFile(filePath));
}

function contractPaths(contract) {
  return [
    contract.adapterSpecPath,
    contract.reviewPinAuthorityPath,
    contract.consumerPath,
    contract.archivedAuthoringAuditPath,
    contract.archivedAuthoringFramePath,
    contract.authoringArchiveManifestPath,
    contract.currentAuthoringAuditPath,
    contract.currentAuthoringFramePath,
    contract.currentScenarioInventoryPath,
    contract.currentAudioAuditPath,
    contract.sourceFlaPath,
    contract.sourceSwfPath,
  ];
}

async function copyContractProject() {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-vb004-semantic-review-"));
  for (const relativePath of contractPaths(VB004_SEMANTIC_REVIEW_CONTRACT)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), {recursive: true});
    await copyFile(path.join(projectRoot, relativePath), target);
  }
  return root;
}

test("production packet reconstructs the old reviewed projection and isolates one current semantic delta", async () => {
  const packet = await buildVb004SemanticReviewPacket({projectRoot, generatorPath});
  const relocatedPacket = await buildVb004SemanticReviewPacket({
    projectRoot,
    generatorPath,
    markdownOutput: path.join(os.tmpdir(), "relocated-vb004-review.md"),
  });
  assert.equal(packet.animationId, "course-g03-l01-vb-004");
  assert.equal(packet.reviewPin.priorReviewedSemanticSha256, "04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db");
  assert.equal(packet.reviewPin.reconstructedPriorSemanticSha256, packet.reviewPin.priorReviewedSemanticSha256);
  assert.equal(packet.reviewPin.currentProposedSemanticSha256, "ef1a3ae5552e408682ea6387d01ad070ef6a6f3da857f21515e6607d38ae98fa");
  assert.deepEqual(packet.reviewPin.semanticDiff, [{
    path: "evidence.authoringAuditSha256",
    previous: "6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31",
    current: "38cbdd18a6d3f1fa2b75843fd6eb640ae59d6c36b670a100f7fb8bc018135e83",
  }]);
  assert.equal(packet.authoringEvidence.stableFactsMatch, true);
  assert.equal(packet.authoringEvidence.capturedFrameBytesMatch, true);
  assert.equal(packet.authoringEvidence.currentSchemaV2.facts.localTimeline.name, "Animation03");
  assert.equal(packet.authoringEvidence.currentSchemaV2.facts.localTimeline.frameCount, 222);
  assert.equal(packet.scenarioEvidence.adapterRecordedBindingSha256, "b6ebdc8a410ce4080c2d60009ea04607e1be1750850469ac4e060c4b936abeec");
  assert.equal(packet.scenarioEvidence.currentBindingSha256, "ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c");
  assert.equal(packet.scenarioEvidence.bindingStatus, "stale");
  assert.equal(packet.scenarioEvidence.archivedRecordedScenarioBytesIncluded, false);
  assert.equal(packet.approvalRequest.status, "pending-explicit-named-human-semantic-decision");
  assert.equal(packet.approvalRequest.decisionRecordedByPacket, false);
  assert.equal(packet.approvalRequest.reviewer, null);
  assert.equal(packet.authorityBoundary.changesAllowlist, false);
  assert.equal(packet.authorityBoundary.changesAdapterSpec, false);
  assert.equal(packet.authorityBoundary.changesMigrationStatus, false);
  assert.equal(packet.authorityBoundary.claimsFlashFidelity, false);
  assert.match(packet.approvalRequest.exactApprovalStatement, new RegExp(packet.reviewScopeSha256));
  assert.match(packet.approvalRequest.exactApprovalStatement, /不批准 Flash 忠实度/);
  assert.match(packet.approvalRequest.exactApprovalStatement, /owner acceptance/);
  assert.match(packet.generatedMarker, /^sha256:[a-f0-9]{64}$/);
  assert.equal(relocatedPacket.reviewScopeSha256, packet.reviewScopeSha256);
  assert.equal(relocatedPacket.approvalRequest.exactApprovalStatement, packet.approvalRequest.exactApprovalStatement);

  const markdown = renderVb004SemanticReviewMarkdown(packet);
  assert.match(markdown, /待人工决定的工程审核包，不是批准记录/);
  assert.match(markdown, /Scenario inventory binding/);
  assert.match(markdown, /STALE/);
  assert.match(markdown, /请由具名人员作出明确决定/);
  assert.match(markdown, /不要更新 reviewed semantic pin/);
});

test("generation is deterministic, --check detects output drift, and protected inputs remain byte-identical", async (context) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-vb004-semantic-output-"));
  context.after(() => rm(outputRoot, {recursive: true, force: true}));
  const jsonOutput = path.join(outputRoot, "packet.json");
  const markdownOutput = path.join(outputRoot, "packet.md");
  const protectedPaths = [
    VB004_SEMANTIC_REVIEW_CONTRACT.adapterSpecPath,
    VB004_SEMANTIC_REVIEW_CONTRACT.reviewPinAuthorityPath,
    "migrations/course-g03-l01-vb-004/migration.json",
  ].map((relativePath) => path.join(projectRoot, relativePath));
  const before = await Promise.all(protectedPaths.map(sha256File));

  const first = await generateVb004SemanticReviewPacket({projectRoot, jsonOutput, markdownOutput, generatorPath});
  assert.equal(first.ok, true);
  const firstJson = await readFile(jsonOutput, "utf8");
  const firstMarkdown = await readFile(markdownOutput, "utf8");
  const checked = await generateVb004SemanticReviewPacket({projectRoot, jsonOutput, markdownOutput, generatorPath, check: true});
  assert.deepEqual(
    {ok: checked.ok, jsonCurrent: checked.jsonCurrent, markdownCurrent: checked.markdownCurrent},
    {ok: true, jsonCurrent: true, markdownCurrent: true},
  );
  assert.equal(await readFile(jsonOutput, "utf8"), firstJson);
  assert.equal(await readFile(markdownOutput, "utf8"), firstMarkdown);
  assert.deepEqual(await Promise.all(protectedPaths.map(sha256File)), before);

  await writeFile(markdownOutput, `${firstMarkdown}\nmanual drift\n`);
  const stale = await generateVb004SemanticReviewPacket({projectRoot, jsonOutput, markdownOutput, generatorPath, check: true});
  assert.equal(stale.ok, false);
  assert.equal(stale.jsonCurrent, true);
  assert.equal(stale.markdownCurrent, false);
  assert.deepEqual(await Promise.all(protectedPaths.map(sha256File)), before);
});

test("fails closed when a current bound artifact hash differs", async () => {
  const contract = cloneContract();
  contract.expected.currentScenarioInventorySha256 = "a".repeat(64);
  await assert.rejects(
    buildVb004SemanticReviewPacket({projectRoot, generatorPath, contract}),
    /current scenario inventory: SHA-256 mismatch/,
  );
});

test("fails closed after internally rehashing a non-authoring semantic change", async (context) => {
  const root = await copyContractProject();
  context.after(() => rm(root, {recursive: true, force: true}));
  const contract = cloneContract();
  const specPath = path.join(root, contract.adapterSpecPath);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  spec.runtimeContract.seedStatus = "tampered-but-internally-rehashed";
  const text = `${JSON.stringify(spec, null, 2)}\n`;
  await writeFile(specPath, text);
  contract.expected.adapterSpecSha256 = sha256(text);
  contract.expected.currentSemanticSha256 = redactedSemanticSha256(spec, contract.adapterKind);

  await assert.rejects(
    buildVb004SemanticReviewPacket({projectRoot: root, generatorPath, contract}),
    /does not reconstruct the prior reviewed semantic hash/,
  );
});

test("argument parser exposes only output/check controls and rejects any approval option", () => {
  const projectRootFixture = "/tmp/help-math-vb004-review-parser";
  const defaults = parseArguments([], {projectRoot: projectRootFixture});
  assert.equal(defaults.check, false);
  assert.equal(defaults.jsonOutput, path.join(projectRootFixture, "reports", "vb004-semantic-review-packet.json"));
  const explicit = parseArguments([
    "--check",
    "--json",
    "--output-json", "packet.json",
    "--output-markdown", "packet.md",
  ], {projectRoot: projectRootFixture});
  assert.equal(explicit.check, true);
  assert.equal(explicit.json, true);
  assert.equal(explicit.jsonOutput, path.resolve("packet.json"));
  assert.equal(explicit.markdownOutput, path.resolve("packet.md"));
  assert.throws(() => parseArguments(["--approve"], {projectRoot: projectRootFixture}), /Unknown argument/);
  assert.throws(() => parseArguments(["--reviewer", "Codex"], {projectRoot: projectRootFixture}), /Unknown argument/);
});
