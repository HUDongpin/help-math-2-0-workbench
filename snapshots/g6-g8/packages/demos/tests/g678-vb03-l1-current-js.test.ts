import assert from "node:assert/strict";
import test from "node:test";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import alg03, {
  SHARED_ALG001_L03_P007_GLOSSARY_TERMS,
} from "../src/modules/shared-alg001-l03-p007";
import {
  SHARED_ALG001_L03_P007_CONFIG,
  SHARED_ALG001_L03_P007_SOURCE,
} from "../src/timelines/shared-alg001-l03-p007";

test("VB03 preserves repeated source terms as distinct source-character controls", () => {
  assert.equal(alg03.key, "shared-alg001-l03-p007");
  assert.equal(alg03.maturity, "private-current-js");
  assert.equal(SHARED_ALG001_L03_P007_SOURCE.deploymentScope, "local-only");
  assert.equal(SHARED_ALG001_L03_P007_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L03_P007_SOURCE.productCalibrationPassed, false);

  const repeated = SHARED_ALG001_L03_P007_GLOSSARY_TERMS.filter(
    (term) => term.id === "variable",
  );
  assert.deepEqual(
    repeated.map((term) => ({
      sourceCharacterId: term.sourceCharacterId,
      sourceKeyAttribute: term.sourceKeyAttribute,
      firstFrame: term.firstFrame,
    })),
    [
      {sourceCharacterId: 12, sourceKeyAttribute: "Variable", firstFrame: 64},
      {sourceCharacterId: 28, sourceKeyAttribute: "variable", firstFrame: 123},
    ],
  );

  const markup = renderToStaticMarkup(createElement(alg03.Renderer, {
    frame: 123,
    frameDomain: SHARED_ALG001_L03_P007_CONFIG.mainFrameDomain,
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "en",
  }));
  assert.match(markup, /data-source-character-id="12"/u);
  assert.match(markup, /data-source-character-id="28"/u);
  assert.match(markup, /data-source-key-attribute="Variable"/u);
  assert.match(markup, /data-source-key-attribute="variable"/u);
  assert.equal(markup.match(/>Variable<\/button>/gu)?.length, 2);
});
