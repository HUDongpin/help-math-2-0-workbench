import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {syncRw003AudioAssets} from "./sync-g4-l3-rw003-audio-assets.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fixtureEntry({
  id,
  role,
  source,
  output,
  publicUrl,
  contents,
  languageCandidate,
  activation,
}) {
  const embedded = role === "source-timeline-stream";
  return {
    id,
    role,
    source,
    output,
    publicUrl,
    bytes: contents.length,
    sha256: sha256(contents),
    codec: "mp3",
    sampleRateHz: embedded ? 22_050 : 48_000,
    channels: 1,
    durationMs: embedded ? 1_000 : 500,
    languageCandidate,
    languageEstablished: false,
    frameMapping: {
      frameDomain: "sprite-49",
      headFrame: embedded ? 1 : null,
      firstBlockFrame: embedded ? 8 : null,
      lastBlockFrame: embedded ? 20 : null,
      sourceBlockCount: embedded ? 13 : null,
      activation,
    },
  };
}

async function createFixture(prefix) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), prefix)));
  const generatorRelative = "scripts/generator.mjs";
  const outputPrefix =
    "public/flash-assets/courses/course-g04-l03-rw-003/audio/";
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await writeFile(path.join(root, generatorRelative), "fixture generator\n");
  const embedded = Buffer.from("rw003-embedded-mp3-fixture");
  const spanish = Buffer.from("rw003-spanish-mp3-fixture");
  const entries = [
    fixtureEntry({
      id: "embedded-stream-0001",
      role: "source-timeline-stream",
      source: "artifacts/g4-l3-embedded-audio/fixture.mp3",
      output: `${outputPrefix}embedded-stream-0001.mp3`,
      publicUrl:
        "/flash-assets/courses/course-g04-l03-rw-003/audio/embedded-stream-0001.mp3",
      contents: embedded,
      languageCandidate: "en",
      activation: "source-timeline",
    }),
    fixtureEntry({
      id: "spanish-host-narration",
      role: "catalog-associated-host-audio",
      source:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW03.mp3",
      output: `${outputPrefix}spanish-host-narration.mp3`,
      publicUrl:
        "/flash-assets/courses/course-g04-l03-rw-003/audio/spanish-host-narration.mp3",
      contents: spanish,
      languageCandidate: "es",
      activation: "host-user-activated-candidate",
    }),
  ];
  for (const entry of entries) {
    await mkdir(path.dirname(path.join(root, entry.source)), {recursive: true});
  }
  await writeFile(path.join(root, entries[0].source), embedded);
  await writeFile(path.join(root, entries[1].source), spanish);
  return {
    root,
    generatorRelative,
    outputPrefix,
    manifestRelative: `${outputPrefix}manifest.json`,
    entries,
    embedded,
    spanish,
  };
}

test("RW003 staging publishes exact immutable audio bytes and rechecks them", async () => {
  const fixture = await createFixture("rw003-audio-assets-");
  try {
    const apply = await syncRw003AudioAssets(fixture);
    assert.equal(apply.outputs.length, 2);
    assert.equal(apply.sourceBytesPreserved, true);
    assert.equal(apply.transcoded, false);
    assert.equal(apply.strictAcceptanceEffect, "none");
    assert.equal(
      (await lstat(path.join(fixture.root, fixture.entries[0].output))).mode &
        0o777,
      0o444,
    );
    assert.deepEqual(
      await readFile(path.join(fixture.root, fixture.entries[0].output)),
      fixture.embedded,
    );
    assert.deepEqual(
      await readFile(path.join(fixture.root, fixture.entries[1].output)),
      fixture.spanish,
    );
    const check = await syncRw003AudioAssets({...fixture, check: true});
    assert.equal(check.action, "verified");
    assert.match(check.manifest.sha256, /^[a-f0-9]{64}$/u);
  } finally {
    await chmod(fixture.root, 0o700).catch(() => undefined);
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("RW003 staging rejects changed source bytes and output collisions", async () => {
  const fixture = await createFixture("rw003-audio-tamper-");
  try {
    await writeFile(
      path.join(fixture.root, fixture.entries[0].source),
      Buffer.from("tampered"),
    );
    await assert.rejects(
      syncRw003AudioAssets(fixture),
      /differs from its exact-byte binding/u,
    );

    await writeFile(
      path.join(fixture.root, fixture.entries[0].source),
      fixture.embedded,
    );
    await mkdir(
      path.dirname(path.join(fixture.root, fixture.entries[0].output)),
      {recursive: true},
    );
    await writeFile(
      path.join(fixture.root, fixture.entries[0].output),
      Buffer.from("collision"),
    );
    await chmod(path.join(fixture.root, fixture.entries[0].output), 0o444);
    await assert.rejects(
      syncRw003AudioAssets(fixture),
      /differs from its exact-byte binding/u,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
