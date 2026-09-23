import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  currentBindings,
  isSameOriginRequest,
  reportValidationErrors,
  traceSpecificationQaBinding,
  TS006_SPANISH_HOST_AUDIO_FALSE_CLAIMS,
  validateLocalBaseUrl,
} from "./qa-ts006-spanish-host-audio.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(
  root,
  "migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json",
);

test("TS006 Spanish host-audio QA refuses non-local or cross-origin request targets", () => {
  assert.equal(validateLocalBaseUrl("http://127.0.0.1:3214/"), "http://127.0.0.1:3214");
  assert.equal(validateLocalBaseUrl("http://localhost:3214"), "http://localhost:3214");
  assert.throws(() => validateLocalBaseUrl("https://example.com"), /localhost/);
  assert.throws(() => validateLocalBaseUrl("file:///tmp/server"), /http or https/);
  assert.equal(
    isSameOriginRequest(
      "http://127.0.0.1:3214/flash-assets/courses/course-g04-l03-ts-006/audio/spanish-host-narration.mp3",
      "http://127.0.0.1:3214",
    ),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      "http://localhost:3214/flash-assets/courses/course-g04-l03-ts-006/audio/spanish-host-narration.mp3",
      "http://127.0.0.1:3214",
    ),
    false,
  );
  assert.equal(
    isSameOriginRequest("https://example.com/audio.mp3", "http://127.0.0.1:3214"),
    false,
  );
});

test("TS006 Spanish host-audio report validator fails closed on promoted claims", () => {
  const baseline = {
    schemaVersion: 1,
    animationId: "course-g04-l03-ts-006",
    status: "passed-current-js-product-qa-acceptance-neutral",
    acceptanceEffect: "none",
    strictAcceptanceEffect: false,
    normalPlaybackPage: {pass: true},
    deterministicCapturePage: {pass: true},
    audioAssetIdentity: {pass: true},
    bindingsUnchangedDuringObservation: true,
    claims: {...TS006_SPANISH_HOST_AUDIO_FALSE_CLAIMS},
  };
  assert.deepEqual(reportValidationErrors(baseline), []);
  assert.match(
    reportValidationErrors({
      ...baseline,
      claims: {...baseline.claims, authoritativeListeningComplete: true},
    }).join("\n"),
    /authoritativeListeningComplete must remain false/,
  );
  assert.match(
    reportValidationErrors({...baseline, strictAcceptanceEffect: true}).join("\n"),
    /acceptance effect must remain none/,
  );
});

test("TS006 Spanish host-audio QA binds stable capture identity, not circular receipt hashes", async () => {
  const relativePath =
    "migrations/course-g04-l03-ts-006/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-en.json";
  const document = JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  const expected = traceSpecificationQaBinding(relativePath, document);
  const incidental = structuredClone(document);
  incidental.sourceBindings.coverageInventoryBinding.fileSha256AtSpecGeneration = "f".repeat(64);
  incidental.sourceBindings.migrationManifest.sha256 = "e".repeat(64);
  assert.deepEqual(traceSpecificationQaBinding(relativePath, incidental), expected);
  const identityDrift = structuredClone(document);
  identityDrift.identity.traceId = `${identityDrift.identity.traceId}:drift`;
  assert.notEqual(
    traceSpecificationQaBinding(relativePath, identityDrift).sha256,
    expected.sha256,
  );
});

test("generated TS006 Spanish host-audio product QA is current and acceptance-neutral", async () => {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const bindings = await currentBindings();
  assert.deepEqual(reportValidationErrors(report, bindings), []);
  assert.equal(report.generatedBy.scriptSha256, bindings.productQaGenerator.sha256);
  assert.equal(report.acceptanceEffect, "none");
  assert.equal(report.strictAcceptanceEffect, false);
  assert.equal(report.migrationStatusChanged, false);
  assert.equal(report.humanReviewRecorded, false);
  assert.equal(report.ownerReviewRecorded, false);
  assert.equal(report.audioAssetIdentity.exactBytesIdentical, true);
  assert.equal(report.audioAssetIdentity.sourceMp3Sha256, report.audioAssetIdentity.expectedMp3Sha256);
  assert.equal(report.audioAssetIdentity.publicMp3Sha256, report.audioAssetIdentity.expectedMp3Sha256);
  assert.equal(report.normalPlaybackPage.beforeClick.control.text, "Play Spanish audio");
  assert.equal(report.normalPlaybackPage.beforeClick.control.ariaPressed, "false");
  assert.equal(
    report.normalPlaybackPage.observations
      .onlyExactEmbeddedMp3MediaRequestedBeforeClick,
    true,
  );
  assert.equal(
    report.normalPlaybackPage.observations.onlyExactSameOriginMp3MediaRequestedAfterClick,
    true,
  );
  assert.equal(report.normalPlaybackPage.afterClick.control.ariaPressed, "true");
  assert.equal(report.normalPlaybackPage.afterClick.timelinePaused, "true");
  assert.equal(report.deterministicCapturePage.beforeDisabledClick.control.disabled, true);
  assert.equal(report.deterministicCapturePage.observations.forcedClickHadNoEffect, true);
  assert.equal(report.deterministicCapturePage.observations.mp3Requests.length, 0);
  assert(Object.values(report.claims).every((value) => value === false));
});
