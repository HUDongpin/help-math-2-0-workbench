import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  createG5L5StaticCompositeProofResolver,
  validateG5L5ProofBoundFrameDomainDisposition,
} from "./g5-l5-proof-bound-frame-domain-disposition.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function readMemberInputs(animationId) {
  const workspace = path.join(projectRoot, "migrations", animationId);
  const [dispositionText, scenarioText, releaseText] = await Promise.all([
    readFile(
      path.join(workspace, "audit/frame-domain-disposition.json"),
      "utf8",
    ),
    readFile(
      path.join(workspace, "audit/scenario-inventory.json"),
      "utf8",
    ),
    readFile(
      path.join(projectRoot, "catalog/lesson-releases.json"),
      "utf8",
    ),
  ]);
  const release = JSON.parse(releaseText).releases.find(
    ({releaseId}) =>
      releaseId ===
      "lesson-g05-l05-add-subtract-negative-numbers",
  );
  return {
    disposition: JSON.parse(dispositionText),
    member: release.members.find(
      (candidate) => candidate.animationId === animationId,
    ),
    scenarioSha256: createHash("sha256")
      .update(scenarioText)
      .digest("hex"),
  };
}

test("accepts only the exact proof-bound composite partition", async () => {
  const animationId = "shell-course-g05-l05-index-local";
  const inputs = await readMemberInputs(animationId);
  const facts = await validateG5L5ProofBoundFrameDomainDisposition({
    ...inputs,
    resolveStaticCompositeProof:
      createG5L5StaticCompositeProofResolver({projectRoot}),
  });
  assert.deepEqual(
    [
      facts.reachableChildTimelineCount,
      facts.evidenceBoundCompositeChildCount,
      facts.unresolvedChildCount,
      facts.excludedNotProvenTimelineCount,
    ],
    [94, 60, 34, 98],
  );
  assert.equal(
    facts.staticEvidenceBinding.path,
    `migrations/${animationId}/audit/` +
      "static-frame-domain-disposition-evidence.json",
  );
});

test("rejects composite dispositions when no exact proof is supplied", async () => {
  const animationId = "shell-course-g05-l05-index-local";
  const inputs = await readMemberInputs(animationId);
  await assert.rejects(
    validateG5L5ProofBoundFrameDomainDisposition({
      ...inputs,
      resolveStaticCompositeProof: async () => null,
    }),
    /lack the exact trusted static proof binding/,
  );
});

test("zero-composite members remain unresolved without a proof binding", async () => {
  const animationId = "course-g05-l05-rw-002";
  const inputs = await readMemberInputs(animationId);
  const facts = await validateG5L5ProofBoundFrameDomainDisposition({
    ...inputs,
    resolveStaticCompositeProof: async () => {
      throw new Error("zero-composite members must not request proof");
    },
  });
  assert.deepEqual(
    [
      facts.reachableChildTimelineCount,
      facts.evidenceBoundCompositeChildCount,
      facts.unresolvedChildCount,
      facts.excludedNotProvenTimelineCount,
      facts.staticEvidenceBinding,
    ],
    [3, 0, 3, 0, null],
  );
});

test("rejects tampered trusted release member and source bindings", async () => {
  const animationId = "shell-course-g05-l05-index-local";
  const inputs = await readMemberInputs(animationId);
  const mutations = [
    (disposition) => {
      disposition.generatedFrom.lessonReleaseCatalog
        .releaseFingerprintSha256 = "0".repeat(64);
    },
    (disposition) => {
      disposition.generatedFrom.lessonReleaseCatalog.member.ordinal = 1;
    },
    (disposition) => {
      disposition.generatedFrom.lessonReleaseCatalog.member.releaseRole =
        "unexpected-extra-projection-field";
    },
    (disposition) => {
      disposition.generatedFrom.sourceSwf.sha256 = "0".repeat(64);
    },
  ];
  for (const mutate of mutations) {
    const disposition = structuredClone(inputs.disposition);
    mutate(disposition);
    await assert.rejects(
      validateG5L5ProofBoundFrameDomainDisposition({
        ...inputs,
        disposition,
        resolveStaticCompositeProof:
          createG5L5StaticCompositeProofResolver({projectRoot}),
      }),
      /release\/source identity/,
    );
  }
});
