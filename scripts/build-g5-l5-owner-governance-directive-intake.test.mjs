import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  atomicReplaceOrdinaryFile,
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  parseArguments,
  readG5L5OwnerGovernanceDirectiveIntake,
  readOrdinaryFileBinding,
  stableJson,
  validateG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";

function resign(receipt) {
  const copy = structuredClone(receipt);
  delete copy.receiptFingerprintSha256;
  receipt.receiptFingerprintSha256 = createHash("sha256")
    .update(stableJson(copy))
    .digest("hex");
}

test("checked-in intake is public-safe, canonical, and machine-only", async () => {
  const {receipt, binding} =
    await readG5L5OwnerGovernanceDirectiveIntake();

  assert.equal(
    binding.path,
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  );
  assert.equal(
    receipt.releaseId,
    "lesson-g05-l05-add-subtract-negative-numbers",
  );
  assert.equal(
    receipt.releaseFingerprintSha256,
    "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84",
  );
  assert.deepEqual(receipt.statementDigest, {
    language: "zh-CN",
    byteLength: 112,
    sha256:
      "616d57c45c1c1d38aa3f9ecbbdb26e62ab47a89f703970d65b9446628e4f9af1",
    exactTextStored: false,
  });
  assert.deepEqual(receipt.authorization, {
    continueMachineOnlyStaticWork: true,
    m0ExitDirectiveRecorded: true,
    m1MachineFoundationStartAuthorized: true,
    repositoryBudgetProcurementDefaultsSelected: true,
  });
  assert.equal(
    receipt.sourceBindingsAtIntake.bindingSemantics,
    "historical-at-intake-do-not-require-current-byte-identity",
  );
  assert.equal(receipt.authorityBoundary.m0ExitEffective, false);
  assert.equal(
    receipt.authorityBoundary.m1MachineOnlyEffective,
    true,
  );
  for (const field of [
    "externalSpendAuthorized",
    "procurementOrPaymentAuthorized",
    "runtimeHostOrContainmentAuthorized",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "rendererImplementationAuthorized",
    "evidencePromotionAuthorized",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) {
    assert.equal(receipt.authorityBoundary[field], false, field);
  }
  assert.deepEqual(receipt.budgetDefaultResolution, {
    currency: "USD",
    ownerSelectedRepositoryDefaults: true,
    repositoryDefinedNumericOrCycleDefaultsFound: false,
    personnelRateCeilingUsdPerHour: null,
    totalBudgetEnvelopeUsd: null,
    procurementPaymentCycle: null,
    defaultDisposition:
      "fail-closed-unset-no-spend-procurement-or-payment-authority",
    externalSpendAuthorized: false,
    procurementOrPaymentAuthorized: false,
    anySpendRequiresNewOwnerReceipt: true,
  });
  assert.equal(receipt.externalSignatureEnvelope, null);

  const serialized = stableJson(receipt);
  assert.doesNotMatch(
    serialized,
    /\/Users\/|\/Volumes\/|file:\/\/|[A-Z]:\\|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|Dr\.?\s*Peter|Peter\s+Hu|taskThreadId|threadId|ownerFullName|exactUtf8/i,
  );
  assert.equal(
    await readFile(G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH, "utf8"),
    serialized,
  );
});

test("validator rejects widening, authority promotion, and mutable values after re-fingerprinting", async () => {
  const {receipt} = await readG5L5OwnerGovernanceDirectiveIntake();
  const mutations = [
    [
      "extra field",
      (copy) => {
        copy.ownerName = "Synthetic Owner";
      },
      /identity drifted/,
    ],
    [
      "stored statement",
      (copy) => {
        copy.statementDigest.exactTextStored = true;
      },
      /statement digest/,
    ],
    [
      "statement hash",
      (copy) => {
        copy.statementDigest.sha256 = "0".repeat(64);
      },
      /statement digest/,
    ],
    [
      "M0 effective",
      (copy) => {
        copy.authorityBoundary.m0ExitEffective = true;
      },
      /authority boundary/,
    ],
    [
      "budget amount",
      (copy) => {
        copy.budgetDefaultResolution.totalBudgetEnvelopeUsd = 1;
      },
      /budget, cycle, spend, or procurement/,
    ],
    [
      "rate ceiling",
      (copy) => {
        copy.budgetDefaultResolution.personnelRateCeilingUsdPerHour =
          1;
      },
      /budget, cycle, spend, or procurement/,
    ],
    [
      "procurement cycle",
      (copy) => {
        copy.budgetDefaultResolution.procurementPaymentCycle =
          "monthly";
      },
      /budget, cycle, spend, or procurement/,
    ],
    [
      "spend",
      (copy) => {
        copy.authorityBoundary.externalSpendAuthorized = true;
      },
      /authority boundary/,
    ],
    [
      "procurement",
      (copy) => {
        copy.authorityBoundary.procurementOrPaymentAuthorized = true;
      },
      /authority boundary/,
    ],
    [
      "runtime",
      (copy) => {
        copy.authorityBoundary.originalRuntimeExecutionAuthorized =
          true;
      },
      /authority boundary/,
    ],
    [
      "Animate GUI",
      (copy) => {
        copy.authorityBoundary.animateGuiExecutionAuthorized = true;
      },
      /authority boundary/,
    ],
    [
      "implementation",
      (copy) => {
        copy.authorityBoundary.rendererImplementationAuthorized =
          true;
      },
      /authority boundary/,
    ],
    [
      "review",
      (copy) => {
        copy.authorityBoundary.humanReviewAccepted = true;
      },
      /authority boundary/,
    ],
    [
      "strict",
      (copy) => {
        copy.authorityBoundary.strictCompletionEstablished = true;
      },
      /authority boundary/,
    ],
    [
      "publication",
      (copy) => {
        copy.authorityBoundary.publicationAuthorized = true;
      },
      /authority boundary/,
    ],
    [
      "absolute source path",
      (copy) => {
        copy.sourceBindingsAtIntake.roadmap.path =
          "/private/roadmap.md";
      },
      /source binding/,
    ],
    [
      "action packet fingerprint",
      (copy) => {
        copy.sourceBindingsAtIntake
          .preAuthorizationOwnerActionPacket
          .reportFingerprintSha256 = "not-a-hash";
      },
      /action-packet fingerprint/,
    ],
    [
      "external signature",
      (copy) => {
        copy.externalSignatureEnvelope = {signature: "invented"};
      },
      /external signature/,
    ],
  ];

  for (const [label, mutate, pattern] of mutations) {
    const copy = structuredClone(receipt);
    mutate(copy);
    resign(copy);
    assert.throws(
      () => validateG5L5OwnerGovernanceDirectiveIntake(copy),
      pattern,
      label,
    );
  }

  const fingerprintMutation = structuredClone(receipt);
  fingerprintMutation.receiptFingerprintSha256 = "0".repeat(64);
  assert.throws(
    () =>
      validateG5L5OwnerGovernanceDirectiveIntake(
        fingerprintMutation,
      ),
    /receipt fingerprint/,
  );
});

test("ordinary input reader rejects symbolic links and hard links", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-owner-intake-input-"),
  );
  try {
    await writeFile(path.join(root, "ordinary.txt"), "ordinary\n");
    const ordinary = await readOrdinaryFileBinding("ordinary.txt", {
      root,
      json: false,
    });
    assert.equal(ordinary.text, "ordinary\n");

    await writeFile(path.join(root, "symlink-source.txt"), "source\n");
    await symlink(
      path.join(root, "symlink-source.txt"),
      path.join(root, "symlink.txt"),
    );
    await assert.rejects(
      () =>
        readOrdinaryFileBinding("symlink.txt", {
          root,
          json: false,
        }),
      /ordinary single-link file/,
    );

    await writeFile(path.join(root, "hard-source.txt"), "source\n");
    await link(
      path.join(root, "hard-source.txt"),
      path.join(root, "hard-alias.txt"),
    );
    await assert.rejects(
      () =>
        readOrdinaryFileBinding("hard-alias.txt", {
          root,
          json: false,
        }),
      /ordinary single-link file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("Owner directive reader and writer reject symlinked ancestor directories", async () => {
  const sandbox = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-owner-intake-ancestor-"),
  );
  const root = path.join(sandbox, "root");
  const externalInput = path.join(sandbox, "external-input");
  const externalOutput = path.join(sandbox, "external-output");
  try {
    await Promise.all([
      mkdir(root),
      mkdir(externalInput),
      mkdir(externalOutput),
    ]);
    await writeFile(path.join(externalInput, "receipt.json"), "{}\n");
    await Promise.all([
      symlink(externalInput, path.join(root, "input")),
      symlink(externalOutput, path.join(root, "output")),
    ]);

    await assert.rejects(
      readOrdinaryFileBinding("input/receipt.json", {
        root,
        json: false,
      }),
      /ancestor must be an ordinary directory/,
    );
    await assert.rejects(
      atomicReplaceOrdinaryFile(
        path.join(root, "output", "receipt.json"),
        "unsafe\n",
        {root},
      ),
      /ancestor must be an ordinary directory/,
    );
    assert.deepEqual(await readdir(externalOutput), []);
  } finally {
    await rm(sandbox, {recursive: true, force: true});
  }
});

test("atomic writer replaces an output symlink without following it", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-owner-intake-output-"),
  );
  try {
    const externalTarget = path.join(root, "external-target.txt");
    const output = path.join(root, "receipt.json");
    await writeFile(externalTarget, "unchanged\n");
    await symlink(externalTarget, output);

    await atomicReplaceOrdinaryFile(output, "safe receipt\n");

    assert.equal(
      await readFile(externalTarget, "utf8"),
      "unchanged\n",
    );
    assert.equal(await readFile(output, "utf8"), "safe receipt\n");
    assert.equal((await lstat(output)).isSymbolicLink(), false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("CLI exposes fixed build/check only", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    help: false,
  });
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    help: false,
  });
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(
    () => parseArguments(["--statement", "text"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--output", "other.json"]),
    /Unknown option/,
  );
  assert.throws(
    () => parseArguments(["--authorize-runtime"]),
    /Unknown option/,
  );
});
