import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  AUTHORITY_CLAIM_KEYS,
  COURSE_CANDIDATE_QA_CONFIGS,
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CAPTURE_STYLE_ID,
  buildCandidateUrl,
  devOverlaySuppressionPass,
  isAllowedLocalRequest,
  parseArguments,
  reportHasFailClosedAuthority,
  sourceSharedRootSpanishVisualPass,
  sourceSharedSpanishVisualPass,
  validateCandidateConfig,
  validateLocalBaseUrl,
} from "./qa-course-candidates.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("factory registers exactly the five course candidate QA artifacts", () => {
  assert.deepEqual(Object.keys(COURSE_CANDIDATE_QA_CONFIGS), [
    "course-g03-l01-ts-008",
    "course-g03-l06-fq-002-review",
    "course-g03-l06-ti-001",
    "course-g04-l09-gs-002",
    "course-g05-l13-rw-002",
  ]);
  assert.deepEqual(
    Object.values(COURSE_CANDIDATE_QA_CONFIGS).map(({outputFile}) => outputFile),
    [
      "nextjs-native-candidate-qa.json",
      "nextjs-structural-candidate-qa.json",
      "nextjs-native-candidate-qa.json",
      "nextjs-native-candidate-qa.json",
      "nextjs-structural-candidate-qa.json",
    ],
  );
});

test("every config is source-bound, nested-domain-bound, and has exactly one Spanish disposition", () => {
  for (const config of Object.values(COURSE_CANDIDATE_QA_CONFIGS)) {
    assert.deepEqual(validateCandidateConfig(config), [], config.animationId);
    assert.match(config.source.sha256, /^[a-f0-9]{64}$/);
    assert.notEqual(config.frameDomain, "root");
    assert(config.readyCases.every(({frame}) => frame >= 1 && frame <= config.frameCount));
    assert.notEqual(Boolean(config.spanishCase), Boolean(config.spanishReadyCase), config.animationId);
    if (config.animationId === "course-g03-l06-ti-001") {
      assert.equal(config.spanishCase, undefined);
      assert.deepEqual(config.spanishReadyCase, {
        frame: 142,
        scenario: "sound-0",
        lang: "es",
        seed: 0,
        classification: "source-shared-untranslated-visual",
        visualLocalizationStatus: "source-shared-untranslated-visual",
        audioLocalizationStatus: "unresolved",
        audioRendered: true,
      });
      assert.equal(config.audioAssets.length, 2);
      assert.deepEqual(config.audioRuntime, {
        scenario: "sound-0",
        seed: 0,
        source: config.audioAssets[0].path,
        startFrame: 5,
        endFrame: 137,
      });
    } else if (config.animationId === "course-g03-l01-ts-008") {
      assert.equal(config.spanishCase, undefined);
      assert.deepEqual(config.spanishReadyCase, {
        frame: 295,
        scenario: "source-drawing-default",
        lang: "es",
        seed: 0,
        classification: "source-shared-untranslated-visual",
        visualLocalizationStatus: "source-shared-untranslated-visual",
        audioLocalizationStatus: "unresolved",
        audioRendered: false,
      });
      assert.equal(config.audioAssets, undefined);
    } else if (config.animationId === "course-g05-l13-rw-002") {
      assert.equal(config.spanishCase, undefined);
      assert.deepEqual(config.spanishReadyCase, {
        frame: 673,
        scenario: "default",
        lang: "es",
        seed: 0,
        classification: "source-shared-untranslated-visual",
        visualLocalizationStatus: "source-shared-untranslated-visual",
        audioLocalizationStatus: "unresolved",
        audioRendered: false,
      });
      assert.equal(config.audioAssets, undefined);
    } else {
      assert.equal(config.spanishReadyCase, undefined);
      assert.equal(config.spanishCase.reason, "spanish-visual-and-audio-not-source-proven");
    }
    if (config.animationId === "course-g04-l09-gs-002") {
      assert.deepEqual(config.rootReadyCases.map(({frame}) => frame), [1, 10]);
      assert(config.rootReadyCases.every(({frame, frameDomain, rootFrame, scenario, lang}) =>
        frameDomain === "root" && rootFrame === frame && scenario === "root-standalone" && lang === "en"));
      assert(config.rootReadyCases.every(({assetPath}) =>
        `public${assetPath}`.startsWith("public/flash-assets/courses/course-g04-l09-gs-002/root-frames/")));
      assert.equal(config.rootSpanishCase, undefined);
      assert.deepEqual(config.rootSpanishReadyCase, {
        frame: 10,
        frameDomain: "root",
        rootFrame: 10,
        scenario: "root-standalone",
        lang: "es",
        seed: 0,
        assetPath: "/flash-assets/courses/course-g04-l09-gs-002/root-frames/frame-0010.png",
        assetSha256: "d196b2c676c247fcf21abb711ab92b109d1c03630401d35ce8fe0e66236d969a",
        classification: "source-shared-untranslated-visual",
        visualLocalizationStatus: "source-shared-untranslated-visual",
        audioLocalizationStatus: "unresolved",
        audioRendered: false,
      });
    } else {
      assert.equal(config.rootReadyCases, undefined);
      assert.equal(config.rootSpanishCase, undefined);
      assert.equal(config.rootSpanishReadyCase, undefined);
    }
    assert(config.hostBlockedCases.length > 0 || config.hostUnaddressableReason, config.animationId);
  }
});

test("unsafe or incomplete configs fail validation instead of receiving guessed defaults", () => {
  const source = COURSE_CANDIDATE_QA_CONFIGS["course-g03-l01-ts-008"];
  const malformed = {
    ...source,
    source: {path: "outside.swf", sha256: "not-a-hash"},
    frameDomain: "root",
    readyCases: [{frame: 0, scenario: "", seed: 0}],
    spanishCase: {frame: 1, scenario: "default", seed: 0},
    hostBlockedCases: [],
    hostUnaddressableReason: null,
  };
  const errors = validateCandidateConfig(malformed);
  assert(errors.length >= 7, errors.join("; "));
});

test("Spanish config validation rejects both or neither blocked and ready dispositions", () => {
  const source = COURSE_CANDIDATE_QA_CONFIGS["course-g03-l01-ts-008"];
  const ready = source.spanishReadyCase;
  const blocked = {
    frame: 295,
    scenario: "source-drawing-default",
    seed: 0,
    reason: "unproven",
  };
  assert(validateCandidateConfig({...source, spanishCase: blocked}).includes("Spanish disposition must define exactly one blocked or ready case"));
  const {spanishReadyCase: _spanishReadyCase, ...withoutSpanishDisposition} = source;
  assert(validateCandidateConfig(withoutSpanishDisposition).includes("Spanish disposition must define exactly one blocked or ready case"));
  assert(validateCandidateConfig({...withoutSpanishDisposition, spanishReadyCase: {...ready, lang: "en"}}).includes("Spanish ready scenario/language/seed is invalid"));
  assert(validateCandidateConfig({...withoutSpanishDisposition, spanishReadyCase: {...ready, audioRendered: "yes"}}).includes("Spanish ready audio disposition is invalid"));
  assert(validateCandidateConfig({...withoutSpanishDisposition, spanishReadyCase: {...ready, audioRendered: true}}).includes("rendered Spanish audio must bind registered assets"));
});

test("structural root QA validation rejects unpaired, non-root, or unhashed cases", () => {
  const source = COURSE_CANDIDATE_QA_CONFIGS["course-g04-l09-gs-002"];
  assert(validateCandidateConfig({...source, rootSpanishReadyCase: undefined}).includes("root structural QA must pair English ready cases with exactly one Spanish blocked or source-shared ready case"));
  assert(validateCandidateConfig({
    ...source,
    rootSpanishCase: {
      frame: 10,
      frameDomain: "root",
      rootFrame: 10,
      scenario: "root-standalone",
      seed: 0,
      reason: "unproven",
    },
  }).includes("root structural QA must pair English ready cases with exactly one Spanish blocked or source-shared ready case"));
  assert(validateCandidateConfig({
    ...source,
    rootSpanishReadyCase: {...source.rootSpanishReadyCase, audioRendered: true},
  }).includes("root Spanish ready audio must remain unresolved and unrendered"));
  const malformedReady = [{...source.rootReadyCases[0], frameDomain: "sprite-787", assetSha256: "bad"}];
  const errors = validateCandidateConfig({...source, rootReadyCases: malformedReady});
  assert(errors.includes("root ready domain/frame identity is invalid"));
  assert(errors.includes("root ready asset hash is invalid"));
});

test("CLI defaults to all configs, selects explicit IDs, and rejects remote or unknown targets", () => {
  assert.equal(parseArguments([]).ids.length, 5);
  assert.deepEqual(
    parseArguments(["--id", "course-g03-l06-ti-001,course-g04-l09-gs-002"]).ids,
    ["course-g03-l06-ti-001", "course-g04-l09-gs-002"],
  );
  assert.throws(() => parseArguments(["--id", "course-unknown"]), /Unsupported candidate/);
  assert.throws(() => parseArguments(["--base-url", "https://example.com"]), /localhost/);
  assert.equal(validateLocalBaseUrl("http://127.0.0.1:3213/"), "http://127.0.0.1:3213");
  assert.equal(validateLocalBaseUrl("http://[::1]:3213"), "http://[::1]:3213");
});

test("capture URLs bind the complete one-indexed domain identity", () => {
  const config = COURSE_CANDIDATE_QA_CONFIGS["course-g04-l09-gs-002"];
  const request = {frame: 641, scenario: "source-drawing-lead-in", lang: "en", seed: 17};
  const built = buildCandidateUrl("http://localhost:3213", config, request, {capture: true, purpose: "unit"});
  const parsed = new URL(built.url);
  assert.equal(parsed.pathname, `/animations/${config.animationId}`);
  assert.equal(parsed.searchParams.get("frame"), "641");
  assert.equal(parsed.searchParams.get("frameDomain"), "sprite-787");
  assert.equal(parsed.searchParams.get("scenario"), request.scenario);
  assert.equal(parsed.searchParams.get("lang"), "en");
  assert.equal(parsed.searchParams.get("seed"), "17");
  assert.equal(parsed.searchParams.get("requirementId"), built.identity.requirementId);
  assert.equal(parsed.searchParams.get("trace"), built.identity.traceId);
  assert.equal(parsed.searchParams.get("entryStateSha256"), built.identity.entryStateSha256);
  assert.match(built.identity.entryStateSha256, /^[a-f0-9]{64}$/);
  assert.equal(parsed.searchParams.get("capture"), "1");

  const tiConfig = COURSE_CANDIDATE_QA_CONFIGS["course-g03-l06-ti-001"];
  const spanish = buildCandidateUrl("http://localhost:3213", tiConfig, tiConfig.spanishReadyCase, {capture: true, purpose: "unit-spanish"});
  const spanishUrl = new URL(spanish.url);
  assert.equal(spanishUrl.searchParams.get("lang"), "es");
  assert.equal(spanish.identity.lang, "es");
  assert.match(spanish.identity.requirementId, /-es$/);

  const rootRequest = config.rootReadyCases[1];
  const root = buildCandidateUrl("http://localhost:3213", config, rootRequest, {capture: true, purpose: "unit-root"});
  const rootUrl = new URL(root.url);
  assert.equal(rootUrl.searchParams.get("frame"), "10");
  assert.equal(rootUrl.searchParams.get("frameDomain"), "root");
  assert.equal(rootUrl.searchParams.get("scenario"), "root-standalone");
  assert.equal(root.identity.rootFrame, 10);
  assert.equal(root.identity.frameDomain, "root");
  assert.match(root.identity.traceId, /root-standalone-root-en$/);
});

test("GS and RW candidate QA boundaries match their source-evidence authority", () => {
  const gs = COURSE_CANDIDATE_QA_CONFIGS["course-g04-l09-gs-002"];
  assert.deepEqual(gs.readyCases.map(({frame}) => frame), [1, 331, 641]);
  assert.deepEqual(gs.rootReadyCases.map(({frame}) => frame), [1, 10]);
  assert.equal(gs.rootSpanishCase, undefined);
  assert.equal(gs.rootSpanishReadyCase.frame, 10);
  assert.equal(gs.rootSpanishReadyCase.lang, "es");
  assert.equal(gs.rootSpanishReadyCase.audioRendered, false);
  assert.equal(gs.mobileFrame, 641);
  assert.equal(gs.reducedMotionFrame, 641);
  assert.deepEqual(gs.hostBlockedCases.slice(0, 2).map(({frame}) => frame), [642, 643]);

  const rw = COURSE_CANDIDATE_QA_CONFIGS["course-g05-l13-rw-002"];
  assert.deepEqual(rw.readyCases.map(({frame}) => frame), [1, 673, 674, 1873]);
  assert.equal(rw.spanishCase, undefined);
  assert.equal(rw.spanishReadyCase.frame, 673);
  assert.equal(rw.spanishReadyCase.audioRendered, false);
  assert.deepEqual(rw.hostBlockedCases, []);
  assert.match(rw.hostUnaddressableReason, /authoritative original-runtime execution/);
});

test("GS root Spanish-ready evaluation proves only hash-bound untranslated structural pixels", () => {
  const config = COURSE_CANDIDATE_QA_CONFIGS["course-g04-l09-gs-002"];
  const contract = config.rootSpanishReadyCase;
  const state = {
    candidate: {
      status: "engineering-structural-frame-only",
      canvasStatus: "root-ffdec-structural-frame",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: "false",
    },
    renderer: {canvasStatus: "root-ffdec-structural-frame"},
    rootImage: {
      frame: String(contract.frame),
      frameDomain: contract.frameDomain,
      rootFrame: String(contract.rootFrame),
      scenario: contract.scenario,
      language: contract.lang,
      seed: String(contract.seed),
      assetSha256: contract.assetSha256,
      originalRuntimeBaselineComplete: "false",
    },
  };
  const result = {
    requested: {
      frame: contract.frame,
      frameDomain: contract.frameDomain,
      rootFrame: contract.rootFrame,
      scenario: contract.scenario,
      lang: contract.lang,
      seed: contract.seed,
    },
    expectedAsset: {sha256: contract.assetSha256},
    before: state,
    after: structuredClone(state),
    frozen: true,
    ready: true,
    nativeStage: true,
    accessible: true,
    assetHttpPass: true,
    originalRuntimeBaselineClaimed: false,
    capture: {width: 800, height: 600},
  };
  assert.equal(sourceSharedRootSpanishVisualPass(result, config), true);
  assert.equal(
    sourceSharedRootSpanishVisualPass({
      ...result,
      after: {
        ...result.after,
        candidate: {...result.after.candidate, audioRendered: "true"},
      },
    }, config),
    false,
  );
  assert.equal(
    sourceSharedRootSpanishVisualPass({
      ...result,
      requested: {...result.requested, lang: "en"},
    }, config),
    false,
  );
  assert.equal(
    sourceSharedRootSpanishVisualPass({
      ...result,
      originalRuntimeBaselineClaimed: true,
    }, config),
    false,
  );
});

test("TI Spanish-ready evaluation proves only a ready source-shared untranslated visual", () => {
  const config = COURSE_CANDIDATE_QA_CONFIGS["course-g03-l06-ti-001"];
  const contract = config.spanishReadyCase;
  const state = {
    candidate: {
      status: "engineering-not-strict",
      canvasStatus: "ready",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: "true",
    },
    renderer: {canvasStatus: "ready"},
    canvas: {
      frame: String(contract.frame),
      frameDomain: config.frameDomain,
      rootFrame: String(config.rootFrame),
      scenario: contract.scenario,
      seed: String(contract.seed),
    },
  };
  const result = {
    requested: {
      lang: "es",
      frame: contract.frame,
      frameDomain: config.frameDomain,
      scenario: contract.scenario,
      seed: contract.seed,
    },
    before: state,
    after: structuredClone(state),
    frozen: true,
    ready: true,
    nativeStage: true,
    accessible: true,
    capture: {width: 800, height: 600},
  };
  assert.equal(sourceSharedSpanishVisualPass(result, config), true);
  assert.equal(sourceSharedSpanishVisualPass({...result, requested: {...result.requested, lang: "en"}}, config), false);
  assert.equal(sourceSharedSpanishVisualPass({...result, after: {...result.after, candidate: {...result.after.candidate, audioRendered: "false"}}}, config), false);
  assert.equal(sourceSharedSpanishVisualPass({...result, before: {...result.before, canvas: {...result.before.canvas, scenario: "guessed-translation"}}}, config), false);
});

test("RW Spanish-ready evaluation proves only the silent source-shared untranslated visual", () => {
  const config = COURSE_CANDIDATE_QA_CONFIGS["course-g05-l13-rw-002"];
  const contract = config.spanishReadyCase;
  const state = {
    candidate: {
      status: "engineering-not-strict",
      canvasStatus: "ready",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: "false",
    },
    renderer: {canvasStatus: "ready"},
    canvas: {
      frame: String(contract.frame),
      frameDomain: config.frameDomain,
      rootFrame: String(config.rootFrame),
      scenario: contract.scenario,
      seed: String(contract.seed),
    },
  };
  const result = {
    requested: {
      lang: "es",
      frame: contract.frame,
      frameDomain: config.frameDomain,
      scenario: contract.scenario,
      seed: contract.seed,
    },
    before: state,
    after: structuredClone(state),
    frozen: true,
    ready: true,
    nativeStage: true,
    accessible: true,
    capture: {width: 800, height: 600},
  };
  assert.equal(sourceSharedSpanishVisualPass(result, config), true);
  assert.equal(
    sourceSharedSpanishVisualPass(
      {
        ...result,
        after: {
          ...result.after,
          candidate: {...result.after.candidate, audioRendered: "true"},
        },
      },
      config,
    ),
    false,
  );
  assert.equal(
    sourceSharedSpanishVisualPass(
      {...result, requested: {...result.requested, lang: "en"}},
      config,
    ),
    false,
  );
});

test("TS008 Spanish-ready evaluation proves untranslated visual pixels with audio omitted", () => {
  const config = COURSE_CANDIDATE_QA_CONFIGS["course-g03-l01-ts-008"];
  const contract = config.spanishReadyCase;
  const state = {
    candidate: {
      status: "engineering-not-strict",
      canvasStatus: "ready",
      visualLocalizationStatus: "source-shared-untranslated-visual",
      audioLocalizationStatus: "unresolved",
      audioRendered: "false",
    },
    renderer: {canvasStatus: "ready"},
    canvas: {
      frame: String(contract.frame),
      frameDomain: config.frameDomain,
      rootFrame: String(config.rootFrame),
      scenario: contract.scenario,
      seed: String(contract.seed),
    },
  };
  const result = {
    requested: {
      frame: contract.frame,
      frameDomain: config.frameDomain,
      scenario: contract.scenario,
      lang: "es",
      seed: contract.seed,
    },
    before: state,
    after: structuredClone(state),
    frozen: true,
    ready: true,
    nativeStage: true,
    accessible: true,
    capture: {width: 800, height: 600},
  };
  assert.equal(sourceSharedSpanishVisualPass(result, config), true);
  assert.equal(
    sourceSharedSpanishVisualPass({
      ...result,
      after: {
        ...result.after,
        candidate: {...result.after.candidate, audioRendered: "true"},
      },
    }, config),
    false,
  );
});

test("network policy permits only the selected loopback host and port", () => {
  const base = "http://localhost:3213";
  assert.equal(isAllowedLocalRequest("http://localhost:3213/animations/test", base), true);
  assert.equal(isAllowedLocalRequest("ws://localhost:3213/_next/webpack-hmr", base), true);
  assert.equal(isAllowedLocalRequest("data:image/png;base64,AA==", base), true);
  assert.equal(isAllowedLocalRequest("http://127.0.0.1:3213/animations/test", base), false);
  assert.equal(isAllowedLocalRequest("http://localhost:3214/animations/test", base), false);
  assert.equal(isAllowedLocalRequest("https://example.com/track", base), false);
  assert.equal(isAllowedLocalRequest("file:///tmp/unsafe", base), false);
});

test("evidence screenshots require verified capture-only suppression of the Next dev overlay", () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /qa-hide-next-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /data-nextjs-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /nextjs-portal/);
  const clean = {
    capturePageOnly: true,
    styleInstalled: true,
    after: {portalCount: 1, hiddenPortalCount: 1, visibleControlCount: 0},
  };
  assert.equal(devOverlaySuppressionPass(clean), true);
  assert.equal(devOverlaySuppressionPass({...clean, capturePageOnly: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, styleInstalled: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, after: {...clean.after, visibleControlCount: 1}}), false);
  assert.equal(devOverlaySuppressionPass({...clean, after: {...clean.after, hiddenPortalCount: 0}}), false);
});

test("authority boundary requires every claim and strict acceptance effect to be false", () => {
  const claims = {
    authoritativeOriginalRuntimeBaseline: false,
    naturalOriginalRuntimeTraversal: false,
    interactionBranchParity: false,
    scoringParity: false,
    bilingualVisualParity: false,
    audioParity: false,
    fullFrameCoverage: false,
    rmseAcceptance: false,
    humanVisualReview: false,
    engineeringAcceptance: false,
    ownerAcceptance: false,
    strictMigrationCompletion: false,
  };
  assert.deepEqual(Object.keys(claims), AUTHORITY_CLAIM_KEYS);
  const report = {strictAcceptanceEffect: false, migrationStatusChanged: false, acceptanceEffect: "none", claims};
  assert.equal(reportHasFailClosedAuthority(report), true);
  assert.equal(reportHasFailClosedAuthority({...report, claims: {}}), false);
  assert.equal(reportHasFailClosedAuthority({...report, claims: {...claims, inventedClaim: false}}), false);
  const {audioParity: _removed, ...missingClaim} = claims;
  assert.equal(reportHasFailClosedAuthority({...report, claims: missingClaim}), false);
  assert.equal(reportHasFailClosedAuthority({...report, strictAcceptanceEffect: "none"}), false);
  assert.equal(reportHasFailClosedAuthority({...report, migrationStatusChanged: true}), false);
  assert.equal(reportHasFailClosedAuthority({...report, claims: {...claims, ownerAcceptance: true}}), false);
});

test("configured source bytes and generated manifests currently agree without writing the archive", async () => {
  for (const config of Object.values(COURSE_CANDIDATE_QA_CONFIGS)) {
    const sourceBytes = await readFile(path.join(projectRoot, config.source.path));
    assert.equal(sha256(sourceBytes), config.source.sha256, config.animationId);
    const manifestPath = path.join(projectRoot, "public", "flash-assets", "courses", config.animationId, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.inputs.sourceSwf.path, config.source.path, config.animationId);
    assert.equal(manifest.inputs.sourceSwf.sha256, config.source.sha256, config.animationId);
    const assetPath = path.join(projectRoot, manifest.output.script);
    const assetBytes = await readFile(assetPath);
    assert.equal(sha256(assetBytes), manifest.output.sha256, config.animationId);
    assert.equal(assetBytes.length, manifest.output.bytes, config.animationId);
    for (const audio of config.audioAssets || []) {
      const audioBytes = await readFile(path.join(projectRoot, `public${audio.path}`));
      assert.equal(sha256(audioBytes), audio.sha256, `${config.animationId}:${audio.cueId}`);
      assert.equal(audioBytes.length, audio.bytes, `${config.animationId}:${audio.cueId}`);
    }
  }
});
