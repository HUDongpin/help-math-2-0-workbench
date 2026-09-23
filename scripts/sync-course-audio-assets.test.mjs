import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {buildCourseAudioEntries, COURSE_AUDIO_PILOTS, syncCourseAudioAssets} from "./sync-course-audio-assets.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function evidence(animationId, sourceFile, bytes) {
  return {
    animationId,
    acceptance: {structurallyAudited: true},
    externalAudio: {
      exactAssociations: [{
        sourceFile,
        observedSha256: digest(bytes),
        hashMatchesCatalog: true,
        associationStatus: "exact-basename-association",
        languageAssessment: {language: "es"},
        startFrame: null,
        startSemantics: "host-user-activated",
        probe: {durationMs: 1234},
      }],
    },
  };
}

test("course audio entry keeps authority and acceptance boundaries explicit", () => {
  const bytes = Buffer.from("owner-audio");
  const id = "course-g05-l13-rw-002";
  const [entry] = buildCourseAudioEntries(id, evidence(id, "source-assets/example.mp3", bytes));
  assert.equal(entry.language, "es");
  assert.equal(entry.activation, "user");
  assert.equal(entry.publicUrl, `/flash-assets/audio/courses/${id}/es.mp3`);
  assert.equal(entry.sourceSha256, digest(bytes));
  assert.equal(entry.authoritativeListeningComplete, false);
  assert.equal(entry.synchronizationComplete, false);
});

test("course audio entry rejects unproved activation and language", () => {
  const bytes = Buffer.from("owner-audio");
  const id = "course-g05-l13-rw-002";
  const wrongActivation = evidence(id, "source-assets/example.mp3", bytes);
  wrongActivation.externalAudio.exactAssociations[0].startSemantics = "interaction-state";
  assert.throws(() => buildCourseAudioEntries(id, wrongActivation), /does not prove user-triggered/);
  const wrongLanguage = evidence(id, "source-assets/example.mp3", bytes);
  wrongLanguage.externalAudio.exactAssociations[0].languageAssessment.language = "und";
  assert.throws(() => buildCourseAudioEntries(id, wrongLanguage), /must be en or es/);
});

test("course audio sync copies exact bytes and check mode detects drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-course-audio-"));
  for (const [index, id] of COURSE_AUDIO_PILOTS.entries()) {
    const bytes = Buffer.from(`owner-audio-${index}`);
    const sourceFile = `source-assets/${id}.mp3`;
    await mkdir(path.join(root, "source-assets"), {recursive: true});
    await writeFile(path.join(root, sourceFile), bytes);
    const audit = path.join(root, "migrations", id, "audit");
    await mkdir(audit, {recursive: true});
    await writeFile(path.join(audit, "audio-runtime-evidence.json"), `${JSON.stringify(evidence(id, sourceFile, bytes), null, 2)}\n`);
  }

  const result = await syncCourseAudioAssets({root});
  assert.equal(result.entries, COURSE_AUDIO_PILOTS.length);
  await syncCourseAudioAssets({root, check: true});
  const manifest = JSON.parse(await readFile(path.join(root, result.manifest), "utf8"));
  assert.equal(manifest.strictAcceptanceEffect, false);
  assert.match(manifest.authorityBoundary, /does not prove spoken content/);

  const drift = path.join(root, "public", "flash-assets", "audio", "courses", COURSE_AUDIO_PILOTS[0], "es.mp3");
  await writeFile(drift, "drift");
  await assert.rejects(syncCourseAudioAssets({root, check: true}), /public MP3 differs from source/);
});
