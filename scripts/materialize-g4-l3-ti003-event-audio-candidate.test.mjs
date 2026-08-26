import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  materializeG4L3Ti003EventAudioCandidate,
} from "./materialize-g4-l3-ti003-event-audio-candidate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("TI003 event-audio materialization is reproducible and acceptance-neutral", async () => {
  const result = await materializeG4L3Ti003EventAudioCandidate({
    root,
    check: true,
  });
  assert.equal(result.action, "verified");
  assert.equal(result.stagedAssetCount, 2);
  assert.equal(result.strictAcceptanceEffect, "none");

  const report = JSON.parse(
    await readFile(
      path.join(
        root,
        "reports/g4-l3-ti003-current-js-event-audio-candidate.json",
      ),
      "utf8",
    ),
  );
  assert.equal(report.candidate.frameDomain, "sprite-126");
  assert.equal(report.candidate.swfEvent.soundId, 14);
  assert.equal(report.candidate.swfEvent.localFrame, 1);
  assert.equal(report.candidate.authoringCue.soundName, "G4L3_TryIt_Pg03");
  assert.equal(report.candidate.english.structuralCueFrame, 1);
  assert.equal(report.candidate.spanish.activation, "user");
  assert.equal(report.summary.browserQaPassed, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  for (const asset of report.stagedAssets) {
    const metadata = await stat(path.join(root, asset.path));
    assert.equal(metadata.nlink, 1);
    assert.equal(metadata.mode & 0o777, 0o444);
  }
});
