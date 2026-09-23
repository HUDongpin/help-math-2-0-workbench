import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateSync } from "node:zlib";

import {
  buildExpectedPostManifest,
  deriveFqQuestionLabels,
  deriveOrdinarySpanishAudioPath,
  partitionAudioRequirements,
  reviewDecisionFor,
  selectGrade4ActiveMissingSwfs,
  writeFileAtomic,
} from "./build-g4-active-source-promotion-plan.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function syntheticSwf(strings, compressed = true) {
  const body = Buffer.from(`${strings.join("\0")}\0`, "latin1");
  const header = Buffer.alloc(8);
  header.write(compressed ? "CWS" : "FWS", 0, "ascii");
  header[3] = 7;
  header.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([header, compressed ? deflateSync(body) : body]);
}

function occurrenceTarget(sectionNumber, pageOrdinal, expectedPath) {
  return {
    expectedPath,
    occurrences: [
      {
        grade: 4,
        expectedPath,
        sourceXmlPath: "HELP_COURSES/ELMGR4/L2/index.xml",
        section: { number: sectionNumber },
        page: { ordinal: pageOrdinal },
      },
    ],
  };
}

function intakeRecord(canonicalPath, bytes, sha256, disposition = "candidate-new-source-in-quarantine") {
  return {
    canonicalPath,
    manifestRelativePath: canonicalPath.replace("HELP_COURSES/ELMGR4/", ""),
    bytes,
    sha256,
    conflictStatus: "none",
    intakeDecision: disposition.startsWith("hold-") ? "hold" : "candidate",
    disposition,
    historicalHashMatchRefs:
      disposition === "hold-historical-custody-review" ? ["historical-abcd"] : [],
    canonicalHashMatchPaths:
      disposition === "hold-placement-alias-review"
        ? ["HELP_COURSES/ELMGR4/L1/SA/alternate.mp3"]
        : [],
  };
}

test("derives a contiguous final-quiz label contract from compressed and uncompressed SWFs", () => {
  const strings = [
    "quizLabelArray",
    "doPlayFQQuestionAudio",
    "doPlayFQAnswerAudio",
    "EN",
    "SP",
    "A1Opt2",
    "A2Opt4",
    "Q1",
    "Q2",
  ];
  for (const compressed of [true, false]) {
    const result = deriveFqQuestionLabels(syntheticSwf(strings, compressed));
    assert.equal(result.audioBound, true);
    assert.deepEqual(result.questionLabels, ["Q1", "Q2"]);
    assert.equal(result.signature, compressed ? "CWS" : "FWS");
  }
  const intro = deriveFqQuestionLabels(syntheticSwf(["intro-only"]));
  assert.equal(intro.audioBound, false);
  assert.deepEqual(intro.questionLabels, []);
  assert.throws(
    () => deriveFqQuestionLabels(syntheticSwf(["quizLabelArray", "A1Opt1", "Q1"])),
    /Partial FQ audio contract markers/,
  );
});

test("applies the host Spanish-audio section and first-TS-page boundary", () => {
  const page = "HELP_COURSES/ELMGR4/L2/IN/L2IN21.swf";
  assert.equal(
    deriveOrdinarySpanishAudioPath(occurrenceTarget(4, 1, page)),
    "HELP_COURSES/ELMGR4/L2/SA/L2IN21.mp3",
  );
  assert.equal(deriveOrdinarySpanishAudioPath(occurrenceTarget(1, 1, page)), null);
  assert.equal(deriveOrdinarySpanishAudioPath(occurrenceTarget(7, 1, page)), null);
  assert.equal(
    deriveOrdinarySpanishAudioPath(occurrenceTarget(7, 2, page)),
    "HELP_COURSES/ELMGR4/L2/SA/L2IN21.mp3",
  );
  assert.equal(deriveOrdinarySpanishAudioPath(occurrenceTarget(8, 1, page)), null);
});

test("selects only Grade 4 active missing SWFs from the canonical discrepancy artifact", () => {
  const selected = selectGrade4ActiveMissingSwfs({
    course: [
      occurrenceTarget(4, 1, "HELP_COURSES/ELMGR4/L2/IN/L2IN21.swf"),
      {
        ...occurrenceTarget(4, 1, "HELP_COURSES/ELMGR3/L2/IN/L2IN21.swf"),
        occurrences: [
          {
            ...occurrenceTarget(4, 1, "HELP_COURSES/ELMGR3/L2/IN/L2IN21.swf").occurrences[0],
            grade: 3,
            sourceXmlPath: "HELP_COURSES/ELMGR3/L2/index.xml",
          },
        ],
      },
    ],
  });
  assert.deepEqual(selected.map(({ expectedPath }) => expectedPath), [
    "HELP_COURSES/ELMGR4/L2/IN/L2IN21.swf",
  ]);
});

test("partitions exact audio paths into copy, double-bound existing, and unresolved records", () => {
  const existingPath = "HELP_COURSES/ELMGR4/L1/SA/L1IN01.mp3";
  const copyPath = "HELP_COURSES/ELMGR4/L1/SA/L1IN02.mp3";
  const missingPath = "HELP_COURSES/ELMGR4/L1/SA/L1IN03.mp3";
  const existingSha = "a".repeat(64);
  const copySha = "b".repeat(64);
  const existingIntake = intakeRecord(existingPath, 10, existingSha);
  const copyIntake = intakeRecord(copyPath, 20, copySha);
  const requirement = (canonicalPath) => ({
    canonicalPath,
    sourceType: "runtime-bound-audio",
    bindingReason: "host-spanish-page-audio-same-basename-SA",
    audioBindingKind: "ordinary-spanish-page",
    requiredBy: ["HELP_COURSES/ELMGR4/L1/IN/source.swf"],
  });
  const result = partitionAudioRequirements({
    requirements: [requirement(existingPath), requirement(copyPath), requirement(missingPath)],
    canonicalByPath: new Map([
      [existingPath, { path: existingPath, bytes: 10, sha256: existingSha }],
    ]),
    intakeByPath: new Map([
      [existingPath, existingIntake],
      [copyPath, copyIntake],
    ]),
    manifestByPath: new Map([
      [existingIntake.manifestRelativePath, { path: existingIntake.manifestRelativePath, bytes: 10, sha256: existingSha }],
      [copyIntake.manifestRelativePath, { path: copyIntake.manifestRelativePath, bytes: 20, sha256: copySha }],
    ]),
  });
  assert.equal(result.copyRecords.length, 1);
  assert.equal(result.copyRecords[0].reviewDecision, "promote-in-this-transaction");
  assert.equal(result.existingBindings.length, 1);
  assert.equal(result.existingBindings[0].quarantineRelativePath, "verified/ELMGR4/L1/SA/L1IN01.mp3");
  assert.equal(result.missingDependencies.length, 1);
  assert.equal(result.missingDependencies[0].canonicalPath, missingPath);
});

test("resolves historical and alias pre-review holds without erasing prior evidence", () => {
  const historical = intakeRecord(
    "HELP_COURSES/ELMGR4/L1/IN/L1IN01.swf",
    10,
    "a".repeat(64),
    "hold-historical-custody-review",
  );
  assert.equal(
    reviewDecisionFor(historical, new Map()).reviewDecision,
    "promote-in-this-transaction",
  );
  const alias = intakeRecord(
    "HELP_COURSES/ELMGR4/L1/SA/L1IN02.mp3",
    20,
    "b".repeat(64),
    "hold-placement-alias-review",
  );
  const canonical = new Map([
    [alias.canonicalHashMatchPaths[0], { path: alias.canonicalHashMatchPaths[0], bytes: 20, sha256: "b".repeat(64) }],
  ]);
  assert.equal(reviewDecisionFor(alias, canonical).reviewDecision, "promote-in-this-transaction");
  canonical.get(alias.canonicalHashMatchPaths[0]).sha256 = "c".repeat(64);
  assert.throws(() => reviewDecisionFor(alias, canonical), /alias bytes disagree/);
});

test("projects both freeze-manifest and catalog checksum-set identities", () => {
  const sourceFiles = [
    { path: "b/index.xml", bytes: 2, sha256: "b".repeat(64) },
    { path: "a/file.swf", bytes: 1, sha256: "a".repeat(64) },
  ];
  const baseManifestText = `${"a".repeat(64)}  a/file.swf\n${"b".repeat(64)}  b/index.xml\n`;
  const copyRecords = [
    { canonicalPath: "a/new.fla", bytes: 3, sha256: "c".repeat(64) },
  ];
  const projected = buildExpectedPostManifest({ baseManifestText, sourceFiles, copyRecords });
  assert.equal(projected.postFileCount, 3);
  assert.equal(projected.postTotalBytes, 6);
  assert.equal(projected.baseManifestSha256, digest(baseManifestText));
  assert.match(projected.manifestSha256, /^[a-f0-9]{64}$/);
  assert.match(projected.checksumSetSha256, /^[a-f0-9]{64}$/);
  assert.match(projected.recordsSha256, /^[a-f0-9]{64}$/);
});

test("writes the plan atomically and creates its parent directory", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-active-promotion-plan-"));
  try {
    const output = path.join(root, "nested", "plan.json");
    await writeFileAtomic(output, "first\n");
    assert.equal(await readFile(output, "utf8"), "first\n");
    await writeFileAtomic(output, "second\n");
    assert.equal(await readFile(output, "utf8"), "second\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
