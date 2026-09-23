import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  parseArguments,
  validateFq001CompositeSpec,
} from "./build-g5-l4-fq001-dual-sprite-composite-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json",
);
const RUNTIME_PATH = path.join(
  ROOT,
  "public/flash-assets/courses/course-g05-l04-fq-001/canvas-renderer.js",
);
const MANIFEST_PATH = path.join(
  ROOT,
  "public/flash-assets/courses/course-g05-l04-fq-001/manifest.json",
);
const REPORT_PATH = path.join(
  ROOT,
  "migrations/course-g05-l04-fq-001/evidence/dual-sprite-composite-current-js-candidate.json",
);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("FQ001 dedicated CLI and specification fail closed", async () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    spec:
      "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json",
  });
  assert.deepEqual(
    parseArguments([
      "--check",
      "--ffdec",
      "/opt/homebrew/bin/ffdec",
      "--spec",
      "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json",
    ]),
    {
      check: true,
      ffdec: "/opt/homebrew/bin/ffdec",
      spec:
        "migrations/course-g05-l04-fq-001/audit/dual-sprite-composite-current-js-candidate-spec.json",
    },
  );
  assert.throws(() => parseArguments(["--publish"]), /unknown argument/);

  const spec = validateFq001CompositeSpec(
    JSON.parse(await readFile(SPEC_PATH, "utf8")),
  );
  assert.equal(spec.timeline.public.frameDomain, "sprite-145");
  assert.equal(spec.timeline.public.frameCount, 52);
  assert.equal(spec.timeline.fixedCompanion.frameDomain, "sprite-100");
  assert.equal(spec.timeline.fixedCompanion.fixedFrame, 1);
  assert.equal(spec.timeline.fixedCompanion.standaloneRequestsEnabled, false);
  assert.equal(spec.runtimeContract.scenario, "source-static-composite-prefix");
  assert.deepEqual(spec.runtimeContract.supportedLanguages, ["en"]);
  assert.equal(spec.source.associatedAudio, null);
  assert.ok(
    Object.values(spec.acceptanceEffects).every((value) => value === false),
  );
  assert.equal(spec.strictAcceptanceEffect, "none");
});

test("FQ001 generated runtime contains only the bounded dual-sprite composite", async () => {
  const [runtimeBytes, manifestText, reportText] = await Promise.all([
    readFile(RUNTIME_PATH),
    readFile(MANIFEST_PATH, "utf8"),
    readFile(REPORT_PATH, "utf8"),
  ]);
  const runtime = runtimeBytes.toString("utf8");
  const manifest = JSON.parse(manifestText);
  const report = JSON.parse(reportText);

  assert.equal(
    sha256(runtimeBytes),
    "539e66402e9d90d871a21a8e05dfe72fccaac631f484d2fc387d37df2da54d13",
  );
  assert.match(runtime, /unsupported frame domain/);
  assert.match(runtime, /unsupported scenario/);
  assert.match(runtime, /unsupported source-proven language/);
  const companionCall = runtime.indexOf(
    "sprite100(ctx, new cxform(51,51,51,0,0,0,0,23), 0, 0, 0);",
  );
  const primaryCall = runtime.indexOf(
    "sprite145(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);",
  );
  assert.ok(companionCall > 0);
  assert.ok(primaryCall > companionCall);
  assert.match(
    runtime,
    /ctx\.transform\(1, 0, 0, 0\.999847412109375, 41\.75, 123\.82479553222657\)/,
  );
  assert.match(runtime, /ctx\.transform\(1, 0, 0, 1, 93\.3, 88\.7\)/);
  for (const forbidden of [
    "FUIComponentSymbol",
    "UpArrow",
    "ScrollThumb",
    "DownArrow",
    "FScrollBarSymbol",
    "Object.registerClass",
    "attachMovie",
    "setInterval(",
    "setTimeout(",
    "requestAnimationFrame(",
    "fetch(",
    "XMLHttpRequest",
  ]) {
    assert.equal(runtime.includes(forbidden), false, forbidden);
  }
  const objectIds = [
    ...runtime.matchAll(/\b(?:font|morphshape|shape|sprite|text)(\d+)\b/g),
  ].map((match) => Number(match[1]));
  assert.ok(objectIds.length > 0);
  assert.ok(objectIds.every((objectId) => objectId >= 84 && objectId <= 145));

  assert.equal(manifest.sourceComposite.primary.frameDomain, "sprite-145");
  assert.deepEqual(
    manifest.sourceComposite.primary.requestedFrameRange,
    [1, 52],
  );
  assert.equal(
    manifest.sourceComposite.companion.frameDomain,
    "sprite-100",
  );
  assert.equal(manifest.sourceComposite.companion.sourceFrame, 1);
  assert.equal(
    manifest.sourceComposite.companion.standaloneRequestsEnabled,
    false,
  );
  assert.equal(manifest.browserQa.renderedFrameCount, 52);
  assert.equal(manifest.browserQa.rejectionCount, 14);
  assert.equal(manifest.browserQa.unexpectedNetworkRequestCount, 0);
  assert.deepEqual(
    manifest.objectBoundary.forbiddenObjectIdsPresentInRuntime,
    [],
  );
  assert.ok(
    Object.values(manifest.acceptanceEffects).every(
      (value) => value === false,
    ),
  );
  assert.equal(manifest.strictAcceptanceEffect, "none");

  assert.equal(report.renderer.primaryFrameDomain, "sprite-145");
  assert.equal(report.renderer.fixedCompanionFrameDomain, "sprite-100");
  assert.equal(report.renderer.rootEnabled, false);
  assert.equal(report.renderer.companionStandaloneEnabled, false);
  assert.equal(report.renderer.audioEnabled, false);
  assert.equal(
    report.evidenceBoundary.canonicalFrameDomainDispositionChanged,
    false,
  );
  assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false);
  assert.equal(report.evidenceBoundary.strictCompletionClaimed, false);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});
