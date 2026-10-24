import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateLessonCanvasSurface,
  assertLessonCanvasResolutionMetadata,
  selectLessonCanvasResolution,
  type LessonCanvasResolutionMetadata,
} from "../src/lesson-canvas-resolution";

const nativeStage = Object.freeze({width: 800, height: 600});
const metadata: LessonCanvasResolutionMetadata = Object.freeze({
  schemaVersion: 1, mode: "adaptive-integer", nativeWidth: 800, nativeHeight: 600,
  supportedScales: Object.freeze([1, 2] as const),
});
const options = Object.freeze({nativeStage, metadata, enabled: true});

test("default remains native even on a wide high-density display", () => {
  const result = selectLessonCanvasResolution({nativeStage,
    cssStage: {width: 1600, height: 1200}, devicePixelRatio: 3});
  assert.equal(result.status, "disabled");
  assert.equal(result.renderScale, 1);
  assert.deepEqual(result.backingStage, nativeStage);
});

test("physical CSS demand selects scales, accounting for both axes and product ceiling", () => {
  for (const [width, height, dpr, scale, status] of [
    [800, 600, 1, 1, "native"],
    [800, 600, 2, 2, "retina"],
    [359, 269.25, 2, 1, "native"],
    [359, 269.25, 3, 2, "retina"],
    [1200, 900, 2, 2, "capped"],
    [400, 601, 1, 2, "retina"],
  ] as const) {
    const result = selectLessonCanvasResolution({...options,
      cssStage: {width, height}, devicePixelRatio: dpr});
    assert.equal(result.renderScale, scale);
    assert.equal(result.status, status);
    assert.equal(result.demandCapped, status === "capped");
  }
});

test("fractional native stage is preserved while physical backing uses ceil(native * scale)", () => {
  const stage = Object.freeze({width: 799.25, height: 599.75});
  const exactMetadata = {...metadata, nativeWidth: stage.width, nativeHeight: stage.height};
  const result = selectLessonCanvasResolution({nativeStage: stage, metadata: exactMetadata,
    enabled: true, cssStage: stage, devicePixelRatio: 2});
  assert.deepEqual(result.nativeStage, stage);
  assert.deepEqual(result.backingStage, {width: 1599, height: 1200});
  const disabled = selectLessonCanvasResolution({nativeStage: stage});
  assert.deepEqual(disabled.backingStage, {width: 800, height: 600});
});

test("missing and invalid measurements fall back without inventing display density", () => {
  for (const cssStage of [undefined, null, {width: 0, height: 600}, {width: NaN, height: 600}]) {
    const result = selectLessonCanvasResolution({...options, cssStage, devicePixelRatio: 2});
    assert.equal(result.status, "measurement-fallback");
    assert.equal(result.renderScale, 1);
  }
  for (const devicePixelRatio of [undefined, null, 0, -1, NaN, Infinity]) {
    assert.equal(selectLessonCanvasResolution({...options, cssStage: nativeStage,
      devicePixelRatio}).status, "measurement-fallback");
  }
});

test("adaptive activation requires exact explicit adapter metadata", () => {
  for (const invalid of [undefined, null, {}, {...metadata, schemaVersion: 2},
    {...metadata, mode: "fixed"}, {...metadata, nativeWidth: 801},
    {...metadata, nativeHeight: 601}, {...metadata, supportedScales: [1]},
    {...metadata, supportedScales: [2, 1]}, {...metadata, supportedScales: [1, 2, 3]},
    {...metadata, supportedScales: [1, "2"]}]) {
    assert.throws(() => assertLessonCanvasResolutionMetadata(invalid, nativeStage), TypeError);
  }
  assert.throws(() => selectLessonCanvasResolution({nativeStage, enabled: true}), TypeError);
  assert.throws(() => selectLessonCanvasResolution({nativeStage,
    metadata: {...metadata, nativeWidth: 801}}), TypeError);
});

test("invalid native dimensions cannot allocate, including unsafe 2x buffers", () => {
  for (const width of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => selectLessonCanvasResolution({nativeStage: {width, height: 600}}), RangeError);
  }
});

test("display measurements do not mutate educational inputs or request unnecessary paint", () => {
  const teachingState = Object.freeze({frame: 18, seed: 27, answer: "-2", audioTime: 1.5});
  const input = Object.freeze({...options, teachingState,
    cssStage: Object.freeze({width: 700, height: 525}), devicePixelRatio: 2,
    sourceBitmapBound: true});
  const before = JSON.stringify(input);
  const first = selectLessonCanvasResolution(input);
  const second = selectLessonCanvasResolution({...input, cssStage: {width: 720, height: 540}});
  assert.equal(JSON.stringify(input), before);
  assert.equal(first.renderKey, second.renderKey);
  assert.equal(first.sourceBitmapBound, true);
  assert.ok(!("teachingState" in first));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.nativeStage));
});

function canvasFactory(fail: (width: number, height: number) => boolean) {
  const created: HTMLCanvasElement[] = [];
  const context = {} as CanvasRenderingContext2D;
  const createCanvas = () => {
    const canvas = {width: 0, height: 0,
      getContext(this: {width: number; height: number}) {
        return fail(this.width, this.height) ? null : context;
      },
    } as unknown as HTMLCanvasElement;
    created.push(canvas);
    return canvas;
  };
  return {createCanvas, created, context};
}

const retina = () => selectLessonCanvasResolution({...options,
  cssStage: nativeStage, devicePixelRatio: 2});

test("successful allocation is isolated and disposable without changing the selection", () => {
  const fixture = canvasFactory(() => false);
  const selected = retina();
  const surface = allocateLessonCanvasSurface(selected, fixture);
  assert.equal(surface.resolution, selected);
  assert.equal(surface.context, fixture.context);
  assert.equal(surface.canvas.width, 1600);
  assert.equal(surface.canvas.height, 1200);
  surface.dispose();
  assert.equal(surface.canvas.width, 0);
  assert.equal(surface.canvas.height, 0);
  assert.deepEqual(selected.backingStage, {width: 1600, height: 1200});
});

test("2x allocation failure releases its buffer and returns one exact 1x fallback", () => {
  const fixture = canvasFactory((width) => width > 800);
  const selected = retina();
  const surface = allocateLessonCanvasSurface(selected, fixture);
  assert.equal(fixture.created.length, 2);
  assert.equal(fixture.created[0]!.width, 0);
  assert.equal(surface.resolution.status, "allocation-fallback");
  assert.equal(surface.resolution.renderScale, 1);
  assert.equal(surface.resolution.requestedRenderScale, 2);
  assert.equal(surface.canvas.width, 800);
  assert.equal(surface.canvas.height, 600);
  assert.equal(selected.renderScale, 2);
});

test("failure to allocate 1x propagates instead of returning a blank ready surface", () => {
  const fixture = canvasFactory(() => true);
  assert.throws(() => allocateLessonCanvasSurface(retina(), fixture), /context allocation failed/);
  assert.equal(fixture.created.length, 2);
  assert.ok(fixture.created.every((canvas) => canvas.width === 0 && canvas.height === 0));
});

test("a browser that truncates the requested buffer dimensions fails closed", () => {
  const createCanvas = () => ({
    get width() {return 800;}, set width(_value: number) {},
    height: 0,
    getContext() {return {} as CanvasRenderingContext2D;},
  } as unknown as HTMLCanvasElement);
  const surface = allocateLessonCanvasSurface(retina(), {createCanvas});
  assert.equal(surface.resolution.status, "allocation-fallback");
});
