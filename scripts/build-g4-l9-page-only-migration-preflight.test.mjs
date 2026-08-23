import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  OUTPUT_PATHS,
  REVIEWED_ALLOWLIST,
  parseArguments,
  renderMarkdown,
  sha256Nul,
  stableJson,
  utf8Sorted,
  validateArtifact,
} from "./build-g4-l9-page-only-migration-preflight.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const jsonPath = path.join(projectRoot, OUTPUT_PATHS.json);
const markdownPath = path.join(projectRoot, OUTPUT_PATHS.markdown);

const artifactPromise = readFile(jsonPath, "utf8").then((text) => ({
  text,
  artifact: JSON.parse(text),
}));
const markdownPromise = readFile(markdownPath, "utf8");

test("binds page-only schema 2 and the unchanged 1,751/426/425/8 baseline", async () => {
  const {artifact} = await artifactPromise;
  assert.equal(validateArtifact(artifact), true);
  assert.equal(artifact.scope.pageOnlySchemaVersion, 2);
  assert.equal(artifact.scope.courseShellCount, 0);
  assert.equal(artifact.scope.legacyFlashCourseShells, "completely-excluded");
  assert.deepEqual(artifact.beforeCounts.global, {
    lessons: 29,
    occurrences: 1_751,
    gradeOccurrences: {3: 546, 4: 645, 5: 560},
    registeredOccurrences: 426,
    registeredUniqueRenderers: 425,
    registeredLessons: 8,
    remainingOccurrences: 1_325,
    candidateOnlyOccurrences: 5,
  });
  assert.deepEqual(artifact.beforeCounts.g4l9, {
    occurrences: 43,
    registeredOccurrences: 0,
    candidateOnlyOccurrences: 1,
    myLessonsAdmitted: 0,
    persistedComplexityUnclassified: 43,
    persistedImplementationLaneUnclassified: 43,
  });
  assert.deepEqual(artifact.afterCounts, artifact.beforeCounts);
});

test("retains all 43 source-ordered occurrence identities without collapse", async () => {
  const {artifact} = await artifactPromise;
  assert.equal(artifact.occurrences.length, 43);
  assert.equal(new Set(artifact.occurrences.map(({placementId}) => placementId)).size,
    43);
  assert.equal(new Set(artifact.occurrences.map(({assetId}) => assetId)).size, 43);
  artifact.occurrences.forEach((row, index) => {
    const sourceOccurrence = index + 1;
    assert.equal(row.sourceOccurrence, sourceOccurrence);
    assert.equal(row.catalogOccurrenceOrdinal, 982 + sourceOccurrence);
    assert.equal(row.placementId,
      `g04-l09-placement-${String(sourceOccurrence).padStart(3, "0")}`);
    assert.equal(row.assetId, `swf-${row.source.swfSha256}`);
  });
  assert.deepEqual(artifact.scope.lesson.sectionCounts,
    {IR: 1, RW: 3, VB: 10, IN: 12, TI: 6, GS: 1, TS: 7, FQ: 3});
  assert.deepEqual(artifact.identityHashes, {
    placementIdOrderedNulSha256:
      "5637371fd5d1457901f30735da0d52e39160258559e3ebc3a732370a45236ea8",
    expectedSwfPathOrderedNulSha256:
      "7b9e6ba515d36895dd60c8cb6e8a770e04747c56c6b9a17b74787303fae4b4bc",
    assetIdOrderedNulSha256:
      "832c98408b2ba69894ee966a4290ec1d5d77f57866381d7e58cb5c7a74d68082",
    canonicalRowProjectionSha256:
      "313e6e9b9fb30facd55ecddf74eb039ab8cdb4595f7bd7b145dda67a4f1aa0db",
  });
});

test("binds exact physical source custody and fails all source drift counters closed", async () => {
  const {artifact} = await artifactPromise;
  assert.equal(artifact.sourceCustody.sourceXml.path,
    "HELP_COURSES/ELMGR4/L9/index.xml");
  assert.equal(artifact.sourceCustody.sourceXml.sha256,
    "d1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4");
  assert.equal(artifact.sourceCustody.sourceXml.exactSourceOrderMatch, true);
  assert.equal(artifact.sourceCustody.swfCount, 43);
  assert.equal(artifact.sourceCustody.pairedFlaCount, 25);
  assert.equal(artifact.sourceCustody.swfOnlyCount, 18);
  assert.equal(artifact.sourceCustody.missing, 0);
  assert.equal(artifact.sourceCustody.mismatch, 0);
  assert.equal(artifact.sourceCustody.writable, 0);
  assert.equal(artifact.sourceCustody.physicalFiles.length, 69);
  assert.equal(artifact.sourceCustody.physicalFiles.every(
    ({writable}) => writable === false), true);
});

test("partitions 43 pages into 14 unique source families", async () => {
  const {artifact} = await artifactPromise;
  assert.equal(artifact.sourceFamilies.length, 14);
  const pages = artifact.sourceFamilies.flatMap(({pages: familyPages}) =>
    familyPages);
  assert.equal(pages.length, 43);
  assert.equal(new Set(pages).size, 43);
  assert.deepEqual([...pages].sort((left, right) => left - right),
    Array.from({length: 43}, (_, index) => index + 1));
  assert.equal(artifact.occurrences.every(({planning}) =>
    /^F\d{2}$/u.test(planning.familyId)
    && planning.evidence.sourceSha256.length === 64
    && planning.evidence.auditSummarySha256.length === 64
    && planning.reason.length > 0), true);
});

test("keeps the exact complexity and implementation-lane arithmetic", async () => {
  const {artifact} = await artifactPromise;
  assert.deepEqual(artifact.complexityClassification.counts, {
    low: 2,
    "interactive-understood": 25,
    "behavior-heavy": 16,
  });
  assert.equal(Object.values(artifact.complexityClassification.counts)
    .reduce((sum, value) => sum + value, 0), 43);
  assert.deepEqual(artifact.implementationLanes.counts, {
    factory: 27,
    "advanced-manual": 16,
  });
  assert.equal(Object.values(artifact.implementationLanes.counts)
    .reduce((sum, value) => sum + value, 0), 43);
  assert.equal(artifact.implementationLanes
    .factoryRequiresRepresentativeSliceBeforeScaleOut, true);
  assert.equal(artifact.implementationLanes.generatedOutputMayBeHandEdited,
    false);
});

test("selects one exact representative page from every family", async () => {
  const {artifact} = await artifactPromise;
  const slice = artifact.p4RepresentativeSlice;
  assert.deepEqual(slice.sourceOccurrences,
    [1, 2, 12, 16, 22, 23, 24, 27, 28, 30, 33, 40, 41, 42]);
  assert.equal(slice.rows.length, 14);
  assert.equal(new Set(slice.rows.map(({familyId}) => familyId)).size, 14);
  assert.equal(slice.rows.every(({selectionReason}) => selectionReason.length > 0),
    true);
  assert.deepEqual(slice.hashes, {
    placementIdOrderedNulSha256:
      "bfec777a4a43cafc72cf4be00bbe0b73e31a0549bb189c3b75a2c6a6aedaaecb",
    assetIdOrderedNulSha256:
      "76f2d2b5143d49da55f96979de3f86a15ca9d0e28ad034d2302cde71f94891ee",
    canonicalIdentityProjectionSha256:
      "e15a6efc10f31897cf0a67e1d1776a43abf64feeb92a47c3917fc52bd837c3b5",
  });
  assert.equal(slice.state, "recommendation-only-not-created-not-started");
  assert.equal(artifact.decision.p4Created, false);
  assert.equal(artifact.decision.p4Started, false);
});

test("requires exact reuse of GS002 and records no duplicate workspace", async () => {
  const {artifact} = await artifactPromise;
  const gs = artifact.existingGs002Candidate;
  assert.equal(gs.placementId, "g04-l09-placement-033");
  assert.equal(gs.animationId, "course-g04-l09-gs-002");
  assert.equal(gs.assetId,
    "swf-41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15");
  assert.equal(gs.state, "runnable-unregistered-candidate");
  assert.equal(gs.exactReuseOnly, true);
  assert.equal(gs.duplicateRenameRewriteOrBypassAuthorized, false);
  assert.deepEqual(gs.matchingManifestPaths,
    ["migrations/course-g04-l09-gs-002/migration.json"]);
  assert.equal(gs.prototypeRegistry.formallyRegistered, false);
  assert.equal(gs.prototypeRegistry.myLessonsAdmitted, false);
});

test("keeps legacy FQ getURL behavior inert and every acceptance gate false", async () => {
  const {artifact} = await artifactPromise;
  assert.deepEqual(artifact.legacyEndpointPolicy.affectedSourceOccurrences,
    [42, 43]);
  assert.deepEqual(artifact.legacyEndpointPolicy.observedOccurrences,
    {42: 2, 43: 1});
  assert.equal(artifact.legacyEndpointPolicy.executionPolicy,
    "inert-deny-by-default");
  assert.equal(artifact.legacyEndpointPolicy.modernAdapterAuthorized, false);
  assert.equal(artifact.legacyEndpointPolicy.legacyEndpointCalledByThisTask,
    false);
  assert.equal(artifact.legacyEndpointPolicy
    .unknownNetworkRequestExecutedByThisTask, false);
  assert.equal(Object.values(artifact.baselineAndAcceptanceGates
    .effectsOfThisP3DocumentationCommit).every((value) => value === false), true);
  assert.equal(Object.values(artifact.baselineAndAcceptanceGates.establishedCounts)
    .every((value) => value === 0), true);
  assert.equal(artifact.occurrences.every(({acceptanceEffects}) =>
    Object.values(acceptanceEffects).every((value) => value === false)), true);
  assert.equal(artifact.decision.result, "NO_GO_SCALE_OUT");
});

test("binds the exact reviewed four-path allowlist", async () => {
  const {artifact} = await artifactPromise;
  const paths = utf8Sorted(REVIEWED_ALLOWLIST);
  assert.deepEqual(artifact.reviewedChangedPathAllowlist.paths, paths);
  assert.equal(paths.length, 4);
  assert.equal(Buffer.concat(paths.map((value) =>
    Buffer.from(`${value}\0`))).length, 215);
  assert.equal(sha256Nul(paths),
    "18a5fdb3ac18ff0be96e62e1373654b84aa6ea83ea8310aa3cd0adfc518e7c54");
  assert.equal(artifact.reviewedChangedPathAllowlist.everyPathNew, true);
  assert.equal(artifact.reviewedChangedPathAllowlist
    .existingPathModificationAuthorized, false);
  assert.equal(artifact.authorityNotExercised.includes("no-fifth-path"), true);
  assert.equal(artifact.authorityNotExercised.includes("no-page-427"), true);
});

test("derives canonical JSON and Markdown byte-for-byte deterministically", async () => {
  const [{text, artifact}, markdown] = await Promise.all([
    artifactPromise,
    markdownPromise,
  ]);
  const firstJson = stableJson(artifact);
  const secondJson = stableJson(structuredClone(artifact));
  const firstMarkdown = renderMarkdown(JSON.parse(firstJson));
  const secondMarkdown = renderMarkdown(JSON.parse(secondJson));
  assert.equal(text, firstJson);
  assert.equal(firstJson, secondJson);
  assert.equal(markdown, firstMarkdown);
  assert.equal(firstMarkdown, secondMarkdown);
  assert.match(markdown,
    /^<!-- Generated by scripts\/build-g4-l9-page-only-migration-preflight\.mjs\. Do not edit\. -->/u);
  assert.match(markdown, /NO_GO_SCALE_OUT/u);
  assert.equal(createHash("sha256").update(firstJson).digest("hex").length, 64);
  assert.equal(createHash("sha256").update(firstMarkdown).digest("hex").length,
    64);
});

test("requires explicit evidence inputs and exactly one read/write mode", () => {
  assert.deepEqual(parseArguments([
    "--check",
    "--audit-summary",
    "/explicit/audit-summary.json",
    "--source-root",
    "/explicit/source-root",
  ]), {
    mode: "check",
    auditSummaryPath: "/explicit/audit-summary.json",
    sourceRoot: "/explicit/source-root",
    json: false,
    help: false,
  });
  assert.throws(() => parseArguments([]),
    /exactly one of --write or --check is required/u);
  assert.throws(() => parseArguments(["--check"]),
    /--audit-summary is required/u);
  assert.throws(() => parseArguments([
    "--check",
    "--audit-summary",
    "/audit.json",
  ]), /--source-root is required/u);
  assert.throws(() => parseArguments([
    "--write",
    "--check",
    "--audit-summary",
    "/audit.json",
    "--source-root",
    "/source",
  ]), /exactly one of --write or --check may be supplied/u);
  assert.throws(() => parseArguments(["--write-anywhere"]),
    /Unknown argument/u);
});
