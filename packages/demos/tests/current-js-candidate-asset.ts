import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

import {resolveCurrentJsCandidateAssetBinding} from
  "../../../scripts/current-js-candidate-asset-binding.mjs";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

export async function readCurrentJsCandidateAsset(
  logicalPathOrDirectory: string,
  name?: string,
): Promise<Buffer> {
  const logicalPath = name === undefined
    ? logicalPathOrDirectory
    : `${logicalPathOrDirectory.replace(/\/$/u, "")}/${name}`;
  const binding = await resolveCurrentJsCandidateAssetBinding({
    projectRoot,
    logicalPath,
    expectedBytes: undefined,
    expectedSha256: undefined,
  });
  assert.ok(binding, `${logicalPath}: missing Current-JS candidate profile binding`);
  assert.equal(
    binding.kind,
    "candidate-profile",
    `${logicalPath}: candidate test must not fall back to a public mirror`,
  );
  assert.equal(binding.profile?.authority.productionApproved, false);
  assert.equal(binding.profile?.authority.releaseEligible, false);
  assert.equal(binding.profile?.authority.published, false);
  return readFile(binding.absolutePath);
}
