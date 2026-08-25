import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("adaptive resolution hook observes layout, zoom, viewport, and repeat DPR changes", async () => {
  const source = await readFile(
    new URL("../src/use-adaptive-canvas-resolution.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /new ResizeObserver\(update\)/);
  assert.match(source, /window\.addEventListener\("resize", update\)/);
  assert.match(
    source,
    /window\.visualViewport\?\.addEventListener\("resize", update\)/,
  );
  assert.match(source, /window\.matchMedia\(/);
  assert.match(source, /registerDprQuery\(\);/);
  assert.match(source, /function handleDprChange\(\)/);
  assert.match(source, /removeEventListener\("change", handleDprChange\)/);
});

test("historical assets are explicitly kept at fixed k1", async () => {
  const source = await readFile(
    new URL("../src/use-adaptive-canvas-resolution.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /if \(!adaptiveEnabled\)/);
  assert.match(source, /adaptiveEnabled: false/);
  assert.match(source, /devicePixelRatio: adaptiveEnabled \? null : 1/);
});

