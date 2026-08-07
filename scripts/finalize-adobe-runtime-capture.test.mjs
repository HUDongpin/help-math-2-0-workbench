import assert from "node:assert/strict";
import test from "node:test";
import {PNG} from "pngjs";
import {compositeAgainstBackground, cropStageFromWindow, parseArguments} from "./finalize-adobe-runtime-capture.mjs";

test("parseArguments requires explicit values and preserves capture metadata", () => {
  const options = parseArguments([
    "--id", "formula-elementary-conversion-01-02",
    "--scenario", "standalone-default",
    "--lang", "en",
    "--player-version", "32.0.0.414",
  ]);
  assert.equal(options.id, "formula-elementary-conversion-01-02");
  assert.equal(options.scenario, "standalone-default");
  assert.equal(options.lang, "en");
  assert.equal(options.playerVersion, "32.0.0.414");
});

test("parseArguments records an explicit supersede reason", () => {
  const options = parseArguments(["--id", "sample", "--supersede", "window-mask-alpha", "--supersede-reason", "OS mask"]);
  assert.equal(options.supersede, "window-mask-alpha");
  assert.equal(options.supersedeReason, "OS mask");
});

test("parseArguments records a partial runtime stop observation", () => {
  const options = parseArguments([
    "--id", "course-g04-l09-gs-002",
    "--allow-partial",
    "--stop-reason", "Step Forward became disabled before frame 5",
  ]);
  assert.equal(options.allowPartial, true);
  assert.equal(options.stopReason, "Step Forward became disabled before frame 5");
});

test("cropStageFromWindow removes only top window chrome", () => {
  const windowImage = new PNG({width: 3, height: 4});
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const offset = (row * 3 + column) * 4;
      windowImage.data[offset] = row;
      windowImage.data[offset + 1] = column;
      windowImage.data[offset + 2] = 99;
      windowImage.data[offset + 3] = 255;
    }
  }
  const result = cropStageFromWindow(windowImage, {width: 3, height: 2});
  assert.deepEqual(result.crop, {x: 0, y: 2, width: 3, height: 2});
  assert.equal(result.image.width, 3);
  assert.equal(result.image.height, 2);
  assert.equal(result.image.data[0], 2);
  assert.equal(result.image.data[(3 * 4) + 0], 3);
});

test("cropStageFromWindow rejects a mismatched window width", () => {
  const windowImage = new PNG({width: 4, height: 4});
  assert.throws(
    () => cropStageFromWindow(windowImage, {width: 3, height: 2}),
    /expected width 3/,
  );
});

test("compositeAgainstBackground removes transparent OS window pixels", () => {
  const input = new PNG({width: 1, height: 1});
  input.data.set([0, 0, 0, 0]);
  const output = compositeAgainstBackground(input, "#e4e4e4");
  assert.deepEqual([...output.data], [228, 228, 228, 255]);
});
