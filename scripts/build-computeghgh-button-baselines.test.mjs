import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";
import { PNG } from "pngjs";
import {
  buildComputeghghButtonBaselines,
  comparePngBuffers,
  parseArguments,
  parseSourceStructure,
  renderStructuralState,
} from "./build-computeghgh-button-baselines.mjs";

const helperFile = path.resolve("scripts/parse-swfmill-button-evidence.py");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeBytes(file, bytes) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return sha256(bytes);
}

function png(width, height, color = [255, 255, 255, 255]) {
  const image = new PNG({ width, height });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = color[0];
    image.data[index + 1] = color[1];
    image.data[index + 2] = color[2];
    image.data[index + 3] = color[3];
  }
  return PNG.sync.write(image);
}

function stateSvg(characterId, color, { width = 1, height = 1, translation = [0, 0] } = {}) {
  return Buffer.from(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:ffdec="https://www.free-decompiler.com/flash" width="${width}px" height="${height}px">
  <g transform="matrix(1.0, 0.0, 0.0, 1.0, ${translation[0]}, ${translation[1]})">
    <use ffdec:characterId="${characterId}" href="#shape0"/>
  </g>
  <defs><g id="shape0"><rect width="${width}" height="${height}" fill="${color}"/></g></defs>
</svg>`);
}

function swfmillXml({ widthTwips = 80, heightTwips = 80 } = {}) {
  return Buffer.from(`<?xml version="1.0"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="35">
    <size><Rectangle left="0" top="0" right="${widthTwips}" bottom="${heightTwips}"/></size>
    <tags>
      <DefineButton2 objectID="14" menu="0" buttonsSize="1">
        <buttons>
          <Button hitTest="1" down="0" over="0" up="1" objectID="1" depth="1"><transform><Transform transX="0" transY="0"/></transform></Button>
          <Button hitTest="1" down="0" over="1" up="0" objectID="2" depth="1"><transform><Transform transX="0" transY="0"/></transform></Button>
          <Button hitTest="1" down="1" over="0" up="0" objectID="3" depth="1"><transform><Transform transX="0" transY="0"/></transform></Button>
          <Button hitTest="0" down="0" over="0" up="0"/>
        </buttons>
        <conditions>
          <Condition pointerReleaseInside="1"><actions><GotoFrame frame="0"/><Play/><EndAction/></actions></Condition>
        </conditions>
      </DefineButton2>
      <PlaceObject2 replace="0" depth="28" objectID="14"><transform><Transform transX="20" transY="20"/></transform></PlaceObject2>
    </tags>
  </Header>
</swf>`);
}

test("parses structural-baseline CLI arguments", () => {
  assert.deepEqual(parseArguments([
    "--check",
    "--generated-at", "2026-07-21T00:00:00.000Z",
    "--project-root", ".",
    "--python", "python-test",
  ]), {
    check: true,
    generatedAt: "2026-07-21T00:00:00.000Z",
    projectRoot: path.resolve("."),
    python: "python-test",
  });
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
  assert.throws(() => parseArguments(["--python"]), /requires a value/);
});

test("uses ElementTree to parse DefineButton2 membership, placement, and SVG registration", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "computeghgh-xml-parser-"));
  try {
    const xmlFile = path.join(root, "swfmill.xml.gz");
    await writeFile(xmlFile, gzipSync(swfmillXml()));
    const svgFiles = {};
    for (const [state, id, color] of [
      ["up", 1, "#ff6600"],
      ["over", 2, "#4087f9"],
      ["down", 3, "#000000"],
    ]) {
      const file = path.join(root, `${state}.svg`);
      await writeFile(file, stateSvg(id, color, { translation: [2.5, 1.5] }));
      svgFiles[state] = file;
    }
    const parsed = await parseSourceStructure({
      swfmillFile: xmlFile,
      svgFiles,
      buttonId: 14,
      helperFile,
    });
    assert.deepEqual(parsed.stage, { width: 4, height: 4 });
    assert.deepEqual(parsed.placement.pixels, { x: 1, y: 1 });
    assert.deepEqual(parsed.button.states.up, [1]);
    assert.deepEqual(parsed.button.states.over, [2]);
    assert.deepEqual(parsed.button.states.down, [3]);
    assert.deepEqual(parsed.svgStates.up.groupTranslation, { x: 2.5, y: 1.5 });
    assert.deepEqual(parsed.svgStates.down.characterIds, [3]);
    assert.deepEqual(parsed.button.conditions[0].actions.map(({ name }) => name), ["GotoFrame", "Play"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("sharp structural rendering preserves dimensions and deterministic pixel comparison", async () => {
  const rootFrame = png(4, 4);
  const state = stateSvg(1, "#0000ff");
  const rendered = await renderStructuralState({
    rootFrame,
    stateSvg: state,
    stage: { width: 4, height: 4 },
    composition: {
      topLeft: { x: 1, y: 1 },
      width: 1,
      height: 1,
      erase: { x: 0, y: 0, width: 3, height: 3 },
    },
  });
  const decoded = PNG.sync.read(rendered);
  assert.equal(decoded.width, 4);
  assert.equal(decoded.height, 4);
  const offset = (1 * 4 + 1) * 4;
  assert.deepEqual([...decoded.data.subarray(offset, offset + 4)], [0, 0, 255, 255]);
  const comparison = comparePngBuffers(rendered, rendered);
  assert.equal(comparison.normalizedRmse, 0);
  assert.equal(comparison.mismatchedPixels, 0);
});

test("build and check modes bind all inputs, outputs, diffs, and the tracked manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "computeghgh-baseline-build-"));
  try {
    const inputs = {};
    const add = async (key, relative, bytes) => {
      inputs[key] = { file: relative, sha256: await writeBytes(path.join(root, relative), bytes) };
      return inputs[key];
    };
    const source = await add("swf", "source/computeghgh.swf", Buffer.from("test-swf"));
    const rawXml = swfmillXml();
    const compressedXml = gzipSync(rawXml);
    const swfmill = await add("swfmillXml", "audit/swfmill.xml.gz", compressedXml);
    swfmill.uncompressedSha256 = sha256(rawXml);
    const rootFrame = png(4, 4);
    await add("rootFrame", "assets/frame.png", rootFrame);
    const stateBytes = {
      up: stateSvg(1, "#ff6600"),
      over: stateSvg(2, "#4087f9"),
      down: stateSvg(3, "#000000"),
    };
    for (const state of ["up", "over", "down"]) {
      await add(`${state}Svg`, `assets/${state}.svg`, stateBytes[state]);
    }
    const composition = {
      topLeft: { x: 1, y: 1 },
      width: 1,
      height: 1,
      erase: { x: 0, y: 0, width: 3, height: 3 },
    };
    const rendered = {};
    for (const state of ["up", "over", "down"]) {
      rendered[state] = await renderStructuralState({
        rootFrame,
        stateSvg: stateBytes[state],
        stage: { width: 4, height: 4 },
        composition,
      });
    }
    await add("adobeUp", "runtime/up.png", rendered.up);
    await add("adobeOver", "runtime/over.png", rendered.over);
    await add("adobeDownJpeg", "runtime/down.jpeg", Buffer.from("lossy-runtime-confirmation"));
    await add("implementationDown", "implementation/down.png", rendered.down);
    const report = {
      animationId: "keyterm-test-computeghgh",
      source: { expectedSha256: source.sha256, hashMatches: true },
      findings: { runtimeCrossCheck: { allMatch: true } },
      outputs: [{
        path: "audit/machine/swfmill.xml.gz",
        sha256: swfmill.sha256,
        uncompressedSha256: swfmill.uncompressedSha256,
      }],
    };
    await add("machineReport", "audit/report.json", Buffer.from(`${JSON.stringify(report)}\n`));
    const expected = {
      animationId: "keyterm-test-computeghgh",
      buttonId: 14,
      stage: { width: 4, height: 4 },
      frameRate: 12,
      frameCount: 35,
      inputs,
      outputDirectory: "archive/states",
      diffDirectory: "archive/diffs",
      manifestFile: "migration/baseline.json",
    };
    const generatedAt = "2026-07-21T00:00:00.000Z";
    const manifest = await buildComputeghghButtonBaselines({
      projectRoot: root,
      expected,
      helperFile,
      generatedAt,
    });
    assert.equal(manifest.status, "calibrated-source-structural-baseline");
    assert.equal(manifest.validation.calibrationPass, true);
    assert.equal(manifest.validation.downMetricPass, true);
    await buildComputeghghButtonBaselines({ projectRoot: root, expected, helperFile, check: true });

    await writeFile(path.join(root, expected.outputDirectory, "down.png"), Buffer.from("stale"));
    await assert.rejects(
      buildComputeghghButtonBaselines({ projectRoot: root, expected, helperFile, check: true }),
      /down structural baseline is stale/,
    );
    assert.equal(JSON.parse(await readFile(path.join(root, expected.manifestFile), "utf8")).generatedAt, generatedAt);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
