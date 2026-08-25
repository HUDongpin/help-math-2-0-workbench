import assert from "node:assert/strict";
import test from "node:test";

import {
  assertExactCanvasBackingDimensions,
  canvasTeachingIdentity,
  selectAdaptiveCanvasResolution,
  validateCanvasRenderRequest,
  validateExactCanvasBackingDimensions,
  type CanvasRenderRequest,
} from "../src/adaptive-canvas-resolution";

const authoredStage = {width: 800, height: 600} as const;

function select(
  cssStage: {readonly width: number; readonly height: number} | null,
  devicePixelRatio: number | null,
  sourceBitmapBound = false,
) {
  return selectAdaptiveCanvasResolution({
    authoredStage,
    cssStage,
    devicePixelRatio,
    sourceBitmapBound,
  });
}

test("800x600 at DPR 1 uses the native 1x backing store", () => {
  const resolution = select({width: 800, height: 600}, 1);

  assert.equal(resolution.schemaVersion, 1);
  assert.equal(resolution.mode, "adaptive-integer");
  assert.equal(resolution.nativeWidth, 800);
  assert.equal(resolution.nativeHeight, 600);
  assert.equal(resolution.demand, 1);
  assert.equal(resolution.requestedRenderScale, 1);
  assert.equal(resolution.renderScale, 1);
  assert.deepEqual(resolution.backingStage, {width: 800, height: 600});
  assert.equal(resolution.status, "native");
  assert.equal(resolution.dprCeilingExceeded, false);
  assert.equal(resolution.demandCapped, false);
});

test("800x600 at DPR 2 uses the retina 2x backing store", () => {
  const resolution = select({width: 800, height: 600}, 2);

  assert.equal(resolution.demand, 2);
  assert.equal(resolution.requestedRenderScale, 2);
  assert.equal(resolution.renderScale, 2);
  assert.deepEqual(resolution.backingStage, {width: 1600, height: 1200});
  assert.equal(resolution.status, "retina");
  assert.equal(resolution.dprCeilingExceeded, false);
  assert.equal(resolution.demandCapped, false);
});

test("400x300 at DPR 2 needs only the authored 800x600 backing store", () => {
  const resolution = select({width: 400, height: 300}, 2);

  assert.equal(resolution.demand, 1);
  assert.equal(resolution.requestedRenderScale, 1);
  assert.equal(resolution.renderScale, 1);
  assert.deepEqual(resolution.backingStage, {width: 800, height: 600});
  assert.equal(resolution.status, "native");
});

test("390x292.5 at DPR 3 uses ceil(demand)=2 and records the DPR ceiling", () => {
  const resolution = select({width: 390, height: 292.5}, 3);

  assert.equal(resolution.demand, 1.4625);
  assert.equal(resolution.requestedRenderScale, 2);
  assert.equal(resolution.renderScale, 2);
  assert.deepEqual(resolution.backingStage, {width: 1600, height: 1200});
  assert.equal(resolution.status, "retina");
  assert.equal(resolution.dprCeilingExceeded, true);
  assert.equal(resolution.demandCapped, false);
});

test("800x600 at DPR 3 caps ceil(demand)=3 at the supported 2x scale", () => {
  const resolution = select({width: 800, height: 600}, 3);

  assert.equal(resolution.demand, 3);
  assert.equal(resolution.requestedRenderScale, 3);
  assert.equal(resolution.renderScale, 2);
  assert.deepEqual(resolution.backingStage, {width: 1600, height: 1200});
  assert.equal(resolution.status, "capped");
  assert.equal(resolution.dprCeilingExceeded, true);
  assert.equal(resolution.demandCapped, true);
});

test("source bitmap limits are reported without changing source pixels or scale", () => {
  const resolution = select({width: 800, height: 600}, 2, true);

  assert.equal(resolution.renderScale, 2);
  assert.equal(resolution.status, "source-bitmap-bound");
  assert.equal(resolution.sourceBitmapBound, true);
  assert.equal(resolution.demandCapped, false);
});

test("missing or transiently invalid layout input fails safe to k1", () => {
  for (const resolution of [
    select(null, null),
    select({width: 0, height: 600}, 2),
    select({width: Number.NaN, height: 600}, 2),
    select({width: 800, height: 600}, Number.POSITIVE_INFINITY),
  ]) {
    assert.equal(resolution.renderScale, 1);
    assert.deepEqual(resolution.backingStage, {width: 800, height: 600});
    assert.equal(resolution.demand, null);
    assert.equal(resolution.requestedRenderScale, 1);
    assert.equal(resolution.status, "fallback-k1");
    assert.equal(resolution.demandCapped, false);
  }
});

test("invalid authored dimensions and bitmap flags are rejected", () => {
  assert.throws(
    () =>
      selectAdaptiveCanvasResolution({
        authoredStage: {width: 0, height: 600},
        cssStage: {width: 800, height: 600},
        devicePixelRatio: 1,
      }),
    /positive safe integers/,
  );
  assert.throws(
    () =>
      selectAdaptiveCanvasResolution({
        authoredStage,
        cssStage: {width: 800, height: 600},
        devicePixelRatio: 1,
        sourceBitmapBound: "yes" as unknown as boolean,
      }),
    /must be a boolean/,
  );
});

test("backing validation accepts only the exact authored size times k", () => {
  const resolution = select({width: 800, height: 600}, 2);

  assert.deepEqual(
    validateExactCanvasBackingDimensions(resolution, {
      width: 1600,
      height: 1200,
    }),
    {
      exact: true,
      expected: {width: 1600, height: 1200},
      actual: {width: 1600, height: 1200},
      reason: "exact",
    },
  );
  assert.deepEqual(
    validateExactCanvasBackingDimensions(resolution, {
      width: 1599,
      height: 1200,
    }),
    {
      exact: false,
      expected: {width: 1600, height: 1200},
      actual: {width: 1599, height: 1200},
      reason: "width-mismatch",
    },
  );
  assert.throws(
    () =>
      assertExactCanvasBackingDimensions(resolution, {
        width: 1600,
        height: 1199,
      }),
    /must be exactly 1600x1200; received 1600x1199/,
  );
});

test("invalid backing dimensions fail closed", () => {
  const resolution = select({width: 800, height: 600}, 1);
  const validation = validateExactCanvasBackingDimensions(resolution, {
    width: Number.NaN,
    height: 600,
  });

  assert.equal(validation.exact, false);
  assert.equal(validation.reason, "invalid-backing-dimensions");
  assert.equal(validation.actual, null);
});

test("renderScale is required presentation state and never teaching identity", () => {
  const k1: CanvasRenderRequest = {
    frame: 37,
    scenario: "default",
    lang: "en",
    seed: 0,
    renderScale: 1,
    behaviorCompositeContractId: "behavior-v1",
    behaviorCompositeState: "question-2",
  };
  const k2: CanvasRenderRequest = {...k1, renderScale: 2};

  assert.equal(validateCanvasRenderRequest(k1), k1);
  assert.equal(validateCanvasRenderRequest({...k1, lang: "es"}).lang, "es");
  assert.deepEqual(canvasTeachingIdentity(k1), canvasTeachingIdentity(k2));
  assert.equal("renderScale" in canvasTeachingIdentity(k1), false);
  assert.throws(
    () =>
      validateCanvasRenderRequest({
        ...k1,
        lang: "fr" as unknown as "en",
      }),
    /exactly "en" or "es"/,
  );
  assert.throws(
    () =>
      validateCanvasRenderRequest({
        ...k1,
        renderScale: undefined as unknown as 1,
      }),
    /exactly 1 or 2/,
  );
});
