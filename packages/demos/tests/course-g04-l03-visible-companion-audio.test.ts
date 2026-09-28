import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

import courseIn012, {
  COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
} from "../src/modules/course-g04-l03-in-012";
import courseTs007, {
  COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
} from "../src/modules/course-g04-l03-ts-007";
import courseVb007, {
  COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
} from "../src/modules/course-g04-l03-vb-007";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const pages = [
  {
    animationId: "course-g04-l03-vb-007",
    module: courseVb007,
    sourceContract: COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
    mainDomain: "sprite-271",
    companionDomains: [
      "sprite-45", "sprite-63", "sprite-77", "sprite-105", "sprite-136",
      "sprite-176", "sprite-202", "sprite-234", "sprite-267",
    ],
    unresolvedDomains: ["sprite-40"],
  },
  {
    animationId: "course-g04-l03-in-012",
    module: courseIn012,
    sourceContract: COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
    mainDomain: "sprite-228",
    companionDomains: [
      "sprite-68", "sprite-108", "sprite-134", "sprite-166", "sprite-199",
      "sprite-223",
    ],
    unresolvedDomains: ["sprite-37", "sprite-219"],
  },
  {
    animationId: "course-g04-l03-ts-007",
    module: courseTs007,
    sourceContract: COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
    mainDomain: "sprite-441",
    companionDomains: [
      "sprite-90", "sprite-193", "sprite-211", "sprite-225", "sprite-253",
      "sprite-284", "sprite-324", "sprite-350", "sprite-382", "sprite-415",
    ],
    unresolvedDomains: ["sprite-106"],
  },
] as const;

test("25 visible companion audio cues retain exact bytes and local-domain timing only", async () => {
  let companionCueCount = 0;
  for (const page of pages) {
    const mainCues = page.module.audioCues.filter(
      ({frameDomain}) => frameDomain === page.mainDomain,
    );
    const companionCues = page.module.audioCues.filter(
      ({scenario}) => scenario === "source-static-reachable-domain",
    );
    assert.equal(mainCues.length, 1, `${page.animationId} main cue`);
    assert.deepEqual(
      companionCues.map(({frameDomain}) => frameDomain),
      page.companionDomains,
    );
    assert.equal(
      page.sourceContract.visibleCompanionAudioReport,
      "reports/g4-l3-visible-companion-audio-candidates.json",
    );
    assert.equal(
      page.sourceContract.unresolvedCompanionAudioCueCount,
      page.unresolvedDomains.length,
    );
    for (const unresolved of page.unresolvedDomains) {
      assert.equal(
        page.module.audioCues.some(({frameDomain}) => frameDomain === unresolved),
        false,
        `${page.animationId}/${unresolved} must stay disabled`,
      );
    }
    for (const cue of companionCues) {
      assert.equal(cue.language, "en");
      assert.equal(cue.spokenLanguage, "undetermined");
      assert.match(cue.source, /^\/flash-assets\/courses\//u);
      assert.equal(
        sha256(await readFile(`${repositoryRoot}public${cue.source}`)),
        cue.sha256,
      );
      assert.ok(cue.frame >= 1);
      assert.ok((cue.endFrame ?? cue.frame) > cue.frame);
      assert.ok(
        (page.module.playbackEndFrameByDomain?.[cue.frameDomain ?? ""] ?? 0)
          >= cue.frame,
        `${page.animationId}/${cue.frameDomain} cue must be live-reachable`,
      );
    }
    assert.equal(
      page.sourceContract.visibleCompanionPlaybackStatus,
      "deterministic-local-domain-only-parent-and-root-synchronization-pending",
    );
    assert.equal(page.sourceContract.originalRuntimeAuthorityEstablished, false);
    assert.equal(page.sourceContract.humanVisualReviewAccepted, false);
    assert.equal(page.sourceContract.ownerAccepted, false);
    assert.equal(page.sourceContract.strictMigrationComplete, false);
    assert.equal(page.sourceContract.strictAcceptanceEffect, "none");
    companionCueCount += companionCues.length;
  }
  assert.equal(companionCueCount, 25);
});
