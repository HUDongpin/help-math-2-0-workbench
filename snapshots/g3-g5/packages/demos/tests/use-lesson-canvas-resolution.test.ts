import assert from "node:assert/strict";
import test from "node:test";
import {observeLessonCanvasResolution} from "../src/use-lesson-canvas-resolution";
import type {LessonCanvasResolution, LessonCanvasResolutionOptions} from "../src/lesson-canvas-resolution";

const options: LessonCanvasResolutionOptions = {
  nativeStage: {width: 800, height: 600}, enabled: true,
  metadata: {schemaVersion: 1, mode: "adaptive-integer", nativeWidth: 800,
    nativeHeight: 600, supportedScales: [1, 2]},
};

function browserFixture() {
  class TrackedEvents extends EventTarget {
    readonly listeners = new Set<EventListenerOrEventListenerObject>();
    override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
      if (callback) this.listeners.add(callback);
      super.addEventListener(type, callback);
    }
    override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
      if (callback) this.listeners.delete(callback);
      super.removeEventListener(type, callback);
    }
  }
  const viewport = new TrackedEvents();
  const queries: TrackedEvents[] = [];
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let observed = false;
  let onResize = () => {};
  let bounds = {width: 800, height: 600};
  class Observer {
    constructor(callback: () => void) {onResize = callback;}
    observe() {observed = true;}
    disconnect() {observed = false;}
  }
  const view = Object.assign(new TrackedEvents(), {
    devicePixelRatio: 2,
    visualViewport: viewport,
    ResizeObserver: Observer,
    requestAnimationFrame(callback: FrameRequestCallback) {
      callbacks.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame(id: number) {callbacks.delete(id);},
    matchMedia() {const query = new TrackedEvents(); queries.push(query); return query;},
  });
  const target = {
    ownerDocument: {defaultView: view},
    getBoundingClientRect() {return bounds;},
  } as unknown as HTMLElement;
  return {view, viewport, queries, callbacks, target,
    observed: () => observed,
    resize(width: number, height: number) {bounds = {width, height}; onResize();},
    flush() {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(0));
    },
  };
}

test("default-disabled observation attaches no events and never reads an adaptive buffer", () => {
  const browser = browserFixture();
  const results: LessonCanvasResolution[] = [];
  const cleanup = observeLessonCanvasResolution(browser.target,
    {nativeStage: options.nativeStage}, (resolution) => results.push(resolution));
  assert.equal(results[0]!.status, "disabled");
  assert.equal(browser.observed(), false);
  assert.equal(browser.view.listeners.size, 0);
  cleanup();
});

test("resize bursts coalesce into one update and unchanged observations do not notify", () => {
  const browser = browserFixture();
  const results: LessonCanvasResolution[] = [];
  const cleanup = observeLessonCanvasResolution(browser.target, options,
    (resolution) => results.push(resolution));
  assert.equal(results.length, 1);
  assert.equal(results[0]!.renderScale, 2);
  browser.resize(720, 540);
  browser.resize(700, 525);
  browser.view.dispatchEvent(new Event("resize"));
  browser.viewport.dispatchEvent(new Event("resize"));
  assert.equal(browser.callbacks.size, 1);
  browser.flush();
  assert.equal(results.length, 2);
  assert.equal(results[1]!.cssStage!.width, 700);
  assert.equal(results[0]!.renderKey, results[1]!.renderKey);
  browser.resize(700, 525);
  browser.flush();
  assert.equal(results.length, 2);
  cleanup();
});

test("DPR changes re-arm their query and change resolution without teaching-state access", () => {
  const browser = browserFixture();
  const results: LessonCanvasResolution[] = [];
  const cleanup = observeLessonCanvasResolution(browser.target, options,
    (resolution) => results.push(resolution));
  const original = browser.queries[0]!;
  browser.view.devicePixelRatio = 1;
  original.dispatchEvent(new Event("change"));
  browser.flush();
  assert.equal(results.at(-1)!.renderScale, 1);
  assert.equal(original.listeners.size, 0);
  assert.equal(browser.queries.length, 2);
  assert.equal(browser.queries[1]!.listeners.size, 1);
  cleanup();
});

test("unmount disconnects every observation and cancels pending measurement", () => {
  const browser = browserFixture();
  const results: LessonCanvasResolution[] = [];
  const cleanup = observeLessonCanvasResolution(browser.target, options,
    (resolution) => results.push(resolution));
  browser.resize(390, 292.5);
  assert.equal(browser.callbacks.size, 1);
  cleanup();
  assert.equal(browser.observed(), false);
  assert.equal(browser.callbacks.size, 0);
  assert.equal(browser.view.listeners.size, 0);
  assert.equal(browser.viewport.listeners.size, 0);
  assert.ok(browser.queries.every((query) => query.listeners.size === 0));
  browser.flush();
  browser.view.dispatchEvent(new Event("resize"));
  assert.equal(results.length, 1);
  cleanup();
});
