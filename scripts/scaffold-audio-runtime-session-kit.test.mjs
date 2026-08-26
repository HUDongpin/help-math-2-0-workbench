import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AUDIO_HUMAN_ATTESTATION,
  AUDIO_LISTENING_REVIEW_SCOPE,
  buildAudioListeningAcceptanceTemplate,
  validateStrictAudioEvidence,
} from "./audio-listening-acceptance.mjs";
import {
  ACUTE_ANGLE_AUDIO_SESSION_ID,
  COURSE_AUDIO_SESSION_IDS,
  FORMULA_AUDIO_SESSION_IDS,
  assertSafeKitOutputRoot,
  buildAudioRuntimeSessionKit,
  buildPilotAudioSessionReadiness,
  parseArguments,
  scaffoldAudioRuntimeSessionKits,
  usage,
} from "./scaffold-audio-runtime-session-kit.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture({animationId = FORMULA_AUDIO_SESSION_IDS[0], acute = false, embedded = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-runtime-session-kit-"));
  const workspace = path.join(root, "migrations", animationId);
  const sourceRelative = "source-assets/source.swf";
  const hostRelative = "source-assets/indexELM.swf";
  const cueRelative = embedded ? sourceRelative : acute ? "source-assets/EAD/acute_angle.mp3" : "source-assets/EAD/formula.mp3";
  const sourceBytes = Buffer.from("source swf\n");
  const hostBytes = Buffer.from("authoritative host\n");
  const cueBytes = Buffer.from("authoritative mp3 bytes\n");
  await mkdir(path.join(root, "source-assets", "EAD"), {recursive: true});
  await Promise.all([
    writeFile(path.join(root, sourceRelative), sourceBytes),
    writeFile(path.join(root, hostRelative), hostBytes),
    ...(embedded ? [] : [writeFile(path.join(root, cueRelative), cueBytes)]),
  ]);
  const cue = {
    id: embedded ? "embedded-stream-0001" : acute ? "catalog-audio-01" : "formula-narration-en",
    language: embedded ? "und" : "en",
    source: cueRelative,
    sha256: embedded ? digest(sourceBytes) : digest(cueBytes),
    durationMs: embedded ? 1000 : acute ? 7871 : 1000,
    startFrame: null,
    startFrameDomainId: null,
    startSemantics: embedded ? "interaction-state" : "host-user-activated",
    format: embedded ? "swf-mp3-stream" : "mp3",
    channels: 1,
    sampleRateHz: 44100,
    sourceCharacterId: embedded ? 7 : null,
  };
  const manifest = {
    animationId,
    source: {swf: sourceRelative, swfSha256: digest(sourceBytes)},
    classification: {collection: embedded ? "course" : acute ? "keyterm" : "formula"},
    audio: {
      required: true,
      languages: acute ? ["en", "es"] : [cue.language],
      inventoryFile: "audio-inventory.csv",
      cues: acute ? [{...cue, implementationStatus: "blocked-unresolved-host-cue"}] : [cue],
    },
  };
  const missingSpanish = acute ? [{
    sourceFile: "source-assets/SAD/acute_angle.mp3",
    language: "es",
    status: "missing-source",
    evidence: "fixture",
  }] : [];
  const audit = {
    schemaVersion: 2,
    animationId,
    source: {
      swf: sourceRelative,
      expectedSha256: digest(sourceBytes),
      observedSha256: digest(sourceBytes),
      hashMatches: true,
    },
    authority: {
      hostScript: {
        sourceFile: hostRelative,
        sha256: digest(hostBytes),
        conventions: {
          formula: {verified: !acute},
          keyterm: {verified: acute},
        },
      },
    },
    externalAudio: {
      exactAssociations: embedded ? [] : [{
        sourceFile: cueRelative,
        catalogSha256: digest(cueBytes),
        observedSha256: digest(cueBytes),
        hashMatchesCatalog: true,
        languageAssessment: {language: "en", evidence: "verified fixture host directory semantics"},
        probe: {
          tool: "ffprobe fixture",
          codecName: "mp3",
          durationMs: cue.durationMs,
          probeSizeBytes: cueBytes.length,
          channels: 1,
          sampleRateHz: 44100,
        },
        startFrame: null,
        startSemantics: cue.startSemantics,
      }],
      lessonGroupCandidates: [],
      expectedButMissing: missingSpanish,
      missingExpectedCount: missingSpanish.length,
    },
    embeddedAudio: {
      defineSounds: [],
      startSounds: [],
      soundStreams: embedded ? [{
        streamIndex: 1,
        context: {kind: "sprite", characterId: 7},
        durationMs: cue.durationMs,
        format: "mp3",
        playbackChannels: cue.channels,
        playbackSampleRateHz: cue.sampleRateHz,
      }] : [],
    },
    acceptance: {
      structurallyAudited: true,
      strictAudioAcceptance: "pending",
      manifestFollowUp: [],
      requirements: embedded ? ["Original-runtime natural host traversal is still required."] : [],
    },
  };
  const inventory = [
    "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
    `${cue.id},${cue.language},${cueRelative},${cue.sha256},,,${cue.startSemantics},${cue.durationMs},${cue.format},${cue.channels},${cue.sampleRateHz},${cue.sourceCharacterId ?? ""},fixture`,
    "",
  ].join("\n");
  await writeJson(path.join(workspace, "migration.json"), manifest);
  await writeJson(path.join(workspace, "audit", "audio-runtime-evidence.json"), audit);
  await writeFile(path.join(workspace, "audio-inventory.csv"), inventory);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  const acceptanceSentinel = "existing human acceptance record must not be changed\n";
  await writeFile(path.join(workspace, "evidence", "audio-listening-acceptance.json"), acceptanceSentinel);

  const appPath = path.join(root, "Fake Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const executable = Buffer.from("projector executable fixture\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, executable);
  const runtime = {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version: "32.0.0.414-fixture",
    requestedAppPath: appPath,
    appPath,
    executablePath,
    executableSha256: digest(executable),
  };
  return {
    root,
    workspace,
    migrationsRoot: path.join(root, "migrations"),
    outputRoot: path.join(root, "work", "audio-runtime-session-kits"),
    manifest,
    audit,
    cue,
    runtime,
    acceptanceSentinel,
  };
}

test("scaffolds a hash-bound unsigned formula kit outside migrations without changing acceptance", async () => {
  const item = await fixture();
  try {
    const results = await scaffoldAudioRuntimeSessionKits({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      ids: [item.manifest.animationId],
      runtime: item.runtime,
    });
    assert.equal(results[0].status, "scaffolded");
    const kitRoot = path.join(item.outputRoot, item.manifest.animationId);
    const kitManifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
    const receipt = JSON.parse(await readFile(path.join(kitRoot, "evidence", "audio-runtime-sessions", "runtime-toolchain-receipt.template.json"), "utf8"));
    const session = JSON.parse(await readFile(path.join(kitRoot, "evidence", "audio-listening-sessions", "formula-narration-en-en.template.json"), "utf8"));
    assert.equal(kitManifest.status, "unsigned-template-only");
    assert.equal(kitManifest.strictAcceptanceEffect, "none");
    assert.equal(kitManifest.humanOrOwnerAcceptanceRecorded, false);
    assert.equal(kitManifest.bindings.sourceSwf.sha256, item.manifest.source.swfSha256);
    assert.equal(kitManifest.bindings.authoritativeHost.sha256, item.audit.authority.hostScript.sha256);
    assert.equal(kitManifest.runtime.executableSha256, item.runtime.executableSha256);
    assert.equal(receipt.capturedAt, null);
    assert.equal(session.reviewer.fullName, "");
    assert.equal(session.observedAt, null);
    assert.equal(session.runtime.toolchainReceipt.sha256, null);
    assert.ok(session.operationEvents.every((event) => event.observedAtMs === null && event.eventSha256 === null));
    assert.ok(Object.values(session.observations).every((value) => value === "pending"));
    assert.deepEqual(session.artifacts, []);
    assert.equal(await readFile(path.join(item.workspace, "evidence", "audio-listening-acceptance.json"), "utf8"), item.acceptanceSentinel);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("check mode verifies exact templates and write mode refuses to overwrite edits", async () => {
  const item = await fixture();
  try {
    const options = {
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      ids: [item.manifest.animationId],
      runtime: item.runtime,
    };
    await scaffoldAudioRuntimeSessionKits(options);
    const checked = await scaffoldAudioRuntimeSessionKits({...options, check: true});
    assert.equal(checked[0].status, "verified");
    const readme = path.join(item.outputRoot, item.manifest.animationId, "README.md");
    await writeFile(readme, "human edited\n");
    await assert.rejects(() => scaffoldAudioRuntimeSessionKits(options), /refusing to overwrite an edited or stale kit/);
    await assert.rejects(() => scaffoldAudioRuntimeSessionKits({...options, check: true}), /differs/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("check and write modes reject unexpected session evidence in an existing unsigned kit", async () => {
  const item = await fixture();
  try {
    const options = {
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      ids: [item.manifest.animationId],
      runtime: item.runtime,
    };
    await scaffoldAudioRuntimeSessionKits(options);
    const unexpected = path.join(item.outputRoot, item.manifest.animationId, "evidence", "audio-listening-sessions", "filled-human-session.json");
    await writeFile(unexpected, "{}\n");
    await assert.rejects(() => scaffoldAudioRuntimeSessionKits({...options, check: true}), /unexpected session\/evidence content/);
    await assert.rejects(() => scaffoldAudioRuntimeSessionKits(options), /unexpected session\/evidence content/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("an English-only acute-angle kit retains the missing-Spanish strict blocker", async () => {
  const item = await fixture({animationId: ACUTE_ANGLE_AUDIO_SESSION_ID, acute: true});
  try {
    await assert.rejects(() => buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
    }), /explicit --include-acute-english scope/);
    const kit = await buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
      acuteEnglishOnly: true,
    });
    assert.match(kit.manifest.scope, /Spanish missing source remains blocking/);
    assert.equal(kit.manifest.cues.length, 1);
    assert.equal(kit.manifest.cues[0].language, "en");
    assert.ok(kit.manifest.machineAuditBlockers.some((blocker) => blocker.includes("missing source")));
    assert.match(kit.files.get("README.md"), /cannot complete or unblock the migration/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("scaffolds an allowlisted course embedded-cue kit with structural source-character binding", async () => {
  const item = await fixture({animationId: COURSE_AUDIO_SESSION_IDS[0], embedded: true});
  try {
    const results = await scaffoldAudioRuntimeSessionKits({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      ids: [item.manifest.animationId],
      runtime: item.runtime,
    });
    assert.equal(results[0].status, "scaffolded");
    const kitRoot = path.join(item.outputRoot, item.manifest.animationId);
    const kitManifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
    const session = JSON.parse(await readFile(path.join(kitRoot, "evidence", "audio-listening-sessions", "embedded-stream-0001-und.template.json"), "utf8"));
    assert.match(kitManifest.scope, /all-declared-course-audio-cues/);
    assert.equal(kitManifest.cues[0].sourceCharacterId, 7);
    assert.equal(kitManifest.cues[0].format, "swf-mp3-stream");
    assert.equal(session.cue.sourceCharacterId, 7);
    assert.equal(session.observations.naturalHostTraversal, "pending");
    assert.match(await readFile(path.join(kitRoot, "README.md"), "utf8"), /leave the template pending/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("course scaffolding fails closed on embedded audit drift and unresolved candidate audio", async () => {
  const item = await fixture({animationId: COURSE_AUDIO_SESSION_IDS[0], embedded: true});
  try {
    item.audit.embeddedAudio.soundStreams[0].durationMs += 1;
    await writeJson(path.join(item.workspace, "audit", "audio-runtime-evidence.json"), item.audit);
    await assert.rejects(() => buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
    }), /differs from the embedded machine audio audit/);

    item.audit.embeddedAudio.soundStreams[0].durationMs -= 1;
    item.audit.externalAudio.lessonGroupCandidates.push({sourceFile: "source-assets/unresolved.mp3"});
    await writeJson(path.join(item.workspace, "audit", "audio-runtime-evidence.json"), item.audit);
    await assert.rejects(() => buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
    }), /missing, candidate, or manifest-follow-up audio/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("writes and checks a deterministic acceptance-neutral readiness report", async () => {
  const item = await fixture({animationId: COURSE_AUDIO_SESSION_IDS[0], embedded: true});
  try {
    await scaffoldAudioRuntimeSessionKits({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      ids: [item.manifest.animationId],
      runtime: item.runtime,
    });
    const built = await buildPilotAudioSessionReadiness({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      runtime: item.runtime,
      pilotIds: [item.manifest.animationId],
    });
    assert.equal(built.report.status, "acceptance-neutral");
    assert.equal(built.report.projectorOrAnimateLaunched, false);
    assert.equal(built.report.summary.preparedUnsignedKitCount, 1);
    assert.equal(built.report.pilots[0].kit.strictAcceptanceEffect, "none");
    await buildPilotAudioSessionReadiness({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      runtime: item.runtime,
      pilotIds: [item.manifest.animationId],
      check: true,
    });
    await writeFile(path.join(item.outputRoot, "readiness-report.md"), "edited\n");
    await assert.rejects(() => buildPilotAudioSessionReadiness({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      outputRoot: item.outputRoot,
      runtime: item.runtime,
      pilotIds: [item.manifest.animationId],
      check: true,
    }), /refusing to overwrite a readiness report/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("rejects output outside work and stale Projector executable identities", async () => {
  const item = await fixture();
  try {
    await assert.rejects(() => assertSafeKitOutputRoot({projectRoot: item.root, outputRoot: path.join(item.root, "migrations", "kit")}), /child directory.*work/);
    item.runtime.executableSha256 = "0".repeat(64);
    await assert.rejects(() => buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
    }), /executable SHA-256 is stale/);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("unsigned templates still fail the existing strict audio validator when copied prematurely", async () => {
  const item = await fixture();
  try {
    const kit = await buildAudioRuntimeSessionKit({
      projectRoot: item.root,
      migrationsRoot: item.migrationsRoot,
      animationId: item.manifest.animationId,
      runtime: item.runtime,
    });
    const receiptText = kit.files.get("evidence/audio-runtime-sessions/runtime-toolchain-receipt.template.json");
    const sessionPath = "evidence/audio-listening-sessions/formula-narration-en-en.json";
    const session = JSON.parse(kit.files.get("evidence/audio-listening-sessions/formula-narration-en-en.template.json"));
    session.runtime.toolchainReceipt.sha256 = digest(receiptText);
    const sessionText = `${JSON.stringify(session, null, 2)}\n`;
    await mkdir(path.join(item.workspace, "evidence", "audio-listening-sessions"), {recursive: true});
    await mkdir(path.join(item.workspace, "evidence", "audio-runtime-sessions"), {recursive: true});
    await Promise.all([
      writeFile(path.join(item.workspace, "evidence", "audio-runtime-sessions", "runtime-executable-sha256.txt"), kit.files.get("evidence/audio-runtime-sessions/runtime-executable-sha256.txt")),
      writeFile(path.join(item.workspace, "evidence", "audio-runtime-sessions", "runtime-toolchain-receipt.json"), receiptText),
      writeFile(path.join(item.workspace, sessionPath), sessionText),
    ]);
    const record = await buildAudioListeningAcceptanceTemplate({workspace: item.workspace});
    record.status = "accepted";
    record.cueReviews[0].results = {
      spokenContentAndLanguage: "pass",
      naturalHostTraversal: "pass",
      startStopAndSynchronization: "pass",
      replayReset: "pass",
    };
    record.cueReviews[0].evidence = [{kind: "original-runtime-audio-listening-session", file: sessionPath, sha256: digest(sessionText)}];
    record.summary = {
      everyCueListened: true,
      everyReachableHostStateTraversed: true,
      synchronizationAccepted: true,
      replayAccepted: true,
    };
    record.review = {
      decision: "accepted",
      reviewer: {kind: "human", fullName: "Fixture Human", role: "Audio reviewer", organizationOrOwnerId: "fixture-owner", contact: "fixture@example.test"},
      attestation: AUDIO_HUMAN_ATTESTATION,
      signedAt: "2026-07-21T00:00:00.000Z",
      scope: AUDIO_LISTENING_REVIEW_SCOPE,
      notes: "validator fixture only",
    };
    await writeJson(path.join(item.workspace, "evidence", "audio-listening-acceptance.json"), record);
    const errors = await validateStrictAudioEvidence({projectRoot: item.root, workspace: item.workspace, manifest: item.manifest});
    assert.ok(errors.some((error) => error.includes("receipt capturedAt is invalid")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("reviewer must match the named human")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("observedAt is invalid")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("operation event chain is invalid")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("observation spokenContentAndLanguage is not pass")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("must bind at least one runtime capture/log artifact")), errors.join("\n"));
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("CLI parsing and help keep acute opt-in explicit", () => {
  const defaults = parseArguments([]);
  assert.deepEqual(defaults.ids, [...FORMULA_AUDIO_SESSION_IDS]);
  assert.equal(defaults.includeAcuteEnglish, false);
  const selected = parseArguments(["--id", FORMULA_AUDIO_SESSION_IDS[1], "--include-acute-english", "--check"]);
  assert.deepEqual(selected.ids, [FORMULA_AUDIO_SESSION_IDS[1]]);
  assert.equal(selected.includeAcuteEnglish, true);
  assert.equal(selected.check, true);
  assert.equal(parseArguments(["--readiness-report"]).readinessReport, true);
  const course = parseArguments(["--id", COURSE_AUDIO_SESSION_IDS[0]]);
  assert.deepEqual(course.ids, [COURSE_AUDIO_SESSION_IDS[0]]);
  assert.throws(() => parseArguments(["--id", "--check"]), /--id requires a value/);
  assert.throws(() => parseArguments(["--output"]), /--output requires a value/);
  assert.match(usage(), /never launches Projector/);
  assert.match(usage(), /never records a pass/);
  assert.match(usage(), /course pilot/);
});
