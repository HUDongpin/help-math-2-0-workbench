import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const RUN_ID = "g678-alg-l11-simple-glossary-tranche1-current-js-8-v1";
const OUTPUT_ROOT = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory", RUN_ID);
const IDS = Object.freeze([
  "shared-alg001-l11-p007",
  "shared-alg001-l11-p013",
  "shared-alg001-l11-p016",
  "shared-alg001-l11-p017",
  "shared-alg001-l11-p018",
  "shared-alg001-l11-p022",
  "shared-alg001-l11-p023",
  "shared-alg001-l11-p024",
]);

function constantName(animationId: string) {
  return animationId.replace(/[^A-Za-z0-9]+/gu, "_").toUpperCase();
}

async function candidate(animationId: string) {
  const [moduleNamespace, timeline] = await Promise.all([
    import(`../src/modules/${animationId}`),
    import(`../src/timelines/${animationId}`),
  ]);
  const name = constantName(animationId);
  return {
    module: moduleNamespace.default,
    terms: moduleNamespace[`${name}_GLOSSARY_TERMS`],
    config: timeline[`${name}_CONFIG`],
    source: timeline[`${name}_SOURCE`],
  };
}

test("ALG001 L11 tranche1 modules are private-current-js candidates but remain unregistered", async () => {
  assert.equal(IDS.length, 8);
  for (const animationId of IDS) {
    const {module, terms, config, source} = await candidate(animationId);
    assert.equal(module.key, animationId);
    assert.equal(module.maturity, "private-current-js");
    assert.deepEqual(module.lessonHost, {
      capabilities: ["glossary"],
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    });
    assert.equal(source.deploymentScope, "local-only");
    assert.equal(source.currentJavaScriptRegistered, false);
    assert.equal(source.productCalibrationPassed, false);
    assert.equal(source.engineeringPreviewReady, false);
    assert.ok(terms.length > 0, animationId);
    assert.equal(new Set(terms.map((term: {id: string}) => term.id)).size,
      terms.length, animationId);
    assert.equal(new Set(terms.map((term: {sourceCharacterId: number}) =>
      term.sourceCharacterId)).size, terms.length, animationId);
    const frame = Math.max(...terms.map((term: {firstFrame: number}) =>
      term.firstFrame));
    const markup = renderToStaticMarkup(createElement(module.Renderer, {
      frame, frameDomain: config.mainFrameDomain,
      scenario: "source-static-frame", lang: "en", seed: 0,
      uiLanguage: "es",
    }));
    assert.equal(markup.match(/data-source-character-id=/gu)?.length,
      terms.length, animationId);
    assert.match(markup, /data-source-action="DoHyperLinks"/u);
    assert.match(markup,
      /data-source-animation-stop="modeled-by-modern-host-pause"/u);
    assert.match(markup, /data-source-actionscript-executed="false"/u);
    assert.match(markup, /data-private-current-js="true"/u);
    assert.match(markup,
      /data-registration-status="unregistered-engineering-candidate"/u);
    assert.match(markup, /data-audio-acceptance="pending"/u);
  }
});

test("ALG001 L11 tranche1 runtimes expose immutable deterministic Canvas assets", async () => {
  for (const animationId of IDS) {
    const {config} = await candidate(animationId);
    const runtime = await readFile(path.join(OUTPUT_ROOT, "members",
      animationId, "canvas-renderer.js"), "utf8");
    assert.doesNotMatch(runtime,
      /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u,
      animationId);
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
    new Script(runtime, {filename: `${animationId}.js`})
      .runInNewContext(sandbox);
    const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
      resolveFrameState(request: Readonly<{
        frame: number; scenario: string; lang: string; seed: number;
      }>): Readonly<{
        localFrame: number; exportFrame: number; audioRendered: false;
      }>;
    }>;
    const asset = registry[animationId];
    assert.ok(asset, animationId);
    const property = Object.getOwnPropertyDescriptor(registry, animationId);
    assert.equal(property?.writable, false, animationId);
    assert.equal(property?.configurable, false, animationId);
    for (const frame of [1, config.mainFrameCount]) {
      const state = asset.resolveFrameState({frame,
        scenario: "source-static-frame", lang: "en", seed: 0});
      assert.equal(state.localFrame, frame, animationId);
      assert.equal(state.exportFrame, frame - 1, animationId);
      assert.equal(state.audioRendered, false, animationId);
    }
  }
});

test("ALG001 L11 tranche1 audit binds exact text and the L1 recovery collision", async () => {
  const [audit, fragment, run] = await Promise.all([
    readFile(path.join(PROJECT_ROOT,
      "catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json"),
    "utf8").then(JSON.parse),
    readFile(path.join(PROJECT_ROOT,
      `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`),
    "utf8").then(JSON.parse),
    readFile(path.join(OUTPUT_ROOT, "run-manifest.json"),
      "utf8").then(JSON.parse),
  ]);
  assert.equal(audit.records.length, 8);
  assert.equal(audit.scope.exactButtonScripts, 40);
  assert.equal(audit.scope.exactTextCharacters, 177);
  assert.equal(audit.missingKeytermRecoveryBoundary
    .canonicalSourcePromotionAuthorized, false);
  assert.equal(audit.missingKeytermRecoveryBoundary
    .directReuseOfAlgL09TermPayloads, false);
  const absoluteValue = audit.terms.find((term: {normalizedKey: string}) =>
    term.normalizedKey === "absolute value");
  assert.ok(absoluteValue);
  assert.equal(absoluteValue.sourceCollisionResolution.sourceEntryCounts.en, 2);
  assert.equal(absoluteValue.sourceCollisionResolution.sourceEntryCounts.es, 2);
  assert.deepEqual(absoluteValue.sourceCollisionResolution
    .rejectedMismatchedEntries.en.map((entry: {elementLabel: string}) =>
      entry.elementLabel), ["Accurate"]);
  const inequality = audit.terms.find((term: {normalizedKey: string}) =>
    term.normalizedKey === "inequality");
  assert.deepEqual(inequality.definitions, {
    en: "A mathematical sentence that has the symbols > (greater than), < (less than), ≥ (greater than or equal to), ≤ (less than or equal to), or ≠(not equal).",
    es: "Una expresión matemática que contiene los símbolos > (mayor que), < (menor que), ≥ (mayor o igual que), ≤ (menor o igual que), o ≠ (no es igual que).",
  });
  const reverse = audit.terms.find((term: {normalizedKey: string}) =>
    term.normalizedKey === "reverse");
  assert.equal(reverse.definitions.en,
    "To change directions. For example, to reverse the direction of an inequality symbol for the inequality x > y, change the sign from greater than (>) to less than (<).");
  assert.equal(reverse.definitions.es,
    "Cambiar de dirección. Por ejemplo revertir la dirección de un símbolo de desigualdad en la desigualdad x > y, cambie el signo de mayor que (>) a menor que (<).");
  assert.doesNotMatch(JSON.stringify(audit.terms), /&#x|&gt;|&lt;/iu);
  assert.deepEqual(audit.missingKeytermRecoveryBoundary
    .restrictedEntityDecode.numericWhitelist,
  ["003C", "003E", "2260", "2264", "2265"]);
  assert.deepEqual(audit.missingKeytermRecoveryBoundary
    .restrictedEntityDecode.namedWhitelist, ["gt", "lt"]);
  assert.equal(fragment.entries.length, 8);
  assert.deepEqual(fragment.entries.map((entry: {maturity: string}) =>
    entry.maturity), Array(8).fill("private-current-js"));
  assert.equal(fragment.currentJavaScriptRegisteredCount, 0);
  assert.equal(fragment.productCalibrationPassed, false);
  assert.equal(fragment.engineeringPreviewReady, false);
  assert.equal(run.registryEntriesWritten, 0);
  assert.equal(run.acceptanceEffects.published, false);
});
