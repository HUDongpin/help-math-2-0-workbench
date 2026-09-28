import {COURSE_G04_L03_GS_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-gs-002";
import {COURSE_G04_L03_TS_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ts-002";
import {COURSE_G04_L03_TS_007_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ts-007";
import {COURSE_G04_L03_TS_003_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ts-003";
import {COURSE_G04_L03_TS_004_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ts-004";
import {COURSE_G04_L03_TS_005_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ts-005";
import {COURSE_G04_L03_TI_006_GLOSSARY_CONFIG, COURSE_G04_L03_TI_006_HELP_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ti-006";
import {COURSE_G04_L03_TI_004_GLOSSARY_CONFIG, COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ti-004";
import {COURSE_G04_L03_TI_003_GLOSSARY_CONFIG, COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ti-003";
import {COURSE_G04_L03_TI_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-ti-002";
import assert from "node:assert/strict";
import test from "node:test";

import {
  loadAnimationModule,
  registeredAnimationKeys,
} from "../src/animation-registry";
import {
  createCourseG04L03SourceGlossaryOpenResult,
  validateCourseG04L03SourceGlossaryConfig,
  visibleCourseG04L03SourceGlossaryTerms,
} from "../src/timelines/course-g04-l03-source-glossary-interaction";
import {buildCourseG04L03SourceGlossaryHitStyle} from "../src/modules/course-g04-l03-source-glossary-candidate";
import courseVb005 from "../src/modules/course-g04-l03-vb-005";
import courseVb006 from "../src/modules/course-g04-l03-vb-006";
import courseRw002 from "../src/modules/course-g04-l03-rw-002";
import courseRw004 from "../src/modules/course-g04-l03-rw-004";
import {COURSE_G04_L03_RW_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-rw-002";
import {COURSE_G04_L03_RW_004_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-rw-004";
import {COURSE_G04_L03_VB_005_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-005";
import {COURSE_G04_L03_IN_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-in-002";
import {COURSE_G04_L03_IN_005_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-in-005";
import {COURSE_G04_L03_IN_007_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-in-007";
import {COURSE_G04_L03_IN_008_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-in-008";
import {COURSE_G04_L03_VB_006_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-006";
import {COURSE_G04_L03_VB_002_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-002";
import {COURSE_G04_L03_VB_009_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-009";

test("VB005 source glossary terms remain visible for the complete main timeline", () => {
  for (const frame of [1, 90, 180]) {
    assert.deepEqual(
      visibleCourseG04L03SourceGlossaryTerms(
        COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
        frame,
      ).map(({id}) => id),
      ["negative-number", "less-than", "zero"],
    );
  }
  assert.deepEqual(
    COURSE_G04_L03_VB_005_GLOSSARY_CONFIG.terms.map((term) =>
      term.sourceBounds
    ),
    [
      {left: 79.7635, right: 253.6924, top: 118.9144, bottom: 141.4268},
      {left: 293.3732, right: 378.9559, top: 118.9144, bottom: 141.4268},
      {left: 383.4251, right: 424.7407, top: 118.9144, bottom: 141.4268},
    ],
  );
});

test("source hotspot geometry scales with the responsive 800x600 stage", () => {
  const style = buildCourseG04L03SourceGlossaryHitStyle(
    COURSE_G04_L03_VB_005_GLOSSARY_CONFIG.terms[0]!,
    {width: 800, height: 600},
  );
  assert.match(style.left, /^calc\([0-9.]+% - max\(22px, [0-9.]+%\)\)$/);
  assert.match(style.top, /^calc\([0-9.]+% - max\(22px, [0-9.]+%\)\)$/);
  assert.match(style.width, /^max\(44px, [0-9.]+%\)$/);
  assert.match(style.height, /^max\(44px, [0-9.]+%\)$/);
});

test("VB006 exposes late positive and negative number terms only at frame 116", () => {
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
      115,
    ).map(({id}) => id),
    ["zero", "value"],
  );
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
      116,
    ).map(({id}) => id),
    ["zero", "value", "positive-number", "negative-number"],
  );
  assert.deepEqual(
    visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
      164,
    ).map(({id}) => id),
    [],
  );
});

test("source KeyAttribute releases map to exact language-specific typed keyterm requests", () => {
  const english = createCourseG04L03SourceGlossaryOpenResult({
    config: COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
    frame: 1,
    lang: "en",
    termId: "negative-number",
  });
  assert.deepEqual(english, {
    request: {
      type: "open-keyterm",
      entryId: "en-0411-1954bd66c84d",
      sourceAnimationId: "course-g04-l03-vb-005",
    },
    term: COURSE_G04_L03_VB_005_GLOSSARY_CONFIG.terms[0],
    observedFrame: 1,
    sourceAction: "DoHyperLinks",
    sourceStopTarget: "_root.animation_mc.animation.stop()",
  });

  const spanish = createCourseG04L03SourceGlossaryOpenResult({
    config: COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
    frame: 116,
    lang: "es",
    termId: "positive-number",
  });
  assert.equal(spanish?.request.entryId, "es-0458-9770130a5961");
  assert.equal(
    spanish?.request.sourceAnimationId,
    "course-g04-l03-vb-006",
  );
  assert.equal(spanish?.request.playbackDisposition, undefined);
  assert.equal(spanish?.term.keyAttribute, "Positive number");

  for (const frame of [1098, 1099, 1289, 1290]) {
    const result = createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G04_L03_RW_002_GLOSSARY_CONFIG,
      frame,
      lang: "en",
      termId: "negative-number",
    });
    if (frame < 1099 || frame > 1289) {
      assert.equal(result, null);
    } else {
      assert.deepEqual(result?.request, {
        type: "open-keyterm",
        entryId: "en-0411-1954bd66c84d",
        sourceAnimationId: "course-g04-l03-rw-002",
        playbackDisposition: "reversible-support-pause",
      });
    }
  }
});

test("source glossary adapters declare only the typed memory-only keyterm host capability", () => {
  for (const module of [courseVb005, courseVb006, courseRw002, courseRw004]) {
    assert.deepEqual(module.lessonHost, {
      capabilities: ["keyterm"],
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    });
  }
});

test("G4 L3 admits the keyterm host only on its twenty-eight integrated glossary pages", async () => {
  const admitted: string[] = [];
  for (const key of registeredAnimationKeys.filter((key) => key.startsWith("course-g04-l03-"))) {
    const module = await loadAnimationModule(key);
    if (module?.lessonHost?.capabilities.includes("keyterm")) admitted.push(key);
  }
  assert.deepEqual(admitted.sort(), [
    "course-g04-l03-gs-002",
    "course-g04-l03-in-002",
    "course-g04-l03-in-004",
    "course-g04-l03-in-005",
    "course-g04-l03-in-007",
    "course-g04-l03-in-008",
    "course-g04-l03-in-009",
    "course-g04-l03-in-010",
    "course-g04-l03-in-011",
    "course-g04-l03-in-012",
    "course-g04-l03-rw-002",
    "course-g04-l03-rw-003",
    "course-g04-l03-rw-004",
    "course-g04-l03-ti-002",
    "course-g04-l03-ti-003",
    "course-g04-l03-ti-004",
    "course-g04-l03-ti-006",
    "course-g04-l03-ts-002",
    "course-g04-l03-ts-003",
    "course-g04-l03-ts-004",
    "course-g04-l03-ts-005",
    "course-g04-l03-ts-007",
    "course-g04-l03-ts-008",
    "course-g04-l03-vb-002",
    "course-g04-l03-vb-004",
    "course-g04-l03-vb-005",
    "course-g04-l03-vb-006",
    "course-g04-l03-vb-009",
  ]);
});

test("GS002 exposes both sign terms only during the exact source introduction window", () => {
  for (const frame of [1, 85, 426, 427, 428]) {
    assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_GS_002_GLOSSARY_CONFIG, frame), []);
  }
  for (const frame of [86, 263, 425]) {
    assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_GS_002_GLOSSARY_CONFIG, frame).map((term) => term.keyAttribute), ['Positive sign', 'Negative sign']);
    for (const term of COURSE_G04_L03_GS_002_GLOSSARY_CONFIG.terms) {
      for (const lang of ['en', 'es'] as const) {
        assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_GS_002_GLOSSARY_CONFIG, frame, lang, termId: term.id})?.request.entryId, term.entryIds[lang]);
      }
    }
  }
});

test("invisible, unknown, and invalid-frame term requests fail closed", () => {
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_007_GLOSSARY_CONFIG, 14), []);
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_007_GLOSSARY_CONFIG, 15).map((term) => term.id), ["pattern", "symbol", "set"]);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_007_GLOSSARY_CONFIG, frame: 82, lang: "en", termId: "rule"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_007_GLOSSARY_CONFIG, frame: 83, lang: "en", termId: "rule"})?.request.entryId, "en-0594-2fc559859c42");
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_008_GLOSSARY_CONFIG, frame: 17, lang: "en", termId: "pattern"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_008_GLOSSARY_CONFIG, frame: 18, lang: "en", termId: "pattern"})?.request.entryId, "en-0459-b510b9647e1c");
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_005_GLOSSARY_CONFIG, 51), []);
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_005_GLOSSARY_CONFIG, 52).map((term) => term.id), ["order", "least", "greatest"]);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_005_GLOSSARY_CONFIG, frame: 144, lang: "en", termId: "least"})?.request.entryId, "en-0336-e901fd012b0c");
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, 2), []);
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, 3).map((term) => term.id), ["number-line", "line", "order", "value"]);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, frame: 92, lang: "en", termId: "positive-number"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, frame: 93, lang: "en", termId: "positive-number"})?.request.entryId, "en-0499-e54dca5d8b22");
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, frame: 236, lang: "en", termId: "negative-number"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_IN_002_GLOSSARY_CONFIG, frame: 237, lang: "en", termId: "negative-number"})?.request.entryId, "en-0411-1954bd66c84d");
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_VB_002_GLOSSARY_CONFIG, 123).map((term) => term.id), ["number-line", "line", "order", "value"]);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_002_GLOSSARY_CONFIG, frame: 123, lang: "en", termId: "positive-number"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_002_GLOSSARY_CONFIG, frame: 124, lang: "en", termId: "positive-number"})?.request.entryId, "en-0499-e54dca5d8b22");
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_002_GLOSSARY_CONFIG, frame: 176, lang: "en", termId: "negative-number"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_002_GLOSSARY_CONFIG, frame: 177, lang: "en", termId: "negative-number"})?.request.entryId, "en-0411-1954bd66c84d");
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_009_GLOSSARY_CONFIG, frame: 72, lang: "en", termId: "rule"}), null);
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_VB_009_GLOSSARY_CONFIG, frame: 73, lang: "en", termId: "rule"})?.request.entryId, "en-0594-2fc559859c42");
  for (const [frame, expected] of [
    [370, []],
    [371, ["represent"]],
    [423, ["represent"]],
    [424, ["represent", "negative-number"]],
    [442, ["represent", "negative-number"]],
    [443, []],
  ] as const) {
    assert.deepEqual(
      visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_RW_004_GLOSSARY_CONFIG, frame).map((term) => term.id),
      expected,
    );
  }
  assert.equal(createCourseG04L03SourceGlossaryOpenResult({
    config: COURSE_G04_L03_RW_004_GLOSSARY_CONFIG,
    frame: 371,
    lang: "en",
    termId: "represent",
  })?.request.entryId, "en-0574-48a09f6ed01d");
  assert.equal(
    createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
      frame: 115,
      lang: "en",
      termId: "positive-number",
    }),
    null,
  );
  assert.equal(
    createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
      frame: 10,
      lang: "en",
      termId: "not-a-source-term",
    }),
    null,
  );
  for (const frame of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.deepEqual(
      visibleCourseG04L03SourceGlossaryTerms(
        COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
        frame,
      ),
      [],
    );
    assert.equal(
      createCourseG04L03SourceGlossaryOpenResult({
        config: COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
        frame,
        lang: "en",
        termId: "negative-number",
      }),
      null,
    );
  }
});

test("glossary configurations are frozen and reject widened authority", () => {
  assert.equal(
    validateCourseG04L03SourceGlossaryConfig(
      COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
    ),
    COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_VB_005_GLOSSARY_CONFIG), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_VB_005_GLOSSARY_CONFIG.terms), true);
  assert.throws(
    () => validateCourseG04L03SourceGlossaryConfig({
      ...COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
      glossarySourceDisposition: "lesson-specific-runtime-accepted",
    } as never),
    /Invalid source glossary candidate configuration/,
  );
  assert.throws(
    () => validateCourseG04L03SourceGlossaryConfig({
      ...COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
      playbackDisposition: "resume-without-user-action",
    } as never),
    /Invalid source glossary candidate configuration/,
  );
});


test("TI002 consolidates repeated callback instances without widening visible source phases", () => {
  const config = COURSE_G04_L03_TI_002_GLOSSARY_CONFIG;
  assert.equal(visibleCourseG04L03SourceGlossaryTerms(config, 10).length, 0);
  for (const frame of [11, 15, 16, 22, 23, 238, 254]) {
    const terms = visibleCourseG04L03SourceGlossaryTerms(config, frame);
    assert.equal(terms.length, 8);
    assert.equal(new Set(terms.map((term) => term.keyAttribute)).size, 8);
    assert.equal(terms.some((term) => term.keyAttribute === "Ordering"), frame < 23);
    assert.equal(terms.some((term) => term.keyAttribute === "Order"), frame >= 23);
  }
  assert.equal(visibleCourseG04L03SourceGlossaryTerms(config, 255).length, 0);
});


test("TI003 keeps main-timeline glossary visibility separate from the help popup", () => {
  const keys = (frame: number) => visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_TI_003_GLOSSARY_CONFIG, frame).map((term) => term.keyAttribute).sort();
  for (const frame of [1, 3, 7, 141]) assert.deepEqual(keys(frame), []);
  for (const frame of [4, 6, 8, 84]) assert.deepEqual(keys(frame), ["Position"]);
  for (const frame of [85, 87, 88, 139, 140]) assert.deepEqual(keys(frame), ["Number line", "Position"]);
  validateCourseG04L03SourceGlossaryConfig(COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG);
  assert.deepEqual(COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG.terms.map((term) => term.keyAttribute), ["Number line", "Line", "Order", "Value", "Negative number", "Positive number"]);
  for (const term of COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG.terms) {
    for (const frame of [138, 140]) assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG, frame, lang: "en", termId: term.id}), null);
    for (const lang of ["en", "es"] as const) {
      const result = createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_TI_003_HELP_GLOSSARY_CONFIG, frame: 139, lang, termId: term.id});
      assert.equal(result?.request.entryId, term.entryIds[lang]);
      assert.equal(result?.request.playbackDisposition, "reversible-support-pause");
      assert.equal(result?.request.sourceAnimationId, "course-g04-l03-ti-003");
    }
  }
});


test("TI004 exposes three main terms and five distinct help terms without the unplaced Decimal symbol", () => {
  const keys = (frame: number) => visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_TI_004_GLOSSARY_CONFIG, frame).map((term) => term.keyAttribute).sort();
  for (const frame of [1, 3, 7, 126]) assert.deepEqual(keys(frame), []);
  for (const frame of [4, 6, 8, 86]) assert.deepEqual(keys(frame), ["Order"]);
  for (const frame of [87, 124, 125]) assert.deepEqual(keys(frame), ["Greatest", "Least", "Order"]);
  validateCourseG04L03SourceGlossaryConfig(COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG);
  assert.deepEqual(COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG.terms.map((term) => term.keyAttribute), ["Value", "Negative number", "Decrease", "Positive number", "Increase"]);
  for (const term of COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG.terms) {
    for (const frame of [123, 125]) assert.equal(createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG, frame, lang: "en", termId: term.id}), null);
    for (const lang of ["en", "es"] as const) {
      const result = createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_TI_004_HELP_GLOSSARY_CONFIG, frame: 124, lang, termId: term.id});
      assert.equal(result?.request.entryId, term.entryIds[lang]);
      assert.equal(result?.request.sourceAnimationId, "course-g04-l03-ti-004");
      assert.equal(result?.request.playbackDisposition, "reversible-support-pause");
    }
  }
});


test("TI006 glossary visibility follows its exact source frame windows", () => {
  for (const [frame, expected] of [
    [3, []], [4, ["Position"]], [5, ["Position"]], [6, []],
    [7, ["Position"]], [113, ["Position"]],
    [114, ["Position", "Number line", "Owe"]],
    [166, ["Position", "Number line", "Owe"]],
    [167, ["Position", "Number line", "Owe"]], [168, []],
  ] as const) {
    assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(
      COURSE_G04_L03_TI_006_GLOSSARY_CONFIG, frame,
    ).map((term) => term.keyAttribute), expected);
  }
  assert.deepEqual([...new Set(COURSE_G04_L03_TI_006_GLOSSARY_CONFIG.terms.map((term) => term.keyAttribute))],
    ["Position", "Number line", "Owe"]);
});

test("TI006 Help maps only its three source terms at the live Help frame", () => {
  assert.deepEqual(COURSE_G04_L03_TI_006_HELP_GLOSSARY_CONFIG.terms.map((term) => term.keyAttribute),
    ["Owe", "Negative number", "Positive number"]);
  for (const term of COURSE_G04_L03_TI_006_HELP_GLOSSARY_CONFIG.terms) {
    for (const lang of ["en", "es"] as const) {
      const result = createCourseG04L03SourceGlossaryOpenResult({
        config: COURSE_G04_L03_TI_006_HELP_GLOSSARY_CONFIG, frame: 166, lang, termId: term.id,
      });
      assert.equal(result?.request.entryId, term.entryIds[lang]);
      assert.equal(result?.request.sourceAnimationId, "course-g04-l03-ti-006");
      assert.equal(result?.request.playbackDisposition, "reversible-support-pause");
      for (const frame of [165, 167]) assert.equal(createCourseG04L03SourceGlossaryOpenResult({
        config: COURSE_G04_L03_TI_006_HELP_GLOSSARY_CONFIG, frame, lang, termId: term.id,
      }), null);
    }
  }
});
test("four-step-plan glossary controls preserve source windows without duplicate lookup targets", () => {
  const cases = [
    [COURSE_G04_L03_TS_002_GLOSSARY_CONFIG, 355, 85],
    [COURSE_G04_L03_TS_003_GLOSSARY_CONFIG, 241, 24],
    [COURSE_G04_L03_TS_004_GLOSSARY_CONFIG, 336, 22],
    [COURSE_G04_L03_TS_005_GLOSSARY_CONFIG, 275, 112],
  ] as const;
  for (const [config, end, first] of cases) {
    assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(config, first - 1), []);
    assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(config, end + 1), []);
    for (let frame = first; frame <= end; frame += 1) {
      const terms = visibleCourseG04L03SourceGlossaryTerms(config, frame);
      assert.equal(new Set(terms.map((term) => term.entryIds.en)).size, terms.length);
      for (const term of terms) {
        for (const lang of ['en', 'es'] as const) {
          assert.equal(createCourseG04L03SourceGlossaryOpenResult({config, frame, lang, termId: term.id})?.request.entryId, term.entryIds[lang]);
        }
      }
    }
  }
  const titles = (config: typeof COURSE_G04_L03_TS_004_GLOSSARY_CONFIG, frame: number) =>
    visibleCourseG04L03SourceGlossaryTerms(config, frame).map((term) => term.labels.en);
  assert.deepEqual(titles(COURSE_G04_L03_TS_004_GLOSSARY_CONFIG, 85), ['Strategy', 'Data tables']);
  assert.deepEqual(titles(COURSE_G04_L03_TS_004_GLOSSARY_CONFIG, 110), ['Strategy', 'Data tables']);
  assert.ok(!titles(COURSE_G04_L03_TS_004_GLOSSARY_CONFIG, 111).includes('Data tables'));
  const question = visibleCourseG04L03SourceGlossaryTerms(COURSE_G04_L03_TS_002_GLOSSARY_CONFIG, 155)
    .find((term) => term.keyAttribute === 'question');
  assert.equal(question?.entryIds.en, 'en-0536-4421c49635ec');
  assert.equal(question?.entryIds.es, 'es-0520-f501c3e40839');
});

test("TS007 keeps both source glossary targets throughout the 696-frame domain", () => {
  const config = COURSE_G04_L03_TS_007_GLOSSARY_CONFIG;
  for (const frame of [Number.NaN, 697]) assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(config, frame), []);
  assert.deepEqual(visibleCourseG04L03SourceGlossaryTerms(config, 0),
    visibleCourseG04L03SourceGlossaryTerms(config, 1));
  for (let frame = 1; frame <= 696; frame += 1) {
    const terms = visibleCourseG04L03SourceGlossaryTerms(config, frame);
    assert.deepEqual(terms.map(term => term.keyAttribute), ["Symbol", "Number line"]);
    for (const lang of ["en", "es"] as const) {
      assert.equal(new Set(terms.map(term => term.entryIds[lang])).size, 2);
      for (const term of terms) {
        const result = createCourseG04L03SourceGlossaryOpenResult({config, frame, lang, termId: term.id});
        assert.equal(result?.request.entryId, term.entryIds[lang]);
        assert.equal(result?.request.sourceAnimationId, "course-g04-l03-ts-007");
        assert.equal(result?.request.playbackDisposition, "reversible-support-pause");
      }
    }
  }
});
