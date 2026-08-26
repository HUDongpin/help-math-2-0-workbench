import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkLessonReleaseLedger,
  generateLessonReleaseLedger,
  parseArguments,
  validateLessonReleases,
  writeLessonReleaseLedger,
} from "./build-lesson-release-ledger.mjs";

const MARKER = `sha256:${"a".repeat(64)}`;

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function releaseManifest() {
  const members = Array.from({length: 39}, (_, index) => {
    const ordinal = index + 1;
    const hash = digest(`release-member-${ordinal}`);
    return {
      ordinal,
      animationId: `course-g04-l03-page-${String(ordinal).padStart(3, "0")}`,
      assetId: `swf-${hash}`,
      releaseRole: "active-xml-referenced-page",
      batchId: ordinal <= 25 ? "batch-001" : "batch-002",
      shardId: ordinal <= 25 ? "g04-l03-shard-01" : "g04-l03-shard-02",
      source: {
        path: `source-assets/flash/g04/l03/page-${ordinal}.swf`,
        sha256: hash,
      },
      xmlOccurrence: ordinal,
      placementId: `g04-l03-placement-${String(ordinal).padStart(3, "0")}`,
    };
  });
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g04-l03-negative-numbers",
      releaseOrder: 1,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      developmentMode: "parallel-shards",
      queueId: "release-g04-l03-negative-numbers",
      grade: 4,
      lesson: 3,
      titleDisplay: "Negative Numbers",
      domain: "negative-numbers-number-line",
      sourceLesson: {
        path: "source-assets/flash/g04/l03/index.xml",
        bytes: 1234,
        sha256: digest("lesson-index"),
        sequenceAuthority: "active-course-xml-global-page-order",
      },
      expectedCounts: {
        activeXmlReferencedPages: 39,
        uniquePageAnimations: 39,
        courseShells: 0,
        members: 39,
        shards: 2,
      },
      scope: {
        collection: "course",
        grade: 4,
        lesson: 3,
        excludeNonMembers: true,
        pageOnly: true,
        legacyFlashCourseShellExcluded: true,
        modernMyLessonHostRetained: true,
      },
      shards: [
        {
          shardId: "g04-l03-shard-01",
          batchId: "batch-001",
          ordinal: 1,
          parallelGroup: "g04-l03-page-only",
          memberCount: 25,
          developmentPrerequisites: [],
        },
        {
          shardId: "g04-l03-shard-02",
          batchId: "batch-002",
          ordinal: 2,
          parallelGroup: "g04-l03-page-only",
          memberCount: 14,
          developmentPrerequisites: [],
        },
      ],
      members,
    }],
  };
}

function numberLinesReleaseManifest() {
  const pageCount = 54;
  const memberCount = 54;
  const members = Array.from({length: memberCount}, (_, index) => {
    const ordinal = index + 1;
    const hash = digest(`g5-l4-release-member-${ordinal}`);
    const shard = ordinal <= 14
      ? {batchId: "g05-l04-host-language", shardId: "g05-l04-host-language"}
      : ordinal <= 35
        ? {batchId: "g05-l04-instruction", shardId: "g05-l04-instruction"}
        : {batchId: "g05-l04-practice-assessment", shardId: "g05-l04-practice-assessment"};
    return {
      ordinal,
      animationId: `course-g05-l04-page-${String(ordinal).padStart(3, "0")}`,
      assetId: `swf-${hash}`,
      releaseRole: "active-xml-referenced-page",
      batchId: shard.batchId,
      shardId: shard.shardId,
      source: {
        path: `source-assets/flash/g05/l04/page-${ordinal}.swf`,
        sha256: hash,
      },
      xmlOccurrence: ordinal,
      placementId: `g05-l04-placement-${String(ordinal).padStart(3, "0")}`,
    };
  });
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g05-l04-number-lines",
      releaseOrder: 2,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      developmentMode: "parallel-shards",
      queueId: "release-g05-l04-number-lines",
      grade: 5,
      lesson: 4,
      titleDisplay: "Number Lines",
      domain: "negative-numbers-number-line",
      sourceLesson: {
        path: "source-assets/flash/g05/l04/index.xml",
        bytes: 11_841,
        sha256: digest("g5-l4-lesson-index"),
        sequenceAuthority: "active-course-xml-global-page-order",
      },
      expectedCounts: {
        activeXmlReferencedPages: pageCount,
        uniquePageAnimations: pageCount,
        courseShells: 0,
        members: memberCount,
        shards: 3,
      },
      scope: {
        collection: "course",
        grade: 5,
        lesson: 4,
        excludeNonMembers: true,
        pageOnly: true,
        legacyFlashCourseShellExcluded: true,
        modernMyLessonHostRetained: true,
      },
      shards: [
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
      ],
      members,
    }],
  };
}

function addSubtractNegativeNumbersReleaseManifest() {
  const pageCount = 56;
  const memberCount = 56;
  const members = Array.from({length: memberCount}, (_, index) => {
    const ordinal = index + 1;
    const hash = digest(`g5-l5-release-member-${ordinal}`);
    const shard = ordinal <= 17
      ? {batchId: "g05-l05-host-language", shardId: "g05-l05-host-language"}
      : ordinal <= 36
        ? {batchId: "g05-l05-instruction", shardId: "g05-l05-instruction"}
        : {batchId: "g05-l05-practice-assessment", shardId: "g05-l05-practice-assessment"};
    return {
      ordinal,
      animationId: `course-g05-l05-page-${String(ordinal).padStart(3, "0")}`,
      assetId: `swf-${hash}`,
      releaseRole: "active-xml-referenced-page",
      batchId: shard.batchId,
      shardId: shard.shardId,
      source: {
        path: `source-assets/flash/g05/l05/page-${ordinal}.swf`,
        sha256: hash,
      },
      xmlOccurrence: ordinal,
      placementId: `g05-l05-placement-${String(ordinal).padStart(3, "0")}`,
    };
  });
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
      releaseOrder: 3,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      developmentMode: "parallel-shards",
      queueId: "release-g05-l05-add-subtract-negative-numbers",
      grade: 5,
      lesson: 5,
      titleDisplay: "Add & Subtract Negative Numbers",
      domain: "negative-numbers-number-line",
      sourceLesson: {
        path: "source-assets/flash/g05/l05/index.xml",
        bytes: 11_084,
        sha256: digest("g5-l5-lesson-index"),
        sequenceAuthority: "active-course-xml-global-page-order",
      },
      expectedCounts: {
        activeXmlReferencedPages: pageCount,
        uniquePageAnimations: pageCount,
        courseShells: 0,
        members: memberCount,
        shards: 3,
      },
      scope: {
        collection: "course",
        grade: 5,
        lesson: 5,
        excludeNonMembers: true,
        pageOnly: true,
        legacyFlashCourseShellExcluded: true,
        modernMyLessonHostRetained: true,
      },
      shards: [
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
      ],
      members,
    }],
  };
}

function completionLedger(members, count = members.length) {
  const selected = members.slice(0, count);
  return {
    schemaVersion: 1,
    generatedMarker: MARKER,
    summary: {strictComplete: selected.length},
    diagnostics: [],
    entries: selected.map((member) => ({
      animationId: member.animationId,
      assetId: member.assetId,
      workspace: `migrations/${member.animationId}`,
      manifestSha256: digest(`manifest-${member.animationId}`),
      validation: {
        mode: "strict",
        generatedMarker: MARKER,
      },
    })),
  };
}

async function fixture(strictCount = 0, releases = releaseManifest()) {
  const root = await mkdtemp(path.join(os.tmpdir(), "lesson-release-ledger-"));
  const releasesPath = path.join(root, "lesson-releases.json");
  const completionLedgerPath = path.join(root, "completion-ledger.json");
  const migrationsRoot = path.join(root, "migrations");
  const output = path.join(root, "lesson-release-ledger.json");
  const ledger = completionLedger(releases.releases[0].members, strictCount);
  const releaseBytes = `${JSON.stringify(releases, null, 2)}\n`;
  const completionBytes = `${JSON.stringify(ledger, null, 2)}\n`;
  await Promise.all([
    writeFile(releasesPath, releaseBytes),
    writeFile(completionLedgerPath, completionBytes),
  ]);
  const calls = [];
  const completionLedgerCheck = async (options) => {
    calls.push(options);
    return {
      ok: true,
      reason: "current",
      ledger,
      actual: completionBytes,
    };
  };
  return {
    root,
    releasesPath,
    completionLedgerPath,
    migrationsRoot,
    output,
    releases,
    ledger,
    calls,
    completionLedgerCheck,
  };
}

function generatorOptions(value) {
  return {
    releasesPath: value.releasesPath,
    completionLedgerPath: value.completionLedgerPath,
    migrationsRoot: value.migrationsRoot,
    completionLedgerCheck: value.completionLedgerCheck,
  };
}

test("validates the exact 39-page page-only release shape and source identities", () => {
  const manifest = releaseManifest();
  assert.equal(validateLessonReleases(manifest), manifest);

  const duplicate = structuredClone(manifest);
  duplicate.releases[0].members[1].animationId = duplicate.releases[0].members[0].animationId;
  assert.throws(() => validateLessonReleases(duplicate), /duplicate animationId/);

  const wrongSourceAsset = structuredClone(manifest);
  wrongSourceAsset.releases[0].members[0].assetId = `swf-${"f".repeat(64)}`;
  assert.throws(() => validateLessonReleases(wrongSourceAsset), /does not match source.sha256/);

  const wrongPlacement = structuredClone(manifest);
  wrongPlacement.releases[0].members[38].placementId = "g04-l03-placement-040";
  assert.throws(() => validateLessonReleases(wrongPlacement), /must bind the active XML occurrence/);
});

test("validates the data-driven 54-page page-only G5 L4 release and 14/21/19 shards", () => {
  const manifest = numberLinesReleaseManifest();
  assert.equal(validateLessonReleases(manifest), manifest);
  const release = manifest.releases[0];
  assert.equal(release.members.length, 54);
  assert.deepEqual(release.shards.map(({memberCount}) => memberCount), [14, 21, 19]);
  assert.equal(release.members.at(-1).releaseRole, "active-xml-referenced-page");
  assert.equal(release.members.at(-1).shardId, "g05-l04-practice-assessment");

  const inconsistentCounts = structuredClone(manifest);
  inconsistentCounts.releases[0].expectedCounts.members = 53;
  assert.throws(
    () => validateLessonReleases(inconsistentCounts),
    /members must equal active pages in page-only scope/,
  );

  const missingShardMember = structuredClone(manifest);
  missingShardMember.releases[0].members[35].shardId = "g05-l04-instruction";
  missingShardMember.releases[0].members[35].batchId = "g05-l04-instruction";
  assert.throws(() => validateLessonReleases(missingShardMember), /memberCount does not match members/);
});

test("validates the data-driven 56-page page-only G5 L5 release and 17/19/20 shards", () => {
  const manifest = addSubtractNegativeNumbersReleaseManifest();
  assert.equal(validateLessonReleases(manifest), manifest);
  const release = manifest.releases[0];
  assert.equal(release.members.length, 56);
  assert.deepEqual(release.shards.map(({memberCount}) => memberCount), [17, 19, 20]);
  assert.equal(release.members.at(-1).releaseRole, "active-xml-referenced-page");
  assert.equal(release.members.at(-1).shardId, "g05-l05-practice-assessment");
});

test("atomic release stays unpublished through 38/39 and publishes only at exact 39/39", async () => {
  for (const [strictCount, expectedPublished] of [[0, false], [38, false], [39, true]]) {
    const value = await fixture(strictCount);
    try {
      const ledger = await generateLessonReleaseLedger(generatorOptions(value));
      const release = ledger.releases[0];
      assert.equal(release.strictCompleteCount, strictCount);
      assert.equal(release.published, expectedPublished);
      assert.equal(release.gate.open, expectedPublished);
      assert.equal(ledger.summary.publishedReleaseCount, expectedPublished ? 1 : 0);
      assert.match(ledger.generatedMarker, /^sha256:[a-f0-9]{64}$/);
      assert.equal(ledger.sources.lessonReleases.sha256, digest(await readFile(value.releasesPath)));
      assert.equal(ledger.sources.completionLedger.sha256, digest(await readFile(value.completionLedgerPath)));
      assert.equal(ledger.sources.completionLedger.generatedMarker, MARKER);
      assert.equal(value.calls.length, 1);
      assert.equal(value.calls[0].output, value.completionLedgerPath);
      assert.equal(value.calls[0].migrationsRoot, value.migrationsRoot);
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  }
});

test("G5 L4 stays unpublished through 53/54 and publishes only at exact 54/54", async () => {
  for (const [strictCount, expectedPublished] of [[0, false], [53, false], [54, true]]) {
    const value = await fixture(strictCount, numberLinesReleaseManifest());
    try {
      const ledger = await generateLessonReleaseLedger(generatorOptions(value));
      const release = ledger.releases[0];
      assert.equal(release.expectedMemberCount, 54);
      assert.equal(release.strictCompleteCount, strictCount);
      assert.equal(release.published, expectedPublished);
      assert.equal(release.gate.open, expectedPublished);
      assert.match(release.gate.reason, /54 release members/);
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  }
});

test("G5 L5 stays unpublished through 55/56 and publishes only at exact 56/56", async () => {
  for (const [strictCount, expectedPublished] of [[0, false], [55, false], [56, true]]) {
    const value = await fixture(strictCount, addSubtractNegativeNumbersReleaseManifest());
    try {
      const ledger = await generateLessonReleaseLedger(generatorOptions(value));
      const release = ledger.releases[0];
      assert.equal(release.expectedMemberCount, 56);
      assert.equal(release.strictCompleteCount, strictCount);
      assert.equal(release.published, expectedPublished);
      assert.equal(release.gate.open, expectedPublished);
      assert.match(release.gate.reason, /56 release members/);
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  }
});

test("multiple lesson releases are evaluated independently without weakening either atomic gate", async () => {
  const g4 = releaseManifest();
  const g5 = numberLinesReleaseManifest();
  const g5l5 = addSubtractNegativeNumbersReleaseManifest();
  const combined = {schemaVersion: 1, releases: [...g4.releases, ...g5.releases, ...g5l5.releases]};
  const value = await fixture(39, combined);
  try {
    const ledger = await generateLessonReleaseLedger(generatorOptions(value));
    assert.equal(ledger.summary.releaseCount, 3);
    assert.equal(ledger.summary.memberCount, 149);
    assert.equal(ledger.summary.strictCompleteMemberCount, 39);
    assert.equal(ledger.summary.publishedReleaseCount, 1);
    assert.equal(ledger.releases[0].releaseId, "lesson-g04-l03-negative-numbers");
    assert.equal(ledger.releases[0].published, true);
    assert.equal(ledger.releases[1].releaseId, "lesson-g05-l04-number-lines");
    assert.equal(ledger.releases[1].strictCompleteCount, 0);
    assert.equal(ledger.releases[1].published, false);
    assert.equal(ledger.releases[2].releaseId, "lesson-g05-l05-add-subtract-negative-numbers");
    assert.equal(ledger.releases[2].strictCompleteCount, 0);
    assert.equal(ledger.releases[2].published, false);
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("a strict entry for the wrong asset fails closed instead of publishing", async () => {
  const value = await fixture(39);
  try {
    value.ledger.entries[17].assetId = `swf-${"f".repeat(64)}`;
    const completionBytes = `${JSON.stringify(value.ledger, null, 2)}\n`;
    await writeFile(value.completionLedgerPath, completionBytes);
    value.completionLedgerCheck = async () => ({
      ok: true,
      reason: "current",
      ledger: value.ledger,
      actual: completionBytes,
    });
    const ledger = await generateLessonReleaseLedger(generatorOptions(value));
    const release = ledger.releases[0];
    assert.equal(release.published, false);
    assert.equal(release.strictCompleteCount, 38);
    assert.equal(release.assetMismatchCount, 1);
    assert.equal(release.members[17].status, "asset-mismatch");
    assert.equal(release.members[17].strictComplete, false);
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("stale or non-strict completion evidence is rejected before aggregation", async () => {
  const value = await fixture(39);
  try {
    value.completionLedgerCheck = async () => ({ok: false, reason: "stale", ledger: value.ledger});
    await assert.rejects(
      generateLessonReleaseLedger(generatorOptions(value)),
      /completion ledger is stale/,
    );

    value.ledger.entries[0].validation.mode = "draft";
    const completionBytes = `${JSON.stringify(value.ledger, null, 2)}\n`;
    await writeFile(value.completionLedgerPath, completionBytes);
    value.completionLedgerCheck = async () => ({
      ok: true,
      reason: "current",
      ledger: value.ledger,
      actual: completionBytes,
    });
    await assert.rejects(
      generateLessonReleaseLedger(generatorOptions(value)),
      /not a strict validation result/,
    );

    value.ledger.entries[0].validation.mode = "strict";
    value.ledger.entries[0].validation.generatedMarker = `sha256:${"b".repeat(64)}`;
    await writeFile(value.completionLedgerPath, `${JSON.stringify(value.ledger, null, 2)}\n`);
    value.completionLedgerCheck = async () => ({
      ok: true,
      reason: "current",
      ledger: value.ledger,
    });
    await assert.rejects(
      generateLessonReleaseLedger(generatorOptions(value)),
      /not bound to the completion ledger generatedMarker/,
    );
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("atomically writes and byte-checks the generated ledger", async () => {
  const value = await fixture(0);
  try {
    const written = await writeLessonReleaseLedger({
      ...generatorOptions(value),
      output: value.output,
    });
    assert.equal(await readFile(value.output, "utf8"), written.serialized);
    assert.equal((await readdir(value.root)).filter((name) => name.endsWith(".tmp")).length, 0);

    const current = await checkLessonReleaseLedger({
      ...generatorOptions(value),
      output: value.output,
    });
    assert.equal(current.ok, true);
    assert.equal(current.reason, "current");

    await writeFile(value.output, `${current.actual} `);
    const stale = await checkLessonReleaseLedger({
      ...generatorOptions(value),
      output: value.output,
    });
    assert.equal(stale.ok, false);
    assert.equal(stale.reason, "stale");
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("parses every bounded CLI path and check/json flag", () => {
  const options = parseArguments([
    "--check",
    "--json",
    "--releases", "releases.json",
    "--completion-ledger", "completion.json",
    "--migrations", "migrations-test",
    "--output", "release-ledger.json",
  ]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.releasesPath, path.resolve("releases.json"));
  assert.equal(options.completionLedgerPath, path.resolve("completion.json"));
  assert.equal(options.migrationsRoot, path.resolve("migrations-test"));
  assert.equal(options.output, path.resolve("release-ledger.json"));
  assert.throws(() => parseArguments(["--releases"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
