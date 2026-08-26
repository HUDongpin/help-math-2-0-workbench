import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L5_RELEASE_ID,
  buildG5L5ScopeFromCatalogs,
} from "./materialize-g5-l5-source-workspaces.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(
  root,
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5",
);

async function inputs() {
  const [
    releases,
    lessons,
    animations,
    sourceFiles,
    audioGroups,
    courseXmlText,
    mainScriptText,
  ] = await Promise.all([
    readFile(path.join(root, "catalog/lesson-releases.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/lessons.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/animations.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/source-files.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/audio-groups.json"), "utf8").then(JSON.parse),
    readFile(path.join(sourceRoot, "index.xml"), "utf8"),
    readFile(path.join(sourceRoot, "AS/MainScript_New.as"), "utf8"),
  ]);
  return {
    releasesCatalog: releases,
    lessonsCatalog: lessons,
    animationsCatalog: animations,
    sourceFilesCatalog: sourceFiles,
    audioGroupsCatalog: audioGroups,
    courseXmlText,
    mainScriptText,
  };
}

test("freezes the exact G5 L5 XML order, shell, source models, shards, and exclusions", async () => {
  const scope = buildG5L5ScopeFromCatalogs(await inputs());
  assert.equal(scope.releaseId, G5_L5_RELEASE_ID);
  assert.deepEqual(scope.summary, {
    pageCount: 56,
    shellCount: 1,
    memberCount: 57,
    pairedFlaSwfCount: 49,
    swfOnlyCount: 8,
    exclusionCount: 11,
    audioCandidateCount: 182,
    exactPageAudioCandidateCount: 52,
    groupedFqAudioCandidateCount: 128,
    unmappedAudioCandidateCount: 2,
    missingSpanishPageTitleCount: 17,
    missingSpanishTitleIncludingShellCount: 18,
    draftWorkspaceTargetCount: 57,
    strictCompleteCount: 0,
    publishedCount: 0,
  });
  assert.deepEqual(
    scope.members.map(({ordinal}) => ordinal),
    Array.from({length: 57}, (_, index) => index + 1),
  );
  assert.deepEqual(
    scope.members.slice(0, 56).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 56}, (_, index) => index + 1),
  );
  assert.equal(scope.members[0].animationId, "course-g05-l05-ir-001-664ab764");
  assert.equal(
    scope.members[0].source.swf.path,
    "HELP_COURSES/ELMGR5/L5/IR/L5RW01.swf",
  );
  assert.equal(scope.members[56].animationId, "shell-course-g05-l05-index-local");
  assert.equal(
    scope.members[56].assetId,
    "swf-5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66",
  );
  assert.deepEqual(
    scope.shards.map(({shardId, memberOrdinals}) => [shardId, memberOrdinals.length]),
    [
      ["g05-l05-host-language", 18],
      ["g05-l05-instruction", 19],
      ["g05-l05-practice-assessment", 20],
    ],
  );
  assert.deepEqual(scope.exclusions.map(({animationId}) => animationId), [
    "course-g05-l05-fq-002-review",
    "course-g05-l05-fq-003-review",
    "course-g05-l05-gs-001",
    "course-g05-l05-in-001",
    "course-g05-l05-ir-001-3359e449",
    "course-g05-l05-re-001",
    "course-g05-l05-rw-001",
    "course-g05-l05-ti-001",
    "course-g05-l05-ts-001",
    "course-g05-l05-ts-009",
    "course-g05-l05-vb-001",
  ]);
  assert.ok(scope.members.every(({source}) =>
    source.swfMetadata.stage.width === 800 &&
    source.swfMetadata.stage.height === 600 &&
    source.swfMetadata.fps === 12));
  assert.equal(scope.lesson.catalogRootFrameCount, 610);
  assert.equal(scope.acceptanceEffects.strictComplete, false);
  assert.equal(scope.acceptanceEffects.published, false);
});

test("keeps G5 L5 source-name, keyterm, and audio evidence boundaries explicit and fail-closed", async () => {
  const scope = buildG5L5ScopeFromCatalogs(await inputs());
  const sourceName = scope.conflicts.find(
    ({conflictId}) => conflictId ===
      "active-ir-source-filename-and-commented-duplicate-placement",
  );
  assert.equal(sourceName.status, "source-authored-and-frozen");
  assert.equal(sourceName.strictBlocker, false);
  assert.equal(sourceName.facts.activePath, "HELP_COURSES/ELMGR5/L5/IR/L5RW01.swf");
  assert.equal(sourceName.facts.commentedDuplicatePath, "HELP_COURSES/ELMGR5/L5/RW/L5RW01.swf");
  assert.equal(sourceName.facts.activeAssetId, sourceName.facts.commentedDuplicateAssetId);

  const keyterm = scope.conflicts.find(
    ({conflictId}) => conflictId === "missing-lesson-keyterm-localization-xml",
  );
  assert.equal(keyterm.status, "missing");
  assert.equal(keyterm.strictBlocker, true);
  assert.deepEqual(
    scope.audioCandidateDisposition.unmappedCandidates.map(({path: sourcePath}) => sourcePath),
    [
      "HELP_COURSES/ELMGR5/L5/SA/GR5_L5_TS_Q1_SpC.mp3",
      "HELP_COURSES/ELMGR5/L5/SA/L5TS09.mp3",
    ],
  );
  assert.equal(scope.audioCandidateDisposition.machineFactsEstablishAudibleCorrectness, false);
  assert.equal(scope.audioCandidateDisposition.audioAccepted, false);
});

test("fails closed when the formal G5 L5 release loses one of its 57 members", async () => {
  const documents = await inputs();
  const tampered = structuredClone(documents);
  const release = tampered.releasesCatalog.releases.find(
    ({releaseId}) => releaseId === G5_L5_RELEASE_ID,
  );
  release.members.pop();
  assert.throws(
    () => buildG5L5ScopeFromCatalogs(tampered),
    /member set is not 57/,
  );
});
