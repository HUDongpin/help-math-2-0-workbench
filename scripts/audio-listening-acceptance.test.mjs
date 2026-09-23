import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AUDIO_HUMAN_ATTESTATION,
  AUDIO_LISTENING_REVIEW_SCOPE,
  audioSessionEventSha256,
  audioListeningAcceptanceUsage,
  assertUnsignedPendingAudioListeningTemplate,
  buildAudioListeningAcceptanceTemplate,
  parseAudioListeningAcceptanceArguments,
  scaffoldOrRefreshAudioListeningAcceptance,
  unsignedPendingAudioListeningTemplateErrors,
  validateStrictAudioEvidence,
} from "./audio-listening-acceptance.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function requiredAudioFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-listening-acceptance-"));
  const workspace = path.join(root, "migrations", "audio-pilot");
  await mkdir(path.join(workspace, "audit"), {recursive: true});
  await mkdir(path.join(workspace, "evidence", "audio-listening-sessions"), {recursive: true});
  await mkdir(path.join(workspace, "evidence", "audio-runtime-sessions"), {recursive: true});
  const swf = Buffer.from("source swf fixture\n");
  const sourcePath = path.join(root, "source.swf");
  await writeFile(sourcePath, swf);
  const audio = Buffer.from("audio fixture\n");
  const audioPath = path.join(workspace, "formula", "EAD", "audio.mp3");
  await mkdir(path.dirname(audioPath), {recursive: true});
  await writeFile(audioPath, audio);
  const manifest = {
    animationId: "audio-pilot",
    source: {swf: "source.swf", swfSha256: digest(swf)},
    classification: {collection: "formula"},
    audio: {
      required: true,
      languages: ["en"],
      inventoryFile: "audio-inventory.csv",
      cues: [{
        id: "catalog-audio-01",
        language: "en",
        source: "formula/EAD/audio.mp3",
        sha256: digest(audio),
        durationMs: 1000,
        startFrame: null,
        startSemantics: "host-user-activated",
      }],
    },
  };
  await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(path.join(workspace, "audio-inventory.csv"), [
    "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
    `catalog-audio-01,en,formula/EAD/audio.mp3,${digest(audio)},,,host-user-activated,1000,mp3,1,44100,,fixture`,
    "",
  ].join("\n"));
  await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify({
    schemaVersion: 2,
    animationId: manifest.animationId,
    source: {expectedSha256: manifest.source.swfSha256, observedSha256: manifest.source.swfSha256, hashMatches: true},
    authority: {hostScript: {sourceFile: "evidence/original-host.swf", sha256: digest("original host fixture\n"), conventions: {formula: {verified: true}}}},
    externalAudio: {
      missingExpectedCount: 0,
      lessonGroupCandidates: [],
      expectedButMissing: [],
      exactAssociations: [{
        sourceFile: "formula/EAD/audio.mp3",
        catalogSha256: digest(audio),
        observedSha256: digest(audio),
        hashMatchesCatalog: true,
        languageAssessment: {language: "en", evidence: "fixture host"},
        probe: {codecName: "mp3", durationMs: 1000, probeSizeBytes: audio.length, channels: 1, sampleRateHz: 44100, tool: "ffprobe fixture"},
      }],
    },
    embeddedAudio: {defineSounds: [], startSounds: [], soundStreams: []},
    actionScriptAudioOperations: [],
    acceptance: {structurallyAudited: true, strictAudioAcceptance: "pending", manifestFollowUp: []},
  }, null, 2)}\n`);
  const host = "original host fixture\n";
  const artifact = "runtime capture fixture\n";
  const runtimeIdentity = "Adobe Flash Player Projector fixture-1 product version capture\n";
  await writeFile(path.join(workspace, "evidence", "original-host.swf"), host);
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "runtime-capture.bin"), artifact);
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "runtime-product-version.txt"), runtimeIdentity);
  const toolchainReceipt = `${JSON.stringify({
    schemaVersion: 1,
    evidenceType: "authorized-original-runtime-toolchain-receipt",
    runtime: {runtimeId: "adobe-flash-player-projector", name: "Adobe Flash Player Projector", version: "fixture-1"},
    capturedAt: "2026-07-21T00:00:00.000Z",
    identityArtifacts: [{kind: "product-version-capture", file: "evidence/audio-runtime-sessions/runtime-product-version.txt", sha256: digest(runtimeIdentity)}],
  }, null, 2)}\n`;
  await writeFile(path.join(workspace, "evidence", "audio-runtime-sessions", "runtime-toolchain-receipt.json"), toolchainReceipt);
  const record = await buildAudioListeningAcceptanceTemplate({workspace});
  record.status = "accepted";
  record.cueReviews[0].results = {
    spokenContentAndLanguage: "pass",
    naturalHostTraversal: "pass",
    startStopAndSynchronization: "pass",
    replayReset: "pass",
  };
  const reviewer = {kind: "human", fullName: "Named Human Listener", role: "Audio QA reviewer", organizationOrOwnerId: "HELP-Math-QA-01", contact: "reviewer@example.test"};
  let prior = null;
  const operationEvents = ["activate", "start", "complete", "replay", "start"].map((action, index) => {
    const event = {sequence: index + 1, action, observedAtMs: index * 1000, previousEventSha256: prior};
    event.eventSha256 = audioSessionEventSha256(event);
    prior = event.eventSha256;
    return event;
  });
  const session = {
    schemaVersion: 1,
    evidenceType: "original-runtime-audio-listening-session",
    animationId: manifest.animationId,
    cue: Object.fromEntries(["cueId", "language", "sourceFile", "sha256", "durationMs", "startFrame", "startFrameDomainId", "startSemantics"].map((key) => [key, record.cueReviews[0][key]])),
    reviewer,
    observedAt: "2026-07-21T00:00:00.000Z",
    runtime: {
      runtimeId: "adobe-flash-player-projector",
      name: "Adobe Flash Player Projector",
      version: "fixture-1",
      hostFile: "evidence/original-host.swf",
      hostSha256: digest(host),
      toolchainReceipt: {file: "evidence/audio-runtime-sessions/runtime-toolchain-receipt.json", sha256: digest(toolchainReceipt)},
    },
    operationEvents,
    observations: {
      spokenContentAndLanguage: "pass",
      naturalHostTraversal: "pass",
      startStopAndSynchronization: "pass",
      replayReset: "pass",
    },
    artifacts: [{kind: "lossless-runtime-capture", file: "evidence/audio-runtime-sessions/runtime-capture.bin", sha256: digest(artifact)}],
  };
  const sessionText = `${JSON.stringify(session, null, 2)}\n`;
  await writeFile(path.join(workspace, "evidence", "audio-listening-sessions", "listening-session.json"), sessionText);
  record.cueReviews[0].evidence = [{kind: "original-runtime-audio-listening-session", file: "evidence/audio-listening-sessions/listening-session.json", sha256: digest(sessionText)}];
  record.summary = {
    everyCueListened: true,
    everyReachableHostStateTraversed: true,
    synchronizationAccepted: true,
    replayAccepted: true,
  };
  record.review = {
    decision: "accepted",
    reviewer,
    attestation: AUDIO_HUMAN_ATTESTATION,
    signedAt: "2026-07-21T00:00:00.000Z",
    scope: AUDIO_LISTENING_REVIEW_SCOPE,
    notes: "Fixture acceptance.",
  };
  const writeRecord = async () => writeFile(path.join(workspace, "evidence", "audio-listening-acceptance.json"), `${JSON.stringify(record, null, 2)}\n`);
  await writeRecord();
  return {projectRoot: root, root, workspace, manifest, record, session, sessionText, writeRecord};
}

async function pendingAudioFixture() {
  const fixture = await requiredAudioFixture();
  const record = await buildAudioListeningAcceptanceTemplate({workspace: fixture.workspace});
  const recordPath = path.join(fixture.workspace, "evidence", "audio-listening-acceptance.json");
  const writePending = async (value = record) => writeFile(recordPath, `${JSON.stringify(value, null, 2)}\n`);
  await writePending();
  return {...fixture, record, recordPath, writePending};
}

test("CLI documents and parses the explicit unsigned-pending refresh mode", () => {
  const options = parseAudioListeningAcceptanceArguments([
    "--id", "audio-pilot", "--migrations", "./fixtures", "--refresh-unsigned-pending",
  ]);
  assert.equal(options.id, "audio-pilot");
  assert.equal(options.refreshUnsignedPending, true);
  assert.equal(options.migrationsRoot, path.resolve("./fixtures"));
  assert.match(audioListeningAcceptanceUsage(), /--refresh-unsigned-pending/);
  assert.match(audioListeningAcceptanceUsage(), /fails closed on any signed or partially/);
  assert.throws(() => parseAudioListeningAcceptanceArguments(["--id"]), /requires an animation ID/);
  assert.throws(() => parseAudioListeningAcceptanceArguments(["--migrations"]), /requires a directory/);
});

test("safely refreshes only a strictly blank pending template against current machine bindings", async () => {
  const fixture = await pendingAudioFixture();
  try {
    assert.deepEqual(unsignedPendingAudioListeningTemplateErrors(fixture.record), []);
    assert.equal(assertUnsignedPendingAudioListeningTemplate(fixture.record), fixture.record);
    const auditPath = path.join(fixture.workspace, "audit", "audio-runtime-evidence.json");
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    audit.fixtureBindingRevision = 2;
    const auditText = `${JSON.stringify(audit, null, 2)}\n`;
    await writeFile(auditPath, auditText);
    assert.notEqual(fixture.record.bindings.machineAudioAudit.sha256, digest(auditText));

    await assert.rejects(
      scaffoldOrRefreshAudioListeningAcceptance({workspace: fixture.workspace}),
      /already exists; never overwrite a human review record/
    );
    const result = await scaffoldOrRefreshAudioListeningAcceptance({
      workspace: fixture.workspace,
      refreshUnsignedPending: true,
    });
    assert.equal(result.action, "refreshed-unsigned-pending");
    assert.equal(result.record.bindings.machineAudioAudit.sha256, digest(auditText));
    assert.deepEqual(unsignedPendingAudioListeningTemplateErrors(result.record), []);

    const strictErrors = await validateStrictAudioEvidence(fixture);
    assert.ok(strictErrors.some((error) => error.includes("status is pending, not accepted")), strictErrors.join("\n"));
    assert.ok(strictErrors.some((error) => error.includes("spokenContentAndLanguage is not pass")), strictErrors.join("\n"));
    assert.ok(strictErrors.some((error) => error.includes("has no listening/traversal evidence")), strictErrors.join("\n"));
    assert.ok(strictErrors.every((error) => !error.includes("Machine audio audit binding SHA-256 is stale")), strictErrors.join("\n"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("refresh mode never overwrites reviewer content, signatures, notes, evidence, or non-pending results", async (t) => {
  const mutations = [
    ["named reviewer", (record) => { record.review.reviewer.fullName = "Named Human Listener"; }],
    ["reviewer role", (record) => { record.review.reviewer.role = "Audio reviewer"; }],
    ["signature timestamp", (record) => { record.review.signedAt = "2026-07-21T00:00:00.000Z"; }],
    ["review notes", (record) => { record.review.notes = "I listened."; }],
    ["cue notes", (record) => { record.cueReviews[0].notes = "Observed speech."; }],
    ["cue evidence", (record) => { record.cueReviews[0].evidence = [{kind: "original-runtime-audio-listening-session"}]; }],
    ["non-pending cue result", (record) => { record.cueReviews[0].results.spokenContentAndLanguage = "pass"; }],
    ["non-pending review", (record) => { record.review.decision = "accepted"; }],
    ["non-pending record", (record) => { record.status = "accepted"; }],
    ["non-pending summary", (record) => { record.summary.everyCueListened = true; }],
    ["unexpected signature field", (record) => { record.review.signature = "signed"; }],
  ];
  for (const [label, mutate] of mutations) {
    await t.test(label, async () => {
      const fixture = await pendingAudioFixture();
      try {
        mutate(fixture.record);
        await fixture.writePending();
        const before = await readFile(fixture.recordPath);
        await assert.rejects(
          scaffoldOrRefreshAudioListeningAcceptance({
            workspace: fixture.workspace,
            refreshUnsignedPending: true,
          }),
          /Refusing to refresh audio listening acceptance/
        );
        assert.deepEqual(await readFile(fixture.recordPath), before, "refused refresh changed the human record bytes");
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("refresh mode refuses a genuinely accepted human record byte-for-byte", async () => {
  const fixture = await requiredAudioFixture();
  try {
    const recordPath = path.join(fixture.workspace, "evidence", "audio-listening-acceptance.json");
    const before = await readFile(recordPath);
    await assert.rejects(
      scaffoldOrRefreshAudioListeningAcceptance({
        workspace: fixture.workspace,
        refreshUnsignedPending: true,
      }),
      /not a strictly blank, unsigned, all-pending template/
    );
    assert.deepEqual(await readFile(recordPath), before);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("accepts a fully hash-bound named human audio listening record", async () => {
  const fixture = await requiredAudioFixture();
  try {
    assert.deepEqual(await validateStrictAudioEvidence(fixture), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects tampered evidence, automated reviewers, and future review timestamps", async () => {
  const fixture = await requiredAudioFixture();
  try {
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), "tampered\n");
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("descriptor SHA-256 is stale")));
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), fixture.sessionText);
    fixture.record.review.reviewer.fullName = "CodexRunner AI Agent";
    await fixture.writeRecord();
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("self-identifies as automation")));
    fixture.record.review.reviewer.fullName = "Named Human Listener";
    fixture.record.review.signedAt = "2999-01-01T00:00:00.000Z";
    await fixture.writeRecord();
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("cannot be in the future")));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects arbitrary browser/runtime strings even when the host and session artifacts are hash-valid", async () => {
  const fixture = await requiredAudioFixture();
  try {
    fixture.session.runtime.runtimeId = "chrome";
    fixture.session.runtime.name = "Chrome";
    fixture.session.runtime.version = "fake";
    const sessionText = `${JSON.stringify(fixture.session, null, 2)}\n`;
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), sessionText);
    fixture.record.cueReviews[0].evidence[0].sha256 = digest(sessionText);
    await fixture.writeRecord();
    const errors = await validateStrictAudioEvidence(fixture);
    assert.ok(errors.some((error) => error.includes("not an approved Adobe original-runtime identity")), errors.join("\n"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects arbitrary hash-valid inventory evidence and invented requirement IDs", async () => {
  const fixture = await requiredAudioFixture();
  try {
    const inventory = await import("node:fs/promises").then(({readFile}) => readFile(path.join(fixture.workspace, "audio-inventory.csv")));
    fixture.record.cueReviews[0].evidence = [{
      kind: "claimed-listening-log",
      requirementId: "invented-requirement",
      file: "audio-inventory.csv",
      sha256: digest(inventory),
    }];
    await fixture.writeRecord();
    const errors = await validateStrictAudioEvidence(fixture);
    assert.ok(errors.some((error) => error.includes("evidence kind must be original-runtime-audio-listening-session")), errors.join("\n"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects SWF bytes substituted for machine-audited MP3 cue identity", async () => {
  const fixture = await requiredAudioFixture();
  try {
    const forgedInventory = [
      "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
      `catalog-audio-01,en,${fixture.manifest.source.swf},${fixture.manifest.source.swfSha256},,,host-user-activated,1,mp3,1,44100,,forged`,
      "",
    ].join("\n");
    await writeFile(path.join(fixture.workspace, "audio-inventory.csv"), forgedInventory);
    fixture.manifest.audio.cues[0] = {
      id: "catalog-audio-01", language: "en", source: fixture.manifest.source.swf,
      sha256: fixture.manifest.source.swfSha256, durationMs: 1, startFrame: null, startSemantics: "host-user-activated",
    };
    fixture.record.bindings.audioInventory.sha256 = digest(forgedInventory);
    const forgedCue = {
      cueId: "catalog-audio-01", language: "en", sourceFile: fixture.manifest.source.swf,
      sha256: fixture.manifest.source.swfSha256, durationMs: 1, startFrame: null,
      startFrameDomainId: null, startSemantics: "host-user-activated",
    };
    Object.assign(fixture.record.cueReviews[0], forgedCue);
    fixture.session.cue = forgedCue;
    const forgedSession = `${JSON.stringify(fixture.session, null, 2)}\n`;
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), forgedSession);
    fixture.record.cueReviews[0].evidence[0].sha256 = digest(forgedSession);
    await fixture.writeRecord();
    const errors = await validateStrictAudioEvidence(fixture);
    assert.ok(errors.some((error) => error.includes("differs from the independently extracted machine audio audit")), errors.join("\n"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects absolute, parent-escaping, and symlink-escaping listening-session paths", async () => {
  const fixture = await requiredAudioFixture();
  try {
    const outside = path.join(fixture.root, "outside-session.json");
    await writeFile(outside, fixture.sessionText);
    for (const file of [outside, "../outside-session.json"]) {
      fixture.record.cueReviews[0].evidence[0].file = file;
      fixture.record.cueReviews[0].evidence[0].sha256 = digest(fixture.sessionText);
      await fixture.writeRecord();
      assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("absolute, escaping, or missing")));
    }
    const link = path.join(fixture.workspace, "evidence", "audio-listening-sessions", "escape.json");
    await symlink(outside, link);
    fixture.record.cueReviews[0].evidence[0].file = "evidence/audio-listening-sessions/escape.json";
    await fixture.writeRecord();
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("absolute, escaping, or missing")));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects wrong-order and non-monotonic audio operation event chains", async () => {
  const fixture = await requiredAudioFixture();
  try {
    fixture.session.operationEvents[3].action = "start";
    fixture.session.operationEvents[4].action = "replay";
    let prior = null;
    for (const event of fixture.session.operationEvents) {
      event.previousEventSha256 = prior;
      event.eventSha256 = audioSessionEventSha256(event);
      prior = event.eventSha256;
    }
    let text = `${JSON.stringify(fixture.session, null, 2)}\n`;
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), text);
    fixture.record.cueReviews[0].evidence[0].sha256 = digest(text);
    await fixture.writeRecord();
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("ordered activate")));
    fixture.session.operationEvents[2].observedAtMs = -1;
    prior = null;
    for (const event of fixture.session.operationEvents) {
      event.previousEventSha256 = prior;
      event.eventSha256 = audioSessionEventSha256(event);
      prior = event.eventSha256;
    }
    text = `${JSON.stringify(fixture.session, null, 2)}\n`;
    await writeFile(path.join(fixture.workspace, "evidence", "audio-listening-sessions", "listening-session.json"), text);
    fixture.record.cueReviews[0].evidence[0].sha256 = digest(text);
    await fixture.writeRecord();
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("non-monotonic")));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects common automation identities while noting identity remains an owner-reviewed attestation", async () => {
  for (const fullName of ["CodexRunner", "AI Agent", "GitHub Actions", "system", "自动审核器"]) {
    const fixture = await requiredAudioFixture();
    try {
      fixture.record.review.reviewer.fullName = fullName;
      await fixture.writeRecord();
      const errors = await validateStrictAudioEvidence(fixture);
      assert.ok(errors.some((error) => error.includes("self-identifies as automation")), `${fullName}: ${errors.join("\n")}`);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  }
});

test("accepts only a source-bound structural negative proof when audio is not required", async () => {
  const fixture = await requiredAudioFixture();
  try {
    fixture.manifest.audio = {required: false, languages: [], cues: [], inventoryFile: "audio-inventory.csv"};
    await writeFile(path.join(fixture.workspace, "audio-inventory.csv"), "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms\n");
    const auditPath = path.join(fixture.workspace, "audit", "audio-runtime-evidence.json");
    const machineEvidence = {};
    for (const id of ["swfmillSummary", "swfmillXml", "ffdecScripts", "ffdecTags"]) {
      const file = `audit/${id}.bin`;
      const bytes = `${id}\n`;
      await writeFile(path.join(fixture.workspace, file), bytes);
      machineEvidence[id] = {file, sha256: digest(bytes)};
    }
    const accepted = {
      schemaVersion: 2,
      animationId: fixture.manifest.animationId,
      source: {expectedSha256: fixture.manifest.source.swfSha256, observedSha256: fixture.manifest.source.swfSha256, hashMatches: true},
      externalAudio: {exactAssociations: [], lessonGroupCandidates: [], expectedButMissing: [], missingExpectedCount: 0},
      embeddedAudio: {defineSounds: [], soundStreams: []},
      actionScriptAudioOperations: [],
      inventory: {rowCount: 0},
      strictNoAudioAssessment: {
        eligible: true,
        decision: "accepted-not-required",
        scope: "shipped-SWF-and-preserved-host-placement-audio-reachability",
        checks: ["source-swf-hash", "swf-audio-tags", "parsed-audio-structures", "actionscript-audio-operations", "catalog-audio-associations", "basename-mp3", "keyterm-xml-placement", "catalog-placement"].map((id) => ({id, passed: true})),
        source: {swf: fixture.manifest.source.swf, expectedSha256: fixture.manifest.source.swfSha256, observedSha256: fixture.manifest.source.swfSha256},
        machineEvidence,
        archiveAssociationEvidence: {},
      },
      acceptance: {structurallyAudited: true, strictAudioAcceptance: "accepted-not-required"},
    };
    await writeFile(auditPath, `${JSON.stringify(accepted)}\n`);
    assert.deepEqual(await validateStrictAudioEvidence(fixture), []);
    accepted.acceptance.strictAudioAcceptance = "not-required";
    accepted.embeddedAudio.defineSounds = [{characterId: 1, durationMs: 1000}];
    await writeFile(auditPath, `${JSON.stringify(accepted)}\n`);
    const forgedShellErrors = await validateStrictAudioEvidence(fixture);
    assert.ok(forgedShellErrors.some((error) => error.includes("contradicted by external, embedded")), forgedShellErrors.join("\n"));
    accepted.embeddedAudio.defineSounds = [];
    accepted.acceptance.strictAudioAcceptance = "pending";
    await writeFile(auditPath, `${JSON.stringify(accepted)}\n`);
    assert.ok((await validateStrictAudioEvidence(fixture)).some((error) => error.includes("not source-bound accepted-not-required")));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
