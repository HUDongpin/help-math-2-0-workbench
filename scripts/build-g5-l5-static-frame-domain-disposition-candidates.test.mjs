import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L5_STATIC_CANDIDATE_OUTPUTS,
  buildG5L5StaticFrameDomainDispositionCandidates,
  commitCandidateOutputs,
  finalizeReportFingerprint,
  parseG5L5StaticFrameDomainCandidateArguments,
  readNoFollowRecord,
  validateG5L5StaticFrameDomainDispositionCandidateShape,
  validateG5L5StaticFrameDomainDispositionCandidates,
} from "./build-g5-l5-static-frame-domain-disposition-candidates.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const builtPromise =
  buildG5L5StaticFrameDomainDispositionCandidates({projectRoot});

function clone(value) {
  return structuredClone(value);
}

async function temporaryProject() {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-candidate-"),
  );
  await mkdir(path.join(root, "reports"));
  await writeFile(path.join(root, "bound-input.txt"), "trusted input\n");
  const input = await readNoFollowRecord(
    root,
    "bound-input.txt",
    "test bound input",
  );
  return {
    root,
    inputRecords: [{
      path: input.path,
      bytes: input.bytes,
      sha256: input.sha256,
      signature: input.signature,
    }],
  };
}

function fixtureOutputs(prefix = "candidate") {
  return new Map([
    [
      G5_L5_STATIC_CANDIDATE_OUTPUTS[0],
      Buffer.from(`{"fixture":"${prefix}"}\n`),
    ],
    [
      G5_L5_STATIC_CANDIDATE_OUTPUTS[1],
      Buffer.from(`# ${prefix}\n`),
    ],
  ]);
}

test("builds the exact 57-member acceptance-neutral static candidate census", async () => {
  const {report} = await builtPromise;
  assert.deepEqual(report.summary, {
    memberCount: 57,
    reachableChildren: 1047,
    oneFrame: 744,
    oneFrameEligible: 696,
    oneFrameExcluded: 48,
    multiFrame: 303,
    multiFrameEligible: 0,
    multiFrameExcluded: 303,
    nonReachableDefinitions: 185,
    multiFrameCandidateGroupCount: 0,
    frameDomainDispositionMutationCount: 0,
    canonicalWorkspaceMutationCount: 0,
  });
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true,
  );
  assert.equal(
    Object.values(report.protectedMutationCounts)
      .every((value) => value === 0),
    true,
  );
  assert.equal(
    await validateG5L5StaticFrameDomainDispositionCandidates(report, {
      projectRoot,
    }),
    true,
  );
});

test("trusted validation rejects a forged descriptor even after re-signing", async () => {
  const {report} = await builtPromise;
  const forged = clone(report);
  forged.generatedBy.proofEngine.sha256 = "0".repeat(64);
  const resigned = finalizeReportFingerprint(forged);
  assert.equal(
    validateG5L5StaticFrameDomainDispositionCandidateShape(resigned),
    true,
  );
  await assert.rejects(
    validateG5L5StaticFrameDomainDispositionCandidates(resigned, {
      projectRoot,
    }),
    /differs from the trusted current physical release/,
  );
});

test("semantic validation rejects acceptance and proof promotion after re-signing", async () => {
  const {report} = await builtPromise;
  const promoted = clone(report);
  promoted.acceptanceEffects.frameDomainDispositionEstablished = true;
  assert.throws(
    () => validateG5L5StaticFrameDomainDispositionCandidateShape(
      finalizeReportFingerprint(promoted),
    ),
    /acceptance effect must remain false/,
  );

  const weakened = clone(report);
  const member = weakened.members.find(
    ({oneFrame}) => oneFrame.eligibleCandidates.length > 0,
  );
  member.oneFrame.eligibleCandidates[0]
    .sourceProof.directDoActionTagCount = 1;
  assert.throws(
    () => validateG5L5StaticFrameDomainDispositionCandidateShape(
      finalizeReportFingerprint(weakened),
    ),
    /directDoActionTagCount must be zero/,
  );
});

test("CLI and writer reject output-path expansion beyond the fixed allowlist", async () => {
  assert.throws(
    () => parseG5L5StaticFrameDomainCandidateArguments([
      "--apply",
      "--output-prefix",
      "../escape",
    ]),
    /Unknown argument/,
  );
  const fixture = await temporaryProject();
  try {
    const outputs = fixtureOutputs();
    outputs.delete(G5_L5_STATIC_CANDIDATE_OUTPUTS[1]);
    outputs.set("../escape.md", Buffer.from("escape\n"));
    await assert.rejects(
      commitCandidateOutputs({
        projectRoot: fixture.root,
        outputs,
        inputRecords: fixture.inputRecords,
      }),
      /fixed two-output allowlist/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("writer rejects linked output targets without following them", async () => {
  const fixture = await temporaryProject();
  const outside = path.join(fixture.root, "outside.json");
  try {
    await writeFile(outside, "outside\n");
    await symlink(
      outside,
      path.join(fixture.root, G5_L5_STATIC_CANDIDATE_OUTPUTS[0]),
    );
    await assert.rejects(
      commitCandidateOutputs({
        projectRoot: fixture.root,
        outputs: fixtureOutputs(),
        inputRecords: fixture.inputRecords,
      }),
      /expected one ordinary non-linked file/,
    );
    assert.equal(await readFile(outside, "utf8"), "outside\n");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("input drift aborts before install and removes staged temporary files", async () => {
  const fixture = await temporaryProject();
  try {
    await assert.rejects(
      commitCandidateOutputs({
        projectRoot: fixture.root,
        outputs: fixtureOutputs(),
        inputRecords: fixture.inputRecords,
        hooks: {
          afterTempsWritten: async () => {
            await writeFile(
              path.join(fixture.root, "bound-input.txt"),
              "mutated input\n",
            );
          },
        },
      }),
      /bound input changed after report construction/,
    );
    for (const relativePath of G5_L5_STATIC_CANDIDATE_OUTPUTS) {
      await assert.rejects(
        readFile(path.join(fixture.root, relativePath)),
        {code: "ENOENT"},
      );
    }
    assert.deepEqual(await readdir(path.join(fixture.root, "reports")), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("two-output transaction restores both prior files after first-install failure", async () => {
  const fixture = await temporaryProject();
  try {
    const original = fixtureOutputs("original");
    await commitCandidateOutputs({
      projectRoot: fixture.root,
      outputs: original,
      inputRecords: fixture.inputRecords,
    });
    await assert.rejects(
      commitCandidateOutputs({
        projectRoot: fixture.root,
        outputs: fixtureOutputs("replacement"),
        inputRecords: fixture.inputRecords,
        hooks: {
          afterFirstInstall: async () => {
            throw new Error("injected first-install failure");
          },
        },
      }),
      /injected first-install failure/,
    );
    for (const relativePath of G5_L5_STATIC_CANDIDATE_OUTPUTS) {
      assert.deepEqual(
        await readFile(path.join(fixture.root, relativePath)),
        original.get(relativePath),
      );
    }
    assert.deepEqual(
      (await readdir(path.join(fixture.root, "reports")))
        .sort(),
      G5_L5_STATIC_CANDIDATE_OUTPUTS
        .map((relativePath) => path.basename(relativePath))
        .sort(),
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("second-target CAS preserves foreign bytes, restores the first prior, and leaves no residue", async () => {
  const fixture = await temporaryProject();
  try {
    const original = fixtureOutputs("original-cas");
    await commitCandidateOutputs({
      projectRoot: fixture.root,
      outputs: original,
      inputRecords: fixture.inputRecords,
    });
    const foreign = Buffer.from("# foreign-second-target\n");
    const secondPath = path.join(
      fixture.root,
      G5_L5_STATIC_CANDIDATE_OUTPUTS[1],
    );
    await assert.rejects(
      commitCandidateOutputs({
        projectRoot: fixture.root,
        outputs: fixtureOutputs("replacement-cas"),
        inputRecords: fixture.inputRecords,
        hooks: {
          afterFirstInstall: async () => {
            await writeFile(secondPath, foreign);
          },
        },
      }),
      /output changed before install/,
    );
    assert.deepEqual(
      await readFile(
        path.join(fixture.root, G5_L5_STATIC_CANDIDATE_OUTPUTS[0]),
      ),
      original.get(G5_L5_STATIC_CANDIDATE_OUTPUTS[0]),
    );
    assert.deepEqual(await readFile(secondPath), foreign);
    assert.deepEqual(
      (await readdir(path.join(fixture.root, "reports"))).sort(),
      G5_L5_STATIC_CANDIDATE_OUTPUTS
        .map((relativePath) => path.basename(relativePath))
        .sort(),
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
