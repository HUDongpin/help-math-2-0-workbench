import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildHelpMathCatalog,
  classifyFlaContainer,
  parseSwfHeader,
} from "./build-help-math-catalog.mjs";

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

test("classifies legacy compound and compressed ZIP FLA containers", () => {
  assert.equal(
    classifyFlaContainer(Buffer.from("d0cf11e0a1b11ae1", "hex")),
    "compound-binary",
  );
  assert.equal(
    classifyFlaContainer(Buffer.from("504b030414000008", "hex")),
    "zip-archive",
  );
  assert.equal(classifyFlaContainer(Buffer.from("not-fla")), "unrecognized");
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

    assert.deepEqual(first.lessonReleases, {schemaVersion: 1, releases: []});
    for (const filename of ["animations.json", "animations.jsonl", "animations.csv", "source-files.sha256", "batches.json", "lesson-releases.json"]) {
      assert.deepEqual(await readFile(path.join(firstOutput, filename)), await readFile(path.join(secondOutput, filename)));
    }
    const checked = await buildHelpMathCatalog({source, output: firstOutput, concurrency: 2, check: true});
    assert.equal(checked.check, true);
    await writeFile(path.join(firstOutput, "lesson-releases.json"), "{}\n");
    await assert.rejects(
      buildHelpMathCatalog({source, output: firstOutput, concurrency: 2, check: true}),
      /Catalog check failed; stale or missing outputs: lesson-releases\.json/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("the checked-in full-archive catalog records the evidence-grounded known totals", async () => {
  const [summary, batches, lessonReleases, catalog, assetCatalog] = await Promise.all([
    readFile(new URL("../catalog/summary.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/batches.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/assets.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(summary.source.fileCount, 9_147);
  assert.equal(summary.source.totalBytes, 3_214_585_414);
  assert.equal(
    summary.source.checksumSetSha256,
    "30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875",
  );
  assert.equal(summary.source.extensions.swf, 2_096);
  assert.equal(summary.source.extensions.fla, 1_541);
  assert.equal(summary.source.extensions.mp3, 5_448);
  assert.equal(summary.swf.uniqueAssets, 2_074);
  assert.equal(summary.swf.duplicateGroups, 22);
  assert.equal(summary.swf.duplicatePlacements, 22);
  assert.equal(summary.pairing.pairedSwfFla, 1_344);
  assert.equal(summary.pairing.swfOnly, 752);
  assert.equal(summary.pairing.flaOnly, 197);
  assert.deepEqual(summary.fla, {
    files: 1_541,
    compoundBinary: 1_540,
    zipArchive: 1,
    unrecognized: 0,
  });
  assert.equal(summary.swf.totalFrames, 34_169);
  assert.equal(summary.swf.courseShells, 33);
  assert.deepEqual(summary.swf.fpsValues, [12]);
  assert.equal(summary.references.course.resolved, 1_361);
  assert.equal(summary.references.course.missing, 389);
  assert.equal(summary.references.course.unreferencedExisting, 226);
  assert.equal(summary.references.keyterm.resolved, 443);
  assert.equal(summary.references.keyterm.missing, 317);
  assert.equal(summary.references.keyterm.unreferencedExisting, 16);
  assert.equal(summary.migration.complete, 0);
  assert.match(summary.discrepancies[0].explanation, /Cubed_root\.swf/);

  assert.deepEqual(
    batches.queues.map((queue) => queue.queueId),
    [
      "release-g04-l03-negative-numbers",
      "grade-3-active",
      "grade-4-active",
      "grade-5-active",
      "shared-keyterms",
      "shared-formulas",
      "legacy-exceptions",
    ],
  );
  const releaseQueue = batches.queues[0];
  assert.equal(releaseQueue.queueType, "complete-lesson-release");
  assert.equal(releaseQueue.releaseId, "lesson-g04-l03-negative-numbers");
  assert.equal(releaseQueue.releaseType, "complete-lesson");
  assert.equal(releaseQueue.grade, 4);
  assert.equal(releaseQueue.lesson, 3);
  assert.equal(releaseQueue.titleDisplay, "Negative Numbers");
  assert.equal(releaseQueue.domain, "negative-numbers-number-line");
  assert.equal(releaseQueue.activeXmlReferencedPageAssetCount, 39);
  assert.equal(releaseQueue.courseShellAssetCount, 1);
  assert.equal(releaseQueue.canonicalAssetCount, 40);
  assert.equal(releaseQueue.releasePartCount, 2);
  assert.deepEqual(
    releaseQueue.batches.map((batch) => ({
      batchId: batch.batchId,
      canonicalAssetCount: batch.canonicalAssetCount,
      releasePart: batch.releasePart,
      releasePartCount: batch.releasePartCount,
      releaseComplete: batch.releaseComplete,
      scaffoldingPrerequisite: batch.scaffoldingPrerequisite,
    })),
    [
      {batchId: "batch-001", canonicalAssetCount: 25, releasePart: 1, releasePartCount: 2, releaseComplete: false, scaffoldingPrerequisite: {kind: "none"}},
      {batchId: "batch-002", canonicalAssetCount: 15, releasePart: 2, releasePartCount: 2, releaseComplete: true, scaffoldingPrerequisite: {kind: "none"}},
    ],
  );
  assert.deepEqual(batches.queues[1].batches[0].scaffoldingPrerequisite, {
    kind: "release-strict",
    releaseId: "lesson-g04-l03-negative-numbers",
  });

  assert.equal(lessonReleases.schemaVersion, 1);
  assert.equal(lessonReleases.releases.length, 4);
  const release = lessonReleases.releases.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  assert.ok(release);
  assert.equal(release.releaseOrder, 1);
  assert.equal(release.releaseId, "lesson-g04-l03-negative-numbers");
  assert.equal(release.publicationMode, "atomic");
  assert.equal(release.developmentMode, "parallel-shards");
  assert.deepEqual(release.sourceLesson, {
    path: "HELP_COURSES/ELMGR4/L3/index.xml",
    bytes: 8_976,
    sha256: "0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0",
    sequenceAuthority: "active-course-xml-global-page-order",
  });
  assert.deepEqual(release.expectedCounts, {
    activeXmlReferencedPages: 39,
    courseShells: 1,
    members: 40,
    shards: 2,
  });
  assert.deepEqual(release.scope, {collection: "course", grade: 4, lesson: 3, excludeNonMembers: true});
  assert.deepEqual(release.shards, [
    {shardId: "shard-01", batchId: "batch-001", ordinal: 1, parallelGroup: "g04-l03-mvp", memberCount: 25, developmentPrerequisites: []},
    {shardId: "shard-02", batchId: "batch-002", ordinal: 2, parallelGroup: "g04-l03-mvp", memberCount: 15, developmentPrerequisites: []},
  ]);
  assert.equal(release.members.length, 40);
  assert.deepEqual(release.members.map((member) => member.ordinal), Array.from({length: 40}, (_, index) => index + 1));
  assert.deepEqual(
    release.members.slice(0, 39).map((member) => member.xmlOccurrence),
    Array.from({length: 39}, (_, index) => index + 1),
  );
  assert.ok(release.members.slice(0, 39).every((member) => member.releaseRole === "active-xml-referenced-page"));
  assert.deepEqual(release.members.at(-1), {
    ordinal: 40,
    animationId: "shell-course-g04-l03-index-local",
    assetId: "swf-817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
    releaseRole: "course-shell",
    batchId: "batch-002",
    shardId: "shard-02",
    source: {
      path: "HELP_COURSES/ELMGR4/L3/index_local.swf",
      sha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
    },
    xmlOccurrence: null,
  });

  const canonicalByAssetId = new Map(
    catalog.animations
      .filter((animation) => animation.isCanonical)
      .map((animation) => [animation.assetId, animation]),
  );
  const numberLinesRelease = lessonReleases.releases.find(
    ({releaseId}) => releaseId === "lesson-g05-l04-number-lines",
  );
  assert.ok(numberLinesRelease);
  assert.equal(numberLinesRelease.releaseOrder, 2);
  assert.equal(numberLinesRelease.publicationMode, "atomic");
  assert.equal(numberLinesRelease.developmentMode, "parallel-shards");
  assert.deepEqual(numberLinesRelease.sourceLesson, {
    path: "HELP_COURSES/ELMGR5/L4/index.xml",
    bytes: 11_841,
    sha256: "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36",
    sequenceAuthority: "active-course-xml-global-page-order",
  });
  assert.deepEqual(numberLinesRelease.expectedCounts, {
    activeXmlReferencedPages: 54,
    courseShells: 1,
    members: 55,
    shards: 3,
  });
  assert.deepEqual(numberLinesRelease.shards, [
    {
      shardId: "g05-l04-host-language",
      batchId: "g05-l04-host-language",
      ordinal: 1,
      parallelGroup: "g05-l04-mvp",
      memberCount: 15,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l04-instruction",
      batchId: "g05-l04-instruction",
      ordinal: 2,
      parallelGroup: "g05-l04-mvp",
      memberCount: 21,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l04-practice-assessment",
      batchId: "g05-l04-practice-assessment",
      ordinal: 3,
      parallelGroup: "g05-l04-mvp",
      memberCount: 19,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    numberLinesRelease.members.slice(0, 54).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 54}, (_, index) => index + 1),
  );
  assert.deepEqual(numberLinesRelease.members.at(-1), {
    ordinal: 55,
    animationId: "shell-course-g05-l04-index-local",
    assetId: "swf-7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
    releaseRole: "course-shell",
    batchId: "g05-l04-host-language",
    shardId: "g05-l04-host-language",
    source: {
      path: "HELP_COURSES/ELMGR5/L4/index_local.swf",
      sha256: "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
    },
    xmlOccurrence: null,
  });
  const numberLinesAnimations = numberLinesRelease.members.map((member) => canonicalByAssetId.get(member.assetId));
  assert.ok(numberLinesAnimations.every(Boolean));
  assert.equal(numberLinesAnimations.filter(({pairedFla}) => pairedFla).length, 44);
  assert.equal(numberLinesAnimations.filter(({pairedFla}) => !pairedFla).length, 11);
  assert.ok(numberLinesRelease.members.every((member, index) =>
    member.animationId === numberLinesAnimations[index].animationId &&
    member.source.path === numberLinesAnimations[index].source.path &&
    member.source.sha256 === numberLinesAnimations[index].source.sha256 &&
    member.assetId === numberLinesAnimations[index].assetId
  ));
  const allNumberLinesPlacements = catalog.animations.filter((animation) =>
    animation.classification.collection === "course" &&
    animation.classification.grade === 5 &&
    animation.classification.lesson === 4
  );
  const numberLinesMemberIds = new Set(numberLinesRelease.members.map(({animationId}) => animationId));
  assert.equal(allNumberLinesPlacements.length, 65);
  assert.equal(allNumberLinesPlacements.filter(({animationId}) => !numberLinesMemberIds.has(animationId)).length, 10);

  const addSubtractRelease = lessonReleases.releases.find(
    ({releaseId}) => releaseId === "lesson-g05-l05-add-subtract-negative-numbers",
  );
  assert.ok(addSubtractRelease);
  assert.equal(addSubtractRelease.releaseOrder, 3);
  assert.equal(addSubtractRelease.publicationMode, "atomic");
  assert.equal(addSubtractRelease.developmentMode, "parallel-shards");
  assert.deepEqual(addSubtractRelease.sourceLesson, {
    path: "HELP_COURSES/ELMGR5/L5/index.xml",
    bytes: 11_084,
    sha256: "b6aef32a4be5684cccc7a4f105fe5ca92129c2292f19a71cf975f24bb133fa9e",
    sequenceAuthority: "active-course-xml-global-page-order",
  });
  assert.deepEqual(addSubtractRelease.expectedCounts, {
    activeXmlReferencedPages: 56,
    courseShells: 1,
    members: 57,
    shards: 3,
  });
  assert.deepEqual(addSubtractRelease.shards, [
    {
      shardId: "g05-l05-host-language",
      batchId: "g05-l05-host-language",
      ordinal: 1,
      parallelGroup: "g05-l05-mvp",
      memberCount: 18,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l05-instruction",
      batchId: "g05-l05-instruction",
      ordinal: 2,
      parallelGroup: "g05-l05-mvp",
      memberCount: 19,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l05-practice-assessment",
      batchId: "g05-l05-practice-assessment",
      ordinal: 3,
      parallelGroup: "g05-l05-mvp",
      memberCount: 20,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    addSubtractRelease.members.slice(0, 56).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 56}, (_, index) => index + 1),
  );
  assert.deepEqual(addSubtractRelease.members.at(-1), {
    ordinal: 57,
    animationId: "shell-course-g05-l05-index-local",
    assetId: "swf-5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66",
    releaseRole: "course-shell",
    batchId: "g05-l05-host-language",
    shardId: "g05-l05-host-language",
    source: {
      path: "HELP_COURSES/ELMGR5/L5/index_local.swf",
      sha256: "5375c535f0761ae580f00eeda29c00d34d0de901239a7d2c65acf968a8290c66",
    },
    xmlOccurrence: null,
  });
  const addSubtractAnimations = addSubtractRelease.members.map((member) => canonicalByAssetId.get(member.assetId));
  assert.ok(addSubtractAnimations.every(Boolean));
  assert.equal(addSubtractAnimations.filter(({pairedFla}) => pairedFla).length, 49);
  assert.equal(addSubtractAnimations.filter(({pairedFla}) => !pairedFla).length, 8);
  assert.ok(addSubtractRelease.members.every((member, index) =>
    member.animationId === addSubtractAnimations[index].animationId &&
    member.source.path === addSubtractAnimations[index].source.path &&
    member.source.sha256 === addSubtractAnimations[index].source.sha256 &&
    member.assetId === addSubtractAnimations[index].assetId
  ));
  const allAddSubtractPlacements = catalog.animations.filter((animation) =>
    animation.classification.collection === "course" &&
    animation.classification.grade === 5 &&
    animation.classification.lesson === 5
  );
  const addSubtractMemberIds = new Set(addSubtractRelease.members.map(({animationId}) => animationId));
  assert.equal(allAddSubtractPlacements.length, 68);
  assert.equal(allAddSubtractPlacements.filter(({animationId}) => !addSubtractMemberIds.has(animationId)).length, 11);

  const perimeterAreaRelease = lessonReleases.releases.find(
    ({releaseId}) => releaseId === "lesson-g04-l10-perimeter-area",
  );
  assert.ok(perimeterAreaRelease);
  assert.equal(perimeterAreaRelease.releaseOrder, 4);
  assert.equal(perimeterAreaRelease.publicationMode, "atomic");
  assert.equal(perimeterAreaRelease.developmentMode, "parallel-shards");
  assert.deepEqual(perimeterAreaRelease.sourceLesson, {
    path: "HELP_COURSES/ELMGR4/L10/index.xml",
    bytes: 10_209,
    sha256: "652b236f1ad46077e75accc6fe7acb091cbd0bd24b8d99fa0b1f5ffeb1a379e9",
    sequenceAuthority: "active-course-xml-global-page-order",
  });
  assert.deepEqual(perimeterAreaRelease.expectedCounts, {
    activeXmlReferencedPages: 46,
    courseShells: 1,
    members: 47,
    shards: 3,
  });
  assert.deepEqual(perimeterAreaRelease.shards, [
    {
      shardId: "g04-l10-host-language",
      batchId: "g04-l10-host-language",
      ordinal: 1,
      parallelGroup: "g04-l10-mvp",
      memberCount: 16,
      developmentPrerequisites: [],
    },
    {
      shardId: "g04-l10-instruction",
      batchId: "g04-l10-instruction",
      ordinal: 2,
      parallelGroup: "g04-l10-mvp",
      memberCount: 15,
      developmentPrerequisites: [],
    },
    {
      shardId: "g04-l10-practice-assessment",
      batchId: "g04-l10-practice-assessment",
      ordinal: 3,
      parallelGroup: "g04-l10-mvp",
      memberCount: 16,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    perimeterAreaRelease.members.slice(0, 46).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 46}, (_, index) => index + 1),
  );
  assert.deepEqual(perimeterAreaRelease.members.at(-1), {
    ordinal: 47,
    animationId: "shell-course-g04-l10-index-local",
    assetId: "swf-050d4181f8d679e6232871371b70aeaa02dbecb4c7e16cfbc732437307cf6072",
    releaseRole: "course-shell",
    batchId: "g04-l10-host-language",
    shardId: "g04-l10-host-language",
    source: {
      path: "HELP_COURSES/ELMGR4/L10/index_local.swf",
      sha256: "050d4181f8d679e6232871371b70aeaa02dbecb4c7e16cfbc732437307cf6072",
    },
    xmlOccurrence: null,
  });
  const perimeterAreaAnimations = perimeterAreaRelease.members.map(
    (member) => canonicalByAssetId.get(member.assetId),
  );
  assert.ok(perimeterAreaAnimations.every(Boolean));
  assert.equal(perimeterAreaAnimations.filter(({pairedFla}) => pairedFla).length, 34);
  assert.equal(perimeterAreaAnimations.filter(({pairedFla}) => !pairedFla).length, 13);
  assert.ok(perimeterAreaRelease.members.every((member, index) =>
    member.animationId === perimeterAreaAnimations[index].animationId &&
    member.source.path === perimeterAreaAnimations[index].source.path &&
    member.source.sha256 === perimeterAreaAnimations[index].source.sha256 &&
    member.assetId === perimeterAreaAnimations[index].assetId
  ));
  const allPerimeterAreaPlacements = catalog.animations.filter((animation) =>
    animation.classification.collection === "course" &&
    animation.classification.grade === 4 &&
    animation.classification.lesson === 10
  );
  const perimeterAreaMemberIds = new Set(
    perimeterAreaRelease.members.map(({animationId}) => animationId),
  );
  assert.equal(allPerimeterAreaPlacements.length, 54);
  assert.equal(
    allPerimeterAreaPlacements.filter(({animationId}) => !perimeterAreaMemberIds.has(animationId)).length,
    7,
  );

  const releaseAnimations = releaseQueue.batches.flatMap((batch) => batch.items)
    .map((item) => canonicalByAssetId.get(item.assetId));
  assert.ok(releaseAnimations.every(Boolean));
  assert.equal(
    releaseAnimations.filter((animation) =>
      animation.flags.referenced &&
      !animation.flags.variant &&
      !animation.flags.shell
    ).length,
    39,
  );
  assert.deepEqual(
    releaseAnimations.filter((animation) => animation.flags.shell).map((animation) => animation.animationId),
    ["shell-course-g04-l03-index-local"],
  );
  assert.equal(
    releaseAnimations.filter((animation) => animation.animationId === "course-g04-l03-in-009").length,
    1,
  );
  assert.ok(releaseAnimations.every((animation) =>
    animation.classification.collection === "course" &&
    animation.classification.grade === 4 &&
    animation.classification.lesson === 3
  ));

  const grade4Active = batches.queues.find((queue) => queue.queueId === "grade-4-active");
  assert.equal(batches.canonicalAssetCount, 2_074);
  assert.equal(batches.batchCount, 85);
  assert.equal(grade4Active.canonicalAssetCount, 606);
  assert.equal(grade4Active.batches.length, 25);
  assert.equal(grade4Active.batches.at(-1).canonicalAssetCount, 6);
  const l2PlacementAliasAssetId =
    "swf-a618a0d7c299ac0696d8f824c44fb1c2bc3f6971402ff1a2f93e123b526b052e";
  const l2PlacementAliasAnimations = catalog.animations
    .filter((animation) => animation.assetId === l2PlacementAliasAssetId);
  assert.deepEqual(
    l2PlacementAliasAnimations.map((animation) => ({
      animationId: animation.animationId,
      sourcePath: animation.source.path,
      isCanonical: animation.isCanonical,
      canonicalAnimationId: animation.canonicalAnimationId,
      referenced: animation.flags.referenced,
    })),
    [
      {
        animationId: "course-g04-l02-ir-001",
        sourcePath: "HELP_COURSES/ELMGR4/L2/IR/L2RW01.swf",
        isCanonical: true,
        canonicalAnimationId: "course-g04-l02-ir-001",
        referenced: true,
      },
      {
        animationId: "course-g04-l02-rw-001",
        sourcePath: "HELP_COURSES/ELMGR4/L2/RW/L2RW01.swf",
        isCanonical: false,
        canonicalAnimationId: "course-g04-l02-ir-001",
        referenced: false,
      },
    ],
  );
  assert.ok(grade4Active.batches.flatMap((batch) => batch.items).every((item) => {
    const animation = canonicalByAssetId.get(item.assetId);
    return animation.classification.lesson !== 3;
  }));
  const legacyQueue = batches.queues.find((queue) => queue.queueId === "legacy-exceptions");
  assert.equal(legacyQueue.canonicalAssetCount, 224);
  assert.equal(legacyQueue.batches.length, 9);
  assert.equal(legacyQueue.batches.at(-1).canonicalAssetCount, 24);
  const legacyG4L3 = legacyQueue
    .batches.flatMap((batch) => batch.items)
    .map((item) => canonicalByAssetId.get(item.assetId))
    .filter((animation) =>
      animation.classification.collection === "course" &&
      animation.classification.grade === 4 &&
      animation.classification.lesson === 3
    );
  assert.equal(legacyG4L3.length, 9);
  assert.ok(legacyG4L3.every((animation) =>
    animation.flags.unreferenced &&
    animation.flags.variant &&
    !animation.flags.shell
  ));

  const releaseAssetIds = new Set(releaseAnimations.map((animation) => animation.assetId));
  const sectionOrder = new Map(["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ", "RE"].map((code, index) => [code, index]));
  const compareForMigration = (left, right) => {
    const leftGrade = typeof left.classification.grade === "number" ? left.classification.grade : 99;
    const rightGrade = typeof right.classification.grade === "number" ? right.classification.grade : 99;
    return leftGrade - rightGrade ||
      (left.classification.lesson ?? 99) - (right.classification.lesson ?? 99) ||
      (sectionOrder.get(left.classification.section?.code) ?? 99) - (sectionOrder.get(right.classification.section?.code) ?? 99) ||
      (left.classification.page.number ?? 9_999) - (right.classification.page.number ?? 9_999) ||
      (left.canonicalAnimationId < right.canonicalAnimationId ? -1 : left.canonicalAnimationId > right.canonicalAnimationId ? 1 : 0);
  };
  const previousQueuePredicates = [
    (asset) => asset.classification.collection === "course" && asset.classification.grade === 3 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    (asset) => asset.classification.collection === "course" && asset.classification.grade === 4 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    (asset) => asset.classification.collection === "course" && asset.classification.grade === 5 && asset.flags.referenced && !asset.flags.variant && !asset.flags.shell,
    (asset) => asset.classification.collection === "keyterm" && asset.flags.referenced,
    (asset) => asset.classification.collection === "formula",
    () => true,
  ];
  const previouslyAssigned = new Set();
  const previousRelativeOrder = [];
  for (const predicate of previousQueuePredicates) {
    const selected = assetCatalog.assets
      .filter((asset) => !previouslyAssigned.has(asset.assetId) && predicate(asset))
      .sort(compareForMigration);
    for (const asset of selected) {
      previouslyAssigned.add(asset.assetId);
      if (!releaseAssetIds.has(asset.assetId)) previousRelativeOrder.push(asset.assetId);
    }
  }
  const currentRelativeOrder = batches.queues
    .slice(1)
    .flatMap((queue) => queue.batches.flatMap((batch) => batch.items.map((item) => item.assetId)));
  assert.equal(currentRelativeOrder.length, 2_034);
  assert.deepEqual(currentRelativeOrder, previousRelativeOrder);

  const batchItems = batches.queues.flatMap((queue) => queue.batches.flatMap((batch) => {
    assert.ok(batch.canonicalAssetCount <= 25);
    return batch.items;
  }));
  assert.equal(batchItems.length, 2_074);
  assert.equal(new Set(batchItems.map((item) => item.assetId)).size, 2_074);
});
