import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L4MissingKeytermRecoveryReadiness,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateG5L4MissingKeytermRecoveryReadiness,
  writeOrCheck,
} from "./build-g5-l4-missing-keyterm-recovery-readiness.mjs";

let reportPromise;
function buildOnce() {
  reportPromise ||= buildG5L4MissingKeytermRecoveryReadiness();
  return reportPromise;
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-keyterm-recovery-test-"),
  );
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("binds the complete source, source-gap, historical, and privacy-safe SQL evidence", async () => {
  const report = validateG5L4MissingKeytermRecoveryReadiness(
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

test("separates the course-XML declaration gap from shipped-shell static FFDec routing", async () => {
  const report = await buildOnce();
  const bindings = report.sourceBindings;
  assert.deepEqual(
    {
      courseXml: {
        path: bindings.courseXmlDeclarationSource.path,
        bytes: bindings.courseXmlDeclarationSource.bytes,
        sha256: bindings.courseXmlDeclarationSource.sha256,
      },
      shellSwf: {
        path: bindings.shippedShellSwf.path,
        bytes: bindings.shippedShellSwf.bytes,
        sha256: bindings.shippedShellSwf.sha256,
      },
      shellMachineAudit: {
        path: bindings.shippedShellMachineAudit.path,
        bytes: bindings.shippedShellMachineAudit.bytes,
        sha256: bindings.shippedShellMachineAudit.sha256,
      },
      shellFfdecScripts: {
        path: bindings.shippedShellFfdecScripts.path,
        bytes: bindings.shippedShellFfdecScripts.bytes,
        sha256: bindings.shippedShellFfdecScripts.sha256,
        expandedBytes: bindings.shippedShellFfdecScripts.expandedBytes,
        expandedSha256:
          bindings.shippedShellFfdecScripts.expandedSha256,
      },
      shellFfdecInventory: {
        path: bindings.shippedShellFfdecScriptInventory.path,
        bytes: bindings.shippedShellFfdecScriptInventory.bytes,
        sha256: bindings.shippedShellFfdecScriptInventory.sha256,
      },
    },
    {
      courseXml: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml",
        bytes: 11841,
        sha256:
          "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36",
      },
      shellSwf: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index_local.swf",
        bytes: 658851,
        sha256:
          "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
      },
      shellMachineAudit: {
        path: "migrations/shell-course-g05-l04-index-local/audit/machine/report.json",
        bytes: 97662,
        sha256:
          "d2e21b988381b3dae53204f808003aabe0fa118b4dfb4c3d8c4046f85a854b59",
      },
      shellFfdecScripts: {
        path: "migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz",
        bytes: 25143,
        sha256:
          "ebf3a470ac5e78ce1da9e3ac0bdfb9c5a33777f370361632fb3697bb4e523706",
        expandedBytes: 229313,
        expandedSha256:
          "dc415e19f79adbb64a4e9073c1342532082495f30b124a2cf90ec2325a4586b0",
      },
      shellFfdecInventory: {
        path: "migrations/shell-course-g05-l04-index-local/audit/machine/g5-l4-pre-runtime-ffdec-script-inventory-candidate.json",
        bytes: 216577,
        sha256:
          "b6509a0715ed4826b58bab45f6d0218990dd793270073a2d06a62f8ad3623b70",
      },
    },
  );

  const dependency = report.declaredVsShippedShellStaticDependency;
  assert.deepEqual(
    dependency.courseXmlDeclarations.declarations.map(
      ({language, basename, declarationCount}) => ({
        language,
        basename,
        declarationCount,
      }),
    ),
    [
      {language: "english", basename: "L4KTE01.xml", declarationCount: 1},
      {language: "spanish", basename: "L4KTS01.xml", declarationCount: 1},
    ],
  );
  assert.deepEqual(
    dependency.shippedShellStaticRouting.staticXmlTargetOccurrences,
    ["ELKTEG4.xml", "ELKTSG4.xml", "ELKTEG4.xml"],
  );
  assert.deepEqual(
    dependency.shippedShellStaticRouting.masterGlossaryReferenceCounts,
    {"ELKTEG4.xml": 2, "ELKTSG4.xml": 1},
  );
  assert.deepEqual(
    dependency.shippedShellStaticRouting
      .missingLessonLocalTargetReferenceCounts,
    {"L4KTE01.xml": 0, "L4KTS01.xml": 0},
  );
  assert.equal(
    dependency.shippedShellStaticRouting.xmlLoadViaKeyTermVarCallCount,
    2,
  );
  assert.equal(dependency.declaredSourceGapStillOpen, true);
  assert.equal(
    dependency.shippedShellStaticDirectTargetDependencyPresent,
    false,
  );
  assert.equal(
    dependency.shippedShellStaticRouting.runtimeReachabilityProven,
    false,
  );
  assert.equal(
    dependency.shippedShellStaticRouting.runtimeLoadSuccessProven,
    false,
  );
});

test("binds the Owner-relayed authorized combined reference without recovering or substituting lesson-local XML", async () => {
  const report = await buildOnce();
  const reference = report.authorizedCombinedElementaryKeytermsReference;
  assert.deepEqual(reference.direction, {
    evidenceClass: "owner-relayed-content-manager-email",
    contentManager: "Venky",
    relayedByOwner: "Dr. Peter Hu",
    recordedDate: "2026-07-30",
    scope: "combined-elementary-keyterms-product-reference-only",
    messageHeadersVerified: false,
    direction:
      "Use the combined elementary KeyTerm files as the G5 L4 product key-term reference.",
    referenceUseAuthorized: true,
  });
  assert.deepEqual(reference.intakeVariant.sources, {
    english: {
      basename: "ELKTEG4.xml",
      path:
        "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml",
      bytes: 398191,
      sha256:
        "d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c",
      parsedRecordCount: 814,
      knownUnrelatedMalformedRecordCount: 0,
      linkedG5L4TermExactMatchCount: 7,
      byteIdenticalToCurrentPreservedMaster: false,
      currentPreservedSourceCatalogMember: false,
    },
    spanish: {
      basename: "ELKTSG4.xml",
      path:
        "source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml",
      bytes: 396776,
      sha256:
        "a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d",
      parsedRecordCount: 812,
      knownUnrelatedMalformedRecordCount: 1,
      linkedG5L4TermExactMatchCount: 7,
      byteIdenticalToCurrentPreservedMaster: false,
      currentPreservedSourceCatalogMember: false,
    },
  });
  assert.match(reference.intakeVariant.sourceSetSha256, /^[a-f0-9]{64}$/);
  assert.equal(reference.intakeVariant.parsedRecordCount, 1626);
  assert.equal(reference.intakeVariant.knownUnrelatedMalformedRecordCount, 1);
  assert.deepEqual(reference.clientSelection, {
    canonical2008MasterSelected: true,
    ownerIntake2015Selected: false,
    ownerIntake2015FullImportBlocked: true,
    ownerIntake2015FullImportBlocker: "malformed-source-record",
  });
  assert.deepEqual(reference.linkedG5L4TermCoverage, {
    uniqueLinkedTermCount: 7,
    englishExactMatchCount: 7,
    spanishExactMatchCount: 7,
    allLinkedTermsResolveExactlyOnce: true,
    knownMalformedRecordAffectsLinkedG5L4Terms: false,
  });
  assert.deepEqual(reference.disposition, {
    referenceUseAuthorized: true,
    exactTargetCandidates: 0,
    recoveredTargets: 0,
    missingLessonSourcesRecovered: false,
    sourceGapClosed: false,
    substitutionAuthorized: false,
    runtimeByteVariantVerified: false,
    runtimeLoadSuccessProven: false,
    authoritativeOriginalRuntime: false,
    fidelityAccepted: false,
    strictComplete: false,
    published: false,
  });
  const markdown = renderMarkdown(report);
  assert.match(markdown, /Authorized combined elementary KeyTerm reference/);
  assert.match(markdown, /reference use authorized: true/);
  assert.match(markdown, /not.*verified runtime byte\s+variants/s);
  assert.match(markdown, /exact lesson-local recovery remains\s+\*\*0\/2\*\*/);
});

test("hash-binds all lesson FFDec link sources and reports master-glossary illustration availability", async () => {
  const audit = (await buildOnce()).lessonTermLinkAudit;
  assert.deepEqual(audit.scope, {
    releaseActivityMembers: 54,
    ffdecScriptBundlesScanned: 54,
    scannedMemberBindingSetSha256:
      "9380d872e378f2f427f398322e069ad5c1b1019a3020b4ee79e091a5e78a169c",
    linkedMemberCount: 3,
    linkOccurrenceCount: 16,
    uniqueLinkedTermCount: 7,
  });
  assert.equal(audit.scannedMemberBindings.length, 54);
  assert.deepEqual(
    audit.linkedMemberSources.map(
      ({animationId, linkOccurrences, ffdecScripts}) => ({
        animationId,
        linkOccurrences,
        path: ffdecScripts.path,
        sha256: ffdecScripts.sha256,
      }),
    ),
    [
      {
        animationId: "course-g05-l04-vb-010",
        linkOccurrences: 4,
        path: "migrations/course-g05-l04-vb-010/audit/machine/ffdec-scripts.txt.gz",
        sha256:
          "32971c64df35ce9a98d503a7aa1de8d252ebacd0e85339353f6638a8d2d40e64",
      },
      {
        animationId: "course-g05-l04-vb-011",
        linkOccurrences: 8,
        path: "migrations/course-g05-l04-vb-011/audit/machine/ffdec-scripts.txt.gz",
        sha256:
          "ea97e30fbd2e31c2f23adadbff70eb4425ad86b25849d0dc8774ceb7ff19d4d8",
      },
      {
        animationId: "course-g05-l04-in-005",
        linkOccurrences: 4,
        path: "migrations/course-g05-l04-in-005/audit/machine/ffdec-scripts.txt.gz",
        sha256:
          "490e0b2a1189aa8f48c73800a931be52cdd5668d4e1c5b302d9c9f21a42f372d",
      },
    ],
  );
  assert.deepEqual(
    audit.terms.map(({term, occurrenceCount, illustration}) => ({
      term,
      occurrenceCount,
      illustrationBasename: illustration.declaredBasename,
      physicalPresence: illustration.physicalPresence,
      sourcePath: illustration.source?.path || null,
      sourceSha256: illustration.source?.sha256 || null,
    })),
    [
      {
        term: "Positive Integers",
        occurrenceCount: 1,
        illustrationBasename: "Positive_integers.swf",
        physicalPresence: false,
        sourcePath: null,
        sourceSha256: null,
      },
      {
        term: "Integers",
        occurrenceCount: 3,
        illustrationBasename: "integers.swf",
        physicalPresence: false,
        sourcePath: null,
        sourceSha256: null,
      },
      {
        term: "Greater than",
        occurrenceCount: 1,
        illustrationBasename: "Greater_than.swf",
        physicalPresence: false,
        sourcePath: null,
        sourceSha256: null,
      },
      {
        term: "Zero",
        occurrenceCount: 3,
        illustrationBasename: "Zero.swf",
        physicalPresence: false,
        sourcePath: null,
        sourceSha256: null,
      },
      {
        term: "Negative Integers",
        occurrenceCount: 2,
        illustrationBasename: "Negative_integers.swf",
        physicalPresence: false,
        sourcePath: null,
        sourceSha256: null,
      },
      {
        term: "Less than",
        occurrenceCount: 2,
        illustrationBasename: "Less_than.swf",
        physicalPresence: true,
        sourcePath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/less_than.swf",
        sourceSha256:
          "74af679f4f90101266e18cdb7880a777571ea344ef7699ea06a499205f8cf374",
      },
      {
        term: "Decimal",
        occurrenceCount: 4,
        illustrationBasename: "Decimal.swf",
        physicalPresence: true,
        sourcePath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/decimal.swf",
        sourceSha256:
          "f8a391c6fb12f49893daec95957c85bcb1a58b35c6a55e2e4bf9df961c0ba4d7",
      },
    ],
  );
  assert.deepEqual(audit.summary, {
    allLinksResolveInEnglishMasterGlossary: true,
    allLinksResolveInSpanishMasterGlossary: true,
    uniqueIllustrationsDeclared: 7,
    uniqueIllustrationsPhysicallyPresent: 2,
    uniqueIllustrationsMissing: 5,
    linkOccurrencesWithIllustrationPresent: 6,
    linkOccurrencesWithIllustrationMissing: 10,
    allIllustrationsPhysicallyPresent: false,
    targetXmlRecovered: false,
    substitutionAuthorized: false,
    authoritativeOriginalRuntime: false,
    runtimeLoadSuccessProven: false,
    linkCausalityProven: false,
  });
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
        basename: "L4KTE01.xml",
        exactCandidateCount: 0,
        currentPreservedPhysicalPresence: false,
        importAuthorized: false,
      },
      {
        language: "spanish",
        basename: "L4KTS01.xml",
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
    expectedMembers: 55,
    fraction: "0/55",
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
    () => validateG5L4MissingKeytermRecoveryReadiness(candidate),
    /target was promoted/,
  );

  const imported = structuredClone(report);
  imported.recoveryGate.importAuthorized = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(imported),
    /recovery gate was opened/,
  );

  const substituted = structuredClone(report);
  substituted.differentBasenameMasterGlossaryLead.substitutionAuthorized = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(substituted),
    /lead was promoted/,
  );

  const strict = structuredClone(report);
  strict.strictCompletion.completeMembers = 1;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(strict),
    /strict completion was promoted/,
  );

  const published = structuredClone(report);
  published.publication.published = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(published),
    /publication was promoted/,
  );

  const runtimePromoted = structuredClone(report);
  runtimePromoted.declaredVsShippedShellStaticDependency
    .shippedShellStaticRouting.runtimeReachabilityProven = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(runtimePromoted),
    /declared-versus-shipped-shell static dependency boundary drifted/,
  );

  const combinedReferenceSubstituted = structuredClone(report);
  combinedReferenceSubstituted.authorizedCombinedElementaryKeytermsReference
    .disposition.substitutionAuthorized = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(
      combinedReferenceSubstituted,
    ),
    /authorized combined-reference boundary drifted/,
  );

  const runtimeVariantInvented = structuredClone(report);
  runtimeVariantInvented.authorizedCombinedElementaryKeytermsReference
    .disposition.runtimeByteVariantVerified = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(runtimeVariantInvented),
    /authorized combined-reference boundary drifted/,
  );

  const combinedReferenceClosedGap = structuredClone(report);
  combinedReferenceClosedGap.authorizedCombinedElementaryKeytermsReference
    .disposition.sourceGapClosed = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(
      combinedReferenceClosedGap,
    ),
    /authorized combined-reference boundary drifted/,
  );

  const inventedIllustration = structuredClone(report);
  const missing = inventedIllustration.lessonTermLinkAudit.terms.find(
    ({illustration}) => !illustration.physicalPresence,
  );
  missing.illustration.physicalPresence = true;
  assert.throws(
    () => validateG5L4MissingKeytermRecoveryReadiness(inventedIllustration),
    /lesson term-link or master-glossary static evidence drifted/,
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
    outputPrefix: "reports/g5-l4-missing-keyterm-recovery-readiness",
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
