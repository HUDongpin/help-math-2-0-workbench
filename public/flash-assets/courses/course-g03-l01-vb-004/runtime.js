/* Generated deterministic engineering adapter. No ambient playback loop or legacy side effects. */
(function (global, document) {
  "use strict";
  var contract = Object.freeze({"animationId":"course-g03-l01-vb-004","stage":{"width":800,"height":600,"backgroundColor":"#B8D8F7"},"fps":12,"rootFrameCount":10,"rootFrame":6,"rootExportFrame":5,"localFrameCount":222,"quizStopFrame":56,"defaultScenario":"linear-to-quiz-stop","defaultFrameDomain":"sprite-231","scenarios":{"linear-to-quiz-stop":{"id":"linear-to-quiz-stop","frameDomain":"sprite-231","frameStart":1,"frameEndInclusive":222,"naturalPlaybackEndFrame":56,"claim":"source-structured automatic path ends at frame 56; explicit frames 57 through 222 are source-structural renderer inspection only and do not claim post-stop reachability"},"authoring-frame-inspection":{"id":"authoring-frame-inspection","frameDomain":"sprite-231","frameStart":1,"frameEndInclusive":222,"claim":"engineering-only structural frame inspection; frames after 56 are not claimed runtime-reachable"},"root-standalone":{"id":"root-standalone","frameDomain":"root","frameStart":1,"frameEndInclusive":10,"naturalPlaybackEndFrame":1,"claim":"source root frames addressed from root structure and the hash-bound Adobe standalone sequential-step baseline; accepted implementation comparison remains separate"}},"supportedLanguages":["en","es"],"visualLocalizationStatus":"source-shared-untranslated-visual","audioLocalizationStatus":"unresolved","audioStatus":"blocked-until-authoritative-listening-and-cue-mapping","interactionStatus":"blocked-until-host-bindings-branches-scoring-and-replay-are-proven","spanishStatus":"single-source-English-visual-rendered-untranslated; Spanish-audio-and-bilingual-parity-unresolved","seedStatus":"recorded-only-no-random-behavior-implemented","rootInstructionFullRevealFrames":[9,10],"rootInstructionPartialRevealFrames":[{"frame":7,"clipRightExclusive":291,"baselineVisibleBounds":{"x":80,"y":145,"width":211,"height":21}},{"frame":8,"clipRightExclusive":361,"baselineVisibleBounds":{"x":80,"y":145,"width":281,"height":21}}],"rootClass":"L1VB04workingcopy_HTML5Canvas","atlases":[{"id":"L1VB04_working_copy_HTML5 Canvas_atlas_1","elementId":"atlas-1"},{"id":"L1VB04_working_copy_HTML5 Canvas_atlas_2","elementId":"atlas-2"}]});
  var canvas = document.getElementById("flash-stage");
  var status = document.getElementById("runtime-status");
  var context = canvas.getContext("2d", {alpha: false});
  var exportBundle = null;
  var exportRoot = null;
  var currentState = null;

  function requireSafeInteger(raw, label, fallback) {
    if (raw === null || raw === undefined || raw === "") return fallback;
    if (!/^-?\d+$/.test(String(raw))) throw new Error(label + " must be a safe integer");
    var value = Number(raw);
    if (!Number.isSafeInteger(value)) throw new Error(label + " must be a safe integer");
    return value;
  }

  function resolveRequest(request) {
    request = request || {};
    var scenarioId = request.scenario || contract.defaultScenario;
    var scenario = contract.scenarios[scenarioId];
    if (!scenario) throw new Error("unsupported scenario: " + scenarioId);
    var frameDomain = request.frameDomain || contract.defaultFrameDomain;
    if (frameDomain !== scenario.frameDomain) throw new Error("scenario " + scenarioId + " requires frameDomain " + scenario.frameDomain);
    var frame = requireSafeInteger(request.frame, "frame", 1);
    if (frame < scenario.frameStart || frame > scenario.frameEndInclusive) {
      throw new Error("frame must be within " + scenario.frameStart + ".." + scenario.frameEndInclusive + " for scenario " + scenarioId);
    }
    var lang = request.lang || "en";
    if (contract.supportedLanguages.indexOf(lang) < 0) throw new Error("unsupported source-proven language: " + lang);
    var seed = requireSafeInteger(request.seed, "seed", 0) >>> 0;
    var rootDomain = frameDomain === "root";
    var naturalPlaybackEndFrame = scenario.naturalPlaybackEndFrame === undefined ? contract.quizStopFrame : scenario.naturalPlaybackEndFrame;
    var afterNaturalStop = frame > naturalPlaybackEndFrame;
    var partialInstructionReveal = rootDomain ? contract.rootInstructionPartialRevealFrames.find(function (entry) { return entry.frame === frame; }) : null;
    return Object.freeze({
      frame: frame,
      frameDomain: frameDomain,
      localFrame: rootDomain ? (frame >= contract.rootFrame ? frame : null) : frame,
      exportFrame: frame - 1,
      rootFrame: rootDomain ? frame : contract.rootFrame,
      exportRootFrame: rootDomain ? frame - 1 : contract.rootExportFrame,
      scenario: scenarioId,
      lang: lang,
      seed: seed,
      runtimeReachability: rootDomain ? "source-standalone-sequential-step" : (afterNaturalStop || scenarioId === "authoring-frame-inspection" ? "structural-only-runtime-reachability-unproven" : "source-structured-linear-to-stop"),
      interactionBoundary: !rootDomain && frame === contract.quizStopFrame,
      visualLocalizationStatus: contract.visualLocalizationStatus,
      audioLocalizationStatus: contract.audioLocalizationStatus,
      audioStatus: contract.audioStatus,
      interactionStatus: contract.interactionStatus,
      spanishStatus: contract.spanishStatus,
      instructionCorrection: partialInstructionReveal ? "authoritative-swf-vector-partial-reveal" : (rootDomain && contract.rootInstructionFullRevealFrames.indexOf(frame) >= 0 ? "authoritative-swf-vector-full-reveal" : "none"),
      instructionClipRight: partialInstructionReveal ? partialInstructionReveal.clipRightExclusive : null,
      glyphCorrection: (!rootDomain || frame >= contract.rootFrame) && frame <= 56 ? "authoritative-swf-vector-chart" : "none"
    });
  }

  function queryRequest() {
    var params = new URL(document.URL).searchParams;
    return {
      frameDomain: params.get("frameDomain"),
      frame: params.get("frame"),
      scenario: params.get("scenario"),
      lang: params.get("lang"),
      seed: params.get("seed")
    };
  }

  function restoreChartVisibility(animation) {
    if (animation.instance) animation.instance.visible = true;
    for (var index = 1; index <= 15; index += 1) {
      if (animation["instance_" + index]) animation["instance_" + index].visible = true;
    }
    if (animation.instance_17) animation.instance_17.visible = true;
  }

  function suppressSubstitutedChart(animation, localFrame) {
    if (localFrame <= 55 && animation.instance) animation.instance.visible = false;
    if (localFrame === 56) {
      for (var index = 1; index <= 15; index += 1) {
        if (animation["instance_" + index]) animation["instance_" + index].visible = false;
      }
    }
  }

  function suppressSubstitutedInstruction(animation, state) {
    if (state.instructionCorrection !== "none" && animation.instance_17) {
      animation.instance_17.visible = false;
    }
  }

  function setEvidenceAttributes(state) {
    canvas.setAttribute("data-flash-frame", String(state.frame));
    canvas.setAttribute("data-flash-frame-domain", state.frameDomain);
    canvas.setAttribute("data-flash-root-frame", String(state.rootFrame));
    canvas.setAttribute("data-flash-scenario", state.scenario);
    canvas.setAttribute("data-flash-lang", state.lang);
    canvas.setAttribute("data-flash-seed", String(state.seed));
    canvas.setAttribute("data-runtime-reachability", state.runtimeReachability);
    canvas.setAttribute("data-visual-localization-status", state.visualLocalizationStatus);
    canvas.setAttribute("data-audio-localization-status", state.audioLocalizationStatus);
    canvas.setAttribute("data-audio-status", state.audioStatus);
    canvas.setAttribute("data-interaction-status", state.interactionStatus);
    canvas.setAttribute("data-spanish-status", state.spanishStatus);
    canvas.setAttribute("data-instruction-correction", state.instructionCorrection);
    canvas.setAttribute("data-instruction-clip-right", state.instructionClipRight === null ? "none" : String(state.instructionClipRight));
    canvas.setAttribute("data-glyph-correction", state.glyphCorrection);
    canvas.setAttribute("data-render-state", "ready");
    document.documentElement.setAttribute("data-flash-frame", String(state.frame));
    document.documentElement.setAttribute("data-flash-frame-domain", state.frameDomain);
    document.documentElement.setAttribute("data-flash-root-frame", String(state.rootFrame));
    document.documentElement.setAttribute("data-flash-scenario", state.scenario);
    document.documentElement.setAttribute("data-flash-lang", state.lang);
    document.documentElement.setAttribute("data-flash-seed", String(state.seed));
    document.documentElement.setAttribute("data-render-state", "ready");
  }

  function render(request) {
    if (!exportRoot) throw new Error("adapter assets are not ready");
    var state = resolveRequest(request);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.fillStyle = contract.stage.backgroundColor;
    context.fillRect(0, 0, contract.stage.width, contract.stage.height);
    context.restore();
    exportRoot.gotoAndStop(state.exportRootFrame);
    if (state.localFrame !== null) {
      if (!exportRoot.animation) throw new Error("Animation03 is absent at the requested composite frame");
      restoreChartVisibility(exportRoot.animation);
      exportRoot.animation.gotoAndStop(state.localFrame - 1);
      suppressSubstitutedChart(exportRoot.animation, state.localFrame);
      suppressSubstitutedInstruction(exportRoot.animation, state);
    }
    exportRoot.draw(context, false);
    if (state.localFrame !== null && state.localFrame <= 56) {
      global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_CHART(context, state.localFrame);
    }
    if (state.instructionCorrection !== "none") {
      global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_INSTRUCTION(context, state.instructionClipRight);
    }
    if (global.createjs.Ticker && global.createjs.Ticker._inited) throw new Error("CreateJS Ticker unexpectedly initialized");
    currentState = state;
    setEvidenceAttributes(state);
    status.textContent = "Engineering candidate · " + state.frameDomain + " frame " + state.frame + "/" + (state.frameDomain === "root" ? contract.rootFrameCount : contract.localFrameCount) + " · " + state.scenario;
    return state;
  }

  function decodedImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);
    return image.decode().then(function () { return image; });
  }

  function start() {
    var atlasImages = contract.atlases.map(function (atlas) {
      return document.getElementById(atlas.elementId);
    });
    return Promise.all(atlasImages.map(decodedImage)).then(function () {
      if (!global.createjs || !global.createjs.MovieClip || !global.createjs.Tween) throw new Error("pinned CreateJS modules did not load");
      if (global.createjs.Ticker && global.createjs.Ticker._inited) throw new Error("CreateJS Ticker initialized before adapter construction");
      global.createjs.Tween._inited = true;
      exportBundle = global.HELP_MATH_VB004_INSTALL_EXPORT(global.createjs);
      contract.atlases.forEach(function (atlas, index) { exportBundle.installAtlas(atlas.id, atlasImages[index]); });
      var RootClass = exportBundle.library[contract.rootClass];
      if (typeof RootClass !== "function") throw new Error("Animate root class is unavailable");
      exportRoot = new RootClass();
      if (!exportRoot.animation || exportRoot.animation.totalFrames !== contract.localFrameCount) throw new Error("Animation03 frame count mismatch");
      return render(queryRequest());
    });
  }

  function fail(error) {
    var message = error && error.message ? error.message : String(error);
    canvas.setAttribute("data-render-state", "error");
    canvas.setAttribute("data-runtime-error", message);
    document.documentElement.setAttribute("data-render-state", "error");
    status.textContent = "Blocked: " + message;
  }

  global.HELP_MATH_VB004 = Object.freeze({
    contract: contract,
    render: render,
    resolveRequest: resolveRequest,
    getState: function () { return currentState; },
    getDiagnostics: function () {
      return Object.freeze({
        rootCurrentFrame: exportRoot ? exportRoot.currentFrame : null,
        localCurrentFrame: exportRoot && exportRoot.animation ? exportRoot.animation.currentFrame : null,
        rootPaused: exportRoot ? exportRoot.paused : null,
        localPaused: exportRoot && exportRoot.animation ? exportRoot.animation.paused : null,
        tickerInitialized: Boolean(global.createjs && global.createjs.Ticker && global.createjs.Ticker._inited),
        tweenHeadPresent: Boolean(global.createjs && global.createjs.Tween && global.createjs.Tween._tweenHead)
      });
    }
  });
  start().catch(fail);
})(window, document);
