import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  checkG5L4SourceWorkspacesCurrent,
} from "./check-g5-l4-source-workspaces-current.mjs";

test("checks the frozen scope and current candidate-aware workspace report without writing", async () => {
  const paths = [
    "reports/g5-l4-source-scope-freeze.json",
    "reports/g5-l4-source-scope-freeze.md",
    "reports/g5-l4-workspace-readiness.json",
    "reports/g5-l4-workspace-readiness.md",
  ];
  const before = await Promise.all(paths.map((candidate) => readFile(candidate)));
  const result = await checkG5L4SourceWorkspacesCurrent();
  const after = await Promise.all(paths.map((candidate) => readFile(candidate)));

  assert.equal(result.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(result.memberCount, 55);
  assert.equal(result.draftValidationPassCount, 55);
  assert.equal(result.strictComplete, 0);
  assert.equal(result.published, 0);
  assert.deepEqual(after, before);
});
