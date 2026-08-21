import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  createG5L4AudioReviewServer,
  loadG5L4AudioReviewState,
} from "./serve-g5-l4-audio-review.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("local review state verifies all 185 committed MP3 identities", async () => {
  const state = await loadG5L4AudioReviewState({projectRoot: PROJECT_ROOT});
  assert.equal(state.trackById.size, 185);
  assert.equal(state.report.summary.trackBytes, 21_055_023);
  assert.equal(state.report.acceptanceEffects.humanListeningAccepted, false);
  assert.match(state.reportSha256, /^[a-f0-9]{64}$/);
});

test("loopback review server serves an unsigned worksheet and exact range bytes", async (t) => {
  const review = await createG5L4AudioReviewServer({
    projectRoot: PROJECT_ROOT,
    port: 0,
  });
  t.after(() => review.close());
  const htmlResponse = await fetch(review.url);
  assert.equal(htmlResponse.status, 200);
  assert.equal(htmlResponse.headers.get("cache-control"), "private, no-store");
  const html = await htmlResponse.text();
  assert.match(html, /Local-only, unsigned review worksheet/);
  assert.match(html, /CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED=true/);
  assert.match(html, /course-g05-l04-rw-002-embedded-main-timeline/);
  assert.match(html, /Export unsigned worksheet JSON/);
  assert.equal((html.match(/<audio controls/g) || []).length, 185);
  assert.equal((html.match(/<article class="page"/g) || []).length, 54);
  assert.match(
    html,
    /data-page-id="course-g05-l04-fq-001"[\s\S]*?<select data-field="decision" disabled>/,
  );
  const [first] = review.state.trackById.values();
  const assetResponse = await fetch(
    new URL(`/asset/${encodeURIComponent(first.id)}`, review.url),
    {headers: {Range: "bytes=0-31"}},
  );
  assert.equal(assetResponse.status, 206);
  assert.equal(assetResponse.headers.get("content-type"), "audio/mpeg");
  assert.equal(assetResponse.headers.get("content-range"), `bytes 0-31/${first.bytes.length}`);
  assert.equal(assetResponse.headers.get("x-audio-sha256"), first.sha256);
  const rangeBytes = Buffer.from(await assetResponse.arrayBuffer());
  assert.equal(rangeBytes.length, 32);
  assert.deepEqual(rangeBytes, first.bytes.subarray(0, 32));
  const fullResponse = await fetch(
    new URL(`/asset/${encodeURIComponent(first.id)}`, review.url),
  );
  const fullBytes = Buffer.from(await fullResponse.arrayBuffer());
  assert.equal(
    createHash("sha256").update(fullBytes).digest("hex"),
    first.sha256,
  );
  assert.equal((await fetch(new URL("/asset/not-allowlisted", review.url))).status, 404);
});

test("review server rejects non-loopback product and bind targets", async () => {
  await assert.rejects(
    loadG5L4AudioReviewState({
      projectRoot: PROJECT_ROOT,
      productUrl: "https://www.helpmath.ai/courses/5/4?mode=focus",
    }),
    /loopback HTTP/,
  );
  await assert.rejects(
    createG5L4AudioReviewServer({
      projectRoot: PROJECT_ROOT,
      host: "0.0.0.0",
    }),
    /loopback only/,
  );
  await assert.rejects(
    loadG5L4AudioReviewState({
      projectRoot: PROJECT_ROOT,
      productUrl: "http://127.0.0.1:3211/courses/5/4?mode=focus&mode=focus",
    }),
    /G5 L4 focus route/,
  );
});
