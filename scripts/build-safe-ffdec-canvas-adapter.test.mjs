import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildSafeRuntime,
  generateSafeFfdecCanvasAdapter,
  parseArguments,
  resolveAdapterFrameState,
  validateAdapterAuditEvidence,
  validateBilingualVisualDisposition
} from "./build-safe-ffdec-canvas-adapter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = path.join(ROOT, "migrations/course-g03-l06-ti-001/audit/canvas-adapter-spec.json");
const IR_SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g04-l01-ir-001/audit/canvas-adapter-spec.json"
);
const STRUCTURAL_SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g03-l06-fq-002-review/audit/canvas-adapter-spec.json"
);
const GS_SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g04-l09-gs-002/audit/canvas-adapter-spec.json"
);
const RW_SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g05-l13-rw-002/audit/canvas-adapter-spec.json"
);
const TS_SPEC_PATH = path.join(
  ROOT,
  "migrations/course-g03-l01-ts-008/audit/canvas-adapter-spec.json"
);

async function loadInputs(specPath = SPEC_PATH) {
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const [helperSource, framesHtml, scenarioInventory, audioAudit] = await Promise.all([
    readFile(path.join(ROOT, spec.ffdecExport.helper), "utf8"),
    readFile(path.join(ROOT, spec.ffdecExport.framesHtml), "utf8"),
    readFile(path.join(ROOT, spec.evidence.scenarioInventory), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, spec.evidence.audioAudit), "utf8").then(JSON.parse)
  ]);
  return {spec, helperSource, framesHtml, scenarioInventory, audioAudit};
}

test("adapter CLI is explicit and rejects unknown arguments", () => {
  assert.deepEqual(parseArguments(["--check"], {root: ROOT}), {
    check: true,
    specPath: SPEC_PATH
  });
  assert.throws(() => parseArguments(["--spec"], {root: ROOT}), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"], {root: ROOT}), /Unknown argument/);
});

test("TI local timeline maps to root frame 6 and explicit deterministic sound branches", async () => {
  const {spec} = await loadInputs();
  assert.deepEqual(resolveAdapterFrameState({frame: 1, scenario: "sound-from-seed", seed: 0}, spec), {
    frameDomain: "sprite-21",
    localFrame: 1,
    exportFrame: 0,
    rootFrame: 6,
    rootState: "stopped-at-begin-while-child-plays",
    scenario: "sound-from-seed",
    lang: "en",
    seed: 0,
    soundOutcome: 0,
    selectedSound: "Mc_Sound_0",
    selectedSoundLocalFrame: 1,
    selectedSoundLocalFrameAuthority: "source-exact-stopped-frame-1",
    audioStartRequested: false,
    visualBranchIndependent: true,
    visualLocalizationStatus: "single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation",
    audioRendered: false
  });
  const started = resolveAdapterFrameState({frame: 5, scenario: "sound-from-seed", seed: 1}, spec);
  assert.equal(started.selectedSound, "Mc_Sound_1");
  assert.equal(started.selectedSoundLocalFrame, 2);
  assert.equal(started.selectedSoundLocalFrameAuthority, "source-exact-goto-and-play-frame-2-request");
  assert.equal(started.audioStartRequested, true);
  const terminal = resolveAdapterFrameState({frame: 142, scenario: "sound-0", seed: 99}, spec);
  assert.equal(terminal.selectedSoundLocalFrame, null);
  assert.equal(terminal.selectedSoundLocalFrameAuthority, "runtime-tick-phase-unresolved");
  assert.equal(terminal.audioStartRequested, false);
  const spanish = resolveAdapterFrameState({frame: 1, scenario: "sound-0", lang: "es"}, spec);
  assert.equal(spanish.lang, "es");
  assert.equal(spanish.visualLocalizationStatus, spec.runtimeContract.visualLocalization);
  assert.throws(() => resolveAdapterFrameState({frame: 0}, spec), /within 1\.\.142/);
  assert.throws(() => resolveAdapterFrameState({frame: 1, scenario: "default"}, spec), /unsupported scenario/);
  assert.throws(() => resolveAdapterFrameState({frame: 1, lang: "fr"}, spec), /unsupported source-proven language/);
});

test("adapter mapping is cross-checked against scenario and embedded-audio audits", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs();
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.root.timelineId, "root");
  assert.equal(evidence.local.timelineId, "sprite-21");
  assert.deepEqual(evidence.streams.map((stream) => stream.context.characterId), [7, 8]);
  const mutated = structuredClone(scenarioInventory);
  mutated.timelineInventory.find((timeline) => timeline.timelineId === "sprite-21").frameCount = 141;
  assert.throws(() => validateAdapterAuditEvidence(spec, mutated, audioAudit), /local frame count changed/);
});

test("TS003/TS004 preserve frame-1 preloader navigation without inventing a stop", async () => {
  const {
    spec: baseSpec,
    helperSource,
    framesHtml,
    scenarioInventory: baseScenario,
    audioAudit,
  } = await loadInputs(STRUCTURAL_SPEC_PATH);
  for (const animationId of [
    "course-g05-l04-ts-003",
    "course-g05-l04-ts-004",
  ]) {
    const spec = structuredClone(baseSpec);
    spec.animationId = animationId;
    spec.timeline.root.preloaderStopFrame = null;
    spec.timeline.root.preloaderNavigationFrame = 1;
    spec.timeline.root.preloaderNavigationAction =
      '_level0.InternalPreloader.gotoAndPlay("jump_check");';

    const scenarioInventory = structuredClone(baseScenario);
    scenarioInventory.animationId = animationId;
    const frameOne = scenarioInventory.timelineInventory
      .find((timeline) => timeline.timelineId === "root")
      .controlStates.find((state) => state.frame === 1);
    frameOne.reasons = [
      "exported-action-script",
      "initial-one-indexed-frame",
      "structural-action:DoAction",
    ];
    const matchingAudioAudit = structuredClone(audioAudit);
    matchingAudioAudit.animationId = animationId;

    assert.doesNotThrow(() => validateAdapterAuditEvidence(
      spec,
      scenarioInventory,
      matchingAudioAudit,
    ));
    const built = buildSafeRuntime({spec, helperSource, framesHtml});
    assert.deepEqual(
      {
        preloaderStopFrame:
          built.metadata.sourceRootTimeline.preloaderStopFrame,
        preloaderNavigationFrame:
          built.metadata.sourceRootTimeline.preloaderNavigationFrame,
        preloaderNavigationAction:
          built.metadata.sourceRootTimeline.preloaderNavigationAction,
      },
      {
        preloaderStopFrame: null,
        preloaderNavigationFrame: 1,
        preloaderNavigationAction:
          '_level0.InternalPreloader.gotoAndPlay("jump_check");',
      },
    );

    const inventedStop = structuredClone(scenarioInventory);
    inventedStop.timelineInventory
      .find((timeline) => timeline.timelineId === "root")
      .controlStates.find((state) => state.frame === 1)
      .reasons.push("script-stop-state");
    assert.throws(
      () => validateAdapterAuditEvidence(spec, inventedStop, matchingAudioAudit),
      /must not be relabeled as a stop/,
    );

    const missingBeginStop = structuredClone(scenarioInventory);
    missingBeginStop.timelineInventory
      .find((timeline) => timeline.timelineId === "root")
      .controlStates.find((state) => state.frame === 6)
      .reasons = ["frame-label:begin"];
    assert.throws(
      () => validateAdapterAuditEvidence(
        spec,
        missingBeginStop,
        matchingAudioAudit,
      ),
      /begin stop frame is unproven/,
    );
  }

  const ordinarySpec = structuredClone(baseSpec);
  ordinarySpec.timeline.root.preloaderStopFrame = null;
  assert.throws(
    () => resolveAdapterFrameState({frame: 1}, ordinarySpec),
    /root preloader stop frame must remain frame 1/,
  );
  const ordinaryMetadata = buildSafeRuntime({
    spec: baseSpec,
    helperSource,
    framesHtml,
  }).metadata.sourceRootTimeline;
  assert.equal(ordinaryMetadata.preloaderStopFrame, 1);
  assert.equal(
    Object.hasOwn(ordinaryMetadata, "preloaderNavigationFrame"),
    false,
  );
  assert.equal(
    Object.hasOwn(ordinaryMetadata, "preloaderNavigationAction"),
    false,
  );
});

test("hash-pinned FFDec drawing export becomes a static allowlisted runtime", async () => {
  const inputs = await loadInputs();
  const built = buildSafeRuntime(inputs);
  assert.equal(built.metadata.sourceRootTimeline.frameCount, 10);
  assert.equal(built.metadata.sourceRootTimeline.beginFrame, 6);
  assert.equal(built.metadata.deterministicContentTimeline.frameCount, 142);
  assert.equal(built.metadata.audioRendering, "not-included");
  assert.deepEqual(built.imageVariables, ["imageObj13", "imageObj15", "imageObj17", "imageObj19"]);
  assert.match(built.runtime, /SAFE_OBJECTS = Object\.freeze/);
  assert.match(built.runtime, /var allowedLanguages = \["en","es"\]/);
  assert.match(built.runtime, /visualLocalizationStatus/);
  assert.match(built.runtime, /data-flash-frame-domain/);
  assert.doesNotMatch(built.runtime, /\beval\s*\(/);
  assert.doesNotMatch(built.runtime, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(built.runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(built.runtime, /document\.body|addEventListener\s*\(/);
});

test("adapter fails closed when FFDec structure or embedded-only policy changes", async () => {
  const inputs = await loadInputs();
  assert.throws(
    () => buildSafeRuntime({...inputs, helperSource: inputs.helperSource.replace("Filters = {};", "FiltersChanged = {};")}),
    /helper global/
  );
  assert.throws(
    () => buildSafeRuntime({...inputs, framesHtml: inputs.framesHtml.replace("var scalingGrids = {};", "var scalingGrids = {};\nvar injected = \"https:\/\/invalid.example\";")}),
    /external URL/
  );
  assert.throws(
    () => buildSafeRuntime({...inputs, framesHtml: inputs.framesHtml.replace("place(\"shape20\"", "place(\"unknownShape\"")}),
    /placed-function allowlist changed/
  );
});

test("checked-in generated adapter is deterministic and current", async () => {
  const result = await generateSafeFfdecCanvasAdapter({root: ROOT, specPath: SPEC_PATH, check: true});
  assert.equal(result.animationId, "course-g03-l06-ti-001");
  assert.equal(result.localFrames, 142);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("IR source-shared visual accepts en/es without promoting audio or translation", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs(IR_SPEC_PATH);
  const spanish = resolveAdapterFrameState({
    frame: 1,
    scenario: "sound-0",
    lang: "es",
    seed: 0
  }, spec);
  assert.equal(spanish.lang, "es");
  assert.equal(spanish.visualLocalizationStatus, spec.runtimeContract.visualLocalization);
  assert.equal(spanish.audioRendered, false);
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.local.timelineId, "sprite-58");
  const built = buildSafeRuntime(await loadInputs(IR_SPEC_PATH));
  assert.match(built.runtime, /var allowedLanguages = \["en","es"\]/);
  assert.match(built.runtime, /visualLocalizationStatus/);
  const result = await generateSafeFfdecCanvasAdapter({
    root: ROOT,
    specPath: IR_SPEC_PATH,
    check: true
  });
  assert.equal(result.animationId, "course-g04-l01-ir-001");
  assert.equal(result.localFrames, 142);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("generic structural-frame contract stays visual-only and hash-bound", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs(STRUCTURAL_SPEC_PATH);
  const state = resolveAdapterFrameState({frame: 50, scenario: "default", lang: "en", seed: 9}, spec);
  assert.deepEqual(state, {
    frameDomain: "sprite-1168",
    localFrame: 50,
    exportFrame: 49,
    rootFrame: 6,
    rootState: "stopped-at-begin-while-child-static-frame-is-inspected",
    scenario: "default",
    lang: "en",
    seed: 9,
    visualOnly: true,
    interactiveStateResolved: false,
    audioRendered: false
  });
  assert.throws(
    () => resolveAdapterFrameState({frame: 2, scenario: "default", lang: "es", seed: 0}, spec),
    /unsupported source-proven language/
  );
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.local.timelineId, "sprite-1168");
  const result = await generateSafeFfdecCanvasAdapter({
    root: ROOT,
    specPath: STRUCTURAL_SPEC_PATH,
    check: true
  });
  assert.equal(result.animationId, "course-g03-l06-fq-002-review");
  assert.equal(result.localFrames, 82);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("structural-frame contract can fail closed on source behavior-dependent frames", async () => {
  const {spec: baseSpec, helperSource, framesHtml} = await loadInputs(STRUCTURAL_SPEC_PATH);
  const spec = structuredClone(baseSpec);
  spec.runtimeContract.blockedLocalFrameRanges = [
    {firstFrame: 80, lastFrame: 82, reason: "random-dependent-state-unvalidated"}
  ];
  const ready = resolveAdapterFrameState({
    frame: 79,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 17
  }, spec);
  assert.equal(ready.localFrame, 79);
  assert.equal(ready.seed, 17);
  assert.throws(
    () => resolveAdapterFrameState({
      frame: 80,
      scenario: spec.runtimeContract.defaultScenario,
      lang: "en",
      seed: 17
    }, spec),
    /source behavior-dependent frame blocked: 80 \(random-dependent-state-unvalidated\)/
  );
  const built = buildSafeRuntime({helperSource, framesHtml, spec});
  assert.deepEqual(
    built.metadata.deterministicContentTimeline.blockedLocalFrameRanges,
    spec.runtimeContract.blockedLocalFrameRanges
  );
  assert.match(built.runtime, /source behavior-dependent frame blocked/);

  const overlapping = structuredClone(spec);
  overlapping.runtimeContract.blockedLocalFrameRanges.push({
    firstFrame: 81,
    lastFrame: 82,
    reason: "overlap"
  });
  assert.throws(
    () => resolveAdapterFrameState({frame: 1}, overlapping),
    /sorted and non-overlapping/
  );
});

test("source-local IN006 number-line state is seed-deterministic but never executes AVM1", async () => {
  const [{spec: baseSpec}, contract] = await Promise.all([
    loadInputs(STRUCTURAL_SPEC_PATH),
    readFile(path.join(ROOT,
      "migrations/course-g04-l03-in-006/audit/source-local-number-line-quiz-contract.json"),
    "utf8").then(JSON.parse),
  ]);
  const spec = structuredClone(baseSpec);
  spec.timeline.local.timelineId = "sprite-151";
  spec.timeline.local.frameCount = 1_057;
  spec.runtimeContract.blockedLocalFrameRanges = [];
  spec.runtimeContract.seedMapping =
    contract.initialQuizState.implementationSeedMapping;
  spec.runtimeContract.sourceLocalNumberLineQuiz = contract.initialQuizState;

  const beforeQuiz = resolveAdapterFrameState({
    frame: 1_053,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 7,
  }, spec);
  assert.equal(beforeQuiz.quizInitialState, undefined);
  const entry = resolveAdapterFrameState({
    frame: 1_054,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 7,
  }, spec);
  assert.deepEqual(entry.quizInitialState, {
    questionIndex: 7,
    start: 1,
    target: -6,
    text: "1 to -6",
    postStopStaticInspection: false,
  });
  assert.equal(entry.dynamicOverlayRendered, true);
  assert.equal(entry.sourceRandomExecuted, false);
  assert.equal(entry.livePlaybackEndFrame, 1_054);
  assert.equal(entry.interactiveStateResolved, false);
  const postStop = resolveAdapterFrameState({
    frame: 1_057,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 8,
  }, spec);
  assert.equal(postStop.quizInitialState.questionIndex, 0);
  assert.equal(postStop.quizInitialState.text, "-11 to -8");
  assert.equal(postStop.quizInitialState.postStopStaticInspection, true);
});

test("source-local IN008 pattern state is seed-deterministic but never executes AVM1", async () => {
  const [{spec: baseSpec}, contract] = await Promise.all([
    loadInputs(STRUCTURAL_SPEC_PATH),
    readFile(path.join(ROOT,
      "migrations/course-g04-l03-in-008/audit/source-local-pattern-quiz-contract.json"),
    "utf8").then(JSON.parse),
  ]);
  const spec = structuredClone(baseSpec);
  spec.animationId = "course-g04-l03-in-008";
  spec.timeline.local.timelineId = "sprite-57";
  spec.timeline.local.frameCount = 217;
  spec.runtimeContract.blockedLocalFrameRanges = [];
  spec.runtimeContract.seedMapping =
    contract.initialQuizState.implementationSeedMapping;
  spec.runtimeContract.sourceLocalPatternQuiz = contract.initialQuizState;

  const beforeQuiz = resolveAdapterFrameState({
    frame: 215,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 4,
  }, spec);
  assert.equal(beforeQuiz.quizInitialState, undefined);
  const entry = resolveAdapterFrameState({
    frame: 216,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 4,
  }, spec);
  assert.deepEqual(entry.quizInitialState, {
    questionIndex: 4,
    label: "16, 12, 8, 4,",
    answerFirst: "0",
    answerSecond: "-4",
    feedback: "Each number decreases by 4. Try again!",
    decrement: 4,
    remainingQuestionCount: 4,
    postStopStaticInspection: false,
  });
  assert.equal(entry.dynamicOverlayRendered, true);
  assert.equal(entry.sourceRandomExecuted, false);
  assert.equal(entry.livePlaybackEndFrame, 216);
  assert.equal(entry.interactiveStateResolved, false);
  const postStop = resolveAdapterFrameState({
    frame: 217,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 5,
  }, spec);
  assert.equal(postStop.quizInitialState.questionIndex, 0);
  assert.equal(postStop.quizInitialState.label, "10, 5, 0, -5,");
  assert.equal(postStop.quizInitialState.postStopStaticInspection, true);
});

test("source-local TI005 pattern state is seed-deterministic but never executes AVM1", async () => {
  const [{spec: baseSpec}, contract] = await Promise.all([
    loadInputs(STRUCTURAL_SPEC_PATH),
    readFile(path.join(ROOT,
      "migrations/course-g04-l03-ti-005/audit/source-local-pattern-quiz-contract.json"),
    "utf8").then(JSON.parse),
  ]);
  const spec = structuredClone(baseSpec);
  spec.animationId = "course-g04-l03-ti-005";
  spec.timeline.local.timelineId = "sprite-208";
  spec.timeline.local.frameCount = 210;
  spec.runtimeContract.blockedLocalFrameRanges = [];
  spec.runtimeContract.seedMapping =
    contract.initialQuizState.implementationSeedMapping;
  spec.runtimeContract.sourceLocalPatternQuiz = contract.initialQuizState;

  const beforeQuiz = resolveAdapterFrameState({
    frame: 208,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 4,
  }, spec);
  assert.equal(beforeQuiz.quizInitialState, undefined);
  const entry = resolveAdapterFrameState({
    frame: 209,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 4,
  }, spec);
  assert.deepEqual(entry.quizInitialState, {
    questionIndex: 4,
    label: "9, 6, 3, 0,",
    answerFirst: "-3",
    answerSecond: "-6",
    feedback: "Each number decreases by 3.  Try again!",
    decrement: 3,
    remainingQuestionCount: 4,
    postStopStaticInspection: false,
  });
  assert.equal(entry.dynamicOverlayRendered, true);
  assert.equal(entry.sourceRandomExecuted, false);
  assert.equal(entry.livePlaybackEndFrame, 209);
  assert.equal(entry.interactiveStateResolved, false);
  const postStop = resolveAdapterFrameState({
    frame: 210,
    scenario: spec.runtimeContract.defaultScenario,
    lang: "en",
    seed: 5,
  }, spec);
  assert.equal(postStop.quizInitialState.questionIndex, 0);
  assert.equal(postStop.quizInitialState.label, "-3, -5, -7, -9,");
  assert.equal(postStop.quizInitialState.postStopStaticInspection, true);
});

test("source-local GS002 game state selects only legal virus positions without AVM1", async () => {
  const [{spec: baseSpec}, contract] = await Promise.all([
    loadInputs(STRUCTURAL_SPEC_PATH),
    readFile(path.join(ROOT,
      "migrations/course-g04-l03-gs-002/audit/source-local-game-initial-contract.json"),
    "utf8").then(JSON.parse),
  ]);
  const spec = structuredClone(baseSpec);
  spec.animationId = "course-g04-l03-gs-002";
  spec.timeline.local.timelineId = "sprite-321";
  spec.timeline.local.frameCount = 428;
  spec.runtimeContract.blockedLocalFrameRanges = [];
  spec.runtimeContract.seedMapping =
    contract.initialGameState.implementationSeedMapping;
  spec.runtimeContract.sourceLocalGame = contract.initialGameState;

  const beforeGame = resolveAdapterFrameState({
    frame: 426, scenario: spec.runtimeContract.defaultScenario,
    lang: "en", seed: 7,
  }, spec);
  assert.equal(beforeGame.gameInitialState, undefined);
  const entry = resolveAdapterFrameState({
    frame: 427, scenario: spec.runtimeContract.defaultScenario,
    lang: "en", seed: 7,
  }, spec);
  assert.deepEqual(entry.gameInitialState, {
    selectedAllowedIndex: 7,
    selectedVirusIndex: 8,
    virusY: 19.9,
    virusChildFrame: 0,
    coupIndex: 7,
    coupY: -4.1,
    score: 0,
    minutes: 4,
    seconds: 0,
    quizSection: true,
    signText: "",
    locationText: "",
    timerDisplayText: "00:00:00",
    scoreDisplayText: "0",
    postStopStaticInspection: false,
  });
  assert.equal(entry.dynamicOverlayRendered, true);
  assert.equal(entry.sourceRandomExecuted, false);
  assert.equal(entry.livePlaybackEndFrame, 427);
  assert.equal(entry.interactiveStateResolved, false);
  const postStop = resolveAdapterFrameState({
    frame: 428, scenario: spec.runtimeContract.defaultScenario,
    lang: "en", seed: 14,
  }, spec);
  assert.equal(postStop.gameInitialState.selectedVirusIndex, 0);
  assert.equal(postStop.gameInitialState.virusY, -174.1);
  assert.equal(postStop.gameInitialState.virusChildFrame, 1);
  assert.equal(postStop.gameInitialState.postStopStaticInspection, true);
});

test("RW structural source-shared visual accepts en/es without promoting audio or translation", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs(RW_SPEC_PATH);
  const spanish = resolveAdapterFrameState({
    frame: 673,
    scenario: "default",
    lang: "es",
    seed: 0
  }, spec);
  assert.equal(spanish.lang, "es");
  assert.equal(spanish.visualLocalizationStatus, spec.runtimeContract.visualLocalization);
  assert.equal(spanish.audioRendered, false);
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.local.timelineId, "sprite-334");
  const built = buildSafeRuntime(await loadInputs(RW_SPEC_PATH));
  assert.match(built.runtime, /var allowedLanguages = \["en","es"\]/);
  assert.match(built.runtime, /visualLocalizationStatus/);
  const result = await generateSafeFfdecCanvasAdapter({
    root: ROOT,
    specPath: RW_SPEC_PATH,
    check: true
  });
  assert.equal(result.animationId, "course-g05-l13-rw-002");
  assert.equal(result.localFrames, 1873);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("TS008 hash-bound source-shared visual accepts only untranslated en/es drawing states", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs(TS_SPEC_PATH);
  const disposition = JSON.parse(
    await readFile(path.join(ROOT, spec.evidence.bilingualVisualDisposition), "utf8")
  );
  validateBilingualVisualDisposition(spec, disposition);

  const spanish = resolveAdapterFrameState({
    frame: 747,
    scenario: "source-drawing-default",
    lang: "es",
    seed: 0
  }, spec);
  assert.equal(spanish.lang, "es");
  assert.equal(spanish.frameDomain, "sprite-348");
  assert.equal(spanish.visualLocalizationStatus, spec.runtimeContract.visualLocalization);
  assert.equal(spanish.audioRendered, false);

  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.local.timelineId, "sprite-348");
  const built = buildSafeRuntime(await loadInputs(TS_SPEC_PATH));
  assert.match(built.runtime, /var allowedLanguages = \["en","es"\]/);
  assert.match(built.runtime, /visualLocalizationStatus/);

  const promoted = structuredClone(disposition);
  promoted.acceptanceEffects.ownerAcceptance = true;
  assert.throws(
    () => validateBilingualVisualDisposition(spec, promoted),
    /acceptance effects must remain false/
  );

  const result = await generateSafeFfdecCanvasAdapter({
    root: ROOT,
    specPath: TS_SPEC_PATH,
    check: true
  });
  assert.equal(result.animationId, "course-g03-l01-ts-008");
  assert.equal(result.localFrames, 747);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("GS structural adapter uses the canonical lead-in scenario and rejects the old default alias", async () => {
  const {spec, scenarioInventory, audioAudit} = await loadInputs(GS_SPEC_PATH);
  const state = resolveAdapterFrameState({
    frame: 642,
    scenario: "source-drawing-lead-in",
    lang: "en",
    seed: 3
  }, spec);
  assert.equal(state.scenario, "source-drawing-lead-in");
  assert.equal(state.frameDomain, "sprite-787");
  assert.equal(state.localFrame, 642);
  assert.throws(
    () => resolveAdapterFrameState({frame: 642, scenario: "default", lang: "en", seed: 3}, spec),
    /unsupported scenario/
  );
  const evidence = validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit);
  assert.equal(evidence.local.timelineId, "sprite-787");
  const result = await generateSafeFfdecCanvasAdapter({root: ROOT, specPath: GS_SPEC_PATH, check: true});
  assert.equal(result.animationId, "course-g04-l09-gs-002");
  assert.equal(result.localFrames, 653);
});
