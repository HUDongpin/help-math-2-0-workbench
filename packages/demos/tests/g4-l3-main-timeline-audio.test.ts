import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadAnimationModule} from "../src/animation-registry";
import {
  G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES,
} from "../src/g4-l3-main-timeline-audio.generated";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const expectedGeneratedIds = [
  "course-g04-l03-in-002",
  "course-g04-l03-in-003",
  "course-g04-l03-in-004",
  "course-g04-l03-in-005",
  "course-g04-l03-in-006",
  "course-g04-l03-in-007",
  "course-g04-l03-in-008",
  "course-g04-l03-in-009",
  "course-g04-l03-in-010",
  "course-g04-l03-in-011",
  "course-g04-l03-in-012",
  "course-g04-l03-rw-004",
  "course-g04-l03-gs-002",
  "course-g04-l03-ti-002",
  "course-g04-l03-ti-004",
  "course-g04-l03-ti-005",
  "course-g04-l03-ti-006",
  "course-g04-l03-ts-002",
  "course-g04-l03-ts-003",
  "course-g04-l03-ts-004",
  "course-g04-l03-ts-005",
  "course-g04-l03-ts-006",
  "course-g04-l03-ts-007",
  "course-g04-l03-ts-008",
  "course-g04-l03-vb-002",
  "course-g04-l03-vb-003",
  "course-g04-l03-vb-004",
  "course-g04-l03-vb-005",
  "course-g04-l03-vb-006",
  "course-g04-l03-vb-007",
  "course-g04-l03-vb-008",
  "course-g04-l03-vb-009",
].sort();

test("G4 L3 generated audio map exposes exactly the conservative 32-member set", () => {
  assert.deepEqual(
    Object.keys(G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES).sort(),
    expectedGeneratedIds,
  );
  for (const [animationId, candidate] of Object.entries(
    G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES,
  )) {
    assert.equal(candidate.audioCues.length, 1, animationId);
    assert.equal(candidate.audioTracks.length, 1, animationId);
    const cue = candidate.audioCues[0]!;
    const track = candidate.audioTracks[0]!;
    assert.equal(cue.frameDomain, track.frameDomains?.[0], animationId);
    assert.equal(cue.language, "en", animationId);
    assert.equal(cue.spokenLanguage, "undetermined", animationId);
    assert.equal(
      cue.scenario,
      animationId === "course-g04-l03-in-009"
        ? "default"
        : "source-static-frame",
      animationId,
    );
    assert.ok(cue.endFrame! > cue.frame, animationId);
    assert.equal(track.language, "es", animationId);
    assert.deepEqual(track.visibleWhen, ["es"], animationId);
    assert.equal(track.activation, "user", animationId);
    assert.equal(track.timelineBehavior, "pause-while-playing", animationId);
  }
});

test("every generated audio asset is exact, immutable, and same-origin", async () => {
  for (const [animationId, candidate] of Object.entries(
    G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES,
  )) {
    for (const media of [
      candidate.audioCues[0]!,
      candidate.audioTracks[0]!,
    ]) {
      assert.match(
        media.source,
        new RegExp(
          `^/flash-assets/courses/${animationId}/audio/[a-z0-9-]+\\.mp3$`,
          "u",
        ),
        animationId,
      );
      const absolute = `${repositoryRoot}public${media.source}`;
      const [bytes, metadata] = await Promise.all([
        readFile(absolute),
        stat(absolute),
      ]);
      assert.equal(sha256(bytes), media.sha256, animationId);
      assert.equal(metadata.nlink, 1, animationId);
      assert.equal(metadata.mode & 0o777, 0o444, animationId);
    }
  }
});

test("generated cues are integrated without promoting module maturity", async () => {
  for (const animationId of expectedGeneratedIds) {
    const expected = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[animationId]!;
    const module = await loadAnimationModule(animationId);
    assert.ok(module, animationId);
    assert.equal(module.maturity, "legacy-prototype", animationId);
    assert.deepEqual(module.audioCues, expected.audioCues, animationId);
    if (animationId !== "course-g04-l03-ts-006") {
      assert.deepEqual(module.audioTracks, expected.audioTracks, animationId);
    } else {
      assert.equal(module.audioTracks?.length, 1, animationId);
    }
  }
});

test("candidate report keeps all acceptance gates false", async () => {
  const report = JSON.parse(
    await readFile(
      `${repositoryRoot}reports/g4-l3-current-js-main-timeline-audio-candidates.json`,
      "utf8",
    ),
  );
  assert.equal(
    report.reportType,
    "g4-l3-current-js-main-timeline-audio-candidates",
  );
  assert.equal(report.summary.expectedMemberCount, 40);
  assert.equal(report.summary.eligibleMemberCount, 34);
  assert.equal(report.summary.generatedRuntimeCandidateCount, 32);
  assert.equal(report.summary.stagedAssetCount, 68);
  assert.equal(report.summary.strictCompleteCount, 0);
  assert.equal(report.summary.published, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
});
