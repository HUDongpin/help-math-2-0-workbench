import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  extractActionScriptFunction,
  parseArguments,
  stripMp3ContainerTags,
} from "./audit-acute-angle-spanish-audio-forensics.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const reportRelative = "migrations/keyterm-elementary-acute-angle/audit/acute-angle-spanish-audio-source-forensics.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function assertBinding(binding, label = binding.path) {
  const bytes = await readFile(path.join(root, binding.path));
  assert.equal(bytes.length, binding.bytes, `${label} byte count`);
  assert.equal(sha256(bytes), binding.sha256, `${label} SHA-256`);
}

test("acute-angle audio forensics argument parser exposes generate and check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, root});
  assert.deepEqual(parseArguments(["--check", "--root", "/tmp/project"]), {
    check: true,
    root: "/tmp/project",
  });
  assert.deepEqual(parseArguments(["--help"]), {check: false, root, help: true});
  assert.throws(() => parseArguments(["--root"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("MP3 payload hashing strips only bounded ID3v2 and ID3v1 envelopes", () => {
  const id3v2Header = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03]);
  const id3v2Body = Buffer.from("abc");
  const payload = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x01, 0x02, 0x03]);
  const id3v1 = Buffer.concat([Buffer.from("TAG"), Buffer.alloc(125, 0x20)]);
  const stripped = stripMp3ContainerTags(Buffer.concat([id3v2Header, id3v2Body, payload, id3v1]));
  assert.deepEqual(stripped.payload, payload);
  assert.equal(stripped.leadingId3v2Bytes, 13);
  assert.equal(stripped.trailingId3v1Bytes, 128);

  const untagged = stripMp3ContainerTags(payload);
  assert.deepEqual(untagged.payload, payload);
  assert.equal(untagged.leadingId3v2Bytes, 0);
  assert.equal(untagged.trailingId3v1Bytes, 0);

  assert.throws(() => stripMp3ContainerTags(Buffer.from([
    0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x80, 0x00, 0x00, 0x01,
  ])), /invalid ID3v2 syncsafe integer/);
});

test("ActionScript extraction keeps nested braces and excludes the next function", () => {
  const source = `
function doPlayKeyTermAudio(language) {
  // A comment containing } is not the function end.
  if (language == "English") {
    loadSound(SndKTEFName,false);
  } else {
    loadSound(SndKTSFName,false);
  }
}
function nextFunction() { return false; }
`;
  const extracted = extractActionScriptFunction(source, "doPlayKeyTermAudio");
  assert.match(extracted, /loadSound\(SndKTSFName,false\)/);
  assert.doesNotMatch(extracted, /nextFunction/);
  assert.equal(extractActionScriptFunction(source, "missing"), null);
});

test("checked report binds the XML, host, SWF, FLA, and machine evidence without acceptance effects", async () => {
  const report = await readJson(reportRelative);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.artifactType, "acute-angle-spanish-audio-source-forensics");
  assert.equal(report.animationId, "keyterm-elementary-acute-angle");
  assert.equal(report.scope, "deterministic-source-path-provenance-and-full-archive-mp3-payload-forensics");
  assert.equal(report.sourceMutationPerformed, false);
  assert.equal(report.migrationStatusUnchanged, true);
  assert.deepEqual(report.acceptanceBoundary, {
    audioAcceptanceChanged: false,
    humanReviewRecorded: false,
    listeningEvidenceRecorded: false,
    ownerAcceptanceRecorded: false,
    sourceSubstitutionAuthorized: false,
    strictAcceptanceEffect: false,
  });

  await assertBinding(report.generator, "generator");
  assert.equal(report.generator.path, "scripts/audit-acute-angle-spanish-audio-forensics.mjs");
  for (const binding of report.xmlReferences) await assertBinding(binding, binding.path);
  assert.deepEqual(report.xmlReferences.map(({matches}) => matches.map(({line}) => line)), [[4], [738]]);
  assert.ok(report.xmlReferences.every(({matches}) => matches[0].text.includes('ExFileName="Acute_angle.swf"')));

  await assertBinding(report.hostContract, "host ActionScript");
  assert.equal(report.hostContract.sha256, "da2e398f3f882474ebd3d59ae0670c5398beb3b67911676f43089ae545106ab8");
  assert.equal(report.hostContract.derivedSpanishPath,
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3");
  assert.equal(report.hostContract.spanishPathConstructions.length, 3);
  assert.equal(report.hostContract.playerFunction.aliasOrFallbackImplemented, false);
  assert.equal(report.hostContract.playerFunction.courseSaRoutePresent, false);

  for (const binding of Object.values(report.sourceAndAudits.sources)) await assertBinding(binding);
  await assertBinding(report.sourceAndAudits.machineAudioAudit);
  await assertBinding(report.sourceAndAudits.swfMachineAudit);
  await assertBinding(report.sourceAndAudits.animateAuthoringAudit);
  assert.equal(report.sourceAndAudits.machineAudioAudit.expectedSpanishStatus, "missing-source");
  assert.equal(report.sourceAndAudits.machineAudioAudit.strictAudioAcceptance, "pending");
  assert.equal(report.sourceAndAudits.machineAudioAudit.embeddedDefineSoundCount, 0);
  assert.equal(report.sourceAndAudits.machineAudioAudit.embeddedSoundStreamCount, 0);
  assert.equal(report.sourceAndAudits.animateAuthoringAudit.recursiveLibraryTimelineAuditVerified, true);
  assert.equal(report.sourceAndAudits.animateAuthoringAudit.libraryItemCount, 4);
  assert.equal(report.sourceAndAudits.animateAuthoringAudit.soundLibraryItemCount, 0);
  assert.equal(report.sourceAndAudits.animateAuthoringAudit.nonemptySoundPlacementCount, 0);
});

test("checked report proves exhaustive MP3 path/file/payload coverage and preserves the missing-source boundary", async () => {
  const report = await readJson(reportRelative);
  const inventory = report.mp3Inventory;
  await assertBinding(inventory.catalog, "source catalog");
  assert.equal(inventory.catalogSummary.fileCount, 7919);
  assert.equal(inventory.catalogSummary.totalBytes, 2779928841);
  assert.deepEqual(inventory.scanCoverage, {
    actualArchiveMp3Count: 4565,
    catalogMp3Count: 4565,
    everyFileByteCountAndSha256MatchesCatalog: true,
    pathSetsMatchExactly: true,
  });
  assert.equal(inventory.mp3FileCount, 4565);
  assert.equal(inventory.uniqueFileSha256Count, 4344);
  assert.equal(inventory.uniquePayloadSha256Count, 4343);
  assert.equal(inventory.payloadProjection.sha256,
    "eaad934cd8cc9476456b6633cdea4addafd8935800e4f4421f3772f977f5f3b0");
  assert.equal(inventory.expectedSpanishPath.exists, false);
  assert.equal(inventory.expectedSpanishPath.authoritativeSha256Known, false);
  assert.equal(inventory.expectedSpanishPath.payloadComparisonPossible, false);
  assert.equal(report.keytermSpanishDirectory.entryCount, 0);
  assert.equal(report.keytermSpanishDirectory.fileCount, 0);

  assert.equal(inventory.sameBasenameMatches.length, 1);
  assert.equal(inventory.filenameTermMatches.length, 1);
  assert.equal(inventory.sameBasenameMatches[0].path,
    "HELP_KEYTERMS/KT/ELEMENTARY/EAD/acute_angle.mp3");
  assert.equal(inventory.englishCounterpart.fileSha256,
    "8b150d56158690d70c8f9891a72c13fdb62719b973bf970dcdeadaed612dc97f");
  assert.equal(inventory.englishCounterpart.payloadSha256,
    "3d46ab9a12ea1c7298b4ca3c43c5793d7bb7445134b98c0942b1d07f31942ceb");
  assert.equal(inventory.englishCounterpart.leadingId3v2Bytes, 83);
  assert.equal(inventory.englishCounterpart.payloadCopyCount, 1);

  assert.deepEqual(report.conclusion, {
    authoritativeSourceRecovered: false,
    authoritativeTargetSha256Known: false,
    blocker: "The legacy key-term host requires SAD/acute_angle.mp3, but the preserved SAD directory is empty and no provenance-backed alias or embedded copy exists.",
    exactAliasRecovered: false,
    expectedSource: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3",
    semanticCandidatePromoted: false,
    status: "missing-source",
    strictBlocker: true,
  });
});

test("semantic course candidates remain unique, course-routed, and unpromoted", async () => {
  const report = await readJson(reportRelative);
  const candidates = report.semanticCourseCandidates;
  await assertBinding(candidates.catalog, "animation catalog");
  assert.equal(candidates.placementCount, 6);
  assert.equal(candidates.audioCandidateCount, 5);
  assert.deepEqual(candidates.placements.map(({animationId}) => animationId), [
    "course-g03-l09-vb-005",
    "course-g04-l12-vb-005",
    "course-g05-l13-vb-003",
    "course-g05-l13-vb-004",
    "course-g05-l13-vb-005",
    "course-g05-l13-vb-006",
  ]);
  assert.ok(candidates.placements.every(({promotedToKeytermCue}) => promotedToKeytermCue === false));
  const audio = candidates.placements.flatMap(({exactCourseAudioCandidates}) => exactCourseAudioCandidates);
  assert.equal(audio.length, 5);
  assert.ok(audio.every((candidate) => candidate.authorityStatus === "semantic-course-candidate-only"));
  assert.ok(audio.every((candidate) => candidate.promotedToKeytermCue === false));
  assert.ok(audio.every((candidate) => candidate.structuralLanguage === "es"));
  assert.ok(audio.every((candidate) => candidate.byteCopyCount === 1 && candidate.payloadCopyCount === 1));
  assert.deepEqual(audio.map(({fileSha256}) => fileSha256), [
    "87aed83644130421d4ea0fc7071d6a70006ef2af978712e2b261a3509bac4213",
    "89959641f7c5896024892bfb0f887ba415cfabe868b3165cc2f663ef18ec73fe",
    "9b6c5cfcf046bf645ad3def8ea7a8cc11e0f52d1f36eec1235714ac21ba2616c",
    "fbe11921bd8871c128d5669672754a51829174f64adb740c9cf47b5fb8cb14de",
    "3cd3c8dd5f6f8447c0fdebfd466c8122b788a8db759ac4497c6dfe008d2a89f7",
  ]);
  assert.match(candidates.conclusion, /None has a legacy key-term SAD path/);
});
