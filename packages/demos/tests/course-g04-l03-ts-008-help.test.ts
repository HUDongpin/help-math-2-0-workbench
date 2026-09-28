import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import {Ts008HelpNumberLine} from "../src/modules/course-g04-l03-ts-008-help-number-line";
import {COURSE_G04_L03_TS_008_HELP_GLOSSARY_CONFIG as config} from "../src/timelines/course-g04-l03-ts-008";
import {
  createCourseG04L03SourceGlossaryOpenResult,
  validateCourseG04L03SourceGlossaryConfig,
  visibleCourseG04L03SourceGlossaryTerms,
} from "../src/timelines/course-g04-l03-source-glossary-interaction";

test("TS008 Help glossary binds the three sprite169 frame1 callbacks to bilingual targets", () => {
  validateCourseG04L03SourceGlossaryConfig(config);
  assert.equal(config.frameDomain, "sprite-169");
  assert.deepEqual(config.terms.map(term => [term.characterId, term.keyAttribute]),
    [[166, "Positive number"], [167, "Owe"], [168, "Negative number"]]);
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(config, 2), []);
  for (const term of config.terms) {
    assert.equal(term.firstFrame, 1);
    assert.equal(term.lastFrame, 1);
    for (const lang of ["en", "es"] as const) {
      const result = createCourseG04L03SourceGlossaryOpenResult({config, frame: 1, lang, termId: term.id});
      assert.equal(result?.request.entryId, term.entryIds[lang]);
      assert.equal(result?.request.sourceAnimationId, "course-g04-l03-ts-008");
      assert.equal(result?.request.playbackDisposition, "reversible-support-pause");
    }
  }
});

test("TS008 Help shows all twenty unit intervals and increasing signed values", () => {
  const markup = renderToStaticMarkup(createElement(Ts008HelpNumberLine));
  const ticks = [...markup.matchAll(/data-ts008-number-line-value="(-?\d+)" transform="translate\((\d+),0\)"/g)]
    .map(match => ({value: Number(match[1]), x: Number(match[2])}));
  assert.deepEqual(ticks.map(tick => tick.value), Array.from({length: 21}, (_, i) => i - 10));
  assert.ok(ticks.slice(1).every((tick, i) => tick.x - ticks[i]!.x === 17));
  assert.match(markup, /Owing money/);
  assert.match(markup, /Having money/);
  assert.match(markup, /Numbers increase to the right/);
  assert.match(markup, />−10</);
  assert.match(markup, />0</);
  assert.match(markup, />\+10</);
});
