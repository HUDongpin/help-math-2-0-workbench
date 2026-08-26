import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L5MissingKeytermRecoveryReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L5MissingKeytermRecoveryReadiness,
  writeOrCheck,
} from "./build-g5-l5-missing-keyterm-recovery-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L5MissingKeytermRecoveryReadiness();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-keyterm-recovery-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("binds the complete source, source-gap, historical, and privacy-safe SQL evidence", async () => {
  const report = validateG5L5MissingKeytermRecoveryReadiness(
    await buildOnce(),
  );
  assert.equal(report.sourceBindings.currentSourceCatalog.fileCount, 7919);
  assert.equal(
    report.sourceBindings.historicalTechnicalCrosswalk.fileCount,
    1455,
  );
  assert.equal(
    report.sourceBindings.historicalTechnicalCrosswalk.xmlFileCount,
    11,
  );
  assert.equal(
    report.sourceBindings.historicalTechnicalCrosswalk.completeCatalogBound,
    true,
  );
  assert.equal(
    report.sourceBindings.historicalAuthorityCatalog.fileCount,
    3713,
  );
  assert.match(
    report.sourceBindings.sqlPrivacySafeAggregate.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.ok(
    Object.values(report.sourceBindings).every(
      ({bytes, sha256}) =>
        Number.isInteger(bytes) &&
        bytes > 0 &&
        /^[a-f0-9]{64}$/.test(sha256),
    ),
  );
});

test("records zero exact candidates for both missing KeyTerm targets", async () => {
  const report = await buildOnce();
  assert.deepEqual(
    report.targets.map(
      ({
        language,
        basename,
        exactCandidateCount,
        currentPreservedPhysicalPresence,
        importAuthorized,
      }) => ({
        language,
        basename,
        exactCandidateCount,
        currentPreservedPhysicalPresence,
        importAuthorized,
      }),
    ),
    [
      {
        language: "english",
        basename: "L5KTE01.xml",
        exactCandidateCount: 0,
        currentPreservedPhysicalPresence: false,
        importAuthorized: false,
      },
      {
        language: "spanish",
        basename: "L5KTS01.xml",
        exactCandidateCount: 0,
        currentPreservedPhysicalPresence: false,
        importAuthorized: false,
      },
    ],
  );
  for (const target of report.targets) {
    assert.equal(target.currentSourceCatalogExactBasenameCount, 0);
    assert.equal(target.historicalTechnicalCrosswalkExactBasenameCount, 0);
    assert.equal(target.historicalTechnicalCrosswalkNormalizedAliasCount, 0);
    assert.equal(target.sqlPrivacySafeCatalogReferenceCount, 0);
    assert.equal(target.sqlPrivacySafeAggregateReferenceCount, 0);
    assert.deepEqual(target.exactCandidateSha256, []);
  }
});

test("keeps the different-basename master-glossary file as a non-substitutable lead only", async () => {
  const lead = (await buildOnce()).differentBasenameMasterGlossaryLead;
  assert.equal(lead.leadClass, "different-basename-master-glossary-lead");
  assert.equal(
    lead.sha256,
    "c7d92527369fe98f3cba813acc2ea421a1a5de955465a565c2081dcebcdd1adf",
  );
  assert.equal(lead.bytes, 342317);
  assert.equal(lead.physicalPresence, true);
  assert.equal(lead.authority, "technical-source-file");
  assert.equal(lead.authorityConfidence, "high");
  assert.equal(lead.keyTermRecordCount, 659);
  assert.equal(lead.exactTargetBasenameReferenceCount, 0);
  assert.equal(lead.sourceAssetsExactMatchCount, 0);
  assert.equal(lead.exactTargetCandidate, false);
  assert.equal(lead.substitutionAuthorized, false);
  assert.equal(lead.importAuthorized, false);
});

test("public report contains no historical raw path, external SQL path, or email-like identifier", async () => {
  const report = await buildOnce();
  const outputs = `${stableJson(report)}\n${renderMarkdown(report)}`;
  for (const forbidden of [
    "/Volumes/",
    "historicalPath",
    "physicalPath",
    "Extracted_NewHelpProgram",
    "Historical Office Documents",
  ]) {
    assert.doesNotMatch(outputs, new RegExp(forbidden));
  }
  assert.doesNotMatch(
    outputs,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
});

test("keeps import, acceptance, strict completion, and publication closed", async () => {
  const report = await buildOnce();
  assert.equal(report.recoveryGate.exactTargetCandidates, 0);
  assert.equal(report.recoveryGate.importAuthorized, false);
  assert.equal(report.recoveryGate.substitutionAuthorized, false);
  assert.equal(report.recoveryGate.implementationAuthorized, false);
  assert.deepEqual(report.strictCompletion, {
    completeMembers: 0,
    expectedMembers: 57,
    fraction: "0/57",
    complete: false,
  });
  assert.equal(report.publication.published, false);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false),
  );
});

test("validator rejects candidate, import, lead substitution, strict, and publication promotion", async () => {
  const report = await buildOnce();

  const candidate = structuredClone(report);
  candidate.targets[0].exactCandidateCount = 1;
  assert.throws(
    () => validateG5L5MissingKeytermRecoveryReadiness(candidate),
    /target was promoted/,
  );

  const imported = structuredClone(report);
  imported.recoveryGate.importAuthorized = true;
  assert.throws(
    () => validateG5L5MissingKeytermRecoveryReadiness(imported),
    /recovery gate was opened/,
  );

  const substituted = structuredClone(report);
  substituted.differentBasenameMasterGlossaryLead.substitutionAuthorized = true;
  assert.throws(
    () => validateG5L5MissingKeytermRecoveryReadiness(substituted),
    /lead was promoted/,
  );

  const strict = structuredClone(report);
  strict.strictCompletion.completeMembers = 1;
  assert.throws(
    () => validateG5L5MissingKeytermRecoveryReadiness(strict),
    /strict completion was promoted/,
  );

  const published = structuredClone(report);
  published.publication.published = true;
  assert.throws(
    () => validateG5L5MissingKeytermRecoveryReadiness(published),
    /publication was promoted/,
  );
});

test("writer creates and checks one deterministic public-safe report pair", async () => {
  const report = await buildOnce();
  await withTemporaryRoot(async (root) => {
    await mkdir(path.join(root, "reports"));
    const options = {
      report,
      projectRoot: root,
      outputPrefix: "reports/recovery",
    };
    const written = await writeOrCheck(options);
    assert.equal(written.action, "written");
    assert.equal(
      await readFile(path.join(root, "reports", "recovery.json"), "utf8"),
      stableJson(report),
    );
    assert.equal(
      await readFile(path.join(root, "reports", "recovery.md"), "utf8"),
      renderMarkdown(report),
    );
    const checked = await writeOrCheck({...options, check: true});
    assert.equal(checked.action, "verified");
  });
});

test("CLI allows report generation/check only and rejects import or substitution options", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    outputPrefix: "reports/g5-l5-missing-keyterm-recovery-readiness",
  });
  assert.throws(() => parseArguments(["--import"]), /Unknown option/);
  assert.throws(() => parseArguments(["--substitute"]), /Unknown option/);
  assert.throws(
    () => parseArguments(["--output-prefix", "../outside"]),
    /below reports/,
  );
  assert.throws(
    () => parseArguments(["--output-prefix", "reports/a.json"]),
    /extensionless/,
  );
});
