import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  adoptPilotAudioScope,
  buildPilotAudioAdoption,
  parseArguments,
} from "./adopt-pilot-audio-scope.mjs";
import {embeddedInventoryRows, externalInventoryRows} from "./audit-pilot-audio.mjs";
import {writeAcceptedNoAudioEvidence} from "./test-fixtures/strict-audio-evidence.mjs";

const AUDIO_HEADERS = [
  "cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id", "start_semantics",
  "duration_ms", "format", "channels", "sample_rate_hz", "source_character_id", "notes",
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${AUDIO_HEADERS.join(",")}\n${rows.map((row) => AUDIO_HEADERS.map((field) => csvEscape(row[field])).join(",")).join("\n")}${rows.length ? "\n" : ""}`;
}

function baseManifest(id, source, sourceSha256, audio) {
  return {
    schemaVersion: 2,
    animationId: id,
    status: "preserved",
    source: {swf: source, swfSha256: sourceSha256},
    classification: {collection: id.startsWith("formula-") ? "formula" : id.startsWith("keyterm-") ? "keyterm" : id.startsWith("shell-") ? "platform-shell" : "course"},
    audio,
    acceptance: {
      engineeringReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      humanVisualReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      ownerReview: {decision: "pending", reviewer: "", reviewedAt: ""},
    },
    unrelated: {mustRemainByteSemanticallyStable: true},
  };
}

function hostScript() {
  return {
    conventions: {
      formula: {verified: true},
      keyterm: {verified: true},
      finalQuiz: {verified: true},
      courseSpanishPage: {verified: true},
    },
  };
}

function externalItem({sourceFile, bytes, language}) {
  return {
    sourceFile,
    catalogSha256: digest(bytes),
    observedSha256: digest(bytes),
    hashMatchesCatalog: true,
    languageAssessment: {language, evidence: "fixture host directory"},
    probe: {codecName: "mp3", durationMs: 1000, probeSizeBytes: bytes.length, channels: 1, sampleRateHz: 44100, tool: "ffprobe fixture"},
  };
}

function embeddedStream() {
  return {
    streamIndex: 1,
    context: {kind: "sprite", characterId: 10},
    contextLabel: "sprite:10",
    headFrame: 1,
    firstBlockFrame: 1,
    blockCount: 5,
    durationBasis: "fixture samples",
    durationMs: 500,
    format: "mp3",
    channels: 1,
    sampleRateHz: 22050,
  };
}

async function writeFixture({id, audio, exact = [], embedded = {defineSounds: [], startSounds: [], soundStreams: []}, candidates = [], missing = [], acceptedNoAudio = false, rowIds = null}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "pilot-audio-adoption-"));
  const workspace = path.join(root, "migrations", id);
  await mkdir(path.join(workspace, "audit"), {recursive: true});
  const swf = Buffer.from(`${id} source SWF fixture\n`);
  const source = `sources/${id}.swf`;
  await mkdir(path.join(root, "sources"), {recursive: true});
  await writeFile(path.join(root, source), swf);
  for (const item of exact) {
    await mkdir(path.dirname(path.join(root, item.sourceFile)), {recursive: true});
    await writeFile(path.join(root, item.sourceFile), item.bytes);
  }
  const manifest = baseManifest(id, source, digest(swf), audio);
  const machineExact = exact.map(({sourceFile, bytes, language}) => externalItem({sourceFile, bytes, language}));
  let rows = [
    ...externalInventoryRows(machineExact, manifest, hostScript()),
    ...embeddedInventoryRows(manifest, embedded),
  ];
  if (rowIds) rows = rows.map((row, index) => ({...row, cue_id: rowIds[index]}));
  await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(workspace, "audio-inventory.csv"), csv(rows));
  if (acceptedNoAudio) await writeAcceptedNoAudioEvidence(workspace, manifest);
  else {
    const audit = {
      schemaVersion: 2,
      animationId: id,
      source: {swf: source, expectedSha256: digest(swf), observedSha256: digest(swf), hashMatches: true},
      authority: {hostScript: hostScript()},
      externalAudio: {
        exactAssociations: machineExact,
        lessonGroupCandidates: candidates,
        expectedButMissing: missing,
        missingExpectedCount: missing.length,
      },
      embeddedAudio: embedded,
      actionScriptAudioOperations: [],
      inventory: {file: "audio-inventory.csv", rowCount: rows.length},
      acceptance: {structurallyAudited: true, strictAudioAcceptance: "pending", manifestFollowUp: []},
    };
    await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify(audit, null, 2)}\n`);
  }
  return {root, workspace, manifest, sourcePath: path.join(root, source), rows};
}

test("adopts mixed exact-es plus embedded-und scope and changes only allowed audio technical fields", async () => {
  const id = "course-g03-l01-ts-008";
  const externalBytes = Buffer.from("Spanish MP3 fixture bytes\n");
  const fixture = await writeFixture({
    id,
    audio: {required: true, reasonNotRequired: "", languages: ["und"], inventoryFile: "audio-inventory.csv", cues: [], catalogExactAssociations: [{legacy: true}]},
    exact: [{sourceFile: "audio/SA/L1TS08.mp3", bytes: externalBytes, language: "es"}],
    embedded: {defineSounds: [], startSounds: [], soundStreams: [embeddedStream()]},
  });
  try {
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const before = JSON.parse(await readFile(manifestPath, "utf8"));
    const sourceBefore = digest(await readFile(fixture.sourcePath));
    const dryOne = await adoptPilotAudioScope({root: fixture.root, ids: [id], dryRun: true});
    const dryTwo = await adoptPilotAudioScope({root: fixture.root, ids: [id], dryRun: true});
    assert.equal(dryOne[0].updatedText, dryTwo[0].updatedText);
    assert.deepEqual(JSON.parse(await readFile(manifestPath, "utf8")), before, "dry-run must not write");
    await adoptPilotAudioScope({root: fixture.root, ids: [id]});
    const after = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.deepEqual(after.audio.languages, ["es", "und"]);
    assert.equal(after.audio.cues.length, 2);
    assert.deepEqual(after.audio.cues.map(({language}) => language).sort(), ["es", "und"]);
    assert.ok(after.audio.cues.every(({format, channels, sampleRateHz}) => format && channels > 0 && sampleRateHz > 0));
    assert.deepEqual(after.acceptance, before.acceptance);
    assert.deepEqual(after.unrelated, before.unrelated);
    assert.equal(digest(await readFile(fixture.sourcePath)), sourceBefore, "source bytes must remain unchanged");
    assert.equal((await adoptPilotAudioScope({root: fixture.root, ids: [id], check: true}))[0].changed, false);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("promotes a shell with deterministic embedded rows to required audio and clears reasonNotRequired", async () => {
  const id = "shell-course-g04-l01-index-local";
  const fixture = await writeFixture({
    id,
    audio: {required: false, reasonNotRequired: "provisional no-audio assumption", languages: [], inventoryFile: "audio-inventory.csv", cues: [], catalogGroupCandidates: []},
    embedded: {defineSounds: [], startSounds: [], soundStreams: [embeddedStream()]},
  });
  try {
    await adoptPilotAudioScope({root: fixture.root, ids: [id]});
    const after = JSON.parse(await readFile(path.join(fixture.workspace, "migration.json"), "utf8"));
    assert.equal(after.audio.required, true);
    assert.equal(after.audio.reasonNotRequired, "");
    assert.deepEqual(after.audio.languages, ["und"]);
    assert.equal(after.audio.cues.length, 1);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("keeps already-correct formula cues and accepted no-audio compute scope byte-for-byte no-op", async () => {
  const formulaId = "formula-elementary-conversion-01-01";
  const en = Buffer.from("English formula MP3\n");
  const es = Buffer.from("Spanish formula MP3\n");
  const formula = await writeFixture({
    id: formulaId,
    audio: {
      required: true,
      reasonNotRequired: "",
      languages: ["en", "es"],
      inventoryFile: "audio-inventory.csv",
      cues: [
        {id: "formula-narration-en", language: "en", source: "audio/EAD/formula.mp3", sha256: digest(en), durationMs: 1000, startFrame: null, startSemantics: "host-user-activated", trigger: "legacy control"},
        {id: "formula-narration-es", language: "es", source: "audio/SAD/formula.mp3", sha256: digest(es), durationMs: 1000, startFrame: null, startSemantics: "host-user-activated", trigger: "legacy control"},
      ],
    },
    exact: [
      {sourceFile: "audio/EAD/formula.mp3", bytes: en, language: "en"},
      {sourceFile: "audio/SAD/formula.mp3", bytes: es, language: "es"},
    ],
    rowIds: ["formula-narration-en", "formula-narration-es"],
  });
  const computeId = "keyterm-elementary-computeghgh";
  const compute = await writeFixture({
    id: computeId,
    audio: {required: false, reasonNotRequired: "accepted structural negative proof", languages: [], inventoryFile: "audio-inventory.csv", cues: [], strictAcceptance: "pending-authoritative-no-audio-confirmation"},
    acceptedNoAudio: true,
  });
  try {
    for (const fixture of [formula, compute]) {
      const manifestPath = path.join(fixture.workspace, "migration.json");
      const before = await readFile(manifestPath, "utf8");
      const plan = await buildPilotAudioAdoption({root: fixture.root, animationId: fixture.manifest.animationId});
      assert.equal(plan.changed, false);
      await adoptPilotAudioScope({root: fixture.root, ids: [fixture.manifest.animationId]});
      assert.equal(await readFile(manifestPath, "utf8"), before);
    }
  } finally {
    await rm(formula.root, {recursive: true, force: true});
    await rm(compute.root, {recursive: true, force: true});
  }
});

test("blocks FQ candidate-only, acute missing-source, and RE without accepted no-audio proof", async () => {
  const fq = await writeFixture({
    id: "course-g03-l06-fq-002-review",
    audio: {required: true, reasonNotRequired: "", languages: [], inventoryFile: "audio-inventory.csv", cues: []},
    candidates: [{sourceFile: "candidate.mp3"}],
  });
  const acuteBytes = Buffer.from("English acute-angle audio\n");
  const acute = await writeFixture({
    id: "keyterm-elementary-acute-angle",
    audio: {required: true, reasonNotRequired: "", languages: ["en", "es"], inventoryFile: "audio-inventory.csv", cues: []},
    exact: [{sourceFile: "audio/EAD/acute_angle.mp3", bytes: acuteBytes, language: "en"}],
    missing: [{sourceFile: "audio/SAD/acute_angle.mp3", language: "es", status: "missing-source"}],
  });
  const review = await writeFixture({
    id: "course-g03-l08-re-001",
    audio: {required: false, reasonNotRequired: "provisional", languages: [], inventoryFile: "audio-inventory.csv", cues: []},
  });
  try {
    await assert.rejects(() => buildPilotAudioAdoption({root: fq.root, animationId: fq.manifest.animationId}), /candidate-only lesson audio/);
    await assert.rejects(() => buildPilotAudioAdoption({root: acute.root, animationId: acute.manifest.animationId}), /expected audio source is missing/);
    await assert.rejects(() => buildPilotAudioAdoption({root: review.root, animationId: review.manifest.animationId}), /accepted structural negative proof/);
  } finally {
    for (const fixture of [fq, acute, review]) await rm(fixture.root, {recursive: true, force: true});
  }
});

test("preflights a selected transaction atomically and writes nothing when any pilot is blocked", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pilot-audio-adoption-atomic-"));
  const shellId = "shell-course-g04-l01-index-local";
  const fqId = "course-g03-l06-fq-002-review";
  try {
    const makeWithinRoot = async ({id, candidates = [], embedded}) => {
      const workspace = path.join(root, "migrations", id);
      await mkdir(path.join(workspace, "audit"), {recursive: true});
      const swf = Buffer.from(`${id} source\n`);
      const source = `sources/${id}.swf`;
      await mkdir(path.dirname(path.join(root, source)), {recursive: true});
      await writeFile(path.join(root, source), swf);
      const manifest = baseManifest(id, source, digest(swf), {required: id === fqId, reasonNotRequired: id === shellId ? "provisional" : "", languages: [], inventoryFile: "audio-inventory.csv", cues: []});
      const rows = embeddedInventoryRows(manifest, embedded || {defineSounds: [], startSounds: [], soundStreams: []});
      await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      await writeFile(path.join(workspace, "audio-inventory.csv"), csv(rows));
      await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify({
        schemaVersion: 2, animationId: id,
        source: {swf: source, expectedSha256: digest(swf), observedSha256: digest(swf), hashMatches: true},
        authority: {hostScript: hostScript()},
        externalAudio: {exactAssociations: [], lessonGroupCandidates: candidates, expectedButMissing: [], missingExpectedCount: 0},
        embeddedAudio: embedded || {defineSounds: [], startSounds: [], soundStreams: []},
        inventory: {file: "audio-inventory.csv", rowCount: rows.length},
        acceptance: {structurallyAudited: true},
      }, null, 2)}\n`);
      return workspace;
    };
    const shellWorkspace = await makeWithinRoot({id: shellId, embedded: {defineSounds: [], startSounds: [], soundStreams: [embeddedStream()]}});
    await makeWithinRoot({id: fqId, candidates: [{sourceFile: "candidate.mp3"}]});
    const before = await readFile(path.join(shellWorkspace, "migration.json"), "utf8");
    await assert.rejects(() => adoptPilotAudioScope({root, ids: [shellId, fqId]}), /no manifests were written/);
    assert.equal(await readFile(path.join(shellWorkspace, "migration.json"), "utf8"), before);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("parses explicit check/dry-run modes and rejects unsafe option combinations", () => {
  assert.deepEqual(parseArguments(["--id", "formula-elementary-conversion-01-01", "--check"]), {ids: ["formula-elementary-conversion-01-01"], check: true, dryRun: false, help: false});
  assert.deepEqual(parseArguments(["--dry-run"]), {ids: [], check: false, dryRun: true, help: false});
  assert.throws(() => parseArguments(["--check", "--dry-run"]), /mutually exclusive/);
});
