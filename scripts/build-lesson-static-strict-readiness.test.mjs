import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L4_RELEASE_ID,
  readG5L4M1StaticReconciliationReceipt,
} from "./reconcile-lesson-m1-static-specification.mjs";
import {
  G5_L4_WORK_STUDY_READINESS_IDS,
} from "./build-g5-l4-work-study-strict-readiness.mjs";
import {
  buildLessonStaticStrictReadiness,
  commitStaticStrictReadinessBatch,
  G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
  nonWorkStudyDisposition,
  parseArguments,
  validateG5L4StaticStrictReadinessCoverage,
  validateG5L4StaticStrictReadinessManifest,
} from "./build-lesson-static-strict-readiness.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function outputSnapshot(animationId) {
  const candidate = path.join(
    projectRoot,
    "migrations",
    animationId,
    "audit",
    "strict-readiness.json",
  );
  try {
    const [information, bytes] = await Promise.all([
      lstat(candidate),
      readFile(candidate),
    ]);
    return {
      exists: true,
      size: information.size,
      mtimeMs: information.mtimeMs,
      sha256: sha256(bytes),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {exists: false};
    throw error;
  }
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

async function transactionRecord(root, relativePath, {allowMissing = false} = {}) {
  const absolutePath = path.join(root, relativePath);
  try {
    const [information, contents] = await Promise.all([
      lstat(absolutePath, {bigint: true}),
      readFile(absolutePath),
    ]);
    return {
      path: relativePath,
      absolutePath,
      exists: true,
      bytes: contents.length,
      sha256: sha256(contents),
      contents,
      stat: statIdentity(information),
    };
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {
        path: relativePath,
        absolutePath,
        exists: false,
        bytes: 0,
        sha256: "",
        contents: null,
        stat: null,
      };
    }
    throw error;
  }
}

async function exactReleaseMembers() {
  const catalog = JSON.parse(
    await readFile(
      path.join(projectRoot, "catalog", "lesson-releases.json"),
      "utf8",
    ),
  );
  const releases = catalog.releases.filter(
    ({releaseId}) => releaseId === G5_L4_RELEASE_ID,
  );
  assert.equal(releases.length, 1);
  assert.equal(releases[0].members.length, 55);
  return releases[0].members;
}

function receiptOutputDescriptor(output) {
  return output.current ?? output.after ?? output;
}

test("release-driven CLI is fail-closed and defaults to dry-run", () => {
  assert.deepEqual(
    parseArguments(["--release-id", G5_L4_RELEASE_ID]),
    {
      help: false,
      releaseId: G5_L4_RELEASE_ID,
      mode: "dry-run",
    },
  );
  assert.equal(
    parseArguments(["--release-id", G5_L4_RELEASE_ID, "--check"]).mode,
    "check",
  );
  assert.throws(
    () => parseArguments([]),
    /--release-id is required/,
  );
  assert.throws(
    () =>
      parseArguments([
        "--release-id",
        G5_L4_RELEASE_ID,
        "--check",
        "--apply",
      ]),
    /choose at most one/,
  );
  assert.throws(
    () =>
      parseArguments([
        "--release-id",
        "lesson-g05-l99-not-authorized",
      ]),
    /unsupported static strict-readiness release/,
  );
});

test("non-work-study disposition never invents selection or labor", async () => {
  const catalog = JSON.parse(
    await readFile(
      path.join(
        projectRoot,
        "catalog",
        "lesson-release-calibration-sets.json",
      ),
      "utf8",
    ),
  );
  const selected = catalog.calibrationSets.find(
    ({releaseId}) => releaseId === G5_L4_RELEASE_ID,
  );
  const disposition = nonWorkStudyDisposition({selected});
  assert.equal(disposition.selected, false);
  assert.equal(
    disposition.status,
    "not-selected-for-four-member-human-work-study",
  );
  assert.deepEqual(
    disposition.selectedTargetIds,
    G5_L4_WORK_STUDY_READINESS_IDS,
  );
  assert.equal(disposition.selectedTargetOrdinal, null);
  assert.deepEqual(disposition.phases, []);
  assert.equal(disposition.completedPhaseCount, 0);
  assert.equal(disposition.actualTotalMinutes, null);
  assert.equal(disposition.measuredBy, null);
});

test("the 52 bounded engineering candidates preserve manifest-bound and FQ001 evidence boundaries", async () => {
  assert.equal(
    Object.keys(G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES).length,
    52,
  );
  assert.equal(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[
      "course-g05-l04-fq-002"
    ],
    undefined,
  );
  assert.equal(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[
      "course-g05-l04-fq-003"
    ],
    undefined,
  );
  const candidateProfiles = Object.values(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
  );
  const manifestBoundSingleSpriteProfiles = candidateProfiles.filter(
    ({manifestBound}) => manifestBound !== false,
  );
  assert.equal(manifestBoundSingleSpriteProfiles.length, 51);
  assert.equal(
    candidateProfiles.filter(({manifestBound}) => manifestBound === false)
      .length,
    1,
  );
  assert.equal(
    manifestBoundSingleSpriteProfiles.filter(
      ({nestedFrameCount, renderedFrameCount}) =>
        (renderedFrameCount ?? nestedFrameCount) === nestedFrameCount,
    ).length,
    20,
  );
  assert.equal(
    manifestBoundSingleSpriteProfiles.filter(
      ({nestedFrameCount, renderedFrameCount}) =>
        renderedFrameCount < nestedFrameCount,
    ).length,
    31,
  );
  assert.equal(
    candidateProfiles.reduce(
      (sum, {nestedFrameCount, renderedFrameCount}) =>
        sum + (renderedFrameCount ?? nestedFrameCount),
      0,
    ),
    13_696,
  );
  assert.equal(
    candidateProfiles.reduce(
      (sum, {nestedFrameCount, renderedFrameCount}) =>
        sum + nestedFrameCount - (renderedFrameCount ?? nestedFrameCount),
      0,
    ),
    3_020,
  );
  assert.equal(
    manifestBoundSingleSpriteProfiles.reduce(
      (sum, {nestedFrameCount}) => sum + nestedFrameCount,
      0,
    ),
    16_664,
  );
  assert.deepEqual(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[
      "course-g05-l04-rw-003"
    ],
    {
      frameDomainId: "sprite-535",
      nestedFrameCount: 1141,
      sourceInstanceId: "Animation",
      unresolvedTimelineCandidateIds: ["sprite-264", "sprite-379"],
    },
  );
  assert.deepEqual(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[
      "course-g05-l04-rw-004"
    ],
    {
      frameDomainId: "sprite-227",
      nestedFrameCount: 506,
      sourceInstanceId: "Animation",
      unresolvedTimelineCandidateIds: ["sprite-37", "sprite-145"],
    },
  );
  const members = new Map(
    (await exactReleaseMembers()).map((member) => [
      member.animationId,
      member,
    ]),
  );
  for (const [animationId, expectedProfile] of Object.entries(
    G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
  )) {
    const member = members.get(animationId);
    assert.ok(member, `${animationId} must remain in the exact release`);
    const workspace = path.join(projectRoot, "migrations", animationId);
    const [manifestBytes, coverageBytes] = await Promise.all([
      readFile(path.join(workspace, "migration.json")),
      readFile(
        path.join(workspace, "evidence", "full-frame-coverage.json"),
      ),
    ]);
    const manifest = JSON.parse(manifestBytes);
    const coverage = JSON.parse(coverageBytes);
    const profile = validateG5L4StaticStrictReadinessManifest(
      manifest,
      member,
    );
    assert.deepEqual(profile, expectedProfile);
    assert.equal(
      validateG5L4StaticStrictReadinessCoverage(
        coverage,
        member,
        manifest.runtime.frameCount,
        profile,
      ),
      true,
    );
    const manifestBound = expectedProfile.manifestBound !== false;
    assert.equal(coverage.requirements.length, manifestBound ? 4 : 2);
    assert.deepEqual(
      coverage.requirements.map(
        ({frameDomainId, language, status}) => ({
          frameDomainId,
          language,
          status,
        }),
      ),
      [
        {frameDomainId: "root", language: "en", status: "pending"},
        {frameDomainId: "root", language: "es", status: "pending"},
        ...(manifestBound
          ? [
              {
                frameDomainId: profile.frameDomainId,
                language: "en",
                status: "pending",
              },
              {
                frameDomainId: profile.frameDomainId,
                language: "es",
                status: "pending",
              },
            ]
          : []),
      ],
    );

    const badRoute = structuredClone(manifest);
    if (manifestBound) {
      badRoute.implementation.route = "";
    } else {
      badRoute.implementation.candidateMaturity.route = "";
    }
    assert.throws(
      () =>
        validateG5L4StaticStrictReadinessManifest(badRoute, member),
      /candidate renderer or frame-domain binding drifted|unresolved canonical manifest was altered/,
    );
    const promotedManifest = structuredClone(manifest);
    if (manifestBound) {
      promotedManifest.implementation.candidateState.spanishEnabled = true;
    } else {
      promotedManifest.implementation.candidateMaturity.spanishEnabled = true;
    }
    assert.throws(
      () =>
        validateG5L4StaticStrictReadinessManifest(
          promotedManifest,
          member,
        ),
      /candidate acceptance boundary drifted|unresolved canonical manifest was altered/,
    );
    const narrowedCoverage = structuredClone(coverage);
    narrowedCoverage.requirements.pop();
    assert.throws(
      () =>
        validateG5L4StaticStrictReadinessCoverage(
          narrowedCoverage,
          member,
          manifest.runtime.frameCount,
          profile,
        ),
      /[Cc]overage.*drifted/,
    );
    const forgedEntryState = structuredClone(coverage);
    forgedEntryState.requirements[manifestBound ? 2 : 0]
      .entryStateSha256 = "f".repeat(64);
    assert.throws(
      () =>
        validateG5L4StaticStrictReadinessCoverage(
          forgedEntryState,
          member,
          manifest.runtime.frameCount,
          profile,
        ),
      /[Cc]overage.*drifted/,
    );

    const receiptResult =
      await readG5L4M1StaticReconciliationReceipt({
        root: projectRoot,
        animationId,
        member,
      });
    const receipt =
      receiptResult.receipt ??
      receiptResult.document ??
      receiptResult;
    const historicalManifest = receiptOutputDescriptor(
      receipt.outputs.migrationManifest,
    );
    assert.notEqual(sha256(manifestBytes), historicalManifest.sha256);
    for (const [key, relativePath] of [
      ["migrationBrief", "MIGRATION_BRIEF.md"],
      ["scriptInventory", "audit/script-inventory.json"],
      ["dependencyInventory", "audit/dependency-inventory.json"],
    ]) {
      const expected = receiptOutputDescriptor(receipt.outputs[key]);
      const current = await readFile(path.join(workspace, relativePath));
      assert.equal(current.length, expected.bytes);
      assert.equal(sha256(current), expected.sha256);
    }
  }
});

test("real dry-run covers exact 55, retains four bytes, and plans only 51", async () => {
  const members = await exactReleaseMembers();
  const before = new Map(
    await Promise.all(
      members.map(async ({animationId}) => [
        animationId,
        await outputSnapshot(animationId),
      ]),
    ),
  );
  const result = await buildLessonStaticStrictReadiness({
    projectRoot,
    releaseId: G5_L4_RELEASE_ID,
    mode: "dry-run",
  });
  const after = new Map(
    await Promise.all(
      members.map(async ({animationId}) => [
        animationId,
        await outputSnapshot(animationId),
      ]),
    ),
  );

  assert.equal(result.action, "planned-51-retained-4");
  assert.equal(result.memberCount, 55);
  assert.equal(result.managedOutputCount, 51);
  assert.equal(result.retainedWorkStudyOutputCount, 4);
  assert.equal(result.outputs.length, 55);
  assert.deepEqual(after, before, "dry-run must not write any readiness file");

  const retained = result.outputs.filter(
    ({disposition}) =>
      disposition === "retained-existing-work-study-readiness",
  );
  assert.deepEqual(
    retained.map(({animationId}) => animationId).sort(),
    [...G5_L4_WORK_STUDY_READINESS_IDS].sort(),
  );
  assert.ok(retained.every(({workStudySelected}) => workStudySelected));

  const managed = result.outputs.filter(
    ({disposition}) =>
      disposition === "managed-non-work-study-readiness",
  );
  assert.equal(managed.length, 51);
  assert.ok(
    managed.every(
      ({
        workStudySelected,
        workStudySelectionStatus,
        strictAcceptanceReady,
        published,
      }) =>
        workStudySelected === false &&
        workStudySelectionStatus ===
          "not-selected-for-four-member-human-work-study" &&
        strictAcceptanceReady === false &&
        published === false,
    ),
  );
  assert.equal(
    result.outputs.filter(({riskCalibrationSelected}) =>
      riskCalibrationSelected).length,
    8,
  );
  const sourceStaticCandidates = result.outputs.filter(
    ({sourceStaticCandidate}) => sourceStaticCandidate,
  );
  assert.deepEqual(
    sourceStaticCandidates.map(({animationId}) => animationId).sort(),
    Object.keys(G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES).sort(),
  );
  assert.ok(
    sourceStaticCandidates.every(
      ({animationId, coverageRequirementCount, implementationReadiness}) => {
        const retainedWorkStudyCandidate =
          G5_L4_WORK_STUDY_READINESS_IDS.includes(animationId);
        return coverageRequirementCount ===
          (retainedWorkStudyCandidate
            ? null
            : G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[animationId]
                .manifestBound === false
              ? 2
              : 4) &&
        (retainedWorkStudyCandidate ||
          implementationReadiness.implementationStarted === true) &&
        implementationReadiness.rendererSelected === true &&
        implementationReadiness.routeDeclared === true &&
        implementationReadiness.currentJavaScriptCandidate === true &&
        implementationReadiness.implementationAuthorized === false &&
        implementationReadiness.behaviorImplementationComplete === false &&
        implementationReadiness
          .deterministicImplementationCaptureAccepted === false &&
        implementationReadiness.fullFrameComparisonAccepted === false;
      },
    ),
  );
  assert.equal(result.implementationAuthorized, false);
  assert.equal(result.originalRuntimeLaunched, false);
  assert.equal(result.audioAccepted, false);
  assert.equal(result.strictCompleteCount, 0);
  assert.equal(result.publishedCount, 0);
});

test("receipt bytes returned by a reader may not diverge from the canonical file", async () => {
  let first = true;
  await assert.rejects(
    buildLessonStaticStrictReadiness({
      projectRoot,
      releaseId: G5_L4_RELEASE_ID,
      mode: "dry-run",
      staticReceiptReader: async (options) => {
        const result =
          await readG5L4M1StaticReconciliationReceipt(options);
        if (!first) return result;
        first = false;
        const receipt = structuredClone(
          result.receipt ?? result.document,
        );
        receipt.acceptanceEffects.strictComplete = true;
        return result.receipt
          ? {...result, receipt}
          : {...result, document: receipt};
      },
    }),
    /static receipt is non-canonical or reader bytes differ/,
  );
});

test("managed-output batch rolls back an injected failure without touching retained files", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-static-readiness-writer-"),
  );
  try {
    const firstRelative =
      "migrations/member-one/audit/strict-readiness.json";
    const secondRelative =
      "migrations/member-two/audit/strict-readiness.json";
    const retainedRelative =
      "migrations/retained-work-study/audit/strict-readiness.json";
    const inputRelative = "inputs/current.json";
    await Promise.all([
      mkdir(path.join(root, "migrations", "member-one", "audit"), {
        recursive: true,
      }),
      mkdir(path.join(root, "migrations", "member-two", "audit"), {
        recursive: true,
      }),
      mkdir(
        path.join(root, "migrations", "retained-work-study", "audit"),
        {recursive: true},
      ),
      mkdir(path.join(root, "inputs"), {recursive: true}),
    ]);
    const original = `${JSON.stringify({state: "original"}, null, 2)}\n`;
    const retained = `${JSON.stringify({state: "retained"}, null, 2)}\n`;
    await Promise.all([
      writeFile(path.join(root, firstRelative), original),
      writeFile(path.join(root, retainedRelative), retained),
      writeFile(
        path.join(root, inputRelative),
        `${JSON.stringify({current: true}, null, 2)}\n`,
      ),
    ]);
    const inputRecord = await transactionRecord(root, inputRelative);
    const firstSnapshot = await transactionRecord(root, firstRelative);
    const secondSnapshot = await transactionRecord(root, secondRelative, {
      allowMissing: true,
    });
    const prepared = [
      {
        id: "member-one",
        output: firstRelative,
        outputPath: path.join(root, firstRelative),
        outputSnapshot: firstSnapshot,
        inputRecords: [inputRecord],
        rendered: `${JSON.stringify({state: "replacement-one"}, null, 2)}\n`,
      },
      {
        id: "member-two",
        output: secondRelative,
        outputPath: path.join(root, secondRelative),
        outputSnapshot: secondSnapshot,
        inputRecords: [inputRecord],
        rendered: `${JSON.stringify({state: "replacement-two"}, null, 2)}\n`,
      },
    ];
    await assert.rejects(
      commitStaticStrictReadinessBatch(root, prepared, {
        afterCommit({index}) {
          if (index === 0) throw new Error("injected-after-first-commit");
        },
      }),
      /injected-after-first-commit/,
    );
    assert.equal(await readFile(path.join(root, firstRelative), "utf8"), original);
    await assert.rejects(
      readFile(path.join(root, secondRelative)),
      {code: "ENOENT"},
    );
    assert.equal(
      await readFile(path.join(root, retainedRelative), "utf8"),
      retained,
    );
    const debris = [];
    for (const member of ["member-one", "member-two"]) {
      const audit = path.join(root, "migrations", member, "audit");
      const names = await readdir(audit);
      debris.push(
        ...names.filter((name) =>
          name.startsWith(".strict-readiness.json.")),
      );
    }
    assert.deepEqual(debris, []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
