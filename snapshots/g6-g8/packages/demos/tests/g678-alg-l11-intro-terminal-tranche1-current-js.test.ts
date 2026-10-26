import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {resetAlgL11GlossaryRequestStatusOnReplay} from
  "../src/private-source-static-alg-l11-intro-terminal-candidate";

import p001, {SHARED_ALG001_L11_P001_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l11-p001";
import {SHARED_ALG001_L11_P001_CONFIG, SHARED_ALG001_L11_P001_SOURCE} from
  "../src/timelines/shared-alg001-l11-p001";
import p002, {SHARED_ALG001_L11_P002_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l11-p002";
import {SHARED_ALG001_L11_P002_CONFIG, SHARED_ALG001_L11_P002_SOURCE} from
  "../src/timelines/shared-alg001-l11-p002";
import p003, {SHARED_ALG001_L11_P003_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l11-p003";
import {SHARED_ALG001_L11_P003_CONFIG, SHARED_ALG001_L11_P003_SOURCE} from
  "../src/timelines/shared-alg001-l11-p003";
import p004, {SHARED_ALG001_L11_P004_GLOSSARY_TERMS} from
  "../src/modules/shared-alg001-l11-p004";
import {SHARED_ALG001_L11_P004_CONFIG, SHARED_ALG001_L11_P004_SOURCE} from
  "../src/timelines/shared-alg001-l11-p004";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1",
);

const candidates = [
  [p001, SHARED_ALG001_L11_P001_CONFIG, SHARED_ALG001_L11_P001_SOURCE,
    SHARED_ALG001_L11_P001_GLOSSARY_TERMS,
    "script-free-intro-modern-once-clamp"],
  [p002, SHARED_ALG001_L11_P002_CONFIG, SHARED_ALG001_L11_P002_SOURCE,
    SHARED_ALG001_L11_P002_GLOSSARY_TERMS,
    "explicit-source-terminal-stop"],
  [p003, SHARED_ALG001_L11_P003_CONFIG, SHARED_ALG001_L11_P003_SOURCE,
    SHARED_ALG001_L11_P003_GLOSSARY_TERMS,
    "no-explicit-source-terminal-stop-modern-once-clamp"],
  [p004, SHARED_ALG001_L11_P004_CONFIG, SHARED_ALG001_L11_P004_SOURCE,
    SHARED_ALG001_L11_P004_GLOSSARY_TERMS,
    "explicit-source-terminal-stop"],
] as const;

test("ALG L11 tranche1 binds exact frame ends, stop dispositions, and glossary controls", () => {
  assert.deepEqual(candidates.map(([, config]) => config.mainFrameCount),
    [130, 780, 1701, 1353]);
  assert.deepEqual(candidates.map(([, , , terms]) => terms.length),
    [0, 1, 5, 2]);
  assert.deepEqual(
    [
      ...SHARED_ALG001_L11_P002_GLOSSARY_TERMS,
      ...SHARED_ALG001_L11_P003_GLOSSARY_TERMS,
      ...SHARED_ALG001_L11_P004_GLOSSARY_TERMS,
    ].map((term) => [term.sourceCharacterId, term.firstFrame,
      term.lastFrame, term.sourceKeyAttribute]),
    [
      [181, 584, 780, "Inequality"],
      [228, 697, 994, "Inequality"], [229, 697, 994, "Sentence"],
      [233, 737, 994, "Symbol"], [234, 737, 994, "Greater than"],
      [237, 771, 994, "Less than"], [332, 1290, 1353, "Represent"],
      [333, 1290, 1353, "Inequality"],
    ],
  );
  const inequality = SHARED_ALG001_L11_P002_GLOSSARY_TERMS[0];
  assert.equal(inequality.definitions.en,
    "A mathematical sentence that has the symbols > (greater than), < (less than), ≥ (greater than or equal to), ≤ (less than or equal to), or ≠(not equal).");
  assert.equal(inequality.definitions.es,
    "Una expresión matemática que contiene los símbolos > (mayor que), < (menor que), ≥ (mayor o igual que), ≤ (menor o igual que), o ≠ (no es igual que).");
  assert.doesNotMatch(JSON.stringify(inequality.definitions), /&#x/u);
  assert.equal(resetAlgL11GlossaryRequestStatusOnReplay(), "idle");

  for (const [module, config, source, terms, stopDisposition] of candidates) {
    assert.equal(module.key, config.animationId);
    assert.equal(module.maturity, "private-current-js");
    assert.deepEqual(module.lessonHost?.capabilities,
      terms.length > 0 ? ["glossary"] : []);
    assert.equal(source.adapterFamily,
      "alg-l11-intro-terminal-tranche1-source-static");
    assert.equal(source.registrationCandidate, false);
    assert.equal(source.currentJavaScriptRegistered, false);
    assert.equal(source.productCalibrationPassed, false);
    assert.equal(config.playbackMode, "once");
    assert.equal(config.livePlaybackEndFrame, config.mainFrameCount);

    const markup = renderToStaticMarkup(createElement(module.Renderer, {
      frame: config.mainFrameCount,
      frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      uiLanguage: "es",
      replay: 3,
    }));
    assert.match(markup, /data-product-calibration-passed="false"/u);
    assert.match(markup, /data-source-actionscript-executed="false"/u);
    assert.match(markup, /data-replay-reset="base-candidate-complete-state"/u);
    assert.match(markup, new RegExp(
      `data-source-stop-disposition="${stopDisposition}"`, "u"));
    const visibleAtTerminal = terms.filter((term) =>
      term.firstFrame <= config.mainFrameCount &&
      config.mainFrameCount <= term.lastFrame);
    assert.equal(markup.match(/data-source-character-id=/gu)?.length ?? 0,
      visibleAtTerminal.length);
    if (visibleAtTerminal.length > 0) {
      assert.match(markup, /data-source-action="DoHyperLinks"/u);
      assert.match(markup,
        /data-source-animation-stop="modeled-by-modern-host-pause"/u);
      assert.equal(markup.match(/ disabled=""/gu)?.length ?? 0,
        visibleAtTerminal.length,
        `${config.animationId} must fail closed without a host`);
    }
  }

  const renderP003 = (frame: number) => renderToStaticMarkup(createElement(
    p003.Renderer,
    {frame, frameDomain: SHARED_ALG001_L11_P003_CONFIG.mainFrameDomain,
      scenario: "source-static-frame", lang: "en", seed: 0,
      uiLanguage: "en"},
  ));
  assert.equal(renderP003(994).match(/data-source-character-id=/gu)?.length,
    5);
  assert.equal(renderP003(995).match(/data-source-character-id=/gu)?.length ?? 0,
    0);
  assert.equal(renderP003(1701).match(/data-source-character-id=/gu)?.length ?? 0,
    0);
});

test("ALG L11 tranche1 runtimes resolve first and terminal frames deterministically", async () => {
  for (const [, config] of candidates) {
    const runtime = await readFile(path.join(
      OUTPUT_ROOT, "members", config.animationId, "canvas-renderer.js",
    ), "utf8");
    assert.doesNotMatch(runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u,
      config.animationId);
    const sandbox = {
      document: {
        createElement(tagName: string) {
          if (tagName === "canvas") {
            return {getContext: () => ({}), width: 0, height: 0};
          }
          if (tagName === "img") {
            return {complete: true, naturalWidth: 1, naturalHeight: 1,
              decode: async () => undefined};
          }
          throw new Error(`unexpected runtime element: ${tagName}`);
        },
      },
    } as Record<string, unknown>;
    new Script(runtime, {filename: `${config.animationId}.js`})
      .runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
      resolveFrameState(request: Readonly<{
        frame: number;
        scenario: string;
        lang: string;
        seed: number;
      }>): Readonly<{localFrame: number; exportFrame: number; audioRendered: false}>;
    }>;
    const asset = registry[config.animationId];
    assert.ok(asset, config.animationId);
    const property = Object.getOwnPropertyDescriptor(registry,
      config.animationId);
    assert.equal(property?.writable, false, config.animationId);
    assert.equal(property?.configurable, false, config.animationId);
    for (const frame of [1, config.mainFrameCount]) {
      const state = asset.resolveFrameState({frame,
        scenario: "source-static-frame", lang: "en", seed: 0});
      assert.equal(state.localFrame, frame, config.animationId);
      assert.equal(state.exportFrame, frame - 1, config.animationId);
      assert.equal(state.audioRendered, false, config.animationId);
    }
  }
});

test("ALG L11 tranche1 keeps registration and acceptance effects closed", async () => {
  const fragment = JSON.parse(await readFile(path.join(
    PROJECT_ROOT,
    "catalog/product-bridge-calibrations/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1.fragment.json",
  ), "utf8"));
  assert.equal(fragment.generatedPlacementCount, 4);
  assert.equal(fragment.registrationCandidatePlacementCount, 0);
  assert.equal(fragment.currentJavaScriptRegisteredCount, 0);
  assert.equal(fragment.overallProductCalibrationPassed, false);
  assert.ok(Object.values(fragment.acceptanceEffects).every(
    (value) => value === false));

  const expectedStops = [false, true, false, true];
  for (const [index, [, config]] of candidates.entries()) {
    const manifest = JSON.parse(await readFile(path.join(
      OUTPUT_ROOT, "members", config.animationId, "member-manifest.json",
    ), "utf8"));
    assert.equal(manifest.product.registrationCandidate, false);
    assert.equal(manifest.product.currentJavaScriptRegistered, false);
    assert.equal(manifest.product.productCalibrationPassed, false);
    assert.equal(manifest.product.sourceTerminalStopBound,
      expectedStops[index]);
    assert.ok(Object.values(manifest.acceptanceEffects).every(
      (value) => value === false));
  }
});
