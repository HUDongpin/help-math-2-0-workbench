#!/usr/bin/env node

import {createHash} from "node:crypto";
import {gunzipSync} from "node:zlib";
import {
  lstat,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildDispositionReport} from "./build-frame-domain-dispositions.mjs";
import {
  buildStaticCompositeEvidenceDocument,
  deriveMultiFrameScriptlessCandidateAudit,
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  commitAtomicEntries,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE =
  "scripts/materialize-g4-l10-post-declaration-static-composites.mjs";
const GENERIC_WRAPPER_RELATIVE =
  "scripts/materialize-lesson-release-source-proven-frame-domain-dispositions.mjs";
const PROOF_ENGINE_RELATIVE =
  "scripts/build-static-frame-domain-disposition-evidence.mjs";
const DISPOSITION_ENGINE_RELATIVE =
  "scripts/build-frame-domain-dispositions.mjs";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const RELEASE_CATALOG_RELATIVE = "catalog/lesson-releases.json";
const PACKAGE_RELATIVE = "package.json";
const DECLARATION_REPORT_RELATIVE =
  "reports/g4-l10-independent-frame-domain-declarations.json";
const WAVE2_REPORT_RELATIVE =
  "reports/lesson-release-source-proven-independent-frame-domains/lesson-g04-l10-perimeter-area.json";
const PRE_DECLARATION_STATIC_REPORT_RELATIVE =
  "reports/lesson-release-source-proven-frame-domain-dispositions/lesson-g04-l10-perimeter-area.json";
export const G4_L10_WAVE3_REPORT_RELATIVE =
  "reports/g4-l10-post-declaration-static-composites.json";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const DECLARATION_AUTHORITY_STATEMENT =
  "The declared nested domains are justified by the exact pre-transition source-proven independent-domain evidence named in generatedFrom.sourceProvenIndependentDeclarationBasis; declaration satisfies only the missing-domain planning obligation and does not establish runtime entry or acceptance.";
const WAVE3_AUTHORITY_STATEMENT =
  "The exact post-declaration multi-frame child claim is rebuilt from the preserved source and current declared-parent contract and is bound to the immutable declaration receipt plus the exact reviewed wave3 pair partition; it removes only a separate child-frame-domain obligation and establishes no runtime, behavior, visual, audio, review, release, or publication result.";
const STRICT_EFFECT =
  "none; three exact post-declaration parent-clock composite classifications only; runtime, behavior, visual, audio, full-frame/RMSE, human, owner, strict-completion, release, and publication acceptance remain pending";

const EXPECTED = Object.freeze({
  releaseMembers: 47,
  declarationReportSha256:
    "d961ff2401d01740a6dc04b6084d3849f2cac1f729b43b3fe40565a7a7a15e20",
  declarationReportBytes: 445375,
  declarationGeneratorSha256:
    "a952276a8fbd5787917d77f307a5b129ac3c8e83f310b41f7fd9156b4ec33b4f",
  wave2ReportSha256:
    "91625576767071511bc6c65f56ee1fd7bbe428304e0604ef58e77944fa034ce2",
  preDeclarationStaticReportSha256:
    "906691a657823c52c240e03569dcf607966aff1af2f29e0f604a1ffd6cd77531",
  preDeclarationStaticReportBytes: 309998,
  releaseCatalogSha256:
    "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf",
  releaseFingerprintSha256:
    "4b77aedf7dcb0aeb9e9a84b7eb97b89b7a0ff03200956a4a93d65f8f9de2b1fd",
  orderedMemberIdentitySha256:
    "b3950290c53c2d6f5f1bd40ce20deb1f1b954660b0868a3fa8dc3795ec5504fe",
  oldParentUndeclared: Object.freeze({
    count: 29,
    sha256:
      "29105a31f244ffbbe57f37d6d9d6aa1086e4b67435bbc9053ff46b309f2a5a85",
  }),
  accepted: Object.freeze({
    count: 3,
    sha256:
      "f65d4dabb98ad5f4a175bafd03c591edd86f1b11247c01b47375723fef1e22f7",
  }),
  rejected: Object.freeze({
    count: 26,
    sha256:
      "6e15d1aec32e81fc78227dfae44f6047d2099f8840ad81b9b14895ad94ff04c2",
  }),
  scriptedOneFrame: Object.freeze({
    count: 41,
    sha256:
      "0dc88548e9669900cbee9e07f79f701234d6fd3eb7d59154f0678046b3c29f68",
  }),
  directRootLong: Object.freeze({
    count: 7,
    sha256:
      "002a25d3c4a0ab370cec74656290747a23b17c42c923c94b7dfc36635061a70b",
  }),
  remaining: Object.freeze({
    count: 74,
    sha256:
      "3f2adcef24544cff58cf36fa940abae25e3441c8486062100ea368aa858e3962",
  }),
  rejectedReasonGroups: Object.freeze({
    "dynamic-movieclip-addressing-present + declared-parent-does-not-have-one-direct-root-placement": Object.freeze({
      count: 21,
      sha256:
        "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
    }),
    "declared-parent-does-not-have-one-direct-root-placement": Object.freeze({
      count: 4,
      sha256:
        "24e6fabe063f6b32bd14b1359961b09ae895d18369ecb48aaa70ad233523bfff",
    }),
    "named-incoming-instance-requires-target-control-proof + dynamic-movieclip-addressing-present + root-to-parent-depth-has-later-placement-update + root-to-parent-depth-has-removal": Object.freeze({
      count: 1,
      sha256:
        "e2034f931552c977aabeb8c3e8255c89be16910eaf98d1d24e251487d93b6854",
    }),
  }),
  scriptedReasonGroups: Object.freeze({
    "swfmill-do-action-present + ffdec-frame-script-present": Object.freeze({
      count: 40,
      sha256:
        "d50f410eee12f43823e4c4545c21e8f978132deeb46dba41aabf9545d5f3defc",
    }),
    "swfmill-do-action-present + swfmill-do-init-action-present + ffdec-frame-script-present": Object.freeze({
      count: 1,
      sha256:
        "624f26a627763f11e6031d8b7f7966734770f81399688252fe06c3ec23cd7e4d",
    }),
  }),
  before: Object.freeze({
    declared: 260,
    composite: 751,
    independentRequired: 0,
    unresolved: 77,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
  after: Object.freeze({
    declared: 260,
    composite: 754,
    independentRequired: 0,
    unresolved: 74,
    nonvisual: 0,
    excludedNotProven: 210,
  }),
});

export const G4_L10_WAVE3_CONTRACT = Object.freeze({
  releaseId: RELEASE_ID,
  reportPath: G4_L10_WAVE3_REPORT_RELATIVE,
  expected: EXPECTED,
});

const TARGETS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l10-rw-002",
    childTimelineId: "sprite-131",
    childFrameCount: 17,
    existingSingleFrameTimelineIds: Object.freeze(["sprite-360"]),
    existingSingleFramePairSetSha256:
      "00066f44fb0eda1a169477e2f6dcb92e8975cf4f4a8e4183ca8a47c14d54edf0",
    candidateSpecSha256:
      "992f335b397ad8e55e064b6bf6dbf058d5674e9db6b398ee6fb304ed7ad3ba91",
    sourcePath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf",
    sourceSha256:
      "45b14745c04d452c71c7c7f9c99c26300a293d8d14f66afcd29a9ff590a01059",
    technicalManifestSha256:
      "7bbaa4419b040c4098cc4237c5d21aed591b2ef4efb6f4030a28f80d0d1bfa27",
    parent: Object.freeze({
      timelineId: "sprite-356",
      sourceObjectId: "356",
      frameCount: 1132,
      sourceProofSha256:
        "53fc0f2c3b4ab771af0abc40f9324618a4935c98ad73cf5565d03101ab6f0d36",
      sourceProofClaimIndex: 0,
      actionFrameSequenceSha256:
        "6afdfc370c2120b3059d7150f8ea0f814dbd5fe9edb8aef7c7666af06c80b077",
    }),
  }),
  Object.freeze({
    animationId: "course-g04-l10-rw-003",
    childTimelineId: "sprite-17",
    childFrameCount: 17,
    existingSingleFrameTimelineIds: Object.freeze(["sprite-257"]),
    existingSingleFramePairSetSha256:
      "e0382939e93ee26f321585b255a349269b03ddaff32ae8466a820f6622ea35b9",
    candidateSpecSha256:
      "7162e529efcc3c2e42bb9c12e6bc3a6c770741e7c4d5ad7f415c0d66af8ce1d1",
    sourcePath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf",
    sourceSha256:
      "1e6a62a11fddd08c083d2a4556ff95f4fbb0e2447f442b7bdb264998dedba81e",
    technicalManifestSha256:
      "c230fb8dab0be516baaa002a68f0695ac67ca03df07491eb5f2bc42bb48f2222",
    parent: Object.freeze({
      timelineId: "sprite-253",
      sourceObjectId: "253",
      frameCount: 1046,
      sourceProofSha256:
        "c2c3b45fd50a9df8de4104f1bd539fbd93074b126f2f7041b4802746ad4cc520",
      sourceProofClaimIndex: 0,
      actionFrameSequenceSha256:
        "b7b9cb7c8de9651255d1a06d2536296b0991fb723093b6328b726e7237337330",
    }),
  }),
  Object.freeze({
    animationId: "course-g04-l10-rw-005",
    childTimelineId: "sprite-101",
    childFrameCount: 22,
    existingSingleFrameTimelineIds: Object.freeze(["sprite-282"]),
    existingSingleFramePairSetSha256:
      "5debed97722b5604e28c47ef777996d4bb04807bae6227c1cf019f51654dd3b5",
    candidateSpecSha256:
      "05dffda776c04131f8dfe940be83aad138001f2f56bfb0ebc1d6d6b4f0491126",
    sourcePath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf",
    sourceSha256:
      "d613b174aa73cb79e672079b658e17ff88b7b0da257e82eb644cfe8725834b40",
    technicalManifestSha256:
      "b829eca3e7e6098f776962fe75bdfae0414f2ba0a4a8e6dbc1729ca6b856da4b",
    parent: Object.freeze({
      timelineId: "sprite-278",
      sourceObjectId: "278",
      frameCount: 925,
      sourceProofSha256:
        "4c4b2dc0803472e22a294ae4b5bf13b0912e02cd78573f92e7ae55b153d3f42a",
      sourceProofClaimIndex: 0,
      actionFrameSequenceSha256:
        "4fc50863286fe7f295042379d99ff3f8747138035c8a9dd724bab03ffb58665e",
    }),
  }),
]);

const UNCHANGED_UNAFFECTED_DISPOSITIONS = Object.freeze({
  "course-g04-l10-in-002":
    "195a34d60075a401753909fc5302165f76672734218e76ced94fefd88d58ada4",
  "course-g04-l10-in-004":
    "bb01867b50351f0b824d2f8c47f88c2046c01572e3b071b0260300fc3690241c",
  "course-g04-l10-in-007":
    "5ae818d52f796ec2b3542cd60c3e51df13e186182c1d2815a34770f05f04ad94",
  "course-g04-l10-in-009":
    "d99cbf236ee2414a1bc4351148bff72faf8a586276c7f4c27187cfef40ed74ac",
  "course-g04-l10-in-012":
    "03fff1ffcab75f07eb85bdd0ba50e3feb462f2b5e9b1c3b44c80d33e97b0e474",
  "course-g04-l10-in-014":
    "0a0f71b83fb9e36dc1be4f3f8a5d9fea1c14a979e2843c8250a55c62a5088b3c",
  "course-g04-l10-in-015":
    "5110ac3fd99a262b3740eaebb81e53ea9df07001c2c45b39280ff9b74a29fdbb",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function stableCompact(value) {
  return JSON.stringify(stable(value));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    !path.isAbsolute(relative)
      && relative !== ".."
      && !relative.startsWith(`..${path.sep}`)
  );
}

function resolveProjectPath(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath)
      && portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

async function readOrdinary(projectRoot, relativePath, {allowMissing = false} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  let before;
  try {
    before = await lstat(absolutePath, {bigint: true});
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") {
      return {
        path: relativePath,
        absolutePath,
        exists: false,
        bytes: 0,
        sha256: null,
        contents: null,
      };
    }
    throw error;
  }
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath}: expected an ordinary single-link file`,
  );
  const [realRoot, realFile, bytes] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
    readFile(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${relativePath}: real path escapes project root`);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev
      && before.ino === after.ino
      && before.size === after.size
      && before.mtimeNs === after.mtimeNs
      && before.ctimeNs === after.ctimeNs
      && BigInt(bytes.length) === after.size,
    `${relativePath}: changed while it was read`,
  );
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  };
}

async function readJson(projectRoot, relativePath, options) {
  const record = await readOrdinary(projectRoot, relativePath, options);
  if (!record.exists) return {...record, document: null};
  try {
    return {...record, document: JSON.parse(record.contents.toString("utf8"))};
  } catch (error) {
    throw new Error(`${relativePath}: invalid JSON (${error.message})`);
  }
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function recordForRendered(relativePath, rendered, document) {
  const bytes = Buffer.from(rendered, "utf8");
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    rendered,
    document,
  };
}

function matchesDescriptor(record, expected) {
  return Boolean(record.exists)
    && record.path === expected.path
    && record.bytes === expected.bytes
    && record.sha256 === expected.sha256;
}

function assertDescriptor(record, expected, label) {
  invariant(matchesDescriptor(record, expected), `${label}: exact descriptor drifted`);
}

export function canonicalWave3PairSet(entries) {
  invariant(Array.isArray(entries), "pair set entries must be an array");
  const lines = entries.map(({animationId, timelineId}) => {
    invariant(
      typeof animationId === "string"
        && animationId.length > 0
        && !animationId.includes("\t")
        && !animationId.includes("\n"),
      "pair set animationId is invalid",
    );
    invariant(/^sprite-\d+$/.test(timelineId || ""), `${animationId}: pair timelineId is invalid`);
    return `${animationId}\t${timelineId}`;
  }).sort();
  invariant(new Set(lines).size === lines.length, "pair set contains duplicates");
  const bytes = Buffer.from(lines.length ? `${lines.join("\n")}\n` : "", "utf8");
  return {
    count: lines.length,
    sha256: sha256(bytes),
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  };
}

function assertPairSet(entries, expected, label) {
  const actual = canonicalWave3PairSet(entries);
  invariant(
    actual.count === expected.count && actual.sha256 === expected.sha256,
    `${label}: exact pair set drifted (${actual.count}/${actual.sha256})`,
  );
  return actual;
}

function releaseFingerprint(release) {
  return sha256(Buffer.from(stableJson(release), "utf8"));
}

function orderedMemberIdentityFingerprint(release) {
  return sha256(Buffer.from(stableJson(release.members.map(
    ({ordinal, animationId, assetId}) => ({ordinal, animationId, assetId}),
  )), "utf8"));
}

function requiredEvidence(inventory, artifactId) {
  const matches = (inventory.evidenceIndex || []).filter(
    (item) => item.artifactId === artifactId,
  );
  invariant(matches.length === 1, `${inventory.animationId}: ${artifactId} binding is not unique`);
  invariant(SHA256_PATTERN.test(matches[0].sha256 || ""), `${inventory.animationId}: ${artifactId} hash is invalid`);
  return matches[0];
}

function artifactRelativePath(animationId, artifactPath) {
  if (artifactPath.startsWith("source-assets/") || artifactPath.startsWith("migrations/")) {
    return artifactPath;
  }
  return `migrations/${animationId}/${artifactPath}`;
}

function dispositionTotals(reports) {
  const totals = {
    declared: 0,
    composite: 0,
    independentRequired: 0,
    unresolved: 0,
    nonvisual: 0,
    excludedNotProven: 0,
  };
  for (const report of reports) {
    totals.declared += report.summary.dispositionCounts["declared-frame-domain"];
    totals.composite += report.summary.dispositionCounts["composite-child-with-parent"];
    totals.independentRequired += report.summary.dispositionCounts["independent-required"];
    totals.unresolved += report.summary.dispositionCounts.unresolved;
    totals.nonvisual += report.summary.dispositionCounts.nonvisual;
    totals.excludedNotProven += report.summary.excludedNotProvenTimelineCount;
  }
  return totals;
}

function assertTotals(actual, expected, label) {
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
  );
}

function releaseBinding(catalogRecord, catalog, release) {
  return {
    releaseId: release.releaseId,
    releaseFingerprintSha256: EXPECTED.releaseFingerprintSha256,
    orderedMemberIdentitySha256: EXPECTED.orderedMemberIdentitySha256,
    catalog: {
      path: RELEASE_CATALOG_RELATIVE,
      bytes: catalogRecord.bytes,
      sha256: catalogRecord.sha256,
      schemaVersion: catalog.schemaVersion,
    },
    members: Object.fromEntries(release.members.map((member) => [
      member.animationId,
      {
        animationId: member.animationId,
        ordinal: member.ordinal,
        shardId: member.shardId,
        assetId: member.assetId,
        sourcePath: member.source.path,
        sourceSha256: member.source.sha256,
      },
    ])),
  };
}

function blockerClass(report, name) {
  const matches = report.summary.blockerClasses.filter(
    ({blockerClass: value}) => value === name,
  );
  invariant(matches.length === 1, `wave2 blocker class is missing or duplicated: ${name}`);
  return matches[0];
}

function groupByReason(items) {
  const grouped = new Map();
  for (const item of items) {
    const reason = item.disqualifiers.join(" + ");
    if (!grouped.has(reason)) grouped.set(reason, []);
    grouped.get(reason).push({
      animationId: item.animationId,
      timelineId: item.timelineId,
    });
  }
  return grouped;
}

export function assertExactWave3CandidateSpec(animationId, candidateSpecs) {
  const target = TARGETS.find((item) => item.animationId === animationId);
  invariant(target, `${animationId}: not a reviewed wave3 target`);
  invariant(
    Array.isArray(candidateSpecs)
      && candidateSpecs.length === 1
      && candidateSpecs[0].expectedTimelineCount === 1
      && candidateSpecs[0].timelines?.length === 1
      && candidateSpecs[0].timelines[0].timelineId === target.childTimelineId,
    `${animationId}: candidate spec selected set drifted`,
  );
  const actualSha256 = sha256(Buffer.from(stableCompact(candidateSpecs), "utf8"));
  invariant(
    actualSha256 === target.candidateSpecSha256,
    `${animationId}: candidate spec hash drifted`,
  );
  return actualSha256;
}

function validateParentDeclaration(manifest, target) {
  const domains = (manifest.implementation?.frameDomains || []).filter(
    ({sourceTimelineId}) => sourceTimelineId === target.parent.timelineId,
  );
  invariant(domains.length === 1, `${target.animationId}: parent declaration is not unique`);
  const [domain] = domains;
  invariant(
    domain.id === target.parent.timelineId
      && domain.kind === "nested"
      && domain.frameCount === target.parent.frameCount
      && domain.sourceProof?.sourceObjectId === target.parent.sourceObjectId
      && domain.sourceProof?.sha256 === target.parent.sourceProofSha256
      && domain.sourceProof?.claimIndex === target.parent.sourceProofClaimIndex
      && domain.sourceProof?.actionFrameSequenceSha256
        === target.parent.actionFrameSequenceSha256
      && domain.sourceProof?.strictAcceptanceEffect === "none",
    `${target.animationId}: exact parent declaration lineage drifted`,
  );
  return domain;
}

export function assertWave3AcceptanceNeutralDocument(document, label = "wave3 evidence") {
  invariant(document?.migrationStatusChanged === false, `${label}: migration status changed`);
  invariant(String(document?.strictAcceptanceEffect || "").startsWith("none;"), `${label}: strict acceptance effect drifted`);
  const effects = document.acceptanceEffects || {};
  for (const key of [
    "buttonAccepted",
    "interactionAccepted",
    "audioAccepted",
    "behaviorAccepted",
    "fullFrameAccepted",
    "rmseAccepted",
    "humanReviewAccepted",
    "ownerReviewAccepted",
  ]) {
    invariant(effects[key] === false, `${label}: ${key} must remain false`);
  }
  return true;
}

function declarationBasis(declarationReport, declarationMember) {
  return {
    wave2Report: {
      ...declarationReport.generatedFrom.wave2IndependentRequirementContract,
    },
    memberEvidence: {
      ...declarationMember.preTransitionProof.independentEvidence,
    },
    acceptedPairSet: {
      ...declarationMember.preTransitionProof.acceptedPairSet,
    },
    claimCount: declarationMember.declaration.frameDomainCount,
    declarationEffect: "declared-frame-domain-only",
    strictAcceptanceEffect: "none",
  };
}

function validateExistingSingleFrameContract(document, target) {
  invariant(
    document?.schemaVersion === 2
      && document.evidenceType === "static-frame-domain-disposition-evidence"
      && document.status === "verified-static-composite-claims",
    `${target.animationId}: predecessor static evidence identity drifted`,
  );
  const sourceContract = document.generatedFrom?.sourceProvenReleaseContract;
  invariant(
    sourceContract?.path === PRE_DECLARATION_STATIC_REPORT_RELATIVE
      && sourceContract.bytes === EXPECTED.preDeclarationStaticReportBytes
      && sourceContract.sha256 === EXPECTED.preDeclarationStaticReportSha256
      && sourceContract.acceptedPairSet?.count === 1
      && sourceContract.acceptedPairSet.sha256
        === target.existingSingleFramePairSetSha256
      && sourceContract.humanReviewer === false
      && sourceContract.ownerAcceptance === false
      && sourceContract.strictAcceptanceEffect === "none",
    `${target.animationId}: predecessor single-frame release contract drifted`,
  );
  const expectedIds = target.existingSingleFrameTimelineIds;
  const singleContracts = (document.claimSetContracts || []).filter(
    ({proofType}) => proofType === "single-frame-scriptless-structural-child",
  );
  invariant(
    singleContracts.length === 1
      && singleContracts[0].expectedTimelineCount === expectedIds.length
      && JSON.stringify(singleContracts[0].expectedTimelineIds)
        === JSON.stringify(expectedIds),
    `${target.animationId}: predecessor single-frame claim set drifted`,
  );
  return sourceContract;
}

async function buildState(projectRoot) {
  const [
    scriptRecord,
    packageRecord,
    wrapperRecord,
    proofEngineRecord,
    dispositionEngineRecord,
    declarationRecord,
    wave2Record,
    catalogRecord,
  ] = await Promise.all([
    readOrdinary(projectRoot, SCRIPT_RELATIVE),
    readOrdinary(projectRoot, PACKAGE_RELATIVE),
    readOrdinary(projectRoot, GENERIC_WRAPPER_RELATIVE),
    readOrdinary(projectRoot, PROOF_ENGINE_RELATIVE),
    readOrdinary(projectRoot, DISPOSITION_ENGINE_RELATIVE),
    readJson(projectRoot, DECLARATION_REPORT_RELATIVE),
    readJson(projectRoot, WAVE2_REPORT_RELATIVE),
    readJson(projectRoot, RELEASE_CATALOG_RELATIVE),
  ]);
  invariant(
    declarationRecord.sha256 === EXPECTED.declarationReportSha256
      && declarationRecord.bytes === EXPECTED.declarationReportBytes,
    "immutable d961 declaration receipt drifted",
  );
  invariant(wave2Record.sha256 === EXPECTED.wave2ReportSha256, "immutable wave2 unresolved report drifted");
  invariant(catalogRecord.sha256 === EXPECTED.releaseCatalogSha256, "lesson release catalog drifted");
  const declaration = declarationRecord.document;
  invariant(
    declaration.schemaVersion === 1
      && declaration.reportType
        === "g4-l10-source-proven-independent-frame-domain-declarations"
      && declaration.releaseId === RELEASE_ID
      && declaration.generatedBy?.sha256
        === EXPECTED.declarationGeneratorSha256
      && JSON.stringify(declaration.summary.afterDispositionTotals)
        === JSON.stringify(EXPECTED.before),
    "d961 declaration receipt contract drifted",
  );
  const wave2 = wave2Record.document;
  invariant(
    wave2.schemaVersion === 1
      && wave2.reportType
        === "lesson-release-source-proven-independent-frame-domain-contract"
      && wave2.releaseId === RELEASE_ID,
    "wave2 unresolved report identity drifted",
  );
  const catalog = catalogRecord.document;
  const releases = catalog.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(releases.length === 1, `${RELEASE_ID}: release is missing or duplicated`);
  const [release] = releases;
  invariant(
    release.members.length === EXPECTED.releaseMembers
      && releaseFingerprint(release) === EXPECTED.releaseFingerprintSha256
      && orderedMemberIdentityFingerprint(release)
        === EXPECTED.orderedMemberIdentitySha256,
    `${RELEASE_ID}: exact release identity drifted`,
  );
  const releaseById = new Map(release.members.map((member) => [member.animationId, member]));
  const declarationById = new Map(
    declaration.members.map((member) => [member.animationId, member]),
  );
  invariant(declarationById.size === 40, "declaration affected-member set drifted");

  const auditCache = new Map();
  async function auditInputs(animationId) {
    if (!auditCache.has(animationId)) {
      auditCache.set(animationId, (async () => {
        invariant(releaseById.has(animationId), `${animationId}: not an L10 release member`);
        const base = `migrations/${animationId}`;
        const [manifestRecord, inventoryRecord, swfmillRecord, scriptsRecord] =
          await Promise.all([
            readJson(projectRoot, `${base}/migration.json`),
            readJson(projectRoot, `${base}/audit/scenario-inventory.json`),
            readOrdinary(projectRoot, `${base}/audit/machine/swfmill.xml.gz`),
            readOrdinary(projectRoot, `${base}/audit/machine/ffdec-scripts.txt.gz`),
          ]);
        const manifest = manifestRecord.document;
        const inventory = inventoryRecord.document;
        invariant(
          manifest.animationId === animationId
            && inventory.animationId === animationId,
          `${animationId}: workspace identity drifted`,
        );
        const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
        const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
        invariant(
          swfmillRecord.sha256 === swfmillEvidence.sha256
            && scriptsRecord.sha256 === scriptsEvidence.sha256,
          `${animationId}: machine audit compressed hash drifted`,
        );
        const swfmillXml = gunzipSync(swfmillRecord.contents).toString("utf8");
        const scriptText = gunzipSync(scriptsRecord.contents).toString("utf8");
        invariant(
          sha256(Buffer.from(swfmillXml, "utf8"))
            === swfmillEvidence.uncompressedSha256
            && sha256(Buffer.from(scriptText, "utf8"))
              === scriptsEvidence.uncompressedSha256,
          `${animationId}: machine audit uncompressed hash drifted`,
        );
        const structure = parseSwfmillDispositionStructure(swfmillXml);
        const scripts = parseFfdecDispositionScripts(scriptText);
        return {
          animationId,
          base,
          manifestRecord,
          inventoryRecord,
          swfmillRecord,
          scriptsRecord,
          manifest,
          inventory,
          structure,
          scripts,
          multiAudit: deriveMultiFrameScriptlessCandidateAudit({
            animationId,
            structure,
            scripts,
            inventory,
            manifest,
          }),
          singleAudit: deriveSingleFrameScriptlessEligibility({
            animationId,
            structure,
            scripts,
            inventory,
            manifest,
          }),
        };
      })());
    }
    return auditCache.get(animationId);
  }

  const oldParentClass = blockerClass(
    wave2,
    "scriptless-child-parent-domain-not-declared",
  );
  const scriptedClass = blockerClass(
    wave2,
    "scripted-one-frame-domain-semantics-unproved",
  );
  const directClass = blockerClass(
    wave2,
    "scriptless-direct-root-local-playhead-needs-runtime-continuation-proof",
  );
  const oldParentPairs = oldParentClass.pairs.map((item) => ({...item}));
  const scriptedPairs = scriptedClass.pairs.map((item) => ({...item}));
  const directPairs = directClass.pairs.map((item) => ({...item}));
  const oldParentPairSet = assertPairSet(
    oldParentPairs,
    EXPECTED.oldParentUndeclared,
    "old parent-undeclared 29",
  );
  const scriptedPairSet = assertPairSet(
    scriptedPairs,
    EXPECTED.scriptedOneFrame,
    "scripted one-frame 41",
  );
  const directPairSet = assertPairSet(
    directPairs,
    EXPECTED.directRootLong,
    "direct-root long 7",
  );
  const acceptedKeys = new Set(TARGETS.map(
    ({animationId, childTimelineId}) => `${animationId}\t${childTimelineId}`,
  ));
  const acceptedPairs = oldParentPairs.filter(
    ({animationId, timelineId}) => acceptedKeys.has(`${animationId}\t${timelineId}`),
  );
  const rejectedPairs = oldParentPairs.filter(
    ({animationId, timelineId}) => !acceptedKeys.has(`${animationId}\t${timelineId}`),
  );
  const acceptedPairSet = assertPairSet(acceptedPairs, EXPECTED.accepted, "wave3 accepted 3");
  const rejectedPairSet = assertPairSet(rejectedPairs, EXPECTED.rejected, "wave3 rejected 26");
  invariant(
    acceptedPairs.length + rejectedPairs.length === oldParentPairs.length,
    "wave3 old29 partition is incomplete",
  );

  const inspectedOldParent = [];
  for (const pair of oldParentPairs) {
    const audit = await auditInputs(pair.animationId);
    const inspection = audit.multiAudit.inspections.find(
      ({timelineId}) => timelineId === pair.timelineId,
    );
    invariant(inspection, `${pair.animationId}/${pair.timelineId}: multi-frame inspection missing`);
    inspectedOldParent.push({...pair, ...inspection});
  }
  const acceptedInspections = inspectedOldParent.filter(
    ({animationId, timelineId}) => acceptedKeys.has(`${animationId}\t${timelineId}`),
  );
  invariant(
    acceptedInspections.length === EXPECTED.accepted.count
      && acceptedInspections.every(({eligible}) => eligible === true),
    "wave3 reviewed accepted set is no longer exactly eligible",
  );
  const rejectedInspections = inspectedOldParent.filter(
    ({animationId, timelineId}) => !acceptedKeys.has(`${animationId}\t${timelineId}`),
  );
  invariant(
    rejectedInspections.length === EXPECTED.rejected.count
      && rejectedInspections.every(({eligible}) => eligible === false),
    "wave3 rejected set eligibility drifted",
  );
  const rejectedReasonGroups = groupByReason(rejectedInspections);
  invariant(
    rejectedReasonGroups.size === Object.keys(EXPECTED.rejectedReasonGroups).length,
    "wave3 rejected reason-group count drifted",
  );
  for (const [reason, expected] of Object.entries(EXPECTED.rejectedReasonGroups)) {
    invariant(rejectedReasonGroups.has(reason), `wave3 rejected reason missing: ${reason}`);
    assertPairSet(rejectedReasonGroups.get(reason), expected, `wave3 rejected reason ${reason}`);
  }

  const inspectedScripted = [];
  for (const pair of scriptedPairs) {
    const audit = await auditInputs(pair.animationId);
    const inspection = audit.singleAudit.inspections.get(pair.timelineId);
    invariant(inspection, `${pair.animationId}/${pair.timelineId}: single-frame inspection missing`);
    inspectedScripted.push({
      ...pair,
      eligible: inspection.eligible,
      disqualifiers: inspection.disqualifiers,
      directDoActionTagCount: inspection.directDoActionTagCount,
      attributedDoInitActionCount: inspection.attributedDoInitActions.length,
      ffdecFrameScriptCount: inspection.ffdecFrameScripts.length,
    });
  }
  invariant(inspectedScripted.every(({eligible}) => eligible === false), "scripted one-frame eligibility broadened");
  const scriptedReasonGroups = groupByReason(inspectedScripted);
  invariant(
    scriptedReasonGroups.size === Object.keys(EXPECTED.scriptedReasonGroups).length,
    "scripted one-frame reason-group count drifted",
  );
  for (const [reason, expected] of Object.entries(EXPECTED.scriptedReasonGroups)) {
    invariant(scriptedReasonGroups.has(reason), `scripted reason missing: ${reason}`);
    assertPairSet(scriptedReasonGroups.get(reason), expected, `scripted reason ${reason}`);
  }

  const inspectedDirect = [];
  for (const pair of directPairs) {
    const audit = await auditInputs(pair.animationId);
    const inspection = audit.multiAudit.inspections.find(
      ({timelineId}) => timelineId === pair.timelineId,
    );
    invariant(inspection, `${pair.animationId}/${pair.timelineId}: direct-root inspection missing`);
    invariant(
      inspection.eligible === false
        && inspection.parentTimelineId === "root"
        && inspection.parentFrameDomainId === "root"
        && JSON.stringify(inspection.namedIncomingInstances) === JSON.stringify(["animation"])
        && JSON.stringify(inspection.disqualifiers)
          === JSON.stringify(["named-incoming-instance-requires-target-control-proof"]),
      `${pair.animationId}/${pair.timelineId}: direct-root runtime blocker drifted`,
    );
    inspectedDirect.push({...pair, ...inspection});
  }
  const remainingPairs = [...scriptedPairs, ...rejectedPairs, ...directPairs];
  const remainingPairSet = assertPairSet(
    remainingPairs,
    EXPECTED.remaining,
    "wave3 remaining unresolved 74",
  );

  const binding = releaseBinding(catalogRecord, catalog, release);
  const targetEntries = [];
  const targetStates = [];
  const targetMembers = [];
  const targetDispositionById = new Map();

  for (const target of TARGETS) {
    const declarationMember = declarationById.get(target.animationId);
    invariant(declarationMember, `${target.animationId}: declaration member missing`);
    const audit = await auditInputs(target.animationId);
    assertDescriptor(
      audit.manifestRecord,
      {
        path: `migrations/${target.animationId}/migration.json`,
        bytes: declarationMember.successor.migrationJson.bytes,
        sha256: declarationMember.successor.migrationJson.sha256,
      },
      `${target.animationId}: unchanged manifest`,
    );
    assertDescriptor(
      audit.inventoryRecord,
      declarationMember.successor.scenarioInventory,
      `${target.animationId}: unchanged scenario inventory`,
    );
    const manifestTechnicalSha256 = technicalManifestSha256(audit.manifest);
    invariant(
      manifestTechnicalSha256 === target.technicalManifestSha256
        && declarationMember.successor.migrationJson.technicalProjectionSha256
          === target.technicalManifestSha256,
      `${target.animationId}: technical manifest projection drifted`,
    );
    const manifestEvidence = requiredEvidence(
      audit.inventory,
      "migration-technical-contract",
    );
    invariant(
      manifestEvidence.path === "migration.json"
        && manifestEvidence.projection === TECHNICAL_MANIFEST_PROJECTION.id
        && manifestEvidence.hashMode === "canonical-json-v1"
        && JSON.stringify(manifestEvidence.excludedPaths)
          === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
        && manifestEvidence.sha256 === manifestTechnicalSha256,
      `${target.animationId}: scenario technical-manifest binding drifted`,
    );
    const parentDomain = validateParentDeclaration(audit.manifest, target);
    const candidateSpecSha256 = assertExactWave3CandidateSpec(
      target.animationId,
      audit.multiAudit.candidateSpecs,
    );
    invariant(audit.multiAudit.excludedTimelineIds.length === 0, `${target.animationId}: unexpected multi-frame exclusion`);
    const sourceEvidence = requiredEvidence(audit.inventory, "source-swf");
    invariant(
      sourceEvidence.path === target.sourcePath
        && sourceEvidence.sha256 === target.sourceSha256,
      `${target.animationId}: exact source binding drifted`,
    );
    const sourceRecord = await readOrdinary(
      projectRoot,
      artifactRelativePath(target.animationId, sourceEvidence.path),
    );
    invariant(sourceRecord.sha256 === target.sourceSha256, `${target.animationId}: physical source SWF drifted`);
    const staticRelative =
      `migrations/${target.animationId}/audit/static-frame-domain-disposition-evidence.json`;
    const dispositionRelative =
      `migrations/${target.animationId}/audit/frame-domain-disposition.json`;
    const [currentStatic, currentDisposition] = await Promise.all([
      readJson(projectRoot, staticRelative),
      readJson(projectRoot, dispositionRelative),
    ]);
    const predecessorSourceContract = validateExistingSingleFrameContract(
      currentStatic.document,
      target,
    );
    const expectedDeclarationBasis = declarationBasis(declaration, declarationMember);
    invariant(
      JSON.stringify(currentDisposition.document.generatedFrom?.sourceProvenIndependentDeclarationBasis)
        === JSON.stringify(expectedDeclarationBasis),
      `${target.animationId}: disposition declaration lineage drifted`,
    );
    const staticDocument = buildStaticCompositeEvidenceDocument({
      animationId: target.animationId,
      manifest: audit.manifest,
      inventory: audit.inventory,
      inventorySha256: audit.inventoryRecord.sha256,
      sourceSwfBytes: sourceRecord.contents,
      swfmillGzip: audit.swfmillRecord.contents,
      scriptsGzip: audit.scriptsRecord.contents,
      claimSpecs: [],
      singleFrameClaimSpec: {
        proofType: "single-frame-scriptless-structural-child",
        expectedTimelineCount: target.existingSingleFrameTimelineIds.length,
        timelineIds: [...target.existingSingleFrameTimelineIds],
      },
      multiFrameClaimSpec: audit.multiAudit.candidateSpecs,
      multiFrameExclusionIds: [],
    });
    staticDocument.authorityStatement.push(
      "The pre-declaration exact L10 single-frame release contract remains hash-bound and is not broadened by this successor.",
      WAVE3_AUTHORITY_STATEMENT,
    );
    staticDocument.generatedFrom.sourceProvenReleaseContract =
      structuredClone(predecessorSourceContract);
    const memberPairSet = canonicalWave3PairSet([{
      animationId: target.animationId,
      timelineId: target.childTimelineId,
    }]);
    staticDocument.generatedFrom.postDeclarationWave3Basis = {
      declarationReceipt: descriptor(declarationRecord),
      oldParentUndeclaredPairSet: oldParentPairSet,
      acceptedPairSet,
      rejectedPairSet,
      remainingUnresolvedPairSet: remainingPairSet,
      memberAcceptedPairSet: memberPairSet,
      candidateSpecSha256,
      candidateSpecHashMode: "stable-sorted-compact-json-v1",
      engineeringReviewOnly: true,
      humanReviewer: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: "none",
    };
    staticDocument.proofBoundary = {
      classificationScope:
        "single-frame-scriptless structural child plus one exact post-declaration parent-clock composite child",
      runtimeReachabilityEstablished: false,
      behaviorEstablished: false,
      visualFidelityEstablished: false,
      audioEstablished: false,
      fullFrameRmseEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictAcceptanceEffect: "none",
    };
    assertWave3AcceptanceNeutralDocument(
      staticDocument,
      `${target.animationId}: target static evidence`,
    );
    invariant(
      staticDocument.claims.length === 2
        && staticDocument.claims.some((claim) => (
          claim.timelineId === target.childTimelineId
          && claim.frameCount === target.childFrameCount
          && claim.disposition === "composite-child-with-parent"
          && claim.role
            === "multi-frame-scriptless-parent-clock-composite-child"
          && claim.parentBinding?.parentTimelineId === target.parent.timelineId
          && claim.parentBinding?.parentFrameDomainId === target.parent.timelineId
          && claim.parentBinding?.parentFrameCount === target.parent.frameCount
        )),
      `${target.animationId}: exact target composite claim drifted`,
    );
    const staticRendered = pretty(staticDocument);
    const staticTarget = recordForRendered(
      staticRelative,
      staticRendered,
      staticDocument,
    );
    const disposition = buildDispositionReport({
      animationId: target.animationId,
      inventory: audit.inventory,
      inventorySha256: audit.inventoryRecord.sha256,
      manifest: audit.manifest,
      manifestSha256: manifestTechnicalSha256,
      releaseBinding: binding,
      staticDispositionEvidence: staticDocument,
      staticDispositionEvidenceSha256: staticTarget.sha256,
      independentDispositionEvidence: null,
      independentDispositionEvidenceSha256: null,
    });
    disposition.authorityStatement.push(
      DECLARATION_AUTHORITY_STATEMENT,
      WAVE3_AUTHORITY_STATEMENT,
    );
    disposition.generatedFrom.sourceProvenIndependentDeclarationBasis =
      expectedDeclarationBasis;
    disposition.generatedFrom.postDeclarationWave3CompositeBasis = {
      declarationReceipt: descriptor(declarationRecord),
      memberAcceptedPairSet: memberPairSet,
      acceptedPairSet,
      rejectedPairSet,
      remainingUnresolvedPairSet: remainingPairSet,
      candidateSpecSha256,
      staticCompositeEvidence: descriptor(staticTarget),
      dispositionEffect: "unresolved-to-composite-child-with-parent-only",
      strictAcceptanceEffect: "none",
    };
    invariant(
      disposition.migrationStatusChanged === false
        && String(disposition.strictAcceptanceEffect || "").startsWith("none;")
        && disposition.summary.dispositionCounts["declared-frame-domain"] === 2
        && disposition.summary.dispositionCounts["composite-child-with-parent"] === 2
        && disposition.summary.dispositionCounts["independent-required"] === 0
        && disposition.summary.dispositionCounts.unresolved === 0,
      `${target.animationId}: target disposition boundary drifted`,
    );
    const dispositionRendered = pretty(disposition);
    const dispositionTarget = recordForRendered(
      dispositionRelative,
      dispositionRendered,
      disposition,
    );
    const predecessorStatic = declarationMember.successor.staticCompositeEvidence;
    const predecessorDisposition = declarationMember.successor.frameDomainDisposition;
    const isPredecessor = matchesDescriptor(currentStatic, predecessorStatic)
      && matchesDescriptor(currentDisposition, predecessorDisposition);
    const isSuccessor = matchesDescriptor(currentStatic, staticTarget)
      && matchesDescriptor(currentDisposition, dispositionTarget);
    invariant(
      isPredecessor || isSuccessor,
      `${target.animationId}: target workspace is neither exact declaration predecessor nor exact wave3 successor`,
    );
    targetStates.push(isPredecessor ? "declaration-predecessor" : "wave3-successor");
    targetEntries.push(staticTarget, dispositionTarget);
    targetDispositionById.set(target.animationId, disposition);
    targetMembers.push({
      animationId: target.animationId,
      ordinal: releaseById.get(target.animationId).ordinal,
      assetId: releaseById.get(target.animationId).assetId,
      source: {
        path: target.sourcePath,
        sha256: target.sourceSha256,
      },
      unchangedInputs: {
        migrationJson: descriptor(audit.manifestRecord),
        migrationTechnicalProjectionSha256: manifestTechnicalSha256,
        scenarioInventory: descriptor(audit.inventoryRecord),
        swfmillStructure: descriptor(audit.swfmillRecord),
        ffdecScripts: descriptor(audit.scriptsRecord),
      },
      parentDeclaration: {
        id: parentDomain.id,
        sourceTimelineId: parentDomain.sourceTimelineId,
        frameCount: parentDomain.frameCount,
        sourceProof: structuredClone(parentDomain.sourceProof),
      },
      candidateSpecSha256,
      candidateSpecHashMode: "stable-sorted-compact-json-v1",
      predecessor: {
        staticCompositeEvidence: predecessorStatic,
        frameDomainDisposition: predecessorDisposition,
      },
      successor: {
        staticCompositeEvidence: descriptor(staticTarget),
        frameDomainDisposition: descriptor(dispositionTarget),
      },
      compositeClaim: structuredClone(
        staticDocument.claims.find(({timelineId}) => timelineId === target.childTimelineId),
      ),
    });
  }
  invariant(
    new Set(targetStates).size === 1,
    "wave3 target workspaces are in a mixed predecessor/successor state",
  );
  const inputState = targetStates[0];

  const allDispositionReports = [];
  const unchangedDispositionBindings = [];
  for (const member of release.members) {
    if (targetDispositionById.has(member.animationId)) {
      allDispositionReports.push(targetDispositionById.get(member.animationId));
      continue;
    }
    const declarationMember = declarationById.get(member.animationId);
    const base = `migrations/${member.animationId}`;
    if (declarationMember) {
      const [manifestRecord, inventoryRecord, staticRecord, dispositionRecord] =
        await Promise.all([
          readOrdinary(projectRoot, `${base}/migration.json`),
          readOrdinary(projectRoot, `${base}/audit/scenario-inventory.json`),
          readOrdinary(
            projectRoot,
            `${base}/audit/static-frame-domain-disposition-evidence.json`,
            {allowMissing: true},
          ),
          readJson(projectRoot, `${base}/audit/frame-domain-disposition.json`),
        ]);
      assertDescriptor(
        manifestRecord,
        {
          path: `${base}/migration.json`,
          bytes: declarationMember.successor.migrationJson.bytes,
          sha256: declarationMember.successor.migrationJson.sha256,
        },
        `${member.animationId}: unchanged declaration manifest`,
      );
      assertDescriptor(
        inventoryRecord,
        declarationMember.successor.scenarioInventory,
        `${member.animationId}: unchanged declaration inventory`,
      );
      if (declarationMember.successor.staticCompositeEvidence) {
        assertDescriptor(
          staticRecord,
          declarationMember.successor.staticCompositeEvidence,
          `${member.animationId}: unchanged declaration static evidence`,
        );
      } else {
        invariant(!staticRecord.exists, `${member.animationId}: unexpected static evidence appeared`);
      }
      assertDescriptor(
        dispositionRecord,
        declarationMember.successor.frameDomainDisposition,
        `${member.animationId}: unchanged declaration disposition`,
      );
      allDispositionReports.push(dispositionRecord.document);
      unchangedDispositionBindings.push(descriptor(dispositionRecord));
    } else {
      const dispositionRecord = await readJson(
        projectRoot,
        `${base}/audit/frame-domain-disposition.json`,
      );
      invariant(
        dispositionRecord.sha256
          === UNCHANGED_UNAFFECTED_DISPOSITIONS[member.animationId],
        `${member.animationId}: unchanged unaffected disposition drifted`,
      );
      allDispositionReports.push(dispositionRecord.document);
      unchangedDispositionBindings.push(descriptor(dispositionRecord));
    }
  }
  invariant(allDispositionReports.length === EXPECTED.releaseMembers, "release disposition report count drifted");
  assertTotals(
    dispositionTotals(allDispositionReports),
    EXPECTED.after,
    "post-wave3 disposition totals",
  );

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-post-declaration-static-composite-wave3",
    releaseId: RELEASE_ID,
    generatedBy: {
      path: SCRIPT_RELATIVE,
      sha256: scriptRecord.sha256,
      deterministic: true,
      transactional: true,
      packageDispatcher: descriptor(packageRecord),
      proofEngine: descriptor(proofEngineRecord),
      dispositionEngine: descriptor(dispositionEngineRecord),
      immutablePreWave3GenericWrapper: descriptor(wrapperRecord),
    },
    generatedFrom: {
      immutableDeclarationReceipt: descriptor(declarationRecord),
      immutableWave2UnresolvedContract: descriptor(wave2Record),
      lessonReleaseCatalog: descriptor(catalogRecord),
      releaseFingerprintSha256: EXPECTED.releaseFingerprintSha256,
      orderedMemberIdentitySha256: EXPECTED.orderedMemberIdentitySha256,
    },
    transitionPolicy: {
      predecessor:
        "The immutable d961 declaration receipt is the exact immediate-transition evidence. It remains byte-preserved and is never regenerated or rewritten by wave3.",
      selection:
        "Every and only the three reviewed accepted pairs must remain eligible under the exact current generic parent-clock proof engine; all 26 rejected old-parent candidates, 41 scripted one-frame children, and seven direct-root long children remain fail-closed.",
      mutationScope:
        "The transaction replaces only three static-composite evidence files, three frame-domain disposition files, and this aggregate receipt. Manifests, scenarios, coverage, traces, runtime plans, strict-readiness, status, reviews, registries, ledgers, and source assets are not written.",
      acceptance:
        "The transition changes only unresolved to composite-child-with-parent for three child timelines and grants no runtime or acceptance effect.",
    },
    exactPairSets: {
      oldParentUndeclared: oldParentPairSet,
      accepted: acceptedPairSet,
      rejected: rejectedPairSet,
      scriptedOneFrame: scriptedPairSet,
      directRootLong: directPairSet,
      remainingUnresolved: remainingPairSet,
    },
    rejectedReasonGroups: [...rejectedReasonGroups.entries()].map(
      ([reason, pairs]) => ({reason, exactPairSet: canonicalWave3PairSet(pairs), pairs}),
    ),
    scriptedReasonGroups: [...scriptedReasonGroups.entries()].map(
      ([reason, pairs]) => ({reason, exactPairSet: canonicalWave3PairSet(pairs), pairs}),
    ),
    directRootLongBlockers: inspectedDirect.map((item) => ({
      animationId: item.animationId,
      timelineId: item.timelineId,
      frameCount: item.frameCount,
      parentTimelineId: item.parentTimelineId,
      parentFrameDomainId: item.parentFrameDomainId,
      namedIncomingInstances: item.namedIncomingInstances,
      expectedTagCensus: item.expectedTagCensus,
      disqualifiers: item.disqualifiers,
      nextEvidenceAction:
        "Capture authoritative natural-host continuation/control/audio evidence; static root placement cannot prove whether the named long child continues, stops, resets, or is host-controlled after the stopped root window.",
    })),
    summary: {
      releaseMembers: EXPECTED.releaseMembers,
      affectedMembers: TARGETS.length,
      newCompositeClaims: TARGETS.length,
      beforeDispositionTotals: EXPECTED.before,
      afterDispositionTotals: EXPECTED.after,
      remainingUnresolved: EXPECTED.remaining.count,
      authoritativeRuntimeSessionsExecuted: 0,
      implementationFramesCaptured: 0,
      originalRuntimeFramesCaptured: 0,
      rmseComparisonsCompleted: 0,
      humanReviewsCompleted: 0,
      ownerReviewsCompleted: 0,
      strictCompletions: 0,
      publishedMembers: 0,
    },
    members: targetMembers,
    unchangedDispositionBindings,
    downstreamBoundary: {
      artifactsRebuilt: [],
      artifactsExplicitlyNotRebuilt: [
        "coverage",
        "trace specs",
        "runtime plans",
        "strict-readiness",
        "keyframes",
        "renderers",
        "registries",
        "ledgers",
      ],
      policy:
        "Any downstream artifact that binds a predecessor frame-domain-disposition hash is stale after this transition and must be reported rather than silently rewritten by wave3.",
    },
    acceptanceBoundary: {
      authoritativeRuntimeEstablished: false,
      behaviorEstablished: false,
      visualFidelityEstablished: false,
      audioEstablished: false,
      fullFrameRmseEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      releasePublicationEstablished: false,
    },
    strictAcceptanceEffect: STRICT_EFFECT,
  };
  const reportRendered = pretty(report);
  const reportTarget = recordForRendered(
    G4_L10_WAVE3_REPORT_RELATIVE,
    reportRendered,
    report,
  );
  targetEntries.push(reportTarget);
  return {
    inputState,
    report,
    reportTarget,
    targetEntries,
  };
}

async function verifyTargetState(state, projectRoot) {
  for (const entry of state.targetEntries) {
    const current = await readOrdinary(projectRoot, entry.path);
    invariant(
      current.bytes === entry.bytes
        && current.sha256 === entry.sha256
        && current.contents.toString("utf8") === entry.rendered,
      `${entry.path}: checked-in wave3 successor is stale`,
    );
  }
}

export async function materializeG4L10PostDeclarationStaticComposites({
  mode = "dry-run",
  projectRoot: projectRootOption = PROJECT_ROOT,
  transactionHooks = {},
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode), `unsupported mode: ${mode}`);
  const projectRoot = path.resolve(projectRootOption);
  const state = await buildState(projectRoot);
  if (mode === "dry-run") {
    return {
      action: state.inputState === "declaration-predecessor"
        ? "planned"
        : "verified-plan",
      inputState: state.inputState,
      report: state.report,
      reportRecord: descriptor(state.reportTarget),
    };
  }
  if (mode === "check") {
    invariant(
      state.inputState === "wave3-successor",
      "wave3 verification requires all three target workspaces to be exact successors",
    );
  } else {
    const changedEntries = [];
    for (const entry of state.targetEntries) {
      const current = await readOrdinary(projectRoot, entry.path, {allowMissing: true});
      if (!matchesDescriptor(current, entry)) changedEntries.push(entry);
    }
    if (changedEntries.length) {
      await commitAtomicEntries(changedEntries, {
        projectRoot,
        hooks: transactionHooks,
      });
    }
  }
  const successor = await buildState(projectRoot);
  invariant(successor.inputState === "wave3-successor", "wave3 successor was not fully installed");
  await verifyTargetState(successor, projectRoot);
  return {
    action: mode === "check" ? "verified" : "written",
    inputState: successor.inputState,
    report: successor.report,
    reportRecord: descriptor(successor.reportTarget),
  };
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) => ["--dry-run", "--apply", "--check"].includes(argument));
  const unknown = argv.filter(
    (argument) => !["--dry-run", "--apply", "--check", "--help", "-h"].includes(argument),
  );
  invariant(unknown.length === 0, `Unknown option: ${unknown[0]}`);
  const help = argv.includes("--help") || argv.includes("-h");
  if (help) {
    invariant(argv.length === 1, "--help must be used alone");
    return {help: true, mode: ""};
  }
  invariant(modes.length === 1, "choose exactly one of --dry-run, --apply, or --check");
  return {help: false, mode: modes[0].slice(2)};
}

function usage() {
  return `Usage: node ${SCRIPT_RELATIVE} --dry-run|--apply|--check

Consumes the immutable d961 L10 independent-domain declaration receipt and the
exact old29/accepted3/rejected26/remaining74 pair sets. It reuses the exact
static parent-clock proof engine and transactionally replaces only RW002,
RW003, and RW005 static-composite evidence plus frame-domain dispositions and
one aggregate receipt. It never writes manifests, scenarios, coverage, traces,
runtime, strict-readiness, status, reviews, registries, ledgers, or sources.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG4L10PostDeclarationStaticComposites({
    mode: options.mode,
  });
  process.stdout.write(`${JSON.stringify({
    action: result.action,
    inputState: result.inputState,
    report: result.reportRecord,
    exactPairSets: result.report.exactPairSets,
    summary: result.report.summary,
    acceptanceEffect: "none",
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
