import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L4_RELEASE_ID,
  buildG5L4ScopeFromCatalogs,
} from "./materialize-g5-l4-source-workspaces.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function inputs() {
  const [lessons, animations, sourceFiles, audioGroups, courseXmlText, mainScriptText] = await Promise.all([
    readFile(path.join(root, "catalog/lessons.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/animations.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/source-files.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "catalog/audio-groups.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml"), "utf8"),
    readFile(path.join(root, "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/AS/MainScript_New.as"), "utf8"),
  ]);
  return {lessonsCatalog: lessons, animationsCatalog: animations, sourceFilesCatalog: sourceFiles, audioGroupsCatalog: audioGroups, courseXmlText, mainScriptText};
}

test("freezes the exact G5 L4 XML order, shell, source models, shards, and exclusions", async () => {
  const scope = buildG5L4ScopeFromCatalogs(await inputs());
  assert.equal(scope.releaseId, G5_L4_RELEASE_ID);
  assert.deepEqual(scope.summary, {
    pageCount: 54,
    shellCount: 1,
    memberCount: 55,
    pairedFlaSwfCount: 44,
    swfOnlyCount: 11,
    exclusionCount: 10,
    audioCandidateCount: 135,
    exactPageAudioCandidateCount: 50,
    groupedFqAudioCandidateCount: 83,
    unmappedAudioCandidateCount: 2,
    missingSpanishPageTitleCount: 16,
    missingSpanishTitleIncludingShellCount: 17,
    draftWorkspaceTargetCount: 55,
    strictCompleteCount: 0,
    publishedCount: 0,
  });
  assert.deepEqual(scope.members.map(({ordinal}) => ordinal), Array.from({length: 55}, (_, index) => index + 1));
  assert.equal(scope.members[0].animationId, "course-g05-l04-ir-001-a662633d");
  assert.equal(scope.members[54].animationId, "shell-course-g05-l04-index-local");
  assert.deepEqual(scope.shards.map(({shardId, memberOrdinals}) => [shardId, memberOrdinals.length]), [
    ["g05-l04-host-language", 15],
    ["g05-l04-instruction", 21],
    ["g05-l04-practice-assessment", 19],
  ]);
  assert.deepEqual(scope.exclusions.map(({animationId}) => animationId), [
    "course-g05-l04-fq-002-review",
    "course-g05-l04-fq-003-review",
    "course-g05-l04-gs-001",
    "course-g05-l04-in-001",
    "course-g05-l04-ir-001-1f66f725",
    "course-g05-l04-re-001",
    "course-g05-l04-rw-001",
    "course-g05-l04-ti-001",
    "course-g05-l04-ts-001",
    "course-g05-l04-vb-001",
  ]);
  assert.ok(scope.acceptanceEffects.strictComplete === false && scope.acceptanceEffects.published === false);
});

test("keeps keyterm and audio dispositions fail-closed without inferring language or listening", async () => {
  const scope = buildG5L4ScopeFromCatalogs(await inputs());
  const keyterm = scope.conflicts.find(({conflictId}) => conflictId === "missing-lesson-keyterm-localization-xml");
  assert.equal(keyterm.status, "missing");
  assert.equal(keyterm.strictBlocker, true);
  assert.deepEqual(scope.audioCandidateDisposition.unmappedCandidates.map(({path: sourcePath}) => sourcePath), [
    "HELP_COURSES/ELMGR5/L4/SA/GR5_L4_TS_Q1_SpA.mp3",
    "HELP_COURSES/ELMGR5/L4/SA/GR5_L4_TS_Q1_SpC.mp3",
  ]);
  assert.ok(scope.audioCandidateDisposition.candidates.every(({catalogLanguage}) => catalogLanguage === "unresolved"));
  assert.equal(scope.audioCandidateDisposition.machineFactsEstablishAudibleCorrectness, false);
  assert.equal(scope.audioCandidateDisposition.audioAccepted, false);
});
