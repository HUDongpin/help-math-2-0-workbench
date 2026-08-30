import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

import ir001 from "../src/modules/course-g04-l03-ir-001-341242cc";
import {
  audioCueMatchesContext,
  resolveAudioCueTransition,
} from "../src/runtime";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("IR001 exposes two exact deterministic engineering audio branches", async () => {
  assert.equal(ir001.audioCues.length, 2);
  assert.equal(ir001.audioTracks?.length, 0);
  for (const [index, cue] of ir001.audioCues.entries()) {
    assert.equal(cue.frame, 5);
    assert.equal(cue.frameDomain, "sprite-27");
    assert.equal(cue.language, "en");
    assert.equal(cue.scenario, "source-static-frame");
    assert.deepEqual(cue.seedModulo, {divisor: 2, remainder: index});
    assert.equal(cue.durationMs, 11_180);
    assert.equal(cue.spokenLanguage, "undetermined");
    assert.equal(
      audioCueMatchesContext(cue, {
        frameDomain: "sprite-27",
        lang: "en",
        scenario: "source-static-frame",
        seed: index,
      }),
      true,
    );
    assert.equal(
      audioCueMatchesContext(cue, {
        frameDomain: "sprite-27",
        lang: "en",
        scenario: "source-static-frame",
        seed: 1 - index,
      }),
      false,
    );
    const asset = `${repositoryRoot}public${cue.source}`;
    const [bytes, metadata] = await Promise.all([
      readFile(asset),
      stat(asset),
    ]);
    assert.equal(sha256(bytes), cue.sha256);
    assert.equal(metadata.nlink, 1);
    assert.equal(metadata.mode & 0o777, 0o444);
  }
});

test("IR001 starts only the seed-selected branch at source dispatch frame 5", () => {
  for (const seed of [0, 1, 2, 3]) {
    const transition = resolveAudioCueTransition(ir001.audioCues, {
      previousFrame: 4,
      frame: 5,
      fps: 12,
      frameDomain: "sprite-27",
      lang: "en",
      scenario: "source-static-frame",
      seed,
    });
    assert.equal(transition.start.length, 1);
    assert.equal(
      transition.start[0]?.cue.seedModulo?.remainder,
      seed % 2,
    );
    assert.equal(transition.start[0]?.offsetSeconds, 0);
  }
});
