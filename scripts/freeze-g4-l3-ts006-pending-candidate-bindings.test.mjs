import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, lstat, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {freezePendingCandidateBindings} from "./freeze-g4-l3-ts006-pending-candidate-bindings.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function writeBound(root, relative, content) {
  const absolute = path.join(root, relative);
  const bytes = Buffer.from(content, "utf8");
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
  return {path: portable(relative), bytes: bytes.length, sha256: sha256(bytes)};
}

async function makeFixture({language = "es", candidateCount = 2} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ts006-freeze-test-"));
  const uuid = language === "es" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222";
  const sessionId = `ts006-${language}-${uuid}`;
  const sessionRoot = path.join(root, "artifacts", "full-frame", "g4-l3", sessionId);
  await mkdir(path.join(sessionRoot, "evidence", "pending-candidates"), {recursive: true});

  const schedule = await writeBound(root, "reports/schedule.json", "schedule-v1\n");
  const protocol = await writeBound(root, "reports/protocol.json", "protocol-v1\n");
  const coverage = await writeBound(root, "migrations/course/evidence/coverage.json", "coverage-v1\n");
  const nested = await writeBound(root, "work/bindings/nested.json", "nested-v1\n");
  const kit = {
    schemaVersion: 1,
    animationId: "course-g04-l03-ts-006",
    language,
    sourceBindings: {
      scheduleCandidate: schedule,
      sessionProtocol: protocol,
      coverage,
      supplemental: {nested},
    },
  };
  const kitBinding = await writeBound(root, `work/kits/${language}/kit-manifest.json`, `${JSON.stringify(kit, null, 2)}\n`);
  const indexBinding = await writeBound(root, "migrations/trace-index.json", "trace-index-v1\n");
  const rootSpec = await writeBound(root, `migrations/spec-root-${language}.json`, "root-spec-v1\n");
  const spriteSpec = await writeBound(root, `migrations/spec-sprite-${language}.json`, "sprite-spec-v1\n");

  const candidatePaths = [];
  for (let index = 1; index <= candidateCount; index += 1) {
    const name = `capture-${language}-${String(index).padStart(3, "0")}.pending-candidate.json`;
    const relative = portable(path.relative(root, path.join(sessionRoot, "evidence", "pending-candidates", name)));
    const candidate = {
      schemaVersion: 1,
      animationId: "course-g04-l03-ts-006",
      sessionId,
      language,
      status: "pending-candidate-unresolved-trace-specifications",
      sourceBindings: {
        sessionKit: kitBinding,
        traceSpecIndex: indexBinding,
        traceSpecifications: [
          {
            requirementId: `req:root:lesson-shell-natural-entry:${language}`,
            traceId: `trace:root:lesson-shell-natural-entry:${language}:seed-0`,
            traceSpec: rootSpec,
          },
          {
            requirementId: `req:sprite-23:lesson-shell-natural-entry:${language}`,
            traceId: `trace:sprite-23:lesson-shell-natural-entry:${language}:seed-0`,
            traceSpec: spriteSpec,
          },
        ],
      },
    };
    await writeBound(root, relative, `${JSON.stringify(candidate, null, 2)}\n`);
    candidatePaths.push(path.join(root, relative));
  }
  return {root, sessionId, sessionRoot, kitBinding, indexBinding, rootSpec, candidatePaths};
}

async function cleanupFixture(root) {
  await rm(root, {recursive: true, force: true});
}

test("freezes every candidate, trace/session-kit binding, and transitive kit source binding without replacement", async (t) => {
  const fixture = await makeFixture();
  t.after(() => cleanupFixture(fixture.root));

  const created = await freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId});
  assert.equal(created.candidateCount, 2);
  assert.equal(created.copiedBindingCount, 10);
  assert.match(created.receiptSha256, /^[a-f0-9]{64}$/);

  const receiptPath = path.join(fixture.root, created.receipt);
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(receipt.candidates.length, 2);
  assert.equal(receipt.copiedBindings.length, 10);
  assert.equal(receipt.strictAcceptanceEffect, false);
  const kitRow = receipt.copiedBindings.find(({originalPath}) => originalPath === fixture.kitBinding.path);
  assert.equal(kitRow.referencedBy.filter((value) => value.endsWith(":session-kit")).length, 2);
  for (const row of receipt.copiedBindings) {
    const metadata = await lstat(path.join(fixture.root, row.frozenPath), {bigint: true});
    assert.equal(Number(metadata.mode & 0o777n), 0o444);
  }
  assert.equal((await freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId, check: true})).check, "pass");

  await assert.rejects(
    freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId}),
    /EEXIST|exist/i,
  );

  // Mutable working files may later be regenerated; the check follows the frozen transitive chain.
  await writeFile(path.join(fixture.root, fixture.kitBinding.path), "regenerated-kit\n");
  await writeFile(path.join(fixture.root, fixture.rootSpec.path), "regenerated-spec\n");
  assert.equal((await freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId, check: true})).check, "pass");
});

test("fails closed on live source drift before the freeze", async (t) => {
  const fixture = await makeFixture({language: "en", candidateCount: 1});
  t.after(() => cleanupFixture(fixture.root));
  await writeFile(path.join(fixture.root, fixture.indexBinding.path), "drifted-trace-index\n");
  await assert.rejects(
    freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId}),
    /byte length drifted|SHA-256 drifted/,
  );
});

test("rejects path escape and symbolic-link sources", async (t) => {
  const escape = await makeFixture({language: "en", candidateCount: 1});
  t.after(() => cleanupFixture(escape.root));
  const candidatePath = escape.candidatePaths[0];
  const candidate = JSON.parse(await readFile(candidatePath, "utf8"));
  candidate.sourceBindings.traceSpecIndex.path = "../outside.json";
  await writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);
  await assert.rejects(
    freezePendingCandidateBindings({root: escape.root, sessionId: escape.sessionId}),
    /normalized project-relative path|escapes/,
  );

  const linked = await makeFixture({language: "en", candidateCount: 1});
  t.after(() => cleanupFixture(linked.root));
  const indexPath = path.join(linked.root, linked.indexBinding.path);
  const external = path.join(linked.root, "outside-index.json");
  await writeFile(external, "trace-index-v1\n");
  await unlink(indexPath);
  await symlink(path.relative(path.dirname(indexPath), external), indexPath);
  await assert.rejects(
    freezePendingCandidateBindings({root: linked.root, sessionId: linked.sessionId}),
    /symbolic-link/,
  );
});

test("detects frozen-copy drift during check mode", async (t) => {
  const fixture = await makeFixture({language: "en", candidateCount: 1});
  t.after(() => cleanupFixture(fixture.root));
  const created = await freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId});
  const receipt = JSON.parse(await readFile(path.join(fixture.root, created.receipt), "utf8"));
  const target = path.join(fixture.root, receipt.copiedBindings.find(({originalPath}) => originalPath === fixture.indexBinding.path).frozenPath);
  await chmod(target, 0o644);
  await writeFile(target, "tampered-frozen-index\n");
  await assert.rejects(
    freezePendingCandidateBindings({root: fixture.root, sessionId: fixture.sessionId, check: true}),
    /frozen copy bytes or SHA-256 drifted/,
  );
});
