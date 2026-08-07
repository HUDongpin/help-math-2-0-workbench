import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  MISSING_ORIGINAL_AUDIO_EXCEPTION_ATTESTATION,
  MISSING_ORIGINAL_AUDIO_EXCEPTION_RELATIVE_PATH,
  buildMissingOriginalAudioExceptionTemplate,
  missingOriginalAudioExceptionUsage,
  parseMissingOriginalAudioExceptionArguments,
  runMissingOriginalAudioExceptionCli,
  scaffoldMissingOriginalAudioException,
  validateMissingOriginalAudioExceptionWorkspace,
} from "./missing-original-audio-exception.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "missing-original-audio-exception-"));
  const animationId = "keyterm-audio-fixture";
  const migrationsRoot = path.join(root, "migrations");
  const workspace = path.join(migrationsRoot, animationId);
  await mkdir(path.join(workspace, "audit"), {recursive: true});
  await mkdir(path.join(workspace, "evidence"), {recursive: true});

  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf";
  const hostRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf";
  const missingRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3";
  const sourceBytes = Buffer.from("fixture source SWF\n");
  const hostBytes = Buffer.from("fixture original host SWF\n");
  await mkdir(path.dirname(path.join(root, sourceRelative)), {recursive: true});
  await mkdir(path.dirname(path.join(root, hostRelative)), {recursive: true});
  await mkdir(path.dirname(path.join(root, missingRelative)), {recursive: true});
  await writeFile(path.join(root, sourceRelative), sourceBytes);
  await writeFile(path.join(root, hostRelative), hostBytes);

  const manifest = {
    animationId,
    source: {swf: sourceRelative, swfSha256: digest(sourceBytes)},
    classification: {collection: "keyterm", section: null},
    audio: {required: true, languages: ["en", "es"], cues: []},
  };
  const audit = {
    schemaVersion: 2,
    animationId,
    source: {
      swf: sourceRelative,
      expectedSha256: digest(sourceBytes),
      observedSha256: digest(sourceBytes),
      hashMatches: true,
    },
    authority: {
      hostScript: {
        sourceFile: hostRelative,
        sha256: digest(hostBytes),
        combinedAudioRelevantScriptsSha256: digest("keyterm host audio script projection"),
        conventions: {
          keyterm: {
            verified: true,
            evidenceScript: "scripts/frame_35/DoAction.as",
            finding: "The key-term host constructs matching EAD and SAD paths.",
          },
        },
      },
    },
    externalAudio: {
      exactAssociations: [],
      expectedButMissing: [{
        sourceFile: missingRelative,
        language: "es",
        status: "missing-source",
        evidence: "The verified host route requires this exact SAD counterpart and the preserved path is absent.",
      }],
      missingExpectedCount: 1,
    },
    acceptance: {structurallyAudited: true},
  };
  const manifestPath = path.join(workspace, "migration.json");
  const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  await writeJson(manifestPath, manifest);
  await writeJson(auditPath, audit);
  return {
    root,
    projectRoot: root,
    animationId,
    migrationsRoot,
    workspace,
    sourceRelative,
    hostRelative,
    missingRelative,
    sourceBytes,
    hostBytes,
    manifest,
    audit,
    manifestPath,
    auditPath,
    recordPath: path.join(workspace, MISSING_ORIGINAL_AUDIO_EXCEPTION_RELATIVE_PATH),
  };
}

function accept(record, fullName = "Named Human Owner") {
  record.status = "accepted-absence";
  record.claims.acceptsOnlyOriginalSourceAbsence = true;
  record.review = {
    decision: "accepted-absence",
    reviewer: {
      kind: "human",
      authority: "owner",
      fullName,
      role: "HELP Math content owner",
      organizationOrOwnerId: "HELP-MATH-OWNER-01",
      contact: "owner@example.test",
    },
    attestation: MISSING_ORIGINAL_AUDIO_EXCEPTION_ATTESTATION,
    signedAt: "2020-01-02T03:04:05.000Z",
    notes: "Accept exact source absence only.",
  };
  return record;
}

async function acceptedFixture() {
  const value = await fixture();
  const record = accept(await buildMissingOriginalAudioExceptionTemplate(value));
  await writeJson(value.recordPath, record);
  return {...value, record};
}

test("CLI makes --check an explicit read-only validation mode", () => {
  const parsed = parseMissingOriginalAudioExceptionArguments([
    "--id", "keyterm-audio-fixture",
    "--migrations", "./fixtures",
    "--check",
  ]);
  assert.equal(parsed.id, "keyterm-audio-fixture");
  assert.equal(parsed.migrationsRoot, path.resolve("./fixtures"));
  assert.equal(parsed.check, true);
  assert.match(missingOriginalAudioExceptionUsage(), /--check\s+Read-only validation/);
  assert.match(missingOriginalAudioExceptionUsage(), /do not attest that anyone listened/);
  assert.throws(() => parseMissingOriginalAudioExceptionArguments(["--id"]), /requires an animation ID/);
  assert.throws(() => parseMissingOriginalAudioExceptionArguments(["--id", "../escape"]), /safe migration directory/);
  assert.throws(() => parseMissingOriginalAudioExceptionArguments(["--migrations"]), /requires a directory/);
  assert.throws(() => parseMissingOriginalAudioExceptionArguments(["--write"]), /Unknown option/);
});

test("scaffolds one unsigned pending record without changing migration or audit evidence", async () => {
  const value = await fixture();
  try {
    const manifestBefore = await readFile(value.manifestPath);
    const auditBefore = await readFile(value.auditPath);
    const result = await scaffoldMissingOriginalAudioException(value);
    assert.equal(result.record.status, "pending");
    assert.equal(result.record.review.decision, "pending");
    assert.equal(result.record.review.reviewer.fullName, "");
    assert.equal(result.record.missingCues.length, 1);
    assert.equal(result.record.missingCues[0].sourceFile, value.missingRelative);
    assert.equal(result.record.missingCues[0].language, "es");
    assert.equal(result.record.missingCues[0].routingConventionId, "keyterm");
    assert.equal(result.record.missingCues[0].replacement.disposition, "none");
    assert.equal(result.record.claims.originalAudioListeningAccepted, false);
    assert.equal(result.record.claims.timingOrSynchronizationAccepted, false);
    assert.equal(result.record.claims.migrationCompletionAccepted, false);
    assert.deepEqual(await readFile(value.manifestPath), manifestBefore);
    assert.deepEqual(await readFile(value.auditPath), auditBefore);
    await assert.rejects(scaffoldMissingOriginalAudioException(value), /never overwrite an owner review record/);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(errors.some((error) => error.includes("not accepted-absence")), errors.join("\n"));
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("accepts only a current hash-bound named-human source-absence decision", async () => {
  const value = await acceptedFixture();
  try {
    assert.deepEqual(await validateMissingOriginalAudioExceptionWorkspace(value), []);
    const before = await readFile(value.recordPath);
    const result = await runMissingOriginalAudioExceptionCli({
      projectRoot: value.projectRoot,
      options: {
        id: value.animationId,
        migrationsRoot: value.migrationsRoot,
        check: true,
        help: false,
      },
    });
    assert.equal(result.mode, "check");
    assert.deepEqual(await readFile(value.recordPath), before, "--check changed the review record");
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("acceptance/status edits do not stale the stable manifest projection, but audio identity edits do", async () => {
  const value = await acceptedFixture();
  try {
    value.manifest.status = "complete";
    value.manifest.acceptance = {
      humanVisualReview: {status: "accepted"},
      ownerReview: {status: "accepted"},
    };
    value.manifest.audio.acceptance = {status: "accepted-absence"};
    await writeJson(value.manifestPath, value.manifest);
    assert.deepEqual(
      await validateMissingOriginalAudioExceptionWorkspace(value),
      [],
      "acceptance/status-only changes invalidated the source/audio technical contract"
    );

    value.manifest.audio.languages = ["en"];
    await writeJson(value.manifestPath, value.manifest);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(
      errors.some((error) => error.includes("technical-manifest projection binding is malformed or stale")),
      errors.join("\n")
    );
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("rejects stale machine-audit, source-SWF, and host-routing hashes", async (t) => {
  const cases = [
    ["machine audit", async (value) => {
      value.audit.generatedBy = "changed";
      await writeJson(value.auditPath, value.audit);
    }, "Machine audio audit binding SHA-256 is stale"],
    ["source SWF", async (value) => {
      await writeFile(path.join(value.root, value.sourceRelative), "tampered source\n");
    }, "Source SWF hash differs"],
    ["host-routing source", async (value) => {
      await writeFile(path.join(value.root, value.hostRelative), "tampered host\n");
    }, "Host-routing source hash is stale"],
  ];
  for (const [label, mutate, expected] of cases) {
    await t.test(label, async () => {
      const value = await acceptedFixture();
      try {
        await mutate(value);
        const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
        assert.ok(errors.some((error) => error.includes(expected)), errors.join("\n"));
      } finally {
        await rm(value.root, {recursive: true, force: true});
      }
    });
  }
});

test("rejects path escapes, symlinked evidence, symlinked missing paths, and a source that appears later", async (t) => {
  await t.test("path escape", async () => {
    const value = await acceptedFixture();
    try {
      value.audit.externalAudio.expectedButMissing[0].sourceFile = "../outside.mp3";
      await writeJson(value.auditPath, value.audit);
      const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
      assert.ok(errors.some((error) => error.includes("safe exact missing source path")), errors.join("\n"));
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("symlinked host evidence", async () => {
    const value = await acceptedFixture();
    try {
      const hostPath = path.join(value.root, value.hostRelative);
      const outside = path.join(value.root, "outside-host.swf");
      await writeFile(outside, value.hostBytes);
      await unlink(hostPath);
      await symlink(outside, hostPath);
      const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
      assert.ok(errors.some((error) => error.includes("Host-routing source path")), errors.join("\n"));
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("symlinked machine-audit input cannot be scaffolded", async () => {
    const value = await fixture();
    try {
      const auditPath = value.auditPath;
      const outside = path.join(value.root, "outside-audio-audit.json");
      await writeJson(outside, value.audit);
      await unlink(auditPath);
      await symlink(outside, auditPath);
      await assert.rejects(
        buildMissingOriginalAudioExceptionTemplate(value),
        /contains a symlink/
      );
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("symlinked evidence output directory cannot redirect scaffolding", async () => {
    const value = await fixture();
    try {
      const evidenceDirectory = path.join(value.workspace, "evidence");
      const outside = path.join(value.root, "outside-evidence");
      await mkdir(outside);
      await rm(evidenceDirectory, {recursive: true});
      await symlink(outside, evidenceDirectory);
      await assert.rejects(
        scaffoldMissingOriginalAudioException(value),
        /non-symlink evidence directory/
      );
      await assert.rejects(
        readFile(path.join(outside, "missing-original-audio-exception.json")),
        {code: "ENOENT"}
      );
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("symlinked missing path", async () => {
    const value = await acceptedFixture();
    try {
      const outside = path.join(value.root, "outside-audio.mp3");
      await writeFile(outside, "not original audio\n");
      await symlink(outside, path.join(value.root, value.missingRelative));
      const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
      assert.ok(errors.some((error) => error.includes("unsafe or contains a symlink")), errors.join("\n"));
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("formerly missing source now exists", async () => {
    const value = await acceptedFixture();
    try {
      await writeFile(path.join(value.root, value.missingRelative), "newly supplied original candidate\n");
      const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
      assert.ok(errors.some((error) => error.includes("now exists")), errors.join("\n"));
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });
});

test("rejects extra fields and any synthesized or replacement audio represented as original", async () => {
  const value = await acceptedFixture();
  try {
    value.record.missingCues[0].replacement = {
      disposition: "synthesized",
      acceptedAsOriginal: true,
      file: "replacement.mp3",
    };
    value.record.review.approvedByAutomation = true;
    await writeJson(value.recordPath, value.record);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(errors.some((error) => error.includes("missing or extra fields")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("cannot be represented as original")), errors.join("\n"));
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("rejects automated reviewer identities and claims of listening, synchronization, parity, or completion", async () => {
  const value = await acceptedFixture();
  try {
    value.record.review.reviewer.fullName = "Codex AI Agent";
    value.record.claims.originalAudioListeningAccepted = true;
    value.record.claims.timingOrSynchronizationAccepted = true;
    value.record.claims.behavioralParityAccepted = true;
    value.record.claims.migrationCompletionAccepted = true;
    await writeJson(value.recordPath, value.record);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(errors.some((error) => error.includes("self-identifies as automation")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("leave listening, synchronization, parity, and completion unaccepted")), errors.join("\n"));
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("rejects incomplete/future owner review and altered attestation", async () => {
  const value = await acceptedFixture();
  try {
    value.record.review.reviewer.organizationOrOwnerId = "";
    value.record.review.attestation = "I approve everything.";
    value.record.review.signedAt = "2999-01-01T00:00:00.000Z";
    await writeJson(value.recordPath, value.record);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(errors.some((error) => error.includes("complete named-human owner")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("attestation is missing or altered")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("cannot be in the future")), errors.join("\n"));
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("rejects non-string or automation-contact reviewer identities and timezone-less signatures", async () => {
  const value = await acceptedFixture();
  try {
    value.record.review.reviewer.fullName = {display: "Not a string identity"};
    value.record.review.reviewer.contact = "codex-bot@example.test";
    value.record.review.signedAt = "2020-01-02T03:04:05";
    await writeJson(value.recordPath, value.record);
    const errors = await validateMissingOriginalAudioExceptionWorkspace(value);
    assert.ok(errors.some((error) => error.includes("complete named-human owner")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("self-identifies as automation")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("explicit timezone")), errors.join("\n"));
  } finally {
    await rm(value.root, {recursive: true, force: true});
  }
});

test("fails closed when machine evidence has no missing cue or no verified routing convention", async (t) => {
  await t.test("no missing cue", async () => {
    const value = await fixture();
    try {
      value.audit.externalAudio.expectedButMissing = [];
      value.audit.externalAudio.missingExpectedCount = 0;
      await writeJson(value.auditPath, value.audit);
      await assert.rejects(
        buildMissingOriginalAudioExceptionTemplate(value),
        /missing-source count is empty/
      );
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("no verified route", async () => {
    const value = await fixture();
    try {
      value.audit.authority.hostScript.conventions.keyterm.verified = false;
      await writeJson(value.auditPath, value.audit);
      await assert.rejects(
        buildMissingOriginalAudioExceptionTemplate(value),
        /host-routing evidence is incomplete/
      );
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });

  await t.test("malformed or duplicate exact cue identity", async () => {
    const value = await fixture();
    try {
      value.audit.externalAudio.expectedButMissing = [
        {
          ...value.audit.externalAudio.expectedButMissing[0],
          expectedPathId: 42,
        },
        {
          ...value.audit.externalAudio.expectedButMissing[0],
          expectedPathId: 42,
        },
      ];
      value.audit.externalAudio.missingExpectedCount = 2;
      await writeJson(value.auditPath, value.audit);
      await assert.rejects(
        buildMissingOriginalAudioExceptionTemplate(value),
        /safe exact missing source path, language, status, and machine rationale/
      );

      value.audit.externalAudio.expectedButMissing =
        value.audit.externalAudio.expectedButMissing.map((item) => ({
          ...item,
          expectedPathId: "duplicate-cue",
        }));
      await writeJson(value.auditPath, value.audit);
      await assert.rejects(
        buildMissingOriginalAudioExceptionTemplate(value),
        /duplicates missing cueId duplicate-cue/
      );
    } finally {
      await rm(value.root, {recursive: true, force: true});
    }
  });
});

test("JSON schema closes every authority-bearing object against extra fields", async () => {
  const schema = JSON.parse(
    await readFile(new URL("../schemas/missing-original-audio-exception.schema.json", import.meta.url), "utf8")
  );
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.bindings.additionalProperties, false);
  assert.equal(schema.properties.bindings.properties.migrationManifest.additionalProperties, false);
  assert.equal(schema.properties.bindings.properties.hostRoutingEvidence.additionalProperties, false);
  assert.equal(schema.properties.bindings.properties.missingCueEvidence.additionalProperties, false);
  assert.equal(schema.properties.missingCues.items.additionalProperties, false);
  assert.equal(schema.properties.missingCues.items.properties.replacement.additionalProperties, false);
  assert.equal(schema.properties.claims.additionalProperties, false);
  assert.equal(schema.properties.review.additionalProperties, false);
  assert.equal(schema.properties.review.properties.reviewer.additionalProperties, false);
});
