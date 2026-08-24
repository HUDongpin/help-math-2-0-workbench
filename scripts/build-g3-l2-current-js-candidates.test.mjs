import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {buildG3L2CurrentJsCandidates} from "./build-g3-l2-current-js-candidates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("G3 L2 Current-JS generator closes the exact page-only registry projection", async () => {
  const result = await buildG3L2CurrentJsCandidates({check: true});
  assert.deepEqual(result, {
    checked: true,
    candidateCount: 70,
    audioCandidateCount: 62,
    runtimeBytes: result.runtimeBytes,
    strictCompleteCount: 0,
  });
  assert.ok(result.runtimeBytes > 0);
});

test("G3 L2 receipt keeps independent acceptance and shell gates false", async () => {
  const receipt = JSON.parse(await readFile(
    path.join(ROOT, "reports/g3-l2-current-js-candidate-build.json"),
    "utf8",
  ));
  assert.equal(receipt.summary.registeredCandidateCount, 70);
  assert.equal(receipt.summary.exactExternalAudioCandidateCount, 62);
  assert.equal(receipt.summary.audioLanguageEstablishedCount, 0);
  assert.equal(receipt.summary.audioListeningAcceptedCount, 0);
  assert.equal(receipt.summary.strictCompleteCount, 0);
  assert.equal(receipt.pageOnlyScope.legacyCourseShellExcluded, true);
  assert.equal(receipt.pageOnlyScope.modernMyLessonHostRequired, true);
  assert.equal(receipt.acceptanceEffects.strictComplete, false);
  assert.equal(receipt.acceptanceEffects.published, false);
});
