import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadAnimationModule } from "../src/animation-registry";
import courseIn009, {
  buildCourseG04L03In009CaptureAttributes,
} from "../src/modules/course-g04-l03-in-009";
import { matchPrototype } from "../src/prototype-manifest";
import {
  COURSE_G04_L03_IN_009_MOVIE,
  COURSE_G04_L03_IN_009_RUNTIME,
  COURSE_G04_L03_IN_009_SOURCE,
  COURSE_G04_L03_IN_009_SOURCE_CONTRACT,
  getCourseG04L03In009FrameState,
  normalizeCourseG04L03In009Frame,
} from "../src/timelines/course-g04-l03-in-009";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const migrationRoot = `${repositoryRoot}migrations/course-g04-l03-in-009`;

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

test("IN09 preserves source identity and separates the 10-frame root from sprite-200", async () => {
  assert.deepEqual(COURSE_G04_L03_IN_009_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_IN_009_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_IN_009_MOVIE.frameCount, 637);
  assert.equal(COURSE_G04_L03_IN_009_MOVIE.durationMs, (637 * 1_000) / 12);
  assert.equal(COURSE_G04_L03_IN_009_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_IN_009_RUNTIME.durationMs, (10 * 1_000) / 12);
  assert.equal(COURSE_G04_L03_IN_009_RUNTIME.defaultFrameDomain, "sprite-200");
  assert.deepEqual(COURSE_G04_L03_IN_009_RUNTIME.frameDomains, [
    { id: "sprite-200", frameCount: 637, fps: 12, rootFrame: 6 },
  ]);
  assert.equal(courseIn009.runtime, COURSE_G04_L03_IN_009_RUNTIME);
  assert.equal(courseIn009.playbackMode, "loop");
  assert.deepEqual(courseIn009.playbackEndFrameByDomain, {
    root: 1,
    "sprite-200": 637,
  });
  assert.equal(courseIn009.reducedMotionFrame, 1);
  assert.equal(
    sha256(
      await readFile(`${repositoryRoot}${COURSE_G04_L03_IN_009_SOURCE.swf}`),
    ),
    COURSE_G04_L03_IN_009_SOURCE.swfSha256,
  );
});

test("IN09 pure frame state is deterministic, one-indexed, and seed-independent visually", () => {
  assert.equal(normalizeCourseG04L03In009Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03In009Frame(0), 1);
  assert.equal(normalizeCourseG04L03In009Frame(318.9), 318);
  assert.equal(normalizeCourseG04L03In009Frame(638), 637);
  assert.equal(normalizeCourseG04L03In009Frame(11, "root"), 10);
  const first = getCourseG04L03In009FrameState(1, {
    scenario: "default",
    lang: "en",
    seed: 0,
  });
  const seeded = getCourseG04L03In009FrameState(1, {
    scenario: "default",
    lang: "en",
    seed: -1,
  });
  assert.equal(first.frame, 1);
  assert.equal(first.exportFrame, 0);
  assert.equal(first.rootFrame, 6);
  assert.equal(first.status, "ready");
  assert.equal(first.audioRendered, false);
  assert.equal(seeded.seed, 4294967295);
  assert.deepEqual(
    { ...seeded, seed: first.seed },
    first,
    "seed must not change the proven linear visual state",
  );

  const root = getCourseG04L03In009FrameState(10, {
    frameDomain: "root",
    scenario: "root-standalone",
    lang: "en",
    seed: 0,
  });
  assert.equal(root.frameDomain, "root");
  assert.equal(root.frame, 10);
  assert.equal(root.exportFrame, null);
  assert.equal(root.rootFrame, 10);
  assert.equal(root.rootState, "direct-frame-accurate-only");
  assert.equal(root.status, "ready");
});

test("Spanish keeps the source-shared visual while host audio stays acceptance-neutral", () => {
  const spanish = getCourseG04L03In009FrameState(637, {
    frameDomain: "sprite-200",
    scenario: "default",
    lang: "es",
    seed: 0,
  });
  const english = getCourseG04L03In009FrameState(637, {
    frameDomain: "sprite-200",
    scenario: "default",
    lang: "en",
    seed: 0,
  });
  const temperature = getCourseG04L03In009FrameState(142, {
    frameDomain: "sprite-200",
    scenario: "glossary-temperature-unavailable",
    lang: "es",
    seed: 0,
  });
  const measure = getCourseG04L03In009FrameState(142, {
    frameDomain: "sprite-200",
    scenario: "glossary-measure-unavailable",
    lang: "en",
    seed: 0,
  });
  assert.equal(spanish.status, "ready");
  assert.equal(spanish.blocker, null);
  assert.equal(spanish.visualBranchIndependent, true);
  assert.equal(spanish.audioRendered, false);
  assert.deepEqual(
    { ...spanish, language: "en" },
    english,
    "the source-shared visual state must differ only by route language",
  );
  assert.equal(
    temperature.blocker,
    "temperature-glossary-host-contract-unresolved",
  );
  assert.equal(measure.blocker, "measure-glossary-host-contract-unresolved");
  const spanishRoot = getCourseG04L03In009FrameState(10, {
    frameDomain: "root",
    scenario: "root-standalone",
    lang: "es",
    seed: 0,
  });
  const mismatch = getCourseG04L03In009FrameState(1, {
    frameDomain: "root",
    scenario: "default",
    lang: "en",
    seed: 0,
  });
  const unsupported = getCourseG04L03In009FrameState(1, {
    frameDomain: "sprite-unknown",
    scenario: "default",
    lang: "en",
    seed: 0,
  });
  assert.equal(spanishRoot.status, "ready");
  assert.equal(spanishRoot.blocker, null);
  assert.equal(spanishRoot.audioRendered, false);
  assert.equal(mismatch.blocker, "frame-domain-scenario-mismatch");
  assert.equal(unsupported.blocker, "unsupported-runtime-request");
  assert.equal(temperature.status, "blocked");
  assert.equal(courseIn009.audioCues.length, 1);
  assert.equal(courseIn009.audioTracks?.length, 1);
});

test("IN09 source contract separates proven host provenance from unvalidated runtime behavior", async () => {
  const contract = JSON.parse(
    await readFile(
      `${migrationRoot}/audit/owner-host-localization-interaction-contract.json`,
      "utf8",
    ),
  ) as {
    authority: Record<string, boolean | string>;
    sources: {
      childSwf: { path: string; sha256: string };
      sameLessonHost: { path: string; sha256: string };
      spanishAudio: {
        sourcePath: string;
        publicPath: string;
        sha256: string;
        durationMs: number;
      };
      glossaryXml: { path: string; sha256: string };
    };
    sourceConclusions: {
      childVisualLocalization: {
        status: string;
        exhaustiveChildScriptCount: number;
      };
      externalSpanishAudio: { status: string };
      replay: { status: string };
      terminal: { status: string };
    };
    strictDisposition: {
      strictAcceptanceEffect: string;
      remainingBlockers: string[];
    };
  };
  const childScripts = gunzipSync(
    await readFile(`${migrationRoot}/audit/machine/ffdec-scripts.txt.gz`),
  ).toString("utf8");
  const scriptHeaders = childScripts.match(/^===== .+ =====$/gm) ?? [];
  const sourceSpanishAudio = await readFile(
    `${repositoryRoot}${contract.sources.spanishAudio.sourcePath}`,
  );
  const publicSpanishAudio = await readFile(
    `${repositoryRoot}${contract.sources.spanishAudio.publicPath}`,
  );
  const glossaryXml = await readFile(
    `${repositoryRoot}${contract.sources.glossaryXml.path}`,
  );

  assert.equal(
    sha256(
      await readFile(`${repositoryRoot}${contract.sources.childSwf.path}`),
    ),
    contract.sources.childSwf.sha256,
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${contract.sources.sameLessonHost.path}`,
      ),
    ),
    contract.sources.sameLessonHost.sha256,
  );
  assert.equal(scriptHeaders.length, 5);
  assert.equal(
    contract.sourceConclusions.childVisualLocalization
      .exhaustiveChildScriptCount,
    5,
  );
  assert.doesNotMatch(
    childScripts,
    /spanish|dtfSPANISH|doPlaySpanishAudio|\/SA\//i,
  );
  assert.match(childScripts, /_global\.KeyAttribute = "Temperature"/);
  assert.match(childScripts, /_global\.KeyAttribute = "Measure"/);
  assert.equal(
    sha256(sourceSpanishAudio),
    contract.sources.spanishAudio.sha256,
  );
  assert.equal(
    sha256(publicSpanishAudio),
    contract.sources.spanishAudio.sha256,
  );
  assert.deepEqual(publicSpanishAudio, sourceSpanishAudio);
  assert.equal(contract.sources.spanishAudio.durationMs, 40_344);
  assert.equal(sha256(glossaryXml), contract.sources.glossaryXml.sha256);
  assert.match(glossaryXml.toString("utf8"), /ExFileName="Measure\.swf"/);
  assert.match(glossaryXml.toString("utf8"), /ExFileName="Temperature\.swf"/);

  assert.equal(
    COURSE_G04_L03_IN_009_SOURCE_CONTRACT.visualLocalization.status,
    contract.sourceConclusions.childVisualLocalization.status,
  );
  assert.equal(
    COURSE_G04_L03_IN_009_SOURCE_CONTRACT.externalSpanishAudio.status,
    contract.sourceConclusions.externalSpanishAudio.status,
  );
  assert.equal(
    COURSE_G04_L03_IN_009_SOURCE_CONTRACT.externalSpanishAudio.implemented,
    true,
  );
  assert.equal(
    COURSE_G04_L03_IN_009_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(
    contract.sourceConclusions.replay.status,
    "source-reload-intent-proven-complete-reset-unvalidated",
  );
  assert.equal(
    contract.sourceConclusions.terminal.status,
    "source-stop-intent-proven-runtime-ordering-unvalidated",
  );
  assert.equal(contract.authority.authorizedOriginalRuntimeExecuted, false);
  assert.equal(contract.authority.audioListened, false);
  assert.equal(contract.authority.humanAccepted, false);
  assert.equal(contract.authority.ownerAccepted, false);
  assert.equal(contract.strictDisposition.strictAcceptanceEffect, "none");
  assert.ok(contract.strictDisposition.remainingBlockers.length > 0);
});

test("renderer reports exact domain identity and keeps unproven states off Canvas", () => {
  const render = (
    frame: number,
    frameDomain: string,
    scenario: string,
    lang: "en" | "es",
  ) => {
    const state = courseIn009.getFrameState(frame, {
      frame,
      frameDomain,
      scenario,
      lang,
      seed: 17,
    });
    return renderToStaticMarkup(
      createElement(courseIn009.Renderer, {
        frame,
        frameDomain,
        scenario,
        lang,
        seed: 17,
        state,
      }),
    );
  };
  const ready = render(637, "sprite-200", "default", "en");
  assert.match(ready, /class="faithful-stage-wrap"/);
  assert.match(ready, /data-flash-frame="637"/);
  assert.match(ready, /data-flash-frame-domain="sprite-200"/);
  assert.match(ready, /data-flash-root-frame="6"/);
  assert.match(ready, /data-runtime-seed="17"/);
  assert.match(ready, /<canvas[^>]+>/);
  assert.match(ready, /<canvas[^>]+width="800"/);
  assert.match(ready, /<canvas[^>]+height="600"/);
  assert.match(ready, /<button[^>]*>Replay<\/button>/);
  assert.match(ready, /source reload intent is known/);
  assert.match(
    ready,
    /data-visual-localization-status="source-shared-untranslated-visual"/,
  );
  assert.match(
    ready,
    /data-spanish-audio-status="exact-owner-file-and-host-routing-proven-runtime-unvalidated"/,
  );

  const root = render(10, "root", "root-standalone", "en");
  assert.match(root, /data-flash-frame="10"/);
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="10"/);
  assert.match(root, /frame 10 of 10/);
  assert.match(root, /<canvas[^>]+>/);
  assert.doesNotMatch(
    root,
    /data-capture-stage=/,
    "the loading Canvas must not claim capture readiness",
  );

  const spanish = render(637, "sprite-200", "default", "es");
  assert.match(spanish, /data-canvas-status="idle"/);
  assert.match(spanish, /data-runtime-language="es"/);
  assert.match(spanish, /data-audio-rendered="false"/);
  assert.match(
    spanish,
    /data-visual-localization-status="source-shared-untranslated-visual"/,
  );
  assert.match(
    spanish,
    /data-spanish-audio-status="exact-owner-file-and-host-routing-proven-runtime-unvalidated"/,
  );
  assert.doesNotMatch(spanish, /data-fail-closed-reason=/);
  assert.match(spanish, /<canvas[^>]+>/);

  const glossary = render(
    142,
    "sprite-200",
    "glossary-temperature-unavailable",
    "en",
  );
  assert.match(glossary, /Temperature glossary action unavailable/);
  assert.match(glossary, /intentionally disabled/);
  assert.doesNotMatch(glossary, /<canvas/);
});

test("IN09 marks only a ready visual Canvas with the complete deterministic capture identity", () => {
  const state = courseIn009.getFrameState(10, {
    frame: 10,
    frameDomain: "root",
    scenario: "root-standalone",
    lang: "en",
    seed: 0,
  });
  const identity = {
    entryStateSha256:
      "4dfbb3290627139f130afd170b4c6d925c09dd7262e32d9cbc1e1142632f9deb",
    requirementId: "req:root:root-standalone:en",
    traceId: "trace:root:root-standalone:en:seed-0",
  };
  const ready = buildCourseG04L03In009CaptureAttributes({
    canvasStatus: "ready",
    state,
    ...identity,
  });
  assert.equal(ready["data-capture-stage"], "true");
  assert.equal(ready["data-render-state"], "ready");
  assert.equal(ready["data-render-visual"], "true");
  assert.equal(ready["data-flash-frame"], 10);
  assert.equal(ready["data-flash-frame-domain"], "root");
  assert.equal(ready["data-flash-lang"], "en");
  assert.equal(ready["data-flash-root-frame"], 10);
  assert.equal(ready["data-flash-scenario"], "root-standalone");
  assert.equal(ready["data-flash-seed"], 0);
  assert.equal(
    ready["data-flash-entry-state-sha256"],
    identity.entryStateSha256,
  );
  assert.equal(ready["data-flash-requirement-id"], identity.requirementId);
  assert.equal(ready["data-flash-trace-id"], identity.traceId);

  const loading = buildCourseG04L03In009CaptureAttributes({
    canvasStatus: "loading",
    state,
    ...identity,
  });
  assert.equal(loading["data-capture-stage"], undefined);
  assert.equal(loading["data-render-visual"], undefined);
  assert.equal(loading["data-render-state"], "loading");

  const missingIdentity = buildCourseG04L03In009CaptureAttributes({
    canvasStatus: "ready",
    state,
    entryStateSha256: "",
    requirementId: "",
    traceId: "",
  });
  assert.equal(missingIdentity["data-capture-stage"], undefined);
  assert.equal(missingIdentity["data-render-visual"], "true");

  const spanishState = courseIn009.getFrameState(637, {
    frame: 637,
    frameDomain: "sprite-200",
    scenario: "default",
    lang: "es",
    seed: 0,
  });
  const spanishReady = buildCourseG04L03In009CaptureAttributes({
    canvasStatus: "ready",
    state: spanishState,
    ...identity,
  });
  assert.equal(spanishState.audioRendered, false);
  assert.equal(spanishReady["data-capture-stage"], "true");
  assert.equal(spanishReady["data-flash-lang"], "es");
  assert.equal(spanishReady["data-flash-scenario"], "default");
  assert.equal(spanishReady["data-flash-seed"], 0);
  assert.equal(spanishReady["data-runtime-language"], "es");
});

test("generated asset manifest lists omitted audio and enforces static runtime safety", async () => {
  const manifest = JSON.parse(
    await readFile(
      `${repositoryRoot}public/flash-assets/courses/course-g04-l03-in-009/manifest.json`,
      "utf8",
    ),
  ) as {
    inputs: {
      sourceSwf: { sha256: string };
      rootRuntimeBaseline: { sha256: string; status: string };
      rootRuntimeFrames: Array<{ frame: number; sha256: string }>;
      ownerHostLocalizationContract: {
        path: string;
        sha256: string;
        visualLocalizationStatus: string;
        strictAcceptanceEffect: string;
      };
    };
    output: { script: string; sha256: string };
    safety: Record<string, boolean | string[]>;
    failClosed: Record<string, string>;
    strictAcceptanceEffect: string;
  };
  const runtime = await readFile(`${repositoryRoot}${manifest.output.script}`);
  const spec = JSON.parse(
    await readFile(`${migrationRoot}/audit/canvas-candidate-spec.json`, "utf8"),
  ) as {
    audioInventory: {
      embedded: { rendered: boolean };
      externalSpanish: { rendered: boolean };
    };
  };
  assert.equal(
    manifest.inputs.sourceSwf.sha256,
    COURSE_G04_L03_IN_009_SOURCE.swfSha256,
  );
  assert.equal(
    manifest.inputs.rootRuntimeBaseline.sha256,
    "9b3d71c7bf9ccaadc67fa7811ad9952da1d1e967ceeb075b84ad346f0c4ab051",
  );
  assert.equal(
    manifest.inputs.rootRuntimeBaseline.status,
    "authoritative-standalone-runtime-baseline",
  );
  assert.equal(manifest.inputs.rootRuntimeFrames.length, 10);
  assert.equal(
    manifest.inputs.ownerHostLocalizationContract.path,
    "migrations/course-g04-l03-in-009/audit/owner-host-localization-interaction-contract.json",
  );
  assert.equal(
    manifest.inputs.ownerHostLocalizationContract.visualLocalizationStatus,
    "source-shared-untranslated-visual",
  );
  assert.equal(
    manifest.inputs.ownerHostLocalizationContract.strictAcceptanceEffect,
    "none",
  );
  assert.equal(
    sha256(
      await readFile(
        `${repositoryRoot}${manifest.inputs.ownerHostLocalizationContract.path}`,
      ),
    ),
    manifest.inputs.ownerHostLocalizationContract.sha256,
  );
  assert.equal(sha256(runtime), manifest.output.sha256);
  assert.equal(manifest.safety.noDynamicEvaluation, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(manifest.safety.noTimersOrAmbientTicker, true);
  assert.match(manifest.failClosed.audio, /omitted/);
  assert.match(manifest.failClosed.spanishAudio, /omitted/);
  assert.equal(spec.audioInventory.embedded.rendered, false);
  assert.equal(spec.audioInventory.externalSpanish.rendered, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");
});

test("prototype route and generated registry expose IN09 without changing strict maturity", async () => {
  const byId = matchPrototype({ animationId: "course-g04-l03-in-009" });
  const bySource = matchPrototype({
    sourcePath: "HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf",
  });
  assert.equal(byId?.key, "course-g04-l03-in-009");
  assert.equal(bySource?.key, "course-g04-l03-in-009");
  assert.equal(byId?.movie.frameCount, 637);
  const loaded = await loadAnimationModule("course-g04-l03-in-009");
  assert.equal(loaded?.key, "course-g04-l03-in-009");
  assert.equal(loaded?.maturity, "legacy-prototype");
  assert.deepEqual(
    loaded?.scenarios.map(({ id }) => id),
    [
      "default",
      "root-standalone",
      "glossary-temperature-unavailable",
      "glossary-measure-unavailable",
    ],
  );
});
