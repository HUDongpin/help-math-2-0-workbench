import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  G5_L5_RELEASE_ID,
  buildG5L5StaticPlanningAudits,
  loadG5L5ReleaseIds,
  parseArguments,
} from "./build-g5-l5-static-planning-audits.mjs";

test("selects the exact ordered 57-member G5 L5 atomic release", async () => {
  const ids = await loadG5L5ReleaseIds();
  assert.equal(G5_L5_RELEASE_ID, "lesson-g05-l05-add-subtract-negative-numbers");
  assert.equal(ids.length, 57);
  assert.equal(new Set(ids).size, 57);
  assert.equal(ids[0], "course-g05-l05-ir-001-664ab764");
  assert.equal(ids.at(-1), "shell-course-g05-l05-index-local");
});

test("CLI exposes build/check only", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--run-flash"]), /Unknown option/);
  assert.throws(() => parseArguments(["--publish"]), /Unknown option/);
});

test("check preserves the exact proof-aware 57 / 696 / 351 / 185 contract", async () => {
  const result = await buildG5L5StaticPlanningAudits({check: true});
  assert.equal(result.mode, "check");
  assert.equal(result.scenarioInventoryCount, 57);
  assert.equal(result.frameDomainDispositionCount, 57);
  assert.equal(result.declaredRootFrameDomainCount, 57);
  assert.equal(result.evidenceBoundCompositeFrameDomainCount, 696);
  assert.equal(result.unresolvedFrameDomainCount, 351);
  assert.equal(result.excludedNotProvenTimelineCount, 185);
});

test("release selection rejects a symlinked catalog ancestor", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-planning-"),
  );
  try {
    await symlink(path.join(process.cwd(), "catalog"), path.join(root, "catalog"));
    await assert.rejects(
      loadG5L5ReleaseIds({root}),
      /ancestor must be an ordinary directory/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("second-phase failure restores the complete 114-output preimage", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-planning-rollback-"),
  );
  try {
    await mkdir(path.join(root, "catalog"), {recursive: true});
    await copyFile(
      path.join(process.cwd(), "catalog", "lesson-releases.json"),
      path.join(root, "catalog", "lesson-releases.json"),
    );
    const ids = await loadG5L5ReleaseIds({root});
    const existingId = ids[0];
    const existingScenario = path.join(
      root,
      "migrations",
      existingId,
      "audit",
      "scenario-inventory.json",
    );
    const sentinel = Buffer.from("original scenario bytes\n");
    for (const id of ids) {
      await mkdir(
        path.join(root, "migrations", id, "audit"),
        {recursive: true},
      );
    }
    await writeFile(existingScenario, sentinel);

    await assert.rejects(
      buildG5L5StaticPlanningAudits({
        root,
        scenarioBuilder: async ({ids: selected}) => {
          for (const id of selected) {
            await writeFile(
              path.join(
                root,
                "migrations",
                id,
                "audit",
                "scenario-inventory.json",
              ),
              `new:${id}\n`,
            );
          }
          return selected.map((id) => ({id, action: "written"}));
        },
        frameDomainBuilder: async () => {
          throw new Error("injected frame-domain phase failure");
        },
      }),
      /injected frame-domain phase failure/,
    );

    assert.deepEqual(await readFile(existingScenario), sentinel);
    for (const id of ids.slice(1)) {
      await assert.rejects(
        readFile(
          path.join(
            root,
            "migrations",
            id,
            "audit",
            "scenario-inventory.json",
          ),
        ),
        {code: "ENOENT"},
      );
    }
    for (const id of ids) {
      const entries = await readdir(
        path.join(root, "migrations", id, "audit"),
      );
      assert.equal(
        entries.some(
          (name) =>
            name.includes(".rollback") || name.includes(".phase"),
        ),
        false,
      );
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
