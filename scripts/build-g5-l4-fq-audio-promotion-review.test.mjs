import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {access, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildPromotionReview,
  parseArguments,
  stableJson,
  validatePromotionReview,
} from "./build-g5-l4-fq-audio-promotion-review.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015";
const REPORT_PATH =
  "catalog/source-promotions/g5-l4-fq-audio-promotion-review-v1.json";
const GENERATOR_PATH = "scripts/build-g5-l4-fq-audio-promotion-review.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("checked-in G5 L4 FQ promotion review is unsigned, exact, and non-executable", async () => {
  const [reportBytes, generatorBytes] = await Promise.all([
    readFile(path.join(ROOT, REPORT_PATH)),
    readFile(path.join(ROOT, GENERATOR_PATH)),
  ]);
  const report = JSON.parse(reportBytes.toString("utf8"));
  assert.equal(stableJson(report), reportBytes.toString("utf8"));
  assert.equal(validatePromotionReview(report), true);
  assert.deepEqual(report.generator, {
    path: GENERATOR_PATH,
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  });
  assert.equal(report.records.length, 97);
  assert.equal(report.records.filter((record) => record.language === "en").length, 49);
  assert.equal(report.records.filter((record) => record.language === "es").length, 48);
  assert.equal(report.records.filter((record) => record.kind === "question").length, 21);
  assert.equal(report.records.filter((record) => record.kind === "answer").length, 76);
  assert.equal(report.execution.copyAuthorized, false);
  assert.equal(report.execution.sourceFilesCopied, 0);
  assert.equal(report.reviewGate.reviewerIdentity, null);
  assert.equal(report.acceptanceEffect.published, false);

  const serialized = JSON.stringify(report);
  assert.doesNotMatch(serialized, /\/Volumes\/WestWorld\/HELP MATH Related Files/);
  assert.doesNotMatch(serialized, /drive\.google\.com/);
});

test("sourceful review deterministically rehashes all 97 quarantine files when custody is mounted", async (t) => {
  const available = await access(QUARANTINE_ROOT).then(() => true, () => false);
  if (!available) {
    t.skip("private quarantine is not mounted; committed descriptor test remains active");
    return;
  }
  const [actualBytes, rebuilt] = await Promise.all([
    readFile(path.join(ROOT, REPORT_PATH)),
    buildPromotionReview({projectRoot: ROOT, quarantineRoot: QUARANTINE_ROOT}),
  ]);
  assert.equal(stableJson(rebuilt), actualBytes.toString("utf8"));
  assert.equal(rebuilt.summary.reviewBytes, 5_168_346);
  assert.equal(rebuilt.summary.destinationPresentCount, 0);
});

test("promotion-review validator and CLI fail closed on authority expansion", async () => {
  assert.deepEqual(parseArguments([]), {
    help: false,
    check: true,
    quarantineRoot: QUARANTINE_ROOT,
  });
  assert.equal(parseArguments(["--write"]).check, false);
  assert.throws(() => parseArguments(["--check", "--write"]), /exactly one mode/);
  assert.throws(() => parseArguments(["--quarantine-root", "relative"]), /absolute path/);
  assert.throws(() => parseArguments(["--apply"]), /unknown argument/);

  const report = JSON.parse(
    await readFile(path.join(ROOT, REPORT_PATH), "utf8"),
  );
  const promoted = structuredClone(report);
  promoted.execution.copyAuthorized = true;
  assert.throws(() => validatePromotionReview(promoted), /gate changed/);

  const signed = structuredClone(report);
  signed.reviewGate.reviewerIdentity = "automation";
  assert.throws(() => validatePromotionReview(signed), /gate changed/);

  const accepted = structuredClone(report);
  accepted.acceptanceEffect.ownerAccepted = true;
  assert.throws(() => validatePromotionReview(accepted), /must remain false/);
});
