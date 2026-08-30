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
    deploymentE2eRunner: "apps/web/scripts/run-deployment-e2e.mjs",
    deploymentSafeTestRunner: "apps/web/scripts/run-deployment-safe-tests.mjs",
    identityDoc: "docs/CI_CD_SERVICE_IDENTITY.md",
    ignore: ".vercelignore",
    postflightWorkflow: ".github/workflows/vercel-production-postflight.yml",
    runner: "scripts/helpmath-vercel-ci.mjs",
    webPackageJson: "apps/web/package.json",
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
  assert.equal(result.summary.releaseCheckSeparateFromWorkbench, true);
});

test("static verifier requires a source-independent release check", async () => {
  const base = await checkedInDocuments();
  const withoutReleaseJob = base.ciWorkflow.replace(
    /  cicd-service-identity:\n[\s\S]*?(?=\n  workbench:\n)/u,
    "",
  );
  assert.throws(
    () => validateServiceIdentityDocuments({...base, ciWorkflow: withoutReleaseJob}),
    /must isolate the service-identity job/u,
  );
});

test("static verifier requires an exact event-to-public-deployment evidence join", async () => {
  const base = await checkedInDocuments();
  const withoutObservedIdentity = base.core.replace(
    "observedDomainDeploymentIdentity",
    "removedObservedDomainDeploymentIdentity",
  );
  assert.throws(
    () => validateServiceIdentityDocuments({...base, core: withoutObservedIdentity}),
    /omitted observedDomainDeploymentIdentity/u,
  );
});

test("static verifier requires the deployment-safe Site workspace test runner", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      deploymentSafeTestRunner: base.deploymentSafeTestRunner.replaceAll(
        "tests/private-preview-deployment-assets.test.ts",
        "tests/removed-deployment-asset.test.ts",
      ),
    }),
    /required deployment tests must match the exact approved list/u,
  );
});

test("static verifier parses the exact web package deployment script", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      webPackageJson: base.webPackageJson.replace(
        "node scripts/run-deployment-safe-tests.mjs",
        "node scripts/run-all-tests.mjs",
      ),
    }),
    /apps\/web\/package\.json test:deployment must invoke the exact deployment-safe runner/u,
  );
});

test("static verifier parses the exact web package deployment E2E script", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      webPackageJson: base.webPackageJson.replace(
        "node scripts/run-deployment-e2e.mjs",
        "playwright test",
      ),
    }),
    /apps\/web\/package\.json test:e2e:deployment must invoke the exact deployment E2E runner/u,
  );
});

test("static verifier parses the exact Site workspace CI invocation", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      ciWorkflow: base.ciWorkflow.replace(
        "run: npm run test:deployment",
        "run: npm test",
      ),
    }),
    /Site workspace Test site step must invoke npm run test:deployment exactly/u,
  );
});

test("static verifier rejects specialized E2E commands in the deployment Site job", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      ciWorkflow: base.ciWorkflow.replace(
        "run: npm run test:e2e:deployment",
        "run: npm run test:e2e:nova-full-stack --workspace @helpmath/web",
      ),
    }),
    /Site workspace must invoke the exact deployment E2E runner/u,
  );
});

test("static verifier rejects an extra deployment-safe file filter", async () => {
  const base = await checkedInDocuments();
  assert.throws(
    () => validateServiceIdentityDocuments({
      ...base,
      deploymentSafeTestRunner: base.deploymentSafeTestRunner.replace(
        "const selectedTestPaths = allTestPaths.filter((relativePath) => !excluded.has(relativePath));",
        "const selectedTestPaths = allTestPaths.filter((relativePath) => !excluded.has(relativePath)).filter(() => true);",
      ),
    }),
    /exactly the approved file exclusion filter/u,
  );
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
