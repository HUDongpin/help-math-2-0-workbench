import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { chmod, link, lstat, mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertLessonReleaseInvariants,
  buildHelpMathCatalog,
  classifyFlaContainer,
  loadCurrentSourceProfile,
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
    assert.equal(first.outputFiles.length, 17);
    assert.equal(first.outputFiles.includes("current-source-profile.json"), false);

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

test("loads only a hash-bound, real, single-link current-source profile", async () => {
  const temporaryRoot = await mkdtemp(path.join(await realpath(os.tmpdir()), "helpmath-source-profile-"));
  const outputRoot = path.join(temporaryRoot, "catalog");
  const profilePath = path.join(outputRoot, "current-source-profile.json");

  try {
    await mkdir(outputRoot, { recursive: true });
    const contents = await readFile(new URL("../catalog/current-source-profile.json", import.meta.url));
    const sha256 = createHash("sha256").update(contents).digest("hex");
    await writeFile(profilePath, contents);
    await assert.rejects(
      loadCurrentSourceProfile({ outputRoot, expectedProfileSha256: sha256 }),
      /must be read-only/,
    );
    await chmod(profilePath, 0o444);

    const selectedByDefault = await loadCurrentSourceProfile({ outputRoot, expectedProfileSha256: sha256 });
    assert.deepEqual(
      { path: selectedByDefault.path, bytes: selectedByDefault.bytes, sha256: selectedByDefault.sha256 },
      { path: profilePath, bytes: contents.length, sha256 },
    );
    assert.equal(selectedByDefault.profile.schemaVersion, 1);
    assert.equal(selectedByDefault.profile.artifactType, "help-math-current-source-profile");
    assert.equal(selectedByDefault.filesystemIdentity.nlink, 1);
    const selectedByImplicitBaseAuthority = await loadCurrentSourceProfile({ outputRoot });
    assert.equal(selectedByImplicitBaseAuthority.sha256, sha256);
    assert.equal(selectedByImplicitBaseAuthority.authority.type,
      "checked-in-base-profile-sha256");

    const selectedExplicitly = await loadCurrentSourceProfile({
      outputRoot: path.join(temporaryRoot, "unused-output"),
      expectedProfile: profilePath,
      expectedProfileSha256: sha256,
    });
    assert.equal(selectedExplicitly.sha256, sha256);

    await assert.rejects(
      loadCurrentSourceProfile({ outputRoot, expectedProfileSha256: "0".repeat(64) }),
      /Current source profile SHA-256 mismatch/,
    );
    await assert.rejects(
      loadCurrentSourceProfile({ outputRoot, expectedProfileSha256: "ABC" }),
      /lowercase SHA-256 digest/,
    );
    await assert.rejects(
      buildHelpMathCatalog({ expectedProfile: profilePath }),
      /require verifyKnownCounts/,
    );
    await assert.rejects(
      buildHelpMathCatalog({ verifyKnownCounts: true, expectedProfile: profilePath }),
      /requires expectedProfileSha256/,
    );

    const symlinkPath = path.join(temporaryRoot, "profile-symlink.json");
    await symlink(profilePath, symlinkPath);
    await assert.rejects(
      loadCurrentSourceProfile({ outputRoot, expectedProfile: symlinkPath }),
      /cannot be a symbolic link/,
    );

    const hardlinkPath = path.join(temporaryRoot, "profile-hardlink.json");
    await link(profilePath, hardlinkPath);
    await assert.rejects(
      loadCurrentSourceProfile({ outputRoot, expectedProfile: hardlinkPath }),
      /exactly one hard link/,
    );

    const realProfileDirectory = path.join(temporaryRoot, "real-profile-directory");
    const aliasProfileDirectory = path.join(temporaryRoot, "alias-profile-directory");
    const nestedProfilePath = path.join(realProfileDirectory, "profile.json");
    await mkdir(realProfileDirectory);
    await writeFile(nestedProfilePath, contents);
    await chmod(nestedProfilePath, 0o444);
    await symlink(realProfileDirectory, aliasProfileDirectory);
    await assert.rejects(
      loadCurrentSourceProfile({
        outputRoot,
        expectedProfile: path.join(aliasProfileDirectory, "profile.json"),
      }),
      /cannot contain symbolic-link components/,
    );

    const invalidSchemaPath = path.join(temporaryRoot, "invalid-schema.json");
    const invalidSchema = JSON.parse(contents.toString("utf8"));
    invalidSchema.unapproved = true;
    const invalidSchemaBytes = Buffer.from(`${JSON.stringify(invalidSchema)}\n`);
    await writeFile(invalidSchemaPath, invalidSchemaBytes);
    await chmod(invalidSchemaPath, 0o444);
    await assert.rejects(
      loadCurrentSourceProfile({
        outputRoot,
        expectedProfile: invalidSchemaPath,
        expectedProfileSha256: createHash("sha256").update(invalidSchemaBytes).digest("hex"),
      }),
      /must contain exactly these keys/,
    );

    const inconsistentProfilePath = path.join(temporaryRoot, "inconsistent-profile.json");
    const inconsistentProfile = JSON.parse(contents.toString("utf8"));
    inconsistentProfile.expected.swfOnly += 1;
    const inconsistentProfileBytes = Buffer.from(`${JSON.stringify(inconsistentProfile)}\n`);
    await writeFile(inconsistentProfilePath, inconsistentProfileBytes);
    await chmod(inconsistentProfilePath, 0o444);
    await assert.rejects(
      loadCurrentSourceProfile({
        outputRoot,
        expectedProfile: inconsistentProfilePath,
        expectedProfileSha256: createHash("sha256").update(inconsistentProfileBytes).digest("hex"),
      }),
      /internally inconsistent/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("binds the current G5 L4 FQ source profile to the approved historical source-only transaction", async () => {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const receiptPath = path.join(
    projectRoot,
    "catalog/source-promotions/g5-l4-fq-audio-source-profile-reconciliation-v1.json",
  );
  const reviewPath = path.join(
    projectRoot,
    "catalog/source-promotions/g5-l4-fq-audio-promotion-review-v1.json",
  );
  const sourceRoot = path.join(
    projectRoot,
    "source-assets/flash/HELP MATH_ORIGINAL FILES",
  );
  const [receiptBytes, reviewBytes] = await Promise.all([
    readFile(receiptPath),
    readFile(reviewPath),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const review = JSON.parse(reviewBytes);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.artifactType, "g5-l4-fq-audio-source-profile-reconciliation");
  assert.equal(receipt.status, "verified-current-branch-source-custody-reconciliation");
  assert.deepEqual(receipt.observedCanonicalSource, {
    fileCount: 9244,
    totalBytes: 3219753760,
    checksumSetSha256: "10173f6dd19e934901a1188ba45d8e22423dbac3212b8f2560e90e2fd536bfcc",
    manifestSha256: "aee72ac1f1c0d0d28f07d36186fb2b049ca0f64a130b61f6a1a3a8a99c5a2fad",
    currentSourceProfilePath: "catalog/current-source-profile.json",
    currentSourceProfileBytes: 2084,
    currentSourceProfileSha256: "a7d8a1bbfd8105a408b8bc2f56c109f4a07f560b42d6964d5577138c86b83caf",
  });
  assert.equal(receipt.historicalTransaction.decision.sha256,
    "de481d6a6ceec4759bf2c4cf7f224a9c12385fb552ac1c3599165a015baa3b32");
  assert.equal(receipt.historicalTransaction.appliedReceipt.sha256,
    "7626e32dd38b04e29c4440afe640367d308a0b17e5079e32790ed702dcfa7595");
  assert.equal(receipt.recordBinding.recordCount, 97);
  assert.equal(receipt.recordBinding.totalBytes, 5168346);
  assert.equal(receipt.recordBinding.appliedReceiptRecordSetSha256,
    "0fece5539ee8379781bca32cc77206ce5972c430e1b0d4eb454ce2d37672282f");
  assert.equal(createHash("sha256").update(reviewBytes).digest("hex"),
    receipt.recordBinding.currentReviewArtifactSha256);

  const records = review.records
    .map(({id, language, canonicalPath, bytes, sha256}) => ({
      id,
      language,
      canonicalPath,
      bytes,
      sha256,
    }))
    .sort((left, right) => left.canonicalPath < right.canonicalPath
      ? -1
      : left.canonicalPath > right.canonicalPath ? 1 : 0);
  assert.equal(records.length, 97);
  assert.equal(records.reduce((sum, record) => sum + record.bytes, 0), 5168346);
  assert.equal(createHash("sha256").update(JSON.stringify(records)).digest("hex"),
    receipt.recordBinding.currentPhysicalObservationRecordSetSha256);
  for (const record of records) {
    const sourcePath = path.join(sourceRoot, ...record.canonicalPath.split("/"));
    const [bytes, information] = await Promise.all([readFile(sourcePath), lstat(sourcePath)]);
    assert.equal(information.isFile(), true, record.canonicalPath);
    assert.equal(information.isSymbolicLink(), false, record.canonicalPath);
    assert.equal(information.mode & 0o222, 0, record.canonicalPath);
    assert.equal(bytes.length, record.bytes, record.canonicalPath);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256,
      record.canonicalPath);
  }
  assert.equal(receipt.acceptanceEffect.canonicalSourcePromoted, true);
  assert.ok(Object.entries(receipt.acceptanceEffect)
    .filter(([key]) => key !== "canonicalSourcePromoted")
    .every(([, value]) => value === false));
});

test("binds the canonical G5 L3 source promotion to the reviewed 43-file copy set", async () => {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const promotionRoot = path.join(projectRoot, "catalog/source-promotions");
  const sourceRoot = path.join(
    projectRoot,
    "source-assets/flash/HELP MATH_ORIGINAL FILES",
  );
  const [receiptBytes, successorBytes, planBytes] = await Promise.all([
    readFile(path.join(
      promotionRoot,
      "g5-l3-active-source-promotion-main-applied-v1.json",
    )),
    readFile(path.join(
      promotionRoot,
      "g5-l3-active-source-promotion-main-successor-v1.json",
    )),
    readFile(path.join(
      promotionRoot,
      "g5-l3-active-source-promotion-2026-08-21.json",
    )),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const successor = JSON.parse(successorBytes);
  const plan = JSON.parse(planBytes);

  assert.equal(
    receipt.artifactType,
    "help-math-g5-l3-main-source-promotion-applied-receipt",
  );
  assert.deepEqual(receipt.scope, {grade: 5, lesson: 3, pageOnly: true});
  assert.equal(receipt.canonicalBoundary.canonicalProjectWideSourcePromoted, true);
  assert.equal(receipt.canonicalBoundary.mainCheckoutModified, true);
  assert.equal(receipt.canonicalBoundary.legacyFlashCourseShellExcluded, true);
  assert.equal(
    createHash("sha256").update(planBytes).digest("hex"),
    receipt.plan.sha256,
  );
  assert.equal(
    createHash("sha256").update(successorBytes).digest("hex"),
    receipt.currentnessSuccessor.sha256,
  );
  assert.equal(successor.mode, "plan-only-no-source-mutation");
  assert.equal(successor.transaction.copyTransactionReady, true);
  assert.equal(successor.transaction.copyTransactionConflictCount, 0);
  assert.equal(successor.transaction.allPreReviewHoldsResolved, true);
  assert.deepEqual(receipt.copied, {
    copiedFileCount: 43,
    copiedBytes: 51396667,
  });
  assert.deepEqual(receipt.postchecks.freeze, {
    fileCount: 9287,
    totalBytes: 3271150427,
    manifestSha256: "2bc7bf524436cc21616648bac9b5d3596db862be22be43929708f9433a5897c7",
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  });
  assert.equal(
    receipt.postchecks.source.checksumSetSha256,
    "c916317555e7e5f5aa667b8b200b081d8ee91fd436957673bc0b41711984b247",
  );
  assert.equal(receipt.postchecks.promotedMissingReferences, 0);

  const records = [...plan.copyRecords].sort((left, right) =>
    left.canonicalPath < right.canonicalPath
      ? -1
      : left.canonicalPath > right.canonicalPath ? 1 : 0);
  assert.equal(records.length, 43);
  assert.equal(records.filter(({sourceType}) => sourceType === "active-page-swf").length, 24);
  assert.equal(records.filter(({sourceType}) => sourceType === "same-path-fla").length, 19);
  assert.equal(records.reduce((sum, record) => sum + record.bytes, 0), 51396667);
  const recordSet = records
    .map(({canonicalPath, bytes, sha256}) =>
      `${canonicalPath}\t${bytes}\t${sha256}\n`)
    .join("");
  assert.equal(
    createHash("sha256").update(recordSet).digest("hex"),
    receipt.plan.copyRecordSetSha256,
  );
  for (const record of records) {
    const sourcePath = path.join(sourceRoot, ...record.canonicalPath.split("/"));
    const [bytes, information] = await Promise.all([readFile(sourcePath), lstat(sourcePath)]);
    assert.equal(information.isFile(), true, record.canonicalPath);
    assert.equal(information.isSymbolicLink(), false, record.canonicalPath);
    assert.equal(information.mode & 0o222, 0, record.canonicalPath);
    assert.equal(bytes.length, record.bytes, record.canonicalPath);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      record.sha256,
      record.canonicalPath,
    );
  }
  assert.equal(receipt.acceptanceEffects.canonicalProjectWideSourcePromotion, true);
  assert.ok(Object.entries(receipt.acceptanceEffects)
    .filter(([key]) => key !== "canonicalProjectWideSourcePromotion")
    .every(([, value]) => value === false));
});

test("binds the canonical G5 L2 source promotion to its exact two-page gap", async () => {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const promotionRoot = path.join(projectRoot, "catalog/source-promotions");
  const sourceRoot = path.join(
    projectRoot,
    "source-assets/flash/HELP MATH_ORIGINAL FILES",
  );
  const [receiptBytes, planBytes] = await Promise.all([
    readFile(path.join(
      promotionRoot,
      "g5-l2-active-source-promotion-main-applied-v1.json",
    )),
    readFile(path.join(promotionRoot, "g5-l2-active-source-promotion-v1.json")),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const plan = JSON.parse(planBytes);
  assert.equal(
    receipt.artifactType,
    "help-math-g5-l2-main-source-promotion-applied-receipt",
  );
  assert.deepEqual(receipt.scope, {grade: 5, lesson: 2, pageOnly: true});
  assert.equal(createHash("sha256").update(planBytes).digest("hex"), receipt.plan.sha256);
  assert.deepEqual(receipt.copied, {copiedFileCount: 3, copiedBytes: 6631132});
  assert.equal(receipt.postchecks.freeze.fileCount, 9290);
  assert.equal(receipt.postchecks.freeze.totalBytes, 3277781559);
  assert.equal(
    receipt.postchecks.freeze.manifestSha256,
    "b98ce8fbf09860f19f96f57f99834fea1486d58d2cc7b578e06e99ecce775162",
  );
  assert.equal(receipt.postchecks.freeze.writableEntriesAfterFreeze, 0);
  assert.equal(receipt.postchecks.promotedMissingReferences, 0);
  assert.equal(plan.copyRecords.length, 3);
  assert.equal(plan.copyRecords.filter(({sourceType}) =>
    sourceType === "active-page-swf").length, 2);
  assert.equal(plan.copyRecords.filter(({sourceType}) =>
    sourceType === "same-path-fla").length, 1);
  for (const record of plan.copyRecords) {
    const sourcePath = path.join(sourceRoot, ...record.canonicalPath.split("/"));
    const [bytes, information] = await Promise.all([readFile(sourcePath), lstat(sourcePath)]);
    assert.equal(information.isFile(), true, record.canonicalPath);
    assert.equal(information.isSymbolicLink(), false, record.canonicalPath);
    assert.equal(information.mode & 0o222, 0, record.canonicalPath);
    assert.equal(bytes.length, record.bytes, record.canonicalPath);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256,
      record.canonicalPath);
  }
  assert.equal(receipt.acceptanceEffects.canonicalProjectWideSourcePromotion, true);
  assert.equal(receipt.acceptanceEffects.wholeLessonActivePageSourceCoverage, "64/64");
  assert.equal(receipt.acceptanceEffects.audioDependencyClosureEstablished, false);
  for (const key of [
    "currentJavaScriptRegistered",
    "originalRuntimeAccepted",
    "visualFidelityAccepted",
    "audioAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictComplete",
    "released",
    "published",
  ]) assert.equal(receipt.acceptanceEffects[key], false, key);
});

test("binds the canonical G5 L6 source promotion to its exact thirteen-page gap", async () => {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const promotionRoot = path.join(projectRoot, "catalog/source-promotions");
  const sourceRoot = path.join(
    projectRoot,
    "source-assets/flash/HELP MATH_ORIGINAL FILES",
  );
  const [receiptBytes, planBytes] = await Promise.all([
    readFile(path.join(
      promotionRoot,
      "g5-l6-active-source-promotion-main-applied-v1.json",
    )),
    readFile(path.join(promotionRoot, "g5-l6-active-source-promotion-v1.json")),
  ]);
  const receipt = JSON.parse(receiptBytes);
  const plan = JSON.parse(planBytes);
  assert.equal(
    receipt.artifactType,
    "help-math-g5-l6-main-source-promotion-applied-receipt",
  );
  assert.deepEqual(receipt.scope, {grade: 5, lesson: 6, pageOnly: true});
  assert.equal(createHash("sha256").update(planBytes).digest("hex"), receipt.plan.sha256);
  assert.deepEqual(receipt.copied, {
    copiedFileCount: 23,
    copiedBytes: 30702445,
    activePageSwfs: 13,
    samePathFlas: 10,
  });
  assert.deepEqual(receipt.postchecks.freeze, {
    fileCount: 9313,
    totalBytes: 3308484004,
    manifestSha256: "f4de727e98372ca550b9f87220305c8b4d5b226b26e06573ae4ca7c7d40b9549",
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  });
  assert.equal(
    receipt.postchecks.source.checksumSetSha256,
    "d2593c9e69cc7d24261bafdfade23427fef2e1eacb21ff5882cc1242438fcb0a",
  );
  assert.equal(receipt.updatedProfile.sha256,
    "1639b96e11a3cf1ef8c1c04403ee1f1d6537e0426b6d9dd6139bf39a507e06c4");
  assert.equal(receipt.postchecks.promotedMissingReferences, 0);
  assert.equal(receipt.postchecks.wholeLessonActivePageSourceCoverage, "40/40");
  assert.equal(plan.copyRecords.length, 23);
  assert.equal(plan.copyRecords.filter(({sourceType}) =>
    sourceType === "active-page-swf").length, 13);
  assert.equal(plan.copyRecords.filter(({sourceType}) =>
    sourceType === "same-path-fla").length, 10);
  const recordSet = [...plan.copyRecords]
    .sort((left, right) => left.canonicalPath < right.canonicalPath ? -1 :
      left.canonicalPath > right.canonicalPath ? 1 : 0)
    .map(({canonicalPath, bytes, sha256}) =>
      `${canonicalPath}\t${bytes}\t${sha256}\n`)
    .join("");
  assert.equal(createHash("sha256").update(recordSet).digest("hex"),
    receipt.plan.copyRecordSetSha256);
  for (const record of plan.copyRecords) {
    const sourcePath = path.join(sourceRoot, ...record.canonicalPath.split("/"));
    const [bytes, information] = await Promise.all([readFile(sourcePath), lstat(sourcePath)]);
    assert.equal(information.isFile(), true, record.canonicalPath);
    assert.equal(information.isSymbolicLink(), false, record.canonicalPath);
    assert.equal(information.mode & 0o222, 0, record.canonicalPath);
    assert.equal(bytes.length, record.bytes, record.canonicalPath);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256,
      record.canonicalPath);
  }
  assert.equal(receipt.acceptanceEffects.canonicalProjectWideSourcePromotion, true);
  assert.equal(receipt.acceptanceEffects.wholeLessonActivePageSourceCoverage, "40/40");
  assert.equal(receipt.acceptanceEffects.audioDependencyClosureEstablished, false);
  for (const key of [
    "currentJavaScriptRegistered",
    "originalRuntimeAccepted",
    "visualFidelityAccepted",
    "audioAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictComplete",
    "released",
    "published",
  ]) assert.equal(receipt.acceptanceEffects[key], false, key);
});

test("the checked-in full-archive catalog records the evidence-grounded known totals", async () => {
  const [summary, batches, lessonReleases, catalog, assetCatalog, currentSourceProfile, lessonReleasesBytes] = await Promise.all([
    readFile(new URL("../catalog/summary.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/batches.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/animations.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/assets.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/current-source-profile.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../catalog/lesson-releases.json", import.meta.url)),
  ]);
  assert.equal(summary.source.fileCount, 9_313);
  assert.equal(summary.source.totalBytes, 3_308_484_004);
  assert.equal(
    summary.source.checksumSetSha256,
    "d2593c9e69cc7d24261bafdfade23427fef2e1eacb21ff5882cc1242438fcb0a",
  );
  assert.equal(summary.source.extensions.swf, 2_135);
  assert.equal(summary.source.extensions.fla, 1_571);
  assert.equal(summary.source.extensions.mp3, 5_545);
  assert.equal(summary.swf.uniqueAssets, 2_112);
  assert.equal(summary.swf.duplicateGroups, 23);
  assert.equal(summary.swf.duplicatePlacements, 23);
  assert.equal(summary.pairing.pairedSwfFla, 1_375);
  assert.equal(summary.pairing.swfOnly, 760);
  assert.equal(summary.pairing.flaOnly, 196);
  assert.deepEqual(summary.fla, {
    files: 1_571,
    compoundBinary: 1_570,
    zipArchive: 1,
    unrecognized: 0,
  });
  assert.equal(summary.swf.totalFrames, 34_566);
  assert.equal(summary.swf.courseShells, 33);
  assert.deepEqual(summary.swf.fpsValues, [12]);
  assert.equal(summary.references.course.resolved, 1_400);
  assert.equal(summary.references.course.missing, 350);
  assert.equal(summary.references.course.unreferencedExisting, 226);
  assert.equal(summary.references.keyterm.resolved, 443);
  assert.equal(summary.references.keyterm.missing, 317);
  assert.equal(summary.references.keyterm.unreferencedExisting, 16);
  assert.equal(summary.migration.complete, 0);
  assert.match(summary.discrepancies[0].explanation, /Cubed_root\.swf/);
  assert.deepEqual(currentSourceProfile, {
    schemaVersion: 1,
    artifactType: "help-math-current-source-profile",
    expected: {
      files: summary.source.fileCount,
      totalBytes: summary.source.totalBytes,
      checksumSetSha256: summary.source.checksumSetSha256,
      sourceExtensions: summary.source.extensions,
      swf: summary.source.extensions.swf,
      fla: summary.source.extensions.fla,
      mp3: summary.source.extensions.mp3,
      xml: summary.source.extensions.xml,
      courseXml: summary.xml.courseFiles,
      swfByCollection: {
        course: summary.swf.byCollection.course,
        keyterm: summary.swf.byCollection.keyterm,
        formula: summary.swf.byCollection.formula,
        unknown: summary.swf.byCollection.unknown,
      },
      uniqueSwfAssets: summary.swf.uniqueAssets,
      duplicateGroups: summary.swf.duplicateGroups,
      duplicatePlacements: summary.swf.duplicatePlacements,
      pairedSwfFla: summary.pairing.pairedSwfFla,
      swfOnly: summary.pairing.swfOnly,
      flaOnly: summary.pairing.flaOnly,
      compoundBinaryFla: summary.fla.compoundBinary,
      zipArchiveFla: summary.fla.zipArchive,
      unrecognizedFla: summary.fla.unrecognized,
      swfFrames: summary.swf.totalFrames,
      swfHeader: {
        signatures: summary.swf.signatures,
        fpsValues: summary.swf.fpsValues,
        headerParseErrors: summary.swf.headerParseErrors,
      },
      courseShells: summary.swf.courseShells,
      courseReferences: {
        unique: summary.references.course.unique,
        resolved: summary.references.course.resolved,
        missing: summary.references.course.missing,
        unreferenced: summary.references.course.unreferencedExisting,
      },
      keytermReferences: {
        unique: summary.references.keyterm.unique,
        resolved: summary.references.keyterm.resolved,
        missing: summary.references.keyterm.missing,
        unreferenced: summary.references.keyterm.unreferencedExisting,
      },
      lessonReleases: {
        outputSha256: createHash("sha256").update(lessonReleasesBytes).digest("hex"),
        releaseCount: lessonReleases.releases.length,
        totalMembers: lessonReleases.releases.reduce((total, release) => total + release.members.length, 0),
        releases: lessonReleases.releases.map((release) => ({
          releaseId: release.releaseId,
          memberCount: release.members.length,
        })),
      },
      xmlWithBareAmpersands: summary.xml.filesWithBareAmpersands,
    },
  });
  assert.doesNotThrow(() => assertLessonReleaseInvariants(
    lessonReleases,
    lessonReleasesBytes,
    currentSourceProfile.expected.lessonReleases,
  ));
  assert.throws(
    () => assertLessonReleaseInvariants(
      lessonReleases,
      lessonReleasesBytes,
      { ...currentSourceProfile.expected.lessonReleases, outputSha256: "0".repeat(64) },
    ),
    /lesson-releases output SHA-256/,
  );

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
  assert.equal(releaseQueue.courseShellAssetCount, 0);
  assert.equal(releaseQueue.canonicalAssetCount, 39);
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
      {batchId: "batch-002", canonicalAssetCount: 14, releasePart: 2, releasePartCount: 2, releaseComplete: true, scaffoldingPrerequisite: {kind: "none"}},
    ],
  );
  assert.deepEqual(batches.queues[1].batches[0].scaffoldingPrerequisite, {
    kind: "release-strict",
    releaseId: "lesson-g04-l03-negative-numbers",
  });

  assert.equal(lessonReleases.schemaVersion, 1);
  assert.equal(lessonReleases.releases.length, 5);
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
    uniquePageAnimations: 39,
    courseShells: 0,
    members: 39,
    shards: 2,
  });
  assert.deepEqual(release.scope, {
    collection: "course",
    grade: 4,
    lesson: 3,
    excludeNonMembers: true,
    pageOnly: true,
    legacyFlashCourseShellExcluded: true,
    modernMyLessonHostRetained: true,
  });
  assert.deepEqual(release.shards, [
    {shardId: "shard-01", batchId: "batch-001", ordinal: 1, parallelGroup: "g04-l03-page-only", memberCount: 25, developmentPrerequisites: []},
    {shardId: "shard-02", batchId: "batch-002", ordinal: 2, parallelGroup: "g04-l03-page-only", memberCount: 14, developmentPrerequisites: []},
  ]);
  assert.equal(release.members.length, 39);
  assert.deepEqual(release.members.map((member) => member.ordinal), Array.from({length: 39}, (_, index) => index + 1));
  assert.deepEqual(
    release.members.slice(0, 39).map((member) => member.xmlOccurrence),
    Array.from({length: 39}, (_, index) => index + 1),
  );
  assert.ok(release.members.every((member, index) =>
    member.releaseRole === "active-xml-referenced-page" &&
    member.placementId === `g04-l03-placement-${String(index + 1).padStart(3, "0")}`
  ));

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
    uniquePageAnimations: 54,
    courseShells: 0,
    members: 54,
    shards: 3,
  });
  assert.deepEqual(numberLinesRelease.shards, [
    {
      shardId: "g05-l04-host-language",
      batchId: "g05-l04-host-language",
      ordinal: 1,
      parallelGroup: "g05-l04-page-only",
      memberCount: 14,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l04-instruction",
      batchId: "g05-l04-instruction",
      ordinal: 2,
      parallelGroup: "g05-l04-page-only",
      memberCount: 21,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l04-practice-assessment",
      batchId: "g05-l04-practice-assessment",
      ordinal: 3,
      parallelGroup: "g05-l04-page-only",
      memberCount: 19,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    numberLinesRelease.members.slice(0, 54).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 54}, (_, index) => index + 1),
  );
  assert.ok(numberLinesRelease.members.every((member, index) =>
    member.releaseRole === "active-xml-referenced-page" &&
    member.placementId === `g05-l04-placement-${String(index + 1).padStart(3, "0")}`
  ));
  const numberLinesAnimations = numberLinesRelease.members.map((member) => canonicalByAssetId.get(member.assetId));
  assert.ok(numberLinesAnimations.every(Boolean));
  assert.equal(numberLinesAnimations.filter(({pairedFla}) => pairedFla).length, 44);
  assert.equal(numberLinesAnimations.filter(({pairedFla}) => !pairedFla).length, 10);
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
  assert.equal(allNumberLinesPlacements.filter(({animationId}) => !numberLinesMemberIds.has(animationId)).length, 11);

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
    uniquePageAnimations: 56,
    courseShells: 0,
    members: 56,
    shards: 3,
  });
  assert.deepEqual(addSubtractRelease.shards, [
    {
      shardId: "g05-l05-host-language",
      batchId: "g05-l05-host-language",
      ordinal: 1,
      parallelGroup: "g05-l05-page-only",
      memberCount: 17,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l05-instruction",
      batchId: "g05-l05-instruction",
      ordinal: 2,
      parallelGroup: "g05-l05-page-only",
      memberCount: 19,
      developmentPrerequisites: [],
    },
    {
      shardId: "g05-l05-practice-assessment",
      batchId: "g05-l05-practice-assessment",
      ordinal: 3,
      parallelGroup: "g05-l05-page-only",
      memberCount: 20,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    addSubtractRelease.members.slice(0, 56).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 56}, (_, index) => index + 1),
  );
  assert.ok(addSubtractRelease.members.every((member, index) =>
    member.releaseRole === "active-xml-referenced-page" &&
    member.placementId === `g05-l05-placement-${String(index + 1).padStart(3, "0")}`
  ));
  const addSubtractAnimations = addSubtractRelease.members.map((member) => canonicalByAssetId.get(member.assetId));
  assert.ok(addSubtractAnimations.every(Boolean));
  assert.equal(addSubtractAnimations.filter(({pairedFla}) => pairedFla).length, 49);
  assert.equal(addSubtractAnimations.filter(({pairedFla}) => !pairedFla).length, 7);
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
  assert.equal(allAddSubtractPlacements.filter(({animationId}) => !addSubtractMemberIds.has(animationId)).length, 12);

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
    uniquePageAnimations: 46,
    courseShells: 0,
    members: 46,
    shards: 3,
  });
  assert.deepEqual(perimeterAreaRelease.shards, [
    {
      shardId: "g04-l10-host-language",
      batchId: "g04-l10-host-language",
      ordinal: 1,
      parallelGroup: "g04-l10-page-only",
      memberCount: 15,
      developmentPrerequisites: [],
    },
    {
      shardId: "g04-l10-instruction",
      batchId: "g04-l10-instruction",
      ordinal: 2,
      parallelGroup: "g04-l10-page-only",
      memberCount: 15,
      developmentPrerequisites: [],
    },
    {
      shardId: "g04-l10-practice-assessment",
      batchId: "g04-l10-practice-assessment",
      ordinal: 3,
      parallelGroup: "g04-l10-page-only",
      memberCount: 16,
      developmentPrerequisites: [],
    },
  ]);
  assert.deepEqual(
    perimeterAreaRelease.members.slice(0, 46).map(({xmlOccurrence}) => xmlOccurrence),
    Array.from({length: 46}, (_, index) => index + 1),
  );
  assert.ok(perimeterAreaRelease.members.every((member, index) =>
    member.releaseRole === "active-xml-referenced-page" &&
    member.placementId === `g04-l10-placement-${String(index + 1).padStart(3, "0")}`
  ));
  const perimeterAreaAnimations = perimeterAreaRelease.members.map(
    (member) => canonicalByAssetId.get(member.assetId),
  );
  assert.ok(perimeterAreaAnimations.every(Boolean));
  assert.equal(perimeterAreaAnimations.filter(({pairedFla}) => pairedFla).length, 34);
  assert.equal(perimeterAreaAnimations.filter(({pairedFla}) => !pairedFla).length, 12);
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
    8,
  );

  const grade3AdditionRelease = lessonReleases.releases.find(
    ({releaseId}) => releaseId === "lesson-g03-l02-addition-subtraction-page-only-current-js",
  );
  assert.ok(grade3AdditionRelease);
  assert.deepEqual(grade3AdditionRelease.expectedCounts, {
    activeXmlReferencedPages: 70,
    uniquePageAnimations: 70,
    courseShells: 0,
    members: 70,
    shards: 3,
  });
  assert.equal(grade3AdditionRelease.members.length, 70);
  assert.ok(grade3AdditionRelease.members.every((member, index) =>
    member.xmlOccurrence === index + 1 &&
    member.releaseRole === "active-xml-referenced-page" &&
    member.placementId === `g03-l02-placement-${String(index + 1).padStart(3, "0")}`
  ));

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
    [],
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
  assert.equal(batches.canonicalAssetCount, 2_112);
  assert.equal(batches.batchCount, 87);
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
  assert.equal(legacyG4L3.length, 10);
  assert.equal(legacyG4L3.filter((animation) => animation.flags.shell).length, 1);
  assert.ok(legacyG4L3.filter((animation) => !animation.flags.shell).every((animation) =>
    animation.flags.unreferenced && animation.flags.variant
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
  assert.equal(currentRelativeOrder.length, 2_073);
  assert.deepEqual(currentRelativeOrder, previousRelativeOrder);

  const batchItems = batches.queues.flatMap((queue) => queue.batches.flatMap((batch) => {
    assert.ok(batch.canonicalAssetCount <= 25);
    return batch.items;
  }));
  assert.equal(batchItems.length, 2_112);
  assert.equal(new Set(batchItems.map((item) => item.assetId)).size, 2_112);
});
