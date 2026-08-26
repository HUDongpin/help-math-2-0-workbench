import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  SOURCE_DERIVED_FQ_AUDIO_PILOT_ID,
  acceptanceRequirements,
  preflightAndCommitAudioAudits,
  classifyAudioLanguage,
  deriveFqAudioUrlMatrix,
  deriveFqHostUrlContract,
  embeddedInventoryRows,
  evaluateStrictNoAudioFacts,
  extractActionScriptFunction,
  externalAudioStartSemantics,
  externalInventoryRows,
  manifestAudioFollowUp,
  loadLessonReleaseAudioMemberships,
  parseArguments,
  parseScriptAudioOperations,
  parseSwfmillAudio,
  verifyLessonReleaseAudioIdentity,
} from "./audit-pilot-audio.mjs";

const originalRoot = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const G5_L4_RELEASE_ID = "lesson-g05-l04-number-lines";
const G5_L4_WORK_STUDY_IDS = Object.freeze([
  "shell-course-g05-l04-index-local",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-019",
  "course-g05-l04-fq-002",
]);

async function createAudioTransactionWorkspace(root, id, {
  report = "original-report\n",
  inventory = "original-inventory\n",
} = {}) {
  const workspace = path.join(root, id);
  await mkdir(path.join(workspace, "audit"), { recursive: true });
  await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), report, "utf8");
  await writeFile(path.join(workspace, "audio-inventory.csv"), inventory, "utf8");
  return workspace;
}

function preparedAudioTransactionItem(id, workspace, {
  report = `new-report-${id}\n`,
  inventory = `new-inventory-${id}\n`,
} = {}) {
  return {
    id,
    workspace,
    outputs: [
      { filePath: path.join(workspace, "audit", "audio-runtime-evidence.json"), content: report },
      { filePath: path.join(workspace, "audio-inventory.csv"), content: inventory },
    ],
    result: { id, exact: 0, candidates: 0, embedded: 0, inventoryRows: 0 },
  };
}

async function audioTransactionTemporaryFiles(root) {
  const matches = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(candidate);
      else if (entry.name.startsWith(".audio-audit.")) matches.push(candidate);
    }
  }
  await walk(root);
  return matches.sort();
}

const verifiedHostConventions = Object.freeze({
  courseSpanishPage: Object.freeze({ verified: true }),
  formula: Object.freeze({ verified: true }),
  keyterm: Object.freeze({ verified: true }),
});

const emptyEmbeddedAudio = Object.freeze({
  defineSounds: Object.freeze([]),
  soundStreams: Object.freeze([]),
});

test("audio audit CLI parses repeatable IDs and check mode", () => {
  assert.deepEqual(parseArguments([
    "--lesson-release", G5_L4_RELEASE_ID,
    "--lesson-releases", "catalog/lesson-releases.json",
    "--id", G5_L4_WORK_STUDY_IDS[0],
    "--id", G5_L4_WORK_STUDY_IDS[1],
    "--check",
  ]), {
    ids: G5_L4_WORK_STUDY_IDS.slice(0, 2),
    check: true,
    help: false,
    lessonRelease: G5_L4_RELEASE_ID,
    lessonReleasesPath: path.resolve("catalog/lesson-releases.json"),
  });
  assert.throws(() => parseArguments(["--lesson-release"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("the four G5 L4 audio targets require exact hash-bound release, workspace, catalog, and physical-source identity", async () => {
  const memberships = await loadLessonReleaseAudioMemberships({
    ids: G5_L4_WORK_STUDY_IDS,
    lessonRelease: G5_L4_RELEASE_ID,
  });
  assert.deepEqual([...memberships.keys()], G5_L4_WORK_STUDY_IDS);
  assert.deepEqual(
    [...memberships.values()].map(({ releaseId, ordinal }) => ({ releaseId, ordinal })),
    [
      { releaseId: G5_L4_RELEASE_ID, ordinal: 55 },
      { releaseId: G5_L4_RELEASE_ID, ordinal: 2 },
      { releaseId: G5_L4_RELEASE_ID, ordinal: 32 },
      { releaseId: G5_L4_RELEASE_ID, ordinal: 53 },
    ],
  );

  const animations = JSON.parse(await readFile(path.join(projectRoot, "catalog", "animations.json"), "utf8"));
  const animationsById = new Map(animations.animations.map((animation) => [animation.animationId, animation]));
  for (const id of G5_L4_WORK_STUDY_IDS) {
    const manifest = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "migration.json"), "utf8"));
    const evidence = await verifyLessonReleaseAudioIdentity({
      membership: memberships.get(id),
      manifest,
      animation: animationsById.get(id),
    });
    assert.equal(evidence.animationId, id);
    assert.equal(evidence.publicationMode, "atomic");
    assert.equal(evidence.assetId, `swf-${evidence.source.sha256}`);
    assert.match(evidence.authorityBoundary, /does not establish audible language\/content/);
  }

  const tamperedId = G5_L4_WORK_STUDY_IDS[1];
  const tamperedManifest = JSON.parse(await readFile(path.join(projectRoot, "migrations", tamperedId, "migration.json"), "utf8"));
  tamperedManifest.assetId = `swf-${"0".repeat(64)}`;
  await assert.rejects(
    verifyLessonReleaseAudioIdentity({
      membership: memberships.get(tamperedId),
      manifest: tamperedManifest,
      animation: animationsById.get(tamperedId),
    }),
    /workspace identity differs/,
  );
  await assert.rejects(
    loadLessonReleaseAudioMemberships({
      ids: [G5_L4_WORK_STUDY_IDS[0]],
      lessonRelease: "lesson-g04-l03-negative-numbers",
    }),
    /(?:Unknown lesson release|not verified lesson-release members)/,
  );
  await assert.rejects(
    loadLessonReleaseAudioMemberships({
      ids: ["course-g05-l04-not-a-member"],
      lessonRelease: G5_L4_RELEASE_ID,
    }),
    /not verified lesson-release members/,
  );
});

test("omitting release member IDs selects the complete exact atomic release in source order", async () => {
  const memberships = await loadLessonReleaseAudioMemberships({
    ids: [],
    lessonRelease: G5_L4_RELEASE_ID,
  });
  assert.equal(memberships.size, 55);
  assert.deepEqual(
    [...memberships.values()].map(({ordinal}) => ordinal),
    Array.from({length: 55}, (_, index) => index + 1),
  );
  assert.equal([...memberships.keys()][0], "course-g05-l04-ir-001-a662633d");
  assert.equal([...memberships.keys()].at(-1), "shell-course-g05-l04-index-local");
});

test("lesson-release catalog rejects symlink, hardlink, and symlinked-parent paths", async () => {
  const root = await mkdtemp(path.join(projectRoot, ".audio-release-catalog-test-"));
  try {
    const catalogBytes = await readFile(path.join(projectRoot, "catalog", "lesson-releases.json"));
    const ordinary = path.join(root, "ordinary.json");
    const symlinkPath = path.join(root, "symlink.json");
    const hardlinkSource = path.join(root, "hardlink-source.json");
    const hardlinkPath = path.join(root, "hardlink.json");
    const realDirectory = path.join(root, "real-directory");
    const aliasDirectory = path.join(root, "alias-directory");
    await writeFile(ordinary, catalogBytes);
    await symlink(ordinary, symlinkPath);
    await writeFile(hardlinkSource, catalogBytes);
    await link(hardlinkSource, hardlinkPath);
    await mkdir(realDirectory);
    await writeFile(path.join(realDirectory, "catalog.json"), catalogBytes);
    await symlink(realDirectory, aliasDirectory);

    const ordinaryMembership = await loadLessonReleaseAudioMemberships({
      ids: [G5_L4_WORK_STUDY_IDS[0]],
      lessonRelease: G5_L4_RELEASE_ID,
      lessonReleasesPath: ordinary,
    });
    assert.equal(ordinaryMembership.get(G5_L4_WORK_STUDY_IDS[0]).releaseId, G5_L4_RELEASE_ID);
    for (const candidate of [
      { path: symlinkPath, pattern: /ordinary, non-linked file/ },
      { path: hardlinkPath, pattern: /ordinary, non-linked file/ },
      { path: path.join(aliasDirectory, "catalog.json"), pattern: /link-free realpath/ },
    ]) {
      await assert.rejects(
        loadLessonReleaseAudioMemberships({
          ids: [G5_L4_WORK_STUDY_IDS[0]],
          lessonRelease: G5_L4_RELEASE_ID,
          lessonReleasesPath: candidate.path,
        }),
        candidate.pattern,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audio batch preflights every selected target before any output write", async () => {
  const root = await mkdtemp(path.join(projectRoot, ".audio-audit-transaction-test-"));
  try {
    const workspaces = new Map();
    for (const id of G5_L4_WORK_STUDY_IDS) {
      workspaces.set(id, await createAudioTransactionWorkspace(root, id));
    }
    await assert.rejects(
      preflightAndCommitAudioAudits({
        targets: G5_L4_WORK_STUDY_IDS,
        prepareTarget: async (id) => {
          if (id === G5_L4_WORK_STUDY_IDS.at(-1)) throw new Error(`${id}: late source hash mismatch`);
          return preparedAudioTransactionItem(id, workspaces.get(id));
        },
        transactionRoot: root,
      }),
      /late source hash mismatch/,
    );
    for (const workspace of workspaces.values()) {
      assert.equal(await readFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), "utf8"), "original-report\n");
      assert.equal(await readFile(path.join(workspace, "audio-inventory.csv"), "utf8"), "original-inventory\n");
    }
    assert.deepEqual(await audioTransactionTemporaryFiles(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audio batch permits exactly the canonical report and inventory outputs", async () => {
  const root = await mkdtemp(path.join(projectRoot, ".audio-audit-output-boundary-test-"));
  const id = G5_L4_WORK_STUDY_IDS[0];
  const workspace = await createAudioTransactionWorkspace(root, id);
  try {
    const results = await preflightAndCommitAudioAudits({
      targets: [id],
      prepareTarget: async () => preparedAudioTransactionItem(id, workspace, {
        report: "{}\n",
        inventory: "cue_id\n",
      }),
      transactionRoot: root,
    });
    assert.deepEqual(results, [{ id, exact: 0, candidates: 0, embedded: 0, inventoryRows: 0 }]);
    assert.equal(await readFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), "utf8"), "{}\n");
    assert.equal(await readFile(path.join(workspace, "audio-inventory.csv"), "utf8"), "cue_id\n");
    assert.deepEqual(await audioTransactionTemporaryFiles(root), []);

    await assert.rejects(
      preflightAndCommitAudioAudits({
        targets: [id],
        prepareTarget: async () => ({
          id,
          workspace,
          outputs: [
            { filePath: path.join(workspace, "audit", "audio-runtime-evidence.json"), content: "{}\n" },
            { filePath: path.join(workspace, "migration.json"), content: "{}\n" },
          ],
            result: { id },
          }),
        transactionRoot: root,
      }),
      /output boundary/,
    );
    assert.equal(await readFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), "utf8"), "{}\n");
    assert.equal(await readFile(path.join(workspace, "audio-inventory.csv"), "utf8"), "cue_id\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audio transaction rejects symlink and hardlink output targets before staging", async () => {
  for (const targetKind of ["symlink", "hardlink"]) {
    const root = await mkdtemp(path.join(projectRoot, `.audio-audit-${targetKind}-output-test-`));
    const id = G5_L4_WORK_STUDY_IDS[0];
    try {
      const workspace = await createAudioTransactionWorkspace(root, id);
      const reportPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
      if (targetKind === "symlink") {
        const backingPath = path.join(workspace, "audit", "report-backing.json");
        await writeFile(backingPath, "symlink-backing\n", "utf8");
        await rm(reportPath);
        await symlink(backingPath, reportPath);
      } else {
        await link(reportPath, path.join(workspace, "audit", "report-hardlink.json"));
      }
      await assert.rejects(
        preflightAndCommitAudioAudits({
          targets: [id],
          prepareTarget: async () => preparedAudioTransactionItem(id, workspace),
          transactionRoot: root,
        }),
        /ordinary, non-linked file/,
      );
      assert.equal(await readFile(reportPath, "utf8"), targetKind === "symlink" ? "symlink-backing\n" : "original-report\n");
      assert.equal(await readFile(path.join(workspace, "audio-inventory.csv"), "utf8"), "original-inventory\n");
      assert.deepEqual(await audioTransactionTemporaryFiles(root), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("late commit failure rolls every earlier audio output back to its original bytes", async () => {
  const root = await mkdtemp(path.join(projectRoot, ".audio-audit-rollback-test-"));
  const ids = G5_L4_WORK_STUDY_IDS.slice(0, 3);
  const workspaces = new Map();
  const originals = new Map();
  try {
    for (const [index, id] of ids.entries()) {
      const report = `original-report-${index}\n`;
      const inventory = `original-inventory-${index}\n`;
      const workspace = await createAudioTransactionWorkspace(root, id, { report, inventory });
      workspaces.set(id, workspace);
      originals.set(id, { report, inventory });
    }
    await assert.rejects(
      preflightAndCommitAudioAudits({
        targets: ids,
        prepareTarget: async (id) => preparedAudioTransactionItem(id, workspaces.get(id)),
        transactionRoot: root,
        transactionHooks: {
          beforeCommit: async ({ commitIndex }) => {
            if (commitIndex === 4) throw new Error("injected later-target commit failure");
          },
        },
      }),
      /injected later-target commit failure/,
    );
    for (const id of ids) {
      const workspace = workspaces.get(id);
      assert.equal(
        await readFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), "utf8"),
        originals.get(id).report,
      );
      assert.equal(
        await readFile(path.join(workspace, "audio-inventory.csv"), "utf8"),
        originals.get(id).inventory,
      );
    }
    assert.deepEqual(await audioTransactionTemporaryFiles(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("per-output CAS rejects a later target change and restores already committed bytes", async () => {
  const root = await mkdtemp(path.join(projectRoot, ".audio-audit-cas-test-"));
  const ids = G5_L4_WORK_STUDY_IDS.slice(0, 2);
  const workspaces = new Map();
  try {
    for (const id of ids) workspaces.set(id, await createAudioTransactionWorkspace(root, id));
    const laterReport = path.join(workspaces.get(ids[1]), "audit", "audio-runtime-evidence.json");
    await assert.rejects(
      preflightAndCommitAudioAudits({
        targets: ids,
        prepareTarget: async (id) => preparedAudioTransactionItem(id, workspaces.get(id)),
        transactionRoot: root,
        transactionHooks: {
          beforeCommit: async ({ commitIndex }) => {
            if (commitIndex === 0) await writeFile(laterReport, "concurrent-change\n", "utf8");
          },
        },
      }),
      /changed immediately before commit/,
    );
    assert.equal(
      await readFile(path.join(workspaces.get(ids[0]), "audit", "audio-runtime-evidence.json"), "utf8"),
      "original-report\n",
    );
    assert.equal(
      await readFile(path.join(workspaces.get(ids[0]), "audio-inventory.csv"), "utf8"),
      "original-inventory\n",
    );
    assert.equal(await readFile(laterReport, "utf8"), "concurrent-change\n");
    assert.equal(
      await readFile(path.join(workspaces.get(ids[1]), "audio-inventory.csv"), "utf8"),
      "original-inventory\n",
    );
    assert.deepEqual(await audioTransactionTemporaryFiles(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("generated G5 L4 reports keep candidates, routing, nested cues, and every acceptance gate fail-closed", async () => {
  const reports = new Map();
  for (const id of G5_L4_WORK_STUDY_IDS) {
    const report = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "audit", "audio-runtime-evidence.json"), "utf8"));
    reports.set(id, report);
    assert.equal(report.animationId, id);
    assert.equal(report.source.hashMatches, true);
    assert.equal(report.authority.lessonReleaseMembership.releaseId, G5_L4_RELEASE_ID);
    assert.equal(report.authority.lessonReleaseMembership.publicationMode, "atomic");
    assert.equal(report.acceptance.strictAudioAcceptance, "pending");
    assert.deepEqual(report.acceptance.releaseBoundary, {
      authoritativeOriginalRuntimeListeningComplete: false,
      authoritativeOriginalRuntimeTraversalComplete: false,
      spokenLanguageContentVerified: false,
      humanAudioReviewComplete: false,
      ownerAcceptanceComplete: false,
      strictMigrationComplete: false,
      publicationAuthorized: false,
      strictAcceptanceEffect: "none",
    });
  }

  const fq = reports.get("course-g05-l04-fq-002");
  assert.equal(fq.externalAudio.candidateOnlyCount, 83);
  assert.equal(fq.externalAudio.lessonGroupCandidates.every(({ associationStatus }) => associationStatus === "lesson-group-candidate-only"), true);
  assert.equal(fq.inventory.lessonGroupCandidatesExcludedFromCsv, 83);
  assert.equal(fq.inventory.rowCount, 0);

  for (const id of ["course-g05-l04-rw-002", "course-g05-l04-in-019"]) {
    const report = reports.get(id);
    assert.deepEqual(report.externalAudio.exactAssociations.map(({ languageAssessment }) => languageAssessment.language), ["es"]);
    assert.equal(report.acceptance.releaseBoundary.spokenLanguageContentVerified, false);
    assert.equal(report.limitations.some((item) => item.includes("cannot prove the spoken content")), true);
  }
  assert.equal(
    [...reports.values()].some(({ embeddedAudio }) => embeddedAudio.soundStreams.some(({ context }) => context.kind !== "root")),
    true,
  );
  assert.equal(
    [...reports.values()].filter(({ embeddedAudio }) => embeddedAudio.soundStreams.some(({ context }) => context.kind !== "root"))
      .every(({ acceptance }) => acceptance.requirements.some((item) => item.includes("Nested SoundStream local frames"))),
    true,
  );
});

test("ActionScript function extraction ignores braces in nested code, strings, and comments", () => {
  const source = `
function target(value)
{
  // A comment containing } must not terminate the function.
  var text = "literal { and }";
  if(value)
  {
    /* A block comment containing } must not terminate it either. */
    return {answer: "}"};
  }
}
function nextFunction() { return false; }
`;
  const extracted = extractActionScriptFunction(source, "target");
  assert.match(extracted, /^function target/);
  assert.match(extracted, /return \{answer: "\}"\};/);
  assert.doesNotMatch(extracted, /nextFunction/);
  assert.equal(extractActionScriptFunction(source, "missing"), null);
});

test("final-quiz host contract is accepted only when every URL derivation is present", () => {
  const source = `
function doPlayFQQuestionAudio(target, strFQLang)
{
  strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe - 1).toString();
  arrFQName = _global.playSwfFileName.split("/");
  strFQQuestionAudioURL = base + "/EA/" + strFQTempLabel + ".mp3";
  strFQQuestionAudioURL = base + "/SA/" + strFQTempLabel + ".mp3";
  questionSound.loadSound(strFQQuestionAudioURL, false);
}
function doPlayFQAnswerAudio(target, intQAOption, strFQLang)
{
  strFQTempLabel = "Q" + Number(_root.animation_mc.animation._currentframe - 1).toString();
  arrFQName = _global.playSwfFileName.split("/");
  switch(intQAOption)
  {
    case 1: strQALabel = "A"; break;
    case 2: strQALabel = "B"; break;
    case 3: strQALabel = "C"; break;
    case 4: strQALabel = "D"; break;
  }
  strQAFName = strFQTempLabel + strQALabel + ".mp3";
  strFQAnswerAudioURL = base + "/EA/" + strQAFName;
  strFQAnswerAudioURL = base + "/SA/" + strQAFName;
  answerSound.loadSound(strFQAnswerAudioURL, false);
}`;
  const verified = deriveFqHostUrlContract([{ relativePath: "scripts/frame_35/DoAction.as", text: source }]);
  assert.equal(verified.verified, true);
  assert.equal(verified.pathAlgorithm.question, "<base>/<EA|SA>/Q<current child frame - 1>.mp3");
  const incomplete = deriveFqHostUrlContract([{ relativePath: "scripts/frame_35/DoAction.as", text: source.replace("/SA/", "/XX/") }]);
  assert.equal(incomplete.verified, false);
});

test("source-derived FQ matrix disposes 310 paths without promoting candidates to cues", () => {
  const baseDirectory = `${originalRoot}/HELP_COURSES/ELMGR3/L6/FQ`;
  const questionLabels = Array.from({ length: 31 }, (_, index) => `Q${index + 1}`);
  const expectedFiles = [];
  for (const directory of ["EA", "SA"]) {
    for (let questionNumber = 1; questionNumber <= 31; questionNumber += 1) {
      expectedFiles.push(`${baseDirectory}/${directory}/Q${questionNumber}.mp3`);
      for (const option of ["A", "B", "C", "D"]) expectedFiles.push(`${baseDirectory}/${directory}/Q${questionNumber}${option}.mp3`);
    }
  }
  const presentFiles = expectedFiles.slice(0, 128);
  const anomalyFile = `${baseDirectory}/EA/Q20B_.mp3`;
  const groupCandidates = [...presentFiles, anomalyFile].map((sourceFile) => ({
    sourceFile,
    catalogSha256: "a".repeat(64),
    observedSha256: "a".repeat(64),
    hashMatchesCatalog: true,
    bytes: 1234,
    probe: { durationMs: 250, codecName: "mp3", channels: 1, sampleRateHz: 22050 },
  }));
  const archiveFiles = groupCandidates.map(({ sourceFile, observedSha256, bytes }) => ({
    path: sourceFile.slice(`${originalRoot}/`.length),
    sha256: observedSha256,
    bytes,
  }));
  const matrix = deriveFqAudioUrlMatrix({
    animationId: SOURCE_DERIVED_FQ_AUDIO_PILOT_ID,
    baseDirectory,
    questionLabels,
    groupCandidates,
    archiveFiles,
  });
  assert.equal(matrix.expectedPathCount, 310);
  assert.equal(matrix.exactPathPresentCount, 128);
  assert.equal(matrix.missingSourceCount, 182);
  assert.equal(matrix.anomalyCount, 1);
  assert.equal(matrix.anomalies[0].sourceFile, anomalyFile);
  assert.equal(matrix.anomalies[0].cuePromoted, false);
  assert.equal(matrix.expectedPaths.every(({ cuePromoted }) => cuePromoted === false), true);
  assert.equal(matrix.expectedPaths.filter(({ status }) => status === "exact-path-present-candidate-not-promoted").length, 128);
  assert.equal(matrix.expectedPaths.filter(({ status }) => status === "missing-source").length, 182);
  assert.throws(() => deriveFqAudioUrlMatrix({
    animationId: SOURCE_DERIVED_FQ_AUDIO_PILOT_ID,
    baseDirectory,
    questionLabels: questionLabels.slice(0, 30),
    groupCandidates,
    archiveFiles,
  }), /not exactly Q1\.\.Q31/);
});

test("directory language routing remains evidence-led", () => {
  for (const [sourcePath, expected] of [
    ["HELP_FORMULAS/ELEMENTARY/EAD/x.mp3", "en"],
    ["HELP_FORMULAS/ELEMENTARY/SAD/x.mp3", "es"],
    ["HELP_COURSES/ELMGR3/L1/EA/Q1.mp3", "en"],
    ["HELP_COURSES/ELMGR3/L1/SA/L1IN01.mp3", "es"],
  ]) {
    const assessment = classifyAudioLanguage(sourcePath);
    assert.equal(assessment.language, expected);
    assert.equal(assessment.routingLanguage, expected);
    assert.equal(assessment.classificationScope, "legacy-host-routing-only");
    assert.equal(assessment.spokenLanguage, null);
    assert.equal(assessment.spokenLanguageEstablished, false);
  }
  const unresolved = classifyAudioLanguage(
    "HELP_COURSES/ELMGR3/L1/misc.mp3",
  );
  assert.equal(unresolved.language, "und");
  assert.equal(unresolved.routingLanguage, null);
  assert.equal(unresolved.classificationScope, "unresolved");
  assert.equal(unresolved.spokenLanguage, null);
  assert.equal(unresolved.spokenLanguageEstablished, false);
});

test("mixed classified external plus unresolved embedded languages converge after union adoption", () => {
  const exactExternal = [{languageAssessment: {language: "es"}}];
  const embedded = {defineSounds: [], soundStreams: [{durationMs: 100}]};
  const current = manifestAudioFollowUp({audio: {required: true, languages: ["es", "und"]}}, exactExternal, [], embedded);
  assert.equal(current.some((finding) => finding.includes("omits structurally classified")), false);
  const stale = manifestAudioFollowUp({audio: {required: true, languages: ["und"]}}, exactExternal, [], embedded);
  assert.equal(stale.some((finding) => finding.includes("omits structurally classified exact external language(s): es")), true);
});

test("audio inventory start semantics never invent a root frame", () => {
  const hostEvidence = {
    conventions: {
      ...verifiedHostConventions,
      finalQuiz: { verified: true },
    },
  };
  const formulaManifest = {
    classification: { collection: "formula" },
    source: { swf: "formula.swf", swfSha256: "a".repeat(64) },
  };
  const external = {
    sourceFile: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/EAD/test.mp3",
    observedSha256: "b".repeat(64),
    languageAssessment: { language: "en", evidence: "fixture" },
    probe: { durationMs: 1000, codecName: "mp3", channels: 1, sampleRateHz: 44100, tool: "ffprobe fixture" },
  };
  assert.equal(externalAudioStartSemantics(external, formulaManifest, hostEvidence), "host-user-activated");
  const externalRow = externalInventoryRows([external], formulaManifest, hostEvidence)[0];
  assert.equal(externalRow.start_semantics, "host-user-activated");
  assert.equal(externalRow.start_frame, "");
  assert.equal(externalRow.start_frame_domain_id, "");

  const embeddedRows = embeddedInventoryRows(formulaManifest, {
    defineSounds: [
      { characterId: 7, durationMs: 100, samples: 4410, sampleRateHz: 44100, channels: 1, format: "mp3", linkage: "voice" },
      { characterId: 8, durationMs: 100, samples: 4410, sampleRateHz: 44100, channels: 1, format: "mp3", linkage: null },
    ],
    startSounds: [
      { characterId: 7, stop: false, context: { kind: "root" }, localFrame: 3 },
    ],
    soundStreams: [
      { streamIndex: 1, durationMs: 200, context: { kind: "root", characterId: null }, contextLabel: "root", headFrame: 1, firstBlockFrame: 2, blockCount: 2, durationBasis: "fixture", format: "mp3", channels: 1, sampleRateHz: 22050 },
      { streamIndex: 2, durationMs: 200, context: { kind: "sprite", characterId: 9 }, contextLabel: "sprite:9", headFrame: 1, firstBlockFrame: 1, blockCount: 2, durationBasis: "fixture", format: "mp3", channels: 1, sampleRateHz: 22050 },
    ],
  });
  assert.deepEqual(embeddedRows.map(({ cue_id, start_frame, start_frame_domain_id, start_semantics }) => ({ cue_id, start_frame, start_frame_domain_id, start_semantics })), [
    { cue_id: "embedded-define-sound-0007", start_frame: 3, start_frame_domain_id: "root", start_semantics: "timeline-frame" },
    { cue_id: "embedded-define-sound-0008", start_frame: "", start_frame_domain_id: "", start_semantics: "interaction-state" },
    { cue_id: "embedded-stream-0001", start_frame: 2, start_frame_domain_id: "root", start_semantics: "timeline-frame" },
    { cue_id: "embedded-stream-0002", start_frame: "", start_frame_domain_id: "", start_semantics: "interaction-state" },
  ]);
});

test("strict no-audio acceptance is animation-specific and requires every negative proof", () => {
  const completeFacts = {
    sourceSwfHashMatches: true,
    swfAudioTagsAbsent: true,
    parsedAudioStructuresAbsent: true,
    actionScriptAudioOperationsAbsent: true,
    catalogAudioAssociationsAbsent: true,
    basenameMp3Absent: true,
    keytermXmlPlacementAbsent: true,
    catalogPlacementUnreferenced: true,
  };
  assert.equal(evaluateStrictNoAudioFacts("keyterm-elementary-computeghgh", completeFacts).decision, "accepted-not-required");
  assert.equal(evaluateStrictNoAudioFacts("course-g03-l08-re-001", completeFacts).decision, "accepted-not-required");
  assert.equal(evaluateStrictNoAudioFacts("keyterm-elementary-computeghgh", { ...completeFacts, basenameMp3Absent: false }).decision, "pending");
  assert.equal(evaluateStrictNoAudioFacts("course-g03-l08-re-001", { ...completeFacts, catalogPlacementUnreferenced: false }).decision, "pending");
});

test("key-term Spanish-missing requirement needs an exact English track", () => {
  const manifest = {
    localization: { bilingualRequired: true },
    classification: { collection: "keyterm" },
  };
  const withoutExactAudio = acceptanceRequirements({
    manifest,
    exactExternal: [],
    groupExternal: [],
    embedded: emptyEmbeddedAudio,
    scriptOperations: [],
    hostEvidence: { conventions: verifiedHostConventions },
  });
  assert.equal(withoutExactAudio.some((requirement) => requirement.includes("SAD counterpart")), false);
  assert.match(withoutExactAudio[0], /No audio tags/);

  const withEnglishAudio = acceptanceRequirements({
    manifest,
    exactExternal: [{ languageAssessment: { language: "en" } }],
    groupExternal: [],
    embedded: emptyEmbeddedAudio,
    scriptOperations: [],
    hostEvidence: { conventions: verifiedHostConventions },
  });
  assert.equal(withEnglishAudio.some((requirement) => requirement.includes("SAD counterpart")), true);
});

test("script audit preserves location, local frame, operation and unresolved expression", () => {
  const result = parseScriptAudioOperations(`===== DefineSprite_9/frame_2/DoAction.as =====
gSound.attachSound("S0");
gSound.start(0, 2);

===== DefineButton2_4/BUTTONCONDACTION on(release).as =====
gSound.loadSound(base + "/SA/" + name + ".mp3", false);
gSound.stop();
`);
  assert.deepEqual(result.map(({ operation, localFrame, literal }) => ({ operation, localFrame, literal })), [
    { operation: "attachSound", localFrame: 2, literal: "S0" },
    { operation: "start", localFrame: 2, literal: null },
    { operation: "loadSound", localFrame: null, literal: null },
    { operation: "stop", localFrame: null, literal: null },
  ]);
  assert.match(result[2].cueFrameAuthority, /runtime invocation/);
});

test("swfmill audio parser records DefineSound linkage and exact MP3 stream samples", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "audio-audit-test-"));
  try {
    const block = (samples, seek = 0) => {
      const bytes = Buffer.alloc(8);
      bytes.writeUInt16LE(samples, 0);
      bytes.writeInt16LE(seek, 2);
      bytes.writeUInt32LE(0xfffb0000, 4);
      return bytes.toString("base64");
    };
    const xml = `<?xml version="1.0"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="2">
    <tags>
      <DefineSound objectID="1" format="2" rate="3" is16bit="1" stereo="0" samples="44100">
        <data><data>AA==</data></data>
      </DefineSound>
      <Export><symbols><Symbol objectID="1" name="voice"/></symbols></Export>
      <DefineSprite objectID="9" frames="2">
        <tags>
          <SoundStreamHead playbackRate="3" playbackSize="1" playbackStereo="0" compression="2" soundRate="3" soundSize="1" soundStereo="0" sampleSize="1837"/>
          <SoundStreamBlock>
            <data>${block(1152, -5)}</data>
          </SoundStreamBlock>
          <ShowFrame/>
          <SoundStreamBlock>
            <data>${block(2304, 3)}</data>
          </SoundStreamBlock>
          <ShowFrame/>
        </tags>
      </DefineSprite>
      <StartSound objectID="1">
        <sound><SoundInfo syncStop="0" syncNoMultiple="1" loopCount="3"/></sound>
      </StartSound>
      <ShowFrame/>
    </tags>
  </Header>
</swf>`;
    const filePath = path.join(workspace, "movie.xml.gz");
    await writeFile(filePath, gzipSync(xml));
    const audit = await parseSwfmillAudio(filePath);
    assert.equal(audit.defineSounds[0].linkage, "voice");
    assert.equal(audit.defineSounds[0].durationMs, 1000);
    assert.equal(audit.soundStreams[0].contextLabel, "sprite:9");
    assert.equal(audit.soundStreams[0].firstBlockFrame, 1);
    assert.equal(audit.soundStreams[0].lastBlockFrame, 2);
    assert.equal(audit.soundStreams[0].totalDecodedSamples, 3456);
    assert.equal(audit.soundStreams[0].durationMs, 78);
    assert.equal(audit.soundStreams[0].seekSamplesMin, -5);
    assert.equal(audit.soundStreams[0].seekSamplesMax, 3);
    assert.equal(audit.startSounds[0].linkage, "voice");
    assert.equal(audit.startSounds[0].syncMode, "event-no-multiple");
    assert.equal(audit.startSounds[0].loopCount, 3);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
