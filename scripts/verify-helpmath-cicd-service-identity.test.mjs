import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {
  validateServiceIdentityDocuments,
  verifyHelpmathCicdServiceIdentity,
} from "./verify-helpmath-cicd-service-identity.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function checkedInDocuments() {
  const files = {
    candidateWorkflow: ".github/workflows/vercel-production-smoke.yml",
    ciWorkflow: ".github/workflows/ci.yml",
    core: "scripts/lib/helpmath-vercel-ci.mjs",
    deploymentDoc: "docs/DEPLOYMENT.md",
    identityDoc: "docs/CI_CD_SERVICE_IDENTITY.md",
    ignore: ".vercelignore",
    postflightWorkflow: ".github/workflows/vercel-production-postflight.yml",
    runner: "scripts/helpmath-vercel-ci.mjs",
  };
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, relative]) => [
    key,
    await readFile(path.join(projectRoot, relative), "utf8"),
  ])));
}

test("checked-in service identity package is secretless and activation-gated", async () => {
  const result = await verifyHelpmathCicdServiceIdentity(projectRoot);
  assert.equal(result.policy.status, "prepared-not-activated");
  assert.equal(result.summary.storedProviderSecrets, 0);
  assert.equal(result.summary.vercelControlPlaneTokens, 0);
  assert.equal(result.summary.trustedOidcHeader, true);
  assert.equal(result.summary.dispatchOriginBound, true);
  assert.equal(result.summary.immutableGithubIdentity, true);
});

test("static verifier rejects a Vercel token fallback", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({...base, candidateWorkflow: `${base.candidateWorkflow} VERCEL_TOKEN`}),
    /must not use a Vercel token/u,
  );
});

test("static verifier rejects a stored GitHub secret and a promotion CLI", async () => {
  const documents = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...documents,
      candidateWorkflow: `${documents.candidateWorkflow}\nrun: \${{ secrets.DEPLOY_TOKEN }}`,
    }),
    /stored GitHub secrets/u,
  );
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...documents,
      candidateWorkflow: `${documents.candidateWorkflow}\nrun: vercel promote production`,
    }),
    /must not invoke a Vercel mutation CLI/u,
  );
});
