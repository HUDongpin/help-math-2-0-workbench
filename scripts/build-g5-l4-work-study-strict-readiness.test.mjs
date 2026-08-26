import assert from "node:assert/strict";
import {
  appendFile,
  chmod,
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L4_WORK_STUDY_READINESS_IDS,
  buildG5L4WorkStudyStrictReadiness,
  buildOneG5L4WorkStudyStrictReadiness,
  parseArguments,
  runtimePlanFingerprint,
  validateG5L4WorkStudyStrictReadiness,
} from "./build-g5-l4-work-study-strict-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const FIXTURE_ID = "course-g05-l04-rw-002";
const GENERATOR_RELATIVE = "scripts/build-g5-l4-work-study-strict-readiness.mjs";
const PLAN_RELATIVE = `migrations/${FIXTURE_ID}/audit/machine/release-runtime-acquisition-plan.json`;

async function copyRelative(sourceRoot, targetRoot, relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(targetRoot, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(source, target);
}

async function makeFixtureProject(ids = [FIXTURE_ID]) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l4-work-study-readiness-"));
  const copied = new Set();
  let sourceRelative = "";
  for (const id of ids) {
    const current = await buildOneG5L4WorkStudyStrictReadiness(id, {check: true});
    if (id === ids[0]) sourceRelative = current.document.source.swf;
    for (const evidence of current.document.evidence) {
      if (copied.has(evidence.path)) continue;
      await copyRelative(projectRoot, fixtureRoot, evidence.path);
      copied.add(evidence.path);
    }
  }
  await copyRelative(projectRoot, fixtureRoot, GENERATOR_RELATIVE);
  return {
    fixtureRoot,
    sourceRelative,
  };
}

test("G5 L4 work-study readiness owns exactly the configured four-member selection", async () => {
  assert.deepEqual(G5_L4_WORK_STUDY_READINESS_IDS, [
    "shell-course-g05-l04-index-local",
    "course-g05-l04-rw-002",
    "course-g05-l04-in-019",
    "course-g05-l04-fq-002",
  ]);
  assert.equal(new Set(G5_L4_WORK_STUDY_READINESS_IDS).size, 4);
  assert.deepEqual(parseArguments(["--id", FIXTURE_ID, "--check"]), {
    check: true,
    ids: [FIXTURE_ID],
  });
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/);
  await assert.rejects(
    buildG5L4WorkStudyStrictReadiness({ids: ["course-g05-l04-in-017"]}),
    /unknown G5 L4 work-study readiness target/,
  );
});

test("all four checked-in records are deterministic, source-model exact, and fail closed", async () => {
  const results = await buildG5L4WorkStudyStrictReadiness({check: true});
  assert.equal(results.length, 4);
  assert.ok(results.every((item) => item.action === "verified"));
  assert.deepEqual(
    results.map((item) => [item.id, item.document.source.sourceModel]),
    [
      ["shell-course-g05-l04-index-local", "shipped-swf-only"],
      ["course-g05-l04-rw-002", "shipped-swf-only"],
      ["course-g05-l04-in-019", "paired-fla-and-shipped-swf"],
      ["course-g05-l04-fq-002", "paired-fla-and-shipped-swf"],
    ],
  );
  for (const {document} of results) {
    assert.equal(document.m1Authorization.machineOnlyM1FidelityTrancheAuthorized, true);
    assert.equal(document.m1Authorization.externalSignatureEnvelopePresent, false);
    assert.equal(document.m1Authorization.portableExternalIdentityVerificationReady, false);
    assert.equal(document.runtimeAcquisitionReadiness.runtimeSessionsExecuted, 0);
    assert.equal(document.runtimeAcquisitionReadiness.namedOperatorRoleAssignmentCount, 1);
    assert.equal(
      document.runtimeAcquisitionReadiness.namedOperatorRoleAssignment.assigneeFullName,
      "Dr. Peter Hu",
    );
    assert.equal(
      document.runtimeAcquisitionReadiness.namedOperatorRoleAssignment.weeklyCapacityEstablished,
      false,
    );
    assert.equal(document.runtimeAcquisitionReadiness.sessionOperatorAttestationCount, 0);
    assert.equal(document.implementationReadiness.implementationAuthorized, false);
    assert.equal(document.acceptance.authoritativeOriginalRuntimeAccepted, false);
    assert.equal(document.acceptance.ownerAccepted, false);
    assert.equal(document.acceptance.strictMigrationComplete, false);
    assert.equal(document.acceptance.published, false);
  }
});

test("validator rejects implementation, runtime, review, acceptance, and source-model promotion", async () => {
  const {document} = await buildOneG5L4WorkStudyStrictReadiness(FIXTURE_ID, {check: true});

  const implementation = structuredClone(document);
  implementation.implementationReadiness.implementationAuthorized = true;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(implementation),
    /implementationAuthorized must remain false/,
  );

  const runtime = structuredClone(document);
  runtime.runtimeAcquisitionReadiness.runtimeSessionsExecuted = 1;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(runtime),
    /runtime session count must remain zero/,
  );

  const inventedSessionOperator = structuredClone(document);
  inventedSessionOperator.runtimeAcquisitionReadiness.sessionOperatorAttestationCount = 1;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(inventedSessionOperator),
    /per-session operator attestation was fabricated/,
  );

  const inventedOperatorAuthority = structuredClone(document);
  inventedOperatorAuthority.runtimeAcquisitionReadiness
    .namedOperatorRoleAssignment.originalRuntimeExecutionAuthorized = true;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(inventedOperatorAuthority),
    /originalRuntimeExecutionAuthorized must remain false/,
  );

  const review = structuredClone(document);
  review.review.ownerReview.reviewer = "invented reviewer";
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(review),
    /fabricated identity or signature/,
  );

  const acceptance = structuredClone(document);
  acceptance.acceptance.ownerAccepted = true;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(acceptance),
    /ownerAccepted must remain false/,
  );

  const sourceModel = structuredClone(document);
  sourceModel.source.sourceModel = "paired-fla-and-shipped-swf";
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(sourceModel),
    /paired FLA binding is missing/,
  );

  const portableIdentity = structuredClone(document);
  portableIdentity.m1Authorization.portableExternalIdentityVerificationReady = true;
  assert.throws(
    () => validateG5L4WorkStudyStrictReadiness(portableIdentity),
    /portableExternalIdentityVerificationReady must remain false/,
  );
});

test("fixture build re-verifies physical source bytes, runtime-plan authority, and linked inputs", async () => {
  const fixture = await makeFixtureProject();
  try {
    const written = await buildG5L4WorkStudyStrictReadiness({
      projectRoot: fixture.fixtureRoot,
      ids: [FIXTURE_ID],
    });
    assert.equal(written[0].action, "written");
    const checked = await buildG5L4WorkStudyStrictReadiness({
      projectRoot: fixture.fixtureRoot,
      ids: [FIXTURE_ID],
      check: true,
    });
    assert.equal(checked[0].action, "verified");

    const fixtureSource = path.join(fixture.fixtureRoot, fixture.sourceRelative);
    await chmod(fixtureSource, 0o600);
    await appendFile(fixtureSource, Buffer.from([0]));
    await assert.rejects(
      buildOneG5L4WorkStudyStrictReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /byte count mismatch|hash mismatch/,
    );
    await copyFile(path.join(projectRoot, fixture.sourceRelative), fixtureSource);

    const fixturePlan = path.join(fixture.fixtureRoot, PLAN_RELATIVE);
    const originalPlanText = await readFile(fixturePlan, "utf8");
    const promotedPlan = JSON.parse(originalPlanText);
    promotedPlan.acceptanceEffects.ownerAccepted = true;
    promotedPlan.artifactFingerprintSha256 = runtimePlanFingerprint(promotedPlan);
    await writeFile(fixturePlan, `${JSON.stringify(promotedPlan, null, 2)}\n`, "utf8");
    await assert.rejects(
      buildOneG5L4WorkStudyStrictReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /ownerAccepted must remain false/,
    );
    await writeFile(fixturePlan, originalPlanText, "utf8");

    await unlink(fixturePlan);
    await symlink(path.join(projectRoot, PLAN_RELATIVE), fixturePlan);
    await assert.rejects(
      buildOneG5L4WorkStudyStrictReadiness(FIXTURE_ID, {projectRoot: fixture.fixtureRoot}),
      /expected one regular non-linked file/,
    );
  } finally {
    await rm(fixture.fixtureRoot, {recursive: true, force: true});
  }
});

test("readiness output refuses symlink, hard-link, and symlink-ancestor writes", async (t) => {
  await t.test("symlink target", async () => {
    const fixture = await makeFixtureProject();
    try {
      const output = path.join(
        fixture.fixtureRoot,
        "migrations",
        FIXTURE_ID,
        "audit",
        "strict-readiness.json",
      );
      const referent = path.join(fixture.fixtureRoot, "symlink-referent.json");
      const original = Buffer.from("do-not-change-symlink-referent\n");
      await writeFile(referent, original);
      await symlink(referent, output);
      await assert.rejects(
        buildG5L4WorkStudyStrictReadiness({
          projectRoot: fixture.fixtureRoot,
          ids: [FIXTURE_ID],
        }),
        /regular non-symlink file/,
      );
      assert.deepEqual(await readFile(referent), original);
    } finally {
      await rm(fixture.fixtureRoot, {recursive: true, force: true});
    }
  });

  await t.test("hard-link target", async () => {
    const fixture = await makeFixtureProject();
    try {
      const output = path.join(
        fixture.fixtureRoot,
        "migrations",
        FIXTURE_ID,
        "audit",
        "strict-readiness.json",
      );
      const referent = path.join(fixture.fixtureRoot, "hardlink-referent.json");
      const original = Buffer.from("do-not-change-hardlink-referent\n");
      await writeFile(referent, original);
      await link(referent, output);
      await assert.rejects(
        buildG5L4WorkStudyStrictReadiness({
          projectRoot: fixture.fixtureRoot,
          ids: [FIXTURE_ID],
        }),
        /exactly one hard link/,
      );
      assert.deepEqual(await readFile(referent), original);
    } finally {
      await rm(fixture.fixtureRoot, {recursive: true, force: true});
    }
  });

  await t.test("symlink audit ancestor", async () => {
    const fixture = await makeFixtureProject();
    try {
      const workspace = path.join(fixture.fixtureRoot, "migrations", FIXTURE_ID);
      const audit = path.join(workspace, "audit");
      const realAudit = path.join(workspace, "audit-real");
      await rename(audit, realAudit);
      await symlink(realAudit, audit);
      await assert.rejects(
        buildG5L4WorkStudyStrictReadiness({
          projectRoot: fixture.fixtureRoot,
          ids: [FIXTURE_ID],
        }),
        /output ancestor must be a real non-symlink directory/,
      );
    } finally {
      await rm(fixture.fixtureRoot, {recursive: true, force: true});
    }
  });
});

test("later-target failure rolls back an existing output and leaves a new target absent", async () => {
  const ids = [FIXTURE_ID, "course-g05-l04-in-019"];
  const fixture = await makeFixtureProject(ids);
  try {
    await buildG5L4WorkStudyStrictReadiness({
      projectRoot: fixture.fixtureRoot,
      ids: [ids[0]],
    });
    const firstOutput = path.join(
      fixture.fixtureRoot,
      "migrations",
      ids[0],
      "audit",
      "strict-readiness.json",
    );
    const secondOutput = path.join(
      fixture.fixtureRoot,
      "migrations",
      ids[1],
      "audit",
      "strict-readiness.json",
    );
    const firstBefore = await readFile(firstOutput);
    await assert.rejects(
      buildG5L4WorkStudyStrictReadiness({
        projectRoot: fixture.fixtureRoot,
        ids,
        transactionHooks: {
          beforeCommit({index}) {
            if (index === 1) throw new Error("injected later-target readiness failure");
          },
        },
      }),
      /injected later-target readiness failure/,
    );
    assert.deepEqual(await readFile(firstOutput), firstBefore);
    await assert.rejects(readFile(secondOutput), {code: "ENOENT"});
    for (const id of ids) {
      const audit = path.join(fixture.fixtureRoot, "migrations", id, "audit");
      const entries = await readdir(audit);
      assert.equal(
        entries.some((name) => name.includes(".transaction") || name.endsWith(".stage")),
        false,
      );
    }
  } finally {
    await rm(fixture.fixtureRoot, {recursive: true, force: true});
  }
});
