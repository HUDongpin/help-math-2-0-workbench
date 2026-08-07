import assert from "node:assert/strict";
import {appendFile, chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G4_L3_CUSTOM_READINESS_IDS,
  G4_L3_MEMBER_READINESS_IDS,
  buildG4L3MemberScenarioReadiness,
  buildOneG4L3MemberScenarioReadiness,
  validateG4L3MemberScenarioReadiness,
} from "./build-g4-l3-member-scenario-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const FIXTURE_ID = "course-g04-l03-in-002";

async function copyRelative(sourceRoot, targetRoot, relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(targetRoot, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(source, target);
}

async function makeFixtureProject() {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-member-readiness-"));
  const workspaceRelative = `migrations/${FIXTURE_ID}`;
  const manifestRelative = `${workspaceRelative}/migration.json`;
  const machineRelative = `${workspaceRelative}/audit/machine/report.json`;
  const sourceAuditRelative = `${workspaceRelative}/audit/machine/g4-l3-source-audit.json`;
  const planRelative = `${workspaceRelative}/audit/machine/g4-l3-runtime-acquisition-plan.json`;
  for (const relativePath of [manifestRelative, machineRelative, sourceAuditRelative, planRelative]) {
    await copyRelative(projectRoot, fixtureRoot, relativePath);
  }
  const manifest = JSON.parse(await readFile(path.join(projectRoot, manifestRelative), "utf8"));
  const machine = JSON.parse(await readFile(path.join(projectRoot, machineRelative), "utf8"));
  await copyRelative(projectRoot, fixtureRoot, manifest.source.swf);
  await chmod(path.join(fixtureRoot, manifest.source.swf), 0o600);
  for (const output of machine.outputs) await copyRelative(projectRoot, fixtureRoot, `${workspaceRelative}/${output.path}`);
  return {
    fixtureRoot,
    manifest,
    planRelative,
    sourcePath: path.join(fixtureRoot, manifest.source.swf),
  };
}

test("G4 L3 member readiness owns exactly 37 records and protects three custom records", async () => {
  assert.equal(G4_L3_MEMBER_READINESS_IDS.length, 37);
  assert.equal(new Set(G4_L3_MEMBER_READINESS_IDS).size, 37);
  assert.deepEqual(G4_L3_CUSTOM_READINESS_IDS, [
    "course-g04-l03-in-009",
    "course-g04-l03-ts-006",
    "shell-course-g04-l03-index-local",
  ]);
  assert.ok(G4_L3_CUSTOM_READINESS_IDS.every((id) => !G4_L3_MEMBER_READINESS_IDS.includes(id)));
  await assert.rejects(
    buildG4L3MemberScenarioReadiness({ids: ["course-g04-l03-ts-006"]}),
    /custom readiness is protected/,
  );
});

test("checked-in G4 L3 member readiness records are deterministic and fail closed", async () => {
  const results = await buildG4L3MemberScenarioReadiness({check: true});
  assert.equal(results.length, 37);
  assert.ok(results.every((item) => item.action === "verified"));
  assert.ok(results.every((item) => item.document.acceptance.strictMigrationComplete === false));
  assert.ok(results.every((item) => item.document.branchCaptureReadiness.runtimeSessionsExecuted === 0));
  assert.ok(results.every((item) => item.document.review.ownerReview.decision === "pending"));
});

test("G4 L3 member readiness validator rejects authority promotion and narrowed identity", async () => {
  const {document} = await buildOneG4L3MemberScenarioReadiness(FIXTURE_ID, {check: true});

  const promoted = structuredClone(document);
  promoted.acceptance.ownerAccepted = true;
  assert.throws(() => validateG4L3MemberScenarioReadiness(promoted), /ownerAccepted must remain false/);

  const signed = structuredClone(document);
  signed.review.ownerReview.reviewer = "invented reviewer";
  assert.throws(() => validateG4L3MemberScenarioReadiness(signed), /may not contain a fabricated review or signature/);

  const narrowed = structuredClone(document);
  narrowed.branchCaptureReadiness.requiredScenarioInventory = ["root only"];
  assert.throws(() => validateG4L3MemberScenarioReadiness(narrowed), /scenario inventory is too narrow/);

  const identityDrift = structuredClone(document);
  identityDrift.branchCaptureReadiness.captureIdentity.requiredFields.pop();
  assert.throws(() => validateG4L3MemberScenarioReadiness(identityDrift), /capture identity field count is invalid/);
});

test("G4 L3 member readiness re-verifies identity, acquisition authority, and physical source bytes", async () => {
  const fixture = await makeFixtureProject();
  try {
    const written = await buildG4L3MemberScenarioReadiness({projectRoot: fixture.fixtureRoot, ids: [FIXTURE_ID]});
    assert.equal(written[0].action, "written");
    const checked = await buildG4L3MemberScenarioReadiness({projectRoot: fixture.fixtureRoot, ids: [FIXTURE_ID], check: true});
    assert.equal(checked[0].action, "verified");

    await appendFile(fixture.sourcePath, Buffer.from([0]));
    await assert.rejects(
      buildOneG4L3MemberScenarioReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /byte count mismatch|hash mismatch/,
    );
    await copyFile(path.join(projectRoot, fixture.manifest.source.swf), fixture.sourcePath);

    const planPath = path.join(fixture.fixtureRoot, fixture.planRelative);
    const originalPlanText = await readFile(planPath, "utf8");
    const promotedPlan = JSON.parse(originalPlanText);
    promotedPlan.currentEvidenceState.ownerAccepted = true;
    await writeFile(planPath, `${JSON.stringify(promotedPlan, null, 2)}\n`, "utf8");
    await assert.rejects(
      buildOneG4L3MemberScenarioReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /promoted ownerAccepted/,
    );

    const identityDrift = JSON.parse(originalPlanText);
    identityDrift.identity.animationId = "wrong-id";
    await writeFile(planPath, `${JSON.stringify(identityDrift, null, 2)}\n`, "utf8");
    await assert.rejects(
      buildOneG4L3MemberScenarioReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /runtime acquisition plan identity mismatch/,
    );
  } finally {
    await rm(fixture.fixtureRoot, {recursive: true, force: true});
  }
});
