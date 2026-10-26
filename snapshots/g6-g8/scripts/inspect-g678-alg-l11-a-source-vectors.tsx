import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {chromium} from "playwright";
import {AlgL11ASourceVectorStage, resolveAlgL11ASourceVectorFrame,
  type AlgL11ASourceVectorBundle} from
  "../packages/demos/src/g678-alg-l11-tranche-a-source-vector-stage";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLES = "work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v4";
const OUTPUT = "output/playwright/g678-alg-l11-a-source-vector-inspection-v1";
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
const manifest = JSON.parse(await readFile(path.join(ROOT, BUNDLES,
  "manifest.json"), "utf8"));
await mkdir(path.join(ROOT, OUTPUT));
const browser = await chromium.launch({headless: true});
const records = [];
try {
  for (const input of manifest.files) {
    const bytes = await readFile(path.join(ROOT, input.path));
    assert.equal(hash(bytes), input.sha256);
    assert.equal(bytes.length, input.bytes);
    const bundle = JSON.parse(bytes.toString()) as AlgL11ASourceVectorBundle &
      {quizFrame: number | null};
    assert.throws(() => resolveAlgL11ASourceVectorFrame(bundle, 0));
    assert.throws(() => resolveAlgL11ASourceVectorFrame(bundle, bundle.frameCount + 1));
    for (let frame = 1; frame <= bundle.frameCount; frame += 1) {
      assert.ok(resolveAlgL11ASourceVectorFrame(bundle, frame).body.length > 0);
    }
    const frame = bundle.quizFrame ?? (bundle.animationId.endsWith("p006")
      ? 24 : Math.floor(bundle.frameCount / 2));
    for (const helpOpen of bundle.animationId.endsWith("p011") ? [false, true] : [false]) {
      const page = await browser.newPage({viewport: {width: 800, height: 600}});
      const errors: string[] = [];
      let requestCount = 0;
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      await page.route("**/*", route => { requestCount += 1; return route.abort(); });
      const markup = renderToStaticMarkup(<AlgL11ASourceVectorStage bundle={bundle}
        frame={frame} helpOpen={helpOpen}/>);
      await page.setContent(`<html><head><meta http-equiv="Content-Security-Policy" ` +
        `content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">` +
        `<style>body{margin:0;background:white}</style></head><body>${markup}</body></html>`);
      const filename = `${bundle.animationId}${helpOpen ? "-help" : ""}.png`;
      await page.screenshot({path: path.join(ROOT, OUTPUT, filename)});
      const picture = await readFile(path.join(ROOT, OUTPUT, filename));
      assert.equal(await page.locator("[data-source-vector-frame]").getAttribute(
        "data-source-vector-frame"), String(frame));
      assert.equal(await page.locator("polygon[data-choice-slot]").count(), bundle.choiceControls.length);
      assert.deepEqual(errors, []);
      assert.equal(requestCount, 0);
      records.push({animationId: bundle.animationId, frame, helpOpen,
        bundle: input, screenshot: {path: `${OUTPUT}/${filename}`,
          bytes: picture.length, sha256: hash(picture)}, errors, requestCount});
      await page.close();
    }
  }
} finally {
  await browser.close();
}
const result = {artifactType: "g678-alg-l11-a-source-vector-inspection-v1",
  status: "source-visual-layer-only-child-behavior-and-product-host-pending",
  mainFramesChecked: 2677, records,
  productCalibrationPassed: false, currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
  audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, released: false, published: false};
await writeFile(path.join(ROOT, OUTPUT, "inspection.json"),
  JSON.stringify(result, null, 2) + "\n", {flag: "wx"});
console.log(JSON.stringify({output: OUTPUT, records: records.length,
  mainFramesChecked: result.mainFramesChecked, productCalibrationPassed: false}));
