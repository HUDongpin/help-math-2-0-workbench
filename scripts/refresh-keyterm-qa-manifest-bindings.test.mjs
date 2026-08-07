import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  KEYTERM_QA_PILOT_IDS,
  commitKeytermQaManifestBindingPlans,
  planKeytermQaManifestBinding,
  refreshKeytermQaManifestBindings,
} from "./refresh-keyterm-qa-manifest-bindings.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function falseBoundary() {
  return {
    authoritativeAudioListening: false,
    originalRuntimeBaselineApproval: false,
    humanVisualReview: false,
    ownerAcceptance: false,
    strictMigrationCompletion: false,
  };
}

async function createPilot(root, animationId, marker) {
  const workspace = path.join(root, "migrations", animationId);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  await mkdir(path.join(root, "scripts"), {recursive: true});
  const producerPath = path.join(root, "scripts", "qa-keyterm-pilots.mjs");
  try {
    await readFile(producerPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(producerPath, "// fixture key-term QA producer\n");
  }
  const producerBytes = await readFile(producerPath);
  const engineering = {
    schemaVersion: 2,
    evidenceKind: "keyterm-engineering-candidate-product-qa",
    animationId,
    generatedBy: {
      script: "scripts/qa-keyterm-pilots.mjs",
      scriptSha256: sha256(producerBytes),
    },
    status: "pass",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    authorityBoundary: falseBoundary(),
    marker,
  };
  const engineeringBytes = jsonBytes(engineering);
  const engineeringHash = sha256(engineeringBytes);
  const derived = (kind) => ({
    schemaVersion: 1,
    animationId,
    status: "pass",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    checks: [{
      id: `${kind}-fixture`,
      result: "pass",
      evidence: [{
        path: "evidence/keyterm-engineering-qa.json",
        sha256: engineeringHash,
      }],
    }],
    authorityBoundary: falseBoundary(),
    marker,
  });
  const behaviorBytes = jsonBytes(derived("behavior"));
  const productBytes = jsonBytes(derived("product"));
  const artifacts = {
    engineeringQa: engineeringBytes,
    behaviorQa: behaviorBytes,
    productQa: productBytes,
  };
  await writeFile(path.join(workspace, "evidence", "keyterm-engineering-qa.json"), engineeringBytes);
  await writeFile(path.join(workspace, "evidence", "behavior-qa.json"), behaviorBytes);
  await writeFile(path.join(workspace, "evidence", "product-qa.json"), productBytes);

  const manifest = {
    schemaVersion: 2,
    id: animationId,
    animationId,
    status: marker === "a" ? "blocked" : "validating",
    source: {swf: {path: `source/${animationId}.swf`, sha256: marker.repeat(64)}},
    runtime: {frameCount: marker === "a" ? 60 : 35},
    localization: {languages: ["en", "es"]},
    acceptance: {
      currentJavaScriptOutputApproval: {
        decision: "accepted",
        artifactBindingSha256: marker === "a" ? "1".repeat(64) : "2".repeat(64),
      },
      humanVisualReview: {decision: "pending"},
      ownerReview: {decision: "pending"},
    },
    reviews: {engineering: "preserve-me"},
    evidence: {
      engineeringQaFile: "evidence/keyterm-engineering-qa.json",
      behaviorQaFile: "evidence/behavior-qa.json",
      productQaFile: "evidence/product-qa.json",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      evidenceHashes: {
        engineeringQa: "3".repeat(64),
        behaviorQa: "4".repeat(64),
        productQa: "5".repeat(64),
        fullFrameCoverage: "6".repeat(64),
      },
      candidateCaptureManifests: [{sha256: "7".repeat(64)}],
    },
  };
  const manifestPath = path.join(workspace, "migration.json");
  const manifestBytes = jsonBytes(manifest);
  await writeFile(manifestPath, manifestBytes);
  return {animationId, workspace, manifestPath, manifest, manifestBytes, artifacts};
}

async function createFixture(t, ids = KEYTERM_QA_PILOT_IDS) {
  const root = await mkdtemp(path.join(os.tmpdir(), "keyterm-qa-bindings-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const pilots = [];
  for (let index = 0; index < ids.length; index += 1) {
    pilots.push(await createPilot(root, ids[index], index === 0 ? "a" : "b"));
  }
  return {root, pilots};
}

function withoutQaHashes(manifest) {
  const copy = structuredClone(manifest);
  delete copy.evidence.evidenceHashes.engineeringQa;
  delete copy.evidence.evidenceHashes.behaviorQa;
  delete copy.evidence.evidenceHashes.productQa;
  return copy;
}

test("plan binds exactly the three QA byte hashes and leaves every unrelated manifest value unchanged", async (t) => {
  const fixture = await createFixture(t, [KEYTERM_QA_PILOT_IDS[0]]);
  const pilot = fixture.pilots[0];
  const plan = await planKeytermQaManifestBinding({
    projectRoot: fixture.root,
    animationId: pilot.animationId,
  });
  assert.deepEqual(plan.changedPaths.sort(), [
    "evidence.evidenceHashes.behaviorQa",
    "evidence.evidenceHashes.engineeringQa",
    "evidence.evidenceHashes.productQa",
  ]);
  const updated = JSON.parse(plan.updatedManifestBytes);
  assert.equal(updated.evidence.evidenceHashes.engineeringQa, sha256(pilot.artifacts.engineeringQa));
  assert.equal(updated.evidence.evidenceHashes.behaviorQa, sha256(pilot.artifacts.behaviorQa));
  assert.equal(updated.evidence.evidenceHashes.productQa, sha256(pilot.artifacts.productQa));
  assert.deepEqual(withoutQaHashes(updated), withoutQaHashes(pilot.manifest));
  assert.deepEqual(updated.acceptance, pilot.manifest.acceptance);
  assert.equal(plan.approvalEffect, "none; current-JavaScript approval is neither renewed nor promoted");
});

test("check mode fails closed on stale bindings without writing", async (t) => {
  const fixture = await createFixture(t, [KEYTERM_QA_PILOT_IDS[0]]);
  const pilot = fixture.pilots[0];
  await assert.rejects(
    refreshKeytermQaManifestBindings({
      projectRoot: fixture.root,
      ids: [pilot.animationId],
      mode: "check",
    }),
    /bindings are stale/,
  );
  assert.deepEqual(await readFile(pilot.manifestPath), pilot.manifestBytes);
});

test("CAS refuses manifest and QA-byte drift after preflight", async (t) => {
  await t.test("manifest drift", async (t) => {
    const fixture = await createFixture(t, [KEYTERM_QA_PILOT_IDS[0]]);
    const pilot = fixture.pilots[0];
    const plan = await planKeytermQaManifestBinding({
      projectRoot: fixture.root,
      animationId: pilot.animationId,
    });
    const concurrent = Buffer.from(`${pilot.manifestBytes}// concurrent mutation\n`);
    await writeFile(pilot.manifestPath, concurrent);
    await assert.rejects(commitKeytermQaManifestBindingPlans([plan]), /migration\.json drifted/);
    assert.deepEqual(await readFile(pilot.manifestPath), concurrent);
  });

  await t.test("QA artifact drift", async (t) => {
    const fixture = await createFixture(t, [KEYTERM_QA_PILOT_IDS[0]]);
    const pilot = fixture.pilots[0];
    const plan = await planKeytermQaManifestBinding({
      projectRoot: fixture.root,
      animationId: pilot.animationId,
    });
    const artifactPath = path.join(pilot.workspace, "evidence", "product-qa.json");
    await writeFile(artifactPath, "{\"changed\":true}\n");
    await assert.rejects(commitKeytermQaManifestBindingPlans([plan]), /QA bytes drifted/);
    assert.deepEqual(await readFile(pilot.manifestPath), pilot.manifestBytes);
  });
});

test("multi-pilot transaction rolls back exact manifest bytes after an injected mid-commit failure", async (t) => {
  const fixture = await createFixture(t);
  const plans = [];
  for (const pilot of fixture.pilots) {
    plans.push(await planKeytermQaManifestBinding({
      projectRoot: fixture.root,
      animationId: pilot.animationId,
    }));
  }
  await assert.rejects(
    commitKeytermQaManifestBindingPlans(plans, {
      testHooks: {
        beforeReplace({committedCount}) {
          if (committedCount === 1) throw new Error("injected second-pilot failure");
        },
      },
    }),
    /injected second-pilot failure/,
  );
  for (const pilot of fixture.pilots) {
    assert.deepEqual(await readFile(pilot.manifestPath), pilot.manifestBytes);
  }
  await assert.rejects(
    readFile(path.join(fixture.root, "migrations", ".keyterm-qa-manifest-bindings.lock")),
    {code: "ENOENT"},
  );
});

test("write mode is deterministic and becomes a clean no-op/check", async (t) => {
  const fixture = await createFixture(t);
  const first = await refreshKeytermQaManifestBindings({
    projectRoot: fixture.root,
    mode: "write",
  });
  assert.ok(first.every(({changed}) => changed));
  const afterFirst = await Promise.all(fixture.pilots.map(({manifestPath}) => readFile(manifestPath)));
  const checked = await refreshKeytermQaManifestBindings({
    projectRoot: fixture.root,
    mode: "check",
  });
  assert.ok(checked.every(({changed}) => !changed));
  const repeated = await refreshKeytermQaManifestBindings({
    projectRoot: fixture.root,
    mode: "write",
  });
  assert.ok(repeated.every(({changed}) => !changed));
  const afterSecond = await Promise.all(fixture.pilots.map(({manifestPath}) => readFile(manifestPath)));
  assert.deepEqual(afterSecond, afterFirst);
});

test("canonical key-term QA evidence bytes remain bound to both migration manifests", async () => {
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const plans = await refreshKeytermQaManifestBindings({
    projectRoot,
    mode: "check",
  });
  assert.equal(plans.length, KEYTERM_QA_PILOT_IDS.length);
  assert.ok(plans.every(({changed}) => !changed));
});
