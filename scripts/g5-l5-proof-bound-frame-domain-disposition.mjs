import path from "node:path";

import {
  buildG5L5StaticFrameDomainDispositionEvidence,
} from "./build-g5-l5-static-frame-domain-disposition-evidence.mjs";
import {
  STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
} from "./build-static-frame-domain-disposition-evidence.mjs";

const DISPOSITION_KEYS = Object.freeze([
  "composite-child-with-parent",
  "declared-frame-domain",
  "independent-required",
  "nonvisual",
  "unresolved",
]);
const G5_L5_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
const G5_L5_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const G5_L5_ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sorted(values) {
  return [...values].sort((left, right) =>
    String(left).localeCompare(String(right), "en"));
}

function sameValues(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

export function createG5L5StaticCompositeProofResolver({
  projectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  evidenceBuilder = buildG5L5StaticFrameDomainDispositionEvidence,
} = {}) {
  invariant(
    typeof projectRoot === "string" && projectRoot.length > 0,
    "G5 L5 static-composite proof resolver requires a project root",
  );
  let proofIndexPromise;
  return async function resolveStaticCompositeProof(animationId) {
    if (!proofIndexPromise) {
      proofIndexPromise = evidenceBuilder({
        projectRoot,
        migrationsRoot,
        check: true,
        allowFullSelection: true,
      }).then((results) => {
        invariant(
          Array.isArray(results) &&
            results.length === 28 &&
            results.reduce(
              (total, result) => total + result.document.claims.length,
              0,
            ) === 696,
          "G5 L5 static-composite proof index is not the exact 28-member / 696-claim set",
        );
        return new Map(results.map((result) => [result.animationId, result]));
      });
    }
    return (await proofIndexPromise).get(animationId) ?? null;
  };
}

export async function validateG5L5ProofBoundFrameDomainDisposition({
  disposition,
  member,
  scenarioSha256,
  resolveStaticCompositeProof,
}) {
  const id = member?.animationId || disposition?.animationId || "unknown";
  const counts = disposition?.summary?.dispositionCounts;
  const timelines = disposition?.timelines;
  const releaseBinding =
    disposition?.generatedFrom?.lessonReleaseCatalog;
  const memberBinding = releaseBinding?.member;
  const sourceBinding = disposition?.generatedFrom?.sourceSwf;
  invariant(
    disposition?.schemaVersion === 1 &&
      disposition.animationId === member?.animationId &&
      releaseBinding?.releaseId === G5_L5_RELEASE_ID &&
      releaseBinding.path === "catalog/lesson-releases.json" &&
      Number.isSafeInteger(releaseBinding.bytes) &&
      releaseBinding.bytes > 0 &&
      SHA256.test(releaseBinding.sha256 || "") &&
      releaseBinding.schemaVersion === 1 &&
      releaseBinding.releaseFingerprintSha256 ===
        G5_L5_RELEASE_FINGERPRINT_SHA256 &&
      releaseBinding.orderedMemberIdentitySha256 ===
        G5_L5_ORDERED_MEMBER_IDENTITY_SHA256 &&
      releaseBinding.bindingStatus ===
        "verified-exact-release-member" &&
      sameValues(Object.keys(memberBinding || {}), [
        "animationId",
        "assetId",
        "ordinal",
        "shardId",
        "sourcePath",
        "sourceSha256",
      ]) &&
      memberBinding?.animationId === member.animationId &&
      memberBinding.ordinal === member.ordinal &&
      memberBinding.shardId === member.shardId &&
      memberBinding.assetId === member.assetId &&
      memberBinding.sourcePath === member.source?.path &&
      memberBinding.sourceSha256 === member.source?.sha256 &&
      sourceBinding?.path ===
        `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source?.path}` &&
      sourceBinding.sha256 === member.source?.sha256 &&
      disposition.status ===
        "structurally-enumerated-dispositions-unresolved" &&
      disposition.migrationStatusChanged === false &&
      disposition.generatedFrom?.scenarioInventory?.path ===
        "audit/scenario-inventory.json" &&
      disposition.generatedFrom.scenarioInventory.sha256 === scenarioSha256 &&
      Array.isArray(timelines) &&
      timelines[0]?.timelineId === "root" &&
      timelines.length === disposition.summary?.enumeratedTimelineCount &&
      disposition.summary.enumeratedTimelineCount +
          disposition.summary.excludedNotProvenTimelineCount ===
        disposition.summary.inventoryTimelineCount &&
      typeof disposition.strictAcceptanceEffect === "string" &&
      disposition.strictAcceptanceEffect.startsWith("none;"),
    `${id}: frame-domain disposition release/source identity, inventory, or authority drifted`,
  );
  invariant(
    counts &&
      sameValues(Object.keys(counts), DISPOSITION_KEYS) &&
      Object.values(counts).every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      ) &&
      counts["declared-frame-domain"] === 1 &&
      counts["independent-required"] === 0 &&
      counts.nonvisual === 0 &&
      counts.unresolved > 0 &&
      counts["composite-child-with-parent"] + counts.unresolved ===
        disposition.summary.reachableChildTimelineCount &&
      disposition.summary.enumeratedTimelineCount ===
        disposition.summary.reachableChildTimelineCount + 1,
    `${id}: frame-domain disposition is not the fail-closed composite/unresolved partition`,
  );
  for (const key of DISPOSITION_KEYS) {
    invariant(
      timelines.filter(({disposition: value}) => value === key).length ===
        counts[key],
      `${id}: frame-domain disposition ${key} count does not match its timeline set`,
    );
  }

  const composites = timelines.filter(
    ({disposition: value}) => value === "composite-child-with-parent",
  );
  const generatedEvidence =
    disposition.generatedFrom.staticDispositionEvidence;
  if (composites.length === 0) {
    invariant(
      generatedEvidence === undefined &&
        timelines.every(
          ({staticCompositeEvidence}) =>
            staticCompositeEvidence === undefined,
        ),
      `${id}: zero-composite disposition contains an unsupported static proof binding`,
    );
    return {
      reachableChildTimelineCount:
        disposition.summary.reachableChildTimelineCount,
      evidenceBoundCompositeChildCount: 0,
      unresolvedChildCount: counts.unresolved,
      excludedNotProvenTimelineCount:
        disposition.summary.excludedNotProvenTimelineCount,
      staticEvidenceBinding: null,
    };
  }

  invariant(
    typeof resolveStaticCompositeProof === "function",
    `${id}: composite dispositions require the trusted G5 L5 static proof resolver`,
  );
  const proof = await resolveStaticCompositeProof(id);
  const claimIds = proof?.document?.claims?.map(({timelineId}) => timelineId);
  const compositeIds = composites.map(({timelineId}) => timelineId);
  invariant(
    proof?.animationId === id &&
      proof.document?.schemaVersion === 2 &&
      proof.document.evidenceType ===
        "static-frame-domain-disposition-evidence" &&
      proof.document.status === "verified-static-composite-claims" &&
      proof.document.migrationStatusChanged === false &&
      proof.document.claims.length === composites.length &&
      sameValues(claimIds, compositeIds) &&
      generatedEvidence?.path ===
        STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH &&
      generatedEvidence.sha256 === proof.sha256 &&
      generatedEvidence.schemaVersion === 2 &&
      generatedEvidence.status === "verified-static-composite-claims" &&
      generatedEvidence.claimCount === composites.length &&
      generatedEvidence.bindingStatus === "verified-and-rebuilt",
    `${id}: composite dispositions lack the exact trusted static proof binding`,
  );

  const usedClaimIndexes = [];
  for (const timeline of composites) {
    const binding = timeline.staticCompositeEvidence;
    const claim = proof.document.claims?.[binding?.claimIndex];
    invariant(
      binding?.evidencePath ===
          STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH &&
        binding.evidenceSha256 === proof.sha256 &&
        Number.isSafeInteger(binding.claimIndex) &&
        binding.claimIndex >= 0 &&
        claim?.timelineId === timeline.timelineId &&
        claim.sourceObjectId === timeline.sourceObjectId &&
        claim.frameCount === timeline.frameCount &&
        claim.frameCount === 1 &&
        claim.disposition === "composite-child-with-parent" &&
        claim.role === binding.role &&
        claim.claimScope === binding.claimScope &&
        claim.role === "single-frame-scriptless-structural-child" &&
        claim.claimScope === "independent-local-playhead-only",
      `${id}/${timeline.timelineId}: composite disposition is not bound to its exact trusted proof claim`,
    );
    usedClaimIndexes.push(binding.claimIndex);
  }
  invariant(
    new Set(usedClaimIndexes).size === composites.length &&
      usedClaimIndexes.every(
        (index) => index >= 0 && index < composites.length,
      ),
    `${id}: composite disposition proof claims are missing, duplicated, or out of range`,
  );

  return {
    reachableChildTimelineCount:
      disposition.summary.reachableChildTimelineCount,
    evidenceBoundCompositeChildCount: composites.length,
    unresolvedChildCount: counts.unresolved,
    excludedNotProvenTimelineCount:
      disposition.summary.excludedNotProvenTimelineCount,
    staticEvidenceBinding: {
      path:
        `migrations/${id}/${STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH}`,
      bytes: Buffer.byteLength(proof.rendered),
      sha256: proof.sha256,
      schemaVersion: proof.document.schemaVersion,
      status: proof.document.status,
      claimCount: proof.document.claims.length,
    },
  };
}
