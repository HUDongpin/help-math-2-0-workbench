import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildHelpMathCatalog, parseSwfHeader } from "./build-help-math-catalog.mjs";

function encodeSigned(value, length) {
  const normalized = value < 0 ? 2 ** length + value : value;
  return normalized.toString(2).padStart(length, "0");
}

function bitsToBuffer(bits) {
  const padded = bits.padEnd(Math.ceil(bits.length / 8) * 8, "0");
  return Buffer.from(padded.match(/.{8}/g).map((byte) => Number.parseInt(byte, 2)));
}

function makeSwf({ signature = "FWS", width = 550, height = 400, fps = 12, frameCount = 120 } = {}) {
  const coordinateBits = 15;
  const rect = bitsToBuffer(
    coordinateBits.toString(2).padStart(5, "0") +
    encodeSigned(0, coordinateBits) +
    encodeSigned(width * 20, coordinateBits) +
    encodeSigned(0, coordinateBits) +
    encodeSigned(height * 20, coordinateBits),
  );
  const timing = Buffer.alloc(4);
  timing.writeUInt16LE(fps * 256, 0);
  timing.writeUInt16LE(frameCount, 2);
  const body = Buffer.concat([rect, timing]);
  const header = Buffer.alloc(8);
  header.write(signature, 0, 3, "ascii");
  header[3] = 8;
  header.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([header, signature === "CWS" ? deflateSync(body) : body]);
}

async function fixtureFile(root, relativePath, contents) {
  const target = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

test("parses uncompressed and zlib-compressed SWF movie metadata", () => {
  for (const signature of ["FWS", "CWS"]) {
    const metadata = parseSwfHeader(makeSwf({ signature }));
    assert.equal(metadata.signature, signature);
    assert.equal(metadata.compression, signature === "FWS" ? "none" : "zlib");
    assert.deepEqual(metadata.stage, {
      units: "px",
      twipsPerPixel: 20,
      xMinTwips: 0,
      xMaxTwips: 11_000,
      yMinTwips: 0,
      yMaxTwips: 8_000,
      xMin: 0,
      xMax: 550,
      yMin: 0,
      yMax: 400,
      width: 550,
      height: 400,
    });
    assert.equal(metadata.fps, 12);
    assert.equal(metadata.frameCount, 120);
    assert.equal(metadata.durationMs, 10_000);
  }
});

test("builds deterministic placement, duplicate, reference, audio, and FLA inventories", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-catalog-"));
  const source = path.join(temporaryRoot, "HELP MATH_ORIGINAL FILES");
  const firstOutput = path.join(temporaryRoot, "catalog-a");
  const secondOutput = path.join(temporaryRoot, "catalog-b");

  try {
    const primarySwf = makeSwf({ signature: "CWS", frameCount: 12 });
    const formulaSwf = makeSwf({ frameCount: 24 });
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/IN/L1IN02.swf", primarySwf);
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/IN/Review/L1IN02.swf", primarySwf);
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/index_local.swf", makeSwf({ frameCount: 1 }));
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/IN/L1IN02.fla", "binary-fla-evidence");
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/IN/L1IN03.fla", "fla-only-evidence");
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/SA/L1IN02.mp3", "course-audio");
    await fixtureFile(source, "HELP_COURSES/ELMGR3/L1/index.xml", `<Lesson>
      <NewTitle1>Decimals & Money</NewTitle1><LessonNumber>1</LessonNumber>
      <Section SName="IN" SNumber="4"><Title><English>Learn It</English><Spanish>Apréndelo</Spanish></Title>
        <!--<Page Title="Commented">IN/L1IN99.swf</Page>-->
        <Page Title="Tenths">IN/L1IN02.swf</Page><Page Title="Missing">IN/L1IN04.swf</Page>
        <SubPageTitle EngSubTitleName="1. Decimal tenths" SpanSubTitleName="Décimos">IN/L1IN02.swf</SubPageTitle>
      </Section></Lesson>`);

    await fixtureFile(source, "HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf", makeSwf({ frameCount: 3 }));
    const keytermXml = `<Terms>
      <Acute~angle~LNG~Ángulo~agudo ScreenkeyTerm="Acute Angle" ExFileName="Acute_angle.swf">Definition</Acute>
      <Cubed~root~LNG~Raíz~cúbica ScreenkeyTerm ="Cubed Root" ExFileName ="Cubed_root.swf">Definition</Cubed>
    </Terms>`;
    await fixtureFile(source, "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml", keytermXml);
    await fixtureFile(source, "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml", keytermXml);

    await fixtureFile(source, "HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.swf", formulaSwf);
    await fixtureFile(source, "HELP_FORMULAS/ELEMENTARY/EAD/Conversion_1_2.mp3", "english-formula-audio");
    await fixtureFile(source, "HELP_FORMULAS/ELEMENTARY/SAD/Conversion_1_2.mp3", "spanish-formula-audio");

    await assert.rejects(
      buildHelpMathCatalog({ source, output: path.join(source, "generated-catalog") }),
      /inside the preserved source archive/,
    );

    const first = await buildHelpMathCatalog({ source, output: firstOutput, concurrency: 2 });
    await buildHelpMathCatalog({ source, output: secondOutput, concurrency: 1 });

    assert.equal(first.summary.source.fileCount, 13);
    assert.equal(first.summary.swf.placements, 5);
    assert.equal(first.summary.swf.uniqueAssets, 4);
    assert.equal(first.summary.swf.duplicatePlacements, 1);
    assert.equal(first.summary.pairing.pairedSwfFla, 1);
    assert.equal(first.summary.pairing.flaOnly, 1);
    assert.deepEqual(first.summary.references.course, {
      occurrences: 2,
      unique: 2,
      resolved: 1,
      missing: 1,
      unreferencedExisting: 2,
    });
    assert.deepEqual(first.summary.references.keyterm, {
      occurrences: 4,
      unique: 2,
      resolved: 1,
      missing: 1,
      unreferencedExisting: 0,
    });

    const active = first.animations.find((animation) => animation.animationId === "course-g03-l01-in-002");
    const review = first.animations.find((animation) => animation.animationId === "course-g03-l01-in-002-review");
    const formula = first.animations.find((animation) => animation.animationId === "formula-elementary-conversion-01-02");
    assert.ok(active);
    assert.ok(review);
    assert.equal(active.assetId, review.assetId);
    assert.equal(active.isCanonical, true);
    assert.equal(review.duplicateOf, active.animationId);
    assert.equal(active.classification.lessonTitleRaw, "Decimals & Money");
    assert.equal(active.classification.titleEnglish, "Decimal tenths");
    assert.equal(active.classification.titleSpanish, "Décimos");
    assert.equal(active.audio.exact[0].path, "HELP_COURSES/ELMGR3/L1/SA/L1IN02.mp3");
    assert.equal(formula.audio.exact.length, 2);
    assert.equal(first.missingReferences.keyterm[0].filename, "Cubed_root.swf");

    for (const filename of ["animations.json", "animations.jsonl", "animations.csv", "source-files.sha256", "batches.json"]) {
      assert.deepEqual(await readFile(path.join(firstOutput, filename)), await readFile(path.join(secondOutput, filename)));
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("the checked-in full-archive catalog records the evidence-grounded known totals", async () => {
  const summary = JSON.parse(await readFile(new URL("../catalog/summary.json", import.meta.url), "utf8"));
  const batches = JSON.parse(await readFile(new URL("../catalog/batches.json", import.meta.url), "utf8"));
  assert.equal(summary.source.fileCount, 7_919);
  assert.equal(summary.source.extensions.swf, 1_894);
  assert.equal(summary.source.extensions.fla, 1_398);
  assert.equal(summary.source.extensions.mp3, 4_565);
  assert.equal(summary.swf.uniqueAssets, 1_873);
  assert.equal(summary.swf.duplicatePlacements, 21);
  assert.equal(summary.pairing.pairedSwfFla, 1_181);
  assert.equal(summary.pairing.swfOnly, 713);
  assert.equal(summary.pairing.flaOnly, 217);
  assert.deepEqual(summary.fla, {files: 1_398, compoundBinary: 1_398, unrecognized: 0});
  assert.equal(summary.swf.totalFrames, 32_149);
  assert.equal(summary.swf.courseShells, 33);
  assert.deepEqual(summary.swf.fpsValues, [12]);
  assert.equal(summary.references.course.resolved, 1_159);
  assert.equal(summary.references.course.missing, 591);
  assert.equal(summary.references.course.unreferencedExisting, 226);
  assert.equal(summary.references.keyterm.resolved, 443);
  assert.equal(summary.references.keyterm.missing, 317);
  assert.equal(summary.references.keyterm.unreferencedExisting, 16);
  assert.equal(summary.migration.complete, 0);
  assert.match(summary.discrepancies[0].explanation, /Cubed_root\.swf/);
  const batchItems = batches.queues.flatMap((queue) => queue.batches.flatMap((batch) => {
    assert.ok(batch.canonicalAssetCount <= 25);
    return batch.items;
  }));
  assert.equal(batchItems.length, 1_873);
  assert.equal(new Set(batchItems.map((item) => item.assetId)).size, 1_873);
});
