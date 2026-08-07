#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECT_ROOT,
  RELEASE_ID,
  TEMPLATE_ANIMATION_ID,
  deriveContract as deriveV2Contract,
  readSnapshot as readV2Snapshot,
} from "./build-g4-l10-complete-migration-template-contract-v2.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.md";

const EXTRA_FIXED_INPUTS = Object.freeze({
  rejectedV2Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v2.mjs",
    kind: "text",
    sha256: "b082c2a8ddeb7ca2f2ed9be4444b9b2fad9c69f7547e2a5c7a6575fafaa62842",
  },
  rejectedV2Tests: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v2.test.mjs",
    kind: "text",
    sha256: "3e8a47bc823271569d12fe49ba5f854d44ce3e7e273554ca2731a15f6ffb9ad4",
  },
  rejectedV2Json: {
    path: "reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.json",
    kind: "json",
    sha256: "8a67d3a57b18442809fe70b8359d65b79e055a9435cb624bb40608b02256db74",
  },
  rejectedV2Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v2-2026-08-04.md",
    kind: "text",
    sha256: "ce616be0d0f1f93477df3e1af6d89a7f7215861533fddb6e923766f9c7fee655",
  },
  engineeringCandidateTest: {
    path: "packages/demos/tests/course-g04-l10-source-static-engineering-candidates.test.ts",
    kind: "text",
    sha256: "a508fe07db73ad75e3bbf3331f03ace1b2f29820d6660a632c20bb5003198130",
  },
  prototypeRegistry: {
    path: "packages/demos/prototype-registry.json",
    kind: "text",
    sha256: "8ab849e636f064501080238b50cbc69e2186025cda5715fe81bc3906a4148149",
  },
  generatedRegistry: {
    path: "packages/demos/src/registry.generated.ts",
    kind: "text",
    sha256: "f703ab555cd02fe98879398c1011caccde7ed8c7cbdc178c373a0ae5bfb399ce",
  },
  prototypeManifest: {
    path: "packages/demos/src/prototype-manifest.ts",
    kind: "text",
    sha256: "a56dda011879d1c72c9b111373862eb96f218519a6e8d137ec733695beee5e75",
  },
  wholeLessonRegistry: {
    path: "apps/web/lib/whole-lesson-course-registry.ts",
    kind: "text",
    sha256: "c2b977939e358839ad6c04f8b48cad5a7e1c2968b8f6342753909661bb740d0e",
  },
});

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "authoritativeOriginalRuntimeEvidence",
  "ruffleBaselineAuthority",
  "currentJavascriptBaselineAuthority",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false, `Absolute path is forbidden: ${relativePath}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`), `Path escapes project root: ${relativePath}`);
  return absolute;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(statIdentity(after), statIdentity(before),
    `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size,
    `${specification.path} size drifted while read`);
  const digest = sha256(bytes);
  if (specification.sha256) {
    assert.equal(digest, specification.sha256,
      `${specification.path} fixed SHA-256 epoch drifted`);
  }
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode: Number(before.mode & 0o777n).toString(8).padStart(4, "0"),
    statIdentity: statIdentity(before),
  };
  if (specification.kind !== "binary") record.text = bytes.toString("utf8");
  if (specification.kind === "json") record.document = JSON.parse(record.text);
  return record;
}

function recordBinding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function document(snapshot, key) {
  const result = snapshot.records[key]?.document;
  assert.ok(result, `Missing JSON document ${key}`);
  return result;
}

function text(snapshot, key) {
  const result = snapshot.records[key]?.text;
  assert.equal(typeof result, "string", `Missing text input ${key}`);
  return result;
}

function utf8Compare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function descriptorClosure(records) {
  const sorted = [...records].sort((left, right) => utf8Compare(left.path, right.path));
  assert.equal(new Set(sorted.map(({ path: value }) => value)).size, sorted.length,
    "Closure contains duplicate paths");
  const encoded = sorted.map((record) => `${record.path}\0${record.sha256}\n`).join("");
  return {
    recordCount: sorted.length,
    totalBytes: sorted.reduce((sum, record) => sum + record.bytes, 0),
    setSha256: sha256(encoded),
    algorithm:
      "UTF-8 path-byte sort; concatenate relative path, NUL, lowercase file SHA-256, LF",
    records: sorted.map(recordBinding),
  };
}

function parseCandidateSource(source) {
  const candidateBlock = source.match(/const candidates = \[([\s\S]*?)\] as const;/u)?.[1];
  assert.ok(candidateBlock, "Candidate array is absent");
  const candidateIds = [...candidateBlock.matchAll(/\bid:\s*"([^"]+)"/gu)]
    .map((match) => match[1]);
  const frameCounts = [...candidateBlock.matchAll(/\bframeCount:\s*(\d+)/gu)]
    .map((match) => Number(match[1]));
  const modules = [...source.matchAll(/from "\.\.\/src\/modules\/([^"]+)"/gu)]
    .map((match) => `packages/demos/src/modules/${match[1]}.tsx`);
  const timelines = [...source.matchAll(/from "\.\.\/src\/timelines\/([^"]+)"/gu)]
    .map((match) => `packages/demos/src/timelines/${match[1]}.ts`);
  assert.equal(candidateIds.length, 24);
  assert.equal(new Set(candidateIds).size, 24);
  assert.equal(frameCounts.length, 24);
  assert.equal(modules.length, 24);
  assert.equal(timelines.length, 24);
  return {
    candidateIds,
    frameCounts,
    modules,
    timelines,
  };
}

function memberKey(animationId, role) {
  return `member:${animationId}:${role}`;
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const base = await readV2Snapshot(projectRoot);
  const records = { ...base.records };
  const extraFixed = await Promise.all(Object.entries(EXTRA_FIXED_INPUTS)
    .map(([key, specification]) => readStable(projectRoot, key, specification)));
  for (const record of extraFixed) records[record.key] = record;

  const release = records.lessonReleases.document.releases.find(
    (item) => item.releaseId === RELEASE_ID,
  );
  assert.ok(release, `Missing release ${RELEASE_ID}`);

  const migrationRecords = await Promise.all(release.members.map(({ animationId }) =>
    readStable(projectRoot, memberKey(animationId, "migration"), {
      path: `migrations/${animationId}/migration.json`,
      kind: "json",
    }),
  ));
  for (const record of migrationRecords) records[record.key] = record;

  const memberSpecifications = [];
  for (const member of release.members) {
    const migration = records[memberKey(member.animationId, "migration")].document;
    assert.equal(migration.animationId, member.animationId);
    memberSpecifications.push(
      [memberKey(member.animationId, "coverage"), {
        path: `migrations/${member.animationId}/evidence/full-frame-coverage.json`,
        kind: "json",
      }],
      [memberKey(member.animationId, "audio"), {
        path: `migrations/${member.animationId}/audio-inventory.csv`,
        kind: "text",
      }],
      [memberKey(member.animationId, "checklist"), {
        path: `migrations/${member.animationId}/ACCEPTANCE_CHECKLIST.md`,
        kind: "text",
      }],
      [memberKey(member.animationId, "source-swf"), {
        path: migration.source.swf,
        kind: "binary",
      }],
    );
    if (migration.source.fla) {
      memberSpecifications.push([memberKey(member.animationId, "source-fla"), {
        path: migration.source.fla,
        kind: "binary",
      }]);
    }
  }
  const memberRemainder = await Promise.all(memberSpecifications.map(([key, specification]) =>
    readStable(projectRoot, key, specification),
  ));
  for (const record of memberRemainder) records[record.key] = record;

  const candidateSource = parseCandidateSource(records.engineeringCandidateTest.text);
  const candidateSpecifications = [
    ...candidateSource.modules.map((relativePath, index) => [
      `candidate:module:${String(index + 1).padStart(2, "0")}`,
      { path: relativePath, kind: "text" },
    ]),
    ...candidateSource.timelines.map((relativePath, index) => [
      `candidate:timeline:${String(index + 1).padStart(2, "0")}`,
      { path: relativePath, kind: "text" },
    ]),
  ];
  const candidateRecords = await Promise.all(candidateSpecifications.map(([key, specification]) =>
    readStable(projectRoot, key, specification),
  ));
  for (const record of candidateRecords) records[record.key] = record;

  return {
    projectRoot: path.resolve(projectRoot),
    records,
    releaseMemberIds: release.members.map(({ animationId }) => animationId),
    memberRecordKeys: [
      ...migrationRecords.map(({ key }) => key),
      ...memberRemainder.map(({ key }) => key),
    ],
    candidateModuleKeys: candidateRecords
      .filter(({ key }) => key.startsWith("candidate:module:"))
      .map(({ key }) => key),
    candidateTimelineKeys: candidateRecords
      .filter(({ key }) => key.startsWith("candidate:timeline:"))
      .map(({ key }) => key),
    candidateSource,
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const record of Object.values(snapshot.records)) {
    const reread = await readStable(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
    });
    assert.equal(reread.statIdentity, record.statIdentity,
      `${record.path} stat identity drifted`);
    assert.equal(reread.sha256, record.sha256, `${record.path} SHA-256 drifted`);
  }
}

function parseCsvRows(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  assert.equal(quoted, false, "Unterminated CSV quote");
  if (field || row.length) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  const header = rows.shift();
  assert.ok(header?.length, "CSV header is absent");
  return rows.filter((values) => values.some(Boolean)).map((values) => {
    assert.equal(values.length, header.length, "CSV column count drifted");
    return Object.fromEntries(header.map((name, index) => [name, values[index]]));
  });
}

function checkedCounts(markdown) {
  const matches = [...markdown.matchAll(/^\s*- \[([ xX])\]/gmu)];
  return {
    total: matches.length,
    checked: matches.filter((match) => match[1].toLowerCase() === "x").length,
  };
}

function reviewDecision(migration, field) {
  return String(migration.acceptance?.[field]?.decision ?? "missing").toLowerCase();
}

export function deriveContract(snapshot) {
  const rejected = deriveV2Contract(snapshot);
  const release = document(snapshot, "lessonReleases").releases.find(
    (item) => item.releaseId === RELEASE_ID,
  );
  assert.ok(release);

  const memberRecords = snapshot.memberRecordKeys.map((key) => snapshot.records[key]);
  const memberClosure = descriptorClosure(memberRecords);
  assert.equal(memberClosure.recordCount, 269);
  assert.equal(
    memberClosure.setSha256,
    "d47014d06d2e23f197c97ee8d8aae46c75106980645fad158066eb6fcc284319",
  );

  const moduleClosure = descriptorClosure(
    snapshot.candidateModuleKeys.map((key) => snapshot.records[key]),
  );
  const timelineClosure = descriptorClosure(
    snapshot.candidateTimelineKeys.map((key) => snapshot.records[key]),
  );
  assert.equal(moduleClosure.recordCount, 24);
  assert.equal(timelineClosure.recordCount, 24);
  assert.equal(
    moduleClosure.setSha256,
    "7489804dfaf22e7b582a4561820194cc5a525b245e88d1a9c981fdf6636ba199",
  );
  assert.equal(
    timelineClosure.setSha256,
    "3fac5d4516ac664ad326fcc46282a234bd897ede10453ff5000e4feebe3a64ad",
  );

  const totals = {
    migrations: 0,
    preservedMigrations: 0,
    flaApplicable: 0,
    swfOnly: 0,
    requirements: 0,
    frames: 0,
    rootRequirements: 0,
    rootFrames: 0,
    nestedRequirements: 0,
    nestedFrames: 0,
    enRequirements: 0,
    esRequirements: 0,
    authoritativeCapturedFrames: 0,
    metrics: 0,
    blockedRequirements: 0,
    unresolvedAuthorityRequirements: 0,
    noEffectRequirements: 0,
    checklistTotal: 0,
    checklistChecked: 0,
    audioRows: 0,
    audioUnd: 0,
    audioEs: 0,
    engineeringPending: 0,
    humanPending: 0,
    ownerPending: 0,
    formalRendererFieldsComplete: 0,
  };
  const domainPairs = new Set();
  const sourceMismatches = [];

  for (const member of release.members) {
    const animationId = member.animationId;
    const migration = document(snapshot, memberKey(animationId, "migration"));
    const coverage = document(snapshot, memberKey(animationId, "coverage"));
    const swf = snapshot.records[memberKey(animationId, "source-swf")];
    totals.migrations += 1;
    if (migration.status === "preserved") totals.preservedMigrations += 1;
    if (migration.source.fla) totals.flaApplicable += 1;
    else totals.swfOnly += 1;
    if (swf.sha256 !== migration.source.swfSha256 ||
        `swf-${swf.sha256}` !== member.assetId) sourceMismatches.push(animationId);
    if (migration.source.fla) {
      const fla = snapshot.records[memberKey(animationId, "source-fla")];
      if (fla.sha256 !== migration.source.flaSha256) sourceMismatches.push(animationId);
    }
    assert.equal(coverage.animationId, animationId);
    for (const requirement of coverage.requirements) {
      const frames = Number(requirement.requiredRange.lastFrame) -
        Number(requirement.requiredRange.firstFrame) + 1;
      totals.requirements += 1;
      totals.frames += frames;
      domainPairs.add(`${animationId}\0${requirement.frameDomainId}`);
      if (requirement.frameDomainId === "root") {
        totals.rootRequirements += 1;
        totals.rootFrames += frames;
      } else {
        totals.nestedRequirements += 1;
        totals.nestedFrames += frames;
      }
      if (requirement.language === "en") totals.enRequirements += 1;
      if (requirement.language === "es") totals.esRequirements += 1;
      totals.authoritativeCapturedFrames += Number(requirement.capturedFrameCount ?? 0);
      if (requirement.metricsFile && requirement.metricsSha256) totals.metrics += 1;
      if (requirement.status === "blocked") totals.blockedRequirements += 1;
      if (requirement.baselineAuthority === "unresolved") {
        totals.unresolvedAuthorityRequirements += 1;
      }
      if (requirement.strictAcceptanceEffect === "none") totals.noEffectRequirements += 1;
    }
    const checklist = checkedCounts(text(snapshot, memberKey(animationId, "checklist")));
    totals.checklistTotal += checklist.total;
    totals.checklistChecked += checklist.checked;
    const audioRows = parseCsvRows(text(snapshot, memberKey(animationId, "audio")));
    totals.audioRows += audioRows.length;
    totals.audioUnd += audioRows.filter(({ language }) => language === "und").length;
    totals.audioEs += audioRows.filter(({ language }) => language === "es").length;
    if (reviewDecision(migration, "engineeringReview") === "pending") {
      totals.engineeringPending += 1;
    }
    if (reviewDecision(migration, "humanVisualReview") === "pending") {
      totals.humanPending += 1;
    }
    if (reviewDecision(migration, "ownerReview") === "pending") totals.ownerPending += 1;
    const implementation = migration.implementation ?? {};
    if ([
      implementation.route,
      implementation.routeFile,
      implementation.component,
      implementation.registryModule,
      implementation.timelineModule,
      implementation.testFile,
    ].every((value) => typeof value === "string" && value.length > 0)) {
      totals.formalRendererFieldsComplete += 1;
    }
  }

  assert.deepEqual(totals, {
    migrations: 47,
    preservedMigrations: 47,
    flaApplicable: 34,
    swfOnly: 13,
    requirements: 520,
    frames: 44488,
    rootRequirements: 94,
    rootFrames: 1020,
    nestedRequirements: 426,
    nestedFrames: 43468,
    enRequirements: 260,
    esRequirements: 260,
    authoritativeCapturedFrames: 0,
    metrics: 0,
    blockedRequirements: 520,
    unresolvedAuthorityRequirements: 520,
    noEffectRequirements: 520,
    checklistTotal: 2726,
    checklistChecked: 0,
    audioRows: 245,
    audioUnd: 203,
    audioEs: 42,
    engineeringPending: 47,
    humanPending: 47,
    ownerPending: 47,
    formalRendererFieldsComplete: 0,
  });
  assert.equal(domainPairs.size, 260);
  assert.deepEqual(sourceMismatches, []);

  const candidateCount = snapshot.candidateSource.candidateIds.length;
  const candidateFrames = snapshot.candidateSource.frameCounts.reduce(
    (sum, count) => sum + count,
    0,
  );
  assert.equal(candidateCount, 24);
  assert.equal(candidateFrames, 6260);
  const registryKeys = [
    "prototypeRegistry",
    "generatedRegistry",
    "prototypeManifest",
    "wholeLessonRegistry",
  ];
  const registryReferences = [];
  for (const key of registryKeys) {
    const source = text(snapshot, key);
    for (const candidateId of snapshot.candidateSource.candidateIds) {
      if (source.includes(candidateId)) registryReferences.push({ key, candidateId });
    }
  }
  assert.deepEqual(registryReferences, []);

  const report = structuredClone(rejected);
  report.schemaVersion = 3;
  report.status = "fail-closed-template-not-stable";
  report.templateStable = false;
  report.successorOf = recordBinding(snapshot.records.rejectedV2Json);
  report.predecessorDisposition = {
    v2: {
      status: "rejected-p1-live-currentness-closure-incomplete",
      preserved: true,
      findings: [
        "dated continuation reported 8 engineering candidates and 3,928 frames while live closure has 24 and 6,260",
        "47-member migration, coverage, checklist, audio, SWF, FLA, module, timeline, and registry inputs were not dynamically bound",
      ],
      artifacts: {
        generator: recordBinding(snapshot.records.rejectedV2Generator),
        tests: recordBinding(snapshot.records.rejectedV2Tests),
        json: recordBinding(snapshot.records.rejectedV2Json),
        markdown: recordBinding(snapshot.records.rejectedV2Markdown),
      },
      acceptanceEffect: "none",
    },
    v1: rejected.dispositionOfV1,
  };
  delete report.dispositionOfV1;

  report.evidenceEpochClosure.writerAttribution = {
    status: "attributed-and-stopped",
    taskId: "019fc03e-a691-7553-98a6-195a74688d81",
    title: "继续完成 L10 正式迁移",
    taskStatusAtAttribution: "systemError",
    latestTurnStatus: "completed",
    childAgentStatusAfterCoordination: "stopped-or-completed",
    subsequentObservation: "idle-and-quiescent-before-v2-write",
    metadataAcceptanceEffect: "none",
  };
  report.evidenceEpochClosure.boundedQuiescenceObservation.observationTiming =
    "pre-v2-script-and-report-write-historical-observation";
  report.evidenceEpochClosure.rule =
    "Writer metadata and the historical A/B observation establish provenance only. Current v3 --check currentness comes from the dynamic SHA-256 input closures below; neither creates migration or acceptance evidence.";

  report.liveWholeLessonClosure = {
    status: "current-and-dynamically-bound",
    memberLevel: memberClosure,
    sourceIdentityMismatchCount: sourceMismatches.length,
    migrationStatus: {
      preserved: totals.preservedMigrations,
      required: totals.migrations,
    },
    bilingualRequirementCount: {
      en: totals.enRequirements,
      es: totals.esRequirements,
    },
    memberFrameDomainPairCount: domainPairs.size,
    requirementState: {
      total: totals.requirements,
      blocked: totals.blockedRequirements,
      baselineAuthorityUnresolved: totals.unresolvedAuthorityRequirements,
      strictAcceptanceEffectNone: totals.noEffectRequirements,
    },
    checklist: { checked: totals.checklistChecked, total: totals.checklistTotal },
    audioInventory: {
      totalRows: totals.audioRows,
      undRows: totals.audioUnd,
      esRows: totals.audioEs,
      formalListeningAcceptanceEffect: "none",
    },
    candidateCode: {
      candidateTest: recordBinding(snapshot.records.engineeringCandidateTest),
      candidateCount,
      declaredFrameCount: candidateFrames,
      moduleClosure,
      timelineClosure,
      registryBindings: Object.fromEntries(registryKeys.map((key) =>
        [key, recordBinding(snapshot.records[key])])),
      registryReferenceCount: registryReferences.length,
      formalRegistrationEffect: "none",
    },
  };

  report.currentFormalState.authoring = {
    flaApplicable: totals.flaApplicable,
    swfOnlyFlaAuthoringAuditNotApplicable: totals.swfOnly,
    verified: 0,
    pending: totals.flaApplicable,
    swfOnlyBoundary:
      "The 13 SWF-only members are not applicable only to the FLA/Adobe Animate authoring-audit subgate; all 13 still require SWF audit, original-runtime capture, behavior, visual/RMSE, audio, human/engineering/owner review, strict completion, and release gates.",
  };
  report.currentFormalState.requirements = {
    total: totals.requirements,
    rootReady: totals.rootRequirements,
    unresolvedNested: totals.nestedRequirements,
    naturalScheduleReady: 0,
    unresolvedFrameDomainDispositions: 74,
    memberFrameDomainPairs: domainPairs.size,
    en: totals.enRequirements,
    es: totals.esRequirements,
  };
  report.currentFormalState.frameObligations = {
    total: totals.frames,
    root: totals.rootFrames,
    nested: totals.nestedFrames,
    authoritativeCaptured: totals.authoritativeCapturedFrames,
  };
  report.currentFormalState.javascript = {
    engineeringCandidateCount: candidateCount,
    registeredCandidateCount: registryReferences.length,
    localCandidateFrameCount: candidateFrames,
    boundDiagnosticFrameCount: 210,
    registeredFormalRendererCount: 0,
    formalRendererFieldsComplete: totals.formalRendererFieldsComplete,
    diagnosticFormalEffect: 0,
    datedV2ContinuationCandidateSnapshot: {
      candidates: 8,
      frames: 3928,
      disposition: "superseded-by-live-candidate-closure",
    },
  };
  report.currentFormalState.reviewAndRelease = {
    rmseAcceptedRequirements: totals.metrics,
    rmseRequiredRequirements: totals.requirements,
    listeningAcceptedMembers: 0,
    humanAcceptedMembers: 0,
    engineeringAcceptedMembers: 0,
    ownerAcceptedMembers: 0,
    humanPendingMembers: totals.humanPending,
    engineeringPendingMembers: totals.engineeringPending,
    ownerPendingMembers: totals.ownerPending,
    checklistChecked: totals.checklistChecked,
    checklistTotal: totals.checklistTotal,
    strictCompleteMembers: 0,
    completionLedgerEntries: 0,
    published: false,
  };
  const rendererGate = report.gates.find(({ id }) => id === "renderer");
  rendererGate.current = {
    engineeringCandidates: candidateCount,
    localCandidateFrames: candidateFrames,
    registeredFormalRenderers: 0,
    formalRendererFieldsComplete: 0,
    boundDiagnosticFrames: 210,
  };
  rendererGate.blocker =
    "Twenty-four source-static engineering candidates are unregistered, fixed-English/inert diagnostics and have zero formal renderer or acceptance effect.";

  report.nextNamedHumanAction = {
    role: "named authorized Adobe Animate/original-runtime operator",
    currentlyAuthorized: false,
    blockedByDownstreamTransactionP0: true,
    requiresP0FixAndIndependentReview: true,
    requiresNewQuiescentPreflight: true,
    action:
      "After the downstream P0 is fixed and independently reviewed, authorize one named operator and an approved disposable offline environment for the exact 94 hash-bound EN/ES root kits; run a fresh quiescent preflight and finalize the hash-bound source-open/pre-frame launch receipt before the first capture.",
    reason:
      "Original-runtime baseline, bilingual/audio listening, visual review, renderer validation, RMSE, and downstream acceptance gates cannot truthfully advance from machine-only evidence.",
    cannotBeAutomated: true,
  };
  report.acceptanceEffects = Object.fromEntries(EFFECT_KEYS.map((key) => [key, false]));
  report.inputBindings = Object.fromEntries(Object.keys(snapshot.records).sort()
    .map((key) => [key, recordBinding(snapshot.records[key])]));
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 3);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.predecessorDisposition.v2.status,
    "rejected-p1-live-currentness-closure-incomplete");
  assert.equal(report.predecessorDisposition.v2.preserved, true);
  assert.equal(report.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(report.liveWholeLessonClosure.memberLevel.setSha256,
    "d47014d06d2e23f197c97ee8d8aae46c75106980645fad158066eb6fcc284319");
  assert.equal(report.liveWholeLessonClosure.candidateCode.candidateCount, 24);
  assert.equal(report.liveWholeLessonClosure.candidateCode.declaredFrameCount, 6260);
  assert.equal(report.liveWholeLessonClosure.candidateCode.registryReferenceCount, 0);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.frameObligations.total, 44488);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.checklistChecked, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.checklistTotal, 2726);
  assert.equal(report.currentFormalState.javascript.registeredFormalRendererCount, 0);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.requiresP0FixAndIndependentReview, true);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.gates.filter(({ satisfied }) => satisfied).length, 1);
  assert.ok(report.gates.every(({ acceptanceEffect }) => acceptanceEffect === "none"));
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const rows = report.gates.map((item) =>
    `| ${item.id} | ${item.status} | ${item.satisfied ? "yes" : "no"} | ${item.blocker} |`,
  ).join("\n");
  const bindings = Object.values(report.inputBindings).map((item) =>
    `| \`${item.path}\` | ${item.bytes} | \`${item.sha256}\` | \`${item.mode}\` |`,
  ).join("\n");
  const closure = report.liveWholeLessonClosure;

  return `# Grade 4 Lesson 10 complete-migration template contract v3

Evidence date: **${report.evidenceDate}**  
Status: **${report.status}**  
Template stable: **${report.templateStable}**  
Fingerprint: \`${report.reportFingerprintSha256}\`

## Outcome

V3 is the live-currentness successor. The earlier v2 is preserved but rejected for two P1 omissions: it inherited an 8-candidate/3,928-frame dated snapshot instead of the live 24-candidate/6,260-frame code closure, and it did not dynamically bind the 47 member-level migration/evidence/source sets or the product registries.

V3 now binds **${closure.memberLevel.recordCount} member-level records** with closure SHA-256 \`${closure.memberLevel.setSha256}\`: 47 migration manifests, 47 full-frame coverage files, 47 checklists, 47 audio inventories, 47 SWFs, and 34 FLAs. It also binds 24 module files, 24 timeline files, the candidate test, and four registries. Any later bound-file SHA drift makes \`--check\` fail.

The decision remains fail-closed: **0/44,488 authoritative frames**, **0/520 RMSE results**, **0/47 formal renderer fields complete**, **0/24 candidates registered**, **0/2,726 checklist items checked**, **0/47 human/engineering/owner approvals**, **0/47 strict-complete members**, and **unpublished**. Therefore L10 is not stable and no Grade 4 production batch is admitted.

## Live whole-lesson recomputation

- Members: 47 (46 pages + 1 shell); 47/47 migration status \`preserved\`; source identity mismatches: 0.
- Authoring: 34 FLA-applicable and pending; 13 SWF-only are N/A **only** to the FLA/Animate authoring-audit subgate. All 13 retain every SWF runtime, behavior, visual/RMSE, audio, review, strict, and release obligation.
- Requirements: 520 = 94 root + 426 nested; 260 member/domain pairs; EN 260 + ES 260; all 520 blocked, baseline authority unresolved, and strict effect \`none\`.
- Frames: 44,488 = 1,020 root + 43,468 nested; authoritative captured frames 0.
- Audio inventories: 245 rows = 203 \`und\` + 42 \`es\`; formal listening/audio acceptance 0. Separately, the Grade 4 course still lacks 16 SHA-unresolved MP3s (L2 14, L6 1, L8 1; L10 0).
- Current JavaScript: 24 source-static engineering candidates / 6,260 declared candidate frames; module closure \`${closure.candidateCode.moduleClosure.setSha256}\`; timeline closure \`${closure.candidateCode.timelineClosure.setSha256}\`; registry references 0. The two separately bound browser diagnostics contain 210 captures and formal effect 0.
- Ruffle: 94 forensic observations, original-runtime authority false, acceptance effect none.

## Evidence epoch and failed-attempt preservation

The attributed writer was task \`${report.evidenceEpochClosure.writerAttribution.taskId}\` (${report.evidenceEpochClosure.writerAttribution.title}); task status was ${report.evidenceEpochClosure.writerAttribution.taskStatusAtAttribution}, latest turn ${report.evidenceEpochClosure.writerAttribution.latestTurnStatus}, then idle/quiescent. This metadata has acceptance effect none.

The \`${report.evidenceEpochClosure.boundedQuiescenceObservation.setSha256}\` A/B digest is explicitly a historical pre-v2-write observation, not the current v3 tree digest. Currentness is enforced by the dynamic v3 input bindings. V1 and rejected v2 remain preserved byte-for-byte.

## Gate matrix

| Gate | Status | Satisfied | Blocker |
|---|---:|---:|---|
${rows}

Only source custody is satisfied, with source-custody-only effect. Every other gate is closed.

## Downstream P0 and named human boundary

Decision: **DO_NOT_APPLY**. The bound downstream transaction must not run in \`--apply\`, \`--dry-run\`, or \`--check\` because its pathname deletion, pathname write, and recursive pathname cleanup P0s remain. It first needs descriptor-relative creation, persistent no-delete custody, removal of recursive pathname cleanup, adversarial tests, and independent review.

The named original-runtime operator is **not currently authorized**. Only after the P0 fix/review may the owner authorize one named operator plus an approved disposable offline environment, run a fresh quiescent preflight, and finalize the source-open/pre-frame receipt before capture. This cannot be automated.

## Acceptance effects

All 16 acceptance/publication effects are \`false\`. V3 is a read-only currentness and gate contract, not a baseline, renderer, RMSE result, listening/human/owner decision, strict completion, lesson release, whole-course integration, or publication authority.

## Bound inputs

| Path | Bytes | SHA-256 | Mode |
|---|---:|---|---:|
${bindings}
`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents, `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, { flag: "wx", mode: 0o644 });
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  await assertSnapshotUnchanged(snapshot);
  const jsonPath = resolveInsideRoot(projectRoot, REPORT_JSON);
  const markdownPath = resolveInsideRoot(projectRoot, REPORT_MARKDOWN);
  if (mode === "--write") {
    const dispositions = [
      await writeNoClobber(jsonPath, json),
      await writeNoClobber(markdownPath, markdown),
    ];
    await assertSnapshotUnchanged(snapshot);
    return { mode, report, written: [REPORT_JSON, REPORT_MARKDOWN], dispositions };
  }
  assert.equal(await readFile(jsonPath, "utf8"), json, `${REPORT_JSON} is stale`);
  assert.equal(await readFile(markdownPath, "utf8"), markdown,
    `${REPORT_MARKDOWN} is stale`);
  await assertSnapshotUnchanged(snapshot);
  return { mode, report, checked: [REPORT_JSON, REPORT_MARKDOWN] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_JSON} and ${REPORT_MARKDOWN}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
