import assert from "node:assert/strict";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  materializeG4L3Ir001RandomAudioCandidate,
} from "./materialize-g4-l3-ir001-random-audio-candidate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("IR001 random-audio materialization is reproducible and acceptance-neutral", async () => {
  const result = await materializeG4L3Ir001RandomAudioCandidate({
    root,
    check: true,
  });
  assert.equal(result.action, "verified");
  assert.equal(result.branchCount, 2);
  assert.equal(result.stagedAssetCount, 2);
  assert.equal(result.strictAcceptanceEffect, "none");

  const report = JSON.parse(
    await readFile(
      path.join(
        root,
        "reports/g4-l3-ir001-current-js-random-audio-candidate.json",
      ),
      "utf8",
    ),
  );
  assert.equal(report.summary.browserQaPassed, false);
  assert.deepEqual(
    report.candidate.branches.map(
      ({outcome, ownerDomainId, structuralCueFrame}) => ({
        outcome,
        ownerDomainId,
        structuralCueFrame,
      }),
    ),
    [
      {outcome: 0, ownerDomainId: "sprite-9", structuralCueFrame: 5},
      {outcome: 1, ownerDomainId: "sprite-10", structuralCueFrame: 5},
    ],
  );
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  for (const asset of report.stagedAssets) {
    const metadata = await stat(path.join(root, asset.path));
    assert.equal(metadata.nlink, 1);
    assert.equal(metadata.mode & 0o777, 0o444);
  }
});
