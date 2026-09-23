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
import {COURSE_G04_L03_VB_005_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-005";
import {COURSE_G04_L03_VB_006_GLOSSARY_CONFIG} from "../src/timelines/course-g04-l03-vb-006";

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
});

test("source glossary adapters declare only the typed memory-only keyterm host capability", () => {
  for (const module of [courseVb005, courseVb006]) {
    assert.deepEqual(module.lessonHost, {
      capabilities: ["keyterm"],
      legacyOperations: "blocked",
      auditStorage: "memory-only",
      storesPersonalData: false,
    });
  }
});

test("only VB005, VB006, and RW003 admit the registered keyterm host capability", async () => {
  const admitted: string[] = [];
  for (const key of registeredAnimationKeys) {
    const module = await loadAnimationModule(key);
    if (module?.lessonHost?.capabilities.includes("keyterm")) admitted.push(key);
  }
  assert.deepEqual(admitted.sort(), [
    "course-g04-l03-rw-003",
    "course-g04-l03-vb-005",
    "course-g04-l03-vb-006",
  ]);
});

test("invisible, unknown, and invalid-frame term requests fail closed", () => {
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
