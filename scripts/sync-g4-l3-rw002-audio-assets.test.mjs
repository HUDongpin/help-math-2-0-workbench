import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {syncRw002AudioAssets} from "./sync-g4-l3-rw002-audio-assets.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fixtureEntry({
  id,
  role,
  source,
  output,
  publicUrl,
  bytes,
  languageCandidate,
  activation,
}) {
  return {
    id,
    role,
    source,
    output,
    publicUrl,
    bytes: bytes.length,
    sha256: sha256(bytes),
    codec: "mp3",
    sampleRateHz: role === "source-timeline-stream" ? 22_050 : 48_000,
    channels: 1,
    durationMs: role === "source-timeline-stream" ? 1_000 : 500,
    languageCandidate,
    languageEstablished: false,
    frameMapping: {
      frameDomain: "sprite-421",
      headFrame: role === "source-timeline-stream" ? 1 : null,
      firstBlockFrame: role === "source-timeline-stream" ? 1 : null,
      lastBlockFrame: role === "source-timeline-stream" ? 10 : null,
      sourceBlockCount: role === "source-timeline-stream" ? 10 : null,
      activation,
    },
  };
}

test("RW002 audio staging copies exact bytes once and verifies immutable outputs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "rw002-audio-assets-"));
  try {
    const generatorRelative = "scripts/generator.mjs";
    await mkdir(path.join(root, "scripts"), {recursive: true});
    await writeFile(path.join(root, generatorRelative), "fixture generator\n");
    const embedded = Buffer.from("embedded-mp3-fixture");
    const spanish = Buffer.from("spanish-mp3-fixture");
    const entries = [
      fixtureEntry({
        id: "embedded-stream-0001",
        role: "source-timeline-stream",
        source: "artifacts/g4-l3-embedded-audio/fixture.mp3",
        output:
          "public/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
        publicUrl:
          "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
        bytes: embedded,
        languageCandidate: "en",
        activation: "source-timeline",
      }),
      fixtureEntry({
        id: "spanish-host-narration",
        role: "catalog-associated-host-audio",
        source:
          "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
        output:
          "public/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
        publicUrl:
          "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
        bytes: spanish,
        languageCandidate: "es",
        activation: "host-user-activated-candidate",
      }),
    ];
    for (const entry of entries) {
      await mkdir(path.dirname(path.join(root, entry.source)), {recursive: true});
    }
    await writeFile(path.join(root, entries[0].source), embedded);
    await writeFile(path.join(root, entries[1].source), spanish);
    const apply = await syncRw002AudioAssets({
      root,
      entries,
      generatorRelative,
    });
    assert.equal(apply.entries, 2);
    assert.deepEqual(
      apply.results.map(({result}) => result),
      ["published-no-replace", "published-no-replace"],
    );
    assert.equal((await lstat(path.join(root, entries[0].output))).mode & 0o777, 0o444);
    assert.deepEqual(await readFile(path.join(root, entries[0].output)), embedded);
    assert.deepEqual(await readFile(path.join(root, entries[1].output)), spanish);
    const check = await syncRw002AudioAssets({
      root,
      check: true,
      entries,
      generatorRelative,
    });
    assert.equal(check.check, true);
    assert.match(check.manifestSha256, /^[a-f0-9]{64}$/);
  } finally {
    await chmod(root, 0o700).catch(() => undefined);
    await rm(root, {recursive: true, force: true});
  }
});

test("RW002 audio staging rejects a changed source or existing output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "rw002-audio-tamper-"));
  try {
    await mkdir(path.join(root, "scripts"), {recursive: true});
    await writeFile(path.join(root, "scripts/generator.mjs"), "fixture generator\n");
    const embedded = Buffer.from("embedded");
    const spanish = Buffer.from("spanish");
    const entries = [
      fixtureEntry({
        id: "embedded-stream-0001",
        role: "source-timeline-stream",
        source: "artifacts/g4-l3-embedded-audio/fixture.mp3",
        output:
          "public/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
        publicUrl:
          "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
        bytes: embedded,
        languageCandidate: "en",
        activation: "source-timeline",
      }),
      fixtureEntry({
        id: "spanish-host-narration",
        role: "catalog-associated-host-audio",
        source:
          "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
        output:
          "public/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
        publicUrl:
          "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
        bytes: spanish,
        languageCandidate: "es",
        activation: "host-user-activated-candidate",
      }),
    ];
    for (const entry of entries) {
      await mkdir(path.dirname(path.join(root, entry.source)), {recursive: true});
    }
    await writeFile(path.join(root, entries[0].source), Buffer.from("tampered"));
    await writeFile(path.join(root, entries[1].source), spanish);
    await assert.rejects(
      syncRw002AudioAssets({
        root,
        entries,
        generatorRelative: "scripts/generator.mjs",
      }),
      /source byte\/hash binding changed/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
